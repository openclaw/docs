---
read_when:
    - Quieres modelos MiniMax en OpenClaw
    - Necesitas orientación para configurar MiniMax
summary: Usa modelos de MiniMax en OpenClaw
title: MiniMax
x-i18n:
    generated_at: "2026-07-05T11:40:48Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1172d2d2c92dc92858f15564eee9ffeb8eb9599ee70157116fd2e302556dd75a
    source_path: providers/minimax.md
    workflow: 16
---

  El Plugin `minimax` incluido registra dos proveedores más cinco capacidades: chat, generación de imágenes, generación de música, generación de video, comprensión de imágenes, voz (T2A v2) y búsqueda web.

  | ID de proveedor  | Auth          | Capacidades                                                                                               |
  | ---------------- | ------------- | --------------------------------------------------------------------------------------------------------- |
  | `minimax`        | Clave de API  | Texto, generación de imágenes, generación de música, generación de video, comprensión de imágenes, voz, búsqueda web |
  | `minimax-portal` | OAuth         | Texto, generación de imágenes, generación de música, generación de video, comprensión de imágenes, voz     |

  <Tip>
  Enlace de referido para MiniMax Coding Plan (10% de descuento): [MiniMax Coding Plan](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
  </Tip>

  ## Catálogo integrado

  | Modelo                   | Tipo                  | Descripción                                      |
  | ------------------------ | --------------------- | ------------------------------------------------ |
  | `MiniMax-M3`             | Chat (razonamiento)   | Modelo de razonamiento alojado predeterminado    |
  | `MiniMax-M2.7`           | Chat (razonamiento)   | Modelo de razonamiento alojado anterior          |
  | `MiniMax-M2.7-highspeed` | Chat (razonamiento)   | Nivel de razonamiento M2.7 más rápido            |
  | `MiniMax-VL-01`          | Visión                | Modelo de comprensión de imágenes                |
  | `image-01`               | Generación de imágenes | Edición de texto a imagen e imagen a imagen     |
  | `music-2.6`              | Generación de música  | Modelo de música predeterminado                  |
  | `MiniMax-Hailuo-2.3`     | Generación de video   | Flujos de texto a video e imagen a video         |

  Las referencias de modelo siguen la ruta de autenticación: `minimax/<model>` para configuraciones con clave de API, `minimax-portal/<model>` para configuraciones con OAuth.

  ## Primeros pasos

  <Tabs>
  <Tab title="OAuth (Coding Plan)">
    **Ideal para:** configuración rápida con MiniMax Coding Plan mediante OAuth, sin requerir clave de API.

    <Tabs>
      <Tab title="Internacional">
        <Steps>
          <Step title="Ejecutar onboarding">
            ```bash
            openclaw onboard --auth-choice minimax-global-oauth
            ```

            URL base del proveedor resultante: `api.minimax.io`.
          </Step>
          <Step title="Verificar que el modelo esté disponible">
            ```bash
            openclaw models list --provider minimax-portal
            ```
          </Step>
        </Steps>
      </Tab>
      <Tab title="China">
        <Steps>
          <Step title="Ejecutar onboarding">
            ```bash
            openclaw onboard --auth-choice minimax-cn-oauth
            ```

            URL base del proveedor resultante: `api.minimaxi.com`.
          </Step>
          <Step title="Verificar que el modelo esté disponible">
            ```bash
            openclaw models list --provider minimax-portal
            ```
          </Step>
        </Steps>
      </Tab>
    </Tabs>

    <Note>
    Las configuraciones con OAuth usan el ID de proveedor `minimax-portal`. Las referencias de modelo siguen el formato `minimax-portal/MiniMax-M3`.
    </Note>

  </Tab>

  <Tab title="Clave de API">
    **Ideal para:** MiniMax alojado con API compatible con Anthropic.

    <Tabs>
      <Tab title="Internacional">
        <Steps>
          <Step title="Ejecutar onboarding">
            ```bash
            openclaw onboard --auth-choice minimax-global-api
            ```

            Esto configura `api.minimax.io` como URL base.
          </Step>
          <Step title="Verificar que el modelo esté disponible">
            ```bash
            openclaw models list --provider minimax
            ```
          </Step>
        </Steps>
      </Tab>
      <Tab title="China">
        <Steps>
          <Step title="Ejecutar onboarding">
            ```bash
            openclaw onboard --auth-choice minimax-cn-api
            ```

            Esto configura `api.minimaxi.com` como URL base.
          </Step>
          <Step title="Verificar que el modelo esté disponible">
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
    El endpoint de streaming compatible con Anthropic de MiniMax-M2.x emite `reasoning_content` en fragmentos delta de estilo OpenAI en lugar de bloques de pensamiento nativos de Anthropic, lo que filtra el razonamiento interno en la salida visible si el pensamiento queda habilitado implícitamente. OpenClaw deshabilita el pensamiento de M2.x de forma predeterminada, a menos que configures explícitamente `thinking` por tu cuenta. MiniMax-M3 (y M3.x compatible hacia adelante) está exento: M3 emite bloques de pensamiento de Anthropic adecuados y requiere el pensamiento activo para producir contenido visible, por lo que OpenClaw mantiene M3 en la ruta de pensamiento adaptativo del proveedor. Consulta la sección de valores predeterminados de Thinking en Configuración avanzada más abajo.
    </Warning>

    <Note>
    Las configuraciones con clave de API usan el ID de proveedor `minimax`. Las referencias de modelo siguen el formato `minimax/MiniMax-M3`.
    </Note>

  </Tab>
</Tabs>

## Configurar mediante `openclaw configure`

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
    | Opción de autenticación | Descripción                         |
    | ----------------------- | ----------------------------------- |
    | `minimax-global-oauth` | OAuth internacional (Coding Plan)   |
    | `minimax-cn-oauth`     | OAuth de China (Coding Plan)        |
    | `minimax-global-api`   | Clave de API internacional          |
    | `minimax-cn-api`       | Clave de API de China               |
  </Step>
  <Step title="Elige tu modelo predeterminado">
    Selecciona tu modelo predeterminado cuando se te solicite.
  </Step>
</Steps>

## Capacidades

### Generación de imágenes

El Plugin MiniMax registra el modelo `image-01` para la herramienta `image_generate` tanto en `minimax` como en `minimax-portal`, reutilizando la misma autenticación `MINIMAX_API_KEY` u OAuth que los modelos de texto.

- Generación de texto a imagen y edición de imagen a imagen (referencia de sujeto), ambas con control de relación de aspecto
- Hasta 9 imágenes de salida por solicitud, 1 imagen de referencia por solicitud de edición
- Relaciones de aspecto admitidas: `1:1`, `16:9`, `4:3`, `3:2`, `2:3`, `3:4`, `9:16`, `21:9`

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: { primary: "minimax/image-01" },
    },
  },
}
```

La generación de imágenes siempre usa el endpoint de imagen dedicado de MiniMax (`/v1/image_generation`) e ignora `models.providers.minimax.baseUrl`, ya que ese campo configura en su lugar la URL base compatible con chat/Anthropic. Define `MINIMAX_API_HOST=https://api.minimaxi.com` para enrutar la generación de imágenes a través del endpoint de CN; el endpoint global predeterminado es `https://api.minimax.io`.

