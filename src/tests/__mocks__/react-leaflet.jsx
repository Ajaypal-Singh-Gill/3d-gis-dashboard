import React from "react";

export const MapContainer = ({ children }) => (
  <div data-testid="map-container">{children}</div>
);

export const TileLayer = () => <div data-testid="tile-layer" />;
export const Marker = ({ children }) => (
  <div data-testid="marker">{children}</div>
);
export const Popup = ({ children }) => (
  <div data-testid="popup">{children}</div>
);
export const Polyline = ({ children }) => (
  <div data-testid="polyline">{children}</div>
);
export const Polygon = ({ children }) => (
  <div data-testid="polygon">{children}</div>
);
export const LayersControl = ({ children }) => (
  <div data-testid="layers-control">{children}</div>
);

LayersControl.BaseLayer = ({ children }) => (
  <div data-testid="base-layer">{children}</div>
);
LayersControl.Overlay = ({ children }) => (
  <div data-testid="overlay">{children}</div>
);
