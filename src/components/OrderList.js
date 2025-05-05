import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import InfoTooltip from './InfoTooltip'; // Add this import
import { verifyReferralCode, updateReferrerData } from './verifyReferralCode';
const OrderList = ({ phone, isAdmin = false }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchPhone, setSearchPhone] = useState(phone || '');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOrderId, setEditingOrderId] = useState(null);
  const [inventory, setInventory] = useState({ maxiVasos: 0, bolsas: 0 });
  const [inventoryDocId, setInventoryDocId] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  const fetchInventory = async () => {
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
    }
  };

  const fetchOrders = async () => {
    setLoading(true);
    setError('');

    try {
      let ordersQuery;

      if (isAdmin) {
        ordersQuery = collection(db, 'orders');
      } else {
        if (!searchPhone.trim()) {
          setError('Ingresa un número de teléfono para buscar tus pedidos');
          setLoading(false);
          return;
        }

        ordersQuery = query(
          collection(db, 'orders'),
          where('telefono', '==', searchPhone.trim())
        );
      }

      const ordersSnapshot = await getDocs(ordersQuery);

      const ordersData = ordersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        fecha: doc.data().fecha?.toDate() || new Date()
      }));

      ordersData.sort((a, b) => b.fecha - a.fecha);

      setOrders(ordersData);
    } catch (err) {
      console.error('Error al cargar pedidos:', err);
      setError('Error al cargar los pedidos. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (phone || isAdmin) {
      fetchOrders();
      fetchInventory();
    }
  }, [phone, isAdmin]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchOrders();
  };

  const handleDeleteOrder = async (orderId) => {
    if (!window.confirm('¿Estás seguro que quieres cancelar este pedido?')) {
      return;
    }

    try {
      const orderToDelete = orders.find(order => order.id === orderId);

      if (!orderToDelete) {
        throw new Error('Pedido no encontrado');
      }

      await deleteDoc(doc(db, 'orders', orderId));

      setSuccessMessage('Pedido cancelado con éxito');
      setTimeout(() => setSuccessMessage(''), 3000);

      setOrders(orders.filter(order => order.id !== orderId));
    } catch (err) {
      console.error('Error al cancelar pedido:', err);
      setError('Error al cancelar el pedido. Inténtalo de nuevo.');
      setTimeout(() => setError(''), 3000);
    }
  };

  const openStatusModal = (orderId) => {
    setEditingOrderId(orderId);
    setIsModalOpen(true);
  };

  const closeStatusModal = () => {
    setIsModalOpen(false);
    setEditingOrderId(null);
  };

  const handleUpdateStatus = async (newStatus) => {
    if (!editingOrderId) return;

    try {
      const orderToUpdate = orders.find(order => order.id === editingOrderId);

      if (!orderToUpdate) {
        throw new Error('Pedido no encontrado');
      }

      // Actualizar el estado del pedido
      await updateDoc(doc(db, 'orders', editingOrderId), {
        estado: newStatus
      });

      // Definir estados que afectan el inventario
      const afectaInventario = ['en_camino', 'entregado'];
      const noAfectaInventario = ['pendiente', 'cancelado', 'encargo'];

      // Caso 1: Cambio desde un estado que no afecta inventario a uno que sí
      if (noAfectaInventario.includes(orderToUpdate.estado) && 
          afectaInventario.includes(newStatus) && 
          inventoryDocId) {
        // Reducir inventario
        const newInventory = {
          maxiVasos: Math.max(0, inventory.maxiVasos - (orderToUpdate.maxiVasos || 0)),
          bolsas: Math.max(0, inventory.bolsas - (orderToUpdate.bolsas || 0))
        };
        
        await updateDoc(doc(db, 'inventory', inventoryDocId), newInventory);
        setInventory(newInventory);
      }

      // Caso 2: Cambio desde un estado que afecta inventario a uno que no
      else if (afectaInventario.includes(orderToUpdate.estado) && 
               noAfectaInventario.includes(newStatus) && 
               inventoryDocId) {
        // Devolver productos al inventario
        const newInventory = {
          maxiVasos: inventory.maxiVasos + (orderToUpdate.maxiVasos || 0),
          bolsas: inventory.bolsas + (orderToUpdate.bolsas || 0)
        };
        
        await updateDoc(doc(db, 'inventory', inventoryDocId), newInventory);
        setInventory(newInventory);
      }

      // Manejar referidos solo cuando se cambia a estado "entregado"
      if (newStatus === 'entregado' && orderToUpdate.estado !== 'entregado') {
        if (orderToUpdate.codigoReferido) {
          const referrerData = await verifyReferralCode(orderToUpdate.codigoReferido);
          if (referrerData) {
            console.log("maxi vasos", orderToUpdate.maxiVasos, "bolsas", orderToUpdate.bolsas, "total", orderToUpdate.total);
            await updateReferrerData(referrerData.id, referrerData, {
              maxiVasos: orderToUpdate.maxiVasos,
              bolsas: orderToUpdate.bolsas,
              total: orderToUpdate.total
            });
          }
        }
      }

      setSuccessMessage(`Estado actualizado a: ${newStatus === 'pendiente' ? 'Pendiente' :
        newStatus === 'en_camino' ? 'En Camino' :
          newStatus === 'entregado' ? 'Entregado' :
            newStatus === 'encargo' ? 'Encargo' :
              newStatus === 'cancelado' ? 'Cancelado' :
                newStatus
        }`);
      setTimeout(() => setSuccessMessage(''), 3000);

      setOrders(orders.map(order =>
        order.id === editingOrderId ? { ...order, estado: newStatus } : order
      ));

      closeStatusModal();
    } catch (err) {
      console.error('Error al actualizar estado:', err);
      setError('Error al actualizar el estado. Inténtalo de nuevo.');
      setTimeout(() => setError(''), 3000);
    }
  };

  const openImageModal = (imageUrl) => {
    setSelectedImage(imageUrl);
    setIsImageModalOpen(true);
  };

  const closeImageModal = () => {
    setSelectedImage(null);
    setIsImageModalOpen(false);
  };

  const getStatusTooltip = (status) => {
    switch (status) {
      case 'pendiente':
        return "Tu pedido ha sido recibido y está en proceso de aceptación por nosotros. Pronto estará en camino.";
      case 'en_camino':
        return "¡Tu pedido está en camino! Llegará a la dirección y hora indicada.";
      case 'entregado':
        return "Tu pedido ha sido entregado. ¡Gracias por tu compra!";
      case 'encargo':
        return "Este es un pedido programado para una fecha futura. Se entregará en la fecha acordada. Nos pondremos en contacto para los detalles.";
      case 'cancelado':
        return "Este pedido ha sido cancelado. Si tienes dudas, contáctanos.";
      default:
        return "Estado de pedido";
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md my-4">
      <h2 className="text-xl font-bold mb-4 text-red-700">
        {isAdmin ? 'Gestión de Pedidos' : 'Mis Pedidos'}
      </h2>

      {!isAdmin && (
        <form onSubmit={handleSearch} className="mb-6">
          <div className="flex">
            <input
              type="tel"
              value={searchPhone}
              onChange={(e) => setSearchPhone(e.target.value)}
              placeholder="Ingresa tu número de teléfono"
              className="flex-grow px-3 py-2 border rounded-l focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            <button
              type="submit"
              className="bg-red-600 text-white py-2 px-4 rounded-r hover:bg-red-700"
            >
              Buscar
            </button>
          </div>
        </form>
      )}

      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {successMessage}
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-4">Cargando pedidos...</div>
      ) : orders.length === 0 ? (
        <div className="text-center py-4 text-gray-500">
          {searchPhone ? 'No se encontraron pedidos con este número de teléfono.' : 'Ingresa tu número para ver tus pedidos.'}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead>
              <tr className="bg-gray-100 text-gray-700">
                {isAdmin && <th className="py-2 px-4 text-left">Cliente</th>}
                {isAdmin && <th className="py-2 px-4 text-left">Teléfono</th>}
                <th className="py-2 px-4 text-left">Productos</th>
                <th className="py-2 px-4 text-left">Total</th>
                <th className="py-2 px-4 text-left">Hora de entrega</th>
                <th className="py-2 px-4 text-left">Luegar del pedido</th>
                {isAdmin && <th className="py-2 px-4 text-left">Código de referido</th>}
                <th className="py-2 px-4 text-left">Estado</th>
                <th className="py-2 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr key={order.id} className={`border-b hover:bg-gray-50 ${order.estado === 'encargo' ? 'bg-yellow-50' : ''}`}>
                  {isAdmin && <td className="py-2 px-4">{order.nombre}</td>}
                  {isAdmin && <td className="py-2 px-4">{order.telefono}<a href={`https://wa.me/57${order.telefono}`} target='blank'>🔗</a></td>}
                  <td className="py-2 px-4">
                    {order.maxiVasos > 0 && `${order.maxiVasos} Maxi Vasos`}
                    {order.maxiVasos > 0 && order.bolsas > 0 && ', '}
                    {order.bolsas > 0 && `${order.bolsas} Bolsas`}
                  </td>
                  <td className="py-2 px-4">${order.total.toLocaleString()}</td>

                  <td className="py-2 px-4">
                    {order.tipoOrden === 'futuro' && (
                      <div>
                        <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-bold">
                          ENCARGO: {new Date(order.fechaEntrega).toLocaleDateString()}
                        </span>
                        {order.comentarios && (
                          <div className="text-xs text-gray-600 mt-1 italic">
                            {order.comentarios}
                          </div>
                        )}
                      </div>
                    )}
                    {order.tipoOrden !== 'futuro' && order.horaEntrega}
                  </td>
                  <td className="py-2 px-4">{order.ubicacion}</td>
                  {isAdmin && <td className="py-2 px-4">{order.codigoReferido || 'N/A'}</td>}

                  <td className="py-2 px-4 relative">
                    <div className="flex items-center">
                      <span className={`px-2 py-1 rounded text-xs font-semibold
                        ${order.estado === 'pendiente' ? 'bg-yellow-100 text-yellow-800' :
                          order.estado === 'en_camino' ? 'bg-blue-100 text-blue-800' :
                            order.estado === 'entregado' ? 'bg-green-100 text-green-800' :
                              order.estado === 'encargo' ? 'bg-purple-100 text-purple-800' :
                                order.estado === 'cancelado' ? 'bg-red-100 text-red-800' :
                                  'bg-gray-100 text-gray-800'}`}>
                        {order.estado === 'pendiente' ? 'Pendiente' :
                          order.estado === 'en_camino' ? 'En Camino' :
                            order.estado === 'entregado' ? 'Entregado' :
                              order.estado === 'encargo' ? 'Encargo' :
                                order.estado === 'cancelado' ? 'Cancelado' :
                                  order.estado}
                      </span>
                      <div className="inline-block relative" style={{ zIndex: 40 }}>
                        <InfoTooltip text={getStatusTooltip(order.estado)} />
                      </div>
                    </div>
                  </td>
                  <td className="py-2 px-4 text-center">
                    <div className="flex justify-center space-x-2">
                      <button
                        onClick={() => handleDeleteOrder(order.id)}
                        className="text-red-600 hover:text-red-800"
                        title="Cancelar pedido"
                      >
                        🗑️
                      </button>

                      {isAdmin && (
                        <button
                          onClick={() => openStatusModal(order.id)}
                          className="text-blue-600 hover:text-blue-800"
                          title="Cambiar estado"
                        >
                          📝
                        </button>
                      )}

                      {order.imagenUrl && (
                        <button
                          onClick={() => openImageModal(order.imagenUrl)}
                          className="text-green-600 hover:text-green-800"
                          title="Ver imagen de ubicación"
                        >
                          🖼️
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isImageModalOpen && selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-lg shadow-xl max-w-md w-full">
            <h3 className="text-xl font-bold mb-4 text-red-700">Imagen de ubicación</h3>
            <div className="relative">
              <img
                src={selectedImage}
                alt="Ubicación"
                className="w-full object-contain max-h-80"
              />
            </div>
            <div className="mt-4 flex justify-between">
              <a
                href={selectedImage}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 text-sm"
              >
                Abrir en nueva pestaña
              </a>
              <button
                onClick={closeImageModal}
                className="bg-gray-300 text-gray-800 py-2 px-4 rounded hover:bg-gray-400 text-sm"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full">
            <h3 className="text-xl font-bold mb-4 text-red-700">Cambiar Estado del Pedido</h3>
            <div className="space-y-2">
              <button
                onClick={() => handleUpdateStatus('pendiente')}
                className="block w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 border rounded mb-2"
              >
                Pendiente
              </button>
              <button
                onClick={() => handleUpdateStatus('en_camino')}
                className="block w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 border rounded mb-2"
              >
                En Camino
              </button>
              <button
                onClick={() => handleUpdateStatus('entregado')}
                className="block w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 border rounded mb-2"
              >
                Entregado
              </button>
              <button
                onClick={() => handleUpdateStatus('encargo')}
                className="block w-full text-left px-4 py-3 text-sm text-purple-700 hover:bg-purple-100 border rounded mb-2"
              >
                Encargo
              </button>
              <button
                onClick={() => handleUpdateStatus('cancelado')}
                className="block w-full text-left px-4 py-3 text-sm text-red-700 hover:bg-red-100 border border-red-200 rounded mb-2"
              >
                Cancelado
              </button>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={closeStatusModal}
                className="bg-gray-300 text-gray-800 py-2 px-4 rounded hover:bg-gray-400"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderList;