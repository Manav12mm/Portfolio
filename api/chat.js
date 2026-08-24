export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { messages } = req.body;
    const apiKey = process.env.OPENROUTER_API_KEY;
    const model = process.env.OPENROUTER_MODEL || 'openrouter/free';

    if (!apiKey) {
        return res.status(500).json({ error: 'Server configuration error: Missing API Key' });
    }

    if (!Array.isArray(messages)) {
        return res.status(400).json({ error: 'Messages must be an array' });
    }

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
                messages,
                model
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
