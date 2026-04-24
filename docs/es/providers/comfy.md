---
read_when:
    - Quieres usar flujos de trabajo locales de ComfyUI con OpenClaw
    - Quieres usar Comfy Cloud con flujos de trabajo de imagen, video o música
    - Necesitas las claves de configuración del Plugin comfy incluido
summary: Configuración de generación de imágenes, video y música con flujos de trabajo de ComfyUI en OpenClaw
title: ComfyUI
x-i18n:
    generated_at: "2026-04-24T05:44:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: d8b39c49df3ad23018372b481681ce89deac3271da5dbdf94580712ace7fef7f
    source_path: providers/comfy.md
    workflow: 15
---

OpenClaw incluye un Plugin `comfy` para ejecuciones de ComfyUI basadas en flujos de trabajo. El Plugin está completamente orientado a flujos de trabajo, por lo que OpenClaw no intenta asignar controles genéricos de `size`, `aspectRatio`, `resolution`, `durationSeconds` o de estilo TTS a tu grafo.

| Propiedad | Detalle |
| --------------- | -------------------------------------------------------------------------------- |
| Proveedor | `comfy` |
| Modelos | `comfy/workflow` |
| Superficies compartidas | `image_generate`, `video_generate`, `music_generate` |
| Autenticación | Ninguna para ComfyUI local; `COMFY_API_KEY` o `COMFY_CLOUD_API_KEY` para Comfy Cloud |
| API | ComfyUI `/prompt` / `/history` / `/view` y Comfy Cloud `/api/*` |

## Qué admite

- Generación de imágenes a partir de un JSON de flujo de trabajo
- Edición de imágenes con 1 imagen de referencia subida
- Generación de video a partir de un JSON de flujo de trabajo
- Generación de video con 1 imagen de referencia subida
- Generación de música o audio mediante la herramienta compartida `music_generate`
- Descarga de salida desde un nodo configurado o desde todos los nodos de salida coincidentes

## Primeros pasos

Elige entre ejecutar ComfyUI en tu propia máquina o usar Comfy Cloud.

<Tabs>
  <Tab title="Local">
    **Ideal para:** ejecutar tu propia instancia de ComfyUI en tu máquina o LAN.

    <Steps>
      <Step title="Iniciar ComfyUI localmente">
        Asegúrate de que tu instancia local de ComfyUI esté en ejecución (por defecto en `http://127.0.0.1:8188`).
      </Step>
      <Step title="Preparar tu JSON de flujo de trabajo">
        Exporta o crea un archivo JSON de flujo de trabajo de ComfyUI. Anota los IDs de nodo del nodo de entrada del prompt y del nodo de salida del que quieres que OpenClaw lea.
      </Step>
      <Step title="Configurar el proveedor">
        Establece `mode: "local"` y apunta a tu archivo de flujo de trabajo. Aquí tienes un ejemplo mínimo para imágenes:

        ```json5
        {
          models: {
            providers: {
              comfy: {
                mode: "local",
                baseUrl: "http://127.0.0.1:8188",
                image: {
                  workflowPath: "./workflows/flux-api.json",
                  promptNodeId: "6",
                  outputNodeId: "9",
                },
              },
            },
          },
        }
        ```
      </Step>
      <Step title="Establecer el modelo predeterminado">
        Haz que OpenClaw apunte al modelo `comfy/workflow` para la capacidad que configuraste:

        ```json5
        {
          agents: {
            defaults: {
              imageGenerationModel: {
                primary: "comfy/workflow",
              },
            },
          },
        }
        ```
      </Step>
      <Step title="Verificar">
        ```bash
        openclaw models list --provider comfy
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Comfy Cloud">
    **Ideal para:** ejecutar flujos de trabajo en Comfy Cloud sin gestionar recursos GPU locales.

    <Steps>
      <Step title="Obtener una clave API">
        Regístrate en [comfy.org](https://comfy.org) y genera una clave API desde el panel de tu cuenta.
      </Step>
      <Step title="Establecer la clave API">
        Proporciona tu clave mediante uno de estos métodos:

        ```bash
        # Environment variable (preferred)
        export COMFY_API_KEY="your-key"

        # Alternative environment variable
        export COMFY_CLOUD_API_KEY="your-key"

        # Or inline in config
        openclaw config set models.providers.comfy.apiKey "your-key"
        ```
      </Step>
      <Step title="Preparar tu JSON de flujo de trabajo">
        Exporta o crea un archivo JSON de flujo de trabajo de ComfyUI. Anota los IDs de nodo para el nodo de entrada del prompt y el nodo de salida.
      </Step>
      <Step title="Configurar el proveedor">
        Establece `mode: "cloud"` y apunta a tu archivo de flujo de trabajo:

        ```json5
        {
          models: {
            providers: {
              comfy: {
                mode: "cloud",
                image: {
                  workflowPath: "./workflows/flux-api.json",
                  promptNodeId: "6",
                  outputNodeId: "9",
                },
              },
            },
          },
        }
        ```

        <Tip>
        El modo cloud usa por defecto `baseUrl` en `https://cloud.comfy.org`. Solo necesitas establecer `baseUrl` si usas un endpoint cloud personalizado.
        </Tip>
      </Step>
      <Step title="Establecer el modelo predeterminado">
        ```json5
        {
          agents: {
            defaults: {
              imageGenerationModel: {
                primary: "comfy/workflow",
              },
            },
          },
        }
        ```
      </Step>
      <Step title="Verificar">
        ```bash
        openclaw models list --provider comfy
        ```
      </Step>
    </Steps>

  </Tab>
