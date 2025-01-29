document.getElementById("analyzeButton").addEventListener("click", async () => {
  const boletoInput = document.getElementById("boletoInput").value;

  try {
    const response = await fetch("http://localhost:3000/analyze-boleto", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ boletoData: boletoInput }),
    });

    const result = await response.json();
    document.getElementById("result").innerText = JSON.stringify(result, null, 2);
  } catch (error) {
    console.error("Erro ao chamar o servidor:", error);
  }
});
