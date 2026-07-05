---
read_when:
    - Necesitas todos los campos de configuración del arnés de Codex
    - Está cambiando el comportamiento de transporte, autenticación, descubrimiento o tiempo de espera de app-server
    - Estás depurando el inicio del arnés de Codex, el descubrimiento de modelos o el aislamiento del entorno
summary: Referencia de configuración, autenticación, detección y servidor de aplicaciones para el arnés de Codex
title: Referencia del arnés de Codex
x-i18n:
    generated_at: "2026-07-05T11:33:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7da4aa4ef7dc26bb7325d195309b9f608ecc645e515907d52306fcc419a94081
    source_path: plugins/codex-harness-reference.md
    workflow: 16
---

Esta referencia cubre la configuración detallada del Plugin `codex` incluido.
Para la configuración inicial y las decisiones de enrutamiento, empieza con
[arnés de Codex](/es/plugins/codex-harness).

## Superficie de configuración del Plugin

Todos los ajustes del arnés de Codex residen en `plugins.entries.codex.config`.

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
          appServer: {
            mode: "guardian",
          },
        },
      },
    },
  },
}
```

Campos de nivel superior:

| Campo                      | Valor predeterminado     | Significado                                                                                                                                                      |
| -------------------------- | ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `discovery`                | habilitado               | Ajustes de descubrimiento de modelos para `model/list` del app-server de Codex.                                                                                  |
| `appServer`                | app-server stdio administrado | Ajustes de transporte, comando, autenticación, aprobación, sandbox y tiempo de espera.                                                                       |
| `codexDynamicToolsLoading` | `"searchable"`           | Usa `"direct"` para colocar las herramientas dinámicas de OpenClaw directamente en el contexto inicial de herramientas de Codex.                                  |
| `codexDynamicToolsExclude` | `[]`                     | Nombres adicionales de herramientas dinámicas de OpenClaw que se omitirán en los turnos del app-server de Codex.                                                 |
| `codexPlugins`             | deshabilitado            | Soporte nativo de Plugins/apps de Codex para plugins seleccionados migrados e instalados desde el código fuente. Consulta [Plugins nativos de Codex](/es/plugins/codex-native-plugins). |
| `computerUse`              | deshabilitado            | Configuración de Codex Computer Use. Consulta [Codex Computer Use](/es/plugins/codex-computer-use).                                                                 |

## Transporte del app-server

De forma predeterminada, OpenClaw inicia el binario de Codex administrado que se incluye con el
Plugin incluido (actualmente `@openai/codex` `0.142.5`):

```bash
codex app-server --listen stdio://
```

Esto mantiene la versión del app-server vinculada al Plugin `codex` incluido en lugar de
cualquier CLI de Codex independiente que esté instalada localmente. Establece
`appServer.command` solo cuando quieras usar intencionadamente un ejecutable diferente.

Para un app-server que ya está en ejecución, usa el transporte WebSocket:

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
            requestTimeoutMs: 60000,
          },
        },
      },
    },
  },
}
```

Campos de `appServer`:

| Campo                                         | Predeterminado                                         | Significado                                                                                                                                                                                                                                                                                                                                                                                     |
| --------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                                   | `"stdio"`                                              | `"stdio"` genera Codex; `"websocket"` se conecta a `url`.                                                                                                                                                                                                                                                                                                                                       |
| `homeScope`                                   | `"agent"`                                              | `"agent"` aísla el estado de Codex por agente de OpenClaw. `"user"` comparte el `$CODEX_HOME` nativo o `~/.codex`, usa la autenticación nativa y habilita la gestión de hilos solo para el propietario. El ámbito de usuario requiere stdio.                                                                                                                                                   |
| `command`                                     | binario de Codex gestionado                            | Ejecutable para el transporte stdio. Déjalo sin definir para usar el binario gestionado.                                                                                                                                                                                                                                                                                                        |
| `args`                                        | `["app-server", "--listen", "stdio://"]`               | Argumentos para el transporte stdio.                                                                                                                                                                                                                                                                                                                                                            |
| `url`                                         | sin definir                                            | URL del app-server WebSocket.                                                                                                                                                                                                                                                                                                                                                                   |
| `authToken`                                   | sin definir                                            | Token de portador para el transporte WebSocket. Acepta una cadena literal o SecretInput como `${CODEX_APP_SERVER_TOKEN}`.                                                                                                                                                                                                                                                                       |
| `headers`                                     | `{}`                                                   | Encabezados WebSocket adicionales. Los valores de encabezado aceptan cadenas literales o valores SecretInput, por ejemplo `x-codex-client-session-token: "${CODEX_CLIENT_SESSION_TOKEN}"`.                                                                                                                                                                                                      |
| `clearEnv`                                    | `[]`                                                   | Nombres adicionales de variables de entorno eliminadas del proceso app-server stdio generado después de que OpenClaw construye su entorno heredado.                                                                                                                                                                                                                                             |
| `remoteWorkspaceRoot`                         | sin definir                                            | Raíz remota del espacio de trabajo del app-server de Codex. Cuando se define, OpenClaw infiere la raíz del espacio de trabajo local a partir del espacio de trabajo resuelto de OpenClaw, conserva el sufijo del cwd actual bajo esta raíz remota y envía solo el cwd final del app-server a Codex. Si el cwd está fuera de la raíz resuelta del espacio de trabajo de OpenClaw, OpenClaw falla de forma cerrada en lugar de enviar una ruta local del Gateway al app-server remoto. |
| `requestTimeoutMs`                            | `60000`                                                | Tiempo de espera para llamadas del plano de control del app-server.                                                                                                                                                                                                                                                                                                                             |
| `turnCompletionIdleTimeoutMs`                 | `60000`                                                | Ventana silenciosa después de que Codex acepta un turno o después de una solicitud del app-server con ámbito de turno mientras OpenClaw espera `turn/completed`.                                                                                                                                                                                                                                |
| `postToolRawAssistantCompletionIdleTimeoutMs` | `300000`                                               | Protección de inactividad de finalización y progreso usada después de una transferencia de herramienta, finalización de herramienta nativa, progreso bruto posterior a herramienta del asistente, finalización de razonamiento bruto o progreso de razonamiento mientras OpenClaw espera `turn/completed`. Usa esto para cargas de trabajo confiables o pesadas donde la síntesis posterior a herramienta puede permanecer legítimamente silenciosa más tiempo que el presupuesto final de publicación del asistente. |
| `mode`                                        | `"yolo"` salvo que los requisitos locales de Codex no permitan YOLO | Preajuste para ejecución YOLO o revisada por guardian.                                                                                                                                                                                                                                                                                                                                          |
| `approvalPolicy`                              | `"never"` o una política de aprobación guardian permitida | Política de aprobación nativa de Codex enviada al inicio, reanudación y turno del hilo.                                                                                                                                                                                                                                                                                                         |
| `sandbox`                                     | `"danger-full-access"` o un sandbox guardian permitido | Modo sandbox nativo de Codex enviado al inicio y reanudación del hilo. Los sandboxes activos de OpenClaw restringen los turnos `danger-full-access` a `workspace-write` de Codex; la marca de red del turno sigue la salida del sandbox de OpenClaw.                                                                                                                                           |
| `approvalsReviewer`                           | `"user"` o un revisor guardian permitido               | Usa `"auto_review"` para permitir que Codex revise las solicitudes de aprobación nativas cuando esté permitido.                                                                                                                                                                                                                                                                                  |
| `defaultWorkspaceDir`                         | directorio del proceso actual                          | Espacio de trabajo usado por `/codex bind` cuando se omite `--cwd`.                                                                                                                                                                                                                                                                                                                             |
| `serviceTier`                                 | sin definir                                            | Nivel de servicio opcional del app-server de Codex. `"priority"` habilita el enrutamiento de modo rápido, `"flex"` solicita procesamiento flexible y `null` borra la anulación. El valor heredado `"fast"` se acepta como `"priority"`.                                                                                                                                                       |
| `networkProxy`                                | deshabilitado                                          | Opta por la red del perfil de permisos de Codex para comandos del app-server. OpenClaw define la configuración `permissions.<profile>.network` seleccionada y la selecciona con `default_permissions` en lugar de enviar `sandbox`.                                                                                                                                                            |
| `experimental.sandboxExecServer`              | `false`                                                | Opción preliminar que registra un entorno de Codex respaldado por el sandbox de OpenClaw con Codex app-server 0.132.0 o posterior para que la ejecución nativa de Codex pueda ejecutarse dentro del sandbox activo de OpenClaw.                                                                                                                                                                  |

