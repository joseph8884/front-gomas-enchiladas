import React, { useState } from 'react';
import { verifyReferralCode } from '../components/verifyReferralCode';

const Points = () => {
  const [referralCode, setReferralCode] = useState('');
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showRewards, setShowRewards] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!referralCode.trim()) {
      setError('Por favor ingresa un código de referido');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const referrer = await verifyReferralCode(referralCode.toUpperCase());
      if (referrer) {
        setUserData(referrer);
      } else {
        setError('Código de referido no encontrado');
        setUserData(null);
      }
    } catch (err) {
      console.error('Error al verificar código:', err);
      setError('Ocurrió un error al verificar el código');
    } finally {
      setLoading(false);
    }
  };

  const getUserLevel = (points) => {
    const pointsNumber = parseInt(points) || 0;
    if (pointsNumber >= 100) return 3;
    if (pointsNumber >= 50) return 2;
    if (pointsNumber >= 20) return 1;
    return 0;
  };

  const getRewardForLevel = (level) => {
    switch (level) {
      case 1: return 'Una bolsa de gomas gratis';
      case 2: return 'Un vaso gratis';
      case 3: return 'A elegir: alfajor, frappe, sandwich o perro caliente';
      default: return 'Aún no has alcanzado ningún nivel';
    }
  };

  return (
    <div className="flex flex-col min-h-screen md:pl-64">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-red-700">Puntos de Referido</h1>
          <p className="text-lg text-gray-600">Verifica tus puntos y descubre tus recompensas</p>
        </div>

        <div className="max-w-2xl mx-auto">
          {/* Code verification form */}
          <div className="bg-white p-6 rounded-lg shadow-md mb-6">
            <h2 className="text-xl font-bold mb-4 text-red-700">Consulta tus Puntos</h2>
            <form onSubmit={handleSubmit} className="mb-4">
              <div className="flex flex-col md:flex-row gap-4">
                <input
                  type="text"
                  value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase())}
                  placeholder="Ingresa tu código de referido"
                  maxLength={6}
                  className="flex-grow px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-red-500"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-red-600 text-white py-2 px-6 rounded hover:bg-red-700 transition duration-200"
                >
                  {loading ? 'Verificando...' : 'Verificar'}
                </button>
              </div>
            </form>

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}

            {userData && (
              <div className="animate-fadeIn">
                <div className="bg-red-50 border border-red-200 rounded-lg p-5 text-center">
                  <h3 className="text-xl font-bold text-red-800 mb-2">¡Código Válido!</h3>
                  <p className="text-gray-700 mb-4">
                    Código: <span className="font-bold">{userData.NumReferido}</span>
                  </p>
                  
                  <div className="flex justify-center mb-4">
                    <div className="bg-red-700 text-white text-2xl font-bold rounded-full w-20 h-20 flex items-center justify-center">
                      {userData.PuntosTotal || '0'}
                    </div>
                  </div>
                  
                  <p className="text-gray-700 mb-1">
                    Nivel: <span className="font-bold">{getUserLevel(userData.PuntosTotal)}</span>
                  </p>
                  
                  <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4 dark:bg-gray-700">
                    <div className="bg-red-600 h-2.5 rounded-full" style={{ 
                      width: `${Math.min(100, (parseInt(userData.PuntosTotal) || 0) * 100 / 100)}%` 
                    }}></div>
                  </div>
                  
                  <p className="text-gray-700">
                    Premio actual: <span className="font-bold text-red-600">
                      {getRewardForLevel(getUserLevel(userData.PuntosTotal))}
                    </span>
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Rewards info section */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-red-700">Recompensas por Puntos</h2>
              <button 
                onClick={() => setShowRewards(!showRewards)} 
                className="text-red-600 hover:text-red-800"
              >
                {showRewards ? 'Ocultar detalles' : 'Ver detalles'}
              </button>
            </div>
            
            {showRewards && (
              <div className="animate-fadeIn">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  {/* Level 1 */}
                  <div className="border rounded-lg p-4 bg-gradient-to-b from-yellow-50 to-yellow-100">
                    <div className="flex items-center mb-2">
                      <div className="bg-yellow-400 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-2">1</div>
                      <h3 className="font-bold text-lg">Nivel 1</h3>
                    </div>
                    <p className="text-sm mb-2">Alcanzable con <span className="font-bold">20 puntos</span></p>
                    <div className="bg-white rounded p-2 shadow-sm">
                      <p className="font-medium text-red-700">Una bolsa de gomas gratis</p>
                    </div>
                  </div>
                  
                  {/* Level 2 */}
                  <div className="border rounded-lg p-4 bg-gradient-to-b from-gray-50 to-gray-100">
                    <div className="flex items-center mb-2">
                      <div className="bg-gray-400 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-2">2</div>
                      <h3 className="font-bold text-lg">Nivel 2</h3>
                    </div>
                    <p className="text-sm mb-2">Alcanzable con <span className="font-bold">50 puntos</span></p>
                    <div className="bg-white rounded p-2 shadow-sm">
                      <p className="font-medium text-red-700">Un vaso de gomas gratis</p>
                    </div>
                  </div>
                  
                  {/* Level 3 */}
                  <div className="border rounded-lg p-4 bg-gradient-to-b from-amber-50 to-amber-100">
                    <div className="flex items-center mb-2">
                      <div className="bg-amber-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-2">3</div>
                      <h3 className="font-bold text-lg">Nivel 3</h3>
                    </div>
                    <p className="text-sm mb-2">Alcanzable con <span className="font-bold">100 puntos</span></p>
                    <div className="bg-white rounded p-2 shadow-sm">
                      <p className="font-medium text-red-700">A elegir uno:</p>
                      <ul className="list-disc list-inside text-sm pl-2">
                        <li>Alfajor</li>
                        <li>Frappe</li>
                        <li>Sandwich</li>
                        <li>Perro caliente</li>
                      </ul>
                    </div>
                  </div>
                </div>
                
                <div className="bg-red-50 p-4 rounded-lg">
                  <h3 className="font-bold text-red-700 mb-2">¿Cómo reclamar tu premio?</h3>
                  <p className="text-gray-700">
                    Para reclamar tu premio, simplemente escríbenos directamente mencionando tu código de 
                    referido y el premio que deseas. Verificaremos tus puntos y coordinaremos la entrega
                    de tu recompensa.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Points;