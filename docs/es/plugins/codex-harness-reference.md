---
read_when:
    - Se necesitan todos los campos de configuración del entorno Codex
    - Está cambiando el comportamiento del transporte, la autenticación, la detección o el tiempo de espera de app-server
    - Se está depurando el inicio del entorno de pruebas de Codex, la detección de modelos o el aislamiento del entorno
summary: Referencia de configuración, autenticación, detección y servidor de aplicaciones para el arnés de Codex
title: Referencia del entorno de Codex
x-i18n:
    generated_at: "2026-07-16T11:45:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 00dd9050fdc9f2c179012285540f49ada8825f29be1d4630742a4d948a5318a1
    source_path: plugins/codex-harness-reference.md
    workflow: 16
---

Esta referencia abarca la configuración detallada del Plugin oficial `codex`.
Para la configuración inicial y las decisiones de enrutamiento, comience por
[entorno de Codex](/es/plugins/codex-harness).

## Superficie de configuración del Plugin

Todos los ajustes del entorno de Codex se encuentran en `plugins.entries.codex.config`.

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
| `appServer`                | servidor de aplicaciones stdio gestionado | Ajustes de transporte, comando, autenticación, aprobación, zona aislada y tiempo de espera. El entorno normal utiliza de forma predeterminada un estado específico del agente.                        |
| `codexDynamicToolsLoading` | `"searchable"`           | Utilice `"direct"` para incluir las herramientas dinámicas de OpenClaw directamente en el contexto inicial de herramientas de Codex.                                                       |
| `codexDynamicToolsExclude` | `[]`                     | Nombres adicionales de herramientas dinámicas de OpenClaw que deben omitirse en los turnos del servidor de aplicaciones de Codex.                                                                    |
| `codexPlugins`             | deshabilitado                 | Compatibilidad nativa de Codex con plugins y aplicaciones, incluido el acceso opcional a aplicaciones de cuentas conectadas. Consulte [Plugins nativos de Codex](/es/plugins/codex-native-plugins). |
| `computerUse`              | deshabilitado                 | Configuración de Uso del ordenador de Codex. Consulte [Uso del ordenador de Codex](/es/plugins/codex-computer-use).                                                               |
| `sessionCatalog`           | habilitado                  | Detección nativa de sesiones de Codex para la barra lateral. Establezca `enabled: false` para deshabilitar la detección sin deshabilitar el proveedor ni el entorno.           |
| `supervision`              | deshabilitado                 | Política de transcripción y control de escritura de sesiones nativas orientada al agente. Consulte [Supervisión de Codex](/es/plugins/codex-supervision).                          |

## Supervisión

De forma predeterminada, la detección de sesiones nativas enumera las sesiones no archivadas de Codex del equipo del Gateway
y de los nodos emparejados que hayan optado por participar. Para deshabilitar únicamente ese catálogo:

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
| `endpoints`           | punto de conexión local integrado | Destinos de punto de conexión avanzados y de compatibilidad para el agente de supervisión de Codex conservado y las herramientas MCP independientes. El catálogo para personas y el flujo de ramas ignoran estos destinos y utilizan el servidor de aplicaciones de supervisión resuelto desde `appServer`.       |
| `allowRawTranscripts` | `false`                 | Con la supervisión habilitada, permite que el agente autónomo o el MCP independiente lean transcripciones y campos de listas derivados de ellas. Las lecturas de `codex_threads` limitadas a metadatos siguen disponibles. No controla la continuación autenticada de la interfaz de control.     |
| `allowWriteControls`  | `false`                 | Con la supervisión habilitada, permite las mutaciones autónomas de bifurcación, cambio de nombre, archivado y desarchivado de `codex_threads`, además de las operaciones independientes de MCP para enviar, dirigir e interrumpir. No elude otras comprobaciones de vinculación, host, estado o confirmación. |

Las entradas de punto de conexión aceptan estos campos:

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

La página **Sesiones de Codex** utiliza el servidor de aplicaciones de supervisión del Plugin y muestra
solo las sesiones no archivadas. Sin ajustes explícitos de conexión de `appServer`,
esa conexión se gestiona mediante stdio en el directorio personal del usuario. Las filas locales almacenadas o inactivas pueden crear
un chat bloqueado a un modelo con un historial acotado del usuario y del asistente hasta el último
turno de origen persistido en el terminal. Su vinculación privada mantiene la bifurcación de la instantánea,
la rama canónica de origen `appServer`, la inyección del historial y los turnos posteriores en esa
conexión. El primer inicio canónico utiliza el par devuelto por la bifurcación. Las
reanudaciones posteriores omiten las sustituciones del modelo y el proveedor de OpenClaw para que Codex restaure el
par persistido del hilo canónico; un cambio nativo independiente puede actualizar ese
par, pero el modelo externo y la cadena de alternativas nunca lo sustituyen. Las filas almacenadas e inactivas
pueden archivarse tras confirmar que no hay ningún otro ejecutor, salvo que otra vinculación activa de
OpenClaw sea propietaria del destino exacto o de alguno de sus descendientes generados
y no archivados. OpenClaw sigue la paginación de descendientes de Codex y adopta un cierre seguro ante
errores de enumeración, ciclos o agotamiento del límite de seguridad. La confirmación sigue
cubriendo los clientes nativos desconocidos y la condición de carrera entre el estado y el archivado. Un
chat supervisado y bloqueado a un modelo no puede eliminarse mientras proteja la vinculación nativa.
Las fuentes activas no pueden crear una rama ni archivarse, pero todavía se puede abrir un chat
supervisado existente. Todas las filas de nodos emparejados permanecen en modo de solo lectura; el transporte del nodo
aún no proporciona el ciclo de vida de transmisión necesario para el entorno.

