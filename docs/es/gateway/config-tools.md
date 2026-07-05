---
read_when:
    - Configurar la política de `tools.*`, listas de permitidos o funciones experimentales
    - Registrar proveedores personalizados o anular URL base
    - Configurar endpoints autohospedados compatibles con OpenAI
sidebarTitle: Tools and custom providers
summary: Configuración de herramientas (política, opciones experimentales y herramientas respaldadas por proveedores) y configuración de proveedor/base-URL personalizados
title: Configuración — herramientas y proveedores personalizados
x-i18n:
    generated_at: "2026-07-05T11:17:04Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5205ff85e78d2eaa8f4eeced902e86383b9f92d8d1762b64d54f1e10c9bc379b
    source_path: gateway/config-tools.md
    workflow: 16
---

`tools.*` claves de configuración y configuración personalizada de proveedor / URL base. Para agentes, canales y otras claves de configuración de nivel superior, consulta [Referencia de configuración](/es/gateway/configuration-reference).

## Herramientas

### Perfiles de herramientas

`tools.profile` establece una lista de permitidos base antes de `tools.allow`/`tools.deny`:

<Note>
La incorporación local establece de forma predeterminada las nuevas configuraciones locales en `tools.profile: "coding"` cuando no está definido (se conservan los perfiles explícitos existentes).
</Note>

| Perfil      | Incluye                                                                                                                                                                                                                      |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimal`   | solo `session_status`                                                                                                                                                                                                        |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `get_goal`, `create_goal`, `update_goal`, `update_plan`, `skill_workshop`, `image`, `image_generate`, `music_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                                                                                                                    |
| `full`      | Sin restricción (igual que no definirlo)                                                                                                                                                                                     |

`coding` y `messaging` también permiten implícitamente `bundle-mcp` (servidores MCP configurados).

### Grupos de herramientas

