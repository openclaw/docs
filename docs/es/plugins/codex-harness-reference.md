---
read_when:
    - Necesitas todos los campos de configuración del entorno Codex
    - Se está cambiando el comportamiento del transporte, la autenticación, la detección o el tiempo de espera de app-server
    - Se está depurando el inicio del entorno de pruebas de Codex, la detección de modelos o el aislamiento del entorno
summary: Referencia de configuración, autenticación, detección y servidor de aplicaciones para el arnés de Codex
title: Referencia del entorno de Codex
x-i18n:
    generated_at: "2026-07-14T13:54:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: c74ff6892d0d57a29849c7a1d760ddce4624903daa41cea063af8e39ad125cb8
    source_path: plugins/codex-harness-reference.md
    workflow: 16
---

Esta referencia abarca la configuración detallada del plugin oficial `codex`.
Para las decisiones de configuración y enrutamiento, comience por
[entorno de ejecución de Codex](/es/plugins/codex-harness).

## Superficie de configuración del plugin

Toda la configuración del entorno de ejecución de Codex se encuentra bajo `plugins.entries.codex.config`.

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
| `discovery`                | habilitado                  | Configuración de descubrimiento de modelos para `model/list` del servidor de aplicaciones de Codex.                                                                                    |
| `appServer`                | servidor de aplicaciones stdio administrado | Configuración de transporte, comando, autenticación, aprobación, entorno aislado y tiempo de espera. El entorno de ejecución ordinario usa de forma predeterminada un estado con ámbito de agente.                        |
| `codexDynamicToolsLoading` | `"searchable"`           | Use `"direct"` para colocar las herramientas dinámicas de OpenClaw directamente en el contexto inicial de herramientas de Codex.                                                       |
| `codexDynamicToolsExclude` | `[]`                     | Nombres adicionales de herramientas dinámicas de OpenClaw que se omitirán en los turnos del servidor de aplicaciones de Codex.                                                                    |
| `codexPlugins`             | deshabilitado                 | Compatibilidad nativa con plugins y aplicaciones de Codex, incluido el acceso opcional a aplicaciones de cuentas conectadas. Consulte [Plugins nativos de Codex](/es/plugins/codex-native-plugins). |
| `computerUse`              | deshabilitado                 | Configuración de Computer Use de Codex. Consulte [Computer Use de Codex](/es/plugins/codex-computer-use).                                                               |
| `sessionCatalog`           | habilitado                  | Descubrimiento nativo de sesiones de Codex para la barra lateral. Establezca `enabled: false` para deshabilitar el descubrimiento sin deshabilitar el proveedor ni el entorno de ejecución.           |
| `supervision`              | deshabilitado                 | Política de transcripción y control de escritura de sesiones nativas orientada al agente. Consulte [Supervisión de Codex](/es/plugins/codex-supervision).                          |

## Supervisión

El descubrimiento de sesiones nativas enumera de forma predeterminada las sesiones de Codex no archivadas del equipo del Gateway
y de los nodos emparejados que hayan aceptado participar. Deshabilite solo ese catálogo con:

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
| `endpoints`           | endpoint local integrado | Destinos de endpoint avanzados y de compatibilidad para el agente de supervisión de Codex conservado y las herramientas MCP independientes. El catálogo humano y el flujo de ramas ignoran estos destinos y usan el servidor de aplicaciones de supervisión resuelto desde `appServer`.       |
| `allowRawTranscripts` | `false`                 | Con la supervisión habilitada, permite las lecturas autónomas de transcripciones por parte del agente o del MCP independiente, así como los campos de lista derivados de transcripciones. Las lecturas de `codex_threads` limitadas a metadatos siguen disponibles. No controla la continuación autenticada de la interfaz de control.     |
| `allowWriteControls`  | `false`                 | Con la supervisión habilitada, permite las mutaciones autónomas de bifurcación, cambio de nombre, archivado y desarchivado de `codex_threads`, además de las operaciones de envío, orientación e interrupción del MCP independiente. No omite las demás comprobaciones de vinculación, host, estado o confirmación. |

Las entradas de endpoint aceptan estos campos:

| Campo          | Se aplica a    | Significado                                                               |
| -------------- | ------------- | --------------------------------------------------------------------- |
| `id`           | todos           | Identificador estable del endpoint.                                                   |
| `label`        | todos           | Etiqueta de visualización opcional.                                               |
| `transport`    | todos           | `"stdio-proxy"` o `"websocket"`.                                     |
| `command`      | `stdio-proxy` | Comando opcional del servidor de aplicaciones.                                          |
| `args`         | `stdio-proxy` | Argumentos opcionales del comando.                                           |
| `cwd`          | `stdio-proxy` | Directorio de trabajo opcional del proceso secundario.                             |
| `url`          | `websocket`   | URL obligatoria de WebSocket o de un socket local compatible.                     |
| `authTokenEnv` | `websocket`   | Variable de entorno opcional cuyo valor autentica el endpoint. |

