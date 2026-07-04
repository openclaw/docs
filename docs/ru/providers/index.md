---
read_when:
    - Вы хотите выбрать поставщика модели
    - Вам нужен краткий обзор поддерживаемых бэкендов LLM
summary: Поставщики моделей (LLM), поддерживаемые OpenClaw
title: Каталог провайдеров
x-i18n:
    generated_at: "2026-07-04T03:59:38Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3386b41b340048f7ace61077e724a70af36dda83c65d211dde5081b378b1b448
    source_path: providers/index.md
    workflow: 16
---

OpenClaw может использовать многих LLM-провайдеров. Выберите провайдера, выполните аутентификацию, затем задайте
модель по умолчанию как `provider/model`.

Ищете документацию по каналам чата (WhatsApp/Telegram/Discord/Slack/Mattermost (Plugin)/и т. д.)? См. [Каналы](/ru/channels).

## Быстрый старт

1. Выполните аутентификацию у провайдера (обычно через `openclaw onboard`).
2. Задайте модель по умолчанию:

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

## Документация по провайдерам

- [Alibaba Model Studio](/ru/providers/alibaba)
- [Amazon Bedrock](/ru/providers/bedrock)
- [Amazon Bedrock Mantle](/ru/providers/bedrock-mantle)
- [Anthropic (API + Claude CLI)](/ru/providers/anthropic)
- [Arcee AI (модели Trinity)](/ru/providers/arcee)
- [Azure Speech](/ru/providers/azure-speech)
- [BytePlus (международный)](/ru/concepts/model-providers#byteplus-international)
- [Cerebras](/ru/providers/cerebras)
- [Chutes](/ru/providers/chutes)
- [ClawRouter (управляемая маршрутизация между несколькими провайдерами)](/providers/clawrouter)
- [Cohere](/ru/providers/cohere)
- [Cloudflare AI Gateway](/ru/providers/cloudflare-ai-gateway)
- [ComfyUI](/ru/providers/comfy)
- [DeepSeek](/ru/providers/deepseek)
- [ds4 (локальный DeepSeek V4)](/ru/providers/ds4)
- [ElevenLabs](/ru/providers/elevenlabs)
- [fal](/ru/providers/fal)
- [Fireworks](/ru/providers/fireworks)
- [GitHub Copilot](/ru/providers/github-copilot)
- [GMI Cloud](/ru/providers/gmi)
- [Google (Gemini)](/ru/providers/google)
- [Gradium](/ru/providers/gradium)
- [Groq (LPU-инференс)](/ru/providers/groq)
- [Hugging Face (Inference)](/ru/providers/huggingface)
- [inferrs (локальные модели)](/ru/providers/inferrs)
- [Kilocode](/ru/providers/kilocode)
- [LiteLLM (унифицированный Gateway)](/ru/providers/litellm)
- [LM Studio (локальные модели)](/ru/providers/lmstudio)
- [MiniMax](/ru/providers/minimax)
- [Mistral](/ru/providers/mistral)
- [Moonshot AI (Kimi + Kimi Coding)](/ru/providers/moonshot)
- [NVIDIA](/ru/providers/nvidia)
- [NovitaAI](/ru/providers/novita)
- [Ollama (облачные и локальные модели)](/ru/providers/ollama)
- [Ollama Cloud](/ru/providers/ollama-cloud)
- [OpenAI (API + Codex)](/ru/providers/openai)
- [OpenCode](/ru/providers/opencode)
- [OpenCode Go](/ru/providers/opencode-go)
- [OpenRouter](/ru/providers/openrouter)
- [Perplexity (веб-поиск)](/ru/providers/perplexity-provider)
- [Qianfan](/ru/providers/qianfan)
- [Qwen Cloud](/ru/providers/qwen)
- [Qwen OAuth / Portal](/ru/providers/qwen-oauth)
- [Runway](/ru/providers/runway)
- [SenseAudio](/ru/providers/senseaudio)
- [SGLang (локальные модели)](/ru/providers/sglang)
- [StepFun](/ru/providers/stepfun)
- [Synthetic](/ru/providers/synthetic)
- [Tencent Cloud (TokenHub)](/ru/providers/tencent)
- [Together AI](/ru/providers/together)
- [Venice (Venice AI, с акцентом на конфиденциальность)](/ru/providers/venice)
- [Vercel AI Gateway](/ru/providers/vercel-ai-gateway)
- [vLLM (локальные модели)](/ru/providers/vllm)
- [Volcengine (Doubao)](/ru/providers/volcengine)
- [Vydra](/ru/providers/vydra)
- [xAI](/ru/providers/xai)
- [Xiaomi](/ru/providers/xiaomi)
- [Z.AI (GLM)](/ru/providers/zai)

## Общие обзорные страницы

- [Дополнительные встроенные варианты](/ru/providers/models#additional-bundled-provider-variants) - Anthropic Vertex, Copilot Proxy и Gemini CLI OAuth
- [Генерация изображений](/ru/tools/image-generation) - общий инструмент `image_generate`, выбор провайдера и аварийное переключение
- [Генерация музыки](/ru/tools/music-generation) - общий инструмент `music_generate`, выбор провайдера и аварийное переключение
- [Генерация видео](/ru/tools/video-generation) - общий инструмент `video_generate`, выбор провайдера и аварийное переключение

## Провайдеры транскрибации

- [Deepgram (транскрибация аудио)](/ru/providers/deepgram)
- [ElevenLabs](/ru/providers/elevenlabs#speech-to-text)
- [Mistral](/ru/providers/mistral#audio-transcription-voxtral)
- [OpenAI](/ru/providers/openai#speech-to-text)
- [SenseAudio](/ru/providers/senseaudio)
- [xAI](/ru/providers/xai#speech-to-text)

## Инструменты сообщества

- [Claude Max API Proxy](/ru/providers/claude-max-api-proxy) - прокси сообщества для учетных данных подписки Claude (перед использованием проверьте политику/условия Anthropic)

Полный каталог провайдеров (xAI, Groq, Mistral и т. д.) и расширенную конфигурацию
см. в разделе [Провайдеры моделей](/ru/concepts/model-providers).
