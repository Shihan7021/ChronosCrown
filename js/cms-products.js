// cms-products.js
import { db, auth } from '../js/firebase-config.js';
import {
  collection, addDoc, doc, setDoc, getDocs, onSnapshot, deleteDoc, updateDoc, serverTimestamp, query, where
} from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";
import {
  getStorage, ref as sref, uploadBytes, getDownloadURL
} from "https://www.gstatic.com/firebasejs/9.22.1/firebase-storage.js";

// DOM elements
const productForm = document.getElementById('productForm');
const productList = document.getElementById('productList');
const imageInput = document.getElementById('productImages');
const imagePreview = document.getElementById('imagePreview');
const clearFormBtn = document.getElementById('clearFormBtn');
const featuredInput = document.getElementById('productFeatured');
const animatedInput = document.getElementById('productAnimated');

const storage = getStorage();
let selectedFiles = [];

// Preview images
imageInput.addEventListener('change', (e) => {
  selectedFiles = Array.from(e.target.files);
  renderPreview();
});

function renderPreview() {
  imagePreview.innerHTML = '';
  selectedFiles.forEach((file, idx) => {
    const url = URL.createObjectURL(file);
    const div = document.createElement('div');
    div.className = 'preview-card';
    div.innerHTML = `
      <img src="${url}" alt="${file.name}">
      <div class="preview-actions">
        <button class="btn small" data-rem="${idx}">Remove</button>
      </div>
    `;
    imagePreview.appendChild(div);
  });

  imagePreview.querySelectorAll('[data-rem]').forEach(btn => btn.addEventListener('click', (e) => {
    const idx = Number(e.currentTarget.dataset.rem);
    selectedFiles.splice(idx, 1);
    imageInput.value = ''; // reset input
    renderPreview();
  }));
}

clearFormBtn.addEventListener('click', () => {
  productForm.reset();
  selectedFiles = [];
  imagePreview.innerHTML = '';
});

// Submit product
productForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const name = document.getElementById('productName').value.trim();
  const price = Number(document.getElementById('productPrice').value) || 0;
  const type = document.getElementById('productType').value;  // new
  const strap = document.getElementById('productStrap').value;
  const color = document.getElementById('productColor').value;
  const size = document.getElementById('productSize').value;
  const description = document.getElementById('productDesc').value.trim();
  const quantity = Number(document.getElementById('productQty').value) || 0;
  const markFeatured = !!featuredInput?.checked;
  const markAnimated = !!animatedInput?.checked;

  if (!name || !strap || !color || !size || !type) {
    alert('Name, type and all dropdowns are required');
    return;
  }

  if (selectedFiles.length < 1) {
    alert('At least one image is required');
    return;
  }

  try {
    // Enforce limits before creating if user marked
    let canFeature = true, canAnimate = true;
    if (markFeatured) {
      const qf = query(collection(db, 'products'), where('featured', '==', true));
      const snapF = await getDocs(qf);
      if (snapF.size >= 9) { canFeature = false; alert('You can mark up to 9 products as Featured.'); }
    }
    if (markAnimated) {
      const qa = query(collection(db, 'products'), where('animated', '==', true));
      const snapA = await getDocs(qa);
      if (snapA.size >= 3) { canAnimate = false; alert('You can mark up to 3 products as Animated.'); }
    }

    // Step 1: create product doc first
    const pRef = await addDoc(collection(db, 'products'), {
      name, price, type, strap, color, size, description, quantity,
      featured: canFeature && markFeatured ? true : false,
      animated: canAnimate && markAnimated ? true : false,
      images: [], createdAt: serverTimestamp()
    });

    // Step 2: upload images & collect URLs
    const urls = await Promise.all(selectedFiles.map(async file => {
      const path = `products/${pRef.id}/${Date.now()}_${file.name}`;
      const sRef = sref(storage, path);
      await uploadBytes(sRef, file);
      const url = await getDownloadURL(sRef);
      return url;
    }));

    // Step 3: update product doc with image URLs
    await updateDoc(doc(db, 'products', pRef.id), { images: urls });

    alert('Product saved with images!');
    productForm.reset();
    selectedFiles = [];
    renderPreview();

  } catch (err) {
    console.error(err);
    alert('Failed to save product: ' + (err.message || err));
  }
});

// Render product list live
onSnapshot(collection(db, 'products'), snapshot => {
  const rows = [];
  snapshot.forEach(s => rows.push({ id: s.id, ...s.data() }));
  renderProductList(rows);
}, err => {
  console.error('product listen', err);
  productList.innerHTML = '<div>No products</div>';
});

