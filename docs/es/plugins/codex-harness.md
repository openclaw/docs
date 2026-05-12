---
read_when:
    - Quieres usar el arnés de servidor de aplicaciones de Codex incluido
    - Necesitas ejemplos de configuración del harness de Codex
    - Desea que los despliegues solo con Codex fallen en lugar de recurrir a PI
summary: Ejecuta turnos de agentes integrados de OpenClaw mediante el arnés app-server de Codex incluido
title: Arnés de Codex
x-i18n:
    generated_at: "2026-05-12T00:58:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: 273572d7b7f3b6c57ddd0de38ce467463e9f1f0eab66dc7e2c38fa7679cb0359
    source_path: plugins/codex-harness.md
    workflow: 16
---

El plugin `codex` incluido permite que OpenClaw ejecute turnos de agente de OpenAI integrados
a través del servidor de aplicación de Codex en lugar del harness PI incorporado.

Usa el harness de Codex cuando quieras que Codex controle la sesión de agente de bajo nivel:
reanudación nativa de hilos, continuación nativa de herramientas, compactación nativa y
ejecución en el servidor de aplicación. OpenClaw sigue controlando los canales de chat, los archivos de sesión, la selección de modelos, las herramientas dinámicas de OpenClaw, las aprobaciones, la entrega de medios y el espejo visible de la transcripción.

La configuración normal usa referencias canónicas de modelos de OpenAI como `openai/gpt-5.5`.
No configures referencias de modelo `openai-codex/gpt-*`. Coloca el orden de autenticación de agentes de OpenAI
en `auth.order.openai`; los perfiles antiguos `openai-codex:*` y las entradas
`auth.order.openai-codex` siguen siendo compatibles con instalaciones existentes.

OpenClaw inicia hilos del servidor de aplicación de Codex con el modo de código nativo de Codex y
solo modo de código habilitado. Eso mantiene las herramientas dinámicas diferidas/buscables de OpenClaw
dentro de la propia superficie de ejecución de código y búsqueda de herramientas de Codex, en lugar de añadir un
contenedor de búsqueda de herramientas estilo PI sobre Codex.

Para la separación más amplia entre modelo/proveedor/entorno de ejecución, empieza con
[Entornos de ejecución de agentes](/es/concepts/agent-runtimes). La versión breve es:
`openai/gpt-5.5` es la referencia del modelo, `codex` es el entorno de ejecución, y Telegram,
Discord, Slack u otro canal sigue siendo la superficie de comunicación.

## Requisitos

- OpenClaw con el plugin `codex` incluido disponible.
- Si tu configuración usa `plugins.allow`, incluye `codex`.
- Servidor de aplicación de Codex `0.125.0` o posterior. El plugin incluido gestiona de forma predeterminada un binario compatible del servidor de aplicación de Codex, por lo que los comandos locales `codex` en `PATH` no
  afectan el inicio normal del harness.
- Autenticación de Codex disponible mediante `openclaw models auth login --provider openai-codex`,
  una cuenta del servidor de aplicación en el directorio inicial de Codex del agente, o un perfil explícito de autenticación de Codex con clave de API.

Para la precedencia de autenticación, el aislamiento de entorno, comandos personalizados del servidor de aplicación, descubrimiento de modelos y todos los campos de configuración, consulta la
[Referencia del harness de Codex](/es/plugins/codex-harness-reference).

## Inicio rápido

La mayoría de los usuarios que quieren Codex en OpenClaw quieren esta ruta: iniciar sesión con una
suscripción de ChatGPT/Codex, habilitar el plugin `codex` incluido y usar una
referencia de modelo canónica `openai/gpt-*`.

Inicia sesión con OAuth de Codex:

```bash
openclaw models auth login --provider openai-codex
```

Habilita el plugin `codex` incluido y selecciona un modelo de agente de OpenAI:

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
    },
  },
}
```

Si tu configuración usa `plugins.allow`, añade también `codex` allí:

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

Reinicia el gateway después de cambiar la configuración del plugin. Si un chat existente ya
tiene una sesión, usa `/new` o `/reset` antes de probar cambios de entorno de ejecución para que el siguiente
turno resuelva el harness desde la configuración actual.

## Configuración

La configuración de inicio rápido es la configuración mínima viable del harness de Codex. Define las opciones del
harness de Codex en la configuración de OpenClaw y usa la CLI solo para la autenticación de Codex:

| Necesidad                              | Define                                                                           | Dónde                              |
| -------------------------------------- | -------------------------------------------------------------------------------- | ---------------------------------- |
| Habilitar el harness                   | `plugins.entries.codex.enabled: true`                                            | Configuración de OpenClaw          |
| Mantener una instalación de plugin en lista de permitidos | Incluye `codex` en `plugins.allow`                                  | Configuración de OpenClaw          |
| Enrutar turnos de agentes de OpenAI a través de Codex | `agents.defaults.model` o `agents.list[].model` como `openai/gpt-*` | Configuración de agentes de OpenClaw |
| Iniciar sesión con OAuth de Codex      | `openclaw models auth login --provider openai-codex`                             | Perfil de autenticación de CLI     |
| Añadir respaldo con clave de API para ejecuciones de Codex | perfil de clave de API `openai:*` listado después de la autenticación por suscripción en `auth.order.openai` | Perfil de autenticación de CLI + configuración de OpenClaw |
| Fallar de forma cerrada cuando Codex no esté disponible | `agentRuntime.id: "codex"` del proveedor o modelo                    | Configuración de modelo/proveedor de OpenClaw |
| Usar tráfico directo de la API de OpenAI | `agentRuntime.id: "pi"` del proveedor o modelo con autenticación normal de OpenAI | Configuración de modelo/proveedor de OpenClaw |
| Ajustar el comportamiento del servidor de aplicación | `plugins.entries.codex.config.appServer.*`                         | Configuración del plugin Codex     |
| Habilitar aplicaciones de plugin nativas de Codex | `plugins.entries.codex.config.codexPlugins.*`                         | Configuración del plugin Codex     |
| Habilitar Computer Use de Codex        | `plugins.entries.codex.config.computerUse.*`                                     | Configuración del plugin Codex     |

Usa referencias de modelo `openai/gpt-*` para turnos de agentes de OpenAI respaldados por Codex. Prefiere
`auth.order.openai` para ordenar primero la suscripción y luego el respaldo con clave de API. Los perfiles de autenticación existentes
`openai-codex:*` y `auth.order.openai-codex` siguen siendo válidos, pero
no escribas nuevas referencias de modelo `openai-codex/gpt-*`.

```json5
{
  auth: {
    order: {
      openai: ["openai-codex:user@example.com", "openai:api-key-backup"],
    },
  },
}
```

Con esa forma, ambos perfiles siguen ejecutándose a través de Codex para turnos de agente
`openai/gpt-*`. La clave de API es solo una alternativa de autenticación, no una solicitud para cambiar a PI o
a OpenAI Responses simple.

El resto de esta página cubre variantes comunes entre las que los usuarios deben elegir:
forma de despliegue, enrutamiento con fallo cerrado, política de aprobación de guardian, plugins nativos de Codex
y Computer Use. Para listas completas de opciones, valores predeterminados, enums, descubrimiento,
aislamiento de entorno, tiempos de espera y campos de transporte del servidor de aplicación, consulta la
[Referencia del harness de Codex](/es/plugins/codex-harness-reference).

## Verificar el entorno de ejecución de Codex

Usa `/status` en el chat donde esperas Codex. Un turno de agente de OpenAI respaldado por Codex
muestra:

```text
Runtime: OpenAI Codex
```

Luego comprueba el estado del servidor de aplicación de Codex:

```text
/codex status
/codex models
```

`/codex status` informa conectividad del servidor de aplicación, cuenta, límites de velocidad, servidores MCP
y Skills. `/codex models` lista el catálogo en vivo del servidor de aplicación de Codex para
el harness y la cuenta. Si `/status` es inesperado, consulta
[Solución de problemas](#troubleshooting).

## Enrutamiento y selección de modelos

Mantén separadas las referencias de proveedor y la política de entorno de ejecución:

- Usa `openai/gpt-*` para turnos de agentes de OpenAI a través de Codex.
- No uses `openai-codex/gpt-*` en la configuración. Ejecuta `openclaw doctor --fix` para
  reparar referencias heredadas y pines obsoletos de rutas de sesión.
- `agentRuntime.id: "codex"` es opcional para el modo automático normal de OpenAI, pero útil
  cuando un despliegue debe fallar de forma cerrada si Codex no está disponible.
- `agentRuntime.id: "pi"` opta a un proveedor o modelo por el comportamiento directo de PI cuando
  eso es intencional.
- `/codex ...` controla conversaciones nativas del servidor de aplicación de Codex desde el chat.
- ACP/acpx es una ruta de harness externa separada. Úsala solo cuando el usuario pida
  ACP/acpx o un adaptador de harness externo.

Enrutamiento común de comandos:

| Intención del usuario             | Usa                                     |
| --------------------------------- | --------------------------------------- |
| Adjuntar el chat actual           | `/codex bind [--cwd <path>]`            |
| Reanudar un hilo de Codex existente | `/codex resume <thread-id>`           |
| Listar o filtrar hilos de Codex   | `/codex threads [filter]`               |
| Enviar solo comentarios de Codex  | `/codex diagnostics [note]`             |
| Iniciar una tarea ACP/acpx        | Comandos de sesión ACP/acpx, no `/codex` |

| Caso de uso                                           | Configura                                                        | Verifica                                | Notas                              |
| ---------------------------------------------------- | ---------------------------------------------------------------- | --------------------------------------- | ---------------------------------- |
| Suscripción ChatGPT/Codex con entorno de ejecución nativo de Codex | `openai/gpt-*` más el plugin `codex` habilitado | `/status` muestra `Runtime: OpenAI Codex` | Ruta recomendada                   |
| Fallar de forma cerrada si Codex no está disponible  | `agentRuntime.id: "codex"` del proveedor o modelo                | El turno falla en lugar de recurrir a PI | Úsalo para despliegues solo con Codex |
| Tráfico directo con clave de API de OpenAI a través de PI | `agentRuntime.id: "pi"` del proveedor o modelo y autenticación normal de OpenAI | `/status` muestra el entorno de ejecución PI | Úsalo solo cuando PI sea intencional |
| Configuración heredada                               | `openai-codex/gpt-*`                                             | `openclaw doctor --fix` la reescribe    | No escribas nueva configuración de este modo |
| Adaptador ACP/acpx de Codex                          | ACP `sessions_spawn({ runtime: "acp" })`                         | Estado de tarea/sesión ACP              | Separado del harness nativo de Codex |

`agents.defaults.imageModel` sigue la misma separación por prefijos. Usa `openai/gpt-*`
para la ruta normal de OpenAI y `codex/gpt-*` solo cuando la comprensión de imágenes
deba ejecutarse a través de un turno acotado del servidor de aplicación de Codex. No uses
`openai-codex/gpt-*`; doctor reescribe ese prefijo heredado a `openai/gpt-*`.

## Patrones de despliegue

### Despliegue básico de Codex

Usa la configuración de inicio rápido cuando todos los turnos de agentes de OpenAI deban usar Codex de forma
predeterminada.

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
    },
  },
}
```

