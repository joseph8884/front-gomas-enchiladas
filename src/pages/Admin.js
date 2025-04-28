import React from 'react';
import AdminInventoryManager from '../components/AdminInventoryManager';
import OrderList from '../components/OrderList';

const Admin = () => {
  return (
    <div className="container mx-auto px-4 py-8 md:pl-64">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-red-700">Panel de Administración</h1>
        <p className="text-lg text-gray-600">Gestiona el inventario y los pedidos</p>
      </div>
      
      <AdminInventoryManager />
      <OrderList isAdmin={true} />
    </div>
  );
};

export default Admin;