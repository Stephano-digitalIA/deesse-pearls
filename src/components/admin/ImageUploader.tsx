import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useImageUpload } from '@/hooks/useImageUpload';
import { ImageIcon, X, Upload, Loader2, Link } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImageUploaderProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
  productId?: number;  // integer dans Supabase
}

const ImageUploader: React.FC<ImageUploaderProps> = ({
  images = [],  // Valeur par défaut pour éviter undefined
  onImagesChange,
  productId,
}) => {
  const { uploadImages, deleteImage, isUploading, progress } = useImageUpload();
  const [urlInput, setUrlInput] = React.useState('');

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const uploadedUrls = await uploadImages(acceptedFiles, productId);
      if (uploadedUrls.length > 0) {
        onImagesChange([...images, ...uploadedUrls]);
      }
    },
    [images, onImagesChange, uploadImages, productId]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp'],
    },
    maxSize: 5 * 1024 * 1024,
    disabled: isUploading,
  });

  const handleRemoveImage = async (index: number) => {
    const imageUrl = images[index];

    // Si c'est une URL Supabase, supprimer du storage
    if (imageUrl.includes('supabase')) {
      await deleteImage(imageUrl);
    }

    const newImages = images.filter((_, i) => i !== index);
    onImagesChange(newImages);
  };

  const handleAddUrl = () => {
    if (urlInput.trim()) {
      onImagesChange([...images, urlInput.trim()]);
      setUrlInput('');
    }
  };

  return (
    <div className="space-y-4">
      {/* Images existantes */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {images.map((url, index) => (
            <div
              key={index}
              className="relative aspect-square rounded-lg overflow-hidden border border-border bg-muted group"
            >
              <img
                src={url}
                alt={`Image ${index + 1}`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/placeholder.svg';
                }}
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-1 right-1 w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => handleRemoveImage(index)}
              >
                <X className="w-3 h-3" />
              </Button>
              <div className="absolute bottom-1 left-1 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded">
                {index + 1}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Zone de drop */}
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
          isDragActive
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/50",
          isUploading && "pointer-events-none opacity-50"
        )}
      >
        <input {...getInputProps()} />
        {isUploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              Upload en cours... {progress}%
            </p>
          </div>
        ) : isDragActive ? (
          <div className="flex flex-col items-center gap-2">
            <Upload className="w-8 h-8 text-primary" />
            <p className="text-sm text-primary">Déposez les images ici</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <ImageIcon className="w-8 h-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Glissez-déposez des images ou cliquez pour sélectionner
            </p>
            <p className="text-xs text-muted-foreground">
              JPG, PNG, WebP • Max 5MB
            </p>
          </div>
        )}
      </div>

      {/* Ajouter par URL */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="Ou entrez une URL d'image..."
            className="pl-10"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddUrl();
              }
            }}
          />
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={handleAddUrl}
          disabled={!urlInput.trim()}
        >
          Ajouter
        </Button>
      </div>
    </div>
  );
};

export default ImageUploader;
