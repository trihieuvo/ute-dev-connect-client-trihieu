import React, { useState } from 'react';
import Textarea from '../common/Textarea';
import Button from '../common/Button';
import Alert from '../common/Alert';
import { postApi } from '../../services/api/postApi';
import { MessageSquarePlus, HelpCircle, Eye, Edit2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

const PostForm = () => {
  const [text, setText] = useState('');
  const [isQuestion, setIsQuestion] = useState(false);
  const [isPreview, setIsPreview] = useState(false);
  const [error, setError] = useState('');
  const [apiError, setApiError] = useState('');
  const [apiSuccess, setApiSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [codeSnippet, setCodeSnippet] = useState('');
  const [codeLanguage, setCodeLanguage] = useState('javascript');
  const [showCodeSnippet, setShowCodeSnippet] = useState(false);
  const [visibility, setVisibility] = useState('public');
  const navigate = useNavigate();

  const validateForm = () => {
    if (!text.trim()) {
      setError('Nội dung không được để trống.');
      return false;
    }
    setError('');
    return true;
  };

  const handleChange = (e) => {
    setText(e.target.value);
    if (error) setError('');
    if (apiError) setApiError('');
    if (apiSuccess) setApiSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const response = await postApi.createPost(
        text, 
        isQuestion, 
        null, 
        showCodeSnippet ? codeSnippet : '', 
        showCodeSnippet ? codeLanguage : 'javascript',
        visibility
      );
      if (response.success || response.status === 201 || (response.data && response.data.success)) {
        setApiSuccess('Đăng bài thành công!');
        setText('');
        setCodeSnippet('');
        setShowCodeSnippet(false);
        setVisibility('public');
        
        // Chuyển hướng đến trang chi tiết bài viết (nếu cần)
        const newPostId = response.data?._id || (response.data?.data?._id);
        if (newPostId) {
          setTimeout(() => {
            navigate(`/post/${newPostId}`);
          }, 1500);
        }
      }
    } catch (err) {
      console.error('Lỗi khi tạo bài viết:', err);
      // Lấy message lỗi từ response nếu có
      const errorMsg = err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Đã có lỗi xảy ra khi đăng bài.';
      setApiError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-md border border-gray-100 dark:border-gray-800 mb-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-4">
        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center">
          {isQuestion ? (
             <HelpCircle className="w-5 h-5 mr-2 text-indigo-600 dark:text-indigo-400" />
          ) : (
             <MessageSquarePlus className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
          )}
          {isQuestion ? 'Tạo câu hỏi' : 'Tạo bài viết mới'}
        </h3>
        <div className="flex items-center gap-6">
          <label className="flex items-center cursor-pointer">
            <div className="relative">
              <input type="checkbox" className="sr-only" checked={isQuestion} onChange={() => setIsQuestion(!isQuestion)} />
              <div className={`block w-10 h-6 rounded-full transition-colors ${isQuestion ? 'bg-indigo-600 dark:bg-indigo-500' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
              <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${isQuestion ? 'transform translate-x-4' : ''}`}></div>
            </div>
            <div className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300">Đây là một câu hỏi?</div>
          </label>

          <label className="flex items-center cursor-pointer">
            <div className="relative">
              <input type="checkbox" className="sr-only" checked={showCodeSnippet} onChange={() => setShowCodeSnippet(!showCodeSnippet)} />
              <div className={`block w-10 h-6 rounded-full transition-colors ${showCodeSnippet ? 'bg-blue-600 dark:bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
              <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${showCodeSnippet ? 'transform translate-x-4' : ''}`}></div>
            </div>
            <div className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300">Chèn Code Snippet?</div>
          </label>
        </div>
      </div>
      
      {apiSuccess && <Alert type="success" message={apiSuccess} />}
      {apiError && <Alert type="error" message={apiError} />}
      
      <div className="flex space-x-2 mb-2 border-b border-gray-100 dark:border-gray-800 pb-2">
        <button type="button" onClick={() => setIsPreview(false)} className={`px-3 py-1.5 text-sm font-medium rounded-md flex items-center transition-colors ${!isPreview ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
          <Edit2 className="w-4 h-4 mr-1.5" /> Viết
        </button>
        <button type="button" onClick={() => setIsPreview(true)} className={`px-3 py-1.5 text-sm font-medium rounded-md flex items-center transition-colors ${isPreview ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
          <Eye className="w-4 h-4 mr-1.5" /> Xem trước
        </button>
      </div>

      <form onSubmit={handleSubmit} className="mt-2">
        {!isPreview ? (
          <>
            <Textarea
              placeholder={isQuestion ? "Bạn đang gặp vấn đề gì? Hãy miêu tả chi tiết, bạn có thể dùng Markdown để format code..." : "Bạn đang nghĩ gì? Có thể dùng Markdown..."}
              value={text}
              onChange={handleChange}
              error={error}
              rows={5}
            />

            {showCodeSnippet && (
              <div className="mt-3 p-4 border border-blue-100 dark:border-blue-900/50 rounded-xl bg-slate-50 dark:bg-gray-800/50">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Mã nguồn (Code Snippet)</span>
                  <select
                    value={codeLanguage}
                    onChange={(e) => setCodeLanguage(e.target.value)}
                    className="text-xs px-2 py-1.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400 font-medium"
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
                  placeholder="Dán hoặc viết mã code của bạn ở đây..."
                  rows={6}
                  className="w-full font-mono text-xs px-3 py-2 bg-slate-900 text-slate-100 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-y"
                />
              </div>
            )}
          </>
        ) : (
          <div className="p-4 border dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-800 min-h-[136px] max-w-none text-sm text-slate-800 dark:text-slate-200 prose prose-slate dark:prose-invert prose-sm prose-p:my-1 prose-pre:my-2 prose-headings:my-2 prose-ul:my-1 prose-ol:my-1">
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
              <div className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-4">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1">Mã nguồn ({codeLanguage}):</span>
                <SyntaxHighlighter
                  children={codeSnippet}
                  style={vscDarkPlus}
                  language={codeLanguage}
                  PreTag="div"
                  className="rounded-md my-2 text-xs"
                />
              </div>
            )}
          </div>
        )}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mt-4 gap-4">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Quyền riêng tư:</span>
            <select
              value={visibility}
              onChange={(e) => setVisibility(e.target.value)}
              className="text-sm px-3 py-1.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
            >
              <option value="public">🌐 Công khai</option>
              <option value="personal">🔒 Chỉ mình tôi</option>
              <option value="followers">👥 Người theo dõi</option>
              <option value="friends">🤝 Bạn bè (Theo dõi chéo)</option>
            </select>
          </div>
          <Button type="submit" isLoading={isLoading} className={isQuestion ? 'bg-indigo-600 hover:bg-indigo-700 w-full sm:w-auto px-6' : 'w-full sm:w-auto px-6'}>
            {isQuestion ? 'Đăng câu hỏi' : 'Đăng bài'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default PostForm;
