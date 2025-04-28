import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../routes/AuthContext';

const Header = () => {
  const { currentUser, logout } = useAuth();

  return (
    <header className="bg-red-700 text-white p-4 md:pl-64">
      <div className="container mx-auto flex justify-between items-center">
        <h1 className="text-2xl font-bold">Gomas Enchiladas</h1>
        <nav>
          <ul className="flex space-x-4">
            <li><Link to="/" className="hover:underline">Inicio</Link></li>
            <li><Link to="/pedidos" className="hover:underline">Mis Pedidos</Link></li>
            {currentUser ? (
              <>
                <li><Link to="/admin" className="hover:underline">Admin</Link></li>
                <li><button onClick={logout} className="hover:underline">Cerrar Sesión</button></li>
              </>
            ) : (
              <li><Link to="/login" className="hover:underline">Admin</Link></li>
            )}
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;