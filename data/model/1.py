# -*- coding: utf-8 -*-
"""
Created on Thu Apr  3 01:05:36 2025

@author: naman
"""

import tensorflow as tf

MODEL_PATH = r"C:\Users\naman\OneDrive\Desktop\FakeSoundDetector\data\model\fake_sound_detector.h5"

model = tf.keras.models.load_model(MODEL_PATH)
print("Model input shape:", model.input_shape)
