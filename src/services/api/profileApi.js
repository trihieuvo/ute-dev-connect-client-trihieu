import axiosClient from './axiosClient';

export const profileApi = {
  getProfile: () => {
    return axiosClient.get('/profile/me');
  },
  editProfile: (data) => {
    return axiosClient.put('/profile', data);
  },
  uploadAvatar: (formData) => {
    return axiosClient.put('/profile/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  deleteAvatar: () => {
    return axiosClient.delete('/profile/avatar');
  },
  getProfiles: () => {
    return axiosClient.get('/profile');
  },
  getProfileById: (userId) => {
    return axiosClient.get(`/profile/user/${userId}`);
  },
  followUser: (userId) => {
    return axiosClient.put(`/profile/follow/${userId}`);
  },
  unfollowUser: (userId) => {
    return axiosClient.put(`/profile/unfollow/${userId}`);
  },
  getFollowers: (userId) => {
    return axiosClient.get(`/profile/followers/${userId}`);
  },
  getFollowing: (userId) => {
    return axiosClient.get(`/profile/following/${userId}`);
  }
};
