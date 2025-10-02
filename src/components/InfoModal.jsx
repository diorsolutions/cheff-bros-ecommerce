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
      <DialogContent className="bg-white border-gray-300 sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-gray-800">{title}</DialogTitle>
          {description && (
            <DialogDescription className="text-gray-600">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>
        <div className="py-4 space-y-2">
          {details.map((detail, index) => (
            <p key={index} className="text-gray-700">
              <span className="font-semibold">{detail.label}:</span> {detail.value}
            </p>
          ))}
        </div>
        <div className="flex justify-end">
          <Button onClick={onClose} className="bg-orange-500 hover:bg-orange-600 text-white">
            Yopish
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InfoModal;