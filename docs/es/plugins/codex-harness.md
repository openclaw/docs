---
read_when:
    - Quieres usar el arnés incluido del servidor de aplicaciones Codex
    - Necesitas ejemplos de configuración del arnés Codex
    - Quieres que los despliegues solo de Codex fallen en lugar de volver a PI
summary: Ejecuta turnos de agente integrados de OpenClaw mediante el arnés incluido del servidor de aplicaciones Codex
title: Arnés Codex
x-i18n:
    generated_at: "2026-04-26T11:33:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: bf54ee2eab64e611e50605e8fef24cc840b3246d0bddc18ae03730a05848e271
    source_path: plugins/codex-harness.md
    workflow: 15
---

El Plugin `codex` incluido permite que OpenClaw ejecute turnos de agente integrados mediante el
servidor de aplicaciones Codex en lugar del arnés PI integrado.

Úsalo cuando quieras que Codex posea la sesión de agente de bajo nivel: descubrimiento
de modelos, reanudación nativa de hilos, Compaction nativa y ejecución del servidor de aplicaciones.
OpenClaw sigue poseyendo los canales de chat, archivos de sesión, selección de modelos, herramientas,
aprobaciones, entrega de medios y el espejo visible de la transcripción.

Si estás intentando orientarte, empieza con
[Runtimes de agentes](/es/concepts/agent-runtimes). La versión corta es:
`openai/gpt-5.5` es la referencia del modelo, `codex` es el runtime, y Telegram,
Discord, Slack u otro canal siguen siendo la superficie de comunicación.

## Qué cambia este Plugin

El Plugin `codex` incluido aporta varias capacidades distintas:

| Capacidad                        | Cómo la usas                                       | Qué hace                                                                      |
| -------------------------------- | -------------------------------------------------- | ----------------------------------------------------------------------------- |
| Runtime integrado nativo         | `agentRuntime.id: "codex"`                         | Ejecuta turnos de agente integrados de OpenClaw mediante el servidor de aplicaciones Codex. |
| Comandos nativos de control de chat | `/codex bind`, `/codex resume`, `/codex steer`, ... | Vincula y controla hilos del servidor de aplicaciones Codex desde una conversación de mensajería. |
| Proveedor/catálogo del servidor de aplicaciones Codex | componentes internos de `codex`, expuestos mediante el arnés | Permite al runtime descubrir y validar modelos del servidor de aplicaciones. |
| Ruta de comprensión de medios de Codex | rutas de compatibilidad de modelo de imagen `codex/*` | Ejecuta turnos acotados del servidor de aplicaciones Codex para modelos compatibles de comprensión de imágenes. |
| Relay nativo de hooks            | Hooks de Plugin alrededor de eventos nativos de Codex | Permite que OpenClaw observe/bloquee eventos compatibles de herramientas/finalización nativas de Codex. |

Habilitar el plugin hace que esas capacidades estén disponibles. **No** hace lo siguiente:

- empezar a usar Codex para todos los modelos de OpenAI
- convertir referencias de modelo `openai-codex/*` en el runtime nativo
- hacer que ACP/acpx sea la ruta predeterminada de Codex
- cambiar en caliente sesiones existentes que ya registraron un runtime PI
- reemplazar la entrega de canal, los archivos de sesión, el almacenamiento de perfiles de autenticación o
  el enrutamiento de mensajes de OpenClaw

Ese mismo Plugin también posee la superficie nativa de comandos de control de chat `/codex`. Si
el plugin está habilitado y el usuario pide vincular, reanudar, guiar, detener o inspeccionar
hilos de Codex desde el chat, los agentes deben preferir `/codex ...` frente a ACP. ACP sigue
siendo la alternativa explícita cuando el usuario pide ACP/acpx o está probando el adaptador ACP
de Codex.

Los turnos nativos de Codex mantienen los hooks de Plugin de OpenClaw como capa pública de compatibilidad.
Estos son hooks de OpenClaw en proceso, no hooks de comandos `hooks.json` de Codex:

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `before_tool_call`, `after_tool_call`
- `before_message_write` para registros reflejados de transcripción
- `before_agent_finalize` mediante relay `Stop` de Codex
- `agent_end`

Los plugins también pueden registrar middleware neutral al runtime de resultados de herramientas para reescribir
resultados de herramientas dinámicas de OpenClaw después de que OpenClaw ejecute la herramienta y antes de que el
resultado se devuelva a Codex. Esto es independiente del hook público de Plugin
`tool_result_persist`, que transforma escrituras de resultados de herramientas en la transcripción propiedad de OpenClaw.

