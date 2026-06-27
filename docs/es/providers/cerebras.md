---
read_when:
    - Quieres usar Cerebras con OpenClaw
    - Necesitas la variable de entorno de clave de API de Cerebras o la opción de autenticación de la CLI
summary: Configuración de Cerebras (autenticación + selección de modelo)
title: Cerebras
x-i18n:
    generated_at: "2026-06-27T12:34:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cd21756ac521c7b60ca6d3dfbef8665574dca52d1a25e6293169b24f4af6273e
    source_path: providers/cerebras.md
    workflow: 16
---

[Cerebras](https://www.cerebras.ai) proporciona inferencia de alta velocidad compatible con OpenAI en hardware de inferencia personalizado. El Plugin proveedor de Cerebras incluye un catálogo estático de cuatro modelos.

| Propiedad                    | Valor                                    |
| ---------------------------- | ---------------------------------------- |
| ID del proveedor             | `cerebras`                               |
| Plugin                       | paquete externo oficial                  |
| Variable de entorno de auth  | `CEREBRAS_API_KEY`                       |
| Marca de configuración inicial | `--auth-choice cerebras-api-key`       |
| Marca directa de CLI         | `--cerebras-api-key <key>`               |
| API                          | compatible con OpenAI (`openai-completions`) |
| URL base                     | `https://api.cerebras.ai/v1`             |
| Modelo predeterminado        | `cerebras/zai-glm-4.7`                   |

## Instalar Plugin

Instala el Plugin oficial y luego reinicia Gateway:

```bash
openclaw plugins install @openclaw/cerebras-provider
openclaw gateway restart
```

## Primeros pasos

<Steps>
  <Step title="Get an API key">
    Crea una clave de API en la [Consola de Cerebras Cloud](https://cloud.cerebras.ai).
  </Step>
  <Step title="Run onboarding">
    <CodeGroup>

```bash Configuración inicial
openclaw onboard --auth-choice cerebras-api-key
```

```bash Marca directa
openclaw onboard --non-interactive \
  --auth-choice cerebras-api-key \
  --cerebras-api-key "$CEREBRAS_API_KEY"
```

```bash Solo env
export CEREBRAS_API_KEY=csk-...
```

    </CodeGroup>

  </Step>
  <Step title="Verify models are available">
    ```bash
    openclaw models list --provider cerebras
    ```

    La lista debe incluir los cuatro modelos estáticos. Si `CEREBRAS_API_KEY` no se resuelve, `openclaw models status --json` informa la credencial faltante en `auth.unusableProfiles`.

  </Step>
</Steps>

## Configuración no interactiva

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice cerebras-api-key \
  --cerebras-api-key "$CEREBRAS_API_KEY"
```

## Catálogo integrado

OpenClaw incluye un catálogo estático de Cerebras que refleja el endpoint público compatible con OpenAI. Los cuatro modelos comparten un contexto de 128k y 8.192 tokens de salida máxima.

| Referencia de modelo                    | Nombre               | Razonamiento | Notas                                      |
| --------------------------------------- | -------------------- | ------------ | ------------------------------------------ |
| `cerebras/zai-glm-4.7`                  | Z.ai GLM 4.7         | sí           | Modelo predeterminado; modelo de razonamiento en vista previa |
| `cerebras/gpt-oss-120b`                 | GPT OSS 120B         | sí           | Modelo de razonamiento de producción       |
| `cerebras/qwen-3-235b-a22b-instruct-2507` | Qwen 3 235B Instruct | no          | Modelo sin razonamiento en vista previa    |
| `cerebras/llama3.1-8b`                  | Llama 3.1 8B         | no           | Modelo de producción centrado en velocidad |

<Warning>
  Cerebras marca `zai-glm-4.7` y `qwen-3-235b-a22b-instruct-2507` como modelos en vista previa, y `llama3.1-8b` junto con `qwen-3-235b-a22b-instruct-2507` están documentados para quedar obsoletos el 27 de mayo de 2026. Consulta la página de modelos compatibles de Cerebras antes de depender de ellos para cargas de trabajo de producción.
</Warning>

## Configuración manual

El Plugin normalmente significa que solo necesitas la clave de API. Usa la configuración explícita `models.providers.cerebras` cuando quieras sobrescribir los metadatos del modelo o ejecutar en `mode: "merge"` contra el catálogo estático:

```json5
{
  env: { CEREBRAS_API_KEY: "csk-..." },
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
  Si Gateway se ejecuta como daemon (launchd, systemd, Docker), asegúrate de que `CEREBRAS_API_KEY` esté disponible para ese proceso; por ejemplo, en `~/.openclaw/.env` o mediante `env.shellEnv`. Una clave exportada solo en un shell interactivo no ayudará a un servicio administrado a menos que el entorno se importe por separado.
</Note>

## Relacionado

<CardGroup cols={2}>
  <Card title="Model providers" href="/es/concepts/model-providers" icon="layers">
    Elegir proveedores, referencias de modelos y comportamiento de conmutación por error.
  </Card>
  <Card title="Thinking modes" href="/es/tools/thinking" icon="brain">
    Niveles de esfuerzo de razonamiento para los dos modelos de Cerebras con capacidad de razonamiento.
  </Card>
  <Card title="Configuration reference" href="/es/gateway/config-agents#agent-defaults" icon="gear">
    Valores predeterminados de agentes y configuración de modelos.
  </Card>
  <Card title="Models FAQ" href="/es/help/faq-models" icon="circle-question">
    Perfiles de autenticación, cambio de modelos y resolución de errores de "sin perfil".
  </Card>
</CardGroup>
