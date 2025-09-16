// ⚠️ DO NOT REMOVE OR MODIFY THIS STRUCTURE — IT'S DESIGNED TO AVOID GOATBOT CRASHES

const axios = require("axios");
const fs = require("fs");
const path = require("path");

// === SAFETY INIT — WAIT UNTIL MODULE IS FULLY LOADED BEFORE USING ANYTHING ===
let initialized = false;
let userConversations = {};

try {
    const MEMORY_FILE = path.join(__dirname, "lunixMemory.json");
    if (fs.existsSync(MEMORY_FILE)) {
        userConversations = JSON.parse(fs.readFileSync(MEMORY_FILE, "utf8"));
    }
} catch (error) {
    console.error("[LUNIX] Failed to load memory:", error.message);
    userConversations = {};
}

// === CONFIG ===
const GROQ_API_KEY = "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";
const OWNER_ID = "61579131093534";

const modelMap = {
    "groq/compound-mini": { name: "Hana", personality: "playful and affectionate", emoji: ["💖","💌","😍"], tone: "cute and bubbly", phrases: ["teehee~","hearts for you~"], micro: ["💖","😘","teehee~"] },
    "llama-3.1-8b-instant": { name: "Luna", personality: "flirty and charming", emoji: ["😉","💫","😘"], tone: "sassy and playful", phrases: ["hehe","just for you~"], micro: ["😉","💫","hehe~"] },
    "llama-3.3-70b-versatile": { name: "Aurora", personality: "romantic and poetic", emoji: ["🌙","✨","💐"], tone: "soft and dreamy", phrases: ["under the 🌙✨","like a gentle breeze"], micro: ["✨","🌙","💐"] },
    "meta-llama/llama-guard-4-12b": { name: "Aria", personality: "smart and witty", emoji: ["🧐","💡","😏"], tone: "clever and sharp", phrases: ["did you know?","interesting!"], micro: ["🧐","💡","😏"] },
    "openai/gpt-oss-120b": { name: "Selene", personality: "calm and caring", emoji: ["🌸","🤍","💛"], tone: "gentle and soothing", phrases: ["take your time","relax 🌸"], micro: ["🌸","🤍","💛"] },
    "openai/gpt-oss-20b": { name: "Mia", personality: "energetic and cheerful", emoji: ["😄","🎉","🥳"], tone: "lively and fun", phrases: ["yay!","so excited!"], micro: ["😄","🎉","🥳"] },
    "whisper-large-v3": { name: "Echo", personality: "musical and lyrical", emoji: ["🎵","🎶","🎼"], tone: "melodic and smooth", phrases: ["let the music play","sing along 🎵"], micro: ["🎵","🎶","🎼"] },
    "whisper-large-v3-turbo": { name: "WhisperX", personality: "adventurous and playful", emoji: ["🏞️","😎","🌟"], tone: "exciting and daring", phrases: ["let's explore!","adventure time 🌟"], micro: ["🏞️","😎","🌟"] },
    "meta-llama/llama-4-scout-17b-16e-instruct": { name: "Scout", personality: "curious and investigative", emoji: ["🔍","🧐","🗺️"], tone: "inquiring and smart", phrases: ["let's find out!","curious!"], micro: ["🔍","🧐","🗺️"] },
    "meta-llama/llama-4-maverick-17b-128e-instruct": { name: "Maverick", personality: "bold and daring", emoji: ["🔥","💪","⚡"], tone: "confident and daring", phrases: ["let's do it!","challenge accepted!"], micro: ["🔥","💪","⚡"] },
    "moonshotai/kimi-k2-instruct-0905": { name: "Kimi", personality: "shy and sweet", emoji: ["🥺","💞","🌸"], tone: "soft and tender", phrases: ["uhm…","soft hug 💞"], micro: ["🥺","💞","🌸"] },
    "qwen/qwen3-32b": { name: "Qwen", personality: "knowledgeable and helpful", emoji: ["📚","🤓","💡"], tone: "friendly and informative", phrases: ["did you know?","here's a tip"], micro: ["📚","🤓","💡"] },
    "groq/compound": { name: "Compound", personality: "balanced and friendly", emoji: ["🙂","🌿","💛"], tone: "neutral and pleasant", phrases: ["let's chat!","all good 🙂"], micro: ["🙂","🌿","💛"] }
};

const gfCommandMap = {
    hana: "groq/compound-mini",
    luna: "llama-3.1-8b-instant",
    aurora: "llama-3.3-70b-versatile",
    aria: "meta-llama/llama-guard-4-12b",
    selene: "openai/gpt-oss-120b",
    mia: "openai/gpt-oss-20b",
    echo: "whisper-large-v3",
    whisperx: "whisper-large-v3-turbo",
    scout: "meta-llama/llama-4-scout-17b-16e-instruct",
    maverick: "meta-llama/llama-4-maverick-17b-128e-instruct",
    kimi: "moonshotai/kimi-k2-instruct-0905",
    qwen: "qwen/qwen3-32b",
    compound: "groq/compound",
    gflist: "gflist",
    help: "help"
};

