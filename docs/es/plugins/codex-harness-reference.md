---
read_when:
    - Necesitas todos los campos de configuración del arnés de Codex
    - Está cambiando el comportamiento del transporte, la autenticación, el descubrimiento o el tiempo de espera de app-server
    - Se está depurando el inicio del entorno de Codex, el descubrimiento de modelos o el aislamiento del entorno
summary: Referencia de configuración, autenticación, detección y servidor de aplicaciones para el arnés de Codex
title: Referencia del arnés de Codex
x-i18n:
    generated_at: "2026-07-19T02:01:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f55db3e8850c574dd2cbb69ec55fb584ee16055eb4d3751946f0e7fa809a8175
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
| `discovery`                | habilitado                  | Ajustes de detección de modelos para `model/list` del servidor de aplicaciones de Codex.                                                                                    |
| `appServer`                | servidor de aplicaciones stdio administrado | Ajustes de transporte, comando, autenticación, aprobación, entorno aislado y tiempo de espera. El arnés común utiliza de forma predeterminada el estado limitado al agente.                        |
| `codexDynamicToolsLoading` | `"searchable"`           | Utilice `"direct"` para colocar las herramientas dinámicas de OpenClaw directamente en el contexto inicial de herramientas de Codex.                                                       |
| `codexDynamicToolsExclude` | `[]`                     | Nombres adicionales de herramientas dinámicas de OpenClaw que se omitirán en los turnos del servidor de aplicaciones de Codex.                                                                    |
| `codexPlugins`             | deshabilitado                 | Compatibilidad nativa con plugins y aplicaciones de Codex, incluido el acceso voluntario a aplicaciones de cuentas conectadas. Consulte [Plugins nativos de Codex](/es/plugins/codex-native-plugins). |
| `computerUse`              | deshabilitado                 | Configuración de Codex Computer Use. Consulte [Codex Computer Use](/es/plugins/codex-computer-use).                                                               |
| `sessionCatalog`           | habilitado                  | Detección nativa de sesiones de Codex para la barra lateral. Establezca `enabled: false` para deshabilitar la detección sin deshabilitar el proveedor ni el arnés.           |
| `supervision`              | deshabilitado                 | Política de transcripción y control de escritura de sesiones nativas orientada al agente. Consulte [Supervisión de Codex](/es/plugins/codex-supervision).                          |

## Supervisión

De forma predeterminada, la detección de sesiones nativas enumera las sesiones de Codex no archivadas del equipo del Gateway
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
| `enabled`             | `false`                 | Habilita las herramientas de supervisión de Codex orientadas al agente. Esto no controla el catálogo de sesiones del operador autenticado.                                                                                                                            |
| `endpoints`           | endpoint local integrado | Objetivos de endpoint de compatibilidad y avanzados para el agente de supervisión de Codex conservado y las herramientas MCP independientes. El catálogo humano y el flujo de ramas ignoran estos objetivos y utilizan el servidor de aplicaciones de supervisión resuelto desde `appServer`.       |
| `allowRawTranscripts` | `false`                 | Con la supervisión habilitada, permite las lecturas autónomas de transcripciones por parte del agente o de MCP independiente y los campos de lista derivados de transcripciones. Las lecturas de `codex_threads` limitadas a metadatos siguen disponibles. No controla la continuación autenticada de la interfaz de control.     |
| `allowWriteControls`  | `false`                 | Con la supervisión habilitada, permite las mutaciones autónomas de `codex_threads` para bifurcar, cambiar de nombre, archivar y desarchivar, además de las operaciones de envío, redirección e interrupción de MCP independiente. No omite otras comprobaciones de vinculación, host, estado o confirmación. |

Las entradas de endpoint aceptan estos campos:

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

La página **Sesiones de Codex** utiliza el servidor de aplicaciones de supervisión del plugin y muestra
únicamente las sesiones no archivadas. Sin ajustes de conexión explícitos en `appServer`,
esa conexión es stdio administrada en el directorio personal del usuario. Las filas locales almacenadas o inactivas pueden crear
un chat bloqueado a un modelo con un historial acotado del usuario y del asistente hasta el último
turno de origen persistido que haya terminado. Su vinculación privada mantiene la bifurcación de la instantánea,
la rama de origen canónica de `appServer`, la inyección del historial y los turnos posteriores en esa
conexión. El primer inicio canónico utiliza el par devuelto por la bifurcación. Las
reanudaciones posteriores omiten las sustituciones de modelo y proveedor de OpenClaw para que Codex restaure el
par persistido del hilo canónico; un cambio nativo independiente puede actualizar ese
par, pero el modelo externo y la cadena de respaldo nunca lo reemplazan. Las filas almacenadas e inactivas
pueden archivarse tras confirmar que no hay otro ejecutor, salvo que otra vinculación activa de
OpenClaw sea propietaria del objetivo exacto o de uno de sus descendientes generados
no archivados. OpenClaw sigue la paginación de descendientes de Codex y se cierra de forma segura ante
errores de enumeración, ciclos o agotamiento del límite de seguridad. La confirmación sigue
abarcando los clientes nativos desconocidos y la condición de carrera entre el estado y el archivado. Un chat supervisado
bloqueado a un modelo no puede eliminarse mientras proteja la vinculación nativa.
Los orígenes activos no pueden crear una rama ni archivarse, pero un chat supervisado existente
sí puede abrirse. Todas las filas de nodos emparejados permanecen en modo de solo lectura; el transporte del nodo
todavía no proporciona el ciclo de vida de transmisión necesario para el arnés.

