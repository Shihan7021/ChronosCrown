const promoForm = document.getElementById("promotionForm");
const promoList = document.getElementById("promoList");

promoForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const promoName = document.getElementById("promoName").value;
  const discount = document.getElementById("discount").value;
  const start = document.getElementById("startDate").value;
  const end = document.getElementById("endDate").value;

  await db.collection("promotions").add({
    promoName, discount, start, end
  });

  alert("Promotion Added!");
});

db.collection("promotions").onSnapshot(snapshot => {
  promoList.innerHTML = "";
  snapshot.forEach(doc => {
    const data = doc.data();
    promoList.innerHTML += `
      <p>${data.promoName} - ${data.discount}% (${data.start} to ${data.end})</p>`;
  });
});
