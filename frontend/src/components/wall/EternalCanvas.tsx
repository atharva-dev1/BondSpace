"use client";

import React, { useEffect, useRef, useState } from 'react';
import * as fabric from 'fabric';
import { useStore } from '@/store/useStore';
import { API_URL } from '@/lib/utils';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Pencil,
    Type,
    Image as ImageIcon,
    StickyNote,
    Eraser,
    Trash2,
    Download,
    ZoomIn,
    ZoomOut,
    Hand,
    MousePointer2
} from 'lucide-react';

export default function EternalCanvas() {
    const { socket, bond, token, user } = useStore();
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
    const [tool, setTool] = useState<'select' | 'pen' | 'text' | 'eraser' | 'pan'>('pen');
    const [isLoaded, setIsLoaded] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);

    // Initialize Canvas
    useEffect(() => {
        if (!canvasRef.current) return;

        const canvas = new fabric.Canvas(canvasRef.current, {
            width: window.innerWidth,
            height: window.innerHeight - 160, // Subtracting header/footer approx
            backgroundColor: '#080808',
            isDrawingMode: true
        });

        fabricCanvasRef.current = canvas;

        // Configure Pen
        canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
        canvas.freeDrawingBrush.width = 3;
        canvas.freeDrawingBrush.color = '#f43f5e'; // Default Rose

        // Load existing elements from DB
        loadWall(canvas);

        // Socket listeners
        if (socket) {
            socket.on('wall:element:added', (element: any) => {
                handleRemoteAdd(canvas, element);
            });
            socket.on('wall:element:updated', (data: any) => {
                handleRemoteUpdate(canvas, data);
            });
            socket.on('wall:element:removed', (id: string) => {
                handleRemoteRemove(canvas, id);
            });
            socket.on('wall:cleared', () => {
                canvas.clear();
                canvas.backgroundColor = '#080808';
            });
        }

        // Canvas Events
        canvas.on('path:created', (opt: any) => {
            if (isSyncing) return;
            const path = opt.path;
            const elementData = path.toObject();
            socket?.emit('wall:element:add', { type: 'path', elementData });
        });

        canvas.on('object:modified', (opt: any) => {
            if (isSyncing) return;
            const obj = opt.target;
            if (obj && obj.id) {
                socket?.emit('wall:element:update', {
                    id: obj.id,
                    elementData: obj.toObject(['id'])
                });
            }
        });

        return () => {
            canvas.dispose();
            socket?.off('wall:element:added');
            socket?.off('wall:element:updated');
            socket?.off('wall:element:removed');
            socket?.off('wall:cleared');
        };
    }, [socket, bond?.id]);

    const loadWall = async (canvas: fabric.Canvas) => {
        try {
            const res = await axios.get(`${API_URL}/wall`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const elements = res.data.elements;

            setIsSyncing(true);
            for (const el of elements) {
                await addElementToCanvas(canvas, el, false);
            }
            setIsSyncing(false);
            setIsLoaded(true);
        } catch (err) {
            console.error('Failed to load wall:', err);
        }
    };

    const addElementToCanvas = async (canvas: fabric.Canvas, element: any, isNew: boolean = true) => {
        try {
            const objects = await fabric.util.enlivenObjects([element.data]);
            const obj = objects[0] as fabric.FabricObject;
            if (obj && typeof obj.set === 'function') {
                // @ts-ignore
                obj.set('id', element.id); // Important for sync
                canvas.add(obj);
                if (isNew) canvas.renderAll();
            }
        } catch (err) {
            console.error('Error enlivening object:', err);
        }
    };

    const handleRemoteAdd = async (canvas: fabric.Canvas, element: any) => {
        setIsSyncing(true);
        await addElementToCanvas(canvas, element);
        setIsSyncing(false);
    };

    const handleRemoteUpdate = (canvas: fabric.Canvas, data: any) => {
        setIsSyncing(true);
        const obj = canvas.getObjects().find((o: any) => o.id === data.id);
        if (obj) {
            obj.set(data.data);
            obj.setCoords();
            canvas.renderAll();
        }
        setIsSyncing(false);
    };

    const handleRemoteRemove = (canvas: fabric.Canvas, id: string) => {
        const obj = canvas.getObjects().find((o: any) => o.id === id);
        if (obj) {
            canvas.remove(obj);
            canvas.renderAll();
        }
    };

    const switchTool = (newTool: typeof tool) => {
        setTool(newTool);
        const canvas = fabricCanvasRef.current;
        if (!canvas) return;

        canvas.isDrawingMode = newTool === 'pen';
        canvas.selection = newTool === 'select';

        if (newTool === 'select') {
            canvas.getObjects().forEach(obj => obj.selectable = true);
        } else {
            canvas.getObjects().forEach(obj => obj.selectable = false);
        }
    };

    const handleClear = () => {
        if (window.confirm('Are you sure you want to clear the Eternal Wall? This cannot be undone.')) {
            fabricCanvasRef.current?.clear();
            fabricCanvasRef.current!.backgroundColor = '#080808';
            socket?.emit('wall:clear');
        }
    };

    return (
        <div className="flex-1 flex flex-col relative h-full overflow-hidden bg-[#080808]">
            {/* Toolbar */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1 px-2 py-2 bg-black/60 backdrop-blur-3xl border border-white/10 rounded-2xl shadow-2xl max-w-[calc(100vw-2rem)] overflow-x-auto no-scrollbar">
                <ToolButton
                    active={tool === 'select'}
                    onClick={() => switchTool('select')}
                    icon={<MousePointer2 size={18} />}
                    label="Select"
                />
                <ToolButton
                    active={tool === 'pen'}
                    onClick={() => switchTool('pen')}
                    icon={<Pencil size={18} />}
                    label="Draw"
                />
                <ToolButton
                    active={tool === 'text'}
                    onClick={() => {/* TODO: Text mode */ }}
                    icon={<Type size={18} />}
                    label="Text"
                />
                <div className="w-px h-6 bg-white/10 mx-1 shrink-0" />
                <button
                    onClick={handleClear}
                    className="p-3 rounded-xl text-white/40 hover:text-rose-500 hover:bg-rose-500/10 transition-all shrink-0"
                >
                    <Trash2 size={18} />
                </button>
            </div>

            {/* Canvas */}
            <div className="flex-1 relative touch-none">
                <canvas ref={canvasRef} />
                {!isLoaded && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-40">
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-12 h-12 border-4 border-rose-500/30 border-t-rose-500 rounded-full animate-spin" />
                            <p className="text-white/40 text-xs font-black uppercase tracking-widest">Waking up the wall...</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Zoom Controls */}
            <div className="absolute bottom-28 right-4 z-30 flex flex-col gap-2">
                <button className="w-12 h-12 rounded-2xl bg-black/60 backdrop-blur-3xl border border-white/10 flex items-center justify-center text-white/60 hover:text-white transition-all">
                    <ZoomIn size={20} />
                </button>
                <button className="w-12 h-12 rounded-2xl bg-black/60 backdrop-blur-3xl border border-white/10 flex items-center justify-center text-white/60 hover:text-white transition-all">
                    <ZoomOut size={20} />
                </button>
            </div>
        </div>
    );
}

function ToolButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
    return (
        <button
            onClick={onClick}
            className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-all ${active ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20' : 'text-white/40 hover:text-white hover:bg-white/5'
                }`}
        >
            {icon}
            <span className="text-[8px] uppercase font-black tracking-widest">{label}</span>
        </button>
    );
}
