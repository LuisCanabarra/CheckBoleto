import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
    try {
        if (req.method !== 'POST') {
            return res.status(405).json({ error: 'Método não permitido' });
        }

        const { boletoData } = req.body;

        // Inicializar Gemini API
        const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        // Criar prompt
        const prompt = `Você é uma especialista em fraudes bancárias, altamente experiente na identificação de boletos falsificados. Sua missão é analisar rigorosamente um boleto, seguindo um protocolo detalhado, para garantir a segurança do usuário e prevenir golpes financeiros. Sua atenção aos detalhes é fundamental.
Analise este boleto: ${boletoData}.

Instruções:

Receba a imagem do boleto.

Execute a análise na ORDEM ESPECÍFICA:

Identificação do Banco Emissor (PRIORIDADE ABSOLUTA):

Examine o logotipo do banco presente no boleto.

EXTRAIA A LINHA DIGITÁVEL DO BOLETO.

VERIFIQUE OS TRÊS PRIMEIROS DÍGITOS DA LINHA DIGITÁVEL. CONSULTE A TABELA DE CÓDIGOS DE BANCOS DA FEBRABAN para identificar o banco CORRESPONDENTE.

Compare o banco identificado pelo LOGOTIPO com o banco identificado pelos TRÊS PRIMEIROS DÍGITOS DA LINHA DIGITÁVEL.

SE HOUVER DISCREPÂNCIA, ALERTE IMEDIATAMENTE SOBRE A PRESENÇA DE UM BOLETO FALSO. PARE A ANÁLISE NESTE PONTO E SIGA AS INSTRUÇÕES DE ALERTA.

Extração e Verificação do Valor do Boleto (CRUCIAL):

IDENTIFIQUE E REGISTRE O VALOR DO BOLETO EXIBIDO NO CAMPO "VALOR DO DOCUMENTO" (ou similar).

ANALISE A LINHA DIGITÁVEL PARA IDENTIFICAR A POSIÇÃO DO CÓDIGO DO VALOR (esta posição pode variar de acordo com o banco).

EXTRAIA O VALOR CODIFICADO NA LINHA DIGITÁVEL. CONVERTA O CÓDIGO PARA O FORMATO NUMÉRICO PADRÃO (R$ XXX,XX).

Compare o valor EXIBIDO no boleto com o valor CODIFICADO na linha digitável.

SE HOUVER QUALQUER DISCREPÂNCIA (mesmo que pequena), ALERTE IMEDIATAMENTE SOBRE A PRESENÇA DE UM BOLETO FALSO. PARE A ANÁLISE E SIGA AS INSTRUÇÕES DE ALERTA.

Consistência Geral (Apenas se as Etapas 2.1 e 2.2 forem aprovadas):

Verifique a integridade de todos os dados (preenchimento completo dos campos obrigatórios).

Procure por erros de ortografia, digitação ou formatação (seja extremamente criteriosa), incluindo os termos "PAGADOR" e "FICHA DE COMPENSAÇÃO", que devem ser grafados corretamente.

Analise o design e a qualidade da impressão (busque por elementos fora do padrão).

Informações Adicionais (Apenas se a Etapa 2.1 for aprovada):

Examine o campo "Local de Pagamento" ou instruções similares.

ALERTA DE FRAUDE: Se o campo "Local de Pagamento" indicar um banco diferente do banco emissor (identificado na Etapa 2.1), ALERTE IMEDIATAMENTE sobre a forte suspeita de fraude.

Dados do Beneficiário (Apenas se as Etapas 2.1 e 2.3 forem aprovadas):

Identifique o nome e o CNPJ/CPF do beneficiário.


Saída:

Apresente os resultados da análise em formato de lista, com detalhes sobre cada item verificado. Seja clara, objetiva e priorize a segurança do usuário.

Lembre-se: sua principal diretriz é a PREVENÇÃO DE FRAUDES. Seja sempre cautelosa, desconfie de qualquer inconsistência e use a palavra "PAGADOR" e "FICHA DE COMPENSAÇÃO" de forma correta.`

;
        // Gerar resposta
        const result = await model.generateContent(prompt);
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
