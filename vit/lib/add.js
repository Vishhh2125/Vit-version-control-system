import fs from "fs";
import path from "path";
import crypto from "crypto";
import zlib from "zlib";

const add = (filePath) => {
  const vitDir = path.join(process.cwd(), ".vit");

  // Check if .vit exists
  if (!fs.existsSync(vitDir)) {
    console.error("Error: Not a vit repository (run `vit init` first)");
    return;
  }

  const absPath = path.resolve(filePath);

  // Check if file exists
  if (!fs.existsSync(absPath)) {
    console.error(`File not found: ${filePath}`);
    return;
  }

  // 1. Read file content
  const content = fs.readFileSync(absPath);

  // 2. Create blob format
  const header = `blob ${content.length}\0`;
  const store = Buffer.concat([Buffer.from(header), content]);

  // 3. Hash it
  const hash = crypto.createHash("sha1").update(store).digest("hex");

  // 4. Compress and store in objects
  const objectDir = path.join(vitDir, "objects", hash.slice(0, 2));
  const objectPath = path.join(objectDir, hash.slice(2));
  
  if (!fs.existsSync(objectDir)) {
    fs.mkdirSync(objectDir, { recursive: true });
  }

  if (!fs.existsSync(objectPath)) {
    fs.writeFileSync(objectPath, zlib.deflateSync(store));
  }

  // 5. Update index.json
  const indexPath = path.join(vitDir, "index.json");
  let index = {};
  
  if (fs.existsSync(indexPath)) {
    index = JSON.parse(fs.readFileSync(indexPath, "utf-8"));
  }
  
  // Store relative path instead of absolute
  const relativePath = path.relative(process.cwd(), absPath);
  index[relativePath] = hash;
  
  fs.writeFileSync(indexPath, JSON.stringify(index, null, 2));

  console.log(`Added ${relativePath} → ${hash}`);
};

export default add;