import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axiosClient from '../services/api/axiosClient';

const initialState = {
  notifications: [],
  unreadCount: 0,
  loading: false,
  loadingMore: false,
  hasMore: true,
  page: 1,
  error: null,
};

// Lấy danh sách thông báo
export const getNotifications = createAsyncThunk(
  'notification/getNotifications',
  async ({ page = 1, limit = 20 } = {}, { rejectWithValue }) => {
    try {
      const response = await axiosClient.get(`/notifications?page=${page}&limit=${limit}`);
      return response.data || {};
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Lỗi khi tải thông báo'
      );
    }
  }
);

// Lấy số lượng thông báo chưa đọc
export const getUnreadCount = createAsyncThunk(
  'notification/getUnreadCount',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosClient.get('/notifications/unread-count');
      return response.data?.data?.count || response.data?.count || 0;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Lỗi khi tải số lượng thông báo'
      );
    }
  }
);

// Đánh dấu 1 thông báo là đã đọc
export const markAsRead = createAsyncThunk(
  'notification/markAsRead',
  async (id, { rejectWithValue }) => {
    try {
      const response = await axiosClient.put(`/notifications/${id}/read`);
      return response.data?.data || response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Lỗi khi cập nhật thông báo'
      );
    }
  }
);

// Đánh dấu tất cả là đã đọc
export const markAllAsRead = createAsyncThunk(
  'notification/markAllAsRead',
  async (_, { rejectWithValue }) => {
    try {
      await axiosClient.put('/notifications/read-all');
      return true;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Lỗi khi cập nhật thông báo'
      );
    }
  }
);

const notificationSlice = createSlice({
  name: 'notification',
  initialState,
  reducers: {
    clearNotificationError: (state) => {
      state.error = null;
    },
    // Nếu có websocket thì thêm action này để add notification real-time
    addNotification: (state, action) => {
      state.notifications.unshift(action.payload);
      state.unreadCount += 1;
    }
  },
  extraReducers: (builder) => {
    builder
      // GET NOTIFICATIONS
      .addCase(getNotifications.pending, (state, action) => {
        if (action.meta.arg?.page > 1) {
          state.loadingMore = true;
        } else {
          state.loading = true;
        }
        state.error = null;
      })
      .addCase(getNotifications.fulfilled, (state, action) => {
        state.loading = false;
        state.loadingMore = false;
        const { data, hasMore, page } = action.payload;
        if (page > 1) {
          state.notifications = [...state.notifications, ...(data || [])];
        } else {
          state.notifications = data || [];
        }
        state.hasMore = hasMore !== undefined ? hasMore : false;
      })
      .addCase(getNotifications.rejected, (state, action) => {
        state.loading = false;
        state.loadingMore = false;
        state.error = action.payload;
      })

      // GET UNREAD COUNT
      .addCase(getUnreadCount.fulfilled, (state, action) => {
        state.unreadCount = action.payload;
      })

      // MARK AS READ
      .addCase(markAsRead.fulfilled, (state, action) => {
        const updatedNotification = action.payload;
        const index = state.notifications.findIndex(n => n._id === updatedNotification._id);
        if (index !== -1) {
          state.notifications[index].isRead = true;
        }
        if (state.unreadCount > 0) {
          state.unreadCount -= 1;
        }
      })

      // MARK ALL AS READ
      .addCase(markAllAsRead.fulfilled, (state) => {
        state.notifications.forEach(n => {
          n.isRead = true;
        });
        state.unreadCount = 0;
      });
  },
});

export const { clearNotificationError, addNotification } = notificationSlice.actions;
export default notificationSlice.reducer;
