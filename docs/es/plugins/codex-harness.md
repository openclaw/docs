---
read_when:
    - Quieres usar el arnés de servidor de aplicaciones Codex incluido
    - Necesitas ejemplos de configuración del arnés de Codex
    - Quieres que los despliegues exclusivos de Codex fallen en lugar de recurrir a PI
summary: Ejecuta turnos de agente integrado de OpenClaw mediante el arnés de app-server de Codex incluido
title: Arnés de Codex
x-i18n:
    generated_at: "2026-05-07T13:21:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9bc5e78b1c6737dad7037ef77cfa9f16d480f02671363591509696d232e2d52e
    source_path: plugins/codex-harness.md
    workflow: 16
---

El plugin `codex` incluido permite que OpenClaw ejecute turnos de agente incorporados mediante el servidor de aplicación de Codex en lugar del arnés PI integrado.

Úsalo cuando quieras que Codex sea dueño de la sesión de agente de bajo nivel: descubrimiento de modelos, reanudación nativa de hilos, compaction nativa y ejecución en el servidor de aplicación. OpenClaw sigue siendo dueño de los canales de chat, los archivos de sesión, la selección de modelos, las herramientas, las aprobaciones, la entrega de medios y el espejo visible de la transcripción.

Cuando un turno de chat de origen se ejecuta mediante el arnés de Codex, las respuestas visibles usan de forma predeterminada la herramienta `message` de OpenClaw si el despliegue no ha configurado explícitamente `messages.visibleReplies`. El agente aún puede finalizar su turno de Codex en privado; solo publica en el canal cuando llama a `message(action="send")`. Define `messages.visibleReplies: "automatic"` para mantener las respuestas finales de chat directo en la ruta heredada de entrega automática.

Los turnos de Heartbeat de Codex también reciben la herramienta `heartbeat_respond` de forma predeterminada, para que el agente pueda registrar si el despertar debe permanecer silencioso o notificar sin codificar ese flujo de control en el texto final.

La guía de iniciativa específica de Heartbeat se envía como una instrucción de desarrollador en modo de colaboración de Codex en el propio turno de Heartbeat. Los turnos de chat ordinarios restauran el modo Codex Default en lugar de llevar la filosofía de Heartbeat en su prompt normal de runtime.

Si intentas orientarte, empieza con [Runtimes de agente](/es/concepts/agent-runtimes). La versión corta es: `openai/gpt-5.5` es la referencia de modelo, `codex` es el runtime, y Telegram, Discord, Slack u otro canal sigue siendo la superficie de comunicación.

## Configuración rápida

La mayoría de los usuarios que quieren "Codex en OpenClaw" quieren esta ruta: iniciar sesión con una suscripción de ChatGPT/Codex y luego ejecutar turnos de agente incorporados mediante el runtime nativo del servidor de aplicación de Codex. La referencia de modelo sigue siendo canónica como `openai/gpt-*`; la autenticación de suscripción proviene de la cuenta/perfil de Codex, no de un prefijo de modelo `openai-codex/*`.

Primero inicia sesión con OAuth de Codex si aún no lo has hecho:

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

No uses `openai-codex/gpt-*` en la configuración. Ese prefijo es una ruta heredada que `openclaw doctor --fix` reescribe a `openai/gpt-*` en modelos principales, alternativas, anulaciones de heartbeat/subagente/compaction, hooks, anulaciones de canal y pines obsoletos de ruta de sesión persistida.

## Qué cambia este plugin

El plugin `codex` incluido aporta varias capacidades separadas:

| Capacidad                         | Cómo se usa                                         | Qué hace                                                                       |
| --------------------------------- | --------------------------------------------------- | ------------------------------------------------------------------------------ |
| Runtime incorporado nativo        | `agentRuntime.id: "codex"`                          | Ejecuta turnos de agente incorporados de OpenClaw mediante el servidor de aplicación de Codex. |
| Comandos nativos de control de chat | `/codex bind`, `/codex resume`, `/codex steer`, ... | Vincula y controla hilos del servidor de aplicación de Codex desde una conversación de mensajería. |
| Proveedor/catálogo del servidor de aplicación de Codex | Internos de `codex`, expuestos mediante el arnés | Permite que el runtime descubra y valide modelos del servidor de aplicación. |
| Ruta de comprensión de medios de Codex | Rutas de compatibilidad de modelos de imagen `codex/*` | Ejecuta turnos acotados del servidor de aplicación de Codex para modelos admitidos de comprensión de imágenes. |
| Relay nativo de hooks             | Hooks de plugin alrededor de eventos nativos de Codex | Permite que OpenClaw observe/bloquee eventos nativos de herramienta/finalización de Codex admitidos. |

Habilitar el plugin pone esas capacidades a disposición. **No** hace lo siguiente:

- reemplazar superficies directas de clave de API de OpenAI como imágenes, embeddings, voz o realtime
- convertir referencias de modelo `openai-codex/*` sin `openclaw doctor --fix`
- hacer que ACP/acpx sea la ruta predeterminada de Codex
- cambiar en caliente sesiones existentes que ya registraron un runtime PI
- reemplazar la entrega de canales de OpenClaw, los archivos de sesión, el almacenamiento de perfiles de autenticación o el enrutamiento de mensajes

El mismo plugin también es dueño de la superficie nativa de comandos de control de chat `/codex`. Si el plugin está habilitado y el usuario pide vincular, reanudar, dirigir, detener o inspeccionar hilos de Codex desde el chat, los agentes deberían preferir `/codex ...` sobre ACP. ACP sigue siendo la alternativa explícita cuando el usuario pide ACP/acpx o está probando el adaptador ACP de Codex.

Los turnos nativos de Codex mantienen los hooks de plugin de OpenClaw como capa pública de compatibilidad. Estos son hooks en proceso de OpenClaw, no hooks de comando `hooks.json` de Codex:

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `before_tool_call`, `after_tool_call`
- `before_message_write` para registros de transcripción reflejados
- `before_agent_finalize` mediante el relay `Stop` de Codex
- `agent_end`

Los plugins también pueden registrar middleware de resultados de herramientas neutral respecto al runtime para reescribir resultados de herramientas dinámicas de OpenClaw después de que OpenClaw ejecuta la herramienta y antes de que el resultado se devuelva a Codex. Esto es independiente del hook público de plugin `tool_result_persist`, que transforma escrituras de resultados de herramientas en la transcripción propiedad de OpenClaw.

Para la semántica de los hooks de plugin en sí, consulta [Hooks de plugin](/es/plugins/hooks) y [Comportamiento de guardia de plugin](/es/tools/plugin).

