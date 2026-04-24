---
read_when:
    - Configurar la política, las listas permitidas o las funciones experimentales de `tools.*`
    - Registrar proveedores personalizados o anular URLs base
    - Configurar endpoints autoalojados compatibles con OpenAI
summary: Configuración de herramientas (política, alternancias experimentales, herramientas respaldadas por proveedor) y configuración personalizada de proveedor/base-URL
title: Configuración — herramientas y proveedores personalizados
x-i18n:
    generated_at: "2026-04-24T05:27:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: 92535fb937f688c7cd39dcf5fc55f4663c8d234388a46611527efad4b7ee85eb
    source_path: gateway/config-tools.md
    workflow: 15
---

Claves de configuración `tools.*` y configuración personalizada de proveedor / base-URL. Para agentes,
canales y otras claves de configuración de nivel superior, consulta
[Referencia de configuración](/es/gateway/configuration-reference).

## Herramientas

### Perfiles de herramientas

`tools.profile` establece una lista permitida base antes de `tools.allow`/`tools.deny`:

La incorporación local establece de forma predeterminada las nuevas configuraciones locales en `tools.profile: "coding"` cuando no está configurado (los perfiles explícitos existentes se conservan).

| Perfil | Incluye |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `minimal` | solo `session_status` |
| `coding` | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status` |
| `full` | Sin restricción (igual que no configurado) |

### Grupos de herramientas

| Grupo | Herramientas |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| `group:runtime` | `exec`, `process`, `code_execution` (`bash` se acepta como alias de `exec`) |
| `group:fs` | `read`, `write`, `edit`, `apply_patch` |
| `group:sessions` | `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `sessions_yield`, `subagents`, `session_status` |
| `group:memory` | `memory_search`, `memory_get` |
| `group:web` | `web_search`, `x_search`, `web_fetch` |
| `group:ui` | `browser`, `canvas` |
| `group:automation` | `cron`, `gateway` |
| `group:messaging` | `message` |
| `group:nodes` | `nodes` |
| `group:agents` | `agents_list` |
| `group:media` | `image`, `image_generate`, `video_generate`, `tts` |
| `group:openclaw` | Todas las herramientas integradas (excluye Plugins de proveedor) |

### `tools.allow` / `tools.deny`

Política global de permitir/denegar herramientas (deny prevalece). No distingue mayúsculas de minúsculas y admite comodines `*`. Se aplica incluso cuando el sandbox Docker está desactivado.

```json5
{
  tools: { deny: ["browser", "canvas"] },
}
```

### `tools.byProvider`

Restringe aún más las herramientas para proveedores o modelos específicos. Orden: perfil base → perfil del proveedor → allow/deny.

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

### `tools.elevated`

Controla el acceso a exec elevado fuera del sandbox:

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
- `exec` elevado omite el sandboxing y usa la ruta de escape configurada (`gateway` de forma predeterminada, o `node` cuando el destino de exec es `node`).

### `tools.exec`

```json5
{
  tools: {
    exec: {
      backgroundMs: 10000,
      timeoutSec: 1800,
      cleanupMs: 1800000,
      notifyOnExit: true,
      notifyOnExitEmptySuccess: false,
      applyPatch: {
        enabled: false,
        allowModels: ["gpt-5.5"],
      },
    },
  },
}
```

### `tools.loopDetection`

Las comprobaciones de seguridad de bucle de herramientas están **desactivadas de forma predeterminada**. Establece `enabled: true` para activar la detección.
Los ajustes pueden definirse globalmente en `tools.loopDetection` y anularse por agente en `agents.list[].tools.loopDetection`.

```json5
{
  tools: {
    loopDetection: {
      enabled: true,
      historySize: 30,
      warningThreshold: 10,
      criticalThreshold: 20,
      globalCircuitBreakerThreshold: 30,
      detectors: {
        genericRepeat: true,
        knownPollNoProgress: true,
        pingPong: true,
      },
    },
  },
}
```

