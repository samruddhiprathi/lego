// ---------------------
// DOM elements
// ---------------------
const gridEl = document.getElementById('grid');
const gridSizeEl = document.getElementById('gridSize');
const colorPicker = document.getElementById('colorPicker');
const createBtn = document.getElementById('createBtn');
const saveBtn = document.getElementById('saveBtn');
const clearBtn = document.getElementById('clearBtn');
const eraserBtn = document.getElementById('eraserBtn');
const messageEl = document.getElementById('message');
const dateDisplay = document.getElementById('dateDisplay');
const galleryEl = document.getElementById('gallery');

let currentColor = colorPicker.value;
let erasing = false;

// ---------------------
// Show date
// ---------------------
function showDate(dateStr = null) {
  const d = dateStr ? new Date(dateStr) : new Date();
  dateDisplay.textContent = "Created on: " + d.toLocaleDateString();
}
showDate();

// ---------------------
// Create Grid
// ---------------------
function createGrid() {
  const size = parseInt(gridSizeEl.value, 10) || 16;
  gridEl.innerHTML = '';
  gridEl.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
  gridEl.style.gridTemplateRows = `repeat(${size}, 1fr)`;

  for (let i = 0; i < size * size; i++) {
    const cell = document.createElement('div');
    cell.className = 'cell';
    cell.addEventListener('click', () => paintCell(cell));
    cell.addEventListener('mouseover', e => { if(e.buttons === 1) paintCell(cell); });
    gridEl.appendChild(cell);
  }
}

// ---------------------
// Paint cell
// ---------------------
function paintCell(cell) {
  cell.style.background = erasing ? 'white' : currentColor;
}

// ---------------------
// Color picker
// ---------------------
colorPicker.addEventListener('input', (e) => {
  currentColor = e.target.value;
  erasing = false;
  eraserBtn.classList.remove('active');
});

// ---------------------
// Eraser
// ---------------------
eraserBtn.addEventListener('click', () => {
  erasing = !erasing;
  eraserBtn.classList.toggle('active', erasing);
});

// ---------------------
// Clear grid
// ---------------------
clearBtn.addEventListener('click', () => {
  document.querySelectorAll('.cell').forEach(c => c.style.background = 'white');
  showMsg('Grid Cleared');
});

// ---------------------
// Create button
// ---------------------
createBtn.addEventListener('click', () => {
  createGrid();
  showMsg('Grid Created');
});

// ---------------------
// Cloudinary upload
// ---------------------
async function uploadToCloudinary(blob) {
  const url = `https://api.cloudinary.com/v1_1/dntmpd3o4/upload`;
  const formData = new FormData();
  formData.append('file', blob);
  formData.append('upload_preset', 'legoapp'); // your unsigned preset

  const response = await fetch(url, { method: 'POST', body: formData });
  const data = await response.json();
  return data.secure_url;
}

// ---------------------
// Save button
// ---------------------
saveBtn.addEventListener('click', async () => {
  try {
    showMsg('Preparing image...');
    saveBtn.disabled = true;

    const canvas = await html2canvas(gridEl, { backgroundColor: null, scale: 1 });
    const blob = await new Promise(res => canvas.toBlob(res, 'image/png'));

    showMsg('Uploading...');
    const imageUrl = await uploadToCloudinary(blob);

    const today = new Date().toISOString();
    addToGallery(imageUrl, today);
    saveGalleryToLocal(imageUrl, today);

    showMsg('Saved Successfully ✔️');
    showDate(today);
  } catch (err) {
    console.error(err);
    showMsg('Error saving: ' + err.message);
  } finally {
    saveBtn.disabled = false;
  }
});

// ---------------------
// Add to gallery with Delete
// ---------------------
function addToGallery(url, dateStr) {
  const card = document.createElement('div');
  card.className = 'art-card';

  const img = document.createElement('img');
  img.src = url;
  img.alt = 'LEGO Art';

  const meta = document.createElement('div');
  meta.className = 'art-meta';
  const date = new Date(dateStr);
  meta.textContent = `Created on: ${date.toLocaleDateString()}`;

  const delBtn = document.createElement('button');
  delBtn.textContent = 'Delete';
  delBtn.className = 'btn subtle';
  delBtn.style.marginTop = '6px';
  delBtn.style.fontSize = '12px';
  delBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to delete this image?')) {
      galleryEl.removeChild(card);
      removeFromLocal(url);
    }
  });

  card.appendChild(img);
  card.appendChild(meta);
  card.appendChild(delBtn);
  galleryEl.prepend(card);
}

// ---------------------
// LocalStorage helpers
// ---------------------
function saveGalleryToLocal(url, date) {
  const gallery = JSON.parse(localStorage.getItem('legoGallery') || '[]');
  gallery.unshift({ url, date }); // newest first
  localStorage.setItem('legoGallery', JSON.stringify(gallery));
}

function removeFromLocal(url) {
  let gallery = JSON.parse(localStorage.getItem('legoGallery') || '[]');
  gallery = gallery.filter(item => item.url !== url);
  localStorage.setItem('legoGallery', JSON.stringify(gallery));
}

function loadGalleryFromLocal() {
  const gallery = JSON.parse(localStorage.getItem('legoGallery') || '[]');
  galleryEl.innerHTML = '';
  gallery.forEach(item => addToGallery(item.url, item.date));
}

// ---------------------
// Message helper
// ---------------------
function showMsg(text) {
  messageEl.textContent = text;
  setTimeout(() => { if(messageEl.textContent === text) messageEl.textContent = ''; }, 3000);
}

// ---------------------
// Initialize
// ---------------------
createGrid();
loadGalleryFromLocal();
