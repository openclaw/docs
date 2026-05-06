---
read_when:
    - Desea usar el arnés app-server incluido de Codex
    - Necesitas ejemplos de configuración del arnés de Codex
    - Quieres que los despliegues solo de Codex fallen en lugar de recurrir a PI
summary: Ejecuta los turnos de agente integrado de OpenClaw mediante el entorno de app-server de Codex incluido
title: Entorno de ejecución de Codex
x-i18n:
    generated_at: "2026-05-06T05:43:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: 353812c804c896eccc3415a108e8b9c4628adb8c98bba8978bfc6c3dc57587b5
    source_path: plugins/codex-harness.md
    workflow: 16
---

El Plugin `codex` incluido permite que OpenClaw ejecute turnos de agente integrados a través del
servidor de aplicaciones de Codex en lugar del arnés de PI integrado.

Úsalo cuando quieras que Codex controle la sesión de agente de bajo nivel: descubrimiento
de modelos, reanudación nativa de hilos, compaction nativa y ejecución en el servidor de aplicaciones.
OpenClaw sigue controlando los canales de chat, los archivos de sesión, la selección de modelo, las herramientas,
las aprobaciones, la entrega de medios y el espejo visible de la transcripción.

Cuando un turno de chat de origen se ejecuta mediante el arnés de Codex, las respuestas visibles usan de forma predeterminada
la herramienta `message` de OpenClaw si el despliegue no configuró explícitamente
`messages.visibleReplies`. El agente todavía puede finalizar su turno de Codex en privado;
solo publica en el canal cuando llama a `message(action="send")`. Establece
`messages.visibleReplies: "automatic"` para mantener las respuestas finales de chat directo en la
ruta heredada de entrega automática.

Los turnos de heartbeat de Codex también reciben la herramienta `heartbeat_respond` de forma predeterminada, para que el
agente pueda registrar si el despertar debe permanecer en silencio o notificar sin codificar
ese flujo de control en el texto final.

La guía de iniciativa específica de heartbeat se envía como una instrucción de desarrollador del modo de colaboración
de Codex en el propio turno de heartbeat. Los turnos de chat normales restauran
el modo predeterminado de Codex en lugar de llevar la filosofía de heartbeat en su prompt
de ejecución normal.

Si estás intentando orientarte, empieza con
[Tiempos de ejecución de agentes](/es/concepts/agent-runtimes). La versión breve es:
`openai/gpt-5.5` es la referencia de modelo, `codex` es el tiempo de ejecución, y Telegram,
Discord, Slack u otro canal sigue siendo la superficie de comunicación.

## Configuración rápida

La mayoría de los usuarios que quieren "Codex en OpenClaw" quieren esta ruta: iniciar sesión con una
suscripción de ChatGPT/Codex y luego ejecutar turnos de agente integrados a través del tiempo de ejecución nativo
del servidor de aplicaciones de Codex. La referencia de modelo sigue siendo canónica como
`openai/gpt-*`; la autenticación de suscripción proviene de la cuenta o perfil de Codex, no
de un prefijo de modelo `openai-codex/*`.

Primero inicia sesión con OAuth de Codex si aún no lo has hecho:

```bash
openclaw models auth login --provider openai-codex
```

Luego habilita el Plugin `codex` incluido y fuerza el tiempo de ejecución de Codex:

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

No uses `openai-codex/gpt-*` en la configuración. Ese prefijo es una ruta heredada que
`openclaw doctor --fix` reescribe a `openai/gpt-*` en modelos principales,
alternativas, anulaciones de heartbeat/subagente/compaction, hooks, anulaciones de canal
y pines obsoletos de rutas de sesión persistidas.

## Qué cambia este Plugin

El Plugin `codex` incluido aporta varias capacidades separadas:

| Capacidad                         | Cómo se usa                                         | Qué hace                                                                      |
| --------------------------------- | --------------------------------------------------- | ----------------------------------------------------------------------------- |
| Tiempo de ejecución integrado nativo | `agentRuntime.id: "codex"`                       | Ejecuta turnos de agente integrados de OpenClaw a través del servidor de aplicaciones de Codex. |
| Comandos nativos de control de chat | `/codex bind`, `/codex resume`, `/codex steer`, ... | Vincula y controla hilos del servidor de aplicaciones de Codex desde una conversación de mensajería. |
| Proveedor/catálogo del servidor de aplicaciones de Codex | Internos de `codex`, expuestos a través del arnés | Permite que el tiempo de ejecución descubra y valide modelos del servidor de aplicaciones. |
| Ruta de comprensión de medios de Codex | Rutas de compatibilidad de modelos de imagen `codex/*` | Ejecuta turnos acotados del servidor de aplicaciones de Codex para modelos compatibles de comprensión de imágenes. |
| Relay nativo de hooks             | Hooks de Plugin alrededor de eventos nativos de Codex | Permite que OpenClaw observe/bloquee eventos compatibles nativos de Codex de herramientas/finalización. |

Habilitar el Plugin pone esas capacidades a disposición. **No**:

- empieza a usar Codex para cada modelo de OpenAI
- convierte referencias de modelo `openai-codex/*` en el tiempo de ejecución nativo sin que doctor
  verifique que Codex esté instalado, habilitado, aporte el arnés `codex`
  y esté listo para OAuth
- convierte ACP/acpx en la ruta predeterminada de Codex
- cambia en caliente sesiones existentes que ya registraron un tiempo de ejecución de PI
- reemplaza la entrega de canales de OpenClaw, los archivos de sesión, el almacenamiento de perfiles de autenticación ni
  el enrutamiento de mensajes

El mismo Plugin también controla la superficie nativa de comandos de control de chat `/codex`. Si
el Plugin está habilitado y el usuario pide vincular, reanudar, orientar, detener o inspeccionar
hilos de Codex desde el chat, los agentes deberían preferir `/codex ...` en lugar de ACP. ACP sigue siendo
la alternativa explícita cuando el usuario pide ACP/acpx o está probando el adaptador de Codex
ACP.

Los turnos nativos de Codex mantienen los hooks de Plugin de OpenClaw como la capa pública de compatibilidad.
Estos son hooks de OpenClaw en proceso, no hooks de comandos `hooks.json` de Codex:

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `before_tool_call`, `after_tool_call`
- `before_message_write` para registros de transcripción reflejados
- `before_agent_finalize` a través del relay `Stop` de Codex
- `agent_end`

