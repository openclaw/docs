---
read_when:
    - Quieres usar el arnés incluido del servidor de aplicaciones Codex
    - Necesitas referencias de modelo Codex y ejemplos de configuración
    - Quieres desactivar la alternativa de PI para despliegues solo con Codex
summary: Ejecutar turnos del agente integrado de OpenClaw mediante el arnés incluido del servidor de aplicaciones Codex
title: Arnés de Codex
x-i18n:
    generated_at: "2026-04-24T05:39:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 095933d2c32df302c312c67fdc266d2f01b552dddb1607d6e4ecc4f3c3326acf
    source_path: plugins/codex-harness.md
    workflow: 15
---

El Plugin incluido `codex` permite que OpenClaw ejecute turnos de agente integrados a través del
servidor de aplicaciones Codex en lugar del arnés PI incorporado.

Úsalo cuando quieras que Codex sea el propietario de la sesión de agente de bajo nivel: descubrimiento de modelos,
reanudación nativa de hilos, Compaction nativa y ejecución del servidor de aplicaciones.
OpenClaw sigue siendo el propietario de los canales de chat, archivos de sesión, selección de modelos, herramientas,
aprobaciones, entrega de archivos multimedia y el espejo visible de la transcripción.

Los turnos nativos de Codex conservan los hooks de Plugins de OpenClaw como capa pública de compatibilidad.
Son hooks en proceso de OpenClaw, no hooks de comandos `hooks.json` de Codex:

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `after_tool_call`
- `before_message_write` para registros reflejados de transcripción
- `agent_end`

Los Plugins incluidos también pueden registrar una factoría de extensión del servidor de aplicaciones Codex para añadir
middleware asíncrono `tool_result`. Ese middleware se ejecuta para las herramientas dinámicas de OpenClaw
después de que OpenClaw ejecute la herramienta y antes de que el resultado se devuelva a Codex. Es
independiente del hook público de Plugin `tool_result_persist`, que transforma las escrituras de resultados de herramientas
de transcripción propiedad de OpenClaw.

El arnés está desactivado de forma predeterminada. Las nuevas configuraciones deberían mantener las referencias de modelo
de OpenAI en formato canónico `openai/gpt-*` y forzar explícitamente
`embeddedHarness.runtime: "codex"` o `OPENCLAW_AGENT_RUNTIME=codex` cuando
quieran ejecución nativa del servidor de aplicaciones. Las referencias heredadas `codex/*`
siguen seleccionando automáticamente el arnés por compatibilidad.

## Elegir el prefijo de modelo correcto

Las rutas de la familia OpenAI dependen del prefijo. Usa `openai-codex/*` cuando quieras
OAuth de Codex a través de PI; usa `openai/*` cuando quieras acceso directo a la API de OpenAI o
cuando estés forzando el arnés nativo del servidor de aplicaciones Codex:

| Referencia de modelo                                 | Ruta de runtime                                | Úsala cuando                                                              |
| ---------------------------------------------------- | ---------------------------------------------- | ------------------------------------------------------------------------- |
| `openai/gpt-5.4`                                     | Proveedor OpenAI mediante OpenClaw/PI plumbing | Quieres acceso actual directo a la API de OpenAI Platform con `OPENAI_API_KEY`. |
| `openai-codex/gpt-5.5`                               | OAuth de OpenAI Codex mediante OpenClaw/PI     | Quieres autenticación de suscripción ChatGPT/Codex con el runner PI predeterminado. |
| `openai/gpt-5.5` + `embeddedHarness.runtime: "codex"` | Arnés del servidor de aplicaciones Codex       | Quieres ejecución nativa del servidor de aplicaciones Codex para el turno de agente integrado. |

GPT-5.5 actualmente solo está disponible mediante suscripción/OAuth en OpenClaw. Usa
`openai-codex/gpt-5.5` para PI OAuth, o `openai/gpt-5.5` con el arnés del servidor de aplicaciones Codex. El acceso directo por clave de API para `openai/gpt-5.5` será compatible
cuando OpenAI habilite GPT-5.5 en la API pública.

Las referencias heredadas `codex/gpt-*` siguen aceptándose como alias de compatibilidad. Las nuevas configuraciones PI
de OAuth de Codex deberían usar `openai-codex/gpt-*`; las nuevas configuraciones del arnés nativo del servidor de aplicaciones
deberían usar `openai/gpt-*` más `embeddedHarness.runtime:
"codex"`.

