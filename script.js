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
        const fileContent = event.target.result;
        const url = "/api/check-boleto"; // Rota da API no Vercel
        
        try {
            const response = await fetch(url, {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json" 
                },
                body: JSON.stringify({ boletoData: fileContent })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            responseDiv.innerHTML = `<p>Resposta: ${JSON.stringify(result)}</p>`;
        } catch (error) {
            console.error("Erro detalhado:", error);
            responseDiv.innerHTML = `<p>Erro ao verificar boleto: ${error.message}</p>`;
        }
    };
    
    reader.readAsText(file);
}
