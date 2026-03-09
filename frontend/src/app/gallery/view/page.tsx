import { Suspense } from 'react';
import AlbumDetailClient from '../[id]/AlbumDetailClient';

export default function GalleryViewPage() {
    return (
        <Suspense fallback={null}>
            <AlbumDetailClient />
        </Suspense>
    );
}
