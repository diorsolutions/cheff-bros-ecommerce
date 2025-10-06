import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const InfoModal = ({ isOpen, onClose, title, description, details = [] }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white/20 border-gray-700 sm:max-w-[425px]">
        <DialogHeader className="flex gap-1">
          <DialogTitle className="text-gray-300">{title}</DialogTitle>
          {description && (
            <DialogDescription className="text-red-100">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>
        <div className="space-y-2">
          {details.map((detail, index) => (
            <p key={index} className="text-red-200">
              <span className="font-semibold">{detail.label}:</span>{" "}
              {detail.value}
            </p>
          ))}
        </div>
        <div className="flex justify-end">
          <Button
            onClick={onClose}
            className="bg-orange-500 hover:bg-orange-600 text-white"
          >
            Yopish
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InfoModal;