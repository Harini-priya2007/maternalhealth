# Custom ML Models for Cardiovascular PPG Analysis

This folder contains custom ML models for cardiovascular health monitoring using PPG (Photoplethysmography) scanning.

## Folder Structure

```
cardiovascular_ppg/
├── Model files here           # PPG signal analysis for cardiovascular
├── weights/                   # Pre-trained model weights
└── README.md                 # This file
```

## Instructions for Your Friend's Model

1. **Place Model Files**: Paste your friend's ML model in this folder
   - Python files (.py)
   - JavaScript files (.js)
   - Configuration files

2. **Place Model Weights**: Add pre-trained weights to `weights/` folder
   - `.h5`, `.pkl`, `.pt` files
   - JSON weight files

3. **Expected Model Inputs**: 
   - PPG signal array (values from heart rate sensor)
   - Sampling rate (50-100 Hz)
   - Duration (time window for analysis)

4. **Expected Model Outputs**:
   - Heart Rate Variability (HRV) - ms
   - Blood Pressure estimation (Systolic/Diastolic) - mmHg
   - Pulse Rate - bpm
   - Oxygen Saturation (SpO2) - %
   - Signal Quality - 0-100%
   - Cardiovascular Risk - Low/Moderate/High

## Integration

The model will be integrated with:
- Frontend: `cardio.html` - PPG Scan button and results display
- Backend: `/api/cardio/analyze-ppg` - Analysis endpoint
- Database: Cardiovascular readings with timestamps
- History: Track all scans with timestamps per user

## Output Format Expected

```json
{
  "pulseRate": 72,
  "hrv": 45.5,
  "systolic": 118,
  "diastolic": 76,
  "spO2": 98.5,
  "signalQuality": 92,
  "status": "Normal",
  "timestamp": "2026-03-12T14:33:20.739Z"
}
```

## Notes

- Model should handle noisy PPG signals gracefully
- Include error handling for poor signal quality
- Add timestamps to all measurements
- Support batch processing for history trends
