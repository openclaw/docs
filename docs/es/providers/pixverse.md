---
read_when:
    - Quieres usar la generación de video de PixVerse en OpenClaw
    - Necesitas la clave de API y la configuración de entorno de PixVerse
    - Quieres que PixVerse sea el proveedor de video predeterminado
summary: Configuración de generación de video de PixVerse en OpenClaw
title: PixVerse
x-i18n:
    generated_at: "2026-07-05T11:38:39Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 50204c771deb315e7336325f2852e4b65dfba4264bbe288b819d44b8def1ce82
    source_path: providers/pixverse.md
    workflow: 16
---

OpenClaw proporciona `pixverse` como Plugin externo oficial para la generación de video alojada de PixVerse. El Plugin registra el proveedor `pixverse` en el contrato `videoGenerationProviders`.

| Propiedad               | Valor                                                                    |
| ----------------------- | ------------------------------------------------------------------------ |
| Id. de proveedor        | `pixverse`                                                               |
| Paquete del Plugin      | `@openclaw/pixverse-provider`                                            |
| Variable de entorno de autenticación | `PIXVERSE_API_KEY`                                          |
| Opción de onboarding    | `--auth-choice pixverse-api-key`                                         |
| Opción directa de CLI   | `--pixverse-api-key <key>`                                               |
| API                     | API de PixVerse Platform v2 (envío de `video_id` más sondeo de resultado) |
| Modelo predeterminado   | `pixverse/v6`                                                            |
| Región de API predeterminada | Internacional                                                       |

## Primeros pasos

<Steps>
  <Step title="Instalar el Plugin">
    ```bash
    openclaw plugins install @openclaw/pixverse-provider
    openclaw gateway restart
    ```
  </Step>
  <Step title="Configurar la clave de API">
    ```bash
    openclaw onboard --auth-choice pixverse-api-key
    ```

    El asistente solicita el endpoint Internacional o CN (consulta la región de API
    abajo) antes de escribir `region` y `baseUrl` en la configuración del proveedor.
    Las ejecuciones no interactivas (clave desde `--pixverse-api-key` o `PIXVERSE_API_KEY`)
    usan Internacional de forma predeterminada.

    El onboarding también configura `agents.defaults.videoGenerationModel.primary` como
    `pixverse/v6` cuando aún no hay ningún modelo de video predeterminado configurado.

  </Step>
  <Step title="Cambiar un proveedor de video predeterminado existente (opcional)">
    ```bash
    openclaw config set agents.defaults.videoGenerationModel.primary "pixverse/v6"
    ```
  </Step>
  <Step title="Generar un video">
    Pide al agente que genere un video. PixVerse se usará automáticamente.
  </Step>
</Steps>

## Modos y modelos compatibles

El proveedor expone modelos de generación de PixVerse mediante la herramienta de video compartida de OpenClaw.

| Modo            | Modelos               | Entrada de referencia        |
| --------------- | --------------------- | ---------------------------- |
| Texto a video   | `v6` (predeterminado), `c1` | Ninguna                 |
| Imagen a video  | `v6` (predeterminado), `c1` | 1 imagen local o remota |

Las referencias de imágenes locales se suben a PixVerse antes de la solicitud de imagen a video. Las URL de imágenes remotas se pasan por el endpoint de subida de imágenes de PixVerse como `image_url`.

| Opción          | Valores compatibles                                                                                                                 |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Duración        | 1-15 segundos (predeterminado 5)                                                                                                     |
| Resolución      | `360P`, `540P`, `720P`, `1080P` (predeterminado `540P`; las solicitudes `480P` se asignan a `540P`)                                  |
| Relación de aspecto | `16:9` (predeterminado), `4:3`, `1:1`, `3:4`, `9:16`, `2:3`, `3:2`, `21:9`; solo texto a video, imagen a video sigue la imagen de origen |
| Audio generado  | `audio: true`                                                                                                                       |

<Note>
La generación de plantillas de imagen de PixVerse aún no se expone mediante `image_generate`. Esa API está impulsada por id. de plantilla, mientras que el contrato compartido de generación de imágenes de OpenClaw actualmente no tiene un conjunto de opciones tipado específico de PixVerse.
</Note>

## Opciones del proveedor

El proveedor de video acepta estas claves opcionales específicas del proveedor:

| Opción                               | Tipo   | Efecto                                           |
| ------------------------------------ | ------ | ------------------------------------------------ |
| `seed`                               | number | Semilla determinista, de 0 a 2147483647          |
| `negativePrompt` / `negative_prompt` | string | Prompt negativo                                  |
| `quality`                            | string | Calidad de PixVerse, como `720p`                 |
| `motionMode` / `motion_mode`         | string | Modo de movimiento de imagen a video (predeterminado `normal`) |
| `cameraMovement` / `camera_movement` | string | Preajuste de movimiento de cámara de PixVerse    |
| `templateId` / `template_id`         | number | Id. de plantilla de PixVerse activada            |

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
  <Accordion title="Región de API">
    | Valor de región | URL base de la API de PixVerse                 |
    | --------------- | ---------------------------------------------- |
    | `international` | `https://app-api.pixverse.ai/openapi/v2`       |
    | `cn`            | `https://app-api.pixverseai.cn/openapi/v2`     |

    Configura `models.providers.pixverse.region` manualmente cuando tu clave pertenezca a una
    región específica de la plataforma PixVerse, o ejecuta
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
    Configura `models.providers.pixverse.baseUrl` solo cuando enrutes a través de un proxy compatible de confianza.
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

  <Accordion title="Sondeo de tareas">
    PixVerse devuelve un `video_id` desde la solicitud de generación. OpenClaw sondea
    `/openapi/v2/video/result/{video_id}` cada 5 segundos hasta que la tarea
    se complete correctamente, falle o alcance el tiempo de espera (predeterminado 5 minutos; se puede sobrescribir con
    `agents.defaults.videoGenerationModel.timeoutMs`).
  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Generación de video" href="/es/tools/video-generation" icon="video">
    Parámetros de herramienta compartidos, selección de proveedor y comportamiento asincrónico.
  </Card>
  <Card title="Referencia de configuración" href="/es/gateway/config-agents#agent-defaults" icon="gear">
    Ajustes predeterminados del agente, incluido el modelo de generación de video.
  </Card>
</CardGroup>
