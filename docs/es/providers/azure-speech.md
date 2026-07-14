---
read_when:
    - Se quiere usar la síntesis de voz de Azure para las respuestas salientes
    - Se necesita una salida nativa de notas de voz Ogg Opus de Azure Speech
summary: Conversión de texto a voz de Azure AI Speech para las respuestas de OpenClaw
title: Voz de Azure
x-i18n:
    generated_at: "2026-07-14T14:03:47Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: f5eab231afee8f606c5257465f958d42838efab7fde1642578cad987c564c700
    source_path: providers/azure-speech.md
    workflow: 16
---

Azure Speech es un proveedor integrado de conversión de texto a voz de Azure AI Speech. OpenClaw
llama directamente a la API REST de Azure Speech mediante SSML y sintetiza MP3 para
respuestas estándar, Ogg/Opus nativo para notas de voz y mulaw de 8 kHz para
canales de telefonía como Voice Call. La solicitud envía el formato de salida
propiedad del proveedor mediante el encabezado `X-Microsoft-OutputFormat`.

| Detalle                 | Valor                                                                                                          |
| ----------------------- | -------------------------------------------------------------------------------------------------------------- |
| ID del proveedor        | `azure-speech` (alias: `azure`)                                                                                |
| Sitio web               | [Azure AI Speech](https://azure.microsoft.com/products/ai-services/ai-speech)                                  |
| Documentación           | [Conversión de texto a voz mediante la API REST de Speech](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech) |
| Autenticación           | `AZURE_SPEECH_KEY` más `AZURE_SPEECH_REGION`                                                                  |
| Voz predeterminada      | `en-US-JennyNeural`                                                                                            |
| Salida de archivo predeterminada | `audio-24khz-48kbitrate-mono-mp3`                                                                              |
| Archivo de nota de voz predeterminado | `ogg-24khz-16bit-mono-opus`                                                                                    |

## Primeros pasos

<Steps>
  <Step title="Crear un recurso de Azure Speech">
    En el portal de Azure, cree un recurso de Speech. Copie **KEY 1** de
    Resource Management > Keys and Endpoint y copie la ubicación del recurso,
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
    Envíe una respuesta mediante cualquier canal conectado. OpenClaw sintetiza el audio
    con Azure Speech y entrega MP3 para audio estándar u Ogg/Opus cuando
    el canal espera una nota de voz.
  </Step>
</Steps>

## Opciones de configuración

Todas las opciones se encuentran en `messages.tts.providers["azure-speech"]`.

| Opción                  | Descripción                                                                                           |
| ----------------------- | ----------------------------------------------------------------------------------------------------- |
| `apiKey`                | Clave del recurso de Azure Speech. Utiliza como alternativa `AZURE_SPEECH_KEY`, `AZURE_SPEECH_API_KEY` o `SPEECH_KEY`. |
| `region`                | Región del recurso de Azure Speech. Utiliza como alternativa `AZURE_SPEECH_REGION` o `SPEECH_REGION`.                 |
| `endpoint`              | Sustitución opcional del endpoint de Azure Speech. Utiliza como alternativa el valor de confianza `AZURE_SPEECH_ENDPOINT`.               |
| `baseUrl`               | Sustitución opcional de la URL base de Azure Speech.                                                              |
| `voice`                 | ShortName de la voz de Azure (valor predeterminado: `en-US-JennyNeural`). Alias heredado: `voiceId`.                         |
| `lang`                  | Código de idioma de SSML (valor predeterminado: `en-US`).                                                                 |
| `outputFormat`          | Formato de salida del archivo de audio (valor predeterminado: `audio-24khz-48kbitrate-mono-mp3`).                                 |
| `voiceNoteOutputFormat` | Formato de salida de la nota de voz (valor predeterminado: `ogg-24khz-16bit-mono-opus`).                                       |
| `timeoutMs`             | Sustitución del tiempo de espera de la solicitud en milisegundos. Utiliza como alternativa el valor global `messages.tts.timeoutMs`.          |

El proveedor se considera configurado cuando se establece `apiKey` junto con uno de
`region`, `endpoint` o `baseUrl`. Las variables de entorno solo se comprueban como alternativa
para las claves de configuración que no se hayan establecido. Los archivos `.env` del espacio de trabajo no pueden establecer
`AZURE_SPEECH_ENDPOINT`; utilice el entorno del proceso, el archivo dotenv global del entorno de ejecución
o una configuración explícita para el enrutamiento del endpoint.

## Notas

<AccordionGroup>
  <Accordion title="Autenticación">
    Azure Speech utiliza una clave de recurso de Speech, no una clave de Azure OpenAI. La clave
    se envía como `Ocp-Apim-Subscription-Key`; OpenClaw deriva
    `https://<region>.tts.speech.microsoft.com` de `region`, a menos que se
    proporcione `endpoint` o `baseUrl`.
  </Accordion>
  <Accordion title="Nombres de voz">
    Utilice el valor `ShortName` de la voz de Azure Speech, por ejemplo,
    `en-US-JennyNeural`. El proveedor integrado puede enumerar las voces mediante el
    mismo recurso de Speech y excluye las voces marcadas como obsoletas, retiradas
    o deshabilitadas.
  </Accordion>
  <Accordion title="Salidas de audio">
    Azure acepta formatos de salida como `audio-24khz-48kbitrate-mono-mp3`,
    `ogg-24khz-16bit-mono-opus` y `riff-24khz-16bit-mono-pcm`. OpenClaw
    solicita Ogg/Opus para destinos `voice-note`, de modo que los canales puedan enviar
    mensajes de voz nativos sin una conversión adicional a MP3, y fuerza
    `raw-8khz-8bit-mono-mulaw` para destinos de telefonía.
  </Accordion>
  <Accordion title="Alias">
    `azure` se acepta como alias del proveedor para configuraciones existentes, pero las
    configuraciones nuevas deben utilizar `azure-speech` para evitar confusiones con los proveedores
    de modelos de Azure OpenAI.
  </Accordion>
</AccordionGroup>

## Contenido relacionado

<CardGroup cols={2}>
  <Card title="Conversión de texto a voz" href="/es/tools/tts" icon="waveform-lines">
    Descripción general de TTS, proveedores y configuración de `messages.tts`.
  </Card>
  <Card title="Configuración" href="/es/gateway/configuration" icon="gear">
    Referencia completa de configuración, incluidos los ajustes de `messages.tts`.
  </Card>
  <Card title="Proveedores" href="/es/providers" icon="grid">
    Todos los proveedores integrados de OpenClaw.
  </Card>
  <Card title="Solución de problemas" href="/es/help/troubleshooting" icon="wrench">
    Problemas comunes y pasos de depuración.
  </Card>
</CardGroup>
