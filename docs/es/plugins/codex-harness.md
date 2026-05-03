---
read_when:
    - Quieres usar el arnés app-server de Codex incluido
    - Necesitas ejemplos de configuración del arnés de Codex
    - Quieres que las implementaciones solo con Codex fallen en lugar de recurrir a PI
summary: Ejecutar turnos de agentes embebidos de OpenClaw a través del arnés de app-server de Codex incluido
title: Banco de pruebas de Codex
x-i18n:
    generated_at: "2026-05-03T05:29:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: 83cb442bb2b87fdfe530619e8951bc8f4f5a7d3bfd68ca49eeb16bbdd8b189b4
    source_path: plugins/codex-harness.md
    workflow: 16
---

El Plugin `codex` incluido permite que OpenClaw ejecute turnos de agente integrados a través del servidor de aplicación de Codex en lugar del arnés PI integrado.

Úsalo cuando quieras que Codex sea propietario de la sesión de agente de bajo nivel: detección de modelos, reanudación nativa de hilos, Compaction nativa y ejecución en el servidor de aplicación. OpenClaw sigue siendo propietario de los canales de chat, archivos de sesión, selección de modelos, herramientas, aprobaciones, entrega de medios y el espejo visible de la transcripción.

Cuando un turno de chat de origen se ejecuta a través del arnés de Codex, las respuestas visibles usan de forma predeterminada la herramienta `message` de OpenClaw si la implementación no ha configurado explícitamente `messages.visibleReplies`. El agente aún puede finalizar su turno de Codex en privado; solo publica en el canal cuando llama a `message(action="send")`. Establece `messages.visibleReplies: "automatic"` para mantener las respuestas finales de chat directo en la ruta heredada de entrega automática.

Los turnos Heartbeat de Codex también obtienen la herramienta `heartbeat_respond` de forma predeterminada, para que el agente pueda registrar si el despertar debe permanecer en silencio o notificar sin codificar ese flujo de control en el texto final.

Si estás intentando orientarte, empieza con [Tiempos de ejecución de agentes](/es/concepts/agent-runtimes). La versión corta es: `openai/gpt-5.5` es la referencia de modelo, `codex` es el tiempo de ejecución, y Telegram, Discord, Slack u otro canal sigue siendo la superficie de comunicación.

## Configuración rápida

La mayoría de los usuarios que quieren "Codex en OpenClaw" quieren esta ruta: iniciar sesión con una suscripción de ChatGPT/Codex y luego ejecutar turnos de agente integrados a través del tiempo de ejecución nativo del servidor de aplicación de Codex. La referencia de modelo sigue siendo canónica como `openai/gpt-*`; la autenticación de suscripción proviene de la cuenta/perfil de Codex, no de un prefijo de modelo `openai-codex/*`.

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

No uses `openai-codex/gpt-*` cuando te refieras al tiempo de ejecución nativo de Codex. Ese prefijo es la ruta explícita "OAuth de Codex a través de PI". Los cambios de configuración se aplican a sesiones nuevas o restablecidas; las sesiones existentes conservan su tiempo de ejecución registrado.

## Qué cambia este Plugin

El Plugin `codex` incluido aporta varias capacidades separadas:

| Capacidad                         | Cómo se usa                                         | Qué hace                                                                       |
| --------------------------------- | --------------------------------------------------- | ------------------------------------------------------------------------------ |
| Tiempo de ejecución nativo integrado | `agentRuntime.id: "codex"`                          | Ejecuta turnos de agente integrado de OpenClaw a través del servidor de aplicación de Codex. |
| Comandos nativos de control de chat | `/codex bind`, `/codex resume`, `/codex steer`, ... | Vincula y controla hilos del servidor de aplicación de Codex desde una conversación de mensajería. |
| Proveedor/catálogo del servidor de aplicación de Codex | internos de `codex`, expuestos a través del arnés   | Permite que el tiempo de ejecución descubra y valide modelos del servidor de aplicación. |
| Ruta de comprensión de medios de Codex | rutas de compatibilidad de modelos de imagen `codex/*` | Ejecuta turnos acotados del servidor de aplicación de Codex para modelos compatibles de comprensión de imágenes. |
| Retransmisión nativa de hooks     | Hooks de Plugin alrededor de eventos nativos de Codex | Permite que OpenClaw observe/bloquee eventos compatibles de herramientas/finalización nativos de Codex. |

Habilitar el Plugin pone esas capacidades a disposición. **No**:

- empieza a usar Codex para cada modelo de OpenAI
- convierte referencias de modelo `openai-codex/*` al tiempo de ejecución nativo
- hace que ACP/acpx sea la ruta predeterminada de Codex
- cambia en caliente sesiones existentes que ya registraron un tiempo de ejecución PI
- reemplaza la entrega por canales de OpenClaw, archivos de sesión, almacenamiento de perfiles de autenticación o enrutamiento de mensajes

El mismo Plugin también posee la superficie nativa de comandos de control de chat `/codex`. Si el Plugin está habilitado y el usuario pide vincular, reanudar, dirigir, detener o inspeccionar hilos de Codex desde el chat, los agentes deberían preferir `/codex ...` sobre ACP. ACP sigue siendo la alternativa explícita cuando el usuario pide ACP/acpx o está probando el adaptador ACP de Codex.

Los turnos nativos de Codex mantienen los hooks de Plugin de OpenClaw como la capa pública de compatibilidad. Estos son hooks en proceso de OpenClaw, no hooks de comando `hooks.json` de Codex:

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `before_tool_call`, `after_tool_call`
- `before_message_write` para registros de transcripción reflejados
- `before_agent_finalize` a través de la retransmisión `Stop` de Codex
- `agent_end`

Los plugins también pueden registrar middleware de resultados de herramientas neutral respecto al tiempo de ejecución para reescribir resultados de herramientas dinámicas de OpenClaw después de que OpenClaw ejecute la herramienta y antes de que el resultado se devuelva a Codex. Esto es independiente del hook público de Plugin `tool_result_persist`, que transforma escrituras de resultados de herramientas en la transcripción propiedad de OpenClaw.

Para la semántica de los hooks de Plugin, consulta [Hooks de Plugin](/es/plugins/hooks) y [Comportamiento de guardia de Plugin](/es/tools/plugin).

