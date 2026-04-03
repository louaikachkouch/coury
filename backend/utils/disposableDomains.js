const DISPOSABLE_EMAIL_DOMAINS = new Set([
  'mailinator.com',
  'tempmail.com',
  '10minutemail.com',
  'guerrillamail.com',
  'yopmail.com',
  'trashmail.com',
  'sharklasers.com',
  'getnada.com',
  'maildrop.cc',
  'dispostable.com',
  'temp-mail.org',
  'fakeinbox.com'
]);

const isDisposableEmail = (email = '') => {
  const parts = String(email).toLowerCase().split('@');
  if (parts.length !== 2) {
    return true;
  }

  const domain = parts[1].trim();
  return DISPOSABLE_EMAIL_DOMAINS.has(domain);
};

module.exports = { isDisposableEmail };
