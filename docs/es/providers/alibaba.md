---
read_when:
    - Quieres usar la generación de videos de Alibaba Wan en OpenClaw
    - Necesitas configurar una clave de API de Model Studio o DashScope para generar vídeos.
summary: Generación de vídeo con Wan de Alibaba Model Studio en OpenClaw
title: Alibaba Model Studio
x-i18n:
    generated_at: "2026-07-11T23:25:35Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cb74e2361500ccfbc5d3c4f2d08c3b62aacba8c79c704570952e2181abacf9fb
    source_path: providers/alibaba.md
    workflow: 16
---

El plugin `alibaba` incluido registra un proveedor de generación de vídeo para los modelos Wan en Alibaba Model Studio (el nombre internacional de DashScope). Está habilitado de forma predeterminada; solo se necesita una clave de API.

| Propiedad                  | Valor                                                                           |
| -------------------------- | ------------------------------------------------------------------------------- |
| Id. del proveedor          | `alibaba`                                                                       |
| Plugin                     | incluido, `enabledByDefault: true`                                               |
| Variables de entorno de autenticación | `MODELSTUDIO_API_KEY` → `DASHSCOPE_API_KEY` → `QWEN_API_KEY` (se usa la primera coincidencia) |
| Opción de incorporación    | `--auth-choice alibaba-model-studio-api-key`                                    |
| Opción directa de la CLI   | `--alibaba-model-studio-api-key <key>`                                          |
| Modelo predeterminado      | `alibaba/wan2.6-t2v`                                                            |
| URL base predeterminada    | `https://dashscope-intl.aliyuncs.com`                                           |

## Primeros pasos

<Steps>
  <Step title="Configurar una clave de API">
    Almacene la clave para el proveedor `alibaba` mediante la incorporación:

    ```bash
    openclaw onboard --auth-choice alibaba-model-studio-api-key
    ```

    O proporcione la clave directamente:

    ```bash
    openclaw onboard --alibaba-model-studio-api-key <your-key>
    ```

    O exporte una de las variables de entorno aceptadas antes de iniciar el Gateway:

    ```bash
    export MODELSTUDIO_API_KEY=sk-...
    # o DASHSCOPE_API_KEY=...
    # o QWEN_API_KEY=...
    ```

  </Step>
  <Step title="Configurar un modelo de vídeo predeterminado">
    ```json5
    {
      agents: {
        defaults: {
          videoGenerationModel: {
            primary: "alibaba/wan2.6-t2v",
          },
        },
      },
    }
    ```
  </Step>
  <Step title="Verificar que el proveedor esté configurado">
    ```bash
    openclaw models list --provider alibaba
    ```

    La lista incluye los cinco modelos Wan incluidos. Si no se puede resolver `MODELSTUDIO_API_KEY`, `openclaw models status --json` informa de la credencial que falta en `auth.unusableProfiles`.

  </Step>
</Steps>

<Note>
  Tanto el plugin de Alibaba como el [plugin de Qwen](/es/providers/qwen) se autentican mediante DashScope y aceptan variables de entorno coincidentes. Use identificadores de modelo `alibaba/...` para la interfaz específica de vídeo de Wan; use identificadores `qwen/...` para chat, incrustaciones o comprensión multimedia de Qwen.
</Note>

## Modelos Wan integrados

| Referencia del modelo      | Modo                              |
| -------------------------- | --------------------------------- |
| `alibaba/wan2.6-t2v`       | Texto a vídeo (predeterminado)    |
| `alibaba/wan2.6-i2v`       | Imagen a vídeo                    |
| `alibaba/wan2.6-r2v`       | Referencia a vídeo                |
| `alibaba/wan2.6-r2v-flash` | Referencia a vídeo (rápido)       |
| `alibaba/wan2.7-r2v`       | Referencia a vídeo                |

## Capacidades y límites

Los tres modos comparten el mismo límite de cantidad y duración de vídeos por solicitud; solo difiere la estructura de entrada.

