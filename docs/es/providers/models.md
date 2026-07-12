---
read_when:
    - Quieres elegir un proveedor de modelos
    - Quieres ejemplos de configuración rápida para la autenticación de LLM y la selección de modelos
summary: Proveedores de modelos (LLM) compatibles con OpenClaw
title: Inicio rápido del proveedor de modelos
x-i18n:
    generated_at: "2026-07-11T23:26:55Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c4f9add879b41fdb0b54edbbff2ea982957cd4f3bc5d438c43f8a8403a048338
    source_path: providers/models.md
    workflow: 16
---

Elige un proveedor, autentícate y, a continuación, establece el modelo predeterminado como `provider/model`.

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
- [Cloudflare AI Gateway](/es/providers/cloudflare-ai-gateway)
- [Cohere](/es/providers/cohere)
- [ComfyUI](/es/providers/comfy)
- [DeepInfra](/es/providers/deepinfra)
- [fal](/es/providers/fal)
- [Fireworks](/es/providers/fireworks)
- [MiniMax](/es/providers/minimax)
- [Mistral](/es/providers/mistral)
- [Moonshot AI (Kimi + Kimi Coding)](/es/providers/moonshot)
- [NovitaAI](/es/providers/novita)
- [OpenAI (API + Codex)](/es/providers/openai)
- [OpenCode (Zen + Go)](/es/providers/opencode)
- [OpenRouter](/es/providers/openrouter)
- [Qianfan](/es/providers/qianfan)
- [Qwen](/es/providers/qwen)
- [Runway](/es/providers/runway)
- [StepFun](/es/providers/stepfun)
- [Synthetic](/es/providers/synthetic)
- [Venice (Venice AI)](/es/providers/venice)
- [Vercel AI Gateway](/es/providers/vercel-ai-gateway)
- [xAI](/es/providers/xai)
- [Z.AI (GLM)](/es/providers/zai)

Para consultar el catálogo completo de proveedores y la configuración avanzada, consulta el
[directorio de proveedores](/es/providers/index) y [Proveedores de modelos](/es/concepts/model-providers).

## Variantes adicionales de proveedores

- `anthropic-vertex` - instala `@openclaw/anthropic-vertex-provider` para disponer de compatibilidad implícita con Anthropic en Google Vertex cuando haya credenciales de Vertex disponibles; no hay una opción independiente de autenticación durante la incorporación
- `copilot-proxy` - puente local de VS Code Copilot Proxy; usa `openclaw onboard --auth-choice copilot-proxy`
- `google-gemini-cli` - flujo OAuth no oficial de Gemini CLI; requiere una instalación local de `gemini` (`brew install gemini-cli` o `npm install -g @google/gemini-cli`); modelo predeterminado `google-gemini-cli/gemini-3-flash-preview`; usa `openclaw onboard --auth-choice google-gemini-cli` o `openclaw models auth login --provider google-gemini-cli --set-default`

## Contenido relacionado

- [Directorio de proveedores](/es/providers/index)
- [Selección de modelos](/es/concepts/model-providers)
- [Conmutación por error de modelos](/es/concepts/model-failover)
- [CLI de modelos](/es/cli/models)