La página **Sesiones de Codex** usa el servidor de aplicaciones de supervisión del plugin y muestra
solo las sesiones no archivadas. Sin una configuración explícita de conexión en `appServer`,
esa conexión se administra mediante stdio en el directorio principal del usuario. Las filas locales almacenadas o inactivas pueden crear
un chat bloqueado al modelo con un historial acotado del usuario y el asistente hasta el último
turno de origen terminal persistido. Su vinculación privada mantiene en esa conexión la bifurcación
de la instantánea, la rama de origen canónica de `appServer`, la inyección del historial y los turnos
posteriores. El primer inicio canónico usa el par devuelto por la bifurcación. Las reanudaciones
posteriores omiten las sustituciones de modelo y proveedor de OpenClaw para que Codex restaure el
par persistido del hilo canónico; un cambio nativo independiente puede actualizar ese
par, pero el modelo externo y la cadena de respaldo nunca lo sustituyen. Las filas almacenadas e inactivas
pueden archivarse tras confirmar que no existe otro ejecutor, salvo que otra vinculación activa
de OpenClaw sea propietaria del destino exacto o de alguno de sus descendientes generados
no archivados. OpenClaw sigue la paginación de descendientes de Codex y adopta una política cerrada ante
errores de enumeración, ciclos o agotamiento del límite de seguridad. La confirmación sigue
abarcando los clientes nativos desconocidos y la condición de carrera entre el estado y el archivado. Un
chat supervisado bloqueado al modelo no puede eliminarse mientras proteja la vinculación nativa.
Los orígenes activos no pueden crear una rama ni archivarse, pero un chat supervisado
existente sí puede abrirse. Todas las filas de nodos emparejados permanecen en modo de solo lectura; el transporte
del nodo aún no proporciona el ciclo de vida de transmisión necesario para el entorno de ejecución.

`appServer.homeScope: "user"` por sí solo cambia qué directorio principal de Codex usa un proceso
administrado del entorno de ejecución; no publica el catálogo de la flota. Habilitar la supervisión no
cambia el valor predeterminado del entorno de ejecución. En su lugar, la conexión de supervisión independiente
usa de forma predeterminada stdio administrado en el directorio principal del usuario cuando no existe una configuración
explícita de conexión en `appServer`. La configuración explícita se respeta para esa conexión.
Las vinculaciones supervisadas pendientes y confirmadas conservan esa conexión en todos los turnos;
la supervisión deshabilitada o las divergencias en la conexión o el ciclo de vida adoptan una política cerrada en lugar de
recurrir al entorno de ejecución del directorio principal del agente. La conexión predeterminada comparte las sesiones almacenadas
con los clientes nativos de Codex, no el estado de actividad local de sus procesos.

La configuración heredada de `plugins.entries.codex-supervisor` está retirada. Ejecute
`openclaw doctor --fix` para migrar la entrada antigua, las definiciones de endpoints, los indicadores
de política y las referencias de permisos y denegaciones de plugins a este bloque. Los valores canónicos
explícitos de `codex.config.supervision` prevalecen en caso de conflicto.

## Transporte del servidor de aplicaciones

Para los turnos ordinarios del entorno de ejecución, OpenClaw inicia el binario administrado de Codex incluido
con el plugin oficial (actualmente `@openai/codex` `0.144.3`):

```bash
codex app-server --listen stdio://
```

Esto mantiene la versión del servidor de aplicaciones vinculada al plugin oficial `codex` en lugar de
a cualquier CLI de Codex independiente que esté instalada localmente. Establezca
`appServer.command` solo cuando se quiera usar intencionadamente un ejecutable diferente.
Los turnos administrados ordinarios con el directorio principal aislado predeterminado del agente prefieren este
paquete fijado incluso cuando hay instalado un paquete de aplicación de escritorio de macOS. Cuando
[Computer Use](/es/plugins/codex-computer-use) está habilitado, o cuando `homeScope` es
`"user"` y puede cargar el estado nativo de Computer Use, el inicio administrado prefiere en su lugar
el binario de la aplicación de escritorio que posee los permisos necesarios de macOS. La misma
regla de prioridad del escritorio se aplica cuando la configuración efectiva de Codex del directorio principal aislado
de un agente habilita Computer Use nativo. Si no hay instalado ningún paquete de aplicación de escritorio, OpenClaw
recurre al binario del paquete fijado.

La transferencia del ejecutable y el aislamiento de la configuración nativa coordinan los clientes dentro de un
único proceso de Gateway en ejecución. Reinicie el Gateway después de que otro proceso cambie la
configuración del plugin nativo de Codex.

La supervisión resuelve una conexión independiente. Sin una configuración explícita
de conexión en `appServer`, usa stdio administrado con `homeScope: "user"`;
el entorno de ejecución ordinario sigue usando stdio administrado con `homeScope: "agent"`. Ambos
flujos respetan la configuración explícita de conexión. Establezca `homeScope: "user"`
explícitamente cuando el entorno de ejecución ordinario deba compartir `$CODEX_HOME` (o `~/.codex`)
con clientes nativos. Una vinculación supervisada privada usa la conexión de supervisión
independientemente del valor predeterminado del entorno de ejecución ordinario. Los procesos independientes del servidor de aplicaciones
mantienen estados activos y de aprobación separados.

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

