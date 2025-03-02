import { useState, useEffect } from "react";
import "./PalRotatingImage.css"; // Import CSS

function PalRotatingImage({ front, back }) {
  const [showFront, setShowFront] = useState(true);
  const [frontSrc, setFrontSrc] = useState(null);
  const [backSrc, setBackSrc] = useState(null);

  // Convert blob to object URL if needed
  const convertToObjectURL = (blob) => {
    if (blob instanceof Blob) {
      return URL.createObjectURL(blob); // Convert Blob to URL
    }
    return blob; // Fallback if it's already a URL or base64 string
  };

  useEffect(() => {
    // Check if front and back are promises (i.e., asynchronously fetched images)
    if (front instanceof Promise) {
      front.then((resolvedFront) => setFrontSrc(convertToObjectURL(resolvedFront)));
    } else {
      setFrontSrc(convertToObjectURL(front));
    }

    if (back instanceof Promise) {
      back.then((resolvedBack) => setBackSrc(convertToObjectURL(resolvedBack)));
    } else {
      setBackSrc(convertToObjectURL(back));
    }

    const interval = setInterval(() => {
      setShowFront((prev) => !prev); // Toggle visibility
    }, 3000); // Change every 3 seconds

    return () => {
      clearInterval(interval); // Cleanup on unmount
      if (frontSrc && frontSrc.startsWith("blob:")) {
        URL.revokeObjectURL(frontSrc); // Release the object URL when done
      }
      if (backSrc && backSrc.startsWith("blob:")) {
        URL.revokeObjectURL(backSrc); // Release the object URL when done
      }
    };
  }, [front, back, frontSrc, backSrc]);

  return (
    <div className="sprite-container">
      <img
        src={frontSrc}
        alt="Front Sprite"
        className={`sprite ${showFront ? "visible" : "hidden"}`}
      />
      <img
        src={backSrc}
        alt="Back Sprite"
        className={`sprite ${showFront ? "hidden" : "visible"}`}
      />
    </div>
  );
}

export default PalRotatingImage