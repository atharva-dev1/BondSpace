import { Suspense } from 'react';
import AlbumDetailClient from './AlbumDetailClient';

export default function AlbumDetailPage() {
    return (
        <Suspense fallback={null}>
            <AlbumDetailClient />
        </Suspense>
    );
}
