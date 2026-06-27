---
read_when:
    - Ви хочете вибрати постачальника моделі
    - Вам потрібен короткий огляд підтримуваних бекендів LLM
summary: Провайдери моделей (LLM), які підтримує OpenClaw
title: Каталог провайдерів
x-i18n:
    generated_at: "2026-06-27T18:11:19Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a340f6a48f6f1d50116316f9679b009365cd617b3453ebd9b2b31e70f6b94c31
    source_path: providers/index.md
    workflow: 16
---

OpenClaw може використовувати багато постачальників LLM. Виберіть постачальника, автентифікуйтеся, а потім задайте
модель за замовчуванням як `provider/model`.

Шукаєте документацію каналів чату (WhatsApp/Telegram/Discord/Slack/Mattermost (Plugin)/тощо)? Див. [Канали](/uk/channels).

## Швидкий старт

1. Автентифікуйтеся в постачальника (зазвичай через `openclaw onboard`).
2. Задайте модель за замовчуванням:

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
- [Azure Speech](/uk/providers/azure-speech)
- [BytePlus (міжнародний)](/uk/concepts/model-providers#byteplus-international)
- [Cerebras](/uk/providers/cerebras)
- [Chutes](/uk/providers/chutes)
- [Cohere](/uk/providers/cohere)
- [Cloudflare AI Gateway](/uk/providers/cloudflare-ai-gateway)
- [ComfyUI](/uk/providers/comfy)
- [DeepSeek](/uk/providers/deepseek)
- [ds4 (локальний DeepSeek V4)](/uk/providers/ds4)
- [ElevenLabs](/uk/providers/elevenlabs)
- [fal](/uk/providers/fal)
- [Fireworks](/uk/providers/fireworks)
- [GitHub Copilot](/uk/providers/github-copilot)
- [GMI Cloud](/uk/providers/gmi)
- [Google (Gemini)](/uk/providers/google)
- [Gradium](/uk/providers/gradium)
- [Groq (виведення LPU)](/uk/providers/groq)
- [Hugging Face (Inference)](/uk/providers/huggingface)
- [inferrs (локальні моделі)](/uk/providers/inferrs)
- [Kilocode](/uk/providers/kilocode)
- [LiteLLM (уніфікований Gateway)](/uk/providers/litellm)
- [LM Studio (локальні моделі)](/uk/providers/lmstudio)
- [MiniMax](/uk/providers/minimax)
- [Mistral](/uk/providers/mistral)
- [Moonshot AI (Kimi + Kimi Coding)](/uk/providers/moonshot)
- [NVIDIA](/uk/providers/nvidia)
- [NovitaAI](/uk/providers/novita)
- [Ollama (хмарні + локальні моделі)](/uk/providers/ollama)
- [Ollama Cloud](/uk/providers/ollama-cloud)
- [OpenAI (API + Codex)](/uk/providers/openai)
- [OpenCode](/uk/providers/opencode)
- [OpenCode Go](/uk/providers/opencode-go)
- [OpenRouter](/uk/providers/openrouter)
- [Perplexity (вебпошук)](/uk/providers/perplexity-provider)
- [Qianfan](/uk/providers/qianfan)
- [Qwen Cloud](/uk/providers/qwen)
- [Qwen OAuth / Portal](/uk/providers/qwen-oauth)
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
- [Z.AI (GLM)](/uk/providers/zai)

## Спільні оглядові сторінки

- [Додаткові вбудовані варіанти](/uk/providers/models#additional-bundled-provider-variants) - Anthropic Vertex, Copilot Proxy і Gemini CLI OAuth
- [Генерація зображень](/uk/tools/image-generation) - Спільний інструмент `image_generate`, вибір постачальника та аварійне перемикання
- [Генерація музики](/uk/tools/music-generation) - Спільний інструмент `music_generate`, вибір постачальника та аварійне перемикання
- [Генерація відео](/uk/tools/video-generation) - Спільний інструмент `video_generate`, вибір постачальника та аварійне перемикання

## Постачальники транскрипції

- [Deepgram (транскрипція аудіо)](/uk/providers/deepgram)
- [ElevenLabs](/uk/providers/elevenlabs#speech-to-text)
- [Mistral](/uk/providers/mistral#audio-transcription-voxtral)
- [OpenAI](/uk/providers/openai#speech-to-text)
- [SenseAudio](/uk/providers/senseaudio)
- [xAI](/uk/providers/xai#speech-to-text)

## Інструменти спільноти

- [Claude Max API Proxy](/uk/providers/claude-max-api-proxy) - Проксі спільноти для облікових даних підписки Claude (перед використанням перевірте політику/умови Anthropic)

Повний каталог постачальників (xAI, Groq, Mistral тощо) і розширену конфігурацію
див. у [Постачальниках моделей](/uk/concepts/model-providers).
