const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

// POST /api/auth/register
const register = async (req, res) => {
    try {
        const { name, email, password, phone } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Name, email, and password required' });
        }

        const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
        if (existing.rows.length > 0) {
            return res.status(409).json({ error: 'Email already registered' });
        }

        const hash = await bcrypt.hash(password, parseInt(process.env.BCRYPT_ROUNDS) || 12);
        const result = await query(
            'INSERT INTO users (id, name, email, password_hash, phone) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, avatar',
            [uuidv4(), name, email, hash, phone || null]
        );

        const user = result.rows[0];
        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

        res.status(201).json({ user, token, message: 'Account created successfully! 💕' });
    } catch (err) {
        console.error('Register error:', err);
        res.status(500).json({ error: 'Server error during registration' });
    }
};

// POST /api/auth/login
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password required' });
        }

        const result = await query('SELECT * FROM users WHERE email = $1', [email]);
        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = result.rows[0];
        const valid = await bcrypt.compare(password, user.password_hash);
        if (!valid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

        delete user.password_hash;
        res.json({ user, token, message: 'Welcome back! 💖' });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Server error during login' });
    }
};

// GET /api/auth/me
const getMe = async (req, res) => {
    try {
        const result = await query(
            'SELECT id, name, username, email, phone, avatar, bio, gender, love_language, timezone, is_verified, profile_complete, created_at FROM users WHERE id = $1',
            [req.user.id]
        );
        res.json({ user: result.rows[0] });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
};

// PUT /api/auth/profile
const updateProfile = async (req, res) => {
    try {
        const { name, bio, gender, love_language, timezone, avatar } = req.body;
        // Mark profile complete if all core fields are provided
        const profileComplete = !!(name && gender && avatar);
        const result = await query(
            `UPDATE users SET 
                name = COALESCE($1, name),
                bio = COALESCE($2, bio),
                gender = COALESCE($3, gender),
                love_language = COALESCE($4, love_language),
                timezone = COALESCE($5, timezone),
                avatar = COALESCE($6, avatar),
                profile_complete = CASE WHEN $7 THEN TRUE ELSE profile_complete END,
                updated_at = NOW()
            WHERE id = $8 
            RETURNING id, name, bio, gender, love_language, timezone, avatar, profile_complete`,
            [name || null, bio || null, gender || null, love_language || null, timezone || null, avatar || null, profileComplete, req.user.id]
        );
        res.json({ user: result.rows[0], message: 'Profile updated 💫' });
    } catch (err) {
        console.error('Update profile error:', err);
        res.status(500).json({ error: 'Failed to update profile' });
    }
};

module.exports = { register, login, getMe, updateProfile };