El arnés está desactivado de forma predeterminada. Las configuraciones nuevas deberían mantener las referencias de modelo de OpenAI canónicas como `openai/gpt-*` y forzar explícitamente `agentRuntime.id: "codex"` u `OPENCLAW_AGENT_RUNTIME=codex` cuando quieran ejecución nativa en el servidor de aplicación. Las referencias de modelo heredadas `codex/*` todavía seleccionan automáticamente el arnés por compatibilidad, pero los prefijos heredados de proveedor respaldados por tiempo de ejecución no se muestran como opciones normales de modelo/proveedor.

Si el Plugin `codex` está habilitado pero el modelo principal sigue siendo `openai-codex/*`, `openclaw doctor` advierte en lugar de cambiar la ruta. Esto es intencional: `openai-codex/*` sigue siendo la ruta PI de OAuth/suscripción de Codex, y la ejecución nativa en el servidor de aplicación sigue siendo una elección explícita de tiempo de ejecución.

## Mapa de rutas

Usa esta tabla antes de cambiar la configuración:

| Comportamiento deseado                              | Referencia de modelo      | Configuración de tiempo de ejecución     | Ruta de autenticación/perfil | Etiqueta de estado esperada    |
| --------------------------------------------------- | -------------------------- | ---------------------------------------- | ---------------------------- | ------------------------------ |
| Suscripción de ChatGPT/Codex con tiempo de ejecución nativo de Codex | `openai/gpt-*`             | `agentRuntime.id: "codex"`               | OAuth de Codex o cuenta de Codex | `Runtime: OpenAI Codex`        |
| API de OpenAI a través del ejecutor normal de OpenClaw | `openai/gpt-*`             | omitido o `runtime: "pi"`                | Clave de API de OpenAI       | `Runtime: OpenClaw Pi Default` |
| Suscripción de ChatGPT/Codex a través de PI         | `openai-codex/gpt-*`       | omitido o `runtime: "pi"`                | Proveedor OAuth de OpenAI Codex | `Runtime: OpenClaw Pi Default` |
| Proveedores mixtos con modo automático conservador  | referencias específicas del proveedor | `agentRuntime.id: "auto"`                | Por proveedor seleccionado   | Depende del tiempo de ejecución seleccionado |
| Sesión explícita del adaptador ACP de Codex         | dependiente de prompt/modelo ACP | `sessions_spawn` con `runtime: "acp"`    | Autenticación del backend ACP | Estado de tarea/sesión ACP     |

La separación importante es proveedor frente a tiempo de ejecución:

- `openai-codex/*` responde "¿qué ruta de proveedor/autenticación debería usar PI?"
- `agentRuntime.id: "codex"` responde "¿qué bucle debería ejecutar este turno integrado?"
- `/codex ...` responde "¿a qué conversación nativa de Codex debería vincularse o controlar este chat?"
- ACP responde "¿qué proceso de arnés externo debería lanzar acpx?"

## Elige el prefijo de modelo correcto

Las rutas de la familia OpenAI son específicas por prefijo. Para la configuración común de suscripción más tiempo de ejecución nativo de Codex, usa `openai/*` con `agentRuntime.id: "codex"`. Usa `openai-codex/*` solo cuando quieras intencionalmente OAuth de Codex a través de PI:

| Referencia de modelo                         | Ruta de tiempo de ejecución                  | Úsalo cuando                                                              |
| --------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------- |
| `openai/gpt-5.4`                              | Proveedor OpenAI a través de la fontanería OpenClaw/PI | Quieres acceso actual directo a la API de OpenAI Platform con `OPENAI_API_KEY`. |
| `openai-codex/gpt-5.5`                        | OAuth de OpenAI Codex a través de OpenClaw/PI | Quieres autenticación de suscripción de ChatGPT/Codex con el ejecutor PI predeterminado. |
| `openai/gpt-5.5` + `agentRuntime.id: "codex"` | Arnés del servidor de aplicación de Codex     | Quieres autenticación de suscripción de ChatGPT/Codex con ejecución nativa de Codex. |

GPT-5.5 puede aparecer tanto en rutas directas con clave de API de OpenAI como en rutas de suscripción de Codex cuando tu cuenta las expone. Usa `openai/gpt-5.5` con el arnés del servidor de aplicación de Codex para el tiempo de ejecución nativo de Codex, `openai-codex/gpt-5.5` para OAuth de PI, o `openai/gpt-5.5` sin una anulación de tiempo de ejecución de Codex para tráfico directo con clave de API.

Las referencias heredadas `codex/gpt-*` siguen aceptándose como alias de compatibilidad. La migración de compatibilidad de doctor reescribe referencias heredadas de tiempo de ejecución principal a referencias de modelo canónicas y registra por separado la política de tiempo de ejecución, mientras que las referencias heredadas solo de alternativa se dejan sin cambios porque el tiempo de ejecución se configura para todo el contenedor de agente. Las nuevas configuraciones de OAuth de PI Codex deberían usar `openai-codex/gpt-*`; las nuevas configuraciones de arnés nativo del servidor de aplicación deberían usar `openai/gpt-*` más `agentRuntime.id: "codex"`.

`agents.defaults.imageModel` sigue la misma separación de prefijos. Usa `openai-codex/gpt-*` cuando la comprensión de imágenes deba ejecutarse a través de la ruta del proveedor OAuth de OpenAI Codex. Usa `codex/gpt-*` cuando la comprensión de imágenes deba ejecutarse a través de un turno acotado del servidor de aplicación de Codex. El modelo del servidor de aplicación de Codex debe anunciar compatibilidad con entrada de imagen; los modelos de Codex solo de texto fallan antes de que empiece el turno de medios.

Usa `/status` para confirmar el arnés efectivo de la sesión actual. Si la selección es sorprendente, habilita el registro de depuración para el subsistema `agents/harness` e inspecciona el registro estructurado `agent harness selected` del Gateway. Incluye el id del arnés seleccionado, el motivo de selección, la política de tiempo de ejecución/alternativa y, en modo `auto`, el resultado de compatibilidad de cada candidato de Plugin.

### Qué significan las advertencias de doctor

`openclaw doctor` advierte cuando todo esto es cierto:

- el Plugin `codex` incluido está habilitado o permitido
- el modelo principal de un agente es `openai-codex/*`
- el tiempo de ejecución efectivo de ese agente no es `codex`

Esa advertencia existe porque los usuarios a menudo esperan que "Plugin de Codex habilitado" implique "tiempo de ejecución nativo del servidor de aplicación de Codex". OpenClaw no hace ese salto. La advertencia significa:

- **No se requiere ningún cambio** si pretendías usar OAuth de ChatGPT/Codex a través de PI.
- Cambia el modelo a `openai/<model>` y establece `agentRuntime.id: "codex"` si pretendías ejecución nativa en el servidor de aplicación.
- Las sesiones existentes aún necesitan `/new` o `/reset` después de un cambio de tiempo de ejecución, porque las fijaciones de tiempo de ejecución de sesión son persistentes.

La selección de arnés no es un control de sesión en vivo. Cuando se ejecuta un turno integrado, OpenClaw registra el id del arnés seleccionado en esa sesión y sigue usándolo para turnos posteriores en el mismo id de sesión. Cambia la configuración `agentRuntime` u `OPENCLAW_AGENT_RUNTIME` cuando quieras que las sesiones futuras usen otro arnés; usa `/new` o `/reset` para iniciar una sesión nueva antes de cambiar una conversación existente entre PI y Codex. Esto evita reproducir una transcripción por dos sistemas de sesión nativos incompatibles.

Las sesiones heredadas creadas antes de las fijaciones de arnés se tratan como fijadas a PI una vez que tienen historial de transcripción. Usa `/new` o `/reset` para incorporar esa conversación a Codex después de cambiar la configuración.

`/status` muestra el runtime de modelo efectivo. El arnés PI predeterminado aparece como
`Runtime: OpenClaw Pi Default`, y el arnés de servidor de aplicación de Codex aparece como
`Runtime: OpenAI Codex`.

## Requisitos

- OpenClaw con el plugin `codex` incluido disponible.
- Servidor de aplicación de Codex `0.125.0` o posterior. El plugin incluido gestiona de forma predeterminada un binario de servidor de aplicación de Codex compatible, por lo que los comandos locales `codex` en `PATH` no afectan al inicio normal del arnés.
- Autenticación de Codex disponible para el proceso del servidor de aplicación o para el puente de autenticación de Codex de OpenClaw. Los lanzamientos locales del servidor de aplicación usan un directorio principal de Codex gestionado por OpenClaw para cada agente y un `HOME` hijo aislado, por lo que no leen de forma predeterminada tu cuenta personal de `~/.codex`, Skills, plugins, configuración, estado de hilos ni `$HOME/.agents/skills` nativos.

El plugin bloquea handshakes de servidor de aplicación más antiguos o sin versión. Esto mantiene a OpenClaw en la superficie de protocolo contra la que se ha probado.

Para pruebas smoke en vivo y en Docker, la autenticación suele provenir de la cuenta de la CLI de Codex o de un perfil de autenticación `openai-codex` de OpenClaw. Los lanzamientos locales de servidor de aplicación por stdio también pueden recurrir a `CODEX_API_KEY` / `OPENAI_API_KEY` cuando no hay ninguna cuenta presente.

## Archivos de bootstrap del espacio de trabajo

Codex gestiona `AGENTS.md` por sí mismo mediante el descubrimiento nativo de documentación del proyecto. OpenClaw no escribe archivos sintéticos de documentación de proyecto de Codex ni depende de nombres de archivo alternativos de Codex para archivos de persona, porque las alternativas de Codex solo se aplican cuando falta `AGENTS.md`.

Para la paridad del espacio de trabajo de OpenClaw, el arnés de Codex resuelve los demás archivos de bootstrap (`SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` y `MEMORY.md` cuando están presentes) y los reenvía mediante instrucciones de configuración de Codex en `thread/start` y `thread/resume`. Esto mantiene `SOUL.md` y el contexto relacionado de persona/perfil del espacio de trabajo visibles sin duplicar `AGENTS.md`.

## Añadir Codex junto con otros modelos

No establezcas `agentRuntime.id: "codex"` globalmente si el mismo agente debe cambiar libremente entre Codex y modelos de proveedores que no sean Codex. Un runtime forzado se aplica a cada turno integrado de ese agente o sesión. Si seleccionas un modelo de Anthropic mientras ese runtime está forzado, OpenClaw sigue intentando usar el arnés de Codex y falla de forma cerrada en lugar de enrutar silenciosamente ese turno mediante PI.

Usa una de estas formas en su lugar:

- Pon Codex en un agente dedicado con `agentRuntime.id: "codex"`.
- Mantén el agente predeterminado en `agentRuntime.id: "auto"` y la alternativa de PI para el uso normal con proveedores mixtos.
- Usa referencias heredadas `codex/*` solo por compatibilidad. Las configuraciones nuevas deben preferir `openai/*` más una política explícita de runtime de Codex.

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

- El agente `main` predeterminado usa la ruta normal de proveedor y la alternativa de compatibilidad de PI.
- El agente `codex` usa el arnés de servidor de aplicación de Codex.
- Si Codex falta o no es compatible con el agente `codex`, el turno falla en lugar de usar PI silenciosamente.

## Enrutamiento de comandos de agente

Los agentes deben enrutar las solicitudes de usuario por intención, no solo por la palabra "Codex":

| El usuario pide...                                      | El agente debe usar...                            |
| ------------------------------------------------------ | ------------------------------------------------ |
| "Vincula este chat a Codex"                            | `/codex bind`                                    |
| "Reanuda aquí el hilo de Codex `<id>`"                 | `/codex resume <id>`                             |
| "Muestra los hilos de Codex"                           | `/codex threads`                                 |
| "Presenta un informe de soporte por una ejecución defectuosa de Codex" | `/diagnostics [note]`                            |
| "Envía solo comentarios de Codex para este hilo adjunto" | `/codex diagnostics [note]`                      |
| "Usa mi suscripción de ChatGPT/Codex con el runtime de Codex" | `openai/*` más `agentRuntime.id: "codex"`        |
| "Usa mi suscripción de ChatGPT/Codex mediante PI"      | referencias de modelo `openai-codex/*`           |
| "Ejecuta Codex mediante ACP/acpx"                      | ACP `sessions_spawn({ runtime: "acp", ... })`    |
| "Inicia Claude Code/Gemini/OpenCode/Cursor en un hilo" | ACP/acpx, no `/codex` ni subagentes nativos      |

OpenClaw solo anuncia orientación de spawn de ACP a los agentes cuando ACP está habilitado, es despachable y está respaldado por un backend de runtime cargado. Si ACP no está disponible, el prompt del sistema y las Skills del plugin no deben enseñar al agente sobre el enrutamiento de ACP.

## Despliegues solo con Codex

Fuerza el arnés de Codex cuando necesites demostrar que cada turno de agente integrado usa Codex. Los runtimes explícitos de plugin fallan de forma cerrada y nunca se reintentan silenciosamente mediante PI:

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

Con Codex forzado, OpenClaw falla temprano si el plugin de Codex está deshabilitado, el servidor de aplicación es demasiado antiguo o el servidor de aplicación no puede iniciarse.

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

Usa los comandos normales de sesión para cambiar de agente y de modelo. `/new` crea una sesión nueva de OpenClaw y el arnés de Codex crea o reanuda su hilo de servidor de aplicación auxiliar según sea necesario. `/reset` borra la vinculación de sesión de OpenClaw para ese hilo y permite que el siguiente turno resuelva de nuevo el arnés desde la configuración actual.

## Descubrimiento de modelos

De forma predeterminada, el plugin de Codex pide al servidor de aplicación los modelos disponibles. Si el descubrimiento falla o agota el tiempo de espera, usa un catálogo alternativo incluido para:

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

Deshabilita el descubrimiento cuando quieras que el inicio evite sondear Codex y se limite al catálogo alternativo:

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

De forma predeterminada, el plugin inicia localmente el binario de Codex gestionado por OpenClaw con:

```bash
codex app-server --listen stdio://
```

El binario gestionado se distribuye con el paquete del plugin `codex`. Esto mantiene la versión del servidor de aplicación vinculada al plugin incluido en lugar de a cualquier CLI de Codex independiente que esté instalada localmente. Establece `appServer.command` solo cuando quieras ejecutar intencionadamente un ejecutable distinto.

De forma predeterminada, OpenClaw inicia sesiones locales del arnés de Codex en modo YOLO: `approvalPolicy: "never"`, `approvalsReviewer: "user"` y `sandbox: "danger-full-access"`. Esta es la postura de operador local de confianza usada para Heartbeats autónomos: Codex puede usar herramientas de shell y de red sin detenerse en prompts de aprobación nativos que no hay nadie presente para responder.

Para optar por aprobaciones revisadas por guardián de Codex, establece `appServer.mode:
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

El modo guardián usa la ruta de aprobación con revisión automática nativa de Codex. Cuando Codex pide salir del sandbox, escribir fuera del espacio de trabajo o añadir permisos como acceso de red, Codex enruta esa solicitud de aprobación al revisor nativo en lugar de a un prompt humano. El revisor aplica el marco de riesgo de Codex y aprueba o deniega la solicitud específica. Usa Guardián cuando quieras más barreras que el modo YOLO, pero aun así necesites que los agentes desatendidos avancen.

El preajuste `guardian` se expande a `approvalPolicy: "on-request"`, `approvalsReviewer: "auto_review"` y `sandbox: "workspace-write"`. Los campos de política individuales siguen sobrescribiendo `mode`, por lo que los despliegues avanzados pueden mezclar el preajuste con elecciones explícitas. El valor de revisor anterior `guardian_subagent` aún se acepta como alias de compatibilidad, pero las configuraciones nuevas deben usar `auto_review`.

Para un servidor de aplicación que ya está en ejecución, usa el transporte WebSocket:

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

Los lanzamientos de servidor de aplicación por stdio heredan de forma predeterminada el entorno de proceso de OpenClaw, pero OpenClaw es propietario del puente de cuenta del servidor de aplicación de Codex y establece tanto `CODEX_HOME` como `HOME` en directorios por agente dentro del estado de OpenClaw de ese agente. El cargador de Skills propio de Codex lee `$CODEX_HOME/skills` y `$HOME/.agents/skills`, por lo que ambos valores quedan aislados para los lanzamientos locales del servidor de aplicación. Esto mantiene las Skills nativas de Codex, plugins, configuración, cuentas y estado de hilos acotados al agente de OpenClaw en lugar de filtrarse desde el directorio principal personal de la CLI de Codex del operador.

Los plugins de OpenClaw y las instantáneas de Skills de OpenClaw siguen fluyendo mediante el registro de plugins y el cargador de Skills propios de OpenClaw. Los recursos personales de la CLI de Codex no lo hacen. Si tienes Skills o plugins útiles de la CLI de Codex que deban formar parte de un agente de OpenClaw, inventaríalos explícitamente:

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

El proveedor de migración de Codex copia Skills al espacio de trabajo actual del agente de OpenClaw. Los plugins, hooks y archivos de configuración nativos de Codex se notifican o archivan para revisión manual en lugar de activarse automáticamente, porque pueden ejecutar comandos, exponer servidores MCP o portar credenciales.

La autenticación se selecciona en este orden:

1. Un perfil explícito de autenticación de Codex de OpenClaw para el agente.
2. La cuenta existente del servidor de aplicación en el directorio principal de Codex de ese agente.
3. Solo para lanzamientos locales de servidor de aplicación por stdio, `CODEX_API_KEY`, luego
   `OPENAI_API_KEY`, cuando no hay ninguna cuenta de servidor de aplicación presente y la autenticación de OpenAI sigue siendo necesaria.

Cuando OpenClaw detecta un perfil de autenticación de Codex de tipo suscripción de ChatGPT, elimina `CODEX_API_KEY` y `OPENAI_API_KEY` del proceso hijo de Codex generado. Esto mantiene disponibles las claves de API a nivel de Gateway para embeddings o modelos directos de OpenAI sin hacer que los turnos nativos del servidor de aplicación de Codex se facturen por la API por accidente. Los perfiles explícitos de clave de API de Codex y la alternativa local por clave de entorno de stdio usan el inicio de sesión del servidor de aplicación en lugar del entorno heredado del proceso hijo. Las conexiones WebSocket al servidor de aplicación no reciben la alternativa de clave de API de entorno del Gateway; usa un perfil de autenticación explícito o la propia cuenta del servidor de aplicación remoto.

Si un despliegue necesita aislamiento adicional del entorno, añade esas variables a `appServer.clearEnv`:

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
OpenClaw no expone herramientas dinámicas que duplican operaciones del espacio de trabajo
nativas de Codex: `read`, `write`, `edit`, `apply_patch`, `exec`, `process` y
`update_plan`. Las herramientas de integración de OpenClaw, como mensajería, sesiones, medios,
cron, navegador, nodos, gateway, `heartbeat_respond` y `web_search`, siguen
disponibles.

Campos de Plugin de Codex de nivel superior compatibles:

| Campo                      | Predeterminado   | Significado                                                                                 |
| -------------------------- | ---------------- | ------------------------------------------------------------------------------------------- |
| `codexDynamicToolsProfile` | `"native-first"` | Usa `"openclaw-compat"` para exponer el conjunto completo de herramientas dinámicas de OpenClaw al app-server de Codex. |
| `codexDynamicToolsExclude` | `[]`             | Nombres adicionales de herramientas dinámicas de OpenClaw que se omiten en los turnos del app-server de Codex. |

Campos `appServer` compatibles:

| Campo               | Predeterminado                         | Significado                                                                                                                                                                                                                          |
| ------------------- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `transport`         | `"stdio"`                              | `"stdio"` inicia Codex; `"websocket"` se conecta a `url`.                                                                                                                                                                             |
| `command`           | binario Codex administrado             | Ejecutable para transporte stdio. Déjalo sin definir para usar el binario administrado; configúralo solo para una anulación explícita.                                                                                                |
| `args`              | `["app-server", "--listen", "stdio://"]` | Argumentos para transporte stdio.                                                                                                                                                                                                     |
| `url`               | sin definir                            | URL del app-server WebSocket.                                                                                                                                                                                                         |
| `authToken`         | sin definir                            | Token Bearer para transporte WebSocket.                                                                                                                                                                                               |
| `headers`           | `{}`                                   | Encabezados WebSocket adicionales.                                                                                                                                                                                                    |
| `clearEnv`          | `[]`                                   | Nombres adicionales de variables de entorno eliminadas del proceso app-server stdio iniciado después de que OpenClaw construye su entorno heredado. `CODEX_HOME` y `HOME` están reservadas para el aislamiento Codex por agente de OpenClaw en lanzamientos locales. |
| `requestTimeoutMs`  | `60000`                                | Tiempo de espera para llamadas del plano de control del app-server.                                                                                                                                                                   |
| `mode`              | `"yolo"`                               | Preajuste para ejecución YOLO o revisada por guardian.                                                                                                                                                                                |
| `approvalPolicy`    | `"never"`                              | Política de aprobación nativa de Codex enviada al iniciar/reanudar hilo/turno.                                                                                                                                                        |
| `sandbox`           | `"danger-full-access"`                 | Modo sandbox nativo de Codex enviado al iniciar/reanudar hilo.                                                                                                                                                                        |
| `approvalsReviewer` | `"user"`                               | Usa `"auto_review"` para permitir que Codex revise solicitudes de aprobación nativas. `guardian_subagent` sigue siendo un alias heredado.                                                                                             |
| `serviceTier`       | sin definir                            | Nivel de servicio opcional del app-server de Codex: `"fast"`, `"flex"` o `null`. Los valores heredados no válidos se ignoran.                                                                                                         |

Las llamadas a herramientas dinámicas propiedad de OpenClaw están acotadas de forma independiente de
`appServer.requestTimeoutMs`: cada solicitud Codex `item/tool/call` debe recibir
una respuesta de OpenClaw en un plazo de 30 segundos. Al agotarse el tiempo de espera, OpenClaw aborta la señal de herramienta
cuando es compatible y devuelve a Codex una respuesta de herramienta dinámica fallida para que
el turno pueda continuar en lugar de dejar la sesión en `processing`.

Después de que OpenClaw responde a una solicitud de app-server de Codex con alcance de turno, el arnés
también espera que Codex termine el turno nativo con `turn/completed`. Si el
app-server queda en silencio durante 60 segundos después de esa respuesta, OpenClaw intenta
interrumpir el turno de Codex, registra un tiempo de espera de diagnóstico y libera el carril de sesión de
OpenClaw para que los mensajes de chat posteriores no queden en cola detrás de un turno
nativo obsoleto.

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
[Codex Computer Use](/es/plugins/codex-computer-use).

La versión corta: OpenClaw no incluye como vendor la app de control de escritorio ni ejecuta
acciones de escritorio por sí mismo. Prepara el app-server de Codex, verifica que el
servidor MCP `computer-use` esté disponible y luego permite que Codex gestione las llamadas a herramientas
MCP nativas durante los turnos en modo Codex.

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

Computer Use es específico de macOS y puede requerir permisos locales del sistema operativo antes de que el
servidor MCP de Codex pueda controlar apps. Si `computerUse.enabled` es true y el servidor MCP
no está disponible, los turnos en modo Codex fallan antes de que el hilo se inicie en lugar de
ejecutarse silenciosamente sin las herramientas nativas de Computer Use. Consulta
[Codex Computer Use](/es/plugins/codex-computer-use) para opciones de marketplace,
límites del catálogo remoto, motivos de estado y solución de problemas.

Cuando `computerUse.autoInstall` es true, OpenClaw puede registrar el marketplace estándar
incluido de Codex Desktop desde
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` si Codex
aún no ha descubierto un marketplace local. Usa `/new` o `/reset` después de
cambiar la configuración de runtime o Computer Use para que las sesiones existentes no conserven un enlace
antiguo de PI o de hilo Codex.

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

Validación de arnés solo Codex:

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
a un hilo Codex existente, el siguiente turno vuelve a enviar al app-server el modelo
OpenAI, proveedor, política de aprobación, sandbox y nivel de servicio seleccionados
actualmente. Cambiar de `openai/gpt-5.5` a `openai/gpt-5.2` conserva el
enlace de hilo, pero le pide a Codex que continúe con el modelo recién seleccionado.

## Comando Codex

El Plugin incluido registra `/codex` como comando slash autorizado. Es
genérico y funciona en cualquier canal que admita comandos de texto de OpenClaw.

Formas comunes:

- `/codex status` muestra conectividad activa del app-server, modelos, cuenta, límites de tasa, servidores MCP y Skills.
- `/codex models` lista modelos activos del app-server de Codex.
- `/codex threads [filter]` lista hilos recientes de Codex.
- `/codex resume <thread-id>` adjunta la sesión actual de OpenClaw a un hilo Codex existente.
- `/codex compact` pide al app-server de Codex que compacte el hilo adjunto.
- `/codex review` inicia la revisión nativa de Codex para el hilo adjunto.
- `/codex diagnostics [note]` pregunta antes de enviar comentarios de diagnóstico de Codex para el hilo adjunto.
- `/codex computer-use status` comprueba el Plugin de Computer Use configurado y el servidor MCP.
- `/codex computer-use install` instala el Plugin de Computer Use configurado y recarga servidores MCP.
- `/codex account` muestra el estado de la cuenta y de los límites de tasa.
- `/codex mcp` lista el estado del servidor MCP del app-server de Codex.
- `/codex skills` lista las Skills del app-server de Codex.

