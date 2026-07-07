---
read_when:
    - Necesitas todos los campos de configuración del arnés de Codex
    - Estás cambiando el comportamiento de transporte, autenticación, descubrimiento o tiempo de espera de app-server
    - Estás depurando el inicio del arnés de Codex, el descubrimiento de modelos o el aislamiento del entorno
summary: Referencia de configuración, autenticación, descubrimiento y servidor de aplicaciones para el arnés de Codex
title: Referencia del arnés de Codex
x-i18n:
    generated_at: "2026-07-06T21:51:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ed382bb5585cf9ca54fe7d6607cfac923dea2f2636de98fc4b621bdaa47cb1d1
    source_path: plugins/codex-harness-reference.md
    workflow: 16
---

Esta referencia cubre la configuración detallada del plugin `codex` incluido.
Para decisiones de configuración y enrutamiento, empieza con
[arnés de Codex](/es/plugins/codex-harness).

## Superficie de configuración del Plugin

Todas las opciones del arnés de Codex se encuentran en `plugins.entries.codex.config`.

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

| Campo                      | Predeterminado           | Significado                                                                                                                                                         |
| -------------------------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `discovery`                | habilitado               | Opciones de descubrimiento de modelos para `model/list` del app-server de Codex.                                                                                    |
| `appServer`                | app-server stdio gestionado | Opciones de transporte, comando, autenticación, aprobación, sandbox y tiempo de espera.                                                                              |
| `codexDynamicToolsLoading` | `"searchable"`           | Usa `"direct"` para colocar las herramientas dinámicas de OpenClaw directamente en el contexto inicial de herramientas de Codex.                                     |
| `codexDynamicToolsExclude` | `[]`                     | Nombres adicionales de herramientas dinámicas de OpenClaw que se omitirán en los turnos del app-server de Codex.                                                    |
| `codexPlugins`             | deshabilitado            | Compatibilidad nativa con plugins/apps de Codex, incluido el acceso opcional a apps de cuentas conectadas. Consulta [Plugins nativos de Codex](/es/plugins/codex-native-plugins). |
| `computerUse`              | deshabilitado            | Configuración de Codex Computer Use. Consulta [Codex Computer Use](/es/plugins/codex-computer-use).                                                                    |

## Transporte del app-server

De forma predeterminada, OpenClaw inicia el binario gestionado de Codex que se envía con el
plugin incluido (actualmente `@openai/codex` `0.142.5`):

```bash
codex app-server --listen stdio://
```

