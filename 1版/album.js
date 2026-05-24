// =========================================
// LENS — Album Page (album.html)
// =========================================

let isEditMode = false;
let currentAlbumId = null;
let currentAlbum = null;
let lightboxIndex = 0;
let dragSrcIndex = null;
let editingPhotoId = null;

// ---- Init ----
document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  currentAlbumId = params.get('id');

  if (!currentAlbumId) {
    window.location.href = 'index.html';
    return;
  }

  currentAlbum = getAlbum(currentAlbumId);
  if (!currentAlbum) {
    window.location.href = 'index.html';
    return;
  }

  renderAlbumHero();
  renderPhotos();
  setupNavScroll();
  setupKeyboard();

  // Set page title
  document.title = `${currentAlbum.title} — LENS`;
  document.getElementById('albumBreadcrumb').textContent = currentAlbum.title;

  // Set layout select
  const layoutSel = document.getElementById('layoutSelect');
  if (layoutSel) layoutSel.value = currentAlbum.layout || 'masonry';
});

// ---- Render Hero ----
function renderAlbumHero() {
  const hero = document.getElementById('albumHero');
  // Set background
  const bg = document.createElement('img');
  bg.className = 'album-hero-bg';
  bg.src = currentAlbum.cover;
  bg.alt = currentAlbum.title;
  bg.onerror = () => { bg.style.display = 'none'; };
  hero.insertBefore(bg, hero.firstChild);

  document.getElementById('albumTitle').textContent = currentAlbum.title;
  document.getElementById('albumSubtitle').textContent = currentAlbum.subtitle || '';
  document.getElementById('albumMeta').textContent =
    `${currentAlbum.photos.length} 張照片  ·  ${currentAlbum.createdAt || ''}`;

  const tagsEl = document.getElementById('albumTags');
  tagsEl.innerHTML = (currentAlbum.tags || [])
    .map(t => `<span class="tag">${t}</span>`).join('');
}