### Flujo común de depuración

Cuando un agente respaldado por Codex hace algo inesperado en Telegram, Discord, Slack,
u otro canal, empieza con la conversación donde ocurrió el problema:

1. Ejecuta `/diagnostics bad tool choice after image upload` u otra nota breve
   que describa lo que viste.
2. Aprueba la solicitud de diagnósticos una vez. La aprobación crea el zip local
   de diagnósticos del Gateway y, como la sesión usa el harness de Codex, también
   envía el paquete de comentarios relevante de Codex a los servidores de OpenAI.
3. Copia la respuesta de diagnósticos completada en el informe de error o el hilo
   de soporte. Incluye la ruta del paquete local, el resumen de privacidad, los ids
   de sesión de OpenClaw, los ids de hilo de Codex y una línea `Inspect locally`
   para cada hilo de Codex.
4. Si quieres depurar la ejecución tú mismo, ejecuta el comando `Inspect locally`
   impreso en una terminal. Se parece a `codex resume <thread-id>` y abre el hilo
   nativo de Codex para que puedas inspeccionar la conversación, continuarla
   localmente o preguntarle a Codex por qué eligió una herramienta o un plan en particular.

Usa `/codex diagnostics [note]` solo cuando quieras específicamente la subida de
comentarios de Codex para el hilo actualmente adjunto sin el paquete completo de
diagnósticos del Gateway de OpenClaw. Para la mayoría de los informes de soporte,
`/diagnostics [note]` es el mejor punto de partida porque vincula el estado local
del Gateway y los ids de hilo de Codex en una sola respuesta. Consulta
[Exportación de diagnósticos](/es/gateway/diagnostics) para ver el modelo completo
de privacidad y el comportamiento en chats grupales.

El núcleo de OpenClaw también expone `/diagnostics [note]` solo para propietarios
como comando general de diagnósticos del Gateway. Su aviso de aprobación muestra
el preámbulo de datos sensibles, enlaza a [Exportación de diagnósticos](/es/gateway/diagnostics)
y solicita `openclaw gateway diagnostics export --json` mediante aprobación
explícita de ejecución cada vez. No apruebes diagnósticos con una regla allow-all.
Después de la aprobación, OpenClaw envía un informe que se puede pegar con la ruta
del paquete local y el resumen del manifiesto. Cuando la sesión activa de OpenClaw
usa el harness de Codex, esa misma aprobación también autoriza el envío de los
paquetes de comentarios relevantes de Codex a los servidores de OpenAI. El aviso
de aprobación dice que se enviarán comentarios de Codex, pero no enumera los ids
de sesión o de hilo de Codex antes de la aprobación.

Si un propietario invoca `/diagnostics` en un chat grupal, OpenClaw mantiene limpio
el canal compartido: el grupo recibe solo un aviso breve, mientras que el preámbulo
de diagnósticos, los avisos de aprobación y los ids de sesión/hilo de Codex se
envían al propietario mediante la ruta privada de aprobación. Si no hay una ruta
privada de propietario, OpenClaw rechaza la solicitud del grupo y pide al
propietario que la ejecute desde un DM.

La subida aprobada de Codex llama a `feedback/upload` del app-server de Codex y
pide al app-server que incluya registros para cada hilo indicado y subhilos de
Codex generados cuando estén disponibles. La subida pasa por la ruta normal de
comentarios de Codex hacia los servidores de OpenAI; si los comentarios de Codex
están deshabilitados en ese app-server, el comando devuelve el error del
app-server. La respuesta de diagnósticos completada enumera los canales, los ids
de sesión de OpenClaw, los ids de hilo de Codex y los comandos locales
`codex resume <thread-id>` para los hilos que se enviaron. Si deniegas o ignoras
la aprobación, OpenClaw no imprime esos ids de Codex. Esta subida no reemplaza la
exportación local de diagnósticos del Gateway.

`/codex resume` escribe el mismo archivo sidecar de vinculación que usa el harness
para turnos normales. En el siguiente mensaje, OpenClaw reanuda ese hilo de Codex,
pasa el modelo de OpenClaw seleccionado actualmente al app-server y mantiene
habilitado el historial extendido.

### Inspeccionar un hilo de Codex desde la CLI

La forma más rápida de entender una ejecución defectuosa de Codex suele ser abrir
directamente el hilo nativo de Codex:

```sh
codex resume <thread-id>
```

Úsalo cuando notes un error en una conversación de canal y quieras inspeccionar
la sesión problemática de Codex, continuarla localmente o preguntarle a Codex por
qué tomó una decisión concreta de herramienta o razonamiento. La ruta más sencilla
suele ser ejecutar primero `/diagnostics [note]`: después de aprobarlo, el informe
completado enumera cada hilo de Codex e imprime un comando `Inspect locally`, por
ejemplo `codex resume <thread-id>`. Puedes copiar ese comando directamente en una
terminal.

También puedes obtener un id de hilo desde `/codex binding` para el chat actual o
`/codex threads [filter]` para hilos recientes del app-server de Codex, y luego
ejecutar el mismo comando `codex resume` en tu shell.

La superficie de comandos requiere el app-server de Codex `0.125.0` o una versión
más reciente. Los métodos de control individuales se informan como
`unsupported by this Codex app-server` si un app-server futuro o personalizado no
expone ese método JSON-RPC.

## Límites de hooks

El harness de Codex tiene tres capas de hooks:

| Capa                                  | Propietario              | Propósito                                                           |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| Hooks de plugins de OpenClaw          | OpenClaw                 | Compatibilidad de producto/plugin entre harnesses de PI y Codex.    |
| Middleware de extensiones del app-server de Codex | Plugins incluidos de OpenClaw | Comportamiento del adaptador por turno alrededor de herramientas dinámicas de OpenClaw. |
| Hooks nativos de Codex                | Codex                    | Ciclo de vida de bajo nivel de Codex y política nativa de herramientas desde la configuración de Codex. |