### Despliegue con proveedores mixtos

Esta forma mantiene Claude como agente predeterminado y añade un agente Codex con nombre:

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
      model: "anthropic/claude-opus-4-6",
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
      },
    ],
  },
}
```

Con esta configuración, el agente `main` usa su ruta normal de proveedor y el agente
`codex` usa el servidor de aplicación de Codex.

### Despliegue de Codex con fallo cerrado

Para turnos de agentes de OpenAI, `openai/gpt-*` ya se resuelve a Codex cuando el
plugin incluido está disponible. Añade una política explícita de entorno de ejecución cuando quieras una regla escrita
de fallo cerrado:

```json5
{
  models: {
    providers: {
      openai: {
        agentRuntime: {
          id: "codex",
        },
      },
    },
  },
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
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

Con Codex forzado, OpenClaw falla temprano si el plugin Codex está deshabilitado, el
servidor de aplicación es demasiado antiguo o el servidor de aplicación no puede iniciar.

## Política del servidor de aplicación

De forma predeterminada, el plugin inicia localmente el binario de Codex gestionado por OpenClaw con transporte
stdio. Define `appServer.command` solo cuando intencionalmente quieras ejecutar un
ejecutable diferente. Usa transporte WebSocket solo cuando un servidor de aplicación ya se esté
ejecutando en otro lugar:

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
            authToken: "${CODEX_APP_SERVER_TOKEN}",
          },
        },
      },
    },
  },
}
```

Las sesiones locales de app-server por stdio usan por defecto la postura de operador local de confianza:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` y
`sandbox: "danger-full-access"`. Si los requisitos locales de Codex no permiten esa
postura YOLO implícita, OpenClaw selecciona en su lugar permisos guardian permitidos.
Cuando hay un sandbox de OpenClaw activo para la sesión, OpenClaw reduce Codex
`danger-full-access` a Codex `workspace-write` para que los turnos nativos de modo código de Codex
permanezcan dentro del espacio de trabajo en sandbox.

