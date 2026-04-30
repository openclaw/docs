---
read_when:
    - Quieres usar el arnés de app-server incluido con Codex
    - Necesitas ejemplos de configuración del arnés de Codex
    - Quieres que las implementaciones solo con Codex fallen en lugar de recurrir a PI
summary: Ejecuta los turnos del agente integrado de OpenClaw mediante el arnés de app-server de Codex incluido
title: Entorno de ejecución de Codex
x-i18n:
    generated_at: "2026-04-30T05:51:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 93abb72e9590aad265e5b6b8691dd16314178c4d255679b4e53da33b792a6e6b
    source_path: plugins/codex-harness.md
    workflow: 16
---

El plugin `codex` incluido permite que OpenClaw ejecute turnos de agente embebidos a través del app-server de Codex en lugar del arnés PI integrado.

Usa esto cuando quieras que Codex sea dueño de la sesión de agente de bajo nivel: descubrimiento de modelos, reanudación nativa de hilos, compaction nativa y ejecución en app-server. OpenClaw sigue siendo dueño de los canales de chat, archivos de sesión, selección de modelo, herramientas, aprobaciones, entrega de medios y el espejo visible de la transcripción.

Si intentas orientarte, empieza con
[Runtimes de agente](/es/concepts/agent-runtimes). La versión corta es:
`openai/gpt-5.5` es la referencia de modelo, `codex` es el runtime, y Telegram, Discord, Slack u otro canal sigue siendo la superficie de comunicación.

## Qué cambia este plugin

El plugin `codex` incluido aporta varias capacidades independientes:

| Capacidad                         | Cómo se usa                                         | Qué hace                                                                      |
| --------------------------------- | --------------------------------------------------- | ----------------------------------------------------------------------------- |
| Runtime embebido nativo           | `agentRuntime.id: "codex"`                          | Ejecuta turnos de agente embebidos de OpenClaw a través del app-server de Codex. |
| Comandos nativos de control de chat | `/codex bind`, `/codex resume`, `/codex steer`, ... | Vincula y controla hilos del app-server de Codex desde una conversación de mensajería. |
| Proveedor/catálogo del app-server de Codex | Internos de `codex`, expuestos a través del arnés | Permite que el runtime descubra y valide modelos del app-server.              |
| Ruta de comprensión de medios de Codex | Rutas de compatibilidad de modelos de imagen `codex/*` | Ejecuta turnos acotados del app-server de Codex para modelos de comprensión de imágenes compatibles. |
| Reenvío de hooks nativos          | Hooks de Plugin alrededor de eventos nativos de Codex | Permite que OpenClaw observe/bloquee eventos compatibles nativos de herramientas/finalización de Codex. |

Activar el plugin pone disponibles esas capacidades. **No**:

- empieza a usar Codex para todos los modelos de OpenAI
- convierte referencias de modelo `openai-codex/*` en el runtime nativo
- hace que ACP/acpx sea la ruta predeterminada de Codex
- cambia en caliente sesiones existentes que ya registraron un runtime PI
- sustituye la entrega de canales de OpenClaw, archivos de sesión, almacenamiento de perfiles de autenticación ni el enrutamiento de mensajes

El mismo plugin también es dueño de la superficie nativa de comandos de control de chat `/codex`. Si el plugin está activado y el usuario pide vincular, reanudar, dirigir, detener o inspeccionar hilos de Codex desde el chat, los agentes deberían preferir `/codex ...` sobre ACP. ACP sigue siendo el fallback explícito cuando el usuario pide ACP/acpx o está probando el adaptador ACP de Codex.

Los turnos nativos de Codex mantienen los hooks de Plugin de OpenClaw como la capa pública de compatibilidad. Estos son hooks de OpenClaw en proceso, no hooks de comando `hooks.json` de Codex:

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `before_tool_call`, `after_tool_call`
- `before_message_write` para registros de transcripción reflejados
- `before_agent_finalize` a través del reenvío `Stop` de Codex
- `agent_end`

Los plugins también pueden registrar middleware de resultados de herramientas neutral respecto del runtime para reescribir resultados de herramientas dinámicas de OpenClaw después de que OpenClaw ejecuta la herramienta y antes de que el resultado se devuelva a Codex. Esto es independiente del hook público de Plugin `tool_result_persist`, que transforma escrituras de resultados de herramientas de transcripción propiedad de OpenClaw.

Para la semántica de los hooks de Plugin en sí, consulta [Hooks de Plugin](/es/plugins/hooks) y [Comportamiento de guardia de Plugin](/es/tools/plugin).

El arnés está desactivado de forma predeterminada. Las configuraciones nuevas deberían mantener las referencias de modelo de OpenAI canónicas como `openai/gpt-*` y forzar explícitamente `agentRuntime.id: "codex"` u `OPENCLAW_AGENT_RUNTIME=codex` cuando quieran ejecución nativa en app-server. Las referencias de modelo heredadas `codex/*` todavía seleccionan automáticamente el arnés por compatibilidad, pero los prefijos de proveedor heredados respaldados por runtime no se muestran como opciones normales de modelo/proveedor.

Si el plugin `codex` está activado pero el modelo principal sigue siendo `openai-codex/*`, `openclaw doctor` advierte en lugar de cambiar la ruta. Esto es intencional: `openai-codex/*` sigue siendo la ruta OAuth/suscripción de Codex en PI, y la ejecución nativa en app-server sigue siendo una elección explícita de runtime.

## Mapa de rutas

Usa esta tabla antes de cambiar la configuración:

