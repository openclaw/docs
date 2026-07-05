---
read_when:
    - Quieres usar Cerebras con OpenClaw
    - Necesitas la variable de entorno de la clave de API de Cerebras o la opción de autenticación de la CLI
summary: Configuración de Cerebras (autenticación + selección de modelo)
title: Cerebras
x-i18n:
    generated_at: "2026-07-05T11:36:13Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fca8110d345c796f0481ebf1a8d85c2cc9630b8bd55db8d4bf60772151b35b37
    source_path: providers/cerebras.md
    workflow: 16
---

[Cerebras](https://www.cerebras.ai) proporciona inferencia de alta velocidad compatible con OpenAI en hardware de inferencia personalizado. El plugin incluye un catálogo estático de cuatro modelos (sin descubrimiento en vivo).

| Propiedad             | Valor                                                     |
| --------------------- | --------------------------------------------------------- |
| ID de proveedor       | `cerebras`                                                |
| Plugin                | paquete externo oficial (`@openclaw/cerebras-provider`)   |
| Variable env de auth  | `CEREBRAS_API_KEY`                                        |
| Marca de incorporación | `--auth-choice cerebras-api-key`                         |
| Marca directa de CLI  | `--cerebras-api-key <key>`                                |
| API                   | compatible con OpenAI (`openai-completions`)              |
| URL base              | `https://api.cerebras.ai/v1`                              |
| Modelo predeterminado | `cerebras/zai-glm-4.7`                                    |

## Instalar plugin

```bash
openclaw plugins install @openclaw/cerebras-provider
openclaw gateway restart
```

## Primeros pasos

<Steps>
  <Step title="Obtener una clave de API">
    Crea una clave de API en la [Cerebras Cloud Console](https://cloud.cerebras.ai).
  </Step>
  <Step title="Ejecutar la incorporación">
    <CodeGroup>

```bash Incorporación
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
  <Step title="Verificar que los modelos estén disponibles">
    ```bash
    openclaw models list --provider cerebras
    ```

    Lista los cuatro modelos estáticos. Si `CEREBRAS_API_KEY` no se resuelve, `openclaw models status --json` informa la credencial faltante en `auth.unusableProfiles`.

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

Los cuatro modelos comparten una ventana de contexto de 128k y 8192 tokens de salida máximos.

| Ref del modelo                           | Nombre               | Razonamiento | Notas                                      |
| ---------------------------------------- | -------------------- | ------------ | ------------------------------------------ |
| `cerebras/zai-glm-4.7`                   | Z.ai GLM 4.7         | sí           | Modelo predeterminado; modelo de razonamiento preliminar |
| `cerebras/gpt-oss-120b`                  | GPT OSS 120B         | sí           | Modelo de razonamiento de producción       |
| `cerebras/qwen-3-235b-a22b-instruct-2507` | Qwen 3 235B Instruct | no           | Modelo preliminar sin razonamiento         |
| `cerebras/llama3.1-8b`                   | Llama 3.1 8B         | no           | Modelo de producción centrado en velocidad |

<Warning>
Cerebras marca `zai-glm-4.7` y `qwen-3-235b-a22b-instruct-2507` como modelos preliminares, y `llama3.1-8b` junto con `qwen-3-235b-a22b-instruct-2507` están documentados para quedar obsoletos el 27 de mayo de 2026. Consulta la [página de modelos compatibles](https://inference-docs.cerebras.ai/models/overview) de Cerebras antes de depender de ellos para cargas de trabajo de producción.
</Warning>

## Configuración manual

La mayoría de las configuraciones solo necesitan la clave de API. Usa la configuración explícita `models.providers.cerebras` para sobrescribir los metadatos de modelo o ejecutar en `mode: "merge"` contra el catálogo estático:

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
Si el Gateway se ejecuta como demonio (launchd, systemd, Docker), asegúrate de que `CEREBRAS_API_KEY` esté disponible para ese proceso, por ejemplo en `~/.openclaw/.env` o mediante `env.shellEnv`. Una clave exportada solo en un shell interactivo no ayudará a un servicio administrado a menos que el entorno se importe por separado.
</Note>

## Relacionado

<CardGroup cols={2}>
  <Card title="Proveedores de modelos" href="/es/concepts/model-providers" icon="layers">
    Elección de proveedores, refs de modelos y comportamiento de conmutación por error.
  </Card>
  <Card title="Modos de pensamiento" href="/es/tools/thinking" icon="brain">
    Niveles de esfuerzo de razonamiento para los dos modelos de Cerebras con capacidad de razonamiento.
  </Card>
  <Card title="Referencia de configuración" href="/es/gateway/config-agents#agent-defaults" icon="gear">
    Valores predeterminados de agente y configuración de modelos.
  </Card>
  <Card title="Preguntas frecuentes sobre modelos" href="/es/help/faq-models" icon="circle-question">
    Perfiles de auth, cambio de modelos y resolución de errores de "no profile".
  </Card>
</CardGroup>
