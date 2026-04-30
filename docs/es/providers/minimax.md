---
read_when:
    - Quieres modelos MiniMax en OpenClaw
    - Necesitas orientación para configurar MiniMax
summary: Usar modelos MiniMax en OpenClaw
title: MiniMax
x-i18n:
    generated_at: "2026-04-30T05:57:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0ef833258692c78f40a160131c2a0d36f84889e5d5196ddadb648485ba8cb04a
    source_path: providers/minimax.md
    workflow: 16
---

OpenClaw's MiniMax provider defaults to **MiniMax M2.7**.

MiniMax also provides:

- Bundled speech synthesis via T2A v2
- Bundled image understanding via `MiniMax-VL-01`
- Bundled music generation via `music-2.6`
- Bundled `web_search` through the MiniMax Coding Plan search API

Provider split:

| Provider ID      | Auth    | Capabilities                                                                                        |
| ---------------- | ------- | --------------------------------------------------------------------------------------------------- |
| `minimax`        | API key | Text, image generation, music generation, video generation, image understanding, speech, web search |
| `minimax-portal` | OAuth   | Text, image generation, music generation, video generation, image understanding, speech             |

## Built-in catalog

| Model                    | Type             | Description                              |
| ------------------------ | ---------------- | ---------------------------------------- |
| `MiniMax-M2.7`           | Chat (reasoning) | Default hosted reasoning model           |
| `MiniMax-M2.7-highspeed` | Chat (reasoning) | Faster M2.7 reasoning tier               |
| `MiniMax-VL-01`          | Vision           | Image understanding model                |
| `image-01`               | Image generation | Text-to-image and image-to-image editing |
| `music-2.6`              | Music generation | Default music model                      |
| `music-2.5`              | Music generation | Previous music generation tier           |
| `music-2.0`              | Music generation | Legacy music generation tier             |
| `MiniMax-Hailuo-2.3`     | Video generation | Text-to-video and image reference flows  |

## Getting started

Choose your preferred auth method and follow the setup steps.

