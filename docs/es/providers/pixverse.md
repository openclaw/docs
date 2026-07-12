---
read_when:
    - Quieres usar la generación de vídeos de PixVerse en OpenClaw
    - Necesitas configurar la clave de API y las variables de entorno de PixVerse
    - Quieres establecer PixVerse como el proveedor de vídeo predeterminado
summary: Configuración de la generación de videos con PixVerse en OpenClaw
title: PixVerse
x-i18n:
    generated_at: "2026-07-11T23:27:54Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 50204c771deb315e7336325f2852e4b65dfba4264bbe288b819d44b8def1ce82
    source_path: providers/pixverse.md
    workflow: 16
---

OpenClaw proporciona `pixverse` como Plugin externo oficial para la generación alojada de videos con PixVerse. El Plugin registra el proveedor `pixverse` mediante el contrato `videoGenerationProviders`.

| Propiedad             | Valor                                                                        |
| --------------------- | ---------------------------------------------------------------------------- |
| Id. del proveedor     | `pixverse`                                                                   |
| Paquete del Plugin    | `@openclaw/pixverse-provider`                                                |
| Variable de entorno de autenticación | `PIXVERSE_API_KEY`                                           |
| Opción de incorporación | `--auth-choice pixverse-api-key`                                           |
| Opción directa de la CLI | `--pixverse-api-key <key>`                                                |
| API                   | API de la plataforma PixVerse v2 (envío de `video_id` y consulta de resultados) |
| Modelo predeterminado | `pixverse/v6`                                                                |
| Región predeterminada de la API | Internacional                                                     |

## Primeros pasos

<Steps>
  <Step title="Instalar el Plugin">
    ```bash
    openclaw plugins install @openclaw/pixverse-provider
    openclaw gateway restart
    ```
  </Step>
  <Step title="Establecer la clave de API">
    ```bash
    openclaw onboard --auth-choice pixverse-api-key
    ```

    El asistente solicita el endpoint Internacional o de China (consulta la
    región de la API más adelante) antes de escribir `region` y `baseUrl` en
    la configuración del proveedor. Las ejecuciones no interactivas (con la
    clave de `--pixverse-api-key` o `PIXVERSE_API_KEY`) usan Internacional de
    forma predeterminada.

    La incorporación también establece
    `agents.defaults.videoGenerationModel.primary` en `pixverse/v6` cuando aún
    no se ha configurado un modelo de video predeterminado.

  </Step>
  <Step title="Cambiar el proveedor de video predeterminado existente (opcional)">
    ```bash
    openclaw config set agents.defaults.videoGenerationModel.primary "pixverse/v6"
    ```
  </Step>
  <Step title="Generar un video">
    Pide al agente que genere un video. PixVerse se utilizará automáticamente.
  </Step>
</Steps>

## Modos y modelos compatibles

El proveedor expone los modelos de generación de PixVerse mediante la herramienta de video compartida de OpenClaw.

| Modo            | Modelos              | Entrada de referencia       |
| --------------- | -------------------- | --------------------------- |
| Texto a video   | `v6` (predeterminado), `c1` | Ninguna              |
| Imagen a video  | `v6` (predeterminado), `c1` | 1 imagen local o remota |

Las referencias a imágenes locales se cargan en PixVerse antes de la solicitud de imagen a video. Las URL de imágenes remotas se pasan al endpoint de carga de imágenes de PixVerse como `image_url`.

| Opción          | Valores compatibles                                                                                                                       |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Duración        | De 1 a 15 segundos (valor predeterminado: 5)                                                                                              |
| Resolución      | `360P`, `540P`, `720P`, `1080P` (valor predeterminado: `540P`; las solicitudes de `480P` se convierten en `540P`)                        |
| Relación de aspecto | `16:9` (predeterminada), `4:3`, `1:1`, `3:4`, `9:16`, `2:3`, `3:2`, `21:9`; solo para texto a video; imagen a video usa la imagen de origen |
| Audio generado  | `audio: true`                                                                                                                             |

<Note>
La generación de imágenes mediante plantillas de PixVerse aún no está disponible a través de `image_generate`. Esa API se basa en identificadores de plantilla, mientras que el contrato compartido de generación de imágenes de OpenClaw no dispone actualmente de un conjunto tipado de opciones específico de PixVerse.
</Note>

## Opciones del proveedor

El proveedor de video acepta estas claves opcionales específicas del proveedor:

| Opción                               | Tipo   | Efecto                                               |
| ------------------------------------ | ------ | ---------------------------------------------------- |
| `seed`                               | número | Semilla determinista, de 0 a 2147483647              |
| `negativePrompt` / `negative_prompt` | cadena | Prompt negativo                                      |
| `quality`                            | cadena | Calidad de PixVerse, como `720p`                     |
| `motionMode` / `motion_mode`         | cadena | Modo de movimiento de imagen a video (predeterminado: `normal`) |
| `cameraMovement` / `camera_movement` | cadena | Preajuste de movimiento de cámara de PixVerse        |
| `templateId` / `template_id`         | número | Id. de plantilla de PixVerse activada                |

## Configuración

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "pixverse/v6",
      },
    },
  },
}
```

## Configuración avanzada

<AccordionGroup>
  <Accordion title="Región de la API">
    | Valor de la región | URL base de la API de PixVerse               |
    | ------------------ | --------------------------------------------- |
    | `international`    | `https://app-api.pixverse.ai/openapi/v2`      |
    | `cn`               | `https://app-api.pixverseai.cn/openapi/v2`    |

    Establece `models.providers.pixverse.region` manualmente cuando tu clave
    pertenezca a una región específica de la plataforma PixVerse, o ejecuta
    `openclaw onboard --auth-choice pixverse-api-key` para elegir una en el
    asistente de configuración:

    ```json5
    {
      models: {
        providers: {
          pixverse: {
            region: "cn", // "international" or "cn"
            baseUrl: "https://app-api.pixverseai.cn/openapi/v2",
            models: [],
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="URL base personalizada">
    Establece `models.providers.pixverse.baseUrl` únicamente cuando el tráfico se enrute mediante un proxy compatible y de confianza.
    `baseUrl` tiene prioridad sobre `region`.

    ```json5
    {
      models: {
        providers: {
          pixverse: {
            baseUrl: "https://app-api.pixverse.ai/openapi/v2",
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Consulta de tareas">
    PixVerse devuelve un `video_id` en la solicitud de generación. OpenClaw
    consulta `/openapi/v2/video/result/{video_id}` cada 5 segundos hasta que la
    tarea finaliza correctamente, falla o alcanza el tiempo de espera (5
    minutos de forma predeterminada; se puede sobrescribir con
    `agents.defaults.videoGenerationModel.timeoutMs`).
  </Accordion>
</AccordionGroup>

## Contenido relacionado

<CardGroup cols={2}>
  <Card title="Generación de video" href="/es/tools/video-generation" icon="video">
    Parámetros de la herramienta compartida, selección del proveedor y comportamiento asíncrono.
  </Card>
  <Card title="Referencia de configuración" href="/es/gateway/config-agents#agent-defaults" icon="gear">
    Configuración predeterminada del agente, incluido el modelo de generación de video.
  </Card>
</CardGroup>
