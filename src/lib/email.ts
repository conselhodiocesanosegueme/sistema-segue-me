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
 * Layout HTML oficial, responsivo e de alto padrão visual
 * Compatível com Gmail, Apple Mail, Outlook e smartphones
 */
function emailLayout({ title, content, previewText }: { title: string; content: string; previewText: string }) {
  return `
<!DOCTYPE html>
<html lang="pt-BR" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style type="text/css">
    body {
      margin: 0;
      padding: 0;
      background-color: #f4f3ee;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      -webkit-font-smoothing: antialiased;
      color: #292524;
    }
    table { border-collapse: separate; }
    a, a:link, a:visited { color: #b45309; text-decoration: none; }
    .email-container {
      max-width: 600px;
      margin: 32px auto;
      background-color: #ffffff;
      border-radius: 16px;
      border: 1px solid #e7e5e4;
      overflow: hidden;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01);
    }
    .top-accent {
      height: 6px;
      background: linear-gradient(90deg, #b45309 0%, #f59e0b 50%, #78350f 100%);
    }
    .brand-header {
      padding: 32px 24px 24px;
      text-align: center;
      background: #fafaf9;
      border-bottom: 1px solid #f5f5f4;
    }
    .brand-logo {
      width: 78px;
      height: 78px;
      border-radius: 50%;
      background: #ffffff;
      border: 2.5px solid #b45309;
      padding: 3px;
      box-shadow: 0 4px 12px rgba(180, 83, 9, 0.15);
      margin: 0 auto 14px;
      display: block;
    }
    .brand-title {
      font-family: Georgia, serif;
      font-size: 24px;
      font-weight: 700;
      color: #b45309;
      margin: 0 0 4px;
      letter-spacing: -0.3px;
    }
    .brand-subtitle {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 2px;
      color: #78716c;
      margin: 0;
    }
    .content-body {
      padding: 36px 32px;
      font-size: 15px;
      line-height: 1.65;
      color: #3f3f46;
    }
    .content-body h2 {
      font-size: 20px;
      color: #18181b;
      margin-top: 0;
      margin-bottom: 16px;
      font-weight: 700;
    }
    .info-card {
      background: #fffbeb;
      border: 1px solid #fde68a;
      border-left: 4px solid #b45309;
      border-radius: 8px;
      padding: 16px 20px;
      margin: 24px 0;
      font-size: 14px;
      color: #78350f;
    }
    .info-card strong {
      color: #92400e;
    }
    .steps-container {
      margin: 24px 0;
      background: #fafaf9;
      border: 1px solid #e7e5e4;
      border-radius: 12px;
      padding: 20px;
    }
    .step-item {
      display: flex;
      align-items: flex-start;
      margin-bottom: 14px;
    }
    .step-item:last-child {
      margin-bottom: 0;
    }
    .step-num {
      width: 26px;
      height: 26px;
      border-radius: 50%;
      background: #b45309;
      color: #ffffff;
      font-weight: 700;
      font-size: 12px;
      line-height: 26px;
      text-align: center;
      margin-right: 12px;
      flex-shrink: 0;
    }
    .step-text {
      font-size: 13.5px;
      color: #52525b;
      line-height: 1.45;
    }
    .cta-wrapper {
      text-align: center;
      margin: 32px 0 20px;
    }
    .btn-primary {
      background: #b45309;
      color: #ffffff !important;
      font-weight: 600;
      font-size: 15px;
      padding: 14px 32px;
      border-radius: 8px;
      display: inline-block;
      box-shadow: 0 4px 6px -1px rgba(180, 83, 9, 0.2);
    }
    .quote-box {
      font-style: italic;
      color: #a1a1aa;
      font-size: 13px;
      text-align: center;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #f4f4f5;
    }
    .email-footer {
      background: #fdfbf7;
      border-top: 1px solid #f2ede4;
      padding: 24px 32px;
      text-align: center;
      font-size: 12px;
      color: #8c827a;
      line-height: 1.55;
    }
    @media only screen and (max-width: 600px) {
      .email-container { width: 100% !important; margin: 0 !important; border-radius: 0 !important; }
      .content-body { padding: 24px 20px !important; }
    }
  </style>
</head>
<body>
  <!-- Pre-header invisível -->
  <div style="display:none;font-size:1px;color:#333;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">
    ${previewText}
  </div>

  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f4f3ee; padding: 20px 10px;">
    <tr>
      <td align="center">
        <div class="email-container">
          <div class="top-accent"></div>

          <!-- Cabeçalho Oficial com Brasão -->
          <div class="brand-header">
            <img class="brand-logo" src="https://www.sistemasegueme.com.br/logo-segue-me.png" alt="Logo Segue-me Diocese de Anápolis" width="78" height="78">
            <h1 class="brand-title">Segue-me</h1>
            <p class="brand-subtitle">Diocese de Anápolis &bull; Goiás</p>
          </div>

          <!-- Conteúdo -->
          <div class="content-body">
            ${content}
          </div>

          <!-- Rodapé Institucional -->
          <div class="email-footer">
            <p style="margin: 0 0 6px; font-weight: 600; color: #57534e;">
              Coordenação Diocesana do Segue-me &bull; Diocese de Anápolis/GO
            </p>
            <p style="margin: 0 0 8px;">
              Sistema Oficial de Gestão e Registro Histórico de Participantes e Mandatos.
            </p>
            <p style="margin: 0; font-size: 11px; color: #a8a29e;">
              Este e-mail é gerado automaticamente pelo portal <a href="https://www.sistemasegueme.com.br" style="color: #b45309;">sistemasegueme.com.br</a>.
            </p>
          </div>
        </div>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

/**
 * 1. E-mail de Confirmação e Boas-Vindas enviado quando o seguidor solicita cadastro
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
    <h2>Viva Cristo! Olá, ${name}.</h2>
    
    <p>
      Recebemos com muita alegria a sua solicitação de cadastro no <strong>Sistema Oficial do Segue-me da Diocese de Anápolis</strong>.
    </p>

    <!-- Resumo dos Dados -->
    <div class="info-card">
      <strong style="display: block; font-size: 14px; margin-bottom: 6px;">📋 Informações registradas para conferência:</strong>
      <table border="0" cellpadding="3" cellspacing="0" style="font-size: 13.5px; width: 100%;">
        <tr>
          <td width="140" style="color: #92400e;"><strong>Paróquia:</strong></td>
          <td>${parishName || 'Paróquia informada no cadastro'}</td>
        </tr>
        <tr>
          <td style="color: #92400e;"><strong>Encontro:</strong></td>
          <td>${yearEncounter || 'Encontro em análise'}</td>
        </tr>
      </table>
    </div>

    <!-- Etapas da Liberação -->
    <p style="font-weight: 600; color: #27272a; margin-bottom: 8px;">Como funciona a liberação do seu acesso?</p>
    
    <div class="steps-container">
      <table border="0" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td width="36" valign="top">
            <div class="step-num">1</div>
          </td>
          <td valign="top" style="padding-bottom: 12px;">
            <strong style="color: #27272a; font-size: 14px;">Solicitação em Fila</strong><br>
            <span class="step-text">Seus dados já estão salvos e aguardam a validação da equipe diocesana.</span>
          </td>
        </tr>
        <tr>
          <td width="36" valign="top">
            <div class="step-num">2</div>
          </td>
          <td valign="top" style="padding-bottom: 12px;">
            <strong style="color: #27272a; font-size: 14px;">Conferência com os Quadrantes Oficiais</strong><br>
            <span class="step-text">O Conselho Diocesano confronta os dados com os documentos históricos arquivados de cada encontro.</span>
          </td>
        </tr>
        <tr>
          <td width="36" valign="top">
            <div class="step-num">3</div>
          </td>
          <td valign="top">
            <strong style="color: #27272a; font-size: 14px;">Notificação de Aprovação</strong><br>
            <span class="step-text">Assim que validado, <strong>você receberá um e-mail avisando</strong> que seu histórico completo e equipes já estão liberados para consulta!</span>
          </td>
        </tr>
      </table>
    </div>

    <div class="cta-wrapper">
      <a href="https://www.sistemasegueme.com.br/entrar" class="btn-primary">Acompanhar meu Acesso</a>
    </div>

    <div class="quote-box">
      &ldquo;Em tudo dai graças, porque esta é a vontade de Deus em Cristo Jesus para convosco.&rdquo;<br>
      <strong>1 Tessalonicenses 5:18</strong>
    </div>
  `;

  return sendEmail({
    to,
    subject,
    html: emailLayout({ title: subject, content, previewText }),
  });
}