<Tabs>
  <Tab title="OAuth (Coding Plan)">
    **Best for:** quick setup with MiniMax Coding Plan via OAuth, no API key required.

    <Tabs>
      <Tab title="International">
        <Steps>
          <Step title="Run onboarding">
            ```bash
            openclaw onboard --auth-choice minimax-global-oauth
            ```

            This authenticates against `api.minimax.io`.
          </Step>
          <Step title="Verify the model is available">
            ```bash
            openclaw models list --provider minimax-portal
            ```
          </Step>
        </Steps>
      </Tab>
      <Tab title="China">
        <Steps>
          <Step title="Run onboarding">
            ```bash
            openclaw onboard --auth-choice minimax-cn-oauth
            ```

            This authenticates against `api.minimaxi.com`.
          </Step>
          <Step title="Verify the model is available">
            ```bash
            openclaw models list --provider minimax-portal
            ```
          </Step>
        </Steps>
      </Tab>
    </Tabs>

    <Note>
    OAuth setups use the `minimax-portal` provider id. Model refs follow the form `minimax-portal/MiniMax-M2.7`.
    </Note>

    <Tip>
    Referral link for MiniMax Coding Plan (10% off): [MiniMax Coding Plan](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
    </Tip>

  </Tab>

  <Tab title="API key">
    **Best for:** hosted MiniMax with Anthropic-compatible API.

    <Tabs>
      <Tab title="International">
        <Steps>
          <Step title="Run onboarding">
            ```bash
            openclaw onboard --auth-choice minimax-global-api
            ```

            This configures `api.minimax.io` as the base URL.
          </Step>
          <Step title="Verify the model is available">
            ```bash
            openclaw models list --provider minimax
            ```
          </Step>
        </Steps>
      </Tab>
      <Tab title="China">
        <Steps>
          <Step title="Run onboarding">
            ```bash
            openclaw onboard --auth-choice minimax-cn-api
            ```

            This configures `api.minimaxi.com` as the base URL.
          </Step>
          <Step title="Verify the model is available">
            ```bash
            openclaw models list --provider minimax
            ```
          </Step>
        </Steps>
      </Tab>
    </Tabs>

    ### Config example

    ```json5
    {
      env: { MINIMAX_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "minimax/MiniMax-M2.7" } } },
      models: {
        mode: "merge",
        providers: {
          minimax: {
            baseUrl: "https://api.minimax.io/anthropic",
            apiKey: "${MINIMAX_API_KEY}",
            api: "anthropic-messages",
            models: [
              {
                id: "MiniMax-M2.7",
                name: "MiniMax M2.7",
                reasoning: true,
                input: ["text"],
                cost: { input: 0.3, output: 1.2, cacheRead: 0.06, cacheWrite: 0.375 },
                contextWindow: 204800,
                maxTokens: 131072,
              },
              {
                id: "MiniMax-M2.7-highspeed",
                name: "MiniMax M2.7 Highspeed",
                reasoning: true,
                input: ["text"],
                cost: { input: 0.6, output: 2.4, cacheRead: 0.06, cacheWrite: 0.375 },
                contextWindow: 204800,
                maxTokens: 131072,
              },
            ],
          },
        },
      },
    }
    ```

    <Warning>
    On the Anthropic-compatible streaming path, OpenClaw disables MiniMax thinking by default unless you explicitly set `thinking` yourself. MiniMax's streaming endpoint emits `reasoning_content` in OpenAI-style delta chunks instead of native Anthropic thinking blocks, which can leak internal reasoning into visible output if left enabled implicitly.
    </Warning>

    <Note>
    API-key setups use the `minimax` provider id. Model refs follow the form `minimax/MiniMax-M2.7`.
    </Note>

  </Tab>
</Tabs>

## Configure via `openclaw configure`

Use the interactive config wizard to set MiniMax without editing JSON:

<Steps>
  <Step title="Inicia el asistente">
    ```bash
    openclaw configure
    ```
  </Step>
  <Step title="Selecciona Modelo/autenticación">
    Elige **Modelo/autenticación** en el menú.
  </Step>
  <Step title="Elige una opción de autenticación de MiniMax">
    Elige una de las opciones de MiniMax disponibles:

    | Opción de autenticación | Descripción |
    | --- | --- |
    | `minimax-global-oauth` | OAuth internacional (Coding Plan) |
    | `minimax-cn-oauth` | OAuth de China (Coding Plan) |
    | `minimax-global-api` | Clave de API internacional |
    | `minimax-cn-api` | Clave de API de China |

  </Step>
  <Step title="Elige tu modelo predeterminado">
    Selecciona tu modelo predeterminado cuando se te solicite.
  </Step>
</Steps>

## Capacidades

### Generación de imágenes

El plugin MiniMax registra el modelo `image-01` para la herramienta `image_generate`. Admite:

- **Generación de texto a imagen** con control de relación de aspecto
- **Edición de imagen a imagen** (referencia de sujeto) con control de relación de aspecto
- Hasta **9 imágenes de salida** por solicitud
- Hasta **1 imagen de referencia** por solicitud de edición
- Relaciones de aspecto admitidas: `1:1`, `16:9`, `4:3`, `3:2`, `2:3`, `3:4`, `9:16`, `21:9`

Para usar MiniMax en la generación de imágenes, configúralo como proveedor de generación de imágenes:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: { primary: "minimax/image-01" },
    },
  },
}
```

El plugin usa la misma autenticación `MINIMAX_API_KEY` u OAuth que los modelos de texto. No se necesita configuración adicional si MiniMax ya está configurado.

Tanto `minimax` como `minimax-portal` registran `image_generate` con el mismo
modelo `image-01`. Las configuraciones con clave de API usan `MINIMAX_API_KEY`; las configuraciones OAuth pueden usar
la ruta de autenticación `minimax-portal` incluida en su lugar.

La generación de imágenes siempre usa el endpoint de imágenes dedicado de MiniMax
(`/v1/image_generation`) e ignora `models.providers.minimax.baseUrl`,
ya que ese campo configura la URL base compatible con chat/Anthropic. Define
`MINIMAX_API_HOST=https://api.minimaxi.com` para enrutar la generación de imágenes
a través del endpoint de CN; el endpoint global predeterminado es
`https://api.minimax.io`.

Cuando la incorporación o la configuración con clave de API escribe entradas explícitas de `models.providers.minimax`,
OpenClaw materializa `MiniMax-M2.7` y
`MiniMax-M2.7-highspeed` como modelos de chat solo de texto. La comprensión de imágenes se
expone por separado mediante el proveedor de medios `MiniMax-VL-01`, propiedad del plugin.

<Note>
Consulta [Generación de imágenes](/es/tools/image-generation) para conocer los parámetros compartidos de la herramienta, la selección de proveedor y el comportamiento de conmutación por error.
</Note>

### Texto a voz

