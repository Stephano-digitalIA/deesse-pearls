import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getProfileByUserId, upsertProfile, Profile, getProfiles } from '@/lib/localStorage';

// Clé pour l'adresse de livraison temporaire (checkout)
const SHIPPING_ADDRESS_KEY = 'deesse_shipping_address';

export interface ShippingAddress {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  postalCode: string;
  country: string;
}

export interface UserProfile extends ShippingAddress {
  userId?: string;
}

// Récupérer l'adresse de livraison depuis localStorage
export function getShippingAddress(): ShippingAddress | null {
  try {
    const stored = localStorage.getItem(SHIPPING_ADDRESS_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

// Sauvegarder l'adresse de livraison dans localStorage
export function saveShippingAddress(address: ShippingAddress): void {
  localStorage.setItem(SHIPPING_ADDRESS_KEY, JSON.stringify(address));
}

// Supprimer l'adresse de livraison temporaire
export function clearShippingAddress(): void {
  localStorage.removeItem(SHIPPING_ADDRESS_KEY);
}

// Hook principal
export function useUserProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Charger le profil au montage ou quand l'utilisateur change
  useEffect(() => {
    setIsLoading(true);

    // Toujours vérifier s'il y a une adresse de livraison temporaire (checkout en cours)
    const savedShippingAddress = getShippingAddress();

    // DEBUG: Log pour tracer le chargement
    console.log('=== useUserProfile DEBUG ===');
    console.log('user:', user ? { id: user.id, email: user.email } : null);
    console.log('savedShippingAddress:', savedShippingAddress);
    console.log('ALL profiles in localStorage:', getProfiles());

    if (user) {
      // Utilisateur connecté : charger depuis le profil sauvegardé
      const savedProfile = getProfileByUserId(user.id);
      console.log('savedProfile from localStorage:', savedProfile);

      // Fusionner les données : priorité au profil utilisateur (Account.tsx),
      // puis l'adresse de livraison temporaire, puis les valeurs par défaut
      const mergedProfile: UserProfile = {
        userId: user.id,
        firstName: savedProfile?.firstName || savedShippingAddress?.firstName || user.user_metadata?.first_name || '',
        lastName: savedProfile?.lastName || savedShippingAddress?.lastName || user.user_metadata?.last_name || '',
        email: user.email || savedShippingAddress?.email || '',
        phone: savedProfile?.phone || savedShippingAddress?.phone || '',
        addressLine1: savedProfile?.addressLine1 || savedShippingAddress?.addressLine1 || '',
        addressLine2: savedProfile?.addressLine2 || savedShippingAddress?.addressLine2 || '',
        city: savedProfile?.city || savedShippingAddress?.city || '',
        postalCode: savedProfile?.postalCode || savedShippingAddress?.postalCode || '',
        country: savedProfile?.country || savedShippingAddress?.country || 'France',
      };

      console.log('mergedProfile:', mergedProfile);
      setProfile(mergedProfile);
    } else {
      // Pas d'utilisateur : vérifier s'il y a une adresse temporaire
      if (savedShippingAddress) {
        setProfile(savedShippingAddress);
      } else {
        setProfile(null);
      }
    }

    setIsLoading(false);
  }, [user]);

  // Sauvegarder le profil
  const saveProfile = useCallback((newProfile: ShippingAddress) => {
    // Toujours sauvegarder en tant qu'adresse de livraison pour le checkout
    saveShippingAddress(newProfile);

    // Si utilisateur connecté, aussi sauvegarder dans son profil permanent
    if (user) {
      upsertProfile({
        userId: user.id,
        firstName: newProfile.firstName,
        lastName: newProfile.lastName,
        phone: newProfile.phone,
        addressLine1: newProfile.addressLine1,
        addressLine2: newProfile.addressLine2,
        city: newProfile.city,
        postalCode: newProfile.postalCode,
        country: newProfile.country,
      });
    }

    setProfile({
      ...newProfile,
      userId: user?.id,
    });
  }, [user]);

  // Vérifier si le profil est complet pour le checkout
  const isProfileComplete = useCallback((): boolean => {
    if (!profile) return false;

    return !!(
      profile.firstName &&
      profile.lastName &&
      profile.email &&
      profile.addressLine1 &&
      profile.city &&
      profile.postalCode &&
      profile.country
    );
  }, [profile]);

  return {
    profile,
    isLoading,
    saveProfile,
    isProfileComplete,
    shippingAddress: getShippingAddress(),
  };
}

export default useUserProfile;
