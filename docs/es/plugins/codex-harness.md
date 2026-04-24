---
read_when:
    - Quieres usar el arnés app-server integrado de Codex
    - Necesitas referencias de modelo de Codex y ejemplos de configuración
    - Quieres desactivar el respaldo de Pi para implementaciones solo con Codex
summary: Ejecuta turnos de agente integrados de OpenClaw a través del arnés app-server integrado de Codex
title: Arnés de Codex
x-i18n:
    generated_at: "2026-04-24T08:59:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: c02b1e6cbaaefee858db7ebd7e306261683278ed9375bca6fe74855ca84eabd8
    source_path: plugins/codex-harness.md
    workflow: 15
---

El Plugin integrado `codex` permite que OpenClaw ejecute turnos de agente integrados a través del
app-server de Codex en lugar del arnés integrado de Pi.

Úsalo cuando quieras que Codex controle la sesión del agente de bajo nivel: descubrimiento
de modelos, reanudación nativa de hilos, Compaction nativa y ejecución del app-server.
OpenClaw sigue controlando los canales de chat, archivos de sesión, selección de modelos, herramientas,
aprobaciones, entrega de medios y el espejo visible de la transcripción.

Los turnos nativos de Codex mantienen los hooks de Plugin de OpenClaw como la capa pública de compatibilidad.
Estos son hooks en proceso de OpenClaw, no hooks de comando `hooks.json` de Codex:

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `after_tool_call`
- `before_message_write` para registros reflejados de transcripción
- `agent_end`

Los Plugins integrados también pueden registrar una fábrica de extensiones del app-server de Codex para añadir
middleware asíncrono de `tool_result`. Ese middleware se ejecuta para herramientas dinámicas de OpenClaw
después de que OpenClaw ejecuta la herramienta y antes de que el resultado se devuelva a Codex. Es
independiente del hook público de Plugin `tool_result_persist`, que transforma las escrituras
de resultados de herramientas en transcripciones controladas por OpenClaw.

El arnés está desactivado de forma predeterminada. Las configuraciones nuevas deben mantener las referencias
de modelo OpenAI canónicas como `openai/gpt-*` y forzar explícitamente
`embeddedHarness.runtime: "codex"` o `OPENCLAW_AGENT_RUNTIME=codex` cuando
quieran ejecución nativa del app-server. Las referencias heredadas de modelo `codex/*` siguen seleccionando
automáticamente el arnés por compatibilidad.

## Elige el prefijo de modelo correcto

Las rutas de la familia OpenAI dependen del prefijo. Usa `openai-codex/*` cuando quieras
OAuth de Codex a través de Pi; usa `openai/*` cuando quieras acceso directo a la API de OpenAI o
cuando estés forzando el arnés nativo del app-server de Codex:

| Referencia de modelo                                  | Ruta de runtime                              | Usar cuando                                                               |
| ----------------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------- |
| `openai/gpt-5.4`                                      | Proveedor OpenAI a través del flujo OpenClaw/Pi | Quieres acceso directo actual a la API de OpenAI Platform con `OPENAI_API_KEY`. |
| `openai-codex/gpt-5.5`                                | OAuth de OpenAI Codex a través de OpenClaw/Pi | Quieres autenticación de suscripción de ChatGPT/Codex con el ejecutor Pi predeterminado. |
| `openai/gpt-5.5` + `embeddedHarness.runtime: "codex"` | Arnés del app-server de Codex                | Quieres ejecución nativa del app-server de Codex para el turno de agente integrado. |

Actualmente GPT-5.5 es solo de suscripción/OAuth en OpenClaw. Usa
`openai-codex/gpt-5.5` para OAuth de Pi, o `openai/gpt-5.5` con el arnés del
app-server de Codex. El acceso directo mediante clave API para `openai/gpt-5.5` será compatible
una vez que OpenAI habilite GPT-5.5 en la API pública.

Las referencias heredadas `codex/gpt-*` siguen aceptándose como alias de compatibilidad. Las nuevas configuraciones
de OAuth de Pi Codex deben usar `openai-codex/gpt-*`; las nuevas configuraciones de arnés nativo
de app-server deben usar `openai/gpt-*` más `embeddedHarness.runtime:
"codex"`.

