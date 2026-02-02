import {mg} from "../../config/mailgun.js";
export const sendEmail = async ({to, subject, html, text}) => {
  if (!process.env.MAILGUN_DOMAIN) {
    throw new Error("Mailgun domain not configured");
  }

  const response = await mg.messages.create(process.env.MAILGUN_DOMAIN, {
    from: process.env.MAIL_FROM,
    to,
    subject,
    text,
    html,
  });
  console.log("MAILGUN RESPONSE:", response);
};
