import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";

const LOCK_ROW_ID = 1; // singleton row
const MAX_ATTEMPTS = 3; // necha marta xato qilish mumkin
const BLOCK_DURATION_MS = 2 * 60 * 60 * 1000; // 2 soat blok
// const BLOCK_DURATION_MS = 60 * 1000; // 1 minut blok (oldin shunday edi)

const secondsToHMS = (s) => {
  const h = Math.floor(s / 3600)
    .toString()
    .padStart(2, "0");
  const m = Math.floor((s % 3600) / 60)
    .toString()
    .padStart(2, "0");
  const sec = Math.floor(s % 60)
    .toString()
    .padStart(2, "0");
  return `${h} : ${m} : ${sec}`;
};

const LoginPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [blockedUntil, setBlockedUntil] = useState(null);
  const [now, setNow] = useState(Date.now());
  const [loginMode, setLoginMode] = useState("admin"); // 'admin' or 'curier'
  const navigate = useNavigate();
  const { toast } = useToast();

  const remainingSec = useMemo(() => {
    if (!blockedUntil) return 0;
    const end = new Date(blockedUntil).getTime();
    return Math.max(0, Math.floor((end - now) / 1000));
  }, [blockedUntil, now]);

  const isBlocked = remainingSec > 0;

  // DB dan blok holatini olish
  useEffect(() => {
    const fetchLock = async () => {
      try {
        const { data, error } = await supabase
          .from("admin_login_state")
          .select("attempts, blocked_until")
          .eq("id", LOCK_ROW_ID)
          .maybeSingle();

        if (error && error.code !== "PGRST116") {
          console.warn("admin_login_state fetch error", error);
          return;
        }

        if (!data) {
          // agar hali yo‘q bo‘lsa, row yaratib qo‘yiladi
          await supabase
            .from("admin_login_state")
            .upsert({ id: LOCK_ROW_ID, attempts: 0, blocked_until: null });
          setAttempts(0);
          setBlockedUntil(null);
        } else {
          setAttempts(data.attempts || 0);
          setBlockedUntil(data.blocked_until);
        }
      } catch (e) {
        console.warn("admin_login_state unexpected error", e);
      }
    };
    fetchLock();
  }, []);

  // har sekund yangilab turish (timer uchun)
  useEffect(() => {
    if (!blockedUntil) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [blockedUntil]);

  // DB ga blok holatini yozish
  const updateLock = async (nextAttempts, nextBlockedUntil) => {
    try {
      await supabase
        .from("admin_login_state")
        .upsert({
          id: LOCK_ROW_ID,
          attempts: nextAttempts,
          blocked_until: nextBlockedUntil,
        });
      setAttempts(nextAttempts);
      setBlockedUntil(nextBlockedUntil);
    } catch (e) {
      console.warn("admin_login_state upsert fatal", e);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    if (isBlocked) {
      toast({
        title: "Bloklangan",
        description:
          "Siz 3 marta noto'g'ri login yoki parol kiritdingiz, keyinroq urinib ko'ring.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    if (loginMode === "admin") {
      const ok =
        username.trim().toLowerCase() === "admin" && password === "cheffbro";

      if (!ok) {
        const nextAttempts = attempts + 1;
        let nextBlockedUntil = null;

        if (nextAttempts >= MAX_ATTEMPTS) {
          nextBlockedUntil = new Date(
            Date.now() + BLOCK_DURATION_MS
          ).toISOString();
          toast({
            title: "Bloklandi",
            description: "3 marta xato kiritdingiz. 2 soat kuting.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Kirishda xatolik",
            description: "Login yoki parol noto'g'ri.",
            variant: "destructive",
          });
        }

        await updateLock(nextAttempts, nextBlockedUntil);
        setLoading(false);
        return;
      }

      // To‘g‘ri login
      await updateLock(0, null);

      const email = "admin@admin.com";
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast({
          title: "Kirish muvaffaqiyatsiz",
          description:
            "Hisob topilmadi. Supabase-da admin@admin.com foydalanuvchisini yarating.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      navigate("/dashboard", { replace: true });
      setLoading(false);
    } else if (loginMode === "curier") {
      // Kuryer login logikasi
      const { data, error } = await supabase
        .from("curiers")
        .select("id, username, password_hash, name") // name ustunini ham olamiz
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

      // Parolni tekshirish (Haqiqiy ilovalarda xashlangan parolni solishtiring!)
      const isPasswordCorrect = password === data.password_hash; // Bu yerda xashlangan parolni solishtirish kerak

      if (!isPasswordCorrect) {
        toast({
          title: "Kirishda xatolik",
          description: "Login yoki parol noto'g'ri.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Muvaffaqiyatli kuryer login
      localStorage.setItem("curierLoggedIn", "true");
      localStorage.setItem("curierUsername", data.username); // Username'ni saqlaymiz
      localStorage.setItem("curierId", data.id); // ID'ni saqlaymiz
      toast({
        title: "Muvaffaqiyatli!",
        description: "Kuryer paneliga xush kelibsiz.",
      });
      navigate("/curier", { replace: true });
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 flex items-center justify-center px-4">
      <Card className="w-full max-w-[380px] bg-white/10 border-white/20 text-white">
        <CardHeader>
          <CardTitle className="text-center text-2xl">
            {loginMode === "admin" ? "Admin Kirishi" : "Kuryer Kirishi"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center gap-2 mb-6">
            <Button
              variant={loginMode === "admin" ? "secondary" : "outline"}
              onClick={() => {
                setLoginMode("admin");
                setUsername("");
                setPassword("");
              }}
              className="flex-1"
            >
              Admin
            </Button>
            <Button
              variant={loginMode === "curier" ? "secondary" : "outline"}
              onClick={() => {
                setLoginMode("curier");
                setUsername("");
                setPassword("");
              }}
              className="flex-1"
            >
              Kuryer
            </Button>
          </div>

          {isBlocked && loginMode === "admin" ? (
            <div className="space-y-4">
              <div className="p-4 rounded-md border border-red-500/40 bg-red-500/10 text-red-300 text-sm sm:text-base">
                Siz 3 marta noto'g'ri login yoki parol kiritdingiz, keyinroq
                urinib ko'ring!
              </div>
              <div className="p-4 rounded-md border border-red-500/40 bg-red-500/10 text-center">
                <div className="text-xs uppercase tracking-wide text-red-300 mb-1">
                  Bloklangan vaqt
                </div>
                <div className="text-2xl font-bold text-red-400">
                  {secondsToHMS(remainingSec)}
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleLogin} className="space-y-4">
              <Input
                placeholder="Login"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="bg-white/10 border-white/20"
                required
              />
              <Input
                type="password"
                placeholder="Parol"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-white/10 border-white/20"
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
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;