El plugin `minimax` incluido registra MiniMax T2A v2 como proveedor de voz para
`messages.tts`.

- Modelo TTS predeterminado: `speech-2.8-hd`
- Voz predeterminada: `English_expressive_narrator`
- Los ids de modelo incluidos admitidos incluyen `speech-2.8-hd`, `speech-2.8-turbo`,
  `speech-2.6-hd`, `speech-2.6-turbo`, `speech-02-hd`,
  `speech-02-turbo`, `speech-01-hd` y `speech-01-turbo`.
- La resolución de autenticación es `messages.tts.providers.minimax.apiKey`, luego
  los perfiles de autenticación OAuth/token de `minimax-portal`, luego las claves de entorno de
  Token Plan (`MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY`,
  `MINIMAX_CODING_API_KEY`) y luego `MINIMAX_API_KEY`.
- Si no se configura ningún host TTS, OpenClaw reutiliza el host OAuth configurado de
  `minimax-portal` y elimina los sufijos de ruta compatibles con Anthropic,
  como `/anthropic`.
- Los adjuntos de audio normales se mantienen en MP3.
- Los destinos de notas de voz como Feishu y Telegram se transcodifican desde MP3 de MiniMax
  a Opus de 48 kHz con `ffmpeg`, porque la API de archivos de Feishu/Lark solo
  acepta `file_type: "opus"` para mensajes de audio nativos.
- MiniMax T2A acepta `speed` y `vol` fraccionarios, pero `pitch` se envía como un
  entero; OpenClaw trunca los valores fraccionarios de `pitch` antes de la solicitud a la API.

| Configuración                            | Variable de entorno    | Predeterminado                | Descripción                              |
| ---------------------------------------- | ---------------------- | ----------------------------- | ---------------------------------------- |
| `messages.tts.providers.minimax.baseUrl` | `MINIMAX_API_HOST`     | `https://api.minimax.io`      | Host de la API MiniMax T2A.              |
| `messages.tts.providers.minimax.model`   | `MINIMAX_TTS_MODEL`    | `speech-2.8-hd`               | Id del modelo TTS.                       |
| `messages.tts.providers.minimax.voiceId` | `MINIMAX_TTS_VOICE_ID` | `English_expressive_narrator` | Id de voz usado para la salida de voz.   |
| `messages.tts.providers.minimax.speed`   |                        | `1.0`                         | Velocidad de reproducción, `0.5..2.0`.   |
| `messages.tts.providers.minimax.vol`     |                        | `1.0`                         | Volumen, `(0, 10]`.                      |
| `messages.tts.providers.minimax.pitch`   |                        | `0`                           | Desplazamiento entero de tono, `-12..12`. |

### Generación de música

El plugin MiniMax incluido registra la generación de música mediante la herramienta compartida
`music_generate` tanto para `minimax` como para `minimax-portal`.

- Modelo de música predeterminado: `minimax/music-2.6`
- Modelo de música OAuth: `minimax-portal/music-2.6`
- También admite `minimax/music-2.5` y `minimax/music-2.0`
- Controles de prompt: `lyrics`, `instrumental`, `durationSeconds`
- Formato de salida: `mp3`
- Las ejecuciones respaldadas por sesión se desacoplan mediante el flujo compartido de tarea/estado, incluido `action: "status"`

Para usar MiniMax como proveedor de música predeterminado:

```json5
{
  agents: {
    defaults: {
      musicGenerationModel: {
        primary: "minimax/music-2.6",
      },
    },
  },
}
```

<Note>
Consulta [Generación de música](/es/tools/music-generation) para conocer los parámetros compartidos de la herramienta, la selección de proveedor y el comportamiento de conmutación por error.
</Note>

### Generación de video

El plugin MiniMax incluido registra la generación de video mediante la herramienta compartida
`video_generate` tanto para `minimax` como para `minimax-portal`.

- Modelo de video predeterminado: `minimax/MiniMax-Hailuo-2.3`
- Modelo de video OAuth: `minimax-portal/MiniMax-Hailuo-2.3`
- Modos: flujos de texto a video y de referencia de una sola imagen
- Admite `aspectRatio` y `resolution`

