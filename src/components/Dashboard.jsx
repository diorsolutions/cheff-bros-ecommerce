import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ListOrdered,
  Utensils,
  LogOut,
  PanelLeftClose,
  PanelRightClose,
  BarChart2, // Yangi icon
  Users, // Kuryerlar uchun icon
} from "lucide-react";
import { motion } from "framer-motion";

import AdminDashboard from "@/components/AdminDashboard";
import AdminProducts from "@/components/AdminProducts";
import AdminStatistics from "@/components/AdminStatistics"; // Yangi import
import AdminCouriers from "@/components/AdminCouriers"; // Yangi import
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";

const Dashboard = ({ products, orders, onUpdateOrderStatus, curiers }) => {
  const [adminView, setAdminView] = useState("orders");
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
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 text-white">
      <header className="bg-black/20 backdrop-blur-lg border-b border-white/10 sticky top-0 z-30">
        <div className="mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Admin Paneli</h1>
          <Button onClick={handleSignOut} variant="ghost">
            <LogOut className="mr-2 h-4 w-4" />
            Chiqish
          </Button>
        </div>
      </header>
      <main className="flex">
        <aside
          className={`transition-all duration-300 ${
            isSidebarOpen ? "w-64" : "w-20"
          } border-r border-white/20 p-4 pt-2`}
        >
          <nav className="flex flex-col items-start gap-2 sticky top-[81px]">
            <Button
              variant="ghost"
              size="icon"
              className="self-end mb-4"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            >
              {isSidebarOpen ? (
                <PanelLeftClose className="h-5 w-5" />
              ) : (
                <PanelRightClose className="h-5 w-5" />
              )}
            </Button>
            <Button
              variant={adminView === "orders" ? "secondary" : "ghost"}
              className={`min-w-full justify-start ${
                adminView === "orders"
                  ? "bg-white/20 text-active-orange"
                  : "text-white hover:bg-white/10 hover:text-active-orange"
              }`}
              onClick={() => setAdminView("orders")}
            >
              <ListOrdered className="mr-3 h-5 w-5" />
              {isSidebarOpen && "Buyurtmalar"}
            </Button>
            <Button
              variant={adminView === "products" ? "secondary" : "ghost"}
              className={`min-w-full justify-start ${
                adminView === "products"
                  ? "bg-white/20 text-active-orange"
                  : "text-white hover:bg-white/10 hover:text-active-orange"
              }`}
              onClick={() => setAdminView("products")}
            >
              <Utensils className="mr-3 h-5 w-5" />
              {isSidebarOpen && "Mahsulotlar"}
            </Button>
            <Button
              variant={adminView === "statistics" ? "secondary" : "ghost"}
              className={`min-w-full justify-start ${
                adminView === "statistics"
                  ? "bg-white/20 text-active-orange"
                  : "text-white hover:bg-white/10 hover:text-active-orange"
              }`}
              onClick={() => setAdminView("statistics")}
            >
              <BarChart2 className="mr-3 h-5 w-5" />
              {isSidebarOpen && "Statistika"}
            </Button>
            <Button
              variant={adminView === "couriers" ? "secondary" : "ghost"}
              className={`min-w-full justify-start ${
                adminView === "couriers"
                  ? "bg-white/20 text-active-orange"
                  : "text-white hover:bg-white/10 hover:text-active-orange"
              }`}
              onClick={() => setAdminView("couriers")}
            >
              <Users className="mr-3 h-5 w-5" />
              {isSidebarOpen && "Kuryerlar"}
            </Button>
          </nav>
        </aside>
        <div className="flex-1 p-6">
          <motion.div
            key={adminView}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {adminView === "orders" ? (
              <AdminDashboard
                orders={orders}
                onUpdateOrderStatus={onUpdateOrderStatus}
                curiers={curiers}
              />
            ) : adminView === "products" ? (
              <AdminProducts products={products} />
            ) : adminView === "statistics" ? (
              <AdminStatistics
                orders={orders}
                products={products}
                curiers={curiers}
              />
            ) : (
              <AdminCouriers curiers={curiers} orders={orders} />
            )}
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
