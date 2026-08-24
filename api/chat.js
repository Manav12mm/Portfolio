// Primary + complex models, each with fallbacks in case OpenRouter
// deprecates/renames a free slug (this is what broke last time).
const PRIMARY_MODELS = [
    'nvidia/nemotron-3.5-lightning:free',
    'meta-llama/llama-3.3-8b-instruct:free',
    'qwen/qwen3-8b:free'
];

const COMPLEX_MODELS = [
    'meta-llama/llama-3.3-70b-instruct:free',
    'qwen/qwen3-235b-a22b:free',
    'deepseek/deepseek-chat-v3.1:free',
    ...PRIMARY_MODELS
];

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

async function callOpenRouter({ apiKey, model, messages, temperature, max_tokens }) {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://www.redoyanulhaque.me',
            'X-Title': 'Redoyanul Haque Portfolio'
        },
        body: JSON.stringify({ messages, model, temperature, max_tokens })
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        const message = data?.error?.message || `OpenRouter request failed (status ${response.status})`;
        const err = new Error(message);
        err.status = response.status;
        throw err;
    }

    // Some free models occasionally return an empty choices array under load.
    if (!data?.choices?.length) {
        const err = new Error('Empty response from model');
        err.status = 502;
        throw err;
    }

    return data;
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { messages } = req.body || {};
    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: 'Server configuration error: Missing API Key' });
    }
    if (!Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({ error: 'Messages must be a non-empty array' });
    }

    const lastUserMessage = getLastUserMessage(messages);
    const useComplexModel = isComplexPrompt(lastUserMessage);
    const candidateModels = useComplexModel ? COMPLEX_MODELS : PRIMARY_MODELS;

    const shortReplyMode = isSmallTalk(lastUserMessage) || (!useComplexModel && lastUserMessage.length <= 80);
    const styleInstruction = shortReplyMode
        ? 'Style override: Keep reply to 1-2 short sentences (max 35 words). Friendly and professional. Do not dump bio unless explicitly asked.'
        : 'Style override: Keep it concise, practical, and friendly. Expand only when user asks for detail.';

    const outboundMessages = [
        ...messages,
        { role: 'system', content: styleInstruction }
    ];

    const temperature = shortReplyMode ? 0.5 : 0.7;
    const max_tokens = shortReplyMode ? 90 : (useComplexModel ? 520 : 260);

    let lastError = null;

    for (const model of candidateModels) {
        try {
            const data = await callOpenRouter({
                apiKey,
                model,
                messages: outboundMessages,
                temperature,
                max_tokens
            });
            // Let the client know which model actually answered (handy for debugging).
            return res.status(200).json({ ...data, _modelUsed: model });
        } catch (error) {
            lastError = error;
            console.error(`OpenRouter error with model "${model}":`, error.message);
            // 401/403 = bad key, no point retrying other models.
            if (error.status === 401 || error.status === 403) break;
            // Otherwise (404 model not found, 429 rate limited, 5xx, empty response) try the next model.
        }
    }

    return res.status(502).json({
        error: 'All chatbot models are currently unavailable. Please try again shortly.',
        details: lastError?.message || 'Unknown error'
    });
}
