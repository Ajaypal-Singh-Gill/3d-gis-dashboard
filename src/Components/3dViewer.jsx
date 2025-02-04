import React, { useState, useEffect, useCallback } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, GizmoHelper, GizmoViewport } from "@react-three/drei";
import * as THREE from "three";
import { Range } from "react-range";
import { FaCube, FaCog } from "react-icons/fa";
import "./3dViewer.css";
import Loader from "./Loader";
import { min, max } from "d3-array";

const ThreeDViewer = ({ points }) => {
  if (!points || points.length === 0) {
    return <div>No data to show.</div>;
  }

  const [containerRef, setContainerRef] = useState(null);
  const [isControlsCollapsed, setIsControlsCollapsed] = useState(true);
  const [isPointSizeDefined, setIsPointSizeDefined] = useState(false);
  const [geometry, setGeometry] = useState(null);
  const [center, setCenter] = useState(new THREE.Vector3(0, 0, 0));
  const [radius, setRadius] = useState(1);
  const [pointSize, setPointSize] = useState(0.01);
  const [sliderMin, setSliderMin] = useState(0.001);
  const [sliderMax, setSliderMax] = useState(0.1);
  const [dataMinZ, setDataMinZ] = useState(0);
  const [dataMaxZ, setDataMaxZ] = useState(1000);
  const [altitudeRange, setAltitudeRange] = useState([0, 1000]);

  useEffect(() => {
    if (!points || points.length === 0) return;

    const zValues = points.map((p) => p[2]);
    const minZ = min(zValues);
    const maxZ = max(zValues);

    setDataMinZ(minZ);
    setDataMaxZ(maxZ);
    setAltitudeRange([minZ, maxZ]);
  }, [points]);

  useEffect(() => {
    if (!points || points.length === 0) return;
    if (!altitudeRange || altitudeRange.length < 2) return;

    const [altitudeMin, altitudeMax] = altitudeRange;
    const filteredPoints = points.filter((p) => {
      const z = p[2];
      return z >= altitudeMin && z <= altitudeMax;
    });

    if (filteredPoints.length === 0) {
      const emptyGeom = new THREE.BufferGeometry();
      setGeometry(emptyGeom);
      setRadius(1);
      return;
    }

    const geom = new THREE.BufferGeometry();
    geom.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(filteredPoints.flat(), 3)
    );

    const colors = filteredPoints.map((p) => {
      const altitude = p[2];
      const color = new THREE.Color().setHSL(altitude / 10, 1.0, 0.5);
      return [color.r, color.g, color.b];
    });
    geom.setAttribute(
      "color",
      new THREE.Float32BufferAttribute(new Float32Array(colors.flat()), 3)
    );

    geom.computeBoundingSphere();
    const { center: sphereCenter, radius: sphereRadius } = geom.boundingSphere;

    setGeometry(geom);
    setCenter(sphereCenter.clone());
    setRadius(sphereRadius);
  }, [points, altitudeRange]);

  useEffect(() => {
    if (isPointSizeDefined) return;
    if (!geometry || !geometry.boundingSphere) return;

    const sphereRadius = geometry.boundingSphere.radius;
    const recommendedSize = Math.max(sphereRadius * 0.001, 0.0001);

    setPointSize(recommendedSize);
    setSliderMin(recommendedSize / 10);
    setSliderMax(recommendedSize * 10);
    setIsPointSizeDefined(true);
  }, [geometry]);

  const handleAltitudeRangeChange = useCallback((values) => {
    setAltitudeRange(values);
  }, []);

  const cameraDistance = radius * 3;

  const renderTrack = ({ props, children }) => (
    <div
      onMouseDown={props.onMouseDown}
      onTouchStart={props.onTouchStart}
      className="range-track"
      style={{
        ...props.style,
        height: "6px",
        width: "35%",
        borderRadius: "3px",
      }}
    >
      <div
        ref={props.ref}
        className="range-track-1"
        style={{
          height: "100%",
          borderRadius: "3px",
        }}
      >
        {children}
      </div>
    </div>
  );

  const renderThumb = ({ props }) => (
    <div {...props} ref={props.ref} className="range-thumb">
      {/* <div className="value-tooltip">{props["aria-valuenow"]?.toFixed(5)}</div> */}
    </div>
  );

  return (
    <div ref={setContainerRef} style={{ height: "100%", position: "relative" }}>
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
            <FaCube /> Point Cloud Controls
          </h3>
          {/* <p>Adjust visualization parameters</p> */}
        </div>

        {altitudeRange?.length === 2 && dataMinZ != null && dataMaxZ != null ? (
          <div className="control-group">
            <label
              style={{
                fontSize: "12px",
                display: "flex",
                marginRight: "-40px",
              }}
            >
              Altitude
            </label>
            <Range
              step={0.01}
              min={dataMinZ}
              max={dataMaxZ}
              values={altitudeRange}
              onChange={handleAltitudeRangeChange}
              renderTrack={renderTrack}
              renderThumb={renderThumb}
            />
            <div className="value-display">
              {altitudeRange[0]?.toFixed(2)} - {altitudeRange[1]?.toFixed(2)} m
            </div>
          </div>
        ) : (
          <Loader height="40px" />
        )}

        <div className="control-group">
          <label
            style={{ fontSize: "12px", display: "flex", marginRight: "-40px" }}
          >
            Point Size
          </label>
          <Range
            step={(sliderMax - sliderMin) / 100}
            min={sliderMin}
            max={sliderMax}
            values={[pointSize]}
            onChange={(values) => setPointSize(values[0])}
            renderTrack={renderTrack}
            renderThumb={renderThumb}
          />
          <div className="value-display">{pointSize?.toFixed(5)} units</div>
        </div>
      </div>

      {containerRef && geometry && (
        <Canvas
          camera={{
            position: [center.x, center.y, center.z + cameraDistance],
            near: 0.1,
            far: cameraDistance * 100,
            fov: 75,
          }}
          style={{
            height: containerRef.clientHeight,
            width: containerRef.clientWidth,
            background: "#1a1a1a",
          }}
        >
          <OrbitControls
            enablePan
            enableZoom
            enableRotate
            enableDamping
            target={[center.x, center.y, center.z]}
          />
          <ambientLight intensity={0.5} />
          <points>
            <primitive object={geometry} />
            <pointsMaterial
              size={pointSize}
              vertexColors
              sizeAttenuation={true}
            />
          </points>
          <GizmoHelper alignment="bottom-right" margin={[80, 80]}>
            <GizmoViewport />
          </GizmoHelper>
        </Canvas>
      )}
    </div>
  );
};

export default ThreeDViewer;
