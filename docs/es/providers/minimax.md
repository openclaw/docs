---
read_when:
    - Quieres usar los modelos de MiniMax en OpenClaw
    - Necesita orientación para configurar MiniMax
summary: Usar modelos de MiniMax en OpenClaw
title: MiniMax
x-i18n:
    generated_at: "2026-07-19T02:23:13Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 9ce1329cedc88128aaca3eb132be433f7115edb30368dda6df7ab115cc46031c
    source_path: providers/minimax.md
    workflow: 16
---

El plugin `minimax` incluido registra dos proveedores y cinco capacidades: chat, generación de imágenes, generación de música, generación de vídeo, comprensión de imágenes, voz (T2A v2) y búsqueda web.

| ID del proveedor | Autenticación | Capacidades                                                                                             |
| ---------------- | ------------- | ------------------------------------------------------------------------------------------------------- |
| `minimax`        | Clave de API  | Texto, generación de imágenes, generación de música, generación de vídeo, comprensión de imágenes, voz, búsqueda web |
| `minimax-portal` | OAuth         | Texto, generación de imágenes, generación de música, generación de vídeo, comprensión de imágenes, voz            |

<Tip>
Enlace de recomendación para MiniMax Coding Plan (10 % de descuento): [MiniMax Coding Plan](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
</Tip>

## Catálogo integrado

| Modelo                   | Tipo                  | Descripción                                      |
| ------------------------ | --------------------- | ------------------------------------------------ |
| `MiniMax-M3`             | Chat (razonamiento)   | Modelo de razonamiento alojado predeterminado    |
| `MiniMax-M2.7`           | Chat (razonamiento)   | Modelo de razonamiento alojado anterior          |
| `MiniMax-M2.7-highspeed` | Chat (razonamiento)   | Nivel de razonamiento M2.7 más rápido             |
| `MiniMax-VL-01`          | Visión                | Modelo de comprensión de imágenes                |
| `image-01`               | Generación de imágenes | Edición de texto a imagen y de imagen a imagen   |
| `music-2.6`              | Generación de música  | Modelo de música predeterminado                   |
| `MiniMax-Hailuo-2.3`     | Generación de vídeo   | Flujos de texto a vídeo y de imagen a vídeo       |

Las referencias de modelos siguen la ruta de autenticación: `minimax/<model>` para configuraciones con clave de API y `minimax-portal/<model>` para configuraciones con OAuth.

## Primeros pasos

<Tabs>
  <Tab title="OAuth (Coding Plan)">
    **Opción recomendada para:** una configuración rápida con MiniMax Coding Plan mediante OAuth, sin necesidad de una clave de API.

    <Tabs>
      <Tab title="Internacional">
        <Steps>
          <Step title="Ejecutar la incorporación">
            ```bash
            openclaw onboard --auth-choice minimax-global-oauth
            ```

            URL base resultante del proveedor: `api.minimax.io`.
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
          <Step title="Ejecutar la incorporación">
            ```bash
            openclaw onboard --auth-choice minimax-cn-oauth
            ```

            URL base resultante del proveedor: `api.minimaxi.com`.
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
    Las configuraciones con OAuth usan el ID de proveedor `minimax-portal`. Las referencias de modelos siguen el formato `minimax-portal/MiniMax-M3`.
    </Note>

  </Tab>

  <Tab title="Clave de API">
    **Opción recomendada para:** MiniMax alojado con una API compatible con Anthropic.

    <Tabs>
      <Tab title="Internacional">
        <Steps>
          <Step title="Ejecutar la incorporación">
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
          <Step title="Ejecutar la incorporación">
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
    El endpoint de transmisión compatible con Anthropic de MiniMax-M2.x emite `reasoning_content` en fragmentos delta con el formato de OpenAI en lugar de bloques de pensamiento nativos de Anthropic, lo que expone el razonamiento interno en la salida visible si el pensamiento se deja habilitado implícitamente. OpenClaw deshabilita el pensamiento de M2.x de forma predeterminada, salvo que se establezca explícitamente `thinking`. MiniMax-M3 (y las versiones M3.x compatibles en el futuro) queda exento: M3 emite bloques de pensamiento de Anthropic adecuados y requiere que el pensamiento esté activo para producir contenido visible, por lo que OpenClaw mantiene M3 en la ruta de pensamiento adaptativo del proveedor. Consulte la sección Valores predeterminados de pensamiento en Configuración avanzada más adelante.
    </Warning>

    <Note>
    Las configuraciones con clave de API usan el ID de proveedor `minimax`. Las referencias de modelos siguen el formato `minimax/MiniMax-M3`.
    </Note>

  </Tab>
</Tabs>

## Configuración mediante `openclaw configure`

<Steps>
  <Step title="Iniciar el asistente">
    ```bash
    openclaw configure
    ```
  </Step>
  <Step title="Seleccionar Model/auth">
    Seleccione **Model/auth** en el menú.
  </Step>
  <Step title="Elegir una opción de autenticación de MiniMax">
    | Opción de autenticación | Descripción                         |
    | ----------------------- | ----------------------------------- |
    | `minimax-global-oauth` | OAuth internacional (Coding Plan)   |
    | `minimax-cn-oauth`     | OAuth de China (Coding Plan)        |
    | `minimax-global-api`   | Clave de API internacional          |
    | `minimax-cn-api`       | Clave de API de China               |
  </Step>
  <Step title="Elegir el modelo predeterminado">
    Seleccione el modelo predeterminado cuando se le solicite.
  </Step>
</Steps>

## Capacidades

### Generación de imágenes

El plugin MiniMax registra el modelo `image-01` para la herramienta `image_generate` tanto en `minimax` como en `minimax-portal`, reutilizando la misma autenticación `MINIMAX_API_KEY` u OAuth que los modelos de texto.

- Generación de texto a imagen y edición de imagen a imagen (referencia del sujeto), ambas con control de relación de aspecto
- Hasta 9 imágenes de salida por solicitud y 1 imagen de referencia por solicitud de edición
- Relaciones de aspecto compatibles: `1:1`, `16:9`, `4:3`, `3:2`, `2:3`, `3:4`, `9:16`, `21:9`

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: { primary: "minimax/image-01" },
    },
  },
}
```

La generación de imágenes siempre utiliza el endpoint de imágenes específico de MiniMax (`/v1/image_generation`) e ignora `models.providers.minimax.baseUrl`, ya que ese campo configura la URL base del chat compatible con Anthropic. Establezca `MINIMAX_API_HOST=https://api.minimaxi.com` para dirigir la generación de imágenes a través del endpoint de China; el endpoint global predeterminado es `https://api.minimax.io`.

