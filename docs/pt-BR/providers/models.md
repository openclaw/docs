---
read_when:
    - Você quer escolher um provedor de model
    - Você quer exemplos rápidos de configuração para auth de LLM + seleção de model
summary: Provedores de model (LLMs) compatíveis com o OpenClaw
title: Início rápido de provedores de model
x-i18n:
    generated_at: "2026-04-06T03:10:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: c0314fb1c754171e5fc252d30f7ba9bb6acdbb978d97e9249264d90351bac2e7
    source_path: providers/models.md
    workflow: 15
---

# Provedores de model

O OpenClaw pode usar muitos provedores de LLM. Escolha um, autentique-se e depois defina o
model padrão como `provider/model`.

## Início rápido (duas etapas)

1. Autentique-se com o provedor (geralmente via `openclaw onboard`).
2. Defina o model padrão:

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

## Provedores compatíveis (conjunto inicial)

- [Alibaba Model Studio](/providers/alibaba)
- [Anthropic (API + Claude CLI)](/pt-BR/providers/anthropic)
- [Amazon Bedrock](/pt-BR/providers/bedrock)
- [BytePlus (internacional)](/pt-BR/concepts/model-providers#byteplus-international)
- [Chutes](/pt-BR/providers/chutes)
- [ComfyUI](/providers/comfy)
- [Cloudflare AI Gateway](/pt-BR/providers/cloudflare-ai-gateway)
- [fal](/providers/fal)
- [Fireworks](/pt-BR/providers/fireworks)
- [GLM models](/pt-BR/providers/glm)
- [MiniMax](/pt-BR/providers/minimax)
- [Mistral](/pt-BR/providers/mistral)
- [Moonshot AI (Kimi + Kimi Coding)](/pt-BR/providers/moonshot)
- [OpenAI (API + Codex)](/pt-BR/providers/openai)
- [OpenCode (Zen + Go)](/pt-BR/providers/opencode)
- [OpenRouter](/pt-BR/providers/openrouter)
- [Qianfan](/pt-BR/providers/qianfan)
- [Qwen](/pt-BR/providers/qwen)
- [Runway](/providers/runway)
- [StepFun](/pt-BR/providers/stepfun)
- [Synthetic](/pt-BR/providers/synthetic)
- [Vercel AI Gateway](/pt-BR/providers/vercel-ai-gateway)
- [Venice (Venice AI)](/pt-BR/providers/venice)
- [xAI](/pt-BR/providers/xai)
- [Z.AI](/pt-BR/providers/zai)

## Variantes adicionais de provedores incluídos

- `anthropic-vertex` - suporte implícito a Anthropic no Google Vertex quando credenciais do Vertex estiverem disponíveis; sem escolha separada de auth no onboarding
- `copilot-proxy` - bridge local do VS Code Copilot Proxy; use `openclaw onboard --auth-choice copilot-proxy`

Para ver o catálogo completo de provedores (xAI, Groq, Mistral etc.) e a configuração avançada,
consulte [Provedores de model](/pt-BR/concepts/model-providers).
