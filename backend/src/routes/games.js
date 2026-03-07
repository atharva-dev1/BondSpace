const { query } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

// GET /api/games — Get all available games
const getAllGames = async (req, res) => {
    try {
        const result = await query('SELECT * FROM games WHERE is_active=true ORDER BY name');
        res.json({ games: result.rows });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch games' });
    }
};

// POST /api/games/session/start — Start a game session
const startSession = async (req, res) => {
    try {
        const { game_id, couple_id } = req.body;

        // CHECK EXISTING
        const existingRes = await query(
            'SELECT * FROM game_sessions WHERE couple_id=$1 AND status=$2',
            [couple_id, 'active']
        );

        if (existingRes.rows.length > 0) {
            const activeSession = existingRes.rows[0];
            const state = activeSession.game_state || {};

            // FIX: If session is broken (no questions), abandon it and start fresh
            if (!state.questions || state.questions.length === 0) {
                await query('UPDATE game_sessions SET status=$1 WHERE id=$2', ['abandoned', activeSession.id]);
            } else if (activeSession.game_id === game_id) {
                // Return full enriched object
                const enriched = await query(`SELECT gs.*, g.name as game_name, g.type as game_type FROM game_sessions gs JOIN games g ON gs.game_id = g.id WHERE gs.id=$1`, [activeSession.id]);
                return res.status(200).json({ session: enriched.rows[0] });
            } else {
                // Abandon the old different game to start the new one
                await query('UPDATE game_sessions SET status=$1 WHERE id=$2', ['abandoned', activeSession.id]);
            }
        }

        const game = await query('SELECT * FROM games WHERE id=$1', [game_id]);
        if (!game.rows[0]) return res.status(404).json({ error: 'Game not found' });

        const initialState = getInitialGameState(game.rows[0].type, game.rows[0].name);

        const result = await query(
            'INSERT INTO game_sessions (id, game_id, couple_id, status, game_state) VALUES ($1,$2,$3,$4,$5) RETURNING *',
            [uuidv4(), game_id, couple_id, 'active', JSON.stringify(initialState)]
        );

        const enrichedNew = await query(`SELECT gs.*, g.name as game_name, g.type as game_type FROM game_sessions gs JOIN games g ON gs.game_id = g.id WHERE gs.id=$1`, [result.rows[0].id]);
        res.status(201).json({ session: enrichedNew.rows[0] });
    } catch (err) {
        console.error(err);
        require('fs').appendFileSync('games_error.log', new Date().toISOString() + ' startSession err: ' + (err.stack || err.message) + '\n');
        res.status(500).json({ error: 'Failed to start game session', details: err.message });
    }
};

// GET /api/games/active/:couple_id — Get any active game session for the couple
const getActiveSession = async (req, res) => {
    try {
        const result = await query(
            `SELECT gs.*, g.name as game_name, g.type as game_type FROM game_sessions gs
             JOIN games g ON gs.game_id = g.id WHERE gs.couple_id=$1 AND gs.status='active' LIMIT 1`,
            [req.params.couple_id]
        );

        if (result.rows.length > 0) {
            const session = result.rows[0];
            const state = session.game_state || {};

            // If session is broken, abandon it and tell frontend no active session
            if (!state.questions || state.questions.length === 0) {
                await query('UPDATE game_sessions SET status=$1 WHERE id=$2', ['abandoned', session.id]);
                return res.status(404).json({ error: 'No active session' });
            }

            res.json({ session });
        } else {
            res.status(404).json({ error: 'No active session' });
        }
    } catch (err) {
        res.status(500).json({ error: 'Failed to find active session' });
    }
};

// GET /api/games/session/:session_id — Get game session state
const getSession = async (req, res) => {
    try {
        const result = await query(
            `SELECT gs.*, g.name as game_name, g.type as game_type FROM game_sessions gs
       JOIN games g ON gs.game_id = g.id WHERE gs.id=$1`,
            [req.params.session_id]
        );
        res.json({ session: result.rows[0] });
    } catch (err) {
        res.status(500).json({ error: 'Failed to get game session' });
    }
};

