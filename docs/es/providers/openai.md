---
read_when:
    - Quieres usar modelos de OpenAI en OpenClaw
    - Quieres usar la autenticación de suscripción de Codex en lugar de claves de API
    - Necesitas un comportamiento de ejecución del agente GPT-5 más estricto
summary: Usar OpenAI mediante claves de API o una suscripción de Codex en OpenClaw
title: OpenAI
x-i18n:
    generated_at: "2026-04-30T05:58:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: be0e2cd14990a53533c800cd8d305c9c50b0fa7131f6638e7b9d8dd9f2942fe8
    source_path: providers/openai.md
    workflow: 16
---

OpenAI proporciona API de desarrollador para modelos GPT, y Codex también está disponible como agente de codificación de planes de ChatGPT mediante los clientes Codex de OpenAI. OpenClaw mantiene esas superficies separadas para que la configuración siga siendo predecible.

OpenClaw admite tres rutas de la familia OpenAI. El prefijo del modelo selecciona la ruta de proveedor/autenticación; un ajuste de runtime separado selecciona quién ejecuta el bucle de agente integrado:

- **Clave de API** — acceso directo a OpenAI Platform con facturación por uso (modelos `openai/*`)
- **Suscripción Codex mediante PI** — inicio de sesión de ChatGPT/Codex con acceso de suscripción (modelos `openai-codex/*`)
- **Arnés de servidor de aplicación Codex** — ejecución nativa del servidor de aplicación Codex (modelos `openai/*` más `agents.defaults.agentRuntime.id: "codex"`)

OpenAI admite explícitamente el uso de OAuth de suscripción en herramientas y flujos de trabajo externos como OpenClaw.

El proveedor, el modelo, el runtime y el canal son capas separadas. Si esas etiquetas se están mezclando, lee [Runtimes de agentes](/es/concepts/agent-runtimes) antes de cambiar la configuración.

## Elección rápida

| Objetivo                                      | Usa                                              | Notas                                                                        |
| --------------------------------------------- | ------------------------------------------------ | ---------------------------------------------------------------------------- |
| Facturación directa con clave de API          | `openai/gpt-5.5`                                 | Define `OPENAI_API_KEY` o ejecuta la incorporación con clave de API de OpenAI. |
| GPT-5.5 con autenticación de suscripción ChatGPT/Codex | `openai-codex/gpt-5.5`                           | Ruta PI predeterminada para OAuth de Codex. La mejor primera opción para configuraciones con suscripción. |
| GPT-5.5 con comportamiento nativo del servidor de aplicación Codex | `openai/gpt-5.5` más `agentRuntime.id: "codex"` | Fuerza el arnés de servidor de aplicación Codex para esa referencia de modelo. |
| Generación o edición de imágenes              | `openai/gpt-image-2`                             | Funciona con `OPENAI_API_KEY` u OAuth de OpenAI Codex.                    |
| Imágenes con fondo transparente               | `openai/gpt-image-1.5`                           | Usa `outputFormat=png` o `webp` y `openai.background=transparent`.        |

## Mapa de nombres

Los nombres son similares pero no intercambiables:

| Nombre que ves                     | Capa              | Significado                                                                                       |
| ---------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------- |
| `openai`                           | Prefijo de proveedor | Ruta directa de la API de OpenAI Platform.                                                        |
| `openai-codex`                     | Prefijo de proveedor | Ruta de OAuth/suscripción de OpenAI Codex mediante el ejecutor PI normal de OpenClaw.              |
| Plugin `codex`                     | Plugin            | Plugin incluido de OpenClaw que proporciona runtime nativo del servidor de aplicación Codex y controles de chat `/codex`. |
| `agentRuntime.id: codex`           | Runtime de agente | Fuerza el arnés nativo de servidor de aplicación Codex para turnos integrados.                    |
| `/codex ...`                       | Conjunto de comandos de chat | Vincula/controla hilos del servidor de aplicación Codex desde una conversación.                   |
| `runtime: "acp", agentId: "codex"` | Ruta de sesión ACP | Ruta de reserva explícita que ejecuta Codex mediante ACP/acpx.                                    |

Esto significa que una configuración puede contener intencionadamente tanto `openai-codex/*` como el Plugin `codex`. Eso es válido cuando quieres OAuth de Codex mediante PI y también quieres que los controles de chat nativos `/codex` estén disponibles. `openclaw doctor` advierte sobre esa combinación para que puedas confirmar que es intencionada; no la reescribe.

<Note>
GPT-5.5 está disponible tanto mediante acceso directo con clave de API de OpenAI Platform como mediante rutas de suscripción/OAuth. Usa `openai/gpt-5.5` para tráfico directo de `OPENAI_API_KEY`, `openai-codex/gpt-5.5` para OAuth de Codex mediante PI, u `openai/gpt-5.5` con `agentRuntime.id: "codex"` para el arnés nativo de servidor de aplicación Codex.
</Note>

