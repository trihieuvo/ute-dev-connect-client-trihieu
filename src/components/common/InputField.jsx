function InputField({
  label,
  name,
  type = "text",
  value,
  onChange,
  placeholder,
  error,
  autoComplete = "off",
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={name} className="text-sm font-medium text-slate-700 dark:text-slate-300">
        {label}
      </label>

      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition focus:border-blue-500 dark:focus:border-blue-400 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-500/20 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 ${
          error ? "border-red-400 dark:border-red-500" : "border-slate-200 dark:border-slate-700"
        }`}
      />

      {error && <p className="text-xs text-red-500 dark:text-red-400">{error}</p>}
    </div>
  );
}

export default InputField;