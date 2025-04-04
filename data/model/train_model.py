import os
import librosa
import numpy as np
import tensorflow as tf
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
import joblib  # For saving and loading the scaler

# Define the paths for fake and real datasets
FAKE_DATA_PATH = "C:/Users/naman/OneDrive/Desktop/FakeSoundDetector/data/training/fake"
REAL_DATA_PATH = "C:/Users/naman/OneDrive/Desktop/FakeSoundDetector/data/training/real"

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

# Load data and labels
def load_data():
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

# Function to train the model
def train_model():
    # Load data
    X, y = load_data()

    # Scale the features
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)  # Normalize the features using StandardScaler

    # Split the data into training and validation sets
    X_train, X_val, y_train, y_val = train_test_split(X_scaled, y, test_size=0.2, random_state=42)

    # Build the neural network model
    model = tf.keras.Sequential([
        tf.keras.layers.Dense(256, activation='relu', input_dim=X_train.shape[1]),
        tf.keras.layers.Dropout(0.5),
        tf.keras.layers.Dense(128, activation='relu'),
        tf.keras.layers.Dropout(0.5),
        tf.keras.layers.Dense(64, activation='relu'),
        tf.keras.layers.Dense(1, activation='sigmoid')  # Sigmoid for binary classification
    ])

    # Compile the model
    model.compile(optimizer=tf.keras.optimizers.Adam(), loss='binary_crossentropy', metrics=['accuracy'])

    # Train the model
    model.fit(X_train, y_train, epochs=10, batch_size=32, validation_data=(X_val, y_val))

    # Save the trained model and scaler
    model.save('fake_sound_detector_model.h5')
    joblib.dump(scaler, 'fake_sound_detector_scaler.pkl')  # Save the scaler using joblib

    print("Model and scaler saved successfully!")

# Run the training
if __name__ == "__main__":
    train_model()
