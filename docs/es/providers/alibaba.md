---
read_when:
    - Quieres usar la generación de video de Alibaba Wan en OpenClaw
    - Necesitas configurar una clave de API de Model Studio o DashScope para la generación de video
summary: Generación de video con Alibaba Model Studio Wan en OpenClaw
title: Alibaba Model Studio
x-i18n:
    generated_at: "2026-07-05T11:35:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cb74e2361500ccfbc5d3c4f2d08c3b62aacba8c79c704570952e2181abacf9fb
    source_path: providers/alibaba.md
    workflow: 16
---

El plugin `alibaba` incluido registra un proveedor de generación de video para modelos Wan en Alibaba Model Studio (el nombre internacional de DashScope). Está habilitado de forma predeterminada; solo se necesita una clave de API.

| Propiedad        | Valor                                                                           |
| ---------------- | ------------------------------------------------------------------------------- |
| Id. de proveedor | `alibaba`                                                                       |
| Plugin           | incluido, `enabledByDefault: true`                                              |
| Variables env. de autenticación | `MODELSTUDIO_API_KEY` → `DASHSCOPE_API_KEY` → `QWEN_API_KEY` (gana la primera coincidencia) |
| Marca de incorporación | `--auth-choice alibaba-model-studio-api-key`                                    |
| Marca directa de CLI | `--alibaba-model-studio-api-key <key>`                                          |
| Modelo predeterminado | `alibaba/wan2.6-t2v`                                                            |
| URL base predeterminada | `https://dashscope-intl.aliyuncs.com`                                           |

## Primeros pasos

<Steps>
  <Step title="Configura una clave de API">
    Guarda la clave para el proveedor `alibaba` mediante la incorporación:

    ```bash
    openclaw onboard --auth-choice alibaba-model-studio-api-key
    ```

    O pasa la clave directamente:

    ```bash
    openclaw onboard --alibaba-model-studio-api-key <your-key>
    ```

    O exporta una de las variables env. aceptadas antes de iniciar el Gateway:

    ```bash
    export MODELSTUDIO_API_KEY=sk-...
    # or DASHSCOPE_API_KEY=...
    # or QWEN_API_KEY=...
    ```

  </Step>
  <Step title="Configura un modelo de video predeterminado">
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
  <Step title="Verifica que el proveedor esté configurado">
    ```bash
    openclaw models list --provider alibaba
    ```

    La lista incluye los cinco modelos Wan incluidos. Si `MODELSTUDIO_API_KEY` no se puede resolver, `openclaw models status --json` informa la credencial faltante en `auth.unusableProfiles`.

  </Step>
</Steps>

<Note>
  El Plugin Alibaba y el [Plugin Qwen](/es/providers/qwen) se autentican contra DashScope y aceptan variables env. superpuestas. Usa ids de modelo `alibaba/...` para la superficie de video Wan dedicada; usa ids `qwen/...` para chat, embeddings o comprensión de medios de Qwen.
</Note>

## Modelos Wan integrados

| Ref. de modelo             | Modo                      |
| -------------------------- | ------------------------- |
| `alibaba/wan2.6-t2v`       | Texto a video (predeterminado) |
| `alibaba/wan2.6-i2v`       | Imagen a video            |
| `alibaba/wan2.6-r2v`       | Referencia a video        |
| `alibaba/wan2.6-r2v-flash` | Referencia a video (rápido) |
| `alibaba/wan2.7-r2v`       | Referencia a video        |

## Capacidades y límites

Los tres modos comparten el mismo recuento de videos por solicitud y el mismo límite de duración; solo difiere la forma de entrada.

| Modo               | Videos de salida máx. | Imágenes de entrada máx. | Videos de entrada máx. | Duración máx. | Controles admitidos                                      |
| ------------------ | --------------------- | ------------------------ | ---------------------- | ------------- | -------------------------------------------------------- |
| Texto a video      | 1                     | n/a                      | n/a                    | 10 s          | `size`, `aspectRatio`, `resolution`, `audio`, `watermark` |
| Imagen a video     | 1                     | 1                        | n/a                    | 10 s          | `size`, `aspectRatio`, `resolution`, `audio`, `watermark` |
| Referencia a video | 1                     | n/a                      | 4                      | 10 s          | `size`, `aspectRatio`, `resolution`, `audio`, `watermark` |

Una solicitud que omite `durationSeconds` obtiene el valor predeterminado aceptado por DashScope de **5 segundos**. Define `durationSeconds` explícitamente en la [herramienta de generación de video](/es/tools/video-generation) para extenderlo hasta 10 s.

<Warning>
  Las entradas de imagen y video de referencia deben ser URL remotas `http(s)`; los modos de referencia de DashScope rechazan rutas de archivos locales. Súbelas primero a un almacenamiento de objetos, o usa el flujo de la [herramienta de medios](/es/tools/media-overview), que ya produce una URL pública.
</Warning>

## Configuración avanzada

<AccordionGroup>
  <Accordion title="Sobrescribe la URL base de DashScope">
    El proveedor usa de forma predeterminada el endpoint internacional de DashScope. Para apuntar al endpoint de la región de China:

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

    El proveedor elimina las barras finales antes de construir las URL de tareas AIGC.

  </Accordion>

  <Accordion title="Prioridad de variables env. de autenticación">
    OpenClaw resuelve la clave de API de Alibaba a partir de variables de entorno en este orden, tomando el primer valor no vacío:

    1. `MODELSTUDIO_API_KEY`
    2. `DASHSCOPE_API_KEY`
    3. `QWEN_API_KEY`

    Las entradas `auth.profiles` configuradas (definidas mediante `openclaw models auth login`) sobrescriben la resolución de variables env. Consulta [Perfiles de autenticación en las preguntas frecuentes de modelos](/es/help/faq-models#auth-profiles-what-they-are-and-how-to-manage-them) para conocer la rotación de perfiles, el periodo de espera y los mecanismos de sobrescritura.

  </Accordion>

  <Accordion title="Relación con el Plugin Qwen">
    Ambos plugins incluidos hablan con DashScope y aceptan claves de API superpuestas. Usa:

    - ids `alibaba/wan*.*` para el proveedor de video Wan dedicado documentado en esta página.
    - ids `qwen/*` para chat, embeddings y comprensión de medios de Qwen (consulta [Qwen](/es/providers/qwen)).

    Configurar `MODELSTUDIO_API_KEY` una vez autentica ambos plugins, ya que la lista de variables env. de autenticación se superpone intencionalmente; no es necesario incorporar cada Plugin por separado.

  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Generación de video" href="/es/tools/video-generation" icon="video">
    Parámetros compartidos de la herramienta de video y selección de proveedor.
  </Card>
  <Card title="Qwen" href="/es/providers/qwen" icon="microchip">
    Configuración de chat, embeddings y comprensión de medios de Qwen con la misma autenticación de DashScope.
  </Card>
  <Card title="Referencia de configuración" href="/es/gateway/config-agents#agent-defaults" icon="gear">
    Valores predeterminados de agentes y configuración de modelos.
  </Card>
  <Card title="Preguntas frecuentes sobre modelos" href="/es/help/faq-models" icon="circle-question">
    Perfiles de autenticación, cambio de modelos y resolución de errores de "sin perfil".
  </Card>
</CardGroup>
