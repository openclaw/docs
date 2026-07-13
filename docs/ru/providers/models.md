---
read_when:
    - Вы хотите выбрать провайдера модели
    - Вам нужны краткие примеры настройки аутентификации LLM и выбора модели
summary: Поставщики моделей (LLM), поддерживаемые OpenClaw
title: Краткое руководство по поставщику моделей
x-i18n:
    generated_at: "2026-07-13T18:41:28Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 24
    provider: openai
    source_hash: c4f9add879b41fdb0b54edbbff2ea982957cd4f3bc5d438c43f8a8403a048338
    source_path: providers/models.md
    workflow: 16
---

Выберите провайдера, выполните аутентификацию, затем задайте модель по умолчанию как `provider/model`.

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
- [BytePlus (международная версия)](/ru/concepts/model-providers#byteplus-international)
- [Chutes](/ru/providers/chutes)
- [Cloudflare AI Gateway](/ru/providers/cloudflare-ai-gateway)
- [Cohere](/ru/providers/cohere)
- [ComfyUI](/ru/providers/comfy)
- [DeepInfra](/ru/providers/deepinfra)
- [fal](/ru/providers/fal)
- [Fireworks](/ru/providers/fireworks)
- [MiniMax](/ru/providers/minimax)
- [Mistral](/ru/providers/mistral)
- [Moonshot AI (Kimi + Kimi Coding)](/ru/providers/moonshot)
- [NovitaAI](/ru/providers/novita)
- [OpenAI (API + Codex)](/ru/providers/openai)
- [OpenCode (Zen + Go)](/ru/providers/opencode)
- [OpenRouter](/ru/providers/openrouter)
- [Qianfan](/ru/providers/qianfan)
- [Qwen](/ru/providers/qwen)
- [Runway](/ru/providers/runway)
- [StepFun](/ru/providers/stepfun)
- [Synthetic](/ru/providers/synthetic)
- [Venice (Venice AI)](/ru/providers/venice)
- [Vercel AI Gateway](/ru/providers/vercel-ai-gateway)
- [xAI](/ru/providers/xai)
- [Z.AI (GLM)](/ru/providers/zai)

Полный каталог провайдеров и расширенную конфигурацию см. в разделах
[Каталог провайдеров](/ru/providers/index) и [Провайдеры моделей](/ru/concepts/model-providers).

## Дополнительные варианты провайдеров

- `anthropic-vertex` — установите `@openclaw/anthropic-vertex-provider` для автоматической поддержки Anthropic в Google Vertex при наличии учётных данных Vertex; отдельный выбор аутентификации при первоначальной настройке не требуется
- `copilot-proxy` — локальный мост к VS Code Copilot Proxy; используйте `openclaw onboard --auth-choice copilot-proxy`
- `google-gemini-cli` — неофициальная процедура OAuth для Gemini CLI; требуется локальная установка `gemini` (`brew install gemini-cli` или `npm install -g @google/gemini-cli`); модель по умолчанию — `google-gemini-cli/gemini-3-flash-preview`; используйте `openclaw onboard --auth-choice google-gemini-cli` или `openclaw models auth login --provider google-gemini-cli --set-default`

## Связанные разделы

- [Каталог провайдеров](/ru/providers/index)
- [Выбор модели](/ru/concepts/model-providers)
- [Переключение на резервную модель](/ru/concepts/model-failover)
- [CLI моделей](/ru/cli/models)
