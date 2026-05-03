---
read_when:
    - Desea usar el arnés de servidor de aplicaciones de Codex incluido
    - Necesitas ejemplos de configuración del arnés de Codex
    - Quieres que los despliegues exclusivos de Codex generen un error en lugar de recurrir a PI
summary: Ejecuta turnos del agente integrado de OpenClaw mediante el arnés de app-server de Codex incluido.
title: Arnés de Codex
x-i18n:
    generated_at: "2026-05-03T21:35:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: f5187e54e2dc94e511c0243227f741d3486669f595c2b15cf239b1c03ea466c8
    source_path: plugins/codex-harness.md
    workflow: 16
---

El Plugin `codex` incluido permite que OpenClaw ejecute turnos de agente integrados mediante el
app-server de Codex en lugar del arnés de PI integrado.

Usa esto cuando quieras que Codex sea dueño de la sesión de agente de bajo nivel: descubrimiento de
modelos, reanudación nativa de hilos, compaction nativa y ejecución del app-server.
OpenClaw sigue siendo dueño de los canales de chat, los archivos de sesión, la selección de modelos, las herramientas,
las aprobaciones, la entrega de medios y el espejo visible de la transcripción.

Cuando un turno de chat de origen se ejecuta mediante el arnés de Codex, las respuestas visibles usan de forma predeterminada
la herramienta `message` de OpenClaw si el despliegue no ha configurado explícitamente
`messages.visibleReplies`. El agente aún puede finalizar su turno de Codex en privado;
solo publica en el canal cuando llama a `message(action="send")`. Configura
`messages.visibleReplies: "automatic"` para mantener las respuestas finales de chat directo en la
ruta heredada de entrega automática.

Los turnos de Heartbeat de Codex también obtienen de forma predeterminada la herramienta `heartbeat_respond`, para que el
agente pueda registrar si el despertar debe permanecer silencioso o notificar sin codificar
ese flujo de control en el texto final.

La guía de iniciativa específica de Heartbeat se envía como una instrucción de desarrollador
de modo de colaboración de Codex en el propio turno de Heartbeat. Los turnos de chat ordinarios restauran
el modo Default de Codex en lugar de llevar la filosofía de Heartbeat en su prompt de
ejecución normal.

Si estás intentando orientarte, empieza con
[Entornos de ejecución de agentes](/es/concepts/agent-runtimes). La versión corta es:
`openai/gpt-5.5` es la referencia de modelo, `codex` es el entorno de ejecución, y Telegram,
Discord, Slack u otro canal sigue siendo la superficie de comunicación.

## Configuración rápida

La mayoría de los usuarios que quieren "Codex en OpenClaw" quieren esta ruta: iniciar sesión con una
suscripción de ChatGPT/Codex y luego ejecutar turnos de agente integrados mediante el entorno de ejecución
nativo del app-server de Codex. La referencia de modelo sigue siendo canónica como
`openai/gpt-*`; la autenticación de suscripción proviene de la cuenta/perfil de Codex, no
de un prefijo de modelo `openai-codex/*`.

Primero inicia sesión con Codex OAuth si aún no lo has hecho:

```bash
openclaw models auth login --provider openai-codex
```

