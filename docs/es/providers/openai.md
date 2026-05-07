---
read_when:
    - Quieres usar modelos de OpenAI en OpenClaw
    - Quieres usar la autenticación con suscripción de Codex en lugar de claves de API
    - Necesitas un comportamiento de ejecución de agentes GPT-5 más estricto
summary: Usar OpenAI mediante claves de API o una suscripción a Codex en OpenClaw
title: OpenAI
x-i18n:
    generated_at: "2026-05-07T13:23:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9a37c0b2c227674b6762aea70ce6d640d49044117c9244377058032ade561d6b
    source_path: providers/openai.md
    workflow: 16
---

OpenAI proporciona APIs para desarrolladores para modelos GPT, y Codex también está disponible como agente de programación de planes de ChatGPT a través de los clientes Codex de OpenAI. OpenClaw mantiene esas superficies separadas para que la configuración siga siendo predecible.

OpenClaw usa `openai/*` como la ruta canónica de modelos OpenAI. Los turnos de agentes integrados en modelos OpenAI se ejecutan mediante el runtime nativo del servidor de aplicaciones de Codex de forma predeterminada; la autenticación directa con clave de API de OpenAI sigue disponible para superficies OpenAI que no son de agente, como imágenes, embeddings, voz y tiempo real.

- **Modelos de agente** - modelos `openai/*` mediante el runtime de Codex; inicia sesión con la autenticación `openai-codex` para usar una suscripción ChatGPT/Codex, o configura un perfil de clave de API `openai-codex` cuando quieras usar intencionadamente autenticación con clave de API.
- **APIs OpenAI que no son de agente** - acceso directo a OpenAI Platform con facturación por uso mediante `OPENAI_API_KEY` o incorporación con clave de API de OpenAI.
- **Configuración heredada** - las referencias de modelo `openai-codex/*` se reparan con `openclaw doctor --fix` a `openai/*` más el runtime de Codex.

OpenAI admite explícitamente el uso de OAuth de suscripción en herramientas y flujos de trabajo externos como OpenClaw.

Proveedor, modelo, runtime y canal son capas separadas. Si esas etiquetas se están mezclando, lee [Runtimes de agente](/es/concepts/agent-runtimes) antes de cambiar la configuración.

## Elección rápida

| Objetivo                                             | Usar                                                    | Notas                                                                 |
| ---------------------------------------------------- | ------------------------------------------------------- | --------------------------------------------------------------------- |
| Suscripción ChatGPT/Codex con runtime nativo de Codex | `openai/gpt-5.5`                                        | Configuración predeterminada de agente OpenAI. Inicia sesión con autenticación `openai-codex`. |
| Facturación directa con clave de API para modelos de agente | `openai/gpt-5.5` más un perfil de clave de API `openai-codex` | Usa `auth.order.openai-codex` para preferir ese perfil.               |
| Facturación directa con clave de API mediante PI explícito | `openai/gpt-5.5` más `agentRuntime.id: "pi"`           | Selecciona un perfil normal de clave de API `openai`.                 |
| Alias de API de ChatGPT Instant más reciente         | `openai/chat-latest`                                    | Solo clave de API directa. Alias cambiante para experimentos, no el predeterminado. |
| Autenticación de suscripción ChatGPT/Codex mediante PI explícito | `openai/gpt-5.5` más `agentRuntime.id: "pi"`           | Selecciona un perfil de autenticación `openai-codex` para la ruta de compatibilidad. |
| Generación o edición de imágenes                     | `openai/gpt-image-2`                                    | Funciona con `OPENAI_API_KEY` u OpenAI Codex OAuth.                   |
| Imágenes con fondo transparente                      | `openai/gpt-image-1.5`                                  | Usa `outputFormat=png` o `webp` y `openai.background=transparent`.    |

## Mapa de nombres

Los nombres son similares, pero no intercambiables:

| Nombre que ves                    | Capa                | Significado                                                                                      |
| ---------------------------------- | ------------------- | ------------------------------------------------------------------------------------------------- |
| `openai`                           | Prefijo de proveedor | Ruta canónica de modelos OpenAI; los turnos de agente usan el runtime de Codex.                   |
| `openai-codex`                     | Prefijo de autenticación/perfil | Proveedor de perfil de autenticación OAuth/suscripción de OpenAI Codex.                           |
| `codex` plugin                     | Plugin              | Plugin incluido de OpenClaw que proporciona el runtime nativo del servidor de aplicaciones de Codex y controles de chat `/codex`. |
| `agentRuntime.id: codex`           | Runtime de agente   | Fuerza el arnés nativo del servidor de aplicaciones de Codex para turnos integrados.              |
| `/codex ...`                       | Conjunto de comandos de chat | Vincula/controla hilos del servidor de aplicaciones de Codex desde una conversación.              |
| `runtime: "acp", agentId: "codex"` | Ruta de sesión ACP  | Ruta alternativa explícita que ejecuta Codex mediante ACP/acpx.                                   |

