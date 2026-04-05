---
read_when:
    - Ви хочете вибрати постачальника моделей
    - Вам потрібен короткий огляд підтримуваних бекендів LLM
summary: Постачальники моделей (LLM), які підтримує OpenClaw
title: Каталог постачальників
x-i18n:
    generated_at: "2026-04-05T22:36:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 83911cf9bba0d0711fd49081529becf4eb1eea08b61079d71eac927a1d069061
    source_path: providers/index.md
    workflow: 15
---

# Постачальники моделей

OpenClaw може використовувати багато постачальників LLM. Виберіть постачальника, пройдіть автентифікацію, а потім установіть модель за замовчуванням у форматі `provider/model`.

Шукаєте документацію про канали чату (WhatsApp/Telegram/Discord/Slack/Mattermost (plugin)/тощо)? Див. [Channels](/uk/channels).

## Швидкий старт

1. Пройдіть автентифікацію у постачальника (зазвичай через `openclaw onboard`).
2. Установіть модель за замовчуванням:

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

## Документація постачальників

- [Alibaba Model Studio](/uk/providers/alibaba)
- [Amazon Bedrock](/uk/providers/bedrock)
- [Anthropic (API + Claude CLI)](/uk/providers/anthropic)
- [BytePlus (Міжнародний)](/uk/concepts/model-providers#byteplus-international)
- [Chutes](/uk/providers/chutes)
- [Cloudflare AI Gateway](/uk/providers/cloudflare-ai-gateway)
- [DeepSeek](/uk/providers/deepseek)
- [fal](/uk/providers/fal)
- [Fireworks](/uk/providers/fireworks)
- [GitHub Copilot](/uk/providers/github-copilot)
- [Моделі GLM](/uk/providers/glm)
- [Google (Gemini)](/uk/providers/google)
- [Groq (LPU inference)](/uk/providers/groq)
- [Hugging Face (Inference)](/uk/providers/huggingface)
- [Kilocode](/uk/providers/kilocode)
- [LiteLLM (уніфікований шлюз)](/uk/providers/litellm)
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
- [SGLang (локальні моделі)](/uk/providers/sglang)
- [StepFun](/uk/providers/stepfun)
- [Synthetic](/uk/providers/synthetic)
- [Together AI](/uk/providers/together)
- [Venice (Venice AI, орієнтований на конфіденційність)](/uk/providers/venice)
- [Vercel AI Gateway](/uk/providers/vercel-ai-gateway)
- [vLLM (локальні моделі)](/uk/providers/vllm)
- [Volcengine (Doubao)](/uk/providers/volcengine)
- [xAI](/uk/providers/xai)
- [Xiaomi](/uk/providers/xiaomi)
- [Z.AI](/uk/providers/zai)

## Спільні сторінки огляду

- [Додаткові вбудовані варіанти](/uk/providers/models#additional-bundled-provider-variants) - Anthropic Vertex, Copilot Proxy і Gemini CLI OAuth
- [Генерація зображень](/uk/tools/image-generation) - Спільний інструмент `image_generate`, вибір постачальника та failover
- [Генерація відео](/uk/tools/video-generation) - Спільний інструмент `video_generate`, вибір постачальника та failover

## Постачальники транскрипції

- [Deepgram (транскрипція аудіо)](/uk/providers/deepgram)

## Інструменти спільноти

- [Claude Max API Proxy](/uk/providers/claude-max-api-proxy) - Проксі спільноти для облікових даних підписки Claude (перед використанням перевірте політику/умови Anthropic)

Для повного каталогу постачальників (xAI, Groq, Mistral тощо) і розширеної конфігурації див. [Model providers](/uk/concepts/model-providers).
