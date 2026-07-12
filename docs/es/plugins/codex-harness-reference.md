---
read_when:
    - Necesitas todos los campos de configuración del entorno de Codex
    - Está cambiando el comportamiento del transporte, la autenticación, el descubrimiento o el tiempo de espera de app-server
    - Está depurando el inicio del entorno de pruebas de Codex, la detección de modelos o el aislamiento del entorno
summary: Referencia de configuración, autenticación, detección y servidor de aplicaciones para el arnés de Codex
title: Referencia del arnés de Codex
x-i18n:
    generated_at: "2026-07-12T14:37:40Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: eb3dcb14d9dbd70a225c13f239369b6d9d2cc0b0681aa29265f528287a6a8e4c
    source_path: plugins/codex-harness-reference.md
    workflow: 16
---

Esta referencia abarca la configuración detallada del Plugin oficial `codex`.
Para las decisiones de configuración y enrutamiento, comience por
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

| Campo                      | Valor predeterminado               | Significado                                                                                                                                                                        |
| -------------------------- | ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `discovery`                | habilitado                         | Ajustes de detección de modelos para `model/list` del servidor de aplicaciones de Codex.                                                                                           |
| `appServer`                | servidor de aplicaciones stdio administrado | Ajustes de transporte, comando, autenticación, aprobación, entorno aislado y tiempo de espera. El harness convencional utiliza de forma predeterminada el estado limitado al agente. |
| `codexDynamicToolsLoading` | `"searchable"`                     | Use `"direct"` para incluir las herramientas dinámicas de OpenClaw directamente en el contexto inicial de herramientas de Codex.                                                   |
| `codexDynamicToolsExclude` | `[]`                               | Nombres adicionales de herramientas dinámicas de OpenClaw que se omitirán en los turnos del servidor de aplicaciones de Codex.                                                     |
| `codexPlugins`             | deshabilitado                      | Compatibilidad nativa con plugins y aplicaciones de Codex, incluido el acceso opcional a aplicaciones de cuentas conectadas. Consulte [plugins nativos de Codex](/es/plugins/codex-native-plugins). |
| `computerUse`              | deshabilitado                      | Configuración de Computer Use de Codex. Consulte [Computer Use de Codex](/es/plugins/codex-computer-use).                                                                              |
| `supervision`              | deshabilitado                      | Catálogo de sesiones nativas no archivadas, continuación de ramas locales y política de herramientas del agente. Consulte [supervisión de Codex](/plugins/codex-supervision).       |

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

| Campo                 | Valor predeterminado      | Significado                                                                                                                                                                                                                                                   |
| --------------------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `enabled`             | `false`                   | Publica el catálogo de sesiones local y, en el Gateway, agrega los catálogos habilitados de los nodos emparejados para la página de sesiones de Codex.                                                                                                         |
| `endpoints`           | punto de conexión local integrado | Destinos de puntos de conexión para compatibilidad y uso avanzado del agente de supervisión de Codex conservado y las herramientas MCP independientes. El catálogo para usuarios y el flujo de ramas ignoran estos destinos y usan el App Server de supervisión resuelto a partir de `appServer`. |
| `allowRawTranscripts` | `false`                   | Con la supervisión habilitada, permite que un agente autónomo o un MCP independiente lea transcripciones y campos de listas derivados de ellas. Las lecturas de `codex_threads` limitadas a metadatos siguen disponibles. No controla la continuación autenticada de la interfaz de control. |
| `allowWriteControls`  | `false`                   | Con la supervisión habilitada, permite las mutaciones autónomas de `codex_threads` para bifurcar, cambiar el nombre, archivar y desarchivar, además de las operaciones independientes de MCP para enviar, redirigir e interrumpir. No omite otras comprobaciones de vinculación, host, estado o confirmación. |

Las entradas de puntos de conexión aceptan estos campos:

| Campo          | Se aplica a    | Significado                                                               |
| -------------- | ------------- | --------------------------------------------------------------------- |
| `id`           | todos           | Id. estable del endpoint.                                                   |
| `label`        | todos           | Etiqueta de visualización opcional.                                               |
| `transport`    | todos           | `"stdio-proxy"` o `"websocket"`.                                     |
| `command`      | `stdio-proxy` | Comando opcional del servidor de aplicaciones.                                          |
| `args`         | `stdio-proxy` | Argumentos opcionales del comando.                                           |
| `cwd`          | `stdio-proxy` | Directorio de trabajo opcional del proceso secundario.                             |
| `url`          | `websocket`   | URL obligatoria de WebSocket o de un socket local compatible.                     |
| `authTokenEnv` | `websocket`   | Variable de entorno opcional cuyo valor autentica el endpoint. |

