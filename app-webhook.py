```python
from flask import Flask, request
import os, requests
from bot_logic import get_ai_reply

app = Flask(_name_)

TOKEN = os.environ.get("TOKEN")
ID = os.environ.get("ID")

@app.route('/webhook', methods=['GET','POST'])
def webhook():
    if request.method == 'GET':
        if request.args.get("hub.verify_token") == "12345":
            return request.args.get("hub.challenge")
        return "fail"

    data = request.get_json()
    try:
        message = data['entry'][0]['changes'][0]['value']['messages'][0]
        user_text = message['text']['body']
        user_number = message['from']
        ai_reply = get_ai_reply(user_text)
        url = f"https://graph.facebook.com/v19.0/{ID}/messages"
        headers = {"Authorization": f"Bearer {TOKEN}"}
        payload = {"messaging_product":"whatsapp","to":user_number,"text":{"body":ai_reply}}
        requests.post(url, headers=headers, json=payload)
    except:
        pass
    return "ok", 200

if _name_ == '_main_':
    app.run(host='0.0.0.0', port=10000)
```
