import cv2
import numpy as np
from scipy.signal import butter, filtfilt

def bandpass_filter(signal, fs=30):
    if len(signal) <= 21:
        return signal  # Too short to filter
    
    low = 0.5
    high = 2.5 # narrowed a bit for heart rate (30-150 bpm)

    b, a = butter(2, [low/(fs/2), high/(fs/2)], btype='band') # Order 2 for less artifact

    return filtfilt(b, a, signal)


def extract_ppg():

    cap = cv2.VideoCapture(0)

    signal = []
    frame_count = 0

    while frame_count < 100:   # capture ~3 seconds

        ret, frame = cap.read()

        if not ret:
            continue

        red_channel = frame[:, :, 2]

        avg_intensity = np.mean(red_channel)

        signal.append(avg_intensity)

        frame_count += 1

    cap.release()

    signal = np.array(signal)

    filtered = bandpass_filter(signal)

    return filtered


def extract_features(ppg):

    if len(ppg) == 0:
        raise Exception("No PPG signal captured")

    features = [
        np.mean(ppg),       # feature 1
        np.std(ppg),        # feature 2
        np.max(ppg),        # feature 3
        np.min(ppg),        # feature 4
        np.median(ppg),     # feature 5
        np.var(ppg)         # feature 6
    ]

    return np.array(features).reshape(1, -1)

def process_ppg_signal(signal_array, fs=30):
    signal = np.array(signal_array)
    if len(signal) < 10:
        raise Exception("Signal too short")
    filtered = bandpass_filter(signal, fs=fs)
    return filtered