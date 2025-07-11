export const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const formatDate = (date) => {
    return new Date(date).toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

export const getFileIcon = (mimeType) => {
    if (!mimeType) return '📄';
    
    if (mimeType.startsWith('image/')) return '🖼️';
    if (mimeType.startsWith('video/')) return '🎥';
    if (mimeType.startsWith('audio/')) return '🎵';
    if (mimeType.includes('pdf')) return '📕';
    if (mimeType.includes('document') || mimeType.includes('word')) return '📝';
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return '📊';
    if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return '📋';
    if (mimeType.includes('zip') || mimeType.includes('archive')) return '📦';
    if (mimeType.includes('text/')) return '📃';
    
    return '📄';
};

export const getFolderIcon = () => '📁';

export const truncateString = (str, maxLength = 50) => {
    if (str.length <= maxLength) return str;
    return str.substring(0, maxLength - 3) + '...';
};

export const createBreadcrumb = (path) => {
    if (!path || path === '/') return '🏠 Home';
    
    const parts = path.split('/').filter(Boolean);
    const breadcrumbs = ['🏠 Home'];
    
    parts.forEach(part => {
        breadcrumbs.push(`📁 ${part}`);
    });
    
    return breadcrumbs.join(' > ');
};

export const getRandomCuteResponse = () => {
    const responses = [
        'Hihi! 😊',
        'Được rồi nè! 💖',
        'Để em làm cho chị/anh nha! 🤗',
        'Okii! 🎉',
        'Yeyyy! ✨',
        'Hihi, em sẽ giúp ngay! 😊',
        'Tất nhiên rồi! 💫',
        'Để em xử lý nhé! 🥰'
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
};

export const getRandomErrorResponse = () => {
    const responses = [
        'Huhu, có lỗi rồi! 😅',
        'Oops! Em gặp chút vấn đề! 😳',
        'Ai ya! Có gì đó không đúng! 🤔',
        'Hmmm, có vẻ có lỗi! 😵',
        'Oops! Em cần thử lại! 😊',
        'Huhu, em không thể làm được! 😢'
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
};