Para usar MiniMax como proveedor de video predeterminado:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "minimax/MiniMax-Hailuo-2.3",
      },
    },
  },
}
```

<Note>
Consulta [Generación de video](/es/tools/video-generation) para ver los parámetros de herramienta compartidos, la selección de proveedor y el comportamiento de conmutación por error.
</Note>

### Comprensión de imágenes

El Plugin MiniMax registra la comprensión de imágenes por separado del catálogo
de texto:

| ID de proveedor  | Modelo de imagen predeterminado |
| ---------------- | ------------------------------- |
| `minimax`        | `MiniMax-VL-01`                 |
| `minimax-portal` | `MiniMax-VL-01`                 |

Por eso el enrutamiento automático de medios puede usar la comprensión de imágenes de MiniMax incluso
cuando el catálogo de proveedor de texto incluido aún muestra referencias de chat M2.7 solo de texto.

### Búsqueda web

El Plugin MiniMax también registra `web_search` mediante la API de búsqueda
MiniMax Coding Plan.

- ID de proveedor: `minimax`
- Resultados estructurados: títulos, URL, fragmentos, consultas relacionadas
- Variable de entorno preferida: `MINIMAX_CODE_PLAN_KEY`
- Alias de entorno aceptado: `MINIMAX_CODING_API_KEY`
- Alternativa de compatibilidad: `MINIMAX_API_KEY` cuando ya apunta a un token de coding-plan
- Reutilización de región: `plugins.entries.minimax.config.webSearch.region`, luego `MINIMAX_API_HOST`, luego las URL base del proveedor MiniMax
- La búsqueda permanece en el ID de proveedor `minimax`; la configuración OAuth CN/global todavía puede dirigir la región indirectamente mediante `models.providers.minimax-portal.baseUrl`

La configuración vive en `plugins.entries.minimax.config.webSearch.*`.

<Note>
Consulta [Búsqueda de MiniMax](/es/tools/minimax-search) para ver la configuración y el uso completos de la búsqueda web.
</Note>

## Configuración avanzada

<AccordionGroup>
  <Accordion title="Opciones de configuración">
    | Opción | Descripción |
    | --- | --- |
    | `models.providers.minimax.baseUrl` | Prefiere `https://api.minimax.io/anthropic` (compatible con Anthropic); `https://api.minimax.io/v1` es opcional para payloads compatibles con OpenAI |
    | `models.providers.minimax.api` | Prefiere `anthropic-messages`; `openai-completions` es opcional para payloads compatibles con OpenAI |
    | `models.providers.minimax.apiKey` | Clave de API de MiniMax (`MINIMAX_API_KEY`) |
    | `models.providers.minimax.models` | Define `id`, `name`, `reasoning`, `contextWindow`, `maxTokens`, `cost` |
    | `agents.defaults.models` | Modelos de alias que quieres en la allowlist |
    | `models.mode` | Mantén `merge` si quieres agregar MiniMax junto con los integrados |
  </Accordion>

  <Accordion title="Valores predeterminados de pensamiento">
    En `api: "anthropic-messages"`, OpenClaw inyecta `thinking: { type: "disabled" }` salvo que thinking ya se haya definido explícitamente en params/config.

    Esto impide que el endpoint de streaming de MiniMax emita `reasoning_content` en fragmentos delta de estilo OpenAI, lo que filtraría razonamiento interno en la salida visible.

  </Accordion>

  <Accordion title="Modo rápido">
    `/fast on` o `params.fastMode: true` reescribe `MiniMax-M2.7` a `MiniMax-M2.7-highspeed` en la ruta de streaming compatible con Anthropic.
  </Accordion>

  <Accordion title="Ejemplo de alternativa">
    **Ideal para:** mantener tu modelo más potente de generación más reciente como principal y conmutar por error a MiniMax M2.7. El ejemplo siguiente usa Opus como principal concreto; cámbialo por tu modelo principal de última generación preferido.

    ```json5
    {
      env: { MINIMAX_API_KEY: "sk-..." },
      agents: {
        defaults: {
          models: {
            "anthropic/claude-opus-4-6": { alias: "primary" },
            "minimax/MiniMax-M2.7": { alias: "minimax" },
          },
          model: {
            primary: "anthropic/claude-opus-4-6",
            fallbacks: ["minimax/MiniMax-M2.7"],
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Detalles de uso de Coding Plan">
    - API de uso de Coding Plan: `https://api.minimaxi.com/v1/api/openplatform/coding_plan/remains` (requiere una clave de coding plan).
    - OpenClaw normaliza el uso de coding-plan de MiniMax a la misma visualización de `% left` usada por otros proveedores. Los campos sin procesar `usage_percent` / `usagePercent` de MiniMax son cuota restante, no cuota consumida, por lo que OpenClaw los invierte. Los campos basados en conteos prevalecen cuando están presentes.
    - Cuando la API devuelve `model_remains`, OpenClaw prefiere la entrada del modelo de chat, deriva la etiqueta de ventana a partir de `start_time` / `end_time` cuando es necesario e incluye el nombre del modelo seleccionado en la etiqueta del plan para que las ventanas de coding-plan sean más fáciles de distinguir.
    - Las instantáneas de uso tratan `minimax`, `minimax-cn` y `minimax-portal` como la misma superficie de cuota de MiniMax, y prefieren el OAuth de MiniMax almacenado antes de recurrir a variables de entorno de clave de Coding Plan.

  </Accordion>
