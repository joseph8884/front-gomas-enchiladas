import React from 'react';
import InfoTooltip from './InfoTooltip';

const ImmediateOrderForm = ({ formData, handleChange, imagePreview, handleImageOperations }) => {
  return (
    <>
      <div>
        <label className="block text-gray-700 mb-2">
          Ubicación en la universidad*
          <InfoTooltip text="Indica un punto de referencia claro donde podamos encontrarte. Ejemplo: 'Mesa cerca de la ventana en la cafetería central'" />
        </label>
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
            <InfoTooltip text="Una foto de tu ubicación exacta nos ayuda a encontrarte más rápido" />
          </label>
          
          <div className="flex flex-wrap gap-2">
            <label className="inline-flex items-center px-3 py-2 bg-red-600 text-white rounded cursor-pointer hover:bg-red-700 text-sm">
              <span className="mr-1">📁</span>
              <span>Subir foto</span>
              <input 
                type="file"
                accept="image/*"
                onChange={handleImageOperations.handleImageSelection}
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
                onChange={handleImageOperations.handleImageSelection}
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
                onClick={handleImageOperations.clearImage}
                className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm"
              >
                ✕
              </button>
            </div>
          )}
        </div>
      </div>
      
      <div>
        <label className="block text-gray-700 mb-2">
          Hora de entrega*
          <InfoTooltip text="Ten en cuenta que tenemos de 15 minutos a 3 horas de disponibilidad para hacer el pedido, en caso de no alcanzar nos comunicaremos contigo. Revisa siempre el estado de tu pedido." />
        </label>
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
  );
};

export default ImmediateOrderForm;