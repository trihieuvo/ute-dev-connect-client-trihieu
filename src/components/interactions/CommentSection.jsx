import React from 'react';
import CommentForm from './CommentForm';
import CommentList from './CommentList';

const extractCommentsFromPayload = (payload, currentComments) => {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.comments)) {
    return payload.comments;
  }

  if (Array.isArray(payload?.post?.comments)) {
    return payload.post.comments;
  }

  if (Array.isArray(payload?.updatedPost?.comments)) {
    return payload.updatedPost.comments;
  }

  if (payload?.comment) {
    return [payload.comment, ...currentComments];
  }

  if (payload?._id || payload?.id) {
    return [payload, ...currentComments];
  }

  return currentComments;
};

const CommentSection = ({ postId, post, comments = [], onCommentsChange }) => {
  const handleCommentCreated = (payload) => {
    const nextComments = extractCommentsFromPayload(payload, comments);
    onCommentsChange?.(nextComments);
  };

  return (
    <section className="mt-8 rounded-3xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-sm">
      <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Bình luận</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {comments.length} bình luận trong bài viết này
          </p>
        </div>
      </div>

      <CommentForm postId={postId} post={post} onCommentCreated={handleCommentCreated} />
      <CommentList post={post} comments={comments} onCommentsChange={onCommentsChange} />
    </section>
  );
};

export default CommentSection;