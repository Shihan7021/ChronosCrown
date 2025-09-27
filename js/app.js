// app.js - site-wide UI helpers (parallax carousel + header behavior)
import { auth } from './firebase.init.js';
import { $ } from './utils.js';

document.addEventListener('DOMContentLoaded', ()=>{
  try { initHeader(); initCarousel(); } catch(e){ console.warn(e); }
});

function initHeader(){
  // update cart badge if present from local storage until auth loads
  const count = localStorage.getItem('cart_count') || '0';
  const badge = document.querySelector('.cart-badge');
  if(badge) badge.textContent = count;
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
