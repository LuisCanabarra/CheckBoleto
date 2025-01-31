export default async function handler(req, res) {
    if (req.method === 'POST') {
        try {
            const { boletoData } = req.body;
            
            // Configurar prompt para ChatGPT
            const prompt = `Analise este boleto: ${boletoData}. 
            Forneça detalhes sobre: 
            - Validade do boleto
            - Valor 
            - Data de vencimento`;
            
            // Chamada para OpenAI (exemplo)
            const openaiResponse = await callOpenAI(prompt);
            
            res.status(200).json({ 
                status: 'success',
                details: openaiResponse
            });
        } catch (error) {
            res.status(500).json({ 
                status: 'error', 
                message: error.message 
            });
        }
    } else {
        res.status(405).end('Method Not Allowed');
    }
}

// Função para chamar OpenAI
async function callOpenAI(prompt) {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: "gpt-3.5-turbo",
            messages: [{ role: "user", content: prompt }]
        })
    });
    
    const data = await response.json();
    return data.choices[0].message.content;
}
