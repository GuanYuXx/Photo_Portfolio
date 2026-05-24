// =========================================
// LENS — Album Page (album.html)
// =========================================

let isEditMode = false;
let currentAlbumId = null;
let currentAlbum = null;
let lightboxIndex = 0;
let dragSrcIndex = null;
let editingPhotoId = null;

let pendingFiles = []; // [{file, previewUrl}]
let pendingCoverFile = null; // {file, previewUrl}

// Local image compression helper to prevent localStorage 5MB quota errors in Sandbox Mode
function compressImage(file, maxWidth = 1000, quality = 0.6) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => resolve(e.target.result); // fallback to original base64
      img.src = e.target.result;
    };
    reader.onerror = () => resolve('');
    reader.readAsDataURL(file);
  });
}

// ---- Async Init ----
document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  // 優先使用網址參數，若因伺服器 Clean URL 跳轉導致參數丟失，則使用本地快取備份 ID 作為防禦機制
  currentAlbumId = params.get('id') || localStorage.getItem('lens_current_album_id');
  if (!currentAlbumId) { window.location.href = 'index.html'; return; }

  initPortfolio()
    .then(() => {
      currentAlbum = getAlbum(currentAlbumId);
      if (!currentAlbum) { window.location.href = 'index.html'; return; }

      // Setup edit button visibility based on admin authentication
      const editBtn = document.getElementById('editToggleBtn');
      if (isAdmin()) {
        editBtn.style.display = 'flex';
        updateEditToolbarLabel();
      } else {
        editBtn.style.display = 'none';
      }

      renderAlbumHero();
      renderPhotos();
      setupNavScroll();
      setupKeyboard();
      setupUploadZoneDrop();
      setupSwipeGestures();

      document.title = `${currentAlbum.title} — LENS`;
      document.getElementById('albumBreadcrumb').textContent = currentAlbum.title;
      
      const layoutSel = document.getElementById('layoutSelect');
      if (layoutSel) layoutSel.value = currentAlbum.layout || 'masonry';
    })
    .catch(err => {
      console.error('相簿初始化失敗:', err);
      alert('⚠️ 相簿載入失敗！詳細錯誤原因:\n' + (err.stack || err));
      // setTimeout(() => { window.location.href = 'index.html'; }, 2000);
    });
});

function updateEditToolbarLabel() {
  const label = document.getElementById('editToolbarLabel');
  if (label) {
    label.textContent = isSandbox() ? '✦ 編輯模式 (本地測試)' : '✦ 編輯模式';
    label.style.color = isSandbox() ? '#c8a96e' : '';
  }
}

// ---- Render Hero ----
function renderAlbumHero() {
  const oldBg = document.querySelector('.album-hero-bg');
  if (oldBg) oldBg.remove();
  const hero = document.getElementById('albumHero');
  
  if (currentAlbum.cover) {
    const bg = document.createElement('img');
    bg.className = 'album-hero-bg';
    // Use dynamic Cloudinary optimizer for the cover background
    bg.src = optimizeImageUrl(currentAlbum.cover, 1600);
    bg.alt = currentAlbum.title;
    hero.insertBefore(bg, hero.firstChild);
  }
  
  document.getElementById('albumTitle').textContent = currentAlbum.title;
  document.getElementById('albumSubtitle').textContent = currentAlbum.subtitle || '';
  document.getElementById('albumMeta').textContent =
    `${currentAlbum.photos.length} 張照片  ·  ${currentAlbum.createdAt || ''}`;
  
  const tagsEl = document.getElementById('albumTags');
  tagsEl.innerHTML = (currentAlbum.tags || []).map(t => `<span class="tag">${t}</span>`).join('');
}