Esto mantiene la versión del app-server vinculada al plugin `codex` incluido, en lugar de
a cualquier CLI de Codex independiente que esté instalada localmente. Configura
`appServer.command` solo cuando quieras usar intencionalmente otro ejecutable.

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
| `transport`                                   | `"stdio"`                                              | `"stdio"` inicia Codex; `"websocket"` se conecta a `url`.                                                                                                                                                                                                                                                                                                                                       |
| `homeScope`                                   | `"agent"`                                              | `"agent"` aísla el estado de Codex por agente de OpenClaw. `"user"` comparte el `$CODEX_HOME` nativo o `~/.codex`, usa la autenticación nativa y habilita la gestión de hilos exclusiva del propietario. El alcance de usuario requiere stdio.                                                                                                                                                |
| `command`                                     | binario de Codex gestionado                            | Ejecutable para el transporte stdio. Déjalo sin establecer para usar el binario gestionado.                                                                                                                                                                                                                                                                                                     |
| `args`                                        | `["app-server", "--listen", "stdio://"]`               | Argumentos para el transporte stdio.                                                                                                                                                                                                                                                                                                                                                            |
| `url`                                         | sin establecer                                         | URL del app-server WebSocket.                                                                                                                                                                                                                                                                                                                                                                   |
| `authToken`                                   | sin establecer                                         | Token Bearer para el transporte WebSocket. Acepta una cadena literal o SecretInput como `${CODEX_APP_SERVER_TOKEN}`.                                                                                                                                                                                                                                                                            |
| `headers`                                     | `{}`                                                   | Encabezados WebSocket adicionales. Los valores de encabezado aceptan cadenas literales o valores SecretInput, por ejemplo `x-codex-client-session-token: "${CODEX_CLIENT_SESSION_TOKEN}"`.                                                                                                                                                                                                      |
| `clearEnv`                                    | `[]`                                                   | Nombres adicionales de variables de entorno que se eliminan del proceso app-server stdio iniciado después de que OpenClaw construye su entorno heredado.                                                                                                                                                                                                                                        |
| `remoteWorkspaceRoot`                         | sin establecer                                         | Raíz remota del espacio de trabajo del app-server de Codex. Cuando se establece, OpenClaw infiere la raíz del espacio de trabajo local a partir del espacio de trabajo de OpenClaw resuelto, conserva el sufijo del cwd actual bajo esta raíz remota y envía solo el cwd final del app-server a Codex. Si el cwd está fuera de la raíz del espacio de trabajo de OpenClaw resuelto, OpenClaw falla en modo cerrado en lugar de enviar una ruta local del Gateway al app-server remoto. |
| `requestTimeoutMs`                            | `60000`                                                | Tiempo de espera para llamadas del plano de control del app-server.                                                                                                                                                                                                                                                                                                                             |
| `turnCompletionIdleTimeoutMs`                 | `60000`                                                | Ventana de silencio después de que Codex acepta un turno o después de una solicitud del app-server con alcance de turno mientras OpenClaw espera `turn/completed`.                                                                                                                                                                                                                              |
| `postToolRawAssistantCompletionIdleTimeoutMs` | `300000`                                               | Guardia de inactividad de finalización y progreso usada después de una transferencia de herramienta, finalización de herramienta nativa, progreso del asistente sin procesar posterior a herramienta, finalización de razonamiento sin procesar o progreso de razonamiento mientras OpenClaw espera `turn/completed`. Usa esto para cargas de trabajo confiables o pesadas en las que la síntesis posterior a herramienta puede permanecer legítimamente en silencio durante más tiempo que el presupuesto final de entrega del asistente. |
| `mode`                                        | `"yolo"` salvo que los requisitos locales de Codex no permitan YOLO | Preajuste para ejecución YOLO o revisada por guardián.                                                                                                                                                                                                                                                                                                                                          |
| `approvalPolicy`                              | `"never"` o una política de aprobación de guardián permitida | Política de aprobación nativa de Codex enviada al inicio de hilo, reanudación y turno.                                                                                                                                                                                                                                                                                                          |
| `sandbox`                                     | `"danger-full-access"` o un sandbox de guardián permitido | Modo sandbox nativo de Codex enviado al inicio y reanudación de hilo. Los sandboxes activos de OpenClaw restringen los turnos `danger-full-access` a `workspace-write` de Codex; la bandera de red del turno sigue la salida del sandbox de OpenClaw.                                                                                                                                          |
| `approvalsReviewer`                           | `"user"` o un revisor de guardián permitido            | Usa `"auto_review"` para permitir que Codex revise las solicitudes de aprobación nativas cuando esté permitido.                                                                                                                                                                                                                                                                                  |
| `defaultWorkspaceDir`                         | directorio del proceso actual                          | Espacio de trabajo usado por `/codex bind` cuando se omite `--cwd`.                                                                                                                                                                                                                                                                                                                             |
| `serviceTier`                                 | sin establecer                                         | Nivel de servicio opcional del app-server de Codex. `"priority"` habilita el enrutamiento de modo rápido, `"flex"` solicita procesamiento flex y `null` borra la anulación. El valor heredado `"fast"` se acepta como `"priority"`.                                                                                                                                                            |
| `networkProxy`                                | deshabilitado                                          | Opta por la red de perfil de permisos de Codex para comandos del app-server. OpenClaw define la configuración `permissions.<profile>.network` seleccionada y la selecciona con `default_permissions` en lugar de enviar `sandbox`.                                                                                                                                                              |
| `experimental.sandboxExecServer`              | `false`                                                | Suscripción preliminar que registra en Codex app-server 0.132.0 o posterior un entorno de Codex respaldado por el sandbox de OpenClaw para que la ejecución nativa de Codex pueda ejecutarse dentro del sandbox activo de OpenClaw.                                                                                                                                                              |

