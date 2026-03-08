// Server Component — exports generateStaticParams for Next.js static export
// Client-side logic lives in AlbumDetailClient.tsx
import AlbumDetailClient from '../AlbumDetailClient';

// Required for Next.js output: 'export' — returns [] so all IDs are
// handled client-side at runtime via useParams()
export async function generateStaticParams() {
    return [];
}

export default function AlbumDetailPage() {
    return <AlbumDetailClient />;
}
