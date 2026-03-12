# Custom ML Models for Anemia Analysis

This folder contains custom ML models created by your development team for the anemia feature on the Anemia page.

## Folder Structure

```
custom_models/
├── ppg_analyzer/          # PPG signal analysis model files
├── weights/               # Pre-trained model weights
└── README.md             # This file
```

## Instructions for Your Friend's Model

1. **Place Python Model Files**: Paste your friend's ML model files in the `ppg_analyzer/` folder
   - Example: `model.py`, `analyzer.py`, `predictor.py`, etc.

2. **Place Model Weights**: If your model uses pre-trained weights, add them to the `weights/` folder
   - Example: `model.h5`, `model.pkl`, `model.pt`, `weights.json`, etc.

3. **Expected Model Inputs**: 
   - PPG signal array (array of values from phone camera/PPG sensor)
   - Sampling rate (typically 50-100 Hz)

4. **Expected Model Outputs**:
   - Hemoglobin level (g/dL)
   - Pulse rate (bpm)
   - Signal quality (0-100%)
   - Health status (Normal/Anemia/Elevated HR)

## Integration

Once your friend's model files are in place, we'll:
1. Update the backend route (`/Backend/routes/anemia.js`) to import and use the custom model
2. Replace the existing PPGAnalyzer with the custom model
3. Test the full pipeline with the Anemia page

## Notes

- Keep model files modular and well-documented
- Include any requirements.txt or dependencies list
- Add comments explaining input/output format
