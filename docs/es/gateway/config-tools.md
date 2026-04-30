---
read_when:
    - Configurar la política de `tools.*`, las listas de permitidos o las funciones experimentales
    - Registrar proveedores personalizados o sobrescribir las URL base
    - Configuración de puntos de conexión autohospedados compatibles con OpenAI
sidebarTitle: Tools and custom providers
summary: Configuración de herramientas (política, controles experimentales, herramientas respaldadas por proveedor) y configuración personalizada de proveedor/URL base
title: Configuración — herramientas y proveedores personalizados
x-i18n:
    generated_at: "2026-04-30T05:40:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1790c92ecaf822c837326d8e22e9d72cc44e5d4cc0bcc00c154ba5160975002a
    source_path: gateway/config-tools.md
    workflow: 16
---

`tools.*` claves de configuración y configuración de proveedor personalizado / URL base. Para agentes, canales y otras claves de configuración de nivel superior, consulta la [Referencia de configuración](/es/gateway/configuration-reference).

## Herramientas

### Perfiles de herramientas

`tools.profile` establece una lista de permitidos base antes de `tools.allow`/`tools.deny`:

<Note>
La incorporación local define de forma predeterminada las nuevas configuraciones locales en `tools.profile: "coding"` cuando no está definido (se conservan los perfiles explícitos existentes).
</Note>

| Perfil      | Incluye                                                                                                                       |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `minimal`   | solo `session_status`                                                                                                         |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                    |
| `full`      | Sin restricción (igual que sin definir)                                                                                       |

### Grupos de herramientas

| Grupo              | Herramientas                                                                                                             |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| `group:runtime`    | `exec`, `process`, `code_execution` (`bash` se acepta como alias de `exec`)                                               |
| `group:fs`         | `read`, `write`, `edit`, `apply_patch`                                                                                   |
| `group:sessions`   | `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `sessions_yield`, `subagents`, `session_status` |
| `group:memory`     | `memory_search`, `memory_get`                                                                                            |
| `group:web`        | `web_search`, `x_search`, `web_fetch`                                                                                    |
| `group:ui`         | `browser`, `canvas`                                                                                                      |
| `group:automation` | `cron`, `gateway`                                                                                                        |
| `group:messaging`  | `message`                                                                                                                |
| `group:nodes`      | `nodes`                                                                                                                  |
| `group:agents`     | `agents_list`                                                                                                            |
| `group:media`      | `image`, `image_generate`, `video_generate`, `tts`                                                                       |
| `group:openclaw`   | Todas las herramientas integradas (excluye los plugins de proveedor)                                                     |

### `tools.allow` / `tools.deny`

Política global de permitir/denegar herramientas (denegar tiene prioridad). No distingue mayúsculas y minúsculas, admite comodines `*`. Se aplica incluso cuando el sandbox de Docker está desactivado.

```json5
{
  tools: { deny: ["browser", "canvas"] },
}
```

### `tools.byProvider`

Restringe aún más las herramientas para proveedores o modelos específicos. Orden: perfil base → perfil de proveedor → permitir/denegar.

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

Controla el acceso elevado a exec fuera del sandbox:

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

- La sobrescritura por agente (`agents.list[].tools.elevated`) solo puede restringir más.
- `/elevated on|off|ask|full` guarda el estado por sesión; las directivas en línea se aplican a un solo mensaje.
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

Las comprobaciones de seguridad de bucles de herramientas están **desactivadas de forma predeterminada**. Define `enabled: true` para activar la detección. Los ajustes se pueden definir globalmente en `tools.loopDetection` y sobrescribir por agente en `agents.list[].tools.loopDetection`.

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

<ParamField path="historySize" type="number">
  Historial máximo de llamadas a herramientas conservado para el análisis de bucles.
</ParamField>
<ParamField path="warningThreshold" type="number">
  Umbral de patrón repetido sin progreso para advertencias.
</ParamField>
<ParamField path="criticalThreshold" type="number">
  Umbral repetido más alto para bloquear bucles críticos.
</ParamField>
<ParamField path="globalCircuitBreakerThreshold" type="number">
  Umbral de parada forzada para cualquier ejecución sin progreso.
</ParamField>
<ParamField path="detectors.genericRepeat" type="boolean">
  Advierte sobre llamadas repetidas con la misma herramienta y los mismos argumentos.
</ParamField>
<ParamField path="detectors.knownPollNoProgress" type="boolean">
  Advierte/bloquea en herramientas de sondeo conocidas (`process.poll`, `command_status`, etc.).
</ParamField>
<ParamField path="detectors.pingPong" type="boolean">
  Advierte/bloquea en patrones alternos de pares sin progreso.
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

Configura la comprensión de medios entrantes (imagen/audio/video):

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

<AccordionGroup>
  <Accordion title="Media model entry fields">
    **Entrada de proveedor** (`type: "provider"` u omitido):

    - `provider`: id del proveedor de API (`openai`, `anthropic`, `google`/`gemini`, `groq`, etc.)
    - `model`: anulación del id del modelo
    - `profile` / `preferredProfile`: selección de perfil de `auth-profiles.json`

    **Entrada de CLI** (`type: "cli"`):

    - `command`: ejecutable que se va a ejecutar
    - `args`: argumentos con plantilla (admite `{{MediaPath}}`, `{{Prompt}}`, `{{MaxChars}}`, etc.; `openclaw doctor --fix` migra los marcadores de posición obsoletos `{input}` a `{{MediaPath}}`)

    **Campos comunes:**

    - `capabilities`: lista opcional (`image`, `audio`, `video`). Valores predeterminados: `openai`/`anthropic`/`minimax` → imagen, `google` → imagen+audio+video, `groq` → audio.
    - `prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`: anulaciones por entrada.
    - `tools.media.image.timeoutSeconds` y las entradas de `timeoutSeconds` del modelo de imagen correspondiente también se aplican cuando el agente llama a la herramienta explícita `image`.
    - Los fallos recurren a la siguiente entrada.

    La autenticación de proveedor sigue el orden estándar: `auth-profiles.json` → variables de entorno → `models.providers.*.apiKey`.

    **Campos de finalización asíncrona:**

    - `asyncCompletion.directSend`: cuando es `true`, las tareas asíncronas completadas de `music_generate` y `video_generate` intentan primero la entrega directa al canal. Valor predeterminado: `false` (ruta heredada de activación de la sesión solicitante/entrega mediante modelo).

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

Valor predeterminado: `tree` (sesión actual + sesiones generadas por ella, como subagentes).

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
    - `agent`: cualquier sesión que pertenezca al id del agente actual (puede incluir otros usuarios si ejecutas sesiones por remitente con el mismo id de agente).
    - `all`: cualquier sesión. Dirigirse entre agentes sigue requiriendo `tools.agentToAgent`.
    - Límite de sandbox: cuando la sesión actual está en sandbox y `agents.defaults.sandbox.sessionToolsVisibility="spawned"`, la visibilidad se fuerza a `tree` aunque `tools.sessions.visibility="all"`.

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
    - Los adjuntos solo son compatibles con `runtime: "subagent"`. El runtime ACP los rechaza.
    - Los archivos se materializan en el espacio de trabajo hijo en `.openclaw/attachments/<uuid>/` con un `.manifest.json`.
    - El contenido de los adjuntos se redacta automáticamente de la persistencia de transcripciones.
    - Las entradas Base64 se validan con comprobaciones estrictas de alfabeto/relleno y una protección de tamaño previa a la decodificación.
    - Los permisos de archivo son `0700` para directorios y `0600` para archivos.
    - La limpieza sigue la política `cleanup`: `delete` siempre elimina los adjuntos; `keep` los conserva solo cuando `retainOnSessionKeep: true`.

  </Accordion>
</AccordionGroup>

<a id="toolsexperimental"></a>

### `tools.experimental`

Indicadores experimentales de herramientas integradas. Desactivados de forma predeterminada salvo que se aplique una regla de activación automática de GPT-5 estrictamente agéntica.

```json5
{
  tools: {
    experimental: {
      planTool: true, // enable experimental update_plan
    },
  },
}
```

- `planTool`: habilita la herramienta estructurada `update_plan` para el seguimiento de trabajo de varios pasos no trivial.
- Valor predeterminado: `false` a menos que `agents.defaults.embeddedPi.executionContract` (o una anulación por agente) esté establecido en `"strict-agentic"` para una ejecución de la familia GPT-5 de OpenAI u OpenAI Codex. Establécelo en `true` para forzar la activación de la herramienta fuera de ese alcance, o en `false` para mantenerla desactivada incluso en ejecuciones GPT-5 strict-agentic.
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
        archiveAfterMinutes: 60,
      },
    },
  },
}
```

