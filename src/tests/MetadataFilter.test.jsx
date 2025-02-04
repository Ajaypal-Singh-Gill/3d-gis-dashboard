import { render, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import MetadataFilter from "../Components/MetadataFilter";

const mockGeoJsonData = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: { tags: ["tag1", "tag2"], timestamp: "2023-01-01T12:00:00Z" },
    },
    {
      type: "Feature",
      properties: { tags: ["tag2", "tag3"], timestamp: "2023-02-01T12:00:00Z" },
    },
  ],
};

describe("MetadataFilter Component", () => {
  it("renders without crashing", () => {
    const { container } = render(
      <MetadataFilter
        geoJsonData={mockGeoJsonData}
        setFilteredData={() => {}}
        selectedTime={null}
      />
    );
    expect(container.firstChild).toBeDefined();
  });

  it("displays available tags", () => {
    const { getByLabelText } = render(
      <MetadataFilter
        geoJsonData={mockGeoJsonData}
        setFilteredData={() => {}}
        selectedTime={null}
      />
    );
    expect(getByLabelText("tag1")).toBeDefined();
    expect(getByLabelText("tag2")).toBeDefined();
    expect(getByLabelText("tag3")).toBeDefined();
  });

  it("filters data based on selected tags", () => {
    let filteredData = {};
    const setFilteredData = (data) => (filteredData = data);
    const { getByLabelText } = render(
      <MetadataFilter
        geoJsonData={mockGeoJsonData}
        setFilteredData={setFilteredData}
        selectedTime={null}
      />
    );

    fireEvent.click(getByLabelText("tag1"));
    expect(filteredData.features.length).toBe(1);
    expect(filteredData.features[0].properties.tags).toContain("tag1");
  });
});
