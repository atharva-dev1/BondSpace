// Server Component — exports generateStaticParams for Next.js static export
// Client-side logic lives in AlbumDetailClient.tsx
import AlbumDetailClient from './AlbumDetailClient';

// Force Next.js to treat this as a static page with client-side data
export const dynamic = 'force-static';
export const dynamicParams = false;

// Next.js static export needs at least one path to generate a static HTML file
// We give it a dummy 'id' so it generates /gallery/default/index.html
export async function generateStaticParams() {
    return [{ id: 'default' }];
}

export default function AlbumDetailPage() {
    return <AlbumDetailClient />;
}
