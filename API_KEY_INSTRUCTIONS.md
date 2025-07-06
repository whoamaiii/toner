# 🔧 API Key Configuration Fix

## Problem Identified
Your TonerWeb AI is showing authentication errors because the OpenRouter API key is invalid or expired.

## Solution Steps

### 1. Get New OpenRouter API Key
1. Go to https://openrouter.ai/keys
2. Log in or create an account
3. Generate a new API key
4. Copy the key (it should start with `sk-or-v1-`)

### 2. Update .env File
1. Open your `.env` file in the project root
2. Update the `OPENROUTER_API_KEY` line:
   ```
   OPENROUTER_API_KEY=your_new_key_here
   ```

### 3. Verify Gemini API Key (Optional)
1. Go to https://aistudio.google.com/app/apikey
2. Verify your existing key is still valid
3. If needed, generate a new key and update `GEMINI_API_KEY`

### 4. Restart the Server
```bash
npm run dev
```

## Test the Fix

### Health Check
Visit: http://localhost:3000/api/health

This will show you the status of both API keys.

### Test Image Upload
1. Go to your application
2. Upload a toner image
3. The error should now be resolved

## What We Fixed
- ✅ Added API key validation at server startup
- ✅ Improved error messages in Norwegian
- ✅ Added health check endpoint
- ✅ Better error handling throughout the application
- ✅ More specific error diagnostics

## Current Status
- **Gemini API**: ✅ Working (image analysis)
- **OpenRouter API**: ❌ Needs new key (web search)

Once you update the OpenRouter API key, both services should work perfectly! 