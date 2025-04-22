import React from 'react';
import InventoryDisplay from '../components/InventoryDisplay';
import OrderForm from '../components/OrderForm';

const Home = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-red-700">Gomas Enchiladas</h1>
        <p className="text-lg text-gray-600">¡Las mejores gomas enchiladas de la universidad!</p>
      </div>
      
      <InventoryDisplay />
      <OrderForm />
    </div>
  );
};

export default Home;