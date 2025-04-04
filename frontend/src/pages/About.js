import React from "react";
import "./About.css";

function About() {
  return (
    <div className="about-container">
      <h2>About Fake Sound Detector</h2>
      <p>
        The <strong>Fake Sound Detector</strong> is an advanced AI-powered system designed to detect 
        and analyze deepfake audio. With the rise of AI-generated voices, it has become increasingly 
        important to verify the authenticity of audio content.
      </p>
      
      <h3>How It Works</h3>
      <p>
        The system utilizes <strong>deep learning algorithms</strong> to analyze uploaded audio files. It extracts 
        key features such as pitch, tone, and spectral properties to determine whether the audio is real or 
        synthetically generated.
      </p>

      <h3>Key Features</h3>
      <ul>
        <li>AI-powered deepfake detection.</li>
        <li>Real-time audio analysis and classification.</li>
        <li>Secure and efficient processing of audio files.</li>
        <li>User-friendly interface for easy interaction.</li>
        <li>Detailed accuracy metrics for performance evaluation.</li>
      </ul>

      <h3>Why It Matters?</h3>
      <p>
        Deepfake audio can be used for misinformation, fraud, and identity theft. Our system helps in combating 
        these threats by providing a reliable and easy-to-use solution for verifying audio authenticity.
      </p>

      <h3>Future Enhancements</h3>
      <p>
        We plan to integrate <strong>real-time voice detection</strong> in live calls and expand the dataset to improve 
        accuracy across multiple languages and accents.
      </p>
    </div>
  );
}

export default About;
