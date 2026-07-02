import express from 'express';

const router = express.Router();

router.get('/email-check/:email', async (req, res) => {
  const { email } = req.params;

  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'A valid email address is required.' });
  }

  try {
    const url = `https://api.xposedornot.com/v1/breach-analytics?email=${encodeURIComponent(email)}`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Password-Strength-Analyzer-Agent'
      }
    });

    if (!response.ok) {
      throw new Error(`XposedOrNot API returned status: ${response.status}`);
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error querying XposedOrNot API:', error);
    res.status(502).json({ error: 'Failed to fetch from email breach database' });
  }
});

export default router;