Esto significa que una configuración puede contener intencionadamente tanto referencias de modelo `openai/*` como perfiles de autenticación `openai-codex`. `openclaw doctor --fix` reescribe las referencias heredadas de modelo `openai-codex/*` a la ruta canónica de modelos OpenAI.

<Note>
GPT-5.5 está disponible mediante acceso directo con clave de API de OpenAI Platform y mediante rutas de suscripción/OAuth. Para suscripción ChatGPT/Codex más ejecución nativa de Codex, usa `openai/gpt-5.5`; la configuración de runtime sin establecer ahora selecciona el arnés de Codex para turnos de agente OpenAI. Usa perfiles de clave de API de OpenAI solo cuando quieras autenticación directa con clave de API para un modelo de agente OpenAI.
</Note>

<Note>
Los turnos de modelos de agente OpenAI requieren el plugin incluido del servidor de aplicaciones de Codex. La configuración explícita del runtime PI sigue disponible como ruta de compatibilidad opcional. Cuando PI se selecciona explícitamente con un perfil de autenticación `openai-codex`, OpenClaw mantiene la referencia de modelo pública como `openai/*` y enruta PI internamente mediante el transporte heredado de autenticación Codex. Ejecuta `openclaw doctor --fix` para reparar referencias de modelo `openai-codex/*` obsoletas o fijaciones antiguas de sesión PI que no provienen de configuración explícita de runtime.
</Note>

## Cobertura de funciones de OpenClaw

| Capacidad de OpenAI       | Superficie de OpenClaw                                           | Estado                                                 |
| ------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------ |
| Chat / Responses          | Proveedor de modelos `openai/<model>`                             | Sí                                                     |
| Modelos de suscripción Codex | `openai/<model>` con OAuth `openai-codex`                       | Sí                                                     |
| Referencias heredadas de modelo Codex | `openai-codex/<model>`                                  | Reparadas por doctor a `openai/<model>`                |
| Arnés del servidor de aplicaciones de Codex | `openai/<model>` con runtime omitido o `agentRuntime.id: codex` | Sí                                          |
| Búsqueda web del lado del servidor | Herramienta nativa OpenAI Responses                         | Sí, cuando la búsqueda web está habilitada y no hay proveedor fijado |
| Imágenes                  | `image_generate`                                                  | Sí                                                     |
| Videos                    | `video_generate`                                                  | Sí                                                     |
| Texto a voz               | `messages.tts.provider: "openai"` / `tts`                         | Sí                                                     |
| Voz a texto por lotes     | `tools.media.audio` / comprensión multimedia                      | Sí                                                     |
| Voz a texto en streaming  | Voice Call `streaming.provider: "openai"`                         | Sí                                                     |
| Voz en tiempo real        | Voice Call `realtime.provider: "openai"` / Control UI Talk        | Sí                                                     |
| Embeddings                | proveedor de embeddings de memoria                                | Sí                                                     |

## Embeddings de memoria

OpenClaw puede usar OpenAI, o un endpoint de embeddings compatible con OpenAI, para embeddings de indexación y consulta de `memory_search`:

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

