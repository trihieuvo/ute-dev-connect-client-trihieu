import React from 'react';
import { MessageCircle } from 'lucide-react';
import CommentItem from './CommentItem';

const CommentList = ({ post, comments = [], onCommentsChange }) => {
  if (!comments.length) {
    return (
      <div className="mt-4 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-6 text-center">
        <MessageCircle size={28} className="mx-auto text-gray-400 dark:text-gray-500" />
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Chưa có bình luận nào. Hãy là người đầu tiên bình luận.
        </p>
      </div>
    );
  }

  const sortedComments = [...comments].sort((a, b) => {
    // 1. Câu trả lời được chấp nhận (isAccepted) lên đầu
    if (a.isAccepted && !b.isAccepted) return -1;
    if (!a.isAccepted && b.isAccepted) return 1;

    // 2. Tiếp theo sắp xếp theo điểm uy tín (approvals - disapprovals) giảm dần
    const aScore = (a.approvals?.length || 0) - (a.disapprovals?.length || 0);
    const bScore = (b.approvals?.length || 0) - (b.disapprovals?.length || 0);
    return bScore - aScore;
  });

  return (
    <div className="mt-4 space-y-3">
      {sortedComments.map((comment, index) => (
        <CommentItem
          key={comment._id || comment.id || `${comment.text}-${index}`}
          comment={comment}
          post={post}
          onCommentsChange={onCommentsChange}
        />
      ))}
    </div>
  );
};

export default CommentList;