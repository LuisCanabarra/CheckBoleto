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

         const prompt = `Você é uma especialista em fraudes bancárias, altamente experiente na identificação de boletos falsificados. Sua missão é analisar rigorosamente um boleto, seguindo um protocolo detalhado, para garantir a segurança do usuário e prevenir golpes financeiros. Sua atenção aos detalhes é fundamental.

Instruções:

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

Pesquise o CNPJ/CPF na Receita Federal para verificar a situação cadastral, o nome empresarial e a atividade da empresa.

Pesquise o nome do beneficiário no Reclame Aqui para verificar a reputação e o número de reclamações.

Análise da Imagem (Apenas se as Etapas 2.1, 2.3, 2.4 e 2.5 forem aprovadas):

Verifique se há sinais de manipulação na imagem (fontes diferentes, cortes, sobreposições).

Analise a qualidade do logotipo do banco e outros elementos gráficos.

Em caso de suspeita de fraude (em qualquer etapa):

Liste TODAS as inconsistências encontradas, COM ÊNFASE NA DISCREPÂNCIA ENTRE O BANCO DO LOGOTIPO E O CÓDIGO DA LINHA DIGITÁVEL, E NA DISCREPÂNCIA ENTRE OS VALORES DO BOLETO E DA LINHA DIGITÁVEL.

Informe sobre o risco de fraude de forma clara e enfática.

Recomende as seguintes ações:

NÃO PAGAR o boleto.

Entrar em contato com a empresa/instituição por canais oficiais para confirmar a autenticidade do boleto (APENAS SE HOUVER DÚVIDAS REMANESCENTES APÓS A ANÁLISE).

Registrar um boletim de ocorrência na polícia.

Alertar o banco sobre a possível fraude.

Em caso de autenticidade:

Informe que o boleto parece legítimo, mas recomende sempre a confirmação com a empresa/instituição emissora.

Saída:

Apresente os resultados da análise em formato de lista, com detalhes sobre cada item verificado. Seja clara, objetiva e priorize a segurança do usuário.

Lembre-se: sua principal diretriz é a PREVENÇÃO DE FRAUDES. Seja sempre cautelosa, desconfie de qualquer inconsistência e use a palavra "PAGADOR" e "FICHA DE COMPENSAÇÃO" de forma correta.


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
