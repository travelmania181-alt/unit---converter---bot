// === Replace this BACKEND_URL after you deploy backend on Vercel ===
// Example: const BACKEND_URL = "https://your-project.vercel.app/api/chat";
const BACKEND_URL = "https://REPLACE_WITH_YOUR_VERCEL_URL/api/chat";

const messagesEl = document.getElementById("messages");
const userInput = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");

function addMessage(text, who) {
  const div = document.createElement("div");
  div.className = "message " + (who === "user" ? "user" : "bot");
  div.textContent = text;
  messagesEl.appendChild(div);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

sendBtn.addEventListener("click", sendMessage);
userInput.addEventListener("keypress", (e) => { if (e.key === "Enter") sendMessage(); });

async function sendMessage() {
  const text = userInput.value.trim();
  if (!text) return;
  addMessage(text, "user");
  userInput.value = "";
  addMessage("Thinking...", "bot");

  try {
    const resp = await fetch(BACKEND_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: text })
    });
    const data = await resp.json();
    // replace the last "Thinking..." message
    const botMsgs = messagesEl.querySelectorAll(".bot");
    if (botMsgs.length) botMsgs[botMsgs.length - 1].textContent = data.reply || "No reply";
    else addMessage(data.reply || "No reply", "bot");
  } catch (err) {
    const botMsgs = messagesEl.querySelectorAll(".bot");
    if (botMsgs.length) botMsgs[botMsgs.length - 1].textContent = "Error: " + err.toString();
    else addMessage("Error: " + err.toString(), "bot");
  }
}

// Quick converter logic
document.getElementById("convBtn").addEventListener("click", () => {
  const v = parseFloat(document.getElementById("val").value);
  const from = document.getElementById("from").value;
  const to = document.getElementById("to").value;
  const out = convertMeasurement(v, from, to);
  document.getElementById("convResult").textContent = out === null ? "N/A" : out;
});

function convertMeasurement(value, from, to) {
  if (isNaN(value)) return null;
  // Basic conversions
  const toMeters = {
    cm: v => v / 100,
    m: v => v,
    km: v => v * 1000
  };
  if (from in toMeters && to in toMeters) {
    // convert -> meters -> target
    const meters = toMeters[from](value);
    const target = meters / toMeters;
    return target.toString();
  }
  // mass kg <-> lb
  if ((from === "kg" || from === "lb") && (to === "kg" || to === "lb")) {
    const inKg = from === "kg" ? value : value / 2.2046226218;
    const out = to === "kg" ? inKg : (inKg * 2.2046226218);
    return out.toFixed(6);
  }
  // temperature
  if (from === "c" && to === "f") return (value * 9 / 5 + 32).toFixed(2);
  if (from === "f" && to === "c") return ((value - 32) * 5 / 9).toFixed(2);
  if (from === to) return value.toString();
  return null;
}
