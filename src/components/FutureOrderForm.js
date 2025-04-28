import React from 'react';
import InfoTooltip from './InfoTooltip';

const FutureOrderForm = ({ formData, handleChange, getMinDate, getMaxDate }) => {
  return (
    <>
      <div>
        <label className="block text-gray-700 mb-2">
          Fecha de entrega*
          <InfoTooltip text="Selecciona la fecha en que deseas recibir tu pedido. Puedes hacer encargos con hasta 7 días de anticipación." />
        </label>
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
        <label className="block text-gray-700 mb-2">
          Comentarios adicionales
          <InfoTooltip text="Incluye cualquier información relevante: hora preferida de entrega, punto de encuentro, o detalles específicos de tu pedido." />
        </label>
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
  );
};

export default FutureOrderForm;