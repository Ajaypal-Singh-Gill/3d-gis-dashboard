import { vi } from "vitest";

class MockIcon {
  constructor(options) {
    this.options = options;
  }

  static Default = class {
    constructor(options) {
      this.options = options;
    }

    static mergeOptions() {
      return {}; // Mock mergeOptions behavior
    }
  };
}

const L = {
  Icon: MockIcon, // Ensure L.Icon is a class that can be instantiated
  marker: vi.fn(() => ({
    addTo: vi.fn(),
  })),
  polyline: vi.fn(() => ({
    addTo: vi.fn(),
  })),
  polygon: vi.fn(() => ({
    addTo: vi.fn(),
  })),
};

export default L;
