import { spawn, exec } from "child_process";
import net from "net";

/*
  Dev launcher: starts the Next.js HTTPS dev server, waits until it is
  actually accepting connections, then opens https://localhost:3000 in the
  default browser. Used by `npm run dev:https`.
*/

const URL = "https://localhost:3000";

// Start Next.js exactly like before; its output shows in this same terminal.
const next = spawn("npx", ["next", "dev", "--experimental-https"], {
  stdio: "inherit",
  shell: true,
});

// Every half second, try to reach port 3000. The moment it answers,
// open the browser (once) and stop checking.
const timer = setInterval(() => {
  const socket = net.connect(3000, "localhost");
  socket.on("connect", () => {
    socket.end();
    clearInterval(timer);
    console.log(`\nOpening ${URL} in your browser...\n`);
    exec(`start "" "${URL}"`); // "start" = Windows "open with default browser"
  });
  socket.on("error", () => socket.destroy()); // not up yet — try again
}, 500);

// When the dev server stops (Ctrl+C), stop the checker and exit too.
next.on("exit", (code) => {
  clearInterval(timer);
  process.exit(code ?? 0);
});
