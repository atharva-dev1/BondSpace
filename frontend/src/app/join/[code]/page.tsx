// Server Component — exports generateStaticParams for Next.js static export
// Client-side logic lives in JoinClient.tsx
import JoinClient from './JoinClient';

// Force Next.js to treat this as a static page with client-side data
export const dynamic = 'force-static';
export const dynamicParams = false;

// Next.js static export needs at least one path to generate a static HTML file
// We give it a dummy 'code' so it generates /join/default/index.html
export async function generateStaticParams() {
    return [{ code: 'default' }];
}

export default function JoinPage() {
    return <JoinClient />;
}