La página **Sesiones de Codex** usa el servidor de aplicaciones supervisado por el plugin y muestra
solo las sesiones no archivadas. Sin una configuración de conexión `appServer`
explícita, esa conexión se gestiona mediante stdio en el directorio principal del usuario. Las filas locales almacenadas o inactivas pueden crear
un Chat bloqueado a un modelo con un historial acotado del usuario y del asistente hasta el último
turno de origen persistido como terminal. Su vinculación privada conserva la bifurcación de la instantánea,
la rama canónica de origen `appServer`, la inyección del historial y los turnos posteriores en esa
conexión. El primer inicio canónico usa el par devuelto por la bifurcación. Las reanudaciones
posteriores omiten las anulaciones del modelo y del proveedor de OpenClaw para que Codex restaure el
par persistido del hilo canónico; un cambio nativo independiente puede actualizar ese
par, pero el modelo externo y la cadena de reserva nunca lo sustituyen. Las filas almacenadas e inactivas
pueden archivarse después de confirmar que no hay otro ejecutor, salvo que otra vinculación activa de
OpenClaw sea propietaria del destino exacto o de alguno de sus descendientes generados
no archivados. OpenClaw sigue la paginación de descendientes de Codex y adopta un cierre seguro ante
errores de enumeración, ciclos o agotamiento del límite de seguridad. La confirmación sigue
cubriendo los clientes nativos desconocidos y la condición de carrera entre el estado y el archivado. Un Chat supervisado
bloqueado a un modelo no puede eliminarse mientras proteja la vinculación nativa.
Las fuentes activas no pueden crear una rama ni archivarse, pero aún se puede abrir un Chat supervisado
existente. Cada fila de nodo emparejado permanece en modo de solo lectura; el transporte de
Node todavía no proporciona el ciclo de vida de streaming que necesita el entorno de pruebas.

`appServer.homeScope: "user"` por sí solo cambia qué directorio principal de Codex usa un proceso
gestionado del entorno de pruebas; no publica el catálogo de la flota. Habilitar la supervisión no
cambia el valor predeterminado del entorno de pruebas. En su lugar, la conexión de supervisión independiente
usa de forma predeterminada stdio gestionado en el directorio principal del usuario cuando no existe una configuración de conexión
`appServer` explícita. La configuración explícita se respeta para esa conexión.
Las vinculaciones supervisadas pendientes y confirmadas conservan esa conexión en cada turno;
si la supervisión está deshabilitada o la conexión o el ciclo de vida divergen, se adopta un cierre seguro en lugar de
recurrir al entorno de pruebas con el directorio principal del agente. La conexión predeterminada comparte las sesiones almacenadas
con los clientes nativos de Codex, pero no su estado de actividad local del proceso.

La configuración heredada de `plugins.entries.codex-supervisor` se ha retirado. Ejecute
`openclaw doctor --fix` para migrar la entrada anterior, las definiciones de endpoints, las marcas
de políticas y las referencias de permiso o denegación del plugin a este bloque. Los valores canónicos explícitos de
`codex.config.supervision` prevalecen en caso de conflicto.

## Transporte del servidor de aplicaciones

Para los turnos ordinarios del entorno de pruebas, OpenClaw inicia el binario gestionado de Codex incluido
con el plugin oficial (actualmente `@openai/codex` `0.144.1`):

```bash
codex app-server --listen stdio://
```

Esto mantiene la versión del servidor de aplicaciones vinculada al plugin oficial `codex`, en lugar de
a cualquier CLI de Codex independiente que esté instalada localmente. Establezca
`appServer.command` solo cuando se quiera usar deliberadamente un ejecutable diferente.
Los turnos gestionados ordinarios con el directorio principal aislado y predeterminado del agente prefieren este
paquete fijado incluso cuando hay instalado un paquete de la aplicación de escritorio de macOS. Cuando
[Uso del ordenador](/es/plugins/codex-computer-use) está habilitado, o cuando `homeScope` es
`"user"` y puede cargar el estado nativo de Uso del ordenador, el inicio gestionado prefiere en su lugar
el binario de la aplicación de escritorio que posee los permisos necesarios de macOS. La misma
regla de prioridad del escritorio se aplica cuando la configuración efectiva de Codex del directorio principal aislado
de un agente habilita el Uso del ordenador nativo. Si no hay instalado ningún paquete de la aplicación de escritorio, OpenClaw
recurre al binario del paquete fijado.

La transferencia del ejecutable y el aislamiento de la configuración nativa coordinan los clientes dentro de un único
proceso del Gateway en ejecución. Reinicie el Gateway después de que otro proceso cambie la
configuración nativa del plugin de Codex.

La supervisión resuelve una conexión independiente. Sin una configuración de conexión
`appServer` explícita, usa stdio gestionado con `homeScope: "user"`;
el entorno de pruebas ordinario permanece en stdio gestionado con `homeScope: "agent"`. Ambos flujos respetan
la configuración de conexión explícita. Establezca `homeScope: "user"`
explícitamente cuando el entorno de pruebas ordinario deba compartir `$CODEX_HOME` (o `~/.codex`)
con los clientes nativos. Una vinculación supervisada privada usa la conexión de supervisión
independientemente del valor predeterminado del entorno de pruebas ordinario. Los procesos independientes del servidor de aplicaciones
conservan estados de actividad y aprobación separados.

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

