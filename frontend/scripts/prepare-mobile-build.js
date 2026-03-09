const fs = require('fs');
const path = require('path');

const filesToFix = [
    'src/app/join/[code]/page.tsx',
    'src/app/gallery/[id]/page.tsx'
];

const isRevert = process.argv.includes('--revert');

console.log(`🚀 ${isRevert ? 'Reverting' : 'Preparing'} mobile build configurations...`);

filesToFix.forEach(fileRelPath => {
    const fullPath = path.join(__dirname, '..', fileRelPath);

    if (!fs.existsSync(fullPath)) {
        console.warn(`⚠️ Warning: File not found - ${fullPath}`);
        return;
    }

    try {
        const content = fs.readFileSync(fullPath, 'utf8');
        let updatedContent;

        if (isRevert) {
            // Comment the STATIC_EXPORT lines back (ensure no double comments)
            updatedContent = content.replace(/^(export const dynamic|export const dynamicParams|export async function generateStaticParams)/gm, (match) => {
                return `// STATIC_EXPORT ${match}`;
            });
            // Also handle the internal lines of the function if any
            updatedContent = updatedContent.replace(/^(\s+)return \[{ (code|id): 'default' }\];/gm, '$1// STATIC_EXPORT return [{ $2: \'default\' }];');
            updatedContent = updatedContent.replace(/^}$/gm, (match, offset, string) => {
                // Only comment out the closing brace if it belongs to generateStaticParams
                // This is a bit naive but works for our simple files
                const lines = string.substring(0, offset).split('\n');
                if (lines[lines.length - 1].includes('generateStaticParams')) return `// STATIC_EXPORT ${match}`;
                return match;
            });
        } else {
            // Uncomment the STATIC_EXPORT lines
            updatedContent = content.replace(/\/\/ STATIC_EXPORT /g, '');
        }

        if (content !== updatedContent) {
            fs.writeFileSync(fullPath, updatedContent);
            console.log(`✅ ${isRevert ? 'Reverted' : 'Updated'}: ${fileRelPath}`);
        } else {
            console.log(`ℹ️ No changes needed: ${fileRelPath}`);
        }
    } catch (err) {
        console.error(`❌ Error processing ${fileRelPath}:`, err.message);
        process.exit(1);
    }
});

console.log('✨ Preparation complete.');