<Note>
Consulta [Generación de imágenes](/es/tools/image-generation) para ver los parámetros compartidos de la herramienta, la selección de proveedor y el comportamiento de conmutación por error.
</Note>

### Texto a voz

El Plugin `minimax` incluido registra MiniMax T2A v2 como proveedor de voz para `messages.tts`.

- Modelo TTS predeterminado: `speech-2.8-hd`
- Voz predeterminada: `English_expressive_narrator`
- Ids de modelos incluidos: `speech-2.8-hd`, `speech-2.8-turbo`, `speech-2.6-hd`, `speech-2.6-turbo`, `speech-02-hd`, `speech-02-turbo`, `speech-01-hd`, `speech-01-turbo`, `speech-01-240228`
- Orden de resolución de autenticación: `messages.tts.providers.minimax.apiKey`, luego perfiles de autenticación OAuth/token de `minimax-portal`, luego claves de entorno Token Plan (`MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`), luego `MINIMAX_API_KEY`
- Si no se configura ningún host de TTS, OpenClaw reutiliza el host OAuth configurado de `minimax-portal` y elimina sufijos de ruta compatibles con Anthropic como `/anthropic`
- Los adjuntos de audio normales permanecen en MP3. Los destinos de notas de voz (Feishu, Telegram y otros canales que solicitan un adjunto compatible con notas de voz) se transcodifican de MP3 de MiniMax a Opus de 48 kHz con `ffmpeg`, porque, por ejemplo, la API de archivos de Feishu/Lark solo acepta `file_type: "opus"` para mensajes de audio nativos
- MiniMax T2A acepta valores fraccionarios para `speed` y `vol`, pero `pitch` se envía como entero; OpenClaw trunca los valores fraccionarios de `pitch` antes de la solicitud a la API

