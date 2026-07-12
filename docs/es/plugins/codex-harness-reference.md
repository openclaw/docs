---
read_when:
    - Necesitas todos los campos de configuración del arnés de Codex
    - Estás cambiando el comportamiento del transporte, la autenticación, el descubrimiento o el tiempo de espera de app-server
    - Estás depurando el inicio del entorno de ejecución de Codex, la detección de modelos o el aislamiento del entorno
summary: Referencia de configuración, autenticación, detección y servidor de aplicaciones para el entorno de Codex
title: Referencia del entorno de Codex
x-i18n:
    generated_at: "2026-07-11T23:18:35Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: eb3dcb14d9dbd70a225c13f239369b6d9d2cc0b0681aa29265f528287a6a8e4c
    source_path: plugins/codex-harness-reference.md
    workflow: 16
---

Esta referencia abarca la configuración detallada del Plugin oficial `codex`.
Para la configuración inicial y las decisiones de enrutamiento, comience por
[Harness de Codex](/es/plugins/codex-harness).

## Superficie de configuración del Plugin

Todos los ajustes del harness de Codex se encuentran en `plugins.entries.codex.config`.

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

| Campo                      | Valor predeterminado                 | Significado                                                                                                                                                                                                 |
| -------------------------- | ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `discovery`                | habilitado                           | Ajustes de detección de modelos para `model/list` del servidor de aplicaciones de Codex.                                                                                                                    |
| `appServer`                | servidor de aplicaciones stdio gestionado | Ajustes de transporte, comando, autenticación, aprobación, entorno aislado y tiempo de espera. El harness ordinario usa de forma predeterminada un estado con ámbito de agente.                              |
| `codexDynamicToolsLoading` | `"searchable"`                       | Use `"direct"` para incluir las herramientas dinámicas de OpenClaw directamente en el contexto inicial de herramientas de Codex.                                                                            |
| `codexDynamicToolsExclude` | `[]`                                 | Nombres adicionales de herramientas dinámicas de OpenClaw que deben omitirse de los turnos del servidor de aplicaciones de Codex.                                                                           |
| `codexPlugins`             | deshabilitado                        | Compatibilidad nativa con plugins y aplicaciones de Codex, incluido el acceso opcional a aplicaciones de cuentas conectadas. Consulte [Plugins nativos de Codex](/es/plugins/codex-native-plugins).             |
| `computerUse`              | deshabilitado                        | Configuración de Codex Computer Use. Consulte [Codex Computer Use](/es/plugins/codex-computer-use).                                                                                                             |
| `supervision`              | deshabilitado                        | Catálogo de sesiones nativas no archivadas, continuación de ramas locales y política de herramientas del agente. Consulte [Supervisión de Codex](/plugins/codex-supervision).                               |

## Supervisión

