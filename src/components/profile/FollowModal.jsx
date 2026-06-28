import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { X, UserPlus, UserMinus } from 'lucide-react';
import { profileApi } from '../../services/api/profileApi';
import Avatar from '../common/Avatar';

const FollowModal = ({ isOpen, onClose, type, userId, loggedInUserId, currentFollowing, onFollowToggle }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !userId) return;

    const fetchUsers = async () => {
      setLoading(true);
      try {
        const res = type === 'followers' 
          ? await profileApi.getFollowers(userId)
          : await profileApi.getFollowing(userId);
        
        setUsers(res.data || []);
      } catch (err) {
        console.error('Lỗi khi tải danh sách:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [isOpen, type, userId]);

  if (!isOpen) return null;

  const isOwnProfile = userId === loggedInUserId;

  const handleToggle = async (targetId, isFollowingTarget) => {
    try {
      if (isFollowingTarget) {
        await profileApi.unfollowUser(targetId);
        // Nếu đang ở tab đang theo dõi của chính mình, xóa ngay khỏi UI
        if (isOwnProfile && type === 'following') {
          setUsers(users.filter(u => u.user?._id !== targetId));
        }
      } else {
        await profileApi.followUser(targetId);
      }
      // Gọi callback để update thông số bên ngoài (nếu cần thiết)
      if (onFollowToggle) {
        onFollowToggle();
      }
    } catch (err) {
      alert('Có lỗi xảy ra.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[80vh]">
        <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
            {type === 'followers' ? 'Người theo dõi' : 'Đang theo dõi'}
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full text-gray-500 dark:text-gray-400 transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-4 overflow-y-auto flex-1 custom-scrollbar">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400 text-sm">Danh sách trống.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {users.map((item) => {
                const u = item.user;
                if (!u) return null;
                
                // Kiểm tra xem mình có đang follow người này không (dựa trên danh sách truyền vào)
                // Hoặc nếu mình đang mở tab Following của chính mình thì chắc chắn là đang follow (trừ khi vừa unfollow)
                let isFollowingTarget = false;
                if (isOwnProfile && type === 'following') {
                  isFollowingTarget = true;
                } else if (currentFollowing) {
                  isFollowingTarget = currentFollowing.some(f => 
                     (typeof f.user === 'string' ? f.user : f.user._id) === u._id
                  );
                }

                return (
                  <div key={u._id} className="flex items-center justify-between gap-3">
                    <Link to={`/profile/${u._id}`} onClick={onClose} className="flex items-center gap-3 hover:opacity-80 transition-opacity flex-1 min-w-0">
                      <Avatar 
                        src={u.avatar} 
                        alt={u.name} 
                        className="w-12 h-12 border border-gray-100 dark:border-gray-800"
                      />
                      <div className="truncate">
                        <p className="font-semibold text-gray-900 dark:text-gray-100 truncate">{u.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{u.studentId || 'N/A'}</p>
                      </div>
                    </Link>
                    
                    {isOwnProfile && u._id !== loggedInUserId && (
                      <div className="flex-shrink-0">
                        {isFollowingTarget ? (
                          <button 
                            onClick={() => handleToggle(u._id, true)}
                            className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
                          >
                            Bỏ theo dõi
                          </button>
                        ) : (
                          <button 
                            onClick={() => handleToggle(u._id, false)}
                            className="bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-400 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
                          >
                            Theo dõi
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FollowModal;
