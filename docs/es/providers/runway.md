---
read_when:
    - Quieres usar la generación de vídeo de Runway en OpenClaw
    - Necesita configurar la clave de API y la variable de entorno de Runway
    - Se desea establecer Runway como el proveedor de vídeo predeterminado
summary: Configuración de la generación de vídeo de Runway en OpenClaw
title: Runway
x-i18n:
    generated_at: "2026-07-22T10:45:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 6a56e768893e327b56d70e8b8c2d426123a861b3cf05c0107d98104e2cee856c
    source_path: providers/runway.md
    workflow: 16
---

OpenClaw incluye un proveedor `runway` integrado para la generación de vídeo alojada, habilitado de forma predeterminada y registrado conforme al contrato `videoGenerationProviders`.

| Propiedad                     | Valor                                                             |
| ----------------------------- | ----------------------------------------------------------------- |
| Id. del proveedor             | `runway`                                                |
| Plugin                        | integrado, `enabledByDefault: true`                                    |
| Variables de entorno de autenticación | `RUNWAYML_API_SECRET` (canónica) o `RUNWAY_API_KEY`       |
| Opción de incorporación       | `--auth-choice runway-api-key`                                                |
| Opción directa de la CLI      | `--runway-api-key <key>`                                                |
| API                           | Generación de vídeo basada en tareas de Runway (sondeo de `GET /v1/tasks/{id}`) |
| Modelo predeterminado         | `runway/gen4.5`                                                |

## Primeros pasos

<Steps>
  <Step title="Configurar la clave de API">
    ```bash
    openclaw onboard --auth-choice runway-api-key
    ```
  </Step>
  <Step title="Establecer Runway como proveedor de vídeo predeterminado">
    ```bash
    openclaw config set agents.defaults.mediaModels.video.primary "runway/gen4.5"
    ```
  </Step>
  <Step title="Generar un vídeo">
    Solicite al agente que genere un vídeo. Runway se utilizará automáticamente.
  </Step>
</Steps>

## Modos y modelos compatibles

El proveedor ofrece siete modelos de Runway distribuidos en tres modos. Un mismo id. de modelo puede utilizarse en más de un modo (por ejemplo, `gen4.5` funciona tanto para texto a vídeo como para imagen a vídeo).

| Modo            | Modelos                                                                | Entrada de referencia       |
| --------------- | ---------------------------------------------------------------------- | --------------------------- |
| Texto a vídeo   | `gen4.5` (predeterminado), `veo3.1`, `veo3.1_fast`, `veo3` | Ninguna                     |
| Imagen a vídeo  | `gen4.5`, `gen4_turbo`, `gen3a_turbo`, `veo3.1`, `veo3.1_fast`, `veo3` | 1 imagen local o remota     |
| Vídeo a vídeo   | `gen4_aleph`                                                     | 1 vídeo local o remoto      |

Se admiten referencias a imágenes y vídeos locales mediante URI de datos.

| Relaciones de aspecto          | Valores permitidos                            |
| ------------------------------ | --------------------------------------------- |
| Texto a vídeo                  | `16:9`, `9:16`        |
| Ediciones de imagen y vídeo    | `1:1`, `16:9`, `9:16`, `3:4`, `4:3`, `21:9` |

<Warning>
  Actualmente, la conversión de vídeo a vídeo requiere `runway/gen4_aleph`. Otros id. de modelos de Runway rechazan las entradas de referencia de vídeo.
</Warning>

<Note>
  Seleccionar un id. de modelo de Runway de la columna incorrecta genera un error explícito antes de que la solicitud de API salga de OpenClaw. El proveedor valida `model` con respecto a la lista de permitidos del modo (`TEXT_ONLY_MODELS`, `IMAGE_MODELS`, `VIDEO_MODELS`) en `extensions/runway/video-generation-provider.ts`.
</Note>

## Configuración

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "runway/gen4.5",
      },
    },
  },
}
```

## Configuración avanzada

<AccordionGroup>
  <Accordion title="Alias de variables de entorno">
    OpenClaw reconoce tanto `RUNWAYML_API_SECRET` (canónica) como `RUNWAY_API_KEY`.
    Cualquiera de las dos variables autentica el proveedor de Runway.
  </Accordion>

  <Accordion title="Sondeo de tareas">
    Runway utiliza una API basada en tareas. Tras enviar una solicitud de generación, OpenClaw
    sondea `GET /v1/tasks/{id}` hasta que el vídeo esté listo. No se necesita ninguna
    configuración adicional para el comportamiento de sondeo.
  </Accordion>
</AccordionGroup>

## Contenido relacionado

<CardGroup cols={2}>
  <Card title="Generación de vídeo" href="/es/tools/video-generation" icon="video">
    Parámetros compartidos de la herramienta, selección del proveedor y comportamiento asíncrono.
  </Card>
  <Card title="Referencia de configuración" href="/es/gateway/config-agents#agent-defaults" icon="gear">
    Configuración predeterminada del agente, incluido el modelo de generación de vídeo.
  </Card>
</CardGroup>
