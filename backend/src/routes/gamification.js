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
        `SELECT u.id FROM unlockables u
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

module.exports = { dailyCheckin, getStats, getUnlockables };
