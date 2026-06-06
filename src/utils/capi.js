import { FB_PIXEL_ID } from '../config';

export async function sendCapiEvent({ eventName, phone, name, customData }) {
  // Client-side CAPI proxy — sends to our serverless endpoint
  if (!FB_PIXEL_ID) {
    console.warn('FB Pixel not configured — skipping CAPI event');
    return;
  }

  try {
    await fetch('/api/capi', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventName,
        phone,
        name,
        customData,
        sourceUrl: window.location.href,
      }),
    });
  } catch (err) {
    console.error('CAPI event error:', err);
  }
}
