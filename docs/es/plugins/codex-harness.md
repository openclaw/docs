---
read_when:
    - Quieres usar el arnés de app-server incluido con Codex
    - Necesitas ejemplos de configuración del entorno de ejecución de Codex
    - Desea que los despliegues solo de Codex fallen en lugar de recurrir a PI
summary: Ejecuta turnos del agente integrado de OpenClaw mediante el entorno de pruebas app-server de Codex incluido.
title: Arnés de Codex
x-i18n:
    generated_at: "2026-05-02T23:39:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8ffa0cbb28422b2ed8d7c0eef6ee0222072c523d170b4b33597bb37bd3fa9700
    source_path: plugins/codex-harness.md
    workflow: 16
---

El plugin `codex` incluido permite que OpenClaw ejecute turnos de agente embebidos a través del
app-server de Codex en lugar del arnés PI integrado.

Usa esto cuando quieras que Codex sea propietario de la sesión de agente de bajo nivel: descubrimiento de
modelos, reanudación nativa de hilos, compaction nativa y ejecución en app-server.
OpenClaw sigue siendo propietario de los canales de chat, archivos de sesión, selección de modelos, herramientas,
aprobaciones, entrega de medios y el espejo visible de la transcripción.

Cuando un turno de chat de origen se ejecuta a través del arnés de Codex, las respuestas visibles usan de forma predeterminada
la herramienta `message` de OpenClaw si el despliegue no configuró explícitamente
`messages.visibleReplies`. El agente aún puede finalizar su turno de Codex de forma privada;
solo publica en el canal cuando llama a `message(action="send")`. Establece
`messages.visibleReplies: "automatic"` para mantener las respuestas finales de chat directo en la
ruta heredada de entrega automática.

Los turnos de heartbeat de Codex también reciben la herramienta `heartbeat_respond` de forma predeterminada, para que el
agente pueda registrar si la activación debe permanecer silenciosa o notificar sin codificar
ese flujo de control en el texto final.

Si intentas orientarte, empieza con
[Runtime de agentes](/es/concepts/agent-runtimes). La versión breve es:
`openai/gpt-5.5` es la referencia de modelo, `codex` es el runtime, y Telegram,
Discord, Slack u otro canal sigue siendo la superficie de comunicación.

## Configuración rápida

La mayoría de usuarios que quieren "Codex en OpenClaw" quieren esta ruta: iniciar sesión con una
suscripción de ChatGPT/Codex y luego ejecutar turnos de agente embebidos mediante el runtime nativo
del app-server de Codex. La referencia de modelo sigue siendo canónica como
`openai/gpt-*`; la autenticación de suscripción viene de la cuenta/perfil de Codex, no
de un prefijo de modelo `openai-codex/*`.

Primero inicia sesión con Codex OAuth si todavía no lo hiciste:

```bash
openclaw models auth login --provider openai-codex
```

Luego habilita el plugin `codex` incluido y fuerza el runtime de Codex:

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
        fallback: "none",
      },
    },
  },
}
```

Si tu configuración usa `plugins.allow`, incluye también `codex` ahí:

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

No uses `openai-codex/gpt-*` cuando te refieras al runtime nativo de Codex. Ese prefijo
es la ruta explícita de "Codex OAuth a través de PI". Los cambios de configuración se aplican a sesiones nuevas o
restablecidas; las sesiones existentes conservan su runtime registrado.

## Qué cambia este plugin

El plugin `codex` incluido aporta varias capacidades separadas:

| Capacidad                         | Cómo lo usas                                        | Qué hace                                                                       |
| --------------------------------- | --------------------------------------------------- | ----------------------------------------------------------------------------- |
| Runtime embebido nativo           | `agentRuntime.id: "codex"`                          | Ejecuta turnos de agente embebidos de OpenClaw a través del app-server de Codex. |
| Comandos nativos de control de chat | `/codex bind`, `/codex resume`, `/codex steer`, ... | Vincula y controla hilos del app-server de Codex desde una conversación de mensajería. |
| Proveedor/catálogo del app-server de Codex | Internos de `codex`, expuestos a través del arnés | Permite que el runtime descubra y valide modelos del app-server.              |
| Ruta de comprensión de medios de Codex | Rutas de compatibilidad de modelos de imagen `codex/*` | Ejecuta turnos acotados del app-server de Codex para modelos compatibles de comprensión de imágenes. |
| Reenvío de hooks nativos          | Hooks de plugin alrededor de eventos nativos de Codex | Permite que OpenClaw observe/bloquee eventos compatibles de herramientas/finalización nativos de Codex. |

Habilitar el plugin deja esas capacidades disponibles. **No**:

- empieza a usar Codex para todos los modelos de OpenAI
- convierte referencias de modelo `openai-codex/*` al runtime nativo
- convierte ACP/acpx en la ruta predeterminada de Codex
- cambia en caliente sesiones existentes que ya registraron un runtime PI
- reemplaza la entrega por canales de OpenClaw, archivos de sesión, almacenamiento de perfiles de autenticación o
  enrutamiento de mensajes

El mismo plugin también posee la superficie nativa de comandos de control de chat `/codex`. Si
el plugin está habilitado y el usuario pide vincular, reanudar, dirigir, detener o inspeccionar
hilos de Codex desde el chat, los agentes deben preferir `/codex ...` sobre ACP. ACP sigue siendo
el fallback explícito cuando el usuario pide ACP/acpx o está probando el adaptador ACP
de Codex.

Los turnos nativos de Codex mantienen los hooks de plugin de OpenClaw como la capa pública de compatibilidad.
Estos son hooks en proceso de OpenClaw, no hooks de comandos `hooks.json` de Codex:

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `before_tool_call`, `after_tool_call`
- `before_message_write` para registros de transcripción reflejados
- `before_agent_finalize` a través del reenvío `Stop` de Codex
- `agent_end`

Los plugins también pueden registrar middleware neutral al runtime para resultados de herramientas, a fin de reescribir
los resultados de herramientas dinámicas de OpenClaw después de que OpenClaw ejecuta la herramienta y antes de que el
resultado se devuelva a Codex. Esto es independiente del hook público de plugin
`tool_result_persist`, que transforma escrituras de resultados de herramientas de transcripción propiedad de OpenClaw.

Para la semántica de los hooks de plugin en sí, consulta [Hooks de plugin](/es/plugins/hooks)
y [Comportamiento de guardia de plugin](/es/tools/plugin).

El arnés está desactivado de forma predeterminada. Las configuraciones nuevas deben mantener las referencias de modelo de OpenAI
canónicas como `openai/gpt-*` y forzar explícitamente
`agentRuntime.id: "codex"` u `OPENCLAW_AGENT_RUNTIME=codex` cuando
quieran ejecución nativa en app-server. Las referencias de modelo heredadas `codex/*` todavía seleccionan automáticamente
el arnés por compatibilidad, pero los prefijos de proveedor heredados respaldados por runtime
no se muestran como opciones normales de modelo/proveedor.

Si el plugin `codex` está habilitado pero el modelo principal sigue siendo
`openai-codex/*`, `openclaw doctor` advierte en lugar de cambiar la ruta. Eso es
intencional: `openai-codex/*` sigue siendo la ruta PI de OAuth/suscripción de Codex, y
la ejecución nativa en app-server permanece como una elección explícita de runtime.

## Mapa de rutas

Usa esta tabla antes de cambiar la configuración:

| Comportamiento deseado                              | Referencia de modelo       | Configuración de runtime              | Ruta de autenticación/perfil | Etiqueta de estado esperada    |
| ---------------------------------------------------- | -------------------------- | -------------------------------------- | ---------------------------- | ------------------------------ |
| Suscripción de ChatGPT/Codex con runtime nativo de Codex | `openai/gpt-*`             | `agentRuntime.id: "codex"`             | Codex OAuth o cuenta de Codex | `Runtime: OpenAI Codex`        |
| OpenAI API mediante el ejecutor normal de OpenClaw   | `openai/gpt-*`             | omitido o `runtime: "pi"`              | Clave de OpenAI API          | `Runtime: OpenClaw Pi Default` |
| Suscripción de ChatGPT/Codex a través de PI          | `openai-codex/gpt-*`       | omitido o `runtime: "pi"`              | Proveedor OpenAI Codex OAuth | `Runtime: OpenClaw Pi Default` |
| Proveedores mixtos con modo automático conservador   | referencias específicas del proveedor | `agentRuntime.id: "auto"`              | Por proveedor seleccionado   | Depende del runtime seleccionado |
| Sesión explícita del adaptador ACP de Codex          | dependiente de prompt/modelo ACP | `sessions_spawn` con `runtime: "acp"` | Autenticación del backend ACP | Estado de tarea/sesión ACP     |

La separación importante es proveedor frente a runtime:

- `openai-codex/*` responde "¿qué ruta de proveedor/autenticación debe usar PI?"
- `agentRuntime.id: "codex"` responde "¿qué bucle debe ejecutar este
  turno embebido?"
- `/codex ...` responde "¿a qué conversación nativa de Codex debe vincularse o
  controlar este chat?"
- ACP responde "¿qué proceso de arnés externo debe lanzar acpx?"

## Elige el prefijo de modelo correcto

Las rutas de la familia OpenAI son específicas del prefijo. Para la configuración común de suscripción más
runtime nativo de Codex, usa `openai/*` con `agentRuntime.id: "codex"`.
Usa `openai-codex/*` solo cuando quieras intencionalmente Codex OAuth a través de PI:

| Referencia de modelo                         | Ruta de runtime                              | Cuándo usarlo                                                            |
| --------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------- |
| `openai/gpt-5.4`                              | Proveedor OpenAI mediante la plomería OpenClaw/PI | Quieres acceso actual directo a OpenAI Platform API con `OPENAI_API_KEY`. |
| `openai-codex/gpt-5.5`                        | OpenAI Codex OAuth mediante OpenClaw/PI      | Quieres autenticación de suscripción ChatGPT/Codex con el ejecutor PI predeterminado. |
| `openai/gpt-5.5` + `agentRuntime.id: "codex"` | Arnés del app-server de Codex                | Quieres autenticación de suscripción ChatGPT/Codex con ejecución nativa de Codex. |

GPT-5.5 puede aparecer tanto en rutas directas con clave de OpenAI API como en rutas de suscripción de Codex
cuando tu cuenta las expone. Usa `openai/gpt-5.5` con el arnés del app-server de Codex
para runtime nativo de Codex, `openai-codex/gpt-5.5` para OAuth por PI, o
`openai/gpt-5.5` sin una anulación de runtime de Codex para tráfico directo con clave de API.

Las referencias heredadas `codex/gpt-*` siguen aceptándose como alias de compatibilidad. La migración
de compatibilidad de doctor reescribe las referencias heredadas de runtime principal a referencias de modelo canónicas
y registra la política de runtime por separado, mientras que las referencias heredadas solo de fallback
se dejan sin cambios porque el runtime se configura para todo el contenedor del agente.
Las nuevas configuraciones de PI Codex OAuth deben usar `openai-codex/gpt-*`; las nuevas configuraciones de arnés
nativo de app-server deben usar `openai/gpt-*` más
`agentRuntime.id: "codex"`.

`agents.defaults.imageModel` sigue la misma separación de prefijos. Usa
`openai-codex/gpt-*` cuando la comprensión de imágenes deba ejecutarse mediante la ruta del proveedor OpenAI
Codex OAuth. Usa `codex/gpt-*` cuando la comprensión de imágenes deba ejecutarse
mediante un turno acotado del app-server de Codex. El modelo del app-server de Codex debe
anunciar compatibilidad con entrada de imagen; los modelos de Codex solo de texto fallan antes de que
comience el turno de medios.

Usa `/status` para confirmar el arnés efectivo de la sesión actual. Si la
selección sorprende, habilita el registro de depuración para el subsistema `agents/harness`
e inspecciona el registro estructurado `agent harness selected` del gateway. Incluye
el id del arnés seleccionado, motivo de selección, política de runtime/fallback y,
en modo `auto`, el resultado de compatibilidad de cada candidato de plugin.

### Qué significan las advertencias de doctor

`openclaw doctor` advierte cuando todo esto es verdadero:

- el plugin `codex` incluido está habilitado o permitido
- el modelo principal de un agente es `openai-codex/*`
- el runtime efectivo de ese agente no es `codex`

Esa advertencia existe porque los usuarios a menudo esperan que "plugin Codex habilitado" implique
"runtime nativo del app-server de Codex." OpenClaw no da ese salto. La advertencia
significa:

- **No se requiere ningún cambio** si querías ChatGPT/Codex OAuth a través de PI.
- Cambia el modelo a `openai/<model>` y establece
  `agentRuntime.id: "codex"` si querías ejecución nativa
  en app-server.
- Las sesiones existentes aún necesitan `/new` o `/reset` después de un cambio de runtime,
  porque las fijaciones de runtime de sesión son persistentes.

La selección de arnés no es un control de sesión en vivo. Cuando se ejecuta un turno embebido,
OpenClaw registra el id de arnés seleccionado en esa sesión y sigue usándolo para
turnos posteriores en el mismo id de sesión. Cambia la configuración de `agentRuntime` o
`OPENCLAW_AGENT_RUNTIME` cuando quieras que sesiones futuras usen otro arnés;
usa `/new` o `/reset` para iniciar una sesión nueva antes de cambiar una conversación existente
entre PI y Codex. Esto evita reproducir una transcripción por dos sistemas de sesión nativos
incompatibles.

Las sesiones heredadas creadas antes de las fijaciones de arnés se tratan como fijadas a PI una vez que
tienen historial de transcripción. Usa `/new` o `/reset` para optar esa conversación por
Codex después de cambiar la configuración.

`/status` muestra el runtime efectivo del modelo. El arnés PI predeterminado aparece como
`Runtime: OpenClaw Pi Default`, y el arnés del app-server Codex aparece como
`Runtime: OpenAI Codex`.

## Requisitos

- OpenClaw con el plugin `codex` incluido disponible.
- App-server Codex `0.125.0` o más reciente. El plugin incluido administra de forma predeterminada un binario de app-server Codex compatible, por lo que los comandos locales `codex` en `PATH` no afectan el inicio normal del arnés.
- Autenticación de Codex disponible para el proceso del app-server o para el puente de autenticación Codex de OpenClaw. Los inicios locales del app-server usan un inicio de Codex administrado por OpenClaw para cada agente y un `HOME` secundario aislado, por lo que de forma predeterminada no leen tu cuenta personal `~/.codex`, Skills, plugins, configuración, estado de hilos ni `$HOME/.agents/skills` nativos.

El plugin bloquea handshakes de app-server antiguos o sin versión. Eso mantiene a OpenClaw en la superficie de protocolo contra la que se ha probado.

Para pruebas smoke en vivo y en Docker, la autenticación normalmente proviene de la cuenta de la CLI Codex o de un perfil de autenticación `openai-codex` de OpenClaw. Los inicios locales de app-server por stdio también pueden recurrir a `CODEX_API_KEY` / `OPENAI_API_KEY` cuando no hay ninguna cuenta presente.

## Archivos de bootstrap del workspace

Codex maneja `AGENTS.md` por sí mismo mediante el descubrimiento nativo de documentación de proyecto. OpenClaw no escribe archivos sintéticos de documentación de proyecto Codex ni depende de nombres de archivo fallback de Codex para archivos de persona, porque los fallbacks de Codex solo se aplican cuando falta `AGENTS.md`.

Para paridad del workspace de OpenClaw, el arnés Codex resuelve los otros archivos de bootstrap (`SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` y `MEMORY.md` cuando están presentes) y los reenvía mediante instrucciones de configuración de Codex en `thread/start` y `thread/resume`. Esto mantiene visible `SOUL.md` y el contexto relacionado de persona/perfil del workspace sin duplicar `AGENTS.md`.

## Agregar Codex junto con otros modelos

No establezcas `agentRuntime.id: "codex"` globalmente si el mismo agente debe cambiar libremente entre Codex y modelos de proveedores que no sean Codex. Un runtime forzado se aplica a cada turno integrado de ese agente o sesión. Si seleccionas un modelo de Anthropic mientras ese runtime está forzado, OpenClaw sigue intentando usar el arnés Codex y falla cerrado en lugar de enrutar silenciosamente ese turno a través de PI.

Usa una de estas formas en su lugar:

- Coloca Codex en un agente dedicado con `agentRuntime.id: "codex"`.
- Mantén el agente predeterminado en `agentRuntime.id: "auto"` y fallback PI para el uso normal mixto de proveedores.
- Usa referencias heredadas `codex/*` solo por compatibilidad. Las configuraciones nuevas deberían preferir `openai/*` más una política explícita de runtime Codex.

Por ejemplo, esto mantiene el agente predeterminado en la selección automática normal y agrega un agente Codex separado:

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
        fallback: "pi",
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

- El agente predeterminado `main` usa la ruta normal del proveedor y el fallback de compatibilidad PI.
- El agente `codex` usa el arnés del app-server Codex.
- Si Codex falta o no es compatible para el agente `codex`, el turno falla en lugar de usar PI discretamente.

## Enrutamiento de comandos de agentes

Los agentes deberían enrutar las solicitudes de usuario por intención, no solo por la palabra "Codex":

| El usuario pide...                                      | El agente debería usar...                         |
| ------------------------------------------------------ | ------------------------------------------------ |
| "Vincula este chat a Codex"                            | `/codex bind`                                    |
| "Reanuda el hilo Codex `<id>` aquí"                    | `/codex resume <id>`                             |
| "Muestra los hilos Codex"                              | `/codex threads`                                 |
| "Presenta un reporte de soporte por una ejecución incorrecta de Codex" | `/diagnostics [note]`                            |
| "Envía solo feedback de Codex para este hilo adjunto"  | `/codex diagnostics [note]`                      |
| "Usa mi suscripción de ChatGPT/Codex con el runtime Codex" | `openai/*` más `agentRuntime.id: "codex"`        |
| "Usa mi suscripción de ChatGPT/Codex a través de PI"   | referencias de modelo `openai-codex/*`           |
| "Ejecuta Codex mediante ACP/acpx"                      | ACP `sessions_spawn({ runtime: "acp", ... })`    |
| "Inicia Claude Code/Gemini/OpenCode/Cursor en un hilo" | ACP/acpx, no `/codex` ni subagentes nativos      |

OpenClaw solo anuncia orientación de spawn de ACP a los agentes cuando ACP está habilitado, es despachable y está respaldado por un backend de runtime cargado. Si ACP no está disponible, el prompt del sistema y las Skills del plugin no deberían enseñar al agente sobre el enrutamiento de ACP.

## Despliegues solo de Codex

Fuerza el arnés Codex cuando necesites probar que cada turno de agente integrado usa Codex. Los runtimes explícitos de plugin tienen de forma predeterminada ningún fallback PI, por lo que `fallback: "none"` es opcional, pero a menudo resulta útil como documentación:

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      agentRuntime: {
        id: "codex",
        fallback: "none",
      },
    },
  },
}
```

Anulación por entorno:

```bash
OPENCLAW_AGENT_RUNTIME=codex openclaw gateway run
```

Con Codex forzado, OpenClaw falla temprano si el plugin Codex está deshabilitado, el app-server es demasiado antiguo o el app-server no puede iniciarse. Establece `OPENCLAW_AGENT_HARNESS_FALLBACK=pi` solo si quieres intencionalmente que PI maneje la selección de arnés faltante.

## Codex por agente

Puedes hacer que un agente sea solo Codex mientras el agente predeterminado conserva la autoselección normal:

```json5
{
  agents: {
    defaults: {
      agentRuntime: {
        id: "auto",
        fallback: "pi",
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
          fallback: "none",
        },
      },
    ],
  },
}
```

Usa los comandos normales de sesión para cambiar agentes y modelos. `/new` crea una sesión nueva de OpenClaw y el arnés Codex crea o reanuda su hilo sidecar de app-server según sea necesario. `/reset` borra la vinculación de sesión de OpenClaw para ese hilo y permite que el siguiente turno vuelva a resolver el arnés desde la configuración actual.

## Descubrimiento de modelos

De forma predeterminada, el plugin Codex pide al app-server los modelos disponibles. Si el descubrimiento falla o agota el tiempo, usa un catálogo fallback incluido para:

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

Deshabilita el descubrimiento cuando quieras que el inicio evite sondear Codex y se mantenga en el catálogo fallback:

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

De forma predeterminada, el plugin inicia localmente el binario Codex administrado por OpenClaw con:

```bash
codex app-server --listen stdio://
```

El binario administrado se envía con el paquete del plugin `codex`. Esto mantiene la versión del app-server vinculada al plugin incluido en lugar de a cualquier CLI Codex separada que esté instalada localmente. Establece `appServer.command` solo cuando quieras intencionalmente ejecutar un ejecutable diferente.

De forma predeterminada, OpenClaw inicia las sesiones locales del arnés Codex en modo YOLO: `approvalPolicy: "never"`, `approvalsReviewer: "user"` y `sandbox: "danger-full-access"`. Esta es la postura de operador local de confianza usada para heartbeats autónomos: Codex puede usar herramientas de shell y red sin detenerse ante prompts de aprobación nativos que no hay nadie disponible para responder.

Para optar por aprobaciones revisadas por el guardián de Codex, establece `appServer.mode:
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

El modo Guardian usa la ruta de aprobación con autorrevisión nativa de Codex. Cuando Codex pide salir del sandbox, escribir fuera del workspace o agregar permisos como acceso de red, Codex enruta esa solicitud de aprobación al revisor nativo en lugar de a un prompt humano. El revisor aplica el marco de riesgo de Codex y aprueba o deniega la solicitud específica. Usa Guardian cuando quieras más protecciones que en el modo YOLO, pero aún necesites que los agentes desatendidos progresen.

El preset `guardian` se expande a `approvalPolicy: "on-request"`, `approvalsReviewer: "auto_review"` y `sandbox: "workspace-write"`. Los campos de política individuales siguen anulando `mode`, por lo que los despliegues avanzados pueden combinar el preset con opciones explícitas. El valor de revisor anterior `guardian_subagent` todavía se acepta como alias de compatibilidad, pero las configuraciones nuevas deberían usar `auto_review`.

Para un app-server que ya está en ejecución, usa transporte WebSocket:

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

Los inicios del app-server por stdio heredan de forma predeterminada el entorno de proceso de OpenClaw, pero OpenClaw posee el puente de cuenta del app-server Codex y establece tanto `CODEX_HOME` como `HOME` en directorios por agente bajo el estado de OpenClaw de ese agente. El cargador de Skills propio de Codex lee `$CODEX_HOME/skills` y `$HOME/.agents/skills`, por lo que ambos valores están aislados para los inicios locales del app-server. Eso mantiene las Skills nativas de Codex, plugins, configuración, cuentas y estado de hilos limitados al agente de OpenClaw en lugar de filtrarse desde el inicio personal de la CLI Codex del operador.

Los plugins de OpenClaw y las instantáneas de Skills de OpenClaw siguen fluyendo a través del registro de plugins y el cargador de Skills propios de OpenClaw. Los recursos personales de la CLI Codex no lo hacen. Si tienes Skills o plugins útiles de la CLI Codex que deberían pasar a formar parte de un agente de OpenClaw, inventaríalos explícitamente:

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

El proveedor de migración de Codex copia Skills al workspace del agente de OpenClaw actual. Los plugins nativos, hooks y archivos de configuración de Codex se reportan o archivan para revisión manual en lugar de activarse automáticamente, porque pueden ejecutar comandos, exponer servidores MCP o portar credenciales.

La autenticación se selecciona en este orden:

1. Un perfil explícito de autenticación Codex de OpenClaw para el agente.
2. La cuenta existente del app-server en el inicio de Codex de ese agente.
3. Solo para inicios locales de app-server por stdio, `CODEX_API_KEY`, luego `OPENAI_API_KEY`, cuando no hay ninguna cuenta de app-server presente y la autenticación de OpenAI sigue siendo necesaria.

Cuando OpenClaw ve un perfil de autenticación Codex de estilo suscripción ChatGPT, elimina `CODEX_API_KEY` y `OPENAI_API_KEY` del proceso secundario Codex generado. Eso mantiene las claves de API de nivel Gateway disponibles para embeddings o modelos directos de OpenAI sin hacer que los turnos nativos del app-server Codex se facturen accidentalmente a través de la API. Los perfiles explícitos de clave de API Codex y el fallback local por clave de entorno stdio usan inicio de sesión del app-server en lugar de entorno heredado del proceso secundario. Las conexiones de app-server por WebSocket no reciben fallback de clave de API del entorno del Gateway; usa un perfil de autenticación explícito o la cuenta propia del app-server remoto.

Si un despliegue necesita aislamiento adicional del entorno, agrega esas variables a `appServer.clearEnv`:

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

`appServer.clearEnv` solo afecta al proceso hijo app-server de Codex generado.

Las herramientas dinámicas de Codex usan de forma predeterminada el perfil `native-first`. En ese modo,
OpenClaw no expone herramientas dinámicas que duplican las operaciones de espacio de trabajo
nativas de Codex: `read`, `write`, `edit`, `apply_patch`, `exec`, `process` y
`update_plan`. Las herramientas de integración de OpenClaw, como mensajería, sesiones, medios,
cron, navegador, nodos, gateway, `heartbeat_respond` y `web_search`, siguen
disponibles.

Campos de nivel superior compatibles del Plugin Codex:

| Campo                      | Valor predeterminado | Significado                                                                                   |
| -------------------------- | -------------------- | --------------------------------------------------------------------------------------------- |
| `codexDynamicToolsProfile` | `"native-first"`     | Usa `"openclaw-compat"` para exponer el conjunto completo de herramientas dinámicas de OpenClaw al app-server de Codex. |
| `codexDynamicToolsExclude` | `[]`                 | Nombres adicionales de herramientas dinámicas de OpenClaw que se omitirán en los turnos del app-server de Codex. |

Campos `appServer` compatibles:

| Campo               | Valor predeterminado                    | Significado                                                                                                                                                                                                                              |
| ------------------- | ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`         | `"stdio"`                                | `"stdio"` genera Codex; `"websocket"` se conecta a `url`.                                                                                                                                                                                |
| `command`           | binario gestionado de Codex              | Ejecutable para el transporte stdio. Déjalo sin establecer para usar el binario gestionado; establécelo solo para una anulación explícita.                                                                                               |
| `args`              | `["app-server", "--listen", "stdio://"]` | Argumentos para el transporte stdio.                                                                                                                                                                                                     |
| `url`               | sin establecer                           | URL del app-server WebSocket.                                                                                                                                                                                                            |
| `authToken`         | sin establecer                           | Token Bearer para el transporte WebSocket.                                                                                                                                                                                               |
| `headers`           | `{}`                                     | Encabezados WebSocket adicionales.                                                                                                                                                                                                       |
| `clearEnv`          | `[]`                                     | Nombres adicionales de variables de entorno eliminados del proceso app-server stdio generado después de que OpenClaw construye su entorno heredado. `CODEX_HOME` y `HOME` están reservados para el aislamiento de Codex por agente de OpenClaw en lanzamientos locales. |
| `requestTimeoutMs`  | `60000`                                  | Tiempo de espera para llamadas del plano de control del app-server.                                                                                                                                                                      |
| `mode`              | `"yolo"`                                 | Preajuste para ejecución YOLO o revisada por guardian.                                                                                                                                                                                   |
| `approvalPolicy`    | `"never"`                                | Política de aprobación nativa de Codex enviada al iniciar/reanudar hilo/turno.                                                                                                                                                           |
| `sandbox`           | `"danger-full-access"`                   | Modo sandbox nativo de Codex enviado al iniciar/reanudar hilo.                                                                                                                                                                           |
| `approvalsReviewer` | `"user"`                                 | Usa `"auto_review"` para permitir que Codex revise las solicitudes de aprobación nativas. `guardian_subagent` sigue siendo un alias heredado.                                                                                           |
| `serviceTier`       | sin establecer                           | Nivel de servicio opcional del app-server de Codex: `"fast"`, `"flex"` o `null`. Los valores heredados no válidos se ignoran.                                                                                                           |

Las llamadas a herramientas dinámicas propiedad de OpenClaw se acotan de forma independiente de
`appServer.requestTimeoutMs`: cada solicitud `item/tool/call` de Codex debe recibir
una respuesta de OpenClaw en un plazo de 30 segundos. En caso de tiempo de espera, OpenClaw aborta la señal de la herramienta
cuando es compatible y devuelve una respuesta fallida de herramienta dinámica a Codex para que
el turno pueda continuar en lugar de dejar la sesión en `processing`.

Después de que OpenClaw responde a una solicitud app-server de Codex con alcance de turno, el arnés
también espera que Codex finalice el turno nativo con `turn/completed`. Si el
app-server queda en silencio durante 60 segundos después de esa respuesta, OpenClaw interrumpe
el turno de Codex en la medida de lo posible, registra un tiempo de espera de diagnóstico y libera la
línea de sesión de OpenClaw para que los mensajes de chat de seguimiento no queden en cola detrás de un turno
nativo obsoleto.

Las anulaciones de entorno siguen disponibles para pruebas locales:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN` omite el binario gestionado cuando
`appServer.command` no está establecido.

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` se eliminó. Usa
`plugins.entries.codex.config.appServer.mode: "guardian"` en su lugar, o
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` para pruebas locales puntuales. Se
prefiere la configuración para despliegues repetibles porque mantiene el comportamiento del Plugin en el
mismo archivo revisado que el resto de la configuración del arnés de Codex.

## Uso de la computadora

Computer Use se cubre en su propia guía de configuración:
[Computer Use de Codex](/es/plugins/codex-computer-use).

La versión breve: OpenClaw no incorpora la app de control de escritorio ni ejecuta
acciones de escritorio por sí mismo. Prepara el app-server de Codex, verifica que el
servidor MCP `computer-use` esté disponible y luego permite que Codex gestione las llamadas nativas
a herramientas MCP durante los turnos en modo Codex.

Para acceso directo al controlador TryCua fuera del flujo del marketplace de Codex, registra
`cua-driver mcp` con `openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'`.
Consulta [Computer Use de Codex](/es/plugins/codex-computer-use) para ver la distinción
entre Computer Use propiedad de Codex y el registro MCP directo.

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
        fallback: "none",
      },
    },
  },
}
```

La configuración puede comprobarse o instalarse desde la superficie de comandos:

- `/codex computer-use status`
- `/codex computer-use install`
- `/codex computer-use install --source <marketplace-source>`
- `/codex computer-use install --marketplace-path <path>`

Computer Use es específico de macOS y puede requerir permisos locales del sistema operativo antes de que el
servidor MCP de Codex pueda controlar apps. Si `computerUse.enabled` es true y el servidor MCP
no está disponible, los turnos en modo Codex fallan antes de que se inicie el hilo, en lugar de
ejecutarse silenciosamente sin las herramientas nativas de Computer Use. Consulta
[Computer Use de Codex](/es/plugins/codex-computer-use) para conocer las opciones de marketplace,
los límites del catálogo remoto, los motivos de estado y la solución de problemas.

Cuando `computerUse.autoInstall` es true, OpenClaw puede registrar el marketplace estándar
incluido de Codex Desktop desde
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` si Codex
aún no ha descubierto un marketplace local. Usa `/new` o `/reset` después de
cambiar la configuración de tiempo de ejecución o de Computer Use para que las sesiones existentes no conserven una vinculación antigua
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

Validación del arnés solo de Codex:

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

Aprobaciones de Codex revisadas por guardian:

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

El cambio de modelo sigue estando controlado por OpenClaw. Cuando una sesión de OpenClaw está adjunta
a un hilo de Codex existente, el siguiente turno vuelve a enviar el modelo
OpenAI, proveedor, política de aprobación, sandbox y nivel de servicio seleccionados actualmente al
app-server. Cambiar de `openai/gpt-5.5` a `openai/gpt-5.2` conserva la
vinculación del hilo, pero pide a Codex continuar con el modelo recién seleccionado.

## Comando Codex

El Plugin incluido registra `/codex` como un comando de barra autorizado. Es
genérico y funciona en cualquier canal que admita comandos de texto de OpenClaw.

Formas comunes:

- `/codex status` muestra la conectividad en vivo del app-server, los modelos, la cuenta, los límites de tasa, los servidores MCP y las skills.
- `/codex models` enumera los modelos en vivo del app-server de Codex.
- `/codex threads [filter]` enumera los hilos recientes de Codex.
- `/codex resume <thread-id>` adjunta la sesión actual de OpenClaw a un hilo existente de Codex.
- `/codex compact` solicita al app-server de Codex que compacte el hilo adjunto.
- `/codex review` inicia la revisión nativa de Codex para el hilo adjunto.
- `/codex diagnostics [note]` pregunta antes de enviar comentarios de diagnóstico de Codex para el hilo adjunto.
- `/codex computer-use status` comprueba el Plugin de Computer Use configurado y el servidor MCP.
- `/codex computer-use install` instala el Plugin de Computer Use configurado y recarga los servidores MCP.
- `/codex account` muestra el estado de la cuenta y los límites de tasa.
- `/codex mcp` enumera el estado de los servidores MCP del app-server de Codex.
- `/codex skills` enumera las skills del app-server de Codex.

### Flujo común de depuración

Cuando un agente respaldado por Codex hace algo inesperado en Telegram, Discord, Slack,
u otro canal, empieza por la conversación donde ocurrió el problema:

1. Ejecuta `/diagnostics bad tool choice after image upload` u otra nota breve
   que describa lo que viste.
2. Aprueba la solicitud de diagnósticos una vez. La aprobación crea el zip local
   de diagnósticos del Gateway y, como la sesión usa el arnés de Codex, también
   envía el paquete de comentarios relevante de Codex a los servidores de OpenAI.
3. Copia la respuesta de diagnósticos completada en el informe de error o hilo de soporte.
   Incluye la ruta del paquete local, el resumen de privacidad, los ids de sesión de OpenClaw,
   los ids de hilo de Codex y una línea `Inspect locally` para cada hilo de Codex.
4. Si quieres depurar la ejecución tú mismo, ejecuta el comando `Inspect locally`
   impreso en una terminal. Se ve como `codex resume <thread-id>` y abre el
   hilo nativo de Codex para que puedas inspeccionar la conversación, continuarla localmente,
   o preguntarle a Codex por qué eligió una herramienta o plan en particular.

Usa `/codex diagnostics [note]` solo cuando quieras específicamente la carga de
comentarios de Codex para el hilo actualmente adjunto sin el paquete completo de
diagnósticos del Gateway de OpenClaw. Para la mayoría de los informes de soporte,
`/diagnostics [note]` es el mejor punto de partida porque vincula el estado local
del Gateway y los ids de hilo de Codex en una sola respuesta. Consulta [Exportación de diagnósticos](/es/gateway/diagnostics)
para ver el modelo de privacidad completo y el comportamiento en chats grupales.

El núcleo de OpenClaw también expone `/diagnostics [note]`, solo para propietarios,
como el comando general de diagnósticos del Gateway. Su solicitud de aprobación muestra el
preámbulo sobre datos sensibles, enlaza a [Exportación de diagnósticos](/es/gateway/diagnostics), y solicita
`openclaw gateway diagnostics export --json` mediante aprobación explícita de ejecución
cada vez. No apruebes diagnósticos con una regla de permitir todo. Tras la aprobación,
OpenClaw envía un informe pegable con la ruta del paquete local y el resumen del
manifiesto. Cuando la sesión activa de OpenClaw usa el arnés de Codex, esa misma
aprobación también autoriza el envío de los paquetes de comentarios relevantes de Codex
a los servidores de OpenAI. La solicitud de aprobación dice que se enviarán comentarios
de Codex, pero no enumera los ids de sesión o hilo de Codex antes de la aprobación.

Si `/diagnostics` lo invoca un propietario en un chat grupal, OpenClaw mantiene limpio el
canal compartido: el grupo recibe solo un aviso breve, mientras que el
preámbulo de diagnósticos, las solicitudes de aprobación y los ids de sesión/hilo de Codex
se envían al propietario mediante la ruta privada de aprobación. Si no hay una ruta privada
para el propietario, OpenClaw rechaza la solicitud del grupo y le pide al propietario que la ejecute
desde un DM.

La carga aprobada de Codex llama a `feedback/upload` del app-server de Codex y pide
al app-server que incluya registros de cada hilo enumerado y subhilos de Codex generados
cuando estén disponibles. La carga pasa por la ruta normal de comentarios de Codex hacia los
servidores de OpenAI; si los comentarios de Codex están desactivados en ese app-server, el comando devuelve
el error del app-server. La respuesta de diagnósticos completada enumera los canales,
los ids de sesión de OpenClaw, los ids de hilo de Codex y los comandos locales
`codex resume <thread-id>` para los hilos que se enviaron. Si deniegas o ignoras la aprobación,
OpenClaw no imprime esos ids de Codex. Esta carga no reemplaza la exportación local
de diagnósticos del Gateway.

`/codex resume` escribe el mismo archivo sidecar de enlace que usa el arnés para
turnos normales. En el siguiente mensaje, OpenClaw reanuda ese hilo de Codex, pasa el
modelo de OpenClaw seleccionado actualmente al app-server y mantiene activado el historial extendido.

### Inspeccionar un hilo de Codex desde la CLI

La forma más rápida de entender una ejecución incorrecta de Codex suele ser abrir el hilo
nativo de Codex directamente:

```sh
codex resume <thread-id>
```

Usa esto cuando notes un error en una conversación de canal y quieras inspeccionar la
sesión problemática de Codex, continuarla localmente o preguntarle a Codex por qué tomó una
decisión particular de herramienta o razonamiento. La ruta más sencilla suele ser ejecutar
`/diagnostics [note]` primero: después de aprobarlo, el informe completado enumera
cada hilo de Codex e imprime un comando `Inspect locally`, por ejemplo
`codex resume <thread-id>`. Puedes copiar ese comando directamente en una terminal.

También puedes obtener un id de hilo desde `/codex binding` para el chat actual o
`/codex threads [filter]` para hilos recientes del app-server de Codex, y luego ejecutar el mismo
comando `codex resume` en tu shell.

La superficie de comandos requiere el app-server de Codex `0.125.0` o más reciente. Los métodos
de control individuales se informan como `unsupported by this Codex app-server` si un
app-server futuro o personalizado no expone ese método JSON-RPC.

## Límites de hooks

El arnés de Codex tiene tres capas de hooks:

| Capa                                  | Propietario              | Propósito                                                            |
| ------------------------------------- | ------------------------ | -------------------------------------------------------------------- |
| Hooks de Plugin de OpenClaw           | OpenClaw                 | Compatibilidad de producto/Plugin entre los arneses PI y Codex.      |
| Middleware de extensión del app-server de Codex | Plugins incluidos de OpenClaw | Comportamiento de adaptador por turno alrededor de herramientas dinámicas de OpenClaw. |
| Hooks nativos de Codex                | Codex                    | Ciclo de vida de bajo nivel de Codex y política de herramientas nativas desde la configuración de Codex. |

OpenClaw no usa archivos `hooks.json` de proyecto o globales de Codex para enrutar
el comportamiento de Plugins de OpenClaw. Para el puente compatible de herramientas nativas y permisos,
OpenClaw inyecta configuración de Codex por hilo para `PreToolUse`, `PostToolUse`,
`PermissionRequest` y `Stop`. Otros hooks de Codex como `SessionStart` y
`UserPromptSubmit` siguen siendo controles de nivel Codex; no se exponen como
hooks de Plugin de OpenClaw en el contrato v1.

Para las herramientas dinámicas de OpenClaw, OpenClaw ejecuta la herramienta después de que Codex solicita la
llamada, por lo que OpenClaw activa el comportamiento de Plugin y middleware que posee en el
adaptador del arnés. Para herramientas nativas de Codex, Codex posee el registro canónico de la herramienta.
OpenClaw puede reflejar eventos seleccionados, pero no puede reescribir el hilo nativo de Codex
a menos que Codex exponga esa operación mediante el app-server o callbacks de hooks nativos.

Las proyecciones de Compaction y ciclo de vida del LLM provienen de notificaciones del app-server de Codex
y del estado del adaptador de OpenClaw, no de comandos de hooks nativos de Codex.
Los eventos `before_compaction`, `after_compaction`, `llm_input` y
`llm_output` de OpenClaw son observaciones de nivel adaptador, no capturas byte a byte
de la solicitud interna o las cargas útiles de Compaction de Codex.

Las notificaciones `hook/started` y `hook/completed` nativas de Codex del app-server se
proyectan como eventos de agente `codex_app_server.hook` para trayectoria y depuración.
No invocan hooks de Plugin de OpenClaw.

## Contrato de soporte v1

El modo Codex no es PI con una llamada de modelo distinta por debajo. Codex posee más del
bucle de modelo nativo, y OpenClaw adapta sus superficies de Plugin y sesión
alrededor de ese límite.

Compatible en el runtime v1 de Codex:

| Superficie                                    | Soporte                                 | Por qué                                                                                                                                                                                              |
| --------------------------------------------- | --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Bucle de modelo de OpenAI mediante Codex      | Compatible                              | El app-server de Codex posee el turno de OpenAI, la reanudación de hilo nativa y la continuación de herramientas nativas.                                                                            |
| Enrutamiento y entrega de canales de OpenClaw | Compatible                              | Telegram, Discord, Slack, WhatsApp, iMessage y otros canales permanecen fuera del runtime del modelo.                                                                                                |
| Herramientas dinámicas de OpenClaw            | Compatible                              | Codex pide a OpenClaw que ejecute estas herramientas, por lo que OpenClaw permanece en la ruta de ejecución.                                                                                         |
| Plugins de prompt y contexto                  | Compatible                              | OpenClaw crea superposiciones de prompt y proyecta contexto en el turno de Codex antes de iniciar o reanudar el hilo.                                                                                |
| Ciclo de vida del motor de contexto           | Compatible                              | El ensamblaje, la ingesta o el mantenimiento posterior al turno y la coordinación de Compaction del motor de contexto se ejecutan para turnos de Codex.                                                |
| Hooks de herramientas dinámicas               | Compatible                              | `before_tool_call`, `after_tool_call` y el middleware de resultados de herramientas se ejecutan alrededor de herramientas dinámicas propiedad de OpenClaw.                                             |
| Hooks de ciclo de vida                        | Compatibles como observaciones de adaptador | `llm_input`, `llm_output`, `agent_end`, `before_compaction` y `after_compaction` se activan con cargas útiles honestas del modo Codex.                                                               |
| Puerta de revisión de respuesta final         | Compatible mediante el relay de hooks nativos | Codex `Stop` se retransmite a `before_agent_finalize`; `revise` solicita a Codex una pasada más del modelo antes de finalizar.                                                                       |
| Bloqueo u observación de shell, patch y MCP nativos | Compatible mediante el relay de hooks nativos | Codex `PreToolUse` y `PostToolUse` se retransmiten para superficies de herramientas nativas confirmadas, incluidas cargas útiles MCP en el app-server de Codex `0.125.0` o más reciente. Se admite el bloqueo; no la reescritura de argumentos. |
| Política de permisos nativa                   | Compatible mediante el relay de hooks nativos | Codex `PermissionRequest` puede enrutarse mediante la política de OpenClaw donde el runtime la exponga. Si OpenClaw no devuelve ninguna decisión, Codex continúa por su ruta normal de guardián o aprobación de usuario. |
| Captura de trayectoria del app-server         | Compatible                              | OpenClaw registra la solicitud que envió al app-server y las notificaciones del app-server que recibe.                                                                                                |

No compatible en el runtime v1 de Codex:

| Superficie                                         | Límite de V1                                                                                                                                     | Ruta futura                                                                                  |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Mutación de argumentos de herramientas nativas      | Los hooks nativos previos a herramientas de Codex pueden bloquear, pero OpenClaw no reescribe argumentos de herramientas nativas de Codex.      | Requiere compatibilidad de hooks/esquemas de Codex para reemplazar la entrada de herramienta. |
| Historial editable de transcripciones nativas de Codex | Codex posee el historial canónico de hilos nativos. OpenClaw posee un espejo y puede proyectar contexto futuro, pero no debería mutar elementos internos no compatibles. | Añadir APIs explícitas del servidor de aplicación de Codex si se necesita cirugía de hilos nativos. |
| `tool_result_persist` para registros de herramientas nativas de Codex | Ese hook transforma escrituras de transcripción propiedad de OpenClaw, no registros de herramientas nativas de Codex.                           | Podría reflejar registros transformados, pero la reescritura canónica necesita compatibilidad de Codex. |
| Metadatos enriquecidos de compaction nativa         | OpenClaw observa el inicio y la finalización de la compaction, pero no recibe una lista estable de conservados/descartados, delta de tokens ni carga útil de resumen. | Necesita eventos de compaction de Codex más enriquecidos.                                    |
| Intervención de compaction                          | Los hooks actuales de compaction de OpenClaw son de nivel de notificación en modo Codex.                                                        | Añadir hooks previos/posteriores de compaction de Codex si los plugins necesitan vetar o reescribir la compaction nativa. |
| Captura byte por byte de solicitudes a la API del modelo | OpenClaw puede capturar solicitudes y notificaciones del servidor de aplicación, pero el núcleo de Codex construye internamente la solicitud final a la API de OpenAI. | Necesita un evento de trazado de solicitud de modelo de Codex o una API de depuración.        |

## Herramientas, medios y compaction

El arnés de Codex solo cambia el ejecutor de agente integrado de bajo nivel.

OpenClaw sigue construyendo la lista de herramientas y recibiendo resultados dinámicos de herramientas desde el
arnés. El texto, las imágenes, el video, la música, TTS, las aprobaciones y la salida de herramientas de mensajería
continúan por la ruta normal de entrega de OpenClaw.

El retransmisor de hooks nativos es intencionalmente genérico, pero el contrato de compatibilidad de v1 está
limitado a las rutas de herramientas y permisos nativas de Codex que OpenClaw prueba. En
el runtime de Codex, eso incluye cargas útiles de shell, patch y MCP `PreToolUse`,
`PostToolUse` y `PermissionRequest`. No asumas que cada evento futuro de hook de
Codex sea una superficie de Plugin de OpenClaw hasta que el contrato del runtime lo nombre.

Para `PermissionRequest`, OpenClaw solo devuelve decisiones explícitas de permitir o denegar
cuando la política decide. Un resultado sin decisión no es una autorización. Codex lo trata como ausencia de
decisión del hook y pasa a su propia ruta de guardián o aprobación de usuario.

Las solicitudes de aprobación de herramientas MCP de Codex se enrutan mediante el flujo de aprobación de plugins de OpenClaw
cuando Codex marca `_meta.codex_approval_kind` como
`"mcp_tool_call"`. Los avisos de Codex `request_user_input` se envían de vuelta al
chat de origen, y el siguiente mensaje de seguimiento en cola responde a esa solicitud nativa
del servidor en lugar de dirigirse como contexto adicional. Otras solicitudes de obtención de MCP
siguen fallando de forma cerrada.

El direccionamiento de la cola de ejecución activa se asigna a `turn/steer` del servidor de aplicación de Codex. Con el
valor predeterminado `messages.queue.mode: "steer"`, OpenClaw agrupa los mensajes de chat en cola
durante la ventana de silencio configurada y los envía como una solicitud `turn/steer` en
orden de llegada. El modo heredado `queue` envía solicitudes `turn/steer` separadas. Los turnos de
revisión de Codex y compaction manual pueden rechazar el direccionamiento en el mismo turno, en cuyo caso
OpenClaw usa la cola de seguimiento cuando el modo seleccionado permite la reserva. Consulta
[Cola de direccionamiento](/es/concepts/queue-steering).

Cuando el modelo seleccionado usa el arnés de Codex, la compaction de hilos nativos se
delega al servidor de aplicación de Codex. OpenClaw mantiene un espejo de transcripción para el historial de canales,
búsqueda, `/new`, `/reset` y futuros cambios de modelo o arnés. El
espejo incluye el prompt del usuario, el texto final del asistente y registros ligeros de
razonamiento o plan de Codex cuando el servidor de aplicación los emite. Hoy, OpenClaw solo
registra señales de inicio y finalización de compaction nativa. Todavía no expone un
resumen de compaction legible por humanos ni una lista auditable de qué entradas conservó Codex
después de la compaction.

Como Codex posee el hilo nativo canónico, `tool_result_persist` no
reescribe actualmente registros de resultados de herramientas nativas de Codex. Solo se aplica cuando
OpenClaw está escribiendo un resultado de herramienta en una transcripción de sesión propiedad de OpenClaw.

La generación de medios no requiere PI. Imagen, video, música, PDF, TTS y comprensión
de medios siguen usando la configuración de proveedor/modelo correspondiente, como
`agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel` y
`messages.tts`.

## Solución de problemas

**Codex no aparece como un proveedor normal de `/model`:** eso es lo esperado para
configuraciones nuevas. Selecciona un modelo `openai/gpt-*` con
`agentRuntime.id: "codex"` (o una referencia heredada `codex/*`), habilita
`plugins.entries.codex.enabled` y comprueba si `plugins.allow` excluye
`codex`.

**OpenClaw usa PI en lugar de Codex:** `agentRuntime.id: "auto"` aún puede usar PI como
backend de compatibilidad cuando ningún arnés de Codex reclama la ejecución. Establece
`agentRuntime.id: "codex"` para forzar la selección de Codex durante las pruebas. Un
runtime de Codex forzado ahora falla en lugar de recurrir a PI a menos que
establezcas explícitamente `agentRuntime.fallback: "pi"`. Una vez que se
selecciona el servidor de aplicación de Codex, sus fallos emergen directamente sin configuración adicional de reserva.

**El servidor de aplicación se rechaza:** actualiza Codex para que el protocolo de enlace del servidor de aplicación
informe la versión `0.125.0` o posterior. Las versiones preliminares de la misma versión o con sufijo de compilación
como `0.125.0-alpha.2` o `0.125.0+custom` se rechazan porque el
límite mínimo estable del protocolo `0.125.0` es lo que OpenClaw prueba.

**El descubrimiento de modelos es lento:** reduce `plugins.entries.codex.config.discovery.timeoutMs`
o deshabilita el descubrimiento.

**El transporte WebSocket falla inmediatamente:** comprueba `appServer.url`, `authToken`
y que el servidor de aplicación remoto hable la misma versión del protocolo del servidor de aplicación de Codex.

**Un modelo que no es Codex usa PI:** eso es lo esperado a menos que hayas forzado
`agentRuntime.id: "codex"` para ese agente o seleccionado una referencia heredada
`codex/*`. Las referencias simples `openai/gpt-*` y de otros proveedores permanecen en su ruta normal
de proveedor en modo `auto`. Si fuerzas `agentRuntime.id: "codex"`, cada turno integrado
de ese agente debe ser un modelo de OpenAI compatible con Codex.

**Computer Use está instalado pero las herramientas no se ejecutan:** comprueba
`/codex computer-use status` desde una sesión nueva. Si una herramienta informa
`Native hook relay unavailable`, usa `/new` o `/reset`; si persiste, reinicia
el gateway para limpiar registros obsoletos de hooks nativos. Si `computer-use.list_apps`
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
