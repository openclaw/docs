---
read_when:
    - Quieres síntesis de voz de Inworld para respuestas salientes
    - Necesitas salida de telefonía PCM o nota de voz OGG_OPUS desde Inworld
summary: Texto a voz en streaming de Inworld para las respuestas de OpenClaw
title: Inworld
x-i18n:
    generated_at: "2026-06-27T12:38:09Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ea65903945586516b51b239f0671b9e59dac92f302442f3cb629f66b68338cfb
    source_path: providers/inworld.md
    workflow: 16
---

Inworld es un proveedor de texto a voz (TTS) en streaming. En OpenClaw,
sintetiza audio de respuesta saliente (MP3 de forma predeterminada, OGG_OPUS para notas de voz)
y audio PCM para canales de telefonía como Voice Call.

OpenClaw publica en el endpoint de TTS en streaming de Inworld, concatena los
fragmentos de audio en base64 devueltos en un único búfer y entrega el resultado
al flujo estándar de audio de respuesta.

| Propiedad         | Valor                                                           |
| ----------------- | --------------------------------------------------------------- |
| ID de proveedor   | `inworld`                                                       |
| Plugin            | paquete externo oficial                                         |
| Contrato          | `speechProviders` (solo TTS)                                    |
| Var. de entorno de auth | `INWORLD_API_KEY` (HTTP Basic, credencial Base64 del panel) |
| URL base          | `https://api.inworld.ai`                                        |
| Voz predeterminada | `Sarah`                                                        |
| Modelo predeterminado | `inworld-tts-1.5-max`                                      |
| Salida            | MP3 (predeterminado), OGG_OPUS (notas de voz), PCM 22050 Hz (telefonía) |
| Sitio web         | [inworld.ai](https://inworld.ai)                                |
| Docs              | [docs.inworld.ai/tts/tts](https://docs.inworld.ai/tts/tts)      |

## Instalar Plugin

Instala el Plugin oficial y luego reinicia Gateway:

```bash
openclaw plugins install @openclaw/inworld-speech
openclaw gateway restart
```

## Primeros pasos

<Steps>
  <Step title="Configura tu clave de API">
    Copia la credencial desde tu panel de Inworld (Workspace > API Keys)
    y configúrala como una variable de entorno. El valor se envía literalmente
    como la credencial HTTP Basic, así que no lo codifiques de nuevo en Base64
    ni lo conviertas en un token bearer.

    ```
    INWORLD_API_KEY=<base64-credential-from-dashboard>
    ```

  </Step>
  <Step title="Selecciona Inworld en messages.tts">
    ```json5
    {
      messages: {
        tts: {
          auto: "always",
          provider: "inworld",
          providers: {
            inworld: {
              speakerVoiceId: "Sarah",
              modelId: "inworld-tts-1.5-max",
            },
          },
        },
      },
    }
    ```
  </Step>
  <Step title="Envía un mensaje">
    Envía una respuesta a través de cualquier canal conectado. OpenClaw sintetiza
    el audio con Inworld y lo entrega como MP3 (u OGG_OPUS cuando el canal
    espera una nota de voz).
  </Step>
</Steps>

## Opciones de configuración

| Opción           | Ruta                                            | Descripción                                                       |
| ---------------- | ----------------------------------------------- | ----------------------------------------------------------------- |
| `apiKey`         | `messages.tts.providers.inworld.apiKey`         | Credencial Base64 del panel. Recurre a `INWORLD_API_KEY`.         |
| `baseUrl`        | `messages.tts.providers.inworld.baseUrl`        | Sobrescribe la URL base de la API de Inworld (predeterminado `https://api.inworld.ai`). |
| `speakerVoiceId` | `messages.tts.providers.inworld.speakerVoiceId` | Identificador de voz (predeterminado `Sarah`).                    |
| `modelId`        | `messages.tts.providers.inworld.modelId`        | ID del modelo TTS (predeterminado `inworld-tts-1.5-max`).          |
| `temperature`    | `messages.tts.providers.inworld.temperature`    | Temperatura de muestreo `0..2` (opcional).                        |

## Notas

<AccordionGroup>
  <Accordion title="Autenticación">
    Inworld usa autenticación HTTP Basic con una única cadena de credencial
    codificada en Base64. Cópiala literalmente desde el panel de Inworld. El
    proveedor la envía como `Authorization: Basic <apiKey>` sin ninguna
    codificación adicional, así que no la codifiques tú mismo en Base64 y no
    pases un token de estilo bearer. Consulta las [notas de autenticación de TTS](/es/tools/tts#inworld-primary)
    para ver la misma advertencia.
  </Accordion>
  <Accordion title="Modelos">
    IDs de modelo compatibles: `inworld-tts-1.5-max` (predeterminado),
    `inworld-tts-1.5-mini`, `inworld-tts-1-max`, `inworld-tts-1`.
  </Accordion>
  <Accordion title="Salidas de audio">
    Las respuestas usan MP3 de forma predeterminada. Cuando el destino del canal
    es `voice-note`, OpenClaw solicita a Inworld `OGG_OPUS` para que el audio se
    reproduzca como una burbuja de voz nativa. La síntesis de telefonía usa
    `PCM` sin procesar a 22050 Hz para alimentar el puente de telefonía.
  </Accordion>
  <Accordion title="Endpoints personalizados">
    Sobrescribe el host de la API con `messages.tts.providers.inworld.baseUrl`.
    Las barras finales se eliminan antes de enviar las solicitudes.
  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Texto a voz" href="/es/tools/tts" icon="waveform-lines">
    Resumen de TTS, proveedores y configuración de `messages.tts`.
  </Card>
  <Card title="Configuración" href="/es/gateway/configuration" icon="gear">
    Referencia completa de configuración, incluidos los ajustes de `messages.tts`.
  </Card>
  <Card title="Proveedores" href="/es/providers" icon="grid">
    Todos los proveedores compatibles con OpenClaw.
  </Card>
  <Card title="Solución de problemas" href="/es/help/troubleshooting" icon="wrench">
    Problemas comunes y pasos de depuración.
  </Card>
</CardGroup>
