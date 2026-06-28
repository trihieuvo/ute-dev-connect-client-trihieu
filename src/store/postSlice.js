import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axiosClient from "../services/api/axiosClient";

const initialState = {
  posts: [],
  savedPosts: [],
  hiddenPosts: [],
  post: null,
  loading: true,
  loadingMore: false,
  error: null,
  page: 1,
  hasMore: true,
  hasMoreSaved: true,
  hasMoreHidden: true,
};

// Async thunk: Lấy tất cả bài viết (GET /api/posts)
export const getPosts = createAsyncThunk(
  "post/getPosts",
  async ({ page = 1, limit = 5, filter = 'latest', timeframe = '7d' } = {}, { rejectWithValue }) => {
    try {
      const response = await axiosClient.get(`/posts?page=${page}&limit=${limit}&filter=${filter}&timeframe=${timeframe}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || "Lỗi khi tải bài viết"
      );
    }
  }
);

// Async thunk: Lấy bài viết theo ID (GET /api/posts/:id)
export const getPost = createAsyncThunk(
  "post/getPost",
  async (id, { rejectWithValue }) => {
    try {
      const response = await axiosClient.get(`/posts/${id}`);
      const postData = response.data?.data || response.data || response;
      return postData;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || "Lỗi khi tải bài viết"
      );
    }
  }
);

// Async thunk: Tạo bài viết mới (POST /api/posts)
export const addPost = createAsyncThunk(
  "post/addPost",
  async (formData, { rejectWithValue }) => {
    try {
      const response = await axiosClient.post("/posts", formData);
      const postData = response.data?.data || response.data || response;
      return postData;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || "Lỗi khi tạo bài viết"
      );
    }
  }
);

export const savePost = createAsyncThunk(
  "post/savePost",
  async (postId, { rejectWithValue }) => {
    try {
      const response = await axiosClient.put(`/posts/save/${postId}`);
      return response.data?.data || response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || "Lỗi khi lưu bài viết"
      );
    }
  }
);

export const getSavedPosts = createAsyncThunk(
  "post/getSavedPosts",
  async ({ page = 1, limit = 10 } = {}, { rejectWithValue }) => {
    try {
      const response = await axiosClient.get(`/posts/saved?page=${page}&limit=${limit}`);
      return response.data || {};
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || "Lỗi khi tải bài viết đã lưu"
      );
    }
  }
);

// Async thunk: Cập nhật bài viết
export const updatePost = createAsyncThunk(
  "post/updatePost",
  async ({ id, formData }, { rejectWithValue }) => {
    try {
      const response = await axiosClient.put(`/posts/${id}`, formData);
      return response.data?.data || response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || "Lỗi khi cập nhật bài viết"
      );
    }
  }
);

// Async thunk: Xóa bài viết
export const deletePost = createAsyncThunk(
  "post/deletePost",
  async (id, { rejectWithValue }) => {
    try {
      await axiosClient.delete(`/posts/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || "Lỗi khi xóa bài viết"
      );
    }
  }
);

// Async thunk: Ẩn / Hiện bài viết
export const hidePost = createAsyncThunk(
  "post/hidePost",
  async (id, { rejectWithValue }) => {
    try {
      const response = await axiosClient.put(`/posts/hide/${id}`);
      return response.data?.data || response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || "Lỗi khi ẩn/hiện bài viết"
      );
    }
  }
);

// Async thunk: Like / Unlike bài viết
export const likePost = createAsyncThunk(
  "post/likePost",
  async (id, { rejectWithValue }) => {
    try {
      const response = await axiosClient.put(`/posts/like/${id}`);
      return { postId: id, ...response.data };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || "Lỗi khi thích/bỏ thích bài viết"
      );
    }
  }
);

// Async thunk: Lấy danh sách bài viết đã ẩn
export const getHiddenPosts = createAsyncThunk(
  "post/getHiddenPosts",
  async ({ page = 1, limit = 10 } = {}, { rejectWithValue }) => {
    try {
      const response = await axiosClient.get(`/posts/hidden?page=${page}&limit=${limit}`);
      return response.data || {};
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || "Lỗi khi tải bài viết đã ẩn"
      );
    }
  }
);