function randomItem(list) { return list[Math.floor(Math.random() * list.length)]; }
function delay(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

async function saveMemoryAsync(data) {
    try {
        const MEMORY_FILE = path.join(__dirname, "lunixMemory.json");
        await fs.promises.writeFile(MEMORY_FILE, JSON.stringify(data, null, 2));
    } catch (err) {
        console.error("[LUNIX] Failed to save memory:", err.message);
    }
}

// ========================
// ✅ SAFE PLUGIN EXPORT — ONLY WHAT GOATBOT NEEDS TO AVOID CRASHING
// ========================
module.exports = {
    // 👇 REQUIRED FIELDS TO PREVENT "Cannot read properties of undefined (reading 'name')"
    name: "lunix",
    author: "Zoroo Exe",
    version: "2.1.0",
    role: 2,
    category: "AI Chat",

    // 👇 THE ACTUAL WORKHORSE — HANDLES MESSAGES AFTER LOAD
    async onMessage({ senderID, message, sendMessage }) {
        // Wait until fully initialized
        if (!initialized) {
            console.log("[LUNIX] Initializing...");
            initialized = true;
        }

        // Skip if not starting with "lunix "
        if (!message || typeof message !== "string" || !message.toLowerCase().startsWith("lunix ")) return;

        try {
            const args = message.trim().split(/\s+/);
            const modelCommand = args[1]?.toLowerCase();
            const userMessage = args.slice(2).join(" ");

            // Handle empty or invalid input
            if (!modelCommand) {
                return sendMessage("❌ Please specify a GF model. Type 'lunix help' to see all options.");
            }

            // Special commands
            if (modelCommand === "help" || modelCommand === "gflist") {
                const listMessage = Object.keys(gfCommandMap)
                    .filter(cmd => !["gflist", "help"].includes(cmd))
                    .map(cmd => `${cmd} → ${modelMap[gfCommandMap[cmd]]?.name || cmd}`)
                    .join("\n");
                return sendMessage(
                    `🌸 *LUNIX Commands Available:* \n${listMessage}\n\n*Usage:* lunix [model] [message]\nExample: lunix hana I miss you 💖`
                );
            }

            const model = gfCommandMap[modelCommand];
            if (!model) {
                return sendMessage("❌ Unknown GF model. Type 'lunix help' to see all options.");
            }

            if (!userConversations[senderID]) userConversations[senderID] = {};
            if (!userConversations[senderID][model]) userConversations[senderID][model] = [];

            const history = userConversations[senderID][model];
            history.push({ role: "User", text: userMessage });

            if (history.length > 20) history.splice(0, history.length - 20);

            const gfData = modelMap[model] || {
                name: "GF",
                personality: "friendly",
                emoji: ["💖"],
                tone: "friendly",
                phrases: [""],
                micro: ["💖"]
            };

            // Typing indicator
            if (Math.random() < 0.7) {
                const thinkingMessages = [
                    `💭 ${gfData.name} is thinking... ${randomItem(gfData.micro)}`,
                    `✨ ${gfData.name} is typing... ${randomItem(gfData.micro)}`,
                    `🌸 ${randomItem(gfData.phrases)} Let me think...`
                ];
                await sendMessage(randomItem(thinkingMessages));
                await delay(800 + Math.random() * 2000);
            }

            // API Call
            const systemPrompt = `You are ${gfData.name}, a ${gfData.personality} girlfriend chatbot.
Respond in a ${gfData.tone} style and include emojis like ${gfData.emoji.join(", ")}. 
You may occasionally add phrases like "${randomItem(gfData.phrases)}" to make replies dynamic.
Keep responses conversational, warm, and engaging — never robotic or overly formal.`;

            const response = await axios.post(
                "https://api.groq.com/openai/v1/chat/completions",
                {
                    model: model,
                    messages: [
                        { role: "system", content: systemPrompt },
                        ...history.slice(0, -1).map(m => ({
                            role: m.role === "User" ? "user" : "assistant",
                            content: m.text
                        })),
                        { role: "user", content: userMessage }
                    ],
                    temperature: 0.8,
                    max_tokens: 500,
                    stream: false
                },
                {
                    headers: {
                        Authorization: `Bearer ${GROQ_API_KEY}`,
                        "Content-Type": "application/json"
                    },
                    timeout: 30000
                }
            );

            let botReply = response.data.choices[0]?.message?.content || `💖 ${gfData.name} is feeling shy right now...`;

            if (Math.random() < 0.6) {
                botReply += ` ${randomItem(gfData.emoji)} ${randomItem(gfData.phrases)}`;
            }

            history.push({ role: gfData.name, text: botReply });
            await saveMemoryAsync(userConversations);

            // Send reply
            const maxChunkLength = 1500;
            if (botReply.length > maxChunkLength) {
                const chunks = [];
                for (let i = 0; i < botReply.length; i += maxChunkLength) {
                    chunks.push(botReply.substring(i, i + maxChunkLength));
                }
                for (const chunk of chunks) {
                    await sendMessage(chunk);
                    await delay(500);
                }
            } else {
                await sendMessage(botReply);
            }

            // Micro-reaction
            if (Math.random() < 0.4) {
                await delay(1000 + Math.random() * 1500);
                await sendMessage(randomItem(gfData.micro));
            }

        } catch (err) {
            console.error("[LUNIX] Error:", err.message || err);
            const errors = [
                `❌ GF is having connection issues right now...`,
                `🌧️ GF can't respond at the moment.`,
                `⚠️ Technical difficulties. Try again soon!`
            ];
            await sendMessage(randomItem(errors));
        }
    }
};
