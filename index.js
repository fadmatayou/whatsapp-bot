const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const express = require('express');
const qrcode = require('qrcode-terminal');
const P = require('pino');

const app = express();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth');
    
    const sock = makeWASocket({
        auth: state,
        logger: P({ level: 'silent' }),
        printQRInTerminal: true
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;
        if(connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            if(shouldReconnect) startBot();
        } else if(connection === 'open') {
            console.log("✅ البوت تربط بنجاح!");
        }
    });

    sock.ev.on('messages.upsert', async m => {
        const msg = m.messages[0];
        if(!msg.message || msg.key.fromMe) return;
        
        const text = msg.message.conversation || msg.message.extendedTextMessage?.text;
        if(!text) return;

        const sender = msg.key.remoteJid;
        console.log("رسالة جديدة: " + text);

        try {
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
            const prompt = `انت مساعد مبيعات ذكي لمحل مغربي. جاوب بلهجة مغربية زوينة ومختصرة. الزبون قال: ${text}`;
            const result = await model.generateContent(prompt);
            const reply = result.response.text();
            await sock.sendMessage(sender, { text: reply });
        } catch(e) {
            console.log(e);
        }
    });
}

startBot();

app.get('/', (req,res) => res.send('Bot is Running - شوف Logs باش تلقا QR'));
app.listen(process.env.PORT || 10000);
