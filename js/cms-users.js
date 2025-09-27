const userForm = document.getElementById("userForm");
const userList = document.getElementById("userList");

userForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("userEmail").value;

  // Add to cmsUsers collection
  await db.collection("cmsUsers").add({
    email: email,
    role: "system",
    createdAt: new Date()
  });
  alert("System user added. Set password manually in Firebase Auth.");
});

db.collection("cmsUsers").onSnapshot(snapshot => {
  userList.innerHTML = "";
  snapshot.forEach(doc => {
    const data = doc.data();
    userList.innerHTML += `
      <div>
        <p>${data.email} (${data.role})</p>
      </div>`;
  });
});
