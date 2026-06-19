// =========================================
// LENS — Main Page (index.html)
// =========================================

let isEditMode = false;
let dragSrcIndex = null;

// ---- Async Init ----
document.addEventListener('DOMContentLoaded', () => {
  // Load portfolio data first, then initialize the UI
  initPortfolio()
    .then(() => {
      document.getElementById('heroDesc').textContent = getHeroText();
      
      // Load and apply profile metadata
      const profile = getProfileData();
      document.getElementById('profileName').textContent = profile.name;
      document.getElementById('profileInstagram').textContent = profile.instagram;
      document.getElementById('profileInstagramLink').href = `https://instagram.com/${profile.instagram}`;
      document.getElementById('profileCopyName').textContent = profile.name;
      document.getElementById('profileEmailLink').textContent = profile.email;
      document.getElementById('profileEmailLink').href = `mailto:${profile.email}`;
      
      // Setup edit button visibility based on admin authentication
      const editBtn = document.getElementById('editToggleBtn');
      if (isAdmin()) {
        editBtn.style.display = 'flex';
        // If in sandbox, show special indicator
        updateEditToolbarLabel();
      } else {
        editBtn.style.display = 'none';
      }

      renderAlbums();
      setupNavScroll();
    })
    .catch(err => {
      console.error('初始化失敗:', err);
      showToast('⚠️ 資料載入失敗，將使用預設資料');
    });
});

function updateEditToolbarLabel() {
  const label = document.getElementById('editToolbarLabel');
  if (label) {
    label.textContent = isSandbox() ? '✦ 編輯模式 (本地測試)' : '✦ 編輯模式';
    label.style.color = isSandbox() ? '#c8a96e' : '';
  }
}

// ---- Render Albums ----
function renderAlbums() {
  const grid = document.getElementById('albumsGrid');
  const empty = document.getElementById('emptyState');
  const albums = getAlbums();

  grid.innerHTML = '';

  if (!albums.length) {
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';

  albums.forEach((album, i) => {
    const card = createAlbumCard(album, i);
    grid.appendChild(card);
  });
}

function createAlbumCard(album, index) {
  const card = document.createElement('div');
  card.className = 'album-card';
  card.dataset.id = album.id;
  card.dataset.index = index;

  // Use dynamic Cloudinary optimizer for the cover image
  const coverUrl = optimizeImageUrl(album.cover, 800);

  card.innerHTML = `
    <img class="album-card-img" src="${coverUrl}" alt="${album.title}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1510784722466-f2aa240d4703?w=800&q=60'">
    <div class="album-card-overlay">
      <div class="album-card-tags">
        ${(album.tags || []).map(t => `<span class="tag">${t}</span>`).join('')}
      </div>
      <h3 class="album-card-title">${album.title}</h3>
      <p class="album-card-sub">${album.subtitle || ''}</p>
    </div>
    <span class="album-card-count">${album.photos ? album.photos.length : 0} 張</span>
    <div class="album-card-controls">
      <button class="album-ctrl-btn del" title="刪除" onclick="event.stopPropagation(); confirmDeleteAlbum('${album.id}')">✕</button>
    </div>
  `;

  // Navigate to album (only when NOT edit mode, and not clicking control buttons)
  card.addEventListener('click', (e) => {
    if (isEditMode && !e.target.closest('.album-ctrl-btn')) return;
    if (!isEditMode) {
      localStorage.setItem('lens_current_album_id', album.id);
      window.location.href = `album.html?id=${album.id}`;
    }
  });

  // Drag & drop (edit mode)
  card.draggable = true;
  card.addEventListener('dragstart', onDragStart);
  card.addEventListener('dragover', onDragOver);
  card.addEventListener('drop', onDrop);
  card.addEventListener('dragend', onDragEnd);

  return card;
}

// ---- Drag & Drop ----
function onDragStart(e) {
  if (!isEditMode) { e.preventDefault(); return; }
  dragSrcIndex = parseInt(this.dataset.index);
  this.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
}

function onDragOver(e) {
  if (!isEditMode) return;
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  document.querySelectorAll('.album-card').forEach(c => c.classList.remove('drag-over'));
  this.classList.add('drag-over');
}

function onDrop(e) {
  e.preventDefault();
  if (!isEditMode || dragSrcIndex === null) return;
  const targetIndex = parseInt(this.dataset.index);
  if (dragSrcIndex === targetIndex) return;

  const albums = getAlbums();
  const moved = albums.splice(dragSrcIndex, 1)[0];
  albums.splice(targetIndex, 0, moved);
  reorderAlbums(albums);
  renderAlbums();
  dragSrcIndex = null;
}

function onDragEnd() {
  document.querySelectorAll('.album-card').forEach(c => {
    c.classList.remove('dragging', 'drag-over');
  });
}

// ---- Edit Mode ----
function toggleEditMode() {
  isEditMode = !isEditMode;
  const btn = document.getElementById('editToggleBtn');
  const txt = document.getElementById('editBtnText');
  const toolbar = document.getElementById('editToolbar');

  btn.classList.toggle('active', isEditMode);
  txt.textContent = isEditMode ? '完成' : '編輯';
  toolbar.classList.toggle('visible', isEditMode);
  document.body.classList.toggle('edit-mode', isEditMode);
  
  updateEditToolbarLabel();
}

// ---- New Album Modal ----
function openNewAlbumModal() {
  openModal('newAlbumModal');
}

function createAlbum() {
  const title = document.getElementById('newAlbumTitle').value.trim();
  if (!title) { alert('請輸入作品集名稱'); return; }

  const sub = document.getElementById('newAlbumSub').value.trim();
  const tags = document.getElementById('newAlbumTags').value.trim();

  createAlbumData(title, sub, '', tags);
  closeModal('newAlbumModal');
  renderAlbums();
  showToast('✓ 作品集已建立');

  // Clear fields
  ['newAlbumTitle','newAlbumSub','newAlbumTags'].forEach(id => {
    document.getElementById(id).value = '';
  });
}

// ---- Delete Album ----
function confirmDeleteAlbum(id) {
  if (!confirm('確定要刪除這個作品集嗎？（照片也會一起刪除）')) return;
  deleteAlbumData(id);
  renderAlbums();
  showToast('作品集已刪除');
}

// ---- Hero & Profile Info ----
function editHeroText() {
  const profile = getProfileData();
  document.getElementById('profileNameInput').value = profile.name;
  document.getElementById('profileInstagramInput').value = profile.instagram;
  document.getElementById('profileEmailInput').value = profile.email;
  document.getElementById('heroInput').value = getHeroText();
  openModal('heroModal');
}

function saveHeroText() {
  const name = document.getElementById('profileNameInput').value.trim();
  const instagram = document.getElementById('profileInstagramInput').value.trim();
  const email = document.getElementById('profileEmailInput').value.trim();
  const text = document.getElementById('heroInput').value.trim();
  
  if (!name) { alert('請輸入您的個人姓名'); return; }
  if (!instagram) { alert('請輸入您的 Instagram 帳號'); return; }
  if (!email) { alert('請輸入您的聯絡電子郵件'); return; }
  if (!text) { alert('請輸入首頁標語文字'); return; }

  // Save to database
  saveProfileData(name, instagram, email);
  saveHeroTextData(text);

  // Update DOM elements instantly
  document.getElementById('profileName').textContent = name;
  document.getElementById('profileInstagram').textContent = instagram;
  document.getElementById('profileInstagramLink').href = `https://instagram.com/${instagram}`;
  document.getElementById('profileCopyName').textContent = name;
  document.getElementById('profileEmailLink').textContent = email;
  document.getElementById('profileEmailLink').href = `mailto:${email}`;
  document.getElementById('heroDesc').textContent = text;

  closeModal('heroModal');
  showToast('✓ 首頁資訊與標語已更新');
}

// ---- Serverless Save Integration ----
async function saveAll() {
  const btn = document.getElementById('btnSaveAll');
  const originalHtml = btn.innerHTML;
  
  btn.disabled = true;
  btn.innerHTML = `<span class="spinner"></span> 同步中...`;

  try {
    await commitDataToGitHub();
    if (isSandbox()) {
      showToast('✓ 本地儲存成功（測試模式）！');
    } else {
      showToast('✓ 儲存並同步至 GitHub 成功！');
    }
    btn.innerHTML = `✓ 已儲存`;
    setTimeout(() => {
      btn.innerHTML = originalHtml;
      btn.disabled = false;
    }, 2000);
  } catch (err) {
    console.error('儲存失敗:', err);
    alert(`儲存並同步失敗！原因: ${err.message}\n請檢查管理員設定與網路連線。`);
    btn.innerHTML = `⚠️ 儲存失敗`;
    setTimeout(() => {
      btn.innerHTML = originalHtml;
      btn.disabled = false;
    }, 3000);
  }
}

// ============================================================
// ADMIN MODAL & CREDENTIALS CONTROLLERS
// ============================================================
function openAdminModal() {
  const config = getAdminConfig();
  document.getElementById('adminGithubRepo').value = config.repo;
  document.getElementById('adminGithubToken').value = config.token;
  document.getElementById('adminCloudinaryName').value = config.cloudName;
  document.getElementById('adminCloudinaryPreset').value = config.preset;

  const sandboxBanner = document.getElementById('sandboxBanner');
  if (isSandbox()) {
    sandboxBanner.style.display = 'block';
  } else {
    sandboxBanner.style.display = 'none';
  }

  const logoutBtn = document.getElementById('btnLogout');
  if (isAdmin()) {
    logoutBtn.style.display = 'inline-block';
  } else {
    logoutBtn.style.display = 'none';
  }

  document.getElementById('connectionStatus').innerHTML = '';
  openModal('adminSettingsModal');
}

function switchAdminTab(tabName) {
  const isCred = tabName === 'credentials';
  document.getElementById('tabBtnCredentials').classList.toggle('active', isCred);
  document.getElementById('tabBtnInstructions').classList.toggle('active', !isCred);
  document.getElementById('tabContentCredentials').style.display = isCred ? 'block' : 'none';
  document.getElementById('tabContentInstructions').style.display = isCred ? 'none' : 'block';
}

function togglePasswordVisibility(id) {
  const input = document.getElementById(id);
  input.type = input.type === 'password' ? 'text' : 'password';
}

async function testConnection() {
  const token = document.getElementById('adminGithubToken').value.trim();
  const repo = document.getElementById('adminGithubRepo').value.trim();
  const statusDiv = document.getElementById('connectionStatus');
  const btn = document.getElementById('btnTestConnection');

  if (!token || !repo) {
    statusDiv.className = 'connection-status error';
    statusDiv.textContent = '請填寫 GitHub 儲存庫與 Token 以便測試！';
    return;
  }

  btn.disabled = true;
  btn.textContent = '連線測試中...';
  statusDiv.className = 'connection-status';
  statusDiv.innerHTML = '<span class="spinner"></span> 正在連接 GitHub API...';

  const result = await testGitHubConnection(token, repo);

  btn.disabled = false;
  btn.textContent = '測試連線';

  if (result.success) {
    statusDiv.className = 'connection-status success';
    statusDiv.textContent = `✓ 連線成功！已成功存取儲存庫：${result.name}`;
  } else {
    statusDiv.className = 'connection-status error';
    statusDiv.textContent = `❌ 連線失敗: ${result.message}`;
  }
}

function saveAdminSettings() {
  const repo = document.getElementById('adminGithubRepo').value.trim();
  const token = document.getElementById('adminGithubToken').value.trim();
  const cloudName = document.getElementById('adminCloudinaryName').value.trim();
  const preset = document.getElementById('adminCloudinaryPreset').value.trim();

  saveAdminConfig({ token, repo, cloudName, preset, sandbox: false });
  
  // Show edit toggle btn
  document.getElementById('editToggleBtn').style.display = 'flex';
  
  closeModal('adminSettingsModal');
  showToast('✓ 管理員設定已儲存！');
  
  // Reload portfolio data to align staging
  initPortfolio().then(() => {
    renderAlbums();
  });
}

function enableSandboxMode() {
  saveAdminConfig({ sandbox: true });
  
  // Show edit toggle btn
  document.getElementById('editToggleBtn').style.display = 'flex';
  updateEditToolbarLabel();

  closeModal('adminSettingsModal');
  showToast('✓ 已啟用本地測試模式！可任意編輯。');

  initPortfolio().then(() => {
    renderAlbums();
  });
}

function logoutAdmin() {
  if (!confirm('確定要登出並清除本機的管理密鑰設定嗎？')) return;
  clearAdminConfig();
  
  // Hide edit toggle btn & exit edit mode if active
  document.getElementById('editToggleBtn').style.display = 'none';
  if (isEditMode) toggleEditMode();

  closeModal('adminSettingsModal');
  showToast('已登出管理員模式');
  
  // Force reload site data
  location.reload();
}

// ---- Modal Helpers ----
function openModal(id) {
  document.getElementById(id).classList.add('open');
}

// ... rest of code remains unmodified
function closeModal(id) {
  document.getElementById(id).classList.remove('open');
}

// Close modal on overlay click
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.classList.remove('open');
  }
});

// ---- Nav scroll effect ----
// 只負責 toggle class；顏色完全由 CSS 主題 token 決定（不再寫死 rgba）。
function setupNavScroll() {
  const nav = document.getElementById('nav');
  if (!nav) return;
  const update = () => nav.classList.toggle('nav-scrolled', window.scrollY > 60);
  window.addEventListener('scroll', update, { passive: true });
  update(); // 初始化（重整時若已捲動位置 > 60 也能正確套用）
}

// Keyboard ESC to close
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-overlay.open').forEach(m => m.classList.remove('open'));
  }
});
