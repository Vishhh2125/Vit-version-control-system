import fs from "fs";
import path from "path";
import crypto from "crypto";
import zlib from "zlib";

const commit = (message) => {
  const vitDir = path.join(process.cwd(), ".vit");
  
  // Validation checks
  if (!fs.existsSync(vitDir)) {
    console.error("Error: Not a vit repository (run `vit init` first)");
    return;
  }

  const indexPath = path.join(vitDir, "index.json");
  if (!fs.existsSync(indexPath)) {
    console.error("Error: Nothing to commit (use 'vit add' first)");
    return;
  }

  // Read staging area
  const index = JSON.parse(fs.readFileSync(indexPath, "utf-8"));
  if (Object.keys(index).length === 0) {
    console.error("Error: No changes staged for commit");
    return;
  }

  // Create tree content from staged files
  let treeContent = "";
  for (const [filePath, hash] of Object.entries(index)) {
    treeContent += `blob ${hash} ${filePath}\n`;
  }

  // Create and store tree object
  const treeHeader = `tree ${treeContent.length}\0`;
  const treeStore = Buffer.concat([
    Buffer.from(treeHeader),
    Buffer.from(treeContent)
  ]);
  const treeHash = crypto.createHash("sha1").update(treeStore).digest("hex");

  // Store tree object
  const treeDir = path.join(vitDir, "objects", treeHash.slice(0, 2));
  const treePath = path.join(treeDir, treeHash.slice(2));
  
  if (!fs.existsSync(treeDir)) {
    fs.mkdirSync(treeDir, { recursive: true });
  }
  fs.writeFileSync(treePath, zlib.deflateSync(treeStore));

  // Get parent commit if exists
  const headPath = path.join(vitDir, "HEAD");
  let parent = "";
  if (fs.existsSync(headPath)) {
    parent = fs.readFileSync(headPath, "utf-8").trim();
  }

  // Create commit object
  let commitContent = `tree ${treeHash}\n`;
  if (parent) {
    commitContent += `parent ${parent}\n`;
  }
  commitContent += `\n${message}`;

  const commitHeader = `commit ${commitContent.length}\0`;
  const commitStore = Buffer.concat([
    Buffer.from(commitHeader),
    Buffer.from(commitContent)
  ]);

  // Store commit object
  const commitHash = crypto.createHash("sha1").update(commitStore).digest("hex");
  const commitDir = path.join(vitDir, "objects", commitHash.slice(0, 2));
  const commitPath = path.join(commitDir, commitHash.slice(2));
  
  if (!fs.existsSync(commitDir)) {
    fs.mkdirSync(commitDir, { recursive: true });
  }
  fs.writeFileSync(commitPath, zlib.deflateSync(commitStore));

  // Update HEAD and clear index
  fs.writeFileSync(headPath, commitHash);
  fs.writeFileSync(indexPath, "{}");

  console.log(`[${commitHash.slice(0, 7)}] ${message}`);
  return commitHash;
};

export default commit;
