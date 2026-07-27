import svgCaptcha from "svg-captcha";
import jwt from "jsonwebtoken";

  // CAPTCHA to stop automated bots from creating accounts.
  // A distorted-text image is generated on the app's own server (no outside service).
  // The answer is not stored in a database. Instead, a short-lived signed
  // token (JWT) holds the answer, and the browser sends that token back with
  // the user's typed answer. This keeps it simple and stateless.

const CAPTCHA_MINUTES = 5;
// Make a new CAPTCHA. Returns the image (as a data URI) and a token.
export function makeCaptcha() {
  const captcha = svgCaptcha.create({
    size: 5, // 5 characters
    noise: 3, // lines to make it harder for bots
    ignoreChars: "0o1il", // remove easily-confused characters
    color: true,
  });
  // Store the answer (lower-cased) inside a signed token that expires soon.
  const token = jwt.sign(
    { answer: captcha.text.toLowerCase() },
    process.env.JWT_SECRET,
    { expiresIn: `${CAPTCHA_MINUTES}m` }
  );
  const image = "data:image/svg+xml;base64," + Buffer.from(captcha.data).toString("base64");
  return { token, image };
}
// Check a user's answer against the token. Returns true if correct.
export function verifyCaptcha(token, answer) {
  if (!token || !answer) return false;
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    return payload.answer === String(answer).trim().toLowerCase();
  } catch {
    return false; // token missing, wrong, or expired
  }
}
