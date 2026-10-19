const express = require('express');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.post('/chat', async (req, res) => {
  try {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      return res.json({ reply: "المفتاح GEMINI_API_KEY ما كاينش ف Render، سير لـ Environment وزيدو" });
    }
    
    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const userMessage = req.body.message || "Hi";
    const result = await model.generateContent(`Reply in same language as user. User says: ${userMessage}`);
    const reply = result.response.text();
    
    res.json({ reply });
  } catch (e) {
    console.log("REAL ERROR:", e.message);
    res.json({ reply: "Error حقيقي: " + e.message });
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log("Live"));
