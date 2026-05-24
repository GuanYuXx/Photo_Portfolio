// =========================================
// LENS — Main Page (index.html)
// =========================================

let isEditMode = false;
let dragSrcIndex = null;

// ---- Init ----
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('heroDesc').textContent = getHeroText();
  renderAlbums();
  setupNavScroll();
});

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

  card.innerHTML = `
    <img class="album-card-img" src="${album.cover}" alt="${album.title}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1510784722466-f2aa240d4703?w=800&q=60'">
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
}

// ---- New Album Modal ----
function openNewAlbumModal() {
  openModal('newAlbumModal');
}

function createAlbum() {
  const title = document.getElementById('newAlbumTitle').value.trim();
  if (!title) { alert('請輸入作品集名稱'); return; }

  const sub = document.getElementById('newAlbumSub').value.trim();
  const cover = document.getElementById('newAlbumCover').value.trim();
  const tags = document.getElementById('newAlbumTags').value.trim();

  createAlbumData(title, sub, cover, tags);
  closeModal('newAlbumModal');
  renderAlbums();
  showToast('✓ 作品集已建立');

  // Clear fields
  ['newAlbumTitle','newAlbumSub','newAlbumCover','newAlbumTags'].forEach(id => {
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

// ---- Hero Text ----
function editHeroText() {
  document.getElementById('heroInput').value = getHeroText();
  openModal('heroModal');
}

function saveHeroText() {
  const text = document.getElementById('heroInput').value.trim();
  if (!text) return;
  saveHeroTextData(text);
  document.getElementById('heroDesc').textContent = text;
  closeModal('heroModal');
  showToast('✓ 標語已更新');
}

function saveAll() {
  showToast('✓ 已儲存');
}

// ---- Modal Helpers ----
function openModal(id) {
  document.getElementById(id).classList.add('open');
}

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
function setupNavScroll() {
  window.addEventListener('scroll', () => {
    const nav = document.getElementById('nav');
    if (window.scrollY > 60) {
      nav.style.background = 'rgba(10,10,10,0.98)';
    } else {
      nav.style.background = 'rgba(10,10,10,0.92)';
    }
  });
}

// Keyboard
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-overlay.open').forEach(m => m.classList.remove('open'));
  }
});
