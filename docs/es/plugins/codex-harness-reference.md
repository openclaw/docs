---
read_when:
    - Necesitas todos los campos de configuración del arnés de Codex
    - Estás cambiando el comportamiento de transporte, autenticación, descubrimiento o tiempo de espera de app-server
    - Está depurando el inicio del arnés de Codex, el descubrimiento de modelos o el aislamiento del entorno
summary: Referencia de configuración, autenticación, descubrimiento y servidor de aplicaciones para el arnés de Codex
title: Referencia del arnés de Codex
x-i18n:
    generated_at: "2026-07-04T20:24:53Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f1ffe2404dd35df36a706c098f99b841a9664baf76ee5d712836bb35d9ac78bc
    source_path: plugins/codex-harness-reference.md
    workflow: 16
---

Esta referencia cubre la configuración detallada del Plugin `codex`
incluido. Para la configuración inicial y las decisiones de enrutamiento, empieza con
[arnés de Codex](/es/plugins/codex-harness).

## Superficie de configuración del Plugin

Todos los ajustes del arnés de Codex se encuentran en `plugins.entries.codex.config`.

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

Campos de nivel superior admitidos:

| Campo                      | Predeterminado           | Significado                                                                                                                               |
| -------------------------- | ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `discovery`                | habilitado               | Ajustes de descubrimiento de modelos para `model/list` del app-server de Codex.                                                          |
| `appServer`                | app-server stdio gestionado | Ajustes de transporte, comando, autenticación, aprobación, sandbox y tiempo de espera.                                                     |
| `codexDynamicToolsLoading` | `"searchable"`           | Usa `"direct"` para colocar las herramientas dinámicas de OpenClaw directamente en el contexto inicial de herramientas de Codex.          |
| `codexDynamicToolsExclude` | `[]`                     | Nombres adicionales de herramientas dinámicas de OpenClaw que se deben omitir en los turnos del app-server de Codex.                     |
| `codexPlugins`             | deshabilitado            | Compatibilidad nativa con plugins/apps de Codex para plugins seleccionados instalados desde el código fuente y migrados. Consulta [plugins nativos de Codex](/es/plugins/codex-native-plugins). |
| `computerUse`              | deshabilitado            | Configuración de Codex Computer Use. Consulta [Codex Computer Use](/es/plugins/codex-computer-use).                                          |

## Transporte del app-server

De forma predeterminada, OpenClaw inicia el binario gestionado de Codex incluido con el Plugin
`codex` incluido:

```bash
codex app-server --listen stdio://
```

Esto mantiene la versión del app-server ligada al Plugin `codex` incluido en lugar de
a cualquier CLI de Codex independiente que esté instalada localmente. Define
`appServer.command` solo cuando quieras ejecutar intencionadamente un
ejecutable diferente.

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

Campos `appServer` admitidos:

| Campo                                         | Predeterminado                                        | Significado                                                                                                                                                                                                                                                                                                                                                                                        |
| --------------------------------------------- | ----------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                                   | `"stdio"`                                             | `"stdio"` inicia Codex; `"websocket"` se conecta a `url`.                                                                                                                                                                                                                                                                                                                                          |
| `homeScope`                                   | `"agent"`                                             | `"agent"` aísla el estado de Codex por agente de OpenClaw. `"user"` comparte el `$CODEX_HOME` nativo o `~/.codex`, usa la autenticación nativa y habilita la administración de hilos solo para el propietario. El alcance de usuario requiere stdio.                                                                                                                                               |
| `command`                                     | binario de Codex administrado                         | Ejecutable para el transporte stdio. Déjalo sin definir para usar el binario administrado.                                                                                                                                                                                                                                                                                                         |
| `args`                                        | `["app-server", "--listen", "stdio://"]`              | Argumentos para el transporte stdio.                                                                                                                                                                                                                                                                                                                                                                |
| `url`                                         | sin definir                                           | URL del servidor de aplicación WebSocket.                                                                                                                                                                                                                                                                                                                                                           |
| `authToken`                                   | sin definir                                           | Token Bearer para el transporte WebSocket. Acepta una cadena literal o SecretInput como `${CODEX_APP_SERVER_TOKEN}`.                                                                                                                                                                                                                                                                               |
| `headers`                                     | `{}`                                                  | Encabezados WebSocket adicionales. Los valores de encabezado aceptan cadenas literales o valores SecretInput, por ejemplo `x-codex-client-session-token: "${CODEX_CLIENT_SESSION_TOKEN}"`.                                                                                                                                                                                                         |
| `clearEnv`                                    | `[]`                                                  | Nombres de variables de entorno adicionales eliminados del proceso app-server stdio iniciado después de que OpenClaw crea su entorno heredado.                                                                                                                                                                                                                                                       |
| `remoteWorkspaceRoot`                         | sin definir                                           | Raíz remota del espacio de trabajo del app-server de Codex. Cuando se define, OpenClaw infiere la raíz del espacio de trabajo local a partir del espacio de trabajo de OpenClaw resuelto, conserva el sufijo del cwd actual bajo esta raíz remota y envía solo el cwd final del app-server a Codex. Si el cwd está fuera de la raíz del espacio de trabajo de OpenClaw resuelta, OpenClaw falla de forma cerrada en lugar de enviar una ruta local del Gateway al app-server remoto. |
| `requestTimeoutMs`                            | `60000`                                               | Tiempo de espera para llamadas del plano de control del app-server.                                                                                                                                                                                                                                                                                                                                 |
| `turnCompletionIdleTimeoutMs`                 | `60000`                                               | Ventana de silencio después de que Codex acepta un turno o después de una solicitud del app-server con alcance de turno mientras OpenClaw espera `turn/completed`.                                                                                                                                                                                                                                  |
| `postToolRawAssistantCompletionIdleTimeoutMs` | `300000`                                              | Guardia de inactividad de finalización y progreso usada después de una entrega a herramienta, finalización de herramienta nativa, progreso sin procesar del asistente posterior a herramienta, finalización de razonamiento sin procesar o progreso de razonamiento mientras OpenClaw espera `turn/completed`. Usa esto para cargas de trabajo confiables o pesadas en las que la síntesis posterior a herramienta puede permanecer legítimamente en silencio más tiempo que el presupuesto final de entrega del asistente. |
| `mode`                                        | `"yolo"` salvo que los requisitos locales de Codex no permitan YOLO | Ajuste preestablecido para ejecución YOLO o revisada por guardian.                                                                                                                                                                                                                                                                                                                                  |
| `approvalPolicy`                              | `"never"` o una política de aprobación guardian permitida | Política de aprobación nativa de Codex enviada al inicio, reanudación y turno del hilo.                                                                                                                                                                                                                                                                                                            |
| `sandbox`                                     | `"danger-full-access"` o un sandbox guardian permitido | Modo sandbox nativo de Codex enviado al inicio y reanudación del hilo. Los sandboxes activos de OpenClaw reducen los turnos `danger-full-access` a `workspace-write` de Codex; la bandera de red del turno sigue la salida del sandbox de OpenClaw.                                                                                                                                               |
| `approvalsReviewer`                           | `"user"` o un revisor guardian permitido              | Usa `"auto_review"` para permitir que Codex revise solicitudes de aprobación nativas cuando esté permitido.                                                                                                                                                                                                                                                                                        |
| `defaultWorkspaceDir`                         | directorio del proceso actual                         | Espacio de trabajo usado por `/codex bind` cuando se omite `--cwd`.                                                                                                                                                                                                                                                                                                                                |
| `serviceTier`                                 | sin definir                                           | Nivel de servicio opcional del app-server de Codex. `"priority"` habilita el enrutamiento de modo rápido, `"flex"` solicita procesamiento flex y `null` borra la anulación. El valor heredado `"fast"` se acepta como `"priority"`.                                                                                                                                                                |
| `networkProxy`                                | deshabilitado                                         | Activa la red de perfil de permisos de Codex para comandos del app-server. OpenClaw define la configuración `permissions.<profile>.network` seleccionada y la selecciona con `default_permissions` en lugar de enviar `sandbox`.                                                                                                                                                                    |
| `experimental.sandboxExecServer`              | `false`                                               | Activación opcional de vista previa que registra un entorno de Codex respaldado por el sandbox de OpenClaw con Codex app-server 0.132.0 o posterior para que la ejecución nativa de Codex pueda ejecutarse dentro del sandbox activo de OpenClaw.                                                                                                                                                  |

