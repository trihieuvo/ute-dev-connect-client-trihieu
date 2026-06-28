import React from 'react';

const Avatar = ({ src, alt, className = "h-11 w-11", referrerPolicy = "no-referrer" }) => {
  const defaultAvatar = 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y';
  
  return (
    <img
      src={src || defaultAvatar}
      alt={alt || "Avatar"}
      className={`rounded-full object-cover ${className}`}
      referrerPolicy={referrerPolicy}
      onError={(e) => { 
        e.target.onerror = null; 
        e.target.src = defaultAvatar; 
      }}
    />
  );
};

export default Avatar;
