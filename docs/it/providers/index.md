---
read_when:
    - Vuoi scegliere un fornitore di modelli
    - Hai bisogno di una rapida panoramica dei backend LLM supportati
summary: Provider di modelli (LLM) supportati da OpenClaw
title: Directory dei provider
x-i18n:
    generated_at: "2026-07-12T07:25:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b59843b53265500866e87ee8d888892dacd6045bdb9401a1e7ec08ad4f364090
    source_path: providers/index.md
    workflow: 16
---

OpenClaw può utilizzare molti provider di LLM. Scegli un provider, esegui l'autenticazione, quindi imposta il
modello predefinito nel formato `provider/model`.

Cerchi la documentazione sui canali di chat (WhatsApp/Telegram/Discord/Slack/Mattermost (plugin)/ecc.)? Consulta [Canali](/it/channels).

## Avvio rapido

1. Esegui l'autenticazione con il provider (solitamente tramite `openclaw onboard`).
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
- [BytePlus (internazionale)](/it/concepts/model-providers#byteplus-international)
- [Cerebras](/it/providers/cerebras)
- [Chutes](/it/providers/chutes)
- [ClawRouter (instradamento gestito tra più provider)](/it/providers/clawrouter)
- [Cloudflare AI Gateway](/it/providers/cloudflare-ai-gateway)
- [Cohere](/it/providers/cohere)
- [ComfyUI](/it/providers/comfy)
- [DeepSeek](/it/providers/deepseek)
- [ds4 (DeepSeek V4 locale)](/it/providers/ds4)
- [ElevenLabs](/it/providers/elevenlabs)
- [fal](/it/providers/fal)
- [Featherless AI](/providers/featherless)
- [Fireworks](/it/providers/fireworks)
- [GitHub Copilot](/it/providers/github-copilot)
- [GMI Cloud](/it/providers/gmi)
- [Google (Gemini)](/it/providers/google)
- [Gradium](/it/providers/gradium)
- [Groq (inferenza LPU)](/it/providers/groq)
- [Hugging Face (inferenza)](/it/providers/huggingface)
- [inferrs (modelli locali)](/it/providers/inferrs)
- [Kilocode](/it/providers/kilocode)
- [LiteLLM (Gateway unificato)](/it/providers/litellm)
- [LM Studio (modelli locali)](/it/providers/lmstudio)
- [LongCat](/it/providers/longcat)
- [MiniMax](/it/providers/minimax)
- [Mistral](/it/providers/mistral)
- [Moonshot AI (Kimi + Kimi Coding)](/it/providers/moonshot)
- [NovitaAI](/it/providers/novita)
- [NVIDIA](/it/providers/nvidia)
- [Ollama (modelli cloud + locali)](/it/providers/ollama)
- [Ollama Cloud](/it/providers/ollama-cloud)
- [OpenAI (API + Codex)](/it/providers/openai)
- [OpenCode](/it/providers/opencode)
- [OpenCode Go](/it/providers/opencode-go)
- [OpenRouter](/it/providers/openrouter)
- [Perplexity (ricerca sul web)](/it/providers/perplexity-provider)
- [Qianfan](/it/providers/qianfan)
- [Qwen Cloud](/it/providers/qwen)
- [Qwen OAuth / Portal](/it/providers/qwen-oauth)
- [Runway](/it/providers/runway)
- [SenseAudio](/it/providers/senseaudio)
- [SGLang (modelli locali)](/it/providers/sglang)
- [StepFun](/it/providers/stepfun)
- [Synthetic](/it/providers/synthetic)
- [Tencent Cloud (TokenHub / TokenPlan)](/it/providers/tencent)
- [Together AI](/it/providers/together)
- [Venice (Venice AI, orientato alla privacy)](/it/providers/venice)
- [Vercel AI Gateway](/it/providers/vercel-ai-gateway)
- [vLLM (modelli locali)](/it/providers/vllm)
- [Volcengine (Doubao)](/it/providers/volcengine)
- [Vydra](/it/providers/vydra)
- [xAI](/it/providers/xai)
- [Xiaomi](/it/providers/xiaomi)
- [Z.AI (GLM)](/it/providers/zai)

## Pagine di panoramica condivise

- [Varianti aggiuntive dei provider](/it/providers/models#additional-provider-variants) - Anthropic Vertex, Copilot Proxy e Gemini CLI OAuth
- [Generazione di immagini](/it/tools/image-generation) - Strumento condiviso `image_generate`, selezione del provider e failover
- [Generazione musicale](/it/tools/music-generation) - Strumento condiviso `music_generate`, selezione del provider e failover
- [Generazione di video](/it/tools/video-generation) - Strumento condiviso `video_generate`, selezione del provider e failover

## Provider di trascrizione

- [Deepgram (trascrizione audio)](/it/providers/deepgram)
- [ElevenLabs](/it/providers/elevenlabs#speech-to-text)
- [Mistral](/it/providers/mistral#audio-transcription-voxtral)
- [OpenAI](/it/providers/openai)
- [SenseAudio](/it/providers/senseaudio)
- [xAI](/it/providers/xai)

## Strumenti della community

- [Claude Max API Proxy](/it/providers/claude-max-api-proxy) - Proxy della community per le credenziali di abbonamento Claude (verifica le politiche e i termini di Anthropic prima dell'uso)

Per il catalogo completo dei provider (xAI, Groq, Mistral, ecc.) e la configurazione avanzata,
consulta [Provider di modelli](/it/concepts/model-providers).