<Note>
Habilitar el Plugin de OpenAI, o seleccionar un modelo `openai-codex/*`, no habilita el Plugin de servidor de aplicación Codex incluido. OpenClaw habilita ese Plugin solo cuando seleccionas explícitamente el arnés nativo de Codex con `agentRuntime.id: "codex"` o usas una referencia de modelo heredada `codex/*`.
Si el Plugin incluido `codex` está habilitado pero `openai-codex/*` aún se resuelve mediante PI, `openclaw doctor` advierte y deja la ruta sin cambios.
</Note>

## Cobertura de funciones de OpenClaw

| Capacidad de OpenAI        | Superficie de OpenClaw                                      | Estado                                                 |
| ------------------------- | ---------------------------------------------------------- | ------------------------------------------------------ |
| Chat / Responses          | proveedor de modelos `openai/<model>`                      | Sí                                                     |
| Modelos de suscripción Codex | `openai-codex/<model>` con OAuth de `openai-codex`        | Sí                                                     |
| Arnés de servidor de aplicación Codex | `openai/<model>` con `agentRuntime.id: codex`             | Sí                                                     |
| Búsqueda web del lado del servidor | Herramienta nativa de OpenAI Responses                    | Sí, cuando la búsqueda web está habilitada y no hay proveedor fijado |
| Imágenes                  | `image_generate`                                           | Sí                                                     |
| Vídeos                    | `video_generate`                                           | Sí                                                     |
| Texto a voz               | `messages.tts.provider: "openai"` / `tts`                  | Sí                                                     |
| Voz a texto por lotes     | `tools.media.audio` / comprensión de medios                | Sí                                                     |
| Voz a texto en streaming  | Voice Call `streaming.provider: "openai"`                  | Sí                                                     |
| Voz en tiempo real        | Voice Call `realtime.provider: "openai"` / Control UI Talk | Sí                                                     |
| Embeddings                | proveedor de embeddings de memoria                         | Sí                                                     |

## Embeddings de memoria

