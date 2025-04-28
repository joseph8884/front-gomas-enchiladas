import React from 'react';
import { FaPhone, FaWhatsapp } from 'react-icons/fa';

const Footer = () => {
  return (
    <>
      {/* Mobile Footer (bottom of page) */}
      <div className="bg-red-700 text-white w-full md:hidden">
        <div className="p-4 flex flex-col">
          {/* Logo Section */}
          <div className="flex flex-col items-center mb-6 pt-4">
            <img src="/Logo gomitas enchiladas.png" alt="Sweet J&E Logo" className="h-16 mb-3" />
            <h3 className="text-lg font-bold mb-2">SWEET J&E</h3>
            <p className="font-light">Gomitas Enchiladas</p>
          </div>
          
          {/* Contact Section */}
          <div className="mb-4">
            <h4 className="text-lg font-bold mb-3 text-center">Contáctanos</h4>
            <div className="flex items-center justify-center mb-2">
              <FaPhone className="mr-2" />
              <a href="tel:3135681595" className="hover:underline">312 5098505</a>
            </div>
            <div className="flex items-center justify-center">
              <FaWhatsapp className="mr-2" />
              <a href="https://wa.me/573502521463" className="hover:underline">305 2951490</a>
            </div>
          </div>
          
          <div className="border-t border-red-600 mt-4 pt-4 text-center text-sm">
            <p>© {new Date().getFullYear()} Gomas Enchiladas.</p>
          </div>
        </div>
      </div>

      {/* Desktop Sidebar (fixed right) */}
      <div className="hidden md:block fixed left-0 top-0 bottom-0 bg-red-700 text-white w-64 overflow-y-auto shadow-lg z-10">
        <div className="p-4 flex flex-col h-full">
          {/* Logo Section */}
          <div className="flex flex-col items-center mb-6 pt-4">
            <img src="/Logo gomitas enchiladas.png" alt="Sweet J&E Logo" className="h-50 mb-3" />
          </div>
          
          {/* Contact Section */}
          <div className="mt-auto">
            <h4 className="text-lg font-bold mb-3">Contáctanos</h4>
            <div className="flex items-center mb-2">
              <FaPhone className="mr-2" />
              <a href="tel:3135681595" className="hover:underline">312 5098505</a>
            </div>
            <div className="flex items-center">
              <FaWhatsapp className="mr-2" />
              <a href="https://wa.me/573502521463" className="hover:underline">305 295140</a>
            </div>
          </div>
          
          <div className="border-t border-red-600 mt-4 pt-4 text-center text-sm">
            <p>© {new Date().getFullYear()} Gomas Enchiladas.</p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Footer;