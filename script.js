import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.10.377/pdf.worker.min.js";

document.addEventListener('DOMContentLoaded', function() {
const boletoInput = document.getElementById('fileInput');
const analisarButton = document.querySelector('button');
const resultadoDiv = document.getElementById('response');

if(analisarButton) {
analisarButton.addEventListener('click', async () => {
    const file = boletoInput.files[0];
    if (!file) {
        resultadoDiv.innerHTML = "<p style='color: #e74c3c;'>Por favor, selecione um arquivo.</p>";
        return;
    }

    // Desabilitar input e botão durante o processamento
    boletoInput.disabled = true;
    analisarButton.disabled = true;
    resultadoDiv.innerHTML = "<p>Processando documento...</p>";

   try {
        let text = ""
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
                 // Adiciona delay antes de nova requisição
                  await new Promise(resolve => setTimeout(resolve, 2000));

                    const formData = new FormData();
                    formData.append('boleto', new Blob([text],{type:"text/plain"}));

                    const response = await fetch("/api/check-boleto", {
                      method: "POST",
                       body: formData
                    });

                    if (!response.ok) {
                        const errorText = await response.text();
                        throw new Error(`Erro na análise: ${response.status} - ${errorText}`);
                    }

                    const data = await response.json();
                     resultadoDiv.innerHTML = `
                      <div style="background: #f5f5f5; padding: 15px; border-radius: 8px;">
                            <pre style="white-space: pre-wrap; margin: 0;">${data.analise}</pre>
                       </div>
                    `;


                 } catch (error) {
                   console.error('Erro ao processar PDF:', error);
                    resultadoDiv.innerHTML = `
                        <div style="background: #fff3f3; padding: 15px; border-radius: 8px; color: #cc0000;">
                            <p>Erro na análise. Por favor, aguarde alguns segundos e tente novamente.</p>
                            <p>Detalhes: ${error.message}</p>
                       </div>
                   `;
                 } finally {
                   boletoInput.disabled = false;
                     analisarButton.disabled = false;
               }

             };
              reader.onerror = () => {
                 responseDiv.innerHTML = "<p>Erro ao ler arquivo. Tente novamente.</p>";
                   boletoInput.disabled = false;
                   analisarButton.disabled = false;
              };
            reader.readAsArrayBuffer(file);
            } else {
                  const reader = new FileReader();

                    reader.onload = async function(event) {
                        try {
                            const arrayBuffer = event.target.result;

                            const formData = new FormData();
                            formData.append('boleto', new Blob([arrayBuffer]));
                            // Adiciona delay antes de nova requisição
                             await new Promise(resolve => setTimeout(resolve, 2000));

                            const response = await fetch("/api/check-boleto", {
                                method: "POST",
                                 body: formData
                            });

                            if (!response.ok) {
                                const errorText = await response.text();
                                throw new Error(`Erro na análise: ${response.status} - ${errorText}`);
                            }

                            const data = await response.json();
                             resultadoDiv.innerHTML = `
                                <div style="background: #f5f5f5; padding: 15px; border-radius: 8px;">
                                    <pre style="white-space: pre-wrap; margin: 0;">${data.analise}</pre>
                                </div>
                            `;


                        } catch (error) {
                            resultadoDiv.innerHTML = `
                                <div style="background: #fff3f3; padding: 15px; border-radius: 8px; color: #cc0000;">
                                    <p>Erro na análise. Por favor, aguarde alguns segundos e tente novamente.</p>
                                    <p>Detalhes: ${error.message}</p>
                                </div>
                            `;
                        } finally {
                             // Reabilitar input e botão após o processamento
                            boletoInput.disabled = false;
                           analisarButton.disabled = false;
                        }
                    };
                      reader.onerror = () => {
                      responseDiv.innerHTML = "<p>Erro ao ler arquivo. Tente novamente.</p>";
                        boletoInput.disabled = false;
                        analisarButton.disabled = false;
                   };
                     reader.readAsArrayBuffer(file);
           }
        } catch(error){
            resultadoDiv.innerHTML = `
                 <div style="background: #fff3f3; padding: 15px; border-radius: 8px; color: #cc0000;">
                      <p>Erro na análise. Por favor, aguarde alguns segundos e tente novamente.</p>
                      <p>Detalhes: ${error.message}</p>
                 </div>
             `;
             boletoInput.disabled = false;
              analisarButton.disabled = false;
        }
    });
}
});
