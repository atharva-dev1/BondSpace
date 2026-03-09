const { query } = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const { encryptMessage, decryptMessage } = require('../services/encryptionService');
const cloudinary = require('../config/cloudinary');

// Helper: upload buffer to Cloudinary
const uploadToCloudinary = (buffer, options = {}) =>
    new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: 'bondspace/voice_notes',
                resource_type: 'auto',
                timeout: 60000,
                ...options
            },
            (err, result) => {
                if (err) return reject(err);
                resolve(result);
            }
        );
        uploadStream.end(buffer);
    });

// POST /api/messages/upload-voice
const uploadVoice = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No audio file provided' });
        const { couple_id } = req.body;

        const result = await uploadToCloudinary(req.file.buffer, {
            folder: `bondspace/${couple_id}/voice`
        });

        res.status(201).json({
            media_url: result.secure_url,
            public_id: result.public_id
        });
    } catch (err) {
        console.error('Voice upload error:', err);
        res.status(500).json({ error: 'Upload failed', details: err.message });
    }
};

// GET /api/messages/:couple_id — Get chat history
const getMessages = async (req, res) => {
    try {
        const { couple_id } = req.params;
        const { limit = 50, before } = req.query;

        let q = `SELECT m.*, u.name as sender_name, u.avatar as sender_avatar
             FROM messages m JOIN users u ON m.sender_id = u.id
             WHERE m.couple_id=$1`;
        const params = [couple_id];

        if (before) {
            q += ` AND m.timestamp < $${params.length + 1}`;
            params.push(before);
        }

        q += ` ORDER BY m.timestamp DESC LIMIT $${params.length + 1}`;
        params.push(parseInt(limit));

        const result = await query(q, params);
        const messages = result.rows.map(msg => ({
            ...msg,
            message: msg.is_encrypted && msg.nonce ? decryptMessage(msg.message, msg.nonce) : msg.message,
        }));

        res.json({ messages: messages.reverse() });
    } catch (err) {
        console.error('Get messages error:', err);
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
};

// POST /api/messages — Send a message (REST fallback; primary is socket)
const sendMessage = async (req, res) => {
    try {
        const { couple_id, message, message_type = 'text', media_url, is_disappearing, expires_in_seconds } = req.body;
        const sender_id = req.user.id;

        const { encryptedMessage, nonce } = encryptMessage(message || '');
        const expires_at = is_disappearing && expires_in_seconds
            ? new Date(Date.now() + expires_in_seconds * 1000)
            : null;

        const result = await query(
            `INSERT INTO messages (id, couple_id, sender_id, message, message_type, media_url, is_encrypted, nonce, is_disappearing, expires_at, timestamp)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,NOW()) RETURNING *`,
            [uuidv4(), couple_id, sender_id, encryptedMessage, message_type, media_url, true, nonce, is_disappearing || false, expires_at]
        );

        res.status(201).json({ message: result.rows[0] });
    } catch (err) {
        res.status(500).json({ error: 'Failed to send message' });
    }
};

// POST /api/messages/:id/pin — Pin a memory
const pinMessage = async (req, res) => {
    try {
        const { id } = req.params;
        const { label } = req.body;
        await query('UPDATE messages SET is_pinned=true, pinned_label=$1 WHERE id=$2', [label, id]);
        res.json({ message: '📌 Memory pinned!' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to pin message' });
    }
};

// GET /api/messages/:couple_id/pinned — Get pinned memories
const getPinnedMessages = async (req, res) => {
    try {
        const { couple_id } = req.params;
        const result = await query(
            `SELECT m.*, u.name as sender_name, u.avatar as sender_avatar
       FROM messages m JOIN users u ON m.sender_id = u.id
       WHERE m.couple_id=$1 AND m.is_pinned=true ORDER BY m.timestamp DESC`,
            [couple_id]
        );
        res.json({ pinned: result.rows });
    } catch (err) {
        res.status(500).json({ error: 'Failed to get pinned messages' });
    }
};

// POST /api/messages/:id/react — Love reaction
const addReaction = async (req, res) => {
    try {
        const { id } = req.params;
        const { emoji } = req.body;
        await query(
            'INSERT INTO message_reactions (id, message_id, user_id, emoji) VALUES ($1,$2,$3,$4) ON CONFLICT DO NOTHING',
            [uuidv4(), id, req.user.id, emoji]
        );
        res.json({ reacted: true, emoji });
    } catch (err) {
        res.status(500).json({ error: 'Failed to add reaction' });
    }
};

// DELETE /api/messages/disappearing — Cron-triggered cleanup of expired messages
const cleanDisappearingMessages = async () => {
    try {
        const result = await query('DELETE FROM messages WHERE is_disappearing=true AND expires_at < NOW()');
        console.log(`🗑️ Cleaned ${result.rowCount} expired messages`);
    } catch (err) {
        console.error('Cleanup error:', err);
    }
};

module.exports = { getMessages, sendMessage, pinMessage, getPinnedMessages, addReaction, cleanDisappearingMessages, uploadVoice };
