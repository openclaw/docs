---
read_when:
    - Quiere usar el arnés `app-server` incluido de Codex
    - Necesitas ejemplos de configuración del entorno de ejecución de Codex
    - Quieres que las implementaciones solo con Codex fallen en lugar de recurrir a PI
summary: Ejecutar turnos del agente integrado de OpenClaw mediante el arnés app-server de Codex incluido
title: arnés de Codex
x-i18n:
    generated_at: "2026-04-30T20:05:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: 335ec60cbdb76579db833eccb5151ffc5bcd28b370ca2e99587abdb578eeee4f
    source_path: plugins/codex-harness.md
    workflow: 16
---

El plugin `codex` incluido permite que OpenClaw ejecute turnos de agentes integrados mediante el
app-server de Codex en lugar del harness PI integrado.

Usa esto cuando quieras que Codex sea dueño de la sesión de agente de bajo nivel:
descubrimiento de modelos, reanudación nativa de hilos, compaction nativa y ejecución en app-server.
OpenClaw sigue siendo dueño de los canales de chat, archivos de sesión, selección de modelos, herramientas,
aprobaciones, entrega de medios y el espejo visible de la transcripción.

Si estás intentando orientarte, empieza con
[Runtimes de agente](/es/concepts/agent-runtimes). La versión corta es:
`openai/gpt-5.5` es la referencia del modelo, `codex` es el runtime, y Telegram,
Discord, Slack u otro canal sigue siendo la superficie de comunicación.

## Qué cambia este plugin

El plugin `codex` incluido aporta varias capacidades independientes:

| Capacidad                         | Cómo se usa                                         | Qué hace                                                                      |
| --------------------------------- | --------------------------------------------------- | ----------------------------------------------------------------------------- |
| Runtime integrado nativo          | `agentRuntime.id: "codex"`                          | Ejecuta turnos de agentes integrados de OpenClaw mediante el app-server de Codex. |
| Comandos nativos de control de chat | `/codex bind`, `/codex resume`, `/codex steer`, ... | Vincula y controla hilos del app-server de Codex desde una conversación de mensajería. |
| Proveedor/catálogo del app-server de Codex | componentes internos de `codex`, expuestos mediante el harness | Permite que el runtime descubra y valide modelos del app-server.              |
| Ruta de comprensión de medios de Codex | rutas de compatibilidad de modelos de imagen `codex/*` | Ejecuta turnos acotados del app-server de Codex para modelos compatibles de comprensión de imágenes. |
| Retransmisión de hooks nativos    | Hooks de Plugin alrededor de eventos nativos de Codex | Permite que OpenClaw observe/bloquee eventos compatibles nativos de herramienta/finalización de Codex. |

Habilitar el plugin hace que esas capacidades estén disponibles. **No**:

- empieza a usar Codex para todos los modelos de OpenAI
- convierte referencias de modelo `openai-codex/*` al runtime nativo
- convierte ACP/acpx en la ruta predeterminada de Codex
- cambia en caliente sesiones existentes que ya registraron un runtime PI
- reemplaza la entrega de canales de OpenClaw, los archivos de sesión, el almacenamiento de perfiles de autenticación ni
  el enrutamiento de mensajes

El mismo plugin también es dueño de la superficie nativa de comandos de control de chat `/codex`. Si
el plugin está habilitado y el usuario pide vincular, reanudar, dirigir, detener o inspeccionar
hilos de Codex desde el chat, los agentes deberían preferir `/codex ...` sobre ACP. ACP sigue siendo
la alternativa explícita cuando el usuario pide ACP/acpx o está probando el adaptador ACP de
Codex.

Los turnos nativos de Codex mantienen los hooks de Plugin de OpenClaw como capa pública de compatibilidad.
Estos son hooks en proceso de OpenClaw, no hooks de comando `hooks.json` de Codex:

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `before_tool_call`, `after_tool_call`
- `before_message_write` para registros de transcripción reflejados
- `before_agent_finalize` mediante la retransmisión `Stop` de Codex
- `agent_end`

Los plugins también pueden registrar middleware neutral al runtime para resultados de herramientas a fin de reescribir
resultados dinámicos de herramientas de OpenClaw después de que OpenClaw ejecuta la herramienta y antes de que el
resultado se devuelva a Codex. Esto está separado del hook público de Plugin
`tool_result_persist`, que transforma escrituras de resultados de herramientas en transcripciones propiedad de OpenClaw.

Para la semántica de los hooks de Plugin en sí, consulta [Hooks de Plugin](/es/plugins/hooks)
y [Comportamiento de guardia de Plugin](/es/tools/plugin).

El harness está desactivado de forma predeterminada. Las configuraciones nuevas deberían mantener las referencias de modelo de OpenAI
canónicas como `openai/gpt-*` y forzar explícitamente
`agentRuntime.id: "codex"` u `OPENCLAW_AGENT_RUNTIME=codex` cuando
quieran ejecución nativa en app-server. Las referencias de modelo heredadas `codex/*` todavía seleccionan automáticamente
el harness por compatibilidad, pero los prefijos de proveedores heredados respaldados por runtime
no se muestran como opciones normales de modelo/proveedor.

Si el plugin `codex` está habilitado pero el modelo principal sigue siendo
`openai-codex/*`, `openclaw doctor` advierte en lugar de cambiar la ruta. Eso es
intencional: `openai-codex/*` sigue siendo la ruta de OAuth/suscripción de PI Codex, y
la ejecución nativa en app-server sigue siendo una opción explícita de runtime.

## Mapa de rutas

Usa esta tabla antes de cambiar la configuración:

| Comportamiento deseado                    | Referencia de modelo       | Configuración de runtime                | Requisito de Plugin        | Etiqueta de estado esperada     |
| ----------------------------------------- | -------------------------- | -------------------------------------- | -------------------------- | ------------------------------- |
| API de OpenAI mediante el ejecutor normal de OpenClaw | `openai/gpt-*`             | omitido o `runtime: "pi"`              | Proveedor de OpenAI        | `Runtime: OpenClaw Pi Default`  |
| OAuth/suscripción de Codex mediante PI    | `openai-codex/gpt-*`       | omitido o `runtime: "pi"`              | Proveedor OAuth de OpenAI Codex | `Runtime: OpenClaw Pi Default`  |
| Turnos integrados nativos del app-server de Codex | `openai/gpt-*`             | `agentRuntime.id: "codex"`             | Plugin `codex`             | `Runtime: OpenAI Codex`         |
| Proveedores mixtos con modo automático conservador | referencias específicas del proveedor | `agentRuntime.id: "auto"`              | Runtimes de plugin opcionales | Depende del runtime seleccionado |
| Sesión explícita del adaptador ACP de Codex | depende de prompt/modelo ACP | `sessions_spawn` con `runtime: "acp"` | backend `acpx` saludable   | Estado de tarea/sesión ACP      |

La división importante es proveedor frente a runtime:

- `openai-codex/*` responde "¿qué ruta de proveedor/autenticación debería usar PI?"
- `agentRuntime.id: "codex"` responde "¿qué bucle debería ejecutar este
  turno integrado?"
- `/codex ...` responde "¿a qué conversación nativa de Codex debería vincularse
  o controlar este chat?"
- ACP responde "¿qué proceso de harness externo debería lanzar acpx?"

## Elige el prefijo de modelo correcto

Las rutas de la familia OpenAI son específicas del prefijo. Usa `openai-codex/*` cuando quieras
OAuth de Codex mediante PI; usa `openai/*` cuando quieras acceso directo a la API de OpenAI o
cuando estés forzando el harness nativo del app-server de Codex:

| Referencia de modelo                         | Ruta de runtime                              | Úsalo cuando                                                               |
| -------------------------------------------- | ------------------------------------------- | -------------------------------------------------------------------------- |
| `openai/gpt-5.4`                             | Proveedor de OpenAI mediante la canalización OpenClaw/PI | Quieres acceso actual directo a la API de OpenAI Platform con `OPENAI_API_KEY`. |
| `openai-codex/gpt-5.5`                       | OAuth de OpenAI Codex mediante OpenClaw/PI  | Quieres autenticación de suscripción ChatGPT/Codex con el ejecutor PI predeterminado. |
| `openai/gpt-5.5` + `agentRuntime.id: "codex"` | Harness del app-server de Codex             | Quieres ejecución nativa en el app-server de Codex para el turno de agente integrado. |

GPT-5.5 actualmente es solo por suscripción/OAuth en OpenClaw. Usa
`openai-codex/gpt-5.5` para OAuth de PI, o `openai/gpt-5.5` con el harness de
app-server de Codex. El acceso directo con clave de API para `openai/gpt-5.5` es compatible
una vez que OpenAI habilite GPT-5.5 en la API pública.

Las referencias heredadas `codex/gpt-*` siguen aceptándose como alias de compatibilidad. La migración de
compatibilidad de doctor reescribe las referencias heredadas de runtime principal a referencias de modelo canónicas
y registra la política de runtime por separado, mientras que las referencias heredadas solo de respaldo
se dejan sin cambios porque el runtime se configura para todo el contenedor de agente.
Las configuraciones nuevas de OAuth de PI Codex deberían usar `openai-codex/gpt-*`; las configuraciones nuevas del harness nativo de
app-server deberían usar `openai/gpt-*` más
`agentRuntime.id: "codex"`.

`agents.defaults.imageModel` sigue la misma división de prefijos. Usa
`openai-codex/gpt-*` cuando la comprensión de imágenes deba ejecutarse mediante la ruta del proveedor
OpenAI Codex OAuth. Usa `codex/gpt-*` cuando la comprensión de imágenes deba ejecutarse
mediante un turno acotado del app-server de Codex. El modelo del app-server de Codex debe
anunciar compatibilidad con entrada de imágenes; los modelos de Codex solo de texto fallan antes de que el turno de medios
comience.

Usa `/status` para confirmar el harness efectivo de la sesión actual. Si la
selección sorprende, habilita el registro de depuración para el subsistema `agents/harness`
e inspecciona el registro estructurado `agent harness selected` del Gateway. Incluye
el id de harness seleccionado, la razón de selección, la política de runtime/respaldo y,
en modo `auto`, el resultado de compatibilidad de cada candidato de plugin.

### Qué significan las advertencias de doctor

`openclaw doctor` advierte cuando todo esto es cierto:

- el plugin `codex` incluido está habilitado o permitido
- el modelo principal de un agente es `openai-codex/*`
- el runtime efectivo de ese agente no es `codex`

Esa advertencia existe porque los usuarios suelen esperar que "Plugin Codex habilitado" implique
"runtime nativo del app-server de Codex." OpenClaw no hace ese salto. La advertencia
significa:

- **No se requiere ningún cambio** si pretendías usar OAuth de ChatGPT/Codex mediante PI.
- Cambia el modelo a `openai/<model>` y establece
  `agentRuntime.id: "codex"` si pretendías ejecución nativa en app-server.
- Las sesiones existentes aún necesitan `/new` o `/reset` después de un cambio de runtime,
  porque las fijaciones de runtime de sesión son persistentes.

La selección del harness no es un control de sesión en vivo. Cuando se ejecuta un turno integrado,
OpenClaw registra el id del harness seleccionado en esa sesión y sigue usándolo para
turnos posteriores en el mismo id de sesión. Cambia la configuración `agentRuntime` o
`OPENCLAW_AGENT_RUNTIME` cuando quieras que las sesiones futuras usen otro harness;
usa `/new` o `/reset` para iniciar una sesión nueva antes de cambiar una conversación existente
entre PI y Codex. Esto evita reproducir una transcripción por medio de
dos sistemas de sesión nativos incompatibles.

Las sesiones heredadas creadas antes de las fijaciones de harness se tratan como fijadas a PI una vez que
tienen historial de transcripción. Usa `/new` o `/reset` para optar esa conversación por
Codex después de cambiar la configuración.