<Note>
Consulte [Generación de imágenes](/es/tools/image-generation) para conocer los parámetros compartidos de la herramienta, la selección del proveedor y el comportamiento de conmutación por error.
</Note>

### Texto a voz

El plugin `minimax` incluido registra MiniMax T2A v2 como proveedor de voz para `messages.tts`.

- Modelo TTS predeterminado: `speech-2.8-hd`
- Voz predeterminada: `English_expressive_narrator`
- IDs de modelos incluidos: `speech-2.8-hd`, `speech-2.8-turbo`, `speech-2.6-hd`, `speech-2.6-turbo`, `speech-02-hd`, `speech-02-turbo`, `speech-01-hd`, `speech-01-turbo`
- Orden de resolución de la autenticación: `messages.tts.providers.minimax.apiKey`, luego perfiles de autenticación OAuth/token de `minimax-portal`, después claves de entorno de Token Plan (`MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`) y, por último, `MINIMAX_API_KEY`
- Si no se configura ningún host de TTS, OpenClaw reutiliza el host OAuth `minimax-portal` configurado y elimina los sufijos de ruta compatibles con Anthropic, como `/anthropic`
- Los archivos adjuntos de audio normales se mantienen en MP3. Los destinos de notas de voz (Feishu, Telegram y otros canales que solicitan un archivo adjunto compatible con notas de voz) se transcodifican de MP3 de MiniMax a Opus de 48 kHz mediante `ffmpeg`, porque, por ejemplo, la API de archivos de Feishu/Lark solo acepta `file_type: "opus"` para mensajes de audio nativos
- MiniMax T2A acepta valores fraccionarios de `speed` y `vol`, pero `pitch` se envía como entero; OpenClaw trunca los valores fraccionarios de `pitch` antes de la solicitud a la API

