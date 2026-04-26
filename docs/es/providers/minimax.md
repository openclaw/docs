---
read_when:
    - Quieres modelos MiniMax en OpenClaw
    - Necesitas orientación para configurar MiniMax
summary: Usa modelos MiniMax en OpenClaw
title: MiniMax
x-i18n:
    generated_at: "2026-04-26T11:36:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8b91f8c4c12c993457fb1535bbb2f3401474a3ec432b24189792a20041e756dc
    source_path: providers/minimax.md
    workflow: 15
---

El proveedor MiniMax de OpenClaw usa por defecto **MiniMax M2.7**.

MiniMax también ofrece:

- Síntesis de voz integrada mediante T2A v2
- Comprensión de imágenes integrada mediante `MiniMax-VL-01`
- Generación de música integrada mediante `music-2.6`
- `web_search` integrado mediante la API de búsqueda de MiniMax Coding Plan

División del proveedor:

| ID del proveedor | Autenticación | Capacidades                                                                                         |
| ---------------- | ------------- | --------------------------------------------------------------------------------------------------- |
| `minimax`        | Clave de API  | Texto, generación de imágenes, generación de música, generación de video, comprensión de imágenes, voz, búsqueda web |
| `minimax-portal` | OAuth         | Texto, generación de imágenes, generación de música, generación de video, comprensión de imágenes, voz |

## Catálogo integrado

| Modelo                   | Tipo             | Descripción                              |
| ------------------------ | ---------------- | ---------------------------------------- |
| `MiniMax-M2.7`           | Chat (razonamiento) | Modelo de razonamiento alojado predeterminado |
| `MiniMax-M2.7-highspeed` | Chat (razonamiento) | Nivel de razonamiento M2.7 más rápido    |
| `MiniMax-VL-01`          | Visión           | Modelo de comprensión de imágenes        |
| `image-01`               | Generación de imágenes | Texto a imagen y edición de imagen a imagen |
| `music-2.6`              | Generación de música | Modelo de música predeterminado          |
| `music-2.5`              | Generación de música | Nivel anterior de generación de música   |
| `music-2.0`              | Generación de música | Nivel heredado de generación de música   |
| `MiniMax-Hailuo-2.3`     | Generación de video | Flujos de texto a video y referencia de imagen |

## Primeros pasos

Elige tu método de autenticación preferido y sigue los pasos de configuración.

