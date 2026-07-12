---
read_when:
    - Configuración de la política de `tools.*`, las listas de permitidos o las funciones experimentales
    - Registrar proveedores personalizados o sobrescribir las URL base
    - Configuración de endpoints autoalojados compatibles con OpenAI
sidebarTitle: Tools and custom providers
summary: Configuración de herramientas (políticas, opciones experimentales, herramientas respaldadas por proveedores) y configuración personalizada del proveedor y la URL base
title: 'Configuración: herramientas y proveedores personalizados'
x-i18n:
    generated_at: "2026-07-11T23:05:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 91f392efc7ca08ddd18875625ed3c95d21c5c12f70396594f8dc8e88a20293fc
    source_path: gateway/config-tools.md
    workflow: 16
---

Claves de configuración `tools.*` y configuración personalizada del proveedor o de la URL base. Para agentes, canales y otras claves de configuración de nivel superior, consulta la [referencia de configuración](/es/gateway/configuration-reference).

## Herramientas

### Perfiles de herramientas

`tools.profile` establece una lista de permitidos base antes de `tools.allow`/`tools.deny`:

<Note>
La incorporación local establece de forma predeterminada `tools.profile: "coding"` en las configuraciones locales nuevas cuando no está definido (se conservan los perfiles explícitos existentes).
</Note>

| Perfil      | Incluye                                                                                                                                                                                                                      |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimal`   | Solo `session_status`                                                                                                                                                                                                        |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `get_goal`, `create_goal`, `update_goal`, `update_plan`, `skill_workshop`, `image`, `image_generate`, `music_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                                                                                                                    |
| `full`      | Sin restricciones (igual que cuando no está definido)                                                                                                                                                                        |

`coding` y `messaging` también permiten implícitamente `bundle-mcp` (servidores MCP configurados).

### Grupos de herramientas

| Grupo              | Herramientas                                                                                                                                           |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `group:runtime`    | `exec`, `process`, `code_execution` (`bash` se acepta como alias de `exec`)                                                                            |
| `group:fs`         | `read`, `write`, `edit`, `apply_patch`                                                                                                                 |
| `group:sessions`   | `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `sessions_yield`, `subagents`, `session_status`, `spawn_task`, `dismiss_task` |
| `group:memory`     | `memory_search`, `memory_get`                                                                                                                          |
| `group:web`        | `web_search`, `x_search`, `web_fetch`                                                                                                                  |
| `group:ui`         | `browser`, `canvas`                                                                                                                                    |
| `group:automation` | `heartbeat_respond`, `cron`, `gateway`                                                                                                                 |
| `group:messaging`  | `message`                                                                                                                                              |
| `group:nodes`      | `nodes`, `computer`                                                                                                                                    |
| `group:agents`     | `agents_list`, `get_goal`, `create_goal`, `update_goal`, `update_plan`, `skill_workshop`                                                               |
| `group:media`      | `image`, `image_generate`, `music_generate`, `video_generate`, `tts`                                                                                   |
| `group:openclaw`   | Todas las herramientas integradas anteriores, excepto `read`/`write`/`edit`/`apply_patch`/`exec`/`process`/`canvas` (excluye las herramientas de plugins) |
| `group:plugins`    | Herramientas pertenecientes a los plugins cargados, incluidos los servidores MCP configurados expuestos mediante `bundle-mcp`                          |

`spawn_task` permite que un agente de programación proponga trabajo de seguimiento confirmado sin iniciarlo. La interfaz de control muestra el título y el resumen como una ficha procesable; una TUI respaldada por el Gateway muestra una indicación interactiva equivalente. Al aceptar cualquiera de las dos, se crea una nueva sesión de árbol de trabajo administrado y se envía allí la indicación completa mientras continúa el turno actual. `dismiss_task` retira una sugerencia aún pendiente mediante el `task_id` efímero devuelto por `spawn_task`.

Las herramientas solo se ofrecen cuando la superficie del operador que inicia la acción puede recibir y procesar eventos de sugerencia de tareas del Gateway. Las sesiones de canal y las sesiones de TUI locales o integradas no los reciben; los transportes de canal necesitan una acción de tarea tipada y portable antes de poder exponer este flujo de forma segura. Las sugerencias son locales al proceso y desaparecen cuando se reinicia el Gateway. Ambas herramientas permanecen en el perfil `coding` y en `group:sessions`, por lo que las políticas habituales `tools.allow` y `tools.deny` las configuran automáticamente cuando la superficie las admite.

### Herramientas de MCP y plugins dentro de la política de herramientas del entorno aislado

Los servidores MCP configurados se exponen como herramientas pertenecientes al plugin con el identificador `bundle-mcp`. Los perfiles normales de herramientas pueden permitirlas, pero `tools.sandbox.tools` constituye una restricción adicional para las sesiones aisladas. Si el modo del entorno aislado es `"all"` o `"non-main"`, incluye una de estas entradas en la lista de herramientas permitidas del entorno aislado cuando las herramientas de MCP o plugins deban ser visibles:

- `bundle-mcp` para los servidores MCP administrados por OpenClaw desde `mcp.servers`
- el identificador del plugin para un plugin nativo específico
- `group:plugins` para todas las herramientas pertenecientes a los plugins cargados
- nombres exactos de herramientas de servidores MCP o patrones globales de servidor, como `outlook__send_mail` u `outlook__*`, cuando solo quieras un servidor

Los patrones globales de servidor usan el prefijo de servidor MCP seguro para el proveedor, que no es necesariamente la clave sin procesar de `mcp.servers`. Los caracteres que no sean `[A-Za-z0-9_-]` se convierten en `-`, los nombres que no comienzan con una letra reciben el prefijo `mcp-` y los prefijos largos o duplicados pueden truncarse o recibir un sufijo; por ejemplo, `mcp.servers["Outlook Graph"]` usa un patrón global como `outlook-graph__*`.

```json5
{
  agents: { defaults: { sandbox: { mode: "all" } } },
  mcp: {
    servers: {
      outlook: { command: "node", args: ["./outlook-mcp.js"] },
    },
  },
  tools: {
    sandbox: {
      tools: {
        alsoAllow: ["web_search", "web_fetch", "memory_search", "memory_get", "bundle-mcp"],
      },
    },
  },
}
```

Sin esa entrada en la capa del entorno aislado, el servidor MCP puede seguir cargándose correctamente mientras sus herramientas se filtran antes de la solicitud al proveedor. Usa `openclaw doctor` para detectar esta configuración en los servidores administrados por OpenClaw en `mcp.servers`. Los servidores MCP cargados desde manifiestos de plugins incluidos o desde `.mcp.json` de Claude usan la misma restricción del entorno aislado, pero este diagnóstico aún no enumera esas fuentes; usa las mismas entradas de la lista de permitidos si sus herramientas desaparecen en turnos aislados.

### `tools.codeMode`

`tools.codeMode` habilita la superficie genérica del modo de código de OpenClaw. Cuando se habilita
para una ejecución con herramientas, las herramientas normales de OpenClaw pasan a estar detrás del puente de catálogo `tools.*`
dentro del entorno aislado, y las herramientas MCP quedan disponibles mediante el espacio de nombres `MCP`
generado. Normalmente, el modelo ve `exec` y `wait`; las herramientas como `computer`
cuyos resultados estructurados no pueden atravesar el puente exclusivo de JSON permanecen directas.

```json5
{
  tools: {
    codeMode: {
      enabled: true,
    },
  },
}
```

También se acepta la forma abreviada:

```json5
{
  tools: { codeMode: true },
}
```

Las declaraciones de MCP se exponen mediante la superficie virtual de archivos de API de solo lectura en
el modo de código. El código invitado puede llamar a `API.list("mcp")` y
`API.read("mcp/<server>.d.ts")` para inspeccionar firmas al estilo de TypeScript antes de
llamar a `MCP.<server>.<tool>()`. Consulta [Modo de código](/es/reference/code-mode) para conocer el
contrato de ejecución, los límites y los pasos de depuración.

### `tools.allow` / `tools.deny`

Política global de permisos y denegaciones de herramientas (la denegación prevalece). No distingue entre mayúsculas y minúsculas y admite comodines `*`. Se aplica incluso cuando el entorno aislado de Docker está desactivado.

```json5
{
  tools: { deny: ["browser", "canvas"] },
}
```

`write` y `apply_patch` son identificadores de herramientas distintos. `allow: ["write"]` también habilita `apply_patch` para los modelos compatibles, pero `deny: ["write"]` no deniega `apply_patch`. Para bloquear todas las modificaciones de archivos, deniegue `group:fs` o enumere explícitamente cada herramienta que pueda realizar modificaciones:

```json5
{
  tools: { deny: ["write", "edit", "apply_patch"] },
}
```

<Note>
`allow` y `alsoAllow` no pueden configurarse simultáneamente en el mismo ámbito (`tools`, `tools.byProvider.<id>`, `agents.list[].tools`); la validación de la configuración lo rechaza. Incorpore las entradas de `alsoAllow` en `allow` o elimine `allow` y use `profile` + `alsoAllow` en su lugar.
</Note>

### `tools.byProvider`

Restringe aún más las herramientas para proveedores o modelos específicos. Orden: perfil base → perfil del proveedor → permisos/denegaciones.

```json5
{
  tools: {
    profile: "coding",
    byProvider: {
      "google-antigravity": { profile: "minimal" },
      "openai/gpt-5.4": { allow: ["group:fs", "sessions_list"] },
    },
  },
}
```

### `tools.toolsBySender`

Restringe las herramientas para una identidad solicitante específica. Se trata de una defensa en profundidad que complementa el control de acceso del canal; los valores del remitente deben proceder del adaptador del canal, no del texto del mensaje.

```json5
{
  tools: {
    toolsBySender: {
      "channel:discord:1234567890123": { alsoAllow: ["group:fs"] },
      "id:guest-user-id": { deny: ["group:runtime", "group:fs"] },
      "*": { deny: ["exec", "process", "write", "edit", "apply_patch"] },
    },
  },
}
```

Las claves usan prefijos explícitos: `channel:<channelId>:<senderId>`, `id:<senderId>`, `e164:<phone>`, `username:<handle>`, `name:<displayName>` o `"*"`. Los identificadores de canal son identificadores canónicos de OpenClaw; los alias como `teams` se normalizan a `msteams`. Las claves heredadas sin prefijo solo se aceptan como `id:`. El orden de coincidencia es canal+identificador, identificador, e164, nombre de usuario, nombre y, por último, comodín.

La configuración por agente `agents.list[].tools.toolsBySender` sustituye la coincidencia global del remitente cuando coincide, incluso con una política `{}` vacía.

### `tools.elevated`

Controla el acceso de ejecución con privilegios elevados fuera del entorno aislado:

```json5
{
  tools: {
    elevated: {
      enabled: true,
      allowFrom: {
        whatsapp: ["+15555550123"],
        discord: ["1234567890123", "987654321098765432"],
      },
    },
  },
}
```

- La sustitución por agente (`agents.list[].tools.elevated`) solo puede aplicar restricciones adicionales.
- `/elevated on|off|ask|full` almacena el estado por sesión; las directivas insertadas en el mensaje se aplican a un único mensaje.
- La herramienta `exec` con privilegios elevados omite el aislamiento y usa la ruta de escape configurada (`gateway` de forma predeterminada, o `node` cuando el destino de ejecución es `node`).

### `tools.exec`

```json5
{
  tools: {
    exec: {
      backgroundMs: 10000,
      timeoutSec: 1800,
      cleanupMs: 1800000,
      approvalRunningNoticeMs: 10000,
      notifyOnExit: true,
      notifyOnExitEmptySuccess: false,
      commandHighlighting: false,
      applyPatch: {
        enabled: true,
        allowModels: ["gpt-5.6-sol"],
      },
    },
  },
}
```

Los valores mostrados son los predeterminados, excepto `applyPatch.allowModels` (vacío o sin configurar de forma predeterminada, lo que significa que cualquier modelo compatible puede usar `apply_patch`). `approvalRunningNoticeMs` emite un aviso de ejecución cuando una ejecución respaldada por aprobación se prolonga; `0` lo desactiva.

### `tools.loopDetection`

Las comprobaciones de seguridad para bucles de herramientas están **desactivadas de forma predeterminada**. Establezca `enabled: true` para activar la detección. La configuración puede definirse globalmente en `tools.loopDetection` y sustituirse por agente en `agents.list[].tools.loopDetection`.

```json5
{
  tools: {
    loopDetection: {
      enabled: true,
      historySize: 30,
      warningThreshold: 10,
      unknownToolThreshold: 10,
      criticalThreshold: 20,
      globalCircuitBreakerThreshold: 30,
      detectors: {
        genericRepeat: true,
        knownPollNoProgress: true,
        pingPong: true,
      },
      postCompactionGuard: {
        windowSize: 3,
      },
    },
  },
}
```

<ParamField path="historySize" type="number">
  Historial máximo de llamadas a herramientas conservado para el análisis de bucles.
</ParamField>
<ParamField path="warningThreshold" type="number">
  Umbral del patrón repetitivo sin progreso para las advertencias.
</ParamField>
<ParamField path="unknownToolThreshold" type="number">
  Bloquea las llamadas repetidas al mismo nombre de herramienta no disponible o desconocida después de esta cantidad de intentos fallidos.
</ParamField>
<ParamField path="criticalThreshold" type="number">
  Umbral de repetición más alto para bloquear bucles críticos.
</ParamField>
<ParamField path="globalCircuitBreakerThreshold" type="number">
  Umbral de detención forzosa para cualquier ejecución sin progreso.
</ParamField>
<ParamField path="detectors.genericRepeat" type="boolean">
  Advierte sobre llamadas repetidas con la misma herramienta y los mismos argumentos.
</ParamField>
<ParamField path="detectors.knownPollNoProgress" type="boolean">
  Advierte o bloquea herramientas de sondeo conocidas (`process.poll`, `command_status`, etc.).
</ParamField>
<ParamField path="detectors.pingPong" type="boolean">
  Advierte o bloquea patrones alternantes de pares sin progreso.
</ParamField>
<ParamField path="postCompactionGuard.windowSize" type="number">
  Cantidad de intentos durante los cuales la protección permanece activa después de la compactación automática; aborta si el agente repite la misma combinación de herramienta, argumentos y resultado dentro de esa ventana.
</ParamField>

<Warning>
Si `warningThreshold >= criticalThreshold` o `criticalThreshold >= globalCircuitBreakerThreshold`, la validación falla.
</Warning>

### `tools.web`

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        apiKey: "brave_api_key", // or BRAVE_API_KEY env (Brave provider)
        maxResults: 5,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
      },
      fetch: {
        enabled: true,
        provider: "firecrawl", // optional; omit for auto-detect
        maxChars: 20000,
        maxCharsCap: 20000,
        maxResponseBytes: 750000,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
        maxRedirects: 3,
        readability: true,
        userAgent: "custom-ua",
      },
    },
  },
}
```