Para endpoints compatibles con OpenAI que requieren etiquetas de embeddings asimétricas, establece `queryInputType` y `documentInputType` dentro de `memorySearch`. OpenClaw los reenvía como campos de solicitud `input_type` específicos del proveedor: los embeddings de consulta usan `queryInputType`; los fragmentos de memoria indexados y la indexación por lotes usan `documentInputType`. Consulta la [Referencia de configuración de memoria](/es/reference/memory-config#provider-specific-config) para ver el ejemplo completo.

## Primeros pasos

Elige tu método de autenticación preferido y sigue los pasos de configuración.

<Tabs>
  <Tab title="Clave de API (OpenAI Platform)">
    **Recomendado para:** acceso directo a la API y facturación por uso.

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

    ### Resumen de rutas

    | Referencia de modelo   | Configuración de runtime             | Ruta                       | Autenticación             |
    | ---------------------- | ------------------------------------ | -------------------------- | ------------------------- |
    | `openai/gpt-5.5`      | omitida / `agentRuntime.id: "codex"` | Arnés del servidor de aplicaciones de Codex | perfil `openai-codex` |
    | `openai/gpt-5.4-mini` | omitida / `agentRuntime.id: "codex"` | Arnés del servidor de aplicaciones de Codex | perfil `openai-codex` |
    | `openai/gpt-5.5`      | `agentRuntime.id: "pi"`              | Runtime integrado PI       | perfil `openai` o perfil `openai-codex` seleccionado |

    <Note>
    Los modelos de agente `openai/*` usan el arnés del servidor de aplicaciones de Codex. Para usar autenticación con clave de API para un modelo de agente, crea un perfil de clave de API `openai-codex` y ordénalo con `auth.order.openai-codex`; `OPENAI_API_KEY` sigue siendo la alternativa directa para superficies de API OpenAI que no son de agente.
    </Note>

    ### Ejemplo de configuración

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
    }
    ```

    Para probar el modelo Instant actual de ChatGPT desde la API de OpenAI, establece el modelo en `openai/chat-latest`:

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/chat-latest" } } },
    }
    ```

    `chat-latest` es un alias cambiante. OpenAI lo documenta como el modelo Instant más reciente usado en ChatGPT y recomienda `gpt-5.5` para uso de API en producción, así que mantén `openai/gpt-5.5` como valor predeterminado estable salvo que quieras explícitamente ese comportamiento de alias. Actualmente, el alias solo acepta verbosidad de texto `medium`, por lo que OpenClaw normaliza las anulaciones incompatibles de verbosidad de texto de OpenAI para este modelo.

    <Warning>
    OpenClaw **no** expone `openai/gpt-5.3-codex-spark`. Las solicitudes en vivo a la API de OpenAI rechazan ese modelo, y el catálogo actual de Codex tampoco lo expone.
    </Warning>

  </Tab>

  <Tab title="Suscripción Codex">
    **Recomendado para:** usar tu suscripción ChatGPT/Codex con ejecución nativa del servidor de aplicaciones de Codex en lugar de una clave de API separada. La nube de Codex requiere iniciar sesión en ChatGPT.

    <Steps>
      <Step title="Ejecuta Codex OAuth">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        O ejecuta OAuth directamente:

        ```bash
        openclaw models auth login --provider openai-codex
        ```

        Para configuraciones sin interfaz o incompatibles con callbacks, agrega `--device-code` para iniciar sesión con un flujo de código de dispositivo de ChatGPT en lugar del callback de navegador localhost:

        ```bash
        openclaw models auth login --provider openai-codex --device-code
        ```
      </Step>
      <Step title="Usa la ruta canónica de modelos OpenAI">
        ```bash
        openclaw config set agents.defaults.model.primary openai/gpt-5.5
        ```

        No se requiere configuración de runtime para la ruta predeterminada. Los turnos de agente de OpenAI
        seleccionan automáticamente el runtime app-server nativo de Codex, y OpenClaw
        instala o repara el Plugin de Codex incluido cuando se elige esta ruta.
      </Step>
      <Step title="Verify Codex auth is available">
        ```bash
        openclaw models list --provider openai-codex
        ```

        Después de que el gateway esté en ejecución, envía `/codex status` o `/codex models`
        en el chat para verificar el runtime app-server nativo.
      </Step>
    </Steps>

    ### Resumen de rutas

    | Referencia de modelo | Configuración de runtime | Ruta | Autenticación |
    |-----------|----------------|-------|------|
    | `openai/gpt-5.5` | omitida / `agentRuntime.id: "codex"` | Entorno app-server nativo de Codex | Inicio de sesión en Codex o perfil `openai-codex` seleccionado |
    | `openai/gpt-5.5` | `agentRuntime.id: "pi"` | Runtime integrado de PI con transporte interno de autenticación de Codex | Perfil `openai-codex` seleccionado |
    | `openai-codex/gpt-5.5` | reparada por doctor | Ruta heredada reescrita a `openai/gpt-5.5` | Perfil `openai-codex` existente |

    <Warning>
    No configures referencias de modelo antiguas `openai-codex/gpt-5.1*`, `openai-codex/gpt-5.2*` ni
    `openai-codex/gpt-5.3*`. Las cuentas OAuth de ChatGPT/Codex ahora rechazan
    esos modelos. Usa `openai/gpt-5.5`; los turnos de agente de OpenAI ahora seleccionan el runtime de Codex
    de forma predeterminada.
    </Warning>

    <Note>
    Sigue usando el id de proveedor `openai-codex` para los comandos de autenticación/perfil. El
    prefijo de modelo `openai-codex/*` es configuración heredada reparada por doctor. Para la
    configuración común de suscripción más runtime nativo, inicia sesión con `openai-codex`
    pero mantén la referencia de modelo como `openai/gpt-5.5`.
    </Note>

    ### Ejemplo de configuración

    ```json5
    {
      plugins: { entries: { codex: { enabled: true } } },
      agents: {
        defaults: {
          model: { primary: "openai/gpt-5.5" },
          agentRuntime: { id: "codex" },
        },
      },
    }
    ```

    <Note>
    La incorporación ya no importa material OAuth desde `~/.codex`. Inicia sesión con OAuth en el navegador (predeterminado) o con el flujo de código de dispositivo anterior; OpenClaw administra las credenciales resultantes en su propio almacén de autenticación de agentes.
    </Note>

    ### Comprobar y recuperar el enrutamiento OAuth de Codex

    Usa estos comandos para ver qué modelo, runtime y ruta de autenticación está usando tu agente
    predeterminado:

    ```bash
    openclaw models status
    openclaw models auth list --provider openai-codex
    openclaw config get agents.defaults.model --json
    openclaw config get agents.defaults.agentRuntime --json
    ```

    Para un agente específico, añade `--agent <id>`:

    ```bash
    openclaw models status --agent <id>
    openclaw models auth list --agent <id> --provider openai-codex
    ```

    Si una configuración antigua todavía tiene `openai-codex/gpt-*` o un pin de sesión de OpenAI PI
    obsoleto sin configuración explícita de runtime, repárala:

    ```bash
    openclaw doctor --fix
    openclaw config validate
    ```

    Si `models auth list --provider openai-codex` no muestra ningún perfil utilizable, inicia
    sesión de nuevo:

    ```bash
    openclaw models auth login --provider openai-codex
    openclaw models status --probe --probe-provider openai-codex
    ```

    `openai-codex` sigue siendo el id de proveedor de autenticación/perfil. `openai/*` es la
    ruta de modelo para los turnos de agente de OpenAI a través de Codex.

    ### Indicador de estado

    El `/status` del chat muestra qué runtime de modelo está activo para la sesión actual.
    El entorno app-server de Codex incluido aparece como `Runtime: OpenAI Codex` para
    los turnos de modelo de agente de OpenAI. Los pines de sesión PI obsoletos se reparan a Codex salvo que
    la configuración fije PI explícitamente.

    ### Advertencia de doctor

    Si quedan rutas `openai-codex/*` o pines de OpenAI PI obsoletos en la configuración o
    el estado de sesión, `openclaw doctor --fix` los reescribe a `openai/*` con el
    runtime de Codex salvo que PI esté configurado explícitamente.

    ### Límite de ventana de contexto

    OpenClaw trata los metadatos del modelo y el límite de contexto del runtime como valores separados.

    Para `openai/gpt-5.5` a través del catálogo OAuth de Codex:

    - `contextWindow` nativo: `1000000`
    - Límite predeterminado de `contextTokens` del runtime: `272000`

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
    Usa `contextWindow` para declarar metadatos nativos del modelo. Usa `contextTokens` para limitar el presupuesto de contexto del runtime.
    </Note>

    ### Recuperación del catálogo

    OpenClaw usa metadatos del catálogo upstream de Codex para `gpt-5.5` cuando están
    presentes. Si el descubrimiento en vivo de Codex omite la fila `gpt-5.5` aunque
    la cuenta esté autenticada, OpenClaw sintetiza esa fila de modelo OAuth para que
    las ejecuciones de cron, subagente y modelo predeterminado configurado no fallen con
    `Unknown model`.

  </Tab>
