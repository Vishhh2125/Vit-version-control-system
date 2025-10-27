import fs from "fs";
import path from "path";
import zlib from "zlib";

// Utility function to read and decompress objects
const readObject = (hash) => {
  const vitDir = path.join(process.cwd(), ".vit");
  const objectPath = path.join(vitDir, "objects", hash.slice(0, 2), hash.slice(2));
  
  if (!fs.existsSync(objectPath)) {
    throw new Error(`Object ${hash} not found`);
  }
  
  const compressed = fs.readFileSync(objectPath);
  const decompressed = zlib.inflateSync(compressed);
  return decompressed.toString();
};

const getCommitChain = (headHash) => {
  const commits = [];
  let current = headHash;

  while (current) {
    try {
      const commitData = readObject(current);
      // Parse commit data properly
      const [header, body] = commitData.split("\0");
      if (!body) continue;
      
      const [treeAndParent, message] = body.split("\n\n");
      const lines = treeAndParent.split("\n");
      const treeHash = lines[0].split(" ")[1];
      
      commits.push({
        hash: current,
        treeHash,
        message
      });

      // Get parent hash if exists
      const parentLine = lines.find(l => l.startsWith("parent "));
      current = parentLine ? parentLine.split(" ")[1] : null;
      
    } catch (error) {
      console.error(`Error reading commit ${current}: ${error.message}`);
      break;
    }
  }
  return commits;
};

const restoreTree = (treeHash, dir = process.cwd()) => {
  try {
    const treeData = readObject(treeHash);
    const [header, content] = treeData.split("\0");
    if (!content) return;

    const entries = content.split("\n").filter(Boolean);
    for (const entry of entries) {
      const [type, hash, name] = entry.split(" ");
      const targetPath = path.join(dir, name);

      if (type === "blob") {
        const blobData = readObject(hash);
        const [, content] = blobData.split("\0");
        fs.writeFileSync(targetPath, content);
      }
    }
  } catch (error) {
    throw new Error(`Failed to restore tree ${treeHash}: ${error.message}`);
  }
};

const revert = (steps) => {
  const vitDir = path.join(process.cwd(), ".vit");
  
  if (!fs.existsSync(vitDir)) {
    console.error("Error: Not a vit repository");
    return;
  }

  const headPath = path.join(vitDir, "HEAD");
  if (!fs.existsSync(headPath)) {
    console.error("Error: No commits to revert to");
    return;
  }

  try {
    const currentHead = fs.readFileSync(headPath, "utf-8").trim();
    const commits = getCommitChain(currentHead);
    
    if (steps >= commits.length) {
      console.error(`Error: Cannot revert ${steps} commits (only ${commits.length} commits exist)`);
      return;
    }

    const targetCommit = commits[steps];
    
    // Just restore working directory from tree, don't update HEAD
    restoreTree(targetCommit.treeHash);

    console.log(`Restored working directory to commit ${targetCommit.hash.slice(0, 7)}`);
    console.log(`Message: ${targetCommit.message.trim()}`);
    console.log('\nNote: HEAD is still at original commit.');
    console.log('To save these changes as a new commit:');
    console.log('  vit add .');
    console.log('  vit commit "Your message"');

  } catch (error) {
    console.error("Revert failed:", error.message);
  }
};

export default revert;