---
read_when:
    - Ви хочете вибрати провайдера моделі
    - Ви хочете швидкі приклади налаштування для автентифікації LLM + вибору моделі
summary: Провайдери моделей (LLM), які підтримує OpenClaw
title: Швидкий старт для провайдерів моделей
x-i18n:
    generated_at: "2026-04-23T21:07:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: d38d0eb6af7c3bf415b476c3ea752c29a8a24f8e93e5d52bf86ee685faf79f1a
    source_path: providers/models.md
    workflow: 15
---

# Провайдери моделей

OpenClaw може використовувати багато провайдерів LLM. Виберіть одного, пройдіть автентифікацію, а потім задайте типову
модель у форматі `provider/model`.

## Швидкий старт (два кроки)

1. Пройдіть автентифікацію у провайдера (зазвичай через `openclaw onboard`).
2. Установіть типову модель:

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

## Підтримувані провайдери (базовий набір)

- [Alibaba Model Studio](/uk/providers/alibaba)
- [Amazon Bedrock](/uk/providers/bedrock)
- [Anthropic (API + Claude CLI)](/uk/providers/anthropic)
- [BytePlus (International)](/uk/concepts/model-providers#byteplus-international)
- [Chutes](/uk/providers/chutes)
- [ComfyUI](/uk/providers/comfy)
- [Cloudflare AI Gateway](/uk/providers/cloudflare-ai-gateway)
- [fal](/uk/providers/fal)
- [Fireworks](/uk/providers/fireworks)
- [GLM models](/uk/providers/glm)
- [MiniMax](/uk/providers/minimax)
- [Mistral](/uk/providers/mistral)
- [Moonshot AI (Kimi + Kimi Coding)](/uk/providers/moonshot)
- [OpenAI (API + Codex)](/uk/providers/openai)
- [OpenCode (Zen + Go)](/uk/providers/opencode)
- [OpenRouter](/uk/providers/openrouter)
- [Qianfan](/uk/providers/qianfan)
- [Qwen](/uk/providers/qwen)
- [Runway](/uk/providers/runway)
- [StepFun](/uk/providers/stepfun)
- [Synthetic](/uk/providers/synthetic)
- [Vercel AI Gateway](/uk/providers/vercel-ai-gateway)
- [Venice (Venice AI)](/uk/providers/venice)
- [xAI](/uk/providers/xai)
- [Z.AI](/uk/providers/zai)

## Додаткові варіанти вбудованих провайдерів

- `anthropic-vertex` - неявна підтримка Anthropic у Google Vertex, коли доступні облікові дані Vertex; окремого варіанта автентифікації в онбордингу немає
- `copilot-proxy` - локальний міст VS Code Copilot Proxy; використовуйте `openclaw onboard --auth-choice copilot-proxy`
- `google-gemini-cli` - неофіційний OAuth-потік Gemini CLI; вимагає локального встановлення `gemini` (`brew install gemini-cli` або `npm install -g @google/gemini-cli`); типова модель `google-gemini-cli/gemini-3-flash-preview`; використовуйте `openclaw onboard --auth-choice google-gemini-cli` або `openclaw models auth login --provider google-gemini-cli --set-default`

Повний каталог провайдерів (xAI, Groq, Mistral тощо) і розширену конфігурацію див. у [Model providers](/uk/concepts/model-providers).
