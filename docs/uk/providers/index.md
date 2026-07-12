---
read_when:
    - Ви хочете вибрати постачальника моделей
    - Вам потрібен короткий огляд підтримуваних бекендів великих мовних моделей (LLM)
summary: Постачальники моделей (LLM), які підтримує OpenClaw
title: Каталог постачальників
x-i18n:
    generated_at: "2026-07-12T13:37:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b59843b53265500866e87ee8d888892dacd6045bdb9401a1e7ec08ad4f364090
    source_path: providers/index.md
    workflow: 16
---

OpenClaw може використовувати багатьох постачальників LLM. Виберіть постачальника, пройдіть автентифікацію, а потім задайте
модель за замовчуванням у форматі `provider/model`.

Шукаєте документацію щодо каналів чату (WhatsApp/Telegram/Discord/Slack/Mattermost (плагін)/тощо)? Див. [Канали](/uk/channels).

## Швидкий початок

1. Пройдіть автентифікацію в постачальника (зазвичай за допомогою `openclaw onboard`).
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
- [BytePlus (міжнародна версія)](/uk/concepts/model-providers#byteplus-international)
- [Cerebras](/uk/providers/cerebras)
- [Chutes](/uk/providers/chutes)
- [ClawRouter (керована маршрутизація між кількома постачальниками)](/uk/providers/clawrouter)
- [Cloudflare AI Gateway](/uk/providers/cloudflare-ai-gateway)
- [Cohere](/uk/providers/cohere)
- [ComfyUI](/uk/providers/comfy)
- [DeepSeek](/uk/providers/deepseek)
- [ds4 (локальний DeepSeek V4)](/uk/providers/ds4)
- [ElevenLabs](/uk/providers/elevenlabs)
- [fal](/uk/providers/fal)
- [Featherless AI](/providers/featherless)
- [Fireworks](/uk/providers/fireworks)
- [GitHub Copilot](/uk/providers/github-copilot)
- [GMI Cloud](/uk/providers/gmi)
- [Google (Gemini)](/uk/providers/google)
- [Gradium](/uk/providers/gradium)
- [Groq (виведення на LPU)](/uk/providers/groq)
- [Hugging Face (виведення)](/uk/providers/huggingface)
- [inferrs (локальні моделі)](/uk/providers/inferrs)
- [Kilocode](/uk/providers/kilocode)
- [LiteLLM (уніфікований Gateway)](/uk/providers/litellm)
- [LM Studio (локальні моделі)](/uk/providers/lmstudio)
- [LongCat](/uk/providers/longcat)
- [MiniMax](/uk/providers/minimax)
- [Mistral](/uk/providers/mistral)
- [Moonshot AI (Kimi + Kimi Coding)](/uk/providers/moonshot)
- [NovitaAI](/uk/providers/novita)
- [NVIDIA](/uk/providers/nvidia)
- [Ollama (хмарні та локальні моделі)](/uk/providers/ollama)
- [Ollama Cloud](/uk/providers/ollama-cloud)
- [OpenAI (API + Codex)](/uk/providers/openai)
- [OpenCode](/uk/providers/opencode)
- [OpenCode Go](/uk/providers/opencode-go)
- [OpenRouter](/uk/providers/openrouter)
- [Perplexity (пошук в інтернеті)](/uk/providers/perplexity-provider)
- [Qianfan](/uk/providers/qianfan)
- [Qwen Cloud](/uk/providers/qwen)
- [Qwen OAuth / Portal](/uk/providers/qwen-oauth)
- [Runway](/uk/providers/runway)
- [SenseAudio](/uk/providers/senseaudio)
- [SGLang (локальні моделі)](/uk/providers/sglang)
- [StepFun](/uk/providers/stepfun)
- [Synthetic](/uk/providers/synthetic)
- [Tencent Cloud (TokenHub / TokenPlan)](/uk/providers/tencent)
- [Together AI](/uk/providers/together)
- [Venice (Venice AI, орієнтований на конфіденційність)](/uk/providers/venice)
- [Vercel AI Gateway](/uk/providers/vercel-ai-gateway)
- [vLLM (локальні моделі)](/uk/providers/vllm)
- [Volcengine (Doubao)](/uk/providers/volcengine)
- [Vydra](/uk/providers/vydra)
- [xAI](/uk/providers/xai)
- [Xiaomi](/uk/providers/xiaomi)
- [Z.AI (GLM)](/uk/providers/zai)

## Спільні оглядові сторінки

- [Додаткові варіанти постачальників](/uk/providers/models#additional-provider-variants) — Anthropic Vertex, Copilot Proxy і Gemini CLI OAuth
- [Генерування зображень](/uk/tools/image-generation) — спільний інструмент `image_generate`, вибір постачальника та перемикання в разі відмови
- [Генерування музики](/uk/tools/music-generation) — спільний інструмент `music_generate`, вибір постачальника та перемикання в разі відмови
- [Генерування відео](/uk/tools/video-generation) — спільний інструмент `video_generate`, вибір постачальника та перемикання в разі відмови

## Постачальники транскрибування

- [Deepgram (транскрибування аудіо)](/uk/providers/deepgram)
- [ElevenLabs](/uk/providers/elevenlabs#speech-to-text)
- [Mistral](/uk/providers/mistral#audio-transcription-voxtral)
- [OpenAI](/uk/providers/openai)
- [SenseAudio](/uk/providers/senseaudio)
- [xAI](/uk/providers/xai)

## Інструменти спільноти

- [Claude Max API Proxy](/uk/providers/claude-max-api-proxy) — проксі спільноти для облікових даних підписки Claude (перед використанням перевірте політику й умови Anthropic)

Повний каталог постачальників (xAI, Groq, Mistral тощо) та розширені налаштування
див. у розділі [Постачальники моделей](/uk/concepts/model-providers).
