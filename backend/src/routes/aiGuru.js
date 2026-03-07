/**
 * BondSpace AI Love Guru Service
 * Powered by SambaNova AI (Llama 3.1)
 * Trained on couple psychology, relationship communication, conflict resolution
 */
const axios = require('axios');
const { query } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

const SAMBANOVA_BASE_URL = process.env.SAMBANOVA_BASE_URL || 'https://api.sambanova.ai/v1';
const SAMBANOVA_MODEL = process.env.SAMBANOVA_MODEL || 'Meta-Llama-3.1-70B-Instruct';

const SYSTEM_PROMPT = `You are the BondSpace Love Guru — an empathetic, wise, and warm AI relationship counselor.
You are trained in:
- Couple psychology and attachment theory
- Non-violent communication (NVC) techniques
- Conflict mediation and de-escalation
- Love languages (Gary Chapman's 5 Love Languages)
- Long-distance relationship guidance
- Relationship milestone celebration

Your personality:
- Always supportive, never judgmental
- Offer actionable advice, not just validation
- Use emojis sparingly to keep the tone warm 💕
- Keep responses concise (under 200 words) unless in-depth analysis is requested
- Address both partners' perspectives fairly

Important ethics:
- Never encourage unhealthy relationship patterns
- If abuse is mentioned, always recommend professional help
- Maintain strict confidentiality`;

// POST /api/ai/guru — Chat with Love Guru
const chatWithGuru = async (req, res) => {
    try {
        const { couple_id, message, include_history = true } = req.body;
        const userId = req.user.id;

        // Get chat history for context
        let history = [];
        if (include_history && couple_id) {
            const histRes = await query(
                'SELECT role, content FROM ai_guru_chats WHERE couple_id=$1 ORDER BY created_at DESC LIMIT 10',
                [couple_id]
            );
            history = histRes.rows.reverse();
        }

        const messages = [
            { role: 'system', content: SYSTEM_PROMPT },
            ...history.map(h => ({ role: h.role, content: h.content })),
            { role: 'user', content: message },
        ];

        // Call SambaNova API
        const response = await axios.post(
            `${SAMBANOVA_BASE_URL}/chat/completions`,
            {
                model: SAMBANOVA_MODEL,
                messages,
                max_tokens: 512,
                temperature: 0.7,
                stream: false,
            },
            {
                headers: {
                    Authorization: `Bearer ${process.env.SAMBANOVA_API_KEY}`,
                    'Content-Type': 'application/json',
                },
                timeout: 30000,
            }
        );

        const aiReply = response.data.choices[0].message.content;

        // Save conversation to DB
        await query(
            'INSERT INTO ai_guru_chats (id, couple_id, user_id, role, content) VALUES ($1,$2,$3,$4,$5)',
            [uuidv4(), couple_id, userId, 'user', message]
        );
        await query(
            'INSERT INTO ai_guru_chats (id, couple_id, user_id, role, content) VALUES ($1,$2,$3,$4,$5)',
            [uuidv4(), couple_id, userId, 'assistant', aiReply]
        );

        res.json({ reply: aiReply, model: SAMBANOVA_MODEL });
    } catch (err) {
        console.error('AI Guru error:', err.response?.data || err.message);
        // Fallback response
        res.json({
            reply: "I'm here for you! 💕 Could you share a bit more so I can give you the best guidance? Sometimes just talking it out helps clarity bloom.",
            model: 'fallback',
        });
    }
};

