import sys
import numpy as np
import librosa
import tensorflow as tf
import joblib
import json
import os

# ✅ Paths
MODEL_PATH = "C:/Users/naman/OneDrive/Desktop/FakeSoundDetector/backend/fake_sound_detector_model.h5"
SCALER_PATH = "C:/Users/naman/OneDrive/Desktop/FakeSoundDetector/backend/fake_sound_detector_scaler.pkl"

# ✅ Check file existence
if not os.path.exists(MODEL_PATH):
    print(json.dumps({"error": f"Model file not found: {MODEL_PATH}"}), flush=True)
    sys.exit(1)

if not os.path.exists(SCALER_PATH):
    print(json.dumps({"error": f"Scaler file not found: {SCALER_PATH}"}), flush=True)
    sys.exit(1)

# ✅ Load model and scaler
model = tf.keras.models.load_model(MODEL_PATH)
scaler = joblib.load(SCALER_PATH)

# ✅ Extract features
def extract_features(file_path):
    try:
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"Audio file not found: {file_path}")

        y, sr = librosa.load(file_path, sr=None, res_type='kaiser_fast')

        if y is None or len(y) == 0:
            raise ValueError("Empty audio file or invalid format")

        mel_spectrogram = librosa.feature.melspectrogram(y=y, sr=sr, n_mels=128, fmax=8000)
        mel_spectrogram_db = librosa.power_to_db(mel_spectrogram, ref=np.max)

        return mel_spectrogram_db.flatten()

    except Exception as e:
        print(json.dumps({"error": f"Error extracting features: {str(e)}"}), flush=True)
        return None

# ✅ Prediction logic
def predict_audio(file_path):
    features = extract_features(file_path)
    if features is None:
        return

    try:
        features = np.array(features).reshape(1, -1)  # Ensure 2D array
        features_scaled = scaler.transform(features)
        prediction = model.predict(features_scaled)[0][0]

        label = "Fake" if prediction > 0.5 else "Real"
        confidence = round(prediction * 100 if label == "Fake" else (1 - prediction) * 100, 2)

        result = {"label": label, "percentage": confidence}
        print(json.dumps(result), flush=True)

    except Exception as e:
        print(json.dumps({"error": f"Prediction error: {str(e)}"}), flush=True)

# ✅ Entry point
if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Usage: python predict_audio.py <audio_file.wav>"}), flush=True)
        sys.exit(1)

    file_path = sys.argv[1]
    predict_audio(file_path)
