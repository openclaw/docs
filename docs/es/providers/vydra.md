---
read_when:
    - Quieres generación de medios de Vydra en OpenClaw
    - Necesitas orientación para configurar la clave de API de Vydra
summary: Usa imagen, video y voz de Vydra en OpenClaw
title: Vydra
x-i18n:
    generated_at: "2026-07-05T11:39:55Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e775bdd6f4ec7d1f5189910af450b92d8d6e831c17c338271afee962636ba69f
    source_path: providers/vydra.md
    workflow: 16
---

El Plugin Vydra incluido agrega:

- Generación de imágenes mediante `vydra/grok-imagine`
- Generación de video mediante `vydra/veo3` (texto a video) y `vydra/kling` (imagen a video)
- Síntesis de voz mediante la ruta TTS de Vydra respaldada por ElevenLabs

OpenClaw usa la misma `VYDRA_API_KEY` para las tres capacidades.

| Propiedad              | Valor                                                                     |
| ---------------------- | ------------------------------------------------------------------------- |
| Id. de proveedor       | `vydra`                                                                   |
| Plugin                 | incluido, `enabledByDefault: true`                                        |
| Variable de entorno de auth | `VYDRA_API_KEY`                                                      |
| Flag de incorporación  | `--auth-choice vydra-api-key`                                             |
| Flag directo de CLI    | `--vydra-api-key <key>`                                                   |
| Contratos              | `imageGenerationProviders`, `videoGenerationProviders`, `speechProviders` |
| URL base               | `https://www.vydra.ai/api/v1` (usa el host `www`)                         |

<Warning>
Usa `https://www.vydra.ai/api/v1` como URL base. El host raíz de Vydra (`https://vydra.ai/api/v1`) actualmente redirige a `www`. Algunos clientes HTTP eliminan `Authorization` en esa redirección entre hosts, lo que convierte una clave de API válida en un error de auth engañoso. El Plugin incluido normaliza cualquier URL base configurada de `vydra.ai` a `www.vydra.ai` para evitarlo.
</Warning>

## Configuración

<Steps>
  <Step title="Ejecutar la incorporación interactiva">
    ```bash
    openclaw onboard --auth-choice vydra-api-key
    ```

    O configura la variable de entorno directamente:

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
    Modelo de imagen predeterminado y único incluido:

    - `vydra/grok-imagine`

    Configúralo como proveedor de imágenes predeterminado:

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

    El soporte incluido es solo de texto a imagen, con un máximo de una imagen por solicitud. Las rutas de edición alojadas de Vydra esperan URLs de imágenes remotas, y el Plugin incluido no agrega un puente de carga específico de Vydra.

    <Note>
    Consulta [Generación de imágenes](/es/tools/image-generation) para ver los parámetros compartidos de la herramienta, la selección de proveedor y el comportamiento de failover.
    </Note>

  </Accordion>

  <Accordion title="Generación de video">
    Modelos de video registrados:

    - `vydra/veo3` para texto a video (rechaza entradas de referencia de imagen)
    - `vydra/kling` para imagen a video (requiere exactamente una URL de imagen remota)

    Configura Vydra como proveedor de video predeterminado:

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

    - `vydra/kling` rechaza las cargas de archivos locales desde el inicio; solo funciona una referencia de URL de imagen remota.
    - La ruta HTTP `kling` de Vydra ha sido inconsistente sobre si requiere `image_url` o `video_url`; el proveedor incluido envía la misma URL de imagen remota en ambos campos.
    - El Plugin incluido se mantiene conservador y no reenvía controles de estilo no documentados, como relación de aspecto, resolución, marca de agua o audio generado.

    <Note>
    Consulta [Generación de video](/es/tools/video-generation) para ver los parámetros compartidos de la herramienta, la selección de proveedor y el comportamiento de failover.
    </Note>

  </Accordion>

  <Accordion title="Pruebas en vivo de video">
    Cobertura en vivo específica del proveedor:

    ```bash
    OPENCLAW_LIVE_TEST=1 \
    OPENCLAW_LIVE_VYDRA_VIDEO=1 \
    pnpm test:live -- extensions/vydra/vydra.live.test.ts
    ```

    El archivo en vivo incluido de Vydra cubre:

    - `vydra/veo3` de texto a video
    - `vydra/kling` de imagen a video usando una URL de imagen remota

    Sobrescribe el fixture de imagen remota cuando sea necesario:

    ```bash
    export OPENCLAW_LIVE_VYDRA_KLING_IMAGE_URL="https://example.com/reference.png"
    ```

  </Accordion>

  <Accordion title="Síntesis de voz">
    Configura Vydra como proveedor de voz:

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

    El Plugin incluido expone esta voz predeterminada conocida y fiable, y devuelve archivos de audio MP3.

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
    Valores predeterminados de agentes y configuración de modelos.
  </Card>
</CardGroup>
