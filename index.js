const { Client, LocalAuth } = require('whatsapp-web.js');
const express = require('express');
const OpenAI = require('openai');
const app = express();
let pairingCode = "كنوجد الكود... ثانية";
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const BUSINESS_INFO = process.env.BUSINESS_INFO || "You are a smart sales assistant for any business. Help customers, answer questions, collect orders/appointments.";

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    headless: true,
    args: ['--no-sandbox','--disable-setuid-sandbox','--disable-dev-shm-usage'],
    executablePath: '/usr/bin/chromium-browser'
  }
});
client.on('ready', () => { pairingCode = "✅ البوت خدام 24/24!"; });
client.on('message', async msg => {
  if(msg.fromMe) return;
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {role: "system", content: `You are a world-class WhatsApp sales & support bot. 
        Business Info: ${BUSINESS_INFO}
        Rules: 1- Reply in SAME language as customer (Darija/Arabic/French/English/Spanish... auto detect). 2- Be short, friendly, sales-focused. 3- Collect Name+Need+City for lead. 4- You work for any business: clothes, cars, clinic, restaurant, etc. Adapt automatically.
        5- If customer speaks Darija, reply Darija. If French, reply French.`},
        {role: "user", content: msg.body}
      ]
    });
    await client.sendMessage(msg.from, completion.choices[0].message.content);
  } catch(e){
    await client.sendMessage(msg.from, "سلام! مرحبا بيك 👋 كيف نقدر نعاونك اليوم؟ / Hello! How can I help you?");
  }
});
(async()=>{
  await client.initialize();
  try {
    const code = await client.requestPairingCode("212632432301");
    pairingCode = code;
  } catch(e){}
})();
app.get('/', (req,res)=>res.send(`<div style="text-align:center;padding:20px"><h1 style="font-size:50px;background:yellow;padding:20px">${pairingCode}</h1><p>WhatsApp > Linked devices > Link with phone number</p></div>`));
app.listen(3000);
