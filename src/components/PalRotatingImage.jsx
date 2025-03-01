import { useState, useEffect } from "react";
import "./PalRotatingImage.css"; // Import CSS

function PalRotatingImage({
  front,
  back
}) {
  const [showFront, setShowFront] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setShowFront((prev) => !prev); // Toggle visibility
    }, 3000); // Change every 3 seconds

    return () => clearInterval(interval); // Cleanup on unmount
  }, []);

  return (
    <div className="sprite-container">
      <img
        src={front}
        alt="Front Sprite"
        className={`sprite ${showFront ? "visible" : "hidden"}`}
      />
      <img
        src={back}
        alt="Back Sprite"
        className={`sprite ${showFront ? "hidden" : "visible"}`}
      />
    </div>
  );
}

export default PalRotatingImage;