| Comportamiento deseado                      | Referencia de modelo      | Configuración de runtime                | Requisito de Plugin         | Etiqueta de estado esperada    |
| ------------------------------------------- | -------------------------- | -------------------------------------- | --------------------------- | ------------------------------ |
| API de OpenAI a través del ejecutor normal de OpenClaw | `openai/gpt-*`             | omitido o `runtime: "pi"`              | Proveedor de OpenAI         | `Runtime: OpenClaw Pi Default` |
| OAuth/suscripción de Codex a través de PI    | `openai-codex/gpt-*`       | omitido o `runtime: "pi"`              | Proveedor OAuth de OpenAI Codex | `Runtime: OpenClaw Pi Default` |
| Turnos embebidos nativos del app-server de Codex | `openai/gpt-*`             | `agentRuntime.id: "codex"`             | Plugin `codex`              | `Runtime: OpenAI Codex`        |
| Proveedores mixtos con modo automático conservador | referencias específicas del proveedor | `agentRuntime.id: "auto"`              | Runtimes de Plugin opcionales | Depende del runtime seleccionado |
| Sesión explícita del adaptador ACP de Codex  | Dependiente de prompt/modelo ACP | `sessions_spawn` con `runtime: "acp"` | backend `acpx` saludable    | Estado de tarea/sesión ACP     |

La división importante es proveedor frente a runtime:

- `openai-codex/*` responde "¿qué ruta de proveedor/autenticación debería usar PI?"
- `agentRuntime.id: "codex"` responde "¿qué bucle debería ejecutar este turno embebido?"
- `/codex ...` responde "¿qué conversación nativa de Codex debería vincular o controlar este chat?"
- ACP responde "¿qué proceso de arnés externo debería lanzar acpx?"

## Elige el prefijo de modelo correcto

Las rutas de la familia OpenAI son específicas del prefijo. Usa `openai-codex/*` cuando quieras OAuth de Codex a través de PI; usa `openai/*` cuando quieras acceso directo a la API de OpenAI o cuando estés forzando el arnés nativo del app-server de Codex:

| Referencia de modelo                         | Ruta de runtime                             | Úsalo cuando                                                              |
| --------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------- |
| `openai/gpt-5.4`                              | Proveedor de OpenAI a través de la fontanería de OpenClaw/PI | Quieres acceso directo actual a la API de OpenAI Platform con `OPENAI_API_KEY`. |
| `openai-codex/gpt-5.5`                        | OAuth de OpenAI Codex a través de OpenClaw/PI | Quieres autenticación de suscripción ChatGPT/Codex con el ejecutor PI predeterminado. |
| `openai/gpt-5.5` + `agentRuntime.id: "codex"` | Arnés del app-server de Codex                | Quieres ejecución nativa del app-server de Codex para el turno de agente embebido. |

GPT-5.5 actualmente es solo de suscripción/OAuth en OpenClaw. Usa `openai-codex/gpt-5.5` para OAuth de PI, o `openai/gpt-5.5` con el arnés del app-server de Codex. El acceso directo con clave de API para `openai/gpt-5.5` será compatible cuando OpenAI habilite GPT-5.5 en la API pública.

Las referencias heredadas `codex/gpt-*` siguen aceptándose como alias de compatibilidad. La migración de compatibilidad de doctor reescribe las referencias heredadas de runtime principal a referencias de modelo canónicas y registra la política de runtime por separado, mientras que las referencias heredadas solo de fallback quedan sin cambios porque el runtime se configura para todo el contenedor del agente. Las nuevas configuraciones OAuth de PI Codex deberían usar `openai-codex/gpt-*`; las nuevas configuraciones del arnés nativo de app-server deberían usar `openai/gpt-*` más `agentRuntime.id: "codex"`.

`agents.defaults.imageModel` sigue la misma división de prefijos. Usa `openai-codex/gpt-*` cuando la comprensión de imágenes deba ejecutarse a través de la ruta del proveedor OAuth de OpenAI Codex. Usa `codex/gpt-*` cuando la comprensión de imágenes deba ejecutarse mediante un turno acotado del app-server de Codex. El modelo del app-server de Codex debe anunciar compatibilidad con entrada de imagen; los modelos Codex solo de texto fallan antes de que empiece el turno de medios.

Usa `/status` para confirmar el arnés efectivo de la sesión actual. Si la selección sorprende, activa el registro de depuración para el subsistema `agents/harness` e inspecciona el registro estructurado `agent harness selected` del gateway. Incluye el id del arnés seleccionado, el motivo de selección, la política de runtime/fallback y, en modo `auto`, el resultado de compatibilidad de cada candidato de Plugin.

### Qué significan las advertencias de doctor

`openclaw doctor` advierte cuando todo esto es cierto:

- el plugin `codex` incluido está activado o permitido
- el modelo principal de un agente es `openai-codex/*`
- el runtime efectivo de ese agente no es `codex`

Esa advertencia existe porque los usuarios a menudo esperan que "plugin de Codex activado" implique "runtime nativo del app-server de Codex". OpenClaw no da ese salto. La advertencia significa:

- **No se requiere ningún cambio** si pretendías usar OAuth de ChatGPT/Codex a través de PI.
- Cambia el modelo a `openai/<model>` y configura `agentRuntime.id: "codex"` si pretendías ejecución nativa en app-server.
- Las sesiones existentes todavía necesitan `/new` o `/reset` después de un cambio de runtime, porque los pins de runtime de sesión son persistentes.

La selección de arnés no es un control de sesión en vivo. Cuando se ejecuta un turno embebido, OpenClaw registra el id del arnés seleccionado en esa sesión y sigue usándolo para turnos posteriores con el mismo id de sesión. Cambia la configuración de `agentRuntime` u `OPENCLAW_AGENT_RUNTIME` cuando quieras que sesiones futuras usen otro arnés; usa `/new` o `/reset` para iniciar una sesión nueva antes de cambiar una conversación existente entre PI y Codex. Esto evita reproducir una transcripción por dos sistemas nativos de sesión incompatibles.

