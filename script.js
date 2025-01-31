async function analyzeBoleto() {
    const fileInput = document.getElementById("fileInput");
    const responseDiv = document.getElementById("response");
    
    if (!fileInput.files.length) {
        alert("Selecione um arquivo!");
        return;
    }
    
    const file = fileInput.files[0];
    
    // Verifica se é texto ou imagem
    if (file.type.startsWith('text')) {
        // Para arquivos de texto
        const reader = new FileReader();
        reader.onload = handleFileContent;
        reader.readAsText(file);
    } else if (file.type.startsWith('image')) {
        // Para imagens
        const reader = new FileReader();
        reader.onload = handleFileContent;
        reader.readAsDataURL(file);
    } else {
        alert("Tipo de arquivo não suportado!");
        return;
    }
    
    async function handleFileContent(event) {
        const fileContent = event.target.result;
        const url = "/api/check-boleto";
        
        try {
            responseDiv.innerHTML = "<p>Analisando...</p>";
            
            const response = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    boletoData: fileContent,
                    fileType: file.type
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            responseDiv.innerHTML = `<p>Análise: ${result.analise}</p>`;
        } catch (error) {
            console.error("Erro:", error);
            responseDiv.innerHTML = `<p>Erro ao analisar: ${error.message}</p>`;
        }
    }
}
