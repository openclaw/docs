---
read_when:
    - Vuoi scegliere un provider di modelli
    - Hai bisogno di una panoramica rapida dei backend LLM supportati
summary: Provider di modelli (LLM) supportati da OpenClaw
title: Directory dei provider
x-i18n:
    generated_at: "2026-04-05T14:01:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: 690d17c14576d454ea3cd3dcbc704470da10a2a34adfe681dab7048438f2e193
    source_path: providers/index.md
    workflow: 15
---

# Provider di modelli

OpenClaw può usare molti provider LLM. Scegli un provider, autenticati, poi imposta il
modello predefinito come `provider/model`.

Cerchi la documentazione sui canali di chat (WhatsApp/Telegram/Discord/Slack/Mattermost (plugin)/ecc.)? Vedi [Canali](/it/channels).

## Avvio rapido

1. Autenticati con il provider (di solito tramite `openclaw onboard`).
2. Imposta il modello predefinito:

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

## Documentazione dei provider

- [Amazon Bedrock](/providers/bedrock)
- [Anthropic (API + Claude CLI)](/providers/anthropic)
- [BytePlus (internazionale)](/concepts/model-providers#byteplus-international)
- [Chutes](/providers/chutes)
- [Cloudflare AI Gateway](/providers/cloudflare-ai-gateway)
- [DeepSeek](/providers/deepseek)
- [Fireworks](/providers/fireworks)
- [GitHub Copilot](/providers/github-copilot)
- [Modelli GLM](/providers/glm)
- [Google (Gemini)](/providers/google)
- [Groq (inferenza LPU)](/providers/groq)
- [Hugging Face (Inference)](/providers/huggingface)
- [Kilocode](/providers/kilocode)
- [LiteLLM (gateway unificato)](/providers/litellm)
- [MiniMax](/providers/minimax)
- [Mistral](/providers/mistral)
- [Moonshot AI (Kimi + Kimi Coding)](/providers/moonshot)
- [NVIDIA](/providers/nvidia)
- [Ollama (modelli cloud + locali)](/providers/ollama)
- [OpenAI (API + Codex)](/providers/openai)
- [OpenCode](/providers/opencode)
- [OpenCode Go](/providers/opencode-go)
- [OpenRouter](/providers/openrouter)
- [Perplexity (ricerca web)](/providers/perplexity-provider)
- [Qianfan](/providers/qianfan)
- [Qwen Cloud](/providers/qwen)
- [Qwen / Model Studio (dettaglio endpoint; `qwen-*` canonico, `modelstudio-*` legacy)](/providers/qwen_modelstudio)
- [SGLang (modelli locali)](/providers/sglang)
- [StepFun](/providers/stepfun)
- [Synthetic](/providers/synthetic)
- [Together AI](/providers/together)
- [Venice (Venice AI, orientato alla privacy)](/providers/venice)
- [Vercel AI Gateway](/providers/vercel-ai-gateway)
- [vLLM (modelli locali)](/providers/vllm)
- [Volcengine (Doubao)](/providers/volcengine)
- [xAI](/providers/xai)
- [Xiaomi](/providers/xiaomi)
- [Z.AI](/providers/zai)

## Pagine di panoramica condivise

- [Varianti incluse aggiuntive](/providers/models#additional-bundled-provider-variants) - Anthropic Vertex, Copilot Proxy e Gemini CLI OAuth

## Provider di trascrizione

- [Deepgram (trascrizione audio)](/providers/deepgram)

## Strumenti della community

- [Claude Max API Proxy](/providers/claude-max-api-proxy) - Proxy della community per credenziali di abbonamento Claude (verifica policy/termini Anthropic prima dell'uso)

Per il catalogo completo dei provider (xAI, Groq, Mistral, ecc.) e la configurazione avanzata,
vedi [Provider di modelli](/concepts/model-providers).
