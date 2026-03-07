const { query } = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const cloudinary = require('../config/cloudinary');
const multer = require('multer');

// Multer memory storage for Cloudinary uploads
const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } }); // 50MB limit

// Helper: upload buffer to Cloudinary
const uploadToCloudinary = (buffer, options = {}) =>
    new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: 'bondspace',
                resource_type: 'auto',
                timeout: 60000, // 60s timeout
                ...options
            },
            (err, result) => {
                if (err) {
                    console.error('[Cloudinary Stream Error]', err);
                    return reject(err);
                }
                resolve(result);
            }
        );
        uploadStream.end(buffer);
    });

// GET /api/gallery/album/:id — Get single album
const getAlbum = async (req, res) => {
    try {
        const result = await query('SELECT * FROM gallery_albums WHERE id=$1', [req.params.id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Album not found' });
        res.json({ album: result.rows[0] });
    } catch (err) {
        res.status(500).json({ error: 'Failed to get album' });
    }
};

// GET /api/gallery/albums/:couple_id
const getAlbums = async (req, res) => {
    try {
        const result = await query(
            `SELECT ga.*, COUNT(gm.id)::int as media_count
       FROM gallery_albums ga
       LEFT JOIN gallery_media gm ON gm.album_id = ga.id
       WHERE ga.couple_id=$1 GROUP BY ga.id ORDER BY ga.created_at DESC`,
            [req.params.couple_id]
        );
        res.json({ albums: result.rows });
    } catch (err) {
        res.status(500).json({ error: 'Failed to get albums' });
    }
};

// POST /api/gallery/albums — Create album
const createAlbum = async (req, res) => {
    try {
        const { couple_id, title, template } = req.body;
        const result = await query(
            'INSERT INTO gallery_albums (id, couple_id, title, template) VALUES ($1,$2,$3,$4) RETURNING *',
            [uuidv4(), couple_id, title, template || 'custom']
        );
        res.status(201).json({ album: result.rows[0], message: '📸 Album created!' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to create album' });
    }
};

// POST /api/gallery/upload — Upload media to Cloudinary
const uploadMedia = async (req, res) => {
    try {
        const { album_id, couple_id, caption } = req.body;
        if (!req.file) return res.status(400).json({ error: 'No file provided' });

        const result = await uploadToCloudinary(req.file.buffer, {
            folder: `bondspace/${couple_id}`
        });

        const media = await query(
            `INSERT INTO gallery_media (id, album_id, couple_id, media_url, cloudinary_public_id, media_type, caption)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
            [uuidv4(), album_id, couple_id, result.secure_url, result.public_id,
            result.resource_type === 'video' ? 'video' : 'image', caption]
        );

        // Update album cover if not set
        await query(`UPDATE gallery_albums SET cover_url=$1 WHERE id=$2 AND cover_url IS NULL`, [result.secure_url, album_id]);

        res.status(201).json({ media: media.rows[0], cloudinary_url: result.secure_url });
    } catch (err) {
        console.error('[uploadMedia] FATAL error:', err);
        res.status(500).json({ error: 'Upload failed', details: err instanceof Error ? err.message : String(err) });
    }
};

// GET /api/gallery/media/:album_id — Get media in album
const getAlbumMedia = async (req, res) => {
    try {
        console.log('[getAlbumMedia] Fetching media for album:', req.params.album_id);
        const result = await query(
            'SELECT * FROM gallery_media WHERE album_id=$1 ORDER BY timestamp DESC',
            [req.params.album_id]
        );
        console.log('[getAlbumMedia] Found items:', result.rows.length);
        res.json({ media: result.rows });
    } catch (err) {
        console.error('[getAlbumMedia] Error:', err);
        res.status(500).json({ error: 'Failed to get media' });
    }
};

// GET /api/gallery/timeline/:couple_id — Relationship timeline events
const getTimeline = async (req, res) => {
    try {
        const result = await query(
            'SELECT * FROM timeline_events WHERE couple_id=$1 ORDER BY event_date ASC',
            [req.params.couple_id]
        );
        res.json({ timeline: result.rows });
    } catch (err) {
        res.status(500).json({ error: 'Failed to get timeline' });
    }
};

// POST /api/gallery/timeline — Add timeline event
const addTimelineEvent = async (req, res) => {
    try {
        const { couple_id, event_type, label, description, media_url, event_date } = req.body;
        const result = await query(
            'INSERT INTO timeline_events (id, couple_id, event_type, label, description, media_url, event_date) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *',
            [uuidv4(), couple_id, event_type, label, description, media_url, event_date]
        );
        res.status(201).json({ event: result.rows[0] });
    } catch (err) {
        res.status(500).json({ error: 'Failed to add timeline event' });
    }
};

module.exports = { getAlbums, getAlbum, createAlbum, uploadMedia, getAlbumMedia, getTimeline, addTimelineEvent, upload };
