---
read_when:
    - Quieres usar la generación de video de Runway en OpenClaw
    - Necesitas la configuración de la clave de API/entorno de Runway
    - Quieres que Runway sea el proveedor de video predeterminado
summary: Configuración de generación de video con Runway en OpenClaw
title: Pasarela
x-i18n:
    generated_at: "2026-07-05T11:37:59Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7aa2a802323857bf7c839ebfab56853dc79d656a25bbc194a431959a48bbd64b
    source_path: providers/runway.md
    workflow: 16
---

OpenClaw incluye un proveedor `runway` integrado para generación de video alojada, habilitado de forma predeterminada y registrado con el contrato `videoGenerationProviders`.

| Propiedad                    | Valor                                                               |
| ---------------------------- | ------------------------------------------------------------------- |
| ID del proveedor             | `runway`                                                            |
| Plugin                       | integrado, `enabledByDefault: true`                                 |
| Variables de entorno de auth | `RUNWAYML_API_SECRET` (canónica) o `RUNWAY_API_KEY`                 |
| Marca de incorporación       | `--auth-choice runway-api-key`                                      |
| Marca directa de CLI         | `--runway-api-key <key>`                                            |
| API                          | generación de video basada en tareas de Runway (sondeo de `GET /v1/tasks/{id}`) |
| Modelo predeterminado        | `runway/gen4.5`                                                     |

## Primeros pasos

<Steps>
  <Step title="Configurar la clave de API">
    ```bash
    openclaw onboard --auth-choice runway-api-key
    ```
  </Step>
  <Step title="Configurar Runway como proveedor de video predeterminado">
    ```bash
    openclaw config set agents.defaults.videoGenerationModel.primary "runway/gen4.5"
    ```
  </Step>
  <Step title="Generar un video">
    Pide al agente que genere un video. Runway se usará automáticamente.
  </Step>
</Steps>

## Modos y modelos compatibles

El proveedor expone siete modelos de Runway divididos en tres modos. El mismo id de modelo puede servir para más de un modo (por ejemplo, `gen4.5` funciona tanto para texto a video como para imagen a video).

| Modo            | Modelos                                                                | Entrada de referencia       |
| --------------- | ---------------------------------------------------------------------- | --------------------------- |
| Texto a video   | `gen4.5` (predeterminado), `veo3.1`, `veo3.1_fast`, `veo3`             | Ninguna                     |
| Imagen a video  | `gen4.5`, `gen4_turbo`, `gen3a_turbo`, `veo3.1`, `veo3.1_fast`, `veo3` | 1 imagen local o remota     |
| Video a video   | `gen4_aleph`                                                           | 1 video local o remoto      |

Las referencias a imágenes y videos locales son compatibles mediante URI de datos.

| Relaciones de aspecto       | Valores permitidos                          |
| --------------------------- | ------------------------------------------- |
| Texto a video               | `16:9`, `9:16`                              |
| Ediciones de imagen y video | `1:1`, `16:9`, `9:16`, `3:4`, `4:3`, `21:9` |

<Warning>
  Video a video actualmente requiere `runway/gen4_aleph`. Otros ids de modelo de Runway rechazan las entradas de referencia de video.
</Warning>

<Note>
  Elegir un id de modelo de Runway de la columna incorrecta produce un error explícito antes de que la solicitud de API salga de OpenClaw. El proveedor valida `model` contra la lista permitida del modo (`TEXT_ONLY_MODELS`, `IMAGE_MODELS`, `VIDEO_MODELS`) en `extensions/runway/video-generation-provider.ts`.
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
    Cualquiera de las variables autentica el proveedor de Runway.
  </Accordion>

  <Accordion title="Sondeo de tareas">
    Runway usa una API basada en tareas. Después de enviar una solicitud de generación, OpenClaw
    sondea `GET /v1/tasks/{id}` hasta que el video esté listo. No se necesita configuración
    adicional para el comportamiento de sondeo.
  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Generación de video" href="/es/tools/video-generation" icon="video">
    Parámetros compartidos de la herramienta, selección de proveedor y comportamiento asíncrono.
  </Card>
  <Card title="Referencia de configuración" href="/es/gateway/config-agents#agent-defaults" icon="gear">
    Ajustes predeterminados del agente, incluido el modelo de generación de video.
  </Card>
</CardGroup>
