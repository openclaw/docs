---
read_when:
    - Quieres usar la síntesis de voz de Inworld para las respuestas salientes
    - Necesitas salida de Inworld en telefonía PCM o nota de voz OGG_OPUS
summary: Conversión de texto a voz en streaming de Inworld para las respuestas de OpenClaw
title: Inworld
x-i18n:
    generated_at: "2026-05-06T05:46:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: caf291bab5da946262ecaf4263c188c168be08ddb43fda72f250b8f8db87b3ff
    source_path: providers/inworld.md
    workflow: 16
---

Inworld es un proveedor de texto a voz (TTS) en streaming. En OpenClaw
sintetiza audio de respuesta saliente (MP3 de forma predeterminada, OGG_OPUS para notas de voz)
y audio PCM para canales de telefonía como Voice Call.

OpenClaw publica en el endpoint de TTS en streaming de Inworld, concatena los
fragmentos de audio base64 devueltos en un único búfer y pasa el resultado al
pipeline estándar de audio de respuesta.

| Propiedad     | Valor                                                           |
| ------------- | --------------------------------------------------------------- |
| ID del proveedor | `inworld`                                                    |
| Plugin        | incluido, `enabledByDefault: true`                              |
| Contrato      | `speechProviders` (solo TTS)                                    |
| Variable de entorno de autenticación | `INWORLD_API_KEY` (HTTP Basic, credencial Base64 del panel) |
| URL base      | `https://api.inworld.ai`                                        |
| Voz predeterminada | `Sarah`                                                    |
| Modelo predeterminado | `inworld-tts-1.5-max`                                  |
| Salida        | MP3 (predeterminado), OGG_OPUS (notas de voz), PCM 22050 Hz (telefonía) |
| Sitio web     | [inworld.ai](https://inworld.ai)                                |
| Documentación | [docs.inworld.ai/tts/tts](https://docs.inworld.ai/tts/tts)      |

## Primeros pasos

<Steps>
  <Step title="Configura tu clave de API">
    Copia la credencial desde tu panel de Inworld (Workspace > API Keys)
    y configúrala como una variable de entorno. El valor se envía literalmente como la credencial
    HTTP Basic, así que no vuelvas a codificarlo en Base64 ni lo conviertas en un token
    bearer.

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
              voiceId: "Sarah",
              modelId: "inworld-tts-1.5-max",
            },
          },
        },
      },
    }
    ```
  </Step>
  <Step title="Envía un mensaje">
    Envía una respuesta a través de cualquier canal conectado. OpenClaw sintetiza el
    audio con Inworld y lo entrega como MP3 (u OGG_OPUS cuando el canal
    espera una nota de voz).
  </Step>
</Steps>

## Opciones de configuración

| Opción        | Ruta                                         | Descripción                                                       |
| ------------- | -------------------------------------------- | ----------------------------------------------------------------- |
| `apiKey`      | `messages.tts.providers.inworld.apiKey`      | Credencial Base64 del panel. Recurre a `INWORLD_API_KEY` si no está configurada. |
| `baseUrl`     | `messages.tts.providers.inworld.baseUrl`     | Sobrescribe la URL base de la API de Inworld (predeterminada `https://api.inworld.ai`). |
| `voiceId`     | `messages.tts.providers.inworld.voiceId`     | Identificador de voz (predeterminado `Sarah`).                    |
| `modelId`     | `messages.tts.providers.inworld.modelId`     | ID del modelo TTS (predeterminado `inworld-tts-1.5-max`).         |
| `temperature` | `messages.tts.providers.inworld.temperature` | Temperatura de muestreo `0..2` (opcional).                        |

## Notas

<AccordionGroup>
  <Accordion title="Autenticación">
    Inworld usa autenticación HTTP Basic con una única cadena de credencial
    codificada en Base64. Cópiala literalmente desde el panel de Inworld. El proveedor la envía
    como `Authorization: Basic <apiKey>` sin ninguna codificación adicional, así que
    no la codifiques en Base64 tú mismo y no pases un token de estilo bearer.
    Consulta [notas de autenticación de TTS](/es/tools/tts#inworld-primary) para ver el mismo aviso.
  </Accordion>
  <Accordion title="Modelos">
    IDs de modelo admitidos: `inworld-tts-1.5-max` (predeterminado),
    `inworld-tts-1.5-mini`, `inworld-tts-1-max`, `inworld-tts-1`.
  </Accordion>
  <Accordion title="Salidas de audio">
    Las respuestas usan MP3 de forma predeterminada. Cuando el destino del canal es `voice-note`,
    OpenClaw solicita a Inworld `OGG_OPUS` para que el audio se reproduzca como una
    burbuja de voz nativa. La síntesis de telefonía usa `PCM` sin procesar a 22050 Hz para alimentar
    el puente de telefonía.
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
    Todos los proveedores incluidos de OpenClaw.
  </Card>
  <Card title="Solución de problemas" href="/es/help/troubleshooting" icon="wrench">
    Problemas comunes y pasos de depuración.
  </Card>
</CardGroup>