La supervisión enumera las sesiones de Codex no archivadas del equipo del Gateway y
de los nodos emparejados que hayan habilitado esta opción. Habilítela de forma independiente del harness del agente:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          supervision: {
            enabled: true,
          },
        },
      },
    },
  },
}
```

Campos de `supervision`:

| Campo                 | Valor predeterminado       | Significado                                                                                                                                                                                                                                                                                              |
| --------------------- | -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `enabled`             | `false`                    | Publica el catálogo de sesiones local y, en el Gateway, agrega los catálogos de los nodos emparejados que hayan habilitado esta opción para la página de sesiones de Codex.                                                                                                                               |
| `endpoints`           | extremo local integrado    | Destinos de extremos avanzados y de compatibilidad para el agente de supervisión de Codex conservado y las herramientas MCP independientes. El catálogo para usuarios y el flujo de ramas ignoran estos destinos y usan el servidor de aplicaciones de supervisión resuelto desde `appServer`.              |
| `allowRawTranscripts` | `false`                    | Con la supervisión habilitada, permite que un agente autónomo o un MCP independiente lea transcripciones y campos de listas derivados de ellas. Las lecturas de `codex_threads` limitadas a metadatos siguen disponibles. No controla la continuación autenticada desde la interfaz de control.             |
| `allowWriteControls`  | `false`                    | Con la supervisión habilitada, permite las mutaciones autónomas de `codex_threads` para bifurcar, cambiar el nombre, archivar y desarchivar, además de las operaciones independientes de MCP para enviar, orientar e interrumpir. No omite otras comprobaciones de vinculación, host, estado o confirmación. |

Las entradas de extremos aceptan estos campos:

| Campo          | Se aplica a   | Significado                                                                  |
| -------------- | ------------- | ---------------------------------------------------------------------------- |
| `id`           | todos         | Identificador estable del extremo.                                           |
| `label`        | todos         | Etiqueta de visualización opcional.                                          |
| `transport`    | todos         | `"stdio-proxy"` o `"websocket"`.                                             |
| `command`      | `stdio-proxy` | Comando opcional del servidor de aplicaciones.                               |
| `args`         | `stdio-proxy` | Argumentos opcionales del comando.                                           |
| `cwd`          | `stdio-proxy` | Directorio de trabajo opcional del proceso secundario.                        |
| `url`          | `websocket`   | URL obligatoria de WebSocket o de un socket local compatible.                 |
| `authTokenEnv` | `websocket`   | Variable de entorno opcional cuyo valor autentica el extremo.                 |

La página **Sesiones de Codex** usa el servidor de aplicaciones de supervisión del Plugin y muestra
solo las sesiones no archivadas. Sin ajustes explícitos de conexión de `appServer`,
esa conexión es stdio gestionada con el directorio de inicio del usuario. Las filas locales almacenadas o inactivas pueden crear
un chat bloqueado a un modelo con un historial limitado del usuario y el asistente hasta el último
turno de origen terminal persistido. Su vinculación privada mantiene la bifurcación de la instantánea,
la rama canónica de origen de `appServer`, la inyección del historial y los turnos posteriores en esa
conexión. El primer inicio canónico usa el par devuelto por la bifurcación. Las reanudaciones
posteriores omiten las sustituciones del modelo y del proveedor de OpenClaw para que Codex restaure el
par persistido del hilo canónico; un cambio nativo independiente puede actualizar ese
par, pero el modelo externo y la cadena de alternativas nunca lo reemplazan. Las filas almacenadas e inactivas
pueden archivarse tras confirmar que no hay ningún otro ejecutor, salvo que otra vinculación activa de
OpenClaw sea propietaria del destino exacto o de alguno de sus descendientes generados no archivados.
OpenClaw sigue la paginación de descendientes de Codex y adopta un cierre seguro ante
errores de enumeración, ciclos o agotamiento del límite de seguridad. La confirmación sigue
cubriendo los clientes nativos desconocidos y la condición de carrera entre el estado y el archivado. Un chat
supervisado bloqueado a un modelo no se puede eliminar mientras proteja la vinculación nativa.
Las fuentes activas no pueden crear una rama ni archivarse, pero un chat supervisado
existente aún puede abrirse. Todas las filas de nodos emparejados permanecen en modo de solo lectura; el transporte
del nodo aún no proporciona el ciclo de vida de transmisión que necesita el harness.

`appServer.homeScope: "user"` por sí solo cambia qué directorio de inicio de Codex usa un proceso
gestionado del harness; no publica el catálogo de la flota. Habilitar la supervisión no
cambia el valor predeterminado del harness. En su lugar, la conexión de supervisión independiente
usa de forma predeterminada stdio gestionada con el directorio de inicio del usuario cuando no existen ajustes explícitos de conexión de
`appServer`. Los ajustes explícitos se respetan para esa conexión.
Las vinculaciones supervisadas pendientes y confirmadas conservan esa conexión en cada turno;
si la supervisión está deshabilitada o se desvía la conexión o el ciclo de vida, se adopta un cierre seguro en lugar de
recurrir al harness con el directorio de inicio del agente. La conexión predeterminada comparte las sesiones almacenadas
con los clientes nativos de Codex, no su estado de actividad local del proceso.

Los ajustes heredados de `plugins.entries.codex-supervisor` se han retirado. Ejecute
`openclaw doctor --fix` para migrar la entrada antigua, las definiciones de extremos, las marcas de
política y las referencias de inclusión o exclusión del Plugin a este bloque. Los valores canónicos explícitos de
`codex.config.supervision` prevalecen en caso de conflicto.

## Transporte del servidor de aplicaciones

Para los turnos ordinarios del harness, OpenClaw inicia el binario gestionado de Codex incluido
con el Plugin oficial (actualmente `@openai/codex` `0.144.1`):

```bash
codex app-server --listen stdio://
```

Esto mantiene la versión del servidor de aplicaciones vinculada al Plugin oficial `codex`, en lugar de
a cualquier CLI de Codex independiente que esté instalada localmente. Establezca
`appServer.command` solo cuando desee intencionadamente usar otro ejecutable.
Los turnos gestionados ordinarios con el directorio de inicio aislado predeterminado del agente prefieren este
paquete fijado incluso cuando hay instalado un paquete de aplicación de escritorio de macOS. Cuando
[Computer Use](/es/plugins/codex-computer-use) está habilitado, o cuando `homeScope` es
`"user"` y puede cargar el estado nativo de Computer Use, el inicio gestionado prefiere en su lugar
el binario de la aplicación de escritorio que posee los permisos necesarios de macOS. La misma
regla de prioridad para la aplicación de escritorio se aplica cuando la configuración efectiva de Codex del directorio de inicio aislado de un agente
habilita Computer Use nativo. Si no hay instalado ningún paquete de aplicación de escritorio, OpenClaw
recurre al binario del paquete fijado.

La transferencia del ejecutable y el aislamiento de la configuración nativa coordinan los clientes dentro de un
proceso del Gateway en ejecución. Reinicie el Gateway después de que otro proceso cambie la
configuración nativa del Plugin de Codex.

La supervisión resuelve una conexión independiente. Sin ajustes explícitos de conexión de
`appServer`, usa stdio gestionada con `homeScope: "user"`;
el harness ordinario permanece en stdio gestionada con `homeScope: "agent"`. Los ajustes
explícitos de conexión se respetan en ambas rutas. Establezca `homeScope: "user"`
explícitamente cuando el harness ordinario deba compartir `$CODEX_HOME` (o `~/.codex`)
con clientes nativos. Una vinculación supervisada privada usa la conexión de supervisión
independientemente del valor predeterminado del harness ordinario. Los procesos independientes del servidor de aplicaciones
conservan estados activos y de aprobación separados.

Para un servidor de aplicaciones que ya esté en ejecución, use el transporte WebSocket:

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

| Campo                                         | Valor predeterminado                                   | Significado                                                                                                                                                                                                                                                                                                                                                                                           |
| --------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                                   | `"stdio"`                                              | `"stdio"` inicia Codex; `"unix"` explícito se conecta al socket de control local; `"websocket"` se conecta a `url`.                                                                                                                                                                                                                                                                                    |
| `homeScope`                                   | `"agent"`                                              | `"agent"` aísla el estado ordinario del entorno de ejecución por agente de OpenClaw. `"user"` es una activación voluntaria explícita que comparte el `$CODEX_HOME` nativo o `~/.codex`, usa la autenticación nativa y habilita la gestión de hilos solo para el propietario. El ámbito de usuario admite stdio local o transporte Unix. Para la conexión de supervisión independiente, un valor sin definir se resuelve como `"user"` para stdio o Unix y como `"agent"` para WebSocket. |
| `command`                                     | binario de Codex administrado                          | Ejecutable para el transporte stdio. Déjelo sin definir para usar el binario administrado.                                                                                                                                                                                                                                                                                                             |
| `args`                                        | `["app-server", "--listen", "stdio://"]`               | Argumentos para el transporte stdio.                                                                                                                                                                                                                                                                                                                                                                   |
| `url`                                         | sin definir                                            | URL del servidor de aplicaciones WebSocket o URL `unix://`. Una ruta Unix explícita vacía selecciona el socket de control canónico del directorio personal del usuario.                                                                                                                                                                                                                                |
| `authToken`                                   | sin definir                                            | Token de portador para el transporte WebSocket. Acepta una cadena literal o un SecretInput, como `${CODEX_APP_SERVER_TOKEN}`.                                                                                                                                                                                                                                                                          |
| `headers`                                     | `{}`                                                   | Encabezados WebSocket adicionales. Los valores de los encabezados aceptan cadenas literales o valores SecretInput; por ejemplo, `x-codex-client-session-token: "${CODEX_CLIENT_SESSION_TOKEN}"`.                                                                                                                                                                                                        |
| `clearEnv`                                    | `[]`                                                   | Nombres de variables de entorno adicionales que se eliminan del proceso app-server de stdio iniciado después de que OpenClaw construye su entorno heredado.                                                                                                                                                                                                                                             |
| `remoteWorkspaceRoot`                         | sin definir                                            | Raíz remota del espacio de trabajo del app-server de Codex. Cuando se define, OpenClaw infiere la raíz local del espacio de trabajo a partir del espacio de trabajo resuelto de OpenClaw, conserva el sufijo del cwd actual bajo esta raíz remota y envía a Codex únicamente el cwd final del app-server. Si el cwd está fuera de la raíz resuelta del espacio de trabajo de OpenClaw, OpenClaw aplica un cierre seguro en lugar de enviar una ruta local del Gateway al app-server remoto. |
| `requestTimeoutMs`                            | `60000`                                                | Tiempo de espera para las llamadas del plano de control del app-server.                                                                                                                                                                                                                                                                                                                                |
| `turnCompletionIdleTimeoutMs`                 | `60000`                                                | Intervalo de inactividad después de que Codex acepta un turno o después de una solicitud del app-server asociada a un turno, mientras OpenClaw espera `turn/completed`.                                                                                                                                                                                                                                  |
| `postToolRawAssistantCompletionIdleTimeoutMs` | `300000`                                               | Protección de inactividad de finalización y de progreso utilizada después de una transferencia a una herramienta, de la finalización de una herramienta nativa, del progreso sin procesar del asistente posterior a una herramienta, de la finalización del razonamiento sin procesar o del progreso del razonamiento, mientras OpenClaw espera `turn/completed`. Úsela para cargas de trabajo de confianza o exigentes en las que la síntesis posterior a una herramienta pueda permanecer legítimamente inactiva durante más tiempo que el margen de publicación final del asistente. |
| `mode`                                        | `"yolo"`, salvo que los requisitos locales de Codex no permitan YOLO | Preajuste para la ejecución YOLO o revisada por un guardián.                                                                                                                                                                                                                                                                                                                                           |
| `approvalPolicy`                              | `"never"` o una política de aprobación de guardián permitida | Política de aprobación nativa de Codex enviada al inicio y la reanudación del hilo, y al turno.                                                                                                                                                                                                                                                                                                        |
| `sandbox`                                     | `"danger-full-access"` o un entorno aislado de guardián permitido | Modo de entorno aislado nativo de Codex enviado al inicio y la reanudación del hilo. Los entornos aislados activos de OpenClaw restringen los turnos `danger-full-access` a `workspace-write` de Codex; el indicador de red del turno sigue la salida de red del entorno aislado de OpenClaw.                                                                                                              |
| `approvalsReviewer`                           | `"user"` o un revisor de guardián permitido            | Use `"auto_review"` para permitir que Codex revise las solicitudes de aprobación nativas cuando esté permitido.                                                                                                                                                                                                                                                                                        |
| `defaultWorkspaceDir`                         | directorio del proceso actual                          | Espacio de trabajo que usa `/codex bind` cuando se omite `--cwd`.                                                                                                                                                                                                                                                                                                                                      |
| `serviceTier`                                 | sin definir                                            | Nivel de servicio opcional del app-server de Codex. `"priority"` habilita el enrutamiento en modo rápido, `"flex"` solicita procesamiento flexible y `null` elimina la anulación. El valor heredado `"fast"` se acepta como `"priority"`.                                                                                                                                                                 |
| `networkProxy`                                | deshabilitado                                          | Activa voluntariamente la conexión de red mediante perfiles de permisos de Codex para los comandos del app-server. OpenClaw define la configuración `permissions.<profile>.network` seleccionada y la elige mediante `default_permissions` en lugar de enviar `sandbox`.                                                                                                                                   |
| `experimental.sandboxExecServer`              | `false`                                                | Activación voluntaria preliminar que registra un entorno de Codex respaldado por el entorno aislado de OpenClaw en el app-server de Codex compatible, para que la ejecución nativa de Codex pueda realizarse dentro del entorno aislado activo de OpenClaw.                                                                                                                                                 |

