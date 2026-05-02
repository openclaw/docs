---
read_when:
    - Quieres usar el arnés de servidor de aplicaciones Codex incluido
    - Necesitas ejemplos de configuración del arnés de Codex
    - Quieres que los despliegues exclusivamente de Codex fallen en lugar de recurrir a PI
summary: Ejecutar turnos del agente embebido de OpenClaw mediante el arnés app-server de Codex incluido
title: Arnés de Codex
x-i18n:
    generated_at: "2026-05-02T05:31:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: 107f9fc0a3e8ad6a4790fc9eb68276c81d299236f11293014d2ab9bf6e235133
    source_path: plugins/codex-harness.md
    workflow: 16
---

El Plugin `codex` incluido permite que OpenClaw ejecute turnos de agente integrados a través del
servidor de aplicaciones de Codex en lugar del arnés PI integrado.

Úsalo cuando quieras que Codex controle la sesión de agente de bajo nivel: descubrimiento de
modelos, reanudación nativa de hilos, Compaction nativa y ejecución en el servidor de aplicaciones.
OpenClaw sigue controlando los canales de chat, archivos de sesión, selección de modelo, herramientas,
aprobaciones, entrega de medios y el espejo visible de la transcripción.

Cuando un turno de chat de origen se ejecuta a través del arnés de Codex, las respuestas visibles usan de forma predeterminada
la herramienta `message` de OpenClaw si la implementación no ha configurado explícitamente
`messages.visibleReplies`. El agente aún puede finalizar su turno de Codex de forma privada;
solo publica en el canal cuando llama a `message(action="send")`. Establece
`messages.visibleReplies: "automatic"` para mantener las respuestas finales de chat directo en la
ruta heredada de entrega automática.

Los turnos de Heartbeat de Codex también reciben la herramienta `heartbeat_respond` de forma predeterminada, para que el
agente pueda registrar si el despertar debe permanecer en silencio o notificar sin codificar
ese flujo de control en el texto final.

Si intentas orientarte, empieza con
[Entornos de ejecución de agentes](/es/concepts/agent-runtimes). La versión corta es:
`openai/gpt-5.5` es la referencia del modelo, `codex` es el entorno de ejecución, y Telegram,
Discord, Slack u otro canal sigue siendo la superficie de comunicación.

## Configuración rápida

La mayoría de los usuarios que quieren "Codex en OpenClaw" quieren esta ruta: iniciar sesión con una
suscripción de ChatGPT/Codex y luego ejecutar turnos de agente integrados a través del entorno de ejecución nativo
del servidor de aplicaciones de Codex. La referencia del modelo sigue siendo canónica como
`openai/gpt-*`; la autenticación de la suscripción proviene de la cuenta o perfil de Codex, no
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
        fallback: "none",
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

No uses `openai-codex/gpt-*` cuando quieras decir entorno de ejecución nativo de Codex. Ese prefijo
es la ruta explícita "Codex OAuth a través de PI". Los cambios de configuración se aplican a sesiones nuevas o
restablecidas; las sesiones existentes conservan su entorno de ejecución registrado.

## Qué cambia este Plugin

El Plugin `codex` incluido aporta varias capacidades separadas:

| Capacidad                         | Cómo se usa                                         | Qué hace                                                                       |
| --------------------------------- | --------------------------------------------------- | ------------------------------------------------------------------------------ |
| Entorno de ejecución integrado nativo | `agentRuntime.id: "codex"`                       | Ejecuta turnos de agente integrados de OpenClaw a través del servidor de aplicaciones de Codex. |
| Comandos nativos de control de chat | `/codex bind`, `/codex resume`, `/codex steer`, ... | Vincula y controla hilos del servidor de aplicaciones de Codex desde una conversación de mensajería. |
| Proveedor/catálogo del servidor de aplicaciones de Codex | elementos internos de `codex`, expuestos a través del arnés | Permite que el entorno de ejecución descubra y valide modelos del servidor de aplicaciones. |
| Ruta de comprensión de medios de Codex | rutas de compatibilidad de modelos de imagen `codex/*` | Ejecuta turnos acotados del servidor de aplicaciones de Codex para modelos de comprensión de imágenes compatibles. |
| Retransmisión de hooks nativa     | Hooks de Plugin alrededor de eventos nativos de Codex | Permite que OpenClaw observe o bloquee eventos compatibles de herramientas/finalización nativos de Codex. |

Habilitar el Plugin hace que esas capacidades estén disponibles. **No**:

- empieza a usar Codex para todos los modelos de OpenAI
- convierte referencias de modelo `openai-codex/*` en el entorno de ejecución nativo
- convierte ACP/acpx en la ruta predeterminada de Codex
- cambia en caliente sesiones existentes que ya registraron un entorno de ejecución PI
- reemplaza la entrega de canales de OpenClaw, archivos de sesión, almacenamiento de perfiles de autenticación o
  enrutamiento de mensajes

El mismo Plugin también controla la superficie nativa de comandos de control de chat `/codex`. Si
el Plugin está habilitado y el usuario pide vincular, reanudar, dirigir, detener o inspeccionar
hilos de Codex desde el chat, los agentes deben preferir `/codex ...` antes que ACP. ACP sigue siendo
la alternativa explícita cuando el usuario pide ACP/acpx o está probando el adaptador de Codex
de ACP.

Los turnos nativos de Codex mantienen los hooks de Plugin de OpenClaw como capa pública de compatibilidad.
Estos son hooks de OpenClaw en proceso, no hooks de comandos `hooks.json` de Codex:

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `before_tool_call`, `after_tool_call`
- `before_message_write` para registros de transcripción reflejados
- `before_agent_finalize` a través de la retransmisión `Stop` de Codex
- `agent_end`

Los plugins también pueden registrar middleware de resultados de herramientas neutral respecto al entorno de ejecución para reescribir
los resultados de herramientas dinámicas de OpenClaw después de que OpenClaw ejecute la herramienta y antes de que
el resultado se devuelva a Codex. Esto es independiente del hook público de Plugin
`tool_result_persist`, que transforma las escrituras de resultados de herramientas en la transcripción controladas por OpenClaw.

Para la semántica de los hooks de Plugin en sí, consulta [Hooks de Plugin](/es/plugins/hooks)
y [Comportamiento de guardia de Plugin](/es/tools/plugin).

El arnés está desactivado de forma predeterminada. Las configuraciones nuevas deben mantener las referencias de modelo de OpenAI
canónicas como `openai/gpt-*` y forzar explícitamente
`agentRuntime.id: "codex"` u `OPENCLAW_AGENT_RUNTIME=codex` cuando
quieran ejecución nativa en el servidor de aplicaciones. Las referencias de modelo heredadas `codex/*` aún seleccionan automáticamente
el arnés por compatibilidad, pero los prefijos de proveedor heredados respaldados por entorno de ejecución
no se muestran como opciones normales de modelo/proveedor.

Si el Plugin `codex` está habilitado pero el modelo principal sigue siendo
`openai-codex/*`, `openclaw doctor` advierte en lugar de cambiar la ruta. Eso es
intencional: `openai-codex/*` sigue siendo la ruta PI de Codex OAuth/suscripción, y
la ejecución nativa en el servidor de aplicaciones sigue siendo una elección explícita de entorno de ejecución.

## Mapa de rutas

Usa esta tabla antes de cambiar la configuración:

| Comportamiento deseado                                | Referencia de modelo       | Configuración de entorno de ejecución | Ruta de autenticación/perfil | Etiqueta de estado esperada     |
| ---------------------------------------------------- | -------------------------- | -------------------------------------- | ---------------------------- | ------------------------------- |
| Suscripción de ChatGPT/Codex con entorno de ejecución nativo de Codex | `openai/gpt-*`             | `agentRuntime.id: "codex"`             | Codex OAuth o cuenta de Codex | `Runtime: OpenAI Codex`         |
| API de OpenAI a través del ejecutor normal de OpenClaw | `openai/gpt-*`             | omitido o `runtime: "pi"`              | Clave API de OpenAI          | `Runtime: OpenClaw Pi Default` |
| Suscripción de ChatGPT/Codex a través de PI           | `openai-codex/gpt-*`       | omitido o `runtime: "pi"`              | Proveedor OpenAI Codex OAuth | `Runtime: OpenClaw Pi Default` |
| Proveedores mixtos con modo automático conservador    | referencias específicas del proveedor | `agentRuntime.id: "auto"`              | Por proveedor seleccionado   | Depende del entorno de ejecución seleccionado |
| Sesión explícita del adaptador Codex ACP              | depende de prompt/modelo ACP | `sessions_spawn` con `runtime: "acp"` | Autenticación de backend ACP | Estado de tarea/sesión ACP      |

La separación importante es proveedor frente a entorno de ejecución:

- `openai-codex/*` responde "¿qué ruta de proveedor/autenticación debe usar PI?"
- `agentRuntime.id: "codex"` responde "¿qué bucle debe ejecutar este
  turno integrado?"
- `/codex ...` responde "¿a qué conversación nativa de Codex debe vincularse
  o controlar este chat?"
- ACP responde "¿qué proceso de arnés externo debe lanzar acpx?"

## Elige el prefijo de modelo correcto

Las rutas de la familia OpenAI son específicas del prefijo. Para la configuración común de suscripción más
entorno de ejecución nativo de Codex, usa `openai/*` con `agentRuntime.id: "codex"`.
Usa `openai-codex/*` solo cuando quieras intencionalmente Codex OAuth a través de PI:

| Referencia de modelo                          | Ruta de entorno de ejecución                  | Úsalo cuando                                                               |
| --------------------------------------------- | --------------------------------------------- | ------------------------------------------------------------------------- |
| `openai/gpt-5.4`                              | Proveedor OpenAI a través de la fontanería OpenClaw/PI | Quieres acceso directo actual a la API de OpenAI Platform con `OPENAI_API_KEY`. |
| `openai-codex/gpt-5.5`                        | OpenAI Codex OAuth a través de OpenClaw/PI    | Quieres autenticación de suscripción ChatGPT/Codex con el ejecutor PI predeterminado. |
| `openai/gpt-5.5` + `agentRuntime.id: "codex"` | Arnés del servidor de aplicaciones de Codex   | Quieres autenticación de suscripción ChatGPT/Codex con ejecución nativa de Codex. |

GPT-5.5 puede aparecer tanto en rutas directas con clave API de OpenAI como en rutas de suscripción de Codex
cuando tu cuenta las expone. Usa `openai/gpt-5.5` con el arnés del servidor de aplicaciones de Codex
para el entorno de ejecución nativo de Codex, `openai-codex/gpt-5.5` para PI OAuth, o
`openai/gpt-5.5` sin anulación de entorno de ejecución de Codex para tráfico directo con clave API.

Las referencias heredadas `codex/gpt-*` siguen aceptándose como alias de compatibilidad. La migración
de compatibilidad de doctor reescribe las referencias heredadas de entorno de ejecución principal a referencias de modelo
canónicas y registra la política de entorno de ejecución por separado, mientras que las referencias heredadas solo de respaldo
se dejan sin cambios porque el entorno de ejecución se configura para todo el contenedor del agente.
Las configuraciones nuevas de PI Codex OAuth deben usar `openai-codex/gpt-*`; las configuraciones nuevas del arnés nativo
del servidor de aplicaciones deben usar `openai/gpt-*` más
`agentRuntime.id: "codex"`.

`agents.defaults.imageModel` sigue la misma separación de prefijos. Usa
`openai-codex/gpt-*` cuando la comprensión de imágenes deba ejecutarse a través de la ruta de proveedor OpenAI
Codex OAuth. Usa `codex/gpt-*` cuando la comprensión de imágenes deba ejecutarse
a través de un turno acotado del servidor de aplicaciones de Codex. El modelo del servidor de aplicaciones de Codex debe
anunciar compatibilidad con entrada de imagen; los modelos de Codex solo de texto fallan antes de que comience el turno
de medios.

Usa `/status` para confirmar el arnés efectivo de la sesión actual. Si la
selección sorprende, habilita el registro de depuración para el subsistema `agents/harness`
e inspecciona el registro estructurado `agent harness selected` del Gateway. Incluye
el id del arnés seleccionado, el motivo de selección, la política de entorno de ejecución/respaldo y,
en modo `auto`, el resultado de compatibilidad de cada candidato de Plugin.

### Qué significan las advertencias de doctor

`openclaw doctor` advierte cuando todo esto es cierto:

- el Plugin `codex` incluido está habilitado o permitido
- el modelo principal de un agente es `openai-codex/*`
- el entorno de ejecución efectivo de ese agente no es `codex`

Esa advertencia existe porque los usuarios suelen esperar que "Plugin de Codex habilitado" implique
"entorno de ejecución nativo del servidor de aplicaciones de Codex". OpenClaw no hace ese salto. La advertencia
significa:

- **No se requiere ningún cambio** si querías ChatGPT/Codex OAuth a través de PI.
- Cambia el modelo a `openai/<model>` y establece
  `agentRuntime.id: "codex"` si querías ejecución nativa en el servidor de aplicaciones.
- Las sesiones existentes siguen necesitando `/new` o `/reset` después de un cambio de entorno de ejecución,
  porque los pines de entorno de ejecución de sesión son persistentes.

La selección del arnés no es un control de sesión en vivo. Cuando se ejecuta un turno integrado,
OpenClaw registra el id del arnés seleccionado en esa sesión y sigue usándolo para
turnos posteriores en el mismo id de sesión. Cambia la configuración de `agentRuntime` o
`OPENCLAW_AGENT_RUNTIME` cuando quieras que sesiones futuras usen otro arnés;
usa `/new` o `/reset` para iniciar una sesión nueva antes de cambiar una conversación existente
entre PI y Codex. Esto evita reproducir una transcripción a través de
dos sistemas de sesión nativos incompatibles.

Las sesiones heredadas creadas antes de los pines de arnés se tratan como fijadas a PI una vez que
tienen historial de transcripción. Usa `/new` o `/reset` para incorporar esa conversación a
Codex después de cambiar la configuración.

`/status` muestra el runtime de modelo efectivo. El arnés PI predeterminado aparece como
`Runtime: OpenClaw Pi Default`, y el arnés app-server de Codex aparece como
`Runtime: OpenAI Codex`.

## Requisitos

- OpenClaw con el plugin `codex` incluido disponible.
- Codex app-server `0.125.0` o más reciente. El plugin incluido administra de forma predeterminada un binario
  Codex app-server compatible, por lo que los comandos locales `codex` en `PATH` no
  afectan el inicio normal del arnés.
- Autenticación de Codex disponible para el proceso app-server o para el puente de autenticación Codex
  de OpenClaw. Los lanzamientos locales de app-server usan un directorio de inicio Codex administrado por OpenClaw para cada
  agente y un `HOME` hijo aislado, por lo que de forma predeterminada no leen tu cuenta
  personal `~/.codex`, Skills, plugins, configuración, estado de hilos ni los Skills nativos
  de `$HOME/.agents/skills`.

El plugin bloquea handshakes de app-server antiguos o sin versión. Eso mantiene
a OpenClaw en la superficie de protocolo contra la que se ha probado.

Para pruebas smoke en vivo y con Docker, la autenticación suele provenir de la cuenta de Codex CLI
o de un perfil de autenticación `openai-codex` de OpenClaw. Los lanzamientos locales de app-server por stdio también pueden
recurrir a `CODEX_API_KEY` / `OPENAI_API_KEY` cuando no hay ninguna cuenta presente.

## Añadir Codex junto a otros modelos

No establezcas `agentRuntime.id: "codex"` globalmente si el mismo agente debe cambiar libremente
entre Codex y modelos de proveedores no Codex. Un runtime forzado se aplica a cada
turno incrustado para ese agente o sesión. Si seleccionas un modelo Anthropic mientras
ese runtime está forzado, OpenClaw seguirá intentando usar el arnés Codex y fallará de forma cerrada
en lugar de enrutar silenciosamente ese turno a través de PI.

Usa una de estas formas en su lugar:

- Coloca Codex en un agente dedicado con `agentRuntime.id: "codex"`.
- Mantén el agente predeterminado en `agentRuntime.id: "auto"` y el fallback PI para el uso normal mixto
  de proveedores.
- Usa refs heredadas `codex/*` solo por compatibilidad. Las configuraciones nuevas deberían preferir
  `openai/*` más una política explícita de runtime Codex.

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

- El agente `main` predeterminado usa la ruta normal del proveedor y el fallback de compatibilidad PI.
- El agente `codex` usa el arnés Codex app-server.
- Si Codex falta o no es compatible con el agente `codex`, el turno falla
  en lugar de usar PI silenciosamente.

## Enrutamiento de comandos de agente

Los agentes deberían enrutar las solicitudes de usuario por intención, no solo por la palabra "Codex":

| El usuario pide...                                      | El agente debería usar...                         |
| ------------------------------------------------------ | ------------------------------------------------ |
| "Vincula este chat a Codex"                            | `/codex bind`                                    |
| "Reanuda aquí el hilo Codex `<id>`"                    | `/codex resume <id>`                             |
| "Muestra los hilos de Codex"                           | `/codex threads`                                 |
| "Presenta un informe de soporte por una mala ejecución de Codex" | `/diagnostics [note]`                            |
| "Envía solo comentarios de Codex para este hilo adjunto" | `/codex diagnostics [note]`                      |
| "Usa mi suscripción de ChatGPT/Codex con runtime Codex" | `openai/*` más `agentRuntime.id: "codex"`        |
| "Usa mi suscripción de ChatGPT/Codex a través de PI"   | refs de modelo `openai-codex/*`                  |
| "Ejecuta Codex mediante ACP/acpx"                      | ACP `sessions_spawn({ runtime: "acp", ... })`    |
| "Inicia Claude Code/Gemini/OpenCode/Cursor en un hilo" | ACP/acpx, no `/codex` ni subagentes nativos      |

OpenClaw solo anuncia orientación de generación ACP a los agentes cuando ACP está habilitado,
es despachable y está respaldado por un backend de runtime cargado. Si ACP no está disponible,
el prompt del sistema y las Skills del plugin no deberían enseñar al agente sobre el
enrutamiento ACP.

## Despliegues solo con Codex

Fuerza el arnés Codex cuando necesites demostrar que cada turno de agente incrustado
usa Codex. Los runtimes explícitos de plugin no tienen fallback PI de forma predeterminada, por lo que
`fallback: "none"` es opcional, pero a menudo resulta útil como documentación:

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

Sobrescritura de entorno:

```bash
OPENCLAW_AGENT_RUNTIME=codex openclaw gateway run
```

Con Codex forzado, OpenClaw falla de forma temprana si el plugin Codex está deshabilitado, si el
app-server es demasiado antiguo o si el app-server no puede iniciarse. Establece
`OPENCLAW_AGENT_HARNESS_FALLBACK=pi` solo si quieres intencionalmente que PI gestione
la selección de arnés faltante.

## Codex por agente

Puedes hacer que un agente sea solo Codex mientras el agente predeterminado conserva la
selección automática normal:

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

Usa los comandos de sesión normales para cambiar de agentes y modelos. `/new` crea una sesión
OpenClaw nueva y el arnés Codex crea o reanuda su hilo app-server auxiliar
según sea necesario. `/reset` limpia la vinculación de sesión de OpenClaw para ese hilo
y permite que el siguiente turno resuelva de nuevo el arnés desde la configuración actual.

## Detección de modelos

De forma predeterminada, el plugin Codex solicita al app-server los modelos disponibles. Si la
detección falla o agota el tiempo, usa un catálogo fallback incluido para:

- GPT-5.5
- GPT-5.4 mini
- GPT-5.2

Puedes ajustar la detección en `plugins.entries.codex.config.discovery`:

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

Deshabilita la detección cuando quieras que el inicio evite sondear Codex y se limite al
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
versión de app-server vinculada al plugin incluido en lugar de a cualquier Codex CLI independiente
que pueda estar instalado localmente. Establece `appServer.command` solo cuando
quieras intencionalmente ejecutar un ejecutable diferente.

De forma predeterminada, OpenClaw inicia sesiones locales del arnés Codex en modo YOLO:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` y
`sandbox: "danger-full-access"`. Esta es la postura de operador local de confianza usada
para Heartbeats autónomos: Codex puede usar herramientas de shell y red sin
detenerse en prompts de aprobación nativos que no hay nadie disponible para responder.

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

El modo guardián usa la ruta de aprobación de autorevisión nativa de Codex. Cuando Codex pide
salir del sandbox, escribir fuera del workspace o añadir permisos como acceso de red,
Codex enruta esa solicitud de aprobación al revisor nativo en lugar de a un
prompt humano. El revisor aplica el marco de riesgo de Codex y aprueba o deniega
la solicitud específica. Usa Guardián cuando quieras más barreras que el modo YOLO
pero aún necesites que los agentes desatendidos progresen.

El preset `guardian` se expande a `approvalPolicy: "on-request"`,
`approvalsReviewer: "auto_review"` y `sandbox: "workspace-write"`.
Los campos de política individuales siguen sobrescribiendo `mode`, por lo que los despliegues avanzados pueden mezclar
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

Los lanzamientos de app-server por stdio heredan de forma predeterminada el entorno de proceso de OpenClaw,
pero OpenClaw posee el puente de cuenta de Codex app-server y establece tanto
`CODEX_HOME` como `HOME` en directorios por agente dentro del estado de OpenClaw
de ese agente. El cargador de Skills propio de Codex lee `$CODEX_HOME/skills` y
`$HOME/.agents/skills`, por lo que ambos valores quedan aislados para los lanzamientos locales de app-server.
Eso mantiene los Skills, plugins, configuración, cuentas y estado de hilos nativos de Codex
acotados al agente OpenClaw en lugar de filtrarse desde el directorio personal de Codex CLI
del operador.

Los plugins de OpenClaw y las instantáneas de Skills de OpenClaw siguen fluyendo por el propio
registro de plugins y cargador de Skills de OpenClaw. Los recursos personales de Codex CLI no. Si tienes
Skills o plugins útiles de Codex CLI que deberían convertirse en parte de un agente OpenClaw,
haz un inventario explícito de ellos:

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

El proveedor de migración de Codex copia Skills en el workspace del agente OpenClaw actual.
Los plugins, hooks y archivos de configuración nativos de Codex se informan o archivan
para revisión manual en lugar de activarse automáticamente, porque pueden
ejecutar comandos, exponer servidores MCP o portar credenciales.

La autenticación se selecciona en este orden:

1. Un perfil de autenticación Codex explícito de OpenClaw para el agente.
2. La cuenta existente del app-server en el directorio de inicio Codex de ese agente.
3. Solo para lanzamientos locales de app-server por stdio, `CODEX_API_KEY`, luego
   `OPENAI_API_KEY`, cuando no hay ninguna cuenta de app-server presente y la autenticación de OpenAI
   sigue siendo necesaria.

Cuando OpenClaw ve un perfil de autenticación Codex de tipo suscripción ChatGPT, elimina
`CODEX_API_KEY` y `OPENAI_API_KEY` del proceso hijo Codex generado. Eso
mantiene disponibles las claves de API de nivel Gateway para embeddings o modelos directos de OpenAI
sin hacer que los turnos nativos de Codex app-server se facturen por la API por accidente.
Los perfiles explícitos de clave de API de Codex y el fallback local de clave de entorno por stdio usan inicio de sesión
en app-server en lugar de entorno heredado del proceso hijo. Las conexiones WebSocket de app-server
no reciben fallback de clave de API del entorno de Gateway; usa un perfil de autenticación explícito o la
cuenta propia del app-server remoto.

Si un despliegue necesita aislamiento adicional de entorno, añade esas variables a
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

`appServer.clearEnv` solo afecta al proceso hijo Codex app-server generado.

Las herramientas dinámicas de Codex usan de forma predeterminada el perfil `native-first`. En ese modo,
OpenClaw no expone herramientas dinámicas que dupliquen operaciones de workspace nativas de Codex:
`read`, `write`, `edit`, `apply_patch`, `exec`, `process` y
`update_plan`. Las herramientas de integración de OpenClaw, como mensajería, sesiones, medios,
cron, navegador, nodos, gateway, `heartbeat_respond` y `web_search`, siguen
disponibles.

Campos de Plugin Codex de nivel superior admitidos:

| Campo                      | Predeterminado  | Significado                                                                                         |
| -------------------------- | ---------------- | --------------------------------------------------------------------------------------------------- |
| `codexDynamicToolsProfile` | `"native-first"` | Usa `"openclaw-compat"` para exponer el conjunto completo de herramientas dinámicas de OpenClaw a Codex app-server. |
| `codexDynamicToolsExclude` | `[]`             | Nombres adicionales de herramientas dinámicas de OpenClaw que se deben omitir en los turnos de Codex app-server. |

Campos `appServer` admitidos:

| Campo               | Predeterminado                          | Significado                                                                                                                                                                                                                              |
| ------------------- | ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`         | `"stdio"`                                | `"stdio"` inicia Codex; `"websocket"` se conecta a `url`.                                                                                                                                                                                |
| `command`           | binario de Codex gestionado              | Ejecutable para el transporte stdio. Déjalo sin establecer para usar el binario gestionado; establécelo solo para una sobrescritura explícita.                                                                                           |
| `args`              | `["app-server", "--listen", "stdio://"]` | Argumentos para el transporte stdio.                                                                                                                                                                                                     |
| `url`               | sin establecer                           | URL WebSocket de app-server.                                                                                                                                                                                                             |
| `authToken`         | sin establecer                           | Token Bearer para el transporte WebSocket.                                                                                                                                                                                               |
| `headers`           | `{}`                                     | Encabezados WebSocket adicionales.                                                                                                                                                                                                       |
| `clearEnv`          | `[]`                                     | Nombres adicionales de variables de entorno que se eliminan del proceso app-server stdio iniciado después de que OpenClaw construye su entorno heredado. `CODEX_HOME` y `HOME` están reservados para el aislamiento de Codex por agente de OpenClaw en lanzamientos locales. |
| `requestTimeoutMs`  | `60000`                                  | Tiempo de espera para llamadas al plano de control de app-server.                                                                                                                                                                        |
| `mode`              | `"yolo"`                                 | Preajuste para ejecución YOLO o revisada por guardian.                                                                                                                                                                                   |
| `approvalPolicy`    | `"never"`                                | Política de aprobación nativa de Codex enviada al iniciar/reanudar/hacer un turno de hilo.                                                                                                                                               |
| `sandbox`           | `"danger-full-access"`                   | Modo sandbox nativo de Codex enviado al iniciar/reanudar un hilo.                                                                                                                                                                        |
| `approvalsReviewer` | `"user"`                                 | Usa `"auto_review"` para permitir que Codex revise las solicitudes nativas de aprobación. `guardian_subagent` sigue siendo un alias heredado.                                                                                            |
| `serviceTier`       | sin establecer                           | Nivel de servicio opcional de Codex app-server: `"fast"`, `"flex"` o `null`. Los valores heredados no válidos se ignoran.                                                                                                                |

Las llamadas a herramientas dinámicas propiedad de OpenClaw se acotan de forma
independiente de `appServer.requestTimeoutMs`: cada solicitud `item/tool/call` de
Codex debe recibir una respuesta de OpenClaw en un plazo de 30 segundos. Al agotarse
el tiempo, OpenClaw cancela la señal de la herramienta cuando es compatible y devuelve
una respuesta de herramienta dinámica fallida a Codex para que el turno pueda
continuar en lugar de dejar la sesión en `processing`.

Después de que OpenClaw responde a una solicitud app-server de Codex con alcance de
turno, el harness también espera que Codex termine el turno nativo con
`turn/completed`. Si app-server queda en silencio durante 60 segundos después de esa
respuesta, OpenClaw intenta interrumpir el turno de Codex, registra un tiempo de
espera de diagnóstico y libera el carril de sesión de OpenClaw para que los mensajes
de chat posteriores no queden en cola detrás de un turno nativo obsoleto.

Las sobrescrituras de entorno siguen disponibles para pruebas locales:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN` omite el binario gestionado cuando
`appServer.command` no está establecido.

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` se eliminó. Usa
`plugins.entries.codex.config.appServer.mode: "guardian"` en su lugar, o
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` para una prueba local puntual. Se
prefiere la configuración para despliegues repetibles porque mantiene el
comportamiento del plugin en el mismo archivo revisado que el resto de la
configuración del harness de Codex.

## Uso de computadora

El uso de computadora se cubre en su propia guía de configuración:
[Uso de computadora de Codex](/es/plugins/codex-computer-use).

La versión breve: OpenClaw no incorpora la aplicación de control de escritorio ni
ejecuta acciones de escritorio por sí mismo. Prepara Codex app-server, verifica que
el servidor MCP `computer-use` esté disponible y luego permite que Codex gestione
las llamadas nativas a herramientas MCP durante los turnos en modo Codex.

Para acceder directamente al controlador TryCua fuera del flujo del marketplace de
Codex, registra `cua-driver mcp` con `openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'`.
Consulta [Uso de computadora de Codex](/es/plugins/codex-computer-use) para ver la distinción
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

El uso de computadora es específico de macOS y puede requerir permisos locales del
sistema operativo antes de que el servidor MCP de Codex pueda controlar aplicaciones.
Si `computerUse.enabled` es true y el servidor MCP no está disponible, los turnos en
modo Codex fallan antes de que el hilo se inicie en lugar de ejecutarse en silencio
sin las herramientas nativas de uso de computadora. Consulta
[Uso de computadora de Codex](/es/plugins/codex-computer-use) para ver opciones de
marketplace, límites del catálogo remoto, razones de estado y solución de problemas.

Cuando `computerUse.autoInstall` es true, OpenClaw puede registrar el marketplace
estándar incluido de Codex Desktop desde
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` si Codex
aún no ha descubierto un marketplace local. Usa `/new` o `/reset` después de
cambiar la configuración del runtime o del uso de computadora para que las sesiones
existentes no mantengan una vinculación antigua de PI o hilo de Codex.

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

Validación del harness solo con Codex:

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

El cambio de modelo sigue controlado por OpenClaw. Cuando una sesión de OpenClaw
está adjunta a un hilo de Codex existente, el siguiente turno vuelve a enviar a
app-server el modelo de OpenAI, proveedor, política de aprobación, sandbox y nivel
de servicio seleccionados actualmente. Cambiar de `openai/gpt-5.5` a
`openai/gpt-5.2` conserva la vinculación del hilo, pero le pide a Codex que continúe
con el modelo recién seleccionado.

## Comando Codex

El plugin incluido registra `/codex` como un comando de barra autorizado. Es
genérico y funciona en cualquier canal que admita comandos de texto de OpenClaw.

Formas comunes:

- `/codex status` muestra conectividad activa de app-server, modelos, cuenta, límites de frecuencia, servidores MCP y skills.
- `/codex models` enumera los modelos activos de Codex app-server.
- `/codex threads [filter]` enumera hilos recientes de Codex.
- `/codex resume <thread-id>` adjunta la sesión actual de OpenClaw a un hilo de Codex existente.
- `/codex compact` le pide a Codex app-server que compacte el hilo adjunto.
- `/codex review` inicia la revisión nativa de Codex para el hilo adjunto.
- `/codex diagnostics [note]` pregunta antes de enviar comentarios de diagnóstico de Codex para el hilo adjunto.
- `/codex computer-use status` comprueba el plugin de uso de computadora configurado y el servidor MCP.
- `/codex computer-use install` instala el plugin de uso de computadora configurado y recarga los servidores MCP.
- `/codex account` muestra el estado de cuenta y límites de frecuencia.
- `/codex mcp` enumera el estado de los servidores MCP de Codex app-server.
- `/codex skills` enumera las skills de Codex app-server.

### Flujo de depuración común

Cuando un agente respaldado por Codex hace algo inesperado en Telegram, Discord, Slack
u otro canal, empieza por la conversación donde ocurrió el problema:

1. Ejecuta `/diagnostics bad tool choice after image upload` u otra nota breve
   que describa lo que viste.
2. Aprueba la solicitud de diagnóstico una vez. La aprobación crea el zip de
   diagnóstico local del Gateway y, como la sesión usa el arnés de Codex, también
   envía el paquete de comentarios de Codex relevante a los servidores de OpenAI.
3. Copia la respuesta de diagnóstico completada en el informe de error o hilo de
   soporte. Incluye la ruta del paquete local, el resumen de privacidad, los id.
   de sesión de OpenClaw, los id. de hilo de Codex y una línea `Inspect locally`
   para cada hilo de Codex.
4. Si quieres depurar la ejecución por tu cuenta, ejecuta el comando impreso
   `Inspect locally` en una terminal. Se parece a `codex resume <thread-id>` y
   abre el hilo nativo de Codex para que puedas inspeccionar la conversación,
   continuarla localmente o preguntar a Codex por qué eligió una herramienta o
   plan en particular.

Usa `/codex diagnostics [note]` solo cuando quieras específicamente la carga de
comentarios de Codex para el hilo adjunto actualmente, sin el paquete completo de
diagnóstico del Gateway de OpenClaw. Para la mayoría de los informes de soporte,
`/diagnostics [note]` es el mejor punto de partida porque vincula el estado local
del Gateway y los id. de hilo de Codex en una sola respuesta. Consulta
[Exportación de diagnóstico](/es/gateway/diagnostics) para ver el modelo de
privacidad completo y el comportamiento en chats grupales.

El núcleo de OpenClaw también expone `/diagnostics [note]`, solo para
propietarios, como el comando general de diagnóstico del Gateway. Su solicitud de
aprobación muestra el preámbulo sobre datos sensibles, enlaza a
[Exportación de diagnóstico](/es/gateway/diagnostics) y solicita
`openclaw gateway diagnostics export --json` mediante aprobación explícita de
ejecución cada vez. No apruebes diagnósticos con una regla de permitir todo.
Después de la aprobación, OpenClaw envía un informe que se puede pegar con la
ruta del paquete local y el resumen del manifiesto. Cuando la sesión activa de
OpenClaw usa el arnés de Codex, esa misma aprobación también autoriza el envío
de los paquetes de comentarios de Codex relevantes a los servidores de OpenAI.
La solicitud de aprobación indica que se enviarán comentarios de Codex, pero no
enumera los id. de sesión o de hilo de Codex antes de la aprobación.

Si un propietario invoca `/diagnostics` en un chat grupal, OpenClaw mantiene
limpio el canal compartido: el grupo recibe solo un aviso breve, mientras que el
preámbulo de diagnóstico, las solicitudes de aprobación y los id. de
sesión/hilo de Codex se envían al propietario por la ruta privada de aprobación.
Si no hay una ruta privada para el propietario, OpenClaw rechaza la solicitud del
grupo y pide al propietario que la ejecute desde un DM.

La carga aprobada de Codex llama a `feedback/upload` del app-server de Codex y
pide al app-server que incluya registros para cada hilo listado y subhilos de
Codex generados cuando estén disponibles. La carga pasa por la ruta normal de
comentarios de Codex hacia los servidores de OpenAI; si los comentarios de Codex
están deshabilitados en ese app-server, el comando devuelve el error del
app-server. La respuesta de diagnóstico completada enumera los canales, los id.
de sesión de OpenClaw, los id. de hilo de Codex y los comandos locales
`codex resume <thread-id>` para los hilos enviados. Si deniegas o ignoras la
aprobación, OpenClaw no imprime esos id. de Codex. Esta carga no reemplaza la
exportación local de diagnóstico del Gateway.

`/codex resume` escribe el mismo archivo de enlace sidecar que el arnés usa para
los turnos normales. En el siguiente mensaje, OpenClaw reanuda ese hilo de
Codex, pasa el modelo de OpenClaw seleccionado actualmente al app-server y
mantiene habilitado el historial extendido.

### Inspeccionar un hilo de Codex desde la CLI

La forma más rápida de entender una mala ejecución de Codex suele ser abrir
directamente el hilo nativo de Codex:

```sh
codex resume <thread-id>
```

Usa esto cuando notes un error en una conversación de canal y quieras
inspeccionar la sesión problemática de Codex, continuarla localmente o preguntar
a Codex por qué tomó una decisión concreta de herramienta o razonamiento. La ruta
más sencilla suele ser ejecutar primero `/diagnostics [note]`: después de
aprobarlo, el informe completado enumera cada hilo de Codex e imprime un comando
`Inspect locally`, por ejemplo `codex resume <thread-id>`. Puedes copiar ese
comando directamente en una terminal.

También puedes obtener un id. de hilo desde `/codex binding` para el chat actual
o `/codex threads [filter]` para hilos recientes del app-server de Codex, y luego
ejecutar el mismo comando `codex resume` en tu shell.

La superficie de comandos requiere el app-server de Codex `0.125.0` o más
reciente. Los métodos de control individuales se informan como
`unsupported by this Codex app-server` si un app-server futuro o personalizado no
expone ese método JSON-RPC.

## Límites de hooks

El arnés de Codex tiene tres capas de hooks:

| Capa                                  | Propietario              | Propósito                                                           |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| Hooks de plugin de OpenClaw           | OpenClaw                 | Compatibilidad de producto/plugin entre arneses de PI y Codex.      |
| Middleware de extensión del app-server de Codex | Plugins incluidos de OpenClaw | Comportamiento de adaptador por turno alrededor de herramientas dinámicas de OpenClaw. |
| Hooks nativos de Codex                | Codex                    | Ciclo de vida de bajo nivel de Codex y política de herramientas nativas desde la configuración de Codex. |

OpenClaw no usa archivos `hooks.json` de Codex de proyecto o globales para
enrutar el comportamiento de plugins de OpenClaw. Para el puente compatible de
herramientas nativas y permisos, OpenClaw inyecta configuración de Codex por hilo
para `PreToolUse`, `PostToolUse`, `PermissionRequest` y `Stop`. Otros hooks de
Codex, como `SessionStart` y `UserPromptSubmit`, siguen siendo controles de nivel
Codex; no se exponen como hooks de plugins de OpenClaw en el contrato v1.

Para las herramientas dinámicas de OpenClaw, OpenClaw ejecuta la herramienta
después de que Codex solicita la llamada, por lo que OpenClaw dispara el
comportamiento de plugin y middleware que posee en el adaptador del arnés. Para
las herramientas nativas de Codex, Codex posee el registro canónico de la
herramienta. OpenClaw puede reflejar eventos seleccionados, pero no puede
reescribir el hilo nativo de Codex salvo que Codex exponga esa operación mediante
el app-server o callbacks de hooks nativos.

Las proyecciones de Compaction y del ciclo de vida del LLM provienen de
notificaciones del app-server de Codex y del estado del adaptador de OpenClaw, no
de comandos de hooks nativos de Codex. Los eventos `before_compaction`,
`after_compaction`, `llm_input` y `llm_output` de OpenClaw son observaciones de
nivel de adaptador, no capturas byte por byte de la solicitud interna de Codex ni
de las cargas de Compaction.

Las notificaciones `hook/started` y `hook/completed` nativas de Codex del
app-server se proyectan como eventos de agente `codex_app_server.hook` para
trayectoria y depuración. No invocan hooks de plugins de OpenClaw.

## Contrato de soporte v1

El modo Codex no es PI con una llamada de modelo diferente por debajo. Codex
posee una parte mayor del bucle de modelo nativo, y OpenClaw adapta sus
superficies de plugin y sesión alrededor de ese límite.

Compatible en el runtime Codex v1:

| Superficie                                    | Compatibilidad                         | Motivo                                                                                                                                                                                               |
| --------------------------------------------- | -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Bucle de modelo de OpenAI a través de Codex    | Compatible                             | El app-server de Codex posee el turno de OpenAI, la reanudación del hilo nativo y la continuación de herramientas nativas.                                                                           |
| Enrutamiento y entrega de canales de OpenClaw | Compatible                             | Telegram, Discord, Slack, WhatsApp, iMessage y otros canales permanecen fuera del runtime del modelo.                                                                                                |
| Herramientas dinámicas de OpenClaw            | Compatible                             | Codex pide a OpenClaw que ejecute estas herramientas, por lo que OpenClaw permanece en la ruta de ejecución.                                                                                         |
| Plugins de prompt y contexto                  | Compatible                             | OpenClaw construye superposiciones de prompt y proyecta contexto en el turno de Codex antes de iniciar o reanudar el hilo.                                                                           |
| Ciclo de vida del motor de contexto           | Compatible                             | El ensamblaje, la ingesta o el mantenimiento posterior al turno, y la coordinación de Compaction del motor de contexto se ejecutan para turnos de Codex.                                              |
| Hooks de herramientas dinámicas               | Compatible                             | `before_tool_call`, `after_tool_call` y el middleware de resultados de herramientas se ejecutan alrededor de herramientas dinámicas propiedad de OpenClaw.                                            |
| Hooks de ciclo de vida                        | Compatible como observaciones del adaptador | `llm_input`, `llm_output`, `agent_end`, `before_compaction` y `after_compaction` se disparan con cargas honestas del modo Codex.                                                                     |
| Puerta de revisión de respuesta final         | Compatible mediante el relay de hook nativo | `Stop` de Codex se retransmite a `before_agent_finalize`; `revise` pide a Codex una pasada de modelo más antes de la finalización.                                                                   |
| Bloqueo u observación de shell, patch y MCP nativos | Compatible mediante el relay de hook nativo | `PreToolUse` y `PostToolUse` de Codex se retransmiten para superficies de herramientas nativas confirmadas, incluidas cargas MCP en app-server de Codex `0.125.0` o más reciente. El bloqueo es compatible; la reescritura de argumentos no. |
| Política de permisos nativa                   | Compatible mediante el relay de hook nativo | `PermissionRequest` de Codex puede enrutarse a través de la política de OpenClaw donde el runtime lo exponga. Si OpenClaw no devuelve ninguna decisión, Codex continúa por su ruta normal de guardián o aprobación del usuario. |
| Captura de trayectoria del app-server         | Compatible                             | OpenClaw registra la solicitud que envió al app-server y las notificaciones del app-server que recibe.                                                                                               |

No compatible en el runtime Codex v1:

| Superficie                                         | Límite V1                                                                                                                                          | Ruta futura                                                                                       |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Mutación de argumentos de herramientas nativas      | Los hooks previos a herramientas nativas de Codex pueden bloquear, pero OpenClaw no reescribe argumentos de herramientas nativas de Codex.       | Requiere compatibilidad de hooks/esquemas de Codex para reemplazar la entrada de la herramienta.  |
| Historial editable de transcripción nativa de Codex | Codex posee el historial canónico del hilo nativo. OpenClaw posee un espejo y puede proyectar contexto futuro, pero no debe mutar elementos internos no compatibles. | Agregar APIs explícitas del servidor de app de Codex si se necesita cirugía del hilo nativo.      |
| `tool_result_persist` para registros de herramientas nativas de Codex | Ese hook transforma escrituras de transcripción propiedad de OpenClaw, no registros de herramientas nativas de Codex.                            | Podría reflejar registros transformados, pero la reescritura canónica necesita compatibilidad de Codex. |
| Metadatos enriquecidos de Compaction nativa         | OpenClaw observa el inicio y la finalización de la Compaction, pero no recibe una lista estable de conservados/descartados, delta de tokens ni carga de resumen. | Necesita eventos de Compaction de Codex más enriquecidos.                                         |
| Intervención de Compaction                          | Los hooks actuales de Compaction de OpenClaw son de nivel de notificación en modo Codex.                                                         | Agregar hooks previos/posteriores de Compaction de Codex si los plugins necesitan vetar o reescribir la Compaction nativa. |
| Captura byte por byte de solicitudes de API del modelo | OpenClaw puede capturar solicitudes y notificaciones del servidor de app, pero el núcleo de Codex construye internamente la solicitud final a la API de OpenAI. | Necesita un evento de trazado de solicitudes de modelo de Codex o una API de depuración.          |

## Herramientas, medios y Compaction

El harness de Codex cambia solo el ejecutor de agente incrustado de bajo nivel.

OpenClaw sigue construyendo la lista de herramientas y recibe resultados dinámicos de herramientas desde el harness. Texto, imágenes, video, música, TTS, aprobaciones y salida de herramientas de mensajería continúan por la ruta normal de entrega de OpenClaw.

El relay de hooks nativos es intencionalmente genérico, pero el contrato de compatibilidad v1 se limita a las rutas de herramientas nativas y permisos de Codex que OpenClaw prueba. En el runtime de Codex, eso incluye cargas de shell, patch y MCP `PreToolUse`, `PostToolUse` y `PermissionRequest`. No asumas que cada futuro evento de hook de Codex es una superficie de plugin de OpenClaw hasta que el contrato de runtime lo nombre.

Para `PermissionRequest`, OpenClaw solo devuelve decisiones explícitas de permitir o denegar cuando la política decide. Un resultado sin decisión no es una autorización. Codex lo trata como ausencia de decisión de hook y continúa hacia su propio guardián o ruta de aprobación del usuario.

Las solicitudes de aprobación de herramientas MCP de Codex se enrutan a través del flujo de aprobación de plugins de OpenClaw cuando Codex marca `_meta.codex_approval_kind` como `"mcp_tool_call"`. Las solicitudes `request_user_input` de Codex se envían de vuelta al chat de origen, y el siguiente mensaje de seguimiento en cola responde a esa solicitud del servidor nativo en lugar de dirigirse como contexto adicional. Otras solicitudes de elicitación MCP siguen fallando de forma cerrada.

La dirección de la cola de ejecuciones activas se asigna a `turn/steer` del servidor de app de Codex. Con el valor predeterminado `messages.queue.mode: "steer"`, OpenClaw agrupa los mensajes de chat en cola durante la ventana de silencio configurada y los envía como una sola solicitud `turn/steer` en orden de llegada. El modo heredado `queue` envía solicitudes `turn/steer` separadas. Los turnos de revisión de Codex y Compaction manual pueden rechazar la dirección en el mismo turno, en cuyo caso OpenClaw usa la cola de seguimiento cuando el modo seleccionado permite fallback. Consulta [Cola de dirección](/es/concepts/queue-steering).

Cuando el modelo seleccionado usa el harness de Codex, la Compaction del hilo nativo se delega al servidor de app de Codex. OpenClaw mantiene un espejo de transcripción para el historial del canal, búsqueda, `/new`, `/reset` y futuros cambios de modelo o harness. El espejo incluye el prompt del usuario, el texto final del asistente y registros ligeros de razonamiento o plan de Codex cuando el servidor de app los emite. Hoy, OpenClaw solo registra señales de inicio y finalización de Compaction nativa. Aún no expone un resumen de Compaction legible por humanos ni una lista auditable de qué entradas conservó Codex después de la Compaction.

Como Codex posee el hilo nativo canónico, `tool_result_persist` actualmente no reescribe registros de resultados de herramientas nativas de Codex. Solo se aplica cuando OpenClaw escribe un resultado de herramienta en una transcripción de sesión propiedad de OpenClaw.

La generación de medios no requiere PI. La comprensión de imágenes, video, música, PDF, TTS y medios sigue usando la configuración del proveedor/modelo correspondiente, como `agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel` y `messages.tts`.

## Solución de problemas

**Codex no aparece como proveedor normal de `/model`:** eso es esperado para configuraciones nuevas. Selecciona un modelo `openai/gpt-*` con `agentRuntime.id: "codex"` (o una referencia heredada `codex/*`), habilita `plugins.entries.codex.enabled` y comprueba si `plugins.allow` excluye `codex`.

**OpenClaw usa PI en lugar de Codex:** `agentRuntime.id: "auto"` todavía puede usar PI como backend de compatibilidad cuando ningún harness de Codex reclama la ejecución. Establece `agentRuntime.id: "codex"` para forzar la selección de Codex durante las pruebas. Un runtime de Codex forzado ahora falla en lugar de volver a PI, a menos que establezcas explícitamente `agentRuntime.fallback: "pi"`. Una vez seleccionado el servidor de app de Codex, sus fallos se exponen directamente sin configuración adicional de fallback.

**El servidor de app es rechazado:** actualiza Codex para que el handshake del servidor de app informe la versión `0.125.0` o posterior. Las versiones preliminares de la misma versión o con sufijo de compilación, como `0.125.0-alpha.2` o `0.125.0+custom`, se rechazan porque el piso estable del protocolo `0.125.0` es lo que OpenClaw prueba.

**El descubrimiento de modelos es lento:** reduce `plugins.entries.codex.config.discovery.timeoutMs` o deshabilita el descubrimiento.

**El transporte WebSocket falla de inmediato:** revisa `appServer.url`, `authToken` y que el servidor de app remoto hable la misma versión del protocolo de servidor de app de Codex.

**Un modelo que no es Codex usa PI:** eso es esperado a menos que hayas forzado `agentRuntime.id: "codex"` para ese agente o seleccionado una referencia heredada `codex/*`. Las referencias simples `openai/gpt-*` y de otros proveedores permanecen en su ruta normal de proveedor en modo `auto`. Si fuerzas `agentRuntime.id: "codex"`, cada turno incrustado de ese agente debe ser un modelo de OpenAI compatible con Codex.

**Computer Use está instalado, pero las herramientas no se ejecutan:** revisa `/codex computer-use status` desde una sesión nueva. Si una herramienta informa `Native hook relay unavailable`, usa `/new` o `/reset`; si persiste, reinicia el Gateway para limpiar registros obsoletos de hooks nativos. Si `computer-use.list_apps` agota el tiempo de espera, reinicia Codex Computer Use o Codex Desktop y vuelve a intentarlo.

## Relacionado

- [Plugins de harness de agente](/es/plugins/sdk-agent-harness)
- [Runtimes de agente](/es/concepts/agent-runtimes)
- [Proveedores de modelos](/es/concepts/model-providers)
- [Proveedor OpenAI](/es/providers/openai)
- [Estado](/es/cli/status)
- [Hooks de Plugin](/es/plugins/hooks)
- [Referencia de configuración](/es/gateway/configuration-reference)
- [Pruebas](/es/help/testing-live#live-codex-app-server-harness-smoke)
