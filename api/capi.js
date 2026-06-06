async function hashSHA256(value) {
  const encoder = new TextEncoder();
  const data = encoder.encode(value);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const accessToken = process.env.FB_ACCESS_TOKEN;
  const pixelId = process.env.FB_PIXEL_ID;

  if (!accessToken || !pixelId) {
    return res.status(200).json({ skipped: true, reason: 'FB CAPI not configured' });
  }

  try {
    const { eventName, phone, name, customData, sourceUrl } = req.body;

    const timestamp = Math.floor(Date.now() / 1000);
    const hashedPhone = phone ? await hashSHA256(phone.replace(/\D/g, '')) : undefined;
    const hashedName = name ? await hashSHA256(name.trim().toLowerCase()) : undefined;

    const eventData = {
      data: [
        {
          event_name: eventName || 'Lead',
          event_time: timestamp,
          action_source: 'website',
          event_source_url: sourceUrl,
          user_data: {
            ...(hashedPhone && { ph: [hashedPhone] }),
            ...(hashedName && { fn: [hashedName] }),
          },
          custom_data: customData || {},
        },
      ],
      access_token: accessToken,
    };

    const fbRes = await fetch(
      `https://graph.facebook.com/v21.0/${pixelId}/events`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventData),
      }
    );

    const result = await fbRes.json();
    return res.status(200).json({ success: true, fbResponse: result });
  } catch (err) {
    console.error('CAPI proxy error:', err);
    return res.status(500).json({ error: err.message });
  }
}
