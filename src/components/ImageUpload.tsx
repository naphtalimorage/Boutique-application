import { useRef, useCallback } from 'react';
import { Upload } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImageUploadProps {
  value: string | null;
  onChange: (file: File | null, preview: string | null) => void;
  onError?: (error: string) => void;
}

export default function ImageUpload({ value, onChange, onError }: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const MAX_SIZE = 2 * 1024 * 1024; // 2MB
  const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];

  const handleFileSelect = useCallback((file: File) => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      onError?.('Please select an image file (JPEG, PNG, GIF, WebP)');
      return;
    }
    if (file.size > MAX_SIZE) {
      onError?.(`Image is too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum size is 2MB.`);
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      console.log('✅ File selected:', file.name, file.type, file.size, 'bytes');
      onChange(file, reader.result as string);
    };
    reader.onerror = () => {
      onError?.('Failed to read image file');
    };
    reader.readAsDataURL(file);
  }, [onChange, onError]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const removeImage = () => {
    onChange(null, null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Has saved image
  if (value) {
    return (
      <div>
        <div className="relative group">
          <img
            src={value}
            alt="Product"
            className="w-full h-48 object-contain rounded-lg border bg-muted"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/placeholder-product.svg';
            }}
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 rounded-lg">
            <button
              type="button"
              className="px-3 py-1.5 bg-white text-dark text-sm font-medium rounded-md hover:bg-gray-100 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              Replace
            </button>
            <button
              type="button"
              className="px-3 py-1.5 bg-destructive text-white text-sm font-medium rounded-md hover:bg-destructive/90 transition-colors"
              onClick={removeImage}
            >
              Remove
            </button>
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
          onChange={handleInputChange}
          className="hidden"
        />
      </div>
    );
  }

  // Upload area
  return (
    <div
      className={cn(
        'border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer',
        'hover:border-primary/50 hover:bg-primary/5',
        'flex flex-col items-center justify-center min-h-[180px]'
      )}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onClick={() => fileInputRef.current?.click()}
    >
      <Upload className="h-10 w-10 text-muted-foreground mb-3" />
      <p className="text-sm font-medium text-foreground mb-1">
        Click to upload or drag & drop
      </p>
      <p className="text-xs text-muted-foreground">
        JPEG, PNG, GIF, WebP (max 2MB)
      </p>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
        onChange={handleInputChange}
        className="hidden"
      />
    </div>
  );
}
