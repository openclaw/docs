---
read_when:
    - Necesita todos los campos de configuración del entorno de Codex
    - Estás cambiando el comportamiento del transporte, la autenticación, el descubrimiento o el tiempo de espera de app-server
    - Se está depurando el inicio del entorno de pruebas de Codex, el descubrimiento de modelos o el aislamiento del entorno
summary: Referencia de configuración, autenticación, descubrimiento y servidor de aplicaciones para el entorno de Codex
title: Referencia del entorno de Codex
x-i18n:
    generated_at: "2026-07-22T10:39:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 93414ffcf7ea755f4d003502d0451f56c0153b5317ff4768c7f6676313cc99ed
    source_path: plugins/codex-harness-reference.md
    workflow: 16
---

Esta referencia abarca la configuración detallada del plugin oficial `codex`.
Para las decisiones de configuración y enrutamiento, comience por
[arnés de Codex](/es/plugins/codex-harness).

## Superficie de configuración del plugin

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

Campos de nivel superior:

| Campo                      | Valor predeterminado                  | Significado                                                                                                                                        |
| -------------------------- | ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `discovery`                | habilitado                  | Ajustes de descubrimiento de modelos para `model/list` del servidor de aplicaciones de Codex.                                                                                    |
| `appServer`                | servidor de aplicaciones stdio administrado | Ajustes de transporte, comando, autenticación, aprobación, entorno aislado y tiempo de espera. El arnés común utiliza de forma predeterminada el estado limitado al agente.                        |
| `codexDynamicToolsLoading` | `"searchable"`           | Use `"direct"` para colocar las herramientas dinámicas de OpenClaw directamente en el contexto inicial de herramientas de Codex.                                                       |
| `codexDynamicToolsExclude` | `[]`                     | Nombres adicionales de herramientas dinámicas de OpenClaw que se omitirán en los turnos del servidor de aplicaciones de Codex.                                                                    |
| `codexPlugins`             | deshabilitado                 | Compatibilidad nativa con plugins y aplicaciones de Codex, incluido el acceso opcional a aplicaciones de cuentas conectadas. Consulte [plugins nativos de Codex](/es/plugins/codex-native-plugins). |
| `computerUse`              | deshabilitado                 | Configuración de Codex Computer Use. Consulte [Codex Computer Use](/es/plugins/codex-computer-use).                                                               |
| `sessionCatalog`           | habilitado                  | Descubrimiento nativo de sesiones de Codex para la barra lateral. Establezca `enabled: false` para deshabilitar el descubrimiento sin deshabilitar el proveedor ni el arnés.           |
| `supervision`              | deshabilitado                 | Política de transcripción y control de escritura de sesiones nativas orientada al agente. Consulte [supervisión de Codex](/es/plugins/codex-supervision).                          |

## Supervisión

