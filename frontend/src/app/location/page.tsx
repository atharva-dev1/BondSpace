"use client";

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useStore } from '@/store/useStore';
import { API_URL } from '@/lib/utils';
import axios from 'axios';
import { MapPin, Battery, BatteryCharging, Navigation, History, Zap, Map as MapIcon, Heart, Globe as GlobeIcon, ShieldAlert, ShieldCheck, Loader2, X } from 'lucide-react';
import TravelTimeline from '@/components/location/TravelTimeline';
import { motion, AnimatePresence } from 'framer-motion';

// Haversine distance calculator
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return (R * c).toFixed(1);
}

// Leaflet requires window object, so we must load it dynamically with SSR disabled
const FreeMap = dynamic(() => import('@/components/location/FreeMapComponent'), {
    ssr: false,
    loading: () => (
        <div className="w-full h-full bg-black/50 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-rose-500" />
        </div>
    )
});

// React-globe.gl requires window/WebGL, so it also must be dynamically loaded
const GlobeView = dynamic(() => import('@/components/location/GlobeComponent'), {
    ssr: false,
    loading: () => (
        <div className="w-full h-full bg-[#000010] flex items-center justify-center">
            <div className="animate-pulse flex flex-col items-center">
                <GlobeIcon size={32} className="text-rose-500 mb-2 animate-spin" style={{ animationDuration: '3s' }} />
                <span className="text-white/50 text-xs tracking-widest uppercase">Loading Universe...</span>
            </div>
        </div>
    )
});

// Default center (can be user's current location)
const defaultCenter = { lat: 28.6139, lng: 77.2090 };

