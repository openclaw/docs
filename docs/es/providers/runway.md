---
read_when:
    - Quieres usar la generación de video de Runway en OpenClaw
    - Necesitas la configuración de clave de API/env de Runway
    - Quieres convertir Runway en el proveedor de video predeterminado
summary: Configuración de generación de video de Runway en OpenClaw
title: Runway
x-i18n:
    generated_at: "2026-04-12T23:32:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: fb9a2d26687920544222b0769f314743af245629fd45b7f456c0161a47476176
    source_path: providers/runway.md
    workflow: 15
---

# Runway

OpenClaw incluye un proveedor integrado `runway` para generación de video alojada.

| Propiedad   | Valor                                                             |
| ----------- | ----------------------------------------------------------------- |
| ID del proveedor | `runway`                                                      |
| Autenticación | `RUNWAYML_API_SECRET` (canónico) o `RUNWAY_API_KEY`            |
| API         | Generación de video basada en tareas de Runway (sondeo de `GET /v1/tasks/{id}`) |

## Primeros pasos

<Steps>
  <Step title="Establece la clave de API">
    ```bash
    openclaw onboard --auth-choice runway-api-key
    ```
  </Step>
  <Step title="Establece Runway como proveedor de video predeterminado">
    ```bash
    openclaw config set agents.defaults.videoGenerationModel.primary "runway/gen4.5"
    ```
  </Step>
  <Step title="Genera un video">
    Pídele al agente que genere un video. Runway se usará automáticamente.
  </Step>
</Steps>

## Modos compatibles

| Modo           | Modelo             | Entrada de referencia      |
| -------------- | ------------------ | -------------------------- |
| Texto a video  | `gen4.5` (predeterminado) | Ninguna              |
| Imagen a video | `gen4.5`           | 1 imagen local o remota    |
| Video a video  | `gen4_aleph`       | 1 video local o remoto     |

<Note>
Las referencias locales de imagen y video son compatibles mediante URI de datos. Las ejecuciones de solo texto
actualmente exponen relaciones de aspecto `16:9` y `9:16`.
</Note>

<Warning>
Video a video actualmente requiere específicamente `runway/gen4_aleph`.
</Warning>

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

## Notas avanzadas

<AccordionGroup>
  <Accordion title="Alias de variables de entorno">
    OpenClaw reconoce tanto `RUNWAYML_API_SECRET` (canónico) como `RUNWAY_API_KEY`.
    Cualquiera de las dos variables autenticará el proveedor Runway.
  </Accordion>

  <Accordion title="Sondeo de tareas">
    Runway usa una API basada en tareas. Después de enviar una solicitud de generación, OpenClaw
    sondea `GET /v1/tasks/{id}` hasta que el video está listo. No se necesita
    configuración adicional para el comportamiento de sondeo.
  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Generación de video" href="/es/tools/video-generation" icon="video">
    Parámetros compartidos de herramientas, selección de proveedor y comportamiento asíncrono.
  </Card>
  <Card title="Referencia de configuración" href="/es/gateway/configuration-reference#agent-defaults" icon="gear">
    Ajustes predeterminados del agente, incluido el modelo de generación de video.
  </Card>
</CardGroup>
