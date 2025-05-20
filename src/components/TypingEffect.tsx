import React, { useState, useEffect } from "react";

interface TypingEffectProps {
  text: string;
  speed?: number;
}

const TypingEffect: React.FC<TypingEffectProps> = ({ text, speed = 500 }) => {
  const [displayedText, setDisplayedText] = useState("");

  useEffect(() => {
    let index = 0;

    const interval = setInterval(() => {
      setDisplayedText(text.slice(0, index + 1)); // Directly slice text up to the current index
      index++;
      if (index === text.length) clearInterval(interval); // Clear interval once full text is displayed
    }, speed);

    return () => clearInterval(interval); // Cleanup interval on component unmount
  }, [text, speed]);

  return <span>{displayedText}</span>;
};

export default TypingEffect;