| Campo                                         | Valor predeterminado                                      | Significado                                                                                                                                                                                                                                                                                                                                                                                         |
| --------------------------------------------- | --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                                   | `"stdio"`                                                 | `"stdio"` inicia Codex; el valor explícito `"unix"` se conecta al socket de control local; `"websocket"` se conecta a `url`.                                                                                                                                                                                                                                                                          |
| `homeScope`                                   | `"agent"`                                                 | `"agent"` aísla el estado ordinario del arnés por agente de OpenClaw. `"user"` es una activación explícita que comparte el `$CODEX_HOME` nativo o `~/.codex`, usa la autenticación nativa y habilita la gestión de hilos solo para el propietario. El ámbito de usuario admite transporte stdio local o Unix. Para la conexión de supervisión independiente, un valor sin establecer se resuelve como `"user"` para stdio o Unix y como `"agent"` para WebSocket. |
| `command`                                     | binario de Codex administrado                             | Ejecutable para el transporte stdio. Déjelo sin establecer para usar el binario administrado.                                                                                                                                                                                                                                                                                                        |
| `args`                                        | `["app-server", "--listen", "stdio://"]`                  | Argumentos para el transporte stdio.                                                                                                                                                                                                                                                                                                                                                                  |
| `url`                                         | sin establecer                                            | URL del App Server WebSocket o URL `unix://`. Una ruta Unix explícita vacía selecciona el socket de control canónico del directorio principal del usuario.                                                                                                                                                                                                                                             |
| `authToken`                                   | sin establecer                                            | Token de portador para el transporte WebSocket. Acepta una cadena literal o SecretInput, como `${CODEX_APP_SERVER_TOKEN}`.                                                                                                                                                                                                                                                                            |
| `headers`                                     | `{}`                                                      | Encabezados WebSocket adicionales. Los valores de los encabezados aceptan cadenas literales o valores SecretInput; por ejemplo, `x-codex-client-session-token: "${CODEX_CLIENT_SESSION_TOKEN}"`.                                                                                                                                                                                                        |
| `clearEnv`                                    | `[]`                                                      | Nombres adicionales de variables de entorno que se eliminan del proceso app-server stdio iniciado después de que OpenClaw construya su entorno heredado.                                                                                                                                                                                                                                              |
| `remoteWorkspaceRoot`                         | sin establecer                                            | Raíz remota del espacio de trabajo del app-server de Codex. Cuando se establece, OpenClaw infiere la raíz local del espacio de trabajo a partir del espacio de trabajo resuelto de OpenClaw, conserva el sufijo del cwd actual bajo esta raíz remota y envía a Codex únicamente el cwd final del app-server. Si el cwd está fuera de la raíz resuelta del espacio de trabajo de OpenClaw, OpenClaw aplica un cierre seguro en lugar de enviar una ruta local del Gateway al app-server remoto. |
| `requestTimeoutMs`                            | `60000`                                                   | Tiempo de espera para las llamadas del plano de control del app-server.                                                                                                                                                                                                                                                                                                                               |
| `turnCompletionIdleTimeoutMs`                 | `60000`                                                   | Intervalo de inactividad después de que Codex acepta un turno o después de una solicitud del app-server limitada al turno, mientras OpenClaw espera `turn/completed`.                                                                                                                                                                                                                                  |
| `postToolRawAssistantCompletionIdleTimeoutMs` | `300000`                                                  | Protección de inactividad de finalización y progreso utilizada después de una transferencia a una herramienta, la finalización de una herramienta nativa, el progreso sin procesar del asistente posterior a una herramienta, la finalización del razonamiento sin procesar o el progreso del razonamiento mientras OpenClaw espera `turn/completed`. Úsela para cargas de trabajo de confianza o pesadas en las que la síntesis posterior a una herramienta pueda permanecer legítimamente inactiva durante más tiempo que el límite de publicación final del asistente. |
| `mode`                                        | `"yolo"`, salvo que los requisitos locales de Codex no permitan YOLO | Preajuste para la ejecución YOLO o revisada por un guardián.                                                                                                                                                                                                                                                                                                                                           |
| `approvalPolicy`                              | `"never"` o una política de aprobación permitida del guardián | Política de aprobación nativa de Codex enviada al iniciar y reanudar el hilo, y al turno.                                                                                                                                                                                                                                                                                                              |
| `sandbox`                                     | `"danger-full-access"` o un sandbox permitido del guardián | Modo sandbox nativo de Codex enviado al iniciar y reanudar el hilo. Los sandboxes activos de OpenClaw restringen los turnos `danger-full-access` a `workspace-write` de Codex; la marca de red del turno sigue la salida de red del sandbox de OpenClaw.                                                                                                                                                  |
| `approvalsReviewer`                           | `"user"` o un revisor permitido del guardián              | Use `"auto_review"` para permitir que Codex revise las solicitudes de aprobación nativas cuando esté permitido.                                                                                                                                                                                                                                                                                       |
| `defaultWorkspaceDir`                         | directorio del proceso actual                             | Espacio de trabajo utilizado por `/codex bind` cuando se omite `--cwd`.                                                                                                                                                                                                                                                                                                                               |
| `serviceTier`                                 | sin establecer                                            | Nivel de servicio opcional del app-server de Codex. `"priority"` habilita el enrutamiento en modo rápido, `"flex"` solicita el procesamiento flexible y `null` elimina la anulación. El valor heredado `"fast"` se acepta como `"priority"`.                                                                                                                                                             |
| `networkProxy`                                | deshabilitado                                             | Activa la red del perfil de permisos de Codex para los comandos del app-server. OpenClaw define la configuración `permissions.<profile>.network` seleccionada y la elige mediante `default_permissions` en lugar de enviar `sandbox`.                                                                                                                                                                   |
| `experimental.sandboxExecServer`              | `false`                                                   | Activación preliminar que registra un entorno de Codex respaldado por el sandbox de OpenClaw en el app-server compatible de Codex, de modo que la ejecución nativa de Codex pueda realizarse dentro del sandbox activo de OpenClaw.                                                                                                                                                                     |

