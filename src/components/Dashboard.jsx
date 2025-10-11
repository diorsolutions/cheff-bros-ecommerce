import React, { useState, useEffect } from "react";
import { useNavigate, NavLink, Outlet } from "react-router-dom"; // NavLink va Outlet import qilindi
import {
  ListOrdered,
  Utensils,
  LogOut,
  PanelLeftClose,
  PanelRightClose,
  BarChart2,
  Users,
  ChefHat,
  Salad, // Yangi: Salad iconi
} from "lucide-react";
import { motion } from "framer-motion";

// Admin panelining ichki komponentlari endi App.jsx da render qilinadi, bu yerda ularni import qilish shart emas.
// import AdminDashboard from "@/components/AdminDashboard";
// import AdminProducts from "@/components/AdminProducts";
// import AdminStatistics from "@/components/AdminStatistics";
// import AdminCouriers from "@/components/AdminCouriers";
// import AdminChefs from "@/components/AdminChefs";
// import AdminIngredients from "@/components/AdminIngredients";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";

const Dashboard = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Xatolik",
        description: "Chiqishda xatolik yuz berdi.",
        variant: "destructive",
      });
    } else {
      navigate("/");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 text-white flex flex-col">
      {/* HEADER - Fixed */}
      <header className="fixed top-0 left-0 right-0 bg-black/30 backdrop-blur-lg border-b border-white/10 z-50 h-16">
        <div className="h-full mx-auto px-3 sm:px-4 lg:px-6 flex items-center justify-between">
          {/* Mobile toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20 lg:hidden"
            onClick={() => setIsSidebarOpen((prev) => !prev)}
          >
            {isSidebarOpen ? (
              <PanelLeftClose className="h-5 w-5" />
            ) : (
              <PanelRightClose className="h-5 w-5" />
            )}
          </Button>

          <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold truncate">
            Admin Paneli
          </h1>

          <Button
            onClick={handleSignOut}
            variant="ghost"
            className="text-white hover:bg-white/10 text-sm sm:text-base"
          >
            <LogOut className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Chiqish</span>
          </Button>
        </div>
      </header>

      {/* BODY - with top padding for fixed header */}
      <div className="flex flex-1 pt-16">
        {/* SIDEBAR - Fixed on desktop, slide-in on mobile */}
        <aside
          className={`
        fixed lg:fixed top-16 left-0 bottom-0
        z-40 transition-all duration-300 ease-in-out
        bg-black/80 backdrop-blur-lg border-r border-white/20
        ${
          isSidebarOpen
            ? "translate-x-0 w-64 sm:w-72"
            : "-translate-x-full lg:translate-x-0 lg:w-20"
        }
      `}
        >
          <nav className="h-full flex flex-col gap-2 p-4 overflow-y-auto">
            {/* Desktop toggle button */}
            <div className="hidden lg:flex w-full justify-end mb-4">
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20"
                onClick={() => setIsSidebarOpen((prev) => !prev)}
              >
                {isSidebarOpen ? (
                  <PanelLeftClose className="h-5 w-5" />
                ) : (
                  <PanelRightClose className="h-5 w-5" />
                )}
              </Button>
            </div>

            {/* Navigation Links */}
            {[
              { to: "orders", icon: ListOrdered, label: "Buyurtmalar" },
              { to: "products", icon: Utensils, label: "Mahsulotlar" },
              { to: "ingredients", icon: Salad, label: "Masalliqlar" },
              { to: "statistics", icon: BarChart2, label: "Statistika" },
              { to: "couriers", icon: Users, label: "Kuryerlar" },
              { to: "chefs", icon: ChefHat, label: "Oshpazlar" },
            ].map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                onClick={() =>
                  window.innerWidth < 1024 && setIsSidebarOpen(false)
                }
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? "bg-white/20 text-orange-400 shadow-lg"
                      : "text-white hover:bg-white/10 hover:text-orange-300"
                  } ${!isSidebarOpen && "lg:justify-center lg:px-2"}`
                }
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span
                  className={`whitespace-nowrap ${
                    !isSidebarOpen && "lg:hidden"
                  }`}
                >
                  {label}
                </span>
              </NavLink>
            ))}
          </nav>
        </aside>

        {/* MAIN CONTENT */}
        <main
          className={`
        flex-1 p-4 sm:p-6 lg:p-8 transition-all duration-300
        ${isSidebarOpen ? "lg:ml-64 sm:lg:ml-72" : "lg:ml-20"}
      `}
        >
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-full overflow-hidden"
          >
            <Outlet />
          </motion.div>
        </main>
      </div>

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default Dashboard;