| Grupo              | Herramientas                                                                                                            |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | `exec`, `process`, `code_execution` (`bash` se acepta como alias de `exec`)                                             |
| `group:fs`         | `read`, `write`, `edit`, `apply_patch`                                                                                  |
| `group:sessions`   | `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `sessions_yield`, `subagents`, `session_status` |
| `group:memory`     | `memory_search`, `memory_get`                                                                                           |
| `group:web`        | `web_search`, `x_search`, `web_fetch`                                                                                   |
| `group:ui`         | `browser`, `canvas`                                                                                                     |
| `group:automation` | `heartbeat_respond`, `cron`, `gateway`                                                                                  |
| `group:messaging`  | `message`                                                                                                               |
| `group:nodes`      | `nodes`                                                                                                                 |
| `group:agents`     | `agents_list`, `get_goal`, `create_goal`, `update_goal`, `update_plan`, `skill_workshop`                                |
| `group:media`      | `image`, `image_generate`, `music_generate`, `video_generate`, `tts`                                                    |
| `group:openclaw`   | Todas las herramientas integradas anteriores excepto `read`/`write`/`edit`/`apply_patch`/`exec`/`process`/`canvas` (excluye herramientas de plugins) |
| `group:plugins`    | Herramientas propiedad de plugins cargados, incluidos los servidores MCP configurados expuestos mediante `bundle-mcp`    |

### Herramientas MCP y de plugins dentro de la política de herramientas del sandbox

Los servidores MCP configurados se exponen como herramientas propiedad de plugins bajo el id de plugin `bundle-mcp`. Los perfiles normales de herramientas pueden permitirlos, pero `tools.sandbox.tools` es una puerta adicional para sesiones en sandbox. Si el modo de sandbox es `"all"` o `"non-main"`, incluye una de estas entradas en la lista de permitidos de herramientas del sandbox cuando las herramientas MCP/de plugins deban ser visibles:

- `bundle-mcp` para servidores MCP gestionados por OpenClaw desde `mcp.servers`
- el id de plugin para un plugin nativo específico
- `group:plugins` para todas las herramientas propiedad de plugins cargados
- nombres exactos de herramientas de servidor MCP o globs de servidor como `outlook__send_mail` u `outlook__*` cuando solo quieras un servidor

Los globs de servidor usan el prefijo de servidor MCP seguro para el proveedor, no necesariamente la clave sin procesar de `mcp.servers`. Los caracteres que no sean `[A-Za-z0-9_-]` se convierten en `-`, los nombres que no empiezan por una letra reciben el prefijo `mcp-`, y los prefijos largos o duplicados pueden truncarse o recibir un sufijo; por ejemplo, `mcp.servers["Outlook Graph"]` usa un glob como `outlook-graph__*`.

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

Sin esa entrada de la capa de sandbox, el servidor MCP todavía puede cargarse correctamente aunque sus herramientas se filtren antes de la solicitud al proveedor. Usa `openclaw doctor` para detectar esta forma en servidores gestionados por OpenClaw en `mcp.servers`. Los servidores MCP cargados desde manifiestos de plugins incluidos o desde `.mcp.json` de Claude usan la misma puerta de sandbox, pero este diagnóstico aún no enumera esas fuentes; usa las mismas entradas de la lista de permitidos si sus herramientas desaparecen en turnos en sandbox.

### `tools.codeMode`

`tools.codeMode` habilita la superficie genérica de modo de código de OpenClaw. Cuando está habilitada
para una ejecución con herramientas, el modelo solo ve `exec` y `wait`; las herramientas normales de OpenClaw
pasan detrás del puente de catálogo `tools.*` dentro del sandbox, y las herramientas MCP están
disponibles mediante el espacio de nombres `MCP` generado.

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

Las declaraciones MCP se exponen mediante la superficie de archivos de API virtual de solo lectura en
modo de código. El código invitado puede llamar a `API.list("mcp")` y
`API.read("mcp/<server>.d.ts")` para inspeccionar firmas de estilo TypeScript antes de
llamar a `MCP.<server>.<tool>()`. Consulta [Modo de código](/es/reference/code-mode) para conocer el
contrato de tiempo de ejecución, los límites y los pasos de depuración.

### `tools.allow` / `tools.deny`

Política global de permitir/denegar herramientas (denegar prevalece). No distingue mayúsculas de minúsculas, admite comodines `*`. Se aplica incluso cuando el sandbox de Docker está desactivado.

```json5
{
  tools: { deny: ["browser", "canvas"] },
}
```

`write` y `apply_patch` son ids de herramienta separados. `allow: ["write"]` también habilita `apply_patch` para modelos compatibles, pero `deny: ["write"]` no deniega `apply_patch`. Para bloquear toda mutación de archivos, deniega `group:fs` o enumera explícitamente cada herramienta mutadora:

```json5
{
  tools: { deny: ["write", "edit", "apply_patch"] },
}
```

<Note>
`allow` y `alsoAllow` no pueden establecerse ambos en el mismo ámbito (`tools`, `tools.byProvider.<id>`, `agents.list[].tools`): la validación de configuración lo rechaza. Fusiona las entradas de `alsoAllow` en `allow`, o elimina `allow` y usa `profile` + `alsoAllow` en su lugar.
</Note>

### `tools.byProvider`

Restringe aún más las herramientas para proveedores o modelos específicos. Orden: perfil base → perfil de proveedor → allow/deny.

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

Restringe las herramientas para una identidad de solicitante específica. Esto es defensa en profundidad sobre el control de acceso del canal; los valores del remitente deben provenir del adaptador de canal, no del texto del mensaje.

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

Las claves usan prefijos explícitos: `channel:<channelId>:<senderId>`, `id:<senderId>`, `e164:<phone>`, `username:<handle>`, `name:<displayName>` o `"*"`. Los ids de canal son ids canónicos de OpenClaw; alias como `teams` se normalizan a `msteams`. Las claves heredadas sin prefijo se aceptan solo como `id:`. El orden de coincidencia es channel+id, id, e164, username, name y luego comodín.

`agents.list[].tools.toolsBySender` por agente anula la coincidencia global de remitente cuando coincide, incluso con una política vacía `{}`.

### `tools.elevated`

Controla el acceso exec elevado fuera del sandbox:

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

- La anulación por agente (`agents.list[].tools.elevated`) solo puede restringir más.
- `/elevated on|off|ask|full` almacena el estado por sesión; las directivas en línea se aplican a un solo mensaje.
- `exec` elevado omite el sandboxing y usa la ruta de escape configurada (`gateway` por defecto, o `node` cuando el destino de exec es `node`).

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
        allowModels: ["gpt-5.5"],
      },
    },
  },
}
```

