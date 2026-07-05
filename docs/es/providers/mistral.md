---
read_when:
    - Quieres usar modelos de Mistral en OpenClaw
    - Quieres transcripción en tiempo real de Voxtral para Voice Call
    - Necesitas incorporación de clave de API de Mistral y referencias de modelo
summary: Usa modelos Mistral y transcripción Voxtral con OpenClaw
title: Mistral
x-i18n:
    generated_at: "2026-07-05T11:37:51Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 20c970c8bcff4a0da0dd6a27d5957c384d0a34363c40871d3e56b567e7d6213a
    source_path: providers/mistral.md
    workflow: 16
---

El Plugin incluido `mistral` registra cuatro contratos: finalizaciones de chat, comprensión de medios (transcripción por lotes de Voxtral), STT en tiempo real para Voice Call (Voxtral Realtime) e incrustaciones de memoria (`mistral-embed`).

| Propiedad        | Valor                                       |
| ---------------- | ------------------------------------------- |
| ID del proveedor | `mistral`                                   |
| Plugin           | incluido, habilitado de forma predeterminada |
| Variable de entorno de autenticación | `MISTRAL_API_KEY`        |
| Marca de incorporación | `--auth-choice mistral-api-key`        |
| Marca directa de CLI | `--mistral-api-key <key>`                |
| API              | compatible con OpenAI (`openai-completions`) |
| URL base         | `https://api.mistral.ai/v1`                 |
| Modelo predeterminado | `mistral/mistral-large-latest`          |
| Modelo de incrustaciones | `mistral-embed`                       |
| Lote de Voxtral  | `voxtral-mini-latest` (transcripción de audio) |
| Voxtral en tiempo real | `voxtral-mini-transcribe-realtime-2602` |

## Primeros pasos

