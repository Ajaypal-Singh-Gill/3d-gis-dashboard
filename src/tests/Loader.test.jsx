import { render } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import Loader from "../Components/Loader";

describe("Loader Component", () => {
  it("renders without crashing", () => {
    const { container } = render(<Loader />);
    expect(container.firstChild).toBeDefined();
  });

  it("applies default styles", () => {
    const { container } = render(<Loader />);
    const loader = container.firstChild;
    const styles = getComputedStyle(loader);
    expect(styles.height).toBe("24px");
    expect(styles.width).toBe("100%");
    expect(styles.borderRadius).toBe("4px");
  });

  it("applies custom height, width, and borderRadius", () => {
    const { container } = render(
      <Loader height="50px" width="200px" borderRadius="8px" />
    );
    const loader = container.firstChild;
    const styles = getComputedStyle(loader);
    expect(styles.height).toBe("50px");
    expect(styles.width).toBe("200px");
    expect(styles.borderRadius).toBe("8px");
  });

  it("has shimmer animation", () => {
    const { container } = render(<Loader />);
    const loader = container.firstChild;
    const styles = getComputedStyle(loader);
    expect(styles.animation.includes("shimmer")).toBe(true);
  });
});
