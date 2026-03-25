# Environment Variables for Vercel Deployment

## Backend (Serverless Functions)
- `DATABASE_URL`: Your PostgreSQL connection string (Neon, Supabase, etc.)
- `OPENAI_API_KEY`: Your OpenAI API key
- `BLOCKCHAIN_RPC_URL`: Your Polygon/Ethereum RPC URL
- `BLOCKCHAIN_PRIVATE_KEY`: Your wallet private key
- `JWT_SECRET`: A long random string for authentication
- `SMTP_USER`: Email for OTPs
- `SMTP_PASS`: Email password/app-key
- `CLOUDINARY_CLOUD_NAME`: Cloudinary Cloud Name
- `CLOUDINARY_API_KEY`: Cloudinary API Key
- `CLOUDINARY_API_SECRET`: Cloudinary API Secret
- `FRONTEND_URL`: The URL of your Vercel deployment (e.g., https://your-app.vercel.app)

## Frontend (Vite)
- `VITE_API_URL`: (Optional) Defaults to `/api` on production. Set if the backend is hosted elsewhere.
