---
read_when:
    - Quieres elegir un proveedor de modelos
    - Necesita una descripción general rápida de los backends de LLM compatibles.
summary: Proveedores de modelos (LLM) compatibles con OpenClaw
title: Directorio de proveedores
x-i18n:
    generated_at: "2026-07-12T14:46:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: b59843b53265500866e87ee8d888892dacd6045bdb9401a1e7ec08ad4f364090
    source_path: providers/index.md
    workflow: 16
---

OpenClaw puede usar muchos proveedores de LLM. Elija un proveedor, autentíquese y, a continuación, establezca el
modelo predeterminado como `provider/model`.

¿Busca documentación sobre canales de chat (WhatsApp/Telegram/Discord/Slack/Mattermost (Plugin)/etc.)? Consulte [Canales](/es/channels).

## Inicio rápido

1. Autentíquese con el proveedor (normalmente mediante `openclaw onboard`).
2. Establezca el modelo predeterminado:

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
- [BytePlus (internacional)](/es/concepts/model-providers#byteplus-international)
- [Cerebras](/es/providers/cerebras)
- [Chutes](/es/providers/chutes)
- [ClawRouter (enrutamiento administrado entre varios proveedores)](/es/providers/clawrouter)
- [Gateway de IA de Cloudflare](/es/providers/cloudflare-ai-gateway)
- [Cohere](/es/providers/cohere)
- [ComfyUI](/es/providers/comfy)
- [DeepSeek](/es/providers/deepseek)
- [ds4 (DeepSeek V4 local)](/es/providers/ds4)
- [ElevenLabs](/es/providers/elevenlabs)
- [fal](/es/providers/fal)
- [Featherless AI](/providers/featherless)
- [Fireworks](/es/providers/fireworks)
- [GitHub Copilot](/es/providers/github-copilot)
- [GMI Cloud](/es/providers/gmi)
- [Google (Gemini)](/es/providers/google)
- [Gradium](/es/providers/gradium)
- [Groq (inferencia mediante LPU)](/es/providers/groq)
- [Hugging Face (inferencia)](/es/providers/huggingface)
- [inferrs (modelos locales)](/es/providers/inferrs)
- [Kilocode](/es/providers/kilocode)
- [LiteLLM (Gateway unificado)](/es/providers/litellm)
- [LM Studio (modelos locales)](/es/providers/lmstudio)
- [LongCat](/es/providers/longcat)
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
- [OAuth de Qwen / Portal](/es/providers/qwen-oauth)
- [Runway](/es/providers/runway)
- [SenseAudio](/es/providers/senseaudio)
- [SGLang (modelos locales)](/es/providers/sglang)
- [StepFun](/es/providers/stepfun)
- [Synthetic](/es/providers/synthetic)
- [Tencent Cloud (TokenHub / TokenPlan)](/es/providers/tencent)
- [Together AI](/es/providers/together)
- [Venice (Venice AI, centrado en la privacidad)](/es/providers/venice)
- [Gateway de IA de Vercel](/es/providers/vercel-ai-gateway)
- [vLLM (modelos locales)](/es/providers/vllm)
- [Volcengine (Doubao)](/es/providers/volcengine)
- [Vydra](/es/providers/vydra)
- [xAI](/es/providers/xai)
- [Xiaomi](/es/providers/xiaomi)
- [Z.AI (GLM)](/es/providers/zai)

## Páginas de descripción general compartidas

- [Variantes adicionales de proveedores](/es/providers/models#additional-provider-variants) - Anthropic Vertex, Copilot Proxy y OAuth de Gemini CLI
- [Generación de imágenes](/es/tools/image-generation) - Herramienta compartida `image_generate`, selección de proveedores y conmutación por error
- [Generación de música](/es/tools/music-generation) - Herramienta compartida `music_generate`, selección de proveedores y conmutación por error
- [Generación de vídeo](/es/tools/video-generation) - Herramienta compartida `video_generate`, selección de proveedores y conmutación por error

## Proveedores de transcripción

- [Deepgram (transcripción de audio)](/es/providers/deepgram)
- [ElevenLabs](/es/providers/elevenlabs#speech-to-text)
- [Mistral](/es/providers/mistral#audio-transcription-voxtral)
- [OpenAI](/es/providers/openai)
- [SenseAudio](/es/providers/senseaudio)
- [xAI](/es/providers/xai)

## Herramientas de la comunidad

- [Claude Max API Proxy](/es/providers/claude-max-api-proxy) - Proxy de la comunidad para credenciales de suscripción de Claude (verifique las políticas y condiciones de Anthropic antes de usarlo)

Para consultar el catálogo completo de proveedores (xAI, Groq, Mistral, etc.) y la configuración avanzada,
consulte [Proveedores de modelos](/es/concepts/model-providers).
