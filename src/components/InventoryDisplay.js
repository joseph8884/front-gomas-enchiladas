import React, { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';

const InventoryDisplay = () => {
  const [inventory, setInventory] = useState({
    maxiVasos: "no",
    bolsas: "no",
  });
  const [loading, setLoading] = useState(true);
  const [networkError, setNetworkError] = useState(false);

  const fetchInventory = async () => {
    setLoading(true);
    setNetworkError(false);
    
    // Crear un timeout para detectar problemas de conexión
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Tiempo de espera agotado')), 10000)
    );
    
    try {
      // Comprobar conectividad primero
      if (!navigator.onLine) {
        throw new Error('No hay conexión a Internet');
      }
      
      const inventoryRef = collection(db, 'inventory');
      
      // Usar Promise.race para implementar un timeout
      const inventorySnapshot = await Promise.race([
        getDocs(inventoryRef),
        timeoutPromise
      ]);

      if (!inventorySnapshot.empty) {
        const inventoryData = inventorySnapshot.docs[0].data();
        setInventory({
          maxiVasos: inventoryData.maxiVasos || 0,
          bolsas: inventoryData.bolsas || 0
        });
      }
      setLoading(false);
    } catch (error) {
      console.error('Error al cargar inventario:', error);
      setNetworkError(true);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
    
  }, [networkError]);

  if (loading) {
    return <div className="text-center py-4">Cargando inventario...</div>;
  }

  if (networkError) {
    return (
      <div className="p-4 rounded-lg shadow-md my-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p className="font-bold">Error de conexión</p>
          <p>No se pudo conectar con el servidor. Por favor verifica tu conexión a internet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 rounded-lg shadow-md my-4">
      <h2 className="text-xl font-bold mb-4 text-red-700 text-center">Inventario Disponible Hoy</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Tarjeta Maxi Vaso */}
        <div className="bg-white rounded-lg overflow-hidden shadow-lg transform transition duration-300 hover:scale-105">
          <div className="h-64 bg-cover bg-center" style={{ backgroundImage: "url('/vaso.jpg')" }}></div>
          <div className="p-6 bg-red-700">
            <h3 className="text-xl font-semibold text-white">Maxi Vaso 150g</h3>
            <p className="text-white mt-1">Aproximadamente 20 gomitas</p>
            <div className="flex justify-between items-center mt-3">
              <p className="text-white font-bold text-xl">COP $10,000</p>
              <div className="bg-white text-red-700 font-bold px-3 py-1 rounded-full">
                {inventory.maxiVasos} disponibles
              </div>
            </div>
          </div>
        </div>

        {/* Tarjeta Bolsa */}
        <div className="bg-white rounded-lg overflow-hidden shadow-lg transform transition duration-300 hover:scale-105">
          <div className="h-64 bg-cover bg-center" style={{ backgroundImage: "url('/bolsa.jpg')" }}></div>
          <div className="p-6 bg-red-700">
            <h3 className="text-xl font-semibold text-white">Bolsa 50g</h3>
            <p className="text-white mt-1">Aproximadamente 8 gomitas</p>
            <div className="flex justify-between items-center mt-3">
              <p className="text-white font-bold text-xl">COP $5,000</p>
              <div className="bg-white text-red-700 font-bold px-3 py-1 rounded-full">
                {inventory.bolsas} disponibles
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InventoryDisplay;