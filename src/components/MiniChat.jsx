import React, { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"; // Popover import qilindi

const MiniChat = ({ messages }) => {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false); // Popover holati
  const [readMessageIds, setReadMessageIds] = useState({}); // Stores IDs of messages that have been read
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Calculate unread count based on messages and readMessageIds
  const currentUnreadCount = useMemo(() => {
    if (isPopoverOpen) return 0; // If chat is open, no unread count
    return messages.filter((msg) => !readMessageIds[msg.id]).length;
  }, [messages, isPopoverOpen, readMessageIds]);

  useEffect(() => {
    if (isPopoverOpen) {
      scrollToBottom();
      // Mark all current messages as read when chat is opened, merging with previous read messages
      setReadMessageIds((prev) => {
        const newReadIds = { ...prev }; // Start with previously read messages
        messages.forEach((msg) => {
          newReadIds[msg.id] = true;
        });
        return newReadIds;
      });
    }
  }, [isPopoverOpen, messages]); // messages is a dependency to ensure all current messages are marked read

  return (
    <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
      <PopoverTrigger asChild>
        <Button
          className="relative w-10 h-10 rounded-full bg-gradient-to-r text-white from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 shadow-lg"
        >
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
      <PopoverContent className="w-80 h-96 p-0 bg-white border-gray-300">
        <Card className="h-full flex flex-col bg-white border-gray-300">
          <CardHeader className="pb-3">
            <CardTitle className="text-gray-800 text-lg">
              Xabarlar
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 ? (
              <p className="text-gray-600 text-center text-sm">
                Hozircha xabarlar yo'q
              </p>
            ) : (
              messages.map((message) => (
                <motion.div
                  key={message.id}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`p-3 rounded-lg max-w-[85%] bg-blue-100 border border-blue-300 text-blue-600 ${
                    readMessageIds[message.id]
                      ? "opacity-50"
                      : "opacity-100"
                  }`}
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
      </PopoverContent>
    </Popover>
  );
};

export default MiniChat;