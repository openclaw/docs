---
read_when:
    - Necesitas todos los campos de configuración del arnés de Codex
    - Estás cambiando el comportamiento de transporte, autenticación, descubrimiento o tiempo de espera de app-server
    - Estás depurando el arranque del arnés de Codex, la detección de modelos o el aislamiento del entorno
summary: Referencia de configuración, autenticación, descubrimiento y servidor de la aplicación para el harness de Codex
title: Referencia del arnés de Codex
x-i18n:
    generated_at: "2026-06-27T12:09:18Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 32da817c262a61769b78b16c10e508175c730a568c2ba6321595c430815526a5
    source_path: plugins/codex-harness-reference.md
    workflow: 16
---

Esta referencia cubre la configuración detallada del Plugin `codex`
incluido. Para la configuración inicial y las decisiones de enrutamiento, comienza con
[arnés de Codex](/es/plugins/codex-harness).

## Superficie de configuración del Plugin

Todos los ajustes del arnés de Codex viven bajo `plugins.entries.codex.config`.

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

Campos de nivel superior compatibles:

| Campo                      | Valor predeterminado     | Significado                                                                                                                               |
| -------------------------- | ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `discovery`                | habilitado               | Ajustes de descubrimiento de modelos para `model/list` del app-server de Codex.                                                           |
| `appServer`                | app-server stdio gestionado | Ajustes de transporte, comando, autenticación, aprobación, sandbox y tiempo de espera.                                                     |
| `codexDynamicToolsLoading` | `"searchable"`           | Usa `"direct"` para poner las herramientas dinámicas de OpenClaw directamente en el contexto inicial de herramientas de Codex.             |
| `codexDynamicToolsExclude` | `[]`                     | Nombres adicionales de herramientas dinámicas de OpenClaw que se omitirán en los turnos del app-server de Codex.                          |
| `codexPlugins`             | deshabilitado            | Compatibilidad nativa de plugins/apps de Codex para plugins curados migrados instalados desde código fuente. Consulta [plugins nativos de Codex](/es/plugins/codex-native-plugins). |
| `computerUse`              | deshabilitado            | Configuración de Codex Computer Use. Consulta [Codex Computer Use](/es/plugins/codex-computer-use).                                          |

## Transporte de app-server

De forma predeterminada, OpenClaw inicia el binario gestionado de Codex incluido con el Plugin
incluido:

```bash
codex app-server --listen stdio://
```

Esto mantiene la versión del app-server vinculada al Plugin `codex` incluido en lugar de
cualquier CLI de Codex separada que esté instalada localmente. Establece
`appServer.command` solo cuando quieras ejecutar intencionalmente un ejecutable
diferente.

Para un app-server que ya se está ejecutando, usa el transporte WebSocket:

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

Campos `appServer` compatibles:

