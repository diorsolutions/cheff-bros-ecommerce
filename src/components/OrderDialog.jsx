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
} from "@/components/ui/alert-dialog";
import { toast } from "@/components/ui/use-toast";
import { useLocalStorage } from "@/hooks/useLocalStorage";

const OrderDialog = ({
  isOpen,
  onClose,
  cartItems,
  onOrderSubmit,
  removeFromCart,
  decreaseCartItem,
  increaseCartItem,
}) => {
  const [customerInfo, setCustomerInfo] = useLocalStorage("customerInfo", {
    name: "",
    phone: "",
  });
  const [location, setLocation] = useState("");
  const [locationMethod, setLocationMethod] = useState("manual"); // 'manual' or 'auto'
  const [showLocationAlert, setShowLocationAlert] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  const totalPrice = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const handleLocationPermission = () => {
    setIsGettingLocation(true);
    setShowLocationAlert(false);

    if (!navigator.geolocation) {
      toast({
        title: "Xatolik",
        description: "Brauzeringiz joylashuvni aniqlay olmaydi",
        variant: "destructive",
      });
      setLocationMethod("manual");
      setIsGettingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setLocation(`${latitude}, ${longitude}`);
        setIsGettingLocation(false);
        toast({
          title: "Joylashuv aniqlandi!",
          description: "Sizning joylashuvingiz muvaffaqiyatli aniqlandi",
        });
      },
      () => {
        setIsGettingLocation(false);
        setLocationMethod("manual");
        toast({
          title: "Joylashuvni aniqlab bo'lmadi",
          description: "Iltimos, manzilni qo'lda kiriting",
          variant: "destructive",
        });
      }
    );
  };

  const handleAutoLocation = () => {
    setLocationMethod("auto");
    setShowLocationAlert(true);
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
      totalPrice,
    };

    onOrderSubmit(orderData);
    onClose();
    setLocation("");
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white border-gray-300 text-gray-800"> {/* Dialog rangi va matn rangi yangilandi */}
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-800"> {/* Matn rangi yangilandi */}
              Buyurtma berish
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-800"> {/* Matn rangi yangilandi */}
                Buyurtma tafsilotlari
              </h3>
              {cartItems.map((item, index) => (
                <Card key={index} className="bg-gray-100 border-gray-300"> {/* Card rangi va chegarasi yangilandi */}
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-medium text-gray-800">{item.name}</h4> {/* Matn rangi yangilandi */}
                        <p className="text-sm text-gray-600"> {/* Matn rangi yangilandi */}
                          {item.quantity} dona
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() => decreaseCartItem(item.id)}
                            className="h-8 w-8 bg-gray-100 border-gray-300 text-gray-800" {/* Ranglar yangilandi */}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="font-bold text-orange-500 text-lg"> {/* Matn rangi yangilandi */}
                            {item.quantity}
                          </span>
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() => increaseCartItem(item.id)}
                            className="h-8 w-8 bg-gray-100 border-gray-300 text-gray-800" {/* Ranglar yangilandi */}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        <span className="font-bold text-orange-500"> {/* Matn rangi yangilandi */}
                          {(item.price * item.quantity).toLocaleString()} so'm
                        </span>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => removeFromCart(item.id)}
                          className="text-red-500 hover:bg-red-100" {/* Ranglar yangilandi */}
                        >
                          <X className="h-5 w-5" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              <div className="bg-orange-100 p-4 rounded-lg border border-orange-300"> {/* Ranglar yangilandi */}
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-800"> {/* Matn rangi yangilandi */}
                    Jami:
                  </span>
                  <span className="text-2xl font-bold text-orange-500"> {/* Matn rangi yangilandi */}
                    {totalPrice.toLocaleString()} so'm
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800"> {/* Matn rangi yangilandi */}
                Aloqa ma'lumotlari
              </h3>
              <div className="space-y-3">
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-500" /> {/* Icon rangi yangilandi */}
                  <Input
                    placeholder="Ismingiz"
                    value={customerInfo.name}
                    onChange={(e) =>
                      setCustomerInfo((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    className="pl-10 bg-gray-100 border-gray-300 text-gray-800 placeholder:text-gray-500" {/* Ranglar yangilandi */}
                  />
                </div>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-500" /> {/* Icon rangi yangilandi */}
                  <Input
                    placeholder="Telefon raqamingiz"
                    value={customerInfo.phone}
                    onChange={(e) =>
                      setCustomerInfo((prev) => ({
                        ...prev,
                        phone: e.target.value,
                      }))
                    }
                    className="pl-10 bg-gray-100 border-gray-300 text-gray-800 placeholder:text-gray-500" {/* Ranglar yangilandi */}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800"> {/* Matn rangi yangilandi */}
                Yetkazib berish manzili
              </h3>
              <div className="flex gap-2">
                <Button
                  variant={
                    locationMethod === "manual" ? "secondary" : "outline"
                  }
                  onClick={() => setLocationMethod("manual")}
                  className="flex-1 bg-gray-100 text-gray-800 border-gray-300 hover:bg-gray-200 data-[state=active]:bg-orange-500 data-[state=active]:text-white" {/* Ranglar yangilandi */}
                >
                  <Edit3 className="mr-2 h-4 w-4" />
                  Qo'lda kiritish
                </Button>
                <Button
                  variant={locationMethod === "auto" ? "secondary" : "outline"}
                  onClick={handleAutoLocation}
                  disabled={isGettingLocation}
                  className="flex-1 bg-gray-100 text-gray-800 border-gray-300 hover:bg-gray-200 data-[state=active]:bg-orange-500 data-[state=active]:text-white" {/* Ranglar yangilandi */}
                >
                  <Navigation className="mr-2 h-4 w-4" />
                  {isGettingLocation ? "Aniqlanmoqda..." : "Avtomatik aniqlash"}
                </Button>
              </div>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-500" /> {/* Icon rangi yangilandi */}
                <Textarea
                  placeholder="Manzilni kiriting yoki avtomatik aniqlang"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  disabled={locationMethod === "auto" && !location}
                  className="pl-10 bg-gray-100 border-gray-300 text-gray-800 placeholder:text-gray-500 min-h-[80px]" {/* Ranglar yangilandi */}
                />
              </div>
            </div>

            <Button
              onClick={handleSubmitOrder}
              className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-medium py-3"
              size="lg"
            >
              Buyurtma berish
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showLocationAlert} onOpenChange={setShowLocationAlert}>
        <AlertDialogContent className="bg-white border-gray-300 text-gray-800"> {/* Dialog rangi va matn rangi yangilandi */}
          <AlertDialogHeader>
            <AlertDialogTitle className="text-gray-800"> {/* Matn rangi yangilandi */}
              Joylashuvga ruxsat
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600"> {/* Matn rangi yangilandi */}
              Iltimos, manzilingizni avtomatik aniqlashimiz uchun joylashuvga
              ruxsat bering
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setLocationMethod("manual");
                setShowLocationAlert(false);
              }}
              className="text-gray-800 border-gray-300 hover:bg-gray-200" {/* Ranglar yangilandi */}
            >
              Bekor qilish
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleLocationPermission} className="bg-orange-500 hover:bg-orange-600 text-white"> {/* Ranglar yangilandi */}
              Ruxsat berish
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default OrderDialog;