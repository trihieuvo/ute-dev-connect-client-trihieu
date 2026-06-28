import React, { useEffect, useMemo, useState } from 'react';
import { Heart, Loader2 } from 'lucide-react';
import { postApi } from '../../services/api/postApi';

const getCurrentUserIdFromToken = () => {
  try {
    const token = localStorage.getItem('token');

    if (!token) {
      return null;
    }

    const payloadBase64 = token.split('.')[1];

    if (!payloadBase64) {
      return null;
    }

    const normalizedPayload = payloadBase64
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const payload = JSON.parse(atob(normalizedPayload));

    return (
      payload.id ||
      payload._id ||
      payload.userId ||
      payload.user?.id ||
      payload.user?._id ||
      payload.sub ||
      null
    );
  } catch (error) {
    console.error('Không thể đọc userId từ token:', error);
    return null;
  }
};

const isUserLikedPost = (likes = [], currentUserId) => {
  if (!currentUserId || !Array.isArray(likes)) {
    return false;
  }

  return likes.some((like) => {
    const likeUserId =
      like?.user?._id ||
      like?.user?.id ||
      like?.user ||
      like?._id ||
      like?.id;

    return String(likeUserId) === String(currentUserId);
  });
};

const buildOptimisticLikes = (likes = [], currentUserId, nextLiked) => {
  if (!currentUserId) {
    return likes;
  }

  if (nextLiked) {
    const alreadyExists = isUserLikedPost(likes, currentUserId);

    if (alreadyExists) {
      return likes;
    }

    return [{ user: currentUserId }, ...likes];
  }

  return likes.filter((like) => {
    const likeUserId =
      like?.user?._id ||
      like?.user?.id ||
      like?.user ||
      like?._id ||
      like?.id;

    return String(likeUserId) !== String(currentUserId);
  });
};

const getDataFromResponse = (response) => {
  return response?.data?.data || response?.data || response;
};

const LikeButton = ({ postId, likes = [], onLikesChange }) => {
  const currentUserId = useMemo(() => getCurrentUserIdFromToken(), []);
  const initialLiked = useMemo(
    () => isUserLikedPost(likes, currentUserId),
    [likes, currentUserId]
  );

  const [liked, setLiked] = useState(initialLiked);
  const [likesCount, setLikesCount] = useState(likes.length || 0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setLiked(isUserLikedPost(likes, currentUserId));
    setLikesCount(likes.length || 0);
  }, [likes, currentUserId]);

  const handleLike = async () => {
    if (loading || !postId) {
      return;
    }

    const previousLiked = liked;
    const previousLikes = likes;
    const previousCount = likesCount;

    const nextLiked = !previousLiked;
    const optimisticLikes = buildOptimisticLikes(
      previousLikes,
      currentUserId,
      nextLiked
    );

    setError('');
    setLiked(nextLiked);
    setLikesCount((prev) => (nextLiked ? prev + 1 : Math.max(prev - 1, 0)));
    onLikesChange?.(optimisticLikes);

    try {
      setLoading(true);

      const response = await postApi.likePost(postId);
      const data = getDataFromResponse(response);

      const serverLikes =
        data?.likes ||
        data?.post?.likes ||
        data?.updatedPost?.likes ||
        data?.data?.likes;

      const serverLiked =
        typeof data?.liked === 'boolean'
          ? data.liked
          : typeof data?.isLiked === 'boolean'
          ? data.isLiked
          : nextLiked;

      const serverLikesCount =
        data?.likesCount ??
        data?.likeCount ??
        data?.post?.likes?.length ??
        data?.updatedPost?.likes?.length ??
        serverLikes?.length;

      if (Array.isArray(serverLikes)) {
        onLikesChange?.(serverLikes);
      }

      setLiked(serverLiked);

      if (typeof serverLikesCount === 'number') {
        setLikesCount(serverLikesCount);
      }
    } catch (err) {
      console.error('Lỗi khi thả tim bài viết:', err);

      setLiked(previousLiked);
      setLikesCount(previousCount);
      onLikesChange?.(previousLikes);

      setError(
        err.response?.data?.message ||
          'Không thể cập nhật lượt thích. Vui lòng thử lại.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        type="button"
        onClick={handleLike}
        disabled={loading}
        className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-all duration-200 ${
          liked
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
            : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:border-blue-300 dark:hover:border-blue-700 hover:text-blue-600 dark:hover:text-blue-400'
        } ${loading ? 'cursor-not-allowed opacity-70' : ''}`}
      >
        {loading ? (
          <Loader2 size={18} className="animate-spin" />
        ) : (
          <Heart
            size={18}
            className={liked ? 'fill-blue-500 text-blue-500' : ''}
          />
        )}

        <span>{liked ? 'Đã thích' : 'Thích'}</span>
        <span className="font-semibold">({likesCount})</span>
      </button>

      {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
    </div>
  );
};

export default LikeButton;