</Tabs>

## Configuración

Comfy admite ajustes de conexión compartidos de nivel superior más secciones de flujo de trabajo por capacidad (`image`, `video`, `music`):

```json5
{
  models: {
    providers: {
      comfy: {
        mode: "local",
        baseUrl: "http://127.0.0.1:8188",
        image: {
          workflowPath: "./workflows/flux-api.json",
          promptNodeId: "6",
          outputNodeId: "9",
        },
        video: {
          workflowPath: "./workflows/video-api.json",
          promptNodeId: "12",
          outputNodeId: "21",
        },
        music: {
          workflowPath: "./workflows/music-api.json",
          promptNodeId: "3",
          outputNodeId: "18",
        },
      },
    },
  },
}
```

### Claves compartidas

| Clave | Tipo | Descripción |
| --------------------- | ---------------------- | ------------------------------------------------------------------------------------- |
| `mode` | `"local"` o `"cloud"` | Modo de conexión. |
| `baseUrl` | string | Valor predeterminado: `http://127.0.0.1:8188` para local o `https://cloud.comfy.org` para cloud. |
| `apiKey` | string | Clave en línea opcional, alternativa a las variables de entorno `COMFY_API_KEY` / `COMFY_CLOUD_API_KEY`. |
| `allowPrivateNetwork` | boolean | Permite un `baseUrl` privado/LAN en modo cloud. |

### Claves por capacidad

Estas claves se aplican dentro de las secciones `image`, `video` o `music`:

| Clave | Obligatoria | Predeterminado | Descripción |
| ---------------------------- | -------- | -------- | ---------------------------------------------------------------------------- |
| `workflow` o `workflowPath` | Sí | -- | Ruta al archivo JSON del flujo de trabajo de ComfyUI. |
| `promptNodeId` | Sí | -- | ID del nodo que recibe el prompt de texto. |
| `promptInputName` | No | `"text"` | Nombre de entrada en el nodo del prompt. |
| `outputNodeId` | No | -- | ID del nodo del que leer la salida. Si se omite, se usan todos los nodos de salida coincidentes. |
| `pollIntervalMs` | No | -- | Intervalo de sondeo en milisegundos para la finalización del trabajo. |
| `timeoutMs` | No | -- | Tiempo de espera en milisegundos para la ejecución del flujo de trabajo. |

Las secciones `image` y `video` también admiten:

| Clave | Obligatoria | Predeterminado | Descripción |
| --------------------- | ------------------------------------ | --------- | --------------------------------------------------- |
| `inputImageNodeId` | Sí (cuando se pasa una imagen de referencia) | -- | ID del nodo que recibe la imagen de referencia subida. |
| `inputImageInputName` | No | `"image"` | Nombre de entrada en el nodo de imagen. |

## Detalles del flujo de trabajo

<AccordionGroup>
  <Accordion title="Flujos de trabajo de imagen">
    Establece el modelo de imagen predeterminado en `comfy/workflow`:

    ```json5
    {
      agents: {
        defaults: {
          imageGenerationModel: {
            primary: "comfy/workflow",
          },
        },
      },
    }
    ```

    **Ejemplo de edición con imagen de referencia:**

    Para habilitar la edición de imágenes con una imagen de referencia subida, agrega `inputImageNodeId` a tu configuración de imagen:

    ```json5
    {
      models: {
        providers: {
          comfy: {
            image: {
              workflowPath: "./workflows/edit-api.json",
              promptNodeId: "6",
              inputImageNodeId: "7",
              inputImageInputName: "image",
              outputNodeId: "9",
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Flujos de trabajo de video">
    Establece el modelo de video predeterminado en `comfy/workflow`:

    ```json5
    {
      agents: {
        defaults: {
          videoGenerationModel: {
            primary: "comfy/workflow",
          },
        },
      },
    }
    ```

    Los flujos de trabajo de video de Comfy admiten texto a video e imagen a video mediante el grafo configurado.

    <Note>
    OpenClaw no pasa videos de entrada a los flujos de trabajo de Comfy. Solo se admiten como entradas prompts de texto e imágenes de referencia individuales.
    </Note>

  </Accordion>

  <Accordion title="Flujos de trabajo de música">
    El Plugin incluido registra un proveedor de generación musical para salidas de audio o música definidas por flujo de trabajo, expuesto mediante la herramienta compartida `music_generate`:

    ```text
    /tool music_generate prompt="Warm ambient synth loop with soft tape texture"
    ```

    Usa la sección de configuración `music` para apuntar a tu JSON de flujo de trabajo de audio y al nodo de salida.

  </Accordion>

  <Accordion title="Compatibilidad hacia atrás">
    La configuración de imagen heredada de nivel superior (sin la sección anidada `image`) sigue funcionando:

    ```json5
    {
      models: {
        providers: {
          comfy: {
            workflowPath: "./workflows/flux-api.json",
            promptNodeId: "6",
            outputNodeId: "9",
          },
        },
      },
    }
    ```

    OpenClaw trata esa forma heredada como la configuración del flujo de trabajo de imagen. No necesitas migrar inmediatamente, pero las secciones anidadas `image` / `video` / `music` son recomendables para configuraciones nuevas.

    <Tip>
    Si solo usas generación de imágenes, la configuración heredada plana y la nueva sección anidada `image` son funcionalmente equivalentes.
    </Tip>

  </Accordion>

  <Accordion title="Pruebas en vivo">
    Existe cobertura en vivo opt-in para el Plugin incluido:

    ```bash
    OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts
    ```

    La prueba en vivo omite los casos individuales de imagen, video o música a menos que esté configurada la sección correspondiente del flujo de trabajo de Comfy.

  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Generación de imágenes" href="/es/tools/image-generation" icon="image">
    Configuración y uso de la herramienta de generación de imágenes.
  </Card>
  <Card title="Generación de video" href="/es/tools/video-generation" icon="video">
    Configuración y uso de la herramienta de generación de video.
  </Card>
  <Card title="Generación de música" href="/es/tools/music-generation" icon="music">
    Configuración de la herramienta de generación de música y audio.
  </Card>
  <Card title="Directorio de proveedores" href="/es/providers/index" icon="layers">
    Resumen de todos los proveedores y referencias de modelos.
  </Card>
  <Card title="Referencia de configuración" href="/es/gateway/config-agents#agent-defaults" icon="gear">
    Referencia completa de configuración, incluidos los valores predeterminados del agente.
  </Card>
</CardGroup>
