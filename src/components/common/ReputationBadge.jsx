import React from 'react';

const ReputationBadge = ({ score, className = "px-1.5 py-0.2 text-3xs shadow-3xs", title = "Điểm uy tín", showStar = true }) => {
  if (score === undefined || score === null) return null;
  
  return (
    <span 
      className={`inline-flex items-center rounded-full font-bold bg-amber-50 text-amber-700 border border-amber-100 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800 ${className}`} 
      title={title}
    >
      {showStar && "★ "}{score}
    </span>
  );
};

export default ReputationBadge;
