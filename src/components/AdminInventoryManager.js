import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, setDoc, addDoc } from 'firebase/firestore';
import { db } from '../services/firebase';

const AdminInventoryManager = () => {
  const [inventory, setInventory] = useState({
    maxiVasos: 0,
    bolsas: 0
  });
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [inventoryDocId, setInventoryDocId] = useState(null);

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const inventoryRef = collection(db, 'inventory');
      const inventorySnapshot = await getDocs(inventoryRef);
      
      if (!inventorySnapshot.empty) {
        const inventoryDoc = inventorySnapshot.docs[0];
        setInventoryDocId(inventoryDoc.id);
        setInventory({
          maxiVasos: inventoryDoc.data().maxiVasos || 0,
          bolsas: inventoryDoc.data().bolsas || 0
        });
      }
    } catch (error) {
      console.error('Error al cargar inventario:', error);
      setMessage({
        text: 'Error al cargar el inventario',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const numValue = parseInt(value) || 0;
    if (numValue < 0) return;
    
    setInventory({
      ...inventory,
      [name]: numValue
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUpdating(true);
    
    try {
      if (inventoryDocId) {
        // Actualizar documento existente
        await setDoc(doc(db, 'inventory', inventoryDocId), inventory);
      } else {
        // Crear nuevo documento
        const docRef = await addDoc(collection(db, 'inventory'), inventory);
        setInventoryDocId(docRef.id);
      }
      
      setMessage({
        text: 'Inventario actualizado con éxito',
        type: 'success'
      });
      
      setTimeout(() => {
        setMessage({ text: '', type: '' });
      }, 3000);
    } catch (error) {
      console.error('Error al actualizar inventario:', error);
      setMessage({
        text: 'Error al actualizar el inventario',
        type: 'error'
      });
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return <div className="text-center py-4">Cargando inventario...</div>;
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md my-4">
      <h2 className="text-xl font-bold mb-4 text-red-700">Administrar Inventario</h2>
      
      {message.text && (
        <div className={`${
          message.type === 'success' ? 'bg-green-100 border-green-400 text-green-700' : 
          'bg-red-100 border-red-400 text-red-700'
        } px-4 py-3 rounded mb-4 border`}>
          {message.text}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-gray-700 mb-2 font-semibold">
              Maxi Vasos Disponibles
            </label>
            <input
              type="number"
              name="maxiVasos"
              value={inventory.maxiVasos}
              onChange={handleChange}
              min="0"
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
          
          <div>
            <label className="block text-gray-700 mb-2 font-semibold">
              Bolsas Disponibles
            </label>
            <input
              type="number"
              name="bolsas"
              value={inventory.bolsas}
              onChange={handleChange}
              min="0"
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
        </div>
        
        <div className="mt-6">
          <button
            type="submit"
            className="w-full bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700 transition duration-200"
            disabled={updating}
          >
            {updating ? 'Actualizando...' : 'Actualizar Inventario'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminInventoryManager;