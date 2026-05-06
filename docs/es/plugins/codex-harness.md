---
read_when:
    - Quieres usar el arnés de app-server incluido con Codex
    - Necesitas ejemplos de configuración del arnés de Codex
    - Quieres que las implementaciones solo de Codex fallen en lugar de recurrir a PI
summary: Ejecuta turnos de agente integrado de OpenClaw mediante el arnés de app-server de Codex incluido
title: Arnés de Codex
x-i18n:
    generated_at: "2026-05-06T09:05:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: a35ab08c1a7327437aadb6c2517bd962071bbb25982718d4c0b043680163ab70
    source_path: plugins/codex-harness.md
    workflow: 16
---

El plugin `codex` incluido permite que OpenClaw ejecute turnos de agente integrados a través del
app-server de Codex en lugar del arnés PI integrado.

Usa esto cuando quieras que Codex controle la sesión de agente de bajo nivel: descubrimiento
de modelos, reanudación nativa de hilos, compaction nativa y ejecución del app-server.
OpenClaw sigue controlando los canales de chat, archivos de sesión, selección de modelos, herramientas,
aprobaciones, entrega de medios y el espejo visible de la transcripción.

Cuando un turno de chat de origen se ejecuta a través del arnés de Codex, las respuestas visibles usan de forma predeterminada
la herramienta `message` de OpenClaw si la implementación no ha configurado explícitamente
`messages.visibleReplies`. El agente aún puede finalizar su turno de Codex de forma privada;
solo publica en el canal cuando llama a `message(action="send")`. Define
`messages.visibleReplies: "automatic"` para mantener las respuestas finales de chat directo en la
ruta heredada de entrega automática.

Los turnos de heartbeat de Codex también reciben la herramienta `heartbeat_respond` de forma predeterminada, para que el
agente pueda registrar si el despertar debe permanecer silencioso o notificar sin codificar
ese flujo de control en el texto final.

La guía de iniciativa específica de heartbeat se envía como una instrucción de desarrollador
de modo de colaboración de Codex en el propio turno de heartbeat. Los turnos de chat ordinarios restauran
el modo predeterminado de Codex en lugar de llevar la filosofía de heartbeat en su prompt
de ejecución normal.

Si intentas orientarte, empieza por
[tiempos de ejecución de agente](/es/concepts/agent-runtimes). La versión breve es:
`openai/gpt-5.5` es la referencia de modelo, `codex` es el runtime, y Telegram,
Discord, Slack u otro canal sigue siendo la superficie de comunicación.

## Configuración rápida

La mayoría de los usuarios que quieren "Codex en OpenClaw" quieren esta ruta: iniciar sesión con una
suscripción de ChatGPT/Codex y luego ejecutar turnos de agente integrados mediante el runtime nativo
del app-server de Codex. La referencia de modelo sigue siendo canónica como
`openai/gpt-*`; la autenticación de suscripción viene de la cuenta/perfil de Codex, no
de un prefijo de modelo `openai-codex/*`.

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

No uses `openai-codex/gpt-*` en la configuración. Ese prefijo es una ruta heredada que
`openclaw doctor --fix` reescribe a `openai/gpt-*` en modelos primarios,
fallbacks, anulaciones de heartbeat/subagente/compaction, hooks, anulaciones de canal
y pines obsoletos de ruta de sesión persistida.

## Qué cambia este plugin

El plugin `codex` incluido aporta varias capacidades separadas:

| Capacidad                         | Cómo la usas                                        | Qué hace                                                                       |
| --------------------------------- | --------------------------------------------------- | ----------------------------------------------------------------------------- |
| Runtime integrado nativo          | `agentRuntime.id: "codex"`                          | Ejecuta turnos de agente integrados de OpenClaw a través del app-server de Codex. |
| Comandos nativos de control de chat | `/codex bind`, `/codex resume`, `/codex steer`, ... | Vincula y controla hilos del app-server de Codex desde una conversación de mensajería. |
| Proveedor/catálogo del app-server de Codex | Internos de `codex`, expuestos a través del arnés | Permite que el runtime descubra y valide modelos del app-server.              |
| Ruta de comprensión de medios de Codex | Rutas de compatibilidad de modelos de imagen `codex/*` | Ejecuta turnos acotados del app-server de Codex para modelos compatibles de comprensión de imágenes. |
| Relevo nativo de hooks            | Hooks de plugin alrededor de eventos nativos de Codex | Permite que OpenClaw observe/bloquee eventos compatibles de herramientas/finalización nativos de Codex. |

Habilitar el plugin hace que esas capacidades estén disponibles. **No**:

- empieza a usar Codex para todos los modelos de OpenAI
- convierte refs de modelo `openai-codex/*` en el runtime nativo sin que doctor
  verifique que Codex está instalado, habilitado, aporta el arnés `codex`
  y está listo para OAuth
- convierte ACP/acpx en la ruta predeterminada de Codex
- cambia en caliente sesiones existentes que ya registraron un runtime PI
- reemplaza la entrega de canales de OpenClaw, archivos de sesión, almacenamiento de perfiles de autenticación o
  enrutamiento de mensajes

El mismo plugin también controla la superficie nativa de comandos de control de chat `/codex`. Si
el plugin está habilitado y el usuario pide vincular, reanudar, dirigir, detener o inspeccionar
hilos de Codex desde el chat, los agentes deberían preferir `/codex ...` antes que ACP. ACP sigue siendo
el fallback explícito cuando el usuario pide ACP/acpx o está probando el adaptador ACP
de Codex.

Los turnos nativos de Codex mantienen los hooks de plugin de OpenClaw como la capa pública de compatibilidad.
Estos son hooks de OpenClaw en proceso, no hooks de comando `hooks.json` de Codex:

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `before_tool_call`, `after_tool_call`
- `before_message_write` para registros de transcripción reflejados
- `before_agent_finalize` mediante el relevo `Stop` de Codex
- `agent_end`

Los plugins también pueden registrar middleware de resultados de herramientas neutral respecto al runtime para reescribir
resultados de herramientas dinámicas de OpenClaw después de que OpenClaw ejecute la herramienta y antes de que el
resultado se devuelva a Codex. Esto es independiente del hook público de plugin
`tool_result_persist`, que transforma escrituras de resultados de herramientas de transcripción propiedad de OpenClaw.

Para la semántica de los hooks de plugin en sí, consulta [hooks de plugin](/es/plugins/hooks)
y [comportamiento de guardia de plugin](/es/tools/plugin).

