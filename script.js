// script.js
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
        responseDiv.innerHTML = "<p>Processando...</p>";
        
        try {
            const response = await fetch("/api/check-boleto", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    boletoData: event.target.result 
                })
            });
            
            if (!response.ok) {
                throw new Error('Falha na requisição');
            }
            
            const data = await response.json();
            responseDiv.innerHTML = `<pre>${data.analise}</pre>`;
            
        } catch (error) {
            responseDiv.innerHTML = "<p>Erro na análise. Tente novamente.</p>";
        }
    };
    
    reader.readAsText(file);
}
