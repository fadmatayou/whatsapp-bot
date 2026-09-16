from flask import Flask, request
import requests
import os

app = Flask(__name__)

TOKEN = os.environ.get("TOKEN")
ID = os.environ.get("ID")

@app.route('/webhook', methods=['GET', 'POST'])
def webhook():
    if request.method == 'GET':
        if request.args.get("hub.verify_token") == "12345":
            return request.args.get("hub.challenge")
        return "Verification failed"

    if request.method == 'POST':
        data = request.get_json()
        try:
            msg = data['entry'][0]['changes'][0]['value']['messages'][0]
            from_number = msg['from']
            text = msg['text']['body']

            url = f"https://graph.facebook.com/v19.0/{ID}/messages"
            headers = {"Authorization": f"Bearer {TOKEN}"}
            payload = {
                "messaging_product": "whatsapp",
                "to": from_number,
                "text": {"body": f"وصلني ميساجك: {text} ✅ البوت خدام!"}
            }
            requests.post(url, headers=headers, json=payload)
        except:
            pass
        return "ok", 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=10000)
