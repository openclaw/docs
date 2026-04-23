---
read_when:
    - Quieres usar el arnés app-server de Codex incluido en el paquete
    - Necesitas referencias de modelo de Codex y ejemplos de configuración
    - Quieres deshabilitar la alternativa de Pi para implementaciones solo de Codex
summary: Ejecutar turnos de agente integrados de OpenClaw mediante el arnés app-server de Codex incluido en el paquete
title: Arnés de Codex
x-i18n:
    generated_at: "2026-04-23T05:16:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: dc2acc3dc906d12e12a837a25a52ec0e72d44325786106771045d456e6327040
    source_path: plugins/codex-harness.md
    workflow: 15
---

# Arnés de Codex

El Plugin `codex` incluido permite que OpenClaw ejecute turnos de agente integrados a través del app-server de Codex en lugar del arnés de Pi integrado.

Úsalo cuando quieras que Codex sea responsable de la sesión de agente de bajo nivel: descubrimiento de modelos, reanudación nativa de hilos, Compaction nativa y ejecución del app-server.
OpenClaw sigue siendo responsable de los canales de chat, archivos de sesión, selección de modelos, herramientas, aprobaciones, entrega de contenido multimedia y el espejo visible de la transcripción.

Los turnos nativos de Codex también respetan los hooks compartidos de Plugin `before_prompt_build`,
`before_compaction` y `after_compaction`, para que los shims de prompt y la
automatización con conocimiento de Compaction puedan mantenerse alineados con el arnés de Pi.
Los turnos nativos de Codex también respetan los hooks compartidos de Plugin
`before_prompt_build`, `before_compaction`, `after_compaction`, `llm_input`, `llm_output` y
`agent_end`, para que los shims de prompt, la automatización con conocimiento de Compaction y
los observadores del ciclo de vida puedan mantenerse alineados con el arnés de Pi.

El arnés está desactivado de forma predeterminada. Se selecciona solo cuando el Plugin `codex` está
habilitado y el modelo resuelto es un modelo `codex/*`, o cuando fuerzas
explícitamente `embeddedHarness.runtime: "codex"` o `OPENCLAW_AGENT_RUNTIME=codex`.
Si nunca configuras `codex/*`, las ejecuciones existentes de Pi, OpenAI, Anthropic, Gemini, locales
y de proveedores personalizados mantienen su comportamiento actual.

## Elige el prefijo de modelo correcto

OpenClaw tiene rutas separadas para el acceso con forma de OpenAI y Codex:

| Referencia de modelo              | Ruta de tiempo de ejecución                                 | Úsalo cuando                                                                |
| ---------------------- | -------------------------------------------- | ----------------------------------------------------------------------- |
| `openai/gpt-5.4`       | Proveedor OpenAI a través de la infraestructura de OpenClaw/Pi | Quieres acceso directo a la API de OpenAI Platform con `OPENAI_API_KEY`.       |
| `openai-codex/gpt-5.4` | Proveedor OAuth de OpenAI Codex a través de Pi       | Quieres OAuth de ChatGPT/Codex sin el arnés app-server de Codex.      |
| `codex/gpt-5.4`        | Proveedor Codex incluido más arnés de Codex    | Quieres ejecución nativa del app-server de Codex para el turno de agente integrado. |

El arnés de Codex solo toma referencias de modelo `codex/*`. Las referencias existentes `openai/*`,
`openai-codex/*`, Anthropic, Gemini, xAI, locales y de proveedores personalizados mantienen
sus rutas normales.

## Requisitos

- OpenClaw con el Plugin `codex` incluido disponible.
- App-server de Codex `0.118.0` o posterior.
- Autenticación de Codex disponible para el proceso del app-server.

El Plugin bloquea handshakes del app-server más antiguos o sin versión. Eso mantiene
OpenClaw en la superficie de protocolo con la que se ha probado.

Para pruebas smoke en vivo y con Docker, la autenticación suele provenir de `OPENAI_API_KEY`, más
archivos opcionales de la CLI de Codex como `~/.codex/auth.json` y
`~/.codex/config.toml`. Usa el mismo material de autenticación que usa tu app-server local de Codex.