| Configuración                           | Variable de entorno   | Predeterminado               | Descripción                                  |
| --------------------------------------- | --------------------- | ---------------------------- | -------------------------------------------- |
| `messages.tts.providers.minimax.baseUrl` | `MINIMAX_API_HOST`     | `https://api.minimax.io`      | Host de la API MiniMax T2A.                  |
| `messages.tts.providers.minimax.model`   | `MINIMAX_TTS_MODEL`    | `speech-2.8-hd`               | Id del modelo TTS.                           |
| `messages.tts.providers.minimax.voiceId` | `MINIMAX_TTS_VOICE_ID` | `English_expressive_narrator` | Id de voz usado para la salida de voz.       |
| `messages.tts.providers.minimax.speed`   |                        | `1.0`                         | Velocidad de reproducción, `0.5..2.0`.       |
| `messages.tts.providers.minimax.vol`     |                        | `1.0`                         | Volumen, `(0, 10]`.                          |
| `messages.tts.providers.minimax.pitch`   |                        | `0`                           | Desplazamiento de tono entero, `-12..12`.    |

### Generación de música

El Plugin MiniMax incluido registra la generación de música mediante la herramienta compartida `music_generate` tanto para `minimax` como para `minimax-portal`.

- Modelo de música predeterminado: `minimax/music-2.6` (OAuth: `minimax-portal/music-2.6`)
- También admite `music-2.6-free`, `music-cover` y `music-cover-free`
- Controles de prompt: `lyrics`, `instrumental`
- Formato de salida: `mp3`
- Las ejecuciones respaldadas por sesión se desacoplan mediante el flujo compartido de tarea/estado, incluido `action: "status"`

```json5
{
  agents: {
    defaults: {
      musicGenerationModel: { primary: "minimax/music-2.6" },
    },
  },
}
```

<Note>
Consulta [Generación de música](/es/tools/music-generation) para ver los parámetros compartidos de la herramienta, la selección de proveedor y el comportamiento de conmutación por error.
</Note>

### Generación de video

El Plugin MiniMax incluido registra la generación de video mediante la herramienta compartida `video_generate` tanto para `minimax` como para `minimax-portal`.

