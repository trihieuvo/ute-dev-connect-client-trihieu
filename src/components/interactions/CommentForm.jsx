import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Loader2, Send, Edit2, Eye } from 'lucide-react';
import { toast } from 'react-toastify';
import { postApi } from '../../services/api/postApi';
import groupApi from '../../services/api/groupApi';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

const getDataFromResponse = (response) => {
  return response?.data?.data || response?.data || response;
};

const CommentForm = ({ postId, post, onCommentCreated }) => {
  const location = useLocation();
  const textareaRef = useRef(null);

  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isPreview, setIsPreview] = useState(false);
  const [codeSnippet, setCodeSnippet] = useState('');
  const [codeLanguage, setCodeLanguage] = useState('javascript');
  const [showCodeSnippet, setShowCodeSnippet] = useState(false);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.get('focusComment') === 'true' && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [location]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    const normalizedText = text.trim();

    if (!normalizedText) {
      setError('Vui lòng nhập nội dung bình luận.');
      return;
    }

    try {
      setLoading(true);
      setError('');

      let response;
      const groupId = post?.group?._id || post?.group;
      if (groupId) {
        response = await groupApi.addGroupComment(
          groupId,
          postId,
          normalizedText,
          showCodeSnippet ? codeSnippet : '',
          showCodeSnippet ? codeLanguage : 'javascript'
        );
      } else {
        response = await postApi.addComment(
          postId,
          normalizedText,
          showCodeSnippet ? codeSnippet : '',
          showCodeSnippet ? codeLanguage : 'javascript'
        );
      }
      const data = getDataFromResponse(response);

      onCommentCreated?.(data);
      setText('');
      setCodeSnippet('');
      setShowCodeSnippet(false);
      setIsPreview(false);
      toast.success('Bình luận thành công!');
    } catch (err) {
      console.error('Lỗi khi gửi bình luận:', err);

      setError(
        err.response?.data?.message ||
          'Không thể gửi bình luận. Vui lòng thử lại.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-5">
      <div className="flex items-center justify-between mb-2">
        <label
          htmlFor="comment"
          className="block text-sm font-semibold text-gray-700 dark:text-gray-300"
        >
          Viết bình luận
        </label>
        <div className="flex space-x-2">
          <button type="button" onClick={() => setIsPreview(false)} className={`px-2 py-1 text-xs font-medium rounded-md flex items-center transition-colors ${!isPreview ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
            <Edit2 className="w-3.5 h-3.5 mr-1" /> Viết
          </button>
          <button type="button" onClick={() => setIsPreview(true)} className={`px-2 py-1 text-xs font-medium rounded-md flex items-center transition-colors ${isPreview ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
            <Eye className="w-3.5 h-3.5 mr-1" /> Xem trước
          </button>
          <button type="button" onClick={() => setShowCodeSnippet(!showCodeSnippet)} className={`px-2 py-1 text-xs font-medium rounded-md flex items-center transition-colors ${showCodeSnippet ? 'bg-blue-600 dark:bg-blue-500 text-white' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
            <span className="font-mono mr-1">&lt;/&gt;</span> Code Snippet
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="flex-1 w-full min-w-0">
          {!isPreview ? (
            <>
              <textarea
                id="comment"
                ref={textareaRef}
                value={text}
                onChange={(event) => {
                  setText(event.target.value);
                  if (error) setError('');
                }}
                rows={3}
                placeholder="Nhập bình luận của bạn (Hỗ trợ Markdown)..."
                className={`w-full min-h-[90px] resize-none rounded-xl border bg-white dark:bg-gray-800 px-4 py-3 text-sm text-gray-900 dark:text-gray-100 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30 ${
                  error ? 'border-red-400 dark:border-red-500' : 'border-gray-200 dark:border-gray-700'
                }`}
              />
              
              {showCodeSnippet && (
                <div className="mt-2 p-3 border border-blue-100 dark:border-blue-900/50 rounded-xl bg-slate-50 dark:bg-gray-800/50">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">MÃ NGUỒN PHẢN HỒI</span>
                    <select
                      value={codeLanguage}
                      onChange={(e) => setCodeLanguage(e.target.value)}
                      className="text-xs px-1.5 py-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                    >
                      <option value="javascript">JavaScript</option>
                      <option value="python">Python</option>
                      <option value="cpp">C++</option>
                      <option value="html">HTML</option>
                      <option value="css">CSS</option>
                      <option value="java">Java</option>
                      <option value="go">Go</option>
                    </select>
                  </div>
                  <textarea
                    value={codeSnippet}
                    onChange={(e) => setCodeSnippet(e.target.value)}
                    placeholder="Viết mã code trả lời ở đây..."
                    rows={4}
                    className="w-full font-mono text-xs px-2.5 py-1.5 bg-slate-900 text-slate-100 border border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 resize-y"
                  />
                </div>
              )}
            </>
          ) : (
            <div className="w-full min-h-[90px] rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-3 text-sm text-slate-800 dark:text-slate-200 prose prose-slate dark:prose-invert prose-sm max-w-none prose-p:my-1 prose-pre:my-2 prose-headings:my-2 prose-ul:my-1 prose-ol:my-1">
              {text ? (
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
                          className="rounded-md my-2"
                        />
                      ) : (
                        <code {...props} className={`${className} bg-gray-100 dark:bg-gray-800 text-red-500 dark:text-red-400 px-1 py-0.5 rounded text-xs font-mono`}>
                          {children}
                        </code>
                      )
                    }
                  }}
                >
                  {text}
                </ReactMarkdown>
              ) : (
                <span className="text-gray-400 italic">Chưa có nội dung để xem trước...</span>
              )}

              {showCodeSnippet && codeSnippet && (
                <div className="mt-3 border-t border-gray-200 dark:border-gray-700 pt-3">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1">MÃ NGUỒN ({codeLanguage}):</span>
                  <SyntaxHighlighter
                    children={codeSnippet}
                    style={vscDarkPlus}
                    language={codeLanguage}
                    PreTag="div"
                    className="rounded-md my-1 text-xs"
                  />
                </div>
              )}
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="inline-flex h-11 sm:h-auto items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70 shrink-0"
        >
          {loading ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <Send size={18} />
          )}
          Gửi
        </button>
      </div>

      {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
    </form>
  );
};

export default CommentForm;