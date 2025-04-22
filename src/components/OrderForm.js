import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, serverTimestamp } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db } from '../services/firebase';

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
      const phoneValidation = validatePhoneNumber(cleanValue);
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

  const handleImageSelection = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
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
          
          {formData.tipoOrden === 'inmediato' ? (
            <>
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
                
                <div className="mt-2">
                  <label className="block text-gray-700 mb-2">
                    <span>Agregar imagen de ubicación </span>
                    <span className="text-xs text-gray-500">(opcional)</span>
                  </label>
                  
                  <div className="flex flex-wrap gap-2">
                    <label className="inline-flex items-center px-3 py-2 bg-red-600 text-white rounded cursor-pointer hover:bg-red-700 text-sm">
                      <span className="mr-1">📁</span>
                      <span>Subir foto</span>
                      <input 
                        type="file"
                        accept="image/*"
                        onChange={handleImageSelection}
                        className="hidden"
                      />
                    </label>
                    
                    <label className="inline-flex items-center px-3 py-2 bg-blue-600 text-white rounded cursor-pointer hover:bg-blue-700 text-sm">
                      <span className="mr-1">📱</span>
                      <span>Tomar foto</span>
                      <input 
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handleImageSelection}
                        className="hidden"
                      />
                    </label>
                  </div>
                  
                  {imagePreview && (
                    <div className="mt-2 relative">
                      <img 
                        src={imagePreview} 
                        alt="Vista previa" 
                        className="h-32 w-auto object-cover rounded border"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setImageFile(null);
                          setImagePreview(null);
                        }}
                        className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>
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
            </>
          ) : (
            <>
              <div>
                <label className="block text-gray-700 mb-2">Fecha de entrega*</label>
                <input
                  type="date"
                  name="fechaEntrega"
                  value={formData.fechaEntrega}
                  onChange={handleChange}
                  min={getMinDate()}
                  max={getMaxDate()}
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-red-500"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Puedes hacer encargos con hasta 7 días de anticipación</p>
              </div>
              
              <div>
                <label className="block text-gray-700 mb-2">Comentarios adicionales</label>
                <textarea
                  name="comentarios"
                  value={formData.comentarios}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="Especifica cualquier detalle adicional para tu encargo"
                  rows="3"
                ></textarea>
              </div>
            </>
          )}
          
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
                max={formData.tipoOrden === 'inmediato' ? inventory.maxiVasos : undefined}
                className="w-16 text-center px-2 py-1 border-t border-b focus:outline-none"
              />
              <button 
                type="button"
                onClick={() => {
                  if (formData.tipoOrden === 'inmediato' && formData.maxiVasos < inventory.maxiVasos) {
                    setFormData({ 
                      ...formData, 
                      maxiVasos: formData.maxiVasos + 1 
                    })
                  } else if (formData.tipoOrden === 'futuro') {
                    setFormData({ 
                      ...formData, 
                      maxiVasos: formData.maxiVasos + 1 
                    })
                  }
                }}
                className="px-3 py-1 bg-red-500 text-white rounded-r"
              >+</button>
              {formData.tipoOrden === 'inmediato' && (
                <span className="ml-2">Disponibles: {inventory.maxiVasos}</span>
              )}
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
                max={formData.tipoOrden === 'inmediato' ? inventory.bolsas : undefined}
                className="w-16 text-center px-2 py-1 border-t border-b focus:outline-none"
              />
              <button 
                type="button"
                onClick={() => {
                  if (formData.tipoOrden === 'inmediato' && formData.bolsas < inventory.bolsas) {
                    setFormData({ 
                      ...formData, 
                      bolsas: formData.bolsas + 1 
                    })
                  } else if (formData.tipoOrden === 'futuro') {
                    setFormData({ 
                      ...formData, 
                      bolsas: formData.bolsas + 1 
                    })
                  }
                }}
                className="px-3 py-1 bg-red-500 text-white rounded-r"
              >+</button>
              {formData.tipoOrden === 'inmediato' && (
                <span className="ml-2">Disponibles: {inventory.bolsas}</span>
              )}
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