`agents.defaults.imageModel` sigue la misma división por prefijo. Usa
`openai-codex/gpt-*` cuando el entendimiento de imágenes deba ejecutarse a través de la ruta del proveedor OAuth de OpenAI
Codex. Usa `codex/gpt-*` cuando el entendimiento de imágenes deba ejecutarse
a través de un turno delimitado del app-server de Codex. El modelo del app-server de Codex debe
anunciar compatibilidad con entrada de imagen; los modelos de Codex solo de texto fallan antes de que comience
el turno de medios.

Usa `/status` para confirmar el arnés efectivo de la sesión actual. Si la
selección es sorprendente, habilita el registro de depuración para el subsistema
`agents/harness` e inspecciona el registro estructurado `agent harness selected` del gateway. Este
incluye el id del arnés seleccionado, el motivo de selección, la política de runtime/respaldo y,
en modo `auto`, el resultado de compatibilidad de cada candidato de Plugin.

La selección del arnés no es un control en vivo de la sesión. Cuando se ejecuta un turno integrado,
OpenClaw registra el id del arnés seleccionado en esa sesión y sigue usándolo para
turnos posteriores en el mismo id de sesión. Cambia la configuración de `embeddedHarness` o
`OPENCLAW_AGENT_RUNTIME` cuando quieras que las sesiones futuras usen otro arnés;
usa `/new` o `/reset` para iniciar una sesión nueva antes de cambiar una conversación existente entre Pi y Codex. Esto evita reproducir una misma transcripción a través de
dos sistemas nativos de sesión incompatibles.

Las sesiones heredadas creadas antes de la fijación de arneses se tratan como fijadas a Pi una vez que
tienen historial de transcripción. Usa `/new` o `/reset` para incorporar esa conversación a
Codex después de cambiar la configuración.

`/status` muestra el arnés efectivo que no es Pi junto a `Fast`, por ejemplo
`Fast · codex`. El arnés Pi predeterminado sigue siendo `Runner: pi (embedded)` y no
añade una insignia de arnés independiente.

## Requisitos

- OpenClaw con el Plugin integrado `codex` disponible.
- App-server de Codex `0.118.0` o más reciente.
- Autenticación de Codex disponible para el proceso del app-server.

El Plugin bloquea handshakes del app-server más antiguos o sin versión. Esto mantiene
a OpenClaw en la superficie de protocolo con la que se ha probado.

Para pruebas smoke en vivo y con Docker, la autenticación suele venir de `OPENAI_API_KEY`, más
archivos opcionales del CLI de Codex como `~/.codex/auth.json` y
`~/.codex/config.toml`. Usa el mismo material de autenticación que utiliza tu app-server local de Codex.

## Configuración mínima

Usa `openai/gpt-5.5`, habilita el Plugin integrado y fuerza el arnés `codex`:

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
      embeddedHarness: {
        runtime: "codex",
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

Las configuraciones heredadas que establecen `agents.defaults.model` o un modelo de agente en
`codex/<model>` siguen habilitando automáticamente el Plugin integrado `codex`. Las configuraciones nuevas deben
preferir `openai/<model>` más la entrada explícita `embeddedHarness` anterior.

## Añadir Codex sin reemplazar otros modelos

Mantén `runtime: "auto"` cuando quieras que las referencias heredadas `codex/*` seleccionen Codex y
Pi para todo lo demás. Para configuraciones nuevas, prefiere `runtime: "codex"` explícito en
los agentes que deban usar el arnés.

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
      model: {
        primary: "openai/gpt-5.5",
        fallbacks: ["openai/gpt-5.5", "anthropic/claude-opus-4-6"],
      },
      models: {
        "openai/gpt-5.5": { alias: "gpt" },
        "anthropic/claude-opus-4-6": { alias: "opus" },
      },
      embeddedHarness: {
        runtime: "codex",
        fallback: "pi",
      },
    },
  },
}
```

Con esta forma:

- `/model gpt` o `/model openai/gpt-5.5` usa el arnés del app-server de Codex para esta configuración.
- `/model opus` usa la ruta del proveedor Anthropic.
- Si se selecciona un modelo que no es Codex, Pi sigue siendo el arnés de compatibilidad.

## Implementaciones solo con Codex

Desactiva el respaldo a Pi cuando necesites demostrar que cada turno de agente integrado usa
el arnés de Codex:

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      embeddedHarness: {
        runtime: "codex",
        fallback: "none",
      },
    },
  },
}
```

Sobrescritura mediante variable de entorno:

```bash
OPENCLAW_AGENT_RUNTIME=codex \
OPENCLAW_AGENT_HARNESS_FALLBACK=none \
openclaw gateway run
```

Con el respaldo desactivado, OpenClaw falla pronto si el Plugin de Codex está desactivado,
si el app-server es demasiado antiguo o si el app-server no puede iniciarse.

## Codex por agente

Puedes hacer que un agente sea solo Codex mientras el agente predeterminado mantiene la
selección automática normal:

```json5
{
  agents: {
    defaults: {
      embeddedHarness: {
        runtime: "auto",
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
        embeddedHarness: {
          runtime: "codex",
          fallback: "none",
        },
      },
    ],
  },
}
```

Usa los comandos normales de sesión para cambiar de agente y modelo. `/new` crea una sesión nueva
de OpenClaw y el arnés de Codex crea o reanuda su hilo sidecar del app-server
según sea necesario. `/reset` borra la vinculación de sesión de OpenClaw para ese hilo
y permite que el siguiente turno vuelva a resolver el arnés desde la configuración actual.

## Descubrimiento de modelos

De forma predeterminada, el Plugin de Codex consulta al app-server por los modelos disponibles. Si
el descubrimiento falla o agota el tiempo, usa un catálogo integrado de respaldo para:

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

Desactiva el descubrimiento cuando quieras que el arranque evite sondear Codex y se mantenga en el
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

## Conexión y política del app-server

De forma predeterminada, el Plugin inicia Codex localmente con:

```bash
codex app-server --listen stdio://
```

De forma predeterminada, OpenClaw inicia sesiones locales del arnés de Codex en modo YOLO:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` y
`sandbox: "danger-full-access"`. Esta es la postura de operador local confiable utilizada
para Heartbeat autónomos: Codex puede usar herramientas de shell y red sin
detenerse en prompts nativos de aprobación que nadie está presente para responder.

Para habilitar aprobaciones revisadas por guardian de Codex, establece `appServer.mode:
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

Guardian es un revisor nativo de aprobaciones de Codex. Cuando Codex pide salir del sandbox, escribir fuera del espacio de trabajo o añadir permisos como acceso a la red, Codex dirige esa solicitud de aprobación a un subagente revisor en lugar de un prompt humano. El revisor aplica el marco de riesgo de Codex y aprueba o deniega la solicitud específica. Usa Guardian cuando quieras más protecciones que el modo YOLO pero aún necesites que agentes no atendidos sigan avanzando.

El preset `guardian` se amplía a `approvalPolicy: "on-request"`, `approvalsReviewer: "guardian_subagent"` y `sandbox: "workspace-write"`. Los campos individuales de política siguen sobrescribiendo `mode`, por lo que las implementaciones avanzadas pueden mezclar el preset con elecciones explícitas.

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

Campos `appServer` compatibles:

| Campo               | Predeterminado                            | Significado                                                                                                 |
| ------------------- | ----------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `transport`         | `"stdio"`                                 | `"stdio"` inicia Codex; `"websocket"` se conecta a `url`.                                                  |
| `command`           | `"codex"`                                 | Ejecutable para transporte stdio.                                                                           |
| `args`              | `["app-server", "--listen", "stdio://"]`  | Argumentos para transporte stdio.                                                                           |
| `url`               | sin establecer                            | URL WebSocket del app-server.                                                                               |
| `authToken`         | sin establecer                            | Token Bearer para transporte WebSocket.                                                                     |
| `headers`           | `{}`                                      | Encabezados WebSocket adicionales.                                                                          |
| `requestTimeoutMs`  | `60000`                                   | Tiempo de espera para llamadas del plano de control del app-server.                                         |
| `mode`              | `"yolo"`                                  | Preajuste para ejecución YOLO o revisada por guardian.                                                      |
| `approvalPolicy`    | `"never"`                                 | Política nativa de aprobación de Codex enviada al inicio/reanudación/turno del hilo.                       |
| `sandbox`           | `"danger-full-access"`                    | Modo sandbox nativo de Codex enviado al inicio/reanudación del hilo.                                        |
| `approvalsReviewer` | `"user"`                                  | Usa `"guardian_subagent"` para que Codex Guardian revise prompts.                                           |
| `serviceTier`       | sin establecer                            | Nivel de servicio opcional del app-server de Codex: `"fast"`, `"flex"` o `null`. Los valores heredados no válidos se ignoran. |

