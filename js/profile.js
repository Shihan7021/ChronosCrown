firebase.auth().onAuthStateChanged(user => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  // Load current user info
  db.collection("users").doc(user.uid).get().then(doc => {
    const data = doc.data();
    document.getElementById("profileName").value = data.displayName || "";
    document.getElementById("profileAddress").value = data.address || "";
  });

  // Save profile changes
  document.getElementById("profileForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const name = document.getElementById("profileName").value;
    const address = document.getElementById("profileAddress").value;

    db.collection("users").doc(user.uid).update({
      displayName: name,
      address: address
    }).then(() => {
      alert("Profile updated!");
    });
  });

  // Change password
  document.getElementById("passwordForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const newPassword = document.getElementById("newPassword").value;

    user.updatePassword(newPassword).then(() => {
      alert("Password changed successfully!");
    }).catch(err => {
      alert("Error: " + err.message);
    });
  });
});
