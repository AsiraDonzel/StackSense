// api/analyze.js
// Vercel Serverless Function to call Hugging Face Inference API securely

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

  // The prompt matches the original Hugging Face specifications
  const prompt = "Explain the following stack trace in simple terms and suggest a fix:\n" + stackTrace.trim();

  try {
    const response = await fetch(
      "https://api-inference.huggingface.co/models/Salesforce/codegen-350M-mono",
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ inputs: prompt })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({
        error: `Hugging Face API responded with status ${response.status}: ${errorText}`
      });
    }

    const data = await response.json();
    
    // Parse response: if it's an array, extract generated_text from the first element
    const explanation = Array.isArray(data) ? data[0]?.generated_text : data?.generated_text;

    if (!explanation) {
      throw new Error('Hugging Face API returned an empty response.');
    }

    return res.status(200).json({ explanation });
  } catch (err) {
    console.error('Serverless Function Error:', err);
    return res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
}
