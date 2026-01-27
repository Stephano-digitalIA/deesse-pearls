import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

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
    const loadProfile = async () => {
      setIsLoading(true);

      // Toujours vérifier s'il y a une adresse de livraison temporaire (checkout en cours)
      const savedShippingAddress = getShippingAddress();

      if (user) {
        // Utilisateur connecté : charger depuis Supabase
        const { data: savedProfile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) {
          console.error('[useUserProfile] Error fetching profile:', error);
        }

        // Fusionner les données : priorité au profil Supabase,
        // puis l'adresse de livraison temporaire, puis user_metadata
        const mergedProfile: UserProfile = {
          userId: user.id,
          firstName: savedProfile?.first_name || savedShippingAddress?.firstName || user.user_metadata?.first_name || '',
          lastName: savedProfile?.last_name || savedShippingAddress?.lastName || user.user_metadata?.last_name || '',
          email: user.email || savedShippingAddress?.email || '',
          phone: savedProfile?.phone || savedShippingAddress?.phone || '',
          addressLine1: savedProfile?.address_line1 || savedShippingAddress?.addressLine1 || '',
          addressLine2: savedProfile?.address_line2 || savedShippingAddress?.addressLine2 || '',
          city: savedProfile?.city || savedShippingAddress?.city || '',
          postalCode: savedProfile?.postal_code || savedShippingAddress?.postalCode || '',
          country: savedProfile?.country || savedShippingAddress?.country || 'France',
        };

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
    };

    loadProfile();
  }, [user]);

  // Sauvegarder le profil
  const saveProfile = useCallback((newProfile: ShippingAddress) => {
    // Toujours sauvegarder en tant qu'adresse de livraison pour le checkout
    saveShippingAddress(newProfile);

    // Si utilisateur connecté, aussi sauvegarder dans Supabase
    if (user) {
      supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          first_name: newProfile.firstName,
          last_name: newProfile.lastName,
          phone: newProfile.phone,
          address_line1: newProfile.addressLine1,
          address_line2: newProfile.addressLine2 || null,
          city: newProfile.city,
          postal_code: newProfile.postalCode,
          country: newProfile.country,
        }, { onConflict: 'user_id' })
        .then(({ error }) => {
          if (error) {
            console.error('[useUserProfile] Error saving profile:', error);
          }
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