| Campo                                         | Valor predeterminado                                                | Significado                                                                                                                                                                                                                                                                                                                                                                                         |
| --------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                                   | `"stdio"`                                              | `"stdio"` inicia Codex; `"unix"` explícito se conecta al socket de control local; `"websocket"` se conecta a `url`.                                                                                                                                                                                                                                                                                |
| `homeScope`                                   | `"agent"`                                              | `"agent"` aísla el estado ordinario del arnés para cada agente de OpenClaw. `"user"` es una activación voluntaria explícita que comparte el `$CODEX_HOME` o `~/.codex` nativo, usa la autenticación nativa y habilita la gestión de hilos solo para el propietario. El ámbito de usuario admite transporte stdio local o Unix. Para la conexión de supervisión independiente, un valor no establecido se resuelve como `"user"` para stdio o Unix y como `"agent"` para WebSocket.     |
| `command`                                     | binario de Codex administrado                                   | Ejecutable para el transporte stdio. Déjelo sin establecer para usar el binario administrado.                                                                                                                                                                                                                                                                                                                          |
| `args`                                        | `["app-server", "--listen", "stdio://"]`               | Argumentos para el transporte stdio.                                                                                                                                                                                                                                                                                                                                                                  |
| `url`                                         | sin establecer                                                  | URL del servidor de aplicaciones WebSocket o URL `unix://`. Una ruta Unix explícita vacía selecciona el socket de control canónico del directorio personal del usuario.                                                                                                                                                                                                                                                                          |
| `authToken`                                   | sin establecer                                                  | Token de portador para el transporte WebSocket. Acepta una cadena literal o SecretInput, como `${CODEX_APP_SERVER_TOKEN}`.                                                                                                                                                                                                                                                                              |
| `headers`                                     | `{}`                                                   | Encabezados WebSocket adicionales. Los valores de encabezado aceptan cadenas literales o valores SecretInput, por ejemplo, `x-codex-client-session-token: "${CODEX_CLIENT_SESSION_TOKEN}"`.                                                                                                                                                                                                                               |
| `clearEnv`                                    | `[]`                                                   | Nombres de variables de entorno adicionales que se eliminan del proceso del servidor de aplicaciones stdio iniciado después de que OpenClaw construye su entorno heredado.                                                                                                                                                                                                                                                             |
| `remoteWorkspaceRoot`                         | sin establecer                                                  | Raíz remota del espacio de trabajo del servidor de aplicaciones Codex. Cuando se establece, OpenClaw infiere la raíz del espacio de trabajo local a partir del espacio de trabajo de OpenClaw resuelto, conserva el sufijo del cwd actual bajo esta raíz remota y envía a Codex únicamente el cwd final del servidor de aplicaciones. Si el cwd está fuera de la raíz resuelta del espacio de trabajo de OpenClaw, OpenClaw falla de forma cerrada en lugar de enviar una ruta local del Gateway al servidor de aplicaciones remoto. |
| `requestTimeoutMs`                            | `60000`                                                | Tiempo de espera para las llamadas del plano de control del servidor de aplicaciones.                                                                                                                                                                                                                                                                                                                                                     |
| `turnCompletionIdleTimeoutMs`                 | `60000`                                                | Intervalo de inactividad después de que Codex acepta un turno o después de una solicitud del servidor de aplicaciones circunscrita a un turno, mientras OpenClaw espera `turn/completed`.                                                                                                                                                                                                                                                                    |
| `postToolRawAssistantCompletionIdleTimeoutMs` | `300000`                                               | Protección de inactividad tras la finalización y de progreso que se utiliza después de una transferencia a una herramienta, la finalización de una herramienta nativa, el progreso sin procesar del asistente posterior a una herramienta, la finalización del razonamiento sin procesar o el progreso del razonamiento, mientras OpenClaw espera `turn/completed`. Úsela para cargas de trabajo de confianza o pesadas en las que la síntesis posterior a una herramienta pueda permanecer legítimamente inactiva durante más tiempo que el presupuesto de entrega final del asistente.                                |
| `mode`                                        | `"yolo"` salvo que los requisitos locales de Codex no permitan YOLO | Configuración predefinida para ejecución YOLO o revisada por un guardián.                                                                                                                                                                                                                                                                                                                                                 |
| `approvalPolicy`                              | `"never"` o una política de aprobación de guardián permitida       | Política de aprobación nativa de Codex enviada al inicio y la reanudación del hilo, y al turno.                                                                                                                                                                                                                                                                                                                            |
| `sandbox`                                     | `"danger-full-access"` o un entorno aislado de guardián permitido  | Modo de entorno aislado nativo de Codex enviado al inicio y la reanudación del hilo. Los entornos aislados activos de OpenClaw restringen los turnos `danger-full-access` a `workspace-write` de Codex; la marca de red del turno sigue la salida del entorno aislado de OpenClaw.                                                                                                                                                                                       |
| `approvalsReviewer`                           | `"user"` o un revisor guardián permitido               | Use `"auto_review"` para permitir que Codex revise las solicitudes de aprobación nativas cuando esté permitido.                                                                                                                                                                                                                                                                                                                   |
| `defaultWorkspaceDir`                         | directorio del proceso actual                              | Espacio de trabajo que utiliza `/codex bind` cuando se omite `--cwd`.                                                                                                                                                                                                                                                                                                                                        |
| `serviceTier`                                 | sin establecer                                                  | Nivel de servicio opcional del servidor de aplicaciones Codex. `"priority"` habilita el enrutamiento en modo rápido, `"flex"` solicita procesamiento flexible y `null` elimina la sustitución. El valor heredado `"fast"` se acepta como `"priority"`.                                                                                                                                                                                                 |
| `networkProxy`                                | deshabilitado                                               | Activa voluntariamente la conectividad de red del perfil de permisos de Codex para los comandos del servidor de aplicaciones. OpenClaw define la configuración `permissions.<profile>.network` seleccionada y la selecciona con `default_permissions` en lugar de enviar `sandbox`.                                                                                                                                                                             |
| `experimental.sandboxExecServer`              | `false`                                                | Activación voluntaria de vista previa que registra un entorno de Codex respaldado por el entorno aislado de OpenClaw con el servidor de aplicaciones Codex compatible, para que la ejecución nativa de Codex pueda realizarse dentro del entorno aislado activo de OpenClaw.                                                                                                                                                                                                            |

