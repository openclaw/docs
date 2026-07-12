---
read_when:
    - Quieres generar contenido multimedia con Vydra en OpenClaw
    - Necesitas instrucciones para configurar la clave de API de Vydra
summary: Usa imágenes, vídeos y voz de Vydra en OpenClaw
title: Vydra
x-i18n:
    generated_at: "2026-07-11T23:28:53Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e775bdd6f4ec7d1f5189910af450b92d8d6e831c17c338271afee962636ba69f
    source_path: providers/vydra.md
    workflow: 16
---

El Plugin Vydra incluido añade:

- Generación de imágenes mediante `vydra/grok-imagine`
- Generación de vídeo mediante `vydra/veo3` (texto a vídeo) y `vydra/kling` (imagen a vídeo)
- Síntesis de voz mediante la ruta TTS de Vydra respaldada por ElevenLabs

OpenClaw usa la misma `VYDRA_API_KEY` para las tres capacidades.

| Propiedad                     | Valor                                                                     |
| ----------------------------- | ------------------------------------------------------------------------- |
| Id. del proveedor             | `vydra`                                                                   |
| Plugin                        | incluido, `enabledByDefault: true`                                        |
| Variable de entorno de autenticación | `VYDRA_API_KEY`                                                    |
| Opción de incorporación       | `--auth-choice vydra-api-key`                                             |
| Opción directa de la CLI      | `--vydra-api-key <key>`                                                   |
| Contratos                     | `imageGenerationProviders`, `videoGenerationProviders`, `speechProviders` |
| URL base                      | `https://www.vydra.ai/api/v1` (usa el host `www`)                         |

<Warning>
Usa `https://www.vydra.ai/api/v1` como URL base. Actualmente, el host raíz de Vydra (`https://vydra.ai/api/v1`) redirige a `www`. Algunos clientes HTTP eliminan `Authorization` durante esa redirección entre hosts, lo que convierte una clave de API válida en un fallo de autenticación engañoso. El Plugin incluido normaliza cualquier URL base `vydra.ai` configurada a `www.vydra.ai` para evitarlo.
</Warning>

## Configuración

<Steps>
  <Step title="Ejecuta la incorporación interactiva">
    ```bash
    openclaw onboard --auth-choice vydra-api-key
    ```

    O establece directamente la variable de entorno:

    ```bash
    export VYDRA_API_KEY="vydra_live_..."
    ```

  </Step>
  <Step title="Elige una capacidad predeterminada">
    Elige una o varias de las capacidades siguientes (imagen, vídeo o voz) y aplica la configuración correspondiente.
  </Step>
</Steps>

## Capacidades

<AccordionGroup>
  <Accordion title="Generación de imágenes">
    Modelo de imagen predeterminado y único incluido:

    - `vydra/grok-imagine`

    Establécelo como proveedor de imágenes predeterminado:

    ```json5
    {
      agents: {
        defaults: {
          imageGenerationModel: {
            primary: "vydra/grok-imagine",
          },
        },
      },
    }
    ```

    La compatibilidad incluida se limita a texto a imagen, con una imagen como máximo por solicitud. Las rutas de edición alojadas de Vydra esperan URL de imágenes remotas, y el Plugin incluido no añade un puente de carga específico de Vydra.

    <Note>
    Consulta [Generación de imágenes](/es/tools/image-generation) para conocer los parámetros compartidos de la herramienta, la selección de proveedores y el comportamiento de conmutación por error.
    </Note>

  </Accordion>

  <Accordion title="Generación de vídeo">
    Modelos de vídeo registrados:

    - `vydra/veo3` para texto a vídeo (rechaza entradas de referencia de imagen)
    - `vydra/kling` para imagen a vídeo (requiere exactamente una URL de imagen remota)

    Establece Vydra como proveedor de vídeo predeterminado:

    ```json5
    {
      agents: {
        defaults: {
          videoGenerationModel: {
            primary: "vydra/veo3",
          },
        },
      },
    }
    ```

    Notas:

    - `vydra/kling` rechaza de entrada las cargas de archivos locales; solo funciona una referencia mediante una URL de imagen remota.
    - La ruta HTTP `kling` de Vydra ha sido inconsistente respecto a si requiere `image_url` o `video_url`; el proveedor incluido envía la misma URL de imagen remota en ambos campos.
    - El Plugin incluido adopta un enfoque conservador y no reenvía controles de estilo no documentados, como la relación de aspecto, la resolución, la marca de agua o el audio generado.

    <Note>
    Consulta [Generación de vídeo](/es/tools/video-generation) para conocer los parámetros compartidos de la herramienta, la selección de proveedores y el comportamiento de conmutación por error.
    </Note>

  </Accordion>

  <Accordion title="Pruebas en vivo de vídeo">
    Cobertura en vivo específica del proveedor:

    ```bash
    OPENCLAW_LIVE_TEST=1 \
    OPENCLAW_LIVE_VYDRA_VIDEO=1 \
    pnpm test:live -- extensions/vydra/vydra.live.test.ts
    ```

    El archivo de pruebas en vivo de Vydra incluido cubre:

    - Texto a vídeo con `vydra/veo3`
    - Imagen a vídeo con `vydra/kling` mediante una URL de imagen remota

    Sustituye el recurso de prueba de imagen remota cuando sea necesario:

    ```bash
    export OPENCLAW_LIVE_VYDRA_KLING_IMAGE_URL="https://example.com/reference.png"
    ```

  </Accordion>

  <Accordion title="Síntesis de voz">
    Establece Vydra como proveedor de voz:

    ```json5
    {
      messages: {
        tts: {
          provider: "vydra",
          providers: {
            vydra: {
              apiKey: "${VYDRA_API_KEY}",
              voiceId: "21m00Tcm4TlvDq8ikWAM",
            },
          },
        },
      },
    }
    ```

    Valores predeterminados:

    - Modelo: `elevenlabs/tts`
    - Id. de voz: `21m00Tcm4TlvDq8ikWAM` ("Rachel")

    El Plugin incluido ofrece esta única voz predeterminada de funcionamiento comprobado y devuelve archivos de audio MP3.

  </Accordion>
</AccordionGroup>

## Contenido relacionado

<CardGroup cols={2}>
  <Card title="Directorio de proveedores" href="/es/providers/index" icon="list">
    Explora todos los proveedores disponibles.
  </Card>
  <Card title="Generación de imágenes" href="/es/tools/image-generation" icon="image">
    Parámetros compartidos de la herramienta de imágenes y selección de proveedores.
  </Card>
  <Card title="Generación de vídeo" href="/es/tools/video-generation" icon="video">
    Parámetros compartidos de la herramienta de vídeo y selección de proveedores.
  </Card>
  <Card title="Referencia de configuración" href="/es/gateway/config-agents#agent-defaults" icon="gear">
    Valores predeterminados del agente y configuración de modelos.
  </Card>
</CardGroup>
