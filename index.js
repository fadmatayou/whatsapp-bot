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
    
    // جرب الموديل الجديد، إلا ما خدمش جرب القديم
    let model;
    try {
      model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    } catch {
      model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
    }

    const msg = req.body.message || "سلام";
    const result = await model.generateContent(`You are LinguaBot. Reply in same language as user. User: ${msg}`);
    const text = result.response.text();
    res.json({ reply: text });

  } catch (e) {
    console.error(e);
    // إلا بقا مشكل جرب موديل تالت
    try {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model2 = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
      const result = await model2.generateContent(req.body.message);
      return res.json({ reply: result.response.text() });
    } catch (e2) {
      res.json({ reply: "Error: " + e2.message });
    }
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log("Live"));
