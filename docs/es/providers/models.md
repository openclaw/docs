---
read_when:
    - Quieres elegir un proveedor de modelos
    - Quieres ejemplos de configuración rápida para autenticación de LLM + selección de modelo
summary: Proveedores de modelos (LLM) compatibles con OpenClaw
title: Inicio rápido de proveedores de modelos
x-i18n:
    generated_at: "2026-04-23T14:07:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9b002903bd0a1872e77d871f283ae426c74356936c5776c710711d7328427fca
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
- [BytePlus (internacional)](/es/concepts/model-providers#byteplus-international)
- [Chutes](/es/providers/chutes)
- [ComfyUI](/es/providers/comfy)
- [Cloudflare AI Gateway](/es/providers/cloudflare-ai-gateway)
- [fal](/es/providers/fal)
- [Fireworks](/es/providers/fireworks)
- [Modelos GLM](/es/providers/glm)
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

## Variantes adicionales de proveedores agrupados

- `anthropic-vertex`: compatibilidad implícita de Anthropic en Google Vertex cuando hay credenciales de Vertex disponibles; sin opción de autenticación independiente en la incorporación
- `copilot-proxy`: puente local de VS Code Copilot Proxy; usa `openclaw onboard --auth-choice copilot-proxy`
- `google-gemini-cli`: flujo OAuth no oficial de Gemini CLI; requiere una instalación local de `gemini` (`brew install gemini-cli` o `npm install -g @google/gemini-cli`); modelo predeterminado `google-gemini-cli/gemini-3-flash-preview`; usa `openclaw onboard --auth-choice google-gemini-cli` o `openclaw models auth login --provider google-gemini-cli --set-default`

Para el catálogo completo de proveedores (xAI, Groq, Mistral, etc.) y la configuración avanzada,
consulta [Proveedores de modelos](/es/concepts/model-providers).
