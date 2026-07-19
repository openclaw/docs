---
read_when:
    - Quieres usar Cerebras con OpenClaw
    - Se necesita la variable de entorno de la clave de API de Cerebras o la opción de autenticación de la CLI
summary: Configuración de Cerebras (autenticación + selección del modelo)
title: Cerebras
x-i18n:
    generated_at: "2026-07-19T02:22:43Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 716eef83155ef80d9aa61bd55ed83e3e38ad22720ae055bce7eb9c2cbfb6cf41
    source_path: providers/cerebras.md
    workflow: 16
---

[Cerebras](https://www.cerebras.ai) proporciona inferencia de alta velocidad compatible con OpenAI en hardware de inferencia personalizado. El plugin incluye un catálogo estático de dos modelos (sin detección en tiempo real).

| Propiedad                   | Valor                                                     |
| --------------------------- | --------------------------------------------------------- |
| Id. del proveedor           | `cerebras`                                        |
| Plugin                      | paquete externo oficial (`@openclaw/cerebras-provider`)              |
| Variable de entorno de auth | `CEREBRAS_API_KEY`                                        |
| Opción de incorporación     | `--auth-choice cerebras-api-key`                                        |
| Opción directa de la CLI    | `--cerebras-api-key <key>`                                        |
| API                         | compatible con OpenAI (`openai-completions`)                |
| URL base                    | `https://api.cerebras.ai/v1`                                        |
| Modelo predeterminado       | `cerebras/zai-glm-4.7`                                        |

## Instalar el plugin

```bash
openclaw plugins install @openclaw/cerebras-provider
openclaw gateway restart
```

## Primeros pasos

<Steps>
  <Step title="Obtener una clave de API">
    Cree una clave de API en la [consola de Cerebras Cloud](https://cloud.cerebras.ai).
  </Step>
  <Step title="Ejecutar la incorporación">
    <CodeGroup>

```bash Incorporación
openclaw onboard --auth-choice cerebras-api-key
```

```bash Opción directa
openclaw onboard --non-interactive \
  --auth-choice cerebras-api-key \
  --cerebras-api-key "$CEREBRAS_API_KEY"
```

```bash Solo entorno
export CEREBRAS_API_KEY=csk-...
```

    </CodeGroup>

  </Step>
  <Step title="Verificar que los modelos estén disponibles">
    ```bash
    openclaw models list --provider cerebras
    ```

    Enumera ambos modelos estáticos. Si `CEREBRAS_API_KEY` no se resuelve, `openclaw models status --json` informa de la credencial que falta en `auth.unusableProfiles`.

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

Ambos modelos comparten una ventana de contexto de 128k y un máximo de 8,192 tokens de salida.

| Referencia del modelo     | Nombre       | Razonamiento | Notas                                            |
| ------------------------- | ------------ | ------------ | ------------------------------------------------ |
| `cerebras/zai-glm-4.7`        | Z.ai GLM 4.7 | sí           | Modelo predeterminado; modelo de razonamiento en vista previa |
| `cerebras/gpt-oss-120b`        | GPT OSS 120B | sí           | Modelo de razonamiento para producción           |

## Configuración manual

La mayoría de las configuraciones solo necesitan la clave de API. Use la configuración explícita de `models.providers.cerebras` para sobrescribir los metadatos del modelo o ejecutar en `mode: "merge"` con el catálogo estático:

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
Si el Gateway se ejecuta como demonio (launchd, systemd, Docker), asegúrese de que `CEREBRAS_API_KEY` esté disponible para ese proceso; por ejemplo, en `~/.openclaw/.env` o mediante `env.shellEnv`. Una clave exportada únicamente en un shell interactivo no servirá para un servicio administrado, a menos que el entorno se importe por separado.
</Note>

## Contenido relacionado

<CardGroup cols={2}>
  <Card title="Proveedores de modelos" href="/es/concepts/model-providers" icon="layers">
    Elección de proveedores, referencias de modelos y comportamiento de conmutación por error.
  </Card>
  <Card title="Modos de pensamiento" href="/es/tools/thinking" icon="brain">
    Niveles de esfuerzo de razonamiento para los dos modelos de Cerebras con capacidad de razonamiento.
  </Card>
  <Card title="Referencia de configuración" href="/es/gateway/config-agents#agent-defaults" icon="gear">
    Valores predeterminados de los agentes y configuración de modelos.
  </Card>
  <Card title="Preguntas frecuentes sobre modelos" href="/es/help/faq-models" icon="circle-question">
    Perfiles de auth, cambio de modelos y resolución de errores de "sin perfil".
  </Card>
</CardGroup>