Las referencias de modelo de agente de OpenAI usan el arnés de forma predeterminada. Las configuraciones nuevas deberían mantener las referencias de modelo de OpenAI canónicas como `openai/gpt-*`; `agentRuntime.id: "codex"` sigue siendo válido, pero ya no es necesario para turnos de agente de OpenAI. Las referencias de modelo heredadas `codex/*` aún seleccionan automáticamente el arnés por compatibilidad, pero los prefijos de proveedor heredados respaldados por runtime no se muestran como opciones normales de modelo/proveedor.

Si alguna ruta de modelo configurada sigue siendo `openai-codex/*`, `openclaw doctor --fix` la reescribe a `openai/*`. Para rutas de agente coincidentes, establece el runtime del agente en `codex` y conserva las anulaciones de perfil de autenticación `openai-codex` existentes.

## Mapa de rutas

Usa esta tabla antes de cambiar la configuración:

| Comportamiento deseado                              | Referencia de modelo       | Configuración de runtime                | Ruta de autenticación/perfil   | Etiqueta de estado esperada  |
| --------------------------------------------------- | -------------------------- | --------------------------------------- | ------------------------------ | ---------------------------- |
| Suscripción ChatGPT/Codex con runtime nativo de Codex | `openai/gpt-*`             | omitido o `agentRuntime.id: "codex"`    | OAuth de Codex o cuenta de Codex | `Runtime: OpenAI Codex`      |
| Autenticación con clave de API de OpenAI para modelos de agente | `openai/gpt-*`             | omitido o `agentRuntime.id: "codex"`    | Perfil de clave de API `openai-codex` | `Runtime: OpenAI Codex`      |
| Configuración heredada que necesita reparación con doctor | `openai-codex/gpt-*`       | reparado a `codex`                      | Autenticación configurada existente | Vuelve a comprobar después de `doctor --fix` |
| Proveedores mixtos con modo automático conservador  | referencias específicas del proveedor | `agentRuntime.id: "auto"`               | Según el proveedor seleccionado | Depende del runtime seleccionado |
| Sesión explícita del adaptador ACP de Codex         | depende del prompt/modelo ACP | `sessions_spawn` con `runtime: "acp"`   | Autenticación del backend ACP  | Estado de tarea/sesión ACP   |

La división importante es proveedor frente a runtime:

- `openai-codex/*` es una ruta heredada que doctor reescribe.
- `agentRuntime.id: "codex"` requiere el arnés de Codex y falla de forma cerrada si no está disponible.
- `agentRuntime.id: "auto"` permite que los arneses registrados reclamen rutas de proveedor coincidentes; las referencias de agente de OpenAI se resuelven a Codex en lugar de PI.
- `/codex ...` responde "¿a qué conversación nativa de Codex debería vincularse o controlar este chat?"
- ACP responde "¿qué proceso de arnés externo debería lanzar acpx?"

## Elige el prefijo de modelo correcto

Las rutas de la familia OpenAI son específicas del prefijo. Para la configuración común de suscripción más runtime nativo de Codex, usa `openai/*`. Trata `openai-codex/*` como configuración heredada que doctor debería reescribir:

| Referencia de modelo                             | Ruta de runtime                          | Cuándo usarlo                                                     |
| ------------------------------------------------ | ---------------------------------------- | ----------------------------------------------------------------- |
| `openai/gpt-5.4`                                 | Arnés del servidor de aplicación de Codex para turnos de agente | Quieres modelos de agente de OpenAI mediante Codex.               |
| `openai-codex/gpt-5.5`                           | Ruta heredada reparada por doctor        | Estás en una configuración antigua; ejecuta `openclaw doctor --fix` para reescribirla. |
| `openai/gpt-5.5` + perfil de clave de API `openai-codex` | Arnés del servidor de aplicación de Codex | Quieres autenticación con clave de API para un modelo de agente de OpenAI. |

GPT-5.5 puede aparecer tanto en rutas directas de clave de API de OpenAI como en rutas de suscripción de Codex cuando tu cuenta las expone. Usa `openai/gpt-5.5` con el arnés del servidor de aplicación de Codex para el runtime nativo de Codex, o `openai/gpt-5.5` sin una anulación de runtime de Codex para tráfico directo con clave de API.

Las referencias heredadas `codex/gpt-*` siguen aceptándose como alias de compatibilidad. La migración de compatibilidad de doctor reescribe referencias de runtime heredadas a referencias de modelo canónicas y registra la política de runtime por separado. Las nuevas configuraciones nativas del arnés del servidor de aplicación deberían usar `openai/gpt-*` más `agentRuntime.id: "codex"`.

`agents.defaults.imageModel` sigue la misma división de prefijos. Usa `openai/gpt-*` para la ruta normal de OpenAI y `codex/gpt-*` cuando la comprensión de imágenes deba ejecutarse mediante un turno acotado del servidor de aplicación de Codex. No uses `openai-codex/gpt-*`; doctor reescribe ese prefijo heredado a `openai/gpt-*`. El modelo del servidor de aplicación de Codex debe anunciar compatibilidad con entrada de imagen; los modelos de Codex solo de texto fallan antes de que empiece el turno de medios.

Usa `/status` para confirmar el arnés efectivo de la sesión actual. Si la selección sorprende, habilita el registro de depuración para el subsistema `agents/harness` e inspecciona el registro estructurado `agent harness selected` del Gateway. Incluye el id de arnés seleccionado, el motivo de selección, la política de runtime/alternativa y, en modo `auto`, el resultado de compatibilidad de cada candidato de plugin.

### Qué significan las advertencias de doctor

`openclaw doctor` advierte cuando las referencias de modelo configuradas o el estado de ruta de sesión persistida siguen usando `openai-codex/*`. `openclaw doctor --fix` reescribe esas rutas a:

- `openai/<model>`
- `agentRuntime.id: "codex"`

La ruta `codex` fuerza el arnés nativo de Codex. La configuración de runtime PI no está permitida para turnos de modelo de agente de OpenAI. Doctor también repara pines obsoletos de sesión persistida en los almacenes de sesión de agente descubiertos para que las conversaciones antiguas no queden atrapadas en la ruta eliminada.

La selección de arnés no es un control de sesión en vivo. Cuando se ejecuta un turno incorporado, OpenClaw registra el id del arnés seleccionado en esa sesión y sigue usándolo para turnos posteriores con el mismo id de sesión. Cambia la configuración de `agentRuntime` o `OPENCLAW_AGENT_RUNTIME` cuando quieras que las sesiones futuras usen otro arnés; usa `/new` o `/reset` para iniciar una sesión nueva antes de cambiar una conversación existente entre PI y Codex. Esto evita reproducir una transcripción mediante dos sistemas de sesión nativos incompatibles.

