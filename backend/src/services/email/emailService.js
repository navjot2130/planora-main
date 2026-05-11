const nodemailer = require('nodemailer');

let transporter = null;
let warnedDisabled = false;

function getEmailConfig() {
  return {
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE || '').toLowerCase() === 'true',
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.SMTP_FROM || process.env.SMTP_USER
  };
}

function isEmailConfigured() {
  const config = getEmailConfig();
  return Boolean(config.host && config.port && config.user && config.pass && config.from);
}

function getTransporter() {
  if (transporter) return transporter;

  const config = getEmailConfig();
  transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure || config.port === 465,
    auth: {
      user: config.user,
      pass: config.pass
    }
  });

  return transporter;
}

async function sendReminderEmail({ to, subject, text }) {
  if (!isEmailConfigured()) {
    if (!warnedDisabled) {
      warnedDisabled = true;
      // eslint-disable-next-line no-console
      console.warn('[email] SMTP is not configured. Email reminders are disabled.');
    }
    return { skipped: true, reason: 'smtp_not_configured' };
  }

  const config = getEmailConfig();
  await getTransporter().sendMail({
    from: config.from,
    to,
    subject,
    text
  });

  return { sent: true };
}

module.exports = { isEmailConfigured, sendReminderEmail };