- `model`: modelo predeterminado para los subagentes generados. Si se omite, los subagentes heredan el modelo del invocador.
- `allowAgents`: lista de permitidos predeterminada de ids de agentes destino para `sessions_spawn` cuando el agente solicitante no establece su propio `subagents.allowAgents` (`["*"]` = cualquiera; valor predeterminado: solo el mismo agente).
- `runTimeoutSeconds`: tiempo de espera predeterminado (segundos) para `sessions_spawn` cuando la llamada a la herramienta omite `runTimeoutSeconds`. `0` significa sin tiempo de espera.
- Política de herramientas por subagente: `tools.subagents.tools.allow` / `tools.subagents.tools.deny`.

---

## Proveedores personalizados y URLs base

OpenClaw usa el catálogo de modelos integrado. Agrega proveedores personalizados mediante `models.providers` en la configuración o `~/.openclaw/agents/<agentId>/agent/models.json`.

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

<AccordionGroup>
  <Accordion title="Autenticación y precedencia de fusión">
    - Usa `authHeader: true` + `headers` para necesidades de autenticación personalizada.
    - Anula la raíz de configuración del agente con `OPENCLAW_AGENT_DIR` (o `PI_CODING_AGENT_DIR`, un alias heredado de variable de entorno).
    - Precedencia de fusión para IDs de proveedor coincidentes:
      - Los valores no vacíos de `baseUrl` en `models.json` del agente tienen prioridad.
      - Los valores no vacíos de `apiKey` del agente tienen prioridad solo cuando ese proveedor no está gestionado por SecretRef en el contexto actual de configuración/perfil de autenticación.
      - Los valores de `apiKey` de proveedores gestionados por SecretRef se actualizan desde marcadores de origen (`ENV_VAR_NAME` para refs de entorno, `secretref-managed` para refs de archivo/exec) en lugar de persistir secretos resueltos.
      - Los valores de encabezado de proveedores gestionados por SecretRef se actualizan desde marcadores de origen (`secretref-env:ENV_VAR_NAME` para refs de entorno, `secretref-managed` para refs de archivo/exec).
      - Los valores vacíos o ausentes de `apiKey`/`baseUrl` del agente recurren a `models.providers` en la configuración.
      - Los `contextWindow`/`maxTokens` de modelos coincidentes usan el valor más alto entre la configuración explícita y los valores implícitos del catálogo.
      - `contextTokens` de modelos coincidentes conserva un límite explícito en tiempo de ejecución cuando está presente; úsalo para limitar el contexto efectivo sin cambiar los metadatos nativos del modelo.
      - Usa `models.mode: "replace"` cuando quieras que la configuración reescriba por completo `models.json`.
      - La persistencia de marcadores es autoritativa según el origen: los marcadores se escriben desde la instantánea activa de configuración de origen (antes de la resolución), no desde valores de secretos resueltos en tiempo de ejecución.

  </Accordion>
</AccordionGroup>

### Detalles de campos del proveedor

