import React from "react";

const Loader = ({ height = "24px", width = "100%", borderRadius = "4px" }) => {
  const loaderStyle = {
    height,
    width,
    borderRadius,
    background: "linear-gradient(90deg, #e0e0e0 25%, #f5f5f5 50%, #e0e0e0 75%)",
    backgroundSize: "200% 100%",
    animation: "shimmer 1.5s infinite linear",
  };

  return (
    <>
      <div style={loaderStyle} />
      <style>
        {`
          @keyframes shimmer {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
          }
        `}
      </style>
    </>
  );
};

export default Loader;
