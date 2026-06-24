// api/analyze.js
// Vercel Serverless Function to call Hugging Face Inference API securely
// Uses Node's native 'https' module to prevent Vercel IPv6 'fetch failed' resolution bugs.

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

  const apiKey = process.env.HF_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ 
      error: 'Hugging Face API Key is not configured on the server. Please add HF_API_KEY to your Vercel Environment Variables.' 
    });
  }

  const prompt = "Explain the following stack trace in simple terms and suggest a fix:\n" + stackTrace.trim();

  // Call Hugging Face API using the native https module (bypasses Vercel undici fetch IPv6 issue)
  try {
    const responseData = await makeHttpsRequest(
      "https://api-inference.huggingface.co/models/Salesforce/codegen-350M-mono",
      {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'User-Agent': 'StackSense/1.0 (Vercel Serverless)'
      },
      JSON.stringify({ inputs: prompt })
    );

    // Parse the response
    const data = JSON.parse(responseData);
    
    // Extract explanation
    const explanation = Array.isArray(data) ? data[0]?.generated_text : data?.generated_text;

    if (!explanation) {
      // If the model returned an error message in JSON
      if (data.error) {
        return res.status(500).json({ error: `Hugging Face API Error: ${data.error}` });
      }
      throw new Error('Hugging Face API returned an empty or invalid response.');
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
      timeout: 25000 // generous 25s timeout for cold model starts
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
      reject(new Error('Request timed out while waiting for Hugging Face Inference API.'));
    });

    req.write(body);
    req.end();
  });
}
