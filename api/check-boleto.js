import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
    try {
        if (req.method !== 'POST') {
            return res.status(405).json({ error: 'Método não permitido' });
        }

        const { boletoData, fileType, fileName } = req.body;

        const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-pro-vision" });

        const prompt = `Atue como um especialista em análise de documentos bancários.
        
        Analise este documento e forneça as informações no seguinte formato:
        
        VALOR:
        [Valor do boleto em reais]
        
        VENCIMENTO:
        [Data de vencimento]
        
        BENEFICIÁRIO:
        [Nome do beneficiário]
        
        BANCO:
        [Nome do banco emissor]
        
        LINHA DIGITÁVEL:
        [Linha digitável completa]
        
        CÓDIGO DE BARRAS:
        [Código de barras se visível]
        
        VALIDAÇÃO:
        [Indique se o documento parece válido ou se há indícios de irregularidades]
        
        OBSERVAÇÕES:
        [Quaisquer observações importantes sobre o documento]
        
        Por favor, mantenha exatamente este formato na resposta, substituindo os textos entre colchetes pelas informações encontradas.`;

        let result;
        try {
            const imageParts = [
                {
                    inlineData: {
                        data: boletoData.split(',')[1],
                        mimeType: fileType
                    }
                }
            ];
            result = await model.generateContent([prompt, ...imageParts]);
        } catch (error) {
            throw new Error(`Erro ao processar arquivo: ${error.message}`);
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
            message: `Erro ao analisar documento: ${error.message}`,
            detalhes: error.toString()
        });
    }
}
