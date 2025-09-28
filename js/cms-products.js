// cms-products.js
import { db, auth } from '../js/firebase-config.js';
import {
  collection, addDoc, doc, setDoc, getDocs, onSnapshot, deleteDoc, updateDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";
import {
  getStorage, ref as sref, uploadBytes, getDownloadURL
} from "https://www.gstatic.com/firebasejs/9.22.1/firebase-storage.js";

const productForm = document.getElementById('productForm');
const productList = document.getElementById('productList');
const imageInput = document.getElementById('productImages');
const imagePreview = document.getElementById('imagePreview');
const clearFormBtn = document.getElementById('clearFormBtn');

const storage = getStorage();

let selectedFiles = [];

// preview images
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
    div.innerHTML = `<img src="${url}" alt="${file.name}"><div class="preview-actions"><button class="btn small" data-rem="${idx}">Remove</button></div>`;
    imagePreview.appendChild(div);
  });
  // remove handler
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

// submit product
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


  if (!name || !strap || !color || !size) {
    alert('Name and all dropdowns are required');
    return;
  }

  if (selectedFiles.length < 1) {
    alert('At least one image is required');
    return;
  }

  try {
    // create product doc first to get id
    const pRef = await addDoc(collection(db, 'products'), {
      name, price, type,strap, color, size, description, quantity,
      images: [], createdAt: serverTimestamp()
    });

    // upload images and collect URLs
    const urls = [];
    for (const file of selectedFiles) {
      const path = `products/${pRef.id}/${Date.now()}_${file.name}`;
      const s = sref(storage, path);
      await uploadBytes(s, file);
      const url = await getDownloadURL(s);
      urls.push(url);
    }

    // update product with images
    await updateDoc(doc(db, 'products', pRef.id), { images: urls });

    alert('Product saved');
    productForm.reset();
    selectedFiles = [];
    renderPreview();

  } catch (err) {
    console.error(err);
    alert('Failed to save product: ' + (err.message || err));
  }
});

// render products list live
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
    card.innerHTML = `
      <div class="product-card-inner">
        <div class="product-thumb">${img}</div>
        <div class="product-info">
          <h4>${p.name}</h4>
          <div class="meta">Price: $${Number(p.price).toFixed(2)}</div>
          <div class="meta">Strap: ${p.strap} • Color: ${p.color} • Size: ${p.size}</div>
          <p class="small muted">${(p.description||'')}</p>
        </div>
        <div class="product-actions">
          ${canEdit ? `<button class="btn small" data-edit="${p.id}">Edit</button>` : ''}
          ${canDelete ? `<button class="btn small btn-danger" data-del="${p.id}">Delete</button>` : ''}
        </div>
      </div>
    `;
    productList.appendChild(card);
  });

  // attach handlers
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

  productList.querySelectorAll('[data-edit]').forEach(b => b.addEventListener('click', async (e) => {
    const id = e.currentTarget.dataset.edit;
    // load product and fill form for edit - left as an exercise or implement below
    // For now, open a prompt-based quick edit for price and quantity
    const pSnap = await (await import("https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js")).getDoc((await import("https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js")).doc(db, 'products', id));
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
