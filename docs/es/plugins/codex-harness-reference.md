---
read_when:
    - Necesitas todos los campos de configuración del arnés de Codex
    - Estás cambiando el transporte, la autenticación, el descubrimiento o el comportamiento de tiempo de espera de app-server
    - Estás depurando el inicio del harness de Codex, el descubrimiento de modelos o el aislamiento del entorno
summary: Referencia de configuración, autenticación, detección y servidor de aplicaciones para el arnés de Codex
title: Referencia del arnés de Codex
x-i18n:
    generated_at: "2026-07-01T07:51:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 02dd72f9d85d2ea5fa45533a402d640786f17bdbe2242b7c1b8cd99405561a25
    source_path: plugins/codex-harness-reference.md
    workflow: 16
---

Esta referencia cubre la configuración detallada del Plugin `codex`
incluido. Para decisiones de configuración y enrutamiento, empieza con
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

| Campo                      | Predeterminado           | Significado                                                                                                                              |
| -------------------------- | ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `discovery`                | habilitado               | Ajustes de descubrimiento de modelos para `model/list` del servidor de aplicaciones de Codex.                                             |
| `appServer`                | servidor de aplicaciones stdio gestionado | Ajustes de transporte, comando, autenticación, aprobación, sandbox y tiempo de espera.                                                     |
| `codexDynamicToolsLoading` | `"searchable"`           | Usa `"direct"` para colocar las herramientas dinámicas de OpenClaw directamente en el contexto inicial de herramientas de Codex.          |
| `codexDynamicToolsExclude` | `[]`                     | Nombres adicionales de herramientas dinámicas de OpenClaw que se deben omitir en los turnos del servidor de aplicaciones de Codex.        |
| `codexPlugins`             | deshabilitado            | Compatibilidad nativa de Plugin/aplicación de Codex para plugins seleccionados migrados e instalados desde el código fuente. Consulta [plugins nativos de Codex](/es/plugins/codex-native-plugins). |
| `computerUse`              | deshabilitado            | Configuración de Codex Computer Use. Consulta [Codex Computer Use](/es/plugins/codex-computer-use).                                          |

## Transporte del servidor de aplicaciones

De forma predeterminada, OpenClaw inicia el binario gestionado de Codex incluido con el
Plugin incluido:

```bash
codex app-server --listen stdio://
```

Esto mantiene la versión del servidor de aplicaciones vinculada al Plugin `codex` incluido en lugar de
cualquier CLI de Codex independiente que esté instalada localmente. Define
`appServer.command` solo cuando quieras ejecutar intencionadamente un
ejecutable diferente.

Para un servidor de aplicaciones que ya esté en ejecución, usa el transporte WebSocket:

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