Los valores mostrados son los predeterminados excepto `applyPatch.allowModels` (vacío/no establecido por defecto, lo que significa que cualquier modelo compatible puede usar `apply_patch`). `approvalRunningNoticeMs` emite un aviso de ejecución cuando exec respaldado por aprobación se prolonga; `0` lo deshabilita.

### `tools.loopDetection`

Las comprobaciones de seguridad de bucles de herramientas están **deshabilitadas por defecto**. Establece `enabled: true` para activar la detección. La configuración puede definirse globalmente en `tools.loopDetection` y anularse por agente en `agents.list[].tools.loopDetection`.

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
  Umbral de patrón repetido sin progreso para advertencias.
</ParamField>
<ParamField path="unknownToolThreshold" type="number">
  Bloquea llamadas repetidas al mismo nombre de herramienta no disponible/desconocida tras este número de errores.
</ParamField>
<ParamField path="criticalThreshold" type="number">
  Umbral de repetición más alto para bloquear bucles críticos.
</ParamField>
<ParamField path="globalCircuitBreakerThreshold" type="number">
  Umbral de detención forzada para cualquier ejecución sin progreso.
</ParamField>
<ParamField path="detectors.genericRepeat" type="boolean">
  Advierte sobre llamadas repetidas con la misma herramienta/los mismos argumentos.
</ParamField>
<ParamField path="detectors.knownPollNoProgress" type="boolean">
  Advierte/bloquea en herramientas de sondeo conocidas (`process.poll`, `command_status`, etc.).
</ParamField>
<ParamField path="detectors.pingPong" type="boolean">
  Advierte/bloquea en patrones alternos de pares sin progreso.
</ParamField>
<ParamField path="postCompactionGuard.windowSize" type="number">
  Número de intentos durante los que la protección permanece armada tras la autocompaction; aborta si el agente repite el mismo (herramienta, argumentos, resultado) dentro de esa ventana.
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

Los valores mostrados son los predeterminados excepto `provider` y `userAgent`. `maxResponseBytes` se limita a 32000-10000000; `maxChars` se limita a `maxCharsCap` (aumenta `maxCharsCap` para permitir respuestas más grandes).

### `tools.media`

Configura la comprensión de medios entrantes (imagen/audio/video):

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

`concurrency` (predeterminado `2`), `audio.maxBytes` (predeterminado 20 MB) y `video.maxBytes` (predeterminado 50 MB) se muestran con sus valores predeterminados; `image.maxBytes` tiene un valor predeterminado de 10 MB. Valores predeterminados del tiempo de espera de solicitud por capacidad: imagen/audio `60`s, video `120`s.

<AccordionGroup>
  <Accordion title="Media model entry fields">
    **Entrada de proveedor** (`type: "provider"` u omitido):

    - `provider`: id de proveedor de API (`openai`, `anthropic`, `google`/`gemini`, `groq`, etc.)
    - `model`: anulación del id de modelo
    - `profile` / `preferredProfile`: selección de perfil de `auth-profiles.json`

    **Entrada de CLI** (`type: "cli"`):

    - `command`: ejecutable que se va a ejecutar
    - `args`: argumentos con plantilla (admite `{{MediaPath}}`, `{{Prompt}}`, `{{MaxChars}}`, etc.; `openclaw doctor --fix` migra los marcadores de posición obsoletos `{input}` a `{{MediaPath}}`)

    **Campos comunes:**

    - `capabilities`: lista opcional (`image`, `audio`, `video`). Cada Plugin de proveedor declara su propio conjunto de capacidades predeterminado; por ejemplo, el proveedor `openai` incluido usa de forma predeterminada imagen+audio, `anthropic`/`minimax` imagen, `google` imagen+audio+video y `groq` audio.
    - `prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`: anulaciones por entrada.
    - `tools.media.image.timeoutSeconds` y las entradas `timeoutSeconds` de modelo de imagen coincidentes también se aplican cuando el agente llama a la herramienta explícita `image`. Para la comprensión de imágenes, este tiempo de espera se aplica a la solicitud en sí y no se reduce por el trabajo de preparación previo.
    - Los fallos recurren a la siguiente entrada.

    La autenticación del proveedor sigue el orden estándar: `auth-profiles.json` → variables de entorno → `models.providers.*.apiKey`.

    **Campos de finalización asíncrona:**

    - `asyncCompletion.directSend`: marca de compatibilidad obsoleta. Las tareas de medios asíncronas completadas siguen mediadas por la sesión solicitante, para que el agente reciba el resultado, decida cómo comunicárselo al usuario y use la herramienta de mensajes cuando la entrega de origen lo requiera.

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

