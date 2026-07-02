import nodemailer from "nodemailer";

/*
  Email sender for the 2FA one-time codes.

  If no EMAIL_USER is set in .env, we automatically create a free "Ethereal"
  test account. Ethereal doesn't really deliver mail — it gives a preview URL
  we print in the terminal so you can SEE the code while testing.
*/

let cachedTransporter = null;

async function getTransporter() {
  if (cachedTransporter) return cachedTransporter;

  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    cachedTransporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT) || 587,
      secure: Number(process.env.EMAIL_PORT) === 465,
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });
    return cachedTransporter;
  }

  const testAccount = await nodemailer.createTestAccount();
  cachedTransporter = nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false,
    auth: { user: testAccount.user, pass: testAccount.pass },
  });
  return cachedTransporter;
}

export async function sendOtpEmail(to, code) {
  const transporter = await getTransporter();
  const info = await transporter.sendMail({
    from: process.env.EMAIL_FROM || "CityMate <no-reply@citymate.local>",
    to,
    subject: "Your CityMate login code",
    text: `Your CityMate verification code is ${code}. It expires in 5 minutes.`,
    html: `<p>Your CityMate verification code is:</p>
           <p style="font-size:24px;font-weight:bold;letter-spacing:4px">${code}</p>
           <p>It expires in 5 minutes. If you did not try to log in, ignore this email.</p>`,
  });

  const preview = nodemailer.getTestMessageUrl(info);
  if (preview) {
    console.log("\n========================================");
    console.log("OTP EMAIL PREVIEW (open this to see the code):");
    console.log(preview);
    console.log("========================================\n");
  }
  return info;
}
