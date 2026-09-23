// bot WhatsApp - ذكي 100% ب Groq فابور
const { default: makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys')
const P = require('pino')
const qrcode = require('qrcode-terminal')
const GROQ_KEY = process.env.GROQ_KEY

async function askAI(message, lang) {
  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${GROQ_KEY}` },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: `You are bot WhatsApp. You sell WhatsApp automation services. Prices: Starter 499DH, Pro 999DH, Agency 1999DH. User language: ${lang}. Be short, friendly salesman. Goal: get client name and business.` },
          { role: "user", content: message }
        ]
      })
    })
    const data = await res.json()
    return data.choices[0].message.content
  } catch(e){ return "عاود سولني بطريقة اخرى عافاك" }
}

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('session')
    const sock = makeWASocket({ auth: state, logger: P({ level: 'silent' }) })
    sock.ev.on('creds.update', saveCreds)
    sock.ev.on('connection.update', (u) => {
        if(u.qr){ qrcode.generate(u.qr, {small: true}) }
        if(u.connection === 'open') console.log("✅ bot WhatsApp KHDAAM 24/24")
    })
    sock.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0]
        if(!msg.message || msg.key.fromMe) return
        const from = msg.key.remoteJid
        const text = msg.message.conversation || msg.message.extendedTextMessage?.text || ""
        let lang = 'darija'
        if(/bonjour|prix/i.test(text)) lang='français'
        else if(/hello|price/i.test(text)) lang='english'
        else if(/hola/i.test(text)) lang='español'
        const reply = await askAI(text, lang)
        await sock.sendMessage(from, { text: reply })
    })
}
startBot()
