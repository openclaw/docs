---
read_when:
    - Quiere usar el arnés de servidor de aplicaciones de Codex incluido
    - Necesitas ejemplos de configuración del arnés de Codex
    - Quiere que los despliegues solo de Codex fallen en lugar de recurrir a PI
summary: Ejecuta turnos del agente integrado de OpenClaw mediante el arnés app-server de Codex incluido
title: Arnés de Codex
x-i18n:
    generated_at: "2026-05-11T20:43:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: 37546661dc80d8ce680c379ca2a49919b08ac24a748dc15d1478c1421e81c632
    source_path: plugins/codex-harness.md
    workflow: 16
---

El plugin `codex` incluido permite que OpenClaw ejecute turnos de agente de OpenAI integrados
a través del servidor de aplicaciones de Codex en lugar del arnés PI incorporado.

Usa el arnés de Codex cuando quieras que Codex sea dueño de la sesión de agente de bajo nivel:
reanudación nativa de hilos, continuación nativa de herramientas, compaction nativa y
ejecución en el servidor de aplicaciones. OpenClaw sigue siendo dueño de los canales de chat, los archivos de sesión, la selección de modelo, las herramientas dinámicas de OpenClaw, las aprobaciones, la entrega de medios y el reflejo visible de la transcripción.

La configuración normal usa referencias de modelo canónicas de OpenAI como `openai/gpt-5.5`.
No configures referencias de modelo `openai-codex/gpt-*`. Coloca el orden de autenticación de agente de OpenAI
en `auth.order.openai`; los perfiles antiguos `openai-codex:*` y las entradas
`auth.order.openai-codex` siguen siendo compatibles para instalaciones existentes.

OpenClaw inicia hilos del servidor de aplicaciones de Codex con el modo de código nativo de Codex y
solo modo de código habilitado. Eso mantiene las herramientas dinámicas diferidas/buscables de OpenClaw
dentro de la propia ejecución de código y superficie de búsqueda de herramientas de Codex, en lugar de añadir un
envoltorio de búsqueda de herramientas de estilo PI encima de Codex.

Para la separación más amplia entre modelo/proveedor/runtime, empieza con
[Runtimes de agente](/es/concepts/agent-runtimes). La versión corta es:
`openai/gpt-5.5` es la referencia de modelo, `codex` es el runtime, y Telegram,
Discord, Slack u otro canal sigue siendo la superficie de comunicación.

## Requisitos

- OpenClaw con el plugin `codex` incluido disponible.
- Si tu configuración usa `plugins.allow`, incluye `codex`.
- Servidor de aplicaciones de Codex `0.125.0` o posterior. El plugin incluido gestiona un binario
  compatible del servidor de aplicaciones de Codex de forma predeterminada, por lo que los comandos locales `codex` en `PATH` no
  afectan el inicio normal del arnés.
- Autenticación de Codex disponible mediante `openclaw models auth login --provider openai-codex`,
  una cuenta del servidor de aplicaciones en el directorio de inicio de Codex del agente, o un perfil de autenticación explícito
  con clave de API de Codex.

Para la precedencia de autenticación, aislamiento del entorno, comandos personalizados del servidor de aplicaciones, descubrimiento de modelos y todos los campos de configuración, consulta
[Referencia del arnés de Codex](/es/plugins/codex-harness-reference).

## Inicio rápido

La mayoría de los usuarios que quieren Codex en OpenClaw quieren esta ruta: iniciar sesión con una
suscripción ChatGPT/Codex, habilitar el plugin `codex` incluido y usar una
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

Si tu configuración usa `plugins.allow`, añade `codex` allí también:

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

Reinicia el Gateway después de cambiar la configuración del plugin. Si un chat existente ya
tiene una sesión, usa `/new` o `/reset` antes de probar cambios de runtime para que el siguiente
turno resuelva el arnés desde la configuración actual.

## Configuración

