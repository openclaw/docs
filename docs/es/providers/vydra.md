---
read_when:
    - Quieres generación de medios de Vydra en OpenClaw
    - Necesitas orientación para configurar la API key de Vydra
summary: Usa imagen, video y voz de Vydra en OpenClaw
title: Vydra
x-i18n:
    generated_at: "2026-04-12T23:33:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: ab623d14b656ce0b68d648a6393fcee3bb880077d6583e0d5c1012e91757f20e
    source_path: providers/vydra.md
    workflow: 15
---

# Vydra

El Plugin integrado de Vydra agrega:

- Generación de imágenes mediante `vydra/grok-imagine`
- Generación de video mediante `vydra/veo3` y `vydra/kling`
- Síntesis de voz mediante la ruta TTS de Vydra respaldada por ElevenLabs

OpenClaw usa la misma `VYDRA_API_KEY` para las tres capacidades.

<Warning>
Usa `https://www.vydra.ai/api/v1` como URL base.

El host apex de Vydra (`https://vydra.ai/api/v1`) actualmente redirige a `www`. Algunos clientes HTTP eliminan `Authorization` en esa redirección entre hosts, lo que convierte una API key válida en un fallo de autenticación engañoso. El Plugin integrado usa directamente la URL base con `www` para evitarlo.
</Warning>

## Configuración

<Steps>
  <Step title="Ejecuta el onboarding interactivo">
    ```bash
    openclaw onboard --auth-choice vydra-api-key
    ```

    O establece la variable de entorno directamente:

    ```bash
    export VYDRA_API_KEY="vydra_live_..."
    ```

  </Step>
  <Step title="Elige una capacidad predeterminada">
    Elige una o más de las capacidades siguientes (imagen, video o voz) y aplica la configuración correspondiente.
  </Step>
</Steps>

## Capacidades

<AccordionGroup>
  <Accordion title="Generación de imágenes">
    Modelo de imagen predeterminado:

    - `vydra/grok-imagine`

    Establécelo como proveedor de imagen predeterminado:

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

    La compatibilidad integrada actual es solo para texto a imagen. Las rutas de edición alojadas de Vydra esperan URLs remotas de imagen, y OpenClaw todavía no agrega un puente de subida específico de Vydra en el Plugin integrado.

    <Note>
    Consulta [Image Generation](/es/tools/image-generation) para ver los parámetros compartidos de la herramienta, la selección de proveedor y el comportamiento de conmutación por error.
    </Note>

  </Accordion>

  <Accordion title="Generación de video">
    Modelos de video registrados:

    - `vydra/veo3` para texto a video
    - `vydra/kling` para imagen a video

    Establece Vydra como proveedor de video predeterminado:

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

    - `vydra/veo3` está integrado solo como texto a video.
    - `vydra/kling` actualmente requiere una URL remota de imagen de referencia. Las subidas de archivos locales se rechazan de entrada.
    - La ruta HTTP actual `kling` de Vydra ha sido inconsistente respecto a si requiere `image_url` o `video_url`; el proveedor integrado asigna la misma URL remota de imagen a ambos campos.
    - El Plugin integrado se mantiene conservador y no reenvía controles de estilo no documentados como relación de aspecto, resolución, marca de agua o audio generado.

    <Note>
    Consulta [Video Generation](/es/tools/video-generation) para ver los parámetros compartidos de la herramienta, la selección de proveedor y el comportamiento de conmutación por error.
    </Note>

  </Accordion>

  <Accordion title="Pruebas en vivo de video">
    Cobertura en vivo específica del proveedor:

    ```bash
    OPENCLAW_LIVE_TEST=1 \
    OPENCLAW_LIVE_VYDRA_VIDEO=1 \
    pnpm test:live -- extensions/vydra/vydra.live.test.ts
    ```

    El archivo en vivo integrado de Vydra ahora cubre:

    - texto a video con `vydra/veo3`
    - imagen a video con `vydra/kling` usando una URL remota de imagen

    Anula el fixture de imagen remota cuando sea necesario:

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
    - ID de voz: `21m00Tcm4TlvDq8ikWAM`

    El Plugin integrado actualmente expone una única voz predeterminada conocida y devuelve archivos de audio MP3.

  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Directorio de proveedores" href="/es/providers/index" icon="list">
    Explora todos los proveedores disponibles.
  </Card>
  <Card title="Generación de imágenes" href="/es/tools/image-generation" icon="image">
    Parámetros compartidos de la herramienta de imagen y selección de proveedor.
  </Card>
  <Card title="Generación de video" href="/es/tools/video-generation" icon="video">
    Parámetros compartidos de la herramienta de video y selección de proveedor.
  </Card>
  <Card title="Referencia de configuración" href="/es/gateway/configuration-reference#agent-defaults" icon="gear">
    Valores predeterminados del agente y configuración del modelo.
  </Card>
</CardGroup>
