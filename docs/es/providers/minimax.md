---
read_when:
    - Quieres usar modelos MiniMax en OpenClaw
    - Necesitas orientación de configuración de MiniMax
summary: Usa modelos MiniMax en OpenClaw
title: MiniMax
x-i18n:
    generated_at: "2026-06-27T12:38:35Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 37fe606178d7d15383e56c026b02ba7be751ead706adc097c776c0a6a92aa2a2
    source_path: providers/minimax.md
    workflow: 16
---

El proveedor MiniMax de OpenClaw usa **MiniMax M3** de forma predeterminada.

MiniMax también proporciona:

- Síntesis de voz incluida mediante T2A v2
- Comprensión de imágenes incluida mediante `MiniMax-VL-01`
- Generación de música incluida mediante `music-2.6`
- `web_search` incluido mediante la API de búsqueda del MiniMax Token Plan

División de proveedores:

| ID de proveedor | Autenticación | Capacidades                                                                                         |
| ---------------- | ------------- | ---------------------------------------------------------------------------------------------------- |
| `minimax`        | Clave de API  | Texto, generación de imágenes, generación de música, generación de video, comprensión de imágenes, voz, búsqueda web |
| `minimax-portal` | OAuth         | Texto, generación de imágenes, generación de música, generación de video, comprensión de imágenes, voz |

## Catálogo integrado

| Modelo                   | Tipo                  | Descripción                                      |
| ------------------------ | --------------------- | ------------------------------------------------ |
| `MiniMax-M3`             | Chat (razonamiento)   | Modelo de razonamiento alojado predeterminado    |
| `MiniMax-M2.7`           | Chat (razonamiento)   | Modelo de razonamiento alojado anterior          |
| `MiniMax-M2.7-highspeed` | Chat (razonamiento)   | Nivel de razonamiento M2.7 más rápido            |
| `MiniMax-VL-01`          | Visión                | Modelo de comprensión de imágenes                |
| `image-01`               | Generación de imágenes | Edición de texto a imagen e imagen a imagen     |
| `music-2.6`              | Generación de música  | Modelo de música predeterminado                  |
| `music-2.5`              | Generación de música  | Nivel anterior de generación de música           |
| `music-2.0`              | Generación de música  | Nivel heredado de generación de música           |
| `MiniMax-Hailuo-2.3`     | Generación de video   | Flujos de texto a video y referencia de imagen   |

## Primeros pasos

Elige tu método de autenticación preferido y sigue los pasos de configuración.

