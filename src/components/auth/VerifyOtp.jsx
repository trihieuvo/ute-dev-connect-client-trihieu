import VerifyOtpForm from "../../components/auth/VerifyOtpForm";

function VerifyOtp() {
  return (
    <main className="min-h-screen bg-slate-50 dark:bg-gray-900">
      <div className="grid min-h-screen lg:grid-cols-2">
        <section className="hidden bg-gradient-to-br from-blue-700 via-blue-600 to-cyan-500 px-12 py-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-lg font-bold text-blue-700">
                U
              </div>
              <span className="text-lg font-semibold">UTE Dev Connect</span>
            </div>
          </div>

          <div className="max-w-xl">
            <p className="mb-4 text-sm font-medium uppercase tracking-widest text-blue-100">
              Account Verification
            </p>

            <h2 className="text-4xl font-bold leading-tight">
              Hoàn tất xác thực để bắt đầu kết nối với cộng đồng sinh viên.
            </h2>

            <p className="mt-5 text-base leading-7 text-blue-50">
              Mã OTP giúp hệ thống xác nhận email của bạn là hợp lệ trước khi
              sử dụng các chức năng của mạng xã hội sinh viên HCMUTE.
            </p>
          </div>

          <div className="rounded-2xl bg-white/15 p-5 backdrop-blur">
            <p className="text-sm text-blue-50">
              Sau khi xác thực thành công, hệ thống sẽ chuyển bạn đến trang đăng nhập.
            </p>
          </div>
        </section>

        <section className="flex items-center justify-center px-5 py-10">
          <VerifyOtpForm />
        </section>
      </div>
    </main>
  );
}

export default VerifyOtp;