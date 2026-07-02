export default async function handler(request, response) {
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET');
    return response.status(405).json({ error: 'Method not allowed.' });
  }

  const email = Array.isArray(request.query.email)
    ? request.query.email[0]
    : request.query.email;

  if (
    !email ||
    email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  ) {
    return response.status(400).json({ error: 'A valid email is required.' });
  }

  try {
    const upstream = await fetch(
      `https://api.xposedornot.com/v1/breach-analytics?email=${encodeURIComponent(email)}`,
      {
        headers: {
          'User-Agent': 'HavePwned-Security-Dashboard',
        },
      },
    );

    if (!upstream.ok) {
      throw new Error(`XposedOrNot returned ${upstream.status}`);
    }

    const data = await upstream.json();

    response.setHeader('Cache-Control', 'private, no-store');
    return response.status(200).json(data);
  } catch (error) {
    console.error('Email breach lookup failed:', error);
    return response.status(502).json({
      error: 'The email breach service is temporarily unavailable.',
    });
  }
}
