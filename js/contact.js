// contact.js — performs client-side Firestore write to `contacts` collection
import { db } from './js/firebase.init.js'; // firebase.init.js exports 'db'
import { collection, addDoc } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

const form = document.getElementById('contactForm');
const statusEl = document.getElementById('contactStatus');

if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    statusEl.textContent = 'Sending...';

    const payload = {
      name: form.name.value.trim(),
      email: form.email.value.trim(),
      phone: form.phone.value.trim() || null,
      orderId: form.orderId.value.trim() || null,
      subject: form.subject.value.trim(),
      message: form.message.value.trim(),
      createdAt: new Date().toISOString(),
      status: 'new'
    };

    try {
      await addDoc(collection(db, 'contacts'), payload);
      statusEl.style.color = 'green';
      statusEl.textContent = 'Message sent — our team will reply within 48 hours.';
      form.reset();
    } catch (err) {
      console.error(err);
      statusEl.style.color = 'crimson';
      statusEl.textContent = 'Unable to send message. Please try again later.';
    }
    setTimeout(()=> { statusEl.textContent = ''; statusEl.style.color = ''; }, 7000);
  });
}
