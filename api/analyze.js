// api/analyze.js
// Vercel Serverless Function to call Gemini 2.0 securely

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

  // The prompt structure matches the client-side expectations
  const prompt = "Explain the following stack trace in simple terms and suggest a fix:\n" + stackTrace.trim();

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }]
        })
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return res.status(response.status).json({
        error: errorData?.error?.message || `Gemini API responded with status ${response.status}`
      });
    }

    const data = await response.json();
    const explanation = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!explanation) {
      throw new Error('Gemini API returned an empty response.');
    }

    return res.status(200).json({ explanation });
  } catch (err) {
    console.error('Serverless Function Error:', err);
    return res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
}
