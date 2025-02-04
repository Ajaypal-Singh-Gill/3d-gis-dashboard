import { useState, useEffect } from "react";
import "leaflet/dist/leaflet.css";
import "./GISViewer.css";

const MetadataFilter = ({ geoJsonData, setFilteredData, selectedTime }) => {
  const [selectedTags, setSelectedTags] = useState([]);

  const availableTags = Array.from(
    new Set(
      geoJsonData.features
        .flatMap((feature) => feature.properties?.tags || [])
        .filter(Boolean)
    )
  );

  useEffect(() => {
    if (!geoJsonData || !geoJsonData.features) return;

    let filteredFeatures = geoJsonData.features;

    if (selectedTags.length > 0) {
      filteredFeatures = filteredFeatures.filter((feature) => {
        if (!feature.properties || !feature.properties.tags) return false;
        return selectedTags.every((tag) =>
          feature.properties.tags.includes(tag)
        );
      });
    }

    if (selectedTime) {
      const selectedTimeValue = new Date(selectedTime).getTime();
      filteredFeatures = filteredFeatures.filter((feature) => {
        const props = feature.properties || {};
        if (!props.timestamp) return true;
        const featureTime = new Date(props.timestamp).getTime();
        return featureTime <= selectedTimeValue;
      });
    }

    setFilteredData({ ...geoJsonData, features: filteredFeatures });
  }, [selectedTags, selectedTime, geoJsonData, setFilteredData]);

  const handleTagChange = (tag) => {
    setSelectedTags((prevTags) =>
      prevTags.includes(tag)
        ? prevTags.filter((t) => t !== tag)
        : [...prevTags, tag]
    );
  };

  return (
    <div className="filter-section">
      <h4>Filter by Tags</h4>
      {availableTags.length > 0 ? (
        <div className="tag-filters">
          {availableTags.map((tag) => (
            <div key={tag}>
              <input
                type="checkbox"
                id={`tag-${tag}`}
                className="tag-checkbox"
                checked={selectedTags.includes(tag)}
                onChange={() => handleTagChange(tag)}
              />
              <label htmlFor={`tag-${tag}`} className="tag-label">
                {tag}
              </label>
            </div>
          ))}
        </div>
      ) : (
        <p style={{ fontSize: "14px" }} className="no-tags">
          No tags available
        </p>
      )}
    </div>
  );
};

export default MetadataFilter;