Para la semántica de los hooks de Plugin en sí, consulta [Hooks de Plugin](/es/plugins/hooks)
y [Comportamiento de guardas de Plugin](/es/tools/plugin).

El arnés está desactivado de forma predeterminada. Las configuraciones nuevas deben mantener las referencias de modelo OpenAI
canónicas como `openai/gpt-*` y forzar explícitamente
`agentRuntime.id: "codex"` o `OPENCLAW_AGENT_RUNTIME=codex` cuando
quieran ejecución nativa del servidor de aplicaciones. Las referencias heredadas `codex/*` siguen seleccionando automáticamente
el arnés por compatibilidad, pero los prefijos heredados de proveedor respaldados por runtime no se
muestran como opciones normales de modelo/proveedor.

Si el Plugin `codex` está habilitado, pero el modelo principal sigue siendo
`openai-codex/*`, `openclaw doctor` advierte en lugar de cambiar la ruta. Eso es
intencionado: `openai-codex/*` sigue siendo la ruta PI de OAuth/suscripción de Codex, y la
ejecución nativa del servidor de aplicaciones sigue siendo una elección explícita de runtime.

## Mapa de rutas

Usa esta tabla antes de cambiar la configuración:

| Comportamiento deseado                         | Referencia de modelo       | Configuración de runtime                 | Requisito de Plugin        | Etiqueta de estado esperada      |
| --------------------------------------------- | -------------------------- | ---------------------------------------- | -------------------------- | -------------------------------- |
| API de OpenAI a través del runner normal de OpenClaw | `openai/gpt-*`       | omitida o `runtime: "pi"`                | Proveedor OpenAI           | `Runtime: OpenClaw Pi Default`   |
| OAuth/suscripción de Codex a través de PI     | `openai-codex/gpt-*`       | omitida o `runtime: "pi"`                | Proveedor OAuth de OpenAI Codex | `Runtime: OpenClaw Pi Default` |
| Turnos integrados nativos del servidor de aplicaciones Codex | `openai/gpt-*` | `agentRuntime.id: "codex"`               | Plugin `codex`             | `Runtime: OpenAI Codex`          |
| Proveedores mixtos con modo auto conservador  | referencias específicas del proveedor | `agentRuntime.id: "auto"`    | Runtimes de Plugin opcionales | Depende del runtime seleccionado |
| Sesión explícita del adaptador ACP de Codex   | depende de prompt/modelo ACP | `sessions_spawn` con `runtime: "acp"` | backend `acpx` sano        | Estado de tarea/sesión ACP       |

La separación importante es proveedor frente a runtime:

- `openai-codex/*` responde a “¿qué ruta de proveedor/autenticación debe usar PI?”
- `agentRuntime.id: "codex"` responde a “¿qué bucle debe ejecutar este
  turno integrado?”
- `/codex ...` responde a “¿qué conversación nativa de Codex debe vincular o controlar
  este chat?”
- ACP responde a “¿qué proceso de arnés externo debe lanzar acpx?”

## Elegir el prefijo de modelo correcto

Las rutas de la familia OpenAI son específicas de prefijo. Usa `openai-codex/*` cuando quieras
OAuth de Codex a través de PI; usa `openai/*` cuando quieras acceso directo a la API de OpenAI o
cuando estés forzando el arnés nativo del servidor de aplicaciones Codex:

| Referencia de modelo                            | Ruta de runtime                               | Úsalo cuando                                                              |
| ----------------------------------------------- | --------------------------------------------- | ------------------------------------------------------------------------- |
| `openai/gpt-5.4`                                | Proveedor OpenAI mediante la canalización de OpenClaw/PI | Quieres acceso actual directo a la API de OpenAI Platform con `OPENAI_API_KEY`. |
| `openai-codex/gpt-5.5`                          | OAuth de OpenAI Codex mediante OpenClaw/PI    | Quieres autenticación por suscripción de ChatGPT/Codex con el runner PI predeterminado. |
| `openai/gpt-5.5` + `agentRuntime.id: "codex"`   | Arnés del servidor de aplicaciones Codex      | Quieres ejecución nativa del servidor de aplicaciones Codex para el turno de agente integrado. |

GPT-5.5 es actualmente solo suscripción/OAuth en OpenClaw. Usa
`openai-codex/gpt-5.5` para PI OAuth, o `openai/gpt-5.5` con el arnés del servidor de aplicaciones Codex.
El acceso directo por clave API a `openai/gpt-5.5` será compatible
una vez que OpenAI habilite GPT-5.5 en la API pública.

Las referencias heredadas `codex/gpt-*` siguen aceptándose como alias de compatibilidad. La
migración de compatibilidad de Doctor reescribe referencias primarias heredadas de runtime a referencias canónicas de modelo
y registra por separado la política de runtime, mientras que las referencias heredadas solo de fallback se dejan sin cambios porque el runtime se configura para todo el contenedor del agente.
Las nuevas configuraciones de PI Codex OAuth deben usar `openai-codex/gpt-*`; las nuevas configuraciones
del arnés nativo del servidor de aplicaciones deben usar `openai/gpt-*` más
`agentRuntime.id: "codex"`.

`agents.defaults.imageModel` sigue la misma separación por prefijo. Usa
`openai-codex/gpt-*` cuando la comprensión de imágenes deba ejecutarse mediante la ruta del proveedor OAuth de OpenAI
Codex. Usa `codex/gpt-*` cuando la comprensión de imágenes deba ejecutarse
mediante un turno acotado del servidor de aplicaciones Codex. El modelo del servidor de aplicaciones Codex debe
anunciar compatibilidad con entrada de imágenes; los modelos de texto puro de Codex fallan antes de que empiece el turno de medios.

Usa `/status` para confirmar el arnés efectivo de la sesión actual. Si la
selección resulta sorprendente, habilita logging de depuración para el subsistema
`agents/harness` e inspecciona el registro estructurado `agent harness selected` del gateway. Este
incluye el id del arnés seleccionado, motivo de selección, política de runtime/fallback y,
en modo `auto`, el resultado de compatibilidad de cada candidato de plugin.

### Qué significan las advertencias de doctor

`openclaw doctor` advierte cuando se cumplen todas estas condiciones:

- el Plugin `codex` incluido está habilitado o permitido
- el modelo principal de un agente es `openai-codex/*`
- el runtime efectivo de ese agente no es `codex`

Esa advertencia existe porque los usuarios suelen esperar que “Plugin Codex habilitado” implique
“runtime nativo del servidor de aplicaciones Codex”. OpenClaw no hace ese salto. La advertencia
significa:

- **No hace falta cambiar nada** si querías OAuth de ChatGPT/Codex a través de PI.
- Cambia el modelo a `openai/<model>` y configura
  `agentRuntime.id: "codex"` si querías ejecución nativa del servidor de aplicaciones.
- Las sesiones existentes siguen necesitando `/new` o `/reset` después de un cambio de runtime,
  porque las fijaciones de runtime de sesión son persistentes.

La selección del arnés no es un control en vivo de la sesión. Cuando se ejecuta un turno integrado,
OpenClaw registra el id del arnés seleccionado en esa sesión y sigue usándolo para
turnos posteriores en el mismo id de sesión. Cambia la configuración `agentRuntime` o
`OPENCLAW_AGENT_RUNTIME` cuando quieras que sesiones futuras usen otro arnés;
usa `/new` o `/reset` para iniciar una sesión nueva antes de cambiar una conversación existente entre PI y Codex. Esto evita reproducir una transcripción
a través de dos sistemas incompatibles de sesión nativa.

Las sesiones heredadas creadas antes de las fijaciones de arnés se tratan como fijadas a PI una vez que
tienen historial de transcripción. Usa `/new` o `/reset` para optar por Codex en esa conversación después de cambiar la configuración.

`/status` muestra el runtime efectivo del modelo. El arnés PI predeterminado aparece como
`Runtime: OpenClaw Pi Default`, y el arnés del servidor de aplicaciones Codex aparece como
`Runtime: OpenAI Codex`.

## Requisitos

- OpenClaw con el Plugin `codex` incluido disponible.
- Servidor de aplicaciones Codex `0.125.0` o posterior. El Plugin incluido gestiona por defecto un
  binario compatible del servidor de aplicaciones Codex, así que los comandos locales `codex` en `PATH`
  no afectan al arranque normal del arnés.
- Autenticación de Codex disponible para el proceso del servidor de aplicaciones.

El plugin bloquea handshakes del servidor de aplicaciones antiguos o sin versión. Eso mantiene
OpenClaw en la superficie de protocolo con la que se ha probado.

Para pruebas smoke en vivo y con Docker, la autenticación suele venir de `OPENAI_API_KEY`, además de
archivos opcionales de Codex CLI como `~/.codex/auth.json` y
`~/.codex/config.toml`. Usa el mismo material de autenticación que use tu servidor de aplicaciones Codex local.

## Configuración mínima

Usa `openai/gpt-5.5`, habilita el Plugin incluido y fuerza el arnés `codex`:

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

Las configuraciones heredadas que establecen `agents.defaults.model` o un modelo de agente como
`codex/<model>` siguen habilitando automáticamente el Plugin `codex` incluido. Las configuraciones nuevas deben
preferir `openai/<model>` más la entrada explícita `agentRuntime` anterior.

