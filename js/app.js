// app.js - site-wide UI helpers (parallax carousel + header behavior)
import { auth, db } from './firebase.init.js';
import { $ } from './utils.js';
import { collection, onSnapshot, doc, setDoc, increment } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js";

document.addEventListener('DOMContentLoaded', ()=>{
  try { initHeader(); initCarousel(); } catch(e){ console.warn(e); }
});

function initHeader(){
  // update cart badge; prefer DB if logged in, else local storage fallback
  const setBadge = (v)=>{
    const count = String(v ?? (localStorage.getItem('cart_count') || '0'));
    localStorage.setItem('cart_count', count);
    const badge = document.querySelector('.cart-badge');
    if(badge) badge.textContent = count;
  };
  setBadge();
  window.addEventListener('storage', (e)=>{
    if (e.key === 'cart' || e.key === 'cart_count') setBadge();
  });

  // Sync badge with Firestore carts if signed in
  let unsubCart = null;
  onAuthStateChanged(auth, async (user)=>{
    if (unsubCart) { try { unsubCart(); } catch(_){} unsubCart = null; }
    if (!user) {
      // Logged out: show 0 and clear any local cache
      setBadge(0);
      return;
    }

    // One-time migration of any local cart to Firestore on login
    try {
      const localCartRaw = localStorage.getItem('cart');
      if (localCartRaw) {
        const localCart = JSON.parse(localCartRaw || '[]');
        if (Array.isArray(localCart) && localCart.length) {
          for (const it of localCart) {
            const key = `${it.productId}__${it.strap||''}__${it.color||''}__${it.size||''}`;
            const ref = doc(db, 'carts', user.uid, 'items', key);
            await setDoc(ref, {
              productId: it.productId,
              name: it.name || '',
              model: it.model || '',
              price: Number(it.price||0),
              image: it.image || '',
              strap: it.strap || '',
              color: it.color || '',
              size: it.size || '',
              qty: increment(Number(it.qty)||1),
              updatedAt: new Date().toISOString()
            }, { merge: true });
          }
          // Clear local cart after migration
          localStorage.removeItem('cart');
        }
      }
    } catch (mErr) {
      console.warn('cart migration failed', mErr);
    }

    const itemsCol = collection(db, 'carts', user.uid, 'items');
    unsubCart = onSnapshot(itemsCol, (snap)=>{
      let count = 0; snap.forEach(d=> { count += Number(d.data().qty)||0; });
      setBadge(count);
    }, (err)=>{
      console.warn('cart badge listen failed', err);
    });
  });

  // simple sign out attach
  const signoutBtn = document.querySelector('.signout-btn');
  if(signoutBtn) signoutBtn.addEventListener('click', async ()=>{
    await auth.signOut();
    window.location.href = '/';
  });
}

function initCarousel(){
  const track = document.querySelector('.carousel');
  if(!track) return;
  let mouseX = 0, lastX = 0;
  track.addEventListener('mousemove', e=>{
    const rect = track.getBoundingClientRect();
    const center = rect.width/2;
    const diff = (e.clientX - rect.left - center)/center;
    track.style.transform = `perspective(1200px) rotateY(${diff*6}deg)`;
  });
  // auto-scroll slow
  let offset = 0;
  setInterval(()=>{
    if(!track) return;
    offset = (offset + 0.3) % (track.scrollWidth);
    track.scrollLeft = offset;
  }, 40);
}
