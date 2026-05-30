import { ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router"

interface BackButtonProps {
  text?: string;
}

const BackButton = ({ text }: BackButtonProps) => {
  const navigate = useNavigate();
  return (
    <button 
      onClick={() => navigate(-1)}
      className="btn btn-ghost btn-sm w-fit gap-2 pl-0"
    >
      <ChevronLeft size={16} /> { text ?? "Back"}
    </button>
  )
}

export default BackButton;