Controla a qué sesiones pueden dirigirse las herramientas de sesión (`sessions_list`, `sessions_history`, `sessions_send`).

Predeterminado: `tree` (sesión actual + sesiones generadas por ella, como subagentes).

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
  <Accordion title="Visibility scopes">
    - `self`: solo la clave de la sesión actual.
    - `tree`: sesión actual + sesiones generadas por la sesión actual (subagentes).
    - `agent`: cualquier sesión perteneciente al id del agente actual (puede incluir otros usuarios si ejecutas sesiones por remitente bajo el mismo id de agente).
    - `all`: cualquier sesión. Dirigirse entre agentes sigue requiriendo `tools.agentToAgent`.
    - Límite de sandbox: cuando la sesión actual está en sandbox y `agents.defaults.sandbox.sessionToolsVisibility="spawned"` (el valor predeterminado), la visibilidad se fuerza a `tree` aunque `tools.sessions.visibility="all"`.
    - Cuando no es `all`, `sessions_list` incluye un campo compacto `visibility`
      que describe el modo efectivo y una advertencia de que algunas sesiones pueden
      omitirse fuera del alcance actual.

  </Accordion>
</AccordionGroup>

### `tools.sessions_spawn`

Controla el soporte de adjuntos en línea para `sessions_spawn`.

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
  <Accordion title="Attachment notes">
    - Los adjuntos requieren `enabled: true`.
    - Los adjuntos de subagente se materializan en el espacio de trabajo secundario en `.openclaw/attachments/<uuid>/` con un `.manifest.json`.
    - Los adjuntos ACP solo pueden ser imágenes y se reenvían en línea al runtime de ACP después de pasar los mismos límites de recuento de archivos, bytes por archivo y bytes totales.
    - El contenido de los adjuntos se redacta automáticamente de la persistencia de transcripciones.
    - Las entradas Base64 se validan con comprobaciones estrictas de alfabeto/relleno y una protección de tamaño antes de la decodificación.
    - Los permisos de archivo de adjuntos de subagente son `0700` para directorios y `0600` para archivos.
    - La limpieza de subagente sigue la política `cleanup`: `delete` siempre elimina los adjuntos; `keep` los conserva solo cuando `retainOnSessionKeep: true`.

  </Accordion>
</AccordionGroup>

<a id="toolsexperimental"></a>

### `tools.experimental`

Marcas de herramientas integradas experimentales. Desactivado de forma predeterminada salvo que se aplique una regla de activación automática estrictamente agéntica de GPT-5.

```json5
{
  tools: {
    experimental: {
      planTool: true, // enable experimental update_plan
    },
  },
}
```

- `planTool`: habilita la herramienta estructurada `update_plan` para hacer seguimiento de trabajo no trivial de varios pasos.
- Predeterminado: `false`, salvo que `agents.defaults.embeddedAgent.executionContract` (o una anulación por agente) esté configurado en `"strict-agentic"` para una ejecución del proveedor `openai` con un id de modelo de la familia GPT-5 (esto también cubre las ejecuciones de OpenAI Codex CLI, ya que el enrutamiento de autenticación/modelo de Codex vive bajo el proveedor `openai`). Configúralo en `true` para forzar la activación de la herramienta fuera de ese alcance, o en `false` para mantenerla desactivada incluso en ejecuciones estrictamente agénticas de GPT-5.
- Cuando está habilitada, el prompt del sistema también agrega orientación de uso para que el modelo solo la use en trabajos sustanciales y mantenga como máximo un paso `in_progress`.

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

