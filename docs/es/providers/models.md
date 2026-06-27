---
read_when:
    - Quieres elegir un proveedor de modelos
    - Quieres ejemplos de configuración rápida para la autenticación de LLM y la selección de modelo
summary: Proveedores de modelos (LLM) compatibles con OpenClaw
title: Inicio rápido del proveedor de modelos
x-i18n:
    generated_at: "2026-06-27T12:38:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ca59b0203b4b5e327b2718a356f6fc1da2f868dac4ca219a2597a96dbf949804
    source_path: providers/models.md
    workflow: 16
---

OpenClaw puede usar muchos proveedores de LLM. Elige uno, autentícate y luego establece el modelo predeterminado como `provider/model`.

## Inicio rápido (dos pasos)

1. Autentícate con el proveedor (normalmente mediante `openclaw onboard`).
2. Establece el modelo predeterminado:

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

## Proveedores compatibles (conjunto inicial)

- [Alibaba Model Studio](/es/providers/alibaba)
- [Amazon Bedrock](/es/providers/bedrock)
- [Anthropic (API + CLI de Claude)](/es/providers/anthropic)
- [BytePlus (Internacional)](/es/concepts/model-providers#byteplus-international)
- [Chutes](/es/providers/chutes)
- [Cohere](/es/providers/cohere)
- [ComfyUI](/es/providers/comfy)
- [Cloudflare AI Gateway](/es/providers/cloudflare-ai-gateway)
- [DeepInfra](/es/providers/deepinfra)
- [fal](/es/providers/fal)
- [Fireworks](/es/providers/fireworks)
- [MiniMax](/es/providers/minimax)
- [Mistral](/es/providers/mistral)
- [Moonshot AI (Kimi + Kimi Coding)](/es/providers/moonshot)
- [OpenAI (API + Codex)](/es/providers/openai)
- [OpenCode (Zen + Go)](/es/providers/opencode)
- [OpenRouter](/es/providers/openrouter)
- [Qianfan](/es/providers/qianfan)
- [Qwen](/es/providers/qwen)
- [Runway](/es/providers/runway)
- [StepFun](/es/providers/stepfun)
- [Synthetic](/es/providers/synthetic)
- [Vercel AI Gateway](/es/providers/vercel-ai-gateway)
- [Venice (Venice AI)](/es/providers/venice)
- [xAI](/es/providers/xai)
- [Z.AI (GLM)](/es/providers/zai)

## Variantes adicionales de proveedores

- `anthropic-vertex` - instala `@openclaw/anthropic-vertex-provider` para admitir Anthropic implícito en Google Vertex cuando las credenciales de Vertex estén disponibles; no hay una opción de autenticación de incorporación independiente
- `copilot-proxy` - puente local de VS Code Copilot Proxy; usa `openclaw onboard --auth-choice copilot-proxy`
- `google-gemini-cli` - flujo OAuth no oficial de Gemini CLI; requiere una instalación local de `gemini` (`brew install gemini-cli` o `npm install -g @google/gemini-cli`); modelo predeterminado `google-gemini-cli/gemini-3-flash-preview`; usa `openclaw onboard --auth-choice google-gemini-cli` o `openclaw models auth login --provider google-gemini-cli --set-default`

Para ver el catálogo completo de proveedores (xAI, Groq, Mistral, etc.) y la configuración avanzada,
consulta [Proveedores de modelos](/es/concepts/model-providers).

## Relacionado

- [Selección de modelos](/es/concepts/model-providers)
- [Conmutación por error de modelos](/es/concepts/model-failover)
- [CLI de modelos](/es/cli/models)