// ---- Render Photos ----
function renderPhotos() {
  const container = document.getElementById('photosContainer');
  const empty = document.getElementById('emptyPhotos');
  const photos = currentAlbum.photos || [];
  
  container.innerHTML = '';
  
  if (!photos.length) { empty.style.display = 'block'; return; }
  empty.style.display = 'none';
  
  if (currentAlbum.layout === 'sectioned') {
    container.className = 'photos-container layout-sectioned';
    
    // Group photos by their section name
    const groups = {};
    const noSection = [];
    
    photos.forEach(photo => {
      if (photo.section) {
        if (!groups[photo.section]) groups[photo.section] = [];
        groups[photo.section].push(photo);
      } else {
        noSection.push(photo);
      }
    });

    // 1. Render uncategorized/no-section photos at the top (without a header)
    if (noSection.length) {
      const grid = document.createElement('div');
      grid.className = 'photos-sub-grid';
      noSection.forEach((photo) => {
        const originalIndex = photos.findIndex(p => p.id === photo.id);
        grid.appendChild(createPhotoItem(photo, originalIndex));
      });
      container.appendChild(grid);
    }

    // 2. Render each section with a beautiful title and lines
    Object.keys(groups).forEach(sectionTitle => {
      const secHeader = document.createElement('div');
      secHeader.className = 'photo-section-header';
      secHeader.innerHTML = `
        <span class="photo-section-line"></span>
        <h3 class="photo-section-title">${sectionTitle}</h3>
        <span class="photo-section-line"></span>
      `;
      container.appendChild(secHeader);

      const grid = document.createElement('div');
      grid.className = 'photos-sub-grid';
      groups[sectionTitle].forEach((photo) => {
        const originalIndex = photos.findIndex(p => p.id === photo.id);
        grid.appendChild(createPhotoItem(photo, originalIndex));
      });
      container.appendChild(grid);
    });
  } else {
    container.className = `photos-container layout-${currentAlbum.layout || 'masonry'}`;
    photos.forEach((photo, i) => container.appendChild(createPhotoItem(photo, i)));
  }
}

function createPhotoItem(photo, index) {
  const item = document.createElement('div');
  item.className = `photo-item ratio-${photo.ratio || 'auto'}`;
  item.dataset.id = photo.id;
  item.dataset.index = index;

  // Use dynamic Cloudinary optimizer for thumbnails in grid view (width 800px is perfect)
  const thumbnailUrl = optimizeImageUrl(photo.url, 800);

  item.innerHTML = `
    <img src="${thumbnailUrl}" alt="${photo.title || ''}" loading="lazy"
      onerror="this.src='https://images.unsplash.com/photo-1481558585933-e15f630ceacd?w=800&q=60'">
    <div class="photo-caption-overlay">
      ${photo.title ? `<div class="photo-caption-title">${photo.title}</div>` : ''}
      ${photo.caption ? `<div class="photo-caption-desc">${photo.caption}</div>` : ''}
    </div>
    <div class="photo-item-controls">
      <button class="photo-ctrl-btn" title="編輯" onclick="event.stopPropagation(); openEditPhoto('${photo.id}')">✎</button>
      <button class="photo-ctrl-btn del" title="刪除" onclick="event.stopPropagation(); removePhoto('${photo.id}')">✕</button>
    </div>
  `;

  item.addEventListener('click', (e) => { 
    if (!isEditMode) { 
      lightboxIndex = index; 
      openLightbox(); 
    } 
  });

  item.draggable = true;
  item.addEventListener('dragstart', onPhotoDragStart);
  item.addEventListener('dragover', onPhotoDragOver);
  item.addEventListener('drop', onPhotoDrop);
  item.addEventListener('dragend', onPhotoDragEnd);
  
  return item;
}

// ---- Layout ----
function changeLayout(layout) {
  currentAlbum.layout = layout;
  updateAlbum(currentAlbumId, { layout });
  renderPhotos();
}

// ---- Edit Mode ----
function toggleEditMode() {
  isEditMode = !isEditMode;
  document.getElementById('editToggleBtn').classList.toggle('active', isEditMode);
  document.getElementById('editBtnText').textContent = isEditMode ? '完成' : '編輯';
  document.getElementById('editToolbar').classList.toggle('visible', isEditMode);
  document.body.classList.toggle('edit-mode', isEditMode);
  
  updateEditToolbarLabel();
}

