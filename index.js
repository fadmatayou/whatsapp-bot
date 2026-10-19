const express = require('express');
const path = require('path');
const OpenAI = require('openai');
const app = express();
app.use(require('cors')());
app.use(express.json());
app.use(express.static('public'));

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.get('/chat', async (req, res) => {
  const msg = req.query.message || "سلام";
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are LinguaBot, a smart sales assistant. ALWAYS reply in user's language. You can recommend products and learning. Be friendly, short, and helpful. If user wants to learn languages, suggest our premium." },
        { role: "user", content: msg }
      ]
    });
    res.json({ reply: completion.choices[0].message.content });
  } catch (e) { res.json({ error: e.message }); }
});

app.listen(process.env.PORT || 10000, () => console.log('خدام'));
