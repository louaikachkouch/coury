const sgMail = require('@sendgrid/mail');

const hasEmailConfig = () => {
  // SendGrid requires API key and from email
  return !!process.env.SENDGRID_API_KEY && !!process.env.SENDGRID_FROM_EMAIL;
};

const sendVerificationCodeEmail = async ({ email, name, verificationCode }) => {
  if (!hasEmailConfig()) {
    throw new Error('SENDGRID_API_KEY and SENDGRID_FROM_EMAIL are not configured. Please set them in your .env file.');
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
  if (!process.env.SENDGRID_API_KEY) {
    console.log('\n📧 [DEV MODE] Verification Email:');
    console.log(`To: ${email}`);
    console.log(`Subject: Verify your Coury account`);
    console.log('---');
    console.log(html);
    console.log('---\n');
    return { messageId: 'dev-' + Date.now() };
  }

  try {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    
    console.log('📧 Sending verification email via SendGrid...');
    console.log('From:', process.env.SENDGRID_FROM_EMAIL);
    console.log('To:', email);
    console.log('API Key configured:', !!process.env.SENDGRID_API_KEY);
    if (process.env.SENDGRID_API_KEY) {
      console.log('API Key preview:', process.env.SENDGRID_API_KEY.substring(0, 10) + '...');
    }

    const msg = {
      to: email,
      from: process.env.SENDGRID_FROM_EMAIL,
      subject: 'Verify your Coury account',
      html: html
    };

    const response = await sgMail.send(msg);
    
    console.log('✅ Email sent successfully');
    console.log('Message ID:', response[0].headers['x-message-id']);
    
    return {
      messageId: response[0].headers['x-message-id'],
      success: true
    };
  } catch (error) {
    console.error('❌ SendGrid error:');
    console.error('Status:', error.code || error.status);
    console.error('Message:', error.message);
    if (error.response) {
      console.error('Response:', error.response.body);
    }
    
    throw new Error(`Failed to send verification email: ${error.message}`);
  }
};

module.exports = { sendVerificationCodeEmail, hasEmailConfig };