| Campo                                         | Valor predeterminado                                   | Significado                                                                                                                                                                                                                                                                                                                                                                                    |
| --------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                                   | `"stdio"`                                              | `"stdio"` inicia Codex; `"websocket"` se conecta a `url`.                                                                                                                                                                                                                                                                                                                                       |
| `command`                                     | binario de Codex gestionado                            | Ejecutable para el transporte stdio. Déjelo sin establecer para usar el binario gestionado.                                                                                                                                                                                                                                                                                                     |
| `args`                                        | `["app-server", "--listen", "stdio://"]`               | Argumentos para el transporte stdio.                                                                                                                                                                                                                                                                                                                                                            |
| `url`                                         | sin establecer                                         | URL del app-server WebSocket.                                                                                                                                                                                                                                                                                                                                                                   |
| `authToken`                                   | sin establecer                                         | Token Bearer para el transporte WebSocket. Acepta una cadena literal o SecretInput, como `${CODEX_APP_SERVER_TOKEN}`.                                                                                                                                                                                                                                                                           |
| `headers`                                     | `{}`                                                   | Encabezados WebSocket adicionales. Los valores de encabezado aceptan cadenas literales o valores SecretInput, por ejemplo `x-codex-client-session-token: "${CODEX_CLIENT_SESSION_TOKEN}"`.                                                                                                                                                                                                      |
| `clearEnv`                                    | `[]`                                                   | Nombres de variables de entorno adicionales eliminados del proceso app-server stdio iniciado después de que OpenClaw construye su entorno heredado.                                                                                                                                                                                                                                             |
| `remoteWorkspaceRoot`                         | sin establecer                                         | Raíz remota del espacio de trabajo del app-server de Codex. Cuando se establece, OpenClaw infiere la raíz local del espacio de trabajo a partir del espacio de trabajo resuelto de OpenClaw, conserva el sufijo del cwd actual bajo esta raíz remota y envía a Codex solo el cwd final del app-server. Si el cwd está fuera de la raíz resuelta del espacio de trabajo de OpenClaw, OpenClaw falla de forma cerrada en lugar de enviar una ruta local del Gateway al app-server remoto. |
| `requestTimeoutMs`                            | `60000`                                                | Tiempo de espera para llamadas del plano de control del app-server.                                                                                                                                                                                                                                                                                                                             |
| `turnCompletionIdleTimeoutMs`                 | `60000`                                                | Ventana de silencio después de que Codex acepta un turno o después de una solicitud de app-server con alcance de turno mientras OpenClaw espera `turn/completed`.                                                                                                                                                                                                                                |
| `postToolRawAssistantCompletionIdleTimeoutMs` | `300000`                                               | Protección de inactividad de finalización y progreso usada después de una entrega a herramienta, finalización de herramienta nativa, progreso de asistente sin procesar posterior a herramienta, finalización de razonamiento sin procesar o progreso de razonamiento mientras OpenClaw espera `turn/completed`. Use esto para cargas de trabajo confiables o pesadas en las que la síntesis posterior a herramienta puede permanecer legítimamente en silencio más tiempo que el presupuesto final de publicación del asistente. |
| `mode`                                        | `"yolo"` salvo que los requisitos locales de Codex no permitan YOLO | Preajuste para ejecución YOLO o revisada por guardian.                                                                                                                                                                                                                                                                                                                                          |
| `approvalPolicy`                              | `"never"` o una política de aprobación guardian permitida | Política de aprobación nativa de Codex enviada al inicio del hilo, la reanudación y el turno.                                                                                                                                                                                                                                                                                                   |
| `sandbox`                                     | `"danger-full-access"` o un sandbox guardian permitido | Modo sandbox nativo de Codex enviado al inicio y la reanudación del hilo. Los sandboxes activos de OpenClaw restringen los turnos `danger-full-access` a Codex `workspace-write`; el indicador de red del turno sigue la salida del sandbox de OpenClaw.                                                                                                                                         |
| `approvalsReviewer`                           | `"user"` o un revisor guardian permitido               | Use `"auto_review"` para permitir que Codex revise solicitudes de aprobación nativas cuando esté permitido.                                                                                                                                                                                                                                                                                      |
| `defaultWorkspaceDir`                         | directorio del proceso actual                          | Espacio de trabajo usado por `/codex bind` cuando se omite `--cwd`.                                                                                                                                                                                                                                                                                                                             |
| `serviceTier`                                 | sin establecer                                         | Nivel de servicio opcional del app-server de Codex. `"priority"` habilita el enrutamiento de modo rápido, `"flex"` solicita procesamiento flexible y `null` borra la anulación. El valor heredado `"fast"` se acepta como `"priority"`.                                                                                                                                                         |
| `networkProxy`                                | deshabilitado                                          | Opte por usar redes de perfiles de permisos de Codex para comandos de app-server. OpenClaw define la configuración `permissions.<profile>.network` seleccionada y la selecciona con `default_permissions` en lugar de enviar `sandbox`.                                                                                                                                                          |
| `experimental.sandboxExecServer`              | `false`                                                | Opción de vista previa que registra con Codex app-server 0.132.0 o posterior un entorno de Codex respaldado por el sandbox de OpenClaw, para que la ejecución nativa de Codex pueda ejecutarse dentro del sandbox activo de OpenClaw.                                                                                                                                                            |