Usa el modo guardian cuando quieras auto-revisión nativa de Codex antes de escapes del sandbox
o permisos adicionales:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            mode: "guardian",
            serviceTier: "priority",
          },
        },
      },
    },
  },
}
```

El modo guardian se expande a aprobaciones de app-server de Codex, normalmente
`approvalPolicy: "on-request"`, `approvalsReviewer: "auto_review"` y
`sandbox: "workspace-write"` cuando los requisitos locales permiten esos valores.

Para cada campo de app-server, orden de autenticación, aislamiento de entorno, detección y
comportamiento de timeout, consulta la [referencia del harness de Codex](/es/plugins/codex-harness-reference).

## Comandos y diagnósticos

El plugin incluido registra `/codex` como comando slash en cualquier canal que
admita comandos de texto de OpenClaw.

Formas comunes:

- `/codex status` comprueba la conectividad del app-server, modelos, cuenta, límites de tasa,
  servidores MCP y Skills.
- `/codex models` lista los modelos en vivo del app-server de Codex.
- `/codex threads [filter]` lista los hilos recientes del app-server de Codex.
- `/codex resume <thread-id>` adjunta la sesión actual de OpenClaw a un
  hilo de Codex existente.
- `/codex compact` pide al app-server de Codex que compacte el hilo adjunto.
- `/codex review` inicia la revisión nativa de Codex para el hilo adjunto.
- `/codex diagnostics [note]` pregunta antes de enviar feedback de Codex para el
  hilo adjunto.
- `/codex account` muestra el estado de la cuenta y los límites de tasa.
- `/codex mcp` lista el estado de los servidores MCP del app-server de Codex.
- `/codex skills` lista las Skills del app-server de Codex.

Para la mayoría de informes de soporte, empieza con `/diagnostics [note]` en la conversación
donde ocurrió el bug. Crea un informe de diagnósticos de Gateway y, para sesiones del
harness de Codex, pide aprobación para enviar el paquete de feedback relevante de Codex.
Consulta [Exportación de diagnósticos](/es/gateway/diagnostics) para ver el modelo de privacidad y el comportamiento
en chats de grupo.

Usa `/codex diagnostics [note]` solo cuando quieras específicamente la subida de
feedback de Codex para el hilo actualmente adjunto sin el paquete completo de
diagnósticos de Gateway.

### Inspeccionar hilos de Codex localmente

La forma más rápida de inspeccionar una ejecución defectuosa de Codex suele ser abrir el hilo
nativo de Codex directamente:

```bash
codex resume <thread-id>
```

Obtén el id del hilo desde la respuesta completada de `/diagnostics`, `/codex binding` o
`/codex threads [filter]`.

Para la mecánica de subida y los límites de diagnósticos a nivel de runtime, consulta
[runtime del harness de Codex](/es/plugins/codex-harness-runtime#codex-feedback-upload).

La autenticación se selecciona en este orden:

1. Perfiles de autenticación de OpenAI ordenados para el agente, preferiblemente bajo
   `auth.order.openai`. Los ids de perfil `openai-codex:*` existentes siguen siendo válidos.
2. La cuenta existente del app-server en el home de Codex de ese agente.
3. Solo para lanzamientos locales del app-server por stdio, `CODEX_API_KEY`, luego
   `OPENAI_API_KEY`, cuando no hay ninguna cuenta de app-server presente y la autenticación de OpenAI
   sigue siendo necesaria.

Cuando OpenClaw ve un perfil de autenticación de Codex de estilo suscripción de ChatGPT, elimina
`CODEX_API_KEY` y `OPENAI_API_KEY` del proceso hijo de Codex generado. Eso
mantiene las claves de API a nivel de Gateway disponibles para embeddings o modelos directos de OpenAI
sin hacer que los turnos nativos del app-server de Codex se facturen accidentalmente por la API.
Los perfiles explícitos de clave de API de Codex y el fallback de clave de entorno por stdio local usan inicio de sesión de app-server
en lugar de entorno heredado del proceso hijo. Las conexiones WebSocket de app-server
no reciben fallback de clave de API de entorno de Gateway; usa un perfil de autenticación explícito o la
propia cuenta del app-server remoto.

Si un perfil de suscripción alcanza un límite de uso de Codex, OpenClaw registra la hora de restablecimiento
cuando Codex informa una y prueba el siguiente perfil de autenticación ordenado para la misma
ejecución de Codex. Cuando pasa la hora de restablecimiento, el perfil de suscripción vuelve a ser elegible
sin cambiar el modelo `openai/gpt-*` seleccionado ni el runtime de Codex.

Si una implementación necesita aislamiento de entorno adicional, agrega esas variables a
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

`appServer.clearEnv` solo afecta al proceso hijo del app-server de Codex generado.

Las herramientas dinámicas de Codex usan por defecto carga `searchable`. OpenClaw no expone
herramientas dinámicas que duplican operaciones nativas de espacio de trabajo de Codex: `read`, `write`,
`edit`, `apply_patch`, `exec`, `process` y `update_plan`. Las herramientas restantes de integración de OpenClaw,
como mensajería, sesiones, medios, Cron, navegador, nodos,
Gateway, `heartbeat_respond` y `web_search`, están disponibles mediante la búsqueda de herramientas de Codex
bajo el espacio de nombres `openclaw`, manteniendo más pequeño el contexto inicial del modelo.
`sessions_yield` y las respuestas de origen solo de herramienta de mensajes se mantienen directas porque esos
son contratos de control de turno. Las instrucciones de colaboración de Heartbeat indican a Codex que
busque `heartbeat_respond` antes de finalizar un turno de Heartbeat cuando la herramienta
aún no está cargada.

Configura `codexDynamicToolsLoading: "direct"` solo al conectarte a un app-server de Codex
personalizado que no pueda buscar herramientas dinámicas diferidas o al depurar la carga útil completa
de herramientas.

Campos superiores compatibles del plugin de Codex:

| Campo                      | Predeterminado | Significado                                                                                  |
| -------------------------- | -------------- | ---------------------------------------------------------------------------------------- |
| `codexDynamicToolsLoading` | `"searchable"` | Usa `"direct"` para colocar las herramientas dinámicas de OpenClaw directamente en el contexto inicial de herramientas de Codex. |
| `codexDynamicToolsExclude` | `[]`           | Nombres adicionales de herramientas dinámicas de OpenClaw que se omitirán en los turnos del app-server de Codex.              |
| `codexPlugins`             | deshabilitado  | Soporte nativo de plugin/app de Codex para plugins seleccionados instalados desde fuente y migrados.           |

Campos `appServer` compatibles:

| Campo                         | Predeterminado                                        | Significado                                                                                                                                                                                                                                 |
| ----------------------------- | ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                   | `"stdio"`                                              | `"stdio"` genera Codex; `"websocket"` se conecta a `url`.                                                                                                                                                                                |
| `command`                     | binario administrado de Codex                          | Ejecutable para el transporte stdio. Déjalo sin configurar para usar el binario administrado; configúralo solo para una sobrescritura explícita.                                                                                                                            |
| `args`                        | `["app-server", "--listen", "stdio://"]`               | Argumentos para el transporte stdio.                                                                                                                                                                                                          |
| `url`                         | sin configurar                                         | URL WebSocket del app-server.                                                                                                                                                                                                               |
| `authToken`                   | sin configurar                                         | Token bearer para el transporte WebSocket.                                                                                                                                                                                                   |
| `headers`                     | `{}`                                                   | Headers WebSocket adicionales.                                                                                                                                                                                                                |
| `clearEnv`                    | `[]`                                                   | Nombres adicionales de variables de entorno eliminados del proceso stdio de app-server generado después de que OpenClaw construye su entorno heredado. `CODEX_HOME` y `HOME` están reservados para el aislamiento de Codex por agente de OpenClaw en lanzamientos locales.    |
| `requestTimeoutMs`            | `60000`                                                | Timeout para llamadas de plano de control de app-server.                                                                                                                                                                                             |
| `turnCompletionIdleTimeoutMs` | `60000`                                                | Ventana silenciosa después de una solicitud de app-server de Codex con alcance de turno mientras OpenClaw espera `turn/completed`. Auméntala para fases lentas de síntesis posteriores a herramientas o solo de estado.                                                                     |
| `mode`                        | `"yolo"` salvo que los requisitos locales de Codex no permitan YOLO | Preajuste para ejecución YOLO o revisada por guardian. Los requisitos locales por stdio que omiten `danger-full-access`, aprobación `never` o el revisor `user` hacen que el valor predeterminado implícito sea guardian.                                                   |
| `approvalPolicy`              | `"never"` o una política de aprobación guardian permitida | Política de aprobación nativa de Codex enviada al inicio/reanudación/turno del hilo. Los valores predeterminados de guardian prefieren `"on-request"` cuando está permitido.                                                                                                                    |
| `sandbox`                     | `"danger-full-access"` o un sandbox guardian permitido | Modo de sandbox nativo de Codex enviado al inicio/reanudación del hilo. Los valores predeterminados de guardian prefieren `"workspace-write"` cuando está permitido; de lo contrario, `"read-only"`. Cuando hay un sandbox de OpenClaw activo, `danger-full-access` se reduce a `"workspace-write"`. |
| `approvalsReviewer`           | `"user"` o un revisor guardian permitido               | Usa `"auto_review"` para permitir que Codex revise prompts de aprobación nativos cuando está permitido; de lo contrario, `guardian_subagent` o `user`. `guardian_subagent` sigue siendo un alias heredado.                                                                      |
| `serviceTier`                 | sin configurar                                         | Nivel de servicio opcional del app-server de Codex. `"priority"` habilita enrutamiento de modo rápido, `"flex"` solicita procesamiento flex, `null` borra la sobrescritura y el valor heredado `"fast"` se acepta como `"priority"`.                                         |

Las llamadas a herramientas dinámicas propiedad de OpenClaw están limitadas de forma independiente de
`appServer.requestTimeoutMs`: las solicitudes Codex `item/tool/call` usan un watchdog de OpenClaw de 30 segundos
de forma predeterminada. Un argumento positivo `timeoutMs` por llamada amplía
o acorta el presupuesto de esa herramienta específica. La herramienta `image_generate` también usa
`agents.defaults.imageGenerationModel.timeoutMs` cuando la llamada a la herramienta no
proporciona su propio tiempo de espera, y la herramienta `image` de comprensión de medios usa
`tools.media.image.timeoutSeconds` o su valor predeterminado de medios de 60 segundos. Los presupuestos de herramientas dinámicas
están limitados a 600000 ms. Al agotarse el tiempo de espera, OpenClaw aborta la señal de la herramienta
donde sea compatible y devuelve una respuesta fallida de herramienta dinámica a Codex para que el turno
pueda continuar en lugar de dejar la sesión en `processing`.

Después de que OpenClaw responde a una solicitud de app-server con alcance de turno de Codex, el harness
también espera que Codex termine el turno nativo con `turn/completed`. Si el
app-server queda en silencio durante `appServer.turnCompletionIdleTimeoutMs` después de esa
respuesta, OpenClaw interrumpe el turno de Codex con el mejor esfuerzo, registra un tiempo de espera de diagnóstico
y libera el carril de sesión de OpenClaw para que los mensajes de chat de seguimiento no queden
en cola detrás de un turno nativo obsoleto. Cualquier notificación no terminal para el
mismo turno, incluida `rawResponseItem/completed`, desactiva ese watchdog breve
porque Codex ha demostrado que el turno sigue vivo; el watchdog terminal más largo
sigue protegiendo los turnos realmente atascados. Los diagnósticos de tiempo de espera incluyen el
último método de notificación del app-server y, para los elementos de respuesta sin procesar del asistente, el
tipo de elemento, rol, id y una vista previa acotada del texto del asistente.

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
prefiere la configuración para despliegues repetibles porque mantiene el comportamiento del plugin en el
mismo archivo revisado que el resto de la configuración del harness de Codex.

## Plugins nativos de Codex

La compatibilidad con plugins nativos de Codex usa las capacidades propias de app y plugin del app-server de Codex
en el mismo hilo de Codex que el turno del harness de OpenClaw. OpenClaw
no traduce los plugins de Codex a herramientas dinámicas sintéticas `codex_plugin_*` de OpenClaw.

`codexPlugins` afecta solo a las sesiones que seleccionan el harness nativo de Codex. No
tiene efecto en ejecuciones de PI, ejecuciones normales del proveedor OpenAI, vinculaciones de conversación
ACP ni otros harnesses.

Configuración mínima migrada:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          codexPlugins: {
            enabled: true,
            allow_destructive_actions: true,
            plugins: {
              "google-calendar": {
                enabled: true,
                marketplaceName: "openai-curated",
                pluginName: "google-calendar",
              },
            },
          },
        },
      },
    },
  },
}
```