</Tabs>

## Autenticación del app-server nativo de Codex

El entorno app-server nativo de Codex usa referencias de modelo `openai/*` más configuración de
runtime omitida o `agentRuntime.id: "codex"`, pero su autenticación sigue
basándose en la cuenta. OpenClaw
selecciona la autenticación en este orden:

1. Un perfil de autenticación `openai-codex` explícito de OpenClaw vinculado al agente.
2. La cuenta existente del app-server, como un inicio de sesión local de ChatGPT en la CLI de Codex.
3. Solo para lanzamientos locales de app-server por stdio, `CODEX_API_KEY`, luego
   `OPENAI_API_KEY`, cuando el app-server informa que no hay cuenta y aún requiere
   autenticación de OpenAI.

Eso significa que un inicio de sesión local de suscripción de ChatGPT/Codex no se reemplaza solo
porque el proceso del gateway también tenga `OPENAI_API_KEY` para modelos directos de OpenAI
o embeddings. El fallback de clave de API de entorno es solo la ruta local por stdio sin cuenta; no
se envía a conexiones WebSocket de app-server. Cuando se selecciona un perfil de Codex
de estilo suscripción, OpenClaw también mantiene `CODEX_API_KEY` y `OPENAI_API_KEY`
fuera del proceso hijo app-server por stdio generado y envía las credenciales seleccionadas
mediante el RPC de inicio de sesión del app-server.

## Generación de imágenes

El Plugin `openai` incluido registra la generación de imágenes mediante la herramienta `image_generate`.
Admite generación de imágenes con clave de API de OpenAI y generación de imágenes con OAuth de Codex
mediante la misma referencia de modelo `openai/gpt-image-2`.

