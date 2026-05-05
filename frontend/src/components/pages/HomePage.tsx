import Layout from "../layout/Layout"
import { useAuth } from "../../context/AuthContext"
import 'animate.css'

const HomePage = () => {
  const { setShowSignup } = useAuth();

  return (
    <Layout>
      <div className="flex flex-col h-screen w-full items-center justify-center gap-4">
        <div className="flex flex-row gap-4 mt-2 mb-20">
          <button onClick={() => setShowSignup(true)} className="btn btn-primary">Create an Account</button>
        </div>
      </div>
    </Layout>
  )
}

export default HomePage