Las sesiones heredadas creadas antes de los pines de arnés se tratan como fijadas a PI una vez que tienen historial de transcripción. Usa `/new` o `/reset` para incorporar esa conversación a Codex después de cambiar la configuración.

`/status` muestra el runtime de modelo efectivo. El arnés PI predeterminado aparece como `Runtime: OpenClaw Pi Default`, y el arnés del servidor de aplicación de Codex aparece como `Runtime: OpenAI Codex`.

## Requisitos

- OpenClaw con el Plugin `codex` incluido disponible.
- Codex app-server `0.125.0` o más reciente. El Plugin incluido administra de forma predeterminada un binario de Codex app-server compatible, por lo que los comandos locales `codex` en `PATH` no afectan el inicio normal del arnés.
- Autenticación de Codex disponible para el proceso app-server o para el puente de autenticación de Codex de OpenClaw. Los inicios locales de app-server usan un inicio de Codex administrado por OpenClaw para cada agente y un `HOME` hijo aislado, por lo que de forma predeterminada no leen tu cuenta personal `~/.codex`, Skills, plugins, configuración, estado de hilos ni `$HOME/.agents/skills` nativo.

El Plugin bloquea handshakes de app-server antiguos o sin versión. Eso mantiene a OpenClaw en la superficie de protocolo contra la que se ha probado.

Para pruebas smoke en vivo y Docker, la autenticación suele venir de la cuenta de Codex CLI o de un perfil de autenticación `openai-codex` de OpenClaw. Los inicios locales de app-server por stdio también pueden recurrir a `CODEX_API_KEY` / `OPENAI_API_KEY` cuando no hay ninguna cuenta presente.

## Archivos de arranque del workspace

Codex gestiona `AGENTS.md` por sí mismo mediante el descubrimiento nativo de documentación de proyecto. OpenClaw no escribe archivos sintéticos de documentación de proyecto de Codex ni depende de nombres de archivo de reserva de Codex para archivos de persona, porque las reservas de Codex solo se aplican cuando falta `AGENTS.md`.

Para la paridad del workspace de OpenClaw, el arnés de Codex resuelve los demás archivos de arranque (`SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` y `MEMORY.md` cuando están presentes) y los reenvía mediante instrucciones de desarrollador de Codex en `thread/start` y `thread/resume`. Esto mantiene `SOUL.md` y el contexto relacionado de persona/perfil del workspace visibles en la vía nativa de moldeado de comportamiento de Codex sin duplicar `AGENTS.md`.

## Añadir Codex junto a otros modelos

No establezcas `agentRuntime.id: "codex"` globalmente si el mismo agente debe cambiar libremente entre Codex y modelos de proveedores que no sean Codex. Un runtime forzado se aplica a cada turno incrustado para ese agente o sesión. Si seleccionas un modelo de Anthropic mientras ese runtime está forzado, OpenClaw sigue intentando usar el arnés de Codex y falla de forma cerrada en lugar de enrutar silenciosamente ese turno a través de PI.

Usa una de estas formas en su lugar:

- Pon Codex en un agente dedicado con `agentRuntime.id: "codex"`.
- Mantén el agente predeterminado en `agentRuntime.id: "auto"` y la reserva de PI para el uso normal mixto de proveedores.
- Usa referencias heredadas `codex/*` solo por compatibilidad. Las configuraciones nuevas deberían preferir `openai/*` más una política explícita de runtime de Codex.

Por ejemplo, esto mantiene el agente predeterminado en la selección automática normal y añade un agente Codex independiente:

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

- El agente `main` predeterminado usa la ruta normal de proveedor y la reserva de compatibilidad de PI.
- El agente `codex` usa el arnés de Codex app-server.
- Si Codex falta o no es compatible para el agente `codex`, el turno falla en lugar de usar PI silenciosamente.

## Enrutamiento de comandos de agente

Los agentes deberían enrutar las solicitudes de usuario por intención, no solo por la palabra "Codex":

| El usuario pide...                                     | El agente debería usar...                        |
| ------------------------------------------------------ | ------------------------------------------------ |
| "Vincula este chat a Codex"                            | `/codex bind`                                    |
| "Reanuda el hilo de Codex `<id>` aquí"                 | `/codex resume <id>`                             |
| "Muestra los hilos de Codex"                           | `/codex threads`                                 |
| "Presenta un informe de soporte por una mala ejecución de Codex" | `/diagnostics [note]`                            |
| "Envía solo comentarios de Codex para este hilo adjunto" | `/codex diagnostics [note]`                      |
| "Usa mi suscripción de ChatGPT/Codex con el runtime de Codex" | `openai/*`                                       |
| "Repara pines antiguos de configuración/sesión `openai-codex/*`" | `openclaw doctor --fix`                          |
| "Ejecuta Codex mediante ACP/acpx"                      | ACP `sessions_spawn({ runtime: "acp", ... })`    |
| "Inicia Claude Code/Gemini/OpenCode/Cursor en un hilo" | ACP/acpx, no `/codex` ni subagentes nativos      |

OpenClaw solo anuncia a los agentes la guía de generación de ACP cuando ACP está habilitado, es despachable y está respaldado por un backend de runtime cargado. Si ACP no está disponible, el prompt del sistema y las Skills del Plugin no deberían enseñar al agente sobre el enrutamiento de ACP.

## Despliegues solo con Codex

Fuerza el arnés de Codex cuando necesites demostrar que cada turno de agente incrustado usa Codex. Los runtimes explícitos de Plugin fallan de forma cerrada y nunca se reintentan silenciosamente mediante PI:

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

Anulación de entorno:

```bash
OPENCLAW_AGENT_RUNTIME=codex openclaw gateway run
```

Con Codex forzado, OpenClaw falla pronto si el Plugin de Codex está deshabilitado, el app-server es demasiado antiguo o el app-server no puede iniciar.

## Codex por agente

Puedes hacer que un agente sea solo Codex mientras el agente predeterminado mantiene la selección automática normal:

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

Usa comandos de sesión normales para cambiar de agentes y modelos. `/new` crea una sesión nueva de OpenClaw y el arnés de Codex crea o reanuda su hilo app-server sidecar según sea necesario. `/reset` borra la vinculación de sesión de OpenClaw para ese hilo y permite que el siguiente turno resuelva de nuevo el arnés desde la configuración actual.

## Descubrimiento de modelos

De forma predeterminada, el Plugin de Codex solicita al app-server los modelos disponibles. Si el descubrimiento falla o agota el tiempo de espera, usa un catálogo de reserva incluido para:

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

