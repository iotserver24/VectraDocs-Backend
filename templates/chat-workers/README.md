# Vetradocs Chat Backend (Cloudflare Workers)

This is a serverless AI backend for **Vetradocs**, powered by **Cloudflare Workers AI**. It provides a secure API endpoint for your documentation site to communicate with LLMs like Llama 3.

## Setup

1. **Install dependencies**:

    ```bash
    npm install
    ```

2. **Configure `wrangler.toml`**:
    * **`API_KEY`**: Set a secure secret key. This will be used to authenticate requests from your frontend.
    * **`FRONTEND_URL`**: The URL of your documentation site (e.g., `https://my-docs.com`). Use `http://localhost:5173` for local development.
    * **`AI_MODEL`**: The Cloudflare Workers AI model to use (default: `@cf/meta/llama-3-8b-instruct`).

## Development

Run the worker locally:

```bash
npm run dev
```

The server will start at `http://localhost:8787`.

## Deployment

Deploy to Cloudflare's global network:

```bash
npm run deploy
```

You will get a URL like `https://chat-workers.your-name.workers.dev`.

## Frontend Integration

Once deployed, connect this backend to your documentation site.

### 1. VitePress

If you are using `vetradocs-vitepress`:

Add to your `.env` file:

```bash
VITE_VETRADOCS_BACKEND_URL=https://your-worker-url.workers.dev
VITE_VETRADOCS_API_KEY=your-secret-key
```

### 2. Docusaurus

If you are using `vetradocs-docusaurus`:

Pass the props to `VetradocsChat`:

```jsx
<VetradocsChat
  apiEndpoint="https://your-worker-url.workers.dev"
  apiKey="your-secret-key"
/>
```

### 3. Scalar / Generic

If you are using `vetradocs-scalar`:

```html
<vetradocs-widget
  api-endpoint="https://your-worker-url.workers.dev"
  api-key="your-secret-key"
></vetradocs-widget>
```

## More Information

For full documentation, visit **[https://vectra-docs.vercel.app](https://vectra-docs.vercel.app)**.