| Capacidad                | Clave de API de OpenAI                     | OAuth de Codex                          |
| ------------------------- | ---------------------------------- | ------------------------------------ |
| Referencia de modelo                 | `openai/gpt-image-2`               | `openai/gpt-image-2`                 |
| Autenticación                      | `OPENAI_API_KEY`                   | Inicio de sesión OAuth de OpenAI Codex           |
| Transporte                 | API Images de OpenAI                  | Backend Responses de Codex              |
| Imágenes máximas por solicitud    | 4                                  | 4                                    |
| Modo de edición                 | Activado (hasta 5 imágenes de referencia) | Activado (hasta 5 imágenes de referencia)   |
| Sobrescrituras de tamaño            | Admitidas, incluidos tamaños 2K/4K   | Admitidas, incluidos tamaños 2K/4K     |
| Relación de aspecto / resolución | No se reenvía a la API Images de OpenAI | Se asigna a un tamaño admitido cuando es seguro |

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
Consulta [Generación de imágenes](/es/tools/image-generation) para ver los parámetros compartidos de la herramienta, la selección de proveedor y el comportamiento de conmutación por error.
</Note>

`gpt-image-2` es el valor predeterminado tanto para la generación de texto a imagen de OpenAI como para la
edición de imágenes. `gpt-image-1.5`, `gpt-image-1` y `gpt-image-1-mini` siguen siendo utilizables como
sobrescrituras explícitas de modelo. Usa `openai/gpt-image-1.5` para salida
PNG/WebP con fondo transparente; la API actual de `gpt-image-2` rechaza
`background: "transparent"`.

Para una solicitud con fondo transparente, los agentes deben llamar a `image_generate` con
`model: "openai/gpt-image-1.5"`, `outputFormat: "png"` o `"webp"`, y
`background: "transparent"`; la opción de proveedor antigua `openai.background` todavía se
acepta. OpenClaw también protege las rutas públicas de OpenAI y
OAuth de OpenAI Codex reescribiendo las solicitudes transparentes predeterminadas de `openai/gpt-image-2`
a `gpt-image-1.5`; Azure y los endpoints personalizados compatibles con OpenAI conservan
sus nombres de despliegue/modelo configurados.

La misma opción está expuesta para ejecuciones de CLI sin interfaz:

```bash
openclaw infer image generate \
  --model openai/gpt-image-1.5 \
  --output-format png \
  --background transparent \
  --prompt "A simple red circle sticker on a transparent background" \
  --json
```

Usa las mismas flags `--output-format` y `--background` con
`openclaw infer image edit` al empezar desde un archivo de entrada.
`--openai-background` sigue disponible como alias específico de OpenAI.

