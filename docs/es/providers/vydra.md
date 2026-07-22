---
read_when:
    - Quieres generar contenido multimedia con Vydra en OpenClaw
    - Necesita orientación para configurar la clave de API de Vydra
summary: Usa imágenes, vídeo y voz de Vydra en OpenClaw
title: Vydra
x-i18n:
    generated_at: "2026-07-22T10:45:58Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: cc3856c2dd740e87d70d7eedefd9eae7905ab547aa0d68a1c479a305c59b2982
    source_path: providers/vydra.md
    workflow: 16
---

El plugin Vydra incluido añade:

- Generación de imágenes mediante `vydra/grok-imagine`
- Generación de vídeo mediante `vydra/veo3` (texto a vídeo) y `vydra/kling` (imagen a vídeo)
- Síntesis de voz mediante la ruta TTS de Vydra respaldada por ElevenLabs

OpenClaw utiliza la misma `VYDRA_API_KEY` para las tres capacidades.

| Propiedad                    | Valor                                                                     |
| ---------------------------- | ------------------------------------------------------------------------- |
| Id. del proveedor            | `vydra`                                                                   |
| Plugin                       | incluido, `enabledByDefault: true`                                         |
| Variable de entorno de autenticación | `VYDRA_API_KEY`                                                           |
| Indicador de incorporación   | `--auth-choice vydra-api-key`                                             |
| Indicador directo de la CLI  | `--vydra-api-key <key>`                                                   |
| Contratos                    | `imageGenerationProviders`, `videoGenerationProviders`, `speechProviders` |
| URL base                     | `https://www.vydra.ai/api/v1` (utilice el host `www`)                        |

<Warning>
Utilice `https://www.vydra.ai/api/v1` como URL base. Actualmente, el host raíz de Vydra (`https://vydra.ai/api/v1`) redirige a `www`. Algunos clientes HTTP omiten `Authorization` en esa redirección entre hosts, lo que convierte una clave de API válida en un fallo de autenticación engañoso. El plugin incluido normaliza cualquier URL base `vydra.ai` configurada a `www.vydra.ai` para evitarlo.
</Warning>

## Configuración

<Steps>
  <Step title="Ejecutar la incorporación interactiva">
    ```bash
    openclaw onboard --auth-choice vydra-api-key
    ```

    O configure directamente la variable de entorno:

    ```bash
    export VYDRA_API_KEY="vydra_live_..."
    ```

  </Step>
  <Step title="Elegir una capacidad predeterminada">
    Elija una o varias de las capacidades siguientes (imagen, vídeo o voz) y aplique la configuración correspondiente.
  </Step>
</Steps>

## Capacidades

<AccordionGroup>
  <Accordion title="Generación de imágenes">
    Modelo de imagen predeterminado y único incluido:

    - `vydra/grok-imagine`

    Establézcalo como proveedor de imágenes predeterminado:

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

    La compatibilidad incluida solo admite texto a imagen, con un máximo de una imagen por solicitud. Las rutas de edición alojadas de Vydra esperan URL de imágenes remotas, y el plugin incluido no añade un puente de carga específico de Vydra.

    <Note>
    Consulte [Generación de imágenes](/es/tools/image-generation) para conocer los parámetros compartidos de la herramienta, la selección de proveedores y el comportamiento de conmutación por error.
    </Note>

  </Accordion>

  <Accordion title="Generación de vídeo">
    Modelos de vídeo registrados:

    - `vydra/veo3` para texto a vídeo (rechaza entradas de referencia de imagen)
    - `vydra/kling` para imagen a vídeo (requiere exactamente una URL de imagen remota)

    Establezca Vydra como proveedor de vídeo predeterminado:

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

    - `vydra/kling` rechaza de entrada las cargas de archivos locales; solo funciona una referencia mediante URL de imagen remota.
    - La ruta HTTP `kling` de Vydra no ha sido coherente respecto a si requiere `image_url` o `video_url`; el proveedor incluido envía la misma URL de imagen remota en ambos campos.
    - El plugin incluido adopta un enfoque conservador y no reenvía opciones de estilo no documentadas, como la relación de aspecto, la resolución, la marca de agua o el audio generado.

    <Note>
    Consulte [Generación de vídeo](/es/tools/video-generation) para conocer los parámetros compartidos de la herramienta, la selección de proveedores y el comportamiento de conmutación por error.
    </Note>

  </Accordion>

  <Accordion title="Pruebas en vivo de vídeo">
    Cobertura en vivo específica del proveedor:

    ```bash
    OPENCLAW_LIVE_TEST=1 \
    OPENCLAW_LIVE_VYDRA_VIDEO=1 \
    pnpm test:live -- extensions/vydra/vydra.live.test.ts
    ```

    El archivo en vivo de Vydra incluido cubre:

    - `vydra/veo3` texto a vídeo
    - `vydra/kling` imagen a vídeo mediante una URL de imagen remota

    Sobrescriba el recurso de prueba de imagen remota cuando sea necesario:

    ```bash
    export OPENCLAW_LIVE_VYDRA_KLING_IMAGE_URL="https://example.com/reference.png"
    ```

  </Accordion>

  <Accordion title="Síntesis de voz">
    Establezca Vydra como proveedor de voz:

    ```json5
    {
      tts: {
        provider: "vydra",
        providers: {
          vydra: {
            apiKey: "${VYDRA_API_KEY}",
            voiceId: "21m00Tcm4TlvDq8ikWAM",
          },
        },
      },
    }
    ```

    Valores predeterminados:

    - Modelo: `elevenlabs/tts`
    - Id. de voz: `21m00Tcm4TlvDq8ikWAM` ("Rachel")

    El plugin incluido expone esta única voz predeterminada de eficacia comprobada y devuelve archivos de audio MP3.

  </Accordion>
</AccordionGroup>

## Contenido relacionado

<CardGroup cols={2}>
  <Card title="Directorio de proveedores" href="/es/providers/index" icon="list">
    Explore todos los proveedores disponibles.
  </Card>
  <Card title="Generación de imágenes" href="/es/tools/image-generation" icon="image">
    Parámetros compartidos de la herramienta de imágenes y selección de proveedores.
  </Card>
  <Card title="Generación de vídeo" href="/es/tools/video-generation" icon="video">
    Parámetros compartidos de la herramienta de vídeo y selección de proveedores.
  </Card>
  <Card title="Referencia de configuración" href="/es/gateway/config-agents#agent-defaults" icon="gear">
    Valores predeterminados del agente y configuración del modelo.
  </Card>
</CardGroup>