Luego habilita el Plugin `codex` incluido y fuerza el entorno de ejecución de Codex:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      agentRuntime: {
        id: "codex",
      },
    },
  },
}
```

Si tu configuración usa `plugins.allow`, incluye también `codex` allí:

```json5
{
  plugins: {
    allow: ["codex"],
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
}
```

No uses `openai-codex/gpt-*` cuando te refieras al entorno de ejecución nativo de Codex. Ese prefijo
es la ruta explícita "Codex OAuth mediante PI". Los cambios de configuración se aplican a sesiones nuevas o
restablecidas; las sesiones existentes conservan su entorno de ejecución registrado.

## Qué cambia este Plugin

El Plugin `codex` incluido aporta varias capacidades separadas:

| Capacidad                         | Cómo la usas                                        | Qué hace                                                                       |
| --------------------------------- | --------------------------------------------------- | ------------------------------------------------------------------------------ |
| Entorno de ejecución integrado nativo | `agentRuntime.id: "codex"`                          | Ejecuta turnos de agente integrados de OpenClaw mediante el app-server de Codex. |
| Comandos nativos de control de chat | `/codex bind`, `/codex resume`, `/codex steer`, ... | Vincula y controla hilos del app-server de Codex desde una conversación de mensajería. |
| Proveedor/catálogo del app-server de Codex | elementos internos de `codex`, expuestos mediante el arnés | Permite que el entorno de ejecución descubra y valide modelos del app-server. |
| Ruta de comprensión de medios de Codex | rutas de compatibilidad de modelos de imagen `codex/*` | Ejecuta turnos acotados del app-server de Codex para modelos compatibles de comprensión de imágenes. |
| Relevo nativo de hooks            | Hooks de Plugin alrededor de eventos nativos de Codex | Permite que OpenClaw observe/bloquee eventos compatibles de herramientas/finalización nativos de Codex. |

Habilitar el Plugin hace que esas capacidades estén disponibles. **No**:

- empieza a usar Codex para cada modelo de OpenAI
- convierte referencias de modelo `openai-codex/*` en el entorno de ejecución nativo
- convierte ACP/acpx en la ruta predeterminada de Codex
- cambia en caliente sesiones existentes que ya registraron un entorno de ejecución de PI
- reemplaza la entrega de canales de OpenClaw, los archivos de sesión, el almacenamiento de perfiles de autenticación ni
  el enrutamiento de mensajes

El mismo Plugin también es dueño de la superficie nativa de comandos de control de chat `/codex`. Si
el Plugin está habilitado y el usuario pide vincular, reanudar, dirigir, detener o inspeccionar
hilos de Codex desde el chat, los agentes deben preferir `/codex ...` sobre ACP. ACP sigue siendo
la alternativa explícita cuando el usuario pide ACP/acpx o está probando el adaptador ACP
de Codex.

Los turnos nativos de Codex conservan los hooks de Plugin de OpenClaw como capa pública de compatibilidad.
Estos son hooks de OpenClaw en proceso, no hooks de comandos `hooks.json` de Codex:

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `before_tool_call`, `after_tool_call`
- `before_message_write` para registros reflejados de transcripción
- `before_agent_finalize` mediante el relevo `Stop` de Codex
- `agent_end`

Los Plugins también pueden registrar middleware de resultados de herramientas neutral respecto al entorno de ejecución para reescribir
resultados de herramientas dinámicas de OpenClaw después de que OpenClaw ejecuta la herramienta y antes de que el
resultado se devuelva a Codex. Esto es independiente del hook público de Plugin
`tool_result_persist`, que transforma escrituras de resultados de herramientas de transcripción propiedad de OpenClaw.

Para la semántica de los hooks de Plugin en sí, consulta [Hooks de Plugin](/es/plugins/hooks)
y [Comportamiento de guarda de Plugin](/es/tools/plugin).

El arnés está desactivado de forma predeterminada. Las configuraciones nuevas deben mantener las referencias de modelo de OpenAI
canónicas como `openai/gpt-*` y forzar explícitamente
`agentRuntime.id: "codex"` u `OPENCLAW_AGENT_RUNTIME=codex` cuando
quieran ejecución nativa del app-server. Las referencias de modelo heredadas `codex/*` aún seleccionan automáticamente
el arnés por compatibilidad, pero los prefijos de proveedores heredados respaldados por entornos de ejecución
no se muestran como opciones normales de modelo/proveedor.

Si el Plugin `codex` está habilitado pero el modelo principal sigue siendo
`openai-codex/*`, `openclaw doctor` advierte en lugar de cambiar la ruta. Eso es
intencional: `openai-codex/*` sigue siendo la ruta de OAuth/suscripción de PI Codex, y
la ejecución nativa del app-server sigue siendo una elección explícita de entorno de ejecución.

## Mapa de rutas

Usa esta tabla antes de cambiar la configuración:

| Comportamiento deseado                              | Referencia de modelo       | Configuración del entorno de ejecución | Ruta de autenticación/perfil | Etiqueta de estado esperada    |
| --------------------------------------------------- | -------------------------- | -------------------------------------- | ---------------------------- | ------------------------------ |
| Suscripción ChatGPT/Codex con entorno de ejecución nativo de Codex | `openai/gpt-*`             | `agentRuntime.id: "codex"`             | Codex OAuth o cuenta de Codex | `Runtime: OpenAI Codex`        |
| API de OpenAI mediante el corredor normal de OpenClaw | `openai/gpt-*`             | omitida o `runtime: "pi"`              | Clave de API de OpenAI       | `Runtime: OpenClaw Pi Default` |
| Suscripción ChatGPT/Codex mediante PI              | `openai-codex/gpt-*`       | omitida o `runtime: "pi"`              | Proveedor OpenAI Codex OAuth | `Runtime: OpenClaw Pi Default` |
| Proveedores mixtos con modo automático conservador | referencias específicas del proveedor | `agentRuntime.id: "auto"`              | Según el proveedor seleccionado | Depende del entorno de ejecución seleccionado |
| Sesión explícita del adaptador ACP de Codex         | dependiente del prompt/modelo ACP | `sessions_spawn` con `runtime: "acp"` | Autenticación del backend ACP | Estado de tarea/sesión ACP     |

La división importante es proveedor frente a entorno de ejecución:

- `openai-codex/*` responde "¿qué ruta de proveedor/autenticación debe usar PI?"
- `agentRuntime.id: "codex"` responde "¿qué bucle debe ejecutar este
  turno integrado?"
- `/codex ...` responde "¿qué conversación nativa de Codex debe vincular o controlar
  este chat?"
- ACP responde "¿qué proceso de arnés externo debe lanzar acpx?"

## Elige el prefijo de modelo correcto

Las rutas de la familia OpenAI son específicas del prefijo. Para la configuración común de suscripción más
entorno de ejecución nativo de Codex, usa `openai/*` con `agentRuntime.id: "codex"`.
Usa `openai-codex/*` solo cuando quieras intencionalmente Codex OAuth mediante PI:

| Referencia de modelo                          | Ruta de entorno de ejecución                 | Cuándo usarla                                                             |
| --------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------- |
| `openai/gpt-5.4`                              | Proveedor OpenAI mediante la fontanería OpenClaw/PI | Quieres acceso actual directo a la API de OpenAI Platform con `OPENAI_API_KEY`. |
| `openai-codex/gpt-5.5`                        | OpenAI Codex OAuth mediante OpenClaw/PI       | Quieres autenticación de suscripción ChatGPT/Codex con el corredor PI predeterminado. |
| `openai/gpt-5.5` + `agentRuntime.id: "codex"` | Arnés del app-server de Codex                | Quieres autenticación de suscripción ChatGPT/Codex con ejecución nativa de Codex. |

GPT-5.5 puede aparecer tanto en rutas directas de clave de API de OpenAI como en rutas de suscripción de Codex
cuando tu cuenta las expone. Usa `openai/gpt-5.5` con el arnés del app-server de Codex
para el entorno de ejecución nativo de Codex, `openai-codex/gpt-5.5` para OAuth de PI, o
`openai/gpt-5.5` sin una anulación de entorno de ejecución de Codex para tráfico directo con clave de API.

Las referencias heredadas `codex/gpt-*` siguen aceptándose como alias de compatibilidad. La migración de
compatibilidad de Doctor reescribe las referencias heredadas de entorno de ejecución principal a referencias de modelo canónicas
y registra la política de entorno de ejecución por separado, mientras que las referencias heredadas solo de respaldo
se dejan sin cambios porque el entorno de ejecución se configura para todo el contenedor del agente.
Las configuraciones nuevas de PI Codex OAuth deben usar `openai-codex/gpt-*`; las configuraciones nuevas del arnés
nativo del app-server deben usar `openai/gpt-*` más
`agentRuntime.id: "codex"`.

`agents.defaults.imageModel` sigue la misma división de prefijos. Usa
`openai-codex/gpt-*` cuando la comprensión de imágenes deba ejecutarse mediante la ruta del proveedor
OpenAI Codex OAuth. Usa `codex/gpt-*` cuando la comprensión de imágenes deba ejecutarse
mediante un turno acotado del app-server de Codex. El modelo del app-server de Codex debe
anunciar compatibilidad con entrada de imágenes; los modelos de Codex solo de texto fallan antes de que el turno de medios
comience.

Usa `/status` para confirmar el arnés efectivo de la sesión actual. Si la
selección sorprende, habilita el registro de depuración para el subsistema `agents/harness`
e inspecciona el registro estructurado `agent harness selected` del Gateway. Incluye
el id del arnés seleccionado, el motivo de selección, la política de entorno de ejecución/respaldo y,
en modo `auto`, el resultado de compatibilidad de cada candidato de Plugin.

### Qué significan las advertencias de doctor

`openclaw doctor` advierte cuando todo esto es verdadero:

- el Plugin `codex` incluido está habilitado o permitido
- el modelo principal de un agente es `openai-codex/*`
- el entorno de ejecución efectivo de ese agente no es `codex`

Esa advertencia existe porque los usuarios a menudo esperan que "Plugin de Codex habilitado" implique
"entorno de ejecución nativo del app-server de Codex." OpenClaw no hace ese salto. La advertencia
significa:

- **No se requiere ningún cambio** si pretendías ChatGPT/Codex OAuth mediante PI.
- Cambia el modelo a `openai/<model>` y configura
  `agentRuntime.id: "codex"` si pretendías ejecución nativa del app-server.
- Las sesiones existentes aún necesitan `/new` o `/reset` después de un cambio de entorno de ejecución,
  porque los pines de entorno de ejecución de sesión son persistentes.

La selección de arnés no es un control de sesión en vivo. Cuando se ejecuta un turno integrado,
OpenClaw registra el id del arnés seleccionado en esa sesión y sigue usándolo para
turnos posteriores con el mismo id de sesión. Cambia la configuración de `agentRuntime` o
`OPENCLAW_AGENT_RUNTIME` cuando quieras que las sesiones futuras usen otro arnés;
usa `/new` o `/reset` para iniciar una sesión nueva antes de alternar una conversación existente
entre PI y Codex. Esto evita reproducir una transcripción mediante
dos sistemas de sesión nativos incompatibles.

Las sesiones heredadas creadas antes de las fijaciones de harness se tratan como ancladas a PI una vez que
tienen historial de transcripción. Usa `/new` o `/reset` para incorporar esa conversación a
Codex después de cambiar la configuración.

`/status` muestra el runtime efectivo del modelo. El harness PI predeterminado aparece como
`Runtime: OpenClaw Pi Default`, y el harness del app-server de Codex aparece como
`Runtime: OpenAI Codex`.

## Requisitos

- OpenClaw con el plugin `codex` incluido disponible.
- App-server de Codex `0.125.0` o más reciente. El plugin incluido gestiona un binario
  compatible del app-server de Codex de forma predeterminada, por lo que los comandos locales `codex` en `PATH` no
  afectan el inicio normal del harness.
- Autenticación de Codex disponible para el proceso del app-server o para el puente de autenticación de Codex de OpenClaw. Los inicios locales del app-server usan un directorio home de Codex gestionado por OpenClaw para cada
  agente y un `HOME` hijo aislado, por lo que no leen tu cuenta personal de
  `~/.codex`, Skills, plugins, configuración, estado de hilos ni
  `$HOME/.agents/skills` nativo de forma predeterminada.

El plugin bloquea handshakes del app-server antiguos o sin versión. Eso mantiene
OpenClaw en la superficie de protocolo contra la que se ha probado.

Para pruebas smoke en vivo y en Docker, la autenticación suele provenir de la cuenta de la CLI de Codex
o de un perfil de autenticación `openai-codex` de OpenClaw. Los inicios locales del app-server por stdio también pueden
recurrir a `CODEX_API_KEY` / `OPENAI_API_KEY` cuando no hay una cuenta presente.

## Archivos de arranque del espacio de trabajo

Codex gestiona `AGENTS.md` por sí mismo mediante el descubrimiento nativo de documentación de proyecto. OpenClaw
no escribe archivos sintéticos de documentación de proyecto de Codex ni depende de nombres de archivo fallback de Codex
para archivos de persona, porque los fallbacks de Codex solo se aplican cuando
falta `AGENTS.md`.

Para la paridad del espacio de trabajo de OpenClaw, el harness de Codex resuelve los demás archivos de arranque
(`SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`,
`BOOTSTRAP.md` y `MEMORY.md` cuando existen) y los reenvía mediante instrucciones de configuración de Codex en `thread/start` y `thread/resume`. Esto mantiene
`SOUL.md` y el contexto relacionado de persona/perfil del espacio de trabajo visibles sin
duplicar `AGENTS.md`.

## Añadir Codex junto a otros modelos

No establezcas `agentRuntime.id: "codex"` globalmente si el mismo agente debe poder cambiar libremente
entre Codex y modelos de proveedores que no son Codex. Un runtime forzado se aplica a cada
turno incrustado de ese agente o sesión. Si seleccionas un modelo de Anthropic mientras
ese runtime está forzado, OpenClaw sigue intentando el harness de Codex y falla de forma cerrada
en vez de enrutar silenciosamente ese turno a través de PI.

Usa una de estas formas en su lugar:

- Coloca Codex en un agente dedicado con `agentRuntime.id: "codex"`.
- Mantén el agente predeterminado en `agentRuntime.id: "auto"` y el fallback de PI para el uso mixto normal
  de proveedores.
- Usa refs heredadas `codex/*` solo por compatibilidad. Las configuraciones nuevas deberían preferir
  `openai/*` más una política explícita de runtime de Codex.

Por ejemplo, esto mantiene el agente predeterminado en la selección automática normal y
añade un agente de Codex separado:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
  agents: {
    defaults: {
      agentRuntime: {
        id: "auto",
      },
    },
    list: [
      {
        id: "main",
        default: true,
        model: "anthropic/claude-opus-4-6",
      },
      {
        id: "codex",
        name: "Codex",
        model: "openai/gpt-5.5",
        agentRuntime: {
          id: "codex",
        },
      },
    ],
  },
}
```

Con esta forma:

- El agente predeterminado `main` usa la ruta normal del proveedor y el fallback de compatibilidad con PI.
- El agente `codex` usa el harness del app-server de Codex.
- Si Codex falta o no es compatible con el agente `codex`, el turno falla
  en vez de usar PI de forma silenciosa.

## Enrutamiento de comandos de agente

Los agentes deberían enrutar las solicitudes de usuario por intención, no solo por la palabra "Codex":

| El usuario pide...                                      | El agente debería usar...                         |
| ------------------------------------------------------ | ------------------------------------------------ |
| "Vincula este chat a Codex"                            | `/codex bind`                                    |
| "Reanuda el hilo de Codex `<id>` aquí"                 | `/codex resume <id>`                             |
| "Muestra los hilos de Codex"                           | `/codex threads`                                 |
| "Presenta un informe de soporte por una ejecución incorrecta de Codex" | `/diagnostics [note]`                            |
| "Envía solo comentarios de Codex para este hilo adjunto" | `/codex diagnostics [note]`                      |
| "Usa mi suscripción de ChatGPT/Codex con el runtime de Codex" | `openai/*` más `agentRuntime.id: "codex"`        |
| "Usa mi suscripción de ChatGPT/Codex a través de PI"   | refs de modelo `openai-codex/*`                  |
| "Ejecuta Codex mediante ACP/acpx"                      | ACP `sessions_spawn({ runtime: "acp", ... })`    |
| "Inicia Claude Code/Gemini/OpenCode/Cursor en un hilo" | ACP/acpx, no `/codex` ni subagentes nativos      |

OpenClaw solo anuncia orientación de spawn de ACP a los agentes cuando ACP está habilitado,
es despachable y está respaldado por un backend de runtime cargado. Si ACP no está disponible,
el prompt del sistema y las Skills del plugin no deberían enseñar al agente sobre el enrutamiento
de ACP.

## Despliegues solo con Codex

Fuerza el harness de Codex cuando necesites demostrar que cada turno de agente incrustado
usa Codex. Los runtimes explícitos de plugin fallan de forma cerrada y nunca se reintentan silenciosamente
a través de PI:

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      agentRuntime: {
        id: "codex",
      },
    },
  },
}
```

Sobrescritura de entorno:

```bash
OPENCLAW_AGENT_RUNTIME=codex openclaw gateway run
```

Con Codex forzado, OpenClaw falla temprano si el plugin de Codex está deshabilitado, el
app-server es demasiado antiguo o el app-server no puede iniciarse.

## Codex por agente

Puedes hacer que un agente sea solo Codex mientras el agente predeterminado conserva la
selección automática normal:

```json5
{
  agents: {
    defaults: {
      agentRuntime: {
        id: "auto",
      },
    },
    list: [
      {
        id: "main",
        default: true,
        model: "anthropic/claude-opus-4-6",
      },
      {
        id: "codex",
        name: "Codex",
        model: "openai/gpt-5.5",
        agentRuntime: {
          id: "codex",
        },
      },
    ],
  },
}
```

Usa comandos de sesión normales para cambiar de agentes y modelos. `/new` crea una sesión nueva de
OpenClaw y el harness de Codex crea o reanuda su hilo sidecar del app-server
según sea necesario. `/reset` borra la vinculación de sesión de OpenClaw para ese hilo
y permite que el siguiente turno resuelva de nuevo el harness desde la configuración actual.

## Descubrimiento de modelos

De forma predeterminada, el plugin de Codex pide al app-server los modelos disponibles. Si
el descubrimiento falla o agota el tiempo de espera, usa un catálogo fallback incluido para:

- GPT-5.5
- GPT-5.4 mini
- GPT-5.2

Puedes ajustar el descubrimiento en `plugins.entries.codex.config.discovery`:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          discovery: {
            enabled: true,
            timeoutMs: 2500,
          },
        },
      },
    },
  },
}
```

Deshabilita el descubrimiento cuando quieras que el inicio evite sondear Codex y se ciña al
catálogo fallback:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          discovery: {
            enabled: false,
          },
        },
      },
    },
  },
}
```

## Conexión y política del app-server

De forma predeterminada, el plugin inicia localmente el binario de Codex gestionado por OpenClaw con:

```bash
codex app-server --listen stdio://
```

El binario gestionado se entrega con el paquete del plugin `codex`. Esto mantiene la
versión del app-server ligada al plugin incluido en vez de a cualquier CLI de Codex separada
que esté instalada localmente. Establece `appServer.command` solo cuando
quieras ejecutar intencionadamente un ejecutable diferente.

De forma predeterminada, OpenClaw inicia sesiones locales del harness de Codex en modo YOLO:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` y
`sandbox: "danger-full-access"`. Esta es la postura de operador local de confianza usada
para heartbeats autónomos: Codex puede usar herramientas de shell y red sin
detenerse en prompts de aprobación nativos que nadie está presente para responder.

Para optar por aprobaciones revisadas por guardian de Codex, establece `appServer.mode:
"guardian"`:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            mode: "guardian",
            serviceTier: "fast",
          },
        },
      },
    },
  },
}
```

El modo Guardian usa la ruta de aprobación de revisión automática nativa de Codex. Cuando Codex pide
salir del sandbox, escribir fuera del espacio de trabajo o añadir permisos como acceso
a la red, Codex enruta esa solicitud de aprobación al revisor nativo en vez de a un
prompt humano. El revisor aplica el marco de riesgos de Codex y aprueba o deniega
la solicitud específica. Usa Guardian cuando quieras más barreras que el modo YOLO
pero todavía necesites que agentes desatendidos avancen.

El preset `guardian` se expande a `approvalPolicy: "on-request"`,
`approvalsReviewer: "auto_review"` y `sandbox: "workspace-write"`.
Los campos de política individuales siguen sobrescribiendo `mode`, por lo que los despliegues avanzados pueden combinar
el preset con elecciones explícitas. El valor de revisor anterior `guardian_subagent`
sigue aceptándose como alias de compatibilidad, pero las configuraciones nuevas deberían usar
`auto_review`.

Para un app-server ya en ejecución, usa transporte WebSocket:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            transport: "websocket",
            url: "ws://127.0.0.1:39175",
            authToken: "${CODEX_APP_SERVER_TOKEN}",
            requestTimeoutMs: 60000,
          },
        },
      },
    },
  },
}
```

Los inicios del app-server por stdio heredan el entorno de proceso de OpenClaw de forma predeterminada,
pero OpenClaw posee el puente de cuenta del app-server de Codex y establece tanto
`CODEX_HOME` como `HOME` en directorios por agente bajo el estado de OpenClaw
de ese agente. El cargador de Skills propio de Codex lee `$CODEX_HOME/skills` y
`$HOME/.agents/skills`, por lo que ambos valores están aislados para los inicios locales del app-server.
Eso mantiene las Skills nativas de Codex, plugins, configuración, cuentas y estado de hilos
limitados al agente de OpenClaw en vez de filtrarse desde el home personal de la CLI de Codex
del operador.

Los plugins de OpenClaw y las instantáneas de Skills de OpenClaw siguen fluyendo a través del propio
registro de plugins y cargador de Skills de OpenClaw. Los recursos personales de la CLI de Codex no. Si tienes
Skills o plugins útiles de la CLI de Codex que deberían pasar a formar parte de un agente de OpenClaw,
inventaríalos explícitamente:

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

El proveedor de migración de Codex copia Skills al espacio de trabajo actual del agente de OpenClaw.
Los plugins nativos de Codex, hooks y archivos de configuración se informan o archivan
para revisión manual en vez de activarse automáticamente, porque pueden
ejecutar comandos, exponer servidores MCP o portar credenciales.

La autenticación se selecciona en este orden:

1. Un perfil de autenticación de Codex explícito de OpenClaw para el agente.
2. La cuenta existente del app-server en el home de Codex de ese agente.
3. Solo para inicios locales del app-server por stdio, `CODEX_API_KEY`, luego
   `OPENAI_API_KEY`, cuando no hay una cuenta del app-server presente y la autenticación de OpenAI
   sigue siendo necesaria.

Cuando OpenClaw ve un perfil de autenticación de Codex de estilo suscripción de ChatGPT, elimina
`CODEX_API_KEY` y `OPENAI_API_KEY` del proceso hijo de Codex generado. Eso
mantiene disponibles las claves API de nivel Gateway para embeddings o modelos directos de OpenAI
sin hacer que los turnos nativos del app-server de Codex se facturen a través de la API por accidente.
Los perfiles explícitos de clave API de Codex y el fallback local de clave de entorno por stdio usan el inicio de sesión del app-server
en vez del entorno heredado del proceso hijo. Las conexiones WebSocket al app-server
no reciben el fallback de clave API de entorno de Gateway; usa un perfil de autenticación explícito o la
propia cuenta del app-server remoto.

Si un despliegue necesita aislamiento de entorno adicional, añade esas variables a
`appServer.clearEnv`:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            clearEnv: ["CODEX_API_KEY", "OPENAI_API_KEY"],
          },
        },
      },
    },
  },
}
```

`appServer.clearEnv` solo afecta al proceso secundario app-server de Codex generado.

Las herramientas dinámicas de Codex usan de forma predeterminada el perfil `native-first`. En ese modo,
OpenClaw no expone herramientas dinámicas que duplican operaciones del espacio de trabajo
nativas de Codex: `read`, `write`, `edit`, `apply_patch`, `exec`, `process` y
`update_plan`. Las herramientas de integración de OpenClaw, como mensajería, sesiones, multimedia,
cron, navegador, nodos, Gateway, `heartbeat_respond` y `web_search`, siguen
disponibles.

Campos de Plugin de Codex de nivel superior admitidos:

| Campo                      | Valor predeterminado | Significado                                                                                   |
| -------------------------- | -------------------- | --------------------------------------------------------------------------------------------- |
| `codexDynamicToolsProfile` | `"native-first"`     | Usa `"openclaw-compat"` para exponer el conjunto completo de herramientas dinámicas de OpenClaw al app-server de Codex. |
| `codexDynamicToolsExclude` | `[]`                 | Nombres adicionales de herramientas dinámicas de OpenClaw que se omitirán en los turnos del app-server de Codex.               |

Campos `appServer` admitidos:

| Campo               | Valor predeterminado                     | Significado                                                                                                                                                                                                                              |
| ------------------- | ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`         | `"stdio"`                                | `"stdio"` genera Codex; `"websocket"` se conecta a `url`.                                                                                                                                                                             |
| `command`           | binario de Codex administrado            | Ejecutable para el transporte stdio. Déjalo sin definir para usar el binario administrado; defínelo solo para una sobrescritura explícita.                                                                                                                         |
| `args`              | `["app-server", "--listen", "stdio://"]` | Argumentos para el transporte stdio.                                                                                                                                                                                                       |
| `url`               | sin definir                              | URL WebSocket del app-server.                                                                                                                                                                                                            |
| `authToken`         | sin definir                              | Token Bearer para el transporte WebSocket.                                                                                                                                                                                                |
| `headers`           | `{}`                                     | Encabezados WebSocket adicionales.                                                                                                                                                                                                             |
| `clearEnv`          | `[]`                                     | Nombres adicionales de variables de entorno eliminados del proceso app-server stdio generado después de que OpenClaw construye su entorno heredado. `CODEX_HOME` y `HOME` están reservados para el aislamiento de Codex por agente de OpenClaw en lanzamientos locales. |
| `requestTimeoutMs`  | `60000`                                  | Tiempo de espera para llamadas del plano de control del app-server.                                                                                                                                                                                          |
| `mode`              | `"yolo"`                                 | Preajuste para ejecución YOLO o revisada por guardián.                                                                                                                                                                                      |
| `approvalPolicy`    | `"never"`                                | Política de aprobación nativa de Codex enviada al iniciar, reanudar o ejecutar un turno de hilo.                                                                                                                                                                       |
| `sandbox`           | `"danger-full-access"`                   | Modo sandbox nativo de Codex enviado al iniciar o reanudar un hilo.                                                                                                                                                                               |
| `approvalsReviewer` | `"user"`                                 | Usa `"auto_review"` para permitir que Codex revise las solicitudes de aprobación nativas. `guardian_subagent` sigue siendo un alias heredado.                                                                                                                         |
| `serviceTier`       | sin definir                              | Nivel de servicio opcional del app-server de Codex: `"fast"`, `"flex"` o `null`. Los valores heredados no válidos se ignoran.                                                                                                                            |

Las llamadas a herramientas dinámicas propiedad de OpenClaw se delimitan de forma independiente de
`appServer.requestTimeoutMs`: cada solicitud `item/tool/call` de Codex debe recibir
una respuesta de OpenClaw en un plazo de 30 segundos. Al agotarse el tiempo de espera, OpenClaw cancela la señal de la herramienta
cuando es compatible y devuelve una respuesta fallida de herramienta dinámica a Codex para que
el turno pueda continuar en lugar de dejar la sesión en `processing`.

Después de que OpenClaw responde a una solicitud del app-server con alcance de turno de Codex, el arnés
también espera que Codex finalice el turno nativo con `turn/completed`. Si el
app-server permanece en silencio durante 60 segundos después de esa respuesta, OpenClaw interrumpe el turno de Codex
en la medida de lo posible, registra un tiempo de espera de diagnóstico y libera el carril de sesión de
OpenClaw para que los mensajes de chat posteriores no queden en cola detrás de un turno
nativo obsoleto.

Las sobrescrituras de entorno siguen disponibles para pruebas locales:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN` omite el binario administrado cuando
`appServer.command` no está definido.

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` se eliminó. Usa
`plugins.entries.codex.config.appServer.mode: "guardian"` en su lugar, o
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` para pruebas locales puntuales. La configuración es
preferible para despliegues repetibles porque mantiene el comportamiento del plugin en el
mismo archivo revisado que el resto de la configuración del arnés de Codex.

## Uso de computadora

El uso de computadora está cubierto en su propia guía de configuración:
[Uso de computadora de Codex](/es/plugins/codex-computer-use).

La versión breve: OpenClaw no incluye como vendor la aplicación de control de escritorio ni ejecuta
acciones de escritorio por sí mismo. Prepara el app-server de Codex, verifica que el
servidor MCP `computer-use` esté disponible y luego permite que Codex maneje las llamadas
nativas a herramientas MCP durante los turnos en modo Codex.

Para acceso directo al controlador TryCua fuera del flujo del marketplace de Codex, registra
`cua-driver mcp` con `openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'`.
Consulta [Uso de computadora de Codex](/es/plugins/codex-computer-use) para conocer la distinción
entre el uso de computadora propiedad de Codex y el registro MCP directo.

Configuración mínima:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          computerUse: {
            autoInstall: true,
          },
        },
      },
    },
  },
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      agentRuntime: {
        id: "codex",
      },
    },
  },
}
```

La configuración se puede comprobar o instalar desde la superficie de comandos:

- `/codex computer-use status`
- `/codex computer-use install`
- `/codex computer-use install --source <marketplace-source>`
- `/codex computer-use install --marketplace-path <path>`

El uso de computadora es específico de macOS y puede requerir permisos locales del sistema operativo antes de que el
servidor MCP de Codex pueda controlar aplicaciones. Si `computerUse.enabled` es true y el servidor MCP
no está disponible, los turnos en modo Codex fallan antes de que el hilo se inicie en lugar de
ejecutarse silenciosamente sin las herramientas nativas de uso de computadora. Consulta
[Uso de computadora de Codex](/es/plugins/codex-computer-use) para conocer opciones de marketplace,
límites del catálogo remoto, motivos de estado y solución de problemas.

Cuando `computerUse.autoInstall` es true, OpenClaw puede registrar el marketplace estándar
incluido de Codex Desktop desde
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` si Codex
aún no ha descubierto un marketplace local. Usa `/new` o `/reset` después de
cambiar la configuración de runtime o de uso de computadora para que las sesiones existentes no mantengan un enlace antiguo
de PI o de hilo de Codex.

## Recetas comunes

Codex local con transporte stdio predeterminado:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
}
```

Validación del arnés solo con Codex:

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      agentRuntime: {
        id: "codex",
      },
    },
  },
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
}
```

Aprobaciones de Codex revisadas por guardián:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            mode: "guardian",
            approvalPolicy: "on-request",
            approvalsReviewer: "auto_review",
            sandbox: "workspace-write",
          },
        },
      },
    },
  },
}
```

App-server remoto con encabezados explícitos:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            transport: "websocket",
            url: "ws://gateway-host:39175",
            headers: {
              "X-OpenClaw-Agent": "main",
            },
          },
        },
      },
    },
  },
}
```

El cambio de modelo sigue controlado por OpenClaw. Cuando una sesión de OpenClaw está adjunta
a un hilo existente de Codex, el siguiente turno vuelve a enviar el modelo
OpenAI, proveedor, política de aprobación, sandbox y nivel de servicio actualmente seleccionados al
app-server. Cambiar de `openai/gpt-5.5` a `openai/gpt-5.2` conserva el
enlace del hilo, pero pide a Codex que continúe con el nuevo modelo seleccionado.

## Comando Codex

El Plugin incluido registra `/codex` como un comando de barra autorizado. Es
genérico y funciona en cualquier canal que admita comandos de texto de OpenClaw.

Formas comunes:

- `/codex status` muestra la conectividad activa del servidor de aplicación, los modelos, la cuenta, los límites de tasa, los servidores MCP y las Skills.
- `/codex models` enumera los modelos activos del servidor de aplicación de Codex.
- `/codex threads [filter]` enumera los hilos recientes de Codex.
- `/codex resume <thread-id>` adjunta la sesión actual de OpenClaw a un hilo existente de Codex.
- `/codex compact` solicita al servidor de aplicación de Codex que compacte el hilo adjunto.
- `/codex review` inicia la revisión nativa de Codex para el hilo adjunto.
- `/codex diagnostics [note]` pide confirmación antes de enviar comentarios de diagnóstico de Codex para el hilo adjunto.
- `/codex computer-use status` comprueba el Plugin Computer Use configurado y el servidor MCP.
- `/codex computer-use install` instala el Plugin Computer Use configurado y recarga los servidores MCP.
- `/codex account` muestra el estado de la cuenta y los límites de tasa.
- `/codex mcp` enumera el estado de los servidores MCP del servidor de aplicación de Codex.
- `/codex skills` enumera las Skills del servidor de aplicación de Codex.

### Flujo común de depuración

Cuando un agente respaldado por Codex hace algo inesperado en Telegram, Discord, Slack,
u otro canal, empieza con la conversación donde ocurrió el problema:

1. Ejecuta `/diagnostics bad tool choice after image upload` u otra nota breve
   que describa lo que viste.
2. Aprueba la solicitud de diagnóstico una vez. La aprobación crea el zip de
   diagnóstico del Gateway local y, como la sesión usa el arnés de Codex, también
   envía el paquete de comentarios relevante de Codex a los servidores de OpenAI.
3. Copia la respuesta de diagnóstico completada en el informe de error o hilo de soporte.
   Incluye la ruta del paquete local, el resumen de privacidad, los ids de sesión de OpenClaw,
   los ids de hilo de Codex y una línea `Inspect locally` para cada hilo de Codex.
4. Si quieres depurar la ejecución tú mismo, ejecuta el comando `Inspect locally`
   impreso en una terminal. Tiene el aspecto de `codex resume <thread-id>` y abre el
   hilo nativo de Codex para que puedas inspeccionar la conversación, continuarla localmente,
   o preguntarle a Codex por qué eligió una herramienta o plan en particular.

Usa `/codex diagnostics [note]` solo cuando quieras específicamente la carga de
comentarios de Codex para el hilo adjunto actualmente sin el paquete completo de
diagnóstico del Gateway de OpenClaw. Para la mayoría de los informes de soporte, `/diagnostics [note]` es
el mejor punto de partida porque vincula el estado del Gateway local y los ids de
hilo de Codex en una sola respuesta. Consulta [Exportación de diagnósticos](/es/gateway/diagnostics)
para ver el modelo completo de privacidad y el comportamiento en chats grupales.

El núcleo de OpenClaw también expone `/diagnostics [note]` solo para propietarios como el comando general de
diagnóstico del Gateway. Su solicitud de aprobación muestra el preámbulo de datos sensibles,
enlaza a [Exportación de diagnósticos](/es/gateway/diagnostics) y solicita
`openclaw gateway diagnostics export --json` mediante aprobación explícita de ejecución
cada vez. No apruebes diagnósticos con una regla de permitir todo. Tras la aprobación,
OpenClaw envía un informe pegable con la ruta del paquete local y el resumen del manifiesto.
Cuando la sesión activa de OpenClaw usa el arnés de Codex, esa misma aprobación también
autoriza el envío de los paquetes de comentarios relevantes de Codex a los servidores de
OpenAI. La solicitud de aprobación indica que se enviarán comentarios de Codex, pero
no enumera los ids de sesión o de hilo de Codex antes de la aprobación.

Si `/diagnostics` lo invoca un propietario en un chat grupal, OpenClaw mantiene limpio el
canal compartido: el grupo recibe solo un aviso breve, mientras que el
preámbulo de diagnóstico, las solicitudes de aprobación y los ids de sesión/hilo de Codex se envían al
propietario mediante la ruta de aprobación privada. Si no hay ruta privada de propietario,
OpenClaw rechaza la solicitud del grupo y pide al propietario que la ejecute desde un DM.

La carga aprobada de Codex llama a `feedback/upload` del servidor de aplicación de Codex y solicita al
servidor de aplicación que incluya registros de cada hilo enumerado y de los subhilos de Codex generados
cuando estén disponibles. La carga pasa por la ruta normal de comentarios de Codex hacia los servidores de OpenAI;
si los comentarios de Codex están desactivados en ese servidor de aplicación, el comando devuelve
el error del servidor de aplicación. La respuesta de diagnóstico completada enumera los canales,
los ids de sesión de OpenClaw, los ids de hilo de Codex y los comandos locales `codex resume <thread-id>`
para los hilos que se enviaron. Si deniegas o ignoras la aprobación,
OpenClaw no imprime esos ids de Codex. Esta carga no reemplaza la exportación local de
diagnóstico del Gateway.

`/codex resume` escribe el mismo archivo de vinculación sidecar que el arnés usa para
turnos normales. En el siguiente mensaje, OpenClaw reanuda ese hilo de Codex, pasa el
modelo de OpenClaw seleccionado actualmente al servidor de aplicación y mantiene habilitado el historial extendido.

### Inspeccionar un hilo de Codex desde la CLI

La forma más rápida de entender una mala ejecución de Codex suele ser abrir directamente el hilo nativo de Codex:

```sh
codex resume <thread-id>
```

Usa esto cuando detectes un error en una conversación de canal y quieras inspeccionar la
sesión problemática de Codex, continuarla localmente o preguntarle a Codex por qué tomó una
decisión concreta de herramienta o razonamiento. La ruta más sencilla suele ser ejecutar
`/diagnostics [note]` primero: después de aprobarlo, el informe completado enumera
cada hilo de Codex e imprime un comando `Inspect locally`, por ejemplo
`codex resume <thread-id>`. Puedes copiar ese comando directamente en una terminal.

También puedes obtener un id de hilo desde `/codex binding` para el chat actual o
`/codex threads [filter]` para hilos recientes del servidor de aplicación de Codex, y luego ejecutar el mismo
comando `codex resume` en tu shell.

La superficie de comandos requiere el servidor de aplicación de Codex `0.125.0` o posterior. Los métodos de
control individuales se informan como `unsupported by this Codex app-server` si un
servidor de aplicación futuro o personalizado no expone ese método JSON-RPC.

## Límites de hooks

El arnés de Codex tiene tres capas de hooks:

| Capa                                  | Propietario              | Propósito                                                           |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| Hooks de Plugin de OpenClaw           | OpenClaw                 | Compatibilidad de producto/Plugin entre arneses de PI y Codex.      |
| Middleware de extensión del servidor de aplicación de Codex | Plugins incluidos de OpenClaw | Comportamiento del adaptador por turno alrededor de herramientas dinámicas de OpenClaw. |
| Hooks nativos de Codex                | Codex                    | Ciclo de vida de bajo nivel de Codex y política de herramientas nativas desde la configuración de Codex. |

OpenClaw no usa archivos `hooks.json` de proyecto o globales de Codex para enrutar
comportamiento de Plugin de OpenClaw. Para el puente compatible de herramientas nativas y permisos,
OpenClaw inyecta configuración de Codex por hilo para `PreToolUse`, `PostToolUse`,
`PermissionRequest` y `Stop`. Otros hooks de Codex como `SessionStart` y
`UserPromptSubmit` siguen siendo controles de nivel Codex; no se exponen como
hooks de Plugin de OpenClaw en el contrato v1.

Para herramientas dinámicas de OpenClaw, OpenClaw ejecuta la herramienta después de que Codex solicita la
llamada, por lo que OpenClaw dispara el comportamiento de Plugin y middleware que posee en el
adaptador del arnés. Para herramientas nativas de Codex, Codex posee el registro canónico de la herramienta.
OpenClaw puede reflejar eventos seleccionados, pero no puede reescribir el hilo nativo de Codex
a menos que Codex exponga esa operación mediante el servidor de aplicación o callbacks de hooks nativos.

Compaction y las proyecciones del ciclo de vida del LLM provienen de las notificaciones del servidor de aplicación de Codex
y del estado del adaptador de OpenClaw, no de comandos de hooks nativos de Codex.
Los eventos `before_compaction`, `after_compaction`, `llm_input` y
`llm_output` de OpenClaw son observaciones de nivel adaptador, no capturas byte por byte
de la solicitud interna o las cargas de compactación de Codex.

Las notificaciones nativas `hook/started` y `hook/completed` del servidor de aplicación de Codex se
proyectan como eventos de agente `codex_app_server.hook` para trayectoria y depuración.
No invocan hooks de Plugin de OpenClaw.

## Contrato de soporte v1

El modo Codex no es PI con una llamada a modelo diferente por debajo. Codex posee más
del bucle nativo del modelo, y OpenClaw adapta sus superficies de Plugin y sesión
alrededor de ese límite.

Compatible en el runtime Codex v1:

| Superficie                                    | Soporte                                 | Motivo                                                                                                                                                                                               |
| --------------------------------------------- | --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Bucle de modelo de OpenAI a través de Codex   | Compatible                              | El servidor de aplicación de Codex posee el turno de OpenAI, la reanudación nativa del hilo y la continuación de herramientas nativas.                                                               |
| Enrutamiento y entrega de canales de OpenClaw | Compatible                              | Telegram, Discord, Slack, WhatsApp, iMessage y otros canales permanecen fuera del runtime del modelo.                                                                                                |
| Herramientas dinámicas de OpenClaw            | Compatible                              | Codex solicita a OpenClaw ejecutar estas herramientas, por lo que OpenClaw permanece en la ruta de ejecución.                                                                                        |
| Plugins de prompt y contexto                  | Compatible                              | OpenClaw construye superposiciones de prompt y proyecta contexto en el turno de Codex antes de iniciar o reanudar el hilo.                                                                           |
| Ciclo de vida del motor de contexto           | Compatible                              | El ensamblaje, la ingesta o el mantenimiento posterior al turno, y la coordinación de compactación del motor de contexto se ejecutan para los turnos de Codex.                                      |
| Hooks de herramientas dinámicas               | Compatible                              | `before_tool_call`, `after_tool_call` y el middleware de resultado de herramienta se ejecutan alrededor de herramientas dinámicas propiedad de OpenClaw.                                             |
| Hooks de ciclo de vida                        | Compatible como observaciones del adaptador | `llm_input`, `llm_output`, `agent_end`, `before_compaction` y `after_compaction` se disparan con cargas honestas del modo Codex.                                                                     |
| Puerta de revisión de respuesta final         | Compatible mediante el relevo de hook nativo | Codex `Stop` se releva a `before_agent_finalize`; `revise` solicita a Codex una pasada más del modelo antes de la finalización.                                                                      |
| Bloqueo u observación de shell, patch y MCP nativos | Compatible mediante el relevo de hook nativo | Codex `PreToolUse` y `PostToolUse` se relevan para superficies de herramientas nativas confirmadas, incluidas cargas MCP en el servidor de aplicación de Codex `0.125.0` o posterior. El bloqueo es compatible; la reescritura de argumentos no. |
| Política de permisos nativa                   | Compatible mediante el relevo de hook nativo | Codex `PermissionRequest` puede enrutarse a través de la política de OpenClaw donde el runtime la expone. Si OpenClaw no devuelve ninguna decisión, Codex continúa por su ruta normal de guardian o aprobación del usuario. |
| Captura de trayectoria del servidor de aplicación | Compatible                              | OpenClaw registra la solicitud que envió al servidor de aplicación y las notificaciones del servidor de aplicación que recibe.                                                                       |

No compatible en el runtime Codex v1:

| Superficie                                          | Límite de V1                                                                                                                                      | Ruta futura                                                                                 |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Mutación de argumentos de herramientas nativas      | Los hooks previos a herramientas nativos de Codex pueden bloquear, pero OpenClaw no reescribe argumentos de herramientas nativas de Codex.       | Requiere compatibilidad de hooks/esquemas de Codex para reemplazar la entrada de herramienta. |
| Historial editable de transcripción nativa de Codex | Codex posee el historial canónico del hilo nativo. OpenClaw posee un espejo y puede proyectar contexto futuro, pero no debe mutar internals no compatibles. | Agregar APIs explícitas del app-server de Codex si se necesita cirugía del hilo nativo.       |
| `tool_result_persist` para registros de herramientas nativas de Codex | Ese hook transforma escrituras de transcripción propiedad de OpenClaw, no registros de herramientas nativas de Codex.                            | Podría reflejar registros transformados, pero la reescritura canónica necesita soporte de Codex. |
| Metadatos ricos de compaction nativa                | OpenClaw observa el inicio y la finalización de la compaction, pero no recibe una lista estable de conservados/descartados, delta de tokens ni carga útil de resumen. | Necesita eventos de compaction de Codex más ricos.                                           |
| Intervención de compaction                          | Los hooks actuales de compaction de OpenClaw son de nivel de notificación en modo Codex.                                                          | Agregar hooks previos/posteriores de compaction de Codex si los plugins necesitan vetar o reescribir la compaction nativa. |
| Captura byte a byte de la solicitud de API del modelo | OpenClaw puede capturar solicitudes y notificaciones del app-server, pero el núcleo de Codex construye internamente la solicitud final a la API de OpenAI. | Necesita un evento de rastreo de solicitudes de modelo de Codex o una API de depuración.      |

## Herramientas, medios y compaction

El arnés de Codex solo cambia el ejecutor de agente integrado de bajo nivel.

OpenClaw sigue construyendo la lista de herramientas y recibe resultados dinámicos de herramientas desde el
arnés. Texto, imágenes, video, música, TTS, aprobaciones y salida de herramientas de mensajería
continúan por la ruta normal de entrega de OpenClaw.

El relay de hooks nativos es intencionalmente genérico, pero el contrato de soporte v1 está
limitado a las rutas de herramientas nativas de Codex y permisos que OpenClaw prueba. En
el runtime de Codex, eso incluye cargas útiles de shell, patch y MCP `PreToolUse`,
`PostToolUse` y `PermissionRequest`. No asumas que cada futuro evento de hook de
Codex sea una superficie de plugin de OpenClaw hasta que el contrato del runtime lo nombre.

Para `PermissionRequest`, OpenClaw solo devuelve decisiones explícitas de permitir o denegar
cuando la política decide. Un resultado sin decisión no es una autorización. Codex lo trata como
sin decisión de hook y cae a su propia ruta de guardian o aprobación del usuario.

Las solicitudes de aprobación de herramientas MCP de Codex se enrutan por el flujo de aprobación de
plugins de OpenClaw cuando Codex marca `_meta.codex_approval_kind` como
`"mcp_tool_call"`. Los prompts `request_user_input` de Codex se envían de vuelta al
chat de origen, y el siguiente mensaje de seguimiento en cola responde a esa solicitud nativa
del servidor en lugar de dirigirse como contexto adicional. Otras solicitudes de obtención MCP
siguen fallando de forma cerrada.

La dirección de la cola de ejecución activa se mapea a `turn/steer` del app-server de Codex. Con el
valor predeterminado `messages.queue.mode: "steer"`, OpenClaw agrupa los mensajes de chat en cola
durante la ventana de silencio configurada y los envía como una sola solicitud `turn/steer` en
orden de llegada. El modo heredado `queue` envía solicitudes `turn/steer` separadas. Los turnos de
revisión de Codex y compaction manual pueden rechazar la dirección en el mismo turno, en cuyo caso
OpenClaw usa la cola de seguimiento cuando el modo seleccionado permite fallback. Consulta
[Cola de dirección](/es/concepts/queue-steering).

Cuando el modelo seleccionado usa el arnés de Codex, la compaction del hilo nativo se
delega al app-server de Codex. OpenClaw mantiene un espejo de transcripción para el historial del canal,
búsqueda, `/new`, `/reset` y cambios futuros de modelo o arnés. El
espejo incluye el prompt del usuario, el texto final del asistente y registros ligeros de razonamiento
o plan de Codex cuando el app-server los emite. Hoy, OpenClaw solo
registra señales de inicio y finalización de compaction nativa. Todavía no expone un
resumen de compaction legible para humanos ni una lista auditable de qué entradas conservó Codex
después de la compaction.

Como Codex posee el hilo nativo canónico, `tool_result_persist` no
reescribe actualmente registros de resultados de herramientas nativas de Codex. Solo se aplica cuando
OpenClaw escribe un resultado de herramienta de transcripción de sesión propiedad de OpenClaw.

La generación de medios no requiere PI. Imágenes, video, música, PDF, TTS y comprensión
de medios siguen usando la configuración correspondiente de proveedor/modelo, como
`agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel` y
`messages.tts`.

## Solución de problemas

**Codex no aparece como un proveedor `/model` normal:** esto es esperado en
configuraciones nuevas. Selecciona un modelo `openai/gpt-*` con
`agentRuntime.id: "codex"` (o una referencia heredada `codex/*`), habilita
`plugins.entries.codex.enabled` y comprueba si `plugins.allow` excluye
`codex`.

**OpenClaw usa PI en lugar de Codex:** `agentRuntime.id: "auto"` todavía puede usar PI como el
backend de compatibilidad cuando ningún arnés de Codex reclama la ejecución. Configura
`agentRuntime.id: "codex"` para forzar la selección de Codex durante las pruebas. Un
runtime de Codex forzado falla en lugar de recurrir a PI. Una vez seleccionado el app-server de Codex,
sus fallos se muestran directamente.

**El app-server se rechaza:** actualiza Codex para que el handshake del app-server
informe la versión `0.125.0` o una más reciente. Las versiones preliminares de la misma versión o con sufijo de compilación,
como `0.125.0-alpha.2` o `0.125.0+custom`, se rechazan porque el
piso estable del protocolo `0.125.0` es lo que OpenClaw prueba.

**El descubrimiento de modelos es lento:** reduce `plugins.entries.codex.config.discovery.timeoutMs`
o deshabilita el descubrimiento.

**El transporte WebSocket falla de inmediato:** comprueba `appServer.url`, `authToken`
y que el app-server remoto hable la misma versión del protocolo app-server de Codex.

**Un modelo que no es Codex usa PI:** esto es esperado a menos que hayas forzado
`agentRuntime.id: "codex"` para ese agente o seleccionado una referencia heredada
`codex/*`. Las referencias simples `openai/gpt-*` y de otros proveedores permanecen en su ruta normal
de proveedor en modo `auto`. Si fuerzas `agentRuntime.id: "codex"`, cada turno integrado
para ese agente debe ser un modelo de OpenAI compatible con Codex.

**Computer Use está instalado pero las herramientas no se ejecutan:** comprueba
`/codex computer-use status` desde una sesión nueva. Si una herramienta informa
`Native hook relay unavailable`, usa `/new` o `/reset`; si persiste, reinicia
el Gateway para borrar registros obsoletos de hooks nativos. Si `computer-use.list_apps`
agota el tiempo de espera, reinicia Codex Computer Use o Codex Desktop y vuelve a intentarlo.

## Relacionado

- [Plugins de arnés de agente](/es/plugins/sdk-agent-harness)
- [Runtimes de agente](/es/concepts/agent-runtimes)
- [Proveedores de modelos](/es/concepts/model-providers)
- [Proveedor OpenAI](/es/providers/openai)
- [Estado](/es/cli/status)
- [Hooks de plugins](/es/plugins/hooks)
- [Referencia de configuración](/es/gateway/configuration-reference)
- [Pruebas](/es/help/testing-live#live-codex-app-server-harness-smoke)
