const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys')
const express = require('express')
const qrcode = require('qrcode')
const { GoogleGenerativeAI } = require('@google/generative-ai')

const app = express()
let qrCodeData = null
let isConnected = false

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

app.get('/', async (req, res) => {
  if (isConnected) return res.send('<h1 style="text-align:center">✅ Bot خدام!</h1>')
  if (qrCodeData) {
    const qrImage = await qrcode.toDataURL(qrCodeData)
    res.send(`<div style="text-align:center"><h1>سكان QR</h1><img src="${qrImage}" style="width:300px"><p>واتساب > الاجهزة المرتبطة</p><script>setTimeout(()=>location.reload(),10000)</script></div>`)
  } else {
    res.send('<h1>Starting... 30s و ريفريش</h1><script>setTimeout(()=>location.reload(),5000)</script>')
  }
})

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('auth')
  const { version } = await fetchLatestBaileysVersion()
  console.log('Using WA version', version)

  const sock = makeWASocket({ 
    version,
    auth: state, 
    printQRInTerminal: false,
    browser: ['Chrome', 'Chrome', '110.0'],
    connectTimeoutMs: 60000,
    defaultQueryTimeoutMs: 60000,
    keepAliveIntervalMs: 10000,
    markOnlineOnConnect: false
  })

  sock.ev.on('creds.update', saveCreds)
  
  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update
    if (qr) qrCodeData = qr
    if (connection === 'open') {
      isConnected = true
      qrCodeData = null
      console.log('✅ Connected!')
    }
    if (connection === 'close') {
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut
      console.log('Disconnected, reconnect?', shouldReconnect)
      if (shouldReconnect) {
        setTimeout(startBot, 3000)
      } else isConnected = false
    }
  })

  sock.ev.on('messages.upsert', async (m) => {
    try {
      const msg = m.messages[0]
      if (!msg.message || msg.key.fromMe) return
      const text = msg.message.conversation || msg.message.extendedTextMessage?.text
      if (!text) return
      console.log('User:', text)

      const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash" })
      const result = await model.generateContent(`Reply in same language as user (Darija if needed), short friendly: ${text}`)
      const reply = result.response.text()

      await sock.sendMessage(msg.key.remoteJid, { text: reply })
    } catch (e) {
      console.log('AI Error:', e.message)
      // جرب موديل آخر إلا فشل
      try {
        const model2 = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })
        const result2 = await model2.generateContent(m.messages[0].message.conversation)
        await sock.sendMessage(m.messages[0].key.remoteJid, { text: result2.response.text() })
      } catch (e2) {
        console.log('Second fail', e2.message)
      }
    }
  })
}

app.listen(process.env.PORT || 10000, () => console.log('Server on'))
startBot()
