---
read_when:
    - Ви хочете вибрати постачальника моделей
    - Вам потрібні швидкі приклади налаштування для автентифікації LLM + вибору моделі
summary: Постачальники моделей (LLM), які підтримує OpenClaw
title: Швидкий старт для провайдера моделей
x-i18n:
    generated_at: "2026-05-06T16:17:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7e95d37f3e332a9b2eb58a15dc356ad02b4cbf409926adb3faf1923825219887
    source_path: providers/models.md
    workflow: 16
---

OpenClaw може використовувати багатьох постачальників LLM. Виберіть одного, автентифікуйтеся, а потім задайте стандартну
модель як `provider/model`.

## Швидкий старт (два кроки)

1. Автентифікуйтеся в постачальника (зазвичай через `openclaw onboard`).
2. Задайте стандартну модель:

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

## Підтримувані постачальники (базовий набір)

- [Alibaba Model Studio](/uk/providers/alibaba)
- [Amazon Bedrock](/uk/providers/bedrock)
- [Anthropic (API + Claude CLI)](/uk/providers/anthropic)
- [BytePlus (International)](/uk/concepts/model-providers#byteplus-international)
- [Chutes](/uk/providers/chutes)
- [ComfyUI](/uk/providers/comfy)
- [Cloudflare AI Gateway](/uk/providers/cloudflare-ai-gateway)
- [DeepInfra](/uk/providers/deepinfra)
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

## Додаткові вбудовані варіанти постачальників

- `anthropic-vertex` - неявна підтримка Anthropic у Google Vertex, коли доступні облікові дані Vertex; без окремого вибору автентифікації під час первинного налаштування
- `copilot-proxy` - локальний міст VS Code Copilot Proxy; використовуйте `openclaw onboard --auth-choice copilot-proxy`
- `google-gemini-cli` - неофіційний потік OAuth Gemini CLI; потрібне локальне встановлення `gemini` (`brew install gemini-cli` або `npm install -g @google/gemini-cli`); стандартна модель `google-gemini-cli/gemini-3-flash-preview`; використовуйте `openclaw onboard --auth-choice google-gemini-cli` або `openclaw models auth login --provider google-gemini-cli --set-default`

Повний каталог постачальників (xAI, Groq, Mistral тощо) і розширену конфігурацію
див. у розділі [Постачальники моделей](/uk/concepts/model-providers).

## Пов’язане

- [Вибір моделі](/uk/concepts/model-providers)
- [Резервне перемикання моделі](/uk/concepts/model-failover)
- [CLI моделей](/uk/cli/models)
