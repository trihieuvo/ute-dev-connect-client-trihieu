import React, { useState } from 'react';
import { User, CheckCircle, Loader2, Edit, Trash2, X, Save, ChevronUp, Star, ChevronDown } from 'lucide-react';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { postApi } from '../../services/api/postApi';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import Avatar from '../common/Avatar';
import ReputationBadge from '../common/ReputationBadge';
import RankBadge from '../common/RankBadge';

const parseJwt = (token) => {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch (e) {
    return null;
  }
};

const formatDate = (date) => {
  if (!date) {
    return '';
  }

  try {
    return new Date(date).toLocaleString('vi-VN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
};

const CommentItem = ({ comment, post, onCommentsChange }) => {
  const { token } = useSelector((state) => state.auth);
  const currentUserId = token ? parseJwt(token)?.user?.id || parseJwt(token)?.id : null;
  const [isAccepting, setIsAccepting] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isDisapproving, setIsDisapproving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(comment?.text || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const commentAuthorId = comment?.user?._id || comment?.user;
  const isCommentAuthor = currentUserId && commentAuthorId?.toString() === currentUserId?.toString();

  const name = comment?.name || comment?.user?.name || 'Người dùng ẩn danh';
  const avatar = comment?.avatar || comment?.user?.avatar || '';
  const text = comment?.text || '';
  const date = comment?.date || comment?.createdAt;
  const isAccepted = comment?.isAccepted;

  // Xử lý approvals (upvotes) và disapprovals (downvotes)
  const hasApproved = comment?.approvals && Array.isArray(comment.approvals) && comment.approvals.some(
    (app) => (app.user?._id || app.user || '').toString() === currentUserId?.toString()
  );
  const approvalsCount = comment?.approvals?.length || 0;

  const hasDisapproved = comment?.disapprovals && Array.isArray(comment.disapprovals) && comment.disapprovals.some(
    (dis) => (dis.user?._id || dis.user || '').toString() === currentUserId?.toString()
  );
  const disapprovalsCount = comment?.disapprovals?.length || 0;

  const commentScore = approvalsCount - disapprovalsCount;

  // Xác định câu trả lời hữu ích nhất (nhiều vote nhất)
  const commentsArray = Array.isArray(post?.comments) ? post.comments : [];
  const maxApprovals = commentsArray.reduce((max, c) => {
    const cUp = c.approvals?.length || 0;
    const cDown = c.disapprovals?.length || 0;
    const cScore = cUp - cDown;
    return cScore > max ? cScore : max;
  }, 0);
  const isTopVoted = commentScore > 0 && commentScore === maxApprovals;

  const handleApprove = async () => {
    if (!token) {
      toast.warning('Vui lòng đăng nhập để thực hiện phê duyệt.');
      return;
    }
    try {
      setIsApproving(true);
      const res = await postApi.approveComment(post._id, comment._id);
      if (res.data && res.data.data) {
        onCommentsChange?.(res.data.data);
        const updatedComments = res.data.data;
        const updatedComment = updatedComments.find(c => c._id === comment._id);
        const nextHasApproved = updatedComment?.approvals?.some(
          (app) => (app.user?._id || app.user || '').toString() === currentUserId?.toString()
        );
        toast.success(nextHasApproved ? 'Đã duyệt bình luận!' : 'Đã bỏ duyệt bình luận!');
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Không thể phê duyệt bình luận');
    } finally {
      setIsApproving(false);
    }
  };

  const handleDisapprove = async () => {
    if (!token) {
      toast.warning('Vui lòng đăng nhập để thực hiện phản đối.');
      return;
    }
    try {
      setIsDisapproving(true);
      const res = await postApi.disapproveComment(post._id, comment._id);
      if (res.data && res.data.data) {
        onCommentsChange?.(res.data.data);
        const updatedComments = res.data.data;
        const updatedComment = updatedComments.find(c => c._id === comment._id);
        const nextHasDisapproved = updatedComment?.disapprovals?.some(
          (dis) => (dis.user?._id || dis.user || '').toString() === currentUserId?.toString()
        );
        toast.success(nextHasDisapproved ? 'Đã phản đối bình luận!' : 'Đã bỏ phản đối bình luận!');
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Không thể phản đối bình luận');
    } finally {
      setIsDisapproving(false);
    }
  };

  const handleAcceptAnswer = async () => {
    try {
      setIsAccepting(true);
      const res = await postApi.acceptAnswer(post._id, comment._id);
      if (res.data && res.data.data) {
        onCommentsChange?.(res.data.data);
        const updatedComments = res.data.data;
        const updatedComment = updatedComments.find(c => c._id === comment._id);
        toast.success(updatedComment?.isAccepted ? 'Đã chấp nhận câu trả lời!' : 'Đã bỏ chấp nhận câu trả lời!');
      }
    } catch (err) {
      console.error(err);
      toast.error('Không thể cập nhật trạng thái câu trả lời');
    } finally {
      setIsAccepting(false);
    }
  };

  const handleEditSubmit = async () => {
    if (!editText.trim()) return;
    try {
      setIsSubmitting(true);
      const res = await postApi.updateComment(post._id, comment._id, editText);
      if (res.data && res.data.data) {
        onCommentsChange?.(res.data.data);
        setIsEditing(false);
        toast.success('Cập nhật bình luận thành công!');
      }
    } catch (err) {
      toast.error('Không thể cập nhật bình luận');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Bạn có chắc muốn xóa bình luận này?')) return;
    try {
      setIsSubmitting(true);
      const res = await postApi.deleteComment(post._id, comment._id);
      if (res.data && res.data.data) {
        onCommentsChange?.(res.data.data);
        toast.success('Xóa bình luận thành công!');
      }
    } catch (err) {
      toast.error('Không thể xóa bình luận');
    } finally {
      setIsSubmitting(false);
    }
  };

  const postAuthorId = post?.user?._id || post?.user;
  const isPostAuthor = currentUserId && postAuthorId?.toString() === currentUserId?.toString();

  return (
    <div className={`flex gap-4 rounded-2xl border ${isAccepted && isTopVoted ? 'border-emerald-350 dark:border-emerald-750 bg-gradient-to-br from-green-50/30 to-amber-50/20 dark:from-green-950/10 dark:to-amber-950/5 shadow-md' : isAccepted ? 'border-green-300 dark:border-green-800 bg-green-50 dark:bg-green-900/20 shadow-md' : isTopVoted ? 'border-amber-250 dark:border-amber-800/50 bg-amber-50/20 dark:bg-amber-900/20 shadow-sm' : 'border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm dark:shadow-gray-900/50'} p-4 transition-all duration-300 relative`}>
      {isAccepted && (
        <div className={`absolute -top-3 -right-2 ${isTopVoted ? 'bg-gradient-to-r from-green-100 to-amber-100 dark:from-green-900/60 dark:to-amber-900/40 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700/60' : 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800'} px-3 py-1 rounded-full text-xs font-bold border flex items-center shadow-sm z-10`}>
          {isTopVoted ? (
            <>
              <CheckCircle className="w-3.5 h-3.5 mr-1 text-green-600 dark:text-green-400" />
              <Star className="w-3.5 h-3.5 mr-1 fill-amber-500 text-amber-500" />
              Câu trả lời được chấp nhận & tốt nhất
            </>
          ) : (
            <>
              <CheckCircle className="w-3.5 h-3.5 mr-1" />
              Câu trả lời được chấp nhận
            </>
          )}
        </div>
      )}
      {isTopVoted && !isAccepted && (
        <div className="absolute -top-3 -right-2 bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-400 px-3 py-1 rounded-full text-xs font-bold border border-amber-200 dark:border-amber-800 flex items-center shadow-sm z-10">
          <Star className="w-3.5 h-3.5 mr-1 fill-amber-500 text-amber-500" /> Câu trả lời tốt nhất
        </div>
      )}

      {/* Cột upvote/approve bên trái */}
      <div className="flex flex-col items-center justify-start pt-1 gap-1 flex-shrink-0 w-8">
        <button 
          onClick={handleApprove}
          disabled={isApproving || isDisapproving}
          className={`p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex flex-col items-center justify-center ${hasApproved ? 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 font-bold' : 'text-gray-400 dark:text-gray-500'}`}
          title={hasApproved ? 'Bỏ phê duyệt (Upvote)' : 'Phê duyệt bình luận này (Upvote)'}
        >
          <ChevronUp className="w-6 h-6 stroke-[3]" />
        </button>
        <span className={`text-xs font-bold ${commentScore > 0 ? 'text-green-600 dark:text-green-400' : commentScore < 0 ? 'text-red-500 dark:text-red-400' : 'text-gray-700 dark:text-gray-300'}`}>
          {commentScore > 0 ? `+${commentScore}` : commentScore}
        </span>
        <button 
          onClick={handleDisapprove}
          disabled={isApproving || isDisapproving}
          className={`p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex flex-col items-center justify-center ${hasDisapproved ? 'text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/30 font-bold' : 'text-gray-400 dark:text-gray-500'}`}
          title={hasDisapproved ? 'Bỏ phản đối (Downvote)' : 'Phản đối bình luận này (Downvote)'}
        >
          <ChevronDown className="w-6 h-6 stroke-[3]" />
        </button>
        
        {isAccepted && (
          <CheckCircle className="w-5 h-5 text-green-600 mt-2 fill-green-50" title="Đã được tác giả bài viết chấp nhận" />
        )}
      </div>

      <div className="min-w-0 flex-1 flex gap-3">
        <Avatar src={avatar} alt={name} className="h-10 w-10 shrink-0 ring-2 ring-white shadow-sm mt-1" />

        <div className="min-w-0 flex-1 mt-1">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h4 className="font-semibold text-gray-800 dark:text-gray-200">{name}</h4>
                <RankBadge score={comment?.user?.reputation} className="px-1.5 py-0.5 text-3xs border font-bold rounded-full scale-90 origin-left" />
                <ReputationBadge score={comment?.user?.reputation} className="px-1.5 py-0.2 text-3xs shadow-3xs" />
              </div>
              {date && (
                <span className="text-xs text-gray-400 dark:text-gray-500">{formatDate(date)}</span>
              )}
            </div>
            {isCommentAuthor && !isEditing && (
              <div className="flex items-center space-x-1">
                <button onClick={() => setIsEditing(true)} className="text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 p-1.5 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors" title="Chỉnh sửa">
                  <Edit className="w-3.5 h-3.5" />
                </button>
                <button onClick={handleDelete} className="text-gray-400 hover:text-red-500 dark:hover:text-red-400 p-1.5 rounded-full hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors" title="Xóa bình luận">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {isEditing ? (
            <div className="mt-2">
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="w-full min-h-[80px] resize-none rounded-xl border border-gray-200 dark:border-gray-700 bg-transparent dark:bg-gray-800 dark:text-gray-100 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30"
              />
              <div className="flex gap-2 mt-2 justify-end">
                 <button onClick={() => setIsEditing(false)} className="px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors">Hủy</button>
                 <button onClick={handleEditSubmit} disabled={isSubmitting} className="flex items-center px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 rounded-lg transition-colors disabled:opacity-70">
                   {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Save className="w-3.5 h-3.5 mr-1" />}
                   Lưu
                 </button>
              </div>
            </div>
          ) : (
            <>
              <div className="mt-2 text-sm leading-6 text-slate-800 dark:text-slate-200 prose prose-slate dark:prose-invert prose-sm max-w-none prose-p:my-1 prose-pre:my-2 prose-headings:my-2 prose-ul:my-1 prose-ol:my-1">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    code({node, inline, className, children, ...props}) {
                      const match = /language-(\w+)/.exec(className || '')
                      return !inline && match ? (
                        <SyntaxHighlighter
                          {...props}
                          children={String(children).replace(/\n$/, '')}
                          style={vscDarkPlus}
                          language={match[1]}
                          PreTag="div"
                          className="rounded-md"
                        />
                      ) : (
                        <code {...props} className={`${className || ''} bg-gray-100 dark:bg-gray-800 text-red-500 dark:text-red-400 px-1 py-0.5 rounded text-xs font-mono`}>
                          {children}
                        </code>
                      )
                    }
                  }}
                >
                  {text}
                </ReactMarkdown>
              </div>

              {comment?.codeSnippet && (
                <div className="mt-3 border-t border-gray-100 dark:border-gray-800 pt-3">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1 uppercase tracking-wider">Mã nguồn ({comment.codeLanguage || 'javascript'}):</span>
                  <SyntaxHighlighter
                    children={comment.codeSnippet}
                    style={vscDarkPlus}
                    language={comment.codeLanguage || 'javascript'}
                    PreTag="div"
                    className="rounded-lg shadow-sm overflow-hidden text-xs"
                  />
                </div>
              )}
            </>
          )}

          {post?.isQuestion && isPostAuthor && (
            <div className="mt-3 flex justify-end">
               <button 
                 onClick={handleAcceptAnswer}
                 disabled={isAccepting}
                 className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${isAccepted ? 'bg-white dark:bg-gray-800 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800 hover:bg-green-50 dark:hover:bg-green-900/30' : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-green-600 dark:hover:text-green-400'}`}
               >
                 {isAccepting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className={`w-3.5 h-3.5 ${isAccepted ? 'text-green-500' : ''}`} />}
                 {isAccepted ? 'Bỏ chấp nhận' : 'Chấp nhận câu trả lời'}
               </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommentItem;