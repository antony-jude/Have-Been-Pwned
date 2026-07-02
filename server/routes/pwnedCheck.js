import express from 'express';

const router = express.Router();

router.get('/pwned-check/:prefix', async (req, res) => {
  const { prefix } = req.params;

  // Validate prefix
  if (!prefix || prefix.length !== 5 || !/^[0-9a-fA-F]{5}$/.test(prefix)) {
    return res.status(400).json({ error: 'Prefix must be exactly 5 hex characters.' });
  }

  try {
    const url = `https://api.pwnedpasswords.com/range/${prefix.toUpperCase()}`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Password-Strength-Analyzer-Agent'
      }
    });

    if (!response.ok) {
      throw new Error(`HIBP API returned status: ${response.status}`);
    }

    const data = await response.text();
    res.type('text/plain').send(data);
  } catch (error) {
    console.error('Error fetching from HIBP API:', error);
    res.status(502).json({ error: 'Failed to fetch from HaveIBeenPwned API' });
  }
});

export default router;
