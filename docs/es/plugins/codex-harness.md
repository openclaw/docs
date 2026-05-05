---
read_when:
    - Quieres usar el arnés app-server de Codex incluido
    - Necesitas ejemplos de configuración del arnés de Codex
    - Quieres que los despliegues solo con Codex fallen en lugar de recurrir a PI
summary: Ejecuta turnos de agente integrado de OpenClaw mediante el arnés app-server de Codex incluido
title: Entorno de ejecución de Codex
x-i18n:
    generated_at: "2026-05-05T01:47:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: 76302351e7e162e858dd6e3cffca84b3fd54497dd060104da9f90fe4c1a33f9b
    source_path: plugins/codex-harness.md
    workflow: 16
---

El Plugin `codex` incluido permite que OpenClaw ejecute turnos de agente insertados a través del
servidor de aplicación de Codex en lugar del arnés PI integrado.

Úsalo cuando quieras que Codex sea responsable de la sesión de agente de bajo nivel: descubrimiento de
modelos, reanudación nativa de hilos, compaction nativa y ejecución en servidor de aplicación.
OpenClaw sigue siendo responsable de los canales de chat, archivos de sesión, selección de modelos, herramientas,
aprobaciones, entrega de medios y el espejo visible de la transcripción.

Cuando un turno de chat de origen se ejecuta a través del arnés de Codex, las respuestas visibles usan por defecto
la herramienta `message` de OpenClaw si el despliegue no ha configurado explícitamente
`messages.visibleReplies`. El agente aún puede terminar su turno de Codex en privado;
solo publica en el canal cuando llama a `message(action="send")`. Define
`messages.visibleReplies: "automatic"` para mantener las respuestas finales de chat directo en la
ruta de entrega automática heredada.

Los turnos de heartbeat de Codex también reciben la herramienta `heartbeat_respond` por defecto, de modo que el
agente pueda registrar si el despertar debe permanecer silencioso o notificar sin codificar
ese flujo de control en el texto final.

La guía de iniciativa específica de Heartbeat se envía como una instrucción de desarrollador en
modo de colaboración de Codex en el propio turno de heartbeat. Los turnos de chat ordinarios restauran
el modo predeterminado de Codex en lugar de llevar la filosofía de heartbeat en su prompt normal de
runtime.

Si intentas orientarte, empieza con
[Runtimes de agente](/es/concepts/agent-runtimes). La versión corta es:
`openai/gpt-5.5` es la referencia del modelo, `codex` es el runtime, y Telegram,
Discord, Slack u otro canal sigue siendo la superficie de comunicación.

## Configuración rápida

La mayoría de usuarios que quieren "Codex en OpenClaw" quieren esta ruta: iniciar sesión con una
suscripción de ChatGPT/Codex y luego ejecutar turnos de agente insertados a través del runtime nativo
del servidor de aplicación de Codex. La referencia del modelo sigue siendo canónica como
`openai/gpt-*`; la autenticación de suscripción proviene de la cuenta o perfil de Codex, no
de un prefijo de modelo `openai-codex/*`.

Primero inicia sesión con OAuth de Codex si aún no lo has hecho:

```bash
openclaw models auth login --provider openai-codex
```

Luego habilita el Plugin `codex` incluido y fuerza el runtime de Codex:

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

No uses `openai-codex/gpt-*` cuando te refieras al runtime nativo de Codex. Ese prefijo
es la ruta explícita "OAuth de Codex a través de PI". Los cambios de configuración se aplican a sesiones nuevas o
restablecidas; las sesiones existentes conservan su runtime registrado.

## Qué cambia este Plugin

El Plugin `codex` incluido aporta varias capacidades independientes:

| Capacidad                         | Cómo la usas                                        | Qué hace                                                                       |
| --------------------------------- | --------------------------------------------------- | ------------------------------------------------------------------------------ |
| Runtime insertado nativo          | `agentRuntime.id: "codex"`                          | Ejecuta turnos de agente insertados de OpenClaw a través del servidor de aplicación de Codex. |
| Comandos nativos de control de chat | `/codex bind`, `/codex resume`, `/codex steer`, ... | Vincula y controla hilos del servidor de aplicación de Codex desde una conversación de mensajería. |
| Proveedor/catálogo del servidor de aplicación de Codex | `codex` internals, surfaced through the harness     | Permite que el runtime descubra y valide modelos del servidor de aplicación.   |
| Ruta de comprensión de medios de Codex | `codex/*` image-model compatibility paths           | Ejecuta turnos acotados del servidor de aplicación de Codex para modelos compatibles de comprensión de imágenes. |
| Relay de hook nativo              | Hooks de Plugin alrededor de eventos nativos de Codex | Permite que OpenClaw observe/bloquee eventos compatibles de herramientas/finalización nativos de Codex. |

Habilitar el Plugin deja disponibles esas capacidades. **No** hace lo siguiente:

- empezar a usar Codex para todos los modelos de OpenAI
- convertir referencias de modelo `openai-codex/*` al runtime nativo
- hacer que ACP/acpx sea la ruta predeterminada de Codex
- cambiar en caliente sesiones existentes que ya registraron un runtime PI
- reemplazar la entrega por canales, archivos de sesión, almacenamiento de perfiles de autenticación o
  enrutamiento de mensajes de OpenClaw

El mismo Plugin también es responsable de la superficie nativa de comandos de control de chat `/codex`. Si
el Plugin está habilitado y el usuario pide vincular, reanudar, dirigir, detener o inspeccionar
hilos de Codex desde el chat, los agentes deben preferir `/codex ...` sobre ACP. ACP sigue siendo
la alternativa explícita cuando el usuario pide ACP/acpx o está probando el adaptador ACP de
Codex.

Los turnos nativos de Codex conservan los hooks de Plugin de OpenClaw como capa pública de compatibilidad.
Estos son hooks de OpenClaw en proceso, no hooks de comando `hooks.json` de Codex:

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `before_tool_call`, `after_tool_call`
- `before_message_write` para registros de transcripción espejados
- `before_agent_finalize` a través del relay `Stop` de Codex
- `agent_end`

Los Plugins también pueden registrar middleware de resultados de herramientas neutral al runtime para reescribir
los resultados de herramientas dinámicas de OpenClaw después de que OpenClaw ejecuta la herramienta y antes de que
el resultado se devuelva a Codex. Esto es independiente del hook de Plugin público
`tool_result_persist`, que transforma escrituras de resultados de herramientas en la transcripción propiedad de OpenClaw.

Para conocer la semántica de los hooks de Plugin, consulta [Hooks de Plugin](/es/plugins/hooks)
y [Comportamiento de guardia de Plugin](/es/tools/plugin).

El arnés está desactivado por defecto. Las configuraciones nuevas deben mantener las referencias de modelo de OpenAI
canónicas como `openai/gpt-*` y forzar explícitamente
`agentRuntime.id: "codex"` u `OPENCLAW_AGENT_RUNTIME=codex` cuando quieran
ejecución nativa en servidor de aplicación. Las referencias heredadas de modelo `codex/*` siguen seleccionando automáticamente
el arnés por compatibilidad, pero los prefijos heredados de proveedor respaldados por runtime
no se muestran como opciones normales de modelo/proveedor.

Si el Plugin `codex` está habilitado pero el modelo principal sigue siendo
`openai-codex/*`, `openclaw doctor` advierte en lugar de cambiar la ruta. Esto es
intencional: `openai-codex/*` sigue siendo la ruta PI de OAuth/suscripción de Codex, y
la ejecución nativa en servidor de aplicación sigue siendo una elección explícita de runtime.

## Mapa de rutas

Usa esta tabla antes de cambiar la configuración:

| Comportamiento deseado                              | Referencia de modelo       | Configuración de runtime                | Ruta de autenticación/perfil | Etiqueta de estado esperada    |
| --------------------------------------------------- | -------------------------- | --------------------------------------- | ---------------------------- | ------------------------------- |
| Suscripción de ChatGPT/Codex con runtime nativo de Codex | `openai/gpt-*`             | `agentRuntime.id: "codex"`              | OAuth de Codex o cuenta de Codex | `Runtime: OpenAI Codex`         |
| API de OpenAI a través del ejecutor normal de OpenClaw | `openai/gpt-*`             | omitido o `runtime: "pi"`               | Clave de API de OpenAI       | `Runtime: OpenClaw Pi Default`  |
| Suscripción de ChatGPT/Codex a través de PI          | `openai-codex/gpt-*`       | omitido o `runtime: "pi"`               | Proveedor OAuth de OpenAI Codex | `Runtime: OpenClaw Pi Default`  |
| Proveedores mixtos con modo automático conservador   | referencias específicas del proveedor | `agentRuntime.id: "auto"`               | Según el proveedor seleccionado | Depende del runtime seleccionado |
| Sesión explícita del adaptador ACP de Codex          | dependiente de prompt/modelo ACP | `sessions_spawn` con `runtime: "acp"` | Autenticación del backend ACP | Estado de tarea/sesión ACP      |

La separación importante es proveedor frente a runtime:

- `openai-codex/*` responde "¿qué ruta de proveedor/autenticación debe usar PI?"
- `agentRuntime.id: "codex"` responde "¿qué bucle debe ejecutar este
  turno insertado?"
- `/codex ...` responde "¿a qué conversación nativa de Codex debe vincularse
  o controlar este chat?"
- ACP responde "¿qué proceso de arnés externo debe lanzar acpx?"

## Elegir el prefijo de modelo correcto

Las rutas de la familia OpenAI son específicas del prefijo. Para la configuración común de suscripción más
runtime nativo de Codex, usa `openai/*` con `agentRuntime.id: "codex"`.
Usa `openai-codex/*` solo cuando quieras intencionalmente OAuth de Codex a través de PI:

| Referencia de modelo                         | Ruta de runtime                             | Úsala cuando                                                             |
| -------------------------------------------- | ------------------------------------------- | ------------------------------------------------------------------------ |
| `openai/gpt-5.4`                             | Proveedor de OpenAI a través de la canalización OpenClaw/PI | Quieres acceso actual directo a la API de OpenAI Platform con `OPENAI_API_KEY`. |
| `openai-codex/gpt-5.5`                       | OAuth de OpenAI Codex a través de OpenClaw/PI | Quieres autenticación de suscripción de ChatGPT/Codex con el ejecutor PI predeterminado. |
| `openai/gpt-5.5` + `agentRuntime.id: "codex"` | Arnés del servidor de aplicación de Codex    | Quieres autenticación de suscripción de ChatGPT/Codex con ejecución nativa de Codex. |

GPT-5.5 puede aparecer tanto en rutas directas con clave de API de OpenAI como en rutas de suscripción de Codex
cuando tu cuenta las expone. Usa `openai/gpt-5.5` con el arnés del servidor de aplicación de Codex
para el runtime nativo de Codex, `openai-codex/gpt-5.5` para OAuth de PI, o
`openai/gpt-5.5` sin una anulación de runtime de Codex para tráfico directo con clave de API.

Las referencias heredadas `codex/gpt-*` siguen aceptándose como alias de compatibilidad. La migración de
compatibilidad de doctor reescribe las referencias heredadas de runtime principal a referencias de modelo canónicas
y registra la política de runtime por separado, mientras que las referencias heredadas usadas solo como alternativa
se dejan sin cambios porque el runtime se configura para todo el contenedor de agente.
Las nuevas configuraciones PI de OAuth de Codex deben usar `openai-codex/gpt-*`; las nuevas configuraciones nativas
del arnés de servidor de aplicación deben usar `openai/gpt-*` más
`agentRuntime.id: "codex"`.

`agents.defaults.imageModel` sigue la misma separación de prefijos. Usa
`openai-codex/gpt-*` cuando la comprensión de imágenes deba ejecutarse a través de la ruta del proveedor OAuth de OpenAI
Codex. Usa `codex/gpt-*` cuando la comprensión de imágenes deba ejecutarse
a través de un turno acotado del servidor de aplicación de Codex. El modelo del servidor de aplicación de Codex debe
anunciar compatibilidad con entrada de imagen; los modelos de Codex solo de texto fallan antes de que empiece el turno de medios.

Usa `/status` para confirmar el arnés efectivo de la sesión actual. Si la
selección sorprende, habilita el registro de depuración para el subsistema `agents/harness`
e inspecciona el registro estructurado `agent harness selected` del Gateway. Incluye
el id del arnés seleccionado, la razón de selección, la política de runtime/alternativa y,
en modo `auto`, el resultado de compatibilidad de cada candidato de Plugin.

### Qué significan las advertencias de doctor

`openclaw doctor` advierte cuando todo esto es verdadero:

- el Plugin `codex` incluido está habilitado o permitido
- el modelo principal de un agente es `openai-codex/*`
- el runtime efectivo de ese agente no es `codex`

Esa advertencia existe porque los usuarios a menudo esperan que "Plugin de Codex habilitado" implique
"runtime nativo del servidor de aplicación de Codex". OpenClaw no hace ese salto. La advertencia
significa:

- **No se requiere ningún cambio** si pretendías usar OAuth de ChatGPT/Codex a través de PI.
- Cambia el modelo a `openai/<model>` y define
  `agentRuntime.id: "codex"` si pretendías usar ejecución nativa en servidor de aplicación.
- Las sesiones existentes aún necesitan `/new` o `/reset` después de un cambio de runtime,
  porque los pines de runtime de sesión son persistentes.

La selección de arnés no es un control de sesión en vivo. Cuando se ejecuta un turno insertado,
OpenClaw registra el id del arnés seleccionado en esa sesión y lo sigue usando para
turnos posteriores en el mismo id de sesión. Cambia la configuración `agentRuntime` o
`OPENCLAW_AGENT_RUNTIME` cuando quieras que sesiones futuras usen otro arnés;
usa `/new` o `/reset` para iniciar una sesión nueva antes de cambiar una conversación existente
entre PI y Codex. Esto evita reproducir una misma transcripción a través de
dos sistemas de sesión nativos incompatibles.

Las sesiones heredadas creadas antes de los pines de arnés se tratan como ancladas a PI una vez que
tienen historial de transcripción. Usa `/new` o `/reset` para incorporar esa conversación a
Codex después de cambiar la configuración.

`/status` muestra el runtime de modelo efectivo. El arnés PI predeterminado aparece como
`Runtime: OpenClaw Pi Default`, y el arnés del servidor de aplicación Codex aparece como
`Runtime: OpenAI Codex`.

## Requisitos

- OpenClaw con el Plugin `codex` incluido disponible.
- Servidor de aplicación Codex `0.125.0` o más reciente. El Plugin incluido gestiona un binario
  de servidor de aplicación Codex compatible de forma predeterminada, por lo que los comandos
  `codex` locales en `PATH` no afectan el inicio normal del arnés.
- Autenticación de Codex disponible para el proceso del servidor de aplicación o para el puente
  de autenticación Codex de OpenClaw. Los lanzamientos locales del servidor de aplicación usan un
  inicio de Codex gestionado por OpenClaw para cada agente y un `HOME` hijo aislado, por lo que no leen tu
  cuenta, Skills, plugins, configuración, estado de hilos ni
  `$HOME/.agents/skills` nativo personal de `~/.codex` de forma predeterminada.

El Plugin bloquea los handshakes de servidores de aplicación antiguos o sin versión. Eso mantiene
a OpenClaw en la superficie de protocolo contra la que se ha probado.

Para pruebas de humo en vivo y Docker, la autenticación suele venir de la cuenta de la CLI de Codex
o de un perfil de autenticación `openai-codex` de OpenClaw. Los lanzamientos locales de servidor de aplicación stdio también pueden
recurrir a `CODEX_API_KEY` / `OPENAI_API_KEY` cuando no hay ninguna cuenta presente.

## Archivos de arranque del espacio de trabajo

Codex gestiona `AGENTS.md` por sí mismo mediante el descubrimiento nativo de documentación de proyecto. OpenClaw
no escribe archivos sintéticos de documentación de proyecto de Codex ni depende de nombres de archivo alternativos de Codex
para archivos de persona, porque las alternativas de Codex solo se aplican cuando
falta `AGENTS.md`.

Para la paridad del espacio de trabajo de OpenClaw, el arnés Codex resuelve los demás archivos de arranque
(`SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`,
`BOOTSTRAP.md` y `MEMORY.md` cuando están presentes) y los reenvía mediante instrucciones de configuración de Codex
en `thread/start` y `thread/resume`. Esto mantiene
`SOUL.md` y el contexto relacionado de persona/perfil del espacio de trabajo visibles sin
duplicar `AGENTS.md`.

## Añadir Codex junto con otros modelos

No establezcas `agentRuntime.id: "codex"` globalmente si el mismo agente debe cambiar libremente
entre Codex y modelos de proveedores que no son Codex. Un runtime forzado se aplica a cada
turno incrustado de ese agente o sesión. Si seleccionas un modelo de Anthropic mientras
ese runtime está forzado, OpenClaw sigue intentando usar el arnés Codex y falla cerrado
en lugar de enrutar silenciosamente ese turno a través de PI.

Usa una de estas formas en su lugar:

- Pon Codex en un agente dedicado con `agentRuntime.id: "codex"`.
- Mantén el agente predeterminado en `agentRuntime.id: "auto"` y la alternativa PI para el uso normal mixto
  de proveedores.
- Usa referencias heredadas `codex/*` solo por compatibilidad. Las configuraciones nuevas deberían preferir
  `openai/*` más una política explícita de runtime Codex.

Por ejemplo, esto mantiene el agente predeterminado en la selección automática normal y
añade un agente Codex independiente:

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

- El agente `main` predeterminado usa la ruta normal del proveedor y la alternativa de compatibilidad PI.
- El agente `codex` usa el arnés del servidor de aplicación Codex.
- Si Codex falta o no es compatible con el agente `codex`, el turno falla
  en lugar de usar PI silenciosamente.

## Enrutamiento de comandos de agente

Los agentes deberían enrutar las solicitudes de usuario por intención, no solo por la palabra "Codex":

| El usuario pide...                                     | El agente debería usar...                         |
| ------------------------------------------------------ | ------------------------------------------------ |
| "Vincula este chat a Codex"                            | `/codex bind`                                    |
| "Reanuda el hilo Codex `<id>` aquí"                    | `/codex resume <id>`                             |
| "Muestra los hilos Codex"                              | `/codex threads`                                 |
| "Envía un informe de soporte por una ejecución defectuosa de Codex" | `/diagnostics [note]`                            |
| "Envía solo comentarios de Codex para este hilo adjunto" | `/codex diagnostics [note]`                      |
| "Usa mi suscripción de ChatGPT/Codex con el runtime Codex" | `openai/*` más `agentRuntime.id: "codex"`       |
| "Usa mi suscripción de ChatGPT/Codex a través de PI"   | referencias de modelo `openai-codex/*`           |
| "Ejecuta Codex mediante ACP/acpx"                      | ACP `sessions_spawn({ runtime: "acp", ... })`    |
| "Inicia Claude Code/Gemini/OpenCode/Cursor en un hilo" | ACP/acpx, no `/codex` ni subagentes nativos      |

OpenClaw solo anuncia orientación de generación de ACP a los agentes cuando ACP está habilitado,
es despachable y está respaldado por un backend de runtime cargado. Si ACP no está disponible,
el prompt del sistema y las Skills del Plugin no deberían enseñar al agente sobre el enrutamiento
ACP.

## Despliegues solo con Codex

Fuerza el arnés Codex cuando necesites demostrar que cada turno de agente incrustado
usa Codex. Los runtimes explícitos de Plugin fallan cerrados y nunca se reintentan silenciosamente
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

Anulación por entorno:

```bash
OPENCLAW_AGENT_RUNTIME=codex openclaw gateway run
```

Con Codex forzado, OpenClaw falla pronto si el Plugin Codex está deshabilitado, si el
servidor de aplicación es demasiado antiguo o si el servidor de aplicación no puede iniciar.

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

Usa los comandos de sesión normales para cambiar de agentes y modelos. `/new` crea una sesión nueva
de OpenClaw y el arnés Codex crea o reanuda su hilo auxiliar de servidor de aplicación
según sea necesario. `/reset` borra la vinculación de sesión de OpenClaw para ese hilo
y permite que el siguiente turno resuelva de nuevo el arnés desde la configuración actual.

## Descubrimiento de modelos

De forma predeterminada, el Plugin Codex pide al servidor de aplicación los modelos disponibles. Si
el descubrimiento falla o agota el tiempo, usa un catálogo alternativo incluido para:

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

Deshabilita el descubrimiento cuando quieras que el inicio evite sondear Codex y se limite al
catálogo alternativo:

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

## Conexión y política del servidor de aplicación

De forma predeterminada, el Plugin inicia localmente el binario Codex gestionado por OpenClaw con:

```bash
codex app-server --listen stdio://
```

El binario gestionado se distribuye con el paquete del Plugin `codex`. Esto mantiene la
versión del servidor de aplicación ligada al Plugin incluido en lugar de a cualquier CLI
de Codex independiente que esté instalada localmente. Establece `appServer.command` solo cuando
quieras ejecutar intencionalmente un ejecutable diferente.

De forma predeterminada, OpenClaw inicia las sesiones locales del arnés Codex en modo YOLO:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` y
`sandbox: "danger-full-access"`. Esta es la postura de operador local de confianza usada
para Heartbeat autónomos: Codex puede usar herramientas de shell y red sin
detenerse en prompts nativos de aprobación que nadie está disponible para responder.

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

El modo guardián usa la ruta nativa de aprobación con revisión automática de Codex. Cuando Codex pide
salir del sandbox, escribir fuera del espacio de trabajo o añadir permisos como acceso de red,
Codex enruta esa solicitud de aprobación al revisor nativo en lugar de a un
prompt humano. El revisor aplica el marco de riesgo de Codex y aprueba o deniega
la solicitud específica. Usa guardián cuando quieras más salvaguardas que el modo YOLO
pero aun así necesites que agentes no atendidos avancen.

El ajuste preestablecido `guardian` se expande a `approvalPolicy: "on-request"`,
`approvalsReviewer: "auto_review"` y `sandbox: "workspace-write"`.
Los campos de política individuales siguen anulando `mode`, por lo que los despliegues avanzados pueden mezclar
el ajuste preestablecido con elecciones explícitas. El valor de revisor anterior `guardian_subagent`
todavía se acepta como alias de compatibilidad, pero las configuraciones nuevas deberían usar
`auto_review`.

Para un servidor de aplicación que ya está en ejecución, usa transporte WebSocket:

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

Los lanzamientos de servidor de aplicación stdio heredan el entorno de proceso de OpenClaw de forma predeterminada,
pero OpenClaw posee el puente de cuenta del servidor de aplicación Codex y establece tanto
`CODEX_HOME` como `HOME` en directorios por agente bajo el estado de OpenClaw
de ese agente. El propio cargador de Skills de Codex lee `$CODEX_HOME/skills` y
`$HOME/.agents/skills`, por lo que ambos valores están aislados para lanzamientos locales del servidor de aplicación.
Eso mantiene las Skills, plugins, configuración, cuentas y estado de hilos nativos de Codex
acotados al agente de OpenClaw en lugar de filtrarse desde el inicio personal de la CLI
Codex del operador.

Los plugins de OpenClaw y las instantáneas de Skills de OpenClaw siguen fluyendo a través del propio
registro de plugins y cargador de Skills de OpenClaw. Los recursos personales de la CLI de Codex no. Si tienes
Skills o plugins útiles de la CLI de Codex que deberían convertirse en parte de un agente de OpenClaw,
inventaríalos explícitamente:

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

El proveedor de migración de Codex copia Skills en el espacio de trabajo actual del agente de OpenClaw.
Los plugins nativos de Codex, hooks y archivos de configuración se informan o archivan
para revisión manual en lugar de activarse automáticamente, porque pueden
ejecutar comandos, exponer servidores MCP o contener credenciales.

La autenticación se selecciona en este orden:

1. Un perfil explícito de autenticación Codex de OpenClaw para el agente.
2. La cuenta existente del servidor de aplicación en el inicio de Codex de ese agente.
3. Solo para lanzamientos locales de servidor de aplicación stdio, `CODEX_API_KEY`, luego
   `OPENAI_API_KEY`, cuando no hay ninguna cuenta de servidor de aplicación presente y la autenticación de OpenAI
   sigue siendo necesaria.

Cuando OpenClaw detecta un perfil de autenticación Codex de estilo suscripción de ChatGPT, elimina
`CODEX_API_KEY` y `OPENAI_API_KEY` del proceso hijo de Codex generado. Eso
mantiene las claves de API de nivel Gateway disponibles para embeddings o modelos directos de OpenAI
sin hacer que los turnos nativos del servidor de aplicación Codex se facturen accidentalmente a través de la API.
Los perfiles explícitos de clave de API de Codex y la alternativa local de clave de entorno stdio usan el inicio de sesión del servidor de aplicación
en lugar del entorno heredado del proceso hijo. Las conexiones WebSocket del servidor de aplicación
no reciben la alternativa de clave de API de entorno de Gateway; usa un perfil de autenticación explícito o la
propia cuenta del servidor de aplicación remoto.

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

`appServer.clearEnv` solo afecta al proceso secundario app-server de Codex generado.

Las herramientas dinámicas de Codex usan de forma predeterminada el perfil `native-first`. En ese modo,
OpenClaw no expone herramientas dinámicas que duplican operaciones de espacio de trabajo nativas de Codex:
`read`, `write`, `edit`, `apply_patch`, `exec`, `process` y
`update_plan`. Las herramientas de integración de OpenClaw, como mensajería, sesiones, medios,
cron, navegador, nodos, Gateway, `heartbeat_respond` y `web_search`, siguen
disponibles.

Campos de plugin de Codex de nivel superior compatibles:

| Campo                      | Predeterminado  | Significado                                                                                   |
| -------------------------- | ---------------- | --------------------------------------------------------------------------------------------- |
| `codexDynamicToolsProfile` | `"native-first"` | Usa `"openclaw-compat"` para exponer el conjunto completo de herramientas dinámicas de OpenClaw al app-server de Codex. |
| `codexDynamicToolsExclude` | `[]`             | Nombres adicionales de herramientas dinámicas de OpenClaw que se omitirán en los turnos del app-server de Codex.               |

Campos `appServer` compatibles:

| Campo               | Predeterminado                          | Significado                                                                                                                                                                                                                              |
| ------------------- | ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`         | `"stdio"`                                | `"stdio"` inicia Codex; `"websocket"` se conecta a `url`.                                                                                                                                                                             |
| `command`           | binario de Codex gestionado              | Ejecutable para el transporte stdio. Déjalo sin definir para usar el binario gestionado; establécelo solo para una anulación explícita.                                                                                                                         |
| `args`              | `["app-server", "--listen", "stdio://"]` | Argumentos para el transporte stdio.                                                                                                                                                                                                       |
| `url`               | sin definir                              | URL del app-server WebSocket.                                                                                                                                                                                                            |
| `authToken`         | sin definir                              | Token Bearer para el transporte WebSocket.                                                                                                                                                                                                |
| `headers`           | `{}`                                     | Encabezados WebSocket adicionales.                                                                                                                                                                                                             |
| `clearEnv`          | `[]`                                     | Nombres de variables de entorno adicionales eliminados del proceso app-server stdio generado después de que OpenClaw construye su entorno heredado. `CODEX_HOME` y `HOME` están reservados para el aislamiento de Codex por agente de OpenClaw en lanzamientos locales. |
| `requestTimeoutMs`  | `60000`                                  | Tiempo de espera para llamadas al plano de control del app-server.                                                                                                                                                                                          |
| `mode`              | `"yolo"`                                 | Preajuste para ejecución YOLO o revisada por guardian.                                                                                                                                                                                      |
| `approvalPolicy`    | `"never"`                                | Política de aprobación nativa de Codex enviada al inicio, reanudación o turno de un hilo.                                                                                                                                                                       |
| `sandbox`           | `"danger-full-access"`                   | Modo sandbox nativo de Codex enviado al inicio o reanudación de un hilo.                                                                                                                                                                               |
| `approvalsReviewer` | `"user"`                                 | Usa `"auto_review"` para permitir que Codex revise los prompts de aprobación nativos. `guardian_subagent` sigue siendo un alias heredado.                                                                                                                         |
| `serviceTier`       | sin definir                              | Nivel de servicio opcional del app-server de Codex: `"fast"`, `"flex"` o `null`. Los valores heredados no válidos se ignoran.                                                                                                                            |