`appServer.networkProxy` es explícito porque cambia el contrato de sandbox de
Codex. Cuando está habilitado, OpenClaw también establece `features.network_proxy.enabled` y
`default_permissions` en la configuración del hilo de Codex para que el perfil
de permisos generado pueda iniciar la red gestionada por Codex. OpenClaw genera de forma
predeterminada un nombre de perfil `openclaw-network-<fingerprint>` resistente a colisiones a partir del
cuerpo del perfil; usa `profileName` solo cuando se requiera un nombre local
estable.

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
`networkProxy` usa en su lugar acceso al sistema de archivos de estilo workspace
para el perfil de permisos generado. La aplicación de red gestionada por Codex
es networking en sandbox, por lo que un perfil de acceso completo no protegería
el tráfico saliente.

El Plugin bloquea handshakes de servidor de aplicaciones antiguos o sin versión:
el servidor de aplicaciones Codex debe informar la versión estable `0.125.0` o
posterior.

OpenClaw trata las URL WebSocket de servidor de aplicaciones que no son loopback
como remotas y requiere autenticación WebSocket con identidad mediante
`appServer.authToken` o un encabezado `Authorization`. `appServer.authToken` y
cada valor `appServer.headers.*` pueden ser un SecretInput; el runtime de
secretos resuelve SecretRefs y la abreviatura de env antes de que OpenClaw cree
las opciones de inicio del servidor de aplicaciones, y los SecretRefs
estructurados sin resolver fallan antes de que se envíe cualquier token o
encabezado. Cuando se configuran plugins nativos de Codex, OpenClaw usa el plano
de control de plugins del servidor de aplicaciones conectado para instalar o
actualizar esos plugins y luego actualiza el inventario de apps para que las
apps propiedad del plugin sean visibles para el hilo de Codex. `app/list` sigue
siendo la fuente autoritativa de inventario y metadatos, pero la política de
OpenClaw decide si `thread/start` envía `config.apps[appId].enabled = true` para
una app accesible listada aunque Codex la marque actualmente como deshabilitada.
Los ids de app desconocidos o faltantes siguen fallando de forma cerrada; esta
ruta solo activa plugins de marketplace mediante `plugin/install` y actualiza el
inventario. Conecta OpenClaw solo a servidores de aplicaciones remotos en los que
confíes para aceptar instalaciones de plugins gestionadas por OpenClaw y
actualizaciones de inventario de apps.

## Modos de aprobación y sandbox

Las sesiones locales de servidor de aplicaciones por stdio usan por defecto el
modo YOLO: `approvalPolicy: "never"`, `approvalsReviewer: "user"` y
`sandbox: "danger-full-access"`. Esta postura de operador local de confianza
permite que los turnos y Heartbeat desatendidos de OpenClaw avancen sin prompts
de aprobación nativos que nadie puede responder.

Si el archivo local de requisitos del sistema de Codex no permite valores
implícitos de aprobación YOLO, revisor o sandbox, OpenClaw trata el valor
implícito predeterminado como guardian y selecciona permisos guardian permitidos.
`tools.exec.mode: "auto"` también fuerza aprobaciones de Codex revisadas por
guardian y no conserva overrides heredados inseguros de
`approvalPolicy: "never"` o `sandbox: "danger-full-access"`; configura
`tools.exec.mode: "full"` para una postura intencional sin aprobación. Las
entradas `[[remote_sandbox_config]]` que coinciden con el hostname en el mismo
archivo de requisitos se respetan para la decisión predeterminada de sandbox.