- Modelo de video predeterminado: `minimax/MiniMax-Hailuo-2.3` (OAuth: `minimax-portal/MiniMax-Hailuo-2.3`)
- También admite `MiniMax-Hailuo-2.3-Fast`, `MiniMax-Hailuo-02`, `I2V-01-Director`, `I2V-01-live` e `I2V-01`
- Modos: flujos de texto a video y de referencia de una sola imagen
- Admite `resolution` (`768P` o `1080P` en modelos Hailuo 2.3/02); `aspectRatio` no es compatible y se ignora

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: { primary: "minimax/MiniMax-Hailuo-2.3" },
    },
  },
}
```

<Note>
Consulta [Generación de video](/es/tools/video-generation) para ver los parámetros compartidos de herramientas, la selección de proveedores y el comportamiento de conmutación por error.
</Note>

### Comprensión de imágenes

El Plugin MiniMax registra la comprensión de imágenes por separado del catálogo de texto:

| ID de proveedor  | Modelo de imagen predeterminado | Extracción de texto de PDF |
| ---------------- | ------------------------------- | -------------------------- |
| `minimax`        | `MiniMax-VL-01`                 | `MiniMax-M2.7`             |
| `minimax-portal` | `MiniMax-VL-01`                 | `MiniMax-M2.7`             |

Por eso el enrutamiento automático de medios puede usar la comprensión de imágenes de MiniMax incluso cuando el catálogo de proveedor de texto incluido también contiene refs de chat compatibles con imágenes M3. La comprensión de PDF usa `MiniMax-M2.7` solo para extracción de texto; MiniMax no registra una ruta de conversión de PDF a imagen.

### Búsqueda web

El Plugin MiniMax también registra `web_search` mediante la API de búsqueda MiniMax Token Plan (`/v1/coding_plan/search`).

- ID de proveedor: `minimax`
- Resultados estructurados: títulos, URL, fragmentos, consultas relacionadas
- Variable de entorno preferida: `MINIMAX_CODE_PLAN_KEY`
- Alias de entorno aceptados: `MINIMAX_CODING_API_KEY`, `MINIMAX_OAUTH_TOKEN`
- Respaldo de compatibilidad: `MINIMAX_API_KEY` cuando ya apunta a una credencial de token-plan
- Reutilización de región: `plugins.entries.minimax.config.webSearch.region`, luego `MINIMAX_API_HOST`, luego las URL base del proveedor MiniMax
- La búsqueda permanece en el ID de proveedor `minimax`; la configuración OAuth CN/global puede dirigir la región indirectamente mediante `models.providers.minimax-portal.baseUrl` y puede proporcionar autenticación bearer mediante `MINIMAX_OAUTH_TOKEN`

La configuración se encuentra en `plugins.entries.minimax.config.webSearch.*`.

<Note>
Consulta [Búsqueda MiniMax](/es/tools/minimax-search) para ver la configuración y el uso completos de la búsqueda web.
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
    | `agents.defaults.models` | Asigna alias a los modelos que quieres en la lista de permitidos |
    | `models.mode` | Mantén `merge` si quieres agregar MiniMax junto con los integrados |
  </Accordion>

  <Accordion title="Valores predeterminados de razonamiento">
    En `api: "anthropic-messages"`, OpenClaw inyecta `thinking: { type: "disabled" }` para modelos MiniMax M2.x, a menos que un wrapper anterior ya haya establecido el campo `thinking` en el payload. Esto evita que el endpoint de streaming de M2.x emita `reasoning_content` en fragmentos delta de estilo OpenAI, lo que filtraría razonamiento interno en la salida visible.

    MiniMax-M3 (y M3.x) está exento: M3 devuelve un array `content` vacío con `stop_reason: "end_turn"` cuando el razonamiento está deshabilitado, por lo que OpenClaw elimina el valor predeterminado deshabilitado implícito para M3 y, cuando se establece un nivel de razonamiento, fuerza `thinking: { type: "adaptive" }` en su lugar.

    Niveles de razonamiento disponibles por familia de modelos:

    | Familia de modelos | Niveles                                  | Predeterminado |
    | ------------------ | ---------------------------------------- | -------------- |
    | `MiniMax-M3`       | `off`, `adaptive`                        | `adaptive`     |
    | `MiniMax-M2.x`     | `off`, `minimal`, `low`, `medium`, `high` | `off`          |

  </Accordion>

  <Accordion title="Modo rápido">
    `/fast on` o `params.fastMode: true` reescribe `MiniMax-M2.7` como `MiniMax-M2.7-highspeed` en la ruta de streaming compatible con Anthropic (`api: "anthropic-messages"`, proveedor `minimax` o `minimax-portal`).
  </Accordion>

  <Accordion title="Ejemplo de respaldo">
    **Ideal para:** mantener tu modelo de última generación más potente como principal y conmutar por error a MiniMax M2.7. El ejemplo siguiente usa Opus como principal concreto; cámbialo por tu modelo principal de última generación preferido.

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
    - API de uso de Coding Plan: `https://api.minimaxi.com/v1/token_plan/remains` o `https://api.minimax.io/v1/token_plan/remains` (requiere una clave de coding plan).
    - El sondeo de uso deriva el host de `models.providers.minimax-portal.baseUrl` o `models.providers.minimax.baseUrl` cuando están configurados, por lo que las configuraciones globales que usan `https://api.minimax.io/anthropic` sondean `api.minimax.io`. Las URL base faltantes o mal formadas mantienen el respaldo CN por compatibilidad.
    - OpenClaw normaliza el uso de MiniMax coding-plan a la misma visualización de `% left` usada por otros proveedores. Los campos sin procesar `usage_percent` / `usagePercent` de MiniMax son cuota restante, no cuota consumida, por lo que OpenClaw los invierte. Los campos basados en conteo tienen prioridad cuando están presentes.
    - Cuando la API devuelve `model_remains`, OpenClaw prefiere la entrada del modelo de chat, deriva la etiqueta de ventana a partir de `start_time` / `end_time` cuando es necesario e incluye el nombre del modelo seleccionado en la etiqueta del plan para que las ventanas de coding-plan sean más fáciles de distinguir.
    - Las instantáneas de uso tratan `minimax`, `minimax-cn`, `minimax-portal` y `minimax-portal-cn` como la misma superficie de cuota de MiniMax, y prefieren el OAuth de MiniMax almacenado antes de recurrir a variables de entorno de clave de Coding Plan.

  </Accordion>
