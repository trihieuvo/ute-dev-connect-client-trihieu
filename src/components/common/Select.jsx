import React from 'react';

const Select = ({ label, options, value, onChange, error, icon: Icon, required = false, name, ...props }) => {
  return (
    <div className="mb-4 relative">
      {label && <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label} {required && <span className="text-red-500 dark:text-red-400">*</span>}</label>}
      <div className="relative">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
          </div>
        )}
        <select
          name={name}
          className={`block w-full rounded-md py-2.5 text-gray-900 dark:text-gray-100 shadow-sm ring-1 ring-inset sm:text-sm sm:leading-6 focus:outline-none focus:ring-2 focus:ring-inset
            ${Icon ? 'pl-10' : 'pl-3'}
            ${error ? 'ring-red-300 dark:ring-red-500/50 focus:ring-red-500' : 'ring-gray-300 dark:ring-gray-700 focus:ring-blue-600 dark:focus:ring-blue-500'}
            transition-colors duration-200 ease-in-out
            bg-white dark:bg-gray-900
          `}
          value={value}
          onChange={onChange}
          {...props}
        >
          <option value="" disabled>-- Chọn {label ? label.toLowerCase() : 'tùy chọn'} --</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
      {error && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
};

export default Select;
