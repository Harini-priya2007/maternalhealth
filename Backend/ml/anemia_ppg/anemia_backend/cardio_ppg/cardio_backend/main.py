from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import numpy as np
import joblib
from pydantic import BaseModel
from typing import List

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# load trained cardiovascular model
print("Loading Cardiovascular model...")
model = joblib.load("cardiovascular_model.pkl")
print("Cardiovascular model loaded successfully")

class PPGData(BaseModel):
    signal: List[float]
    sampling_rate: int = 20

@app.get("/")
def home():
    return {"message": "Cardiovascular AI backend running"}

@app.post("/predict_external")
def predict_external(data: PPGData):
    try:
        signal = np.array(data.signal)
        if len(signal) < 10:
            return {"error": "Signal too short"}

        # Basic processing
        # Rescale signal to better match what model might expect (0-255 range usually)
        signal = (signal - np.min(signal)) / (np.max(signal) - np.min(signal)) * 255
        
        # Simple cardiovascular feature extraction
        # In a real scenario, we'd use robust peak detection.
        # For this hackathon, we derive features from the signal's stats.
        hr = 70 + (np.std(signal) % 20) # Simulated HR based on signal variance
        prv = np.std(signal) * 0.5
        
        # Create remaining features derived from basic stats
        Pulse_Amplitude = np.ptp(signal) * 0.1
        Systolic_Peak_Time = (np.mean(signal) / 255) * 0.4
        Diastolic_Time = 0.6 - Systolic_Peak_Time
        Pulse_Transit_Time = 0.2 + (np.var(signal) / 1000)
        Augmentation_Index = 0.3 + (np.mean(signal) / 1000)
        SpO2 = 97 + (np.std(signal) % 2)
        Perfusion_Index = 1.0 + (np.var(signal) / 500)
        Pulse_Width = 0.3 + (prv / 100)

        features = np.array([[
            hr,
            prv,
            Pulse_Amplitude,
            Systolic_Peak_Time,
            Diastolic_Time,
            Pulse_Transit_Time,
            Augmentation_Index,
            SpO2,
            Perfusion_Index,
            Pulse_Width
        ]])

        prediction = model.predict(features)[0]
        risk_level = int(prediction)

        return {
            "heart_rate": round(float(hr), 1),
            "systolic": round(115 + (risk_level * 10) + (np.random.random() * 5), 0),
            "diastolic": round(75 + (risk_level * 5) + (np.random.random() * 5), 0),
            "spO2": round(float(SpO2), 1),
            "cardio_risk": risk_level,
            "status": ["Low Risk", "Moderate Risk", "High Risk"][min(risk_level, 2)]
        }
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        return {"error": str(e)}

@app.get("/predict")
def predict():
    # Keep original mock predict for internal testing if needed
    return predict_external(PPGData(signal=[1.0]*100, sampling_rate=20))