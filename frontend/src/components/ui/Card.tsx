interface Props {
  title?: string;
  text?: string;
  children?: React.ReactNode;
  className?: string;
}

const Card = ({ title, text, children, className }: Props) => {
  return (
    <div 
      className={`flex flex-col gap-3 bg-base-100 rounded-2xl shadow p-5 ${className || ""}`}>
      {title && <h3 className="font-bold text-lg">{title}</h3>}
      {text && <p>{text}</p>}
      {children}
    </div>
  )
}
export default Card
