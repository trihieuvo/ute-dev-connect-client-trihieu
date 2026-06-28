import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { postApi } from '../../services/api/postApi';
import Spinner from '../../components/common/Spinner';
import Alert from '../../components/common/Alert';
import { ArrowLeft, X } from 'lucide-react';
import PostItem from '../../components/posts/PostItem';
import PostInteractions from '../../components/interactions/PostInteractions';

const PostDetail = ({ isModal = false }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const handleClose = () => {
    navigate(-1);
  };

  useEffect(() => {
    if (isModal) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [isModal]);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        setLoading(true);
        const response = await postApi.getPostById(id);
        // Tùy theo cấu hình axios interceptor mà response có thể nằm ở response.data hoặc data
        const postData = response.data?.data || response.data || response;
        setPost(postData);
        setError('');
      } catch (err) {
        console.error('Lỗi khi tải bài viết:', err);
        const errorMsg = err.response?.data?.message || 'Không thể tải bài viết. Vui lòng thử lại sau.';
        setError(errorMsg);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchPost();
    }
  }, [id]);

  const handlePostUpdate = (updatedPost) => {
    setPost(updatedPost);
  };

  if (loading) {
    if (isModal) {
      return (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={handleClose}
        >
          <div 
            className="bg-white dark:bg-gray-800 rounded-3xl max-w-3xl w-full min-h-[300px] flex items-center justify-center shadow-2xl relative p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={handleClose}
              className="absolute top-4 right-4 p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-all"
              title="Đóng"
            >
              <X className="w-5 h-5" />
            </button>
            <Spinner size="lg" />
          </div>
        </div>
      );
    }
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    if (isModal) {
      return (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={handleClose}
        >
          <div 
            className="bg-white dark:bg-gray-800 rounded-3xl max-w-3xl w-full shadow-2xl relative p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={handleClose}
              className="absolute top-4 right-4 p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-all"
              title="Đóng"
            >
              <X className="w-5 h-5" />
            </button>
            <Alert type="error" message={error} />
          </div>
        </div>
      );
    }
    return (
      <div className="max-w-3xl mx-auto mt-10 px-4">
        <Alert type="error" message={error} />
        <Link to="/dashboard" className="inline-flex items-center mt-4 text-blue-600 dark:text-blue-400 hover:underline">
          <ArrowLeft className="w-4 h-4 mr-1" /> Quay lại trang chủ
        </Link>
      </div>
    );
  }

  if (!post) {
    return null;
  }

  if (isModal) {
    return (
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
        onClick={handleClose}
      >
        <div 
          className="bg-gray-50 dark:bg-gray-900 rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative p-6 sm:p-8 my-8"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button 
            onClick={handleClose}
            className="absolute top-4 right-4 p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full transition-all"
            title="Đóng"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="mt-2">
            <PostItem post={post} isDetail={true} onPostUpdate={handlePostUpdate} />
            <PostInteractions post={post} setPost={setPost} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto mt-8 px-4 pb-12">
      <Link to="/dashboard" className="inline-flex items-center mb-6 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
        <ArrowLeft className="w-4 h-4 mr-1" /> Quay lại
      </Link>
      
      <PostItem post={post} isDetail={true} onPostUpdate={handlePostUpdate} />
      <PostInteractions post={post} setPost={setPost} />
    </div>
  );
};

export default PostDetail;