export default function LocationPage() {
    const { bond, user, token, socket, checkAuth } = useStore();
    const [partnerLocation, setPartnerLocation] = useState<any>(null);
    const [myLocation, setMyLocation] = useState<any>(null);
    const [isTimelineOpen, setIsTimelineOpen] = useState(false);
    const [distance, setDistance] = useState<string | null>(null);
    const [showNudgeAnim, setShowNudgeAnim] = useState(false);
    const [midpoint, setMidpoint] = useState<any>(null);
    const [viewMode, setViewMode] = useState<'2d' | '3d'>('3d');

    // Location Consent States
    const [isRequestingDisable, setIsRequestingDisable] = useState(false);
    const [incomingRequest, setIncomingRequest] = useState<any>(null);
    const [sharingStatus, setSharingStatus] = useState<boolean>(true);
    const [requestLoading, setRequestLoading] = useState(false);
    const [requestStatus, setRequestStatus] = useState<'idle' | 'pending' | 'rejected' | 'approved'>('idle');

    useEffect(() => {
        if (bond && user) {
            const isMeUser1 = bond.user1_id === user.id;
            const myStatus = isMeUser1 ? bond.location_sharing_user1 : bond.location_sharing_user2;
            setSharingStatus(myStatus);
        }
    }, [bond, user]);

    // Calculate distance and clean midpoint on location changes
    useEffect(() => {
        if (myLocation && partnerLocation) {
            setDistance(getDistance(myLocation.lat, myLocation.lng, partnerLocation.lat, partnerLocation.lng));
            if (midpoint) {
                // If they moved significantly, clear the cached midpoint
                setMidpoint(null);
            }
        }
    }, [myLocation, partnerLocation]);

    useEffect(() => {
        // Initial fetch of partner's last known location
        if (bond?.user2_id && token) {
            axios.get(`${API_URL}/location/partner/${bond.user2_id}`, {
                headers: { Authorization: `Bearer ${token}` }
            }).then(res => {
                if (res.data.location) setPartnerLocation(res.data.location);
            }).catch(console.error);
        }
    }, [bond, token]);

    useEffect(() => {
        if (!socket) return;

        socket.on('partner_location_update', (loc) => {
            if (loc.is_nudge) {
                if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
                setShowNudgeAnim(true);
                setTimeout(() => setShowNudgeAnim(false), 3000);
            } else {
                setPartnerLocation(loc);
            }
        });

        socket.on('notification', (notif) => {
            if (notif.type === 'location_consent_request') {
                setIncomingRequest(notif);
            }
        });

        socket.on('location_consent_response', ({ approved }) => {
            setRequestStatus(approved ? 'approved' : 'rejected');
            if (approved) {
                setSharingStatus(false);
                checkAuth(); // Refresh bond to get updated status
            }
            setTimeout(() => {
                setRequestStatus('idle');
                setIsRequestingDisable(false);
            }, 3000);
        });

        // ... (navigator.geolocation update remain same)
        const interval = setInterval(() => {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    async (pos) => {
                        const loc = {
                            lat: pos.coords.latitude,
                            lng: pos.coords.longitude,
                            battery_level: 85, // Simulated battery
                            timestamp: new Date()
                        };
                        setMyLocation(loc);

                        // Send to partner via socket
                        socket.emit('ping_location', loc);

                        // Save to DB every time (for MVP) 
                        try {
                            // Simple simulation of 'home' matching if lat/lng matches roughly 
                            // Can be enhanced later with geocoding
                            const isHomeSimulated = pos.coords.latitude > 28 && pos.coords.latitude < 29 ? 'Home' : 'Current Place';
                            await axios.post(`${API_URL}/location`, {
                                lat: pos.coords.latitude,
                                lng: pos.coords.longitude,
                                battery_level: 85,
                                place_name: isHomeSimulated
                            }, { headers: { Authorization: `Bearer ${token}` } });
                        } catch (err) {
                            console.error('Failed to log location:', err);
                        }
                    },
                    (err) => console.error(err),
                    { enableHighAccuracy: true }
                );
            }
        }, 10000);

        return () => {
            socket.off('partner_location_update');
            clearInterval(interval);
        };
    }, [socket]);

    const handleRequestDisable = async () => {
        setRequestLoading(true);
        setRequestStatus('pending');
        try {
            await axios.post(`${API_URL}/location/request-disable`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
        } catch (err) {
            console.error('Failed to request disable:', err);
            setRequestStatus('idle');
        } finally {
            setRequestLoading(false);
        }
    };

    const handleRespondToRequest = async (approved: boolean) => {
        if (!incomingRequest) return;
        try {
            await axios.post(`${API_URL}/location/respond-disable`, {
                notification_id: incomingRequest.id,
                approved
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setIncomingRequest(null);
            checkAuth();
        } catch (err) {
            console.error('Failed to respond to request:', err);
        }
    };

    const toggleSharing = () => {
        if (sharingStatus) {
            setIsRequestingDisable(true);
        } else {
            axios.post(`${API_URL}/location/respond-disable`, {
                notification_id: 'internal_reenable',
                approved: true,
                force_enable: true
            }, { headers: { Authorization: `Bearer ${token}` } }).then(() => {
                setSharingStatus(true);
                checkAuth();
            }).catch(console.error);
        }
    };

    const handleNudge = () => {
        if (socket && myLocation) {
            socket.emit('ping_location', { ...myLocation, is_nudge: true });
        }
    };

    const findMidpoint = () => {
        if (myLocation && partnerLocation) {
            const midLat = (myLocation.lat + partnerLocation.lat) / 2;
            const midLng = (myLocation.lng + partnerLocation.lng) / 2;
            setMidpoint({ lat: midLat, lng: midLng });
        }
    };

    return (
        <div className={`flex flex-col h-[calc(100vh-100px)] transition-all duration-300 ${showNudgeAnim ? 'bg-rose-500/20' : ''}`}>
            {showNudgeAnim && (
                <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none">
                    <Heart size={120} className="text-rose-500 animate-ping opacity-75" />
                </div>
            )}

            {/* Consent Modal Overlay */}
            <AnimatePresence>
                {isRequestingDisable && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="absolute inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
                            className="bg-gray-900 border border-white/10 p-8 rounded-[2.5rem] max-w-md w-full shadow-2xl relative overflow-hidden"
                        >
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-500 via-purple-500 to-rose-500" />

                            <button onClick={() => setIsRequestingDisable(false)} className="absolute top-4 right-4 p-2 text-gray-500 hover:text-white transition-colors">
                                <X size={20} />
                            </button>

                            <div className="text-center">
                                <div className="w-16 h-16 bg-rose-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                    <ShieldAlert size={32} className="text-rose-500" />
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-3">Mutual Consent Required</h3>
                                <p className="text-gray-400 text-sm leading-relaxed mb-8">
                                    BondSpace locations are for safety and intimacy. You cannot turn off location sharing without your partner's understanding.
                                </p>

                                {requestStatus === 'idle' && (
                                    <button
                                        onClick={handleRequestDisable}
                                        disabled={requestLoading}
                                        className="w-full bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white font-bold py-4 rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2"
                                    >
                                        {requestLoading ? <Loader2 size={18} className="animate-spin" /> : "Request Partner's Consent"}
                                    </button>
                                )}

                                {requestStatus === 'pending' && (
                                    <div className="bg-white/5 border border-white/10 p-4 rounded-2xl">
                                        <Loader2 size={24} className="text-rose-500 animate-spin mx-auto mb-2" />
                                        <p className="text-rose-300 text-xs font-bold uppercase tracking-wider">Waiting for Partner...</p>
                                    </div>
                                )}

                                {requestStatus === 'approved' && (
                                    <div className="bg-emerald-500/20 border border-emerald-500/30 p-4 rounded-2xl">
                                        <ShieldCheck size={24} className="text-emerald-500 mx-auto mb-2" />
                                        <p className="text-emerald-400 text-xs font-bold uppercase tracking-wider">Consent Granted</p>
                                    </div>
                                )}

                                {requestStatus === 'rejected' && (
                                    <div className="bg-rose-500/20 border border-rose-500/30 p-4 rounded-2xl">
                                        <X size={24} className="text-rose-500 mx-auto mb-2" />
                                        <p className="text-rose-400 text-xs font-bold uppercase tracking-wider">Request Declined</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Incoming Request Overlay */}
            <AnimatePresence>
                {incomingRequest && (
                    <motion.div
                        initial={{ opacity: 0, y: -100 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -100 }}
                        className="absolute top-6 left-1/2 -translate-x-1/2 z-[70] w-full max-w-sm px-4"
                    >
                        <div className="bg-gray-900/90 backdrop-blur-md border border-rose-500/30 p-4 rounded-3xl shadow-2xl flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-rose-500 rounded-full flex items-center justify-center shadow-lg">
                                    <ShieldAlert size={20} className="text-white" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs text-rose-400 font-bold uppercase tracking-tight">Privacy Request</p>
                                    <p className="text-xs text-white line-clamp-1">{incomingRequest.body}</p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleRespondToRequest(false)}
                                    className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white text-[10px] font-bold rounded-full transition-colors"
                                >
                                    Decline
                                </button>
                                <button
                                    onClick={() => handleRespondToRequest(true)}
                                    className="px-3 py-1.5 bg-rose-500 hover:bg-rose-600 text-white text-[10px] font-bold rounded-full transition-all shadow-md"
                                >
                                    Approve
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <header className="p-4 glass mt-4 mx-4 rounded-3xl z-30 shadow-lg border-white/5 relative bg-black/40">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-rose-400 to-purple-400 flex items-center gap-2">
                        <Navigation size={20} className="text-rose-400" /> Live Sync
                    </h2>

                    <div className="flex items-center gap-3">
                        {/* Sharing Toggle */}
                        <button
                            onClick={toggleSharing}
                            className={`flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border ${sharingStatus
                                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                                : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                                }`}
                        >
                            {sharingStatus ? <ShieldCheck size={12} /> : <ShieldAlert size={12} />}
                            {sharingStatus ? "Sharing On" : "Sharing Off"}
                        </button>

                        {distance && (
                            <div className="text-xs font-semibold text-rose-300 bg-rose-500/10 px-3 py-1 rounded-full border border-rose-500/20">
                                {distance} km apart
                            </div>
                        )}
                    </div>
                </div>

                {partnerLocation && (
                    <div className="flex items-center gap-4 mt-3">
                        <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full text-xs font-medium text-gray-300 border border-white/10">
                            <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-purple-500 to-rose-500 flex items-center justify-center text-[10px] text-white overflow-hidden shadow-inner">
                                {bond?.user2_name?.[0] || 'P'}
                            </div>
                            <span>{bond?.user2_name || 'Partner'}</span>
                        </div>

                        <div className="flex items-center gap-1.5 bg-emerald-500/10 px-3 py-1.5 rounded-full text-xs font-medium text-emerald-400 border border-emerald-500/20">
                            <MapPin size={12} /> Live
                        </div>

                        {partnerLocation.battery_level && (
                            <div className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-full text-xs font-medium text-gray-300 border border-white/10 ml-auto">
                                {partnerLocation.battery_level > 20 ? <Battery size={14} className="text-emerald-400" /> : <BatteryCharging size={14} className="text-rose-500 animate-pulse" />}
                                {partnerLocation.battery_level}%
                            </div>
                        )}

                        {/* Interactive Features Group */}
                        <div className="flex gap-2 ml-2">
                            <button
                                onClick={handleNudge}
                                className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 rounded-full transition-colors border border-rose-500/30"
                                title="Send Nudge"
                            >
                                <Zap size={16} className="text-rose-400" />
                            </button>
                            <button
                                onClick={findMidpoint}
                                className="p-1.5 bg-purple-500/10 hover:bg-purple-500/20 rounded-full transition-colors border border-purple-500/30"
                                title="Find Meetup Spot"
                            >
                                <MapIcon size={16} className="text-purple-400" />
                            </button>
                            <button
                                onClick={() => setViewMode(viewMode === '2d' ? '3d' : '2d')}
                                className="p-1.5 bg-sky-500/10 hover:bg-sky-500/20 rounded-full transition-colors border border-sky-500/30"
                                title={viewMode === '2d' ? 'Switch to 3D Globe' : 'Switch to 2D Map'}
                            >
                                {viewMode === '2d' ? <GlobeIcon size={16} className="text-sky-400" /> : <MapIcon size={16} className="text-sky-400" />}
                            </button>
                            <button
                                onClick={() => setIsTimelineOpen(true)}
                                className="p-1.5 bg-white/5 hover:bg-white/10 rounded-full transition-colors border border-white/10"
                                title="Travel History"
                            >
                                <History size={16} className="text-gray-300" />
                            </button>
                        </div>
                    </div>
                )}
            </header>

            <div className="flex-1 mt-4 mx-4 mb-4 rounded-3xl overflow-hidden border border-white/10 shadow-2xl relative glow-rose">
                {viewMode === '2d' ? (
                    <FreeMap
                        partnerLocation={partnerLocation}
                        myLocation={myLocation}
                        defaultCenter={defaultCenter}
                        midpoint={midpoint}
                    />
                ) : (
                    <GlobeView
                        partnerLocation={partnerLocation}
                        myLocation={myLocation}
                    />
                )}

                {/* Reached Home overlay demo */}
                {partnerLocation?.is_home && (
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-md px-6 py-2 rounded-full border border-emerald-500/30 text-emerald-400 text-sm font-semibold flex items-center gap-2 shadow-lg z-10 transition-all">
                        🏡 Reached Home Safely
                    </div>
                )}

                <TravelTimeline isOpen={isTimelineOpen} onClose={() => setIsTimelineOpen(false)} />
            </div>
        </div>
    );
}

// Removed Google Maps dark style since CartoDB provides dark tiles via URL