| Ajuste                                    | Variable de entorno    | Valor predeterminado           | Descripción                                 |
| ----------------------------------------- | ---------------------- | ------------------------------ | ------------------------------------------- |
| `messages.tts.providers.minimax.baseUrl` | `MINIMAX_API_HOST`     | `https://api.minimax.io`      | Host de la API T2A de MiniMax.              |
| `messages.tts.providers.minimax.model`   | `MINIMAX_TTS_MODEL`    | `speech-2.8-hd`               | ID del modelo TTS.                          |
| `messages.tts.providers.minimax.voiceId` | `MINIMAX_TTS_VOICE_ID` | `English_expressive_narrator` | ID de voz utilizado para la salida de voz.  |
| `messages.tts.providers.minimax.speed`   |                        | `1.0`                         | Velocidad de reproducción, `0.5..2.0`. |
| `messages.tts.providers.minimax.vol`     |                        | `1.0`                         | Volumen, `(0, 10]`.                |
| `messages.tts.providers.minimax.pitch`   |                        | `0`                           | Desplazamiento entero del tono, `-12..12`. |

### Generación de música

El plugin MiniMax incluido registra la generación de música mediante la herramienta compartida `music_generate` tanto para `minimax` como para `minimax-portal`.

- Modelo de música predeterminado: `minimax/music-2.6` (OAuth: `minimax-portal/music-2.6`)
- También admite `music-2.6-free`, `music-cover` y `music-cover-free`
- Controles del prompt: `lyrics`, `instrumental`
- Formato de salida: `mp3`
- Las ejecuciones respaldadas por sesiones se desacoplan mediante el flujo compartido de tareas y estado, incluido `action: "status"`

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
Consulte [Generación de música](/es/tools/music-generation) para conocer los parámetros compartidos de la herramienta, la selección del proveedor y el comportamiento de conmutación por error.
</Note>

### Generación de vídeo

El plugin MiniMax incluido registra la generación de vídeo mediante la herramienta compartida `video_generate` tanto para `minimax` como para `minimax-portal`.

- Modelo de vídeo predeterminado: `minimax/MiniMax-Hailuo-2.3` (OAuth: `minimax-portal/MiniMax-Hailuo-2.3`)
- También admite `MiniMax-Hailuo-2.3-Fast`, `MiniMax-Hailuo-02`, `I2V-01-Director`, `I2V-01-live` y `I2V-01`
- Modos: flujos de texto a vídeo y de referencia con una sola imagen
- Admite `resolution` (`768P` o `1080P` en los modelos Hailuo 2.3/02); `aspectRatio` no es compatible y se ignora

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
Consulte [Generación de vídeo](/es/tools/video-generation) para conocer los parámetros compartidos de la herramienta, la selección de proveedores y el comportamiento de conmutación por error.
</Note>

### Comprensión de imágenes

El plugin MiniMax registra la comprensión de imágenes por separado del catálogo de texto:

| ID de proveedor      | Modelo de imagen predeterminado | Extracción de texto de PDF |
| ---------------- | ------------------- | ------------------- |
| `minimax`        | `MiniMax-VL-01`     | `MiniMax-M2.7`      |
| `minimax-portal` | `MiniMax-VL-01`     | `MiniMax-M2.7`      |

Por eso, el enrutamiento automático de contenido multimedia puede usar la comprensión de imágenes de MiniMax aunque el catálogo incluido de proveedores de texto también contenga referencias de chat M3 con capacidad para imágenes. La comprensión de PDF usa `MiniMax-M2.7` únicamente para extraer texto; MiniMax no registra una ruta de conversión de PDF a imagen.

### Búsqueda web

El plugin MiniMax también registra `web_search` mediante la API de búsqueda de MiniMax Token Plan (`/v1/coding_plan/search`).

- ID de proveedor: `minimax`
- Resultados estructurados: títulos, URL, fragmentos y consultas relacionadas
- Variable de entorno preferida: `MINIMAX_CODE_PLAN_KEY`
- Alias de entorno aceptados: `MINIMAX_CODING_API_KEY`, `MINIMAX_OAUTH_TOKEN`
- Alternativa de compatibilidad: `MINIMAX_API_KEY` cuando ya apunta a una credencial de Token Plan
- Reutilización de región: `plugins.entries.minimax.config.webSearch.region`, después `MINIMAX_API_HOST` y, por último, las URL base del proveedor MiniMax
- La búsqueda permanece en el ID de proveedor `minimax`; la configuración de OAuth para China o global puede dirigir la región indirectamente mediante `models.providers.minimax-portal.baseUrl` y proporcionar autenticación mediante token de portador a través de `MINIMAX_OAUTH_TOKEN`