El arnés está desactivado de forma predeterminada. Las configuraciones nuevas deben mantener las refs de modelo de OpenAI
canónicas como `openai/gpt-*` y forzar explícitamente
`agentRuntime.id: "codex"` u `OPENCLAW_AGENT_RUNTIME=codex` cuando
quieran ejecución nativa del app-server. Las refs de modelo heredadas `codex/*` aún seleccionan automáticamente
el arnés por compatibilidad, pero los prefijos de proveedor heredados respaldados por runtime
no se muestran como opciones normales de modelo/proveedor.

Si alguna ruta de modelo configurada sigue siendo `openai-codex/*`, `openclaw doctor --fix`
la reescribe a `openai/*`. Para rutas de agente coincidentes, establece el runtime del agente
en `codex` solo cuando el plugin Codex está instalado, habilitado, aporta el
arnés `codex` y tiene OAuth utilizable; de lo contrario, establece el runtime en `pi`.

## Mapa de rutas

Usa esta tabla antes de cambiar la configuración:

| Comportamiento deseado                              | Ref de modelo              | Configuración de runtime                 | Ruta de autenticación/perfil | Etiqueta de estado esperada     |
| --------------------------------------------------- | -------------------------- | ---------------------------------------- | ---------------------------- | ------------------------------- |
| Suscripción ChatGPT/Codex con runtime nativo de Codex | `openai/gpt-*`             | `agentRuntime.id: "codex"`               | OAuth de Codex o cuenta de Codex | `Runtime: OpenAI Codex`        |
| API de OpenAI mediante el ejecutor normal de OpenClaw | `openai/gpt-*`             | omitido o `runtime: "pi"`                | Clave de API de OpenAI       | `Runtime: OpenClaw Pi Default` |
| Configuración heredada que necesita reparación de doctor | `openai-codex/gpt-*`       | reparado a `codex` o `pi`                | Autenticación configurada existente | Vuelve a comprobar tras `doctor --fix` |
| Proveedores mixtos con modo automático conservador  | refs específicas del proveedor | `agentRuntime.id: "auto"`              | Por proveedor seleccionado   | Depende del runtime seleccionado |
| Sesión explícita del adaptador ACP de Codex         | Dependiente de prompt/modelo de ACP | `sessions_spawn` con `runtime: "acp"` | Autenticación del backend ACP | Estado de tarea/sesión ACP      |

La separación importante es proveedor frente a runtime:

- `openai-codex/*` es una ruta heredada que doctor reescribe.
- `agentRuntime.id: "codex"` requiere el arnés de Codex y falla cerrado si
  no está disponible.
- `agentRuntime.id: "auto"` permite que los arneses registrados reclamen rutas de proveedor
  coincidentes, pero las refs canónicas de OpenAI siguen siendo propiedad de PI salvo que un arnés admita
  ese par proveedor/modelo.
- `/codex ...` responde "¿a qué conversación nativa de Codex debe vincularse
  o controlar este chat?"
- ACP responde "¿qué proceso de arnés externo debe iniciar acpx?"

## Elige el prefijo de modelo correcto

Las rutas de la familia OpenAI son específicas por prefijo. Para la configuración común de suscripción más
runtime nativo de Codex, usa `openai/*` con `agentRuntime.id: "codex"`.
Trata `openai-codex/*` como configuración heredada que doctor debe reescribir:

| Ref de modelo                                 | Ruta de runtime                             | Cuándo usarlo                                                              |
| --------------------------------------------- | ------------------------------------------- | -------------------------------------------------------------------------- |
| `openai/gpt-5.4`                              | Proveedor OpenAI mediante la infraestructura OpenClaw/PI | Quieres acceso actual directo a la API de OpenAI Platform con `OPENAI_API_KEY`. |
| `openai-codex/gpt-5.5`                        | Ruta heredada reparada por doctor           | Estás en una configuración antigua; ejecuta `openclaw doctor --fix` para reescribirla. |
| `openai/gpt-5.5` + `agentRuntime.id: "codex"` | Arnés del app-server de Codex               | Quieres autenticación de suscripción ChatGPT/Codex con ejecución nativa de Codex. |

GPT-5.5 puede aparecer tanto en rutas directas con clave de API de OpenAI como en rutas de suscripción de Codex
cuando tu cuenta las expone. Usa `openai/gpt-5.5` con el arnés del app-server de Codex
para runtime nativo de Codex, o `openai/gpt-5.5` sin una anulación de runtime de Codex
para tráfico directo con clave de API.

Las refs heredadas `codex/gpt-*` siguen aceptándose como alias de compatibilidad. La migración
de compatibilidad de doctor reescribe refs de runtime heredadas a refs de modelo canónicas
y registra la política de runtime por separado. Las nuevas configuraciones nativas del arnés del app-server
deberían usar `openai/gpt-*` más `agentRuntime.id: "codex"`.

`agents.defaults.imageModel` sigue la misma separación de prefijos. Usa
`openai/gpt-*` para la ruta normal de OpenAI y `codex/gpt-*` cuando la comprensión
de imágenes deba ejecutarse mediante un turno acotado del app-server de Codex. No uses
`openai-codex/gpt-*`; doctor reescribe ese prefijo heredado a `openai/gpt-*`. El
modelo del app-server de Codex debe anunciar compatibilidad con entrada de imágenes; los modelos de Codex
solo de texto fallan antes de que empiece el turno de medios.

Usa `/status` para confirmar el arnés efectivo de la sesión actual. Si la
selección sorprende, habilita el registro de depuración para el subsistema `agents/harness`
e inspecciona el registro estructurado `agent harness selected` del gateway. Incluye
el id del arnés seleccionado, el motivo de selección, la política de runtime/fallback y,
en modo `auto`, el resultado de compatibilidad de cada candidato de plugin.

### Qué significan las advertencias de doctor

`openclaw doctor` advierte cuando las refs de modelo configuradas o el estado persistido de ruta de sesión
siguen usando `openai-codex/*`. `openclaw doctor --fix` reescribe esas rutas
a:

- `openai/<model>`
- `agentRuntime.id: "codex"` cuando Codex está instalado, habilitado, aporta el
  arnés `codex` y tiene OAuth utilizable
- `agentRuntime.id: "pi"` en caso contrario

La ruta `codex` fuerza el arnés nativo de Codex. La ruta `pi` mantiene el
agente en el ejecutor predeterminado de OpenClaw en lugar de habilitar o instalar Codex como
efecto secundario de la limpieza de rutas heredadas.
Doctor también repara pines obsoletos de sesión persistida en los almacenes de sesiones de agente
descubiertos para que las conversaciones antiguas no queden bloqueadas en la ruta eliminada.

