// api/check-boleto.js
import { GoogleGenerativeAI } from "@google/generative-ai";

let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 2000; // 2 segundos entre requisições

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método não permitido' });
    }

    try {
        // Controle de taxa de requisições
        const now = Date.now();
        const timeSinceLastRequest = now - lastRequestTime;
        
        if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
            await new Promise(resolve => 
                setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLastRequest)
            );
        }
        
        lastRequestTime = Date.now();

        const { boletoData } = req.body;

        if (!boletoData) {
            return res.status(400).json({ error: 'Dados não recebidos' });
        }

        // Criar nova instância da API para cada requisição
        const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
        const model = genAI.getGenerativeModel({ 
            model: "gemini-pro",
            generationConfig: {
                temperature: 0.1,
                maxOutputTokens: 1024,
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

        const result = await Promise.race([
            model.generateContent(prompt + "\n\nDados:\n" + boletoData),
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Timeout')), 15000)
            )
        ]);

        const response = await result.response;
        const texto = response.text();

        res.status(200).json({ 
            analise: texto,
            timestamp: Date.now() 
        });

    } catch (error) {
        console.error('Erro:', error);
        res.status(500).json({ 
            error: 'Erro ao processar documento',
            message: error.message
        });
    }
}
