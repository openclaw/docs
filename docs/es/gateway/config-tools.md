---
read_when:
    - Configuración de la política de `tools.*`, las listas de permitidos o las funciones experimentales
    - Registrar proveedores personalizados o sobrescribir las URL base
    - Configuración de endpoints autoalojados compatibles con OpenAI
sidebarTitle: Tools and custom providers
summary: Configuración de herramientas (política, opciones experimentales, herramientas respaldadas por proveedores) y configuración de proveedor/URL base personalizados
title: 'Configuración: herramientas y proveedores personalizados'
x-i18n:
    generated_at: "2026-07-20T00:51:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 690d3c0bf9a1a542c6989c74f0bc15c7e52798892436aa8bd710d22b00fcf015
    source_path: gateway/config-tools.md
    workflow: 16
---

`tools.*` claves de configuración y configuración de proveedores personalizados / URL base. Para agentes, canales y otras claves de configuración de nivel superior, consulte la [Referencia de configuración](/es/gateway/configuration-reference).

## Herramientas

### Perfiles de herramientas

`tools.profile` establece una lista de permitidos base antes de `tools.allow`/`tools.deny`:

<Note>
La incorporación local establece de forma predeterminada `tools.profile: "coding"` en las configuraciones locales nuevas cuando no se especifica (se conservan los perfiles explícitos existentes).
</Note>