De forma predeterminada, el descubrimiento de sesiones nativas enumera las sesiones de Codex no archivadas del equipo del Gateway
y de los nodos emparejados que hayan habilitado esta opción. Deshabilite únicamente ese catálogo con:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          sessionCatalog: {
            enabled: false,
          },
        },
      },
    },
  },
}
```

`supervision` controla por separado las herramientas orientadas al agente:

| Campo                 | Valor predeterminado                 | Significado                                                                                                                                                                                                                                   |
| --------------------- | ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `enabled`             | `false`                 | Habilita las herramientas de supervisión de Codex orientadas al agente. Esto no controla el catálogo de sesiones autenticadas del operador.                                                                                                                            |
| `endpoints`           | punto de conexión local integrado | Destinos de puntos de conexión avanzados y de compatibilidad para el agente conservado de supervisión de Codex y las herramientas MCP independientes. El catálogo humano y el flujo de ramas ignoran estos destinos y utilizan el servidor de aplicaciones de supervisión resuelto a partir de `appServer`.       |
| `allowRawTranscripts` | `false`                 | Con la supervisión habilitada, permite que el agente autónomo o el MCP independiente lean transcripciones y campos de listas derivados de ellas. Las lecturas de `codex_threads` limitadas a metadatos siguen disponibles. No controla la continuación autenticada de la interfaz de control.     |
| `allowWriteControls`  | `false`                 | Con la supervisión habilitada, permite mutaciones autónomas de bifurcación, cambio de nombre, archivado y desarchivado de `codex_threads`, además de las operaciones de envío, redirección e interrupción del MCP independiente. No elude otras comprobaciones de vinculación, host, estado o confirmación. |

Las entradas de puntos de conexión aceptan estos campos:

| Campo          | Se aplica a    | Significado                                                               |
| -------------- | ------------- | --------------------------------------------------------------------- |
| `id`           | todos           | Identificador estable del punto de conexión.                                                   |
| `label`        | todos           | Etiqueta de visualización opcional.                                               |
| `transport`    | todos           | `"stdio-proxy"` o `"websocket"`.                                     |
| `command`      | `stdio-proxy` | Comando opcional del servidor de aplicaciones.                                          |
| `args`         | `stdio-proxy` | Argumentos opcionales del comando.                                           |
| `cwd`          | `stdio-proxy` | Directorio de trabajo opcional del proceso secundario.                             |
| `url`          | `websocket`   | URL obligatoria de WebSocket o de un socket local compatible.                     |
| `authTokenEnv` | `websocket`   | Variable de entorno opcional cuyo valor autentica el punto de conexión. |

La página **Sesiones de Codex** utiliza el servidor de aplicaciones de supervisión del plugin y muestra
únicamente las sesiones no archivadas. Sin ajustes explícitos de conexión en `appServer`,
esa conexión consiste en stdio administrado en el directorio principal del usuario. Las filas locales almacenadas o inactivas pueden crear
un chat bloqueado a un modelo con un historial acotado del usuario y del asistente hasta el último
turno de origen terminal persistido. Su vinculación privada mantiene en esa
conexión la bifurcación de la instantánea, la rama canónica de origen `appServer`, la inyección del historial y los turnos posteriores.
El primer inicio canónico utiliza el par devuelto por la bifurcación. Las reanudaciones posteriores
omiten las sustituciones de modelo y proveedor de OpenClaw para que Codex restaure el
par persistido del hilo canónico; un cambio nativo independiente puede actualizar ese
par, pero el modelo externo y la cadena de alternativas nunca lo reemplazan. Las filas almacenadas e inactivas
pueden archivarse tras confirmar que no existe otro ejecutor, salvo que otra vinculación activa de
OpenClaw sea propietaria del destino exacto o de alguno de sus descendientes generados
y no archivados. OpenClaw sigue la paginación de descendientes de Codex y adopta un cierre seguro ante
errores de enumeración, ciclos o agotamiento del límite de seguridad. La confirmación sigue
abarcando los clientes nativos desconocidos y la condición de carrera entre el estado y el archivado. Un chat supervisado
bloqueado a un modelo no puede eliminarse mientras proteja la vinculación nativa.
Las fuentes activas no pueden crear una rama ni archivarse, pero sí puede abrirse un chat supervisado
existente. Todas las filas de nodos emparejados permanecen en modo de solo lectura; el transporte del nodo
aún no proporciona el ciclo de vida de transmisión requerido por el arnés.

`appServer.homeScope: "user"` por sí solo cambia el directorio principal de Codex que utiliza un proceso
de arnés administrado; no publica el catálogo de la flota. Habilitar la supervisión no
cambia el valor predeterminado del arnés. En su lugar, la conexión de supervisión independiente
utiliza de forma predeterminada stdio administrado en el directorio principal del usuario cuando no existen ajustes explícitos de conexión
en `appServer`. Los ajustes explícitos se respetan para esa conexión.
Las vinculaciones supervisadas pendientes y confirmadas conservan esa conexión en cada turno;
la supervisión deshabilitada o las desviaciones de conexión o ciclo de vida adoptan un cierre seguro en lugar de
recurrir al arnés del directorio principal del agente. La conexión predeterminada comparte las sesiones almacenadas
con los clientes nativos de Codex, pero no su estado de actividad local del proceso.

Los ajustes heredados de `plugins.entries.codex-supervisor` se han retirado. Ejecute
`openclaw doctor --fix` para migrar a este bloque la entrada anterior, las definiciones de puntos de conexión, las marcas de
política y las referencias de autorización o denegación de plugins. Los valores canónicos explícitos de
`codex.config.supervision` prevalecen en caso de conflicto.

## Transporte del servidor de aplicaciones

Para los turnos comunes del arnés, OpenClaw inicia el binario administrado de Codex incluido
con el plugin oficial (actualmente `@openai/codex` `0.144.6`):

```bash
codex app-server --listen stdio://
```

Esto mantiene la versión del servidor de aplicaciones vinculada al plugin oficial `codex`, en lugar de
a cualquier CLI de Codex independiente que esté instalada localmente. Establezca
`appServer.command` únicamente cuando se desee utilizar deliberadamente otro ejecutable.
Los turnos administrados comunes con el directorio principal aislado predeterminado del agente prefieren este
paquete fijado incluso cuando hay instalado un paquete de aplicación de escritorio de macOS. Cuando
[Computer Use](/es/plugins/codex-computer-use) está habilitado, o cuando `homeScope` es
`"user"` y puede cargar el estado nativo de Computer Use, el inicio administrado prefiere en su lugar
el binario de la aplicación de escritorio que posee los permisos de macOS necesarios. La misma
regla de prioridad para la aplicación de escritorio se aplica cuando la configuración efectiva de Codex del directorio principal aislado de un agente
habilita Computer Use nativo. Si no hay ningún paquete de aplicación de escritorio instalado, OpenClaw
recurre al binario del paquete fijado.

La transferencia del ejecutable y el aislamiento de la configuración nativa coordinan los clientes dentro de un
único proceso del Gateway en ejecución. Reinicie el Gateway después de que otro proceso cambie la
configuración nativa del plugin de Codex.

La supervisión resuelve una conexión independiente. Sin ajustes explícitos de conexión en
`appServer`, utiliza stdio administrado con `homeScope: "user"`;
el arnés común sigue utilizando stdio administrado con `homeScope: "agent"`. Ambos
flujos respetan los ajustes explícitos de conexión. Establezca `homeScope: "user"`
explícitamente cuando el arnés común deba compartir `$CODEX_HOME` (o `~/.codex`)
con clientes nativos. Una vinculación supervisada privada utiliza la conexión de supervisión
independientemente del valor predeterminado del arnés común. Los procesos independientes del servidor de aplicaciones
conservan estados de actividad y aprobación separados.

Para pruebas ajenas a producción con un servidor de aplicaciones que ya esté en ejecución, está disponible el transporte
WebSocket:

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

Codex clasifica el transporte WebSocket como experimental y no compatible. Para las
cargas de trabajo de producción, se recomienda utilizar stdio administrado o el socket de control Unix local.

Campos de `appServer`:

| Campo                                         | Valor predeterminado                                                | Significado                                                                                                                                                                                                                                                                                                                                                                                         |
| --------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                                   | `"stdio"`                                              | `"stdio"` inicia Codex; el valor explícito `"unix"` se conecta al socket de control local; `"websocket"` se conecta a `url`.                                                                                                                                                                                                                                                                                |
| `homeScope`                                   | `"agent"`                                              | `"agent"` aísla el estado ordinario del arnés por agente de OpenClaw. `"user"` es una habilitación explícita que comparte el `$CODEX_HOME` o `~/.codex` nativo, utiliza la autenticación nativa y habilita la gestión de hilos solo para el propietario. El ámbito de usuario admite transporte stdio local o Unix. Para la conexión de supervisión independiente, un valor no establecido se resuelve como `"user"` para stdio o Unix y como `"agent"` para WebSocket.     |
| `command`                                     | binario de Codex administrado                                   | Ejecutable para el transporte stdio. Déjelo sin establecer para utilizar el binario administrado.                                                                                                                                                                                                                                                                                                                          |
| `args`                                        | `["app-server", "--listen", "stdio://"]`               | Argumentos para el transporte stdio.                                                                                                                                                                                                                                                                                                                                                                  |
| `url`                                         | sin establecer                                                  | URL del App Server WebSocket o URL `unix://`. Una ruta Unix explícita vacía selecciona el socket de control canónico del directorio principal del usuario.                                                                                                                                                                                                                                                                          |
| `authToken`                                   | sin establecer                                                  | Token de portador para el transporte WebSocket. Acepta una cadena literal o SecretInput, como `${CODEX_APP_SERVER_TOKEN}`.                                                                                                                                                                                                                                                                              |
| `headers`                                     | `{}`                                                   | Encabezados WebSocket adicionales. Los valores de los encabezados aceptan cadenas literales o valores SecretInput, por ejemplo, `x-codex-client-session-token: "${CODEX_CLIENT_SESSION_TOKEN}"`.                                                                                                                                                                                                                               |
| `clearEnv`                                    | `[]`                                                   | Nombres de variables de entorno adicionales que se eliminan del proceso app-server stdio iniciado después de que OpenClaw construye su entorno heredado.                                                                                                                                                                                                                                                             |
| `remoteWorkspaceRoot`                         | sin establecer                                                  | Raíz remota del espacio de trabajo del app-server de Codex. Cuando se establece, OpenClaw infiere la raíz del espacio de trabajo local a partir del espacio de trabajo de OpenClaw resuelto, conserva el sufijo del cwd actual bajo esta raíz remota y envía únicamente el cwd final del app-server a Codex. Si el cwd está fuera de la raíz del espacio de trabajo de OpenClaw resuelta, OpenClaw adopta una política de cierre seguro en lugar de enviar una ruta local del Gateway al app-server remoto. |
| `loopDetectionPreToolUseRelay`                | `true`                                                 | Instala el subproceso `PreToolUse` de Codex utilizado únicamente para la detección de bucles de OpenClaw y su marcador explícito de ausencia de política. Establezca `false` para reducir la multiplicación de procesos por herramienta. Los hooks de Plugin previos a las herramientas y la política de herramientas de confianza siguen instalando el relé requerido.                                                                                                                                         |
| `requestTimeoutMs`                            | `60000`                                                | Tiempo de espera para las llamadas del plano de control del app-server.                                                                                                                                                                                                                                                                                                                                                     |
| `turnCompletionIdleTimeoutMs`                 | `60000`                                                | Ventana de inactividad después de que Codex acepta un turno o después de una solicitud del app-server limitada al turno mientras OpenClaw espera `turn/completed`.                                                                                                                                                                                                                                                                    |
| `turnAssistantCompletionIdleTimeoutMs`        | `10000`                                                | Ventana de inactividad después de que un elemento final o no perteneciente a comentarios del asistente, o una finalización sin procesar del asistente previa a una herramienta, prepara la liberación de la salida del asistente mientras OpenClaw todavía espera `turn/completed`. Aumentarla concede a Codex más tiempo para emitir `turn/completed` antes de que OpenClaw interrumpa y libere el carril de la sesión.                                                                                            |
| `postToolRawAssistantCompletionIdleTimeoutMs` | `300000`                                               | Protección de inactividad de finalización y progreso utilizada después de una transferencia a una herramienta, una finalización de herramienta nativa, un progreso sin procesar del asistente posterior a una herramienta, una finalización del razonamiento sin procesar o un progreso del razonamiento mientras OpenClaw espera `turn/completed`. Utilice esta opción para cargas de trabajo de confianza o pesadas en las que la síntesis posterior a una herramienta pueda permanecer legítimamente inactiva durante más tiempo que el presupuesto de liberación final del asistente.                                |
| `mode`                                        | `"yolo"` salvo que los requisitos locales de Codex no permitan YOLO | Preajuste para la ejecución YOLO o revisada por un guardián.                                                                                                                                                                                                                                                                                                                                                 |
| `approvalPolicy`                              | `"never"` o una política de aprobación permitida del guardián       | Política de aprobación nativa de Codex enviada al iniciar y reanudar el hilo, y en cada turno.                                                                                                                                                                                                                                                                                                                            |
| `sandbox`                                     | `"danger-full-access"` o un sandbox permitido del guardián  | Modo de sandbox nativo de Codex enviado al iniciar y reanudar el hilo. Los sandboxes activos de OpenClaw restringen los turnos `danger-full-access` al `workspace-write` de Codex; el indicador de red del turno sigue la salida de red del sandbox de OpenClaw.                                                                                                                                                                                       |
| `approvalsReviewer`                           | `"user"` o un revisor permitido del guardián               | Utilice `"auto_review"` para permitir que Codex revise las solicitudes de aprobación nativas cuando esté permitido.                                                                                                                                                                                                                                                                                                                   |
| `defaultWorkspaceDir`                         | directorio del proceso actual                              | Espacio de trabajo utilizado por `/codex bind` cuando se omite `--cwd`.                                                                                                                                                                                                                                                                                                                                        |
| `serviceTier`                                 | sin establecer                                                  | Nivel de servicio opcional del app-server de Codex. `"priority"` habilita el enrutamiento en modo rápido, `"flex"` solicita el procesamiento flexible y `null` elimina la anulación. El valor heredado `"fast"` se acepta como `"priority"`.                                                                                                                                                                                                 |
| `networkProxy`                                | deshabilitado                                               | Habilita el uso de la red del perfil de permisos de Codex para los comandos del app-server. OpenClaw define la configuración `permissions.<profile>.network` seleccionada y la selecciona con `default_permissions` en lugar de enviar `sandbox`.                                                                                                                                                                             |
| `experimental.sandboxExecServer`              | `false`                                                | Opción de participación voluntaria en la versión preliminar que registra un entorno de Codex respaldado por el entorno aislado de OpenClaw en el servidor de aplicaciones de Codex compatible, para que la ejecución nativa de Codex pueda realizarse dentro del entorno aislado de OpenClaw activo.                                                                                                                                                                                                            |