La configuración se encuentra en `plugins.entries.minimax.config.webSearch.*`.

<Note>
Consulte [Búsqueda de MiniMax](/es/tools/minimax-search) para conocer la configuración y el uso completos de la búsqueda web.
</Note>

## Configuración avanzada

<AccordionGroup>
  <Accordion title="Opciones de configuración">
    | Opción | Descripción |
    | --- | --- |
    | `models.providers.minimax.baseUrl` | Se prefiere `https://api.minimax.io/anthropic` (compatible con Anthropic); `https://api.minimax.io/v1` es opcional para cargas útiles compatibles con OpenAI |
    | `models.providers.minimax.api` | Se prefiere `anthropic-messages`; `openai-completions` es opcional para cargas útiles compatibles con OpenAI |
    | `models.providers.minimax.apiKey` | Clave de API de MiniMax (`MINIMAX_API_KEY`) |
    | `models.providers.minimax.models` | Define `id`, `name`, `reasoning`, `contextWindow`, `maxTokens`, `cost` |
    | `agents.defaults.models` | Alias, parámetros y metadatos por modelo |
    | `agents.defaults.modelPolicy.allow` | Lista opcional de modelos permitidos explícitamente |
    | `models.mode` | Mantenga `merge` si desea añadir MiniMax junto con los proveedores integrados |
  </Accordion>

  <Accordion title="Valores predeterminados de razonamiento">
    En `api: "anthropic-messages"`, OpenClaw inyecta `thinking: { type: "disabled" }` para los modelos MiniMax M2.x, salvo que un envoltorio anterior ya haya establecido el campo `thinking` en la carga útil. Esto evita que el punto de conexión de transmisión de M2.x emita `reasoning_content` en fragmentos delta al estilo de OpenAI, lo que expondría el razonamiento interno en la salida visible.

    MiniMax-M3 (y M3.x) está exento: M3 devuelve una matriz `content` vacía con `stop_reason: "end_turn"` cuando el razonamiento está desactivado, por lo que OpenClaw elimina el valor predeterminado desactivado implícito para M3 y, cuando se establece un nivel de razonamiento, fuerza `thinking: { type: "adaptive" }` en su lugar.

    Niveles de razonamiento disponibles por familia de modelos:

    | Familia de modelos   | Niveles                                   | Predeterminado    |
    | -------------- | ----------------------------------------- | ---------- |
    | `MiniMax-M3`   | `off`, `adaptive`                        | `adaptive` |
    | `MiniMax-M2.x` | `off`, `minimal`, `low`, `medium`, `high` | `off`      |

  </Accordion>

  <Accordion title="Modo rápido">
    `/fast on` o `params.fastMode: true` sustituye `MiniMax-M2.7` por `MiniMax-M2.7-highspeed` en la ruta de transmisión compatible con Anthropic (`api: "anthropic-messages"`, proveedor `minimax` o `minimax-portal`).
  </Accordion>

  <Accordion title="Ejemplo de conmutación por error">
    **Recomendado para:** mantener el modelo más potente de última generación como principal y conmutar a MiniMax M2.7 en caso de error. El ejemplo siguiente utiliza Opus como modelo principal concreto; sustitúyalo por el modelo principal de última generación que prefiera.

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
    - API de uso de Coding Plan: `https://api.minimaxi.com/v1/token_plan/remains` o `https://api.minimax.io/v1/token_plan/remains` (requiere una clave de Coding Plan).
    - El sondeo de uso obtiene el host de `models.providers.minimax-portal.baseUrl` o `models.providers.minimax.baseUrl` cuando están configurados, por lo que las configuraciones globales que usan `https://api.minimax.io/anthropic` sondean `api.minimax.io`. Las URL base ausentes o incorrectas mantienen la alternativa de China por compatibilidad.
    - OpenClaw normaliza el uso de Coding Plan de MiniMax a la misma visualización `% left` que utilizan otros proveedores. Los campos sin procesar `usage_percent` / `usagePercent` de MiniMax representan la cuota restante, no la consumida, por lo que OpenClaw los invierte. Los campos basados en recuentos tienen prioridad cuando están presentes.
    - Cuando la API devuelve `model_remains`, OpenClaw prefiere la entrada del modelo de chat, obtiene la etiqueta de la ventana de `start_time` / `end_time` cuando es necesario e incluye el nombre del modelo seleccionado en la etiqueta del plan para que las ventanas de Coding Plan sean más fáciles de distinguir.
    - Las instantáneas de uso consideran `minimax`, `minimax-cn`, `minimax-portal` y `minimax-portal-cn` como la misma superficie de cuota de MiniMax, y prefieren las credenciales OAuth de MiniMax almacenadas antes de recurrir a las variables de entorno de la clave de Coding Plan.

  </Accordion>
