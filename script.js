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
        
        try {
            responseDiv.innerHTML = "<p>Analisando documento...</p>";
            
            const response = await fetch("/api/check-boleto", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ boletoData: fileContent })
            });
            
            if (!response.ok) {
                throw new Error(`Erro: ${response.status}`);
            }
            
            const result = await response.json();
            responseDiv.innerHTML = `<pre>${result.analise}</pre>`;
            
        } catch (error) {
            console.error("Erro:", error);
            responseDiv.innerHTML = `<p style="color: red;">Erro ao analisar: ${error.message}</p>`;
        }
    };
    
    reader.readAsText(file);
}
