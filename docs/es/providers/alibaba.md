---
read_when:
    - Quieres usar la generación de video Wan de Alibaba en OpenClaw
    - Necesitas configurar una API key de Model Studio o DashScope para la generación de video
summary: Generación de video de Alibaba Model Studio Wan en OpenClaw
title: Alibaba Model Studio
x-i18n:
    generated_at: "2026-04-12T23:29:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: a6e97d929952cdba7740f5ab3f6d85c18286b05596a4137bf80bbc8b54f32662
    source_path: providers/alibaba.md
    workflow: 15
---

# Alibaba Model Studio

OpenClaw incluye un proveedor integrado de generación de video `alibaba` para modelos Wan en
Alibaba Model Studio / DashScope.

- Proveedor: `alibaba`
- Autenticación preferida: `MODELSTUDIO_API_KEY`
- También se aceptan: `DASHSCOPE_API_KEY`, `QWEN_API_KEY`
- API: generación de video asíncrona de DashScope / Model Studio

## Primeros pasos

<Steps>
  <Step title="Configura una API key">
    ```bash
    openclaw onboard --auth-choice qwen-standard-api-key
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
  <Step title="Verifica que el proveedor esté disponible">
    ```bash
    openclaw models list --provider alibaba
    ```
  </Step>
</Steps>

<Note>
Cualquiera de las API keys de autenticación aceptadas (`MODELSTUDIO_API_KEY`, `DASHSCOPE_API_KEY`, `QWEN_API_KEY`) funcionará. La opción de onboarding `qwen-standard-api-key` configura la credencial compartida de DashScope.
</Note>

## Modelos Wan integrados

El proveedor integrado `alibaba` actualmente registra:

| Referencia del modelo      | Modo                      |
| -------------------------- | ------------------------- |
| `alibaba/wan2.6-t2v`       | Texto a video             |
| `alibaba/wan2.6-i2v`       | Imagen a video            |
| `alibaba/wan2.6-r2v`       | Referencia a video        |
| `alibaba/wan2.6-r2v-flash` | Referencia a video (rápido) |
| `alibaba/wan2.7-r2v`       | Referencia a video        |

## Límites actuales

| Parámetro             | Límite                                                    |
| --------------------- | --------------------------------------------------------- |
| Videos de salida      | Hasta **1** por solicitud                                 |
| Imágenes de entrada   | Hasta **1**                                               |
| Videos de entrada     | Hasta **4**                                               |
| Duración              | Hasta **10 segundos**                                     |
| Controles compatibles | `size`, `aspectRatio`, `resolution`, `audio`, `watermark` |
| Imagen/video de referencia | Solo URLs remotas `http(s)`                           |

<Warning>
El modo de imagen/video de referencia actualmente requiere **URLs remotas http(s)**. Las rutas de archivos locales no son compatibles para entradas de referencia.
</Warning>

## Configuración avanzada

<AccordionGroup>
  <Accordion title="Relación con Qwen">
    El proveedor integrado `qwen` también usa endpoints de DashScope alojados por Alibaba para
    la generación de video Wan. Usa:

    - `qwen/...` cuando quieras la superficie canónica del proveedor Qwen
    - `alibaba/...` cuando quieras la superficie directa de video Wan propiedad del proveedor

    Consulta la [documentación del proveedor Qwen](/es/providers/qwen) para más detalles.

  </Accordion>

  <Accordion title="Prioridad de las API keys de autenticación">
    OpenClaw busca las API keys de autenticación en este orden:

    1. `MODELSTUDIO_API_KEY` (preferida)
    2. `DASHSCOPE_API_KEY`
    3. `QWEN_API_KEY`

    Cualquiera de estas autenticará el proveedor `alibaba`.

  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Generación de video" href="/es/tools/video-generation" icon="video">
    Parámetros compartidos de la herramienta de video y selección de proveedor.
  </Card>
  <Card title="Qwen" href="/es/providers/qwen" icon="microchip">
    Configuración del proveedor Qwen e integración con DashScope.
  </Card>
  <Card title="Referencia de configuración" href="/es/gateway/configuration-reference#agent-defaults" icon="gear">
    Valores predeterminados del agente y configuración del modelo.
  </Card>
</CardGroup>