`agents.defaults.imageModel` sigue la misma división por prefijo. Usa
`openai-codex/gpt-*` cuando la comprensión de imágenes deba ejecutarse a través de la ruta del proveedor
OAuth de OpenAI Codex. Usa `codex/gpt-*` cuando la comprensión de imágenes deba ejecutarse
mediante un turno acotado del servidor de aplicaciones Codex. El modelo del servidor de aplicaciones Codex debe
anunciar compatibilidad con entrada de imágenes; los modelos Codex solo de texto fallan antes de que empiece
el turno de archivos multimedia.

Usa `/status` para confirmar el arnés efectivo de la sesión actual. Si la
selección resulta sorprendente, habilita el registro de depuración para el subsistema `agents/harness`
e inspecciona el registro estructurado del gateway `agent harness selected`. Este
incluye el id del arnés seleccionado, el motivo de selección, la política de runtime/alternativa y,
en modo `auto`, el resultado de compatibilidad de cada candidato de Plugin.

La selección del arnés no es un control en vivo de la sesión. Cuando se ejecuta un turno integrado,
OpenClaw registra el id del arnés seleccionado en esa sesión y sigue usándolo para
turnos posteriores con el mismo id de sesión. Cambia la configuración `embeddedHarness` o
`OPENCLAW_AGENT_RUNTIME` cuando quieras que las sesiones futuras usen otro arnés;
usa `/new` o `/reset` para iniciar una sesión nueva antes de cambiar una conversación
existente entre PI y Codex. Esto evita reproducir una misma transcripción a través de
dos sistemas nativos de sesión incompatibles.

Las sesiones heredadas creadas antes de los anclajes de arnés se tratan como fijadas a PI una vez que
tienen historial de transcripción. Usa `/new` o `/reset` para hacer que esa conversación pase
a Codex después de cambiar la configuración.

`/status` muestra el arnés efectivo no PI junto a `Fast`, por ejemplo
`Fast · codex`. El arnés PI predeterminado sigue siendo `Runner: pi (embedded)` y no
añade un distintivo de arnés independiente.

## Requisitos

- OpenClaw con el Plugin incluido `codex` disponible.
- Servidor de aplicaciones Codex `0.118.0` o posterior.
- Autenticación de Codex disponible para el proceso del servidor de aplicaciones.

El Plugin bloquea handshakes del servidor de aplicaciones antiguos o sin versión. Eso mantiene
OpenClaw en la superficie de protocolo contra la que se ha probado.

