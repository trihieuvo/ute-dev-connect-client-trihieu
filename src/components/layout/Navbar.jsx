import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { User, LogOut, Bell, Heart, MessageCircle, UserPlus, CheckCircle2, Star, Menu, X, Home, Users, FolderGit2, Search, Bookmark, ChevronDown, EyeOff, Shield, AlertCircle } from 'lucide-react';
import { logout } from '../../store/authSlice';
import { getNotifications, getUnreadCount, markAsRead, markAllAsRead } from '../../store/notificationSlice';
import { profileApi } from '../../services/api/profileApi';
import Avatar from '../common/Avatar';
import ThemeToggle from '../common/ThemeToggle';

// Helper to decode token
const parseJwt = (token) => {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch (e) {
    return null;
  }
};

const Navbar = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { token, role } = useSelector((state) => state.auth);
  const { notifications, unreadCount } = useSelector((state) => state.notification);

  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [reputation, setReputation] = useState(0);
  const [userInfo, setUserInfo] = useState(null);
  
  const notificationRef = useRef(null);
  const userDropdownRef = useRef(null);

  const userPayload = token ? parseJwt(token) : null;
  const userId = userPayload ? userPayload.id : null;

  useEffect(() => {
    if (token) {
      dispatch(getUnreadCount());
      dispatch(getNotifications());
      profileApi.getProfile().then(res => {
         const profileData = res.data?.data || res.data;
         if (profileData && profileData.user) {
            setUserInfo(profileData.user);
            setReputation(profileData.user.reputation || 0);
         }
      }).catch(err => console.error(err));
    }
  }, [dispatch, token]);

  useEffect(() => {
    const handleAvatarUpdate = (e) => {
      const newAvatarUrl = e.detail;
      setUserInfo(prev => prev ? { ...prev, avatar: newAvatarUrl } : null);
    };

    window.addEventListener('avatarUpdated', handleAvatarUpdate);
    return () => {
      window.removeEventListener('avatarUpdated', handleAvatarUpdate);
    };
  }, []);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target)) {
        setShowUserDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNotificationClick = (notification) => {
    if (!notification.isRead) {
      dispatch(markAsRead(notification._id));
    }
    setShowNotifications(false);
    
    // Navigate based on type
    if (notification.type === 'like' || notification.type === 'comment' || notification.type === 'post_approved') {
      const postId = notification.post?._id || notification.post;
      if (postId) navigate(`/post/${postId}`);
    } else if (notification.type === 'follow') {
      navigate(`/profile/${notification.sender?._id || notification.sender}`);
    } else if (notification.type === 'post_pending') {
      const groupId = notification.post?.group;
      if (groupId) {
        navigate(`/groups/${groupId}`);
      } else {
        navigate('/groups');
      }
    }
  };

  const getNotificationIcon = (type) => {
    switch(type) {
      case 'like': return <Heart className="w-4 h-4 text-red-500 fill-red-500" />;
      case 'comment': return <MessageCircle className="w-4 h-4 text-blue-500 fill-blue-500" />;
      case 'follow': return <UserPlus className="w-4 h-4 text-green-500" />;
      case 'post_pending': return <Shield className="w-4 h-4 text-yellow-500" />;
      case 'post_approved': return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'post_rejected': return <AlertCircle className="w-4 h-4 text-red-500" />;
      default: return <Bell className="w-4 h-4 text-gray-500" />;
    }
  };

  const getNotificationText = (notification) => {
    const name = notification.sender?.name || 'Ai đó';
    switch(notification.type) {
      case 'like': return <><span className="font-semibold">{name}</span> đã thích bài viết của bạn.</>;
      case 'comment': return <><span className="font-semibold">{name}</span> đã bình luận về bài viết của bạn.</>;
      case 'follow': return <><span className="font-semibold">{name}</span> đã bắt đầu theo dõi bạn.</>;
      case 'post_pending': return <><span className="font-semibold">{name}</span> đã đăng một bài viết cần duyệt trong nhóm học tập.</>;
      case 'post_approved': return <><span className="font-semibold">{name}</span> đã phê duyệt bài viết của bạn.</>;
      case 'post_rejected': return <><span className="font-semibold">{name}</span> đã từ chối bài viết của bạn vì vi phạm tiêu chuẩn.</>;
      default: return 'Bạn có thông báo mới';
    }
  };

  const getTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " năm trước";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " tháng trước";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " ngày trước";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " giờ trước";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " phút trước";
    return "Vừa xong";
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <nav className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center space-x-6">
            {/* Logo */}
            <Link to="/" className="flex-shrink-0 flex items-center gap-2 group">
              <div className="h-10 w-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-md transform group-hover:scale-105 transition-transform duration-200">
                <span className="text-white font-bold text-lg tracking-tighter">UTE</span>
              </div>
              <span className="font-bold text-xl text-gray-900 dark:text-gray-100 tracking-tight">
                Connect
              </span>
            </Link>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center space-x-1">
              <Link 
                to="/dashboard" 
                className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800 px-3 py-2 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap"
              >
                Bảng tin
              </Link>
              <Link 
                to="/profiles" 
                className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800 px-3 py-2 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap"
              >
                Cộng đồng
              </Link>
              <Link 
                to="/groups" 
                className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800 px-3 py-2 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap"
              >
                Nhóm học tập
              </Link>
              <Link 
                to="/search" 
                className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800 px-3 py-2 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap"
              >
                Tìm kiếm
              </Link>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 sm:space-x-3">
            {token ? (
              <>
                <ThemeToggle className="hidden sm:block mr-1" />
                <Link to="/chat" className="hidden md:flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800 px-3 py-2 rounded-lg text-sm font-semibold transition-all" title="Tin nhắn">
                  <MessageCircle size={18} />
                  <span className="hidden lg:inline whitespace-nowrap">Tin nhắn</span>
                </Link>
                
                <div className="flex items-center gap-1.5 px-3 py-1.5 mx-1 rounded-full bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800 text-sm font-bold text-indigo-700 dark:text-indigo-400 transition-all cursor-default" title="Điểm Uy Tín (Reputation)">
                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                  <span>{reputation}</span>
                </div>
                
                {/* Notifications Dropdown */}
                <div className="relative" ref={notificationRef}>
                  <button 
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800 px-3 py-2 rounded-lg text-sm font-semibold transition-all relative"
                    title="Thông báo"
                  >
                    <Bell size={18} />
                    <span className="hidden lg:inline whitespace-nowrap">Thông báo</span>
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-2 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full md:hidden">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                    {unreadCount > 0 && (
                      <span className="hidden md:inline-flex items-center justify-center px-1.5 py-0.5 ml-1 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </button>
                  
                  {showNotifications && (
                    <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 z-50 overflow-hidden transform transition-all">
                      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                        <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200">Thông báo</h3>
                        {unreadCount > 0 && (
                          <button 
                            onClick={() => dispatch(markAllAsRead())}
                            className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center gap-1 font-medium"
                          >
                            <CheckCircle2 size={14} />
                            Đánh dấu đã đọc
                          </button>
                        )}
                      </div>
                      
                      <div className="max-h-[350px] overflow-y-auto">
                        {notifications.length > 0 ? (
                          notifications.slice(0, 5).map(notif => (
                            <div 
                              key={notif._id}
                              onClick={() => handleNotificationClick(notif)}
                              className={`p-3 border-b border-gray-50 dark:border-gray-800/50 flex items-start gap-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${!notif.isRead ? 'bg-blue-50/30 dark:bg-blue-900/10' : ''}`}
                            >
                              <div className="relative flex-shrink-0 mt-1">
                                <Avatar src={notif.sender?.avatar} alt="Avatar" className="w-10 h-10 border border-gray-200 dark:border-gray-700" />
                                <div className="absolute -bottom-1 -right-1 bg-white dark:bg-gray-900 rounded-full p-0.5 shadow-sm border border-gray-100 dark:border-gray-800">
                                  {getNotificationIcon(notif.type)}
                                </div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-gray-800 dark:text-gray-200 leading-snug">
                                  {getNotificationText(notif)}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-medium">
                                  {getTimeAgo(notif.createdAt)}
                                </p>
                              </div>
                              {!notif.isRead && (
                                <div className="w-2 h-2 rounded-full bg-blue-600 mt-2 flex-shrink-0"></div>
                              )}
                            </div>
                          ))
                        ) : (
                          <div className="p-8 text-center text-gray-500 flex flex-col items-center">
                            <Bell className="w-8 h-8 text-gray-300 dark:text-gray-600 mb-2" />
                            <p className="text-sm">Bạn không có thông báo nào</p>
                          </div>
                        )}
                      </div>
                      
                      <div className="p-2 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-800 text-center">
                        <Link 
                          to="/notifications" 
                          onClick={() => setShowNotifications(false)}
                          className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium block p-1"
                        >
                          Xem tất cả thông báo
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* User Dropdown */}
                <div className="relative" ref={userDropdownRef}>
                  <button
                    onClick={() => setShowUserDropdown(!showUserDropdown)}
                    className="hidden md:flex items-center gap-2 text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800 pl-2 pr-3 py-1.5 rounded-xl text-sm font-semibold transition-all border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50"
                  >
                    <Avatar src={userInfo?.avatar} alt={userInfo?.name} className="w-7 h-7 border border-gray-200 dark:border-gray-700 shadow-3xs" />
                    <span className="max-w-[100px] truncate">{userInfo?.name || 'Cá nhân'}</span>
                    <ChevronDown size={14} className={`text-gray-400 transition-transform duration-200 ${showUserDropdown ? 'rotate-180' : ''}`} />
                  </button>

                  {showUserDropdown && (
                    <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 z-50 overflow-hidden transform transition-all py-1.5">
                      <div className="px-4 py-2 border-b border-gray-50 dark:border-gray-800 mb-1">
                        <p className="text-xs text-gray-400 font-medium">Tài khoản</p>
                        <p className="text-sm font-bold text-gray-800 dark:text-gray-200 truncate">{userInfo?.name || 'Thành viên'}</p>
                        {userInfo?.email && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate font-normal mt-0.5">{userInfo.email}</p>
                        )}
                      </div>

                      <Link
                        to={userId ? `/profile/${userId}` : `/edit-profile`}
                        onClick={() => setShowUserDropdown(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-blue-50/50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors"
                      >
                        <User size={16} className="text-gray-400 dark:text-gray-500" />
                        <span>Hồ sơ của tôi</span>
                      </Link>

                      <Link
                        to="/saved-posts"
                        onClick={() => setShowUserDropdown(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-blue-50/50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors"
                      >
                        <Bookmark size={16} className="text-gray-400 dark:text-gray-500" />
                        <span>Bài viết đã lưu</span>
                      </Link>

                      <Link
                        to="/hidden-posts"
                        onClick={() => setShowUserDropdown(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-blue-50/50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors"
                      >
                        <EyeOff size={16} className="text-gray-400 dark:text-gray-500" />
                        <span>Bài viết đã ẩn</span>
                      </Link>

                      {role === 'admin' && (
                        <Link
                          to="/admin/filters"
                          onClick={() => setShowUserDropdown(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-sm text-rose-600 dark:text-rose-400 hover:bg-rose-50/50 dark:hover:bg-rose-900/20 font-medium transition-colors"
                        >
                          <FolderGit2 size={16} className="text-rose-400 dark:text-rose-500" />
                          <span>Quản lý Bộ Lọc</span>
                        </Link>
                      )}

                      <div className="border-t border-gray-100 dark:border-gray-800 my-1"></div>

                      <button
                        onClick={() => {
                          setShowUserDropdown(false);
                          handleLogout();
                        }}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50/60 dark:hover:bg-red-900/20 font-semibold transition-colors text-left"
                      >
                        <LogOut size={16} />
                        <span>Đăng xuất</span>
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <ThemeToggle className="hidden sm:block mr-1" />
                <Link 
                  to="/login" 
                  className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white px-3 py-2 rounded-lg text-sm font-semibold transition-colors"
                >
                  Đăng nhập
                </Link>
                <Link 
                  to="/register" 
                  className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 px-3 py-2 rounded-lg text-sm font-semibold transition-colors hidden sm:block"
                >
                  Đăng ký
                </Link>
                <Link 
                  to="/auth/forgot-password" 
                  className="bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-lg text-sm font-semibold shadow-sm shadow-blue-500/30 transition-all hover:shadow-md hover:shadow-blue-500/40"
                >
                  Quên mật khẩu
                </Link>
                <Link
                  to="/saved-posts"
                  className="hidden md:flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800 px-3 py-2 rounded-lg text-sm font-semibold transition-colors"
                >
                  Bài viết đã lưu
                </Link>
              </>
            )}

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-200 md:hidden transition-colors"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/30 dark:bg-black/50 backdrop-blur-xs animate-fade-in" onClick={() => setMobileMenuOpen(false)}>
          <div 
            className="absolute right-0 top-0 bottom-0 w-64 bg-white dark:bg-gray-900 shadow-2xl p-6 flex flex-col space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Drawer */}
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800">
              {token && userInfo ? (
                <div className="flex items-center gap-2">
                  <Avatar src={userInfo.avatar} alt="Avatar" className="w-8 h-8 border border-gray-200 dark:border-gray-700" />
                  <div className="flex flex-col">
                    <span className="font-bold text-sm text-gray-900 dark:text-gray-100 leading-tight">{userInfo.name}</span>
                    <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">★ {reputation} uy tín</span>
                  </div>
                </div>
              ) : (
                <span className="font-bold text-lg text-gray-900 dark:text-gray-100">Danh mục</span>
              )}
              <button onClick={() => setMobileMenuOpen(false)} className="p-1 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400">
                <X size={20} />
              </button>
            </div>

            {/* Navigation links */}
            <div className="flex flex-col space-y-1 overflow-y-auto flex-1">
              <Link 
                to="/dashboard" 
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors"
              >
                <Home size={18} />
                Bảng tin
              </Link>
              <Link 
                to="/profiles" 
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors"
              >
                <Users size={18} />
                Cộng đồng
              </Link>
              <Link 
                to="/groups" 
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors"
              >
                <FolderGit2 size={18} />
                Nhóm học tập
              </Link>
              <Link 
                to="/search" 
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors"
              >
                <Search size={18} />
                Tìm kiếm
              </Link>

              {token ? (
                <>
                  <Link 
                    to="/chat" 
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors"
                  >
                    <MessageCircle size={18} />
                    Tin nhắn
                  </Link>
                  <Link 
                    to={userId ? `/profile/${userId}` : `/edit-profile`} 
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors"
                  >
                    <User size={18} />
                    Hồ sơ của tôi
                  </Link>
                  <Link 
                    to="/saved-posts" 
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors"
                  >
                    <Bookmark size={18} />
                    Bài viết đã lưu
                  </Link>
                  <Link 
                    to="/hidden-posts" 
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors"
                  >
                    <EyeOff size={18} />
                    Bài viết đã ẩn
                  </Link>
                  {role === 'admin' && (
                    <Link 
                      to="/admin/filters" 
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 px-3 py-2.5 rounded-lg text-sm font-bold transition-colors"
                    >
                      <FolderGit2 size={18} className="text-rose-500 dark:text-rose-400" />
                      Quản lý Bộ Lọc
                    </Link>
                  )}
                  
                  <div className="pt-4 mt-4 border-t border-gray-100 dark:border-gray-800">
                    <button 
                      onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                      className="w-full flex items-center gap-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors"
                    >
                      <LogOut size={18} />
                      Đăng xuất
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="pt-4 mt-4 border-t border-gray-100 dark:border-gray-800 flex flex-col gap-2">
                    <Link 
                      to="/login" 
                      onClick={() => setMobileMenuOpen(false)}
                      className="w-full flex justify-center py-2 px-3 text-center text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg text-sm font-semibold transition-colors border border-gray-200 dark:border-gray-700"
                    >
                      Đăng nhập
                    </Link>
                    <Link 
                      to="/register" 
                      onClick={() => setMobileMenuOpen(false)}
                      className="w-full flex justify-center py-2 px-3 text-center bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-lg text-sm font-semibold transition-colors"
                    >
                      Đăng ký
                    </Link>
                    <Link 
                      to="/auth/forgot-password" 
                      onClick={() => setMobileMenuOpen(false)}
                      className="w-full flex justify-center py-2 px-3 text-center text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 text-xs font-semibold"
                    >
                      Quên mật khẩu?
                    </Link>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
