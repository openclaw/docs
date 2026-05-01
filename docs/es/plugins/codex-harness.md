---
read_when:
    - Quieres usar el arnés de servidor de aplicaciones de Codex incluido
    - Necesitas ejemplos de configuración del harness de Codex
    - Quieres que los despliegues solo de Codex fallen en lugar de recurrir a PI
summary: Ejecuta turnos de agente integrado de OpenClaw mediante el entorno de pruebas de app-server de Codex incluido
title: Arnés de Codex
x-i18n:
    generated_at: "2026-05-01T05:32:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 740e8fa9e6f4a737dfd250fe26b85865a7f7e40839b41e879e9224a45cbe8d72
    source_path: plugins/codex-harness.md
    workflow: 16
---

El plugin `codex` incluido permite que OpenClaw ejecute turnos de agente incrustados a través del
app-server de Codex en lugar del arnés PI integrado.

Úsalo cuando quieras que Codex sea dueño de la sesión de agente de bajo nivel:
descubrimiento de modelos, reanudación nativa de hilos, compaction nativa y ejecución en app-server.
OpenClaw sigue siendo dueño de los canales de chat, los archivos de sesión, la selección de modelos, las herramientas,
las aprobaciones, la entrega de medios y el espejo visible de la transcripción.

Si estás intentando orientarte, empieza con
[Entornos de ejecución de agentes](/es/concepts/agent-runtimes). La versión corta es:
`openai/gpt-5.5` es la referencia de modelo, `codex` es el entorno de ejecución, y Telegram,
Discord, Slack u otro canal sigue siendo la superficie de comunicación.

## Configuración rápida

Para usar el arnés de Codex para turnos de agente GPT, mantén la referencia de modelo canónica como
`openai/gpt-*`, habilita el plugin `codex` incluido y establece
`agentRuntime.id: "codex"`:

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

No uses `openai-codex/gpt-*` para esta ruta. Eso selecciona OAuth de Codex a través
del ejecutor PI normal, a menos que fuerces por separado un entorno de ejecución. Los cambios de configuración se aplican
a sesiones nuevas o restablecidas; las sesiones existentes conservan su entorno de ejecución registrado.

## Qué cambia este plugin

El plugin `codex` incluido aporta varias capacidades separadas:

| Capacidad                         | Cómo la usas                                        | Qué hace                                                                      |
| --------------------------------- | --------------------------------------------------- | ----------------------------------------------------------------------------- |
| Entorno de ejecución incrustado nativo | `agentRuntime.id: "codex"`                          | Ejecuta turnos de agente incrustados de OpenClaw a través del app-server de Codex. |
| Comandos nativos de control de chat | `/codex bind`, `/codex resume`, `/codex steer`, ... | Vincula y controla hilos del app-server de Codex desde una conversación de mensajería. |
| Proveedor/catálogo del app-server de Codex | Componentes internos de `codex`, expuestos a través del arnés | Permite que el entorno de ejecución descubra y valide modelos del app-server. |
| Ruta de comprensión de medios de Codex | Rutas de compatibilidad de modelos de imagen `codex/*` | Ejecuta turnos acotados del app-server de Codex para modelos de comprensión de imágenes compatibles. |
| Relay de hooks nativo            | Hooks de plugin alrededor de eventos nativos de Codex | Permite que OpenClaw observe/bloquee eventos nativos de herramienta/finalización de Codex compatibles. |

Habilitar el plugin deja disponibles esas capacidades. **No** hace lo siguiente:

- empezar a usar Codex para todos los modelos de OpenAI
- convertir referencias de modelo `openai-codex/*` en el entorno de ejecución nativo
- convertir ACP/acpx en la ruta predeterminada de Codex
- cambiar en caliente sesiones existentes que ya registraron un entorno de ejecución PI
- reemplazar la entrega de canales de OpenClaw, los archivos de sesión, el almacenamiento de perfiles de autenticación ni
  el enrutamiento de mensajes

El mismo plugin también es dueño de la superficie nativa de comandos de control de chat `/codex`. Si
el plugin está habilitado y el usuario pide vincular, reanudar, dirigir, detener o inspeccionar
hilos de Codex desde el chat, los agentes deben preferir `/codex ...` sobre ACP. ACP sigue siendo
la alternativa explícita cuando el usuario pide ACP/acpx o está probando el adaptador ACP
de Codex.

Los turnos nativos de Codex mantienen los hooks de plugin de OpenClaw como la capa pública de compatibilidad.
Estos son hooks de OpenClaw en proceso, no hooks de comando `hooks.json` de Codex:

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `before_tool_call`, `after_tool_call`
- `before_message_write` para registros de transcripción reflejados
- `before_agent_finalize` a través del relay `Stop` de Codex
- `agent_end`

Los plugins también pueden registrar middleware de resultados de herramientas neutral respecto al entorno de ejecución para reescribir
resultados de herramientas dinámicas de OpenClaw después de que OpenClaw ejecuta la herramienta y antes de que el
resultado se devuelva a Codex. Esto está separado del hook público de plugin
`tool_result_persist`, que transforma escrituras de resultados de herramientas en transcripciones propiedad de OpenClaw.

Para la semántica de los hooks de plugin en sí, consulta [Hooks de plugin](/es/plugins/hooks)
y [Comportamiento de guardas de plugin](/es/tools/plugin).

El arnés está desactivado de forma predeterminada. Las configuraciones nuevas deben mantener las referencias de modelo de OpenAI
canónicas como `openai/gpt-*` y forzar explícitamente
`agentRuntime.id: "codex"` o `OPENCLAW_AGENT_RUNTIME=codex` cuando
quieran ejecución nativa en app-server. Las referencias de modelo heredadas `codex/*` siguen autoseleccionando
el arnés por compatibilidad, pero los prefijos de proveedor heredados respaldados por entorno de ejecución
no se muestran como opciones normales de modelo/proveedor.

Si el plugin `codex` está habilitado pero el modelo principal sigue siendo
`openai-codex/*`, `openclaw doctor` advierte en lugar de cambiar la ruta. Eso es
intencional: `openai-codex/*` sigue siendo la ruta de OAuth/suscripción de Codex en PI, y
la ejecución nativa en app-server sigue siendo una elección explícita de entorno de ejecución.

