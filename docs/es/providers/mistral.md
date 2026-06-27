---
read_when:
    - Desea usar modelos de Mistral en OpenClaw
    - Quieres transcripción en tiempo real de Voxtral para llamadas de voz
    - Necesitas la incorporación de la clave de API de Mistral y referencias de modelos
summary: Usar modelos de Mistral y transcripción de Voxtral con OpenClaw
title: Mistral
x-i18n:
    generated_at: "2026-05-11T20:50:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: 94c4caa86d4a3eb873d8b6a1cc639edbad3dd7478f401e2ca53f704de095f829
    source_path: providers/mistral.md
    workflow: 16
    postprocess_version: locale-links-v1
---

OpenClaw incluye un Plugin de Mistral integrado que registra cuatro contratos: completaciones de chat, comprensión multimedia (transcripción por lotes de Voxtral), STT en tiempo real para llamada de voz (Voxtral Realtime) e incrustaciones de memoria (`mistral-embed`).

| Propiedad        | Valor                                       |
| ---------------- | ------------------------------------------- |
| Id. de proveedor | `mistral`                                   |
| Plugin           | integrado, `enabledByDefault: true`         |
| Var. env. de autenticación | `MISTRAL_API_KEY`                  |
| Marca de incorporación | `--auth-choice mistral-api-key`       |
| Marca directa de CLI | `--mistral-api-key <key>`                |
| API              | compatible con OpenAI (`openai-completions`) |
| URL base         | `https://api.mistral.ai/v1`                 |
| Modelo predeterminado | `mistral/mistral-large-latest`         |
| Modelo de incrustaciones | `mistral-embed`                    |
| Lote de Voxtral  | `voxtral-mini-latest` (transcripción de audio) |
| Voxtral en tiempo real | `voxtral-mini-transcribe-realtime-2602` |

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

