import React, { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useLocalStorage } from "@/hooks/useLocalStorage";

const MiniChat = ({ messages, isPopoverOpen, setIsPopoverOpen }) => {
  // useRef deklaratsiyalari eng boshida
  const messagesEndRef = useRef(null);
  const messagesLengthAtLastRenderRef = useRef(0); // Dastlab 0 bilan boshlaymiz

  const [readMessageIds, setReadMessageIds] = useLocalStorage("readMessageIds", {});
  const [showNewMessageIndicatorId, setShowNewMessageIndicatorId] = useState(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // messagesLengthAtLastRenderRef ni har doim yangilab turish uchun alohida useEffect
  useEffect(() => {
    messagesLengthAtLastRenderRef.current = messages.length;
  }, [messages.length]);

  const currentUnreadCount = useMemo(() => {
    if (isPopoverOpen) return 0; // Chat ochiq bo'lsa, o'qilmaganlar soni 0
    return messages.filter((msg) => !readMessageIds[msg.id]).length;
  }, [messages, isPopoverOpen, readMessageIds]);

  useEffect(() => {
    // Agar popover ochilgan bo'lsa
    if (isPopoverOpen) {
      // Barcha joriy xabarlarni o'qilgan deb belgilash
      setReadMessageIds((prev) => {
        const newReadIds = { ...prev };
        let changed = false;
        messages.forEach((msg) => {
          if (!newReadIds[msg.id]) { // Faqat o'qilmagan xabarlarni belgilash
            newReadIds[msg.id] = true;
            changed = true;
          }
        });
        if (changed) {
          return newReadIds;
        }
        return prev; // O'zgarish bo'lmasa, keraksiz re-renderlardan qochish
      });
      setShowNewMessageIndicatorId(null); // Indikatorni tozalash
    } else {
      // Agar popover yopiq bo'lsa va yangi xabar kelgan bo'lsa
      const prevMessagesLength = messagesLengthAtLastRenderRef.current;
      if (messages.length > prevMessagesLength) {
        const newMessages = messages.slice(prevMessagesLength);
        const firstUnreadNewMessage = newMessages.find(msg => !readMessageIds[msg.id]);
        if (firstUnreadNewMessage) {
          setShowNewMessageIndicatorId(firstUnreadNewMessage.id);
        }
      }
    }
  }, [isPopoverOpen, messages, readMessageIds, setReadMessageIds]);

  // Avtomatik aylantirishni boshqarish uchun alohida useEffect
  // Endi har safar popover ochilganda ishlaydi
  useEffect(() => {
    if (isPopoverOpen) {
      // setTimeout orqali scrollni biroz kechiktiramiz,
      // bu DOM elementlari to'liq render bo'lishini ta'minlaydi.
      const timer = setTimeout(() => {
        scrollToBottom();
      }, 0); 
      return () => clearTimeout(timer); // Cleanup the timer
    }
  }, [isPopoverOpen]); // Faqat isPopoverOpen holati o'zgarganda ishga tushadi


  return (
    <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
      <PopoverTrigger asChild>
        <Button className="relative w-10 h-10 p-3 rounded-full bg-gradient-to-r text-white from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 shadow-lg">
          {isPopoverOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <MessageCircle className="h-5 w-5" />
          )}
          {currentUnreadCount > 0 && !isPopoverOpen && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center border-2 border-white"
            >
              <span className="text-xs text-white font-bold">
                {currentUnreadCount}
              </span>
            </motion.div>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 h-96 p-0 bg-white border-gray-500">
        <Card className="h-full flex flex-col bg-white border-gray-300">
          <CardHeader className="pb-3">
            <CardTitle className="text-gray-800 text-lg">Xabarlar</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 ? (
              <p className="text-gray-600 text-center text-sm">
                Hozircha xabarlar yo'q
              </p>
            ) : (
              messages.map((message, index) => (
                <React.Fragment key={message.id}>
                  {showNewMessageIndicatorId === message.id && (
                    <div className="relative flex justify-center my-4">
                      <span className="absolute top-1/2 left-0 w-full h-px bg-gray-300" />
                      <span className="relative z-10 px-3 py-1 bg-white text-gray-500 text-xs rounded-full border border-gray-300">
                        Yangi xabar
                      </span>
                    </div>
                  )}
                  <motion.div
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`shadow-[0px_0px_29px_-2px_rgba(0,_0,_0,_0.1)] p-3 rounded-lg max-w-[85%] bg-white border border-blue-200 text-blue-600 ${
                      index === messages.length - 1 ? "opacity-100" : "opacity-50"
                    }`}
                  >
                    <p className="text-sm text-black/70 font-semibold">
                      {message.text}
                    </p>
                    <span className="text-xs text-black/70 opacity-90 block text-right mt-1">
                      {(() => {
                        const date = new Date(message.timestamp);

                        const oylar = [
                          "yanvar",
                          "fevral",
                          "mart",
                          "aprel",
                          "may",
                          "iyun",
                          "iyul",
                          "avgust",
                          "sentabr",
                          "oktyabr",
                          "noyabr",
                          "dekabr",
                        ];

                        const year = date.getFullYear();
                        const day = date.getDate();
                        const monthName = oylar[date.getMonth()];
                        const hours = date
                          .getHours()
                          .toString()
                          .padStart(2, "0");
                        const minutes = date
                          .getMinutes()
                          .toString()
                          .padStart(2, "0");

                        return `${year}, ${day}-${monthName}, soat: ${hours}:${minutes}`;
                      })()}
                    </span>
                  </motion.div>
                </React.Fragment>
              ))
            )}
            <div ref={messagesEndRef} />
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  );
};

export default MiniChat;