---
read_when:
    - Quieres usar modelos de Mistral en OpenClaw
    - Quieres la transcripción en tiempo real de Voxtral para las llamadas de voz
    - Necesitas configurar una clave de API de Mistral y referencias de modelos
summary: Usa los modelos de Mistral y la transcripción de Voxtral con OpenClaw
title: Mistral
x-i18n:
    generated_at: "2026-07-11T23:27:28Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 58f27b9917d2e7144a64cad559de4fe26a5a1101703bbe21c04252717df801cd
    source_path: providers/mistral.md
    workflow: 16
---

El Plugin `mistral` incluido registra cuatro contratos: completado de chat, comprensión multimedia (transcripción por lotes con Voxtral), STT en tiempo real para llamadas de voz (Voxtral Realtime) e incrustaciones de memoria (`mistral-embed`).

| Propiedad        | Valor                                            |
| ---------------- | ------------------------------------------------ |
| Id. del proveedor | `mistral`                                       |
| Plugin           | incluido, habilitado de forma predeterminada     |
| Variable de entorno de autenticación | `MISTRAL_API_KEY`                |
| Opción de incorporación | `--auth-choice mistral-api-key`             |
| Opción directa de la CLI | `--mistral-api-key <key>`                   |
| API              | compatible con OpenAI (`openai-completions`)     |
| URL base         | `https://api.mistral.ai/v1`                      |
| Modelo predeterminado | `mistral/mistral-large-latest`               |
| Modelo de incrustaciones | `mistral-embed`                              |
| Voxtral por lotes | `voxtral-mini-latest` (transcripción de audio)  |
| Voxtral en tiempo real | `voxtral-mini-transcribe-realtime-2602`       |

## Primeros pasos

