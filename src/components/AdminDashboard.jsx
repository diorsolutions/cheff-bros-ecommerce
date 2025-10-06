<motion.div
  className={cn(
    "flex items-center gap-2 px-4 py-2 rounded-lg border",
    newOrdersCount > 0
      ? "bg-gradient-to-r from-red-500 to-yellow-500 border-red-400 animate-gradient-pulse"
      : "bg-blue-500/20 border-blue-500/30"
  )}
  initial={newOrdersCount > 0 ? { x: 0 } : false}
  animate={newOrdersCount > 0 ? { x: [0, 5, 0, -5, 0] } : false}
  transition={newOrdersCount > 0 ? { repeat: Infinity, duration: 1.5, ease: "easeInOut" } : false}
>
  <Bell className={cn("h-5 w-5", newOrdersCount > 0 ? "text-white" : "text-blue-400")} />
  <span className={cn("font-medium", newOrdersCount > 0 ? "text-white" : "text-blue-400")}>
    {newOrdersCount} yangi buyurtma
  </span>
</motion.div>