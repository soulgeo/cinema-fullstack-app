import { Clapperboard } from "lucide-react";

interface LogoProps {
  className?: string;
  size?: number;
}

const Logo = ({ className = "text-primary", size = 24 }: LogoProps) => {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Clapperboard size={size} />
      <span className="font-bold text-xl tracking-tight">CinemaApp</span>
    </div>
  );
};

export default Logo;
