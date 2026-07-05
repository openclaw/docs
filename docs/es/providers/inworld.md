---
read_when:
    - Quieres síntesis de voz de Inworld para respuestas salientes
    - Necesitas salida de telefonía PCM o de nota de voz OGG_OPUS desde Inworld
summary: Texto a voz en streaming de Inworld para respuestas de OpenClaw
title: Inworld
x-i18n:
    generated_at: "2026-07-05T11:36:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 443797be3eec0f63c52a7b6b697abb85b15db9b878174f6f6b70ddec474e6326
    source_path: providers/inworld.md
    workflow: 16
---

Inworld es un proveedor de texto a voz (TTS) por streaming. En OpenClaw sintetiza audio de respuestas salientes (MP3 de forma predeterminada, OGG_OPUS para notas de voz) y audio PCM sin procesar para canales de telefonía como Llamada de voz.

OpenClaw publica en el endpoint de TTS por streaming de Inworld, concatena los fragmentos de audio base64 devueltos en un único búfer y entrega el resultado al flujo estándar de audio de respuesta.

| Propiedad     | Valor                                                           |
| ------------- | --------------------------------------------------------------- |
| Id. de proveedor | `inworld`                                                    |
| Plugin        | paquete externo oficial (`@openclaw/inworld-speech`)            |
| Contrato      | `speechProviders` (solo TTS)                                    |
| Variable de entorno de autenticación | `INWORLD_API_KEY` (HTTP Basic, credencial del panel en Base64) |
| URL base      | `https://api.inworld.ai`                                        |
| Voz predeterminada | `Sarah`                                                    |
| Modelo predeterminado | `inworld-tts-1.5-max`                                    |
| Salida        | MP3 (predeterminado), OGG_OPUS (notas de voz), PCM 22050 Hz (telefonía) |
| Sitio web     | [inworld.ai](https://inworld.ai)                                |
| Documentación | [docs.inworld.ai/tts/tts](https://docs.inworld.ai/tts/tts)      |

## Instalar Plugin

```bash
openclaw plugins install @openclaw/inworld-speech
openclaw gateway restart
```

## Primeros pasos

<Steps>
  <Step title="Configura tu clave de API">
    Copia la credencial desde tu panel de Inworld (Workspace > API Keys) y configúrala como una variable de entorno. El valor se envía literalmente como la credencial de HTTP Basic, así que no vuelvas a codificarlo en Base64 ni lo conviertas en un token de portador.

    ```bash
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
    Envía una respuesta a través de cualquier canal conectado. OpenClaw sintetiza el audio con Inworld y lo entrega como MP3 (u OGG_OPUS cuando el canal espera una nota de voz).
  </Step>
</Steps>

## Opciones de configuración

| Opción        | Ruta                                         | Descripción                                                         |
| ------------- | -------------------------------------------- | ------------------------------------------------------------------- |
| `apiKey`      | `messages.tts.providers.inworld.apiKey`      | Credencial del panel en Base64. Recurre a `INWORLD_API_KEY`.        |
| `baseUrl`     | `messages.tts.providers.inworld.baseUrl`     | Anula la URL base de la API de Inworld (predeterminada `https://api.inworld.ai`). |
| `voiceId`     | `messages.tts.providers.inworld.voiceId`     | Identificador de voz (predeterminado `Sarah`). Alias heredado: `speakerVoiceId`. |
| `modelId`     | `messages.tts.providers.inworld.modelId`     | Id. del modelo TTS (predeterminado `inworld-tts-1.5-max`).          |
| `temperature` | `messages.tts.providers.inworld.temperature` | Temperatura de muestreo, de `0` (exclusivo) a `2` (opcional).       |

## Notas

<AccordionGroup>
  <Accordion title="Autenticación">
    Inworld usa autenticación HTTP Basic con una única cadena de credencial codificada en Base64. Cópiala literalmente desde el panel de Inworld. El proveedor la envía como `Authorization: Basic <apiKey>` sin ninguna codificación adicional, así que no la codifiques tú mismo en Base64 y no pases un token con estilo de portador. Consulta las [notas de autenticación de TTS](/es/tools/tts#inworld-primary) para ver el mismo aviso.
  </Accordion>
  <Accordion title="Modelos">
    Ids. de modelos admitidos: `inworld-tts-1.5-max` (predeterminado), `inworld-tts-1.5-mini`, `inworld-tts-1-max`, `inworld-tts-1`.
  </Accordion>
  <Accordion title="Salidas de audio">
    Las respuestas usan MP3 de forma predeterminada. Cuando el destino del canal es `voice-note`, OpenClaw solicita a Inworld `OGG_OPUS` para que el audio se reproduzca como una burbuja de voz nativa. La síntesis de telefonía usa `PCM` sin procesar a 22050 Hz para alimentar el puente de telefonía.
  </Accordion>
  <Accordion title="Endpoints personalizados">
    Anula el host de la API con `messages.tts.providers.inworld.baseUrl`. Las barras finales se eliminan antes de enviar las solicitudes.
  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Texto a voz" href="/es/tools/tts" icon="waveform-lines">
    Vista general de TTS, proveedores y configuración de `messages.tts`.
  </Card>
  <Card title="Configuración" href="/es/gateway/configuration" icon="gear">
    Referencia de configuración completa, incluidos los ajustes de `messages.tts`.
  </Card>
  <Card title="Proveedores" href="/es/providers" icon="grid">
    Todos los proveedores de OpenClaw admitidos.
  </Card>
  <Card title="Solución de problemas" href="/es/help/troubleshooting" icon="wrench">
    Problemas comunes y pasos de depuración.
  </Card>
</CardGroup>
