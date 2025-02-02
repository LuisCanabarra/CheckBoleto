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
        maxOutputTokens: 2048
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

        const prompt = `Você é um especialista em análise de boletos bancários. Sua tarefa é extrair informações e identificar possíveis fraudes.

        Instruções:

        1.  Extração de Dados (Prioridade):

            *   **Banco Emissor:**
                *   Examine o logotipo do banco presente no boleto.
                *   Extraia os três primeiros dígitos da linha digitável.
                *   Compare o banco do logotipo com o banco identificado pela linha digitável.

            *   **Valor do Boleto:**
                *   Extraia o valor do boleto do campo "Valor do Documento" (ou similar).
                *   Extraia o valor codificado da linha digitável e converta para formato numérico (R$ XXX,XX).

            *   **Outros Dados:**
                *   Extraia o nome do pagador.
                *   Extraia o nome/razão social do beneficiário.
                *   Extraia o CNPJ/CPF do beneficiário.
                *   Extraia a data de vencimento.
                *   Extraia o número do documento (se disponível).
                *   Extraia o código de barras (se disponível).
                *   Extraia o "Local de Pagamento"

        2.  Análise de Fraudes (Após a Extração):

            *   **Discrepância Bancária:** Se o banco do logotipo for diferente do banco da linha digitável, registre essa discrepância.
            *   **Discrepância de Valor:** Se o valor do boleto for diferente do valor da linha digitável, registre essa discrepância.
            *   **Dados Inválidos:** Verifique se há campos obrigatórios faltando, erros de ortografia (incluindo "PAGADOR" e "FICHA DE COMPENSAÇÃO"), formatação fora do padrão ou dados inválidos (CNPJ/CPF).
            *  **Local de Pagamento:** Se o campo "Local de Pagamento" indicar um banco diferente do banco emissor, registre como suspeita.
            *   **Análise do Beneficiário:**
                *  Verifique a situação cadastral do CNPJ/CPF do beneficiário na Receita Federal.
                * Verifique a reputação do beneficiário no Reclame Aqui
            *   **Qualidade da Imagem:**
                *   Verifique se há sinais de manipulação na imagem (fontes diferentes, cortes, sobreposições).
                *   Analise a qualidade do logotipo do banco e outros elementos gráficos.

       3.  Saída (Formato Obrigatório):

            *   Apresente a saída em formato de objeto JSON, com as seguintes chaves:
                *   `banco_emissor`: { `logo`: string, `linha_digitavel`: string, `codigo_febraban`: string, `discrepancia_banco`: boolean }
                *   `valor_boleto`: { `valor_exibido`: string, `valor_digitavel`: string, `discrepancia_valor`: boolean }
                *   `pagador`: string
                *   `beneficiario`: { `nome`: string, `cnpj_cpf`: string, `situacao_cadastral`: string, `reputacao_reclamacoes`: string }
                *   `data_vencimento`: string
                *   `numero_documento`: string
                *  `codigo_barras`: string
                *  `local_pagamento`: string
                *   `analise_fraude`: { `discrepancia_banco`: boolean, `discrepancia_valor`: boolean, `dados_invalidos`: boolean, `local_pagamento_suspeito`: boolean, `imagem_suspeita`: boolean, `observacoes`: string}
                *   `status`: "ok", "alerta", "perigo" (ok se tudo estiver normal, alerta se tiver algumas inconsistências, perigo se houver forte suspeita de fraude)
                * `recomendacoes`: string
        
            *  **Importante**: Se houver qualquer suspeita de fraude, a `analise_fraude.observacoes` deve listar todas as inconsistências com detalhes sobre a discrepância entre o banco do logotipo e o código da linha digitável, a discrepância entre os valores do boleto e da linha digitável, dados inválidos, local de pagamento suspeito, e sinais de manipulação da imagem.
       
            *   A `recomendacoes` deve conter: NÃO PAGAR o boleto; Entrar em contato com a empresa/instituição por canais oficiais; Registrar um boletim de ocorrência; Alertar o banco sobre a possível fraude (apenas se houver suspeita de fraude)

        Dados para análise: ${fileData}`;

        const result = await Promise.race([
            model.generateContent({
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: 0.1,
                    maxOutputTokens: 2048
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

        try{
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