`appServer.networkProxy` es explícito porque cambia el contrato del entorno aislado
de Codex. Cuando está habilitado, OpenClaw también establece `features.network_proxy.enabled` y
`default_permissions` en la configuración del hilo de Codex para que el perfil de
permisos generado pueda iniciar la conectividad de red administrada por Codex.
De forma predeterminada, OpenClaw genera un nombre de perfil `openclaw-network-<fingerprint>`
resistente a colisiones a partir del cuerpo del perfil; use
`profileName` solo cuando se requiera un nombre local estable.

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
`networkProxy` se utiliza en su lugar acceso al sistema de archivos al estilo del espacio de trabajo para el perfil
de permisos generado. La aplicación de restricciones de red gestionada por Codex utiliza
redes en entorno aislado, por lo que un perfil de acceso completo no protegería el tráfico saliente.

El Plugin bloquea los protocolos de enlace de servidores de aplicaciones antiguos o sin versión: el servidor de aplicaciones de Codex
debe informar de la versión estable `0.143.0` o posterior.

OpenClaw considera remotas las URL WebSocket del servidor de aplicaciones que no sean de bucle invertido y exige
autenticación WebSocket con identidad mediante `appServer.authToken` o un
encabezado `Authorization`. `appServer.authToken` y cada valor de `appServer.headers.*`
pueden ser SecretInput; el entorno de ejecución de secretos resuelve las SecretRefs y la
notación abreviada de variables de entorno antes de que OpenClaw cree las opciones de inicio del servidor de aplicaciones, y las
SecretRefs estructuradas sin resolver provocan un error antes de que se envíe cualquier token o encabezado. Cuando se
configuran plugins nativos de Codex, OpenClaw utiliza el plano de control de plugins del servidor de aplicaciones
conectado para instalar o actualizar esos plugins y, a continuación, actualiza el
inventario de aplicaciones para que las aplicaciones propiedad del plugin sean visibles para el hilo de Codex. `app/list` sigue siendo
la fuente autoritativa del inventario y los metadatos, pero la política de OpenClaw
decide si `thread/start` envía `config.apps[appId].enabled = true` para una
aplicación accesible incluida en la lista, aunque Codex la marque actualmente como deshabilitada. Los identificadores de
aplicaciones desconocidos o ausentes siguen provocando un cierre seguro; esta ruta solo activa plugins del marketplace
mediante `plugin/install` y actualiza el inventario. Conecte OpenClaw únicamente a
servidores de aplicaciones remotos de confianza para aceptar instalaciones de plugins gestionadas por OpenClaw
y actualizaciones del inventario de aplicaciones.

## Modos de aprobación y entorno aislado

