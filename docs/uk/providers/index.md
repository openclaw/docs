---
read_when:
    - Ви хочете вибрати постачальника моделей
    - Вам потрібен швидкий огляд підтримуваних бекендів LLM
summary: Постачальники моделей (LLM), які підтримує OpenClaw
title: Каталог постачальників
x-i18n:
    generated_at: "2026-04-25T11:57:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9e031e997f0dbf97e3e26d5ee05bd99c2877653daa04423d210d01b9045d8c5c
    source_path: providers/index.md
    workflow: 15
---

# Постачальники моделей

OpenClaw може використовувати багато постачальників LLM. Виберіть постачальника, пройдіть автентифікацію, а потім задайте типову модель як `provider/model`.

Шукаєте документацію для каналів чату (WhatsApp/Telegram/Discord/Slack/Mattermost (plugin)/тощо)? Див. [Channels](/uk/channels).

## Швидкий старт

1. Пройдіть автентифікацію в постачальника (зазвичай через `openclaw onboard`).
2. Задайте типову модель:

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

## Документація постачальників

- [Alibaba Model Studio](/uk/providers/alibaba)
- [Amazon Bedrock](/uk/providers/bedrock)
- [Amazon Bedrock Mantle](/uk/providers/bedrock-mantle)
- [Anthropic (API + Claude CLI)](/uk/providers/anthropic)
- [Arcee AI (моделі Trinity)](/uk/providers/arcee)
- [BytePlus (міжнародний)](/uk/concepts/model-providers#byteplus-international)
- [Chutes](/uk/providers/chutes)
- [Cloudflare AI Gateway](/uk/providers/cloudflare-ai-gateway)
- [ComfyUI](/uk/providers/comfy)
- [DeepSeek](/uk/providers/deepseek)
- [ElevenLabs](/uk/providers/elevenlabs)
- [fal](/uk/providers/fal)
- [Fireworks](/uk/providers/fireworks)
- [GitHub Copilot](/uk/providers/github-copilot)
- [Gradium](/uk/providers/gradium)
- [Моделі GLM](/uk/providers/glm)
- [Google (Gemini)](/uk/providers/google)
- [Groq (інференс LPU)](/uk/providers/groq)
- [Hugging Face (Inference)](/uk/providers/huggingface)
- [inferrs (локальні моделі)](/uk/providers/inferrs)
- [Kilocode](/uk/providers/kilocode)
- [LiteLLM (уніфікований шлюз)](/uk/providers/litellm)
- [LM Studio (локальні моделі)](/uk/providers/lmstudio)
- [MiniMax](/uk/providers/minimax)
- [Mistral](/uk/providers/mistral)
- [Moonshot AI (Kimi + Kimi Coding)](/uk/providers/moonshot)
- [NVIDIA](/uk/providers/nvidia)
- [Ollama (хмарні та локальні моделі)](/uk/providers/ollama)
- [OpenAI (API + Codex)](/uk/providers/openai)
- [OpenCode](/uk/providers/opencode)
- [OpenCode Go](/uk/providers/opencode-go)
- [OpenRouter](/uk/providers/openrouter)
- [Perplexity (вебпошук)](/uk/providers/perplexity-provider)
- [Qianfan](/uk/providers/qianfan)
- [Qwen Cloud](/uk/providers/qwen)
- [Runway](/uk/providers/runway)
- [SenseAudio](/uk/providers/senseaudio)
- [SGLang (локальні моделі)](/uk/providers/sglang)
- [StepFun](/uk/providers/stepfun)
- [Synthetic](/uk/providers/synthetic)
- [Tencent Cloud (TokenHub)](/uk/providers/tencent)
- [Together AI](/uk/providers/together)
- [Venice (Venice AI, орієнтований на приватність)](/uk/providers/venice)
- [Vercel AI Gateway](/uk/providers/vercel-ai-gateway)
- [vLLM (локальні моделі)](/uk/providers/vllm)
- [Volcengine (Doubao)](/uk/providers/volcengine)
- [Vydra](/uk/providers/vydra)
- [xAI](/uk/providers/xai)
- [Xiaomi](/uk/providers/xiaomi)
- [Z.AI](/uk/providers/zai)

## Спільні оглядові сторінки

- [Додаткові вбудовані варіанти](/uk/providers/models#additional-bundled-provider-variants) - Anthropic Vertex, Copilot Proxy і Gemini CLI OAuth
- [Генерація зображень](/uk/tools/image-generation) - Спільний інструмент `image_generate`, вибір постачальника та failover
- [Генерація музики](/uk/tools/music-generation) - Спільний інструмент `music_generate`, вибір постачальника та failover
- [Генерація відео](/uk/tools/video-generation) - Спільний інструмент `video_generate`, вибір постачальника та failover

## Постачальники транскрипції

- [Deepgram (транскрипція аудіо)](/uk/providers/deepgram)
- [ElevenLabs](/uk/providers/elevenlabs#speech-to-text)
- [Mistral](/uk/providers/mistral#audio-transcription-voxtral)
- [OpenAI](/uk/providers/openai#speech-to-text)
- [SenseAudio](/uk/providers/senseaudio)
- [xAI](/uk/providers/xai#speech-to-text)

## Інструменти спільноти

- [Claude Max API Proxy](/uk/providers/claude-max-api-proxy) - Проксі спільноти для облікових даних підписки Claude (перед використанням перевірте політику/умови Anthropic)

Повний каталог постачальників (xAI, Groq, Mistral тощо) і розширену конфігурацію див. у [Постачальники моделей](/uk/concepts/model-providers).
