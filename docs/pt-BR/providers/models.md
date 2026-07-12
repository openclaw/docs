---
read_when:
    - Você quer escolher um provedor de modelos
    - Você quer exemplos de configuração rápida para autenticação de LLM + seleção de modelo
summary: Provedores de modelos (LLMs) compatíveis com o OpenClaw
title: Início rápido do provedor de modelos
x-i18n:
    generated_at: "2026-07-12T00:19:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c4f9add879b41fdb0b54edbbff2ea982957cd4f3bc5d438c43f8a8403a048338
    source_path: providers/models.md
    workflow: 16
---

Escolha um provedor, autentique-se e defina o modelo padrão como `provider/model`.

## Início rápido (duas etapas)

1. Autentique-se no provedor (geralmente por meio de `openclaw onboard`).
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
- [BytePlus (internacional)](/pt-BR/concepts/model-providers#byteplus-international)
- [Chutes](/pt-BR/providers/chutes)
- [Cloudflare AI Gateway](/pt-BR/providers/cloudflare-ai-gateway)
- [Cohere](/pt-BR/providers/cohere)
- [ComfyUI](/pt-BR/providers/comfy)
- [DeepInfra](/pt-BR/providers/deepinfra)
- [fal](/pt-BR/providers/fal)
- [Fireworks](/pt-BR/providers/fireworks)
- [MiniMax](/pt-BR/providers/minimax)
- [Mistral](/pt-BR/providers/mistral)
- [Moonshot AI (Kimi + Kimi Coding)](/pt-BR/providers/moonshot)
- [NovitaAI](/pt-BR/providers/novita)
- [OpenAI (API + Codex)](/pt-BR/providers/openai)
- [OpenCode (Zen + Go)](/pt-BR/providers/opencode)
- [OpenRouter](/pt-BR/providers/openrouter)
- [Qianfan](/pt-BR/providers/qianfan)
- [Qwen](/pt-BR/providers/qwen)
- [Runway](/pt-BR/providers/runway)
- [StepFun](/pt-BR/providers/stepfun)
- [Synthetic](/pt-BR/providers/synthetic)
- [Venice (Venice AI)](/pt-BR/providers/venice)
- [Vercel AI Gateway](/pt-BR/providers/vercel-ai-gateway)
- [xAI](/pt-BR/providers/xai)
- [Z.AI (GLM)](/pt-BR/providers/zai)

Para consultar o catálogo completo de provedores e as configurações avançadas, consulte
[Diretório de provedores](/pt-BR/providers/index) e [Provedores de modelos](/pt-BR/concepts/model-providers).

## Variantes adicionais de provedores

- `anthropic-vertex` — instale `@openclaw/anthropic-vertex-provider` para oferecer compatibilidade implícita com a Anthropic no Google Vertex quando as credenciais do Vertex estiverem disponíveis; não há uma opção de autenticação separada na integração inicial
- `copilot-proxy` — ponte local do VS Code Copilot Proxy; use `openclaw onboard --auth-choice copilot-proxy`
- `google-gemini-cli` — fluxo OAuth não oficial da Gemini CLI; requer uma instalação local do `gemini` (`brew install gemini-cli` ou `npm install -g @google/gemini-cli`); modelo padrão `google-gemini-cli/gemini-3-flash-preview`; use `openclaw onboard --auth-choice google-gemini-cli` ou `openclaw models auth login --provider google-gemini-cli --set-default`

## Relacionados

- [Diretório de provedores](/pt-BR/providers/index)
- [Seleção de modelos](/pt-BR/concepts/model-providers)
- [Failover de modelos](/pt-BR/concepts/model-failover)
- [CLI de modelos](/pt-BR/cli/models)
