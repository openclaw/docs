---
read_when:
    - Quieres usar el entorno del SDK de GitHub Copilot para un agente
    - Necesita ejemplos de configuración para el entorno de ejecución `copilot`
    - Se está conectando un agente a una suscripción de Copilot (github / openclaw / copilot) y se desea ejecutarlo mediante la CLI de Copilot
summary: Ejecuta turnos del agente integrado de OpenClaw mediante el entorno externo del SDK de GitHub Copilot
title: Entorno del SDK de Copilot
x-i18n:
    generated_at: "2026-07-16T11:46:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: fb4a0a3bf1123c1c3cbbed2630476afb5df73bc61d47e8a3987a5d0d7f01f83a
    source_path: plugins/copilot.md
    workflow: 16
---

El plugin externo `@openclaw/copilot` ejecuta de forma integrada los turnos del agente
Copilot de suscripción mediante la CLI de GitHub Copilot (`@github/copilot-sdk`) en lugar del
arnés integrado de OpenClaw. La sesión de la CLI de Copilot controla el bucle de bajo nivel
del agente: ejecución nativa de herramientas, Compaction nativa (`infiniteSessions`) y
estado del hilo gestionado por la CLI en `copilotHome`. OpenClaw sigue controlando los
canales de chat, los archivos de sesión, la selección de modelos, las herramientas dinámicas (conectadas mediante un puente), las aprobaciones,
la entrega de contenido multimedia, el reflejo visible de la transcripción, las preguntas secundarias de `/btw` (véase
[Preguntas secundarias (`/btw`)](#side-questions-btw)) y `openclaw doctor`.

Para conocer la división más amplia entre modelo, proveedor y entorno de ejecución, comience por
[Entornos de ejecución de agentes](/es/concepts/agent-runtimes).

## Requisitos

- OpenClaw con el plugin `@openclaw/copilot` instalado.
- Si la configuración utiliza `plugins.allow`, incluya `copilot` (el id. de manifiesto que
  declara el plugin). Una entrada de la lista de permitidos con el nombre del paquete npm
  `@openclaw/copilot` no coincidirá y mantendrá bloqueado el plugin, incluso con
  `agentRuntime.id: "copilot"` establecido.
- Una suscripción a GitHub Copilot que pueda controlar la CLI de Copilot, o una
  variable de entorno `gitHubToken` o una entrada de perfil de autenticación para ejecuciones sin interfaz o de Cron.
- Un directorio `copilotHome` con permisos de escritura. El valor predeterminado es `<agentDir>/copilot` cuando
  OpenClaw proporciona un directorio de agente; de lo contrario,
  `~/.openclaw/agents/<agentId>/copilot`.

`openclaw doctor` ejecuta el [contrato de diagnóstico](#doctor) del plugin para
la propiedad del estado de sesión y futuras migraciones de configuración. No sondea el
entorno de la CLI de Copilot.

## Instalación

El entorno de ejecución de Copilot se distribuye como plugin externo para que el paquete principal `openclaw`
no incluya `@github/copilot-sdk` ni su binario de la CLI `@github/copilot-<platform>-<arch>`
específico de cada plataforma (aproximadamente 260 MB en conjunto).
Instálelo únicamente para los agentes que opten por este entorno de ejecución:

```bash
openclaw plugins install @openclaw/copilot
```

El asistente de configuración instala el plugin automáticamente la primera vez que se selecciona
un modelo `github-copilot/*` **y** la configuración dirige ese modelo (o su
proveedor) al entorno de ejecución de Copilot mediante `agentRuntime: { id: "copilot" }`; consulte
[Inicio rápido](#quickstart). Sin esa activación, OpenClaw utiliza su proveedor
integrado de GitHub Copilot y nunca instala este plugin.

El entorno de ejecución resuelve el SDK en este orden:

1. `import("@github/copilot-sdk")` del paquete `@openclaw/copilot`
   instalado.
2. El directorio alternativo `~/.openclaw/npm-runtime/copilot/` (destino heredado de
   instalación bajo demanda).

La ausencia del SDK genera un error con el código `COPILOT_SDK_MISSING` y el
comando de reinstalación anterior.

## Inicio rápido

Fije un modelo (o un proveedor) al arnés:

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

Establezca `agentRuntime.id` en la entrada de un solo modelo para dirigir únicamente ese modelo a través
del arnés, o en un proveedor para dirigir todos los modelos de ese proveedor.

`github-copilot/auto` es el punto de partida portátil. Los modelos con nombre de Copilot dependen
de la cuenta y de las políticas de la organización; confirme que la CLI de Copilot autenticada
realmente exponga un modelo antes de fijarlo.

## Proveedores compatibles

El arnés admite el proveedor canónico `github-copilot` (propiedad de
`extensions/github-copilot`), además de entradas `models.providers` personalizadas cuando el
modelo tiene un valor `baseUrl` no vacío y una de estas formas `api`:

- `anthropic-messages`
- `azure-openai-responses`
- `ollama` (completaciones compatibles con OpenAI)
- `openai-completions`
- `openai-responses`

Los id. de proveedores nativos (`openai`, `anthropic`, `google`, `ollama`) siguen siendo propiedad de
sus entornos de ejecución nativos. Utilice un id. de proveedor personalizado distinto para dirigir un endpoint
mediante BYOK de Copilot.

Los endpoints BYOK de Copilot deben ser URL HTTPS públicas. El arnés proporciona al
SDK de Copilot un proxy de bucle invertido por intento y, a continuación, reenvía el tráfico del proveedor
a través de la ruta de obtención protegida de OpenClaw para que la fijación de DNS y la política de SSRF sigan
bajo el control de OpenClaw. Utilice el entorno de ejecución nativo de OpenClaw para servidores de modelos
locales de Ollama, LM Studio o LAN.

## BYOK

BYOK de Copilot utiliza el contrato de proveedor personalizado del SDK en el nivel de sesión. OpenClaw
pasa el endpoint resuelto del modelo, la clave de API, el modo de token de portador, los encabezados, el id.
del modelo y los límites de contexto y salida; la lógica de transporte del proveedor permanece en el SDK, no
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
endpoints o credenciales BYOK. Al rotar la clave, los encabezados, el modelo o el endpoint,
se inicia una nueva sesión del SDK de Copilot en lugar de reanudar un estado incompatible.

## Autenticación

Precedencia, aplicada por agente durante `runCopilotAttempt`:

1. **`useLoggedInUser: true` explícito** en la entrada del intento: utiliza el
   usuario con sesión iniciada de la CLI de Copilot en el `copilotHome` del agente.
2. **`gitHubToken` explícito** en la entrada del intento (requiere `profileId` +
   `profileVersion`). Para invocaciones directas de la CLI y pruebas que necesiten
   omitir la resolución del perfil de autenticación.
3. **`resolvedApiKey` + `authProfileId` resueltos por contrato**: la ruta principal
   de producción. El núcleo resuelve el perfil de autenticación `github-copilot` configurado
   del agente (`src/infra/provider-usage.auth.ts:resolveProviderAuths`) antes de
   invocar el arnés, por lo que un perfil de autenticación `github-copilot:<profile>` funciona
   de extremo a extremo en configuraciones sin interfaz, de Cron o con varios perfiles, sin variables de entorno.
4. **Alternativa mediante variables de entorno**, comprobada en este orden (gana el primer valor no vacío;
   las cadenas vacías se consideran ausentes; refleja la precedencia del proveedor `github-copilot`
   distribuido en `extensions/github-copilot/auth.ts`):
   1. `OPENCLAW_GITHUB_TOKEN`: sustitución específica del arnés; permite fijar un
      token para el arnés de OpenClaw sin alterar la configuración global de `gh` ni
      de la CLI de Copilot.
   2. `COPILOT_GITHUB_TOKEN`: variable de entorno estándar del SDK o la CLI de Copilot.
   3. `GH_TOKEN`: variable de entorno estándar de la CLI de `gh`.
   4. `GITHUB_TOKEN`: alternativa genérica de token de GitHub.

   El id. del perfil del grupo sintetizado es `env:<NAME>`; la versión del perfil es una
   huella sha256 irreversible del token, por lo que rotar el valor del entorno
   invalida correctamente el grupo de clientes.

5. **`useLoggedInUser` predeterminado** cuando no hay disponible ninguna señal de token.

Cada agente obtiene su propio `copilotHome` para que los tokens, las sesiones y la
configuración de la CLI de Copilot nunca se filtren entre agentes de la misma máquina. Valor predeterminado:
`<agentDir>/copilot` (mantiene el estado del SDK fuera del mismo directorio que
`models.json` / `auth-profiles.json` de OpenClaw), o
`~/.openclaw/agents/<agentId>/copilot` cuando no se proporciona ningún directorio de agente.
Sustitúyalo con `copilotHome: <path>` en la entrada del intento para utilizar una
ubicación personalizada (por ejemplo, un montaje compartido para una migración).

Las pruebas en vivo del arnés utilizan `OPENCLAW_COPILOT_AGENT_LIVE_TOKEN` para proporcionar directamente un
token. La configuración compartida de pruebas en vivo elimina `COPILOT_GITHUB_TOKEN`, `GH_TOKEN`
y `GITHUB_TOKEN` después de preparar perfiles de autenticación reales en el entorno de inicio aislado de las pruebas,
por lo que un valor `gh auth token` pasado mediante la variable dedicada evita
omisiones erróneas sin filtrarse a conjuntos de pruebas no relacionados.

## Superficie de configuración

El arnés lee la configuración de la entrada de cada intento (`runCopilotAttempt({...})`)
más un pequeño conjunto de valores predeterminados del entorno dentro de `extensions/copilot/src/`:

| Campo                    | Propósito                                                                                                                                                                                                                                                                                         |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `copilotHome`            | Directorio de estado de la CLI por agente (valores predeterminados indicados anteriormente).                                                                                                                                                                                                                                                 |
| `model`                  | Cadena o `{ provider, id, api?, baseUrl?, headers?, authHeader? }`. Omítalo para utilizar la selección normal de modelos del agente; el arnés verifica que el proveedor resuelto sea compatible.                                                                                                                   |
| `reasoningEffort`        | `"low" \| "medium" \| "high" \| "xhigh"`. Se asigna a partir de la resolución de `ThinkLevel` / `ReasoningLevel` de OpenClaw en `auto-reply/thinking.ts`.                                                                                                                                                          |
| `infiniteSessionConfig`  | Sustitución opcional del bloque `infiniteSessions` del SDK controlado por `harness.compact`. Es seguro dejarlo sin cambios.                                                                                                                                                                                        |
| `hooksConfig`            | Configuración nativa opcional de `SessionHooks` del SDK de Copilot para devoluciones de llamada de herramientas/MCP, solicitudes de usuario, sesiones y errores. Es independiente de los hooks de ciclo de vida portátiles de OpenClaw.                                                                                                                                   |
| `permissionPolicy`       | Sustitución opcional del controlador `onPermissionRequest` del SDK para los tipos de herramientas integrados del SDK (`shell`, `write`, `read`, `url`, `mcp`, `memory`, `hook`). El valor predeterminado es `rejectAllPolicy` como medida de seguridad; consulte [Permisos y ask_user](#permissions-and-ask_user) para saber por qué nunca llega a activarse. |
| `enableSessionTelemetry` | Indicador opcional de telemetría de sesión del SDK.                                                                                                                                                                                                                                                            |

Los hooks de plugins de OpenClaw no necesitan ninguna configuración de intento específica de Copilot. El
arnés ejecuta `before_prompt_build` (y el hook de compatibilidad heredado `before_agent_start`),
`llm_input`, `llm_output` y `agent_end` mediante los
asistentes estándar del arnés. Las compactaciones correctas del SDK también ejecutan
`before_compaction` y `after_compaction`. Las herramientas de OpenClaw conectadas mediante un puente ejecutan
`before_tool_call` e informan de `after_tool_call`; `hooksConfig` se conserva para
devoluciones de llamada exclusivas del SDK nativo sin equivalente portátil.

Ningún otro componente de OpenClaw necesita conocer estos campos. Otros plugins,
canales y código del núcleo solo ven la forma estándar `AgentHarnessAttemptParams` /
`AgentHarnessAttemptResult`.

## Compaction

Cuando se ejecuta `harness.compact`, el arnés del SDK de Copilot:

1. Reanuda la sesión del SDK registrada sin continuar el trabajo pendiente.
2. Llama al RPC de Compaction del historial en el nivel de sesión del SDK.
3. Devuelve el resultado de Compaction del SDK sin escribir archivos de marcadores de
   compatibilidad en el espacio de trabajo.

El reflejo de la transcripción del lado de OpenClaw (a continuación) sigue recibiendo
mensajes posteriores a Compaction, por lo que el historial de chat visible para el usuario permanece coherente.

## Reflejo de la transcripción

`runCopilotAttempt` escribe de forma dual los mensajes replicables de cada turno en la
transcripción de auditoría de OpenClaw mediante
`extensions/copilot/src/dual-write-transcripts.ts`. La réplica tiene un ámbito por
sesión (`copilot:${sessionId}`) y una clave por mensaje
(`${role}:${sha256_16(role,content)}`), por lo que las entradas de turnos anteriores que se vuelven a emitir
colisionan con las claves existentes en disco en lugar de duplicarse.

Dos capas de contención de errores envuelven la réplica para que un error de escritura
de la transcripción nunca haga fallar el intento: un contenedor interno de mejor esfuerzo, además de una
`.catch(...)` de defensa en profundidad en el nivel del intento. Los errores se registran, pero no
se muestran.

## Preguntas secundarias (`/btw`)

`/btw` **no** es nativo en este arnés. `createCopilotAgentHarness()`
deja deliberadamente `harness.runSideQuestion` sin definir
(como se comprueba en `extensions/copilot/harness.test.ts`, `describe("runSideQuestion")`),
por lo que el despachador `/btw` de OpenClaw (`src/agents/btw.ts`) pasa a la
misma ruta que utiliza para todos los entornos de ejecución distintos de Codex: se llama
directamente al proveedor de modelos configurado con un breve mensaje de pregunta secundaria y la respuesta
se transmite mediante `streamSimple` (sin sesión de CLI ni espacio adicional en el grupo).

Esto mantiene las sesiones de Copilot CLI reservadas para el bucle principal de turnos del agente y
hace que el comportamiento de `/btw` sea idéntico al de otros entornos de ejecución distintos de Codex.

## Doctor

`extensions/copilot/doctor-contract-api.ts` se carga automáticamente mediante
`src/plugins/doctor-contract-registry.ts`. Aporta:

- Un `legacyConfigRules` vacío (aún no hay campos retirados).
- Un `normalizeCompatibilityConfig` que no realiza ninguna operación (se conserva para que las retiradas futuras de campos
  tengan una ubicación estable dentro del árbol).
- Una entrada `sessionRouteStateOwners`: proveedor `github-copilot`, entorno de ejecución
  `copilot`, clave de sesión de CLI `copilot`, prefijo del perfil de autenticación `github-copilot:`.

## Limitaciones

- El arnés declara `github-copilot` además de identificadores personalizados de proveedores BYOK sin propietario.
  Los identificadores de proveedores nativos que pertenecen al manifiesto permanecen en su entorno de ejecución propietario incluso cuando
  se fuerza `agentRuntime.id` a `copilot`.
- No hay superficie de TUI; la TUI de PI sigue siendo la alternativa para los entornos de ejecución sin una superficie
  equivalente.
- El estado de la sesión de PI no se migra cuando un agente cambia a `copilot`.
  La selección se realiza por intento; las sesiones existentes de PI siguen siendo válidas.
- `ask_user` utiliza la misma ruta de solicitud y respuesta de OpenClaw que el arnés de Codex:
  cuando el SDK de Copilot solicita información al usuario, OpenClaw publica una
  solicitud bloqueante en el canal o la TUI activos, y el siguiente mensaje del usuario
  en cola resuelve la solicitud del SDK.

## Permisos y ask_user

La aplicación de permisos para las herramientas de OpenClaw conectadas ocurre **dentro del contenedor de la
herramienta**, no mediante la devolución de llamada `onPermissionRequest` del SDK. El mismo
`wrapToolWithBeforeToolCallHook` que utiliza PI
(`src/agents/agent-tools.before-tool-call.ts`) se aplica mediante
`createOpenClawCodingTools` a cada herramienta de programación: la detección de bucles, las políticas de
plugins de confianza, los enlaces previos a la llamada de herramientas y las aprobaciones de plugins en dos fases mediante
el Gateway (`plugin.approval.request`) pasan exactamente por la misma ruta de código
que los intentos nativos de PI.

Cada herramienta del SDK devuelta por el puente de herramientas de Copilot está marcada con:

- `overridesBuiltInTool: true` — sustituye la herramienta integrada de Copilot CLI con
  el mismo nombre (edit, read, write, bash, ...) para que cada llamada de herramienta vuelva
  a OpenClaw.
- `skipPermission: true` — indica al SDK que no active
  `onPermissionRequest({kind: "custom-tool"})` antes de invocar la herramienta. El
  `execute()` envuelto ya realiza la comprobación de políticas más completa de OpenClaw; una
  solicitud en el nivel del SDK omitiría la aplicación de políticas de OpenClaw
  (permitir todo) o bloquearía todas las llamadas de herramientas (rechazar todo); ninguna de las dos opciones ofrece
  paridad con PI.

El arnés de Codex incluido en el árbol utiliza la misma separación: las herramientas de OpenClaw conectadas están
envueltas (`extensions/codex/src/app-server/dynamic-tools.ts`) y los tipos de aprobación nativos propios
del codex-app-server
(`item/commandExecution/requestApproval`, `item/fileChange/requestApproval`,
`item/permissions/requestApproval`) se enrutan mediante `plugin.approval.request`
(`extensions/codex/src/app-server/approval-bridge.ts`). El equivalente del SDK de Copilot
— `rejectAllPolicy` con cierre seguro para cualquier tipo distinto de `custom-tool`
que llegue alguna vez a `onPermissionRequest` — es la misma red de seguridad y,
en la práctica, nunca se activa porque `overridesBuiltInTool: true` reemplaza todos los elementos
integrados.

Para que la capa de herramientas envueltas tome decisiones de políticas equivalentes a PI, el
arnés reenvía el contexto completo de herramientas del intento de PI a
`createOpenClawCodingTools`: identidad (`senderIsOwner`, `memberRoleIds`,
`ownerOnlyToolAllowlist`, ...), canal y enrutamiento (`groupId`,
`currentChannelId`, `replyToMode`, opciones de herramientas de mensajería), autenticación
(`authProfileStore`), identidad de ejecución (`sessionKey` / `runSessionKey` derivados
de `sandboxSessionKey`, `runId`), contexto del modelo (`modelApi`,
`modelContextWindowTokens`, `modelCompat`, `modelHasVision`) y enlaces de ejecución
(`onToolOutcome`, `onYield`). Sin esos campos, las listas de permitidos exclusivas del propietario
deniegan silenciosamente de forma predeterminada, las políticas de confianza de plugins no pueden resolverse con el ámbito
correcto y `session_status: "current"` se resuelve como una clave obsoleta del entorno aislado. El
constructor del puente es `extensions/copilot/src/tool-bridge.ts`, que refleja la llamada
autoritativa de PI en `src/agents/embedded-agent-runner/run/attempt.ts:1262`.
`runAttempt` resuelve el contexto del entorno aislado mediante el punto de integración compartido
`resolveSandboxContext`, proporciona al SDK un directorio de trabajo efectivo
y reenvía `sandbox`, además del espacio de trabajo de creación de subagentes, al puente de
herramientas. El puente también reenvía los controles acotados de construcción de herramientas que
puede aplicar en el límite del SDK: `includeCoreTools`, la lista de herramientas
permitidas del entorno de ejecución y `toolConstructionPlan`.

El puente también utiliza el asistente compartido de superficie de herramientas del arnés de
`openclaw/plugin-sdk/agent-harness-tool-runtime` para mantener la paridad con PI. Cuando
la búsqueda de herramientas está habilitada, el SDK ve herramientas de control compactas y un ejecutor de
catálogo oculto, en lugar de todos los esquemas de herramientas de OpenClaw. Cuando el modo de código está
habilitado, el asistente crea la misma superficie de control del modo de código y el ciclo de vida del catálogo
que utilizan otros arneses de agentes. Los valores predeterminados reducidos para modelos locales,
el filtrado de esquemas compatible con el entorno de ejecución, la hidratación de directorios y la limpieza
del catálogo permanecen en el asistente compartido para que los arneses adyacentes a Copilot y Codex
no diverjan.

### Token de GitHub en el nivel de sesión

El contrato del SDK de Copilot distingue el token de GitHub **en el nivel del cliente**
(`CopilotClientOptions.gitHubToken`, autentica el propio proceso de la CLI)
del token **en el nivel de sesión** (`SessionConfig.gitHubToken`, determina
la exclusión de contenido, el enrutamiento del modelo y la cuota para esa sesión; se respeta tanto en
`createSession` como en `resumeSession`). El arnés resuelve la autenticación una vez mediante
`resolveCopilotAuth` y establece ambos campos cuando el modo de autenticación es `gitHubToken`
(un `auth.gitHubToken` explícito o un `resolvedApiKey` resuelto por contrato desde
un perfil de autenticación `github-copilot` configurado). Cuando el modo resuelto es
`useLoggedInUser`, se omite el campo en el nivel de sesión para que el SDK siga
derivando la identidad de la identidad con la sesión iniciada.

`ask_user` utiliza `SessionConfig.onUserInputRequest`. El puente acepta índices de
opciones o etiquetas para solicitudes con opciones fijas, acepta respuestas de formato libre cuando
la solicitud del SDK las permite y cancela una solicitud pendiente cuando se anula el intento de
OpenClaw.

## Relacionado

- [Entornos de ejecución de agentes](/es/concepts/agent-runtimes)
- [Arnés de Codex](/es/plugins/codex-harness)
- [Plugins de arnés de agentes (referencia del SDK)](/es/plugins/sdk-agent-harness)
