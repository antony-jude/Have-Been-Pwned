export default async function handler(request, response) {
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET');
    return response.status(405).json({ error: 'Method not allowed.' });
  }

  const prefix = Array.isArray(request.query.prefix)
    ? request.query.prefix[0]
    : request.query.prefix;

  if (!prefix || !/^[0-9a-fA-F]{5}$/.test(prefix)) {
    return response.status(400).json({
      error: 'Prefix must be exactly five hexadecimal characters.',
    });
  }

  try {
    const upstream = await fetch(
      `https://api.pwnedpasswords.com/range/${prefix.toUpperCase()}`,
      {
        headers: {
          'Add-Padding': 'true',
          'User-Agent': 'HavePwned-Security-Dashboard',
        },
      },
    );

    if (!upstream.ok) {
      throw new Error(`Pwned Passwords returned ${upstream.status}`);
    }

    const data = await upstream.text();

    response.setHeader('Content-Type', 'text/plain; charset=utf-8');
    response.setHeader(
      'Cache-Control',
      'public, s-maxage=86400, stale-while-revalidate=604800',
    );
    return response.status(200).send(data);
  } catch (error) {
    console.error('Password breach lookup failed:', error);
    return response.status(502).json({
      error: 'The password breach service is temporarily unavailable.',
    });
  }
}
