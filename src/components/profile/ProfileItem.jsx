import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, MapPin, Briefcase, Users, Star, ArrowUpRight } from 'lucide-react';
import Avatar from '../common/Avatar';
import ReputationBadge from '../common/ReputationBadge';
import RankBadge from '../common/RankBadge';

const ProfileItem = ({ profile }) => {
  const { user, status, company, location, skills } = profile;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-150 dark:border-gray-800 p-6 flex flex-col md:flex-row items-center gap-6 hover:shadow-md hover:border-gray-200 dark:hover:border-gray-700 transition-all duration-300 group">
      
      {/* Avatar Wrapper */}
      <div className="flex-shrink-0">
        <div className="h-24 w-24 rounded-full bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 flex items-center justify-center overflow-hidden ring-4 ring-slate-100 dark:ring-gray-800 group-hover:ring-blue-100/80 dark:group-hover:ring-blue-900/50 transition-all duration-300 shadow-inner">
          <Avatar 
            src={user?.avatar} 
            alt={user?.name} 
            className="w-24 h-24 transition-transform duration-500 group-hover:scale-105"
          />
        </div>
      </div>
      
      {/* Profile Details */}
      <div className="flex-grow text-center md:text-left">
        <div className="flex items-center justify-center md:justify-start gap-2 flex-wrap mb-1.5">
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {user?.name || 'Người dùng ẩn danh'}
          </h3>
          <ReputationBadge score={user?.reputation} className="px-2 py-0.5 text-[10px] shadow-3xs gap-0.5" />
          <RankBadge score={user?.reputation} className="text-[9px] px-2 py-0.5 border font-bold rounded-full" />
        </div>

        <p className="text-xs text-gray-650 dark:text-gray-400 flex items-center justify-center md:justify-start gap-1.5 mb-2">
          <Briefcase size={14} className="text-gray-400" />
          <span className="font-semibold text-gray-700 dark:text-gray-300">{status}</span> 
          {company && <span className="text-gray-500 dark:text-gray-400">tại <span className="text-gray-700 dark:text-gray-300 font-medium">{company}</span></span>}
        </p>
        
        {location && (
          <p className="text-gray-500 dark:text-gray-400 flex items-center justify-center md:justify-start gap-1.5 text-xs mb-2">
            <MapPin size={14} className="text-red-400" />
            <span>{location}</span>
          </p>
        )}

        <div className="flex items-center justify-center md:justify-start gap-4 mb-4 text-xs">
          <span className="text-gray-600 dark:text-gray-400 flex items-center gap-1">
            <Users size={14} className="text-blue-500" />
            <span className="font-bold text-gray-800 dark:text-gray-200">{user?.followers?.length || 0}</span> người theo dõi
          </span>
          <span className="text-gray-600 dark:text-gray-400">
            <span className="font-bold text-gray-800 dark:text-gray-200">{user?.following?.length || 0}</span> đang theo dõi
          </span>
        </div>
        
        <Link 
          to={`/profile/${user?._id}`}
          className="inline-flex items-center gap-1 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all duration-200 shadow-sm shadow-blue-500/10 hover:shadow-md hover:shadow-blue-500/20 active:scale-95"
        >
          <span>Xem hồ sơ</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Divider */}
      <div className="hidden md:block w-px h-24 bg-gray-100 dark:bg-gray-800"></div>

      {/* Skills Grid */}
      <div className="flex-shrink-0 md:w-1/3 w-full">
        <h4 className="text-[10px] font-bold text-gray-400 dark:text-gray-500 mb-3 uppercase tracking-wider text-center md:text-left">Kỹ năng nổi bật</h4>
        <div className="flex flex-wrap gap-1.5 justify-center md:justify-start">
          {skills && skills.length > 0 ? (
            skills.slice(0, 5).map((skill, index) => (
              <span 
                key={index} 
                className="px-2.5 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-semibold rounded-full flex items-center gap-1 border border-blue-100 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
              >
                <CheckCircle size={12} className="text-blue-500" />
                {skill}
              </span>
            ))
          ) : (
            <span className="text-xs text-gray-400 dark:text-gray-500 italic">Chưa cập nhật kỹ năng...</span>
          )}
          {skills && skills.length > 5 && (
            <span className="px-2.5 py-1 bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-xs font-semibold rounded-full border border-gray-200 dark:border-gray-700">
              +{skills.length - 5}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileItem;
