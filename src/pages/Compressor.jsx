import React, { useState, useRef } from "react";
import "./Compressor.css";

const Compressor = () => {
  const [files, setFiles] = useState([]);
  const [compressionLevel, setCompressionLevel] = useState(0.7);
  const [outputFormat, setOutputFormat] = useState("auto");
  const [results, setResults] = useState([]);
  const [status, setStatus] = useState({ message: "", type: "" });
  const fileInputRef = useRef(null);
  const resultsRef = useRef(null);

  const handleCompressionChange = (e) => {
    setCompressionLevel(parseFloat(e.target.value));
  };

  const handleFormatChange = (e) => {
    setOutputFormat(e.target.value);
    showStatus(
      `Selected format: ${
        e.target.options[e.target.selectedIndex].text.split(" ")[1]
      }`,
      "success"
    );
  };

  const handleFileChange = (e) => {
    if (e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  const handleFiles = (selectedFiles) => {
    const validFiles = Array.from(selectedFiles).filter((file) =>
      file.type.startsWith("image/")
    );
    setFiles(validFiles);

    if (validFiles.length > 0) {
      showStatus(
        `✅ Ready to compress ${validFiles.length} image(s)`,
        "success"
      );
    } else {
      showStatus("❌ Please select valid image files only", "error");
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const showStatus = (message, type) => {
    setStatus({ message, type });
    if (type !== "processing") {
      setTimeout(() => {
        if (files.length > 0 && type !== "error") {
          setStatus({
            message: `✅ Ready to compress ${files.length} image(s)`,
            type: "success",
          });
        } else if (files.length === 0) {
          setStatus({ message: "", type: "" });
        }
      }, 3000);
    }
  };

  const compressImages = async () => {
    if (files.length === 0) return;

    showStatus("⏳ Compressing images...", "processing");
    setResults([]);

    try {
      const compressionPromises = files.map((file) => processFile(file));
      const results = await Promise.all(compressionPromises);

      setResults(results);
      showStatus(
        `🎉 Successfully compressed ${files.length} image(s)`,
        "success"
      );

      if (resultsRef.current) {
        resultsRef.current.scrollIntoView({ behavior: "smooth" });
      }
    } catch (error) {
      console.error("Compression error:", error);
      showStatus(`❌ Error compressing images: ${error.message}`, "error");
    }
  };

  const processFile = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          try {
            const format =
              outputFormat === "auto"
                ? file.type.split("/")[1] === "jpeg"
                  ? "jpeg"
                  : file.type.split("/")[1]
                : outputFormat;

            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");

            // Calculate dimensions
            const maxDimension = 2000;
            let width = img.width;
            let height = img.height;

            if (width > height && width > maxDimension) {
              height *= maxDimension / width;
              width = maxDimension;
            } else if (height > maxDimension) {
              width *= maxDimension / height;
              height = maxDimension;
            }

            canvas.width = width;
            canvas.height = height;

            // For JPEG output from PNG, add white background
            if (
              format === "jpeg" &&
              (file.type === "image/png" || file.type === "image/gif")
            ) {
              ctx.fillStyle = "#ffffff";
              ctx.fillRect(0, 0, canvas.width, canvas.height);
            }

            ctx.drawImage(img, 0, 0, width, height);

            // Special handling for PNG output
            if (format === "png") {
              // Apply quality adjustments
              if (compressionLevel < 0.5) {
                const tempCanvas = document.createElement("canvas");
                const tempCtx = tempCanvas.getContext("2d");
                const scale = 0.5 + compressionLevel * 1; // Scale between 0.5 and 1.5
                tempCanvas.width = canvas.width * scale;
                tempCanvas.height = canvas.height * scale;
                tempCtx.drawImage(
                  canvas,
                  0,
                  0,
                  tempCanvas.width,
                  tempCanvas.height
                );
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(tempCanvas, 0, 0, canvas.width, canvas.height);
              }

              canvas.toBlob((blob) => {
                if (!blob) {
                  reject(new Error("PNG compression failed"));
                  return;
                }
                resolve(createResult(file, blob, format));
              }, "image/png");
            } else {
              // For JPEG/WebP formats
              canvas.toBlob(
                (blob) => {
                  if (!blob) {
                    reject(new Error("Compression failed"));
                    return;
                  }
                  resolve(createResult(file, blob, format));
                },
                `image/${format}`,
                format === "jpeg" ? compressionLevel : 0.9
              );
            }
          } catch (error) {
            reject(error);
          }
        };

        img.onerror = () => {
          reject(new Error("Failed to load image"));
        };

        img.src = e.target.result;
      };

      reader.onerror = () => {
        reject(new Error("Failed to read file"));
      };

      reader.readAsDataURL(file);
    });
  };

  const createResult = (file, blob, format) => {
    return {
      originalFile: file,
      compressedBlob: blob,
      originalSize: file.size,
      compressedSize: blob.size,
      fileName: file.name,
      format: format,
    };
  };

  const formatBytes = (bytes) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const getFileIcon = (fileName) => {
    const ext = fileName.split(".").pop().toLowerCase();
    switch (ext) {
      case "jpg":
      case "jpeg":
        return "🖼️";
      case "png":
        return "📸";
      case "gif":
        return "🎞️";
      case "webp":
        return "🌐";
      default:
        return "📄";
    }
  };

  const truncateFileName = (name, maxLength) => {
    return name.length <= maxLength
      ? name
      : `${name.substring(0, maxLength)}...`;
  };

  return (
    <div className="container">
      <header>
        <h1>🖼️ Image Compressor</h1>
        <p className="subtitle">
          Reduce your image file sizes without losing quality! ✨
        </p>
      </header>

      <div
        className={`upload-area ${
          status.type === "processing" ? "active" : ""
        }`}
        onClick={() => fileInputRef.current.click()}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <div className="upload-icon">📤</div>
        <p className="upload-text">
          Drag & drop your images here or click to browse
        </p>
        <button>📁 Select Files</button>
        <input
          type="file"
          ref={fileInputRef}
          className="file-input"
          accept="image/*"
          multiple
          onChange={handleFileChange}
        />
      </div>

      <div className="controls">
        <div className="control-group">
          <label htmlFor="compressionLevel">🔧 Compression Level</label>
          <div className="slider-container">
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={compressionLevel}
              className="slider"
              id="compressionLevel"
              onChange={handleCompressionChange}
            />
            <span className="slider-value">{compressionLevel}</span>
          </div>
          <small>Higher values mean more compression (but lower quality)</small>
        </div>

        <div className="control-group">
          <label htmlFor="outputFormat">🔄 Output Format</label>
          <div className="format-select-container">
            <select
              id="outputFormat"
              value={outputFormat}
              onChange={handleFormatChange}
            >
              <option value="auto">🔄 Auto (Keep original format)</option>
              <option value="jpeg">🖼️ JPEG (Best for photos)</option>
              <option value="png">📸 PNG (Lossless quality)</option>
              <option value="webp">🌐 WebP (Modern format)</option>
            </select>
          </div>
        </div>
      </div>

      <button
        id="compressBtn"
        disabled={files.length === 0 || status.type === "processing"}
        onClick={compressImages}
      >
        {status.type === "processing" ? (
          <>
            <span className="loading"></span> Compressing...
          </>
        ) : (
          "⚡ Compress Images"
        )}
      </button>

      {status.message && (
        <div className={`status ${status.type}`}>{status.message}</div>
      )}

      {results.length > 0 && (
        <div className="results" ref={resultsRef}>
          <h2 className="results-title">📊 Compression Results</h2>
          <div style={{ overflowX: "auto" }}>
            <table>
              <thead>
                <tr>
                  <th>File</th>
                  <th>Original</th>
                  <th>Compressed</th>
                  <th>Reduction</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {results.map((result, index) => {
                  const reduction = (
                    ((result.originalSize - result.compressedSize) /
                      result.originalSize) *
                    100
                  ).toFixed(1);
                  const isPositive =
                    result.compressedSize < result.originalSize;
                  const url = URL.createObjectURL(result.compressedBlob);

                  return (
                    <tr key={index}>
                      <td>
                        <div className="file-info">
                          <span className="file-icon">
                            {getFileIcon(result.fileName)}
                          </span>
                          <span className="file-name" title={result.fileName}>
                            {truncateFileName(result.fileName, 20)}
                          </span>
                        </div>
                      </td>
                      <td className="file-size">
                        {formatBytes(result.originalSize)}
                      </td>
                      <td className="file-size">
                        {formatBytes(result.compressedSize)}
                      </td>
                      <td
                        className={`compression-rate ${
                          isPositive ? "positive" : "negative"
                        }`}
                      >
                        {isPositive ? "↓" : "↑"} {Math.abs(reduction)}%{" "}
                        {isPositive ? "😊" : "😢"}
                      </td>
                      <td>
                        <a
                          href={url}
                          download={`compressed_${
                            result.fileName.split(".")[0]
                          }.${result.format}`}
                          className="download-btn"
                        >
                          💾 Download
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <h3 className="results-title" style={{ marginTop: "30px" }}>
            👀 Preview
          </h3>
          <div className="preview-container">
            {results.map((result, index) => {
              const url = URL.createObjectURL(result.compressedBlob);
              const originalUrl = URL.createObjectURL(result.originalFile);

              return (
                <div className="preview-box" key={index}>
                  <div className="preview-title" title={result.fileName}>
                    🔍 {truncateFileName(result.fileName, 20)}
                  </div>
                  <div
                    style={{ display: "flex", gap: "15px", flexWrap: "wrap" }}
                  >
                    <div style={{ flex: 1, minWidth: "120px" }}>
                      <p
                        style={{
                          fontSize: "0.9rem",
                          color: "#666",
                          marginBottom: "5px",
                        }}
                      >
                        Original
                      </p>
                      <img
                        src={originalUrl}
                        className="preview-img"
                        alt="Original"
                        loading="lazy"
                      />
                      <p
                        style={{
                          fontSize: "0.8rem",
                          textAlign: "center",
                          marginTop: "5px",
                        }}
                      >
                        {formatBytes(result.originalSize)}
                      </p>
                    </div>
                    <div style={{ flex: 1, minWidth: "120px" }}>
                      <p
                        style={{
                          fontSize: "0.9rem",
                          color: "#666",
                          marginBottom: "5px",
                        }}
                      >
                        Compressed ({result.format.toUpperCase()})
                      </p>
                      <img
                        src={url}
                        className="preview-img"
                        alt="Compressed"
                        loading="lazy"
                      />
                      <p
                        style={{
                          fontSize: "0.8rem",
                          textAlign: "center",
                          marginTop: "5px",
                        }}
                      >
                        {formatBytes(result.compressedSize)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default Compressor;
