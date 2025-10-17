import * as functions from 'firebase-functions';
import * as nodemailer from 'nodemailer';
import sgMail from '@sendgrid/mail';

interface SendEmailOptions {
  to: string;
  subject: string;
  text: string;
  icsAttachment?: {
    filename: string;
    content: string;
  };
}

const fromEmail = functions.params.defineString('MAIL_FROM', {
  description: 'Gönderici e-posta adresi',
  default: 'no-reply@randevux.app'
});

const sendgridKey = functions.params.defineString('SENDGRID_API_KEY', {
  description: 'SendGrid API anahtarı',
  default: ''
});

const smtpHost = functions.params.defineString('SMTP_HOST', { default: '' });
const smtpPort = functions.params.defineInt('SMTP_PORT', { default: 587 });
const smtpUser = functions.params.defineString('SMTP_USER', { default: '' });
const smtpPass = functions.params.defineString('SMTP_PASS', { default: '' });

let transporter: nodemailer.Transporter | null = null;

const ensureTransporter = () => {
  if (transporter) {
    return transporter;
  }

  transporter = nodemailer.createTransport({
    host: smtpHost.value(),
    port: smtpPort.value(),
    secure: smtpPort.value() === 465,
    auth: smtpUser.value()
      ? {
          user: smtpUser.value(),
          pass: smtpPass.value()
        }
      : undefined
  });

  return transporter;
};

export const sendEmail = async ({ to, subject, text, icsAttachment }: SendEmailOptions) => {
  if (sendgridKey.value()) {
    sgMail.setApiKey(sendgridKey.value());
    await sgMail.send({
      to,
      from: fromEmail.value(),
      subject,
      text,
      attachments: icsAttachment
        ? [
            {
              filename: icsAttachment.filename,
              content: Buffer.from(icsAttachment.content).toString('base64'),
              type: 'text/calendar'
            }
          ]
        : undefined
    });
    return;
  }

  const mailer = ensureTransporter();
  await mailer.sendMail({
    to,
    from: fromEmail.value(),
    subject,
    text,
    attachments: icsAttachment
      ? [
          {
            filename: icsAttachment.filename,
            content: icsAttachment.content,
            contentType: 'text/calendar'
          }
        ]
      : undefined
  });
};
