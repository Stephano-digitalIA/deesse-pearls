import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface UseImageUploadResult {
  uploadImages: (files: File[], productId?: string | number) => Promise<string[]>;
  deleteImage: (path: string) => Promise<boolean>;
  isUploading: boolean;
  progress: number;
}

const BUCKET_NAME = 'product-images';
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export function useImageUpload(): UseImageUploadResult {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const uploadImages = async (files: File[], productId?: string | number): Promise<string[]> => {
    setIsUploading(true);
    setProgress(0);

    const uploadedUrls: string[] = [];
    const totalFiles = files.length;

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // Validation
        if (!ALLOWED_TYPES.includes(file.type)) {
          toast.error(`Format non supporté: ${file.name}. Utilisez JPG, PNG ou WebP.`);
          continue;
        }

        if (file.size > MAX_FILE_SIZE) {
          toast.error(`Fichier trop volumineux: ${file.name}. Maximum 5MB.`);
          continue;
        }

        // Générer un nom unique
        const timestamp = Date.now();
        const randomId = Math.random().toString(36).substring(2, 8);
        const extension = file.name.split('.').pop();
        const fileName = `${productId || 'temp'}/${timestamp}-${randomId}.${extension}`;

        // Upload
        const { error: uploadError } = await supabase.storage
          .from(BUCKET_NAME)
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) {
          console.error('Erreur upload:', uploadError);
          toast.error(`Erreur upload: ${file.name}`);
          continue;
        }

        // Récupérer l'URL publique
        const { data: urlData } = supabase.storage
          .from(BUCKET_NAME)
          .getPublicUrl(fileName);

        if (urlData?.publicUrl) {
          uploadedUrls.push(urlData.publicUrl);
        }

        setProgress(Math.round(((i + 1) / totalFiles) * 100));
      }

      if (uploadedUrls.length > 0) {
        toast.success(`${uploadedUrls.length} image(s) uploadée(s)`);
      }

      return uploadedUrls;
    } catch (error) {
      console.error('Erreur upload:', error);
      toast.error('Erreur lors de l\'upload des images');
      return [];
    } finally {
      setIsUploading(false);
      setProgress(0);
    }
  };

  const deleteImage = async (url: string): Promise<boolean> => {
    try {
      // Extraire le chemin depuis l'URL
      const urlObj = new URL(url);
      const pathMatch = urlObj.pathname.match(/\/storage\/v1\/object\/public\/product-images\/(.+)/);

      if (!pathMatch) {
        console.error('URL invalide:', url);
        return false;
      }

      const filePath = decodeURIComponent(pathMatch[1]);

      const { error } = await supabase.storage
        .from(BUCKET_NAME)
        .remove([filePath]);

      if (error) {
        console.error('Erreur suppression:', error);
        toast.error('Erreur lors de la suppression de l\'image');
        return false;
      }

      toast.success('Image supprimée');
      return true;
    } catch (error) {
      console.error('Erreur suppression:', error);
      toast.error('Erreur lors de la suppression de l\'image');
      return false;
    }
  };

  return {
    uploadImages,
    deleteImage,
    isUploading,
    progress,
  };
}
