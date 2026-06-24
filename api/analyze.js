// api/analyze.js
// Vercel Serverless Function to call Gemini 1.5 Flash API securely.
// Uses Node's native 'https' module to ensure cross-platform DNS stability on Vercel.

import https from 'https';

export default async function handler(req, res) {
  // Guard: Only allow POST requests
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  const { stackTrace } = req.body || {};
  if (!stackTrace || typeof stackTrace !== 'string') {
    return res.status(400).json({ error: 'Valid stackTrace string is required in request body.' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ 
      error: 'Gemini API Key is not configured on the server. Please add GEMINI_API_KEY to your Vercel Environment Variables.' 
    });
  }

  const prompt = "Explain the following stack trace in simple terms and suggest a fix:\n" + stackTrace.trim();

  try {
    // Calling Gemini 1.5 Flash – highly stable, free tier available globally
    const responseData = await makeHttpsRequest(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        'Content-Type': 'application/json',
        'User-Agent': 'StackSense/1.0 (Vercel Serverless)'
      },
      JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }]
      })
    );

    const data = JSON.parse(responseData);
    const explanation = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!explanation) {
      if (data.error) {
        return res.status(500).json({ error: `Gemini API Error: ${data.error.message || data.error}` });
      }
      throw new Error('Gemini API returned an empty or invalid response.');
    }

    return res.status(200).json({ explanation });
  } catch (err) {
    console.error('Serverless Function Error:', err);
    return res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
}

// Helper function to perform post requests via native https
function makeHttpsRequest(url, headers, body) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      method: 'POST',
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      headers: headers,
      timeout: 20000 // 20s timeout
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(data);
        } else {
          reject(new Error(`API responded with status ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timed out while waiting for Google Gemini API.'));
    });

    req.write(body);
    req.end();
  });
}
