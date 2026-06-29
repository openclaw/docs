---
read_when:
    - Вы хотите выбрать поставщика моделей
    - Вы хотите быстрые примеры настройки аутентификации LLM и выбора модели
summary: Поставщики моделей (LLM), поддерживаемые OpenClaw
title: Краткое руководство по поставщику моделей
x-i18n:
    generated_at: "2026-06-28T23:37:59Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ca59b0203b4b5e327b2718a356f6fc1da2f868dac4ca219a2597a96dbf949804
    source_path: providers/models.md
    workflow: 16
---

OpenClaw может использовать множество провайдеров LLM. Выберите одного, выполните аутентификацию, затем задайте модель по умолчанию
как `provider/model`.

## Быстрый старт (два шага)

1. Выполните аутентификацию у провайдера (обычно через `openclaw onboard`).
2. Задайте модель по умолчанию:

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

## Поддерживаемые провайдеры (начальный набор)

- [Alibaba Model Studio](/ru/providers/alibaba)
- [Amazon Bedrock](/ru/providers/bedrock)
- [Anthropic (API + Claude CLI)](/ru/providers/anthropic)
- [BytePlus (International)](/ru/concepts/model-providers#byteplus-international)
- [Chutes](/ru/providers/chutes)
- [Cohere](/ru/providers/cohere)
- [ComfyUI](/ru/providers/comfy)
- [Cloudflare AI Gateway](/ru/providers/cloudflare-ai-gateway)
- [DeepInfra](/ru/providers/deepinfra)
- [fal](/ru/providers/fal)
- [Fireworks](/ru/providers/fireworks)
- [MiniMax](/ru/providers/minimax)
- [Mistral](/ru/providers/mistral)
- [Moonshot AI (Kimi + Kimi Coding)](/ru/providers/moonshot)
- [OpenAI (API + Codex)](/ru/providers/openai)
- [OpenCode (Zen + Go)](/ru/providers/opencode)
- [OpenRouter](/ru/providers/openrouter)
- [Qianfan](/ru/providers/qianfan)
- [Qwen](/ru/providers/qwen)
- [Runway](/ru/providers/runway)
- [StepFun](/ru/providers/stepfun)
- [Synthetic](/ru/providers/synthetic)
- [Vercel AI Gateway](/ru/providers/vercel-ai-gateway)
- [Venice (Venice AI)](/ru/providers/venice)
- [xAI](/ru/providers/xai)
- [Z.AI (GLM)](/ru/providers/zai)

## Дополнительные варианты провайдеров

- `anthropic-vertex` - установите `@openclaw/anthropic-vertex-provider` для неявной поддержки Anthropic в Google Vertex, когда доступны учетные данные Vertex; отдельный вариант аутентификации при онбординге не требуется
- `copilot-proxy` - локальный мост VS Code Copilot Proxy; используйте `openclaw onboard --auth-choice copilot-proxy`
- `google-gemini-cli` - неофициальный OAuth-поток Gemini CLI; требует локальной установки `gemini` (`brew install gemini-cli` или `npm install -g @google/gemini-cli`); модель по умолчанию `google-gemini-cli/gemini-3-flash-preview`; используйте `openclaw onboard --auth-choice google-gemini-cli` или `openclaw models auth login --provider google-gemini-cli --set-default`

Полный каталог провайдеров (xAI, Groq, Mistral и т. д.) и расширенную конфигурацию
см. в разделе [Провайдеры моделей](/ru/concepts/model-providers).

## Связанные материалы

- [Выбор модели](/ru/concepts/model-providers)
- [Резервное переключение моделей](/ru/concepts/model-failover)
- [CLI моделей](/ru/cli/models)