La configuración de app del hilo se calcula cuando OpenClaw establece una sesión del harness de Codex
o reemplaza una vinculación obsoleta de hilo de Codex. No se vuelve a calcular en cada turno.
Después de cambiar `codexPlugins`, usa `/new`, `/reset` o reinicia el Gateway para que
las futuras sesiones del harness de Codex comiencen con el conjunto de apps actualizado.

Para elegibilidad de migración, inventario de apps, política de acciones destructivas,
solicitudes, y diagnósticos de plugins nativos, consulta
[plugins nativos de Codex](/es/plugins/codex-native-plugins).

## Computer Use

Computer Use se cubre en su propia guía de configuración:
[Codex Computer Use](/es/plugins/codex-computer-use).

La versión corta: OpenClaw no vendeoriza la app de control de escritorio ni ejecuta
acciones de escritorio por sí mismo. Prepara el app-server de Codex, verifica que el
servidor MCP `computer-use` esté disponible y luego deja que Codex posea las llamadas nativas a herramientas MCP
durante turnos en modo Codex.

## Límites de runtime

El harness de Codex cambia solo el ejecutor de agente incrustado de bajo nivel.

- Las herramientas dinámicas de OpenClaw son compatibles. Codex pide a OpenClaw ejecutar esas
  herramientas, así que OpenClaw permanece en la ruta de ejecución.