## Mapa de rutas

Usa esta tabla antes de cambiar la configuración:

| Comportamiento deseado                    | Referencia de modelo       | Configuración de entorno de ejecución    | Requisito de plugin        | Etiqueta de estado esperada    |
| ----------------------------------------- | -------------------------- | ---------------------------------------- | -------------------------- | ------------------------------ |
| API de OpenAI a través del ejecutor normal de OpenClaw | `openai/gpt-*`             | omitido o `runtime: "pi"`                | Proveedor de OpenAI        | `Runtime: OpenClaw Pi Default` |
| OAuth/suscripción de Codex a través de PI | `openai-codex/gpt-*`       | omitido o `runtime: "pi"`                | Proveedor OAuth de OpenAI Codex | `Runtime: OpenClaw Pi Default` |
| Turnos incrustados nativos del app-server de Codex | `openai/gpt-*`             | `agentRuntime.id: "codex"`               | plugin `codex`             | `Runtime: OpenAI Codex`        |
| Proveedores mixtos con modo automático conservador | referencias específicas del proveedor | `agentRuntime.id: "auto"`                | Entornos de ejecución de plugin opcionales | Depende del entorno de ejecución seleccionado |
| Sesión explícita del adaptador ACP de Codex | dependiente de prompt/modelo de ACP | `sessions_spawn` con `runtime: "acp"` | backend `acpx` saludable   | Estado de tarea/sesión de ACP  |

La división importante es proveedor frente a entorno de ejecución:

- `openai-codex/*` responde "¿qué ruta de proveedor/autenticación debe usar PI?"
- `agentRuntime.id: "codex"` responde "¿qué bucle debe ejecutar este
  turno incrustado?"
- `/codex ...` responde "¿qué conversación nativa de Codex debe vincular
  o controlar este chat?"
- ACP responde "¿qué proceso de arnés externo debe lanzar acpx?"

## Elige el prefijo de modelo correcto

Las rutas de la familia OpenAI son específicas del prefijo. Usa `openai-codex/*` cuando quieras
OAuth de Codex a través de PI; usa `openai/*` cuando quieras acceso directo a la API de OpenAI o
cuando estés forzando el arnés nativo del app-server de Codex:

| Referencia de modelo                         | Ruta de entorno de ejecución                  | Úsalo cuando                                                               |
| --------------------------------------------- | --------------------------------------------- | ------------------------------------------------------------------------- |
| `openai/gpt-5.4`                              | Proveedor de OpenAI a través de la fontanería de OpenClaw/PI | Quieres acceso directo actual a la API de OpenAI Platform con `OPENAI_API_KEY`. |
| `openai-codex/gpt-5.5`                        | OAuth de OpenAI Codex a través de OpenClaw/PI | Quieres autenticación de suscripción de ChatGPT/Codex con el ejecutor PI predeterminado. |
| `openai/gpt-5.5` + `agentRuntime.id: "codex"` | Arnés del app-server de Codex                 | Quieres ejecución nativa del app-server de Codex para el turno de agente incrustado. |

GPT-5.5 actualmente solo está disponible mediante suscripción/OAuth en OpenClaw. Usa
`openai-codex/gpt-5.5` para OAuth de PI, o `openai/gpt-5.5` con el arnés
del app-server de Codex. El acceso directo con clave de API para `openai/gpt-5.5` es compatible
una vez que OpenAI habilite GPT-5.5 en la API pública.

Las referencias heredadas `codex/gpt-*` siguen aceptándose como alias de compatibilidad. La migración
de compatibilidad de doctor reescribe referencias heredadas de entorno de ejecución principal a referencias de modelo canónicas
y registra la política de entorno de ejecución por separado, mientras que las referencias heredadas solo de alternativa
se dejan sin cambios porque el entorno de ejecución se configura para todo el contenedor del agente.
Las configuraciones nuevas de OAuth de Codex en PI deben usar `openai-codex/gpt-*`; las configuraciones nuevas del arnés
nativo en app-server deben usar `openai/gpt-*` más
`agentRuntime.id: "codex"`.

`agents.defaults.imageModel` sigue la misma división de prefijos. Usa
`openai-codex/gpt-*` cuando la comprensión de imágenes deba ejecutarse a través de la ruta del proveedor OAuth de OpenAI
Codex. Usa `codex/gpt-*` cuando la comprensión de imágenes deba ejecutarse
a través de un turno acotado del app-server de Codex. El modelo del app-server de Codex debe
anunciar compatibilidad con entrada de imágenes; los modelos de Codex solo de texto fallan antes de que empiece el turno
de medios.

Usa `/status` para confirmar el arnés efectivo de la sesión actual. Si la
selección sorprende, habilita el registro de depuración para el subsistema `agents/harness`
e inspecciona el registro estructurado `agent harness selected` del Gateway. Incluye
el id del arnés seleccionado, la razón de selección, la política de entorno de ejecución/alternativa y,
en modo `auto`, el resultado de compatibilidad de cada candidato de plugin.

### Qué significan las advertencias de doctor

`openclaw doctor` advierte cuando todo esto es cierto:

- el plugin `codex` incluido está habilitado o permitido
- el modelo principal de un agente es `openai-codex/*`
- el entorno de ejecución efectivo de ese agente no es `codex`

Esa advertencia existe porque los usuarios a menudo esperan que "plugin de Codex habilitado" implique
"entorno de ejecución nativo del app-server de Codex." OpenClaw no hace ese salto. La advertencia
significa:

- **No se requiere ningún cambio** si pretendías usar OAuth de ChatGPT/Codex a través de PI.
- Cambia el modelo a `openai/<model>` y establece
  `agentRuntime.id: "codex"` si pretendías ejecución nativa en app-server.
- Las sesiones existentes todavía necesitan `/new` o `/reset` después de un cambio de entorno de ejecución,
  porque los pines de entorno de ejecución de sesión son persistentes.

La selección de arnés no es un control de sesión en vivo. Cuando se ejecuta un turno incrustado,
OpenClaw registra el id del arnés seleccionado en esa sesión y sigue usándolo para
turnos posteriores en el mismo id de sesión. Cambia la configuración de `agentRuntime` o
`OPENCLAW_AGENT_RUNTIME` cuando quieras que sesiones futuras usen otro arnés;
usa `/new` o `/reset` para iniciar una sesión nueva antes de cambiar una conversación existente
entre PI y Codex. Esto evita reproducir una transcripción a través de
dos sistemas de sesión nativos incompatibles.

Las sesiones heredadas creadas antes de los pines de arnés se tratan como fijadas a PI una vez que
tienen historial de transcripción. Usa `/new` o `/reset` para optar esa conversación por
Codex después de cambiar la configuración.

`/status` muestra el entorno de ejecución efectivo del modelo. El arnés PI predeterminado aparece como
`Runtime: OpenClaw Pi Default`, y el arnés del app-server de Codex aparece como
`Runtime: OpenAI Codex`.

## Requisitos

- OpenClaw con el plugin `codex` incluido disponible.
- App-server de Codex `0.125.0` o más reciente. El plugin incluido administra de forma predeterminada un binario
  compatible del app-server de Codex, así que los comandos locales `codex` en `PATH` no
  afectan el arranque normal del arnés.
- Autenticación de Codex disponible para el proceso del app-server o para el puente de autenticación de Codex
  de OpenClaw. Los lanzamientos locales del app-server por stdio usan un directorio home de Codex administrado por OpenClaw para cada
  agente y un `HOME` hijo aislado, así que no leen tu cuenta personal
  `~/.codex`, Skills, plugins, configuración, estado de hilos ni
  `$HOME/.agents/skills` nativos de forma predeterminada.

El plugin bloquea handshakes de app-server antiguos o sin versión. Eso mantiene
a OpenClaw en la superficie de protocolo contra la que se ha probado.

Para pruebas de humo en vivo y Docker, la autenticación normalmente proviene de la cuenta de Codex CLI
o de un perfil de autenticación `openai-codex` de OpenClaw. Los lanzamientos locales del app-server por stdio también pueden
recurrir a `CODEX_API_KEY` / `OPENAI_API_KEY` cuando no hay ninguna cuenta presente.

## Añadir Codex junto a otros modelos

No establezcas `agentRuntime.id: "codex"` globalmente si el mismo agente debe poder alternar libremente
entre Codex y modelos de proveedores que no sean Codex. Un runtime forzado se aplica a cada
turno integrado de ese agente o sesión. Si seleccionas un modelo de Anthropic mientras
ese runtime está forzado, OpenClaw sigue intentando usar el harness de Codex y falla de forma cerrada
en lugar de enrutar silenciosamente ese turno por PI.

Usa una de estas formas en su lugar:

- Pon Codex en un agente dedicado con `agentRuntime.id: "codex"`.
- Mantén el agente predeterminado en `agentRuntime.id: "auto"` y el fallback de PI para el uso normal mixto
  de proveedores.
- Usa referencias heredadas `codex/*` solo por compatibilidad. Las configuraciones nuevas deberían preferir
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

- El agente predeterminado `main` usa la ruta normal del proveedor y el fallback de compatibilidad de PI.
- El agente `codex` usa el harness de servidor de aplicaciones de Codex.
- Si Codex falta o no es compatible con el agente `codex`, el turno falla
  en lugar de usar PI silenciosamente.

## Enrutamiento de comandos del agente

Los agentes deberían enrutar las solicitudes de usuario por intención, no solo por la palabra "Codex":

| El usuario pide...                                       | El agente debería usar...                         |
| -------------------------------------------------------- | ------------------------------------------------ |
| "Vincula este chat a Codex"                              | `/codex bind`                                    |
| "Reanuda aquí el hilo de Codex `<id>`"                   | `/codex resume <id>`                             |
| "Muestra los hilos de Codex"                             | `/codex threads`                                 |
| "Presenta un informe de soporte por una ejecución incorrecta de Codex" | `/diagnostics [note]`                            |
| "Envía feedback de Codex solo para este hilo adjunto"    | `/codex diagnostics [note]`                      |
| "Usa Codex como runtime para este agente"                | cambio de configuración en `agentRuntime.id`     |
| "Usa mi suscripción de ChatGPT/Codex con OpenClaw normal" | referencias de modelo `openai-codex/*`           |
| "Ejecuta Codex mediante ACP/acpx"                        | ACP `sessions_spawn({ runtime: "acp", ... })`    |
| "Inicia Claude Code/Gemini/OpenCode/Cursor en un hilo"   | ACP/acpx, no `/codex` ni subagentes nativos      |

OpenClaw solo anuncia orientación de spawn de ACP a los agentes cuando ACP está habilitado,
es despachable y está respaldado por un backend de runtime cargado. Si ACP no está disponible,
el prompt del sistema y las Skills del Plugin no deberían enseñar al agente sobre el enrutamiento
de ACP.

## Despliegues solo con Codex

Fuerza el harness de Codex cuando necesites demostrar que cada turno de agente integrado
usa Codex. Los runtimes explícitos de Plugin no tienen fallback de PI de forma predeterminada, así que
`fallback: "none"` es opcional, pero suele ser útil como documentación:

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

Con Codex forzado, OpenClaw falla pronto si el Plugin de Codex está deshabilitado, si el
servidor de aplicaciones es demasiado antiguo o si el servidor de aplicaciones no puede iniciarse. Configura
`OPENCLAW_AGENT_HARNESS_FALLBACK=pi` solo si quieres intencionadamente que PI gestione
la selección de harness faltante.

## Codex por agente

Puedes hacer que un agente sea solo Codex mientras el agente predeterminado mantiene la
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

Usa comandos de sesión normales para cambiar de agentes y modelos. `/new` crea una sesión
nueva de OpenClaw y el harness de Codex crea o reanuda su hilo sidecar de servidor de aplicaciones
según sea necesario. `/reset` borra la vinculación de sesión de OpenClaw para ese hilo
y permite que el siguiente turno resuelva de nuevo el harness desde la configuración actual.

## Descubrimiento de modelos

