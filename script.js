// script.js
async function analyzeBoleto() {
    const fileInput = document.getElementById("fileInput");
    const responseDiv = document.getElementById("response");
    const loadingDiv = document.getElementById("loading");
    
    if (!fileInput.files.length) {
        alert("Por favor, selecione um arquivo.");
        return;
    }

    const file = fileInput.files[0];
    const maxSize = 5 * 1024 * 1024; // 5MB
    
    if (file.size > maxSize) {
        alert("O arquivo é muito grande. Por favor, selecione um arquivo menor que 5MB.");
        return;
    }
    
    // Validar tipo do arquivo
    const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
        alert("Formato de arquivo não suportado. Por favor, use PDF, JPG ou PNG.");
        return;
    }
    
    // Desabilitar input e mostrar loading
    fileInput.disabled = true;
    loadingDiv.style.display = "block";
    responseDiv.innerHTML = "";
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
        const response = await fetch("/api/check-boleto", {
            method: "POST",
            body: formData
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Erro ao processar o documento');
        }
        
        const data = await response.json();
        responseDiv.innerHTML = `
            <div class="response-container">
                <pre class="response-text">${data.analise}</pre>
            </div>
        `;
        
    } catch (error) {
        responseDiv.innerHTML = `
            <div class="error-container">
                <p>Ocorreu um erro durante a análise:</p>
                <p>${error.message}</p>
                <p>Por favor, verifique o arquivo e tente novamente em alguns instantes.</p>
            </div>
        `;
    } finally {
        fileInput.disabled = false;
        loadingDiv.style.display = "none";
    }
}
