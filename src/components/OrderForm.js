import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, serverTimestamp } from 'firebase/firestore';
import { db } from '../services/firebase';

const OrderForm = () => {
  const [formData, setFormData] = useState({
    nombre: '',
    telefono: '',
    ubicacion: '',
    horaEntrega: '',
    maxiVasos: 0,
    bolsas: 0,
    codigoReferido: ''
  });
  const [inventory, setInventory] = useState({ maxiVasos: 0, bolsas: 0 });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

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
      } catch (error) {
        console.error('Error al cargar inventario:', error);
      }
    };

    fetchInventory();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Para campos de cantidad, asegurarse que sean números y no negativos
    if (name === 'maxiVasos' || name === 'bolsas') {
      const numValue = parseInt(value) || 0;
      if (numValue < 0) return;
      setFormData({ ...formData, [name]: numValue });
    }     else if (name === 'telefono') {
      // Solo permitir números, espacios y guiones durante la entrada
      const cleanValue = value.replace(/[^\d\s-]/g, '');
      setFormData({ ...formData, [name]: cleanValue });
      
      // Validar y mostrar error si es necesario
      const phoneValidation = validatePhoneNumber(cleanValue);
    }
    // Para código de referido, limitar a 5 caracteres alfanuméricos
    else if (name === 'codigoReferido') {
      const alphanumericValue = value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
      if (alphanumericValue.length <= 5) {
        setFormData({ ...formData, [name]: alphanumericValue });
      }
    } 
    else {
      setFormData({ ...formData, [name]: value });
    }
  };
  const validatePhoneNumber = (phone) => {
    // Eliminar espacios y guiones que podría haber ingresado el usuario
    const cleanPhone = phone.replace(/[\s-]/g, '');
    
    // Verificar que sean solo dígitos
    if (!/^\d+$/.test(cleanPhone)) {
      return "El teléfono debe contener solo números";
    }
    
    // Verificar que tenga 10 dígitos
    if (cleanPhone.length !== 10) {
      return "El teléfono debe tener 10 dígitos";
    }
    
    // Verificar prefijos válidos para Colombia
    const validPrefixes = ['3']; // Celulares colombianos comienzan con 3
    if (!validPrefixes.includes(cleanPhone.charAt(0))) {
      return "No es un número telefónico colombiano válido";
    }
    return "";
  };

  const validateForm = () => {
    if (!formData.nombre.trim()) return 'El nombre es requerido';
    const phoneValidation = validatePhoneNumber(formData.telefono);
    if (phoneValidation) return phoneValidation;
    
    if (!formData.ubicacion.trim()) return 'La ubicación es requerida';
    if (!formData.horaEntrega.trim()) return 'La hora de entrega es requerida';
    if (formData.maxiVasos === 0 && formData.bolsas === 0) return 'Debes seleccionar al menos un producto';
    if (formData.maxiVasos > inventory.maxiVasos) return 'No hay suficientes Maxi Vasos disponibles';
    if (formData.bolsas > inventory.bolsas) return 'No hay suficientes Bolsas disponibles';
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // Calcular precio total
      const total = (formData.maxiVasos * 10000) + (formData.bolsas * 5000);
      
      // Crear el pedido
      await addDoc(collection(db, 'orders'), {
        ...formData,
        estado: 'pendiente',
        fecha: serverTimestamp(),
        total
      });
      
      // Resetear formulario
      setFormData({
        nombre: '',
        telefono: '',
        ubicacion: '',
        horaEntrega: '',
        maxiVasos: 0,
        bolsas: 0,
        codigoReferido: ''
      });
      
      setSuccess(true);
      setTimeout(() => setSuccess(false), 5000);
    } catch (error) {
      console.error('Error al crear pedido:', error);
      setError('Hubo un error al crear el pedido. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md my-4">
      <h2 className="text-xl font-bold mb-4 text-red-700">Hacer un Pedido</h2>
      
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          ¡Pedido realizado con éxito! Nos pondremos en contacto contigo.
        </div>
      )}
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-700 mb-2">Nombre completo*</label>
            <input
              type="text"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-red-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-gray-700 mb-2">Teléfono*</label>
            <input
              type="tel"
              name="telefono"
              value={formData.telefono}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-red-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-gray-700 mb-2">Ubicación en la universidad*</label>
            <input
              type="text"
              name="ubicacion"
              value={formData.ubicacion}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="Ej: Biblioteca, Cafetería Central"
              required
            />
          </div>
          
          <div>
            <label className="block text-gray-700 mb-2">Hora de entrega*</label>
            <input
              type="time"
              name="horaEntrega"
              value={formData.horaEntrega}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-red-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-gray-700 mb-2">Maxi Vasos (10.000 COP c/u)</label>
            <div className="flex items-center">
              <button 
                type="button"
                onClick={() => setFormData({ 
                  ...formData, 
                  maxiVasos: Math.max(0, formData.maxiVasos - 1) 
                })}
                className="px-3 py-1 bg-red-500 text-white rounded-l"
              >-</button>
              <input
                type="number"
                name="maxiVasos"
                value={formData.maxiVasos}
                onChange={handleChange}
                min="0"
                max={inventory.maxiVasos}
                className="w-16 text-center px-2 py-1 border-t border-b focus:outline-none"
              />
              <button 
                type="button"
                onClick={() => {
                  if (formData.maxiVasos < inventory.maxiVasos) {
                    setFormData({ 
                      ...formData, 
                      maxiVasos: formData.maxiVasos + 1 
                    })
                  }
                }}
                className="px-3 py-1 bg-red-500 text-white rounded-r"
              >+</button>
              <span className="ml-2">Disponibles: {inventory.maxiVasos}</span>
            </div>
          </div>
          
          <div>
            <label className="block text-gray-700 mb-2">Bolsas (5.000 COP c/u)</label>
            <div className="flex items-center">
              <button 
                type="button"
                onClick={() => setFormData({ 
                  ...formData, 
                  bolsas: Math.max(0, formData.bolsas - 1) 
                })}
                className="px-3 py-1 bg-red-500 text-white rounded-l"
              >-</button>
              <input
                type="number"
                name="bolsas"
                value={formData.bolsas}
                onChange={handleChange}
                min="0"
                max={inventory.bolsas}
                className="w-16 text-center px-2 py-1 border-t border-b focus:outline-none"
              />
              <button 
                type="button"
                onClick={() => {
                  if (formData.bolsas < inventory.bolsas) {
                    setFormData({ 
                      ...formData, 
                      bolsas: formData.bolsas + 1 
                    })
                  }
                }}
                className="px-3 py-1 bg-red-500 text-white rounded-r"
              >+</button>
              <span className="ml-2">Disponibles: {inventory.bolsas}</span>
            </div>
          </div>
          
          <div>
            <label className="block text-gray-700 mb-2">Código de Referido (opcional)</label>
            <input
              type="text"
              name="codigoReferido"
              value={formData.codigoReferido}
              onChange={handleChange}
              maxLength={5}
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
          
          <div className="col-span-1 md:col-span-2">
            <div className="bg-gray-100 p-3 rounded mt-4">
              <h3 className="font-bold">Resumen del pedido:</h3>
              <p>Maxi Vasos: {formData.maxiVasos} x 10.000 = {formData.maxiVasos * 10000} COP</p>
              <p>Bolsas: {formData.bolsas} x 5.000 = {formData.bolsas * 5000} COP</p>
              <p className="font-bold mt-2">Total: {(formData.maxiVasos * 10000) + (formData.bolsas * 5000)} COP</p>
            </div>
          </div>
        </div>
        
        <div className="mt-6">
          <button
            type="submit"
            className="w-full bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700 transition duration-200"
            disabled={loading}
          >
            {loading ? 'Procesando...' : 'Realizar Pedido'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default OrderForm;