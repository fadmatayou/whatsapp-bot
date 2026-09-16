import os
import requests
from flask import Flask, request

app = Flask(__name__)

TOKEN = os.environ.get("TOKEN")
PHONE_NUMBER_ID = os.environ.get("ID")
VERIFY_TOKEN = os.environ.get("VERIFY_TOKEN")


@app.route("/webhook", methods=["GET", "POST"])
def webhook():

    if request.method == "GET":
        verify_token = request.args.get("hub.verify_token")
        challenge = request.args.get("hub.challenge")

        if verify_token == VERIFY_TOKEN:
            return challenge

        return "Verification failed", 403

    data = request.get_json()

    try:
        message = data["entry"][0]["changes"][0]["value"]["messages"][0]
        sender = message["from"]

        if message["type"] == "text":
            text = message["text"]["body"]

            send_message(sender, f"مرحبا 👋 وصلاتني رسالتك: {text}")

    except Exception as e:
        print("Error:", e)

    return "OK", 200


def send_message(to, text):
    url = f"https://graph.facebook.com/v23.0/{PHONE_NUMBER_ID}/messages"

    headers = {
        "Authorization": f"Bearer {TOKEN}",
        "Content-Type": "application/json"
    }

    data = {
        "messaging_product": "whatsapp",
        "to": to,
        "type": "text",
        "text": {
            "body": text
        }
    }

    requests.post(url, headers=headers, json=data)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