`appServer.homeScope: "user"` solo cambia qué directorio personal de Codex utiliza un proceso
de entorno gestionado; no publica el catálogo de la flota. Habilitar la supervisión no
cambia el valor predeterminado del entorno. En su lugar, la conexión de supervisión independiente
utiliza de forma predeterminada stdio gestionado en el directorio personal del usuario cuando no existen ajustes explícitos de conexión
de `appServer`. Los ajustes explícitos se respetan para esa conexión.
Las vinculaciones supervisadas pendientes y confirmadas conservan esa conexión en cada turno;
la supervisión deshabilitada o las desviaciones de la conexión o del ciclo de vida provocan un cierre seguro en lugar de
recurrir al entorno del directorio personal del agente. La conexión predeterminada comparte las sesiones almacenadas
con los clientes nativos de Codex, no su estado de actividad local del proceso.

Los ajustes heredados de `plugins.entries.codex-supervisor` están retirados. Ejecute
`openclaw doctor --fix` para migrar la entrada antigua, las definiciones de puntos de conexión, los indicadores de
política y las referencias de autorización o denegación del Plugin a este bloque. Los valores canónicos explícitos de
`codex.config.supervision` prevalecen en caso de conflicto.

## Transporte del servidor de aplicaciones

Para los turnos normales del entorno, OpenClaw inicia el binario gestionado de Codex incluido
con el Plugin oficial (actualmente `@openai/codex` `0.144.3`):

```bash
codex app-server --listen stdio://
```

Esto mantiene la versión del servidor de aplicaciones vinculada al Plugin oficial `codex` en lugar de
a cualquier CLI de Codex independiente que esté instalada localmente. Establezca
`appServer.command` solo cuando se quiera utilizar deliberadamente otro ejecutable.
Los turnos gestionados normales con el directorio personal aislado predeterminado del agente prefieren este
paquete fijado incluso cuando hay instalado un paquete de aplicación de escritorio de macOS. Cuando
[Uso del ordenador](/es/plugins/codex-computer-use) está habilitado, o cuando `homeScope` es
`"user"` y puede cargar el estado nativo de Uso del ordenador, el inicio gestionado prefiere en su lugar
el binario de la aplicación de escritorio que posee los permisos necesarios de macOS. La misma
regla de prioridad para el escritorio se aplica cuando la configuración efectiva de Codex del directorio personal aislado de un agente
habilita el Uso del ordenador nativo. Si no hay instalado ningún paquete de aplicación de escritorio, OpenClaw
recurre al binario del paquete fijado.

La transferencia del ejecutable y el aislamiento de la configuración nativa coordinan los clientes dentro de un
único proceso del Gateway en ejecución. Reinicie el Gateway después de que otro proceso cambie la
configuración nativa del Plugin de Codex.

La supervisión resuelve una conexión independiente. Sin ajustes explícitos de conexión
de `appServer`, utiliza stdio gestionado con `homeScope: "user"`;
el entorno normal continúa usando stdio gestionado con `homeScope: "agent"`. Ambos flujos respetan
los ajustes explícitos de conexión. Establezca `homeScope: "user"`
explícitamente cuando el entorno normal deba compartir `$CODEX_HOME` (o `~/.codex`)
con los clientes nativos. Una vinculación supervisada privada utiliza la conexión de supervisión
independientemente del valor predeterminado del entorno normal. Los procesos independientes del servidor de aplicaciones
mantienen estados de actividad y aprobación separados.

Para un servidor de aplicaciones que ya está en ejecución, utilice el transporte WebSocket:

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