Los valores mostrados son los predeterminados, excepto `provider` y `userAgent`. `maxResponseBytes` se limita al intervalo 32000–10000000; `maxChars` se limita a `maxCharsCap` (aumente `maxCharsCap` para permitir respuestas más grandes).

### `tools.media`

Configura la comprensión de medios entrantes (imagen, audio y vídeo):

```json5
{
  tools: {
    media: {
      concurrency: 2,
      asyncCompletion: {
        directSend: false, // deprecated: completions stay agent-mediated
      },
      audio: {
        enabled: true,
        maxBytes: 20971520,
        scope: {
          default: "deny",
          rules: [{ action: "allow", match: { chatType: "direct" } }],
        },
        models: [
          { provider: "openai", model: "gpt-4o-mini-transcribe" },
          { type: "cli", command: "whisper", args: ["--model", "base", "{{MediaPath}}"] },
        ],
      },
      image: {
        enabled: true,
        timeoutSeconds: 180,
        models: [{ provider: "ollama", model: "gemma4:26b", timeoutSeconds: 300 }],
      },
      video: {
        enabled: true,
        maxBytes: 52428800,
        models: [{ provider: "google", model: "gemini-3-flash-preview" }],
      },
    },
  },
}
```

`concurrency` (valor predeterminado: `2`), `audio.maxBytes` (valor predeterminado: 20 MB) y `video.maxBytes` (valor predeterminado: 50 MB) se muestran con sus valores predeterminados; el valor predeterminado de `image.maxBytes` es 10 MB. Valores predeterminados del tiempo de espera por solicitud para cada capacidad: `60` s para imagen y audio, y `120` s para vídeo.

