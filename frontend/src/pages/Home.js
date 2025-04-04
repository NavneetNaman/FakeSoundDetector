import React, { useState, useRef } from "react";
import "./Home.css";

function Home() {
  const [file, setFile] = useState(null);
  const [audioSrc, setAudioSrc] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const audioRef = useRef(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    setResult(null); // Reset previous result
    setError(""); // Reset error

    if (selectedFile) {
      const objectURL = URL.createObjectURL(selectedFile);
      setAudioSrc(objectURL);
    }
  };

  const handleSubmit = async () => {
    if (!file) {
      setError("⚠️ Please upload an audio file first.");
      return;
    }

    const formData = new FormData();
    formData.append("audio", file);

    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token"); // Assumes token is stored after login

      const response = await fetch("http://localhost:5000/api/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setResult({
          label: data.prediction.label || "Real / Fake",
          percentage: data.prediction.percentage || "Unknown",
        });
      } else {
        setError(data.message || "❌ Prediction failed.");
      }
    } catch (err) {
      console.error("Prediction error:", err);
      setError("⚠️ Server error. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="home-container">
      <div className="home-content">
        <h2>Upload an Audio File for Detection</h2>

        {error && <p className="error-message">{error}</p>}

        <div className="file-upload">
          <input type="file" accept="audio/*" onChange={handleFileChange} />
          {file && <p>Selected file: {file.name}</p>}

          <button
            className="upload-btn"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "Analyzing..." : "Submit"}
          </button>
        </div>

        {audioSrc && (
          <div className="audio-controls">
            <audio ref={audioRef} src={audioSrc} controls />
          </div>
        )}

        {result && (
          <div className="result">
            <h3>Prediction Result:</h3>
            <p>{result.label} ({result.percentage}%)</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Home;
