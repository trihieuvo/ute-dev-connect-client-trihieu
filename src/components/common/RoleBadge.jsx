import React from 'react';

const RoleBadge = ({ role, label, className = "px-2 py-0.5 text-2xs" }) => {
  let styleClass = "bg-gray-50 text-gray-700 border-gray-100 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700";
  
  if (role === 'admin') {
    styleClass = "bg-purple-50 text-purple-700 border-purple-100 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800";
  } else if (role === 'moderator') {
    styleClass = "bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800";
  } else if (role === 'verified' || role === 'active') {
    styleClass = "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800";
  } else if (role === 'warning') {
    styleClass = "bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800";
  } else if (role === 'danger') {
    styleClass = "bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800";
  }

  return (
    <span className={`inline-flex items-center rounded-full font-semibold border whitespace-nowrap ${styleClass} ${className}`}>
      {label || role}
    </span>
  );
};

export default RoleBadge;
