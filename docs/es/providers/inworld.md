---
read_when:
    - Se desea usar la síntesis de voz de Inworld para las respuestas salientes
    - Necesita salida de telefonía PCM o de notas de voz OGG_OPUS de Inworld
summary: Texto a voz en streaming de Inworld para las respuestas de OpenClaw
title: Inworld
x-i18n:
    generated_at: "2026-07-22T10:46:29Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 09560f5beda3b40d9c67f9408d34446f28ecddb8235fc0725c4265c813302946
    source_path: providers/inworld.md
    workflow: 16
---

Inworld es un proveedor de texto a voz (TTS) en streaming. En OpenClaw, sintetiza el audio de las respuestas salientes (MP3 de forma predeterminada, OGG_OPUS para notas de voz) y audio PCM sin procesar para canales de telefonía como Voice Call.

OpenClaw envía solicitudes al endpoint de TTS en streaming de Inworld, concatena los fragmentos de audio en base64 devueltos en un único búfer y pasa el resultado al pipeline estándar de audio de respuesta.

| Propiedad     | Valor                                                           |
| ------------- | --------------------------------------------------------------- |
| Id. del proveedor | `inworld`                                                       |
| Plugin        | paquete externo oficial (`@openclaw/inworld-speech`)          |
| Contrato      | `speechProviders` (solo TTS)                                    |
| Variable de entorno de autenticación | `INWORLD_API_KEY` (HTTP Basic, credencial Base64 del panel)     |
| URL base      | `https://api.inworld.ai`                                        |
| Voz predeterminada | `Sarah`                                                         |
| Modelo predeterminado | `inworld-tts-1.5-max`                                           |
| Salida        | MP3 (predeterminada), OGG_OPUS (notas de voz), PCM 22050 Hz (telefonía) |
| Sitio web     | [inworld.ai](https://inworld.ai)                                |
| Documentación | [docs.inworld.ai/tts/tts](https://docs.inworld.ai/tts/tts)      |

## Instalar el plugin

```bash
openclaw plugins install @openclaw/inworld-speech
openclaw gateway restart
```

## Primeros pasos

<Steps>
  <Step title="Establecer la clave de API">
    Copie la credencial del panel de Inworld (Workspace > API Keys) y establézcala como variable de entorno. El valor se envía literalmente como credencial HTTP Basic, por lo que no debe volver a codificarlo en Base64 ni convertirlo en un token de portador.

    ```bash
    INWORLD_API_KEY=<base64-credential-from-dashboard>
    ```

  </Step>
  <Step title="Seleccionar Inworld en tts">
    ```json5
    {
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
    }
    ```
  </Step>
  <Step title="Enviar un mensaje">
    Envíe una respuesta a través de cualquier canal conectado. OpenClaw sintetiza el audio con Inworld y lo entrega como MP3 (o como OGG_OPUS cuando el canal espera una nota de voz).
  </Step>
</Steps>

## Opciones de configuración

| Opción        | Ruta                                | Descripción                                                         |
| ------------- | ----------------------------------- | ------------------------------------------------------------------- |
| `apiKey`      | `tts.providers.inworld.apiKey`      | Credencial Base64 del panel. Recurre a `INWORLD_API_KEY` si no está disponible.       |
| `baseUrl`     | `tts.providers.inworld.baseUrl`     | Sobrescribe la URL base de la API de Inworld (valor predeterminado: `https://api.inworld.ai`).   |
| `voiceId`     | `tts.providers.inworld.voiceId`     | Identificador de voz (valor predeterminado: `Sarah`). Alias heredado: `speakerVoiceId`. |
| `modelId`     | `tts.providers.inworld.modelId`     | Id. del modelo de TTS (valor predeterminado: `inworld-tts-1.5-max`).                       |
| `temperature` | `tts.providers.inworld.temperature` | Temperatura de muestreo, de `0` (exclusivo) a `2` (opcional).            |

## Notas

<AccordionGroup>
  <Accordion title="Autenticación">
    Inworld utiliza autenticación HTTP Basic con una única cadena de credencial codificada en Base64. Cópiela literalmente del panel de Inworld. El proveedor la envía como `Authorization: Basic <apiKey>` sin ninguna codificación adicional, por lo que no debe codificarla en Base64 por su cuenta ni proporcionar un token de tipo portador. Consulte las [notas de autenticación de TTS](/es/tools/tts#inworld-primary) para ver la misma advertencia.
  </Accordion>
  <Accordion title="Modelos">
    Id. de modelos compatibles: `inworld-tts-1.5-max` (predeterminado), `inworld-tts-1.5-mini`, `inworld-tts-1-max`, `inworld-tts-1`.
  </Accordion>
  <Accordion title="Salidas de audio">
    Las respuestas utilizan MP3 de forma predeterminada. Cuando el destino del canal es `voice-note`, OpenClaw solicita a Inworld `OGG_OPUS` para que el audio se reproduzca como una burbuja de voz nativa. La síntesis de telefonía utiliza `PCM` sin procesar a 22050 Hz para alimentar el puente de telefonía.
  </Accordion>
  <Accordion title="Endpoints personalizados">
    Sobrescriba el host de la API con `tts.providers.inworld.baseUrl`. Las barras diagonales finales se eliminan antes de enviar las solicitudes.
  </Accordion>
</AccordionGroup>

## Contenido relacionado

<CardGroup cols={2}>
  <Card title="Texto a voz" href="/es/tools/tts" icon="waveform-lines">
    Descripción general de TTS, proveedores y configuración de `tts`.
  </Card>
  <Card title="Configuración" href="/es/gateway/configuration" icon="gear">
    Referencia completa de configuración, incluidos los ajustes de `tts`.
  </Card>
  <Card title="Proveedores" href="/es/providers" icon="grid">
    Todos los proveedores compatibles con OpenClaw.
  </Card>
  <Card title="Solución de problemas" href="/es/help/troubleshooting" icon="wrench">
    Problemas habituales y pasos de depuración.
  </Card>
</CardGroup>