Las llamadas a herramientas dinámicas propiedad de OpenClaw se limitan de forma independiente de
`appServer.requestTimeoutMs`: cada solicitud `item/tool/call` de Codex debe recibir
una respuesta de OpenClaw en un plazo de 30 segundos. Al agotarse el tiempo, OpenClaw cancela la señal de la herramienta
donde sea compatible y devuelve a Codex una respuesta fallida de herramienta dinámica para que
el turno pueda continuar en lugar de dejar la sesión en `processing`.

Después de que OpenClaw responde a una solicitud del app-server de Codex con alcance de turno, el arnés
también espera que Codex finalice el turno nativo con `turn/completed`. Si el
app-server queda en silencio durante 60 segundos después de esa respuesta, OpenClaw intenta
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
prefiere la configuración para despliegues repetibles porque mantiene el comportamiento del plugin en el
mismo archivo revisado que el resto de la configuración del arnés de Codex.

## Computer use

Computer Use se aborda en su propia guía de configuración:
[Codex Computer Use](/es/plugins/codex-computer-use).

La versión corta: OpenClaw no incorpora como vendor la aplicación de control de escritorio ni ejecuta
acciones de escritorio por sí mismo. Prepara el app-server de Codex, verifica que el servidor MCP
`computer-use` esté disponible y luego permite que Codex gestione las llamadas a herramientas MCP
nativas durante los turnos en modo Codex.

Para acceso directo al controlador TryCua fuera del flujo del marketplace de Codex, registra
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

Uso de computadora es específico de macOS y puede requerir permisos locales del SO antes de que el servidor MCP de Codex pueda controlar apps. Si `computerUse.enabled` es true y el servidor MCP no está disponible, los turnos en modo Codex fallan antes de que se inicie el hilo, en lugar de ejecutarse silenciosamente sin las herramientas nativas de Uso de computadora. Consulta [Uso de computadora de Codex](/es/plugins/codex-computer-use) para ver las opciones del mercado, los límites del catálogo remoto, los motivos de estado y la solución de problemas.

Cuando `computerUse.autoInstall` es true, OpenClaw puede registrar el mercado estándar incluido de Codex Desktop desde `/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` si Codex aún no ha descubierto un mercado local. Usa `/new` o `/reset` después de cambiar la configuración de runtime o de Uso de computadora para que las sesiones existentes no conserven una vinculación antigua de PI o de hilo de Codex.

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

Validación de harness solo para Codex:

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

Servidor de apps remoto con encabezados explícitos:

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

El cambio de modelo sigue estando controlado por OpenClaw. Cuando una sesión de OpenClaw está adjunta a un hilo de Codex existente, el siguiente turno vuelve a enviar al servidor de apps el modelo de OpenAI, el proveedor, la política de aprobación, el sandbox y el nivel de servicio seleccionados actualmente. Cambiar de `openai/gpt-5.5` a `openai/gpt-5.2` conserva la vinculación del hilo, pero solicita a Codex que continúe con el modelo recién seleccionado.

## Comando de Codex

El Plugin incluido registra `/codex` como un comando de barra autorizado. Es genérico y funciona en cualquier canal que admita comandos de texto de OpenClaw.

Formas comunes:

- `/codex status` muestra la conectividad activa con el app-server, modelos, cuenta, límites de uso, servidores MCP y Skills.
- `/codex models` enumera los modelos activos del app-server de Codex.
- `/codex threads [filter]` enumera los hilos recientes de Codex.
- `/codex resume <thread-id>` adjunta la sesión actual de OpenClaw a un hilo existente de Codex.
- `/codex compact` pide al app-server de Codex que compacte el hilo adjunto.
- `/codex review` inicia la revisión nativa de Codex para el hilo adjunto.
- `/codex diagnostics [note]` pide confirmación antes de enviar comentarios de diagnóstico de Codex para el hilo adjunto.
- `/codex computer-use status` comprueba el Plugin configurado de Computer Use y el servidor MCP.
- `/codex computer-use install` instala el Plugin configurado de Computer Use y recarga los servidores MCP.
- `/codex account` muestra el estado de la cuenta y los límites de uso.
- `/codex mcp` enumera el estado del servidor MCP del app-server de Codex.
- `/codex skills` enumera las Skills del app-server de Codex.

Cuando Codex informa de un fallo por límite de uso, OpenClaw incluye la próxima
hora de restablecimiento del app-server cuando Codex proporcionó una. Usa `/codex account` en la misma
conversación para inspeccionar la cuenta actual y las ventanas de límite de uso.

### Flujo de depuración común

Cuando un agente respaldado por Codex hace algo inesperado en Telegram, Discord, Slack,
u otro canal, empieza por la conversación donde ocurrió el problema:

1. Ejecuta `/diagnostics bad tool choice after image upload` u otra nota breve
   que describa lo que viste.
2. Aprueba la solicitud de diagnóstico una vez. La aprobación crea el zip local
   de diagnóstico del Gateway y, como la sesión está usando el arnés de Codex, también
   envía el paquete de comentarios relevante de Codex a los servidores de OpenAI.
3. Copia la respuesta de diagnóstico completada en el informe de error o hilo de soporte.
   Incluye la ruta del paquete local, el resumen de privacidad, los ids de sesión de OpenClaw,
   los ids de hilo de Codex y una línea `Inspect locally` para cada hilo de Codex.
4. Si quieres depurar la ejecución por tu cuenta, ejecuta el comando `Inspect locally`
   impreso en una terminal. Se parece a `codex resume <thread-id>` y abre el
   hilo nativo de Codex para que puedas inspeccionar la conversación, continuarla localmente,
   o preguntar a Codex por qué eligió una herramienta o un plan concretos.

Usa `/codex diagnostics [note]` solo cuando quieras específicamente la subida de
comentarios de Codex para el hilo actualmente adjunto sin el paquete completo de
diagnóstico del Gateway de OpenClaw. Para la mayoría de informes de soporte, `/diagnostics [note]` es
el mejor punto de partida porque vincula el estado local del Gateway y los ids de
hilo de Codex en una sola respuesta. Consulta [Exportación de diagnóstico](/es/gateway/diagnostics)
para ver el modelo completo de privacidad y el comportamiento en chats grupales.

El núcleo de OpenClaw también expone `/diagnostics [note]`, solo para propietarios, como el comando general
de diagnóstico del Gateway. Su aviso de aprobación muestra el preámbulo de datos sensibles,
enlaza a [Exportación de diagnóstico](/es/gateway/diagnostics) y solicita
`openclaw gateway diagnostics export --json` mediante aprobación explícita de ejecución
cada vez. No apruebes diagnósticos con una regla de permitir todo. Después de la aprobación,
OpenClaw envía un informe que se puede pegar con la ruta del paquete local y el resumen
del manifiesto. Cuando la sesión activa de OpenClaw está usando el arnés de Codex, esa
misma aprobación también autoriza el envío de los paquetes relevantes de comentarios de Codex a
los servidores de OpenAI. El aviso de aprobación dice que se enviarán comentarios de Codex, pero
no enumera los ids de sesión o de hilo de Codex antes de la aprobación.

Si `/diagnostics` lo invoca un propietario en un chat grupal, OpenClaw mantiene limpio el
canal compartido: el grupo recibe solo un aviso breve, mientras que el
preámbulo de diagnóstico, los avisos de aprobación y los ids de sesión/hilo de Codex se envían al
propietario mediante la ruta privada de aprobación. Si no hay una ruta privada para el propietario,
OpenClaw rechaza la solicitud del grupo y pide al propietario que la ejecute desde un DM.

La subida aprobada de Codex llama a `feedback/upload` del app-server de Codex y pide
al app-server que incluya registros para cada hilo enumerado y subhilos de Codex generados
cuando estén disponibles. La subida usa la ruta normal de comentarios de Codex hacia los
servidores de OpenAI; si los comentarios de Codex están deshabilitados en ese app-server, el comando devuelve
el error del app-server. La respuesta de diagnóstico completada enumera los canales,
los ids de sesión de OpenClaw, los ids de hilo de Codex y los comandos locales `codex resume <thread-id>`
para los hilos que se enviaron. Si deniegas o ignoras la aprobación,
OpenClaw no imprime esos ids de Codex. Esta subida no reemplaza la exportación local de
diagnóstico del Gateway.

`/codex resume` escribe el mismo archivo de vinculación sidecar que el arnés usa para
turnos normales. En el siguiente mensaje, OpenClaw reanuda ese hilo de Codex, pasa el
modelo de OpenClaw actualmente seleccionado al app-server y mantiene habilitado el historial
extendido.

### Inspeccionar un hilo de Codex desde la CLI

La forma más rápida de entender una ejecución incorrecta de Codex suele ser abrir directamente el
hilo nativo de Codex:

```sh
codex resume <thread-id>
```

Usa esto cuando notes un error en una conversación de canal y quieras inspeccionar la
sesión problemática de Codex, continuarla localmente o preguntar a Codex por qué tomó una
decisión concreta de herramienta o razonamiento. La ruta más sencilla suele ser ejecutar
`/diagnostics [note]` primero: después de aprobarlo, el informe completado enumera
cada hilo de Codex e imprime un comando `Inspect locally`, por ejemplo
`codex resume <thread-id>`. Puedes copiar ese comando directamente en una terminal.

También puedes obtener un id de hilo desde `/codex binding` para el chat actual o
`/codex threads [filter]` para hilos recientes del app-server de Codex, y luego ejecutar el mismo
comando `codex resume` en tu shell.

La superficie de comandos requiere el app-server de Codex `0.125.0` o posterior. Los
métodos de control individuales se informan como `unsupported by this Codex app-server` si un
app-server futuro o personalizado no expone ese método JSON-RPC.

## Límites de hooks

El arnés de Codex tiene tres capas de hooks:

| Capa                                  | Propietario              | Propósito                                                           |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| Hooks de Plugin de OpenClaw           | OpenClaw                 | Compatibilidad de producto/Plugin entre arneses de PI y Codex.      |
| Middleware de extensión del app-server de Codex | Plugins incluidos de OpenClaw | Comportamiento del adaptador por turno alrededor de herramientas dinámicas de OpenClaw. |
| Hooks nativos de Codex                | Codex                    | Ciclo de vida de bajo nivel de Codex y política de herramientas nativas desde la configuración de Codex. |

OpenClaw no usa archivos `hooks.json` de proyecto o globales de Codex para enrutar
el comportamiento de Plugin de OpenClaw. Para el puente admitido de herramientas nativas y permisos,
OpenClaw inyecta configuración de Codex por hilo para `PreToolUse`, `PostToolUse`,
`PermissionRequest` y `Stop`. Otros hooks de Codex como `SessionStart` y
`UserPromptSubmit` siguen siendo controles de nivel Codex; no se exponen como
hooks de Plugin de OpenClaw en el contrato v1.

Para las herramientas dinámicas de OpenClaw, OpenClaw ejecuta la herramienta después de que Codex pide la
llamada, por lo que OpenClaw dispara el comportamiento de Plugin y middleware que posee en el
adaptador del arnés. Para herramientas nativas de Codex, Codex posee el registro canónico de herramienta.
OpenClaw puede reflejar eventos seleccionados, pero no puede reescribir el hilo nativo de Codex
a menos que Codex exponga esa operación mediante el app-server o callbacks de hooks
nativos.

Las proyecciones de Compaction y del ciclo de vida del LLM provienen de notificaciones del app-server de Codex
y del estado del adaptador de OpenClaw, no de comandos de hooks nativos de Codex.
Los eventos `before_compaction`, `after_compaction`, `llm_input` y
`llm_output` de OpenClaw son observaciones a nivel de adaptador, no capturas byte por byte
de la solicitud interna o de las cargas de Compaction de Codex.

Las notificaciones `hook/started` y `hook/completed` del app-server de hooks nativos de Codex se
proyectan como eventos de agente `codex_app_server.hook` para trayectoria y depuración.
No invocan hooks de Plugin de OpenClaw.

## Contrato de soporte v1

El modo Codex no es PI con una llamada a un modelo diferente por debajo. Codex posee más parte
del bucle nativo del modelo, y OpenClaw adapta sus superficies de Plugin y sesión
alrededor de ese límite.

Compatible en el runtime v1 de Codex:

| Superficie                                    | Soporte                                 | Motivo                                                                                                                                                                                               |
| --------------------------------------------- | --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Bucle de modelo de OpenAI mediante Codex      | Compatible                              | El app-server de Codex posee el turno de OpenAI, la reanudación nativa del hilo y la continuación de herramientas nativas.                                                                            |
| Enrutamiento y entrega de canales de OpenClaw | Compatible                              | Telegram, Discord, Slack, WhatsApp, iMessage y otros canales permanecen fuera del runtime del modelo.                                                                                                |
| Herramientas dinámicas de OpenClaw            | Compatible                              | Codex pide a OpenClaw que ejecute estas herramientas, por lo que OpenClaw permanece en la ruta de ejecución.                                                                                         |
| Plugins de prompt y contexto                  | Compatible                              | OpenClaw construye superposiciones de prompt y proyecta el contexto en el turno de Codex antes de iniciar o reanudar el hilo.                                                                        |
| Ciclo de vida del motor de contexto           | Compatible                              | El ensamblaje, la ingesta o el mantenimiento posterior al turno, y la coordinación de Compaction del motor de contexto se ejecutan para turnos de Codex.                                              |
| Hooks de herramientas dinámicas               | Compatible                              | `before_tool_call`, `after_tool_call` y el middleware de resultado de herramienta se ejecutan alrededor de herramientas dinámicas propiedad de OpenClaw.                                              |
| Hooks de ciclo de vida                        | Compatible como observaciones del adaptador | `llm_input`, `llm_output`, `agent_end`, `before_compaction` y `after_compaction` se disparan con cargas honestas del modo Codex.                                                                     |
| Puerta de revisión de respuesta final         | Compatible mediante el relé de hooks nativos | El `Stop` de Codex se retransmite a `before_agent_finalize`; `revise` pide a Codex una pasada más del modelo antes de finalizar.                                                                     |
| Bloqueo u observación de shell, patch y MCP nativos | Compatible mediante el relé de hooks nativos | `PreToolUse` y `PostToolUse` de Codex se retransmiten para superficies de herramientas nativas confirmadas, incluidas cargas MCP en el app-server de Codex `0.125.0` o posterior. Se admite el bloqueo; no la reescritura de argumentos. |
| Política de permisos nativa                   | Compatible mediante el relé de hooks nativos | `PermissionRequest` de Codex se puede enrutar mediante la política de OpenClaw donde el runtime lo expone. Si OpenClaw no devuelve ninguna decisión, Codex continúa por su ruta normal de guardián o aprobación del usuario. |
| Captura de trayectoria del app-server         | Compatible                              | OpenClaw registra la solicitud que envió al app-server y las notificaciones del app-server que recibe.                                                                                               |

No compatible en el runtime v1 de Codex:

| Surface                                             | Límite de V1                                                                                                                                      | Ruta futura                                                                                     |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------- |
| Mutación de argumentos de herramientas nativas      | Los hooks nativos previos a herramientas de Codex pueden bloquear, pero OpenClaw no reescribe los argumentos de herramientas nativas de Codex.    | Requiere soporte de hooks/esquema de Codex para reemplazar la entrada de la herramienta.         |
| Historial editable de transcripción nativa de Codex | Codex posee el historial canónico de hilos nativos. OpenClaw posee un reflejo y puede proyectar contexto futuro, pero no debe mutar internals no soportados. | Agregar APIs explícitas del app-server de Codex si se necesita cirugía de hilos nativos.         |
| `tool_result_persist` para registros de herramientas nativas de Codex | Ese hook transforma escrituras de transcripción propiedad de OpenClaw, no registros de herramientas nativas de Codex.                             | Podría reflejar registros transformados, pero la reescritura canónica necesita soporte de Codex. |
| Metadatos enriquecidos de Compaction nativa         | OpenClaw observa el inicio y la finalización de Compaction, pero no recibe una lista estable de conservados/descartados, delta de tokens ni payload de resumen. | Necesita eventos de Compaction de Codex más ricos.                                               |
| Intervención de Compaction                          | Los hooks actuales de Compaction de OpenClaw son de nivel notificación en modo Codex.                                                             | Agregar hooks de Codex previos/posteriores a Compaction si los plugins necesitan vetar o reescribir Compaction nativa. |
| Captura byte por byte de solicitudes a la API del modelo | OpenClaw puede capturar solicitudes y notificaciones del app-server, pero el núcleo de Codex construye internamente la solicitud final a la API de OpenAI. | Necesita un evento de rastreo de solicitudes de modelo de Codex o una API de depuración.         |

