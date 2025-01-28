// Seleciona os elementos da página
const fileInput = document.getElementById('fileInput');
const analyzeButton = document.getElementById('analyzeButton');
const responseArea = document.getElementById('responseArea');

// Função para converter o arquivo para Base64
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]); // Retorna apenas o conteúdo Base64
    reader.onerror = error => reject(error);
    reader.readAsDataURL(file);
  });
}

// Função para enviar o arquivo e o prompt para a API Gemini
analyzeButton.addEventListener('click', async () => {
  const file = fileInput.files[0];
  if (!file) {
    responseArea.innerHTML = '<strong>Por favor, selecione um arquivo.</strong>';
    return;
  }

  responseArea.innerHTML = 'Analisando...';

  try {
    const base64File = await fileToBase64(file);

    // Aqui está o prompt e o arquivo a serem enviados à API
    const payload = {
      prompt: "Analise se este boleto é legítimo ou falso com base nas informações fornecidas.",
      file: base64File
    };

    // Substitua 'SUA_CHAVE_DE_API_AQUI' pela chave de API que você obteve no Google Cloud
    const response = await fetch('https://www.googleapis.com/auth/cloud-platform', {
      method: 'POST',
      headers: {
        'Authorization': AIzaSyDQsCC8C2DEABb7-doPorIjkGi5vzTU4aQ , // Adicione sua chave aqui
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) throw new Error('Erro na análise. Verifique o arquivo enviado.');

    const result = await response.json();
    responseArea.innerHTML = `<strong>Resultado:</strong> ${result.analysis}`;
  } catch (error) {
    responseArea.innerHTML = `<strong>Erro:</strong> ${error.message}`;
  }
});