- `historySize`: historial máximo de llamadas a herramientas conservado para análisis de bucles.
- `warningThreshold`: umbral de patrón repetido sin progreso para advertencias.
- `criticalThreshold`: umbral repetido más alto para bloquear bucles críticos.
- `globalCircuitBreakerThreshold`: umbral de detención estricta para cualquier ejecución sin progreso.
- `detectors.genericRepeat`: advierte sobre llamadas repetidas de la misma herramienta/con los mismos argumentos.
- `detectors.knownPollNoProgress`: advierte/bloquea sobre herramientas de sondeo conocidas (`process.poll`, `command_status`, etc.).
- `detectors.pingPong`: advierte/bloquea sobre patrones alternantes en pares sin progreso.
- Si `warningThreshold >= criticalThreshold` o `criticalThreshold >= globalCircuitBreakerThreshold`, falla la validación.

### `tools.web`

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        apiKey: "brave_api_key", // or BRAVE_API_KEY env
        maxResults: 5,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
      },
      fetch: {
        enabled: true,
        provider: "firecrawl", // optional; omit for auto-detect
        maxChars: 50000,
        maxCharsCap: 50000,
        maxResponseBytes: 2000000,
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

### `tools.media`

Configura la comprensión de contenido multimedia entrante (imagen/audio/video):

```json5
{
  tools: {
    media: {
      concurrency: 2,
      asyncCompletion: {
        directSend: false, // opt-in: send finished async music/video directly to the channel
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
      video: {
        enabled: true,
        maxBytes: 52428800,
        models: [{ provider: "google", model: "gemini-3-flash-preview" }],
      },
    },
  },
}
```

<Accordion title="Campos de entrada del modelo multimedia">

**Entrada de proveedor** (`type: "provider"` o se omite):

- `provider`: id del proveedor de API (`openai`, `anthropic`, `google`/`gemini`, `groq`, etc.)
- `model`: anulación del id del modelo
- `profile` / `preferredProfile`: selección de perfil en `auth-profiles.json`

**Entrada de CLI** (`type: "cli"`):

- `command`: ejecutable que se va a ejecutar
- `args`: argumentos con plantillas (admite `{{MediaPath}}`, `{{Prompt}}`, `{{MaxChars}}`, etc.)

**Campos comunes:**

- `capabilities`: lista opcional (`image`, `audio`, `video`). Valores predeterminados: `openai`/`anthropic`/`minimax` → image, `google` → image+audio+video, `groq` → audio.
- `prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`: anulaciones por entrada.
- Los fallos pasan a la siguiente entrada.

La autenticación del proveedor sigue el orden estándar: `auth-profiles.json` → variables de entorno → `models.providers.*.apiKey`.

**Campos de finalización asíncrona:**

- `asyncCompletion.directSend`: cuando es `true`, las tareas asíncronas completadas de `music_generate`
  y `video_generate` intentan primero la entrega directa al canal. Valor predeterminado: `false`
  (ruta heredada de activación de sesión del solicitante/entrega del modelo).

</Accordion>

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

Controla qué sesiones pueden ser objetivo de las herramientas de sesión (`sessions_list`, `sessions_history`, `sessions_send`).

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

Notas:

- `self`: solo la clave de sesión actual.
- `tree`: sesión actual + sesiones generadas por la sesión actual (subagentes).
- `agent`: cualquier sesión que pertenezca al id del agente actual (puede incluir otros usuarios si ejecutas sesiones por remitente bajo el mismo id de agente).
- `all`: cualquier sesión. El direccionamiento entre agentes sigue requiriendo `tools.agentToAgent`.
- Restricción por sandbox: cuando la sesión actual está en sandbox y `agents.defaults.sandbox.sessionToolsVisibility="spawned"`, la visibilidad se fuerza a `tree` incluso si `tools.sessions.visibility="all"`.

### `tools.sessions_spawn`

Controla la compatibilidad de adjuntos en línea para `sessions_spawn`.

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

Notas:

- Los adjuntos solo se admiten para `runtime: "subagent"`. El tiempo de ejecución ACP los rechaza.
- Los archivos se materializan en el espacio de trabajo hijo en `.openclaw/attachments/<uuid>/` con un `.manifest.json`.
- El contenido de los adjuntos se redacta automáticamente al persistir la transcripción.
- Las entradas base64 se validan con comprobaciones estrictas de alfabeto/relleno y una protección de tamaño previa a la decodificación.
- Los permisos de archivos son `0700` para directorios y `0600` para archivos.
- La limpieza sigue la política `cleanup`: `delete` siempre elimina los adjuntos; `keep` los conserva solo cuando `retainOnSessionKeep: true`.

<a id="toolsexperimental"></a>

### `tools.experimental`

Banderas experimentales de herramientas integradas. Desactivadas de forma predeterminada salvo que se aplique una regla de activación automática estricta-agéntica para GPT-5.

```json5
{
  tools: {
    experimental: {
      planTool: true, // enable experimental update_plan
    },
  },
}
```

Notas:

- `planTool`: habilita la herramienta estructurada `update_plan` para el seguimiento de trabajo no trivial de varios pasos.
- Predeterminado: `false` salvo que `agents.defaults.embeddedPi.executionContract` (o una anulación por agente) esté establecido en `"strict-agentic"` para una ejecución de la familia GPT-5 de OpenAI u OpenAI Codex. Establece `true` para forzar la herramienta fuera de ese alcance, o `false` para mantenerla desactivada incluso en ejecuciones GPT-5 estrictas-agénticas.
- Cuando está habilitada, el prompt del sistema también agrega guía de uso para que el modelo solo la use en trabajo sustancial y mantenga como máximo un paso `in_progress`.

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
        archiveAfterMinutes: 60,
      },
    },
  },
}
```

- `model`: modelo predeterminado para subagentes generados. Si se omite, los subagentes heredan el modelo de quien llama.
- `allowAgents`: lista permitida predeterminada de ids de agentes de destino para `sessions_spawn` cuando el agente solicitante no establece su propio `subagents.allowAgents` (`["*"]` = cualquiera; predeterminado: solo el mismo agente).
- `runTimeoutSeconds`: tiempo de espera predeterminado (segundos) para `sessions_spawn` cuando la llamada de herramienta omite `runTimeoutSeconds`. `0` significa sin tiempo de espera.
- Política de herramientas por subagente: `tools.subagents.tools.allow` / `tools.subagents.tools.deny`.

---

## Proveedores personalizados y URLs base

OpenClaw usa el catálogo integrado de modelos. Agrega proveedores personalizados mediante `models.providers` en la configuración o en `~/.openclaw/agents/<agentId>/agent/models.json`.

```json5
{
  models: {
    mode: "merge", // merge (default) | replace
    providers: {
      "custom-proxy": {
        baseUrl: "http://localhost:4000/v1",
        apiKey: "LITELLM_KEY",
        api: "openai-completions", // openai-completions | openai-responses | anthropic-messages | google-generative-ai
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

- Usa `authHeader: true` + `headers` para necesidades de autenticación personalizadas.
- Anula la raíz de configuración del agente con `OPENCLAW_AGENT_DIR` (o `PI_CODING_AGENT_DIR`, un alias heredado de variable de entorno).
- Precedencia de fusión para ids de proveedor coincidentes:
  - Los valores `baseUrl` no vacíos de `models.json` del agente prevalecen.
  - Los valores `apiKey` no vacíos del agente prevalecen solo cuando ese proveedor no está gestionado por SecretRef en el contexto actual de configuración/perfil de autenticación.
  - Los valores `apiKey` de proveedores gestionados por SecretRef se actualizan desde marcadores de origen (`ENV_VAR_NAME` para referencias de entorno, `secretref-managed` para referencias de archivo/exec) en lugar de conservar secretos resueltos.
  - Los valores de encabezado de proveedores gestionados por SecretRef se actualizan desde marcadores de origen (`secretref-env:ENV_VAR_NAME` para referencias de entorno, `secretref-managed` para referencias de archivo/exec).
  - Los `apiKey`/`baseUrl` del agente vacíos o ausentes recurren a `models.providers` en la configuración.
  - Los `contextWindow`/`maxTokens` de modelos coincidentes usan el valor más alto entre la configuración explícita y los valores implícitos del catálogo.
  - Los `contextTokens` de modelos coincidentes conservan un límite explícito de tiempo de ejecución cuando está presente; úsalo para limitar el contexto efectivo sin cambiar los metadatos nativos del modelo.
  - Usa `models.mode: "replace"` cuando quieras que la configuración reescriba por completo `models.json`.
  - La persistencia de marcadores es autoritativa desde el origen: los marcadores se escriben desde la instantánea activa de configuración de origen (antes de la resolución), no desde valores secretos resueltos en tiempo de ejecución.

### Detalles de los campos del proveedor

- `models.mode`: comportamiento del catálogo del proveedor (`merge` o `replace`).
- `models.providers`: mapa de proveedores personalizados indexado por id de proveedor.
  - Ediciones seguras: usa `openclaw config set models.providers.<id> '<json>' --strict-json --merge` o `openclaw config set models.providers.<id>.models '<json-array>' --strict-json --merge` para actualizaciones aditivas. `config set` rechaza reemplazos destructivos a menos que pases `--replace`.
- `models.providers.*.api`: adaptador de solicitudes (`openai-completions`, `openai-responses`, `anthropic-messages`, `google-generative-ai`, etc.).
- `models.providers.*.apiKey`: credencial del proveedor (prefiere sustitución SecretRef/entorno).
- `models.providers.*.auth`: estrategia de autenticación (`api-key`, `token`, `oauth`, `aws-sdk`).
- `models.providers.*.injectNumCtxForOpenAICompat`: para Ollama + `openai-completions`, inyecta `options.num_ctx` en las solicitudes (predeterminado: `true`).
- `models.providers.*.authHeader`: fuerza el transporte de credenciales en el encabezado `Authorization` cuando se requiere.
- `models.providers.*.baseUrl`: URL base de la API upstream.
- `models.providers.*.headers`: encabezados estáticos adicionales para enrutamiento de proxy/inquilino.
- `models.providers.*.request`: anulaciones de transporte para solicitudes HTTP del proveedor de modelos.
  - `request.headers`: encabezados adicionales (fusionados con los valores predeterminados del proveedor). Los valores aceptan SecretRef.
  - `request.auth`: anulación de estrategia de autenticación. Modos: `"provider-default"` (usar la autenticación integrada del proveedor), `"authorization-bearer"` (con `token`), `"header"` (con `headerName`, `value`, `prefix` opcional).
  - `request.proxy`: anulación de proxy HTTP. Modos: `"env-proxy"` (usar variables de entorno `HTTP_PROXY`/`HTTPS_PROXY`), `"explicit-proxy"` (con `url`). Ambos modos aceptan un subobjeto `tls` opcional.
  - `request.tls`: anulación de TLS para conexiones directas. Campos: `ca`, `cert`, `key`, `passphrase` (todos aceptan SecretRef), `serverName`, `insecureSkipVerify`.
  - `request.allowPrivateNetwork`: cuando es `true`, permite HTTPS a `baseUrl` cuando el DNS se resuelve a rangos privados, CGNAT o similares, mediante la protección de obtención HTTP del proveedor (opt-in del operador para endpoints autoalojados de confianza compatibles con OpenAI). WebSocket usa la misma `request` para encabezados/TLS, pero no esa barrera SSRF de fetch. Predeterminado `false`.
- `models.providers.*.models`: entradas explícitas del catálogo de modelos del proveedor.
- `models.providers.*.models.*.contextWindow`: metadatos nativos de la ventana de contexto del modelo.
- `models.providers.*.models.*.contextTokens`: límite opcional de contexto en tiempo de ejecución. Úsalo cuando quieras un presupuesto efectivo de contexto más pequeño que el `contextWindow` nativo del modelo.
- `models.providers.*.models.*.compat.supportsDeveloperRole`: sugerencia opcional de compatibilidad. Para `api: "openai-completions"` con un `baseUrl` no vacío y no nativo (host distinto de `api.openai.com`), OpenClaw fuerza esto a `false` en tiempo de ejecución. `baseUrl` vacío/omitido mantiene el comportamiento predeterminado de OpenAI.
- `models.providers.*.models.*.compat.requiresStringContent`: sugerencia opcional de compatibilidad para endpoints de chat compatibles con OpenAI que solo aceptan cadenas. Cuando es `true`, OpenClaw aplana los arreglos `messages[].content` de texto puro en cadenas simples antes de enviar la solicitud.
- `plugins.entries.amazon-bedrock.config.discovery`: raíz de configuración del descubrimiento automático de Bedrock.
- `plugins.entries.amazon-bedrock.config.discovery.enabled`: activa/desactiva el descubrimiento implícito.
- `plugins.entries.amazon-bedrock.config.discovery.region`: región de AWS para el descubrimiento.
- `plugins.entries.amazon-bedrock.config.discovery.providerFilter`: filtro opcional de id de proveedor para descubrimiento dirigido.
- `plugins.entries.amazon-bedrock.config.discovery.refreshInterval`: intervalo de sondeo para la actualización del descubrimiento.
- `plugins.entries.amazon-bedrock.config.discovery.defaultContextWindow`: ventana de contexto alternativa para modelos descubiertos.
- `plugins.entries.amazon-bedrock.config.discovery.defaultMaxTokens`: máximo alternativo de tokens de salida para modelos descubiertos.

### Ejemplos de proveedores

<Accordion title="Cerebras (GLM 4.6 / 4.7)">

```json5
{
  env: { CEREBRAS_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: {
        primary: "cerebras/zai-glm-4.7",
        fallbacks: ["cerebras/zai-glm-4.6"],
      },
      models: {
        "cerebras/zai-glm-4.7": { alias: "GLM 4.7 (Cerebras)" },
        "cerebras/zai-glm-4.6": { alias: "GLM 4.6 (Cerebras)" },
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
          { id: "zai-glm-4.6", name: "GLM 4.6 (Cerebras)" },
        ],
      },
    },
  },
}
```

Usa `cerebras/zai-glm-4.7` para Cerebras; `zai/glm-4.7` para Z.AI directo.

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

Establece `OPENCODE_API_KEY` (o `OPENCODE_ZEN_API_KEY`). Usa referencias `opencode/...` para el catálogo Zen o referencias `opencode-go/...` para el catálogo Go. Acceso directo: `openclaw onboard --auth-choice opencode-zen` o `openclaw onboard --auth-choice opencode-go`.

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

Establece `ZAI_API_KEY`. `z.ai/*` y `z-ai/*` se aceptan como alias. Acceso directo: `openclaw onboard --auth-choice zai-api-key`.

- Endpoint general: `https://api.z.ai/api/paas/v4`
- Endpoint de programación (predeterminado): `https://api.z.ai/api/coding/paas/v4`
- Para el endpoint general, define un proveedor personalizado con la anulación de base URL.

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

Para el endpoint de China: `baseUrl: "https://api.moonshot.cn/v1"` o `openclaw onboard --auth-choice moonshot-api-key-cn`.

Los endpoints nativos de Moonshot anuncian compatibilidad de uso de streaming en el transporte compartido
`openai-completions`, y OpenClaw basa eso en las capacidades del endpoint
en lugar de hacerlo únicamente en el id integrado del proveedor.

</Accordion>

<Accordion title="Kimi Coding">

```json5
{
  env: { KIMI_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "kimi/kimi-code" },
      models: { "kimi/kimi-code": { alias: "Kimi Code" } },
    },
  },
}
```

Compatible con Anthropic, proveedor integrado. Acceso directo: `openclaw onboard --auth-choice kimi-code-api-key`.

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

La URL base debe omitir `/v1` (el cliente Anthropic la agrega). Acceso directo: `openclaw onboard --auth-choice synthetic-api-key`.

</Accordion>

<Accordion title="MiniMax M2.7 (directo)">

```json5
{
  agents: {
    defaults: {
      model: { primary: "minimax/MiniMax-M2.7" },
      models: {
        "minimax/MiniMax-M2.7": { alias: "Minimax" },
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
            id: "MiniMax-M2.7",
            name: "MiniMax M2.7",
            reasoning: true,
            input: ["text", "image"],
            cost: { input: 0.3, output: 1.2, cacheRead: 0.06, cacheWrite: 0.375 },
            contextWindow: 204800,
            maxTokens: 131072,
          },
        ],
      },
    },
  },
}
```

Establece `MINIMAX_API_KEY`. Accesos directos:
`openclaw onboard --auth-choice minimax-global-api` o
`openclaw onboard --auth-choice minimax-cn-api`.
El catálogo de modelos usa de forma predeterminada solo M2.7.
En la ruta de streaming compatible con Anthropic, OpenClaw desactiva el razonamiento de MiniMax
de forma predeterminada a menos que establezcas `thinking` explícitamente. `/fast on` o
`params.fastMode: true` reescribe `MiniMax-M2.7` a
`MiniMax-M2.7-highspeed`.

</Accordion>

<Accordion title="Modelos locales (LM Studio)">

Consulta [Modelos locales](/es/gateway/local-models). En resumen: ejecuta un modelo local grande mediante la API Responses de LM Studio en hardware serio; mantén fusionados los modelos alojados como fallback.

</Accordion>

---

## Relacionado

- [Referencia de configuración](/es/gateway/configuration-reference) — otras claves de nivel superior
- [Configuración — agentes](/es/gateway/config-agents)
- [Configuración — canales](/es/gateway/config-channels)
- [Herramientas y Plugins](/es/tools)