De forma predeterminada, el Plugin de Codex pregunta al servidor de aplicaciones por los modelos disponibles. Si
el descubrimiento falla o agota el tiempo de espera, usa un catálogo de fallback incluido para:

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
catálogo de fallback:

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

De forma predeterminada, el Plugin inicia localmente el binario gestionado de Codex de OpenClaw con:

```bash
codex app-server --listen stdio://
```

El binario gestionado se declara como una dependencia de runtime de Plugin incluida y se prepara
con el resto de las dependencias del Plugin `codex`. Esto mantiene la versión del servidor de aplicaciones
ligada al Plugin incluido en lugar de a cualquier CLI de Codex separado que
esté instalado localmente. Configura `appServer.command` solo cuando quieras
intencionadamente ejecutar un ejecutable diferente.

De forma predeterminada, OpenClaw inicia sesiones locales del harness de Codex en modo YOLO:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` y
`sandbox: "danger-full-access"`. Esta es la postura de operador local de confianza usada
para heartbeats autónomos: Codex puede usar herramientas de shell y red sin
detenerse en prompts de aprobación nativos que nadie está presente para responder.

Para optar por aprobaciones revisadas por guardian de Codex, configura `appServer.mode:
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

El modo Guardian usa la ruta de aprobación nativa de auto-revisión de Codex. Cuando Codex pide
salir del sandbox, escribir fuera del workspace o añadir permisos como acceso a la red,
Codex enruta esa solicitud de aprobación al revisor nativo en lugar de a un
prompt humano. El revisor aplica el marco de riesgo de Codex y aprueba o deniega
la solicitud específica. Usa Guardian cuando quieras más guardrails que en modo YOLO
pero sigas necesitando que agentes no supervisados progresen.

El preset `guardian` se expande a `approvalPolicy: "on-request"`,
`approvalsReviewer: "auto_review"` y `sandbox: "workspace-write"`.
Los campos de política individuales siguen sobrescribiendo `mode`, así que los despliegues avanzados pueden mezclar
el preset con elecciones explícitas. El valor de revisor anterior `guardian_subagent`
se sigue aceptando como alias de compatibilidad, pero las configuraciones nuevas deberían usar
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

Los lanzamientos de servidor de aplicaciones por stdio heredan el entorno de proceso de OpenClaw de forma predeterminada,
pero OpenClaw posee el puente de cuenta del servidor de aplicaciones de Codex y configura tanto
`CODEX_HOME` como `HOME` a directorios por agente dentro del estado de OpenClaw de ese agente.
El propio cargador de Skills de Codex lee `$CODEX_HOME/skills` y
`$HOME/.agents/skills`, así que ambos valores quedan aislados para lanzamientos locales del servidor de aplicaciones.
Eso mantiene las Skills, plugins, configuración, cuentas y estado de hilo nativos de Codex
delimitados al agente de OpenClaw, en lugar de filtrarse desde el directorio personal
de la CLI de Codex del operador.

Los plugins de OpenClaw y las snapshots de Skills de OpenClaw siguen fluyendo por el
registro de plugins y el cargador de Skills propios de OpenClaw. Los activos personales de la CLI de Codex no lo hacen. Si tienes
Skills o plugins útiles de la CLI de Codex que deberían formar parte de un agente de OpenClaw,
inventaríalos explícitamente:

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

El proveedor de migración de Codex copia Skills en el workspace actual del agente de OpenClaw.
Los plugins, hooks y archivos de configuración nativos de Codex se informan o archivan
para revisión manual en lugar de activarse automáticamente, porque pueden
ejecutar comandos, exponer servidores MCP o portar credenciales.

La autenticación se selecciona en este orden:

1. Un perfil de autenticación explícito de Codex de OpenClaw para el agente.
2. La cuenta existente del servidor de aplicaciones en el home de Codex de ese agente.
3. Solo para lanzamientos locales de servidor de aplicaciones por stdio, `CODEX_API_KEY`, luego
   `OPENAI_API_KEY`, cuando no hay cuenta de servidor de aplicaciones presente y la autenticación de OpenAI
   sigue siendo necesaria.

Cuando OpenClaw detecta un perfil de autenticación de Codex de estilo suscripción de ChatGPT, elimina
`CODEX_API_KEY` y `OPENAI_API_KEY` del proceso hijo de Codex generado. Eso
mantiene las claves de API de nivel Gateway disponibles para embeddings o modelos directos de OpenAI
sin hacer que los turnos nativos del servidor de aplicaciones de Codex se facturen accidentalmente por la API.
Los perfiles explícitos de clave de API de Codex y el fallback de clave de entorno local por stdio usan inicio de sesión del servidor de aplicaciones
en lugar de env heredado del proceso hijo. Las conexiones WebSocket al servidor de aplicaciones
no reciben fallback de clave de API de env del Gateway; usa un perfil de autenticación explícito o la
propia cuenta del servidor de aplicaciones remoto.

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

`appServer.clearEnv` solo afecta al proceso hijo del servidor de aplicaciones de Codex generado.

Campos `appServer` compatibles:

| Campo               | Predeterminado                           | Significado                                                                                                                                                                                                                              |
| ------------------- | ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`         | `"stdio"`                                | `"stdio"` inicia Codex; `"websocket"` se conecta a `url`.                                                                                                                                                                                |
| `command`           | binario de Codex administrado            | Ejecutable para transporte stdio. Déjalo sin definir para usar el binario administrado; establécelo solo para una anulación explícita.                                                                                                   |
| `args`              | `["app-server", "--listen", "stdio://"]` | Argumentos para transporte stdio.                                                                                                                                                                                                        |
| `url`               | sin definir                              | URL del app-server de WebSocket.                                                                                                                                                                                                         |
| `authToken`         | sin definir                              | Token Bearer para transporte WebSocket.                                                                                                                                                                                                  |
| `headers`           | `{}`                                     | Encabezados WebSocket adicionales.                                                                                                                                                                                                       |
| `clearEnv`          | `[]`                                     | Nombres de variables de entorno adicionales eliminados del proceso app-server stdio iniciado después de que OpenClaw construye su entorno heredado. `CODEX_HOME` y `HOME` están reservados para el aislamiento Codex por agente de OpenClaw en lanzamientos locales. |
| `requestTimeoutMs`  | `60000`                                  | Tiempo de espera para llamadas del plano de control del app-server.                                                                                                                                                                      |
| `mode`              | `"yolo"`                                 | Preajuste para ejecución YOLO o revisada por guardian.                                                                                                                                                                                   |
| `approvalPolicy`    | `"never"`                                | Política de aprobación nativa de Codex enviada al iniciar/reanudar hilo/turno.                                                                                                                                                          |
| `sandbox`           | `"danger-full-access"`                   | Modo sandbox nativo de Codex enviado al iniciar/reanudar hilo.                                                                                                                                                                          |
| `approvalsReviewer` | `"user"`                                 | Usa `"auto_review"` para permitir que Codex revise las solicitudes de aprobación nativas. `guardian_subagent` sigue siendo un alias heredado.                                                                                            |
| `serviceTier`       | sin definir                              | Nivel de servicio opcional del app-server de Codex: `"fast"`, `"flex"` o `null`. Los valores heredados no válidos se ignoran.                                                                                                           |

Las llamadas dinámicas a herramientas propiedad de OpenClaw están limitadas de forma independiente de
`appServer.requestTimeoutMs`: cada solicitud `item/tool/call` de Codex debe recibir
una respuesta de OpenClaw en un plazo de 30 segundos. Al agotarse el tiempo de espera, OpenClaw aborta la señal de la herramienta
cuando es compatible y devuelve una respuesta fallida de herramienta dinámica a Codex para que
el turno pueda continuar en lugar de dejar la sesión en `processing`.

Después de que OpenClaw responde a una solicitud app-server con alcance de turno de Codex, el arnés
también espera que Codex finalice el turno nativo con `turn/completed`. Si el
app-server queda en silencio durante 60 segundos después de esa respuesta, OpenClaw interrumpe
el turno de Codex como mejor esfuerzo, registra un tiempo de espera de diagnóstico y libera el
carril de sesión de OpenClaw para que los mensajes de chat de seguimiento no queden en cola detrás de un
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
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` para pruebas locales puntuales. La configuración es
preferible para despliegues repetibles porque mantiene el comportamiento del plugin en el
mismo archivo revisado que el resto de la configuración del arnés de Codex.

## Uso de computadora

El Uso de computadora se cubre en su propia guía de configuración:
[Uso de computadora de Codex](/es/plugins/codex-computer-use).

La versión breve: OpenClaw no incorpora la app de control de escritorio ni ejecuta
acciones de escritorio por sí mismo. Prepara el app-server de Codex, verifica que el servidor MCP
`computer-use` esté disponible y luego permite que Codex maneje las llamadas nativas a herramientas
MCP durante los turnos en modo Codex.

Para acceso directo al controlador TryCua fuera del flujo del marketplace de Codex, registra
`cua-driver mcp` con `openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'`.
Consulta [Uso de computadora de Codex](/es/plugins/codex-computer-use) para ver la distinción
entre el Uso de computadora propiedad de Codex y el registro MCP directo.

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

El Uso de computadora es específico de macOS y puede requerir permisos locales del SO antes de que el
servidor MCP de Codex pueda controlar apps. Si `computerUse.enabled` es true y el servidor MCP
no está disponible, los turnos en modo Codex fallan antes de que se inicie el hilo en lugar de
ejecutarse silenciosamente sin las herramientas nativas de Uso de computadora. Consulta
[Uso de computadora de Codex](/es/plugins/codex-computer-use) para ver opciones de marketplace,
límites del catálogo remoto, motivos de estado y solución de problemas.