- `model`: modelo predeterminado para subagentes generados. Si se omite, los subagentes heredan el modelo del llamador.
- `allowAgents`: lista de permitidos predeterminada de ids de agentes de destino configurados para `sessions_spawn` cuando el agente solicitante no define su propio `subagents.allowAgents` (`["*"]` = cualquier destino configurado; predeterminado: solo el mismo agente). Las entradas obsoletas cuya configuración de agente se eliminó son rechazadas por `sessions_spawn` y omitidas de `agents_list`; ejecuta `openclaw doctor --fix` para limpiarlas.
- `maxConcurrent`: máximo de ejecuciones concurrentes de subagente. Predeterminado: `8`.
- `runTimeoutSeconds`: tiempo de espera (segundos) para `sessions_spawn` cuando el llamador no pasa su propia anulación. Predeterminado: `0` (sin tiempo de espera); el `900` mostrado arriba es un valor común de activación voluntaria, no el valor predeterminado integrado.
- `announceTimeoutMs`: tiempo de espera por llamada (milisegundos) para intentos de entrega de anuncio `agent` de Gateway. Predeterminado: `120000`. Los reintentos transitorios pueden hacer que la espera total del anuncio sea mayor que un tiempo de espera configurado.
- `archiveAfterMinutes`: minutos después de que una sesión de subagente se completa antes de archivarla automáticamente. Predeterminado: `60`; `0` desactiva el archivado automático.
- Política de herramientas por subagente: `tools.subagents.tools.allow` / `tools.subagents.tools.deny`.

---

## Proveedores personalizados y URL base

Los Plugins de proveedor publican sus propias filas de catálogo de modelos. Agrega proveedores personalizados mediante `models.providers` en la configuración o `~/.openclaw/agents/<agentId>/agent/models.json`.

Configurar un `baseUrl` de proveedor personalizado/local también es la decisión estrecha de confianza de red para solicitudes HTTP de modelo: OpenClaw permite ese origen exacto `scheme://host:port` a través de la ruta de fetch protegida, sin agregar una opción de configuración separada ni confiar en otros orígenes privados.

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
  <Accordion title="Auth and merge precedence">
    - Usa `authHeader: true` + `headers` para necesidades de autenticación personalizadas.
    - Anula la raíz de configuración del agente con `OPENCLAW_AGENT_DIR`.
    - Precedencia de fusión para IDs de proveedor coincidentes:
      - Los valores `baseUrl` no vacíos de `models.json` del agente ganan.
      - Los valores `apiKey` no vacíos del agente ganan solo cuando ese proveedor no está gestionado por SecretRef en el contexto actual de configuración/perfil de autenticación.
      - Los valores `apiKey` de proveedor gestionados por SecretRef se actualizan desde los marcadores de origen (`ENV_VAR_NAME` para refs de entorno, `secretref-managed` para refs de archivo/exec) en lugar de persistir secretos resueltos.
      - Los valores de encabezado de proveedor gestionados por SecretRef se actualizan desde los marcadores de origen (`secretref-env:ENV_VAR_NAME` para refs de entorno, `secretref-managed` para refs de archivo/exec).
      - `apiKey`/`baseUrl` del agente vacíos o ausentes recurren a `models.providers` en la configuración.
      - `contextWindow`/`maxTokens` de modelo coincidentes: el valor explícito de configuración gana cuando está presente y es válido (un número finito positivo); de lo contrario, se usa el valor de catálogo implícito/generado.
      - `contextTokens` de modelo coincidente sigue la misma regla explícito-gana-si-no-implícito; úsalo para limitar el contexto efectivo sin cambiar los metadatos nativos del modelo.
      - Los catálogos de Plugins de proveedor se almacenan como fragmentos de catálogo generados propiedad del Plugin bajo el estado de Plugins del agente.
      - Usa `models.mode: "replace"` cuando quieras que la configuración reescriba por completo `models.json` y omita fusionar fragmentos de catálogo propiedad de Plugins.
      - La persistencia de marcadores es autoritativa desde el origen: los marcadores se escriben desde la instantánea de configuración de origen activa (antes de la resolución), no desde valores secretos resueltos en runtime.

  </Accordion>
</AccordionGroup>

