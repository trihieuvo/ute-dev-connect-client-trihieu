import React, { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getSocket } from '../../services/socketService';
import './Chat.css';
import { Send, MoreVertical, Phone, Video, Mic, MicOff, VideoOff, PhoneOff, ArrowLeft, MessageCircle, Image, Paperclip, Code } from 'lucide-react';
import { getConversations, getMessages, setActiveConversation, addMessage, markMessagesAsRead } from '../../store/chatSlice';
import Peer from 'peerjs';
import { toast } from 'react-toastify';
import { profileApi } from '../../services/api/profileApi';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../../services/api/axiosClient';
import Avatar from '../../components/common/Avatar';

import Prism from 'prismjs';
import 'prismjs/themes/prism-tomorrow.css';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-cpp';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-css';

const SOCKET_URL = 'http://localhost:5000';

const Chat = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const socketRef = useRef(null);
  const [inputValue, setInputValue] = useState('');
  
  const chatState = useSelector(state => state.chat) || {};
  const conversations = Array.isArray(chatState.conversations) ? chatState.conversations : [];
  const messages = Array.isArray(chatState.messages) ? chatState.messages : [];
  const activeConversationId = chatState.activeConversationId || null;
  
  const token = useSelector(state => state.auth?.token);
  
  // Lấy ID và thông tin user hiện tại từ token JWT
  let currentUserId = null;
  let currentUserName = '';
  let currentUserAvatar = '';
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      currentUserId = payload.user?.id || payload.id;
      currentUserName = payload.user?.name || payload.name || 'Người dùng UTE';
      currentUserAvatar = payload.user?.avatar || payload.avatar || '';
    } catch (e) {
      console.error("Lỗi parse token:", e);
    }
  }

  // Các trạng thái cuộc gọi: 'idle' | 'calling' (đang gọi đi) | 'ringing' (đang reo chuông nhận) | 'connected' (đang kết nối cuộc gọi)
  const [callState, setCallState] = useState('idle');
  const [callType, setCallType] = useState('video'); // 'video' | 'audio'
  const [callerInfo, setCallerInfo] = useState(null); // { callerId, callerName, callerAvatar }
  const [recipientInfo, setRecipientInfo] = useState(null); // { id, name, avatar }
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [remoteStreamReceived, setRemoteStreamReceived] = useState(false);

  const peerRef = useRef(null);
  const currentCallRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  const audioContextRef = useRef(null);
  const ringtoneIntervalRef = useRef(null);

  const [currentUserProfile, setCurrentUserProfile] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const messagesEndRef = useRef(null);

  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const [isCodeEditorOpen, setIsCodeEditorOpen] = useState(false);
  const [codeText, setCodeText] = useState('');
  const [codeLanguage, setCodeLanguage] = useState('javascript');

  const [onlineUsers, setOnlineUsers] = useState([]);
  const [isOtherUserTyping, setIsOtherUserTyping] = useState(false);
  const typingTimeoutRef = useRef(null);
  const activeConversationIdRef = useRef(activeConversationId);
  const processedMessagesRef = useRef(new Set());

  useEffect(() => {
    activeConversationIdRef.current = activeConversationId;
  }, [activeConversationId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Kích hoạt Highlight PrismJS khi tin nhắn thay đổi
  useEffect(() => {
    Prism.highlightAll();
  }, [messages]);

  // Fetch thông tin profile thực tế từ API để lấy name/avatar chính xác
  useEffect(() => {
    const fetchMyProfile = async () => {
      try {
        const res = await profileApi.getProfile();
        if (res && res.user) {
          setCurrentUserProfile(res.user);
        } else if (res && res.data && res.data.user) {
          setCurrentUserProfile(res.data.user);
        } else if (res && res.data) {
          setCurrentUserProfile(res.data);
        }
      } catch (err) {
        console.error("Lỗi khi tải profile của tôi:", err);
      }
    };
    if (currentUserId) {
      fetchMyProfile();
    }
  }, [currentUserId]);

  // Tìm thông tin của tôi từ danh sách cuộc trò chuyện làm fallback
  let selfName = currentUserProfile?.name || '';
  let selfAvatar = currentUserProfile?.avatar || '';

  if (!selfName && conversations.length > 0) {
    for (const conv of conversations) {
      if (conv && Array.isArray(conv.participants)) {
        const self = conv.participants.find(p => p && p._id === currentUserId);
        if (self && self.name) {
          selfName = self.name;
          selfAvatar = self.avatar || '';
          break;
        }
      }
    }
  }

  const finalUserName = selfName || currentUserName || 'Người dùng UTE';
  const finalUserAvatar = selfAvatar || currentUserAvatar || '';

  // Dùng ref cho callState để socket listener không bị stale closure
  const callStateRef = useRef('idle');
  useEffect(() => {
    callStateRef.current = callState;
  }, [callState]);

  console.log("ChatState:", chatState);
  console.log("currentUserId:", currentUserId);

  // Phát nhạc chuông reo bằng Web Audio API
  const startRingtone = (isIncoming) => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      const ctx = new AudioContext();
      audioContextRef.current = ctx;

      const playTone = () => {
        if (ctx.state === 'suspended') {
          ctx.resume();
        }
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        if (isIncoming) {
          osc1.type = 'sine';
          osc1.frequency.setValueAtTime(440, ctx.currentTime);
          osc2.type = 'sine';
          osc2.frequency.setValueAtTime(480, ctx.currentTime);
          gain.gain.setValueAtTime(0, ctx.currentTime);
          gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.1);
          gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.8);
        } else {
          osc1.type = 'sine';
          osc1.frequency.setValueAtTime(425, ctx.currentTime);
          gain.gain.setValueAtTime(0, ctx.currentTime);
          gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.1);
          gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 1.0);
          gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.1);
        }

        osc1.start();
        if (isIncoming) osc2.start();

        setTimeout(() => {
          try {
            osc1.stop();
            if (isIncoming) osc2.stop();
          } catch (e) {}
        }, isIncoming ? 2000 : 1200);
      };

      playTone();
      ringtoneIntervalRef.current = setInterval(playTone, 3000);
    } catch (err) {
      console.error("Lỗi phát nhạc chuông:", err);
    }
  };

  const stopRingtone = () => {
    if (ringtoneIntervalRef.current) {
      clearInterval(ringtoneIntervalRef.current);
      ringtoneIntervalRef.current = null;
    }
    if (audioContextRef.current) {
      try {
        audioContextRef.current.close();
      } catch (e) {}
      audioContextRef.current = null;
    }
  };

  const stopStream = (streamRef) => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        try { track.stop(); } catch (e) {}
      });
      streamRef.current = null;
    }
  };

  // Khởi tạo PeerJS Client
  useEffect(() => {
    if (!currentUserId) return;

    peerRef.current = new Peer(currentUserId, {
      host: 'localhost',
      port: 5000,
      path: '/peer',
      secure: false
    });

    peerRef.current.on('open', (id) => {
      console.log('✅ PeerJS Client kết nối với ID:', id);
    });

    peerRef.current.on('error', (err) => {
      console.error('❌ Lỗi PeerJS Client:', err);
    });

    peerRef.current.on('call', async (incomingCall) => {
      console.log('📞 Nhận cuộc gọi PeerJS từ:', incomingCall.peer);
      currentCallRef.current = incomingCall;
    });

    return () => {
      if (peerRef.current) {
        peerRef.current.destroy();
        peerRef.current = null;
      }
    };
  }, [currentUserId]);

  // 1. Khởi tạo Socket và Fetch danh sách Conversations ban đầu, cùng sự kiện gọi điện
  useEffect(() => {
    dispatch(getConversations());

    socketRef.current = getSocket();
    if (!socketRef.current.connected) {
      socketRef.current.connect();
    } else {
      if (currentUserId) {
        socketRef.current.emit('setup', currentUserId);
      }
    }

    socketRef.current.on('connect', () => {
      console.log('✅ Đã kết nối Socket.IO tới server!');
      if (currentUserId) {
        socketRef.current.emit('setup', currentUserId);
      }
    });

    socketRef.current.on('receive_message', (newMessage) => {
      if (!newMessage || !newMessage._id) return;
      if (processedMessagesRef.current.has(newMessage._id)) {
        return;
      }
      processedMessagesRef.current.add(newMessage._id);
      if (processedMessagesRef.current.size > 100) {
        const firstItem = processedMessagesRef.current.values().next().value;
        processedMessagesRef.current.delete(firstItem);
      }

      dispatch(addMessage(newMessage));
      dispatch(getConversations());

      const msgSenderId = newMessage.sender?._id || newMessage.sender;
      if (
        newMessage.conversationId === activeConversationIdRef.current && 
        msgSenderId !== currentUserId
      ) {
        socketRef.current.emit('mark-as-read', {
          conversationId: newMessage.conversationId,
          userId: currentUserId
        });
      }
    });

    // --- TRẠNG THÁI ONLINE & TYPING & READ RECEIPTS ---
    socketRef.current.on('get-online-users', (users) => {
      setOnlineUsers(users);
    });

    socketRef.current.on('user-online', (userId) => {
      setOnlineUsers(prev => {
        if (!prev.includes(userId)) {
          return [...prev, userId];
        }
        return prev;
      });
    });

    socketRef.current.on('user-offline', (userId) => {
      setOnlineUsers(prev => prev.filter(id => id !== userId));
    });

    socketRef.current.on('typing', ({ conversationId }) => {
      if (conversationId === activeConversationIdRef.current) {
        setIsOtherUserTyping(true);
      }
    });

    socketRef.current.on('stop-typing', ({ conversationId }) => {
      if (conversationId === activeConversationIdRef.current) {
        setIsOtherUserTyping(false);
      }
    });

    socketRef.current.on('messages-read', ({ conversationId, userId }) => {
      dispatch(markMessagesAsRead({ conversationId, userId }));
    });

    // --- ĐIỀU PHỐI CUỘC GỌI QUA SOCKET ---
    socketRef.current.on('incoming-call', (data) => {
      console.log('📞 incoming-call:', data);
      if (callStateRef.current !== 'idle') {
        socketRef.current.emit('answer-call', {
          callerId: data.callerId,
          recipientId: currentUserId,
          status: 'busy'
        });
        return;
      }
      setCallState('ringing');
      setCallType(data.callType);
      setCallerInfo(data);
      startRingtone(true);
    });

    socketRef.current.on('call-response', (data) => {
      console.log('📞 call-response:', data);
      if (data.status === 'accepted') {
        stopRingtone();
        setCallState('connected');
        
        if (localStreamRef.current) {
          const call = peerRef.current.call(data.recipientId, localStreamRef.current);
          currentCallRef.current = call;
          
          call.on('stream', (userRemoteStream) => {
            remoteStreamRef.current = userRemoteStream;
            setRemoteStreamReceived(true);
          });
        }
      } else {
        stopRingtone();
        stopStream(localStreamRef);
        setCallState('idle');
        setRecipientInfo(null);
        if (data.status === 'declined') {
          toast.error('Cuộc gọi bị từ chối.');
        } else if (data.status === 'busy') {
          toast.warning('Người nhận đang bận cuộc gọi khác.');
        }
      }
    });

    socketRef.current.on('call-ended', () => {
      console.log('📞 call-ended');
      stopRingtone();
      if (currentCallRef.current) {
        try { currentCallRef.current.close(); } catch(e){}
        currentCallRef.current = null;
      }
      stopStream(localStreamRef);
      stopStream(remoteStreamRef);
      setCallState('idle');
      setCallerInfo(null);
      setRecipientInfo(null);
      setRemoteStreamReceived(false);
      setIsMuted(false);
      setIsCameraOff(false);
      toast.info('Cuộc gọi đã kết thúc.');
    });

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
      stopRingtone();
      stopStream(localStreamRef);
      stopStream(remoteStreamRef);
    };
  }, [dispatch, currentUserId]);

  // Gắn luồng Stream vào thẻ Video khi sẵn sàng
  useEffect(() => {
    if (localVideoRef.current && localStreamRef.current) {
      localVideoRef.current.srcObject = localStreamRef.current;
    }
  }, [callState, localStreamRef.current]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStreamRef.current) {
      remoteVideoRef.current.srcObject = remoteStreamRef.current;
    }
  }, [callState, remoteStreamReceived]);

  // Bắt đầu cuộc gọi đi
  const startCall = async (type) => {
    if (!otherUser) return;

    setCallType(type);
    setCallState('calling');
    setRecipientInfo({
      id: otherUser._id,
      name: otherUser.name,
      avatar: otherUser.avatar
    });
    startRingtone(false);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: type === 'video',
        audio: true
      });
      localStreamRef.current = stream;

      socketRef.current.emit('call-user', {
        callerId: currentUserId,
        recipientId: otherUser._id,
        callerName: finalUserName,
        callerAvatar: finalUserAvatar,
        callType: type
      });
    } catch (err) {
      console.error("Không thể truy cập camera/mic:", err);
      toast.error("Không thể mở camera hoặc microphone. Vui lòng cấp quyền.");
      stopRingtone();
      setCallState('idle');
      setRecipientInfo(null);
    }
  };

  // Chấp nhận cuộc gọi đến
  const handleAcceptCall = async () => {
    stopRingtone();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: callType === 'video',
        audio: true
      });
      localStreamRef.current = stream;
      setCallState('connected');

      socketRef.current.emit('answer-call', {
        callerId: callerInfo.callerId,
        recipientId: currentUserId,
        status: 'accepted'
      });

      if (currentCallRef.current) {
        currentCallRef.current.answer(stream);
        currentCallRef.current.on('stream', (userRemoteStream) => {
          remoteStreamRef.current = userRemoteStream;
          setRemoteStreamReceived(true);
        });
      } else {
        peerRef.current.on('call', (incomingCall) => {
          currentCallRef.current = incomingCall;
          incomingCall.answer(stream);
          incomingCall.on('stream', (userRemoteStream) => {
            remoteStreamRef.current = userRemoteStream;
            setRemoteStreamReceived(true);
          });
        });
      }
    } catch (err) {
      console.error("Lỗi khi mở camera/micro:", err);
      toast.error("Không thể mở camera hoặc microphone.");
      handleDeclineCall();
    }
  };

  // Từ chối cuộc gọi đến
  const handleDeclineCall = () => {
    stopRingtone();
    socketRef.current.emit('answer-call', {
      callerId: callerInfo.callerId,
      recipientId: currentUserId,
      status: 'declined'
    });
    setCallState('idle');
    setCallerInfo(null);
  };

  // Gác máy / Hủy cuộc gọi
  const handleHangUp = () => {
    stopRingtone();
    
    const otherUserId = recipientInfo?.id || recipientInfo?._id || callerInfo?.callerId;
    if (otherUserId && socketRef.current) {
      socketRef.current.emit('end-call', { targetId: otherUserId });
    }

    if (currentCallRef.current) {
      try { currentCallRef.current.close(); } catch(e){}
      currentCallRef.current = null;
    }

    stopStream(localStreamRef);
    stopStream(remoteStreamRef);

    setCallState('idle');
    setCallerInfo(null);
    setRecipientInfo(null);
    setRemoteStreamReceived(false);
    setIsMuted(false);
    setIsCameraOff(false);
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleCamera = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsCameraOff(!videoTrack.enabled);
      }
    }
  };

  const triggerFileUpload = (inputType) => {
    if (inputType === 'image') {
      imageInputRef.current?.click();
    } else {
      fileInputRef.current?.click();
    }
  };

  const onFileChange = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File quá lớn. Giới hạn tải lên là 10MB.");
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      toast.info("Đang tải tệp lên...");
      const response = await axiosClient.post('/chat/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data && response.data.fileUrl) {
        const messageData = {
          conversationId: activeConversationId,
          senderId: currentUserId,
          text: '',
          fileUrl: response.data.fileUrl,
          fileName: response.data.fileName,
          fileType: response.data.fileType
        };
        socketRef.current.emit('send_message', messageData);
        toast.success("Đã gửi tệp thành công!");
      }
    } catch (err) {
      console.error("Lỗi khi tải file:", err);
      toast.error("Không thể tải tệp lên. Vui lòng thử lại.");
    } finally {
      e.target.value = '';
    }
  };

  const handleSendCodeSnippet = (e) => {
    e.preventDefault();
    if (!codeText.trim() || !activeConversationId) return;

    const messageData = {
      conversationId: activeConversationId,
      senderId: currentUserId,
      text: '[Mã nguồn]',
      codeSnippet: {
        code: codeText,
        language: codeLanguage
      }
    };

    socketRef.current.emit('send_message', messageData);
    setCodeText('');
    setIsCodeEditorOpen(false);
  };

  // 2. Lắng nghe thay đổi phòng chat -> Fetch Messages & Join Socket Room
  useEffect(() => {
    if (activeConversationId) {
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
  }, [activeConversationId, dispatch, currentUserId]);

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
    if (!inputValue.trim() || !activeConversationId) return;
    
    const messageData = {
      conversationId: activeConversationId,
      senderId: currentUserId,
      text: inputValue
    };

    // Gửi lên server qua socket
    socketRef.current.emit('send_message', messageData);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    if (socketRef.current) {
      socketRef.current.emit('stop-typing', {
        conversationId: activeConversationId,
        userId: currentUserId
      });
    }

    setInputValue('');
  };

  // Helper tìm thông tin người chat cùng
  const getOtherParticipant = (participants) => {
    if (!Array.isArray(participants)) return null;
    return participants.find(p => p && p._id !== currentUserId) || participants[0];
  };

  const activeConversation = conversations.find(c => c && c._id === activeConversationId);
  const otherUser = activeConversation ? getOtherParticipant(activeConversation.participants) : null;

  const filteredConversations = conversations.filter(conv => {
    if (!conv) return false;
    const participant = getOtherParticipant(conv.participants);
    return participant?.name?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="chat-container">
      <div className="chat-wrapper">
        {/* Sidebar */}
        <div className="chat-sidebar">
          <div className="chat-sidebar-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <ArrowLeft 
                size={22} 
                style={{ cursor: 'pointer', color: '#555' }} 
                onClick={() => navigate('/dashboard')} 
                title="Quay lại Bảng tin" 
              />
              <span style={{ fontWeight: 700 }}>Tin nhắn</span>
            </div>
            <MoreVertical size={20} color="#666" style={{cursor: 'pointer'}} />
          </div>
          <div className="chat-search-bar">
            <input 
              type="text" 
              placeholder="Tìm kiếm hội thoại..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="chat-conversation-list">
            {filteredConversations.length > 0 ? (
              filteredConversations.map((conv, idx) => {
                if (!conv) return null;
                const participant = getOtherParticipant(conv.participants);
                const isActive = conv._id === activeConversationId;
                const isOnline = participant && onlineUsers.includes(participant._id);
                
                return (
                  <div 
                    className={`conversation-item ${isActive ? 'active' : ''}`} 
                    key={conv._id || idx}
                    onClick={() => handleSelectConversation(conv._id)}
                  >
                    <div className="avatar-container">
                      <Avatar 
                        src={participant?.avatar} 
                        alt="Avatar" 
                        className="avatar" 
                      />
                      {isOnline && <span className="status-online-dot"></span>}
                    </div>
                    <div className="conversation-info">
                      <div className="conversation-header">
                        <span className="conversation-name">{participant?.name || 'Người dùng ẩn danh'}</span>
                      </div>
                      <div className="conversation-last-message">
                        {conv.lastMessage ? (conv.lastMessage.text || 'Tin nhắn đính kèm') : 'Chưa có tin nhắn...'}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div style={{ padding: '20px', textAlign: 'center', color: '#999', fontSize: '0.9rem' }}>
                Không tìm thấy hội thoại nào
              </div>
            )}
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="chat-main">
          {activeConversationId && otherUser ? (
            <>
              <div className="chat-main-header">
                <div className="avatar-container">
                  <Avatar 
                    src={otherUser.avatar} 
                    alt="Avatar" 
                    className="avatar" 
                  />
                  {onlineUsers.includes(otherUser._id) && <span className="status-online-dot"></span>}
                </div>
                <div className="chat-main-info" style={{ flex: 1 }}>
                  <div className="name">{otherUser.name || 'Người dùng'}</div>
                  <div className={`status ${onlineUsers.includes(otherUser._id) ? 'status-online' : 'status-offline'}`}>
                    {onlineUsers.includes(otherUser._id) ? 'Đang hoạt động' : 'Ngoại tuyến'}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '20px', color: '#0084ff' }}>
                  <Phone size={24} style={{cursor: 'pointer'}} onClick={() => startCall('audio')} title="Gọi thoại" />
                  <Video size={24} style={{cursor: 'pointer'}} onClick={() => startCall('video')} title="Gọi video" />
                  <MoreVertical size={24} style={{cursor: 'pointer'}} color="#666" />
                </div>
              </div>

              <div className="chat-messages">
                {(() => {
                  const lastSentReadMessageId = (() => {
                    const sentMessages = messages.filter(m => {
                      const senderId = m.sender?._id || m.sender;
                      return senderId === currentUserId;
                    });
                    if (sentMessages.length === 0) return null;
                    const readMessages = sentMessages.filter(m => m.isRead);
                    if (readMessages.length === 0) return null;
                    return readMessages[readMessages.length - 1]._id;
                  })();

                  return messages.map((msg, idx) => {
                    if (!msg) return null;
                    const isMe = msg.sender?._id === currentUserId || msg.sender === currentUserId;
                    const isLastSentRead = msg._id === lastSentReadMessageId;

                    return (
                      <React.Fragment key={msg._id || idx}>
                        <div className={`message-row ${isMe ? 'row-sent' : 'row-received'}`}>
                          {!isMe && (
                            <Avatar 
                              src={otherUser?.avatar} 
                              alt="Avatar" 
                              className="message-avatar-mini" 
                            />
                          )}
                          
                          <div className={`message-bubble-wrapper ${isMe ? 'msg-sent' : 'msg-received'}`}>
                            {msg.fileUrl && msg.fileType === 'image' && (
                              <div className="message-image-container animate-fade-in">
                                <img 
                                  src={msg.fileUrl} 
                                  alt="Hình ảnh đính kèm" 
                                  className="message-image-el" 
                                  onClick={() => window.open(msg.fileUrl, '_blank')}
                                />
                              </div>
                            )}

                            {msg.fileUrl && msg.fileType === 'file' && (
                              <div className="message-file-container animate-fade-in">
                                <div className="file-info-row">
                                  <Paperclip size={22} className="file-icon-svg" />
                                  <div className="file-meta">
                                    <span className="file-name" title={msg.fileName}>{msg.fileName}</span>
                                    <span className="file-type-label">Tài liệu đính kèm</span>
                                  </div>
                                </div>
                                <a href={msg.fileUrl} download={msg.fileName} target="_blank" rel="noreferrer" className="btn-file-download">
                                  Tải xuống
                                </a>
                              </div>
                            )}

                            {msg.codeSnippet && msg.codeSnippet.code && (
                              <div className="message-code-container animate-fade-in">
                                <div className="code-header-bar">
                                  <span className="code-lang-badge">{msg.codeSnippet.language}</span>
                                  <button 
                                    className="btn-copy-code" 
                                    onClick={() => {
                                      navigator.clipboard.writeText(msg.codeSnippet.code);
                                      toast.success("Đã sao chép mã nguồn!");
                                    }}
                                  >
                                    Sao chép
                                  </button>
                                </div>
                                <pre className={`language-${msg.codeSnippet.language} code-content-pre`}>
                                  <code>{msg.codeSnippet.code}</code>
                                </pre>
                              </div>
                            )}

                            {msg.text && !msg.fileUrl && !msg.codeSnippet && (
                              <div className={`message-bubble ${isMe ? 'message-sent' : 'message-received'}`}>
                                {msg.text}
                              </div>
                            )}
                          </div>
                        </div>
                        {isMe && isLastSentRead && (
                          <div className="read-receipt-row">
                            <span className="read-receipt-label">Đã xem</span>
                          </div>
                        )}
                      </React.Fragment>
                    );
                  });
                })()}
                {isOtherUserTyping && (
                  <div className="message-row row-received animate-fade-in">
                    <Avatar 
                      src={otherUser?.avatar} 
                      alt="Avatar" 
                      className="message-avatar-mini" 
                    />
                    <div className="typing-indicator-bubble">
                      <span className="typing-dot"></span>
                      <span className="typing-dot"></span>
                      <span className="typing-dot"></span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {isCodeEditorOpen && (
                <div className="code-editor-panel animate-slide-up">
                  <div className="code-editor-header">
                    <span className="editor-title">Chia sẻ mã nguồn</span>
                    <select 
                      value={codeLanguage} 
                      onChange={(e) => setCodeLanguage(e.target.value)}
                      className="language-selector"
                    >
                      <option value="javascript">JavaScript</option>
                      <option value="python">Python</option>
                      <option value="c">C</option>
                      <option value="cpp">C++</option>
                      <option value="java">Java</option>
                      <option value="html">HTML</option>
                      <option value="css">CSS</option>
                      <option value="sql">SQL</option>
                    </select>
                  </div>
                  <textarea 
                    value={codeText} 
                    onChange={(e) => setCodeText(e.target.value)}
                    placeholder="Dán hoặc nhập đoạn code của bạn vào đây..."
                    className="code-editor-textarea"
                    rows={6}
                  />
                  <div className="code-editor-actions">
                    <button type="button" className="btn-editor-cancel" onClick={() => setIsCodeEditorOpen(false)}>
                      Hủy
                    </button>
                    <button type="button" className="btn-editor-send" onClick={handleSendCodeSnippet} disabled={!codeText.trim()}>
                      Gửi Code
                    </button>
                  </div>
                </div>
              )}

              <form className="chat-input-area" onSubmit={handleSendMessage}>
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

                <div className="input-toolbar-left">
                  <button 
                    type="button" 
                    className="toolbar-btn" 
                    onClick={() => triggerFileUpload('image')} 
                    title="Gửi hình ảnh"
                  >
                    <Image size={20} />
                  </button>
                  <button 
                    type="button" 
                    className="toolbar-btn" 
                    onClick={() => triggerFileUpload('file')} 
                    title="Đính kèm tệp tin"
                  >
                    <Paperclip size={20} />
                  </button>
                  <button 
                    type="button" 
                    className={`toolbar-btn ${isCodeEditorOpen ? 'active-toolbar-btn' : ''}`} 
                    onClick={() => setIsCodeEditorOpen(!isCodeEditorOpen)} 
                    title="Gửi đoạn code"
                  >
                    <Code size={20} />
                  </button>
                </div>

                <input 
                  type="text" 
                  className="chat-input" 
                  placeholder={isCodeEditorOpen ? "Nhập code ở khung phía trên..." : "Nhập tin nhắn..."} 
                  value={inputValue}
                  onChange={handleInputChange}
                  disabled={isCodeEditorOpen}
                />
                <button type="submit" className="send-button" title="Gửi tin nhắn" disabled={isCodeEditorOpen}>
                  <Send />
                </button>
              </form>
            </>
          ) : (
            <div className="chat-empty-state">
              <div className="empty-state-icon-wrapper">
                <MessageCircle size={64} className="empty-state-icon" />
              </div>
              <h3>Hộp thư của bạn</h3>
              <p>Chọn một người bạn ở danh sách bên trái để gửi tin nhắn hoặc bắt đầu một cuộc gọi video.</p>
            </div>
          )}
        </div>
      </div>

      {/* --- GIAO DIỆN CUỘC GỌI OVERLAY --- */}
      {callState !== 'idle' && (
      <div className={`call-overlay ${callState}`}>
        <div className="call-glass-container">
          {callState === 'ringing' && (
            <div className="call-ringing-panel animate-fade-in">
              <div className="call-avatar-pulsing">
                <Avatar 
                  src={callerInfo?.callerAvatar} 
                  alt="Caller Avatar" 
                  className="large-avatar" 
                />
                <div className="pulse-ring ring1"></div>
                <div className="pulse-ring ring2"></div>
              </div>
              <h2 className="call-title">{callerInfo?.callerName || 'Sinh viên UTE'}</h2>
              <p className="call-subtitle">{callType === 'video' ? 'Đang gọi video cho bạn...' : 'Đang gọi thoại cho bạn...'}</p>
              <div className="call-actions-row">
                <button className="btn-call btn-accept" onClick={handleAcceptCall}>
                  <Phone size={20} style={{ marginRight: '8px' }} /> Chấp nhận
                </button>
                <button className="btn-call btn-decline" onClick={handleDeclineCall}>
                  <PhoneOff size={20} style={{ marginRight: '8px' }} /> Từ chối
                </button>
              </div>
            </div>
          )}

          {callState === 'calling' && (
            <div className="call-ringing-panel animate-fade-in">
              <div className="call-avatar-pulsing">
                <Avatar 
                  src={recipientInfo?.avatar} 
                  alt="Recipient Avatar" 
                  className="large-avatar" 
                />
                <div className="pulse-ring ring1"></div>
                <div className="pulse-ring ring2"></div>
              </div>
              <h2 className="call-title">Đang gọi {recipientInfo?.name}...</h2>
              <p className="call-subtitle">Vui lòng chờ phản hồi...</p>
              
              {callType === 'video' && localStreamRef.current && (
                <div className="local-preview-mini">
                  <video ref={localVideoRef} autoPlay playsInline muted className="local-video-mini-el" />
                </div>
              )}

              <div className="call-actions-row">
                <button className="btn-call btn-decline" onClick={handleHangUp}>
                  <PhoneOff size={20} style={{ marginRight: '8px' }} /> Hủy cuộc gọi
                </button>
              </div>
            </div>
          )}

          {callState === 'connected' && (
            <div className="call-active-panel animate-fade-in">
              <div className="video-streams-container">
                {callType === 'video' ? (
                  <>
                    <div className="remote-video-wrapper">
                      {remoteStreamReceived ? (
                        <video ref={remoteVideoRef} autoPlay playsInline className="remote-video" />
                      ) : (
                        <div className="stream-loading">
                          <Avatar 
                            src={recipientInfo?.avatar || callerInfo?.callerAvatar} 
                            alt="Loading" 
                            className="large-avatar pulse" 
                          />
                          <span>Đang kết nối luồng camera...</span>
                        </div>
                      )}
                      <span className="user-label">{recipientInfo?.name || callerInfo?.callerName || 'Người nhận'}</span>
                    </div>
                    {!isCameraOff && (
                      <div className="local-video-wrapper">
                        <video ref={localVideoRef} autoPlay playsInline muted className="local-video" />
                        <span className="user-label">Bạn</span>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="voice-only-container">
                    <div className="voice-avatars">
                      <div className="voice-avatar-item">
                        <Avatar 
                          src={currentUserAvatar} 
                          alt="My Avatar" 
                          className="large-avatar" 
                        />
                        <span>Bạn</span>
                      </div>
                      <div className="voice-avatar-item pulse-avatar">
                        <Avatar 
                          src={recipientInfo?.avatar || callerInfo?.callerAvatar} 
                          alt="Other Avatar" 
                          className="large-avatar" 
                        />
                        <span>{recipientInfo?.name || callerInfo?.callerName || 'Đối phương'}</span>
                      </div>
                    </div>
                    <audio ref={remoteVideoRef} autoPlay />
                  </div>
                )}
              </div>

              <div className="call-active-controls">
                <button className={`control-btn ${isMuted ? 'active-mute' : ''}`} onClick={toggleMute} title={isMuted ? 'Bật Micro' : 'Tắt Micro'}>
                  {isMuted ? <MicOff size={22} /> : <Mic size={22} />}
                </button>
                {callType === 'video' && (
                  <button className={`control-btn ${isCameraOff ? 'active-mute' : ''}`} onClick={toggleCamera} title={isCameraOff ? 'Bật Camera' : 'Tắt Camera'}>
                    {isCameraOff ? <VideoOff size={22} /> : <Video size={22} />}
                  </button>
                )}
                <button className="control-btn hang-up-btn" onClick={handleHangUp} title="Gác máy">
                  <PhoneOff size={22} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    )}
  </div>
);
};

export default Chat;