## Añadir Codex junto a otros modelos

No configures `agentRuntime.id: "codex"` globalmente si el mismo agente debe poder cambiar libremente
entre Codex y modelos de otros proveedores. Un runtime forzado se aplica a todos los
turnos integrados de ese agente o sesión. Si seleccionas un modelo de Anthropic mientras
ese runtime está forzado, OpenClaw sigue intentando el arnés Codex y falla en modo cerrado
en lugar de enrutar silenciosamente ese turno mediante PI.

Usa una de estas formas en su lugar:

- Pon Codex en un agente dedicado con `agentRuntime.id: "codex"`.
- Mantén el agente predeterminado en `agentRuntime.id: "auto"` con fallback a PI para un uso normal mixto
  de proveedores.
- Usa referencias heredadas `codex/*` solo por compatibilidad. Las configuraciones nuevas deben preferir
  `openai/*` más una política explícita de runtime de Codex.

Por ejemplo, esto mantiene el agente predeterminado con selección automática normal y
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
- El agente `codex` usa el arnés del servidor de aplicaciones Codex.
- Si falta Codex o no es compatible para el agente `codex`, el turno falla
  en lugar de usar PI silenciosamente.

## Enrutamiento de comandos de agente

Los agentes deben enrutar las solicitudes del usuario por intención, no solo por la palabra "Codex":

| El usuario pide...                                      | El agente debe usar...                           |
| ------------------------------------------------------- | ------------------------------------------------ |
| "Vincula este chat a Codex"                             | `/codex bind`                                    |
| "Reanuda aquí el hilo de Codex `<id>`"                  | `/codex resume <id>`                             |
| "Muestra los hilos de Codex"                            | `/codex threads`                                 |
| "Usa Codex como runtime para este agente"               | cambio de configuración en `agentRuntime.id`     |
| "Usa mi suscripción de ChatGPT/Codex con OpenClaw normal" | referencias de modelo `openai-codex/*`         |
| "Ejecuta Codex mediante ACP/acpx"                       | ACP `sessions_spawn({ runtime: "acp", ... })`    |
| "Inicia Claude Code/Gemini/OpenCode/Cursor en un hilo"  | ACP/acpx, no `/codex` ni subagentes nativos      |

OpenClaw solo anuncia orientación de generación ACP a los agentes cuando ACP está habilitado,
es enrutable y está respaldado por un backend de runtime cargado. Si ACP no está disponible,
el prompt del sistema y las Skills del plugin no deben enseñar al agente acerca del enrutamiento
ACP.

## Despliegues solo de Codex

Fuerza el arnés Codex cuando necesites demostrar que cada turno de agente integrado
usa Codex. Los runtimes de Plugin explícitos usan por defecto que no haya fallback a PI, así que
`fallback: "none"` es opcional, pero a menudo útil como documentación:

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

Con Codex forzado, OpenClaw falla pronto si el Plugin Codex está deshabilitado, el
servidor de aplicaciones es demasiado antiguo o el servidor de aplicaciones no puede iniciarse. Configura
`OPENCLAW_AGENT_HARNESS_FALLBACK=pi` solo si intencionadamente quieres que PI gestione
la ausencia de selección de arnés.

## Codex por agente

Puedes hacer que un agente sea solo de Codex mientras el agente predeterminado mantiene la
autoselección normal:

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

Usa comandos normales de sesión para cambiar de agente y modelo. `/new` crea una
sesión nueva de OpenClaw y el arnés Codex crea o reanuda su hilo lateral del servidor de aplicaciones
según sea necesario. `/reset` borra el binding de sesión de OpenClaw para ese hilo
y permite que el siguiente turno vuelva a resolver el arnés a partir de la configuración actual.

## Descubrimiento de modelos

De forma predeterminada, el Plugin Codex pregunta al servidor de aplicaciones por los modelos disponibles. Si
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

Desactiva el descubrimiento cuando quieras que el arranque evite sondear Codex y se limite al
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

## Conexión y política del servidor de aplicaciones

De forma predeterminada, el plugin inicia localmente el binario administrado de Codex de OpenClaw con:

```bash
codex app-server --listen stdio://
```

El binario administrado se declara como dependencia de runtime del Plugin incluida y se prepara
con el resto de dependencias del Plugin `codex`. Esto mantiene la versión del servidor de aplicaciones
vinculada al Plugin incluido en lugar de a cualquier Codex CLI independiente
instalado localmente. Configura `appServer.command` solo cuando
intencionadamente quieras ejecutar un ejecutable distinto.