// POST /api/ai/analyse-tone — Analyse chat tone of a couple
const analyseTone = async (req, res) => {
    try {
        const { couple_id } = req.body;

        // Get recent messages (decrypted)
        const messagesRes = await query(
            `SELECT message, nonce, sender_id FROM messages WHERE couple_id=$1 AND is_encrypted=true AND timestamp > NOW() - INTERVAL '7 days' ORDER BY timestamp DESC LIMIT 30`,
            [couple_id]
        );

        if (messagesRes.rows.length === 0) {
            return res.json({ analysis: 'Not enough messages to analyse yet. Keep chatting! 💬' });
        }

        const { decryptMessage } = require('../services/encryptionService');
        const sampleMessages = messagesRes.rows.slice(0, 10).map(m => {
            try {
                const cleartext = decryptMessage(m.message, m.nonce);
                return cleartext.slice(0, 100);
            } catch { return ''; }
        }).filter(Boolean).join('\n');

        const prompt = `Analyse the emotional tone of this recent couple chat. Identify:
1. Overall mood (positive/neutral/tense)
2. Communication health score (0-100)
3. One specific actionable suggestion for improvement
4. One thing they are doing well

Chat excerpts (anonymised):
${sampleMessages}

Keep your response encouraging and under 150 words.`;

        const response = await axios.post(
            `${SAMBANOVA_BASE_URL}/chat/completions`,
            {
                model: SAMBANOVA_MODEL,
                messages: [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: prompt }],
                max_tokens: 300,
                temperature: 0.5,
            },
            {
                headers: { Authorization: `Bearer ${process.env.SAMBANOVA_API_KEY}`, 'Content-Type': 'application/json' },
                timeout: 30000,
            }
        );

        res.json({ analysis: response.data.choices[0].message.content });
    } catch (err) {
        console.error('Tone analysis error:', err.message);
        res.json({ analysis: "Looks like communication was active this week! Keep the conversations flowing and remember to check in on each other's feelings 💕" });
    }
};

// GET /api/ai/guru/history/:couple_id — Get AI chat history
const getGuruHistory = async (req, res) => {
    try {
        const result = await query(
            'SELECT id, role, content, created_at FROM ai_guru_chats WHERE couple_id=$1 ORDER BY created_at ASC',
            [req.params.couple_id]
        );
        res.json({ history: result.rows });
    } catch (err) {
        res.status(500).json({ error: 'Failed to get guru history' });
    }
};

// POST /api/ai/plan-activity — Get structured activity suggestions
const planActivity = async (req, res) => {
    try {
        const { theme, mood } = req.body;

        const prompt = `Suggest 3 unique, romantic, or fun couple activities based on the theme: "${theme || 'any'}" and mood: "${mood || 'any'}".
        Format your response as a JSON array of objects with the following keys:
        - title: Short catchy name
        - description: One sentence pitch
        - location: Where to go (or 'At Home')
        - theme: Category (e.g., Adventure, Cozy, Intellectual)
        - duration: Estimated time (e.g., 2 hours)
        
        Example JSON:
        [
          { "title": "Starlit Picnic", "description": "Package some snacks and head to the nearest park for stargazing.", "location": "Local Park", "theme": "Cozy", "duration": "1-2 hours" }
        ]
        Return ONLY the JSON array.`;

        const response = await axios.post(
            `${SAMBANOVA_BASE_URL}/chat/completions`,
            {
                model: SAMBANOVA_MODEL,
                messages: [
                    { role: 'system', content: 'You are a structured output assistant. Output only raw JSON.' },
                    { role: 'user', content: prompt }
                ],
                max_tokens: 512,
                temperature: 0.8,
            },
            {
                headers: { Authorization: `Bearer ${process.env.SAMBANOVA_API_KEY}`, 'Content-Type': 'application/json' },
                timeout: 30000,
            }
        );

        let suggestions;
        try {
            suggestions = JSON.parse(response.data.choices[0].message.content.trim());
        } catch (e) {
            // Simple fallback if AI fails to return JSON
            suggestions = [
                { title: "Home Movie Marathon", description: "Binge-watch your favorite series with plenty of popcorn.", location: "Home", theme: "Relaxing", duration: "3-4 hours" },
                { title: "Local Cafe Crawl", description: "Try three different desserts at three different cafes.", location: "Downtown", theme: "Adventurous", duration: "2 hours" }
            ];
        }

        res.json({ suggestions });
    } catch (err) {
        console.error('Plan activity error:', err.message);
        res.status(500).json({ error: 'Failed to generate suggestions' });
    }
};

module.exports = { chatWithGuru, analyseTone, getGuruHistory, planActivity };
