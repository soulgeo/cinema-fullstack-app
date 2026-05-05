import Navbar from "./Navbar/Navbar";

interface Props {
  children: React.ReactNode;
  fullWidth?: boolean;
}

const Layout = ({ children, fullWidth }: Props) => {
  return (
    <>
      <Navbar />
      <div
        className={`flex flex-col items-center w-full overscroll-none bg-base-300 h-full min-h-screen pt-20`}
      >
        <main
          className={`flex flex-col w-full ${fullWidth ? "" : "max-w-5xl px-4"} items-center`}
        >
          {children}
        </main>
      </div>
    </>
  );
};

export default Layout;
