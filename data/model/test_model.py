import os
import librosa
import numpy as np
import tensorflow as tf
from sklearn.metrics import classification_report
import joblib  # For loading the saved scaler

# Define the paths for test datasets
FAKE_DATA_PATH = "C:/Users/naman/OneDrive/Desktop/FakeSoundDetector/data/testing/fake"
REAL_DATA_PATH = "C:/Users/naman/OneDrive/Desktop/FakeSoundDetector/data/testing/real"

# Load the trained model and scaler
model = tf.keras.models.load_model('fake_sound_detector_model.h5')
scaler = joblib.load('fake_sound_detector_scaler.pkl')  # Load the saved scaler

# Function to extract Mel-spectrogram features from audio files
def extract_features(file_path):
    try:
        y, sr = librosa.load(file_path, sr=None)  # Load the audio file
        mel_spectrogram = librosa.feature.melspectrogram(y=y, sr=sr, n_mels=128, fmax=8000)
        mel_spectrogram_db = librosa.power_to_db(mel_spectrogram, ref=np.max)
        return mel_spectrogram_db.flatten()  # Flatten the 2D spectrogram into 1D
    except Exception as e:
        print(f"Error processing {file_path}: {e}")
        return None

# Load the test data and labels
def load_test_data():
    features = []
    labels = []

    # Process fake audio files
    for file_name in os.listdir(FAKE_DATA_PATH):
        file_path = os.path.join(FAKE_DATA_PATH, file_name)
        feature = extract_features(file_path)
        if feature is not None:
            features.append(feature)
            labels.append(1)  # Label for fake audio

    # Process real audio files
    for file_name in os.listdir(REAL_DATA_PATH):
        file_path = os.path.join(REAL_DATA_PATH, file_name)
        feature = extract_features(file_path)
        if feature is not None:
            features.append(feature)
            labels.append(0)  # Label for real audio

    # Convert lists to numpy arrays
    X = np.array(features)
    y = np.array(labels)

    return X, y

# Function to evaluate the model
def test_model():
    # Load the test data
    X_test, y_test = load_test_data()

    # Scale the features using the same scaler as during training
    X_scaled = scaler.transform(X_test)

    # Predict the labels using the trained model
    y_pred = (model.predict(X_scaled) > 0.5).astype(int)  # Threshold the output to get binary predictions

    # Print the classification report
    print("Classification Report:")
    print(classification_report(y_test, y_pred))

# Run the evaluation
if __name__ == "__main__":
    test_model()
