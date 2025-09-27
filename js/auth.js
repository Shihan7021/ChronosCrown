firebase.auth().onAuthStateChanged(user => {
  const loginLink = document.getElementById("loginLink");
  const registerLink = document.getElementById("registerLink");
  const userMenu = document.getElementById("userMenu");
  const greetingText = document.getElementById("greetingText");

  if (user) {
    // Hide login/register
    if (loginLink) loginLink.style.display = "none";
    if (registerLink) registerLink.style.display = "none";

    // Show user menu
    if (userMenu) userMenu.classList.remove("hidden");

    // Get user name from Firestore
    db.collection("users").doc(user.uid).get().then(doc => {
      const data = doc.data();
      if (data && data.displayName) {
        greetingText.innerText = `Hi ${data.displayName}`;
      } else {
        greetingText.innerText = "Hi!";
      }
    });
  } else {
    // Show login/register
    if (loginLink) loginLink.style.display = "inline";
    if (registerLink) registerLink.style.display = "inline";

    // Hide user menu
    if (userMenu) userMenu.classList.add("hidden");
  }
});

// Logout
const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    firebase.auth().signOut();
  });
}


if (document.getElementById("homepageGreeting")) {
  if (user) {
    db.collection("users").doc(user.uid).get().then(doc => {
      const data = doc.data();
      document.getElementById("homepageGreeting").innerText =
        `Hi ${data.displayName}, welcome back to ChronosCrown!`;
    });
  } else {
    document.getElementById("homepageGreeting").innerText = "";
  }
}
