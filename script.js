async function analyzeBoleto() {
    const fileInput = document.getElementById("fileInput");
    const responseDiv = document.getElementById("response");
    
    if (!fileInput.files.length) {
        alert("Selecione um arquivo!");
        return;
    }
    
    const file = fileInput.files[0];
    const maxSize = 4 * 1024 * 1024; // 4MB

    if (file.size > maxSize) {
        alert("Arquivo muito grande! Tamanho máximo: 4MB");
        return;
    }
    
    responseDiv.innerHTML = "<p>Carregando arquivo...</p>";
    
    try {
        const fileContent = await readFileAsBase64(file);
        const url = "/api/check-boleto";
        
        responseDiv.innerHTML = "<p>Analisando documento...</p>";
        
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                boletoData: fileContent,
                fileType: file.type,
                fileName: file.name
            })
        });
        
        if (!response.ok) {
            throw new Error(`Erro no servidor: ${response.status}`);
        }
        
        const result = await response.json();
        
        // Formata a resposta em HTML com estilos
        responseDiv.innerHTML = `
            <div style="background: #f5f5f5; padding: 20px; border-radius: 8px;">
                <h3 style="color: #2c3e50; margin-bottom: 15px;">Resultado da Análise:</h3>
                ${result.analise.replace(/\n/g, '<br>')}
            </div>
        `;
    } catch (error) {
        console.error("Erro:", error);
        responseDiv.innerHTML = `
            <div style="background: #ffe6e6; padding: 20px; border-radius: 8px;">
                <p style="color: #cc0000;">Erro ao analisar documento: ${error.message}</p>
            </div>
        `;
    }
}

async function readFileAsBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
        
        if (file.type.includes('pdf')) {
            reader.readAsDataURL(file);
        } else if (file.type.includes('image')) {
            // Redimensiona imagem antes de enviar
            compressImage(file, {
                maxWidth: 1800,
                maxHeight: 1800,
                quality: 0.8
            }).then(compressedFile => {
                reader.readAsDataURL(compressedFile);
            }).catch(reject);
        } else {
            reader.readAsText(file);
        }
    });
}

function compressImage(file, options) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = URL.createObjectURL(file);
        
        img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;
            
            if (width > options.maxWidth) {
                height = height * (options.maxWidth / width);
                width = options.maxWidth;
            }
            if (height > options.maxHeight) {
                width = width * (options.maxHeight / height);
                height = options.maxHeight;
            }
            
            canvas.width = width;
            canvas.height = height;
            
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            
            canvas.toBlob(
                (blob) => resolve(new File([blob], file.name, { type: file.type })),
                file.type,
                options.quality
            );
        };
        img.onerror = reject;
    });
}