| Campo                                         | Predeterminado                                        | Significado                                                                                                                                                                                                                                                                                                                                                                                     |
| --------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                                   | `"stdio"`                                              | `"stdio"` inicia Codex; `"websocket"` se conecta a `url`.                                                                                                                                                                                                                                                                                                                                       |
| `command`                                     | binario de Codex administrado                          | Ejecutable para el transporte stdio. Déjalo sin establecer para usar el binario administrado.                                                                                                                                                                                                                                                                                                   |
| `args`                                        | `["app-server", "--listen", "stdio://"]`               | Argumentos para el transporte stdio.                                                                                                                                                                                                                                                                                                                                                            |
| `url`                                         | sin establecer                                         | URL del app-server WebSocket.                                                                                                                                                                                                                                                                                                                                                                   |
| `authToken`                                   | sin establecer                                         | Token Bearer para el transporte WebSocket. Acepta una cadena literal o SecretInput como `${CODEX_APP_SERVER_TOKEN}`.                                                                                                                                                                                                                                                                            |
| `headers`                                     | `{}`                                                   | Encabezados WebSocket adicionales. Los valores de encabezado aceptan cadenas literales o valores SecretInput, por ejemplo `x-codex-client-session-token: "${CODEX_CLIENT_SESSION_TOKEN}"`.                                                                                                                                                                                                       |
| `clearEnv`                                    | `[]`                                                   | Nombres de variables de entorno adicionales eliminados del proceso stdio app-server iniciado después de que OpenClaw construye su entorno heredado.                                                                                                                                                                                                                                             |
| `remoteWorkspaceRoot`                         | sin establecer                                         | Raíz remota del espacio de trabajo del app-server de Codex. Cuando se establece, OpenClaw infiere la raíz local del espacio de trabajo a partir del espacio de trabajo de OpenClaw resuelto, conserva el sufijo del cwd actual bajo esta raíz remota y envía solo el cwd final del app-server a Codex. Si el cwd está fuera de la raíz del espacio de trabajo de OpenClaw resuelta, OpenClaw falla de forma cerrada en lugar de enviar una ruta local del gateway al app-server remoto. |
| `requestTimeoutMs`                            | `60000`                                                | Tiempo de espera para llamadas de plano de control del app-server.                                                                                                                                                                                                                                                                                                                              |
| `turnCompletionIdleTimeoutMs`                 | `60000`                                                | Ventana de silencio después de que Codex acepta un turno o después de una solicitud de app-server con alcance de turno mientras OpenClaw espera `turn/completed`.                                                                                                                                                                                                                                |
| `postToolRawAssistantCompletionIdleTimeoutMs` | `300000`                                               | Protección de inactividad de finalización y progreso usada después de una transferencia a herramienta, finalización de herramienta nativa, progreso bruto del asistente posterior a herramienta, finalización de razonamiento bruto o progreso de razonamiento mientras OpenClaw espera `turn/completed`. Usa esto para cargas de trabajo de confianza o pesadas donde la síntesis posterior a herramienta puede permanecer legítimamente en silencio más tiempo que el presupuesto final de liberación del asistente.                                |
| `mode`                                        | `"yolo"` salvo que los requisitos locales de Codex no permitan YOLO | Preajuste para ejecución YOLO o revisada por guardian.                                                                                                                                                                                                                                                                                                                                          |
| `approvalPolicy`                              | `"never"` o una política de aprobación de guardian permitida | Política de aprobación nativa de Codex enviada al inicio de hilo, reanudación y turno.                                                                                                                                                                                                                                                                                                          |
| `sandbox`                                     | `"danger-full-access"` o un sandbox de guardian permitido | Modo sandbox nativo de Codex enviado al inicio y la reanudación de hilo. Los sandboxes activos de OpenClaw restringen los turnos `danger-full-access` a Codex `workspace-write`; la marca de red del turno sigue la salida del sandbox de OpenClaw.                                                                                                                                             |
| `approvalsReviewer`                           | `"user"` o un revisor guardian permitido               | Usa `"auto_review"` para permitir que Codex revise solicitudes de aprobación nativas cuando esté permitido.                                                                                                                                                                                                                                                                                      |
| `defaultWorkspaceDir`                         | directorio del proceso actual                          | Espacio de trabajo usado por `/codex bind` cuando se omite `--cwd`.                                                                                                                                                                                                                                                                                                                             |
| `serviceTier`                                 | sin establecer                                         | Nivel de servicio opcional del app-server de Codex. `"priority"` habilita el enrutamiento de modo rápido, `"flex"` solicita procesamiento flexible y `null` borra la anulación. El valor heredado `"fast"` se acepta como `"priority"`.                                                                                                                                                         |
| `networkProxy`                                | deshabilitado                                          | Opta por usar redes de perfil de permisos de Codex para comandos del app-server. OpenClaw define la configuración `permissions.<profile>.network` seleccionada y la selecciona con `default_permissions` en lugar de enviar `sandbox`.                                                                                                                                                         |
| `experimental.sandboxExecServer`              | `false`                                                | Opción de vista previa que registra un entorno Codex respaldado por el sandbox de OpenClaw con Codex app-server 0.132.0 o posterior para que la ejecución nativa de Codex pueda ejecutarse dentro del sandbox activo de OpenClaw.                                                                                                                                                                |