<AccordionGroup>
  <Accordion title="Campos de las entradas de modelos multimedia">
    **Entrada de proveedor** (`type: "provider"` u omitido):

    - `provider`: identificador del proveedor de API (`openai`, `anthropic`, `google`/`gemini`, `groq`, etc.)
    - `model`: sustitución del identificador del modelo
    - `profile` / `preferredProfile`: selección del perfil de `auth-profiles.json`

    **Entrada de CLI** (`type: "cli"`):

    - `command`: ejecutable que se debe ejecutar
    - `args`: argumentos con plantilla (admite `{{MediaPath}}`, `{{Prompt}}`, `{{MaxChars}}`, etc.; `openclaw doctor --fix` migra los marcadores de posición obsoletos `{input}` a `{{MediaPath}}`)

    **Campos comunes:**

    - `capabilities`: lista opcional (`image`, `audio`, `video`). Cada Plugin de proveedor declara su propio conjunto predeterminado de capacidades; por ejemplo, el proveedor `openai` incluido usa de forma predeterminada imagen y audio, `anthropic`/`minimax` usa imagen, `google` usa imagen, audio y vídeo, y `groq` usa audio.
    - `prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`: sustituciones específicas de cada entrada.
    - `tools.media.image.timeoutSeconds` y las entradas `timeoutSeconds` correspondientes del modelo de imagen también se aplican cuando el agente llama a la herramienta explícita `image`. Para la comprensión de imágenes, este tiempo de espera se aplica a la solicitud en sí y no se reduce por el trabajo de preparación anterior.
    - En caso de error, se recurre a la siguiente entrada.

    La autenticación del proveedor sigue el orden estándar: `auth-profiles.json` → variables de entorno → `models.providers.*.apiKey`.

    **Campos de finalización asíncrona:**

    - `asyncCompletion.directSend`: indicador de compatibilidad obsoleto. Las tareas multimedia asíncronas completadas siguen mediadas por la sesión solicitante para que el agente reciba el resultado, decida cómo comunicárselo al usuario y utilice la herramienta de mensajes cuando la entrega al origen lo requiera.

  </Accordion>
</AccordionGroup>

### `tools.agentToAgent`

```json5
{
  tools: {
    agentToAgent: {
      enabled: false,
      allow: ["home", "work"],
    },
  },
}
```

### `tools.sessions`

Controla qué sesiones pueden ser el destino de las herramientas de sesión (`sessions_list`, `sessions_history`, `sessions_send`).

Valor predeterminado: `tree` (la sesión actual y las sesiones que esta genera, como los subagentes).

