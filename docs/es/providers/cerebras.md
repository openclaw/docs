---
read_when:
    - Quieres usar Cerebras con OpenClaw
    - Necesitas la variable de entorno de la clave de API de Cerebras o la opción de autenticación de la CLI
summary: Configuración de Cerebras (autenticación + selección de modelo)
title: Cerebras
x-i18n:
    generated_at: "2026-05-06T05:45:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6ba12fcc214ac756111a94f16ec619d26dc01ee2acc1eaef013fcb70bf752610
    source_path: providers/cerebras.md
    workflow: 16
---

[Cerebras](https://www.cerebras.ai) proporciona inferencia de alta velocidad compatible con OpenAI en hardware de inferencia personalizado. OpenClaw incluye un Plugin de proveedor de Cerebras integrado con un catálogo estático de cuatro modelos.

| Propiedad                           | Valor                                       |
| ----------------------------------- | ------------------------------------------- |
| ID de proveedor                     | `cerebras`                                  |
| Plugin                              | integrado, `enabledByDefault: true`         |
| Variable de entorno de autenticación | `CEREBRAS_API_KEY`                          |
| Marca de incorporación              | `--auth-choice cerebras-api-key`            |
| Marca directa de CLI                | `--cerebras-api-key <key>`                  |
| API                                 | compatible con OpenAI (`openai-completions`) |
| URL base                            | `https://api.cerebras.ai/v1`                |
| Modelo predeterminado               | `cerebras/zai-glm-4.7`                      |

## Primeros pasos

<Steps>
  <Step title="Obtener una clave de API">
    Crea una clave de API en la [Cerebras Cloud Console](https://cloud.cerebras.ai).
  </Step>
  <Step title="Ejecutar la incorporación">
    <CodeGroup>

```bash Onboarding
openclaw onboard --auth-choice cerebras-api-key
```

```bash Direct flag
openclaw onboard --non-interactive \
  --auth-choice cerebras-api-key \
  --cerebras-api-key "$CEREBRAS_API_KEY"
```

```bash Env only
export CEREBRAS_API_KEY=csk-...
```

    </CodeGroup>

  </Step>
  <Step title="Verificar que los modelos estén disponibles">
    ```bash
    openclaw models list --provider cerebras
    ```

    La lista debe incluir los cuatro modelos integrados. Si `CEREBRAS_API_KEY` no se resuelve, `openclaw models status --json` informa la credencial faltante en `auth.unusableProfiles`.

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

OpenClaw incluye un catálogo estático de Cerebras que replica el endpoint público compatible con OpenAI. Los cuatro modelos comparten un contexto de 128k y 8192 tokens de salida máxima.

| Referencia del modelo                     | Nombre               | Razonamiento | Notas                                          |
| ----------------------------------------- | -------------------- | ------------ | ---------------------------------------------- |
| `cerebras/zai-glm-4.7`                    | Z.ai GLM 4.7         | sí           | Modelo predeterminado; modelo de razonamiento en vista previa |
| `cerebras/gpt-oss-120b`                   | GPT OSS 120B         | sí           | Modelo de razonamiento de producción           |
| `cerebras/qwen-3-235b-a22b-instruct-2507` | Qwen 3 235B Instruct | no           | Modelo sin razonamiento en vista previa        |
| `cerebras/llama3.1-8b`                    | Llama 3.1 8B         | no           | Modelo de producción enfocado en velocidad     |

<Warning>
  Cerebras marca `zai-glm-4.7` y `qwen-3-235b-a22b-instruct-2507` como modelos en vista previa, y `llama3.1-8b` junto con `qwen-3-235b-a22b-instruct-2507` están documentados para su obsolescencia el 27 de mayo de 2026. Consulta la página de modelos compatibles de Cerebras antes de depender de ellos para cargas de trabajo de producción.
</Warning>

## Configuración manual

El Plugin integrado normalmente significa que solo necesitas la clave de API. Usa la configuración explícita de `models.providers.cerebras` cuando quieras sobrescribir metadatos de modelos o ejecutar en `mode: "merge"` con el catálogo estático:

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
  Si el Gateway se ejecuta como daemon (launchd, systemd, Docker), asegúrate de que `CEREBRAS_API_KEY` esté disponible para ese proceso; por ejemplo, en `~/.openclaw/.env` o mediante `env.shellEnv`. Una clave que solo esté en `~/.profile` no ayudará a un servicio gestionado a menos que el entorno se importe por separado.
</Note>

## Relacionado

<CardGroup cols={2}>
  <Card title="Proveedores de modelos" href="/es/concepts/model-providers" icon="layers">
    Elegir proveedores, referencias de modelos y comportamiento de conmutación por error.
  </Card>
  <Card title="Modos de pensamiento" href="/es/tools/thinking" icon="brain">
    Niveles de esfuerzo de razonamiento para los dos modelos de Cerebras con capacidad de razonamiento.
  </Card>
  <Card title="Referencia de configuración" href="/es/gateway/config-agents#agent-defaults" icon="gear">
    Valores predeterminados de agentes y configuración de modelos.
  </Card>
  <Card title="Preguntas frecuentes sobre modelos" href="/es/help/faq-models" icon="circle-question">
    Perfiles de autenticación, cambio de modelos y resolución de errores de "sin perfil".
  </Card>
</CardGroup>