- Las herramientas nativas de shell, patch, MCP y app de Codex son propiedad de Codex.
  OpenClaw puede observar o bloquear eventos nativos seleccionados mediante el relay compatible,
  pero no reescribe los argumentos de herramientas nativas.
- Codex posee la Compaction nativa. OpenClaw mantiene un espejo de transcripción para el historial de canal,
  búsqueda, `/new`, `/reset` y cambios futuros de modelo o harness.
- La generación de medios, comprensión de medios, TTS, aprobaciones y salida de herramientas de mensajería
  continúan mediante la configuración correspondiente de proveedor/modelo de OpenClaw.
- `tool_result_persist` se aplica a los resultados de herramientas de transcripción propiedad de OpenClaw, no
  a registros de resultados de herramientas nativas de Codex.

Para capas de hook, superficies V1 compatibles, manejo nativo de permisos, enrutamiento de cola,
mecánica de subida de comentarios de Codex y detalles de Compaction, consulta
[runtime del harness de Codex](/es/plugins/codex-harness-runtime).

## Solución de problemas

**Codex no aparece como un proveedor `/model` normal:** esto es lo esperado para
configuraciones nuevas. Selecciona un modelo `openai/gpt-*`, habilita
`plugins.entries.codex.enabled` y comprueba si `plugins.allow` excluye
`codex`.

