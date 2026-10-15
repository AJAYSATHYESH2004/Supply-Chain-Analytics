import React, { useState, useEffect } from 'react';

const TypewriterText = ({ text, className = "" }) => {
  const [displayedText, setDisplayedText] = useState('');

  useEffect(() => {
    let index = 0;
    setDisplayedText('');
    const timer = setInterval(() => {
      setDisplayedText(text.slice(0, index + 1));
      index++;
      if (index >= text.length) {
        clearInterval(timer);
      }
    }, 40); // 40ms per letter typing speed
    return () => clearInterval(timer);
  }, [text]);

  return <span className={className}>{displayedText}</span>;
};

export default TypewriterText;
