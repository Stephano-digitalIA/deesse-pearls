import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

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

// Hook principal
export function useUserProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Charger le profil depuis Supabase
  // IMPORTANT: Utilise user?.id comme dépendance pour éviter les boucles infinies
  const loadProfile = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const userId = user.id;
    const userEmail = user.email || '';
    const userFirstName = user.user_metadata?.first_name || '';
    const userLastName = user.user_metadata?.last_name || '';

    const fallback = () => {
      setProfile({
        userId,
        firstName: userFirstName,
        lastName: userLastName,
        email: userEmail,
        phone: '',
        addressLine1: '',
        city: '',
        postalCode: '',
        country: 'FR',
      });
    };

    try {
      console.log('[useUserProfile] Fetching profile for user:', userId);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.warn('[useUserProfile] Query timeout after 3s, aborting');
        controller.abort();
      }, 3000);

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle()
        .abortSignal(controller.signal);

      clearTimeout(timeoutId);
      console.log('[useUserProfile] Query result:', { data, error: error?.message });

      if (error) {
        // Abort errors are expected when timeout fires
        if (error.message?.includes('abort')) {
          console.warn('[useUserProfile] Query aborted (timeout)');
        } else {
          console.error('[useUserProfile] Error fetching profile:', error);
        }
        fallback();
        return;
      }

      if (data) {
        setProfile({
          userId,
          firstName: data.first_name || userFirstName,
          lastName: data.last_name || userLastName,
          email: userEmail,
          phone: data.phone || '',
          addressLine1: data.address_line1 || '',
          addressLine2: data.address_line2 || '',
          city: data.city || '',
          postalCode: data.postal_code || '',
          country: data.country || 'FR',
        });
      } else {
        console.log('[useUserProfile] No profile found, using fallback');
        fallback();
      }
    } catch (e: any) {
      console.error('[useUserProfile] loadProfile error:', e?.message || e);
      fallback();
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, user?.email, user?.user_metadata?.first_name, user?.user_metadata?.last_name]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // Sauvegarder le profil dans Supabase
  const saveProfile = useCallback(async (newProfile: ShippingAddress) => {
    if (!user?.id) return;

    const userId = user.id;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const { error } = await supabase
      .from('profiles')
      .upsert({
        user_id: userId,
        first_name: newProfile.firstName,
        last_name: newProfile.lastName,
        phone: newProfile.phone,
        address_line1: newProfile.addressLine1,
        address_line2: newProfile.addressLine2 || null,
        city: newProfile.city,
        postal_code: newProfile.postalCode,
        country: newProfile.country,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' })
      .abortSignal(controller.signal);

    clearTimeout(timeoutId);

    if (error) {
      console.error('[useUserProfile] Error saving profile:', error);
      throw error;
    }

    setProfile({
      ...newProfile,
      userId,
    });
  }, [user?.id]);

  // Recharger le profil (utile après modification dans un modal)
  const refreshProfile = useCallback(() => {
    return loadProfile();
  }, [loadProfile]);

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
    refreshProfile,
    isProfileComplete,
  };
}

export default useUserProfile;
