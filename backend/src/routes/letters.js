const { query } = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const { encryptMessage, decryptMessage } = require('../services/encryptionService');
const nodeCron = require('node-cron');
const { updateChallengeProgress } = require('./gamification');

// POST /api/letters — Write a love letter to the future
const writeLetter = async (req, res) => {
    try {
        const { to_user, couple_id, content, open_trigger, open_at, media_url } = req.body;
        const { encryptedMessage, nonce } = encryptMessage(content);

        const result = await query(
            `INSERT INTO love_letters (id, from_user, to_user, couple_id, content, is_encrypted, open_trigger, open_at, nonce, media_url)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
            [uuidv4(), req.user.id, to_user, couple_id, encryptedMessage, true, open_trigger, new Date(open_at), nonce, media_url]
        );

        // Phase 20: Daily Challenge Progress (Letter)
        updateChallengeProgress(req.user.id, 'letter');

        res.status(201).json({ letter: result.rows[0], message: '💌 Love letter sealed! It will open on the right day.' });
    } catch (err) {
        console.error('writeLetter error:', err);
        res.status(500).json({ error: 'Failed to write love letter' });
    }
};

// GET /api/letters — Get all letters (sent and received) for the user context
const getAllLetters = async (req, res) => {
    try {
        const userId = req.user.id;
        const result = await query(
            `SELECT ll.*, 
                u_from.name as from_name, u_from.avatar as from_avatar,
                u_to.name as to_name, u_to.avatar as to_avatar
             FROM love_letters ll 
             JOIN users u_from ON ll.from_user = u_from.id
             JOIN users u_to ON ll.to_user = u_to.id
             WHERE ll.from_user = $1 OR ll.to_user = $1
             ORDER BY ll.created_at DESC`,
            [userId]
        );

        const letters = result.rows.map(letter => {
            const isTarget = letter.to_user === userId;
            const canOpen = new Date(letter.open_at) <= new Date();

            // Decrypt only if the current user is the recipient AND it's openable/opened
            let displayContent = '[Sealed]';
            if (letter.from_user === userId || (isTarget && canOpen)) {
                displayContent = letter.is_encrypted
                    ? decryptMessage(letter.content, letter.nonce || '')
                    : letter.content;
            }

            return {
                ...letter,
                content: displayContent,
                is_openable: canOpen && !letter.is_opened && isTarget
            };
        });

        res.json({ letters });
    } catch (err) {
        console.error('getAllLetters error:', err);
        res.status(500).json({ error: 'Failed to get letters history' });
    }
};

// POST /api/letters/:id/open — Mark letter as opened
const openLetter = async (req, res) => {
    try {
        const result = await query(
            'UPDATE love_letters SET is_opened=true, opened_at=NOW() WHERE id=$1 AND to_user=$2 AND open_at <= NOW() RETURNING *',
            [req.params.id, req.user.id]
        );
        if (!result.rows[0]) return res.status(404).json({ error: 'Letter not found or not yet openable' });

        const letter = result.rows[0];
        const content = letter.is_encrypted ? decryptMessage(letter.content, letter.nonce || '') : letter.content;

        res.json({ letter: { ...letter, content }, message: '💌 Letter opened with love!' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to open letter' });
    }
};

// Cron: Send notifications for letters that become openable
const startLetterCron = (io) => {
    nodeCron.schedule('0 * * * *', async () => {
        try {
            const result = await query(
                `SELECT ll.*, u.name as from_name FROM love_letters ll JOIN users u ON ll.from_user = u.id
         WHERE ll.open_at <= NOW() AND ll.is_opened=false AND ll.open_at > NOW() - INTERVAL '1 hour'`
            );
            result.rows.forEach(letter => {
                io?.to(letter.to_user).emit('love_letter_ready', {
                    letter_id: letter.id,
                    from_name: letter.from_name,
                    message: `💌 A love letter from ${letter.from_name} is ready to be opened!`,
                });
            });
        } catch (err) {
            console.error('Letter cron error:', err);
        }
    });
    console.log('💌 Love letter cron started');
};

module.exports = { writeLetter, getAllLetters, openLetter, startLetterCron };