| Perfil      | Incluye                                                                                                                                                                                                                                                 |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimal`   | solo `session_status`                                                                                                                                                                                                                                   |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `get_goal`, `create_goal`, `update_goal`, `update_plan`, `ask_user`, `skill_workshop`, `image`, `image_generate`, `music_generate`, `video_generate`                |
| `messaging` | `group:messaging`, `sessions`, `sessions_list`, `sessions_history`, `sessions_search`, `conversations_list`, `conversations_send`, `conversations_turn`, `sessions_send`, `sessions_spawn`, `sessions_yield`, `subagents`, `session_status`, `ask_user` |
| `full`      | Sin restricciones (igual que si no se especifica)                                                                                                                                                                                                       |

`coding` y `messaging` también permiten implícitamente `bundle-mcp` (servidores MCP configurados).

### Grupos de herramientas

| Grupo              | Herramientas                                                                                                                                                                                                                                            |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `group:runtime`    | `exec`, `process`, `code_execution` (`bash` se acepta como alias de `exec`)                                                                                                                                                                        |
| `group:fs`         | `read`, `write`, `edit`, `apply_patch`                                                                                                                                                                                                                 |
| `group:sessions`   | `sessions`, `sessions_list`, `sessions_history`, `sessions_search`, `conversations_list`, `conversations_send`, `conversations_turn`, `sessions_send`, `sessions_spawn`, `sessions_yield`, `subagents`, `session_status`, `spawn_task`, `dismiss_task` |
| `group:memory`     | `memory_search`, `memory_get`                                                                                                                                                                                                                          |
| `group:web`        | `web_search`, `x_search`, `web_fetch`                                                                                                                                                                                                                  |
| `group:ui`         | `browser`, `screen`, `terminal`, `canvas`, `show_widget`                                                                                                                                                                                               |
| `group:automation` | `heartbeat_respond`, `cron`, `gateway`                                                                                                                                                                                                                 |
| `group:messaging`  | `message`                                                                                                                                                                                                                                              |
| `group:nodes`      | `nodes`, `computer`                                                                                                                                                                                                                                    |
| `group:agents`     | `agents_list`, `get_goal`, `create_goal`, `update_goal`, `update_plan`, `ask_user`, `skill_workshop`                                                                                                                                                   |
| `group:media`      | `image`, `image_generate`, `music_generate`, `video_generate`, `tts`                                                                                                                                                                                   |
| `group:openclaw`   | Todas las herramientas integradas anteriores excepto `read`/`write`/`edit`/`apply_patch`/`exec`/`process`/`canvas` (excluye las herramientas de plugins)                                                                                                                                  |
| `group:plugins`    | Herramientas pertenecientes a plugins cargados, incluidos los servidores MCP configurados expuestos mediante `bundle-mcp`                                                                                                                                                           |

`spawn_task` permite que un agente de programación proponga trabajo de seguimiento confirmado sin iniciarlo. La interfaz de control muestra el título y el resumen como un chip accionable; una TUI respaldada por el Gateway muestra una solicitud interactiva equivalente. Al aceptar cualquiera de ellos, se crea una nueva sesión de árbol de trabajo administrado y se envía allí la solicitud completa mientras continúa el turno actual. `dismiss_task` retira una sugerencia aún pendiente mediante el `task_id` efímero devuelto por `spawn_task`.

Las herramientas solo se ofrecen cuando la superficie del operador que inicia la acción puede recibir y procesar eventos de sugerencia de tareas del Gateway. Las sesiones de canal y las sesiones TUI locales/integradas no los reciben; los transportes de canal necesitan una acción de tarea tipada y portátil antes de poder exponer este flujo de forma segura. Las sugerencias son locales al proceso y desaparecen cuando se reinicia el Gateway. Ambas herramientas permanecen en el perfil `coding` y en `group:sessions`, por lo que la política normal de `tools.allow` y `tools.deny` las configura automáticamente cuando la superficie las admite.

### Herramientas MCP y de plugins dentro de la política de herramientas del entorno aislado

Los servidores MCP configurados se exponen como herramientas pertenecientes a plugins bajo el id de plugin `bundle-mcp`. Los perfiles de herramientas normales pueden permitirlas, pero `tools.sandbox.tools` constituye una barrera adicional para las sesiones en entornos aislados. Si el modo de entorno aislado es `"all"` o `"non-main"`, incluya una de estas entradas en la lista de herramientas permitidas del entorno aislado cuando las herramientas MCP/de plugins deban estar visibles:

- `bundle-mcp` para los servidores MCP administrados por OpenClaw desde `mcp.servers`
- el id de plugin de un plugin nativo específico
- `group:plugins` para todas las herramientas pertenecientes a plugins cargados
- nombres exactos de herramientas de servidores MCP o patrones globales de servidores como `outlook__send_mail` o `outlook__*` cuando solo se desea un servidor

Los patrones globales de servidores usan el prefijo de servidor MCP seguro para el proveedor, no necesariamente la clave `mcp.servers` sin procesar. Los caracteres que no sean `[A-Za-z0-9_-]` se convierten en `-`, los nombres que no comienzan por una letra reciben el prefijo `mcp-`, y los prefijos largos o duplicados pueden truncarse o recibir un sufijo; por ejemplo, `mcp.servers["Outlook Graph"]` usa un patrón global como `outlook-graph__*`.

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

Sin esa entrada en la capa del entorno aislado, el servidor MCP puede seguir cargándose correctamente mientras sus herramientas se filtran antes de la solicitud al proveedor. Use `openclaw doctor` para detectar esta configuración en los servidores administrados por OpenClaw en `mcp.servers`. Los servidores MCP cargados desde manifiestos de plugins incluidos o desde `.mcp.json` de Claude usan la misma barrera del entorno aislado, pero este diagnóstico todavía no enumera esas fuentes; use las mismas entradas de la lista de permitidos si sus herramientas desaparecen en turnos ejecutados en entornos aislados.

### `tools.codeMode`

`tools.codeMode` habilita la superficie genérica del modo de código de OpenClaw. Cuando se habilita
para una ejecución con herramientas, las herramientas normales de OpenClaw pasan a estar detrás del puente
de catálogo `tools.*` dentro del entorno aislado, y las herramientas MCP están disponibles mediante
el espacio de nombres `MCP` generado. El modelo normalmente ve `exec` y
`wait`; herramientas como `computer`, cuyos resultados estructurados no pueden atravesar
el puente exclusivamente JSON, permanecen directas.

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

En el modo de código, las declaraciones MCP se exponen mediante la superficie de archivos de la API virtual
de solo lectura. El código invitado puede llamar a `API.list("mcp")` y
`API.read("mcp/<server>.d.ts")` para inspeccionar firmas de estilo TypeScript antes de
llamar a `MCP.<server>.<tool>()`. Consulte [Modo de código](/es/tools/code-mode) para conocer el
contrato de ejecución, los límites y los pasos de depuración.

### `tools.allow` / `tools.deny`

Política global para permitir/denegar herramientas (la denegación prevalece). No distingue entre mayúsculas y minúsculas y admite comodines `*`. Se aplica incluso cuando el entorno aislado de Docker está desactivado.

```json5
{
  tools: { deny: ["browser", "canvas"] },
}
```

`write` y `apply_patch` son ids de herramientas independientes. `allow: ["write"]` también habilita `apply_patch` para modelos compatibles, pero `deny: ["write"]` no deniega `apply_patch`. Para bloquear toda modificación de archivos, deniegue `group:fs` o enumere explícitamente cada herramienta de modificación:

```json5
{
  tools: { deny: ["write", "edit", "apply_patch"] },
}
```

<Note>
`allow` y `alsoAllow` no pueden establecerse a la vez en el mismo ámbito (`tools`, `tools.byProvider.<id>`, `agents.list[].tools`); la validación de la configuración lo rechaza. Combine las entradas de `alsoAllow` en `allow`, o elimine `allow` y use `profile` + `alsoAllow` en su lugar.
</Note>

### `tools.byProvider`

Restringe aún más las herramientas para proveedores o modelos específicos. Orden: perfil base → perfil del proveedor → permitir/denegar.

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

Restringe las herramientas para una identidad de solicitante específica. Esta es una medida de defensa en profundidad adicional al control de acceso del canal; los valores del remitente deben proceder del adaptador del canal, no del texto del mensaje.

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

Las claves usan prefijos explícitos: `channel:<channelId>:<senderId>`, `id:<senderId>`, `e164:<phone>`, `username:<handle>`, `name:<displayName>` o `"*"`. Los identificadores de canal son identificadores canónicos de OpenClaw; los alias como `teams` se normalizan a `msteams`. Las claves heredadas sin prefijo solo se aceptan como `id:`. El orden de coincidencia es canal+id, id, e164, nombre de usuario, nombre y, por último, comodín.

La configuración `agents.list[].tools.toolsBySender` por agente reemplaza la coincidencia global del remitente cuando coincide, incluso con una política `{}` vacía.

### `tools.elevated`

Controla el acceso elevado a la ejecución fuera del entorno aislado:

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

- La configuración por agente (`agents.list[].tools.elevated`) solo puede aplicar restricciones adicionales.
- `/elevated on|off|ask|full` almacena el estado por sesión; las directivas insertadas se aplican a un único mensaje.
- La ejecución elevada `exec` omite el aislamiento y utiliza la ruta de escape configurada (`gateway` de forma predeterminada, o `node` cuando el destino de ejecución es `node`).

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

Los valores mostrados son los predeterminados, excepto `applyPatch.allowModels` (vacío o sin definir de forma predeterminada, lo que significa que cualquier modelo compatible puede usar `apply_patch`). `approvalRunningNoticeMs` emite un aviso de ejecución cuando una ejecución respaldada por aprobación se prolonga; `0` lo desactiva.

### `tools.loopDetection`

Las comprobaciones de seguridad del bucle de herramientas están **desactivadas de forma predeterminada**. Establezca `enabled: true` para activar la detección. La configuración puede definirse globalmente en `tools.loopDetection` y reemplazarse por agente en `agents.list[].tools.loopDetection`.

```json5
{
  tools: {
    loopDetection: {
      enabled: true,
    },
  },
}
```

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

Los valores mostrados son los predeterminados, excepto `provider` y `userAgent`. `maxResponseBytes` limita el valor al intervalo 32000–10000000; `maxChars` lo limita a `maxCharsCap` (aumente `maxCharsCap` para permitir respuestas más grandes).

### `tools.media`

Configura la comprensión de contenido multimedia entrante (imagen/audio/vídeo):

```json5
{
  tools: {
    media: {
      concurrency: 2,
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

`concurrency` (valor predeterminado: `2`), `audio.maxBytes` (valor predeterminado: 20 MB) y `video.maxBytes` (valor predeterminado: 50 MB) se muestran con sus valores predeterminados; el valor predeterminado de `image.maxBytes` es 10 MB. Tiempos de espera de solicitud predeterminados por capacidad: imagen/audio, `60` s; vídeo, `120` s.

<AccordionGroup>
  <Accordion title="Campos de las entradas de modelos multimedia">
    **Entrada de proveedor** (`type: "provider"` u omitida):

    - `provider`: identificador del proveedor de API (`openai`, `anthropic`, `google`/`gemini`, `groq`, etc.)
    - `model`: reemplazo del identificador del modelo
    - `profile` / `preferredProfile`: selección del perfil `auth-profiles.json`

    **Entrada de CLI** (`type: "cli"`):

    - `command`: ejecutable que se debe ejecutar
    - `args`: argumentos con plantilla (admite `{{MediaPath}}`, `{{Prompt}}`, `{{MaxChars}}`, etc.; `openclaw doctor --fix` migra los marcadores de posición obsoletos `{input}` a `{{MediaPath}}`)

    **Campos comunes:**

    - `capabilities`: lista opcional (`image`, `audio`, `video`). Cada Plugin de proveedor declara su propio conjunto de capacidades predeterminado; por ejemplo, el proveedor incluido `openai` tiene como valores predeterminados imagen+audio, `anthropic`/`minimax` imagen, `google` imagen+audio+vídeo y `groq` audio.
    - `prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`: reemplazos por entrada.
    - Las entradas `tools.media.image.timeoutSeconds` y las entradas coincidentes `timeoutSeconds` del modelo de imagen también se aplican cuando el agente llama a la herramienta explícita `image`. Para la comprensión de imágenes, este tiempo de espera se aplica a la solicitud en sí y no se reduce por el trabajo de preparación anterior.
    - En caso de fallo, se recurre a la siguiente entrada.

    La autenticación del proveedor sigue el orden estándar: `auth-profiles.json` → variables de entorno → `models.providers.*.apiKey`.

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

Valor predeterminado: `tree` (la sesión actual y las sesiones que esta genera, como los subagentes, además de las sesiones de grupo supervisadas de forma ambiental para el mismo agente).

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
    - `tree`: la sesión actual y las sesiones generadas por ella (subagentes). Para las operaciones de lectura, también incluye las sesiones de grupo del mismo agente que la sesión actual supervisa mediante el conocimiento ambiental de grupos.
    - `agent`: cualquier sesión perteneciente al identificador del agente actual (puede incluir a otros usuarios si se ejecutan sesiones por remitente con el mismo identificador de agente).
    - `all`: cualquier sesión. El direccionamiento entre agentes sigue requiriendo `tools.agentToAgent`.
    - Límite del entorno aislado: cuando la sesión actual está aislada y `agents.defaults.sandbox.sessionToolsVisibility="spawned"` (el valor predeterminado), la visibilidad se fuerza a `tree` incluso si `tools.sessions.visibility="all"`.
    - Cuando no es `all`, `sessions_list` incluye un campo compacto `visibility`
      que describe el modo efectivo y una advertencia de que algunas sesiones pueden
      omitirse fuera del ámbito actual.

  </Accordion>
</AccordionGroup>

Con el valor predeterminado `session.dmScope: "main"`, la actividad humana en un grupo hace que esa sesión
de grupo del mismo agente sea visible de forma ambiental para la sesión principal del agente. En una configuración multiusuario, `"main"` también comparte
una sesión de mensaje directo entre los usuarios, por lo que cada usuario dirigido allí puede leer los grupos supervisados de forma ambiental,
incluso mediante `memory_search` de la memoria de sesión. Use un valor `dmScope` por par para aislar los mensajes directos, o establezca
`tools.sessions.visibility: "self"` para desactivar las lecturas de sesiones supervisadas de forma ambiental.

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
    - Los archivos adjuntos de los subagentes se materializan en el espacio de trabajo secundario en `.openclaw/attachments/<uuid>/` con un `.manifest.json`.
    - Los archivos adjuntos de ACP se limitan a imágenes y se reenvían insertados al entorno de ejecución de ACP después de superar los mismos límites de cantidad de archivos, bytes por archivo y bytes totales.
    - El contenido de los archivos adjuntos se censura automáticamente al conservar la transcripción.
    - Las entradas Base64 se validan mediante comprobaciones estrictas del alfabeto y del relleno, además de una protección de tamaño previa a la descodificación.
    - Los permisos de los archivos adjuntos de los subagentes son `0700` para los directorios y `0600` para los archivos.
    - La limpieza de los subagentes sigue la política `cleanup`: `delete` siempre elimina los archivos adjuntos; `keep` solo los conserva cuando `retainOnSessionKeep: true`.

  </Accordion>
</AccordionGroup>

<a id="toolsexperimental"></a>

### `tools.experimental`

Indicadores experimentales de herramientas integradas. Desactivados de forma predeterminada, salvo que se aplique una regla de activación automática para agentes estrictos de GPT-5.

```json5
{
  tools: {
    experimental: {
      planTool: true, // enable experimental update_plan
    },
  },
}
```

- `planTool`: activa la herramienta estructurada `update_plan` para hacer un seguimiento del trabajo no trivial de varios pasos.
- Valor predeterminado: `false`, salvo que `agents.defaults.embeddedAgent.executionContract` (o un reemplazo por agente) se establezca en `"strict-agentic"` para una ejecución del proveedor `openai` con un identificador de modelo de la familia GPT-5 (esto también abarca las ejecuciones de OpenAI Codex CLI, ya que el enrutamiento de autenticación y modelos de Codex reside en el proveedor `openai`). Establezca `true` para forzar la activación de la herramienta fuera de ese ámbito, o `false` para mantenerla desactivada incluso en las ejecuciones de GPT-5 con agentes estrictos.
- Cuando está activada, el prompt del sistema también añade orientación de uso para que el modelo solo la utilice en trabajos sustanciales y mantenga como máximo un paso `in_progress`.

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

- `model`: modelo predeterminado para los subagentes generados. Si se omite, los subagentes heredan el modelo del invocador.
- `allowAgents`: lista de permitidos predeterminada de identificadores de agentes de destino configurados para `sessions_spawn` cuando el agente solicitante no establece su propio `subagents.allowAgents` (`["*"]` = cualquier destino configurado; valor predeterminado: solo el mismo agente). Las entradas obsoletas cuya configuración de agente se haya eliminado son rechazadas por `sessions_spawn` y se omiten de `agents_list`; ejecute `openclaw doctor --fix` para eliminarlas.
- `maxConcurrent`: número máximo de ejecuciones simultáneas de subagentes. Valor predeterminado: `8`.
- `runTimeoutSeconds`: tiempo de espera (segundos) para `sessions_spawn` cuando el invocador no proporciona su propia sobrescritura. Valor predeterminado: `0` (sin tiempo de espera); el valor `900` mostrado anteriormente es un valor de suscripción habitual, no el valor predeterminado integrado.
- `announceTimeoutMs`: tiempo de espera por llamada (milisegundos) para los intentos de entrega de anuncios `agent` del Gateway. Valor predeterminado: `120000`. Los reintentos transitorios pueden hacer que la espera total del anuncio sea mayor que un tiempo de espera configurado.
- `archiveAfterMinutes`: minutos que transcurren desde que se completa una sesión de subagente hasta que se archiva automáticamente. Valor predeterminado: `60`; `0` desactiva el archivado automático.
- Política de herramientas por subagente: `tools.subagents.tools.allow` / `tools.subagents.tools.deny`.

---

## Proveedores personalizados y URL base

Los plugins de proveedores publican sus propias filas del catálogo de modelos. Añada proveedores personalizados mediante `models.providers` en la configuración o `~/.openclaw/agents/<agentId>/agent/models.json`.

Configurar un `baseUrl` de proveedor personalizado/local también constituye la decisión de confianza de red limitada para las solicitudes HTTP de modelos: OpenClaw permite ese origen `scheme://host:port` exacto a través de la ruta de obtención protegida, sin añadir otra opción de configuración ni confiar en otros orígenes privados.

```json5
{
  models: {
    mode: "merge", // combinar (predeterminado) | reemplazar
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
    - Utilice `authHeader: true` + `headers` para las necesidades de autenticación personalizada.
    - Sobrescriba la raíz de configuración del agente con `OPENCLAW_AGENT_DIR`.
    - Precedencia de combinación para identificadores de proveedor coincidentes:
      - Los valores no vacíos de `models.json` `baseUrl` del agente tienen prioridad.
      - Los valores no vacíos de `apiKey` del agente solo tienen prioridad cuando ese proveedor no está administrado por SecretRef en el contexto actual de configuración/perfil de autenticación.
      - Los valores `apiKey` de proveedores administrados por SecretRef se actualizan desde marcadores de origen (`ENV_VAR_NAME` para referencias de entorno y `secretref-managed` para referencias de archivo/ejecución) en lugar de conservar los secretos resueltos.
      - Los valores de cabecera de proveedores administrados por SecretRef se actualizan desde marcadores de origen (`secretref-env:ENV_VAR_NAME` para referencias de entorno y `secretref-managed` para referencias de archivo/ejecución).
      - Los valores `apiKey`/`baseUrl` del agente vacíos o ausentes recurren a `models.providers` en la configuración.
      - Para `contextWindow`/`maxTokens` del modelo coincidente: el valor de configuración explícito tiene prioridad cuando está presente y es válido (un número finito positivo); de lo contrario, se utiliza el valor de catálogo implícito/generado.
      - El valor `contextTokens` del modelo coincidente sigue la misma regla de prioridad explícita y, en su ausencia, implícita; utilícelo para limitar el contexto efectivo sin cambiar los metadatos nativos del modelo.
      - Los catálogos de plugins de proveedores se almacenan como fragmentos de catálogo generados y propiedad del plugin dentro del estado de plugins del agente.
      - Utilice `models.mode: "replace"` cuando quiera que la configuración reescriba por completo `models.json` y omita la combinación con fragmentos de catálogo propiedad de plugins.
      - La persistencia de marcadores se rige por el origen: los marcadores se escriben a partir de la instantánea de configuración de origen activa (antes de la resolución), no a partir de los valores secretos resueltos en tiempo de ejecución.

  </Accordion>
</AccordionGroup>

### Detalles de los campos del proveedor

<AccordionGroup>
  <Accordion title="Catálogo de nivel superior">
    - `models.mode`: comportamiento del catálogo de proveedores (`merge` o `replace`).
    - `models.providers`: mapa de proveedores personalizados cuya clave es el identificador del proveedor.
      - Ediciones seguras: utilice `openclaw config set models.providers.<id> '<json>' --strict-json --merge` o `openclaw config set models.providers.<id>.models '<json-array>' --strict-json --merge` para actualizaciones aditivas. `config set` rechaza los reemplazos destructivos a menos que se proporcione `--replace`.

  </Accordion>
  <Accordion title="Conexión y autenticación del proveedor">
    - `models.providers.*.api`: adaptador de solicitudes (`openai-completions`, `openai-responses`, `openai-chatgpt-responses`, `anthropic-messages`, `google-generative-ai`, `google-vertex`, `github-copilot`, `bedrock-converse-stream`, `ollama`, `azure-openai-responses`). Para backends `/v1/chat/completions` autoalojados como MLX, vLLM, SGLang y la mayoría de los servidores locales compatibles con OpenAI, utilice `openai-completions`. Un proveedor personalizado con `baseUrl` pero sin `api` usa de forma predeterminada `openai-completions`; establezca `openai-responses` solo cuando el backend admita `/v1/responses`.
    - `models.providers.*.apiKey`: credencial del proveedor (se recomienda la sustitución mediante SecretRef/entorno).
    - `models.providers.*.auth`: estrategia de autenticación (`api-key`, `token`, `oauth`, `aws-sdk`).
    - `models.providers.*.contextWindow`: ventana de contexto nativa predeterminada para los modelos de este proveedor cuando la entrada del modelo no establece `contextWindow`.
    - `models.providers.*.contextTokens`: límite de contexto efectivo predeterminado en tiempo de ejecución para los modelos de este proveedor cuando la entrada del modelo no establece `contextTokens`.
    - `models.providers.*.maxTokens`: límite predeterminado de tokens de salida para los modelos de este proveedor cuando la entrada del modelo no establece `maxTokens`.
    - `models.providers.*.timeoutSeconds`: tiempo de espera opcional por proveedor para solicitudes HTTP de modelos, en segundos, incluida la conexión, las cabeceras, el cuerpo y la gestión de la cancelación total de la solicitud.
    - `models.providers.*.injectNumCtxForOpenAICompat`: para Ollama + `openai-completions`, inyecta `options.num_ctx` en las solicitudes (valor predeterminado: `true`).
    - `models.providers.*.authHeader`: fuerza el transporte de credenciales en la cabecera `Authorization` cuando sea necesario.
    - `models.providers.*.baseUrl`: URL base de la API ascendente.
    - `models.providers.*.headers`: cabeceras estáticas adicionales para el enrutamiento de proxy/inquilino.

  </Accordion>
  <Accordion title="Sobrescrituras del transporte de solicitudes">
    `models.providers.*.request`: sobrescrituras del transporte para solicitudes HTTP a proveedores de modelos.

    - `request.headers`: cabeceras adicionales (combinadas con los valores predeterminados del proveedor). Los valores admiten SecretRef.
    - `request.auth`: sobrescritura de la estrategia de autenticación. Modos: `"provider-default"` (utiliza la autenticación integrada del proveedor), `"authorization-bearer"` (con `token`), `"header"` (con `headerName`, `value` y `prefix` opcional).
    - `request.proxy`: sobrescritura del proxy HTTP. Modos: `"env-proxy"` (utiliza las variables de entorno `HTTP_PROXY`/`HTTPS_PROXY`), `"explicit-proxy"` (con `url`). Ambos modos admiten un subobjeto `tls` opcional.
    - `request.tls`: sobrescritura de TLS para conexiones directas. Campos: `ca`, `cert`, `key`, `passphrase` (todos admiten SecretRef), `serverName`, `insecureSkipVerify`.
    - `request.allowPrivateNetwork`: cuando es `true`, permite solicitudes HTTP de proveedores de modelos a rangos privados, CGNAT o similares a través de la protección de obtención HTTP del proveedor. Las URL base de proveedores personalizados/locales ya confían en el origen configurado exacto, salvo los orígenes de metadatos/enlace local, que siguen bloqueados sin una suscripción explícita. Establezca este valor en `false` para dejar de confiar en el origen exacto. WebSocket utiliza el mismo `request` para cabeceras/TLS, pero no esa protección SSRF de obtención. Valor predeterminado: `false`.

  </Accordion>
  <Accordion title="Entradas del catálogo de modelos">
    - `models.providers.*.models`: entradas explícitas del catálogo de modelos del proveedor.
    - `models.providers.*.models.*.input`: modalidades de entrada del modelo. Utilice `["text"]` para modelos que solo admiten texto y `["text", "image"]` para modelos nativos de imagen/visión. Los archivos adjuntos de imagen solo se inyectan en los turnos del agente cuando el modelo seleccionado está marcado como compatible con imágenes.
    - `models.providers.*.models.*.contextWindow`: metadatos de la ventana de contexto nativa del modelo. Este valor sobrescribe `contextWindow` del nivel del proveedor para ese modelo.
    - `models.providers.*.models.*.contextTokens`: límite de contexto opcional en tiempo de ejecución. Este valor sobrescribe `contextTokens` del nivel del proveedor; utilícelo cuando quiera un presupuesto de contexto efectivo menor que el `contextWindow` nativo del modelo; `openclaw models list` muestra ambos valores cuando difieren.
    - `models.providers.*.models.*.compat.supportsDeveloperRole`: indicación de compatibilidad opcional. Para `api: "openai-completions"` con un `baseUrl` no nativo y no vacío (host distinto de `api.openai.com`), OpenClaw fuerza este valor a `false` en tiempo de ejecución. Un `baseUrl` vacío u omitido conserva el comportamiento predeterminado de OpenAI.
    - `models.providers.*.models.*.compat.requiresStringContent`: indicación de compatibilidad opcional para endpoints de chat compatibles con OpenAI que solo admiten cadenas. Cuando es `true`, OpenClaw aplana los arrays `messages[].content` de texto puro y los convierte en cadenas simples antes de enviar la solicitud.
    - `models.providers.*.models.*.compat.strictMessageKeys`: indicación de compatibilidad opcional para endpoints de chat estrictos compatibles con OpenAI. Cuando es `true`, OpenClaw reduce los objetos de mensajes salientes de Chat Completions a `role` y `content` antes de enviar la solicitud.
    - `models.providers.*.models.*.compat.thinkingFormat`: indicación opcional de carga útil de razonamiento. Utilice `"together"` para `reasoning.enabled` al estilo de Together, `"qwen"` para `enable_thinking` de nivel superior o `"qwen-chat-template"` para `chat_template_kwargs.enable_thinking` en servidores compatibles con OpenAI de la familia Qwen que admitan argumentos de palabras clave de plantilla de chat a nivel de solicitud, como vLLM. Los modelos Qwen de vLLM configurados exponen opciones binarias `/think` (`off`, `on`) para estos formatos.
    - `models.providers.*.models.*.compat.requiresReasoningContentOnAssistantMessages`: indicación de compatibilidad opcional para backends de Chat Completions al estilo de DeepSeek que requieren que los mensajes anteriores del asistente conserven `reasoning_content` durante la reproducción. Cuando es `true`, OpenClaw conserva ese campo en los mensajes salientes del asistente. Utilícelo al conectar un proxy personalizado compatible con DeepSeek que rechace solicitudes después de eliminar el razonamiento. Valor predeterminado: `false`.

  </Accordion>
  <Accordion title="Detección de Amazon Bedrock">
    - `plugins.entries.amazon-bedrock.config.discovery`: raíz de la configuración de detección automática de Bedrock.
    - `plugins.entries.amazon-bedrock.config.discovery.enabled`: activa o desactiva la detección implícita.
    - `plugins.entries.amazon-bedrock.config.discovery.region`: región de AWS para la detección.
    - `plugins.entries.amazon-bedrock.config.discovery.providerFilter`: filtro opcional por identificador de proveedor para la detección selectiva.
    - `plugins.entries.amazon-bedrock.config.discovery.refreshInterval`: intervalo de sondeo para actualizar la detección.
    - `plugins.entries.amazon-bedrock.config.discovery.defaultContextWindow`: ventana de contexto alternativa para los modelos detectados.
    - `plugins.entries.amazon-bedrock.config.discovery.defaultMaxTokens`: número máximo alternativo de tokens de salida para los modelos detectados.

  </Accordion>
</AccordionGroup>

La incorporación interactiva de proveedores personalizados infiere la entrada de imágenes para patrones conocidos de identificadores de modelos de visión, incluidos GPT-4o/GPT-4.1/GPT-5+, las familias de razonamiento `o1`/`o3`/`o4`, Claude, Gemini, cualquier identificador con el sufijo `-vl` (Qwen-VL y similares) y familias con nombre como LLaVA, Pixtral, InternVL, Mllama, MiniCPM-V y GLM-4V; omite la pregunta adicional para las familias conocidas que solo admiten texto (Llama, DeepSeek, Mistral/Mixtral, Kimi/Moonshot, Codestral, Devstral, Phi, QwQ, CodeLlama e identificadores Qwen simples sin un sufijo vl/vision). Los identificadores de modelos desconocidos siguen mostrando una pregunta sobre la compatibilidad con imágenes. La incorporación no interactiva utiliza la misma inferencia; pase `--custom-image-input` para forzar metadatos compatibles con imágenes o `--custom-text-input` para forzar metadatos que solo admitan texto.

### Ejemplos de proveedores

<AccordionGroup>
  <Accordion title="Cerebras (GLM 4.7 / GPT OSS)">
    El Plugin oficial de proveedor externo `cerebras` puede configurar esto mediante `openclaw onboard --auth-choice cerebras-api-key`. Utilice una configuración explícita del proveedor solo para sustituir los valores predeterminados.

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

    Utilice `cerebras/zai-glm-4.7` para Cerebras; `zai/glm-4.7` para acceder directamente a Z.AI.

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

    Proveedor integrado compatible con Anthropic. Acceso directo: `openclaw onboard --auth-choice kimi-code-api-key`.

  </Accordion>
  <Accordion title="Modelos locales (LM Studio)">
    Consulte [Modelos locales](/es/gateway/local-models). En resumen: ejecute un modelo local de gran tamaño mediante la API Responses de LM Studio en hardware de alto rendimiento; mantenga combinados los modelos alojados como alternativa.
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

    Configure `MINIMAX_API_KEY`. Accesos directos: `openclaw onboard --auth-choice minimax-global-api` o `openclaw onboard --auth-choice minimax-cn-api`. El catálogo de modelos utiliza M3 de forma predeterminada y también incluye las variantes M2.7. En la ruta de transmisión compatible con Anthropic, OpenClaw desactiva de forma predeterminada el razonamiento de MiniMax M2.x, a menos que se configure explícitamente `thinking`; MiniMax-M3 (y M3.x) permanece de forma predeterminada en la ruta de razonamiento omitido/adaptativo del proveedor. `/fast on` o `params.fastMode: true` sustituye `MiniMax-M2.7` por `MiniMax-M2.7-highspeed`.

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

    Para el punto de conexión de China: `baseUrl: "https://api.moonshot.cn/v1"` o `openclaw onboard --auth-choice moonshot-api-key-cn`.

    Los puntos de conexión nativos de Moonshot anuncian compatibilidad con el uso de transmisión en el transporte compartido `openai-completions`, y OpenClaw la determina mediante las capacidades del punto de conexión, en lugar de basarse únicamente en el identificador del proveedor integrado.

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

    Configure `OPENCODE_API_KEY` (o `OPENCODE_ZEN_API_KEY`). Utilice referencias `opencode/...` para el catálogo Zen o referencias `opencode-go/...` para el catálogo Go. Acceso directo: `openclaw onboard --auth-choice opencode-zen` o `openclaw onboard --auth-choice opencode-go`.

  </Accordion>
  <Accordion title="Synthetic (compatible con Anthropic)">
    ```json5
    {
      env: { SYNTHETIC_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "synthetic/hf:MiniMaxAI/MiniMax-M3" },
          models: { "synthetic/hf:MiniMaxAI/MiniMax-M3": { alias: "MiniMax M3" } },
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
                id: "hf:MiniMaxAI/MiniMax-M3",
                name: "MiniMax M3",
                reasoning: true,
                input: ["text", "image"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 65536,
              },
            ],
          },
        },
      },
    }
    ```

    La URL base debe omitir `/v1` (el cliente de Anthropic lo añade). Acceso directo: `openclaw onboard --auth-choice synthetic-api-key`.

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

    Configure `ZAI_API_KEY`. Las referencias de modelos utilizan el identificador canónico de proveedor `zai/*`. Acceso directo: `openclaw onboard --auth-choice zai-api-key`.

    - Punto de conexión general: `https://api.z.ai/api/paas/v4`
    - Punto de conexión de programación: `https://api.z.ai/api/coding/paas/v4`
    - La opción de autenticación predeterminada `zai-api-key` comprueba la clave y detecta automáticamente a qué punto de conexión pertenece (si la detección no es concluyente, muestra una pregunta cuyo valor predeterminado es Global). También hay opciones de autenticación específicas para CN y Coding-Plan que permiten seleccionarlos explícitamente.
    - Para el punto de conexión general, defina un proveedor personalizado con la sustitución de la URL base.

  </Accordion>
</AccordionGroup>

---

## Contenido relacionado

- [Configuración — agentes](/es/gateway/config-agents)
- [Configuración — canales](/es/gateway/config-channels)
- [Referencia de configuración](/es/gateway/configuration-reference) — otras claves de nivel superior
- [Herramientas y plugins](/es/tools)