Las sesiones heredadas creadas antes de los pins de arnés se tratan como fijadas a PI una vez que tienen historial de transcripción. Usa `/new` o `/reset` para incorporar esa conversación a Codex después de cambiar la configuración.

`/status` muestra el runtime efectivo del modelo. El arnés PI predeterminado aparece como `Runtime: OpenClaw Pi Default`, y el arnés del app-server de Codex aparece como `Runtime: OpenAI Codex`.

## Requisitos

- OpenClaw con el plugin `codex` incluido disponible.
- App-server de Codex `0.125.0` o más reciente. El plugin incluido gestiona un binario compatible del app-server de Codex de forma predeterminada, por lo que los comandos locales `codex` en `PATH` no afectan al inicio normal del arnés.
- Autenticación de Codex disponible para el proceso del app-server o para el puente de autenticación de Codex de OpenClaw.

El plugin bloquea handshakes de app-server antiguos o sin versión. Esto mantiene a OpenClaw en la superficie de protocolo contra la que se ha probado.

Para pruebas smoke en vivo y en Docker, la autenticación suele venir de la cuenta de la CLI de Codex o de un perfil de autenticación `openai-codex` de OpenClaw. Los lanzamientos locales stdio del app-server también pueden recurrir a `CODEX_API_KEY` / `OPENAI_API_KEY` cuando no hay ninguna cuenta presente.

## Configuración mínima

Usa `openai/gpt-5.5`, activa el plugin incluido y fuerza el arnés `codex`:

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

Las configuraciones heredadas que establecen `agents.defaults.model` o un modelo de agente en `codex/<model>` todavía activan automáticamente el plugin `codex` incluido. Las configuraciones nuevas deberían preferir `openai/<model>` más la entrada explícita `agentRuntime` anterior.

## Añadir Codex junto a otros modelos

No establezcas `agentRuntime.id: "codex"` globalmente si el mismo agente debería cambiar libremente entre Codex y modelos de proveedor que no sean Codex. Un runtime forzado se aplica a cada turno embebido de ese agente o sesión. Si seleccionas un modelo de Anthropic mientras ese runtime está forzado, OpenClaw aun así intenta usar el arnés de Codex y falla de forma cerrada en lugar de enrutar silenciosamente ese turno a través de PI.

Usa una de estas formas en su lugar:

- Coloca Codex en un agente dedicado con `agentRuntime.id: "codex"`.
- Mantén el agente predeterminado en `agentRuntime.id: "auto"` y el respaldo de PI para el uso normal mixto de proveedores.
- Usa referencias heredadas `codex/*` solo por compatibilidad. Las configuraciones nuevas deberían preferir `openai/*` más una política explícita de runtime de Codex.

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

- El agente `main` predeterminado usa la ruta normal del proveedor y el respaldo de compatibilidad de PI.
- El agente `codex` usa el arnés app-server de Codex.
- Si Codex falta o no es compatible con el agente `codex`, el turno falla en lugar de usar PI silenciosamente.

## Enrutamiento de comandos de agente

Los agentes deberían enrutar las solicitudes de usuario por intención, no solo por la palabra "Codex":

| Si el usuario pide...                                    | El agente debería usar...                         |
| -------------------------------------------------------- | ------------------------------------------------ |
| "Vincula este chat a Codex"                              | `/codex bind`                                    |
| "Reanuda aquí el hilo de Codex `<id>`"                   | `/codex resume <id>`                             |
| "Muestra los hilos de Codex"                             | `/codex threads`                                 |
| "Presenta un informe de soporte por una ejecución defectuosa de Codex" | `/diagnostics [note]`                            |
| "Envía comentarios de Codex solo para este hilo adjunto" | `/codex diagnostics [note]`                      |
| "Usa Codex como runtime para este agente"                | cambio de configuración a `agentRuntime.id`      |
| "Usa mi suscripción de ChatGPT/Codex con OpenClaw normal" | referencias de modelo `openai-codex/*`           |
| "Ejecuta Codex mediante ACP/acpx"                        | ACP `sessions_spawn({ runtime: "acp", ... })`    |
| "Inicia Claude Code/Gemini/OpenCode/Cursor en un hilo"   | ACP/acpx, no `/codex` ni subagentes nativos      |

OpenClaw solo anuncia la guía de generación de ACP a los agentes cuando ACP está habilitado, se puede despachar y está respaldado por un backend de runtime cargado. Si ACP no está disponible, el prompt del sistema y las Skills del Plugin no deberían enseñar al agente sobre el enrutamiento de ACP.

## Despliegues solo con Codex

Fuerza el arnés de Codex cuando necesites demostrar que cada turno de agente integrado usa Codex. Los runtimes explícitos de Plugin tienen de forma predeterminada ningún respaldo de PI, así que `fallback: "none"` es opcional, pero a menudo resulta útil como documentación:

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

Con Codex forzado, OpenClaw falla temprano si el Plugin de Codex está deshabilitado, el app-server es demasiado antiguo o el app-server no puede iniciar. Define `OPENCLAW_AGENT_HARNESS_FALLBACK=pi` solo si quieres intencionalmente que PI gestione una selección de arnés faltante.

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

Usa los comandos de sesión normales para cambiar agentes y modelos. `/new` crea una sesión nueva de OpenClaw y el arnés de Codex crea o reanuda su hilo app-server sidecar según sea necesario. `/reset` borra la vinculación de sesión de OpenClaw para ese hilo y permite que el siguiente turno resuelva de nuevo el arnés desde la configuración actual.

## Descubrimiento de modelos

De forma predeterminada, el Plugin de Codex pide al app-server los modelos disponibles. Si el descubrimiento falla o agota el tiempo de espera, usa un catálogo de respaldo incluido para:

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

