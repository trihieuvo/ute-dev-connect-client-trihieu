import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar';
import searchApi from '../../services/api/searchApi';
import { 
  Search, Loader2, Newspaper, Users, Code, Tag, 
  ThumbsUp, MessageSquare, Calendar, ChevronRight,
  GraduationCap, Briefcase, MapPin, User, AlertCircle
} from 'lucide-react';

const SearchPage = () => {
  const navigate = useNavigate();

  // Search Param States
  const [q, setQ] = useState('');
  const [type, setType] = useState('posts'); // 'posts' | 'groups' | 'developers'
  const [tag, setTag] = useState('');
  const [skill, setSkill] = useState('');
  
  // Results States
  const [results, setResults] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');

  // Perform search
  const performSearch = async (pageNum = 1, append = false) => {
    if (pageNum === 1) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }
    setError('');

    try {
      const params = {
        q: q.trim(),
        type,
        page: pageNum,
        limit: 10
      };

      if (type === 'posts' && tag.trim()) {
        params.tag = tag.trim();
      } else if (type === 'developers' && skill.trim()) {
        params.skill = skill.trim();
      }

      const response = await searchApi.search(params);
      const resData = response.data?.data || response.data || [];
      const totalCount = response.data?.total || 0;
      const moreExist = response.data?.hasMore || false;

      if (append) {
        setResults(prev => [...prev, ...resData]);
      } else {
        setResults(resData);
      }
      
      setTotal(totalCount);
      setPage(pageNum);
      setHasMore(moreExist);
    } catch (err) {
      console.error('Lỗi tìm kiếm:', err);
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi thực hiện tìm kiếm.');
      setResults([]);
      setTotal(0);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Trigger search on submit
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    performSearch(1, false);
  };

  // Reset fields
  const handleReset = () => {
    setQ('');
    setTag('');
    setSkill('');
    setResults([]);
    setTotal(0);
    setPage(1);
    setHasMore(false);
  };

  // Fetch initial posts on page load
  useEffect(() => {
    performSearch(1, false);
  }, [type]); // Re-search when tab type changes

  // Load more pagination
  const handleLoadMore = () => {
    if (hasMore && !loadingMore) {
      performSearch(page + 1, true);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <Navbar />

      <main className="flex-grow">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          
          {/* Header */}
          <div className="mb-8 flex items-center space-x-3">
            <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Search className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
                Tìm Kiếm Nâng Cao
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                Tìm kiếm bài viết, dự án nhóm học tập và hồ sơ lập trình viên
              </p>
            </div>
          </div>

          {/* Search Box & Filters */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6 mb-8">
            <form onSubmit={handleSearchSubmit}>
              
              {/* Keyword input */}
              <div className="relative mb-5">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Nhập từ khóa tìm kiếm..."
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  className="block w-full pl-12 pr-4 py-3.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-2xl text-sm text-gray-950 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-colors"
                />
              </div>

              {/* Type Tabs */}
              <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-xl w-fit mb-5">
                <button
                  type="button"
                  onClick={() => setType('posts')}
                  className={`flex items-center px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                    type === 'posts'
                      ? 'bg-white dark:bg-gray-800 text-blue-600 shadow-xs'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:text-gray-200'
                  }`}
                >
                  <Newspaper className="w-3.5 h-3.5 mr-1.5" />
                  Bài viết
                </button>
                <button
                  type="button"
                  onClick={() => setType('groups')}
                  className={`flex items-center px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                    type === 'groups'
                      ? 'bg-white dark:bg-gray-800 text-indigo-600 shadow-xs'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:text-gray-200'
                  }`}
                >
                  <Users className="w-3.5 h-3.5 mr-1.5" />
                  Nhóm học tập
                </button>
                <button
                  type="button"
                  onClick={() => setType('developers')}
                  className={`flex items-center px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                    type === 'developers'
                      ? 'bg-white dark:bg-gray-800 text-purple-600 shadow-xs'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:text-gray-200'
                  }`}
                >
                  <Code className="w-3.5 h-3.5 mr-1.5" />
                  Lập trình viên
                </button>
              </div>

              {/* Contextual Filters */}
              {type === 'posts' && (
                <div className="mb-5 animate-fade-in">
                  <label htmlFor="tag-filter" className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wider">
                    Lọc theo tag công nghệ
                  </label>
                  <div className="relative max-w-xs">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Tag className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      id="tag-filter"
                      type="text"
                      placeholder="Ví dụ: react, nodejs"
                      value={tag}
                      onChange={(e) => setTag(e.target.value)}
                      className="block w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-xl text-xs text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                    />
                  </div>
                </div>
              )}

              {type === 'developers' && (
                <div className="mb-5 animate-fade-in">
                  <label htmlFor="skill-filter" className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wider">
                    Lọc theo kỹ năng lập trình
                  </label>
                  <div className="relative max-w-xs">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Code className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      id="skill-filter"
                      type="text"
                      placeholder="Ví dụ: Javascript, Python"
                      value={skill}
                      onChange={(e) => setSkill(e.target.value)}
                      className="block w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-xl text-xs text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400"
                    />
                  </div>
                </div>
              )}

              {/* Buttons */}
              <div className="flex items-center gap-3 pt-4 border-t border-gray-100 dark:border-gray-700 justify-end">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2 text-sm font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 dark:bg-gray-900 rounded-xl transition-colors"
                >
                  Đặt lại
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-semibold hover:shadow-md hover:shadow-indigo-500/10 active:scale-95 transition-all flex items-center justify-center"
                >
                  {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Tìm kiếm
                </button>
              </div>

            </form>
          </div>

          {/* Results Summary */}
          {!loading && results.length > 0 && (
            <div className="mb-4 text-sm text-gray-500 dark:text-gray-400 font-medium pl-1">
              Tìm thấy <span className="text-gray-900 dark:text-gray-100 font-bold">{total}</span> kết quả
            </div>
          )}

          {/* Error display */}
          {error && (
            <div className="bg-red-50 text-red-700 p-4 rounded-xl mb-6 flex items-start space-x-2 border border-red-100">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Loading status */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="h-10 w-10 text-blue-600 animate-spin" />
              <p className="mt-3 text-gray-500 dark:text-gray-400 text-sm font-medium">Đang tải kết quả tìm kiếm...</p>
            </div>
          ) : results.length === 0 ? (
            /* Empty state */
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-150 dark:border-gray-700 p-12 text-center max-w-xl mx-auto shadow-sm">
              <div className="h-16 w-16 bg-gray-50 dark:bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100 dark:border-gray-700">
                <Search className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">Không có kết quả</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                Chúng tôi không tìm thấy kết quả nào khớp với yêu cầu tìm kiếm của bạn. Hãy thử từ khóa khác hoặc loại bỏ các bộ lọc.
              </p>
            </div>
          ) : (
            /* Results Display */
            <div className="space-y-6">
              
              {/* Type: Posts */}
              {type === 'posts' && (
                <div className="space-y-4">
                  {results.map((post) => {
                    const postDate = new Date(post.date).toLocaleDateString('vi-VN', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    });
                    const snippet = post.text && post.text.length > 200 ? post.text.substring(0, 200) + '...' : post.text;

                    return (
                      <div key={post._id} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-5 hover:shadow-md transition-all duration-300 group">
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="h-9 w-9 bg-blue-50 rounded-full overflow-hidden flex items-center justify-center">
                            <img 
                              src={post.avatar || 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y'} 
                              alt={post.name} 
                              className="w-full h-full object-cover" 
                              onError={(e) => { e.target.onerror = null; e.target.src = 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y'; }}
                            />
                          </div>
                          <div>
                            <Link to={`/profile/${post.user}`} className="text-sm font-bold text-gray-900 dark:text-gray-100 hover:text-blue-600 transition-colors">
                              {post.name || 'Thành viên'}
                            </Link>
                            <div className="flex items-center text-xs text-gray-400 mt-0.5">
                              <Calendar className="w-3 h-3 mr-1" />
                              <span>{postDate}</span>
                            </div>
                          </div>
                        </div>

                        <Link to={`/post/${post._id}`} className="block">
                          <p className="text-gray-800 dark:text-gray-200 text-sm leading-relaxed mb-4 hover:text-gray-950 dark:text-gray-100 transition-colors whitespace-pre-wrap">
                            {snippet}
                          </p>
                        </Link>

                        {/* Tags */}
                        {post.tags && post.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mb-4">
                            {post.tags.map((tag, idx) => (
                              <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded-full text-3xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                                <Tag className="w-2.5 h-2.5 mr-0.5" />
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-3.5 border-t border-gray-50 text-xs text-gray-500 dark:text-gray-400 font-medium">
                          <div className="flex items-center space-x-4">
                            <span className="flex items-center"><ThumbsUp className="w-3.5 h-3.5 mr-1" /> {post.likes?.length || 0} thích</span>
                            <span className="flex items-center"><MessageSquare className="w-3.5 h-3.5 mr-1" /> {post.comments?.length || 0} bình luận</span>
                          </div>
                          <Link to={`/post/${post._id}`} className="text-blue-600 hover:text-blue-700 flex items-center font-bold">
                            Xem chi tiết <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Type: Groups */}
              {type === 'groups' && (
                <div className="grid gap-6 sm:grid-cols-2">
                  {results.map((group) => {
                    const memberCount = group.members?.length || 0;
                    return (
                      <div key={group._id} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6 hover:shadow-md transition-all duration-300 flex flex-col justify-between">
                        <div>
                          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2 leading-snug line-clamp-1">{group.name}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-4 line-clamp-2 min-h-[40px]">
                            {group.description || 'Chưa có mô tả chi tiết cho nhóm học tập này.'}
                          </p>
                        </div>

                        <div className="pt-4 border-t border-gray-50 flex items-center justify-between">
                          <span className="text-xs text-gray-500 dark:text-gray-400 font-medium flex items-center">
                            <Users className="w-3.5 h-3.5 mr-1.5" /> {memberCount} thành viên
                          </span>
                          
                          <Link 
                            to={`/groups/${group._id}`}
                            className="inline-flex items-center px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-xl text-xs transition-colors"
                          >
                            Chi tiết nhóm
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Type: Developers */}
              {type === 'developers' && (
                <div className="grid gap-6 sm:grid-cols-2">
                  {results.map((profile) => {
                    const profUser = profile.user;
                    if (!profUser) return null;

                    return (
                      <div key={profile._id} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6 hover:shadow-md transition-all duration-300 flex flex-col justify-between">
                        <div>
                          
                          {/* Developer Header */}
                          <div className="flex items-center space-x-3 mb-4">
                            <div className="h-11 w-11 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden flex items-center justify-center border border-gray-200 dark:border-gray-600">
                              <img 
                                src={profUser.avatar || 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y'} 
                                alt={profUser.name} 
                                className="w-full h-full object-cover" 
                                onError={(e) => { e.target.onerror = null; e.target.src = 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y'; }}
                              />
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-sm font-bold text-gray-950 dark:text-gray-100 truncate">{profUser.name}</h4>
                              <p className="text-xs text-purple-600 font-semibold">{profile.status}</p>
                            </div>
                          </div>

                          {/* Profile Fields */}
                          <div className="space-y-1.5 mb-4 text-xs text-gray-500 dark:text-gray-400">
                            <div className="flex items-center"><GraduationCap className="w-3.5 h-3.5 mr-2 text-gray-400" /> {profile.faculty}</div>
                            {profile.company && (
                              <div className="flex items-center"><Briefcase className="w-3.5 h-3.5 mr-2 text-gray-400" /> {profile.company}</div>
                            )}
                            {profile.location && (
                              <div className="flex items-center"><MapPin className="w-3.5 h-3.5 mr-2 text-gray-400" /> {profile.location}</div>
                            )}
                          </div>

                          {/* Bio */}
                          {profile.bio && (
                            <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 italic mb-4 leading-relaxed">
                              "{profile.bio}"
                            </p>
                          )}

                          {/* Skills badges */}
                          {profile.skills && profile.skills.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-4">
                              {profile.skills.slice(0, 5).map((sk, idx) => (
                                <span key={idx} className="px-2 py-0.5 text-3xs font-semibold bg-purple-50 text-purple-700 border border-purple-100 rounded-full">
                                  {sk}
                                </span>
                              ))}
                              {profile.skills.length > 5 && (
                                <span className="px-2 py-0.5 text-3xs font-semibold bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400 rounded-full">
                                  +{profile.skills.length - 5}
                                </span>
                              )}
                            </div>
                          )}

                        </div>

                        <div className="pt-4 border-t border-gray-50 flex justify-end">
                          <Link 
                            to={`/profile/${profUser._id}`}
                            className="inline-flex items-center px-4 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold rounded-xl text-xs transition-colors"
                          >
                            Xem hồ sơ
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Load More Button */}
              {hasMore && (
                <div className="flex justify-center pt-4">
                  <button
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    className="inline-flex items-center px-5 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 dark:bg-gray-900 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-semibold shadow-xs transition-colors disabled:opacity-50"
                  >
                    {loadingMore && <Loader2 className="w-4 h-4 mr-2 animate-spin text-gray-400" />}
                    Xem thêm kết quả
                  </button>
                </div>
              )}

            </div>
          )}

        </div>
      </main>
    </div>
  );
};

export default SearchPage;