La selección del harness no es un control de sesión en vivo. Cuando se ejecuta un turno integrado,
OpenClaw registra el id del harness seleccionado en esa sesión y lo sigue usando para
turnos posteriores en el mismo id de sesión. Cambia la configuración `agentRuntime` o
`OPENCLAW_AGENT_RUNTIME` cuando quieras que las sesiones futuras usen otro harness;
usa `/new` o `/reset` para iniciar una sesión nueva antes de cambiar una conversación
existente entre PI y Codex. Esto evita reproducir una transcripción a través de
dos sistemas de sesión nativos incompatibles.

Las sesiones heredadas creadas antes de los pins de harness se tratan como ancladas a PI una vez que
tienen historial de transcripción. Usa `/new` o `/reset` para optar esa conversación por
Codex después de cambiar la configuración.

`/status` muestra el runtime de modelo efectivo. El harness PI predeterminado aparece como
`Runtime: OpenClaw Pi Default`, y el harness del servidor de aplicaciones de Codex aparece como
`Runtime: OpenAI Codex`.

## Requisitos

- OpenClaw con el plugin `codex` incluido disponible.
- Servidor de aplicaciones de Codex `0.125.0` o posterior. El plugin incluido gestiona un binario
  compatible del servidor de aplicaciones de Codex de forma predeterminada, por lo que los comandos locales `codex` en `PATH` no
  afectan al inicio normal del harness.
- Autenticación de Codex disponible para el proceso del servidor de aplicaciones o para el puente de autenticación de Codex de OpenClaw.
  Los lanzamientos locales del servidor de aplicaciones usan un directorio de inicio de Codex gestionado por OpenClaw para cada
  agente y un `HOME` hijo aislado, por lo que no leen tu cuenta personal
  `~/.codex`, Skills, plugins, configuración, estado de hilos ni
  `$HOME/.agents/skills` nativo de forma predeterminada.

El plugin bloquea handshakes del servidor de aplicaciones antiguos o sin versión. Eso mantiene a
OpenClaw en la superficie de protocolo contra la que se ha probado.

Para pruebas smoke en vivo y Docker, la autenticación suele venir de la cuenta de Codex CLI
o de un perfil de autenticación `openai-codex` de OpenClaw. Los lanzamientos locales del servidor de aplicaciones por stdio también pueden
recurrir a `CODEX_API_KEY` / `OPENAI_API_KEY` cuando no hay ninguna cuenta presente.

## Archivos de arranque del workspace

Codex gestiona `AGENTS.md` por sí mismo mediante el descubrimiento nativo de documentación de proyecto. OpenClaw
no escribe archivos sintéticos de documentación de proyecto de Codex ni depende de nombres de archivo de respaldo de Codex
para archivos de persona, porque los respaldos de Codex solo se aplican cuando
falta `AGENTS.md`.

Para la paridad del workspace de OpenClaw, el harness de Codex resuelve los demás archivos de arranque
(`SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`,
`BOOTSTRAP.md` y `MEMORY.md` cuando están presentes) y los reenvía mediante instrucciones
de desarrollador de Codex en `thread/start` y `thread/resume`. Esto mantiene
`SOUL.md` y el contexto relacionado de persona/perfil del workspace visibles en la vía nativa
de modelado de comportamiento de Codex sin duplicar `AGENTS.md`.

## Añadir Codex junto a otros modelos

No configures `agentRuntime.id: "codex"` globalmente si el mismo agente debe cambiar libremente
entre Codex y modelos de proveedores que no son Codex. Un runtime forzado se aplica a cada
turno integrado para ese agente o sesión. Si seleccionas un modelo de Anthropic mientras
ese runtime está forzado, OpenClaw sigue intentando usar el harness de Codex y falla de forma cerrada
en lugar de enrutar silenciosamente ese turno a través de PI.

Usa una de estas formas en su lugar:

- Pon Codex en un agente dedicado con `agentRuntime.id: "codex"`.
- Mantén el agente predeterminado en `agentRuntime.id: "auto"` y el respaldo de PI para el uso mixto normal
  de proveedores.
- Usa refs heredadas `codex/*` solo por compatibilidad. Las configuraciones nuevas deberían preferir
  `openai/*` más una política explícita de runtime de Codex.

Por ejemplo, esto mantiene el agente predeterminado en la selección automática normal y
añade un agente Codex separado:

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

- El agente predeterminado `main` usa la ruta normal de proveedor y el respaldo de compatibilidad de PI.
- El agente `codex` usa el harness del servidor de aplicaciones de Codex.
- Si Codex falta o no es compatible para el agente `codex`, el turno falla
  en lugar de usar PI silenciosamente.

## Enrutamiento de comandos de agente

Los agentes deberían enrutar las solicitudes de usuario por intención, no solo por la palabra "Codex":

| El usuario pide...                                     | El agente debería usar...                         |
| ------------------------------------------------------ | ------------------------------------------------ |
| "Vincula este chat a Codex"                            | `/codex bind`                                    |
| "Reanuda el hilo de Codex `<id>` aquí"                 | `/codex resume <id>`                             |
| "Muestra los hilos de Codex"                           | `/codex threads`                                 |
| "Envía un informe de soporte por una ejecución defectuosa de Codex" | `/diagnostics [note]`                            |
| "Envía comentarios de Codex solo para este hilo adjunto" | `/codex diagnostics [note]`                      |
| "Usa mi suscripción de ChatGPT/Codex con el runtime de Codex" | `openai/*` más `agentRuntime.id: "codex"`        |
| "Repara pins antiguos de configuración/sesión `openai-codex/*`" | `openclaw doctor --fix`                          |
| "Ejecuta Codex mediante ACP/acpx"                      | ACP `sessions_spawn({ runtime: "acp", ... })`    |
| "Inicia Claude Code/Gemini/OpenCode/Cursor en un hilo" | ACP/acpx, no `/codex` ni subagentes nativos      |

OpenClaw solo anuncia a los agentes la guía de spawn de ACP cuando ACP está habilitado,
es despachable y está respaldado por un backend de runtime cargado. Si ACP no está disponible,
el prompt del sistema y las Skills del plugin no deberían enseñar al agente sobre el enrutamiento
de ACP.

## Despliegues solo con Codex

Fuerza el harness de Codex cuando necesites demostrar que cada turno de agente integrado
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

Anulación de entorno:

```bash
OPENCLAW_AGENT_RUNTIME=codex openclaw gateway run
```

Con Codex forzado, OpenClaw falla pronto si el plugin de Codex está deshabilitado, el
servidor de aplicaciones es demasiado antiguo o el servidor de aplicaciones no puede iniciarse.

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