| Campo                                         | Valor predeterminado                                    | Significado                                                                                                                                                                                                                                                                                                                                                                                         |
| --------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                                   | `"stdio"`                                              | `"stdio"` inicia Codex; el valor explícito `"unix"` se conecta al socket de control local; `"websocket"` se conecta a `url`.                                                                                                                                                                                                                                                                                |
| `homeScope`                                   | `"agent"`                                              | `"agent"` aísla el estado habitual del arnés para cada agente de OpenClaw. `"user"` es una habilitación voluntaria explícita que comparte el `$CODEX_HOME` o `~/.codex` nativo, utiliza la autenticación nativa y habilita la gestión de hilos solo para el propietario. El ámbito de usuario admite stdio local o transporte Unix. Para la conexión de supervisión independiente, un valor sin definir se resuelve como `"user"` para stdio o Unix y como `"agent"` para WebSocket.     |
| `command`                                     | binario administrado de Codex                           | Ejecutable para el transporte stdio. Déjelo sin definir para usar el binario administrado.                                                                                                                                                                                                                                                                                                                          |
| `args`                                        | `["app-server", "--listen", "stdio://"]`               | Argumentos para el transporte stdio.                                                                                                                                                                                                                                                                                                                                                                  |
| `url`                                         | sin definir                                             | URL del servidor de aplicaciones WebSocket o URL `unix://`. Una ruta Unix explícita vacía selecciona el socket de control canónico del directorio personal del usuario.                                                                                                                                                                                                                                                                          |
| `authToken`                                   | sin definir                                             | Token de portador para el transporte WebSocket. Acepta una cadena literal o SecretInput, como `${CODEX_APP_SERVER_TOKEN}`.                                                                                                                                                                                                                                                                              |
| `headers`                                     | `{}`                                                   | Cabeceras WebSocket adicionales. Los valores de las cabeceras aceptan cadenas literales o valores SecretInput; por ejemplo, `x-codex-client-session-token: "${CODEX_CLIENT_SESSION_TOKEN}"`.                                                                                                                                                                                                                               |
| `clearEnv`                                    | `[]`                                                   | Nombres de variables de entorno adicionales que se eliminan del proceso app-server stdio iniciado después de que OpenClaw construya su entorno heredado.                                                                                                                                                                                                                                                             |
| `remoteWorkspaceRoot`                         | sin definir                                             | Raíz remota del espacio de trabajo del app-server de Codex. Cuando se establece, OpenClaw infiere la raíz local del espacio de trabajo a partir del espacio de trabajo resuelto de OpenClaw, conserva el sufijo del cwd actual bajo esta raíz remota y envía a Codex únicamente el cwd final del app-server. Si el cwd está fuera de la raíz resuelta del espacio de trabajo de OpenClaw, OpenClaw aplica un cierre seguro en lugar de enviar una ruta local del Gateway al app-server remoto. |
| `loopDetectionPreToolUseRelay`                | `true`                                                 | Instala el subproceso `PreToolUse` de Codex que se utiliza únicamente para la detección de bucles de OpenClaw y su marcador explícito de ausencia de política. Establezca `false` para reducir la distribución de procesos por herramienta. Los hooks de Plugin anteriores a la herramienta y la política de herramientas de confianza siguen instalando el relé necesario.                                                                                                                                         |
| `requestTimeoutMs`                            | `60000`                                                | Tiempo de espera para las llamadas del plano de control del app-server.                                                                                                                                                                                                                                                                                                                                                     |
| `turnCompletionIdleTimeoutMs`                 | `60000`                                                | Intervalo de inactividad después de que Codex acepte un turno o después de una solicitud al app-server limitada a un turno mientras OpenClaw espera `turn/completed`.                                                                                                                                                                                                                                                                    |
| `postToolRawAssistantCompletionIdleTimeoutMs` | `300000`                                               | Protección de inactividad al completar y de progreso que se utiliza después de una transferencia a una herramienta, la finalización de una herramienta nativa, el progreso posterior a la herramienta del asistente sin procesar, la finalización del razonamiento sin procesar o el progreso del razonamiento mientras OpenClaw espera `turn/completed`. Utilícela para cargas de trabajo de confianza o intensivas en las que la síntesis posterior a la herramienta pueda permanecer en silencio legítimamente durante más tiempo que el límite de publicación final del asistente.                                |
| `mode`                                        | `"yolo"` salvo que los requisitos locales de Codex no permitan YOLO | Configuración predefinida para la ejecución YOLO o revisada por el guardián.                                                                                                                                                                                                                                                                                                                                                 |
| `approvalPolicy`                              | `"never"` o una política de aprobación permitida por el guardián       | Política de aprobación nativa de Codex que se envía al iniciar y reanudar el hilo, y en cada turno.                                                                                                                                                                                                                                                                                                                            |
| `sandbox`                                     | `"danger-full-access"` o un sandbox permitido por el guardián  | Modo de sandbox nativo de Codex que se envía al iniciar y reanudar el hilo. Los sandboxes activos de OpenClaw restringen los turnos `danger-full-access` a `workspace-write` de Codex; el indicador de red del turno sigue la salida de red del sandbox de OpenClaw.                                                                                                                                                                                       |
| `approvalsReviewer`                           | `"user"` o un revisor permitido por el guardián               | Utilice `"auto_review"` para permitir que Codex revise las solicitudes de aprobación nativas cuando esté permitido.                                                                                                                                                                                                                                                                                                                   |
| `defaultWorkspaceDir`                         | directorio del proceso actual                            | Espacio de trabajo utilizado por `/codex bind` cuando se omite `--cwd`.                                                                                                                                                                                                                                                                                                                                        |
| `serviceTier`                                 | sin definir                                             | Nivel de servicio opcional del app-server de Codex. `"priority"` habilita el enrutamiento en modo rápido, `"flex"` solicita el procesamiento flexible y `null` elimina la anulación. El valor heredado `"fast"` se acepta como `"priority"`.                                                                                                                                                                                                 |
| `networkProxy`                                | deshabilitado                                           | Habilita voluntariamente la red del perfil de permisos de Codex para los comandos del app-server. OpenClaw define la configuración `permissions.<profile>.network` seleccionada y la elige con `default_permissions` en lugar de enviar `sandbox`.                                                                                                                                                                             |
| `experimental.sandboxExecServer`              | `false`                                                | Habilitación voluntaria de vista previa que registra un entorno de Codex respaldado por el sandbox de OpenClaw en el app-server compatible de Codex, para que la ejecución nativa de Codex pueda realizarse dentro del sandbox activo de OpenClaw.                                                                                                                                                                                                            |

