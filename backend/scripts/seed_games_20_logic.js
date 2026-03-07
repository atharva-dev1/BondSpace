module.exports = async (pool) => {
    const games = [
        ['Who Knows Me Better', 'quiz', 'Answer questions about your partner and see who scores higher'],
        ['Rapid Questions', 'quiz', 'Quick-fire questions to test how well you know each other'],
        ['Memory Match', 'match', 'Match shared memories and photos as a couple'],
        ['Truth or Dare', 'truth_dare', 'Relationship-themed truth or dare game'],
        ['Guess the Emoji', 'quiz', 'Partner sends emoji clues, you guess the word'],
        ['This or That', 'vote', 'Choose between two options and see if partner agrees'],
        ['Future Planning Quiz', 'quiz', 'Plan your future together with fun scenarios'],
        ['Compatibility Test', 'quiz', 'Discover your compatibility through curated questions'],
        ['Love Language Quiz', 'quiz', 'Find out each other\'s love language'],
        ['Mood Guessing Game', 'quiz', 'Guess your partner\'s current mood'],
        ['Story Builder', 'story', 'Build a creative story together, one line at a time'],
        ['Couple Puzzle', 'puzzle', 'Solve relationship puzzles together'],
        ['Love Bingo', 'bingo', 'Bingo with romantic & couple-themed prompts'],
        ['Personality Challenge', 'quiz', 'Deep personality questions to know each other better'],
        ['Daily Question', 'quiz', 'One thoughtful question per day for both partners'],
        ['Random Confession', 'other', 'Share a random confession with your partner'],
        ['Photo Guess', 'match', 'Guess the memory from shared couple photos'],
        ['Secret Vote', 'vote', 'Vote secretly and reveal results together'],
        ['Predict Partner', 'prediction', 'Predict how your partner will answer questions'],
        ['Couple Trivia', 'quiz', 'Trivia about your relationship milestones'],
        ['Never Have I Ever', 'quiz', 'The classic party game, relationship style']
    ];

    // Ensure unique constraint exists
    await pool.query(`
        DO $$ 
        BEGIN 
            IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'games_name_key') THEN
                ALTER TABLE games ADD CONSTRAINT games_name_key UNIQUE (name);
            END IF;
        END $$;
    `);

    for (const [name, type, description] of games) {
        await pool.query(
            `INSERT INTO games (name, type, description, is_active) 
             VALUES ($1, $2, $3, TRUE) 
             ON CONFLICT (name) DO UPDATE SET type = $2, description = $3, is_active = TRUE`,
            [name, type, description]
        );
    }
};
