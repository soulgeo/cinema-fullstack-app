interface Props {
  size?: "xs" | "sm" | "md" | "lg";
}

const Loading = ({ size = "lg" }: Props) => {
  return (
    <div className="flex items-center justify-center w-full h-full min-h-10">
      <span className={`loading loading-ring loading-${size} text-primary`}></span>
    </div>
  );
};

export default Loading;
