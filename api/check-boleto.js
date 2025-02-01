import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
    try {
        // Log inicial para debug
        console.log('Tipo de arquivo recebido:', req.body.fileType);
        
        if (req.method !== 'POST') {
            return res.status(405).json({ error: 'Método não permitido' });
        }

        const { boletoData } = req.body;
        
        if (!boletoData) {
            return res.status(400).json({ 
                status: 'error', 
                message: 'Dados não recebidos' 
            });