`appServer.homeScope: "user"` solo cambia qué directorio personal de Codex utiliza un proceso de
arnés administrado; no publica el catálogo de la flota. Habilitar la supervisión no
cambia el valor predeterminado del arnés. En su lugar, la conexión de supervisión independiente
utiliza de forma predeterminada stdio administrada en el directorio personal del usuario cuando no existen ajustes de conexión
explícitos en `appServer`. Los ajustes explícitos se respetan para esa conexión.
Las vinculaciones supervisadas pendientes y confirmadas conservan esa conexión en cada turno;
si la supervisión está deshabilitada o se produce una desviación de la conexión o del ciclo de vida, el sistema se cierra de forma segura en lugar de
recurrir al arnés del directorio personal del agente. La conexión predeterminada comparte las sesiones almacenadas
con los clientes nativos de Codex, no su estado de actividad local del proceso.

Los ajustes heredados de `plugins.entries.codex-supervisor` están retirados. Ejecute
`openclaw doctor --fix` para migrar la entrada antigua, las definiciones de endpoints, las marcas de
política y las referencias de permisos y denegaciones del plugin a este bloque. Los valores canónicos explícitos de
`codex.config.supervision` prevalecen en caso de conflicto.

## Transporte del servidor de aplicaciones

Para los turnos comunes del arnés, OpenClaw inicia el binario administrado de Codex incluido
con el plugin oficial (actualmente `@openai/codex` `0.144.6`):

```bash
codex app-server --listen stdio://
```

Esto mantiene la versión del servidor de aplicaciones vinculada al plugin oficial `codex` en lugar de
a cualquier CLI de Codex independiente que esté instalada localmente. Establezca
`appServer.command` solo cuando se desee utilizar intencionadamente un ejecutable diferente.
Los turnos administrados comunes con el directorio personal aislado predeterminado del agente prefieren este
paquete fijado incluso cuando hay instalado un paquete de aplicación de escritorio de macOS. Cuando
[Computer Use](/es/plugins/codex-computer-use) está habilitado, o cuando `homeScope` es
`"user"` y puede cargar el estado nativo de Computer Use, el inicio administrado prefiere en su lugar
el binario de la aplicación de escritorio que posee los permisos de macOS necesarios. La misma
regla de prioridad para la aplicación de escritorio se aplica cuando la configuración efectiva de Codex de un directorio personal aislado del agente
habilita Computer Use nativo. Si no hay ningún paquete de aplicación de escritorio instalado, OpenClaw
recurre al binario del paquete fijado.

El traspaso del ejecutable y el aislamiento de la configuración nativa coordinan los clientes dentro de un único
proceso del Gateway en ejecución. Reinicie el Gateway después de que otro proceso cambie la
configuración nativa del plugin de Codex.

La supervisión resuelve una conexión independiente. Sin ajustes de conexión
explícitos en `appServer`, utiliza stdio administrada con `homeScope: "user"`;
el arnés común permanece en stdio administrada con `homeScope: "agent"`. Ambos flujos
respetan los ajustes de conexión explícitos. Establezca `homeScope: "user"`
explícitamente cuando el arnés común deba compartir `$CODEX_HOME` (o `~/.codex`)
con clientes nativos. Una vinculación supervisada privada utiliza la conexión de supervisión
independientemente del valor predeterminado del arnés común. Los procesos independientes del servidor de aplicaciones
mantienen estados activos y de aprobación separados.

Para pruebas que no sean de producción con un servidor de aplicaciones ya en ejecución, está disponible el transporte
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

Codex clasifica el transporte WebSocket como experimental y no compatible. Para las cargas de trabajo
de producción, prefiera stdio administrada o el socket de control Unix local.

Campos de `appServer`:

| Campo                                         | Valor predeterminado                                    | Significado                                                                                                                                                                                                                                                                                                                                                                                         |
| --------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                                   | `"stdio"`                                              | `"stdio"` inicia Codex; `"unix"` explícito se conecta al socket de control local; `"websocket"` se conecta a `url`.                                                                                                                                                                                                                                                                                |
| `homeScope`                                   | `"agent"`                                              | `"agent"` aísla el estado ordinario del arnés para cada agente de OpenClaw. `"user"` es una activación explícita que comparte el `$CODEX_HOME` o `~/.codex` nativo, utiliza la autenticación nativa y habilita la gestión de hilos exclusiva del propietario. El ámbito de usuario admite stdio local o transporte Unix. Para la conexión de supervisión independiente, un valor no establecido se resuelve como `"user"` para stdio o Unix y como `"agent"` para WebSocket.     |
| `command`                                     | binario de Codex gestionado                             | Ejecutable para el transporte stdio. Déjelo sin establecer para utilizar el binario gestionado.                                                                                                                                                                                                                                                                                                                          |
| `args`                                        | `["app-server", "--listen", "stdio://"]`               | Argumentos para el transporte stdio.                                                                                                                                                                                                                                                                                                                                                                  |
| `url`                                         | sin establecer                                          | URL del servidor de aplicaciones WebSocket o URL `unix://`. Una ruta Unix explícita vacía selecciona el socket de control canónico del directorio personal del usuario.                                                                                                                                                                                                                                                                          |
| `authToken`                                   | sin establecer                                          | Token de portador para el transporte WebSocket. Acepta una cadena literal o SecretInput, como `${CODEX_APP_SERVER_TOKEN}`.                                                                                                                                                                                                                                                                              |
| `headers`                                     | `{}`                                                   | Encabezados WebSocket adicionales. Los valores de los encabezados aceptan cadenas literales o valores SecretInput; por ejemplo, `x-codex-client-session-token: "${CODEX_CLIENT_SESSION_TOKEN}"`.                                                                                                                                                                                                                               |
| `clearEnv`                                    | `[]`                                                   | Nombres de variables de entorno adicionales que se eliminan del proceso del servidor de aplicaciones stdio iniciado después de que OpenClaw construya su entorno heredado.                                                                                                                                                                                                                                                             |
| `remoteWorkspaceRoot`                         | sin establecer                                          | Raíz remota del espacio de trabajo del servidor de aplicaciones Codex. Cuando se establece, OpenClaw infiere la raíz del espacio de trabajo local a partir del espacio de trabajo de OpenClaw resuelto, conserva el sufijo del cwd actual bajo esta raíz remota y envía a Codex únicamente el cwd final del servidor de aplicaciones. Si el cwd está fuera de la raíz del espacio de trabajo de OpenClaw resuelta, OpenClaw impide la operación en lugar de enviar una ruta local del Gateway al servidor de aplicaciones remoto. |
| `loopDetectionPreToolUseRelay`                | `true`                                                 | Instala el subproceso `PreToolUse` de Codex utilizado únicamente para la detección de bucles de OpenClaw y su marcador explícito de ausencia de política. Establezca `false` para reducir la proliferación de procesos por herramienta. Los hooks de Plugin previos a las herramientas y la política de herramientas de confianza siguen instalando el relé requerido.                                                                                                                                         |
| `requestTimeoutMs`                            | `60000`                                                | Tiempo de espera para las llamadas del plano de control del servidor de aplicaciones.                                                                                                                                                                                                                                                                                                                                                     |
| `turnCompletionIdleTimeoutMs`                 | `60000`                                                | Intervalo de inactividad después de que Codex acepte un turno o después de una solicitud del servidor de aplicaciones limitada al turno, mientras OpenClaw espera `turn/completed`.                                                                                                                                                                                                                                                                    |
| `turnAssistantCompletionIdleTimeoutMs`        | `10000`                                                | Intervalo de inactividad después de que un elemento final o no destinado a comentarios del asistente, o la finalización sin procesar del asistente previa a una herramienta, active la entrega de la salida del asistente mientras OpenClaw sigue esperando `turn/completed`. Aumentarlo concede a Codex más tiempo para emitir `turn/completed` antes de que OpenClaw interrumpa y libere el carril de la sesión.                                                                                            |
| `postToolRawAssistantCompletionIdleTimeoutMs` | `300000`                                               | Protección de inactividad tras la finalización y del progreso utilizada después de una transferencia a una herramienta, la finalización de una herramienta nativa, el progreso sin procesar del asistente posterior a una herramienta, la finalización del razonamiento sin procesar o el progreso del razonamiento, mientras OpenClaw espera `turn/completed`. Utilícela para cargas de trabajo de confianza o pesadas en las que la síntesis posterior a una herramienta pueda permanecer legítimamente inactiva durante más tiempo que el presupuesto de entrega final del asistente.                                |
| `mode`                                        | `"yolo"` salvo que los requisitos locales de Codex no permitan YOLO | Preajuste para la ejecución YOLO o revisada por un guardián.                                                                                                                                                                                                                                                                                                                                                 |
| `approvalPolicy`                              | `"never"` o una política de aprobación permitida del guardián       | Política de aprobación nativa de Codex enviada al iniciar y reanudar el hilo, así como en cada turno.                                                                                                                                                                                                                                                                                                                            |
| `sandbox`                                     | `"danger-full-access"` o un entorno aislado permitido del guardián  | Modo de entorno aislado nativo de Codex enviado al iniciar y reanudar el hilo. Los entornos aislados activos de OpenClaw restringen los turnos `danger-full-access` al `workspace-write` de Codex; el indicador de red del turno sigue la salida de red del entorno aislado de OpenClaw.                                                                                                                                                                                       |
| `approvalsReviewer`                           | `"user"` o un revisor permitido del guardián               | Utilice `"auto_review"` para permitir que Codex revise las solicitudes de aprobación nativas cuando esté permitido.                                                                                                                                                                                                                                                                                                                   |
| `defaultWorkspaceDir`                         | directorio del proceso actual                          | Espacio de trabajo utilizado por `/codex bind` cuando se omite `--cwd`.                                                                                                                                                                                                                                                                                                                                        |
| `serviceTier`                                 | sin establecer                                          | Nivel de servicio opcional del servidor de aplicaciones Codex. `"priority"` habilita el enrutamiento en modo rápido, `"flex"` solicita el procesamiento flexible y `null` elimina la sobrescritura. El valor heredado `"fast"` se acepta como `"priority"`.                                                                                                                                                                                                 |
| `networkProxy`                                | deshabilitado                                           | Activa opcionalmente las redes del perfil de permisos de Codex para los comandos del servidor de aplicaciones. OpenClaw define la configuración `permissions.<profile>.network` seleccionada y la elige con `default_permissions` en lugar de enviar `sandbox`.                                                                                                                                                                             |
| `experimental.sandboxExecServer`              | `false`                                                | Opción de participación voluntaria en la versión preliminar que registra un entorno de Codex respaldado por el sandbox de OpenClaw en el servidor de aplicaciones de Codex compatible, de modo que la ejecución nativa de Codex pueda realizarse dentro del sandbox activo de OpenClaw.                                                                                                                                                                                                            |

