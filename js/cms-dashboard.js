db.collection("products").get().then(snapshot => {
  document.getElementById("productCount").innerText = snapshot.size;
});

db.collection("orders").get().then(snapshot => {
  document.getElementById("orderCount").innerText = snapshot.size;
  const pending = snapshot.docs.filter(doc => doc.data().status === "Pending").length;
  document.getElementById("pendingCount").innerText = pending;
});