Para instalaciones con OAuth de Codex, conserva la misma referencia `openai/gpt-image-2`. Cuando se
configura un perfil OAuth `openai-codex`, OpenClaw resuelve ese token de acceso OAuth
almacenado y envía las solicitudes de imagen a través del backend Responses de Codex. No
intenta primero `OPENAI_API_KEY` ni recurre silenciosamente a una clave de API para esa
solicitud. Configura `models.providers.openai` explícitamente con una clave de API,
URL base personalizada o endpoint de Azure cuando quieras la ruta directa de la API Images de OpenAI
en su lugar.
Si ese endpoint de imagen personalizado está en una dirección LAN/privada de confianza, configura también
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`; OpenClaw mantiene
bloqueados los endpoints de imagen privados/internos compatibles con OpenAI salvo que esta aceptación explícita esté
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

El Plugin `openai` incluido registra la generación de video mediante la herramienta `video_generate`.

| Capacidad       | Valor                                                                             |
| ---------------- | --------------------------------------------------------------------------------- |
| Modelo predeterminado    | `openai/sora-2`                                                                   |
| Modos            | Texto a video, imagen a video, edición de un solo video                                  |
| Entradas de referencia | 1 imagen o 1 video                                                                |
| Sobrescrituras de tamaño   | Admitidas                                                                         |
| Otras sobrescrituras  | `aspectRatio`, `resolution`, `audio`, `watermark` se ignoran con una advertencia de la herramienta |

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
Consulta [Generación de video](/es/tools/video-generation) para ver los parámetros compartidos de la herramienta, la selección de proveedor y el comportamiento de conmutación por error.
</Note>

## Contribución de prompt de GPT-5

OpenClaw añade una contribución de prompt compartida de GPT-5 para ejecuciones de la familia GPT-5 entre proveedores. Se aplica por id de modelo, por lo que `openai/gpt-5.5`, referencias heredadas antes de la reparación como `openai-codex/gpt-5.5`, `openrouter/openai/gpt-5.5`, `opencode/gpt-5.5` y otras referencias compatibles de GPT-5 reciben la misma superposición. Los modelos GPT-4.x antiguos no.

El entorno nativo incluido de Codex usa el mismo comportamiento de GPT-5 y la misma superposición de Heartbeat mediante instrucciones de desarrollador del app-server de Codex, por lo que las sesiones `openai/gpt-5.x` forzadas mediante `agentRuntime.id: "codex"` conservan la misma guía de seguimiento y Heartbeat proactivo aunque Codex sea responsable del resto del prompt del entorno.

La contribución de GPT-5 añade un contrato de comportamiento etiquetado para la persistencia de la persona, la seguridad de ejecución, la disciplina de herramientas, la forma de salida, las comprobaciones de finalización y la verificación. El comportamiento de respuesta específico del canal y de mensajes silenciosos permanece en el prompt de sistema compartido de OpenClaw y en la política de entrega saliente. La guía de GPT-5 siempre está habilitada para los modelos coincidentes. La capa de estilo de interacción amigable es independiente y configurable.

| Valor                  | Efecto                                      |
| ---------------------- | ------------------------------------------- |
| `"friendly"` (predeterminado) | Habilita la capa de estilo de interacción amigable |
| `"on"`                 | Alias de `"friendly"`                      |
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
Los valores no distinguen entre mayúsculas y minúsculas en tiempo de ejecución, por lo que `"Off"` y `"off"` deshabilitan la capa de estilo amigable.
</Tip>

<Note>
El `plugins.entries.openai.config.personality` heredado todavía se lee como reserva de compatibilidad cuando el ajuste compartido `agents.defaults.promptOverlays.gpt5.personality` no está definido.
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
    | Cuerpo adicional | `messages.tts.providers.openai.extraBody` / `extra_body` | (sin establecer) |

    Modelos disponibles: `gpt-4o-mini-tts`, `tts-1`, `tts-1-hd`. Voces disponibles: `alloy`, `ash`, `ballad`, `cedar`, `coral`, `echo`, `fable`, `juniper`, `marin`, `onyx`, `nova`, `sage`, `shimmer`, `verse`.

    `extraBody` se fusiona en el JSON de solicitud de `/audio/speech` después de los campos generados por OpenClaw, así que úsalo para endpoints compatibles con OpenAI que requieren claves adicionales como `lang`. Las claves de prototipo se ignoran.

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
    Establece `OPENAI_TTS_BASE_URL` para anular la URL base de TTS sin afectar al endpoint de la API de chat.
    </Note>

  </Accordion>

  <Accordion title="Voz a texto">
    El Plugin `openai` incluido registra voz a texto por lotes a través de
    la superficie de transcripción de comprensión multimedia de OpenClaw.

    - Modelo predeterminado: `gpt-4o-transcribe`
    - Endpoint: REST de OpenAI `/v1/audio/transcriptions`
    - Ruta de entrada: carga de archivo de audio multipart
    - Compatible con OpenClaw dondequiera que la transcripción de audio entrante use
      `tools.media.audio`, incluidos los segmentos de canales de voz de Discord y los archivos
      adjuntos de audio de canales

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

  <Accordion title="Transcripción en tiempo real">
    El Plugin `openai` incluido registra transcripción en tiempo real para el Plugin Voice Call.

    | Ajuste | Ruta de configuración | Predeterminado |
    |---------|------------|---------|
    | Modelo | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | Idioma | `...openai.language` | (sin establecer) |
    | Prompt | `...openai.prompt` | (sin establecer) |
    | Duración del silencio | `...openai.silenceDurationMs` | `800` |
    | Umbral de VAD | `...openai.vadThreshold` | `0.5` |
    | Clave de API | `...openai.apiKey` | Recurre a `OPENAI_API_KEY` |

    <Note>
    Usa una conexión WebSocket a `wss://api.openai.com/v1/realtime` con audio G.711 u-law (`g711_ulaw` / `audio/pcmu`). Este proveedor de streaming es para la ruta de transcripción en tiempo real de Voice Call; actualmente, la voz de Discord graba segmentos cortos y usa en su lugar la ruta de transcripción por lotes `tools.media.audio`.
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
    Admite Azure OpenAI mediante las claves de configuración `azureEndpoint` y `azureDeployment` para puentes en tiempo real de backend. Admite llamadas de herramientas bidireccionales. Usa el formato de audio G.711 u-law.
    </Note>

    <Note>
    Control UI Talk usa sesiones en tiempo real de OpenAI en el navegador con un secreto efímero de cliente
    emitido por Gateway y un intercambio directo de SDP WebRTC del navegador contra la
    API Realtime de OpenAI. La verificación en vivo de mantenedor está disponible con
    `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`;
    el tramo de OpenAI emite un secreto de cliente en Node, genera una oferta SDP del navegador
    con medios de micrófono falsos, la publica en OpenAI y aplica la respuesta SDP
    sin registrar secretos.
    </Note>

  </Accordion>
</AccordionGroup>

## Endpoints de Azure OpenAI

El proveedor `openai` incluido puede apuntar a un recurso de Azure OpenAI para la generación
de imágenes anulando la URL base. En la ruta de generación de imágenes, OpenClaw
detecta nombres de host de Azure en `models.providers.openai.baseUrl` y cambia
automáticamente a la forma de solicitud de Azure.

