import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
    try {
        if (req.method !== 'POST') {
            return res.status(405).json({ error: 'Método não permitido' });
        }

        const { boletoData, fileType } = req.body;

        // Inicializar Gemini API
        const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
        
        // Escolher o modelo baseado no tipo de arquivo
        const model = fileType.startsWith('image') 
            ? genAI.getGenerativeModel({ model: "gemini-pro-vision" })
            : genAI.getGenerativeModel({ model: "gemini-pro" });

        // Criar prompt
        const prompt = `Você é um especialista em análise de boletos bancários.
        Analise este boleto e forneça:
        1. Valor do boleto
        2. Data de vencimento
        3. Nome do beneficiário
        4. Banco emissor
        5. Se o boleto é válido ou possui alguma irregularidade
        6. Linha digitável
        7. Código de barras

        Organize a resposta em tópicos listados um em baixo do outro claros e objetivos.`;

        // Gerar conteúdo baseado no tipo de arquivo
        let result;
        if (fileType.startsWith('image')) {
            const imageParts = [
                {
                    inlineData: {
                        data: boletoData.split(',')[1],
                        mimeType: fileType
                    }
                }
            ];
            result = await model.generateContent([prompt, imageParts]);
        } else {
            result = await model.generateContent([`${prompt}\n\nConteúdo do boleto: ${boletoData}`]);
        }

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
