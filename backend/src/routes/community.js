const { query } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

// GET /api/communities — List all communities
const getCommunities = async (req, res) => {
    try {
        const result = await query('SELECT * FROM communities ORDER BY member_count DESC');
        res.json({ communities: result.rows });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch communities' });
    }
};

// GET /api/communities/:slug/members — Get community members
const getCommunityMembers = async (req, res) => {
    try {
        const result = await query(
            `SELECT u.id, u.name, u.avatar, cm.role, cm.joined_at
       FROM community_members cm
       JOIN users u ON cm.user_id = u.id
       JOIN communities c ON cm.community_id = c.id
       WHERE c.slug=$1`,
            [req.params.slug]
        );
        res.json({ members: result.rows });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch members' });
    }
};

// POST /api/communities/:slug/join — Join a community
const joinCommunity = async (req, res) => {
    try {
        const userId = req.user.id;
        const { slug } = req.params;

        const commRes = await query('SELECT id FROM communities WHERE slug=$1', [slug]);
        if (!commRes.rows[0]) return res.status(404).json({ error: 'Community not found' });
        const communityId = commRes.rows[0].id;

        // Insert member and increment count
        await query(
            'INSERT INTO community_members (community_id, user_id) VALUES ($1,$2) ON CONFLICT DO NOTHING',
            [communityId, userId]
        );
        await query('UPDATE communities SET member_count = member_count + 1 WHERE id=$1', [communityId]);

        res.json({ message: 'Welcome to the community! 🎉' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to join community' });
    }
};

// GET /api/communities/:communityId/messages — Get community chat history
const getCommunityMessages = async (req, res) => {
    try {
        const { communityId } = req.params;
        const result = await query(
            `SELECT cm.*, u.name as user_name, u.avatar as user_avatar 
             FROM community_messages cm
             JOIN users u ON cm.user_id = u.id
             WHERE cm.community_id = $1
             ORDER BY cm.timestamp ASC 
             LIMIT 50`,
            [communityId]
        );
        res.json({ messages: result.rows });
    } catch (err) {
        console.error('Failed to fetch community messages:', err);
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
};

module.exports = { getCommunities, getCommunityMembers, joinCommunity, getCommunityMessages };
