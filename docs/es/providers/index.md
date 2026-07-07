---
read_when:
    - Quiere elegir un proveedor de modelos
    - Necesitas una descripción general rápida de los backends LLM compatibles
summary: Proveedores de modelos (LLM) compatibles con OpenClaw
title: Directorio de proveedores
x-i18n:
    generated_at: "2026-07-06T21:50:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fb53d2fdc4cafa2bf7a8167591296362b9772ddbcfa01036a4704b362d80cfce
    source_path: providers/index.md
    workflow: 16
---

OpenClaw puede usar muchos proveedores de LLM. Elige un proveedor, autentícate y luego configura el
modelo predeterminado como `provider/model`.

¿Buscas documentación de canales de chat (WhatsApp/Telegram/Discord/Slack/Mattermost (plugin)/etc.)? Consulta [Canales](/es/channels).

## Inicio rápido

1. Autentícate con el proveedor (normalmente mediante `openclaw onboard`).
2. Configura el modelo predeterminado:

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

## Documentación de proveedores

- [Alibaba Model Studio](/es/providers/alibaba)
- [Amazon Bedrock](/es/providers/bedrock)
- [Amazon Bedrock Mantle](/es/providers/bedrock-mantle)
- [Anthropic (API + Claude CLI)](/es/providers/anthropic)
- [Arcee AI (modelos Trinity)](/es/providers/arcee)
- [Azure Speech](/es/providers/azure-speech)
- [BytePlus (Internacional)](/es/concepts/model-providers#byteplus-international)
- [Cerebras](/es/providers/cerebras)
- [Chutes](/es/providers/chutes)
- [ClawRouter (enrutamiento multiproveedor gestionado)](/es/providers/clawrouter)
- [Cloudflare AI Gateway](/es/providers/cloudflare-ai-gateway)
- [Cohere](/es/providers/cohere)
- [ComfyUI](/es/providers/comfy)
- [DeepSeek](/es/providers/deepseek)
- [ds4 (DeepSeek V4 local)](/es/providers/ds4)
- [ElevenLabs](/es/providers/elevenlabs)
- [fal](/es/providers/fal)
- [Fireworks](/es/providers/fireworks)
- [GitHub Copilot](/es/providers/github-copilot)
- [GMI Cloud](/es/providers/gmi)
- [Google (Gemini)](/es/providers/google)
- [Gradium](/es/providers/gradium)
- [Groq (inferencia LPU)](/es/providers/groq)
- [Hugging Face (Inferencia)](/es/providers/huggingface)
- [inferrs (modelos locales)](/es/providers/inferrs)
- [Kilocode](/es/providers/kilocode)
- [LiteLLM (gateway unificado)](/es/providers/litellm)
- [LM Studio (modelos locales)](/es/providers/lmstudio)
- [LongCat](/providers/longcat)
- [MiniMax](/es/providers/minimax)
- [Mistral](/es/providers/mistral)
- [Moonshot AI (Kimi + Kimi Coding)](/es/providers/moonshot)
- [NovitaAI](/es/providers/novita)
- [NVIDIA](/es/providers/nvidia)
- [Ollama (modelos en la nube + locales)](/es/providers/ollama)
- [Ollama Cloud](/es/providers/ollama-cloud)
- [OpenAI (API + Codex)](/es/providers/openai)
- [OpenCode](/es/providers/opencode)
- [OpenCode Go](/es/providers/opencode-go)
- [OpenRouter](/es/providers/openrouter)
- [Perplexity (búsqueda web)](/es/providers/perplexity-provider)
- [Qianfan](/es/providers/qianfan)
- [Qwen Cloud](/es/providers/qwen)
- [Qwen OAuth / Portal](/es/providers/qwen-oauth)
- [Runway](/es/providers/runway)
- [SenseAudio](/es/providers/senseaudio)
- [SGLang (modelos locales)](/es/providers/sglang)
- [StepFun](/es/providers/stepfun)
- [Synthetic](/es/providers/synthetic)
- [Tencent Cloud (TokenHub / TokenPlan)](/es/providers/tencent)
- [Together AI](/es/providers/together)
- [Venice (Venice AI, centrado en la privacidad)](/es/providers/venice)
- [Vercel AI Gateway](/es/providers/vercel-ai-gateway)
- [vLLM (modelos locales)](/es/providers/vllm)
- [Volcengine (Doubao)](/es/providers/volcengine)
- [Vydra](/es/providers/vydra)
- [xAI](/es/providers/xai)
- [Xiaomi](/es/providers/xiaomi)
- [Z.AI (GLM)](/es/providers/zai)

## Páginas de resumen compartidas

- [Variantes adicionales de proveedores](/es/providers/models#additional-provider-variants) - Anthropic Vertex, Copilot Proxy y OAuth de Gemini CLI
- [Generación de imágenes](/es/tools/image-generation) - Herramienta compartida `image_generate`, selección de proveedor y conmutación por error
- [Generación de música](/es/tools/music-generation) - Herramienta compartida `music_generate`, selección de proveedor y conmutación por error
- [Generación de vídeo](/es/tools/video-generation) - Herramienta compartida `video_generate`, selección de proveedor y conmutación por error

## Proveedores de transcripción

- [Deepgram (transcripción de audio)](/es/providers/deepgram)
- [ElevenLabs](/es/providers/elevenlabs#speech-to-text)
- [Mistral](/es/providers/mistral#audio-transcription-voxtral)
- [OpenAI](/es/providers/openai)
- [SenseAudio](/es/providers/senseaudio)
- [xAI](/es/providers/xai)

## Herramientas de la comunidad

- [Claude Max API Proxy](/es/providers/claude-max-api-proxy) - Proxy de la comunidad para credenciales de suscripción de Claude (verifica la política/los términos de Anthropic antes de usarlo)

Para ver el catálogo completo de proveedores (xAI, Groq, Mistral, etc.) y la configuración avanzada,
consulta [Proveedores de modelos](/es/concepts/model-providers).
