---
read_when:
    - Quieres usar la generación de vídeo de Runway en OpenClaw
    - Necesitas configurar la clave de API y la variable de entorno de Runway
    - Quieres establecer Runway como el proveedor de vídeo predeterminado
summary: Configuración de la generación de vídeos con Runway en OpenClaw
title: Pista de aterrizaje
x-i18n:
    generated_at: "2026-07-11T23:27:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7aa2a802323857bf7c839ebfab56853dc79d656a25bbc194a431959a48bbd64b
    source_path: providers/runway.md
    workflow: 16
---

OpenClaw incluye un proveedor `runway` integrado para la generación de videos alojada, habilitado de forma predeterminada y registrado conforme al contrato `videoGenerationProviders`.

| Propiedad                  | Valor                                                                     |
| -------------------------- | ------------------------------------------------------------------------- |
| Id. del proveedor          | `runway`                                                                  |
| Plugin                     | integrado, `enabledByDefault: true`                                       |
| Variables de entorno de autenticación | `RUNWAYML_API_SECRET` (canónica) o `RUNWAY_API_KEY`             |
| Opción de incorporación    | `--auth-choice runway-api-key`                                            |
| Opción directa de la CLI   | `--runway-api-key <key>`                                                  |
| API                        | Generación de videos basada en tareas de Runway (consulta periódica de `GET /v1/tasks/{id}`) |
| Modelo predeterminado      | `runway/gen4.5`                                                           |

## Primeros pasos

<Steps>
  <Step title="Establecer la clave de API">
    ```bash
    openclaw onboard --auth-choice runway-api-key
    ```
  </Step>
  <Step title="Establecer Runway como proveedor de video predeterminado">
    ```bash
    openclaw config set agents.defaults.videoGenerationModel.primary "runway/gen4.5"
    ```
  </Step>
  <Step title="Generar un video">
    Pida al agente que genere un video. Runway se utilizará automáticamente.
  </Step>
</Steps>

## Modos y modelos compatibles

El proveedor ofrece siete modelos de Runway distribuidos en tres modos. Un mismo identificador de modelo puede utilizarse en más de un modo (por ejemplo, `gen4.5` funciona tanto para texto a video como para imagen a video).

| Modo            | Modelos                                                                 | Entrada de referencia        |
| --------------- | ----------------------------------------------------------------------- | ---------------------------- |
| Texto a video   | `gen4.5` (predeterminado), `veo3.1`, `veo3.1_fast`, `veo3`              | Ninguna                      |
| Imagen a video  | `gen4.5`, `gen4_turbo`, `gen3a_turbo`, `veo3.1`, `veo3.1_fast`, `veo3` | 1 imagen local o remota      |
| Video a video   | `gen4_aleph`                                                            | 1 video local o remoto       |

Se admiten referencias a imágenes y videos locales mediante URI de datos.

| Relaciones de aspecto       | Valores permitidos                           |
| --------------------------- | -------------------------------------------- |
| Texto a video               | `16:9`, `9:16`                               |
| Ediciones de imagen y video | `1:1`, `16:9`, `9:16`, `3:4`, `4:3`, `21:9` |

<Warning>
  Actualmente, el modo de video a video requiere `runway/gen4_aleph`. Los demás identificadores de modelos de Runway rechazan las entradas de referencia de video.
</Warning>

<Note>
  Seleccionar un identificador de modelo de Runway de la columna incorrecta genera un error explícito antes de que la solicitud de API salga de OpenClaw. El proveedor valida `model` con la lista de permitidos del modo (`TEXT_ONLY_MODELS`, `IMAGE_MODELS`, `VIDEO_MODELS`) en `extensions/runway/video-generation-provider.ts`.
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
    Cualquiera de las variables autentica el proveedor Runway.
  </Accordion>

  <Accordion title="Consulta periódica de tareas">
    Runway utiliza una API basada en tareas. Tras enviar una solicitud de generación, OpenClaw
    consulta periódicamente `GET /v1/tasks/{id}` hasta que el video está listo. No se necesita
    ninguna configuración adicional para este comportamiento de consulta periódica.
  </Accordion>
</AccordionGroup>

## Contenido relacionado

<CardGroup cols={2}>
  <Card title="Generación de videos" href="/es/tools/video-generation" icon="video">
    Parámetros compartidos de la herramienta, selección del proveedor y comportamiento asíncrono.
  </Card>
  <Card title="Referencia de configuración" href="/es/gateway/config-agents#agent-defaults" icon="gear">
    Configuración predeterminada del agente, incluido el modelo de generación de videos.
  </Card>
</CardGroup>
