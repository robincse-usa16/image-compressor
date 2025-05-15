import React, { useState, useRef } from "react";
import "./Converter.css";

const Converter = () => {
  const [files, setFiles] = useState([]);
  const [outputFormat, setOutputFormat] = useState("jpeg");
  const [results, setResults] = useState([]);
  const fileInputRef = useRef(null);

  const handleFormatChange = (e) => {
    setOutputFormat(e.target.value);
  };

  const handleFileChange = (e) => {
    if (e.target.files.length > 0) {
      setFiles(Array.from(e.target.files));
    }
  };

  const convertImages = async () => {
    const conversionPromises = files.map((file) => processFile(file));
    const results = await Promise.all(conversionPromises);
    setResults(results);
  };

  const processFile = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext("2d");

          // Handle transparent to JPEG conversion
          if (outputFormat === "jpeg") {
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
          }

          ctx.drawImage(img, 0, 0);

          canvas.toBlob(
            (blob) => {
              resolve({
                originalFile: file,
                convertedBlob: blob,
                fileName: file.name,
                format: outputFormat,
              });
            },
            `image/${outputFormat}`,
            0.9
          );
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  const formatBytes = (bytes) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  return (
    <div className="converter-container">
      <h1>🔄 Image Converter</h1>
      <p className="subtitle">
        Convert between JPG, PNG, WebP, and GIF formats
      </p>

      <div className="upload-area" onClick={() => fileInputRef.current.click()}>
        <div className="upload-icon">📤</div>
        <p className="upload-text">Drag & drop images or click to browse</p>
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          multiple
          onChange={handleFileChange}
          style={{ display: "none" }}
        />
      </div>

      <div className="controls">
        <div className="control-group">
          <label>Output Format</label>
          <select value={outputFormat} onChange={handleFormatChange}>
            <option value="jpeg">JPEG</option>
            <option value="png">PNG</option>
            <option value="webp">WebP</option>
            <option value="gif">GIF</option>
          </select>
        </div>
      </div>

      <button
        onClick={convertImages}
        disabled={files.length === 0}
        className="convert-btn"
      >
        🚀 Convert Images
      </button>

      {results.length > 0 && (
        <div className="results">
          <h2>Conversion Results</h2>
          <div className="download-grid">
            {results.map((result, index) => (
              <div key={index} className="converted-file">
                <p>{result.fileName}</p>
                <p>
                  → {result.format.toUpperCase()} (
                  {formatBytes(result.convertedBlob.size)})
                </p>
                <a
                  href={URL.createObjectURL(result.convertedBlob)}
                  download={`converted_${result.fileName.split(".")[0]}.${
                    result.format
                  }`}
                  className="download-btn"
                >
                  💾 Download
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Converter;