OpenClaw puede usar OpenAI, o un endpoint de embeddings compatible con OpenAI, para la indexación de `memory_search` y los embeddings de consulta:

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "openai",
        model: "text-embedding-3-small",
      },
    },
  },
}
```

Para endpoints compatibles con OpenAI que requieran etiquetas de embeddings asimétricas, define `queryInputType` y `documentInputType` bajo `memorySearch`. OpenClaw las reenvía como campos de solicitud `input_type` específicos del proveedor: los embeddings de consulta usan `queryInputType`; los fragmentos de memoria indexados y la indexación por lotes usan `documentInputType`. Consulta la [referencia de configuración de memoria](/es/reference/memory-config#provider-specific-config) para ver el ejemplo completo.

## Primeros pasos

Elige tu método de autenticación preferido y sigue los pasos de configuración.

<Tabs>
  <Tab title="Clave de API (OpenAI Platform)">
    **Ideal para:** acceso directo a la API y facturación por uso.

    <Steps>
      <Step title="Obtén tu clave de API">
        Crea o copia una clave de API desde el [panel de OpenAI Platform](https://platform.openai.com/api-keys).
      </Step>
      <Step title="Ejecuta la incorporación">
        ```bash
        openclaw onboard --auth-choice openai-api-key
        ```

        O pasa la clave directamente:

        ```bash
        openclaw onboard --openai-api-key "$OPENAI_API_KEY"
        ```
      </Step>
      <Step title="Verifica que el modelo esté disponible">
        ```bash
        openclaw models list --provider openai
        ```
      </Step>
    </Steps>

    ### Resumen de ruta

    | Referencia de modelo    | Configuración de runtime    | Ruta                        | Autenticación    |
    | ---------------------- | -------------------------- | --------------------------- | ---------------- |
    | `openai/gpt-5.5`       | omitido / `agentRuntime.id: "pi"`    | API directa de OpenAI Platform | `OPENAI_API_KEY` |
    | `openai/gpt-5.4-mini`  | omitido / `agentRuntime.id: "pi"`    | API directa de OpenAI Platform | `OPENAI_API_KEY` |
    | `openai/gpt-5.5`       | `agentRuntime.id: "codex"`           | Arnés de servidor de aplicación Codex | servidor de aplicación Codex |

    <Note>
    `openai/*` es la ruta directa con clave de API de OpenAI salvo que fuerces explícitamente el arnés de servidor de aplicación Codex. Usa `openai-codex/*` para OAuth de Codex mediante el ejecutor PI predeterminado, o usa `openai/gpt-5.5` con `agentRuntime.id: "codex"` para ejecución nativa del servidor de aplicación Codex.
    </Note>

    ### Ejemplo de configuración

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
    }
    ```

    <Warning>
    OpenClaw **no** expone `openai/gpt-5.3-codex-spark`. Las solicitudes en vivo a la API de OpenAI rechazan ese modelo, y el catálogo actual de Codex tampoco lo expone.
    </Warning>

  </Tab>

  <Tab title="Suscripción Codex">
    **Ideal para:** usar tu suscripción de ChatGPT/Codex en lugar de una clave de API separada. Codex cloud requiere inicio de sesión de ChatGPT.

    <Steps>
      <Step title="Ejecuta OAuth de Codex">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        O ejecuta OAuth directamente:

        ```bash
        openclaw models auth login --provider openai-codex
        ```

        Para configuraciones sin interfaz o poco compatibles con callbacks, añade `--device-code` para iniciar sesión con un flujo de código de dispositivo de ChatGPT en lugar del callback de navegador localhost:

        ```bash
        openclaw models auth login --provider openai-codex --device-code
        ```
      </Step>
      <Step title="Define el modelo predeterminado">
        ```bash
        openclaw config set agents.defaults.model.primary openai-codex/gpt-5.5
        ```
      </Step>
      <Step title="Verifica que el modelo esté disponible">
        ```bash
        openclaw models list --provider openai-codex
        ```
      </Step>
    </Steps>

    ### Resumen de ruta

    | Referencia de modelo | Configuración de runtime | Ruta | Autenticación |
    |-----------|----------------|-------|------|
    | `openai-codex/gpt-5.5` | omitido / `runtime: "pi"` | OAuth de ChatGPT/Codex mediante PI | Inicio de sesión de Codex |
    | `openai-codex/gpt-5.5` | `runtime: "auto"` | Sigue siendo PI salvo que un Plugin reclame explícitamente `openai-codex` | Inicio de sesión de Codex |
    | `openai/gpt-5.5` | `agentRuntime.id: "codex"` | Arnés de servidor de aplicación Codex | Autenticación del servidor de aplicación Codex |

    <Note>
    Sigue usando el id de proveedor `openai-codex` para comandos de autenticación/perfil. El prefijo de modelo `openai-codex/*` también es la ruta PI explícita para OAuth de Codex. No selecciona ni habilita automáticamente el arnés de servidor de aplicación Codex incluido.
    </Note>

    <Warning>
    `openai-codex/gpt-5.4-mini` no es una ruta OAuth de Codex compatible. Usa `openai/gpt-5.4-mini` con una clave de API de OpenAI, o usa `openai-codex/gpt-5.5` con OAuth de Codex.
    </Warning>

    ### Ejemplo de configuración

    ```json5
    {
      agents: { defaults: { model: { primary: "openai-codex/gpt-5.5" } } },
    }
    ```

    <Note>
    La incorporación ya no importa material de OAuth desde `~/.codex`. Inicia sesión con OAuth en el navegador (predeterminado) o con el flujo de código de dispositivo anterior; OpenClaw gestiona las credenciales resultantes en su propio almacén de autenticación de agentes.
    </Note>

    ### Indicador de estado

    El chat `/status` muestra qué runtime de modelo está activo para la sesión actual.
    El harness PI predeterminado aparece como `Runtime: OpenClaw Pi Default`. Cuando se
    selecciona el harness de app-server Codex incluido, `/status` muestra
    `Runtime: OpenAI Codex`. Las sesiones existentes conservan su id de harness registrado, así que usa
    `/new` o `/reset` después de cambiar `agentRuntime` si quieres que `/status`
    refleje una nueva elección de PI/Codex.

    ### Advertencia de doctor

    Si el plugin `codex` incluido está habilitado mientras está seleccionada la ruta
    `openai-codex/*` de esta pestaña, `openclaw doctor` advierte que el modelo
    todavía se resuelve mediante PI. Mantén la configuración sin cambios cuando esa sea la
    ruta prevista de autenticación por suscripción. Cambia a `openai/<model>` más
    `agentRuntime.id: "codex"` solo cuando quieras ejecución nativa de app-server
    Codex.

    ### Límite de ventana de contexto

    OpenClaw trata los metadatos del modelo y el límite de contexto del runtime como valores separados.

    Para `openai-codex/gpt-5.5` mediante Codex OAuth:

    - `contextWindow` nativo: `1000000`
    - Límite predeterminado de runtime `contextTokens`: `272000`

    El límite predeterminado más pequeño tiene mejores características de latencia y calidad en la práctica. Sobrescríbelo con `contextTokens`:

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
    Usa `contextWindow` para declarar los metadatos nativos del modelo. Usa `contextTokens` para limitar el presupuesto de contexto del runtime.
    </Note>

    ### Recuperación del catálogo

    OpenClaw usa los metadatos del catálogo Codex ascendente para `gpt-5.5` cuando están
    presentes. Si el descubrimiento en vivo de Codex omite la fila `openai-codex/gpt-5.5` mientras
    la cuenta está autenticada, OpenClaw sintetiza esa fila de modelo OAuth para que
    cron, sub-agent y las ejecuciones con modelo predeterminado configurado no fallen con
    `Unknown model`.

  </Tab>
</Tabs>

## Autenticación nativa del app-server Codex

El harness nativo de app-server Codex usa refs de modelo `openai/*` más
`agentRuntime.id: "codex"`, pero su autenticación sigue estando basada en cuenta. OpenClaw
selecciona la autenticación en este orden:

1. Un perfil de autenticación explícito de OpenClaw `openai-codex` vinculado al agent.
2. La cuenta existente del app-server, como un inicio de sesión local de Codex CLI ChatGPT.
3. Solo para lanzamientos locales de app-server por stdio, `CODEX_API_KEY`, luego
   `OPENAI_API_KEY`, cuando el app-server informa que no hay cuenta y aún requiere
   autenticación de OpenAI.

Eso significa que un inicio de sesión local de suscripción ChatGPT/Codex no se reemplaza solo
porque el proceso del gateway también tenga `OPENAI_API_KEY` para modelos directos de OpenAI
o embeddings. La alternativa de clave API por env es solo la ruta local stdio sin cuenta; no
se envía a conexiones WebSocket de app-server. Cuando se selecciona un perfil Codex de estilo suscripción,
OpenClaw también mantiene `CODEX_API_KEY` y `OPENAI_API_KEY`
fuera del proceso hijo stdio de app-server generado y envía las credenciales seleccionadas
mediante el RPC de inicio de sesión del app-server.

## Generación de imágenes

El plugin `openai` incluido registra la generación de imágenes mediante la herramienta `image_generate`.
Admite tanto la generación de imágenes con clave API de OpenAI como la generación de imágenes con Codex OAuth
mediante la misma ref de modelo `openai/gpt-image-2`.

| Capacidad                | Clave API de OpenAI                | Codex OAuth                          |
| ------------------------- | ---------------------------------- | ------------------------------------ |
| Ref de modelo             | `openai/gpt-image-2`               | `openai/gpt-image-2`                 |
| Autenticación             | `OPENAI_API_KEY`                   | Inicio de sesión OpenAI Codex OAuth  |
| Transporte                | OpenAI Images API                  | Backend Codex Responses              |
| Máx. imágenes por solicitud | 4                                | 4                                    |
| Modo de edición           | Habilitado (hasta 5 imágenes de referencia) | Habilitado (hasta 5 imágenes de referencia) |
| Sobrescrituras de tamaño  | Admitidas, incluidos tamaños 2K/4K | Admitidas, incluidos tamaños 2K/4K   |
| Relación de aspecto / resolución | No se reenvía a OpenAI Images API | Se asigna a un tamaño admitido cuando es seguro |

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
Consulta [Generación de imágenes](/es/tools/image-generation) para los parámetros compartidos de la herramienta, la selección de proveedor y el comportamiento de failover.
</Note>

`gpt-image-2` es el valor predeterminado tanto para la generación de texto a imagen de OpenAI como para la
edición de imágenes. `gpt-image-1.5`, `gpt-image-1` y `gpt-image-1-mini` siguen siendo utilizables como
sobrescrituras explícitas de modelo. Usa `openai/gpt-image-1.5` para salida PNG/WebP
con fondo transparente; la API actual de `gpt-image-2` rechaza
`background: "transparent"`.

Para una solicitud de fondo transparente, los agents deben llamar a `image_generate` con
`model: "openai/gpt-image-1.5"`, `outputFormat: "png"` o `"webp"`, y
`background: "transparent"`; la opción de proveedor anterior `openai.background` todavía se
acepta. OpenClaw también protege las rutas públicas de OpenAI y
OpenAI Codex OAuth reescribiendo las solicitudes transparentes predeterminadas de `openai/gpt-image-2`
a `gpt-image-1.5`; Azure y los endpoints personalizados compatibles con OpenAI conservan
sus nombres de implementación/modelo configurados.

La misma configuración se expone para ejecuciones CLI headless:

```bash
openclaw infer image generate \
  --model openai/gpt-image-1.5 \
  --output-format png \
  --background transparent \
  --prompt "A simple red circle sticker on a transparent background" \
  --json
```

Usa las mismas flags `--output-format` y `--background` con
`openclaw infer image edit` al comenzar desde un archivo de entrada.
`--openai-background` sigue disponible como alias específico de OpenAI.

Para instalaciones con Codex OAuth, conserva la misma ref `openai/gpt-image-2`. Cuando se
configura un perfil OAuth `openai-codex`, OpenClaw resuelve ese token de acceso OAuth
almacenado y envía solicitudes de imagen mediante el backend Codex Responses. No
intenta primero `OPENAI_API_KEY` ni recurre silenciosamente a una clave API para esa
solicitud. Configura `models.providers.openai` explícitamente con una clave API,
URL base personalizada o endpoint de Azure cuando quieras la ruta directa de OpenAI Images API
en su lugar.
Si ese endpoint de imagen personalizado está en una dirección LAN/privada de confianza, define también
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`; OpenClaw mantiene
bloqueados los endpoints de imagen compatibles con OpenAI privados/internos a menos que esta suscripción explícita esté
presente.

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

El plugin `openai` incluido registra la generación de video mediante la herramienta `video_generate`.

| Capacidad       | Valor                                                                             |
| ---------------- | --------------------------------------------------------------------------------- |
| Modelo predeterminado | `openai/sora-2`                                                              |
| Modos            | Texto a video, imagen a video, edición de un solo video                           |
| Entradas de referencia | 1 imagen o 1 video                                                          |
| Sobrescrituras de tamaño | Admitidas                                                                 |
| Otras sobrescrituras | `aspectRatio`, `resolution`, `audio`, `watermark` se ignoran con una advertencia de la herramienta |

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
Consulta [Generación de video](/es/tools/video-generation) para los parámetros compartidos de la herramienta, la selección de proveedor y el comportamiento de failover.
</Note>

## Contribución de prompt GPT-5

OpenClaw añade una contribución de prompt GPT-5 compartida para ejecuciones de la familia GPT-5 entre proveedores. Se aplica por id de modelo, así que `openai-codex/gpt-5.5`, `openai/gpt-5.5`, `openrouter/openai/gpt-5.5`, `opencode/gpt-5.5` y otras refs compatibles de GPT-5 reciben la misma superposición. Los modelos GPT-4.x anteriores no.

El harness nativo Codex incluido usa el mismo comportamiento GPT-5 y la misma superposición de Heartbeat mediante instrucciones de desarrollador del app-server Codex, así que las sesiones `openai/gpt-5.x` forzadas mediante `agentRuntime.id: "codex"` conservan la misma guía de seguimiento y Heartbeat proactivo, aunque Codex sea propietario del resto del prompt del harness.

La contribución GPT-5 añade un contrato de comportamiento etiquetado para persistencia de persona, seguridad de ejecución, disciplina de herramientas, forma de salida, comprobaciones de finalización y verificación. El comportamiento de respuesta específico de canal y de mensaje silencioso permanece en el prompt del sistema compartido de OpenClaw y la política de entrega saliente. La guía GPT-5 siempre está habilitada para los modelos coincidentes. La capa de estilo de interacción amigable es independiente y configurable.

| Valor                  | Efecto                                      |
| ---------------------- | ------------------------------------------- |
| `"friendly"` (predeterminado) | Habilita la capa de estilo de interacción amigable |
| `"on"`                 | Alias de `"friendly"`                       |
| `"off"`                | Deshabilita solo la capa de estilo amigable |

<Tabs>
  <Tab title="Configuración">
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
Los valores no distinguen entre mayúsculas y minúsculas en tiempo de ejecución, así que `"Off"` y `"off"` deshabilitan ambos la capa de estilo amigable.
</Tip>

<Note>
El valor heredado `plugins.entries.openai.config.personality` todavía se lee como alternativa de compatibilidad cuando la configuración compartida `agents.defaults.promptOverlays.gpt5.personality` no está definida.
</Note>

## Voz y habla

<AccordionGroup>
  <Accordion title="Síntesis de voz (TTS)">
    El plugin `openai` incluido registra la síntesis de voz para la superficie `messages.tts`.

    | Configuración | Ruta de configuración | Predeterminado |
    |---------|------------|---------|
    | Modelo | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | Voz | `messages.tts.providers.openai.voice` | `coral` |
    | Velocidad | `messages.tts.providers.openai.speed` | (sin definir) |
    | Instrucciones | `messages.tts.providers.openai.instructions` | (sin definir, solo `gpt-4o-mini-tts`) |
    | Formato | `messages.tts.providers.openai.responseFormat` | `opus` para notas de voz, `mp3` para archivos |
    | Clave API | `messages.tts.providers.openai.apiKey` | Recurre a `OPENAI_API_KEY` |
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
    Define `OPENAI_TTS_BASE_URL` para sobrescribir la URL base de TTS sin afectar el endpoint de la API de chat.
    </Note>

  </Accordion>

  <Accordion title="Voz a texto">
    El plugin `openai` incluido registra voz a texto por lotes mediante
    la superficie de transcripción de comprensión de medios de OpenClaw.

    - Modelo predeterminado: `gpt-4o-transcribe`
    - Endpoint: OpenAI REST `/v1/audio/transcriptions`
    - Ruta de entrada: carga de archivo de audio multipart
    - Compatible con OpenClaw dondequiera que la transcripción de audio entrante use
      `tools.media.audio`, incluidos segmentos de canales de voz de Discord y adjuntos de audio
      de canal

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

    Las sugerencias de idioma y de indicación se reenvían a OpenAI cuando las
    proporciona la configuración compartida de medios de audio o la solicitud de
    transcripción por llamada.

  </Accordion>

  <Accordion title="Transcripción en tiempo real">
    El Plugin `openai` incluido registra la transcripción en tiempo real para el Plugin Voice Call.

    | Configuración | Ruta de configuración | Predeterminado |
    |---------|------------|---------|
    | Modelo | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | Idioma | `...openai.language` | (sin definir) |
    | Indicación | `...openai.prompt` | (sin definir) |
    | Duración del silencio | `...openai.silenceDurationMs` | `800` |
    | Umbral de VAD | `...openai.vadThreshold` | `0.5` |
    | Clave de API | `...openai.apiKey` | Recurre a `OPENAI_API_KEY` |

    <Note>
    Usa una conexión WebSocket a `wss://api.openai.com/v1/realtime` con audio G.711 u-law (`g711_ulaw` / `audio/pcmu`). Este proveedor de streaming es para la ruta de transcripción en tiempo real de Voice Call; la voz de Discord actualmente graba segmentos cortos y usa en su lugar la ruta de transcripción por lotes `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="Voz en tiempo real">
    El Plugin `openai` incluido registra voz en tiempo real para el Plugin Voice Call.

    | Configuración | Ruta de configuración | Predeterminado |
    |---------|------------|---------|
    | Modelo | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime-1.5` |
    | Voz | `...openai.voice` | `alloy` |
    | Temperatura | `...openai.temperature` | `0.8` |
    | Umbral de VAD | `...openai.vadThreshold` | `0.5` |
    | Duración del silencio | `...openai.silenceDurationMs` | `500` |
    | Clave de API | `...openai.apiKey` | Recurre a `OPENAI_API_KEY` |

    <Note>
    Admite Azure OpenAI mediante las claves de configuración `azureEndpoint` y `azureDeployment` para puentes backend en tiempo real. Admite llamadas bidireccionales a herramientas. Usa el formato de audio G.711 u-law.
    </Note>

    <Note>
    Control UI Talk usa sesiones en tiempo real de OpenAI en el navegador con un secreto de cliente efímero
    acuñado por el Gateway y un intercambio SDP WebRTC directo del navegador contra la
    API Realtime de OpenAI. La verificación en vivo para mantenedores está disponible con
    `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`;
    el tramo de OpenAI acuña un secreto de cliente en Node, genera una oferta SDP del navegador
    con medios de micrófono falsos, la envía a OpenAI y aplica la respuesta SDP
    sin registrar secretos.
    </Note>

  </Accordion>
</AccordionGroup>

## Puntos de conexión de Azure OpenAI

El proveedor `openai` incluido puede apuntar a un recurso de Azure OpenAI para la generación de
imágenes anulando la URL base. En la ruta de generación de imágenes, OpenClaw
detecta nombres de host de Azure en `models.providers.openai.baseUrl` y cambia a
la forma de solicitud de Azure automáticamente.

<Note>
La voz en tiempo real usa una ruta de configuración separada
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)
y no se ve afectada por `models.providers.openai.baseUrl`. Consulta el acordeón **Voz en tiempo
real** en [Voz y habla](#voice-and-speech) para su configuración de Azure.
</Note>

Usa Azure OpenAI cuando:

- Ya tienes una suscripción, cuota o acuerdo empresarial de Azure OpenAI
- Necesitas residencia regional de datos o controles de cumplimiento que proporciona Azure
- Quieres mantener el tráfico dentro de una tenencia de Azure existente

### Configuración

Para la generación de imágenes de Azure a través del proveedor `openai` incluido, apunta
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

Para las solicitudes de generación de imágenes en un host de Azure reconocido, OpenClaw:

- Envía el encabezado `api-key` en lugar de `Authorization: Bearer`
- Usa rutas con ámbito de implementación (`/openai/deployments/{deployment}/...`)
- Añade `?api-version=...` a cada solicitud
- Usa un tiempo de espera predeterminado de solicitud de 600 s para las llamadas de generación de imágenes de Azure.
  Los valores `timeoutMs` por llamada siguen anulando este valor predeterminado.

Otras URL base (OpenAI público, proxies compatibles con OpenAI) mantienen la forma estándar
de solicitud de imágenes de OpenAI.

<Note>
El enrutamiento de Azure para la ruta de generación de imágenes del proveedor `openai` requiere
OpenClaw 2026.4.22 o posterior. Las versiones anteriores tratan cualquier
`openai.baseUrl` personalizado como el punto de conexión público de OpenAI y fallarán contra
implementaciones de imágenes de Azure.
</Note>

### Versión de API

Establece `AZURE_OPENAI_API_VERSION` para fijar una versión específica de Azure, preliminar o GA,
para la ruta de generación de imágenes de Azure:

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

El valor predeterminado es `2024-12-01-preview` cuando la variable no está definida.

### Los nombres de modelo son nombres de implementación

Azure OpenAI vincula modelos a implementaciones. Para solicitudes de generación de imágenes de Azure
enrutadas a través del proveedor `openai` incluido, el campo `model` en OpenClaw
debe ser el **nombre de implementación de Azure** que configuraste en el portal de Azure, no
el identificador público del modelo de OpenAI.

Si creas una implementación llamada `gpt-image-2-prod` que sirve `gpt-image-2`:

```
/tool image_generate model=openai/gpt-image-2-prod prompt="A clean poster" size=1024x1024 count=1
```

La misma regla de nombre de implementación se aplica a las llamadas de generación de imágenes enrutadas a través
del proveedor `openai` incluido.

### Disponibilidad regional

La generación de imágenes de Azure está disponible actualmente solo en un subconjunto de regiones
(por ejemplo `eastus2`, `swedencentral`, `polandcentral`, `westus3`,
`uaenorth`). Consulta la lista de regiones actual de Microsoft antes de crear una
implementación y confirma que el modelo específico se ofrece en tu región.

### Diferencias de parámetros

Azure OpenAI y OpenAI público no siempre aceptan los mismos parámetros de imagen.
Azure puede rechazar opciones que OpenAI público permite (por ejemplo ciertos
valores de `background` en `gpt-image-2`) o exponerlas solo en versiones específicas de modelo.
Estas diferencias provienen de Azure y del modelo subyacente, no de
OpenClaw. Si una solicitud de Azure falla con un error de validación, comprueba el
conjunto de parámetros admitido por tu implementación y versión de API específicas en el
portal de Azure.

<Note>
Azure OpenAI usa transporte nativo y comportamiento de compatibilidad, pero no recibe
los encabezados de atribución ocultos de OpenClaw; consulta el acordeón **Rutas nativas frente a compatibles con OpenAI**
en [Configuración avanzada](#advanced-configuration).

Para tráfico de chat o Responses en Azure (más allá de la generación de imágenes), usa el
flujo de incorporación o una configuración dedicada de proveedor de Azure; `openai.baseUrl` por sí solo
no adopta la forma de API/autenticación de Azure. Existe un proveedor
`azure-openai-responses/*` separado; consulta
el acordeón de Compaction del lado del servidor a continuación.
</Note>

## Configuración avanzada

<AccordionGroup>
  <Accordion title="Transporte (WebSocket frente a SSE)">
    OpenClaw usa WebSocket primero con alternativa SSE (`"auto"`) tanto para `openai/*` como para `openai-codex/*`.

    En modo `"auto"`, OpenClaw:
    - Reintenta un fallo temprano de WebSocket antes de recurrir a SSE
    - Después de un fallo, marca WebSocket como degradado durante ~60 segundos y usa SSE durante el enfriamiento
    - Adjunta encabezados estables de identidad de sesión y turno para reintentos y reconexiones
    - Normaliza los contadores de uso (`input_tokens` / `prompt_tokens`) entre variantes de transporte

    | Valor | Comportamiento |
    |-------|----------|
    | `"auto"` (predeterminado) | WebSocket primero, alternativa SSE |
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

  <Accordion title="Preparación de WebSocket">
    OpenClaw habilita la preparación de WebSocket de forma predeterminada para `openai/*` y `openai-codex/*` para reducir la latencia del primer turno.

    ```json5
    // Disable warm-up
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

    - **Chat/IU:** `/fast status|on|off`
    - **Configuración:** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    Cuando está habilitado, OpenClaw asigna el modo rápido al procesamiento prioritario de OpenAI (`service_tier = "priority"`). Se preservan los valores existentes de `service_tier`, y el modo rápido no reescribe `reasoning` ni `text.verbosity`.

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
    Las anulaciones de sesión prevalecen sobre la configuración. Borrar la anulación de sesión en la IU Sessions devuelve la sesión al valor predeterminado configurado.
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

    Valores admitidos: `auto`, `default`, `flex`, `priority`.

    <Warning>
    `serviceTier` solo se reenvía a puntos de conexión nativos de OpenAI (`api.openai.com`) y puntos de conexión nativos de Codex (`chatgpt.com/backend-api`). Si enrutas cualquiera de los proveedores a través de un proxy, OpenClaw deja `service_tier` intacto.
    </Warning>

  </Accordion>

  <Accordion title="Compaction del lado del servidor (API Responses)">
    Para modelos directos de OpenAI Responses (`openai/*` en `api.openai.com`), el contenedor de streaming Pi-harness del Plugin de OpenAI habilita automáticamente la Compaction del lado del servidor:

    - Fuerza `store: true` (a menos que la compatibilidad del modelo establezca `supportsStore: false`)
    - Inyecta `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - `compact_threshold` predeterminado: 70 % de `contextWindow` (o `80000` cuando no esté disponible)

    Esto se aplica a la ruta Pi harness integrada y a los hooks del proveedor de OpenAI usados por ejecuciones embebidas. El harness nativo del servidor de aplicación Codex gestiona su propio contexto a través de Codex y se configura por separado con `agents.defaults.agentRuntime.id`.

    <Tabs>
      <Tab title="Habilitar explícitamente">
        Útil para puntos de conexión compatibles como Azure OpenAI Responses:

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
      <Tab title="Desactivar">
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
    `responsesServerCompaction` solo controla la inyección de `context_management`. Los modelos directos de OpenAI Responses siguen forzando `store: true`, salvo que compat establezca `supportsStore: false`.
    </Note>

  </Accordion>

  <Accordion title="Modo GPT strict-agentic">
    Para ejecuciones de la familia GPT-5 en `openai/*`, OpenClaw puede usar un contrato de ejecución integrado más estricto:

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
    - Ya no trata un turno solo de planificación como progreso correcto cuando hay disponible una acción de herramienta
    - Reintenta el turno con una directriz para actuar ahora
    - Activa automáticamente `update_plan` para trabajo sustancial
    - Muestra un estado bloqueado explícito si el modelo sigue planificando sin actuar

    <Note>
    Limitado únicamente a ejecuciones de la familia GPT-5 de OpenAI y Codex. Otros proveedores y familias de modelos anteriores mantienen el comportamiento predeterminado.
    </Note>

  </Accordion>

  <Accordion title="Rutas nativas frente a compatibles con OpenAI">
    OpenClaw trata los endpoints directos de OpenAI, Codex y Azure OpenAI de forma distinta a los proxies `/v1` genéricos compatibles con OpenAI:

    **Rutas nativas** (`openai/*`, Azure OpenAI):
    - Mantienen `reasoning: { effort: "none" }` solo para modelos que admiten el esfuerzo `none` de OpenAI
    - Omiten el razonamiento desactivado para modelos o proxies que rechazan `reasoning.effort: "none"`
    - Establecen por defecto los esquemas de herramientas en modo estricto
    - Adjuntan encabezados de atribución ocultos solo en hosts nativos verificados
    - Mantienen la conformación de solicitudes exclusiva de OpenAI (`service_tier`, `store`, compatibilidad de razonamiento, indicaciones de caché de prompt)

    **Rutas proxy/compatibles:**
    - Usan un comportamiento de compatibilidad más flexible
    - Eliminan `store` de Completions de las cargas útiles `openai-completions` no nativas
    - Aceptan JSON avanzado de paso directo `params.extra_body`/`params.extraBody` para proxies de Completions compatibles con OpenAI
    - Aceptan `params.chat_template_kwargs` para proxies de Completions compatibles con OpenAI, como vLLM
    - No fuerzan esquemas de herramientas estrictos ni encabezados exclusivos de rutas nativas

    Azure OpenAI usa transporte nativo y comportamiento de compatibilidad, pero no recibe los encabezados de atribución ocultos.

  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Selección de modelo" href="/es/concepts/model-providers" icon="layers">
    Elegir proveedores, referencias de modelos y comportamiento de conmutación por error.
  </Card>
  <Card title="Generación de imágenes" href="/es/tools/image-generation" icon="image">
    Parámetros compartidos de herramientas de imagen y selección de proveedor.
  </Card>
  <Card title="Generación de video" href="/es/tools/video-generation" icon="video">
    Parámetros compartidos de herramientas de video y selección de proveedor.
  </Card>
  <Card title="OAuth y autenticación" href="/es/gateway/authentication" icon="key">
    Detalles de autenticación y reglas de reutilización de credenciales.
  </Card>
</CardGroup>
