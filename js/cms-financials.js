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
        const amt = new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(Number(data.total||0));
        reportDiv.innerHTML += `<p>${doc.id}: ${amt}</p>`;
      });
      const totalFmt = new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(Number(total||0));
      reportDiv.innerHTML += `<h4>Total: ${totalFmt}</h4>`;
    });
}