// ---- Render Photos ----
function renderPhotos() {
  const container = document.getElementById('photosContainer');
  const empty = document.getElementById('emptyPhotos');
  const photos = currentAlbum.photos || [];

  container.innerHTML = '';

  // Apply layout class
  const layout = currentAlbum.layout || 'masonry';
  container.className = `photos-container layout-${layout}`;

  if (!photos.length) {
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';

  photos.forEach((photo, i) => {
    const el = createPhotoItem(photo, i);
    container.appendChild(el);
  });
}

function createPhotoItem(photo, index) {
  const item = document.createElement('div');
  item.className = `photo-item ratio-${photo.ratio || 'auto'}`;
  item.dataset.id = photo.id;
  item.dataset.index = index;

  item.innerHTML = `
    <img src="${photo.url}" alt="${photo.title || ''}" loading="lazy"
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

  // Click = lightbox (when not editing)
  item.addEventListener('click', (e) => {
    if (isEditMode) return;
    lightboxIndex = index;
    openLightbox();
  });

  // Drag & Drop
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
  const btn = document.getElementById('editToggleBtn');
  const txt = document.getElementById('editBtnText');
  const toolbar = document.getElementById('editToolbar');

  btn.classList.toggle('active', isEditMode);
  txt.textContent = isEditMode ? '完成' : '編輯';
  toolbar.classList.toggle('visible', isEditMode);
  document.body.classList.toggle('edit-mode', isEditMode);
}

// ---- Add Photo ----
function openAddPhotoModal() {
  document.getElementById('photoUrl').value = '';
  document.getElementById('photoTitle').value = '';
  document.getElementById('photoCaption').value = '';
  document.getElementById('photoRatio').value = 'auto';
  document.getElementById('photoPreview').style.display = 'none';
  openModal('addPhotoModal');
}

function previewPhoto() {
  const url = document.getElementById('photoUrl').value.trim();
  const preview = document.getElementById('photoPreview');
  if (url) {
    preview.src = url;
    preview.style.display = 'block';
  }
}

function addPhoto() {
  const url = document.getElementById('photoUrl').value.trim();
  if (!url) { alert('請輸入照片網址'); return; }

  const photo = {
    url,
    title: document.getElementById('photoTitle').value.trim(),
    caption: document.getElementById('photoCaption').value.trim(),
    ratio: document.getElementById('photoRatio').value
  };

  addPhotoToAlbum(currentAlbumId, photo);
  currentAlbum = getAlbum(currentAlbumId);
  renderPhotos();
  updateMeta();
  closeModal('addPhotoModal');
  showToast('✓ 照片已新增');
}

// ---- Edit Photo ----
function openEditPhoto(photoId) {
  editingPhotoId = photoId;
  const photo = currentAlbum.photos.find(p => p.id === photoId);
  if (!photo) return;

  document.getElementById('editPhotoUrl').value = photo.url;
  document.getElementById('editPhotoTitle').value = photo.title || '';
  document.getElementById('editPhotoCaption').value = photo.caption || '';
  document.getElementById('editPhotoRatio').value = photo.ratio || 'auto';
  openModal('editPhotoModal');
}

function savePhotoEdit() {
  if (!editingPhotoId) return;
  const updates = {
    url: document.getElementById('editPhotoUrl').value.trim(),
    title: document.getElementById('editPhotoTitle').value.trim(),
    caption: document.getElementById('editPhotoCaption').value.trim(),
    ratio: document.getElementById('editPhotoRatio').value
  };
  updatePhoto(currentAlbumId, editingPhotoId, updates);
  currentAlbum = getAlbum(currentAlbumId);
  renderPhotos();
  closeModal('editPhotoModal');
  showToast('✓ 照片已更新');
}

// ---- Delete Photo ----
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
  document.getElementById('editAlbumCover').value = currentAlbum.cover || '';
  document.getElementById('editAlbumTags').value = (currentAlbum.tags || []).join(', ');
  openModal('editAlbumModal');
}

function saveAlbumInfo() {
  const tagsRaw = document.getElementById('editAlbumTags').value;
  const updates = {
    title: document.getElementById('editAlbumTitle').value.trim(),
    subtitle: document.getElementById('editAlbumSub').value.trim(),
    cover: document.getElementById('editAlbumCover').value.trim(),
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

// ---- Delete Album ----
function deleteAlbum() {
  if (!confirm(`確定要刪除「${currentAlbum.title}」作品集嗎？\n所有照片都會一起刪除。`)) return;
  deleteAlbumData(currentAlbumId);
  window.location.href = 'index.html';
}

// ---- Save ----
function saveAll() {
  updateAlbum(currentAlbumId, { layout: currentAlbum.layout });
  showToast('✓ 已儲存');
}

// ---- Update Meta Display ----
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
  e.dataTransfer.dropEffect = 'move';
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
  document.querySelectorAll('.photo-item').forEach(p => {
    p.classList.remove('dragging', 'drag-over');
  });
}

// ---- Lightbox ----
function openLightbox() {
  const lb = document.getElementById('lightbox');
  lb.classList.add('open');
  showLightboxPhoto(lightboxIndex);
}

function showLightboxPhoto(index) {
  const photos = currentAlbum.photos;
  if (!photos.length) return;
  lightboxIndex = (index + photos.length) % photos.length;
  const photo = photos[lightboxIndex];

  document.getElementById('lightboxImg').src = photo.url;
  document.getElementById('lightboxCaption').textContent =
    [photo.title, photo.caption].filter(Boolean).join(' — ');
}

function lightboxNav(dir) {
  showLightboxPhoto(lightboxIndex + dir);
}

function closeLightbox(e) {
  if (e && e.target !== document.getElementById('lightbox') &&
      !e.target.classList.contains('lightbox-close')) return;
  if (!e) {
    document.getElementById('lightbox').classList.remove('open');
    return;
  }
  if (e.target.id === 'lightbox' || e.target.classList.contains('lightbox-close')) {
    document.getElementById('lightbox').classList.remove('open');
  }
}

// ---- Nav scroll ----
function setupNavScroll() {
  window.addEventListener('scroll', () => {
    const nav = document.getElementById('nav');
    nav.style.background = window.scrollY > 60
      ? 'rgba(10,10,10,0.98)' : 'rgba(10,10,10,0.92)';
  });
}

// ---- Keyboard ----
function setupKeyboard() {
  document.addEventListener('keydown', (e) => {
    const lb = document.getElementById('lightbox');
    if (lb.classList.contains('open')) {
      if (e.key === 'ArrowLeft')  lightboxNav(-1);
      if (e.key === 'ArrowRight') lightboxNav(1);
      if (e.key === 'Escape')     lb.classList.remove('open');
    } else {
      if (e.key === 'Escape') {
        document.querySelectorAll('.modal-overlay.open').forEach(m => m.classList.remove('open'));
      }
    }
  });
}

// ---- Modal helpers ----
function openModal(id) {
  document.getElementById(id).classList.add('open');
}

function closeModal(id) {
  document.getElementById(id).classList.remove('open');
}

document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.classList.remove('open');
  }
});