`appServer.networkProxy` es explícito porque cambia el contrato de sandbox de
Codex. Cuando está habilitado, OpenClaw también establece `features.network_proxy.enabled` y
`default_permissions` en la configuración del hilo de Codex para que el perfil de permisos
generado pueda iniciar las redes gestionadas por Codex. De forma predeterminada, OpenClaw genera un
nombre de perfil `openclaw-network-<fingerprint>` resistente a colisiones a partir del
cuerpo del perfil; use `profileName` solo cuando se requiera un nombre local estable.

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

Si el runtime normal del app-server fuera `danger-full-access`, habilitar
`networkProxy` usa acceso al sistema de archivos de estilo workspace para el perfil de permisos
generado. La aplicación de red gestionada por Codex es red con sandbox,
por lo que un perfil de acceso completo no protegería el tráfico saliente.

El Plugin bloquea handshakes de app-server antiguos o sin versión. Codex app-server
debe informar la versión estable `0.125.0` o posterior.

OpenClaw trata las URL de servidor de apps WebSocket que no son de loopback como remotas y requiere
autenticación WebSocket con identidad mediante `appServer.authToken` o un encabezado
`Authorization`. `appServer.authToken` y cada valor `appServer.headers.*`
pueden ser un SecretInput; el runtime de secretos resuelve SecretRefs y la abreviatura de env
antes de que OpenClaw construya las opciones de inicio del servidor de apps, y las SecretRefs
estructuradas sin resolver fallan antes de que se envíe cualquier token o encabezado. Cuando se configuran
plugins nativos de Codex, OpenClaw usa el plano de control de plugins del servidor de apps conectado
para instalar o actualizar esos plugins y luego actualiza el inventario de apps para que
las apps propiedad de plugins sean visibles para el hilo de Codex. `app/list` sigue siendo la
fuente autoritativa de inventario y metadatos, pero la política de OpenClaw decide si
`thread/start` envía `config.apps[appId].enabled = true` para una app accesible listada
aunque Codex la marque actualmente como deshabilitada. Los ids de apps desconocidos o faltantes permanecen
cerrados por fallo; esta ruta solo activa plugins del marketplace mediante `plugin/install`
y actualiza el inventario. Conecta OpenClaw únicamente a servidores de apps remotos en los que
confíes para aceptar instalaciones de plugins gestionadas por OpenClaw y actualizaciones del inventario de apps.

## Modos de aprobación y sandbox

