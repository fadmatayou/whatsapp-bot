const express = require('express')
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys')
const QRCode = require('qrcode')
const P = require('pino')

const app = express()
let qrImage = null
let isConnected = false

app.get('/', async (req, res) => {
  if(isConnected) return res.send('<h1 style="text-align:center;margin-top:50px">✅ LinguaBot CONNECTED 24/7<br>البوت خدام دابا!</h1>')
  if(!qrImage) return res.send('<h1>⏳ Generating QR... refresh after 10 sec</h1><script>setTimeout(()=>location.reload(),5000)</script>')
  res.send(`<div style="text-align:center;font-family:sans-serif;margin-top:30px"><h1>🤖 LinguaBot - Scan QR</h1><img src="${qrImage}" style="width:320px;border:10px solid #000;border-radius:15px"><p><b>WhatsApp > الأجهزة المرتبطة > ربط جهاز</b></p></div><script>setTimeout(()=>location.reload(),10000)</script>`)
})

async function startBot() {
  const { version } = await fetchLatestBaileysVersion()
  const { state, saveCreds } = await useMultiFileAuthState('./auth_info')
  const sock = makeWASocket({ version, auth: state, logger: P({ level: 'silent' }) })
  sock.ev.on('creds.update', saveCreds)
  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update
    if(qr){ qrImage = await QRCode.toDataURL(qr) }
    if(connection === 'close'){
      const shouldReconnect = (lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut
      if(shouldReconnect){ isConnected = false; startBot() }
    } else if(connection === 'open'){ isConnected = true; qrImage = null; console.log("CONNECTED") }
  })
  sock.ev.on('messages.upsert', async m => {
    const msg = m.messages[0]
    if(!msg.message || msg.key.fromMe) return
    const text = msg.message.conversation || msg.message.extendedTextMessage?.text || ""
    const from = msg.key.remoteJid
    if(text.toLowerCase().includes("سلام") || text.toLowerCase().includes("salam")){
      await sock.sendMessage(from, { text: "وعليكم السلام! مرحبا بيك ف LinguaBot 🤖\nشنو بغيتي تتعلم اليوم؟" })
    } else {
      await sock.sendMessage(from, { text: `وصلاتني رسالتك: "${text}"\nالبوت ديال LinguaBot خدام ✅` })
    }
  })
}

startBot()
app.listen(3000, ()=> console.log("Server started"))