`appServer.networkProxy` es explícito porque cambia el contrato del sandbox de
Codex. Cuando está habilitado, OpenClaw también establece `features.network_proxy.enabled` y
`default_permissions` en la configuración del hilo de Codex para que el perfil de
permisos generado pueda iniciar la red administrada por Codex. OpenClaw genera de
forma predeterminada un nombre de perfil `openclaw-network-<fingerprint>` resistente
a colisiones a partir del cuerpo del perfil; use `profileName` únicamente cuando se
requiera un nombre local estable.

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

Si el entorno de ejecución normal de app-server fuera `danger-full-access`, al habilitar
`networkProxy` se usa en su lugar acceso al sistema de archivos con el estilo del espacio de trabajo para el perfil
de permisos generado. La aplicación de restricciones de red administrada por Codex usa
redes aisladas, por lo que un perfil de acceso total no protegería el tráfico saliente.

El plugin bloquea los protocolos de enlace de app-server antiguos o sin versión: Codex app-server
debe informar de la versión estable `0.143.0` o una posterior.

OpenClaw trata las URL de app-server WebSocket que no son de bucle invertido como remotas y requiere
autenticación WebSocket con identidad mediante `appServer.authToken` o una
cabecera `Authorization`. `appServer.authToken` y cada valor de `appServer.headers.*`
pueden ser un SecretInput; el entorno de ejecución de secretos resuelve las SecretRefs y la forma
abreviada de variables de entorno antes de que OpenClaw cree las opciones de inicio de app-server, y las
SecretRefs estructuradas sin resolver provocan un error antes de que se envíe cualquier token o cabecera. Cuando se
configuran plugins nativos de Codex, OpenClaw usa el plano de control de plugins
del app-server conectado para instalar o actualizar esos plugins y, a continuación, actualiza el inventario
de aplicaciones para que las aplicaciones propiedad de plugins sean visibles para el hilo de Codex. `app/list` sigue
siendo la fuente autoritativa del inventario y los metadatos, pero la política de OpenClaw
decide si `thread/start` envía `config.apps[appId].enabled = true` para una
aplicación accesible incluida en la lista, aunque Codex la marque actualmente como deshabilitada. Los identificadores
de aplicaciones desconocidos o ausentes siguen bloqueándose de forma segura; esta ruta solo activa plugins
del marketplace mediante `plugin/install` y actualiza el inventario. Conecte OpenClaw únicamente a
app-servers remotos de confianza que puedan aceptar instalaciones de plugins administradas por OpenClaw
y actualizaciones del inventario de aplicaciones.

## Modos de aprobación y aislamiento