`appServer.networkProxy` es explícito porque cambia el contrato de sandbox de Codex.
Cuando está habilitado, OpenClaw también define `features.network_proxy.enabled` y
`default_permissions` en la configuración del hilo de Codex para que el perfil de
permisos generado pueda iniciar la red administrada por Codex. De forma predeterminada,
OpenClaw genera un nombre de perfil `openclaw-network-<fingerprint>` resistente a
colisiones a partir del cuerpo del perfil; usa `profileName` solo cuando se requiere
un nombre local estable.

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

Si el runtime normal de app-server sería `danger-full-access`, habilitar
`networkProxy` usa acceso al sistema de archivos de estilo workspace para el
perfil de permisos generado. La aplicación de red administrada por Codex es red
en sandbox, por lo que un perfil de acceso completo no protegería el tráfico
saliente.

El plugin bloquea handshakes de app-server antiguos o sin versión. Codex app-server
debe informar la versión estable `0.125.0` o una más reciente.

OpenClaw trata las URL WebSocket de app-server que no son de loopback como remotas y requiere
autenticación WebSocket con identidad mediante `appServer.authToken` o un encabezado
`Authorization`. `appServer.authToken` y cada valor `appServer.headers.*`
pueden ser SecretInput; el runtime de secretos resuelve SecretRefs y abreviaturas de env
antes de que OpenClaw cree las opciones de inicio de app-server, y las SecretRefs
estructuradas sin resolver fallan antes de que se envíe cualquier token o encabezado. Cuando se configuran plugins nativos de Codex, OpenClaw usa el plano de control de plugins del app-server conectado
para instalar o actualizar esos plugins y luego actualiza el inventario de apps para que
las apps propiedad de plugins sean visibles para el hilo de Codex. `app/list` sigue siendo la
fuente autoritativa de inventario y metadatos, pero la política de OpenClaw decide si
`thread/start` envía `config.apps[appId].enabled = true` para una app accesible listada
aunque Codex actualmente la marque como deshabilitada. Los ids de app desconocidos o ausentes permanecen
cerrados por defecto; esta ruta solo activa plugins de marketplace mediante `plugin/install`
y actualiza el inventario. Conecta OpenClaw solo a app-servers remotos en los que
se confíe para aceptar instalaciones de plugins administradas por OpenClaw y actualizaciones del inventario de apps.

## Modos de aprobación y sandbox

