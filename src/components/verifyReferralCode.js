import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebase';

/**
 * Verifies if a referral code exists in the database
 * @param {string} code - The referral code to check
 * @returns {Promise<Object|null>} - The referrer document data or null if not found
 */
export const verifyReferralCode = async (code) => {
  if (!code || code.trim() === '') return null;
  
  try {
    const q = query(collection(db, 'refered'), where('NumReferido', '==', code));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }
    
    // Return the first matching document data and ID
    const doc = querySnapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data()
    };
  } catch (error) {
    console.error('Error verifying referral code:', error);
    return null;
  }
};

/**
 * Calculates the discount amount based on a valid referral code
 * @param {number} total - The total order amount
 * @returns {number} - The discounted amount (10% off)
 */
export const calculateReferralDiscount = (total) => {
  return Math.round(total * 0.1); // 10% discount, rounded to nearest integer
};

/**
 * Updates the referrer's data after a successful order
 * @param {string} referrerId - The document ID of the referrer
 * @param {Object} referrerData - The current data of the referrer
 * @param {Object} orderData - Data about the order (maxiVasos, bolsas, total)
 * @returns {Promise<boolean>} - True if update was successful
 */
export const updateReferrerData = async (referrerId, referrerData, orderData) => {
  try {
    // Calculate points to add based on order total
    const pointsToAdd = orderData.total >= 10000 ? 10 : 5;
    
    // Convert existing values from strings to numbers
    const currentPoints = parseInt(referrerData.PuntosTotal) || 0;
    const currentVasos = parseInt(referrerData.Vasos_comprados) || 0;
    const currentBolsas = parseInt(referrerData.bolsas_compradas) || 0;
    
    // Update the document with new values
    const referrerRef = doc(db, 'refered', referrerId);
    await updateDoc(referrerRef, {
      PuntosTotal: (currentPoints + pointsToAdd).toString(),
      Vasos_comprados: (currentVasos + orderData.maxiVasos).toString(),
      bolsas_compradas: (currentBolsas + orderData.bolsas).toString()
    });
    
    return true;
  } catch (error) {
    console.error('Error updating referrer data:', error);
    return false;
  }
};