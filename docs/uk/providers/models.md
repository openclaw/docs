---
read_when:
    - Ви хочете вибрати постачальника моделей
    - Ви хочете швидкі приклади налаштування автентифікації LLM і вибору моделі
summary: Постачальники моделей (LLM), які підтримує OpenClaw
title: Швидкий старт для постачальника моделей
x-i18n:
    generated_at: "2026-04-06T00:47:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: c0314fb1c754171e5fc252d30f7ba9bb6acdbb978d97e9249264d90351bac2e7
    source_path: providers/models.md
    workflow: 15
---

# Постачальники моделей

OpenClaw може використовувати багато постачальників LLM. Виберіть одного, пройдіть автентифікацію, а потім встановіть типову
модель як `provider/model`.

## Швидкий старт (два кроки)

1. Пройдіть автентифікацію у постачальника (зазвичай через `openclaw onboard`).
2. Встановіть типову модель:

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

## Підтримувані постачальники (стартовий набір)

- [Alibaba Model Studio](/uk/providers/alibaba)
- [Anthropic (API + Claude CLI)](/uk/providers/anthropic)
- [Amazon Bedrock](/uk/providers/bedrock)
- [BytePlus (міжнародний)](/uk/concepts/model-providers#byteplus-international)
- [Chutes](/uk/providers/chutes)
- [ComfyUI](/providers/comfy)
- [Cloudflare AI Gateway](/uk/providers/cloudflare-ai-gateway)
- [fal](/uk/providers/fal)
- [Fireworks](/uk/providers/fireworks)
- [Моделі GLM](/uk/providers/glm)
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

## Додаткові варіанти вбудованих постачальників

- `anthropic-vertex` - неявна підтримка Anthropic у Google Vertex, коли доступні облікові дані Vertex; окремий вибір автентифікації під час онбордингу не потрібен
- `copilot-proxy` - локальний міст VS Code Copilot Proxy; використовуйте `openclaw onboard --auth-choice copilot-proxy`

Повний каталог постачальників (xAI, Groq, Mistral тощо) і розширене налаштування
дивіться в розділі [Постачальники моделей](/uk/concepts/model-providers).