`appServer.networkProxy` es explícito porque cambia el contrato del entorno
aislado de Codex. Cuando se habilita, OpenClaw también establece
`features.network_proxy.enabled` y `default_permissions` en la configuración
del hilo de Codex para que el perfil de permisos generado pueda iniciar la
conexión de red administrada por Codex. De forma predeterminada, OpenClaw genera
un nombre de perfil `openclaw-network-<fingerprint>` resistente a colisiones a
partir del cuerpo del perfil; use `profileName` únicamente cuando se requiera un
nombre local estable.

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

Si el entorno de ejecución normal del servidor de aplicaciones fuera `danger-full-access`, al habilitar
`networkProxy` se usa en su lugar un acceso al sistema de archivos de tipo espacio de trabajo para el perfil
de permisos generado. La aplicación de restricciones de red administrada por Codex utiliza redes aisladas,
por lo que un perfil de acceso completo no protegería el tráfico saliente.

El Plugin bloquea los protocolos de enlace de servidores de aplicaciones antiguos o sin versión: el servidor
de aplicaciones de Codex debe informar de la versión estable `0.143.0` o una posterior.

OpenClaw considera remotas las URL WebSocket del servidor de aplicaciones que no sean de local loopback y exige
autenticación WebSocket con identidad mediante `appServer.authToken` o un encabezado
`Authorization`. `appServer.authToken` y cada valor `appServer.headers.*`
pueden ser un SecretInput; el entorno de ejecución de secretos resuelve las SecretRefs y la notación abreviada de
variables de entorno antes de que OpenClaw cree las opciones de inicio del servidor de aplicaciones, y las
SecretRefs estructuradas sin resolver provocan un fallo antes de que se envíe cualquier token o encabezado. Cuando
se configuran plugins nativos de Codex, OpenClaw usa el plano de control de plugins del servidor de aplicaciones
conectado para instalar o actualizar esos plugins y después actualiza el inventario de aplicaciones para que las
aplicaciones pertenecientes a plugins sean visibles para el hilo de Codex. `app/list` sigue siendo
la fuente autorizada del inventario y los metadatos, pero la política de OpenClaw
decide si `thread/start` envía `config.apps[appId].enabled = true` para una
aplicación accesible incluida en la lista, aunque Codex la marque actualmente como deshabilitada. Los identificadores
de aplicación desconocidos o ausentes permanecen bloqueados de forma segura; esta ruta solo activa plugins del
mercado mediante `plugin/install` y actualiza el inventario. Conecta OpenClaw únicamente a
servidores de aplicaciones remotos que sean de confianza para aceptar instalaciones de plugins administradas por OpenClaw
y actualizaciones del inventario de aplicaciones.

