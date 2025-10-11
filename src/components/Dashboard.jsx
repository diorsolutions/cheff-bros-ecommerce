import React, { useState, useEffect } from "react";
import { useNavigate, NavLink, Outlet } from "react-router-dom";
import {
  ListOrdered,
  Utensils,
  LogOut,
  PanelLeftClose,
  PanelRightClose,
  BarChart2,
  Users,
  ChefHat,
  Salad,
} from "lucide-react";
import { motion } from "framer-motion";
import { useMediaQuery } from "react-responsive";

import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";

const Dashboard = () => {
  const isNorTablet = useMediaQuery({ maxWidth: 780 }); // nor_tablet breakpoint
  const [isSidebarOpen, setIsSidebarOpen] = useState(!isNorTablet); // Default open for large, closed for small

  useEffect(() => {
    setIsSidebarOpen(!isNorTablet); // Set initial state based on screen size
  }, [isNorTablet]);

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
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 text-white">
      <header className="bg-black/20 backdrop-blur-lg border-b border-white/10 sticky top-0 z-30">
        <div className="mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl md:text-3xl font-bold">Admin Paneli</h1>
          <Button
            onClick={handleSignOut}
            variant="ghost"
            className="text-white hover:bg-white/10"
          >
            <LogOut className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Chiqish</span>
          </Button>
        </div>
      </header>
      <main className="flex flex-col md:flex-row">
        <aside
          className={`transition-all duration-300 flex-shrink-0 items-start border-r border-white/20 p-[0.87rem] pt-0
            ${isNorTablet ? "fixed z-50 bg-black/80 h-full" : ""}
            ${isSidebarOpen ? "w-64" : "w-20"}
            ${!isSidebarOpen && !isNorTablet ? "bg-[#332a00]/10 p-[1rem]" : ""}
          `}
        >
          <nav className="flex flex-col items-end gap-2 sticky top-[81px]">
            {/* Sidebar toggle button */}
            <div className="w-full flex justify-end mb-4">
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

            {/* Navigation buttons */}
            <div className="flex flex-col w-full">
              <NavLink
                to="orders"
                className={({ isActive }) =>
                  `min-w-full justify-start flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-white/20 text-active-orange"
                      : "text-white hover:bg-white/10 hover:text-active-orange"
                  }`
                }
              >
                <ListOrdered className="mr-3 h-5 w-5 shrink-0" />
                {isSidebarOpen && <span>Buyurtmalar</span>}
              </NavLink>

              <NavLink
                to="products"
                className={({ isActive }) =>
                  `min-w-full justify-start flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-white/20 text-active-orange"
                      : "text-white hover:bg-white/10 hover:text-active-orange"
                  }`
                }
              >
                <Utensils className="mr-3 h-5 w-5 shrink-0" />
                {isSidebarOpen && <span>Mahsulotlar</span>}
              </NavLink>

              <NavLink
                to="ingredients"
                className={({ isActive }) =>
                  `min-w-full justify-start flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-white/20 text-active-orange"
                      : "text-white hover:bg-white/10 hover:text-active-orange"
                  }`
                }
              >
                <Salad className="mr-3 h-5 w-5 shrink-0" />
                {isSidebarOpen && <span>Masalliqlar</span>}
              </NavLink>

              <NavLink
                to="statistics"
                className={({ isActive }) =>
                  `min-w-full justify-start flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-white/20 text-active-orange"
                      : "text-white hover:bg-white/10 hover:text-active-orange"
                  }`
                }
              >
                <BarChart2 className="mr-3 h-5 w-5 shrink-0" />
                {isSidebarOpen && <span>Statistika</span>}
              </NavLink>

              <NavLink
                to="couriers"
                className={({ isActive }) =>
                  `min-w-full justify-start flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-white/20 text-active-orange"
                      : "text-white hover:bg-white/10 hover:text-active-orange"
                  }`
                }
              >
                <Users className="mr-3 h-5 w-5 shrink-0" />
                {isSidebarOpen && <span>Kuryerlar</span>}
              </NavLink>

              <NavLink
                to="chefs"
                className={({ isActive }) =>
                  `min-w-full justify-start flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-white/20 text-active-orange"
                      : "text-white hover:bg-white/10 hover:text-active-orange"
                  }`
                }
              >
                <ChefHat className="mr-3 h-5 w-5 shrink-0" />
                {isSidebarOpen && <span>Oshpazlar</span>}
              </NavLink>
            </div>
          </nav>
        </aside>

        <div className="flex-1 p-4 md:p-6">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Outlet />
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;