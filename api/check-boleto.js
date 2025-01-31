import OpenAI from 'openai';

export default async function handler(req, res) {
    if (req.method === 'POST') {
        try {
            const { boletoData } = req.body;

            // Inicializar OpenAI com chave da variável de ambiente
            const openai = new OpenAI({
                apiKey: process.env.OPENAI_API_KEY
            });

            // Criar prompt para análise
            const prompt = `Analise este boleto: ${boletoData}. 
            Forneça detalhes sobre: 
            - Validade do boleto
            - Valor 
            - Data de vencimento`;

            // Chamar API do ChatGPT
            const response = await openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [{ role: "user", content: prompt }]
            });

            // Extrair resposta
            const resultado = response.choices[0].message.content;

            res.status(200).json({ 
                status: 'success',
                analise: resultado
            });

        } catch (error) {
            console.error('Erro:', error);
            res.status(500).json({ 
                status: 'error', 
                message: error.message 
            });
        }
    } else {
        res.status(405).end('Method Not Allowed');
    }
}
