---
read_when:
    - Quieres usar la generación de video de Runway en OpenClaw
    - Necesitas la configuración de la clave de API y de las variables de entorno de Runway
    - Quieres establecer Runway como el proveedor de video predeterminado
summary: Configuración de generación de video de Runway en OpenClaw
title: Pista
x-i18n:
    generated_at: "2026-05-06T05:46:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 51980217868c6d2f168f897106f81ea38dfcfde5265b14e394d4e232324a46b7
    source_path: providers/runway.md
    workflow: 16
---

OpenClaw incluye un proveedor `runway` integrado para generación de video alojada. El Plugin está habilitado de forma predeterminada y registra el proveedor `runway` con el contrato `videoGenerationProviders`.

| Propiedad                 | Valor                                                                  |
| ------------------------- | ---------------------------------------------------------------------- |
| ID del proveedor          | `runway`                                                               |
| Plugin                    | integrado, `enabledByDefault: true`                                    |
| Variables de entorno de autenticación | `RUNWAYML_API_SECRET` (canónica) o `RUNWAY_API_KEY`           |
| Opción de incorporación   | `--auth-choice runway-api-key`                                         |
| Opción directa de CLI     | `--runway-api-key <key>`                                               |
| API                       | Generación de video basada en tareas de Runway (sondeo de `GET /v1/tasks/{id}`) |
| Modelo predeterminado     | `runway/gen4.5`                                                        |

## Primeros pasos

<Steps>
  <Step title="Set the API key">
    ```bash
    openclaw onboard --auth-choice runway-api-key
    ```
  </Step>
  <Step title="Set Runway as the default video provider">
    ```bash
    openclaw config set agents.defaults.videoGenerationModel.primary "runway/gen4.5"
    ```
  </Step>
  <Step title="Generate a video">
    Pídele al agente que genere un video. Runway se usará automáticamente.
  </Step>
</Steps>

## Modos y modelos compatibles

El proveedor expone siete modelos de Runway divididos en tres modos. El mismo ID de modelo puede servir para más de un modo (por ejemplo, `gen4.5` funciona tanto para texto a video como para imagen a video).

| Modo           | Modelos                                                                | Entrada de referencia      |
| -------------- | ---------------------------------------------------------------------- | -------------------------- |
| Texto a video  | `gen4.5` (predeterminado), `veo3.1`, `veo3.1_fast`, `veo3`             | Ninguna                    |
| Imagen a video | `gen4.5`, `gen4_turbo`, `gen3a_turbo`, `veo3.1`, `veo3.1_fast`, `veo3` | 1 imagen local o remota    |
| Video a video  | `gen4_aleph`                                                           | 1 video local o remoto     |

Las referencias locales de imagen y video son compatibles mediante URI de datos.

| Relaciones de aspecto       | Valores permitidos                         |
| --------------------------- | ------------------------------------------ |
| Texto a video               | `16:9`, `9:16`                             |
| Ediciones de imagen y video | `1:1`, `16:9`, `9:16`, `3:4`, `4:3`, `21:9` |

<Warning>
  Actualmente, video a video requiere `runway/gen4_aleph`. Otros ID de modelo de Runway rechazan entradas de referencia de video.
</Warning>

<Note>
  Elegir un ID de modelo de Runway de la columna incorrecta produce un error explícito antes de que la solicitud de API salga de OpenClaw. El proveedor valida `model` contra la lista de permitidos del modo (`TEXT_ONLY_MODELS`, `IMAGE_MODELS`, `VIDEO_MODELS`) en `extensions/runway/video-generation-provider.ts`.
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
  <Accordion title="Environment variable aliases">
    OpenClaw reconoce tanto `RUNWAYML_API_SECRET` (canónica) como `RUNWAY_API_KEY`.
    Cualquiera de las dos variables autenticará el proveedor de Runway.
  </Accordion>

  <Accordion title="Task polling">
    Runway usa una API basada en tareas. Después de enviar una solicitud de generación, OpenClaw
    sondea `GET /v1/tasks/{id}` hasta que el video esté listo. No se necesita configuración
    adicional para el comportamiento de sondeo.
  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Video generation" href="/es/tools/video-generation" icon="video">
    Parámetros de herramienta compartidos, selección de proveedor y comportamiento asíncrono.
  </Card>
  <Card title="Configuration reference" href="/es/gateway/config-agents#agent-defaults" icon="gear">
    Configuración predeterminada del agente, incluido el modelo de generación de video.
  </Card>
</CardGroup>