Deshabilita el descubrimiento cuando quieras que el inicio evite sondear Codex y se limite al catálogo de respaldo:

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

El binario gestionado se declara como dependencia de runtime de Plugin incluida y se prepara con el resto de las dependencias del Plugin `codex`. Esto mantiene la versión del app-server vinculada al Plugin incluido en lugar de cualquier CLI de Codex separada que esté instalada localmente. Define `appServer.command` solo cuando quieras ejecutar intencionalmente un ejecutable diferente.

De forma predeterminada, OpenClaw inicia sesiones locales del arnés de Codex en modo YOLO: `approvalPolicy: "never"`, `approvalsReviewer: "user"` y `sandbox: "danger-full-access"`. Esta es la postura de operador local de confianza usada para heartbeats autónomos: Codex puede usar herramientas de shell y red sin detenerse en prompts de aprobación nativos que nadie está presente para responder.

Para optar por aprobaciones revisadas por el guardián de Codex, define `appServer.mode: "guardian"`:

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

El modo Guardian usa la ruta nativa de aprobación con revisión automática de Codex. Cuando Codex pide salir del sandbox, escribir fuera del workspace o añadir permisos como acceso de red, Codex enruta esa solicitud de aprobación al revisor nativo en lugar de a un prompt humano. El revisor aplica el marco de riesgo de Codex y aprueba o deniega la solicitud específica. Usa Guardian cuando quieras más barreras de protección que el modo YOLO, pero aun así necesites que agentes desatendidos avancen.

El preset `guardian` se expande a `approvalPolicy: "on-request"`, `approvalsReviewer: "auto_review"` y `sandbox: "workspace-write"`. Los campos de política individuales siguen sobrescribiendo `mode`, así que los despliegues avanzados pueden mezclar el preset con elecciones explícitas. El valor de revisor anterior `guardian_subagent` todavía se acepta como alias de compatibilidad, pero las configuraciones nuevas deberían usar `auto_review`.

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

Los lanzamientos stdio del app-server heredan de forma predeterminada el entorno de proceso de OpenClaw, pero OpenClaw es dueño del puente de cuenta del app-server de Codex. La autenticación se selecciona en este orden:

1. Un perfil explícito de autenticación de OpenClaw Codex para el agente.
2. La cuenta existente del app-server, como un inicio de sesión local de ChatGPT en la CLI de Codex.
3. Solo para lanzamientos locales stdio del app-server, `CODEX_API_KEY`, luego `OPENAI_API_KEY`, cuando no hay cuenta de app-server presente y todavía se requiere autenticación de OpenAI.

Cuando OpenClaw detecta un perfil de autenticación de Codex de estilo suscripción de ChatGPT, elimina `CODEX_API_KEY` y `OPENAI_API_KEY` del proceso hijo de Codex generado. Eso mantiene disponibles las claves de API de nivel Gateway para embeddings o modelos directos de OpenAI sin hacer que los turnos nativos del app-server de Codex se facturen accidentalmente mediante la API. Los perfiles explícitos de clave de API de Codex y el respaldo local stdio con clave de entorno usan inicio de sesión de app-server en lugar del entorno heredado del proceso hijo. Las conexiones WebSocket del app-server no reciben respaldo de clave de API de entorno de Gateway; usa un perfil de autenticación explícito o la cuenta propia del app-server remoto.

Si un despliegue necesita aislamiento adicional de entorno, añade esas variables a `appServer.clearEnv`:

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

| Campo               | Predeterminado                           | Significado                                                                                                                             |
| ------------------- | ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `transport`         | `"stdio"`                                | `"stdio"` inicia Codex; `"websocket"` se conecta a `url`.                                                                            |
| `command`           | binario administrado de Codex            | Ejecutable para el transporte stdio. Déjalo sin definir para usar el binario administrado; configúralo solo para una sustitución explícita. |
| `args`              | `["app-server", "--listen", "stdio://"]` | Argumentos para el transporte stdio.                                                                                                      |
| `url`               | sin definir                              | URL de app-server WebSocket.                                                                                                           |
| `authToken`         | sin definir                              | Token Bearer para el transporte WebSocket.                                                                                               |
| `headers`           | `{}`                                     | Encabezados WebSocket adicionales.                                                                                                            |
| `clearEnv`          | `[]`                                     | Nombres de variables de entorno adicionales eliminadas del proceso app-server stdio iniciado después de que OpenClaw construye su entorno heredado. |
| `requestTimeoutMs`  | `60000`                                  | Tiempo de espera para llamadas del plano de control de app-server.                                                                                         |
| `mode`              | `"yolo"`                                 | Preajuste para ejecución YOLO o revisada por guardian.                                                                                     |
| `approvalPolicy`    | `"never"`                                | Política de aprobación nativa de Codex enviada al iniciar/reanudar hilo/turno.                                                                      |
| `sandbox`           | `"danger-full-access"`                   | Modo sandbox nativo de Codex enviado al iniciar/reanudar hilo.                                                                              |
| `approvalsReviewer` | `"user"`                                 | Usa `"auto_review"` para permitir que Codex revise las solicitudes de aprobación nativas. `guardian_subagent` sigue siendo un alias heredado. |
| `serviceTier`       | sin definir                              | Nivel de servicio opcional de app-server de Codex: `"fast"`, `"flex"` o `null`. Los valores heredados no válidos se ignoran. |

Las llamadas dinámicas a herramientas propiedad de OpenClaw se limitan de forma
independiente de `appServer.requestTimeoutMs`: cada solicitud `item/tool/call` de
Codex debe recibir una respuesta de OpenClaw en un plazo de 30 segundos. Al
agotarse el tiempo de espera, OpenClaw aborta la señal de la herramienta cuando
se admite y devuelve una respuesta fallida de herramienta dinámica a Codex para
que el turno pueda continuar en lugar de dejar la sesión en `processing`.