## Modos de aprobación y aislamiento

Las sesiones locales del servidor de aplicaciones mediante stdio usan de forma predeterminada el modo YOLO:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` y
`sandbox: "danger-full-access"`. Esta configuración de operador local de confianza permite
que los turnos y Heartbeats desatendidos de OpenClaw avancen sin solicitudes de aprobación
nativas que nadie esté disponible para responder.

Si el archivo local de requisitos del sistema de Codex no permite valores YOLO implícitos de aprobación,
revisor o aislamiento, OpenClaw considera en su lugar que el valor predeterminado implícito es guardián
y selecciona los permisos de guardián permitidos. `tools.exec.mode: "auto"`
también fuerza las aprobaciones de Codex revisadas por el guardián y no conserva
las sustituciones heredadas inseguras `approvalPolicy: "never"` ni `sandbox: "danger-full-access"`;
establece `tools.exec.mode: "full"` para adoptar intencionadamente una configuración sin aprobación.
Las entradas `[[remote_sandbox_config]]` del mismo archivo de requisitos cuyos nombres de host coincidan
se respetan al decidir el aislamiento predeterminado.

Establece `appServer.mode: "guardian"` para usar aprobaciones de Codex revisadas por el guardián:

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

El ajuste predefinido `guardian` se expande a `approvalPolicy: "on-request"`,
`approvalsReviewer: "auto_review"` y `sandbox: "workspace-write"` cuando esos
valores están permitidos. Los campos de política individuales prevalecen sobre `mode`. El valor anterior
de revisor `guardian_subagent` sigue aceptándose como alias de compatibilidad,
pero las configuraciones nuevas deben usar `auto_review`.

Cuando hay un aislamiento de OpenClaw activo, el proceso local del servidor de aplicaciones de Codex
sigue ejecutándose en el host del Gateway. Por tanto, OpenClaw deshabilita el Modo Código nativo de Codex,
los servidores MCP del usuario y la ejecución respaldada por aplicaciones de plugins para ese turno, en lugar de
considerar que el aislamiento de Codex en el host equivale al entorno de aislamiento
de OpenClaw. El acceso al shell se ofrece mediante herramientas dinámicas respaldadas por el aislamiento de OpenClaw,
como `sandbox_exec` y `sandbox_process`, cuando están disponibles las herramientas normales de ejecución y procesos.

<Note>
En hosts de aislamiento de OpenClaw basados en Docker (`agents.defaults.sandbox.mode` configurado
con un entorno Docker), `openclaw doctor` comprueba si el host permite los espacios de nombres
de usuario sin privilegios y, cuando el tráfico de salida de red del aislamiento Docker está deshabilitado,
de red, que el `bwrap` anidado de Codex necesita para ejecutar el shell con `workspace-write`
dentro del contenedor aislado. Una comprobación fallida suele manifestarse
como `bwrap: setting up uid map: Permission denied` o
`bwrap: loopback: Failed RTM_NEWADDR: Operation not permitted` en
hosts Ubuntu/AppArmor. Corrige la política de espacios de nombres del host indicada para el usuario del
servicio de OpenClaw y reinicia el Gateway; prefiere un perfil de AppArmor específico para el
proceso del servicio en lugar de la alternativa global para todo el host
`kernel.apparmor_restrict_unprivileged_userns=0`, y no concedas
privilegios más amplios al contenedor Docker únicamente para satisfacer al `bwrap` anidado.
</Note>

## Ejecución nativa aislada

El valor predeterminado estable bloquea de forma segura: el aislamiento activo de OpenClaw deshabilita las superficies de
ejecución nativa de Codex que, de otro modo, se ejecutarían desde el host del servidor de aplicaciones de Codex.
Usa `appServer.experimental.sandboxExecServer: true` solo si quieres
probar la compatibilidad de Codex con entornos remotos mediante el entorno de aislamiento de OpenClaw.
Esta ruta preliminar funciona con todas las versiones compatibles del servidor de aplicaciones de Codex.

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

Cuando la opción está activada y la sesión actual de OpenClaw está aislada, OpenClaw
inicia un servidor de ejecución de local loopback respaldado por el aislamiento activo, lo registra
en el servidor de aplicaciones de Codex e inicia el hilo y el turno de Codex con ese
entorno perteneciente a OpenClaw. Si el servidor de aplicaciones no puede registrar el entorno,
la ejecución se bloquea de forma segura en lugar de recurrir silenciosamente a la ejecución en el host.

Esta ruta preliminar es exclusivamente local. Un servidor de aplicaciones WebSocket remoto no puede acceder
al servidor de ejecución de local loopback a menos que se ejecute en el mismo host, por lo que OpenClaw
rechaza esa combinación.

## Autenticación y aislamiento del entorno

En el directorio personal predeterminado de cada agente, la autenticación se selecciona en este orden:

1. Un perfil explícito de autenticación de OpenClaw para Codex correspondiente al agente.
2. La cuenta existente del servidor de aplicaciones en el directorio personal de Codex de ese agente.
3. Solo para inicios locales del servidor de aplicaciones mediante stdio, `CODEX_API_KEY` y después
   `OPENAI_API_KEY`, cuando no hay ninguna cuenta del servidor de aplicaciones y la autenticación de OpenAI
   sigue siendo necesaria.

Cuando OpenClaw detecta un perfil de autenticación de Codex de tipo suscripción de ChatGPT (tipo de credencial OAuth o
token), elimina `CODEX_API_KEY` y `OPENAI_API_KEY` del
proceso secundario de Codex iniciado. Esto mantiene las claves de API del Gateway disponibles
para incrustaciones o modelos directos de OpenAI sin hacer que los turnos nativos del servidor de aplicaciones de Codex
se facturen accidentalmente mediante la API.

Los perfiles explícitos de clave de API de Codex y la alternativa de clave mediante variables de entorno para stdio local usan
el inicio de sesión del servidor de aplicaciones en lugar de heredar variables de entorno en el proceso secundario. Las conexiones WebSocket al servidor de aplicaciones
no reciben la alternativa de claves de API mediante variables de entorno del Gateway; usa un perfil de autenticación
explícito o la cuenta propia del servidor de aplicaciones remoto.

Los inicios del servidor de aplicaciones mediante stdio heredan de forma predeterminada el entorno de procesos de OpenClaw.
OpenClaw controla el puente de cuentas del servidor de aplicaciones de Codex y establece `CODEX_HOME` en un
directorio por agente dentro del estado de OpenClaw de ese agente. Esto mantiene la configuración,
las cuentas, la caché y los datos de plugins, y el estado de los hilos de Codex limitados al agente de OpenClaw,
en lugar de filtrarlos desde el directorio personal `~/.codex` del operador.

Establece `appServer.homeScope: "user"` para compartir el estado nativo de Codex con Codex
Desktop y la CLI. Este modo de directorio personal del usuario local admite stdio administrado y
transporte Unix explícito. Usa `$CODEX_HOME` cuando está establecido y `~/.codex`
en caso contrario, incluidos la autenticación, la configuración, los plugins y los hilos nativos.
OpenClaw omite su puente de perfiles de autenticación para el servidor de aplicaciones. Los turnos verificados del propietario
pueden usar `codex_threads` para enumerar esos hilos (con un filtro `search` opcional),
leerlos, bifurcarlos, cambiarles el nombre, archivarlos y desarchivarlos. Bifurca un hilo antes
de continuarlo en OpenClaw; los procesos independientes de Codex no coordinan
escritores simultáneos para el mismo hilo.

Esa habilitación opcional de `homeScope` se aplica a las sesiones normales del entorno de ejecución. Un Chat creado
mediante Codex Sessions usa en su lugar su conexión de supervisión privada, lo que
conserva la configuración de autenticación y proveedor de la conexión nativa para la
rama canónica y futuras reanudaciones.

En un Chat supervisado y bloqueado a un modelo, `codex_threads` no puede adjuntar una bifurcación
diferente ni archivar el hilo nativo vinculado al Chat. La enumeración y la lectura exclusiva de metadatos
siguen disponibles. Las lecturas de transcripciones sin procesar requieren `allowRawTranscripts`; cuando
está deshabilitado, también se rechaza la búsqueda en la lista porque la búsqueda nativa puede encontrar
vistas previas de transcripciones. Cambiar el nombre, desarchivar, crear una bifurcación independiente y archivar un
hilo no relacionado que no pertenezca a otro Chat de OpenClaw requieren
`allowWriteControls`. Ninguna de las dos opciones omite una vinculación bloqueada.

OpenClaw no redefine `HOME` en los inicios locales normales del servidor de aplicaciones.
Los subprocesos ejecutados por Codex, como `openclaw`, `gh`, `git`, las CLI
de servicios en la nube y los comandos de shell, ven el directorio personal normal del proceso y pueden encontrar la configuración y los
tokens del usuario. Codex también puede detectar `$HOME/.agents/skills` y
`$HOME/.agents/plugins/marketplace.json`; esa detección de `.agents` se
comparte intencionadamente con el directorio personal del operador y es independiente del estado aislado de
`~/.codex`.

En el ámbito predeterminado del agente, los plugins y las instantáneas de Skills de OpenClaw
siguen fluyendo mediante el registro de plugins y el cargador de Skills propios de OpenClaw; los
recursos personales de Codex en `~/.codex` no. Si tienes Skills de la CLI de Codex o
plugins útiles de un directorio personal de Codex que deban pasar a formar parte de un agente aislado de OpenClaw,
haz un inventario explícito de ellos:

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

Si una implementación necesita aislamiento adicional del entorno, añade esas variables
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

`appServer.clearEnv` solo afecta al proceso secundario iniciado del servidor de aplicaciones de Codex.
OpenClaw elimina `CODEX_HOME` y `HOME` de esta lista durante la normalización
del inicio local: `CODEX_HOME` sigue apuntando al ámbito seleccionado del agente o del usuario,
y `HOME` continúa heredándose para que los subprocesos puedan usar el estado normal del directorio personal del usuario.

## Herramientas dinámicas

Las herramientas dinámicas de Codex usan de forma predeterminada la carga `searchable`, se ofrecen bajo el
espacio de nombres `openclaw` con `deferLoading: true`. OpenClaw no expone
herramientas dinámicas que dupliquen las operaciones nativas de Codex sobre el espacio de trabajo ni la superficie
de búsqueda de herramientas propia de Codex:

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

La mayoría de las herramientas restantes de integración de OpenClaw, como mensajería, medios, cron,
navegador, nodos, Gateway, `heartbeat_respond` y `web_search`, están disponibles
mediante la búsqueda de herramientas de Codex en ese espacio de nombres. Esto reduce el contexto inicial del
modelo. Un pequeño conjunto de herramientas permanece accesible directamente con independencia de
`codexDynamicToolsLoading`, porque la búsqueda de herramientas de Codex puede no estar disponible o
resolver un universo exclusivo de conectores: `agents_list`, `sessions_spawn` y
`sessions_yield`. Las instrucciones para desarrolladores siguen orientando a los subagentes normales de Codex
hacia el `spawn_agent` nativo para el trabajo de subagentes nativos de Codex, mientras que
`sessions_spawn` sigue disponible para la delegación explícita de OpenClaw o ACP.
Las respuestas de origen que solo usan herramientas de mensajería también siguen siendo directas, ya que se trata de un
contrato de control del turno.

Las herramientas marcadas con `catalogMode: "direct-only"`, incluida la herramienta `computer`
de OpenClaw, se agrupan bajo `openclaw_direct`. OpenClaw añade ese espacio de nombres a
la lista `code_mode.direct_only_tool_namespaces` de Codex sin reemplazar
las entradas proporcionadas por el operador. Por tanto, Codex expone esas herramientas como
`DirectModelOnly` en hilos normales y exclusivos del modo de código, en lugar de dirigirlas
mediante llamadas anidadas `tools.*` del Modo Código. Este límite es obligatorio para
los resultados que contienen imágenes: la serialización anidada del Modo Código convierte la salida de imágenes en
texto, lo que descartaría la captura de pantalla necesaria para la siguiente acción en el equipo.

Establece `codexDynamicToolsLoading: "direct"` únicamente al conectar con un servidor de aplicaciones
de Codex personalizado que no pueda buscar herramientas dinámicas diferidas o al depurar
la carga completa de herramientas.

## Tiempos de espera

Las llamadas dinámicas a herramientas propiedad de OpenClaw tienen límites independientes de
`appServer.requestTimeoutMs`. Cada solicitud `item/tool/call` de Codex usa el
primer tiempo de espera disponible en este orden:

- Un argumento `timeoutMs` positivo por llamada.
- Para `image_generate`, `agents.defaults.imageGenerationModel.timeoutMs`.
- Para `image_generate` sin un tiempo de espera configurado, el valor
  predeterminado de 120 segundos para la generación de imágenes.
- Para la herramienta `image` de comprensión multimedia, `tools.media.image.timeoutSeconds`
  convertido a milisegundos, o el valor predeterminado de 60 segundos para contenido multimedia. Para la
  comprensión de imágenes, esto se aplica a la solicitud en sí y no se reduce por
  el trabajo de preparación anterior.
- Para la herramienta `message`, un valor predeterminado fijo de 120 segundos.
- El valor predeterminado de 90 segundos para herramientas dinámicas.

Este supervisor es el límite externo de la llamada dinámica `item/tool/call`. Los tiempos de espera
de las solicitudes específicos del proveedor se ejecutan dentro de esa llamada y conservan su propia semántica
de tiempo de espera. Los límites de las herramientas dinámicas tienen un máximo de 600000 ms. Cuando se agota el tiempo de espera, OpenClaw cancela la
señal de la herramienta cuando es compatible y devuelve a
Codex una respuesta fallida de la herramienta dinámica para que el turno pueda continuar, en lugar de dejar la sesión en
`processing`.

Después de que Codex acepta un turno, y después de que OpenClaw responde a una solicitud del
servidor de aplicaciones limitada al turno, el sistema de ejecución espera que Codex progrese en el turno actual
y termine finalmente el turno nativo con `turn/completed`. Si el
servidor de aplicaciones queda inactivo durante `appServer.turnCompletionIdleTimeoutMs`, OpenClaw
intenta interrumpir el turno de Codex, registra un tiempo de espera de diagnóstico y
libera la vía de sesión de OpenClaw para que los mensajes de chat posteriores no queden en cola
detrás de un turno nativo obsoleto.

La mayoría de las notificaciones no terminales del mismo turno desactivan ese supervisor breve
porque Codex ha demostrado que el turno sigue activo. Las transferencias de herramientas usan un límite
de inactividad posterior a la herramienta más largo: después de que OpenClaw devuelve una respuesta `item/tool/call`,
después de que finalizan elementos de herramientas nativas como `commandExecution`, después de las
finalizaciones sin procesar de `custom_tool_call_output` y después del progreso posterior a la herramienta sin procesar
del asistente, las finalizaciones de razonamiento sin procesar o el progreso de razonamiento. La protección usa
`appServer.postToolRawAssistantCompletionIdleTimeoutMs` cuando está configurado y,
de lo contrario, usa cinco minutos de forma predeterminada. Ese mismo límite posterior a la herramienta también amplía
el supervisor de progreso durante el período silencioso de síntesis antes de que Codex emita el
siguiente evento del turno actual. Las finalizaciones de razonamiento, las finalizaciones de `agentMessage`
de comentario y el progreso sin procesar de razonamiento o del asistente previo a la herramienta pueden ir seguidos
de una respuesta final automática, por lo que usan la protección de respuesta posterior al progreso
en lugar de liberar inmediatamente la vía de sesión. Solo los elementos `agentMessage`
finales/sin comentarios completados y las finalizaciones sin procesar del asistente previas a la herramienta activan la
liberación de la salida del asistente: si Codex queda inactivo después sin `turn/completed`,
OpenClaw intenta interrumpir el turno nativo y libera la vía de
sesión. Los fallos del servidor de aplicaciones stdio que pueden reproducirse con seguridad, incluidos los tiempos de espera de finalización del turno
sin pruebas del asistente, de herramientas, de elementos activos o de efectos secundarios, se
reintentan una vez en un nuevo intento del servidor de aplicaciones. Los tiempos de espera no seguros siguen retirando el
cliente bloqueado del servidor de aplicaciones y liberando la vía de sesión de OpenClaw. También
eliminan la vinculación obsoleta del hilo nativo en lugar de reproducirse
automáticamente. Los tiempos de espera de supervisión de finalización muestran texto de tiempo de espera específico de Codex:
los casos que pueden reproducirse con seguridad indican que la respuesta puede estar incompleta, mientras que los casos no seguros indican
al usuario que verifique el estado actual antes de volver a intentarlo. Los diagnósticos públicos de tiempo de espera
incluyen campos estructurales como el último método de notificación del servidor de aplicaciones,
el id/tipo/rol del elemento de respuesta sin procesar del asistente, los recuentos de solicitudes/elementos activos y
el estado de supervisión activado. Cuando la última notificación es un elemento de respuesta sin procesar
del asistente, también incluyen una vista previa limitada del texto del asistente. No
incluyen el contenido sin procesar de las instrucciones ni de las herramientas.

## Descubrimiento de modelos

De forma predeterminada, el Plugin de Codex solicita al servidor de aplicaciones los modelos disponibles. La
disponibilidad de los modelos pertenece al servidor de aplicaciones de Codex, por lo que la lista puede cambiar cuando
OpenClaw actualiza la versión incluida de `@openai/codex` o cuando una implementación
hace que `appServer.command` apunte a un binario diferente de Codex. La disponibilidad también
puede estar limitada por cuenta. Usa `/codex models` en un Gateway en ejecución para ver el
catálogo activo de ese sistema de ejecución y esa cuenta.

Si el descubrimiento falla o agota el tiempo de espera, OpenClaw usa un catálogo alternativo incluido:

| Id. del modelo  | Nombre para mostrar | Niveles de razonamiento   |
| --------------- | ------------------- | ------------------------ |
| `gpt-5.5`      | gpt-5.5      | low, medium, high, xhigh |
| `gpt-5.4-mini` | GPT-5.4-Mini | low, medium, high, xhigh |

<Note>
El sistema de ejecución incluido actualmente es `@openai/codex` `0.144.1`. Una consulta `model/list`
al servidor de aplicaciones incluido devolvió estas filas públicas del selector:

| Id. del modelo   | Modalidades de entrada | Niveles de razonamiento                 |
| ---------------- | ---------------------- | --------------------------------------- |
| `gpt-5.6-sol`   | text, image      | low, medium, high, xhigh, max, ultra |
| `gpt-5.6-terra` | text, image      | low, medium, high, xhigh, max, ultra |
| `gpt-5.6-luna`  | text, image      | low, medium, high, xhigh, max        |
| `gpt-5.5`       | text, image      | low, medium, high, xhigh             |
| `gpt-5.4`       | text, image      | low, medium, high, xhigh             |
| `gpt-5.4-mini`  | text, image      | low, medium, high, xhigh             |
| `gpt-5.2`       | text, image      | low, medium, high, xhigh             |

El catálogo del servidor de aplicaciones puede indicar `ultra`; los controles de razonamiento de OpenClaw actualmente
ofrecen niveles hasta `max`.

Las filas activas del selector están limitadas por cuenta y pueden cambiar según la cuenta, el catálogo
de Codex o la versión incluida; ejecuta `/codex models` para obtener la lista actual en lugar
de depender de una tabla correspondiente a un momento concreto. También pueden aparecer modelos ocultos en el
catálogo del servidor de aplicaciones para flujos internos o especializados sin ser opciones normales
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

Desactiva el descubrimiento cuando quieras evitar que el inicio consulte Codex y usar únicamente
el catálogo alternativo:

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

## Archivos de inicialización del espacio de trabajo

Codex gestiona `AGENTS.md` por sí mismo mediante el descubrimiento nativo de documentación del proyecto.
OpenClaw no escribe archivos sintéticos de documentación del proyecto para Codex ni depende de los nombres
de archivo alternativos de Codex para los archivos de personalidad, porque las alternativas de Codex solo se aplican cuando
falta `AGENTS.md`.

Para mantener la paridad del espacio de trabajo de OpenClaw, el sistema de ejecución de Codex reenvía los demás
archivos de inicialización como instrucciones del desarrollador, pero no de forma idéntica:

- `TOOLS.md` se reenvía como instrucciones del desarrollador de Codex **heredadas**, por lo que
  los subagentes nativos de Codex iniciados durante el turno también las ven.
- `SOUL.md`, `IDENTITY.md` y `USER.md` se reenvían como instrucciones de colaboración
  **limitadas al turno**. Los subagentes nativos de Codex no las heredan,
  lo que evita que los turnos de los subagentes adopten la personalidad y
  el perfil de usuario del agente principal.
- La lista compacta de Skills cargadas de OpenClaw también se reenvía como instrucciones del desarrollador
  para la colaboración limitadas al turno, por lo que los subagentes nativos de Codex tampoco
  la heredan.
- El contenido de `HEARTBEAT.md` no se inserta; los turnos de Heartbeat reciben un
  indicador en modo de colaboración para leer el archivo cuando existe y no está
  vacío.
- El contenido de `MEMORY.md` del espacio de trabajo configurado del agente no se pega en
  la entrada del turno nativo de Codex cuando las herramientas de memoria están disponibles para ese
  espacio de trabajo; cuando existe, el sistema de ejecución añade un pequeño indicador de memoria del espacio de trabajo
  a las instrucciones del desarrollador para la colaboración limitadas al turno y Codex
  debe usar `memory_search` o `memory_get` cuando la memoria persistente sea pertinente.
  Si las herramientas están desactivadas, la búsqueda en memoria no está disponible o el espacio de trabajo
  activo difiere del espacio de trabajo de memoria del agente, `MEMORY.md` usa en su lugar la
  ruta normal de contexto limitado al turno.
- `BOOTSTRAP.md`, cuando está presente, se reenvía como contexto de referencia de entrada del turno
  de OpenClaw.

## Anulaciones del entorno

Las anulaciones del entorno siguen disponibles para las pruebas locales:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN` omite el binario administrado cuando
`appServer.command` no está establecido.

Se eliminó `OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1`. Usa
`plugins.entries.codex.config.appServer.mode: "guardian"` en su lugar, o
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` para pruebas locales puntuales. Se
prefiere la configuración para implementaciones reproducibles porque mantiene el comportamiento del Plugin en
el mismo archivo revisado que el resto de la configuración del sistema de ejecución de Codex.

## Contenido relacionado

- [Sistema de ejecución de Codex](/es/plugins/codex-harness)
- [Entorno de ejecución del sistema de ejecución de Codex](/es/plugins/codex-harness-runtime)
- [Supervisión de Codex](/plugins/codex-supervision)
- [Plugins nativos de Codex](/es/plugins/codex-native-plugins)
- [Uso del ordenador con Codex](/es/plugins/codex-computer-use)
- [Proveedor de OpenAI](/es/providers/openai)
- [Referencia de configuración](/es/gateway/configuration-reference)