Configura `appServer.mode: "guardian"` para aprobaciones de Codex revisadas por
guardian:

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

El preset `guardian` se expande a `approvalPolicy: "on-request"`,
`approvalsReviewer: "auto_review"` y `sandbox: "workspace-write"` cuando esos
valores están permitidos. Los campos individuales de política sobrescriben
`mode`. El valor de revisor anterior `guardian_subagent` aún se acepta como
alias de compatibilidad, pero las configuraciones nuevas deben usar
`auto_review`.

Cuando un sandbox de OpenClaw está activo, el proceso local del servidor de
aplicaciones Codex sigue ejecutándose en el host del Gateway. Por tanto,
OpenClaw deshabilita Codex Code Mode nativo, los servidores MCP de usuario y la
ejecución de plugins respaldada por apps para ese turno, en lugar de tratar el
sandbox del lado del host de Codex como equivalente al backend de sandbox de
OpenClaw. El acceso shell se expone mediante herramientas dinámicas respaldadas
por el sandbox de OpenClaw, como `sandbox_exec` y `sandbox_process`, cuando las
herramientas normales de exec/process están disponibles.

<Note>
En hosts de sandbox de OpenClaw respaldados por Docker
(`agents.defaults.sandbox.mode` configurado en un backend Docker),
`openclaw doctor` comprueba si el host permite los namespaces de usuario sin
privilegios (y, cuando la salida de red del sandbox Docker está deshabilitada,
de red) que `bwrap` anidado de Codex necesita para la ejecución shell
`workspace-write` dentro del contenedor sandbox. Una comprobación fallida suele
aparecer como `bwrap: setting up uid map: Permission denied` o
`bwrap: loopback: Failed RTM_NEWADDR: Operation not permitted` en hosts
Ubuntu/AppArmor. Corrige la política de namespaces del host indicada para el
usuario de servicio de OpenClaw y reinicia el gateway; prefiere un perfil
AppArmor acotado para el proceso de servicio antes que el fallback para todo el
host `kernel.apparmor_restrict_unprivileged_userns=0`, y no concedas privilegios
más amplios al contenedor Docker solo para satisfacer `bwrap` anidado.
</Note>

## Ejecución nativa en sandbox

El valor predeterminado estable es fallar de forma cerrada: el sandbox activo de
OpenClaw deshabilita las superficies de ejecución nativa de Codex que de otro
modo se ejecutarían desde el host del servidor de aplicaciones Codex. Usa
`appServer.experimental.sandboxExecServer: true` solo cuando quieras probar el
soporte de entorno remoto de Codex con el backend de sandbox de OpenClaw. Esta
ruta de vista previa requiere el servidor de aplicaciones Codex 0.132.0 o
posterior.

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

Cuando la bandera está activada y la sesión actual de OpenClaw está en sandbox,
OpenClaw inicia un servidor de exec de local loopback respaldado por el sandbox
activo, lo registra con el servidor de aplicaciones Codex e inicia el hilo y el
turno de Codex con ese entorno propiedad de OpenClaw. Si el servidor de
aplicaciones no puede registrar el entorno, la ejecución falla de forma cerrada
en lugar de volver silenciosamente a la ejecución en el host.

Esta ruta de vista previa es solo local. Un servidor de aplicaciones WebSocket
remoto no puede alcanzar el servidor de exec loopback salvo que se ejecute en el
mismo host, por lo que OpenClaw rechaza esa combinación.

## Aislamiento de autenticación y entorno

En el home predeterminado por agente, la autenticación se selecciona en este
orden:

1. Un perfil explícito de autenticación Codex de OpenClaw para el agente.
2. La cuenta existente del servidor de aplicaciones en el home de Codex de ese
   agente.
3. Solo para lanzamientos locales de servidor de aplicaciones por stdio,
   `CODEX_API_KEY`, luego `OPENAI_API_KEY`, cuando no hay ninguna cuenta de
   servidor de aplicaciones presente y la autenticación OpenAI aún es necesaria.

Cuando OpenClaw detecta un perfil de autenticación Codex de estilo suscripción
ChatGPT (tipo de credencial OAuth o token), elimina `CODEX_API_KEY` y
`OPENAI_API_KEY` del proceso hijo de Codex generado. Eso mantiene las claves API
a nivel de Gateway disponibles para embeddings o modelos OpenAI directos sin
hacer que los turnos nativos del servidor de aplicaciones Codex se facturen por
la API por accidente.

Los perfiles explícitos de clave API de Codex y el fallback local de clave env
por stdio usan login del servidor de aplicaciones en lugar del env heredado del
proceso hijo. Las conexiones WebSocket de servidor de aplicaciones no reciben
fallback de clave API env del Gateway; usa un perfil de autenticación explícito
o la propia cuenta del servidor de aplicaciones remoto.

Los lanzamientos de servidor de aplicaciones por stdio heredan por defecto el
entorno del proceso de OpenClaw. OpenClaw posee el puente de cuenta del servidor
de aplicaciones Codex y configura `CODEX_HOME` en un directorio por agente bajo
el estado de OpenClaw de ese agente. Eso mantiene la configuración, las cuentas,
la caché/datos de plugins y el estado de hilos de Codex acotados al agente de
OpenClaw, en lugar de filtrarse desde el home personal `~/.codex` del operador.

Configura `appServer.homeScope: "user"` para compartir el estado nativo de
Codex con Codex Desktop y la CLI. Este modo solo para stdio local usa
`$CODEX_HOME` cuando está configurado y `~/.codex` en caso contrario, incluida
la autenticación, configuración, plugins e hilos nativos. OpenClaw omite su
puente de perfil de autenticación para el servidor de aplicaciones. Los turnos
de propietario verificados pueden usar `codex_threads` para listar (con un
filtro opcional `search`), leer, bifurcar, renombrar, archivar y desarchivar
esos hilos. Bifurca un hilo antes de continuarlo en OpenClaw; los procesos
independientes de Codex no coordinan escritores concurrentes para el mismo hilo.

OpenClaw no reescribe `HOME` para lanzamientos locales normales de servidor de
aplicaciones. Los subprocesos ejecutados por Codex, como `openclaw`, `gh`,
`git`, CLI de nube y comandos shell, ven el home normal del proceso y pueden
encontrar configuración y tokens del home de usuario. Codex también puede
descubrir `$HOME/.agents/skills` y `$HOME/.agents/plugins/marketplace.json`; ese
descubrimiento de `.agents` se comparte intencionalmente con el home del
operador y está separado del estado aislado de `~/.codex`.

En el alcance predeterminado del agente, los plugins de OpenClaw y las
instantáneas de Skills de OpenClaw siguen fluyendo por el propio registro de
plugins y cargador de Skills de OpenClaw; los recursos personales de Codex
`~/.codex` no. Si tienes Skills o plugins útiles de la CLI de Codex de un home
de Codex que deban formar parte de un agente aislado de OpenClaw, haz su
inventario explícitamente:

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

Si un despliegue necesita aislamiento adicional del entorno, añade esas
variables a `appServer.clearEnv`:

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

`appServer.clearEnv` solo afecta al proceso hijo del servidor de aplicaciones
Codex generado. OpenClaw elimina `CODEX_HOME` y `HOME` de esta lista durante la
normalización del lanzamiento local: `CODEX_HOME` sigue apuntando al alcance de
agente o usuario seleccionado, y `HOME` sigue heredado para que los subprocesos
puedan usar el estado normal del home de usuario.

## Herramientas dinámicas