`appServer.networkProxy` es explícito porque cambia el contrato del sandbox de Codex.
Cuando está habilitado, OpenClaw también establece `features.network_proxy.enabled` y
`default_permissions` en la configuración del hilo de Codex para que el perfil de permisos
generado pueda iniciar la red gestionada por Codex. OpenClaw genera un nombre de perfil
`openclaw-network-<fingerprint>` resistente a colisiones a partir del cuerpo del perfil
de forma predeterminada; usa `profileName` solo cuando se requiera un nombre local estable.

```js
export default {
  plugins: {
    entries: {
      codex: {
        config: {
          appServer: {
            sandbox: "workspace-write",
            networkProxy: {
              enabled: true,
              domains: {
                "api.openai.com": "allow",
                "blocked.example.com": "deny",
              },
              allowUpstreamProxy: true,
              proxyUrl: "http://127.0.0.1:3128",
            },
          },
        },
      },
    },
  },
};
```

Si el runtime normal del servidor de aplicaciones fuera `danger-full-access`, habilitar
`networkProxy` usa en su lugar acceso al sistema de archivos de estilo workspace para el perfil
de permisos generado. La aplicación de red gestionada por Codex es networking aislado,
por lo que un perfil de acceso completo no protegería el tráfico saliente.

El plugin bloquea handshakes de servidor de aplicaciones antiguos o sin versión: el servidor
de aplicaciones de Codex debe informar la versión estable `0.125.0` o una más reciente.

OpenClaw trata las URL WebSocket de servidor de aplicaciones que no son de loopback como remotas y requiere
autenticación WebSocket con identidad mediante `appServer.authToken` o un encabezado
`Authorization`. `appServer.authToken` y cada valor `appServer.headers.*`
pueden ser un SecretInput; el runtime de secretos resuelve SecretRefs y la abreviatura de env
antes de que OpenClaw cree las opciones de inicio del servidor de aplicaciones, y los SecretRefs
estructurados no resueltos fallan antes de que se envíe cualquier token o encabezado. Cuando se configuran
plugins nativos de Codex, OpenClaw usa el plano de control de plugins del servidor de aplicaciones conectado
para instalar o actualizar esos plugins y luego actualiza el inventario de aplicaciones
para que las aplicaciones propiedad de plugins sean visibles para el hilo de Codex. `app/list` sigue siendo
la fuente autorizada de inventario y metadatos, pero la política de OpenClaw
decide si `thread/start` envía `config.apps[appId].enabled = true` para una
aplicación accesible listada incluso si Codex la marca actualmente como deshabilitada. Los ids de aplicación
desconocidos o ausentes siguen fallando de forma cerrada; esta ruta solo activa plugins de marketplace
mediante `plugin/install` y actualiza el inventario. Conecta OpenClaw solo a
servidores de aplicaciones remotos en los que se confíe para aceptar instalaciones de plugins gestionadas por OpenClaw
y actualizaciones de inventario de aplicaciones.

## Modos de aprobación y sandbox

