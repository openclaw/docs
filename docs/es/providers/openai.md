---
read_when:
    - Quiere usar modelos de OpenAI en OpenClaw
    - Quieres usar la autenticación con suscripción de Codex en lugar de claves de API
    - Necesitas un comportamiento de ejecución de agentes de GPT-5 más estricto
summary: Usar OpenAI mediante claves de API o una suscripción a Codex en OpenClaw
title: OpenAI
x-i18n:
    generated_at: "2026-05-02T05:34:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: d7e98179f5a7d90289ed6cdad1c4dd03834f42e3fcc747d24c7d29a47e103392
    source_path: providers/openai.md
    workflow: 16
---

OpenAI proporciona API de desarrollo para modelos GPT, y Codex también está disponible como agente de programación de planes de ChatGPT mediante los clientes Codex de OpenAI. OpenClaw mantiene esas superficies separadas para que la configuración siga siendo predecible.

OpenClaw admite tres rutas de la familia OpenAI. La mayoría de los suscriptores de ChatGPT/Codex que quieren el comportamiento de Codex deben usar el runtime nativo de servidor de aplicación de Codex. El prefijo del modelo selecciona el proveedor/nombre de modelo; una configuración de runtime independiente selecciona quién ejecuta el bucle de agente integrado:

- **Clave de API** - acceso directo a OpenAI Platform con facturación basada en uso (modelos `openai/*`)
- **Suscripción a Codex con runtime nativo de Codex** - inicio de sesión de ChatGPT/Codex más ejecución del servidor de aplicación de Codex (modelos `openai/*` más `agents.defaults.agentRuntime.id: "codex"`)
- **Suscripción a Codex mediante PI** - inicio de sesión de ChatGPT/Codex con el ejecutor de PI normal de OpenClaw (modelos `openai-codex/*`)

OpenAI admite explícitamente el uso de OAuth de suscripción en herramientas y flujos de trabajo externos como OpenClaw.

Proveedor, modelo, runtime y canal son capas separadas. Si esas etiquetas se están mezclando, lee [Runtimes de agentes](/es/concepts/agent-runtimes) antes de cambiar la configuración.

## Elección rápida

| Objetivo                                             | Usa                                              | Notas                                                                     |
| ---------------------------------------------------- | ------------------------------------------------ | ------------------------------------------------------------------------- |
| Suscripción de ChatGPT/Codex con runtime nativo de Codex | `openai/gpt-5.5` más `agentRuntime.id: "codex"` | Configuración de Codex recomendada para la mayoría de usuarios. Inicia sesión con autenticación `openai-codex`. |
| Facturación directa con clave de API                 | `openai/gpt-5.5`                                 | Define `OPENAI_API_KEY` o ejecuta la incorporación de clave de API de OpenAI. |
| Autenticación de suscripción de ChatGPT/Codex mediante PI | `openai-codex/gpt-5.5`                           | Úsalo solo cuando quieras intencionalmente el ejecutor de PI normal.      |
| Generación o edición de imágenes                     | `openai/gpt-image-2`                             | Funciona con `OPENAI_API_KEY` u OAuth de OpenAI Codex.                    |
| Imágenes con fondo transparente                      | `openai/gpt-image-1.5`                           | Usa `outputFormat=png` o `webp` y `openai.background=transparent`.        |

## Mapa de nombres

Los nombres son similares, pero no intercambiables:

| Nombre que ves                      | Capa              | Significado                                                                                       |
| ---------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------- |
| `openai`                           | Prefijo de proveedor | Ruta directa de la API de OpenAI Platform.                                                        |
| `openai-codex`                     | Prefijo de proveedor | Ruta de OAuth/suscripción de OpenAI Codex mediante el ejecutor de PI normal de OpenClaw.          |
| Plugin `codex`                     | Plugin            | Plugin incluido de OpenClaw que proporciona runtime nativo de servidor de aplicación de Codex y controles de chat `/codex`. |
| `agentRuntime.id: codex`           | Runtime de agente | Fuerza el arnés nativo del servidor de aplicación de Codex para turnos integrados.                |
| `/codex ...`                       | Conjunto de comandos de chat | Vincula/controla hilos del servidor de aplicación de Codex desde una conversación.                 |
| `runtime: "acp", agentId: "codex"` | Ruta de sesión ACP | Ruta alternativa explícita que ejecuta Codex mediante ACP/acpx.                                   |

Esto significa que una configuración puede contener intencionalmente tanto `openai-codex/*` como el Plugin `codex`. Eso es válido cuando quieres OAuth de Codex mediante PI y también quieres que estén disponibles los controles de chat nativos `/codex`. `openclaw doctor` advierte sobre esa combinación para que puedas confirmar que es intencional; no la reescribe.

