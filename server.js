const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

const API_KEY = "AIzaSyDQsCC8C2DEABb7..."; // Substitua pela sua chave de API completa

// Endpoint para analisar boletos
app.post("/analyze-boleto", async (req, res) => {
  try {
    const { boletoData } = req.body;

    // Faça a chamada para a API Gemini
    const response = await axios.post(
      "https://gemini.googleapis.com/v1/your-endpoint-here",
      {
        prompt: `Analyze the following boleto data: ${boletoData}`,
        // Outros parâmetros do corpo, se necessário
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${API_KEY}`,
        },
      }
    );

    // Retorne o resultado da API para o cliente
    res.json(response.data);
  } catch (error) {
    console.error("Erro ao chamar a API Gemini:", error.response?.data || error.message);
    res.status(500).send("Erro ao processar a solicitação.");
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
