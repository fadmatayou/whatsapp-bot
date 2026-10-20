const express = require('express');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.post('/chat', async (req, res) => {
  try {
    const key = process.env.GEMINI_API_KEY;
    if (!key) return res.json({ reply: "ما كاينش المفتاح ف Render" });

    const genAI = new GoogleGenerativeAI(key);
    
    // تم التصحيح - موديل جديد خدام
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const msg = req.body.message || "سلام";
    const result = await model.generateContent(`You are LinguaBot. Reply in same language as user. User: ${msg}`);
    const text = result.response.text();
    res.json({ reply: text });

  } catch (e) {
    console.error(e);
    res.json({ reply: "Error: " + e.message });
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log("Live"));