`appServer.networkProxy` es explícito porque cambia el contrato del entorno aislado de
Codex. Cuando está habilitado, OpenClaw también establece `features.network_proxy.enabled` y
`default_permissions` en la configuración del hilo de Codex para que el perfil de
permisos generado pueda iniciar la red administrada por Codex. De forma
predeterminada, OpenClaw genera un nombre de perfil `openclaw-network-<fingerprint>` resistente
a colisiones a partir del cuerpo del perfil; use `profileName` solo cuando
se requiera un nombre local estable.

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
`danger-full-access`, al habilitar `networkProxy` se utiliza en su lugar un
acceso al sistema de archivos de tipo espacio de trabajo para el perfil de
permisos generado. La aplicación de políticas de red administrada por Codex
corresponde a una red aislada, por lo que un perfil de acceso total no
protegería el tráfico saliente.

El plugin bloquea los protocolos de enlace del servidor de aplicaciones que
sean antiguos, más recientes pero no validados, de versiones preliminares, con
sufijos de compilación o sin versión. El servidor de aplicaciones de Codex debe
informar de una versión estable desde `0.143.0` hasta la
`0.144.6` incluida.

OpenClaw considera remotas las URL de servidores de aplicaciones WebSocket que
no sean de bucle invertido y exige autenticación WebSocket con identidad
mediante `appServer.authToken` o un encabezado `Authorization`.
`appServer.authToken` y cada valor `appServer.headers.*` pueden ser un SecretInput; el
entorno de ejecución de secretos resuelve las SecretRefs y la forma abreviada
de variables de entorno antes de que OpenClaw cree las opciones de inicio del
servidor de aplicaciones, y las SecretRefs estructuradas sin resolver provocan
un fallo antes de que se envíe cualquier token o encabezado. Cuando se
configuran plugins nativos de Codex, OpenClaw utiliza el plano de control de
plugins del servidor de aplicaciones conectado para instalar o actualizar esos
plugins y, después, actualiza el inventario de aplicaciones para que las
aplicaciones pertenecientes a plugins sean visibles para el hilo de Codex.
`app/list` sigue siendo la fuente autoritativa del inventario y los
metadatos, pero la política de OpenClaw decide si `thread/start` envía
`config.apps[appId].enabled = true` para una aplicación accesible incluida en la lista, incluso
si Codex la marca actualmente como deshabilitada. Los identificadores de
aplicación desconocidos o ausentes siguen provocando un fallo seguro; esta ruta
solo activa plugins del marketplace mediante `plugin/install` y actualiza el
inventario. Conecte OpenClaw únicamente a servidores de aplicaciones remotos en
los que se confíe para aceptar instalaciones de plugins administradas por
OpenClaw y actualizaciones del inventario de aplicaciones.

## Modos de aprobación y entorno aislado

Las sesiones locales del servidor de aplicaciones mediante stdio usan de forma
predeterminada el modo YOLO: `approvalPolicy: "never"`, `approvalsReviewer: "user"` y
`sandbox: "danger-full-access"`. Esta postura de operador local de confianza permite que los
turnos y Heartbeat desatendidos de OpenClaw avancen sin solicitudes de
aprobación nativas que nadie esté disponible para responder.

Si el archivo local de requisitos del sistema de Codex no permite valores
implícitos de aprobación YOLO, revisor o entorno aislado, OpenClaw trata el
valor predeterminado implícito como guardian y selecciona los permisos guardian
permitidos. `tools.exec.mode: "auto"` también fuerza las aprobaciones de Codex revisadas
por guardian y no conserva las sustituciones heredadas e inseguras
`approvalPolicy: "never"` o `sandbox: "danger-full-access"`; establezca `tools.exec.mode: "full"` para
adoptar intencionadamente una postura sin aprobaciones. Las entradas
`[[remote_sandbox_config]]` del mismo archivo de requisitos cuyo nombre de host coincida
se respetan al decidir el valor predeterminado del entorno aislado.

Establezca `appServer.mode: "guardian"` para usar aprobaciones de Codex revisadas por
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

El ajuste preestablecido `guardian` se expande a
`approvalPolicy: "on-request"`, `approvalsReviewer: "auto_review"` y `sandbox: "workspace-write"` cuando esos valores
están permitidos. Los campos individuales de la política prevalecen sobre
`mode`. El valor de revisor anterior `guardian_subagent` sigue
aceptándose como alias de compatibilidad, pero las configuraciones nuevas deben
usar `auto_review`.

Cuando hay un entorno aislado de OpenClaw activo, el proceso local del servidor
de aplicaciones de Codex sigue ejecutándose en el host del Gateway. Por tanto,
OpenClaw deshabilita durante ese turno el Modo Código nativo de Codex, los
servidores MCP del usuario y la ejecución de plugins respaldada por aplicaciones,
en lugar de considerar que el aislamiento del host de Codex equivale al backend
del entorno aislado de OpenClaw. El acceso al shell se expone mediante
herramientas dinámicas respaldadas por el entorno aislado de OpenClaw, como
`sandbox_exec` y `sandbox_process`, cuando están disponibles las herramientas
normales de ejecución y procesos.