## Herramientas, medios y Compaction

El arnés de Codex cambia solo el ejecutor de agente integrado de bajo nivel.

OpenClaw sigue construyendo la lista de herramientas y recibe resultados dinámicos de herramientas desde el arnés. Texto, imágenes, video, música, TTS, aprobaciones y salida de herramientas de mensajería siguen pasando por la ruta normal de entrega de OpenClaw.

El relay de hooks nativos es intencionalmente genérico, pero el contrato de soporte v1 se limita a las rutas de herramientas y permisos nativas de Codex que OpenClaw prueba. En el runtime de Codex, eso incluye payloads de shell, patch y MCP `PreToolUse`, `PostToolUse` y `PermissionRequest`. No asuma que cada evento futuro de hook de Codex es una superficie de plugin de OpenClaw hasta que el contrato de runtime lo nombre.

Para `PermissionRequest`, OpenClaw solo devuelve decisiones explícitas de permitir o denegar cuando la política decide. Un resultado sin decisión no es una autorización. Codex lo trata como ausencia de decisión de hook y continúa hacia su propio guardián o ruta de aprobación del usuario.

Las solicitudes de aprobación de herramientas MCP de Codex se enrutan a través del flujo de aprobación de plugins de OpenClaw cuando Codex marca `_meta.codex_approval_kind` como `"mcp_tool_call"`. Los prompts `request_user_input` de Codex se envían de vuelta al chat de origen, y el siguiente mensaje de seguimiento en cola responde a esa solicitud del servidor nativo en lugar de dirigirse como contexto adicional. Otras solicitudes de elicitación MCP siguen fallando de forma cerrada.

El direccionamiento de cola de ejecución activa se asigna a `turn/steer` del app-server de Codex. Con el valor predeterminado `messages.queue.mode: "steer"`, OpenClaw agrupa los mensajes de chat en cola durante la ventana de silencio configurada y los envía como una solicitud `turn/steer` en orden de llegada. El modo heredado `queue` envía solicitudes `turn/steer` separadas. Los turnos de revisión y Compaction manual de Codex pueden rechazar el direccionamiento en el mismo turno, en cuyo caso OpenClaw usa la cola de seguimiento cuando el modo seleccionado permite fallback. Consulte [Cola de direccionamiento](/es/concepts/queue-steering).

Cuando el modelo seleccionado usa el arnés de Codex, la Compaction de hilos nativos se delega al app-server de Codex. OpenClaw mantiene un reflejo de la transcripción para el historial de canales, búsqueda, `/new`, `/reset` y futuros cambios de modelo o arnés. El reflejo incluye el prompt del usuario, el texto final del asistente y registros ligeros de razonamiento o plan de Codex cuando el app-server los emite. Hoy, OpenClaw solo registra señales de inicio y finalización de Compaction nativa. Todavía no expone un resumen de Compaction legible para humanos ni una lista auditable de qué entradas conservó Codex después de Compaction.

Como Codex posee el hilo nativo canónico, `tool_result_persist` no reescribe actualmente registros de resultados de herramientas nativas de Codex. Solo se aplica cuando OpenClaw escribe un resultado de herramienta de transcripción de sesión propiedad de OpenClaw.

La generación de medios no requiere PI. La comprensión y generación de imágenes, video, música, PDF, TTS y medios sigue usando la configuración correspondiente de proveedor/modelo, como `agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel` y `messages.tts`.

## Solución de problemas

**Codex no aparece como proveedor normal de `/model`:** eso es lo esperado para configuraciones nuevas. Seleccione un modelo `openai/gpt-*` con `agentRuntime.id: "codex"` (o una referencia heredada `codex/*`), habilite `plugins.entries.codex.enabled` y compruebe si `plugins.allow` excluye `codex`.

**OpenClaw usa PI en lugar de Codex:** `agentRuntime.id: "auto"` todavía puede usar PI como backend de compatibilidad cuando ningún arnés de Codex reclama la ejecución. Configure `agentRuntime.id: "codex"` para forzar la selección de Codex durante las pruebas. Un runtime de Codex forzado falla en lugar de recurrir a PI. Una vez seleccionado el app-server de Codex, sus fallos se exponen directamente.

**El app-server es rechazado:** actualice Codex para que el handshake del app-server informe la versión `0.125.0` o posterior. Las versiones preliminares de la misma versión o con sufijo de compilación, como `0.125.0-alpha.2` o `0.125.0+custom`, se rechazan porque el piso estable de protocolo `0.125.0` es lo que OpenClaw prueba.

**El descubrimiento de modelos es lento:** reduzca `plugins.entries.codex.config.discovery.timeoutMs` o desactive el descubrimiento.

**El transporte WebSocket falla de inmediato:** compruebe `appServer.url`, `authToken` y que el app-server remoto hable la misma versión del protocolo de app-server de Codex.

**Un modelo que no es Codex usa PI:** eso es lo esperado salvo que haya forzado `agentRuntime.id: "codex"` para ese agente o haya seleccionado una referencia heredada `codex/*`. Las referencias simples `openai/gpt-*` y de otros proveedores permanecen en su ruta normal de proveedor en modo `auto`. Si fuerza `agentRuntime.id: "codex"`, cada turno integrado para ese agente debe ser un modelo de OpenAI soportado por Codex.

**Computer Use está instalado pero las herramientas no se ejecutan:** compruebe `/codex computer-use status` desde una sesión nueva. Si una herramienta informa `Native hook relay unavailable`, use `/new` o `/reset`; si persiste, reinicie el Gateway para limpiar registros obsoletos de hooks nativos. Si `computer-use.list_apps` agota el tiempo de espera, reinicie Codex Computer Use o Codex Desktop y vuelva a intentarlo.

## Relacionado

- [Plugins de arnés de agente](/es/plugins/sdk-agent-harness)
- [Runtimes de agente](/es/concepts/agent-runtimes)
- [Proveedores de modelos](/es/concepts/model-providers)
- [Proveedor OpenAI](/es/providers/openai)
- [Estado](/es/cli/status)
- [Hooks de plugins](/es/plugins/hooks)
- [Referencia de configuración](/es/gateway/configuration-reference)
- [Pruebas](/es/help/testing-live#live-codex-app-server-harness-smoke)