Deshabilita el descubrimiento cuando quieras que el inicio evite sondear Codex y se ciña al catálogo de reserva:

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

## Conexión y política de app-server

De forma predeterminada, el Plugin inicia localmente el binario de Codex administrado por OpenClaw con:

```bash
codex app-server --listen stdio://
```

El binario administrado se incluye con el paquete del Plugin `codex`. Esto mantiene la versión de app-server vinculada al Plugin incluido en lugar de a cualquier Codex CLI independiente que esté instalado localmente. Establece `appServer.command` solo cuando quieras ejecutar intencionalmente un ejecutable diferente.

De forma predeterminada, OpenClaw inicia sesiones locales del arnés de Codex en modo YOLO: `approvalPolicy: "never"`, `approvalsReviewer: "user"` y `sandbox: "danger-full-access"`. Esta es la postura de operador local de confianza usada para Heartbeat autónomos: Codex puede usar herramientas de shell y red sin detenerse en prompts nativos de aprobación que no hay nadie para responder.

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

El modo Guardian usa la ruta nativa de aprobación con revisión automática de Codex. Cuando Codex solicita salir del sandbox, escribir fuera del workspace o añadir permisos como acceso de red, Codex enruta esa solicitud de aprobación al revisor nativo en lugar de a un prompt humano. El revisor aplica el marco de riesgos de Codex y aprueba o deniega la solicitud específica. Usa Guardian cuando quieras más protecciones que en el modo YOLO pero aun así necesites que los agentes desatendidos avancen.

El preajuste `guardian` se expande a `approvalPolicy: "on-request"`, `approvalsReviewer: "auto_review"` y `sandbox: "workspace-write"`. Los campos de política individuales siguen anulando `mode`, por lo que los despliegues avanzados pueden combinar el preajuste con elecciones explícitas. El valor de revisor antiguo `guardian_subagent` todavía se acepta como alias de compatibilidad, pero las configuraciones nuevas deberían usar `auto_review`.

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

Los inicios de app-server por stdio heredan de forma predeterminada el entorno de proceso de OpenClaw, pero OpenClaw posee el puente de cuenta de Codex app-server y establece tanto `CODEX_HOME` como `HOME` en directorios por agente dentro del estado de OpenClaw de ese agente. El propio cargador de Skills de Codex lee `$CODEX_HOME/skills` y `$HOME/.agents/skills`, por lo que ambos valores están aislados para los inicios locales de app-server. Eso mantiene las Skills nativas de Codex, plugins, configuración, cuentas y estado de hilos limitados al agente de OpenClaw en lugar de filtrarse desde el inicio personal de Codex CLI del operador.

Los plugins de OpenClaw y las instantáneas de Skills de OpenClaw siguen fluyendo por el registro de Plugin y el cargador de Skills propios de OpenClaw. Los recursos personales de Codex CLI no. Si tienes Skills o plugins útiles de Codex CLI que deberían formar parte de un agente de OpenClaw, inventaríalos explícitamente:

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

El proveedor de migración de Codex copia Skills en el workspace actual del agente de OpenClaw. Los plugins nativos, hooks y archivos de configuración de Codex se informan o archivan para revisión manual en lugar de activarse automáticamente, porque pueden ejecutar comandos, exponer servidores MCP o contener credenciales.

La autenticación se selecciona en este orden:

1. Un perfil explícito de autenticación de Codex de OpenClaw para el agente.
2. La cuenta existente del app-server en el inicio de Codex de ese agente.
3. Solo para inicios locales de app-server por stdio, `CODEX_API_KEY`, luego `OPENAI_API_KEY`, cuando no hay ninguna cuenta de app-server presente y la autenticación de OpenAI sigue siendo necesaria.

Cuando OpenClaw detecta un perfil de autenticación de Codex de estilo suscripción de ChatGPT, elimina `CODEX_API_KEY` y `OPENAI_API_KEY` del proceso hijo de Codex generado. Eso mantiene las claves API de nivel Gateway disponibles para embeddings o modelos directos de OpenAI sin hacer que los turnos nativos de Codex app-server se facturen por la API accidentalmente. Los perfiles explícitos de clave API de Codex y la reserva de clave de entorno local por stdio usan inicio de sesión de app-server en lugar de entorno heredado del proceso hijo. Las conexiones WebSocket de app-server no reciben la reserva de clave API de entorno de Gateway; usa un perfil de autenticación explícito o la propia cuenta del app-server remoto.

Si un despliegue necesita aislamiento de entorno adicional, añade esas variables a `appServer.clearEnv`:

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

`appServer.clearEnv` solo afecta al proceso hijo de Codex app-server generado.

Las herramientas dinámicas de Codex usan de forma predeterminada el perfil `native-first`. En ese modo,
OpenClaw no expone herramientas dinámicas que duplican operaciones de espacio de trabajo
nativas de Codex: `read`, `write`, `edit`, `apply_patch`, `exec`, `process` y
`update_plan`. Las herramientas de integración de OpenClaw, como mensajería, sesiones, medios,
cron, navegador, nodos, gateway, `heartbeat_respond` y `web_search` permanecen
disponibles.

Campos de Plugin de Codex de nivel superior admitidos:

| Campo                      | Predeterminado          | Significado                                                                                   |
| -------------------------- | ----------------------- | --------------------------------------------------------------------------------------------- |
| `codexDynamicToolsProfile` | `"native-first"`        | Usa `"openclaw-compat"` para exponer el conjunto completo de herramientas dinámicas de OpenClaw al app-server de Codex. |
| `codexDynamicToolsExclude` | `[]`                    | Nombres adicionales de herramientas dinámicas de OpenClaw que se omiten en turnos del app-server de Codex.               |

Campos `appServer` admitidos:

| Campo                         | Predeterminado                          | Significado                                                                                                                                                                                                                              |
| ----------------------------- | --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                   | `"stdio"`                               | `"stdio"` inicia Codex; `"websocket"` se conecta a `url`.                                                                                                                                                                                |
| `command`                     | binario de Codex administrado           | Ejecutable para transporte stdio. Déjalo sin definir para usar el binario administrado; establécelo solo para una anulación explícita.                                                                                                  |
| `args`                        | `["app-server", "--listen", "stdio://"]` | Argumentos para transporte stdio.                                                                                                                                                                                                       |
| `url`                         | sin definir                             | URL WebSocket del app-server.                                                                                                                                                                                                            |
| `authToken`                   | sin definir                             | Token Bearer para transporte WebSocket.                                                                                                                                                                                                  |
| `headers`                     | `{}`                                    | Encabezados WebSocket adicionales.                                                                                                                                                                                                       |
| `clearEnv`                    | `[]`                                    | Nombres adicionales de variables de entorno eliminadas del proceso app-server stdio iniciado después de que OpenClaw construye su entorno heredado. `CODEX_HOME` y `HOME` están reservadas para el aislamiento de Codex por agente de OpenClaw en inicios locales. |
| `requestTimeoutMs`            | `60000`                                 | Tiempo de espera para llamadas del plano de control del app-server.                                                                                                                                                                      |
| `turnCompletionIdleTimeoutMs` | `60000`                                 | Ventana de inactividad después de una solicitud de app-server de Codex con alcance de turno mientras OpenClaw espera `turn/completed`. Auméntala para fases lentas de síntesis posteriores a herramientas o solo de estado.                                                                  |
| `mode`                        | `"yolo"`                                | Preajuste para ejecución YOLO o revisada por guardian.                                                                                                                                                                                   |
| `approvalPolicy`              | `"never"`                               | Política nativa de aprobación de Codex enviada al iniciar, reanudar o ejecutar un turno del hilo.                                                                                                                                       |
| `sandbox`                     | `"danger-full-access"`                  | Modo sandbox nativo de Codex enviado al iniciar o reanudar el hilo.                                                                                                                                                                     |
| `approvalsReviewer`           | `"user"`                                | Usa `"auto_review"` para permitir que Codex revise avisos nativos de aprobación. `guardian_subagent` sigue siendo un alias heredado.                                                                                                    |
| `serviceTier`                 | sin definir                             | Nivel de servicio opcional del app-server de Codex: `"fast"`, `"flex"` o `null`. Los valores heredados no válidos se ignoran.                                                                                                           |

Las llamadas a herramientas dinámicas propiedad de OpenClaw se delimitan de forma independiente de
`appServer.requestTimeoutMs`: cada solicitud `item/tool/call` de Codex debe recibir
una respuesta de OpenClaw en un plazo de 30 segundos. Al agotarse el tiempo, OpenClaw cancela la señal de la herramienta
cuando es compatible y devuelve una respuesta fallida de herramienta dinámica a Codex para que
el turno pueda continuar en lugar de dejar la sesión en `processing`.

Después de que OpenClaw responde a una solicitud de app-server de Codex con alcance de turno, el arnés
también espera que Codex termine el turno nativo con `turn/completed`. Si el
app-server permanece inactivo durante `appServer.turnCompletionIdleTimeoutMs` después de esa
respuesta, OpenClaw interrumpe con mejor esfuerzo el turno de Codex, registra un tiempo de espera
diagnóstico y libera el carril de sesión de OpenClaw para que los mensajes de chat de seguimiento no queden
en cola detrás de un turno nativo obsoleto. Cualquier notificación no terminal para el
mismo turno, incluido `rawResponseItem/completed`, desactiva ese breve vigilante
porque Codex ha demostrado que el turno sigue vivo; el vigilante terminal más largo
sigue protegiendo los turnos realmente bloqueados. Los diagnósticos de tiempo de espera incluyen el
último método de notificación del app-server y, para elementos de respuesta sin procesar del asistente, el
tipo de elemento, rol, id y una vista previa acotada del texto del asistente.

Las anulaciones de entorno siguen disponibles para pruebas locales:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN` omite el binario administrado cuando
`appServer.command` no está definido.

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` se eliminó. Usa
`plugins.entries.codex.config.appServer.mode: "guardian"` en su lugar, o
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` para pruebas locales puntuales. Se prefiere la configuración
para despliegues repetibles porque mantiene el comportamiento del Plugin en el
mismo archivo revisado que el resto de la configuración del arnés de Codex.

## Uso del equipo

Computer Use se cubre en su propia guía de configuración:
[Codex Computer Use](/es/plugins/codex-computer-use).

La versión breve: OpenClaw no incluye como vendor la aplicación de control de escritorio ni ejecuta
acciones de escritorio por sí mismo. Prepara el app-server de Codex, verifica que el
servidor MCP `computer-use` esté disponible y luego permite que Codex gestione las llamadas nativas
a herramientas MCP durante los turnos en modo Codex.

Para acceso directo al controlador TryCua fuera del flujo de marketplace de Codex, registra
`cua-driver mcp` con `openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'`.
Consulta [Codex Computer Use](/es/plugins/codex-computer-use) para ver la distinción
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

Computer Use es específico de macOS y puede requerir permisos locales del sistema operativo antes de que el
servidor MCP de Codex pueda controlar aplicaciones. Si `computerUse.enabled` es true y el servidor MCP
no está disponible, los turnos en modo Codex fallan antes de que se inicie el hilo en lugar de
ejecutarse silenciosamente sin las herramientas nativas de Computer Use. Consulta
[Codex Computer Use](/es/plugins/codex-computer-use) para conocer opciones de marketplace,
límites del catálogo remoto, motivos de estado y solución de problemas.