De forma predeterminada, OpenClaw inicia sesiones locales del arnés Codex en modo YOLO:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` y
`sandbox: "danger-full-access"`. Esta es la postura local de operador de confianza usada
para Heartbeat autónomos: Codex puede usar herramientas de shell y red sin
detenerse en prompts nativos de aprobación cuando no hay nadie disponible para responder.

Para activar aprobaciones revisadas por guardian de Codex, configura `appServer.mode:
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
salir del sandbox, escribir fuera del espacio de trabajo o añadir permisos como acceso a red,
Codex enruta esa solicitud de aprobación al revisor nativo en lugar de a un
prompt humano. El revisor aplica el marco de riesgo de Codex y aprueba o deniega
la solicitud concreta. Usa Guardian cuando quieras más barreras que en modo YOLO,
pero sigas necesitando que los agentes no atendidos progresen.

El preset `guardian` se expande a `approvalPolicy: "on-request"`,
`approvalsReviewer: "auto_review"` y `sandbox: "workspace-write"`.
Los campos de política individuales siguen anulando `mode`, de modo que los despliegues avanzados pueden mezclar
el preset con opciones explícitas. El valor antiguo de revisor `guardian_subagent` se
sigue aceptando como alias de compatibilidad, pero las configuraciones nuevas deben usar
`auto_review`.

Para un servidor de aplicaciones ya en ejecución, usa transporte WebSocket:

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

Campos compatibles de `appServer`:

| Campo              | Predeterminado                             | Significado                                                                                                  |
| ------------------ | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| `transport`        | `"stdio"`                                  | `"stdio"` genera Codex; `"websocket"` se conecta a `url`.                                                    |
| `command`          | binario administrado de Codex              | Ejecutable para transporte stdio. Déjalo sin configurar para usar el binario administrado; configúralo solo como anulación explícita. |
| `args`             | `["app-server", "--listen", "stdio://"]`   | Argumentos para transporte stdio.                                                                            |
| `url`              | sin configurar                             | URL WebSocket del servidor de aplicaciones.                                                                  |
| `authToken`        | sin configurar                             | Token Bearer para transporte WebSocket.                                                                      |
| `headers`          | `{}`                                       | Encabezados WebSocket extra.                                                                                 |
| `requestTimeoutMs` | `60000`                                    | Tiempo de espera para llamadas del plano de control del servidor de aplicaciones.                            |
| `mode`             | `"yolo"`                                   | Preset para ejecución YOLO o revisada por guardian.                                                          |
| `approvalPolicy`   | `"never"`                                  | Política nativa de aprobación de Codex enviada al inicio/reanudación/turno del hilo.                        |
| `sandbox`          | `"danger-full-access"`                     | Modo sandbox nativo de Codex enviado al inicio/reanudación del hilo.                                         |
| `approvalsReviewer`| `"user"`                                   | Usa `"auto_review"` para dejar que Codex revise prompts nativos de aprobación. `guardian_subagent` sigue siendo un alias heredado. |
| `serviceTier`      | sin configurar                             | Nivel opcional de servicio del servidor de aplicaciones Codex: `"fast"`, `"flex"` o `null`. Se ignoran valores heredados no válidos. |

