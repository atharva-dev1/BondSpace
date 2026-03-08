const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

// Routes
const authRoutes = require('./routes/auth');
const bondRoutes = require('./routes/bond');
const messageRoutes = require('./routes/messages');
const locationRoutes = require('./routes/location');
const gameRoutes = require('./routes/games');
const galleryRoutes = require('./routes/gallery');
const aiGuruRoutes = require('./routes/aiGuru');
const gamificationRoutes = require('./routes/gamification');
const letterRoutes = require('./routes/letters');
const healthRoutes = require('./routes/healthScore');
const communityRoutes = require('./routes/community');
const goalRoutes = require('./routes/goals');
const inviteRoutes = require('./routes/invite');
const anonymousChatRoutes = require('./routes/anonymous_chat');
const wallRoutes = require('./routes/wall');
const plannerRoutes = require('./routes/planner');
const storeRoutes = require('./routes/store');

// ==========================================
// 🛡️ AUTHENTICATION & SECURITY
// ==========================================

// Middleware
const authMiddleware = require('./middleware/auth');

const logger = require('./lib/logger');

const app = express();

const isProduction = process.env.NODE_ENV === 'production';

// Security & Utility
app.use(helmet());
const allowedOrigins = process.env.CLIENT_URL ? [process.env.CLIENT_URL.replace(/\/$/, '')] : [];
allowedOrigins.push('http://localhost:3000');
allowedOrigins.push('https://bond-space.vercel.app'); // Exact Vercel URL
allowedOrigins.push('https://bondspace.vercel.app');

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps) or if it's in our allowed list
        if (!origin || allowedOrigins.includes(origin) || (origin && origin.includes('vercel.app'))) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(morgan(isProduction ? 'combined' : 'dev'));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 min
    max: 200, // limit each IP to 200 requests per window
    message: 'Too many requests from this IP, please try again later.',
});
app.use('/api', limiter);

// Mount public routes
app.post('/api/auth/register', authRoutes.register);
app.post('/api/auth/login', authRoutes.login);
app.get('/api/communities', communityRoutes.getCommunities);
app.get('/api/bond/invite/check/:code', inviteRoutes.checkInvite); // public check

// Apply auth middleware to all subsequent routes
app.use('/api', authMiddleware);

// Protect Auth
app.get('/api/auth/me', authRoutes.getMe);
app.put('/api/auth/profile', authRoutes.updateProfile);

// Bond & Lock
app.post('/api/bond/request', bondRoutes.sendRequest);
app.post('/api/bond/accept', bondRoutes.acceptRequest);
app.post('/api/bond/set-passcode', bondRoutes.setPasscode);
app.post('/api/bond/verify-lock', bondRoutes.verifyLock);
app.post('/api/bond/disconnect', bondRoutes.disconnect);
app.get('/api/bond/my-bond', bondRoutes.getMyBond);
// Invite links
app.post('/api/bond/invite', inviteRoutes.createInvite);
app.post('/api/bond/join/:code', inviteRoutes.joinWithCode);

// Chat & Messages
app.get('/api/messages/:couple_id', messageRoutes.getMessages);
app.post('/api/messages', messageRoutes.sendMessage);
app.post('/api/messages/:id/pin', messageRoutes.pinMessage);
app.get('/api/messages/:couple_id/pinned', messageRoutes.getPinnedMessages);
app.post('/api/messages/:id/react', messageRoutes.addReaction);

// Location
app.post('/api/location', locationRoutes.updateLocation);
app.get('/api/location/partner/:partner_id', locationRoutes.getPartnerLocation);
app.get('/api/location/history/:user_id', locationRoutes.getLocationHistory);
app.get('/api/location/battery/:partner_id', locationRoutes.getPartnerBattery);
app.post('/api/location/request-disable', locationRoutes.requestDisableLocation);
app.post('/api/location/respond-disable', locationRoutes.respondToDisableRequest);

