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

// Internal helper for proactive tone analysis
const analyseToneInternal = async (couple_id) => {
    try {
        const messagesRes = await query(
            `SELECT message, nonce, sender_id FROM messages WHERE couple_id=$1 AND is_encrypted=true AND timestamp > NOW() - INTERVAL '2 days' ORDER BY timestamp DESC LIMIT 20`,
            [couple_id]
        );

        if (messagesRes.rows.length < 5) return { mood: 'Neutral', aura_message: 'Keep the chat flowing! 💕' };

        const { decryptMessage } = require('../services/encryptionService');
        const sampleMessages = messagesRes.rows.map(m => {
            try { return decryptMessage(m.message, m.nonce).slice(0, 100); }
            catch { return ''; }
        }).filter(Boolean).join('\n');

        const prompt = `Analyse this couple's chat tone. 
        Output ONLY a JSON object:
        {
          "mood": "Positive/Neutral/Tense",
          "is_tense": boolean,
          "aura_message": "One warm sentence about their vibe",
          "suggestion": "De-escalation tip if tense, else encouragement",
          "nvc_prompt": "A Non-Violent Communication prompt starting with 'I feel... when... because...' if tense"
        }
        Chat:
        ${sampleMessages}`;

        const response = await axios.post(
            `${SAMBANOVA_BASE_URL}/chat/completions`,
            {
                model: SAMBANOVA_MODEL,
                messages: [
                    { role: 'system', content: 'You are a structured relationship analyzer. Output ONLY raw JSON.' },
                    { role: 'user', content: prompt }
                ],
                max_tokens: 300,
                temperature: 0.3,
            },
            {
                headers: { Authorization: `Bearer ${process.env.SAMBANOVA_API_KEY}`, 'Content-Type': 'application/json' },
                timeout: 30000,
            }
        );

        return JSON.parse(response.data.choices[0].message.content.trim());
    } catch (err) {
        console.error('analyseToneInternal error:', err.message);
        return { mood: 'Neutral', is_tense: false, aura_message: 'Your bond is growing! 💕' };
    }
};

// POST /api/ai/analyse-tone — Analyse chat tone of a couple
const analyseTone = async (req, res) => {
    try {
        const { couple_id } = req.body;
        const analysis = await analyseToneInternal(couple_id);
        res.json({ analysis: analysis.aura_message, detail: analysis });
    } catch (err) {
        res.json({ analysis: "BondSpace is glowing with your energy! 💕" });
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

// POST /api/ai/plan-activity — Get structured activity suggestions with memory context
const planActivity = async (req, res) => {
    try {
        const { theme, mood, couple_id } = req.body;

        // Fetch relationship context (Timeline & Photos)
        let memoryContext = '';
        if (couple_id) {
            const memories = await query(
                `SELECT label, event_type FROM timeline_events WHERE couple_id=$1 ORDER BY event_date DESC LIMIT 3`,
                [couple_id]
            );
            if (memories.rows.length > 0) {
                memoryContext = `The couple has these recent memories: ${memories.rows.map(m => m.label).join(', ')}. Try to suggest something that references or builds on these.`;
            }
        }

        const prompt = `Suggest 3 unique couple activities for theme: "${theme || 'any'}" and mood: "${mood || 'any'}".
        ${memoryContext}
        Format your response as a JSON array of objects with keys: title, description, location, theme, duration.
        Return ONLY the JSON array.`;

        const response = await axios.post(
            `${SAMBANOVA_BASE_URL}/chat/completions`,
            {
                model: SAMBANOVA_MODEL,
                messages: [
                    { role: 'system', content: 'You are a structured output assistant. Output only raw JSON.' },
                    { role: 'user', content: prompt }
                ],
                max_tokens: 600,
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
            suggestions = [
                { title: "Home Movie Marathon", description: "Binge-watch your favorite series with plenty of popcorn.", location: "Home", theme: "Relaxing", duration: "3-4 hours" }
            ];
        }

        res.json({ suggestions });
    } catch (err) {
        console.error('Plan activity error:', err.message);
        res.status(500).json({ error: 'Failed to generate suggestions' });
    }
};

module.exports = { chatWithGuru, analyseTone, getGuruHistory, planActivity, analyseToneInternal };