`appServer.networkProxy` es explícito porque cambia el contrato del entorno aislado de Codex.
Cuando se habilita, OpenClaw también establece `features.network_proxy.enabled` y
`default_permissions` en la configuración del hilo de Codex para que el perfil de
permisos generado pueda iniciar la red administrada por Codex. De forma
predeterminada, OpenClaw genera un nombre de perfil `openclaw-network-<fingerprint>`
resistente a colisiones a partir del cuerpo del perfil; use `profileName`
solo cuando se requiera un nombre local estable.

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

Si el entorno de ejecución normal del servidor de aplicaciones fuera
`danger-full-access`, habilitar `networkProxy` utiliza en su lugar acceso al
sistema de archivos con estilo de espacio de trabajo para el perfil de permisos
generado. La aplicación de las restricciones de red administrada por Codex es
una red aislada, por lo que un perfil de acceso completo no protegería el
tráfico saliente.

El plugin bloquea los protocolos de enlace del servidor de aplicaciones que
sean antiguos, más recientes pero no validados, de versiones preliminares, con
sufijos de compilación o sin versión. El servidor de aplicaciones de Codex debe
informar de una versión estable desde `0.143.0` hasta la versión
incluida `0.144.6`.

OpenClaw trata como remotas las URL WebSocket del servidor de aplicaciones que
no sean de bucle invertido y exige autenticación WebSocket que incluya identidad
mediante `appServer.authToken` o una cabecera `Authorization`.
`appServer.authToken` y cada valor de `appServer.headers.*` pueden ser un SecretInput;
el entorno de ejecución de secretos resuelve las SecretRefs y la forma abreviada
de variables de entorno antes de que OpenClaw cree las opciones de inicio del
servidor de aplicaciones, y las SecretRefs estructuradas sin resolver provocan
un fallo antes de que se envíe cualquier token o cabecera. Cuando se configuran
plugins nativos de Codex, OpenClaw utiliza el plano de control de plugins del
servidor de aplicaciones conectado para instalar o actualizar esos plugins y,
a continuación, actualiza el inventario de aplicaciones para que las
aplicaciones propiedad de los plugins sean visibles para el hilo de Codex.
`app/list` sigue siendo la fuente autoritativa del inventario y los
metadatos, pero la política de OpenClaw decide si `thread/start` envía
`config.apps[appId].enabled = true` para una aplicación accesible incluida en la lista, incluso
si Codex la marca actualmente como deshabilitada. Los identificadores de
aplicación desconocidos o ausentes siguen provocando un fallo seguro; esta ruta
solo activa plugins del marketplace mediante `plugin/install` y actualiza el
inventario. Conecte OpenClaw únicamente a servidores de aplicaciones remotos en
los que se confíe para aceptar instalaciones de plugins y actualizaciones del
inventario de aplicaciones administradas por OpenClaw.

