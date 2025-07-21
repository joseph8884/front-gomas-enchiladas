import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, serverTimestamp } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db } from '../services/firebase';
import ImmediateOrderForm from './ImmediateOrderForm';
import FutureOrderForm from './FutureOrderForm';
import InfoTooltip from './InfoTooltip';
import { verifyReferralCode, calculateReferralDiscount, updateReferrerData } from './verifyReferralCode';

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
  const [referrerData, setReferrerData] = useState(null);
  const [discount, setDiscount] = useState(0);

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
      if (alphanumericValue.length <= 6) {
        setFormData({ ...formData, [name]: alphanumericValue });

        // Clear error and referrer data when code changes
        if (referrerData && referrerData.NumReferido !== alphanumericValue) {
          setReferrerData(null);
          setDiscount(0);
        }
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

  const compressImage = (file) => {
    return new Promise((resolve, reject) => {
      // Create image object to load the file
      const img = new Image();
      img.src = URL.createObjectURL(file);

      img.onload = () => {
        // Create canvas for compression
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // Calculate dimensions (maintain aspect ratio but limit max size)
        const MAX_WIDTH = 1200;
        const MAX_HEIGHT = 1200;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        // Set canvas dimensions and draw image
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to blob with compression
        const quality = 0.7; // Adjust between 0-1 to balance size and quality
        canvas.toBlob((blob) => {
          if (blob) {
            // Add file name and type to blob for firebase upload
            blob.name = file.name;
            blob.lastModified = file.lastModified;
            resolve(blob);
          } else {
            reject(new Error('Canvas to Blob conversion failed'));
          }
        }, file.type, quality);
      };

      img.onerror = () => reject(new Error('Error loading image'));
    });
  };

  const uploadImage = async () => {
    if (!imageFile) return null;


    try {
      const storage = getStorage();

      const today = new Date();
      const folderName = `${today.getDate()}-${today.getMonth() + 1}-${today.getFullYear()}`;

      const time = today.getHours().toString().padStart(2, '0') +
        today.getMinutes().toString().padStart(2, '0');
      const fileName = `${formData.nombre.replace(/\s+/g, '_')}_${formData.telefono}_${time}.${imageFile.name.split('.').pop()}`;

      // Compress the image before uploading
      const compressedImage = await compressImage(imageFile);

      const imageRef = ref(storage, `ubicaciones/${folderName}/${fileName}`);

      // Upload the compressed image instead of the original
      await uploadBytes(imageRef, compressedImage);

      const imageUrl = await getDownloadURL(imageRef);

      return imageUrl;
    } catch (error) {
      console.error('Error al subir imagen:', error);
      setError('Hubo un problema al subir la imagen. Inténtalo de nuevo.');
      return null;
    }
  };

  const checkReferralCode = async () => {
    if (formData.codigoReferido && formData.codigoReferido.length === 6) {
      try {
        const referrer = await verifyReferralCode(formData.codigoReferido, formData.telefono);
        if (referrer) {
          if (referrer.selfReferral) {
            setReferrerData(null);
            setDiscount(0);
            setError('No puedes usar tu propio código de referido');
          } else {
            setReferrerData(referrer);
            const baseTotal = (formData.maxiVasos * 10000) + (formData.bolsas * 5000);
            setDiscount(calculateReferralDiscount(baseTotal));
            setError('');
          }
        } else {
          setReferrerData(null);
          setDiscount(0);
          setError('Código de referido inválido');
        }
      } catch (error) {
        console.error('Error al verificar código de referido:', error);
      }
    }
  };

  useEffect(() => {
    if (referrerData) {
      const baseTotal = (formData.maxiVasos * 10000) + (formData.bolsas * 5000);
      setDiscount(calculateReferralDiscount(baseTotal));
    }
  }, [formData.maxiVasos, formData.bolsas, referrerData]);
  // Add this function after your other imports
  const sendOrderConfirmationEmail = async (orderData) => {
    try {
      // Format date for display
      const orderDate = new Date().toLocaleDateString('es-CO');

      // Build HTML email content
      // Build HTML email content
      const emailHtml = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
  <div style="text-align: center; background-color: #d32f2f; color: white; padding: 10px; margin-bottom: 20px; border-radius: 5px;">
    <h1 style="margin: 0;">Sweet JyE - Nuevo Pedido</h1>
  </div>
  
  <div style="margin-bottom: 15px;">
    <h2 style="color: #d32f2f; margin-top: 0; border-bottom: 1px solid #d32f2f; padding-bottom: 5px;">
      Detalles del Cliente
    </h2>
    <table style="width: 100%; border-collapse: collapse;">
      <tr>
        <td style="padding: 8px 0; width: 40%; font-weight: bold;">Nombre:</td>
        <td style="padding: 8px 0;">${orderData.nombre}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; font-weight: bold;">Teléfono:</td>
        <td style="padding: 8px 0;">${orderData.telefono}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; font-weight: bold;">Fecha de pedido:</td>
        <td style="padding: 8px 0;">${orderDate}</td>
      </tr>
    </table>
  </div>
  
  <div style="margin-bottom: 15px;">
    <h2 style="color: #d32f2f; margin-top: 0; border-bottom: 1px solid #d32f2f; padding-bottom: 5px;">
      Información del Pedido
    </h2>
    <table style="width: 100%; border-collapse: collapse;">
      <tr>
        <td style="padding: 8px 0; width: 40%; font-weight: bold;">Tipo:</td>
        <td style="padding: 8px 0; color: #d32f2f; font-weight: bold;">
          ${orderData.tipoOrden === 'inmediato' ? '⚡ PEDIDO INMEDIATO' : '📅 ENCARGO FUTURO'}
        </td>
      </tr>
      ${orderData.tipoOrden === 'inmediato' ? `
      <tr>
        <td style="padding: 8px 0; font-weight: bold;">Ubicación:</td>
        <td style="padding: 8px 0;">${orderData.ubicacion}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; font-weight: bold;">Hora de entrega:</td>
        <td style="padding: 8px 0;">${orderData.horaEntrega}</td>
      </tr>` : `
      <tr>
        <td style="padding: 8px 0; font-weight: bold;">Fecha de entrega:</td>
        <td style="padding: 8px 0;">${orderData.fechaEntrega}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; font-weight: bold;">Comentarios:</td>
        <td style="padding: 8px 0;">${orderData.comentarios || 'Ninguno'}</td>
      </tr>`}
      ${orderData.codigoReferido ? `
      <tr>
        <td style="padding: 8px 0; font-weight: bold;">Código referido:</td>
        <td style="padding: 8px 0;">${orderData.codigoReferido}</td>
      </tr>` : ''}
    </table>
  </div>
  
  <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin-bottom: 15px;">
    <h2 style="color: #d32f2f; margin-top: 0; border-bottom: 1px solid #d32f2f; padding-bottom: 5px;">
      Productos Ordenados
    </h2>
    <table style="width: 100%; border-collapse: collapse;">
      <tr style="border-bottom: 1px solid #ddd;">
        <th style="text-align: left; padding: 8px 0;">Producto</th>
        <th style="text-align: center; padding: 8px 0;">Cantidad</th>
        <th style="text-align: right; padding: 8px 0;">Subtotal</th>
      </tr>
      ${orderData.maxiVasos > 0 ? `
      <tr style="border-bottom: 1px solid #eee;">
        <td style="padding: 8px 0;">Maxi Vasos</td>
        <td style="text-align: center; padding: 8px 0;">${orderData.maxiVasos}</td>
        <td style="text-align: right; padding: 8px 0;">${orderData.maxiVasos * 10000} COP</td>
      </tr>` : ''}
      ${orderData.bolsas > 0 ? `
      <tr style="border-bottom: 1px solid #eee;">
        <td style="padding: 8px 0;">Bolsas</td>
        <td style="text-align: center; padding: 8px 0;">${orderData.bolsas}</td>
        <td style="text-align: right; padding: 8px 0;">${orderData.bolsas * 5000} COP</td>
      </tr>` : ''}
      ${orderData.descuento > 0 ? `
      <tr style="border-bottom: 1px solid #eee; color: green;">
        <td style="padding: 8px 0;">Descuento referido</td>
        <td style="text-align: center; padding: 8px 0;">10%</td>
        <td style="text-align: right; padding: 8px 0;">-${orderData.descuento} COP</td>
      </tr>` : ''}
      <tr style="font-weight: bold; font-size: 16px;">
        <td style="padding: 12px 0;" colspan="2">TOTAL</td>
        <td style="text-align: right; padding: 12px 0;">${orderData.total} COP</td>
      </tr>
    </table>
  </div>
  
  <div style="text-align: center; margin-top: 20px; padding: 15px; background-color: #f5f5f5; border-radius: 5px;">
    <p style="margin: 0; font-size: 14px; color: #777;">Este es un mensaje automático enviado desde su sistema de pedidos.</p>
    <p style="margin: 5px 0 0; font-size: 14px; color: #777;">Sweet JyE © ${new Date().getFullYear()}</p>
  </div>
</div>
`;   // Add document to 'mail' collection to trigger email extension
      await addDoc(collection(db, 'mail'), {
        to: "josegzm08@gmail.com", // You'll need to collect email in your form
        message: {
          subject: `Nuevo pedido Pedido - Sweet JyE #${orderData.telefono.slice(-4)}`,
          html: emailHtml,
        }
      });

      console.log('Email de confirmación enviado con éxito');
      return true;
    } catch (error) {
      console.error('Error al enviar email de confirmación:', error);
      return false;
    }
  };
  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    // Verify referral code if provided but not yet verified
    if (formData.codigoReferido && !referrerData) {
      const referrer = await verifyReferralCode(formData.codigoReferido, formData.telefono);
      if (referrer) {
        if (referrer.selfReferral) {
          setError('No puedes usar tu propio código de referido');
          setLoading(false);
          return;
        }
        setReferrerData(referrer);
        const baseTotal = (formData.maxiVasos * 10000) + (formData.bolsas * 5000);
        setDiscount(calculateReferralDiscount(baseTotal));
      } else {
        setError('El código de referido no es válido');
        setLoading(false);
        return;
      }
    }

    setLoading(true);
    setError('');

    try {
      let imageUrl = null;
      if (imageFile) {
        imageUrl = await uploadImage();
      }

      // Calculate total with discount if applicable
      const baseTotal = (formData.maxiVasos * 10000) + (formData.bolsas * 5000);
      const finalTotal = referrerData ? baseTotal - discount : baseTotal;

      // Add the order document
      await addDoc(collection(db, 'orders'), {
        ...formData,
        imagenUrl: imageUrl,
        estado: formData.tipoOrden === 'inmediato' ? 'pendiente' : 'encargo',
        fecha: serverTimestamp(),
        total: finalTotal,
        descuento: discount > 0 ? discount : null,
        codigoReferidoValidado: referrerData ? true : false
      });

      await sendOrderConfirmationEmail({
        ...formData,
        total: finalTotal,
        descuento: discount
      });

      setSubmittedOrder({
        ...formData,
        total: finalTotal,
        descuento: discount
      });

      // Reset form and states
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
      setReferrerData(null);
      setDiscount(0);

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
                {submittedOrder.descuento > 0 && (
                  <div className="flex justify-between py-1 text-green-600">
                    <span>Descuento por referido:</span>
                    <span className="font-medium">-{submittedOrder.descuento} COP</span>
                  </div>
                )}
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
                className="px-4 py-1 bg-red-500 text-white rounded-l"
              >-</button>
              <input
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
                className="px-4 py-1 bg-red-500 text-white rounded-r"
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
                className="px-4 py-1 bg-red-500 text-white rounded-l"
              >-</button>
              <input
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
                className="px-4 py-1 bg-red-500 text-white rounded-r"
              >+</button>
              {formData.tipoOrden === 'inmediato' && (
                <span className="ml-2">Disponibles: {inventory.bolsas}</span>
              )}
            </div>
          </div>

          <div>
            <label className="block text-gray-700 mb-2">
              Código de Referido (opcional)
              <InfoTooltip text="Si alguien te recomendó nuestro servicio, ingresa su código aquí para obtener un 10% de descuento" />
            </label>
            <div className="relative">
              <input
                type="text"
                name="codigoReferido"
                value={formData.codigoReferido}
                onChange={handleChange}
                onBlur={checkReferralCode}
                maxLength={6}
                className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 ${referrerData ? 'border-green-500 focus:ring-green-500' : 'focus:ring-red-500'
                  }`}
              />
              {formData.codigoReferido.length === 6 && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  {referrerData ? (
                    <span className="text-green-600 flex items-center">
                      <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                      10% descuento
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={checkReferralCode}
                      className="text-blue-600 text-sm underline z-index-10"
                    >
                      Verificar
                    </button>
                  )}
                </div>
              )}
            </div>
            {referrerData && (
              <p className="text-sm text-green-600 mt-1">
                ¡Código válido! Descuento de 10% aplicado.
              </p>
            )}
          </div>

          <div className="col-span-1 md:col-span-2">
            <div className="bg-gray-100 p-3 rounded mt-4">
              <h3 className="font-bold">Resumen del pedido:</h3>
              <p className="font-bold text-red-700 mb-2">
                {formData.tipoOrden === 'inmediato' ? 'Entrega inmediata' : 'Encargo para: ' + formData.fechaEntrega}
              </p>
              <p>Maxi Vasos: {formData.maxiVasos} x 10.000 = {formData.maxiVasos * 10000} COP</p>
              <p>Bolsas: {formData.bolsas} x 5.000 = {formData.bolsas * 5000} COP</p>

              {referrerData && discount > 0 && (
                <p className="text-green-600">Descuento por código referido: -{discount} COP (10%)</p>
              )}

              <p className="font-bold mt-2">
                Total: {((formData.maxiVasos * 10000) + (formData.bolsas * 5000) - (referrerData ? discount : 0)).toLocaleString()} COP
              </p>
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