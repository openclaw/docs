---
read_when:
    - Quieres síntesis de voz de Azure para respuestas salientes
    - Necesitas salida nativa de notas de voz Ogg Opus desde Azure Speech
summary: Texto a voz de Azure AI Speech para las respuestas de OpenClaw
title: Azure Speech
x-i18n:
    generated_at: "2026-06-27T12:34:08Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c14b1f3c2fda9b2f820e537d7133b1dbf71573b7d735207c6a4ca19432a8d8c3
    source_path: providers/azure-speech.md
    workflow: 16
---

Azure Speech es un proveedor de texto a voz de Azure AI Speech. En OpenClaw,
sintetiza el audio de respuesta saliente como MP3 de forma predeterminada, Ogg/Opus nativo para notas de voz
y audio mulaw de 8 kHz para canales de telefonía como Llamada de voz.

OpenClaw usa directamente la API REST de Azure Speech con SSML y envía el
formato de salida propiedad del proveedor mediante `X-Microsoft-OutputFormat`.

| Detalle                 | Valor                                                                                                          |
| ----------------------- | -------------------------------------------------------------------------------------------------------------- |
| Sitio web               | [Azure AI Speech](https://azure.microsoft.com/products/ai-services/ai-speech)                                  |
| Documentación           | [Speech REST text-to-speech](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech) |
| Autenticación           | `AZURE_SPEECH_KEY` más `AZURE_SPEECH_REGION`                                                                   |
| Voz predeterminada      | `en-US-JennyNeural`                                                                                            |
| Salida de archivo predeterminada | `audio-24khz-48kbitrate-mono-mp3`                                                                      |
| Archivo predeterminado de nota de voz | `ogg-24khz-16bit-mono-opus`                                                                      |

## Primeros pasos

<Steps>
  <Step title="Crear un recurso de Azure Speech">
    En el portal de Azure, crea un recurso de Speech. Copia **CLAVE 1** de
    Administración de recursos > Claves y punto de conexión, y copia la ubicación del recurso,
    como `eastus`.

    ```
    AZURE_SPEECH_KEY=<speech-resource-key>
    AZURE_SPEECH_REGION=eastus
    ```

  </Step>
  <Step title="Seleccionar Azure Speech en messages.tts">
    ```json5
    {
      messages: {
        tts: {
          auto: "always",
          provider: "azure-speech",
          providers: {
            "azure-speech": {
              speakerVoice: "en-US-JennyNeural",
              lang: "en-US",
            },
          },
        },
      },
    }
    ```
  </Step>
  <Step title="Enviar un mensaje">
    Envía una respuesta a través de cualquier canal conectado. OpenClaw sintetiza el audio
    con Azure Speech y entrega MP3 para audio estándar, u Ogg/Opus cuando
    el canal espera una nota de voz.
  </Step>
</Steps>

## Opciones de configuración

| Opción                  | Ruta                                                        | Descripción                                                                                           |
| ----------------------- | ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `apiKey`                | `messages.tts.providers.azure-speech.apiKey`                | Clave del recurso de Azure Speech. Recurre a `AZURE_SPEECH_KEY`, `AZURE_SPEECH_API_KEY` o `SPEECH_KEY`. |
| `region`                | `messages.tts.providers.azure-speech.region`                | Región del recurso de Azure Speech. Recurre a `AZURE_SPEECH_REGION` o `SPEECH_REGION`.                 |
| `endpoint`              | `messages.tts.providers.azure-speech.endpoint`              | Anulación opcional del punto de conexión/URL base de Azure Speech.                                     |
| `baseUrl`               | `messages.tts.providers.azure-speech.baseUrl`               | Anulación opcional de la URL base de Azure Speech.                                                     |
| `speakerVoice`          | `messages.tts.providers.azure-speech.speakerVoice`          | ShortName de la voz de Azure (predeterminado `en-US-JennyNeural`). Alias heredado: `voice`.           |
| `lang`                  | `messages.tts.providers.azure-speech.lang`                  | Código de idioma SSML (predeterminado `en-US`).                                                        |
| `outputFormat`          | `messages.tts.providers.azure-speech.outputFormat`          | Formato de salida de archivo de audio (predeterminado `audio-24khz-48kbitrate-mono-mp3`).             |
| `voiceNoteOutputFormat` | `messages.tts.providers.azure-speech.voiceNoteOutputFormat` | Formato de salida de nota de voz (predeterminado `ogg-24khz-16bit-mono-opus`).                        |

## Notas

<AccordionGroup>
  <Accordion title="Autenticación">
    Azure Speech usa una clave de recurso de Speech, no una clave de Azure OpenAI. La clave
    se envía como `Ocp-Apim-Subscription-Key`; OpenClaw deriva
    `https://<region>.tts.speech.microsoft.com` a partir de `region`, a menos que
    proporciones `endpoint` o `baseUrl`.
  </Accordion>
  <Accordion title="Nombres de voz">
    Usa el valor `ShortName` de la voz de Azure Speech, por ejemplo
    `en-US-JennyNeural`. El proveedor incluido puede listar voces mediante el
    mismo recurso de Speech y filtra las voces marcadas como obsoletas o retiradas.
  </Accordion>
  <Accordion title="Salidas de audio">
    Azure acepta formatos de salida como `audio-24khz-48kbitrate-mono-mp3`,
    `ogg-24khz-16bit-mono-opus` y `riff-24khz-16bit-mono-pcm`. OpenClaw
    solicita Ogg/Opus para destinos `voice-note` para que los canales puedan enviar burbujas
    de voz nativas sin una conversión adicional a MP3.
  </Accordion>
  <Accordion title="Alias">
    `azure` se acepta como alias de proveedor para PRs existentes y configuración de usuario,
    pero la configuración nueva debe usar `azure-speech` para evitar confusiones con los proveedores
    de modelos de Azure OpenAI.
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
