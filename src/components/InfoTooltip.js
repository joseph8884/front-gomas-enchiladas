import React, { useState, useRef, useEffect } from 'react';

const InfoTooltip = ({ text }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ left: 0, top: 0 });
  const [tooltipPosition, setTooltipPosition] = useState('right');
  const buttonRef = useRef(null);
  const tooltipRef = useRef(null);

  useEffect(() => {
    if (isVisible && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const windowWidth = window.innerWidth;
      
      // Default position (to the right)
      let tooltipLeft = rect.right + 10;
      let positionStyle = 'right';
      
      // Check if tooltip would go off-screen (allowing for tooltip width + some margin)
      const tooltipWidth = 260; // Approximating the tooltip width (256px + some margin)
      
      if (tooltipLeft + tooltipWidth > windowWidth) {
        // Not enough space on right, position to the left of the button
        tooltipLeft = rect.left - tooltipWidth - 10;
        positionStyle = 'left';
      }
      
      setTooltipPosition(positionStyle);
      setPosition({
        left: tooltipLeft,
        top: rect.top + (rect.height / 2) // Vertically centered
      });
    }
  }, [isVisible]);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        className="text-blue-500 text-sm font-bold rounded-full w-5 h-5 inline-flex items-center justify-center bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-300 ml-1"
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onClick={() => setIsVisible(!isVisible)}
        aria-label="Más información"
      >
        i
      </button>
      {isVisible && (
        <div 
          ref={tooltipRef}
          className="fixed z-[9999] bg-white border border-gray-200 rounded shadow-lg p-2 text-sm text-gray-700 w-64"
          style={{
            left: `${position.left}px`,
            top: `${position.top}px`,
            transform: 'translateY(-50%)'
          }}
        >
          {text}
        </div>
      )}
    </>
  );
};

export default InfoTooltip;