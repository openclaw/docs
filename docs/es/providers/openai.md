---
read_when:
    - Quieres usar modelos de OpenAI en OpenClaw
    - Quieres autenticación con suscripción a Codex en lugar de claves de API
    - Necesitas un comportamiento más estricto de ejecución del agente con GPT-5
summary: Usar OpenAI mediante claves de API o suscripción a Codex en OpenClaw
title: OpenAI
x-i18n:
    generated_at: "2026-04-26T11:37:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: e4c3e734217ca82e1a5965c41686341a8bd87b4d2194c6d9e286e1087fa53320
    source_path: providers/openai.md
    workflow: 15
---

  OpenAI proporciona API de desarrollador para modelos GPT, y Codex también está disponible como un
  agente de programación del plan ChatGPT a través de los clientes Codex de OpenAI. OpenClaw mantiene esas
  superficies separadas para que la configuración siga siendo predecible.

  OpenClaw admite tres rutas de la familia OpenAI. El prefijo del modelo selecciona la
  ruta de proveedor/autenticación; una configuración de tiempo de ejecución separada selecciona quién ejecuta el bucle de agente integrado:

  - **Clave de API** — acceso directo a OpenAI Platform con facturación por uso (modelos `openai/*`)
  - **Suscripción a Codex a través de PI** — inicio de sesión de ChatGPT/Codex con acceso por suscripción (modelos `openai-codex/*`)
  - **Harness del servidor de aplicaciones Codex** — ejecución nativa del servidor de aplicaciones Codex (modelos `openai/*` más `agents.defaults.agentRuntime.id: "codex"`)

  OpenAI admite explícitamente el uso de OAuth por suscripción en herramientas externas y flujos de trabajo como OpenClaw.

  Proveedor, modelo, tiempo de ejecución y canal son capas separadas. Si esas etiquetas se
  están mezclando, lee [Tiempos de ejecución de agentes](/es/concepts/agent-runtimes) antes de
  cambiar la configuración.

  ## Elección rápida

  | Objetivo                                      | Usar                                             | Notas                                                                        |
  | --------------------------------------------- | ------------------------------------------------ | ---------------------------------------------------------------------------- |
  | Facturación directa por clave de API          | `openai/gpt-5.5`                                 | Establece `OPENAI_API_KEY` o ejecuta la incorporación con clave de API de OpenAI. |
  | GPT-5.5 con autenticación de suscripción ChatGPT/Codex | `openai-codex/gpt-5.5`                  | Ruta PI predeterminada para OAuth de Codex. Mejor primera opción para configuraciones con suscripción. |
  | GPT-5.5 con comportamiento nativo del servidor de aplicaciones Codex | `openai/gpt-5.5` más `agentRuntime.id: "codex"` | Fuerza el harness del servidor de aplicaciones Codex para esa ref de modelo. |
  | Generación o edición de imágenes              | `openai/gpt-image-2`                             | Funciona tanto con `OPENAI_API_KEY` como con OAuth de OpenAI Codex.          |
  | Imágenes con fondo transparente               | `openai/gpt-image-1.5`                           | Usa `outputFormat=png` o `webp` y `openai.background=transparent`.           |

  ## Mapa de nombres

  Los nombres son similares, pero no intercambiables:

  | Nombre que ves                      | Capa              | Significado                                                                                           |
  | ----------------------------------- | ----------------- | ----------------------------------------------------------------------------------------------------- |
  | `openai`                            | Prefijo de proveedor | Ruta directa de la API de OpenAI Platform.                                                          |
  | `openai-codex`                      | Prefijo de proveedor | Ruta de OAuth/suscripción de OpenAI Codex a través del ejecutor normal PI de OpenClaw.             |
  | Plugin `codex`                      | Plugin            | Plugin incluido de OpenClaw que proporciona el tiempo de ejecución nativo del servidor de aplicaciones Codex y controles de chat `/codex`. |
  | `agentRuntime.id: codex`            | Tiempo de ejecución del agente | Fuerza el harness nativo del servidor de aplicaciones Codex para turnos integrados.   |
  | `/codex ...`                        | Conjunto de comandos de chat | Vincula/controla hilos del servidor de aplicaciones Codex desde una conversación.      |
  | `runtime: "acp", agentId: "codex"`  | Ruta de sesión ACP | Ruta de respaldo explícita que ejecuta Codex mediante ACP/acpx.                                    |

  Esto significa que una configuración puede contener intencionalmente tanto `openai-codex/*` como el
  Plugin `codex`. Eso es válido cuando quieres OAuth de Codex a través de PI y también quieres
  tener disponibles controles nativos de chat `/codex`. `openclaw doctor` advierte sobre esa
  combinación para que puedas confirmar que es intencional; no la reescribe.

  <Note>
  GPT-5.5 está disponible tanto mediante acceso directo con clave de API de OpenAI Platform como
  mediante rutas de suscripción/OAuth. Usa `openai/gpt-5.5` para tráfico directo con `OPENAI_API_KEY`,
  `openai-codex/gpt-5.5` para OAuth de Codex a través de PI, o
  `openai/gpt-5.5` con `agentRuntime.id: "codex"` para el harness nativo del servidor de
  aplicaciones Codex.
  </Note>

  <Note>
  Habilitar el Plugin OpenAI, o seleccionar un modelo `openai-codex/*`, no
  habilita el Plugin incluido del servidor de aplicaciones Codex. OpenClaw habilita ese Plugin solo
  cuando seleccionas explícitamente el harness nativo de Codex con
  `agentRuntime.id: "codex"` o usas una ref heredada de modelo `codex/*`.
  Si el Plugin incluido `codex` está habilitado pero `openai-codex/*` sigue resolviéndose
  a través de PI, `openclaw doctor` advierte y deja la ruta sin cambios.
  </Note>

  ## Cobertura de funciones de OpenClaw

  | Capacidad de OpenAI       | Superficie de OpenClaw                                    | Estado                                                  |
  | ------------------------- | --------------------------------------------------------- | ------------------------------------------------------- |
  | Chat / Responses          | Proveedor de modelo `openai/<model>`                      | Sí                                                      |
  | Modelos de suscripción Codex | `openai-codex/<model>` con OAuth `openai-codex`      | Sí                                                      |
  | Harness del servidor de aplicaciones Codex | `openai/<model>` con `agentRuntime.id: codex` | Sí                                                      |
  | Búsqueda web del lado del servidor | Herramienta nativa OpenAI Responses              | Sí, cuando la búsqueda web está habilitada y no hay proveedor fijado |
  | Imágenes                  | `image_generate`                                          | Sí                                                      |
  | Videos                    | `video_generate`                                          | Sí                                                      |
  | Texto a voz               | `messages.tts.provider: "openai"` / `tts`                 | Sí                                                      |
  | Voz a texto por lotes     | `tools.media.audio` / comprensión multimedia              | Sí                                                      |
  | Voz a texto en streaming  | Voice Call `streaming.provider: "openai"`                 | Sí                                                      |
  | Voz realtime              | Voice Call `realtime.provider: "openai"` / Control UI Talk | Sí                                                     |
  | Embeddings                | proveedor de embeddings de memoria                        | Sí                                                      |

  ## Primeros pasos

  Elige tu método de autenticación preferido y sigue los pasos de configuración.

  <Tabs>
  <Tab title="Clave de API (OpenAI Platform)">
    **Ideal para:** acceso directo a la API y facturación por uso.

    <Steps>
      <Step title="Obtener tu clave de API">
        Crea o copia una clave de API desde el [panel de OpenAI Platform](https://platform.openai.com/api-keys).
      </Step>
      <Step title="Ejecutar la incorporación">
        ```bash
        openclaw onboard --auth-choice openai-api-key
        ```

        O pasa la clave directamente:

        ```bash
        openclaw onboard --openai-api-key "$OPENAI_API_KEY"
        ```
      </Step>
      <Step title="Verificar que el modelo esté disponible">
        ```bash
        openclaw models list --provider openai
        ```
      </Step>
    </Steps>

    ### Resumen de la ruta

    | Ref de modelo           | Configuración de tiempo de ejecución | Ruta                         | Autenticación     |
    | ----------------------- | ------------------------------------ | ---------------------------- | ----------------- |
    | `openai/gpt-5.5`        | omitido / `agentRuntime.id: "pi"`    | API directa de OpenAI Platform | `OPENAI_API_KEY` |
    | `openai/gpt-5.4-mini`   | omitido / `agentRuntime.id: "pi"`    | API directa de OpenAI Platform | `OPENAI_API_KEY` |
    | `openai/gpt-5.5`        | `agentRuntime.id: "codex"`           | Harness del servidor de aplicaciones Codex | servidor de aplicaciones Codex |

    <Note>
    `openai/*` es la ruta directa con clave de API de OpenAI, salvo que fuerces explícitamente
    el harness del servidor de aplicaciones Codex. Usa `openai-codex/*` para OAuth de Codex a través
    del ejecutor PI predeterminado, o usa `openai/gpt-5.5` con
    `agentRuntime.id: "codex"` para ejecución nativa del servidor de aplicaciones Codex.
    </Note>

    ### Ejemplo de configuración

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
    }
    ```

    <Warning>
    OpenClaw **no** expone `openai/gpt-5.3-codex-spark`. Las solicitudes live a la API de OpenAI rechazan ese modelo, y el catálogo actual de Codex tampoco lo expone.
    </Warning>

  </Tab>

  <Tab title="Suscripción a Codex">
    **Ideal para:** usar tu suscripción de ChatGPT/Codex en lugar de una clave de API separada. Codex cloud requiere inicio de sesión en ChatGPT.

    <Steps>
      <Step title="Ejecutar OAuth de Codex">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        O ejecuta OAuth directamente:

        ```bash
        openclaw models auth login --provider openai-codex
        ```

        Para configuraciones headless o poco compatibles con callback, agrega `--device-code` para iniciar sesión con un flujo de código de dispositivo de ChatGPT en lugar del callback del navegador en localhost:

        ```bash
        openclaw models auth login --provider openai-codex --device-code
        ```
      </Step>
      <Step title="Establecer el modelo predeterminado">
        ```bash
        openclaw config set agents.defaults.model.primary openai-codex/gpt-5.5
        ```
      </Step>
      <Step title="Verificar que el modelo esté disponible">
        ```bash
        openclaw models list --provider openai-codex
        ```
      </Step>
    </Steps>

    ### Resumen de la ruta

    | Ref de modelo | Configuración de tiempo de ejecución | Ruta | Autenticación |
    |-----------|----------------|-------|------|
    | `openai-codex/gpt-5.5` | omitido / `runtime: "pi"` | OAuth de ChatGPT/Codex a través de PI | inicio de sesión de Codex |
    | `openai-codex/gpt-5.5` | `runtime: "auto"` | Sigue siendo PI salvo que un Plugin reclame explícitamente `openai-codex` | inicio de sesión de Codex |
    | `openai/gpt-5.5` | `agentRuntime.id: "codex"` | Harness del servidor de aplicaciones Codex | autenticación del servidor de aplicaciones Codex |

    <Note>
    Sigue usando el id de proveedor `openai-codex` para comandos de autenticación/perfil. El
    prefijo de modelo `openai-codex/*` también es la ruta PI explícita para OAuth de Codex.
    No selecciona ni habilita automáticamente el harness incluido del servidor de aplicaciones Codex.
    </Note>

    ### Ejemplo de configuración

    ```json5
    {
      agents: { defaults: { model: { primary: "openai-codex/gpt-5.5" } } },
    }
    ```

    <Note>
    La incorporación ya no importa material OAuth desde `~/.codex`. Inicia sesión con OAuth en navegador (predeterminado) o con el flujo de código de dispositivo de arriba: OpenClaw administra las credenciales resultantes en su propio almacén de autenticación del agente.
    </Note>

    ### Indicador de estado

    El chat `/status` muestra qué tiempo de ejecución del modelo está activo para la sesión actual.
    El harness PI predeterminado aparece como `Runtime: OpenClaw Pi Default`. Cuando se
    selecciona el harness incluido del servidor de aplicaciones Codex, `/status` muestra
    `Runtime: OpenAI Codex`. Las sesiones existentes conservan su id de harness registrado, así que usa
    `/new` o `/reset` después de cambiar `agentRuntime` si quieres que `/status`
    refleje una nueva elección PI/Codex.

    ### Advertencia de Doctor

    Si el Plugin incluido `codex` está habilitado mientras está seleccionada la ruta
    `openai-codex/*` de esta pestaña, `openclaw doctor` advierte que el modelo
    sigue resolviéndose a través de PI. Mantén la configuración sin cambios cuando esa sea la
    ruta intencional de autenticación por suscripción. Cambia a `openai/<model>` más
    `agentRuntime.id: "codex"` solo cuando quieras ejecución nativa del
    servidor de aplicaciones Codex.

    ### Límite de ventana de contexto

    OpenClaw trata los metadatos del modelo y el límite de contexto del tiempo de ejecución como valores separados.

    Para `openai-codex/gpt-5.5` a través de OAuth de Codex:

    - `contextWindow` nativo: `1000000`
    - Límite predeterminado de `contextTokens` del tiempo de ejecución: `272000`

    El límite predeterminado más pequeño tiene mejores características de latencia y calidad en la práctica. Anúlalo con `contextTokens`:

    ```json5
    {
      models: {
        providers: {
          "openai-codex": {
            models: [{ id: "gpt-5.5", contextTokens: 160000 }],
          },
        },
      },
    }
    ```

    <Note>
    Usa `contextWindow` para declarar metadatos nativos del modelo. Usa `contextTokens` para limitar el presupuesto de contexto en tiempo de ejecución.
    </Note>

    ### Recuperación del catálogo

    OpenClaw usa los metadatos del catálogo upstream de Codex para `gpt-5.5` cuando están
    presentes. Si la detección en vivo de Codex omite la fila `openai-codex/gpt-5.5` mientras
    la cuenta está autenticada, OpenClaw sintetiza esa fila de modelo OAuth para que las
    ejecuciones de Cron, subagente y modelo predeterminado configurado no fallen con
    `Unknown model`.

  </Tab>
</Tabs>

## Generación de imágenes

El Plugin `openai` incluido registra la generación de imágenes a través de la herramienta `image_generate`.
Admite tanto la generación de imágenes con clave de API de OpenAI como la generación de
imágenes con OAuth de Codex mediante la misma referencia de modelo `openai/gpt-image-2`.

| Capacidad                | Clave de API de OpenAI               | OAuth de Codex                        |
| ------------------------ | ------------------------------------ | ------------------------------------- |
| Referencia de modelo     | `openai/gpt-image-2`                 | `openai/gpt-image-2`                  |
| Autenticación            | `OPENAI_API_KEY`                     | Inicio de sesión con OAuth de OpenAI Codex |
| Transporte               | API de Images de OpenAI              | Backend de Responses de Codex         |
| Máximo de imágenes por solicitud | 4                            | 4                                     |
| Modo de edición          | Habilitado (hasta 5 imágenes de referencia) | Habilitado (hasta 5 imágenes de referencia) |
| Anulaciones de tamaño    | Compatibles, incluidos tamaños 2K/4K | Compatibles, incluidos tamaños 2K/4K  |
| Relación de aspecto / resolución | No se reenvían a la API de Images de OpenAI | Se asignan a un tamaño compatible cuando es seguro |

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: { primary: "openai/gpt-image-2" },
    },
  },
}
```

<Note>
Consulta [Generación de imágenes](/es/tools/image-generation) para ver los parámetros compartidos de la herramienta, la selección de proveedor y el comportamiento de failover.
</Note>

`gpt-image-2` es el valor predeterminado tanto para la generación de imágenes a partir de texto de OpenAI como para la
edición de imágenes. `gpt-image-1.5`, `gpt-image-1` y `gpt-image-1-mini` siguen siendo utilizables como
anulaciones explícitas del modelo. Usa `openai/gpt-image-1.5` para salida
PNG/WebP con fondo transparente; la API actual de `gpt-image-2` rechaza
`background: "transparent"`.

Para una solicitud con fondo transparente, los agentes deben llamar a `image_generate` con
`model: "openai/gpt-image-1.5"`, `outputFormat: "png"` o `"webp"`, y
`background: "transparent"`; la opción de proveedor heredada `openai.background`
sigue aceptándose. OpenClaw también protege las rutas públicas de OpenAI y
OAuth de OpenAI Codex reescribiendo las solicitudes transparentes predeterminadas de `openai/gpt-image-2`
a `gpt-image-1.5`; Azure y los endpoints personalizados compatibles con OpenAI mantienen
sus nombres de implementación/modelo configurados.

La misma configuración está expuesta para ejecuciones sin interfaz en la CLI:

```bash
openclaw infer image generate \
  --model openai/gpt-image-1.5 \
  --output-format png \
  --background transparent \
  --prompt "A simple red circle sticker on a transparent background" \
  --json
```

Usa las mismas marcas `--output-format` y `--background` con
`openclaw infer image edit` cuando se empieza desde un archivo de entrada.
`--openai-background` sigue estando disponible como alias específico de OpenAI.

Para instalaciones con OAuth de Codex, mantén la misma referencia `openai/gpt-image-2`. Cuando hay un
perfil OAuth `openai-codex` configurado, OpenClaw resuelve ese token de acceso OAuth almacenado
y envía las solicitudes de imágenes a través del backend de Responses de Codex. No
intenta primero `OPENAI_API_KEY` ni recurre silenciosamente a una clave de API para esa
solicitud. Configura `models.providers.openai` explícitamente con una clave de API,
URL base personalizada o endpoint de Azure cuando quieras usar en su lugar la ruta directa de la API de Images de OpenAI.
Si ese endpoint de imágenes personalizado está en una LAN o dirección privada de confianza, establece también
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`; OpenClaw mantiene
bloqueados los endpoints de imágenes privados/internos compatibles con OpenAI a menos que esta opción explícita
esté presente.

Generar:

```
/tool image_generate model=openai/gpt-image-2 prompt="A polished launch poster for OpenClaw on macOS" size=3840x2160 count=1
```

Generar un PNG transparente:

```
/tool image_generate model=openai/gpt-image-1.5 prompt="A simple red circle sticker on a transparent background" outputFormat=png background=transparent
```

Editar:

```
/tool image_generate model=openai/gpt-image-2 prompt="Preserve the object shape, change the material to translucent glass" image=/path/to/reference.png size=1024x1536
```

## Generación de video

El Plugin `openai` incluido registra la generación de video a través de la herramienta `video_generate`.

| Capacidad        | Valor                                                                             |
| ---------------- | --------------------------------------------------------------------------------- |
| Modelo predeterminado | `openai/sora-2`                                                              |
| Modos            | Texto a video, imagen a video, edición de un solo video                           |
| Entradas de referencia | 1 imagen o 1 video                                                           |
| Anulaciones de tamaño | Compatibles                                                                  |
| Otras anulaciones | `aspectRatio`, `resolution`, `audio`, `watermark` se ignoran con una advertencia de la herramienta |

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: { primary: "openai/sora-2" },
    },
  },
}
```

<Note>
Consulta [Generación de video](/es/tools/video-generation) para ver los parámetros compartidos de la herramienta, la selección de proveedor y el comportamiento de failover.
</Note>

## Contribución de prompt de GPT-5

OpenClaw agrega una contribución de prompt compartida de GPT-5 para las ejecuciones de la familia GPT-5 entre proveedores. Se aplica por id de modelo, por lo que `openai-codex/gpt-5.5`, `openai/gpt-5.5`, `openrouter/openai/gpt-5.5`, `opencode/gpt-5.5` y otras referencias compatibles de GPT-5 reciben la misma capa superpuesta. Los modelos GPT-4.x más antiguos no la reciben.

El arnés nativo de Codex incluido usa el mismo comportamiento de GPT-5 y la misma capa superpuesta de Heartbeat mediante instrucciones de desarrollador del servidor de aplicaciones Codex, por lo que las sesiones `openai/gpt-5.x` forzadas mediante `agentRuntime.id: "codex"` mantienen la misma guía de seguimiento y Heartbeat proactivo aunque Codex controle el resto del prompt del arnés.

La contribución de GPT-5 agrega un contrato de comportamiento etiquetado para persistencia de persona, seguridad de ejecución, disciplina de herramientas, forma de salida, comprobaciones de finalización y verificación. El comportamiento específico del canal para respuestas y mensajes silenciosos permanece en el prompt compartido del sistema de OpenClaw y en la política de entrega saliente. La guía de GPT-5 siempre está habilitada para los modelos coincidentes. La capa de estilo de interacción amigable es independiente y configurable.

| Valor                  | Efecto                                      |
| ---------------------- | ------------------------------------------- |
| `"friendly"` (predeterminado) | Habilita la capa de estilo de interacción amigable |
| `"on"`                 | Alias de `"friendly"`                       |
| `"off"`                | Deshabilita solo la capa de estilo amigable |

<Tabs>
  <Tab title="Config">
    ```json5
    {
      agents: {
        defaults: {
          promptOverlays: {
            gpt5: { personality: "friendly" },
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="CLI">
    ```bash
    openclaw config set agents.defaults.promptOverlays.gpt5.personality off
    ```
  </Tab>
</Tabs>

<Tip>
Los valores no distinguen entre mayúsculas y minúsculas en tiempo de ejecución, así que tanto `"Off"` como `"off"` deshabilitan la capa de estilo amigable.
</Tip>

<Note>
El valor heredado `plugins.entries.openai.config.personality` se sigue leyendo como alternativa de compatibilidad cuando no está configurado el ajuste compartido `agents.defaults.promptOverlays.gpt5.personality`.
</Note>

## Voz y habla

<AccordionGroup>
  <Accordion title="Síntesis de voz (TTS)">
    El Plugin `openai` incluido registra la síntesis de voz para la superficie `messages.tts`.

    | Ajuste | Ruta de configuración | Predeterminado |
    |---------|------------|---------|
    | Modelo | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | Voz | `messages.tts.providers.openai.voice` | `coral` |
    | Velocidad | `messages.tts.providers.openai.speed` | (sin establecer) |
    | Instrucciones | `messages.tts.providers.openai.instructions` | (sin establecer, solo `gpt-4o-mini-tts`) |
    | Formato | `messages.tts.providers.openai.responseFormat` | `opus` para notas de voz, `mp3` para archivos |
    | Clave de API | `messages.tts.providers.openai.apiKey` | Recurre a `OPENAI_API_KEY` |
    | URL base | `messages.tts.providers.openai.baseUrl` | `https://api.openai.com/v1` |

    Modelos disponibles: `gpt-4o-mini-tts`, `tts-1`, `tts-1-hd`. Voces disponibles: `alloy`, `ash`, `ballad`, `cedar`, `coral`, `echo`, `fable`, `juniper`, `marin`, `onyx`, `nova`, `sage`, `shimmer`, `verse`.

    ```json5
    {
      messages: {
        tts: {
          providers: {
            openai: { model: "gpt-4o-mini-tts", voice: "coral" },
          },
        },
      },
    }
    ```

    <Note>
    Establece `OPENAI_TTS_BASE_URL` para anular la URL base de TTS sin afectar el endpoint de la API de chat.
    </Note>

  </Accordion>

  <Accordion title="Voz a texto">
    El Plugin `openai` incluido registra la conversión por lotes de voz a texto mediante
    la superficie de transcripción de comprensión de medios de OpenClaw.

    - Modelo predeterminado: `gpt-4o-transcribe`
    - Endpoint: REST de OpenAI `/v1/audio/transcriptions`
    - Ruta de entrada: carga de archivo de audio multipart
    - Compatible con OpenClaw en cualquier lugar donde la transcripción de audio entrante use
      `tools.media.audio`, incluidos segmentos de canal de voz de Discord y
      archivos adjuntos de audio del canal

    Para forzar OpenAI para la transcripción de audio entrante:

    ```json5
    {
      tools: {
        media: {
          audio: {
            models: [
              {
                type: "provider",
                provider: "openai",
                model: "gpt-4o-transcribe",
              },
            ],
          },
        },
      },
    }
    ```

    Las sugerencias de idioma y prompt se reenvían a OpenAI cuando las proporciona la
    configuración compartida de medios de audio o una solicitud de transcripción por llamada.

  </Accordion>

  <Accordion title="Transcripción en tiempo real">
    El Plugin `openai` incluido registra la transcripción en tiempo real para el Plugin Voice Call.

    | Ajuste | Ruta de configuración | Predeterminado |
    |---------|------------|---------|
    | Modelo | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | Idioma | `...openai.language` | (sin establecer) |
    | Prompt | `...openai.prompt` | (sin establecer) |
    | Duración del silencio | `...openai.silenceDurationMs` | `800` |
    | Umbral de VAD | `...openai.vadThreshold` | `0.5` |
    | Clave de API | `...openai.apiKey` | Recurre a `OPENAI_API_KEY` |

    <Note>
    Usa una conexión WebSocket a `wss://api.openai.com/v1/realtime` con audio G.711 u-law (`g711_ulaw` / `audio/pcmu`). Este proveedor de streaming es para la ruta de transcripción en tiempo real de Voice Call; la voz de Discord actualmente graba segmentos cortos y usa en su lugar la ruta de transcripción por lotes `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="Voz en tiempo real">
    El Plugin `openai` incluido registra voz en tiempo real para el Plugin Voice Call.

    | Ajuste | Ruta de configuración | Predeterminado |
    |---------|------------|---------|
    | Modelo | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime-1.5` |
    | Voz | `...openai.voice` | `alloy` |
    | Temperatura | `...openai.temperature` | `0.8` |
    | Umbral de VAD | `...openai.vadThreshold` | `0.5` |
    | Duración del silencio | `...openai.silenceDurationMs` | `500` |
    | Clave de API | `...openai.apiKey` | Recurre a `OPENAI_API_KEY` |

    <Note>
    Admite Azure OpenAI mediante las claves de configuración `azureEndpoint` y `azureDeployment`. Admite llamada bidireccional de herramientas. Usa el formato de audio G.711 u-law.
    </Note>

  </Accordion>
</AccordionGroup>

## Endpoints de Azure OpenAI

El proveedor `openai` incluido puede apuntar a un recurso de Azure OpenAI para la
generación de imágenes anulando la URL base. En la ruta de generación de imágenes, OpenClaw
detecta nombres de host de Azure en `models.providers.openai.baseUrl` y cambia
automáticamente a la forma de solicitud de Azure.

<Note>
La voz en tiempo real usa una ruta de configuración independiente
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)
y no se ve afectada por `models.providers.openai.baseUrl`. Consulta el acordeón de **Voz
en tiempo real** en [Voz y habla](#voice-and-speech) para ver su configuración
de Azure.
</Note>

Usa Azure OpenAI cuando:

- Ya tienes una suscripción, cuota o acuerdo empresarial de Azure OpenAI
- Necesitas residencia regional de datos o controles de cumplimiento que proporciona Azure
- Quieres mantener el tráfico dentro de un inquilino de Azure existente

### Configuración

Para la generación de imágenes con Azure mediante el proveedor `openai` incluido, apunta
`models.providers.openai.baseUrl` a tu recurso de Azure y establece `apiKey` en
la clave de Azure OpenAI (no una clave de OpenAI Platform):

```json5
{
  models: {
    providers: {
      openai: {
        baseUrl: "https://<your-resource>.openai.azure.com",
        apiKey: "<azure-openai-api-key>",
      },
    },
  },
}
```

OpenClaw reconoce estos sufijos de host de Azure para la ruta de generación de imágenes
de Azure:

- `*.openai.azure.com`
- `*.services.ai.azure.com`
- `*.cognitiveservices.azure.com`

Para solicitudes de generación de imágenes en un host de Azure reconocido, OpenClaw:

- Envía la cabecera `api-key` en lugar de `Authorization: Bearer`
- Usa rutas con ámbito de implementación (`/openai/deployments/{deployment}/...`)
- Añade `?api-version=...` a cada solicitud
- Usa un tiempo de espera de solicitud predeterminado de 600 s para las llamadas de generación de imágenes de Azure.
  Los valores `timeoutMs` por llamada siguen anulando este valor predeterminado.

Otras URL base (OpenAI público, proxies compatibles con OpenAI) mantienen la forma de solicitud de imágenes
estándar de OpenAI.

<Note>
El enrutamiento de Azure para la ruta de generación de imágenes del proveedor `openai` requiere
OpenClaw 2026.4.22 o posterior. Las versiones anteriores tratan cualquier
`openai.baseUrl` personalizado como si fuera el endpoint público de OpenAI y fallarán con implementaciones de imágenes de Azure.
</Note>

### Versión de la API

Establece `AZURE_OPENAI_API_VERSION` para fijar una versión preview o GA específica de Azure
para la ruta de generación de imágenes de Azure:

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

El valor predeterminado es `2024-12-01-preview` cuando la variable no está establecida.

### Los nombres de modelo son nombres de implementación

Azure OpenAI vincula los modelos a implementaciones. Para las solicitudes de generación de imágenes de Azure
enrutadas mediante el proveedor `openai` incluido, el campo `model` en OpenClaw
debe ser el **nombre de implementación de Azure** que configuraste en el portal de Azure, no
el id del modelo público de OpenAI.

Si creas una implementación llamada `gpt-image-2-prod` que sirve `gpt-image-2`:

```
/tool image_generate model=openai/gpt-image-2-prod prompt="A clean poster" size=1024x1024 count=1
```

La misma regla de nombre de implementación se aplica a las llamadas de generación de imágenes enrutadas mediante
el proveedor `openai` incluido.

### Disponibilidad regional

La generación de imágenes de Azure actualmente solo está disponible en un subconjunto de regiones
(por ejemplo `eastus2`, `swedencentral`, `polandcentral`, `westus3`,
`uaenorth`). Consulta la lista actual de regiones de Microsoft antes de crear una
implementación y confirma que el modelo específico se ofrece en tu región.

### Diferencias de parámetros

Azure OpenAI y OpenAI público no siempre aceptan los mismos parámetros de imagen.
Azure puede rechazar opciones que OpenAI público permite (por ejemplo, ciertos valores de
`background` en `gpt-image-2`) o exponerlas solo en versiones específicas del modelo.
Estas diferencias provienen de Azure y del modelo subyacente, no de
OpenClaw. Si una solicitud de Azure falla con un error de validación, comprueba el
conjunto de parámetros compatible con tu implementación y versión de API específicas en el
portal de Azure.

<Note>
Azure OpenAI usa transporte nativo y comportamiento de compatibilidad, pero no recibe
las cabeceras ocultas de atribución de OpenClaw; consulta el acordeón **Rutas nativas frente a OpenAI-compatible**
en [Configuración avanzada](#advanced-configuration).

Para tráfico de chat o Responses en Azure (más allá de la generación de imágenes), usa el
flujo de incorporación o una configuración de proveedor de Azure dedicada; `openai.baseUrl` por sí sola
no adopta la forma de API/autenticación de Azure. Existe un proveedor separado
`azure-openai-responses/*`; consulta
el acordeón de Compaction del lado del servidor a continuación.
</Note>

## Configuración avanzada

<AccordionGroup>
  <Accordion title="Transporte (WebSocket frente a SSE)">
    OpenClaw usa WebSocket primero con retroceso a SSE (`"auto"`) tanto para `openai/*` como para `openai-codex/*`.

    En modo `"auto"`, OpenClaw:
    - Reintenta un fallo temprano de WebSocket antes de retroceder a SSE
    - Tras un fallo, marca WebSocket como degradado durante ~60 segundos y usa SSE durante el enfriamiento
    - Adjunta cabeceras estables de identidad de sesión y turno para reintentos y reconexiones
    - Normaliza los contadores de uso (`input_tokens` / `prompt_tokens`) entre variantes de transporte

    | Valor | Comportamiento |
    |-------|----------|
    | `"auto"` (predeterminado) | WebSocket primero, retroceso a SSE |
    | `"sse"` | Forzar solo SSE |
    | `"websocket"` | Forzar solo WebSocket |

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": {
              params: { transport: "auto" },
            },
            "openai-codex/gpt-5.5": {
              params: { transport: "auto" },
            },
          },
        },
      },
    }
    ```

    Documentación relacionada de OpenAI:
    - [API Realtime con WebSocket](https://platform.openai.com/docs/guides/realtime-websocket)
    - [Respuestas de API en streaming (SSE)](https://platform.openai.com/docs/guides/streaming-responses)

  </Accordion>

  <Accordion title="Calentamiento de WebSocket">
    OpenClaw habilita el calentamiento de WebSocket de forma predeterminada para `openai/*` y `openai-codex/*` para reducir la latencia del primer turno.

    ```json5
    // Deshabilitar calentamiento
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": {
              params: { openaiWsWarmup: false },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Modo rápido">
    OpenClaw expone un interruptor compartido de modo rápido para `openai/*` y `openai-codex/*`:

    - **Chat/UI:** `/fast status|on|off`
    - **Config:** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    Cuando está habilitado, OpenClaw asigna el modo rápido al procesamiento prioritario de OpenAI (`service_tier = "priority"`). Los valores existentes de `service_tier` se conservan, y el modo rápido no reescribe `reasoning` ni `text.verbosity`.

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": { params: { fastMode: true } },
          },
        },
      },
    }
    ```

    <Note>
    Las anulaciones de sesión prevalecen sobre la configuración. Borrar la anulación de sesión en la UI de Sessions devuelve la sesión al valor predeterminado configurado.
    </Note>

  </Accordion>

  <Accordion title="Procesamiento prioritario (service_tier)">
    La API de OpenAI expone el procesamiento prioritario mediante `service_tier`. Configúralo por modelo en OpenClaw:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": { params: { serviceTier: "priority" } },
          },
        },
      },
    }
    ```

    Valores compatibles: `auto`, `default`, `flex`, `priority`.

    <Warning>
    `serviceTier` solo se reenvía a endpoints nativos de OpenAI (`api.openai.com`) y endpoints nativos de Codex (`chatgpt.com/backend-api`). Si enrutas cualquiera de los dos proveedores a través de un proxy, OpenClaw deja `service_tier` intacto.
    </Warning>

  </Accordion>

  <Accordion title="Compaction del lado del servidor (Responses API)">
    Para modelos directos de OpenAI Responses (`openai/*` en `api.openai.com`), el envoltorio de flujo del arnés Pi del Plugin OpenAI habilita automáticamente Compaction del lado del servidor:

    - Fuerza `store: true` (a menos que la compatibilidad del modelo establezca `supportsStore: false`)
    - Inyecta `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - `compact_threshold` predeterminado: 70 % de `contextWindow` (o `80000` cuando no está disponible)

    Esto se aplica a la ruta incorporada del arnés Pi y a los hooks del proveedor OpenAI usados por ejecuciones incrustadas. El arnés nativo del servidor de aplicaciones Codex gestiona su propio contexto mediante Codex y se configura por separado con `agents.defaults.agentRuntime.id`.

    <Tabs>
      <Tab title="Habilitar explícitamente">
        Útil para endpoints compatibles como Azure OpenAI Responses:

        ```json5
        {
          agents: {
            defaults: {
              models: {
                "azure-openai-responses/gpt-5.5": {
                  params: { responsesServerCompaction: true },
                },
              },
            },
          },
        }
        ```
      </Tab>
      <Tab title="Umbral personalizado">
        ```json5
        {
          agents: {
            defaults: {
              models: {
                "openai/gpt-5.5": {
                  params: {
                    responsesServerCompaction: true,
                    responsesCompactThreshold: 120000,
                  },
                },
              },
            },
          },
        }
        ```
      </Tab>
      <Tab title="Deshabilitar">
        ```json5
        {
          agents: {
            defaults: {
              models: {
                "openai/gpt-5.5": {
                  params: { responsesServerCompaction: false },
                },
              },
            },
          },
        }
        ```
      </Tab>
    </Tabs>

    <Note>
    `responsesServerCompaction` solo controla la inyección de `context_management`. Los modelos directos de OpenAI Responses siguen forzando `store: true` a menos que la compatibilidad establezca `supportsStore: false`.
    </Note>

  </Accordion>

  <Accordion title="Modo GPT agéntico estricto">
    Para ejecuciones de la familia GPT-5 en `openai/*`, OpenClaw puede usar un contrato de ejecución incrustada más estricto:

    ```json5
    {
      agents: {
        defaults: {
          embeddedPi: { executionContract: "strict-agentic" },
        },
      },
    }
    ```

    Con `strict-agentic`, OpenClaw:
    - Ya no trata un turno de solo planificación como progreso satisfactorio cuando hay disponible una acción de herramienta
    - Reintenta el turno con una guía de actuar ahora
    - Habilita automáticamente `update_plan` para trabajo sustancial
    - Muestra un estado de bloqueo explícito si el modelo sigue planificando sin actuar

    <Note>
    Limitado solo a ejecuciones de la familia GPT-5 de OpenAI y Codex. Otros proveedores y familias de modelos más antiguas conservan el comportamiento predeterminado.
    </Note>

  </Accordion>

  <Accordion title="Rutas nativas frente a rutas OpenAI-compatible">
    OpenClaw trata los endpoints directos de OpenAI, Codex y Azure OpenAI de forma diferente a los proxies genéricos compatibles con OpenAI `/v1`:

    **Rutas nativas** (`openai/*`, Azure OpenAI):
    - Conservan `reasoning: { effort: "none" }` solo para modelos que admiten el esfuerzo `none` de OpenAI
    - Omiten el razonamiento deshabilitado para modelos o proxies que rechazan `reasoning.effort: "none"`
    - Usan por defecto esquemas de herramientas en modo estricto
    - Adjuntan cabeceras ocultas de atribución solo en hosts nativos verificados
    - Conservan la forma de solicitud exclusiva de OpenAI (`service_tier`, `store`, compatibilidad de reasoning, sugerencias de caché de prompt)

    **Rutas proxy/compatibles:**
    - Usan un comportamiento de compatibilidad más flexible
    - Eliminan `store` de Completions de cargas `openai-completions` no nativas
    - Aceptan JSON de paso directo avanzado `params.extra_body`/`params.extraBody` para proxies de Completions compatibles con OpenAI
    - Aceptan `params.chat_template_kwargs` para proxies de Completions compatibles con OpenAI como vLLM
    - No fuerzan esquemas de herramientas estrictos ni cabeceras exclusivas nativas

    Azure OpenAI usa transporte nativo y comportamiento de compatibilidad, pero no recibe las cabeceras ocultas de atribución.

  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Selección de modelos" href="/es/concepts/model-providers" icon="layers">
    Elegir proveedores, referencias de modelos y comportamiento de failover.
  </Card>
  <Card title="Generación de imágenes" href="/es/tools/image-generation" icon="image">
    Parámetros compartidos de la herramienta de imágenes y selección de proveedor.
  </Card>
  <Card title="Generación de video" href="/es/tools/video-generation" icon="video">
    Parámetros compartidos de la herramienta de video y selección de proveedor.
  </Card>
  <Card title="OAuth y autenticación" href="/es/gateway/authentication" icon="key">
    Detalles de autenticación y reglas de reutilización de credenciales.
  </Card>
</CardGroup>
