const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys')
const express = require('express')
const qrcode = require('qrcode')
const fs = require('fs')
const path = require('path')

const app = express()
let qrCodeData = null
let isConnected = false

app.get('/', async (req, res) => {
  if (isConnected) {
    return res.send('<h1 style="text-align:center; font-family:Arial">✅ Bot is Connected! خدام مزيان</h1>')
  }
  if (qrCodeData) {
    const qrImage = await qrcode.toDataURL(qrCodeData)
    res.send(`
      <div style="text-align:center; font-family:Arial; padding:20px">
        <h1>سكان QR باش تربط الواتساب</h1>
        <img src="${qrImage}" style="width:300px; border:10px solid black" />
        <p>حل واتساب > الاجهزة المرتبطة > ربط جهاز</p>
        <p>الصفحة كتحدث كل 10 ثواني</p>
        <script>setTimeout(()=>location.reload(),10000)</script>
      </div>
    `)
  } else {
    res.send('<h1 style="text-align:center">Bot is Starting... تسنا 20 ثانية وعاود ريفريش</h1><script>setTimeout(()=>location.reload(),5000)</script>')
  }
})

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('auth')
  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: true
  })

  sock.ev.on('creds.update', saveCreds)
  
  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update
    if (qr) {
      qrCodeData = qr
      console.log('QR Generated! شوف الموقع باش تسكاني')
    }
    if (connection === 'open') {
      isConnected = true
      qrCodeData = null
      console.log('Connected!')
    }
    if (connection === 'close') {
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut
      if (shouldReconnect) startBot()
      else isConnected = false
    }
  })

  // AI reply here
  sock.ev.on('messages.upsert', async (m) => {
    try {
      const msg = m.messages[0]
      if (!msg.message || msg.key.fromMe) return
      const text = msg.message.conversation || msg.message.extendedTextMessage?.text
      if (!text) return

      // هنا دير Gemini ديالك
      // الرد بسيط دابا باش يتستا
      await sock.sendMessage(msg.key.remoteJid, { text: "Bot خدام! كتبتي: " + text })
    } catch (e) { console.log(e) }
  })
}

const PORT = process.env.PORT || 10000
app.listen(PORT, () => console.log('Server on', PORT))
startBot()
