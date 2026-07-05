---
read_when:
    - Quieres usar flujos de trabajo locales de ComfyUI con OpenClaw
    - Quieres usar Comfy Cloud con flujos de trabajo de imagen, video o música
    - Necesita las claves de configuración del Plugin comfy incluido
summary: Configuración de generación de imágenes, videos y música con flujos de trabajo de ComfyUI en OpenClaw
title: ComfyUI
x-i18n:
    generated_at: "2026-07-05T11:36:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0602dcad22ed36e8cbf5b04f5098f613d48fcd6af55b0e13804cfeb4533d0247
    source_path: providers/comfy.md
    workflow: 16
---

OpenClaw incluye un plugin `comfy` integrado para ejecuciones de ComfyUI basadas en flujos de trabajo. El
plugin está completamente basado en flujos de trabajo: OpenClaw no asigna controles genéricos `size`,
`aspectRatio`, `resolution`, `durationSeconds` ni controles de estilo TTS a
tu gráfico.

| Propiedad    | Detalle                                                                          |
| ------------ | -------------------------------------------------------------------------------- |
| Proveedor    | `comfy`                                                                          |
| Modelo       | `comfy/workflow`                                                                 |
| Herramientas compartidas | `image_generate`, `video_generate`, `music_generate`                 |
| Autenticación | Ninguna para ComfyUI local; `COMFY_API_KEY` o `COMFY_CLOUD_API_KEY` para Comfy Cloud |
| API          | ComfyUI `/prompt` / `/history` / `/view`; Comfy Cloud `/api/*`                   |

## Qué admite

- Generación y edición de imágenes desde un JSON de flujo de trabajo (la edición toma 1 imagen de referencia subida)
- Generación de video desde un JSON de flujo de trabajo, texto a video o imagen a video (1 imagen de referencia)
- Generación de música/audio mediante la herramienta compartida `music_generate`, con una imagen de referencia opcional
- Descarga de resultados desde un nodo configurado, o desde todos los nodos de salida coincidentes cuando no se configura ninguno

## Primeros pasos

Elige entre ejecutar ComfyUI en tu propia máquina o usar Comfy Cloud.

<Tabs>
  <Tab title="Local">
    **Ideal para:** ejecutar tu propia instancia de ComfyUI en tu máquina o LAN.

    <Steps>
      <Step title="Inicia ComfyUI localmente">
        Asegúrate de que tu instancia local de ComfyUI se esté ejecutando (el valor predeterminado es `http://127.0.0.1:8188`).
      </Step>
      <Step title="Prepara tu JSON de flujo de trabajo">
        Exporta o crea un archivo JSON de flujo de trabajo de ComfyUI. Anota los ID de nodo del nodo de entrada del prompt y del nodo de salida desde el que quieres que OpenClaw lea.
      </Step>
      <Step title="Configura el proveedor">
        Define `mode: "local"` y apunta a tu archivo de flujo de trabajo. Ejemplo mínimo de imagen:

        ```json5
        {
          plugins: {
            entries: {
              comfy: {
                config: {
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
          },
        }
        ```
      </Step>
      <Step title="Establece el modelo predeterminado">
        Apunta OpenClaw al modelo `comfy/workflow` para la capacidad que configuraste:

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
      <Step title="Verifica">
        ```bash
        openclaw models list --provider comfy
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Comfy Cloud">
    **Ideal para:** ejecutar flujos de trabajo en Comfy Cloud sin administrar recursos de GPU locales.

    <Steps>
      <Step title="Obtén una clave de API">
        Regístrate en [comfy.org](https://comfy.org) y genera una clave de API desde el panel de tu cuenta.
      </Step>
      <Step title="Configura la clave de API">
        Proporciona tu clave mediante cualquiera de estos métodos:

        ```bash
        # Onboarding flag
        openclaw onboard --comfy-api-key "your-key"

        # Environment variable (preferred for daemons)
        export COMFY_API_KEY="your-key"

        # Alternative environment variable
        export COMFY_CLOUD_API_KEY="your-key"

        # Or inline in config
        openclaw config set plugins.entries.comfy.config.apiKey "your-key"
        ```
      </Step>
      <Step title="Prepara tu JSON de flujo de trabajo">
        Exporta o crea un archivo JSON de flujo de trabajo de ComfyUI. Anota los ID de nodo del nodo de entrada del prompt y del nodo de salida.
      </Step>
      <Step title="Configura el proveedor">
        Define `mode: "cloud"` y apunta a tu archivo de flujo de trabajo:

        ```json5
        {
          plugins: {
            entries: {
              comfy: {
                config: {
                  mode: "cloud",
                  image: {
                    workflowPath: "./workflows/flux-api.json",
                    promptNodeId: "6",
                    outputNodeId: "9",
                  },
                },
              },
            },
          },
        }
        ```

        <Tip>
        El modo cloud establece `baseUrl` de forma predeterminada en `https://cloud.comfy.org`. Define `baseUrl` solo para un endpoint de cloud personalizado.
        </Tip>
      </Step>
      <Step title="Establece el modelo predeterminado">
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
      <Step title="Verifica">
        ```bash
        openclaw models list --provider comfy
        ```
      </Step>
    </Steps>

  </Tab>
