---
read_when:
    - Quieres la síntesis de voz de Inworld para las respuestas salientes
    - Necesitas salida de nota de voz PCM telephony o OGG_OPUS de Inworld
summary: Texto a voz en streaming de Inworld para respuestas de OpenClaw
title: Inworld
x-i18n:
    generated_at: "2026-04-26T11:36:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4c3908b6ab11fd7bd2e18e5c56d1fdc1ac2e52448538d31cc6c83c2c97917641
    source_path: providers/inworld.md
    workflow: 15
---

Inworld es un proveedor de conversión de texto a voz (TTS) en streaming. En OpenClaw
sintetiza el audio de las respuestas salientes (MP3 de forma predeterminada, OGG_OPUS para notas de voz)
y audio PCM para canales de telefonía como Voice Call.

OpenClaw envía solicitudes al endpoint de TTS en streaming de Inworld, concatena los
fragmentos de audio codificados en base64 devueltos en un único búfer y entrega el resultado
al flujo estándar de audio de respuesta.

| Detalle       | Valor                                                       |
| ------------- | ----------------------------------------------------------- |
| Sitio web     | [inworld.ai](https://inworld.ai)                            |
| Documentación | [docs.inworld.ai/tts/tts](https://docs.inworld.ai/tts/tts)  |
| Autenticación | `INWORLD_API_KEY` (HTTP Basic, credencial del panel en Base64) |
| Voz predeterminada | `Sarah`                                                 |
| Modelo predeterminado | `inworld-tts-1.5-max`                               |

## Primeros pasos

<Steps>
  <Step title="Configura tu clave de API">
    Copia la credencial desde tu panel de Inworld (Workspace > API Keys)
    y configúrala como una variable de entorno. El valor se envía literalmente como la
    credencial HTTP Basic, así que no la vuelvas a codificar en Base64 ni la conviertas en un
    token bearer.

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
| `apiKey`      | `messages.tts.providers.inworld.apiKey`      | Credencial del panel en Base64. Usa `INWORLD_API_KEY` como alternativa. |
| `baseUrl`     | `messages.tts.providers.inworld.baseUrl`     | Sobrescribe la URL base de la API de Inworld (predeterminada: `https://api.inworld.ai`). |
| `voiceId`     | `messages.tts.providers.inworld.voiceId`     | Identificador de voz (predeterminado: `Sarah`).                   |
| `modelId`     | `messages.tts.providers.inworld.modelId`     | ID del modelo de TTS (predeterminado: `inworld-tts-1.5-max`).     |
| `temperature` | `messages.tts.providers.inworld.temperature` | Temperatura de muestreo `0..2` (opcional).                        |

## Notas

<AccordionGroup>
  <Accordion title="Autenticación">
    Inworld usa autenticación HTTP Basic con una única cadena de credencial
    codificada en Base64. Cópiala literalmente desde el panel de Inworld. El proveedor la envía
    como `Authorization: Basic <apiKey>` sin ninguna codificación adicional, así
    que no la codifiques en Base64 tú mismo y no pases un token de tipo bearer.
    Consulta [Notas de autenticación de TTS](/es/tools/tts#inworld-primary) para ver la misma aclaración.
  </Accordion>
  <Accordion title="Modelos">
    IDs de modelo compatibles: `inworld-tts-1.5-max` (predeterminado),
    `inworld-tts-1.5-mini`, `inworld-tts-1-max`, `inworld-tts-1`.
  </Accordion>
  <Accordion title="Salidas de audio">
    Las respuestas usan MP3 de forma predeterminada. Cuando el destino del canal es `voice-note`
    OpenClaw solicita `OGG_OPUS` a Inworld para que el audio se reproduzca como una
    burbuja de voz nativa. La síntesis para telefonía usa `PCM` sin procesar a 22050 Hz para alimentar
    el puente de telefonía.
  </Accordion>
  <Accordion title="Endpoints personalizados">
    Sobrescribe el host de la API con `messages.tts.providers.inworld.baseUrl`.
    Las barras diagonales finales se eliminan antes de enviar las solicitudes.
  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Texto a voz" href="/es/tools/tts" icon="waveform-lines">
    Descripción general de TTS, proveedores y configuración de `messages.tts`.
  </Card>
  <Card title="Configuración" href="/es/gateway/configuration" icon="gear">
    Referencia completa de configuración, incluida la configuración de `messages.tts`.
  </Card>
  <Card title="Proveedores" href="/es/providers" icon="grid">
    Todos los proveedores incluidos de OpenClaw.
  </Card>
  <Card title="Solución de problemas" href="/es/help/troubleshooting" icon="wrench">
    Problemas comunes y pasos de depuración.
  </Card>
</CardGroup>