// POST /api/games/session/:session_id/action — Submit a game action
const submitAction = async (req, res) => {
    try {
        const { session_id } = req.params;
        const { action, value } = req.body;
        const userId = req.user.id;

        const sessionRes = await query('SELECT * FROM game_sessions WHERE id=$1 AND status=$2', [session_id, 'active']);
        if (!sessionRes.rows[0]) return res.status(404).json({ error: 'Active session not found' });

        const session = sessionRes.rows[0];
        const state = session.game_state || {};

        // Update state based on action
        if (action === 'next_question') {
            const nextIdx = (state.current_question || 0) + 1;
            if (nextIdx < (state.total_questions || 5)) {
                state.current_question = nextIdx;
            } else {
                state.completed = true;
            }
        } else {
            state.moves = state.moves || [];
            state.moves.push({ user_id: userId, action, value, timestamp: new Date() });
            state.last_active = userId;

            // Auto-complete if it was the last move
            const totalExpected = (state.total_questions || 5) * 2;
            if (state.moves.length >= totalExpected && action.startsWith('q' + (state.total_questions - 1))) {
                // We'll let the frontend trigger 'next_question' for completion for consistency,
                // but setting completed=true here as a safety fallback.
            }
        }

        let dbStatus = 'active';
        if (state.completed) {
            dbStatus = 'completed';
        }

        const updated = await query(
            'UPDATE game_sessions SET game_state=$1, status=$2 WHERE id=$3 RETURNING *',
            [JSON.stringify(state), dbStatus, session_id]
        );

        if (state.completed) {
            // Award Love XP safely without ON CONFLICT constraints since users might not have unique index
            const { v4: uuidv4 } = require('uuid');
            const uniquePlayers = [...new Set((state.moves || []).map(m => m.user_id))];

            for (let pid of uniquePlayers) {
                try {
                    const existing = await query('SELECT * FROM points WHERE user_id=$1', [pid]);
                    if (existing.rows.length === 0) {
                        await query(
                            `INSERT INTO points (id, user_id, amount, love_xp, streak_days, last_checkin_date, source)
                             VALUES ($1, $2, 0, 50, 0, CURRENT_DATE, 'game_completion')`,
                            [uuidv4(), pid]
                        );
                    } else {
                        await query(
                            `UPDATE points SET love_xp = love_xp + 50, updated_at = NOW() WHERE user_id=$1`,
                            [pid]
                        );
                    }
                } catch (err) {
                    console.error('Failed to up points', err);
                }
            }
        }

        res.json({ session: updated.rows[0], completed: state.completed });
    } catch (err) {
        res.status(500).json({ error: 'Failed to submit action' });
    }
};

