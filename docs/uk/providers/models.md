---
read_when:
    - Ви хочете вибрати постачальника моделі
    - Вам потрібні короткі приклади налаштування автентифікації LLM і вибору моделі
summary: Постачальники моделей (LLM), які підтримує OpenClaw
title: Швидкий старт із постачальником моделей
x-i18n:
    generated_at: "2026-06-27T18:12:09Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ca59b0203b4b5e327b2718a356f6fc1da2f868dac4ca219a2597a96dbf949804
    source_path: providers/models.md
    workflow: 16
---

OpenClaw може використовувати багато постачальників LLM. Виберіть одного, автентифікуйтеся, а потім задайте типову
модель як `provider/model`.

## Швидкий старт (два кроки)

1. Автентифікуйтеся в постачальника (зазвичай через `openclaw onboard`).
2. Задайте типову модель:

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

## Підтримувані постачальники (початковий набір)

- [Alibaba Model Studio](/uk/providers/alibaba)
- [Amazon Bedrock](/uk/providers/bedrock)
- [Anthropic (API + Claude CLI)](/uk/providers/anthropic)
- [BytePlus (International)](/uk/concepts/model-providers#byteplus-international)
- [Chutes](/uk/providers/chutes)
- [Cohere](/uk/providers/cohere)
- [ComfyUI](/uk/providers/comfy)
- [Cloudflare AI Gateway](/uk/providers/cloudflare-ai-gateway)
- [DeepInfra](/uk/providers/deepinfra)
- [fal](/uk/providers/fal)
- [Fireworks](/uk/providers/fireworks)
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
- [Z.AI (GLM)](/uk/providers/zai)

## Додаткові варіанти постачальників

- `anthropic-vertex` - установіть `@openclaw/anthropic-vertex-provider` для неявної підтримки Anthropic у Google Vertex, коли доступні облікові дані Vertex; окремий вибір автентифікації під час онбордингу не потрібен
- `copilot-proxy` - локальний міст VS Code Copilot Proxy; використовуйте `openclaw onboard --auth-choice copilot-proxy`
- `google-gemini-cli` - неофіційний потік OAuth Gemini CLI; потребує локального встановлення `gemini` (`brew install gemini-cli` або `npm install -g @google/gemini-cli`); типова модель `google-gemini-cli/gemini-3-flash-preview`; використовуйте `openclaw onboard --auth-choice google-gemini-cli` або `openclaw models auth login --provider google-gemini-cli --set-default`

Повний каталог постачальників (xAI, Groq, Mistral тощо) і розширену конфігурацію
див. у розділі [Постачальники моделей](/uk/concepts/model-providers).

## Пов’язане

- [Вибір моделі](/uk/concepts/model-providers)
- [Відмовостійке перемикання моделей](/uk/concepts/model-failover)
- [CLI моделей](/uk/cli/models)
