const { query } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

// POST /api/gamification/checkin — Daily check-in
const dailyCheckin = async (req, res) => {
    try {
        const userId = req.user.id;
        const result = await query('SELECT * FROM points WHERE user_id=$1', [userId]);
        let pts = result.rows[0];

        const today = new Date().toISOString().split('T')[0];

        if (!pts) {
            // First time, create record
            const newPts = await query(
                'INSERT INTO points (id, user_id, amount, love_xp, streak_days, last_checkin_date, source) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *',
                [uuidv4(), userId, 50, 50, 1, today, 'checkin']
            );
            return res.json({ points: newPts.rows[0], xp_earned: 50, streak: 1, message: '🌟 First check-in! +50 Love XP' });
        }

        if (pts.last_checkin_date === today) {
            return res.json({ message: 'Already checked in today! Come back tomorrow 💕', already_done: true, points: pts });
        }

        // Calculate streak
        const lastDate = new Date(pts.last_checkin_date);
        const todayDate = new Date(today);
        const diffDays = Math.round((todayDate - lastDate) / (1000 * 60 * 60 * 24));
        const newStreak = diffDays === 1 ? pts.streak_days + 1 : 1;
        const bonusXP = newStreak >= 7 ? 100 : newStreak >= 3 ? 75 : 50;

        const updated = await query(
            'UPDATE points SET amount=amount+$1, love_xp=love_xp+$2, streak_days=$3, last_checkin_date=$4, updated_at=NOW() WHERE user_id=$5 RETURNING *',
            [bonusXP, bonusXP, newStreak, today, userId]
        );

        // Check for unlockables
        await checkAndUnlockRewards(userId, updated.rows[0].love_xp, res);

        res.json({ points: updated.rows[0], xp_earned: bonusXP, streak: newStreak, message: `🔥 Day ${newStreak} streak! +${bonusXP} Love XP` });
    } catch (err) {
        res.status(500).json({ error: 'Failed to check in' });
    }
};

// GET /api/gamification/stats/:user_id — Get user's Love XP, level, streak
const getStats = async (req, res) => {
    try {
        const result = await query('SELECT * FROM points WHERE user_id=$1', [req.params.user_id]);
        if (!result.rows[0]) {
            return res.json({ stats: { love_xp: 0, couple_level: 1, streak_days: 0, amount: 0 } });
        }

        const stats = result.rows[0];
        // Calculate current level from XP
        stats.couple_level = Math.floor(stats.love_xp / 500) + 1;

        res.json({ stats });
    } catch (err) {
        res.status(500).json({ error: 'Failed to get stats' });
    }
};

// GET /api/gamification/unlockables/:user_id — Get unlocked rewards
const getUnlockables = async (req, res) => {
    try {
        const result = await query(
            `SELECT u.*, uu.unlocked_at FROM unlockables u
       JOIN user_unlockables uu ON uu.unlockable_id = u.id
       WHERE uu.user_id=$1`,
            [req.params.user_id]
        );
        res.json({ unlocked: result.rows });
    } catch (err) {
        res.status(500).json({ error: 'Failed to get unlockables' });
    }
};

// Helper: auto-unlock rewards based on XP
async function checkAndUnlockRewards(userId, currentXP, res) {
    const eligible = await query(
        `SELECT u.id, u.name FROM unlockables u
     WHERE u.xp_required <= $1
     AND u.id NOT IN (SELECT unlockable_id FROM user_unlockables WHERE user_id=$2)`,
        [currentXP, userId]
    );

    for (const reward of eligible.rows) {
        await query(
            'INSERT INTO user_unlockables (user_id, unlockable_id) VALUES ($1,$2) ON CONFLICT DO NOTHING',
            [userId, reward.id]
        );
    }
}

// GET /api/gamification/challenges — Get daily challenges progress
const getChallenges = async (req, res) => {
    try {
        const userId = req.user.id;
        const today = new Date().toISOString().split('T')[0];

        // Ensure user has challenges initialized for today
        const existing = await query(
            'SELECT 1 FROM user_challenges WHERE user_id=$1 AND reset_at=$2 LIMIT 1',
            [userId, today]
        );

        if (existing.rows.length === 0) {
            // Auto-assign 3 random challenges for today
            const challenges = await query('SELECT id FROM daily_challenges ORDER BY RANDOM() LIMIT 3');
            for (const ch of challenges.rows) {
                await query(
                    'INSERT INTO user_challenges (user_id, challenge_id, reset_at) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
                    [userId, ch.id, today]
                );
            }
        }

        const result = await query(
            `SELECT uc.*, dc.title, dc.description, dc.task_type, dc.target_count, dc.points_reward, dc.xp_reward 
             FROM user_challenges uc
             JOIN daily_challenges dc ON dc.id = uc.challenge_id
             WHERE uc.user_id=$1 AND uc.reset_at=$2`,
            [userId, today]
        );

        res.json({ challenges: result.rows });
    } catch (err) {
        console.error('getChallenges error:', err);
        res.status(500).json({ error: 'Failed to fetch challenges' });
    }
};

// GET /api/gamification/achievements — Get user achievements
const getAchievements = async (req, res) => {
    try {
        const userId = req.user.id;
        const unlocked = await query(
            `SELECT a.*, ua.unlocked_at FROM achievements a
             JOIN user_achievements ua ON ua.achievement_id = a.id
             WHERE ua.user_id=$1`,
            [userId]
        );

        const all = await query('SELECT * FROM achievements ORDER BY requirement_value ASC');

        res.json({
            unlocked: unlocked.rows,
            all: all.rows
        });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch achievements' });
    }
};

// Internal utility to update challenge progress
const updateChallengeProgress = async (userId, taskType, increment = 1) => {
    try {
        const today = new Date().toISOString().split('T')[0];

        const challengeRes = await query(
            `SELECT uc.*, dc.target_count, dc.points_reward, dc.xp_reward 
             FROM user_challenges uc
             JOIN daily_challenges dc ON dc.id = uc.challenge_id
             WHERE uc.user_id=$1 AND uc.reset_at=$2 AND dc.task_type=$3 AND uc.is_completed=FALSE`,
            [userId, today, taskType]
        );

        for (const uc of challengeRes.rows) {
            const newCount = uc.current_count + increment;
            const isCompleted = newCount >= uc.target_count;

            await query(
                `UPDATE user_challenges SET current_count=$1, is_completed=$2, completed_at=$3 WHERE id=$4`,
                [newCount, isCompleted, isCompleted ? new Date() : null, uc.id]
            );

            if (isCompleted) {
                await query(
                    'UPDATE points SET amount=amount+$1, love_xp=love_xp+$2, updated_at=NOW() WHERE user_id=$3',
                    [uc.points_reward, uc.xp_reward, userId]
                );
            }
        }
    } catch (err) {
        console.error('updateChallengeProgress error:', err);
    }
};

module.exports = { dailyCheckin, getStats, getUnlockables, getChallenges, getAchievements, updateChallengeProgress };