| Modo                | Máx. de vídeos de salida | Máx. de imágenes de entrada | Máx. de vídeos de entrada | Duración máxima | Controles compatibles                                      |
| ------------------- | ------------------------ | --------------------------- | ------------------------- | --------------- | ---------------------------------------------------------- |
| Texto a vídeo       | 1                        | no aplicable                | no aplicable              | 10 s            | `size`, `aspectRatio`, `resolution`, `audio`, `watermark` |
| Imagen a vídeo      | 1                        | 1                           | no aplicable              | 10 s            | `size`, `aspectRatio`, `resolution`, `audio`, `watermark` |
| Referencia a vídeo  | 1                        | no aplicable                | 4                         | 10 s            | `size`, `aspectRatio`, `resolution`, `audio`, `watermark` |

Una solicitud que omita `durationSeconds` usa el valor predeterminado aceptado por DashScope de **5 segundos**. Establezca explícitamente `durationSeconds` en la [herramienta de generación de vídeo](/es/tools/video-generation) para ampliarlo hasta 10 s.

<Warning>
  Las entradas de imágenes y vídeos de referencia deben ser URL `http(s)` remotas; los modos de referencia de DashScope rechazan las rutas de archivos locales. Primero cargue los archivos en un almacenamiento de objetos o use el flujo de la [herramienta multimedia](/es/tools/media-overview), que ya genera una URL pública.
</Warning>

## Configuración avanzada

<AccordionGroup>
  <Accordion title="Sobrescribir la URL base de DashScope">
    El proveedor utiliza de forma predeterminada el endpoint internacional de DashScope. Para usar el endpoint de la región de China:

    ```json5
    {
      models: {
        providers: {
          alibaba: {
            baseUrl: "https://dashscope.aliyuncs.com",
          },
        },
      },
    }
    ```

    El proveedor elimina las barras diagonales finales antes de construir las URL de tareas de AIGC.

  </Accordion>

  <Accordion title="Prioridad de las variables de entorno de autenticación">
    OpenClaw resuelve la clave de API de Alibaba a partir de las variables de entorno en este orden y utiliza el primer valor no vacío:

    1. `MODELSTUDIO_API_KEY`
    2. `DASHSCOPE_API_KEY`
    3. `QWEN_API_KEY`

    Las entradas configuradas en `auth.profiles` (establecidas mediante `openclaw models auth login`) tienen prioridad sobre la resolución de variables de entorno. Consulte [Perfiles de autenticación en las preguntas frecuentes sobre modelos](/es/help/faq-models#auth-profiles-what-they-are-and-how-to-manage-them) para obtener información sobre la rotación de perfiles, los períodos de espera y los mecanismos de anulación.

  </Accordion>

  <Accordion title="Relación con el plugin de Qwen">
    Ambos plugins incluidos se comunican con DashScope y aceptan claves de API coincidentes. Use:

    - Identificadores `alibaba/wan*.*` para el proveedor específico de vídeo de Wan documentado en esta página.
    - Identificadores `qwen/*` para el chat, las incrustaciones y la comprensión multimedia de Qwen (consulte [Qwen](/es/providers/qwen)).

    Configurar `MODELSTUDIO_API_KEY` una sola vez autentica ambos plugins, ya que la lista de variables de entorno de autenticación coincide intencionadamente; no es necesario incorporar cada plugin por separado.

  </Accordion>
</AccordionGroup>

## Contenido relacionado

<CardGroup cols={2}>
  <Card title="Generación de vídeo" href="/es/tools/video-generation" icon="video">
    Parámetros compartidos de la herramienta de vídeo y selección del proveedor.
  </Card>
  <Card title="Qwen" href="/es/providers/qwen" icon="microchip">
    Configuración del chat, las incrustaciones y la comprensión multimedia de Qwen con la misma autenticación de DashScope.
  </Card>
  <Card title="Referencia de configuración" href="/es/gateway/config-agents#agent-defaults" icon="gear">
    Valores predeterminados del agente y configuración del modelo.
  </Card>
  <Card title="Preguntas frecuentes sobre modelos" href="/es/help/faq-models" icon="circle-question">
    Perfiles de autenticación, cambio de modelos y resolución de errores de «no hay perfil».
  </Card>
</CardGroup>