Cuando `computerUse.autoInstall` es true, OpenClaw puede registrar el marketplace estándar
incluido de Codex Desktop desde
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` si Codex
aún no ha descubierto un marketplace local. Usa `/new` o `/reset` después de
cambiar la configuración de runtime o de Uso de computadora para que las sesiones existentes no conserven una vinculación antigua
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

El cambio de modelo sigue controlado por OpenClaw. Cuando una sesión de OpenClaw está adjunta
a un hilo existente de Codex, el siguiente turno vuelve a enviar al app-server
el modelo de OpenAI, proveedor, política de aprobación, sandbox y nivel de servicio
seleccionados actualmente. Cambiar de `openai/gpt-5.5` a `openai/gpt-5.2` conserva la
vinculación del hilo, pero pide a Codex que continúe con el modelo recién seleccionado.

## Comando Codex

El plugin incluido registra `/codex` como un comando de barra autorizado. Es
genérico y funciona en cualquier canal que admita comandos de texto de OpenClaw.

Formas comunes:

- `/codex status` muestra conectividad en vivo del app-server, modelos, cuenta, límites de tasa, servidores MCP y Skills.
- `/codex models` lista los modelos en vivo del app-server de Codex.
- `/codex threads [filter]` lista hilos recientes de Codex.
- `/codex resume <thread-id>` adjunta la sesión actual de OpenClaw a un hilo existente de Codex.
- `/codex compact` pide al app-server de Codex que compacte el hilo adjunto.
- `/codex review` inicia la revisión nativa de Codex para el hilo adjunto.
- `/codex diagnostics [note]` pregunta antes de enviar comentarios de diagnóstico de Codex para el hilo adjunto.
- `/codex computer-use status` comprueba el plugin de Uso de computadora configurado y el servidor MCP.
- `/codex computer-use install` instala el plugin de Uso de computadora configurado y recarga los servidores MCP.
- `/codex account` muestra el estado de la cuenta y de los límites de tasa.
- `/codex mcp` lista el estado de servidores MCP del app-server de Codex.
- `/codex skills` lista las Skills del app-server de Codex.

### Flujo de depuración común

Cuando un agente respaldado por Codex hace algo inesperado en Telegram, Discord, Slack
u otro canal, empieza con la conversación donde ocurrió el problema:

1. Ejecuta `/diagnostics bad tool choice after image upload` u otra nota breve
   que describa lo que viste.
2. Aprueba la solicitud de diagnóstico una vez. La aprobación crea el zip local de diagnósticos del Gateway
   y, como la sesión usa el arnés de Codex, también
   envía el paquete de comentarios relevante de Codex a los servidores de OpenAI.
3. Copia la respuesta de diagnósticos completada en el informe de error o hilo de soporte.
   Incluye la ruta del paquete local, resumen de privacidad, ids de sesión de OpenClaw,
   ids de hilo de Codex y una línea `Inspect locally` para cada hilo de Codex.
4. Si quieres depurar la ejecución tú mismo, ejecuta el comando `Inspect locally`
   impreso en una terminal. Se ve como `codex resume <thread-id>` y abre el
   hilo nativo de Codex para que puedas inspeccionar la conversación, continuarla localmente
   o preguntar a Codex por qué eligió una herramienta o plan determinado.

Usa `/codex diagnostics [note]` solo cuando quieras específicamente la carga de comentarios de Codex para el hilo adjunto actualmente sin el paquete completo de diagnósticos del Gateway de OpenClaw. Para la mayoría de los informes de soporte, `/diagnostics [note]` es el mejor punto de partida porque vincula el estado local del Gateway y los id. de hilo de Codex en una sola respuesta. Consulta [Exportación de diagnósticos](/es/gateway/diagnostics) para ver el modelo completo de privacidad y el comportamiento en chats grupales.

El núcleo de OpenClaw también expone `/diagnostics [note]`, solo para propietarios, como el comando general de diagnósticos del Gateway. Su solicitud de aprobación muestra el preámbulo de datos confidenciales, enlaza a [Exportación de diagnósticos](/es/gateway/diagnostics) y solicita `openclaw gateway diagnostics export --json` mediante aprobación explícita de ejecución cada vez. No apruebes diagnósticos con una regla de permitir todo. Tras la aprobación, OpenClaw envía un informe que se puede pegar con la ruta del paquete local y el resumen del manifiesto. Cuando la sesión activa de OpenClaw usa el arnés de Codex, esa misma aprobación también autoriza el envío de los paquetes de comentarios relevantes de Codex a los servidores de OpenAI. La solicitud de aprobación indica que se enviarán comentarios de Codex, pero no enumera los id. de sesión o de hilo de Codex antes de la aprobación.

Si `/diagnostics` lo invoca un propietario en un chat grupal, OpenClaw mantiene limpio el canal compartido: el grupo recibe solo un aviso breve, mientras que el preámbulo de diagnósticos, las solicitudes de aprobación y los id. de sesión/hilo de Codex se envían al propietario mediante la ruta privada de aprobación. Si no hay una ruta privada al propietario, OpenClaw rechaza la solicitud del grupo y pide al propietario que la ejecute desde un mensaje directo.

La carga aprobada de Codex llama a `feedback/upload` de Codex app-server y pide a app-server que incluya registros para cada hilo enumerado y los subhilos de Codex generados cuando estén disponibles. La carga pasa por la ruta normal de comentarios de Codex hacia los servidores de OpenAI; si los comentarios de Codex están deshabilitados en ese app-server, el comando devuelve el error de app-server. La respuesta de diagnósticos completada enumera los canales, los id. de sesión de OpenClaw, los id. de hilo de Codex y los comandos locales `codex resume <thread-id>` para los hilos que se enviaron. Si deniegas o ignoras la aprobación, OpenClaw no imprime esos id. de Codex. Esta carga no reemplaza la exportación local de diagnósticos del Gateway.

`/codex resume` escribe el mismo archivo auxiliar de vinculación que el arnés usa para los turnos normales. En el siguiente mensaje, OpenClaw reanuda ese hilo de Codex, pasa el modelo de OpenClaw seleccionado actualmente a app-server y mantiene habilitado el historial extendido.

### Inspeccionar un hilo de Codex desde la CLI

La forma más rápida de entender una ejecución incorrecta de Codex suele ser abrir directamente el hilo nativo de Codex:

```sh
codex resume <thread-id>
```

Usa esto cuando notes un error en una conversación de canal y quieras inspeccionar la sesión problemática de Codex, continuarla localmente o preguntar a Codex por qué tomó una decisión concreta de herramienta o razonamiento. La ruta más sencilla suele ser ejecutar primero `/diagnostics [note]`: después de aprobarlo, el informe completado enumera cada hilo de Codex e imprime un comando `Inspect locally`, por ejemplo `codex resume <thread-id>`. Puedes copiar ese comando directamente en una terminal.

También puedes obtener un id. de hilo desde `/codex binding` para el chat actual o `/codex threads [filter]` para hilos recientes de Codex app-server, y luego ejecutar el mismo comando `codex resume` en tu shell.

La superficie de comandos requiere Codex app-server `0.125.0` o posterior. Los métodos de control individuales se informan como `unsupported by this Codex app-server` si un app-server futuro o personalizado no expone ese método JSON-RPC.

## Límites de hooks

El arnés de Codex tiene tres capas de hooks:

| Capa                                  | Propietario              | Propósito                                                           |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| Hooks de plugins de OpenClaw          | OpenClaw                 | Compatibilidad de producto/plugin entre arneses de PI y Codex.      |
| Middleware de extensión de Codex app-server | Plugins empaquetados de OpenClaw | Comportamiento de adaptador por turno alrededor de herramientas dinámicas de OpenClaw. |
| Hooks nativos de Codex                | Codex                    | Ciclo de vida de bajo nivel de Codex y política de herramientas nativas desde la configuración de Codex. |

OpenClaw no usa archivos `hooks.json` de proyecto o globales de Codex para enrutar el comportamiento de plugins de OpenClaw. Para el puente admitido de permisos y herramientas nativas, OpenClaw inyecta configuración de Codex por hilo para `PreToolUse`, `PostToolUse`, `PermissionRequest` y `Stop`. Otros hooks de Codex como `SessionStart` y `UserPromptSubmit` siguen siendo controles a nivel de Codex; no se exponen como hooks de plugins de OpenClaw en el contrato v1.

Para las herramientas dinámicas de OpenClaw, OpenClaw ejecuta la herramienta después de que Codex solicita la llamada, por lo que OpenClaw dispara el comportamiento de plugins y middleware que le pertenece en el adaptador del arnés. Para las herramientas nativas de Codex, Codex posee el registro canónico de la herramienta. OpenClaw puede reflejar eventos seleccionados, pero no puede reescribir el hilo nativo de Codex a menos que Codex exponga esa operación mediante app-server o callbacks de hooks nativos.

Las proyecciones de Compaction y ciclo de vida de LLM provienen de notificaciones de Codex app-server y del estado del adaptador de OpenClaw, no de comandos de hooks nativos de Codex. Los eventos `before_compaction`, `after_compaction`, `llm_input` y `llm_output` de OpenClaw son observaciones a nivel de adaptador, no capturas byte por byte de la solicitud interna de Codex ni de las cargas de Compaction.

Las notificaciones nativas `hook/started` y `hook/completed` de Codex app-server se proyectan como eventos de agente `codex_app_server.hook` para trayectoria y depuración. No invocan hooks de plugins de OpenClaw.

## Contrato de soporte v1

El modo Codex no es PI con una llamada a un modelo diferente por debajo. Codex posee una parte mayor del bucle nativo del modelo, y OpenClaw adapta sus superficies de plugins y sesión alrededor de ese límite.

Compatible con el runtime de Codex v1:

| Superficie                                    | Soporte                                 | Motivo                                                                                                                                                                                                |
| --------------------------------------------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Bucle de modelo de OpenAI a través de Codex   | Compatible                              | Codex app-server posee el turno de OpenAI, la reanudación del hilo nativo y la continuación de herramientas nativas.                                                                                  |
| Enrutamiento y entrega de canales de OpenClaw | Compatible                              | Telegram, Discord, Slack, WhatsApp, iMessage y otros canales permanecen fuera del runtime del modelo.                                                                                                  |
| Herramientas dinámicas de OpenClaw            | Compatible                              | Codex pide a OpenClaw que ejecute estas herramientas, por lo que OpenClaw permanece en la ruta de ejecución.                                                                                          |
| Plugins de prompt y contexto                  | Compatible                              | OpenClaw construye superposiciones de prompt y proyecta contexto en el turno de Codex antes de iniciar o reanudar el hilo.                                                                            |
| Ciclo de vida del motor de contexto           | Compatible                              | El ensamblaje, la ingesta o el mantenimiento posterior al turno y la coordinación de Compaction del motor de contexto se ejecutan para turnos de Codex.                                                |
| Hooks de herramientas dinámicas               | Compatible                              | `before_tool_call`, `after_tool_call` y el middleware de resultados de herramientas se ejecutan alrededor de herramientas dinámicas propiedad de OpenClaw.                                             |
| Hooks de ciclo de vida                        | Compatible como observaciones del adaptador | `llm_input`, `llm_output`, `agent_end`, `before_compaction` y `after_compaction` se disparan con cargas honestas del modo Codex.                                                                      |
| Puerta de revisión de respuesta final         | Compatible mediante el relay de hooks nativos | Codex `Stop` se retransmite a `before_agent_finalize`; `revise` pide a Codex una pasada más del modelo antes de la finalización.                                                                      |
| Bloqueo u observación de shell nativo, patch y MCP | Compatible mediante el relay de hooks nativos | Codex `PreToolUse` y `PostToolUse` se retransmiten para superficies de herramientas nativas confirmadas, incluidas cargas MCP en Codex app-server `0.125.0` o posterior. Se admite el bloqueo; la reescritura de argumentos no. |
| Política de permisos nativos                  | Compatible mediante el relay de hooks nativos | Codex `PermissionRequest` puede enrutarse a través de la política de OpenClaw cuando el runtime lo expone. Si OpenClaw no devuelve ninguna decisión, Codex continúa por su ruta normal de guardian o aprobación de usuario. |
| Captura de trayectoria de app-server          | Compatible                              | OpenClaw registra la solicitud que envió a app-server y las notificaciones de app-server que recibe.                                                                                                   |

No compatible con el runtime de Codex v1:

| Superficie                                          | Límite de V1                                                                                                                                     | Ruta futura                                                                               |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Mutación de argumentos de herramientas nativas      | Los hooks nativos previos a herramientas de Codex pueden bloquear, pero OpenClaw no reescribe argumentos de herramientas nativas de Codex.      | Requiere soporte de hooks/esquemas de Codex para entrada de herramienta de reemplazo.     |
| Historial editable de transcripción nativa de Codex | Codex posee el historial canónico del hilo nativo. OpenClaw posee un espejo y puede proyectar contexto futuro, pero no debería mutar componentes internos no admitidos. | Agregar API explícitas del servidor de aplicación de Codex si se necesita cirugía del hilo nativo. |
| `tool_result_persist` para registros de herramientas nativas de Codex | Ese hook transforma escrituras de transcripción propiedad de OpenClaw, no registros de herramientas nativas de Codex.                           | Podría reflejar registros transformados, pero la reescritura canónica necesita soporte de Codex. |
| Metadatos enriquecidos de Compaction nativa         | OpenClaw observa el inicio y la finalización de Compaction, pero no recibe una lista estable de conservados/descartados, delta de tokens ni carga útil de resumen. | Necesita eventos de Compaction de Codex más enriquecidos.                                 |
| Intervención de Compaction                          | Los hooks actuales de Compaction de OpenClaw están en nivel de notificación en modo Codex.                                                       | Agregar hooks previos/posteriores de Compaction de Codex si los plugins necesitan vetar o reescribir la Compaction nativa. |
| Captura byte por byte de solicitudes de API de modelo | OpenClaw puede capturar solicitudes y notificaciones del servidor de aplicación, pero el núcleo de Codex construye internamente la solicitud final de la API de OpenAI. | Necesita un evento de trazado de solicitud de modelo de Codex o una API de depuración.    |

## Herramientas, medios y Compaction

El arnés de Codex solo cambia el ejecutor de agente integrado de bajo nivel.

OpenClaw sigue construyendo la lista de herramientas y recibe resultados de herramientas dinámicas desde el
arnés. Texto, imágenes, video, música, TTS, aprobaciones y salida de herramientas de mensajería
continúan por la ruta normal de entrega de OpenClaw.

El relé de hooks nativos es intencionalmente genérico, pero el contrato de soporte v1 está
limitado a las rutas de herramientas y permisos nativas de Codex que OpenClaw prueba. En
el runtime de Codex, eso incluye cargas útiles de shell, parche y MCP `PreToolUse`,
`PostToolUse` y `PermissionRequest`. No asuma que cada evento futuro de hook de
Codex es una superficie de plugin de OpenClaw hasta que el contrato de runtime la nombre.

Para `PermissionRequest`, OpenClaw solo devuelve decisiones explícitas de permitir o denegar
cuando la política decide. Un resultado sin decisión no es una autorización. Codex lo trata como sin
decisión de hook y continúa hacia su propio guardián o ruta de aprobación del usuario.

Las solicitudes de aprobación de herramientas MCP de Codex se enrutan por el flujo de
aprobación de plugins de OpenClaw cuando Codex marca `_meta.codex_approval_kind` como
`"mcp_tool_call"`. Las solicitudes de Codex `request_user_input` se envían de vuelta al
chat de origen, y el siguiente mensaje de seguimiento en cola responde a esa solicitud del
servidor nativo en lugar de dirigirse como contexto adicional. Otras solicitudes de obtención
MCP siguen fallando de forma cerrada.

El direccionamiento de colas de ejecuciones activas se asigna a `turn/steer` del servidor de aplicación de Codex. Con el
valor predeterminado `messages.queue.mode: "steer"`, OpenClaw agrupa los mensajes de chat en cola
durante la ventana de silencio configurada y los envía como una solicitud `turn/steer` en
orden de llegada. El modo heredado `queue` envía solicitudes `turn/steer` separadas. Los turnos de
revisión de Codex y Compaction manual pueden rechazar el direccionamiento en el mismo turno, en cuyo caso
OpenClaw usa la cola de seguimiento cuando el modo seleccionado permite una alternativa. Consulte
[Cola de direccionamiento](/es/concepts/queue-steering).

Cuando el modelo seleccionado usa el arnés de Codex, la Compaction del hilo nativo se
delega al servidor de aplicación de Codex. OpenClaw mantiene un espejo de transcripción para el historial de canales,
búsqueda, `/new`, `/reset` y cambios futuros de modelo o arnés. El
espejo incluye el prompt del usuario, el texto final del asistente y registros ligeros de
razonamiento o plan de Codex cuando el servidor de aplicación los emite. Hoy, OpenClaw solo
registra señales de inicio y finalización de Compaction nativa. Todavía no expone un
resumen de Compaction legible para humanos ni una lista auditable de qué entradas conservó Codex
después de la Compaction.

Como Codex posee el hilo nativo canónico, `tool_result_persist` no
reescribe actualmente registros de resultados de herramientas nativas de Codex. Solo se aplica cuando
OpenClaw escribe un resultado de herramienta de transcripción de sesión propiedad de OpenClaw.

La generación de medios no requiere PI. La comprensión de imágenes, video, música, PDF, TTS y medios
sigue usando la configuración de proveedor/modelo correspondiente, como
`agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel` y
`messages.tts`.

## Solución de problemas

**Codex no aparece como un proveedor `/model` normal:** eso es lo esperado para
configuraciones nuevas. Seleccione un modelo `openai/gpt-*` con
`agentRuntime.id: "codex"` (o una referencia heredada `codex/*`), habilite
`plugins.entries.codex.enabled` y compruebe si `plugins.allow` excluye
`codex`.

**OpenClaw usa PI en lugar de Codex:** `agentRuntime.id: "auto"` todavía puede usar PI como
backend de compatibilidad cuando ningún arnés de Codex reclama la ejecución. Defina
`agentRuntime.id: "codex"` para forzar la selección de Codex durante las pruebas. Un
runtime de Codex forzado ahora falla en lugar de volver a PI salvo que
defina explícitamente `agentRuntime.fallback: "pi"`. Una vez que se selecciona el servidor de aplicación de Codex,
sus errores afloran directamente sin configuración adicional de alternativa.

**El servidor de aplicación se rechaza:** actualice Codex para que el protocolo de enlace del servidor de aplicación
informe la versión `0.125.0` o más reciente. Las versiones preliminares de la misma versión o con sufijo de compilación
como `0.125.0-alpha.2` o `0.125.0+custom` se rechazan porque el
mínimo de protocolo estable `0.125.0` es lo que OpenClaw prueba.

**El descubrimiento de modelos es lento:** reduzca `plugins.entries.codex.config.discovery.timeoutMs`
o desactive el descubrimiento.

**El transporte WebSocket falla de inmediato:** compruebe `appServer.url`, `authToken`,
y que el servidor de aplicación remoto hable la misma versión del protocolo de servidor de aplicación de Codex.

**Un modelo que no es de Codex usa PI:** eso es lo esperado salvo que haya forzado
`agentRuntime.id: "codex"` para ese agente o haya seleccionado una referencia heredada
`codex/*`. Las referencias simples `openai/gpt-*` y de otros proveedores permanecen en su ruta normal de
proveedor en modo `auto`. Si fuerza `agentRuntime.id: "codex"`, cada turno integrado
para ese agente debe ser un modelo de OpenAI compatible con Codex.

**Computer Use está instalado pero las herramientas no se ejecutan:** compruebe
`/codex computer-use status` desde una sesión nueva. Si una herramienta informa
`Native hook relay unavailable`, use `/new` o `/reset`; si persiste, reinicie
el gateway para limpiar registros obsoletos de hooks nativos. Si `computer-use.list_apps`
agota el tiempo de espera, reinicie Codex Computer Use o Codex Desktop y vuelva a intentarlo.

## Relacionado

- [Plugins de arnés de agente](/es/plugins/sdk-agent-harness)
- [Runtimes de agente](/es/concepts/agent-runtimes)
- [Proveedores de modelos](/es/concepts/model-providers)
- [Proveedor OpenAI](/es/providers/openai)
- [Estado](/es/cli/status)
- [Hooks de plugins](/es/plugins/hooks)
- [Referencia de configuración](/es/gateway/configuration-reference)
- [Pruebas](/es/help/testing-live#live-codex-app-server-harness-smoke)
