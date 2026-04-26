---
read_when:
    - Ви хочете вибрати провайдера моделі
    - Вам потрібен швидкий огляд підтримуваних бекендів LLM
summary: Провайдери моделей (LLM), які підтримує OpenClaw
title: Каталог провайдерів
x-i18n:
    generated_at: "2026-04-26T00:46:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: b5d3bf5b30bd7a1dbd8b1348f4f07f178fea9bfea523afa96cad2a30d566a139
    source_path: providers/index.md
    workflow: 15
---

# Провайдери моделей

OpenClaw може використовувати багато провайдерів LLM. Виберіть провайдера, пройдіть автентифікацію, а потім встановіть модель за замовчуванням у форматі `provider/model`.

Шукаєте документацію для чат-каналів (WhatsApp/Telegram/Discord/Slack/Mattermost (Plugin)/тощо)? Див. [Канали](/uk/channels).

## Швидкий старт

1. Пройдіть автентифікацію у провайдера (зазвичай через `openclaw onboard`).
2. Встановіть модель за замовчуванням:

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
- [Hugging Face (інференс)](/uk/providers/huggingface)
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
- [Venice (Venice AI, з акцентом на конфіденційність)](/uk/providers/venice)
- [Vercel AI Gateway](/uk/providers/vercel-ai-gateway)
- [vLLM (локальні моделі)](/uk/providers/vllm)
- [Volcengine (Doubao)](/uk/providers/volcengine)
- [Vydra](/uk/providers/vydra)
- [xAI](/uk/providers/xai)
- [Xiaomi](/uk/providers/xiaomi)
- [Z.AI](/uk/providers/zai)

## Спільні оглядові сторінки

- [Додаткові вбудовані варіанти](/uk/providers/models#additional-bundled-provider-variants) - Anthropic Vertex, Copilot Proxy і Gemini CLI OAuth
- [Генерація зображень](/uk/tools/image-generation) - Спільний інструмент `image_generate`, вибір провайдера та перемикання при збої
- [Генерація музики](/uk/tools/music-generation) - Спільний інструмент `music_generate`, вибір провайдера та перемикання при збої
- [Генерація відео](/uk/tools/video-generation) - Спільний інструмент `video_generate`, вибір провайдера та перемикання при збої

## Провайдери транскрипції

- [Deepgram (транскрипція аудіо)](/uk/providers/deepgram)
- [ElevenLabs](/uk/providers/elevenlabs#speech-to-text)
- [Mistral](/uk/providers/mistral#audio-transcription-voxtral)
- [OpenAI](/uk/providers/openai#speech-to-text)
- [SenseAudio](/uk/providers/senseaudio)
- [xAI](/uk/providers/xai#speech-to-text)

## Інструменти спільноти

- [Claude Max API Proxy](/uk/providers/claude-max-api-proxy) - Проксі від спільноти для облікових даних підписки Claude (перед використанням перевірте політику/умови Anthropic)

Повний каталог провайдерів (xAI, Groq, Mistral тощо) і розширену конфігурацію див. у розділі [Провайдери моделей](/uk/concepts/model-providers).
