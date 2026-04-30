---
read_when:
    - Vuoi scegliere un provider di modelli
    - Ti serve una rapida panoramica dei backend LLM supportati
summary: Provider di modelli (LLM) supportati da OpenClaw
title: Directory dei provider
x-i18n:
    generated_at: "2026-04-30T09:08:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 61143200b2e7a74392cf8871bfcd210fe35dbd5118e2e8bc7b15265192fd2bde
    source_path: providers/index.md
    workflow: 16
---

# Provider di modelli

OpenClaw può usare molti provider LLM. Scegli un provider, autenticati, quindi imposta il
modello predefinito come `provider/model`.

Cerchi la documentazione dei canali chat (WhatsApp/Telegram/Discord/Slack/Mattermost (plugin)/ecc.)? Consulta [Canali](/it/channels).

## Avvio rapido

1. Autenticati con il provider (di solito tramite `openclaw onboard`).
2. Imposta il modello predefinito:

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

## Documentazione dei provider

- [Alibaba Model Studio](/it/providers/alibaba)
- [Amazon Bedrock](/it/providers/bedrock)
- [Amazon Bedrock Mantle](/it/providers/bedrock-mantle)
- [Anthropic (API + Claude CLI)](/it/providers/anthropic)
- [Arcee AI (modelli Trinity)](/it/providers/arcee)
- [Azure Speech](/it/providers/azure-speech)
- [BytePlus (Internazionale)](/it/concepts/model-providers#byteplus-international)
- [Cerebras](/it/providers/cerebras)
- [Chutes](/it/providers/chutes)
- [Cloudflare AI Gateway](/it/providers/cloudflare-ai-gateway)
- [ComfyUI](/it/providers/comfy)
- [DeepSeek](/it/providers/deepseek)
- [ElevenLabs](/it/providers/elevenlabs)
- [fal](/it/providers/fal)
- [Fireworks](/it/providers/fireworks)
- [GitHub Copilot](/it/providers/github-copilot)
- [Modelli GLM](/it/providers/glm)
- [Google (Gemini)](/it/providers/google)
- [Gradium](/it/providers/gradium)
- [Groq (inferenza LPU)](/it/providers/groq)
- [Hugging Face (Inferenza)](/it/providers/huggingface)
- [inferrs (modelli locali)](/it/providers/inferrs)
- [Kilocode](/it/providers/kilocode)
- [LiteLLM (gateway unificato)](/it/providers/litellm)
- [LM Studio (modelli locali)](/it/providers/lmstudio)
- [MiniMax](/it/providers/minimax)
- [Mistral](/it/providers/mistral)
- [Moonshot AI (Kimi + Kimi Coding)](/it/providers/moonshot)
- [NVIDIA](/it/providers/nvidia)
- [Ollama (cloud + modelli locali)](/it/providers/ollama)
- [OpenAI (API + Codex)](/it/providers/openai)
- [OpenCode](/it/providers/opencode)
- [OpenCode Go](/it/providers/opencode-go)
- [OpenRouter](/it/providers/openrouter)
- [Perplexity (ricerca web)](/it/providers/perplexity-provider)
- [Qianfan](/it/providers/qianfan)
- [Qwen Cloud](/it/providers/qwen)
- [Runway](/it/providers/runway)
- [SenseAudio](/it/providers/senseaudio)
- [SGLang (modelli locali)](/it/providers/sglang)
- [StepFun](/it/providers/stepfun)
- [Synthetic](/it/providers/synthetic)
- [Tencent Cloud (TokenHub)](/it/providers/tencent)
- [Together AI](/it/providers/together)
- [Venice (Venice AI, incentrato sulla privacy)](/it/providers/venice)
- [Vercel AI Gateway](/it/providers/vercel-ai-gateway)
- [vLLM (modelli locali)](/it/providers/vllm)
- [Volcengine (Doubao)](/it/providers/volcengine)
- [Vydra](/it/providers/vydra)
- [xAI](/it/providers/xai)
- [Xiaomi](/it/providers/xiaomi)
- [Z.AI](/it/providers/zai)

## Pagine di panoramica condivise

- [Varianti aggiuntive incluse](/it/providers/models#additional-bundled-provider-variants) - Anthropic Vertex, Copilot Proxy e Gemini CLI OAuth
- [Generazione di immagini](/it/tools/image-generation) - Strumento `image_generate` condiviso, selezione del provider e failover
- [Generazione di musica](/it/tools/music-generation) - Strumento `music_generate` condiviso, selezione del provider e failover
- [Generazione di video](/it/tools/video-generation) - Strumento `video_generate` condiviso, selezione del provider e failover

## Provider di trascrizione

- [Deepgram (trascrizione audio)](/it/providers/deepgram)
- [ElevenLabs](/it/providers/elevenlabs#speech-to-text)
- [Mistral](/it/providers/mistral#audio-transcription-voxtral)
- [OpenAI](/it/providers/openai#speech-to-text)
- [SenseAudio](/it/providers/senseaudio)
- [xAI](/it/providers/xai#speech-to-text)

## Strumenti della community

- [Claude Max API Proxy](/it/providers/claude-max-api-proxy) - Proxy della community per le credenziali dell'abbonamento Claude (verifica le policy/i termini di Anthropic prima dell'uso)

Per il catalogo completo dei provider (xAI, Groq, Mistral, ecc.) e la configurazione avanzata,
consulta [Provider di modelli](/it/concepts/model-providers).
