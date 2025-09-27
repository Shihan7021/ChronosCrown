function filterFinancials() {
  const fromDate = document.getElementById("fromDate").value;
  const toDate = document.getElementById("toDate").value;

  db.collection("orders")
    .where("date", ">=", new Date(fromDate))
    .where("date", "<=", new Date(toDate))
    .get()
    .then(snapshot => {
      const reportDiv = document.getElementById("financialReport");
      reportDiv.innerHTML = "";
      let total = 0;
      snapshot.forEach(doc => {
        const data = doc.data();
        total += data.total;
        reportDiv.innerHTML += `<p>${doc.id}: $${data.total}</p>`;
      });
      reportDiv.innerHTML += `<h4>Total: $${total}</h4>`;
    });
}
