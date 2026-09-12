/**
 * Serviço oficial de envio de e-mails transacionais do Sistema Segue-me
 * Diocese de Anápolis via Resend API
 */

interface SendEmailParams {
  to: string | string[];
  subject: string;
  html: string;
}

const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const FROM_ADDRESS = process.env.EMAIL_FROM || 'Segue-me Diocese de Anápolis <contato@sistemasegueme.com.br>';

export async function sendEmail({ to, subject, html }: SendEmailParams) {
  if (!RESEND_API_KEY) {
    console.warn('[EMAIL] RESEND_API_KEY não configurada. E-mail simulado:', { to, subject });
    return { success: false, reason: 'missing_key' };
  }

  try {
    const recipients = Array.isArray(to) ? to : [to];
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_ADDRESS,
        to: recipients,
        subject,
        html,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      console.error('[EMAIL] Erro no envio via Resend:', data);
      return { success: false, error: data };
    }

    return { success: true, id: data.id };
  } catch (err) {
    console.error('[EMAIL] Falha de conexão ao enviar e-mail:', err);
    return { success: false, error: err };
  }
}

/**
 * Base de layout HTML estilizado para todos os e-mails do Segue-me
 */
function emailLayout({ title, content, previewText }: { title: string; content: string; previewText: string }) {
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f7f6f2; margin: 0; padding: 24px; color: #1c1917; }
    .container { max-width: 580px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; border: 1px solid #e7e5e4; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
    .header { background: linear-gradient(135deg, #78350f 0%, #b45309 100%); padding: 32px 24px; text-align: center; color: #ffffff; }
    .header img { width: 72px; height: 72px; border-radius: 50%; border: 3px solid #ffffff; background: #ffffff; padding: 2px; }
    .header h1 { margin: 12px 0 4px; font-size: 22px; font-weight: 700; letter-spacing: -0.5px; }
    .header p { margin: 0; font-size: 13px; opacity: 0.9; text-transform: uppercase; letter-spacing: 1px; }
    .body { padding: 32px 28px; line-height: 1.6; font-size: 15px; color: #292524; }
    .badge-box { background-color: #fef3c7; border: 1px solid #fde68a; border-radius: 10px; padding: 14px 18px; margin: 20px 0; font-size: 14px; color: #92400e; }
    .cta-button { display: inline-block; background-color: #b45309; color: #ffffff !important; font-size: 15px; font-weight: 600; text-decoration: none; padding: 14px 28px; border-radius: 10px; margin: 20px 0 10px; text-align: center; }
    .footer { background-color: #fafaf9; border-top: 1px solid #e7e5e4; padding: 20px; text-align: center; font-size: 12px; color: #78716c; }
  </style>
</head>
<body>
  <div style="display:none;font-size:1px;color:#333;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">
    ${previewText}
  </div>
  <div class="container">
    <div class="header">
      <img src="https://www.sistemasegueme.com.br/logo-segue-me.png" alt="Segue-me Diocese de Anápolis">
      <h1>Segue-me</h1>
      <p>Diocese de Anápolis • GO</p>
    </div>
    <div class="body">
      ${content}
    </div>
    <div class="footer">
      <p style="margin: 0 0 6px;"><strong>Conselho Diocesano do Segue-me — Diocese de Anápolis</strong></p>
      <p style="margin: 0;">Este é um e-mail oficial e seguro enviado pelo sistema diocesano.</p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * 1. E-mail de Confirmação e Boas-Vindas enviado quando a pessoa se cadastra
 */
export async function sendWelcomeRegistrationEmail({
  to,
  name,
  parishName,
  yearEncounter,
}: {
  to: string;
  name: string;
  parishName?: string;
  yearEncounter?: string;
}) {
  const subject = 'Recebemos seu cadastro — Sistema Segue-me (Diocese de Anápolis)';
  const previewText = `Olá, ${name}! Recebemos a sua solicitação de acesso ao Sistema Segue-me.`;

  const content = `
    <h2 style="color: #78350f; margin-top: 0; font-size: 20px;">Olá, ${name}! Seja bem-vindo(a).</h2>
    <p>Recebemos com alegria a sua solicitação de cadastro no <strong>Sistema Oficial do Segue-me da Diocese de Anápolis</strong>.</p>
    
    <div class="badge-box">
      <strong>📋 Dados informados para validação:</strong><br>
      • <strong>Paróquia informada:</strong> ${parishName || 'Não especificada'}<br>
      • <strong>Encontro vivenciado:</strong> ${yearEncounter ? `Ano ${yearEncounter}` : 'Em análise'}
    </div>

    <h3 style="color: #44403c; font-size: 16px; margin-bottom: 6px;">Como funciona a liberação do seu acesso?</h3>
    <p style="margin-top: 0;">
      Para preservar a segurança, privacidade e fidelidade à história do nosso movimento, cada novo cadastro passa pela conferência da equipe diocesana com os quadrantes oficiais dos encontros.
    </p>

    <p>
      Assim que confirmarmos a sua vivência, você receberá um novo e-mail avisando que seu acesso está <strong>totalmente liberado</strong> para consultar seu histórico, equipes trabalhadas e informações autorizadas!
    </p>

    <div style="text-align: center; margin: 24px 0 10px;">
      <a href="https://www.sistemasegueme.com.br/entrar" class="cta-button">Acessar o Sistema Segue-me</a>
    </div>

    <p style="font-style: italic; color: #78716c; margin-top: 24px;">"Em tudo dai graças." (1Ts 5,18)</p>
  `;

  return sendEmail({
    to,
    subject,
    html: emailLayout({ title: subject, content, previewText }),
  });
}

/**
 * 2. E-mail enviado quando o Conselho Diocesano aprova o cadastro do usuário
 */
export async function sendAccessApprovedEmail({
  to,
  name,
}: {
  to: string;
  name: string;
}) {
  const subject = 'Seu acesso ao Sistema Segue-me foi aprovado! 🎉';
  const previewText = `Viva Cristo! Olá ${name}, seu acesso foi validado com sucesso pela equipe diocesana.`;

  const content = `
    <h2 style="color: #15803d; margin-top: 0; font-size: 20px;">Viva Cristo! Olá, ${name}.</h2>
    <p>Temos uma excelente notícia: a Coordenação Diocesana do Segue-me analisou e <strong>aprovou o seu acesso</strong> ao sistema!</p>

    <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px; padding: 16px; margin: 20px 0; color: #166534; font-size: 14px;">
      ✅ <strong>Seu histórico oficial está disponível:</strong><br>
      Agora você pode visualizar o histórico dos seus encontros vivenciados, equipes de serviço em que trabalhou e seus mandatos no Segue-me.
    </div>

    <div style="text-align: center; margin: 28px 0 16px;">
      <a href="https://www.sistemasegueme.com.br/entrar" class="cta-button" style="background-color: #15803d;">Entrar no Sistema Agora</a>
    </div>

    <p style="color: #57534e; font-size: 14px;">
      Basta fazer login com o seu e-mail e a senha que você cadastrou.
    </p>

    <p style="font-style: italic; color: #78716c; margin-top: 24px;">
      Fraternalmente em Cristo,<br>
      <strong>Conselho Diocesano do Segue-me — Diocese de Anápolis</strong>
    </p>
  `;

  return sendEmail({
    to,
    subject,
    html: emailLayout({ title: subject, content, previewText }),
  });
}

/**
 * 3. E-mail de notificação para a Coordenação Diocesana quando houver novo cadastro
 */
export async function sendNewRegistrationAlertToDiocese({
  requesterName,
  requesterEmail,
  parishName,
  details,
}: {
  requesterName: string;
  requesterEmail: string;
  parishName?: string;
  details?: string;
}) {
  const to = 'conselhodiocesano.segueme@gmail.com';
  const subject = `🔔 Novo cadastro aguardando validação: ${requesterName}`;
  const previewText = `Novo usuário solicitou acesso ao Sistema Segue-me: ${requesterName} (${requesterEmail}).`;

  const content = `
    <h2 style="color: #78350f; margin-top: 0; font-size: 20px;">Novo Cadastro para Análise</h2>
    <p>Uma nova solicitação de acesso foi realizada no Sistema Segue-me e está aguardando conferência:</p>

    <div style="background-color: #f5f5f4; border: 1px solid #e7e5e4; border-radius: 10px; padding: 16px; margin: 16px 0; font-size: 14px; line-height: 1.7;">
      • <strong>Nome:</strong> ${requesterName}<br>
      • <strong>E-mail:</strong> ${requesterEmail}<br>
      • <strong>Paróquia:</strong> ${parishName || 'Não informada'}<br>
      • <strong>Detalhes informados:</strong> ${details || 'Nenhum detalhe adicional'}
    </div>

    <p>Para conferir o quadrante e aprovar ou recusar a solicitação, acesse o painel de pendências:</p>

    <div style="text-align: center; margin: 24px 0 10px;">
      <a href="https://www.sistemasegueme.com.br/pendencias" class="cta-button">Analisar no Painel de Pendências</a>
    </div>
  `;

  return sendEmail({
    to,
    subject,
    html: emailLayout({ title: subject, content, previewText }),
  });
}
