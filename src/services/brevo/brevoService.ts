/**
 * Brevo (formerly Sendinblue) API Service for sending transactional emails.
 * Handles lazy checking of API keys and sender info.
 */

export interface EmailRecipient {
  email: string;
  name?: string;
}

export interface SendVerificationEmailOptions {
  recipient: EmailRecipient;
  verificationLink: string;
  language: 'PT' | 'EN';
}

/**
 * Sends a stylized, professional email using Brevo's REST API.
 */
export async function sendBrevoEmail(
  to: EmailRecipient[],
  subject: string,
  htmlContent: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL || 'no-reply@supplyx.co.mz';
  const senderName = process.env.BREVO_SENDER_NAME || 'SupplyX';

  if (!apiKey) {
    console.warn('[BREVO] Warning: BREVO_API_KEY is not defined in environment variables.');
    return { success: false, error: 'BREVO_API_KEY is missing' };
  }

  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': apiKey,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender: {
          name: senderName,
          email: senderEmail,
        },
        to: to.map(r => ({
          email: r.email,
          name: r.name || r.email.split('@')[0],
        })),
        subject: subject,
        htmlContent: htmlContent,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.warn('[BREVO] Info: Email sending response was not OK:', errorData);
      return { 
        success: false, 
        error: errorData.message || `Brevo returned status ${response.status}` 
      };
    }

    const data = await response.json();
    console.log('[BREVO] Email sent successfully:', data);
    return { success: true, messageId: data.messageId };
  } catch (err: any) {
    console.warn('[BREVO] Note: Exception during email sending:', err);
    return { success: false, error: err.message || 'Unknown network error' };
  }
}

/**
 * Generates the professional SupplyX template and sends it via Brevo.
 */
export async function sendVerificationEmailBrevo(options: SendVerificationEmailOptions) {
  const { recipient, verificationLink, language } = options;
  const name = recipient.name || (language === 'PT' ? 'Utilizador' : 'User');

  const t = {
    PT: {
      subject: 'Confirme o seu e-mail - SupplyX',
      title: 'Confirmação de E-mail',
      greeting: `Olá, ${name}!`,
      intro: 'Agradecemos a criação da sua conta no SupplyX. Estamos ansiosos para tê-lo a bordo na nossa plataforma de cadeia de suprimentos e logística.',
      buttonText: 'Confirmar e-mail',
      explanation: 'Clique no botão abaixo para confirmar o seu endereço de e-mail e ativar por completo o seu acesso à plataforma SupplyX:',
      warning: 'Se você não criou esta conta, por favor ignore este e-mail. Nenhuma ação adicional é necessária e sua conta não será ativada sem a sua verificação.',
      footer: '© 2026 SupplyX Moçambique. Todos os direitos reservados. Este é um e-mail automático, por favor não responda.'
    },
    EN: {
      subject: 'Verify your email - SupplyX',
      title: 'Email Verification',
      greeting: `Hello, ${name}!`,
      intro: 'Thank you for creating an account on SupplyX. We are excited to have you on board with our supply chain and logistics platform.',
      buttonText: 'Confirm email',
      explanation: 'Click the button below to confirm your email address and fully activate your access to the SupplyX platform:',
      warning: 'If you did not register for this account, please ignore this email. No further action is required and your account will not be activated without verification.',
      footer: '© 2026 SupplyX Mozambique. All rights reserved. This is an automated email, please do not reply.'
    }
  }[language];

  // Visual, responsive HTML template following standard SupplyX branding guidelines (deep slate backgrounds, emerald/blue details, modern clean fonts)
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${t.title}</title>
      <style>
        body {
          margin: 0;
          padding: 0;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          background-color: #f4f4f5;
          color: #18181b;
          -webkit-font-smoothing: antialiased;
        }
        .wrapper {
          width: 100%;
          background-color: #f4f4f5;
          padding: 40px 20px;
          box-sizing: border-box;
        }
        .container {
          max-width: 580px;
          margin: 0 auto;
          background-color: #ffffff;
          border-radius: 24px;
          border: 1px solid #e4e4e7;
          overflow: hidden;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -4px rgba(0, 0, 0, 0.05);
        }
        .header {
          background-color: #09090b;
          padding: 32px;
          text-align: center;
          border-bottom: 2px solid #1e40af;
        }
        .logo {
          font-size: 24px;
          font-weight: 900;
          color: #ffffff;
          letter-spacing: -0.05em;
          text-transform: uppercase;
        }
        .logo-accent {
          color: #2563eb;
        }
        .content {
          padding: 40px 32px;
        }
        .greeting {
          font-size: 20px;
          font-weight: 800;
          margin-top: 0;
          margin-bottom: 16px;
          color: #09090b;
        }
        .text {
          font-size: 14px;
          line-height: 1.6;
          color: #52525b;
          margin-bottom: 24px;
        }
        .button-container {
          text-align: center;
          margin: 32px 0;
        }
        .button {
          display: inline-block;
          background-color: #2563eb;
          color: #ffffff !important;
          text-decoration: none;
          padding: 14px 32px;
          font-size: 13px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          border-radius: 12px;
          box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2);
          transition: background-color 0.2s ease;
        }
        .button:hover {
          background-color: #1d4ed8;
        }
        .warning-card {
          background-color: #fafafa;
          border: 1px dashed #e4e4e7;
          border-radius: 16px;
          padding: 20px;
          margin-top: 32px;
        }
        .warning-text {
          font-size: 12px;
          line-height: 1.5;
          color: #71717a;
          margin: 0;
        }
        .footer {
          padding: 32px;
          background-color: #fafafa;
          border-top: 1px solid #e4e4e7;
          text-align: center;
        }
        .footer-text {
          font-size: 11px;
          color: #a1a1aa;
          margin: 0;
        }
        .link-fallback {
          font-size: 11px;
          word-break: break-all;
          color: #3b82f6;
          text-align: center;
          margin-top: 16px;
        }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="container">
          <div class="header">
            <div class="logo">Supply<span class="logo-accent">X</span></div>
          </div>
          <div class="content">
            <h1 class="greeting">${t.greeting}</h1>
            <p class="text">${t.intro}</p>
            <p class="text">${t.explanation}</p>
            
            <div class="button-container">
              <a href="${verificationLink}" class="button" target="_blank">${t.buttonText}</a>
            </div>

            <div class="link-fallback">
              <strong>Link alternativo:</strong><br>
              <a href="${verificationLink}" target="_blank" style="color: #2563eb; text-decoration: underline;">${verificationLink}</a>
            </div>

            <div class="warning-card">
              <p class="warning-text">${t.warning}</p>
            </div>
          </div>
          <div class="footer">
            <p class="footer-text">${t.footer}</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendBrevoEmail(
    [{ email: recipient.email, name: recipient.name }],
    t.subject,
    htmlContent
  );
}