**OpenClaw usa PI en lugar de Codex:** asegúrate de que la referencia de modelo sea
`openai/gpt-*` en el proveedor oficial de OpenAI y de que el plugin de Codex esté
instalado y habilitado. Si necesitas una prueba estricta durante las pruebas, establece el proveedor o
modelo `agentRuntime.id: "codex"`. Un runtime de Codex forzado falla en lugar de
recurrir a PI.

**Permanece configuración heredada `openai-codex/*`:** ejecuta `openclaw doctor --fix`.
Doctor reescribe referencias de modelo heredadas a `openai/*`, elimina pines obsoletos de sesión y
runtime de agente completo, y preserva las anulaciones de perfil de autenticación existentes.

**El app-server es rechazado:** usa Codex app-server `0.125.0` o posterior.
Las versiones preliminares de la misma versión o versiones con sufijo de compilación como
`0.125.0-alpha.2` o `0.125.0+custom` se rechazan porque OpenClaw prueba el
piso del protocolo estable `0.125.0`.

**`/codex status` no puede conectar:** comprueba que el plugin `codex` incluido esté
habilitado, que `plugins.allow` lo incluya cuando haya una allowlist configurada, y
que cualquier `appServer.command`, `url`, `authToken` o encabezados personalizados sean válidos.