// Games
app.get('/api/games', gameRoutes.getAllGames);
app.get('/api/games/active/:couple_id', gameRoutes.getActiveSession);
app.post('/api/games/session/start', gameRoutes.startSession);
app.get('/api/games/session/:session_id', gameRoutes.getSession);
app.post('/api/games/session/:session_id/action', gameRoutes.submitAction);
app.post('/api/games/session/:session_id/end', gameRoutes.endSession);
app.post('/api/games/session/:session_id/abandon', gameRoutes.abandonSession);

// Gallery
app.get('/api/gallery/albums/:couple_id', galleryRoutes.getAlbums);
app.get('/api/gallery/album/:id', galleryRoutes.getAlbum);
app.post('/api/gallery/albums', galleryRoutes.createAlbum);
app.post('/api/gallery/upload', galleryRoutes.upload.single('media'), galleryRoutes.uploadMedia);
app.get('/api/gallery/media/:album_id', galleryRoutes.getAlbumMedia);
app.get('/api/gallery/timeline/:couple_id', galleryRoutes.getTimeline);
app.post('/api/gallery/timeline', galleryRoutes.addTimelineEvent);
app.post('/api/gallery/timeline/upload', galleryRoutes.upload.single('media'), galleryRoutes.uploadTimelineMedia);

// AI Guru
app.post('/api/ai/guru', aiGuruRoutes.chatWithGuru);
app.post('/api/ai/analyse-tone', aiGuruRoutes.analyseTone);
app.get('/api/ai/guru/history/:couple_id', aiGuruRoutes.getGuruHistory);
app.post('/api/ai/plan-activity', aiGuruRoutes.planActivity);

// Gamification & Points
app.post('/api/gamification/checkin', gamificationRoutes.dailyCheckin);
app.get('/api/gamification/stats/:user_id', gamificationRoutes.getStats);
app.get('/api/gamification/unlockables/:user_id', gamificationRoutes.getUnlockables);

// Love Letters
app.post('/api/letters', letterRoutes.writeLetter);
app.get('/api/letters', letterRoutes.getAllLetters);
app.post('/api/letters/:id/open', letterRoutes.openLetter);

// Health Score
app.post('/api/health/calculate/:couple_id', healthRoutes.calculateHealthScore);
app.get('/api/health/:couple_id', healthRoutes.getHealthScore);

// Communities
app.get('/api/communities/:slug/members', communityRoutes.getCommunityMembers);
app.post('/api/communities/:slug/join', communityRoutes.joinCommunity);
app.get('/api/communities/:communityId/messages', communityRoutes.getCommunityMessages);

// Anonymous Chat
app.post('/api/chat/anonymous/match', anonymousChatRoutes.matchUser);
app.get('/api/chat/anonymous/:chat_id', anonymousChatRoutes.getAnonymousMessages);
app.post('/api/chat/anonymous/message', anonymousChatRoutes.sendAnonymousMessage);
app.post('/api/chat/anonymous/end', anonymousChatRoutes.endAnonymousChat);
app.use('/api/anonymous', anonymousChatRoutes);
app.use('/api/wall', wallRoutes);

// ==========================================
// 🚀 SERVER INITIALIZATION
// ==========================================
// Couple Goals
app.get('/api/goals/:couple_id', goalRoutes.getGoals);
app.post('/api/goals', goalRoutes.createGoal);
app.put('/api/goals/:id', goalRoutes.updateProgress);

// Planner
app.get('/api/planner/:couple_id', plannerRoutes.getPlannedEvents);
app.post('/api/planner/event', plannerRoutes.createEvent);
app.put('/api/planner/event/:id', plannerRoutes.updateEvent);

// Store
app.get('/api/store', storeRoutes.getStoreData);
app.post('/api/store/purchase', storeRoutes.purchaseItem);

// Health Check
app.get('/', (req, res) => res.json({ message: "BondSpace API is online! 💖🚀", status: "alive" }));
app.get('/health', (req, res) => res.json({ status: 'ok', time: new Date() }));

// Error handling
app.use((err, req, res, next) => {
    logger.error(`${req.method} ${req.url} - ${err.message}`, err.stack);

    const response = {
        error: isProduction ? 'Internal Server Error' : err.message
    };

    if (!isProduction) {
        response.stack = err.stack;
    }

    res.status(err.status || 500).json(response);
});

module.exports = app;
