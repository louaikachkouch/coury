const nodemailer = require('nodemailer');

const requiredSmtpConfig = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'SMTP_FROM'];

const hasSmtpConfig = () => {
  return requiredSmtpConfig.every((key) => process.env[key]);
};

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
};

const sendVerificationCodeEmail = async ({ email, name, verificationCode }) => {
  if (!hasSmtpConfig()) {
    throw new Error('SMTP is not configured. Please set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS and SMTP_FROM.');
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