<Note>
En hosts de entornos aislados de OpenClaw respaldados por Docker
(`agents.defaults.sandbox.mode` establecido en un backend de Docker),
`openclaw doctor` comprueba si el host permite los espacios de nombres de
usuario sin privilegios y, cuando la salida de red del entorno aislado de Docker
está deshabilitada, los espacios de nombres de red que el
`bwrap` anidado de Codex necesita para ejecutar el shell
`workspace-write` dentro del contenedor aislado. Una comprobación fallida suele
manifestarse como `bwrap: setting up uid map: Permission denied` o `bwrap: loopback: Failed RTM_NEWADDR: Operation not permitted` en hosts con
Ubuntu/AppArmor. Corrija la política de espacios de nombres del host indicada
para el usuario del servicio OpenClaw y reinicie el Gateway; prefiera un perfil
de AppArmor limitado al proceso del servicio frente a la alternativa global
del host `kernel.apparmor_restrict_unprivileged_userns=0`, y no conceda privilegios más amplios al contenedor
de Docker únicamente para satisfacer el `bwrap` anidado.
</Note>

## Ejecución nativa en entorno aislado

El valor predeterminado estable es el fallo seguro: el aislamiento activo de
OpenClaw deshabilita las superficies de ejecución nativas de Codex que, de otro
modo, se ejecutarían desde el host del servidor de aplicaciones de Codex. Use
`appServer.experimental.sandboxExecServer: true` solo cuando se quiera probar la compatibilidad de Codex con
entornos remotos mediante el backend del entorno aislado de OpenClaw. Esta ruta
de vista previa funciona con todas las versiones compatibles del servidor de
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
OpenClaw inicia un servidor de ejecución local de bucle invertido respaldado
por el entorno aislado activo, lo registra en el servidor de aplicaciones de
Codex e inicia el hilo y el turno de Codex con ese entorno perteneciente a
OpenClaw. Si el servidor de aplicaciones no puede registrar el entorno, la
ejecución provoca un fallo seguro en lugar de recurrir silenciosamente a la
ejecución en el host.

Esta ruta de vista previa es exclusivamente local. Un servidor de aplicaciones
WebSocket remoto no puede acceder al servidor de ejecución de bucle invertido
a menos que se ejecute en el mismo host, por lo que OpenClaw rechaza esa
combinación.

## Aislamiento de la autenticación y el entorno

En el directorio principal predeterminado de cada agente, la autenticación se
selecciona en este orden:

1. Un perfil explícito de autenticación de Codex de OpenClaw para el agente.
2. La cuenta existente del servidor de aplicaciones en el directorio principal de Codex de ese agente.
3. Solo para inicios locales del servidor de aplicaciones mediante stdio, `CODEX_API_KEY` y después
   `OPENAI_API_KEY`, cuando no haya ninguna cuenta del servidor de aplicaciones y
   todavía se requiera autenticación de OpenAI.

Cuando OpenClaw detecta un perfil de autenticación de Codex del tipo suscripción
de ChatGPT —OAuth o credencial de token—, elimina `CODEX_API_KEY` y
`OPENAI_API_KEY` del proceso hijo de Codex iniciado. Esto mantiene disponibles
las claves de API del Gateway para incrustaciones o modelos directos de OpenAI
sin hacer que los turnos nativos del servidor de aplicaciones de Codex se
facturen accidentalmente mediante la API.

Los perfiles explícitos de clave de API de Codex y la alternativa local de
claves de entorno para stdio utilizan el inicio de sesión del servidor de
aplicaciones en lugar de heredar el entorno del proceso hijo. Las conexiones
WebSocket del servidor de aplicaciones no reciben la alternativa de claves de
API del entorno del Gateway; use un perfil de autenticación explícito o la
cuenta propia del servidor de aplicaciones remoto.

Los inicios del servidor de aplicaciones mediante stdio heredan de forma
predeterminada el entorno del proceso de OpenClaw. OpenClaw es propietario del
puente de cuentas del servidor de aplicaciones de Codex y establece
`CODEX_HOME` en un directorio por agente dentro del estado de OpenClaw de
ese agente. Esto mantiene la configuración, las cuentas, la caché y los datos
de plugins, y el estado de los hilos de Codex limitados al agente de OpenClaw,
en lugar de filtrarlos desde el directorio principal personal
`~/.codex` del operador.

Establezca `appServer.homeScope: "user"` para compartir el estado nativo de Codex con Codex
Desktop y la CLI. Este modo de directorio principal del usuario admite stdio
administrado y transporte Unix explícito. Utiliza `$CODEX_HOME` cuando está
establecido y `~/.codex` en caso contrario, incluida la autenticación,
la configuración, los plugins y los hilos nativos. OpenClaw omite su puente de
perfiles de autenticación para el servidor de aplicaciones. Los turnos de
propietarios verificados pueden usar `codex_threads` para enumerar, con un
filtro opcional `search`, leer, bifurcar, cambiar el nombre, archivar
y desarchivar esos hilos. Bifurque un hilo antes de continuarlo en OpenClaw;
los procesos independientes de Codex no coordinan escritores simultáneos para
el mismo hilo.

