import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";

const ChefLoginPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e) => {
    e.preventDefault();

    setLoading(true);

    const { data, error } = await supabase
      .from("chefs")
      .select("id, username, password_hash, name")
      .eq("username", username)
      .single();

    if (error || !data) {
      toast({
        title: "Kirishda xatolik",
        description: "Login yoki parol noto'g'ri.",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    const isPasswordCorrect = password === data.password_hash; // Haqiqiy ilovalarda parolni xashlash kerak!

    if (!isPasswordCorrect) {
      toast({
        title: "Kirishda xatolik",
        description: "Login yoki parol noto'g'ri.",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    localStorage.setItem("chefLoggedIn", "true");
    localStorage.setItem("chefUsername", data.username);
    localStorage.setItem("chefId", data.id);
    toast({
      title: "Muvaffaqiyatli!",
      description: "Oshpaz paneliga xush kelibsiz.",
    });
    navigate("/chef", { replace: true });
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#f2f2f2] flex items-center justify-center px-4">
      <Card className="w-full max-w-[380px] bg-white border-gray-300 text-gray-800">
        <CardHeader>
          <CardTitle className="text-center text-2xl text-gray-800">
            Oshpaz Kirishi
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <Input
              placeholder="Login"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="bg-gray-100 border-gray-300 text-gray-800 placeholder:text-gray-500"
              required
            />
            <Input
              type="password"
              placeholder="Parol"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-gray-100 border-gray-300 text-gray-800 placeholder:text-gray-500"
              required
            />
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-orange-500 to-red-500"
              disabled={loading}
            >
              {loading ? "Kirilmoqda..." : "Kirish"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ChefLoginPage;