Las sesiones locales de app-server mediante stdio usan el modo YOLO de forma predeterminada:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` y
`sandbox: "danger-full-access"`. Esta configuración de operador local de confianza permite
que los turnos y Heartbeats desatendidos de OpenClaw progresen sin solicitudes de aprobación
nativas que nadie esté disponible para responder.

Si el archivo local de requisitos del sistema de Codex no permite valores implícitos de aprobación
YOLO, revisor o aislamiento, OpenClaw trata en su lugar el valor predeterminado implícito como guardian
y selecciona permisos guardian permitidos. `tools.exec.mode: "auto"`
también obliga a que las aprobaciones de Codex sean revisadas por guardian y no conserva
anulaciones heredadas inseguras de `approvalPolicy: "never"` o `sandbox: "danger-full-access"`;
establezca `tools.exec.mode: "full"` para adoptar intencionadamente una configuración sin aprobaciones.
Las entradas `[[remote_sandbox_config]]` del mismo archivo de requisitos que coincidan con el nombre de host
se respetan al decidir el aislamiento predeterminado.

Establezca `appServer.mode: "guardian"` para usar aprobaciones de Codex revisadas por guardian:

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

El ajuste preestablecido `guardian` se expande a `approvalPolicy: "on-request"`,
`approvalsReviewer: "auto_review"` y `sandbox: "workspace-write"` cuando esos
valores están permitidos. Los campos de política individuales prevalecen sobre `mode`. El valor de revisor
anterior `guardian_subagent` sigue aceptándose como alias de compatibilidad,
pero las configuraciones nuevas deben usar `auto_review`.

Cuando un aislamiento de OpenClaw está activo, el proceso local de Codex app-server sigue
ejecutándose en el host del Gateway. Por tanto, OpenClaw deshabilita el modo de código nativo de Codex,
los servidores MCP del usuario y la ejecución respaldada por aplicaciones de plugins durante ese turno, en lugar de
tratar el aislamiento de Codex del lado del host como equivalente al backend de aislamiento
de OpenClaw. El acceso al shell se proporciona mediante herramientas dinámicas respaldadas por el aislamiento de OpenClaw,
como `sandbox_exec` y `sandbox_process`, cuando las herramientas normales de ejecución y procesos
están disponibles.

<Note>
En hosts de aislamiento de OpenClaw respaldados por Docker (`agents.defaults.sandbox.mode` establecido
en un backend de Docker), `openclaw doctor` comprueba si el host permite los espacios de nombres
de usuario sin privilegios (y, cuando está deshabilitada la salida de red del aislamiento de Docker,
los espacios de nombres de red) que necesita el `bwrap` anidado de Codex para ejecutar el shell con
`workspace-write` dentro del contenedor aislado. Una comprobación fallida suele manifestarse
como `bwrap: setting up uid map: Permission denied` o
`bwrap: loopback: Failed RTM_NEWADDR: Operation not permitted` en
hosts Ubuntu/AppArmor. Corrija la política de espacios de nombres del host indicada para el usuario
del servicio OpenClaw y reinicie el Gateway; prefiera un perfil de AppArmor específico para el
proceso del servicio en lugar de recurrir a la alternativa global del host
`kernel.apparmor_restrict_unprivileged_userns=0`, y no conceda
privilegios más amplios al contenedor Docker solo para satisfacer el `bwrap` anidado.
</Note>

## Ejecución nativa aislada

El valor predeterminado estable bloquea de forma segura: el aislamiento activo de OpenClaw deshabilita las superficies
de ejecución nativa de Codex que, de otro modo, se ejecutarían desde el host de Codex app-server.
Use `appServer.experimental.sandboxExecServer: true` solo si desea
probar la compatibilidad de Codex con entornos remotos mediante el backend de aislamiento de OpenClaw.
Esta ruta preliminar funciona con todas las versiones compatibles de Codex app-server.

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

Cuando la opción está habilitada y la sesión actual de OpenClaw está aislada, OpenClaw
inicia un exec-server local de bucle invertido respaldado por el aislamiento activo, lo registra
en Codex app-server e inicia el hilo y el turno de Codex con ese
entorno propiedad de OpenClaw. Si app-server no puede registrar el entorno,
la ejecución se bloquea de forma segura en lugar de recurrir silenciosamente a la ejecución en el host.

Esta ruta preliminar solo está disponible localmente. Un app-server WebSocket remoto no puede acceder
al exec-server de bucle invertido salvo que se ejecute en el mismo host, por lo que OpenClaw
rechaza esa combinación.

## Aislamiento de autenticación y entorno

En el directorio principal por agente predeterminado, la autenticación se selecciona en este orden:

1. Un perfil de autenticación de OpenClaw Codex explícito para el agente.
2. La cuenta existente de app-server en el directorio principal de Codex de ese agente.
3. Solo para inicios locales de app-server mediante stdio, `CODEX_API_KEY` y después
   `OPENAI_API_KEY`, cuando no existe ninguna cuenta de app-server y la autenticación de OpenAI
   sigue siendo necesaria.

Cuando OpenClaw detecta un perfil de autenticación de Codex de tipo suscripción de ChatGPT (OAuth o
tipo de credencial de token), elimina `CODEX_API_KEY` y `OPENAI_API_KEY` del
proceso secundario de Codex iniciado. Esto mantiene disponibles las claves de API del Gateway
para incrustaciones o modelos directos de OpenAI sin hacer que los turnos nativos de Codex app-server
se facturen accidentalmente mediante la API.

Los perfiles explícitos de clave de API de Codex y la alternativa local de clave de entorno mediante stdio usan
el inicio de sesión de app-server en lugar del entorno heredado por el proceso secundario. Las conexiones WebSocket de app-server
no reciben la alternativa de clave de API de entorno del Gateway; use un perfil de autenticación explícito
o la cuenta propia del app-server remoto.

Los inicios de app-server mediante stdio heredan de forma predeterminada el entorno de proceso de OpenClaw.
OpenClaw controla el puente de cuenta de Codex app-server y establece `CODEX_HOME` en un
directorio por agente dentro del estado de OpenClaw de ese agente. Esto mantiene la configuración,
las cuentas, la caché y los datos de plugins, y el estado de los hilos de Codex limitados al agente
de OpenClaw, en lugar de filtrarlos desde el directorio personal `~/.codex` del operador.

Establezca `appServer.homeScope: "user"` para compartir el estado nativo de Codex con Codex
Desktop y la CLI. Este modo de directorio principal del usuario local admite stdio administrado y
transporte Unix explícito. Usa `$CODEX_HOME` cuando está definido y `~/.codex`
en caso contrario, incluida la autenticación nativa, la configuración, los plugins y los hilos.
OpenClaw omite su puente de perfiles de autenticación para app-server. Los turnos verificados del propietario
pueden usar `codex_threads` para enumerar (con un filtro `search` opcional),
leer, bifurcar, cambiar el nombre, archivar y desarchivar esos hilos. Bifurque un hilo antes
de continuarlo en OpenClaw; los procesos independientes de Codex no coordinan
escritores simultáneos para el mismo hilo.

Esa activación de `homeScope` se aplica a las sesiones ordinarias del entorno de ejecución. Un Chat creado
mediante Codex Sessions usa en su lugar su conexión privada de supervisión, que
conserva la autenticación y la configuración del proveedor de la conexión nativa para la
rama canónica y las reanudaciones futuras.

En un Chat supervisado bloqueado a un modelo, `codex_threads` no puede adjuntar una bifurcación
diferente ni archivar el hilo nativo vinculado al Chat. La enumeración y la lectura solo de metadatos
siguen disponibles. Las lecturas de transcripciones sin procesar requieren `allowRawTranscripts`; cuando está
deshabilitado, también se rechaza la búsqueda en la lista porque la búsqueda nativa puede encontrar
vistas previas de transcripciones. Cambiar el nombre, desarchivar, crear una bifurcación separada y archivar un
hilo no relacionado que no pertenezca a otro Chat de OpenClaw requiere
`allowWriteControls`. Ninguna de las opciones omite una vinculación bloqueada.

OpenClaw no reescribe `HOME` para los inicios locales normales de app-server.
Los subprocesos ejecutados por Codex, como `openclaw`, `gh`, `git`, las CLI
de la nube y los comandos de shell, ven el directorio principal normal del proceso y pueden encontrar
la configuración y los tokens del directorio principal del usuario. Codex también puede descubrir
`$HOME/.agents/skills` y `$HOME/.agents/plugins/marketplace.json`; ese descubrimiento
de `.agents` se comparte intencionadamente con el directorio principal del operador y es independiente
del estado aislado de `~/.codex`.

En el ámbito predeterminado del agente, los plugins de OpenClaw y las instantáneas de Skills de OpenClaw
siguen pasando por el registro de plugins y el cargador de Skills propios de OpenClaw; los recursos
personales de Codex en `~/.codex` no. Si tiene Skills o plugins útiles de la CLI de Codex
procedentes de un directorio principal de Codex que deban formar parte de un agente de OpenClaw
aislado, haga un inventario explícito de ellos:

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

Si una implementación necesita aislamiento adicional del entorno, añada esas variables
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

`appServer.clearEnv` solo afecta al proceso secundario de Codex app-server iniciado.
OpenClaw elimina `CODEX_HOME` y `HOME` de esta lista durante la normalización
del inicio local: `CODEX_HOME` sigue apuntando al ámbito de agente o usuario seleccionado,
y `HOME` continúa heredándose para que los subprocesos puedan usar el estado normal
del directorio principal del usuario.

## Herramientas dinámicas

Las herramientas dinámicas de Codex usan de forma predeterminada la carga `searchable`, expuesta bajo el
espacio de nombres `openclaw` con `deferLoading: true`. OpenClaw no expone
herramientas dinámicas que dupliquen las operaciones nativas de Codex sobre el espacio de trabajo o la propia
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

La mayoría de las demás herramientas de integración de OpenClaw, como mensajería, medios, cron,
navegador, nodos, gateway, `heartbeat_respond` y `web_search`, están disponibles
mediante la búsqueda de herramientas de Codex bajo ese espacio de nombres. Esto mantiene más pequeño el contexto
inicial del modelo. Un pequeño conjunto de herramientas sigue pudiendo invocarse directamente independientemente
de `codexDynamicToolsLoading`, porque la búsqueda de herramientas de Codex puede no estar disponible
o resolver un universo limitado exclusivamente a conectores: `agents_list`, `sessions_spawn` y
`sessions_yield`. Las instrucciones del desarrollador siguen orientando a los subagentes normales de Codex
hacia `spawn_agent` nativo para el trabajo de subagentes nativos de Codex, mientras que
`sessions_spawn` continúa disponible para la delegación explícita de OpenClaw o ACP.
Las respuestas de origen que solo usan la herramienta de mensajes también siguen siendo directas, ya que se trata de un
contrato de control de turnos.

Las herramientas marcadas como `catalogMode: "direct-only"`, incluida la herramienta `computer`
de OpenClaw, se agrupan bajo `openclaw_direct`. OpenClaw añade ese espacio de nombres a la
lista `code_mode.direct_only_tool_namespaces` de Codex sin sustituir
las entradas proporcionadas por el operador. Por tanto, Codex expone esas herramientas como
`DirectModelOnly` en hilos normales y exclusivos del modo de código, en lugar de enrutarlas
mediante llamadas anidadas `tools.*` del modo de código. Este límite es necesario para los
resultados que contienen imágenes: la serialización anidada del modo de código convierte la salida de imágenes en
texto, lo que descartaría la captura de pantalla necesaria para la siguiente acción de computer.

Establezca `codexDynamicToolsLoading: "direct"` solo al conectarse a un app-server
personalizado de Codex que no pueda buscar herramientas dinámicas diferidas o al depurar
la carga útil completa de herramientas.

## Tiempos de espera

Las llamadas dinámicas a herramientas propiedad de OpenClaw tienen límites independientes de
`appServer.requestTimeoutMs`. Cada solicitud `item/tool/call` de Codex utiliza el
primer tiempo de espera disponible en este orden:

- Un argumento `timeoutMs` positivo por llamada.
- Para `image_generate`, `agents.defaults.imageGenerationModel.timeoutMs`.
- Para `image_generate` sin un tiempo de espera configurado, el valor predeterminado
  de generación de imágenes de 120 segundos.
- Para la herramienta `image` de comprensión de contenido multimedia, `tools.media.image.timeoutSeconds`
  convertido a milisegundos, o el valor predeterminado multimedia de 60 segundos. Para la
  comprensión de imágenes, esto se aplica a la solicitud en sí y no se reduce por
  el trabajo de preparación anterior.
- Para la herramienta `message`, un valor predeterminado fijo de 120 segundos.
- El valor predeterminado de 90 segundos para herramientas dinámicas.

Este mecanismo de vigilancia constituye el límite externo de la llamada dinámica `item/tool/call`. Los tiempos de espera
de solicitudes específicos del proveedor se ejecutan dentro de esa llamada y conservan su propia semántica
de tiempo de espera. Los límites de las herramientas dinámicas se restringen a 600000 ms. Cuando se agota el tiempo de espera, OpenClaw cancela la
señal de la herramienta cuando es compatible y devuelve a
Codex una respuesta de herramienta dinámica fallida para que el turno pueda continuar en lugar de dejar la sesión en
`processing`.

Después de que Codex acepta un turno, y después de que OpenClaw responde a una solicitud
del servidor de aplicaciones cuyo ámbito es el turno, el arnés espera que Codex avance en el turno actual
y finalmente complete el turno nativo con `turn/completed`. Si el
servidor de aplicaciones queda inactivo durante `appServer.turnCompletionIdleTimeoutMs`, OpenClaw
intenta interrumpir el turno de Codex, registra un tiempo de espera de diagnóstico y
libera el carril de sesión de OpenClaw para que los mensajes de chat posteriores no queden en cola
detrás de un turno nativo obsoleto.

La mayoría de las notificaciones no terminales del mismo turno desactivan ese breve mecanismo de vigilancia
porque Codex ha demostrado que el turno sigue activo. Las transferencias a herramientas utilizan un límite
de inactividad posterior a la herramienta más largo: después de que OpenClaw devuelve una respuesta `item/tool/call`,
después de que se completan elementos de herramientas nativas como `commandExecution`, después de completarse
salidas sin procesar de `custom_tool_call_output`, y después del progreso del asistente sin procesar
posterior a la herramienta, de completarse el razonamiento sin procesar o del progreso de razonamiento. La protección utiliza
`appServer.postToolRawAssistantCompletionIdleTimeoutMs` cuando está configurado y,
de lo contrario, utiliza de forma predeterminada cinco minutos. Ese mismo límite posterior a la herramienta también amplía
el mecanismo de vigilancia de progreso durante el intervalo de síntesis silencioso antes de que Codex emita el
siguiente evento del turno actual. Las finalizaciones de razonamiento, las finalizaciones de `agentMessage`
de comentarios y el progreso del razonamiento o del asistente sin procesar previo a la herramienta pueden ir seguidos
de una respuesta final automática, por lo que utilizan la protección de respuesta posterior al progreso
en lugar de liberar inmediatamente el carril de sesión. Solo los elementos `agentMessage`
completados finales o que no sean comentarios y las finalizaciones del asistente sin procesar previas a la herramienta activan la
liberación por salida del asistente: si Codex queda inactivo sin `turn/completed`,
OpenClaw intenta interrumpir el turno nativo y libera el carril de sesión.
Los fallos del servidor de aplicaciones stdio que se pueden reproducir de forma segura, incluidos los tiempos de espera
de inactividad de finalización de turno sin pruebas del asistente, herramientas, elementos activos o efectos secundarios, se
reintentan una vez en un nuevo intento del servidor de aplicaciones. Los tiempos de espera no seguros siguen retirando el
cliente del servidor de aplicaciones bloqueado y liberan el carril de sesión de OpenClaw. También
eliminan la vinculación obsoleta del hilo nativo en lugar de reproducirse
automáticamente. Los tiempos de espera de vigilancia de finalización muestran texto específico de Codex:
los casos que se pueden reproducir de forma segura indican que la respuesta puede estar incompleta, mientras que los casos no seguros indican
al usuario que verifique el estado actual antes de volver a intentarlo. Los diagnósticos públicos de tiempo de espera
incluyen campos estructurales como el último método de notificación del servidor de aplicaciones,
el id/tipo/rol del elemento de respuesta sin procesar del asistente, los recuentos de solicitudes/elementos activos y
el estado de vigilancia activado. Cuando la última notificación es un elemento de respuesta sin procesar
del asistente, también incluyen una vista previa limitada del texto del asistente. No
incluyen el contenido sin procesar del prompt ni de las herramientas.

## Detección de modelos

De forma predeterminada, el Plugin de Codex solicita al servidor de aplicaciones los modelos disponibles. La disponibilidad
de modelos pertenece al servidor de aplicaciones de Codex, por lo que la lista puede cambiar cuando
OpenClaw actualiza la versión incluida de `@openai/codex` o cuando un despliegue
hace que `appServer.command` apunte a otro binario de Codex. La disponibilidad también
puede depender de la cuenta. Utilice `/codex models` en un Gateway en ejecución para consultar el catálogo
activo de ese arnés y esa cuenta.

Si la detección falla o agota el tiempo de espera, OpenClaw utiliza un catálogo alternativo incluido:

| Id. del modelo  | Nombre para mostrar | Niveles de razonamiento   |
| --------------- | ------------------- | ------------------------ |
| `gpt-5.5`       | gpt-5.5             | low, medium, high, xhigh |
| `gpt-5.4-mini`  | GPT-5.4-Mini        | low, medium, high, xhigh |

<Note>
El arnés incluido actualmente es `@openai/codex` `0.144.1`. Una consulta `model/list`
al servidor de aplicaciones incluido devolvió estas filas públicas del selector:

| Id. del modelo   | Modalidades de entrada | Niveles de razonamiento                 |
| ---------------- | ---------------------- | --------------------------------------- |
| `gpt-5.6-sol`    | text, image            | low, medium, high, xhigh, max, ultra    |
| `gpt-5.6-terra`  | text, image            | low, medium, high, xhigh, max, ultra    |
| `gpt-5.6-luna`   | text, image            | low, medium, high, xhigh, max           |
| `gpt-5.5`        | text, image            | low, medium, high, xhigh                |
| `gpt-5.4`        | text, image            | low, medium, high, xhigh                |
| `gpt-5.4-mini`   | text, image            | low, medium, high, xhigh                |
| `gpt-5.2`        | text, image            | low, medium, high, xhigh                |

El catálogo del servidor de aplicaciones puede indicar `ultra`; actualmente, los controles de razonamiento de OpenClaw
ofrecen niveles hasta `max`.

Las filas activas del selector dependen de la cuenta y pueden cambiar con la cuenta, el catálogo de Codex
o la versión incluida; ejecute `/codex models` para obtener la lista actual en lugar
de depender de una tabla correspondiente a un momento determinado. Los modelos ocultos también pueden aparecer en el
catálogo del servidor de aplicaciones para flujos internos o especializados sin ser opciones normales
del selector de modelos.
</Note>

Ajuste la detección en `plugins.entries.codex.config.discovery`:

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

Desactive la detección cuando desee evitar que el inicio consulte Codex y utilizar únicamente
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

Codex gestiona `AGENTS.md` directamente mediante la detección nativa de documentación del proyecto.
OpenClaw no escribe archivos sintéticos de documentación de proyecto de Codex ni depende de los
nombres de archivo alternativos de Codex para los archivos de perfil, porque las alternativas de Codex solo se aplican cuando
falta `AGENTS.md`.

Para mantener la equivalencia del espacio de trabajo de OpenClaw, el arnés de Codex reenvía los demás
archivos de inicialización como instrucciones del desarrollador, pero no de forma idéntica:

- `TOOLS.md` se reenvía como instrucciones del desarrollador de Codex **heredadas**, por lo que
  los subagentes nativos de Codex generados durante el turno también las reciben.
- `SOUL.md`, `IDENTITY.md` y `USER.md` se reenvían como instrucciones de colaboración
  **con ámbito de turno**. Los subagentes nativos de Codex no las heredan,
  lo que evita que los turnos de subagentes adopten el perfil y la personalidad del agente
  principal.
- La lista compacta de Skills de OpenClaw cargadas también se reenvía como instrucciones del desarrollador
  de colaboración con ámbito de turno, por lo que los subagentes nativos de Codex tampoco
  la heredan.
- El contenido de `HEARTBEAT.md` no se inyecta; los turnos de Heartbeat reciben un
  indicador en modo de colaboración para leer el archivo cuando existe y no está
  vacío.
- El contenido de `MEMORY.md` del espacio de trabajo del agente configurado no se pega en
  la entrada del turno nativo de Codex cuando hay herramientas de memoria disponibles para ese
  espacio de trabajo; cuando existe, el arnés añade un pequeño indicador de memoria del espacio de trabajo
  a las instrucciones del desarrollador de colaboración con ámbito de turno, y Codex
  debe utilizar `memory_search` o `memory_get` cuando la memoria persistente sea pertinente.
  Si las herramientas están desactivadas, la búsqueda de memoria no está disponible o el
  espacio de trabajo activo difiere del espacio de trabajo de memoria del agente, `MEMORY.md` utiliza la
  ruta normal de contexto limitado del turno.
- `BOOTSTRAP.md`, cuando está presente, se reenvía como contexto de referencia de entrada del turno
  de OpenClaw.

## Sustituciones del entorno

Las sustituciones del entorno siguen disponibles para las pruebas locales:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN` omite el binario administrado cuando
`appServer.command` no está definido.

Se eliminó `OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1`. Utilice
`plugins.entries.codex.config.appServer.mode: "guardian"` en su lugar, o
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` para pruebas locales puntuales. Se
prefiere la configuración para despliegues reproducibles porque mantiene el comportamiento del Plugin en
el mismo archivo revisado que el resto de la configuración del arnés de Codex.

## Temas relacionados

- [Arnés de Codex](/es/plugins/codex-harness)
- [Entorno de ejecución del arnés de Codex](/es/plugins/codex-harness-runtime)
- [Supervisión de Codex](/plugins/codex-supervision)
- [Plugins nativos de Codex](/es/plugins/codex-native-plugins)
- [Uso del ordenador con Codex](/es/plugins/codex-computer-use)
- [Proveedor de OpenAI](/es/providers/openai)
- [Referencia de configuración](/es/gateway/configuration-reference)