</AccordionGroup>

## Notas

- Las referencias de modelo siguen la ruta de autenticación:
  - Configuración con clave de API: `minimax/<model>`
  - Configuración OAuth: `minimax-portal/<model>`
- Modelo de chat predeterminado: `MiniMax-M2.7`
- Modelo de chat alternativo: `MiniMax-M2.7-highspeed`
- La incorporación y la configuración directa con clave de API escriben definiciones de modelo solo de texto para ambas variantes M2.7
- La comprensión de imágenes usa el proveedor de medios `MiniMax-VL-01` propiedad del Plugin
- Actualiza los valores de precios en `models.json` si necesitas seguimiento exacto de costos
- Usa `openclaw models list` para confirmar el ID de proveedor actual y luego cambia con `openclaw models set minimax/MiniMax-M2.7` o `openclaw models set minimax-portal/MiniMax-M2.7`

<Tip>
Enlace de referido para MiniMax Coding Plan (10% de descuento): [MiniMax Coding Plan](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
</Tip>

<Note>
Consulta [Proveedores de modelos](/es/concepts/model-providers) para ver las reglas de proveedor.
</Note>

## Solución de problemas

<AccordionGroup>
  <Accordion title='"Modelo desconocido: minimax/MiniMax-M2.7"'>
    Esto normalmente significa que el **proveedor MiniMax no está configurado** (no se encontró ninguna entrada de proveedor coincidente ni perfil de autenticación/clave de entorno de MiniMax). Hay una corrección para esta detección en **2026.1.12**. Corrígelo así:

    - Actualiza a **2026.1.12** (o ejecuta desde la fuente `main`) y luego reinicia el gateway.
    - Ejecuta `openclaw configure` y selecciona una opción de autenticación de **MiniMax**, o
    - Agrega manualmente el bloque `models.providers.minimax` o `models.providers.minimax-portal` correspondiente, o
    - Define `MINIMAX_API_KEY`, `MINIMAX_OAUTH_TOKEN` o un perfil de autenticación de MiniMax para que se pueda inyectar el proveedor correspondiente.

    Asegúrate de que el ID del modelo sea **sensible a mayúsculas y minúsculas**:

    - Ruta con clave de API: `minimax/MiniMax-M2.7` o `minimax/MiniMax-M2.7-highspeed`
    - Ruta OAuth: `minimax-portal/MiniMax-M2.7` o `minimax-portal/MiniMax-M2.7-highspeed`

    Luego vuelve a comprobar con:

    ```bash
    openclaw models list
    ```

  </Accordion>
</AccordionGroup>

<Note>
Más ayuda: [Solución de problemas](/es/help/troubleshooting) y [FAQ](/es/help/faq).
</Note>

## Relacionado

<CardGroup cols={2}>
  <Card title="Selección de modelo" href="/es/concepts/model-providers" icon="layers">
    Elegir proveedores, referencias de modelos y comportamiento de conmutación por error.
  </Card>
  <Card title="Generación de imágenes" href="/es/tools/image-generation" icon="image">
    Parámetros compartidos de la herramienta de imagen y selección de proveedor.
  </Card>
  <Card title="Generación de música" href="/es/tools/music-generation" icon="music">
    Parámetros compartidos de la herramienta de música y selección de proveedor.
  </Card>
  <Card title="Generación de video" href="/es/tools/video-generation" icon="video">
    Parámetros compartidos de la herramienta de video y selección de proveedor.
  </Card>
  <Card title="Búsqueda de MiniMax" href="/es/tools/minimax-search" icon="magnifying-glass">
    Configuración de búsqueda web mediante MiniMax Coding Plan.
  </Card>
  <Card title="Solución de problemas" href="/es/help/troubleshooting" icon="wrench">
    Solución de problemas general y FAQ.
  </Card>
</CardGroup>
