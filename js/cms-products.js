const productForm = document.getElementById("productForm");
const productList = document.getElementById("productList");

productForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = document.getElementById("productName").value;
  const price = document.getElementById("productPrice").value;
  const strap = document.getElementById("productStrap").value;
  const color = document.getElementById("productColor").value;
  const size = document.getElementById("productSize").value;
  const file = document.getElementById("productImage").files[0];

  let imageUrl = "";
  if (file) {
    const storageRef = storage.ref("products/" + file.name);
    await storageRef.put(file);
    imageUrl = await storageRef.getDownloadURL();
  }

  await db.collection("products").add({
    name, price, strap, color, size, imageUrl, stock: true
  });

  alert("Product added!");
});

db.collection("products").onSnapshot(snapshot => {
  productList.innerHTML = "";
  snapshot.forEach(doc => {
    const data = doc.data();
    productList.innerHTML += `
      <div class="product-item">
        <img src="${data.imageUrl}" width="50">
        <p>${data.name} - $${data.price}</p>
        <button onclick="deleteProduct('${doc.id}')">Delete</button>
      </div>`;
  });
});

function deleteProduct(id) {
  db.collection("products").doc(id).delete();
}
