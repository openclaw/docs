---
read_when:
    - Quieres usar flujos de trabajo locales de ComfyUI con OpenClaw
    - Quieres usar Comfy Cloud con flujos de trabajo de imagen, vídeo o música
    - Necesitas las claves de configuración del plugin comfy incluido
summary: Configuración del flujo de trabajo de ComfyUI para generar imágenes, vídeos y música en OpenClaw
title: ComfyUI
x-i18n:
    generated_at: "2026-07-11T23:26:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 74150d202a422de8e0f4b2b82d5d12bd42eb46991e8ef688832208e1a2ff7793
    source_path: providers/comfy.md
    workflow: 16
---

OpenClaw incluye un plugin `comfy` integrado para ejecutar ComfyUI mediante flujos de trabajo. El
plugin se controla por completo mediante flujos de trabajo: OpenClaw no asigna controles genéricos de `size`,
`aspectRatio`, `resolution`, `durationSeconds` ni controles similares a los de TTS
a tu grafo.

| Propiedad             | Detalle                                                                                         |
| --------------------- | ----------------------------------------------------------------------------------------------- |
| Proveedor             | `comfy`                                                                                         |
| Modelo                | `comfy/workflow`                                                                                |
| Herramientas compartidas | `image_generate`, `video_generate`, `music_generate`                                          |
| Autenticación         | Ninguna para ComfyUI local; `COMFY_API_KEY` o `COMFY_CLOUD_API_KEY` para Comfy Cloud             |
| API                   | ComfyUI `/prompt` / `/history` / `/view`; Comfy Cloud `/api/*`                                  |

## Funcionalidades compatibles

- Generación y edición de imágenes mediante un JSON de flujo de trabajo (la edición admite 1 imagen de referencia subida)
- Generación de vídeo mediante un JSON de flujo de trabajo, de texto a vídeo o de imagen a vídeo (1 imagen de referencia)
- Generación de música/audio mediante la herramienta compartida `music_generate`, con 1 imagen de referencia opcional
- Descarga del resultado desde un Node configurado o desde todos los Nodes de salida coincidentes cuando no se configura ninguno

## Primeros pasos

Elige entre ejecutar ComfyUI en tu propio equipo o usar Comfy Cloud.