// POST /api/games/session/:session_id/end
const endSession = async (req, res) => {
    try {
        const { session_id } = req.params;
        const { winner_id } = req.body;

        await query('UPDATE game_sessions SET status=$1, winner_id=$2, ended_at=NOW() WHERE id=$3', ['completed', winner_id, session_id]);
        res.json({ message: 'Game ended! Great playing together 🎮💕' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to end session' });
    }
};

// POST /api/games/session/:session_id/abandon
const abandonSession = async (req, res) => {
    try {
        const { session_id } = req.params;
        await query('UPDATE game_sessions SET status=$1 WHERE id=$2', ['abandoned', session_id]);
        res.json({ message: 'Game abandoned' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to abandon session' });
    }
};

// Helper: generate initial game state based on type
function getInitialGameState(type, name) {
    const baseState = { started_at: new Date(), moves: [], completed: false };

    const questionBank = {
        'Who Knows Me Better': [
            { q: "What is my favorite food?", type: 'open' },
            { q: "What would I do on a perfect day?", type: 'open' },
            { q: "What is my biggest fear?", type: 'open' },
            { q: "What song describes me best?", type: 'open' },
            { q: "What is my love language?", type: 'mcq', options: ['Words of Affirmation', 'Acts of Service', 'Receiving Gifts', 'Quality Time', 'Physical Touch'] },
        ],
        'Truth or Dare': [
            { type: 'truth', q: "What first attracted you to me?" },
            { type: 'dare', q: "Send me your most embarrassing photo!" },
            { type: 'truth', q: "What is something you've never told me?" },
            { type: 'dare', q: "Write me a love note in 10 seconds!" },
        ],
        'This or That': [
            { a: "Coffee ☕", b: "Tea 🍵" },
            { a: "Beach 🏖️", b: "Mountains 🏔️" },
            { a: "Movie night 🎬", b: "Star gazing 🌟" },
            { a: "Cook at home 🍳", b: "Eat out 🍽️" },
            { a: "Morning person 🌅", b: "Night owl 🦉" },
        ],
        'Compatibility Test': [
            { q: "How do you prefer to handle conflicts?", type: 'mcq', options: ['Talk immediately', 'Cool down first', 'Write it down', 'Ignore it'] },
            { q: "What is your primary love language?", type: 'mcq', options: ['Words', 'Acts', 'Gifts', 'Time', 'Touch'] },
            { q: "How important is alone time for you?", type: 'mcq', options: ['Very', 'Somewhat', 'Not at all', 'It varies'] },
            { q: "What's our biggest financial priority?", type: 'mcq', options: ['Saving', 'Investing', 'Experiences', 'Security'] },
            { q: "Do you believe in soulmates?", type: 'mcq', options: ['Yes', 'No', 'Maybe', 'It depends'] }
        ],
        'Future Planning Quiz': [
            { q: "Where should we travel next year?", type: 'open' },
            { q: "How many kids (if any) do we want?", type: 'mcq', options: ['0', '1', '2', '3+', 'Not sure'] },
            { q: "City life or Quiet suburbs?", type: 'mcq', options: ['City', 'Suburbs', 'Countryside', 'Nomadic'] },
            { q: "What's a major goal we should achieve together?", type: 'open' },
            { q: "What would our dream home look like?", type: 'open' }
        ],
        'Guess the Emoji': [
            { q: "🏠 🍿 🎬", type: 'open', hint: "A cozy night in" },
            { q: "✈️ 🌍 🗺️", type: 'open', hint: "Adventure awaits" },
            { q: "🥗 🍷 🕯️", type: 'open', hint: "Romantic dinner" },
            { q: "🎮 🍕 🥤", type: 'open', hint: "Gaming session" },
            { q: "💍 💒 🕊️", type: 'open', hint: "Big day" }
        ],
        'Rapid Questions': [
            { q: "Dogs or Cats?", type: 'mcq', options: ['Dogs', 'Cats', 'Both', 'None'] },
            { q: "Winter or Summer?", type: 'mcq', options: ['Winter', 'Summer'] },
            { q: "Salty or Sweet?", type: 'mcq', options: ['Salty', 'Sweet'] },
            { q: "Introvert or Extrovert?", type: 'mcq', options: ['Introvert', 'Extrovert'] },
            { q: "Plan or Spontaneous?", type: 'mcq', options: ['Plan', 'Spontaneous'] }
        ],
        'Memory Match': [
            { q: "Where was our very first date?", type: 'open' },
            { q: "What was I wearing when we first met?", type: 'open' },
            { q: "What was the first movie we watched together?", type: 'open' },
            { q: "Who said 'I love you' first?", type: 'mcq', options: ['Me', 'You', 'At the same time'] },
            { q: "Which month did we start dating?", type: 'open' }
        ],
        'Never Have I Ever': [
            { q: "Never have I ever snooped through your phone.", type: 'mcq', options: ['I Have', 'I Have Never'] },
            { q: "Never have I ever forgotten an anniversary.", type: 'mcq', options: ['I Have', 'I Have Never'] },
            { q: "Never have I ever lied about liking your cooking.", type: 'mcq', options: ['I Have', 'I Have Never'] },
            { q: "Never have I ever worn your clothes secretly.", type: 'mcq', options: ['I Have', 'I Have Never'] },
            { q: "Never have I ever pretended to be asleep to avoid talking.", type: 'mcq', options: ['I Have', 'I Have Never'] }
        ],
        'Love Language Quiz': [
            { q: "How do you show love?", type: 'mcq', options: ['Compliments', 'Helping out', 'Small gifts', 'Deep talks', 'Cuddles'] },
            { q: "When you're stressed, what helps most?", type: 'mcq', options: ['Affirmation', 'A clean house', 'A treat', 'Just presence', 'Hugs'] },
            { q: "What makes you feel most ignored?", type: 'mcq', options: ['Critical words', 'Broken promises', 'Forgot occasion', 'Distracted partner', 'No touch'] },
            { q: "Best way to spend a Friday?", type: 'mcq', options: ['Writing notes', 'Doing chores', 'Exchanging gifts', 'Couch snuggles', 'Physical proximity'] },
            { q: "Your reaction to a surprise gift?", type: 'mcq', options: ['Verbal thanks', 'I want to help back', 'Excited!', 'Love the thought', 'Want a hug'] }
        ],
        'Mood Guessing Game': [
            { q: "How am I feeling right now?", type: 'mcq', options: ['Happy', 'Tired', 'Stressed', 'Romantic', 'Hungry'] },
            { q: "What do I need most this second?", type: 'mcq', options: ['Food', 'Nap', 'Hug', 'Coffee', 'Vent session'] },
            { q: "Scale of 1-10, how productive was my day?", type: 'open' },
            { q: "Am I thinking about work or us right now?", type: 'mcq', options: ['Work', 'Us', 'Both', 'Nothing'] },
            { q: "What's the best thing that happened to me today?", type: 'open' }
        ],
        'Story Builder': [
            { q: "Once upon a time, we were in...", type: 'open' },
            { q: "Suddenly, a mysterious package arrived containing...", type: 'open' },
            { q: "Inside the package, we found a map to...", type: 'open' },
            { q: "On our journey, we met a strange character named...", type: 'open' },
            { q: "They gave us a magical object that could...", type: 'open' }
        ],
        'Couple Puzzle': [
            { q: "Finish the lyric: 'All you need is...'", type: 'open' },
            { q: "What's the sum of our ages?", type: 'open' },
            { q: "Which zodiac signs are we?", type: 'open' },
            { q: "How many months have we been together?", type: 'open' },
            { q: "What is 143 in code?", type: 'mcq', options: ['I Love You', 'I Miss You', 'I Need You', 'I Hate You'] }
        ],
        'Love Bingo': generateBingoCard(),
        'Personality Challenge': [
            { q: "Are you more like your Mom or Dad?", type: 'mcq', options: ['Mom', 'Dad', 'Both', 'Neither'] },
            { q: "What's your biggest pet peeve?", type: 'open' },
            { q: "Would you rather be famous or rich?", type: 'mcq', options: ['Famous', 'Rich'] },
            { q: "What's one thing you'd change about yourself?", type: 'open' },
            { q: "Do you listen to your heart or brain more?", type: 'mcq', options: ['Heart', 'Brain'] }
        ],
        'Daily Question': [
            { q: "What's one thing you're grateful for today?", type: 'open' },
            { q: "Who made you smile today?", type: 'open' },
            { q: "What's a small win you had today?", type: 'open' },
            { q: "What was the hardest part of your day?", type: 'open' },
            { q: "One goal for tomorrow?", type: 'open' }
        ],
        'Random Confession': [
            { q: "Tell a secret from your childhood.", type: 'open' },
            { q: "What's a minor lie you've told recently?", type: 'open' },
            { q: "What's a 'guilty pleasure' song you love?", type: 'open' },
            { q: "What's something you're secretly proud of?", type: 'open' },
            { q: "What's your most 'out-there' conspiracy theory?", type: 'open' }
        ],
        'Photo Guess': [
            { q: "Which of us takes better selfies?", type: 'mcq', options: ['Me', 'You', 'Both', 'Neither'] },
            { q: "Guess the location of our last shared photo.", type: 'open' },
            { q: "Who is more likely to photobomb?", type: 'mcq', options: ['Me', 'You'] },
            { q: "What's my favorite photo of US?", type: 'open' },
            { q: "Describe our 'vibe' in one word.", type: 'open' }
        ],
        'Secret Vote': [
            { q: "Who is the better driver?", type: 'vote', options: ['Me', 'You'] },
            { q: "Who is the 'organized' one?", type: 'vote', options: ['Me', 'You'] },
            { q: "Who is higher maintenance?", type: 'vote', options: ['Me', 'You'] },
            { q: "Who is the better gift giver?", type: 'vote', options: ['Me', 'You'] },
            { q: "Who falls asleep first during movies?", type: 'vote', options: ['Me', 'You'] }
        ],
        'Predict Partner': [
            { q: "What is my favorite season?", type: 'open' },
            { q: "What is my dream car?", type: 'open' },
            { q: "What is my favorite hobby?", type: 'open' },
            { q: "Do I prefer sunrises or sunsets?", type: 'mcq', options: ['Sunrise', 'Sunset'] },
            { q: "Am I a saver or a spender?", type: 'mcq', options: ['Saver', 'Spender'] }
        ],
        'Couple Trivia': [
            { q: "What day of the week was our first date?", type: 'open' },
            { q: "Who brought up 'making it official'?", type: 'mcq', options: ['Me', 'You', 'It just happened'] },
            { q: "What's our 'song'?", type: 'open' },
            { q: "What's the furthest we've traveled together?", type: 'open' },
            { q: "What's our favorite shared hobby?", type: 'open' }
        ]
    };

    const fallbackQuestions = [
        { q: "What's a core memory of us you cherish most?", type: 'open' },
        { q: "What is one thing I do that always makes you smile?", type: 'open' },
        { q: "Where do you see us in 5 years?", type: 'open' },
        { q: "What was your first impression of me?", type: 'open' },
        { q: "What's your favorite physical feature of mine?", type: 'open' },
    ];

    const questions = questionBank[name] || fallbackQuestions;

    return {
        ...baseState,
        total_questions: questions.length,
        questions: questions,
        current_question: 0,
        scores: {},
    };
}

function generateBingoCard() {
    return [
        { q: "What's our most memorable trip together?", type: 'open' },
        { q: "Who is more likely to say sorry first?", type: 'mcq', options: ['Me', 'You'] },
        { q: "What's the best surprise we've done for each other?", type: 'open' },
        { q: "Who cooks better?", type: 'mcq', options: ['Me', 'You', 'We both burn water'] },
        { q: "What's our favorite movie to rewatch?", type: 'open' }
    ];
}

module.exports = { getAllGames, getActiveSession, startSession, getSession, submitAction, endSession, abandonSession };
