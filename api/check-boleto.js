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

       const prompt = `Você é um especialista em análise de boletos bancários e fraudes. Sua tarefa é analisar a imagem do boleto fornecida e gerar um relatório de análise **EM FORMATO JSON**, seguindo rigorosamente a seguinte estrutura:

        {
            "analise_boleto": {
                "identificacao_banco": {
                    "logo": "[Nome do Banco do Logotipo]",
                    "linha_digitavel": "[Linha Digitável Completa]",
                    "tres_primeiros_digitos": "[Três Primeiros Dígitos da Linha Digitável]",
                    "banco_febraban": "[Nome do Banco Correspondente (Febraban)]",
                    "discrepancia_banco": "[true se houver discrepância, false caso contrário]",
                    "alerta_banco": "[Mensagem de alerta se houver discrepância]"
                },
                "verificacao_valor": {
                    "valor_exibido": "[Valor Exibido no Boleto]",
                    "valor_digitavel": "[Valor Codificado na Linha Digitável]",
                    "discrepancia_valor": "[true se houver discrepância, false caso contrário]",
                    "alerta_valor": "[Mensagem de alerta se houver discrepância]"
                },
                "consistencia_geral": "[Resultado da Verificação da Integridade dos Dados]",
                "informacoes_adicionais": {
                    "local_pagamento": "[Local de Pagamento]",
                    "alerta_local_pagamento": "[Mensagem de alerta se o local de pagamento indicar um banco diferente do emissor]"
                },
                "dados_beneficiario": {
                    "nome_beneficiario": "[Nome do Beneficiário]",
                    "cnpj_cpf": "[CNPJ/CPF do Beneficiário]",
                    "situacao_cadastral": "[Resultado da Pesquisa na Receita Federal]",
                    "reputacao_reclamacoes": "[Resultado da Pesquisa no Reclame Aqui]"
                },
                "analise_imagem": "[Resultado da Verificação de Sinais de Manipulação na Imagem]",
                "recomendacoes": "[Recomendações de Segurança]",
                "status": "[ok, alerta, perigo]"
            },
            "observacoes": "[Observações Adicionais]"
         }
         
        
        
        Instruções adicionais:
       
        *   Preencha todos os campos dentro das chaves com as informações extraídas do boleto, seguindo rigorosamente o formato JSON especificado.
        *   Use \"true\" ou \"false\" para os campos booleanos.
        *   Se não encontrar uma informação ou se ela não for relevante, use \"null\" como valor.
        *   Use \"\" para strings vazias.
        *   Se o boleto for considerado seguro retorne o status: ok, se houver alguma inconsistência: alerta, e se houver suspeita de fraude: perigo.
        *   Em recomendacoes, inclua as seguintes instruções: NÃO PAGAR o boleto; Entrar em contato com a empresa/instituição por canais oficiais; Registrar um boletim de ocorrência; Alertar o banco sobre a possível fraude (apenas se houver suspeita de fraude)
        *   Não inclua nenhum texto ou caracteres antes ou depois do JSON.
        
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
        const texto = response.text();

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
