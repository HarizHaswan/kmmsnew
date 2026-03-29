import * as SelectPrimitive from "@radix-ui/react-select";
import React from "react";

export function Select({ ...props }) {
  return <SelectPrimitive.Root {...props} />;
}

export function SelectTrigger({ className = "", ...props }) {
  return (
    <SelectPrimitive.Trigger
      className={
        "px-3 py-2 border rounded-lg w-full text-left " + className
      }
      {...props}
    />
  );
}

export function SelectContent({ className = "", ...props }) {
  return (
    <SelectPrimitive.Content
      className={
        "bg-white border rounded-lg shadow p-1 " + className
      }
      {...props}
    />
  );
}

export function SelectItem({ className = "", ...props }) {
  return (
    <SelectPrimitive.Item
      className={
        "px-3 py-2 rounded hover:bg-brand-bg cursor-pointer " + className
      }
      {...props}
    />
  );
}

export const SelectValue = SelectPrimitive.Value;
