---
read_when:
    - Quieres usar workflows locales de ComfyUI con OpenClaw
    - Quieres usar Comfy Cloud con workflows de imagen, video o música
    - Necesitas las claves de configuración del plugin comfy incluido
summary: Configuración de generación de imágenes, video y música de workflows de ComfyUI en OpenClaw
title: ComfyUI
x-i18n:
    generated_at: "2026-04-25T13:54:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: 41dda4be24d5b2c283fa499a345cf9f38747ec19b4010163ceffd998307ca086
    source_path: providers/comfy.md
    workflow: 15
    postprocess_version: locale-links-v1
---

OpenClaw incluye un plugin `comfy` integrado para ejecuciones de ComfyUI basadas en workflows. El plugin está completamente impulsado por workflows, por lo que OpenClaw no intenta mapear controles genéricos como `size`, `aspectRatio`, `resolution`, `durationSeconds` o controles de estilo TTS sobre tu grafo.

| Propiedad       | Detalle                                                                          |
| --------------- | -------------------------------------------------------------------------------- |
| Proveedor       | `comfy`                                                                          |
| Modelos         | `comfy/workflow`                                                                 |
| Superficies compartidas | `image_generate`, `video_generate`, `music_generate`                    |
| Autenticación   | Ninguna para ComfyUI local; `COMFY_API_KEY` o `COMFY_CLOUD_API_KEY` para Comfy Cloud |
| API             | ComfyUI `/prompt` / `/history` / `/view` y Comfy Cloud `/api/*`                  |

## Qué admite

- Generación de imágenes a partir de un JSON de workflow
- Edición de imágenes con 1 imagen de referencia subida
- Generación de video a partir de un JSON de workflow
- Generación de video con 1 imagen de referencia subida
- Generación de música o audio mediante la herramienta compartida `music_generate`
- Descarga de salida desde un nodo configurado o desde todos los nodos de salida coincidentes

## Primeros pasos

Elige entre ejecutar ComfyUI en tu propia máquina o usar Comfy Cloud.

