const { query } = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const { getIo } = require('../socket');

// POST /api/chat/anonymous/match - Join queue or match with someone
const matchUser = async (req, res) => {
    try {
        const user_id = req.user.id;

        // Check if already in a match
        const activeMatch = await query(
            "SELECT * FROM anonymous_chats WHERE (user1_id=$1 OR user2_id=$1) AND status='active'",
            [user_id]
        );
        if (activeMatch.rows.length > 0) {
            return res.json({ chat_id: activeMatch.rows[0].id, match_found: true });
        }

        // Check for someone in queue
        const queueRes = await query("SELECT user_id FROM anonymous_queue WHERE user_id != $1 LIMIT 1", [user_id]);

        if (queueRes.rows.length > 0) {
            const partner_id = queueRes.rows[0].user_id;

            // Remove partner from queue
            await query("DELETE FROM anonymous_queue WHERE user_id = $1", [partner_id]);

            // Create match
            const chat_id = uuidv4();
            await query(
                "INSERT INTO anonymous_chats (id, user1_id, user2_id, status) VALUES ($1, $2, $3, 'active')",
                [chat_id, partner_id, user_id]
            );

            // Notify both via socket
            const io = getIo();
            io.to(partner_id).emit('anonymous_match_found', { chat_id });
            io.to(user_id).emit('anonymous_match_found', { chat_id });

            return res.json({ chat_id, match_found: true });
        } else {
            // Join queue
            await query(
                "INSERT INTO anonymous_queue (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING",
                [user_id]
            );
            return res.json({ message: 'Waiting for match...', match_found: false });
        }
    } catch (err) {
        console.error('Match error:', err);
        res.status(500).json({ error: 'Failed to find match' });
    }
};

// GET /api/chat/anonymous/:chat_id - Get messages
const getAnonymousMessages = async (req, res) => {
    try {
        const { chat_id } = req.params;
        const user_id = req.user.id;

        // Verify user belongs to chat
        const chatRes = await query(
            "SELECT * FROM anonymous_chats WHERE id=$1 AND (user1_id=$2 OR user2_id=$2)",
            [chat_id, user_id]
        );
        if (chatRes.rows.length === 0) return res.status(403).json({ error: 'Unauthorized' });

        const messages = await query(
            "SELECT * FROM anonymous_messages WHERE chat_id=$1 ORDER BY timestamp ASC",
            [chat_id]
        );
        res.json({ messages: messages.rows });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
};

// POST /api/chat/anonymous/message - Send message
const sendAnonymousMessage = async (req, res) => {
    try {
        const { chat_id, message, nonce } = req.body;
        const user_id = req.user.id;

        // Verify active chat
        const chatRes = await query(
            "SELECT * FROM anonymous_chats WHERE id=$1 AND (user1_id=$2 OR user2_id=$2) AND status='active'",
            [chat_id, user_id]
        );
        if (chatRes.rows.length === 0) return res.status(403).json({ error: 'No active chat found' });

        const chat = chatRes.rows[0];
        const partner_id = chat.user1_id === user_id ? chat.user2_id : chat.user1_id;

        const message_id = uuidv4();
        await query(
            "INSERT INTO anonymous_messages (id, chat_id, sender_id, message, nonce) VALUES ($1, $2, $3, $4, $5)",
            [message_id, chat_id, user_id, message, nonce]
        );

        // Notify partner via socket
        const io = getIo();
        io.to(partner_id).emit('anonymous_message_received', {
            id: message_id,
            chat_id,
            sender_id: user_id,
            message,
            nonce,
            timestamp: new Date()
        });

        res.json({ message_id, status: 'sent' });
    } catch (err) {
        console.error('Send error:', err);
        res.status(500).json({ error: 'Failed to send message' });
    }
};

// POST /api/chat/anonymous/end - End chat
const endAnonymousChat = async (req, res) => {
    try {
        const { chat_id } = req.body;
        const user_id = req.user.id;

        const result = await query(
            "UPDATE anonymous_chats SET status='ended', ended_at=NOW() WHERE id=$1 AND (user1_id=$2 OR user2_id=$2) AND status='active' RETURNING *",
            [chat_id, user_id]
        );

        if (result.rows.length > 0) {
            const chat = result.rows[0];
            const partner_id = chat.user1_id === user_id ? chat.user2_id : chat.user1_id;

            const io = getIo();
            io.to(partner_id).emit('anonymous_chat_ended', { chat_id });
            io.to(user_id).emit('anonymous_chat_ended', { chat_id });

            res.json({ message: 'Chat ended' });
        } else {
            res.status(404).json({ error: 'Active chat not found' });
        }
    } catch (err) {
        res.status(500).json({ error: 'Failed to end chat' });
    }
};

module.exports = { matchUser, getAnonymousMessages, sendAnonymousMessage, endAnonymousChat };
