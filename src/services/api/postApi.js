import axiosClient from './axiosClient';

export const postApi = {
  // Lấy tất cả bài viết mới nhất (có phân trang)
  getAllPosts: (page = 1, limit = 5) => {
    return axiosClient.get(`/posts?page=${page}&limit=${limit}`);
  },

  // Lấy Top 10 bài viết nổi bật
  getTopTrending: () => {
    return axiosClient.get('/posts/top-trending');
  },

  // Tạo bài viết mới
  createPost: (text, isQuestion = false, groupId = null, codeSnippet = '', codeLanguage = 'javascript', visibility = 'public') => {
    return axiosClient.post('/posts', { text, isQuestion, groupId, codeSnippet, codeLanguage, visibility });
  },

  // Lấy bài viết theo ID
  getPostById: (id) => {
    return axiosClient.get(`/posts/${id}`);
  },

  // Lấy danh sách bài viết của một người dùng cụ thể
  getUserPosts: (userId, page = 1, limit = 5) => {
    return axiosClient.get(`/posts/user/${userId}?page=${page}&limit=${limit}`);
  },

  // Lưu / bỏ lưu bài viết
  savePost: (id) => {
    return axiosClient.put(`/posts/save/${id}`);
  },

  // Lấy danh sách bài viết đã lưu
  getSavedPosts: () => {
    return axiosClient.get('/posts/saved');
  },

  // Lấy danh sách bài viết đã ẩn
  getHiddenPosts: () => {
    return axiosClient.get('/posts/hidden');
  },

  // Ẩn / hiện bài viết
  hidePost: (id) => {
    return axiosClient.put(`/posts/hide/${id}`);
  },

  // Like / Unlike bài viết
  likePost: (id) => {
    return axiosClient.put(`/posts/like/${id}`);
  },

  // Gửi bình luận
  addComment: (id, text, codeSnippet = '', codeLanguage = 'javascript') => {
    return axiosClient.post(`/posts/comment/${id}`, {
      text: text.trim(),
      codeSnippet,
      codeLanguage,
    });
  },

  // Cập nhật bài viết
  updatePost: (id, text, isQuestion, codeSnippet = '', codeLanguage = 'javascript', visibility) => {
    return axiosClient.put(`/posts/${id}`, { text, isQuestion, codeSnippet, codeLanguage, visibility });
  },

  // Xóa bài viết
  deletePost: (id) => {
    return axiosClient.delete(`/posts/${id}`);
  },

  // Cập nhật bình luận
  updateComment: (postId, commentId, text) => {
    return axiosClient.put(`/posts/comment/${postId}/${commentId}`, {
      text: text.trim(),
    });
  },

  // Xóa bình luận
  deleteComment: (postId, commentId) => {
    return axiosClient.delete(`/posts/comment/${postId}/${commentId}`);
  },

  // Chấp nhận câu trả lời
  acceptAnswer: (postId, commentId) => {
    return axiosClient.put(`/posts/accept/${postId}/${commentId}`);
  },

  // Phê duyệt bình luận (Upvote)
  approveComment: (postId, commentId) => {
    return axiosClient.put(`/posts/comment/${postId}/${commentId}/approve`);
  },

  // Phản đối bình luận (Downvote)
  disapproveComment: (postId, commentId) => {
    return axiosClient.put(`/posts/comment/${postId}/${commentId}/disapprove`);
  },
};