Las sesiones locales de servidor de apps por stdio usan el modo YOLO de forma predeterminada:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` y
`sandbox: "danger-full-access"`. Esta postura de operador local de confianza permite que
los turnos y Heartbeats desatendidos de OpenClaw avancen sin solicitudes de aprobación nativas
que nadie está presente para responder.

Si el archivo local de requisitos del sistema de Codex no permite valores implícitos de aprobación YOLO,
revisor o sandbox, OpenClaw trata el valor predeterminado implícito como guardian
en su lugar y selecciona los permisos guardian permitidos. `tools.exec.mode: "auto"`
también fuerza aprobaciones de Codex revisadas por guardian y no conserva sobrescrituras heredadas inseguras
de `approvalPolicy: "never"` o `sandbox: "danger-full-access"`;
establece `tools.exec.mode: "full"` para una postura intencional sin aprobación.
Las entradas
`[[remote_sandbox_config]]` que coinciden con el nombre de host en el mismo archivo de requisitos se respetan
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

El preajuste `guardian` se expande a `approvalPolicy: "on-request"`,
`approvalsReviewer: "auto_review"` y `sandbox: "workspace-write"` cuando esos
valores están permitidos. Los campos de política individuales sobrescriben `mode`. El valor de revisor anterior
`guardian_subagent` todavía se acepta como alias de compatibilidad,
pero las configuraciones nuevas deben usar `auto_review`.

Cuando un sandbox de OpenClaw está activo, el proceso local del servidor de apps de Codex aún
se ejecuta en el host del Gateway. Por lo tanto, OpenClaw deshabilita el Code Mode nativo de Codex,
los servidores MCP del usuario y la ejecución de plugins respaldada por apps para ese turno, en lugar de
tratar el sandbox del lado del host de Codex como equivalente al backend de sandbox de OpenClaw.
El acceso al shell se expone mediante herramientas dinámicas respaldadas por el sandbox de OpenClaw
como `sandbox_exec` y `sandbox_process` cuando las herramientas normales de exec/process
están disponibles.

En hosts Ubuntu/AppArmor, bwrap de Codex puede fallar en `workspace-write` antes de
que se inicie el comando de shell cuando ejecutas intencionalmente `workspace-write`
nativo de Codex sin sandboxing activo de OpenClaw. Si ves
`bwrap: setting up uid map: Permission denied` o
`bwrap: loopback: Failed RTM_NEWADDR: Operation not permitted`, ejecuta
`openclaw doctor` y corrige la política de espacio de nombres del host indicada para el usuario de servicio de OpenClaw
en lugar de conceder privilegios más amplios al contenedor Docker. Prefiere
un perfil AppArmor acotado para el proceso de servicio; la alternativa
`kernel.apparmor_restrict_unprivileged_userns=0` aplica a todo el host y tiene
contrapartidas de seguridad.

## Ejecución nativa en sandbox

El valor predeterminado estable es cerrado por fallo: el sandboxing activo de OpenClaw deshabilita las superficies
de ejecución nativa de Codex que, de otro modo, se ejecutarían desde el host del servidor de apps de Codex.
Usa `appServer.experimental.sandboxExecServer: true` solo cuando quieras
probar el soporte de entorno remoto de Codex con el backend de sandbox de OpenClaw. Esta
ruta de vista previa requiere Codex app-server 0.132.0 o posterior.

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

Cuando la bandera está activada y la sesión actual de OpenClaw está en sandbox, OpenClaw
inicia un servidor de ejecución local loopback respaldado por el sandbox activo, lo registra
con Codex app-server e inicia el hilo y el turno de Codex con ese
entorno propiedad de OpenClaw. Si el servidor de apps no puede registrar el entorno,
la ejecución falla cerrada en lugar de recurrir silenciosamente a la ejecución en el host.

Esta ruta de vista previa es solo local. Un servidor de apps WebSocket remoto no puede acceder al
servidor de ejecución loopback a menos que se esté ejecutando en el mismo host, por lo que OpenClaw rechaza
esa combinación.

## Aislamiento de autenticación y entorno

La autenticación se selecciona en este orden:

1. Un perfil explícito de autenticación Codex de OpenClaw para el agente.
2. La cuenta existente del servidor de apps en el home de Codex de ese agente.
3. Solo para lanzamientos locales de servidor de apps por stdio, `CODEX_API_KEY`, luego
   `OPENAI_API_KEY`, cuando no hay ninguna cuenta del servidor de apps presente y todavía se requiere
   autenticación de OpenAI.

Cuando OpenClaw detecta un perfil de autenticación de Codex de estilo suscripción de ChatGPT, elimina
`CODEX_API_KEY` y `OPENAI_API_KEY` del proceso hijo de Codex generado. Eso
mantiene disponibles las claves de API de nivel Gateway para embeddings o modelos OpenAI directos
sin hacer que los turnos nativos del servidor de apps de Codex se facturen accidentalmente mediante la API.

Los perfiles explícitos de clave de API de Codex y la alternativa de clave env local por stdio usan el inicio de sesión del servidor de apps
en lugar de env heredado del proceso hijo. Las conexiones WebSocket al servidor de apps
no reciben la alternativa de clave de API env del Gateway; usa un perfil de autenticación explícito o la
propia cuenta del servidor de apps remoto.

Los lanzamientos de servidor de apps por stdio heredan el entorno del proceso de OpenClaw de forma predeterminada.
OpenClaw es propietario del puente de cuenta del servidor de apps de Codex y establece `CODEX_HOME` en un
directorio por agente bajo el estado de OpenClaw de ese agente. Eso mantiene la configuración de Codex,
las cuentas, la caché/datos de plugins y el estado de hilos acotados al agente de OpenClaw
en lugar de filtrarlos desde el home personal `~/.codex` del operador.

OpenClaw no reescribe `HOME` para lanzamientos locales normales del servidor de apps. Los
subprocesos ejecutados por Codex, como `openclaw`, `gh`, `git`, las CLI de nube y los comandos de shell, ven
el home normal del proceso y pueden encontrar configuración y tokens del home del usuario. Codex también puede
descubrir `$HOME/.agents/skills` y `$HOME/.agents/plugins/marketplace.json`;
ese descubrimiento de `.agents` se comparte intencionalmente con el home del operador y es
independiente del estado aislado `~/.codex`.

Los plugins de OpenClaw y las instantáneas de Skills de OpenClaw siguen fluyendo por el propio
registro de plugins y cargador de Skills de OpenClaw. Los activos personales de Codex `~/.codex` no. Si
tienes Skills o plugins útiles de Codex CLI de un home de Codex que deberían pasar a formar
parte de un agente de OpenClaw, inventaríalos explícitamente:

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

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

`appServer.clearEnv` solo afecta al proceso hijo generado del servidor de apps de Codex.
OpenClaw elimina `CODEX_HOME` y `HOME` de esta lista durante la normalización del lanzamiento local:
`CODEX_HOME` permanece por agente, y `HOME` permanece heredado para que
los subprocesos puedan usar el estado normal del home del usuario.

## Herramientas dinámicas

Las herramientas dinámicas de Codex usan la carga `searchable` de forma predeterminada. OpenClaw no expone
herramientas dinámicas que duplican operaciones nativas de workspace de Codex:

- `read`
- `write`
- `edit`
- `apply_patch`
- `exec`
- `process`
- `update_plan`

La mayoría de las herramientas restantes de integración de OpenClaw, como mensajería, medios, cron,
navegador, nodos, Gateway, `heartbeat_respond` y `web_search`, están disponibles
mediante la búsqueda de herramientas de Codex bajo el espacio de nombres `openclaw`. Esto mantiene más pequeño el contexto inicial
del modelo. `sessions_yield` y las respuestas de origen solo con herramientas de mensaje
permanecen directas porque son contratos de control de turno. `sessions_spawn` permanece
searchable para que `spawn_agent` nativo de Codex siga siendo la superficie principal de subagente de Codex,
mientras que la delegación explícita de OpenClaw o ACP sigue estando disponible mediante
el espacio de nombres de herramientas dinámicas `openclaw`.

Establece `codexDynamicToolsLoading: "direct"` solo cuando te conectes a un servidor de apps Codex
personalizado que no pueda buscar herramientas dinámicas diferidas o cuando depures la carga útil completa
de herramientas.

## Tiempos de espera

Las llamadas a herramientas dinámicas propiedad de OpenClaw están acotadas independientemente de
`appServer.requestTimeoutMs`. Cada solicitud `item/tool/call` de Codex usa el primer
tiempo de espera disponible en este orden:

- Un argumento `timeoutMs` positivo por llamada.
- Para `image_generate`, `agents.defaults.imageGenerationModel.timeoutMs`.
- Para `image_generate` sin un tiempo de espera configurado, el valor predeterminado de generación de imágenes
  de 120 segundos.
- Para la herramienta `image` de comprensión de medios, `tools.media.image.timeoutSeconds`
  convertido a milisegundos, o el valor predeterminado de medios de 60 segundos. Para la comprensión
  de imágenes, esto aplica a la solicitud en sí y no se reduce por
  trabajo de preparación anterior.
- El valor predeterminado de herramientas dinámicas de 90 segundos.

Este watchdog es el presupuesto externo de `item/tool/call` dinámico. Los tiempos de espera
de solicitud específicos del proveedor se ejecutan dentro de esa llamada y conservan sus propias semánticas de tiempo de espera.
Los presupuestos de herramientas dinámicas tienen un límite de 600000 ms. Al agotarse el tiempo, OpenClaw aborta la
señal de la herramienta donde sea compatible y devuelve una respuesta fallida de herramienta dinámica a Codex
para que el turno pueda continuar en lugar de dejar la sesión en `processing`.

Después de que Codex acepta un turno, y después de que OpenClaw responde a una solicitud del servidor de apps
acotada al turno, el harness espera que Codex avance en el turno actual y
finalmente termine el turno nativo con `turn/completed`. Si el servidor de apps queda
en silencio durante `appServer.turnCompletionIdleTimeoutMs`, OpenClaw interrumpe
el turno de Codex con el mejor esfuerzo, registra un tiempo de espera diagnóstico y libera el
carril de sesión de OpenClaw para que los mensajes de chat posteriores no queden en cola detrás de un turno
nativo obsoleto.

La mayoría de las notificaciones no terminales del mismo turno desactivan ese watchdog corto
porque Codex ha demostrado que el turno sigue vivo. Las transferencias de herramientas usan un presupuesto de inactividad
post-herramienta más largo: después de que OpenClaw devuelve una respuesta `item/tool/call`, después de que
elementos de herramientas nativas como `commandExecution` se completan, después de completaciones sin procesar
`custom_tool_call_output`, y después de progreso post-herramienta sin procesar del asistente,
completaciones de razonamiento sin procesar o progreso de razonamiento. La guarda usa
`appServer.postToolRawAssistantCompletionIdleTimeoutMs` cuando está configurado y,
si no, usa cinco minutos de forma predeterminada. Ese mismo presupuesto post-herramienta también extiende el
watchdog de progreso para la ventana de síntesis silenciosa antes de que Codex emita el siguiente
evento del turno actual. Las completaciones de razonamiento, las completaciones
`agentMessage` de comentario, y el progreso de razonamiento o asistente sin procesar previo a la herramienta pueden
ir seguidos de una respuesta final automática, por lo que usan la guarda de respuesta post-progreso
en lugar de liberar de inmediato el carril de sesión. Solo los elementos `agentMessage`
finales/no de comentario completados y las completaciones de asistente sin procesar previas a la herramienta
arman la liberación de salida del asistente: si Codex queda en silencio después sin
`turn/completed`, OpenClaw interrumpe el turno nativo en la medida de lo posible y libera
el carril de sesión. Los fallos replay-safe del servidor de aplicaciones stdio, incluidos
los tiempos de espera por inactividad de completación de turno sin evidencia de asistente,
herramienta, elemento activo o efecto secundario, se reintentan una vez en un nuevo intento
del servidor de aplicaciones. Los tiempos de espera no seguros aún retiran el cliente del servidor de aplicaciones
atascado y liberan el carril de sesión de OpenClaw. También limpian el enlace obsoleto del hilo nativo
en lugar de reproducirse automáticamente. Los tiempos de espera de vigilancia de completación muestran texto
de tiempo de espera específico de Codex: los casos replay-safe dicen que la respuesta puede estar incompleta,
mientras que los casos no seguros indican al usuario que verifique el estado actual antes de reintentar.
Los diagnósticos públicos de tiempo de espera incluyen campos estructurales como el último método de notificación
del servidor de aplicaciones, id/tipo/rol del elemento de respuesta del asistente sin procesar,
conteos de solicitudes/elementos activos y estado de vigilancia armado. Cuando la última notificación es un
elemento de respuesta del asistente sin procesar, también incluyen una vista previa limitada del texto del asistente.
No incluyen el contenido sin procesar del prompt ni de la herramienta.

## Descubrimiento de modelos

De forma predeterminada, el Plugin de Codex pide al servidor de aplicaciones los modelos disponibles. La
disponibilidad de modelos pertenece al servidor de aplicaciones de Codex, por lo que la lista puede cambiar cuando OpenClaw
actualiza la versión incluida de `@openai/codex` o cuando un despliegue apunta
`appServer.command` a un binario de Codex diferente. La disponibilidad también puede estar
delimitada por cuenta. Usa `/codex models` en un Gateway en ejecución para ver el catálogo en vivo
de ese harness y esa cuenta.

Si el descubrimiento falla o agota el tiempo de espera, OpenClaw usa un catálogo de respaldo incluido para:

- GPT-5.5
- GPT-5.4 mini
- GPT-5.2

El harness incluido actual es `@openai/codex` `0.139.0`. Una prueba `model/list`
contra ese servidor de aplicaciones incluido devolvió:

| Id de modelo    | Predeterminado | Oculto | Modalidades de entrada | Esfuerzos de razonamiento |
| --------------- | -------------- | ------ | ---------------------- | ------------------------- |
| `gpt-5.5`       | Sí             | No     | texto, imagen          | low, medium, high, xhigh  |
| `gpt-5.4`       | No             | No     | texto, imagen          | low, medium, high, xhigh  |
| `gpt-5.4-mini`  | No             | No     | texto, imagen          | low, medium, high, xhigh  |
| `gpt-5.3-codex` | No             | No     | texto, imagen          | low, medium, high, xhigh  |
| `gpt-5.2`       | No             | No     | texto, imagen          | low, medium, high, xhigh  |

El catálogo del servidor de aplicaciones puede devolver modelos ocultos para flujos internos o
especializados, pero no son opciones normales del selector de modelos.

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

Desactiva el descubrimiento cuando quieras que el inicio evite sondear Codex y use solo el
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

## Archivos de arranque del espacio de trabajo

Codex gestiona `AGENTS.md` por sí mismo mediante el descubrimiento nativo de documentación del proyecto. OpenClaw
no escribe archivos sintéticos de documentación de proyecto de Codex ni depende de nombres de archivo de respaldo
de Codex para archivos de persona, porque los respaldos de Codex solo se aplican cuando falta
`AGENTS.md`.

Para la paridad del espacio de trabajo de OpenClaw, el harness de Codex resuelve los otros archivos de arranque.
`SOUL.md`, `IDENTITY.md`, `TOOLS.md` y `USER.md` se reenvían como
instrucciones de desarrollador de OpenClaw Codex porque definen el agente activo,
la guía disponible del espacio de trabajo y el perfil de usuario. La lista compacta de Skills de OpenClaw
se reenvía como instrucciones de desarrollador de colaboración con alcance de turno.
El contenido de `HEARTBEAT.md` no se inyecta; los turnos de Heartbeat reciben un puntero de modo de colaboración
para leer el archivo cuando existe y no está vacío. El contenido de `MEMORY.md`
del espacio de trabajo de agente configurado no se pega en la entrada nativa de turno de Codex
cuando hay herramientas de memoria disponibles para ese espacio de trabajo; cuando existe, el harness
agrega un pequeño puntero de memoria del espacio de trabajo a las instrucciones de desarrollador de colaboración
con alcance de turno y Codex debería usar `memory_search` o `memory_get` cuando la memoria duradera
sea relevante. Si las herramientas están desactivadas, la búsqueda en memoria no está disponible, o el
espacio de trabajo activo difiere del espacio de trabajo de memoria del agente, `MEMORY.md` usa la
ruta normal acotada de contexto de turno.
`BOOTSTRAP.md`, cuando está presente, se reenvía como contexto de referencia de entrada de turno de OpenClaw.

## Sustituciones de entorno

Las sustituciones de entorno siguen estando disponibles para pruebas locales:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN` omite el binario gestionado cuando
`appServer.command` no está definido.

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` se eliminó. Usa
`plugins.entries.codex.config.appServer.mode: "guardian"` en su lugar, o
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` para pruebas locales puntuales. Se prefiere la
configuración para despliegues repetibles porque mantiene el comportamiento del Plugin en el
mismo archivo revisado que el resto de la configuración del harness de Codex.

## Relacionado

- [Harness de Codex](/es/plugins/codex-harness)
- [Runtime del harness de Codex](/es/plugins/codex-harness-runtime)
- [Plugins nativos de Codex](/es/plugins/codex-native-plugins)
- [Codex Computer Use](/es/plugins/codex-computer-use)
- [Proveedor OpenAI](/es/providers/openai)
- [Referencia de configuración](/es/gateway/configuration-reference)