Cuando `computerUse.autoInstall` es true, OpenClaw puede registrar el marketplace estándar
incluido de Codex Desktop desde
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` si Codex
aún no ha descubierto un marketplace local. Usa `/new` o `/reset` después de
cambiar la configuración de runtime o Computer Use para que las sesiones existentes no conserven un enlace antiguo
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

Validación de arnés solo de Codex:

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

El cambio de modelo permanece controlado por OpenClaw. Cuando una sesión de OpenClaw está adjunta
a un hilo existente de Codex, el siguiente turno vuelve a enviar al
app-server el modelo OpenAI, proveedor, política de aprobación, sandbox y nivel de servicio
seleccionados actualmente. Cambiar de `openai/gpt-5.5` a `openai/gpt-5.2` conserva el
enlace del hilo, pero pide a Codex que continúe con el modelo recién seleccionado.

## Comando Codex

El Plugin incluido registra `/codex` como comando de barra autorizado. Es
genérico y funciona en cualquier canal que admita comandos de texto de OpenClaw.

Formas comunes:

- `/codex status` muestra la conectividad en vivo del servidor de aplicación, los modelos, la cuenta, los límites de tasa, los servidores MCP y Skills.
- `/codex models` lista los modelos en vivo del servidor de aplicación de Codex.
- `/codex threads [filter]` lista los hilos recientes de Codex.
- `/codex resume <thread-id>` adjunta la sesión actual de OpenClaw a un hilo de Codex existente.
- `/codex compact` solicita al servidor de aplicación de Codex que compacte el hilo adjunto.
- `/codex review` inicia la revisión nativa de Codex para el hilo adjunto.
- `/codex diagnostics [note]` pide confirmación antes de enviar comentarios de diagnóstico de Codex para el hilo adjunto.
- `/codex computer-use status` comprueba el Plugin Computer Use configurado y el servidor MCP.
- `/codex computer-use install` instala el Plugin Computer Use configurado y recarga los servidores MCP.
- `/codex account` muestra el estado de la cuenta y de los límites de tasa.
- `/codex mcp` lista el estado de los servidores MCP del servidor de aplicación de Codex.
- `/codex skills` lista las Skills del servidor de aplicación de Codex.

Cuando Codex informa un fallo por límite de uso, OpenClaw incluye la siguiente
hora de restablecimiento del servidor de aplicación cuando Codex proporciona una. Usa `/codex account` en la misma
conversación para inspeccionar la cuenta actual y las ventanas de límite de tasa.

### Flujo de trabajo común de depuración

Cuando un agente respaldado por Codex hace algo inesperado en Telegram, Discord, Slack,
u otro canal, comienza con la conversación donde ocurrió el problema:

1. Ejecuta `/diagnostics bad tool choice after image upload` u otra nota breve
   que describa lo que viste.
2. Aprueba la solicitud de diagnóstico una vez. La aprobación crea el zip local de diagnósticos del Gateway
   y, como la sesión está usando el arnés de Codex, también
   envía el paquete de comentarios de Codex pertinente a los servidores de OpenAI.
3. Copia la respuesta de diagnóstico completada en el informe de error o hilo de soporte.
   Incluye la ruta del paquete local, el resumen de privacidad, los ids de sesión de OpenClaw,
   los ids de hilo de Codex y una línea `Inspect locally` para cada hilo de Codex.
4. Si quieres depurar la ejecución tú mismo, ejecuta el comando `Inspect locally`
   impreso en una terminal. Tiene el aspecto de `codex resume <thread-id>` y abre el
   hilo nativo de Codex para que puedas inspeccionar la conversación, continuarla localmente,
   o preguntar a Codex por qué eligió una herramienta o plan concreto.

Usa `/codex diagnostics [note]` solo cuando quieras específicamente la carga de
comentarios de Codex para el hilo adjunto actualmente sin el paquete completo de
diagnósticos del Gateway de OpenClaw. Para la mayoría de informes de soporte, `/diagnostics [note]` es
el mejor punto de partida porque vincula el estado local del Gateway y los ids de hilo de Codex
en una sola respuesta. Consulta [Exportación de diagnósticos](/es/gateway/diagnostics)
para ver el modelo completo de privacidad y el comportamiento en chats grupales.

El núcleo de OpenClaw también expone `/diagnostics [note]`, solo para propietarios, como el comando general de
diagnósticos del Gateway. Su prompt de aprobación muestra el preámbulo de datos sensibles,
enlaza a [Exportación de diagnósticos](/es/gateway/diagnostics) y solicita
`openclaw gateway diagnostics export --json` mediante aprobación explícita de ejecución
cada vez. No apruebes diagnósticos con una regla de permitir todo. Después de la aprobación,
OpenClaw envía un informe que se puede pegar con la ruta del paquete local y el resumen
del manifiesto. Cuando la sesión activa de OpenClaw usa el arnés de Codex, esa
misma aprobación también autoriza el envío de los paquetes de comentarios de Codex pertinentes a
los servidores de OpenAI. El prompt de aprobación dice que se enviarán comentarios de Codex, pero
no lista ids de sesión o hilo de Codex antes de la aprobación.

Si `/diagnostics` es invocado por un propietario en un chat grupal, OpenClaw mantiene el
canal compartido limpio: el grupo recibe solo un aviso breve, mientras que el
preámbulo de diagnósticos, los prompts de aprobación y los ids de sesión/hilo de Codex se envían al
propietario mediante la ruta privada de aprobación. Si no hay una ruta privada del propietario,
OpenClaw rechaza la solicitud grupal y pide al propietario que la ejecute desde un DM.

La carga aprobada de Codex llama a `feedback/upload` del servidor de aplicación de Codex y pide
al servidor de aplicación que incluya registros para cada hilo listado y subhilos de Codex generados
cuando estén disponibles. La carga pasa por la ruta normal de comentarios de Codex hacia los servidores de OpenAI;
si los comentarios de Codex están deshabilitados en ese servidor de aplicación, el comando devuelve
el error del servidor de aplicación. La respuesta de diagnóstico completada lista los canales,
los ids de sesión de OpenClaw, los ids de hilo de Codex y los comandos locales `codex resume <thread-id>`
para los hilos que se enviaron. Si deniegas o ignoras la aprobación,
OpenClaw no imprime esos ids de Codex. Esta carga no reemplaza la exportación local de
diagnósticos del Gateway.

`/codex resume` escribe el mismo archivo lateral de vinculación que usa el arnés para
turnos normales. En el siguiente mensaje, OpenClaw reanuda ese hilo de Codex, pasa el
modelo de OpenClaw seleccionado actualmente al servidor de aplicación y mantiene habilitado el historial
extendido.

### Inspeccionar un hilo de Codex desde la CLI

La forma más rápida de entender una ejecución deficiente de Codex suele ser abrir directamente el hilo
nativo de Codex:

```sh
codex resume <thread-id>
```

Usa esto cuando detectes un error en una conversación de canal y quieras inspeccionar la
sesión problemática de Codex, continuarla localmente o preguntar a Codex por qué tomó una
decisión concreta de herramienta o razonamiento. La ruta más sencilla suele ser ejecutar
`/diagnostics [note]` primero: después de aprobarlo, el informe completado lista
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
| Hooks de Plugin de OpenClaw           | OpenClaw                 | Compatibilidad de producto/Plugin entre los arneses de PI y Codex.  |
| Middleware de extensión del servidor de aplicación de Codex | Plugins incluidos de OpenClaw | Comportamiento del adaptador por turno alrededor de herramientas dinámicas de OpenClaw. |
| Hooks nativos de Codex                | Codex                    | Ciclo de vida de bajo nivel de Codex y política de herramientas nativas desde la configuración de Codex. |

OpenClaw no usa archivos Codex `hooks.json` de proyecto o globales para enrutar
comportamiento de Plugin de OpenClaw. Para el puente admitido de herramientas nativas y permisos,
OpenClaw inyecta configuración de Codex por hilo para `PreToolUse`, `PostToolUse`,
`PermissionRequest` y `Stop`. Cuando las aprobaciones del servidor de aplicación de Codex están habilitadas
(`approvalPolicy` no es `"never"`), la configuración nativa de hook inyectada por defecto
omite `PermissionRequest` para que el revisor del servidor de aplicación de Codex y el puente de aprobación de OpenClaw
gestionen las escalaciones reales después de la revisión. Los operadores aún pueden añadir explícitamente
`permission_request` a `nativeHookRelay.events` cuando necesiten el relé de compatibilidad.
Otros hooks de Codex como `SessionStart` y `UserPromptSubmit` siguen siendo
controles de nivel Codex; no se exponen como hooks de Plugin de OpenClaw en el contrato v1.

Para las herramientas dinámicas de OpenClaw, OpenClaw ejecuta la herramienta después de que Codex solicite la
llamada, por lo que OpenClaw dispara el comportamiento de Plugin y middleware que posee en el
adaptador del arnés. Para herramientas nativas de Codex, Codex posee el registro canónico de herramienta.
OpenClaw puede reflejar eventos seleccionados, pero no puede reescribir el hilo nativo de Codex
a menos que Codex exponga esa operación mediante el servidor de aplicación o callbacks de hooks
nativos.

Las proyecciones de Compaction y ciclo de vida de LLM provienen de notificaciones del servidor de aplicación de Codex
y del estado del adaptador de OpenClaw, no de comandos de hooks nativos de Codex.
Los eventos `before_compaction`, `after_compaction`, `llm_input` y
`llm_output` de OpenClaw son observaciones de nivel adaptador, no capturas byte por byte
de la solicitud interna o de las cargas de Compaction de Codex.

Las notificaciones `hook/started` y `hook/completed` nativas de Codex del servidor de aplicación se
proyectan como eventos de agente `codex_app_server.hook` para trayectoria y depuración.
No invocan hooks de Plugin de OpenClaw.

## Contrato de soporte v1

El modo Codex no es PI con una llamada de modelo diferente por debajo. Codex posee una parte mayor
del bucle de modelo nativo, y OpenClaw adapta sus superficies de Plugin y sesión
alrededor de ese límite.

Compatible con el runtime de Codex v1:

| Superficie                                   | Soporte                                                                              | Motivo                                                                                                                                                                                                     |
| -------------------------------------------- | ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Bucle de modelo OpenAI a través de Codex      | Compatible                                                                           | El app-server de Codex posee el turno de OpenAI, la reanudación nativa del hilo y la continuación nativa de herramientas.                                                                                  |
| Enrutamiento y entrega de canales de OpenClaw | Compatible                                                                           | Telegram, Discord, Slack, WhatsApp, iMessage y otros canales permanecen fuera del runtime del modelo.                                                                                                      |
| Herramientas dinámicas de OpenClaw            | Compatible                                                                           | Codex pide a OpenClaw que ejecute estas herramientas, por lo que OpenClaw permanece en la ruta de ejecución.                                                                                                |
| Plugins de prompt y contexto                 | Compatible                                                                           | OpenClaw crea superposiciones de prompt y proyecta contexto en el turno de Codex antes de iniciar o reanudar el hilo.                                                                                      |
| Ciclo de vida del motor de contexto           | Compatible                                                                           | El ensamblaje, la ingesta o el mantenimiento posterior al turno y la coordinación de Compaction del motor de contexto se ejecutan para los turnos de Codex.                                                 |
| Hooks de herramientas dinámicas               | Compatible                                                                           | `before_tool_call`, `after_tool_call` y el middleware de resultados de herramientas se ejecutan alrededor de las herramientas dinámicas propiedad de OpenClaw.                                              |
| Hooks de ciclo de vida                        | Compatible como observaciones del adaptador                                          | `llm_input`, `llm_output`, `agent_end`, `before_compaction` y `after_compaction` se disparan con cargas útiles honestas del modo Codex.                                                                     |
| Puerta de revisión de la respuesta final      | Compatible mediante el relay de hooks nativos                                        | Codex `Stop` se reenvía a `before_agent_finalize`; `revise` pide a Codex un pase más del modelo antes de la finalización.                                                                                  |
| Bloqueo u observación de shell, patch y MCP nativos | Compatible mediante el relay de hooks nativos                                  | Codex `PreToolUse` y `PostToolUse` se reenvían para superficies de herramientas nativas confirmadas, incluidas cargas útiles de MCP en Codex app-server `0.125.0` o posterior. El bloqueo es compatible; la reescritura de argumentos no lo es. |
| Política de permisos nativa                   | Compatible mediante aprobaciones de Codex app-server y el relay de hooks nativos de compatibilidad | Las solicitudes de aprobación de Codex app-server se enrutan a través de OpenClaw después de la revisión de Codex. El relay del hook nativo `PermissionRequest` es opcional para los modos de aprobación nativa porque Codex lo emite antes de la revisión de guardian. |
| Captura de trayectoria del app-server         | Compatible                                                                           | OpenClaw registra la solicitud que envió al app-server y las notificaciones del app-server que recibe.                                                                                                     |

No compatible en el runtime de Codex v1:

| Superficie                                           | Límite de V1                                                                                                                                     | Ruta futura                                                                               |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------- |
| Mutación de argumentos de herramientas nativas        | Los hooks nativos previos a herramienta de Codex pueden bloquear, pero OpenClaw no reescribe argumentos de herramientas nativas de Codex.        | Requiere soporte de hooks/esquemas de Codex para reemplazar la entrada de herramienta.     |
| Historial de transcripción nativo de Codex editable   | Codex posee el historial canónico del hilo nativo. OpenClaw posee un espejo y puede proyectar contexto futuro, pero no debería mutar elementos internos no compatibles. | Añadir API explícitas de Codex app-server si se necesita cirugía del hilo nativo.          |
| `tool_result_persist` para registros de herramientas nativas de Codex | Ese hook transforma escrituras de transcripción propiedad de OpenClaw, no registros de herramientas nativas de Codex.                          | Podría reflejar registros transformados, pero la reescritura canónica necesita soporte de Codex. |
| Metadatos enriquecidos de Compaction nativa           | OpenClaw observa el inicio y la finalización de Compaction, pero no recibe una lista estable de elementos conservados/descartados, delta de tokens ni carga útil de resumen. | Necesita eventos de Compaction de Codex más enriquecidos.                                  |
| Intervención en Compaction                            | Los hooks de Compaction actuales de OpenClaw están a nivel de notificación en modo Codex.                                                       | Añadir hooks de Compaction previos/posteriores de Codex si los plugins necesitan vetar o reescribir la Compaction nativa. |
| Captura byte a byte de solicitudes de API de modelo   | OpenClaw puede capturar solicitudes y notificaciones del app-server, pero el núcleo de Codex crea internamente la solicitud final a la API de OpenAI. | Necesita un evento de trazado de solicitud de modelo de Codex o una API de depuración.     |

## Herramientas, medios y Compaction

El arnés de Codex cambia solamente el ejecutor de agente incrustado de bajo nivel.

OpenClaw sigue creando la lista de herramientas y recibe los resultados de herramientas dinámicas desde el arnés. Texto, imágenes, video, música, TTS, aprobaciones y salida de herramientas de mensajería continúan por la ruta de entrega normal de OpenClaw.

El relay de hooks nativos es intencionalmente genérico, pero el contrato de soporte v1 se limita a las rutas de herramientas nativas y permisos de Codex que OpenClaw prueba. En el runtime de Codex, eso incluye cargas útiles `PreToolUse`, `PostToolUse` y `PermissionRequest` de shell, patch y MCP. No asumas que cada evento de hook futuro de Codex es una superficie de Plugin de OpenClaw hasta que el contrato de runtime la nombre.

Para `PermissionRequest`, OpenClaw solo devuelve decisiones explícitas de permitir o denegar cuando la política decide. Un resultado sin decisión no es una autorización. Codex lo trata como ausencia de decisión de hook y continúa hacia su propio guardian o ruta de aprobación de usuario. Los modos de aprobación de Codex app-server omiten este hook nativo de forma predeterminada; este párrafo se aplica cuando `permission_request` se incluye explícitamente en `nativeHookRelay.events` o cuando un runtime de compatibilidad lo instala.
Cuando un operador elige `allow-always` para una solicitud de permiso nativa de Codex, OpenClaw recuerda esa huella exacta de proveedor/sesión/entrada de herramienta/cwd durante una ventana de sesión acotada. La decisión recordada es intencionalmente solo de coincidencia exacta: un comando, argumentos, carga útil de herramienta o cwd cambiados crean una aprobación nueva.

Las elicitaciones de aprobación de herramientas MCP de Codex se enrutan a través del flujo de aprobación de plugins de OpenClaw cuando Codex marca `_meta.codex_approval_kind` como `"mcp_tool_call"`. Los prompts `request_user_input` de Codex se envían de vuelta al chat de origen, y el siguiente mensaje de seguimiento en cola responde a esa solicitud del servidor nativo en lugar de dirigirse como contexto adicional. Otras solicitudes de elicitación de MCP siguen fallando de forma cerrada.

El direccionamiento de la cola de ejecución activa se asigna a `turn/steer` de Codex app-server. Con el valor predeterminado `messages.queue.mode: "steer"`, OpenClaw agrupa los mensajes de chat en cola durante la ventana de silencio configurada y los envía como una solicitud `turn/steer` en orden de llegada. El modo heredado `queue` envía solicitudes `turn/steer` separadas. La revisión de Codex y los turnos manuales de Compaction pueden rechazar el direccionamiento en el mismo turno, en cuyo caso OpenClaw usa la cola de seguimiento cuando el modo seleccionado permite fallback. Consulta [Cola de direccionamiento](/es/concepts/queue-steering).

Cuando el modelo seleccionado usa el arnés de Codex, la Compaction del hilo nativo se delega a Codex app-server. OpenClaw conserva un espejo de transcripción para el historial del canal, la búsqueda, `/new`, `/reset` y el cambio futuro de modelo o arnés. El espejo incluye el prompt del usuario, el texto final del asistente y registros ligeros de razonamiento o plan de Codex cuando el app-server los emite. Hoy, OpenClaw solo registra señales de inicio y finalización de Compaction nativa. Todavía no expone un resumen de Compaction legible por humanos ni una lista auditable de qué entradas conservó Codex después de la Compaction.

Como Codex posee el hilo nativo canónico, `tool_result_persist` actualmente no reescribe registros de resultados de herramientas nativas de Codex. Solo se aplica cuando OpenClaw escribe un resultado de herramienta de transcripción de sesión propiedad de OpenClaw.

La generación de medios no requiere PI. La comprensión y generación de imágenes, video, música, PDF, TTS y medios sigue usando la configuración de proveedor/modelo correspondiente, como `agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel` y `messages.tts`.

## Solución de problemas

**Codex no aparece como proveedor normal de `/model`:** eso es esperado para configuraciones nuevas. Selecciona un modelo `openai/gpt-*` con `agentRuntime.id: "codex"` (o una referencia heredada `codex/*`), habilita `plugins.entries.codex.enabled` y comprueba si `plugins.allow` excluye `codex`.

**OpenClaw usa PI en lugar de Codex:** `agentRuntime.id: "auto"` todavía puede usar PI como backend de compatibilidad cuando ningún arnés de Codex reclama la ejecución. Establece `agentRuntime.id: "codex"` para forzar la selección de Codex durante las pruebas. Un runtime de Codex forzado falla en lugar de volver a PI. Una vez seleccionado Codex app-server, sus fallos emergen directamente.

**El app-server se rechaza:** actualiza Codex para que el handshake del app-server informe la versión `0.125.0` o posterior. Las versiones preliminares de la misma versión o las versiones con sufijo de compilación, como `0.125.0-alpha.2` o `0.125.0+custom`, se rechazan porque el piso del protocolo estable `0.125.0` es lo que OpenClaw prueba.

**La detección de modelos es lenta:** reduce `plugins.entries.codex.config.discovery.timeoutMs` o deshabilita la detección.

**El transporte WebSocket falla inmediatamente:** comprueba `appServer.url`, `authToken` y que el app-server remoto hable la misma versión del protocolo de Codex app-server.

**Un modelo que no es Codex usa PI:** eso es esperado salvo que hayas forzado `agentRuntime.id: "codex"` para ese agente o seleccionado una referencia heredada `codex/*`. Las referencias simples `openai/gpt-*` y de otros proveedores permanecen en su ruta de proveedor normal en modo `auto`. Si fuerzas `agentRuntime.id: "codex"`, cada turno incrustado de ese agente debe ser un modelo OpenAI compatible con Codex.

**Computer Use está instalado, pero las herramientas no se ejecutan:** comprueba
`/codex computer-use status` desde una sesión nueva. Si una herramienta informa
`Native hook relay unavailable`, usa `/new` o `/reset`; si persiste, reinicia
el Gateway para borrar los registros obsoletos de hooks nativos. Si `computer-use.list_apps`
agota el tiempo de espera, reinicia Codex Computer Use o Codex Desktop y vuelve a intentarlo.

## Relacionado

- [Plugins de arnés de agente](/es/plugins/sdk-agent-harness)
- [Runtimes de agente](/es/concepts/agent-runtimes)
- [Proveedores de modelos](/es/concepts/model-providers)
- [Proveedor OpenAI](/es/providers/openai)
- [Estado](/es/cli/status)
- [Hooks de Plugin](/es/plugins/hooks)
- [Referencia de configuración](/es/gateway/configuration-reference)
- [Pruebas](/es/help/testing-live#live-codex-app-server-harness-smoke)