`appServer.networkProxy` es explícito porque cambia el contrato de sandbox de Codex.
Cuando se habilita, OpenClaw también establece `features.network_proxy.enabled` y
`default_permissions` en la configuración del hilo de Codex para que el perfil de
permisos generado pueda iniciar las redes administradas por Codex. De forma
predeterminada, OpenClaw genera un nombre de perfil
`openclaw-network-<fingerprint>` resistente a colisiones a partir del cuerpo del
perfil; usa `profileName` solo cuando se requiera un nombre local estable.

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
`networkProxy` usa acceso al sistema de archivos de estilo workspace para el
perfil de permisos generado. La aplicación administrada de red de Codex es red
con sandbox, por lo que un perfil de acceso completo no protegería el tráfico saliente.

El plugin bloquea handshakes de app-server antiguos o sin versión. Codex app-server
debe informar la versión estable `0.125.0` o posterior.

OpenClaw trata las URL de servidor de aplicaciones WebSocket que no son de loopback como remotas y requiere
autenticación WebSocket con identidad mediante `appServer.authToken` o un encabezado
`Authorization`. `appServer.authToken` y cada valor de `appServer.headers.*`
pueden ser un SecretInput; el runtime de secretos resuelve SecretRefs y abreviaturas de env
antes de que OpenClaw cree las opciones de inicio del servidor de aplicaciones, y los SecretRefs
estructurados sin resolver fallan antes de que se envíe cualquier token o encabezado. Cuando los plugins nativos de Codex
están configurados, OpenClaw usa el plano de control de plugins del servidor de aplicaciones conectado
para instalar o actualizar esos plugins y luego actualiza el inventario de aplicaciones para que
las aplicaciones propiedad del plugin sean visibles para el hilo de Codex. `app/list` sigue siendo la
fuente autorizada de inventario y metadatos, pero la política de OpenClaw decide si
`thread/start` envía `config.apps[appId].enabled = true` para una aplicación accesible listada
incluso si Codex actualmente la marca como deshabilitada. Los id. de aplicaciones desconocidos o faltantes permanecen
cerrados en caso de error; esta ruta solo activa plugins del marketplace mediante `plugin/install`
y actualiza el inventario. Conecta OpenClaw solo a servidores de aplicaciones remotos en los que se
confíe para aceptar instalaciones de plugins gestionadas por OpenClaw y actualizaciones del inventario de aplicaciones.

## Aprobación y modos de sandbox

