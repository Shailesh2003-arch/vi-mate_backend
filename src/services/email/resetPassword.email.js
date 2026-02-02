import {sendEmail} from "./email.service.js";

export const sendResetPasswordEmail = async ({to, name, resetLink}) => {
  const subject = "Reset your password";

  const html = `
    <p>Hey ${name},</p>
    <p>You requested a password reset.</p>
    <p>
      <a href="${resetLink}">
        Reset your password
      </a>
    </p>
    <p>This link expires in 10 minutes.</p>
  `;

  const text = `
    Hey ${name},
    Reset your password using this link:
    ${resetLink}
    This link expires in 10 minutes.
  `;

  await sendEmail({
    to,
    subject,
    html,
    text,
  });
};
