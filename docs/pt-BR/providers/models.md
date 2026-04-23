---
read_when:
    - Você quer escolher um provedor de modelo
    - Você quer exemplos rápidos de configuração para autenticação de LLM + seleção de modelo
summary: Provedores de modelo (LLMs) compatíveis com o OpenClaw
title: Início rápido de provedores de modelo
x-i18n:
    generated_at: "2026-04-23T14:06:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9b002903bd0a1872e77d871f283ae426c74356936c5776c710711d7328427fca
    source_path: providers/models.md
    workflow: 15
---

# Provedores de modelo

O OpenClaw pode usar muitos provedores de LLM. Escolha um, autentique-se e depois defina o
modelo padrão como `provider/model`.

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
- [BytePlus (International)](/pt-BR/concepts/model-providers#byteplus-international)
- [Chutes](/pt-BR/providers/chutes)
- [ComfyUI](/pt-BR/providers/comfy)
- [Cloudflare AI Gateway](/pt-BR/providers/cloudflare-ai-gateway)
- [fal](/pt-BR/providers/fal)
- [Fireworks](/pt-BR/providers/fireworks)
- [Modelos GLM](/pt-BR/providers/glm)
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
- [Z.AI](/pt-BR/providers/zai)

## Variantes adicionais de provedor integrado

- `anthropic-vertex` - suporte implícito a Anthropic no Google Vertex quando credenciais do Vertex estão disponíveis; sem opção separada de autenticação no onboarding
- `copilot-proxy` - bridge local do VS Code Copilot Proxy; use `openclaw onboard --auth-choice copilot-proxy`
- `google-gemini-cli` - fluxo OAuth não oficial da Gemini CLI; exige uma instalação local de `gemini` (`brew install gemini-cli` ou `npm install -g @google/gemini-cli`); modelo padrão `google-gemini-cli/gemini-3-flash-preview`; use `openclaw onboard --auth-choice google-gemini-cli` ou `openclaw models auth login --provider google-gemini-cli --set-default`

Para o catálogo completo de provedores (xAI, Groq, Mistral etc.) e configuração avançada,
consulte [Provedores de modelo](/pt-BR/concepts/model-providers).
