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
        let retryCount = 0;
        const maxRetries = 3;
        
        async function tryAnalysis() {
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
                responseDiv.innerHTML = `<pre style="white-space: pre-wrap; background: #f5f5f5; padding: 15px; border-radius: 5px;">${result.analise}</pre>`;
                
            } catch (error) {
                console.error("Erro:", error);
                retryCount++;
                
                if (retryCount < maxRetries) {
                    responseDiv.innerHTML = `<p>Tentando novamente... (${retryCount}/${maxRetries})</p>`;
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    await tryAnalysis();
                } else {
                    responseDiv.innerHTML = `<p style="color: red;">Erro ao analisar. Por favor, aguarde alguns segundos e tente novamente.</p>`;
                }
            }
        }
        
        await tryAnalysis();
    };
    
    reader.readAsText(file);
}
