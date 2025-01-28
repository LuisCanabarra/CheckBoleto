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
    const payload = {
      prompt: "Analise se este boleto é legítimo ou falso com base nas informações fornecidas.",
      file: base64File
    };

    const response = await fetch('https://api.example.com/gemini-analyze', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer SUA_CHAVE_DE_API_AQUI',
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