Las sesiones locales de app-server por stdio tienen por defecto el modo YOLO:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` y
`sandbox: "danger-full-access"`. Esta postura de operador local confiable permite que
los turnos y heartbeats desatendidos de OpenClaw progresen sin prompts de aprobación nativos
que no hay nadie para responder.

Si el archivo de requisitos del sistema local de Codex no permite valores YOLO implícitos de aprobación,
revisor o sandbox, OpenClaw trata el valor predeterminado implícito como guardian
en su lugar y selecciona permisos guardian permitidos. `tools.exec.mode: "auto"`
también fuerza aprobaciones de Codex revisadas por guardian y no conserva overrides heredados no seguros de
`approvalPolicy: "never"` o `sandbox: "danger-full-access"`;
establece `tools.exec.mode: "full"` para una postura intencional sin aprobación.
Las entradas
`[[remote_sandbox_config]]` que coinciden con el hostname en el mismo archivo de requisitos se respetan
para la decisión predeterminada del sandbox.

Establece `appServer.mode: "guardian"` para aprobaciones de Codex revisadas por guardian:

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
valores están permitidos. Los campos de política individuales sobrescriben `mode`. El valor de revisor anterior
`guardian_subagent` todavía se acepta como alias de compatibilidad,
pero las configuraciones nuevas deben usar `auto_review`.

Cuando un sandbox de OpenClaw está activo, el proceso local de Codex app-server sigue
ejecutándose en el host del Gateway. Por lo tanto, OpenClaw deshabilita el Code Mode nativo de Codex,
los servidores MCP de usuario y la ejecución de plugins respaldada por apps para ese turno, en lugar de
tratar el sandboxing del lado del host de Codex como equivalente al backend de sandbox de OpenClaw.
El acceso de shell se expone mediante herramientas dinámicas respaldadas por el sandbox de OpenClaw
como `sandbox_exec` y `sandbox_process` cuando las herramientas normales de exec/process
están disponibles.

En hosts Ubuntu/AppArmor, Codex bwrap puede fallar bajo `workspace-write` antes
de que se inicie el comando de shell cuando ejecutas intencionalmente `workspace-write`
nativo de Codex sin sandboxing activo de OpenClaw. Si ves
`bwrap: setting up uid map: Permission denied` o
`bwrap: loopback: Failed RTM_NEWADDR: Operation not permitted`, ejecuta
`openclaw doctor` y corrige la política de namespaces del host informada para el usuario de servicio de OpenClaw
en lugar de conceder privilegios más amplios al contenedor Docker. Prefiere
un perfil AppArmor acotado para el proceso de servicio; el fallback
`kernel.apparmor_restrict_unprivileged_userns=0` afecta a todo el host y tiene
implicaciones de seguridad.

## Ejecución nativa en sandbox

El valor predeterminado estable es fallar cerrado: el sandboxing activo de OpenClaw deshabilita las superficies de ejecución
nativas de Codex que, de lo contrario, se ejecutarían desde el host de Codex app-server.
Usa `appServer.experimental.sandboxExecServer: true` solo cuando quieras
probar el soporte de entorno remoto de Codex con el backend de sandbox de OpenClaw. Esta
ruta de vista previa requiere Codex app-server 0.132.0 o más reciente.

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

Cuando el flag está activado y la sesión actual de OpenClaw está en sandbox, OpenClaw
inicia un exec-server de local loopback respaldado por el sandbox activo, lo registra
con Codex app-server, e inicia el hilo y el turno de Codex con ese
entorno propiedad de OpenClaw. Si el app-server no puede registrar el entorno,
la ejecución falla cerrada en lugar de volver silenciosamente a la ejecución en el host.

Esta ruta de vista previa es solo local. Un app-server WebSocket remoto no puede alcanzar el
exec-server de loopback a menos que se esté ejecutando en el mismo host, por lo que OpenClaw rechaza
esa combinación.

## Autenticación y aislamiento de entorno

En el home por agente predeterminado, la autenticación se selecciona en este orden:

1. Un perfil de autenticación explícito de OpenClaw Codex para el agente.
2. La cuenta existente del app-server en el home de Codex de ese agente.
3. Solo para lanzamientos locales de app-server por stdio, `CODEX_API_KEY`, luego
   `OPENAI_API_KEY`, cuando no hay ninguna cuenta de app-server presente y la autenticación de OpenAI
   sigue siendo requerida.

Cuando OpenClaw ve un perfil de autenticación de Codex de estilo suscripción ChatGPT, elimina
`CODEX_API_KEY` y `OPENAI_API_KEY` del proceso hijo de Codex generado. Eso
mantiene disponibles las claves de API a nivel de Gateway para embeddings o modelos directos de OpenAI
sin hacer que los turnos nativos de Codex app-server se facturen accidentalmente mediante la API.

Los perfiles explícitos de clave de API de Codex y el fallback local por clave env en stdio usan el inicio de sesión de app-server
en lugar del env heredado del proceso hijo. Las conexiones WebSocket de app-server
no reciben fallback de clave de API env del Gateway; usa un perfil de autenticación explícito o la
propia cuenta del app-server remoto.

Los lanzamientos de app-server por stdio heredan el entorno de proceso de OpenClaw de forma predeterminada.
OpenClaw posee el puente de cuenta de Codex app-server y establece `CODEX_HOME` en un
directorio por agente bajo el estado de OpenClaw de ese agente. Eso mantiene la configuración de Codex,
las cuentas, la caché/datos de plugins y el estado de hilos acotados al agente de OpenClaw
en lugar de filtrarse desde el home personal `~/.codex` del operador.

Establece `appServer.homeScope: "user"` para compartir el estado nativo de Codex con Codex
Desktop y la CLI. Este modo solo para stdio local usa `$CODEX_HOME` cuando está establecido y
`~/.codex` en caso contrario, incluida la autenticación nativa, configuración, plugins e hilos.
OpenClaw omite su puente de perfil de autenticación para el app-server. Los turnos de propietarios verificados
pueden usar `codex_threads` para listar, buscar, leer, bifurcar, renombrar, archivar y restaurar
esos hilos. Bifurca un hilo antes de continuarlo en OpenClaw; los procesos
independientes de Codex no coordinan escritores concurrentes para el mismo hilo.

OpenClaw no reescribe `HOME` para lanzamientos locales normales de app-server. Los subprocesos ejecutados por Codex
como `openclaw`, `gh`, `git`, CLIs de nube y comandos de shell ven
el home de proceso normal y pueden encontrar configuración y tokens del home del usuario. Codex también puede
descubrir `$HOME/.agents/skills` y `$HOME/.agents/plugins/marketplace.json`;
ese descubrimiento de `.agents` se comparte intencionalmente con el home del operador y es
independiente del estado aislado de `~/.codex`.

En el scope de agente predeterminado, los plugins de OpenClaw y las instantáneas de Skills de OpenClaw todavía
fluyen a través del propio registro de plugins y cargador de Skills de OpenClaw; los activos personales de Codex
`~/.codex` no. Si tienes Skills o plugins útiles de la CLI de Codex desde un
home de Codex que deberían formar parte de un agente aislado de OpenClaw, inventaríalos
explícitamente:

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

Si un despliegue necesita aislamiento de entorno adicional, agrega esas variables a
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

`appServer.clearEnv` solo afecta al proceso hijo de Codex app-server generado.
OpenClaw elimina `CODEX_HOME` y `HOME` de esta lista durante la normalización del lanzamiento local:
`CODEX_HOME` permanece apuntando al scope de agente o usuario seleccionado,
y `HOME` permanece heredado para que los subprocesos puedan usar el estado normal del home del usuario.

## Herramientas dinámicas

Las herramientas dinámicas de Codex usan por defecto carga `searchable`. OpenClaw no expone
herramientas dinámicas que duplican operaciones de workspace nativas de Codex:

- `read`
- `write`
- `edit`
- `apply_patch`
- `exec`
- `process`
- `update_plan`

La mayoría de las herramientas de integración restantes de OpenClaw, como mensajería, medios, cron,
navegador, nodos, gateway, `heartbeat_respond` y `web_search`, están disponibles
mediante la búsqueda de herramientas de Codex bajo el namespace `openclaw`. Esto mantiene más pequeño el contexto inicial
del modelo. `sessions_yield` y las respuestas de origen solo de herramientas de mensaje
permanecen directas porque son contratos de control de turno. `sessions_spawn` permanece
searchable para que el `spawn_agent` nativo de Codex siga siendo la superficie principal de subagentes de Codex,
mientras que la delegación explícita de OpenClaw o ACP sigue estando disponible mediante
el namespace de herramientas dinámicas `openclaw`.

Establece `codexDynamicToolsLoading: "direct"` solo cuando te conectes a un app-server personalizado de Codex
que no pueda buscar herramientas dinámicas diferidas o cuando depures el payload completo de herramientas.

## Timeouts

Las llamadas a herramientas dinámicas propiedad de OpenClaw están acotadas independientemente de
`appServer.requestTimeoutMs`. Cada solicitud `item/tool/call` de Codex usa el primer
timeout disponible en este orden:

- Un argumento positivo `timeoutMs` por llamada.
- Para `image_generate`, `agents.defaults.imageGenerationModel.timeoutMs`.
- Para `image_generate` sin timeout configurado, el valor predeterminado de generación de imágenes de 120 segundos.
- Para la herramienta `image` de comprensión de medios, `tools.media.image.timeoutSeconds`
  convertido a milisegundos, o el valor predeterminado de medios de 60 segundos. Para la comprensión de imágenes,
  esto se aplica a la solicitud en sí y no se reduce por
  trabajo de preparación anterior.
- El valor predeterminado de herramienta dinámica de 90 segundos.

Este watchdog es el presupuesto externo dinámico de `item/tool/call`. Los timeouts de solicitud
específicos del proveedor se ejecutan dentro de esa llamada y mantienen su propia semántica de timeout.
Los presupuestos de herramientas dinámicas tienen un límite de 600000 ms. Al agotarse el timeout, OpenClaw cancela la
señal de la herramienta cuando se admite y devuelve una respuesta de herramienta dinámica fallida a Codex
para que el turno pueda continuar en lugar de dejar la sesión en `processing`.

Después de que Codex acepta un turno, y después de que OpenClaw responde a una solicitud de app-server
con scope de turno, el arnés espera que Codex avance en el turno actual y
finalmente termine el turno nativo con `turn/completed`. Si el app-server queda
en silencio durante `appServer.turnCompletionIdleTimeoutMs`, OpenClaw interrumpe
el turno de Codex con el mejor esfuerzo, registra un timeout de diagnóstico y libera la
vía de sesión de OpenClaw para que los mensajes de chat de seguimiento no queden encolados detrás de un turno
nativo obsoleto.

La mayoría de las notificaciones no terminales del mismo turno desarman ese watchdog corto
porque Codex ha demostrado que el turno sigue activo. Las transferencias a herramientas usan un presupuesto de inactividad posterior a la herramienta más largo: después de que OpenClaw devuelve una respuesta `item/tool/call`, después de que se completan elementos de herramientas nativas como `commandExecution`, después de completaciones sin procesar de `custom_tool_call_output`, y después de progreso sin procesar del asistente posterior a la herramienta, completaciones de razonamiento sin procesar o progreso de razonamiento. El guard usa `appServer.postToolRawAssistantCompletionIdleTimeoutMs` cuando está configurado y, de lo contrario, usa cinco minutos de forma predeterminada. Ese mismo presupuesto posterior a la herramienta también extiende el watchdog de progreso para la ventana de síntesis silenciosa antes de que Codex emita el siguiente evento del turno actual. Las completaciones de razonamiento, las completaciones `agentMessage` de commentary y el progreso de razonamiento o de asistente sin procesar previo a la herramienta pueden ir seguidos de una respuesta final automática, por lo que usan el guard de respuesta posterior al progreso en lugar de liberar de inmediato el carril de sesión. Solo los elementos `agentMessage` completados finales/no commentary y las completaciones de asistente sin procesar previas a la herramienta arman la liberación de salida del asistente: si Codex luego queda en silencio sin `turn/completed`, OpenClaw interrumpe en modo de mejor esfuerzo el turno nativo y libera el carril de sesión. Los fallos seguros para reproducción del servidor de aplicación stdio, incluidos los tiempos de espera de inactividad de finalización de turno sin evidencia de asistente, herramienta, elemento activo o efecto secundario, se reintentan una vez en un intento nuevo del servidor de aplicación. Los tiempos de espera no seguros igualmente retiran el cliente del servidor de aplicación bloqueado y liberan el carril de sesión de OpenClaw. También borran el enlace obsoleto del hilo nativo en lugar de reproducirlo automáticamente. Los tiempos de espera de vigilancia de completación muestran texto de tiempo de espera específico de Codex: los casos seguros para reproducción dicen que la respuesta puede estar incompleta, mientras que los casos no seguros indican al usuario que verifique el estado actual antes de reintentar. Los diagnósticos públicos de tiempo de espera incluyen campos estructurales como el último método de notificación del servidor de aplicación, id/tipo/rol del elemento de respuesta de asistente sin procesar, recuentos de solicitudes/elementos activos y estado de vigilancia armado. Cuando la última notificación es un elemento de respuesta de asistente sin procesar, también incluyen una vista previa acotada del texto del asistente. No incluyen el prompt sin procesar ni contenido de herramientas.

## Descubrimiento de modelos

De forma predeterminada, el Plugin de Codex pide al servidor de aplicación los modelos disponibles. La disponibilidad de modelos pertenece al servidor de aplicación de Codex, por lo que la lista puede cambiar cuando OpenClaw actualiza la versión incluida de `@openai/codex` o cuando una implementación apunta `appServer.command` a un binario de Codex diferente. La disponibilidad también puede estar limitada por cuenta. Usa `/codex models` en un gateway en ejecución para ver el catálogo en vivo de ese harness y cuenta.

Si el descubrimiento falla o agota el tiempo de espera, OpenClaw usa un catálogo alternativo incluido para:

- GPT-5.5
- GPT-5.4 mini

El harness incluido actual es `@openai/codex` `0.142.5`. Una prueba `model/list` contra ese servidor de aplicación incluido devolvió estas filas públicas del selector:

| Id. de modelo         | Modalidades de entrada | Esfuerzos de razonamiento |
| --------------------- | ---------------------- | ------------------------- |
| `gpt-5.5`             | text, image            | low, medium, high, xhigh  |
| `gpt-5.4`             | text, image            | low, medium, high, xhigh  |
| `gpt-5.4-mini`        | text, image            | low, medium, high, xhigh  |
| `gpt-5.3-codex-spark` | text                   | low, medium, high, xhigh  |

El catálogo del servidor de aplicación puede devolver modelos ocultos para flujos internos o especializados, pero no son opciones normales del selector de modelos.

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

Desactiva el descubrimiento cuando quieras que el inicio evite sondear Codex y use solo el catálogo alternativo:

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

Codex maneja `AGENTS.md` por sí mismo mediante el descubrimiento nativo de documentos del proyecto. OpenClaw no escribe archivos sintéticos de documentos de proyecto de Codex ni depende de nombres de archivo alternativos de Codex para archivos de persona, porque las alternativas de Codex solo se aplican cuando falta `AGENTS.md`.

Para la paridad del espacio de trabajo de OpenClaw, el harness de Codex resuelve los demás archivos de arranque. `SOUL.md`, `IDENTITY.md`, `TOOLS.md` y `USER.md` se reenvían como instrucciones de desarrollador de OpenClaw Codex porque definen el agente activo, la guía disponible del espacio de trabajo y el perfil de usuario. La lista compacta de Skills de OpenClaw se reenvía como instrucciones de desarrollador de colaboración con alcance de turno. El contenido de `HEARTBEAT.md` no se inyecta; los turnos de heartbeat reciben un puntero de modo de colaboración para leer el archivo cuando existe y no está vacío. El contenido de `MEMORY.md` del espacio de trabajo del agente configurado no se pega en la entrada de turno nativa de Codex cuando las herramientas de memoria están disponibles para ese espacio de trabajo; cuando existe, el harness agrega un pequeño puntero de memoria del espacio de trabajo a las instrucciones de desarrollador de colaboración con alcance de turno, y Codex debería usar `memory_search` o `memory_get` cuando la memoria duradera sea relevante. Si las herramientas están desactivadas, la búsqueda de memoria no está disponible o el espacio de trabajo activo difiere del espacio de trabajo de memoria del agente, `MEMORY.md` usa la ruta normal acotada de contexto de turno.
Cuando está presente, `BOOTSTRAP.md` se reenvía como contexto de referencia de entrada de turno de OpenClaw.

## Sustituciones de entorno

Las sustituciones de entorno siguen disponibles para pruebas locales:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN` omite el binario administrado cuando `appServer.command` no está definido.

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` se eliminó. Usa `plugins.entries.codex.config.appServer.mode: "guardian"` en su lugar, o `OPENCLAW_CODEX_APP_SERVER_MODE=guardian` para pruebas locales puntuales. Se prefiere la configuración para implementaciones repetibles porque mantiene el comportamiento del Plugin en el mismo archivo revisado que el resto de la configuración del harness de Codex.

## Relacionado

- [Harness de Codex](/es/plugins/codex-harness)
- [Tiempo de ejecución del harness de Codex](/es/plugins/codex-harness-runtime)
- [Plugins nativos de Codex](/es/plugins/codex-native-plugins)
- [Codex Computer Use](/es/plugins/codex-computer-use)
- [Proveedor OpenAI](/es/providers/openai)
- [Referencia de configuración](/es/gateway/configuration-reference)
