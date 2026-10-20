const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys')
const express = require('express')
const qrcode = require('qrcode')
const { GoogleGenerativeAI } = require('@google/generative-ai')

const app = express()
let qrCodeData = null
let isConnected = false

// Gemini - موديل جديد
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })

app.get('/', async (req, res) => {
  if (isConnected) {
    return res.send('<h1 style="text-align:center; font-family:Arial">✅ Bot خدام مع Gemini!</h1>')
  }
  if (qrCodeData) {
    const qrImage = await qrcode.toDataURL(qrCodeData)
    res.send(`
      <div style="text-align:center; font-family:Arial; padding:20px">
        <h1>سكان QR</h1>
        <img src="${qrImage}" style="width:300px; border:10px solid black" />
        <p>واتساب > الاجهزة المرتبطة > ربط جهاز</p>
        <script>setTimeout(()=>location.reload(),10000)</script>
      </div>
    `)
  } else {
    res.send('<h1 style="text-align:center">Starting... تسنا 20 ثانية وريفريش</h1><script>setTimeout(()=>location.reload(),5000)</script>')
  }
})

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('auth')
  const sock = makeWASocket({ auth: state, printQRInTerminal: true })

  sock.ev.on('creds.update', saveCreds)
  
  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update
    if (qr) qrCodeData = qr
    if (connection === 'open') {
      isConnected = true
      qrCodeData = null
      console.log('Connected with Gemini!')
    }
    if (connection === 'close') {
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut
      if (shouldReconnect) startBot()
      else isConnected = false
    }
  })

  sock.ev.on('messages.upsert', async (m) => {
    try {
      const msg = m.messages[0]
      if (!msg.message || msg.key.fromMe) return
      const text = msg.message.conversation || msg.message.extendedTextMessage?.text || msg.message.imageMessage?.caption
      if (!text) return

      console.log('User:', text)

      const prompt = `You are a helpful, friendly WhatsApp AI assistant. 
      IMPORTANT: Reply in the SAME language the user uses. If user speaks Darija Moroccan Arabic, reply in Darija. If Arabic, reply in Arabic. If French, reply in French. If English, reply in English.
      Be short, friendly, funny sometimes. User says: ${text}`

      const result = await model.generateContent(prompt)
      const reply = result.response.text()

      await sock.sendMessage(msg.key.remoteJid, { text: reply })

    } catch (e) {
      console.log('FULL ERROR:', e)
      try {
        // دابا غادي يوريك الخطأ الحقيقي فالواتساب
        await sock.sendMessage(m.messages[0].key.remoteJid, { text: "الخطأ الحقيقي هو: " + e.message })
      } catch {}
    }
  })
}

const PORT = process.env.PORT || 10000
app.listen(PORT, () => console.log('Server on', PORT))
startBot()
