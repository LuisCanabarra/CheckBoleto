async function analyzeBoleto() {
    const fileInput = document.getElementById("fileInput");
    const responseDiv = document.getElementById("response");

    if (!fileInput.files.length) {
        alert("Selecione um arquivo!");
        return;
    }

    const file = fileInput.files[0];
    const reader = new FileReader();
    
    reader.onload = async function(event) {
        const fileContent = event.target.result; // Aqui pegamos o conteúdo do arquivo
        const url = "https://check-boleto-luis-canabarras-projects.vercel.app/api/analyze"; // 🔴 Substitua pela URL do seu backend

        try {
            const response = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ boletoData: fileContent })
            });

            const result = await response.json();
            responseDiv.innerHTML = `<p>Resposta: ${JSON.stringify(result)}</p>`;
        } catch (error) {
            responseDiv.innerHTML = `<p>Erro ao verificar boleto.</p>`;
        }
    };

    reader.readAsText(file);
}
