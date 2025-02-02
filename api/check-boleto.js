import { GoogleGenerativeAI } from "@google/generative-ai";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 3000;
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 2500
    }
});

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método não permitido' });
    }

    try {
        const now = Date.now();
        const timeSinceLastRequest = now - lastRequestTime;

        if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
            await new Promise(resolve =>
                setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLastRequest)
            );
        }

        lastRequestTime = Date.now();

        const { fileData } = req.body;
        if (!fileData) {
            return res.status(400).json({ error: 'Dados do arquivo não recebidos' });
        }

        const prompt = `Analise a imagem do boleto e retorne um objeto JSON com as seguintes informações:

        {
            "analise_boleto": {
                "identificacao_banco": {
                    "logo": "[Nome do Banco do Logotipo]",
                    "linha_digitavel": "[Linha Digitável Completa]",
                    "tres_primeiros_digitos": "[Três Primeiros Dígitos]",
                    "banco_febraban": "[Nome do Banco (Febraban)]",
                    "discrepancia_banco": "[true ou false]",
                    "alerta_banco": "[Mensagem de alerta (se houver)]"
                },
                "verificacao_valor": {
                    "valor_exibido": "[Valor Exibido]",
                    "valor_digitavel": "[Valor da Linha Digitável]",
                    "discrepancia_valor": "[true ou false]",
                    "alerta_valor": "[Mensagem de alerta (se houver)]"
                },
                "consistencia_geral": "[Resultado]",
                "informacoes_adicionais": {
                   "local_pagamento": "[Local de Pagamento]",
                   "alerta_local_pagamento": "[Alerta Local de Pagamento (se houver)]"
                },
                "dados_beneficiario": {
                    "nome_beneficiario": "[Nome do Beneficiário]",
                    "cnpj_cpf": "[CNPJ/CPF]",
                    "situacao_cadastral": "[Situação Cadastral]",
                    "reputacao_reclamacoes": "[Reputação (Reclame Aqui)]"
                },
                "analise_imagem": "[Análise da Imagem]",
                "recomendacoes": "[Recomendações]",
                "status": "[ok, alerta, perigo]"
            },
            "observacoes": "[Observações]"
        }

        * Retorne **apenas o objeto JSON**, sem nenhum caractere adicional (como \`\`\`json ou texto).
        * Use "null" para dados ausentes.
        * Use "" para strings vazias.
        * Use "true" ou "false" para booleanos.
        * O status deve ser: "ok" (legítimo), "alerta" (inconsistência), ou "perigo" (fraude).

         Dados para análise: ${fileData}
        `;


        const result = await Promise.race([
            model.generateContent({
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: 0.1,
                    maxOutputTokens: 2500
                }
            }),
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Tempo limite excedido')), 15000)
            )
        ]);

        if (!result || !result.response) {
            throw new Error('Resposta inválida da API');
        }

        const response = await result.response;
        let texto = response.text();


         // Remover delimitadores de código e espaços em branco
         texto = texto.replace(/^```(json)?\s*|```\s*$/g, '');
         try {
            const analiseJSON = JSON.parse(texto);
                res.status(200).json({
                    analise: analiseJSON,
                    timestamp: Date.now()
                 });
           } catch (e) {
               res.status(500).json({
                    error: "Erro ao analisar a resposta da API, verifique o formato do JSON",
                    message: e.message,
                    raw: texto,
                  });
               }

    } catch (error) {
        console.error('Erro detalhado:', error);

        res.status(500).json({
            error: 'Erro ao processar documento',
            message: error.message
        });
    }
}
