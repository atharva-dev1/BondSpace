// Server Component — exports generateStaticParams for Next.js static export
// Client-side logic lives in JoinClient.tsx
import JoinClient from './JoinClient';

// Required for Next.js output: 'export' — invite codes resolved client-side
export async function generateStaticParams() {
    return [];
}

export default function JoinPage() {
    return <JoinClient />;
}