Después de que OpenClaw responde a una solicitud de app-server de Codex con
alcance de turno, el arnés también espera que Codex termine el turno nativo con
`turn/completed`. Si app-server queda en silencio durante 60 segundos después de
esa respuesta, OpenClaw intenta interrumpir el turno de Codex, registra un
tiempo de espera de diagnóstico y libera el carril de sesión de OpenClaw para
que los mensajes de chat de seguimiento no queden en cola detrás de un turno
nativo obsoleto.

Las sustituciones de entorno siguen disponibles para pruebas locales:

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
prefiere la configuración para implementaciones repetibles porque mantiene el
comportamiento del plugin en el mismo archivo revisado que el resto de la
configuración del arnés de Codex.

## Uso de computadora

Computer Use se cubre en su propia guía de configuración:
[Codex Computer Use](/es/plugins/codex-computer-use).

La versión corta: OpenClaw no incluye como proveedor la app de control de
escritorio ni ejecuta acciones de escritorio por sí mismo. Prepara app-server de
Codex, verifica que el servidor MCP `computer-use` esté disponible y luego deja
que Codex gestione las llamadas nativas a herramientas MCP durante los turnos en
modo Codex.

Para acceso directo al controlador TryCua fuera del flujo del marketplace de
Codex, registra `cua-driver mcp` con `openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'`.
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

Computer Use es específico de macOS y puede requerir permisos locales del
sistema operativo antes de que el servidor MCP de Codex pueda controlar apps. Si
`computerUse.enabled` es true y el servidor MCP no está disponible, los turnos
en modo Codex fallan antes de que el hilo se inicie, en lugar de ejecutarse en
silencio sin las herramientas nativas de Computer Use. Consulta
[Codex Computer Use](/es/plugins/codex-computer-use) para conocer las opciones de
marketplace, los límites del catálogo remoto, los motivos de estado y la
solución de problemas.

