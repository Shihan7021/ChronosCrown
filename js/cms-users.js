// cms-users.js
import { auth, db } from './firebase-config.js'; // path is relative to /js
import {
  collection,
  query,
  where,
  getDocs,
  onSnapshot,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

const usersTbody = document.getElementById('usersTable');
const userAddForm = document.getElementById('userAddForm');

const detailCard = document.getElementById('userDetailCard');
const detailId = document.getElementById('detailId');
const detailEmail = document.getElementById('detailEmail');
const detailName = document.getElementById('detailName');
const detailRole = document.getElementById('detailRole');
const saveUserBtn = document.getElementById('saveUserBtn');
const resetPwdBtn = document.getElementById('resetPwdBtn');
const deleteUserBtn = document.getElementById('deleteUserBtn');

let lastSnapshotUnsub = null;

// load system users (role not 'user') and listen live
async function listenUsers() {
  const q = query(collection(db, 'users')); // all users; we'll filter later client-side
  if (lastSnapshotUnsub) lastSnapshotUnsub(); // detach previous
  lastSnapshotUnsub = onSnapshot(q, snapshot => {
    const rows = [];
    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      // show only system-level accounts (Admin/Manager/Associate)
      if (data.role && (data.role === 'Admin' || data.role === 'Manager' || data.role === 'Associate')) {
        rows.push({ id: docSnap.id, ...data });
      }
    });
    renderUsers(rows);
  }, err => {
    console.error('users listen error', err);
    usersTbody.innerHTML = '<tr><td colspan="5">Error loading users</td></tr>';
  });
}

function renderUsers(rows) {
  if (!rows.length) {
    usersTbody.innerHTML = '<tr><td colspan="5">No system users found</td></tr>';
    return;
  }
  usersTbody.innerHTML = '';
  rows.forEach(u => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="mono">${u.id}</td>
      <td>${u.email || ''}</td>
      <td>${u.displayName || ''}</td>
      <td><span class="role-badge role-${u.role.toLowerCase()}">${u.role}</span></td>
      <td>
        <div class="actions">
          <button class="btn small" data-view="${u.id}">View</button>
          <button class="btn small" data-reset="${u.id}">Reset PW</button>
          <button class="btn small btn-danger" data-delete="${u.id}">Delete</button>
        </div>
      </td>
    `;
    usersTbody.appendChild(tr);
  });

  // attach handlers
  usersTbody.querySelectorAll('[data-view]').forEach(b => b.addEventListener('click', e => openDetail(e.currentTarget.dataset.view)));
  usersTbody.querySelectorAll('[data-reset]').forEach(b => b.addEventListener('click', e => requestReset(e.currentTarget.dataset.reset)));
  usersTbody.querySelectorAll('[data-delete]').forEach(b => b.addEventListener('click', e => deleteUser(e.currentTarget.dataset.delete)));
}

function openDetail(id) {
  // load doc
  getDocThenShow(id);
}

async function getDocThenShow(id) {
  try {
    const dref = doc(db, 'users', id);
    const snap = await getDoc(dref);
    if (!snap.exists()) {
      alert('User doc not found');
      return;
    }
    const data = snap.data();
    detailCard.style.display = 'block';
    detailId.value = id;
    detailEmail.value = data.email || '';
    detailName.value = data.displayName || '';
    detailRole.value = data.role || 'Associate';
    // hide delete button if this is last admin etc (you might add checks here)
  } catch (err) {
    console.error(err);
    alert('Could not load user details');
  }
}

// Add invite record (not creating actual Auth user) — admin should use Cloud Function or console to create Auth user
userAddForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('uEmail').value.trim();
  const role = document.getElementById('uRole').value;
  const displayName = document.getElementById('uDisplayName').value.trim();

  if (!email || !role) {
    alert('Email and role required');
    return;
  }

  try {
    // write an "invite" document — a server process can pick this up and create the real Auth user
    await addDoc(collection(db, 'cms_invites'), {
      email,
      role,
      displayName: displayName || null,
      inviteRequestedAt: serverTimestamp(),
      createdBy: JSON.parse(sessionStorage.getItem('cmsUser') || '{}').uid || null
    });
    alert('Invite created in Firestore. Run your Cloud Function or create Auth user manually in Firebase Console.');
    userAddForm.reset();
  } catch (err) {
    console.error(err);
    alert('Failed creating invite: ' + err.message);
  }
});

// Save user edit (role/name)
saveUserBtn.addEventListener('click', async (e) => {
  e.preventDefault();
  const id = detailId.value;
  if (!id) return alert('No user selected');
  try {
    await updateDoc(doc(db, 'users', id), {
      displayName: detailName.value || null,
      role: detailRole.value || 'Associate',
      updatedAt: serverTimestamp()
    });
    alert('Saved');
    detailCard.style.display = 'none';
  } catch (err) {
    console.error(err);
    alert('Save failed: ' + err.message);
  }
});

// Mark resetRequested (server can send reset email)
async function requestReset(id) {
  if (!confirm('Mark password-reset requested for user? A server process should then email reset link.')) return;
  try {
    await updateDoc(doc(db, 'users', id), {
      resetRequested: true,
      resetRequestedAt: serverTimestamp()
    });
    alert('Reset request saved. Run cloud function or send reset email via console.');
  } catch (err) {
    console.error(err);
    alert('Failed: ' + err.message);
  }
}

// delete user doc (does NOT delete Auth user — admin must delete in console or Cloud Function)
// Only Admin or Manager allowed to delete — UI should hide this for Associates
async function deleteUser(id) {
  if (!confirm('Delete user document from Firestore? This will not remove Auth account.')) return;
  try {
    await deleteDoc(doc(db, 'users', id));
    alert('User document deleted. Delete Auth account manually if necessary.');
  } catch (err) {
    console.error(err);
    alert('Delete failed: ' + err.message);
  }
}

// helper to getDoc imported lazily
import { getDoc } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

// start listener after auth is ready (prevents unauthenticated snapshot errors)
auth.onAuthStateChanged(user => {
  if (user) listenUsers();
});
