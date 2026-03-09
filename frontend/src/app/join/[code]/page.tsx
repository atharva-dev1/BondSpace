// Server Component — exports generateStaticParams for Next.js static export
// Client-side logic lives in JoinClient.tsx
import JoinClient from './JoinClient';

// Force Next.js to treat this as a static page ONLY for mobile builds
// STATIC_EXPORT export const dynamic = 'force-static';
// STATIC_EXPORT export const dynamicParams = false;

// Next.js static export needs at least one path to generate a static HTML file
// STATIC_EXPORT export async function generateStaticParams() {
// STATIC_EXPORT     return [{ code: 'default' }];
// STATIC_EXPORT }

export default function JoinPage() {
    return <JoinClient />;
}