<Tabs>
  <Tab title="OAuth (Coding Plan)">
    **Recomendado para:** configuración rápida con MiniMax Coding Plan mediante OAuth, sin requerir clave de API.

    <Tabs>
      <Tab title="Internacional">
        <Steps>
          <Step title="Ejecuta la incorporación">
            ```bash
            openclaw onboard --auth-choice minimax-global-oauth
            ```

            Esto autentica contra `api.minimax.io`.
          </Step>
          <Step title="Verifica que el modelo esté disponible">
            ```bash
            openclaw models list --provider minimax-portal
            ```
          </Step>
        </Steps>
      </Tab>
      <Tab title="China">
        <Steps>
          <Step title="Ejecuta la incorporación">
            ```bash
            openclaw onboard --auth-choice minimax-cn-oauth
            ```

            Esto autentica contra `api.minimaxi.com`.
          </Step>
          <Step title="Verifica que el modelo esté disponible">
            ```bash
            openclaw models list --provider minimax-portal
            ```
          </Step>
        </Steps>
      </Tab>
    </Tabs>

    <Note>
    Las configuraciones OAuth usan el id de proveedor `minimax-portal`. Las referencias de modelo siguen la forma `minimax-portal/MiniMax-M3`.
    </Note>

    <Tip>
    Enlace de referido para MiniMax Coding Plan (10% de descuento): [MiniMax Coding Plan](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
    </Tip>

  </Tab>

  <Tab title="Clave de API">
    **Recomendado para:** MiniMax alojado con API compatible con Anthropic.

    <Tabs>
      <Tab title="Internacional">
        <Steps>
          <Step title="Ejecuta la incorporación">
            ```bash
            openclaw onboard --auth-choice minimax-global-api
            ```

            Esto configura `api.minimax.io` como URL base.
          </Step>
          <Step title="Verifica que el modelo esté disponible">
            ```bash
            openclaw models list --provider minimax
            ```
          </Step>
        </Steps>
      </Tab>
      <Tab title="China">
        <Steps>
          <Step title="Ejecuta la incorporación">
            ```bash
            openclaw onboard --auth-choice minimax-cn-api
            ```

            Esto configura `api.minimaxi.com` como URL base.
          </Step>
          <Step title="Verifica que el modelo esté disponible">
            ```bash
            openclaw models list --provider minimax
            ```
          </Step>
        </Steps>
      </Tab>
    </Tabs>

    ### Ejemplo de configuración

    ```json5
    {
      env: { MINIMAX_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "minimax/MiniMax-M3" } } },
      models: {
        mode: "merge",
        providers: {
          minimax: {
            baseUrl: "https://api.minimax.io/anthropic",
            apiKey: "${MINIMAX_API_KEY}",
            api: "anthropic-messages",
            models: [
              {
                id: "MiniMax-M3",
                name: "MiniMax M3",
                reasoning: true,
                input: ["text", "image"],
                cost: { input: 0.6, output: 2.4, cacheRead: 0.12, cacheWrite: 0 },
                contextWindow: 1000000,
                maxTokens: 131072,
              },
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
    En la ruta de streaming compatible con Anthropic, OpenClaw desactiva de forma predeterminada el pensamiento de MiniMax M2.x a menos que establezcas explícitamente `thinking` por tu cuenta. El endpoint de streaming de M2.x emite `reasoning_content` en fragmentos delta de estilo OpenAI en lugar de bloques de pensamiento nativos de Anthropic, lo que puede filtrar razonamiento interno en la salida visible si se deja habilitado implícitamente. MiniMax-M3 (y los M3.x compatibles hacia adelante) quedan exentos de este valor predeterminado: M3 emite bloques de pensamiento Anthropic correctos y requiere que el pensamiento esté activo para producir contenido visible, por lo que OpenClaw mantiene M3 en la ruta de pensamiento omitida/adaptativa del proveedor.
    </Warning>

    <Note>
    Las configuraciones con clave de API usan el id de proveedor `minimax`. Las referencias de modelo siguen la forma `minimax/MiniMax-M3`.
    </Note>

  </Tab>
</Tabs>

## Configurar mediante `openclaw configure`

Usa el asistente interactivo de configuración para configurar MiniMax sin editar JSON:

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
    Selecciona una de las opciones disponibles de MiniMax:

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

Para usar MiniMax para la generación de imágenes, establécelo como proveedor de generación de imágenes:

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
la ruta de autenticación incluida `minimax-portal` en su lugar.

La generación de imágenes siempre usa el endpoint dedicado de imágenes de MiniMax
(`/v1/image_generation`) e ignora `models.providers.minimax.baseUrl`,
ya que ese campo configura la URL base de chat/compatible con Anthropic. Establece
`MINIMAX_API_HOST=https://api.minimaxi.com` para enrutar la generación de imágenes
a través del endpoint de CN; el endpoint global predeterminado es
`https://api.minimax.io`.

Cuando la incorporación o la configuración con clave de API escribe entradas explícitas de `models.providers.minimax`,
OpenClaw materializa `MiniMax-M3`, `MiniMax-M2.7` y
`MiniMax-M2.7-highspeed` como modelos de chat. M3 anuncia entrada de texto e imagen;
la comprensión de imágenes sigue expuesta por separado mediante el proveedor de medios
`MiniMax-VL-01` propiedad del plugin.

<Note>
Consulta [Generación de imágenes](/es/tools/image-generation) para parámetros compartidos de la herramienta, selección de proveedor y comportamiento de conmutación por error.
</Note>

### Texto a voz

El plugin incluido `minimax` registra MiniMax T2A v2 como proveedor de voz para
`messages.tts`.

- Modelo TTS predeterminado: `speech-2.8-hd`
- Voz predeterminada: `English_expressive_narrator`
- Los ids de modelos incluidos admitidos incluyen `speech-2.8-hd`, `speech-2.8-turbo`,
  `speech-2.6-hd`, `speech-2.6-turbo`, `speech-02-hd`,
  `speech-02-turbo`, `speech-01-hd` y `speech-01-turbo`.
- La resolución de autenticación es `messages.tts.providers.minimax.apiKey`, luego
  perfiles de autenticación OAuth/token de `minimax-portal`, luego claves de entorno de
  Token Plan (`MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY`,
  `MINIMAX_CODING_API_KEY`) y luego `MINIMAX_API_KEY`.
- Si no hay ningún host TTS configurado, OpenClaw reutiliza el host OAuth
  configurado de `minimax-portal` y elimina sufijos de ruta compatibles con Anthropic
  como `/anthropic`.
- Los adjuntos de audio normales permanecen en MP3.
- Los destinos de nota de voz como Feishu y Telegram se transcodifican de MiniMax
  MP3 a Opus de 48 kHz con `ffmpeg`, porque la API de archivos de Feishu/Lark solo
  acepta `file_type: "opus"` para mensajes de audio nativos.
- MiniMax T2A acepta `speed` y `vol` fraccionales, pero `pitch` se envía como un
  entero; OpenClaw trunca los valores fraccionales de `pitch` antes de la solicitud a la API.

| Configuración                                   | Variable de entorno   | Predeterminado                | Descripción                         |
| ----------------------------------------------- | --------------------- | ----------------------------- | ----------------------------------- |
| `messages.tts.providers.minimax.baseUrl`        | `MINIMAX_API_HOST`    | `https://api.minimax.io`      | Host de la API MiniMax T2A.         |
| `messages.tts.providers.minimax.model`          | `MINIMAX_TTS_MODEL`   | `speech-2.8-hd`               | Id del modelo TTS.                  |
| `messages.tts.providers.minimax.speakerVoiceId` | `MINIMAX_TTS_VOICE_ID` | `English_expressive_narrator` | Id de voz usado para la salida de voz. |
| `messages.tts.providers.minimax.speed`          |                       | `1.0`                         | Velocidad de reproducción, `0.5..2.0`. |
| `messages.tts.providers.minimax.vol`            |                       | `1.0`                         | Volumen, `(0, 10]`.                 |
| `messages.tts.providers.minimax.pitch`          |                       | `0`                           | Desplazamiento de tono entero, `-12..12`. |

### Generación de música

El plugin MiniMax incluido registra la generación de música mediante la herramienta compartida
`music_generate` tanto para `minimax` como para `minimax-portal`.

- Modelo de música predeterminado: `minimax/music-2.6`
- Modelo de música OAuth: `minimax-portal/music-2.6`
- También admite `minimax/music-2.5` y `minimax/music-2.0`
- Controles del prompt: `lyrics`, `instrumental`
- Formato de salida: `mp3`
- Las ejecuciones respaldadas por sesión se desacoplan mediante el flujo compartido de tareas/estado, incluido `action: "status"`

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
Consulta [Generación de música](/es/tools/music-generation) para ver los parámetros compartidos de la herramienta, la selección de proveedor y el comportamiento de conmutación por error.
</Note>

### Generación de video

El Plugin MiniMax incluido registra la generación de video mediante la herramienta compartida
`video_generate` tanto para `minimax` como para `minimax-portal`.

- Modelo de video predeterminado: `minimax/MiniMax-Hailuo-2.3`
- Modelo de video OAuth: `minimax-portal/MiniMax-Hailuo-2.3`
- Modos: flujos de texto a video y referencia de una sola imagen
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
Consulta [Generación de video](/es/tools/video-generation) para ver los parámetros compartidos de la herramienta, la selección de proveedor y el comportamiento de conmutación por error.
</Note>

### Comprensión de imágenes

El Plugin MiniMax registra la comprensión de imágenes por separado del catálogo
de texto:

| ID de proveedor  | Modelo de imagen predeterminado |
| ---------------- | ------------------------------- |
| `minimax`        | `MiniMax-VL-01`                 |
| `minimax-portal` | `MiniMax-VL-01`                 |

Por eso el enrutamiento automático de medios puede usar la comprensión de imágenes de MiniMax incluso
cuando el catálogo de proveedor de texto incluido también contiene referencias de chat M3 con capacidad de imagen.

### Búsqueda web

El Plugin MiniMax también registra `web_search` mediante la API de búsqueda
MiniMax Token Plan.

- ID de proveedor: `minimax`
- Resultados estructurados: títulos, URLs, fragmentos, consultas relacionadas
- Variable de entorno preferida: `MINIMAX_CODE_PLAN_KEY`
- Alias de entorno aceptados: `MINIMAX_CODING_API_KEY`, `MINIMAX_OAUTH_TOKEN`
- Respaldo de compatibilidad: `MINIMAX_API_KEY` cuando ya apunta a una credencial de plan de tokens
- Reutilización de región: `plugins.entries.minimax.config.webSearch.region`, luego `MINIMAX_API_HOST`, luego las URLs base del proveedor MiniMax
- La búsqueda permanece en el ID de proveedor `minimax`; la configuración OAuth CN/global puede dirigir la región indirectamente mediante `models.providers.minimax-portal.baseUrl` y puede proporcionar autenticación bearer mediante `MINIMAX_OAUTH_TOKEN`

La configuración vive bajo `plugins.entries.minimax.config.webSearch.*`.

<Note>
Consulta [Búsqueda de MiniMax](/es/tools/minimax-search) para ver la configuración y el uso completos de la búsqueda web.
</Note>

## Configuración avanzada

<AccordionGroup>
  <Accordion title="Opciones de configuración">
    | Opción | Descripción |
    | --- | --- |
    | `models.providers.minimax.baseUrl` | Prefiere `https://api.minimax.io/anthropic` (compatible con Anthropic); `https://api.minimax.io/v1` es opcional para cargas útiles compatibles con OpenAI |
    | `models.providers.minimax.api` | Prefiere `anthropic-messages`; `openai-completions` es opcional para cargas útiles compatibles con OpenAI |
    | `models.providers.minimax.apiKey` | Clave de API de MiniMax (`MINIMAX_API_KEY`) |
    | `models.providers.minimax.models` | Define `id`, `name`, `reasoning`, `contextWindow`, `maxTokens`, `cost` |
    | `agents.defaults.models` | Asigna alias a los modelos que quieres en la lista de permitidos |
    | `models.mode` | Mantén `merge` si quieres agregar MiniMax junto con los integrados |
  </Accordion>

  <Accordion title="Valores predeterminados de razonamiento">
    En `api: "anthropic-messages"`, OpenClaw inyecta `thinking: { type: "disabled" }` para los modelos MiniMax M2.x salvo que el razonamiento ya se haya definido explícitamente en params/config.

    Esto evita que el endpoint de streaming de M2.x emita `reasoning_content` en fragmentos delta de estilo OpenAI, lo que filtraría el razonamiento interno en la salida visible.

    MiniMax-M3 (y M3.x) está exento: M3 emite bloques de razonamiento Anthropic adecuados y devuelve un arreglo `content` vacío con `stop_reason: "end_turn"` cuando el razonamiento está deshabilitado, por lo que el wrapper mantiene M3 en la ruta de razonamiento omitida/adaptativa del proveedor.

  </Accordion>

  <Accordion title="Modo rápido">
    `/fast on` o `params.fastMode: true` reescribe `MiniMax-M2.7` a `MiniMax-M2.7-highspeed` en la ruta de streaming compatible con Anthropic.
  </Accordion>

  <Accordion title="Ejemplo de respaldo">
    **Ideal para:** mantener tu modelo más potente de última generación como principal y conmutar a MiniMax M2.7 si falla. El ejemplo siguiente usa Opus como principal concreto; cámbialo por tu modelo principal de última generación preferido.

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
    - API de uso de Coding Plan: `https://api.minimaxi.com/v1/token_plan/remains` o `https://api.minimax.io/v1/token_plan/remains` (requiere una clave de plan de codificación).
    - El sondeo de uso deriva el host desde `models.providers.minimax-portal.baseUrl` o `models.providers.minimax.baseUrl` cuando están configurados, por lo que las configuraciones globales que usan `https://api.minimax.io/anthropic` sondean `api.minimax.io`. Las URLs base faltantes o mal formadas mantienen el respaldo CN por compatibilidad.
    - OpenClaw normaliza el uso del plan de codificación de MiniMax al mismo visor de `% left` usado por otros proveedores. Los campos sin procesar `usage_percent` / `usagePercent` de MiniMax son cuota restante, no cuota consumida, por lo que OpenClaw los invierte. Los campos basados en conteo tienen prioridad cuando están presentes.
    - Cuando la API devuelve `model_remains`, OpenClaw prefiere la entrada del modelo de chat, deriva la etiqueta de ventana desde `start_time` / `end_time` cuando hace falta e incluye el nombre del modelo seleccionado en la etiqueta del plan para que las ventanas de plan de codificación sean más fáciles de distinguir.
    - Las instantáneas de uso tratan `minimax`, `minimax-cn` y `minimax-portal` como la misma superficie de cuota de MiniMax, y prefieren el OAuth de MiniMax almacenado antes de recurrir a variables de entorno de clave de Coding Plan.

  </Accordion>
</AccordionGroup>

## Notas

- Las referencias de modelo siguen la ruta de autenticación:
  - Configuración con clave de API: `minimax/<model>`
  - Configuración OAuth: `minimax-portal/<model>`
- Modelo de chat predeterminado: `MiniMax-M3`
- Modelos de chat alternativos: `MiniMax-M2.7`, `MiniMax-M2.7-highspeed`
- La incorporación y la configuración directa con clave de API escriben definiciones de modelo para M3 y ambas variantes de M2.7
- La comprensión de imágenes usa el proveedor de medios `MiniMax-VL-01`, propiedad del Plugin
- Actualiza los valores de precios en `models.json` si necesitas seguimiento exacto de costos
- Usa `openclaw models list` para confirmar el ID de proveedor actual y luego cambia con `openclaw models set minimax/MiniMax-M3` o `openclaw models set minimax-portal/MiniMax-M3`

<Tip>
Enlace de referido para MiniMax Coding Plan (10 % de descuento): [MiniMax Coding Plan](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
</Tip>

<Note>
Consulta [Proveedores de modelos](/es/concepts/model-providers) para ver las reglas de proveedores.
</Note>

## Solución de problemas

<AccordionGroup>
  <Accordion title='"Modelo desconocido: minimax/MiniMax-M3"'>
    Esto normalmente significa que el **proveedor MiniMax no está configurado** (no se encontró una entrada de proveedor coincidente ni un perfil de autenticación/clave de entorno de MiniMax). Hay una corrección para esta detección en **2026.1.12**. Corrígelo así:

    - Actualiza a **2026.1.12** (o ejecuta desde el código fuente `main`) y luego reinicia el Gateway.
    - Ejecuta `openclaw configure` y selecciona una opción de autenticación **MiniMax**, o
    - Agrega manualmente el bloque `models.providers.minimax` o `models.providers.minimax-portal` correspondiente, o
    - Define `MINIMAX_API_KEY`, `MINIMAX_OAUTH_TOKEN` o un perfil de autenticación MiniMax para que pueda inyectarse el proveedor correspondiente.

    Asegúrate de que el ID del modelo sea **sensible a mayúsculas y minúsculas**:

    - Ruta con clave de API: `minimax/MiniMax-M3`, `minimax/MiniMax-M2.7` o `minimax/MiniMax-M2.7-highspeed`
    - Ruta OAuth: `minimax-portal/MiniMax-M3`, `minimax-portal/MiniMax-M2.7` o `minimax-portal/MiniMax-M2.7-highspeed`

    Luego vuelve a comprobar con:

    ```bash
    openclaw models list
    ```

  </Accordion>
</AccordionGroup>

<Note>
Más ayuda: [Solución de problemas](/es/help/troubleshooting) y [Preguntas frecuentes](/es/help/faq).
</Note>

## Relacionado

<CardGroup cols={2}>
  <Card title="Selección de modelo" href="/es/concepts/model-providers" icon="layers">
    Elección de proveedores, referencias de modelo y comportamiento de conmutación por error.
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
    Configuración de búsqueda web mediante MiniMax Token Plan.
  </Card>
  <Card title="Solución de problemas" href="/es/help/troubleshooting" icon="wrench">
    Solución general de problemas y preguntas frecuentes.
  </Card>
</CardGroup>
