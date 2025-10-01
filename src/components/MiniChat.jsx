import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const MiniChat = ({ messages }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [lastMessageCount, setLastMessageCount] = useState(0);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  useEffect(() => {
    if (messages.length > lastMessageCount && !isOpen && lastMessageCount > 0) {
      const newMessagesCount = messages.length - lastMessageCount;
      setUnreadCount((prev) => prev + newMessagesCount);
    }
    setLastMessageCount(messages.length);
  }, [messages.length]);

  const handleToggleChat = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setUnreadCount(0);
    }
  };

  return (
    <>
      <motion.div
        className="fixed bottom-6 right-6 z-50"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 1 }}
      >
        <Button
          onClick={handleToggleChat}
          className="w-14 h-14 rounded-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 shadow-lg"
        >
          {isOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <MessageCircle className="h-6 w-6" />
          )}
        </Button>
        {unreadCount > 0 && !isOpen && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center border-2 border-white" {/* Chegara rangi yangilandi */}
          >
            <span className="text-xs text-white font-bold">{unreadCount}</span>
          </motion.div>
        )}
      </motion.div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.8 }}
            className="fixed bottom-24 right-6 z-40 w-80 h-96"
          >
            <Card className="h-full flex flex-col bg-white border-gray-300"> {/* Card rangi va chegarasi yangilandi */}
              <CardHeader className="pb-3">
                <CardTitle className="text-gray-800 text-lg">Xabarlar</CardTitle> {/* Matn rangi yangilandi */}
              </CardHeader>

              <CardContent className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 ? (
                  <p className="text-gray-600 text-center text-sm"> {/* Matn rangi yangilandi */}
                    Hozircha xabarlar yo'q
                  </p>
                ) : (
                  messages.map((message) => (
                    <motion.div
                      key={message.id}
                      layout
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="p-3 rounded-lg max-w-[85%] bg-blue-100 border border-blue-300 text-blue-600" /* Ranglar yangilandi */
                    >
                      <p className="text-sm">{message.text}</p>
                      <span className="text-xs opacity-70 block text-right mt-1">
                        {new Date(message.timestamp).toLocaleTimeString(
                          "uz-UZ"
                        )}
                      </span>
                    </motion.div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default MiniChat;