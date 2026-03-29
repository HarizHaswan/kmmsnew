import React from "react";

export const Input = React.forwardRef(({ className = "", ...props }, ref) => (
  <input
    ref={ref}
    className={
      "w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all " +
      className
    }
    {...props}
  />
));