Las sesiones locales stdio de servidor de aplicaciones usan por defecto el modo YOLO:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` y
`sandbox: "danger-full-access"`. Esta postura de operador local de confianza permite que
los turnos desatendidos de OpenClaw y los heartbeats avancen sin prompts de aprobación nativos
que no haya nadie disponible para responder.

Si el archivo local de requisitos del sistema de Codex no permite valores implícitos YOLO de aprobación,
revisor o sandbox, OpenClaw trata el valor predeterminado implícito como guardian
en su lugar y selecciona permisos guardian permitidos. `tools.exec.mode: "auto"`
también fuerza aprobaciones de Codex revisadas por guardian y no preserva sobrescrituras legacy inseguras
`approvalPolicy: "never"` ni `sandbox: "danger-full-access"`;
configura `tools.exec.mode: "full"` para una postura intencional sin aprobaciones.
Las entradas `[[remote_sandbox_config]]` con coincidencia de hostname en el mismo archivo de requisitos
se respetan para la decisión predeterminada de sandbox.

Configura `appServer.mode: "guardian"` para aprobaciones de Codex revisadas por guardian:

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

El preajuste `guardian` se expande a `approvalPolicy: "on-request"`,
`approvalsReviewer: "auto_review"` y `sandbox: "workspace-write"` cuando esos
valores están permitidos. Los campos de política individuales sobrescriben `mode`. El valor de revisor anterior
`guardian_subagent` aún se acepta como alias de compatibilidad,
pero las configuraciones nuevas deben usar `auto_review`.

Cuando un sandbox de OpenClaw está activo, el proceso local del servidor de aplicaciones de Codex todavía
se ejecuta en el host Gateway. Por lo tanto, OpenClaw deshabilita Code Mode nativo de Codex,
servidores MCP de usuario y ejecución de plugins respaldada por aplicaciones para ese turno, en vez de
tratar el sandboxing del lado host de Codex como equivalente al backend de sandbox de OpenClaw.
El acceso de shell se expone mediante herramientas dinámicas respaldadas por sandbox de OpenClaw
como `sandbox_exec` y `sandbox_process` cuando las herramientas normales exec/process
están disponibles.

<Note>
En hosts de sandbox de OpenClaw respaldados por Docker (`agents.defaults.sandbox.mode` establecido en
un backend Docker), `openclaw doctor` prueba si el host permite los namespaces
del usuario sin privilegios (y, cuando la salida de red del sandbox Docker está deshabilitada,
de red) que el `bwrap` anidado de Codex necesita para la ejecución de shell
`workspace-write` dentro del contenedor de sandbox. Una prueba fallida normalmente aparece
como `bwrap: setting up uid map: Permission denied` o
`bwrap: loopback: Failed RTM_NEWADDR: Operation not permitted` en
hosts Ubuntu/AppArmor. Corrige la política de namespaces del host indicada para el usuario de servicio de OpenClaw
y reinicia el Gateway; prefiere un perfil AppArmor acotado para el
proceso de servicio antes que el fallback global del host
`kernel.apparmor_restrict_unprivileged_userns=0`, y no concedas
privilegios más amplios al contenedor Docker solo para satisfacer `bwrap` anidado.
</Note>

## Ejecución nativa en sandbox

El valor predeterminado estable es fallar de forma cerrada: el sandboxing activo de OpenClaw deshabilita superficies de ejecución
nativas de Codex que de otro modo se ejecutarían desde el host del servidor de aplicaciones de Codex.
Usa `appServer.experimental.sandboxExecServer: true` solo cuando quieras
probar el soporte de entornos remotos de Codex con el backend de sandbox de OpenClaw.
Esta ruta preliminar requiere Codex app-server 0.132.0 o más reciente.

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            experimental: {
              sandboxExecServer: true,
            },
          },
        },
      },
    },
  },
}
```

Cuando la marca está activada y la sesión actual de OpenClaw está en sandbox, OpenClaw
inicia un exec-server de local loopback respaldado por el sandbox activo, lo registra
con el servidor de aplicaciones de Codex e inicia el hilo y el turno de Codex con ese
entorno propiedad de OpenClaw. Si el servidor de aplicaciones no puede registrar el entorno,
la ejecución falla de forma cerrada en vez de volver silenciosamente a la ejecución en el host.

