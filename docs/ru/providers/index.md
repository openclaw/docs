---
read_when:
    - Вы хотите выбрать провайдера модели
    - Вам нужен краткий обзор поддерживаемых бэкендов LLM
summary: Провайдеры моделей (LLM), поддерживаемые OpenClaw
title: Каталог провайдеров
x-i18n:
    generated_at: "2026-07-13T18:30:00Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 24
    provider: openai
    source_hash: b59843b53265500866e87ee8d888892dacd6045bdb9401a1e7ec08ad4f364090
    source_path: providers/index.md
    workflow: 16
---

OpenClaw может использовать множество поставщиков LLM. Выберите поставщика, выполните аутентификацию, затем задайте
модель по умолчанию как `provider/model`.

Ищете документацию по каналам чатов (WhatsApp/Telegram/Discord/Slack/Mattermost (плагин)/и т. д.)? См. [Каналы](/ru/channels).

## Быстрый старт

1. Выполните аутентификацию у поставщика (обычно через `openclaw onboard`).
2. Задайте модель по умолчанию:

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

## Документация поставщиков

- [Alibaba Model Studio](/ru/providers/alibaba)
- [Amazon Bedrock](/ru/providers/bedrock)
- [Amazon Bedrock Mantle](/ru/providers/bedrock-mantle)
- [Anthropic (API + Claude CLI)](/ru/providers/anthropic)
- [Arcee AI (модели Trinity)](/ru/providers/arcee)
- [Azure Speech](/ru/providers/azure-speech)
- [BytePlus (международная версия)](/ru/concepts/model-providers#byteplus-international)
- [Cerebras](/ru/providers/cerebras)
- [Chutes](/ru/providers/chutes)
- [ClawRouter (управляемая маршрутизация между несколькими поставщиками)](/ru/providers/clawrouter)
- [Cloudflare AI Gateway](/ru/providers/cloudflare-ai-gateway)
- [Cohere](/ru/providers/cohere)
- [ComfyUI](/ru/providers/comfy)
- [DeepSeek](/ru/providers/deepseek)
- [ds4 (локальный DeepSeek V4)](/ru/providers/ds4)
- [ElevenLabs](/ru/providers/elevenlabs)
- [fal](/ru/providers/fal)
- [Featherless AI](/providers/featherless)
- [Fireworks](/ru/providers/fireworks)
- [GitHub Copilot](/ru/providers/github-copilot)
- [GMI Cloud](/ru/providers/gmi)
- [Google (Gemini)](/ru/providers/google)
- [Gradium](/ru/providers/gradium)
- [Groq (инференс на LPU)](/ru/providers/groq)
- [Hugging Face (инференс)](/ru/providers/huggingface)
- [inferrs (локальные модели)](/ru/providers/inferrs)
- [Kilocode](/ru/providers/kilocode)
- [LiteLLM (унифицированный шлюз)](/ru/providers/litellm)
- [LM Studio (локальные модели)](/ru/providers/lmstudio)
- [LongCat](/ru/providers/longcat)
- [MiniMax](/ru/providers/minimax)
- [Mistral](/ru/providers/mistral)
- [Moonshot AI (Kimi + Kimi Coding)](/ru/providers/moonshot)
- [NovitaAI](/ru/providers/novita)
- [NVIDIA](/ru/providers/nvidia)
- [Ollama (облачные + локальные модели)](/ru/providers/ollama)
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
- [Tencent Cloud (TokenHub / TokenPlan)](/ru/providers/tencent)
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

- [Дополнительные варианты поставщиков](/ru/providers/models#additional-provider-variants) — Anthropic Vertex, Copilot Proxy и Gemini CLI OAuth
- [Генерация изображений](/ru/tools/image-generation) — общий инструмент `image_generate`, выбор поставщика и переключение при сбое
- [Генерация музыки](/ru/tools/music-generation) — общий инструмент `music_generate`, выбор поставщика и переключение при сбое
- [Генерация видео](/ru/tools/video-generation) — общий инструмент `video_generate`, выбор поставщика и переключение при сбое

## Поставщики транскрипции

- [Deepgram (транскрипция аудио)](/ru/providers/deepgram)
- [ElevenLabs](/ru/providers/elevenlabs#speech-to-text)
- [Mistral](/ru/providers/mistral#audio-transcription-voxtral)
- [OpenAI](/ru/providers/openai)
- [SenseAudio](/ru/providers/senseaudio)
- [xAI](/ru/providers/xai)

## Инструменты сообщества

- [Claude Max API Proxy](/ru/providers/claude-max-api-proxy) — прокси сообщества для учётных данных подписки Claude (перед использованием ознакомьтесь с политикой и условиями Anthropic)

Полный каталог поставщиков (xAI, Groq, Mistral и т. д.) и расширенные параметры конфигурации
см. в разделе [Поставщики моделей](/ru/concepts/model-providers).
