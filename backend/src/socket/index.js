const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const { query } = require('../config/database');
const redis = require('../config/redis');
const { encryptMessage } = require('../services/encryptionService');
const { v4: uuidv4 } = require('uuid');

let io;

const initializeSocket = (server) => {
    io = socketIo(server, {
        cors: {
            origin: function (origin, callback) {
                const allowedOrigins = process.env.CLIENT_URL ? [process.env.CLIENT_URL.replace(/\/$/, '')] : [];
                allowedOrigins.push('http://localhost:3000');
                allowedOrigins.push('https://bond-space.vercel.app');
                allowedOrigins.push('https://bondspace.vercel.app');

                if (!origin || allowedOrigins.includes(origin) || (origin && origin.includes('vercel.app'))) {
                    callback(null, true);
                } else {
                    callback(new Error('Not allowed by CORS'));
                }
            },
            methods: ['GET', 'POST'],
            credentials: true,
        },
        transports: ['websocket', 'polling'], // Prefer websockets for stability
        maxHttpBufferSize: 10e6, // 10MB — needed for base64 voice note data URLs
    });

    // Authentication Middleware for Socket
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
            if (!token) return next(new Error('Authentication error'));

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            socket.userId = decoded.id;

            // Fetch user's active couple_id if any to join them to a private room
            const bondRes = await query(
                `SELECT id FROM couples WHERE (user1_id=$1 OR user2_id=$1) AND status='bonded'`,
                [decoded.id]
            );
            if (bondRes.rows.length > 0) {
                socket.coupleId = bondRes.rows[0].id;
            }

            next();
        } catch (err) {
            next(new Error('Authentication error'));
        }
    });

    io.on('connection', async (socket) => {
        console.log(`🔌 User connected: ${socket.userId}`);
        await redis.sAdd('online_users', socket.userId);

        // Join personal room for notifications
        socket.join(socket.userId);

        // Join couple's private space room if bonded
        if (socket.coupleId) {
            socket.join(socket.coupleId);

            // Notify partner of online status
            socket.to(socket.coupleId).emit('partner_status', { online: true, last_seen: null });
        }

        // ==========================================
        // 💬 CHAT EVENTS
        // ==========================================
        socket.on('send_message', async (data) => {
            try {
                const { message, message_type = 'text', media_url, is_disappearing, expires_in_seconds } = data;
                if (!socket.coupleId) return;

                const { encryptedMessage, nonce } = encryptMessage(message || '');
                const expires_at = is_disappearing && expires_in_seconds
                    ? new Date(Date.now() + expires_in_seconds * 1000)
                    : null;

                const result = await query(
                    `INSERT INTO messages (id, couple_id, sender_id, message, message_type, media_url, is_encrypted, nonce, is_disappearing, expires_at, timestamp)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,NOW()) RETURNING *`,
                    [uuidv4(), socket.coupleId, socket.userId, encryptedMessage, message_type, media_url, true, nonce, is_disappearing || false, expires_at]
                );

                const savedMsg = result.rows[0];

                // Since we emit to the room, we send the original plaintext message for real-time immediacy,
                // but the DB stores ONLY the encrypted version.
                // Wait, for true E2E, the client should encrypt/decrypt. But here we do server-side AES-256 for DB.
                // So we send back the server-generated message object + the plaintext ONLY to the connected volatile sockets.
                const realtimeMsg = { ...savedMsg, message };

                io.to(socket.coupleId).emit('receive_message', realtimeMsg);
            } catch (err) {
                console.error('Socket send_message error:', err);
            }
        });

        socket.on('typing', (isTyping) => {
            if (socket.coupleId) {
                socket.to(socket.coupleId).emit('partner_typing', isTyping);
            }
        });

        socket.on('mark_read', async (message_ids) => {
            if (!socket.coupleId || !message_ids || !message_ids.length) return;
            try {
                // Build parameterized query for IN clause
                const placeholders = message_ids.map((_, i) => `$${i + 1}`).join(',');
                await query(`UPDATE messages SET is_read=true WHERE id IN (${placeholders})`, message_ids);

                socket.to(socket.coupleId).emit('messages_read', message_ids);
            } catch (err) {
                console.error('Socket mark_read error:', err);
            }
        });

        socket.on('react_message', async ({ message_id, emoji }) => {
            if (!socket.coupleId) return;
            try {
                await query(
                    'INSERT INTO message_reactions (id, message_id, user_id, emoji) VALUES ($1,$2,$3,$4) ON CONFLICT DO NOTHING',
                    [uuidv4(), message_id, socket.userId, emoji]
                );
                io.to(socket.coupleId).emit('message_reacted', { message_id, user_id: socket.userId, emoji });
            } catch (err) {
                // ignore duplicate reaction errors
            }
        });

        // ==========================================
        // 📍 LOCATION EVENTS
        // ==========================================
        socket.on('ping_location', (loc) => {
            if (socket.coupleId) {
                socket.to(socket.coupleId).emit('partner_location_update', loc);
            }
        });

        // ==========================================
        // 😊 MOOD EVENTS
        // ==========================================
        socket.on('update_mood', async (mood) => {
            if (!socket.userId) return;
            try {
                await query(
                    'UPDATE users SET current_mood = $1, mood_updated_at = NOW() WHERE id = $2',
                    [mood, socket.userId]
                );
                if (socket.coupleId) {
                    socket.to(socket.coupleId).emit('partner_mood_update', { userId: socket.userId, mood });
                }
            } catch (err) {
                console.error('Socket update_mood error:', err);
            }
        });

        // ==========================================
        // 🎮 GAME EVENTS
        // ==========================================
        socket.on('game_move', (data) => {
            if (socket.coupleId) {
                socket.to(socket.coupleId).emit('game_move_received', data);
            }
        });

        // ==========================================
        // 🌍 COMMUNITY EVENTS
        // ==========================================
        socket.on('join_community', (communityId) => {
            socket.join(`community_${communityId}`);
        });

        socket.on('leave_community', (communityId) => {
            socket.leave(`community_${communityId}`);
        });

        socket.on('send_community_message', async (data) => {
            try {
                const { community_id, message } = data;
                // Save to DB
                const result = await query(
                    `INSERT INTO community_messages (id, community_id, user_id, message) VALUES ($1,$2,$3,$4) RETURNING *`,
                    [uuidv4(), community_id, socket.userId, message]
                );

                // Fetch user info to send back
                const userRes = await query('SELECT name, avatar FROM users WHERE id=$1', [socket.userId]);
                const sender = userRes.rows[0];

                const fullMessage = { ...result.rows[0], user_name: sender.name, user_avatar: sender.avatar };

                io.to(`community_${community_id}`).emit('receive_community_message', fullMessage);
            } catch (err) {
                console.error('Socket send_community_message error:', err);
            }
        });

        // ==========================================
        // DISCONNECT
        // ==========================================
        socket.on('disconnect', async () => {
            console.log(`🔴 User disconnected: ${socket.userId}`);
            await redis.sRem('online_users', socket.userId);

            if (socket.coupleId) {
                socket.to(socket.coupleId).emit('partner_status', { online: false, last_seen: new Date() });
            }
        });
    });

    return io;
};

const getIo = () => {
    if (!io) throw new Error('Socket.io not initialized!');
    return io;
};

module.exports = { initializeSocket, getIo };