<Steps>
  <Step title="Obtén tu clave de API">
    Crea una clave de API en la [consola de Mistral](https://console.mistral.ai/).
  </Step>
  <Step title="Ejecuta la incorporación">
    ```bash
    openclaw onboard --auth-choice mistral-api-key
    ```

    O proporciona la clave directamente:

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

| Referencia del modelo             | Entrada       | Contexto | Salida máxima | Notas                                                        |
| --------------------------------- | ------------- | -------- | ------------- | ------------------------------------------------------------ |
| `mistral/mistral-large-latest`    | texto, imagen | 262,144  | 16,384        | Modelo predeterminado                                        |
| `mistral/mistral-medium-2508`     | texto, imagen | 262,144  | 8,192         | Mistral Medium 3.1                                           |
| `mistral/mistral-medium-3-5`      | texto, imagen | 262,144  | 8,192         | Mistral Medium 3.5; razonamiento ajustable                    |
| `mistral/mistral-small-latest`    | texto, imagen | 262,144  | 16,384        | Última versión de Mistral Small 4; `reasoning_effort` ajustable |
| `mistral/mistral-small-2603`      | texto, imagen | 262,144  | 16,384        | Versión fijada de Mistral Small 4; `reasoning_effort` ajustable |
| `mistral/pixtral-large-latest`    | texto, imagen | 128,000  | 32,768        | Pixtral                                                      |
| `mistral/codestral-latest`        | texto         | 256,000  | 4,096         | Programación                                                 |
| `mistral/devstral-medium-latest`  | texto         | 262,144  | 32,768        | Devstral 2                                                   |
| `mistral/magistral-small`         | texto         | 128,000  | 40,000        | Con razonamiento habilitado                                  |

Consulta la fila del catálogo incluido antes de cambiar la configuración:

```bash
openclaw models list --all --provider mistral --plain
```

Realiza una prueba rápida de un modelo sin iniciar el Gateway:

```bash
openclaw infer model run --local \
  --model mistral/mistral-medium-3-5 \
  --prompt "Reply with exactly: mistral-ok" \
  --json
```

## Transcripción de audio (Voxtral)

Usa Voxtral para la transcripción de audio por lotes mediante el proceso de comprensión multimedia:

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
La ruta de transcripción multimedia utiliza `/v1/audio/transcriptions`. El modelo de audio predeterminado para Mistral es `voxtral-mini-latest`.
</Tip>

## STT de transmisión para llamadas de voz

El Plugin `mistral` incluido registra Voxtral Realtime como proveedor de STT de transmisión para llamadas de voz.

| Ajuste             | Ruta de configuración                                                   | Valor predeterminado                     |
| ------------------ | ----------------------------------------------------------------------- | ---------------------------------------- |
| Clave de API       | `plugins.entries.voice-call.config.streaming.providers.mistral.apiKey`  | Recurre a `MISTRAL_API_KEY`              |
| Modelo             | `...mistral.model`                                                      | `voxtral-mini-transcribe-realtime-2602`  |
| Codificación       | `...mistral.encoding`                                                   | `pcm_mulaw`                              |
| Frecuencia de muestreo | `...mistral.sampleRate`                                             | `8000`                                   |
| Retardo objetivo   | `...mistral.targetStreamingDelayMs`                                     | `800`                                    |

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
OpenClaw utiliza de forma predeterminada `pcm_mulaw` a 8 kHz para el STT en tiempo real de Mistral, de modo que las llamadas de voz puedan reenviar directamente las tramas multimedia de Twilio. Usa `encoding: "pcm_s16le"` y un `sampleRate` correspondiente solo si el flujo de origen ya es PCM sin procesar.
</Note>

## Configuración avanzada

<AccordionGroup>
  <Accordion title="Razonamiento ajustable">
    `mistral/mistral-small-latest`, `mistral/mistral-small-2603` y `mistral/mistral-medium-3-5` admiten [razonamiento ajustable](https://docs.mistral.ai/studio-api/conversations/reasoning/adjustable) en la API de completado de chat mediante `reasoning_effort` (`none` minimiza el razonamiento adicional en la salida; `high` muestra las trazas completas de razonamiento antes de la respuesta final).

    OpenClaw asigna el nivel de **razonamiento** de la sesión a la API de Mistral:

    | Nivel de razonamiento de OpenClaw                                   | `reasoning_effort` de Mistral |
    | -------------------------------------------------------------------- | ----------------------------- |
    | **desactivado** / **mínimo**                                         | `none`                        |
    | **bajo** / **medio** / **alto** / **muy alto** / **adaptativo** / **máximo** | `high`               |

    <Warning>
    Evita combinar el modo de razonamiento de Medium 3.5 con `temperature: 0`; se ha informado que la API HTTP de Mistral rechaza `reasoning_effort="high"` junto con `temperature: 0` mediante una respuesta 400. Deja la temperatura sin configurar o desactiva el razonamiento o establécelo en mínimo para que OpenClaw envíe `reasoning_effort: "none"` antes de establecer una temperatura baja.
    </Warning>

    Ejemplo de configuración limitada al modelo para el razonamiento de Medium 3.5:

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
    Los demás modelos del catálogo de Mistral incluido no utilizan este parámetro. Sigue usando modelos `magistral-*` cuando quieras el comportamiento nativo de Mistral centrado en el razonamiento.
    </Note>

  </Accordion>

  <Accordion title="Incrustaciones de memoria">
    Mistral puede proporcionar incrustaciones de memoria mediante `/v1/embeddings` (modelo predeterminado: `mistral-embed`):

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
    - La autenticación de Mistral utiliza `MISTRAL_API_KEY` (encabezado Bearer).
    - La URL base del proveedor es `https://api.mistral.ai/v1` de forma predeterminada y acepta el formato estándar de solicitudes de completado de chat compatible con OpenAI.
    - El modelo predeterminado durante la incorporación es `mistral/mistral-large-latest`.
    - Sobrescribe la URL base en `models.providers.mistral.baseUrl` únicamente cuando Mistral publique explícitamente un punto de conexión regional que necesites.

  </Accordion>
</AccordionGroup>

## Contenido relacionado

<CardGroup cols={2}>
  <Card title="Selección de modelos" href="/es/concepts/model-providers" icon="layers">
    Selección de proveedores, referencias de modelos y comportamiento de conmutación por error.
  </Card>
  <Card title="Comprensión multimedia" href="/es/nodes/media-understanding" icon="microphone">
    Configuración de la transcripción de audio y selección de proveedores.
  </Card>
</CardGroup>