Para pruebas de humo en vivo y en Docker, la autenticación suele proceder de `OPENAI_API_KEY`, más
archivos opcionales de Codex CLI como `~/.codex/auth.json` y
`~/.codex/config.toml`. Usa el mismo material de autenticación que usa tu servidor de aplicaciones Codex local.

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
      embeddedHarness: {
        runtime: "codex",
        fallback: "none",
      },
    },
  },
}
```

Si tu configuración usa `plugins.allow`, incluye también `codex` ahí:

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
`codex/<model>` siguen habilitando automáticamente el Plugin incluido `codex`. Las nuevas configuraciones deberían
preferir `openai/<model>` más la entrada explícita `embeddedHarness` de arriba.

## Añadir Codex sin reemplazar otros modelos

Mantén `runtime: "auto"` cuando quieras que las referencias heredadas `codex/*` seleccionen Codex y
PI para todo lo demás. Para configuraciones nuevas, prefiere `runtime: "codex"` explícito en
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

- `/model gpt` o `/model openai/gpt-5.5` usa el arnés del servidor de aplicaciones Codex en esta configuración.
- `/model opus` usa la ruta del proveedor Anthropic.
- Si se selecciona un modelo que no es Codex, PI sigue siendo el arnés de compatibilidad.

## Despliegues solo con Codex

Desactiva la alternativa de PI cuando necesites demostrar que cada turno de agente integrado usa
el arnés Codex:

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

Anulación por entorno:

```bash
OPENCLAW_AGENT_RUNTIME=codex \
OPENCLAW_AGENT_HARNESS_FALLBACK=none \
openclaw gateway run
```

Con la alternativa desactivada, OpenClaw falla de inmediato si el Plugin Codex está desactivado,
si el servidor de aplicaciones es demasiado antiguo o si el servidor de aplicaciones no puede iniciarse.

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

Usa los comandos normales de sesión para cambiar de agente y de modelo. `/new` crea una sesión nueva de
OpenClaw y el arnés Codex crea o reanuda su hilo lateral del servidor de aplicaciones
según sea necesario. `/reset` borra la vinculación de sesión de OpenClaw para ese hilo
y permite que el siguiente turno vuelva a resolver el arnés a partir de la configuración actual.

## Descubrimiento de modelos

De forma predeterminada, el Plugin Codex pregunta al servidor de aplicaciones por los modelos disponibles. Si
el descubrimiento falla o se agota el tiempo, usa un catálogo alternativo incluido para:

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

## Conexión del servidor de aplicaciones y política

De forma predeterminada, el Plugin inicia Codex localmente con:

```bash
codex app-server --listen stdio://
```

De forma predeterminada, OpenClaw inicia sesiones locales del arnés Codex en modo YOLO:
`approvalPolicy: "never"`, `approvalsReviewer: "user"`, y
`sandbox: "danger-full-access"`. Esta es la postura de operador local de confianza usada
para Heartbeat autónomos: Codex puede usar herramientas de shell y red sin
detenerse ante solicitudes nativas de aprobación que nadie está presente para responder.

Para activar las aprobaciones revisadas por Guardian de Codex, establece `appServer.mode:
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

Guardian es un revisor nativo de aprobaciones de Codex. Cuando Codex pide salir del sandbox, escribir fuera del espacio de trabajo o añadir permisos como acceso a red, Codex enruta esa solicitud de aprobación a un subagente revisor en lugar de a una solicitud humana. El revisor aplica el marco de riesgo de Codex y aprueba o deniega la solicitud específica. Usa Guardian cuando quieras más barreras que en el modo YOLO, pero aun así necesites que agentes desatendidos sigan progresando.

El preajuste `guardian` se expande a `approvalPolicy: "on-request"`, `approvalsReviewer: "guardian_subagent"`, y `sandbox: "workspace-write"`. Los campos de política individuales siguen anulando `mode`, por lo que los despliegues avanzados pueden mezclar el preajuste con elecciones explícitas.

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

| Campo                | Predeterminado                            | Significado                                                                                              |
| -------------------- | ----------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `transport`          | `"stdio"`                                 | `"stdio"` inicia Codex; `"websocket"` se conecta a `url`.                                               |
| `command`            | `"codex"`                                 | Ejecutable para transporte stdio.                                                                        |
| `args`               | `["app-server", "--listen", "stdio://"]`  | Argumentos para transporte stdio.                                                                        |
| `url`                | sin establecer                            | URL WebSocket del servidor de aplicaciones.                                                              |
| `authToken`          | sin establecer                            | Token Bearer para transporte WebSocket.                                                                  |
| `headers`            | `{}`                                      | Encabezados WebSocket adicionales.                                                                       |
| `requestTimeoutMs`   | `60000`                                   | Tiempo de espera para llamadas del plano de control del servidor de aplicaciones.                        |
| `mode`               | `"yolo"`                                  | Preajuste para ejecución YOLO o revisada por Guardian.                                                   |
| `approvalPolicy`     | `"never"`                                 | Política nativa de aprobación de Codex enviada al inicio/reanudación/turno del hilo.                    |
| `sandbox`            | `"danger-full-access"`                    | Modo sandbox nativo de Codex enviado al inicio/reanudación.                                              |
| `approvalsReviewer`  | `"user"`                                  | Usa `"guardian_subagent"` para que Codex Guardian revise las solicitudes.                                |
| `serviceTier`        | sin establecer                            | Nivel de servicio opcional del servidor de aplicaciones Codex: `"fast"`, `"flex"` o `null`. Los valores heredados no válidos se ignoran. |

Las variables de entorno antiguas siguen funcionando como alternativas para pruebas locales cuando
el campo correspondiente de configuración no está establecido:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` se eliminó. Usa
`plugins.entries.codex.config.appServer.mode: "guardian"` en su lugar, o
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` para pruebas locales puntuales. La configuración es
preferible para despliegues repetibles porque mantiene el comportamiento del Plugin en el
mismo archivo revisado que el resto de la configuración del arnés Codex.

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

Validación de arnés solo Codex, con alternativa PI desactivada:

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

El cambio de modelo sigue controlado por OpenClaw. Cuando una sesión de OpenClaw está asociada
a un hilo existente de Codex, el siguiente turno vuelve a enviar al
servidor de aplicaciones el modelo OpenAI seleccionado actualmente, el proveedor, la política de aprobación, el sandbox y el nivel de servicio.
Cambiar de `openai/gpt-5.5` a `openai/gpt-5.2` mantiene la
vinculación con el hilo, pero pide a Codex que continúe con el nuevo modelo seleccionado.

## Comando Codex

El Plugin incluido registra `/codex` como un comando de barra autorizado. Es
genérico y funciona en cualquier canal que admita comandos de texto de OpenClaw.

Formas comunes:

- `/codex status` muestra conectividad activa con el servidor de aplicaciones, modelos, cuenta, límites de velocidad, servidores MCP y Skills.
- `/codex models` lista los modelos activos del servidor de aplicaciones Codex.
- `/codex threads [filter]` lista los hilos recientes de Codex.
- `/codex resume <thread-id>` vincula la sesión actual de OpenClaw a un hilo existente de Codex.
- `/codex compact` pide al servidor de aplicaciones Codex que compacte el hilo vinculado.
- `/codex review` inicia la revisión nativa de Codex para el hilo vinculado.
- `/codex account` muestra el estado de la cuenta y de los límites de velocidad.
- `/codex mcp` lista el estado de los servidores MCP del servidor de aplicaciones Codex.
- `/codex skills` lista las Skills del servidor de aplicaciones Codex.

`/codex resume` escribe el mismo archivo lateral de vinculación que usa el arnés para
los turnos normales. En el siguiente mensaje, OpenClaw reanuda ese hilo de Codex, pasa el
modelo de OpenClaw seleccionado actualmente al servidor de aplicaciones y mantiene activado el historial
ampliado.

La superficie de comandos requiere un servidor de aplicaciones Codex `0.118.0` o posterior. Los métodos de control individuales se informan como `unsupported by this Codex app-server` si un
servidor de aplicaciones futuro o personalizado no expone ese método JSON-RPC.

## Límites de hooks

El arnés Codex tiene tres capas de hooks:

| Capa                                  | Propietario               | Propósito                                                           |
| ------------------------------------- | ------------------------- | ------------------------------------------------------------------- |
| Hooks de Plugins de OpenClaw          | OpenClaw                  | Compatibilidad de producto/plugin entre los arneses PI y Codex.     |
| Middleware de extensión del servidor de aplicaciones Codex | Plugins incluidos de OpenClaw | Comportamiento adaptador por turno en torno a herramientas dinámicas de OpenClaw. |
| Hooks nativos de Codex                | Codex                     | Ciclo de vida de bajo nivel de Codex y política nativa de herramientas desde la configuración de Codex. |

OpenClaw no usa archivos `hooks.json` de Codex de proyecto o globales para enrutar
el comportamiento de Plugins de OpenClaw. Los hooks nativos de Codex son útiles para operaciones
propiedad de Codex como política de shell, revisión nativa de resultados de herramientas, gestión de detención y ciclo de vida nativo de Compaction/modelo, pero no son la API de Plugins de OpenClaw.

Para herramientas dinámicas de OpenClaw, OpenClaw ejecuta la herramienta después de que Codex solicite la
llamada, por lo que OpenClaw activa el comportamiento de Plugin y middleware que posee en el
adaptador del arnés. Para herramientas nativas de Codex, Codex es el propietario del registro canónico de la herramienta.
OpenClaw puede reflejar eventos seleccionados, pero no puede reescribir el hilo nativo de Codex
a menos que Codex exponga esa operación a través del servidor de aplicaciones o de callbacks de hooks
nativos.

Cuando las versiones más recientes del servidor de aplicaciones Codex expongan eventos nativos de hooks de Compaction y ciclo de vida del modelo, OpenClaw debería proteger por versión esa compatibilidad de protocolo y asignar los
eventos al contrato de hooks existente de OpenClaw cuando la semántica sea honesta.
Hasta entonces, los eventos `before_compaction`, `after_compaction`, `llm_input` y
`llm_output` de OpenClaw son observaciones a nivel de adaptador, no capturas byte a byte
de la solicitud interna de Codex o de la carga útil de Compaction.

## Herramientas, archivos multimedia y Compaction

El arnés Codex cambia solo el ejecutor integrado de agente de bajo nivel.

OpenClaw sigue construyendo la lista de herramientas y recibe los resultados de herramientas dinámicas desde el
arnés. Texto, imágenes, vídeo, música, TTS, aprobaciones y la salida de herramientas de mensajería
siguen pasando por la ruta normal de entrega de OpenClaw.

Las solicitudes de aprobación de herramientas MCP de Codex se enrutan a través del flujo de
aprobación de Plugins de OpenClaw cuando Codex marca `_meta.codex_approval_kind` como
`"mcp_tool_call"`. Las solicitudes `request_user_input` de Codex se devuelven al
chat de origen, y el siguiente mensaje de seguimiento en cola responde a esa solicitud nativa
del servidor en lugar de dirigirse como contexto adicional. Otras solicitudes MCP siguen fallando con cierre seguro.

Cuando el modelo seleccionado usa el arnés Codex, la Compaction nativa del hilo se delega al
servidor de aplicaciones Codex. OpenClaw mantiene un espejo de la transcripción para el historial del canal,
la búsqueda, `/new`, `/reset` y futuros cambios de modelo o de arnés. El
espejo incluye el prompt del usuario, el texto final del asistente y registros ligeros de razonamiento o plan de Codex cuando el servidor de aplicaciones los emite. Hoy, OpenClaw solo registra señales nativas de inicio y finalización de Compaction. Todavía no expone un resumen legible para humanos de la Compaction ni una lista auditable de qué entradas conservó Codex después de compactar.

Como Codex es el propietario del hilo nativo canónico, `tool_result_persist` no
reescribe actualmente los registros de resultados de herramientas nativas de Codex. Solo se aplica cuando
OpenClaw está escribiendo un resultado de herramienta en una transcripción de sesión propiedad de OpenClaw.

La generación de archivos multimedia no requiere PI. La generación de imágenes, vídeo, música, PDF, TTS y la
comprensión de archivos multimedia siguen usando la configuración correspondiente de proveedor/modelo, como
`agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel` y
`messages.tts`.

## Solución de problemas

**Codex no aparece en `/model`:** habilita `plugins.entries.codex.enabled`,
selecciona un modelo `openai/gpt-*` con `embeddedHarness.runtime: "codex"` (o una
referencia heredada `codex/*`) y comprueba si `plugins.allow` excluye `codex`.

**OpenClaw usa PI en lugar de Codex:** si ningún arnés Codex reclama la ejecución,
OpenClaw puede usar PI como backend de compatibilidad. Establece
`embeddedHarness.runtime: "codex"` para forzar la selección de Codex durante las pruebas, o
`embeddedHarness.fallback: "none"` para fallar cuando ningún arnés de Plugin coincida. Una vez
seleccionado el servidor de aplicaciones Codex, sus fallos aparecen directamente sin necesidad de
configuración adicional de alternativa.

**Se rechaza el servidor de aplicaciones:** actualiza Codex para que el handshake del servidor de aplicaciones
informe de la versión `0.118.0` o posterior.

**El descubrimiento de modelos es lento:** reduce `plugins.entries.codex.config.discovery.timeoutMs`
o desactiva el descubrimiento.

**El transporte WebSocket falla inmediatamente:** comprueba `appServer.url`, `authToken`
y que el servidor de aplicaciones remoto use la misma versión del protocolo del servidor de aplicaciones Codex.

**Un modelo que no es Codex usa PI:** esto es lo esperado a menos que hayas forzado
`embeddedHarness.runtime: "codex"` (o hayas seleccionado una referencia heredada `codex/*`). Las
referencias simples `openai/gpt-*` y las de otros proveedores permanecen en su ruta normal de proveedor.

## Relacionado

- [Plugins de arnés de agente](/es/plugins/sdk-agent-harness)
- [Proveedores de modelos](/es/concepts/model-providers)
- [Referencia de configuración](/es/gateway/configuration-reference)
- [Pruebas](/es/help/testing-live#live-codex-app-server-harness-smoke)
