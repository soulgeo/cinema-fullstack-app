import { toast, ToastIcon, CheckmarkIcon, ErrorIcon } from "react-hot-toast";
import type { Toast } from "react-hot-toast";
import { X } from "lucide-react";
import { useEffect, useState } from "react";

interface CustomToastProps {
  t: Toast;
  icon?: React.ReactNode;
  message: React.ReactNode;
}

const CustomToast = ({ t, icon, message }: CustomToastProps) => {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (t.visible) {
      const startTime = Date.now();
      const duration = t.duration || 4000;

      const interval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(100 - (elapsed / duration) * 100, 0);
        setProgress(remaining);

        if (remaining <= 0) {
          clearInterval(interval);
        }
      }, 10);

      return () => clearInterval(interval);
    }
  }, [t.visible, t.duration]);
  const renderIcon = () => {
    if (icon) return icon;
    if (t.type === 'success') return <CheckmarkIcon primary="var(--color-success)" secondary="var(--color-base-200)" />;
    if (t.type === 'error') return <ErrorIcon primary="var(--color-error)" secondary="var(--color-base-200)" />;
    return <ToastIcon toast={t} />;
  };

  const borderColor = t.type === 'error' ? 'border-error' : t.type === 'success' ? 'border-success' : 'border-base-300';
  const progressColor = t.type === 'error' ? 'bg-error' : t.type === 'success' ? 'bg-success' : 'bg-primary';

  return (
    <div
      className={`${
        t.visible ? "animate-enter" : "animate-leave"
      } max-w-md w-full bg-base-200 shadow-lg rounded-lg pointer-events-auto flex flex-col overflow-hidden border ${borderColor}`}
      style={{ minWidth: "380px" }}
    >
      <div className="flex p-5 items-center min-h-[80px]">
        <div className="flex-shrink-0 flex items-center justify-center min-w-[24px]">
          {renderIcon()}
        </div>
        <div className="ml-4 flex-1">
          <div className="text-base font-medium text-base-content leading-relaxed">
            {message}
          </div>
        </div>
        <div className="ml-4 flex-shrink-0 flex">
          <button
            onClick={() => toast.dismiss(t.id)}
            className="rounded-md inline-flex text-base-content/50 hover:text-base-content focus:outline-none transition-colors"
          >
            <span className="sr-only">Close</span>
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Progress Bar Container */}
      <div className="h-1 w-full bg-base-300">
        <div 
          className={`h-full ${progressColor} transition-all duration-100 ease-linear`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
  };
export default CustomToast;
