# Final Vercel Environment Variables

Copy these exactly into your **Vercel Project Settings > Environment Variables**:

| Variable | Value |
| :--- | :--- |
| **DATABASE_URL** | `postgresql://testai_tzc8_user:pbNX5MhvcD03GmKeFo7gc76OzsvKCWNp@dpg-d717lh7gi27c73f8jl30-a.oregon-postgres.render.com/testai_tzc8` |
| **FRONTEND_URL** | `https://universityportal-k5vb.vercel.app` |
| **NODE_ENV** | `production` |
| **JWT_SECRET** | `educhain-super-secret-jwt-key-32-chars-long` |
| **GOOGLE_CLIENT_ID** | `693243766556-616ll677bq22evvhuq8tuhe1umd5kc87.apps.googleusercontent.com` |
| **GOOGLE_CLIENT_SECRET** | `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` |
| **SMTP_HOST** | `smtp.gmail.com` |
| **SMTP_PORT** | `587` |
| **SMTP_SECURE** | `false` |
| **SMTP_USER** | `anupamberasequere@gmail.com` |
| **SMTP_PASS** | `xvihvmxddpkjohho` |
| **OPENAI_API_KEY** | (Your OpenAI Key) |
| **OPENAI_MODEL** | `gpt-4o` |
| **BLOCKCHAIN_RPC_URL** | `https://rpc-amoy.polygon.technology` |
| **BLOCKCHAIN_PRIVATE_KEY** | (Your Wallet Private Key) |
| **CONTRACT_ADDRESS** | `0xaB5aF6225553E24438554351A5690dd18e25e498` |
| **BLOCKCHAIN_NETWORK** | `amoy` |
| **UNIVERSITY_NAME** | `AI-Transparent University` |
| **MAX_FILE_SIZE** | `10485760` |

### Important Reminders:
1.  **Google OAuth**: Add `https://universityportal-k5vb.vercel.app` to "Authorized JavaScript Origins" in [Google Cloud Console](https://console.cloud.google.com/apis/credentials).
2.  **No .env in Git**: Ensure your `.env` file is NOT pushed to GitHub.
3.  **Redeploy**: After adding these variables, click "Redeploy" on your latest Vercel deployment.