Siguen disponibles anulaciones por entorno para pruebas locales:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN` omite el binario administrado cuando
`appServer.command` no está configurado.

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` se eliminó. Usa
`plugins.entries.codex.config.appServer.mode: "guardian"` en su lugar, o
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` para pruebas locales puntuales. Se
prefiere la configuración para despliegues reproducibles porque mantiene el comportamiento del plugin en el
mismo archivo revisado que el resto de la configuración del arnés Codex.

## Recetas habituales

Codex local con el transporte stdio predeterminado:

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

Aprobaciones de Codex revisadas por Guardian:

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

El cambio de modelo sigue estando controlado por OpenClaw. Cuando una sesión de OpenClaw está vinculada
a un hilo existente de Codex, el siguiente turno vuelve a enviar al
servidor de aplicaciones el modelo OpenAI actualmente seleccionado, el proveedor, la política de aprobación, el
sandbox y el nivel de servicio. Cambiar de `openai/gpt-5.5` a `openai/gpt-5.2` mantiene la
vinculación del hilo, pero pide a Codex que continúe con el nuevo modelo seleccionado.

## Comando Codex

El Plugin incluido registra `/codex` como un slash command autorizado. Es
genérico y funciona en cualquier canal que admita comandos de texto de OpenClaw.

Formas habituales:

- `/codex status` muestra conectividad en vivo con el servidor de aplicaciones, modelos, cuenta, límites de velocidad, servidores MCP y Skills.
- `/codex models` enumera los modelos en vivo del servidor de aplicaciones Codex.
- `/codex threads [filter]` enumera hilos recientes de Codex.
- `/codex resume <thread-id>` vincula la sesión actual de OpenClaw a un hilo existente de Codex.
- `/codex compact` pide al servidor de aplicaciones Codex que haga compaction del hilo vinculado.
- `/codex review` inicia la revisión nativa de Codex para el hilo vinculado.
- `/codex account` muestra el estado de la cuenta y de los límites de velocidad.
- `/codex mcp` enumera el estado de los servidores MCP del servidor de aplicaciones Codex.
- `/codex skills` enumera las Skills del servidor de aplicaciones Codex.

`/codex resume` escribe el mismo archivo lateral de binding que usa el arnés para
los turnos normales. En el siguiente mensaje, OpenClaw reanuda ese hilo de Codex, pasa el
modelo de OpenClaw actualmente seleccionado al servidor de aplicaciones y mantiene habilitado
el historial ampliado.

La superficie de comandos requiere servidor de aplicaciones Codex `0.125.0` o posterior. Los métodos
de control individuales se informan como `unsupported by this Codex app-server` si un
servidor de aplicaciones futuro o personalizado no expone ese método JSON-RPC.

## Límites de hooks

El arnés Codex tiene tres capas de hooks:

| Capa                                  | Propietario               | Propósito                                                           |
| ------------------------------------- | ------------------------- | ------------------------------------------------------------------- |
| Hooks de Plugin de OpenClaw           | OpenClaw                  | Compatibilidad de producto/plugin entre los arneses PI y Codex.     |
| Middleware de extensión del servidor de aplicaciones Codex | Plugins incluidos de OpenClaw | Comportamiento del adaptador por turno alrededor de herramientas dinámicas de OpenClaw. |
| Hooks nativos de Codex                | Codex                     | Ciclo de vida de bajo nivel de Codex y política de herramientas nativas desde la configuración de Codex. |

OpenClaw no usa archivos `hooks.json` de proyecto o globales de Codex para enrutar
el comportamiento de Plugin de OpenClaw. Para el puente compatible de herramientas nativas y permisos,
OpenClaw inyecta configuración de Codex por hilo para `PreToolUse`, `PostToolUse`,
`PermissionRequest` y `Stop`. Otros hooks de Codex como `SessionStart` y
`UserPromptSubmit` siguen siendo controles de nivel Codex; no se exponen como
hooks de Plugin de OpenClaw en el contrato v1.

Para herramientas dinámicas de OpenClaw, OpenClaw ejecuta la herramienta después de que Codex pide la
llamada, por lo que OpenClaw activa el comportamiento de plugin y middleware que posee en el
adaptador del arnés. Para herramientas nativas de Codex, Codex posee el registro canónico de la herramienta.
OpenClaw puede reflejar eventos seleccionados, pero no puede reescribir el hilo nativo de Codex
a menos que Codex exponga esa operación a través del servidor de aplicaciones o callbacks de
hooks nativos.

Las proyecciones de Compaction y del ciclo de vida del LLM provienen de notificaciones del servidor de aplicaciones Codex
y del estado del adaptador de OpenClaw, no de comandos de hooks nativos de Codex.
Los eventos `before_compaction`, `after_compaction`, `llm_input` y
`llm_output` de OpenClaw son observaciones a nivel de adaptador, no capturas byte por byte
de la solicitud interna o la carga útil de compaction de Codex.

Las notificaciones nativas del servidor de aplicaciones Codex `hook/started` y `hook/completed` se
proyectan como eventos de agente `codex_app_server.hook` para trayectoria y depuración.
No invocan hooks de Plugin de OpenClaw.

## Contrato de compatibilidad v1

El modo Codex no es PI con una llamada a modelo diferente por debajo. Codex posee más del
bucle nativo del modelo, y OpenClaw adapta sus superficies de plugin y sesión
alrededor de ese límite.

Compatible en runtime v1 de Codex:

| Superficie                                    | Compatibilidad                           | Por qué                                                                                                                                                                                                    |
| --------------------------------------------- | ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Bucle de modelo OpenAI mediante Codex         | Compatible                               | El servidor de aplicaciones Codex posee el turno OpenAI, la reanudación nativa del hilo y la continuación nativa de herramientas.                                                                         |
| Enrutamiento y entrega de canales de OpenClaw | Compatible                               | Telegram, Discord, Slack, WhatsApp, iMessage y otros canales permanecen fuera del runtime del modelo.                                                                                                      |
| Herramientas dinámicas de OpenClaw            | Compatible                               | Codex pide a OpenClaw que ejecute estas herramientas, por lo que OpenClaw sigue en la ruta de ejecución.                                                                                                   |
| Plugins de prompt y contexto                  | Compatible                               | OpenClaw construye superposiciones de prompt y proyecta contexto en el turno de Codex antes de iniciar o reanudar el hilo.                                                                                |
| Ciclo de vida del motor de contexto           | Compatible                               | Se ejecutan ensamblado, ingestión o mantenimiento posterior al turno y coordinación de compaction del motor de contexto para turnos de Codex.                                                              |
| Hooks de herramientas dinámicas               | Compatible                               | `before_tool_call`, `after_tool_call` y middleware de resultados de herramientas se ejecutan alrededor de herramientas dinámicas propiedad de OpenClaw.                                                    |
| Hooks de ciclo de vida                        | Compatibles como observaciones del adaptador | `llm_input`, `llm_output`, `agent_end`, `before_compaction` y `after_compaction` se activan con cargas útiles honestas del modo Codex.                                                                 |
| Puerta de revisión de respuesta final         | Compatible mediante el relay nativo de hooks | `Stop` de Codex se retransmite a `before_agent_finalize`; `revise` pide a Codex una pasada más del modelo antes de finalizar.                                                                           |
| Bloquear u observar shell, patch y MCP nativos | Compatible mediante el relay nativo de hooks | `PreToolUse` y `PostToolUse` de Codex se retransmiten para superficies comprometidas de herramientas nativas, incluidas cargas útiles MCP en el servidor de aplicaciones Codex `0.125.0` o posterior. Se admite bloqueo; no, reescritura de argumentos. |
| Política nativa de permisos                   | Compatible mediante el relay nativo de hooks | `PermissionRequest` de Codex puede enrutarse mediante la política de OpenClaw donde el runtime lo expone. Si OpenClaw no devuelve decisión, Codex continúa por su ruta normal de aprobación guardian o de usuario. |
| Captura de trayectoria del servidor de aplicaciones | Compatible                           | OpenClaw registra la solicitud que envió al servidor de aplicaciones y las notificaciones que recibe de él.                                                                                               |

No compatible en runtime v1 de Codex:

| Superficie                                            | Límite v1                                                                                                                                      | Ruta futura                                                                                |
| ----------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Mutación nativa de argumentos de herramientas         | Los hooks nativos previos a herramienta de Codex pueden bloquear, pero OpenClaw no reescribe argumentos de herramientas nativas de Codex.     | Requiere compatibilidad de hook/esquema de Codex para reemplazo de entrada de herramienta. |
| Historial editable de transcripción nativa de Codex   | Codex posee el historial canónico nativo del hilo. OpenClaw posee un espejo y puede proyectar contexto futuro, pero no debe mutar componentes internos no compatibles. | Añadir APIs explícitas del servidor de aplicaciones Codex si se necesita cirugía de hilo nativa. |
| `tool_result_persist` para registros de herramientas nativas de Codex | Ese hook transforma escrituras de transcripción propiedad de OpenClaw, no registros de herramientas nativas de Codex. | Podría reflejar registros transformados, pero la reescritura canónica necesita compatibilidad de Codex. |
| Metadata rica de compaction nativa                    | OpenClaw observa el inicio y la finalización de la compaction, pero no recibe una lista estable de conservados/descartados, delta de tokens ni carga útil de resumen. | Necesita eventos de compaction de Codex más ricos. |
| Intervención en compaction                            | Los hooks actuales de compaction de OpenClaw son de nivel notificación en modo Codex.                                                         | Añadir hooks pre/post compaction de Codex si los plugins necesitan vetar o reescribir la compaction nativa. |
| Captura byte por byte de solicitudes de API del modelo | OpenClaw puede capturar solicitudes y notificaciones del servidor de aplicaciones, pero el núcleo de Codex construye internamente la solicitud final a la API de OpenAI. | Necesita un evento de trazado de solicitud de modelo de Codex o una API de depuración.    |

## Herramientas, medios y compaction

El arnés Codex solo cambia el ejecutor integrado de agente de bajo nivel.

OpenClaw sigue construyendo la lista de herramientas y recibiendo resultados de herramientas dinámicas desde el
arnés. Texto, imágenes, video, música, TTS, aprobaciones y salida de herramientas de mensajería
continúan por la ruta normal de entrega de OpenClaw.

El relay nativo de hooks es intencionadamente genérico, pero el contrato de compatibilidad v1 está
limitado a las rutas nativas de herramientas y permisos de Codex que OpenClaw prueba. En
el runtime Codex, eso incluye cargas útiles `PreToolUse`,
`PostToolUse` y `PermissionRequest` para shell, patch y MCP. No asumas que todo evento futuro
de hook de Codex es una superficie de Plugin de OpenClaw hasta que el contrato de runtime lo nombre.

Para `PermissionRequest`, OpenClaw solo devuelve decisiones explícitas de permitir o denegar
cuando la política decide. Un resultado sin decisión no es una autorización. Codex lo trata como ausencia de
decisión del hook y recurre a su propia ruta de aprobación guardian o de usuario.

Las solicitudes de aprobación de herramientas MCP de Codex se enrutan mediante el flujo de
aprobación de Plugin de OpenClaw cuando Codex marca `_meta.codex_approval_kind` como
`"mcp_tool_call"`. Los prompts `request_user_input` de Codex se devuelven al
chat de origen, y el siguiente mensaje de seguimiento en cola responde a esa solicitud nativa
del servidor en lugar de dirigirse como contexto adicional. Otras solicitudes de provocación MCP
siguen fallando en modo cerrado.

Cuando el modelo seleccionado usa el arnés Codex, la compaction nativa del hilo se
delega al servidor de aplicaciones Codex. OpenClaw mantiene un espejo de la transcripción para el
historial del canal, la búsqueda, `/new`, `/reset` y futuros cambios de modelo o arnés. El
espejo incluye el prompt del usuario, el texto final del asistente y registros ligeros
de razonamiento o plan de Codex cuando el servidor de aplicaciones los emite. Actualmente, OpenClaw solo
registra señales nativas de inicio y finalización de compaction. Aún no expone un
resumen legible por humanos de la compaction ni una lista auditable de qué entradas conservó
Codex después de la compaction.

Como Codex posee el hilo nativo canónico, `tool_result_persist` no
reescribe actualmente registros nativos de resultados de herramientas de Codex. Solo se aplica cuando
OpenClaw escribe un resultado de herramienta en una transcripción de sesión propiedad de OpenClaw.

La generación de medios no requiere PI. La generación de imágenes, video, música, PDF, TTS y la
comprensión de medios siguen usando la configuración coincidente de proveedor/modelo, como
`agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel` y
`messages.tts`.

## Resolución de problemas

**Codex no aparece como proveedor normal en `/model`:** eso es lo esperado en
configuraciones nuevas. Selecciona un modelo `openai/gpt-*` con
`agentRuntime.id: "codex"` (o una referencia heredada `codex/*`), habilita
`plugins.entries.codex.enabled` y comprueba si `plugins.allow` excluye
`codex`.

**OpenClaw usa PI en lugar de Codex:** `agentRuntime.id: "auto"` aún puede usar PI como
backend de compatibilidad cuando ningún arnés Codex reclama la ejecución. Configura
`agentRuntime.id: "codex"` para forzar la selección de Codex durante las pruebas. Un
runtime Codex forzado ahora falla en lugar de volver a PI a menos que
configures explícitamente `agentRuntime.fallback: "pi"`. Una vez que se
selecciona el servidor de aplicaciones Codex, sus fallos aparecen directamente sin configuración adicional de fallback.

**El servidor de aplicaciones es rechazado:** actualiza Codex para que el handshake del servidor de aplicaciones
informe la versión `0.125.0` o posterior. Las preversiones con la misma versión o versiones con sufijo de compilación
como `0.125.0-alpha.2` o `0.125.0+custom` se rechazan porque el umbral de protocolo estable
`0.125.0` es con lo que OpenClaw hace pruebas.

**El descubrimiento de modelos es lento:** reduce `plugins.entries.codex.config.discovery.timeoutMs`
o desactiva el descubrimiento.

**El transporte WebSocket falla inmediatamente:** comprueba `appServer.url`, `authToken`
y que el servidor de aplicaciones remoto hable la misma versión del protocolo del servidor de aplicaciones Codex.

**Un modelo que no es de Codex usa PI:** eso es lo esperado salvo que hayas forzado
`agentRuntime.id: "codex"` para ese agente o hayas seleccionado una referencia heredada
`codex/*`. Las referencias normales `openai/gpt-*` y de otros proveedores siguen su ruta normal
de proveedor en modo `auto`. Si fuerzas `agentRuntime.id: "codex"`, cada turno integrado
de ese agente debe ser un modelo OpenAI compatible con Codex.

## Relacionado

- [Plugins de arnés de agente](/es/plugins/sdk-agent-harness)
- [Runtimes de agentes](/es/concepts/agent-runtimes)
- [Proveedores de modelos](/es/concepts/model-providers)
- [Proveedor OpenAI](/es/providers/openai)
- [Estado](/es/cli/status)
- [Hooks de Plugin](/es/plugins/hooks)
- [Referencia de configuración](/es/gateway/configuration-reference)
- [Pruebas](/es/help/testing-live#live-codex-app-server-harness-smoke)
