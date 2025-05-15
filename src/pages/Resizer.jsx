import React, { useState, useRef, useEffect, useCallback } from "react";
import "./Resizer.css";

const Resizer = () => {
  // State management
  const [image, setImage] = useState(null);
  const [originalSize, setOriginalSize] = useState({ width: 0, height: 0 });
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [crop, setCrop] = useState({ x: 0, y: 0, width: 100, height: 100 });
  const [keepAspect, setKeepAspect] = useState(true);
  const [aspectRatio, setAspectRatio] = useState("free");
  const [unit, setUnit] = useState("px");
  const [targetSize, setTargetSize] = useState(500);
  const [targetUnit, setTargetUnit] = useState("KB");
  const [outputFormat, setOutputFormat] = useState("jpeg");
  const [quality, setQuality] = useState(90);
  const [result, setResult] = useState(null);
  const [isResizing, setIsResizing] = useState(false);
  const [showDownloadOptions, setShowDownloadOptions] = useState(false);

  const fileInputRef = useRef(null);
  const canvasRef = useRef(null);
  const imageRef = useRef(null);
  const cropRef = useRef(null);

  // Finalize the resize operation
  const finalizeResize = useCallback(
    (blob, width, height) => {
      // Revoke previous URL if exists
      if (result?.url) {
        URL.revokeObjectURL(result.url);
      }

      const url = URL.createObjectURL(blob);
      setResult({
        blob,
        width,
        height,
        size: blob.size,
        url,
      });
      setIsResizing(false);
    },
    [result?.url]
  );

  // Adjust quality to meet target file size
  const adjustQualityForTargetSize = useCallback(
    (canvas, initialBlob) => {
      const targetBytes =
        targetUnit === "KB" ? targetSize * 1024 : targetSize * 1024 * 1024;
      let minQuality = 10;
      let maxQuality = quality;
      let bestBlob = initialBlob;
      let iterations = 0;
      const maxIterations = 10;

      const binarySearch = (callback) => {
        iterations++;
        const midQuality = Math.round((minQuality + maxQuality) / 2);

        canvas.toBlob(
          (blob) => {
            if (!blob || iterations >= maxIterations) {
              callback(bestBlob);
              return;
            }

            const sizeDiff = blob.size - targetBytes;

            if (Math.abs(sizeDiff) < targetBytes * 0.05) {
              callback(blob);
            } else if (blob.size > targetBytes) {
              maxQuality = midQuality - 1;
              binarySearch(callback);
            } else {
              bestBlob = blob;
              minQuality = midQuality + 1;
              binarySearch(callback);
            }
          },
          `image/${outputFormat}`,
          midQuality / 100
        );
      };

      binarySearch((finalBlob) => {
        finalizeResize(finalBlob, canvas.width, canvas.height);
      });
    },
    [finalizeResize, outputFormat, quality, targetSize, targetUnit]
  );

  // Resize and process the image
  const resizeImage = useCallback(() => {
    if (!image || !canvasRef.current) return;

    setIsResizing(true);

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    // Calculate final dimensions
    let finalWidth = dimensions.width;
    let finalHeight = dimensions.height;

    if (unit === "%") {
      finalWidth = Math.round((dimensions.width * originalSize.width) / 100);
      finalHeight = Math.round((dimensions.height * originalSize.height) / 100);
    }

    // Calculate crop area in pixels
    const cropX = (crop.x / 100) * image.width;
    const cropY = (crop.y / 100) * image.height;
    const cropWidth = (crop.width / 100) * image.width;
    const cropHeight = (crop.height / 100) * image.height;

    canvas.width = finalWidth;
    canvas.height = finalHeight;
    ctx.imageSmoothingQuality = "high";

    // Draw the cropped and resized image
    ctx.drawImage(
      image,
      cropX,
      cropY,
      cropWidth,
      cropHeight,
      0,
      0,
      finalWidth,
      finalHeight
    );

    // Convert to blob
    canvas.toBlob(
      (blob) => {
        if (targetSize > 0) {
          adjustQualityForTargetSize(canvas, blob);
        } else {
          finalizeResize(blob, finalWidth, finalHeight);
        }
      },
      `image/${outputFormat}`,
      quality / 100
    );
  }, [
    image,
    dimensions,
    crop,
    unit,
    originalSize,
    outputFormat,
    quality,
    targetSize,
    adjustQualityForTargetSize,
    finalizeResize,
  ]);

  // Handle image upload
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        setImage(img);
        setOriginalSize({ width: img.width, height: img.height });
        setDimensions({
          width: img.width,
          height: img.height,
        });
        setCrop({
          x: 0,
          y: 0,
          width: 100,
          height: 100,
        });
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  // Handle dimension changes
  const handleDimensionChange = (dimension, value) => {
    if (!image) return;

    let newWidth = dimensions.width;
    let newHeight = dimensions.height;

    if (dimension === "width") {
      newWidth = parseInt(value) || 1;
      if (keepAspect && aspectRatio !== "free") {
        const ratio =
          aspectRatio === "16:9"
            ? 16 / 9
            : aspectRatio === "4:3"
            ? 4 / 3
            : aspectRatio === "1:1"
            ? 1
            : 9 / 16;
        newHeight = Math.round(newWidth / ratio);
      }
    } else {
      newHeight = parseInt(value) || 1;
      if (keepAspect && aspectRatio !== "free") {
        const ratio =
          aspectRatio === "16:9"
            ? 16 / 9
            : aspectRatio === "4:3"
            ? 4 / 3
            : aspectRatio === "1:1"
            ? 1
            : 9 / 16;
        newWidth = Math.round(newHeight * ratio);
      }
    }

    setDimensions({ width: newWidth, height: newHeight });
  };

  // Handle crop area changes
  const handleCropChange = (e) => {
    const { name, value } = e.target;
    setCrop((prev) => ({
      ...prev,
      [name]: parseInt(value) || 0,
    }));
  };

  // Download the resized image
  const downloadImage = useCallback(
    (filename = null) => {
      if (!result) return;

      const date = new Date();
      const timestamp = `${date.getFullYear()}${(date.getMonth() + 1)
        .toString()
        .padStart(2, "0")}${date.getDate().toString().padStart(2, "0")}_${date
        .getHours()
        .toString()
        .padStart(2, "0")}${date.getMinutes().toString().padStart(2, "0")}`;

      const link = document.createElement("a");
      link.href = result.url;
      link.download =
        filename ||
        `resized_${timestamp}_${result.width}x${result.height}.${
          outputFormat === "jpeg" ? "jpg" : outputFormat
        }`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setShowDownloadOptions(false);
    },
    [result, outputFormat]
  );

  // Handle image click to show download options
  const handleImageClick = () => {
    setShowDownloadOptions(true);
  };

  // Close download options when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        showDownloadOptions &&
        !e.target.closest(".download-options") &&
        !e.target.closest(".result-image")
      ) {
        setShowDownloadOptions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showDownloadOptions]);

  // Update preview when values change
  useEffect(() => {
    if (image) {
      resizeImage();
    }
  }, [image, resizeImage, dimensions, crop, quality, outputFormat]);

  // Clean up object URLs when component unmounts
  useEffect(() => {
    return () => {
      if (result?.url) {
        URL.revokeObjectURL(result.url);
      }
    };
  }, [result]);

  return (
    <div className="resizer-container">
      <h1>📏 Advanced Image Resizer</h1>
      <p className="subtitle">
        Resize, crop and optimize your images with precision
      </p>

      <div className="resizer-grid">
        {/* Upload Section */}
        <div className="upload-section">
          <div
            className="upload-area"
            onClick={() => fileInputRef.current.click()}
          >
            {image ? (
              <div className="image-container">
                <img
                  ref={imageRef}
                  src={image.src}
                  alt="Original"
                  className="preview-image"
                />
                <div
                  ref={cropRef}
                  className="crop-overlay"
                  style={{
                    left: `${crop.x}%`,
                    top: `${crop.y}%`,
                    width: `${crop.width}%`,
                    height: `${crop.height}%`,
                  }}
                ></div>
              </div>
            ) : (
              <>
                <div className="upload-icon">📤</div>
                <p>Click to upload an image</p>
              </>
            )}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleImageUpload}
              style={{ display: "none" }}
            />
          </div>

          {image && (
            <div className="original-info">
              <h3>Original Image</h3>
              <p>
                Dimensions: {originalSize.width} × {originalSize.height} px
              </p>
              <p>Size: {((image.src.length * 0.75) / 1024).toFixed(2)} KB</p>

              <div className="crop-controls">
                <h4>Crop Area (%)</h4>
                <div className="crop-inputs">
                  <div>
                    <label>X:</label>
                    <input
                      type="number"
                      name="x"
                      min="0"
                      max="100"
                      value={crop.x}
                      onChange={handleCropChange}
                    />
                  </div>
                  <div>
                    <label>Y:</label>
                    <input
                      type="number"
                      name="y"
                      min="0"
                      max="100"
                      value={crop.y}
                      onChange={handleCropChange}
                    />
                  </div>
                  <div>
                    <label>Width:</label>
                    <input
                      type="number"
                      name="width"
                      min="1"
                      max="100"
                      value={crop.width}
                      onChange={handleCropChange}
                    />
                  </div>
                  <div>
                    <label>Height:</label>
                    <input
                      type="number"
                      name="height"
                      min="1"
                      max="100"
                      value={crop.height}
                      onChange={handleCropChange}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Controls Section */}
        <div className="controls-section">
          <div className="dimension-controls">
            <h3>Resize Settings</h3>

            <div className="unit-selector">
              <label>
                <input
                  type="radio"
                  name="unit"
                  checked={unit === "px"}
                  onChange={() => setUnit("px")}
                />
                Pixels (px)
              </label>
              <label>
                <input
                  type="radio"
                  name="unit"
                  checked={unit === "%"}
                  onChange={() => setUnit("%")}
                />
                Percentage (%)
              </label>
            </div>

            <div className="dimension-inputs">
              <div className="input-group">
                <label>Width:</label>
                <input
                  type="number"
                  value={dimensions.width}
                  onChange={(e) =>
                    handleDimensionChange("width", e.target.value)
                  }
                  min="1"
                />
                <span>{unit}</span>
              </div>

              <div className="input-group">
                <label>Height:</label>
                <input
                  type="number"
                  value={dimensions.height}
                  onChange={(e) =>
                    handleDimensionChange("height", e.target.value)
                  }
                  min="1"
                />
                <span>{unit}</span>
              </div>
            </div>

            <div className="aspect-ratio-controls">
              <label className="aspect-ratio-toggle">
                <input
                  type="checkbox"
                  checked={keepAspect}
                  onChange={() => setKeepAspect(!keepAspect)}
                />
                Maintain Aspect Ratio
              </label>

              {keepAspect && (
                <select
                  value={aspectRatio}
                  onChange={(e) => setAspectRatio(e.target.value)}
                >
                  <option value="free">Custom</option>
                  <option value="1:1">Square (1:1)</option>
                  <option value="4:3">Standard (4:3)</option>
                  <option value="16:9">Widescreen (16:9)</option>
                  <option value="9:16">Portrait (9:16)</option>
                </select>
              )}
            </div>

            <div className="target-size">
              <h4>Target File Size</h4>
              <div className="target-size-input">
                <input
                  type="number"
                  value={targetSize}
                  onChange={(e) => setTargetSize(e.target.value)}
                  min="0"
                />
                <select
                  value={targetUnit}
                  onChange={(e) => setTargetUnit(e.target.value)}
                >
                  <option value="KB">KB</option>
                  <option value="MB">MB</option>
                </select>
              </div>
            </div>

            <div className="output-format">
              <h4>Output Format</h4>
              <select
                value={outputFormat}
                onChange={(e) => setOutputFormat(e.target.value)}
              >
                <option value="jpeg">JPEG</option>
                <option value="png">PNG</option>
                <option value="webp">WebP</option>
              </select>
            </div>

            <div className="quality-control">
              <label>Quality: {quality}%</label>
              <input
                type="range"
                min="10"
                max="100"
                value={quality}
                onChange={(e) => setQuality(e.target.value)}
              />
            </div>

            <div className="action-buttons">
              <button
                onClick={resizeImage}
                className="resize-btn"
                disabled={!image || isResizing}
              >
                {isResizing ? "Processing..." : "Resize Image"}
              </button>
            </div>
          </div>

          {/* Results Section */}
          {result && (
            <div className="result-section">
              <h3>Resized Image Preview</h3>
              <div className="result-preview">
                <canvas
                  ref={canvasRef}
                  style={{ position: "absolute", left: "-9999px" }}
                />
                <div className="image-container" onClick={handleImageClick}>
                  <img
                    src={result.url}
                    alt="Resized"
                    className="result-image clickable-image"
                  />
                  {showDownloadOptions && (
                    <div className="download-options">
                      <h4>Download Options</h4>
                      <button onClick={() => downloadImage()}>
                        Download with Default Name
                      </button>
                      <button
                        onClick={() =>
                          downloadImage(
                            `custom_name.${
                              outputFormat === "jpeg" ? "jpg" : outputFormat
                            }`
                          )
                        }
                      >
                        Download with Custom Name
                      </button>
                      <button onClick={() => setShowDownloadOptions(false)}>
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
                <div className="result-info">
                  <p>
                    Dimensions: {result.width} × {result.height} px
                  </p>
                  <p>
                    Size:{" "}
                    {targetUnit === "KB"
                      ? `${(result.size / 1024).toFixed(2)} KB`
                      : `${(result.size / (1024 * 1024)).toFixed(2)} MB`}
                  </p>
                  <p>Format: {outputFormat.toUpperCase()}</p>
                  <button
                    onClick={() => downloadImage()}
                    className="download-btn"
                  >
                    Download Image
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Resizer;