## Modos de aprobación y entorno aislado

Las sesiones locales del servidor de aplicaciones mediante stdio utilizan de
forma predeterminada el modo YOLO: `approvalPolicy: "never"`,
`approvalsReviewer: "user"` y `sandbox: "danger-full-access"`. Esta postura de operador local de
confianza permite que los turnos y Heartbeats desatendidos de OpenClaw avancen
sin solicitudes de aprobación nativas que nadie esté presente para responder.

Si el archivo local de requisitos del sistema de Codex no permite valores YOLO
implícitos para la aprobación, el revisor o el entorno aislado, OpenClaw trata
en su lugar el valor predeterminado implícito como guardian y selecciona
permisos guardian permitidos. `tools.exec.mode: "auto"` también fuerza aprobaciones de
Codex revisadas por guardian y no conserva las sustituciones heredadas e
inseguras `approvalPolicy: "never"` o `sandbox: "danger-full-access"`; establezca
`tools.exec.mode: "full"` para adoptar intencionadamente una postura sin aprobaciones.
Las entradas `[[remote_sandbox_config]]` que coincidan con el nombre de host en el mismo
archivo de requisitos se respetan al decidir el valor predeterminado del entorno
aislado.

Establezca `appServer.mode: "guardian"` para utilizar aprobaciones de Codex revisadas por
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

El preajuste `guardian` se expande a `approvalPolicy: "on-request"`,
`approvalsReviewer: "auto_review"` y `sandbox: "workspace-write"` cuando esos valores están permitidos.
Los campos de política individuales sustituyen a `mode`. El valor
de revisor anterior `guardian_subagent` aún se acepta como alias de
compatibilidad, pero las configuraciones nuevas deben utilizar
`auto_review`.

