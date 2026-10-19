const express = require('express');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.post('/api/chat', async (req, res) => {
  try {
    const userMessage = req.body.message || req.body.text || "";
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(userMessage);
    const reply = result.response.text();
    res.json({ reply: reply });
  } catch (error) {
    console.log(error);
    res.json({ reply: "عندي شوية ضغط دابا، عاود سولني" });
  }
});

// باش يخدم حتى إلا الفرونت كيعيط على /chat
app.post('/chat', async (req, res) => {
  try {
    const userMessage = req.body.message || req.body.text || "";
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(userMessage);
    res.json({ reply: result.response.text() });
  } catch (e) {
    res.json({ reply: "عندي شوية ضغط دابا، عاود سولني" });
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log("LinguaBot خدام على البورت " + PORT));
