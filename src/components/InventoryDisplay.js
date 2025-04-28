import React, { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';

const InventoryDisplay = () => {
  const [inventory, setInventory] = useState({
    maxiVasos: 0,
    bolsas: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const inventoryRef = collection(db, 'inventory');
        const inventorySnapshot = await getDocs(inventoryRef);

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
        setLoading(false);
      }
    };

    fetchInventory();
  }, []);

  if (loading) {
    return <div className="text-center py-4">Cargando inventario...</div>;
  }

  return (
    <div className="p-4 rounded-lg shadow-md my-4">
      <h2 className="text-xl font-bold mb-4 text-red-700 text-center">Inventario Disponible Hoy</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Tarjeta Maxi Vaso */}
        <div className="bg-white rounded-lg overflow-hidden shadow-lg transform transition duration-300 hover:scale-105">
          <div className="h-64 bg-cover bg-center" style={{ backgroundImage: "url('/vaso.jpg')" }}></div>
          <div className="p-6 bg-red-700">
            <h3 className="text-xl font-semibold text-white">Maxi Vaso 20g</h3>
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
            <h3 className="text-xl font-semibold text-white">Bolsa 8g</h3>
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