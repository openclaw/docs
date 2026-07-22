---
read_when:
    - Se desea usar la conversión de voz a texto de Deepgram para los archivos de audio adjuntos
    - Quieres la transcripción en streaming de Deepgram para Voice Call
    - Necesitas un ejemplo rápido de configuración de Deepgram
summary: Transcripción de Deepgram para notas de voz entrantes
title: Deepgram
x-i18n:
    generated_at: "2026-07-22T10:43:35Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: c00473762c3bede1f6de9230043827d90daefd68d05e67ed4b3e3026b9d6ba4f
    source_path: providers/deepgram.md
    workflow: 16
---

Deepgram es una API de conversión de voz a texto. OpenClaw la utiliza para la transcripción
de audio y notas de voz entrantes mediante `tools.media.audio` y para la conversión de voz a texto
en streaming de Voice Call mediante `plugins.entries.voice-call.config.streaming`.

La transcripción por lotes carga el archivo de audio completo en Deepgram e inserta
la transcripción en el pipeline de respuestas (bloque `{{Transcript}}` + `[Audio]`).
El streaming de Voice Call reenvía en directo las tramas G.711 u-law mediante el endpoint
WebSocket `listen` de Deepgram y emite transcripciones parciales y finales a medida que
Deepgram las devuelve.

| Detalle       | Valor                                                      |
| ------------- | ---------------------------------------------------------- |
| Sitio web     | [deepgram.com](https://deepgram.com)                       |
| Documentación | [developers.deepgram.com](https://developers.deepgram.com) |
| Autenticación | `DEEPGRAM_API_KEY`                                         |
| Modelo predeterminado | `nova-3`                                                   |

## Primeros pasos

<Steps>
  <Step title="Configurar la clave de API">
    ```bash
    DEEPGRAM_API_KEY=dg_...
    ```
  </Step>
  <Step title="Habilitar el proveedor de audio">
    ```json5
    {
      tools: {
        media: {
          audio: {
            enabled: true,
            models: [{ provider: "deepgram", model: "nova-3" }],
          },
        },
      },
    }
    ```
  </Step>
  <Step title="Enviar una nota de voz">
    Envíe un mensaje de audio mediante cualquier canal conectado. OpenClaw lo transcribe
    con Deepgram e inserta la transcripción en el pipeline de respuestas.
  </Step>
</Steps>

## Opciones de configuración

| Opción     | Ruta                            | Descripción                           |
| ---------- | ------------------------------- | ------------------------------------- |
| `model`    | `tools.media.models[].model`    | ID del modelo de Deepgram (valor predeterminado: `nova-3`) |
| `language` | `tools.media.models[].language` | Indicación de idioma (opcional)              |

`providerOptions.deepgram` combina parámetros de consulta adicionales directamente con la
solicitud `/listen` de Deepgram, por lo que funciona cualquier nombre de parámetro
compatible con Deepgram (por ejemplo, `detect_language`, `punctuate`, `smart_format`):

<Tabs>
  <Tab title="Con indicación de idioma">
    ```json5
    {
      tools: {
        media: {
          audio: {
            enabled: true,
            models: [{ provider: "deepgram", model: "nova-3", language: "en" }],
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="Con opciones de Deepgram">
    ```json5
    {
      tools: {
        media: {
          audio: {
            enabled: true,
            providerOptions: {
              deepgram: {
                detect_language: true,
                punctuate: true,
                smart_format: true,
              },
            },
            models: [{ provider: "deepgram", model: "nova-3" }],
          },
        },
      },
    }
    ```
  </Tab>
</Tabs>

## Conversión de voz a texto en streaming de Voice Call

El plugin `deepgram` incluido también registra un proveedor de transcripción
en tiempo real para el plugin Voice Call.

| Ajuste          | Ruta de configuración                                                    | Valor predeterminado                          |
| --------------- | ------------------------------------------------------------------------ | -------------------------------------------- |
| Clave de API    | `plugins.entries.voice-call.config.streaming.providers.deepgram.apiKey` | Recurre a `DEEPGRAM_API_KEY`                 |
| URL base        | `...deepgram.baseUrl`                                                   | `DEEPGRAM_BASE_URL` o la API pública de Deepgram |
| Modelo          | `...deepgram.model`                                                     | `nova-3`                                     |
| Idioma          | `...deepgram.language`                                                  | (sin definir)                                 |
| Codificación    | `...deepgram.encoding`                                                  | `mulaw`                                      |
| Frecuencia de muestreo | `...deepgram.sampleRate`                                                | `8000`                                       |
| Detección de fin de intervención | `...deepgram.endpointingMs`                                             | `800`                                        |
| Resultados provisionales | `...deepgram.interimResults`                                            | `true`                                       |

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          streaming: {
            enabled: true,
            provider: "deepgram",
            providers: {
              deepgram: {
                apiKey: "${DEEPGRAM_API_KEY}",
                model: "nova-3",
                endpointingMs: 800,
                language: "en-US",
              },
            },
          },
        },
      },
    },
  },
}
```

Para usar un [endpoint personalizado de Deepgram](https://developers.deepgram.com/reference/custom-endpoints),
establezca `baseUrl` en la raíz del endpoint, incluida cualquier ruta base, pero no `/listen`.
Los endpoints en tiempo real aceptan `http://`, `https://`, `ws://` y `wss://`. HTTP
se asigna a WS, HTTPS se asigna a WSS y los esquemas WebSocket explícitos permanecen sin cambios.
Las URL mal formadas y otros esquemas provocan un error durante la configuración de la sesión.

<Note>
Voice Call recibe audio telefónico como G.711 u-law a 8 kHz. El proveedor de
streaming de Deepgram utiliza de forma predeterminada `encoding: "mulaw"` y `sampleRate: 8000`, por lo que
las tramas multimedia de Twilio se pueden reenviar directamente.
</Note>

## Notas

<AccordionGroup>
  <Accordion title="Autenticación">
    La autenticación sigue el orden estándar de autenticación de proveedores. `DEEPGRAM_API_KEY` es
    la opción más sencilla.
  </Accordion>
  <Accordion title="Proxy y endpoints personalizados">
    Sobrescriba los endpoints o encabezados en la entrada `tools.media.models[]` de Deepgram cuando utilice un proxy.
  </Accordion>
  <Accordion title="Comportamiento de la salida">
    La salida sigue las mismas reglas de audio que los demás proveedores (límites de tamaño, tiempos de espera
    e inserción de transcripciones).
  </Accordion>
</AccordionGroup>

## Contenido relacionado

<CardGroup cols={2}>
  <Card title="Herramientas multimedia" href="/es/tools/media-overview" icon="photo-film">
    Descripción general del pipeline de procesamiento de audio, imágenes y vídeo.
  </Card>
  <Card title="Configuración" href="/es/gateway/configuration" icon="gear">
    Referencia de configuración completa, incluidos los ajustes de las herramientas multimedia.
  </Card>
  <Card title="Solución de problemas" href="/es/help/troubleshooting" icon="wrench">
    Problemas habituales y pasos de depuración.
  </Card>
  <Card title="Preguntas frecuentes" href="/es/help/faq" icon="circle-question">
    Preguntas frecuentes sobre la configuración de OpenClaw.
  </Card>
</CardGroup>
