import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar';
import filterApi from '../../services/api/filterApi';
import { toast } from 'react-toastify';
import { 
  ShieldAlert, 
  Trash2, 
  Plus, 
  Search, 
  AlertCircle, 
  Loader2, 
  Sparkles,
  HelpCircle,
  Settings,
  X,
  PlusCircle,
  Info,
  CheckCircle,
  Download,
  UploadCloud
} from 'lucide-react';

const WordFilterPage = () => {
  const { token, role } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  const [bannedWords, setBannedWords] = useState([]);
  const [aiEnabled, setAiEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [newWord, setNewWord] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Kịch bản bảo mật: Chuyển hướng người dùng không phải admin
  useEffect(() => {
    if (!token) {
      navigate('/login');
    } else if (role !== 'admin') {
      // Đợi một chút để check state Redux nếu cần, sau đó redirect
      const timer = setTimeout(() => {
        if (role !== 'admin') {
          navigate('/dashboard');
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [token, role, navigate]);

  // Tải cấu hình bộ lọc từ API
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await filterApi.getFilterConfig();
        if (res.data?.success) {
          setBannedWords(res.data.data.bannedWords || []);
          setAiEnabled(res.data.data.aiFilterEnabled || false);
        }
      } catch (err) {
        console.error('Lỗi tải cấu hình bộ lọc:', err);
        toast.error('Không thể tải cấu hình bộ lọc từ Server.');
      } finally {
        setLoading(false);
      }
    };

    if (token && role === 'admin') {
      fetchConfig();
    }
  }, [token, role]);

  // Thêm từ cấm mới
  const handleAddWord = async (e) => {
    e.preventDefault();
    const cleanWord = newWord.trim();
    if (!cleanWord) return;

    if (bannedWords.some(w => w.toLowerCase() === cleanWord.toLowerCase())) {
      toast.warning('Từ cấm này đã tồn tại trong danh sách.');
      return;
    }

    setActionLoading(true);
    try {
      const res = await filterApi.addBannedWord(cleanWord);
      if (res.data?.success) {
        setBannedWords(res.data.data.bannedWords || []);
        setNewWord('');
        toast.success(`Đã thêm từ cấm "${cleanWord}" thành công!`);
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Lỗi khi thêm từ cấm.');
    } finally {
      setActionLoading(false);
    }
  };

  // Xóa từ cấm
  const handleDeleteWord = async (wordToDelete) => {
    setActionLoading(true);
    try {
      const res = await filterApi.deleteBannedWord(wordToDelete);
      if (res.data?.success) {
        setBannedWords(res.data.data.bannedWords || []);
        toast.success(`Đã xóa từ cấm "${wordToDelete}".`);
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Lỗi khi xóa từ cấm.');
    } finally {
      setActionLoading(false);
    }
  };

  // Bật/tắt AI Moderation
  const handleToggleAi = async () => {
    setActionLoading(true);
    const targetState = !aiEnabled;
    try {
      const res = await filterApi.toggleAiFilter(targetState);
      if (res.data?.success) {
        setAiEnabled(res.data.data.aiFilterEnabled);
        toast.success(res.data.message || `Đã ${targetState ? 'bật' : 'tắt'} bộ lọc AI.`);
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Lỗi khi thay đổi trạng thái bộ lọc AI.');
    } finally {
      setActionLoading(false);
    }
  };

  // Preset từ khóa mẫu để Admin thêm nhanh
  const presets = ['spam', 'quảng cáo', 'hack tài khoản', 'nạp game lậu', 'click vào link'];

  const handleAddPreset = async (preset) => {
    if (bannedWords.some(w => w.toLowerCase() === preset.toLowerCase())) {
      toast.info('Từ này đã có trong danh sách bộ lọc.');
      return;
    }
    setActionLoading(true);
    try {
      const res = await filterApi.addBannedWord(preset);
      if (res.data?.success) {
        setBannedWords(res.data.data.bannedWords || []);
        toast.success(`Đã thêm từ mẫu "${preset}"`);
      }
    } catch (err) {
      console.error(err);
      toast.error('Lỗi khi thêm từ mẫu.');
    } finally {
      setActionLoading(false);
    }
  };

  // Xuất CSV
  const handleExportCsv = async () => {
    setActionLoading(true);
    try {
      const response = await filterApi.exportCsv();
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'banned_words.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Xuất file CSV thành công!');
    } catch (err) {
      console.error(err);
      toast.error('Lỗi khi xuất file CSV.');
    } finally {
      setActionLoading(false);
    }
  };

  // Nhập CSV
  const handleImportCsv = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setActionLoading(true);
    try {
      const res = await filterApi.importCsv(formData);
      if (res.data?.success) {
        setBannedWords(res.data.data.bannedWords || []);
        toast.success(res.data.message || 'Nhập file CSV thành công!');
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Lỗi khi nhập file CSV.');
    } finally {
      setActionLoading(false);
      e.target.value = '';
    }
  };

  // Lọc danh sách từ cấm theo ô tìm kiếm
  const filteredWords = bannedWords.filter(word => 
    word.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Render màn hình từ chối nếu không phải admin
  if (role && role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
        <Navbar />
        <div className="flex-grow flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-3xl p-8 border border-gray-100 dark:border-gray-700 shadow-xl text-center">
            <div className="h-16 w-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-red-100">
              <ShieldAlert size={32} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Truy Cập Bị Từ Chối</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
              Bạn không có quyền truy cập trang này. Trang này chỉ dành cho Admin tổng của hệ thống UTE Connect.
            </p>
            <button 
              onClick={() => navigate('/dashboard')}
              className="w-full py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl font-semibold shadow-lg shadow-blue-500/20 transition-all duration-200"
            >
              Quay lại Bảng tin
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <Navbar />

      <main className="flex-grow">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
          
          {/* Header Section */}
          <div className="bg-gradient-to-r from-rose-500 to-red-600 text-white rounded-3xl p-6 sm:p-8 shadow-xl shadow-red-500/10 mb-8 relative overflow-hidden">
            <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-white dark:bg-gray-800/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute left-1/3 bottom-0 w-48 h-48 bg-white dark:bg-gray-800/5 rounded-full blur-2xl pointer-events-none" />
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 relative z-10">
              <div className="flex items-center space-x-4">
                <div className="p-3.5 bg-white dark:bg-gray-800/10 backdrop-blur-md rounded-2xl border border-white/20">
                  <ShieldAlert className="h-8 w-8 text-white" />
                </div>
                <div>
                  <span className="bg-white dark:bg-gray-800/20 border border-white/30 text-white text-xs px-3 py-1 rounded-full uppercase tracking-wider font-extrabold inline-block mb-1">
                    Hệ Thống Tổng
                  </span>
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                    Quản Lý Bộ Lọc Nội Dung
                  </h1>
                  <p className="text-sm text-red-100 mt-1">
                    Cấu hình quy chuẩn kiểm duyệt tự động từ cấm & quét mẫu AI cho toàn hệ thống.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm">
              <Loader2 className="h-10 w-10 text-rose-500 animate-spin mb-4" />
              <p className="text-gray-500 dark:text-gray-400 text-sm">Đang tải cấu hình bộ lọc từ hệ thống...</p>
            </div>
          ) : (
            <div className="space-y-8">
              
              {/* AI Moderation Panel */}
              <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all duration-300">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                  <div className="flex items-start space-x-4">
                    <div className={`p-3 rounded-2xl border transition-all duration-300 ${aiEnabled ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-gray-50 dark:bg-gray-900 text-gray-400 border-gray-100 dark:border-gray-700'}`}>
                      <Sparkles className={`h-6 w-6 ${aiEnabled ? 'animate-pulse' : ''}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Kiểm duyệt Nội dung bằng AI</h2>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${aiEnabled ? 'bg-emerald-100 text-emerald-700 animate-pulse' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'}`}>
                          {aiEnabled ? 'Hoạt động' : 'Tắt'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Sử dụng công nghệ AI quét ngữ nghĩa nhằm phát hiện bài viết hoặc bình luận spam, lừa đảo, quảng cáo, hack hoặc cố tình quấy rối cộng đồng.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center self-end md:self-center">
                    <button
                      type="button"
                      onClick={handleToggleAi}
                      disabled={actionLoading}
                      className={`relative inline-flex h-8 w-14 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-300 ease-in-out focus:outline-none ${aiEnabled ? 'bg-emerald-500' : 'bg-gray-200 dark:bg-gray-600'} ${actionLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <span
                        aria-hidden="true"
                        className={`pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white dark:bg-gray-800 shadow ring-0 transition duration-300 ease-in-out ${aiEnabled ? 'translate-x-6' : 'translate-x-0'}`}
                      />
                    </button>
                  </div>
                </div>

                {/* AI info card */}
                {aiEnabled && (
                  <div className="mt-4 p-4 bg-emerald-50/50 border border-emerald-100/60 rounded-2xl flex items-start space-x-3">
                    <Info className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                    <div className="text-xs text-emerald-800 space-y-1">
                      <p className="font-semibold">Bộ lọc AI đang tự động áp dụng cho các hành động sau:</p>
                      <ul className="list-disc list-inside space-y-0.5 opacity-90">
                        <li>Đăng bài viết mới lên Newsfeed và Nhóm học tập</li>
                        <li>Chỉnh sửa bài viết cũ</li>
                        <li>Đăng bình luận hoặc trả lời code của thành viên</li>
                      </ul>
                    </div>
                  </div>
                )}
              </div>

              {/* Banned Words Management Panel */}
              <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-gray-50">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                      <span>Danh Sách Từ Khóa Cấm</span>
                      <span className="bg-rose-50 text-rose-600 text-xs px-2 py-0.5 rounded-full font-bold">
                        {bannedWords.length} từ khóa
                      </span>
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                      Bất kỳ bài viết hoặc bình luận nào chứa từ khóa cấm sẽ bị hệ thống chặn đăng ngay lập tức.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-center">
                    <button
                      type="button"
                      onClick={handleExportCsv}
                      disabled={actionLoading}
                      className="inline-flex items-center gap-1.5 px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-500 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-semibold transition-all border border-gray-200 dark:border-gray-600/50 hover:border-gray-300 disabled:opacity-50"
                      title="Tải về danh sách từ khóa cấm dưới dạng file CSV"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>Xuất CSV</span>
                    </button>
                    
                    <label
                      className={`inline-flex items-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-semibold transition-all border border-rose-100 hover:border-rose-200 cursor-pointer ${actionLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                      title="Nhập danh sách từ khóa cấm từ file CSV"
                    >
                      <UploadCloud className="h-3.5 w-3.5" />
                      <span>Nhập CSV</span>
                      <input
                        type="file"
                        accept=".csv"
                        onChange={handleImportCsv}
                        disabled={actionLoading}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                {/* Add new word form */}
                <form onSubmit={handleAddWord} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Nhập từ cấm mới (Ví dụ: tu_cam...)"
                    value={newWord}
                    onChange={(e) => setNewWord(e.target.value)}
                    disabled={actionLoading}
                    className="flex-grow px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-2xl text-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400 focus:bg-white dark:bg-gray-800 transition-all duration-200"
                  />
                  <button
                    type="submit"
                    disabled={actionLoading || !newWord.trim()}
                    className="px-5 py-3 bg-rose-500 hover:bg-rose-600 text-white rounded-2xl text-sm font-semibold shadow-md shadow-rose-500/10 hover:shadow-lg transition-all duration-200 flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {actionLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
                    <span>Thêm</span>
                  </button>
                </form>

                {/* Quick Add Presets */}
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="text-gray-400 flex items-center gap-1 font-medium">
                    <HelpCircle size={13} />
                    Gợi ý thêm nhanh:
                  </span>
                  {presets.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => handleAddPreset(preset)}
                      disabled={actionLoading}
                      className="px-2.5 py-1 bg-gray-100 dark:bg-gray-700 hover:bg-rose-50 hover:text-rose-600 text-gray-600 dark:text-gray-400 rounded-lg transition-all border border-transparent hover:border-rose-100 font-medium"
                    >
                      +{preset}
                    </button>
                  ))}
                </div>

                {/* Search word filters */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Tìm kiếm nhanh trong danh sách từ cấm..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="block w-full pl-9 pr-4 py-2.5 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-rose-500/10 focus:border-rose-200 focus:bg-white dark:bg-gray-800 transition-all duration-200"
                  />
                </div>

                {/* Banned Word Chips list */}
                {filteredWords.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-dashed border-gray-200 dark:border-gray-600">
                    <AlertCircle className="h-8 w-8 text-gray-300 mb-2" />
                    <p className="text-gray-500 dark:text-gray-400 text-xs">
                      {searchQuery ? 'Không tìm thấy từ khóa trùng khớp.' : 'Danh sách trống. Hãy thêm từ khóa đầu tiên!'}
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2 max-h-72 overflow-y-auto p-1">
                    {filteredWords.map((word) => (
                      <div
                        key={word}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-full text-xs font-semibold border border-rose-100 transition-all group"
                      >
                        <span>{word}</span>
                        <button
                          type="button"
                          onClick={() => handleDeleteWord(word)}
                          disabled={actionLoading}
                          className="text-rose-400 hover:text-rose-600 p-0.5 rounded-full hover:bg-white dark:bg-gray-800 transition-all"
                          title={`Xóa "${word}" khỏi bộ lọc`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default WordFilterPage;
