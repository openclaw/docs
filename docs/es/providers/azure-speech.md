---
read_when:
    - Quieres síntesis de voz de Azure para respuestas salientes
    - Necesitas salida nativa de nota de voz Ogg Opus desde Azure Speech
summary: Texto a voz de Azure AI Speech para las respuestas de OpenClaw
title: Azure Speech
x-i18n:
    generated_at: "2026-07-05T11:35:51Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 61e700724dbb7cb8c217f91485cea0eec776698e439f6c6985dac58dc4cafc01
    source_path: providers/azure-speech.md
    workflow: 16
---

Azure Speech es un proveedor de texto a voz de Azure AI Speech incluido. OpenClaw
llama directamente a la API REST de Azure Speech con SSML, sintetizando MP3 para
respuestas estándar, Ogg/Opus nativo para notas de voz y mulaw de 8 kHz para
canales de telefonía como Voice Call. La solicitud envía el formato de salida
propiedad del proveedor mediante el encabezado `X-Microsoft-OutputFormat`.

| Detalle                 | Valor                                                                                                          |
| ----------------------- | -------------------------------------------------------------------------------------------------------------- |
| ID del proveedor        | `azure-speech` (alias: `azure`)                                                                                |
| Sitio web               | [Azure AI Speech](https://azure.microsoft.com/products/ai-services/ai-speech)                                  |
| Documentación           | [Speech REST text-to-speech](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech) |
| Autenticación           | `AZURE_SPEECH_KEY` más `AZURE_SPEECH_REGION`                                                                   |
| Voz predeterminada      | `en-US-JennyNeural`                                                                                            |
| Salida de archivo predeterminada | `audio-24khz-48kbitrate-mono-mp3`                                                                      |
| Archivo de nota de voz predeterminado | `ogg-24khz-16bit-mono-opus`                                                                       |

## Primeros pasos

<Steps>
  <Step title="Crear un recurso de Azure Speech">
    En el portal de Azure, crea un recurso de Speech. Copia **KEY 1** desde
    Resource Management > Keys and Endpoint, y copia la ubicación del recurso,
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
              voice: "en-US-JennyNeural",
              lang: "en-US",
            },
          },
        },
      },
    }
    ```
  </Step>
  <Step title="Enviar un mensaje">
    Envía una respuesta mediante cualquier canal conectado. OpenClaw sintetiza el audio
    con Azure Speech y entrega MP3 para audio estándar, u Ogg/Opus cuando
    el canal espera una nota de voz.
  </Step>
</Steps>

## Opciones de configuración

Todas las opciones están en `messages.tts.providers["azure-speech"]`.

| Opción                  | Descripción                                                                                           |
| ----------------------- | ----------------------------------------------------------------------------------------------------- |
| `apiKey`                | Clave del recurso de Azure Speech. Recurre a `AZURE_SPEECH_KEY`, `AZURE_SPEECH_API_KEY` o `SPEECH_KEY`. |
| `region`                | Región del recurso de Azure Speech. Recurre a `AZURE_SPEECH_REGION` o `SPEECH_REGION`.                |
| `endpoint`              | Anulación opcional del endpoint de Azure Speech. Recurre a `AZURE_SPEECH_ENDPOINT`.                   |
| `baseUrl`               | Anulación opcional de la URL base de Azure Speech.                                                    |
| `voice`                 | ShortName de la voz de Azure (predeterminado `en-US-JennyNeural`). Alias heredado: `voiceId`.         |
| `lang`                  | Código de idioma SSML (predeterminado `en-US`).                                                       |
| `outputFormat`          | Formato de salida del archivo de audio (predeterminado `audio-24khz-48kbitrate-mono-mp3`).            |
| `voiceNoteOutputFormat` | Formato de salida de la nota de voz (predeterminado `ogg-24khz-16bit-mono-opus`).                     |
| `timeoutMs`             | Anulación del tiempo de espera de la solicitud en milisegundos. Recurre al `messages.tts.timeoutMs` global. |

El proveedor se considera configurado cuando `apiKey` está definido junto con uno de
`region`, `endpoint` o `baseUrl`. Las variables de entorno solo se comprueban como alternativa
para las claves de configuración que no estén definidas.

## Notas

<AccordionGroup>
  <Accordion title="Autenticación">
    Azure Speech usa una clave de recurso de Speech, no una clave de Azure OpenAI. La clave
    se envía como `Ocp-Apim-Subscription-Key`; OpenClaw deriva
    `https://<region>.tts.speech.microsoft.com` a partir de `region` salvo que
    proporciones `endpoint` o `baseUrl`.
  </Accordion>
  <Accordion title="Nombres de voz">
    Usa el valor `ShortName` de la voz de Azure Speech, por ejemplo
    `en-US-JennyNeural`. El proveedor incluido puede listar voces mediante el
    mismo recurso de Speech y filtra las voces marcadas como obsoletas, retiradas
    o deshabilitadas.
  </Accordion>
  <Accordion title="Salidas de audio">
    Azure acepta formatos de salida como `audio-24khz-48kbitrate-mono-mp3`,
    `ogg-24khz-16bit-mono-opus` y `riff-24khz-16bit-mono-pcm`. OpenClaw
    solicita Ogg/Opus para destinos `voice-note` para que los canales puedan enviar burbujas de voz
    nativas sin una conversión adicional a MP3, y fuerza
    `raw-8khz-8bit-mono-mulaw` para destinos de telefonía.
  </Accordion>
  <Accordion title="Alias">
    `azure` se acepta como alias de proveedor para la configuración existente, pero la
    configuración nueva debe usar `azure-speech` para evitar confusiones con los proveedores
    de modelos de Azure OpenAI.
  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Texto a voz" href="/es/tools/tts" icon="waveform-lines">
    Descripción general de TTS, proveedores y configuración de `messages.tts`.
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