**El descubrimiento de modelos es lento:** reduce
`plugins.entries.codex.config.discovery.timeoutMs` o deshabilita el descubrimiento. Consulta
[referencia del harness de Codex](/es/plugins/codex-harness-reference#model-discovery).

**El transporte WebSocket falla de inmediato:** comprueba `appServer.url`, `authToken`,
encabezados, y que el app-server remoto hable la misma versión del protocolo app-server de Codex.

**Un modelo que no es Codex usa PI:** esto es lo esperado salvo que la política de runtime del proveedor
o modelo lo dirija a otro harness. Las referencias simples de proveedores que no son OpenAI permanecen en
su ruta de proveedor normal en modo `auto`.

**Computer Use está instalado pero las herramientas no se ejecutan:** comprueba
`/codex computer-use status` desde una sesión nueva. Si una herramienta informa
`Native hook relay unavailable`, usa `/new` o `/reset`; si persiste, reinicia
el Gateway para limpiar registros nativos de hook obsoletos. Consulta
[Codex Computer Use](/es/plugins/codex-computer-use#troubleshooting).

## Relacionado

- [referencia del harness de Codex](/es/plugins/codex-harness-reference)
- [runtime del harness de Codex](/es/plugins/codex-harness-runtime)
- [plugins nativos de Codex](/es/plugins/codex-native-plugins)
- [Codex Computer Use](/es/plugins/codex-computer-use)
- [runtimes de agente](/es/concepts/agent-runtimes)
- [proveedores de modelos](/es/concepts/model-providers)
- [proveedor OpenAI](/es/providers/openai)
- [plugins de harness de agente](/es/plugins/sdk-agent-harness)
- [hooks de Plugin](/es/plugins/hooks)
- [exportación de diagnósticos](/es/gateway/diagnostics)
- [estado](/es/cli/status)
- [pruebas](/es/help/testing-live#live-codex-app-server-harness-smoke)
