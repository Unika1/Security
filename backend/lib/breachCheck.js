import crypto from "crypto";

/*
  Breached password check using the "Have I Been Pwned" service.

  This is an advanced control: it stops users choosing a password that has
  already appeared in a real-world data breach, which is exactly the kind of
  password attackers try first.

  It uses k-anonymity so the password is never sent anywhere:
    1. We SHA-1 hash the password.
    2. We send ONLY the first 5 characters of the hash to the API.
    3. The API returns all breached hash endings that start with those 5 chars.
    4. We check our own hash ending against that list locally.

  If the check cannot run (for example no internet), we allow the password so
  that sign-up is never blocked by an outside service being down.
*/
export async function isPasswordBreached(password) {
  try {
    const sha1 = crypto
      .createHash("sha1")
      .update(password)
      .digest("hex")
      .toUpperCase();

    const prefix = sha1.slice(0, 5);
    const suffix = sha1.slice(5);

    const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`);
    if (!res.ok) return false; // service problem, do not block the user

    const text = await res.text();
    // Each line looks like "SUFFIX:count". If our suffix is there, it is breached.
    for (const line of text.split("\n")) {
      const [foundSuffix] = line.split(":");
      if (foundSuffix.trim() === suffix) return true;
    }
    return false;
  } catch {
    return false; // network error, do not block the user
  }
}
