const PRIMARY_MODEL = 'google/gemini-2.5-flash:free';
const COMPLEX_MODEL = 'meta-llama/llama-3.3-70b-instruct:free';

function getLastUserMessage(messages) {
    for (let i = messages.length - 1; i >= 0; i -= 1) {
        if (messages[i]?.role === 'user') {
            return String(messages[i].content || '').trim();
        }
    }
    return '';
}

function isComplexPrompt(text) {
    const content = text.toLowerCase();
    const complexKeywords = [
        'code', 'debug', 'bug', 'algorithm', 'optimize', 'refactor', 'typescript', 'javascript',
        'python', 'node', 'react', 'api', 'database', 'sql', 'implement', 'architecture', 'system design',
        'equation', 'integral', 'derivative', 'matrix', 'probability', 'statistics', 'proof', 'solve',
        'complex', 'step by step', 'explain deeply'
    ];

    if (content.length > 120) return true;
    if (/\d\s*[+\-*/=^()]\s*\d|\b\d+x\b|\bmath\b/.test(content)) return true;
    return complexKeywords.some((keyword) => content.includes(keyword));
}

function isSmallTalk(text) {
    const content = text.toLowerCase().trim();
    return /^(hi|hello|hey|yo|sup|whats up|what's up|good morning|good afternoon|good evening|how are you)\b[!?.,\s]*$/.test(content);
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { messages } = req.body;
    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: 'Server configuration error: Missing API Key' });
    }

    if (!Array.isArray(messages)) {
        return res.status(400).json({ error: 'Messages must be an array' });
    }

    const lastUserMessage = getLastUserMessage(messages);
    const useComplexModel = isComplexPrompt(lastUserMessage);
    const model = useComplexModel ? COMPLEX_MODEL : PRIMARY_MODEL;
    const shortReplyMode = isSmallTalk(lastUserMessage) || (!useComplexModel && lastUserMessage.length <= 80);

    const styleInstruction = shortReplyMode
        ? 'Style override: Keep reply to 1-2 short sentences (max 35 words). Friendly and professional. Do not dump bio unless explicitly asked.'
        : 'Style override: Keep it concise, practical, and friendly. Expand only when user asks for detail.';

    const outboundMessages = [
        ...messages,
        { role: 'system', content: styleInstruction }
    ];

    try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://www.redoyanulhaque.me',
                'X-Title': 'Redoyanul Haque Portfolio'
            },
            body: JSON.stringify({
                messages: outboundMessages,
                model,
                temperature: shortReplyMode ? 0.5 : 0.7,
                max_tokens: shortReplyMode ? 90 : (useComplexModel ? 520 : 260)
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error?.message || 'Failed to fetch from OpenRouter');
        }

        return res.status(200).json(data);
    } catch (error) {
        console.error('OpenRouter API Error:', error);
        return res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
}
