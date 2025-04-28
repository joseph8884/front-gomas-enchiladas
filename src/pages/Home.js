import React from 'react';
import InventoryDisplay from '../components/InventoryDisplay';
import OrderForm from '../components/OrderForm';

const Home = () => {
  return (
    <div className="flex flex-col min-h-screen md:pl-64"> {/* Right padding for desktop only */}
      {/* Hero section with gummies background */}
      <div className="relative">
        <div 
          className="w-full h-64 bg-cover bg-center"
          style={{ backgroundImage: "url('/fondo gomas.png')" }}
        >
          <div className="absolute inset-0 bg-black bg-opacity-30"></div>
          <div className="relative container mx-auto px-4 py-16 text-white">
          </div>
        </div>
      </div>

      {/* Products section */}
      <div className="container mx-auto px-4 py-8">
        <h2 className="text-3xl font-bold text-center text-red-800 my-8 uppercase">Nuestros Productos</h2>
        <p className="text-center text-gray-600 mb-8">Nuestros Productos diariamente los surtimos y botamos, por eso nuestras gomas siempre son las frescas.</p>
        
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Maxi Vaso product */}
          <div className="bg-white rounded-lg overflow-hidden shadow-lg">
            <div className="h-64 bg-cover bg-center" style={{ backgroundImage: "url('/vaso.jpg')" }}></div>
            <div className="p-6 bg-red-700">
              <h3 className="text-xl font-semibold text-white">Maxi Vaso 20g - 20 gomitas aprox</h3>
              <p className="text-white font-bold mt-2">COP $10,000</p>
            </div>
          </div>

          {/* Bolsa product */}
          <div className="bg-white rounded-lg overflow-hidden shadow-lg">
            <div className="h-64 bg-cover bg-center" style={{ backgroundImage: "url('/bolsa.jpg')" }}></div>
            <div className="p-6 bg-red-700">
              <h3 className="text-xl font-semibold text-white">Bolsa 8g - 8 gomitas aprox</h3>
              <p className="text-white font-bold mt-2">COP $5,000</p>
            </div>
          </div>
        </div>

        {/* Inventory display */}
        <div className="mb-8">
          <InventoryDisplay />
        </div>
        
        {/* Order form */}
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold mb-4 text-red-700 text-center">Realiza tu pedido</h2>
          <OrderForm />
        </div>
      </div>
    </div>
  );
};

export default Home;