import { render, screen, fireEvent } from "@testing-library/react";
import GISViewer from "../Components/GISViewer";
import { describe, it, expect, vi } from "vitest";
import "@testing-library/jest-dom";

vi.mock("react-leaflet", () => import("./__mocks__/react-leaflet"));
vi.mock("leaflet", () => import("./__mocks__/leaflet"));

describe("GISViewer Component", () => {
  const mockGeoJsonData = {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [30, 10],
        },
        properties: {
          description: "Test Point",
          timestamp: "2023-01-01T12:00:00Z",
        },
      },
      {
        type: "Feature",
        geometry: {
          type: "LineString",
          coordinates: [
            [30, 10],
            [40, 20],
          ],
        },
        properties: {
          description: "Test Line",
        },
      },
    ],
  };

  it("renders the map container", () => {
    render(<GISViewer geoJsonData={{ features: [] }} />);
    expect(screen.getByTestId("map-container")).toBeInTheDocument();
  });

  it("renders tile layers", () => {
    render(<GISViewer geoJsonData={{ features: [] }} />);
    expect(screen.getAllByTestId("tile-layer").length).toBeGreaterThan(0);
  });

  it("renders layers control", () => {
    render(<GISViewer geoJsonData={{ features: [] }} />);
    expect(screen.getByTestId("layers-control")).toBeInTheDocument();
  });

  it("renders markers for point features", () => {
    render(<GISViewer geoJsonData={mockGeoJsonData} />);
    expect(screen.getAllByTestId("marker").length).toBeGreaterThan(0);
  });

  it("renders a polyline for line features", () => {
    render(<GISViewer geoJsonData={mockGeoJsonData} />);
    expect(screen.getAllByTestId("polyline").length).toBeGreaterThan(0);
  });

  it("renders the track marker if time-based data exists", () => {
    render(<GISViewer geoJsonData={mockGeoJsonData} />);
    expect(screen.getByTestId("marker")).toBeInTheDocument();
  });

  it("renders the metadata filter component", () => {
    render(<GISViewer geoJsonData={mockGeoJsonData} />);
    expect(screen.getByText(/Map Controls/i)).toBeInTheDocument();
  });

  it("renders the time animation controls when timestamps exist", () => {
    render(<GISViewer geoJsonData={mockGeoJsonData} />);
    expect(screen.getByText(/Play/i)).toBeInTheDocument();
  });
});