OpenClaw no usa archivos `hooks.json` de proyecto o globales de Codex para enrutar
el comportamiento de plugins de OpenClaw. Para el puente compatible de herramienta
nativa y permisos, OpenClaw inyecta configuración de Codex por hilo para
`PreToolUse`, `PostToolUse`, `PermissionRequest` y `Stop`. Otros hooks de Codex
como `SessionStart` y `UserPromptSubmit` siguen siendo controles de nivel Codex;
no se exponen como hooks de plugins de OpenClaw en el contrato v1.

Para las herramientas dinámicas de OpenClaw, OpenClaw ejecuta la herramienta
después de que Codex solicita la llamada, así que OpenClaw dispara el
comportamiento de Plugin y middleware que posee en el adaptador del harness. Para
herramientas nativas de Codex, Codex posee el registro canónico de la herramienta.
OpenClaw puede reflejar eventos seleccionados, pero no puede reescribir el hilo
nativo de Codex a menos que Codex exponga esa operación mediante el app-server o
callbacks de hooks nativos.

Las proyecciones de Compaction y del ciclo de vida de LLM provienen de
notificaciones del app-server de Codex y del estado del adaptador de OpenClaw, no
de comandos de hooks nativos de Codex. Los eventos `before_compaction`,
`after_compaction`, `llm_input` y `llm_output` de OpenClaw son observaciones de
nivel adaptador, no capturas byte por byte de la solicitud interna o de las cargas
de Compaction de Codex.

Las notificaciones `hook/started` y `hook/completed` nativas de Codex del
app-server se proyectan como eventos de agente `codex_app_server.hook` para
trayectoria y depuración. No invocan hooks de plugins de OpenClaw.

## Contrato de soporte v1

El modo Codex no es PI con una llamada de modelo diferente por debajo. Codex posee
más del bucle nativo del modelo, y OpenClaw adapta sus superficies de Plugin y
sesión alrededor de ese límite.

Compatible en el runtime v1 de Codex:

| Superficie                                    | Soporte                                 | Por qué                                                                                                                                                                                                |
| --------------------------------------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Bucle de modelo de OpenAI mediante Codex      | Compatible                              | El app-server de Codex posee el turno de OpenAI, la reanudación del hilo nativo y la continuación de herramientas nativas.                                                                             |
| Enrutamiento y entrega de canales de OpenClaw | Compatible                              | Telegram, Discord, Slack, WhatsApp, iMessage y otros canales permanecen fuera del runtime del modelo.                                                                                                  |
| Herramientas dinámicas de OpenClaw            | Compatible                              | Codex pide a OpenClaw que ejecute estas herramientas, así que OpenClaw permanece en la ruta de ejecución.                                                                                              |
| Plugins de prompt y contexto                  | Compatible                              | OpenClaw construye superposiciones de prompt y proyecta contexto en el turno de Codex antes de iniciar o reanudar el hilo.                                                                             |
| Ciclo de vida del motor de contexto           | Compatible                              | El ensamblaje, la ingesta o el mantenimiento posterior al turno, y la coordinación de Compaction del motor de contexto se ejecutan para turnos de Codex.                                                |
| Hooks de herramientas dinámicas               | Compatible                              | `before_tool_call`, `after_tool_call` y el middleware de resultado de herramienta se ejecutan alrededor de herramientas dinámicas propiedad de OpenClaw.                                                 |
| Hooks de ciclo de vida                        | Compatible como observaciones del adaptador | `llm_input`, `llm_output`, `agent_end`, `before_compaction` y `after_compaction` se disparan con cargas honestas del modo Codex.                                                                        |
| Puerta de revisión de respuesta final         | Compatible mediante el relay de hook nativo | Codex `Stop` se retransmite a `before_agent_finalize`; `revise` pide a Codex una pasada más del modelo antes de la finalización.                                                                        |
| Bloqueo u observación de shell, patch y MCP nativos | Compatible mediante el relay de hook nativo | Codex `PreToolUse` y `PostToolUse` se retransmiten para superficies comprometidas de herramientas nativas, incluidas cargas MCP en el app-server de Codex `0.125.0` o posterior. El bloqueo es compatible; la reescritura de argumentos no lo es. |
| Política de permisos nativa                   | Compatible mediante el relay de hook nativo | Codex `PermissionRequest` puede enrutarse mediante la política de OpenClaw cuando el runtime lo expone. Si OpenClaw no devuelve ninguna decisión, Codex continúa por su ruta normal de guardián o aprobación del usuario. |
| Captura de trayectoria del app-server         | Compatible                              | OpenClaw registra la solicitud que envió al app-server y las notificaciones del app-server que recibe.                                                                                                 |

No compatible en el runtime v1 de Codex:

| Superficie                                             | Límite de V1                                                                                                                                     | Ruta futura                                                                               |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Mutación de argumentos de herramientas nativas                       | Los hooks nativos previos a herramientas de Codex pueden bloquear, pero OpenClaw no reescribe los argumentos de herramientas nativas de Codex.                                               | Requiere compatibilidad de hooks/esquema de Codex para reemplazar la entrada de la herramienta.                            |
| Historial editable de transcripción nativa de Codex            | Codex posee el historial canónico nativo del hilo. OpenClaw posee un espejo y puede proyectar contexto futuro, pero no debe mutar elementos internos no compatibles. | Agregar APIs explícitas del servidor de aplicaciones de Codex si se necesita cirugía de hilos nativos.                    |
| `tool_result_persist` para registros de herramientas nativas de Codex | Ese hook transforma escrituras de transcripción propiedad de OpenClaw, no registros de herramientas nativas de Codex.                                                           | Podría reflejar registros transformados, pero la reescritura canónica necesita compatibilidad de Codex.              |
| Metadatos enriquecidos de Compaction nativa                     | OpenClaw observa el inicio y la finalización de la Compaction, pero no recibe una lista estable de conservados/descartados, delta de tokens ni carga útil de resumen.            | Necesita eventos de Compaction de Codex más enriquecidos.                                                     |
| Intervención de Compaction                             | Los hooks actuales de Compaction de OpenClaw son de nivel de notificación en modo Codex.                                                                         | Agregar hooks previos/posteriores de Compaction de Codex si los plugins necesitan vetar o reescribir la Compaction nativa. |
| Captura byte por byte de solicitudes a la API del modelo             | OpenClaw puede capturar solicitudes y notificaciones del servidor de aplicaciones, pero el núcleo de Codex construye internamente la solicitud final a la API de OpenAI.                      | Necesita un evento de trazado de solicitudes de modelo de Codex o una API de depuración.                                   |

