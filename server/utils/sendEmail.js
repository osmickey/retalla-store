const nodemailer = require('nodemailer');

let transporter;

function getTransporter() {
  if (!transporter) {
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
      throw new Error('SMTP is not configured. Set SMTP_HOST, SMTP_USER and SMTP_PASS.');
    }
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  }
  return transporter;
}

async function sendEmail({ to, subject, html }) {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log(`[email:dev-fallback] SMTP not configured, logging instead of sending.\nTo: ${to}\nSubject: ${subject}\n${html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()}`);
    return;
  }
  await getTransporter().sendMail({
    from: process.env.SMTP_FROM || `Retalla <${process.env.SMTP_USER}>`,
    to,
    subject,
    html,
  });
}

module.exports = sendEmail;
