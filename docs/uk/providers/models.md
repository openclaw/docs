---
read_when:
    - Ви хочете вибрати постачальника моделі
    - Вам потрібні короткі приклади налаштування автентифікації LLM і вибору моделі
summary: Постачальники моделей (LLM), які підтримує OpenClaw
title: Швидкий старт із постачальником моделей
x-i18n:
    generated_at: "2026-07-12T13:42:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c4f9add879b41fdb0b54edbbff2ea982957cd4f3bc5d438c43f8a8403a048338
    source_path: providers/models.md
    workflow: 16
---

Виберіть провайдера, пройдіть автентифікацію, а потім задайте модель за замовчуванням у форматі `provider/model`.

## Швидкий початок (два кроки)

1. Пройдіть автентифікацію в провайдера (зазвичай за допомогою `openclaw onboard`).
2. Задайте модель за замовчуванням:

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

## Підтримувані провайдери (початковий набір)

- [Alibaba Model Studio](/uk/providers/alibaba)
- [Amazon Bedrock](/uk/providers/bedrock)
- [Anthropic (API + Claude CLI)](/uk/providers/anthropic)
- [BytePlus (міжнародна версія)](/uk/concepts/model-providers#byteplus-international)
- [Chutes](/uk/providers/chutes)
- [Cloudflare AI Gateway](/uk/providers/cloudflare-ai-gateway)
- [Cohere](/uk/providers/cohere)
- [ComfyUI](/uk/providers/comfy)
- [DeepInfra](/uk/providers/deepinfra)
- [fal](/uk/providers/fal)
- [Fireworks](/uk/providers/fireworks)
- [MiniMax](/uk/providers/minimax)
- [Mistral](/uk/providers/mistral)
- [Moonshot AI (Kimi + Kimi Coding)](/uk/providers/moonshot)
- [NovitaAI](/uk/providers/novita)
- [OpenAI (API + Codex)](/uk/providers/openai)
- [OpenCode (Zen + Go)](/uk/providers/opencode)
- [OpenRouter](/uk/providers/openrouter)
- [Qianfan](/uk/providers/qianfan)
- [Qwen](/uk/providers/qwen)
- [Runway](/uk/providers/runway)
- [StepFun](/uk/providers/stepfun)
- [Synthetic](/uk/providers/synthetic)
- [Venice (Venice AI)](/uk/providers/venice)
- [Vercel AI Gateway](/uk/providers/vercel-ai-gateway)
- [xAI](/uk/providers/xai)
- [Z.AI (GLM)](/uk/providers/zai)

Повний каталог провайдерів і розширені параметри конфігурації див. у розділах
[Каталог провайдерів](/uk/providers/index) і [Провайдери моделей](/uk/concepts/model-providers).

## Додаткові варіанти провайдерів

- `anthropic-vertex` — установіть `@openclaw/anthropic-vertex-provider` для неявної підтримки Anthropic у Google Vertex за наявності облікових даних Vertex; окремий вибір автентифікації під час початкового налаштування не потрібен
- `copilot-proxy` — локальний міст VS Code Copilot Proxy; використовуйте `openclaw onboard --auth-choice copilot-proxy`
- `google-gemini-cli` — неофіційний процес OAuth через Gemini CLI; потребує локально встановленого `gemini` (`brew install gemini-cli` або `npm install -g @google/gemini-cli`); модель за замовчуванням — `google-gemini-cli/gemini-3-flash-preview`; використовуйте `openclaw onboard --auth-choice google-gemini-cli` або `openclaw models auth login --provider google-gemini-cli --set-default`

## Пов’язані матеріали

- [Каталог провайдерів](/uk/providers/index)
- [Вибір моделі](/uk/concepts/model-providers)
- [Перемикання моделі в разі відмови](/uk/concepts/model-failover)
- [CLI моделей](/uk/cli/models)
