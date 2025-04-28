import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, serverTimestamp } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db } from '../services/firebase';
import ImmediateOrderForm from './ImmediateOrderForm';
import FutureOrderForm from './FutureOrderForm';
import InfoTooltip from './InfoTooltip';

const OrderForm = () => {
  const [formData, setFormData] = useState({
    nombre: '',
    telefono: '',
    ubicacion: '',
    horaEntrega: '',
    maxiVasos: 0,
    bolsas: 0,
    codigoReferido: '',
    tipoOrden: 'inmediato',
    fechaEntrega: '',
    comentarios: ''
  });
  const [inventory, setInventory] = useState({ maxiVasos: 0, bolsas: 0 });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [submittedOrder, setSubmittedOrder] = useState(null);

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

  const getMaxDate = () => {
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 7);
    return maxDate.toISOString().split('T')[0];
  };

  const getMinDate = () => {
    const minDate = new Date();
    minDate.setDate(minDate.getDate() + 1);
    return minDate.toISOString().split('T')[0];
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'maxiVasos' || name === 'bolsas') {
      const numValue = parseInt(value) || 0;
      if (numValue < 0) return;
      setFormData({ ...formData, [name]: numValue });
    } else if (name === 'telefono') {
      const cleanValue = value.replace(/[^\d\s-]/g, '');
      setFormData({ ...formData, [name]: cleanValue });
    } else if (name === 'codigoReferido') {
      const alphanumericValue = value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
      if (alphanumericValue.length <= 5) {
        setFormData({ ...formData, [name]: alphanumericValue });
      }
    } else if (name === 'tipoOrden') {
      if (value === 'inmediato') {
        setFormData({ 
          ...formData, 
          tipoOrden: value, 
          fechaEntrega: '',
          comentarios: ''
        });
      } else {
        setFormData({ 
          ...formData, 
          tipoOrden: value,
          ubicacion: '',
          horaEntrega: '',
          fechaEntrega: getMinDate()
        });
      }
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const validatePhoneNumber = (phone) => {
    const cleanPhone = phone.replace(/[\s-]/g, '');
    
    if (!/^\d+$/.test(cleanPhone)) {
      return "El teléfono debe contener solo números";
    }
    
    if (cleanPhone.length !== 10) {
      return "El teléfono debe tener 10 dígitos";
    }
    
    const validPrefixes = ['3'];
    if (!validPrefixes.includes(cleanPhone.charAt(0))) {
      return "No es un número telefónico colombiano válido";
    }
    return "";
  };

  const validateForm = () => {
    if (!formData.nombre.trim()) return 'El nombre es requerido';
    const phoneValidation = validatePhoneNumber(formData.telefono);
    if (phoneValidation) return phoneValidation;
    
    if (formData.tipoOrden === 'inmediato') {
      if (!formData.ubicacion.trim()) return 'La ubicación es requerida';
      if (!formData.horaEntrega.trim()) return 'La hora de entrega es requerida';
      if (formData.maxiVasos === 0 && formData.bolsas === 0) return 'Debes seleccionar al menos un producto';
      if (formData.maxiVasos > inventory.maxiVasos) return 'No hay suficientes Maxi Vasos disponibles';
      if (formData.bolsas > inventory.bolsas) return 'No hay suficientes Bolsas disponibles';
    } else {
      if (!formData.fechaEntrega) return 'La fecha de entrega es requerida';
      if (formData.maxiVasos === 0 && formData.bolsas === 0) return 'Debes seleccionar al menos un producto';
      
      const selectedDate = new Date(formData.fechaEntrega);
      const minDate = new Date(getMinDate());
      const maxDate = new Date(getMaxDate());
      
      if (selectedDate < minDate) return 'La fecha debe ser a partir de mañana';
      if (selectedDate > maxDate) return 'La fecha máxima de entrega es 7 días a partir de hoy';
    }
    
    return '';
  };

  const uploadImage = async () => {
    if (!imageFile) return null;
    
    setUploadingImage(true);
    
    try {
      const storage = getStorage();
      
      const today = new Date();
      const folderName = `${today.getDate()}-${today.getMonth() + 1}-${today.getFullYear()}`;
      
      const time = today.getHours().toString().padStart(2, '0') + 
                   today.getMinutes().toString().padStart(2, '0');
      const fileName = `${formData.nombre.replace(/\s+/g, '_')}_${formData.telefono}_${time}.${imageFile.name.split('.').pop()}`;
      
      const imageRef = ref(storage, `ubicaciones/${folderName}/${fileName}`);
      
      await uploadBytes(imageRef, imageFile);
      
      const imageUrl = await getDownloadURL(imageRef);
      
      return imageUrl;
    } catch (error) {
      console.error('Error al subir imagen:', error);
      setError('Hubo un problema al subir la imagen. Inténtalo de nuevo.');
      return null;
    } finally {
      setUploadingImage(false);
    }
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
      let imageUrl = null;
      if (imageFile) {
        imageUrl = await uploadImage();
      }
      
      const total = (formData.maxiVasos * 10000) + (formData.bolsas * 5000);
      
      await addDoc(collection(db, 'orders'), {
        ...formData,
        imagenUrl: imageUrl,
        estado: formData.tipoOrden === 'inmediato' ? 'pendiente' : 'encargo',
        fecha: serverTimestamp(),
        total
      });
      
      setSubmittedOrder({
        ...formData,
        total
      });
      
      setFormData({
        nombre: '',
        telefono: '',
        ubicacion: '',
        horaEntrega: '',
        maxiVasos: 0,
        bolsas: 0,
        codigoReferido: '',
        tipoOrden: 'inmediato',
        fechaEntrega: '',
        comentarios: ''
      });
      setImageFile(null);
      setImagePreview(null);
      
      setSuccess(true);
    } catch (error) {
      console.error('Error al crear pedido:', error);
      setError('Hubo un error al crear el pedido. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  // Common handler for image operations
  const handleImageOperations = {
    handleImageSelection: (e) => {
      const file = e.target.files[0];
      if (file) {
        setImageFile(file);
        
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreview(reader.result);
        };
        reader.readAsDataURL(file);
      }
    },
    clearImage: () => {
      setImageFile(null);
      setImagePreview(null);
    }
  };

  // Handler for product quantity
  const handleProductQuantity = {
    increment: (product) => {
      if (formData.tipoOrden === 'inmediato' && formData[product] < inventory[product]) {
        setFormData({ ...formData, [product]: formData[product] + 1 });
      } else if (formData.tipoOrden === 'futuro') {
        setFormData({ ...formData, [product]: formData[product] + 1 });
      }
    },
    decrement: (product) => {
      setFormData({ ...formData, [product]: Math.max(0, formData[product] - 1) });
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md my-4">
      <h2 className="text-xl font-bold mb-4 text-red-700">Hacer un Pedido</h2>
      
      {success && submittedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 mx-4 max-w-md w-full transform transition-all animate-fadeIn">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                <svg className="h-10 w-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">¡Pedido realizado con éxito!</h3>
              <div className="bg-gray-100 p-3 rounded mb-4">
                <h4 className="font-semibold text-gray-800 mb-2">Resumen de tu pedido:</h4>
                <p className="text-red-700 font-medium">{submittedOrder.tipoOrden === 'inmediato' ? 'Entrega inmediata' : 'Encargo para fecha futura'}</p>
                <div className="flex justify-between py-1">
                  <span>Maxi Vasos:</span>
                  <span className="font-medium">{submittedOrder.maxiVasos}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span>Bolsas:</span>
                  <span className="font-medium">{submittedOrder.bolsas}</span>
                </div>
                <div className="border-t border-gray-300 mt-2 pt-2 flex justify-between font-bold">
                  <span>Total:</span>
                  <span>{submittedOrder.total} COP</span>
                </div>
              </div>
              <p className="text-gray-700 mb-4">Nos pondremos en contacto contigo al número <span className="font-semibold">{submittedOrder.telefono}</span> para confirmar tu pedido.</p>
              <button
                type="button"
                onClick={() => setSuccess(false)}
                className="inline-flex justify-center w-full px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-red-500"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-6">
          <label className="block text-gray-700 mb-2 font-semibold">Tipo de pedido</label>
          <div className="flex">
            <label className="inline-flex items-center mr-4">
              <input
                type="radio"
                name="tipoOrden"
                value="inmediato"
                checked={formData.tipoOrden === 'inmediato'}
                onChange={handleChange}
                className="mr-2"
              />
              <span className="text-gray-700">Pedido inmediato {inventory.maxiVasos > 0 || inventory.bolsas > 0 ? '(Stock disponible)' : ''}</span>
            </label>
            <label className="inline-flex items-center">
              <input
                type="radio"
                name="tipoOrden"
                value="futuro"
                checked={formData.tipoOrden === 'futuro'}
                onChange={handleChange}
                className="mr-2"
              />
              <span className="text-gray-700">Encargo para otro día</span>
            </label>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-700 mb-2">
              Nombre completo*
              <InfoTooltip text="Ingresa tu nombre completo para que podamos identificarte al entregar el pedido" />
            </label>
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
            <label className="block text-gray-700 mb-2">
              Teléfono*
              <InfoTooltip text="Número de celular donde podamos contactarte respecto a tu pedido. Debe ser un número colombiano válido" />
            </label>
            <input
              type="tel"
              name="telefono"
              value={formData.telefono}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-red-500"
              required
            />
          </div>
          
          {formData.tipoOrden === 'inmediato' ? (
            <ImmediateOrderForm 
              formData={formData}
              handleChange={handleChange}
              imagePreview={imagePreview}
              handleImageOperations={handleImageOperations}
            />
          ) : (
            <FutureOrderForm 
              formData={formData}
              handleChange={handleChange}
              getMinDate={getMinDate}
              getMaxDate={getMaxDate}
            />
          )}
          
          <div>
            <label className="block text-gray-700 mb-2">
              Maxi Vasos (10.000 COP c/u)
              <InfoTooltip text="Nuestro producto premium. Cada Maxi Vaso contiene una porción generosa de gomitas con chile" />
            </label>
            <div className="flex items-center">
              <button 
                type="button"
                onClick={() => handleProductQuantity.decrement('maxiVasos')}
                className="px-3 py-1 bg-red-500 text-white rounded-l"
              >-</button>
              <input
                type="number"
                name="maxiVasos"
                value={formData.maxiVasos}
                onChange={handleChange}
                min="0"
                max={formData.tipoOrden === 'inmediato' ? inventory.maxiVasos : undefined}
                className="w-16 text-center px-2 py-1 border-t border-b focus:outline-none"
              />
              <button 
                type="button"
                onClick={() => handleProductQuantity.increment('maxiVasos')}
                className="px-3 py-1 bg-red-500 text-white rounded-r"
              >+</button>
              {formData.tipoOrden === 'inmediato' && (
                <span className="ml-2">Disponibles: {inventory.maxiVasos}</span>
              )}
            </div>
          </div>
          
          <div>
            <label className="block text-gray-700 mb-2">
              Bolsas (5.000 COP c/u)
              <InfoTooltip text="Bolsa individual de gomitas con chile, tamaño personal" />
            </label>
            <div className="flex items-center">
              <button 
                type="button"
                onClick={() => handleProductQuantity.decrement('bolsas')}
                className="px-3 py-1 bg-red-500 text-white rounded-l"
              >-</button>
              <input
                type="number"
                name="bolsas"
                value={formData.bolsas}
                onChange={handleChange}
                min="0"
                max={formData.tipoOrden === 'inmediato' ? inventory.bolsas : undefined}
                className="w-16 text-center px-2 py-1 border-t border-b focus:outline-none"
              />
              <button 
                type="button"
                onClick={() => handleProductQuantity.increment('bolsas')}
                className="px-3 py-1 bg-red-500 text-white rounded-r"
              >+</button>
              {formData.tipoOrden === 'inmediato' && (
                <span className="ml-2">Disponibles: {inventory.bolsas}</span>
              )}
            </div>
          </div>
          
          <div>
            <label className="block text-gray-700 mb-2">
              Código de Referido (opcional)
              <InfoTooltip text="Si alguien te recomendó nuestro servicio, ingresa su código aquí para que ambos obtengan beneficios" />
            </label>
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
              <p className="font-bold text-red-700 mb-2">
                {formData.tipoOrden === 'inmediato' ? 'Entrega inmediata' : 'Encargo para: ' + formData.fechaEntrega}
              </p>
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
            {loading ? 'Procesando...' : formData.tipoOrden === 'inmediato' ? 'Realizar Pedido' : 'Realizar Encargo'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default OrderForm;