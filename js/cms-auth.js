const loginForm = document.getElementById("cmsLoginForm");

loginForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  auth.signInWithEmailAndPassword(email, password)
    .then(async (cred) => {
      const userDoc = await db.collection("cmsUsers").doc(cred.user.uid).get();
      if (userDoc.exists && userDoc.data().role === "system") {
        window.location.href = "cms-dashboard.html";
      } else {
        document.getElementById("loginMessage").innerText = "Not authorized.";
        auth.signOut();
      }
    })
    .catch(err => {
      document.getElementById("loginMessage").innerText = err.message;
    });
});

function logout() {
  auth.signOut().then(() => {
    window.location.href = "cms-login.html";
  });
}