Las herramientas dinámicas de Codex usan por defecto carga `searchable`, expuesta
bajo el namespace `openclaw` con `deferLoading: true`. OpenClaw no expone
herramientas dinámicas que duplican operaciones nativas de workspace de Codex o
la propia superficie de búsqueda de herramientas de Codex:

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

La mayoría de las herramientas restantes de integración de OpenClaw, como
mensajería, medios, Cron, navegador, nodos, Gateway, `heartbeat_respond` y
`web_search`, están disponibles mediante la búsqueda de herramientas de Codex
bajo ese namespace. Esto reduce el contexto inicial del modelo. Un pequeño
conjunto de herramientas sigue siendo invocable directamente sin importar
`codexDynamicToolsLoading`, porque la búsqueda de herramientas de Codex puede no
estar disponible o resolver un universo solo de conectores: `agents_list`,
`sessions_spawn` y `sessions_yield`. Las instrucciones de desarrollador aún
orientan a los subagentes normales de Codex hacia `spawn_agent` nativo para
trabajo de subagentes nativo de Codex, mientras que `sessions_spawn` sigue
disponible para delegación explícita de OpenClaw o ACP. Las respuestas de origen
solo con herramientas de mensaje también siguen directas, ya que eso es un
contrato de control de turnos.

Configura `codexDynamicToolsLoading: "direct"` solo al conectar con un servidor
de aplicaciones Codex personalizado que no pueda buscar herramientas dinámicas
diferidas o al depurar el payload completo de herramientas.

## Tiempos de espera

Las llamadas a herramientas dinámicas propiedad de OpenClaw están acotadas de
forma independiente de `appServer.requestTimeoutMs`. Cada solicitud
`item/tool/call` de Codex usa el primer timeout disponible en este orden:

- Un argumento positivo `timeoutMs` por llamada.
- Para `image_generate`, `agents.defaults.imageGenerationModel.timeoutMs`.
- Para `image_generate` sin un timeout configurado, el valor predeterminado de
  generación de imágenes de 120 segundos.
- Para la herramienta `image` de comprensión de medios,
  `tools.media.image.timeoutSeconds` convertido a milisegundos, o el valor
  predeterminado de medios de 60 segundos. Para comprensión de imágenes, esto se
  aplica a la solicitud en sí y no se reduce por trabajo de preparación
  anterior.
- Para la herramienta `message`, un valor predeterminado fijo de 120 segundos.
- El valor predeterminado de herramientas dinámicas de 90 segundos.

Este watchdog es el presupuesto externo dinámico de `item/tool/call`. Los
timeouts de solicitud específicos del proveedor se ejecutan dentro de esa
llamada y mantienen su propia semántica de timeout. Los presupuestos de
herramientas dinámicas están limitados a 600000 ms. Al agotarse el tiempo,
OpenClaw aborta la señal de la herramienta cuando es compatible y devuelve una
respuesta fallida de herramienta dinámica a Codex para que el turno pueda
continuar en lugar de dejar la sesión en `processing`.

Después de que Codex acepta un turno, y después de que OpenClaw responde a una solicitud
de app-server con alcance de turno, el arnés espera que Codex avance en el turno actual
y finalmente termine el turno nativo con `turn/completed`. Si el
app-server queda en silencio durante `appServer.turnCompletionIdleTimeoutMs`, OpenClaw
interrumpe el turno de Codex en modo de mejor esfuerzo, registra un tiempo de espera de diagnóstico y
libera el carril de sesión de OpenClaw para que los mensajes de chat de seguimiento no queden en cola
detrás de un turno nativo obsoleto.