// ============================================================
// ADD PHOTOS — Cloudinary Cloud Upload & Local Sandbox Mode
// ============================================================
function openAddPhotoModal() {
  pendingFiles = [];
  document.getElementById('uploadPreviewGrid').innerHTML = '';
  document.getElementById('uploadCount').textContent = '';
  document.getElementById('addPhotosBtn').disabled = true;
  document.getElementById('photoFileInput').value = '';
  
  // Clear batch section name
  const batchSecInput = document.getElementById('batchPhotoSection');
  if (batchSecInput) batchSecInput.value = '';
  
  // Hide progress indicator
  document.getElementById('uploadProgressContainer').style.display = 'none';
  document.getElementById('uploadProgressBar').style.width = '0%';
  
  openModal('addPhotoModal');
}

function handleFileSelect(files) {
  const allowed = ['image/jpeg', 'image/png', 'image/webp'];
  const newFiles = Array.from(files).filter(f => allowed.includes(f.type));
  if (!newFiles.length) { showToast('請選擇 JPG, WebP 或 PNG 圖片'); return; }

  newFiles.forEach(file => {
    // Generate object URL for instant local previews
    const previewUrl = URL.createObjectURL(file);
    pendingFiles.push({ file, previewUrl });
  });

  renderUploadPreviews();
}

function renderUploadPreviews() {
  const grid = document.getElementById('uploadPreviewGrid');
  grid.innerHTML = '';
  pendingFiles.forEach((item, i) => {
    const thumb = document.createElement('div');
    thumb.className = 'upload-thumb';
    thumb.innerHTML = `<img src="${item.previewUrl}" alt=""><button class="upload-thumb-remove" onclick="removePending(${i})">✕</button>`;
    grid.appendChild(thumb);
  });
  const count = pendingFiles.length;
  document.getElementById('uploadCount').textContent = count ? `已選擇 ${count} 張照片` : '';
  document.getElementById('addPhotosBtn').disabled = count === 0;
}

function removePending(index) {
  // Clean up ObjectURL to prevent memory leaks
  URL.revokeObjectURL(pendingFiles[index].previewUrl);
  pendingFiles.splice(index, 1);
  renderUploadPreviews();
}

