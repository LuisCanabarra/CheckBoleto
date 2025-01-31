import OpenAI from 'openai';

export default async function handler(req, res) {
    try {
        console.log('Dados recebidos:', req.body);
        
        if (req.method !== 'POST') {
            return res.status(405).json({ error: 'Método não permitido' });
        }

        const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY
        });

        const { boletoData } = req.body;

        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [{ role: "user", content: `Analise: ${boletoData}` }]
        });

        const resultado = response.choices[0].message.content;

        res.status(200).json({ 
            status: 'success', 
            analise: resultado 
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
