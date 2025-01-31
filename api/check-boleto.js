import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
    try {
        if (req.method !== 'POST') {
            return res.status(405).json({ error: 'Método não permitido' });
        }

        const { boletoData } = req.body;

        // Inicializar Gemini API
        const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        // Criar prompt
        const prompt = `Você é um especialista em análise de boletos bancários.
Analise este boleto: ${boletoData}.

Por favor forneça:
1. Valor do boleto
2. Data de vencimento
3. Nome do beneficiário
4. Banco emissor
5. Se o boleto é válido ou possui alguma irregularidade
6. Linha digitável
7. Código de barras

Organize a resposta em tópicos claros e objetivos.`;
        // Gerar resposta
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const texto = response.text();

        res.status(200).json({ 
            status: 'success', 
            analise: texto 
        });

    } catch (error) {
        console.error('Erro detalhado:', error);
        res.status(500).json({ 
            status: 'error', 
            message: error.message,
            detalhes: error.toString()
        });
    }
}