<Note>
La voz en tiempo real usa una ruta de configuración independiente
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)
y no se ve afectada por `models.providers.openai.baseUrl`. Consulta el acordeón **Voz en tiempo real**
en [Voz y habla](#voice-and-speech) para sus ajustes de Azure.
</Note>

Usa Azure OpenAI cuando:

- Ya tienes una suscripción, cuota o acuerdo empresarial de Azure OpenAI
- Necesitas residencia regional de datos o controles de cumplimiento que Azure proporciona
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

OpenClaw reconoce estos sufijos de host de Azure para la ruta de generación
de imágenes de Azure:

- `*.openai.azure.com`
- `*.services.ai.azure.com`
- `*.cognitiveservices.azure.com`

Para solicitudes de generación de imágenes en un host de Azure reconocido, OpenClaw:

- Envía el encabezado `api-key` en lugar de `Authorization: Bearer`
- Usa rutas con alcance de implementación (`/openai/deployments/{deployment}/...`)
- Anexa `?api-version=...` a cada solicitud
- Usa un tiempo de espera de solicitud predeterminado de 600 s para llamadas de generación de imágenes de Azure.
  Los valores `timeoutMs` por llamada todavía anulan este valor predeterminado.

Otras URL base (OpenAI público, proxies compatibles con OpenAI) mantienen la forma estándar
de solicitud de imagen de OpenAI.

<Note>
El enrutamiento de Azure para la ruta de generación de imágenes del proveedor `openai` requiere
OpenClaw 2026.4.22 o posterior. Las versiones anteriores tratan cualquier
`openai.baseUrl` personalizado como el endpoint público de OpenAI y fallarán contra las implementaciones
de imágenes de Azure.
</Note>

### Versión de API

Establece `AZURE_OPENAI_API_VERSION` para fijar una versión preliminar o GA específica de Azure
para la ruta de generación de imágenes de Azure:

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

El valor predeterminado es `2024-12-01-preview` cuando la variable no está definida.

### Los nombres de modelo son nombres de implementación

Azure OpenAI vincula modelos a implementaciones. Para solicitudes de generación de imágenes de Azure
enrutadas a través del proveedor `openai` incluido, el campo `model` en OpenClaw
debe ser el **nombre de implementación de Azure** que configuraste en el portal de Azure, no
el id de modelo público de OpenAI.

Si creas una implementación llamada `gpt-image-2-prod` que sirve `gpt-image-2`:

```
/tool image_generate model=openai/gpt-image-2-prod prompt="A clean poster" size=1024x1024 count=1
```

La misma regla de nombre de implementación se aplica a las llamadas de generación de imágenes enrutadas a través
del proveedor `openai` incluido.

### Disponibilidad regional

La generación de imágenes de Azure actualmente está disponible solo en un subconjunto de regiones
(por ejemplo `eastus2`, `swedencentral`, `polandcentral`, `westus3`,
`uaenorth`). Consulta la lista de regiones actual de Microsoft antes de crear una
implementación y confirma que el modelo específico se ofrece en tu región.

### Diferencias de parámetros

Azure OpenAI y OpenAI público no siempre aceptan los mismos parámetros de imagen.
Azure puede rechazar opciones que OpenAI público permite (por ejemplo, ciertos
valores de `background` en `gpt-image-2`) o exponerlas solo en versiones de modelo
específicas. Estas diferencias provienen de Azure y del modelo subyacente, no de
OpenClaw. Si una solicitud de Azure falla con un error de validación, comprueba el
conjunto de parámetros admitido por tu implementación y versión de API específicas en el
portal de Azure.

<Note>
Azure OpenAI usa transporte nativo y comportamiento de compatibilidad, pero no recibe
los encabezados de atribución ocultos de OpenClaw; consulta el acordeón **Rutas nativas frente a compatibles con OpenAI**
en [Configuración avanzada](#advanced-configuration).

Para tráfico de chat o Responses en Azure (más allá de la generación de imágenes), usa el
flujo de incorporación o una configuración de proveedor de Azure dedicada; `openai.baseUrl` por sí solo
no adopta la forma de API/autenticación de Azure. Existe un proveedor
`azure-openai-responses/*` independiente; consulta el acordeón de Server-side compaction a continuación.
</Note>

## Configuración avanzada

<AccordionGroup>
  <Accordion title="Transporte (WebSocket frente a SSE)">
    OpenClaw usa WebSocket primero con reserva SSE (`"auto"`) para `openai/*`.

    En modo `"auto"`, OpenClaw:
    - Reintenta un fallo temprano de WebSocket antes de recurrir a SSE
    - Tras un fallo, marca WebSocket como degradado durante ~60 segundos y usa SSE durante el enfriamiento
    - Adjunta encabezados estables de identidad de sesión y turno para reintentos y reconexiones
    - Normaliza los contadores de uso (`input_tokens` / `prompt_tokens`) entre variantes de transporte

    | Valor | Comportamiento |
    |-------|----------|
    | `"auto"` (predeterminado) | WebSocket primero, reserva SSE |
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
    OpenClaw habilita la preparación de WebSocket de forma predeterminada para `openai/*` para reducir la latencia del primer turno.

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
    OpenClaw expone un interruptor compartido de modo rápido para `openai/*`:

    - **Chat/IU:** `/fast status|on|off`
    - **Configuración:** `agents.defaults.models["<provider>/<model>"].params.fastMode`

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
    Las anulaciones de sesión prevalecen sobre la configuración. Borrar la anulación de sesión en la IU de Sesiones devuelve la sesión al valor predeterminado configurado.
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
    `serviceTier` solo se reenvía a endpoints nativos de OpenAI (`api.openai.com`) y endpoints nativos de Codex (`chatgpt.com/backend-api`). Si enrutas cualquiera de los proveedores a través de un proxy, OpenClaw deja `service_tier` intacto.
    </Warning>

  </Accordion>

  <Accordion title="Compaction del lado del servidor (Responses API)">
    Para modelos directos de OpenAI Responses (`openai/*` en `api.openai.com`), el envoltorio de flujo Pi-harness del Plugin de OpenAI habilita automáticamente la Compaction del lado del servidor:

    - Fuerza `store: true` (a menos que la compatibilidad del modelo establezca `supportsStore: false`)
    - Inyecta `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - Valor predeterminado de `compact_threshold`: 70 % de `contextWindow` (o `80000` cuando no está disponible)

    Esto se aplica a la ruta Pi harness integrada y a los hooks de proveedor de OpenAI usados por ejecuciones incrustadas. El harness nativo del servidor de aplicaciones Codex gestiona su propio contexto mediante Codex y se configura por separado con `agents.defaults.agentRuntime.id`.

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

  <Accordion title="Modo GPT agentivo estricto">
    Para ejecuciones de la familia GPT-5 en `openai/*`, OpenClaw puede usar un contrato de ejecución incrustado más estricto:

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
    - Ya no trata un turno de solo plan como progreso correcto cuando hay una acción de herramienta disponible
    - Reintenta el turno con una orientación de actuar ahora
    - Habilita automáticamente `update_plan` para trabajos sustanciales
    - Muestra un estado bloqueado explícito si el modelo sigue planificando sin actuar

    <Note>
    Limitado únicamente a ejecuciones de la familia GPT-5 de OpenAI y Codex. Otros proveedores y familias de modelos anteriores conservan el comportamiento predeterminado.
    </Note>

  </Accordion>

  <Accordion title="Rutas nativas frente a compatibles con OpenAI">
    OpenClaw trata los endpoints directos de OpenAI, Codex y Azure OpenAI de forma diferente a los proxies `/v1` genéricos compatibles con OpenAI:

    **Rutas nativas** (`openai/*`, Azure OpenAI):
    - Mantienen `reasoning: { effort: "none" }` solo para modelos que admiten el esfuerzo `none` de OpenAI
    - Omiten el razonamiento deshabilitado para modelos o proxies que rechazan `reasoning.effort: "none"`
    - Usan de forma predeterminada el modo estricto para los esquemas de herramientas
    - Adjuntan encabezados de atribución ocultos solo en hosts nativos verificados
    - Conservan el modelado de solicitudes exclusivo de OpenAI (`service_tier`, `store`, compatibilidad de razonamiento, pistas de caché de prompts)

    **Rutas proxy/compatibles:**
    - Usan un comportamiento de compatibilidad más flexible
    - Eliminan `store` de Completions en cargas `openai-completions` no nativas
    - Aceptan JSON de paso directo avanzado `params.extra_body`/`params.extraBody` para proxies de Completions compatibles con OpenAI
    - Aceptan `params.chat_template_kwargs` para proxies de Completions compatibles con OpenAI, como vLLM
    - No fuerzan esquemas de herramientas estrictos ni encabezados exclusivos de rutas nativas

    Azure OpenAI usa transporte nativo y comportamiento de compatibilidad, pero no recibe los encabezados de atribución ocultos.

  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Selección de modelos" href="/es/concepts/model-providers" icon="layers">
    Elección de proveedores, referencias de modelo y comportamiento de conmutación por error.
  </Card>
  <Card title="Generación de imágenes" href="/es/tools/image-generation" icon="image">
    Parámetros compartidos de la herramienta de imagen y selección de proveedores.
  </Card>
  <Card title="Generación de video" href="/es/tools/video-generation" icon="video">
    Parámetros compartidos de la herramienta de video y selección de proveedores.
  </Card>
  <Card title="OAuth y autenticación" href="/es/gateway/authentication" icon="key">
    Detalles de autenticación y reglas de reutilización de credenciales.
  </Card>
</CardGroup>