```json5
{
  tools: {
    sessions: {
      // "self" | "tree" | "agent" | "all"
      visibility: "tree",
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Ámbitos de visibilidad">
    - `self`: solo la clave de la sesión actual.
    - `tree`: la sesión actual y las sesiones generadas por ella (subagentes).
    - `agent`: cualquier sesión que pertenezca al identificador del agente actual (puede incluir otros usuarios si ejecuta sesiones por remitente con el mismo identificador de agente).
    - `all`: cualquier sesión. Dirigirse a otros agentes sigue requiriendo `tools.agentToAgent`.
    - Restricción del entorno aislado: cuando la sesión actual está aislada y `agents.defaults.sandbox.sessionToolsVisibility="spawned"` (el valor predeterminado), la visibilidad se fuerza a `tree`, incluso si `tools.sessions.visibility="all"`.
    - Cuando no es `all`, `sessions_list` incluye un campo compacto `visibility`
      que describe el modo efectivo y una advertencia de que algunas sesiones
      fuera del ámbito actual pueden omitirse.

  </Accordion>
</AccordionGroup>

### `tools.sessions_spawn`

Controla la compatibilidad con archivos adjuntos insertados para `sessions_spawn`.

```json5
{
  tools: {
    sessions_spawn: {
      attachments: {
        enabled: false, // opt-in: set true to allow inline file attachments
        maxTotalBytes: 5242880, // 5 MB total across all files
        maxFiles: 50,
        maxFileBytes: 1048576, // 1 MB per file
        retainOnSessionKeep: false, // keep attachments when cleanup="keep"
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Notas sobre los archivos adjuntos">
    - Los archivos adjuntos requieren `enabled: true`.
    - Los archivos adjuntos de los subagentes se materializan en el espacio de trabajo secundario en `.openclaw/attachments/<uuid>/` con un archivo `.manifest.json`.
    - Los archivos adjuntos de ACP solo pueden ser imágenes y se reenvían insertados al entorno de ejecución de ACP después de superar los mismos límites de cantidad de archivos, bytes por archivo y bytes totales.
    - El contenido de los archivos adjuntos se censura automáticamente al conservar la transcripción.
    - Las entradas Base64 se validan mediante comprobaciones estrictas del alfabeto y del relleno, además de una protección de tamaño previa a la decodificación.
    - Los permisos de los archivos adjuntos de los subagentes son `0700` para los directorios y `0600` para los archivos.
    - La limpieza de los subagentes sigue la política `cleanup`: `delete` siempre elimina los archivos adjuntos; `keep` solo los conserva cuando `retainOnSessionKeep: true`.

  </Accordion>
</AccordionGroup>

<a id="toolsexperimental"></a>

### `tools.experimental`

Indicadores experimentales de herramientas integradas. Están desactivados de forma predeterminada, salvo que se aplique una regla de activación automática de GPT-5 con contrato `strict-agentic`.

```json5
{
  tools: {
    experimental: {
      planTool: true, // enable experimental update_plan
    },
  },
}
```

- `planTool`: activa la herramienta estructurada `update_plan` para realizar el seguimiento de trabajos no triviales de varios pasos.
- Valor predeterminado: `false`, salvo que `agents.defaults.embeddedAgent.executionContract` (o una sustitución por agente) esté establecido en `"strict-agentic"` para una ejecución del proveedor `openai` con un identificador de modelo de la familia GPT-5 (esto también abarca las ejecuciones de OpenAI Codex CLI, ya que el enrutamiento de autenticación y modelos de Codex se encuentra bajo el proveedor `openai`). Establézcalo en `true` para forzar la activación de la herramienta fuera de ese ámbito, o en `false` para mantenerla desactivada incluso en ejecuciones de GPT-5 con `strict-agentic`.
- Cuando está activada, el mensaje del sistema también añade instrucciones de uso para que el modelo solo la utilice en trabajos sustanciales y mantenga como máximo un paso con el estado `in_progress`.

### `agents.defaults.subagents`

```json5
{
  agents: {
    defaults: {
      subagents: {
        allowAgents: ["research"],
        model: "minimax/MiniMax-M2.7",
        maxConcurrent: 8,
        runTimeoutSeconds: 900,
        announceTimeoutMs: 120000,
        archiveAfterMinutes: 60,
      },
    },
  },
}
```

- `model`: modelo predeterminado para los subagentes generados. Si se omite, los subagentes heredan el modelo del solicitante.
- `allowAgents`: lista predeterminada de identificadores de agentes de destino configurados permitidos para `sessions_spawn` cuando el agente solicitante no establece su propia opción `subagents.allowAgents` (`["*"]` = cualquier destino configurado; valor predeterminado: solo el mismo agente). `sessions_spawn` rechaza las entradas obsoletas cuya configuración de agente se haya eliminado y `agents_list` las omite; ejecute `openclaw doctor --fix` para limpiarlas.
- `maxConcurrent`: cantidad máxima de ejecuciones simultáneas de subagentes. Valor predeterminado: `8`.
- `runTimeoutSeconds`: tiempo de espera en segundos para `sessions_spawn` cuando el solicitante no proporciona su propia sustitución. Valor predeterminado: `0` (sin tiempo de espera); el valor `900` mostrado anteriormente es un valor opcional habitual, no el valor predeterminado integrado.
- `announceTimeoutMs`: tiempo de espera por llamada, en milisegundos, para los intentos de entrega de anuncios `agent` del Gateway. Valor predeterminado: `120000`. Los reintentos transitorios pueden hacer que la espera total del anuncio supere un tiempo de espera configurado.
- `archiveAfterMinutes`: minutos que deben transcurrir desde que se completa una sesión de subagente hasta que se archiva automáticamente. Valor predeterminado: `60`; `0` desactiva el archivado automático.
- Política de herramientas por subagente: `tools.subagents.tools.allow` / `tools.subagents.tools.deny`.

---

## Proveedores personalizados y URL base

Los Plugins de proveedores publican sus propias filas del catálogo de modelos. Añada proveedores personalizados mediante `models.providers` en la configuración o `~/.openclaw/agents/<agentId>/agent/models.json`.

Configurar un `baseUrl` de un proveedor personalizado o local también constituye la decisión específica de confianza de red para las solicitudes HTTP del modelo: OpenClaw permite ese origen `scheme://host:port` exacto a través de la ruta de obtención protegida, sin añadir una opción de configuración independiente ni confiar en otros orígenes privados.

```json5
{
  models: {
    mode: "merge", // merge (default) | replace
    providers: {
      "custom-proxy": {
        baseUrl: "http://localhost:4000/v1",
        apiKey: "LITELLM_KEY",
        api: "openai-completions", // openai-completions | openai-responses | anthropic-messages | google-generative-ai | etc.
        models: [
          {
            id: "llama-3.1-8b",
            name: "Llama 3.1 8B",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 128000,
            contextTokens: 96000,
            maxTokens: 32000,
          },
        ],
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Autenticación y precedencia de combinación">
    - Use `authHeader: true` + `headers` para necesidades de autenticación personalizadas.
    - Sobrescriba la raíz de configuración del agente con `OPENCLAW_AGENT_DIR`.
    - Precedencia de combinación para identificadores de proveedor coincidentes:
      - Los valores `baseUrl` no vacíos de `models.json` del agente tienen prioridad.
      - Los valores `apiKey` no vacíos del agente tienen prioridad solo cuando ese proveedor no está administrado mediante SecretRef en el contexto actual de configuración/perfil de autenticación.
      - Los valores `apiKey` de proveedores administrados mediante SecretRef se actualizan desde marcadores de origen (`ENV_VAR_NAME` para referencias de entorno, `secretref-managed` para referencias de archivo/ejecución), en lugar de conservar los secretos resueltos.
      - Los valores de cabecera de proveedores administrados mediante SecretRef se actualizan desde marcadores de origen (`secretref-env:ENV_VAR_NAME` para referencias de entorno, `secretref-managed` para referencias de archivo/ejecución).
      - Los valores `apiKey`/`baseUrl` del agente vacíos o ausentes recurren a `models.providers` en la configuración.
      - Para `contextWindow`/`maxTokens` de modelos coincidentes: el valor explícito de configuración tiene prioridad cuando está presente y es válido (un número finito positivo); de lo contrario, se usa el valor implícito/generado del catálogo.
      - `contextTokens` de modelos coincidentes sigue la misma regla de prioridad del valor explícito y, en su ausencia, del implícito; úselo para limitar el contexto efectivo sin cambiar los metadatos nativos del modelo.
      - Los catálogos de plugins de proveedores se almacenan como fragmentos de catálogo generados y pertenecientes al plugin dentro del estado de plugins del agente.
      - Use `models.mode: "replace"` cuando quiera que la configuración reescriba por completo `models.json` y omita la combinación de fragmentos de catálogo pertenecientes a plugins.
      - La persistencia de marcadores toma el origen como autoridad: los marcadores se escriben a partir de la instantánea activa de la configuración de origen (antes de la resolución), no a partir de los valores secretos resueltos en tiempo de ejecución.

  </Accordion>
</AccordionGroup>

### Detalles de los campos del proveedor

<AccordionGroup>
  <Accordion title="Catálogo de nivel superior">
    - `models.mode`: comportamiento del catálogo de proveedores (`merge` o `replace`).
    - `models.providers`: mapa personalizado de proveedores indexado por identificador de proveedor.
      - Ediciones seguras: use `openclaw config set models.providers.<id> '<json>' --strict-json --merge` o `openclaw config set models.providers.<id>.models '<json-array>' --strict-json --merge` para actualizaciones aditivas. `config set` rechaza los reemplazos destructivos a menos que pase `--replace`.

  </Accordion>
  <Accordion title="Conexión y autenticación del proveedor">
    - `models.providers.*.api`: adaptador de solicitudes (`openai-completions`, `openai-responses`, `openai-chatgpt-responses`, `anthropic-messages`, `google-generative-ai`, `google-vertex`, `github-copilot`, `bedrock-converse-stream`, `ollama`, `azure-openai-responses`). Para backends autoalojados de `/v1/chat/completions`, como MLX, vLLM, SGLang y la mayoría de los servidores locales compatibles con OpenAI, use `openai-completions`. Un proveedor personalizado con `baseUrl` pero sin `api` usa `openai-completions` de forma predeterminada; establezca `openai-responses` solo cuando el backend admita `/v1/responses`.
    - `models.providers.*.apiKey`: credencial del proveedor (se recomienda la sustitución mediante SecretRef/entorno).
    - `models.providers.*.auth`: estrategia de autenticación (`api-key`, `token`, `oauth`, `aws-sdk`).
    - `models.providers.*.contextWindow`: ventana de contexto nativa predeterminada para los modelos de este proveedor cuando la entrada del modelo no establece `contextWindow`.
    - `models.providers.*.contextTokens`: límite efectivo predeterminado del contexto en tiempo de ejecución para los modelos de este proveedor cuando la entrada del modelo no establece `contextTokens`.
    - `models.providers.*.maxTokens`: límite predeterminado de tokens de salida para los modelos de este proveedor cuando la entrada del modelo no establece `maxTokens`.
    - `models.providers.*.timeoutSeconds`: tiempo de espera HTTP opcional, por proveedor y en segundos, para solicitudes al modelo, incluidos la conexión, las cabeceras, el cuerpo y la gestión de la cancelación total de la solicitud.
    - `models.providers.*.injectNumCtxForOpenAICompat`: para Ollama + `openai-completions`, inserta `options.num_ctx` en las solicitudes (valor predeterminado: `true`).
    - `models.providers.*.authHeader`: fuerza el transporte de credenciales en la cabecera `Authorization` cuando sea necesario.
    - `models.providers.*.baseUrl`: URL base de la API de origen.
    - `models.providers.*.headers`: cabeceras estáticas adicionales para el enrutamiento por proxy/inquilino.

  </Accordion>
  <Accordion title="Sobrescrituras del transporte de solicitudes">
    `models.providers.*.request`: sobrescrituras del transporte para solicitudes HTTP al proveedor de modelos.

    - `request.headers`: cabeceras adicionales (combinadas con los valores predeterminados del proveedor). Los valores aceptan SecretRef.
    - `request.auth`: sobrescritura de la estrategia de autenticación. Modos: `"provider-default"` (usa la autenticación integrada del proveedor), `"authorization-bearer"` (con `token`), `"header"` (con `headerName`, `value` y `prefix` opcional).
    - `request.proxy`: sobrescritura del proxy HTTP. Modos: `"env-proxy"` (usa las variables de entorno `HTTP_PROXY`/`HTTPS_PROXY`), `"explicit-proxy"` (con `url`). Ambos modos aceptan un subobjeto `tls` opcional.
    - `request.tls`: sobrescritura de TLS para conexiones directas. Campos: `ca`, `cert`, `key`, `passphrase` (todos aceptan SecretRef), `serverName`, `insecureSkipVerify`.
    - `request.allowPrivateNetwork`: cuando es `true`, permite que las solicitudes HTTP al proveedor de modelos accedan a rangos privados, CGNAT o similares a través de la protección de obtención HTTP del proveedor. Las URL base de proveedores personalizados/locales ya confían en el origen configurado exacto, excepto los orígenes de metadatos/enlace local, que permanecen bloqueados sin una aceptación explícita. Establezca este valor en `false` para desactivar la confianza en el origen exacto. WebSocket usa el mismo `request` para las cabeceras/TLS, pero no esa protección SSRF de obtención. Valor predeterminado: `false`.

  </Accordion>
  <Accordion title="Entradas del catálogo de modelos">
    - `models.providers.*.models`: entradas explícitas del catálogo de modelos del proveedor.
    - `models.providers.*.models.*.input`: modalidades de entrada del modelo. Use `["text"]` para modelos que solo admiten texto y `["text", "image"]` para modelos nativos de imagen/visión. Los archivos adjuntos de imagen solo se insertan en los turnos del agente cuando el modelo seleccionado está marcado como compatible con imágenes.
    - `models.providers.*.models.*.contextWindow`: metadatos de la ventana de contexto nativa del modelo. Este valor sobrescribe `contextWindow` a nivel de proveedor para ese modelo.
    - `models.providers.*.models.*.contextTokens`: límite opcional del contexto en tiempo de ejecución. Este valor sobrescribe `contextTokens` a nivel de proveedor; úselo cuando quiera un presupuesto de contexto efectivo menor que el `contextWindow` nativo del modelo; `openclaw models list` muestra ambos valores cuando difieren.
    - `models.providers.*.models.*.compat.supportsDeveloperRole`: indicación opcional de compatibilidad. Para `api: "openai-completions"` con un `baseUrl` no nativo y no vacío (el host no es `api.openai.com`), OpenClaw fuerza este valor a `false` en tiempo de ejecución. Un `baseUrl` vacío/omitido conserva el comportamiento predeterminado de OpenAI.
    - `models.providers.*.models.*.compat.requiresStringContent`: indicación opcional de compatibilidad para endpoints de chat compatibles con OpenAI que solo admiten cadenas. Cuando es `true`, OpenClaw aplana los arreglos `messages[].content` de texto puro y los convierte en cadenas simples antes de enviar la solicitud.
    - `models.providers.*.models.*.compat.strictMessageKeys`: indicación opcional de compatibilidad para endpoints de chat compatibles con OpenAI que aplican validación estricta. Cuando es `true`, OpenClaw reduce los objetos de mensajes salientes de Chat Completions a `role` y `content` antes de enviar la solicitud.
    - `models.providers.*.models.*.compat.thinkingFormat`: indicación opcional sobre la carga útil de razonamiento. Use `"together"` para `reasoning.enabled` al estilo de Together, `"qwen"` para `enable_thinking` en el nivel superior o `"qwen-chat-template"` para `chat_template_kwargs.enable_thinking` en servidores compatibles con OpenAI de la familia Qwen que admitan argumentos de palabra clave de plantilla de chat a nivel de solicitud, como vLLM. Los modelos Qwen de vLLM configurados exponen opciones binarias de `/think` (`off`, `on`) para estos formatos.
    - `models.providers.*.models.*.compat.requiresReasoningContentOnAssistantMessages`: indicación opcional de compatibilidad para backends de Chat Completions al estilo de DeepSeek que requieren que los mensajes anteriores del asistente conserven `reasoning_content` al reproducirse. Cuando es `true`, OpenClaw conserva ese campo en los mensajes salientes del asistente. Úselo al conectar un proxy personalizado compatible con DeepSeek que rechace solicitudes después de eliminar el razonamiento. Valor predeterminado: `false`.

  </Accordion>
  <Accordion title="Descubrimiento de Amazon Bedrock">
    - `plugins.entries.amazon-bedrock.config.discovery`: raíz de la configuración de descubrimiento automático de Bedrock.
    - `plugins.entries.amazon-bedrock.config.discovery.enabled`: activa/desactiva el descubrimiento implícito.
    - `plugins.entries.amazon-bedrock.config.discovery.region`: región de AWS para el descubrimiento.
    - `plugins.entries.amazon-bedrock.config.discovery.providerFilter`: filtro opcional por identificador de proveedor para el descubrimiento dirigido.
    - `plugins.entries.amazon-bedrock.config.discovery.refreshInterval`: intervalo de sondeo para actualizar el descubrimiento.
    - `plugins.entries.amazon-bedrock.config.discovery.defaultContextWindow`: ventana de contexto alternativa para los modelos descubiertos.
    - `plugins.entries.amazon-bedrock.config.discovery.defaultMaxTokens`: máximo alternativo de tokens de salida para los modelos descubiertos.

  </Accordion>
</AccordionGroup>

La incorporación interactiva de proveedores personalizados deduce la entrada de imágenes para patrones conocidos de identificadores de modelos de visión, incluidos GPT-4o/GPT-4.1/GPT-5+, las familias de razonamiento `o1`/`o3`/`o4`, Claude, Gemini, cualquier identificador con el sufijo `-vl` (Qwen-VL y similares) y familias con nombre como LLaVA, Pixtral, InternVL, Mllama, MiniCPM-V y GLM-4V; omite la pregunta adicional para familias conocidas que solo admiten texto (Llama, DeepSeek, Mistral/Mixtral, Kimi/Moonshot, Codestral, Devstral, Phi, QwQ, CodeLlama e identificadores Qwen simples sin un sufijo vl/vision). Los identificadores de modelos desconocidos siguen solicitando información sobre la compatibilidad con imágenes. La incorporación no interactiva usa la misma deducción; pase `--custom-image-input` para forzar metadatos compatibles con imágenes o `--custom-text-input` para forzar metadatos de solo texto.

### Ejemplos de proveedores

<AccordionGroup>
  <Accordion title="Cerebras (GLM 4.7 / GPT OSS)">
    El Plugin de proveedor externo oficial `cerebras` puede configurar esto mediante `openclaw onboard --auth-choice cerebras-api-key`. Use una configuración explícita del proveedor solo al sobrescribir los valores predeterminados.

    ```json5
    {
      env: { CEREBRAS_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: {
            primary: "cerebras/zai-glm-4.7",
            fallbacks: ["cerebras/gpt-oss-120b"],
          },
          models: {
            "cerebras/zai-glm-4.7": { alias: "GLM 4.7 (Cerebras)" },
            "cerebras/gpt-oss-120b": { alias: "GPT OSS 120B (Cerebras)" },
          },
        },
      },
      models: {
        mode: "merge",
        providers: {
          cerebras: {
            baseUrl: "https://api.cerebras.ai/v1",
            apiKey: "${CEREBRAS_API_KEY}",
            api: "openai-completions",
            models: [
              { id: "zai-glm-4.7", name: "GLM 4.7 (Cerebras)" },
              { id: "gpt-oss-120b", name: "GPT OSS 120B (Cerebras)" },
            ],
          },
        },
      },
    }
    ```

    Use `cerebras/zai-glm-4.7` para Cerebras; `zai/glm-4.7` para la conexión directa con Z.AI.

  </Accordion>
  <Accordion title="Kimi Coding">
    ```json5
    {
      env: { KIMI_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "kimi/kimi-for-coding" },
          models: { "kimi/kimi-for-coding": { alias: "Kimi Code" } },
        },
      },
    }
    ```

    Proveedor integrado compatible con Anthropic. Atajo: `openclaw onboard --auth-choice kimi-code-api-key`.

  </Accordion>
  <Accordion title="Modelos locales (LM Studio)">
    Consulta [Modelos locales](/es/gateway/local-models). En resumen: ejecuta un modelo local grande mediante la API Responses de LM Studio en hardware potente; mantén combinados los modelos alojados como alternativa.
  </Accordion>
  <Accordion title="MiniMax M3 (directo)">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "minimax/MiniMax-M3" },
          models: {
            "minimax/MiniMax-M3": { alias: "Minimax" },
          },
        },
      },
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
            ],
          },
        },
      },
    }
    ```

    Define `MINIMAX_API_KEY`. Atajos: `openclaw onboard --auth-choice minimax-global-api` u `openclaw onboard --auth-choice minimax-cn-api`. El catálogo de modelos usa M3 de forma predeterminada y también incluye las variantes de M2.7. En la ruta de transmisión compatible con Anthropic, OpenClaw desactiva de forma predeterminada el razonamiento de MiniMax M2.x, a menos que configures `thinking` explícitamente; MiniMax-M3 (y M3.x) permanece de forma predeterminada en la ruta de razonamiento omitido/adaptativo del proveedor. `/fast on` o `params.fastMode: true` sustituye `MiniMax-M2.7` por `MiniMax-M2.7-highspeed`.

  </Accordion>
  <Accordion title="Moonshot AI (Kimi)">
    ```json5
    {
      env: { MOONSHOT_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "moonshot/kimi-k2.6" },
          models: { "moonshot/kimi-k2.6": { alias: "Kimi K2.6" } },
        },
      },
      models: {
        mode: "merge",
        providers: {
          moonshot: {
            baseUrl: "https://api.moonshot.ai/v1",
            apiKey: "${MOONSHOT_API_KEY}",
            api: "openai-completions",
            models: [
              {
                id: "kimi-k2.6",
                name: "Kimi K2.6",
                reasoning: false,
                input: ["text", "image"],
                cost: { input: 0.95, output: 4, cacheRead: 0.16, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 262144,
              },
            ],
          },
        },
      },
    }
    ```

    Para el endpoint de China: `baseUrl: "https://api.moonshot.cn/v1"` u `openclaw onboard --auth-choice moonshot-api-key-cn`.

    Los endpoints nativos de Moonshot anuncian compatibilidad con el uso de transmisión en el transporte compartido `openai-completions`, y OpenClaw la activa según las capacidades del endpoint, en lugar de basarse únicamente en el identificador del proveedor integrado.

  </Accordion>
  <Accordion title="OpenCode">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "opencode/claude-opus-4-6" },
          models: { "opencode/claude-opus-4-6": { alias: "Opus" } },
        },
      },
    }
    ```

    Define `OPENCODE_API_KEY` (u `OPENCODE_ZEN_API_KEY`). Usa referencias `opencode/...` para el catálogo Zen o referencias `opencode-go/...` para el catálogo Go. Atajo: `openclaw onboard --auth-choice opencode-zen` u `openclaw onboard --auth-choice opencode-go`.

  </Accordion>
  <Accordion title="Synthetic (compatible con Anthropic)">
    ```json5
    {
      env: { SYNTHETIC_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "synthetic/hf:MiniMaxAI/MiniMax-M2.5" },
          models: { "synthetic/hf:MiniMaxAI/MiniMax-M2.5": { alias: "MiniMax M2.5" } },
        },
      },
      models: {
        mode: "merge",
        providers: {
          synthetic: {
            baseUrl: "https://api.synthetic.new/anthropic",
            apiKey: "${SYNTHETIC_API_KEY}",
            api: "anthropic-messages",
            models: [
              {
                id: "hf:MiniMaxAI/MiniMax-M2.5",
                name: "MiniMax M2.5",
                reasoning: true,
                input: ["text"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 192000,
                maxTokens: 65536,
              },
            ],
          },
        },
      },
    }
    ```

    La URL base debe omitir `/v1` (el cliente de Anthropic lo añade). Atajo: `openclaw onboard --auth-choice synthetic-api-key`.

  </Accordion>
  <Accordion title="Z.AI (GLM-4.7)">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "zai/glm-4.7" },
          models: { "zai/glm-4.7": {} },
        },
      },
    }
    ```

    Define `ZAI_API_KEY`. Las referencias de modelos usan el identificador canónico del proveedor `zai/*`. Atajo: `openclaw onboard --auth-choice zai-api-key`.

    - Endpoint general: `https://api.z.ai/api/paas/v4`
    - Endpoint de programación: `https://api.z.ai/api/coding/paas/v4`
    - La opción de autenticación predeterminada `zai-api-key` prueba tu clave y detecta automáticamente a qué endpoint pertenece (si la detección no es concluyente, solicita que elijas uno y selecciona Global de forma predeterminada). También hay opciones de autenticación específicas para CN y Coding-Plan que permiten seleccionarlas explícitamente.
    - Para el endpoint general, define un proveedor personalizado con la sobrescritura de la URL base.

  </Accordion>
</AccordionGroup>

---

## Contenido relacionado

- [Configuración — agentes](/es/gateway/config-agents)
- [Configuración — canales](/es/gateway/config-channels)
- [Referencia de configuración](/es/gateway/configuration-reference) — otras claves de nivel superior
- [Herramientas y plugins](/es/tools)