La configuración de inicio rápido es la configuración mínima viable del arnés de Codex. Establece las opciones del
arnés de Codex en la configuración de OpenClaw y usa la CLI solo para la autenticación de Codex:

| Necesidad                              | Establece                                                                        | Dónde                              |
| -------------------------------------- | -------------------------------------------------------------------------------- | ---------------------------------- |
| Habilitar el arnés                     | `plugins.entries.codex.enabled: true`                                            | Configuración de OpenClaw          |
| Mantener una instalación de plugins en lista de permitidos | Incluir `codex` en `plugins.allow`                                               | Configuración de OpenClaw          |
| Enrutar turnos de agente de OpenAI a través de Codex | `agents.defaults.model` o `agents.list[].model` como `openai/gpt-*`              | Configuración de agentes de OpenClaw |
| Iniciar sesión con OAuth de Codex      | `openclaw models auth login --provider openai-codex`                             | Perfil de autenticación de CLI     |
| Añadir respaldo de clave de API para ejecuciones de Codex | Perfil de clave de API `openai:*` listado después de la autenticación de suscripción en `auth.order.openai` | Perfil de autenticación de CLI + configuración de OpenClaw |
| Fallar cerrado cuando Codex no esté disponible | `agentRuntime.id: "codex"` del proveedor o modelo                                | Configuración de modelo/proveedor de OpenClaw |
| Usar tráfico directo de la API de OpenAI | `agentRuntime.id: "pi"` del proveedor o modelo con autenticación normal de OpenAI | Configuración de modelo/proveedor de OpenClaw |
| Ajustar el comportamiento del servidor de aplicaciones | `plugins.entries.codex.config.appServer.*`                                       | Configuración del plugin de Codex  |
| Habilitar apps nativas de plugin de Codex | `plugins.entries.codex.config.codexPlugins.*`                                    | Configuración del plugin de Codex  |
| Habilitar Codex Computer Use           | `plugins.entries.codex.config.computerUse.*`                                     | Configuración del plugin de Codex  |

Usa referencias de modelo `openai/gpt-*` para turnos de agente de OpenAI respaldados por Codex. Prefiere
`auth.order.openai` para el orden suscripción primero/respaldo de clave de API. Los perfiles de autenticación existentes
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

En esa forma, ambos perfiles siguen ejecutándose a través de Codex para turnos de agente
`openai/gpt-*`. La clave de API es solo una alternativa de autenticación, no una solicitud para cambiar a PI o
a OpenAI Responses sin envoltorio.

El resto de esta página cubre variantes comunes entre las que los usuarios deben elegir:
forma de despliegue, enrutamiento fail-closed, política de aprobación de guardian, plugins nativos de Codex
y Computer Use. Para listas completas de opciones, valores predeterminados, enumeraciones, descubrimiento,
aislamiento del entorno, tiempos de espera y campos de transporte del servidor de aplicaciones, consulta
[Referencia del arnés de Codex](/es/plugins/codex-harness-reference).

## Verificar el runtime de Codex

Usa `/status` en el chat donde esperas Codex. Un turno de agente de OpenAI respaldado por Codex
muestra:

```text
Runtime: OpenAI Codex
```

Luego comprueba el estado del servidor de aplicaciones de Codex:

```text
/codex status
/codex models
```

