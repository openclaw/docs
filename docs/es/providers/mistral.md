---
read_when:
    - Quieres usar modelos Mistral en OpenClaw
    - Quieres transcripción en tiempo real de Voxtral para Voice Call
    - Necesitas incorporación con clave de API de Mistral y referencias de modelo
summary: Usar modelos Mistral y transcripción Voxtral con OpenClaw
title: Mistral
x-i18n:
    generated_at: "2026-04-24T05:45:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: 63e1eb462f836f5ddc1afd0d01954080eee461230924368d77e2e57fef12caf1
    source_path: providers/mistral.md
    workflow: 15
---

OpenClaw es compatible con Mistral tanto para el enrutamiento de modelos de texto/imagen (`mistral/...`) como para
la transcripción de audio mediante Voxtral en la comprensión de archivos multimedia.
Mistral también puede usarse para embeddings de memoria (`memorySearch.provider = "mistral"`).

- Proveedor: `mistral`
- Autenticación: `MISTRAL_API_KEY`
- API: Mistral Chat Completions (`https://api.mistral.ai/v1`)

## Primeros pasos

<Steps>
  <Step title="Obtén tu clave de API">
    Crea una clave de API en la [Consola de Mistral](https://console.mistral.ai/).
  </Step>
  <Step title="Ejecuta la incorporación">
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

## Catálogo LLM integrado

Actualmente OpenClaw incluye este catálogo integrado de Mistral:

| Referencia de modelo             | Entrada     | Contexto | Salida máxima | Notas                                                            |
| -------------------------------- | ----------- | -------- | ------------- | ---------------------------------------------------------------- |
| `mistral/mistral-large-latest`   | text, image | 262,144  | 16,384        | Modelo predeterminado                                            |
| `mistral/mistral-medium-2508`    | text, image | 262,144  | 8,192         | Mistral Medium 3.1                                               |
| `mistral/mistral-small-latest`   | text, image | 128,000  | 16,384        | Mistral Small 4; razonamiento ajustable mediante la API `reasoning_effort` |
| `mistral/pixtral-large-latest`   | text, image | 128,000  | 32,768        | Pixtral                                                          |
| `mistral/codestral-latest`       | text        | 256,000  | 4,096         | Programación                                                     |
| `mistral/devstral-medium-latest` | text        | 262,144  | 32,768        | Devstral 2                                                       |
| `mistral/magistral-small`        | text        | 128,000  | 40,000        | Con razonamiento habilitado                                      |

## Transcripción de audio (Voxtral)

Usa Voxtral para la transcripción de audio por lotes mediante la canalización de
comprensión de archivos multimedia.

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
La ruta de transcripción de archivos multimedia usa `/v1/audio/transcriptions`. El modelo de audio predeterminado para Mistral es `voxtral-mini-latest`.
</Tip>

## Streaming STT de Voice Call

El Plugin integrado `mistral` registra Voxtral Realtime como proveedor de
STT en streaming de Voice Call.

| Configuración | Ruta de config                                                        | Predeterminado                           |
| ------------- | --------------------------------------------------------------------- | ---------------------------------------- |
| Clave de API  | `plugins.entries.voice-call.config.streaming.providers.mistral.apiKey` | Recurre a `MISTRAL_API_KEY`              |
| Modelo        | `...mistral.model`                                                    | `voxtral-mini-transcribe-realtime-2602`  |
| Codificación  | `...mistral.encoding`                                                 | `pcm_mulaw`                              |
| Tasa de muestreo | `...mistral.sampleRate`                                            | `8000`                                   |
| Retardo objetivo | `...mistral.targetStreamingDelayMs`                                | `800`                                    |

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          streaming: {
            enabled: true,
            provider: "mistral",
            providers: {
              mistral: {
                apiKey: "${MISTRAL_API_KEY}",
                targetStreamingDelayMs: 800,
              },
            },
          },
        },
      },
    },
  },
}
```

<Note>
OpenClaw usa de forma predeterminada el STT en tiempo real de Mistral con `pcm_mulaw` a 8 kHz para que Voice Call
pueda reenviar directamente los marcos multimedia de Twilio. Usa `encoding: "pcm_s16le"` y una
`sampleRate` correspondiente solo si tu flujo ascendente ya es PCM sin procesar.
</Note>

## Configuración avanzada

<AccordionGroup>
  <Accordion title="Razonamiento ajustable (mistral-small-latest)">
    `mistral/mistral-small-latest` se corresponde con Mistral Small 4 y admite [razonamiento ajustable](https://docs.mistral.ai/capabilities/reasoning/adjustable) en la API de Chat Completions mediante `reasoning_effort` (`none` minimiza el razonamiento adicional en la salida; `high` muestra trazas completas de razonamiento antes de la respuesta final).

    OpenClaw asigna el nivel de **thinking** de la sesión a la API de Mistral:

    | Nivel de thinking de OpenClaw                 | `reasoning_effort` de Mistral |
    | --------------------------------------------- | ----------------------------- |
    | **off** / **minimal**                         | `none`                        |
    | **low** / **medium** / **high** / **xhigh** / **adaptive** / **max** | `high`     |

    <Note>
    Los demás modelos del catálogo integrado de Mistral no usan este parámetro. Sigue usando modelos `magistral-*` cuando quieras el comportamiento nativo de Mistral orientado primero al razonamiento.
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
    - La URL base del proveedor es, de forma predeterminada, `https://api.mistral.ai/v1`.
    - El modelo predeterminado de incorporación es `mistral/mistral-large-latest`.
    - Z.AI usa autenticación Bearer con tu clave de API.
  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Selección de modelos" href="/es/concepts/model-providers" icon="layers">
    Elegir proveedores, referencias de modelos y comportamiento de alternativas.
  </Card>
  <Card title="Comprensión de archivos multimedia" href="/es/nodes/media-understanding" icon="microphone">
    Configuración de transcripción de audio y selección de proveedor.
  </Card>
</CardGroup>