La mayoría de las notificaciones no terminales para el mismo turno desarman ese watchdog corto
porque Codex ha demostrado que el turno sigue vivo. Las entregas de herramientas usan un presupuesto
de inactividad posterior a la herramienta más largo: después de que OpenClaw devuelve una respuesta
`item/tool/call`, después de que elementos de herramienta nativos como `commandExecution` se completan,
después de completaciones `custom_tool_call_output` sin procesar, y después del progreso de asistente
sin procesar posterior a la herramienta, completaciones de razonamiento sin procesar o progreso de razonamiento.
La guarda usa `appServer.postToolRawAssistantCompletionIdleTimeoutMs` cuando está configurado y
de lo contrario usa cinco minutos de forma predeterminada. Ese mismo presupuesto posterior a la herramienta también extiende
el watchdog de progreso para la ventana de síntesis silenciosa antes de que Codex emita el
siguiente evento del turno actual. Las completaciones de razonamiento, las completaciones `agentMessage`
de comentario y el progreso de razonamiento o de asistente sin procesar previo a la herramienta pueden ir seguidos
por una respuesta final automática, por lo que usan la guarda de respuesta posterior al progreso
en lugar de liberar el carril de sesión inmediatamente. Solo los elementos `agentMessage` completados
finales/no de comentario y las completaciones de asistente sin procesar previas a la herramienta arman la
liberación de salida del asistente: si Codex luego queda en silencio sin `turn/completed`,
OpenClaw interrumpe el turno nativo en modo de mejor esfuerzo y libera el carril de sesión.
Los fallos del app-server stdio seguros para repetición, incluidos los tiempos de espera de finalización
de turno sin evidencia de asistente, herramienta, elemento activo o efecto secundario, se
reintentan una vez en un nuevo intento de app-server. Los tiempos de espera no seguros aun así retiran el
cliente app-server bloqueado y liberan el carril de sesión de OpenClaw. También
limpian el enlace obsoleto del hilo nativo en lugar de repetirse
automáticamente. Los tiempos de espera de vigilancia de completación muestran texto de tiempo de espera específico de Codex:
los casos seguros para repetición dicen que la respuesta puede estar incompleta, mientras que los casos no seguros indican
al usuario que verifique el estado actual antes de reintentar. Los diagnósticos públicos de tiempo de espera
incluyen campos estructurales como el último método de notificación del app-server,
el id/tipo/rol del elemento de respuesta del asistente sin procesar, los recuentos de solicitudes/elementos activos y
el estado de vigilancia armada. Cuando la última notificación es un elemento de respuesta de asistente
sin procesar, también incluyen una vista previa acotada del texto del asistente. No
incluyen contenido sin procesar de prompts ni de herramientas.

## Descubrimiento de modelos

De forma predeterminada, el Plugin de Codex solicita al app-server los modelos disponibles. La
disponibilidad de modelos pertenece al app-server de Codex, por lo que la lista puede cambiar cuando
OpenClaw actualiza la versión empaquetada de `@openai/codex` o cuando un despliegue
apunta `appServer.command` a un binario de Codex diferente. La disponibilidad también puede
tener alcance de cuenta. Usa `/codex models` en un Gateway en ejecución para ver el catálogo en vivo
de ese arnés y cuenta.

Si el descubrimiento falla o agota el tiempo de espera, OpenClaw usa un catálogo de respaldo empaquetado:

| ID de modelo   | Nombre para mostrar | Esfuerzos de razonamiento |
| -------------- | ------------------- | ------------------------- |
| `gpt-5.5`      | gpt-5.5             | low, medium, high, xhigh  |
| `gpt-5.4-mini` | GPT-5.4-Mini        | low, medium, high, xhigh  |

<Note>
El arnés empaquetado actual es `@openai/codex` `0.142.5`. Un sondeo `model/list`
contra ese app-server empaquetado devolvió estas filas públicas del selector más allá del
catálogo de respaldo:

| ID de modelo         | Modalidades de entrada | Esfuerzos de razonamiento |
| -------------------- | ---------------------- | ------------------------- |
| `gpt-5.5`            | text, image            | low, medium, high, xhigh  |
| `gpt-5.4`            | text, image            | low, medium, high, xhigh  |
| `gpt-5.4-mini`       | text, image            | low, medium, high, xhigh  |
| `gpt-5.3-codex-spark` | text                  | low, medium, high, xhigh  |

