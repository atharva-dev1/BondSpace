"use client";

import React, { useState, useEffect } from 'react';
import TimeCapsuleHub from '@/components/letters/TimeCapsuleHub';
import LetterWriter from '@/components/letters/LetterWriter';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '@/store/useStore';

export default function LettersPage() {
    const { bond, checkAuth } = useStore();
    const [isWriting, setIsWriting] = useState(false);

    useEffect(() => {
        if (!bond) {
            checkAuth();
        }
    }, [bond, checkAuth]);

    return (
        <div className="flex-1 flex flex-col h-full bg-[#080808] overflow-hidden">
            {/* Main Hub View */}
            <TimeCapsuleHub onWriteClick={() => setIsWriting(true)} />

            {/* Writing View - Modal Layer */}
            <AnimatePresence>
                {isWriting && (
                    <LetterWriter
                        onClose={() => setIsWriting(false)}
                        onSealed={() => {
                            // Signal Hub to refresh if needed (Hub handles its own effect on mount/token change)
                        }}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
