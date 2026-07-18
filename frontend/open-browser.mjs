import { spawn, exec } from "child_process";
import net from "net";

/*
  Dev launcher: starts the Next.js HTTPS dev server, waits until it is
  ready, then opens the site in the browser. Used by `npm run dev:https`.
*/

const PORT = 3000;
const URL = `https://localhost:${PORT}`;

// Start Next.js over HTTPS.
const next = spawn("npx", ["next", "dev", "--experimental-https"], {
  stdio: "inherit",
  shell: true,
});

// Every half second, try to reach the port. Once it answers, open the
// browser once and stop checking.
const timer = setInterval(() => {
  const socket = net.connect(PORT, "localhost");
  socket.on("connect", () => {
    socket.end();
    clearInterval(timer);
    console.log(`\nOpening ${URL} in your browser...\n`);
    exec(`start "" "${URL}"`); // "start" opens the default browser
  });
  socket.on("error", () => socket.destroy()); // not up yet, try again
}, 500);

// When the dev server stops (Ctrl+C), stop the checker and exit too.
next.on("exit", (code) => {
  clearInterval(timer);
  process.exit(code ?? 0);
});
