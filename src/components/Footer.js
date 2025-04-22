import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-gray-800 text-white p-4 mt-auto">
      <div className="container mx-auto text-center">
        <p>© {new Date().getFullYear()} Gomas Enchiladas. Todos los derechos reservados.</p>
      </div>
    </footer>
  );
};

export default Footer;