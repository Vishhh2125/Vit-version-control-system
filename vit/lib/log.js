import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

const log = () => {
    const vitDir = path.join(process.cwd(), '.vit');

    // Check if .vit exists
    if (!fs.existsSync(vitDir)) {
        console.error("Error: Not a vit repository (run `vit init` first)");
        return;
    }

    // Read HEAD to get latest commit
    const headPath = path.join(vitDir, 'HEAD');
    if (!fs.existsSync(headPath)) {
        console.log("No commits yet");
        return;
    }

    let currentCommit = fs.readFileSync(headPath, 'utf-8').trim();
    
    // Walk through commit history
    while (currentCommit) {
        // Read commit object
        const commitDir = path.join(vitDir, 'objects', currentCommit.slice(0, 2));
        const commitPath = path.join(commitDir, currentCommit.slice(2));
        
        if (!fs.existsSync(commitPath)) {
            console.error(`Error: Commit ${currentCommit} not found`);
            break;
        }

        // Decompress and parse commit
        const compressed = fs.readFileSync(commitPath);
        const content = zlib.inflateSync(compressed).toString();
        
        // Parse commit content
        const [header, message] = content.split('\0')[1].split('\n\n');
        const lines = header.split('\n');
        
        // Get parent commit if exists
        const parentLine = lines.find(line => line.startsWith('parent '));
        const parent = parentLine ? parentLine.split(' ')[1] : null;

        // Print commit info
        console.log(`\x1b[33mcommit ${currentCommit}\x1b[0m`);  // Yellow color
        console.log(`\n    ${message}\n`);

        // Move to parent commit
        currentCommit = parent;
    }
};

export default log;