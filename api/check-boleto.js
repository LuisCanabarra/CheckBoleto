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
        const prompt = `Analise este boleto: ${boletoData}. 
        Forneça detalhes sobre: 
        - Validade do boleto
        - Valor 
        - Data de vencimento`;

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