// Perform sequential async upload
async function addPhotos() {
  const config = getAdminConfig();
  if (!isSandbox() && (!config.cloudName || !config.preset)) {
    alert('⚠️ 偵測到未設定 Cloudinary！\n請先在頁尾的「管理員設定」中設定 Cloud Name 與 Upload Preset，以啟用無限制的高畫質大圖託管服務！\n或者您可以點擊「本地測試」啟用沙盒模式體驗功能。');
    return;
  }

  if (!pendingFiles.length) return;

  const total = pendingFiles.length;
  const progressContainer = document.getElementById('uploadProgressContainer');
  const progressBar = document.getElementById('uploadProgressBar');
  const progressText = document.getElementById('uploadProgressText');
  const addBtn = document.getElementById('addPhotosBtn');
  const cancelBtn = document.getElementById('btnCancelAddPhoto');

  // Read the batch section name
  const batchSectionInput = document.getElementById('batchPhotoSection');
  const batchSection = batchSectionInput ? batchSectionInput.value.trim() : '';

  // Disable buttons & show progress bar
  addBtn.disabled = true;
  cancelBtn.disabled = true;
  progressContainer.style.display = 'block';

  let successCount = 0;

  for (let i = 0; i < total; i++) {
    const item = pendingFiles[i];
    const currentNum = i + 1;
    
    // Update progress bar
    const percent = Math.round((i / total) * 100);
    progressBar.style.width = `${percent}%`;

    if (isSandbox()) {
      progressText.innerHTML = `<span class="spinner spinner-inline"></span> 正在處理第 ${currentNum} / ${total} 張照片 (本地測試模式)...`;
      
      try {
        // Convert and compress to highly optimized Base64 to bypass 5MB localStorage quota limit
        const dataUrl = await compressImage(item.file, 1000, 0.6);

        addPhotoToAlbum(currentAlbumId, {
          url: dataUrl,
          title: item.file.name.substring(0, item.file.name.lastIndexOf('.')) || '',
          caption: '',
          ratio: 'auto',
          section: batchSection
        });
        successCount++;
      } catch (err) {
        console.error('本地讀取照片失敗:', err);
      }
    } else {
      progressText.innerHTML = `<span class="spinner spinner-inline"></span> 正在上傳第 ${currentNum} / ${total} 張照片...`;

      try {
        const formData = new FormData();
        formData.append('file', item.file);
        formData.append('upload_preset', config.preset);

        const res = await fetch(`https://api.cloudinary.com/v1_1/${config.cloudName}/image/upload`, {
          method: 'POST',
          body: formData
        });

        if (!res.ok) {
          throw new Error(`Cloudinary API 回應錯誤 ${res.status}`);
        }

        const resData = await res.json();
        const secureUrl = resData.secure_url;

        // Add to database
        addPhotoToAlbum(currentAlbumId, {
          url: secureUrl,
          title: item.file.name.substring(0, item.file.name.lastIndexOf('.')) || '', // default title
          caption: '',
          ratio: 'auto',
          section: batchSection
        });
        successCount++;
      } catch (e) {
        console.error(`照片上傳失敗 (${item.file.name}):`, e);
        showToast(`❌ 上傳失敗: ${item.file.name}`);
      }
    }

    // Revoke preview object URL
    URL.revokeObjectURL(item.previewUrl);
  }

  progressBar.style.width = '100%';
  progressText.textContent = isSandbox() ? `處理完成！成功: ${successCount}` : `上傳完成！成功: ${successCount}，失敗: ${total - successCount}`;

  // Reload UI
  currentAlbum = getAlbum(currentAlbumId);
  renderPhotos();
  updateMeta();

  setTimeout(() => {
    closeModal('addPhotoModal');
    addBtn.disabled = false;
    cancelBtn.disabled = false;
    showToast(isSandbox() ? `✓ 已成功載入 ${successCount} 張測試照片` : `✓ 已成功新增 ${successCount} 張照片`);
    pendingFiles = [];
  }, 1200);
}

function setupUploadZoneDrop() {
  const zone = document.getElementById('uploadZone');
  if (!zone) return;
  zone.addEventListener('dragover', (e) => { e.preventDefault(); zone.classList.add('dragover'); });
  zone.addEventListener('dragleave', () => zone.classList.remove('dragover'));
  zone.addEventListener('drop', (e) => { 
    e.preventDefault(); 
    zone.classList.remove('dragover'); 
    handleFileSelect(e.dataTransfer.files); 
  });
}

// ============================================================
// COVER PHOTO — Cloudinary Upload & Local Sandbox
// ============================================================
function openCoverModal() {
  pendingCoverFile = null;
  document.getElementById('coverFileInput').value = '';
  document.getElementById('coverPreviewWrap').style.display = 'none';
  document.getElementById('saveCoverBtn').disabled = true;

  // Reset progress bar
  document.getElementById('coverProgressContainer').style.display = 'none';
  document.getElementById('coverProgressBar').style.width = '0%';

  openModal('coverModal');
}

function handleCoverSelect(files) {
  const allowed = ['image/jpeg', 'image/png', 'image/webp'];
  const file = Array.from(files).find(f => allowed.includes(f.type));
  if (!file) { showToast('請選擇 JPG, WebP 或 PNG 圖片'); return; }

  const previewUrl = URL.createObjectURL(file);
  pendingCoverFile = { file, previewUrl };

  document.getElementById('coverPreviewImg').src = previewUrl;
  document.getElementById('coverFileName').textContent = file.name;
  document.getElementById('coverPreviewWrap').style.display = 'block';
  document.getElementById('saveCoverBtn').disabled = false;
}

