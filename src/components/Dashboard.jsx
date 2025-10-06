import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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

import AdminDashboard from "@/components/AdminDashboard";
import AdminProducts from "@/components/AdminProducts";
import AdminStatistics from "@/components/AdminStatistics";
import AdminCouriers from "@/components/AdminCouriers";
import AdminChefs from "@/components/AdminChefs";
import AdminIngredients from "@/components/AdminIngredients"; // Yangi import
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";

const Dashboard = ({
  products,
  orders,
  onUpdateOrderStatus,
  curiers,
  chefs,
  ingredients,
  productIngredients,
}) => {
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
          className={`transition-all duration-300 flex-shrink-0 items-start border-r border-white/20 p-[0.87rem] pt-0 ${
            isSidebarOpen ? "w-64" : "w-20"
          } ${!isSidebarOpen ? "bg-[#332a00]/10 p-[1rem]" : ""}`}
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
              <Button
                variant={adminView === "orders" ? "secondary" : "ghost"}
                className={`min-w-full justify-start ${
                  adminView === "orders"
                    ? "bg-white/20 text-active-orange"
                    : "text-white hover:bg-white/10 hover:text-active-orange"
                }`}
                onClick={() => setAdminView("orders")}
              >
                <ListOrdered className="mr-3 h-5 w-5 shrink-0" />
                {isSidebarOpen && <span>Buyurtmalar</span>}
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
                <Utensils className="mr-3 h-5 w-5 shrink-0" />
                {isSidebarOpen && <span>Mahsulotlar</span>}
              </Button>

              <Button
                variant={adminView === "ingredients" ? "secondary" : "ghost"}
                className={`min-w-full justify-start ${
                  adminView === "ingredients"
                    ? "bg-white/20 text-active-orange"
                    : "text-white hover:bg-white/10 hover:text-active-orange"
                }`}
                onClick={() => setAdminView("ingredients")}
              >
                <Salad className="mr-3 h-5 w-5 shrink-0" />
                {isSidebarOpen && <span>Masalliqlar</span>}
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
                <BarChart2 className="mr-3 h-5 w-5 shrink-0" />
                {isSidebarOpen && <span>Statistika</span>}
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
                <Users className="mr-3 h-5 w-5 shrink-0" />
                {isSidebarOpen && <span>Kuryerlar</span>}
              </Button>

              <Button
                variant={adminView === "chefs" ? "secondary" : "ghost"}
                className={`min-w-full justify-start ${
                  adminView === "chefs"
                    ? "bg-white/20 text-active-orange"
                    : "text-white hover:bg-white/10 hover:text-active-orange"
                }`}
                onClick={() => setAdminView("chefs")}
              >
                <ChefHat className="mr-3 h-5 w-5 shrink-0" />
                {isSidebarOpen && <span>Oshpazlar</span>}
              </Button>
            </div>
          </nav>
        </aside>

        <div className="flex-1 p-4 md:p-6">
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
                chefs={chefs}
              />
            ) : adminView === "products" ? (
              <AdminProducts
                products={products}
                allIngredients={ingredients}
                allProductIngredients={productIngredients}
              />
            ) : adminView === "ingredients" ? (
              <AdminIngredients
                allProducts={products}
                allIngredients={ingredients}
                allProductIngredients={productIngredients}
              />
            ) : adminView === "statistics" ? (
              <AdminStatistics
                orders={orders}
                products={products}
                curiers={curiers}
                chefs={chefs}
                ingredients={ingredients}
                productIngredients={productIngredients}
              />
            ) : adminView === "couriers" ? (
              <AdminCouriers curiers={curiers} orders={orders} />
            ) : (
              <AdminChefs chefs={chefs} orders={orders} />
            )}
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