### Detalles de campos de proveedor

<AccordionGroup>
  <Accordion title="Catálogo de nivel superior">
    - `models.mode`: comportamiento del catálogo de proveedores (`merge` o `replace`).
    - `models.providers`: mapa de proveedores personalizados indexado por id de proveedor.
      - Ediciones seguras: usa `openclaw config set models.providers.<id> '<json>' --strict-json --merge` o `openclaw config set models.providers.<id>.models '<json-array>' --strict-json --merge` para actualizaciones aditivas. `config set` rechaza reemplazos destructivos salvo que pases `--replace`.

  </Accordion>
  <Accordion title="Conexión y autenticación del proveedor">
    - `models.providers.*.api`: adaptador de solicitud (`openai-completions`, `openai-responses`, `openai-chatgpt-responses`, `anthropic-messages`, `google-generative-ai`, `google-vertex`, `github-copilot`, `bedrock-converse-stream`, `ollama`, `azure-openai-responses`). Para backends autoalojados de `/v1/chat/completions` como MLX, vLLM, SGLang y la mayoría de servidores locales compatibles con OpenAI, usa `openai-completions`. Un proveedor personalizado con `baseUrl` pero sin `api` usa `openai-completions` de forma predeterminada; define `openai-responses` solo cuando el backend admita `/v1/responses`.
    - `models.providers.*.apiKey`: credencial del proveedor (prefiere sustitución SecretRef/env).
    - `models.providers.*.auth`: estrategia de autenticación (`api-key`, `token`, `oauth`, `aws-sdk`).
    - `models.providers.*.contextWindow`: ventana de contexto nativa predeterminada para los modelos bajo este proveedor cuando la entrada del modelo no define `contextWindow`.
    - `models.providers.*.contextTokens`: límite de contexto efectivo de ejecución predeterminado para los modelos bajo este proveedor cuando la entrada del modelo no define `contextTokens`.
    - `models.providers.*.maxTokens`: límite predeterminado de tokens de salida para los modelos bajo este proveedor cuando la entrada del modelo no define `maxTokens`.
    - `models.providers.*.timeoutSeconds`: tiempo de espera opcional por proveedor, en segundos, para solicitudes HTTP de modelos, incluido el manejo de conexión, encabezados, cuerpo y cancelación total de la solicitud.
    - `models.providers.*.injectNumCtxForOpenAICompat`: para Ollama + `openai-completions`, inyecta `options.num_ctx` en las solicitudes (predeterminado: `true`).
    - `models.providers.*.authHeader`: fuerza el transporte de credenciales en el encabezado `Authorization` cuando sea necesario.
    - `models.providers.*.baseUrl`: URL base de la API ascendente.
    - `models.providers.*.headers`: encabezados estáticos adicionales para enrutamiento por proxy/inquilino.

  </Accordion>
  <Accordion title="Sobrescrituras del transporte de solicitudes">
    `models.providers.*.request`: sobrescrituras de transporte para solicitudes HTTP de proveedores de modelos.

    - `request.headers`: encabezados adicionales (fusionados con los valores predeterminados del proveedor). Los valores aceptan SecretRef.
    - `request.auth`: sobrescritura de estrategia de autenticación. Modos: `"provider-default"` (usa la autenticación integrada del proveedor), `"authorization-bearer"` (con `token`), `"header"` (con `headerName`, `value`, `prefix` opcional).
    - `request.proxy`: sobrescritura de proxy HTTP. Modos: `"env-proxy"` (usa las variables de entorno `HTTP_PROXY`/`HTTPS_PROXY`), `"explicit-proxy"` (con `url`). Ambos modos aceptan un subobjeto `tls` opcional.
    - `request.tls`: sobrescritura de TLS para conexiones directas. Campos: `ca`, `cert`, `key`, `passphrase` (todos aceptan SecretRef), `serverName`, `insecureSkipVerify`.
    - `request.allowPrivateNetwork`: cuando es `true`, permite que las solicitudes HTTP de proveedores de modelos accedan a rangos privados, CGNAT o similares mediante la protección de fetch HTTP del proveedor. Las URL base de proveedores personalizados/locales ya confían en el origen exacto configurado, excepto los orígenes de metadatos/locales de enlace, que siguen bloqueados sin adhesión explícita. Define esto como `false` para excluirte de la confianza en el origen exacto. WebSocket usa el mismo `request` para encabezados/TLS, pero no esa puerta SSRF de fetch. Predeterminado: `false`.

  </Accordion>
  <Accordion title="Entradas del catálogo de modelos">
    - `models.providers.*.models`: entradas explícitas del catálogo de modelos del proveedor.
    - `models.providers.*.models.*.input`: modalidades de entrada del modelo. Usa `["text"]` para modelos solo de texto y `["text", "image"]` para modelos nativos de imagen/visión. Los adjuntos de imagen solo se inyectan en turnos de agente cuando el modelo seleccionado está marcado como compatible con imágenes.
    - `models.providers.*.models.*.contextWindow`: metadatos de la ventana de contexto nativa del modelo. Esto sobrescribe el `contextWindow` de nivel de proveedor para ese modelo.
    - `models.providers.*.models.*.contextTokens`: límite de contexto de ejecución opcional. Esto sobrescribe el `contextTokens` de nivel de proveedor; úsalo cuando quieras un presupuesto de contexto efectivo menor que el `contextWindow` nativo del modelo; `openclaw models list` muestra ambos valores cuando difieren.
    - `models.providers.*.models.*.compat.supportsDeveloperRole`: pista de compatibilidad opcional. Para `api: "openai-completions"` con un `baseUrl` no nativo y no vacío (host distinto de `api.openai.com`), OpenClaw fuerza esto a `false` en tiempo de ejecución. Un `baseUrl` vacío/omitido conserva el comportamiento predeterminado de OpenAI.
    - `models.providers.*.models.*.compat.requiresStringContent`: pista de compatibilidad opcional para endpoints de chat compatibles con OpenAI que solo aceptan cadenas. Cuando es `true`, OpenClaw aplana los arrays `messages[].content` de texto puro en cadenas simples antes de enviar la solicitud.
    - `models.providers.*.models.*.compat.strictMessageKeys`: pista de compatibilidad opcional para endpoints de chat compatibles con OpenAI estrictos. Cuando es `true`, OpenClaw reduce los objetos de mensajes salientes de Chat Completions a `role` y `content` antes de enviar la solicitud.
    - `models.providers.*.models.*.compat.thinkingFormat`: pista opcional de carga útil de razonamiento. Usa `"together"` para `reasoning.enabled` al estilo Together, `"qwen"` para `enable_thinking` de nivel superior, o `"qwen-chat-template"` para `chat_template_kwargs.enable_thinking` en servidores compatibles con OpenAI de la familia Qwen que admiten kwargs de plantilla de chat a nivel de solicitud, como vLLM. Los modelos Qwen de vLLM configurados exponen opciones binarias de `/think` (`off`, `on`) para estos formatos.
    - `models.providers.*.models.*.compat.requiresReasoningContentOnAssistantMessages`: pista de compatibilidad opcional para backends de Chat Completions al estilo DeepSeek que requieren que los mensajes anteriores del asistente conserven `reasoning_content` en la reproducción. Cuando es `true`, OpenClaw conserva ese campo en los mensajes salientes del asistente. Úsalo al conectar un proxy personalizado compatible con DeepSeek que rechace solicitudes después de eliminar el razonamiento. Predeterminado: `false`.

  </Accordion>
  <Accordion title="Descubrimiento de Amazon Bedrock">
    - `plugins.entries.amazon-bedrock.config.discovery`: raíz de configuración de descubrimiento automático de Bedrock.
    - `plugins.entries.amazon-bedrock.config.discovery.enabled`: activa/desactiva el descubrimiento implícito.
    - `plugins.entries.amazon-bedrock.config.discovery.region`: región de AWS para el descubrimiento.
    - `plugins.entries.amazon-bedrock.config.discovery.providerFilter`: filtro opcional de id de proveedor para descubrimiento dirigido.
    - `plugins.entries.amazon-bedrock.config.discovery.refreshInterval`: intervalo de sondeo para actualizar el descubrimiento.
    - `plugins.entries.amazon-bedrock.config.discovery.defaultContextWindow`: ventana de contexto de respaldo para modelos descubiertos.
    - `plugins.entries.amazon-bedrock.config.discovery.defaultMaxTokens`: tokens de salida máximos de respaldo para modelos descubiertos.

  </Accordion>
