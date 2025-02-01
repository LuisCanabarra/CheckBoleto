import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
    try {
        if (req.method !== 'POST') {
            return res.status(405).json({ error: 'Método não permitido' });
        }

        const { boletoData } = req.body;
        
        if (!boletoData) {
            throw new Error('Dados do documento não recebidos');
        }

        // Inicializar Gemini API
        const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
        
        if (!process.env.GOOGLE_API_KEY) {
            throw new Error('Chave da API Google não configurada');
        }

        // Usar modelo básico primeiro
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        const prompt = `Analise este documento e forneça as informações no seguinte formato:

        VALOR:
        [Valor em reais]

        VENCIMENTO:
        [Data]

        BENEFICIÁRIO:
        [Nome]

        VALIDAÇÃO:
        [Status de validação]`;

        const result = await model.generateContent(prompt + boletoData);
        const response = await result.response;
        const texto = response.text();

        res.status(200).json({ 
            status: 'success', 
            analise: texto 
        });

    } catch (error) {
        console.error('Erro completo:', error);
        
        res.status(500).json({ 
            status: 'error', 
            message: error.message,
            detalhes: 'Erro ao processar documento. Por favor, tente novamente.'
        });
    }
}