Esa habilitación voluntaria `homeScope` se aplica a las sesiones comunes
del arnés. Un Chat creado mediante Codex Sessions utiliza en su lugar su
conexión de supervisión privada, lo que conserva la autenticación y la
configuración del proveedor de la conexión nativa para la rama canónica y las
reanudaciones futuras.

En un Chat supervisado bloqueado a un modelo, `codex_threads` no puede
adjuntar una bifurcación diferente ni archivar el hilo nativo vinculado al
Chat. La enumeración y la lectura exclusiva de metadatos siguen disponibles.
Las lecturas sin procesar de la transcripción requieren `allowRawTranscripts`;
cuando está deshabilitado, también se rechaza la búsqueda en listas porque la
búsqueda nativa puede encontrar coincidencias en las vistas previas de
transcripciones. Cambiar el nombre, desarchivar, realizar una bifurcación
independiente y archivar un hilo no relacionado que no pertenezca a otro Chat
de OpenClaw requieren `allowWriteControls`. Ninguna de las dos opciones elude una
vinculación bloqueada.

OpenClaw no reescribe `HOME` para los inicios locales normales del
servidor de aplicaciones. Los subprocesos ejecutados por Codex, como
`openclaw`, `gh`, `git`, las CLI de servicios
en la nube y los comandos de shell ven el directorio principal normal del
proceso y pueden encontrar la configuración y los tokens del directorio
principal del usuario. Codex también puede detectar `$HOME/.agents/skills` y
`$HOME/.agents/plugins/marketplace.json`; esa detección `.agents` se comparte
intencionadamente con el directorio principal del operador y es independiente
del estado aislado `~/.codex`.

En el ámbito predeterminado del agente, los plugins de OpenClaw y las
instantáneas de Skills de OpenClaw siguen pasando por el registro de plugins y
el cargador de Skills propios de OpenClaw; los recursos personales
`~/.codex` de Codex no. Si existen Skills o plugins útiles de la CLI de
Codex en un directorio principal de Codex que deban pasar a formar parte de un
agente aislado de OpenClaw, inventaríelos explícitamente:

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

`appServer.clearEnv` solo afecta al proceso hijo del servidor de aplicaciones de
Codex iniciado. OpenClaw elimina `CODEX_HOME` y `HOME` de esta
lista durante la normalización del inicio local: `CODEX_HOME` sigue
apuntando al ámbito del agente o usuario seleccionado y `HOME` sigue
heredándose para que los subprocesos puedan usar el estado normal del
directorio principal del usuario.

## Herramientas dinámicas

Las herramientas dinámicas de Codex usan de forma predeterminada la carga
`searchable`, expuesta en el espacio de nombres `openclaw` con
`deferLoading: true`. Normalmente, OpenClaw no expone herramientas dinámicas que
dupliquen las operaciones nativas de Codex en el espacio de trabajo ni la
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
sus herramientas `exec` y `process` filtradas por políticas
como alternativa para el shell. Las listas de elementos permitidos del entorno
de ejecución y `codexDynamicToolsExclude` siguen aplicándose.

La mayoría de las herramientas de integración restantes de OpenClaw, como mensajería, contenido multimedia, cron,
navegador, nodos, gateway, `heartbeat_respond` y `web_search`, están disponibles
mediante la búsqueda de herramientas de Codex bajo ese espacio de nombres. Esto mantiene más reducido el
contexto inicial del modelo. Un pequeño conjunto de herramientas permanece disponible para invocación directa con independencia de
`codexDynamicToolsLoading`, porque la búsqueda de herramientas de Codex puede no estar disponible o
resolver un universo exclusivo de conectores: `agents_list`, `sessions_spawn` y
`sessions_yield`. Las instrucciones para desarrolladores siguen orientando a los subagentes normales de Codex
hacia `spawn_agent` nativo para el trabajo de subagentes nativos de Codex, mientras que
`sessions_spawn` permanece disponible para la delegación explícita de OpenClaw o ACP.
Las respuestas de origen que solo usan herramientas de mensajes también siguen siendo directas, ya que se trata de un
contrato de control de turnos.

Las herramientas marcadas como `catalogMode: "direct-only"`, incluida la herramienta `computer`
de OpenClaw, se agrupan bajo `openclaw_direct`. OpenClaw añade ese espacio de nombres a
la lista `code_mode.direct_only_tool_namespaces` de Codex sin sustituir las
entradas proporcionadas por el operador. Por tanto, Codex expone esas herramientas como
`DirectModelOnly` en los hilos normales y en los exclusivos del modo de código, en lugar de encaminarlas
mediante llamadas anidadas a `tools.*` del modo de código. Este límite es necesario para
los resultados que contienen imágenes: la serialización anidada del modo de código aplana la salida de imagen y la convierte en
texto, lo que descartaría la captura de pantalla necesaria para la siguiente acción en el equipo.

Establezca `codexDynamicToolsLoading: "direct"` únicamente al conectarse a un servidor de aplicaciones
Codex personalizado que no pueda buscar herramientas dinámicas diferidas o al depurar
la carga completa de herramientas.

## Tiempos de espera

Las llamadas a herramientas dinámicas propiedad de OpenClaw se limitan de forma independiente de
`appServer.requestTimeoutMs`. Cada solicitud `item/tool/call` de Codex usa el
primer tiempo de espera disponible en este orden:

- Un argumento `timeoutMs` positivo por llamada.
- Para `image_generate`, `agents.defaults.imageGenerationModel.timeoutMs`.
- Para `image_generate` sin un tiempo de espera configurado, el valor predeterminado de 120 segundos
  para la generación de imágenes.
- Para la herramienta de comprensión multimedia `image`, `tools.media.image.timeoutSeconds`
  convertido a milisegundos, o el valor predeterminado de 60 segundos para contenido multimedia. Para la
  comprensión de imágenes, esto se aplica a la propia solicitud y no se reduce por
  el trabajo de preparación anterior.
- Para la herramienta `message`, un valor predeterminado fijo de 120 segundos.
- El valor predeterminado de 90 segundos para herramientas dinámicas.

Este supervisor constituye el presupuesto externo de `item/tool/call` dinámico. Los tiempos de espera
de solicitud específicos del proveedor se ejecutan dentro de esa llamada y conservan su propia semántica.
Los presupuestos de herramientas dinámicas tienen un límite de 600000 ms. Al agotarse el tiempo de espera, OpenClaw cancela la
señal de la herramienta cuando se admite y devuelve a Codex una respuesta fallida de la herramienta dinámica
para que el turno pueda continuar, en lugar de dejar la sesión en
`processing`.

Después de que Codex acepte un turno y después de que OpenClaw responda a una solicitud
del servidor de aplicaciones limitada al turno, el arnés espera que Codex avance en el turno actual
y termine finalmente el turno nativo con `turn/completed`. Si el
servidor de aplicaciones permanece inactivo durante `appServer.turnCompletionIdleTimeoutMs`, OpenClaw
intenta interrumpir el turno de Codex, registra un tiempo de espera de diagnóstico y
libera la vía de sesión de OpenClaw para que los mensajes de chat posteriores no queden en cola
detrás de un turno nativo obsoleto.

La mayoría de las notificaciones no terminales del mismo turno desactivan ese breve supervisor
porque Codex ha demostrado que el turno sigue activo. Las transferencias de herramientas usan un presupuesto de
inactividad posterior a la herramienta más largo: después de que OpenClaw devuelva una respuesta `item/tool/call`,
después de que finalicen elementos de herramientas nativas como `commandExecution`, después de
finalizaciones `custom_tool_call_output` sin procesar y después del progreso sin procesar del asistente
posterior a una herramienta, de finalizaciones de razonamiento sin procesar o del progreso del razonamiento. La protección usa
`appServer.postToolRawAssistantCompletionIdleTimeoutMs` cuando está configurado y,
de lo contrario, adopta cinco minutos como valor predeterminado. Ese mismo presupuesto posterior a la herramienta también amplía
el supervisor de progreso durante el periodo de síntesis silenciosa antes de que Codex emita el
siguiente evento del turno actual. Las finalizaciones de razonamiento, las finalizaciones
`agentMessage` de comentarios y el progreso de razonamiento o del asistente sin procesar anterior a una herramienta pueden ir seguidos
de una respuesta final automática, por lo que usan la protección de respuesta posterior al progreso
en lugar de liberar inmediatamente la vía de sesión. Solo los elementos `agentMessage`
finales o completados que no sean comentarios y las finalizaciones del asistente sin procesar anteriores a una herramienta activan la
liberación por salida del asistente: si Codex permanece inactivo posteriormente sin `turn/completed`,
OpenClaw intenta interrumpir el turno nativo y libera la vía de
sesión. Los fallos del servidor de aplicaciones stdio que pueden reproducirse de forma segura, incluidos los tiempos de espera
por inactividad al completar el turno sin pruebas del asistente, de herramientas, de elementos activos ni de efectos secundarios, se
reintentan una vez mediante un nuevo intento del servidor de aplicaciones. Los tiempos de espera no seguros siguen retirando el
cliente bloqueado del servidor de aplicaciones y liberan la vía de sesión de OpenClaw. También
eliminan la vinculación obsoleta del hilo nativo en lugar de reproducirla
automáticamente. Los tiempos de espera de supervisión de finalización muestran texto específico de Codex:
los casos que pueden reproducirse de forma segura indican que la respuesta puede estar incompleta, mientras que los casos no seguros indican
al usuario que verifique el estado actual antes de volver a intentarlo. Los diagnósticos públicos de tiempos de espera
incluyen campos estructurales como el último método de notificación del servidor de aplicaciones,
el id/tipo/rol del elemento de respuesta sin procesar del asistente, los recuentos de solicitudes y elementos activos, y
el estado activo de supervisión. Cuando la última notificación es un elemento de respuesta sin procesar
del asistente, también incluyen una vista previa limitada del texto del asistente. No
incluyen el contenido sin procesar del prompt ni de las herramientas.

## Detección de modelos

De forma predeterminada, el Plugin de Codex solicita al servidor de aplicaciones los modelos disponibles. La
disponibilidad de modelos es responsabilidad del servidor de aplicaciones de Codex, por lo que la lista puede cambiar cuando
OpenClaw actualiza la versión incluida de `@openai/codex` o cuando un despliegue
dirige `appServer.command` a otro binario de Codex. La disponibilidad también puede
depender de la cuenta. Use `/codex models` en un gateway en ejecución para consultar el catálogo
activo de ese arnés y esa cuenta.

