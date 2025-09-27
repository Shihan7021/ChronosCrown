db.collection("orders").onSnapshot(snapshot => {
  const orderList = document.getElementById("orderList");
  orderList.innerHTML = "";
  snapshot.forEach(doc => {
    const data = doc.data();
    orderList.innerHTML += `
      <div>
        <p>Order #${doc.id} - ${data.status}</p>
        <button onclick="updateOrder('${doc.id}', 'Shipped')">Mark Shipped</button>
      </div>`;
  });
});

function updateOrder(id, status) {
  db.collection("orders").doc(id).update({ status });
}
