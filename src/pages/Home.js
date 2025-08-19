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
        {/* Alert de ausencia */}
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 mx-4 mt-4 rounded-lg shadow-md">
        <div className="flex items-center justify-center">
          <div className="text-center">
            <h3 className="font-bold text-lg mb-1">⚠️ Aviso Importante</h3>
            <p className="text-sm">
              Estaremos ausentes del <strong>19 al 23 de agosto</strong> por motivos personales.
              <br />
              Los pedidos se reanudarán el 25 de agosto. ¡Gracias por su comprensión!
            </p>
          </div>
        </div>
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