Cuando hay un entorno aislado de OpenClaw activo, el proceso local del servidor
de aplicaciones de Codex sigue ejecutándose en el host del Gateway. Por tanto,
OpenClaw deshabilita para ese turno el Modo Código nativo de Codex, los
servidores MCP del usuario y la ejecución de plugins respaldada por aplicaciones,
en lugar de tratar el aislamiento de Codex en el host como equivalente al
backend de entorno aislado de OpenClaw. El acceso al shell se ofrece mediante
herramientas dinámicas respaldadas por el entorno aislado de OpenClaw, como
`sandbox_exec` y `sandbox_process`, cuando están disponibles las
herramientas normales de ejecución y procesos.

<Note>
En hosts de entorno aislado de OpenClaw respaldados por Docker
(`agents.defaults.sandbox.mode` establecido en un backend de Docker),
`openclaw doctor` comprueba si el host permite los espacios de nombres de
usuario sin privilegios y, cuando la salida de red del entorno aislado de Docker
está deshabilitada, los espacios de nombres de red que necesita el entorno
aislado anidado `bwrap` de Codex para ejecutar el shell
`workspace-write` dentro del contenedor aislado. Una comprobación fallida suele
manifestarse como `bwrap: setting up uid map: Permission denied` o `bwrap: loopback: Failed RTM_NEWADDR: Operation not permitted` en hosts con
Ubuntu/AppArmor. Corrija la política de espacios de nombres del host indicada
para el usuario del servicio de OpenClaw y reinicie el Gateway; prefiera un
perfil de AppArmor limitado al proceso del servicio antes que la alternativa
`kernel.apparmor_restrict_unprivileged_userns=0` para todo el host y no conceda privilegios más amplios al
contenedor de Docker únicamente para satisfacer el entorno aislado anidado
`bwrap`.
</Note>

## Ejecución nativa en entorno aislado

El valor predeterminado estable provoca un fallo seguro: el aislamiento activo
de OpenClaw deshabilita las superficies de ejecución nativa de Codex que, de
otro modo, se ejecutarían desde el host del servidor de aplicaciones de Codex.
Utilice `appServer.experimental.sandboxExecServer: true` únicamente si desea probar la compatibilidad de Codex
con entornos remotos mediante el backend de entorno aislado de OpenClaw. Esta
ruta preliminar funciona con todas las versiones compatibles del servidor de
aplicaciones de Codex.

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

Cuando la opción está activada y la sesión actual de OpenClaw está aislada,
OpenClaw inicia un servidor de ejecución local de bucle invertido respaldado por
el entorno aislado activo, lo registra en el servidor de aplicaciones de Codex
e inicia el hilo y el turno de Codex con ese entorno propiedad de OpenClaw. Si
el servidor de aplicaciones no puede registrar el entorno, la ejecución provoca
un fallo seguro en lugar de recurrir silenciosamente a la ejecución en el host.

Esta ruta preliminar es exclusivamente local. Un servidor de aplicaciones
WebSocket remoto no puede acceder al servidor de ejecución de bucle invertido
a menos que se ejecute en el mismo host, por lo que OpenClaw rechaza esa
combinación.

## Aislamiento de la autenticación y el entorno

En el directorio principal predeterminado de cada agente, la autenticación se
selecciona en este orden:

1. Un perfil explícito de autenticación de Codex de OpenClaw para el agente.
2. La cuenta existente del servidor de aplicaciones en el directorio principal de Codex de ese agente.
3. Solo para inicios locales del servidor de aplicaciones mediante stdio, `CODEX_API_KEY` y después
   `OPENAI_API_KEY`, cuando no hay ninguna cuenta del servidor de aplicaciones y
   aún se requiere autenticación de OpenAI.

Cuando OpenClaw detecta un perfil de autenticación de Codex con estilo de
suscripción de ChatGPT (tipo de credencial OAuth o token), elimina
`CODEX_API_KEY` y `OPENAI_API_KEY` del proceso secundario de Codex iniciado.
Esto mantiene disponibles las claves de API del Gateway para incrustaciones o
modelos directos de OpenAI sin hacer que los turnos del servidor de aplicaciones
nativo de Codex se facturen por la API de forma accidental.

Los perfiles explícitos de clave de API de Codex y la alternativa de clave de
entorno para stdio local utilizan el inicio de sesión del servidor de
aplicaciones en lugar del entorno heredado del proceso secundario. Las
conexiones WebSocket del servidor de aplicaciones no reciben la alternativa de
clave de API del entorno del Gateway; utilice un perfil de autenticación
explícito o la cuenta propia del servidor de aplicaciones remoto.

Los inicios del servidor de aplicaciones mediante stdio heredan de forma
predeterminada el entorno de procesos de OpenClaw. OpenClaw controla el puente
de cuentas del servidor de aplicaciones de Codex y establece
`CODEX_HOME` en un directorio por agente dentro del estado de OpenClaw de
ese agente. Esto mantiene la configuración, las cuentas, la caché y los datos
de plugins, y el estado de los hilos de Codex limitados al agente de OpenClaw,
en lugar de filtrarlos desde el directorio principal personal
`~/.codex` del operador.

Establezca `appServer.homeScope: "user"` para compartir el estado nativo de Codex con Codex
Desktop y la CLI. Este modo de directorio principal del usuario local admite
stdio administrado y transporte Unix explícito. Utiliza `$CODEX_HOME`
cuando está establecido y `~/.codex` en caso contrario, incluida la
autenticación, la configuración, los plugins y los hilos nativos. OpenClaw omite
su puente de perfiles de autenticación para el servidor de aplicaciones. Los
turnos de propietarios verificados pueden utilizar `codex_threads` para
enumerar (con un filtro opcional `search`), leer, bifurcar, cambiar el
nombre, archivar y desarchivar esos hilos. Bifurque un hilo antes de continuarlo
en OpenClaw; los procesos independientes de Codex no coordinan escritores
simultáneos para el mismo hilo.

