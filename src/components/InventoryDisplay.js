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
    <div className="bg-yellow-100 p-4 rounded-lg shadow-md my-4">
      <h2 className="text-xl font-bold mb-2 text-red-700">Inventario Disponible Hoy</h2>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-3 rounded shadow">
          <h3 className="font-semibold">Maxi Vasos</h3>
          <p className="text-lg">{inventory.maxiVasos} disponibles</p>
          <p className="text-sm text-gray-600">$10,000 - Aprox. 20 gomas</p>
        </div>
        <div className="bg-white p-3 rounded shadow">
          <h3 className="font-semibold">Bolsas</h3>
          <p className="text-lg">{inventory.bolsas} disponibles</p>
          <p className="text-sm text-gray-600">$5,000 - 8 gomas</p>
        </div>
      </div>
    </div>
  );
};

export default InventoryDisplay;