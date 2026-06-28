import axiosClient from './axiosClient';

export const groupApi = {
  // Lấy danh sách nhóm (có phân trang và tìm kiếm theo q)
  getAllGroups: (page = 1, limit = 10, q = '') => {
    return axiosClient.get(`/groups?page=${page}&limit=${limit}&q=${encodeURIComponent(q)}`);
  },

  // Tạo nhóm mới
  createGroup: (name, description) => {
    return axiosClient.post('/groups', { name, description });
  },

  // Lấy chi tiết nhóm theo ID
  getGroupById: (id) => {
    return axiosClient.get(`/groups/${id}`);
  },

  // Gửi yêu cầu tham gia nhóm
  requestJoinGroup: (id) => {
    return axiosClient.put(`/groups/${id}/join`);
  },

  // Tương thích ngược với các màn hình đang dùng tên cũ
  joinGroup: (id) => {
    return axiosClient.put(`/groups/${id}/join`);
  },

  // Rời nhóm
  leaveGroup: (id) => {
    return axiosClient.put(`/groups/${id}/leave`);
  },

  // Xóa nhóm (soft delete, chỉ admin của nhóm)
  deleteGroup: (id) => {
    return axiosClient.delete(`/groups/${id}`);
  },

  // Lấy bảng tin (feed) của nhóm
  getGroupFeed: (id, page = 1, limit = 10) => {
    return axiosClient.get(`/groups/${id}/feed?page=${page}&limit=${limit}`);
  },

  // Đăng bài viết mới trong nhóm
  createGroupPost: (id, text, isQuestion = false, codeSnippet = '', codeLanguage = 'javascript') => {
    return axiosClient.post(`/groups/${id}/posts`, { text, isQuestion, codeSnippet, codeLanguage });
  },

  // Bình luận bài viết trong nhóm
  addGroupComment: (id, postId, text, codeSnippet = '', codeLanguage = 'javascript') => {
    return axiosClient.post(`/groups/${id}/posts/${postId}/comments`, {
      text: text.trim(),
      codeSnippet,
      codeLanguage,
    });
  },

  // Thăng chức / hạ chức Moderator (chỉ Admin của nhóm)
  toggleModerator: (groupId, userId) => {
    return axiosClient.put(`/groups/${groupId}/moderator`, { userId });
  },

  // Lấy danh sách yêu cầu tham gia nhóm (chỉ Admin / Mod nhóm)
  getJoinRequests: (groupId) => {
    return axiosClient.get(`/groups/${groupId}/join-requests`);
  },

  // Duyệt yêu cầu tham gia nhóm (chỉ Admin / Mod nhóm)
  approveJoinRequest: (groupId, userId) => {
    return axiosClient.put(`/groups/${groupId}/join-requests/${userId}/approve`);
  },

  // Từ chối yêu cầu tham gia nhóm (chỉ Admin / Mod nhóm)
  rejectJoinRequest: (groupId, userId) => {
    return axiosClient.put(`/groups/${groupId}/join-requests/${userId}/reject`);
  },

  // Chuyển quyền Admin nhóm
  transferGroupAdmin: (groupId, newAdminId) => {
    return axiosClient.put(`/groups/${groupId}/transfer-admin`, { newAdminId });
  },

  // Lấy danh sách bài đăng chờ duyệt (chỉ Admin / Mod nhóm)
  getPendingPosts: (groupId) => {
    return axiosClient.get(`/groups/${groupId}/pending-posts`);
  },

  // Phê duyệt bài viết (chỉ Admin / Mod nhóm)
  approvePost: (groupId, postId) => {
    return axiosClient.put(`/groups/${groupId}/posts/${postId}/status`, { status: 'approved' });
  },

  // Từ chối và xóa bài viết (chỉ Admin / Mod nhóm)
  rejectPost: (groupId, postId) => {
    return axiosClient.put(`/groups/${groupId}/posts/${postId}/status`, { status: 'rejected' });
  },

  // Lấy bộ lọc từ cấm của nhóm
  getGroupFilters: (groupId) => {
    return axiosClient.get(`/groups/${groupId}/filters`);
  },

  // Thêm từ cấm vào nhóm
  addGroupFilter: (groupId, word) => {
    return axiosClient.post(`/groups/${groupId}/filters`, { word });
  },

  // Xóa từ cấm khỏi nhóm
  deleteGroupFilter: (groupId, word) => {
    return axiosClient.delete(`/groups/${groupId}/filters/${encodeURIComponent(word)}`);
  },

  // Xóa thành viên khỏi nhóm (chỉ Admin nhóm)
  kickMember: (groupId, userId) => {
    return axiosClient.delete(`/groups/${groupId}/members/${userId}`);
  },

  // Cập nhật cấu hình cài đặt nhóm (chỉ Admin nhóm)
  updateGroupSettings: (groupId, settings) => {
    return axiosClient.put(`/groups/${groupId}/settings`, settings);
  }
};

export default groupApi;
