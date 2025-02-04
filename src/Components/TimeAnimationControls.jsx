import React from "react";
import { FaPlay, FaPause, FaRedo } from "react-icons/fa";
import "./GISViewer.css";

function TimeAnimationControls({
  timeSteps = [],
  currentIndex,
  setCurrentIndex,
  isPlaying,
  setIsPlaying,
}) {
  const playPause = () => {
    setIsPlaying((prev) => !prev);
  };

  const restart = () => {
    setCurrentIndex(0);
    setIsPlaying(false);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="time-controls">
      <h4>Time Animation</h4>
      <div className="time-controls-buttons">
        <button className="control-button" onClick={playPause}>
          {isPlaying ? (
            <>
              <FaPause /> Pause
            </>
          ) : (
            <>
              <FaPlay /> Play
            </>
          )}
        </button>
        <button className="control-button secondary" onClick={restart}>
          <FaRedo /> Restart
        </button>
      </div>
      <div className="time-info">
        <div>
          Progress: <span>{currentIndex + 1}</span> of{" "}
          <span>{timeSteps.length}</span>
        </div>
        {timeSteps[currentIndex] && (
          <div>
            Current Time: <span>{formatDate(timeSteps[currentIndex])}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default TimeAnimationControls;