Esta ruta preliminar es solo local. Un servidor de aplicaciones WebSocket remoto no puede alcanzar
el exec-server de loopback a menos que se esté ejecutando en el mismo host, por lo que OpenClaw
rechaza esa combinación.

## Autenticación y aislamiento de entorno

En el home por agente predeterminado, la autenticación se selecciona en este orden:

1. Un perfil explícito de autenticación de OpenClaw Codex para el agente.
2. La cuenta existente del servidor de aplicaciones en el home de Codex de ese agente.
3. Solo para lanzamientos locales stdio del servidor de aplicaciones, `CODEX_API_KEY`, luego
   `OPENAI_API_KEY`, cuando no hay ninguna cuenta de servidor de aplicaciones presente y la autenticación de OpenAI
   todavía es necesaria.

Cuando OpenClaw ve un perfil de autenticación de Codex de estilo suscripción de ChatGPT (tipo de credencial OAuth o
token), elimina `CODEX_API_KEY` y `OPENAI_API_KEY` del
proceso hijo de Codex generado. Eso mantiene las claves API de nivel Gateway disponibles
para embeddings o modelos OpenAI directos sin hacer que los turnos nativos de servidor de aplicaciones de Codex
se facturen por la API por accidente.

Los perfiles explícitos de clave API de Codex y el fallback local stdio de clave env usan
inicio de sesión del servidor de aplicaciones en vez de env heredado del proceso hijo. Las conexiones WebSocket de servidor de aplicaciones
no reciben fallback de clave API env del Gateway; usa un perfil de autenticación explícito
o la propia cuenta del servidor de aplicaciones remoto.

Los lanzamientos stdio de servidor de aplicaciones heredan el entorno de proceso de OpenClaw de forma predeterminada.
OpenClaw es propietario del puente de cuenta del servidor de aplicaciones de Codex y establece `CODEX_HOME` en un
directorio por agente bajo el estado de OpenClaw de ese agente. Eso mantiene la configuración de Codex,
las cuentas, la caché/datos de plugins y el estado de hilos acotados al agente de OpenClaw,
en vez de filtrarse desde el home personal `~/.codex` del operador.

Configura `appServer.homeScope: "user"` para compartir el estado nativo de Codex con Codex
Desktop y la CLI. Este modo solo local-stdio usa `$CODEX_HOME` cuando está configurado
y `~/.codex` en caso contrario, incluida la autenticación, configuración, plugins e hilos nativos.
OpenClaw omite su puente de perfil de autenticación para el servidor de aplicaciones. Los turnos de propietario verificados
pueden usar `codex_threads` para listar (con un filtro `search` opcional),
leer, bifurcar, renombrar, archivar y desarchivar esos hilos. Bifurca un hilo antes
de continuarlo en OpenClaw; los procesos independientes de Codex no coordinan
escritores concurrentes para el mismo hilo.

OpenClaw no reescribe `HOME` para lanzamientos locales normales de servidor de aplicaciones.
Los subprocesos ejecutados por Codex, como `openclaw`, `gh`, `git`, CLI de nube y comandos de shell,
ven el home normal del proceso y pueden encontrar configuración y tokens del home del usuario.
Codex también puede descubrir `$HOME/.agents/skills` y
`$HOME/.agents/plugins/marketplace.json`; ese descubrimiento de `.agents` se
comparte intencionalmente con el home del operador y está separado del estado aislado
`~/.codex`.

En el alcance de agente predeterminado, los plugins de OpenClaw y snapshots de Skills de OpenClaw
siguen fluyendo por el propio registro de plugins y cargador de Skills de OpenClaw; los recursos
personales de Codex `~/.codex` no. Si tienes Skills o plugins útiles de Codex CLI
desde un home de Codex que deban pasar a formar parte de un agente aislado de OpenClaw,
haz inventario explícitamente:

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

Si un despliegue necesita aislamiento de entorno adicional, añade esas variables
a `appServer.clearEnv`:

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
OpenClaw elimina `CODEX_HOME` y `HOME` de esta lista durante la normalización del lanzamiento local:
`CODEX_HOME` sigue apuntando al alcance de agente o usuario seleccionado,
y `HOME` sigue heredado para que los subprocesos puedan usar el estado normal del home de usuario.

