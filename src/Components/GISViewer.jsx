import { useState, useEffect, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  Polygon,
  LayersControl,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { FaMap, FaCog } from "react-icons/fa";
import MetadataFilter from "./MetadataFilter";
import TimeAnimationControls from "./TimeAnimationControls";
import "./GISViewer.css";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
});

const GISViewer = ({ geoJsonData }) => {
  if (!geoJsonData || geoJsonData.length === 0) {
    return <div>No data to show.</div>;
  }
  // Map states
  const [activeFeature, setActiveFeature] = useState(null);
  const [filteredData, setFilteredData] = useState(geoJsonData || {});

  // Collapsible controls
  const [isControlsCollapsed, setIsControlsCollapsed] = useState(true);

  // Time-series animation states
  const [timeSteps, setTimeSteps] = useState([]); // array of sorted unique timestamps
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // A ref to store the interval ID so we can clear it when needed
  const intervalRef = useRef(null);

  // Build and sort `timeSteps`
  useEffect(() => {
    if (!geoJsonData || !geoJsonData.features) return;

    const timestamps = [];
    geoJsonData.features.forEach((f) => {
      if (f.properties && f.properties.timestamp) {
        timestamps.push(f.properties.timestamp);
      }
    });

    // Sort them chronologically (unique values)
    const sorted = Array.from(new Set(timestamps)).sort(
      (a, b) => new Date(a) - new Date(b)
    );

    setTimeSteps(sorted);
    setCurrentIndex(0);
    setIsPlaying(false);
  }, [geoJsonData]);

  // Handle the "Play" animation (increment currentIndex over time)
  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setCurrentIndex((prevIndex) => {
          let nextIndex = prevIndex + 1;
          // Loop back to start if we reach the end
          if (nextIndex >= timeSteps.length) {
            nextIndex = 0;
          }
          return nextIndex;
        });
      }, 1000); // Advance every 1 second
    } else {
      // Pause
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    // Cleanup on unmount or when isPlaying changes
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying, timeSteps]);

  // The current "selectedTime" based on the timeSteps and currentIndex
  const selectedTime = timeSteps[currentIndex];

  // Apply your final filter for time + tags
  const finalFilteredFeatures = (filteredData.features || []).filter(
    (feature) => {
      const props = feature.properties || {};
      // If no timestamp, treat it as static (always visible)
      if (!props.timestamp) return true;

      // If it has a timestamp, show only if featureTime <= selectedTime
      const featureTime = new Date(props.timestamp).getTime();
      const currentTimeVal = selectedTime
        ? new Date(selectedTime).getTime()
        : null;

      if (!currentTimeVal) {
        // If no selectedTime (timeSteps empty?), show everything
        return true;
      }
      return featureTime <= currentTimeVal;
    }
  );

  //  We'll do a "single track" approach for all *Point* features with timestamps:
  //    a) Sort them by timestamp
  //    b) The polyline is all those points
  //    c) The marker is at the last point
  const defaultIcon = new L.Icon({
    iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
  });

  // Extract only the point features with `timestamp`
  const trackPoints = finalFilteredFeatures
    .filter(
      (f) =>
        f.geometry.type === "Point" && f.properties && f.properties.timestamp
    )
    .sort(
      (a, b) =>
        new Date(a.properties.timestamp).getTime() -
        new Date(b.properties.timestamp).getTime()
    );

  // The "current" position is the last point in the time-filtered array
  let trackMarker = null;
  let trackPolyline = null;

  if (trackPoints.length > 0) {
    // All the coords for the polyline (from first to last in time)
    const trackCoords = trackPoints.map((f) => [
      f.geometry.coordinates[1],
      f.geometry.coordinates[0],
    ]);

    // The last point is our "moving marker" location
    const lastFeature = trackPoints[trackPoints.length - 1];
    const [lastLng, lastLat] = lastFeature.geometry.coordinates;

    trackPolyline = (
      <Polyline positions={trackCoords} color="red">
        <Popup>
          <div>
            <strong>Track Path</strong>
          </div>
        </Popup>
      </Polyline>
    );

    trackMarker = (
      <Marker position={[lastLat, lastLng]} icon={defaultIcon}>
        <Popup>
          <div>
            <strong>Current Position</strong>
            <br />
            {lastFeature.properties.timestamp}
          </div>
        </Popup>
      </Marker>
    );
  }

  // For everything else (polygons, lines, static points, etc.) we still use `renderFeature`.
  const nonTrackFeatures = finalFilteredFeatures.filter((f) => {
    // If it's a point with a timestamp, exclude it from the normal rendering
    if (f.geometry?.type === "Point" && f.properties?.timestamp) {
      return false;
    }
    return true;
  });

  const finalDataForRender = { ...filteredData, features: nonTrackFeatures };

  // Normal geometry rendering function
  const renderFeature = (feature, index) => {
    if (!feature.geometry) return null;
    const { type, coordinates } = feature.geometry;
    const props = feature.properties || {};

    switch (type) {
      case "Point": {
        const [lng, lat] = coordinates;
        return (
          <Marker
            key={index}
            position={[lat, lng]}
            icon={defaultIcon}
            eventHandlers={{ click: () => setActiveFeature(feature) }}
          >
            {activeFeature === feature && (
              <Popup>
                <div
                  style={{
                    fontFamily: "Arial, sans-serif",
                    // padding: "10px",
                    maxWidth: "250px",
                  }}
                >
                  <h3
                    style={{
                      margin: "0 0 10px",
                      fontSize: "16px",
                      color: "#333",
                      borderBottom: "2px solid #007BFF",
                      paddingBottom: "5px",
                    }}
                  >
                    Metadata
                  </h3>
                  <p style={{ margin: "5px 0", fontSize: "14px" }}>
                    <strong style={{ color: "#555" }}>Coordinates:</strong>{" "}
                    {lat}, {lng}
                  </p>
                  {props.description && (
                    <p style={{ margin: "5px 0", fontSize: "14px" }}>
                      <strong style={{ color: "#555" }}>Description:</strong>{" "}
                      {props.description}
                    </p>
                  )}
                  {props.tags && props.tags.length > 0 && (
                    <div style={{ margin: "5px 0", fontSize: "14px" }}>
                      <strong style={{ color: "#555" }}>Tags:</strong>
                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: "5px",
                          marginTop: "5px",
                        }}
                      >
                        {props.tags.map((tag, index) => (
                          <span
                            key={index}
                            style={{
                              backgroundColor: "#007BFF",
                              color: "#fff",
                              padding: "4px 8px",
                              borderRadius: "5px",
                              fontSize: "12px",
                            }}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {props.timestamp && (
                    <p style={{ margin: "5px 0", fontSize: "14px" }}>
                      <strong style={{ color: "#555" }}>Time:</strong>{" "}
                      {props.timestamp}
                    </p>
                  )}
                </div>
              </Popup>
            )}
          </Marker>
        );
      }

      case "LineString":
        return (
          <Polyline
            key={index}
            positions={coordinates.map(([lng, lat]) => [lat, lng])}
            color="blue"
            eventHandlers={{ click: () => setActiveFeature(feature) }}
          >
            <Popup>
              <div
                style={{
                  fontFamily: "Arial, sans-serif",
                  // padding: "12px",
                  maxWidth: "260px",
                  borderRadius: "8px",
                }}
              >
                <h3
                  style={{
                    margin: "0 0 12px",
                    fontSize: "16px",
                    color: "#333",
                    borderBottom: "2px solid #007BFF",
                    paddingBottom: "6px",
                  }}
                >
                  Metadata
                </h3>

                <p style={{ margin: "6px 0", fontSize: "14px", color: "#444" }}>
                  <strong style={{ color: "#007BFF" }}>Coordinates:</strong>{" "}
                  {JSON.stringify(coordinates)}
                </p>

                {props.description && (
                  <p
                    style={{ margin: "6px 0", fontSize: "14px", color: "#444" }}
                  >
                    <strong style={{ color: "#007BFF" }}>Description:</strong>{" "}
                    {props.description}
                  </p>
                )}

                {props.timestamp && (
                  <p
                    style={{ margin: "6px 0", fontSize: "14px", color: "#444" }}
                  >
                    <strong style={{ color: "#007BFF" }}>Time:</strong>{" "}
                    {props.timestamp}
                  </p>
                )}
              </div>
            </Popup>
          </Polyline>
        );

      case "Polygon":
      case "MultiPolygon":
        return (
          <Polygon
            key={index}
            positions={coordinates.map((polygon) =>
              polygon.map(([lng, lat]) => [lat, lng])
            )}
            color="green"
            eventHandlers={{ click: () => setActiveFeature(feature) }}
          >
            <Popup>
              <div
                style={{
                  fontFamily: "Arial, sans-serif",
                  // padding: "12px",
                  maxWidth: "260px",
                  borderRadius: "8px",
                }}
              >
                <h3
                  style={{
                    margin: "0 0 12px",
                    fontSize: "16px",
                    color: "#333",
                    borderBottom: "2px solid #007BFF",
                    paddingBottom: "6px",
                  }}
                >
                  Metadata
                </h3>

                <p style={{ margin: "6px 0", fontSize: "14px", color: "#444" }}>
                  <strong style={{ color: "#007BFF" }}>Area Data:</strong>{" "}
                  {JSON.stringify(coordinates)}
                </p>

                {props.description && (
                  <p
                    style={{ margin: "6px 0", fontSize: "14px", color: "#444" }}
                  >
                    <strong style={{ color: "#007BFF" }}>Description:</strong>{" "}
                    {props.description}
                  </p>
                )}

                {props.timestamp && (
                  <p
                    style={{ margin: "6px 0", fontSize: "14px", color: "#444" }}
                  >
                    <strong style={{ color: "#007BFF" }}>Time:</strong>{" "}
                    {props.timestamp}
                  </p>
                )}
              </div>
            </Popup>
          </Polygon>
        );

      case "MultiPoint":
        return coordinates.map(([lng, lat], i) => (
          <Marker
            key={`${index}-${i}`}
            position={[lat, lng]}
            icon={defaultIcon}
            eventHandlers={{ click: () => setActiveFeature(feature) }}
          >
            {activeFeature === feature && (
              <Popup>
                <div
                  style={{
                    fontFamily: "Arial, sans-serif",
                    // padding: "12px",
                    maxWidth: "250px",
                    borderRadius: "8px",
                  }}
                >
                  <h3
                    style={{
                      margin: "0 0 10px",
                      fontSize: "16px",
                      color: "#333",
                      borderBottom: "2px solid #007BFF",
                      paddingBottom: "6px",
                    }}
                  >
                    Metadata
                  </h3>

                  <p
                    style={{ margin: "6px 0", fontSize: "14px", color: "#444" }}
                  >
                    <strong style={{ color: "#007BFF" }}>Coordinates:</strong>{" "}
                    {lat}, {lng}
                  </p>

                  {props.timestamp && (
                    <p
                      style={{
                        margin: "6px 0",
                        fontSize: "14px",
                        color: "#444",
                      }}
                    >
                      <strong style={{ color: "#007BFF" }}>⏳ Time:</strong>{" "}
                      {props.timestamp}
                    </p>
                  )}
                </div>
              </Popup>
            )}
          </Marker>
        ));

      case "MultiLineString":
        return coordinates.map((line, i) => (
          <Polyline
            key={`${index}-${i}`}
            positions={line.map(([lng, lat]) => [lat, lng])}
            color="blue"
            eventHandlers={{ click: () => setActiveFeature(feature) }}
          >
            <Popup>
              <div
                style={{
                  fontFamily: "Arial, sans-serif",
                  // padding: "12px",
                  maxWidth: "260px",
                  borderRadius: "8px",
                  backgroundColor: "#fff",
                  boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.2)",
                }}
              >
                <h3
                  style={{
                    margin: "0 0 10px",
                    fontSize: "16px",
                    color: "#333",
                    borderBottom: "2px solid #007BFF",
                    paddingBottom: "6px",
                  }}
                >
                  Metadata
                </h3>

                <p
                  style={{
                    margin: "6px 0",
                    fontSize: "14px",
                    color: "#444",
                    wordBreak: "break-word",
                  }}
                >
                  <strong style={{ color: "#007BFF" }}>📍 Coordinates:</strong>{" "}
                  {JSON.stringify(line)}
                </p>

                {props.timestamp && (
                  <p
                    style={{ margin: "6px 0", fontSize: "14px", color: "#444" }}
                  >
                    <strong style={{ color: "#007BFF" }}>⏳ Time:</strong>{" "}
                    {props.timestamp}
                  </p>
                )}
              </div>
            </Popup>
          </Polyline>
        ));

      default:
        return null;
    }
  };

  return (
    <div style={{ height: "100%", width: "100%", position: "relative" }}>
      {/* Side Panel / Controls */}
      <div
        className={`viewer-controls ${isControlsCollapsed ? "collapsed" : ""}`}
      >
        <button
          className="collapse-button"
          title="Toggle Controls Panel"
          onClick={() => setIsControlsCollapsed(!isControlsCollapsed)}
        >
          <FaCog></FaCog>
        </button>

        <div className="controls-header">
          <h3>
            <FaMap /> Map Controls
          </h3>
          {/* <p>Adjust visualization parameters</p> */}
        </div>

        {/* Time Animation Controls */}
        {timeSteps.length > 0 && (
          <TimeAnimationControls
            timeSteps={timeSteps}
            currentIndex={currentIndex}
            setCurrentIndex={setCurrentIndex}
            isPlaying={isPlaying}
            setIsPlaying={setIsPlaying}
          />
        )}

        {/* Metadata Filter (tag-based) */}
        {
          <MetadataFilter
            geoJsonData={geoJsonData}
            setFilteredData={setFilteredData}
          />
        }
      </div>

      {/* The Map */}
      <MapContainer
        center={[0, 0]}
        zoom={2}
        style={{ height: "100%", width: "100%" }}
      >
        <LayersControl position="bottomleft">
          <LayersControl.BaseLayer checked name="OpenStreetMap">
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution="&copy; OpenStreetMap contributors"
            />
          </LayersControl.BaseLayer>

          <LayersControl.BaseLayer name="Satellite">
            <TileLayer
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              attribution="&copy; Esri"
            />
          </LayersControl.BaseLayer>

          <LayersControl.Overlay checked name="Features">
            {/* Optionally wrap in MarkerClusterGroup for clustering */}
            {/* <MarkerClusterGroup> */}
            {finalDataForRender?.features?.map(renderFeature)}
            {/* </MarkerClusterGroup> */}
          </LayersControl.Overlay>

          {/* Our single-track overlay (Marker + Polyline) */}
          <LayersControl.Overlay checked name="Single Track">
            <>
              {trackPolyline}
              {trackMarker}
            </>
          </LayersControl.Overlay>
        </LayersControl>
      </MapContainer>
    </div>
  );
};

export default GISViewer;
