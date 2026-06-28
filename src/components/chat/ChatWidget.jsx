import React, { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getSocket } from '../../services/socketService';
import { 
  MessageCircle, X, Search, ArrowLeft, Send, Image, Paperclip, 
  Loader2, ArrowUpRight, MessageSquare, Minus
} from 'lucide-react';
import { 
  getConversations, getMessages, setActiveConversation, addMessage, markMessagesAsRead 
} from '../../store/chatSlice';
import { addNotification } from '../../store/notificationSlice';
import axiosClient from '../../services/api/axiosClient';
import { toast } from 'react-toastify';
import { useNavigate, useLocation } from 'react-router-dom';
import Avatar from '../common/Avatar';

const ChatWidget = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const socketRef = useRef(null);
  
  const token = useSelector((state) => state.auth?.token);
  const chatState = useSelector((state) => state.chat) || {};
  const conversations = Array.isArray(chatState.conversations) ? chatState.conversations : [];
  const messages = Array.isArray(chatState.messages) ? chatState.messages : [];
  const activeConversationId = chatState.activeConversationId;

  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [isOtherUserTyping, setIsOtherUserTyping] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Parse JWT to get Current User ID
  let currentUserId = null;
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      currentUserId = payload.user?.id || payload.id;
    } catch (e) {
      console.error('Error parsing token in ChatWidget:', e);
    }
  }

  // Scroll to bottom helper
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen && activeConversationId) {
      scrollToBottom();
    }
  }, [messages, isOpen, activeConversationId]);

  // Global socket setup & listener
  useEffect(() => {
    if (!token || !currentUserId) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    dispatch(getConversations());

    const socket = getSocket();
    socketRef.current = socket;

    if (!socket.connected) {
      socket.connect();
    }

    socket.emit('setup', currentUserId);

    socket.on('receive_message', (newMessage) => {
      dispatch(addMessage(newMessage));
      dispatch(getConversations());

      // If active room is open, mark it as read immediately
      if (newMessage.conversationId === activeConversationId && isOpen) {
        socket.emit('mark-as-read', {
          conversationId: newMessage.conversationId,
          userId: currentUserId
        });
      }
    });

    socket.on('get-online-users', (users) => {
      setOnlineUsers(users);
    });

    socket.on('user-online', (userId) => {
      setOnlineUsers((prev) => (prev.includes(userId) ? prev : [...prev, userId]));
    });

    socket.on('user-offline', (userId) => {
      setOnlineUsers((prev) => prev.filter((id) => id !== userId));
    });

    socket.on('typing', ({ conversationId }) => {
      if (conversationId === activeConversationId) {
        setIsOtherUserTyping(true);
      }
    });

    socket.on('stop-typing', ({ conversationId }) => {
      if (conversationId === activeConversationId) {
        setIsOtherUserTyping(false);
      }
    });

    socket.on('messages-read', ({ conversationId, userId }) => {
      dispatch(markMessagesAsRead({ conversationId, userId }));
    });

    socket.on('new_notification', (notification) => {
      dispatch(addNotification(notification));
      
      const getNotifText = (notif) => {
        const name = notif.sender?.name || 'Ai đó';
        switch (notif.type) {
          case 'like': return `${name} đã thích bài viết của bạn.`;
          case 'comment': return `${name} đã bình luận về bài viết của bạn.`;
          case 'follow': return `${name} đã bắt đầu theo dõi bạn.`;
          case 'post_pending': return `${name} đã đăng một bài viết cần duyệt trong nhóm học tập.`;
          case 'post_approved': return `${name} đã phê duyệt bài viết của bạn.`;
          case 'post_rejected': return `${name} đã từ chối bài viết của bạn vì vi phạm tiêu chuẩn.`;
          default: return 'Bạn có thông báo mới';
        }
      };

      const msg = getNotifText(notification);

      if (notification.type === 'post_pending') {
        toast.warn(msg, {
          position: "top-right",
          autoClose: 7000,
          closeOnClick: true,
          pauseOnHover: true,
        });
      } else if (notification.type === 'post_approved') {
        toast.success(msg, {
          position: "top-right",
          autoClose: 5000,
          closeOnClick: true,
          pauseOnHover: true,
        });
      } else if (notification.type === 'post_rejected') {
        toast.error(msg, {
          position: "top-right",
          autoClose: 5000,
          closeOnClick: true,
          pauseOnHover: true,
        });
      } else {
        toast.info(msg, {
          position: "top-right",
          autoClose: 5000,
          closeOnClick: true,
          pauseOnHover: true,
        });
      }
    });

    return () => {
      socket.off('receive_message');
      socket.off('get-online-users');
      socket.off('user-online');
      socket.off('user-offline');
      socket.off('typing');
      socket.off('stop-typing');
      socket.off('messages-read');
      socket.off('new_notification');
    };
  }, [token, currentUserId, activeConversationId, isOpen, dispatch]);

  // When room is opened inside the widget, fetch messages and notify socket
  useEffect(() => {
    if (activeConversationId && isOpen) {
      dispatch(getMessages(activeConversationId));
      setIsOtherUserTyping(false);
      if (socketRef.current) {
        socketRef.current.emit('join_room', activeConversationId);
        socketRef.current.emit('mark-as-read', {
          conversationId: activeConversationId,
          userId: currentUserId
        });
      }
    }
  }, [activeConversationId, isOpen, dispatch, currentUserId]);

  if (!token || !currentUserId) return null;

  // Don't render the chat bubble widget if we are on the full /chat page
  if (location.pathname === '/chat') return null;

  // Calculate unread conversations count
  const unreadCount = conversations.filter((conv) => {
    if (!conv || !conv.lastMessage) return false;
    const lastMsgSenderId = conv.lastMessage.sender?._id || conv.lastMessage.sender;
    return String(lastMsgSenderId) !== String(currentUserId) && !conv.lastMessage.isRead;
  }).length;

  const handleSelectConversation = (convId) => {
    dispatch(setActiveConversation(convId));
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    setInputValue(val);

    if (!activeConversationId || !socketRef.current) return;

    socketRef.current.emit('typing', {
      conversationId: activeConversationId,
      userId: currentUserId
    });

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      if (socketRef.current) {
        socketRef.current.emit('stop-typing', {
          conversationId: activeConversationId,
          userId: currentUserId
        });
      }
    }, 2000);
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputValue.trim() || !activeConversationId || !socketRef.current) return;

    const messageData = {
      conversationId: activeConversationId,
      senderId: currentUserId,
      text: inputValue
    };

    socketRef.current.emit('send_message', messageData);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    socketRef.current.emit('stop-typing', {
      conversationId: activeConversationId,
      userId: currentUserId
    });

    setInputValue('');
  };

  const onFileChange = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File quá lớn. Giới hạn tải lên là 10MB.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      setIsUploading(true);
      const response = await axiosClient.post('/chat/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data && response.data.fileUrl && socketRef.current) {
        const messageData = {
          conversationId: activeConversationId,
          senderId: currentUserId,
          text: '',
          fileUrl: response.data.fileUrl,
          fileName: response.data.fileName,
          fileType: response.data.fileType
        };
        socketRef.current.emit('send_message', messageData);
      }
    } catch (err) {
      console.error('Lỗi khi tải file trong ChatWidget:', err);
      toast.error('Không thể tải tệp lên. Vui lòng thử lại.');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const getOtherParticipant = (participants) => {
    if (!Array.isArray(participants)) return null;
    return participants.find((p) => p && p._id !== currentUserId) || participants[0];
  };

  const activeConversation = conversations.find((c) => c && c._id === activeConversationId);
  const otherUser = activeConversation ? getOtherParticipant(activeConversation.participants) : null;

  const filteredConversations = conversations.filter((conv) => {
    if (!conv) return false;
    const participant = getOtherParticipant(conv.participants);
    return participant?.name?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Floating Chat Box (Expanded state) */}
      {isOpen && (
        <div className="w-80 sm:w-90 h-[480px] bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-2xl flex flex-col overflow-hidden mb-4 transition-all duration-300 transform scale-100 origin-bottom-right">
          
          {/* Header (Room View vs Conversation List View) */}
          {activeConversationId && otherUser ? (
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 flex items-center justify-between text-white shadow-md">
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => dispatch(setActiveConversation(null))}
                  className="p-1 hover:bg-white/10 rounded-full transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="relative">
                  <Avatar src={otherUser.avatar} alt={otherUser.name} className="w-8 h-8 border border-white/20" />
                  {onlineUsers.includes(otherUser._id) && (
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border border-white rounded-full"></span>
                  )}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold truncate max-w-[120px] sm:max-w-[160px]">{otherUser.name}</div>
                  <div className="text-[10px] text-white/80">
                    {onlineUsers.includes(otherUser._id) ? 'Đang hoạt động' : 'Ngoại tuyến'}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => {
                    setIsOpen(false);
                    navigate('/chat');
                  }} 
                  className="p-1 hover:bg-white/10 rounded-full transition-colors" 
                  title="Mở toàn màn hình"
                >
                  <ArrowUpRight className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setIsOpen(false)} 
                  className="p-1 hover:bg-white/10 rounded-full transition-colors" 
                  title="Thu nhỏ"
                >
                  <Minus className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-4 flex items-center justify-between text-white shadow-md">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5" />
                <span className="text-sm font-bold">Tin nhắn</span>
              </div>
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => {
                    setIsOpen(false);
                    navigate('/chat');
                  }} 
                  className="p-1 hover:bg-white/10 rounded-full transition-colors" 
                  title="Mở hộp chat chính"
                >
                  <ArrowUpRight className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setIsOpen(false)} 
                  className="p-1 hover:bg-white/10 rounded-full transition-colors"
                  title="Thu nhỏ"
                >
                  <Minus className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Body Section */}
          {activeConversationId && otherUser ? (
            /* Active Chat Room View */
            <div className="flex-1 flex flex-col min-h-0 bg-slate-50 dark:bg-gray-900">
              
              {/* Message List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
                {messages.length > 0 ? (
                  messages.map((msg, idx) => {
                    if (!msg) return null;
                    const isMe = (msg.sender?._id || msg.sender) === currentUserId;
                    return (
                      <div 
                        key={msg._id || idx} 
                        className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[75%] rounded-2xl px-3 py-2 text-xs shadow-sm ${
                          isMe 
                            ? 'bg-blue-600 text-white rounded-br-none dark:bg-blue-500' 
                            : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700'
                        }`}>
                          {msg.text && <p className="leading-relaxed whitespace-pre-wrap break-all sm:break-words">{msg.text}</p>}
                          
                          {/* File Attachment Support */}
                          {msg.fileUrl && (
                            <div className="mt-1">
                              {msg.fileType === 'image' ? (
                                <img 
                                  src={msg.fileUrl} 
                                  alt={msg.fileName || 'Hình ảnh đính kèm'} 
                                  className="rounded-lg max-h-40 object-cover cursor-pointer hover:opacity-90"
                                  onClick={() => window.open(msg.fileUrl, '_blank')}
                                />
                              ) : (
                                <a 
                                  href={msg.fileUrl} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className={`flex items-center gap-1.5 underline font-medium ${isMe ? 'text-white' : 'text-blue-600'}`}
                                >
                                  <Paperclip className="w-3.5 h-3.5" />
                                  <span className="truncate max-w-[150px]">{msg.fileName || 'Tệp đính kèm'}</span>
                                </a>
                              )}
                            </div>
                          )}

                          {/* Code Snippet Support */}
                          {msg.codeSnippet && msg.codeSnippet.code && (
                            <div className="mt-2 p-2 bg-slate-950 text-slate-100 rounded-lg font-mono text-[10px] overflow-x-auto max-w-[220px]">
                              <span className="text-[8px] text-gray-400 block border-b border-gray-800 pb-1 mb-1">
                                Mã nguồn ({msg.codeSnippet.language})
                              </span>
                              <pre>{msg.codeSnippet.code}</pre>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400">
                    <MessageSquare className="w-8 h-8 mb-2 opacity-50" />
                    <p className="text-xs">Chưa có tin nhắn nào...</p>
                  </div>
                )}

                {/* Typing Indicator */}
                {isOtherUserTyping && (
                  <div className="flex justify-start">
                    <div className="bg-white text-gray-400 border border-gray-100 rounded-2xl rounded-bl-none px-3 py-2 text-[10px] italic shadow-sm flex items-center gap-1 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-500">
                      <span>{otherUser.name} đang nhập</span>
                      <span className="flex gap-0.5">
                        <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce"></span>
                        <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                        <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                      </span>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef}></div>
              </div>

              {/* Input Footer */}
              <form onSubmit={handleSendMessage} className="bg-white dark:bg-gray-900 p-3 border-t border-gray-100 dark:border-gray-800 flex items-center gap-2">
                <input 
                  type="file" 
                  ref={imageInputRef} 
                  style={{ display: 'none' }} 
                  accept="image/*"
                  onChange={(e) => onFileChange(e, 'image')}
                />
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  style={{ display: 'none' }}
                  onChange={(e) => onFileChange(e, 'file')}
                />

                <button 
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                  disabled={isUploading}
                  className="p-1.5 text-gray-400 hover:text-blue-600 rounded-full hover:bg-slate-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
                  title="Gửi hình ảnh"
                >
                  <Image className="w-4 h-4" />
                </button>

                <button 
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="p-1.5 text-gray-400 hover:text-blue-600 rounded-full hover:bg-slate-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
                  title="Đính kèm tệp tin"
                >
                  <Paperclip className="w-4 h-4" />
                </button>

                <input 
                  type="text" 
                  placeholder="Nhập tin nhắn..." 
                  value={inputValue}
                  onChange={handleInputChange}
                  disabled={isUploading}
                  className="flex-1 bg-slate-50 dark:bg-gray-800 border border-slate-100 dark:border-gray-700 rounded-full px-3 py-1.5 text-xs text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:bg-white dark:focus:bg-gray-900"
                />

                <button 
                  type="submit"
                  disabled={!inputValue.trim() || isUploading}
                  className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 active:scale-95 transition-all disabled:bg-slate-100 disabled:text-gray-400"
                >
                  {isUploading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                </button>
              </form>
            </div>
          ) : (
            /* Conversation List View */
            <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-gray-900">
              
              {/* Search Bar */}
              <div className="p-3 border-b border-gray-50 dark:border-gray-800 flex items-center relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-6" />
                <input 
                  type="text" 
                  placeholder="Tìm cuộc trò chuyện..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-1.5 bg-slate-50 dark:bg-gray-800 border border-slate-100 dark:border-gray-700 rounded-full text-xs text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:bg-white dark:focus:bg-gray-900"
                />
              </div>

              {/* Conversation list */}
              <div className="flex-1 overflow-y-auto divide-y divide-gray-50 dark:divide-gray-800 min-h-0">
                {filteredConversations.length > 0 ? (
                  filteredConversations.map((conv, idx) => {
                    if (!conv) return null;
                    const participant = getOtherParticipant(conv.participants);
                    if (!participant) return null;
                    
                    const isOnline = onlineUsers.includes(participant._id);
                    const isUnread = conv.lastMessage && 
                                     String(conv.lastMessage.sender?._id || conv.lastMessage.sender) !== String(currentUserId) && 
                                     !conv.lastMessage.isRead;

                    return (
                      <div 
                        key={conv._id || idx}
                        onClick={() => handleSelectConversation(conv._id)}
                        className={`flex items-center gap-3 px-4 py-3 hover:bg-slate-50/80 dark:hover:bg-gray-800/80 cursor-pointer transition-colors ${isUnread ? 'bg-blue-50/20 dark:bg-blue-900/20' : ''}`}
                      >
                        <div className="relative shrink-0">
                          <Avatar src={participant.avatar} alt={participant.name} className="w-10 h-10" />
                          {isOnline && (
                            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></span>
                          )}
                        </div>
                        
                        <div className="min-w-0 flex-1">
                          <div className="flex justify-between items-center">
                            <span className={`text-xs truncate block ${isUnread ? 'font-bold text-gray-900 dark:text-gray-100' : 'font-medium text-gray-800 dark:text-gray-200'}`}>
                              {participant.name}
                            </span>
                            {isUnread && (
                              <span className="w-2 h-2 bg-blue-600 rounded-full shrink-0"></span>
                            )}
                          </div>
                          <p className={`text-[10px] truncate mt-0.5 ${isUnread ? 'font-bold text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'}`}>
                            {conv.lastMessage ? (conv.lastMessage.text || 'Tệp đính kèm') : 'Chưa có tin nhắn...'}
                          </p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400 py-12">
                    <MessageSquare className="w-8 h-8 mb-2 opacity-50" />
                    <p className="text-xs">Không tìm thấy cuộc trò chuyện</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Floating Chat Bubble Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full shadow-lg flex items-center justify-center text-white cursor-pointer hover:scale-105 active:scale-95 transition-all duration-200"
        title="Trò chuyện"
      >
        <MessageSquare className="w-6 h-6 transition-transform duration-200" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white dark:border-gray-900 shadow-sm animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>
    </div>
  );
};

export default ChatWidget;
