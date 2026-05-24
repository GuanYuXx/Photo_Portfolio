// =========================================
// LENS — Data Layer (Serverless Git CMS & Cloudinary)
// =========================================

const DATA_KEY = 'lens_portfolio_data';

// Admin Credentials keys in localStorage
const CONF_GITHUB_TOKEN = 'lens_github_token';
const CONF_GITHUB_REPO = 'lens_github_repo';
const CONF_CLOUDINARY_NAME = 'lens_cloudinary_name';
const CONF_CLOUDINARY_PRESET = 'lens_cloudinary_preset';
const CONF_SANDBOX_MODE = 'lens_sandbox_mode';

const DEFAULT_DATA = {
  heroText: '用鏡頭捕捉每一個轉瞬即逝的瞬間',
  albums: [
    {
      id: 'album_001',
      title: '街頭呼吸',
      subtitle: '城市的喧囂與靜謐',
      cover: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800&q=80',
      tags: ['街拍', '城市', '黑白'],
      layout: 'masonry',
      createdAt: '2024-01-15',
      photos: [
        {
          id: 'p001',
          url: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=1200&q=80',
          title: '霧中的城市',
          caption: '清晨的霧氣籠罩整個城市，街燈漸漸熄滅',
          ratio: 'landscape'
        },
        {
          id: 'p002',
          url: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=1200&q=80',
          title: '捷運出口',
          caption: '忙碌的通勤者',
          ratio: 'portrait'
        },
        {
          id: 'p003',
          url: 'https://images.unsplash.com/photo-1534430480872-3498386e7856?w=1200&q=80',
          title: '老街巷弄',
          caption: '',
          ratio: 'auto'
        },
        {
          id: 'p004',
          url: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=1200&q=80',
          title: '夜市燈火',
          caption: '台灣夜市特有的溫暖光芒',
          ratio: 'landscape'
        },
        {
          id: 'p005',
          url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&q=80',
          title: '天橋',
          caption: '',
          ratio: 'square'
        },
        {
          id: 'p006',
          url: 'https://images.unsplash.com/photo-1480796927426-f609979314bd?w=1200&q=80',
          title: '雨後',
          caption: '雨後的街道倒映著霓虹',
          ratio: 'portrait'
        }
      ]
    },
    {
      id: 'album_002',
      title: '山與海之間',
      subtitle: '台灣島嶼的自然風貌',
      cover: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80',
      tags: ['風景', '自然', '台灣'],
      layout: 'fullwidth',
      createdAt: '2024-03-20',
      photos: [
        {
          id: 'p101',
          url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1400&q=80',
          title: '合歡山雲海',
          caption: '破曉時分，雲海從山谷升起',
          ratio: 'wide'
        },
        {
          id: 'p102',
          url: 'https://images.unsplash.com/photo-1439405326854-014607f694d7?w=1400&q=80',
          title: '太平洋的邊界',
          caption: '',
          ratio: 'wide'
        },
        {
          id: 'p103',
          url: 'https://images.unsplash.com/photo-1433086966358-54859d0ed716?w=1400&q=80',
          title: '瀑布之聲',
          caption: '深山中的秘境瀑布',
          ratio: 'portrait'
        }
      ]
    },
    {
      id: 'album_003',
      title: '人物肖像',
      subtitle: 'Portraits of Life',
      cover: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=800&q=80',
      tags: ['人像', '肖像', '光影'],
      layout: 'grid',
      createdAt: '2024-05-10',
      photos: [
        {
          id: 'p201',
          url: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=1200&q=80',
          title: '光之窗',
          caption: '午後窗邊的逆光',
          ratio: 'portrait'
        },
        {
          id: 'p202',
          url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1200&q=80',
          title: '眼神',
          caption: '',
          ratio: 'portrait'
        },
        {
          id: 'p203',
          url: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=1200&q=80',
          title: '思緒',
          caption: '安靜的片刻',
          ratio: 'portrait'
        }
      ]
    }
  ]
};

// Global in-memory active data
let activeData = null;

// ---- Async Initializer ----
async function initPortfolio() {
  if (activeData) return activeData;

  // 1. If Admin, try loading from localStorage staging first
  if (isAdmin()) {
    try {
      const raw = localStorage.getItem(DATA_KEY);
      if (raw) {
        activeData = JSON.parse(raw);
        return activeData;
      }
    } catch (e) {
      console.error('Load staging data failed:', e);
    }
  }

  // 2. Fetch data.json from the server
  try {
    const res = await fetch('data.json');
    if (res.ok) {
      activeData = await res.json();
      if (isAdmin()) {
        localStorage.setItem(DATA_KEY, JSON.stringify(activeData));
      }
      return activeData;
    }
  } catch (e) {
    console.error('Fetch data.json failed, falling back to local defaults.', e);
  }

  // 3. Fallback to default mock data
  activeData = JSON.parse(JSON.stringify(DEFAULT_DATA));
  return activeData;
}

