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
          <div className="absolute inset-0 bg-opacity-30"></div>
          <div className="relative container mx-auto px-4 py-16 text-white">
          </div>
        </div>
      </div>

      {/* Products section */}
      <div className="container mx-auto px-4 py-8">
        <h2 className="text-3xl font-bold text-center text-red-800 my-8 uppercase">Nuestros Productos</h2>
        <p className="text-center text-black-600 mb-10 text-lg">¡Recuerda! Preparo diariamente tus vasitos y bolsitas, por eso la disponibilidad varía. El pago es contra entrega.</p>
        

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