## Herramientas, medios y Compaction

El arnés de Codex cambia solamente el ejecutor de agente embebido de bajo nivel.

OpenClaw sigue construyendo la lista de herramientas y recibiendo resultados dinámicos de herramientas desde el arnés. Texto, imágenes, video, música, TTS, aprobaciones y salida de herramientas de mensajería continúan por la ruta normal de entrega de OpenClaw.

El relevo de hooks nativos es intencionalmente genérico, pero el contrato de compatibilidad de v1 se limita a las rutas de herramientas y permisos nativas de Codex que OpenClaw prueba. En el runtime de Codex, eso incluye cargas útiles de shell, patch y MCP `PreToolUse`, `PostToolUse` y `PermissionRequest`. No asumas que cada evento futuro de hook de Codex es una superficie de Plugin de OpenClaw hasta que el contrato del runtime lo nombre.

Para `PermissionRequest`, OpenClaw solo devuelve decisiones explícitas de permitir o denegar cuando la política decide. Un resultado sin decisión no es una autorización. Codex lo trata como ausencia de decisión de hook y continúa hacia su propio guardián o ruta de aprobación del usuario.

Las solicitudes de aprobación de herramientas MCP de Codex se enrutan por el flujo de aprobación de plugins de OpenClaw cuando Codex marca `_meta.codex_approval_kind` como `"mcp_tool_call"`. Los prompts de Codex `request_user_input` se envían de vuelta al chat de origen, y el siguiente mensaje de seguimiento en cola responde esa solicitud del servidor nativo en lugar de dirigirse como contexto adicional. Otras solicitudes de obtención de MCP siguen fallando de forma cerrada.

El direccionamiento de cola de ejecución activa se asigna a `turn/steer` del servidor de aplicaciones de Codex. Con el valor predeterminado `messages.queue.mode: "steer"`, OpenClaw agrupa los mensajes de chat en cola durante la ventana de silencio configurada y los envía como una sola solicitud `turn/steer` en orden de llegada. El modo heredado `queue` envía solicitudes `turn/steer` separadas. Los turnos de revisión y Compaction manual de Codex pueden rechazar el direccionamiento dentro del mismo turno, en cuyo caso OpenClaw usa la cola de seguimiento cuando el modo seleccionado permite reserva. Consulta [Cola de direccionamiento](/es/concepts/queue-steering).

Cuando el modelo seleccionado usa el arnés de Codex, la Compaction de hilos nativos se delega al servidor de aplicaciones de Codex. OpenClaw mantiene un espejo de transcripción para el historial de canales, búsqueda, `/new`, `/reset` y futuros cambios de modelo o arnés. El espejo incluye el prompt del usuario, el texto final del asistente y registros ligeros de razonamiento o plan de Codex cuando el servidor de aplicaciones los emite. Hoy, OpenClaw solo registra señales de inicio y finalización de Compaction nativa. Todavía no expone un resumen de Compaction legible por humanos ni una lista auditable de qué entradas conservó Codex después de la Compaction.

Como Codex posee el hilo nativo canónico, `tool_result_persist` actualmente no reescribe registros de resultados de herramientas nativas de Codex. Solo se aplica cuando OpenClaw escribe un resultado de herramienta de transcripción de sesión propiedad de OpenClaw.

La generación de medios no requiere PI. La comprensión y generación de imágenes, video, música, PDF, TTS y medios sigue usando la configuración correspondiente de proveedor/modelo, como `agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel` y `messages.tts`.

## Solución de problemas

**Codex no aparece como un proveedor `/model` normal:** eso es lo esperado para configuraciones nuevas. Selecciona un modelo `openai/gpt-*` con `agentRuntime.id: "codex"` (o una referencia heredada `codex/*`), habilita `plugins.entries.codex.enabled` y comprueba si `plugins.allow` excluye `codex`.

**OpenClaw usa PI en lugar de Codex:** `agentRuntime.id: "auto"` todavía puede usar PI como backend de compatibilidad cuando ningún arnés de Codex reclama la ejecución. Configura `agentRuntime.id: "codex"` para forzar la selección de Codex durante las pruebas. Un runtime de Codex forzado falla en lugar de recurrir a PI. Una vez seleccionado el servidor de aplicaciones de Codex, sus fallos se exponen directamente.

**El servidor de aplicaciones se rechaza:** actualiza Codex para que el handshake del servidor de aplicaciones informe la versión `0.125.0` o posterior. Las versiones preliminares de la misma versión o las versiones con sufijo de compilación, como `0.125.0-alpha.2` o `0.125.0+custom`, se rechazan porque el piso estable del protocolo `0.125.0` es lo que OpenClaw prueba.

**El descubrimiento de modelos es lento:** reduce `plugins.entries.codex.config.discovery.timeoutMs` o deshabilita el descubrimiento.

**El transporte WebSocket falla de inmediato:** comprueba `appServer.url`, `authToken` y que el servidor de aplicaciones remoto hable la misma versión del protocolo del servidor de aplicaciones de Codex.

**Un modelo que no es Codex usa PI:** eso es lo esperado a menos que hayas forzado `agentRuntime.id: "codex"` para ese agente o seleccionado una referencia heredada `codex/*`. Las referencias simples `openai/gpt-*` y de otros proveedores permanecen en su ruta normal de proveedor en modo `auto`. Si fuerzas `agentRuntime.id: "codex"`, cada turno embebido para ese agente debe ser un modelo OpenAI compatible con Codex.

**Computer Use está instalado pero las herramientas no se ejecutan:** comprueba `/codex computer-use status` desde una sesión nueva. Si una herramienta informa `Native hook relay unavailable`, usa `/new` o `/reset`; si persiste, reinicia el Gateway para limpiar registros de hooks nativos obsoletos. Si `computer-use.list_apps` agota el tiempo de espera, reinicia Codex Computer Use o Codex Desktop y vuelve a intentarlo.

## Relacionado

- [Plugins de arnés de agente](/es/plugins/sdk-agent-harness)
- [Runtimes de agente](/es/concepts/agent-runtimes)
- [Proveedores de modelos](/es/concepts/model-providers)
- [Proveedor de OpenAI](/es/providers/openai)
- [Estado](/es/cli/status)
- [Hooks de plugins](/es/plugins/hooks)
- [Referencia de configuración](/es/gateway/configuration-reference)
- [Pruebas](/es/help/testing-live#live-codex-app-server-harness-smoke)
