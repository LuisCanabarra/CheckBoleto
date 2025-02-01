import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
    try {
        if (req.method !== 'POST') {
            return res.status(405).json({ error: 'Método não permitido' });
        }

        // Adiciona delay entre requisições
        await new Promise(resolve => setTimeout(resolve, 1000));

        const { boletoData } = req.body;
        
        if (!boletoData) {
            throw new Error('Dados do documento não recebidos');
        }

        // Inicializar Gemini API com retry
        const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
        
        if (!process.env.GOOGLE_API_KEY) {
            throw new Error('Chave da API Google não configurada');
        }

        const model = genAI.getGenerativeModel({ 
            model: "gemini-pro",
            generationConfig: {
                temperature: 0.3,
                maxOutputTokens: 2048,
            }
        });

        const prompt = `Analise este documento e forneça as informações no seguinte formato:

        VALOR:
        [Valor em reais]

        VENCIMENTO:
        [Data]

        BENEFICIÁRIO:
        [Nome]

        VALIDAÇÃO:
        [Status de validação]`;

        // Adiciona retry logic
        let attempts = 0;
        const maxAttempts = 3;
        let result;

        while (attempts < maxAttempts) {
            try {
                result = await model.generateContent(prompt + boletoData);
                break;
            } catch (error) {
                attempts++;
                if (attempts === maxAttempts) throw error;
                await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
            }
        }

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
            message: 'Erro ao processar documento. Por favor, aguarde alguns segundos e tente novamente.',
            detalhes: error.message
        });
    }
}
