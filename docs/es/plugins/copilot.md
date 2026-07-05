---
read_when:
    - Quieres usar el arnés del SDK de GitHub Copilot para un agente
    - Necesitas ejemplos de configuración para el runtime `copilot`
    - Estás conectando un agente a Copilot por suscripción (github / openclaw / copilot) y quieres que se ejecute mediante la CLI de Copilot
summary: Ejecuta turnos del agente integrado de OpenClaw mediante el arnés externo del SDK de GitHub Copilot
title: Entorno de pruebas del SDK de Copilot
x-i18n:
    generated_at: "2026-07-05T11:34:44Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9ce0dd8fb69275450b3342a3acd7ec5c1d993a88196c5d0ad2f2fa9a34badf97
    source_path: plugins/copilot.md
    workflow: 16
---

El plugin externo `@openclaw/copilot` ejecuta turnos de agente de Copilot
con suscripción integrada mediante la CLI de GitHub Copilot (`@github/copilot-sdk`) en lugar del
arnés PI integrado de OpenClaw. La sesión de la CLI de Copilot posee el bucle
de agente de bajo nivel: ejecución nativa de herramientas, compaction nativa (`infiniteSessions`) y
estado de hilos gestionado por la CLI bajo `copilotHome`. OpenClaw sigue siendo propietario de los
canales de chat, archivos de sesión, selección de modelo, herramientas dinámicas (en puente), aprobaciones,
entrega de medios, espejo visible de la transcripción, preguntas laterales de `/btw` (consulta
[Preguntas laterales (`/btw`)](#side-questions-btw)) y `openclaw doctor`.

Para la división más amplia entre modelo/proveedor/runtime, empieza con
[Runtimes de agente](/es/concepts/agent-runtimes).

## Requisitos

- OpenClaw con el plugin `@openclaw/copilot` instalado.
- Si tu configuración usa `plugins.allow`, incluye `copilot` (el id de manifiesto que
  declara el plugin). Una entrada de allowlist para el nombre del paquete npm
  `@openclaw/copilot` no coincidirá y dejará el plugin bloqueado, incluso con
  `agentRuntime.id: "copilot"` definido.
- Una suscripción de GitHub Copilot que pueda controlar la CLI de Copilot, o una
  variable de entorno `gitHubToken` / entrada de perfil de autenticación para ejecuciones sin interfaz o de cron.
- Un directorio `copilotHome` con permisos de escritura. El valor predeterminado es `<agentDir>/copilot` cuando
  OpenClaw proporciona un directorio de agente; de lo contrario,
  `~/.openclaw/agents/<agentId>/copilot`.

`openclaw doctor` ejecuta el [contrato de doctor](#doctor) del plugin para
la propiedad del estado de sesión y futuras migraciones de configuración. No sondea el
entorno de la CLI de Copilot.

## Instalación

El runtime de Copilot se distribuye como un plugin externo para que el paquete
principal `openclaw` no incluya `@github/copilot-sdk` ni su binario de CLI
`@github/copilot-<platform>-<arch>` específico de plataforma (aproximadamente 260 MB en conjunto).
Instálalo solo para agentes que opten por este runtime:

```bash
openclaw plugins install @openclaw/copilot
```

El asistente de configuración instala el plugin automáticamente la primera vez que seleccionas
un modelo `github-copilot/*` **y** tu configuración enruta ese modelo (o su
proveedor) al runtime de Copilot mediante `agentRuntime: { id: "copilot" }`; consulta
[Inicio rápido](#quickstart). Sin esa adhesión explícita, OpenClaw usa su proveedor
integrado de GitHub Copilot y nunca instala este plugin.

El runtime resuelve el SDK en este orden:

1. `import("@github/copilot-sdk")` desde el paquete `@openclaw/copilot`
   instalado.
2. El directorio de respaldo `~/.openclaw/npm-runtime/copilot/` (destino heredado de
   instalación bajo demanda).

La falta del SDK produce un único error con el código `COPILOT_SDK_MISSING` y el
comando de reinstalación anterior.

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

Define `agentRuntime.id` en una sola entrada de modelo para enrutar solo ese modelo mediante
el arnés, o en un proveedor para enrutar todos los modelos bajo ese proveedor.

`github-copilot/auto` es el punto de partida portable. Los modelos con nombre de Copilot dependen
de la cuenta y de la política de la organización; confirma que tu CLI de Copilot autenticada
realmente exponga un modelo antes de fijarlo.

## Proveedores compatibles

El arnés admite el proveedor canónico `github-copilot` (propiedad de
`extensions/github-copilot`), además de entradas personalizadas de `models.providers` cuando el
modelo tiene un `baseUrl` no vacío y una de estas formas de `api`:

- `anthropic-messages`
- `azure-openai-responses`
- `ollama` (completions compatibles con OpenAI)
- `openai-completions`
- `openai-responses`

Los ids de proveedores nativos (`openai`, `anthropic`, `google`, `ollama`) siguen siendo propiedad de
sus runtimes nativos. Usa un id de proveedor personalizado distinto para enrutar un endpoint
mediante Copilot BYOK en su lugar.

Los endpoints de Copilot BYOK deben ser URL HTTPS públicas. El arnés entrega al
SDK de Copilot un proxy local loopback por intento y luego reenvía el tráfico del proveedor
mediante la ruta de fetch protegida de OpenClaw para que la fijación de DNS y la política SSRF sigan
siendo propiedad de OpenClaw. Usa el runtime nativo de OpenClaw para Ollama local, LM
Studio o servidores de modelos LAN.

## BYOK

Copilot BYOK usa el contrato de proveedor personalizado a nivel de sesión del SDK. OpenClaw
pasa el endpoint de modelo resuelto, clave de API, modo de token portador, encabezados, id de modelo
y límites de contexto/salida; la lógica de transporte del proveedor permanece en el SDK, no
en el núcleo.

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

Las sesiones BYOK se identifican por separado de las sesiones de suscripción y de otros
endpoints o credenciales BYOK. Rotar la clave, los encabezados, el modelo o el endpoint
inicia una sesión nueva del SDK de Copilot en lugar de reanudar un estado incompatible.

## Autenticación

Precedencia, aplicada por agente durante `runCopilotAttempt`:

1. **`useLoggedInUser: true` explícito** en la entrada del intento: usa el usuario
   con sesión iniciada de la CLI de Copilot bajo el `copilotHome` del agente.
2. **`gitHubToken` explícito** en la entrada del intento (requiere `profileId` +
   `profileVersion`). Para invocaciones directas de CLI y pruebas que necesitan
   omitir la resolución de perfiles de autenticación.
3. **`resolvedApiKey` + `authProfileId` resueltos por contrato**: la ruta principal
   de producción. El núcleo resuelve el perfil de autenticación `github-copilot`
   configurado para el agente (`src/infra/provider-usage.auth.ts:resolveProviderAuths`) antes de
   invocar el arnés, por lo que un perfil de autenticación `github-copilot:<profile>` funciona
   de extremo a extremo para configuraciones sin interfaz, cron o con múltiples perfiles sin variables de entorno.
4. **Respaldo de variables de entorno**, comprobadas en este orden (gana el primer valor no vacío;
   las cadenas vacías cuentan como ausentes; refleja la precedencia enviada del proveedor
   `github-copilot` en `extensions/github-copilot/auth.ts`):
   1. `OPENCLAW_GITHUB_TOKEN`: anulación específica del arnés; te permite fijar un
      token para el arnés de OpenClaw sin alterar la configuración global de `gh` /
      la CLI de Copilot.
   2. `COPILOT_GITHUB_TOKEN`: variable de entorno estándar del SDK / CLI de Copilot.
   3. `GH_TOKEN`: variable de entorno estándar de la CLI `gh`.
   4. `GITHUB_TOKEN`: respaldo genérico de token de GitHub.

   El id de perfil de grupo sintetizado es `env:<NAME>`; la versión del perfil es una
   huella sha256 no reversible del token, por lo que rotar el valor de entorno
   invalida limpiamente el grupo de clientes.

5. **`useLoggedInUser` predeterminado** cuando no hay ninguna señal de token disponible.

Cada agente obtiene su propio `copilotHome` para que los tokens, sesiones y
configuración de la CLI de Copilot nunca se filtren entre agentes en la misma máquina. Predeterminado:
`<agentDir>/copilot` (mantiene el estado del SDK fuera del mismo directorio que
`models.json` / `auth-profiles.json` de OpenClaw), o
`~/.openclaw/agents/<agentId>/copilot` cuando no se proporciona ningún directorio de agente.
Anula con `copilotHome: <path>` en la entrada del intento para una
ubicación personalizada (por ejemplo, un montaje compartido para migración).

Las pruebas en vivo del arnés usan `OPENCLAW_COPILOT_AGENT_LIVE_TOKEN` para un
token directo. La configuración compartida de pruebas en vivo limpia `COPILOT_GITHUB_TOKEN`, `GH_TOKEN`
y `GITHUB_TOKEN` después de preparar perfiles de autenticación reales en el home de prueba aislado,
por lo que un valor de `gh auth token` pasado mediante la variable dedicada evita
omisiones falsas sin filtrarse a suites no relacionadas.

## Superficie de configuración

El arnés lee la configuración desde la entrada por intento (`runCopilotAttempt({...})`)
más un pequeño conjunto de valores predeterminados de entorno dentro de `extensions/copilot/src/`:

| Campo                    | Propósito                                                                                                                                                                                                                                                                                         |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `copilotHome`            | Directorio de estado de CLI por agente (valores predeterminados arriba).                                                                                                                                                                                                                                                 |
| `model`                  | Cadena o `{ provider, id, api?, baseUrl?, headers?, authHeader? }`. Omítelo para usar la selección normal de modelo del agente; el arnés verifica que el proveedor resuelto sea compatible.                                                                                                                   |
| `reasoningEffort`        | `"low" \| "medium" \| "high" \| "xhigh"`. Se asigna desde la resolución `ThinkLevel` / `ReasoningLevel` de OpenClaw en `auto-reply/thinking.ts`.                                                                                                                                                          |
| `infiniteSessionConfig`  | Anulación opcional para el bloque `infiniteSessions` del SDK controlado por `harness.compact`. Es seguro dejarlo como está.                                                                                                                                                                                        |
| `hooksConfig`            | Configuración opcional nativa de `SessionHooks` del SDK de Copilot para callbacks de herramienta/MCP, prompt de usuario, sesión y error. Separada de los hooks portables de ciclo de vida de OpenClaw.                                                                                                                                   |
| `permissionPolicy`       | Anulación opcional para el controlador `onPermissionRequest` del SDK para tipos de herramientas integradas del SDK (`shell`, `write`, `read`, `url`, `mcp`, `memory`, `hook`). El valor predeterminado es `rejectAllPolicy` como red de seguridad; consulta [Permisos y ask_user](#permissions-and-ask_user) para ver por qué en realidad nunca se ejecuta. |
| `enableSessionTelemetry` | Indicador opcional de telemetría de sesión del SDK.                                                                                                                                                                                                                                                            |

Los hooks de plugin de OpenClaw no necesitan configuración de intento específica de Copilot. El
arnés ejecuta `before_prompt_build` (y el hook de compatibilidad heredado
`before_agent_start`), `llm_input`, `llm_output` y `agent_end` mediante los
helpers estándar del arnés. Las compactions correctas del SDK también ejecutan
`before_compaction` y `after_compaction`. Las herramientas de OpenClaw en puente ejecutan
`before_tool_call` e informan `after_tool_call`; `hooksConfig` permanece para
callbacks solo nativos del SDK sin equivalente portable.

Nada más en OpenClaw necesita conocer estos campos. Otros plugins,
canales y código del núcleo ven solo la forma estándar `AgentHarnessAttemptParams` /
`AgentHarnessAttemptResult`.

## Compaction

Cuando se ejecuta `harness.compact`, el arnés del SDK de Copilot:

1. Reanuda la sesión del SDK rastreada sin continuar trabajo pendiente.
2. Llama a la RPC de compaction de historial con ámbito de sesión del SDK.
3. Devuelve el resultado de compaction del SDK sin escribir archivos marcadores de compatibilidad
   bajo el espacio de trabajo.

El espejo de transcripción del lado de OpenClaw (abajo) sigue recibiendo mensajes
posteriores a la compaction, por lo que el historial de chat visible para el usuario se mantiene coherente.

## Espejo de transcripción

`runCopilotAttempt` escribe dualmente los mensajes espejables de cada turno en la
transcripción de auditoría de OpenClaw mediante
`extensions/copilot/src/dual-write-transcripts.ts`. El espejo se delimita por
sesión (`copilot:${sessionId}`) y se identifica por mensaje
(`${role}:${sha256_16(role,content)}`), por lo que las entradas de turnos anteriores reemitidas
colisionan con las claves existentes en disco en lugar de duplicarse.

Dos capas de contención de fallos envuelven el espejo para que un fallo al escribir la transcripción nunca haga fallar el intento: un envoltorio interno de mejor esfuerzo, más un `.catch(...)` de defensa en profundidad en el nivel del intento. Los fallos se registran, no se exponen.

## Preguntas secundarias (`/btw`)

`/btw` **no** es nativo en este harness. `createCopilotAgentHarness()`
deja deliberadamente `harness.runSideQuestion` sin definir
(comprobado en `extensions/copilot/harness.test.ts`, `describe("runSideQuestion")`),
por lo que el despachador `/btw` de OpenClaw (`src/agents/btw.ts`) cae en la
misma ruta que usa para cada runtime que no es Codex: se llama directamente al
proveedor de modelos configurado con un prompt breve de pregunta secundaria y se transmite de vuelta mediante
`streamSimple` (sin sesión de CLI, sin ranura adicional en el pool).

Esto mantiene las sesiones de Copilot CLI reservadas para el bucle de turnos principal del agente, y
mantiene el comportamiento de `/btw` idéntico al de otros runtimes que no son Codex.

## Doctor

`extensions/copilot/doctor-contract-api.ts` se carga automáticamente mediante
`src/plugins/doctor-contract-registry.ts`. Aporta:

- Un `legacyConfigRules` vacío (todavía no hay campos retirados).
- Un `normalizeCompatibilityConfig` sin operación (conservado para que futuras retiradas de campos
  tengan un lugar estable dentro del árbol).
- Una entrada `sessionRouteStateOwners`: proveedor `github-copilot`, runtime
  `copilot`, clave de sesión de CLI `copilot`, prefijo de perfil de autenticación `github-copilot:`.

## Limitaciones

- El harness reclama `github-copilot` más ids de proveedor BYOK personalizados sin propietario.
  Los ids de proveedor nativo propiedad del manifiesto permanecen en su runtime propietario incluso cuando
  `agentRuntime.id` se fuerza a `copilot`.
- Sin superficie TUI; la TUI de PI sigue siendo la alternativa para runtimes sin una superficie
  equivalente.
- El estado de sesión de PI no migra cuando un agente cambia a `copilot`.
  La selección es por intento; las sesiones de PI existentes siguen siendo válidas.
- `ask_user` usa la misma ruta de prompt y respuesta de OpenClaw que el harness de Codex:
  cuando el SDK de Copilot solicita entrada del usuario, OpenClaw publica un
  prompt bloqueante en el canal/TUI activo, y el siguiente mensaje de usuario en cola
  resuelve la solicitud del SDK.

## Permisos y ask_user

La aplicación de permisos para herramientas OpenClaw puenteadas ocurre **dentro del envoltorio de la herramienta**, no mediante el callback `onPermissionRequest` del SDK. El mismo
`wrapToolWithBeforeToolCallHook` que usa PI
(`src/agents/agent-tools.before-tool-call.ts`) lo aplica
`createOpenClawCodingTools` a cada herramienta de codificación: la detección de bucles, las políticas de Plugin de confianza, los hooks before-tool-call y las aprobaciones de Plugin en dos fases mediante
el Gateway (`plugin.approval.request`) se ejecutan todos a través de exactamente la misma ruta de código
que los intentos nativos de PI.

La herramienta del SDK devuelta por `convertOpenClawToolToSdkTool` se marca con:

- `overridesBuiltInTool: true` — reemplaza la herramienta integrada de Copilot CLI con
  el mismo nombre (edit, read, write, bash, ...) para que cada llamada de herramienta vuelva a enrutarse
  a OpenClaw.
- `skipPermission: true` — indica al SDK que no dispare
  `onPermissionRequest({kind: "custom-tool"})` antes de invocar la herramienta. El
  `execute()` envuelto ya realiza la comprobación de políticas más completa de OpenClaw; un
  prompt a nivel de SDK acortaría la aplicación de OpenClaw
  (permitir todo) o bloquearía cada llamada de herramienta (rechazar todo), y ninguno de los dos coincide con la paridad con PI.

El harness de Codex dentro del árbol usa la misma división: las herramientas OpenClaw puenteadas se
envuelven (`extensions/codex/src/app-server/dynamic-tools.ts`) y los
tipos de aprobación nativos propios de codex-app-server
(`item/commandExecution/requestApproval`, `item/fileChange/requestApproval`,
`item/permissions/requestApproval`) se enrutan mediante `plugin.approval.request`
(`extensions/codex/src/app-server/approval-bridge.ts`). El equivalente del SDK de Copilot — `rejectAllPolicy` con cierre ante fallos para cualquier tipo que no sea `custom-tool`
que llegue alguna vez a `onPermissionRequest` — es la misma red de seguridad, y
nunca se dispara en la práctica porque `overridesBuiltInTool: true` desplaza todas
las herramientas integradas.

Para que la capa de herramienta envuelta tome decisiones de política equivalentes a PI, el
harness reenvía el contexto completo de herramienta de intento de PI a
`createOpenClawCodingTools`: identidad (`senderIsOwner`, `memberRoleIds`,
`ownerOnlyToolAllowlist`, ...), canal/enrutamiento (`groupId`,
`currentChannelId`, `replyToMode`, conmutadores de herramientas de mensaje), autenticación
(`authProfileStore`), identidad de ejecución (`sessionKey` / `runSessionKey` derivados
de `sandboxSessionKey`, `runId`), contexto de modelo (`modelApi`,
`modelContextWindowTokens`, `modelCompat`, `modelHasVision`) y hooks de ejecución
(`onToolOutcome`, `onYield`). Sin esos campos, las listas de permitidos solo para propietarios
deniegan silenciosamente de forma predeterminada, las políticas de confianza de Plugin no pueden resolverse al ámbito correcto,
y `session_status: "current"` se resuelve a una clave de sandbox obsoleta. El
constructor del puente es `extensions/copilot/src/tool-bridge.ts`, que refleja la llamada
autoritativa de PI en `src/agents/embedded-agent-runner/run/attempt.ts:1262`.
`runAttempt` resuelve el contexto de sandbox mediante la costura compartida
`resolveSandboxContext`, pasa al SDK un directorio de trabajo efectivo,
y reenvía `sandbox` más el espacio de trabajo de generación de subagente al puente de herramientas. El puente también reenvía los controles acotados de construcción de herramientas que
puede aplicar en el límite del SDK: `includeCoreTools`, la lista de permitidos de herramientas del runtime
y `toolConstructionPlan`.

El puente también usa el helper compartido de superficie de herramientas de harness de
`openclaw/plugin-sdk/agent-harness-tool-runtime` para la paridad con PI. Cuando
la búsqueda de herramientas está habilitada, el SDK ve herramientas de control compactas más un ejecutor de catálogo oculto
en lugar de todos los esquemas de herramientas de OpenClaw. Cuando el modo de código está
habilitado, el helper construye la misma superficie de control de modo de código y el ciclo de vida de catálogo
usados por otros harnesses de agente. Los valores predeterminados ligeros de modelos locales,
el filtrado de esquemas compatible con runtime, la hidratación de directorios y la limpieza de catálogo
permanecen todos en el helper compartido para que Copilot y los harnesses adyacentes a Codex
no diverjan.

### Token de GitHub a nivel de sesión

El contrato del SDK de Copilot distingue el token de GitHub **a nivel de cliente**
(`CopilotClientOptions.gitHubToken`, autentica el propio proceso de CLI)
del token **a nivel de sesión** (`SessionConfig.gitHubToken`, determina
la exclusión de contenido, el enrutamiento de modelo y la cuota para esa sesión; se respeta tanto en
`createSession` como en `resumeSession`). El harness resuelve la autenticación una vez mediante
`resolveCopilotAuth` y establece ambos campos cuando el modo de autenticación es `gitHubToken`
(un `auth.gitHubToken` explícito o un `resolvedApiKey` resuelto por contrato desde
un perfil de autenticación `github-copilot` configurado). Cuando el modo resuelto es
`useLoggedInUser`, se omite el campo a nivel de sesión para que el SDK siga
derivando la identidad de la identidad con sesión iniciada.

`ask_user` usa `SessionConfig.onUserInputRequest`. El puente acepta índices de elección
o etiquetas para solicitudes de elección fija, acepta respuestas de formato libre cuando
la solicitud del SDK las permite y cancela una solicitud pendiente cuando se aborta el intento de OpenClaw.

## Relacionado

- [Runtimes de agente](/es/concepts/agent-runtimes)
- [Harness de Codex](/es/plugins/codex-harness)
- [Plugins de harness de agente (referencia del SDK)](/es/plugins/sdk-agent-harness)
