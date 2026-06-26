import { useEffect, useRef, useState } from "react";
import { Html5Qrcode, type Html5QrcodeResult } from "html5-qrcode";

interface QRScannerProps {
  onScanSuccess: (text: string, result: Html5QrcodeResult) => void;
  onScanFailure: (error: string) => void;
}

export default function QrScanner({ onScanSuccess, onScanFailure }: QRScannerProps) {
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>("environment");
  const [isScanning, setIsScanning] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const qrCodeRef = useRef<Html5Qrcode | null>(null);
  const elementId = "custom-qr-reader";

  useEffect(() => {
    const html5Qrcode = new Html5Qrcode(elementId);
    qrCodeRef.current = html5Qrcode;

    Html5Qrcode.getCameras()
      .then((devices) => {
        if (devices && devices.length > 0) {
          setCameras(devices);
          setHasPermission(true);
          startScanning(html5Qrcode, "environment");
        } else {
          setHasPermission(false);
        }
      })
      .catch((err) => {
        console.error("Error getting cameras:", err);
        setHasPermission(false);
      });

    return () => {
      if (html5Qrcode.isScanning) {
        html5Qrcode.stop().catch((e) => console.error("Error stopping on unmount:", e));
      }
    };
  }, []);

  const startScanning = async (scannerInstance = qrCodeRef.current, cameraIdOrMode = selectedCameraId) => {
    if (!scannerInstance || scannerInstance.isScanning) return;

    try {
      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
      };

      const cameraConfig = cameraIdOrMode === "environment" 
        ? { facingMode: "environment" } 
        : cameraIdOrMode;

      await scannerInstance.start(
        cameraConfig,
        config,
        (decodedText, decodedResult) => {
          onScanSuccess(decodedText, decodedResult);
        },
        (error) => {
          onScanFailure(error);
        }
      );
      setIsScanning(true);
    } catch (err) {
      console.error("Failed to start scanning:", err);
      setIsScanning(false);
    }
  };

  const stopScanning = async () => {
    if (!qrCodeRef.current || !qrCodeRef.current.isScanning) return;

    try {
      await qrCodeRef.current.stop();
      setIsScanning(false);
    } catch (err) {
      console.error("Failed to stop scanning:", err);
    }
  };

  const handleCameraChange = async (cameraId: string) => {
    setSelectedCameraId(cameraId);
    if (qrCodeRef.current) {
      if (qrCodeRef.current.isScanning) {
        await qrCodeRef.current.stop();
      }
      await startScanning(qrCodeRef.current, cameraId);
    }
  };

  const toggleScan = () => {
    if (isScanning) {
      stopScanning();
    } else {
      startScanning();
    }
  };

  return (
    <div className="flex flex-col items-center gap-6 p-6">
      {/* Video Container & Laser Guide */}
      <div className="relative w-full max-w-[400px] aspect-square rounded-2xl overflow-hidden bg-black shadow-inner border border-base-300">
        <div id={elementId} className="w-full h-full object-cover" />
        
        {isScanning && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {/* Mask layer */}
            <div className="absolute inset-0 bg-black/40" />
            
            {/* Center target square */}
            <div className="relative w-[250px] h-[250px] bg-transparent border-2 border-primary/80 rounded-xl overflow-hidden shadow-[0_0_0_9999px_rgba(0,0,0,0.4)]">
              {/* Corner brackets */}
              <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-primary" />
              <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-primary" />
              <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-primary" />
              <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-primary" />
              
              {/* Scan laser line */}
              <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent shadow-[0_0_12px_var(--color-primary)] animate-scan" />
            </div>
          </div>
        )}

        {hasPermission === false && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 bg-base-300 text-base-content/70">
            <span className="text-4xl mb-2">🚫</span>
            <p className="font-bold text-lg">Camera Access Denied</p>
            <p className="text-sm mt-1">Please enable camera permissions in settings to scan tickets.</p>
          </div>
        )}

        {hasPermission === null && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-base-300 text-base-content/70">
            <span className="loading loading-spinner loading-lg text-primary"></span>
            <p className="text-sm mt-3 font-medium">Requesting camera access...</p>
          </div>
        )}
      </div>

      {/* Control Buttons */}
      {hasPermission && (
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-center w-full max-w-[400px]">
          {cameras.length > 1 && (
            <select
              className="select select-bordered flex-1 w-full bg-base-100 font-medium"
              value={selectedCameraId}
              onChange={(e) => handleCameraChange(e.target.value)}
            >
              <option value="environment">Back Camera (Default)</option>
              {cameras.map((camera) => (
                <option key={camera.id} value={camera.id}>
                  {camera.label || `Camera ${cameras.indexOf(camera) + 1}`}
                </option>
              ))}
            </select>
          )}

          <button
            onClick={toggleScan}
            className={`btn w-full sm:w-auto px-8 font-bold text-sm tracking-wider uppercase ${
              isScanning ? "btn-error btn-outline" : "btn-primary"
            }`}
          >
            {isScanning ? "Stop Camera" : "Start Camera"}
          </button>
        </div>
      )}
    </div>
  );
}
