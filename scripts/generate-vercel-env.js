const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from .env.local
const envPath = path.join(__dirname, '..', '.env.local');

if (!fs.existsSync(envPath)) {
  console.error('❌ Error: .env.local file not found!');
  console.error('   Please make sure you are in the project root and .env.local exists.');
  process.exit(1);
}

const envConfig = dotenv.parse(fs.readFileSync(envPath));
const privateKey = envConfig.FIREBASE_PRIVATE_KEY;

if (!privateKey) {
  console.error('❌ Error: FIREBASE_PRIVATE_KEY not found in .env.local');
  process.exit(1);
}

console.log('✅ Found FIREBASE_PRIVATE_KEY in .env.local');
console.log('   Formatting for Vercel...');
console.log('');
console.log('👇 COPY THE TEXT BELOW AND PASTE INTO VERCEL ENV VARIABLES 👇');
console.log('-----------------------------------------------------------');

// Format the key: replace newlines with literal \n and wrap in quotes
const formattedKey = '"' + privateKey.replace(/\n/g, '\\n') + '"';

console.log(formattedKey);
console.log('-----------------------------------------------------------');
console.log('☝️  COPY THE TEXT ABOVE ☝️');
console.log('');
console.log('Instructions:');
console.log('1. Go to Vercel Dashboard > Settings > Environment Variables');
console.log('2. Find FIREBASE_PRIVATE_KEY (or create a new one)');
console.log('3. Paste the value exactly as shown above (including the quotes)');
console.log('4. Save and Redeploy');
