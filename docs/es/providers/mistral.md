---
read_when:
    - Quieres usar modelos de Mistral en OpenClaw
    - Quieres la transcripción en tiempo real de Voxtral para llamadas de voz
    - Necesitas la incorporación de la clave de API de Mistral y las referencias de modelos
summary: Usar modelos Mistral y la transcripción de Voxtral con OpenClaw
title: Mistral
x-i18n:
    generated_at: "2026-05-06T05:46:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: fb55915526e292210df61b646e1bbcdb2da86a0e46ea4bd5afd63d244f8da71a
    source_path: providers/mistral.md
    workflow: 16
---

OpenClaw incluye un Plugin de Mistral incluido que registra cuatro contratos: completaciones de chat, comprensión de medios (transcripción por lotes de Voxtral), STT en tiempo real para Voice Call (Voxtral Realtime) e incrustaciones de memoria (`mistral-embed`).

| Propiedad       | Valor                                       |
| ---------------- | ------------------------------------------- |
| ID del proveedor | `mistral`                                   |
| Plugin           | incluido, `enabledByDefault: true`          |
| Variable de entorno de autenticación | `MISTRAL_API_KEY`        |
| Marca de incorporación | `--auth-choice mistral-api-key`        |
| Marca directa de CLI | `--mistral-api-key <key>`               |
| API              | compatible con OpenAI (`openai-completions`) |
| URL base         | `https://api.mistral.ai/v1`                 |
| Modelo predeterminado | `mistral/mistral-large-latest`         |
| Modelo de incrustaciones | `mistral-embed`                     |
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
  <Step title="Configura un modelo predeterminado">
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

OpenClaw actualmente distribuye este catálogo de Mistral incluido:

| Ref. de modelo                  | Entrada      | Contexto | Salida máxima | Notas                                                            |
| -------------------------------- | ----------- | ------- | ---------- | ---------------------------------------------------------------- |
| `mistral/mistral-large-latest`   | texto, imagen | 262,144 | 16,384     | Modelo predeterminado                                            |
| `mistral/mistral-medium-2508`    | texto, imagen | 262,144 | 8,192      | Mistral Medium 3.1                                               |
| `mistral/mistral-small-latest`   | texto, imagen | 128,000 | 16,384     | Mistral Small 4; razonamiento ajustable mediante la API `reasoning_effort` |
| `mistral/pixtral-large-latest`   | texto, imagen | 128,000 | 32,768     | Pixtral                                                          |
| `mistral/codestral-latest`       | texto        | 256,000 | 4,096      | Programación                                                     |
| `mistral/devstral-medium-latest` | texto        | 262,144 | 32,768     | Devstral 2                                                       |
| `mistral/magistral-small`        | texto        | 128,000 | 40,000     | Con razonamiento habilitado                                      |

## Transcripción de audio (Voxtral)

Usa Voxtral para la transcripción de audio por lotes a través de la canalización
de comprensión de medios.

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

## STT en streaming para Voice Call

El Plugin `mistral` incluido registra Voxtral Realtime como proveedor de STT en
streaming para Voice Call.

| Configuración | Ruta de configuración                                                | Predeterminado                         |
| ------------ | ---------------------------------------------------------------------- | --------------------------------------- |
| Clave de API | `plugins.entries.voice-call.config.streaming.providers.mistral.apiKey` | Recurre a `MISTRAL_API_KEY`             |
| Modelo       | `...mistral.model`                                                     | `voxtral-mini-transcribe-realtime-2602` |
| Codificación | `...mistral.encoding`                                                  | `pcm_mulaw`                             |
| Frecuencia de muestreo | `...mistral.sampleRate`                                      | `8000`                                  |
| Retraso objetivo | `...mistral.targetStreamingDelayMs`                                | `800`                                   |

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
OpenClaw establece de forma predeterminada el STT en tiempo real de Mistral en `pcm_mulaw` a 8 kHz para que Voice Call
pueda reenviar directamente los fotogramas multimedia de Twilio. Usa `encoding: "pcm_s16le"` y una
`sampleRate` correspondiente solo si tu flujo ascendente ya es PCM sin procesar.
</Note>

## Configuración avanzada

<AccordionGroup>
  <Accordion title="Razonamiento ajustable (mistral-small-latest)">
    `mistral/mistral-small-latest` se asigna a Mistral Small 4 y admite [razonamiento ajustable](https://docs.mistral.ai/capabilities/reasoning/adjustable) en la API Chat Completions mediante `reasoning_effort` (`none` minimiza el pensamiento adicional en la salida; `high` muestra trazas completas de pensamiento antes de la respuesta final).

    OpenClaw asigna el nivel de **pensamiento** de la sesión a la API de Mistral:

    | Nivel de pensamiento de OpenClaw                  | `reasoning_effort` de Mistral |
    | ------------------------------------------------ | -------------------------- |
    | **off** / **minimal**                            | `none`                     |
    | **low** / **medium** / **high** / **xhigh** / **adaptive** / **max** | `high`     |

    <Note>
    Otros modelos del catálogo de Mistral incluido no usan este parámetro. Sigue usando modelos `magistral-*` cuando quieras el comportamiento nativo de Mistral orientado primero al razonamiento.
    </Note>

  </Accordion>

  <Accordion title="Incrustaciones de memoria">
    Mistral puede proporcionar incrustaciones de memoria mediante `/v1/embeddings` (modelo predeterminado: `mistral-embed`).

    ```json5
    {
      memorySearch: { provider: "mistral" },
    }
    ```

  </Accordion>

  <Accordion title="Autenticación y URL base">
    - La autenticación de Mistral usa `MISTRAL_API_KEY` (encabezado Bearer).
    - La URL base del proveedor usa de forma predeterminada `https://api.mistral.ai/v1` y acepta la forma de solicitud estándar de completaciones de chat compatible con OpenAI.
    - El modelo predeterminado de incorporación es `mistral/mistral-large-latest`.
    - Sobrescribe la URL base en `models.providers.mistral.baseUrl` solo cuando Mistral publique explícitamente un endpoint regional que necesites.

  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Selección de modelos" href="/es/concepts/model-providers" icon="layers">
    Elección de proveedores, referencias de modelo y comportamiento de conmutación por error.
  </Card>
  <Card title="Comprensión de medios" href="/es/nodes/media-understanding" icon="microphone">
    Configuración de transcripción de audio y selección de proveedor.
  </Card>
</CardGroup>
