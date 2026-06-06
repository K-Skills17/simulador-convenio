import Anthropic from '@anthropic-ai/sdk';

function formatPhone(phone) {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('55') && digits.length >= 12) return digits;
  if (digits.length === 11) return '55' + digits;
  if (digits.length === 10) return '55' + digits;
  return digits;
}

async function hashSHA256(value) {
  const encoder = new TextEncoder();
  const data = encoder.encode(value);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// --- Claude AI analysis ---

async function generateAdvice(data) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.warn('ANTHROPIC_API_KEY not configured — skipping AI analysis');
    return null;
  }

  const planSummary = data.planResults
    .map(p => `- ${p.nome}: ${p.classificacao.toUpperCase()} (reembolso ${p.score}%, perda R$${p.perdaTotal.toFixed(0)}/mes)`)
    .join('\n');

  const client = new Anthropic({ apiKey });

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 800,
    messages: [
      {
        role: 'user',
        content: `Voce e um consultor especializado em gestao de clinicas odontologicas no Brasil. Analise os convenios dessa clinica e de conselhos praticos e personalizados.

DADOS:
- Nome: ${data.name}
- Clinica: ${data.clinicName}
- Nota geral: ${data.score}/100
- Receita particular estimada: R$${data.receitaPrivada?.toFixed(0) || '?'}/mes

CONVENIOS ANALISADOS:
${planSummary}

INSTRUCOES:
- Escreva em portugues brasileiro, tom profissional mas amigavel
- Maximo 3 acoes prioritarias, cada uma com 1-2 frases
- Foque em decisoes praticas: manter, renegociar ou descredenciar
- NAO use markdown. Use formatacao WhatsApp: *negrito* para destaques
- Maximo 500 caracteres no total
- Retorne APENAS as recomendacoes, sem introducao`
      }
    ]
  });

  const textBlock = response.content.find(b => b.type === 'text');
  return textBlock ? textBlock.text : null;
}

// --- Message builder ---

function buildMessage(data, advice) {
  const lines = [
    `Ola ${data.name}! 👋`,
    ``,
    `Aqui esta a analise dos convenios da *${data.clinicName}*:`,
    ``,
    `🏆 *Nota geral: ${data.score}/100*`,
  ];

  if (advice) {
    lines.push(
      ``,
      `📋 *Recomendacoes personalizadas:*`,
      ``,
      advice,
    );
  } else {
    const summary = data.planResults
      .slice(0, 5)
      .map((p, i) => {
        const emoji = p.classificacao === 'verde' ? '✅' : p.classificacao === 'amarelo' ? '⚠️' : '❌';
        return `   ${emoji} ${p.nome}: ${p.classificacao === 'verde' ? 'Rentavel' : p.classificacao === 'amarelo' ? 'No limite' : 'Prejuizo'}`;
      })
      .join('\n');

    lines.push(``, `📊 *Seus convenios:*`, summary);
  }

  if (data.reportUrl) {
    lines.push(
      ``,
      `📊 *Relatorio completo:*`,
      data.reportUrl,
    );
  }

  lines.push(
    ``,
    `---`,
    ``,
    `Quer otimizar a rentabilidade dos convenios da *${data.clinicName}*?`,
    ``,
    `Me conta: voce ja pensou em renegociar ou descredenciar algum plano? 😊`,
  );

  return lines.join('\n');
}

// --- Facebook Conversions API ---

async function sendFbConversionEvent(data) {
  const accessToken = process.env.FB_ACCESS_TOKEN;
  const pixelId = process.env.FB_PIXEL_ID;

  if (!accessToken || !pixelId) {
    console.warn('Facebook Conversions API not configured — skipping');
    return;
  }

  try {
    const timestamp = Math.floor(Date.now() / 1000);
    const hashedPhone = await hashSHA256('55' + data.phone.replace(/\D/g, ''));

    const eventData = {
      data: [
        {
          event_name: 'Lead',
          event_time: timestamp,
          action_source: 'website',
          user_data: {
            ph: [hashedPhone],
            fn: [await hashSHA256(data.name.trim().toLowerCase())],
          },
          custom_data: {
            content_name: 'Simulador Convenio',
            value: data.score,
            currency: 'BRL',
          },
        },
      ],
      access_token: accessToken,
    };

    const res = await fetch(
      `https://graph.facebook.com/v21.0/${pixelId}/events`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventData),
      }
    );

    const result = await res.text();
    console.log('FB Conversions API response:', res.status, result);
  } catch (err) {
    console.error('FB Conversions API error:', err);
  }
}

