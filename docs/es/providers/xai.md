---
read_when:
    - Quieres usar modelos Grok en OpenClaw
    - Estás configurando la autenticación de xAI o los IDs de modelo
summary: Usa modelos Grok de xAI en OpenClaw
title: xAI
x-i18n:
    generated_at: "2026-04-12T23:33:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: 820fef290c67d9815e41a96909d567216f67ca0f01df1d325008fd04666ad255
    source_path: providers/xai.md
    workflow: 15
---

# xAI

OpenClaw incluye un Plugin de proveedor `xai` integrado para modelos Grok.

## Primeros pasos

<Steps>
  <Step title="Create an API key">
    Crea una clave de API en la [consola de xAI](https://console.x.ai/).
  </Step>
  <Step title="Set your API key">
    Establece `XAI_API_KEY`, o ejecuta:

    ```bash
    openclaw onboard --auth-choice xai-api-key
    ```

  </Step>
  <Step title="Pick a model">
    ```json5
    {
      agents: { defaults: { model: { primary: "xai/grok-4" } } },
    }
    ```
  </Step>
</Steps>

<Note>
OpenClaw usa la API de Responses de xAI como transporte integrado de xAI. La misma
`XAI_API_KEY` también puede alimentar `web_search` respaldado por Grok, `x_search` de primera clase
y `code_execution` remoto.
Si almacenas una clave de xAI en `plugins.entries.xai.config.webSearch.apiKey`,
el proveedor de modelos `xai` integrado también reutiliza esa clave como alternativa.
La configuración de `code_execution` vive en `plugins.entries.xai.config.codeExecution`.
</Note>

## Catálogo de modelos integrados

OpenClaw incluye estas familias de modelos xAI listas para usar:

| Familia         | IDs de modelo                                                             |
| --------------- | ------------------------------------------------------------------------- |
| Grok 3          | `grok-3`, `grok-3-fast`, `grok-3-mini`, `grok-3-mini-fast`                |
| Grok 4          | `grok-4`, `grok-4-0709`                                                   |
| Grok 4 Fast     | `grok-4-fast`, `grok-4-fast-non-reasoning`                                |
| Grok 4.1 Fast   | `grok-4-1-fast`, `grok-4-1-fast-non-reasoning`                            |
| Grok 4.20 Beta  | `grok-4.20-beta-latest-reasoning`, `grok-4.20-beta-latest-non-reasoning`  |
| Grok Code       | `grok-code-fast-1`                                                        |

El Plugin también resuelve por reenvío IDs más nuevos de `grok-4*` y `grok-code-fast*` cuando
siguen la misma forma de API.

<Tip>
`grok-4-fast`, `grok-4-1-fast` y las variantes `grok-4.20-beta-*` son las
refs de Grok con capacidad de imagen actuales en el catálogo integrado.
</Tip>

### Asignaciones de modo fast

`/fast on` o `agents.defaults.models["xai/<model>"].params.fastMode: true`
reescriben las solicitudes nativas de xAI de la siguiente manera:

| Modelo de origen | Destino en modo fast |
| ---------------- | -------------------- |
| `grok-3`         | `grok-3-fast`        |
| `grok-3-mini`    | `grok-3-mini-fast`   |
| `grok-4`         | `grok-4-fast`        |
| `grok-4-0709`    | `grok-4-fast`        |

### Alias heredados de compatibilidad

Los alias heredados siguen normalizándose a los IDs canónicos integrados:

| Alias heredado           | ID canónico                           |
| ------------------------ | ------------------------------------- |
| `grok-4-fast-reasoning`  | `grok-4-fast`                         |
| `grok-4-1-fast-reasoning`| `grok-4-1-fast`                       |
| `grok-4.20-reasoning`    | `grok-4.20-beta-latest-reasoning`     |
| `grok-4.20-non-reasoning`| `grok-4.20-beta-latest-non-reasoning` |

## Funciones

<AccordionGroup>
  <Accordion title="Web search">
    El proveedor integrado de búsqueda web `grok` también usa `XAI_API_KEY`:

    ```bash
    openclaw config set tools.web.search.provider grok
    ```

  </Accordion>

  <Accordion title="Video generation">
    El Plugin `xai` integrado registra generación de video mediante la herramienta compartida
    `video_generate`.

    - Modelo de video predeterminado: `xai/grok-imagine-video`
    - Modos: texto a video, imagen a video y flujos remotos de edición/extensión de video
    - Admite `aspectRatio` y `resolution`

    <Warning>
    No se aceptan búferes de video locales. Usa URLs remotas `http(s)` para
    entradas de referencia de video y de edición.
    </Warning>

    Para usar xAI como proveedor de video predeterminado:

    ```json5
    {
      agents: {
        defaults: {
          videoGenerationModel: {
            primary: "xai/grok-imagine-video",
          },
        },
      },
    }
    ```

    <Note>
    Consulta [Video Generation](/es/tools/video-generation) para ver parámetros compartidos de herramientas,
    selección de proveedor y comportamiento de failover.
    </Note>

  </Accordion>

  <Accordion title="x_search configuration">
    El Plugin de xAI integrado expone `x_search` como una herramienta de OpenClaw para buscar
    contenido de X (antes Twitter) mediante Grok.

    Ruta de configuración: `plugins.entries.xai.config.xSearch`

    | Clave             | Tipo    | Predeterminado     | Descripción                          |
    | ----------------- | ------- | ------------------ | ------------------------------------ |
    | `enabled`         | boolean | —                  | Habilita o deshabilita x_search      |
    | `model`           | string  | `grok-4-1-fast`    | Modelo usado para solicitudes de x_search |
    | `inlineCitations` | boolean | —                  | Incluye citas en línea en los resultados |
    | `maxTurns`        | number  | —                  | Máximo de turnos de conversación     |
    | `timeoutSeconds`  | number  | —                  | Tiempo de espera de la solicitud en segundos |
    | `cacheTtlMinutes` | number  | —                  | Tiempo de vida de la caché en minutos |

    ```json5
    {
      plugins: {
        entries: {
          xai: {
            config: {
              xSearch: {
                enabled: true,
                model: "grok-4-1-fast",
                inlineCitations: true,
              },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Code execution configuration">
    El Plugin de xAI integrado expone `code_execution` como una herramienta de OpenClaw para
    ejecución remota de código en el entorno sandbox de xAI.

    Ruta de configuración: `plugins.entries.xai.config.codeExecution`

    | Clave             | Tipo    | Predeterminado             | Descripción                             |
    | ----------------- | ------- | -------------------------- | --------------------------------------- |
    | `enabled`         | boolean | `true` (si hay clave disponible) | Habilita o deshabilita code_execution |
    | `model`           | string  | `grok-4-1-fast`           | Modelo usado para solicitudes de code execution |
    | `maxTurns`        | number  | —                          | Máximo de turnos de conversación        |
    | `timeoutSeconds`  | number  | —                          | Tiempo de espera de la solicitud en segundos |

    <Note>
    Esto es ejecución remota en sandbox de xAI, no [`exec`](/es/tools/exec) local.
    </Note>

    ```json5
    {
      plugins: {
        entries: {
          xai: {
            config: {
              codeExecution: {
                enabled: true,
                model: "grok-4-1-fast",
              },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Known limits">
    - La autenticación hoy es solo mediante clave de API. OpenClaw aún no tiene flujo OAuth ni de código de dispositivo para xAI.
    - `grok-4.20-multi-agent-experimental-beta-0304` no es compatible con la ruta normal del proveedor xAI
      porque requiere una superficie de API upstream distinta a la del transporte estándar de xAI de OpenClaw.
  </Accordion>

  <Accordion title="Advanced notes">
    - OpenClaw aplica automáticamente correcciones de compatibilidad específicas de xAI para esquemas de herramientas y llamadas a herramientas
      en la ruta del ejecutor compartido.
    - Las solicitudes nativas de xAI usan por defecto `tool_stream: true`. Establece
      `agents.defaults.models["xai/<model>"].params.tool_stream` en `false` para
      desactivarlo.
    - El wrapper integrado de xAI elimina flags no compatibles de esquemas estrictos de herramientas y
      claves de payload de reasoning antes de enviar solicitudes nativas de xAI.
    - `web_search`, `x_search` y `code_execution` se exponen como herramientas de OpenClaw.
      OpenClaw habilita la capacidad integrada específica de xAI que necesita en cada solicitud de herramienta
      en lugar de adjuntar todas las herramientas nativas a cada turno de chat.
    - `x_search` y `code_execution` pertenecen al Plugin de xAI integrado en lugar de estar codificados
      de forma fija en el runtime de modelos del core.
    - `code_execution` es ejecución remota en sandbox de xAI, no
      [`exec`](/es/tools/exec) local.
  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Model selection" href="/es/concepts/model-providers" icon="layers">
    Cómo elegir proveedores, refs de modelos y comportamiento de failover.
  </Card>
  <Card title="Video generation" href="/es/tools/video-generation" icon="video">
    Parámetros compartidos de la herramienta de video y selección de proveedor.
  </Card>
  <Card title="All providers" href="/es/providers/index" icon="grid-2">
    La vista general más amplia de proveedores.
  </Card>
  <Card title="Troubleshooting" href="/es/help/troubleshooting" icon="wrench">
    Problemas comunes y soluciones.
  </Card>
</CardGroup>