// ---- Admin Config Utilities ----
function isAdmin() {
  if (localStorage.getItem(CONF_SANDBOX_MODE) === 'true') return true;
  const token = localStorage.getItem(CONF_GITHUB_TOKEN);
  const repo = localStorage.getItem(CONF_GITHUB_REPO);
  return !!(token && repo);
}

function isSandbox() {
  return localStorage.getItem(CONF_SANDBOX_MODE) === 'true';
}

function getAdminConfig() {
  return {
    token: localStorage.getItem(CONF_GITHUB_TOKEN) || '',
    repo: localStorage.getItem(CONF_GITHUB_REPO) || '',
    cloudName: localStorage.getItem(CONF_CLOUDINARY_NAME) || '',
    preset: localStorage.getItem(CONF_CLOUDINARY_PRESET) || '',
    sandbox: isSandbox()
  };
}

function saveAdminConfig(config) {
  if (config.token) localStorage.setItem(CONF_GITHUB_TOKEN, config.token.trim());
  if (config.repo) localStorage.setItem(CONF_GITHUB_REPO, config.repo.trim());
  if (config.cloudName) localStorage.setItem(CONF_CLOUDINARY_NAME, config.cloudName.trim());
  if (config.preset) localStorage.setItem(CONF_CLOUDINARY_PRESET, config.preset.trim());
  if (config.sandbox !== undefined) {
    localStorage.setItem(CONF_SANDBOX_MODE, config.sandbox ? 'true' : 'false');
  }
  return true;
}

function clearAdminConfig() {
  localStorage.removeItem(CONF_GITHUB_TOKEN);
  localStorage.removeItem(CONF_GITHUB_REPO);
  localStorage.removeItem(CONF_CLOUDINARY_NAME);
  localStorage.removeItem(CONF_CLOUDINARY_PRESET);
  localStorage.removeItem(CONF_SANDBOX_MODE);
  localStorage.removeItem(DATA_KEY); // also clear staging
  activeData = null;
}

// ---- Cloudinary Dynamic URL Optimizer ----
function optimizeImageUrl(url, width = 1200) {
  if (!url) return '';
  // Check if it is a Cloudinary URL
  if (url.includes('res.cloudinary.com') && url.includes('/image/upload/')) {
    // Dynamic transformation injection: Auto quality (q_auto), Auto format (f_auto), target width (w_xxx)
    const transformStr = `/image/upload/q_auto,f_auto,w_${width}/`;
    return url.replace('/image/upload/', transformStr);
  }
  return url;
}

