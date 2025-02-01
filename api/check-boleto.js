import { GoogleGenerativeAI } from "@google/generative-ai";
import { Buffer } from 'node:buffer';

let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 3000; // 3 segundos entre requisições
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash", // Alteração aqui para o modelo experimental
    generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 1024
    }
});

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

        let boletoData;
         if (req.headers['content-type'] && req.headers['content-type'].includes('application/json')) {
             boletoData = req.body.boletoData;
         } else {
            const chunks = [];
           for await(const chunk of req) {
               chunks.push(chunk);
            }
           const buffer = Buffer.concat(chunks);
           const text = buffer.toString('utf-8');
           boletoData = text;
         }

        if (!boletoData) {
             return res.status(400).json({ error: 'Dados não recebidos' });
        }

         const prompt = `Analise este documento e forneça as informações no seguinte formato:

          VALOR:
          [Valor em reais]

          VENCIMENTO:
          [Data]

          BENEFICIÁRIO:
          [Nome]

          VALIDAÇÃO:
          [Status de validação]

           Dados: ${boletoData}
        `;

        const result = await Promise.race([
            model.generateContent(prompt),
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
