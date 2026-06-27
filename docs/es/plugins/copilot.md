---
read_when:
    - Quieres usar el arnés del SDK de GitHub Copilot para un agente
    - Necesitas ejemplos de configuración para el entorno de ejecución `copilot`
    - Estás conectando un agente a Copilot de suscripción (github / openclaw / copilot) y quieres que se ejecute a través de la CLI de Copilot
summary: Ejecuta turnos de agente integrado de OpenClaw mediante el arnés externo del SDK de GitHub Copilot
title: Arnés del SDK de Copilot
x-i18n:
    generated_at: "2026-06-27T12:11:36Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e1a052cc21130b680f6af9ae32bc1dbaeaa15be5092939f0c236515a3233ab9b
    source_path: plugins/copilot.md
    workflow: 16
---

El plugin externo `@openclaw/copilot` permite que OpenClaw ejecute turnos de agente
Copilot de suscripción incrustados mediante la CLI de GitHub Copilot (`@github/copilot-sdk`)
en lugar del arnés PI integrado.

Usa el arnés del SDK de Copilot cuando quieras que la sesión de la CLI de Copilot controle el
bucle de agente de bajo nivel: ejecución nativa de herramientas, compaction nativa
(`infiniteSessions`) y estado de hilo gestionado por la CLI bajo `copilotHome`.
OpenClaw sigue controlando los canales de chat, los archivos de sesión, la selección de modelo, las
herramientas dinámicas de OpenClaw (puenteadas), las aprobaciones, la entrega de medios, el reflejo
visible de la transcripción, las preguntas secundarias `/btw` (gestionadas por el fallback PI del árbol; consulta
[Preguntas secundarias (`/btw`)](#side-questions-btw)) y `openclaw doctor`.

Para la división más amplia entre modelo/proveedor/runtime, empieza con
[Runtimes de agente](/es/concepts/agent-runtimes).

## Requisitos

- OpenClaw con el plugin `@openclaw/copilot` instalado.
- Si tu configuración usa `plugins.allow`, incluye `copilot` (el id de manifiesto
  declarado por el plugin). Una allowlist restrictiva que use el nombre de paquete
  estilo npm `@openclaw/copilot` dejará el plugin bloqueado y el runtime no se cargará
  incluso con `agentRuntime.id: "copilot"`.
- Una suscripción de GitHub Copilot que pueda controlar la CLI de Copilot (o una
  entrada de entorno / perfil de autenticación `gitHubToken` para ejecuciones headless / cron).
- Un directorio `copilotHome` con permisos de escritura. El arnés usa por defecto
  `<agentDir>/copilot` cuando OpenClaw proporciona un directorio de agente; de lo contrario,
  `~/.openclaw/agents/<agentId>/copilot` para aislamiento completo por agente.

`openclaw doctor` ejecuta el
[contrato doctor](#doctor) del plugin para la propiedad declarativa del estado de sesión y futuras
migraciones de compatibilidad. No ejecuta comprobaciones de entorno de la CLI de Copilot.

## Instalación del Plugin

El runtime de Copilot es un plugin externo, por lo que el paquete principal `openclaw` no
incluye la dependencia `@github/copilot-sdk` ni su binario de CLI específico de plataforma
`@github/copilot-<platform>-<arch>`. Juntos añaden aproximadamente
260 MB, así que instálalos solo para agentes que opten por este runtime:

```bash
openclaw plugins install @openclaw/copilot
```

El asistente instala el plugin la primera vez que seleccionas un modelo
`github-copilot/*` **y** tu configuración opta el modelo (o su
proveedor) por el runtime de agente de Copilot mediante
`agentRuntime: { id: "copilot" }` (consulta [Inicio rápido](#quickstart) abajo).
Sin la opción explícita, openclaw usa su proveedor de GitHub Copilot integrado
y nunca instala el plugin de runtime.

El runtime resuelve el SDK en este orden:

1. `import("@github/copilot-sdk")` desde el paquete `@openclaw/copilot`
   instalado.
2. El directorio fallback conocido `~/.openclaw/npm-runtime/copilot/` (el
   destino de instalación bajo demanda heredado).

Un SDK ausente muestra un único error con código `COPILOT_SDK_MISSING`
y el comando de reinstalación del plugin anterior.

## Inicio rápido

Fija un modelo (o un proveedor) al arnés:

```json5
{
  agents: {
    defaults: {
      model: "github-copilot/auto",
      models: {
        "github-copilot/auto": {
          agentRuntime: { id: "copilot" },
        },
      },
    },
  },
}
```

Ambas rutas son equivalentes. Usa `agentRuntime.id` en una sola entrada de modelo
cuando solo ese modelo deba enrutarse a través del arnés; configura
`agentRuntime.id` en un proveedor cuando todos los modelos bajo ese proveedor deban
usarlo.

`github-copilot/auto` es el punto de partida portable. Los modelos de Copilot con nombre
dependen de la cuenta y de la política de la organización, así que fija uno solo después de confirmar
que la CLI de Copilot autenticada lo expone.

## Proveedores compatibles

El arnés anuncia compatibilidad con el proveedor canónico `github-copilot`
(el mismo id propiedad de `extensions/github-copilot`):

- `github-copilot`

También admite entradas personalizadas de `models.providers` cuando el modelo seleccionado tiene
un `baseUrl` no vacío y una de estas formas de API:

- `openai-responses`
- `openai-completions`
- `ollama` (completions compatibles con OpenAI)
- `azure-openai-responses`
- `anthropic-messages`

Los ids de proveedor nativos como `openai`, `anthropic`, `google` y `ollama` siguen siendo
propiedad de sus runtimes nativos. Usa un id de proveedor personalizado distinto al enrutar
un endpoint mediante BYOK de Copilot.

Los endpoints BYOK de Copilot deben ser URL HTTPS de red pública. El arnés entrega al
SDK de Copilot una URL de proxy local loopback por intento y luego reenvía el tráfico del proveedor
a través de la ruta fetch protegida de OpenClaw, de modo que la fijación de DNS y la política SSRF sigan
siendo propiedad de OpenClaw. Usa el runtime nativo de OpenClaw para Ollama local, LM Studio
o servidores de modelos LAN.

## BYOK

BYOK de Copilot usa el contrato de proveedor personalizado a nivel de sesión del SDK. OpenClaw
pasa el endpoint de modelo resuelto, la clave de API, el modo de token bearer, los encabezados, el id de modelo
y los límites de contexto/salida sin mover la lógica de transporte del proveedor al
core.

Por ejemplo:

```json5
{
  agents: {
    defaults: {
      model: "custom-proxy/llama-3.1-8b",
      models: {
        "custom-proxy/llama-3.1-8b": {
          agentRuntime: { id: "copilot" },
        },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      "custom-proxy": {
        baseUrl: "https://api.example.com/v1",
        apiKey: "${CUSTOM_PROXY_API_KEY}",
        api: "openai-responses",
        authHeader: true,
        models: [{ id: "llama-3.1-8b", name: "Llama 3.1 8B" }],
      },
    },
  },
}
```

Las sesiones BYOK se indexan por separado de las sesiones de suscripción y de otros
endpoints o huellas de credenciales. Rotar la clave, los encabezados, el modelo o el
endpoint crea una sesión nueva del SDK de Copilot en lugar de reanudar un estado incompatible.

## Autenticación

Precedencia por agente, aplicada durante `runCopilotAttempt`:

1. **`useLoggedInUser: true` explícito** en la entrada del intento. Usa el usuario con sesión iniciada de la CLI de Copilot
   resuelto bajo el `copilotHome` del agente.
2. **`gitHubToken` explícito** en la entrada del intento (con `profileId` +
   `profileVersion`). Útil para invocaciones directas de la CLI y pruebas donde el
   llamador quiere omitir la resolución de perfiles de autenticación.
3. **`resolvedApiKey` + `authProfileId` resueltos por contrato** desde la forma
   `EmbeddedRunAttemptParams`. Esta es la **ruta principal de producción**:
   el core resuelve el perfil de autenticación `github-copilot` configurado del agente
   (mediante `src/infra/provider-usage.auth.ts:resolveProviderAuths`) antes de
   invocar el arnés, y el arnés consume ambos campos directamente.
   Esto hace que un perfil de autenticación `github-copilot:<profile>` funcione de extremo a extremo
   para configuraciones headless / cron / multiperfil sin variables de entorno.
4. **Fallback de variable de entorno** para ejecuciones directas de CLI / dogfood donde no hay ningún perfil de autenticación
   configurado. El runtime comprueba las siguientes variables en
   orden de precedencia, reflejando el proveedor `github-copilot` enviado
   (`extensions/github-copilot/auth.ts`) y la configuración documentada del SDK de Copilot:
   1. `OPENCLAW_GITHUB_TOKEN` -- sobrescritura específica del arnés; configúrala
      para fijar un token para el arnés de OpenClaw sin alterar
      la configuración global de `gh` / la CLI de Copilot.
   2. `COPILOT_GITHUB_TOKEN` -- variable de entorno estándar del SDK / CLI de Copilot.
   3. `GH_TOKEN` -- variable de entorno estándar de la CLI `gh` (coincide con la precedencia existente
      del proveedor `github-copilot`).
   4. `GITHUB_TOKEN` -- fallback genérico de token de GitHub.

   El primer valor no vacío gana; las cadenas vacías se tratan como
   ausentes. El id de perfil de pool sintetizado es `env:<NAME>` y
   `profileVersion` es una huella sha256 no reversible del
   token, por lo que rotar el valor de entorno invalida limpiamente el pool de clientes.

5. **`useLoggedInUser` predeterminado** cuando no hay señal de token disponible.

Cada agente obtiene un `copilotHome` dedicado para que los tokens, sesiones y
configuración de la CLI de Copilot no se filtren entre agentes en la misma máquina. El valor predeterminado es
`<agentDir>/copilot` cuando el host entrega al arnés un directorio de agente
(aislando el estado del SDK de los `models.json` / `auth-profiles.json` de OpenClaw en
el mismo directorio), o `~/.openclaw/agents/<agentId>/copilot` en caso contrario.
Sobrescribe con `copilotHome: <path>` en la entrada del intento cuando necesites una
ubicación personalizada (por ejemplo, un montaje compartido para migración).

Las pruebas en vivo del arnés usan `OPENCLAW_COPILOT_AGENT_LIVE_TOKEN` cuando se necesita un token directo.
La configuración compartida de pruebas en vivo elimina intencionadamente
`COPILOT_GITHUB_TOKEN`, `GH_TOKEN` y `GITHUB_TOKEN` después de preparar perfiles de autenticación reales
en el home de prueba aislado, por lo que pasar un valor de `gh auth token`
mediante la variable dedicada de pruebas en vivo evita omisiones falsas sin exponer
el token a suites no relacionadas.

## Superficie de configuración

El arnés lee su configuración desde la entrada por intento
(`runCopilotAttempt({...})`) más un pequeño conjunto de valores predeterminados de entorno dentro de
`extensions/copilot/src/`:

- `copilotHome` — directorio de estado de la CLI por agente (valores predeterminados documentados arriba).
- `model` — cadena o `{ provider, id, api?, baseUrl?, headers?, authHeader? }`.
  Cuando se omite, OpenClaw usa la selección normal de modelo del agente y el
  arnés verifica que el proveedor resuelto sea compatible.
- `reasoningEffort` — `"low" | "medium" | "high" | "xhigh"`. Se asigna desde
  la resolución `ThinkLevel` / `ReasoningLevel` de OpenClaw en
  `auto-reply/thinking.ts`.
- `infiniteSessionConfig` — sobrescritura opcional para el bloque
  `infiniteSessions` del SDK controlado por `harness.compact`. Los valores predeterminados son seguros para
  dejarlos como están.
- `hooksConfig` — configuración de compatibilidad opcional nativa de `SessionHooks` del SDK de Copilot
  para callbacks de herramienta/MCP, prompt de usuario, sesión y error.
  Es independiente de los hooks de ciclo de vida portables de OpenClaw.
- `permissionPolicy` — sobrescritura opcional para el manejador
  `onPermissionRequest` del SDK usado para tipos de herramienta integrados del SDK
  (`shell`, `write`, `read`, `url`, `mcp`, `memory`, `hook`). De forma predeterminada
  usa `rejectAllPolicy` como red de seguridad; en la práctica, el SDK nunca
  invoca ninguno de esos tipos porque cada herramienta de OpenClaw puenteada está
  registrada con `overridesBuiltInTool: true` y
  `skipPermission: true`, de modo que el 100% de las llamadas de herramientas fluyen por el
  `execute()` envuelto de OpenClaw. Consulta [Permisos y ask_user](#permissions-and-ask_user).
- `enableSessionTelemetry` — indicador opcional de telemetría de sesión del SDK.

Los hooks de plugin de OpenClaw no necesitan configuración de intento específica de Copilot. El
arnés ejecuta `before_prompt_build` (y el hook de compatibilidad heredado `before_agent_start`),
`llm_input`, `llm_output` y `agent_end` mediante los
helpers estándar del arnés. Las compactions correctas del SDK también ejecutan
`before_compaction` y `after_compaction`. Las herramientas de OpenClaw puenteadas siguen
ejecutando `before_tool_call` e informan `after_tool_call`; `hooksConfig` permanece para
callbacks nativos solo del SDK que no tienen equivalente portable.

Nada en el resto de OpenClaw necesita conocer estos campos. Otros
plugins, canales y código del core solo ven la forma estándar
`AgentHarnessAttemptParams` / `AgentHarnessAttemptResult`.

## Compaction

Cuando se ejecuta `harness.compact`, el arnés del SDK de Copilot:

1. Reanuda la sesión del SDK rastreada sin continuar trabajo pendiente.
2. Llama al RPC de compaction de historial con ámbito de sesión del SDK.
3. Devuelve el resultado de compaction del SDK sin escribir archivos marcadores de compatibilidad
   bajo el workspace.

El reflejo de transcripción del lado de OpenClaw (consulta abajo) sigue recibiendo los
mensajes posteriores a la compaction, por lo que el historial de chat visible para el usuario se mantiene coherente.

## Reflejo de transcripción

`runCopilotAttempt` escribe dualmente los mensajes reflejables de cada turno en la
transcripción de auditoría de OpenClaw mediante
`extensions/copilot/src/dual-write-transcripts.ts`. El reflejo tiene ámbito
por sesión (`copilot:${sessionId}`) y usa una identidad por mensaje
(`${role}:${sha256_16(role,content)}`), de modo que las reemisiones de entradas
de turnos anteriores colisionan con las claves existentes en disco y no se duplican.

El reflejo está envuelto en dos capas de contención de fallos para que un fallo de escritura
de transcripción no pueda hacer fallar el intento: un contenedor interno best-effort y un
`.catch(...)` de defensa en profundidad a nivel de intento. Los fallos se registran pero
no se exponen.

## Preguntas secundarias (`/btw`)

`/btw` **no** es nativo en este arnés. `createCopilotAgentHarness()`
deja deliberadamente `harness.runSideQuestion` sin definir, por lo que el
despachador `/btw` de OpenClaw (`src/agents/btw.ts`) pasa a la misma ruta de
reserva de PI dentro del árbol que usa para cada entorno de ejecución que no es
Codex: se llama directamente al proveedor de modelo configurado con un prompt
breve de pregunta secundaria y se transmite de vuelta mediante `streamSimple`
(sin sesión de CLI, sin espacio adicional en el pool).

Esto mantiene las sesiones de la CLI de Copilot reservadas para el bucle de
turno principal del agente, y mantiene el comportamiento de `/btw` idéntico al
de otros entornos de ejecución respaldados por PI. El contrato se comprueba en
[`extensions/copilot/harness.test.ts`](https://github.com/openclaw/openclaw/blob/main/extensions/copilot/harness.test.ts)
bajo `describe("runSideQuestion")`.

## Doctor

`extensions/copilot/doctor-contract-api.ts` se carga automáticamente mediante
`src/plugins/doctor-contract-registry.ts`. Aporta:

- Un `legacyConfigRules` vacío (sin campos retirados en el MVP).
- Un `normalizeCompatibilityConfig` sin efecto (conservado para que futuras
  retiradas de campos tengan un lugar estable dentro del árbol).
- Una entrada `sessionRouteStateOwners` que reclama el proveedor
  `github-copilot`; entorno de ejecución `copilot`; clave de sesión de CLI
  `copilot`; prefijo de perfil de autenticación `github-copilot:`.

## Limitaciones

- El arnés reclama `github-copilot` más identificadores de proveedor BYOK
  personalizados sin propietario. Los identificadores de proveedor nativos
  propiedad del manifiesto permanecen en su entorno de ejecución propietario,
  incluso cuando se fuerza `agentRuntime.id` a `copilot`.
- El arnés no entrega TUI; la TUI de PI no se ve afectada y sigue siendo la
  reserva para cualquier entorno de ejecución que no tenga una superficie par.
- El estado de sesión de PI no se migra cuando un agente cambia a `copilot`.
  La selección es por intento; las sesiones de PI existentes siguen siendo
  válidas.
- `ask_user` usa la misma ruta de prompt y respuesta de OpenClaw que el arnés de
  Codex. Cuando el SDK de Copilot solicita entrada del usuario, OpenClaw publica
  un prompt bloqueante en el canal/TUI activo y el siguiente mensaje de usuario
  en cola resuelve la solicitud del SDK.

## Permisos y ask_user

La aplicación de permisos para herramientas puenteadas de OpenClaw ocurre
**dentro del envoltorio de herramienta**, no mediante la devolución de llamada
`onPermissionRequest` del SDK. El mismo `wrapToolWithBeforeToolCallHook` que usa
PI (`src/agents/pi-tools.before-tool-call.ts`) es aplicado por
`createOpenClawCodingTools` a cada herramienta de programación: detección de
bucles, políticas de Plugin de confianza, hooks antes de llamar a herramientas y
aprobaciones de Plugin en dos fases mediante el gateway (`plugin.approval.request`)
se ejecutan todos con la misma ruta de código exacta que los intentos nativos de
PI.

Para permitir que ese envoltorio sea propietario de la decisión, la herramienta
del SDK devuelta por `convertOpenClawToolToSdkTool` se marca con:

- `overridesBuiltInTool: true` — reemplaza la herramienta integrada de la CLI de
  Copilot con el mismo nombre (edit, read, write, bash, …) para que cada
  invocación de herramienta vuelva a enrutar a OpenClaw.
- `skipPermission: true` — indica al SDK que no dispare
  `onPermissionRequest({kind: "custom-tool"})` antes de invocar la herramienta.
  El `execute()` envuelto realiza internamente la comprobación de política más
  completa de OpenClaw; un prompt a nivel de SDK cortocircuitaría la aplicación
  de OpenClaw (si permitimos todo) o bloquearía cada llamada de herramienta (si
  rechazamos todo), y ninguna de las dos opciones coincide con la paridad de PI.

El arnés de Codex dentro del árbol usa la misma separación: las herramientas
puenteadas de OpenClaw se envuelven
(`extensions/codex/src/app-server/dynamic-tools.ts`) y los tipos de aprobación
nativos _propios_ del codex-app-server
(`item/commandExecution/requestApproval`,
`item/fileChange/requestApproval`,
`item/permissions/requestApproval`) se enrutan mediante
`plugin.approval.request`
(`extensions/codex/src/app-server/approval-bridge.ts`). El equivalente del SDK
de Copilot — una `rejectAllPolicy` cerrada ante fallos para cualquier tipo que no
sea `custom-tool` que llegue alguna vez a `onPermissionRequest` — es la misma red
de seguridad, y no se dispara en la práctica porque `overridesBuiltInTool: true`
desplaza todas las herramientas integradas.

Para que la capa de herramientas envueltas tome decisiones de política
equivalentes a PI, el arnés reenvía el contexto completo de herramienta de intento
de PI a `createOpenClawCodingTools`: identidad (`senderIsOwner`,
`memberRoleIds`, `ownerOnlyToolAllowlist`, …), canal/enrutamiento (`groupId`,
`currentChannelId`, `replyToMode`, conmutadores de herramientas de mensaje),
autenticación (`authProfileStore`), identidad de ejecución
(`sessionKey`/`runSessionKey` derivadas de `sandboxSessionKey`, `runId`),
contexto de modelo (`modelApi`, `modelContextWindowTokens`, `modelCompat`,
`modelHasVision`) y hooks de ejecución (`onToolOutcome`, `onYield`). Sin esos
campos, las listas de permitidos solo para propietarios se comportan
silenciosamente como denegar de forma predeterminada, las políticas de confianza
de Plugin no pueden resolverse al alcance correcto y `session_status: "current"`
se resuelve a una clave de sandbox obsoleta. El constructor del puente está en
`extensions/copilot/src/tool-bridge.ts` y refleja la llamada autoritativa de PI
en `src/agents/pi-embedded-runner/run/attempt.ts:1029-1117`. `runAttempt` ya
resuelve el contexto de sandbox mediante la unión compartida `resolveSandboxContext`,
pasa al SDK un directorio de trabajo efectivo y reenvía `sandbox` más el espacio
de trabajo de creación de subagentes al puente de herramientas. El puente también
reenvía los controles acotados de construcción de herramientas que puede aplicar
en el límite del SDK: `includeCoreTools`, la lista de permitidos de herramientas
del entorno de ejecución y `toolConstructionPlan`.

El puente también usa el ayudante compartido de superficie de herramientas de
arnés desde `openclaw/plugin-sdk/agent-harness-tool-runtime` para la paridad con
PI. Cuando la búsqueda de herramientas está habilitada, el SDK ve herramientas de
control compactas más un ejecutor de catálogo oculto en lugar de todos los
esquemas de herramientas de OpenClaw. Cuando el modo de código está habilitado,
el ayudante construye la misma superficie de control de modo de código y el mismo
ciclo de vida de catálogo que usan otros arneses de agente. Los valores
predeterminados ligeros de modelos locales, el filtrado de esquemas compatible
con el entorno de ejecución, la hidratación de directorios y la limpieza de
catálogo permanecen todos en el ayudante compartido para que los arneses de
Copilot y los adyacentes a Codex no diverjan.

### Token de GitHub a nivel de sesión

El contrato del SDK de Copilot distingue el token de GitHub **a nivel de
cliente** (`CopilotClientOptions.gitHubToken`, usado para autenticar el propio
proceso de la CLI) del token **a nivel de sesión** (`SessionConfig.gitHubToken`,
que determina la exclusión de contenido, el enrutamiento de modelo y la cuota de
esa sesión, y se respeta tanto en `createSession` como en `resumeSession`). El
arnés resuelve la autenticación una vez mediante `resolveCopilotAuth` y establece
ambos campos cuando el modo de autenticación es `gitHubToken` (un
`auth.gitHubToken` explícito o una `resolvedApiKey` resuelta por contrato desde un
perfil de autenticación `github-copilot` configurado). Cuando el modo resuelto es
`useLoggedInUser`, el campo a nivel de sesión se omite para que el SDK siga
derivando la identidad de la identidad con sesión iniciada.

`ask_user` usa `SessionConfig.onUserInputRequest`. El puente acepta índices o
etiquetas de opción para solicitudes de opción fija, acepta respuestas de forma
libre cuando la solicitud del SDK las permite y cancela una solicitud pendiente
cuando se aborta el intento de OpenClaw.

## Relacionado

- [Entornos de ejecución de agentes](/es/concepts/agent-runtimes)
- [Arnés de Codex](/es/plugins/codex-harness)
- [Plugins de arnés de agente (referencia del SDK)](/es/plugins/sdk-agent-harness)
