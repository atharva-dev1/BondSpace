// Server Component — exports generateStaticParams for Next.js static export
// Client-side logic lives in AlbumDetailClient.tsx
import AlbumDetailClient from './AlbumDetailClient';

// Force Next.js to treat this as a static page with client-side data ONLY for mobile builds
export const dynamic = process.env.MOBILE_BUILD === 'true' ? 'force-static' : 'auto';
export const dynamicParams = process.env.MOBILE_BUILD === 'true' ? false : true;

// Next.js static export needs at least one path to generate a static HTML file
// We give it a dummy 'id' so it generates /gallery/default/index.html
export async function generateStaticParams() {
    return [{ id: 'default' }];
}

export default function AlbumDetailPage() {
    return <AlbumDetailClient />;
}