<AccordionGroup>
  <Accordion title="Catálogo de nivel superior">
    - `models.mode`: comportamiento del catálogo de proveedores (`merge` o `replace`).
    - `models.providers`: mapa de proveedores personalizados indexado por id de proveedor.
      - Ediciones seguras: usa `openclaw config set models.providers.<id> '<json>' --strict-json --merge` o `openclaw config set models.providers.<id>.models '<json-array>' --strict-json --merge` para actualizaciones aditivas. `config set` rechaza reemplazos destructivos a menos que pases `--replace`.

  </Accordion>
  <Accordion title="Conexión y autenticación del proveedor">
    - `models.providers.*.api`: adaptador de solicitud (`openai-completions`, `openai-responses`, `anthropic-messages`, `google-generative-ai`, etc.). Para backends autoalojados de `/v1/chat/completions` como MLX, vLLM, SGLang y la mayoría de servidores locales compatibles con OpenAI, usa `openai-completions`. Un proveedor personalizado con `baseUrl` pero sin `api` usa `openai-completions` de forma predeterminada; establece `openai-responses` solo cuando el backend admite `/v1/responses`.
    - `models.providers.*.apiKey`: credencial del proveedor (prefiere sustitución SecretRef/env).
    - `models.providers.*.auth`: estrategia de autenticación (`api-key`, `token`, `oauth`, `aws-sdk`).
    - `models.providers.*.contextWindow`: ventana de contexto nativa predeterminada para modelos bajo este proveedor cuando la entrada del modelo no establece `contextWindow`.
    - `models.providers.*.contextTokens`: límite de contexto efectivo en tiempo de ejecución predeterminado para modelos bajo este proveedor cuando la entrada del modelo no establece `contextTokens`.
    - `models.providers.*.maxTokens`: límite predeterminado de tokens de salida para modelos bajo este proveedor cuando la entrada del modelo no establece `maxTokens`.
    - `models.providers.*.timeoutSeconds`: tiempo de espera opcional por proveedor para solicitudes HTTP de modelo en segundos, incluido el manejo de conexión, encabezados, cuerpo y cancelación total de la solicitud.
    - `models.providers.*.injectNumCtxForOpenAICompat`: para Ollama + `openai-completions`, inyecta `options.num_ctx` en las solicitudes (valor predeterminado: `true`).
    - `models.providers.*.authHeader`: fuerza el transporte de credenciales en el encabezado `Authorization` cuando sea necesario.
    - `models.providers.*.baseUrl`: URL base de la API ascendente.
    - `models.providers.*.headers`: encabezados estáticos adicionales para enrutamiento de proxy/inquilino.

  </Accordion>
  <Accordion title="Anulaciones de transporte de solicitudes">
    `models.providers.*.request`: anulaciones de transporte para solicitudes HTTP de proveedor de modelos.

    - `request.headers`: encabezados adicionales (fusionados con los valores predeterminados del proveedor). Los valores aceptan SecretRef.
    - `request.auth`: anulación de estrategia de autenticación. Modos: `"provider-default"` (usa la autenticación integrada del proveedor), `"authorization-bearer"` (con `token`), `"header"` (con `headerName`, `value`, `prefix` opcional).
    - `request.proxy`: anulación de proxy HTTP. Modos: `"env-proxy"` (usa las variables de entorno `HTTP_PROXY`/`HTTPS_PROXY`), `"explicit-proxy"` (con `url`). Ambos modos aceptan un subobjeto `tls` opcional.
    - `request.tls`: anulación de TLS para conexiones directas. Campos: `ca`, `cert`, `key`, `passphrase` (todos aceptan SecretRef), `serverName`, `insecureSkipVerify`.
    - `request.allowPrivateNetwork`: cuando es `true`, permite HTTPS a `baseUrl` cuando DNS resuelve a rangos privados, CGNAT o similares, mediante la protección de fetch HTTP del proveedor (activación explícita del operador para endpoints autoalojados compatibles con OpenAI de confianza). Las URLs de flujo de proveedor de modelos de loopback como `localhost`, `127.0.0.1` y `[::1]` se permiten automáticamente a menos que esto se establezca explícitamente en `false`; los hosts LAN, tailnet y DNS privados siguen requiriendo activación explícita. WebSocket usa el mismo `request` para encabezados/TLS, pero no esa barrera SSRF de fetch. Valor predeterminado `false`.

  </Accordion>
  <Accordion title="Entradas del catálogo de modelos">
    - `models.providers.*.models`: entradas explícitas del catálogo de modelos del proveedor.
    - `models.providers.*.models.*.input`: modalidades de entrada del modelo. Usa `["text"]` para modelos solo de texto y `["text", "image"]` para modelos nativos de imagen/visión. Los adjuntos de imagen solo se inyectan en turnos de agente cuando el modelo seleccionado está marcado como compatible con imágenes.
    - `models.providers.*.models.*.contextWindow`: metadatos de la ventana de contexto nativa del modelo. Esto anula `contextWindow` a nivel de proveedor para ese modelo.
    - `models.providers.*.models.*.contextTokens`: límite de contexto opcional en tiempo de ejecución. Esto anula `contextTokens` a nivel de proveedor; úsalo cuando quieras un presupuesto de contexto efectivo menor que el `contextWindow` nativo del modelo; `openclaw models list` muestra ambos valores cuando difieren.
    - `models.providers.*.models.*.compat.supportsDeveloperRole`: sugerencia de compatibilidad opcional. Para `api: "openai-completions"` con un `baseUrl` no nativo no vacío (host distinto de `api.openai.com`), OpenClaw fuerza esto a `false` en tiempo de ejecución. `baseUrl` vacío/omitido mantiene el comportamiento predeterminado de OpenAI.
    - `models.providers.*.models.*.compat.requiresStringContent`: sugerencia de compatibilidad opcional para puntos de conexión de chat compatibles con OpenAI que solo admiten cadenas. Cuando es `true`, OpenClaw aplana los arrays de solo texto de `messages[].content` en cadenas simples antes de enviar la solicitud.

  </Accordion>
  <Accordion title="Descubrimiento de Amazon Bedrock">
    - `plugins.entries.amazon-bedrock.config.discovery`: raíz de configuración del descubrimiento automático de Bedrock.
    - `plugins.entries.amazon-bedrock.config.discovery.enabled`: activa/desactiva el descubrimiento implícito.
    - `plugins.entries.amazon-bedrock.config.discovery.region`: región de AWS para el descubrimiento.
    - `plugins.entries.amazon-bedrock.config.discovery.providerFilter`: filtro opcional de id de proveedor para descubrimiento dirigido.
    - `plugins.entries.amazon-bedrock.config.discovery.refreshInterval`: intervalo de sondeo para la actualización del descubrimiento.
    - `plugins.entries.amazon-bedrock.config.discovery.defaultContextWindow`: ventana de contexto de reserva para modelos descubiertos.
    - `plugins.entries.amazon-bedrock.config.discovery.defaultMaxTokens`: tokens máximos de salida de reserva para modelos descubiertos.

  </Accordion>