/**
 * 2. E-mail enviado quando o Conselho Diocesano aprova o acesso do usuário
 */
export async function sendAccessApprovedEmail({
  to,
  name,
}: {
  to: string;
  name: string;
}) {
  const subject = 'Viva Cristo! Seu acesso ao Sistema Segue-me foi aprovado! 🎉';
  const previewText = `Parabéns ${name}! Seu histórico no Segue-me da Diocese de Anápolis foi validado com sucesso.`;

  const content = `
    <h2 style="color: #15803d;">Viva Cristo! Olá, ${name}.</h2>

    <p>
      Temos uma excelente notícia: a <strong>Coordenação Diocesana do Segue-me</strong> analisou as informações do seu encontro e o seu acesso ao sistema foi <strong>aprovado com sucesso!</strong>
    </p>

    <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-left: 4px solid #16a34a; border-radius: 8px; padding: 16px 20px; margin: 24px 0; color: #166534; font-size: 14px;">
      <strong style="font-size: 15px; display: block; margin-bottom: 6px;">🎉 O seu Histórico Oficial está disponível:</strong>
      Agora você pode consultar todos os encontros em que vivenciou, as equipes de trabalho em que serviu e os mandatos de liderança documentados na nossa diocese.
    </div>

    <div class="cta-wrapper">
      <a href="https://www.sistemasegueme.com.br/entrar" class="btn-primary" style="background: #15803d;">
        Acessar Meu Histórico Agora
      </a>
    </div>

    <p style="font-size: 13.5px; color: #71717a; text-align: center; margin: 12px 0 24px;">
      Basta entrar no portal utilizando o seu e-mail e a senha cadastrada.
    </p>

    <div class="quote-box">
      Fraternalmente em Cristo Jesus,<br>
      <strong>Conselho Diocesano do Segue-me &bull; Diocese de Anápolis</strong>
    </div>
  `;

  return sendEmail({
    to,
    subject,
    html: emailLayout({ title: subject, content, previewText }),
  });
}

