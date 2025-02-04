import { render, screen, fireEvent } from "@testing-library/react";
import TimeAnimationControls from "../Components/TimeAnimationControls";
import { describe, it, expect, vi } from "vitest";
import "@testing-library/jest-dom";
import { within } from "@testing-library/react";

const timeSteps = [
  "2024-02-01T12:00:00Z",
  "2024-02-02T12:00:00Z",
  "2024-02-03T12:00:00Z",
];

describe("TimeAnimationControls Component", () => {
  it("renders correctly with initial props", () => {
    render(
      <TimeAnimationControls
        timeSteps={timeSteps}
        currentIndex={0}
        setCurrentIndex={vi.fn()}
        isPlaying={false}
        setIsPlaying={vi.fn()}
      />
    );

    expect(screen.getByText("Time Animation")).toBeInTheDocument();
    expect(screen.getByText("Play")).toBeInTheDocument();
    expect(screen.getByText("Restart")).toBeInTheDocument();
    const progressText = screen.getByText(/Progress:/);
    expect(within(progressText).getByText("1")).toBeInTheDocument();
    expect(within(progressText).getByText("3")).toBeInTheDocument();
    expect(screen.getByText("Current Time:")).toBeInTheDocument();
  });

  it("toggles play/pause state when button is clicked", () => {
    const setIsPlayingMock = vi.fn();

    render(
      <TimeAnimationControls
        timeSteps={timeSteps}
        currentIndex={1}
        setCurrentIndex={vi.fn()}
        isPlaying={false}
        setIsPlaying={setIsPlayingMock}
      />
    );

    const playButton = screen.getByText("Play");
    fireEvent.click(playButton);

    expect(setIsPlayingMock).toHaveBeenCalledTimes(1);
  });

  it("resets progress when restart button is clicked", () => {
    const setCurrentIndexMock = vi.fn();
    const setIsPlayingMock = vi.fn();

    render(
      <TimeAnimationControls
        timeSteps={timeSteps}
        currentIndex={2}
        setCurrentIndex={setCurrentIndexMock}
        isPlaying={true}
        setIsPlaying={setIsPlayingMock}
      />
    );

    const restartButton = screen.getByText("Restart");
    fireEvent.click(restartButton);

    expect(setCurrentIndexMock).toHaveBeenCalledWith(0);
    expect(setIsPlayingMock).toHaveBeenCalledWith(false);
  });
});
