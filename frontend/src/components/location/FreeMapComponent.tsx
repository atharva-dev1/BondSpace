import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMap, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet icons in Next.js
const customIcon = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/833/833472.png', // Heart pin
    iconSize: [40, 40],
    iconAnchor: [20, 40],
});

const myIcon = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/2838/2838912.png', // Blue dot
    iconSize: [30, 30],
    iconAnchor: [15, 15],
});

const midpointIcon = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/3075/3075977.png', // Coffee cup for meetup
    iconSize: [35, 35],
    iconAnchor: [17, 35],
});

// Component to dynamically change map view and bounds based on both user locations
function MapBoundsUpdater({ partnerLoc, myLoc, defaultCenter, midpoint }: any) {
    const map = useMap();
    useEffect(() => {
        if (partnerLoc && myLoc) {
            // Fit both users on the screen
            const bounds = L.latLngBounds(
                [partnerLoc.lat, partnerLoc.lng],
                [myLoc.lat, myLoc.lng]
            );
            // Padding ensures markers aren't cut off at the edges
            map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
        } else if (partnerLoc) {
            map.setView([partnerLoc.lat, partnerLoc.lng], 14);
        } else if (myLoc) {
            map.setView([myLoc.lat, myLoc.lng], 14);
        } else if (defaultCenter) {
            map.setView([defaultCenter.lat, defaultCenter.lng], 14);
        }
    }, [partnerLoc, myLoc, defaultCenter, map]);
    return null;
}

export default function FreeMapComponent({
    partnerLocation,
    myLocation,
    defaultCenter,
    midpoint
}: {
    partnerLocation: any,
    myLocation: any,
    defaultCenter: { lat: number, lng: number },
    midpoint?: { lat: number, lng: number }
}) {
    const center = partnerLocation || myLocation || defaultCenter;

    return (
        <MapContainer
            center={[center.lat, center.lng]}
            zoom={14}
            zoomControl={false}
            style={{ width: '100%', height: '100%', background: '#1c1c1c' }}
        >
            {/* Dark themed free tiles from CartoDB */}
            <TileLayer
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            />

            <MapBoundsUpdater
                partnerLoc={partnerLocation}
                myLoc={myLocation}
                defaultCenter={defaultCenter}
                midpoint={midpoint}
            />

            {/* Glowing line connecting the couple if both locations are known */}
            {partnerLocation && myLocation && (
                <>
                    {/* Inner glowing core */}
                    <Polyline
                        positions={[
                            [partnerLocation.lat, partnerLocation.lng],
                            [myLocation.lat, myLocation.lng]
                        ]}
                        pathOptions={{ color: '#f43f5e', weight: 3, opacity: 0.8, dashArray: '8, 8' }}
                    />
                    {/* Outer ambient glow */}
                    <Polyline
                        positions={[
                            [partnerLocation.lat, partnerLocation.lng],
                            [myLocation.lat, myLocation.lng]
                        ]}
                        pathOptions={{ color: '#c084fc', weight: 8, opacity: 0.2 }}
                    />
                </>
            )}

            {partnerLocation && (
                <Marker position={[partnerLocation.lat, partnerLocation.lng]} icon={customIcon} />
            )}

            {myLocation && (
                <Marker position={[myLocation.lat, myLocation.lng]} icon={myIcon} />
            )}

            {midpoint && (
                <Marker position={[midpoint.lat, midpoint.lng]} icon={midpointIcon} />
            )}
        </MapContainer>
    );
}