</AccordionGroup>

## Notas

- Modelo de chat predeterminado: `MiniMax-M3`. Modelos de chat alternativos: `MiniMax-M2.7`, `MiniMax-M2.7-highspeed`
- La incorporación y la configuración directa mediante clave de API escriben definiciones de modelo para M3 y ambas variantes de M2.7
- La comprensión de imágenes usa el proveedor multimedia `MiniMax-VL-01`, propiedad del plugin
- Actualice los valores de precios en `models.json` si necesita un seguimiento exacto de los costes
- Use `openclaw models list` para confirmar el ID de proveedor actual y, después, cambie con `openclaw models set minimax/MiniMax-M3` o `openclaw models set minimax-portal/MiniMax-M3`

<Note>
Consulte [Proveedores de modelos](/es/concepts/model-providers) para conocer las reglas de los proveedores.
</Note>

## Solución de problemas

<AccordionGroup>
  <Accordion title='"Modelo desconocido: minimax/MiniMax-M3"'>
    Esto suele significar que el **proveedor MiniMax no está configurado** (no se ha encontrado ninguna entrada de proveedor coincidente ni ningún perfil de autenticación o clave de entorno de MiniMax). Para solucionarlo:

    - Ejecute `openclaw configure` y seleccione una opción de autenticación de **MiniMax**, o
    - Añada manualmente el bloque `models.providers.minimax` o `models.providers.minimax-portal` correspondiente, o
    - Establezca `MINIMAX_API_KEY`, `MINIMAX_OAUTH_TOKEN` o un perfil de autenticación de MiniMax para que se pueda inyectar el proveedor correspondiente.

    Asegúrese de que el ID del modelo **distingue entre mayúsculas y minúsculas**:

    - Ruta de clave de API: `minimax/MiniMax-M3`, `minimax/MiniMax-M2.7` o `minimax/MiniMax-M2.7-highspeed`
    - Ruta de OAuth: `minimax-portal/MiniMax-M3`, `minimax-portal/MiniMax-M2.7` o `minimax-portal/MiniMax-M2.7-highspeed`

    Vuelva a comprobarlo con:

    ```bash
    openclaw models list
    ```

  </Accordion>
</AccordionGroup>

<Note>
Más ayuda: [Solución de problemas](/es/help/troubleshooting) y [Preguntas frecuentes](/es/help/faq).
</Note>

## Contenido relacionado

<CardGroup cols={2}>
  <Card title="Selección de modelos" href="/es/concepts/model-providers" icon="layers">
    Selección de proveedores, referencias de modelos y comportamiento de conmutación por error.
  </Card>
  <Card title="Generación de imágenes" href="/es/tools/image-generation" icon="image">
    Parámetros compartidos de la herramienta de imágenes y selección de proveedores.
  </Card>
  <Card title="Generación de música" href="/es/tools/music-generation" icon="music">
    Parámetros compartidos de la herramienta de música y selección de proveedores.
  </Card>
  <Card title="Generación de vídeo" href="/es/tools/video-generation" icon="video">
    Parámetros compartidos de la herramienta de vídeo y selección de proveedores.
  </Card>
  <Card title="Búsqueda de MiniMax" href="/es/tools/minimax-search" icon="magnifying-glass">
    Configuración de la búsqueda web mediante MiniMax Token Plan.
  </Card>
  <Card title="Solución de problemas" href="/es/help/troubleshooting" icon="wrench">
    Solución general de problemas y preguntas frecuentes.
  </Card>
</CardGroup>