## Configuración mínima

Usa `codex/gpt-5.4`, habilita el Plugin incluido y fuerza el arnés `codex`:

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
      model: "codex/gpt-5.4",
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

Establecer `agents.defaults.model` o un modelo de agente en `codex/<model>` también
habilita automáticamente el Plugin `codex` incluido. La entrada explícita del Plugin sigue siendo
útil en configuraciones compartidas porque hace evidente la intención de la implementación.

## Agregar Codex sin reemplazar otros modelos

Mantén `runtime: "auto"` cuando quieras Codex para modelos `codex/*` y Pi para
todo lo demás:

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
        primary: "codex/gpt-5.4",
        fallbacks: ["openai/gpt-5.4", "anthropic/claude-opus-4-6"],
      },
      models: {
        "codex/gpt-5.4": { alias: "codex" },
        "codex/gpt-5.4-mini": { alias: "codex-mini" },
        "openai/gpt-5.4": { alias: "gpt" },
        "anthropic/claude-opus-4-6": { alias: "opus" },
      },
      embeddedHarness: {
        runtime: "auto",
        fallback: "pi",
      },
    },
  },
}
```

Con esta estructura:

- `/model codex` o `/model codex/gpt-5.4` usa el arnés app-server de Codex.
- `/model gpt` o `/model openai/gpt-5.4` usa la ruta del proveedor OpenAI.
- `/model opus` usa la ruta del proveedor Anthropic.
- Si se selecciona un modelo que no es Codex, Pi sigue siendo el arnés de compatibilidad.

## Implementaciones solo de Codex

Deshabilita la alternativa de Pi cuando necesites demostrar que cada turno de agente integrado usa
el arnés de Codex:

```json5
{
  agents: {
    defaults: {
      model: "codex/gpt-5.4",
      embeddedHarness: {
        runtime: "codex",
        fallback: "none",
      },
    },
  },
}
```

Anulación mediante entorno:

```bash
OPENCLAW_AGENT_RUNTIME=codex \
OPENCLAW_AGENT_HARNESS_FALLBACK=none \
openclaw gateway run
```

Con la alternativa deshabilitada, OpenClaw falla pronto si el Plugin Codex está deshabilitado,
si el modelo solicitado no es una referencia `codex/*`, si el app-server es demasiado antiguo o si el
app-server no puede iniciarse.

## Codex por agente

Puedes hacer que un agente sea solo Codex mientras el agente predeterminado conserva
la selección automática normal:

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
        model: "codex/gpt-5.4",
        embeddedHarness: {
          runtime: "codex",
          fallback: "none",
        },
      },
    ],
  },
}
```

Usa los comandos normales de sesión para cambiar de agentes y modelos. `/new` crea una sesión nueva
de OpenClaw y el arnés de Codex crea o reanuda su hilo sidecar del app-server según sea necesario. `/reset` borra la vinculación de sesión de OpenClaw para ese hilo.

## Descubrimiento de modelos

De forma predeterminada, el Plugin Codex pide al app-server los modelos disponibles. Si el
descubrimiento falla o agota el tiempo, usa el catálogo alternativo incluido:

- `codex/gpt-5.4`
- `codex/gpt-5.4-mini`
- `codex/gpt-5.2`

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

## Conexión y política del app-server

De forma predeterminada, el Plugin inicia Codex localmente con:

```bash
codex app-server --listen stdio://
```

De forma predeterminada, OpenClaw inicia sesiones locales del arnés de Codex en modo YOLO:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` y
`sandbox: "danger-full-access"`. Esta es la postura de operador local confiable usada
para Heartbeats autónomos: Codex puede usar herramientas de shell y red sin
detenerse en prompts de aprobación nativos que nadie está presente para responder.

Para optar por aprobaciones revisadas por guardian de Codex, establece `appServer.mode:
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

El modo guardian se expande a:

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

Guardian es un revisor nativo de aprobaciones de Codex. Cuando Codex solicita salir del
sandbox, escribir fuera del workspace o agregar permisos como acceso de red,
Codex enruta esa solicitud de aprobación a un subagente revisor en lugar de a un prompt humano.
El revisor recopila contexto y aplica el marco de riesgo de Codex, luego
aprueba o deniega la solicitud específica. Guardian es útil cuando quieres más
protecciones que el modo YOLO, pero aun así necesitas que agentes y Heartbeats desatendidos
sigan avanzando.

El arnés en vivo de Docker incluye un sondeo de Guardian cuando
`OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`. Inicia el arnés de Codex en
modo Guardian, verifica que se apruebe un comando de shell escalado benigno y
verifica que se deniegue una carga de secreto falso a un destino externo no confiable para que el agente vuelva a solicitar aprobación explícita.

Los campos de política individuales siguen teniendo prioridad sobre `mode`, por lo que las implementaciones avanzadas pueden
mezclar el preajuste con elecciones explícitas.

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

Campos `appServer` compatibles:

| Campo               | Predeterminado                                  | Significado                                                                                                   |
| ------------------- | ---------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `transport`         | `"stdio"`                                | `"stdio"` genera Codex; `"websocket"` se conecta a `url`.                                                  |
| `command`           | `"codex"`                                | Ejecutable para el transporte stdio.                                                                           |
| `args`              | `["app-server", "--listen", "stdio://"]` | Argumentos para el transporte stdio.                                                                            |
| `url`               | sin establecer                                    | URL del app-server WebSocket.                                                                                 |
| `authToken`         | sin establecer                                    | Token Bearer para el transporte WebSocket.                                                                     |
| `headers`           | `{}`                                     | Encabezados WebSocket adicionales.                                                                                  |
| `requestTimeoutMs`  | `60000`                                  | Tiempo de espera para llamadas del plano de control del app-server.                                                               |
| `mode`              | `"yolo"`                                 | Preajuste para ejecución YOLO o revisada por guardian.                                                           |
| `approvalPolicy`    | `"never"`                                | Política nativa de aprobación de Codex enviada al inicio/reanudación/turno del hilo.                                            |
| `sandbox`           | `"danger-full-access"`                   | Modo sandbox nativo de Codex enviado al inicio/reanudación del hilo.                                                    |
| `approvalsReviewer` | `"user"`                                 | Usa `"guardian_subagent"` para permitir que Codex Guardian revise prompts.                                           |
| `serviceTier`       | sin establecer                                    | Nivel de servicio opcional del app-server de Codex: `"fast"`, `"flex"` o `null`. Los valores heredados no válidos se ignoran. |

Las variables de entorno antiguas siguen funcionando como alternativas para pruebas locales cuando
el campo de configuración correspondiente no está establecido:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` se eliminó. Usa
`plugins.entries.codex.config.appServer.mode: "guardian"` en su lugar, o
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` para pruebas locales puntuales. Se
prefiere la configuración para implementaciones repetibles porque mantiene el
comportamiento del Plugin en el mismo archivo revisado que el resto de la configuración del arnés de Codex.

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

Validación de arnés solo de Codex, con la alternativa de Pi deshabilitada:

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

El cambio de modelos sigue estando controlado por OpenClaw. Cuando una sesión de OpenClaw está vinculada
a un hilo de Codex existente, el siguiente turno envía nuevamente a
app-server el modelo, proveedor, política de aprobación, sandbox y nivel de servicio `codex/*`
seleccionados actualmente. Cambiar de `codex/gpt-5.4` a `codex/gpt-5.2` mantiene la
vinculación del hilo, pero le pide a Codex que continúe con el modelo recién seleccionado.

## Comando Codex

El Plugin incluido registra `/codex` como un comando slash autorizado. Es
genérico y funciona en cualquier canal que admita comandos de texto de OpenClaw.

Formas comunes:

- `/codex status` muestra conectividad en vivo del app-server, modelos, cuenta, límites de velocidad, servidores MCP y Skills.
- `/codex models` enumera los modelos en vivo del app-server de Codex.
- `/codex threads [filter]` enumera hilos recientes de Codex.
- `/codex resume <thread-id>` vincula la sesión actual de OpenClaw a un hilo existente de Codex.
- `/codex compact` le pide al app-server de Codex que compacte el hilo vinculado.
- `/codex review` inicia la revisión nativa de Codex para el hilo vinculado.
- `/codex account` muestra el estado de la cuenta y de los límites de velocidad.
- `/codex mcp` enumera el estado de los servidores MCP del app-server de Codex.
- `/codex skills` enumera las Skills del app-server de Codex.

`/codex resume` escribe el mismo archivo de vinculación sidecar que usa el arnés para
los turnos normales. En el siguiente mensaje, OpenClaw reanuda ese hilo de Codex, pasa a app-server el
modelo `codex/*` de OpenClaw seleccionado actualmente y mantiene habilitado el historial
extendido.

La superficie de comandos requiere app-server de Codex `0.118.0` o posterior. Los métodos de
control individuales se informan como `unsupported by this Codex app-server` si un
app-server futuro o personalizado no expone ese método JSON-RPC.

## Herramientas, contenido multimedia y Compaction

El arnés de Codex solo cambia el ejecutor de agente integrado de bajo nivel.

OpenClaw sigue construyendo la lista de herramientas y recibiendo resultados dinámicos de herramientas desde el
arnés. El texto, las imágenes, el video, la música, TTS, las aprobaciones y la salida de herramientas de mensajería
siguen pasando por la ruta normal de entrega de OpenClaw.

Las solicitudes de aprobación de herramientas MCP de Codex se enrutan a través del flujo de
aprobación de Plugin de OpenClaw cuando Codex marca `_meta.codex_approval_kind` como
`"mcp_tool_call"`; otras solicitudes de entrada y de recopilación libres siguen
fallando de forma cerrada.

Cuando el modelo seleccionado usa el arnés de Codex, la Compaction nativa de hilos se
delegada al app-server de Codex. OpenClaw conserva un espejo de la transcripción para el historial
del canal, la búsqueda, `/new`, `/reset` y futuros cambios de modelo o arnés. El
espejo incluye el prompt del usuario, el texto final del asistente y registros ligeros
de razonamiento o plan de Codex cuando el app-server los emite. Hoy, OpenClaw solo
registra las señales nativas de inicio y finalización de Compaction. Aún no expone un
resumen legible por humanos de la Compaction ni una lista auditable de qué entradas conservó Codex
después de la Compaction.

La generación de contenido multimedia no requiere Pi. La imagen, el video, la música, PDF, TTS y la
comprensión de contenido multimedia siguen usando la configuración correspondiente de proveedor/modelo como
`agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel` y
`messages.tts`.

## Solución de problemas

**Codex no aparece en `/model`:** habilita `plugins.entries.codex.enabled`,
establece una referencia de modelo `codex/*` o comprueba si `plugins.allow` excluye `codex`.

**OpenClaw usa Pi en lugar de Codex:** si ningún arnés de Codex reclama la ejecución,
OpenClaw puede usar Pi como backend de compatibilidad. Establece
`embeddedHarness.runtime: "codex"` para forzar la selección de Codex durante las pruebas, o
`embeddedHarness.fallback: "none"` para fallar cuando ningún arnés de Plugin coincida. Una vez
seleccionado el app-server de Codex, sus fallos aparecen directamente sin configuración
adicional de alternativa.

**El app-server es rechazado:** actualiza Codex para que el handshake del app-server
informe la versión `0.118.0` o posterior.

**El descubrimiento de modelos es lento:** reduce `plugins.entries.codex.config.discovery.timeoutMs`
o deshabilita el descubrimiento.

**El transporte WebSocket falla inmediatamente:** comprueba `appServer.url`, `authToken`
y que el app-server remoto use la misma versión de protocolo del app-server de Codex.

**Un modelo que no es Codex usa Pi:** eso es lo esperado. El arnés de Codex solo reclama
referencias de modelo `codex/*`.

## Relacionado

- [Plugins de arnés de agente](/es/plugins/sdk-agent-harness)
- [Proveedores de modelos](/es/concepts/model-providers)
- [Referencia de configuración](/es/gateway/configuration-reference)
- [Pruebas](/es/help/testing#live-codex-app-server-harness-smoke)
