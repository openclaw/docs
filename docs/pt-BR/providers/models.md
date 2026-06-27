---
read_when:
    - Você quer escolher um provedor de modelo
    - Você quer exemplos de configuração rápida para autenticação de LLM + seleção de modelo
summary: Provedores de modelos (LLMs) compatíveis com OpenClaw
title: Início rápido do provedor de modelos
x-i18n:
    generated_at: "2026-06-27T18:04:46Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ca59b0203b4b5e327b2718a356f6fc1da2f868dac4ca219a2597a96dbf949804
    source_path: providers/models.md
    workflow: 16
---

O OpenClaw pode usar muitos provedores de LLM. Escolha um, autentique-se e defina o modelo padrão
como `provider/model`.

## Início rápido (duas etapas)

1. Autentique-se com o provedor (geralmente via `openclaw onboard`).
2. Defina o modelo padrão:

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

## Provedores compatíveis (conjunto inicial)

- [Alibaba Model Studio](/pt-BR/providers/alibaba)
- [Amazon Bedrock](/pt-BR/providers/bedrock)
- [Anthropic (API + Claude CLI)](/pt-BR/providers/anthropic)
- [BytePlus (Internacional)](/pt-BR/concepts/model-providers#byteplus-international)
- [Chutes](/pt-BR/providers/chutes)
- [Cohere](/pt-BR/providers/cohere)
- [ComfyUI](/pt-BR/providers/comfy)
- [Cloudflare AI Gateway](/pt-BR/providers/cloudflare-ai-gateway)
- [DeepInfra](/pt-BR/providers/deepinfra)
- [fal](/pt-BR/providers/fal)
- [Fireworks](/pt-BR/providers/fireworks)
- [MiniMax](/pt-BR/providers/minimax)
- [Mistral](/pt-BR/providers/mistral)
- [Moonshot AI (Kimi + Kimi Coding)](/pt-BR/providers/moonshot)
- [OpenAI (API + Codex)](/pt-BR/providers/openai)
- [OpenCode (Zen + Go)](/pt-BR/providers/opencode)
- [OpenRouter](/pt-BR/providers/openrouter)
- [Qianfan](/pt-BR/providers/qianfan)
- [Qwen](/pt-BR/providers/qwen)
- [Runway](/pt-BR/providers/runway)
- [StepFun](/pt-BR/providers/stepfun)
- [Synthetic](/pt-BR/providers/synthetic)
- [Vercel AI Gateway](/pt-BR/providers/vercel-ai-gateway)
- [Venice (Venice AI)](/pt-BR/providers/venice)
- [xAI](/pt-BR/providers/xai)
- [Z.AI (GLM)](/pt-BR/providers/zai)

## Variantes adicionais de provedores

- `anthropic-vertex` - instale `@openclaw/anthropic-vertex-provider` para suporte implícito à Anthropic no Google Vertex quando credenciais do Vertex estiverem disponíveis; sem opção separada de autenticação na integração inicial
- `copilot-proxy` - ponte local do VS Code Copilot Proxy; use `openclaw onboard --auth-choice copilot-proxy`
- `google-gemini-cli` - fluxo OAuth não oficial da Gemini CLI; requer uma instalação local de `gemini` (`brew install gemini-cli` ou `npm install -g @google/gemini-cli`); modelo padrão `google-gemini-cli/gemini-3-flash-preview`; use `openclaw onboard --auth-choice google-gemini-cli` ou `openclaw models auth login --provider google-gemini-cli --set-default`

Para o catálogo completo de provedores (xAI, Groq, Mistral etc.) e configuração avançada,
consulte [Provedores de modelos](/pt-BR/concepts/model-providers).

## Relacionado

- [Seleção de modelo](/pt-BR/concepts/model-providers)
- [Failover de modelo](/pt-BR/concepts/model-failover)
- [CLI de modelos](/pt-BR/cli/models)
