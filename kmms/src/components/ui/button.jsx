import React from "react";

export function Button({ className = "", ...props }) {
  return (
    <button
      className={
        "px-4 py-2 rounded-lg font-medium bg-primary text-white hover:bg-primary-dark transition " +
        className
      }
      {...props}
    />
  );
}
