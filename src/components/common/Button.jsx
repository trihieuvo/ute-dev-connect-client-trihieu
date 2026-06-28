import React from "react";
import { Loader2 } from "lucide-react";

const Button = ({
  children,
  isLoading,
  onClick,
  type = "button",
  className = "",
  ...props
}) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isLoading}
      className={`w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-900 focus:ring-blue-500 dark:focus:ring-blue-400 disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-200 ease-in-out ${className}`}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" />
      ) : null}
      {children}
    </button>
  );
};

export default Button;