Esta activación voluntaria `homeScope` se aplica a las sesiones normales
del sistema de ejecución. Un Chat creado mediante Codex Sessions utiliza en su
lugar su conexión de supervisión privada, que conserva la autenticación y la
configuración del proveedor de la conexión nativa para la rama canónica y las
reanudaciones futuras.

En un Chat supervisado y bloqueado a un modelo, `codex_threads` no puede
adjuntar una bifurcación diferente ni archivar el hilo nativo vinculado al Chat.
La enumeración y la lectura exclusiva de metadatos siguen disponibles. Las
lecturas de transcripciones sin procesar requieren `allowRawTranscripts`; cuando
está deshabilitado, también se rechaza la búsqueda en listas porque la búsqueda
nativa puede encontrar vistas previas de transcripciones. Cambiar el nombre,
desarchivar, crear una bifurcación separada y archivar un hilo no relacionado
que no pertenezca a otro Chat de OpenClaw requiere `allowWriteControls`. Ninguna
de las opciones elude una vinculación bloqueada.

OpenClaw no reescribe `HOME` para los inicios locales normales del
servidor de aplicaciones. Los subprocesos ejecutados por Codex, como
`openclaw`, `gh`, `git`, las CLI de la nube
y los comandos de shell, ven el directorio principal normal del proceso y
pueden encontrar la configuración y los tokens del directorio principal del
usuario. Codex también puede detectar `$HOME/.agents/skills` y
`$HOME/.agents/plugins/marketplace.json`; esa detección de `.agents` se comparte
intencionadamente con el directorio principal del operador y está separada del
estado aislado `~/.codex`.

En el ámbito predeterminado del agente, los plugins de OpenClaw y las
instantáneas de Skills de OpenClaw siguen fluyendo mediante el registro de
plugins y el cargador de Skills propios de OpenClaw; los recursos personales
`~/.codex` de Codex no. Si se dispone de Skills o plugins útiles de la
CLI de Codex procedentes de un directorio principal de Codex que deban formar
parte de un agente aislado de OpenClaw, inventaríelos explícitamente:

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

Si una implementación necesita aislamiento adicional del entorno, añada esas
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

`appServer.clearEnv` solo afecta al proceso secundario iniciado del servidor de
aplicaciones de Codex. OpenClaw elimina `CODEX_HOME` y
`HOME` de esta lista durante la normalización del inicio local:
`CODEX_HOME` sigue apuntando al ámbito seleccionado del agente o del
usuario, y `HOME` sigue heredándose para que los subprocesos puedan
utilizar el estado normal del directorio principal del usuario.

## Herramientas dinámicas

Las herramientas dinámicas de Codex utilizan de forma predeterminada la carga
`searchable`, expuesta en el espacio de nombres `openclaw` con
`deferLoading: true`. Normalmente, OpenClaw no expone herramientas dinámicas que
dupliquen las operaciones nativas de Codex sobre el espacio de trabajo ni la
propia superficie de búsqueda de herramientas de Codex:

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

Cuando una lista finita de elementos permitidos del entorno de ejecución
deshabilita el Modo Código nativo, OpenClaw envía una selección vacía del
entorno de ejecución. En ese caso directo y sin aislamiento, OpenClaw conserva
sus herramientas `exec` y `process`, filtradas por
políticas, como alternativa de shell. Las listas de elementos permitidos del
entorno de ejecución y `codexDynamicToolsExclude` siguen aplicándose.

La mayoría de las herramientas de integración restantes de OpenClaw, como mensajería, contenido multimedia, cron,
navegador, nodos, Gateway, `heartbeat_respond` y `web_search`, están disponibles
mediante la búsqueda de herramientas de Codex en ese espacio de nombres. Esto mantiene más pequeño
el contexto inicial del modelo. Un pequeño conjunto de herramientas permanece disponible para llamadas directas independientemente de
`codexDynamicToolsLoading`, porque la búsqueda de herramientas de Codex puede no estar disponible o
resolver un universo compuesto únicamente por conectores: `agents_list`, `sessions_spawn` y
`sessions_yield`. Las instrucciones para desarrolladores siguen orientando a los subagentes normales de Codex
hacia `spawn_agent` nativo para el trabajo de subagentes nativos de Codex, mientras que
`sessions_spawn` permanece disponible para la delegación explícita de OpenClaw o ACP.
Las respuestas de origen que solo usan herramientas de mensajes también permanecen directas, ya que se trata de un
contrato de control del turno.

Las herramientas marcadas con `catalogMode: "direct-only"`, incluida la herramienta `computer`
de OpenClaw, se agrupan bajo `openclaw_direct`. OpenClaw añade ese espacio de nombres a
la lista `code_mode.direct_only_tool_namespaces` de Codex sin reemplazar
las entradas proporcionadas por el operador. Por tanto, Codex expone esas herramientas como
`DirectModelOnly` en hilos normales y exclusivos del modo de código, en lugar de dirigirlas
mediante llamadas `tools.*` anidadas del modo de código. Este límite es necesario para
los resultados que contienen imágenes: la serialización anidada del modo de código convierte la salida de imágenes en
texto, lo que descartaría la captura de pantalla necesaria para la siguiente acción en el equipo.

Establezca `codexDynamicToolsLoading: "direct"` solo al conectarse a un
servidor de aplicaciones de Codex personalizado que no pueda buscar herramientas dinámicas diferidas o al depurar
la carga útil completa de herramientas.