Usa los comandos normales de sesión para cambiar agentes y modelos. `/new` crea una sesión nueva de
OpenClaw y el harness de Codex crea o reanuda su hilo sidecar del servidor de aplicaciones
según sea necesario. `/reset` borra la vinculación de sesión de OpenClaw para ese hilo
y permite que el siguiente turno resuelva el harness desde la configuración actual otra vez.

## Descubrimiento de modelos

De forma predeterminada, el plugin de Codex solicita al servidor de aplicaciones los modelos disponibles. Si
el descubrimiento falla o agota el tiempo, usa un catálogo de respaldo incluido para:

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
catálogo de respaldo:

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

## Conexión y política del servidor de aplicaciones

De forma predeterminada, el plugin inicia localmente el binario gestionado de Codex de OpenClaw con:

```bash
codex app-server --listen stdio://
```

El binario gestionado se distribuye con el paquete del plugin `codex`. Esto mantiene la versión del
servidor de aplicaciones vinculada al plugin incluido en lugar de a cualquier Codex CLI separado
que esté instalado localmente. Configura `appServer.command` solo cuando
quieras ejecutar intencionadamente un ejecutable distinto.

De forma predeterminada, OpenClaw inicia sesiones locales del harness de Codex en modo YOLO:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` y
`sandbox: "danger-full-access"`. Esta es la postura de operador local de confianza usada
para Heartbeats autónomos: Codex puede usar herramientas de shell y red sin
detenerse en prompts nativos de aprobación que nadie está disponible para responder.

Para optar por aprobaciones revisadas por el guardián de Codex, configura `appServer.mode:
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

El modo guardián usa la ruta de aprobación con revisión automática nativa de Codex. Cuando Codex pide
salir del sandbox, escribir fuera del workspace o añadir permisos como acceso de red,
Codex enruta esa solicitud de aprobación al revisor nativo en lugar de a un
prompt humano. El revisor aplica el marco de riesgo de Codex y aprueba o deniega
la solicitud específica. Usa Guardian cuando quieras más barandillas que en el modo YOLO
pero sigas necesitando que agentes desatendidos avancen.

El preset `guardian` se expande a `approvalPolicy: "on-request"`,
`approvalsReviewer: "auto_review"` y `sandbox: "workspace-write"`.
Los campos de política individuales siguen anulando `mode`, por lo que los despliegues avanzados pueden mezclar
el preset con elecciones explícitas. El valor de revisor anterior `guardian_subagent`
sigue aceptándose como alias de compatibilidad, pero las configuraciones nuevas deberían usar
`auto_review`.

Para un servidor de aplicaciones ya en ejecución, usa el transporte WebSocket:

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

Los lanzamientos del servidor de aplicaciones por stdio heredan el entorno de proceso de OpenClaw de forma predeterminada,
pero OpenClaw posee el puente de cuenta del servidor de aplicaciones de Codex y configura tanto
`CODEX_HOME` como `HOME` en directorios por agente bajo el estado de OpenClaw de ese agente.
El cargador de Skills propio de Codex lee `$CODEX_HOME/skills` y
`$HOME/.agents/skills`, por lo que ambos valores están aislados para lanzamientos locales del servidor de aplicaciones.
Eso mantiene las Skills nativas de Codex, plugins, configuración, cuentas y estado de hilos
acotados al agente de OpenClaw en lugar de filtrarse desde el directorio de inicio personal de Codex CLI
del operador.

Los plugins de OpenClaw y las instantáneas de Skills de OpenClaw siguen fluyendo por el propio
registro de plugins y cargador de Skills de OpenClaw. Los recursos personales de Codex CLI no lo hacen. Si tienes
Skills o plugins útiles de Codex CLI que deberían pasar a formar parte de un agente de OpenClaw,
haz un inventario explícito:

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

El proveedor de migración de Codex copia Skills al workspace del agente actual de OpenClaw.
Los plugins nativos de Codex, hooks y archivos de configuración se informan o archivan
para revisión manual en lugar de activarse automáticamente, porque pueden
ejecutar comandos, exponer servidores MCP o portar credenciales.

La autenticación se selecciona en este orden:

1. Un perfil explícito de autenticación de Codex de OpenClaw para el agente.
2. La cuenta existente del servidor de aplicaciones en el directorio de inicio de Codex de ese agente.
3. Solo para lanzamientos locales del servidor de aplicaciones por stdio, `CODEX_API_KEY`, luego
   `OPENAI_API_KEY`, cuando no hay cuenta de servidor de aplicaciones presente y aún se requiere
   autenticación de OpenAI.

Cuando OpenClaw ve un perfil de autenticación de Codex de estilo suscripción de ChatGPT, elimina
`CODEX_API_KEY` y `OPENAI_API_KEY` del proceso hijo de Codex generado. Eso
mantiene las claves API de nivel Gateway disponibles para embeddings o modelos directos de OpenAI
sin hacer que los turnos nativos del servidor de aplicación de Codex se facturen accidentalmente a través de la API.
Los perfiles explícitos de clave API de Codex y la alternativa local de clave de entorno stdio usan el inicio de sesión
del servidor de aplicación en lugar del entorno heredado del proceso hijo. Las conexiones
WebSocket del servidor de aplicación no reciben la alternativa de clave API de entorno de Gateway; usa un perfil de autenticación explícito o la
cuenta propia del servidor de aplicación remoto.

Si un despliegue necesita aislamiento adicional del entorno, agrega esas variables a
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

`appServer.clearEnv` solo afecta al proceso hijo del servidor de aplicación de Codex generado.

Las herramientas dinámicas de Codex usan de forma predeterminada el perfil `native-first`. En ese modo,
OpenClaw no expone herramientas dinámicas que duplican operaciones nativas de Codex en el espacio de trabajo:
`read`, `write`, `edit`, `apply_patch`, `exec`, `process` y
`update_plan`. Las herramientas de integración de OpenClaw, como mensajería, sesiones, medios,
cron, navegador, nodos, gateway, `heartbeat_respond` y `web_search`, siguen
disponibles.

Campos de Plugin de Codex de nivel superior compatibles:

| Campo                      | Valor predeterminado | Significado                                                                                   |
| -------------------------- | -------------------- | --------------------------------------------------------------------------------------------- |
| `codexDynamicToolsProfile` | `"native-first"`     | Usa `"openclaw-compat"` para exponer el conjunto completo de herramientas dinámicas de OpenClaw al servidor de aplicación de Codex. |
| `codexDynamicToolsExclude` | `[]`                 | Nombres adicionales de herramientas dinámicas de OpenClaw que se omitirán en los turnos del servidor de aplicación de Codex.               |

Campos `appServer` compatibles:

| Campo               | Valor predeterminado                     | Significado                                                                                                                                                                                                                              |
| ------------------- | ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`         | `"stdio"`                                | `"stdio"` genera Codex; `"websocket"` se conecta a `url`.                                                                                                                                                                             |
| `command`           | binario de Codex gestionado              | Ejecutable para el transporte stdio. Déjalo sin definir para usar el binario gestionado; establécelo solo para una anulación explícita.                                                                                                                         |
| `args`              | `["app-server", "--listen", "stdio://"]` | Argumentos para el transporte stdio.                                                                                                                                                                                                       |
| `url`               | sin definir                              | URL WebSocket del servidor de aplicación.                                                                                                                                                                                                            |
| `authToken`         | sin definir                              | Token Bearer para el transporte WebSocket.                                                                                                                                                                                                |
| `headers`           | `{}`                                     | Encabezados WebSocket adicionales.                                                                                                                                                                                                             |
| `clearEnv`          | `[]`                                     | Nombres adicionales de variables de entorno eliminadas del proceso stdio del servidor de aplicación generado después de que OpenClaw construye su entorno heredado. `CODEX_HOME` y `HOME` están reservadas para el aislamiento de Codex por agente de OpenClaw en lanzamientos locales. |
| `requestTimeoutMs`  | `60000`                                  | Tiempo de espera para llamadas del plano de control del servidor de aplicación.                                                                                                                                                                                          |
| `mode`              | `"yolo"`                                 | Preajuste para ejecución YOLO o revisada por guardian.                                                                                                                                                                                      |
| `approvalPolicy`    | `"never"`                                | Política de aprobación nativa de Codex enviada al inicio, reanudación o turno del hilo.                                                                                                                                                                       |
| `sandbox`           | `"danger-full-access"`                   | Modo de sandbox nativo de Codex enviado al inicio o reanudación del hilo.                                                                                                                                                                               |
| `approvalsReviewer` | `"user"`                                 | Usa `"auto_review"` para permitir que Codex revise solicitudes de aprobación nativas. `guardian_subagent` sigue siendo un alias heredado.                                                                                                                         |
| `serviceTier`       | sin definir                              | Nivel de servicio opcional del servidor de aplicación de Codex: `"fast"`, `"flex"` o `null`. Los valores heredados no válidos se ignoran.                                                                                                                            |

Las llamadas de herramientas dinámicas propiedad de OpenClaw están limitadas de forma independiente de
`appServer.requestTimeoutMs`: cada solicitud `item/tool/call` de Codex debe recibir
una respuesta de OpenClaw en un plazo de 30 segundos. Al agotarse el tiempo, OpenClaw cancela la señal de herramienta
cuando es compatible y devuelve una respuesta de herramienta dinámica fallida a Codex para que
el turno pueda continuar en lugar de dejar la sesión en `processing`.

Después de que OpenClaw responde a una solicitud del servidor de aplicación con alcance de turno de Codex, el arnés
también espera que Codex termine el turno nativo con `turn/completed`. Si el
servidor de aplicación queda en silencio durante 60 segundos después de esa respuesta, OpenClaw intenta, con el mejor esfuerzo,
interrumpir el turno de Codex, registra un tiempo de espera de diagnóstico y libera el carril de sesión de
OpenClaw para que los mensajes de chat posteriores no queden en cola detrás de un turno nativo obsoleto.

Las anulaciones de entorno siguen disponibles para pruebas locales:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN` omite el binario gestionado cuando
`appServer.command` no está definido.

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` se eliminó. Usa
`plugins.entries.codex.config.appServer.mode: "guardian"` en su lugar, o
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` para pruebas locales puntuales. Se
prefiere la configuración para despliegues repetibles porque mantiene el comportamiento del Plugin en el
mismo archivo revisado que el resto de la configuración del arnés de Codex.

## Uso de la computadora

Computer Use se cubre en su propia guía de configuración:
[Codex Computer Use](/es/plugins/codex-computer-use).

La versión corta: OpenClaw no incorpora la aplicación de control de escritorio ni ejecuta
acciones de escritorio por sí mismo. Prepara el servidor de aplicación de Codex, verifica que el servidor MCP
`computer-use` esté disponible y luego permite que Codex gestione las llamadas nativas a herramientas
MCP durante los turnos en modo Codex.

Para acceso directo al controlador TryCua fuera del flujo del marketplace de Codex, registra
`cua-driver mcp` con `openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'`.
Consulta [Codex Computer Use](/es/plugins/codex-computer-use) para la distinción
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

La configuración se puede comprobar o instalar desde la superficie de comandos:

- `/codex computer-use status`
- `/codex computer-use install`
- `/codex computer-use install --source <marketplace-source>`
- `/codex computer-use install --marketplace-path <path>`

Computer Use es específico de macOS y puede requerir permisos locales del sistema operativo antes de que el
servidor MCP de Codex pueda controlar aplicaciones. Si `computerUse.enabled` es true y el servidor MCP
no está disponible, los turnos en modo Codex fallan antes de que se inicie el hilo, en lugar de
ejecutarse silenciosamente sin las herramientas nativas de Computer Use. Consulta
[Codex Computer Use](/es/plugins/codex-computer-use) para opciones de marketplace,
límites del catálogo remoto, motivos de estado y solución de problemas.