Los plugins también pueden registrar middleware de resultados de herramientas neutral respecto al tiempo de ejecución para reescribir
resultados de herramientas dinámicas de OpenClaw después de que OpenClaw ejecute la herramienta y antes de que el
resultado se devuelva a Codex. Esto es independiente del hook público de Plugin
`tool_result_persist`, que transforma escrituras de resultados de herramientas en transcripciones propiedad de OpenClaw.

Para la semántica de los hooks de Plugin, consulta [Hooks de Plugin](/es/plugins/hooks)
y [Comportamiento de guardia de Plugin](/es/tools/plugin).

El arnés está desactivado de forma predeterminada. Las configuraciones nuevas deberían mantener las referencias de modelos de OpenAI
canónicas como `openai/gpt-*` y forzar explícitamente
`agentRuntime.id: "codex"` u `OPENCLAW_AGENT_RUNTIME=codex` cuando
quieran ejecución nativa en el servidor de aplicaciones. Las referencias de modelo heredadas `codex/*` aún seleccionan automáticamente
el arnés por compatibilidad, pero los prefijos heredados de proveedor respaldados por tiempo de ejecución
no se muestran como opciones normales de modelo/proveedor.

Si alguna ruta de modelo configurada sigue siendo `openai-codex/*`, `openclaw doctor --fix`
la reescribe a `openai/*`. Para rutas de agente coincidentes, establece el tiempo de ejecución del agente
en `codex` solo cuando el Plugin de Codex está instalado, habilitado, aporta el
arnés `codex` y tiene OAuth utilizable; de lo contrario, establece el tiempo de ejecución en `pi`.

## Mapa de rutas

Usa esta tabla antes de cambiar la configuración:

| Comportamiento deseado                              | Referencia de modelo       | Configuración de tiempo de ejecución       | Ruta de autenticación/perfil | Etiqueta de estado esperada    |
| ---------------------------------------------------- | -------------------------- | -------------------------------------- | ---------------------------- | ------------------------------ |
| Suscripción de ChatGPT/Codex con tiempo de ejecución nativo de Codex | `openai/gpt-*`             | `agentRuntime.id: "codex"`             | OAuth de Codex o cuenta de Codex | `Runtime: OpenAI Codex`        |
| API de OpenAI mediante el ejecutor normal de OpenClaw | `openai/gpt-*`             | omitido o `runtime: "pi"`              | Clave de API de OpenAI       | `Runtime: OpenClaw Pi Default` |
| Configuración heredada que necesita reparación con doctor | `openai-codex/gpt-*`       | reparado a `codex` o `pi`              | Autenticación configurada existente | Vuelve a comprobar después de `doctor --fix` |
| Proveedores mixtos con modo automático conservador   | referencias específicas del proveedor | `agentRuntime.id: "auto"`              | Por proveedor seleccionado   | Depende del tiempo de ejecución seleccionado |
| Sesión explícita del adaptador ACP de Codex          | dependiente de prompt/modelo ACP | `sessions_spawn` con `runtime: "acp"` | Autenticación del backend ACP | Estado de tarea/sesión ACP     |

La separación importante es proveedor frente a tiempo de ejecución:

- `openai-codex/*` es una ruta heredada que doctor reescribe.
- `agentRuntime.id: "codex"` requiere el arnés de Codex y falla de forma cerrada si
  no está disponible.
- `agentRuntime.id: "auto"` permite que los arneses registrados reclamen rutas de proveedor
  coincidentes, pero las referencias canónicas de OpenAI siguen siendo propiedad de PI a menos que un arnés admita
  ese par proveedor/modelo.
- `/codex ...` responde "¿a qué conversación nativa de Codex debe vincularse
  o controlar este chat?"
- ACP responde "¿qué proceso de arnés externo debe lanzar acpx?"

## Elige el prefijo de modelo correcto

Las rutas de la familia OpenAI son específicas del prefijo. Para la configuración común de suscripción más
tiempo de ejecución nativo de Codex, usa `openai/*` con `agentRuntime.id: "codex"`.
Trata `openai-codex/*` como configuración heredada que doctor debería reescribir:

| Referencia de modelo                         | Ruta de tiempo de ejecución                 | Cuándo usarlo                                                             |
| --------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------- |
| `openai/gpt-5.4`                              | Proveedor OpenAI mediante la canalización OpenClaw/PI | Quieres acceso actual directo a la API de OpenAI Platform con `OPENAI_API_KEY`. |
| `openai-codex/gpt-5.5`                        | Ruta heredada reparada por doctor            | Estás en una configuración antigua; ejecuta `openclaw doctor --fix` para reescribirla. |
| `openai/gpt-5.5` + `agentRuntime.id: "codex"` | Arnés del servidor de aplicaciones de Codex  | Quieres autenticación de suscripción de ChatGPT/Codex con ejecución nativa de Codex. |

GPT-5.5 puede aparecer tanto en rutas directas con clave de API de OpenAI como en rutas de suscripción de Codex
cuando tu cuenta las expone. Usa `openai/gpt-5.5` con el arnés del servidor de aplicaciones de Codex
para el tiempo de ejecución nativo de Codex, o `openai/gpt-5.5` sin una anulación de tiempo de ejecución de Codex
para tráfico directo con clave de API.

Las referencias heredadas `codex/gpt-*` siguen aceptándose como alias de compatibilidad. La migración de compatibilidad
de doctor reescribe referencias heredadas de tiempo de ejecución a referencias de modelo canónicas
y registra la política de tiempo de ejecución por separado. Las configuraciones nuevas del arnés nativo del servidor de aplicaciones
deberían usar `openai/gpt-*` más `agentRuntime.id: "codex"`.

`agents.defaults.imageModel` sigue la misma separación de prefijos. Usa
`openai/gpt-*` para la ruta normal de OpenAI y `codex/gpt-*` cuando la comprensión de imágenes
deba ejecutarse mediante un turno acotado del servidor de aplicaciones de Codex. No uses
`openai-codex/gpt-*`; doctor reescribe ese prefijo heredado a `openai/gpt-*`. El
modelo del servidor de aplicaciones de Codex debe anunciar compatibilidad con entrada de imágenes; los modelos de Codex
solo de texto fallan antes de que empiece el turno de medios.

Usa `/status` para confirmar el arnés efectivo de la sesión actual. Si la
selección resulta sorprendente, habilita el registro de depuración para el subsistema `agents/harness`
e inspecciona el registro estructurado `agent harness selected` del Gateway. Este
incluye el id del arnés seleccionado, la razón de selección, la política de tiempo de ejecución/alternativa y,
en modo `auto`, el resultado de compatibilidad de cada candidato de Plugin.

### Qué significan las advertencias de doctor