<Tabs>
  <Tab title="Local">
    **Ideal para:** ejecutar tu propia instancia de ComfyUI en tu máquina o red LAN.

    <Steps>
      <Step title="Inicia ComfyUI localmente">
        Asegúrate de que tu instancia local de ComfyUI esté en ejecución (usa `http://127.0.0.1:8188` por defecto).
      </Step>
      <Step title="Prepara tu JSON de workflow">
        Exporta o crea un archivo JSON de workflow de ComfyUI. Toma nota de los ID de nodo del nodo de entrada del prompt y del nodo de salida del que quieres que OpenClaw lea.
      </Step>
      <Step title="Configura el proveedor">
        Establece `mode: "local"` y apunta a tu archivo de workflow. Aquí tienes un ejemplo mínimo de imagen:

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
    **Ideal para:** ejecutar workflows en Comfy Cloud sin administrar recursos locales de GPU.

    <Steps>
      <Step title="Obtén una API key">
        Regístrate en [comfy.org](https://comfy.org) y genera una API key desde el panel de tu cuenta.
      </Step>
      <Step title="Establece la API key">
        Proporciona tu clave mediante uno de estos métodos:

        ```bash
        # Variable de entorno (preferida)
        export COMFY_API_KEY="your-key"

        # Variable de entorno alternativa
        export COMFY_CLOUD_API_KEY="your-key"

        # O en línea dentro de la configuración
        openclaw config set plugins.entries.comfy.config.apiKey "your-key"
        ```
      </Step>
      <Step title="Prepara tu JSON de workflow">
        Exporta o crea un archivo JSON de workflow de ComfyUI. Toma nota de los ID de nodo del nodo de entrada del prompt y del nodo de salida.
      </Step>
      <Step title="Configura el proveedor">
        Establece `mode: "cloud"` y apunta a tu archivo de workflow:

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
        El modo cloud usa `https://cloud.comfy.org` como `baseUrl` por defecto. Solo necesitas establecer `baseUrl` si usas un endpoint cloud personalizado.
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

Comfy admite ajustes compartidos de conexión de nivel superior además de secciones de workflow por capacidad (`image`, `video`, `music`):

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
| `mode`                | `"local"` o `"cloud"`  | Modo de conexión.                                                                    |
| `baseUrl`             | string                 | Usa `http://127.0.0.1:8188` por defecto para local o `https://cloud.comfy.org` para cloud. |
| `apiKey`              | string                 | Clave en línea opcional, alternativa a las variables de entorno `COMFY_API_KEY` / `COMFY_CLOUD_API_KEY`. |
| `allowPrivateNetwork` | boolean                | Permite un `baseUrl` privado/LAN en modo cloud.                                      |

### Claves por capacidad

Estas claves se aplican dentro de las secciones `image`, `video` o `music`:

| Clave                        | Obligatoria | Predeterminado | Descripción                                                                |
| ---------------------------- | ----------- | -------------- | -------------------------------------------------------------------------- |
| `workflow` o `workflowPath`  | Sí          | --             | Ruta al archivo JSON del workflow de ComfyUI.                              |
| `promptNodeId`               | Sí          | --             | ID del nodo que recibe el prompt de texto.                                 |
| `promptInputName`            | No          | `"text"`       | Nombre de entrada en el nodo del prompt.                                   |
| `outputNodeId`               | No          | --             | ID del nodo del que leer la salida. Si se omite, se usan todos los nodos de salida coincidentes. |
| `pollIntervalMs`             | No          | --             | Intervalo de sondeo en milisegundos para la finalización del trabajo.      |
| `timeoutMs`                  | No          | --             | Tiempo de espera en milisegundos para la ejecución del workflow.           |

Las secciones `image` y `video` también admiten:

| Clave                 | Obligatoria                          | Predeterminado | Descripción                                          |
| --------------------- | ------------------------------------ | -------------- | ---------------------------------------------------- |
| `inputImageNodeId`    | Sí (cuando se pasa una imagen de referencia) | --       | ID del nodo que recibe la imagen de referencia subida. |
| `inputImageInputName` | No                                   | `"image"`      | Nombre de entrada en el nodo de imagen.              |

## Detalles del workflow

<AccordionGroup>
  <Accordion title="Workflows de imagen">
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

  <Accordion title="Workflows de video">
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

    Los workflows de video de Comfy admiten texto a video e imagen a video mediante el grafo configurado.

    <Note>
    OpenClaw no pasa videos de entrada a los workflows de Comfy. Solo se admiten prompts de texto e imágenes de referencia únicas como entradas.
    </Note>

  </Accordion>

  <Accordion title="Workflows de música">
    El plugin integrado registra un proveedor de generación de música para salidas de audio o música definidas por workflow, expuesto a través de la herramienta compartida `music_generate`:

    ```text
    /tool music_generate prompt="Warm ambient synth loop with soft tape texture"
    ```

    Usa la sección de configuración `music` para apuntar al JSON de tu workflow de audio y al nodo de salida.

  </Accordion>

  <Accordion title="Compatibilidad con versiones anteriores">
    La configuración de imagen existente de nivel superior (sin la sección `image` anidada) sigue funcionando:

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

    OpenClaw trata esa estructura heredada como la configuración del workflow de imagen. No necesitas migrar de inmediato, pero se recomiendan las secciones anidadas `image` / `video` / `music` para configuraciones nuevas.

    <Tip>
    Si solo usas generación de imágenes, la configuración plana heredada y la nueva sección `image` anidada son funcionalmente equivalentes.
    </Tip>

  </Accordion>

  <Accordion title="Pruebas en vivo">
    Existe cobertura en vivo opcional para el plugin integrado:

    ```bash
    OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts
    ```

    La prueba en vivo omite casos individuales de imagen, video o música a menos que la sección correspondiente del workflow de Comfy esté configurada.

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
