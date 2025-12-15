import dotenv from 'dotenv';
import nodemailer from 'nodemailer';

// Carrega as variáveis de ambiente
dotenv.config();

/**
 * Função para gerar um código numérico aleatório de 6 dígitos.
 */
function gerarOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Função que retorna o HTML estilizado do e-mail.
 */
function gerarHtmlTemplate(codigo) {
    return `
    <div style="font-family: Helvetica, Arial, sans-serif; min-width: 1000px; overflow:auto; line-height: 2">
      <div style="margin: 50px auto; width: 70%; padding: 20px 0">
        <div style="border-bottom: 1px solid #eee">
          <a href="" style="font-size: 1.4em; color: #00466a; text-decoration:none; font-weight:600">SmartNotes AI</a>
        </div>
        <p style="font-size:1.1em">Olá,</p>
        <p>Use o código abaixo para completar seu processo de verificação. Este código expira em 5 minutos.</p>
        <h2 style="background: #00466a; margin: 0 auto; width: max-content; padding: 0 10px; color: #fff; border-radius: 4px;">${codigo}</h2>
        <p style="font-size:0.9em;">Atenciosamente,<br />Equipe SmartNotes</p>
        <hr style="border:none;border-top:1px solid #eee" />
        <div style="float:right;padding:8px 0;color:#aaa;font-size:0.8em;line-height:1;font-weight:300">
          <p>SmartNotes AI</p>
          <p>São Paulo, Brasil</p>
        </div>
      </div>
    </div>
    `;
}

/**
 * Função principal para envio do e-mail
 */
async function enviarEmailVerificacao(emailDestino) {
    console.log("Iniciando processo de envio...");

    // Verifica se as credenciais existem
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.error("ERRO: As variáveis EMAIL_USER e EMAIL_PASS não estão definidas no arquivo .env");
        return;
    }

    // 1. Configuração do Transporter (Carteiro)
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

    try {
        // 2. Gera o código
        const codigoOTP = gerarOTP();

        // 3. Configuração da mensagem
        const mailOptions = {
            from: `"SmartNotes Security" <${process.env.EMAIL_USER}>`,
            to: emailDestino,
            subject: 'Seu Código de Verificação ✔',
            text: `Seu código de verificação é: ${codigoOTP}`,
            html: gerarHtmlTemplate(codigoOTP),
        };

        // 4. Envio propriamente dito
        const info = await transporter.sendMail(mailOptions);

        console.log('✅ E-mail enviado com sucesso!');
        console.log(`🆔 ID da Mensagem: ${info.messageId}`);
        console.log(`🔐 Código gerado: ${codigoOTP}`);

        return codigoOTP;

    } catch (error) {
        console.error('❌ Erro ao enviar e-mail:');
        console.error(error);
    }
}

// --- Execução de Teste ---
// Para testar, execute no terminal: node scripts/enviarEmail.js
// Certifique-se de configurar o arquivo .env na raiz do projeto.

const emailParaTeste = process.argv[2] || 'usuario_teste@exemplo.com'; 
enviarEmailVerificacao(emailParaTeste);
