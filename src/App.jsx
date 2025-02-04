import { useState, useEffect } from "react";
import { FaUpload, FaTimes } from "react-icons/fa";
import "leaflet/dist/leaflet.css";
import "./App.css";
import { PCDLoader } from "three/examples/jsm/loaders/PCDLoader.js";
import GISViewer from "./Components/GISViewer";
import ThreeDViewer from "./Components/3dViewer";
import { min, max } from "d3-array";

function App() {
  const [isSmallScreen, setIsSmallScreen] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [geoJsonData, setGeoJsonData] = useState(null);
  const [xyzData, setXyzData] = useState(null);
  const [pcdData, setPcdData] = useState(null);
  const [logs, setLogs] = useState([]);
  const [activeTab, setActiveTab] = useState("GIS");

  useEffect(() => {
    const handleResize = () => {
      setIsSmallScreen(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setShowPopup(false);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const calculateBoundingBox = (points) => {
    // Extract separate arrays for X, Y, and Z coordinates
    const xValues = points.map((p) => p[0]);
    const yValues = points.map((p) => p[1]);
    const zValues = points.map((p) => p[2]);

    // Calculate min and max for each coordinate axis
    const minX = min(xValues);
    const maxX = max(xValues);
    const minY = min(yValues);
    const maxY = max(yValues);
    const minZ = min(zValues);
    const maxZ = max(zValues);

    return {
      dimensions: {
        width: maxX - minX,
        length: maxY - minY,
        height: maxZ - minZ,
      },
      center: {
        x: (minX + maxX) / 2,
        y: (minY + maxY) / 2,
        z: (minZ + maxZ) / 2,
      },
    };
  };

  function handleFileUpload(event, props) {
    props = props?.props;
    setGeoJsonData(null);
    setXyzData(null);
    setPcdData(null);

    const file = event.target.files[0];
    if (!file) return;

    // Validate file format and size
    const allowedFormats = [".json", ".geojson", ".xyz", ".pcd"];
    const fileExtension = file.name
      .toLowerCase()
      .slice(file.name.lastIndexOf("."));
    const maxSizeMB = 50;

    if (!allowedFormats.includes(fileExtension)) {
      alert(
        `Unsupported file format. Please upload ${allowedFormats.join(
          ", "
        )} files only.`
      );
      return;
    }
    if (file.size > maxSizeMB * 1024 * 1024) {
      alert(`File is too large! Please upload a file under ${maxSizeMB}MB.`);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      if (!e.target.result.trim()) {
        alert("Uploaded file is empty.");
        return;
      }

      let fileSize = file.size;
      let sizeInUnits;
      if (fileSize < 1024) {
        sizeInUnits = `${fileSize} Bytes`;
      } else if (fileSize < 1024 * 1024) {
        sizeInUnits = `${(fileSize / 1024).toFixed(2)} KB`;
      } else if (fileSize < 1024 * 1024 * 1024) {
        sizeInUnits = `${(fileSize / 1024 / 1024).toFixed(2)} MB`;
      } else {
        sizeInUnits = `${(fileSize / 1024 / 1024 / 1024).toFixed(2)} GB`;
      }
      console.log("File size:", sizeInUnits);
      let fileDetails = {
        name: file.name,
        size: sizeInUnits,
        format: fileExtension,
      };

      if (fileExtension === ".geojson" || fileExtension === ".json") {
        try {
          const geoJson = JSON.parse(e.target.result);

          if (
            !geoJson ||
            geoJson.type !== "FeatureCollection" ||
            !Array.isArray(geoJson.features)
          ) {
            alert("Invalid GeoJSON format.");
            return;
          }

          geoJson.features.forEach((feature, index) => {
            if (
              !feature.geometry ||
              !feature.geometry.type ||
              !feature.geometry.coordinates
            ) {
              alert(`Feature at index ${index} is missing geometry data.`);
              return;
            }
          });

          console.log("GeoJSON file uploaded:", geoJson);
          setGeoJsonData(geoJson);
          setLogs([
            ...logs,
            `GeoJSON file uploaded: ${geoJson?.features.length} features`,
          ]);
          props?.setActiveTab("GIS");
        } catch (error) {
          alert("Invalid GeoJSON file.");
          return;
        }
      } else if (fileExtension === ".xyz") {
        const points = e.target.result.split("\n");
        const coordinates = [];

        for (const line of points) {
          const trimmedLine = line.trim();
          if (trimmedLine.startsWith("#") || trimmedLine === "") continue;
          const parts = trimmedLine.split(/\s+/);
          if (
            parts.length >= 2 &&
            parts.length <= 3 &&
            parts.every((value) => !isNaN(parseFloat(value)))
          ) {
            const x = parseFloat(parts[0]);
            const y = parseFloat(parts[1]);
            const z = parts.length === 3 ? parseFloat(parts[2]) : 0; // Default Z = 0 if missing
            coordinates.push([x, y, z]);
          }
        }
        setXyzData(coordinates);
        const boundingBox = calculateBoundingBox(coordinates);
        fileDetails = {
          ...fileDetails,
          pointCount: coordinates.length,
          boundingBox,
        };
        console.log("XYZ file uploaded:", coordinates);
        setLogs([...logs, `XYZ file uploaded: ${coordinates.length} points`]);
        props?.setActiveTab("3D");
      } else if (fileExtension === ".pcd") {
        const reader = new FileReader();
        reader.onload = function (event) {
          const loader = new PCDLoader();
          const buffer = event.target.result;
          try {
            const pointCloud = loader.parse(buffer, file.name);
            if (!pointCloud || !pointCloud.geometry)
              throw new Error("Invalid PCD data.");

            const points = pointCloud.geometry.attributes.position.array;
            const formattedPoints = [];
            for (let i = 0; i < points.length; i += 3) {
              let x =
                points[i] !== undefined && !isNaN(points[i]) ? points[i] : 0;
              let y =
                points[i + 1] !== undefined && !isNaN(points[i + 1])
                  ? points[i + 1]
                  : 0;
              let z =
                points[i + 2] !== undefined && !isNaN(points[i + 2])
                  ? points[i + 2]
                  : 0;

              formattedPoints.push([x, y, z]);
            }
            setPcdData(formattedPoints);
            const boundingBox = calculateBoundingBox(formattedPoints);
            fileDetails = {
              ...fileDetails,
              pointCount: formattedPoints.length,
              boundingBox,
            };
            setSelectedFile(fileDetails);
            console.log("PCD file uploaded:", formattedPoints);
            setLogs([
              ...logs,
              `PCD file uploaded: ${formattedPoints.length} points`,
            ]);
            props?.setActiveTab("3D");
          } catch (error) {
            alert("Error parsing PCD file: " + error.message);
          }
        };
        reader.readAsArrayBuffer(file);
      }
      setSelectedFile(fileDetails);
      if (isSmallScreen) {
        setShowPopup(false);
      }
    };
    reader.readAsText(file);
  }

  const FileUploadPanel = (props) => (
    <div className="upload-section">
      <h2>File Upload</h2>
      <div className="upload-box">
        <input
          type="file"
          id="file-upload"
          onChange={(event) => handleFileUpload(event, props)}
          className="file-input"
          // accept=".geojson,.xyz,.pcd,.json"
        />
        <label htmlFor="file-upload" className="upload-label">
          <FaUpload />
          <span>Choose a file</span>
          <small>Supported formats: .xyz, .pcd, .geojson, .json</small>
        </label>
      </div>
      {selectedFile && (
        <div className="file-metadata">
          <h3>File Details</h3>
          <p>
            <strong>Name:</strong> {selectedFile.name}
          </p>
          <p>
            <strong>Size:</strong> {selectedFile.size}
          </p>
          <p>
            <strong>Format:</strong> {selectedFile.format}
          </p>
          <p>
            {selectedFile?.pointCount?.toLocaleString() && (
              <>
                <strong>Points:</strong>{" "}
                {selectedFile.pointCount?.toLocaleString()}
              </>
            )}
          </p>
          {selectedFile.boundingBox && (
            <>
              <h4>Bounding Box</h4>
              <p>
                <strong>Dimensions:</strong>
                <br />
                Width: {selectedFile.boundingBox.dimensions.width.toFixed(2)}
                <br />
                Length: {selectedFile.boundingBox.dimensions.length.toFixed(2)}
                <br />
                Height: {selectedFile.boundingBox.dimensions.height.toFixed(2)}
              </p>
              <p>
                <strong>Center:</strong>
                <br />
                X: {selectedFile.boundingBox.center.x.toFixed(2)}
                <br />
                Y: {selectedFile.boundingBox.center.y.toFixed(2)}
                <br />
                Z: {selectedFile.boundingBox.center.z.toFixed(2)}
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="dashboard">
      <div className="navbar">3D-GIS Dashboard</div>

      {isSmallScreen ? (
        <>
          <button
            className="upload-icon-button"
            onClick={() => setShowPopup(true)}
          >
            <FaUpload />
          </button>
          {showPopup && (
            <div className="popup-overlay">
              <div className="popup-content">
                <button
                  className="close-button"
                  onClick={() => setShowPopup(false)}
                >
                  <FaTimes />
                </button>
                <FileUploadPanel props={{ setActiveTab }} />
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="left-panel">
          <FileUploadPanel props={{ setActiveTab }} />
        </div>
      )}

      <div className="center-panel">
        <div className="tabs">
          <button
            className={`tab ${activeTab === "GIS" ? "active" : ""}`}
            onClick={() => setActiveTab("GIS")}
          >
            GIS Map
          </button>
          <button
            className={`tab ${activeTab === "3D" ? "active" : ""}`}
            onClick={() => setActiveTab("3D")}
          >
            3D Viewer
          </button>
        </div>
        <div className="content" style={{ height: "100%" }}>
          {activeTab === "GIS" && geoJsonData ? (
            <GISViewer geoJsonData={geoJsonData} />
          ) : // <GISViewerNew {...geoJsonData} />
          // <GeoJSONMap {...geoJsonData} />
          // <GISViewer geoJsonData={geoJsonData} />
          activeTab === "3D" && (xyzData || pcdData) ? (
            <ThreeDViewer points={xyzData || pcdData} />
          ) : (
            // <PointCloudViewer points={xyzData || pcdData} />
            <div className="viewer-placeholder">No data to display.</div>
          )}
        </div>
      </div>

      <div className="bottom-panel">
        <h3>Activity Log</h3>
        <div className="log-content">
          <p>
            <span style={{ color: "#4CAF50" }}>✓</span> Application initialized
          </p>
          {logs.map((log, index) => (
            <p key={index}>
              <span style={{ color: "#4CAF50" }}>✓</span> {log}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;