/**
 * 3. E-mail de notificação para a Coordenação Diocesana sobre novo cadastro aguardando conferência
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
  const previewText = `Novo participante solicitou validação de cadastro: ${requesterName} (${requesterEmail}).`;

  const content = `
    <h2>Novo Cadastro Aguardando Conferência</h2>

    <p>
      Um novo participante solicitou acesso ao <strong>Sistema Segue-me</strong> e está aguardando conferência nos quadrantes arquivados:
    </p>

    <div class="info-card" style="background: #f8fafc; border-color: #cbd5e1; border-left-color: #3b82f6; color: #1e293b;">
      <table border="0" cellpadding="4" cellspacing="0" style="font-size: 14px; width: 100%;">
        <tr>
          <td width="140" style="color: #64748b;"><strong>Nome:</strong></td>
          <td><strong>${requesterName}</strong></td>
        </tr>
        <tr>
          <td style="color: #64748b;"><strong>E-mail:</strong></td>
          <td>${requesterEmail}</td>
        </tr>
        <tr>
          <td style="color: #64748b;"><strong>Paróquia:</strong></td>
          <td>${parishName || 'Não especificada'}</td>
        </tr>
      </table>

      ${details ? `
        <div style="margin-top: 12px; padding-top: 10px; border-top: 1px solid #e2e8f0; font-size: 13px; color: #475569; white-space: pre-line;">
          <strong>Dados do Encontro / Histórico informado:</strong><br>
          ${details}
        </div>
      ` : ''}
    </div>

    <p style="font-size: 14px; color: #52525b;">
      Para conferir o quadrante correspondente e aprovar ou vincular a pessoa, acesse o painel de pendências:
    </p>

    <div class="cta-wrapper">
      <a href="https://www.sistemasegueme.com.br/pendencias" class="btn-primary">
        Analisar na Aba de Pendências
      </a>
    </div>
  `;

  return sendEmail({
    to,
    subject,
    html: emailLayout({ title: subject, content, previewText }),
  });
}