<Note>
GPT-5.5 está disponible tanto mediante acceso directo con clave de API de OpenAI Platform como mediante rutas de suscripción/OAuth. Para suscripción de ChatGPT/Codex más ejecución nativa de Codex, usa `openai/gpt-5.5` con `agentRuntime.id: "codex"`. Usa `openai-codex/gpt-5.5` solo para OAuth de Codex mediante PI, u `openai/gpt-5.5` sin una anulación de runtime de Codex para tráfico directo de `OPENAI_API_KEY`.
</Note>

<Note>
Habilitar el Plugin de OpenAI, o seleccionar un modelo `openai-codex/*`, no habilita el Plugin incluido de servidor de aplicación de Codex. OpenClaw habilita ese Plugin solo cuando seleccionas explícitamente el arnés nativo de Codex con `agentRuntime.id: "codex"` o usas una referencia heredada de modelo `codex/*`.
Si el Plugin incluido `codex` está habilitado, pero `openai-codex/*` todavía se resuelve mediante PI, `openclaw doctor` advierte y deja la ruta sin cambios.
</Note>

## Cobertura de funciones de OpenClaw

| Capacidad de OpenAI       | Superficie de OpenClaw                                      | Estado                                                 |
| ------------------------- | ---------------------------------------------------------- | ------------------------------------------------------ |
| Chat / Responses          | Proveedor de modelo `openai/<model>`                       | Sí                                                     |
| Modelos de suscripción de Codex | `openai-codex/<model>` con OAuth `openai-codex`       | Sí                                                     |
| Arnés de servidor de aplicación de Codex | `openai/<model>` con `agentRuntime.id: codex` | Sí                                                     |
| Búsqueda web del lado del servidor | Herramienta nativa de OpenAI Responses               | Sí, cuando la búsqueda web está habilitada y no hay proveedor fijado |
| Imágenes                  | `image_generate`                                           | Sí                                                     |
| Videos                    | `video_generate`                                           | Sí                                                     |
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

