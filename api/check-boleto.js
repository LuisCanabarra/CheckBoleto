// check-boleto.js
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Buffer } from 'node:buffer';
import * as pdfjsLib from 'pdfjs-dist';
import sharp from 'sharp';

let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 3000;
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 2048 // Aumentado devido ao prompt mais detalhado
    }
});

// Função para extrair texto de PDF
async function extractTextFromPDF(pdfBuffer) {
    const loadingTask = pdfjsLib.getDocument({ data: pdfBuffer });
    const pdf = await loadingTask.promise;
    let fullText = '';
    
    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => item.str).join(' ');
        fullText += pageText + '\n';
    }
    
    return fullText;
}

// Função para processar imagem
async function processImage(imageBuffer) {
    try {
        const processedBuffer = await sharp(imageBuffer)
            .resize(1024, null, {
                withoutEnlargement: true
            })
            .normalize()
            .sharpen()
            .toBuffer();
        
        return processedBuffer;
    } catch (error) {
        throw new Error('Erro no processamento da imagem: ' + error.message);
    }
}

// Função para converter buffer em base64
function bufferToBase64(buffer, mimeType) {
    return `data:${mimeType};base64,${buffer.toString('base64')}`;
}

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

        // Processar o arquivo recebido
        const formData = await req.formData();
        const file = formData.get('file');
        
        if (!file) {
            return res.status(400).json({ error: 'Arquivo não recebido' });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const mimeType = file.type;
        let processedData;

        // Processar diferentes tipos de arquivo
        if (mimeType === 'application/pdf') {
            processedData = await extractTextFromPDF(buffer);
        } else if (mimeType.startsWith('image/')) {
            const processedImage = await processImage(buffer);
            processedData = bufferToBase64(processedImage, mimeType);
        } else {
            return res.status(400).json({ error: 'Formato de arquivo não suportado' });
        }

        const prompt = `Você é uma especialista em fraudes bancárias, altamente experiente na identificação de boletos falsificados. Sua missão é analisar rigorosamente um boleto, seguindo um protocolo detalhado, para garantir a segurança do usuário e prevenir golpes financeiros. Sua atenção aos detalhes é fundamental.

Instruções:

Receba a imagem do boleto.

Execute a análise na ORDEM ESPECÍFICA:

Identificação do Banco Emissor (PRIORIDADE ABSOLUTA):
- Examine o logotipo do banco presente no boleto.
- EXTRAIA A LINHA DIGITÁVEL DO BOLETO.
- VERIFIQUE OS TRÊS PRIMEIROS DÍGITOS DA LINHA DIGITÁVEL. CONSULTE A TABELA DE CÓDIGOS DE BANCOS DA FEBRABAN para identificar o banco CORRESPONDENTE.
- Compare o banco identificado pelo LOGOTIPO com o banco identificado pelos TRÊS PRIMEIROS DÍGITOS DA LINHA DIGITÁVEL.
- SE HOUVER DISCREPÂNCIA, ALERTE IMEDIATAMENTE SOBRE A PRESENÇA DE UM BOLETO FALSO. PARE A ANÁLISE NESTE PONTO E SIGA AS INSTRUÇÕES DE ALERTA.

Extração e Verificação do Valor do Boleto (CRUCIAL):
- IDENTIFIQUE E REGISTRE O VALOR DO BOLETO EXIBIDO NO CAMPO "VALOR DO DOCUMENTO" (ou similar).
- ANALISE A LINHA DIGITÁVEL PARA IDENTIFICAR A POSIÇÃO DO CÓDIGO DO VALOR (esta posição pode variar de acordo com o banco).
- EXTRAIA O VALOR CODIFICADO NA LINHA DIGITÁVEL. CONVERTA O CÓDIGO PARA O FORMATO NUMÉRICO PADRÃO (R$ XXX,XX).
- Compare o valor EXIBIDO no boleto com o valor CODIFICADO na linha digitável.
- SE HOUVER QUALQUER DISCREPÂNCIA (mesmo que pequena), ALERTE IMEDIATAMENTE SOBRE A PRESENÇA DE UM BOLETO FALSO. PARE A ANÁLISE E SIGA AS INSTRUÇÕES DE ALERTA.

Consistência Geral (Apenas se as Etapas 2.1 e 2.2 forem aprovadas):
- Verifique a integridade de todos os dados (preenchimento completo dos campos obrigatórios).
- Procure por erros de ortografia, digitação ou formatação (seja extremamente criteriosa), incluindo os termos "PAGADOR" e "FICHA DE COMPENSAÇÃO", que devem ser grafados corretamente.
- Analise o design e a qualidade da impressão (busque por elementos fora do padrão).

Informações Adicionais (Apenas se a Etapa 2.1 for aprovada):
- Examine o campo "Local de Pagamento" ou instruções similares.
- ALERTA DE FRAUDE: Se o campo "Local de Pagamento" indicar um banco diferente do banco emissor (identificado na Etapa 2.1), ALERTE IMEDIATAMENTE sobre a forte suspeita de fraude.

Dados do Beneficiário (Apenas se as Etapas 2.1 e 2.3 forem aprovadas):
- Identifique o nome e o CNPJ/CPF do beneficiário.
- Pesquise o CNPJ/CPF na Receita Federal para verificar a situação cadastral, o nome empresarial e a atividade da empresa.
- Pesquise o nome do beneficiário no Reclame Aqui para verificar a reputação e o número de reclamações.

Análise da Imagem (Apenas se as Etapas 2.1, 2.3, 2.4 e 2.5 forem aprovadas):
- Verifique se há sinais de manipulação na imagem (fontes diferentes, cortes, sobreposições).
- Analise a qualidade do logotipo do banco e outros elementos gráficos.

Em caso de suspeita de fraude (em qualquer etapa):
- Liste TODAS as inconsistências encontradas
- Informe sobre o risco de fraude de forma clara e enfática
- Recomende as ações de segurança necessárias

Dados para análise: ${processedData}`;

        const result = await Promise.race([
            model.generateContent({
                contents: [{ role: 'user', parts: [{ text: prompt }] }]
            }),
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Tempo limite excedido')), 30000) // Aumentado para 30s devido à complexidade
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
