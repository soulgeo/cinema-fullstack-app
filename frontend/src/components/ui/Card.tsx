interface Props {
  title?: string;
  text?: string;
  children?: React.ReactNode;
}

const Card = ({ title, text, children }: Props) => {
  return (
    <div 
      className="flex flex-col gap-3 bg-base-100 rounded-2xl shadow p-5">
      {title && <h3 className="font-bold text-lg">{title}</h3>}
      {text && <p>{text}</p>}
      {children}
    </div>
  )
}
export default Card