`/status` muestra el runtime de modelo efectivo. El harness PI predeterminado aparece como
`Runtime: OpenClaw Pi Default`, y el harness de app-server de Codex aparece como
`Runtime: OpenAI Codex`.

## Requisitos

- OpenClaw con el plugin `codex` incluido disponible.
- App-server de Codex `0.125.0` o más reciente. El plugin incluido gestiona un binario
  compatible del app-server de Codex de forma predeterminada, por lo que los comandos locales `codex` en `PATH` no
  afectan el inicio normal del harness.
- Autenticación de Codex disponible para el proceso app-server o para el puente de autenticación de Codex
  de OpenClaw. Los lanzamientos locales del app-server usan un home de Codex gestionado por OpenClaw para cada
  agente y un `HOME` hijo aislado, por lo que no leen tu cuenta personal
  `~/.codex`, Skills, plugins, configuración, estado de hilos ni
  `$HOME/.agents/skills` nativos de forma predeterminada.

El plugin bloquea handshakes del app-server antiguos o sin versión. Eso mantiene
OpenClaw en la superficie de protocolo contra la que se ha probado.

Para pruebas de humo en vivo y en Docker, la autenticación normalmente proviene de la cuenta de la CLI de Codex
o de un perfil de autenticación `openai-codex` de OpenClaw. Los lanzamientos locales del app-server por stdio también pueden
recurrir a `CODEX_API_KEY` / `OPENAI_API_KEY` cuando no hay ninguna cuenta presente.

## Configuración mínima

Usa `openai/gpt-5.5`, habilita el plugin incluido y fuerza el harness `codex`:

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

Si tu configuración usa `plugins.allow`, incluye `codex` allí también:

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

Las configuraciones heredadas que establecen `agents.defaults.model` o un modelo de agente en
`codex/<model>` todavía habilitan automáticamente el plugin `codex` incluido. Las configuraciones nuevas deberían
preferir `openai/<model>` más la entrada explícita `agentRuntime` anterior.

## Añadir Codex junto a otros modelos

No configures `agentRuntime.id: "codex"` globalmente si el mismo agente debe alternar libremente entre modelos de proveedores Codex y no Codex. Un runtime forzado se aplica a cada turno integrado de ese agente o sesión. Si seleccionas un modelo Anthropic mientras ese runtime está forzado, OpenClaw sigue intentando usar el arnés de Codex y falla de forma cerrada en vez de enrutar silenciosamente ese turno mediante PI.

Usa una de estas formas en su lugar:

- Pon Codex en un agente dedicado con `agentRuntime.id: "codex"`.
- Mantén el agente predeterminado en `agentRuntime.id: "auto"` y el fallback PI para el uso normal con proveedores mixtos.
- Usa referencias heredadas `codex/*` solo por compatibilidad. Las configuraciones nuevas deben preferir `openai/*` más una política explícita de runtime Codex.

Por ejemplo, esto mantiene el agente predeterminado en la selección automática normal y añade un agente Codex separado:

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
- El agente `codex` usa el arnés del app-server de Codex.
- Si Codex falta o no es compatible para el agente `codex`, el turno falla en vez de usar PI silenciosamente.

## Enrutamiento de comandos de agente

Los agentes deben enrutar las solicitudes de usuario por intención, no solo por la palabra "Codex":

| El usuario pide...                                      | El agente debe usar...                           |
| -------------------------------------------------------- | ------------------------------------------------ |
| "Vincula este chat a Codex"                             | `/codex bind`                                    |
| "Reanuda aquí el hilo Codex `<id>`"                     | `/codex resume <id>`                             |
| "Muestra los hilos Codex"                               | `/codex threads`                                 |
| "Presenta un informe de soporte por una ejecución mala de Codex" | `/diagnostics [note]`                            |
| "Envía solo comentarios de Codex para este hilo adjunto" | `/codex diagnostics [note]`                      |
| "Usa Codex como runtime para este agente"               | cambio de configuración en `agentRuntime.id`     |
| "Usa mi suscripción de ChatGPT/Codex con OpenClaw normal" | referencias de modelo `openai-codex/*`           |
| "Ejecuta Codex mediante ACP/acpx"                       | ACP `sessions_spawn({ runtime: "acp", ... })`    |
| "Inicia Claude Code/Gemini/OpenCode/Cursor en un hilo"  | ACP/acpx, no `/codex` y no subagentes nativos    |

OpenClaw solo anuncia orientación de generación ACP a los agentes cuando ACP está habilitado, es despachable y está respaldado por un backend de runtime cargado. Si ACP no está disponible, el prompt del sistema y las Skills del Plugin no deben enseñar al agente sobre el enrutamiento ACP.

## Implementaciones solo Codex

Fuerza el arnés de Codex cuando necesites demostrar que cada turno de agente integrado usa Codex. Los runtimes explícitos de Plugin no tienen fallback PI de forma predeterminada, por lo que `fallback: "none"` es opcional, pero a menudo útil como documentación:

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

Con Codex forzado, OpenClaw falla pronto si el Plugin de Codex está deshabilitado, el app-server es demasiado antiguo o el app-server no puede iniciarse. Configura `OPENCLAW_AGENT_HARNESS_FALLBACK=pi` solo si quieres intencionalmente que PI gestione la selección de arnés faltante.

## Codex por agente

Puedes hacer que un agente sea solo Codex mientras el agente predeterminado conserva la selección automática normal:

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

Usa comandos de sesión normales para cambiar de agentes y modelos. `/new` crea una sesión nueva de OpenClaw, y el arnés de Codex crea o reanuda su hilo sidecar de app-server según sea necesario. `/reset` borra la vinculación de sesión de OpenClaw para ese hilo y permite que el siguiente turno vuelva a resolver el arnés desde la configuración actual.

## Descubrimiento de modelos

De forma predeterminada, el Plugin de Codex pide al app-server los modelos disponibles. Si el descubrimiento falla o agota el tiempo de espera, usa un catálogo fallback incluido para:

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

De forma predeterminada, el Plugin inicia localmente el binario Codex gestionado por OpenClaw con:

```bash
codex app-server --listen stdio://
```

El binario gestionado se declara como una dependencia de runtime de Plugin incluida y se prepara con el resto de las dependencias del Plugin `codex`. Esto mantiene la versión del app-server vinculada al Plugin incluido en vez de a cualquier CLI de Codex independiente que esté instalada localmente. Configura `appServer.command` solo cuando quieras intencionalmente ejecutar un ejecutable distinto.

De forma predeterminada, OpenClaw inicia sesiones locales del arnés de Codex en modo YOLO: `approvalPolicy: "never"`, `approvalsReviewer: "user"` y `sandbox: "danger-full-access"`. Esta es la postura de operador local de confianza que se usa para Heartbeats autónomos: Codex puede usar herramientas de shell y red sin detenerse en prompts de aprobación nativos que no hay nadie para responder.

Para optar por aprobaciones revisadas por el guardián de Codex, configura `appServer.mode: "guardian"`:

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

El modo guardián usa la ruta de aprobación de revisión automática nativa de Codex. Cuando Codex pide salir del sandbox, escribir fuera del espacio de trabajo o añadir permisos como acceso de red, Codex enruta esa solicitud de aprobación al revisor nativo en vez de a un prompt humano. El revisor aplica el marco de riesgos de Codex y aprueba o deniega la solicitud específica. Usa Guardián cuando quieras más protecciones que en modo YOLO pero sigas necesitando que los agentes desatendidos avancen.

El preset `guardian` se expande a `approvalPolicy: "on-request"`, `approvalsReviewer: "auto_review"` y `sandbox: "workspace-write"`. Los campos de política individuales siguen anulando `mode`, por lo que las implementaciones avanzadas pueden mezclar el preset con opciones explícitas. El valor de revisor anterior `guardian_subagent` sigue aceptándose como alias de compatibilidad, pero las configuraciones nuevas deben usar `auto_review`.

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

Los lanzamientos de app-server por stdio heredan de forma predeterminada el entorno del proceso de OpenClaw, pero OpenClaw posee el puente de cuenta del app-server de Codex y configura tanto `CODEX_HOME` como `HOME` en directorios por agente bajo el estado de OpenClaw de ese agente. El cargador de Skills propio de Codex lee `$CODEX_HOME/skills` y `$HOME/.agents/skills`, por lo que ambos valores quedan aislados para lanzamientos locales de app-server. Eso mantiene las Skills, plugins, configuración, cuentas y estado de hilos nativos de Codex acotados al agente de OpenClaw en vez de filtrarse desde el directorio personal de la CLI de Codex del operador.

Los plugins de OpenClaw y las instantáneas de Skills de OpenClaw siguen fluyendo por el registro de Plugin y el cargador de Skills propios de OpenClaw. Los recursos personales de la CLI de Codex no. Si tienes Skills o plugins útiles de la CLI de Codex que deban pasar a formar parte de un agente de OpenClaw, inventaríalos explícitamente:

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

El proveedor de migración de Codex copia Skills al espacio de trabajo actual del agente de OpenClaw. Los plugins nativos, hooks y archivos de configuración de Codex se reportan o archivan para revisión manual en vez de activarse automáticamente, porque pueden ejecutar comandos, exponer servidores MCP o portar credenciales.

La autenticación se selecciona en este orden:

1. Un perfil de autenticación explícito de OpenClaw Codex para el agente.
2. La cuenta existente del app-server en el directorio de inicio de Codex de ese agente.
3. Solo para lanzamientos locales de app-server por stdio, `CODEX_API_KEY`, luego `OPENAI_API_KEY`, cuando no hay una cuenta de app-server presente y la autenticación de OpenAI sigue siendo requerida.

Cuando OpenClaw detecta un perfil de autenticación Codex de estilo suscripción de ChatGPT, elimina `CODEX_API_KEY` y `OPENAI_API_KEY` del proceso hijo de Codex generado. Eso mantiene disponibles las claves API de nivel Gateway para embeddings o modelos OpenAI directos sin hacer que los turnos nativos del app-server de Codex se facturen accidentalmente mediante la API. Los perfiles explícitos con clave API de Codex y el fallback local por clave de entorno stdio usan inicio de sesión del app-server en vez de entorno heredado del proceso hijo. Las conexiones de app-server por WebSocket no reciben fallback de clave API de entorno de Gateway; usa un perfil de autenticación explícito o la propia cuenta del app-server remoto.

Si una implementación necesita aislamiento de entorno adicional, añade esas variables a `appServer.clearEnv`:

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

`appServer.clearEnv` solo afecta al proceso hijo del app-server de Codex generado.

Campos `appServer` compatibles:

| Campo               | Predeterminado                           | Significado                                                                                                                                                                                                                              |
| ------------------- | ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`         | `"stdio"`                                | `"stdio"` inicia Codex; `"websocket"` se conecta a `url`.                                                                                                                                                                                |
| `command`           | binario administrado de Codex            | Ejecutable para el transporte stdio. Déjalo sin definir para usar el binario administrado; configúralo solo para una sobrescritura explícita.                                                                                            |
| `args`              | `["app-server", "--listen", "stdio://"]` | Argumentos para el transporte stdio.                                                                                                                                                                                                     |
| `url`               | sin definir                              | URL del app-server WebSocket.                                                                                                                                                                                                            |
| `authToken`         | sin definir                              | Token Bearer para el transporte WebSocket.                                                                                                                                                                                               |
| `headers`           | `{}`                                     | Encabezados WebSocket adicionales.                                                                                                                                                                                                       |
| `clearEnv`          | `[]`                                     | Nombres de variables de entorno adicionales eliminadas del proceso app-server stdio iniciado después de que OpenClaw construye su entorno heredado. `CODEX_HOME` y `HOME` están reservadas para el aislamiento de Codex por agente de OpenClaw en lanzamientos locales. |
| `requestTimeoutMs`  | `60000`                                  | Tiempo de espera para llamadas del plano de control del app-server.                                                                                                                                                                      |
| `mode`              | `"yolo"`                                 | Preajuste para ejecución YOLO o revisada por guardian.                                                                                                                                                                                   |
| `approvalPolicy`    | `"never"`                                | Política de aprobación nativa de Codex enviada al iniciar/reanudar hilo/turno.                                                                                                                                                           |
| `sandbox`           | `"danger-full-access"`                   | Modo sandbox nativo de Codex enviado al iniciar/reanudar hilo.                                                                                                                                                                           |
| `approvalsReviewer` | `"user"`                                 | Usa `"auto_review"` para permitir que Codex revise solicitudes de aprobación nativas. `guardian_subagent` sigue siendo un alias heredado.                                                                                                |
| `serviceTier`       | sin definir                              | Nivel de servicio opcional del app-server de Codex: `"fast"`, `"flex"` o `null`. Los valores heredados no válidos se ignoran.                                                                                                           |

Las llamadas dinámicas a herramientas propiedad de OpenClaw se limitan de forma independiente de
`appServer.requestTimeoutMs`: cada solicitud Codex `item/tool/call` debe recibir
una respuesta de OpenClaw en un plazo de 30 segundos. Al agotarse el tiempo de espera, OpenClaw aborta la señal de herramienta
cuando es compatible y devuelve una respuesta de herramienta dinámica fallida a Codex para que
el turno pueda continuar en lugar de dejar la sesión en `processing`.

Después de que OpenClaw responde a una solicitud app-server de Codex con alcance de turno, el arnés
también espera que Codex finalice el turno nativo con `turn/completed`. Si el
app-server queda en silencio durante 60 segundos después de esa respuesta, OpenClaw interrumpe
el turno de Codex con el mejor esfuerzo, registra un tiempo de espera de diagnóstico y libera el
carril de sesión de OpenClaw para que los mensajes de chat posteriores no queden en cola detrás de un turno
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
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` para pruebas locales puntuales. Se
prefiere la configuración para despliegues repetibles porque mantiene el comportamiento del plugin en el
mismo archivo revisado que el resto de la configuración del arnés de Codex.

## Uso de computadora

El uso de computadora se cubre en su propia guía de configuración:
[Uso de computadora de Codex](/es/plugins/codex-computer-use).

La versión breve: OpenClaw no integra como proveedor la app de control de escritorio ni ejecuta
acciones de escritorio por sí mismo. Prepara el app-server de Codex, verifica que el
servidor MCP `computer-use` esté disponible y luego permite que Codex gestione las llamadas nativas
a herramientas MCP durante los turnos en modo Codex.

Para acceso directo al controlador TryCua fuera del flujo de marketplace de Codex, registra
`cua-driver mcp` con `openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'`.
Consulta [Uso de computadora de Codex](/es/plugins/codex-computer-use) para ver la distinción
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

La configuración se puede comprobar o instalar desde la superficie de comandos:

- `/codex computer-use status`
- `/codex computer-use install`
- `/codex computer-use install --source <marketplace-source>`
- `/codex computer-use install --marketplace-path <path>`

Computer Use es específico de macOS y puede requerir permisos locales del sistema operativo antes de que el
servidor MCP de Codex pueda controlar apps. Si `computerUse.enabled` es true y el servidor MCP
no está disponible, los turnos en modo Codex fallan antes de que se inicie el hilo en lugar de
ejecutarse silenciosamente sin las herramientas nativas de Computer Use. Consulta
[Uso de computadora de Codex](/es/plugins/codex-computer-use) para opciones de marketplace,
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

El cambio de modelo sigue controlado por OpenClaw. Cuando una sesión de OpenClaw está adjunta
a un hilo de Codex existente, el siguiente turno envía de nuevo al app-server
el modelo de OpenAI, proveedor, política de aprobación, sandbox y nivel de servicio
seleccionados actualmente. Cambiar de `openai/gpt-5.5` a `openai/gpt-5.2` mantiene el
enlace del hilo, pero solicita a Codex continuar con el modelo recién seleccionado.

## Comando Codex

El plugin incluido registra `/codex` como comando slash autorizado. Es
genérico y funciona en cualquier canal que admita comandos de texto de OpenClaw.

Formas comunes:

- `/codex status` muestra conectividad en vivo del app-server, modelos, cuenta, límites de tasa, servidores MCP y Skills.
- `/codex models` lista los modelos en vivo del app-server de Codex.
- `/codex threads [filter]` lista hilos recientes de Codex.
- `/codex resume <thread-id>` adjunta la sesión actual de OpenClaw a un hilo de Codex existente.
- `/codex compact` solicita al app-server de Codex compactar el hilo adjunto.
- `/codex review` inicia la revisión nativa de Codex para el hilo adjunto.
- `/codex diagnostics [note]` pregunta antes de enviar comentarios de diagnóstico de Codex para el hilo adjunto.
- `/codex computer-use status` comprueba el plugin Computer Use configurado y el servidor MCP.
- `/codex computer-use install` instala el plugin Computer Use configurado y recarga los servidores MCP.
- `/codex account` muestra el estado de cuenta y límites de tasa.
- `/codex mcp` lista el estado de servidores MCP del app-server de Codex.
- `/codex skills` lista las Skills del app-server de Codex.

### Flujo de depuración común

Cuando un agente respaldado por Codex hace algo inesperado en Telegram, Discord, Slack
u otro canal, empieza con la conversación donde ocurrió el problema:

1. Ejecuta `/diagnostics bad tool choice after image upload` u otra nota breve
   que describa lo que viste.
2. Aprueba la solicitud de diagnóstico una vez. La aprobación crea el zip de diagnósticos
   local del Gateway y, como la sesión usa el arnés de Codex, también
   envía el paquete de comentarios relevante de Codex a los servidores de OpenAI.
3. Copia la respuesta de diagnósticos completada en el informe de error o hilo de soporte.
   Incluye la ruta del paquete local, el resumen de privacidad, los ids de sesión de OpenClaw,
   los ids de hilo de Codex y una línea `Inspect locally` para cada hilo de Codex.
4. Si quieres depurar la ejecución tú mismo, ejecuta el comando `Inspect locally`
   impreso en una terminal. Se parece a `codex resume <thread-id>` y abre el
   hilo nativo de Codex para que puedas inspeccionar la conversación, continuarla localmente
   o preguntar a Codex por qué eligió una herramienta o plan en particular.

Usa `/codex diagnostics [note]` solo cuando quieras específicamente subir comentarios de Codex para el hilo adjunto actualmente sin el paquete completo de diagnósticos del Gateway de OpenClaw. Para la mayoría de los informes de soporte, `/diagnostics [note]` es el mejor punto de partida porque vincula el estado local del Gateway y los id. de hilos de Codex en una sola respuesta. Consulta [Exportación de diagnósticos](/es/gateway/diagnostics) para ver el modelo completo de privacidad y el comportamiento en chats grupales.

El núcleo de OpenClaw también expone `/diagnostics [note]`, solo para propietarios, como el comando general de diagnósticos del Gateway. Su solicitud de aprobación muestra el preámbulo de datos sensibles, enlaza a [Exportación de diagnósticos](/es/gateway/diagnostics) y solicita `openclaw gateway diagnostics export --json` mediante aprobación explícita de ejecución cada vez. No apruebes diagnósticos con una regla de permitir todo. Después de la aprobación, OpenClaw envía un informe que se puede pegar con la ruta del paquete local y el resumen del manifiesto. Cuando la sesión activa de OpenClaw usa el harness de Codex, esa misma aprobación también autoriza el envío de los paquetes relevantes de comentarios de Codex a los servidores de OpenAI. La solicitud de aprobación indica que se enviarán comentarios de Codex, pero no enumera los id. de sesión ni de hilo de Codex antes de la aprobación.

Si un propietario invoca `/diagnostics` en un chat grupal, OpenClaw mantiene limpio el canal compartido: el grupo recibe solo un aviso breve, mientras que el preámbulo de diagnósticos, las solicitudes de aprobación y los id. de sesión/hilo de Codex se envían al propietario mediante la ruta privada de aprobación. Si no existe una ruta privada para el propietario, OpenClaw rechaza la solicitud del grupo y pide al propietario que la ejecute desde un DM.

La subida aprobada de Codex llama a `feedback/upload` del app-server de Codex y pide al app-server que incluya registros para cada hilo listado y subhilos de Codex generados cuando estén disponibles. La subida pasa por la ruta normal de comentarios de Codex hacia los servidores de OpenAI; si los comentarios de Codex están desactivados en ese app-server, el comando devuelve el error del app-server. La respuesta de diagnósticos completada enumera los canales, los id. de sesión de OpenClaw, los id. de hilo de Codex y los comandos locales `codex resume <thread-id>` para los hilos que se enviaron. Si deniegas o ignoras la aprobación, OpenClaw no imprime esos id. de Codex. Esta subida no reemplaza la exportación local de diagnósticos del Gateway.

`/codex resume` escribe el mismo archivo de enlace auxiliar que usa el harness para los turnos normales. En el siguiente mensaje, OpenClaw reanuda ese hilo de Codex, pasa el modelo de OpenClaw seleccionado actualmente al app-server y mantiene habilitado el historial extendido.

### Inspeccionar un hilo de Codex desde la CLI

La forma más rápida de entender una ejecución incorrecta de Codex suele ser abrir directamente el hilo nativo de Codex:

```sh
codex resume <thread-id>
```

Usa esto cuando notes un error en una conversación de canal y quieras inspeccionar la sesión problemática de Codex, continuarla localmente o preguntar a Codex por qué tomó una decisión concreta de herramienta o razonamiento. La ruta más sencilla suele ser ejecutar primero `/diagnostics [note]`: después de aprobarlo, el informe completado enumera cada hilo de Codex e imprime un comando `Inspeccionar localmente`, por ejemplo `codex resume <thread-id>`. Puedes copiar ese comando directamente en una terminal.

También puedes obtener un id. de hilo desde `/codex binding` para el chat actual o `/codex threads [filter]` para hilos recientes del app-server de Codex, y luego ejecutar el mismo comando `codex resume` en tu shell.

La superficie de comandos requiere el app-server de Codex `0.125.0` o posterior. Los métodos de control individuales se reportan como `unsupported by this Codex app-server` si un app-server futuro o personalizado no expone ese método JSON-RPC.

## Límites de hooks

El harness de Codex tiene tres capas de hooks:

| Capa                                  | Propietario              | Propósito                                                            |
| ------------------------------------- | ------------------------ | -------------------------------------------------------------------- |
| Hooks de plugins de OpenClaw          | OpenClaw                 | Compatibilidad de producto/plugin entre harnesses de PI y Codex.     |
| Middleware de extensión del app-server de Codex | Plugins incluidos con OpenClaw | Comportamiento del adaptador por turno alrededor de herramientas dinámicas de OpenClaw. |
| Hooks nativos de Codex                | Codex                    | Ciclo de vida de bajo nivel de Codex y política de herramientas nativas desde la configuración de Codex. |

OpenClaw no usa archivos `hooks.json` de proyecto ni globales de Codex para enrutar el comportamiento de plugins de OpenClaw. Para el puente compatible de herramientas nativas y permisos, OpenClaw inyecta configuración de Codex por hilo para `PreToolUse`, `PostToolUse`, `PermissionRequest` y `Stop`. Otros hooks de Codex como `SessionStart` y `UserPromptSubmit` siguen siendo controles de nivel Codex; no se exponen como hooks de plugins de OpenClaw en el contrato v1.

Para las herramientas dinámicas de OpenClaw, OpenClaw ejecuta la herramienta después de que Codex solicita la llamada, por lo que OpenClaw dispara el comportamiento de plugin y middleware que posee en el adaptador del harness. Para herramientas nativas de Codex, Codex posee el registro canónico de la herramienta. OpenClaw puede reflejar eventos seleccionados, pero no puede reescribir el hilo nativo de Codex salvo que Codex exponga esa operación mediante el app-server o callbacks de hooks nativos.

Las proyecciones de Compaction y del ciclo de vida del LLM provienen de notificaciones del app-server de Codex y del estado del adaptador de OpenClaw, no de comandos de hooks nativos de Codex. Los eventos `before_compaction`, `after_compaction`, `llm_input` y `llm_output` de OpenClaw son observaciones de nivel adaptador, no capturas byte a byte de la solicitud interna ni de los payloads de Compaction de Codex.

Las notificaciones `hook/started` y `hook/completed` nativas de Codex del app-server se proyectan como eventos de agente `codex_app_server.hook` para trayectoria y depuración. No invocan hooks de plugins de OpenClaw.

## Contrato de soporte v1

El modo Codex no es PI con una llamada de modelo diferente por debajo. Codex posee una parte mayor del bucle nativo del modelo, y OpenClaw adapta sus superficies de plugin y sesión alrededor de ese límite.

Compatible en el runtime v1 de Codex:

| Superficie                                     | Soporte                                 | Motivo                                                                                                                                                                                               |
| --------------------------------------------- | --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Bucle de modelo de OpenAI mediante Codex       | Compatible                              | El app-server de Codex posee el turno de OpenAI, la reanudación del hilo nativo y la continuación de herramientas nativas.                                                                           |
| Enrutamiento y entrega de canales de OpenClaw  | Compatible                              | Telegram, Discord, Slack, WhatsApp, iMessage y otros canales permanecen fuera del runtime del modelo.                                                                                                |
| Herramientas dinámicas de OpenClaw             | Compatible                              | Codex pide a OpenClaw que ejecute estas herramientas, por lo que OpenClaw permanece en la ruta de ejecución.                                                                                         |
| Plugins de prompt y contexto                   | Compatible                              | OpenClaw construye superposiciones de prompt y proyecta contexto en el turno de Codex antes de iniciar o reanudar el hilo.                                                                           |
| Ciclo de vida del motor de contexto            | Compatible                              | El ensamblado, la ingesta o el mantenimiento posterior al turno, y la coordinación de Compaction del motor de contexto se ejecutan para turnos de Codex.                                             |
| Hooks de herramientas dinámicas                | Compatible                              | `before_tool_call`, `after_tool_call` y el middleware de resultados de herramientas se ejecutan alrededor de herramientas dinámicas propiedad de OpenClaw.                                            |
| Hooks de ciclo de vida                         | Compatible como observaciones del adaptador | `llm_input`, `llm_output`, `agent_end`, `before_compaction` y `after_compaction` se disparan con payloads honestos del modo Codex.                                                                   |
| Puerta de revisión de respuesta final          | Compatible mediante el relay de hooks nativos | `Stop` de Codex se retransmite a `before_agent_finalize`; `revise` pide a Codex una pasada más del modelo antes de la finalización.                                                                  |
| Bloqueo u observación de shell, patch y MCP nativos | Compatible mediante el relay de hooks nativos | `PreToolUse` y `PostToolUse` de Codex se retransmiten para superficies de herramientas nativas confirmadas, incluidos payloads MCP en el app-server de Codex `0.125.0` o posterior. El bloqueo es compatible; la reescritura de argumentos no. |
| Política de permisos nativa                    | Compatible mediante el relay de hooks nativos | `PermissionRequest` de Codex puede enrutarse mediante la política de OpenClaw donde el runtime lo expone. Si OpenClaw no devuelve ninguna decisión, Codex continúa por su ruta normal de guardián o aprobación del usuario. |
| Captura de trayectoria del app-server          | Compatible                              | OpenClaw registra la solicitud que envió al app-server y las notificaciones del app-server que recibe.                                                                                               |

No compatible en el runtime v1 de Codex:

| Superficie                                         | Límite V1                                                                                                                                       | Ruta futura                                                                                 |
| -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Mutación de argumentos de herramientas nativas     | Los hooks preherramienta nativos de Codex pueden bloquear, pero OpenClaw no reescribe argumentos de herramientas nativas de Codex.             | Requiere compatibilidad de hooks/esquemas de Codex para reemplazar la entrada de herramienta. |
| Historial editable de transcripción nativa de Codex | Codex posee el historial canónico de hilos nativos. OpenClaw posee un espejo y puede proyectar contexto futuro, pero no debe mutar componentes internos no compatibles. | Agregar API explícitas del servidor de aplicaciones de Codex si se necesita cirugía de hilos nativos. |
| `tool_result_persist` para registros de herramientas nativas de Codex | Ese hook transforma escrituras de transcripción propiedad de OpenClaw, no registros de herramientas nativas de Codex.                           | Podría reflejar registros transformados, pero la reescritura canónica necesita compatibilidad de Codex. |
| Metadatos nativos enriquecidos de Compaction       | OpenClaw observa el inicio y la finalización de Compaction, pero no recibe una lista estable de conservados/eliminados, delta de tokens ni carga útil de resumen. | Necesita eventos de Compaction de Codex más enriquecidos.                                     |
| Intervención de Compaction                         | Los hooks actuales de Compaction de OpenClaw están a nivel de notificación en modo Codex.                                                       | Agregar hooks pre/post Compaction de Codex si los plugins necesitan vetar o reescribir Compaction nativa. |
| Captura byte por byte de solicitudes de API de modelo | OpenClaw puede capturar solicitudes y notificaciones del servidor de aplicaciones, pero el núcleo de Codex construye internamente la solicitud final a la API de OpenAI. | Necesita un evento de rastreo de solicitud de modelo de Codex o una API de depuración.       |

## Herramientas, medios y Compaction

El arnés de Codex solo cambia el ejecutor de agente integrado de bajo nivel.

OpenClaw sigue construyendo la lista de herramientas y recibiendo resultados de herramientas dinámicas desde el arnés. Texto, imágenes, video, música, TTS, aprobaciones y salida de herramientas de mensajería continúan por la ruta normal de entrega de OpenClaw.

