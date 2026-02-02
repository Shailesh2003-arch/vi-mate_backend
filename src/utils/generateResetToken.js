import crypto from "crypto";

export const generateResetToken = () => {
  const rawToken = crypto.randomBytes(32).toString("hex");
  const hashedToken = crypto
    .createHash("sha256")
    .update(rawToken)
    .digest("hex");
  return {
    rawToken,
    hashedToken,
    expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
  };
};
