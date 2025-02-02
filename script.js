// script.js
async function analyzeBoleto() {
    const fileInput = document.getElementById("fileInput");
    const verifyButton = document.getElementById("verifyButton");
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
    
    try {
        verifyButton.disabled = true;
        loadingDiv.style.display = "block";
        responseDiv.innerHTML = "";
        
        // Converter arquivo para base64
        const base64Data = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
            reader.readAsDataURL(file);
        });
        
        const response = await fetch("/api/check-boleto", {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                fileData: base64Data
            })
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
        verifyButton.disabled = false;
        loadingDiv.style.display = "none";
    }
}

// Adicionar evento para atualizar estado do botão quando um arquivo é selecionado
document.getElementById("fileInput").addEventListener("change", function() {
    const verifyButton = document.getElementById("verifyButton");
    verifyButton.disabled = !this.files.length;
});
