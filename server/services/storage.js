import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';
import { existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const isCloudinaryConfigured = !!(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

let storage;

if (isCloudinaryConfigured) {
  console.log('✅ Storage: Using Cloudinary');
  storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: 'university-portal',
      allowed_formats: ['jpg', 'png', 'pdf', 'docx', 'txt'],
    },
  });
} else {
  console.log('⚠️  Storage: Cloudinary not configured, using local disk (will be ephemeral on Vercel)');
  const uploadDir = process.env.UPLOAD_DIR || join(__dirname, '../uploads');
  if (!existsSync(uploadDir)) {
    mkdirSync(uploadDir, { recursive: true });
  }
  
  storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, file.fieldname + '-' + uniqueSuffix + '-' + file.originalname);
    },
  });
}

export const upload = multer({ storage });
export default upload;
