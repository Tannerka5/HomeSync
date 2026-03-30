import { Router } from "express";
import multer from "multer";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const currentFile = fileURLToPath(import.meta.url);
const currentDir = path.dirname(currentFile);

// Find backend root (works in both src/ and dist/src/ if it's 1-3 levels deep)
let backendRoot = currentDir;
while (backendRoot !== path.dirname(backendRoot) && !fs.existsSync(path.join(backendRoot, "package.json"))) {
  backendRoot = path.dirname(backendRoot);
}
const uploadDir = path.join(backendRoot, "uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    // Replace spaces and special characters from filename for safety
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, "_");
    cb(null, `${uniqueSuffix}-${safeName}`);
  },
});

const upload = multer({ storage });
const router = Router();

router.post("/", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }
  const fileUrl = `/uploads/${req.file.filename}`;
  res.json({ url: fileUrl, filename: req.file.originalname });
});

export default router;
