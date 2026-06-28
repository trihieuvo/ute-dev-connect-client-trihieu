const fs = require('fs');
const path = './src/pages/chat/Chat.jsx';
let content = fs.readFileSync(path, 'utf8');

// Add import
if (!content.includes('import Avatar')) {
  content = content.replace(
    "import axiosClient from '../../services/api/axiosClient';",
    "import axiosClient from '../../services/api/axiosClient';\nimport Avatar from '../../components/common/Avatar';"
  );
}

// Regex to replace avatar img tag. We look for `<img src={... || 'gravatar_url'} ... onError={...} />`
// Since properties can vary, we will use a more generic match.

const imgRegex = /<img\s+src=\{([^|}]+?)(?:\s*\|\|\s*'https:\/\/www\.gravatar\.com[^']+')?\}\s+alt="([^"]+)"\s+className="([^"]+)"\s+(?:onError=\{[^}]+\}\s+)?\/>/g;

content = content.replace(imgRegex, (match, srcObj, altTxt, clsName) => {
    // If it has gravatar stuff inside the match or if it's generally an avatar image
    return `<Avatar \n                          src={${srcObj.trim()}} \n                          alt="${altTxt}" \n                          className="${clsName}" \n                        />`;
});

// Since the regex might not perfectly match if whitespace differs:
// Let's also do a second pass if we missed some.
const imgRegex2 = /<img\s*\n\s*src=\{([^|}]+?)(?:\s*\|\|\s*'https:\/\/www\.gravatar\.com[^']+')?\}\s*\n\s*alt="([^"]+)"\s*\n\s*className="([^"]+)"\s*\n\s*onError=\{[^}]+\}\s*\n\s*\/>/g;

content = content.replace(imgRegex2, (match, srcObj, altTxt, clsName) => {
    return `<Avatar \n                          src={${srcObj.trim()}} \n                          alt="${altTxt}" \n                          className="${clsName}" \n                        />`;
});

fs.writeFileSync(path, content);
console.log("Done");
