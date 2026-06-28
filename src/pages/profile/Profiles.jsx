import React, { useEffect, useState, useRef } from 'react';
import { profileApi } from '../../services/api/profileApi';
import ProfileItem from '../../components/profile/ProfileItem';
import Navbar from '../../components/layout/Navbar';
import { 
  Users, Search, Filter, Loader2, RefreshCw, SlidersHorizontal, 
  Trash2, ArrowUpAZ, Award, GraduationCap, Briefcase 
} from 'lucide-react';

const Profiles = () => {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [facultyFilter, setFacultyFilter] = useState('');
  const [sortBy, setSortBy] = useState('reputation'); // 'reputation' | 'followers' | 'name'
  const [visibleCount, setVisibleCount] = useState(10);

  const observerTarget = useRef(null);

  const fetchProfiles = async () => {
    try {
      setLoading(true);
      const res = await profileApi.getProfiles();
      setProfiles(res.data || []);
    } catch (err) {
      console.error('Lỗi tải danh sách profile:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  // Reset visible count back to 10 when any filter changes
  useEffect(() => {
    setVisibleCount(10);
  }, [searchTerm, statusFilter, facultyFilter, sortBy]);

  // Filtering & Sorting logic
  const filteredProfiles = profiles
    .filter((profile) => {
      if (!searchTerm.trim()) return true;
      const query = searchTerm.toLowerCase();
      const matchName = profile.user?.name?.toLowerCase().includes(query);
      const matchSkills = profile.skills?.some((skill) => skill.toLowerCase().includes(query));
      const matchCompany = profile.company?.toLowerCase().includes(query);
      const matchLocation = profile.location?.toLowerCase().includes(query);
      return matchName || matchSkills || matchCompany || matchLocation;
    })
    .filter((profile) => {
      if (!statusFilter) return true;
      return profile.status === statusFilter;
    })
    .filter((profile) => {
      if (!facultyFilter) return true;
      return profile.faculty === facultyFilter;
    })
    .sort((a, b) => {
      if (sortBy === 'reputation') {
        return (b.user?.reputation || 0) - (a.user?.reputation || 0);
      }
      if (sortBy === 'followers') {
        return (b.user?.followers?.length || 0) - (a.user?.followers?.length || 0);
      }
      if (sortBy === 'name') {
        return (a.user?.name || '').localeCompare(b.user?.name || '');
      }
      return 0;
    });

  // Client-side Infinite Scroll Intersection Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && visibleCount < filteredProfiles.length) {
          setVisibleCount((prev) => prev + 10);
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [visibleCount, filteredProfiles.length]);

  const profilesToRender = filteredProfiles.slice(0, visibleCount);

  const statusOptions = [
    'Sinh viên',
    'Thực tập sinh',
    'Junior Developer',
    'Middle Developer',
    'Senior Developer',
    'Giảng viên',
    'Khác'
  ];

  const facultyOptions = [
    'Công nghệ thông tin',
    'Điện - Điện tử',
    'Cơ khí',
    'Kinh tế',
    'Đào tạo chất lượng cao',
    'Khác'
  ];

  const handleClearFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    setFacultyFilter('');
    setSortBy('reputation');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col font-sans">
      <Navbar />

      <main className="flex-grow">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
          
          {/* Header section */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                  <Users className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
                    Developers Network
                  </h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                    Khám phá và kết nối với các lập trình viên tài năng, sinh viên UTE cùng chí hướng.
                  </p>
                </div>
              </div>
              <button
                onClick={fetchProfiles}
                className="p-2.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-xl transition-all duration-200"
                title="Tải lại danh sách"
              >
                <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left Profiles Listing Column */}
            <div className="md:col-span-2 space-y-6 order-2 md:order-1">
              
              {/* Search Bar */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Tìm kiếm lập trình viên theo tên hoặc kỹ năng... VD: React, Python"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-12 pr-4 py-3.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all duration-200 shadow-sm hover:shadow-md"
                />
              </div>

              {/* Profiles Loading, Error, Empty, or List */}
              {loading && profiles.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                  <div className="relative">
                    <div className="h-16 w-16 rounded-full border-4 border-gray-100 dark:border-gray-700"></div>
                    <Loader2 className="h-16 w-16 text-blue-500 animate-spin absolute top-0 left-0" />
                  </div>
                  <p className="mt-4 text-gray-500 dark:text-gray-400 text-sm font-medium animate-pulse">
                    Đang tải danh sách lập trình viên...
                  </p>
                </div>
              ) : filteredProfiles.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                  <div className="h-14 w-14 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-4">
                    <Users className="h-7 w-7 text-gray-400" />
                  </div>
                  <p className="text-gray-700 dark:text-gray-200 font-medium mb-1">Không tìm thấy lập trình viên nào</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Hãy thử dùng các từ khóa hoặc thay đổi bộ lọc ở bên phải.</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {profilesToRender.map((profile) => (
                    <ProfileItem key={profile._id} profile={profile} />
                  ))}

                  {/* Lazy Loading Anchor */}
                  <div ref={observerTarget} className="h-4 w-full"></div>

                  {/* Showing progression count */}
                  {visibleCount < filteredProfiles.length && (
                    <div className="flex justify-center py-4">
                      <Loader2 className="h-6 w-6 text-blue-500 animate-spin" />
                    </div>
                  )}

                  {visibleCount >= filteredProfiles.length && filteredProfiles.length > 0 && (
                    <p className="text-center text-gray-400 dark:text-gray-500 text-xs py-4">
                      — Đã hiển thị tất cả {filteredProfiles.length} lập trình viên —
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Right Filters Column */}
            <div className="md:col-span-1 space-y-6 md:sticky md:top-24 md:self-start order-1 md:order-2">
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 shadow-sm space-y-5">
                <div className="flex items-center space-x-2 pb-3 border-b border-gray-100 dark:border-gray-700">
                  <SlidersHorizontal className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">Bộ lọc tìm kiếm</h3>
                </div>

                {/* Filter by Status/Role */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Vai trò / Trạng thái
                  </label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="block w-full text-xs px-3.5 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white dark:focus:bg-gray-800 transition-all font-medium text-gray-700 dark:text-gray-200"
                  >
                    <option value="">Tất cả vai trò</option>
                    {statusOptions.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>

                {/* Filter by Faculty */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Khoa đào tạo
                  </label>
                  <select
                    value={facultyFilter}
                    onChange={(e) => setFacultyFilter(e.target.value)}
                    className="block w-full text-xs px-3.5 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white dark:focus:bg-gray-800 transition-all font-medium text-gray-700 dark:text-gray-200"
                  >
                    <option value="">Tất cả khoa</option>
                    {facultyOptions.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>

                {/* Sort Order */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Sắp xếp theo
                  </label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="block w-full text-xs px-3.5 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white dark:focus:bg-gray-800 transition-all font-medium text-gray-700 dark:text-gray-200"
                  >
                    <option value="reputation">Điểm uy tín (★)</option>
                    <option value="followers">Nhiều người theo dõi</option>
                    <option value="name">Tên (A-Z)</option>
                  </select>
                </div>

                {/* Reset Action */}
                <button
                  onClick={handleClearFilters}
                  disabled={!searchTerm && !statusFilter && !facultyFilter && sortBy === 'reputation'}
                  className="w-full flex items-center justify-center gap-2 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 hover:border-red-100 dark:hover:border-red-800 border border-gray-100 dark:border-gray-700 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50 dark:disabled:bg-gray-800/50 disabled:text-gray-400 dark:disabled:text-gray-500"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Xóa bộ lọc
                </button>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
};

export default Profiles;