`openclaw doctor` advierte cuando las referencias de modelo configuradas o el estado persistido de rutas de sesión
todavía usan `openai-codex/*`. `openclaw doctor --fix` reescribe esas rutas
a:

- `openai/<model>`
- `agentRuntime.id: "codex"` cuando Codex está instalado, habilitado, aporta el
  arnés `codex` y tiene OAuth utilizable
- `agentRuntime.id: "pi"` en caso contrario

La ruta `codex` fuerza el arnés nativo de Codex. La ruta `pi` mantiene el
agente en el ejecutor predeterminado de OpenClaw en lugar de habilitar o instalar Codex como
efecto secundario de la limpieza de rutas heredadas.
Doctor también repara pines obsoletos de sesiones persistidas en los almacenes de sesión de agente
descubiertos para que las conversaciones antiguas no queden bloqueadas en la ruta eliminada.

La selección del mecanismo de ejecución no es un control de sesión en vivo. Cuando se ejecuta un turno integrado,
OpenClaw registra el id del mecanismo seleccionado en esa sesión y sigue usándolo para
turnos posteriores con el mismo id de sesión. Cambia la configuración `agentRuntime` o
`OPENCLAW_AGENT_RUNTIME` cuando quieras que sesiones futuras usen otro mecanismo;
usa `/new` o `/reset` para iniciar una sesión nueva antes de cambiar una conversación
existente entre PI y Codex. Esto evita reproducir una transcripción en dos sistemas
de sesión nativos incompatibles.

Las sesiones heredadas creadas antes de los pins de mecanismo se tratan como fijadas a PI una vez que
tienen historial de transcripción. Usa `/new` o `/reset` para optar esa conversación por
Codex después de cambiar la configuración.

`/status` muestra el runtime de modelo efectivo. El mecanismo PI predeterminado aparece como
`Runtime: OpenClaw Pi Default`, y el mecanismo app-server de Codex aparece como
`Runtime: OpenAI Codex`.

## Requisitos

- OpenClaw con el plugin `codex` incluido disponible.
- Codex app-server `0.125.0` o posterior. El plugin incluido administra de forma predeterminada un binario de
  Codex app-server compatible, por lo que los comandos locales `codex` en `PATH` no
  afectan el inicio normal del mecanismo.
- Autenticación de Codex disponible para el proceso app-server o para el puente de autenticación Codex de
  OpenClaw. Los lanzamientos locales de app-server usan un home de Codex administrado por OpenClaw para cada
  agente y un `HOME` secundario aislado, por lo que no leen tu cuenta personal
  `~/.codex`, Skills, plugins, configuración, estado de hilos ni `$HOME/.agents/skills`
  nativo de forma predeterminada.

El plugin bloquea handshakes de app-server antiguos o sin versión. Esto mantiene
OpenClaw en la superficie de protocolo con la que se ha probado.

Para pruebas smoke en vivo y con Docker, la autenticación suele venir de la cuenta de Codex CLI
o de un perfil de autenticación `openai-codex` de OpenClaw. Los lanzamientos locales de app-server por stdio también pueden
recurrir a `CODEX_API_KEY` / `OPENAI_API_KEY` cuando no hay ninguna cuenta presente.

## Archivos de arranque del workspace

Codex maneja `AGENTS.md` por sí mismo mediante el descubrimiento nativo de documentos de proyecto. OpenClaw
no escribe archivos sintéticos de documentos de proyecto de Codex ni depende de nombres de archivo fallback de Codex
para archivos de persona, porque los fallbacks de Codex solo se aplican cuando falta
`AGENTS.md`.

Para la paridad del workspace de OpenClaw, el mecanismo Codex resuelve los otros archivos de arranque
(`SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`,
`BOOTSTRAP.md` y `MEMORY.md` cuando existen) y los reenvía mediante instrucciones de configuración de Codex
en `thread/start` y `thread/resume`. Esto mantiene visibles
`SOUL.md` y el contexto relacionado de persona/perfil del workspace sin
duplicar `AGENTS.md`.

## Agregar Codex junto con otros modelos

No establezcas `agentRuntime.id: "codex"` globalmente si el mismo agente debe poder cambiar libremente
entre Codex y modelos de proveedores que no sean Codex. Un runtime forzado se aplica a cada
turno integrado de ese agente o sesión. Si seleccionas un modelo de Anthropic mientras
ese runtime está forzado, OpenClaw sigue intentando usar el mecanismo Codex y falla de forma cerrada
en lugar de enrutar silenciosamente ese turno por PI.

Usa una de estas formas en su lugar:

- Coloca Codex en un agente dedicado con `agentRuntime.id: "codex"`.
- Mantén el agente predeterminado en `agentRuntime.id: "auto"` y fallback de PI para el uso mixto normal
  de proveedores.
- Usa referencias heredadas `codex/*` solo por compatibilidad. Las configuraciones nuevas deberían preferir
  `openai/*` más una política explícita de runtime de Codex.

Por ejemplo, esto mantiene el agente predeterminado en la selección automática normal y
agrega un agente Codex separado:

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

- El agente `main` predeterminado usa la ruta normal de proveedor y el fallback de compatibilidad de PI.
- El agente `codex` usa el mecanismo app-server de Codex.
- Si Codex falta o no es compatible con el agente `codex`, el turno falla
  en lugar de usar PI en silencio.

## Enrutamiento de comandos de agente

Los agentes deberían enrutar las solicitudes de usuario por intención, no solo por la palabra "Codex":

| El usuario pide...                                      | El agente debería usar...                         |
| ------------------------------------------------------ | ------------------------------------------------ |
| "Vincula este chat a Codex"                            | `/codex bind`                                    |
| "Reanuda el hilo de Codex `<id>` aquí"                 | `/codex resume <id>`                             |
| "Muestra los hilos de Codex"                           | `/codex threads`                                 |
| "Presenta un reporte de soporte por una mala ejecución de Codex" | `/diagnostics [note]`                            |
| "Envía comentarios de Codex solo para este hilo adjunto" | `/codex diagnostics [note]`                      |
| "Usa mi suscripción de ChatGPT/Codex con el runtime de Codex" | `openai/*` más `agentRuntime.id: "codex"`        |
| "Repara pins antiguos de configuración/sesión `openai-codex/*`" | `openclaw doctor --fix`                          |
| "Ejecuta Codex mediante ACP/acpx"                      | ACP `sessions_spawn({ runtime: "acp", ... })`    |
| "Inicia Claude Code/Gemini/OpenCode/Cursor en un hilo" | ACP/acpx, no `/codex` ni subagentes nativos      |