Cuando `computerUse.autoInstall` es true, OpenClaw puede registrar el marketplace estándar
incluido de Codex Desktop desde
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` si Codex
aún no ha descubierto un marketplace local. Usa `/new` o `/reset` después de
cambiar la configuración de tiempo de ejecución o Computer Use para que las sesiones existentes no conserven una vinculación antigua de
PI o de hilo de Codex.

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

Servidor de aplicación remoto con encabezados explícitos:

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
a un hilo existente de Codex, el siguiente turno vuelve a enviar el modelo
OpenAI, proveedor, política de aprobación, sandbox y nivel de servicio seleccionados actualmente al
servidor de aplicación. Cambiar de `openai/gpt-5.5` a `openai/gpt-5.2` mantiene la
vinculación del hilo, pero pide a Codex que continúe con el modelo recién seleccionado.

## Comando de Codex

El Plugin incluido registra `/codex` como un comando de barra diagonal autorizado. Es
genérico y funciona en cualquier canal que admita comandos de texto de OpenClaw.

Formas comunes:

- `/codex status` muestra la conectividad activa con el servidor de aplicación, los modelos, la cuenta, los límites de tasa, los servidores MCP y las skills.
- `/codex models` enumera los modelos activos del servidor de aplicación de Codex.
- `/codex threads [filter]` enumera los hilos recientes de Codex.
- `/codex resume <thread-id>` adjunta la sesión actual de OpenClaw a un hilo existente de Codex.
- `/codex compact` pide al servidor de aplicación de Codex que compacte el hilo adjunto.
- `/codex review` inicia la revisión nativa de Codex para el hilo adjunto.
- `/codex diagnostics [note]` solicita confirmación antes de enviar comentarios de diagnóstico de Codex para el hilo adjunto.
- `/codex computer-use status` comprueba el plugin Computer Use configurado y el servidor MCP.
- `/codex computer-use install` instala el plugin Computer Use configurado y recarga los servidores MCP.
- `/codex account` muestra el estado de la cuenta y de los límites de tasa.
- `/codex mcp` enumera el estado de los servidores MCP del servidor de aplicación de Codex.
- `/codex skills` enumera las skills del servidor de aplicación de Codex.

Cuando Codex informa de un fallo por límite de uso, OpenClaw incluye la siguiente hora de
restablecimiento del servidor de aplicación cuando Codex proporcionó una. Usa `/codex account` en la misma
conversación para inspeccionar la cuenta actual y las ventanas de límite de tasa.

### Flujo de trabajo común de depuración

Cuando un agente respaldado por Codex hace algo inesperado en Telegram, Discord, Slack
u otro canal, empieza con la conversación donde ocurrió el problema:

1. Ejecuta `/diagnostics bad tool choice after image upload` u otra nota breve
   que describa lo que viste.
2. Aprueba una vez la solicitud de diagnóstico. La aprobación crea el zip local de diagnósticos del Gateway
   y, como la sesión está usando el arnés de Codex, también
   envía el paquete de comentarios relevante de Codex a los servidores de OpenAI.
3. Copia la respuesta de diagnóstico completada en el informe de error o en el hilo de soporte.
   Incluye la ruta del paquete local, el resumen de privacidad, los id. de sesión de OpenClaw,
   los id. de hilo de Codex y una línea `Inspect locally` para cada hilo de Codex.
4. Si quieres depurar la ejecución por tu cuenta, ejecuta en una terminal el comando `Inspect locally`
   impreso. Se parece a `codex resume <thread-id>` y abre el
   hilo nativo de Codex para que puedas inspeccionar la conversación, continuarla localmente
   o preguntar a Codex por qué eligió una herramienta o plan concreto.

Usa `/codex diagnostics [note]` solo cuando quieras específicamente la carga de
comentarios de Codex para el hilo actualmente adjunto sin el paquete completo de diagnósticos del
Gateway de OpenClaw. Para la mayoría de los informes de soporte, `/diagnostics [note]` es
el mejor punto de partida porque vincula el estado local del Gateway y los id. de hilo de Codex
en una sola respuesta. Consulta [Exportación de diagnósticos](/es/gateway/diagnostics)
para ver el modelo completo de privacidad y el comportamiento en chats grupales.

El núcleo de OpenClaw también expone `/diagnostics [note]`, solo para propietarios, como el comando general
de diagnósticos del Gateway. Su solicitud de aprobación muestra el preámbulo de datos sensibles,
enlaza a [Exportación de diagnósticos](/es/gateway/diagnostics) y solicita
`openclaw gateway diagnostics export --json` mediante aprobación explícita de ejecución
cada vez. No apruebes diagnósticos con una regla de permitir todo. Tras la aprobación,
OpenClaw envía un informe pegable con la ruta del paquete local y el resumen del manifiesto.
Cuando la sesión activa de OpenClaw usa el arnés de Codex, esa
misma aprobación también autoriza el envío de los paquetes de comentarios relevantes de Codex a
los servidores de OpenAI. La solicitud de aprobación indica que se enviarán comentarios de Codex, pero
no enumera los id. de sesión o hilo de Codex antes de la aprobación.

Si un propietario invoca `/diagnostics` en un chat grupal, OpenClaw mantiene limpio el
canal compartido: el grupo recibe solo un aviso breve, mientras que el
preámbulo de diagnósticos, las solicitudes de aprobación y los id. de sesión/hilo de Codex se envían al
propietario mediante la ruta privada de aprobación. Si no hay una ruta privada hacia el propietario,
OpenClaw rechaza la solicitud del grupo y pide al propietario que la ejecute desde un MD.

La carga aprobada de Codex llama a `feedback/upload` del servidor de aplicación de Codex y pide
al servidor de aplicación que incluya registros para cada hilo enumerado y subhilos de Codex generados
cuando estén disponibles. La carga pasa por la ruta normal de comentarios de Codex hacia los servidores de OpenAI;
si los comentarios de Codex están deshabilitados en ese servidor de aplicación, el comando devuelve
el error del servidor de aplicación. La respuesta de diagnóstico completada enumera los canales,
los id. de sesión de OpenClaw, los id. de hilo de Codex y los comandos locales `codex resume <thread-id>`
para los hilos que se enviaron. Si deniegas o ignoras la aprobación,
OpenClaw no imprime esos id. de Codex. Esta carga no sustituye la exportación local de diagnósticos del
Gateway.

`/codex resume` escribe el mismo archivo de enlace complementario que el arnés usa para
turnos normales. En el siguiente mensaje, OpenClaw reanuda ese hilo de Codex, pasa el
modelo de OpenClaw seleccionado actualmente al servidor de aplicación y mantiene habilitado el historial
extendido.

### Inspeccionar un hilo de Codex desde la CLI

La forma más rápida de entender una ejecución problemática de Codex suele ser abrir directamente el hilo
nativo de Codex:

```sh
codex resume <thread-id>
```

Usa esto cuando notes un error en una conversación de canal y quieras inspeccionar la
sesión problemática de Codex, continuarla localmente o preguntar a Codex por qué tomó una
decisión concreta de herramienta o razonamiento. La ruta más sencilla suele ser ejecutar
`/diagnostics [note]` primero: después de aprobarlo, el informe completado enumera
cada hilo de Codex e imprime un comando `Inspect locally`, por ejemplo
`codex resume <thread-id>`. Puedes copiar ese comando directamente en una terminal.

También puedes obtener un id. de hilo desde `/codex binding` para el chat actual o
`/codex threads [filter]` para hilos recientes del servidor de aplicación de Codex, y luego ejecutar el mismo
comando `codex resume` en tu shell.

La superficie de comandos requiere el servidor de aplicación de Codex `0.125.0` o posterior. Los
métodos de control individuales se informan como `unsupported by this Codex app-server` si un
servidor de aplicación futuro o personalizado no expone ese método JSON-RPC.

## Límites de hooks

El arnés de Codex tiene tres capas de hooks:

| Capa                                  | Propietario              | Propósito                                                           |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| Hooks de plugins de OpenClaw          | OpenClaw                 | Compatibilidad de producto/plugin entre arneses de PI y Codex.      |
| Middleware de extensión del servidor de aplicación de Codex | Plugins incluidos de OpenClaw | Comportamiento del adaptador por turno alrededor de herramientas dinámicas de OpenClaw. |
| Hooks nativos de Codex                | Codex                    | Ciclo de vida de bajo nivel de Codex y política nativa de herramientas desde la configuración de Codex. |

OpenClaw no usa archivos `hooks.json` de proyecto ni globales de Codex para enrutar
el comportamiento de plugins de OpenClaw. Para el puente admitido de herramientas nativas y permisos,
OpenClaw inyecta configuración de Codex por hilo para `PreToolUse`, `PostToolUse`,
`PermissionRequest` y `Stop`. Otros hooks de Codex, como `SessionStart` y
`UserPromptSubmit`, siguen siendo controles de nivel Codex; no se exponen como
hooks de plugins de OpenClaw en el contrato v1.

Para las herramientas dinámicas de OpenClaw, OpenClaw ejecuta la herramienta después de que Codex solicita la
llamada, por lo que OpenClaw dispara el comportamiento de plugin y middleware que posee en el
adaptador del arnés. Para herramientas nativas de Codex, Codex posee el registro canónico de la herramienta.
OpenClaw puede reflejar eventos seleccionados, pero no puede reescribir el hilo nativo de Codex
a menos que Codex exponga esa operación mediante el servidor de aplicación o callbacks de hooks nativos.

Las proyecciones de Compaction y del ciclo de vida del LLM vienen de las notificaciones del servidor de aplicación de Codex
y del estado del adaptador de OpenClaw, no de comandos de hooks nativos de Codex.
Los eventos `before_compaction`, `after_compaction`, `llm_input` y
`llm_output` de OpenClaw son observaciones de nivel adaptador, no capturas byte por byte
de la solicitud interna de Codex ni de las cargas de Compaction.

Las notificaciones `hook/started` y `hook/completed` del servidor de aplicación nativo de Codex se
proyectan como eventos de agente `codex_app_server.hook` para trayectoria y depuración.
No invocan hooks de plugins de OpenClaw.

## Contrato de soporte v1

El modo Codex no es PI con una llamada de modelo distinta por debajo. Codex posee más del
bucle de modelo nativo, y OpenClaw adapta sus superficies de plugin y sesión
alrededor de ese límite.

Admitido en el runtime v1 de Codex:

| Superficie                                    | Soporte                                 | Por qué                                                                                                                                                                                              |
| --------------------------------------------- | --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Bucle de modelo OpenAI mediante Codex         | Admitido                                | El servidor de aplicación de Codex posee el turno de OpenAI, la reanudación de hilo nativo y la continuación de herramientas nativas.                                                               |
| Enrutamiento y entrega de canales de OpenClaw | Admitido                                | Telegram, Discord, Slack, WhatsApp, iMessage y otros canales permanecen fuera del runtime del modelo.                                                                                                |
| Herramientas dinámicas de OpenClaw            | Admitido                                | Codex pide a OpenClaw que ejecute estas herramientas, por lo que OpenClaw permanece en la ruta de ejecución.                                                                                         |
| Plugins de prompt y contexto                  | Admitido                                | OpenClaw construye superposiciones de prompt y proyecta contexto en el turno de Codex antes de iniciar o reanudar el hilo.                                                                           |
| Ciclo de vida del motor de contexto           | Admitido                                | El ensamblaje, la ingesta o el mantenimiento posterior al turno, y la coordinación de Compaction del motor de contexto se ejecutan para turnos de Codex.                                             |
| Hooks de herramientas dinámicas               | Admitido                                | `before_tool_call`, `after_tool_call` y el middleware de resultados de herramientas se ejecutan alrededor de herramientas dinámicas propiedad de OpenClaw.                                           |
| Hooks de ciclo de vida                        | Admitidos como observaciones del adaptador | `llm_input`, `llm_output`, `agent_end`, `before_compaction` y `after_compaction` se disparan con cargas honestas del modo Codex.                                                                     |
| Puerta de revisión de respuesta final         | Admitido mediante el relé de hook nativo | `Stop` de Codex se retransmite a `before_agent_finalize`; `revise` pide a Codex una pasada más del modelo antes de finalizar.                                                                       |
| Bloqueo u observación de shell, patch y MCP nativos | Admitido mediante el relé de hook nativo | `PreToolUse` y `PostToolUse` de Codex se retransmiten para superficies de herramientas nativas confirmadas, incluidas cargas MCP en el servidor de aplicación de Codex `0.125.0` o posterior. Se admite el bloqueo; no se admite la reescritura de argumentos. |
| Política de permisos nativa                   | Admitido mediante el relé de hook nativo | `PermissionRequest` de Codex puede enrutarse mediante la política de OpenClaw donde el runtime lo expone. Si OpenClaw no devuelve ninguna decisión, Codex continúa por su ruta normal de guardián o aprobación de usuario. |
| Captura de trayectoria del servidor de aplicación | Admitido                            | OpenClaw registra la solicitud que envió al servidor de aplicación y las notificaciones del servidor de aplicación que recibe.                                                                       |

No admitido en el runtime v1 de Codex:

| Superficie                                         | Límite de V1                                                                                                                                              | Ruta futura                                                                                     |
| --------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Mutación de argumentos de herramientas nativas      | Los hooks nativos previos a herramientas de Codex pueden bloquear, pero OpenClaw no reescribe argumentos de herramientas nativas de Codex.                | Requiere soporte de hooks/esquemas de Codex para reemplazar la entrada de herramientas.          |
| Historial editable de transcripciones nativas de Codex | Codex posee el historial canónico de hilos nativos. OpenClaw posee un espejo y puede proyectar contexto futuro, pero no debería mutar internals no soportados. | Agregar APIs explícitas del app-server de Codex si se necesita cirugía de hilos nativos.         |
| `tool_result_persist` para registros de herramientas nativas de Codex | Ese hook transforma escrituras de transcripción propiedad de OpenClaw, no registros de herramientas nativas de Codex.                                     | Podría espejar registros transformados, pero la reescritura canónica necesita soporte de Codex.  |
| Metadatos nativos enriquecidos de Compaction        | OpenClaw observa el inicio y la finalización de Compaction, pero no recibe una lista estable de conservados/descartados, delta de tokens ni carga útil de resumen. | Necesita eventos de Compaction de Codex más enriquecidos.                                        |
| Intervención de Compaction                          | Los hooks actuales de Compaction de OpenClaw son de nivel de notificación en modo Codex.                                                                   | Agregar hooks previos/posteriores a Compaction de Codex si los plugins necesitan vetar o reescribir la Compaction nativa. |
| Captura byte por byte de solicitudes de API de modelo | OpenClaw puede capturar solicitudes y notificaciones del app-server, pero el núcleo de Codex construye internamente la solicitud final a la API de OpenAI. | Necesita un evento de trazado de solicitudes de modelo de Codex o una API de depuración.         |

## Herramientas, medios y Compaction

El arnés de Codex cambia solamente el ejecutor de agentes incrustado de bajo nivel.

OpenClaw todavía construye la lista de herramientas y recibe resultados de herramientas dinámicas desde el arnés. Texto, imágenes, video, música, TTS, aprobaciones y salida de herramientas de mensajería continúan por la ruta normal de entrega de OpenClaw.

El relay de hooks nativos es intencionalmente genérico, pero el contrato de soporte de v1 se limita a las rutas de herramientas y permisos nativas de Codex que OpenClaw prueba. En el runtime de Codex, eso incluye cargas útiles de shell, patch y MCP `PreToolUse`, `PostToolUse` y `PermissionRequest`. No asumas que cada evento futuro de hook de Codex es una superficie de plugin de OpenClaw hasta que el contrato de runtime lo nombre.

Para `PermissionRequest`, OpenClaw solo devuelve decisiones explícitas de permitir o denegar cuando la política decide. Un resultado sin decisión no es una autorización. Codex lo trata como ausencia de decisión de hook y continúa hacia su propia ruta de guardian o aprobación del usuario.

Las solicitudes de aprobación de herramientas MCP de Codex se enrutan a través del flujo de aprobación de plugins de OpenClaw cuando Codex marca `_meta.codex_approval_kind` como `"mcp_tool_call"`. Los prompts de Codex `request_user_input` se envían de vuelta al chat de origen, y el siguiente mensaje de seguimiento en cola responde a esa solicitud del servidor nativo en lugar de dirigirse como contexto adicional. Otras solicitudes de elicitación MCP siguen fallando de forma cerrada.

La dirección de cola de ejecuciones activas se mapea a `turn/steer` del app-server de Codex. Con el valor predeterminado `messages.queue.mode: "steer"`, OpenClaw agrupa los mensajes de chat en cola durante la ventana de silencio configurada y los envía como una sola solicitud `turn/steer` en orden de llegada. El modo heredado `queue` envía solicitudes `turn/steer` separadas. Los turnos de revisión de Codex y Compaction manual pueden rechazar la dirección en el mismo turno, en cuyo caso OpenClaw usa la cola de seguimiento cuando el modo seleccionado permite fallback. Consulta [Cola de dirección](/es/concepts/queue-steering).

Cuando el modelo seleccionado usa el arnés de Codex, la Compaction de hilos nativos se delega al app-server de Codex. OpenClaw mantiene un espejo de transcripción para historial de canales, búsqueda, `/new`, `/reset` y cambio futuro de modelo o arnés. El espejo incluye el prompt del usuario, el texto final del asistente y registros ligeros de razonamiento o plan de Codex cuando el app-server los emite. Actualmente, OpenClaw solo registra señales de inicio y finalización de Compaction nativa. Todavía no expone un resumen de Compaction legible por humanos ni una lista auditable de qué entradas conservó Codex después de Compaction.

Como Codex posee el hilo nativo canónico, `tool_result_persist` no reescribe actualmente registros de resultados de herramientas nativas de Codex. Solo se aplica cuando OpenClaw escribe un resultado de herramienta en una transcripción de sesión propiedad de OpenClaw.

La generación de medios no requiere PI. La comprensión de imágenes, video, música, PDF, TTS y medios continúa usando la configuración de proveedor/modelo correspondiente, como `agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel` y `messages.tts`.

## Solución de problemas

**Codex no aparece como un proveedor normal de `/model`:** esto es lo esperado para configuraciones nuevas. Selecciona un modelo `openai/gpt-*` con `agentRuntime.id: "codex"` (o una referencia heredada `codex/*`), habilita `plugins.entries.codex.enabled` y comprueba si `plugins.allow` excluye `codex`.

**OpenClaw usa PI en lugar de Codex:** `agentRuntime.id: "auto"` todavía puede usar PI como backend de compatibilidad cuando ningún arnés de Codex reclama la ejecución. Configura `agentRuntime.id: "codex"` para forzar la selección de Codex durante las pruebas. Un runtime de Codex forzado falla en lugar de volver a PI. Una vez seleccionado el app-server de Codex, sus fallos aparecen directamente.

**El app-server es rechazado:** actualiza Codex para que el handshake del app-server informe la versión `0.125.0` o posterior. Prereleases de la misma versión o versiones con sufijo de build como `0.125.0-alpha.2` o `0.125.0+custom` se rechazan porque el piso de protocolo estable `0.125.0` es lo que OpenClaw prueba.

**El descubrimiento de modelos es lento:** reduce `plugins.entries.codex.config.discovery.timeoutMs` o deshabilita el descubrimiento.

**El transporte WebSocket falla inmediatamente:** comprueba `appServer.url`, `authToken` y que el app-server remoto hable la misma versión del protocolo app-server de Codex.

**Un modelo que no es Codex usa PI:** eso es lo esperado a menos que hayas forzado `agentRuntime.id: "codex"` para ese agente o seleccionado una referencia heredada `codex/*`. Las referencias simples `openai/gpt-*` y de otros proveedores permanecen en su ruta normal de proveedor en modo `auto`. Si fuerzas `agentRuntime.id: "codex"`, cada turno incrustado para ese agente debe ser un modelo de OpenAI soportado por Codex.

**Computer Use está instalado pero las herramientas no se ejecutan:** comprueba `/codex computer-use status` desde una sesión nueva. Si una herramienta informa `Native hook relay unavailable`, usa `/new` o `/reset`; si persiste, reinicia el gateway para limpiar registros obsoletos de hooks nativos. Si `computer-use.list_apps` agota el tiempo de espera, reinicia Codex Computer Use o Codex Desktop y vuelve a intentarlo.

## Relacionado

- [Plugins de arnés de agentes](/es/plugins/sdk-agent-harness)
- [Runtimes de agentes](/es/concepts/agent-runtimes)
- [Proveedores de modelos](/es/concepts/model-providers)
- [Proveedor de OpenAI](/es/providers/openai)
- [Estado](/es/cli/status)
- [Hooks de plugins](/es/plugins/hooks)
- [Referencia de configuración](/es/gateway/configuration-reference)
- [Pruebas](/es/help/testing-live#live-codex-app-server-harness-smoke)