</AccordionGroup>

La incorporación interactiva de proveedores personalizados infiere entrada de imagen para IDs de modelos de visión comunes como GPT-4o, Claude, Gemini, Qwen-VL, LLaVA, Pixtral, InternVL, Mllama, MiniCPM-V y GLM-4V, y omite la pregunta adicional para familias conocidas solo de texto. Los IDs de modelos desconocidos siguen solicitando la compatibilidad con imágenes. La incorporación no interactiva usa la misma inferencia; pasa `--custom-image-input` para forzar metadatos compatibles con imágenes o `--custom-text-input` para forzar metadatos solo de texto.

### Ejemplos de proveedores

<AccordionGroup>
  <Accordion title="Cerebras (GLM 4.7 / GPT OSS)">
    El plugin de proveedor `cerebras` incluido puede configurar esto mediante `openclaw onboard --auth-choice cerebras-api-key`. Usa configuración explícita de proveedor solo al anular valores predeterminados.

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
          model: { primary: "kimi/kimi-code" },
          models: { "kimi/kimi-code": { alias: "Kimi Code" } },
        },
      },
    }
    ```

    Proveedor integrado compatible con Anthropic. Atajo: `openclaw onboard --auth-choice kimi-code-api-key`.

  </Accordion>
  <Accordion title="Modelos locales (LM Studio)">
    Consulta [Modelos locales](/es/gateway/local-models). En resumen: ejecuta un modelo local grande mediante la Responses API de LM Studio en hardware serio; mantén modelos alojados combinados como alternativa.
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
                input: ["text"],
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

    Configura `MINIMAX_API_KEY`. Atajos: `openclaw onboard --auth-choice minimax-global-api` o `openclaw onboard --auth-choice minimax-cn-api`. El catálogo de modelos usa M2.7 de forma predeterminada únicamente. En la ruta de streaming compatible con Anthropic, OpenClaw desactiva el razonamiento de MiniMax de forma predeterminada a menos que configures `thinking` explícitamente. `/fast on` o `params.fastMode: true` reescribe `MiniMax-M2.7` como `MiniMax-M2.7-highspeed`.

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

    Los endpoints nativos de Moonshot anuncian compatibilidad de uso en streaming en el transporte compartido `openai-completions`, y OpenClaw la determina según las capacidades del endpoint en lugar de solo por el id de proveedor incorporado.

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

    Configura `OPENCODE_API_KEY` (o `OPENCODE_ZEN_API_KEY`). Usa referencias `opencode/...` para el catálogo Zen o referencias `opencode-go/...` para el catálogo Go. Atajo: `openclaw onboard --auth-choice opencode-zen` u `openclaw onboard --auth-choice opencode-go`.

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

    La URL base debe omitir `/v1` (el cliente de Anthropic la añade). Atajo: `openclaw onboard --auth-choice synthetic-api-key`.

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

    Configura `ZAI_API_KEY`. `z.ai/*` y `z-ai/*` se aceptan como alias. Atajo: `openclaw onboard --auth-choice zai-api-key`.

    - Endpoint general: `https://api.z.ai/api/paas/v4`
    - Endpoint de codificación (predeterminado): `https://api.z.ai/api/coding/paas/v4`
    - Para el endpoint general, define un proveedor personalizado con la sobrescritura de URL base.

  </Accordion>
</AccordionGroup>

---

## Relacionado

- [Configuración — agentes](/es/gateway/config-agents)
- [Configuración — canales](/es/gateway/config-channels)
- [Referencia de configuración](/es/gateway/configuration-reference) — otras claves de nivel superior
- [Herramientas y plugins](/es/tools)