Cuando `computerUse.autoInstall` es true, OpenClaw puede registrar el
marketplace estándar incluido de Codex Desktop desde
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` si Codex
aún no ha descubierto un marketplace local. Usa `/new` o `/reset` después de
cambiar la configuración de runtime o Computer Use para que las sesiones
existentes no mantengan una vinculación antigua de PI o de hilo de Codex.

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

El cambio de modelo sigue controlado por OpenClaw. Cuando una sesión de
OpenClaw se adjunta a un hilo de Codex existente, el siguiente turno envía de
nuevo a app-server el modelo de OpenAI, el proveedor, la política de aprobación,
el sandbox y el nivel de servicio seleccionados actualmente. Cambiar de
`openai/gpt-5.5` a `openai/gpt-5.2` conserva la vinculación del hilo, pero pide
a Codex que continúe con el modelo recién seleccionado.

## Comando Codex

El plugin incluido registra `/codex` como comando slash autorizado. Es genérico
y funciona en cualquier canal que admita comandos de texto de OpenClaw.

Formas comunes:

- `/codex status` muestra conectividad activa de app-server, modelos, cuenta, límites de tasa, servidores MCP y skills.
- `/codex models` lista los modelos activos de app-server de Codex.
- `/codex threads [filter]` lista los hilos recientes de Codex.
- `/codex resume <thread-id>` adjunta la sesión actual de OpenClaw a un hilo de Codex existente.
- `/codex compact` pide a app-server de Codex que compacte el hilo adjunto.
- `/codex review` inicia la revisión nativa de Codex para el hilo adjunto.
- `/codex diagnostics [note]` pregunta antes de enviar comentarios de diagnóstico de Codex para el hilo adjunto.
- `/codex computer-use status` comprueba el plugin de Computer Use configurado y el servidor MCP.
- `/codex computer-use install` instala el plugin de Computer Use configurado y recarga los servidores MCP.
- `/codex account` muestra el estado de la cuenta y los límites de tasa.
- `/codex mcp` lista el estado de los servidores MCP de app-server de Codex.
- `/codex skills` lista las skills de app-server de Codex.

### Flujo de depuración común

Cuando un agente respaldado por Codex hace algo inesperado en Telegram, Discord,
Slack u otro canal, empieza con la conversación donde ocurrió el problema:

1. Ejecuta `/diagnostics bad tool choice after image upload` u otra nota breve
   que describa lo que viste.
2. Aprueba la solicitud de diagnóstico una vez. La aprobación crea el zip local
   de diagnósticos del Gateway y, como la sesión usa el arnés de Codex, también
   envía el paquete de comentarios relevante de Codex a los servidores de OpenAI.
3. Copia la respuesta de diagnóstico completada en el informe de error o hilo de
   soporte. Incluye la ruta del paquete local, el resumen de privacidad, los ids
   de sesión de OpenClaw, los ids de hilo de Codex y una línea `Inspect locally`
   para cada hilo de Codex.
4. Si quieres depurar la ejecución por tu cuenta, ejecuta el comando impreso
   `Inspect locally` en una terminal. Se parece a `codex resume <thread-id>` y
   abre el hilo nativo de Codex para que puedas inspeccionar la conversación,
   continuarla localmente o preguntarle a Codex por qué eligió una herramienta o
   un plan concretos.

Usa `/codex diagnostics [note]` solo cuando quieras específicamente la carga de
comentarios de Codex para el hilo adjunto actualmente sin el paquete completo de
diagnósticos del Gateway de OpenClaw. Para la mayoría de los informes de
soporte, `/diagnostics [note]` es el mejor punto de partida porque vincula el
estado local del Gateway y los ids de hilo de Codex en una sola respuesta.
Consulta [Exportación de diagnósticos](/es/gateway/diagnostics) para ver el modelo
de privacidad completo y el comportamiento en chats de grupo.

El núcleo de OpenClaw también expone `/diagnostics [note]` solo para propietarios
como el comando general de diagnósticos del Gateway. Su solicitud de aprobación
muestra el preámbulo de datos sensibles, enlaza a [Exportación de diagnósticos](/es/gateway/diagnostics)
y solicita `openclaw gateway diagnostics export --json` mediante aprobación
explícita de exec cada vez. No apruebes diagnósticos con una regla de permitir
todo. Después de la aprobación, OpenClaw envía un informe que se puede pegar con
la ruta del paquete local y el resumen del manifiesto. Cuando la sesión activa
de OpenClaw usa el arnés de Codex, esa misma aprobación también autoriza el
envío de los paquetes de comentarios relevantes de Codex a los servidores de
OpenAI. La solicitud de aprobación dice que se enviarán comentarios de Codex,
pero no lista los ids de sesión o de hilo de Codex antes de la aprobación.

Si `/diagnostics` lo invoca un propietario en un chat de grupo, OpenClaw mantiene
limpio el canal compartido: el grupo recibe solo un aviso breve, mientras que el
preámbulo de diagnóstico, las solicitudes de aprobación y los ids de
sesión/hilo de Codex se envían al propietario por la ruta privada de aprobación.
Si no hay una ruta privada hacia el propietario, OpenClaw rechaza la solicitud
del grupo y pide al propietario que la ejecute desde un DM.

Las llamadas de carga aprobadas de Codex llaman a `feedback/upload` del app-server de Codex y piden
al app-server que incluya registros para cada hilo listado y subhilos de Codex generados
cuando estén disponibles. La carga pasa por la ruta normal de comentarios de Codex hacia los
servidores de OpenAI; si los comentarios de Codex están deshabilitados en ese app-server, el comando devuelve
el error del app-server. La respuesta de diagnósticos completada lista los canales,
los ids de sesión de OpenClaw, los ids de hilo de Codex y los comandos locales `codex resume <thread-id>`
para los hilos que se enviaron. Si deniegas o ignoras la aprobación,
OpenClaw no imprime esos ids de Codex. Esta carga no reemplaza la exportación local de
diagnósticos del Gateway.

`/codex resume` escribe el mismo archivo de enlace sidecar que el arnés usa para
turnos normales. En el siguiente mensaje, OpenClaw reanuda ese hilo de Codex, pasa el
modelo de OpenClaw seleccionado actualmente al app-server y mantiene habilitado el historial
extendido.

### Inspeccionar un hilo de Codex desde la CLI

La forma más rápida de entender una ejecución defectuosa de Codex suele ser abrir directamente el hilo
nativo de Codex:

```sh
codex resume <thread-id>
```

Usa esto cuando notes un bug en una conversación de canal y quieras inspeccionar la
sesión problemática de Codex, continuarla localmente o preguntar a Codex por qué eligió
una herramienta o una decisión de razonamiento concreta. La ruta más sencilla suele ser ejecutar
`/diagnostics [note]` primero: después de aprobarlo, el informe completado lista
cada hilo de Codex e imprime un comando `Inspect locally`, por ejemplo
`codex resume <thread-id>`. Puedes copiar ese comando directamente en una terminal.

También puedes obtener un id de hilo desde `/codex binding` para el chat actual o
`/codex threads [filter]` para hilos recientes del app-server de Codex, y luego ejecutar el mismo
comando `codex resume` en tu shell.

La superficie de comandos requiere Codex app-server `0.125.0` o posterior. Los métodos de
control individuales se informan como `unsupported by this Codex app-server` si un
app-server futuro o personalizado no expone ese método JSON-RPC.

## Límites de hooks

El arnés de Codex tiene tres capas de hooks:

| Capa                                  | Propietario              | Propósito                                                           |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| Hooks de plugins de OpenClaw          | OpenClaw                 | Compatibilidad de producto/plugin en arneses PI y Codex.            |
| Middleware de extensión del app-server de Codex | Plugins incluidos de OpenClaw | Comportamiento de adaptador por turno alrededor de herramientas dinámicas de OpenClaw. |
| Hooks nativos de Codex                | Codex                    | Ciclo de vida de bajo nivel de Codex y política de herramientas nativas desde la configuración de Codex. |

OpenClaw no usa archivos `hooks.json` de proyecto o globales de Codex para enrutar
comportamiento de plugins de OpenClaw. Para el puente compatible de herramientas nativas y permisos,
OpenClaw inyecta configuración de Codex por hilo para `PreToolUse`, `PostToolUse`,
`PermissionRequest` y `Stop`. Otros hooks de Codex como `SessionStart` y
`UserPromptSubmit` siguen siendo controles de nivel Codex; no se exponen como
hooks de plugins de OpenClaw en el contrato v1.

Para las herramientas dinámicas de OpenClaw, OpenClaw ejecuta la herramienta después de que Codex pida la
llamada, por lo que OpenClaw dispara el comportamiento de plugin y middleware que posee en el
adaptador del arnés. Para herramientas nativas de Codex, Codex posee el registro canónico de la herramienta.
OpenClaw puede reflejar eventos seleccionados, pero no puede reescribir el hilo nativo de Codex
a menos que Codex exponga esa operación mediante app-server o callbacks de hooks nativos.

Las proyecciones de Compaction y ciclo de vida de LLM provienen de notificaciones del app-server de Codex
y del estado del adaptador de OpenClaw, no de comandos de hooks nativos de Codex.
Los eventos `before_compaction`, `after_compaction`, `llm_input` y
`llm_output` de OpenClaw son observaciones de nivel adaptador, no capturas byte por byte
de la solicitud interna o las cargas útiles de Compaction de Codex.

Las notificaciones `hook/started` y `hook/completed` nativas de Codex del app-server se
proyectan como eventos de agente `codex_app_server.hook` para trayectoria y depuración.
No invocan hooks de plugins de OpenClaw.

## Contrato de soporte V1

El modo Codex no es PI con una llamada de modelo diferente debajo. Codex posee más del
bucle de modelo nativo, y OpenClaw adapta sus superficies de plugin y sesión
alrededor de ese límite.

Compatible en el runtime v1 de Codex:

| Superficie                                    | Soporte                                 | Por qué                                                                                                                                                                                               |
| -------------------------------------------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Bucle de modelo de OpenAI mediante Codex      | Compatible                              | El app-server de Codex posee el turno de OpenAI, la reanudación de hilo nativo y la continuación de herramienta nativa.                                                                                |
| Enrutamiento y entrega de canales de OpenClaw | Compatible                              | Telegram, Discord, Slack, WhatsApp, iMessage y otros canales permanecen fuera del runtime del modelo.                                                                                                  |
| Herramientas dinámicas de OpenClaw            | Compatible                              | Codex pide a OpenClaw ejecutar estas herramientas, por lo que OpenClaw permanece en la ruta de ejecución.                                                                                              |
| Plugins de prompt y contexto                  | Compatible                              | OpenClaw construye superposiciones de prompt y proyecta contexto en el turno de Codex antes de iniciar o reanudar el hilo.                                                                             |
| Ciclo de vida del motor de contexto           | Compatible                              | El ensamblado, la ingesta o mantenimiento posterior al turno, y la coordinación de Compaction del motor de contexto se ejecutan para turnos de Codex.                                                   |
| Hooks de herramientas dinámicas               | Compatible                              | `before_tool_call`, `after_tool_call` y el middleware de resultados de herramientas se ejecutan alrededor de herramientas dinámicas propiedad de OpenClaw.                                               |
| Hooks de ciclo de vida                        | Compatible como observaciones del adaptador | `llm_input`, `llm_output`, `agent_end`, `before_compaction` y `after_compaction` se disparan con cargas útiles honestas del modo Codex.                                                               |
| Puerta de revisión de respuesta final         | Compatible mediante el relé de hook nativo | Codex `Stop` se retransmite a `before_agent_finalize`; `revise` pide a Codex una pasada de modelo más antes de la finalización.                                                                       |
| Bloqueo u observación de shell, patch y MCP nativos | Compatible mediante el relé de hook nativo | Codex `PreToolUse` y `PostToolUse` se retransmiten para superficies de herramientas nativas confirmadas, incluidas cargas útiles MCP en Codex app-server `0.125.0` o posterior. Se admite el bloqueo; no la reescritura de argumentos. |
| Política de permisos nativa                   | Compatible mediante el relé de hook nativo | Codex `PermissionRequest` puede enrutarse a través de la política de OpenClaw cuando el runtime lo expone. Si OpenClaw no devuelve ninguna decisión, Codex continúa por su ruta normal de guardian o aprobación de usuario. |
| Captura de trayectoria del app-server         | Compatible                              | OpenClaw registra la solicitud que envió al app-server y las notificaciones del app-server que recibe.                                                                                                 |

No compatible en el runtime v1 de Codex:

| Superficie                                          | Límite V1                                                                                                                                       | Ruta futura                                                                               |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Mutación de argumentos de herramientas nativas      | Los hooks pre-herramienta nativos de Codex pueden bloquear, pero OpenClaw no reescribe argumentos de herramientas nativas de Codex.             | Requiere soporte de hooks/esquema de Codex para entrada de herramienta de reemplazo.       |
| Historial editable de transcripción nativa de Codex | Codex posee el historial canónico del hilo nativo. OpenClaw posee un reflejo y puede proyectar contexto futuro, pero no debe mutar elementos internos no compatibles. | Añadir APIs explícitas del app-server de Codex si se necesita cirugía del hilo nativo.     |
| `tool_result_persist` para registros de herramientas nativas de Codex | Ese hook transforma escrituras de transcripción propiedad de OpenClaw, no registros de herramientas nativas de Codex.                           | Podría reflejar registros transformados, pero la reescritura canónica necesita soporte de Codex. |
| Metadatos enriquecidos de Compaction nativa         | OpenClaw observa el inicio y la finalización de Compaction, pero no recibe una lista estable de conservados/descartados, delta de tokens ni carga útil de resumen. | Necesita eventos de Compaction de Codex más ricos.                                        |
| Intervención de Compaction                          | Los hooks actuales de Compaction de OpenClaw son de nivel notificación en modo Codex.                                                           | Añadir hooks pre/post Compaction de Codex si los plugins necesitan vetar o reescribir la Compaction nativa. |
| Captura byte por byte de la solicitud de API de modelo | OpenClaw puede capturar solicitudes y notificaciones del app-server, pero el núcleo de Codex construye internamente la solicitud final a la API de OpenAI. | Necesita un evento de trazado de solicitud de modelo de Codex o API de depuración.         |

## Herramientas, medios y Compaction

El arnés de Codex cambia únicamente el ejecutor de agente embebido de bajo nivel.

OpenClaw todavía construye la lista de herramientas y recibe resultados de herramientas dinámicas desde el
arnés. Texto, imágenes, video, música, TTS, aprobaciones y salida de herramientas de mensajería
continúan por la ruta normal de entrega de OpenClaw.

El relé de hook nativo es intencionadamente genérico, pero el contrato de soporte v1 está
limitado a las rutas de herramientas y permisos nativas de Codex que OpenClaw prueba. En
el runtime de Codex, eso incluye cargas útiles de shell, patch y MCP `PreToolUse`,
`PostToolUse` y `PermissionRequest`. No asumas que cada evento de hook futuro de
Codex es una superficie de plugin de OpenClaw hasta que el contrato de runtime lo nombre.

Para `PermissionRequest`, OpenClaw solo devuelve decisiones explícitas de permitir o denegar
cuando la política decide. Un resultado sin decisión no es una autorización. Codex lo trata como ausencia de
decisión de hook y continúa hacia su propia ruta de guardian o aprobación de usuario.

Las elicitaciones de aprobación de herramientas MCP de Codex se enrutan mediante el flujo de aprobación de
plugins de OpenClaw cuando Codex marca `_meta.codex_approval_kind` como
`"mcp_tool_call"`. Los prompts `request_user_input` de Codex se envían de vuelta al
chat de origen, y el siguiente mensaje de seguimiento en cola responde a esa solicitud del servidor
nativo en lugar de dirigirse como contexto adicional. Otras solicitudes de elicitación MCP
siguen fallando cerradas.

El direccionamiento de la cola de ejecución activa se asigna a `turn/steer` del app-server de Codex. Con el
valor predeterminado `messages.queue.mode: "steer"`, OpenClaw agrupa los mensajes de chat en cola
durante la ventana de silencio configurada y los envía como una sola solicitud `turn/steer` en
orden de llegada. El modo heredado `queue` envía solicitudes `turn/steer` separadas. Los turnos de
revisión de Codex y de compaction manual pueden rechazar el direccionamiento en el mismo turno, en cuyo caso
OpenClaw usa la cola de seguimiento cuando el modo seleccionado permite la reserva. Consulta
[Cola de direccionamiento](/es/concepts/queue-steering).

Cuando el modelo seleccionado usa el arnés de Codex, la compaction nativa de hilos se
delega al app-server de Codex. OpenClaw mantiene un espejo de transcripción para el historial de canales,
la búsqueda, `/new`, `/reset` y futuros cambios de modelo o arnés. El
espejo incluye el prompt del usuario, el texto final del asistente y registros ligeros de razonamiento
o plan de Codex cuando el app-server los emite. Hoy, OpenClaw solo
registra señales de inicio y finalización de la compaction nativa. Todavía no expone un
resumen de compaction legible por humanos ni una lista auditable de qué entradas conservó Codex
después de la compaction.

Como Codex posee el hilo nativo canónico, `tool_result_persist` no
reescribe actualmente los registros de resultados de herramientas nativos de Codex. Solo se aplica cuando
OpenClaw escribe un resultado de herramienta de transcripción de sesión propiedad de OpenClaw.

La generación de medios no requiere PI. La comprensión de imágenes, videos, música, PDF, TTS y medios
sigue usando la configuración correspondiente de proveedor/modelo, como
`agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel` y
`messages.tts`.

## Solución de problemas

**Codex no aparece como un proveedor `/model` normal:** esto es lo esperado en
configuraciones nuevas. Selecciona un modelo `openai/gpt-*` con
`agentRuntime.id: "codex"` (o una referencia heredada `codex/*`), habilita
`plugins.entries.codex.enabled` y comprueba si `plugins.allow` excluye
`codex`.

**OpenClaw usa PI en lugar de Codex:** `agentRuntime.id: "auto"` todavía puede usar PI como
backend de compatibilidad cuando ningún arnés de Codex reclama la ejecución. Establece
`agentRuntime.id: "codex"` para forzar la selección de Codex durante las pruebas. Un
runtime de Codex forzado ahora falla en lugar de recurrir a PI, salvo que
establezcas explícitamente `agentRuntime.fallback: "pi"`. Una vez seleccionado el app-server de Codex,
sus errores se muestran directamente sin configuración de reserva adicional.

**El app-server se rechaza:** actualiza Codex para que el handshake del app-server
informe la versión `0.125.0` o una posterior. Las versiones preliminares de la misma versión o con sufijo de compilación,
como `0.125.0-alpha.2` o `0.125.0+custom`, se rechazan porque el
mínimo estable del protocolo `0.125.0` es lo que prueba OpenClaw.

**El descubrimiento de modelos es lento:** reduce `plugins.entries.codex.config.discovery.timeoutMs`
o deshabilita el descubrimiento.

**El transporte WebSocket falla de inmediato:** comprueba `appServer.url`, `authToken`
y que el app-server remoto use la misma versión del protocolo app-server de Codex.

**Un modelo que no es de Codex usa PI:** esto es lo esperado salvo que hayas forzado
`agentRuntime.id: "codex"` para ese agente o seleccionado una referencia heredada
`codex/*`. Las referencias simples `openai/gpt-*` y de otros proveedores permanecen en su ruta de
proveedor normal en modo `auto`. Si fuerzas `agentRuntime.id: "codex"`, cada
turno incrustado de ese agente debe ser un modelo de OpenAI compatible con Codex.

**Computer Use está instalado, pero las herramientas no se ejecutan:** comprueba
`/codex computer-use status` desde una sesión nueva. Si una herramienta informa
`Native hook relay unavailable`, usa `/new` o `/reset`; si persiste, reinicia
el Gateway para limpiar registros obsoletos de hooks nativos. Si `computer-use.list_apps`
agota el tiempo de espera, reinicia Codex Computer Use o Codex Desktop y vuelve a intentarlo.

## Relacionado

- [Plugins de arnés de agente](/es/plugins/sdk-agent-harness)
- [Runtimes de agente](/es/concepts/agent-runtimes)
- [Proveedores de modelos](/es/concepts/model-providers)
- [Proveedor de OpenAI](/es/providers/openai)
- [Estado](/es/cli/status)
- [Hooks de Plugin](/es/plugins/hooks)
- [Referencia de configuración](/es/gateway/configuration-reference)
- [Pruebas](/es/help/testing-live#live-codex-app-server-harness-smoke)