`appServer.networkProxy` es explícito porque cambia el contrato del entorno aislado de Codex. Cuando se habilita, OpenClaw también establece `features.network_proxy.enabled` y
`default_permissions` en la configuración del hilo de Codex para que el perfil de permisos generado pueda iniciar la red administrada por Codex. De forma predeterminada, OpenClaw genera un nombre de perfil `openclaw-network-<fingerprint>` resistente a colisiones a partir del cuerpo del perfil; use `profileName` solo cuando se requiera un nombre local estable.

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

Si el entorno de ejecución normal del servidor de aplicaciones fuera `danger-full-access`, habilitar
`networkProxy` usa en su lugar acceso al sistema de archivos al estilo del espacio de trabajo para el perfil de permisos generado. La aplicación de restricciones de red administrada por Codex es una red aislada, por lo que un perfil de acceso completo no protegería el tráfico saliente.

El plugin bloquea los handshakes antiguos o sin versión del servidor de aplicaciones: el servidor de aplicaciones de Codex debe informar de la versión estable `0.143.0` o una posterior.

OpenClaw trata las URL WebSocket del servidor de aplicaciones que no son de bucle invertido como remotas y requiere autenticación WebSocket con identidad mediante `appServer.authToken` o una cabecera
`Authorization`. `appServer.authToken` y cada valor de `appServer.headers.*`
pueden ser un SecretInput; el entorno de ejecución de secretos resuelve las SecretRefs y la forma abreviada de variables de entorno antes de que OpenClaw cree las opciones de inicio del servidor de aplicaciones, y las SecretRefs estructuradas sin resolver provocan un error antes de que se envíe cualquier token o cabecera. Cuando se configuran plugins nativos de Codex, OpenClaw usa el plano de control de plugins del servidor de aplicaciones conectado para instalar o actualizar esos plugins y, a continuación, actualiza el inventario de aplicaciones para que las aplicaciones propiedad de plugins sean visibles para el hilo de Codex. `app/list` sigue siendo la fuente autoritativa de inventario y metadatos, pero la política de OpenClaw decide si `thread/start` envía `config.apps[appId].enabled = true` para una aplicación accesible incluida en la lista, incluso si Codex la marca actualmente como deshabilitada. Los identificadores de aplicación desconocidos o ausentes siguen generando un error de forma predeterminada; esta ruta solo activa plugins del marketplace mediante `plugin/install` y actualiza el inventario. Conecte OpenClaw únicamente a servidores de aplicaciones remotos en los que se confíe para aceptar instalaciones de plugins administradas por OpenClaw y actualizaciones del inventario de aplicaciones.

## Modos de aprobación y entorno aislado

