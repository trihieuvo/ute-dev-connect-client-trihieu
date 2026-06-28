function Alert({ type = "info", message }) {
  if (!message) return null;

  const alertClass =
    type === "success"
      ? "border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-900/30 dark:text-green-400"
      : type === "error"
      ? "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-400"
      : "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-400";

  return (
    <div className={`rounded-xl border px-4 py-3 text-sm ${alertClass}`}>
      {message}
    </div>
  );
}

export default Alert;