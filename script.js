document.addEventListener('DOMContentLoaded', function() {
    const fileInput = document.getElementById('fileInput');
    const verifyButton = document.getElementById('verifyButton');
    const loadingDiv = document.getElementById('loading');
    const responseDiv = document.getElementById('response');
     const pdfContainer = document.getElementById('pdfContainer')
    const textoManualDiv = document.getElementById('textoManual')
    const textoBoletoArea = document.getElementById('textoBoleto')


    fileInput.addEventListener('change', function() {
        verifyButton.disabled = !fileInput.files.length;
    });

     window.analyzeBoleto = async function() {
        const file = fileInput.files[0];

        if (!file) {
            alert("Por favor, selecione um arquivo!");
            return;
        }

         loadingDiv.style.display = 'block';
        responseDiv.innerHTML = ''; // Limpa a resposta anterior
        textoManualDiv.style.display = 'none'
          pdfContainer.innerHTML = "" // Limpa o pdf anterior
          pdfContainer.style.display = 'block'

         const reader = new FileReader();
        reader.readAsDataURL(file);

         reader.onload = async function() {
              loadingDiv.style.display = 'none';
            try{
               const base64PDF = reader.result;


                  const embed = document.createElement('embed');
                   embed.src = base64PDF;
                   embed.type = 'application/pdf';
                  embed.width = "100%";
                  embed.height = "600px";

                pdfContainer.appendChild(embed)


            } catch (error) {
                loadingDiv.style.display = 'none';
                 responseDiv.innerHTML = `<div class="error-container">Erro ao processar requisição: ${error.message}</div>`;
                console.error('Erro durante a requisição:', error);
             }
             textoManualDiv.style.display = 'block'
        };
         reader.onerror = function (error) {
            loadingDiv.style.display = 'none';
             responseDiv.innerHTML = `<div class="error-container">Erro ao ler arquivo: ${error.message}</div>`;
            console.log('Error: ', error);
          };

    };
     window.analyzeText = async function() {
           const textoBoleto = textoBoletoArea.value
            if(!textoBoleto) {
                alert("Por favor, cole o texto do boleto no campo")
              return
          }
           loadingDiv.style.display = 'block';
           responseDiv.innerHTML = '';
            try{
                  const response = await fetch('/api/check-boleto', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ fileData: textoBoleto }),
                });

                if (!response.ok) {
                    loadingDiv.style.display = 'none';
                     const errorData = await response.json()
                      responseDiv.innerHTML = `<div class="error-container">Erro na requisição: ${errorData.message}</div>`;
                    return;
                }

                const data = await response.json();
                   if (data.analise) {
                    loadingDiv.style.display = 'none';
                    // Exemplo 1: Exibir toda a análise como JSON stringificado
                    // responseDiv.innerHTML = `<div class="response-container"><pre>${JSON.stringify(data.analise, null, 2)}</pre></div>`;
                     // Exemplo 2: Exibir propriedades específicas
                      const analise = data.analise.analise_boleto;
                     let html = '<div class="response-container">';
                      html += `<h2>Análise do Boleto</h2>`;

                        html += `<h3>Identificação do Banco Emissor</h3>`
                        html += `<p><strong>Logotipo:</strong> ${analise.identificacao_banco.logo || 'Não identificado'}</p>`
                        html += `<p><strong>Linha Digitável:</strong> ${analise.identificacao_banco.linha_digitavel || 'Não identificado'}</p>`
                        html += `<p><strong>Três Primeiros Dígitos:</strong> ${analise.identificacao_banco.tres_primeiros_digitos || 'Não identificado'}</p>`
                        html += `<p><strong>Banco (Febraban):</strong> ${analise.identificacao_banco.banco_febraban || 'Não identificado'}</p>`
                       if (analise.identificacao_banco.discrepancia_banco) {
                            html += `<p><strong>Discrepância:</strong> <span style="color:red">Discrepância encontrada!</span></p>`
                          }
                           if(analise.identificacao_banco.alerta_banco){
                            html += `<p><strong>Alerta Banco:</strong> <span style="color:red">${analise.identificacao_banco.alerta_banco}</span></p>`
                         }


                        html += `<h3>Verificação do Valor do Boleto</h3>`
                        html += `<p><strong>Valor Exibido:</strong> ${analise.verificacao_valor.valor_exibido || 'Não identificado'}</p>`
                        html += `<p><strong>Valor da Linha Digitável:</strong> ${analise.verificacao_valor.valor_digitavel || 'Não identificado'}</p>`
                         if (analise.verificacao_valor.discrepancia_valor) {
                            html += `<p><strong>Discrepância:</strong>  <span style="color:red">Discrepância encontrada!</span></p>`
                         }
                           if(analise.verificacao_valor.alerta_valor){
                            html += `<p><strong>Alerta Valor:</strong> <span style="color:red">${analise.verificacao_valor.alerta_valor}</span></p>`
                         }

                       html += `<h3>Consistência Geral</h3>`
                        html += `<p><strong>Resultado:</strong> ${analise.consistencia_geral || 'Não Verificado'}</p>`

                        html += `<h3>Informações Adicionais</h3>`
                        html += `<p><strong>Local de Pagamento:</strong> ${analise.informacoes_adicionais.local_pagamento || 'Não identificado'}</p>`
                         if(analise.informacoes_adicionais.alerta_local_pagamento){
                            html += `<p><strong>Alerta Local de Pagamento:</strong> <span style="color:red">${analise.informacoes_adicionais.alerta_local_pagamento}</span></p>`
                         }

                       html += `<h3>Dados do Beneficiário</h3>`
                        html += `<p><strong>Nome do Beneficiário:</strong> ${analise.dados_beneficiario.nome_beneficiario || 'Não identificado'}</p>`
                        html += `<p><strong>CNPJ/CPF:</strong> ${analise.dados_beneficiario.cnpj_cpf || 'Não identificado'}</p>`
                        html += `<p><strong>Situação Cadastral:</strong> ${analise.dados_beneficiario.situacao_cadastral || 'Não Verificado'}</p>`
                        html += `<p><strong>Reputação (Reclame Aqui):</strong> ${analise.dados_beneficiario.reputacao_reclamacoes || 'Não Verificado'}</p>`


                       html += `<h3>Análise da Imagem</h3>`
                        html += `<p><strong>Resultado:</strong> ${analise.analise_imagem || 'Não Verificado'}</p>`

                       html += `<h3>Recomendações</h3>`
                      html += `<p><strong>Recomendações:</strong> ${analise.recomendacoes || 'Sem recomendações'}</p>`

                      html += `<h3>Status</h3>`
                      html += `<p><strong>Status:</strong> ${analise.status || 'Não Verificado'}</p>`

                    html += `<h3>Observações</h3>`
                    html += `<p><strong>Observações:</strong> ${data.analise.observacoes || 'Nenhuma observação'}</p>`
                    html += '</div>';
                     responseDiv.innerHTML = html;

                 }  else {
                      loadingDiv.style.display = 'none';
                      responseDiv.innerHTML = `<div class="error-container">Erro ao processar análise. Verifique o console do navegador.</div>`;
                      console.log("Resposta sem campo de analise", data)
                    }
            } catch (error) {
                  loadingDiv.style.display = 'none';
                   responseDiv.innerHTML = `<div class="error-container">Erro ao processar requisição: ${error.message}</div>`;
                 console.error('Erro durante a requisição:', error);
             }
       };
});