// --- Google Sheets ---

async function appendToSheet(data) {
  const sheetId = process.env.GOOGLE_SHEET_ID;
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!sheetId || !clientEmail || !privateKey) {
    console.warn('Google Sheets not configured — skipping lead storage');
    return;
  }

  try {
    // Use Google Apps Script Web App as fallback (simpler for Vercel)
    // For full googleapis, you'd need the googleapis package
    console.log('Lead data for sheet:', {
      timestamp: new Date().toISOString(),
      name: data.name,
      phone: data.phone,
      clinic: data.clinicName,
      score: data.score,
    });
  } catch (err) {
    console.error('Google Sheets error:', err);
  }
}

// --- Main handler (Vercel serverless) ---

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = req.body;
    const { name, phone, clinicName } = body;

    if (!name || !phone || !clinicName) {
      return res.status(400).json({ error: 'Nome, telefone e nome da clinica sao obrigatorios' });
    }

    const formattedPhone = formatPhone(phone);
    if (formattedPhone.length < 10) {
      return res.status(400).json({ error: 'Numero de telefone invalido' });
    }

    // Run AI analysis, sheet save, and FB conversion in parallel
    const [advice] = await Promise.all([
      generateAdvice(body).catch(err => {
        console.error('Claude AI error:', err);
        return null;
      }),
      appendToSheet(body),
      sendFbConversionEvent(body).catch(err => {
        console.error('FB Conversions API error:', err);
      }),
    ]);

    const message = buildMessage(body, advice);

    // Send via LK Chatbot webhook (preferred)
    let messageSent = false;
    let whatsappError = '';

    const chatbotUrl = process.env.LK_CHATBOT_URL;
    const chatbotApiKey = process.env.LK_CHATBOT_API_KEY;
    const chatbotTenantId = process.env.LK_CHATBOT_TENANT_ID;

    if (chatbotUrl && chatbotApiKey && chatbotTenantId) {
      try {
        const webhookUrl = `${chatbotUrl}/webhook/audit-lead`;

        const chatbotRes = await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': chatbotApiKey,
          },
          body: JSON.stringify({
            phone: formattedPhone,
            name: body.name,
            reportMessage: message,
            tenantId: chatbotTenantId,
            auditData: {
              tool: 'simulador-convenio',
              overallScore: body.score,
              keyFindings: body.planResults
                .filter(p => p.classificacao === 'vermelho')
                .map(p => `${p.nome}: prejuizo de R$${p.perdaTotal.toFixed(0)}/mes`),
              recommendations: body.planResults
                .map(p => `${p.nome}: ${p.classificacao}`),
            },
          }),
        });

        if (chatbotRes.ok) {
          messageSent = true;
        } else {
          const responseText = await chatbotRes.text();
          whatsappError = `Chatbot webhook ${chatbotRes.status}: ${responseText}`;
          console.error('Chatbot webhook error:', whatsappError);
        }
      } catch (err) {
        whatsappError = `Chatbot webhook fetch error: ${err.message || String(err)}`;
        console.error('Chatbot webhook error:', err);
      }
    }

    // Fallback: send directly via Evolution API
    if (!messageSent) {
      const apiUrl = process.env.EVOLUTION_API_URL;
      const instance = process.env.EVOLUTION_API_INSTANCE;
      const apiKey = process.env.EVOLUTION_API_KEY;

      if (apiUrl && instance && apiKey) {
        try {
          const evoUrl = `${apiUrl}/message/sendText/${instance}`;

          const evolutionRes = await fetch(evoUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': apiKey,
            },
            body: JSON.stringify({
              number: formattedPhone,
              text: message,
            }),
          });

          if (evolutionRes.ok) {
            messageSent = true;
            whatsappError = '';
          } else {
            const responseText = await evolutionRes.text();
            whatsappError = `Evolution API ${evolutionRes.status}: ${responseText}`;
          }
        } catch (err) {
          whatsappError = `Fetch error: ${err.message || String(err)}`;
        }
      } else if (!whatsappError) {
        whatsappError = 'No messaging service configured';
      }
    }

    return res.status(200).json({ success: true, messageSent, whatsappError: messageSent ? undefined : whatsappError });
  } catch (err) {
    console.error('Error in send-whatsapp:', err);
    return res.status(200).json({ success: true, messageSent: false });
  }
}