const postSlice = createSlice({
  name: "post",
  initialState,
  reducers: {
    clearPostError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // GET ALL POSTS
      .addCase(getPosts.pending, (state, action) => {
        const isLoadMore = action.meta.arg?.page > 1;
        if (isLoadMore) {
          state.loadingMore = true;
        } else {
          state.loading = true;
        }
      })
      .addCase(getPosts.fulfilled, (state, action) => {
        state.loading = false;
        state.loadingMore = false;
        
        const payloadData = action.payload;
        // Kiểm tra xem backend đã trả đúng format phân trang chưa
        const newPosts = payloadData.data ? payloadData.data : (Array.isArray(payloadData) ? payloadData : []);
        
        const isLoadMore = action.meta.arg?.page > 1;
        
        if (isLoadMore) {
          state.posts = [...state.posts, ...newPosts]; // Append
        } else {
          state.posts = newPosts; // Overwrite
        }
        
        // Cập nhật page và hasMore
        state.page = payloadData.page !== undefined ? payloadData.page : (action.meta.arg?.page || 1);
        state.hasMore = payloadData.hasMore !== undefined ? payloadData.hasMore : (newPosts.length === (action.meta.arg?.limit || 5));
      })
      .addCase(getPosts.rejected, (state, action) => {
        state.loading = false;
        state.loadingMore = false;
        state.error = action.payload;
      })

      // GET SINGLE POST
      .addCase(getPost.pending, (state) => {
        state.loading = true;
      })
      .addCase(getPost.fulfilled, (state, action) => {
        state.loading = false;
        state.post = action.payload;
      })
      .addCase(getPost.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ADD POST
      .addCase(addPost.pending, (state) => {
        state.loading = true;
      })
      .addCase(addPost.fulfilled, (state, action) => {
        state.loading = false;
        state.posts = [action.payload, ...state.posts];
      })
      .addCase(addPost.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // UPDATE POST
      .addCase(updatePost.pending, (state) => {
        state.loading = true;
      })
      .addCase(updatePost.fulfilled, (state, action) => {
        state.loading = false;
        state.posts = state.posts.map(post => 
          post._id === action.payload._id ? action.payload : post
        );
        if (state.post && state.post._id === action.payload._id) {
          state.post = action.payload;
        }
      })
      .addCase(updatePost.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // DELETE POST
      .addCase(deletePost.pending, (state) => {
        state.loading = true;
      })
      .addCase(deletePost.fulfilled, (state, action) => {
        state.loading = false;
        state.posts = state.posts.filter(post => post._id !== action.payload);
        state.hiddenPosts = state.hiddenPosts.filter(post => post._id !== action.payload);
        if (state.post && state.post._id === action.payload) {
          state.post = null;
        }
      })
      .addCase(deletePost.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // HIDE / UNHIDE POST
      .addCase(hidePost.pending, (state) => {
        state.error = null;
      })
      .addCase(hidePost.fulfilled, (state, action) => {
        const updatedPost = action.payload;
        if (updatedPost.isHidden) {
          state.posts = state.posts.filter(post => post._id !== updatedPost._id);
          if (!state.hiddenPosts.some(p => p._id === updatedPost._id)) {
            state.hiddenPosts = [updatedPost, ...state.hiddenPosts];
          }
        } else {
          state.hiddenPosts = state.hiddenPosts.filter(post => post._id !== updatedPost._id);
          state.posts = state.posts.map(post => 
            post._id === updatedPost._id ? updatedPost : post
          );
        }
        if (state.post && state.post._id === updatedPost._id) {
          state.post = updatedPost;
        }
      })
      .addCase(hidePost.rejected, (state, action) => {
        state.error = action.payload;
      })
            // SAVE / UNSAVE POST
      .addCase(savePost.pending, (state) => {
        state.error = null;
      })
      .addCase(savePost.fulfilled, (state, action) => {
        const { postId, isSaved } = action.payload;

        state.posts = state.posts.map((post) =>
          post._id === postId ? { ...post, isSaved } : post
        );

        if (state.post && state.post._id === postId) {
          state.post.isSaved = isSaved;
        }

        if (!isSaved) {
          state.savedPosts = state.savedPosts.filter(
            (post) => post._id !== postId
          );
        }
      })
      .addCase(savePost.rejected, (state, action) => {
        state.error = action.payload;
      })

      // GET SAVED POSTS
      .addCase(getSavedPosts.pending, (state, action) => {
        if (action.meta.arg?.page > 1) {
          state.loadingMore = true;
        } else {
          state.loading = true;
        }
        state.error = null;
      })
      .addCase(getSavedPosts.fulfilled, (state, action) => {
        state.loading = false;
        state.loadingMore = false;
        const { data, hasMore, page } = action.payload;
        if (page > 1) {
          state.savedPosts = [...state.savedPosts, ...(data || [])];
        } else {
          state.savedPosts = data || [];
        }
        state.hasMoreSaved = hasMore !== undefined ? hasMore : false;
      })
      .addCase(getSavedPosts.rejected, (state, action) => {
        state.loading = false;
        state.loadingMore = false;
        state.error = action.payload;
      })

      // GET HIDDEN POSTS
      .addCase(getHiddenPosts.pending, (state, action) => {
        if (action.meta.arg?.page > 1) {
          state.loadingMore = true;
        } else {
          state.loading = true;
        }
        state.error = null;
      })
      .addCase(getHiddenPosts.fulfilled, (state, action) => {
        state.loading = false;
        state.loadingMore = false;
        const { data, hasMore, page } = action.payload;
        if (page > 1) {
          state.hiddenPosts = [...state.hiddenPosts, ...(data || [])];
        } else {
          state.hiddenPosts = data || [];
        }
        state.hasMoreHidden = hasMore !== undefined ? hasMore : false;
      })
      .addCase(getHiddenPosts.rejected, (state, action) => {
        state.loading = false;
        state.loadingMore = false;
        state.error = action.payload;
      })
      // LIKE / UNLIKE POST
      .addCase(likePost.pending, (state) => {
        state.error = null;
      })
      .addCase(likePost.fulfilled, (state, action) => {
        const { postId, likes } = action.payload;

        state.posts = state.posts.map((post) =>
          post._id === postId ? { ...post, likes } : post
        );

        if (state.post && state.post._id === postId) {
          state.post.likes = likes;
        }

        state.savedPosts = state.savedPosts.map((post) =>
          post._id === postId ? { ...post, likes } : post
        );

        state.hiddenPosts = state.hiddenPosts.map((post) =>
          post._id === postId ? { ...post, likes } : post
        );
      })
      .addCase(likePost.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export const { clearPostError } = postSlice.actions;
export default postSlice.reducer;
