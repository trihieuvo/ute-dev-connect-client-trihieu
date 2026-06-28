import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import Navbar from '../../components/layout/Navbar';
import groupApi from '../../services/api/groupApi';
import { 
  Users, Plus, Search, Loader2, Trash2, LogOut, 
  ArrowRight, Shield, User, FolderGit2, AlertCircle
} from 'lucide-react';

// Helper to decode token
const parseJwt = (token) => {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return null;
  }
};

const getEntityId = (entity) => {
  if (!entity) return '';
  if (typeof entity === 'string' || typeof entity === 'number') {
    return entity.toString();
  }

  return (entity._id || entity.id || entity.userId || '').toString();
};

const getJoinRequestStatus = (group) => {
  if (!group) return '';

  if (group.joinRequestStatus) {
    return String(group.joinRequestStatus).toLowerCase();
  }

  if (typeof group.hasPendingJoinRequest === 'boolean') {
    return group.hasPendingJoinRequest ? 'pending' : '';
  }

  return '';
};

const Groups = () => {
  const navigate = useNavigate();
  const { token } = useSelector((state) => state.auth);
  
  const userPayload = token ? parseJwt(token) : null;
  const userId = userPayload ? userPayload.id : null;

  // States
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('explore'); // 'explore' or 'my-groups'
  const [joiningGroupId, setJoiningGroupId] = useState('');
  const [localPendingJoinRequests, setLocalPendingJoinRequests] = useState({});
  const observerTarget = useRef(null);

  
  // Modal States
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState('');

  // Fetch groups
  const fetchGroups = async (pageNum = 1, append = false) => {
    try {
      if (append) setLoadingMore(true);
      else setLoading(true);
      
      const response = await groupApi.getAllGroups(pageNum, 10, searchQuery);
      const fetchedGroups = response.data?.data || response.data || [];
      const hasMoreData = response.data?.hasMore !== undefined ? response.data.hasMore : fetchedGroups.length === 10;
      
      if (append) {
        setGroups(prev => [...prev, ...fetchedGroups]);
      } else {
        setGroups(fetchedGroups);
      }
      setHasMore(hasMoreData);
      setPage(pageNum);
      setError('');
    } catch (err) {
      console.error('Lỗi khi tải danh sách nhóm:', err);
      setError(err.response?.data?.message || 'Không thể tải danh sách nhóm học tập.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    setPage(1);
    fetchGroups(1, false);
  }, [searchQuery]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading && !loadingMore) {
          fetchGroups(page + 1, true);
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
  }, [hasMore, loading, loadingMore, page, searchQuery]);

  // Handle Create Group
  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('Tên nhóm không được để trống.');
      return;
    }
    setFormError('');
    setCreating(true);

    try {
      const response = await groupApi.createGroup(name.trim(), description.trim());
      if (response.success || response.data) {
        toast.success('Tạo nhóm học tập thành công!');
        setName('');
        setDescription('');
        setShowModal(false);
        fetchGroups();
      }
    } catch (err) {
      console.error('Lỗi tạo nhóm:', err);
      setFormError(err.response?.data?.message || 'Có lỗi xảy ra khi tạo nhóm.');
      toast.error('Tạo nhóm thất bại.');
    } finally {
      setCreating(false);
    }
  };

  // Handle Join Group
  const handleJoin = async (id) => {
    if (!token) {
      toast.info('Vui lòng đăng nhập để tham gia nhóm.');
      navigate('/login');
      return;
    }

    try {
      setJoiningGroupId(id);
      const response = await groupApi.requestJoinGroup(id);
      if (response.success || response.data) {
        setLocalPendingJoinRequests((prev) => ({ ...prev, [id]: true }));
        setGroups((prevGroups) =>
          prevGroups.map((group) =>
            group._id === id
              ? {
                  ...group,
                  hasPendingJoinRequest: true,
                  joinRequestStatus: 'pending',
                }
              : group
          )
        );
        toast.success('Đã gửi yêu cầu tham gia nhóm, vui lòng chờ duyệt');
      }
    } catch (err) {
      console.error('Lỗi gửi yêu cầu tham gia nhóm:', err);
      toast.error(err.response?.data?.message || 'Không thể gửi yêu cầu tham gia nhóm.');
    } finally {
      setJoiningGroupId('');
    }
  };

  // Handle Leave Group
  const handleLeave = async (id, groupName) => {
    if (!window.confirm(`Bạn có chắc chắn muốn rời khỏi nhóm "${groupName}" không?`)) {
      return;
    }
    try {
      const response = await groupApi.leaveGroup(id);
      if (response.success || response.data) {
        toast.success(`Đã rời khỏi nhóm "${groupName}".`);
        fetchGroups();
      }
    } catch (err) {
      console.error('Lỗi rời nhóm:', err);
      toast.error(err.response?.data?.message || 'Không thể rời nhóm.');
    }
  };

  // Handle Delete Group
  const handleDelete = async (id, groupName) => {
    if (!window.confirm(`Hành động này sẽ XÓA VĨNH VIỄN nhóm "${groupName}". Bạn có chắc chắn không?`)) {
      return;
    }
    try {
      const response = await groupApi.deleteGroup(id);
      if (response.success || response.data) {
        toast.success(`Đã xóa nhóm "${groupName}".`);
        fetchGroups();
      }
    } catch (err) {
      console.error('Lỗi xóa nhóm:', err);
      toast.error(err.response?.data?.message || 'Không thể xóa nhóm.');
    }
  };

  // Helpers to check status
  const isMember = (group) => {
    if (!userId) return false;
    if (typeof group.isMember === 'boolean') return group.isMember;

    return group.members?.some((member) => getEntityId(member?.user || member) === userId.toString());
  };

  const isAdmin = (group) => {
    if (!userId) return false;
    if (typeof group.isAdmin === 'boolean') return group.isAdmin;

    return getEntityId(group.admin) === userId.toString();
  };

  const hasPendingJoinRequest = (group) => {
    const backendStatus = getJoinRequestStatus(group);
    if (backendStatus === 'pending') return true;

    return Boolean(localPendingJoinRequests[group._id]);
  };

  // Filter groups based on activeTab
  const filteredGroups = groups.filter((group) => {
    if (activeTab === 'my-groups') {
      return isMember(group) || isAdmin(group);
    }
    return true; // explore tab shows all
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <Navbar />

      <main className="flex-grow">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          
          {/* Header section */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <Users className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
                  Nhóm Học Tập
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  Lập dự án đồ án môn học, chia sẻ tài liệu và thảo luận học thuật
                </p>
              </div>
            </div>
            
            {token && (
              <button
                onClick={() => setShowModal(true)}
                className="inline-flex items-center justify-center px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl text-sm transition-all duration-200 shadow-md shadow-indigo-500/10 hover:shadow-lg hover:shadow-indigo-500/20 active:scale-95"
              >
                <Plus className="w-4 h-4 mr-2" />
                Tạo nhóm mới
              </button>
            )}
          </div>

          {/* Search bar & Tabs */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-800 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            {/* Tabs */}
            <div className="flex bg-gray-100 p-1 rounded-xl w-fit">
              <button
                onClick={() => setActiveTab('explore')}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  activeTab === 'explore'
                    ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:text-gray-100'
                }`}
              >
                Khám phá nhóm
              </button>
              {token && (
                <button
                  onClick={() => setActiveTab('my-groups')}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                    activeTab === 'my-groups'
                      ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:text-gray-100'
                  }`}
                >
                  Nhóm của tôi
                </button>
              )}
            </div>

            {/* Search Input */}
            <div className="relative flex-grow max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Tìm kiếm nhóm học tập..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all duration-200"
              />
            </div>
          </div>

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
              <Loader2 className="h-10 w-10 text-indigo-600 animate-spin" />
              <p className="mt-3 text-gray-500 dark:text-gray-400 text-sm font-medium">Đang tải danh sách nhóm...</p>
            </div>
          ) : filteredGroups.length === 0 ? (
            /* Empty state */
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-150 p-12 text-center max-w-xl mx-auto shadow-sm">
              <div className="h-16 w-16 bg-gray-50 dark:bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100 dark:border-gray-800">
                <Users className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">
                {searchQuery ? 'Không tìm thấy nhóm học tập nào' : 'Chưa có nhóm học tập nào'}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
                {searchQuery 
                  ? `Không tìm thấy kết quả nào khớp với "${searchQuery}". Vui lòng thử từ khóa khác.`
                  : activeTab === 'my-groups'
                    ? 'Bạn chưa tham gia hay quản lý nhóm học tập nào.'
                    : 'Hãy là người đầu tiên tạo nhóm học tập để kết nối đồ án/môn học!'}
              </p>
              {!searchQuery && activeTab === 'my-groups' && (
                <button
                  onClick={() => setActiveTab('explore')}
                  className="px-4 py-2 bg-gray-100 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-colors"
                >
                  Khám phá các nhóm khác
                </button>
              )}
              {token && !searchQuery && activeTab !== 'my-groups' && (
                <button
                  onClick={() => setShowModal(true)}
                  className="inline-flex items-center px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors"
                >
                  <Plus className="w-4 h-4 mr-2" /> Tạo nhóm ngay
                </button>
              )}
            </div>
          ) : (
            /* Groups Grid */
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredGroups.map((group) => {
                const groupAdmin = group.admin;
                const adminName = groupAdmin?.name || group.adminName || 'Ẩn danh';
                const memberCount = group.membersCount ?? group.members?.length ?? 0;
                const joined = isMember(group);
                const ownGroup = isAdmin(group);
                const pendingRequest = hasPendingJoinRequest(group);
                const joinActionLoading = joiningGroupId === group._id;

                return (
                  <div 
                    key={group._id} 
                    className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-800 hover:border-indigo-100 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between overflow-hidden group/card"
                  >
                    <div className="p-6">
                      {/* Name & Admin badge */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 group-hover/card:text-indigo-600 transition-colors line-clamp-1">
                          {group.name}
                        </h3>
                        {ownGroup && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-2xs font-semibold bg-purple-50 text-purple-700 border border-purple-100 whitespace-nowrap">
                            <Shield className="w-3 h-3 mr-0.5" />
                            Quản trị
                          </span>
                        )}
                        {!ownGroup && joined && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-2xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100 whitespace-nowrap">
                            Thành viên
                          </span>
                        )}
                        {!ownGroup && !joined && pendingRequest && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-2xs font-semibold bg-amber-50 text-amber-700 border border-amber-100 whitespace-nowrap">
                            Chờ duyệt
                          </span>
                        )}
                      </div>

                      {/* Description */}
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-4 leading-relaxed min-h-[40px]">
                        {group.description || 'Chưa có mô tả chi tiết cho nhóm này.'}
                      </p>

                      {/* Meta Info */}
                      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 pt-4 border-t border-gray-50">
                        <div className="flex items-center space-x-1">
                          <User className="w-3.5 h-3.5" />
                          <span>Admin: <strong className="font-medium text-gray-700 dark:text-gray-300">{adminName}</strong></span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Users className="w-3.5 h-3.5" />
                          <span>{memberCount} thành viên</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-50 flex items-center justify-between gap-2">
                      <div>
                        {ownGroup && (
                          <button
                            onClick={() => handleDelete(group._id, group.name)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Xóa nhóm"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                        {!ownGroup && joined && (
                          <button
                            onClick={() => handleLeave(group._id, group.name)}
                            className="p-2 text-orange-500 hover:bg-orange-50 rounded-lg transition-colors"
                            title="Rời nhóm"
                          >
                            <LogOut className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      {joined || ownGroup ? (
                        <button
                          onClick={() => navigate(`/groups/${group._id}`)}
                          className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-indigo-500/10 hover:shadow-indigo-500/20"
                        >
                          Truy cập nhóm
                          <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                        </button>
                      ) : pendingRequest ? (
                        <button
                          type="button"
                          disabled
                          className="inline-flex items-center px-4 py-2 bg-amber-50 text-amber-700 border border-amber-100 rounded-xl text-xs font-bold cursor-not-allowed"
                        >
                          Đang chờ duyệt
                        </button>
                      ) : (
                        <button
                          onClick={() => handleJoin(group._id)}
                          disabled={joinActionLoading}
                          className="inline-flex items-center px-4 py-2 bg-white dark:bg-gray-800 hover:bg-gray-100 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold transition-colors"
                        >
                          {joinActionLoading && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
                          Tham gia
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
              
              {loadingMore && (
                <div className="col-span-1 md:col-span-2 lg:col-span-3 flex justify-center py-4">
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
                </div>
              )}
              <div ref={observerTarget} className="col-span-1 md:col-span-2 lg:col-span-3 h-4"></div>
            </div>
          )}

        </div>
      </main>

      {/* Create Group Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden transform scale-100 transition-all">
            
            {/* Modal Header */}
            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center">
                <FolderGit2 className="w-5 h-5 mr-2 text-indigo-600" />
                Tạo Nhóm Học Tập Mới
              </h3>
              <button 
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:text-gray-400 text-xl font-bold"
              >
                &times;
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleCreateGroup} className="p-6">
              {formError && (
                <div className="bg-red-50 text-red-700 text-xs p-3 rounded-lg mb-4 flex items-start space-x-1.5 border border-red-100">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="mb-4">
                <label htmlFor="group-name" className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wider">
                  Tên nhóm học tập <span className="text-red-500">*</span>
                </label>
                <input
                  id="group-name"
                  type="text"
                  placeholder="Ví dụ: Đồ án CCNPMM - Nhóm 5"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="block w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-colors"
                  maxLength={100}
                />
              </div>

              <div className="mb-6">
                <label htmlFor="group-desc" className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wider">
                  Mô tả nhóm
                </label>
                <textarea
                  id="group-desc"
                  placeholder="Mô tả đề tài đồ án, mục tiêu học tập hoặc các thành viên cần tìm kiếm..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="block w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-colors resize-none"
                  maxLength={500}
                />
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:bg-gray-900 rounded-xl transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-indigo-500/10 transition-colors flex items-center justify-center"
                >
                  {creating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Tạo nhóm
                </button>
              </div>
            </form>

          </div>
        </div>
      )}
    </div>
  );
};

export default Groups;



