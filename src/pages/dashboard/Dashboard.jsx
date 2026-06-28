import React, { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getPosts } from '../../store/postSlice';
import PostItem from '../../components/posts/PostItem';
import PostForm from '../../components/posts/PostForm';
import TopTrending from '../../components/posts/TopTrending';
import Navbar from '../../components/layout/Navbar';
import { profileApi } from '../../services/api/profileApi';
import Avatar from '../../components/common/Avatar';
import RankBadge from '../../components/common/RankBadge';
import { Search, Loader2, Newspaper, AlertCircle, RefreshCw, Star, ChevronRight, GraduationCap, Briefcase } from 'lucide-react';

/**
 * Dashboard - Trang Bảng tin (Newsfeed)
 * 
 * Mục 1: PostItem component + Loading state (icon xoay)
 * Mục 2: useEffect gọi API GET /api/posts
 * Mục 3: Ô Input + Form lọc bài viết
 * 
 * Tham khảo: devconnector_2.0/client/src/components/posts/Posts.js
 */
const Dashboard = () => {
  const dispatch = useDispatch();
  const { posts, loading, loadingMore, error, page, hasMore } = useSelector((state) => state.post);
  const { token } = useSelector((state) => state.auth);

  const [activeTab, setActiveTab] = useState('latest'); // 'latest', 'trending', 'friends'
  const [timeframe, setTimeframe] = useState('7d'); // '24h', '7d', '30d', 'all'
  const [filterText, setFilterText] = useState('');
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);

  useEffect(() => {
    if (token) {
      setProfileLoading(true);
      profileApi.getProfile()
        .then(res => {
          const profileData = res.data?.data || res.data;
          setProfile(profileData);
        })
        .catch(err => console.error('Lỗi tải profile trong Dashboard:', err))
        .finally(() => setProfileLoading(false));
    }
  }, [token]);

  useEffect(() => {
    dispatch(getPosts({ page: 1, limit: 5, filter: activeTab, timeframe }));
  }, [dispatch, activeTab, timeframe]);

  const observerTarget = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading && !loadingMore && !filterText.trim()) {
          dispatch(getPosts({ page: page + 1, limit: 5, filter: activeTab, timeframe }));
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
  }, [hasMore, loading, loadingMore, page, dispatch, filterText, activeTab, timeframe]);

  // Mục 3: Lọc bài viết theo từ khóa (lọc theo text, name, tags)
  const filteredPosts = posts.filter((post) => {
    if (!filterText.trim()) return true;
    const keyword = filterText.toLowerCase();
    const matchText = post.text?.toLowerCase().includes(keyword);
    const matchName = post.name?.toLowerCase().includes(keyword);
    const matchTags = post.tags?.some((tag) =>
      tag.toLowerCase().includes(keyword)
    );
    return matchText || matchName || matchTags;
  });

  // Handler cho form lọc
  const handleFilterSubmit = (e) => {
    e.preventDefault();
    // Lọc đã được xử lý realtime qua filteredPosts
  };

  // Handler refresh
  const handleRefresh = () => {
    dispatch(getPosts({ page: 1, limit: 5, filter: activeTab, timeframe }));
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <Navbar />

      <main className="flex-grow">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

          {/* Header section */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                  <Newspaper className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
                    Bảng tin
                  </h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                    Cập nhật mới nhất từ cộng đồng UTE Connect
                  </p>
                </div>
              </div>
              <button
                onClick={handleRefresh}
                className="p-2.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-xl transition-all duration-200"
                title="Tải lại bài viết"
              >
                <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left Feed Column */}
            <div className="md:col-span-2 space-y-6">
              
              {/* Mobile-only TopTrending (horizontal layout) */}
              <div className="md:hidden">
                <TopTrending layout="horizontal" />
              </div>

              {/* Mục 3: Form lọc bài viết */}
              <div>
                <form onSubmit={handleFilterSubmit} className="relative">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="filter-posts-input"
                      type="text"
                      placeholder='Lọc bài viết... VD: gõ "Java" để tìm bài liên quan đến Java'
                      value={filterText}
                      onChange={(e) => setFilterText(e.target.value)}
                      className="block w-full pl-12 pr-4 py-3.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all duration-200 shadow-sm hover:shadow-md"
                    />
                    {filterText && (
                      <button
                        type="button"
                        onClick={() => setFilterText('')}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <span className="text-xs bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 px-2 py-1 rounded-lg transition-colors">
                          Xóa
                        </span>
                      </button>
                    )}
                  </div>
                  {filterText && (
                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 pl-1">
                      Tìm thấy <span className="font-semibold text-blue-600 dark:text-blue-400">{filteredPosts.length}</span> bài viết
                      {filteredPosts.length !== posts.length && (
                        <span> / {posts.length} tổng bài viết</span>
                      )}
                    </p>
                  )}
                </form>
              </div>

              {/* Tabs Điều hướng Newsfeed */}
              <div className="flex border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-2 rounded-2xl shadow-sm gap-2 mb-6">
                <button
                  type="button"
                  onClick={() => setActiveTab('latest')}
                  className={`flex-grow flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-semibold rounded-xl transition-all duration-200 ${
                    activeTab === 'latest'
                      ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  }`}
                >
                  🌐 Mới nhất
                </button>
                <button
                  type="button"
                  onClick={() => { setActiveTab('trending'); setTimeframe('7d'); }}
                  className={`flex-grow flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-semibold rounded-xl transition-all duration-200 ${
                    activeTab === 'trending'
                      ? 'bg-orange-50 dark:bg-orange-950/20 text-orange-600 dark:text-orange-400'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  }`}
                >
                  🔥 Xu hướng
                </button>
                {token && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('friends')}
                    className={`flex-grow flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-semibold rounded-xl transition-all duration-200 ${
                      activeTab === 'friends'
                        ? 'bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-400'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                    }`}
                  >
                    🤝 Bạn bè
                  </button>
                )}
              </div>

              {/* Bộ lọc khoảng thời gian khi ở tab Xu hướng */}
              {activeTab === 'trending' && (
                <div className="flex items-center gap-2 bg-white dark:bg-gray-800 p-2 rounded-2xl shadow-sm mb-6 border border-orange-100 dark:border-gray-750 transition-all duration-200">
                  <span className="text-xs font-bold text-gray-500 dark:text-gray-400 pl-2 uppercase tracking-wider">Xu hướng theo:</span>
                  <div className="flex gap-1.5 flex-1">
                    {[
                      { id: '24h', label: 'Hôm nay' },
                      { id: '7d', label: 'Tuần này' },
                      { id: '30d', label: 'Tháng này' },
                      { id: 'all', label: 'Tất cả' }
                    ].map(t => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setTimeframe(t.id)}
                        className={`flex-1 py-1.5 px-3 text-xs font-semibold rounded-xl transition-all duration-150 ${
                          timeframe === t.id
                            ? 'bg-orange-500 text-white shadow-sm shadow-orange-500/20'
                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Form tạo bài viết (chỉ hiện khi đã đăng nhập) */}
              {token && (
                <PostForm />
              )}

              {/* Mục 1: Trạng thái Loading với icon xoay */}
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                  <div className="relative">
                    <div className="h-16 w-16 rounded-full border-4 border-gray-100 dark:border-gray-700"></div>
                    <Loader2 className="h-16 w-16 text-blue-500 animate-spin absolute top-0 left-0" />
                  </div>
                  <p className="mt-4 text-gray-500 dark:text-gray-400 text-sm font-medium animate-pulse">
                    Đang tải bài viết...
                  </p>
                </div>
              ) : error ? (
                /* Trạng thái lỗi */
                <div className="flex flex-col items-center justify-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                  <div className="h-14 w-14 rounded-full bg-red-50 flex items-center justify-center mb-4">
                    <AlertCircle className="h-7 w-7 text-red-500" />
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 font-medium mb-1">Không thể tải bài viết</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{error}</p>
                  <button
                    onClick={handleRefresh}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium hover:bg-blue-50 dark:hover:bg-blue-900/30 px-4 py-2 rounded-lg transition-all"
                  >
                    Thử lại
                  </button>
                </div>
              ) : filteredPosts.length === 0 ? (
                /* Không có bài viết */
                <div className="flex flex-col items-center justify-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                  <div className="h-14 w-14 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-4">
                    <Newspaper className="h-7 w-7 text-gray-400" />
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 font-medium mb-1">
                    {filterText ? 'Không tìm thấy bài viết' : 'Chưa có bài viết nào'}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {filterText
                      ? `Không có bài viết nào khớp với "${filterText}". Hãy thử từ khóa khác.`
                      : 'Hãy là người đầu tiên chia sẻ bài viết!'}
                  </p>
                </div>
              ) : (
                /* Danh sách bài viết */
                <div className="grid gap-4">
                  {filteredPosts.map((post) => (
                    <PostItem key={post._id} post={post} />
                  ))}
                  
                  {/* Vùng theo dõi scroll (Intersection Observer Target) */}
                  <div ref={observerTarget} className="h-4 w-full"></div>
                  
                  {/* Spinner khi đang tải thêm bài viết (loadingMore) */}
                  {loadingMore && (
                    <div className="flex justify-center py-6">
                      <div className="flex flex-col items-center">
                        <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
                        <span className="text-sm text-gray-500 dark:text-gray-400 mt-2">Đang tải thêm...</span>
                      </div>
                    </div>
                  )}
                  
                  {/* Thông báo hết bài viết */}
                  {!hasMore && posts.length > 0 && !filterText.trim() && (
                    <div className="text-center text-gray-400 dark:text-gray-500 text-sm py-6">
                      — Đã tải hết bài viết —
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right Sidebar Column */}
            <div className="hidden md:block md:col-span-1 space-y-6 sticky top-24 self-start">
              
              {/* Mini Profile Widget */}
              {token && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 shadow-sm">
                  {profileLoading ? (
                    <div className="flex justify-center py-4">
                      <Loader2 className="h-6 w-6 text-blue-500 animate-spin" />
                    </div>
                  ) : profile ? (
                    <div>
                      <div className="flex items-center gap-3 mb-4">
                        <Avatar 
                          src={profile.user?.avatar} 
                          alt={profile.user?.name} 
                          className="w-11.5 h-11.5 border border-gray-200 dark:border-gray-700"
                        />
                        <div className="min-w-0 flex-1">
                          <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">
                            {profile.user?.name || 'Người dùng UTE'}
                          </h3>
                          <p className="text-2xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5 truncate">
                            {profile.status === 'Sinh viên' ? (
                              <GraduationCap className="w-3.5 h-3.5 text-gray-400" />
                            ) : (
                              <Briefcase className="w-3.5 h-3.5 text-gray-400" />
                            )}
                            <span>{profile.status || 'Sinh viên'}</span>
                            {profile.faculty && <span className="truncate"> • {profile.faculty}</span>}
                          </p>
                        </div>
                      </div>

                      {/* Reputation Score Badge */}
                      <div className="flex items-center justify-between p-3.5 bg-indigo-50/50 dark:bg-indigo-900/30 rounded-xl border border-indigo-50/60 dark:border-indigo-800/50 mb-4">
                        <div className="flex items-center gap-2">
                          <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                          <div>
                            <p className="text-3xs text-gray-400 font-bold uppercase tracking-wider">Điểm uy tín</p>
                            <p className="text-sm font-extrabold text-indigo-700 dark:text-indigo-400">{profile.user?.reputation || 0} điểm</p>
                          </div>
                        </div>
                        <RankBadge score={profile.user?.reputation} className="text-3xs px-2 py-0.5 border font-bold rounded-full" />
                      </div>

                      <a 
                        href={`/profile/${profile.user?._id || ''}`} 
                        className="flex items-center justify-between text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50/80 dark:hover:bg-blue-900/30 p-2 rounded-lg transition-colors"
                      >
                        <span>Trang cá nhân của tôi</span>
                        <ChevronRight className="w-4 h-4" />
                      </a>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-xs text-gray-500 dark:text-gray-400">Chưa thiết lập hồ sơ cá nhân</p>
                      <a href="/edit-profile" className="mt-2 inline-block text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline">Tạo hồ sơ ngay</a>
                    </div>
                  )}
                </div>
              )}

              {/* TopTrending Sidebar Widget */}
              <TopTrending layout="vertical" />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
