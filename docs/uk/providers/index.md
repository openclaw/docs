---
read_when:
    - Ви хочете вибрати провайдера моделі
    - Вам потрібен короткий огляд підтримуваних бекендів LLM
summary: Провайдери моделей (LLM), які підтримує OpenClaw
title: Каталог провайдерів
x-i18n:
    generated_at: "2026-04-27T09:30:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5a20e0fd3464755880656da60e95d72e214dd13fc99d9aa4f3b7daaa212d12ec
    source_path: providers/index.md
    workflow: 15
---

# Провайдери моделей

OpenClaw може використовувати багато провайдерів LLM. Виберіть провайдера, пройдіть автентифікацію, а потім установіть
модель за замовчуванням у форматі `provider/model`.

Шукаєте документацію про chat-канали (WhatsApp/Telegram/Discord/Slack/Mattermost (plugin)/тощо)? Див. [Channels](/uk/channels).

## Швидкий старт

1. Пройдіть автентифікацію у провайдера (зазвичай через `openclaw onboard`).
2. Установіть модель за замовчуванням:

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

## Документація провайдерів

- [Alibaba Model Studio](/uk/providers/alibaba)
- [Amazon Bedrock](/uk/providers/bedrock)
- [Amazon Bedrock Mantle](/uk/providers/bedrock-mantle)
- [Anthropic (API + Claude CLI)](/uk/providers/anthropic)
- [Arcee AI (моделі Trinity)](/uk/providers/arcee)
- [Azure Speech](/uk/providers/azure-speech)
- [BytePlus (міжнародний)](/uk/concepts/model-providers#byteplus-international)
- [Cerebras](/uk/providers/cerebras)
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
- [Groq (LPU-інференс)](/uk/providers/groq)
- [Hugging Face (Inference)](/uk/providers/huggingface)
- [inferrs (локальні моделі)](/uk/providers/inferrs)
- [Kilocode](/uk/providers/kilocode)
- [LiteLLM (уніфікований gateway)](/uk/providers/litellm)
- [LM Studio (локальні моделі)](/uk/providers/lmstudio)
- [MiniMax](/uk/providers/minimax)
- [Mistral](/uk/providers/mistral)
- [Moonshot AI (Kimi + Kimi Coding)](/uk/providers/moonshot)
- [NVIDIA](/uk/providers/nvidia)
- [Ollama (хмарні + локальні моделі)](/uk/providers/ollama)
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
- [Venice (Venice AI, зосереджений на конфіденційності)](/uk/providers/venice)
- [Vercel AI Gateway](/uk/providers/vercel-ai-gateway)
- [vLLM (локальні моделі)](/uk/providers/vllm)
- [Volcengine (Doubao)](/uk/providers/volcengine)
- [Vydra](/uk/providers/vydra)
- [xAI](/uk/providers/xai)
- [Xiaomi](/uk/providers/xiaomi)
- [Z.AI](/uk/providers/zai)

## Спільні оглядові сторінки

- [Додаткові вбудовані варіанти](/uk/providers/models#additional-bundled-provider-variants) - Anthropic Vertex, Copilot Proxy і Gemini CLI OAuth
- [Генерація зображень](/uk/tools/image-generation) - спільний інструмент `image_generate`, вибір провайдера та failover
- [Генерація музики](/uk/tools/music-generation) - спільний інструмент `music_generate`, вибір провайдера та failover
- [Генерація відео](/uk/tools/video-generation) - спільний інструмент `video_generate`, вибір провайдера та failover

## Провайдери транскрибування

- [Deepgram (транскрибування аудіо)](/uk/providers/deepgram)
- [ElevenLabs](/uk/providers/elevenlabs#speech-to-text)
- [Mistral](/uk/providers/mistral#audio-transcription-voxtral)
- [OpenAI](/uk/providers/openai#speech-to-text)
- [SenseAudio](/uk/providers/senseaudio)
- [xAI](/uk/providers/xai#speech-to-text)

## Інструменти спільноти

- [Claude Max API Proxy](/uk/providers/claude-max-api-proxy) - проксі від спільноти для облікових даних підписки Claude (перед використанням перевірте політику/умови Anthropic)

Повний каталог провайдерів (xAI, Groq, Mistral тощо) та розширену конфігурацію
див. у [Model providers](/uk/concepts/model-providers).