Las sesiones locales del servidor de aplicaciones mediante entrada/salida estándar usan de forma predeterminada el modo YOLO:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` y
`sandbox: "danger-full-access"`. Esta postura de operador local de confianza permite que los turnos desatendidos y los Heartbeat de OpenClaw avancen sin solicitudes de aprobación nativas que nadie está disponible para responder.

Si el archivo local de requisitos del sistema de Codex no permite valores implícitos de aprobación YOLO, revisor o entorno aislado, OpenClaw trata en su lugar el valor predeterminado implícito como guardián y selecciona permisos de guardián permitidos. `tools.exec.mode: "auto"`
también obliga a que las aprobaciones de Codex sean revisadas por un guardián y no conserva las sustituciones heredadas inseguras `approvalPolicy: "never"` ni `sandbox: "danger-full-access"`;
establezca `tools.exec.mode: "full"` para adoptar de forma intencionada una postura sin aprobación.
Las entradas `[[remote_sandbox_config]]` del mismo archivo de requisitos cuyo nombre de host coincida se respetan para decidir el valor predeterminado del entorno aislado.

Establezca `appServer.mode: "guardian"` para las aprobaciones de Codex revisadas por un guardián:

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
`approvalsReviewer: "auto_review"` y `sandbox: "workspace-write"` cuando esos valores están permitidos. Los campos de política individuales sustituyen `mode`. El valor de revisor anterior
`guardian_subagent` todavía se acepta como alias de compatibilidad, pero las configuraciones nuevas deben usar `auto_review`.

Cuando hay un entorno aislado de OpenClaw activo, el proceso local del servidor de aplicaciones de Codex sigue ejecutándose en el host del Gateway. Por lo tanto, OpenClaw deshabilita para ese turno el modo de código nativo de Codex, los servidores MCP del usuario y la ejecución de plugins respaldada por aplicaciones, en lugar de tratar el aislamiento de Codex en el host como equivalente al backend de entorno aislado de OpenClaw. El acceso al shell se expone mediante herramientas dinámicas respaldadas por el entorno aislado de OpenClaw, como `sandbox_exec` y `sandbox_process`, cuando están disponibles las herramientas normales de ejecución y procesos.

<Note>
En hosts con entorno aislado de OpenClaw respaldado por Docker (`agents.defaults.sandbox.mode` establecido en un backend de Docker), `openclaw doctor` comprueba si el host permite los espacios de nombres de usuario sin privilegios (y, cuando la salida de red del entorno aislado de Docker está deshabilitada, los espacios de nombres de red) que el `bwrap` anidado de Codex necesita para ejecutar el shell `workspace-write` dentro del contenedor aislado. Una comprobación fallida suele manifestarse como `bwrap: setting up uid map: Permission denied` o
`bwrap: loopback: Failed RTM_NEWADDR: Operation not permitted` en hosts Ubuntu/AppArmor. Corrija la política de espacios de nombres del host indicada para el usuario del servicio OpenClaw y reinicie el Gateway; prefiera un perfil de AppArmor específico para el proceso del servicio en lugar de la alternativa para todo el host
`kernel.apparmor_restrict_unprivileged_userns=0`, y no conceda privilegios más amplios al contenedor de Docker solo para satisfacer el `bwrap` anidado.
</Note>

## Ejecución nativa en entorno aislado

El valor predeterminado estable es generar un error de forma predeterminada: el aislamiento activo de OpenClaw deshabilita las superficies de ejecución nativas de Codex que, de otro modo, se ejecutarían desde el host del servidor de aplicaciones de Codex. Use `appServer.experimental.sandboxExecServer: true` solo cuando quiera probar la compatibilidad de Codex con entornos remotos junto con el backend de entorno aislado de OpenClaw.
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

Cuando la marca está activada y la sesión actual de OpenClaw está aislada, OpenClaw inicia un servidor de ejecución local de bucle invertido respaldado por el entorno aislado activo, lo registra en el servidor de aplicaciones de Codex e inicia el hilo y el turno de Codex con ese entorno propiedad de OpenClaw. Si el servidor de aplicaciones no puede registrar el entorno, la ejecución genera un error en lugar de volver silenciosamente a la ejecución en el host.

Esta ruta preliminar es solo local. Un servidor de aplicaciones WebSocket remoto no puede acceder al servidor de ejecución de bucle invertido a menos que se ejecute en el mismo host, por lo que OpenClaw rechaza esa combinación.

## Aislamiento de autenticación y entorno

En el directorio personal predeterminado por agente, la autenticación se selecciona en este orden:

1. Un perfil explícito de autenticación de Codex de OpenClaw para el agente.
2. La cuenta existente del servidor de aplicaciones en el directorio personal de Codex de ese agente.
3. Solo para inicios locales del servidor de aplicaciones mediante entrada/salida estándar, `CODEX_API_KEY` y, a continuación,
   `OPENAI_API_KEY`, cuando no hay ninguna cuenta del servidor de aplicaciones y todavía se requiere autenticación de OpenAI.

Cuando OpenClaw detecta un perfil de autenticación de Codex del tipo suscripción de ChatGPT (tipo de credencial OAuth o token), elimina `CODEX_API_KEY` y `OPENAI_API_KEY` del proceso secundario de Codex iniciado. Esto mantiene disponibles las claves de API del Gateway para incrustaciones o modelos directos de OpenAI sin hacer que los turnos nativos del servidor de aplicaciones de Codex se facturen accidentalmente mediante la API.

Los perfiles explícitos de clave de API de Codex y la alternativa de clave de entorno para entrada/salida estándar local usan el inicio de sesión del servidor de aplicaciones en lugar del entorno heredado del proceso secundario. Las conexiones WebSocket del servidor de aplicaciones no reciben la alternativa de clave de API del entorno del Gateway; use un perfil de autenticación explícito o la cuenta propia del servidor de aplicaciones remoto.

Los inicios del servidor de aplicaciones mediante entrada/salida estándar heredan de forma predeterminada el entorno del proceso de OpenClaw.
OpenClaw controla el puente de cuentas del servidor de aplicaciones de Codex y establece `CODEX_HOME` en un directorio por agente dentro del estado de OpenClaw de ese agente. Esto mantiene la configuración, las cuentas, la caché y los datos de plugins y el estado de los hilos de Codex limitados al agente de OpenClaw, en lugar de filtrarlos desde el directorio personal `~/.codex` del operador.

Establezca `appServer.homeScope: "user"` para compartir el estado nativo de Codex con Codex Desktop y la CLI. Este modo de directorio personal del usuario admite entrada/salida estándar administrada y transporte Unix explícito. Usa `$CODEX_HOME` cuando está establecido y `~/.codex` en caso contrario, incluida la autenticación nativa, la configuración, los plugins y los hilos.
OpenClaw omite su puente de perfiles de autenticación para el servidor de aplicaciones. Los turnos verificados del propietario pueden usar `codex_threads` para enumerar (con un filtro `search` opcional), leer, bifurcar, cambiar el nombre, archivar y desarchivar esos hilos. Bifurque un hilo antes de continuarlo en OpenClaw; los procesos independientes de Codex no coordinan escritores simultáneos para el mismo hilo.

Esa habilitación explícita `homeScope` se aplica a las sesiones ordinarias del entorno de ejecución. Un Chat creado mediante Codex Sessions usa en su lugar su conexión de supervisión privada, que conserva la configuración de autenticación y proveedor de la conexión nativa para la rama canónica y las reanudaciones futuras.

En un Chat supervisado y bloqueado a un modelo, `codex_threads` no puede adjuntar una bifurcación diferente ni archivar el hilo nativo vinculado al Chat. La enumeración y la lectura exclusiva de metadatos siguen estando disponibles. Las lecturas de transcripciones sin procesar requieren `allowRawTranscripts`; cuando está deshabilitado, también se rechaza la búsqueda en la lista porque la búsqueda nativa puede coincidir con vistas previas de transcripciones. Cambiar el nombre, desarchivar, realizar una bifurcación desvinculada y archivar un hilo no relacionado que no pertenezca a otro Chat de OpenClaw requiere
`allowWriteControls`. Ninguna opción elude una vinculación bloqueada.

OpenClaw no reescribe `HOME` para los inicios locales normales del servidor de aplicaciones.
Los subprocesos ejecutados por Codex, como `openclaw`, `gh`, `git`, las CLI de la nube y los comandos de shell ven el directorio personal normal del proceso y pueden encontrar la configuración y los tokens del directorio personal del usuario. Codex también puede detectar `$HOME/.agents/skills` y
`$HOME/.agents/plugins/marketplace.json`; esa detección de `.agents` se comparte intencionadamente con el directorio personal del operador y es independiente del estado aislado
`~/.codex`.

En el ámbito predeterminado del agente, los plugins de OpenClaw y las instantáneas de Skills de OpenClaw siguen pasando por el registro de plugins y el cargador de Skills propios de OpenClaw; los recursos personales `~/.codex` de Codex no. Si hay Skills o plugins útiles de la CLI de Codex en un directorio personal de Codex que deban pasar a formar parte de un agente aislado de OpenClaw, inventaríelos explícitamente:

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

Si una implementación necesita aislamiento adicional del entorno, añada esas variables a `appServer.clearEnv`:

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

`appServer.clearEnv` solo afecta al proceso secundario del servidor de aplicaciones de Codex iniciado.
OpenClaw elimina `CODEX_HOME` y `HOME` de esta lista durante la normalización del inicio local: `CODEX_HOME` sigue apuntando al ámbito seleccionado del agente o usuario, y `HOME` se sigue heredando para que los subprocesos puedan usar el estado normal del directorio personal del usuario.

## Herramientas dinámicas

Las herramientas dinámicas de Codex usan de forma predeterminada la carga `searchable`, expuesta en el espacio de nombres
`openclaw` con `deferLoading: true`. Normalmente, OpenClaw no expone herramientas dinámicas que dupliquen las operaciones nativas de Codex sobre el espacio de trabajo o la propia superficie de búsqueda de herramientas de Codex:

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

Cuando una lista finita de elementos permitidos del entorno de ejecución deshabilita el modo de código nativo, OpenClaw envía una selección vacía del entorno de ejecución. En ese caso directo y sin aislamiento, OpenClaw mantiene sus herramientas `exec` y `process`, filtradas por políticas, como alternativa de shell. Las listas de elementos permitidos del entorno de ejecución y `codexDynamicToolsExclude` siguen siendo aplicables.

La mayoría de las herramientas de integración restantes de OpenClaw, como mensajería, contenido multimedia, cron,
navegador, nodos, gateway, `heartbeat_respond` y `web_search`, están disponibles
mediante la búsqueda de herramientas de Codex bajo ese espacio de nombres. Esto mantiene más reducido el contexto
inicial del modelo. Un pequeño conjunto de herramientas permanece disponible para invocación directa independientemente de
`codexDynamicToolsLoading`, porque la búsqueda de herramientas de Codex puede no estar disponible o
resolver un universo compuesto únicamente por conectores: `agents_list`, `sessions_spawn` y
`sessions_yield`. Las instrucciones para desarrolladores siguen orientando a los subagentes normales de Codex
hacia el `spawn_agent` nativo para el trabajo de subagentes nativos de Codex, mientras que
`sessions_spawn` permanece disponible para la delegación explícita de OpenClaw o ACP.
Las respuestas de origen que solo usan herramientas de mensajes también permanecen directas, ya que este es un
contrato de control de turnos.

Las herramientas marcadas como `catalogMode: "direct-only"`, incluida la herramienta `computer` de
OpenClaw, se agrupan bajo `openclaw_direct`. OpenClaw añade ese espacio de nombres a
la lista `code_mode.direct_only_tool_namespaces` de Codex sin reemplazar
las entradas proporcionadas por el operador. Por tanto, Codex expone esas herramientas como
`DirectModelOnly` en hilos normales y exclusivos del modo de código, en lugar de dirigirlas
mediante llamadas anidadas `tools.*` del modo de código. Este límite es necesario para
los resultados que contienen imágenes: la serialización anidada del modo de código convierte la salida de imagen en
texto, lo que descartaría la captura de pantalla necesaria para la siguiente acción en el equipo.

Establezca `codexDynamicToolsLoading: "direct"` únicamente al conectarse a un servidor de aplicaciones
Codex personalizado que no pueda buscar herramientas dinámicas diferidas o al depurar
la carga completa de herramientas.

## Tiempos de espera

Las llamadas a herramientas dinámicas propiedad de OpenClaw están limitadas de forma independiente de
`appServer.requestTimeoutMs`. Cada solicitud `item/tool/call` de Codex utiliza el
primer tiempo de espera disponible en este orden:

- Un argumento positivo `timeoutMs` por llamada.
- Para `image_generate`, `agents.defaults.imageGenerationModel.timeoutMs`.
- Para `image_generate` sin un tiempo de espera configurado, el valor predeterminado de 120 segundos
  para la generación de imágenes.
- Para la herramienta de comprensión multimedia `image`, `tools.media.image.timeoutSeconds`
  convertido a milisegundos, o el valor predeterminado de 60 segundos para contenido multimedia. Para la
  comprensión de imágenes, esto se aplica a la solicitud en sí y no se reduce debido al
  trabajo de preparación anterior.
- Para la herramienta `message`, un valor predeterminado fijo de 120 segundos.
- El valor predeterminado de 90 segundos para herramientas dinámicas.

Este mecanismo de vigilancia constituye el presupuesto `item/tool/call` dinámico externo. Los tiempos de espera
de solicitudes específicos del proveedor se ejecutan dentro de esa llamada y conservan su propia semántica de tiempo de espera.
Los presupuestos de herramientas dinámicas tienen un límite de 600000 ms. Cuando se agota el tiempo de espera, OpenClaw cancela la
señal de la herramienta cuando se admite y devuelve a Codex una respuesta fallida de la herramienta dinámica
para que el turno pueda continuar en lugar de dejar la sesión en
`processing`.

Después de que Codex acepte un turno y después de que OpenClaw responda a una solicitud del
servidor de aplicaciones limitada al turno, el entorno de ejecución espera que Codex progrese en el turno actual
y que finalmente termine el turno nativo con `turn/completed`. Si el
servidor de aplicaciones permanece inactivo durante `appServer.turnCompletionIdleTimeoutMs`, OpenClaw
intenta interrumpir el turno de Codex, registra un tiempo de espera de diagnóstico y
libera el canal de sesión de OpenClaw para que los mensajes de chat posteriores no queden en cola
detrás de un turno nativo obsoleto.

La mayoría de las notificaciones no terminales del mismo turno desactivan este breve mecanismo de vigilancia
porque Codex ha demostrado que el turno sigue activo. Las transferencias de herramientas utilizan un presupuesto de
inactividad posterior a la herramienta más largo: después de que OpenClaw devuelve una respuesta `item/tool/call`,
después de que se completan elementos de herramientas nativas como `commandExecution`, después de las finalizaciones
`custom_tool_call_output` sin procesar y después del progreso del asistente sin procesar
posterior a la herramienta, las finalizaciones de razonamiento sin procesar o el progreso de razonamiento. El mecanismo de protección utiliza
`appServer.postToolRawAssistantCompletionIdleTimeoutMs` cuando está configurado y
adopta cinco minutos de forma predeterminada en caso contrario. Ese mismo presupuesto posterior a la herramienta también amplía
el mecanismo de vigilancia de progreso durante el intervalo de síntesis silencioso antes de que Codex emita el
siguiente evento del turno actual. Las finalizaciones de razonamiento, las finalizaciones `agentMessage`
de comentarios y el progreso de razonamiento o del asistente sin procesar anterior a la herramienta pueden ir seguidos
de una respuesta final automática, por lo que utilizan el mecanismo de protección de respuesta posterior al progreso
en lugar de liberar inmediatamente el canal de sesión. Solo los elementos `agentMessage` completados
finales o que no sean comentarios y las finalizaciones del asistente sin procesar anteriores a la herramienta activan la
liberación de salida del asistente: si Codex permanece después inactivo sin `turn/completed`,
OpenClaw intenta interrumpir el turno nativo y libera el canal de
sesión. Los fallos del servidor de aplicaciones mediante stdio que pueden repetirse de forma segura, incluidos los tiempos de espera
por inactividad al completar el turno sin pruebas del asistente, de herramientas, de elementos activos o de efectos secundarios, se
reintentan una vez en un nuevo intento del servidor de aplicaciones. Los tiempos de espera no seguros también retiran el
cliente del servidor de aplicaciones bloqueado y liberan el canal de sesión de OpenClaw. Asimismo,
eliminan la vinculación obsoleta del hilo nativo en lugar de volver a ejecutarse
automáticamente. Los tiempos de espera de vigilancia de finalización muestran texto de tiempo de espera específico de Codex:
los casos que pueden repetirse de forma segura indican que la respuesta puede estar incompleta, mientras que los casos no seguros indican
al usuario que verifique el estado actual antes de volver a intentarlo. Los diagnósticos públicos de tiempos de espera
incluyen campos estructurales como el último método de notificación del servidor de aplicaciones,
el id/tipo/rol del elemento de respuesta sin procesar del asistente, los recuentos de solicitudes/elementos activos y
el estado de vigilancia activado. Cuando la última notificación es un elemento de respuesta sin procesar
del asistente, también incluyen una vista previa limitada del texto del asistente. No
incluyen el contenido sin procesar de solicitudes ni herramientas.

## Detección de modelos

De forma predeterminada, el Plugin de Codex solicita al servidor de aplicaciones los modelos disponibles. La
disponibilidad de modelos es propiedad del servidor de aplicaciones Codex, por lo que la lista puede cambiar cuando
OpenClaw actualiza la versión `@openai/codex` incluida o cuando una implementación
dirige `appServer.command` a un binario de Codex diferente. La disponibilidad también
puede depender de la cuenta. Use `/codex models` en un gateway en ejecución para consultar el
catálogo activo de ese entorno de ejecución y esa cuenta.

Si la detección falla o agota el tiempo de espera, OpenClaw utiliza un catálogo alternativo incluido:

| Id. del modelo       | Nombre para mostrar | Niveles de razonamiento        |
| -------------- | ------------ | ------------------------ |
| `gpt-5.5`      | gpt-5.5      | bajo, medio, alto, muy alto |
| `gpt-5.4-mini` | GPT-5.4-Mini | bajo, medio, alto, muy alto |

<Note>
El entorno de ejecución incluido actualmente es `@openai/codex` `0.144.3`. Una consulta `model/list`
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

El catálogo del servidor de aplicaciones puede indicar `ultra`; los controles de razonamiento de OpenClaw
exponen actualmente niveles hasta `max`.

Las filas activas del selector dependen de la cuenta y pueden cambiar según la cuenta, el catálogo de Codex
o la versión incluida; ejecute `/codex models` para obtener la lista actual en lugar de
depender de una tabla correspondiente a un momento concreto. También pueden aparecer modelos ocultos en el
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

Desactive la detección cuando se quiera evitar que el inicio consulte Codex y utilizar únicamente
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
OpenClaw no escribe archivos sintéticos de documentación del proyecto de Codex ni depende de los
nombres de archivo alternativos de Codex para los archivos de personalidad, porque las alternativas de Codex solo se aplican cuando
falta `AGENTS.md`.

Para mantener la paridad del espacio de trabajo de OpenClaw, el entorno de ejecución de Codex reenvía los demás
archivos de arranque como instrucciones para desarrolladores, pero no de forma idéntica:

- `TOOLS.md` se reenvía como instrucciones para desarrolladores **heredadas** de Codex, de modo que
  los subagentes nativos de Codex generados durante el turno también las reciben.
- `SOUL.md`, `IDENTITY.md` y `USER.md` se reenvían como instrucciones de
  colaboración **limitadas al turno**. Los subagentes nativos de Codex no las heredan,
  lo que evita que sus turnos adopten la personalidad y el
  perfil de usuario del agente principal.
- La lista compacta de Skills de OpenClaw cargadas también se reenvía como instrucciones para desarrolladores
  de colaboración limitadas al turno, por lo que los subagentes nativos de Codex tampoco
  la heredan.
- El contenido de `HEARTBEAT.md` no se inyecta; los turnos de Heartbeat reciben un
  indicador en modo de colaboración para leer el archivo cuando existe y no está
  vacío.
- El contenido de `MEMORY.md` del espacio de trabajo configurado del agente no se pega en
  la entrada del turno nativo de Codex cuando las herramientas de memoria están disponibles para ese
  espacio de trabajo; cuando existe, el entorno de ejecución añade un pequeño indicador de memoria del espacio de trabajo
  a las instrucciones para desarrolladores de colaboración limitadas al turno, y Codex
  debe usar `memory_search` o `memory_get` cuando la memoria persistente sea pertinente.
  Si las herramientas están desactivadas, la búsqueda de memoria no está disponible o el espacio de trabajo
  activo difiere del espacio de trabajo de memoria del agente, `MEMORY.md` utiliza la
  ruta normal de contexto de turno limitado.
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
`appServer.command` no está establecido.

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` se eliminó. Use
`plugins.entries.codex.config.appServer.mode: "guardian"` en su lugar, o
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` para pruebas locales puntuales. Se prefiere la configuración
para implementaciones reproducibles porque mantiene el comportamiento del Plugin en
el mismo archivo revisado que el resto de la configuración del entorno de ejecución de Codex.

## Temas relacionados

- [Entorno de ejecución de Codex](/es/plugins/codex-harness)
- [Entorno de ejecución en tiempo de ejecución de Codex](/es/plugins/codex-harness-runtime)
- [Supervisión de Codex](/es/plugins/codex-supervision)
- [Plugins nativos de Codex](/es/plugins/codex-native-plugins)
- [Uso del equipo con Codex](/es/plugins/codex-computer-use)
- [Proveedor de OpenAI](/es/providers/openai)
- [Referencia de configuración](/es/gateway/configuration-reference)