async function saveCover() {
  const config = getAdminConfig();
  if (!isSandbox() && (!config.cloudName || !config.preset)) {
    alert('⚠️ 偵測到未設定 Cloudinary！\n請先設定 Cloud Name 與 Upload Preset，以啟用無限制的高畫質相簿封面託管服務！\n或者您可以開啟本地測試沙盒模式。');
    return;
  }

  if (!pendingCoverFile) return;

  const progressContainer = document.getElementById('coverProgressContainer');
  const progressBar = document.getElementById('coverProgressBar');
  const progressText = document.getElementById('coverProgressText');
  const saveBtn = document.getElementById('saveCoverBtn');
  const cancelBtn = document.getElementById('btnCancelCover');

  saveBtn.disabled = true;
  cancelBtn.disabled = true;
  progressContainer.style.display = 'block';
  progressBar.style.width = '30%';

  if (isSandbox()) {
    progressText.innerHTML = '<span class="spinner spinner-inline"></span> 正在轉換並套用本地封面照片...';
    try {
      // Convert and compress to highly optimized Base64
      const dataUrl = await compressImage(pendingCoverFile.file, 1200, 0.7);

      updateAlbum(currentAlbumId, { cover: dataUrl });
      currentAlbum = getAlbum(currentAlbumId);
      renderAlbumHero();

      progressBar.style.width = '100%';
      progressText.textContent = '本地套用成功！';

      setTimeout(() => {
        closeModal('coverModal');
        saveBtn.disabled = false;
        cancelBtn.disabled = false;
        showToast('✓ 封面已套用 (本地模式)');
        
        URL.revokeObjectURL(pendingCoverFile.previewUrl);
        pendingCoverFile = null;
      }, 1000);
    } catch (e) {
      console.error('本地讀取封面失敗:', e);
      saveBtn.disabled = false;
      cancelBtn.disabled = false;
      progressContainer.style.display = 'none';
    }
  } else {
    progressText.innerHTML = '<span class="spinner spinner-inline"></span> 正在上傳封面照片至 Cloudinary...';

    try {
      const formData = new FormData();
      formData.append('file', pendingCoverFile.file);
      formData.append('upload_preset', config.preset);

      const res = await fetch(`https://api.cloudinary.com/v1_1/${config.cloudName}/image/upload`, {
        method: 'POST',
        body: formData
      });

      if (!res.ok) throw new Error('Cloudinary Cover Upload Failed');
      
      progressBar.style.width = '80%';
      const resData = await res.json();
      const secureUrl = resData.secure_url;

      updateAlbum(currentAlbumId, { cover: secureUrl });
      currentAlbum = getAlbum(currentAlbumId);
      renderAlbumHero();

      progressBar.style.width = '100%';
      progressText.textContent = '上傳封面成功！';

      setTimeout(() => {
        closeModal('coverModal');
        saveBtn.disabled = false;
        cancelBtn.disabled = false;
        showToast('✓ 封面已更新');
        
        URL.revokeObjectURL(pendingCoverFile.previewUrl);
        pendingCoverFile = null;
      }, 1000);
    } catch (e) {
      console.error('封面照片上傳失敗:', e);
      alert('封面照片上傳失敗，請稍後再試！');
      saveBtn.disabled = false;
      cancelBtn.disabled = false;
      progressContainer.style.display = 'none';
    }
  }
}

// ============================================================
// EDIT PHOTO
// ============================================================
function openEditPhoto(photoId) {
  editingPhotoId = photoId;
  const photo = currentAlbum.photos.find(p => p.id === photoId);
  if (!photo) return;
  document.getElementById('editPhotoThumb').innerHTML =
    `<img src="${optimizeImageUrl(photo.url, 400)}" alt="" style="width:100%;max-height:160px;object-fit:cover;border-radius:2px;margin-bottom:8px;">`;
  document.getElementById('editPhotoTitle').value = photo.title || '';
  document.getElementById('editPhotoCaption').value = photo.caption || '';
  document.getElementById('editPhotoRatio').value = photo.ratio || 'auto';
  document.getElementById('editPhotoSection').value = photo.section || '';
  openModal('editPhotoModal');
}