`/codex status` informa la conectividad del servidor de aplicaciones, la cuenta, los límites de tasa, los servidores MCP
y las skills. `/codex models` lista el catálogo en vivo del servidor de aplicaciones de Codex para
el arnés y la cuenta. Si `/status` es sorprendente, consulta
[Solución de problemas](#troubleshooting).

## Enrutamiento y selección de modelos

Mantén separadas las referencias de proveedor y la política de runtime:

- Usa `openai/gpt-*` para turnos de agente de OpenAI a través de Codex.
- No uses `openai-codex/gpt-*` en la configuración. Ejecuta `openclaw doctor --fix` para
  reparar referencias heredadas y pines obsoletos de rutas de sesión.
- `agentRuntime.id: "codex"` es opcional para el modo automático normal de OpenAI, pero útil
  cuando un despliegue debe fallar cerrado si Codex no está disponible.
- `agentRuntime.id: "pi"` opta un proveedor o modelo por comportamiento directo de PI cuando
  eso es intencional.
- `/codex ...` controla conversaciones nativas del servidor de aplicaciones de Codex desde el chat.
- ACP/acpx es una ruta de arnés externa separada. Úsala solo cuando el usuario pida
  ACP/acpx o un adaptador de arnés externo.

Enrutamiento de comandos comunes:

| Intención del usuario             | Usa                                     |
| --------------------------------- | --------------------------------------- |
| Adjuntar el chat actual           | `/codex bind [--cwd <path>]`            |
| Reanudar un hilo de Codex existente | `/codex resume <thread-id>`             |
| Listar o filtrar hilos de Codex   | `/codex threads [filter]`               |
| Enviar solo comentarios a Codex   | `/codex diagnostics [note]`             |
| Iniciar una tarea ACP/acpx        | Comandos de sesión ACP/acpx, no `/codex` |

| Caso de uso                                           | Configura                                                        | Verifica                                | Notas                              |
| ---------------------------------------------------- | ---------------------------------------------------------------- | --------------------------------------- | ---------------------------------- |
| Suscripción ChatGPT/Codex con runtime nativo de Codex | `openai/gpt-*` más el plugin `codex` habilitado                  | `/status` muestra `Runtime: OpenAI Codex` | Ruta recomendada                   |
| Fallar cerrado si Codex no está disponible            | `agentRuntime.id: "codex"` del proveedor o modelo                | El turno falla en lugar de recurrir a PI | Usar para despliegues solo Codex   |
| Tráfico directo con clave de API de OpenAI a través de PI | `agentRuntime.id: "pi"` del proveedor o modelo y autenticación normal de OpenAI | `/status` muestra el runtime PI         | Usar solo cuando PI sea intencional |
| Configuración heredada                                | `openai-codex/gpt-*`                                             | `openclaw doctor --fix` la reescribe    | No escribas configuración nueva de esta forma |
| Adaptador ACP/acpx de Codex                           | ACP `sessions_spawn({ runtime: "acp" })`                         | Estado de tarea/sesión ACP              | Separado del arnés nativo de Codex |

`agents.defaults.imageModel` sigue la misma separación de prefijos. Usa `openai/gpt-*`
para la ruta normal de OpenAI y `codex/gpt-*` solo cuando la comprensión de imágenes
deba ejecutarse a través de un turno delimitado del servidor de aplicaciones de Codex. No uses
`openai-codex/gpt-*`; doctor reescribe ese prefijo heredado a `openai/gpt-*`.

## Patrones de despliegue

### Despliegue básico de Codex

Usa la configuración de inicio rápido cuando todos los turnos de agente de OpenAI deban usar Codex de forma
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

Con esta configuración, el agente `main` usa su ruta de proveedor normal y el agente
`codex` usa el servidor de aplicaciones de Codex.

### Despliegue de Codex fail-closed

Para turnos de agente de OpenAI, `openai/gpt-*` ya se resuelve a Codex cuando el
plugin incluido está disponible. Añade una política de runtime explícita cuando quieras una regla
fail-closed escrita:

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

Con Codex forzado, OpenClaw falla pronto si el plugin de Codex está deshabilitado, el
servidor de aplicaciones es demasiado antiguo o el servidor de aplicaciones no puede iniciarse.

## Política del servidor de aplicaciones

De forma predeterminada, el plugin inicia localmente el binario gestionado de Codex de OpenClaw con transporte
stdio. Establece `appServer.command` solo cuando quieras ejecutar intencionalmente un
ejecutable diferente. Usa transporte WebSocket solo cuando un servidor de aplicaciones ya esté
ejecutándose en otro lugar:

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

Las sesiones locales stdio de app-server usan de forma predeterminada la postura de operador local de confianza:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` y
`sandbox: "danger-full-access"`. Si los requisitos locales de Codex no permiten esa
postura YOLO implícita, OpenClaw selecciona en su lugar los permisos guardian permitidos.
Cuando un sandbox de OpenClaw está activo para la sesión, OpenClaw reduce
`danger-full-access` de Codex a `workspace-write` de Codex para que los turnos nativos de modo de código de Codex
permanezcan dentro del espacio de trabajo en sandbox.

Usa el modo guardian cuando quieras la revisión automática nativa de Codex antes de escapes del sandbox
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

El modo guardian se expande a aprobaciones del app-server de Codex, normalmente
`approvalPolicy: "on-request"`, `approvalsReviewer: "auto_review"` y
`sandbox: "workspace-write"` cuando los requisitos locales permiten esos valores.

Para todos los campos del app-server, el orden de autenticación, el aislamiento de entorno, el descubrimiento y
el comportamiento de tiempo de espera, consulta la [referencia del arnés de Codex](/es/plugins/codex-harness-reference).

## Comandos y diagnósticos

El plugin incluido registra `/codex` como comando de barra en cualquier canal que
admita comandos de texto de OpenClaw.

Formas comunes:

- `/codex status` comprueba la conectividad del app-server, los modelos, la cuenta, los límites de tasa,
  los servidores MCP y las Skills.
- `/codex models` enumera los modelos en vivo del app-server de Codex.
- `/codex threads [filter]` enumera los hilos recientes del app-server de Codex.
- `/codex resume <thread-id>` adjunta la sesión actual de OpenClaw a un
  hilo de Codex existente.
- `/codex compact` solicita al app-server de Codex que compacte el hilo adjunto.
- `/codex review` inicia la revisión nativa de Codex para el hilo adjunto.
- `/codex diagnostics [note]` solicita confirmación antes de enviar comentarios de Codex para el
  hilo adjunto.
- `/codex account` muestra el estado de la cuenta y los límites de tasa.
- `/codex mcp` enumera el estado de los servidores MCP del app-server de Codex.
- `/codex skills` enumera las Skills del app-server de Codex.

Para la mayoría de los informes de soporte, empieza con `/diagnostics [note]` en la conversación
donde ocurrió el error. Crea un informe de diagnósticos del Gateway y, para las sesiones del
arnés de Codex, solicita aprobación para enviar el paquete de comentarios relevante de Codex.
Consulta [Exportación de diagnósticos](/es/gateway/diagnostics) para ver el modelo de privacidad y el comportamiento en
chats grupales.

Usa `/codex diagnostics [note]` solo cuando quieras específicamente la carga de comentarios de Codex
para el hilo actualmente adjunto sin el paquete completo de diagnósticos del Gateway.

### Inspeccionar hilos de Codex localmente

La forma más rápida de inspeccionar una ejecución incorrecta de Codex suele ser abrir directamente el hilo nativo de Codex:

```bash
codex resume <thread-id>
```

Obtén el id del hilo desde la respuesta completada de `/diagnostics`, `/codex binding` o
`/codex threads [filter]`.

Para la mecánica de carga y los límites de diagnóstico a nivel de runtime, consulta
[runtime del arnés Codex](/es/plugins/codex-harness-runtime#codex-feedback-upload).

La autenticación se selecciona en este orden:

1. Perfiles de autenticación de OpenAI ordenados para el agente, preferentemente en
   `auth.order.openai`. Los ids de perfiles `openai-codex:*` existentes siguen siendo válidos.
2. La cuenta existente del servidor de aplicación en el Codex home de ese agente.
3. Solo para lanzamientos locales del servidor de aplicación por stdio, `CODEX_API_KEY`, luego
   `OPENAI_API_KEY`, cuando no hay una cuenta de servidor de aplicación presente y la autenticación de OpenAI
   sigue siendo necesaria.

Cuando OpenClaw detecta un perfil de autenticación de Codex de estilo suscripción de ChatGPT, elimina
`CODEX_API_KEY` y `OPENAI_API_KEY` del proceso hijo de Codex generado. Eso
mantiene las claves de API a nivel de Gateway disponibles para embeddings o modelos directos de OpenAI
sin hacer que los turnos nativos del servidor de aplicación de Codex se facturen por la API accidentalmente.
Los perfiles explícitos de clave de API de Codex y el fallback local de clave de entorno por stdio usan el inicio de sesión
del servidor de aplicación en lugar del entorno heredado del proceso hijo. Las conexiones WebSocket del servidor de aplicación
no reciben el fallback de clave de API de entorno del Gateway; usa un perfil de autenticación explícito o la
cuenta propia del servidor de aplicación remoto.

Si un perfil de suscripción alcanza un límite de uso de Codex, OpenClaw registra la hora de restablecimiento
cuando Codex informa una e intenta el siguiente perfil de autenticación ordenado para la misma
ejecución de Codex. Cuando pasa la hora de restablecimiento, el perfil de suscripción vuelve a ser elegible
sin cambiar el modelo `openai/gpt-*` seleccionado ni el runtime de Codex.

Si un despliegue necesita aislamiento adicional del entorno, agrega esas variables a
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

`appServer.clearEnv` solo afecta al proceso hijo del servidor de aplicación de Codex generado.

Las herramientas dinámicas de Codex usan de forma predeterminada la carga `searchable`. OpenClaw no expone
herramientas dinámicas que duplican operaciones de espacio de trabajo nativas de Codex: `read`, `write`,
`edit`, `apply_patch`, `exec`, `process` y `update_plan`. Las integraciones restantes de OpenClaw,
como mensajería, sesiones, medios, cron, navegador, nodos,
gateway, `heartbeat_respond` y `web_search`, están disponibles mediante la búsqueda de herramientas de Codex
en el namespace `openclaw`, lo que mantiene más pequeño el contexto inicial del modelo.
`sessions_yield` y las respuestas de origen solo de herramientas de mensajes siguen siendo directas porque esos
son contratos de control de turnos. Las instrucciones de colaboración de Heartbeat indican a Codex que
busque `heartbeat_respond` antes de finalizar un turno de Heartbeat cuando la herramienta no
está ya cargada.

Configura `codexDynamicToolsLoading: "direct"` solo al conectarte a un servidor de aplicación de Codex personalizado
que no pueda buscar herramientas dinámicas diferidas o al depurar el payload completo
de herramientas.

Campos de Plugin de Codex de nivel superior admitidos:

| Campo                      | Predeterminado | Significado                                                                                  |
| -------------------------- | -------------- | ---------------------------------------------------------------------------------------- |
| `codexDynamicToolsLoading` | `"searchable"` | Usa `"direct"` para colocar las herramientas dinámicas de OpenClaw directamente en el contexto inicial de herramientas de Codex. |
| `codexDynamicToolsExclude` | `[]`           | Nombres adicionales de herramientas dinámicas de OpenClaw que se omitirán en los turnos del servidor de aplicación de Codex.              |
| `codexPlugins`             | deshabilitado  | Compatibilidad nativa de plugins/aplicaciones de Codex para plugins seleccionados instalados desde fuente y migrados.           |

Campos `appServer` admitidos:

| Campo                         | Predeterminado                                        | Significado                                                                                                                                                                                                                                 |
| ----------------------------- | ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                   | `"stdio"`                                              | `"stdio"` genera Codex; `"websocket"` se conecta a `url`.                                                                                                                                                                                |
| `command`                     | binario de Codex administrado                          | Ejecutable para el transporte stdio. Déjalo sin configurar para usar el binario administrado; configúralo solo para una sobrescritura explícita.                                                                                                                            |
| `args`                        | `["app-server", "--listen", "stdio://"]`               | Argumentos para el transporte stdio.                                                                                                                                                                                                          |
| `url`                         | sin configurar                                         | URL WebSocket del servidor de aplicación.                                                                                                                                                                                                               |
| `authToken`                   | sin configurar                                         | Token Bearer para el transporte WebSocket.                                                                                                                                                                                                   |
| `headers`                     | `{}`                                                   | Encabezados WebSocket adicionales.                                                                                                                                                                                                                |
| `clearEnv`                    | `[]`                                                   | Nombres adicionales de variables de entorno eliminadas del proceso del servidor de aplicación stdio generado después de que OpenClaw construye su entorno heredado. `CODEX_HOME` y `HOME` están reservados para el aislamiento de Codex por agente de OpenClaw en lanzamientos locales.    |
| `requestTimeoutMs`            | `60000`                                                | Tiempo de espera para llamadas del plano de control del servidor de aplicación.                                                                                                                                                                                             |
| `turnCompletionIdleTimeoutMs` | `60000`                                                | Ventana sin actividad después de una solicitud del servidor de aplicación de Codex con alcance de turno mientras OpenClaw espera `turn/completed`. Auméntala para fases lentas posteriores a herramientas o de síntesis solo de estado.                                                                     |
| `mode`                        | `"yolo"` a menos que los requisitos locales de Codex no permitan YOLO | Preajuste para ejecución YOLO o revisada por guardián. Los requisitos locales de stdio que omiten `danger-full-access`, la aprobación `never` o el revisor `user` hacen que el valor predeterminado implícito sea guardián.                                                   |
| `approvalPolicy`              | `"never"` o una política de aprobación de guardián permitida | Política de aprobación nativa de Codex enviada al iniciar/reanudar hilo/turno. Los valores predeterminados de guardián prefieren `"on-request"` cuando está permitido.                                                                                                                    |
| `sandbox`                     | `"danger-full-access"` o un sandbox de guardián permitido | Modo sandbox nativo de Codex enviado al iniciar/reanudar hilo. Los valores predeterminados de guardián prefieren `"workspace-write"` cuando está permitido; si no, `"read-only"`. Cuando un sandbox de OpenClaw está activo, `danger-full-access` se restringe a `"workspace-write"`. |
| `approvalsReviewer`           | `"user"` o un revisor de guardián permitido            | Usa `"auto_review"` para permitir que Codex revise prompts de aprobación nativos cuando esté permitido; de lo contrario, `guardian_subagent` o `user`. `guardian_subagent` sigue siendo un alias heredado.                                                                      |
| `serviceTier`                 | sin configurar                                         | Nivel de servicio opcional del servidor de aplicación de Codex. `"priority"` habilita el enrutamiento de modo rápido, `"flex"` solicita procesamiento flex, `null` borra la sobrescritura y el valor heredado `"fast"` se acepta como `"priority"`.                                         |

Las llamadas dinámicas a herramientas propiedad de OpenClaw están limitadas de forma independiente de
`appServer.requestTimeoutMs`: las solicitudes Codex `item/tool/call` usan un watchdog de OpenClaw de 30 segundos
de forma predeterminada. Un argumento positivo `timeoutMs` por llamada amplía
o acorta el presupuesto específico de esa herramienta. La herramienta `image_generate` también usa
`agents.defaults.imageGenerationModel.timeoutMs` cuando la llamada a la herramienta no
proporciona su propio tiempo de espera, y la herramienta `image` de comprensión de medios usa
`tools.media.image.timeoutSeconds` o su valor predeterminado de 60 segundos para medios. Los presupuestos de herramientas
dinámicas están limitados a 600000 ms. En caso de timeout, OpenClaw aborta la señal de la herramienta
cuando se admite y devuelve una respuesta fallida de herramienta dinámica a Codex para que el turno
pueda continuar en lugar de dejar la sesión en `processing`.

Después de que OpenClaw responde a una solicitud de app-server con alcance de turno de Codex, el harness
también espera que Codex termine el turno nativo con `turn/completed`. Si el
app-server queda en silencio durante `appServer.turnCompletionIdleTimeoutMs` después de esa
respuesta, OpenClaw interrumpe el turno de Codex en la medida de lo posible, registra un timeout
de diagnóstico y libera el carril de sesión de OpenClaw para que los mensajes de chat de seguimiento no queden
encolados detrás de un turno nativo obsoleto. Cualquier notificación no terminal para el
mismo turno, incluida `rawResponseItem/completed`, desactiva ese watchdog corto
porque Codex ha demostrado que el turno sigue vivo; el watchdog terminal más largo
sigue protegiendo los turnos realmente atascados. Los diagnósticos de timeout incluyen el
último método de notificación del app-server y, para los elementos de respuesta raw del asistente, el
tipo de elemento, rol, id y una vista previa acotada del texto del asistente.

Las sobrescrituras de entorno siguen disponibles para pruebas locales:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN` omite el binario gestionado cuando
`appServer.command` no está configurado.

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` se eliminó. Usa
`plugins.entries.codex.config.appServer.mode: "guardian"` en su lugar, o
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` para pruebas locales puntuales. Se
prefiere la configuración para despliegues repetibles porque mantiene el comportamiento del plugin en el
mismo archivo revisado que el resto de la configuración del harness de Codex.

## Plugins nativos de Codex

El soporte de plugins nativos de Codex usa las propias capacidades de app y plugin
del app-server de Codex en el mismo hilo de Codex que el turno del harness de OpenClaw. OpenClaw
no traduce plugins de Codex a herramientas dinámicas sintéticas de OpenClaw
`codex_plugin_*`.

`codexPlugins` solo afecta a las sesiones que seleccionan el harness nativo de Codex. No
tiene efecto en ejecuciones de PI, ejecuciones normales del proveedor OpenAI, bindings de conversación
ACP ni otros harnesses.

Configuración migrada mínima:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          codexPlugins: {
            enabled: true,
            allow_destructive_actions: false,
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

La configuración de apps del hilo se calcula cuando OpenClaw establece una sesión de harness de Codex
o reemplaza un binding obsoleto de hilo de Codex. No se vuelve a calcular en cada turno.
Después de cambiar `codexPlugins`, usa `/new`, `/reset` o reinicia el gateway para que
las futuras sesiones del harness de Codex comiencen con el conjunto de apps actualizado.

Para elegibilidad de migración, inventario de apps, política de acciones destructivas,
elicitaciones y diagnósticos de plugins nativos, consulta
[Plugins nativos de Codex](/es/plugins/codex-native-plugins).

## Computer Use

Computer Use se cubre en su propia guía de configuración:
[Codex Computer Use](/es/plugins/codex-computer-use).

La versión corta: OpenClaw no incluye como vendor la app de control de escritorio ni ejecuta
acciones de escritorio por sí mismo. Prepara el app-server de Codex, verifica que el
servidor MCP `computer-use` esté disponible y luego deja que Codex sea dueño de las llamadas
nativas a herramientas MCP durante turnos en modo Codex.

## Límites de runtime

El harness de Codex cambia únicamente el ejecutor de agente embebido de bajo nivel.

- Se admiten herramientas dinámicas de OpenClaw. Codex le pide a OpenClaw que ejecute esas
  herramientas, por lo que OpenClaw permanece en la ruta de ejecución.
- Codex es dueño de las herramientas nativas de shell, patch, MCP y apps nativas.
  OpenClaw puede observar o bloquear eventos nativos seleccionados a través del relay
  admitido, pero no reescribe argumentos de herramientas nativas.
- Codex es dueño de la compaction nativa. OpenClaw mantiene un espejo de transcripción para el historial
  del canal, búsqueda, `/new`, `/reset` y cambios futuros de modelo o harness.
- La generación de medios, comprensión de medios, TTS, aprobaciones y salida de herramientas de mensajería
  continúan a través de la configuración correspondiente de proveedor/modelo de OpenClaw.
- `tool_result_persist` se aplica a resultados de herramientas de transcripción propiedad de OpenClaw, no
  a registros de resultados de herramientas nativas de Codex.

Para capas de hook, superficies V1 admitidas, gestión de permisos nativos, dirección de colas,
mecánica de subida de feedback de Codex y detalles de compaction, consulta
[Runtime del harness de Codex](/es/plugins/codex-harness-runtime).

## Solución de problemas

**Codex no aparece como un proveedor `/model` normal:** eso es lo esperado para
configuraciones nuevas. Selecciona un modelo `openai/gpt-*`, habilita
`plugins.entries.codex.enabled` y comprueba si `plugins.allow` excluye
`codex`.

**OpenClaw usa PI en lugar de Codex:** asegúrate de que la referencia de modelo sea
`openai/gpt-*` en el proveedor oficial OpenAI y de que el plugin Codex esté
instalado y habilitado. Si necesitas prueba estricta durante las pruebas, configura en el proveedor o
modelo `agentRuntime.id: "codex"`. Un runtime Codex forzado falla en lugar de
volver a PI.

**La configuración heredada `openai-codex/*` permanece:** ejecuta `openclaw doctor --fix`.
Doctor reescribe las referencias de modelo heredadas a `openai/*`, elimina pines obsoletos de runtime
de sesión y de agente completo, y preserva las sobrescrituras de perfil de autenticación existentes.

**El app-server es rechazado:** usa Codex app-server `0.125.0` o una versión más reciente.
Las prereleases de la misma versión o versiones con sufijo de build, como
`0.125.0-alpha.2` o `0.125.0+custom`, se rechazan porque OpenClaw prueba el
piso de protocolo estable `0.125.0`.

**`/codex status` no puede conectarse:** comprueba que el plugin `codex` incluido esté
habilitado, que `plugins.allow` lo incluya cuando se configure una allowlist y
que cualquier `appServer.command`, `url`, `authToken` o encabezados personalizados sean válidos.

**El descubrimiento de modelos es lento:** reduce
`plugins.entries.codex.config.discovery.timeoutMs` o deshabilita el descubrimiento. Consulta
[Referencia del harness de Codex](/es/plugins/codex-harness-reference#model-discovery).

**El transporte WebSocket falla inmediatamente:** comprueba `appServer.url`, `authToken`,
los encabezados y que el app-server remoto use la misma versión del protocolo de app-server
de Codex.

**Un modelo que no es Codex usa PI:** eso es lo esperado salvo que la política de runtime
del proveedor o del modelo lo enrute a otro harness. Las referencias sencillas de proveedores que no son OpenAI permanecen en
su ruta normal de proveedor en modo `auto`.

**Computer Use está instalado pero las herramientas no se ejecutan:** comprueba
`/codex computer-use status` desde una sesión nueva. Si una herramienta informa
`Native hook relay unavailable`, usa `/new` o `/reset`; si persiste, reinicia
el gateway para borrar registros obsoletos de hooks nativos. Consulta
[Codex Computer Use](/es/plugins/codex-computer-use#troubleshooting).

## Relacionado

- [Referencia del harness de Codex](/es/plugins/codex-harness-reference)
- [Runtime del harness de Codex](/es/plugins/codex-harness-runtime)
- [Plugins nativos de Codex](/es/plugins/codex-native-plugins)
- [Codex Computer Use](/es/plugins/codex-computer-use)
- [Runtimes de agentes](/es/concepts/agent-runtimes)
- [Proveedores de modelos](/es/concepts/model-providers)
- [Proveedor OpenAI](/es/providers/openai)
- [Plugins de harness de agente](/es/plugins/sdk-agent-harness)
- [Hooks de Plugin](/es/plugins/hooks)
- [Exportación de diagnósticos](/es/gateway/diagnostics)
- [Estado](/es/cli/status)
- [Pruebas](/es/help/testing-live#live-codex-app-server-harness-smoke)
