import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ListOrdered,
  Utensils,
  LogOut,
  PanelLeftClose,
  PanelRightClose,
} from "lucide-react";
import { motion } from "framer-motion";

import AdminDashboard from "@/components/AdminDashboard";
import AdminProducts from "@/components/AdminProducts";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";

const Dashboard = ({ products, orders, onUpdateOrderStatus }) => {
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
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
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
              className="w-full justify-start"
              onClick={() => setAdminView("orders")}
            >
              <ListOrdered className="mr-3 h-5 w-5" />
              {isSidebarOpen && "Buyurtmalar"}
            </Button>
            <Button
              variant={adminView === "products" ? "secondary" : "ghost"}
              className="w-full justify-start"
              onClick={() => setAdminView("products")}
            >
              <Utensils className="mr-3 h-5 w-5" />
              {isSidebarOpen && "Mahsulotlar"}
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
              />
            ) : (
              <AdminProducts products={products} />
            )}
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