## Tiempos de espera

Las llamadas a herramientas dinámicas propiedad de OpenClaw están limitadas independientemente de
`appServer.requestTimeoutMs`. Cada solicitud `item/tool/call` de Codex utiliza el
primer tiempo de espera disponible en este orden:

- Un argumento `timeoutMs` positivo por llamada.
- Para `image_generate`, `agents.defaults.mediaModels.image.timeoutMs`.
- Para `image_generate` sin un tiempo de espera configurado, el valor predeterminado de generación de imágenes de 120 segundos.
- Para la herramienta de comprensión multimedia `image`, el valor `timeoutSeconds`
  de la entrada `tools.media.models[]` seleccionada y compatible con imágenes,
  convertido a milisegundos, o el valor predeterminado multimedia de 60 segundos. Para la
  comprensión de imágenes, esto se aplica a la solicitud en sí y no se reduce por
  el trabajo de preparación previo.
- Para la herramienta `message`, un valor predeterminado fijo de 120 segundos.
- El valor predeterminado de herramientas dinámicas de 90 segundos.

Este mecanismo de vigilancia constituye el presupuesto externo de `item/tool/call` dinámico. Los tiempos de espera
de las solicitudes específicos del proveedor se ejecutan dentro de esa llamada y mantienen su propia semántica de tiempo de espera.
Los presupuestos de herramientas dinámicas tienen un límite máximo de 600000 ms. Cuando se agota el tiempo de espera, OpenClaw cancela la
señal de la herramienta cuando es compatible y devuelve a
Codex una respuesta fallida de la herramienta dinámica para que el turno pueda continuar, en lugar de dejar la sesión en
`processing`.

Después de que Codex acepta un turno y después de que OpenClaw responde a una solicitud
del servidor de aplicaciones limitada al turno, el entorno de ejecución espera que Codex avance en el turno actual
y finalmente complete el turno nativo con `turn/completed`. Si el
servidor de aplicaciones permanece inactivo durante `appServer.turnCompletionIdleTimeoutMs`, OpenClaw
intenta interrumpir el turno de Codex, registra un tiempo de espera de diagnóstico y
libera la vía de sesión de OpenClaw para que los mensajes de chat posteriores no queden en cola
detrás de un turno nativo obsoleto.

La mayoría de las notificaciones no terminales del mismo turno desactivan ese breve mecanismo de vigilancia
porque Codex ha demostrado que el turno sigue activo. Las transferencias de herramientas utilizan un presupuesto de
inactividad posterior a la herramienta más prolongado: después de que OpenClaw devuelve una respuesta `item/tool/call`,
después de que finalizan elementos de herramientas nativas como `commandExecution`, después de que se completan
`custom_tool_call_output` sin procesar y después del progreso sin procesar del asistente
posterior a la herramienta, de la finalización del razonamiento sin procesar o del progreso del razonamiento. El mecanismo de protección utiliza
`appServer.postToolRawAssistantCompletionIdleTimeoutMs` cuando está configurado y,
de lo contrario, adopta cinco minutos como valor predeterminado. Ese mismo presupuesto posterior a la herramienta también amplía
el mecanismo de vigilancia del progreso durante el intervalo silencioso de síntesis antes de que Codex emita el
siguiente evento del turno actual. Las finalizaciones de razonamiento, las finalizaciones de `agentMessage`
de comentarios y el razonamiento sin procesar previo a la herramienta o el progreso del asistente pueden ir seguidos
de una respuesta final automática, por lo que utilizan el mecanismo de protección de respuesta posterior al progreso
en lugar de liberar inmediatamente la vía de sesión. Solo los elementos `agentMessage`
completados finales o que no sean comentarios y las finalizaciones sin procesar del asistente previas a la herramienta activan la
liberación de la salida del asistente: si Codex permanece después inactivo sin `turn/completed`,
OpenClaw intenta interrumpir el turno nativo y libera la vía de
sesión. Los fallos del servidor de aplicaciones stdio que pueden reproducirse de forma segura, incluidos los tiempos de espera
por inactividad al completar el turno sin pruebas del asistente, de herramientas, de elementos activos ni de efectos secundarios, se
reintentan una vez mediante un nuevo intento del servidor de aplicaciones. Los tiempos de espera que no son seguros siguen retirando el
cliente bloqueado del servidor de aplicaciones y liberando la vía de sesión de OpenClaw. También
eliminan el enlace obsoleto del hilo nativo en lugar de reproducirse
automáticamente. Los tiempos de espera de vigilancia de finalización muestran texto de tiempo de espera específico de Codex:
los casos que pueden reproducirse de forma segura indican que la respuesta puede estar incompleta, mientras que los casos no seguros indican
al usuario que verifique el estado actual antes de volver a intentarlo. Los diagnósticos públicos de tiempo de espera
incluyen campos estructurales, como el último método de notificación del servidor de aplicaciones,
el identificador/tipo/rol del elemento de respuesta sin procesar del asistente, los recuentos de solicitudes/elementos activos y
el estado de vigilancia activado. Cuando la última notificación es un elemento de respuesta sin procesar
del asistente, también incluyen una vista previa limitada del texto del asistente. No
incluyen el contenido sin procesar de las instrucciones ni de las herramientas.

## Detección de modelos

De forma predeterminada, el Plugin de Codex solicita al servidor de aplicaciones los modelos disponibles. La
disponibilidad de modelos es propiedad del servidor de aplicaciones de Codex, por lo que la lista puede cambiar cuando
OpenClaw actualiza la versión `@openai/codex` incluida o cuando una implementación
hace que `appServer.command` apunte a otro binario de Codex. La disponibilidad también puede
estar limitada a una cuenta. Utilice `/codex models` en un Gateway en ejecución para consultar el catálogo
en tiempo real de ese entorno de ejecución y esa cuenta.