OpenClaw solo anuncia orientación de spawn ACP a los agentes cuando ACP está habilitado,
es despachable y está respaldado por un backend de runtime cargado. Si ACP no está disponible,
el prompt del sistema y las Skills del plugin no deberían enseñar al agente sobre el
enrutamiento ACP.

## Despliegues solo con Codex

Fuerza el mecanismo Codex cuando necesites demostrar que cada turno de agente integrado
usa Codex. Los runtimes explícitos de plugin fallan de forma cerrada y nunca se reintentan silenciosamente
mediante PI:

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

Con Codex forzado, OpenClaw falla temprano si el plugin Codex está deshabilitado, el
app-server es demasiado antiguo o el app-server no puede iniciar.

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

Usa los comandos de sesión normales para cambiar de agentes y modelos. `/new` crea una nueva
sesión de OpenClaw y el mecanismo Codex crea o reanuda su hilo app-server sidecar
según sea necesario. `/reset` borra la vinculación de sesión de OpenClaw para ese hilo
y permite que el siguiente turno vuelva a resolver el mecanismo desde la configuración actual.

## Descubrimiento de modelos

De forma predeterminada, el plugin Codex pide al app-server los modelos disponibles. Si
el descubrimiento falla o agota el tiempo, usa un catálogo fallback incluido para:

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

Deshabilita el descubrimiento cuando quieras que el inicio evite sondear Codex y se mantenga en el
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

## Conexión y política de app-server

De forma predeterminada, el plugin inicia localmente el binario Codex administrado por OpenClaw con:

```bash
codex app-server --listen stdio://
```

El binario administrado se distribuye con el paquete del plugin `codex`. Esto mantiene la
versión de app-server ligada al plugin incluido en lugar de al Codex CLI separado
que resulte estar instalado localmente. Establece `appServer.command` solo cuando
quieras ejecutar intencionalmente otro ejecutable.

De forma predeterminada, OpenClaw inicia sesiones locales del mecanismo Codex en modo YOLO:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` y
`sandbox: "danger-full-access"`. Esta es la postura de operador local de confianza usada
para Heartbeat autónomos: Codex puede usar herramientas de shell y red sin
detenerse en prompts nativos de aprobación que no hay nadie disponible para responder.

Para optar por aprobaciones revisadas por el guardian de Codex, establece `appServer.mode:
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

El modo Guardian usa la ruta nativa de aprobación con revisión automática de Codex. Cuando Codex pide
salir del sandbox, escribir fuera del workspace o agregar permisos como acceso de red,
Codex enruta esa solicitud de aprobación al revisor nativo en lugar de a un
prompt humano. El revisor aplica el marco de riesgo de Codex y aprueba o deniega
la solicitud específica. Usa Guardian cuando quieras más barreras de protección que en modo YOLO
pero aún necesites que los agentes desatendidos avancen.

El preset `guardian` se expande a `approvalPolicy: "on-request"`,
`approvalsReviewer: "auto_review"` y `sandbox: "workspace-write"`.
Los campos de política individuales siguen sobrescribiendo `mode`, por lo que los despliegues avanzados pueden combinar
el preset con elecciones explícitas. El valor de revisor anterior `guardian_subagent` se
sigue aceptando como alias de compatibilidad, pero las configuraciones nuevas deberían usar
`auto_review`.

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

Los lanzamientos de app-server por stdio heredan de forma predeterminada el entorno de proceso de OpenClaw,
pero OpenClaw es dueño del puente de cuenta de app-server de Codex y establece tanto
`CODEX_HOME` como `HOME` en directorios por agente bajo el estado de OpenClaw de ese agente.
El cargador de Skills propio de Codex lee `$CODEX_HOME/skills` y
`$HOME/.agents/skills`, por lo que ambos valores están aislados para lanzamientos locales de app-server.
Eso mantiene las Skills nativas de Codex, plugins, configuración, cuentas y estado de hilos
delimitados al agente de OpenClaw en lugar de filtrarse desde el home personal de Codex CLI
del operador.

Los plugins de OpenClaw y las snapshots de Skills de OpenClaw siguen fluyendo por el propio
registro de plugins y cargador de Skills de OpenClaw. Los activos personales de Codex CLI no lo hacen. Si tienes
Skills o plugins útiles de Codex CLI que deberían formar parte de un agente de OpenClaw,
inventaríalos explícitamente:

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

El proveedor de migración de Codex copia Skills al workspace del agente de OpenClaw actual.
Los plugins nativos de Codex, hooks y archivos de configuración se reportan o archivan
para revisión manual en lugar de activarse automáticamente, porque pueden
ejecutar comandos, exponer servidores MCP o portar credenciales.

La autenticación se selecciona en este orden:

1. Un perfil explícito de autenticación Codex de OpenClaw para el agente.
2. La cuenta existente del app-server en el home de Codex de ese agente.
3. Solo para lanzamientos locales de app-server por stdio, `CODEX_API_KEY`, luego
   `OPENAI_API_KEY`, cuando no hay ninguna cuenta de app-server presente y la autenticación de OpenAI
   sigue siendo necesaria.

Cuando OpenClaw detecta un perfil de autenticación de Codex de estilo suscripción de ChatGPT, elimina
`CODEX_API_KEY` y `OPENAI_API_KEY` del proceso hijo de Codex generado. Eso
mantiene las claves de API de nivel Gateway disponibles para embeddings o modelos directos de OpenAI
sin hacer que los turnos nativos del servidor de aplicaciones de Codex se facturen por la API por accidente.
Los perfiles explícitos de clave de API de Codex y la reserva local de clave de entorno stdio usan el inicio de sesión
del servidor de aplicaciones en lugar del entorno heredado del proceso hijo. Las conexiones WebSocket del servidor de aplicaciones
no reciben la reserva de clave de API de entorno del Gateway; usa un perfil de autenticación explícito o la
propia cuenta del servidor de aplicaciones remoto.

Si un despliegue necesita aislamiento adicional del entorno, añade esas variables a
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

`appServer.clearEnv` solo afecta al proceso hijo generado del servidor de aplicaciones de Codex.

Las herramientas dinámicas de Codex usan de forma predeterminada el perfil `native-first`. En ese modo,
OpenClaw no expone herramientas dinámicas que duplican operaciones del espacio de trabajo nativas de Codex:
`read`, `write`, `edit`, `apply_patch`, `exec`, `process` y
`update_plan`. Las herramientas de integración de OpenClaw, como mensajería, sesiones, medios,
cron, navegador, nodos, gateway, `heartbeat_respond` y `web_search` siguen
disponibles.

Campos de nivel superior admitidos del Plugin de Codex:

| Campo                      | Predeterminado   | Significado                                                                               |
| -------------------------- | ---------------- | ----------------------------------------------------------------------------------------- |
| `codexDynamicToolsProfile` | `"native-first"` | Usa `"openclaw-compat"` para exponer el conjunto completo de herramientas dinámicas de OpenClaw al servidor de aplicaciones de Codex. |
| `codexDynamicToolsExclude` | `[]`             | Nombres adicionales de herramientas dinámicas de OpenClaw que se omiten en los turnos del servidor de aplicaciones de Codex.               |

Campos `appServer` admitidos:

| Campo               | Predeterminado                         | Significado                                                                                                                                                                                                                              |
| ------------------- | -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`         | `"stdio"`                              | `"stdio"` genera Codex; `"websocket"` se conecta a `url`.                                                                                                                                                                                |
| `command`           | binario administrado de Codex          | Ejecutable para el transporte stdio. Déjalo sin definir para usar el binario administrado; establécelo solo para una anulación explícita.                                                                                                |
| `args`              | `["app-server", "--listen", "stdio://"]` | Argumentos para el transporte stdio.                                                                                                                                                                                                     |
| `url`               | sin definir                            | URL WebSocket del servidor de aplicaciones.                                                                                                                                                                                              |
| `authToken`         | sin definir                            | Token Bearer para el transporte WebSocket.                                                                                                                                                                                               |
| `headers`           | `{}`                                   | Encabezados WebSocket adicionales.                                                                                                                                                                                                      |
| `clearEnv`          | `[]`                                   | Nombres adicionales de variables de entorno eliminadas del proceso generado del servidor de aplicaciones stdio después de que OpenClaw construye su entorno heredado. `CODEX_HOME` y `HOME` están reservadas para el aislamiento de Codex por agente de OpenClaw en lanzamientos locales. |
| `requestTimeoutMs`  | `60000`                                | Tiempo de espera para llamadas del plano de control del servidor de aplicaciones.                                                                                                                                                        |
| `mode`              | `"yolo"`                               | Preajuste para ejecución YOLO o revisada por guardian.                                                                                                                                                                                  |
| `approvalPolicy`    | `"never"`                              | Política de aprobación nativa de Codex enviada al iniciar/reanudar hilo/turno.                                                                                                                                                           |
| `sandbox`           | `"danger-full-access"`                 | Modo sandbox nativo de Codex enviado al iniciar/reanudar hilo.                                                                                                                                                                          |
| `approvalsReviewer` | `"user"`                               | Usa `"auto_review"` para permitir que Codex revise las solicitudes de aprobación nativas. `guardian_subagent` sigue siendo un alias heredado.                                                                                            |
| `serviceTier`       | sin definir                            | Nivel de servicio opcional del servidor de aplicaciones de Codex: `"fast"`, `"flex"` o `null`. Los valores heredados no válidos se ignoran.                                                                                              |

Las llamadas a herramientas dinámicas propiedad de OpenClaw se limitan de forma independiente de
`appServer.requestTimeoutMs`: cada solicitud `item/tool/call` de Codex debe recibir
una respuesta de OpenClaw en un plazo de 30 segundos. Al agotarse el tiempo, OpenClaw cancela la señal de la herramienta
cuando es compatible y devuelve una respuesta fallida de herramienta dinámica a Codex para que
el turno pueda continuar en lugar de dejar la sesión en `processing`.

Después de que OpenClaw responde a una solicitud del servidor de aplicaciones de Codex con alcance de turno, el arnés
también espera que Codex termine el turno nativo con `turn/completed`. Si el
servidor de aplicaciones queda en silencio durante 60 segundos después de esa respuesta, OpenClaw intenta en la medida de lo posible
interrumpir el turno de Codex, registra un tiempo de espera de diagnóstico y libera la vía de la
sesión de OpenClaw para que los mensajes de chat de seguimiento no queden encolados detrás de un
turno nativo obsoleto.

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
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` para pruebas locales puntuales. Se
prefiere la configuración para despliegues repetibles porque mantiene el comportamiento del Plugin en el
mismo archivo revisado que el resto de la configuración del arnés de Codex.

## Uso de computadora

Computer Use se cubre en su propia guía de configuración:
[Computer Use de Codex](/es/plugins/codex-computer-use).

La versión breve: OpenClaw no incluye como proveedor la aplicación de control de escritorio ni ejecuta
acciones de escritorio por sí mismo. Prepara el servidor de aplicaciones de Codex, verifica que el
servidor MCP `computer-use` esté disponible y luego permite que Codex gestione las llamadas
a herramientas MCP nativas durante los turnos en modo Codex.

Para acceso directo al controlador TryCua fuera del flujo del marketplace de Codex, registra
`cua-driver mcp` con `openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'`.
Consulta [Computer Use de Codex](/es/plugins/codex-computer-use) para ver la diferencia
entre Computer Use propiedad de Codex y el registro directo de MCP.

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

La configuración puede comprobarse o instalarse desde la superficie de comandos:

- `/codex computer-use status`
- `/codex computer-use install`
- `/codex computer-use install --source <marketplace-source>`
- `/codex computer-use install --marketplace-path <path>`

Computer Use es específico de macOS y puede requerir permisos locales del sistema operativo antes de que el
servidor MCP de Codex pueda controlar aplicaciones. Si `computerUse.enabled` es true y el servidor MCP
no está disponible, los turnos en modo Codex fallan antes de que se inicie el hilo en lugar de
ejecutarse silenciosamente sin las herramientas nativas de Computer Use. Consulta
[Computer Use de Codex](/es/plugins/codex-computer-use) para conocer opciones de marketplace,
límites del catálogo remoto, motivos de estado y resolución de problemas.