Para endpoints compatibles con OpenAI que requieren etiquetas de embeddings asimétricas, define `queryInputType` y `documentInputType` bajo `memorySearch`. OpenClaw las reenvía como campos de solicitud `input_type` específicos del proveedor: los embeddings de consulta usan `queryInputType`; los fragmentos de memoria indexados y la indexación por lotes usan `documentInputType`. Consulta la [referencia de configuración de memoria](/es/reference/memory-config#provider-specific-config) para ver el ejemplo completo.

## Primeros pasos

Elige tu método de autenticación preferido y sigue los pasos de configuración.

<Tabs>
  <Tab title="API key (OpenAI Platform)">
    **Ideal para:** acceso directo a la API y facturación basada en uso.

    <Steps>
      <Step title="Get your API key">
        Crea o copia una clave de API desde el [panel de OpenAI Platform](https://platform.openai.com/api-keys).
      </Step>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard --auth-choice openai-api-key
        ```

        O pasa la clave directamente:

        ```bash
        openclaw onboard --openai-api-key "$OPENAI_API_KEY"
        ```
      </Step>
      <Step title="Verify the model is available">
        ```bash
        openclaw models list --provider openai
        ```
      </Step>
    </Steps>

    ### Resumen de rutas

    | Referencia de modelo   | Configuración de runtime    | Ruta                        | Autenticación    |
    | ---------------------- | -------------------------- | --------------------------- | ---------------- |
    | `openai/gpt-5.5`       | omitido / `agentRuntime.id: "pi"`    | API directa de OpenAI Platform | `OPENAI_API_KEY` |
    | `openai/gpt-5.4-mini`  | omitido / `agentRuntime.id: "pi"`    | API directa de OpenAI Platform | `OPENAI_API_KEY` |
    | `openai/gpt-5.5`       | `agentRuntime.id: "codex"`           | Arnés de servidor de aplicación de Codex | servidor de aplicación de Codex |

    <Note>
    `openai/*` es la ruta directa con clave de API de OpenAI, salvo que fuerces explícitamente el arnés de servidor de aplicación de Codex. Usa `openai-codex/*` para OAuth de Codex mediante el ejecutor de PI predeterminado, o usa `openai/gpt-5.5` con `agentRuntime.id: "codex"` para la ejecución nativa del servidor de aplicación de Codex.
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

  <Tab title="Codex subscription">
    **Ideal para:** usar tu suscripción de ChatGPT/Codex con ejecución nativa del servidor de aplicación de Codex en lugar de una clave de API independiente. Codex cloud requiere iniciar sesión en ChatGPT.

    <Steps>
      <Step title="Run Codex OAuth">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        O ejecuta OAuth directamente:

        ```bash
        openclaw models auth login --provider openai-codex
        ```

        Para configuraciones sin interfaz o incompatibles con callbacks, añade `--device-code` para iniciar sesión con un flujo de código de dispositivo de ChatGPT en lugar del callback del navegador en localhost:

        ```bash
        openclaw models auth login --provider openai-codex --device-code
        ```
      </Step>
      <Step title="Use the native Codex runtime">
        ```bash
        openclaw config set plugins.entries.codex '{ enabled: true }' --strict-json --merge
        openclaw config set agents.defaults.model.primary openai/gpt-5.5
        openclaw config set agents.defaults.agentRuntime '{ id: "codex", fallback: "none" }' --strict-json
        ```
      </Step>
      <Step title="Verify Codex auth is available">
        ```bash
        openclaw models list --provider openai-codex
        ```

        Después de que el Gateway esté en ejecución, envía `/codex status` o `/codex models` en el chat para verificar el runtime nativo de servidor de aplicación.
      </Step>
    </Steps>

    ### Resumen de rutas

    | Referencia de modelo | Configuración de runtime | Ruta | Autenticación |
    |-----------|----------------|-------|------|
    | `openai/gpt-5.5` | `agentRuntime.id: "codex"` | Arnés nativo de servidor de aplicación de Codex | Inicio de sesión de Codex o perfil `openai-codex` seleccionado |
    | `openai-codex/gpt-5.5` | omitido / `runtime: "pi"` | OAuth de ChatGPT/Codex mediante PI | Inicio de sesión de Codex |
    | `openai-codex/gpt-5.4-mini` | omitido / `runtime: "pi"` | OAuth de ChatGPT/Codex mediante PI | Inicio de sesión de Codex |
    | `openai-codex/gpt-5.5` | `runtime: "auto"` | Sigue siendo PI salvo que un Plugin reclame explícitamente `openai-codex` | Inicio de sesión de Codex |

    <Note>
    Sigue usando el id de proveedor `openai-codex` para comandos de autenticación/perfil. El
    prefijo de modelo `openai-codex/*` también es la ruta PI explícita para Codex OAuth.
    No selecciona ni habilita automáticamente el arnés de app-server Codex incluido. Para
    la configuración común de suscripción más runtime nativo, inicia sesión con
    `openai-codex`, pero conserva la referencia de modelo como `openai/gpt-5.5` y configura
    `agentRuntime.id: "codex"`.
    </Note>

    ### Ejemplo de configuración

    ```json5
    {
      plugins: { entries: { codex: { enabled: true } } },
      agents: {
        defaults: {
          model: { primary: "openai/gpt-5.5" },
          agentRuntime: { id: "codex", fallback: "none" },
        },
      },
    }
    ```

    Para conservar Codex OAuth en el ejecutor PI normal en su lugar, usa
    `openai-codex/gpt-5.5` y omite la anulación del runtime Codex.

    <Note>
    La incorporación ya no importa material OAuth desde `~/.codex`. Inicia sesión con OAuth en el navegador (predeterminado) o con el flujo de código de dispositivo anterior; OpenClaw administra las credenciales resultantes en su propio almacén de autenticación de agentes.
    </Note>

    ### Indicador de estado

    El chat `/status` muestra qué runtime de modelo está activo para la sesión actual.
    El arnés PI predeterminado aparece como `Runtime: OpenClaw Pi Default`. Cuando se
    selecciona el arnés de app-server Codex incluido, `/status` muestra
    `Runtime: OpenAI Codex`. Las sesiones existentes conservan su id de arnés registrado, así que usa
    `/new` o `/reset` después de cambiar `agentRuntime` si quieres que `/status`
    refleje una nueva elección de PI/Codex.

    ### Advertencia de doctor

    Si el Plugin `codex` incluido está habilitado mientras una ruta `openai-codex/*`
    está seleccionada, `openclaw doctor` advierte que el modelo todavía se resuelve mediante PI.
    Mantén la configuración sin cambios solo cuando esa ruta PI de autenticación por suscripción sea
    intencional. Cambia a `openai/<model>` más `agentRuntime.id: "codex"` cuando
    quieras ejecución nativa de app-server Codex.

    ### Límite de ventana de contexto

    OpenClaw trata los metadatos del modelo y el límite de contexto del runtime como valores separados.

    Para `openai-codex/gpt-5.5` mediante Codex OAuth:

    - `contextWindow` nativo: `1000000`
    - Límite predeterminado de `contextTokens` del runtime: `272000`

    El límite predeterminado más pequeño ofrece mejores características de latencia y calidad en la práctica. Anúlalo con `contextTokens`:

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
    Usa `contextWindow` para declarar metadatos nativos del modelo. Usa `contextTokens` para limitar el presupuesto de contexto del runtime.
    </Note>

    ### Recuperación del catálogo

    OpenClaw usa los metadatos del catálogo Codex upstream para `gpt-5.5` cuando están
    presentes. Si el descubrimiento en vivo de Codex omite la fila `openai-codex/gpt-5.5` mientras
    la cuenta está autenticada, OpenClaw sintetiza esa fila de modelo OAuth para que
    las ejecuciones de cron, sub-agente y modelo predeterminado configurado no fallen con
    `Unknown model`.

  </Tab>
</Tabs>

## Autenticación nativa de app-server Codex

El arnés nativo de app-server Codex usa referencias de modelo `openai/*` más
`agentRuntime.id: "codex"`, pero su autenticación sigue basada en cuenta. OpenClaw
selecciona la autenticación en este orden:

1. Un perfil de autenticación explícito `openai-codex` de OpenClaw vinculado al agente.
2. La cuenta existente del app-server, como un inicio de sesión local de ChatGPT de Codex CLI.
3. Solo para lanzamientos locales de app-server por stdio, `CODEX_API_KEY`, luego
   `OPENAI_API_KEY`, cuando el app-server informa que no hay cuenta y todavía requiere
   autenticación de OpenAI.

Eso significa que un inicio de sesión local con suscripción a ChatGPT/Codex no se reemplaza solo
porque el proceso de Gateway también tenga `OPENAI_API_KEY` para modelos directos de OpenAI
o embeddings. La alternativa de clave API por entorno es solo la ruta local stdio sin cuenta; no
se envía a conexiones de app-server por WebSocket. Cuando se selecciona un perfil Codex
de estilo suscripción, OpenClaw también mantiene `CODEX_API_KEY` y `OPENAI_API_KEY`
fuera del proceso hijo de app-server stdio generado y envía las credenciales seleccionadas
mediante el RPC de inicio de sesión del app-server.

## Generación de imágenes

El Plugin `openai` incluido registra la generación de imágenes mediante la herramienta `image_generate`.
Admite tanto generación de imágenes con clave API de OpenAI como generación de imágenes con Codex OAuth
mediante la misma referencia de modelo `openai/gpt-image-2`.

| Capacidad                 | Clave API de OpenAI                | Codex OAuth                         |
| ------------------------- | ---------------------------------- | ----------------------------------- |
| Referencia de modelo      | `openai/gpt-image-2`               | `openai/gpt-image-2`                |
| Autenticación             | `OPENAI_API_KEY`                   | Inicio de sesión OpenAI Codex OAuth |
| Transporte                | OpenAI Images API                  | Backend Codex Responses             |
| Máx. imágenes por solicitud | 4                                | 4                                   |
| Modo de edición           | Habilitado (hasta 5 imágenes de referencia) | Habilitado (hasta 5 imágenes de referencia) |
| Anulaciones de tamaño     | Compatibles, incluidos tamaños 2K/4K | Compatibles, incluidos tamaños 2K/4K |
| Relación de aspecto / resolución | No se reenvía a OpenAI Images API | Se asigna a un tamaño compatible cuando es seguro |

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
Consulta [Generación de imágenes](/es/tools/image-generation) para parámetros compartidos de herramientas, selección de proveedor y comportamiento de conmutación por error.
</Note>

`gpt-image-2` es el valor predeterminado tanto para la generación de texto a imagen de OpenAI como para la
edición de imágenes. `gpt-image-1.5`, `gpt-image-1` y `gpt-image-1-mini` siguen siendo utilizables como
anulaciones explícitas de modelo. Usa `openai/gpt-image-1.5` para salida PNG/WebP
con fondo transparente; la API actual `gpt-image-2` rechaza
`background: "transparent"`.

Para una solicitud con fondo transparente, los agentes deben llamar a `image_generate` con
`model: "openai/gpt-image-1.5"`, `outputFormat: "png"` o `"webp"`, y
`background: "transparent"`; la opción de proveedor anterior `openai.background` todavía
se acepta. OpenClaw también protege las rutas públicas OpenAI y
OpenAI Codex OAuth reescribiendo las solicitudes transparentes predeterminadas de `openai/gpt-image-2`
a `gpt-image-1.5`; Azure y los endpoints personalizados compatibles con OpenAI conservan
sus nombres de implementación/modelo configurados.

La misma configuración se expone para ejecuciones CLI sin interfaz:

```bash
openclaw infer image generate \
  --model openai/gpt-image-1.5 \
  --output-format png \
  --background transparent \
  --prompt "A simple red circle sticker on a transparent background" \
  --json
```

Usa las mismas marcas `--output-format` y `--background` con
`openclaw infer image edit` al comenzar desde un archivo de entrada.
`--openai-background` sigue disponible como alias específico de OpenAI.

Para instalaciones con Codex OAuth, conserva la misma referencia `openai/gpt-image-2`. Cuando se
configura un perfil OAuth `openai-codex`, OpenClaw resuelve ese token de acceso OAuth
almacenado y envía solicitudes de imagen mediante el backend Codex Responses. No
prueba primero `OPENAI_API_KEY` ni recurre silenciosamente a una clave API para esa
solicitud. Configura `models.providers.openai` explícitamente con una clave API,
URL base personalizada o endpoint de Azure cuando quieras usar la ruta directa de OpenAI Images API
en su lugar.
Si ese endpoint personalizado de imagen está en una dirección LAN/privada de confianza, configura también
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`; OpenClaw mantiene
bloqueados los endpoints de imagen privados/internos compatibles con OpenAI salvo que esta inclusión
explícita esté presente.

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

El Plugin `openai` incluido registra la generación de video mediante la herramienta `video_generate`.

| Capacidad             | Valor                                                                             |
| --------------------- | --------------------------------------------------------------------------------- |
| Modelo predeterminado | `openai/sora-2`                                                                   |
| Modos                 | Texto a video, imagen a video, edición de un solo video                           |
| Entradas de referencia | 1 imagen o 1 video                                                               |
| Anulaciones de tamaño | Compatibles                                                                       |
| Otras anulaciones     | `aspectRatio`, `resolution`, `audio`, `watermark` se ignoran con una advertencia de la herramienta |

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
Consulta [Generación de video](/es/tools/video-generation) para parámetros compartidos de herramientas, selección de proveedor y comportamiento de conmutación por error.
</Note>

## Contribución de prompt para GPT-5

OpenClaw agrega una contribución de prompt compartida para ejecuciones de la familia GPT-5 entre proveedores. Se aplica por id de modelo, así que `openai-codex/gpt-5.5`, `openai/gpt-5.5`, `openrouter/openai/gpt-5.5`, `opencode/gpt-5.5` y otras referencias GPT-5 compatibles reciben la misma superposición. Los modelos GPT-4.x anteriores no.

El arnés nativo Codex incluido usa el mismo comportamiento GPT-5 y la misma superposición Heartbeat mediante instrucciones de desarrollador del app-server Codex, así que las sesiones `openai/gpt-5.x` forzadas mediante `agentRuntime.id: "codex"` conservan la misma guía de seguimiento y Heartbeat proactivo aunque Codex sea dueño del resto del prompt del arnés.

La contribución GPT-5 agrega un contrato de comportamiento etiquetado para persistencia de personalidad, seguridad de ejecución, disciplina de herramientas, forma de salida, comprobaciones de finalización y verificación. El comportamiento de respuesta específico del canal y de mensajes silenciosos permanece en el prompt del sistema compartido de OpenClaw y en la política de entrega saliente. La guía GPT-5 siempre está habilitada para los modelos coincidentes. La capa de estilo de interacción amigable es independiente y configurable.

| Valor                  | Efecto                                             |
| ---------------------- | -------------------------------------------------- |
| `"friendly"` (predeterminado) | Habilita la capa de estilo de interacción amigable |
| `"on"`                 | Alias de `"friendly"`                              |
| `"off"`                | Deshabilita solo la capa de estilo amigable        |

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
Los valores no distinguen mayúsculas y minúsculas en runtime, así que `"Off"` y `"off"` deshabilitan la capa de estilo amigable.
</Tip>

<Note>
El `plugins.entries.openai.config.personality` heredado todavía se lee como alternativa de compatibilidad cuando la configuración compartida `agents.defaults.promptOverlays.gpt5.personality` no está definida.
</Note>

## Voz y habla

<AccordionGroup>
  <Accordion title="Síntesis de voz (TTS)">
    El Plugin `openai` incluido registra la síntesis de voz para la superficie `messages.tts`.

    | Ajuste | Ruta de configuración | Predeterminado |
    |---------|------------|---------|
    | Modelo | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | Voz | `messages.tts.providers.openai.voice` | `coral` |
    | Velocidad | `messages.tts.providers.openai.speed` | (sin definir) |
    | Instrucciones | `messages.tts.providers.openai.instructions` | (sin definir, solo `gpt-4o-mini-tts`) |
    | Formato | `messages.tts.providers.openai.responseFormat` | `opus` para notas de voz, `mp3` para archivos |
    | Clave de API | `messages.tts.providers.openai.apiKey` | Recurre a `OPENAI_API_KEY` |
    | URL base | `messages.tts.providers.openai.baseUrl` | `https://api.openai.com/v1` |
    | Cuerpo adicional | `messages.tts.providers.openai.extraBody` / `extra_body` | (sin definir) |

    Modelos disponibles: `gpt-4o-mini-tts`, `tts-1`, `tts-1-hd`. Voces disponibles: `alloy`, `ash`, `ballad`, `cedar`, `coral`, `echo`, `fable`, `juniper`, `marin`, `onyx`, `nova`, `sage`, `shimmer`, `verse`.

    `extraBody` se fusiona en el JSON de la solicitud a `/audio/speech` después de los campos generados por OpenClaw, así que úsalo para endpoints compatibles con OpenAI que requieran claves adicionales como `lang`. Las claves de prototipo se ignoran.

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
    Define `OPENAI_TTS_BASE_URL` para sobrescribir la URL base de TTS sin afectar al endpoint de la API de chat.
    </Note>

  </Accordion>

  <Accordion title="Speech-to-text">
    El Plugin `openai` incluido registra la conversión de voz a texto por lotes mediante
    la superficie de transcripción de comprensión multimedia de OpenClaw.

    - Modelo predeterminado: `gpt-4o-transcribe`
    - Endpoint: REST de OpenAI `/v1/audio/transcriptions`
    - Ruta de entrada: carga de archivo de audio multipart
    - Compatible con OpenClaw siempre que la transcripción de audio entrante use
      `tools.media.audio`, incluidos segmentos de canales de voz de Discord y adjuntos
      de audio de canales

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
    configuración compartida de medios de audio o la solicitud de transcripción por llamada.

  </Accordion>

  <Accordion title="Realtime transcription">
    El Plugin `openai` incluido registra transcripción en tiempo real para el Plugin Voice Call.

    | Ajuste | Ruta de configuración | Predeterminado |
    |---------|------------|---------|
    | Modelo | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | Idioma | `...openai.language` | (sin definir) |
    | Prompt | `...openai.prompt` | (sin definir) |
    | Duración del silencio | `...openai.silenceDurationMs` | `800` |
    | Umbral VAD | `...openai.vadThreshold` | `0.5` |
    | Clave de API | `...openai.apiKey` | Recurre a `OPENAI_API_KEY` |

    <Note>
    Usa una conexión WebSocket a `wss://api.openai.com/v1/realtime` con audio G.711 u-law (`g711_ulaw` / `audio/pcmu`). Este proveedor de streaming es para la ruta de transcripción en tiempo real de Voice Call; actualmente, la voz de Discord graba segmentos cortos y usa en su lugar la ruta de transcripción por lotes `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="Realtime voice">
    El Plugin `openai` incluido registra voz en tiempo real para el Plugin Voice Call.

    | Ajuste | Ruta de configuración | Predeterminado |
    |---------|------------|---------|
    | Modelo | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime-1.5` |
    | Voz | `...openai.voice` | `alloy` |
    | Temperatura | `...openai.temperature` | `0.8` |
    | Umbral VAD | `...openai.vadThreshold` | `0.5` |
    | Duración del silencio | `...openai.silenceDurationMs` | `500` |
    | Clave de API | `...openai.apiKey` | Recurre a `OPENAI_API_KEY` |

    <Note>
    Admite Azure OpenAI mediante las claves de configuración `azureEndpoint` y `azureDeployment` para puentes de backend en tiempo real. Admite llamadas a herramientas bidireccionales. Usa el formato de audio G.711 u-law.
    </Note>

    <Note>
    Control UI Talk usa sesiones en tiempo real de OpenAI en el navegador con un secreto de cliente
    efímero emitido por Gateway y un intercambio SDP WebRTC directo del navegador contra la
    API Realtime de OpenAI. La verificación en vivo de mantenedor está disponible con
    `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`;
    el tramo de OpenAI emite un secreto de cliente en Node, genera una oferta SDP del navegador
    con medios de micrófono simulados, la publica en OpenAI y aplica la respuesta SDP
    sin registrar secretos.
    </Note>

  </Accordion>
</AccordionGroup>

## Endpoints de Azure OpenAI

El proveedor `openai` incluido puede apuntar a un recurso de Azure OpenAI para la generación
de imágenes sobrescribiendo la URL base. En la ruta de generación de imágenes, OpenClaw
detecta nombres de host de Azure en `models.providers.openai.baseUrl` y cambia automáticamente
al formato de solicitud de Azure.

<Note>
La voz en tiempo real usa una ruta de configuración separada
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)
y no se ve afectada por `models.providers.openai.baseUrl`. Consulta el acordeón **Realtime
voice** bajo [Voice and speech](#voice-and-speech) para ver su configuración de Azure.
</Note>

Usa Azure OpenAI cuando:

- Ya tengas una suscripción, cuota o acuerdo empresarial de Azure OpenAI
- Necesites residencia regional de datos o controles de cumplimiento que proporciona Azure
- Quieras mantener el tráfico dentro de una tenencia de Azure existente

### Configuración

Para la generación de imágenes de Azure mediante el proveedor `openai` incluido, apunta
`models.providers.openai.baseUrl` a tu recurso de Azure y define `apiKey` con
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

- Envía el encabezado `api-key` en lugar de `Authorization: Bearer`
- Usa rutas con ámbito de implementación (`/openai/deployments/{deployment}/...`)
- Añade `?api-version=...` a cada solicitud
- Usa un tiempo de espera predeterminado de solicitud de 600 s para llamadas de generación de imágenes de Azure.
  Los valores `timeoutMs` por llamada siguen sobrescribiendo este valor predeterminado.

Otras URL base (OpenAI público, proxies compatibles con OpenAI) mantienen el formato estándar
de solicitud de imagen de OpenAI.

<Note>
El enrutamiento de Azure para la ruta de generación de imágenes del proveedor `openai` requiere
OpenClaw 2026.4.22 o posterior. Las versiones anteriores tratan cualquier
`openai.baseUrl` personalizado como el endpoint público de OpenAI y fallarán contra implementaciones
de imágenes de Azure.
</Note>

### Versión de API

Define `AZURE_OPENAI_API_VERSION` para fijar una versión preliminar o GA específica de Azure
para la ruta de generación de imágenes de Azure:

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

El valor predeterminado es `2024-12-01-preview` cuando la variable no está definida.

### Los nombres de modelo son nombres de implementación

Azure OpenAI vincula modelos a implementaciones. Para solicitudes de generación de imágenes de Azure
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

Actualmente, la generación de imágenes de Azure solo está disponible en un subconjunto de regiones
(por ejemplo, `eastus2`, `swedencentral`, `polandcentral`, `westus3`,
`uaenorth`). Consulta la lista actual de regiones de Microsoft antes de crear una
implementación y confirma que el modelo específico se ofrece en tu región.

### Diferencias de parámetros

Azure OpenAI y OpenAI público no siempre aceptan los mismos parámetros de imagen.
Azure puede rechazar opciones que OpenAI público permite (por ejemplo, ciertos
valores de `background` en `gpt-image-2`) o exponerlas solo en versiones de modelo
específicas. Estas diferencias provienen de Azure y del modelo subyacente, no de
OpenClaw. Si una solicitud de Azure falla con un error de validación, consulta el
conjunto de parámetros admitido por tu implementación y versión de API específicas en el
portal de Azure.

<Note>
Azure OpenAI usa transporte nativo y comportamiento de compatibilidad, pero no recibe
los encabezados de atribución ocultos de OpenClaw; consulta el acordeón **Native vs OpenAI-compatible
routes** bajo [Advanced configuration](#advanced-configuration).

Para tráfico de chat o Responses en Azure (más allá de la generación de imágenes), usa el
flujo de incorporación o una configuración dedicada de proveedor de Azure: `openai.baseUrl` por sí solo
no adopta el formato de API/autenticación de Azure. Existe un proveedor separado
`azure-openai-responses/*`; consulta
el acordeón de compaction del lado del servidor a continuación.
</Note>

## Configuración avanzada

<AccordionGroup>
  <Accordion title="Transport (WebSocket vs SSE)">
    OpenClaw usa WebSocket primero con fallback a SSE (`"auto"`) tanto para `openai/*` como para `openai-codex/*`.

    En modo `"auto"`, OpenClaw:
    - Reintenta un fallo temprano de WebSocket antes de hacer fallback a SSE
    - Después de un fallo, marca WebSocket como degradado durante ~60 segundos y usa SSE durante el enfriamiento
    - Adjunta encabezados estables de identidad de sesión y turno para reintentos y reconexiones
    - Normaliza contadores de uso (`input_tokens` / `prompt_tokens`) entre variantes de transporte

    | Valor | Comportamiento |
    |-------|----------|
    | `"auto"` (predeterminado) | WebSocket primero, fallback a SSE |
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
    - [Realtime API with WebSocket](https://platform.openai.com/docs/guides/realtime-websocket)
    - [Streaming API responses (SSE)](https://platform.openai.com/docs/guides/streaming-responses)

  </Accordion>

  <Accordion title="WebSocket warm-up">
    OpenClaw habilita el calentamiento de WebSocket de forma predeterminada para `openai/*` y `openai-codex/*` para reducir la latencia del primer turno.

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

  <Accordion title="Fast mode">
    OpenClaw expone un interruptor compartido de modo rápido para `openai/*` y `openai-codex/*`:

    - **Chat/UI:** `/fast status|on|off`
    - **Configuración:** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    Cuando está habilitado, OpenClaw asigna el modo rápido al procesamiento prioritario de OpenAI (`service_tier = "priority"`). Los valores existentes de `service_tier` se preservan, y el modo rápido no reescribe `reasoning` ni `text.verbosity`.

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
    Las sobrescrituras de sesión prevalecen sobre la configuración. Borrar la sobrescritura de sesión en la UI de Sessions devuelve la sesión al valor predeterminado configurado.
    </Note>

  </Accordion>

  <Accordion title="Priority processing (service_tier)">
    La API de OpenAI expone procesamiento prioritario mediante `service_tier`. Defínelo por modelo en OpenClaw:

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
    `serviceTier` solo se reenvía a endpoints nativos de OpenAI (`api.openai.com`) y endpoints nativos de Codex (`chatgpt.com/backend-api`). Si enrutas cualquiera de los proveedores a través de un proxy, OpenClaw deja `service_tier` intacto.
    </Warning>

  </Accordion>

  <Accordion title="Compaction del lado del servidor (Responses API)">
    Para modelos directos de OpenAI Responses (`openai/*` en `api.openai.com`), el envoltorio de flujo Pi-harness del Plugin de OpenAI habilita automáticamente la Compaction del lado del servidor:

    - Fuerza `store: true` (salvo que la compatibilidad del modelo establezca `supportsStore: false`)
    - Inyecta `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - `compact_threshold` predeterminado: 70 % de `contextWindow` (o `80000` cuando no esté disponible)

    Esto se aplica a la ruta integrada del arnés Pi y a los hooks de proveedor de OpenAI usados por ejecuciones embebidas. El arnés nativo del servidor de aplicaciones de Codex gestiona su propio contexto mediante Codex y se configura por separado con `agents.defaults.agentRuntime.id`.

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
    `responsesServerCompaction` solo controla la inyección de `context_management`. Los modelos directos de OpenAI Responses siguen forzando `store: true`, salvo que la compatibilidad establezca `supportsStore: false`.
    </Note>

  </Accordion>

  <Accordion title="Modo GPT agente estricto">
    Para ejecuciones de la familia GPT-5 en `openai/*`, OpenClaw puede usar un contrato de ejecución embebida más estricto:

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
    - Reintenta el turno con una orientación para actuar ahora
    - Habilita automáticamente `update_plan` para trabajos sustanciales
    - Muestra un estado bloqueado explícito si el modelo sigue planificando sin actuar

    <Note>
    Limitado solo a ejecuciones de la familia GPT-5 de OpenAI y Codex. Otros proveedores y familias de modelos anteriores mantienen el comportamiento predeterminado.
    </Note>

  </Accordion>

  <Accordion title="Rutas nativas frente a compatibles con OpenAI">
    OpenClaw trata los endpoints directos de OpenAI, Codex y Azure OpenAI de forma distinta a los proxies `/v1` genéricos compatibles con OpenAI:

    **Rutas nativas** (`openai/*`, Azure OpenAI):
    - Mantienen `reasoning: { effort: "none" }` solo para modelos que admiten el esfuerzo `none` de OpenAI
    - Omiten el razonamiento deshabilitado para modelos o proxies que rechazan `reasoning.effort: "none"`
    - Usan el modo estricto como valor predeterminado para los esquemas de herramientas
    - Adjuntan encabezados de atribución ocultos solo en hosts nativos verificados
    - Mantienen el moldeado de solicitudes exclusivo de OpenAI (`service_tier`, `store`, compatibilidad de razonamiento, sugerencias de caché de prompts)

    **Rutas proxy/compatibles:**
    - Usan un comportamiento de compatibilidad más flexible
    - Eliminan `store` de Completions en cargas útiles `openai-completions` no nativas
    - Aceptan JSON de paso avanzado `params.extra_body`/`params.extraBody` para proxies de Completions compatibles con OpenAI
    - Aceptan `params.chat_template_kwargs` para proxies de Completions compatibles con OpenAI como vLLM
    - No fuerzan esquemas de herramientas estrictos ni encabezados solo nativos

    Azure OpenAI usa transporte nativo y comportamiento de compatibilidad, pero no recibe los encabezados de atribución ocultos.

  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Selección de modelos" href="/es/concepts/model-providers" icon="layers">
    Elección de proveedores, referencias de modelos y comportamiento de conmutación por error.
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