Si la detección falla o agota el tiempo de espera, OpenClaw utiliza un catálogo alternativo incluido:

| Id. del modelo       | Nombre para mostrar | Niveles de razonamiento        |
| -------------- | ------------ | ------------------------ |
| `gpt-5.5`      | gpt-5.5      | bajo, medio, alto, muy alto |
| `gpt-5.4-mini` | GPT-5.4-Mini | bajo, medio, alto, muy alto |

<Note>
El entorno de ejecución incluido actualmente es `@openai/codex` `0.144.6`. Una consulta `model/list`
al servidor de aplicaciones incluido devolvió estas filas públicas del selector:

| Id. del modelo        | Modalidades de entrada | Niveles de razonamiento                    |
| --------------- | ---------------- | ------------------------------------ |
| `gpt-5.6-sol`   | texto, imagen      | bajo, medio, alto, muy alto, máximo, ultra |
| `gpt-5.6-terra` | texto, imagen      | bajo, medio, alto, muy alto, máximo, ultra |
| `gpt-5.6-luna`  | texto, imagen      | bajo, medio, alto, muy alto, máximo        |
| `gpt-5.5`       | texto, imagen      | bajo, medio, alto, muy alto             |
| `gpt-5.4`       | texto, imagen      | bajo, medio, alto, muy alto             |
| `gpt-5.4-mini`  | texto, imagen      | bajo, medio, alto, muy alto             |
| `gpt-5.2`       | texto, imagen      | bajo, medio, alto, muy alto             |

El catálogo del servidor de aplicaciones puede indicar `ultra`; actualmente, los controles de razonamiento de OpenClaw
ofrecen niveles hasta `max`.

Las filas del selector en tiempo real están limitadas a la cuenta y pueden cambiar según la cuenta, el catálogo de Codex
o la versión incluida; ejecute `/codex models` para obtener la lista actual en lugar
de depender de una tabla correspondiente a un momento concreto. Los modelos ocultos también pueden aparecer en el
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

Desactive la detección si desea evitar que el inicio consulte Codex y utilizar únicamente
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

## Archivos de arranque del espacio de trabajo

Codex gestiona `AGENTS.md` directamente mediante la detección nativa de documentación del proyecto.
OpenClaw no escribe archivos sintéticos de documentación del proyecto de Codex ni depende de los nombres de archivo
alternativos de Codex para los archivos de personalidad, porque las alternativas de Codex solo se aplican cuando
falta `AGENTS.md`.

Para mantener la equivalencia con el espacio de trabajo de OpenClaw, el entorno de ejecución de Codex reenvía los demás
archivos de arranque como instrucciones para desarrolladores, pero no de forma idéntica:

- `TOOLS.md` se reenvía como instrucciones para desarrolladores de Codex **heredadas**, por lo que
  los subagentes nativos de Codex generados durante el turno también las reciben.
- `SOUL.md`, `IDENTITY.md` y `USER.md` se reenvían como instrucciones de colaboración
  **limitadas al turno**. Los subagentes nativos de Codex no las heredan,
  lo que evita que los turnos de los subagentes adopten la personalidad y
  el perfil de usuario del agente principal.
- La lista compacta de Skills cargadas de OpenClaw también se reenvía como
  instrucciones de colaboración para desarrolladores limitadas al turno, por lo que los subagentes nativos de Codex tampoco
  la heredan.
- El contenido de `HEARTBEAT.md` no se inyecta; los turnos de Heartbeat reciben un
  indicador en modo de colaboración para leer el archivo cuando existe y no está
  vacío.
- El contenido de `MEMORY.md` del espacio de trabajo configurado del agente no se incluye en
  la entrada del turno nativo de Codex cuando las herramientas de memoria están disponibles para ese
  espacio de trabajo; cuando existe, el entorno de ejecución añade un pequeño indicador de memoria del espacio de trabajo
  a las instrucciones de colaboración para desarrolladores limitadas al turno, y Codex
  debe utilizar `memory_search` o `memory_get` cuando la memoria persistente sea pertinente.
  Si las herramientas están desactivadas, la búsqueda en memoria no está disponible o el espacio de trabajo
  activo difiere del espacio de trabajo de memoria del agente, `MEMORY.md` utiliza en su lugar la
  ruta normal y limitada del contexto del turno.
- `BOOTSTRAP.md`, cuando está presente, se reenvía como contexto de referencia de entrada
  del turno de OpenClaw.

## Sustituciones mediante variables de entorno

Las sustituciones mediante variables de entorno siguen estando disponibles para pruebas locales:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN` omite el binario administrado cuando
`appServer.command` no está definido.

Se eliminó `OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1`. Utilice
`plugins.entries.codex.config.appServer.mode: "guardian"` en su lugar o
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` para pruebas locales puntuales. Se prefiere la configuración
para implementaciones reproducibles porque mantiene el comportamiento del Plugin en
el mismo archivo revisado que el resto de la configuración del entorno de ejecución de Codex.

## Temas relacionados

- [Entorno de ejecución de Codex](/es/plugins/codex-harness)
- [Runtime del entorno de ejecución de Codex](/es/plugins/codex-harness-runtime)
- [Supervisión de Codex](/es/plugins/codex-supervision)
- [Plugins nativos de Codex](/es/plugins/codex-native-plugins)
- [Uso del equipo con Codex](/es/plugins/codex-computer-use)
- [Proveedor de OpenAI](/es/providers/openai)
- [Referencia de configuración](/es/gateway/configuration-reference)
