const express = require('express')
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys')
const QRCode = require('qrcode')
const pino = require('pino')

const app = express()
let qrData = null
let isConnected = false

// صفحة الـ QR
app.get('/', (req, res) => {
  if (isConnected) {
    return res.send(`<center style="font-family:Arial; margin-top:50px"><h1>✅ Bot is Connected 24/24!</h1><p>خدام بـ 4 لغات و ذكي</p></center>`)
  }
  if (!qrData) {
    return res.send(`<center><h2>⏳ كنسايب QR... عاود رفرشي الصفحة من بعد 5 ثواني</h2><script>setTimeout(()=>location.reload(),5000)</script></center>`)
  }
  res.send(`<center style="font-family:Arial"><h2>سكاني هاد QR بواتساب</h2><img src="${qrData}" width="300" style="border:10px solid #000; border-radius:20px"><p>WhatsApp > Paramètres > Appareils connectés > Lier un appareil</p><p>الصفحة كتعاود بوحدها كل 15 ثانية</p><script>setTimeout(()=>location.reload(),15000)</script></center>`)
})

// ذكاء البوت - 4 لغات
function smartReply(text) {
  const msg = text.toLowerCase()

  // تحية
  if (msg.includes('salam') || msg.includes('سلام') || msg.includes('hello') || msg.includes('bonjour') || msg.includes('hola')) {
    return `سلام! 👋 أنا البوت ديالك الذكي\n\nSalut! Je parle 4 langues\nHello! I speak 4 languages\n¡Hola! Hablo 4 idiomas\n\nشنو نقدر نعاونك؟ / Comment puis-je aider?`
  }
  if (msg.includes('labass') || msg.includes('labas') || msg.includes('ça va') || msg.includes('how are you') || msg.includes('como estas')) {
    return `الحمد لله بخير! 😊 ونتا؟\nTrès bien merci! Et toi?\nI'm fine thank you! And you?`
  }
  if (msg.includes('شكون نتا') || msg.includes('who are you') || msg.includes('qui es tu') || msg.includes('quien eres')) {
    return `أنا بوت ذكي خدام 24/24 🤖\nمصاوب بـ Baileys + Render\nكنهضر: العربية، الدارجة، Français، English، Español`
  }
  if (msg.includes('price') || msg.includes('prix') || msg.includes('ثمن') || msg.includes('precio')) {
    return `Pour le prix / For price / للثمن، تواصل مع صاحب البوت مباشرة 📞`
  }

  // جواب افتراضي ذكي
  return `فهمتك! ✅\nJ'ai compris! / I got it! / ¡Entendido!\n\nقلتي: "${text}"\n\nأنا باقي كنتعلم، ولكن خدام 24/24 باش نجاوبك فأي وقت ⏰`
}

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('./auth')
  const sock = makeWASocket({
    auth: state,
    logger: pino({ level: 'silent' }),
    printQRInTerminal: false
  })

  sock.ev.on('creds.update', saveCreds)

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update
    if (qr) {
      console.log("QR Generated")
      qrData = await QRCode.toDataURL(qr)
    }
    if (connection === 'close') {
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode!== DisconnectReason.loggedOut
      if (shouldReconnect) {
        console.log("Reconnecting...")
        startBot()
      }
    } else if (connection === 'open') {
      isConnected = true
      console.log("✅ Bot Connected 24/24 - 4 langues - Intelligent")
    }
  })

  // استقبال الرسائل
  sock.ev.on('messages.upsert', async (m) => {
    try {
      const msg = m.messages[0]
      if (!msg.message || msg.key.fromMe) return
      const text = msg.message.conversation || msg.message.extendedTextMessage?.text || ""
      if (!text) return

      const reply = smartReply(text)
      await sock.sendMessage(msg.key.remoteJid, { text: reply })
    } catch (e) {
      console.log(e)
    }
  })
}

startBot()
app.listen(10000, () => console.log("Server Live on 10000 - Bot 24/24"))
