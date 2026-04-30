---
read_when:
    - Quieres usar Cerebras con OpenClaw
    - Se necesita la variable de entorno de la clave de API de Cerebras o la opción de autenticación de CLI
summary: Configuración de Cerebras (autenticación + selección de modelo)
title: Cerebras
x-i18n:
    generated_at: "2026-04-30T05:56:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: 96f94b23e55340414633ff48e352623907ee36dd2715e5ab053a93c86df1b49a
    source_path: providers/cerebras.md
    workflow: 16
---

[Cerebras](https://www.cerebras.ai) proporciona inferencia de alta velocidad compatible con OpenAI.

| Propiedad | Valor                        |
| -------- | ---------------------------- |
| Proveedor | `cerebras`                   |
| Autenticación     | `CEREBRAS_API_KEY`           |
| API      | compatible con OpenAI            |
| URL base | `https://api.cerebras.ai/v1` |

## Primeros pasos

<Steps>
  <Step title="Get an API key">
    Crea una clave de API en la [consola de Cerebras Cloud](https://cloud.cerebras.ai).
  </Step>
  <Step title="Run onboarding">
    ```bash
    openclaw onboard --auth-choice cerebras-api-key
    ```
  </Step>
  <Step title="Verify models are available">
    ```bash
    openclaw models list --provider cerebras
    ```
  </Step>
</Steps>

### Configuración no interactiva

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice cerebras-api-key \
  --cerebras-api-key "$CEREBRAS_API_KEY"
```

## Catálogo integrado

OpenClaw incluye un catálogo estático de Cerebras para el endpoint público compatible con OpenAI:

| Referencia del modelo                                 | Nombre                 | Notas                                  |
| ----------------------------------------- | -------------------- | -------------------------------------- |
| `cerebras/zai-glm-4.7`                    | Z.ai GLM 4.7         | Modelo predeterminado; modelo de razonamiento en vista previa |
| `cerebras/gpt-oss-120b`                   | GPT OSS 120B         | Modelo de razonamiento de producción             |
| `cerebras/qwen-3-235b-a22b-instruct-2507` | Qwen 3 235B Instruct | Modelo sin razonamiento en vista previa            |
| `cerebras/llama3.1-8b`                    | Llama 3.1 8B         | Modelo de producción centrado en la velocidad         |

<Warning>
Cerebras marca `zai-glm-4.7` y `qwen-3-235b-a22b-instruct-2507` como modelos en vista previa, y `llama3.1-8b` / `qwen-3-235b-a22b-instruct-2507` están documentados para quedar obsoletos el 27 de mayo de 2026. Consulta la página de modelos compatibles de Cerebras antes de depender de ellos en producción.
</Warning>

## Configuración manual

El Plugin incluido normalmente significa que solo necesitas la clave de API. Usa una configuración explícita de
`models.providers.cerebras` cuando quieras sobrescribir los metadatos del modelo:

```json5
{
  env: { CEREBRAS_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "cerebras/zai-glm-4.7" },
    },
  },
  models: {
    mode: "merge",
    providers: {
      cerebras: {
        baseUrl: "https://api.cerebras.ai/v1",
        apiKey: "${CEREBRAS_API_KEY}",
        api: "openai-completions",
        models: [
          { id: "zai-glm-4.7", name: "Z.ai GLM 4.7" },
          { id: "gpt-oss-120b", name: "GPT OSS 120B" },
        ],
      },
    },
  },
}
```

<Note>
Si el Gateway se ejecuta como daemon (launchd/systemd), asegúrate de que `CEREBRAS_API_KEY`
esté disponible para ese proceso, por ejemplo en `~/.openclaw/.env` o mediante
`env.shellEnv`.
</Note>
