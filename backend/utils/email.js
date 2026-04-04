const axios = require('axios');

const hasEmailConfig = () => {
  // EasyEmailAPI requires API key and sender email
  if (process.env.NODE_ENV === 'production') {
    return process.env.EASYEMAIL_API_KEY && process.env.EASYEMAIL_FROM;
  }
  return !!process.env.EASYEMAIL_FROM;
};

const sendVerificationCodeEmail = async ({ email, name, verificationCode }) => {
  if (!hasEmailConfig()) {
    throw new Error('EASYEMAIL_API_KEY and EASYEMAIL_FROM are not configured. Please set them in your .env file.');
  }

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

  // Development mode: log to console
  if (!process.env.EASYEMAIL_API_KEY) {
    console.log('\n📧 [DEV MODE] Verification Email:');
    console.log(`To: ${email}`);
    console.log(`Subject: Verify your Coury account`);
    console.log('---');
    console.log(html);
    console.log('---\n');
    return { messageId: 'dev-' + Date.now() };
  }

  try {
    console.log('📧 Sending verification email via EasyEmail API...');
    console.log('From:', process.env.EASYEMAIL_FROM);
    console.log('To:', email);
    
    const response = await axios.post(
      'https://api.easyemail.io/send',
      {
        from: process.env.EASYEMAIL_FROM,
        to: email,
        subject: 'Verify your Coury account',
        html: html
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.EASYEMAIL_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );

    console.log('✅ Email sent successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ EasyEmailAPI error:');
    console.error('Status:', error.response?.status);
    console.error('Data:', error.response?.data);
    console.error('Message:', error.message);
    
    const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message;
    throw new Error(`Failed to send verification email: ${errorMessage}`);
  }
};

module.exports = { sendVerificationCodeEmail, hasEmailConfig };