Si la detección falla o agota el tiempo de espera, OpenClaw usa un catálogo alternativo incluido:

| Id. del modelo       | Nombre para mostrar | Niveles de razonamiento   |
| -------------- | ------------ | ------------------------ |
| `gpt-5.5`      | gpt-5.5      | low, medium, high, xhigh |
| `gpt-5.4-mini` | GPT-5.4-Mini | low, medium, high, xhigh |

<Note>
El arnés incluido actualmente es `@openai/codex` `0.144.6`. Una comprobación `model/list`
del servidor de aplicaciones incluido devolvió estas filas públicas del selector:

| Id. del modelo        | Modalidades de entrada | Niveles de razonamiento               |
| --------------- | ---------------- | ------------------------------------ |
| `gpt-5.6-sol`   | texto, imagen      | low, medium, high, xhigh, max, ultra |
| `gpt-5.6-terra` | texto, imagen      | low, medium, high, xhigh, max, ultra |
| `gpt-5.6-luna`  | texto, imagen      | low, medium, high, xhigh, max        |
| `gpt-5.5`       | texto, imagen      | low, medium, high, xhigh             |
| `gpt-5.4`       | texto, imagen      | low, medium, high, xhigh             |
| `gpt-5.4-mini`  | texto, imagen      | low, medium, high, xhigh             |
| `gpt-5.2`       | texto, imagen      | low, medium, high, xhigh             |

El catálogo del servidor de aplicaciones puede indicar `ultra`; actualmente, los controles de razonamiento de OpenClaw
exponen niveles hasta `max`.

Las filas activas del selector dependen de la cuenta y pueden cambiar con la cuenta, el catálogo de
Codex o la versión incluida; ejecute `/codex models` para obtener la lista actual en lugar
de depender de una tabla correspondiente a un momento concreto. También pueden aparecer modelos ocultos en el
catálogo del servidor de aplicaciones para flujos internos o especializados sin ser opciones
normales del selector de modelos.
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

Desactive la detección cuando desee que el inicio evite comprobar Codex y use únicamente
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

Codex gestiona `AGENTS.md` por sí mismo mediante la detección nativa de documentación del proyecto.
OpenClaw no escribe archivos sintéticos de documentación de proyectos de Codex ni depende de los
nombres de archivo alternativos de Codex para los archivos de identidad, porque las alternativas de Codex solo se aplican cuando
falta `AGENTS.md`.

Para mantener la paridad con el espacio de trabajo de OpenClaw, el arnés de Codex reenvía los demás
archivos de arranque como instrucciones para desarrolladores, pero no de forma idéntica:

- `TOOLS.md` se reenvía como instrucciones para desarrolladores **heredadas** de Codex, por lo que
  los subagentes nativos de Codex generados durante el turno también pueden verlas.
- `SOUL.md`, `IDENTITY.md` y `USER.md` se reenvían como instrucciones de
  colaboración **limitadas al turno**. Los subagentes nativos de Codex no las heredan,
  lo que evita que los turnos de los subagentes adopten la identidad y el
  perfil de usuario del agente principal.
- La lista compacta de Skills cargadas de OpenClaw también se reenvía como
  instrucciones de colaboración para desarrolladores limitadas al turno, por lo que los subagentes nativos de Codex tampoco
  la heredan.
- El contenido de `HEARTBEAT.md` no se inyecta; los turnos de Heartbeat reciben un
  indicador en modo de colaboración para leer el archivo cuando existe y no está
  vacío.
- El contenido de `MEMORY.md` del espacio de trabajo configurado del agente no se pega en
  la entrada de turno nativa de Codex cuando las herramientas de memoria están disponibles para ese
  espacio de trabajo; cuando existe, el arnés añade un pequeño indicador de memoria del espacio de trabajo
  a las instrucciones de colaboración para desarrolladores limitadas al turno, y Codex
  debe usar `memory_search` o `memory_get` cuando la memoria persistente sea relevante.
  Si las herramientas están desactivadas, la búsqueda en memoria no está disponible o el espacio de trabajo
  activo difiere del espacio de trabajo de memoria del agente, `MEMORY.md` usa en su lugar la
  ruta normal limitada del contexto del turno.
- `BOOTSTRAP.md`, cuando está presente, se reenvía como contexto de referencia de entrada
  del turno de OpenClaw.

## Sustituciones de entorno

Las sustituciones de entorno siguen estando disponibles para pruebas locales:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN` omite el binario administrado cuando
`appServer.command` no está establecido.

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` se eliminó. Use
`plugins.entries.codex.config.appServer.mode: "guardian"` en su lugar, o
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` para pruebas locales puntuales. Se prefiere la configuración
para despliegues reproducibles porque mantiene el comportamiento del Plugin en
el mismo archivo revisado que el resto de la configuración del arnés de Codex.

## Temas relacionados

- [Arnés de Codex](/es/plugins/codex-harness)
- [Entorno de ejecución del arnés de Codex](/es/plugins/codex-harness-runtime)
- [Supervisión de Codex](/es/plugins/codex-supervision)
- [Plugins nativos de Codex](/es/plugins/codex-native-plugins)
- [Uso del equipo con Codex](/es/plugins/codex-computer-use)
- [Proveedor de OpenAI](/es/providers/openai)
- [Referencia de configuración](/es/gateway/configuration-reference)
