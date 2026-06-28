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
  const [currentAspect, setCurrentAspect] = useState<number | undefined>(aspectRatio);
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
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
      <div className="w-full max-w-4xl bg-[#111111] rounded-[24px] shadow-2xl flex flex-col overflow-hidden border border-white/10 ring-1 ring-white/5">
        <div className="flex items-center justify-between px-8 py-5 border-b border-white/10 bg-white/[0.02]">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Adjust Image</h2>
            <p className="text-sm text-gray-400 mt-1">Reposition and zoom your image to fit the 16:9 frame perfectly.</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="relative w-full h-[60vh] min-h-[450px] bg-[#0a0a0a]">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={currentAspect}
            onCropChange={setCrop}
            onCropComplete={onCropCompleteHandler}
            onZoomChange={setZoom}
            objectFit="horizontal-cover"
            showGrid={true}
            style={{
              containerStyle: { background: '#0a0a0a' },
              cropAreaStyle: { 
                border: '2px solid rgba(255, 255, 255, 0.8)', 
                boxShadow: '0 0 0 9999em rgba(0, 0, 0, 0.75)'
              }
            }}
          />
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 bg-black/60 p-1 rounded-xl backdrop-blur-md border border-white/10">
            <button
              onClick={() => setCurrentAspect(16 / 9)}
              className={cn("px-3 py-1.5 rounded-lg text-xs font-bold transition-all", currentAspect === 16 / 9 ? "bg-white text-black" : "text-white hover:bg-white/20")}
            >
              16:9 (Cover)
            </button>
            <button
              onClick={() => setCurrentAspect(1)}
              className={cn("px-3 py-1.5 rounded-lg text-xs font-bold transition-all", currentAspect === 1 ? "bg-white text-black" : "text-white hover:bg-white/20")}
            >
              1:1 (Square)
            </button>
            <button
              onClick={() => setCurrentAspect(4 / 3)}
              className={cn("px-3 py-1.5 rounded-lg text-xs font-bold transition-all", currentAspect === 4 / 3 ? "bg-white text-black" : "text-white hover:bg-white/20")}
            >
              4:3
            </button>
            <button
              onClick={() => setCurrentAspect(undefined)}
              className={cn("px-3 py-1.5 rounded-lg text-xs font-bold transition-all", currentAspect === undefined ? "bg-white text-black" : "text-white hover:bg-white/20")}
            >
              Free
            </button>
          </div>
        </div>

        <div className="p-6 px-8 bg-[#111111] flex flex-col sm:flex-row items-center gap-6 justify-between border-t border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-4 w-full sm:max-w-md bg-white/5 px-4 py-3 rounded-2xl border border-white/5">
            <ZoomOut className="w-5 h-5 text-gray-400 shrink-0" />
            <input
              type="range"
              value={zoom}
              min={1}
              max={3}
              step={0.01}
              aria-labelledby="Zoom"
              onChange={(e) => {
                setZoom(Number(e.target.value));
              }}
              className="flex-1 h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer hover:bg-white/30 transition-colors [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-grab active:[&::-webkit-slider-thumb]:cursor-grabbing [&::-webkit-slider-thumb]:shadow-lg"
            />
            <ZoomIn className="w-5 h-5 text-gray-400 shrink-0" />
          </div>
          
          <div className="flex justify-end gap-3 w-full sm:w-auto">
            <button
              onClick={onClose}
              disabled={isProcessing}
              className="flex-1 sm:flex-none px-6 py-3 rounded-2xl text-sm font-semibold text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isProcessing}
              className={cn(
                "flex-1 sm:flex-none px-8 py-3 rounded-2xl text-sm font-bold text-black transition-all flex items-center justify-center gap-2 shadow-lg",
                isProcessing ? "bg-white/50 cursor-not-allowed" : "bg-white hover:bg-gray-100 hover:scale-[1.02] active:scale-[0.98]"
              )}
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                "Save & Upload"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
