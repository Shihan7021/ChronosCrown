db.collection("products").where("featured", "==", true)
  .onSnapshot(snapshot => {
    document.getElementById("featureList").innerHTML = "";
    snapshot.forEach(doc => {
      const data = doc.data();
      document.getElementById("featureList").innerHTML += `
        <p>${data.name}</p>`;
    });
  });

db.collection("feedback").onSnapshot(snapshot => {
  document.getElementById("feedbackList").innerHTML = "";
  snapshot.forEach(doc => {
    const data = doc.data();
    document.getElementById("feedbackList").innerHTML += `
      <div>
        <p>${data.user}: ${data.comment}</p>
      </div>`;
  });
});
