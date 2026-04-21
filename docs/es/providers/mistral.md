---
read_when:
    - Quieres usar modelos de Mistral en OpenClaw
    - Necesitas el onboarding de la clave de API de Mistral y referencias de modelos
summary: Usa modelos de Mistral y transcripción Voxtral con OpenClaw
title: Mistral
x-i18n:
    generated_at: "2026-04-21T13:37:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: e87d04e3d45c04280c90821b1addd87dd612191249836747fba27cde48b9890f
    source_path: providers/mistral.md
    workflow: 15
---

# Mistral

OpenClaw es compatible con Mistral tanto para el enrutamiento de modelos de texto/imagen (`mistral/...`) como para la transcripción de audio mediante Voxtral en la comprensión de contenido multimedia.
Mistral también puede usarse para embeddings de memoria (`memorySearch.provider = "mistral"`).

- Proveedor: `mistral`
- Autenticación: `MISTRAL_API_KEY`
- API: Mistral Chat Completions (`https://api.mistral.ai/v1`)

## Primeros pasos

<Steps>
  <Step title="Obtén tu clave de API">
    Crea una clave de API en la [Consola de Mistral](https://console.mistral.ai/).
  </Step>
  <Step title="Ejecuta el onboarding">
    ```bash
    openclaw onboard --auth-choice mistral-api-key
    ```

    O pasa la clave directamente:

    ```bash
    openclaw onboard --mistral-api-key "$MISTRAL_API_KEY"
    ```

  </Step>
  <Step title="Establece un modelo predeterminado">
    ```json5
    {
      env: { MISTRAL_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "mistral/mistral-large-latest" } } },
    }
    ```
  </Step>
  <Step title="Verifica que el modelo esté disponible">
    ```bash
    openclaw models list --provider mistral
    ```
  </Step>
</Steps>

## Catálogo de LLM integrado

Actualmente, OpenClaw incluye este catálogo integrado de Mistral:

| Referencia de modelo             | Entrada     | Contexto | Salida máx. | Notas                                                            |
| -------------------------------- | ----------- | -------- | ----------- | ---------------------------------------------------------------- |
| `mistral/mistral-large-latest`   | texto, imagen | 262,144 | 16,384      | Modelo predeterminado                                            |
| `mistral/mistral-medium-2508`    | texto, imagen | 262,144 | 8,192       | Mistral Medium 3.1                                               |
| `mistral/mistral-small-latest`   | texto, imagen | 128,000 | 16,384      | Mistral Small 4; razonamiento ajustable mediante la API `reasoning_effort` |
| `mistral/pixtral-large-latest`   | texto, imagen | 128,000 | 32,768      | Pixtral                                                          |
| `mistral/codestral-latest`       | texto       | 256,000 | 4,096       | Programación                                                     |
| `mistral/devstral-medium-latest` | texto       | 262,144 | 32,768      | Devstral 2                                                       |
| `mistral/magistral-small`        | texto       | 128,000 | 40,000      | Con razonamiento habilitado                                      |

## Transcripción de audio (Voxtral)

Usa Voxtral para la transcripción de audio a través del flujo de comprensión de contenido multimedia.

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [{ provider: "mistral", model: "voxtral-mini-latest" }],
      },
    },
  },
}
```

<Tip>
La ruta de transcripción multimedia usa `/v1/audio/transcriptions`. El modelo de audio predeterminado para Mistral es `voxtral-mini-latest`.
</Tip>

## Configuración avanzada

<AccordionGroup>
  <Accordion title="Razonamiento ajustable (mistral-small-latest)">
    `mistral/mistral-small-latest` corresponde a Mistral Small 4 y es compatible con el [razonamiento ajustable](https://docs.mistral.ai/capabilities/reasoning/adjustable) en la API Chat Completions mediante `reasoning_effort` (`none` minimiza el razonamiento adicional en la salida; `high` muestra trazas completas de razonamiento antes de la respuesta final).

    OpenClaw asigna el nivel de **thinking** de la sesión a la API de Mistral:

    | Nivel de thinking de OpenClaw                  | Mistral `reasoning_effort` |
    | ---------------------------------------------- | -------------------------- |
    | **off** / **minimal**                          | `none`                     |
    | **low** / **medium** / **high** / **xhigh** / **adaptive** / **max** | `high`     |

    <Note>
    Los demás modelos del catálogo integrado de Mistral no usan este parámetro. Sigue usando los modelos `magistral-*` cuando quieras el comportamiento nativo de Mistral orientado primero al razonamiento.
    </Note>

  </Accordion>

  <Accordion title="Embeddings de memoria">
    Mistral puede servir embeddings de memoria mediante `/v1/embeddings` (modelo predeterminado: `mistral-embed`).

    ```json5
    {
      memorySearch: { provider: "mistral" },
    }
    ```

  </Accordion>

  <Accordion title="Autenticación y URL base">
    - La autenticación de Mistral usa `MISTRAL_API_KEY`.
    - La URL base del proveedor usa de forma predeterminada `https://api.mistral.ai/v1`.
    - El modelo predeterminado del onboarding es `mistral/mistral-large-latest`.
    - Z.AI usa autenticación Bearer con tu clave de API.
  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Selección de modelo" href="/es/concepts/model-providers" icon="layers">
    Elegir proveedores, referencias de modelos y comportamiento de conmutación por error.
  </Card>
  <Card title="Comprensión de contenido multimedia" href="/tools/media-understanding" icon="microphone">
    Configuración de la transcripción de audio y selección del proveedor.
  </Card>
</CardGroup>
