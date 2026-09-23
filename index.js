// bot WhatsApp - 5 لغات ذكي ب Groq فابور
const { default: makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys')
const P = require('pino')
const qrcode = require('qrcode-terminal')
const GROQ_KEY = process.env.GROQ_KEY

async function askAI(msg, lang) {
  const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type":"application/json", "Authorization":`Bearer ${GROQ_KEY}` },
    body: JSON.stringify({
      model:"llama-3.3-70b-versatile",
      messages:[
        {role:"system", content:`You are bot WhatsApp. You MUST answer only in ${lang}. If lang is darija use moroccan arabizi. If arabic use Modern Standard Arabic. Sell: 499DH Starter, 999DH Pro, 1999DH Agency. Short salesman.`},
        {role:"user", content: msg}
      ]
    })
  })
  const d = await r.json()
  return d.choices[0].message.content
}

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('session')
    const sock = makeWASocket({ auth: state, logger: P({ level: 'silent' }) })
    sock.ev.on('creds.update', saveCreds)
    sock.ev.on('connection.update', (u) => {
        if(u.qr) qrcode.generate(u.qr, {small: true})
        if(u.connection === 'open') console.log("✅ bot WhatsApp 5 langues KHDAAM")
    })
    sock.ev.on('messages.upsert', async ({ messages }) => {
        const m = messages[0]
        if(!m.message || m.key.fromMe) return
        const from = m.key.remoteJid
        const text = m.message.conversation || m.message.extendedTextMessage?.text || ""

        let lang='darija';
        if(/[\u0600-\u06FF]/.test(text) || /السلام|السعر|مرحبا/i.test(text)) lang='arabic';
        else if(/bonjour|prix/i.test(text)) lang='français';
        else if(/hello|price/i.test(text)) lang='english';
        else if(/hola|precio/i.test(text)) lang='español';

        const reply = await askAI(text, lang)
        await sock.sendMessage(from, { text: reply })
    })
}
startBot()