// ---- GitHub API Commits Integration ----
async function commitDataToGitHub() {
  if (!isAdmin()) {
    throw new Error('未登入或未設定管理員金鑰！');
  }

  // If in local sandbox mode, simply write to localStorage and complete!
  if (isSandbox()) {
    localStorage.setItem(DATA_KEY, JSON.stringify(activeData));
    return true;
  }

  const { token, repo } = getAdminConfig();
  const filePath = 'data.json';
  const url = `https://api.github.com/repos/${repo}/contents/${filePath}`;
  
  // Format the updated portfolio data as JSON string
  const jsonContent = JSON.stringify(activeData, null, 2);

  // Safely Base64 encode for Unicode/Traditional Chinese support
  function safeBtoa(str) {
    return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, function(match, p1) {
      return String.fromCharCode('0x' + p1);
    }));
  }
  
  const base64Content = safeBtoa(jsonContent);

  // 1. Get the current file's SHA (required by GitHub API to update files)
  let sha = '';
  try {
    const getRes = await fetch(url, {
      headers: {
        'Authorization': `token ${token}`,
        'Cache-Control': 'no-cache'
      }
    });
    if (getRes.ok) {
      const getJson = await getRes.json();
      sha = getJson.sha;
    }
  } catch (e) {
    console.warn('Could not retrieve SHA, trying to write as new file:', e);
  }

  // 2. Perform the PUT request to commit changes
  const body = {
    message: 'Update portfolio data via LENS CMS',
    content: base64Content
  };
  if (sha) {
    body.sha = sha;
  }

  const putRes = await fetch(url, {
    method: 'PUT',
    headers: {
      'Authorization': `token ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (!putRes.ok) {
    const errorJson = await putRes.json().catch(() => ({}));
    throw new Error(errorJson.message || `GitHub 提交失敗 (HTTP ${putRes.status})`);
  }

  // Save successful update back to localStorage staging
  localStorage.setItem(DATA_KEY, jsonContent);
  return true;
}

// ---- Helper to validate credentials ----
async function testGitHubConnection(token, repo) {
  const url = `https://api.github.com/repos/${repo}`;
  try {
    const res = await fetch(url, {
      headers: {
        'Authorization': `token ${token}`
      }
    });
    if (res.ok) {
      const data = await res.json();
      return { success: true, name: data.full_name };
    }
    const err = await res.json().catch(() => ({}));
    return { success: false, message: err.message || `HTTP 錯誤 ${res.status}` };
  } catch (e) {
    return { success: false, message: e.message || '網路連線失敗' };
  }
}

// ---- Data getters (synchronized, relies on activeData) ----
function loadData() {
  return activeData || DEFAULT_DATA;
}

function saveData(data) {
  activeData = data;
  if (isAdmin()) {
    try {
      localStorage.setItem(DATA_KEY, JSON.stringify(data));
      return true;
    } catch (e) {
      console.error('Save to local storage failed:', e);
    }
  }
  return true;
}

// ---- Albums CRUD ----
function getAlbums() {
  return loadData().albums || [];
}

function getAlbum(id) {
  const data = loadData();
  return data.albums.find(a => a.id === id) || null;
}

// ... rest of albums CRUD remains unmodified
function createAlbumData(title, subtitle, cover, tags) {
  const data = loadData();
  const album = {
    id: 'album_' + Date.now(),
    title,
    subtitle,
    cover: cover || 'https://images.unsplash.com/photo-1510784722466-f2aa240d4703?w=800&q=80',
    tags: tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : [],
    layout: 'masonry',
    createdAt: new Date().toISOString().split('T')[0],
    photos: []
  };
  data.albums.push(album);
  saveData(data);
  return album;
}

function updateAlbum(id, updates) {
  const data = loadData();
  const idx = data.albums.findIndex(a => a.id === id);
  if (idx === -1) return false;
  data.albums[idx] = { ...data.albums[idx], ...updates };
  return saveData(data);
}

function deleteAlbumData(id) {
  const data = loadData();
  data.albums = data.albums.filter(a => a.id !== id);
  return saveData(data);
}

function reorderAlbums(newOrder) {
  const data = loadData();
  data.albums = newOrder;
  return saveData(data);
}

// ---- Photos CRUD ----
function addPhotoToAlbum(albumId, photo) {
  const data = loadData();
  const album = data.albums.find(a => a.id === albumId);
  if (!album) return false;
  
  // Create a unique ID with timestamp and random suffix to prevent collisions on batch uploads
  const uniqueId = 'p_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
  
  album.photos.push({
    id: uniqueId,
    url: photo.url,
    title: photo.title || '',
    caption: photo.caption || '',
    ratio: photo.ratio || 'auto',
    section: photo.section || ''
  });
  return saveData(data);
}

function updatePhoto(albumId, photoId, updates) {
  const data = loadData();
  const album = data.albums.find(a => a.id === albumId);
  if (!album) return false;
  const idx = album.photos.findIndex(p => p.id === photoId);
  if (idx === -1) return false;
  album.photos[idx] = { ...album.photos[idx], ...updates };
  return saveData(data);
}

function deletePhoto(albumId, photoId) {
  const data = loadData();
  const album = data.albums.find(a => a.id === albumId);
  if (!album) return false;
  album.photos = album.photos.filter(p => p.id !== photoId);
  return saveData(data);
}

function reorderPhotos(albumId, newPhotos) {
  const data = loadData();
  const album = data.albums.find(a => a.id === albumId);
  if (!album) return false;
  album.photos = newPhotos;
  return saveData(data);
}

// ---- Hero text ----
function getHeroText() {
  return loadData().heroText || '用鏡頭捕捉每一個轉瞬即逝的瞬間';
}

function saveHeroTextData(text) {
  const data = loadData();
  data.heroText = text;
  return saveData(data);
}

// ---- Profile metadata ----
function getProfileData() {
  const d = loadData();
  return {
    name: d.profileName || '陳冠宇',
    instagram: d.profileInstagram || 'stand_of_fish_121',
    email: d.profileEmail || 'a0973471825@gmail.com'
  };
}

function saveProfileData(name, instagram, email) {
  const data = loadData();
  data.profileName = name;
  data.profileInstagram = instagram;
  data.profileEmail = email;
  return saveData(data);
}

// ---- Utils ----
function showToast(msg, duration = 2500) {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), duration);
}
