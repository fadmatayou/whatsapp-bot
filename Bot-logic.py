```python
import os
from openai import OpenAI

client = OpenAI(api_key=os.environ.get("GPT_KEY"))

def get_ai_reply(user_message):
    prompt = f"""
    You are a smart WhatsApp sales bot.

    PRODUCT:
    Price: 199 MAD / 199 SAR (change it as you need)
    Delivery: FREE
    Payment: Cash on delivery

    YOUR TASK:
    1. Detect the customer's language automatically
    2. Reply in the EXACT same language:

    - If Darija (salam, bchehal, khoya) -> Reply in Moroccan Darija
    - If French (bonjour, prix) -> Reply in French
    - If English (hello, price) -> Reply in English
    - If Arabic Fusha / Gulf (السلام عليكم، بكم) -> Reply in Fusha with Gulf respect: حياك الله، يا غالي، أبشر، طال عمرك

    3. Be short, friendly, use 1 emoji
    4. Goal is to close sale: ask for Name, City, Phone

    Customer said: {user_message}
    """

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role":"user","content":prompt}]
    )
    return response.choices[0].message.content
```
