---
read_when:
    - Desea usar el arnés de app-server de Codex incluido
    - Necesitas ejemplos de configuración del arnés de Codex
    - Desea que las implementaciones solo con Codex fallen en lugar de recurrir a PI
summary: Ejecuta turnos de agente integrado de OpenClaw mediante el arnés app-server de Codex incluido
title: Arnés de Codex
x-i18n:
    generated_at: "2026-05-12T08:45:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 62023998d817a557bd6434e3ab47f3b99b97fdea93a8984b78b7bd1738a61f92
    source_path: plugins/codex-harness.md
    workflow: 16
---

El Plugin `codex` incluido permite que OpenClaw ejecute turnos de agente OpenAI integrados
a través del app-server de Codex en lugar del arnés PI integrado.

Usa el arnés de Codex cuando quieras que Codex posea la sesión de agente de bajo nivel:
reanudación nativa de hilos, continuación nativa de herramientas, compactación nativa y
ejecución del app-server. OpenClaw sigue siendo propietario de los canales de chat, archivos de sesión, selección de modelo, herramientas dinámicas de OpenClaw, aprobaciones, entrega de medios y el espejo visible de la transcripción.

La configuración normal usa referencias de modelo canónicas de OpenAI como `openai/gpt-5.5`.
No configures referencias de modelo `openai-codex/gpt-*`. Coloca el orden de autenticación de agente OpenAI
bajo `auth.order.openai`; los perfiles antiguos `openai-codex:*` y las entradas
`auth.order.openai-codex` siguen siendo compatibles para instalaciones existentes.

OpenClaw inicia hilos del app-server de Codex con el modo de código nativo de Codex y
solo modo de código habilitados. Eso mantiene las herramientas dinámicas de OpenClaw diferidas/buscables
dentro de la propia ejecución de código de Codex y la superficie de búsqueda de herramientas, en lugar de añadir un
envoltorio de búsqueda de herramientas estilo PI encima de Codex.

Para la división más amplia entre modelo/proveedor/tiempo de ejecución, empieza con
[Entornos de ejecución de agentes](/es/concepts/agent-runtimes). La versión corta es:
`openai/gpt-5.5` es la referencia de modelo, `codex` es el tiempo de ejecución, y Telegram,
Discord, Slack u otro canal sigue siendo la superficie de comunicación.

## Requisitos

- OpenClaw con el Plugin `codex` incluido disponible.
- Si tu configuración usa `plugins.allow`, incluye `codex`.
- App-server de Codex `0.125.0` o posterior. El Plugin incluido gestiona un binario
  compatible del app-server de Codex de forma predeterminada, por lo que los comandos locales `codex` en `PATH` no
  afectan al inicio normal del arnés.
- Autenticación de Codex disponible mediante `openclaw models auth login --provider openai-codex`,
  una cuenta de app-server en el directorio de inicio de Codex del agente, o un perfil de autenticación explícito de clave de API
  de Codex.

Para precedencia de autenticación, aislamiento de entorno, comandos personalizados del app-server, descubrimiento de modelos
y todos los campos de configuración, consulta la
[Referencia del arnés de Codex](/es/plugins/codex-harness-reference).

## Inicio rápido

La mayoría de los usuarios que quieren Codex en OpenClaw quieren esta ruta: iniciar sesión con una
suscripción de ChatGPT/Codex, habilitar el Plugin `codex` incluido y usar una
referencia de modelo canónica `openai/gpt-*`.

Inicia sesión con OAuth de Codex:

```bash
openclaw models auth login --provider openai-codex
```

Habilita el Plugin `codex` incluido y selecciona un modelo de agente OpenAI:

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

Reinicia el Gateway después de cambiar la configuración de Plugins. Si un chat existente ya
tiene una sesión, usa `/new` o `/reset` antes de probar cambios de tiempo de ejecución para que el siguiente
turno resuelva el arnés desde la configuración actual.

## Configuración

La configuración de inicio rápido es la configuración mínima viable del arnés de Codex. Define las opciones del
arnés de Codex en la configuración de OpenClaw y usa la CLI solo para la autenticación de Codex:

| Necesidad                              | Definir                                                                          | Dónde                              |
| -------------------------------------- | -------------------------------------------------------------------------------- | ---------------------------------- |
| Habilitar el arnés                     | `plugins.entries.codex.enabled: true`                                            | Configuración de OpenClaw          |
| Mantener una instalación de Plugins permitidos | Incluir `codex` en `plugins.allow`                                               | Configuración de OpenClaw          |
| Enrutar turnos de agente OpenAI a través de Codex | `agents.defaults.model` o `agents.list[].model` como `openai/gpt-*`              | Configuración de agente OpenClaw   |
| Iniciar sesión con OAuth de Codex      | `openclaw models auth login --provider openai-codex`                             | Perfil de autenticación CLI        |
| Añadir respaldo de clave de API para ejecuciones de Codex | Perfil de clave de API `openai:*` listado después de la autenticación por suscripción en `auth.order.openai` | Perfil de autenticación CLI + configuración de OpenClaw |
| Fallar en cerrado cuando Codex no esté disponible | Proveedor o modelo `agentRuntime.id: "codex"`                                    | Configuración de modelo/proveedor de OpenClaw |
| Usar tráfico directo de API de OpenAI  | Proveedor o modelo `agentRuntime.id: "pi"` con autenticación normal de OpenAI     | Configuración de modelo/proveedor de OpenClaw |
| Ajustar el comportamiento del app-server | `plugins.entries.codex.config.appServer.*`                                       | Configuración del Plugin Codex     |
| Habilitar aplicaciones Plugin nativas de Codex | `plugins.entries.codex.config.codexPlugins.*`                                    | Configuración del Plugin Codex     |
| Habilitar Codex Computer Use           | `plugins.entries.codex.config.computerUse.*`                                     | Configuración del Plugin Codex     |

Usa referencias de modelo `openai/gpt-*` para turnos de agente OpenAI respaldados por Codex. Prefiere
`auth.order.openai` para el orden suscripción primero/respaldo por clave de API. Los perfiles de autenticación existentes
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
`openai/gpt-*`. La clave de API es solo una alternativa de autenticación, no una solicitud para cambiar a PI ni a
OpenAI Responses sin formato.

El resto de esta página cubre variantes comunes entre las que los usuarios deben elegir:
forma de despliegue, enrutamiento de fallo en cerrado, política de aprobación del guardián, Plugins nativos de Codex
y Computer Use. Para listas completas de opciones, valores predeterminados, enumeraciones, descubrimiento,
aislamiento de entorno, tiempos de espera y campos de transporte del app-server, consulta la
[Referencia del arnés de Codex](/es/plugins/codex-harness-reference).

## Verificar el tiempo de ejecución de Codex

Usa `/status` en el chat donde esperas Codex. Un turno de agente OpenAI respaldado por Codex
muestra:

```text
Runtime: OpenAI Codex
```

Luego comprueba el estado del app-server de Codex:

```text
/codex status
/codex models
```