Las sesiones locales del servidor de aplicaciones mediante stdio utilizan de forma predeterminada el modo YOLO:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` y
`sandbox: "danger-full-access"`. Esta postura de operador local de confianza permite que
los turnos y Heartbeats desatendidos de OpenClaw avancen sin solicitudes de aprobación
nativas que nadie esté disponible para responder.

Si el archivo local de requisitos del sistema de Codex no permite valores implícitos de aprobación YOLO,
revisor o entorno aislado, OpenClaw considera en su lugar que el valor predeterminado implícito es guardian
y selecciona permisos guardian permitidos. `tools.exec.mode: "auto"`
también fuerza aprobaciones de Codex revisadas por guardian y no conserva las
sustituciones heredadas no seguras `approvalPolicy: "never"` ni `sandbox: "danger-full-access"`;
establezca `tools.exec.mode: "full"` para adoptar intencionadamente una postura sin aprobación.
Las entradas `[[remote_sandbox_config]]` que coincidan con el nombre de host en el mismo archivo de requisitos
se respetan al decidir el valor predeterminado del entorno aislado.

Establezca `appServer.mode: "guardian"` para las aprobaciones de Codex revisadas por guardian:

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
valores están permitidos. Los campos de política individuales sustituyen a `mode`. El valor de revisor anterior
`guardian_subagent` todavía se acepta como alias de compatibilidad,
pero las configuraciones nuevas deben utilizar `auto_review`.

Cuando un entorno aislado de OpenClaw está activo, el proceso local del servidor de aplicaciones de Codex sigue
ejecutándose en el host del Gateway. Por lo tanto, OpenClaw deshabilita el Code Mode nativo de Codex,
los servidores MCP del usuario y la ejecución de plugins respaldada por aplicaciones para ese turno, en lugar de
considerar el aislamiento del lado del host de Codex equivalente al backend de entorno aislado de OpenClaw.
El acceso al shell se expone mediante herramientas dinámicas respaldadas por el entorno aislado de OpenClaw,
como `sandbox_exec` y `sandbox_process`, cuando están disponibles las herramientas normales
de ejecución y procesos.

<Note>
En hosts de entorno aislado de OpenClaw respaldados por Docker (`agents.defaults.sandbox.mode` establecido en
un backend de Docker), `openclaw doctor` comprueba si el host permite los espacios de nombres de
usuario sin privilegios (y, cuando se deshabilita la salida de red del entorno aislado de Docker,
de red) que necesita el `bwrap` anidado de Codex para la ejecución del shell `workspace-write`
dentro del contenedor del entorno aislado. Una comprobación fallida suele manifestarse
como `bwrap: setting up uid map: Permission denied` o
`bwrap: loopback: Failed RTM_NEWADDR: Operation not permitted` en
hosts Ubuntu/AppArmor. Corrija la política de espacios de nombres del host indicada para el usuario del
servicio OpenClaw y reinicie el Gateway; es preferible utilizar un perfil de AppArmor específico para el
proceso del servicio en lugar de la alternativa para todo el host
`kernel.apparmor_restrict_unprivileged_userns=0`, y no conceda
privilegios más amplios al contenedor de Docker únicamente para satisfacer el `bwrap` anidado.
</Note>

## Ejecución nativa en entorno aislado

El valor predeterminado estable es cerrar de forma segura: el aislamiento activo de OpenClaw deshabilita las
superficies de ejecución nativas de Codex que, de otro modo, se ejecutarían desde el host del servidor de aplicaciones
de Codex. Utilice `appServer.experimental.sandboxExecServer: true` solo si desea
probar la compatibilidad de Codex con entornos remotos mediante el backend de entorno aislado de OpenClaw.
Esta ruta en vista previa funciona con todas las versiones compatibles del servidor de aplicaciones de Codex.

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

Cuando la opción está activada y la sesión actual de OpenClaw está en un entorno aislado, OpenClaw
inicia un servidor de ejecución de bucle invertido local respaldado por el entorno aislado activo, lo registra
en el servidor de aplicaciones de Codex e inicia el hilo y el turno de Codex con ese
entorno propiedad de OpenClaw. Si el servidor de aplicaciones no puede registrar el entorno,
la ejecución se cierra de forma segura en lugar de recurrir silenciosamente a la ejecución en el host.

Esta ruta en vista previa es exclusivamente local. Un servidor de aplicaciones WebSocket remoto no puede acceder
al servidor de ejecución de bucle invertido salvo que se ejecute en el mismo host, por lo que OpenClaw
rechaza esa combinación.

## Aislamiento de la autenticación y el entorno

En el directorio principal predeterminado por agente, la autenticación se selecciona en este orden:

1. Un perfil explícito de autenticación de OpenClaw Codex para el agente.
2. La cuenta existente del servidor de aplicaciones en el directorio principal de Codex de ese agente.
3. Solo para inicios locales del servidor de aplicaciones mediante stdio, `CODEX_API_KEY` y, después,
   `OPENAI_API_KEY`, cuando no hay ninguna cuenta del servidor de aplicaciones y todavía se
   requiere autenticación de OpenAI.

Cuando OpenClaw detecta un perfil de autenticación de Codex de tipo suscripción de ChatGPT (OAuth o
tipo de credencial de token), elimina `CODEX_API_KEY` y `OPENAI_API_KEY` del
proceso secundario de Codex iniciado. Esto mantiene disponibles las claves de API del nivel del Gateway
para incrustaciones o modelos directos de OpenAI sin hacer que los turnos nativos del servidor de aplicaciones
de Codex se facturen por accidente mediante la API.

Los perfiles explícitos de clave de API de Codex y la alternativa local de clave de entorno mediante stdio utilizan
el inicio de sesión del servidor de aplicaciones en lugar del entorno heredado del proceso secundario. Las conexiones WebSocket
del servidor de aplicaciones no reciben la alternativa de clave de API del entorno del Gateway; utilice un perfil explícito de
autenticación o la propia cuenta del servidor de aplicaciones remoto.

Los inicios del servidor de aplicaciones mediante stdio heredan de forma predeterminada el entorno de procesos de OpenClaw.
OpenClaw controla el puente de cuentas del servidor de aplicaciones de Codex y establece `CODEX_HOME` en un
directorio por agente dentro del estado de OpenClaw de ese agente. Esto mantiene la
configuración, las cuentas, la caché y los datos de plugins, y el estado de los hilos de Codex limitados al agente de OpenClaw,
en lugar de filtrarlos desde el directorio principal personal `~/.codex` del operador.

Establezca `appServer.homeScope: "user"` para compartir el estado nativo de Codex con Codex
Desktop y la CLI. Este modo de directorio principal del usuario local admite stdio gestionado y
transporte Unix explícito. Utiliza `$CODEX_HOME` cuando está establecido y `~/.codex`
en caso contrario, incluida la autenticación, la configuración, los plugins y los hilos nativos.
OpenClaw omite su puente de perfiles de autenticación para el servidor de aplicaciones. Los turnos verificados del propietario
pueden utilizar `codex_threads` para enumerar (con un filtro `search` opcional),
leer, bifurcar, renombrar, archivar y desarchivar esos hilos. Bifurque un hilo antes de
continuarlo en OpenClaw; los procesos independientes de Codex no coordinan
escritores simultáneos para el mismo hilo.

Esa activación voluntaria de `homeScope` se aplica a las sesiones normales del entorno de ejecución. Un Chat creado
mediante Codex Sessions utiliza en su lugar su conexión de supervisión privada, lo que
conserva la configuración de autenticación y proveedor de la conexión nativa para la
rama canónica y futuras reanudaciones.

En un Chat supervisado y bloqueado a un modelo, `codex_threads` no puede adjuntar una
bifurcación diferente ni archivar el hilo nativo vinculado al Chat. La enumeración y la lectura exclusiva
de metadatos siguen disponibles. Las lecturas de transcripciones sin procesar requieren `allowRawTranscripts`; cuando
está deshabilitado, también se rechaza la búsqueda en listas porque la búsqueda nativa puede encontrar
vistas previas de transcripciones. Renombrar, desarchivar, crear una bifurcación separada y archivar un
hilo no relacionado que no pertenezca a otro Chat de OpenClaw requiere
`allowWriteControls`. Ninguna opción elude una vinculación bloqueada.

OpenClaw no modifica `HOME` para los inicios locales normales del servidor de aplicaciones.
Los subprocesos ejecutados por Codex, como `openclaw`, `gh`, `git`, las CLI en la nube y los comandos del
shell, ven el directorio principal normal del proceso y pueden encontrar la configuración y los
tokens del directorio principal del usuario. Codex también puede detectar `$HOME/.agents/skills` y
`$HOME/.agents/plugins/marketplace.json`; esa detección de `.agents` se
comparte intencionadamente con el directorio principal del operador y es independiente del estado
aislado `~/.codex`.

En el ámbito predeterminado del agente, los plugins de OpenClaw y las instantáneas de Skills de OpenClaw
siguen fluyendo a través del registro de plugins y el cargador de Skills propios de OpenClaw; los
recursos personales `~/.codex` de Codex no. Si existen Skills o
plugins útiles de la CLI de Codex procedentes de un directorio principal de Codex que deban formar parte de un agente
aislado de OpenClaw, realice explícitamente su inventario:

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

Si un despliegue necesita aislamiento adicional del entorno, añada esas variables
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
OpenClaw elimina `CODEX_HOME` y `HOME` de esta lista durante la normalización del
inicio local: `CODEX_HOME` sigue apuntando al ámbito seleccionado del agente o usuario,
y `HOME` continúa heredándose para que los subprocesos puedan utilizar el estado normal
del directorio principal del usuario.

## Herramientas dinámicas

Las herramientas dinámicas de Codex utilizan de forma predeterminada la carga `searchable`, expuesta bajo el
espacio de nombres `openclaw` con `deferLoading: true`. OpenClaw no expone
herramientas dinámicas que dupliquen las operaciones nativas de Codex en el espacio de trabajo ni la propia
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

La mayoría de las herramientas de integración restantes de OpenClaw, como mensajería, medios, Cron,
navegador, Nodes, Gateway, `heartbeat_respond` y `web_search`, están disponibles
mediante la búsqueda de herramientas de Codex bajo ese espacio de nombres. Esto mantiene más reducido el contexto
inicial del modelo. Un pequeño conjunto de herramientas permanece directamente invocable con independencia de
`codexDynamicToolsLoading`, porque la búsqueda de herramientas de Codex puede no estar disponible o
resolver un universo formado únicamente por conectores: `agents_list`, `sessions_spawn` y
`sessions_yield`. Las instrucciones para desarrolladores siguen orientando a los subagentes normales de Codex
hacia `spawn_agent` nativo para el trabajo de subagentes nativo de Codex, mientras que
`sessions_spawn` sigue disponible para la delegación explícita de OpenClaw o ACP.
Las respuestas de origen limitadas a la herramienta de mensajes también siguen siendo directas, ya que se trata de un
contrato de control de turnos.

Las herramientas marcadas con `catalogMode: "direct-only"`, incluida la herramienta
`computer` de OpenClaw, se agrupan bajo `openclaw_direct`. OpenClaw
añade ese espacio de nombres a la lista `code_mode.direct_only_tool_namespaces` de Codex sin
reemplazar las entradas proporcionadas por el operador. Por tanto, Codex
expone esas herramientas como `DirectModelOnly` en los hilos normales y en
los exclusivos del modo de código, en lugar de enrutarlas mediante llamadas
`tools.*` anidadas del modo de código. Este límite es necesario para
los resultados que contienen imágenes: la serialización anidada del modo de
código aplana la salida de imágenes y la convierte en texto, lo que descartaría
la captura de pantalla necesaria para la siguiente acción en el equipo.

Configure `codexDynamicToolsLoading: "direct"` únicamente al conectarse a un
servidor de aplicaciones Codex personalizado que no pueda buscar herramientas
dinámicas diferidas o al depurar la carga útil completa de herramientas.

## Tiempos de espera

Las llamadas a herramientas dinámicas propiedad de OpenClaw tienen límites
independientes de `appServer.requestTimeoutMs`. Cada solicitud
`item/tool/call` de Codex utiliza el primer tiempo de espera disponible en
este orden:

- Un argumento `timeoutMs` positivo por llamada.
- Para `image_generate`, `agents.defaults.imageGenerationModel.timeoutMs`.
- Para `image_generate` sin un tiempo de espera configurado, el valor
  predeterminado de 120 segundos para la generación de imágenes.
- Para la herramienta de comprensión de contenido multimedia
  `image`, `tools.media.image.timeoutSeconds` convertido a milisegundos o el valor
  predeterminado de 60 segundos para contenido multimedia. Para la comprensión
  de imágenes, esto se aplica a la propia solicitud y no se reduce por el
  trabajo de preparación anterior.
- Para la herramienta `message`, un valor predeterminado fijo de
  120 segundos.
- El valor predeterminado de 90 segundos para herramientas dinámicas.

Este vigilante constituye el presupuesto externo de `item/tool/call`
dinámico. Los tiempos de espera de solicitud específicos del proveedor se
ejecutan dentro de esa llamada y mantienen su propia semántica de tiempo de
espera. Los presupuestos de las herramientas dinámicas tienen un límite de
600000 ms. Cuando se agota el tiempo de espera, OpenClaw cancela la señal de la
herramienta cuando es compatible y devuelve a Codex una respuesta fallida de
la herramienta dinámica, de modo que el turno pueda continuar en lugar de
dejar la sesión en `processing`.

Después de que Codex acepte un turno y de que OpenClaw responda a una solicitud
del servidor de aplicaciones con ámbito de turno, el arnés espera que Codex
avance en el turno actual y termine finalmente el turno nativo con
`turn/completed`. Si el servidor de aplicaciones permanece inactivo durante
`appServer.turnCompletionIdleTimeoutMs`, OpenClaw intenta interrumpir el turno de Codex, registra un
tiempo de espera de diagnóstico y libera el carril de sesión de OpenClaw para
que los mensajes de chat posteriores no queden en cola detrás de un turno
nativo obsoleto.

La mayoría de las notificaciones no terminales del mismo turno desactivan ese
breve vigilante porque Codex ha demostrado que el turno sigue activo. Las
transferencias de herramientas utilizan un presupuesto de inactividad
posterior a la herramienta más prolongado: después de que OpenClaw devuelva
una respuesta `item/tool/call`, después de que finalicen elementos de
herramientas nativas como `commandExecution`, después de finalizaciones
`custom_tool_call_output` sin procesar y después del progreso sin procesar del
asistente posterior a la herramienta, las finalizaciones de razonamiento sin
procesar o el progreso del razonamiento. La protección utiliza
`appServer.postToolRawAssistantCompletionIdleTimeoutMs` cuando está configurado y, de lo contrario, el valor
predeterminado es de cinco minutos. Ese mismo presupuesto posterior a la
herramienta también amplía el vigilante de progreso durante el intervalo de
síntesis silencioso antes de que Codex emita el siguiente evento del turno
actual. Las finalizaciones de razonamiento, las finalizaciones
`agentMessage` de comentarios y el razonamiento sin procesar previo a la
herramienta o el progreso del asistente pueden ir seguidos de una respuesta
final automática, por lo que utilizan la protección de respuesta posterior al
progreso en lugar de liberar inmediatamente el carril de sesión. Solo los
elementos `agentMessage` finalizados finales o que no sean comentarios y
las finalizaciones sin procesar del asistente previas a la herramienta activan
la liberación por salida del asistente: si Codex queda después inactivo sin
`turn/completed`, OpenClaw intenta interrumpir el turno nativo y libera el
carril de sesión. Los fallos reproducibles de forma segura del servidor de
aplicaciones mediante stdio, incluidos los tiempos de espera de inactividad al
completar el turno sin pruebas de actividad del asistente, herramientas,
elementos activos o efectos secundarios, se reintentan una vez en un nuevo
intento del servidor de aplicaciones. Los tiempos de espera no seguros siguen
retirando el cliente bloqueado del servidor de aplicaciones y liberando el
carril de sesión de OpenClaw. También eliminan el enlace obsoleto del hilo
nativo en lugar de reproducirlo automáticamente. Los tiempos de espera de
supervisión de finalización muestran texto de tiempo de espera específico de
Codex: los casos reproducibles de forma segura indican que la respuesta puede
estar incompleta, mientras que los casos no seguros indican al usuario que
verifique el estado actual antes de volver a intentarlo. Los diagnósticos
públicos de tiempo de espera incluyen campos estructurales como el último
método de notificación del servidor de aplicaciones, el id/tipo/rol del
elemento de respuesta sin procesar del asistente, los recuentos de solicitudes
y elementos activos, y el estado de supervisión activado. Cuando la última
notificación es un elemento de respuesta sin procesar del asistente, también
incluyen una vista previa limitada del texto del asistente. No incluyen el
contenido sin procesar del prompt ni de las herramientas.

## Descubrimiento de modelos

De forma predeterminada, el Plugin de Codex solicita al servidor de
aplicaciones los modelos disponibles. La disponibilidad de los modelos
pertenece al servidor de aplicaciones Codex, por lo que la lista puede cambiar
cuando OpenClaw actualiza la versión incluida de `@openai/codex` o cuando un
despliegue dirige `appServer.command` a otro binario de Codex. La disponibilidad
también puede estar limitada a la cuenta. Utilice `/codex models` en un
Gateway en ejecución para consultar el catálogo activo de ese arnés y esa
cuenta.

Si el descubrimiento falla o agota el tiempo de espera, OpenClaw utiliza un
catálogo alternativo incluido:

| Id. del modelo  | Nombre para mostrar | Niveles de razonamiento   |
| --------------- | ------------------- | ------------------------- |
| `gpt-5.5`      | gpt-5.5      | low, medium, high, xhigh |
| `gpt-5.4-mini` | GPT-5.4-Mini | low, medium, high, xhigh |

<Note>
El arnés incluido actualmente es `@openai/codex` `0.144.3`. Una
consulta `model/list` al servidor de aplicaciones incluido devolvió
estas filas públicas del selector:

| Id. del modelo   | Modalidades de entrada | Niveles de razonamiento               |
| ---------------- | ---------------------- | ------------------------------------- |
| `gpt-5.6-sol`   | texto, imagen       | low, medium, high, xhigh, max, ultra |
| `gpt-5.6-terra` | texto, imagen       | low, medium, high, xhigh, max, ultra |
| `gpt-5.6-luna`  | texto, imagen       | low, medium, high, xhigh, max        |
| `gpt-5.5`       | texto, imagen       | low, medium, high, xhigh             |
| `gpt-5.4`       | texto, imagen       | low, medium, high, xhigh             |
| `gpt-5.4-mini`  | texto, imagen       | low, medium, high, xhigh             |
| `gpt-5.2`       | texto, imagen       | low, medium, high, xhigh             |

El catálogo del servidor de aplicaciones puede informar de
`ultra`; los controles de razonamiento de OpenClaw exponen
actualmente niveles hasta `max`.

Las filas activas del selector están limitadas a la cuenta y pueden cambiar
según la cuenta, el catálogo de Codex o la versión incluida; ejecute
`/codex models` para obtener la lista actual en lugar de depender de una
tabla correspondiente a un momento determinado. También pueden aparecer
modelos ocultos en el catálogo del servidor de aplicaciones para flujos
internos o especializados sin ser opciones normales del selector de modelos.
</Note>

Ajuste el descubrimiento en `plugins.entries.codex.config.discovery`:

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

Desactive el descubrimiento cuando se desee evitar que el inicio consulte
Codex y utilizar únicamente el catálogo alternativo:

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

Codex gestiona `AGENTS.md` por sí mismo mediante el descubrimiento
nativo de documentación del proyecto. OpenClaw no escribe archivos sintéticos
de documentación del proyecto de Codex ni depende de los nombres de archivo
alternativos de Codex para los archivos de personalidad, porque las
alternativas de Codex solo se aplican cuando falta `AGENTS.md`.

Para mantener la paridad del espacio de trabajo de OpenClaw, el arnés de Codex
reenvía los demás archivos de inicialización como instrucciones para
desarrolladores, pero no de forma idéntica:

- `TOOLS.md` se reenvía como instrucciones para desarrolladores de Codex
  **heredadas**, por lo que los subagentes nativos de Codex generados durante
  el turno también las reciben.
- `SOUL.md`, `IDENTITY.md` y `USER.md` se reenvían como
  instrucciones de colaboración **con ámbito de turno**. Los subagentes nativos
  de Codex no las heredan, lo que evita que sus turnos adopten la personalidad
  y el perfil de usuario del agente principal.
- La lista compacta de Skills de OpenClaw cargadas también se reenvía como
  instrucciones de colaboración para desarrolladores con ámbito de turno, por
  lo que los subagentes nativos de Codex tampoco la heredan.
- El contenido de `HEARTBEAT.md` no se inyecta; los turnos de Heartbeat
  reciben un indicador en modo de colaboración para leer el archivo cuando
  existe y no está vacío.
- El contenido de `MEMORY.md` del espacio de trabajo configurado del
  agente no se pega en la entrada de turnos nativos de Codex cuando hay
  herramientas de memoria disponibles para ese espacio de trabajo; cuando
  existe, el arnés añade un pequeño indicador de memoria del espacio de trabajo
  a las instrucciones de colaboración para desarrolladores con ámbito de turno
  y Codex debe utilizar `memory_search` o `memory_get` cuando la
  memoria duradera sea pertinente. Si las herramientas están desactivadas, la
  búsqueda en memoria no está disponible o el espacio de trabajo activo
  difiere del espacio de trabajo de memoria del agente, `MEMORY.md`
  utiliza en su lugar la ruta normal y limitada de contexto del turno.
- `BOOTSTRAP.md`, cuando está presente, se reenvía como contexto de referencia
  de la entrada del turno de OpenClaw.

## Sustituciones mediante variables de entorno

Las sustituciones mediante variables de entorno siguen disponibles para
pruebas locales:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN` omite el binario administrado cuando
`appServer.command` no está definido.

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` se eliminó. Utilice
`plugins.entries.codex.config.appServer.mode: "guardian"` en su lugar, o
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` para pruebas locales puntuales. Se prefiere la configuración
para despliegues reproducibles porque mantiene el comportamiento del Plugin en
el mismo archivo revisado que el resto de la configuración del arnés de Codex.

## Contenido relacionado

- [Arnés de Codex](/es/plugins/codex-harness)
- [Entorno de ejecución del arnés de Codex](/es/plugins/codex-harness-runtime)
- [Supervisión de Codex](/es/plugins/codex-supervision)
- [Plugins nativos de Codex](/es/plugins/codex-native-plugins)
- [Uso del equipo con Codex](/es/plugins/codex-computer-use)
- [Proveedor de OpenAI](/es/providers/openai)
- [Referencia de configuración](/es/gateway/configuration-reference)
