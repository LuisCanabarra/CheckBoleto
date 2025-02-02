import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.10.377/pdf.worker.min.js";

const boletoInput = document.getElementById('fileInput');
const verificarBtn = document.querySelector('button');
const resultadoDiv = document.getElementById('response');

verificarBtn.addEventListener("click", analyzeBoleto);

async function analyzeBoleto() {
    const file = boletoInput.files[0];
    if (!file) {
        resultadoDiv.innerHTML = "<p style='color: #e74c3c;'>Por favor, selecione um arquivo.</p>";
        return;
    }

    // Desabilitar input e botão durante o processamento
    boletoInput.disabled = true;
    verificarBtn.disabled = true;
    resultadoDiv.innerHTML = "<p>Processando documento...</p>";

    try {
        let text = "";
        if (file.type === 'application/pdf') {
            const reader = new FileReader();

            reader.onload = async function (event) {
                try {
                    const pdfData = new Uint8Array(event.target.result);
                    const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;

                    for (let i = 1; i <= pdf.numPages; i++) {
                        const page = await pdf.getPage(i);
                        const content = await page.getTextContent();
                        text += content.items.map(s => s.str).join(" ");
                    }

                    await sendToAPI(text);
                } catch (error) {
                    showError(error);
                }
            };

            reader.readAsArrayBuffer(file);
        } else {
            const reader = new FileReader();

            reader.onload = async function (event) {
                try {
                    await sendToAPI(event.target.result);
                } catch (error) {
                    showError(error);
                }
            };

            reader.readAsArrayBuffer(file);
        }
    } catch (error) {
        showError(error);
    }
}

async function sendToAPI(data) {
    try {
        const formData = new FormData();
        formData.append('boleto', new Blob([data], { type: "text/plain" }));

        // Pequeno delay para evitar requisições muito rápidas
        await new Promise(resolve => setTimeout(resolve, 2000));

        const response = await fetch("/api/check-boleto", {
            method: "POST",
            body: formData
        });

        if (!response.ok) {
            throw new Error(`Erro na análise: ${response.status} - ${await response.text()}`);
        }

        const result = await response.json();
        resultadoDiv.innerHTML = `
            <div style="background: #f5f5f5; padding: 15px; border-radius: 8px;">
                <pre style="white-space: pre-wrap; margin: 0;">${result.analise}</pre>
            </div>
        `;
    } catch (error) {
        showError(error);
    } finally {
        boletoInput.disabled = false;
        verificarBtn.disabled = false;
    }
}

function showError(error) {
    resultadoDiv.innerHTML = `
        <div style="background: #fff3f3; padding: 15px; border-radius: 8px; color: #cc0000;">
            <p>Erro na análise. Por favor, aguarde alguns segundos e tente novamente.</p>
            <p>Detalhes: ${error.message}</p>
        </div>
    `;
    boletoInput.disabled = false;
    verificarBtn.disabled = false;
}
