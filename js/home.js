// js/home.js - homepage data loading for animated and featured products
import { db } from './firebase.init.js';
import { collection, query, where, getDocs, limit as qlimit } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

function createProductCard(p) {
  const mainImage = (p.images && p.images.length) ? p.images[0] : 'https://placehold.co/320x220/EFEFEF/A9A9A9?text=No+Image';
  const a = document.createElement('a');
  a.className = 'card';
  a.href = `product.html?id=${p.id}`;
  a.innerHTML = `
    <img src="${mainImage}" alt="${p.name}" onerror="this.onerror=null;this.src='https://placehold.co/320x220/EFEFEF/A9A9A9?text=No+Image';">
    <div>
      <h3>${p.name}</h3>
      <div class="meta">${p.strap || ''} • ${p.size || ''}</div>
    </div>
  `;
  return a;
}

async function loadAnimatedProducts() {
  const container = document.getElementById('animated-products');
  if (!container) return;
  container.innerHTML = '';
  try {
    const q = query(collection(db, 'products'), where('animated', '==', true));
    const snap = await getDocs(q);
    const prods = [];
    snap.forEach(doc => prods.push({ id: doc.id, ...doc.data() }));
    const top3 = prods.slice(0, 3);
    top3.forEach(p => container.appendChild(createProductCard(p)));
  } catch (err) {
    console.error('animated products', err);
  }
}

function chunk(arr, size) { const res=[]; for (let i=0;i<arr.length;i+=size) res.push(arr.slice(i,i+size)); return res; }

async function loadFeaturedProducts() {
  const container = document.getElementById('featured-carousel');
  const dots = document.getElementById('featured-dots');
  if (!container || !dots) return;
  container.innerHTML = '';
  dots.innerHTML = '';

  try {
    const q = query(collection(db, 'products'), where('featured', '==', true));
    const snap = await getDocs(q);
    const prods = [];
    snap.forEach(doc => prods.push({ id: doc.id, ...doc.data() }));
    const nine = prods.slice(0, 9);
    const slides = chunk(nine, 3);

    const slidesWrap = document.createElement('div');
    slidesWrap.className = 'featured-slides-wrap';
    slides.forEach((group, idx) => {
      const slide = document.createElement('div');
      slide.className = 'featured-slide';
      group.forEach(p => {
        const card = document.createElement('a');
        card.className = 'product-card';
        card.href = `product.html?id=${p.id}`;
        const img = (p.images && p.images[0]) ? p.images[0] : 'https://placehold.co/220x160/EFEFEF/A9A9A9?text=No+Image';
        slide.innerHTML += `
          <a class="product-card" href="product.html?id=${p.id}">
            <div class="product-card-image">
              <img src="${img}" alt="${p.name}">
            </div>
            <div class="product-card-info">
              <h3>${p.name}</h3>
              <p class="meta">${p.type || ''} • ${p.strap || ''}</p>
            </div>
          </a>
        `;
      });
      slidesWrap.appendChild(slide);

      const dot = document.createElement('button');
      dot.className = 'dot';
      dot.setAttribute('aria-label', `Go to set ${idx+1}`);
      dot.addEventListener('click', ()=> goTo(idx));
      dots.appendChild(dot);
    });

    container.appendChild(slidesWrap);

    let current = 0;
    function goTo(i) {
      current = i % slides.length;
      slidesWrap.style.transform = `translateX(-${current * 100}%)`;
      Array.from(dots.children).forEach((d, di)=> d.classList.toggle('active', di===current));
    }

    function next() { goTo((current + 1) % slides.length); }

    goTo(0);
    let auto = setInterval(next, 4000);
    container.addEventListener('mouseenter', ()=> clearInterval(auto));
    container.addEventListener('mouseleave', ()=> auto = setInterval(next, 4000));

  } catch (err) {
    console.error('featured products', err);
  }
}

// init
document.addEventListener('DOMContentLoaded', ()=>{
  loadAnimatedProducts();
  loadFeaturedProducts();
});
