import React from 'react';

/**
 * Hàm hỗ trợ lấy thông tin danh hiệu dựa trên điểm uy tín
 * @param {number} score - Điểm uy tín
 * @returns {Object} - Gồm title (tên danh hiệu) và colorClass (các class CSS tailwind để tô màu)
 */
export const getRankDetails = (score) => {
  const rep = score || 0;
  if (rep < 10) {
    return {
      title: 'Tân binh',
      colorClass: 'bg-gray-100 dark:bg-gray-800/40 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700',
    };
  } else if (rep < 50) {
    return {
      title: 'Cộng tác viên',
      colorClass: 'bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-900/50',
    };
  } else if (rep < 150) {
    return {
      title: 'Thành viên tích cực',
      colorClass: 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/50',
    };
  } else if (rep < 500) {
    return {
      title: 'Chuyên gia',
      colorClass: 'bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900/50',
    };
  } else if (rep < 1500) {
    return {
      title: 'Huyền thoại',
      colorClass: 'bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-900/50 animate-pulse font-bold',
    };
  } else {
    return {
      title: 'Đại cao thủ',
      colorClass: 'bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-900/50 font-extrabold shadow-3xs',
    };
  }
};

const RankBadge = ({ score, className = "text-3xs px-2 py-0.5 border font-bold rounded-full" }) => {
  if (score === undefined || score === null) return null;
  const rank = getRankDetails(score);
  return (
    <span className={`inline-flex items-center justify-center ${rank.colorClass} ${className}`} title={`Danh hiệu dựa trên điểm uy tín (${score} điểm)`}>
      {rank.title}
    </span>
  );
};

export default RankBadge;
