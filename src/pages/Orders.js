import React from 'react';
import OrderList from '../components/OrderList';

const Orders = () => {
  return (
    <div className="container mx-auto px-4 py-8 md:pl-64">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-red-700">Mis Pedidos</h1>
        <p className="text-lg text-gray-600">Consulta y gestiona tus pedidos</p>
      </div>
      
      <OrderList />
    </div>
  );
};

export default Orders;