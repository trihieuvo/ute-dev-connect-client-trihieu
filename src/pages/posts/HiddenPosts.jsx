import React, { useEffect, useState, useRef } from 'react';
import { EyeOff, Loader2 } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import PostItem from '../../components/posts/PostItem';
import { getHiddenPosts } from '../../store/postSlice';

const HiddenPosts = () => {
  const dispatch = useDispatch();
  const { hiddenPosts, loading, loadingMore, hasMoreHidden, error } = useSelector((state) => state.post);
  const hiddenPostList = Array.isArray(hiddenPosts) ? hiddenPosts : [];

  const [page, setPage] = useState(1);
  const observerTarget = useRef(null);

  useEffect(() => {
    dispatch(getHiddenPosts({ page: 1, limit: 10 }));
  }, [dispatch]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMoreHidden && !loading && !loadingMore) {
          const nextPage = page + 1;
          setPage(nextPage);
          dispatch(getHiddenPosts({ page: nextPage, limit: 10 }));
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [hasMoreHidden, loading, loadingMore, page, dispatch]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-3xl mx-auto px-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-6">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center">
              <EyeOff className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Bài viết đã ẩn
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Xem lại và quản lý những bài viết bạn đã ẩn khỏi bảng tin.
              </p>
            </div>
          </div>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-12 text-gray-500 dark:text-gray-400">
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Đang tải bài viết đã ẩn...
          </div>
        )}

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 text-red-600 dark:text-red-400 rounded-xl p-4 text-sm">
            {error}
          </div>
        )}

        {!loading && !error && hiddenPostList.length === 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-10 text-center">
            <EyeOff className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
              Không có bài viết đã ẩn
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Các bài viết bạn ẩn sẽ được hiển thị ở đây để bạn có thể xem lại hoặc khôi phục.
            </p>
          </div>
        )}

        <div className="space-y-4">
          {!loading && !error && hiddenPostList.map((post) => (
            <PostItem
              key={post._id}
              post={{
                ...post,
                isHidden: true,
              }}
            />
          ))}
          
          {loadingMore && (
            <div className="flex justify-center py-4">
              <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
            </div>
          )}
          
          {/* Intersection Observer Target */}
          <div ref={observerTarget} className="h-4 w-full"></div>
        </div>
      </div>
    </div>
  );
};

export default HiddenPosts;
