import time
import webbrowser
import pyautogui
from urllib.parse import quote
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List

app = FastAPI()

class Alert(BaseModel):
    phone: str
    message: str

class AlertPayload(BaseModel):
    alerts: List[Alert]

@app.post("/api/whatsapp/send")
async def send_whatsapp_alerts(payload: AlertPayload):
    success_count = 0

    for alert in payload.alerts:
        try:
            formatted_phone = "".join(filter(str.isdigit, alert.phone))
            if len(formatted_phone) == 10:
                formatted_phone = f"91{formatted_phone}"
            
            encoded_msg = quote(alert.message)
            url = f"whatsapp://send?phone={formatted_phone}&text={encoded_msg}"
            
            webbrowser.open(url)
            
            time.sleep(8)
            
            pyautogui.press('enter')
            
            time.sleep(2)
            success_count += 1
        except Exception:
            continue

    return {"success": True, "dispatched": success_count, "total": len(payload.alerts)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)