El relé de hooks nativos es intencionalmente genérico, pero el contrato de compatibilidad v1 se limita a las rutas de herramientas nativas de Codex y permisos que OpenClaw prueba. En el entorno de ejecución de Codex, eso incluye cargas útiles de shell, patch y MCP `PreToolUse`, `PostToolUse` y `PermissionRequest`. No asumas que cada evento futuro de hook de Codex es una superficie de plugin de OpenClaw hasta que el contrato de tiempo de ejecución lo nombre.

Para `PermissionRequest`, OpenClaw solo devuelve decisiones explícitas de permitir o denegar cuando la política decide. Un resultado sin decisión no es una autorización. Codex lo trata como ausencia de decisión de hook y pasa a su propia ruta de guardián o aprobación de usuario.

Las solicitudes de aprobación de herramientas MCP de Codex se enrutan mediante el flujo de aprobación de plugins de OpenClaw cuando Codex marca `_meta.codex_approval_kind` como `"mcp_tool_call"`. Los prompts de Codex `request_user_input` se envían de vuelta al chat de origen, y el siguiente mensaje de seguimiento en cola responde esa solicitud nativa del servidor en lugar de dirigirse como contexto adicional. Otras solicitudes de interacción de MCP siguen fallando de forma cerrada.

El direccionamiento de cola de ejecución activa se asigna a `turn/steer` del servidor de aplicaciones de Codex. Con el valor predeterminado `messages.queue.mode: "steer"`, OpenClaw agrupa mensajes de chat en cola durante la ventana de silencio configurada y los envía como una sola solicitud `turn/steer` en orden de llegada. El modo heredado `queue` envía solicitudes `turn/steer` separadas. Los turnos de revisión y Compaction manual de Codex pueden rechazar el direccionamiento en el mismo turno, en cuyo caso OpenClaw usa la cola de seguimiento cuando el modo seleccionado permite respaldo. Consulta [Cola de direccionamiento](/es/concepts/queue-steering).

Cuando el modelo seleccionado usa el arnés de Codex, la Compaction de hilos nativos se delega al servidor de aplicaciones de Codex. OpenClaw mantiene un espejo de transcripción para historial de canal, búsqueda, `/new`, `/reset` y cambios futuros de modelo o arnés. El espejo incluye el prompt del usuario, el texto final del asistente y registros ligeros de razonamiento o plan de Codex cuando el servidor de aplicaciones los emite. Hoy, OpenClaw solo registra señales de inicio y finalización de Compaction nativa. Aún no expone un resumen legible por humanos de Compaction ni una lista auditable de qué entradas conservó Codex después de Compaction.

Como Codex posee el hilo nativo canónico, `tool_result_persist` actualmente no reescribe registros de resultados de herramientas nativas de Codex. Solo se aplica cuando OpenClaw escribe un resultado de herramienta en la transcripción de una sesión propiedad de OpenClaw.

La generación de medios no requiere PI. Imágenes, video, música, PDF, TTS y comprensión de medios siguen usando la configuración de proveedor/modelo correspondiente, como `agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel` y `messages.tts`.

## Solución de problemas

**Codex no aparece como un proveedor normal de `/model`:** esto es esperado para configuraciones nuevas. Selecciona un modelo `openai/gpt-*` con `agentRuntime.id: "codex"` (o una referencia heredada `codex/*`), habilita `plugins.entries.codex.enabled` y comprueba si `plugins.allow` excluye `codex`.

**OpenClaw usa PI en lugar de Codex:** `agentRuntime.id: "auto"` todavía puede usar PI como backend de compatibilidad cuando ningún arnés de Codex reclama la ejecución. Configura `agentRuntime.id: "codex"` para forzar la selección de Codex durante las pruebas. Un entorno de ejecución de Codex forzado ahora falla en lugar de volver a PI, a menos que configures explícitamente `agentRuntime.fallback: "pi"`. Una vez seleccionado el servidor de aplicaciones de Codex, sus fallos se muestran directamente sin configuración de respaldo adicional.

**El servidor de aplicaciones se rechaza:** actualiza Codex para que el handshake del servidor de aplicaciones informe la versión `0.125.0` o una más reciente. Versiones preliminares de la misma versión o versiones con sufijo de compilación como `0.125.0-alpha.2` o `0.125.0+custom` se rechazan porque el mínimo de protocolo estable `0.125.0` es lo que OpenClaw prueba.

**El descubrimiento de modelos es lento:** reduce `plugins.entries.codex.config.discovery.timeoutMs` o deshabilita el descubrimiento.

**El transporte WebSocket falla de inmediato:** revisa `appServer.url`, `authToken` y que el servidor de aplicaciones remoto hable la misma versión del protocolo del servidor de aplicaciones de Codex.

**Un modelo que no es Codex usa PI:** esto es esperado a menos que hayas forzado `agentRuntime.id: "codex"` para ese agente o seleccionado una referencia heredada `codex/*`. Las referencias simples `openai/gpt-*` y de otros proveedores permanecen en su ruta normal de proveedor en modo `auto`. Si fuerzas `agentRuntime.id: "codex"`, cada turno integrado para ese agente debe ser un modelo de OpenAI compatible con Codex.

**Computer Use está instalado pero las herramientas no se ejecutan:** comprueba `/codex computer-use status` desde una sesión nueva. Si una herramienta informa `Native hook relay unavailable`, usa `/new` o `/reset`; si persiste, reinicia el gateway para borrar registros obsoletos de hooks nativos. Si `computer-use.list_apps` agota el tiempo de espera, reinicia Codex Computer Use o Codex Desktop y vuelve a intentarlo.

## Relacionado

- [Plugins de arnés de agente](/es/plugins/sdk-agent-harness)
- [Entornos de ejecución de agentes](/es/concepts/agent-runtimes)
- [Proveedores de modelos](/es/concepts/model-providers)
- [Proveedor OpenAI](/es/providers/openai)
- [Estado](/es/cli/status)
- [Hooks de plugins](/es/plugins/hooks)
- [Referencia de configuración](/es/gateway/configuration-reference)
- [Pruebas](/es/help/testing-live#live-codex-app-server-harness-smoke)
