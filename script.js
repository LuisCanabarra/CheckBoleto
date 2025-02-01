// script.js
async function analyzeBoleto() {
    const fileInput = document.getElementById("fileInput");
    const responseDiv = document.getElementById("response");
    
    if (!fileInput.files.length) {
        alert("Selecione um arquivo!");
        return;
    }
    
    // Desabilitar input durante processamento
    fileInput.disabled = true;
    responseDiv.innerHTML = "<p>Processando documento...</p>";
    
    const file = fileInput.files[0];
    const reader = new FileReader();
    
    reader.onload = async function(event) {
        try {
            // Adiciona delay antes de nova requisição
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            const response = await fetch("/api/check-boleto", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    boletoData: event.target.result,
                    timestamp: Date.now()
                })
            });
            
            if (!response.ok) {
                throw new Error(await response.text());
            }
            
            const data = await response.json();
            responseDiv.innerHTML = `
                <div style="background: #f5f5f5; padding: 15px; border-radius: 8px;">
                    <pre style="white-space: pre-wrap; margin: 0;">${data.analise}</pre>
                </div>
            `;
            
        } catch (error) {
            responseDiv.innerHTML = `
                <div style="background: #fff3f3; padding: 15px; border-radius: 8px; color: #cc0000;">
                    <p>Erro na análise. Por favor, aguarde alguns segundos e tente novamente.</p>
                    <p>Detalhes: ${error.message}</p>
                </div>
            `;
        } finally {
            // Reabilitar input após processamento
            fileInput.disabled = false;
        }
    };
    
    reader.onerror = () => {
        responseDiv.innerHTML = "<p>Erro ao ler arquivo. Tente novamente.</p>";
        fileInput.disabled = false;
    };
    
    reader.readAsText(file);
}
