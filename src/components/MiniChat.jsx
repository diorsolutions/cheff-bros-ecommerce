<motion.div
  layout
  initial={{ opacity: 0, x: -20 }}
  animate={{ opacity: 1, x: 0 }}
  className={`shadow-[0px_0px_29px_-2px_rgba(0,_0,_0,_0.1)] p-3 rounded-lg max-w-[85%] bg-white border border-blue-200 text-blue-600 ${
    readMessageIds[message.id] ? "opacity-50" : "opacity-100"
  }`}
>
  {/* ... */}
</motion.div>