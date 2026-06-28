import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { profileApi } from '../../services/api/profileApi';
import { postApi } from '../../services/api/postApi';
import { createOrGetConversation } from '../../store/chatSlice';
import PostItem from '../../components/posts/PostItem';
import Avatar from '../../components/common/Avatar';
import ReputationBadge from '../../components/common/ReputationBadge';
import FollowModal from '../../components/profile/FollowModal';
import RankBadge from '../../components/common/RankBadge';
import { MapPin, Briefcase, GraduationCap, Globe, Code, Video, MessageCircle, Users, Camera, Link as LinkIcon, MessageSquare, User, UserPlus, UserMinus, X } from 'lucide-react';

// Helper to decode token
const parseJwt = (token) => {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch (e) {
    return null;
  }
};

const Profile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { token } = useSelector((state) => state.auth);
  const userPayload = token ? parseJwt(token) : null;
  const loggedInUserId = userPayload ? userPayload.id : null;

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [posts, setPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [postsLoadingMore, setPostsLoadingMore] = useState(false);
  const [postsPage, setPostsPage] = useState(1);
  const [postsHasMore, setPostsHasMore] = useState(true);
  const [modalConfig, setModalConfig] = useState({ isOpen: false, type: 'followers' });
  const [isAvatarZoomed, setIsAvatarZoomed] = useState(false);
  const observerTarget = useRef(null);

  const handleMessage = async () => {
    if (!profile?.user?._id) return;
    try {
      await dispatch(createOrGetConversation(profile.user._id)).unwrap();
      navigate('/chat');
    } catch (err) {
      console.error('Lỗi khi mở phòng chat:', err);
      navigate('/chat');
    }
  };

  const handleFollow = async () => {
    if (!loggedInUserId) {
      alert('Vui lòng đăng nhập để theo dõi người dùng này.');
      return;
    }
    try {
      const res = await profileApi.followUser(profile.user._id);
      setProfile(prev => ({
        ...prev,
        user: {
          ...prev.user,
          followers: res.data.followers
        }
      }));
    } catch (err) {
      console.error('Lỗi khi follow:', err);
      alert(err.response?.data?.msg || 'Có lỗi xảy ra khi theo dõi.');
    }
  };

  const handleUnfollow = async () => {
    if (!loggedInUserId) return;
    try {
      const res = await profileApi.unfollowUser(profile.user._id);
      setProfile(prev => ({
        ...prev,
        user: {
          ...prev.user,
          followers: res.data.followers
        }
      }));
    } catch (err) {
      console.error('Lỗi khi unfollow:', err);
      alert(err.response?.data?.msg || 'Có lỗi xảy ra khi bỏ theo dõi.');
    }
  };

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await profileApi.getProfileById(id);
      setProfile(res.data);
      
      // Khởi tạo fetch bài viết trang 1
      fetchUserPosts(res.data?.user?._id, 1, false);
    } catch (err) {
      console.error('Lỗi tải profile:', err);
      setError('Không tìm thấy hồ sơ người dùng này.');
      setLoading(false);
    }
  };

  const fetchUserPosts = async (targetUserId, pageNum = 1, append = false) => {
    if (!targetUserId) return;
    try {
      if (append) setPostsLoadingMore(true);
      else setPostsLoading(true);

      const postsRes = await postApi.getUserPosts(targetUserId, pageNum, 5);
      const fetchedPosts = postsRes?.data?.data || postsRes?.data || [];
      const hasMoreData = postsRes?.data?.hasMore !== undefined ? postsRes.data.hasMore : fetchedPosts.length === 5;

      if (append) {
        setPosts(prev => [...prev, ...fetchedPosts]);
      } else {
        setPosts(fetchedPosts);
      }
      setPostsHasMore(hasMoreData);
      setPostsPage(pageNum);
    } catch (postErr) {
      console.error('Lỗi tải bài viết của người dùng:', postErr);
    } finally {
      setPostsLoading(false);
      setPostsLoadingMore(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [id]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsAvatarZoomed(false);
      }
    };
    if (isAvatarZoomed) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isAvatarZoomed]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && postsHasMore && !postsLoading && !postsLoadingMore && profile?.user?._id) {
          fetchUserPosts(profile.user._id, postsPage + 1, true);
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
  }, [postsHasMore, postsLoading, postsLoadingMore, postsPage, profile]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="max-w-4xl mx-auto py-20 px-4 text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">404 Not Found</h1>
        <p className="text-xl text-gray-600 mb-8">{error || 'Hồ sơ không tồn tại.'}</p>
        <Link to="/profiles" className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition">
          Trở về trang Khám phá
        </Link>
      </div>
    );
  }

  const { user, status, company, location, website, social, bio, skills, faculty, classCode } = profile;

  return (
    <>
      <div className="max-w-4xl mx-auto pb-20 animate-fade-in">
        {/* Cover Image & Basic Info Header */}
        <div className="bg-white dark:bg-gray-800 shadow-md rounded-2xl overflow-hidden mb-8">
          {/* Cover Image Placeholder */}
          <div className="h-48 bg-gradient-to-r from-blue-500 to-indigo-600 w-full object-cover"></div>
          
          <div className="px-8 pb-8 relative">
            <div className="flex flex-col md:flex-row justify-between items-center md:items-end -mt-16 md:-mt-20 mb-6">
              <div 
                onClick={() => setIsAvatarZoomed(true)} 
                className="cursor-pointer transition-transform duration-300 hover:scale-105 active:scale-95 group relative"
                title="Xem ảnh đại diện"
              >
                <Avatar 
                  src={user?.avatar} 
                  alt={user?.name} 
                  className="w-32 h-32 md:w-40 md:h-40 border-4 border-white dark:border-gray-800 shadow-lg bg-white dark:bg-gray-800"
                />
                <div className="absolute inset-0 bg-black/10 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center"></div>
              </div>
              <div className="mt-4 md:mt-0 flex gap-3">
                {loggedInUserId === user?._id ? (
                  <Link to="/edit-profile" className="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 px-6 py-2.5 rounded-xl font-medium shadow-sm transition-colors flex items-center gap-2">
                    <User size={18} />
                    Chỉnh sửa hồ sơ
                  </Link>
                ) : (
                  <>
                    <button 
                      onClick={handleMessage}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-medium shadow-sm transition-colors flex items-center gap-2"
                    >
                      <MessageSquare size={18} />
                      Nhắn tin
                    </button>
                    {user?.followers?.some(f => f.user === loggedInUserId) ? (
                      <button 
                        onClick={handleUnfollow}
                        className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 px-6 py-2.5 rounded-xl font-medium shadow-sm transition-colors flex items-center gap-2"
                      >
                        <UserMinus size={18} />
                        Bỏ theo dõi
                      </button>
                    ) : (
                      <button 
                        onClick={handleFollow}
                        className="bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-800/40 text-blue-700 dark:text-blue-400 px-6 py-2.5 rounded-xl font-medium shadow-sm transition-colors flex items-center gap-2"
                      >
                        <UserPlus size={18} />
                        Theo dõi
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
            
            <div className="text-center md:text-left">
              <div className="flex flex-col md:flex-row items-center md:items-baseline gap-2.5 justify-center md:justify-start">
                <h1 className="text-3xl font-extrabold text-gray-900 dark:text-gray-100">{user?.name}</h1>
                <div className="flex items-center gap-1.5">
                  <ReputationBadge score={user?.reputation} className="px-2 py-0.5 text-xs shadow-3xs" />
                  <RankBadge score={user?.reputation} className="text-2xs px-2.5 py-0.5 border font-bold rounded-full" />
                </div>
              </div>
              <p className="text-xl text-gray-600 dark:text-gray-400 mt-1 font-medium">{status} {company && `tại ${company}`}</p>
              
              <div className="flex justify-center md:justify-start gap-4 mt-3">
                <button 
                  onClick={() => setModalConfig({ isOpen: true, type: 'followers' })} 
                  className="font-semibold text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
                >
                  {user?.followers?.length || 0} <span className="text-gray-500 dark:text-gray-400 font-normal">người theo dõi</span>
                </button>
                <button 
                  onClick={() => setModalConfig({ isOpen: true, type: 'following' })} 
                  className="font-semibold text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
                >
                  {user?.following?.length || 0} <span className="text-gray-500 dark:text-gray-400 font-normal">đang theo dõi</span>
                </button>
              </div>
              
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mt-4 text-gray-500 dark:text-gray-400 text-sm">
                {location && (
                  <div className="flex items-center gap-1.5">
                    <MapPin size={16} />
                    <span>{location}</span>
                  </div>
                )}
                {faculty && (
                  <div className="flex items-center gap-1.5">
                    <GraduationCap size={16} />
                    <span>{faculty} {classCode ? `(${classCode})` : ''}</span>
                  </div>
                )}
                {website && (
                  <a href={website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 hover:underline">
                    <Globe size={16} />
                    <span>Website</span>
                  </a>
                )}
              </div>

              {/* Social Links */}
              <div className="flex items-center justify-center md:justify-start gap-4 mt-6">
                {profile.githubusername && (
                  <a href={`https://github.com/${profile.githubusername}`} target="_blank" rel="noopener noreferrer" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200">
                    <Code size={24} />
                  </a>
                )}
                {social?.youtube && <a href={social.youtube} target="_blank" rel="noopener noreferrer" className="text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-500"><Video size={24} /></a>}
                {social?.twitter && <a href={social.twitter} target="_blank" rel="noopener noreferrer" className="text-gray-600 dark:text-gray-400 hover:text-blue-400"><MessageCircle size={24} /></a>}
                {social?.facebook && <a href={social.facebook} target="_blank" rel="noopener noreferrer" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"><Users size={24} /></a>}
                {social?.linkedin && <a href={social.linkedin} target="_blank" rel="noopener noreferrer" className="text-gray-600 dark:text-gray-400 hover:text-blue-700 dark:hover:text-blue-500"><Briefcase size={24} /></a>}
                {social?.instagram && <a href={social.instagram} target="_blank" rel="noopener noreferrer" className="text-gray-600 dark:text-gray-400 hover:text-pink-600 dark:hover:text-pink-400"><Camera size={24} /></a>}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Bio & Skills */}
          <div className="lg:col-span-1 space-y-8">
            <div className="bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700 rounded-2xl p-6">
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                Giới thiệu
              </h2>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-sm">
                {bio || 'Chưa có thông tin giới thiệu.'}
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700 rounded-2xl p-6">
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">Kỹ năng</h2>
              <div className="flex flex-wrap gap-2">
                {skills?.map((skill, index) => (
                  <span key={index} className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Posts (Tường nhà) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700 rounded-2xl p-6 mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-1">Bài viết của {user?.name}</h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Hoạt động và chia sẻ gần đây</p>
            </div>

            {/* Real user posts or loader or placeholder */}
            {postsLoading ? (
              <div className="flex justify-center items-center py-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : posts.length > 0 ? (
              <div className="space-y-4">
                {posts.map((post) => (
                  <PostItem key={post._id} post={post} />
                ))}
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-12 text-center border border-gray-100 dark:border-gray-800">
                <div className="w-16 h-16 bg-gray-50 dark:bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">Chưa có bài viết nào</h3>
                <p className="text-gray-500 dark:text-gray-400">Người dùng này chưa có bài viết nào.</p>
              </div>
            )}

            {postsLoadingMore && (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            )}
            <div ref={observerTarget} className="h-4 w-full"></div>
          </div>
        </div>

        <FollowModal 
          isOpen={modalConfig.isOpen} 
          onClose={() => setModalConfig({ ...modalConfig, isOpen: false })} 
          type={modalConfig.type} 
          userId={user?._id}
          loggedInUserId={loggedInUserId}
          currentFollowing={user?.following}
          onFollowToggle={() => fetchProfileAndPosts()}
        />
      </div>

      {/* Lightbox for Avatar Zoom */}
      {isAvatarZoomed && (
        <div 
          className="fixed inset-0 z-[999] bg-black/90 backdrop-blur-md flex items-center justify-center animate-fade-in p-4"
          onClick={() => setIsAvatarZoomed(false)}
        >
          {/* Close Button */}
          <button 
            onClick={() => setIsAvatarZoomed(false)}
            className="absolute top-6 right-6 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-3 rounded-full transition-all duration-200 cursor-pointer"
            aria-label="Close"
          >
            <X size={24} />
          </button>
          
          {/* Image Container */}
          <div className="relative max-w-2xl w-full max-h-[85vh] flex items-center justify-center">
            <img 
              src={user?.avatar || 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y'} 
              alt={user?.name || "Avatar"} 
              className="max-w-full max-h-[80vh] rounded-2xl border-4 border-white/10 shadow-2xl object-contain select-none transition-all duration-300"
              onClick={(e) => e.stopPropagation()} 
            />
            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-white font-semibold text-lg text-center drop-shadow-md whitespace-nowrap">
              {user?.name}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Profile;