## Herramientas dinámicas

Las herramientas dinámicas de Codex usan por defecto carga `searchable`, expuestas bajo el
namespace `openclaw` con `deferLoading: true`. OpenClaw no expone
herramientas dinámicas que dupliquen operaciones workspace nativas de Codex ni la propia
superficie de búsqueda de herramientas de Codex:

- `read`
- `write`
- `edit`
- `apply_patch`
- `exec`
- `process`
- `update_plan`
- `tool_call`
- `tool_describe`
- `tool_search`
- `tool_search_code`

La mayoría de las herramientas de integración restantes de OpenClaw, como mensajería, medios, cron,
navegador, nodos, Gateway, `heartbeat_respond` y `web_search`, están disponibles
mediante la búsqueda de herramientas de Codex bajo ese namespace. Esto mantiene el contexto inicial del modelo
más pequeño. Un conjunto pequeño de herramientas sigue siendo invocable directamente independientemente de
`codexDynamicToolsLoading`, porque la búsqueda de herramientas de Codex puede no estar disponible o
resolver un universo solo de conectores: `agents_list`, `sessions_spawn` y
`sessions_yield`. Las instrucciones de desarrollador siguen orientando a los subagentes normales de Codex
hacia `spawn_agent` nativo para trabajo de subagente nativo de Codex, mientras que
`sessions_spawn` sigue disponible para delegación explícita de OpenClaw o ACP.
Las respuestas de origen solo con herramientas de mensaje también siguen siendo directas, ya que eso es un
contrato de control de turno.

Configura `codexDynamicToolsLoading: "direct"` solo cuando te conectes a un servidor de aplicaciones Codex personalizado
que no pueda buscar herramientas dinámicas diferidas o al depurar
la carga completa de herramientas.

## Timeouts

Las llamadas a herramientas dinámicas propiedad de OpenClaw están limitadas independientemente de
`appServer.requestTimeoutMs`. Cada solicitud Codex `item/tool/call` usa el
primer timeout disponible en este orden:

- Un argumento positivo `timeoutMs` por llamada.
- Para `image_generate`, `agents.defaults.imageGenerationModel.timeoutMs`.
- Para `image_generate` sin un timeout configurado, el valor predeterminado de 120 segundos
  de generación de imágenes.
- Para la herramienta `image` de comprensión de medios, `tools.media.image.timeoutSeconds`
  convertido a milisegundos, o el valor predeterminado de medios de 60 segundos. Para comprensión de imágenes,
  esto se aplica a la propia solicitud y no se reduce por
  trabajo de preparación anterior.
- Para la herramienta `message`, un valor predeterminado fijo de 120 segundos.
- El valor predeterminado de herramientas dinámicas de 90 segundos.

Este watchdog es el presupuesto externo dinámico de `item/tool/call`. Los timeouts de solicitud
específicos del proveedor se ejecutan dentro de esa llamada y mantienen su propia semántica de timeout.
Los presupuestos de herramientas dinámicas se limitan a 600000 ms. Al agotarse el timeout, OpenClaw aborta la
señal de la herramienta cuando está soportado y devuelve una respuesta fallida de herramienta dinámica a
Codex para que el turno pueda continuar en vez de dejar la sesión en
`processing`.

Después de que Codex acepta un turno, y después de que OpenClaw responde a una solicitud del servidor de aplicaciones con alcance de turno, el arnés espera que Codex avance en el turno actual y finalmente termine el turno nativo con `turn/completed`. Si el servidor de aplicaciones queda en silencio durante `appServer.turnCompletionIdleTimeoutMs`, OpenClaw interrumpe el turno de Codex con el mejor esfuerzo posible, registra un tiempo de espera de diagnóstico y libera la vía de sesión de OpenClaw para que los mensajes de chat posteriores no queden en cola detrás de un turno nativo obsoleto.

