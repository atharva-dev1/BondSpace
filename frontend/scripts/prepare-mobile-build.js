const fs = require('fs');
const path = require('path');

const filesToFix = [
    'src/app/join/[code]/page.tsx',
    'src/app/gallery/[id]/page.tsx'
];

console.log('🚀 Preparing for mobile build: Injecting STATIC_EXPORT configurations...');

filesToFix.forEach(fileRelPath => {
    const fullPath = path.join(__dirname, '..', fileRelPath);

    if (!fs.existsSync(fullPath)) {
        console.warn(`⚠️ Warning: File not found - ${fullPath}`);
        return;
    }

    try {
        const content = fs.readFileSync(fullPath, 'utf8');

        // Uncomment the STATIC_EXPORT lines
        const updatedContent = content.replace(/\/\/ STATIC_EXPORT /g, '');

        if (content !== updatedContent) {
            fs.writeFileSync(fullPath, updatedContent);
            console.log(`✅ Updated: ${fileRelPath}`);
        } else {
            console.log(`ℹ️ Already updated or nothing to fix: ${fileRelPath}`);
        }
    } catch (err) {
        console.error(`❌ Error updating ${fileRelPath}:`, err.message);
        process.exit(1);
    }
});

console.log('✨ Preparation complete.');