</Tabs>

## Configuración

Comfy admite ajustes de conexión compartidos de nivel superior, además de secciones de flujo de trabajo por capacidad (`image`, `video`, `music`):

```json5
{
  plugins: {
    entries: {
      comfy: {
        config: {
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
  },
}
```

### Claves compartidas

| Clave                 | Tipo                   | Descripción                                                                          |
| --------------------- | ---------------------- | ------------------------------------------------------------------------------------ |
| `mode`                | `"local"` o `"cloud"`  | Modo de conexión. El valor predeterminado es `"local"`.                              |
| `baseUrl`             | string                 | El valor predeterminado es `http://127.0.0.1:8188` para local o `https://cloud.comfy.org` para cloud. |
| `apiKey`              | string                 | Clave insertada opcional, alternativa a las variables de entorno `COMFY_API_KEY` / `COMFY_CLOUD_API_KEY`. |
| `allowPrivateNetwork` | boolean                | Permite un `baseUrl` privado/LAN en modo cloud.                                      |

### Claves por capacidad

Estas claves se aplican dentro de las secciones `image`, `video` o `music`:

| Clave                        | Obligatoria | Predeterminado | Descripción                                                                  |
| ---------------------------- | ----------- | -------------- | ---------------------------------------------------------------------------- |
| `workflow` o `workflowPath`  | Sí          | --             | JSON de flujo de trabajo insertado, o ruta al archivo JSON de flujo de trabajo de ComfyUI. |
| `promptNodeId`               | Sí          | --             | ID de nodo que recibe el prompt de texto.                                    |
| `promptInputName`            | No          | `"text"`       | Nombre de entrada en el nodo de prompt.                                      |
| `outputNodeId`               | No          | --             | ID de nodo desde el que leer la salida. Si se omite, se usan todos los nodos de salida coincidentes. |
| `pollIntervalMs`             | No          | `1500`         | Intervalo de sondeo en milisegundos para la finalización del trabajo.        |
| `timeoutMs`                  | No          | `300000`       | Tiempo de espera en milisegundos para la ejecución del flujo de trabajo.     |

Las secciones `image` y `video` también admiten un nodo de entrada de imagen de referencia:

| Clave                 | Obligatoria                               | Predeterminado | Descripción                                           |
| --------------------- | ----------------------------------------- | -------------- | ----------------------------------------------------- |
| `inputImageNodeId`    | Sí (cuando se pasa una imagen de referencia) | --          | ID de nodo que recibe la imagen de referencia subida. |
| `inputImageInputName` | No                                        | `"image"`      | Nombre de entrada en el nodo de imagen.               |

`apiKey` acepta una cadena literal o un objeto de [referencia de secreto](/es/gateway/configuration-reference#secrets).

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

    Para habilitar la edición de imágenes con una imagen de referencia subida, añade `inputImageNodeId` a tu configuración de imagen:

    ```json5
    {
      plugins: {
        entries: {
          comfy: {
            config: {
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

    Los flujos de trabajo de video de Comfy admiten texto a video e imagen a video mediante el gráfico configurado.

    <Note>
    OpenClaw no pasa videos de entrada a flujos de trabajo de Comfy. Solo se admiten prompts de texto e imágenes de referencia individuales como entradas.
    </Note>

  </Accordion>

  <Accordion title="Flujos de trabajo de música">
    El plugin integrado registra un proveedor de generación de música para salidas de audio o música definidas por flujo de trabajo, expuesto mediante la herramienta compartida `music_generate`. Acepta una imagen de referencia opcional (hasta 1):

    ```text
    /tool music_generate prompt="Warm ambient synth loop with soft tape texture"
    ```

    Usa la sección de configuración `music` para apuntar a tu JSON de flujo de trabajo de audio y al nodo de salida.

  </Accordion>

  <Accordion title="Compatibilidad con versiones anteriores">
    La configuración de imagen de nivel superior existente (sin la sección `image` anidada) sigue funcionando:

    ```json5
    {
      plugins: {
        entries: {
          comfy: {
            config: {
              workflowPath: "./workflows/flux-api.json",
              promptNodeId: "6",
              outputNodeId: "9",
            },
          },
        },
      },
    }
    ```

    OpenClaw trata esa forma heredada como la configuración del flujo de trabajo de imagen. No necesitas migrar de inmediato, pero se recomiendan las secciones anidadas `image` / `video` / `music` para nuevas configuraciones. Si solo usas generación de imágenes, la configuración plana heredada y la nueva sección `image` anidada son funcionalmente equivalentes.

  </Accordion>

  <Accordion title="Pruebas en vivo">
    Existe cobertura en vivo opcional para el plugin integrado:

    ```bash
    OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts
    ```

    La prueba en vivo omite casos individuales de imagen, video o música a menos que la sección de flujo de trabajo de Comfy correspondiente esté configurada.

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