La mayoría de las notificaciones no terminales del mismo turno desarman ese watchdog breve porque Codex ha demostrado que el turno sigue activo. Las transferencias de herramientas usan un presupuesto de inactividad posterior a herramientas más largo: después de que OpenClaw devuelve una respuesta `item/tool/call`, después de que elementos de herramienta nativos como `commandExecution` terminan, después de finalizaciones `custom_tool_call_output` sin procesar y después del progreso sin procesar del asistente posterior a herramientas, finalizaciones de razonamiento o progreso de razonamiento. La protección usa `appServer.postToolRawAssistantCompletionIdleTimeoutMs` cuando está configurado y, de lo contrario, usa cinco minutos de forma predeterminada. Ese mismo presupuesto posterior a herramientas también extiende el watchdog de progreso para la ventana de síntesis silenciosa antes de que Codex emita el siguiente evento del turno actual. Las finalizaciones de razonamiento, las finalizaciones de `agentMessage` de comentario y el progreso sin procesar de razonamiento o asistente previo a herramientas pueden ir seguidos de una respuesta final automática, por lo que usan la protección de respuesta posterior al progreso en lugar de liberar la vía de sesión inmediatamente. Solo los elementos `agentMessage` finales/no de comentario completados y las finalizaciones sin procesar del asistente previas a herramientas activan la liberación de salida del asistente: si Codex queda en silencio después sin `turn/completed`, OpenClaw interrumpe el turno nativo con el mejor esfuerzo posible y libera la vía de sesión. Los fallos de servidor de aplicaciones stdio seguros para reproducción, incluidos los tiempos de espera de finalización de turno sin evidencia de asistente, herramienta, elemento activo o efecto secundario, se reintentan una vez en un intento nuevo del servidor de aplicaciones. Los tiempos de espera inseguros igualmente retiran el cliente de servidor de aplicaciones atascado y liberan la vía de sesión de OpenClaw. También borran el enlace obsoleto del hilo nativo en lugar de reproducirse automáticamente. Los tiempos de espera de vigilancia de finalización muestran texto de tiempo de espera específico de Codex: los casos seguros para reproducción dicen que la respuesta puede estar incompleta, mientras que los casos inseguros indican al usuario que verifique el estado actual antes de reintentar. Los diagnósticos públicos de tiempo de espera incluyen campos estructurales como el último método de notificación del servidor de aplicaciones, id/tipo/rol del elemento de respuesta sin procesar del asistente, recuentos de solicitudes/elementos activos y estado de vigilancia armado. Cuando la última notificación es un elemento de respuesta sin procesar del asistente, también incluyen una vista previa acotada del texto del asistente. No incluyen contenido sin procesar de prompts ni de herramientas.

## Descubrimiento de modelos

De forma predeterminada, el Plugin de Codex solicita al servidor de aplicaciones los modelos disponibles. La disponibilidad de modelos pertenece al servidor de aplicaciones de Codex, por lo que la lista puede cambiar cuando OpenClaw actualiza la versión incluida de `@openai/codex` o cuando una implementación apunta `appServer.command` a un binario de Codex distinto. La disponibilidad también puede tener alcance de cuenta. Usa `/codex models` en un gateway en ejecución para ver el catálogo en vivo de ese arnés y cuenta.

Si el descubrimiento falla o agota el tiempo de espera, OpenClaw usa un catálogo de respaldo incluido:

| Id. de modelo | Nombre para mostrar | Esfuerzos de razonamiento |
| -------------- | ------------ | ------------------------ |
| `gpt-5.5` | gpt-5.5 | low, medium, high, xhigh |
| `gpt-5.4-mini` | GPT-5.4-Mini | low, medium, high, xhigh |

<Note>
El arnés incluido actual es `@openai/codex` `0.142.5`. Una sonda `model/list` contra ese servidor de aplicaciones incluido devolvió estas filas públicas del selector más allá del catálogo de respaldo:

| Id. de modelo | Modalidades de entrada | Esfuerzos de razonamiento |
| --------------------- | ---------------- | ------------------------ |
| `gpt-5.5` | text, image | low, medium, high, xhigh |
| `gpt-5.4` | text, image | low, medium, high, xhigh |
| `gpt-5.4-mini` | text, image | low, medium, high, xhigh |
| `gpt-5.3-codex-spark` | text | low, medium, high, xhigh |

Las filas del selector en vivo tienen alcance de cuenta y pueden cambiar con la cuenta, el catálogo de Codex o la versión incluida; ejecuta `/codex models` para obtener la lista actual en lugar de depender de cualquier tabla puntual. Los modelos ocultos también pueden aparecer en el catálogo del servidor de aplicaciones para flujos internos o especializados sin ser opciones normales del selector de modelos.
</Note>

Ajusta el descubrimiento en `plugins.entries.codex.config.discovery`:

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

Desactiva el descubrimiento cuando quieras que el inicio evite sondear Codex y use solo el catálogo de respaldo:

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

## Archivos de arranque del workspace

Codex maneja `AGENTS.md` por sí mismo mediante el descubrimiento nativo de documentos de proyecto. OpenClaw no escribe archivos sintéticos de documentos de proyecto de Codex ni depende de nombres de archivo de respaldo de Codex para archivos de persona, porque los respaldos de Codex solo se aplican cuando falta `AGENTS.md`.

Para la paridad del workspace de OpenClaw, el arnés de Codex reenvía los demás archivos de arranque como instrucciones de desarrollador, pero no de forma idéntica:

- `TOOLS.md` se reenvía como instrucciones de desarrollador **heredadas** de Codex, por lo que los subagentes nativos de Codex generados durante el turno también lo ven.
- `SOUL.md`, `IDENTITY.md` y `USER.md` se reenvían como instrucciones de colaboración **con alcance de turno**. Los subagentes nativos de Codex no las heredan, lo que evita que los turnos de subagente adopten la persona y el perfil de usuario del agente padre.
- La lista compacta cargada de Skills de OpenClaw también se reenvía como instrucciones de desarrollador de colaboración con alcance de turno, por lo que los subagentes nativos de Codex tampoco la heredan.
- El contenido de `HEARTBEAT.md` no se inyecta; los turnos de Heartbeat reciben un puntero de modo de colaboración para leer el archivo cuando existe y no está vacío.
- El contenido de `MEMORY.md` del workspace del agente configurado no se pega en la entrada del turno nativo de Codex cuando hay herramientas de memoria disponibles para ese workspace; cuando existe, el arnés agrega un pequeño puntero de memoria de workspace a las instrucciones de desarrollador de colaboración con alcance de turno y Codex debe usar `memory_search` o `memory_get` cuando la memoria duradera sea relevante. Si las herramientas están desactivadas, la búsqueda de memoria no está disponible o el workspace activo difiere del workspace de memoria del agente, `MEMORY.md` usa en su lugar la ruta normal acotada de contexto de turno.
- `BOOTSTRAP.md`, cuando está presente, se reenvía como contexto de referencia de entrada de turno de OpenClaw.

## Anulaciones de entorno

Las anulaciones de entorno siguen estando disponibles para pruebas locales:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN` omite el binario administrado cuando `appServer.command` no está definido.

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` se eliminó. Usa `plugins.entries.codex.config.appServer.mode: "guardian"` en su lugar, o `OPENCLAW_CODEX_APP_SERVER_MODE=guardian` para pruebas locales puntuales. Se prefiere la configuración para implementaciones repetibles porque mantiene el comportamiento del Plugin en el mismo archivo revisado que el resto de la configuración del arnés de Codex.

## Relacionado

- [Arnés de Codex](/es/plugins/codex-harness)
- [Runtime del arnés de Codex](/es/plugins/codex-harness-runtime)
- [Plugins nativos de Codex](/es/plugins/codex-native-plugins)
- [Codex Computer Use](/es/plugins/codex-computer-use)
- [Proveedor de OpenAI](/es/providers/openai)
- [Referencia de configuración](/es/gateway/configuration-reference)
