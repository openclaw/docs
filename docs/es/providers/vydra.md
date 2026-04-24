---
read_when:
    - Quieres generación multimedia de Vydra en OpenClaw
    - Necesitas una guía de configuración de claves API de Vydra
summary: Usar imagen, video y voz de Vydra en OpenClaw
title: Vydra
x-i18n:
    generated_at: "2026-04-24T05:47:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 85420c3f337c13313bf571d5ee92c1f1988ff8119d401e7ec0ea0db1e74d9b69
    source_path: providers/vydra.md
    workflow: 15
---

El Plugin incluido de Vydra agrega:

- Generación de imágenes mediante `vydra/grok-imagine`
- Generación de video mediante `vydra/veo3` y `vydra/kling`
- Síntesis de voz mediante la ruta TTS de Vydra respaldada por ElevenLabs

OpenClaw usa la misma `VYDRA_API_KEY` para las tres capacidades.

<Warning>
Usa `https://www.vydra.ai/api/v1` como URL base.

El host ápice de Vydra (`https://vydra.ai/api/v1`) actualmente redirige a `www`. Algunos clientes HTTP eliminan `Authorization` en esa redirección entre hosts, lo que convierte una clave API válida en un fallo de autenticación engañoso. El Plugin incluido usa directamente la URL base con `www` para evitarlo.
</Warning>

## Configuración

<Steps>
  <Step title="Ejecutar la incorporación interactiva">
    ```bash
    openclaw onboard --auth-choice vydra-api-key
    ```

    O establece directamente la variable de entorno:

    ```bash
    export VYDRA_API_KEY="vydra_live_..."
    ```

  </Step>
  <Step title="Elegir una capacidad predeterminada">
    Elige una o más de las capacidades siguientes (imagen, video o voz) y aplica la configuración correspondiente.
  </Step>
</Steps>

## Capacidades

<AccordionGroup>
  <Accordion title="Generación de imágenes">
    Modelo de imagen predeterminado:

    - `vydra/grok-imagine`

    Establécelo como proveedor predeterminado de imágenes:

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

    La compatibilidad incluida actual es solo de texto a imagen. Las rutas de edición alojadas por Vydra esperan URLs remotas de imágenes, y OpenClaw aún no añade un bridge de subida específico de Vydra en el Plugin incluido.

    <Note>
    Consulta [Generación de imágenes](/es/tools/image-generation) para parámetros compartidos de herramientas, selección de proveedor y comportamiento de failover.
    </Note>

  </Accordion>

  <Accordion title="Generación de video">
    Modelos de video registrados:

    - `vydra/veo3` para texto a video
    - `vydra/kling` para imagen a video

    Establece Vydra como proveedor predeterminado de video:

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

    - `vydra/veo3` está incluido solo como texto a video.
    - `vydra/kling` actualmente requiere una referencia remota de URL de imagen. Las subidas de archivos locales se rechazan de inmediato.
    - La ruta HTTP actual `kling` de Vydra ha sido inconsistente respecto a si requiere `image_url` o `video_url`; el proveedor incluido asigna la misma URL remota de imagen a ambos campos.
    - El Plugin incluido se mantiene conservador y no reenvía opciones de estilo no documentadas como relación de aspecto, resolución, marca de agua o audio generado.

    <Note>
    Consulta [Generación de video](/es/tools/video-generation) para parámetros compartidos de herramientas, selección de proveedor y comportamiento de failover.
    </Note>

  </Accordion>

  <Accordion title="Pruebas en vivo de video">
    Cobertura en vivo específica del proveedor:

    ```bash
    OPENCLAW_LIVE_TEST=1 \
    OPENCLAW_LIVE_VYDRA_VIDEO=1 \
    pnpm test:live -- extensions/vydra/vydra.live.test.ts
    ```

    El archivo incluido de pruebas en vivo de Vydra ahora cubre:

    - `vydra/veo3` texto a video
    - `vydra/kling` imagen a video usando una URL remota de imagen

    Anula la imagen remota de prueba cuando sea necesario:

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
    - Id de voz: `21m00Tcm4TlvDq8ikWAM`

    El Plugin incluido actualmente expone una única voz predeterminada conocida como funcional y devuelve archivos de audio MP3.

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
  <Card title="Referencia de configuración" href="/es/gateway/config-agents#agent-defaults" icon="gear">
    Valores predeterminados del agente y configuración de modelos.
  </Card>
</CardGroup>