Cuando `computerUse.autoInstall` es true, OpenClaw puede registrar el marketplace estándar
incluido de Codex Desktop desde
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` si Codex
aún no ha descubierto un marketplace local. Usa `/new` o `/reset` después de
cambiar la configuración de runtime o Computer Use para que las sesiones existentes no conserven una
vinculación antigua de PI o hilo de Codex.

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

Validación de arnés solo para Codex:

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

Servidor de aplicaciones remoto con encabezados explícitos:

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
a un hilo existente de Codex, el siguiente turno vuelve a enviar al
servidor de aplicaciones el modelo de OpenAI, proveedor, política de aprobación, sandbox y nivel de servicio
seleccionados actualmente. Cambiar de `openai/gpt-5.5` a `openai/gpt-5.2` mantiene la
vinculación del hilo, pero pide a Codex que continúe con el modelo recién seleccionado.

## Comando Codex

El Plugin incluido registra `/codex` como un comando slash autorizado. Es
genérico y funciona en cualquier canal que admita comandos de texto de OpenClaw.

Formas comunes:

- `/codex status` muestra la conectividad activa del servidor de aplicación, los modelos, la cuenta, los límites de tasa, los servidores MCP y las skills.
- `/codex models` enumera los modelos activos del servidor de aplicación de Codex.
- `/codex threads [filter]` enumera los hilos recientes de Codex.
- `/codex resume <thread-id>` adjunta la sesión actual de OpenClaw a un hilo de Codex existente.
- `/codex compact` solicita al servidor de aplicación de Codex que compacte el hilo adjunto.
- `/codex review` inicia la revisión nativa de Codex para el hilo adjunto.
- `/codex diagnostics [note]` solicita confirmación antes de enviar comentarios de diagnóstico de Codex para el hilo adjunto.
- `/codex computer-use status` comprueba el plugin de Computer Use configurado y el servidor MCP.
- `/codex computer-use install` instala el plugin de Computer Use configurado y recarga los servidores MCP.
- `/codex account` muestra el estado de la cuenta y de los límites de tasa.
- `/codex mcp` enumera el estado de los servidores MCP del servidor de aplicación de Codex.
- `/codex skills` enumera las skills del servidor de aplicación de Codex.

Cuando Codex informa de un fallo por límite de uso, OpenClaw incluye la próxima
hora de restablecimiento del servidor de aplicación cuando Codex la haya proporcionado. Usa `/codex account` en la misma
conversación para inspeccionar las ventanas actuales de cuenta y límite de tasa.

### Flujo de depuración común

Cuando un agente respaldado por Codex hace algo inesperado en Telegram, Discord, Slack,
u otro canal, empieza por la conversación donde ocurrió el problema:

1. Ejecuta `/diagnostics bad tool choice after image upload` u otra nota breve
   que describa lo que viste.
2. Aprueba la solicitud de diagnóstico una vez. La aprobación crea el zip local de
   diagnósticos del Gateway y, como la sesión usa el arnés de Codex, también
   envía el paquete de comentarios de Codex pertinente a los servidores de OpenAI.
3. Copia la respuesta de diagnóstico completada en el informe de error o hilo de soporte.
   Incluye la ruta del paquete local, el resumen de privacidad, los ids de sesión de OpenClaw,
   los ids de hilo de Codex y una línea `Inspect locally` para cada hilo de Codex.
4. Si quieres depurar la ejecución por tu cuenta, ejecuta el comando `Inspect locally`
   impreso en una terminal. Se parece a `codex resume <thread-id>` y abre el
   hilo nativo de Codex para que puedas inspeccionar la conversación, continuarla localmente,
   o preguntarle a Codex por qué eligió una herramienta o un plan concretos.

Usa `/codex diagnostics [note]` solo cuando quieras específicamente la carga de
comentarios de Codex para el hilo adjunto actualmente sin el paquete completo de
diagnósticos del Gateway de OpenClaw. Para la mayoría de los informes de soporte, `/diagnostics [note]` es
el mejor punto de partida porque vincula el estado local del Gateway y los ids de hilo de Codex
en una sola respuesta. Consulta [Exportación de diagnósticos](/es/gateway/diagnostics)
para ver el modelo de privacidad completo y el comportamiento en chats grupales.

El núcleo de OpenClaw también expone `/diagnostics [note]`, solo para propietarios, como el comando general de
diagnósticos del Gateway. Su prompt de aprobación muestra el preámbulo de datos
sensibles, enlaza a [Exportación de diagnósticos](/es/gateway/diagnostics) y solicita
`openclaw gateway diagnostics export --json` mediante aprobación explícita de exec
cada vez. No apruebes diagnósticos con una regla de permitir todo. Después de la aprobación,
OpenClaw envía un informe que se puede pegar con la ruta del paquete local y el
resumen del manifiesto. Cuando la sesión activa de OpenClaw usa el arnés de Codex, esa
misma aprobación también autoriza el envío de los paquetes de comentarios de Codex pertinentes a
los servidores de OpenAI. El prompt de aprobación indica que se enviarán comentarios de Codex, pero
no enumera los ids de sesión o hilo de Codex antes de la aprobación.

Si `/diagnostics` lo invoca un propietario en un chat grupal, OpenClaw mantiene limpio el
canal compartido: el grupo recibe solo un aviso breve, mientras que el
preámbulo de diagnóstico, los prompts de aprobación y los ids de sesión/hilo de Codex se envían al
propietario por la ruta de aprobación privada. Si no hay una ruta privada para el propietario,
OpenClaw rechaza la solicitud grupal y pide al propietario que la ejecute desde un DM.

La carga aprobada de Codex llama a `feedback/upload` del servidor de aplicación de Codex y solicita
al servidor de aplicación que incluya registros para cada hilo enumerado y los subhilos de Codex generados
cuando estén disponibles. La carga pasa por la ruta normal de comentarios de Codex hacia los servidores de OpenAI;
si los comentarios de Codex están deshabilitados en ese servidor de aplicación, el comando devuelve
el error del servidor de aplicación. La respuesta de diagnóstico completada enumera los canales,
los ids de sesión de OpenClaw, los ids de hilo de Codex y los comandos locales `codex resume <thread-id>`
para los hilos que se enviaron. Si deniegas o ignoras la aprobación,
OpenClaw no imprime esos ids de Codex. Esta carga no sustituye la exportación local de
diagnósticos del Gateway.

`/codex resume` escribe el mismo archivo de vinculación complementario que el arnés usa para
turnos normales. En el siguiente mensaje, OpenClaw reanuda ese hilo de Codex, pasa el
modelo de OpenClaw seleccionado actualmente al servidor de aplicación y mantiene habilitado el historial
extendido.

### Inspeccionar un hilo de Codex desde la CLI

La forma más rápida de entender una ejecución incorrecta de Codex suele ser abrir directamente el
hilo nativo de Codex:

```sh
codex resume <thread-id>
```

Usa esto cuando notes un error en una conversación de canal y quieras inspeccionar la
sesión problemática de Codex, continuarla localmente o preguntarle a Codex por qué tomó una
decisión concreta de herramienta o razonamiento. La ruta más sencilla suele ser ejecutar
`/diagnostics [note]` primero: después de aprobarlo, el informe completado enumera
cada hilo de Codex e imprime un comando `Inspect locally`, por ejemplo
`codex resume <thread-id>`. Puedes copiar ese comando directamente en una terminal.

También puedes obtener un id de hilo desde `/codex binding` para el chat actual o
`/codex threads [filter]` para hilos recientes del servidor de aplicación de Codex, y luego ejecutar el mismo
comando `codex resume` en tu shell.

La superficie de comandos requiere el servidor de aplicación de Codex `0.125.0` o más reciente. Los
métodos de control individuales se informan como `unsupported by this Codex app-server` si un
servidor de aplicación futuro o personalizado no expone ese método JSON-RPC.

## Límites de los hooks

El arnés de Codex tiene tres capas de hooks:

| Capa                                  | Propietario              | Propósito                                                           |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| Hooks de plugins de OpenClaw          | OpenClaw                 | Compatibilidad de producto/plugin entre arneses de PI y Codex.      |
| Middleware de extensión del servidor de aplicación de Codex | Plugins incluidos con OpenClaw | Comportamiento del adaptador por turno alrededor de las herramientas dinámicas de OpenClaw. |
| Hooks nativos de Codex                | Codex                    | Ciclo de vida de bajo nivel de Codex y política de herramientas nativas desde la configuración de Codex. |

OpenClaw no usa archivos `hooks.json` de proyecto o globales de Codex para enrutar
el comportamiento de plugins de OpenClaw. Para el puente compatible de herramienta nativa y permisos,
OpenClaw inyecta configuración de Codex por hilo para `PreToolUse`, `PostToolUse`,
`PermissionRequest` y `Stop`. Otros hooks de Codex como `SessionStart` y
`UserPromptSubmit` siguen siendo controles de nivel Codex; no se exponen como
hooks de plugins de OpenClaw en el contrato v1.

Para las herramientas dinámicas de OpenClaw, OpenClaw ejecuta la herramienta después de que Codex solicite la
llamada, por lo que OpenClaw dispara el comportamiento de plugin y middleware que posee en el
adaptador del arnés. Para herramientas nativas de Codex, Codex posee el registro canónico de la herramienta.
OpenClaw puede reflejar eventos seleccionados, pero no puede reescribir el hilo nativo de Codex
a menos que Codex exponga esa operación mediante el servidor de aplicación o callbacks de hooks nativos.

Las proyecciones de Compaction y del ciclo de vida de LLM provienen de notificaciones del servidor de aplicación de Codex
y del estado del adaptador de OpenClaw, no de comandos de hooks nativos de Codex.
Los eventos `before_compaction`, `after_compaction`, `llm_input` y
`llm_output` de OpenClaw son observaciones a nivel de adaptador, no capturas byte por byte
de la solicitud interna o las cargas de compaction de Codex.

Las notificaciones nativas `hook/started` y `hook/completed` del servidor de aplicación de Codex se
proyectan como eventos de agente `codex_app_server.hook` para trayectoria y depuración.
No invocan hooks de plugins de OpenClaw.

## Contrato de soporte V1

El modo Codex no es PI con una llamada de modelo diferente por debajo. Codex posee una parte mayor
del bucle nativo del modelo, y OpenClaw adapta sus superficies de plugin y sesión
alrededor de ese límite.

Compatible en el runtime de Codex v1:

| Superficie                                    | Soporte                                 | Motivo                                                                                                                                                                                                |
| --------------------------------------------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Bucle de modelo de OpenAI mediante Codex      | Compatible                              | El servidor de aplicación de Codex posee el turno de OpenAI, la reanudación de hilo nativo y la continuación de herramientas nativas.                                                                |
| Enrutamiento y entrega de canales de OpenClaw | Compatible                              | Telegram, Discord, Slack, WhatsApp, iMessage y otros canales permanecen fuera del runtime del modelo.                                                                                                |
| Herramientas dinámicas de OpenClaw            | Compatible                              | Codex solicita a OpenClaw que ejecute estas herramientas, por lo que OpenClaw permanece en la ruta de ejecución.                                                                                     |
| Plugins de prompt y contexto                  | Compatible                              | OpenClaw crea superposiciones de prompt y proyecta contexto en el turno de Codex antes de iniciar o reanudar el hilo.                                                                                |
| Ciclo de vida del motor de contexto           | Compatible                              | El ensamblaje, la ingesta o el mantenimiento posterior al turno y la coordinación de compaction del motor de contexto se ejecutan para turnos de Codex.                                                |
| Hooks de herramientas dinámicas               | Compatible                              | `before_tool_call`, `after_tool_call` y el middleware de resultados de herramientas se ejecutan alrededor de herramientas dinámicas propiedad de OpenClaw.                                            |
| Hooks de ciclo de vida                        | Compatible como observaciones del adaptador | `llm_input`, `llm_output`, `agent_end`, `before_compaction` y `after_compaction` se disparan con cargas útiles honestas del modo Codex.                                                              |
| Puerta de revisión de respuesta final         | Compatible mediante el relé de hooks nativos | Codex `Stop` se retransmite a `before_agent_finalize`; `revise` solicita a Codex una pasada más del modelo antes de finalizar.                                                                       |
| Bloqueo u observación de shell, patch y MCP nativos | Compatible mediante el relé de hooks nativos | Codex `PreToolUse` y `PostToolUse` se retransmiten para superficies de herramientas nativas confirmadas, incluidas cargas MCP en el servidor de aplicación de Codex `0.125.0` o más reciente. Se admite el bloqueo; no se admite la reescritura de argumentos. |
| Política de permisos nativa                   | Compatible mediante el relé de hooks nativos | Codex `PermissionRequest` puede enrutarse mediante la política de OpenClaw donde el runtime lo expone. Si OpenClaw no devuelve ninguna decisión, Codex continúa por su ruta normal de guardian o aprobación del usuario. |
| Captura de trayectoria del servidor de aplicación | Compatible                              | OpenClaw registra la solicitud que envió al servidor de aplicación y las notificaciones del servidor de aplicación que recibe.                                                                       |

No compatible en el runtime de Codex v1:

| Superficie                                         | Límite V1                                                                                                                                      | Ruta futura                                                                               |
| -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Mutación de argumentos de herramientas nativas     | Los hooks nativos previos a herramientas de Codex pueden bloquear, pero OpenClaw no reescribe argumentos de herramientas nativas de Codex.      | Requiere compatibilidad de hooks/esquema de Codex para reemplazar la entrada de herramienta. |
| Historial editable de transcripción nativa de Codex | Codex posee el historial canónico nativo del hilo. OpenClaw posee un espejo y puede proyectar contexto futuro, pero no debe mutar elementos internos no admitidos. | Agregar API explícitas del servidor de aplicación de Codex si se necesita cirugía del hilo nativo. |
| `tool_result_persist` para registros de herramientas nativas de Codex | Ese hook transforma escrituras de transcripción propiedad de OpenClaw, no registros de herramientas nativas de Codex.                           | Podría reflejar registros transformados, pero la reescritura canónica necesita compatibilidad de Codex. |
| Metadatos enriquecidos de Compaction nativa         | OpenClaw observa el inicio y la finalización de Compaction, pero no recibe una lista estable de conservados/descartados, delta de tokens ni carga útil de resumen. | Necesita eventos de Compaction más enriquecidos de Codex.                                  |
| Intervención de Compaction                          | Los hooks actuales de Compaction de OpenClaw son de nivel de notificación en modo Codex.                                                        | Agregar hooks previos/posteriores a Compaction de Codex si los plugins necesitan vetar o reescribir Compaction nativa. |
| Captura byte por byte de solicitudes de la API del modelo | OpenClaw puede capturar solicitudes y notificaciones del servidor de aplicación, pero el núcleo de Codex construye internamente la solicitud final de la API de OpenAI. | Necesita un evento de trazado de solicitud de modelo de Codex o una API de depuración.     |

## Herramientas, medios y Compaction

El arnés de Codex cambia únicamente el ejecutor de agente embebido de bajo nivel.

OpenClaw sigue construyendo la lista de herramientas y recibe resultados dinámicos de herramientas desde el
arnés. Texto, imágenes, video, música, TTS, aprobaciones y salida de herramientas de mensajería
continúan por la ruta normal de entrega de OpenClaw.

El relé de hooks nativos es intencionalmente genérico, pero el contrato de compatibilidad v1 está
limitado a las rutas de herramientas nativas de Codex y permisos que OpenClaw prueba. En
el runtime de Codex, eso incluye cargas útiles de shell, patch y MCP `PreToolUse`,
`PostToolUse` y `PermissionRequest`. No asumas que cada evento futuro de hook de
Codex sea una superficie de plugin de OpenClaw hasta que el contrato del runtime lo nombre.

Para `PermissionRequest`, OpenClaw solo devuelve decisiones explícitas de permitir o denegar
cuando la política decide. Un resultado sin decisión no es una autorización. Codex lo trata como
sin decisión de hook y continúa hacia su propia ruta de guardián o aprobación del usuario.

Las solicitudes de aprobación de herramientas MCP de Codex se enrutan por el flujo de aprobación de plugins
de OpenClaw cuando Codex marca `_meta.codex_approval_kind` como
`"mcp_tool_call"`. Los prompts `request_user_input` de Codex se envían de vuelta al
chat de origen, y el siguiente mensaje de seguimiento en cola responde a esa solicitud nativa del
servidor en lugar de dirigirse como contexto adicional. Otras solicitudes de elicitación MCP
siguen fallando de forma cerrada.

El direccionamiento de cola de ejecución activa se asigna a `turn/steer` del servidor de aplicación de Codex. Con el
valor predeterminado `messages.queue.mode: "steer"`, OpenClaw agrupa los mensajes de chat en cola
durante la ventana de silencio configurada y los envía como una solicitud `turn/steer` en
orden de llegada. El modo heredado `queue` envía solicitudes `turn/steer` separadas. Los turnos de
revisión de Codex y Compaction manual pueden rechazar el direccionamiento en el mismo turno, en cuyo caso
OpenClaw usa la cola de seguimiento cuando el modo seleccionado permite reserva. Consulta
[Cola de direccionamiento](/es/concepts/queue-steering).

Cuando el modelo seleccionado usa el arnés de Codex, la Compaction nativa del hilo se
delega al servidor de aplicación de Codex. OpenClaw mantiene un espejo de transcripción para el historial del canal,
búsqueda, `/new`, `/reset` y futuros cambios de modelo o arnés. El
espejo incluye el prompt del usuario, el texto final del asistente y registros ligeros de
razonamiento o plan de Codex cuando el servidor de aplicación los emite. Hoy, OpenClaw solo
registra señales de inicio y finalización de Compaction nativa. Todavía no expone un
resumen de Compaction legible por humanos ni una lista auditable de qué entradas conservó Codex
después de Compaction.

Dado que Codex posee el hilo nativo canónico, `tool_result_persist` no
reescribe actualmente registros de resultados de herramientas nativas de Codex. Solo se aplica cuando
OpenClaw escribe un resultado de herramienta de transcripción de sesión propiedad de OpenClaw.

La generación de medios no requiere PI. Imagen, video, música, PDF, TTS y comprensión
de medios siguen usando los ajustes de proveedor/modelo correspondientes, como
`agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel` y
`messages.tts`.

## Solución de problemas

**Codex no aparece como un proveedor `/model` normal:** esto es esperado para
configuraciones nuevas. Selecciona un modelo `openai/gpt-*` con
`agentRuntime.id: "codex"` (o una referencia heredada `codex/*`), habilita
`plugins.entries.codex.enabled` y comprueba si `plugins.allow` excluye
`codex`.

**OpenClaw usa PI en lugar de Codex:** `agentRuntime.id: "auto"` todavía puede usar PI como
backend de compatibilidad cuando ningún arnés de Codex reclama la ejecución. Define
`agentRuntime.id: "codex"` para forzar la selección de Codex durante las pruebas. Un
runtime de Codex forzado falla en lugar de volver a PI. Una vez que se selecciona el servidor de aplicación de Codex,
sus fallos aparecen directamente.

**El servidor de aplicación es rechazado:** actualiza Codex para que el handshake del servidor de aplicación
informe la versión `0.125.0` o posterior. Las versiones preliminares de la misma versión o las versiones con sufijo de compilación
como `0.125.0-alpha.2` o `0.125.0+custom` se rechazan porque el
mínimo de protocolo estable `0.125.0` es lo que OpenClaw prueba.

**La detección de modelos es lenta:** reduce `plugins.entries.codex.config.discovery.timeoutMs`
o deshabilita la detección.

**El transporte WebSocket falla de inmediato:** comprueba `appServer.url`, `authToken`
y que el servidor de aplicación remoto hable la misma versión del protocolo de servidor de aplicación de Codex.

**Un modelo que no es Codex usa PI:** esto es esperado a menos que hayas forzado
`agentRuntime.id: "codex"` para ese agente o hayas seleccionado una referencia heredada
`codex/*`. Las referencias simples `openai/gpt-*` y de otros proveedores permanecen en su ruta normal
de proveedor en modo `auto`. Si fuerzas `agentRuntime.id: "codex"`, cada turno embebido
para ese agente debe ser un modelo OpenAI compatible con Codex.

**Computer Use está instalado, pero las herramientas no se ejecutan:** comprueba
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
