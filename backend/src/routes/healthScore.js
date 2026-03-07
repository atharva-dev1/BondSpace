const { query } = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');

// POST /api/health/calculate/:couple_id — AI-powered health score
const calculateHealthScore = async (req, res) => {
    try {
        const { couple_id } = req.params;

        // Get stats for scoring
        const [msgRes, gameRes, checkinRes] = await Promise.all([
            query(`SELECT COUNT(*) as cnt FROM messages WHERE couple_id=$1 AND timestamp > NOW() - INTERVAL '7 days'`, [couple_id]),
            query(`SELECT COUNT(*) as cnt FROM game_sessions WHERE couple_id=$1 AND started_at > NOW() - INTERVAL '7 days'`, [couple_id]),
            query(`SELECT SUM(streak_days) as streak FROM points WHERE couple_id=$1`, [couple_id]),
        ]);

        const msgCount = parseInt(msgRes.rows[0].cnt);
        const gameCount = parseInt(gameRes.rows[0].cnt);
        const streak = parseInt(checkinRes.rows[0].streak) || 0;

        // Score calculation
        const communication_score = Math.min(100, msgCount * 2);
        const interaction_score = Math.min(100, gameCount * 15 + streak * 5);
        const activity_score = Math.min(100, streak * 10);
        const trust_meter = Math.min(100, (communication_score + interaction_score) / 2);
        const bond_strength = Math.min(100, (communication_score + interaction_score + activity_score) / 3);

        // Get AI insight
        let ai_insight = '';
        try {
            const response = await axios.post(
                `${process.env.SAMBANOVA_BASE_URL || 'https://api.sambanova.ai/v1'}/chat/completions`,
                {
                    model: process.env.SAMBANOVA_MODEL || 'Meta-Llama-3.1-70B-Instruct',
                    messages: [
                        {
                            role: 'system',
                            content: 'You are a relationship health advisor. Give a brief, warm 2-sentence insight about a couple\'s relationship health based on their activity scores. Be encouraging.',
                        },
                        {
                            role: 'user',
                            content: `Communication: ${communication_score}/100, Interaction: ${interaction_score}/100, Activity: ${activity_score}/100, Trust: ${trust_meter}/100. Give insight.`,
                        },
                    ],
                    max_tokens: 150,
                    temperature: 0.7,
                },
                { headers: { Authorization: `Bearer ${process.env.SAMBANOVA_API_KEY}`, 'Content-Type': 'application/json' }, timeout: 15000 }
            );
            ai_insight = response.data.choices[0].message.content;
        } catch {
            ai_insight = 'Your bond is a beautiful journey. Keep nurturing it with daily conversations and shared moments! 💕';
        }

        // Upsert health score
        const result = await query(
            `INSERT INTO health_scores (id, couple_id, communication_score, interaction_score, activity_score, trust_meter, bond_strength, ai_insight)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING *`,
            [uuidv4(), couple_id, communication_score, interaction_score, activity_score, trust_meter, bond_strength, ai_insight]
        );

        res.json({ healthScore: result.rows[0] });
    } catch (err) {
        console.error('Health score error:', err);
        res.status(500).json({ error: 'Failed to calculate health score' });
    }
};

// GET /api/health/:couple_id — Get latest health score
const getHealthScore = async (req, res) => {
    try {
        const result = await query(
            'SELECT * FROM health_scores WHERE couple_id=$1 ORDER BY calculated_at DESC LIMIT 1',
            [req.params.couple_id]
        );
        res.json({ healthScore: result.rows[0] || null });
    } catch (err) {
        res.status(500).json({ error: 'Failed to get health score' });
    }
};

module.exports = { calculateHealthScore, getHealthScore };
