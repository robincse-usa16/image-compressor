import React, { useState, useRef, useEffect } from "react";
import "./Resizer.css";

const Resizer = () => {
  // State variables
  const [originalImage, setOriginalImage] = useState(null);
  const [resizedImage, setResizedImage] = useState(null);
  const [fileName, setFileName] = useState("");
  const [fileSize, setFileSize] = useState(0);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadSpeed, setUploadSpeed] = useState("0 B/s");
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);
  const [originalWidth, setOriginalWidth] = useState(0);
  const [originalHeight, setOriginalHeight] = useState(0);
  const [maintainAspectRatio, setMaintainAspectRatio] = useState(true);
  const [resizeMethod, setResizeMethod] = useState("percentage");
  const [percentage, setPercentage] = useState(100);
  const [targetFileSize, setTargetFileSize] = useState("");
  const [exportFormat, setExportFormat] = useState("original");
  const [isDragging, setIsDragging] = useState(false);
  const [showCrop, setShowCrop] = useState(false);
  const [cropWidth, setCropWidth] = useState(0);
  const [cropHeight, setCropHeight] = useState(0);
  const [cropX, setCropX] = useState(0);
  const [cropY, setCropY] = useState(0);
  const [aspectRatio, setAspectRatio] = useState("freeform");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");

  // Refs
  const fileInputRef = useRef(null);
  const canvasRef = useRef(null);
  const dropAreaRef = useRef(null);
  const progressInterval = useRef(null);

  // Handle file upload with progress
  const handleFileUpload = (file) => {
    if (!file) return;

    // Reset and initialize loading state
    setUploadProgress(0);
    setUploadSpeed("0 B/s");
    setIsLoading(true);
    setLoadingMessage("Uploading image...");
    setFileName(file.name);
    setFileSize(Math.round(file.size / 1024)); // KB

    // Simulate upload progress (1% to 100%)
    let progress = 0;
    let lastTime = Date.now();

    progressInterval.current = setInterval(() => {
      const now = Date.now();
      const elapsed = now - lastTime;
      lastTime = now;

      // Calculate speed (simulated)
      const speed = Math.random() * 200 + 50; // KB/s
      setUploadSpeed(`${Math.floor(speed)} KB/s`);

      // Update progress
      progress = Math.min(progress + Math.random() * 10, 100);
      setUploadProgress(progress);

      // Clear interval when complete
      if (progress >= 100) {
        clearInterval(progressInterval.current);
      }
    }, 200);

    const reader = new FileReader();

    reader.onloadstart = () => {
      setLoadingMessage("Starting upload...");
    };

    reader.onprogress = (e) => {
      if (e.lengthComputable) {
        const percentLoaded = Math.round((e.loaded / e.total) * 100);
        setUploadProgress(percentLoaded);
      }
    };

    reader.onload = (event) => {
      clearInterval(progressInterval.current);
      setLoadingMessage("Processing image...");
      setUploadProgress(100);

      const img = new Image();
      img.onload = () => {
        setTimeout(() => {
          setOriginalWidth(img.width);
          setOriginalHeight(img.height);
          setWidth(img.width);
          setHeight(img.height);
          setCropWidth(img.width);
          setCropHeight(img.height);
          setOriginalImage(event.target.result);
          setIsLoading(false);
        }, 500);
      };
      img.src = event.target.result;
    };

    reader.onerror = () => {
      clearInterval(progressInterval.current);
      setIsLoading(false);
      alert("Error reading file");
    };

    reader.readAsDataURL(file);
  };

  // Handle drag and drop events
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length && files[0].type.match("image.*")) {
      handleFileUpload(files[0]);
    }
  };

  // Resize image with progress
  const resizeImage = () => {
    if (!originalImage) return;

    setIsLoading(true);
    setLoadingMessage("Resizing image...");
    setUploadProgress(0);

    // Simulate resize progress
    let progress = 0;
    progressInterval.current = setInterval(() => {
      progress = Math.min(progress + Math.random() * 20, 100);
      setUploadProgress(progress);

      if (progress >= 100) {
        clearInterval(progressInterval.current);
      }
    }, 200);

    const img = new Image();
    img.onload = () => {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");

      canvas.width = width;
      canvas.height = height;

      ctx.drawImage(img, 0, 0, width, height);

      let format = "image/jpeg";
      if (exportFormat === "png") format = "image/png";
      else if (exportFormat === "webp") format = "image/webp";

      setTimeout(() => {
        const resizedDataUrl = canvas.toDataURL(format, qualityFromFileSize());
        setResizedImage(resizedDataUrl);
        setIsLoading(false);
      }, 500);
    };

    img.onerror = () => {
      clearInterval(progressInterval.current);
      setIsLoading(false);
      alert("Error processing image");
    };

    img.src = originalImage;
  };

  // Calculate quality based on target file size
  const qualityFromFileSize = () => {
    if (!targetFileSize) return 0.9;
    const targetKB = parseInt(targetFileSize);
    const estimatedQuality = Math.min(0.9, targetKB / (fileSize * 0.8));
    return Math.max(0.1, estimatedQuality);
  };

  // Handle dimension changes
  const handleWidthChange = (e) => {
    const newWidth = parseInt(e.target.value);
    setWidth(newWidth);

    if (maintainAspectRatio && originalWidth) {
      const ratio = originalWidth / originalHeight;
      setHeight(Math.round(newWidth / ratio));
    }
  };

  const handleHeightChange = (e) => {
    const newHeight = parseInt(e.target.value);
    setHeight(newHeight);

    if (maintainAspectRatio && originalHeight) {
      const ratio = originalWidth / originalHeight;
      setWidth(Math.round(newHeight * ratio));
    }
  };

  // Handle percentage change
  const handlePercentageChange = (e) => {
    const newPercentage = parseInt(e.target.value);
    setPercentage(newPercentage);

    if (originalWidth && originalHeight) {
      setWidth(Math.round((originalWidth * newPercentage) / 100));
      setHeight(Math.round((originalHeight * newPercentage) / 100));
    }
  };

  // Handle crop
  const applyCrop = () => {
    if (!originalImage) return;

    setIsLoading(true);
    setLoadingMessage("Applying crop...");
    setUploadProgress(0);

    let progress = 0;
    progressInterval.current = setInterval(() => {
      progress = Math.min(progress + Math.random() * 20, 100);
      setUploadProgress(progress);

      if (progress >= 100) {
        clearInterval(progressInterval.current);
      }
    }, 200);

    const img = new Image();
    img.onload = () => {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");

      canvas.width = cropWidth;
      canvas.height = cropHeight;

      ctx.drawImage(
        img,
        cropX,
        cropY,
        cropWidth,
        cropHeight,
        0,
        0,
        cropWidth,
        cropHeight
      );

      setTimeout(() => {
        const croppedDataUrl = canvas.toDataURL("image/jpeg", 0.9);
        setOriginalImage(croppedDataUrl);
        setOriginalWidth(cropWidth);
        setOriginalHeight(cropHeight);
        setWidth(cropWidth);
        setHeight(cropHeight);
        setShowCrop(false);
        setIsLoading(false);
      }, 500);
    };

    img.src = originalImage;
  };

  // Download resized image
  const handleDownload = () => {
    if (!resizedImage) return;

    let extension = "jpg";
    if (exportFormat === "png") extension = "png";
    else if (exportFormat === "webp") extension = "webp";

    const link = document.createElement("a");
    link.href = resizedImage;
    link.download = `resized-${fileName.split(".")[0]}.${extension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Trigger file input
  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  // Reset crop
  const resetCrop = () => {
    setCropWidth(originalWidth);
    setCropHeight(originalHeight);
    setCropX(0);
    setCropY(0);
  };

  // Clean up intervals on unmount
  useEffect(() => {
    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    };
  }, []);

  return (
    <div className={`image-resizer-container ${isLoading ? "loading" : ""}`}>
      {/* Progress Loader Overlay */}
      {isLoading && (
        <div className="progress-loader-overlay">
          <div className="progress-loader-container">
            <div className="progress-loader-text">
              {loadingMessage} {uploadProgress.toFixed(0)}%
            </div>
            <div className="progress-loader-bar">
              <div
                className="progress-loader-fill"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <div className="progress-loader-details">
              <span>{fileName}</span>
              {uploadSpeed && <span>{uploadSpeed}</span>}
            </div>
          </div>
        </div>
      )}

      <header>
        <h1>🖼️ Image Resizer</h1>
        <p className="subtitle">Easily resize images online for free. ✨</p>
      </header>

      <div
        className={`upload-area ${isDragging ? "dragging" : ""}`}
        ref={dropAreaRef}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <div className="upload-content">
          <h3>Select Images</h3>
          <p>or, drag and drop images here</p>
          <button
            className="upload-button"
            onClick={triggerFileInput}
            disabled={isLoading}
          >
            Select Files
          </button>
          <p className="file-size-info">
            Max file size: 10 MB. Sign up for more.
          </p>
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => handleFileUpload(e.target.files[0])}
            accept="image/*"
            style={{ display: "none" }}
            disabled={isLoading}
          />
        </div>
      </div>

      {originalImage && (
        <div className="file-info">
          <h4>Your Image</h4>
          <div className="file-details">
            <span>{fileName}</span>
            <span>{fileSize.toFixed(2)} KB</span>
            <span>
              Dimensions: {originalWidth} × {originalHeight}
            </span>
          </div>
        </div>
      )}

      {originalImage && (
        <div className="resize-settings">
          <h3>Resize Settings</h3>

          <div className="resize-methods">
            <button
              className={resizeMethod === "percentage" ? "active" : ""}
              onClick={() => setResizeMethod("percentage")}
              disabled={isLoading}
            >
              As Percentage
            </button>
            <button
              className={resizeMethod === "dimensions" ? "active" : ""}
              onClick={() => setResizeMethod("dimensions")}
              disabled={isLoading}
            >
              By Dimensions
            </button>
            <button
              className={resizeMethod === "social" ? "active" : ""}
              onClick={() => setResizeMethod("social")}
              disabled={isLoading}
            >
              Social Media
            </button>
          </div>

          {resizeMethod === "percentage" && (
            <div className="percentage-control">
              <label>
                Percentage:
                <input
                  type="range"
                  min="1"
                  max="200"
                  value={percentage}
                  onChange={handlePercentageChange}
                  disabled={isLoading}
                />
                <span>{percentage}%</span>
              </label>
              <div className="dimension-preview">
                Original: {originalWidth} × {originalHeight} → Resized: {width}{" "}
                × {height}
              </div>
            </div>
          )}

          {resizeMethod === "dimensions" && (
            <div className="dimension-controls">
              <div className="dimension-input">
                <label>
                  Width:
                  <input
                    type="number"
                    value={width}
                    onChange={handleWidthChange}
                    min="1"
                    disabled={isLoading}
                  />
                  <span>px</span>
                </label>
              </div>
              <div className="dimension-input">
                <label>
                  Height:
                  <input
                    type="number"
                    value={height}
                    onChange={handleHeightChange}
                    min="1"
                    disabled={isLoading}
                  />
                  <span>px</span>
                </label>
              </div>
              <div className="aspect-ratio-control">
                <label>
                  <input
                    type="checkbox"
                    checked={maintainAspectRatio}
                    onChange={(e) => setMaintainAspectRatio(e.target.checked)}
                    disabled={isLoading}
                  />
                  Lock Aspect Ratio
                </label>
              </div>
            </div>
          )}

          {resizeMethod === "social" && (
            <div className="social-presets">
              <button
                onClick={() => {
                  setWidth(1080);
                  setHeight(1080);
                }}
                disabled={isLoading}
              >
                Instagram Square (1080×1080)
              </button>
              <button
                onClick={() => {
                  setWidth(1080);
                  setHeight(1350);
                }}
                disabled={isLoading}
              >
                Instagram Portrait (1080×1350)
              </button>
              <button
                onClick={() => {
                  setWidth(1080);
                  setHeight(566);
                }}
                disabled={isLoading}
              >
                Facebook Post (1080×566)
              </button>
              <button
                onClick={() => {
                  setWidth(1200);
                  setHeight(630);
                }}
                disabled={isLoading}
              >
                Twitter Post (1200×630)
              </button>
            </div>
          )}

          <div className="export-settings">
            <h4>Export Settings</h4>

            <div className="target-size">
              <label>
                Target File Size (optional):
                <input
                  type="number"
                  value={targetFileSize}
                  onChange={(e) => setTargetFileSize(e.target.value)}
                  placeholder="KB"
                  disabled={isLoading}
                />
              </label>
              <p className="hint">
                Set a max output file size. Only works for JPG files
              </p>
            </div>

            <div className="format-selection">
              <label>
                Save Image As:
                <select
                  value={exportFormat}
                  onChange={(e) => setExportFormat(e.target.value)}
                  disabled={isLoading}
                >
                  <option value="original">Original Format</option>
                  <option value="jpg">JPG</option>
                  <option value="png">PNG</option>
                  <option value="webp">WebP</option>
                </select>
              </label>
            </div>
          </div>

          <div className="action-buttons">
            <button
              className="crop-button"
              onClick={() => setShowCrop(true)}
              disabled={isLoading}
            >
              Crop Image
            </button>
            <button
              className="resize-button"
              onClick={resizeImage}
              disabled={isLoading}
            >
              Resize Image
            </button>
          </div>
        </div>
      )}

      {showCrop && (
        <div className="crop-modal">
          <div className="crop-content">
            <h3>Crop Image</h3>

            <div className="crop-presets">
              <h4>Crop Rectangle</h4>
              <div className="crop-dimensions">
                <label>
                  Width:
                  <input
                    type="number"
                    value={cropWidth}
                    onChange={(e) => setCropWidth(parseInt(e.target.value))}
                    min="1"
                    max={originalWidth}
                    disabled={isLoading}
                  />
                </label>
                <label>
                  Height:
                  <input
                    type="number"
                    value={cropHeight}
                    onChange={(e) => setCropHeight(parseInt(e.target.value))}
                    min="1"
                    max={originalHeight}
                    disabled={isLoading}
                  />
                </label>
              </div>

              <div className="aspect-ratio-control">
                <h4>Aspect Ratio</h4>
                <select
                  value={aspectRatio}
                  onChange={(e) => setAspectRatio(e.target.value)}
                  disabled={isLoading}
                >
                  <option value="freeform">FreeForm</option>
                  <option value="1:1">1:1 (Square)</option>
                  <option value="4:3">4:3</option>
                  <option value="16:9">16:9 (Widescreen)</option>
                  <option value="9:16">9:16 (Portrait)</option>
                </select>
              </div>
            </div>

            <div className="crop-position">
              <h4>Crop Position</h4>
              <div className="position-controls">
                <label>
                  Position (X):
                  <input
                    type="number"
                    value={cropX}
                    onChange={(e) => setCropX(parseInt(e.target.value))}
                    min="0"
                    max={originalWidth - cropWidth}
                    disabled={isLoading}
                  />
                </label>
                <label>
                  Position (Y):
                  <input
                    type="number"
                    value={cropY}
                    onChange={(e) => setCropY(parseInt(e.target.value))}
                    min="0"
                    max={originalHeight - cropHeight}
                    disabled={isLoading}
                  />
                </label>
              </div>
            </div>

            <div className="crop-actions">
              <button
                className="cancel-button"
                onClick={() => setShowCrop(false)}
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                className="reset-button"
                onClick={resetCrop}
                disabled={isLoading}
              >
                Reset
              </button>
              <button
                className="apply-button"
                onClick={applyCrop}
                disabled={isLoading}
              >
                Apply Crop
              </button>
            </div>
          </div>
        </div>
      )}

      {resizedImage && (
        <div className="result-preview">
          <h3>Resized Image Preview</h3>
          <div className="image-comparison">
            <div className="original">
              <h4>
                Original: {originalWidth} × {originalHeight}
              </h4>
              <img src={originalImage} alt="Original" />
            </div>
            <div className="resized">
              <h4>
                Resized: {width} × {height}
              </h4>
              <img src={resizedImage} alt="Resized" />
            </div>
          </div>
          <button
            className="download-button"
            onClick={handleDownload}
            disabled={isLoading}
          >
            Download Resized Image
          </button>
        </div>
      )}

      <canvas ref={canvasRef} style={{ display: "none" }} />
    </div>
  );
};

export default Resizer;
