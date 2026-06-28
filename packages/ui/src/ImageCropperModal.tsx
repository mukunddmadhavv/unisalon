import { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import getCroppedImg from './cropImage';
import { X, ZoomIn, ZoomOut } from 'lucide-react';
import { cn } from './index';

interface ImageCropperModalProps {
  imageSrc: string;
  onClose: () => void;
  onCropComplete: (croppedBlob: Blob) => void;
  aspectRatio?: number;
}

export function ImageCropperModal({
  imageSrc,
  onClose,
  onCropComplete,
  aspectRatio = 16 / 9,
}: ImageCropperModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const onCropCompleteHandler = useCallback((_croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleSave = async () => {
    try {
      setIsProcessing(true);
      const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels, 0);
      if (croppedBlob) {
        onCropComplete(croppedBlob);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-surface rounded-2xl shadow-xl flex flex-col overflow-hidden m-4">
        <div className="flex items-center justify-between px-4 py-3 border-b border-surface-muted bg-surface/50">
          <h2 className="text-lg font-semibold text-on-surface">Crop Image</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-gray-400 hover:text-white hover:bg-surface-muted transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="relative w-full h-[50vh] min-h-[300px] bg-black">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={aspectRatio}
            onCropChange={setCrop}
            onCropComplete={onCropCompleteHandler}
            onZoomChange={setZoom}
          />
        </div>

        <div className="p-4 bg-surface flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <ZoomOut className="w-5 h-5 text-gray-400" />
            <input
              type="range"
              value={zoom}
              min={1}
              max={3}
              step={0.1}
              aria-labelledby="Zoom"
              onChange={(e) => {
                setZoom(Number(e.target.value));
              }}
              className="flex-1 h-2 bg-surface-muted rounded-lg appearance-none cursor-pointer accent-brand-500"
            />
            <ZoomIn className="w-5 h-5 text-gray-400" />
          </div>
          
          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={onClose}
              disabled={isProcessing}
              className="px-4 py-2 rounded-xl text-sm font-medium text-gray-400 hover:text-white hover:bg-surface-muted transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isProcessing}
              className={cn(
                "px-5 py-2 rounded-xl text-sm font-medium text-white transition-colors flex items-center gap-2",
                isProcessing ? "bg-brand-500/50 cursor-not-allowed" : "bg-brand-500 hover:bg-brand-600"
              )}
            >
              {isProcessing && (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              )}
              {isProcessing ? "Saving..." : "Save Cropped Image"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
