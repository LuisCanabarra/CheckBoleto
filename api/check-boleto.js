// api/check-boleto.js
import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método não permitido' });
    }

    try {
        console.log('Iniciando processamento');
        const { boletoData } = req.body;

        if (!boletoData) {
            console.log('Dados não recebidos');
            return res.status(400).json({ error: 'Dados não recebidos' });
        }

        const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
        console.log('API inicializada');

        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        const prompt = `Analise este texto e extraia:
        - Valor do boleto
        - Data de vencimento
        - Nome do beneficiário
        - Validação do documento`;

        console.log('Enviando para API');
        const result = await model.generateContent(prompt + "\n\nDados:\n" + boletoData);
        console.log('Resposta recebida');

        const response = await result.response;
        const texto = response.text();

        console.log('Enviando resposta');
        res.status(200).json({ analise: texto });

    } catch (error) {
        console.error('Erro detectado:', error);
        res.status(500).json({ error: 'Erro ao processar documento' });
    }
}