[Mistral Medium 3.5](https://docs.mistral.ai/models/model-cards/mistral-medium-3-5-26-04)
es el modelo Medium combinado actual en el catálogo integrado: 128B de pesos densos,
entrada de texto e imagen, contexto de 256K, llamadas a funciones, salida estructurada, programación
y razonamiento ajustable mediante la API Chat Completions. Usa
`mistral/mistral-medium-3-5` cuando quieras el modelo unificado más nuevo de Mistral
para agentes y programación en lugar del predeterminado `mistral/mistral-large-latest`.

OpenClaw actualmente distribuye este catálogo de Mistral integrado:

| Ref. de modelo                   | Entrada     | Contexto | Salida máx. | Notas                                                            |
| -------------------------------- | ----------- | -------- | ----------- | ---------------------------------------------------------------- |
| `mistral/mistral-large-latest`   | texto, imagen | 262,144 | 16,384     | Modelo predeterminado                                            |
| `mistral/mistral-medium-2508`    | texto, imagen | 262,144 | 8,192      | Mistral Medium 3.1                                               |
| `mistral/mistral-medium-3-5`     | texto, imagen | 262,144 | 8,192      | Mistral Medium 3.5; razonamiento ajustable                       |
| `mistral/mistral-small-latest`   | texto, imagen | 128,000 | 16,384     | Mistral Small 4; razonamiento ajustable mediante la API `reasoning_effort` |
| `mistral/pixtral-large-latest`   | texto, imagen | 128,000 | 32,768     | Pixtral                                                          |
| `mistral/codestral-latest`       | texto        | 256,000 | 4,096      | Programación                                                     |
| `mistral/devstral-medium-latest` | texto        | 262,144 | 32,768     | Devstral 2                                                       |
| `mistral/magistral-small`        | texto        | 128,000 | 40,000     | Con razonamiento habilitado                                      |

Después de la incorporación, haz una prueba rápida de Medium 3.5 sin iniciar el Gateway:

```bash
openclaw infer model run --local \
  --model mistral/mistral-medium-3-5 \
  --prompt "Reply with exactly: mistral-ok" \
  --json
```

Para explorar la fila del catálogo integrado antes de cambiar la configuración:

```bash
openclaw models list --all --provider mistral --plain
```

## Transcripción de audio (Voxtral)

Usa Voxtral para la transcripción de audio por lotes mediante la canalización de comprensión
multimedia.

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

## STT en streaming para llamada de voz

El Plugin `mistral` integrado registra Voxtral Realtime como proveedor de STT en streaming
para llamada de voz.

| Ajuste       | Ruta de configuración                                                 | Predeterminado                         |
| ------------ | ---------------------------------------------------------------------- | -------------------------------------- |
| Clave de API | `plugins.entries.voice-call.config.streaming.providers.mistral.apiKey` | Recurre a `MISTRAL_API_KEY`            |
| Modelo       | `...mistral.model`                                                     | `voxtral-mini-transcribe-realtime-2602` |
| Codificación | `...mistral.encoding`                                                  | `pcm_mulaw`                            |
| Frecuencia de muestreo | `...mistral.sampleRate`                                      | `8000`                                 |
| Retardo objetivo | `...mistral.targetStreamingDelayMs`                                | `800`                                  |

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
OpenClaw define por defecto el STT en tiempo real de Mistral como `pcm_mulaw` a 8 kHz para que la llamada de voz
pueda reenviar directamente los fotogramas multimedia de Twilio. Usa `encoding: "pcm_s16le"` y una
`sampleRate` coincidente solo si tu stream ascendente ya es PCM sin procesar.
</Note>

## Configuración avanzada

<AccordionGroup>
  <Accordion title="Razonamiento ajustable">
    `mistral/mistral-small-latest` (Mistral Small 4) y `mistral/mistral-medium-3-5` admiten [razonamiento ajustable](https://docs.mistral.ai/studio-api/conversations/reasoning/adjustable) en la API Chat Completions mediante `reasoning_effort` (`none` minimiza el pensamiento extra en la salida; `high` muestra trazas completas de pensamiento antes de la respuesta final). Mistral recomienda `reasoning_effort="high"` para casos de uso de Medium 3.5 con agentes y código.

    OpenClaw asigna el nivel de **thinking** de la sesión a la API de Mistral:

    | Nivel de thinking de OpenClaw                    | `reasoning_effort` de Mistral |
    | ------------------------------------------------ | ----------------------------- |
    | **off** / **minimal**                            | `none`                        |
    | **low** / **medium** / **high** / **xhigh** / **adaptive** / **max** | `high`     |

    <Warning>
    No combines el modo de razonamiento de Medium 3.5 con `temperature: 0`. La API HTTP
    de Mistral rechaza `reasoning_effort="high"` más `temperature: 0` con una respuesta
    400. Deja la temperatura sin definir para que Mistral use su valor predeterminado, o sigue
    los [ajustes recomendados de Medium 3.5](https://huggingface.co/mistralai/Mistral-Medium-3.5-128B)
    y usa `temperature: 0.7` para razonamiento alto. Para respuestas directas deterministas,
    desactiva thinking o déjalo en minimal para que OpenClaw envíe
    `reasoning_effort: "none"` antes de bajar la temperatura.
    </Warning>

    Configuración de ejemplo limitada al modelo para el razonamiento de Medium 3.5:

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
    Otros modelos del catálogo integrado de Mistral no usan este parámetro. Sigue usando los modelos `magistral-*` cuando quieras el comportamiento nativo de Mistral centrado primero en el razonamiento.
    </Note>

  </Accordion>

  <Accordion title="Incrustaciones de memoria">
    Mistral puede servir incrustaciones de memoria mediante `/v1/embeddings` (modelo predeterminado: `mistral-embed`).

    ```json5
    {
      memorySearch: { provider: "mistral" },
    }
    ```

  </Accordion>

  <Accordion title="Autenticación y URL base">
    - La autenticación de Mistral usa `MISTRAL_API_KEY` (encabezado Bearer).
    - La URL base del proveedor usa por defecto `https://api.mistral.ai/v1` y acepta la forma de solicitud estándar de completaciones de chat compatible con OpenAI.
    - El modelo predeterminado de incorporación es `mistral/mistral-large-latest`.
    - Sobrescribe la URL base en `models.providers.mistral.baseUrl` solo cuando Mistral publique explícitamente un endpoint regional que necesites.

  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Selección de modelo" href="/es/concepts/model-providers" icon="layers">
    Elección de proveedores, referencias de modelo y comportamiento de conmutación por error.
  </Card>
  <Card title="Comprensión multimedia" href="/es/nodes/media-understanding" icon="microphone">
    Configuración de transcripción de audio y selección de proveedor.
  </Card>
</CardGroup>