<Steps>
  <Step title="Obtén tu clave de API">
    Crea una clave de API en la [consola de Mistral](https://console.mistral.ai/).
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
  <Step title="Define un modelo predeterminado">
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

| Referencia de modelo             | Entrada     | Contexto | Salida máxima | Notas                                                            |
| -------------------------------- | ----------- | -------- | ------------- | ---------------------------------------------------------------- |
| `mistral/mistral-large-latest`   | texto, imagen | 262,144 | 16,384        | Modelo predeterminado                                            |
| `mistral/mistral-medium-2508`    | texto, imagen | 262,144 | 8,192         | Mistral Medium 3.1                                               |
| `mistral/mistral-medium-3-5`     | texto, imagen | 262,144 | 8,192         | Mistral Medium 3.5; razonamiento ajustable                       |
| `mistral/mistral-small-latest`   | texto, imagen | 128,000 | 16,384        | Mistral Small 4; razonamiento ajustable mediante la API `reasoning_effort` |
| `mistral/pixtral-large-latest`   | texto, imagen | 128,000 | 32,768        | Pixtral                                                          |
| `mistral/codestral-latest`       | texto        | 256,000 | 4,096         | Programación                                                     |
| `mistral/devstral-medium-latest` | texto        | 262,144 | 32,768        | Devstral 2                                                       |
| `mistral/magistral-small`        | texto        | 128,000 | 40,000        | Con razonamiento habilitado                                      |

Explora la fila del catálogo incluido antes de cambiar la configuración:

```bash
openclaw models list --all --provider mistral --plain
```

Haz una prueba rápida de un modelo sin iniciar el Gateway:

```bash
openclaw infer model run --local \
  --model mistral/mistral-medium-3-5 \
  --prompt "Reply with exactly: mistral-ok" \
  --json
```

## Transcripción de audio (Voxtral)

Usa Voxtral para la transcripción de audio por lotes mediante la canalización de comprensión de medios:

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
La ruta de transcripción de medios usa `/v1/audio/transcriptions`. El modelo de audio predeterminado para Mistral es `voxtral-mini-latest`.
</Tip>

## STT de streaming para Voice Call

El Plugin incluido `mistral` registra Voxtral Realtime como proveedor de STT de streaming para Voice Call.

| Configuración | Ruta de configuración                                                | Predeterminado                         |
| ------------- | -------------------------------------------------------------------- | -------------------------------------- |
| Clave de API  | `plugins.entries.voice-call.config.streaming.providers.mistral.apiKey` | Recurre a `MISTRAL_API_KEY`            |
| Modelo        | `...mistral.model`                                                   | `voxtral-mini-transcribe-realtime-2602` |
| Codificación  | `...mistral.encoding`                                                | `pcm_mulaw`                            |
| Frecuencia de muestreo | `...mistral.sampleRate`                                      | `8000`                                 |
| Retraso objetivo | `...mistral.targetStreamingDelayMs`                                | `800`                                  |

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
OpenClaw establece de forma predeterminada STT en tiempo real de Mistral en `pcm_mulaw` a 8 kHz para que Voice Call pueda reenviar directamente tramas multimedia de Twilio. Usa `encoding: "pcm_s16le"` y un `sampleRate` coincidente solo si tu flujo ascendente ya es PCM sin procesar.
</Note>

## Configuración avanzada

<AccordionGroup>
  <Accordion title="Razonamiento ajustable">
    `mistral/mistral-small-latest` y `mistral/mistral-medium-3-5` admiten [razonamiento ajustable](https://docs.mistral.ai/studio-api/conversations/reasoning/adjustable) en la API Chat Completions mediante `reasoning_effort` (`none` minimiza el pensamiento adicional en la salida; `high` muestra trazas completas de pensamiento antes de la respuesta final).

    OpenClaw asigna el nivel de **pensamiento** de la sesión a la API de Mistral:

    | Nivel de pensamiento de OpenClaw                                     | `reasoning_effort` de Mistral |
    | -------------------------------------------------------------------- | ----------------------------- |
    | **desactivado** / **mínimo**                                         | `none`                        |
    | **bajo** / **medio** / **alto** / **xhigh** / **adaptive** / **max** | `high`                        |

    <Warning>
    Evita combinar el modo de razonamiento Medium 3.5 con `temperature: 0`; se ha informado que la API HTTP de Mistral rechaza `reasoning_effort="high"` más `temperature: 0` con una respuesta 400. Deja la temperatura sin definir, o desactiva/reduce al mínimo el pensamiento para que OpenClaw envíe `reasoning_effort: "none"` antes de establecer una temperatura baja.
    </Warning>

    Ejemplo de configuración con alcance de modelo para el razonamiento de Medium 3.5:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "mistral/mistral-medium-3-5" },
          models: {
            "mistral/mistral-medium-3-5": {
              params: { thinking: "high" },
            },
          },
        },
      },
    }
    ```

    <Note>
    Otros modelos incluidos en el catálogo de Mistral no usan este parámetro. Sigue usando los modelos `magistral-*` cuando quieras el comportamiento nativo de Mistral centrado primero en el razonamiento.
    </Note>

  </Accordion>

  <Accordion title="Incrustaciones de memoria">
    Mistral puede servir incrustaciones de memoria mediante `/v1/embeddings` (modelo predeterminado: `mistral-embed`):

    ```json5
    {
      agents: {
        defaults: {
          memorySearch: { provider: "mistral" },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Autenticación y URL base">
    - La autenticación de Mistral usa `MISTRAL_API_KEY` (encabezado Bearer).
    - La URL base del proveedor usa de forma predeterminada `https://api.mistral.ai/v1` y acepta la forma estándar de solicitud de finalizaciones de chat compatible con OpenAI.
    - El modelo predeterminado de incorporación es `mistral/mistral-large-latest`.
    - Sobrescribe la URL base en `models.providers.mistral.baseUrl` solo cuando Mistral publique explícitamente un endpoint regional que necesites.

  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Selección de modelos" href="/es/concepts/model-providers" icon="layers">
    Elegir proveedores, referencias de modelo y comportamiento de conmutación por error.
  </Card>
  <Card title="Comprensión de medios" href="/es/nodes/media-understanding" icon="microphone">
    Configuración de transcripción de audio y selección de proveedor.
  </Card>
</CardGroup>
