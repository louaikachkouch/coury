const nodemailer = require('nodemailer');

const hasSmtpConfig = () => {
  // In development: only SMTP_FROM is needed (codes logged to console)
  // In production: full SMTP config required
  if (process.env.NODE_ENV === 'production') {
    return process.env.SMTP_HOST && process.env.SMTP_PORT && process.env.SMTP_USER && process.env.SMTP_PASS && process.env.SMTP_FROM;
  }
  return !!process.env.SMTP_FROM;
};

const createTransporter = () => {
  // Production: use provided SMTP config
  if (process.env.SMTP_HOST && process.env.SMTP_PORT && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }

  // Development: return a mock transporter that logs to console
  return {
    sendMail: async (options) => {
      console.log('\n📧 [DEV MODE] Verification Email:');
      console.log(`To: ${options.to}`);
      console.log(`Subject: ${options.subject}`);
      console.log('---');
      console.log(options.html);
      console.log('---\n');
      return { messageId: 'dev-' + Date.now() };
    }
  };
};

const sendVerificationCodeEmail = async ({ email, name, verificationCode }) => {
  if (!hasSmtpConfig()) {
    throw new Error('SMTP_FROM is not configured. Please set SMTP_FROM in your .env file.');
  }

  const transporter = createTransporter();
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #222;">
      <h2>Verify your Coury account</h2>
      <p>Hello ${name || 'there'},</p>
      <p>Thanks for registering. Please verify your email address to activate your account.</p>
      <p>Your verification code is:</p>
      <div style="display: inline-block; padding: 10px 16px; background: #111827; color: #fff; border-radius: 6px; letter-spacing: 4px; font-size: 20px; font-weight: bold;">
        ${verificationCode}
      </div>
      <p>This code expires in 10 minutes.</p>
    </div>
  `;

  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: email,
    subject: 'Verify your Coury account',
    html
  });
};

module.exports = { sendVerificationCodeEmail, hasSmtpConfig };
