require('dotenv').config();

console.log('=== Environment Test ===');
console.log('ELEVENLABS_API_KEY exists:', !!process.env.ELEVENLABS_API_KEY);
console.log('ELEVENLABS_API_KEY length:', process.env.ELEVENLABS_API_KEY ? process.env.ELEVENLABS_API_KEY.length : 0);
console.log('GEMINI_API_KEY exists:', !!process.env.GEMINI_API_KEY);
console.log('All environment variables:', Object.keys(process.env).filter(key => key.includes('API'))); 