Las sesiones locales de servidor de aplicaciones stdio usan el modo YOLO de forma predeterminada:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` y
`sandbox: "danger-full-access"`. Esta postura de operador local de confianza permite que
los turnos y Heartbeats desatendidos de OpenClaw avancen sin solicitudes de aprobación nativas
que no haya nadie disponible para responder.

Si el archivo de requisitos del sistema local de Codex no permite valores implícitos de aprobación YOLO,
revisor o sandbox, OpenClaw trata el valor predeterminado implícito como guardian
en su lugar y selecciona permisos guardian permitidos. `tools.exec.mode: "auto"`
también fuerza aprobaciones de Codex revisadas por guardian y no conserva sobrescrituras
legacy inseguras de `approvalPolicy: "never"` o `sandbox: "danger-full-access"`;
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

El preajuste `guardian` se expande a `approvalPolicy: "on-request"`,
`approvalsReviewer: "auto_review"` y `sandbox: "workspace-write"` cuando esos
valores están permitidos. Los campos de política individuales sobrescriben `mode`. El valor de revisor anterior
`guardian_subagent` aún se acepta como alias de compatibilidad,
pero las configuraciones nuevas deberían usar `auto_review`.

Cuando hay un sandbox de OpenClaw activo, el proceso local del servidor de aplicaciones de Codex todavía
se ejecuta en el host del Gateway. Por lo tanto, OpenClaw deshabilita el Code Mode nativo de Codex,
los servidores MCP de usuario y la ejecución de plugins respaldada por aplicaciones para ese turno, en lugar de
tratar el sandboxing del lado del host de Codex como equivalente al backend de sandbox de OpenClaw.
El acceso a shell se expone mediante herramientas dinámicas respaldadas por el sandbox de OpenClaw
como `sandbox_exec` y `sandbox_process` cuando las herramientas normales de exec/process
están disponibles.

En hosts Ubuntu/AppArmor, bwrap de Codex puede fallar bajo `workspace-write` antes de
que el comando de shell se inicie cuando ejecutas intencionalmente `workspace-write`
nativo de Codex sin sandboxing activo de OpenClaw. Si ves
`bwrap: setting up uid map: Permission denied` o
`bwrap: loopback: Failed RTM_NEWADDR: Operation not permitted`, ejecuta
`openclaw doctor` y corrige la política de namespaces del host reportada para el usuario
de servicio de OpenClaw en lugar de conceder privilegios más amplios al contenedor Docker. Prefiere
un perfil AppArmor acotado para el proceso de servicio; el recurso de respaldo
`kernel.apparmor_restrict_unprivileged_userns=0` aplica a todo el host y tiene
tradeoffs de seguridad.

## Ejecución nativa en sandbox

El valor predeterminado estable es cerrado en caso de error: el sandboxing activo de OpenClaw deshabilita superficies
de ejecución nativa de Codex que, de otro modo, se ejecutarían desde el host del servidor de aplicaciones de Codex.
Usa `appServer.experimental.sandboxExecServer: true` solo cuando quieras
probar el soporte de entornos remotos de Codex con el backend de sandbox de OpenClaw. Esta
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

Cuando la marca está activa y la sesión actual de OpenClaw está en sandbox, OpenClaw
inicia un exec-server local loopback respaldado por el sandbox activo, lo registra
con Codex app-server e inicia el hilo y el turno de Codex con ese
entorno propiedad de OpenClaw. Si el servidor de aplicaciones no puede registrar el entorno,
la ejecución falla cerrada en lugar de volver silenciosamente a la ejecución en el host.

Esta ruta de vista previa es solo local. Un servidor de aplicaciones WebSocket remoto no puede alcanzar el
exec-server loopback a menos que se esté ejecutando en el mismo host, así que OpenClaw rechaza
esa combinación.

## Autenticación y aislamiento del entorno

La autenticación se selecciona en este orden:

1. Un perfil explícito de autenticación de OpenClaw Codex para el agente.
2. La cuenta existente del servidor de aplicaciones en el home de Codex de ese agente.
3. Solo para lanzamientos locales de servidor de aplicaciones stdio, `CODEX_API_KEY`, luego
   `OPENAI_API_KEY`, cuando no hay una cuenta de servidor de aplicaciones presente y la autenticación de OpenAI
   sigue siendo necesaria.

Cuando OpenClaw detecta un perfil de autenticación de Codex de estilo suscripción ChatGPT, elimina
`CODEX_API_KEY` y `OPENAI_API_KEY` del proceso hijo de Codex generado. Eso
mantiene las claves de API de nivel Gateway disponibles para embeddings o modelos directos de OpenAI
sin hacer que los turnos nativos del servidor de aplicaciones de Codex se facturen mediante la API por accidente.

Los perfiles explícitos de clave de API de Codex y el respaldo de clave env de stdio local usan inicio de sesión del servidor de aplicaciones
en lugar de env heredado del proceso hijo. Las conexiones WebSocket de servidor de aplicaciones
no reciben respaldo de clave de API env del Gateway; usa un perfil de autenticación explícito o la
propia cuenta del servidor de aplicaciones remoto.

Los lanzamientos de servidor de aplicaciones stdio heredan el entorno de proceso de OpenClaw de forma predeterminada.
OpenClaw es propietario del puente de cuenta del servidor de aplicaciones de Codex y establece `CODEX_HOME` en un
directorio por agente bajo el estado de OpenClaw de ese agente. Eso mantiene la configuración de Codex,
las cuentas, la caché/datos de plugins y el estado de hilos acotados al agente de OpenClaw
en lugar de filtrarlos desde el home personal `~/.codex` del operador.

OpenClaw no reescribe `HOME` para lanzamientos locales normales de servidor de aplicaciones. Los subprocesos
ejecutados por Codex, como `openclaw`, `gh`, `git`, CLI de nube y comandos de shell, ven
el home normal del proceso y pueden encontrar configuración y tokens del home de usuario. Codex también puede
descubrir `$HOME/.agents/skills` y `$HOME/.agents/plugins/marketplace.json`;
ese descubrimiento de `.agents` se comparte intencionalmente con el home del operador y está
separado del estado aislado de `~/.codex`.

Los plugins de OpenClaw y las instantáneas de Skills de OpenClaw siguen fluyendo a través del propio
registro de plugins y cargador de Skills de OpenClaw. Los recursos personales de Codex `~/.codex` no. Si
tienes Skills o plugins útiles de la CLI de Codex desde un home de Codex que deberían pasar a ser
parte de un agente de OpenClaw, inventaríalos explícitamente:

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

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

`appServer.clearEnv` solo afecta al proceso hijo de Codex app-server generado.
OpenClaw elimina `CODEX_HOME` y `HOME` de esta lista durante la normalización del lanzamiento local:
`CODEX_HOME` permanece por agente y `HOME` permanece heredado para que
los subprocesos puedan usar el estado normal del home de usuario.

## Herramientas dinámicas

Las herramientas dinámicas de Codex usan carga `searchable` de forma predeterminada. OpenClaw no expone
herramientas dinámicas que dupliquen operaciones de workspace nativas de Codex:

- `read`
- `write`
- `edit`
- `apply_patch`
- `exec`
- `process`
- `update_plan`

La mayoría de las herramientas restantes de integración de OpenClaw, como mensajería, medios, cron,
navegador, nodes, gateway, `heartbeat_respond` y `web_search`, están disponibles
mediante búsqueda de herramientas de Codex bajo el namespace `openclaw`. Esto mantiene más pequeño el
contexto inicial del modelo. `sessions_yield` y las respuestas de origen solo de herramientas de mensaje
permanecen directas porque son contratos de control de turno. `sessions_spawn` permanece
searchable para que el `spawn_agent` nativo de Codex siga siendo la superficie primaria de subagentes de Codex,
mientras que la delegación explícita de OpenClaw o ACP sigue disponible mediante
el namespace de herramientas dinámicas `openclaw`.

Establece `codexDynamicToolsLoading: "direct"` solo cuando te conectes a un servidor de aplicaciones de Codex
personalizado que no pueda buscar herramientas dinámicas diferidas o cuando depures el payload
completo de herramientas.

## Tiempos de espera

Las llamadas a herramientas dinámicas propiedad de OpenClaw están limitadas independientemente de
`appServer.requestTimeoutMs`. Cada solicitud `item/tool/call` de Codex usa el primer
tiempo de espera disponible en este orden:

- Un argumento positivo `timeoutMs` por llamada.
- Para `image_generate`, `agents.defaults.imageGenerationModel.timeoutMs`.
- Para `image_generate` sin un tiempo de espera configurado, el valor predeterminado de 120 segundos
  de generación de imágenes.
- Para la herramienta `image` de comprensión de medios, `tools.media.image.timeoutSeconds`
  convertido a milisegundos, o el valor predeterminado de medios de 60 segundos. Para comprensión
  de imágenes, esto aplica a la solicitud misma y no se reduce por
  trabajos de preparación anteriores.
- El valor predeterminado de 90 segundos de herramientas dinámicas.

Este watchdog es el presupuesto externo dinámico de `item/tool/call`. Los tiempos de espera
de solicitud específicos del proveedor se ejecutan dentro de esa llamada y mantienen su propia semántica de tiempo de espera.
Los presupuestos de herramientas dinámicas están limitados a 600000 ms. Al agotarse el tiempo, OpenClaw aborta la
señal de la herramienta cuando está soportado y devuelve una respuesta fallida de herramienta dinámica a Codex
para que el turno pueda continuar en lugar de dejar la sesión en `processing`.

Después de que Codex acepta un turno, y después de que OpenClaw responde a una solicitud de servidor de aplicaciones
acotada al turno, el harness espera que Codex avance en el turno actual y
eventualmente finalice el turno nativo con `turn/completed`. Si el servidor de aplicaciones queda
en silencio durante `appServer.turnCompletionIdleTimeoutMs`, OpenClaw interrumpe el turno de Codex
en modo mejor esfuerzo, registra un timeout de diagnóstico y libera el carril de sesión de
OpenClaw para que los mensajes de chat de seguimiento no queden en cola detrás de un turno nativo obsoleto.

La mayoría de las notificaciones no terminales del mismo turno desactivan ese watchdog corto
porque Codex ya ha demostrado que el turno sigue activo. Las transferencias a herramientas usan un presupuesto de inactividad
posterior a la herramienta más largo: después de que OpenClaw devuelve una respuesta `item/tool/call`, después de que
elementos de herramientas nativas como `commandExecution` se completan, después de completarse
`custom_tool_call_output` sin procesar, y después del progreso posterior a la herramienta del asistente sin procesar,
completados de razonamiento sin procesar o progreso de razonamiento. La protección usa
`appServer.postToolRawAssistantCompletionIdleTimeoutMs` cuando está configurado y,
de lo contrario, usa cinco minutos de forma predeterminada. Ese mismo presupuesto posterior a la herramienta también amplía el
watchdog de progreso para la ventana de síntesis silenciosa antes de que Codex emita el siguiente
evento del turno actual. Los completados de razonamiento, los completados
`agentMessage` de comentario, y el progreso de razonamiento o del asistente sin procesar previo a la herramienta pueden
ir seguidos de una respuesta final automática, por lo que usan la protección de respuesta posterior al progreso
en lugar de liberar inmediatamente el carril de sesión. Solo los elementos `agentMessage`
finales/no de comentario completados y los completados del asistente sin procesar previos a la herramienta
activan la liberación de salida del asistente: si Codex queda en silencio sin
`turn/completed`, OpenClaw interrumpe en la medida de lo posible el turno nativo y libera
el carril de sesión. Los fallos del servidor de aplicaciones stdio seguros para repetición, incluidos
los tiempos de espera de inactividad de finalización de turno sin evidencia de asistente, herramienta, elemento activo o
efectos secundarios, se reintentan una vez en un intento nuevo del servidor de aplicaciones. Los tiempos de espera
no seguros igualmente retiran el cliente del servidor de aplicaciones bloqueado y liberan el carril de sesión
de OpenClaw. También borran el enlace obsoleto al hilo nativo en lugar de reproducirse
automáticamente. Los tiempos de espera de supervisión de completado muestran texto de tiempo de espera específico de Codex:
los casos seguros para repetición dicen que la respuesta puede estar incompleta, mientras que los casos no seguros
indican al usuario que verifique el estado actual antes de reintentar. Los diagnósticos públicos de tiempo de espera
incluyen campos estructurales como el último método de notificación del servidor de aplicaciones,
el id/tipo/rol del elemento de respuesta del asistente sin procesar, los recuentos de solicitudes/elementos activos y el estado
de supervisión armado. Cuando la última notificación es un elemento de respuesta del asistente sin procesar, también
incluyen una vista previa acotada del texto del asistente. No incluyen el prompt sin procesar ni
contenido de herramientas.

## Descubrimiento de modelos

De forma predeterminada, el Plugin de Codex solicita al servidor de aplicaciones los modelos disponibles. La disponibilidad
de modelos pertenece al servidor de aplicaciones de Codex, por lo que la lista puede cambiar cuando OpenClaw
actualiza la versión incluida de `@openai/codex` o cuando un despliegue apunta
`appServer.command` a un binario de Codex distinto. La disponibilidad también puede estar
limitada por cuenta. Usa `/codex models` en un Gateway en ejecución para ver el catálogo activo
para ese harness y esa cuenta.

Si el descubrimiento falla o agota el tiempo de espera, OpenClaw usa un catálogo alternativo incluido para:

- GPT-5.5
- GPT-5.4 mini

El harness incluido actual es `@openai/codex` `0.142.4`. Una prueba `model/list`
contra ese servidor de aplicaciones incluido en un espacio de trabajo con GPT-5.6 habilitado devolvió estas
filas públicas del selector:

| Id de modelo          | Modalidades de entrada | Esfuerzos de razonamiento            |
| --------------------- | ---------------------- | ------------------------------------ |
| `gpt-5.6-sol`         | text, image            | low, medium, high, xhigh, max, ultra |
| `gpt-5.6-terra`       | text, image            | low, medium, high, xhigh, max, ultra |
| `gpt-5.6-luna`        | text, image            | low, medium, high, xhigh, max        |
| `gpt-5.5`             | text, image            | low, medium, high, xhigh             |
| `gpt-5.4`             | text, image            | low, medium, high, xhigh             |
| `gpt-5.4-mini`        | text, image            | low, medium, high, xhigh             |
| `gpt-5.4-pro`         | text, image            | medium, high, xhigh                  |
| `gpt-5.3-codex-spark` | text                   | low, medium, high, xhigh             |

El acceso a GPT-5.6 está limitado por cuenta durante la vista previa limitada. `max` es un
esfuerzo de razonamiento del modelo. `ultra` es metadato separado de orquestación multiagente
de Codex, no un esfuerzo de razonamiento estándar de OpenAI.

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

## Archivos de arranque del espacio de trabajo

Codex gestiona `AGENTS.md` por sí mismo mediante el descubrimiento nativo de documentación de proyecto. OpenClaw
no escribe archivos sintéticos de documentación de proyecto de Codex ni depende de nombres de archivo alternativos
de Codex para archivos de persona, porque las alternativas de Codex solo se aplican cuando
falta `AGENTS.md`.

Para la paridad del espacio de trabajo de OpenClaw, el harness de Codex resuelve los demás archivos de arranque.
`SOUL.md`, `IDENTITY.md`, `TOOLS.md` y `USER.md` se envían como
instrucciones de desarrollador de OpenClaw Codex porque definen el agente activo,
la guía disponible del espacio de trabajo y el perfil de usuario. La lista compacta de Skills de OpenClaw
se envía como instrucciones de desarrollador de colaboración con alcance de turno.
El contenido de `HEARTBEAT.md` no se inyecta; los turnos de Heartbeat reciben un puntero de modo de colaboración
para leer el archivo cuando existe y no está vacío. El contenido de `MEMORY.md`
del espacio de trabajo de agente configurado no se pega en la entrada nativa de turno de Codex
cuando las herramientas de memoria están disponibles para ese espacio de trabajo; cuando existe, el harness
añade un pequeño puntero de memoria del espacio de trabajo a las instrucciones de desarrollador de colaboración
con alcance de turno, y Codex debería usar `memory_search` o `memory_get` cuando la memoria
duradera sea relevante. Si las herramientas están desactivadas, la búsqueda de memoria no está disponible, o el
espacio de trabajo activo difiere del espacio de trabajo de memoria del agente, `MEMORY.md` usa la
ruta normal acotada de contexto de turno.
`BOOTSTRAP.md`, cuando está presente, se envía como contexto de referencia de entrada de turno de OpenClaw.

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
prefiere la configuración para despliegues repetibles porque mantiene el comportamiento del Plugin en el
mismo archivo revisado que el resto de la configuración del harness de Codex.

## Relacionado

- [Harness de Codex](/es/plugins/codex-harness)
- [Runtime del harness de Codex](/es/plugins/codex-harness-runtime)
- [Plugins nativos de Codex](/es/plugins/codex-native-plugins)
- [Codex Computer Use](/es/plugins/codex-computer-use)
- [Proveedor de OpenAI](/es/providers/openai)
- [Referencia de configuración](/es/gateway/configuration-reference)
