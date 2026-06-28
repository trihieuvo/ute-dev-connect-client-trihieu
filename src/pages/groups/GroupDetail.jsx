import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import Navbar from '../../components/layout/Navbar';
import groupApi from '../../services/api/groupApi';
import { postApi } from '../../services/api/postApi';
import { 
  Users, ArrowLeft, Loader2, MessageSquare, ThumbsUp, 
  Shield, Calendar, SendHorizontal, AlertCircle, LogOut, Lock,
  HelpCircle, MessageSquarePlus, Eye, Edit2, CheckCircle, Clock3,
  Crown, Mail, UserCheck, UserX, X, Trash2, Plus, Search, ShieldAlert, Settings
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import CommentSection from '../../components/interactions/CommentSection';
import RankBadge from '../../components/common/RankBadge';

// Helper to decode token
const parseJwt = (token) => {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return null;
  }
};

const DEFAULT_AVATAR = 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y';

const getEntityId = (entity) => {
  if (!entity) return '';
  if (typeof entity === 'string' || typeof entity === 'number') {
    return entity.toString();
  }

  return (entity._id || entity.id || entity.userId || '').toString();
};

const getMemberUser = (member) => {
  if (!member) return null;
  if (member.user && typeof member.user === 'object') return member.user;
  if (member.member && typeof member.member === 'object') return member.member;
  if (
    typeof member === 'object' &&
    ('_id' in member || 'name' in member || 'avatar' in member || 'email' in member)
  ) {
    return member;
  }

  return null;
};

const getJoinRequestUser = (request) => {
  if (!request) return null;
  if (request.user && typeof request.user === 'object') return request.user;
  if (request.requester && typeof request.requester === 'object') return request.requester;
  if (request.member && typeof request.member === 'object') return request.member;
  if (
    typeof request === 'object' &&
    ('_id' in request || 'name' in request || 'avatar' in request || 'email' in request)
  ) {
    return request;
  }

  return null;
};

const extractArrayPayload = (response) => {
  const payload = response?.data?.data ?? response?.data ?? [];

  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.requests)) return payload.requests;
  if (Array.isArray(payload?.joinRequests)) return payload.joinRequests;

  return [];
};

const isUserMemberOfGroup = (groupData, currentUserId) => {
  if (!groupData || !currentUserId) return false;
  if (typeof groupData.isMember === 'boolean') return groupData.isMember;

  return groupData.members?.some(
    (member) => getEntityId(member?.user || member) === currentUserId.toString()
  );
};

const isUserGroupAdmin = (groupData, currentUserId) => {
  if (!groupData || !currentUserId) return false;
  if (typeof groupData.isAdmin === 'boolean') return groupData.isAdmin;

  return getEntityId(groupData.admin) === currentUserId.toString();
};

const isUserGroupMod = (groupData, currentUserId) => {
  if (!groupData || !currentUserId) return false;
  if (typeof groupData.isMod === 'boolean') return groupData.isMod;

  return groupData.moderators?.some((moderator) => getEntityId(moderator) === currentUserId.toString());
};

const getJoinRequestStatus = (groupData) => {
  if (!groupData) return '';

  if (groupData.joinRequestStatus) {
    return String(groupData.joinRequestStatus).toLowerCase();
  }

  if (typeof groupData.hasPendingJoinRequest === 'boolean') {
    return groupData.hasPendingJoinRequest ? 'pending' : '';
  }

  return '';
};

const GroupDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useSelector((state) => state.auth);

  const userPayload = token ? parseJwt(token) : null;
  const userId = userPayload ? userPayload.id : null;

  // States
  const [group, setGroup] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedLoading, setFeedLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState('');
  const observerTarget = import('react').then(React => React.useRef(null)); // need to use useRef from import

  
  // Post & Comment States
  const [newPostText, setNewPostText] = useState('');
  const [submittingPost, setSubmittingPost] = useState(false);
  const [expandedComments, setExpandedComments] = useState({}); // { [postId]: boolean }
  const [isQuestion, setIsQuestion] = useState(false);
  const [showCodeSnippet, setShowCodeSnippet] = useState(false);
  const [codeSnippet, setCodeSnippet] = useState('');
  const [codeLanguage, setCodeLanguage] = useState('javascript');
  const [isPreview, setIsPreview] = useState(false);
  const [editingPostId, setEditingPostId] = useState(null);
  const [editingPostText, setEditingPostText] = useState('');
  const [selectedDetailPost, setSelectedDetailPost] = useState(null);

  // Tabs
  const [activeTab, setActiveTab] = useState('feed'); // 'feed' or 'pending' or 'join-requests' or 'members'
  const [pendingPosts, setPendingPosts] = useState([]);
  const [pendingLoading, setPendingLoading] = useState(false);
  const [pendingPostAction, setPendingPostAction] = useState({ postId: '', type: '' });
  const [joinRequests, setJoinRequests] = useState([]);
  const [joinRequestsLoading, setJoinRequestsLoading] = useState(false);
  const [joinRequestAction, setJoinRequestAction] = useState({ userId: '', type: '' });
  const [joinSubmitting, setJoinSubmitting] = useState(false);
  const [hasLocalPendingJoinRequest, setHasLocalPendingJoinRequest] = useState(false);
  const [moderatorActionUserId, setModeratorActionUserId] = useState('');
  const [groupBannedWords, setGroupBannedWords] = useState([]);
  const [groupBannedWordsLoading, setGroupBannedWordsLoading] = useState(false);
  const [newGroupWord, setNewGroupWord] = useState('');
  const [groupWordSearch, setGroupWordSearch] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    type: '',
    payload: null,
    title: '',
    message: '',
    confirmText: '',
  });
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [privacyType, setPrivacyType] = useState('private');
  const [postModerationType, setPostModerationType] = useState('auto');
  const [settingsLoading, setSettingsLoading] = useState(false);

  // Fetch Group Info & Feed
  const fetchGroupData = async ({ showPageLoader = true } = {}) => {
    try {
      if (showPageLoader) {
        setLoading(true);
      }
      const response = await groupApi.getGroupById(id);
      const groupData = response.data?.data || response.data || null;
      setGroup(groupData);
      if (groupData) {
        setPrivacyType(groupData.privacyType || 'private');
        setPostModerationType(groupData.postModerationType || 'auto');
      }
      
      const isMember = isUserMemberOfGroup(groupData, userId);
      const isAdmin = isUserGroupAdmin(groupData, userId);
      const isMod = isUserGroupMod(groupData, userId);
      const requestStatus = getJoinRequestStatus(groupData);

      if (requestStatus === 'pending') {
        setHasLocalPendingJoinRequest(true);
      } else if (isMember || isAdmin || ['approved', 'rejected', 'none'].includes(requestStatus)) {
        setHasLocalPendingJoinRequest(false);
      }

      // If member/admin, fetch internal feed
      if (groupData && (isMember || isAdmin)) {
        await fetchFeed();
        
        // If admin/mod, fetch pending posts & join requests counts
        if (isAdmin || isMod) {
          try {
            const pendingResponse = await groupApi.getPendingPosts(id);
            setPendingPosts(extractArrayPayload(pendingResponse));
          } catch (e) {
            console.error('Lỗi khi lấy số lượng bài viết chờ duyệt:', e);
          }
          try {
            const requestsResponse = await groupApi.getJoinRequests(id);
            setJoinRequests(extractArrayPayload(requestsResponse));
          } catch (e) {
            console.error('Lỗi khi lấy số lượng yêu cầu tham gia:', e);
          }
        } else {
          setPendingPosts([]);
          setJoinRequests([]);
        }
      } else {
        setPosts([]);
        setPendingPosts([]);
        setJoinRequests([]);
      }
      setError('');
    } catch (err) {
      console.error('Lỗi khi tải chi tiết nhóm:', err);
      setError(err.response?.data?.message || 'Không thể tải thông tin nhóm học tập.');
    } finally {
      if (showPageLoader) {
        setLoading(false);
      }
    }
  };

  const fetchFeed = async (pageNum = 1, append = false) => {
    try {
      if (append) setLoadingMore(true);
      else setFeedLoading(true);

      const response = await groupApi.getGroupFeed(id, pageNum, 10);
      const feedPosts = response.data?.data || response.data || [];
      const hasMoreData = response.data?.hasMore !== undefined ? response.data.hasMore : feedPosts.length === 10;

      if (append) {
        setPosts(prev => [...prev, ...feedPosts]);
      } else {
        setPosts(feedPosts);
      }
      setHasMore(hasMoreData);
      setPage(pageNum);
    } catch (err) {
      console.error('Lỗi khi tải bảng tin nhóm:', err);
      toast.error('Không thể tải bảng tin nhóm.');
    } finally {
      setFeedLoading(false);
      setLoadingMore(false);
    }
  };

  const fetchPendingPosts = async () => {
    try {
      setPendingLoading(true);
      const response = await groupApi.getPendingPosts(id);
      setPendingPosts(extractArrayPayload(response));
    } catch (err) {
      console.error('Lỗi khi tải bài đăng chờ duyệt:', err);
      toast.error(err.response?.data?.message || 'Không thể tải bài đăng chờ duyệt.');
    } finally {
      setPendingLoading(false);
    }
  };

  const fetchJoinRequests = async () => {
    try {
      setJoinRequestsLoading(true);
      const response = await groupApi.getJoinRequests(id);
      setJoinRequests(extractArrayPayload(response));
    } catch (err) {
      console.error('Lỗi khi tải yêu cầu tham gia nhóm:', err);
      toast.error(err.response?.data?.message || 'Không thể tải yêu cầu tham gia nhóm.');
    } finally {
      setJoinRequestsLoading(false);
    }
  };

  const fetchGroupFilters = async () => {
    try {
      setGroupBannedWordsLoading(true);
      const response = await groupApi.getGroupFilters(id);
      setGroupBannedWords(response.data?.data || response.data || []);
    } catch (err) {
      console.error('Lỗi khi tải bộ lọc từ cấm của nhóm:', err);
      toast.error(err.response?.data?.message || 'Không thể tải bộ lọc từ cấm của nhóm.');
    } finally {
      setGroupBannedWordsLoading(false);
    }
  };

  const handleAddGroupWord = async (e) => {
    e.preventDefault();
    const cleanWord = newGroupWord.trim();
    if (!cleanWord) return;

    if (groupBannedWords.some(w => w.toLowerCase() === cleanWord.toLowerCase())) {
      toast.warning('Từ cấm này đã tồn tại trong danh sách của nhóm.');
      return;
    }

    setActionLoading(true);
    try {
      const res = await groupApi.addGroupFilter(id, cleanWord);
      setGroupBannedWords(res.data?.data || res.data || []);
      setNewGroupWord('');
      toast.success(`Đã thêm từ cấm "${cleanWord}" thành công!`);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Lỗi khi thêm từ cấm.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteGroupWord = async (word) => {
    setActionLoading(true);
    try {
      const res = await groupApi.deleteGroupFilter(id, word);
      setGroupBannedWords(res.data?.data || res.data || []);
      toast.success(`Đã xóa từ cấm "${word}" thành công!`);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Lỗi khi xóa từ cấm.');
    } finally {
      setActionLoading(false);
    }
  };

  const openConfirmDialog = ({ type, payload = null, title, message, confirmText }) => {
    setConfirmDialog({
      isOpen: true,
      type,
      payload,
      title,
      message,
      confirmText,
    });
  };

  const closeConfirmDialog = (force = false) => {
    if (confirmLoading && !force) return;

    setConfirmDialog({
      isOpen: false,
      type: '',
      payload: null,
      title: '',
      message: '',
      confirmText: '',
    });
  };

  const handleToggleModerator = async (targetUserId) => {
    try {
      setModeratorActionUserId(targetUserId);
      const res = await groupApi.toggleModerator(id, targetUserId);
      if (res.data) {
        toast.success(res.data.message || 'Cập nhật quyền kiểm duyệt viên thành công');
        await fetchGroupData({ showPageLoader: false });
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Không thể cập nhật quyền kiểm duyệt viên.');
    } finally {
      setModeratorActionUserId('');
    }
  };

  const handleApprovePost = async (postId) => {
    try {
      setPendingPostAction({ postId, type: 'approve' });
      const res = await groupApi.approvePost(id, postId);
      if (res.data) {
        toast.success(res.data.message || 'Đã phê duyệt bài viết.');
        setPendingPosts((prev) => prev.filter((post) => post._id !== postId));
        await fetchFeed();
        await fetchGroupData({ showPageLoader: false });
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Không thể phê duyệt bài viết.');
    } finally {
      setPendingPostAction({ postId: '', type: '' });
    }
  };

  const handleRejectPost = (postId) => {
    openConfirmDialog({
      type: 'reject-post',
      payload: { postId },
      title: 'Từ chối bài viết',
      message: 'Bạn có chắc muốn từ chối và xóa bài viết này khỏi danh sách chờ duyệt không?',
      confirmText: 'Xác nhận từ chối',
    });
  };

  const handleApproveJoinRequest = async (targetUserId) => {
    try {
      setJoinRequestAction({ userId: targetUserId, type: 'approve' });
      const res = await groupApi.approveJoinRequest(id, targetUserId);
      if (res.data) {
        toast.success(res.data.message || 'Đã duyệt yêu cầu tham gia nhóm.');
        setJoinRequests((prev) =>
          prev.filter((request) => getEntityId(getJoinRequestUser(request)) !== targetUserId.toString())
        );
        await fetchGroupData({ showPageLoader: false });
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Không thể duyệt yêu cầu tham gia nhóm.');
    } finally {
      setJoinRequestAction({ userId: '', type: '' });
    }
  };

  const handleRejectJoinRequest = async (targetUserId) => {
    try {
      setJoinRequestAction({ userId: targetUserId, type: 'reject' });
      const res = await groupApi.rejectJoinRequest(id, targetUserId);
      if (res.data) {
        toast.success(res.data.message || 'Đã từ chối yêu cầu tham gia nhóm.');
        setJoinRequests((prev) =>
          prev.filter((request) => getEntityId(getJoinRequestUser(request)) !== targetUserId.toString())
        );
        await fetchGroupData({ showPageLoader: false });
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Không thể từ chối yêu cầu tham gia nhóm.');
    } finally {
      setJoinRequestAction({ userId: '', type: '' });
    }
  };

  const handleTransferAdmin = (memberUser) => {
    openConfirmDialog({
      type: 'transfer-admin',
      payload: { memberUser },
      title: 'Chuyển quyền quản trị nhóm',
      message: `Bạn có chắc muốn chuyển quyền quản trị nhóm cho ${memberUser?.name || 'thành viên này'}? Sau khi chuyển, bạn sẽ không còn là chủ nhóm.`,
      confirmText: 'Xác nhận chuyển quyền',
    });
  };

  const handleConfirmDialog = async () => {
    try {
      setConfirmLoading(true);

      if (confirmDialog.type === 'reject-post') {
        const postId = confirmDialog.payload?.postId;
        if (!postId) return;

        setPendingPostAction({ postId, type: 'reject' });
        const res = await groupApi.rejectPost(id, postId);
        if (res.data) {
          toast.success(res.data.message || 'Đã từ chối bài viết.');
          setPendingPosts((prev) => prev.filter((post) => post._id !== postId));
          await fetchGroupData({ showPageLoader: false });
        }
      }

      if (confirmDialog.type === 'leave-group') {
        const response = await groupApi.leaveGroup(id);
        if (response.success || response.data) {
          toast.success('Đã rời khỏi nhóm học tập.');
          closeConfirmDialog(true);
          navigate('/groups');
          return;
        }
      }

      if (confirmDialog.type === 'transfer-admin') {
        const targetMember = confirmDialog.payload?.memberUser;
        const newAdminId = getEntityId(targetMember);
        if (!newAdminId) return;

        const response = await groupApi.transferGroupAdmin(id, newAdminId);
        if (response.success || response.data) {
          toast.success(response.data?.message || 'Đã chuyển quyền quản trị nhóm thành công.');
          await fetchGroupData({ showPageLoader: false });
        }
      }

      closeConfirmDialog(true);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Không thể thực hiện thao tác này.');
    } finally {
      if (confirmDialog.type === 'reject-post') {
        setPendingPostAction({ postId: '', type: '' });
      }
      setConfirmLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchGroupData();
    }
  }, [id]);

  // Handle Join Group
  const handleJoin = async () => {
    if (!token) {
      toast.info('Vui lòng đăng nhập để tham gia nhóm.');
      navigate('/login');
      return;
    }

    try {
      setJoinSubmitting(true);
      const response = await groupApi.requestJoinGroup(id);
      const resPayload = response.data || response;
      const resData = resPayload.data || resPayload;
      if (resData) {
        const joinStatus = resData.status || resPayload.status;
        const joinMessage = resData.message || resPayload.message;

        if (joinStatus === 'approved') {
          toast.success(joinMessage || 'Tham gia nhóm thành công!');
          fetchGroupData({ showPageLoader: false });
        } else {
          setHasLocalPendingJoinRequest(true);
          setGroup((prevGroup) => (
            prevGroup
              ? {
                  ...prevGroup,
                  hasPendingJoinRequest: true,
                  joinRequestStatus: 'pending',
                }
              : prevGroup
          ));
          toast.success(joinMessage || 'Đã gửi yêu cầu tham gia nhóm, vui lòng chờ duyệt');
        }
      }
    } catch (err) {
      console.error('Lỗi gửi yêu cầu tham gia nhóm:', err);
      toast.error(err.response?.data?.message || 'Không thể gửi yêu cầu tham gia nhóm.');
    } finally {
      setJoinSubmitting(false);
    }
  };

  // Handle Leave Group
  const handleLeave = () => {
    openConfirmDialog({
      type: 'leave-group',
      title: 'Rời nhóm học tập',
      message: 'Bạn có chắc chắn muốn rời khỏi nhóm này không?',
      confirmText: 'Xác nhận rời nhóm',
    });
  };

  // Handle Create Post
  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!newPostText.trim()) {
      toast.warning('Vui lòng nhập nội dung bài viết.');
      return;
    }
    setSubmittingPost(true);
    try {
      const response = await groupApi.createGroupPost(
        id,
        newPostText.trim(),
        isQuestion,
        showCodeSnippet ? codeSnippet : '',
        showCodeSnippet ? codeLanguage : 'javascript'
      );
      if (response.success || response.data) {
        const postData = response.data?.data || response.data || {};
        const msg = response.data?.message || 'Đăng bài thành công!';
        
        if (postData.status === 'pending') {
          toast.warning(msg, { autoClose: 6000 });
        } else {
          toast.success(msg);
        }

        setNewPostText('');
        setCodeSnippet('');
        setShowCodeSnippet(false);
        setIsQuestion(false);
        setIsPreview(false);
        fetchFeed();
      }
    } catch (err) {
      console.error('Lỗi đăng bài trong nhóm:', err);
      toast.error(err.response?.data?.message || 'Đăng bài thất bại.');
    } finally {
      setSubmittingPost(false);
    }
  };

  // Handle Like/Unlike Post
  const handleLike = async (postId) => {
    if (!token) {
      toast.info('Vui lòng đăng nhập để thích bài viết.');
      return;
    }
    try {
      const response = await postApi.likePost(postId);
      const data = response.data;
      
      // Update local state directly
      setPosts(prevPosts => 
        prevPosts.map(post => {
          if (post._id === postId) {
            return {
              ...post,
              likes: data.likes || data.data || post.likes // Fallback
            };
          }
          return post;
        })
      );
    } catch (err) {
      console.error('Lỗi khi thích bài viết:', err);
    }
  };

  // Toggle comments expand
  const toggleComments = (postId) => {
    setExpandedComments(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }));
  };

  const handleEditPostSubmit = async (postId, post) => {
    const trimmedText = editingPostText.trim();
    if (!trimmedText) return;
    
    setActionLoading(true);
    try {
      const response = await postApi.updatePost(
        postId,
        trimmedText,
        post.isQuestion,
        post.codeSnippet || '',
        post.codeLanguage || 'javascript',
        post.visibility
      );
      const updatedPost = response.data?.data || response.data;
      
      if (updatedPost.pendingEdit && updatedPost.pendingEdit.status === 'pending') {
        toast.warning('Nội dung chỉnh sửa chứa từ khóa nhạy cảm và đang chờ Ban quản trị duyệt. Nội dung bài viết hiện tại tạm thời giữ nguyên.', { autoClose: 8000 });
        setPosts((prevPosts) =>
          prevPosts.map((p) => (p._id === postId ? { ...p, ...updatedPost } : p))
        );
      } else if (updatedPost.status === 'pending') {
        toast.warning('Bài viết chứa từ khóa nhạy cảm và đã được chuyển sang chế độ chờ duyệt.', { autoClose: 6000 });
        setPosts((prevPosts) => prevPosts.filter((p) => p._id !== postId));
      } else {
        toast.success('Cập nhật bài thảo luận thành công!');
        setPosts((prevPosts) =>
          prevPosts.map((p) => (p._id === postId ? { ...p, ...updatedPost } : p))
        );
      }
      
      setEditingPostId(null);
      setEditingPostText('');
    } catch (err) {
      console.error('Lỗi khi cập nhật bài viết:', err);
      toast.error(err.response?.data?.message || 'Không thể cập nhật bài thảo luận.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeletePost = async (postId) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa bài thảo luận này?')) {
      setActionLoading(true);
      try {
        const response = await postApi.deletePost(postId);
        toast.success(response.data?.message || 'Đã xóa bài thảo luận thành công!');
        setPosts((prevPosts) => prevPosts.filter((p) => p._id !== postId));
      } catch (err) {
        console.error('Lỗi khi xóa bài viết:', err);
        toast.error(err.response?.data?.message || 'Không thể xóa bài thảo luận.');
      } finally {
        setActionLoading(false);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
        <Navbar />
        <div className="flex-grow flex flex-col items-center justify-center py-20">
          <Loader2 className="h-10 w-10 text-indigo-600 animate-spin" />
          <p className="mt-3 text-gray-500 dark:text-gray-400 text-sm font-medium">Đang tải thông tin nhóm...</p>
        </div>
      </div>
    );
  }

  if (error || !group) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
        <Navbar />
        <div className="max-w-3xl mx-auto mt-10 px-4 flex-grow w-full">
          <div className="bg-red-50 text-red-700 p-4 rounded-xl flex items-start space-x-2 border border-red-100 mb-6">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{error || 'Nhóm học tập không tồn tại hoặc đã bị xóa.'}</span>
          </div>
          <Link to="/groups" className="inline-flex items-center text-indigo-600 font-semibold hover:underline">
            <ArrowLeft className="w-4 h-4 mr-1.5" /> Quay lại danh sách nhóm
          </Link>
        </div>
      </div>
    );
  }

  const isUserMember = isUserMemberOfGroup(group, userId);
  const isUserAdmin = isUserGroupAdmin(group, userId);
  const isUserMod = isUserGroupMod(group, userId);
  const canModerate = isUserAdmin || isUserMod;
  const joinRequestStatus = getJoinRequestStatus(group) || (hasLocalPendingJoinRequest ? 'pending' : '');
  const isJoinRequestPending = joinRequestStatus === 'pending';
  const effectiveActiveTab =
    (!canModerate && (activeTab === 'pending' || activeTab === 'join-requests' || activeTab === 'group-filters')) ||
    (!isUserAdmin && activeTab === 'settings')
      ? 'feed'
      : activeTab;
  const members = Array.isArray(group.members) ? group.members : [];
  const memberCount = group.membersCount ?? members.length ?? 0;

  const groupDate = group.date || group.createdAt;
  const formattedDate = groupDate
    ? new Date(groupDate).toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'Không rõ';

  const tabs = [
    { id: 'feed', label: 'Thảo luận' },
    { id: 'members', label: `Thành viên (${memberCount})` },
  ];

  if (canModerate) {
    tabs.splice(1, 0,
      { id: 'pending', label: `Duyệt bài (${pendingPosts.length})` },
      { id: 'join-requests', label: `Yêu cầu tham gia (${joinRequests.length})` },
      { id: 'group-filters', label: 'Bộ lọc từ cấm' }
    );
    if (isUserAdmin) {
      tabs.push({ id: 'settings', label: 'Cài đặt' });
    }
  }

  const getMemberRoleMeta = (memberUser) => {
    const memberId = getEntityId(memberUser);
    const isMemberAdmin = getEntityId(group.admin) === memberId;
    const isMemberMod = !isMemberAdmin && group.moderators?.some((moderator) => getEntityId(moderator) === memberId);

    if (isMemberAdmin) {
      return {
        isMemberAdmin,
        isMemberMod,
        label: 'Admin nhóm',
        badgeClassName: 'bg-purple-50 text-purple-700 border border-purple-100',
      };
    }

    if (isMemberMod) {
      return {
        isMemberAdmin,
        isMemberMod,
        label: 'Kiểm duyệt viên / Admin phụ',
        badgeClassName: 'bg-blue-50 text-blue-700 border border-blue-100',
      };
    }

    return {
      isMemberAdmin,
      isMemberMod,
      label: 'Thành viên',
      badgeClassName: 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-600',
    };
  };

  const handleKickMember = async (memberUser) => {
    const memberId = getEntityId(memberUser);
    const memberName = memberUser.name || 'Thành viên';
    
    if (window.confirm(`Bạn có chắc chắn muốn xóa thành viên "${memberName}" khỏi nhóm?`)) {
      setActionLoading(true);
      try {
        const response = await groupApi.kickMember(id, memberId);
        toast.success(response.data?.message || 'Đã xóa thành viên thành công.');
        
        // Cập nhật lại thông tin nhóm
        setGroup(prevGroup => {
          if (!prevGroup) return null;
          return {
            ...prevGroup,
            members: prevGroup.members.filter(m => getEntityId(getMemberUser(m)) !== memberId)
          };
        });
      } catch (err) {
        console.error('Lỗi khi xóa thành viên:', err);
        toast.error(err.response?.data?.message || 'Không thể xóa thành viên.');
      } finally {
        setActionLoading(false);
      }
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSettingsLoading(true);
    try {
      const response = await groupApi.updateGroupSettings(id, {
        privacyType,
        postModerationType
      });
      toast.success(response.data?.message || 'Cập nhật cấu hình cài đặt nhóm thành công!');
      const updatedGroup = response.data?.data || response.data;
      if (updatedGroup) {
        setGroup(updatedGroup);
        setPrivacyType(updatedGroup.privacyType || 'private');
        setPostModerationType(updatedGroup.postModerationType || 'auto');
      }
    } catch (err) {
      console.error('Lỗi lưu cài đặt nhóm:', err);
      toast.error(err.response?.data?.message || 'Không thể lưu cài đặt nhóm.');
    } finally {
      setSettingsLoading(false);
    }
  };

  const renderMemberRow = (member, compact = false) => {
    const memberUser = getMemberUser(member);
    if (!memberUser) return null;

    const memberId = getEntityId(memberUser);
    const { isMemberAdmin, isMemberMod, label, badgeClassName } = getMemberRoleMeta(memberUser);
    const isTogglingModerator = moderatorActionUserId === memberId;
    const actionButtonClassName = compact
      ? 'text-3xs px-1.5 py-0.5'
      : 'text-3xs px-2 py-1';

    return (
      <div
        key={memberId}
        className={`flex ${compact ? 'items-start' : 'items-center'} justify-between gap-3 ${compact ? 'border-b border-gray-50 pb-3 last:border-b-0 last:pb-0' : ''}`}
      >
        <div className="flex items-center space-x-2.5 min-w-0">
          <div className="h-8 w-8 bg-gray-100 dark:bg-gray-700 rounded-full flex-shrink-0 flex items-center justify-center overflow-hidden border border-gray-200 dark:border-gray-600">
            <img
              src={memberUser.avatar || DEFAULT_AVATAR}
              alt={memberUser.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = DEFAULT_AVATAR;
              }}
            />
          </div>
          <div className="min-w-0">
            <Link
              to={`/profile/${memberId}`}
              className="text-xs font-semibold text-gray-900 dark:text-gray-100 hover:text-indigo-600 transition-colors truncate block"
            >
              {memberUser.name || 'Thành viên'}
            </Link>
            {!compact && memberUser.email && (
              <span className="text-3xs text-gray-400 truncate block">{memberUser.email}</span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-1.5 flex-shrink-0 max-w-[58%]">
          <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-3xs font-semibold whitespace-nowrap ${badgeClassName}`}>
            {label}
          </span>

          {isUserAdmin && !isMemberAdmin && (
            <button
              onClick={() => handleToggleModerator(memberId)}
              disabled={isTogglingModerator || confirmLoading}
              className={`${actionButtonClassName} text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 disabled:opacity-60 disabled:cursor-not-allowed rounded transition-colors font-bold inline-flex items-center`}
            >
              {isTogglingModerator && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
              {isMemberMod ? 'Hạ quyền mod' : 'Thăng mod'}
            </button>
          )}

          {isUserAdmin && !isMemberAdmin && (
            <button
              onClick={() => handleTransferAdmin(memberUser)}
              disabled={confirmLoading}
              className={`${actionButtonClassName} text-amber-700 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 disabled:opacity-60 disabled:cursor-not-allowed rounded transition-colors font-bold inline-flex items-center`}
            >
              <Crown className="w-3 h-3 mr-1" />
              Chuyển quyền
            </button>
          )}

          {isUserAdmin && !isMemberAdmin && (
            <button
              onClick={() => handleKickMember(memberUser)}
              disabled={confirmLoading || actionLoading}
              className={`${actionButtonClassName} text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 disabled:opacity-60 disabled:cursor-not-allowed rounded transition-colors font-bold inline-flex items-center`}
            >
              Xóa thành viên
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <Navbar />

      <main className="flex-grow">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          
          {/* Back button */}
          <Link to="/groups" className="inline-flex items-center mb-6 text-gray-500 dark:text-gray-400 hover:text-indigo-600 transition-colors font-medium text-sm">
            <ArrowLeft className="w-4 h-4 mr-1.5" /> Quay lại danh sách nhóm
          </Link>

          {/* Group Banner */}
          <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden mb-8">
            <div className="h-32 md:h-48 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 relative">
            </div>
            
            <div className="p-6 md:p-8 relative pt-4 md:pt-6">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h1 className="text-2xl md:text-3xl font-extrabold text-gray-950 dark:text-gray-100 tracking-tight">
                      {group.name}
                    </h1>
                    {isUserAdmin && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-2xs font-semibold bg-purple-50 text-purple-700 border border-purple-100">
                        <Shield className="w-3 h-3 mr-0.5" />
                        Quản trị
                      </span>
                    )}
                    {isUserMod && !isUserAdmin && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-2xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                        <Shield className="w-3 h-3 mr-0.5" />
                        Kiểm duyệt viên
                      </span>
                    )}
                  </div>
                  
                  <p className="text-sm text-gray-600 dark:text-gray-400 max-w-2xl leading-relaxed">
                    {group.description || 'Chưa có mô tả cho nhóm này.'}
                  </p>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-4 text-xs text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      <strong>{memberCount}</strong> thành viên
                    </span>
                    <span>•</span>
                    <span>Tạo ngày {formattedDate}</span>
                    <span>•</span>
                    <span>Admin: <strong className="font-semibold text-gray-700 dark:text-gray-300">{group.admin?.name || 'Ẩn danh'}</strong></span>
                  </div>
                </div>

                <div className="flex-shrink-0">
                  {isUserMember ? (
                    !isUserAdmin ? (
                      <button
                        onClick={handleLeave}
                        className="inline-flex items-center px-4 py-2.5 bg-gray-100 dark:bg-gray-700 hover:bg-orange-50 hover:text-orange-600 text-gray-700 dark:text-gray-300 font-semibold rounded-xl text-sm transition-all duration-200"
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        Rời nhóm
                      </button>
                    ) : (
                      <span className="text-xs text-purple-600 bg-purple-50 font-semibold px-4 py-2.5 rounded-xl border border-purple-100 inline-block">
                        Chủ nhóm học tập
                      </span>
                    )
                  ) : isJoinRequestPending ? (
                    <button
                      type="button"
                      disabled
                      className="inline-flex items-center px-4 py-2.5 bg-amber-50 text-amber-700 font-semibold rounded-xl text-sm border border-amber-100 cursor-not-allowed"
                    >
                      <Clock3 className="w-4 h-4 mr-2" />
                      Đang chờ duyệt
                    </button>
                  ) : (
                    <button
                      onClick={handleJoin}
                      disabled={joinSubmitting}
                      className="inline-flex items-center px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed text-white font-semibold rounded-xl text-sm transition-colors shadow-md shadow-indigo-500/10"
                    >
                      {joinSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      Tham gia nhóm
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Tabs (Responsive) */}
          <div className="flex bg-white dark:bg-gray-800 p-1 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm mb-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  if (tab.id === 'pending') {
                    fetchPendingPosts();
                  }
                  if (tab.id === 'join-requests') {
                    fetchJoinRequests();
                  }
                  if (tab.id === 'group-filters') {
                    fetchGroupFilters();
                  }
                }}
                className={`flex-grow py-2.5 text-center text-sm font-semibold rounded-lg transition-all ${
                  effectiveActiveTab === tab.id 
                    ? 'bg-indigo-600 text-white shadow-sm' 
                    : 'text-gray-500 dark:text-gray-400 hover:text-indigo-600 hover:bg-indigo-50/50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Main content grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Left Content Area (Feed or Pending Posts) */}
            <div className={`md:col-span-2 ${effectiveActiveTab === 'members' ? 'hidden md:block' : ''}`}>
              
              {/* Check if member */}
              {!isUserMember ? (
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-150 p-8 text-center shadow-sm">
                  <div className="h-14 w-14 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Lock className="h-6 w-6 text-indigo-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">Nhóm Riêng Tư</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">
                    Nội dung bảng tin, mã nguồn thảo luận chỉ hiển thị với thành viên trong nhóm này.
                  </p>
                  {isJoinRequestPending ? (
                    <div className="inline-flex items-center px-4 py-2 rounded-xl text-sm font-semibold bg-amber-50 text-amber-700 border border-amber-100">
                      <Clock3 className="w-4 h-4 mr-2" />
                      Yêu cầu tham gia của bạn đang chờ duyệt
                    </div>
                  ) : (
                    <button
                      onClick={handleJoin}
                      disabled={joinSubmitting}
                      className="inline-flex items-center px-6 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed text-white rounded-xl text-sm font-semibold transition-colors"
                    >
                      {joinSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      Tham gia nhóm thảo luận
                    </button>
                  )}
                </div>
              ) : (
                <>
                  {/* TAB 1: DISCUSSION FEED */}
                  {effectiveActiveTab === 'feed' && (
                    <>
                      {/* Create Post Form */}
                      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm mb-6">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-4">
                          <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wider flex items-center">
                            {isQuestion ? (
                              <HelpCircle className="w-4 h-4 mr-1.5 text-indigo-600 animate-pulse" />
                            ) : (
                              <MessageSquarePlus className="w-4 h-4 mr-1.5 text-blue-600" />
                            )}
                            {isQuestion ? 'Đặt câu hỏi thảo luận' : 'Đăng bài viết mới'}
                          </h3>
                          <div className="flex items-center gap-4">
                            <label className="flex items-center cursor-pointer">
                              <div className="relative">
                                <input
                                  type="checkbox"
                                  className="sr-only"
                                  checked={isQuestion}
                                  onChange={() => setIsQuestion(!isQuestion)}
                                />
                                <div className={`block w-8 h-5 rounded-full transition-colors ${isQuestion ? 'bg-indigo-600' : 'bg-gray-300'}`}></div>
                                <div className={`dot absolute left-0.5 top-0.5 bg-white dark:bg-gray-800 w-4 h-4 rounded-full transition-transform ${isQuestion ? 'transform translate-x-3' : ''}`}></div>
                              </div>
                              <div className="ml-2 text-xs font-semibold text-gray-600 dark:text-gray-400">Câu hỏi Q&A</div>
                            </label>

                            <label className="flex items-center cursor-pointer">
                              <div className="relative">
                                <input
                                  type="checkbox"
                                  className="sr-only"
                                  checked={showCodeSnippet}
                                  onChange={() => setShowCodeSnippet(!showCodeSnippet)}
                                />
                                <div className={`block w-8 h-5 rounded-full transition-colors ${showCodeSnippet ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
                                <div className={`dot absolute left-0.5 top-0.5 bg-white dark:bg-gray-800 w-4 h-4 rounded-full transition-transform ${showCodeSnippet ? 'transform translate-x-3' : ''}`}></div>
                              </div>
                              <div className="ml-2 text-xs font-semibold text-gray-600 dark:text-gray-400">Mã nguồn (Code)</div>
                            </label>
                          </div>
                        </div>

                        <div className="flex space-x-2 mb-3 border-b border-gray-50 pb-2">
                          <button
                            type="button"
                            onClick={() => setIsPreview(false)}
                            className={`px-2.5 py-1 text-xs font-medium rounded-lg flex items-center transition-colors ${!isPreview ? 'bg-blue-50 text-blue-600' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 dark:bg-gray-900'}`}
                          >
                            <Edit2 className="w-3.5 h-3.5 mr-1" /> Viết bài
                          </button>
                          <button
                            type="button"
                            onClick={() => setIsPreview(true)}
                            className={`px-2.5 py-1 text-xs font-medium rounded-lg flex items-center transition-colors ${isPreview ? 'bg-blue-50 text-blue-600' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 dark:bg-gray-900'}`}
                          >
                            <Eye className="w-3.5 h-3.5 mr-1" /> Xem trước
                          </button>
                        </div>

                        <form onSubmit={handleCreatePost} className="space-y-3">
                          {!isPreview ? (
                            <>
                              <textarea
                                placeholder={isQuestion ? "Miêu tả chi tiết câu hỏi/vấn đề code bạn đang gặp phải..." : "Thảo luận code, tài liệu môn học, tìm thành viên..."}
                                value={newPostText}
                                onChange={(e) => setNewPostText(e.target.value)}
                                rows={3}
                                className="block w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-950 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-colors resize-none"
                              />

                              {showCodeSnippet && (
                                <div className="p-4 border border-blue-100 rounded-xl bg-slate-50">
                                  <div className="flex justify-between items-center mb-2">
                                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center">
                                      <span className="font-mono mr-1">&lt;/&gt;</span> Mã nguồn chèn
                                    </span>
                                    <select
                                      value={codeLanguage}
                                      onChange={(e) => setCodeLanguage(e.target.value)}
                                      className="text-xs px-2 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                                    >
                                      <option value="javascript">JavaScript</option>
                                      <option value="python">Python</option>
                                      <option value="cpp">C++</option>
                                      <option value="html">HTML</option>
                                      <option value="css">CSS</option>
                                      <option value="java">Java</option>
                                      <option value="go">Go</option>
                                    </select>
                                  </div>
                                  <textarea
                                    value={codeSnippet}
                                    onChange={(e) => setCodeSnippet(e.target.value)}
                                    placeholder="Viết hoặc dán code của bạn ở đây..."
                                    rows={5}
                                    className="w-full font-mono text-xs px-3 py-2 bg-slate-900 text-slate-100 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-y"
                                  />
                                </div>
                              )}
                            </>
                          ) : (
                            <div className="p-4 border rounded-xl bg-gray-50 dark:bg-gray-900 min-h-[96px] text-sm text-slate-800 prose prose-slate prose-sm max-w-none prose-p:my-1 prose-pre:my-2 prose-headings:my-2 prose-ul:my-1 prose-ol:my-1">
                              {newPostText ? (
                                <ReactMarkdown
                                  remarkPlugins={[remarkGfm]}
                                  components={{
                                    code({ inline, className, children, ...props }) {
                                      const match = /language-(\w+)/.exec(className || '')
                                      return !inline && match ? (
                                        <SyntaxHighlighter
                                          {...props}
                                          children={String(children).replace(/\n$/, '')}
                                          style={vscDarkPlus}
                                          language={match[1]}
                                          PreTag="div"
                                          className="rounded-md my-2"
                                        />
                                      ) : (
                                        <code {...props} className={`${className} bg-gray-150 text-red-500 px-1 py-0.5 rounded text-xs font-mono`}>
                                          {children}
                                        </code>
                                      )
                                    }
                                  }}
                                >
                                  {newPostText}
                                </ReactMarkdown>
                              ) : (
                                <span className="text-gray-400 italic">Chưa có nội dung xem trước...</span>
                              )}

                              {showCodeSnippet && codeSnippet && (
                                <div className="mt-3 border-t border-gray-200 dark:border-gray-600 pt-3">
                                  <span className="text-xs font-bold text-slate-500 block mb-1">Mã nguồn ({codeLanguage}):</span>
                                  <SyntaxHighlighter
                                    children={codeSnippet}
                                    style={vscDarkPlus}
                                    language={codeLanguage}
                                    PreTag="div"
                                    className="rounded-md my-2 text-xs"
                                  />
                                </div>
                              )}
                            </div>
                          )}

                          <div className="flex justify-between items-center pt-2">
                            <div className="text-2xs text-gray-400 font-medium">Hỗ trợ Markdown (ví dụ: `code`, **in đậm**)</div>
                            <button
                              type="submit"
                              disabled={submittingPost}
                              className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-xl text-xs font-bold transition-all shadow-sm hover:shadow active:scale-95"
                            >
                              {submittingPost ? (
                                <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                              ) : (
                                <SendHorizontal className="w-3.5 h-3.5 mr-1.5" />
                              )}
                              {isQuestion ? 'Đăng câu hỏi' : 'Đăng bài'}
                            </button>
                          </div>
                        </form>
                      </div>

                      {/* Feed list */}
                      <div className="space-y-4">
                        <h3 className="text-sm font-extrabold text-gray-800 dark:text-gray-200 uppercase tracking-wider">
                          Bài viết thảo luận ({posts.length})
                        </h3>

                        {feedLoading && posts.length === 0 ? (
                          <div className="text-center py-10">
                            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-2" />
                            <span className="text-sm text-gray-500 dark:text-gray-400">Đang tải bài viết...</span>
                          </div>
                        ) : posts.length === 0 ? (
                          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-150 p-10 text-center shadow-sm text-gray-500 dark:text-gray-400">
                            Chưa có bài thảo luận nào trong nhóm này. Hãy đăng bài đầu tiên!
                          </div>
                        ) : (
                          posts.map((post) => {
                            const postLikesCount = post.likes?.length || 0;
                            const isLiked = userId && post.likes?.some(
                              (l) => (l.user?._id || l.user || '').toString() === userId.toString()
                            );
                            const postDate = new Date(post.date).toLocaleDateString('vi-VN', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            });

                            return (
                              <div key={post._id} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
                                {post.status === 'pending' && (
                                  <div className="bg-amber-50 text-amber-800 px-5 py-3 border-b border-amber-100 flex items-center gap-1.5 text-xs font-semibold">
                                    <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                                    <span>Bài viết này đang chờ duyệt. Chỉ bạn và Quản trị viên nhóm mới nhìn thấy.</span>
                                  </div>
                                )}

                                {/* Post Header */}
                                <div className="p-5 flex items-center justify-between border-b border-gray-50 gap-4">
                                  <div className="flex items-center space-x-3 min-w-0">
                                    <div className="h-10 w-10 bg-indigo-50 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                                      <img 
                                        src={post.avatar || 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y'} 
                                        alt={post.name} 
                                        className="w-full h-full object-cover" 
                                        onError={(e) => { e.target.onerror = null; e.target.src = 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y'; }}
                                      />
                                    </div>
                                    <div className="min-w-0">
                                      <div className="flex items-center gap-1.5 flex-wrap">
                                        <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">{post.name || 'Thành viên'}</h4>
                                        <RankBadge score={post.user?.reputation} className="px-1.5 py-0.5 text-3xs border font-bold rounded-full scale-90 origin-left" />
                                        {post.user?.reputation !== undefined && (
                                          <span className="inline-flex items-center px-1.5 py-0.2 rounded-full text-3xs font-bold bg-amber-50 text-amber-700 border border-amber-100 shadow-3xs" title="Điểm uy tín">
                                            ★ {post.user.reputation}
                                          </span>
                                        )}
                                      </div>
                                      <div className="flex items-center text-xs text-gray-400 mt-0.5">
                                        <Calendar className="w-3.5 h-3.5 mr-1" />
                                        <span>{postDate}</span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Post Actions */}
                                  <div className="flex items-center space-x-1 flex-shrink-0">
                                    {userId && (post.user?._id || post.user || '').toString() === userId.toString() && editingPostId !== post._id && (
                                      <button 
                                        onClick={(e) => { 
                                          e.preventDefault(); 
                                          setEditingPostId(post._id); 
                                          setEditingPostText(post.text); 
                                        }} 
                                        className="text-gray-400 hover:text-blue-500 p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors" 
                                        title="Chỉnh sửa bài viết"
                                      >
                                        <Edit2 className="w-4 h-4" />
                                      </button>
                                    )}
                                    {userId && (((post.user?._id || post.user || '').toString() === userId.toString()) || canModerate) && (
                                      <button 
                                        onClick={() => handleDeletePost(post._id)} 
                                        className="text-gray-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors" 
                                        title="Xóa bài viết"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    )}
                                  </div>
                                </div>

                                {/* Post Body */}
                                <div className="p-5 space-y-3">
                                  {editingPostId === post._id ? (
                                    <div className="space-y-3">
                                      <textarea
                                        value={editingPostText}
                                        onChange={(e) => setEditingPostText(e.target.value)}
                                        className="w-full min-h-[120px] p-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-gray-100"
                                        placeholder="Nhập nội dung bài viết..."
                                      />
                                      <div className="flex justify-end gap-2">
                                        <button
                                          onClick={() => setEditingPostId(null)}
                                          className="px-3 py-1.5 bg-gray-150 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-350 rounded-lg text-xs font-semibold transition-colors"
                                        >
                                          Hủy
                                        </button>
                                        <button
                                          onClick={() => handleEditPostSubmit(post._id, post)}
                                          disabled={!editingPostText.trim()}
                                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-lg text-xs font-semibold transition-colors"
                                        >
                                          Lưu thay đổi
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <>
                                      <div className="flex flex-wrap gap-1.5 mb-1">
                                        {post.isQuestion && (
                                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-150">
                                            <HelpCircle className="w-3.5 h-3.5 mr-1 text-indigo-600" /> Câu hỏi
                                          </span>
                                        )}
                                        {post.isQuestion && post.acceptedAnswer && (
                                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-green-50 text-green-700 border border-green-150">
                                            <CheckCircle className="w-3.5 h-3.5 mr-1 text-green-600" /> Đã giải quyết
                                          </span>
                                        )}
                                      </div>

                                      <div 
                                        onClick={() => setSelectedDetailPost(post)}
                                        className="text-gray-800 dark:text-gray-200 text-sm leading-relaxed prose prose-slate prose-sm max-w-none prose-p:my-1 prose-pre:my-2 prose-headings:my-2 prose-ul:my-1 prose-ol:my-1 cursor-pointer hover:bg-slate-50/30 dark:hover:bg-slate-700/20 p-2.5 -mx-2.5 rounded-2xl transition-all duration-200"
                                        title="Nhấp để xem chi tiết bài thảo luận"
                                      >
                                        <ReactMarkdown
                                          remarkPlugins={[remarkGfm]}
                                          components={{
                                            code({ inline, className, children, ...props }) {
                                              const match = /language-(\w+)/.exec(className || '')
                                              return !inline && match ? (
                                                <SyntaxHighlighter
                                                  {...props}
                                                  children={String(children).replace(/\n$/, '')}
                                                  style={vscDarkPlus}
                                                  language={match[1]}
                                                  PreTag="div"
                                                  className="rounded-md"
                                                />
                                              ) : (
                                                <code {...props} className={`${className || ''} bg-gray-150 text-red-500 px-1 py-0.5 rounded text-xs font-mono`}>
                                                  {children}
                                                </code>
                                              )
                                            }
                                          }}
                                        >
                                          {post.text}
                                        </ReactMarkdown>
                                      </div>

                                      {post.codeSnippet && (
                                        <div className="mt-3 border-t border-gray-100 dark:border-gray-700 pt-3">
                                          <span className="text-xs font-bold text-slate-500 block mb-1 uppercase tracking-wider">Mã nguồn ({post.codeLanguage || 'javascript'}):</span>
                                          <SyntaxHighlighter
                                            children={post.codeSnippet}
                                            style={vscDarkPlus}
                                            language={post.codeLanguage || 'javascript'}
                                            PreTag="div"
                                            className="rounded-lg shadow-sm overflow-hidden text-xs"
                                          />
                                        </div>
                                      )}
                                    </>
                                  )}
                                </div>

                                {/* Post Interactions Footer */}
                                <div className="px-5 py-3.5 bg-gray-50 dark:bg-gray-900 border-t border-gray-50 flex items-center justify-between">
                                  <div className="flex items-center space-x-4">
                                    {/* Like button */}
                                    <button
                                      onClick={() => handleLike(post._id)}
                                      className={`flex items-center text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                                        isLiked 
                                          ? 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100' 
                                          : 'text-gray-500 dark:text-gray-400 hover:text-indigo-600 hover:bg-gray-100 dark:hover:bg-gray-600 dark:bg-gray-700'
                                      }`}
                                    >
                                      <ThumbsUp className={`w-3.5 h-3.5 mr-1.5 ${isLiked ? 'fill-indigo-600' : ''}`} />
                                      <span>{postLikesCount} Thích</span>
                                    </button>

                                    {/* Comments toggle button */}
                                    <button
                                      onClick={() => toggleComments(post._id)}
                                      className={`flex items-center text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                                        expandedComments[post._id]
                                          ? 'text-indigo-600 bg-indigo-50'
                                          : 'text-gray-500 dark:text-gray-400 hover:text-indigo-600 hover:bg-gray-100 dark:hover:bg-gray-600 dark:bg-gray-700'
                                      }`}
                                    >
                                      <MessageSquare className="w-3.5 h-3.5 mr-1.5" />
                                      <span>{post.comments?.length || 0} Bình luận</span>
                                    </button>
                                  </div>
                                </div>

                                {/* Comments Section (Expanded Inline) */}
                                {expandedComments[post._id] && (
                                  <div className="bg-gray-50 dark:bg-gray-900 border-t border-gray-150 px-5 py-4">
                                    <CommentSection
                                      postId={post._id}
                                      post={post}
                                      comments={post.comments || []}
                                      onCommentsChange={(nextComments) => {
                                        setPosts((prevPosts) =>
                                          prevPosts.map((p) =>
                                            p._id === post._id ? { ...p, comments: nextComments } : p
                                          )
                                        );
                                      }}
                                    />
                                  </div>
                                )}

                              </div>
                            );
                          })
                        )}
                      </div>
                      
                      {/* Loading More Indicator & Observer Target for Feed */}
                      {loadingMore && (
                        <div className="flex justify-center py-4">
                          <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
                        </div>
                      )}
                      <div ref={observerTarget} className="h-4 w-full"></div>
                    </>
                  )}

                  {/* TAB 2: PENDING POSTS FOR MODERATORS */}
                  {effectiveActiveTab === 'pending' && canModerate && (
                    <div className="space-y-4">
                      <h3 className="text-sm font-extrabold text-gray-800 dark:text-gray-200 uppercase tracking-wider">
                        Bài viết đang chờ duyệt ({pendingPosts.length})
                      </h3>

                      {pendingLoading ? (
                        <div className="text-center py-10">
                          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-2" />
                          <span className="text-sm text-gray-500 dark:text-gray-400">Đang tải bài viết...</span>
                        </div>
                      ) : pendingPosts.length === 0 ? (
                        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-150 p-10 text-center shadow-sm text-gray-500 dark:text-gray-400">
                          Không có bài viết nào đang chờ duyệt.
                        </div>
                      ) : (
                        pendingPosts.map((post) => {
                          const postDate = new Date(post.date).toLocaleDateString('vi-VN', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          });

                          return (
                            <div key={post._id} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
                              <div className="p-5 flex items-center justify-between border-b border-gray-50">
                                <div className="flex items-center space-x-3">
                                  <div className="h-10 w-10 bg-indigo-50 rounded-full flex-shrink-0 flex items-center justify-center overflow-hidden">
                                    <img 
                                      src={post.avatar || 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y'} 
                                      alt={post.name} 
                                      className="w-full h-full object-cover" 
                                      onError={(e) => { e.target.onerror = null; e.target.src = 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y'; }}
                                    />
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100">{post.name || 'Thành viên'}</h4>
                                      <RankBadge score={post.user?.reputation} className="px-1.5 py-0.5 text-3xs border font-bold rounded-full scale-90 origin-left" />
                                      {post.user?.reputation !== undefined && (
                                        <span className="inline-flex items-center px-1.5 py-0.2 rounded-full text-3xs font-bold bg-amber-50 text-amber-700 border border-amber-100 shadow-3xs" title="Điểm uy tín">
                                          ★ {post.user.reputation}
                                        </span>
                                      )}
                                    </div>
                                    <span className="text-xs text-gray-400 block mt-0.5">{postDate}</span>
                                  </div>
                                </div>
                                
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleApprovePost(post._id)}
                                    disabled={pendingPostAction.postId === post._id}
                                    className="px-3.5 py-1.5 bg-green-600 hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed text-white rounded-lg text-xs font-bold transition-colors shadow-sm inline-flex items-center"
                                  >
                                    {pendingPostAction.postId === post._id && pendingPostAction.type === 'approve' && (
                                      <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                                    )}
                                    Phê duyệt
                                  </button>
                                  <button
                                    onClick={() => handleRejectPost(post._id)}
                                    disabled={pendingPostAction.postId === post._id || confirmLoading}
                                    className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed text-white rounded-lg text-xs font-bold transition-colors shadow-sm inline-flex items-center"
                                  >
                                    {pendingPostAction.postId === post._id && pendingPostAction.type === 'reject' && (
                                      <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                                    )}
                                    Từ chối
                                  </button>
                                </div>
                              </div>

                              <div className="p-5 space-y-3">
                                <div className="flex flex-wrap gap-1.5 mb-1">
                                  {post.isQuestion && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-150">
                                      <HelpCircle className="w-3.5 h-3.5 mr-1 text-indigo-600" /> Câu hỏi chờ duyệt
                                    </span>
                                  )}
                                </div>
                                <div className="text-gray-800 dark:text-gray-200 text-sm leading-relaxed prose prose-slate prose-sm max-w-none prose-p:my-1 prose-pre:my-2 prose-headings:my-2 prose-ul:my-1 prose-ol:my-1">
                                  <ReactMarkdown
                                    remarkPlugins={[remarkGfm]}
                                    components={{
                                      code({ inline, className, children, ...props }) {
                                        const match = /language-(\w+)/.exec(className || '')
                                        return !inline && match ? (
                                          <SyntaxHighlighter
                                            {...props}
                                            children={String(children).replace(/\n$/, '')}
                                            style={vscDarkPlus}
                                            language={match[1]}
                                            PreTag="div"
                                            className="rounded-md"
                                          />
                                        ) : (
                                          <code {...props} className={`${className || ''} bg-gray-150 text-red-500 px-1 py-0.5 rounded text-xs font-mono`}>
                                            {children}
                                          </code>
                                        )
                                      }
                                    }}
                                  >
                                    {post.text}
                                  </ReactMarkdown>
                                </div>
                                {post.codeSnippet && (
                                  <div className="mt-3 border-t border-gray-100 dark:border-gray-700 pt-3">
                                    <span className="text-xs font-bold text-slate-500 block mb-1 uppercase tracking-wider">Mã nguồn ({post.codeLanguage || 'javascript'}):</span>
                                    <SyntaxHighlighter
                                      children={post.codeSnippet}
                                      style={vscDarkPlus}
                                      language={post.codeLanguage || 'javascript'}
                                      PreTag="div"
                                      className="rounded-lg shadow-sm overflow-hidden text-xs"
                                    />
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}

                  {/* TAB 3: JOIN REQUESTS */}
                  {effectiveActiveTab === 'join-requests' && canModerate && (
                    <div className="space-y-4">
                      <h3 className="text-sm font-extrabold text-gray-800 dark:text-gray-200 uppercase tracking-wider">
                        Yêu cầu tham gia ({joinRequests.length})
                      </h3>

                      {joinRequestsLoading ? (
                        <div className="text-center py-10">
                          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-2" />
                          <span className="text-sm text-gray-500 dark:text-gray-400">Đang tải yêu cầu tham gia...</span>
                        </div>
                      ) : joinRequests.length === 0 ? (
                        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-150 p-10 text-center shadow-sm text-gray-500 dark:text-gray-400">
                          Chưa có yêu cầu tham gia nào.
                        </div>
                      ) : (
                        joinRequests.map((request) => {
                          const requestUser = getJoinRequestUser(request);
                          if (!requestUser) return null;

                          const requestUserId = getEntityId(requestUser);
                          const isProcessingRequest = joinRequestAction.userId === requestUserId;
                          const requestDate = request.createdAt || request.requestedAt || request.date || request.updatedAt;

                          return (
                            <div key={requestUserId} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="h-11 w-11 rounded-full overflow-hidden border border-gray-200 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 flex-shrink-0">
                                  <img
                                    src={requestUser.avatar || DEFAULT_AVATAR}
                                    alt={requestUser.name}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      e.target.onerror = null;
                                      e.target.src = DEFAULT_AVATAR;
                                    }}
                                  />
                                </div>
                                <div className="min-w-0">
                                  <div className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">{requestUser.name || 'Người dùng'}</div>
                                  {requestUser.email && (
                                    <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 truncate mt-0.5">
                                      <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                                      <span className="truncate">{requestUser.email}</span>
                                    </div>
                                  )}
                                  <div className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                                    <Clock3 className="w-3.5 h-3.5 flex-shrink-0" />
                                    <span>
                                      {requestDate
                                        ? new Date(requestDate).toLocaleString('vi-VN', {
                                            month: 'short',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit',
                                          })
                                        : 'Không rõ thời gian gửi'}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 sm:justify-end">
                                <button
                                  onClick={() => handleApproveJoinRequest(requestUserId)}
                                  disabled={isProcessingRequest}
                                  className="px-3.5 py-1.5 bg-green-600 hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed text-white rounded-lg text-xs font-bold transition-colors shadow-sm inline-flex items-center"
                                >
                                  {isProcessingRequest && joinRequestAction.type === 'approve' ? (
                                    <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                                  ) : (
                                    <UserCheck className="w-3.5 h-3.5 mr-1" />
                                  )}
                                  Duyệt
                                </button>
                                <button
                                  onClick={() => handleRejectJoinRequest(requestUserId)}
                                  disabled={isProcessingRequest}
                                  className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed text-white rounded-lg text-xs font-bold transition-colors shadow-sm inline-flex items-center"
                                >
                                  {isProcessingRequest && joinRequestAction.type === 'reject' ? (
                                    <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                                  ) : (
                                    <UserX className="w-3.5 h-3.5 mr-1" />
                                  )}
                                  Từ chối
                                </button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}

                  {/* TAB 3.5: GROUP FILTERS */}
                  {effectiveActiveTab === 'group-filters' && canModerate && (
                    <div className="space-y-4 animate-fade-in">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-extrabold text-gray-800 dark:text-gray-200 uppercase tracking-wider">
                          Bộ lọc từ cấm của nhóm
                        </h3>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {groupBannedWords.length} từ cấm
                        </span>
                      </div>

                      {/* Add Word Form */}
                      <form onSubmit={handleAddGroupWord} className="flex gap-2">
                        <div className="relative flex-grow">
                          <input
                            type="text"
                            placeholder="Nhập từ cấm mới (ví dụ: hack, toxic...)"
                            value={newGroupWord}
                            onChange={(e) => setNewGroupWord(e.target.value)}
                            disabled={actionLoading}
                            className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-gray-100"
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={actionLoading || !newGroupWord.trim()}
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-xl text-sm font-semibold flex items-center gap-1.5 transition-colors"
                        >
                          {actionLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Plus className="w-4 h-4" />
                          )}
                          <span>Thêm</span>
                        </button>
                      </form>

                      {/* Search & Word List */}
                      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6 space-y-4">
                        <div className="relative">
                          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                          <input
                            type="text"
                            placeholder="Tìm kiếm từ cấm trong nhóm..."
                            value={groupWordSearch}
                            onChange={(e) => setGroupWordSearch(e.target.value)}
                            className="pl-9 w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-gray-100"
                          />
                        </div>

                        {groupBannedWordsLoading ? (
                          <div className="text-center py-10">
                            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-2" />
                            <span className="text-sm text-gray-500 dark:text-gray-400">Đang tải bộ lọc từ cấm...</span>
                          </div>
                        ) : groupBannedWords.length === 0 ? (
                          <div className="text-center py-10 text-gray-500 dark:text-gray-400 flex flex-col items-center">
                            <ShieldAlert className="w-8 h-8 text-gray-300 dark:text-gray-600 mb-2" />
                            <p className="text-sm font-medium">Chưa cấu hình từ cấm nào cho nhóm này.</p>
                            <p className="text-xs text-gray-400 mt-1">Các bài viết và bình luận trong nhóm chỉ chịu sự kiểm duyệt của bộ lọc từ cấm hệ thống.</p>
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-2 max-h-[300px] overflow-y-auto pr-1">
                            {groupBannedWords
                              .filter(word => word.toLowerCase().includes(groupWordSearch.toLowerCase()))
                              .map((word, idx) => (
                                <div
                                  key={idx}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/50 rounded-xl text-sm font-semibold text-red-700 dark:text-red-400 animate-fade-in"
                                >
                                  <span>{word}</span>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteGroupWord(word)}
                                    disabled={actionLoading}
                                    className="p-0.5 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-full transition-colors text-red-500"
                                    title="Xóa từ cấm"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* TAB 3.75: GROUP SETTINGS */}
                  {effectiveActiveTab === 'settings' && isUserAdmin && (
                    <div className="space-y-6 animate-fade-in">
                      <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-4">
                        <div>
                          <h3 className="text-base font-extrabold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                            <Settings className="w-5 h-5 text-indigo-500" />
                            Cài đặt nhóm học tập
                          </h3>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Cấu hình chế độ tham gia và phê duyệt bài thảo luận của nhóm.</p>
                        </div>
                      </div>

                      <form onSubmit={handleSaveSettings} className="space-y-6">
                        
                        {/* Privacy Selection */}
                        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 space-y-4 shadow-3xs">
                          <label className="text-sm font-bold text-gray-800 dark:text-gray-200 block">
                            Chế độ tham gia nhóm (Privacy)
                          </label>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            
                            <label className={`flex items-start gap-3 p-4 rounded-2xl border-2 transition-all cursor-pointer ${privacyType === 'public' ? 'border-indigo-500 bg-indigo-50/20 dark:bg-indigo-950/20' : 'border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600'}`}>
                              <input
                                type="radio"
                                name="privacyType"
                                value="public"
                                checked={privacyType === 'public'}
                                onChange={() => setPrivacyType('public')}
                                className="mt-1 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                              />
                              <div>
                                <span className="text-sm font-bold text-gray-900 dark:text-gray-100 block">Nhóm cộng đồng (Công khai)</span>
                                <span className="text-xs text-gray-500 dark:text-gray-400 block mt-0.5">Mọi người dùng đều có thể tự do tham gia nhóm ngay lập tức mà không cần phê duyệt từ quản trị viên.</span>
                              </div>
                            </label>

                            <label className={`flex items-start gap-3 p-4 rounded-2xl border-2 transition-all cursor-pointer ${privacyType === 'private' ? 'border-indigo-500 bg-indigo-50/20 dark:bg-indigo-950/20' : 'border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600'}`}>
                              <input
                                type="radio"
                                name="privacyType"
                                value="private"
                                checked={privacyType === 'private'}
                                onChange={() => setPrivacyType('private')}
                                className="mt-1 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                              />
                              <div>
                                <span className="text-sm font-bold text-gray-900 dark:text-gray-100 block">Nhóm riêng tư</span>
                                <span className="text-xs text-gray-500 dark:text-gray-400 block mt-0.5">Yêu cầu người dùng gửi đơn tham gia. Admin hoặc Kiểm duyệt viên cần phê duyệt thủ công trước khi vào nhóm.</span>
                              </div>
                            </label>

                          </div>
                        </div>

                        {/* Post Moderation Selection */}
                        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 space-y-4 shadow-3xs">
                          <label className="text-sm font-bold text-gray-800 dark:text-gray-200 block">
                            Chế độ phê duyệt bài thảo luận (Moderation)
                          </label>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            
                            <label className={`flex items-start gap-3 p-4 rounded-2xl border-2 transition-all cursor-pointer ${postModerationType === 'auto' ? 'border-indigo-500 bg-indigo-50/20 dark:bg-indigo-950/20' : 'border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600'}`}>
                              <input
                                type="radio"
                                name="postModerationType"
                                value="auto"
                                checked={postModerationType === 'auto'}
                                onChange={() => setPostModerationType('auto')}
                                className="mt-1 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                              />
                              <div>
                                <span className="text-sm font-bold text-gray-900 dark:text-gray-100 block">Tự động duyệt bài viết</span>
                                <span className="text-xs text-gray-500 dark:text-gray-400 block mt-0.5">Bài viết được đăng trực tiếp. Chỉ chuyển sang hàng chờ duyệt nếu bài đăng chứa từ cấm trong bộ lọc từ khóa của nhóm/hệ thống.</span>
                              </div>
                            </label>

                            <label className={`flex items-start gap-3 p-4 rounded-2xl border-2 transition-all cursor-pointer ${postModerationType === 'manual' ? 'border-indigo-500 bg-indigo-50/20 dark:bg-indigo-950/20' : 'border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600'}`}>
                              <input
                                type="radio"
                                name="postModerationType"
                                value="manual"
                                checked={postModerationType === 'manual'}
                                onChange={() => setPostModerationType('manual')}
                                className="mt-1 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                              />
                              <div>
                                <span className="text-sm font-bold text-gray-900 dark:text-gray-100 block">Kiểm duyệt tất cả bài viết</span>
                                <span className="text-xs text-gray-500 dark:text-gray-400 block mt-0.5">Mọi bài đăng của thành viên bình thường bắt buộc phải được Admin/Mod phê duyệt thủ công trước khi xuất hiện trên bảng tin.</span>
                              </div>
                            </label>

                          </div>
                        </div>

                        {/* Save Button */}
                        <div className="flex justify-end">
                          <button
                            type="submit"
                            disabled={settingsLoading}
                            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-colors disabled:bg-indigo-400 flex items-center gap-2 shadow-sm"
                          >
                            {settingsLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                            Lưu cấu hình cài đặt
                          </button>
                        </div>

                      </form>
                    </div>
                  )}

                  {/* TAB 4: MEMBERS DETAILED VIEW */}
                  {effectiveActiveTab === 'members' && (
                    <div className="space-y-4 block md:hidden">
                      <h3 className="text-sm font-extrabold text-gray-800 dark:text-gray-200 uppercase tracking-wider">
                        Thành viên nhóm ({memberCount})
                      </h3>
                      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 space-y-4">
                        {members.map((member) => renderMemberRow(member, true))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Sidebar Section (Members List - Desktop Only) */}
            <div className={`md:col-span-1 ${effectiveActiveTab !== 'members' ? 'hidden md:block' : ''}`}>
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6 sticky top-24">
                <h3 className="text-sm font-extrabold text-gray-800 dark:text-gray-200 uppercase tracking-wider mb-4 flex items-center justify-between">
                  <span>Thành viên ({memberCount})</span>
                  <Users className="w-4 h-4 text-indigo-500" />
                </h3>

                <div className="space-y-4 max-h-[450px] overflow-y-auto pr-1">
                  {members.map((member) => renderMemberRow(member))}
                </div>
              </div>
            </div>

          </div>

        </div>
      </main>

      {confirmDialog.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-2xl overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">{confirmDialog.title}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Xác nhận trước khi tiếp tục.</p>
              </div>
              <button
                type="button"
                onClick={() => closeConfirmDialog()}
                disabled={confirmLoading}
                className="text-gray-400 hover:text-gray-600 dark:text-gray-400 disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 py-5">
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{confirmDialog.message}</p>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-end gap-3 bg-white dark:bg-gray-800">
              <button
                type="button"
                onClick={() => closeConfirmDialog()}
                disabled={confirmLoading}
                className="px-4 py-2 text-sm font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 dark:bg-gray-900 rounded-xl transition-colors disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmDialog}
                disabled={confirmLoading}
                className={`px-4 py-2 text-sm font-semibold text-white rounded-xl transition-colors inline-flex items-center ${confirmDialog.type === 'transfer-admin' ? 'bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400' : 'bg-red-600 hover:bg-red-700 disabled:bg-red-400'}`}
              >
                {confirmLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {confirmDialog.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedDetailPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-150 dark:border-gray-700 shadow-2xl max-w-3xl w-full max-h-[85vh] overflow-y-auto flex flex-col">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between sticky top-0 bg-white dark:bg-gray-800 z-10">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 bg-indigo-50 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                  <img 
                    src={selectedDetailPost.avatar || 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y'} 
                    alt={selectedDetailPost.name} 
                    className="w-full h-full object-cover" 
                  />
                </div>
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100">{selectedDetailPost.name || 'Thành viên'}</h4>
                    <RankBadge score={selectedDetailPost.user?.reputation} className="px-1.5 py-0.5 text-3xs border font-bold rounded-full scale-90 origin-left" />
                  </div>
                  <p className="text-xs text-gray-400">Chi tiết bài thảo luận trong nhóm</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedDetailPost(null)}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 flex-grow">
              {/* Post Markdown Text */}
              <div className="text-gray-800 dark:text-gray-200 text-sm leading-relaxed prose prose-slate prose-sm max-w-none">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    code({ inline, className, children, ...props }) {
                      const match = /language-(\w+)/.exec(className || '')
                      return !inline && match ? (
                        <SyntaxHighlighter
                          {...props}
                          children={String(children).replace(/\n$/, '')}
                          style={vscDarkPlus}
                          language={match[1]}
                          PreTag="div"
                          className="rounded-md"
                        />
                      ) : (
                        <code {...props} className={`${className || ''} bg-gray-150 text-red-500 px-1 py-0.5 rounded text-xs font-mono`}>
                          {children}
                        </code>
                      )
                    }
                  }}
                >
                  {selectedDetailPost.text}
                </ReactMarkdown>
              </div>

              {/* Code Snippet */}
              {selectedDetailPost.codeSnippet && (
                <div className="mt-3 border-t border-gray-150 dark:border-gray-700 pt-3">
                  <span className="text-xs font-bold text-slate-500 block mb-1 uppercase tracking-wider">Mã nguồn ({selectedDetailPost.codeLanguage || 'javascript'}):</span>
                  <SyntaxHighlighter
                    children={selectedDetailPost.codeSnippet}
                    style={vscDarkPlus}
                    language={selectedDetailPost.codeLanguage || 'javascript'}
                    PreTag="div"
                    className="rounded-lg shadow-sm overflow-hidden text-xs"
                  />
                </div>
              )}

              {/* Comments Section inside Modal */}
              <div className="border-t border-gray-100 dark:border-gray-700 pt-4">
                <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-4">Bình luận ({selectedDetailPost.comments?.length || 0})</h4>
                <CommentSection
                  postId={selectedDetailPost._id}
                  post={selectedDetailPost}
                  comments={selectedDetailPost.comments || []}
                  onCommentsChange={(nextComments) => {
                    setSelectedDetailPost(prev => prev ? { ...prev, comments: nextComments } : null);
                    setPosts((prevPosts) =>
                      prevPosts.map((p) =>
                        p._id === selectedDetailPost._id ? { ...p, comments: nextComments } : p
                      )
                    );
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupDetail;











