import React, { useState, useRef, useEffect } from 'react';

const InfoTooltip = ({ text }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ left: 0, top: 0 });
  const [tooltipPosition, setTooltipPosition] = useState('right');
  const buttonRef = useRef(null);
  const tooltipRef = useRef(null);
  const positionCalculatedRef = useRef(false);

  const calculatePosition = () => {
    if (!isVisible || !buttonRef.current || !tooltipRef.current || positionCalculatedRef.current) {
      return;
    }

    const rect = buttonRef.current.getBoundingClientRect();
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    
    const tooltipWidth = tooltipRef.current.offsetWidth;
    const tooltipHeight = tooltipRef.current.offsetHeight;
    
    let tooltipLeft = 0;
    let tooltipTop = 0;
    let positionStyle = 'right';
    let transform = 'translateY(-50%)';

    // Establecemos un orden de prioridad claro: derecha > izquierda > abajo > arriba
    
    // Check right (primera prioridad)
    if (rect.right + tooltipWidth + 10 <= windowWidth) {
      tooltipLeft = rect.right + 10;
      tooltipTop = rect.top + (rect.height / 2);
      positionStyle = 'right';
      transform = 'translateY(-50%)';
    } 
    // Check left (segunda prioridad)
    else if (rect.left - tooltipWidth - 10 >= 0) {
      tooltipLeft = rect.left - tooltipWidth - 10;
      tooltipTop = rect.top + (rect.height / 2);
      positionStyle = 'left';
      transform = 'translateY(-50%)';
    }
    // Check bottom (tercera prioridad)
    else if (rect.bottom + tooltipHeight + 10 <= windowHeight) {
      tooltipLeft = rect.left + (rect.width / 2);
      tooltipTop = rect.bottom + 10;
      positionStyle = 'bottom';
      transform = 'translateX(-50%)';
    }
    // Default to top (última opción)
    else {
      tooltipLeft = rect.left + (rect.width / 2);
      tooltipTop = rect.top - tooltipHeight - 20;
      positionStyle = 'top';
      transform = 'translateX(-50%)';
    }
    
    setTooltipPosition(positionStyle);
    setPosition({
      left: tooltipLeft,
      top: tooltipTop,
      transform
    });
    
    // Marcamos que ya se ha calculado la posición
    positionCalculatedRef.current = true;
  };

  useEffect(() => {
    if (isVisible) {
      // Resetear el cálculo cuando el tooltip se hace visible
      positionCalculatedRef.current = false;
      
      // Calcular posición después de renderizado
      const timer = setTimeout(calculatePosition, 0);
      
      // Recalcular en resize de ventana
      const handleResize = () => {
        positionCalculatedRef.current = false;
        calculatePosition();
      };
      
      window.addEventListener('resize', handleResize);
      return () => {
        window.removeEventListener('resize', handleResize);
        clearTimeout(timer);
      };
    }
  }, [isVisible]);

  // Efecto para recalcular si las referencias cambian
  useEffect(() => {
    if (isVisible && tooltipRef.current && buttonRef.current) {
      calculatePosition();
    }
  }, [tooltipRef.current, buttonRef.current]);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        className="text-blue-500 text-sm font-bold rounded-full w-5 h-5 inline-flex items-center justify-center bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-300 ml-1"
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => {
          setIsVisible(false);
        }}
        onClick={() => {
          setIsVisible(!isVisible);
        }}
        aria-label="Más información"
      >
        i
      </button>
      {isVisible && (
        <div 
          ref={tooltipRef}
          className="fixed z-[9999] bg-white border border-gray-200 rounded shadow-lg p-2 text-sm text-gray-700 max-w-xs transition-opacity duration-150"
          style={{
            left: `${position.left}px`,
            top: `${position.top}px`,
            transform: position.transform,
            width: 'auto',
            maxWidth: 'min(256px, 90vw)',
            opacity: positionCalculatedRef.current ? 1 : 0, // Mostrar solo cuando la posición está calculada
          }}
        >
          {text}
        </div>
      )}
    </>
  );
};

export default InfoTooltip;