</AccordionGroup>

La incorporación interactiva de proveedores personalizados infiere la entrada de imagen para patrones conocidos de ids de modelos de visión, incluidos GPT-4o/GPT-4.1/GPT-5+, las familias de razonamiento `o1`/`o3`/`o4`, Claude, Gemini, cualquier id con sufijo `-vl` (Qwen-VL y similares), y familias con nombre como LLaVA, Pixtral, InternVL, Mllama, MiniCPM-V y GLM-4V; omite la pregunta adicional para familias conocidas de solo texto (Llama, DeepSeek, Mistral/Mixtral, Kimi/Moonshot, Codestral, Devstral, Phi, QwQ, CodeLlama e ids Qwen simples sin sufijo vl/vision). Los ids de modelo desconocidos aún preguntan por compatibilidad con imágenes. La incorporación no interactiva usa la misma inferencia; pasa `--custom-image-input` para forzar metadatos compatibles con imágenes o `--custom-text-input` para forzar metadatos de solo texto.

### Ejemplos de proveedores

<AccordionGroup>
  <Accordion title="Cerebras (GLM 4.7 / GPT OSS)">
    El plugin de proveedor externo oficial `cerebras` puede configurar esto mediante `openclaw onboard --auth-choice cerebras-api-key`. Usa configuración explícita del proveedor solo al sobrescribir valores predeterminados.

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

    Usa `cerebras/zai-glm-4.7` para Cerebras; `zai/glm-4.7` para Z.AI directo.

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

    Compatible con Anthropic, proveedor integrado. Atajo: `openclaw onboard --auth-choice kimi-code-api-key`.

  </Accordion>
  <Accordion title="Modelos locales (LM Studio)">
    Consulta [Modelos locales](/es/gateway/local-models). TL;DR: ejecuta un modelo local grande mediante la API Responses de LM Studio en hardware serio; conserva los modelos alojados fusionados como respaldo.
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

    Define `MINIMAX_API_KEY`. Atajos: `openclaw onboard --auth-choice minimax-global-api` u `openclaw onboard --auth-choice minimax-cn-api`. El catálogo de modelos usa M3 de forma predeterminada y también incluye las variantes M2.7. En la ruta de streaming compatible con Anthropic, OpenClaw desactiva el razonamiento de MiniMax M2.x de forma predeterminada salvo que definas explícitamente `thinking`; MiniMax-M3 (y M3.x) permanece de forma predeterminada en la ruta de razonamiento omitida/adaptativa del proveedor. `/fast on` o `params.fastMode: true` reescribe `MiniMax-M2.7` a `MiniMax-M2.7-highspeed`.

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

    Los endpoints nativos de Moonshot anuncian compatibilidad de uso de streaming en el transporte compartido `openai-completions`, y OpenClaw lo determina a partir de las capacidades del endpoint en lugar de solo el id de proveedor integrado.

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
  <Accordion title="Synthetic (Anthropic-compatible)">
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

    Define `ZAI_API_KEY`. Las referencias de modelo usan el ID de proveedor canónico `zai/*`. Atajo: `openclaw onboard --auth-choice zai-api-key`.

    - Endpoint general: `https://api.z.ai/api/paas/v4`
    - Endpoint de codificación: `https://api.z.ai/api/coding/paas/v4`
    - La opción de autenticación predeterminada `zai-api-key` prueba tu clave y detecta automáticamente a qué endpoint pertenece (recurriendo a un prompt, con Global como valor predeterminado, si la detección no es concluyente). También hay opciones de autenticación dedicadas para CN y Coding-Plan disponibles para una selección explícita.
    - Para el endpoint general, define un proveedor personalizado con la anulación de URL base.

  </Accordion>
</AccordionGroup>

---

## Relacionado

- [Configuración — agentes](/es/gateway/config-agents)
- [Configuración — canales](/es/gateway/config-channels)
- [Referencia de configuración](/es/gateway/configuration-reference) — otras claves de nivel superior
- [Herramientas y plugins](/es/tools)
