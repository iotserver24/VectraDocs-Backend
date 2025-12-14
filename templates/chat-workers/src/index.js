
export default {
    async fetch(request, env) {
        const corsHeaders = {
            'Access-Control-Allow-Origin': env.FRONTEND_URL || '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        };

        if (request.method === 'OPTIONS') {
            return new Response(null, { headers: corsHeaders });
        }

        if (request.method !== 'POST') {
            return new Response('Method Not Allowed', { status: 405, headers: corsHeaders });
        }

        // Auth Check
        const authHeader = request.headers.get('Authorization');
        const apiKey = env.API_KEY;
        // If API_KEY is set in env, we require it. If not set (empty/undefined), we might allow open access or fail.
        // Assuming safe default: if env.API_KEY is present, check it.
        if (apiKey && apiKey.trim() !== '') {
            if (!authHeader || authHeader !== `Bearer ${apiKey}`) {
                return new Response('Unauthorized', { status: 401, headers: corsHeaders });
            }
        }

        try {
            const body = await request.json();
            const messages = body.messages || [];

            // Use Cloudflare Workers AI
            // Defaulting to Llama 3 8B if not specified
            const model = env.AI_MODEL;
            const response = await env.AI.run(model, {
                messages,
                stream: true,
            });

            return new Response(response, {
                headers: {
                    ...corsHeaders,
                    'content-type': 'text/event-stream',
                },
            });
        } catch (e) {
            return new Response(JSON.stringify({ error: e.message }), {
                status: 500,
                headers: corsHeaders,
            });
        }
    },
};
