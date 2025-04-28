import React from 'react';
import Login from '../components/Login';

const LoginPage = () => {
  return (
    <div className="container mx-auto px-4 py-8 md:pl-64">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-red-700">Gomas Enchiladas</h1>
        <p className="text-lg text-gray-600">Acceso de administrador</p>
      </div>
      
      <Login />
    </div>
  );
};

export default LoginPage;