function renderProductList(products) {
  productList.innerHTML = '';
  if (!products.length) {
    productList.innerHTML = '<div class="small muted">No products found.</div>';
    return;
  }

  const cmsUser = JSON.parse(sessionStorage.getItem('cmsUser') || 'null');
  const canDelete = cmsUser && (cmsUser.role === 'Admin' || cmsUser.role === 'Manager');
  const canEdit = cmsUser && (cmsUser.role === 'Admin' || cmsUser.role === 'Manager' || cmsUser.role === 'Associate');

  products.forEach(p => {
    const card = document.createElement('div');
    card.className = 'product-card';
    const img = (p.images && p.images[0]) ? `<img src="${p.images[0]}" alt="${p.name}">` : `<div class="no-image">No image</div>`;
    const featuredChecked = p.featured ? 'checked' : '';
    const animatedChecked = p.animated ? 'checked' : '';
    card.innerHTML = `
      <div class="product-card-inner">
        <div class="product-thumb">${img}</div>
        <div class="product-info">
          <h4>${p.name} (${p.type || '-'})</h4>
          <div class="meta">Price: $${Number(p.price).toFixed(2)}</div>
          <div class="meta">Strap: ${p.strap} • Color: ${p.color} • Size: ${p.size}</div>
          <p class="small muted">${(p.description||'')}</p>
          <div class="toggle-row">
            <label><input type="checkbox" data-feature="${p.id}" ${featuredChecked}> Featured</label>
            <label><input type="checkbox" data-animated="${p.id}" ${animatedChecked}> Animated</label>
          </div>
        </div>
        <div class="product-actions">
          ${canEdit ? `<button class="btn small" data-edit="${p.id}">Edit</button>` : ''}
          ${canDelete ? `<button class="btn small btn-danger" data-del="${p.id}">Delete</button>` : ''}
        </div>
      </div>
    `;
    productList.appendChild(card);
  });

  // Attach feature/animated toggle handlers with limits
  productList.querySelectorAll('[data-feature]').forEach(el => el.addEventListener('change', async (e)=>{
    const id = e.currentTarget.dataset.feature;
    const checked = e.currentTarget.checked;
    try {
      if (checked) {
        const qf = query(collection(db, 'products'), where('featured','==',true));
        const snap = await getDocs(qf);
        // exclude current if already featured
        const already = (await getDocs(query(collection(db,'products'), where('__name__','==',id))));
        const was = false; // we don't need exact prev here; UI had it
        if (snap.size >= 9) { alert('Maximum 9 featured products allowed.'); e.currentTarget.checked = false; return; }
      }
      await updateDoc(doc(db,'products',id), { featured: checked });
    } catch(err){ console.error(err); alert('Failed to update: '+(err.message||err)); e.currentTarget.checked = !checked; }
  }));

  productList.querySelectorAll('[data-animated]').forEach(el => el.addEventListener('change', async (e)=>{
    const id = e.currentTarget.dataset.animated;
    const checked = e.currentTarget.checked;
    try {
      if (checked) {
        const qa = query(collection(db, 'products'), where('animated','==',true));
        const snap = await getDocs(qa);
        if (snap.size >= 3) { alert('Maximum 3 animated products allowed.'); e.currentTarget.checked = false; return; }
      }
      await updateDoc(doc(db,'products',id), { animated: checked });
    } catch(err){ console.error(err); alert('Failed to update: '+(err.message||err)); e.currentTarget.checked = !checked; }
  }));

  // Attach delete handlers
  productList.querySelectorAll('[data-del]').forEach(b => b.addEventListener('click', async (e) => {
    const id = e.currentTarget.dataset.del;
    if (!confirm('Delete product?')) return;
    try {
      await deleteDoc(doc(db, 'products', id));
      alert('Deleted');
    } catch (err) {
      console.error(err);
      alert('Delete failed: ' + err.message);
    }
  }));

  // Attach edit handlers
  productList.querySelectorAll('[data-edit]').forEach(b => b.addEventListener('click', async (e) => {
    const id = e.currentTarget.dataset.edit;
    const { getDoc, doc, updateDoc, serverTimestamp } = await import("https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js");
    const pSnap = await getDoc(doc(db, 'products', id));
    if (!pSnap.exists()) { alert('Not found'); return; }
    const p = pSnap.data();
    const newPrice = prompt('New price', p.price || 0);
    if (newPrice === null) return;
    const newQty = prompt('New quantity (internal)', p.quantity || 0);
    if (newQty === null) return;
    await updateDoc(doc(db, 'products', id), { price: Number(newPrice), quantity: Number(newQty), updatedAt: serverTimestamp() });
    alert('Saved');
  }));
}