<Tabs>
  <Tab title="Local">
    **Opción recomendada para:** ejecutar tu propia instancia de ComfyUI en tu equipo o LAN.

    <Steps>
      <Step title="Iniciar ComfyUI localmente">
        Asegúrate de que tu instancia local de ComfyUI esté en ejecución (el valor predeterminado es `http://127.0.0.1:8188`).
      </Step>
      <Step title="Preparar el JSON del flujo de trabajo">
        Exporta o crea un archivo JSON de flujo de trabajo de ComfyUI. Anota los identificadores de Node correspondientes al Node de entrada de la instrucción y al Node de salida que quieras que OpenClaw lea.
      </Step>
      <Step title="Configurar el proveedor">
        Establece `mode: "local"` e indica tu archivo de flujo de trabajo. Ejemplo mínimo para imágenes:

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
      <Step title="Establecer el modelo predeterminado">
        Configura OpenClaw para que use el modelo `comfy/workflow` con la funcionalidad que hayas configurado:

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
    **Opción recomendada para:** ejecutar flujos de trabajo en Comfy Cloud sin administrar recursos de GPU locales.

    <Steps>
      <Step title="Obtener una clave de API">
        Regístrate en [comfy.org](https://comfy.org) y genera una clave de API desde el panel de tu cuenta.
      </Step>
      <Step title="Establecer la clave de API">
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
      <Step title="Preparar el JSON del flujo de trabajo">
        Exporta o crea un archivo JSON de flujo de trabajo de ComfyUI. Anota los identificadores de Node correspondientes al Node de entrada de la instrucción y al Node de salida.
      </Step>
      <Step title="Configurar el proveedor">
        Establece `mode: "cloud"` e indica tu archivo de flujo de trabajo:

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
        En el modo de nube, el valor predeterminado de `baseUrl` es `https://cloud.comfy.org`. Establece `baseUrl` únicamente para un extremo de nube personalizado.
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

Comfy admite opciones de conexión compartidas de nivel superior y secciones de flujo de trabajo para cada funcionalidad (`image`, `video`, `music`):

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

| Clave                 | Tipo                   | Descripción                                                                                       |
| --------------------- | ---------------------- | ------------------------------------------------------------------------------------------------- |
| `mode`                | `"local"` o `"cloud"`  | Modo de conexión. El valor predeterminado es `"local"`.                                           |
| `baseUrl`             | cadena                 | El valor predeterminado es `http://127.0.0.1:8188` para el modo local o `https://cloud.comfy.org` para la nube. |
| `apiKey`              | cadena                 | Clave insertada opcional, alternativa a las variables de entorno `COMFY_API_KEY` / `COMFY_CLOUD_API_KEY`. |
| `allowPrivateNetwork` | booleano               | Permite una `baseUrl` privada/de LAN en modo de nube o un FQDN DNS privado local.                 |

<Note>
En el modo `local`, las direcciones IP literales de bucle local/privadas y los nombres de servicio de una sola etiqueta, como `http://comfyui:8188`, funcionan sin `allowPrivateNetwork`. Los FQDN DNS privados que parecen públicos, como `https://comfy.local.example.com`, requieren `allowPrivateNetwork: true`. La confianza del origen privado permanece limitada al esquema, nombre de host y puerto configurados; las redirecciones locales no pueden salir del nombre de host configurado, mientras que las redirecciones de la nube hacia CDN públicas se comprueban con la política SSRF predeterminada.
</Note>

### Claves por funcionalidad

Estas claves se aplican dentro de las secciones `image`, `video` o `music`:

| Clave                        | Obligatoria | Valor predeterminado | Descripción                                                                      |
| ---------------------------- | ----------- | -------------------- | -------------------------------------------------------------------------------- |
| `workflow` o `workflowPath`  | Sí          | --                   | JSON del flujo de trabajo insertado o ruta al archivo JSON del flujo de trabajo de ComfyUI. |
| `promptNodeId`               | Sí          | --                   | Identificador del Node que recibe la instrucción de texto.                       |
| `promptInputName`            | No          | `"text"`             | Nombre de la entrada en el Node de la instrucción.                               |
| `outputNodeId`               | No          | --                   | Identificador del Node desde el que se lee el resultado. Si se omite, se usan todos los Nodes de salida coincidentes. |
| `pollIntervalMs`             | No          | `1500`               | Intervalo de sondeo en milisegundos para determinar la finalización del trabajo. |
| `timeoutMs`                  | No          | `300000`             | Tiempo de espera en milisegundos para la ejecución del flujo de trabajo.         |

Las secciones `image` y `video` también admiten un Node de entrada para una imagen de referencia:

| Clave                 | Obligatoria                                      | Valor predeterminado | Descripción                                                        |
| --------------------- | ------------------------------------------------ | -------------------- | ------------------------------------------------------------------ |
| `inputImageNodeId`    | Sí (cuando se proporciona una imagen de referencia) | --                | Identificador del Node que recibe la imagen de referencia subida.  |
| `inputImageInputName` | No                                               | `"image"`            | Nombre de la entrada en el Node de imagen.                          |

`apiKey` acepta una cadena literal o un objeto de [referencia de secreto](/es/gateway/configuration-reference#secrets).

## Detalles del flujo de trabajo

<AccordionGroup>
  <Accordion title="Flujos de trabajo de imágenes">
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

    **Ejemplo de edición con una imagen de referencia:**

    Para habilitar la edición de imágenes con una imagen de referencia subida, añade `inputImageNodeId` a la configuración de imágenes:

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

  <Accordion title="Flujos de trabajo de vídeo">
    Establece el modelo de vídeo predeterminado en `comfy/workflow`:

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

    Los flujos de trabajo de vídeo de Comfy admiten la conversión de texto a vídeo y de imagen a vídeo mediante el grafo configurado.

    <Note>
    OpenClaw no proporciona vídeos de entrada a los flujos de trabajo de Comfy. Solo se admiten como entradas las instrucciones de texto y una única imagen de referencia.
    </Note>

  </Accordion>

  <Accordion title="Flujos de trabajo de música">
    El plugin integrado registra un proveedor de generación de música para resultados de audio o música definidos por el flujo de trabajo, disponible mediante la herramienta compartida `music_generate`. Admite una imagen de referencia opcional (como máximo 1):

    ```text
    /tool music_generate prompt="Warm ambient synth loop with soft tape texture"
    ```

    Usa la sección de configuración `music` para indicar el JSON de tu flujo de trabajo de audio y el Node de salida.

  </Accordion>

  <Accordion title="Compatibilidad con versiones anteriores">
    La configuración de imágenes de nivel superior existente (sin la sección `image` anidada) sigue funcionando:

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

    OpenClaw trata esa estructura heredada como la configuración del flujo de trabajo de imágenes. No necesitas migrarla de inmediato, pero se recomiendan las secciones anidadas `image` / `video` / `music` para las configuraciones nuevas. Si solo usas la generación de imágenes, la configuración plana heredada y la nueva sección `image` anidada son funcionalmente equivalentes.

  </Accordion>

  <Accordion title="Pruebas en vivo">
    El plugin integrado dispone de cobertura en vivo opcional:

    ```bash
    OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts
    ```

    La prueba en vivo omite los casos individuales de imagen, vídeo o música, a menos que esté configurada la sección correspondiente del flujo de trabajo de Comfy.

  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Generación de imágenes" href="/es/tools/image-generation" icon="image">
    Configuración y uso de la herramienta de generación de imágenes.
  </Card>
  <Card title="Generación de vídeos" href="/es/tools/video-generation" icon="video">
    Configuración y uso de la herramienta de generación de vídeos.
  </Card>
  <Card title="Generación de música" href="/es/tools/music-generation" icon="music">
    Configuración de la herramienta de generación de música y audio.
  </Card>
  <Card title="Directorio de proveedores" href="/es/providers/index" icon="layers">
    Descripción general de todos los proveedores y referencias de modelos.
  </Card>
  <Card title="Referencia de configuración" href="/es/gateway/config-agents#agent-defaults" icon="gear">
    Referencia completa de configuración, incluidos los valores predeterminados de los agentes.
  </Card>
</CardGroup>
