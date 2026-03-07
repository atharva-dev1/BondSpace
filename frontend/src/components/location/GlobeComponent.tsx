import { useEffect, useRef, useState } from 'react';
import Globe from 'react-globe.gl';

export default function GlobeComponent({ partnerLocation, myLocation }: any) {
    const globeEl = useRef<any>(null);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
    const containerRef = useRef<HTMLDivElement>(null);

    // Responsive globe sizing
    useEffect(() => {
        if (!containerRef.current) return;
        const observer = new ResizeObserver((entries) => {
            for (let entry of entries) {
                setDimensions({
                    width: entry.contentRect.width,
                    height: entry.contentRect.height
                });
            }
        });
        observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, []);

    // Setup Points and Arcs
    const arcsData = partnerLocation && myLocation ? [{
        startLat: partnerLocation.lat,
        startLng: partnerLocation.lng,
        endLat: myLocation.lat,
        endLng: myLocation.lng,
        color: ['#ec4899', '#8b5cf6'] // Pink to purple gradient
    }] : [];

    const pointsData = [
        ...(partnerLocation ? [{ lat: partnerLocation.lat, lng: partnerLocation.lng, label: 'Partner', color: '#ec4899' }] : []),
        ...(myLocation ? [{ lat: myLocation.lat, lng: myLocation.lng, label: 'Me', color: '#60a5fa' }] : [])
    ];

    useEffect(() => {
        // Point the camera to the midpoint or current location after render
        setTimeout(() => {
            if (globeEl.current && partnerLocation && myLocation) {
                const midLat = (partnerLocation.lat + myLocation.lat) / 2;
                const midLng = (partnerLocation.lng + myLocation.lng) / 2;
                // Calculate rough altitude based on distance
                const distLat = Math.abs(partnerLocation.lat - myLocation.lat);
                const distLng = Math.abs(partnerLocation.lng - myLocation.lng);
                const maxDist = Math.max(distLat, distLng);
                const altitude = Math.min(Math.max(maxDist / 40, 0.5), 2.5);

                globeEl.current.pointOfView({ lat: midLat, lng: midLng, altitude }, 2000);
            } else if (globeEl.current && myLocation) {
                globeEl.current.pointOfView({ lat: myLocation.lat, lng: myLocation.lng, altitude: 0.8 }, 2000);
            }
        }, 500); // Wait for texture load
    }, [partnerLocation, myLocation]);

    useEffect(() => {
        if (globeEl.current) {
            // Auto-rotate the globe slowly for a cinematic effect
            globeEl.current.controls().autoRotate = true;
            globeEl.current.controls().autoRotateSpeed = 0.5;
        }
    }, [dimensions]);

    return (
        <div ref={containerRef} className="w-full h-full relative cursor-move bg-[#000010] rounded-3xl overflow-hidden">
            {dimensions.width > 0 && (
                <Globe
                    ref={globeEl}
                    width={dimensions.width}
                    height={dimensions.height}
                    // Free dark blue/night map from UN/NASA dataset 
                    globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
                    backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
                    arcsData={arcsData}
                    arcColor="color"
                    arcDashLength={0.4}
                    arcDashGap={0.2}
                    arcDashAnimateTime={2500}
                    arcStroke={2}
                    pointsData={pointsData}
                    pointColor="color"
                    pointAltitude={0.05}
                    pointRadius={0.5}
                    labelsData={pointsData}
                    labelLat={d => (d as any).lat}
                    labelLng={d => (d as any).lng}
                    labelText={d => (d as any).label}
                    labelSize={1.5}
                    labelDotRadius={0.4}
                    labelColor={() => 'rgba(255,255,255,0.7)'}
                    labelResolution={2}
                    atmosphereColor="#ec4899"
                    atmosphereAltitude={0.15}
                />
            )}
            <div className="absolute bottom-4 left-4 z-10 text-[10px] text-white/40 pointer-events-none">
                Interactive 3D Map
            </div>
        </div>
    );
}
