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
import { cn } from "@/lib/utils";

const Dashboard = () => {
  const isMobSmall = useMediaQuery({ maxWidth: 431 }); // mob_small breakpoint
  const [isSidebarOpen, setIsSidebarOpen] = useState(!isMobSmall);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    setIsSidebarOpen(!isMobSmall);
  }, [isMobSmall]);

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
          <div className="flex items-center">
            {/* Sidebar toggle button - always visible in header */}
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20 mr-2"
              onClick={() => setIsSidebarOpen((prev) => !prev)}
            >
              {isSidebarOpen ? (
                <PanelLeftClose className="h-5 w-5" />
              ) : (
                <PanelRightClose className="h-5 w-5" />
              )}
            </Button>
            <h1 className="text-2xl md:text-3xl font-bold">Admin Paneli</h1>
          </div>
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
          className={cn(
            "transition-all duration-300 flex-shrink-0 items-start border-r border-white/20 h-full",
            // Default styles for larger screens (pushing behavior)
            "bg-black/20", // Default background
            isSidebarOpen ? "w-64 p-4" : "w-20 p-2", // Default width and padding

            // Styles for mob_small (overlay behavior)
            isMobSmall && "mob_small:fixed mob_small:inset-y-0 mob_small:z-50 mob_small:bg-black/80 mob_small:w-64 mob_small:p-4",
            isMobSmall && (isSidebarOpen ? "mob_small:translate-x-0" : "mob_small:-translate-x-full")
          )}
        >
          <nav className="flex flex-col items-end gap-2 sticky top-[81px]">
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

        {/* Overlay for mob_small screens when sidebar is open */}
        {isMobSmall && isSidebarOpen && (
          <div
            className="mob_small:fixed mob_small:inset-0 mob_small:bg-black/50 mob_small:z-40"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        <div
          className={cn(
            "flex-1 p-4 md:p-6 transition-all duration-300",
            // Apply margin-left only if not mobSmall
            !isMobSmall && (isSidebarOpen ? "ml-64" : "ml-20")
          )}
        >
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