</AccordionGroup>

## Notas

- Modelo de chat predeterminado: `MiniMax-M3`. Modelos de chat alternativos: `MiniMax-M2.7`, `MiniMax-M2.7-highspeed`
- La incorporación y la configuración directa con clave de API escriben definiciones de modelos para M3 y ambas variantes M2.7
- La comprensión de imágenes usa el proveedor de medios `MiniMax-VL-01` propiedad del Plugin
- Actualiza los valores de precios en `models.json` si necesitas seguimiento exacto de costos
- Usa `openclaw models list` para confirmar el ID de proveedor actual y luego cambia con `openclaw models set minimax/MiniMax-M3` o `openclaw models set minimax-portal/MiniMax-M3`

<Note>
Consulta [Proveedores de modelos](/es/concepts/model-providers) para ver las reglas de proveedores.
</Note>

## Solución de problemas

<AccordionGroup>
  <Accordion title='"Modelo desconocido: minimax/MiniMax-M3"'>
    Esto suele significar que el **proveedor MiniMax no está configurado** (no se encontró ninguna entrada de proveedor coincidente ni ningún perfil de autenticación/clave de entorno de MiniMax). Corrígelo de la siguiente manera:

    - Ejecutando `openclaw configure` y seleccionando una opción de autenticación de **MiniMax**, o
    - Agregando manualmente el bloque `models.providers.minimax` o `models.providers.minimax-portal` correspondiente, o
    - Estableciendo `MINIMAX_API_KEY`, `MINIMAX_OAUTH_TOKEN` o un perfil de autenticación de MiniMax para que se pueda inyectar el proveedor correspondiente.

    Asegúrate de que el ID del modelo **distinga mayúsculas y minúsculas**:

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
  <Card title="Selección de modelos" href="/es/concepts/model-providers" icon="layers">
    Elegir proveedores, refs de modelos y comportamiento de conmutación por error.
  </Card>
  <Card title="Generación de imágenes" href="/es/tools/image-generation" icon="image">
    Parámetros compartidos de la herramienta de imágenes y selección de proveedores.
  </Card>
  <Card title="Generación de música" href="/es/tools/music-generation" icon="music">
    Parámetros compartidos de la herramienta de música y selección de proveedores.
  </Card>
  <Card title="Generación de video" href="/es/tools/video-generation" icon="video">
    Parámetros compartidos de la herramienta de video y selección de proveedores.
  </Card>
  <Card title="Búsqueda MiniMax" href="/es/tools/minimax-search" icon="magnifying-glass">
    Configuración de búsqueda web mediante MiniMax Token Plan.
  </Card>
  <Card title="Solución de problemas" href="/es/help/troubleshooting" icon="wrench">
    Solución de problemas general y preguntas frecuentes.
  </Card>
</CardGroup>
