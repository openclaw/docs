---
read_when:
    - Quieres elegir un proveedor de modelos
    - Necesitas una descripción general rápida de los backends de LLM compatibles
summary: Proveedores de modelos (LLM) compatibles con OpenClaw
title: Directorio de proveedores
x-i18n:
    generated_at: "2026-06-27T12:38:05Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a340f6a48f6f1d50116316f9679b009365cd617b3453ebd9b2b31e70f6b94c31
    source_path: providers/index.md
    workflow: 16
---

OpenClaw puede usar muchos proveedores de LLM. Elige un proveedor, autentícate y luego establece el
modelo predeterminado como `provider/model`.

¿Buscas la documentación de canales de chat (WhatsApp/Telegram/Discord/Slack/Mattermost (plugin)/etc.)? Consulta [Canales](/es/channels).

## Inicio rápido

1. Autentícate con el proveedor (normalmente mediante `openclaw onboard`).
2. Establece el modelo predeterminado:

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

## Documentación de proveedores

- [Alibaba Model Studio](/es/providers/alibaba)
- [Amazon Bedrock](/es/providers/bedrock)
- [Amazon Bedrock Mantle](/es/providers/bedrock-mantle)
- [Anthropic (API + CLI de Claude)](/es/providers/anthropic)
- [Arcee AI (modelos Trinity)](/es/providers/arcee)
- [Azure Speech](/es/providers/azure-speech)
- [BytePlus (Internacional)](/es/concepts/model-providers#byteplus-international)
- [Cerebras](/es/providers/cerebras)
- [Chutes](/es/providers/chutes)
- [Cohere](/es/providers/cohere)
- [Cloudflare AI Gateway](/es/providers/cloudflare-ai-gateway)
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
- [Hugging Face (inferencia)](/es/providers/huggingface)
- [inferrs (modelos locales)](/es/providers/inferrs)
- [Kilocode](/es/providers/kilocode)
- [LiteLLM (gateway unificado)](/es/providers/litellm)
- [LM Studio (modelos locales)](/es/providers/lmstudio)
- [MiniMax](/es/providers/minimax)
- [Mistral](/es/providers/mistral)
- [Moonshot AI (Kimi + Kimi Coding)](/es/providers/moonshot)
- [NVIDIA](/es/providers/nvidia)
- [NovitaAI](/es/providers/novita)
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
- [Tencent Cloud (TokenHub)](/es/providers/tencent)
- [Together AI](/es/providers/together)
- [Venice (Venice AI, centrado en privacidad)](/es/providers/venice)
- [Vercel AI Gateway](/es/providers/vercel-ai-gateway)
- [vLLM (modelos locales)](/es/providers/vllm)
- [Volcengine (Doubao)](/es/providers/volcengine)
- [Vydra](/es/providers/vydra)
- [xAI](/es/providers/xai)
- [Xiaomi](/es/providers/xiaomi)
- [Z.AI (GLM)](/es/providers/zai)

## Páginas de resumen compartidas

- [Variantes incluidas adicionales](/es/providers/models#additional-bundled-provider-variants) - Anthropic Vertex, Copilot Proxy y Gemini CLI OAuth
- [Generación de imágenes](/es/tools/image-generation) - Herramienta compartida `image_generate`, selección de proveedor y conmutación por error
- [Generación de música](/es/tools/music-generation) - Herramienta compartida `music_generate`, selección de proveedor y conmutación por error
- [Generación de video](/es/tools/video-generation) - Herramienta compartida `video_generate`, selección de proveedor y conmutación por error

## Proveedores de transcripción

- [Deepgram (transcripción de audio)](/es/providers/deepgram)
- [ElevenLabs](/es/providers/elevenlabs#speech-to-text)
- [Mistral](/es/providers/mistral#audio-transcription-voxtral)
- [OpenAI](/es/providers/openai#speech-to-text)
- [SenseAudio](/es/providers/senseaudio)
- [xAI](/es/providers/xai#speech-to-text)

## Herramientas de la comunidad

- [Claude Max API Proxy](/es/providers/claude-max-api-proxy) - Proxy de la comunidad para credenciales de suscripción de Claude (verifica la política o los términos de Anthropic antes de usarlo)

Para ver el catálogo completo de proveedores (xAI, Groq, Mistral, etc.) y la configuración avanzada,
consulta [Proveedores de modelos](/es/concepts/model-providers).