function savePhotoEdit() {
  if (!editingPhotoId) return;
  updatePhoto(currentAlbumId, editingPhotoId, {
    title: document.getElementById('editPhotoTitle').value.trim(),
    caption: document.getElementById('editPhotoCaption').value.trim(),
    ratio: document.getElementById('editPhotoRatio').value,
    section: document.getElementById('editPhotoSection').value.trim()
  });
  currentAlbum = getAlbum(currentAlbumId);
  renderPhotos();
  closeModal('editPhotoModal');
  showToast('✓ 照片已更新');
}

function removePhoto(photoId) {
  if (!confirm('確定要刪除這張照片？')) return;
  deletePhoto(currentAlbumId, photoId);
  currentAlbum = getAlbum(currentAlbumId);
  renderPhotos();
  updateMeta();
  showToast('照片已刪除');
}

// ---- Edit Album Info ----
function openEditAlbumModal() {
  document.getElementById('editAlbumTitle').value = currentAlbum.title;
  document.getElementById('editAlbumSub').value = currentAlbum.subtitle || '';
  document.getElementById('editAlbumTags').value = (currentAlbum.tags || []).join(', ');
  openModal('editAlbumModal');
}

function saveAlbumInfo() {
  const tagsRaw = document.getElementById('editAlbumTags').value;
  const updates = {
    title: document.getElementById('editAlbumTitle').value.trim(),
    subtitle: document.getElementById('editAlbumSub').value.trim(),
    tags: tagsRaw.split(',').map(t => t.trim()).filter(Boolean)
  };
  updateAlbum(currentAlbumId, updates);
  currentAlbum = getAlbum(currentAlbumId);
  renderAlbumHero();
  closeModal('editAlbumModal');
  document.title = `${currentAlbum.title} — LENS`;
  document.getElementById('albumBreadcrumb').textContent = currentAlbum.title;
  showToast('✓ 作品集資訊已更新');
}

function deleteAlbum() {
  if (!confirm(`確定要刪除「${currentAlbum.title}」作品集嗎？\n所有照片都會一起刪除。`)) return;
  deleteAlbumData(currentAlbumId);
  window.location.href = 'index.html';
}

