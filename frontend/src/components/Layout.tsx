import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import { useAuth } from "@/contexts/AuthContext";

const Layout = () => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) return <Outlet />;

  return (
    <div className="flex h-screen bg-[#f1f5f9]">
      <Sidebar />
      <main className="flex-1 ml-64 overflow-y-auto w-full transition-all">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
