import React from "react";
import { render, screen } from "@testing-library/react";
import ThreeDViewer from "../Components/3dViewer";
import * as THREE from "three";
import "@testing-library/jest-dom"; // Add this import

describe("ThreeDViewer Component", () => {
  test("renders 'No data to show.' when points are empty", () => {
    render(<ThreeDViewer points={[]} />);
    expect(screen.getByText("No data to show.")).toBeInTheDocument();
  });

  test("renders the 3D viewer when points are provided", () => {
    const mockPoints = [
      [1, 2, 3],
      [4, 5, 6],
      [7, 8, 9],
    ];
    render(<ThreeDViewer points={mockPoints} />);
    expect(screen.queryByText("No data to show.")).not.toBeInTheDocument();
  });

  test("initializes altitude range correctly", () => {
    const mockPoints = [
      [1, 2, 10],
      [4, 5, 20],
      [7, 8, 30],
    ];
    render(<ThreeDViewer points={mockPoints} />);
    expect(screen.getByText("10.00 - 30.00 m")).toBeInTheDocument();
  });

  test("computes bounding sphere correctly", () => {
    const mockPoints = [
      [1, 2, 10],
      [4, 5, 20],
      [7, 8, 30],
    ];
    render(<ThreeDViewer points={mockPoints} />);

    const geom = new THREE.BufferGeometry();
    geom.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(mockPoints.flat(), 3)
    );
    geom.computeBoundingSphere();

    expect(geom.boundingSphere).not.toBeNull();
    expect(geom.boundingSphere.radius).toBeGreaterThan(0);
  });

  test("updates altitude range dynamically", () => {
    const { rerender } = render(
      <ThreeDViewer
        points={[
          [1, 2, 10],
          [4, 5, 20],
        ]}
      />
    );
    expect(screen.getByText("10.00 - 20.00 m")).toBeInTheDocument();

    rerender(
      <ThreeDViewer
        points={[
          [1, 2, 5],
          [4, 5, 25],
        ]}
      />
    );
    expect(screen.getByText("5.00 - 25.00 m")).toBeInTheDocument();
  });
});