<Tabs>
  <Tab title="OAuth (Coding Plan)">
    **Ideal para:** configuración rápida con MiniMax Coding Plan mediante OAuth, sin necesidad de clave de API.

    <Tabs>
      <Tab title="Internacional">
        <Steps>
          <Step title="Ejecuta la incorporación">
            ```bash
            openclaw onboard --auth-choice minimax-global-oauth
            ```

            Esto autentica con `api.minimax.io`.
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

            Esto autentica con `api.minimaxi.com`.
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
    Las configuraciones con OAuth usan el ID de proveedor `minimax-portal`. Las referencias de modelo siguen el formato `minimax-portal/MiniMax-M2.7`.
    </Note>

    <Tip>
    Enlace de referencia para MiniMax Coding Plan (10% de descuento): [MiniMax Coding Plan](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
    </Tip>

  </Tab>

  <Tab title="Clave de API">
    **Ideal para:** MiniMax alojado con API compatible con Anthropic.

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
    En la ruta de streaming compatible con Anthropic, OpenClaw desactiva el pensamiento de MiniMax de forma predeterminada a menos que configures explícitamente `thinking` tú mismo. El endpoint de streaming de MiniMax emite `reasoning_content` en fragmentos delta de estilo OpenAI en lugar de bloques de pensamiento nativos de Anthropic, lo que puede filtrar razonamiento interno en la salida visible si se deja activado implícitamente.
    </Warning>

    <Note>
    Las configuraciones con clave de API usan el ID de proveedor `minimax`. Las referencias de modelo siguen el formato `minimax/MiniMax-M2.7`.
    </Note>

  </Tab>
</Tabs>

## Configura mediante `openclaw configure`

Usa el asistente de configuración interactivo para establecer MiniMax sin editar JSON:

<Steps>
  <Step title="Inicia el asistente">
    ```bash
    openclaw configure
    ```
  </Step>
  <Step title="Selecciona Model/auth">
    Elige **Model/auth** en el menú.
  </Step>
  <Step title="Elige una opción de autenticación de MiniMax">
    Selecciona una de las opciones de MiniMax disponibles:

    | Opción de autenticación | Descripción |
    | --- | --- |
    | `minimax-global-oauth` | OAuth internacional (Coding Plan) |
    | `minimax-cn-oauth` | OAuth para China (Coding Plan) |
    | `minimax-global-api` | Clave de API internacional |
    | `minimax-cn-api` | Clave de API para China |

  </Step>
  <Step title="Elige tu modelo predeterminado">
    Selecciona tu modelo predeterminado cuando se te solicite.
  </Step>
</Steps>

## Capacidades

### Generación de imágenes

El Plugin de MiniMax registra el modelo `image-01` para la herramienta `image_generate`. Admite:

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

El Plugin usa la misma autenticación `MINIMAX_API_KEY` u OAuth que los modelos de texto. No se necesita configuración adicional si MiniMax ya está configurado.

Tanto `minimax` como `minimax-portal` registran `image_generate` con el mismo
modelo `image-01`. Las configuraciones con clave de API usan `MINIMAX_API_KEY`; las configuraciones con OAuth pueden usar
la ruta de autenticación integrada `minimax-portal` en su lugar.

La generación de imágenes siempre usa el endpoint de imágenes dedicado de MiniMax
(`/v1/image_generation`) e ignora `models.providers.minimax.baseUrl`,
ya que ese campo configura la URL base compatible con chat/Anthropic. Configura
`MINIMAX_API_HOST=https://api.minimaxi.com` para enrutar la generación de imágenes
a través del endpoint de CN; el endpoint global predeterminado es
`https://api.minimax.io`.

Cuando la incorporación o la configuración con clave de API escriben entradas explícitas de
`models.providers.minimax`, OpenClaw materializa `MiniMax-M2.7` y
`MiniMax-M2.7-highspeed` como modelos de chat solo de texto. La comprensión de imágenes se
expone por separado mediante el proveedor multimedia `MiniMax-VL-01`, que pertenece al Plugin.

<Note>
Consulta [Generación de imágenes](/es/tools/image-generation) para ver los parámetros compartidos de la herramienta, la selección de proveedor y el comportamiento de conmutación por error.
</Note>

### Texto a voz

El Plugin `minimax` integrado registra MiniMax T2A v2 como proveedor de voz para
`messages.tts`.

- Modelo TTS predeterminado: `speech-2.8-hd`
- Voz predeterminada: `English_expressive_narrator`
- Los ID de modelo integrados admitidos incluyen `speech-2.8-hd`, `speech-2.8-turbo`,
  `speech-2.6-hd`, `speech-2.6-turbo`, `speech-02-hd`,
  `speech-02-turbo`, `speech-01-hd` y `speech-01-turbo`.
- La resolución de autenticación es `messages.tts.providers.minimax.apiKey`, luego
  los perfiles de autenticación OAuth/token de `minimax-portal`, después las claves de entorno de Token Plan
  (`MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY`,
  `MINIMAX_CODING_API_KEY`) y, por último, `MINIMAX_API_KEY`.
- Si no se configura ningún host de TTS, OpenClaw reutiliza el host OAuth de `minimax-portal`
  configurado y elimina sufijos de ruta compatibles con Anthropic
  como `/anthropic`.
- Los adjuntos de audio normales siguen siendo MP3.
- Los destinos de nota de voz, como Feishu y Telegram, se transcodifican del MP3 de MiniMax
  a Opus de 48 kHz con `ffmpeg`, porque la API de archivos de Feishu/Lark solo
  acepta `file_type: "opus"` para mensajes de audio nativos.
- MiniMax T2A acepta `speed` y `vol` fraccionales, pero `pitch` se envía como un
  entero; OpenClaw trunca los valores fraccionales de `pitch` antes de la solicitud a la API.

| Configuración                            | Variable de entorno    | Predeterminado               | Descripción                            |
| ---------------------------------------- | ---------------------- | ---------------------------- | -------------------------------------- |
| `messages.tts.providers.minimax.baseUrl` | `MINIMAX_API_HOST`     | `https://api.minimax.io`     | Host de la API T2A de MiniMax.         |
| `messages.tts.providers.minimax.model`   | `MINIMAX_TTS_MODEL`    | `speech-2.8-hd`              | ID del modelo TTS.                     |
| `messages.tts.providers.minimax.voiceId` | `MINIMAX_TTS_VOICE_ID` | `English_expressive_narrator` | ID de voz usado para la salida de voz. |
| `messages.tts.providers.minimax.speed`   |                        | `1.0`                        | Velocidad de reproducción, `0.5..2.0`. |
| `messages.tts.providers.minimax.vol`     |                        | `1.0`                        | Volumen, `(0, 10]`.                    |
| `messages.tts.providers.minimax.pitch`   |                        | `0`                          | Cambio de tono entero, `-12..12`.      |

### Generación de música

El Plugin MiniMax integrado registra la generación de música mediante la herramienta compartida
`music_generate` tanto para `minimax` como para `minimax-portal`.

- Modelo de música predeterminado: `minimax/music-2.6`
- Modelo de música con OAuth: `minimax-portal/music-2.6`
- También admite `minimax/music-2.5` y `minimax/music-2.0`
- Controles del prompt: `lyrics`, `instrumental`, `durationSeconds`
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
Consulta [Generación de música](/es/tools/music-generation) para ver los parámetros compartidos de la herramienta, la selección de proveedor y el comportamiento de conmutación por error.
</Note>

### Generación de video

El Plugin MiniMax integrado registra la generación de video mediante la herramienta compartida
`video_generate` tanto para `minimax` como para `minimax-portal`.

- Modelo de video predeterminado: `minimax/MiniMax-Hailuo-2.3`
- Modelo de video con OAuth: `minimax-portal/MiniMax-Hailuo-2.3`
- Modos: flujos de texto a video y de referencia con una sola imagen
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

| ID del proveedor | Modelo de imagen predeterminado |
| ---------------- | ------------------------------- |
| `minimax`        | `MiniMax-VL-01`                 |
| `minimax-portal` | `MiniMax-VL-01`                 |

Por eso el enrutamiento automático de medios puede usar la comprensión de imágenes de MiniMax incluso
cuando el catálogo integrado del proveedor de texto sigue mostrando referencias de chat M2.7 solo de texto.

### Búsqueda web

El Plugin MiniMax también registra `web_search` mediante la API de búsqueda de MiniMax Coding Plan.

- ID del proveedor: `minimax`
- Resultados estructurados: títulos, URL, fragmentos, consultas relacionadas
- Variable de entorno preferida: `MINIMAX_CODE_PLAN_KEY`
- Alias de entorno aceptado: `MINIMAX_CODING_API_KEY`
- Alternativa de compatibilidad: `MINIMAX_API_KEY` cuando ya apunta a un token de coding-plan
- Reutilización de región: `plugins.entries.minimax.config.webSearch.region`, luego `MINIMAX_API_HOST`, luego las URL base del proveedor MiniMax
- La búsqueda permanece en el ID de proveedor `minimax`; la configuración OAuth CN/global aún puede dirigir indirectamente la región mediante `models.providers.minimax-portal.baseUrl`

La configuración se encuentra en `plugins.entries.minimax.config.webSearch.*`.

<Note>
Consulta [MiniMax Search](/es/tools/minimax-search) para ver la configuración completa y el uso de la búsqueda web.
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
    | `agents.defaults.models` | Asigna alias a los modelos que quieras en la lista permitida |
    | `models.mode` | Mantén `merge` si quieres añadir MiniMax junto con los integrados |
  </Accordion>

  <Accordion title="Valores predeterminados de thinking">
    En `api: "anthropic-messages"`, OpenClaw inyecta `thinking: { type: "disabled" }` a menos que thinking ya esté configurado explícitamente en params/config.

    Esto evita que el endpoint de streaming de MiniMax emita `reasoning_content` en fragmentos delta de estilo OpenAI, lo que expondría razonamiento interno en la salida visible.

  </Accordion>

  <Accordion title="Modo rápido">
    `/fast on` o `params.fastMode: true` reescribe `MiniMax-M2.7` como `MiniMax-M2.7-highspeed` en la ruta de streaming compatible con Anthropic.
  </Accordion>

  <Accordion title="Ejemplo de conmutación por error">
    **Ideal para:** mantener tu modelo más potente de última generación como principal y usar conmutación por error a MiniMax M2.7. El ejemplo siguiente usa Opus como principal concreto; cámbialo por tu modelo principal de última generación preferido.

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
    - OpenClaw normaliza el uso de MiniMax coding-plan al mismo formato de visualización de `% restante` que usan otros proveedores. Los campos sin procesar `usage_percent` / `usagePercent` de MiniMax son cuota restante, no cuota consumida, por lo que OpenClaw los invierte. Los campos basados en recuento tienen prioridad cuando están presentes.
    - Cuando la API devuelve `model_remains`, OpenClaw prefiere la entrada del modelo de chat, deriva la etiqueta de ventana de `start_time` / `end_time` cuando es necesario e incluye el nombre del modelo seleccionado en la etiqueta del plan para que las ventanas de coding-plan sean más fáciles de distinguir.
    - Las instantáneas de uso tratan `minimax`, `minimax-cn` y `minimax-portal` como la misma superficie de cuota de MiniMax, y prefieren el OAuth de MiniMax almacenado antes de recurrir a las variables de entorno de la clave de Coding Plan.
  </Accordion>
</AccordionGroup>

## Notas

- Las referencias de modelo siguen la ruta de autenticación:
  - Configuración con clave de API: `minimax/<model>`
  - Configuración con OAuth: `minimax-portal/<model>`
- Modelo de chat predeterminado: `MiniMax-M2.7`
- Modelo de chat alternativo: `MiniMax-M2.7-highspeed`
- La incorporación y la configuración directa con clave de API escriben definiciones de modelos solo de texto para ambas variantes de M2.7
- La comprensión de imágenes usa el proveedor multimedia `MiniMax-VL-01`, que pertenece al Plugin
- Actualiza los valores de precios en `models.json` si necesitas un seguimiento exacto de costos
- Usa `openclaw models list` para confirmar el ID de proveedor actual y luego cambia con `openclaw models set minimax/MiniMax-M2.7` o `openclaw models set minimax-portal/MiniMax-M2.7`

<Tip>
Enlace de referencia para MiniMax Coding Plan (10% de descuento): [MiniMax Coding Plan](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
</Tip>

<Note>
Consulta [Proveedores de modelos](/es/concepts/model-providers) para ver las reglas de los proveedores.
</Note>

## Solución de problemas

<AccordionGroup>
  <Accordion title='"Unknown model: minimax/MiniMax-M2.7"'>
    Esto normalmente significa que el **proveedor MiniMax no está configurado** (no hay una entrada de proveedor coincidente y no se encontró ninguna clave de entorno/perfil de autenticación de MiniMax). Hay una corrección para esta detección en **2026.1.12**. Soluciónalo de la siguiente manera:

    - Actualiza a **2026.1.12** (o ejecuta desde el código fuente `main`) y luego reinicia el Gateway.
    - Ejecuta `openclaw configure` y selecciona una opción de autenticación de **MiniMax**, o
    - Añade manualmente el bloque correspondiente `models.providers.minimax` o `models.providers.minimax-portal`, o
    - Configura `MINIMAX_API_KEY`, `MINIMAX_OAUTH_TOKEN` o un perfil de autenticación MiniMax para que se pueda inyectar el proveedor correspondiente.

    Asegúrate de que el ID del modelo **distingue mayúsculas de minúsculas**:

    - Ruta con clave de API: `minimax/MiniMax-M2.7` o `minimax/MiniMax-M2.7-highspeed`
    - Ruta con OAuth: `minimax-portal/MiniMax-M2.7` o `minimax-portal/MiniMax-M2.7-highspeed`

    Después, vuelve a comprobarlo con:

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
  <Card title="Selección de modelos" href="/es/concepts/model-providers" icon="layers">
    Elegir proveedores, referencias de modelos y comportamiento de conmutación por error.
  </Card>
  <Card title="Generación de imágenes" href="/es/tools/image-generation" icon="image">
    Parámetros compartidos de la herramienta de imágenes y selección de proveedor.
  </Card>
  <Card title="Generación de música" href="/es/tools/music-generation" icon="music">
    Parámetros compartidos de la herramienta de música y selección de proveedor.
  </Card>
  <Card title="Generación de video" href="/es/tools/video-generation" icon="video">
    Parámetros compartidos de la herramienta de video y selección de proveedor.
  </Card>
  <Card title="MiniMax Search" href="/es/tools/minimax-search" icon="magnifying-glass">
    Configuración de búsqueda web mediante MiniMax Coding Plan.
  </Card>
  <Card title="Solución de problemas" href="/es/help/troubleshooting" icon="wrench">
    Solución general de problemas y FAQ.
  </Card>
</CardGroup>
