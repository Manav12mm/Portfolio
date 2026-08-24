// If one free model is down/renamed/rate-limited, try the next.
// Keep this list short — 2-3 solid, currently-active free models.
const MODELS = [
    'meta-llama/llama-3.3-8b-instruct:free',
    'google/gemini-2.0-flash-exp:free',
    'mistralai/mistral-small-3.2-24b-instruct:free'
];

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

    let lastError = null;

    for (const model of MODELS) {
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
                    model,
                    messages,
                    temperature: 0.7,
                    max_tokens: 300
                })
            });

            const data = await response.json();

            if (!response.ok) {
                console.error(`OpenRouter error with model "${model}":`, data);
                lastError = data?.error?.message || `Model ${model} failed`;
                continue; // try next model
            }

            if (!data?.choices?.[0]?.message?.content) {
                console.error(`Empty/invalid response from model "${model}":`, data);
                lastError = `Model ${model} returned no content`;
                continue; // try next model
            }

            // Success
            return res.status(200).json(data);

        } catch (error) {
            console.error(`Network/fetch error with model "${model}":`, error);
            lastError = error.message;
            continue; // try next model
        }
    }

    // Every model in the list failed
    return res.status(502).json({
        error: 'All chat models are currently unavailable. Please try again shortly.',
        details: lastError
    });
}