`/codex status` informa la conectividad del app-server, la cuenta, los límites de tasa, los servidores MCP
y Skills. `/codex models` lista el catálogo activo del app-server de Codex para
el arnés y la cuenta. Si `/status` resulta inesperado, consulta
[Solución de problemas](#troubleshooting).

## Enrutamiento y selección de modelo

Mantén separadas las referencias de proveedor y la política de tiempo de ejecución:

- Usa `openai/gpt-*` para turnos de agente OpenAI a través de Codex.
- No uses `openai-codex/gpt-*` en la configuración. Ejecuta `openclaw doctor --fix` para
  reparar referencias heredadas y pines obsoletos de ruta de sesión.
- `agentRuntime.id: "codex"` es opcional para el modo automático normal de OpenAI, pero útil
  cuando un despliegue debe fallar en cerrado si Codex no está disponible.
- `agentRuntime.id: "pi"` opta un proveedor o modelo al comportamiento directo de PI cuando
  eso es intencional.
- `/codex ...` controla conversaciones nativas del app-server de Codex desde el chat.
- ACP/acpx es una ruta de arnés externo independiente. Úsala solo cuando el usuario pida
  ACP/acpx o un adaptador de arnés externo.

Enrutamiento de comandos común:

| Intención del usuario           | Usar                                    |
| ------------------------------- | --------------------------------------- |
| Adjuntar el chat actual         | `/codex bind [--cwd <path>]`            |
| Reanudar un hilo de Codex existente | `/codex resume <thread-id>`             |
| Listar o filtrar hilos de Codex | `/codex threads [filter]`               |
| Enviar solo comentarios a Codex | `/codex diagnostics [note]`             |
| Iniciar una tarea ACP/acpx      | Comandos de sesión ACP/acpx, no `/codex` |

| Caso de uso                                          | Configurar                                                       | Verificar                               | Notas                              |
| ---------------------------------------------------- | ---------------------------------------------------------------- | --------------------------------------- | ---------------------------------- |
| Suscripción ChatGPT/Codex con tiempo de ejecución nativo de Codex | `openai/gpt-*` más el Plugin `codex` habilitado                  | `/status` muestra `Runtime: OpenAI Codex` | Ruta recomendada                   |
| Fallar en cerrado si Codex no está disponible        | Proveedor o modelo `agentRuntime.id: "codex"`                    | El turno falla en lugar de usar alternativa PI | Usar para despliegues solo Codex   |
| Tráfico directo con clave de API de OpenAI a través de PI | Proveedor o modelo `agentRuntime.id: "pi"` y autenticación normal de OpenAI | `/status` muestra tiempo de ejecución PI | Usar solo cuando PI sea intencional |
| Configuración heredada                               | `openai-codex/gpt-*`                                             | `openclaw doctor --fix` la reescribe    | No escribas nueva configuración así |
| Adaptador Codex ACP/acpx                             | ACP `sessions_spawn({ runtime: "acp" })`                         | Estado de tarea/sesión ACP              | Independiente del arnés nativo de Codex |

`agents.defaults.imageModel` sigue la misma división de prefijos. Usa `openai/gpt-*`
para la ruta normal de OpenAI y `codex/gpt-*` solo cuando la comprensión de imágenes
deba ejecutarse a través de un turno acotado del app-server de Codex. No uses
`openai-codex/gpt-*`; doctor reescribe ese prefijo heredado a `openai/gpt-*`.

## Patrones de despliegue

### Despliegue básico de Codex

Usa la configuración de inicio rápido cuando todos los turnos de agente OpenAI deban usar Codex de forma
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
`codex` usa el app-server de Codex.

### Despliegue Codex con fallo en cerrado

Para turnos de agente OpenAI, `openai/gpt-*` ya se resuelve a Codex cuando el
Plugin incluido está disponible. Añade una política explícita de tiempo de ejecución cuando quieras una regla escrita
de fallo en cerrado:

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

Con Codex forzado, OpenClaw falla temprano si el Plugin Codex está deshabilitado, el
app-server es demasiado antiguo o el app-server no puede iniciarse.

## Política del app-server

De forma predeterminada, el Plugin inicia localmente el binario de Codex gestionado por OpenClaw con transporte
stdio. Define `appServer.command` solo cuando quieras ejecutar intencionalmente un
ejecutable diferente. Usa transporte WebSocket solo cuando ya haya un app-server
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

Las sesiones locales de app-server stdio usan de forma predeterminada la postura de operador local de confianza:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` y
`sandbox: "danger-full-access"`. Si los requisitos locales de Codex no permiten esa
postura YOLO implícita, OpenClaw selecciona en su lugar los permisos guardian permitidos.
Cuando un sandbox de OpenClaw está activo para la sesión, OpenClaw reduce
`danger-full-access` de Codex a `workspace-write` de Codex para que los turnos nativos
de code-mode de Codex permanezcan dentro del espacio de trabajo en sandbox.

Usa el modo guardian cuando quieras auto-revisión nativa de Codex antes de escapes
del sandbox o permisos adicionales:

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

Para cada campo de app-server, orden de autenticación, aislamiento de entorno, descubrimiento y
comportamiento de timeout, consulta la [referencia del harness de Codex](/es/plugins/codex-harness-reference).

## Comandos y diagnósticos

El plugin incluido registra `/codex` como comando slash en cualquier canal que
admita comandos de texto de OpenClaw.

Formas comunes:

- `/codex status` comprueba la conectividad de app-server, modelos, cuenta, límites de tasa,
  servidores MCP y skills.
- `/codex models` enumera los modelos activos de app-server de Codex.
- `/codex threads [filter]` enumera los hilos recientes de app-server de Codex.
- `/codex resume <thread-id>` adjunta la sesión actual de OpenClaw a un
  hilo existente de Codex.
- `/codex compact` pide al app-server de Codex que compacte el hilo adjunto.
- `/codex review` inicia la revisión nativa de Codex para el hilo adjunto.
- `/codex diagnostics [note]` pide confirmación antes de enviar feedback de Codex para el
  hilo adjunto.
- `/codex account` muestra el estado de la cuenta y de los límites de tasa.
- `/codex mcp` enumera el estado de los servidores MCP de app-server de Codex.
- `/codex skills` enumera las skills de app-server de Codex.

Para la mayoría de informes de soporte, empieza con `/diagnostics [note]` en la conversación
donde ocurrió el bug. Crea un informe de diagnósticos de Gateway y, para sesiones del
harness de Codex, pide aprobación para enviar el paquete de feedback relevante de Codex.
Consulta [Exportación de diagnósticos](/es/gateway/diagnostics) para ver el modelo de privacidad y el comportamiento en
chats de grupo.

Usa `/codex diagnostics [note]` solo cuando quieras específicamente la subida de
feedback de Codex para el hilo adjunto actualmente sin el paquete completo de
diagnósticos de Gateway.

### Inspeccionar hilos de Codex localmente

La forma más rápida de inspeccionar una ejecución defectuosa de Codex suele ser abrir directamente
el hilo nativo de Codex:

```bash
codex resume <thread-id>
```

Obtén el id del hilo desde la respuesta completada de `/diagnostics`, `/codex binding` o
`/codex threads [filter]`.

Para la mecánica de subida y los límites de diagnóstico a nivel de runtime, consulta
[Runtime del harness de Codex](/es/plugins/codex-harness-runtime#codex-feedback-upload).

La autenticación se selecciona en este orden:

1. Perfiles de autenticación de OpenAI ordenados para el agente, preferiblemente bajo
   `auth.order.openai`. Los ids de perfil existentes `openai-codex:*` siguen siendo válidos.
2. La cuenta existente de app-server en el home de Codex de ese agente.
3. Solo para lanzamientos locales de app-server stdio, `CODEX_API_KEY`, luego
   `OPENAI_API_KEY`, cuando no hay cuenta de app-server presente y la autenticación de OpenAI
   sigue siendo necesaria.

Cuando OpenClaw detecta un perfil de autenticación de Codex de tipo suscripción de ChatGPT, elimina
`CODEX_API_KEY` y `OPENAI_API_KEY` del proceso hijo de Codex generado. Eso
mantiene las claves de API a nivel de Gateway disponibles para embeddings o modelos directos de OpenAI
sin hacer que los turnos nativos de app-server de Codex se facturen por la API accidentalmente.
Los perfiles explícitos de clave de API de Codex y el fallback local de clave en entorno stdio usan el inicio de sesión de app-server
en lugar del entorno heredado del proceso hijo. Las conexiones WebSocket de app-server
no reciben el fallback de clave de API en entorno de Gateway; usa un perfil de autenticación explícito o la
propia cuenta del app-server remoto.

Si un perfil de suscripción alcanza un límite de uso de Codex, OpenClaw registra la hora de restablecimiento
cuando Codex informa una y prueba el siguiente perfil de autenticación ordenado para la misma
ejecución de Codex. Cuando pasa la hora de restablecimiento, el perfil de suscripción vuelve a ser elegible
sin cambiar el modelo `openai/gpt-*` seleccionado ni el runtime de Codex.

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

`appServer.clearEnv` solo afecta al proceso hijo de app-server de Codex generado.

Las herramientas dinámicas de Codex usan de forma predeterminada la carga `searchable`. OpenClaw no expone
herramientas dinámicas que duplican operaciones nativas de workspace de Codex: `read`, `write`,
`edit`, `apply_patch`, `exec`, `process` y `update_plan`. Las herramientas de integración restantes de OpenClaw,
como mensajería, sesiones, medios, cron, navegador, nodos,
gateway, `heartbeat_respond` y `web_search`, están disponibles mediante búsqueda de herramientas de Codex
bajo el espacio de nombres `openclaw`, lo que mantiene más pequeño el contexto inicial del modelo.
`sessions_yield` y las respuestas de origen solo de herramientas de mensaje permanecen directas porque esos
son contratos de control de turno. Las instrucciones de colaboración de Heartbeat indican a Codex que
busque `heartbeat_respond` antes de terminar un turno de heartbeat cuando la herramienta
aún no está cargada.

Establece `codexDynamicToolsLoading: "direct"` solo al conectarte a un app-server de Codex
personalizado que no pueda buscar herramientas dinámicas diferidas o al depurar la carga completa
de herramientas.

Campos de plugin de Codex de nivel superior admitidos:

| Campo                      | Predeterminado | Significado                                                                                  |
| -------------------------- | -------------- | ---------------------------------------------------------------------------------------- |
| `codexDynamicToolsLoading` | `"searchable"` | Usa `"direct"` para poner las herramientas dinámicas de OpenClaw directamente en el contexto inicial de herramientas de Codex. |
| `codexDynamicToolsExclude` | `[]`           | Nombres adicionales de herramientas dinámicas de OpenClaw que se omitirán en los turnos de app-server de Codex.              |
| `codexPlugins`             | deshabilitado  | Compatibilidad nativa de plugins/apps de Codex para plugins seleccionados migrados instalados desde código fuente.           |

Campos `appServer` admitidos:

| Campo                         | Predeterminado                                        | Significado                                                                                                                                                                                                                                 |
| ----------------------------- | ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                   | `"stdio"`                                              | `"stdio"` genera Codex; `"websocket"` se conecta a `url`.                                                                                                                                                                                |
| `command`                     | binario de Codex gestionado                            | Ejecutable para transporte stdio. Déjalo sin definir para usar el binario gestionado; establécelo solo para una anulación explícita.                                                                                                                            |
| `args`                        | `["app-server", "--listen", "stdio://"]`               | Argumentos para transporte stdio.                                                                                                                                                                                                          |
| `url`                         | sin definir                                            | URL de app-server WebSocket.                                                                                                                                                                                                               |
| `authToken`                   | sin definir                                            | Token Bearer para transporte WebSocket.                                                                                                                                                                                                   |
| `headers`                     | `{}`                                                   | Headers WebSocket adicionales.                                                                                                                                                                                                                |
| `clearEnv`                    | `[]`                                                   | Nombres de variables de entorno adicionales eliminados del proceso de app-server stdio generado después de que OpenClaw construya su entorno heredado. `CODEX_HOME` y `HOME` están reservados para el aislamiento de Codex por agente de OpenClaw en lanzamientos locales.    |
| `requestTimeoutMs`            | `60000`                                                | Timeout para llamadas de plano de control de app-server.                                                                                                                                                                                             |
| `turnCompletionIdleTimeoutMs` | `60000`                                                | Ventana silenciosa después de una solicitud de app-server de Codex con alcance de turno mientras OpenClaw espera `turn/completed`. Aumenta esto para fases lentas posteriores a herramientas o de síntesis solo de estado.                                                                     |
| `mode`                        | `"yolo"` salvo que los requisitos locales de Codex no permitan YOLO | Preset para ejecución YOLO o revisada por guardian. Los requisitos locales de stdio que omiten `danger-full-access`, aprobación `never` o el revisor `user` hacen que el valor predeterminado implícito sea guardian.                                                   |
| `approvalPolicy`              | `"never"` o una política de aprobación guardian permitida | Política de aprobación nativa de Codex enviada al iniciar/reanudar hilo/turno. Los valores predeterminados guardian prefieren `"on-request"` cuando está permitido.                                                                                                                    |
| `sandbox`                     | `"danger-full-access"` o un sandbox guardian permitido  | Modo sandbox nativo de Codex enviado al iniciar/reanudar hilo. Los valores predeterminados guardian prefieren `"workspace-write"` cuando está permitido; de lo contrario, `"read-only"`. Cuando un sandbox de OpenClaw está activo, `danger-full-access` se reduce a `"workspace-write"`. |
| `approvalsReviewer`           | `"user"` o un revisor guardian permitido               | Usa `"auto_review"` para permitir que Codex revise prompts de aprobación nativos cuando esté permitido; de lo contrario, `guardian_subagent` o `user`. `guardian_subagent` sigue siendo un alias heredado.                                                                      |
| `serviceTier`                 | sin definir                                            | Nivel de servicio opcional de app-server de Codex. `"priority"` habilita el enrutamiento fast-mode, `"flex"` solicita procesamiento flex, `null` borra la anulación y el valor heredado `"fast"` se acepta como `"priority"`.                                         |

Las llamadas a herramientas dinámicas propiedad de OpenClaw están limitadas de forma independiente de
`appServer.requestTimeoutMs`: las solicitudes Codex `item/tool/call` usan un watchdog de OpenClaw de 30 segundos
de forma predeterminada. Un argumento positivo `timeoutMs` por llamada extiende
o acorta ese presupuesto específico de herramienta. La herramienta `image_generate` también usa
`agents.defaults.imageGenerationModel.timeoutMs` cuando la llamada a la herramienta no
proporciona su propio tiempo de espera, y la herramienta `image` de comprensión de medios usa
`tools.media.image.timeoutSeconds` o su valor predeterminado de medios de 60 segundos. Los presupuestos de herramientas
dinámicas tienen un límite de 600000 ms. Al agotarse el tiempo de espera, OpenClaw aborta la señal de la herramienta
cuando es compatible y devuelve una respuesta de herramienta dinámica fallida a Codex para que el turno
pueda continuar en lugar de dejar la sesión en `processing`.

Después de que OpenClaw responde a una solicitud de app-server con ámbito de turno de Codex, el harness
también espera que Codex finalice el turno nativo con `turn/completed`. Si el
app-server queda en silencio durante `appServer.turnCompletionIdleTimeoutMs` después de esa
respuesta, OpenClaw interrumpe el turno de Codex con el mejor esfuerzo, registra un tiempo de espera
de diagnóstico y libera el carril de sesión de OpenClaw para que los mensajes de chat de seguimiento no queden
en cola detrás de un turno nativo obsoleto. Cualquier notificación no terminal para el
mismo turno, incluido `rawResponseItem/completed`, desactiva ese watchdog corto
porque Codex ha demostrado que el turno sigue activo; el watchdog terminal más largo
sigue protegiendo los turnos realmente atascados. Las notificaciones globales del app-server,
como actualizaciones de límites de tasa, no restablecen el progreso de inactividad del turno. Cuando Codex emite un
elemento `agentMessage` completado y luego queda en silencio sin `turn/completed`,
OpenClaw trata la salida del asistente como efectivamente completa, interrumpe con el mejor esfuerzo
el turno nativo de Codex y libera el carril de sesión. Los diagnósticos de tiempo de espera
incluyen el último método de notificación del app-server y, para elementos de respuesta
del asistente sin procesar, el tipo de elemento, el rol, el id y una vista previa delimitada del texto
del asistente.

Las anulaciones de entorno siguen disponibles para pruebas locales:

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

La compatibilidad con plugins nativos de Codex usa las propias capacidades de app y plugin
del app-server de Codex en el mismo hilo de Codex que el turno del harness de OpenClaw. OpenClaw
no traduce los plugins de Codex en herramientas dinámicas sintéticas `codex_plugin_*` de OpenClaw.

`codexPlugins` afecta solo a las sesiones que seleccionan el harness nativo de Codex. No
tiene efecto en ejecuciones de Pi, ejecuciones normales del proveedor OpenAI, enlaces de conversación
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

La configuración de la app del hilo se calcula cuando OpenClaw establece una sesión del harness de Codex
o reemplaza un enlace de hilo de Codex obsoleto. No se recalcula en cada turno.
Después de cambiar `codexPlugins`, usa `/new`, `/reset` o reinicia el gateway para que
las futuras sesiones del harness de Codex comiencen con el conjunto de apps actualizado.

Para ver la elegibilidad de migración, el inventario de apps, la política de acciones destructivas,
las elicitaciones y los diagnósticos de plugins nativos, consulta
[Plugins nativos de Codex](/es/plugins/codex-native-plugins).

## Computer Use

Computer Use se aborda en su propia guía de configuración:
[Codex Computer Use](/es/plugins/codex-computer-use).

La versión breve: OpenClaw no integra la app de control de escritorio ni ejecuta
acciones de escritorio por sí mismo. Prepara el app-server de Codex, verifica que el
servidor MCP `computer-use` esté disponible y luego deja que Codex sea propietario de las llamadas
nativas a herramientas MCP durante los turnos en modo Codex.

## Límites de runtime

El harness de Codex cambia solo el ejecutor de agente embebido de bajo nivel.

- Las herramientas dinámicas de OpenClaw son compatibles. Codex pide a OpenClaw que ejecute esas
  herramientas, por lo que OpenClaw permanece en la ruta de ejecución.
- Las herramientas nativas de shell, patch, MCP y app de Codex son propiedad de Codex.
  OpenClaw puede observar o bloquear eventos nativos seleccionados mediante el relay compatible,
  pero no reescribe los argumentos de herramientas nativas.
- Codex es propietario de la Compaction nativa. OpenClaw conserva un espejo de transcripción para el historial
  del canal, la búsqueda, `/new`, `/reset` y futuros cambios de modelo o harness.
- La generación de medios, la comprensión de medios, TTS, las aprobaciones y la salida de herramientas
  de mensajería continúan mediante los ajustes correspondientes de proveedor/modelo de OpenClaw.
- `tool_result_persist` se aplica a los resultados de herramientas de transcripción propiedad de OpenClaw, no
  a los registros de resultados de herramientas nativas de Codex.

Para capas de hooks, superficies V1 compatibles, gestión de permisos nativos, dirección
de colas, mecánica de carga de feedback de Codex y detalles de Compaction, consulta
[Runtime del harness de Codex](/es/plugins/codex-harness-runtime).

## Solución de problemas

**Codex no aparece como un proveedor `/model` normal:** eso es lo esperado para
configuraciones nuevas. Selecciona un modelo `openai/gpt-*`, habilita
`plugins.entries.codex.enabled` y comprueba si `plugins.allow` excluye
`codex`.

**OpenClaw usa Pi en lugar de Codex:** asegúrate de que la referencia de modelo sea
`openai/gpt-*` en el proveedor oficial OpenAI y de que el plugin de Codex esté
instalado y habilitado. Si necesitas una prueba estricta mientras haces pruebas, configura el proveedor o
modelo `agentRuntime.id: "codex"`. Un runtime de Codex forzado falla en lugar de
volver a Pi.

**La configuración heredada `openai-codex/*` permanece:** ejecuta `openclaw doctor --fix`.
Doctor reescribe las referencias de modelo heredadas a `openai/*`, elimina pines de runtime de sesión y
de agente completo obsoletos, y conserva las anulaciones existentes de perfiles de autenticación.

**El app-server se rechaza:** usa Codex app-server `0.125.0` o más reciente.
Las versiones preliminares de la misma versión o las versiones con sufijo de compilación, como
`0.125.0-alpha.2` o `0.125.0+custom`, se rechazan porque OpenClaw prueba el
piso de protocolo estable `0.125.0`.

**`/codex status` no puede conectarse:** comprueba que el plugin `codex` incluido esté
habilitado, que `plugins.allow` lo incluya cuando se configure una lista de permitidos, y
que cualquier `appServer.command`, `url`, `authToken` o encabezado personalizado sea válido.

**El descubrimiento de modelos es lento:** reduce
`plugins.entries.codex.config.discovery.timeoutMs` o deshabilita el descubrimiento. Consulta
[Referencia del harness de Codex](/es/plugins/codex-harness-reference#model-discovery).

**El transporte WebSocket falla inmediatamente:** comprueba `appServer.url`, `authToken`,
los encabezados y que el app-server remoto hable la misma versión del protocolo app-server
de Codex.

**Un modelo que no es Codex usa Pi:** eso es lo esperado, a menos que la política de runtime
del proveedor o modelo lo enrute a otro harness. Las referencias simples de proveedores que no son OpenAI
permanecen en su ruta normal de proveedor en modo `auto`.

**Computer Use está instalado pero las herramientas no se ejecutan:** comprueba
`/codex computer-use status` desde una sesión nueva. Si una herramienta informa
`Native hook relay unavailable`, usa `/new` o `/reset`; si persiste, reinicia
el gateway para limpiar registros de hooks nativos obsoletos. Consulta
[Codex Computer Use](/es/plugins/codex-computer-use#troubleshooting).

## Relacionado

- [Referencia del harness de Codex](/es/plugins/codex-harness-reference)
- [Runtime del harness de Codex](/es/plugins/codex-harness-runtime)
- [Plugins nativos de Codex](/es/plugins/codex-native-plugins)
- [Codex Computer Use](/es/plugins/codex-computer-use)
- [Runtimes de agentes](/es/concepts/agent-runtimes)
- [Proveedores de modelos](/es/concepts/model-providers)
- [Proveedor OpenAI](/es/providers/openai)
- [Plugins de harness de agentes](/es/plugins/sdk-agent-harness)
- [Hooks de Plugin](/es/plugins/hooks)
- [Exportación de diagnósticos](/es/gateway/diagnostics)
- [Estado](/es/cli/status)
- [Pruebas](/es/help/testing-live#live-codex-app-server-harness-smoke)