Las filas del selector en vivo tienen alcance de cuenta y pueden cambiar con la cuenta, el catálogo de Codex
o la versión empaquetada; ejecuta `/codex models` para obtener la lista actual en lugar
de depender de cualquier tabla puntual. Los modelos ocultos también pueden aparecer en el
catálogo del app-server para flujos internos o especializados sin ser opciones normales
del selector de modelos.
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

Desactiva el descubrimiento cuando quieras que el inicio evite sondear Codex y use solo
el catálogo de respaldo:

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

## Archivos de arranque del espacio de trabajo

Codex gestiona `AGENTS.md` por sí mismo mediante el descubrimiento nativo de documentación de proyecto.
OpenClaw no escribe archivos sintéticos de documentación de proyecto de Codex ni depende de nombres
de archivo de respaldo de Codex para archivos de persona, porque los respaldos de Codex solo aplican cuando
falta `AGENTS.md`.

Para la paridad del espacio de trabajo de OpenClaw, el arnés de Codex reenvía los otros
archivos de arranque como instrucciones de desarrollador, pero no de forma idéntica:

- `TOOLS.md` se reenvía como instrucciones de desarrollador de Codex **heredadas**, por lo que
  los subagentes nativos de Codex creados durante el turno también lo ven.
- `SOUL.md`, `IDENTITY.md` y `USER.md` se reenvían como instrucciones de colaboración
  **con alcance de turno**. Los subagentes nativos de Codex no las heredan,
  lo que evita que los turnos de subagente adopten la persona y el perfil de usuario
  del agente padre.
- La lista compacta cargada de Skills de OpenClaw también se reenvía como instrucciones
  de desarrollador de colaboración con alcance de turno, por lo que los subagentes nativos de Codex
  tampoco la heredan.
- El contenido de `HEARTBEAT.md` no se inyecta; los turnos de Heartbeat reciben un
  puntero en modo colaboración para leer el archivo cuando existe y no está vacío.
- El contenido de `MEMORY.md` del espacio de trabajo de agente configurado no se pega en
  la entrada del turno nativo de Codex cuando hay herramientas de memoria disponibles para ese
  espacio de trabajo; cuando existe, el arnés agrega un pequeño puntero de memoria de espacio de trabajo
  a las instrucciones de desarrollador de colaboración con alcance de turno y Codex
  debería usar `memory_search` o `memory_get` cuando la memoria duradera sea relevante.
  Si las herramientas están desactivadas, la búsqueda de memoria no está disponible o el espacio de trabajo
  activo difiere del espacio de trabajo de memoria del agente, `MEMORY.md` usa en su lugar
  la ruta normal acotada de contexto de turno.
- `BOOTSTRAP.md`, cuando está presente, se reenvía como contexto de referencia de entrada de turno
  de OpenClaw.

## Sobrescrituras de entorno

Las sobrescrituras de entorno siguen disponibles para pruebas locales:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN` omite el binario gestionado cuando
`appServer.command` no está definido.

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` se eliminó. Usa
`plugins.entries.codex.config.appServer.mode: "guardian"` en su lugar, o
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` para pruebas locales puntuales. Se
prefiere la configuración para despliegues repetibles porque mantiene el comportamiento del Plugin en
el mismo archivo revisado que el resto de la configuración del arnés de Codex.

## Relacionado

- [Arnés de Codex](/es/plugins/codex-harness)
- [Runtime del arnés de Codex](/es/plugins/codex-harness-runtime)
- [Plugins nativos de Codex](/es/plugins/codex-native-plugins)
- [Uso de computadora de Codex](/es/plugins/codex-computer-use)
- [Proveedor de OpenAI](/es/providers/openai)
- [Referencia de configuración](/es/gateway/configuration-reference)
