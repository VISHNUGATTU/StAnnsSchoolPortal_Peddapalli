import time
import subprocess
import pyautogui
from urllib.parse import quote

from fastapi import FastAPI
from pydantic import BaseModel
from typing import List
import uvicorn

app = FastAPI()
@app.get("/")
async def root():
    return {"message": "Server is running"}

class Alert(BaseModel):
    phone: str
    message: str


class AlertPayload(BaseModel):
    alerts: List[Alert]


@app.post("/api/whatsapp/send")
async def send_whatsapp_alerts(payload: AlertPayload):

    dispatched = 0

    for alert in payload.alerts:

        phone = "".join(filter(str.isdigit, alert.phone))

        if len(phone) == 10:
            phone = "91" + phone

        if len(phone) != 12:
            continue

        message = quote(alert.message)

        url = f"whatsapp://send?phone={phone}&text={message}"

        # Open in WhatsApp Desktop
        subprocess.Popen(["cmd", "/c", "start", "", url], shell=True)

        # Wait until chat loads
        time.sleep(8)

        # Send
        pyautogui.press("enter")

        time.sleep(2)

        dispatched += 1

    return {
        "success": True,
        "dispatched": dispatched,
        "total": len(payload.alerts),
    }


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)