Las variables de entorno anteriores siguen funcionando como respaldo para pruebas locales cuando
el campo de configuración correspondiente no está establecido:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` se eliminó. Usa
`plugins.entries.codex.config.appServer.mode: "guardian"` en su lugar, o
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` para pruebas locales puntuales. Se
prefiere la configuración para implementaciones repetibles porque mantiene el comportamiento del Plugin en el
mismo archivo revisado que el resto de la configuración del arnés de Codex.

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

Validación de arnés solo Codex, con respaldo a Pi desactivado:

```json5
{
  embeddedHarness: {
    fallback: "none",
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
            approvalsReviewer: "guardian_subagent",
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
a un hilo existente de Codex, el siguiente turno vuelve a enviar el
modelo OpenAI actualmente seleccionado, proveedor, política de aprobación, sandbox y nivel de servicio al
app-server. Cambiar de `openai/gpt-5.5` a `openai/gpt-5.2` mantiene la
vinculación del hilo, pero pide a Codex que continúe con el modelo recién seleccionado.

## Comando Codex

El Plugin integrado registra `/codex` como un comando de barra autorizado. Es
genérico y funciona en cualquier canal que admita comandos de texto de OpenClaw.

Formas comunes:

- `/codex status` muestra conectividad en vivo con el app-server, modelos, cuenta, límites de velocidad, servidores MCP y Skills.
- `/codex models` lista los modelos activos del app-server de Codex.
- `/codex threads [filter]` lista los hilos recientes de Codex.
- `/codex resume <thread-id>` adjunta la sesión actual de OpenClaw a un hilo existente de Codex.
- `/codex compact` pide al app-server de Codex que haga Compaction del hilo adjunto.
- `/codex review` inicia la revisión nativa de Codex para el hilo adjunto.
- `/codex account` muestra el estado de la cuenta y de los límites de velocidad.
- `/codex mcp` lista el estado del servidor MCP del app-server de Codex.
- `/codex skills` lista las Skills del app-server de Codex.

`/codex resume` escribe el mismo archivo de vinculación sidecar que usa el arnés para
turnos normales. En el siguiente mensaje, OpenClaw reanuda ese hilo de Codex, pasa el
modelo OpenClaw actualmente seleccionado al app-server y mantiene el historial extendido
habilitado.

La superficie de comandos requiere app-server de Codex `0.118.0` o más reciente. Los métodos individuales
de control se informan como `unsupported by this Codex app-server` si un
app-server futuro o personalizado no expone ese método JSON-RPC.

## Límites de hooks

El arnés de Codex tiene tres capas de hooks:

| Capa                                  | Propietario               | Propósito                                                           |
| ------------------------------------- | ------------------------- | ------------------------------------------------------------------- |
| Hooks de Plugin de OpenClaw           | OpenClaw                  | Compatibilidad de producto/Plugin entre los arneses Pi y Codex.     |
| Middleware de extensión del app-server de Codex | Plugins integrados de OpenClaw | Comportamiento del adaptador por turno alrededor de herramientas dinámicas de OpenClaw. |
| Hooks nativos de Codex                | Codex                     | Ciclo de vida de bajo nivel de Codex y política de herramientas nativas desde la configuración de Codex. |

OpenClaw no usa archivos `hooks.json` de Codex a nivel de proyecto o globales para enrutar
el comportamiento de Plugins de OpenClaw. Los hooks nativos de Codex son útiles para operaciones
controladas por Codex como política de shell, revisión nativa de resultados de herramientas, manejo de detención y
ciclo de vida nativo de Compaction/modelo, pero no son la API de Plugin de OpenClaw.

Para herramientas dinámicas de OpenClaw, OpenClaw ejecuta la herramienta después de que Codex solicita la
llamada, por lo que OpenClaw activa el comportamiento de Plugin y middleware que controla en el
adaptador del arnés. Para herramientas nativas de Codex, Codex controla el registro canónico de la herramienta.
OpenClaw puede reflejar eventos seleccionados, pero no puede reescribir el hilo nativo de Codex
a menos que Codex exponga esa operación a través del app-server o callbacks de hooks nativos.

Cuando versiones más recientes del app-server de Codex expongan eventos nativos de hooks de Compaction y ciclo de vida del modelo, OpenClaw deberá controlar por versión esa compatibilidad del protocolo y mapear los
eventos al contrato de hooks existente de OpenClaw cuando la semántica sea fiel.
Hasta entonces, los eventos `before_compaction`, `after_compaction`, `llm_input` y
`llm_output` de OpenClaw son observaciones a nivel de adaptador, no capturas byte por byte
de la solicitud interna de Codex o de las cargas de Compaction.

Las notificaciones nativas del app-server `hook/started` y `hook/completed` de Codex se
proyectan como eventos de agente `codex_app_server.hook` para trayectoria y depuración.
No invocan hooks de Plugin de OpenClaw.

## Herramientas, medios y Compaction

El arnés de Codex cambia solo el ejecutor integrado de agente de bajo nivel.

OpenClaw sigue construyendo la lista de herramientas y recibe resultados de herramientas dinámicas desde el
arnés. El texto, imágenes, video, música, TTS, aprobaciones y salida de herramientas de mensajería
siguen pasando por la ruta normal de entrega de OpenClaw.

Las solicitudes de aprobación de herramientas MCP de Codex se enrutan a través del flujo de aprobación de Plugin
de OpenClaw cuando Codex marca `_meta.codex_approval_kind` como
`"mcp_tool_call"`. Los prompts `request_user_input` de Codex se devuelven al chat
de origen, y el siguiente mensaje de seguimiento en cola responde a esa solicitud nativa del
servidor en lugar de dirigirse como contexto adicional. Otras solicitudes de MCP siguen fallando en cerrado.

Cuando el modelo seleccionado usa el arnés de Codex, la Compaction nativa del hilo se delega al
app-server de Codex. OpenClaw mantiene un espejo de la transcripción para historial del canal,
búsqueda, `/new`, `/reset` y futuros cambios de modelo o arnés. El
espejo incluye el prompt del usuario, el texto final del asistente y registros ligeros de razonamiento o plan de Codex cuando el app-server los emite. Hoy, OpenClaw solo registra señales de inicio y finalización de Compaction nativa. Aún no expone un
resumen legible para humanos de la Compaction ni una lista auditable de qué entradas conservó Codex después de la Compaction.

Debido a que Codex controla el hilo nativo canónico, `tool_result_persist` no
reescribe actualmente registros de resultados de herramientas nativas de Codex. Solo se aplica cuando
OpenClaw está escribiendo un resultado de herramienta en una transcripción de sesión controlada por OpenClaw.

La generación de medios no requiere Pi. La generación de imágenes, video, música, PDF, TTS y el
entendimiento de medios siguen usando la configuración correspondiente de proveedor/modelo como
`agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel` y
`messages.tts`.

## Solución de problemas

**Codex no aparece en `/model`:** habilita `plugins.entries.codex.enabled`,
selecciona un modelo `openai/gpt-*` con `embeddedHarness.runtime: "codex"` (o una
referencia heredada `codex/*`) y verifica si `plugins.allow` excluye `codex`.

**OpenClaw usa Pi en lugar de Codex:** si ningún arnés de Codex reclama la ejecución,
OpenClaw puede usar Pi como backend de compatibilidad. Establece
`embeddedHarness.runtime: "codex"` para forzar la selección de Codex durante las pruebas, o
`embeddedHarness.fallback: "none"` para fallar cuando no coincida ningún arnés de Plugin. Una vez
que se selecciona el app-server de Codex, sus fallos aparecen directamente sin configuración adicional
de respaldo.

**El app-server es rechazado:** actualiza Codex para que el handshake del app-server
informe la versión `0.118.0` o superior.

**El descubrimiento de modelos es lento:** reduce `plugins.entries.codex.config.discovery.timeoutMs`
o desactiva el descubrimiento.

**El transporte WebSocket falla inmediatamente:** revisa `appServer.url`, `authToken`
y que el app-server remoto hable la misma versión del protocolo del app-server de Codex.

**Un modelo que no es Codex usa Pi:** eso es lo esperado a menos que hayas forzado
`embeddedHarness.runtime: "codex"` (o seleccionado una referencia heredada `codex/*`). Las referencias
normales `openai/gpt-*` y de otros proveedores permanecen en su ruta normal del proveedor.

## Relacionado

- [Plugins de arnés de agente](/es/plugins/sdk-agent-harness)
- [Proveedores de modelos](/es/concepts/model-providers)
- [Referencia de configuración](/es/gateway/configuration-reference)
- [Pruebas](/es/help/testing-live#live-codex-app-server-harness-smoke)
