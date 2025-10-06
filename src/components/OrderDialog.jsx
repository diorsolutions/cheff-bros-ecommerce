import React, { useState } from "react";
import {
  MapPin,
  Phone,
  User,
  Navigation,
  Edit3,
  Plus,
  Minus,
  X,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
}
from "@/components/ui/alert-dialog";
import { toast } from "@/components/ui/use-toast";
// useLocalStorage import olib tashlandi, chunki endi App.jsx dan prop sifatida keladi

const OrderDialog = ({
  isOpen,
  onClose,
  cartItems,
  onOrderSubmit,
  removeFromCart,
  decreaseCartItem,
  increaseCartItem,
  customerInfo, // Prop sifatida qabul qilindi
  setCustomerInfo, // Prop sifatida qabul qilindi
}) => {
  const [location, setLocation] = useState("");
  const [coordinates, setCoordinates] = useState(null); // Yangi holat: { lat, lng } ni saqlash uchun
  const [locationMethod, setLocationMethod] = useState("manual"); // 'manual' or 'auto'
  const [showLocationAlert, setShowLocationAlert] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  const totalPrice = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const handleLocationPermission = async () => {
    setIsGettingLocation(true);
    setShowLocationAlert(false);

    if (!navigator.geolocation) {
      toast({
        title: "Xatolik",
        description: "Brauzeringiz joylashuvni aniqlay olmaydi",
        variant: "destructive",
      });
      setLocationMethod("manual");
      setCoordinates(null); // Xato bo'lsa koordinatalarni tozalash
      setIsGettingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setCoordinates({ lat: latitude, lng: longitude }); // Koordinatalarni saqlash

        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
          );
          const data = await response.json();

          if (data && data.display_name) {
            setLocation(data.display_name);
            toast({
              title: "Joylashuv aniqlandi!",
              description: "Sizning joylashuvingiz muvaffaqiyatli aniqlandi.",
            });
          } else {
            setLocation(`${latitude}, ${longitude}`); // Agar API xato qilsa, koordinatalarni matn sifatida ko'rsatish
            toast({
              title: "Manzilni aniqlab bo'lmadi",
              description:
                "Joylashuv aniqlandi, ammo manzilni o'qiladigan shaklga o'girishda xatolik yuz berdi. Koordinatalar saqlandi.",
              variant: "destructive",
            });
          }
        } catch (apiError) {
          console.error("Reverse geocoding API xatosi:", apiError);
          setLocation(`${latitude}, ${longitude}`); // API xatosida ham koordinatalarni matn sifatida ko'rsatish
          toast({
            title: "Manzilni aniqlab bo'lmadi",
            description:
              "Joylashuv aniqlandi, ammo manzilni o'qiladigan shaklga o'girishda xatolik yuz berdi. Koordinatalar saqlandi.",
            variant: "destructive",
          });
        } finally {
          setIsGettingLocation(false);
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        setIsGettingLocation(false);
        setLocationMethod("manual");
        setCoordinates(null); // Xato bo'lsa koordinatalarni tozalash
        let errorMessage = "Iltimos, manzilni qo'lda kiriting";
        if (error.code === error.PERMISSION_DENIED) {
          errorMessage = "Joylashuvga ruxsat berilmagan. Iltimos, brauzer sozlamalarini tekshiring.";
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          errorMessage = "Joylashuv ma'lumotlari mavjud emas.";
        } else if (error.code === error.TIMEOUT) {
          errorMessage = "Joylashuvni aniqlash vaqti tugadi.";
        }
        toast({
          title: "Joylashuvni aniqlab bo'lmadi",
          description: errorMessage,
          variant: "destructive",
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const handleAutoLocation = () => {
    setLocationMethod("auto");
    setShowLocationAlert(true);
  };

  const handleLocationChange = (e) => {
    setLocation(e.target.value);
    // Agar foydalanuvchi avtomatik aniqlangan manzilni tahrirlasa, manual rejimga o'tkazamiz va koordinatalarni tozalaymiz
    if (locationMethod === "auto" && coordinates !== null) {
      setLocationMethod("manual");
      setCoordinates(null);
    }
  };

  const handleSubmitOrder = () => {
    if (!customerInfo.name || !customerInfo.phone || !location) {
      toast({
        title: "Ma'lumotlar to'liq emas",
        description: "Iltimos, barcha maydonlarni to'ldiring",
        variant: "destructive",
      });
      return;
    }

    const orderData = {
      items: cartItems.map((i) => ({
        id: i.id,
        name: i.name,
        price: i.price,
        quantity: i.quantity,
      })),
      customer: customerInfo,
      location,
      coordinates, // Koordinatalarni ham buyurtma ma'lumotlariga qo'shish
      totalPrice,
    };

    onOrderSubmit(orderData);
    onClose();
    setLocation("");
    setCoordinates(null); // Yuborilgandan keyin koordinatalarni tozalash
    setLocationMethod("manual"); // Rejimni manualga qaytarish
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent
          className="
      max-w-2xl max-h-[90vh] overflow-y-auto bg-white border-gray-300 text-gray-800 
      laptop:max-w-xl big_tablet:max-w-lg nor_tablet:max-w-md mob:max-w-sm mob:w-[95%] mob:rounded-lg
      p-6 mob:p-4 mob_small:p-3
    "
        >
          <DialogHeader>
            <DialogTitle
              className="
          text-2xl font-bold text-gray-800 
          laptop:text-xl big_tablet:text-lg mob:text-base
        "
            >
              Buyurtma berish
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* CART ITEMS */}
            <div className="space-y-3">
              <h3
                className="
            text-lg font-semibold text-gray-800 
            laptop:text-base mob:text-sm
          "
              >
                Buyurtma tafsilotlari
              </h3>
              {cartItems.map((item, index) => (
                <Card
                  key={index}
                  className="
              bg-gray-100 border-gray-300 
              mob:p-2 mob_small:p-1
            "
                >
                  <CardContent className="p-4 mob:p-2">
                    <div className="flex justify-between items-center flex-wrap gap-3 mob:gap-2">
                      <div>
                        <h4
                          className="
                      font-medium text-gray-800 
                      mob:text-sm extra_small:text-xs
                    "
                        >
                          {item.name}
                        </h4>
                        <p className="text-sm text-gray-600 mob:text-xs">
                          {item.quantity} dona
                        </p>
                      </div>
                      <div className="flex items-center gap-4 mob:gap-2">
                        <div className="flex items-center gap-2">
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() => decreaseCartItem(item.id)}
                            className="h-8 w-8 mob:h-6 mob:w-6"
                          >
                            <Minus className="h-4 w-4 mob:h-3 mob:w-3" />
                          </Button>
                          <span className="font-bold text-orange-500 text-lg mob:text-base">
                            {item.quantity}
                          </span>
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() => increaseCartItem(item.id)}
                            className="h-8 w-8 mob:h-6 mob:w-6"
                          >
                            <Plus className="h-4 w-4 mob:h-3 mob:w-3" />
                          </Button>
                        </div>
                        <span
                          className="
                      font-bold text-orange-500 
                      mob:text-sm extra_small:text-xs
                    "
                        >
                          {(item.price * item.quantity).toLocaleString()} so'm
                        </span>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => removeFromCart(item.id)}
                          className="text-red-500 hover:bg-red-100 mob:h-6 mob:w-6"
                        >
                          <X className="h-5 w-5 mob:h-4 mob:w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              <div className="bg-orange-100 p-4 mob:p-2 rounded-lg border border-orange-300">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-800 mob:text-base">
                    Jami:
                  </span>
                  <span className="text-2xl font-bold text-orange-500 mob:text-xl">
                    {totalPrice.toLocaleString()} so'm
                  </span>
                </div>
              </div>
            </div>

            {/* CONTACT FORM */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 mob:text-base">
                Aloqa ma'lumotlari
              </h3>
              <div className="space-y-3">
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-500 mob:h-3 mob:w-3" />
                  <Input
                    placeholder="Ismingiz"
                    value={customerInfo.name}
                    onChange={(e) =>
                      setCustomerInfo((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    className="pl-10 bg-gray-100 border-gray-300 text-gray-800 placeholder:text-gray-500 mob:text-sm"
                  />
                </div>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-500 mob:h-3 mob:w-3" />
                  <Input
                    placeholder="Telefon raqamingiz"
                    value={customerInfo.phone}
                    onChange={(e) =>
                      setCustomerInfo((prev) => ({
                        ...prev,
                        phone: e.target.value,
                      }))
                    }
                    className="pl-10 bg-gray-100 border-gray-300 text-gray-800 placeholder:text-gray-500 mob:text-sm"
                  />
                </div>
              </div>
            </div>

            {/* LOCATION */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 mob:text-base">
                Yetkazib berish manzili
              </h3>
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant={
                    locationMethod === "manual" ? "secondary" : "outline"
                  }
                  onClick={() => {
                    setLocationMethod("manual");
                    setCoordinates(null); // Manualga o'tganda koordinatalarni tozalash
                    setShowLocationAlert(false); // Alertni yopish
                  }}
                  className="flex-1 min-w-[140px] mob:text-sm"
                >
                  <Edit3 className="mr-2 h-4 w-4 mob:h-3 mob:w-3" />
                  Qo'lda kiritish
                </Button>
                <Button
                  variant={locationMethod === "auto" ? "secondary" : "outline"}
                  onClick={handleAutoLocation}
                  disabled={isGettingLocation}
                  className="flex-1 min-w-[140px] mob:text-sm"
                >
                  <Navigation className="mr-2 h-4 w-4 mob:h-3 mob:w-3" />
                  {isGettingLocation ? "Aniqlanmoqda..." : "Avtomatik aniqlash"}
                </Button>
              </div>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-500 mob:h-3 mob:w-3" />
                <Textarea
                  placeholder="Manzilni qo‘lda kiriting yoki joylashuvingizni aniqlashga ruxsat bering"
                  value={location}
                  onChange={handleLocationChange}
                  readOnly={locationMethod === "auto" && isGettingLocation} // Aniqlash jarayonida readOnly
                  className="pl-10 bg-gray-100 border-gray-300 text-gray-800 placeholder:text-gray-500 min-h-[80px] mob:text-sm"
                />
              </div>
            </div>

            <Button
              onClick={handleSubmitOrder}
              className="
          w-full bg-gradient-to-r from-orange-500 to-red-500 
          hover:from-orange-600 hover:to-red-600 text-white font-medium py-3 
          mob:py-2 mob:text-sm
        "
              size="lg"
            >
              Buyurtma berish
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showLocationAlert} onOpenChange={setShowLocationAlert}>
        <AlertDialogContent className="bg-white border-gray-300">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-gray-800">
              Joylashuvga ruxsat berish
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600">
              Joylashuvingizni avtomatik aniqlash uchun brauzeringizdan ruxsat
              berishingiz kerak. Davom etasizmi?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setShowLocationAlert(false);
                setLocationMethod("manual");
                setCoordinates(null); // Bekor qilinganda koordinatalarni tozalash
              }}
              className="text-gray-800 border-gray-300 hover:bg-gray-200"
            >
              Bekor qilish
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLocationPermission}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              Ruxsat berish
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default OrderDialog;