// ---- Serverless Sync Integration ----
async function saveAll() {
  const btn = document.getElementById('btnSaveAll');
  const originalHtml = btn.innerHTML;
  
  btn.disabled = true;
  btn.innerHTML = `<span class="spinner"></span> 同步中...`;

  try {
    // Perform GitHub API Save
    await updateAlbum(currentAlbumId, { layout: currentAlbum.layout });
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

function updateMeta() {
  document.getElementById('albumMeta').textContent =
    `${currentAlbum.photos.length} 張照片  ·  ${currentAlbum.createdAt || ''}`;
}

// ---- Drag & Drop Photos ----
function onPhotoDragStart(e) {
  if (!isEditMode) { e.preventDefault(); return; }
  dragSrcIndex = parseInt(this.dataset.index);
  this.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
}
function onPhotoDragOver(e) {
  if (!isEditMode) return;
  e.preventDefault();
  document.querySelectorAll('.photo-item').forEach(p => p.classList.remove('drag-over'));
  this.classList.add('drag-over');
}
function onPhotoDrop(e) {
  e.preventDefault();
  if (!isEditMode || dragSrcIndex === null) return;
  const targetIndex = parseInt(this.dataset.index);
  if (dragSrcIndex === targetIndex) return;
  const photos = [...currentAlbum.photos];
  const moved = photos.splice(dragSrcIndex, 1)[0];
  photos.splice(targetIndex, 0, moved);
  reorderPhotos(currentAlbumId, photos);
  currentAlbum = getAlbum(currentAlbumId);
  renderPhotos();
  dragSrcIndex = null;
}
function onPhotoDragEnd() {
  document.querySelectorAll('.photo-item').forEach(p => p.classList.remove('dragging', 'drag-over'));
}

// ============================================================
// LIGHTBOX & MOBILE SWIPE CONTROLLERS
// ============================================================
function openLightbox() { 
  document.getElementById('lightbox').classList.add('open'); 
  showLightboxPhoto(lightboxIndex); 
}

function showLightboxPhoto(index) {
  const photos = currentAlbum.photos;
  if (!photos.length) return;
  lightboxIndex = (index + photos.length) % photos.length;
  const photo = photos[lightboxIndex];
  
  // Use dynamic Cloudinary optimizer for large lightbox fullscreen view
  const largeUrl = optimizeImageUrl(photo.url, 1600);
  
  const img = document.getElementById('lightboxImg');
  img.src = largeUrl;
  document.getElementById('lightboxCaption').textContent = [photo.title, photo.caption].filter(Boolean).join(' — ');
}

function lightboxNav(dir) { 
  showLightboxPhoto(lightboxIndex + dir); 
}

function closeLightbox(e) {
  const lb = document.getElementById('lightbox');
  if (!e || e.target === lb || e.target.classList.contains('lightbox-close')) lb.classList.remove('open');
}

// Mobile swipe touch gestures support
let touchstartX = 0;
let touchendX = 0;

function setupSwipeGestures() {
  const lb = document.getElementById('lightbox');
  lb.addEventListener('touchstart', e => {
    touchstartX = e.changedTouches[0].screenX;
  }, { passive: true });

  lb.addEventListener('touchend', e => {
    touchendX = e.changedTouches[0].screenX;
    handleSwipe();
  }, { passive: true });
}

function handleSwipe() {
  const diff = touchstartX - touchendX;
  const threshold = 50; // swipe minimum distance
  if (Math.abs(diff) < threshold) return;
  
  if (diff > 0) {
    lightboxNav(1);
  } else {
    lightboxNav(-1);
  }
}

// ---- Nav scroll ----
function setupNavScroll() {
  window.addEventListener('scroll', () => {
    document.getElementById('nav').style.background = window.scrollY > 60 ? 'rgba(10,10,10,0.98)' : 'rgba(10,10,10,0.92)';
  });
}

// ---- Keyboard ----
function setupKeyboard() {
  document.addEventListener('keydown', (e) => {
    const lb = document.getElementById('lightbox');
    if (lb.classList.contains('open')) {
      if (e.key === 'ArrowLeft') lightboxNav(-1);
      if (e.key === 'ArrowRight') lightboxNav(1);
      if (e.key === 'Escape') lb.classList.remove('open');
    } else if (e.key === 'Escape') {
      document.querySelectorAll('.modal-overlay.open').forEach(m => m.classList.remove('open'));
    }
  });
}

// ============================================================
// ADMIN SETTINGS MODAL ON ALBUM PAGE (Shares Main code)
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

  // Reload data
  initPortfolio().then(() => {
    currentAlbum = getAlbum(currentAlbumId);
    renderAlbumHero();
    renderPhotos();
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
    currentAlbum = getAlbum(currentAlbumId);
    renderAlbumHero();
    renderPhotos();
  });
}

function logoutAdmin() {
  if (!confirm('確定要登出並清除本機的管理密鑰設定嗎？')) return;
  clearAdminConfig();
  
  // Hide edit toggle btn & exit edit mode
  document.getElementById('editToggleBtn').style.display = 'none';
  if (isEditMode) toggleEditMode();

  closeModal('adminSettingsModal');
  showToast('已登出管理員模式');
  
  // Force reload site data back to main
  window.location.href = 'index.html';
}

// ---- Modal Helpers ----
function openModal(id) { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }
document.addEventListener('click', (e) => { if (e.target.classList.contains('modal-overlay')) e.target.classList.remove('open'); });
