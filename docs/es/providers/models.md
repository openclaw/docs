---
read_when:
    - Quieres elegir un proveedor de modelos
    - Quieres ejemplos rápidos de configuración para autenticación LLM + selección de modelo
summary: Proveedores de modelos (LLM) compatibles con OpenClaw
title: Inicio rápido de proveedores de modelos
x-i18n:
    generated_at: "2026-04-24T05:45:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: b824a664e0e7a7a5b0ea640ea7329ea3d1e3d12b85d9310231c76014b2ae01cc
    source_path: providers/models.md
    workflow: 15
---

# Proveedores de modelos

OpenClaw puede usar muchos proveedores de LLM. Elige uno, autentícate y luego establece el
modelo predeterminado como `provider/model`.

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
- [Anthropic (API + Claude CLI)](/es/providers/anthropic)
- [BytePlus (International)](/es/concepts/model-providers#byteplus-international)
- [Chutes](/es/providers/chutes)
- [ComfyUI](/es/providers/comfy)
- [Cloudflare AI Gateway](/es/providers/cloudflare-ai-gateway)
- [fal](/es/providers/fal)
- [Fireworks](/es/providers/fireworks)
- [GLM models](/es/providers/glm)
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
- [Z.AI](/es/providers/zai)

## Variantes adicionales de proveedores incluidos

- `anthropic-vertex` - compatibilidad implícita con Anthropic en Google Vertex cuando hay credenciales de Vertex disponibles; no hay opción separada de autenticación en la incorporación
- `copilot-proxy` - puente local de VS Code Copilot Proxy; usa `openclaw onboard --auth-choice copilot-proxy`
- `google-gemini-cli` - flujo no oficial de OAuth de Gemini CLI; requiere una instalación local de `gemini` (`brew install gemini-cli` o `npm install -g @google/gemini-cli`); modelo predeterminado `google-gemini-cli/gemini-3-flash-preview`; usa `openclaw onboard --auth-choice google-gemini-cli` o `openclaw models auth login --provider google-gemini-cli --set-default`

Para ver el catálogo completo de proveedores (xAI, Groq, Mistral, etc.) y la configuración avanzada,
consulta [Proveedores de modelos](/es/concepts/model-providers).

## Relacionado

- [Selección de modelo](/es/concepts/model-providers)
- [Failover de modelos](/es/concepts/model-failover)
- [CLI de modelos](/es/cli/models)
