import React, { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useLocalStorage } from "@/hooks/useLocalStorage";

const MiniChat = ({ messages, isPopoverOpen, setIsPopoverOpen }) => {
  const [readMessageIds, setReadMessageIds] = useLocalStorage("readMessageIds", {});
  const [showNewMessageIndicatorId, setShowNewMessageIndicatorId] = useState(null); // New state for indicator
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const currentUnreadCount = useMemo(() => {
    if (isPopoverOpen) return 0;
    return messages.filter((msg) => !readMessageIds[msg.id]).length;
  }, [messages, isPopoverOpen, readMessageIds]);

  useEffect(() => {
    if (isPopoverOpen) {
      // When opening the chat, identify the first unread message to show the indicator
      const firstUnread = messages.find((msg) => !readMessageIds[msg.id]);
      if (firstUnread) {
        setShowNewMessageIndicatorId(firstUnread.id);
      } else {
        setShowNewMessageIndicatorId(null);
      }

      scrollToBottom();
      // Mark all current messages as read when chat is opened
      setReadMessageIds((prev) => {
        const newReadIds = { ...prev };
        messages.forEach((msg) => {
          newReadIds[msg.id] = true;
        });
        return newReadIds;
      });
    } else {
      // When closing the chat, clear the indicator
      setShowNewMessageIndicatorId(null);
    }
  }, [isPopoverOpen, messages, readMessageIds]); // readMessageIds is a dependency here to correctly identify first unread

  // Also, scroll to bottom when new messages arrive *while the chat is already open*
  useEffect(() => {
    if (isPopoverOpen) {
      scrollToBottom();
    }
  }, [messages.length, isPopoverOpen]); // Trigger scroll when message count changes and chat is open

  return (
    <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
      <PopoverTrigger asChild>
        <Button
          className="relative w-10 h-10 p-3 rounded-full bg-gradient-to-r text-white from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 shadow-lg"
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
      <PopoverContent className="w-80 h-96 p-0 bg-white border-gray-500">
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