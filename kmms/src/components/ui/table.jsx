import React from "react";

export function Table({ className = "", ...props }) {
  return (
    <table className={"w-full border-collapse " + className} {...props} />
  );
}

export function TableHeader(props) {
  return <thead className="bg-brand-bg" {...props} />;
}

export function TableHead({ className = "", ...props }) {
  return (
    <th className={"p-3 text-left font-medium text-gray-700 " + className} {...props} />
  );
}

export function TableBody(props) {
  return <tbody {...props} />;
}

export function TableRow({ className = "", ...props }) {
  return (
    <tr className={"border-b hover:bg-white " + className} {...props} />
  );
}

export function TableCell({ className = "", ...props }) {
  return (
    <td className={"p-3 text-sm text-gray-800 " + className} {...props} />
  );
}
