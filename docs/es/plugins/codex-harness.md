---
read_when:
    - Quiere usar el entorno oficial de app-server de Codex
    - Necesitas ejemplos de configuración del entorno de Codex
    - Quieres que las implementaciones exclusivas de Codex fallen en lugar de recurrir a OpenClaw
summary: Ejecuta turnos del agente integrado de OpenClaw mediante el entorno oficial del servidor de aplicaciones de Codex
title: Entorno de Codex
x-i18n:
    generated_at: "2026-07-22T10:41:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 6ca6458a3c9d31d164ff065b4eb81799d556492c5eabb9c8c99bdb7666c9e6b6
    source_path: plugins/codex-harness.md
    workflow: 16
---

El plugin oficial `codex` ejecuta turnos de agentes de OpenAI integrados mediante Codex
app-server en lugar del arnés integrado de OpenClaw. Codex gestiona la
sesión de agente de bajo nivel: reanudación nativa de hilos, continuación nativa de herramientas,
Compaction nativa y ejecución de app-server. OpenClaw sigue gestionando los
canales de chat, los archivos de sesión, la selección de modelos, las herramientas dinámicas de OpenClaw, las aprobaciones,
la entrega de contenido multimedia y el reflejo visible de la transcripción.

Utilice referencias canónicas de modelos de OpenAI como `openai/gpt-5.6-sol`. No configure
referencias GPT heredadas de Codex; coloque el orden de autenticación de agentes de OpenAI en `auth.order.openai`.
Los identificadores de perfiles de autenticación heredados de Codex y las entradas heredadas del orden de autenticación de Codex se
reparan mediante `openclaw doctor --fix`.

Cuando la política de tiempo de ejecución del proveedor/modelo no está definida o es `auto`, el prefijo `openai/*` por sí solo
nunca selecciona este arnés. OpenAI solo puede seleccionar Codex implícitamente para una
ruta oficial HTTPS exacta de Platform Responses o ChatGPT Responses sin una
anulación de solicitud definida. Consulte
[Tiempo de ejecución implícito de agentes de OpenAI](/es/providers/openai#implicit-agent-runtime).
Si Codex gestiona la autenticación antes de que se conozca el enrutamiento entre Platform y ChatGPT, OpenClaw
sigue exigiendo que todas las rutas candidatas declaren compatibilidad con Codex. La gestión nativa
de la autenticación por sí sola nunca omite esa comprobación de ruta.

Cuando no hay ningún entorno aislado de OpenClaw activo, OpenClaw inicia los hilos de Codex app-server
con el modo de código nativo de Codex habilitado (el modo exclusivo de código permanece desactivado de forma predeterminada), por lo que
las capacidades nativas del espacio de trabajo y del código siguen disponibles junto con las herramientas dinámicas de OpenClaw
enrutadas mediante el puente `item/tool/call` de app-server. Un
entorno aislado de OpenClaw activo o una política de herramientas restringida deshabilita por completo el modo de código nativo,
salvo que se habilite la ruta experimental del servidor de ejecución del entorno aislado.

Con el valor predeterminado `tools.exec.host: "auto"` y sin ningún entorno aislado de OpenClaw activo,
Codex también recibe las herramientas `node_exec` y `node_process` para ejecutar comandos en nodos
emparejados. El shell nativo permanece en el host y el espacio de trabajo de Codex app-server
(local al Gateway para la implementación stdio predeterminada); `node_exec` selecciona un nodo por
nombre o identificador y mantiene vigente la política de aprobación de nodos de OpenClaw. Si una lista finita
de permitidos del tiempo de ejecución deshabilita el modo de código nativo y deja el turno sin un
entorno de ejecución, OpenClaw mantiene disponibles en su lugar sus herramientas `exec` y `process`
filtradas por políticas para la ejecución directa sin entorno aislado.

Esta función nativa de Codex es independiente del
[modo de código de OpenClaw](/es/tools/code-mode), un tiempo de ejecución QuickJS-WASI opcional
para ejecuciones genéricas de OpenClaw con una forma de entrada `exec` diferente. Para comprender la
separación general entre modelo, proveedor y tiempo de ejecución, comience por
[Tiempos de ejecución de agentes](/es/concepts/agent-runtimes): `openai/gpt-5.6-sol` es la referencia del
modelo, `codex` es el tiempo de ejecución y Telegram, Discord, Slack u otro
canal es la superficie de comunicación.

## Requisitos

- El plugin oficial `@openclaw/codex` instalado. Incluya `codex` en
  `plugins.allow` si la configuración utiliza una lista de permitidos.
- Un Codex app-server estable desde `0.143.0` hasta `0.144.6`. El plugin gestiona de forma predeterminada un
  binario compatible, por lo que un comando `codex` en `PATH` no afecta al inicio
  normal.
- Autenticación de Codex mediante `openclaw models auth login --provider openai`, una
  cuenta de app-server ya presente en el directorio principal de Codex del agente o un
  perfil explícito de autenticación mediante clave de API de Codex.

Para conocer la precedencia de autenticación, el aislamiento del entorno, los comandos personalizados de app-server,
la detección de modelos y la lista completa de campos de configuración, consulte la
[Referencia del arnés de Codex](/es/plugins/codex-harness-reference).

## Inicio rápido

Instale el plugin oficial y, a continuación, inicie sesión con OAuth de Codex:

```bash
openclaw plugins install @openclaw/codex
openclaw models auth login --provider openai
```

Habilite el plugin `codex` y seleccione un modelo de agente de OpenAI:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
  agents: {
    defaults: {
      model: "openai/gpt-5.6-sol",
    },
  },
}
```

Si la configuración utiliza `plugins.allow`, añada también `codex`:

```json5
{
  plugins: {
    allow: ["codex"],
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
}
```

Reinicie el Gateway después de cambiar la configuración del plugin. Si un chat ya tiene una
sesión, ejecute primero `/new` o `/reset` para que el siguiente turno determine el arnés
a partir de la configuración actual.

## Compartir hilos con Codex Desktop y la CLI

El valor predeterminado `appServer.homeScope: "agent"` aísla cada agente de OpenClaw del
estado nativo de Codex del operador. Para permitir que un propietario inspeccione y gestione los
mismos hilos nativos que se muestran en Codex Desktop y la CLI de Codex, habilite el
directorio principal de Codex del usuario:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            homeScope: "user",
          },
        },
      },
    },
  },
}
```

El modo de directorio principal del usuario admite un proceso stdio gestionado localmente o el transporte
compartido mediante socket Unix. Utiliza `$CODEX_HOME` cuando está definido y `~/.codex` en caso contrario, incluida
la autenticación nativa de Codex, la configuración, los plugins y el almacén de hilos de ese directorio principal. OpenClaw no
inyecta un perfil de autenticación de OpenClaw en este app-server.

Los turnos del propietario obtienen la herramienta `codex_threads`: permite enumerar, buscar, leer, bifurcar, cambiar el nombre,
archivar y restaurar hilos nativos. Bifurque un hilo para continuarlo en
OpenClaw; la bifurcación se adjunta a la sesión actual de OpenClaw y permanece
visible para otros clientes nativos de Codex. El archivado requiere una
confirmación explícita de que el hilo está cerrado en otros lugares. Cuando también está habilitada la supervisión,
los campos y las mutaciones de transcripciones requieren la habilitación correspondiente de
`supervision.allowRawTranscripts` o `supervision.allowWriteControls`.

No reanude ni escriba simultáneamente en el mismo hilo mediante App Servers stdio
gestionados independientes. Codex coordina los escritores activos dentro de un App Server, no
entre procesos independientes. La bifurcación es la vía segura de coexistencia para las sesiones stdio
ordinarias del directorio principal del usuario.

`appServer.homeScope: "user"` por sí solo no controla el catálogo de la flota. La detección nativa
de sesiones está habilitada mientras el plugin está activo; establezca
`sessionCatalog.enabled: false` para eliminarla de la barra lateral de OpenClaw sin
deshabilitar Codex. El catálogo utiliza una conexión de supervisión independiente; sin
ajustes de conexión `appServer` explícitos, esa conexión utiliza de forma predeterminada stdio gestionado
del directorio principal del usuario, mientras que el arnés ordinario permanece limitado al agente. Ambos recorridos respetan
los ajustes `appServer` explícitos. Establezca `homeScope: "user"`
explícitamente, como se muestra anteriormente, cuando el arnés ordinario también deba compartir el estado nativo.

## Supervisar sesiones de Codex

El mismo plugin `codex` puede enumerar las sesiones de Codex no archivadas del equipo del Gateway
y de los nodos emparejados habilitados. Una sesión almacenada o inactiva local al Gateway puede
crear un chat bloqueado a un modelo que refleje su historial persistente y acotado de mensajes del usuario y del asistente.
Su vinculación privada utiliza la conexión de supervisión para la instantánea nativa,
la rama canónica y los turnos posteriores, mientras que las sesiones ordinarias de Codex permanecen
limitadas al agente. El primer inicio canónico utiliza exactamente el modelo y el proveedor que
Codex devuelve para la bifurcación de la instantánea. Las reanudaciones posteriores dejan la selección a la
configuración nativa de Codex; el modelo externo de OpenClaw y la cadena de reserva nunca lo
sustituyen. Las filas almacenadas e inactivas pueden archivarse después de confirmar explícitamente
que no hay ningún otro ejecutor. Las fuentes activas no pueden crear una rama ni archivarse; un chat
supervisado existente aún puede abrirse. Las sesiones de nodos emparejados siguen limitadas a metadatos.

Consulte [Supervisar sesiones de Codex](/es/plugins/codex-supervision) para conocer la configuración, las reglas de
bifurcación, los límites de los nodos emparejados, la exposición de metadatos y la resolución de problemas.

## Configuración

| Necesidad                                           | Establecer                                                                                       | Dónde                              |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------ | ---------------------------------- |
| Habilitar el arnés                                  | `plugins.entries.codex.enabled: true`                                                            | Configuración de OpenClaw          |
| Ocultar la detección nativa de sesiones de Codex    | `plugins.entries.codex.config.sessionCatalog.enabled: false`                                     | Configuración del plugin de Codex  |
| Conservar la instalación de un plugin incluido en la lista de permitidos | Incluya `codex` en `plugins.allow`                                             | Configuración de OpenClaw          |
| Permitir que los turnos de OpenAI aptos utilicen Codex implícitamente | Ruta oficial HTTPS exacta de Responses/ChatGPT, sin anulación de solicitud definida, tiempo de ejecución sin definir/`auto` | Configuración del proveedor/modelo de OpenAI |
| Iniciar sesión con OAuth de ChatGPT/Codex            | `openclaw models auth login --provider openai`                                                   | Perfil de autenticación de la CLI  |
| Añadir una clave de API de respaldo para las ejecuciones de Codex | Perfil de clave de API `openai:*` incluido después de la autenticación de suscripción en `auth.order.openai` | Perfil de autenticación de la CLI + configuración de OpenClaw |
| Aplicar cierre seguro cuando Codex no esté disponible | `agentRuntime.id: "codex"` del proveedor o modelo                                              | Configuración del modelo/proveedor de OpenClaw |
| Utilizar tráfico directo de la API de OpenAI         | `agentRuntime.id: "openclaw"` del proveedor o modelo con la autenticación normal de OpenAI                    | Configuración del modelo/proveedor de OpenClaw |
| Ajustar el comportamiento de app-server              | `plugins.entries.codex.config.appServer.*`                                                       | Configuración del plugin de Codex  |
| Habilitar aplicaciones nativas de plugins de Codex   | `plugins.entries.codex.config.codexPlugins.*`                                                    | Configuración del plugin de Codex  |
| Habilitar Computer Use de Codex                      | `plugins.entries.codex.config.computerUse.*`                                                     | Configuración del plugin de Codex  |

Prefiera `auth.order.openai` para ordenar primero la suscripción y después la clave de API de respaldo.
Los identificadores existentes de perfiles de autenticación heredados de Codex y el orden de autenticación heredado de Codex son
estados heredados exclusivos de doctor; no escriba nuevas referencias GPT heredadas de Codex.

```json5
{
  auth: {
    order: {
      openai: ["openai:user@example.com", "openai:api-key-backup"],
    },
  },
}
```

Para una ruta efectiva compatible con Codex, ambos perfiles anteriores siguen siendo candidatos
para la misma ejecución de Codex. El orden de los perfiles selecciona las credenciales, no el tiempo de ejecución.
Cambiar el orden de autenticación no hace que una ruta personalizada, de Completions, HTTP o
con una anulación de solicitud sea compatible con Codex.

### Compaction

No establezca `compaction.model` ni `compaction.provider` en agentes respaldados
por Codex. Codex realiza la Compaction mediante el estado nativo de hilos de app-server, por lo que
OpenClaw ignora esas anulaciones locales del resumidor durante el tiempo de ejecución, y
`openclaw doctor --fix` las elimina cuando el agente utiliza Codex.

Lossless sigue siendo compatible como motor de contexto para el ensamblaje, la ingesta y el
mantenimiento en torno a los turnos de Codex, configurado mediante
`plugins.slots.contextEngine: "lossless-claw"` y
`plugins.entries.lossless-claw.config.summaryModel`, no mediante
`agents.defaults.compaction.provider`. `openclaw doctor --fix` migra la
forma antigua `compaction.provider: "lossless-claw"` a la ranura del motor
de contexto Lossless cuando Codex es el tiempo de ejecución activo, pero Codex nativo sigue
gestionando la Compaction. El arnés nativo de app-server admite motores de contexto
que necesitan ensamblaje previo al prompt; los backends genéricos de CLI, incluido `codex-cli`,
no proporcionan esa capacidad de host.

Para los agentes respaldados por Codex, `/compact` inicia la Compaction nativa de Codex app-server
en el hilo vinculado. OpenClaw no espera a que finalice,
no impone un tiempo de espera de OpenClaw, no reinicia el app-server compartido ni recurre a un
motor de contexto o resumidor público de OpenAI. Si la vinculación nativa del hilo de Codex
falta o está obsoleta, el comando aplica cierre seguro en lugar de cambiar silenciosamente
el backend de Compaction.

El resto de esta página trata sobre la estructura de despliegue, el enrutamiento con cierre ante fallos, la política de aprobación de Guardian, los plugins nativos de Codex y Computer Use. Para consultar las listas completas de opciones, los valores predeterminados, las enumeraciones, el descubrimiento, el aislamiento del entorno, los tiempos de espera y los campos de transporte del app-server, véase la
[referencia del harness de Codex](/es/plugins/codex-harness-reference).

## Verificar el runtime de Codex

Use `/status` en el chat donde se espera Codex. Un turno de agente de OpenAI respaldado por Codex muestra:

```text
Runtime: OpenAI Codex
```

A continuación, compruebe el estado del app-server de Codex:

```text
/codex status
/codex models
```

`/codex status` informa sobre la conectividad del app-server, la cuenta, los límites de frecuencia, los servidores MCP y las Skills. `/codex models` muestra el catálogo activo del app-server de Codex para el harness y la cuenta. Si `/status` resulta inesperado, véase
[Solución de problemas](#troubleshooting).

## Enrutamiento y selección de modelos

Mantenga separadas las referencias de proveedores y la política del runtime:

- Use `openai/gpt-*` para la selección canónica de modelos de OpenAI. El prefijo por sí solo
  nunca selecciona Codex.
- Con el runtime sin establecer o con `auto`, solo una ruta oficial HTTPS exacta de Platform Responses
  o ChatGPT Responses sin ninguna sobrescritura de solicitud definida puede seleccionar Codex
  implícitamente.
- No use referencias heredadas de Codex GPT en la configuración; ejecute `openclaw doctor --fix` para
  reparar las referencias heredadas y las fijaciones obsoletas de rutas de sesión.
- `agentRuntime.id: "codex"` convierte Codex en un requisito con cierre ante fallos para una
  ruta compatible. No convierte en compatible una ruta efectiva incompatible.
- `agentRuntime.id: "openclaw"` habilita el runtime integrado de
  OpenClaw para un proveedor o modelo cuando esto es intencional.
- `/codex ...` controla las conversaciones nativas del app-server de Codex desde el chat.
- ACP/acpx es una ruta de harness externo independiente. Úsela solo cuando el usuario
  solicite ACP/acpx o un adaptador de harness externo.

| Intención del usuario                                      | Uso                                                                                                   |
| ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Asociar el chat actual                                     | `/codex bind [thread-id] [--cwd <path>] [--model <model>] [--provider <provider>]`                    |
| Reanudar un hilo de Codex existente                        | `/codex resume <thread-id>`                                                                           |
| Enumerar o filtrar hilos de Codex                          | `/codex threads [filter]`                                                                             |
| Leer o actualizar el objetivo nativo del hilo asociado     | `/codex goal [status\|set <objective>\|pause\|resume\|block\|complete\|clear]`                        |
| Enumerar plugins nativos de Codex                          | `/codex plugins list`                                                                                 |
| Activar o desactivar un plugin nativo de Codex configurado | `/codex plugins enable <name>`, `/codex plugins disable <name>`                                       |
| Reanudar una sesión almacenada de Codex CLI como turno de nodo emparejado | `/codex sessions --host <node> [filter]`, luego `/codex resume <session-id> --host <node> --bind here` |
| Ver sesiones de Codex no archivadas en varios equipos      | Active la supervisión de Codex y abra **Sesiones de Codex**                                           |
| Cambiar el modelo, el modo rápido o los permisos del hilo asociado | `/codex model <model>`, `/codex fast [on\|off\|status]`, `/codex permissions [default\|yolo\|status]` |
| Detener o dirigir el turno activo                          | `/codex stop`, `/codex steer <text>`                                                                  |
| Desasociar la vinculación actual                           | `/codex detach` (alias `/codex unbind`)                                                               |
| Enviar únicamente comentarios sobre Codex                 | `/codex diagnostics [note]`                                                                           |
| Iniciar una tarea de ACP/acpx                              | Comandos de sesión de ACP/acpx, no `/codex`                                                               |

| Caso de uso                                      | Configuración                                                                                               | Verificación                            | Notas                                      |
| ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | --------------------------------------- | ------------------------------------------ |
| Ruta de OpenAI apta con runtime nativo de Codex | Ruta oficial HTTPS exacta de Responses/ChatGPT sin ninguna sobrescritura de solicitud definida, además del plugin `codex` activado | `/status` muestra `Runtime: OpenAI Codex` | Ruta implícita cuando el runtime no está establecido/es `auto` |
| Cierre ante fallos si Codex no está disponible  | `agentRuntime.id: "codex"` del proveedor o modelo                                                                | El turno falla en lugar de usar el runtime integrado como alternativa | Úselo para despliegues exclusivos de Codex |
| Tráfico directo mediante clave de API de OpenAI a través de OpenClaw | `agentRuntime.id: "openclaw"` del proveedor o modelo y autenticación normal de OpenAI                                      | `/status` muestra el runtime de OpenClaw        | Úselo solo cuando OpenClaw sea intencional |
| Configuración heredada                         | Referencias heredadas de Codex GPT                                                                          | `openclaw doctor --fix` la reescribe     | No escriba configuraciones nuevas de esta forma |
| Adaptador de Codex para ACP/acpx                | `sessions_spawn({ runtime: "acp" })` de ACP                                                                    | Estado de la tarea/sesión de ACP        | Independiente del harness nativo de Codex  |

`agents.defaults.imageModel` sigue la misma división de prefijos. Use `openai/gpt-*`
para la ruta normal de OpenAI y `codex/gpt-*` solo cuando la comprensión de imágenes
deba ejecutarse mediante un turno acotado del app-server de Codex. Doctor reescribe las referencias heredadas
de Codex GPT como `openai/gpt-*`.

## Patrones de despliegue

### Despliegue básico de Codex

Use la configuración de inicio rápido para un modelo de OpenAI cuya ruta oficial HTTPS
efectiva sea apta para seleccionar Codex implícitamente:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
  agents: {
    defaults: {
      model: "openai/gpt-5.6-sol",
    },
  },
}
```

### Despliegue con varios proveedores

Mantenga Claude como agente predeterminado y añada un agente de Codex con nombre:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
  agents: {
    defaults: {
      model: "anthropic/claude-opus-4-6",
    },
    list: [
      {
        id: "main",
        default: true,
        model: "anthropic/claude-opus-4-6",
      },
      {
        id: "codex",
        name: "Codex",
        model: "openai/gpt-5.6-sol",
      },
    ],
  },
}
```

El agente `main` usa su ruta de proveedor normal. El agente `codex` usa el
app-server de Codex mientras su ruta efectiva de OpenAI siga siendo compatible; añada
`agentRuntime.id: "codex"` explícito y específico del modelo cuando esto deba ser un requisito
con cierre ante fallos.

### Despliegue de Codex con cierre ante fallos

Una ruta oficial HTTPS exacta y apta de OpenAI puede resolverse como Codex cuando el
plugin incluido está disponible. Añada una política explícita del runtime para una regla
de cierre ante fallos definida:

```json5
{
  models: {
    providers: {
      openai: {
        agentRuntime: {
          id: "codex",
        },
      },
    },
  },
  agents: {
    defaults: {
      model: "openai/gpt-5.6-sol",
    },
  },
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
}
```

Cuando Codex está forzado, OpenClaw falla de forma anticipada si la ruta efectiva no está declarada
como compatible con Codex, el plugin está desactivado, el app-server es demasiado antiguo o el
app-server no puede iniciarse.

## Política del app-server

De forma predeterminada, el plugin inicia localmente el binario administrado de Codex de OpenClaw con
transporte stdio. Establezca `appServer.command` solo para ejecutar intencionalmente un
ejecutable diferente. Codex clasifica el transporte WebSocket como experimental
y no compatible; úselo únicamente para pruebas que no sean de producción con un app-server
que ya se ejecute en otra ubicación:

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
          },
        },
      },
    },
  },
}
```

Las sesiones locales del app-server mediante stdio adoptan de forma predeterminada la postura del operador local
de confianza: `approvalPolicy: "never"`, `approvalsReviewer: "user"` y
`sandbox: "danger-full-access"`. Si los requisitos locales de Codex no permiten esa
postura YOLO implícita, OpenClaw selecciona en su lugar permisos permitidos de Guardian.
Cuando un sandbox de OpenClaw está activo para la sesión, OpenClaw
desactiva Code Mode nativo de Codex, los servidores MCP del usuario y la ejecución de plugins
respaldados por aplicaciones durante ese turno, en lugar de depender del sandbox del lado del host de Codex.
En su lugar, el acceso al shell se realiza mediante herramientas dinámicas respaldadas por el sandbox de OpenClaw,
como `sandbox_exec` y `sandbox_process`, cuando las herramientas normales de ejecución/proceso
están disponibles.

Use el modo de ejecución normalizado de OpenClaw para la revisión automática nativa de Codex antes de
escapar del sandbox o conceder permisos adicionales:

```json5
{
  tools: {
    exec: {
      mode: "auto",
    },
  },
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
}
```

Para las sesiones del app-server de Codex, `tools.exec.mode: "auto"` se asigna a las
aprobaciones revisadas por Guardian de Codex: normalmente `approvalPolicy: "on-request"`,
`approvalsReviewer: "auto_review"` y `sandbox: "workspace-write"` cuando
los requisitos locales permiten esos valores. En `tools.exec.mode: "auto"`,
OpenClaw no conserva las sobrescrituras heredadas no seguras de Codex `approvalPolicy: "never"` o
`sandbox: "danger-full-access"`; use `tools.exec.mode: "full"` para
una postura intencional de Codex sin aprobaciones. El ajuste preestablecido heredado
`plugins.entries.codex.config.appServer.mode: "guardian"` sigue
funcionando, pero `tools.exec.mode: "auto"` es la superficie normalizada de OpenClaw.

Para consultar la comparación entre modos con las aprobaciones de ejecución del host y los
permisos de ACPX, véase [Modos de permisos](/es/tools/permission-modes). Para consultar todos los
campos del app-server, el orden de autenticación, el aislamiento del entorno y el comportamiento de los tiempos de espera,
véase la [referencia del harness de Codex](/es/plugins/codex-harness-reference).

## Comandos y diagnóstico

El plugin `codex` registra `/codex` como comando de barra en cualquier canal que
admita los comandos de texto de OpenClaw.

La ejecución y el control nativos requieren un propietario o un cliente de Gateway `operator.admin`:
asociar o reanudar hilos, enviar o detener turnos, cambiar el modelo, el modo rápido o el estado de permisos,
ejecutar Compaction o revisiones y desasociar una vinculación. Los demás remitentes autorizados conservan
los comandos de solo lectura para consultar el estado, la ayuda, la cuenta, los modelos, los hilos, el objetivo
nativo, los servidores MCP, las Skills y las vinculaciones.

Formas habituales:

- `/codex status` comprueba la conectividad del servidor de aplicaciones, los modelos, la cuenta, los límites de
  uso, los servidores MCP y las Skills.
- `/codex models` enumera los modelos activos del servidor de aplicaciones de Codex.
- `/codex threads [filter]` enumera los hilos recientes del servidor de aplicaciones de Codex.
- `/codex goal` lee o actualiza el objetivo nativo de Codex del hilo adjunto. La continuación automática de objetivos de Codex permanece deshabilitada; OpenClaw aún no controla turnos posteriores autónomos.
- `/codex resume <thread-id>` vincula la sesión actual de OpenClaw a un
  hilo de Codex existente.
- `/codex bind [thread-id] [--cwd <path>] [--model <model>] [--provider <provider>]`
  vincula el chat actual.
- `/codex detach` (o `/codex unbind`) desvincula la asociación actual.
- `/codex binding` describe la asociación actual.
- `/codex stop` detiene el turno activo; `/codex steer <text>` lo redirige.
- `/codex model <model>`, `/codex fast [on|off|status]` y
  `/codex permissions [default|yolo|status]` cambian el estado de cada conversación.
- `/codex compact` solicita al servidor de aplicaciones de Codex que compacte el hilo adjunto.
- `/codex review` inicia la revisión nativa de Codex para el hilo adjunto.
- `/codex diagnostics [note]` solicita confirmación antes de enviar comentarios de Codex sobre el
  hilo adjunto.
- `/codex account` muestra el estado de la cuenta y de los límites de uso.
- `/codex mcp` enumera el estado de los servidores MCP del servidor de aplicaciones de Codex.
- `/codex skills` enumera las Skills del servidor de aplicaciones de Codex.
- `/codex plugins list`, `/codex plugins enable <name>` y
  `/codex plugins disable <name>` administran los plugins nativos de Codex configurados.
- `/codex computer-use [status|install]` administra el uso del ordenador de Codex.
- `/codex help` enumera el árbol de comandos completo.

Para la mayoría de los informes de soporte, comience con `/diagnostics [note]` en la
conversación donde ocurrió el error. Crea un informe de diagnóstico del Gateway
y, para las sesiones del entorno de ejecución de Codex, solicita aprobación para enviar el
paquete pertinente de comentarios de Codex. Consulte
[Exportación de diagnósticos](/es/gateway/diagnostics) para conocer el modelo de privacidad y el comportamiento
de los chats grupales. Use `/codex diagnostics [note]` solo cuando quiera
cargar específicamente los comentarios de Codex del hilo adjunto actualmente sin
el paquete completo de diagnósticos del Gateway.

### Inspeccionar hilos de Codex localmente

A menudo, la forma más rápida de inspeccionar una ejecución defectuosa de Codex es abrir directamente el
hilo nativo de Codex:

```bash
codex resume <thread-id>
```

Obtenga el identificador del hilo de la respuesta completada de `/diagnostics`, `/codex binding`
o `/codex threads [filter]`.

Para conocer los mecanismos de carga y los límites de diagnóstico en el nivel de ejecución, consulte
[Entorno de ejecución de Codex](/es/plugins/codex-harness-runtime#codex-feedback-upload).

### Orden de autenticación

En el directorio de inicio predeterminado de cada agente, la autenticación se selecciona en este orden:

1. Perfiles de autenticación de OpenAI ordenados para el agente, preferiblemente en
   `auth.order.openai`. Ejecute `openclaw doctor --fix` para migrar los identificadores de perfiles de
   autenticación heredados de Codex y el orden de autenticación heredado de Codex.
2. La cuenta existente del servidor de aplicaciones en el directorio de inicio de Codex de ese agente.
3. Solo para inicios locales del servidor de aplicaciones mediante stdio, `CODEX_API_KEY` y, después,
   `OPENAI_API_KEY`, cuando no hay ninguna cuenta del servidor de aplicaciones y aún
   se requiere autenticación de OpenAI.

Cuando OpenClaw detecta un perfil de autenticación de Codex basado en una suscripción de ChatGPT,
elimina `CODEX_API_KEY` y `OPENAI_API_KEY` del proceso secundario de Codex
iniciado. Esto mantiene disponibles las claves de API del Gateway para las incrustaciones o
los modelos directos de OpenAI sin provocar que los turnos nativos del servidor de aplicaciones de Codex se
facturen por accidente mediante la API. Los perfiles explícitos de clave de API de Codex y el
uso alternativo local de claves del entorno mediante stdio utilizan el inicio de sesión del servidor de aplicaciones en lugar del
entorno heredado del proceso secundario. Las conexiones WebSocket al servidor de aplicaciones no reciben el uso
alternativo de claves de API del entorno del Gateway; use un perfil de autenticación explícito o la
cuenta propia del servidor de aplicaciones remoto.

Si un perfil de suscripción alcanza un límite de uso de Codex, OpenClaw registra la
hora de restablecimiento cuando Codex la notifica e intenta usar el siguiente perfil de autenticación
ordenado para la misma ejecución de Codex. Cuando pasa la hora de restablecimiento, el perfil de
suscripción vuelve a ser apto sin cambiar el modelo `openai/gpt-*`
seleccionado ni el entorno de ejecución de Codex.

Cuando hay plugins nativos de Codex configurados, OpenClaw instala o actualiza
esos plugins mediante el servidor de aplicaciones conectado antes de exponer las aplicaciones propiedad
de los plugins al hilo de Codex. `app/list` sigue siendo la fuente de referencia de los
identificadores de aplicaciones, la accesibilidad y los metadatos, pero OpenClaw controla la decisión de
habilitación para cada hilo: si la política permite una aplicación accesible de la lista, OpenClaw
envía `thread/start.config.apps[appId].enabled = true` incluso cuando `app/list`
indica actualmente que esa aplicación está deshabilitada. Esta ruta no inventa la
instalación de aplicaciones para identificadores desconocidos; OpenClaw solo activa plugins del mercado
con `plugin/install` y después actualiza el inventario.

### Aislamiento del entorno

Para los inicios locales del servidor de aplicaciones mediante stdio, OpenClaw establece `CODEX_HOME` en un
directorio específico de cada agente para que la configuración, los archivos de autenticación y cuenta, la caché y los datos
de plugins, y el estado nativo de los hilos de Codex no lean ni escriban de forma predeterminada
en el `~/.codex` personal del operador. OpenClaw conserva el `HOME` normal del proceso;
los subprocesos de las ejecuciones de Codex aún pueden encontrar la configuración y los tokens del directorio de inicio del usuario, y
Codex puede detectar entradas compartidas de `$HOME/.agents/skills` y
`$HOME/.agents/plugins/marketplace.json`. Con
`appServer.homeScope: "user"`, OpenClaw utiliza en su lugar el directorio de inicio nativo de Codex del usuario
y su cuenta existente sin insertar un perfil de autenticación de OpenClaw.

Si un despliegue requiere un aislamiento adicional del entorno, añada esas
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

`appServer.clearEnv` solo afecta al proceso secundario del servidor de aplicaciones de Codex
iniciado. OpenClaw elimina `CODEX_HOME` y `HOME` de esta lista durante
la normalización del inicio local: `CODEX_HOME` sigue apuntando al ámbito del
agente o usuario seleccionado, y `HOME` se sigue heredando para que los subprocesos puedan usar
el estado normal del directorio de inicio del usuario.

### Herramientas dinámicas y búsqueda web

Las herramientas dinámicas de Codex usan de forma predeterminada la carga `searchable`. Normalmente, OpenClaw
no expone herramientas dinámicas que duplican operaciones nativas de Codex en el espacio de trabajo:
`read`, `write`, `edit`, `apply_patch`, `exec`, `process`, `update_plan`,
`get_goal`, `create_goal`, `update_goal`, `tool_call`, `tool_describe`,
`tool_search` y `tool_search_code`. Las operaciones de objetivos siguen siendo nativas de Codex,
por lo que OpenClaw no proyecta un segundo almacén de objetivos en los turnos de Codex. La mayoría de las
herramientas de integración restantes de OpenClaw, como mensajería, contenido multimedia, Cron,
navegador, nodos, Gateway y `heartbeat_respond`, están disponibles mediante
la búsqueda de herramientas de Codex en el espacio de nombres `openclaw`, lo que reduce el contexto inicial
del modelo. El uso alternativo del shell para turnos restringidos es la excepción para
`exec` y `process` cuando una lista de permitidos finita deshabilita el modo de código nativo;
las listas de permitidos del entorno de ejecución y `codexDynamicToolsExclude` siguen aplicándose.

Las herramientas marcadas con `catalogMode: "direct-only"`, incluida la herramienta `computer`
de OpenClaw, utilizan en su lugar el espacio de nombres `openclaw_direct`. Codex trata ese espacio de nombres
como `DirectModelOnly`, por lo que esas herramientas permanecen visibles directamente para el modelo en los hilos
normales y exclusivos del modo de código, en lugar de atravesar llamadas anidadas de `tools.*` del modo de código.

La búsqueda web utiliza de forma predeterminada la herramienta alojada `web_search` de Codex cuando la búsqueda está
habilitada y no se ha seleccionado ningún proveedor administrado. La búsqueda alojada nativa y
la herramienta dinámica administrada `web_search` de OpenClaw son mutuamente excluyentes para que
la búsqueda administrada no pueda eludir las restricciones nativas de dominios. OpenClaw utiliza la
herramienta administrada cuando la búsqueda alojada no está disponible, se deshabilita explícitamente o
se sustituye por un proveedor administrado seleccionado. OpenClaw mantiene deshabilitada la
extensión independiente `web.run` de Codex porque el tráfico de producción del servidor de aplicaciones rechaza
su espacio de nombres `web` definido por el usuario. `tools.web.search.enabled: false`
deshabilita ambas rutas, al igual que las ejecuciones exclusivas de LLM con las herramientas deshabilitadas. Codex trata
`"cached"` como una preferencia y la resuelve como acceso externo activo para
los turnos sin restricciones del servidor de aplicaciones. El uso alternativo administrado automático se cierra de forma segura cuando
se establecen `allowedDomains` nativas, de modo que no se pueda eludir la lista de permitidos.
Los cambios persistentes de la política de búsqueda efectiva rotan el hilo de Codex vinculado
antes del siguiente turno; las restricciones transitorias de cada turno utilizan un hilo
restringido temporal y conservan la vinculación existente para reanudarla posteriormente.

`sessions_yield` y las respuestas de origen exclusivas de la herramienta de mensajes siguen siendo directas porque
son contratos de control de turnos. `sessions_spawn` sigue siendo localizable mediante búsqueda para que
la `spawn_agent` nativa de Codex continúe siendo la superficie principal de subagentes de Codex,
mientras que la delegación explícita de OpenClaw o ACP sigue disponible mediante el
espacio de nombres de herramientas dinámicas `openclaw`. Las instrucciones de colaboración de Heartbeat
indican a Codex que busque `heartbeat_respond` antes de finalizar un turno de Heartbeat
cuando la herramienta aún no está cargada.

Establezca `codexDynamicToolsLoading: "direct"` solo al conectarse a un
servidor de aplicaciones de Codex personalizado que no pueda buscar herramientas dinámicas diferidas o al
depurar la carga completa de herramientas.

### Campos de configuración

Campos de nivel superior admitidos del plugin de Codex:

| Campo                      | Valor predeterminado        | Significado                                                                                  |
| -------------------------- | -------------- | ---------------------------------------------------------------------------------------- |
| `codexDynamicToolsLoading` | `"searchable"` | Use `"direct"` para colocar las herramientas dinámicas de OpenClaw directamente en el contexto inicial de herramientas de Codex. |
| `codexDynamicToolsExclude` | `[]`           | Nombres adicionales de herramientas dinámicas de OpenClaw que se omitirán de los turnos del servidor de aplicaciones de Codex.              |
| `codexPlugins`             | deshabilitado       | Compatibilidad nativa de plugins y aplicaciones de Codex para plugins seleccionados migrados e instalados desde el código fuente.           |
| `sessionCatalog`           | habilitado        | Detección en la barra lateral de sesiones nativas de Codex en este Gateway y en los nodos emparejados aptos.   |
| `supervision`              | deshabilitado       | Política de transcripción y control de escritura de sesiones nativas orientada a agentes.                         |

Campos admitidos de `appServer`:

| Campo                                         | Valor predeterminado                                                | Significado                                                                                                                                                                                                                                                                                                                                                                                         |
| --------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                                   | `"stdio"`                                              | `"stdio"` inicia Codex; el valor explícito `"unix"` se conecta al socket de control local; `"websocket"` se conecta a `url`.                                                                                                                                                                                                                                                                                |
| `homeScope`                                   | `"agent"`                                              | `"agent"` aísla el estado ordinario del arnés para cada agente de OpenClaw. `"user"` es una opción de activación explícita que comparte el `$CODEX_HOME` o `~/.codex` nativo, utiliza la autenticación nativa y habilita la gestión de hilos solo para el propietario. El ámbito de usuario admite stdio local o transporte Unix. Para la conexión de supervisión independiente, un valor sin establecer se resuelve como `"user"` para stdio o Unix y como `"agent"` para WebSocket.     |
| `command`                                     | binario de Codex administrado                                   | Ejecutable para el transporte stdio. Déjelo sin establecer para utilizar el binario administrado; establézcalo únicamente para una sustitución explícita.                                                                                                                                                                                                                                                                                    |
| `args`                                        | `["app-server", "--listen", "stdio://"]`               | Argumentos para el transporte stdio.                                                                                                                                                                                                                                                                                                                                                                  |
| `url`                                         | sin establecer                                                  | URL del servidor de aplicaciones WebSocket o URL `unix://`. Una ruta Unix explícita vacía selecciona el socket de control canónico del directorio de inicio del usuario.                                                                                                                                                                                                                                                                          |
| `authToken`                                   | sin establecer                                                  | Token de portador para el transporte WebSocket. Acepta una cadena literal o SecretInput, como `${CODEX_APP_SERVER_TOKEN}`.                                                                                                                                                                                                                                                                              |
| `headers`                                     | `{}`                                                   | Encabezados WebSocket adicionales. Los valores de los encabezados aceptan cadenas literales o valores SecretInput, por ejemplo, `x-codex-client-session-token: "${CODEX_CLIENT_SESSION_TOKEN}"`.                                                                                                                                                                                                                               |
| `clearEnv`                                    | `[]`                                                   | Nombres de variables de entorno adicionales que se eliminan del proceso de servidor de aplicaciones stdio iniciado después de que OpenClaw construya su entorno heredado. OpenClaw conserva el `CODEX_HOME` seleccionado y el `HOME` heredado para las ejecuciones locales.                                                                                                                                                                           |
| `codeModeOnly`                                | `false`                                                | Activa la superficie de herramientas exclusiva del modo de código de Codex. Las herramientas dinámicas ordinarias de OpenClaw siguen disponibles mediante llamadas `tools.*` anidadas; las herramientas `openclaw_direct` permanecen visibles directamente para el modelo.                                                                                                                                                                                                             |
| `remoteWorkspaceRoot`                         | sin establecer                                                  | Raíz remota del espacio de trabajo del servidor de aplicaciones Codex. Cuando se establece, OpenClaw deduce la raíz local del espacio de trabajo a partir del espacio de trabajo de OpenClaw resuelto, conserva el sufijo del cwd actual bajo esta raíz remota y envía a Codex únicamente el cwd final del servidor de aplicaciones. Si el cwd se encuentra fuera de la raíz resuelta del espacio de trabajo de OpenClaw, OpenClaw aplica un cierre seguro en lugar de enviar una ruta local del Gateway al servidor de aplicaciones remoto. |
| `requestTimeoutMs`                            | `60000`                                                | Tiempo de espera para las llamadas del plano de control del servidor de aplicaciones.                                                                                                                                                                                                                                                                                                                                                     |
| `turnCompletionIdleTimeoutMs`                 | `60000`                                                | Intervalo de inactividad después de que Codex acepta un turno o tras una solicitud del servidor de aplicaciones limitada al turno, mientras OpenClaw espera `turn/completed`.                                                                                                                                                                                                                                                                    |
| `turnAssistantCompletionIdleTimeoutMs`        | `10000`                                                | Intervalo de inactividad después de que un elemento final o no relacionado con comentarios del asistente, o la finalización sin procesar del asistente previa a una herramienta, activa la liberación de la salida del asistente mientras OpenClaw sigue esperando `turn/completed`. Aumentarlo concede a Codex más tiempo para emitir `turn/completed` antes de que OpenClaw interrumpa y libere el carril de la sesión.                                                                                            |
| `postToolRawAssistantCompletionIdleTimeoutMs` | `300000`                                               | Protección de inactividad de finalización y progreso utilizada después de una transferencia a una herramienta, la finalización de una herramienta nativa, el progreso sin procesar del asistente posterior a una herramienta, la finalización del razonamiento sin procesar o el progreso del razonamiento, mientras OpenClaw espera `turn/completed`. Utilice esta opción para cargas de trabajo de confianza o pesadas en las que la síntesis posterior a una herramienta pueda permanecer legítimamente inactiva durante más tiempo que el límite de liberación final del asistente.                                |
| `mode`                                        | `"yolo"` salvo que los requisitos locales de Codex no permitan YOLO | Preajuste para la ejecución YOLO o revisada por el guardián. Los requisitos de stdio local que omiten `danger-full-access`, la aprobación `never` o el revisor `user` hacen que el valor predeterminado implícito sea el guardián.                                                                                                                                                                                                           |
| `approvalPolicy`                              | `"never"` o una política de aprobación del guardián permitida       | Política de aprobación nativa de Codex enviada al iniciar o reanudar el hilo, o al comenzar el turno. Los valores predeterminados del guardián prefieren `"on-request"` cuando se permite.                                                                                                                                                                                                                                                                            |
| `sandbox`                                     | `"danger-full-access"` o un entorno aislado del guardián permitido  | Modo de entorno aislado nativo de Codex enviado al iniciar o reanudar el hilo. Los valores predeterminados del guardián prefieren `"workspace-write"` cuando se permite; de lo contrario, `"read-only"`. Cuando hay un entorno aislado de OpenClaw activo, los turnos `danger-full-access` utilizan `workspace-write` de Codex con acceso de red derivado de la configuración de salida del entorno aislado de OpenClaw.                                                                                     |
| `approvalsReviewer`                           | `"user"` o un revisor del guardián permitido               | Utilice `"auto_review"` para permitir que Codex revise las solicitudes de aprobación nativas cuando esté permitido; de lo contrario, utilice `guardian_subagent` o `user`. `guardian_subagent` sigue siendo un alias heredado.                                                                                                                                                                                                                              |
| `serviceTier`                                 | sin establecer                                                  | Nivel de servicio opcional del servidor de aplicaciones Codex. `"priority"` habilita el enrutamiento en modo rápido, `"flex"` solicita el procesamiento flexible, `null` elimina la sustitución y el valor heredado `"fast"` se acepta como `"priority"`.                                                                                                                                                                                                 |
| `networkProxy`                                | deshabilitado                                               | Activa la conectividad de red mediante perfiles de permisos de Codex para los comandos del servidor de aplicaciones. OpenClaw define la configuración `permissions.<profile>.network` seleccionada y la selecciona con `default_permissions` en lugar de enviar `sandbox`.                                                                                                                                                                             |
| `experimental.sandboxExecServer`              | `false`                                                | Opción de activación preliminar que registra un entorno Codex respaldado por el entorno aislado de OpenClaw en el servidor de aplicaciones Codex compatible, de modo que la ejecución nativa de Codex pueda realizarse dentro del entorno aislado de OpenClaw activo.                                                                                                                                                                                                            |

`appServer.networkProxy` es explícito porque cambia el contrato del entorno aislado de Codex. Cuando se habilita, OpenClaw también establece `features.network_proxy.enabled`
y `default_permissions` en la configuración del hilo de Codex para que el perfil
de permisos generado pueda iniciar las redes administradas por Codex. De forma predeterminada, OpenClaw
genera un nombre de perfil `openclaw-network-<fingerprint>` resistente a colisiones
a partir del cuerpo del perfil; use `profileName` solo cuando se requiera un nombre local estable.

```json5
{
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
              unixSockets: {
                "/tmp/proxy.sock": "allow",
                "/tmp/blocked.sock": "none",
              },
              allowUpstreamProxy: true,
              proxyUrl: "http://127.0.0.1:3128",
            },
          },
        },
      },
    },
  },
}
```

Si el entorno de ejecución normal de app-server fuera `danger-full-access`, habilitar
`networkProxy` utiliza acceso al sistema de archivos al estilo del espacio de trabajo para el perfil
de permisos generado: la aplicación de las reglas de red administrada por Codex consiste en redes
aisladas, por lo que un perfil de acceso completo no protegería el tráfico saliente.
Las entradas de dominio utilizan `allow` o `deny`; las entradas de sockets Unix utilizan los valores
`allow` o `none` de Codex.

### Tiempos de espera de llamadas dinámicas a herramientas

Las llamadas dinámicas a herramientas propiedad de OpenClaw se limitan independientemente de
`appServer.requestTimeoutMs`: las solicitudes `item/tool/call` de Codex utilizan de forma predeterminada un supervisor
de OpenClaw de 90 segundos. Un argumento positivo `timeoutMs` por llamada
amplía o reduce el límite de esa herramienta específica, con un máximo de 600000 ms.
La herramienta `image_generate` utiliza `agents.defaults.mediaModels.image.timeoutMs`
cuando la llamada a la herramienta no proporciona su propio tiempo de espera, o el valor predeterminado
de 120 segundos para la generación de imágenes en caso contrario. La herramienta de comprensión multimedia `image`
utiliza el valor `timeoutSeconds` de la entrada `tools.media.models[]` seleccionada compatible con imágenes o su valor predeterminado de 60 segundos para contenido multimedia; para
la comprensión de imágenes, ese tiempo de espera se aplica a la propia solicitud y no se
reduce por el trabajo de preparación previo. Cuando se agota el tiempo de espera, OpenClaw interrumpe la señal
de la herramienta cuando es compatible y devuelve a Codex una respuesta fallida de herramienta dinámica
para que el turno pueda continuar en lugar de dejar la sesión en `processing`.
Este supervisor constituye el límite dinámico exterior de `item/tool/call`; los tiempos de espera de solicitud
específicos del proveedor se ejecutan dentro de esa llamada y mantienen su propia semántica de tiempo de espera.

Después de que Codex acepte un turno y después de que OpenClaw responda a una solicitud
de app-server limitada al turno, el entorno espera que Codex avance en el turno actual
y termine finalmente el turno nativo con `turn/completed`. Si
app-server permanece inactivo durante `appServer.turnCompletionIdleTimeoutMs`, OpenClaw
intenta interrumpir el turno de Codex, registra un diagnóstico de tiempo de espera y
libera la vía de sesión de OpenClaw para que los mensajes de chat posteriores no queden
en cola detrás de un turno nativo obsoleto. La mayoría de las notificaciones no terminales del
mismo turno desactivan este breve supervisor porque Codex ha demostrado que el turno
sigue activo.

Las transferencias a herramientas utilizan un límite de inactividad posterior a la herramienta más prolongado: después de que OpenClaw devuelve una
respuesta `item/tool/call`, después de que se completan elementos de herramientas nativas como
`commandExecution`, después de finalizaciones `custom_tool_call_output` sin procesar
y después de avances del asistente sin procesar posteriores a la herramienta, finalizaciones del razonamiento
sin procesar o avances del razonamiento. La protección utiliza
`appServer.postToolRawAssistantCompletionIdleTimeoutMs` cuando está configurado y
de forma predeterminada usa cinco minutos en caso contrario; ese mismo límite también amplía el
supervisor de progreso durante el intervalo silencioso de síntesis antes de que Codex emita el
siguiente evento del turno actual. Las notificaciones globales de app-server, como las
actualizaciones de límites de frecuencia, no reinician el progreso de inactividad del turno. Las finalizaciones del razonamiento,
las finalizaciones `agentMessage` de comentarios y el razonamiento sin procesar previo a la herramienta o
el progreso del asistente pueden ir seguidos de una respuesta final automática, por lo que utilizan
la protección de respuesta posterior al progreso en lugar de liberar inmediatamente la vía de sesión.

Solo los elementos `agentMessage` completados finales o que no sean comentarios y las finalizaciones sin procesar
del asistente previas a la herramienta activan la liberación por salida del asistente: si Codex queda
inactivo sin `turn/completed`, OpenClaw intenta interrumpir el turno nativo
y libera la vía de sesión. Si otra supervisión del turno gana esa carrera de liberación,
OpenClaw sigue aceptando el elemento final completado del asistente una vez que ya no
queda activa ninguna solicitud nativa, elemento ni finalización de herramienta dinámica y la
liberación por salida del asistente sigue perteneciendo al último elemento completado, sin
ninguna finalización posterior de elementos. Esto puede conservar la respuesta final después de
completarse el trabajo de las herramientas sin reproducir el turno. Los deltas parciales del asistente,
las respuestas anteriores obsoletas y las finalizaciones posteriores vacías no cumplen los requisitos.

Los fallos reproducibles de forma segura de app-server mediante stdio, incluidos los tiempos de espera
por inactividad al completar el turno sin pruebas del asistente, de herramientas, de elementos activos
ni de efectos secundarios, se reintentan una vez mediante un nuevo intento de app-server. Los tiempos de espera
no seguros siguen retirando el cliente de app-server bloqueado y liberando la vía de sesión de OpenClaw;
también eliminan la vinculación obsoleta del hilo nativo en lugar de reproducirse
automáticamente. Los tiempos de espera del supervisor de finalización muestran texto específico de Codex:
los casos reproducibles de forma segura indican que la respuesta puede estar incompleta, mientras que los casos
no seguros indican al usuario que verifique el estado actual antes de reintentar. Los diagnósticos públicos
de tiempo de espera incluyen campos estructurales como el último método de notificación de app-server,
el id/tipo/rol del elemento de respuesta sin procesar del asistente, los recuentos de solicitudes/elementos
activos y el estado de supervisión activado; cuando la última notificación es un
elemento de respuesta sin procesar del asistente, también incluyen una vista previa limitada del texto
del asistente. No incluyen contenido sin procesar de prompts ni de herramientas.

### Anulaciones de entorno para pruebas locales

- `OPENCLAW_CODEX_APP_SERVER_BIN` omite el binario administrado cuando
  `appServer.command` no está definido.
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` se eliminó. Use
`plugins.entries.codex.config.appServer.mode: "guardian"` en su lugar, o
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` para una prueba local puntual. Se
prefiere la configuración para implementaciones reproducibles porque mantiene el comportamiento
del plugin en el mismo archivo revisado que el resto de la configuración del entorno de Codex.

## Plugins nativos de Codex

La compatibilidad con plugins nativos de Codex utiliza las propias capacidades de aplicaciones y plugins
de app-server de Codex en el mismo hilo de Codex que el turno del entorno de OpenClaw. OpenClaw
no traduce los plugins de Codex en herramientas dinámicas sintéticas `codex_plugin_*` de OpenClaw.

`codexPlugins` afecta únicamente a las sesiones que seleccionan el entorno nativo de Codex.
No afecta a las ejecuciones del entorno integrado, las ejecuciones normales del proveedor OpenAI, las vinculaciones
de conversaciones ACP ni otros entornos.

Configuración mínima migrada:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          codexPlugins: {
            enabled: true,
            allow_destructive_actions: true,
            plugins: {
              "google-calendar": {
                enabled: true,
                marketplaceName: "openai-curated",
                pluginName: "google-calendar",
              },
            },
          },
        },
      },
    },
  },
}
```

La configuración de aplicaciones del hilo se calcula cuando OpenClaw establece una sesión del entorno
de Codex o sustituye una vinculación obsoleta del hilo de Codex; no se vuelve a calcular en
cada turno. Después de cambiar `codexPlugins`, use `/new`, `/reset` o reinicie
el gateway para que las futuras sesiones del entorno de Codex se inicien con el conjunto de aplicaciones
actualizado.

Para obtener información sobre la elegibilidad para la migración, el inventario de aplicaciones, la política de acciones destructivas,
las solicitudes de información y los diagnósticos de plugins nativos, consulte
[Plugins nativos de Codex](/es/plugins/codex-native-plugins).

El acceso a aplicaciones y plugins del lado de OpenAI está controlado por la cuenta de Codex
con sesión iniciada y, para los espacios de trabajo Business y Enterprise/Edu, por los controles
de aplicaciones del espacio de trabajo. Consulte
[Uso de Codex con su plan de ChatGPT](https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan)
para obtener una descripción general de OpenAI sobre los controles de cuentas y espacios de trabajo.

## Uso del ordenador

El uso del ordenador tiene su propia guía de configuración:
[Uso del ordenador con Codex](/es/plugins/codex-computer-use).

En resumen: OpenClaw no incluye la aplicación de control del escritorio ni ejecuta
acciones de escritorio por sí mismo. Prepara app-server de Codex, verifica que el
servidor MCP `computer-use` esté disponible y, a continuación, permite que Codex controle las llamadas
a herramientas MCP nativas durante los turnos en modo Codex.

## Límites del entorno de ejecución

El entorno de Codex cambia únicamente el ejecutor de agentes integrado de bajo nivel.

- Las herramientas dinámicas de OpenClaw son compatibles. Codex solicita a OpenClaw que ejecute
  esas herramientas, por lo que OpenClaw permanece en la ruta de ejecución.
- Las herramientas nativas de shell, parches, MCP y aplicaciones de Codex son propiedad de Codex.
  OpenClaw puede observar o bloquear determinados eventos nativos mediante el
  relé compatible, pero no reescribe los argumentos de las herramientas nativas.
- Codex controla la Compaction nativa. OpenClaw mantiene una copia de la transcripción para
  el historial del canal, la búsqueda, `/new`, `/reset` y futuros cambios de modelo o entorno,
  pero no sustituye la Compaction de Codex por un resumidor de OpenClaw o
  del motor de contexto.
- La generación multimedia, la comprensión multimedia, la conversión de texto a voz, las aprobaciones y la salida
  de herramientas de mensajería continúan mediante la configuración correspondiente del proveedor/modelo de OpenClaw.
- `tool_result_persist` se aplica a los resultados de herramientas de transcripción propiedad de OpenClaw,
  no a los registros de resultados de herramientas nativas de Codex.

Para obtener información sobre las capas de hooks, las superficies V1 compatibles, la gestión nativa de permisos, la dirección
de colas, los mecanismos de carga de comentarios de Codex y los detalles de Compaction, consulte
[Entorno de ejecución de Codex](/es/plugins/codex-harness-runtime).

## Solución de problemas

**Codex no aparece como un proveedor `/model` normal:** es lo esperado para las configuraciones
nuevas. Seleccione un modelo `openai/gpt-*`, habilite
`plugins.entries.codex.enabled` y compruebe si `plugins.allow` excluye
`codex`.

**OpenClaw utiliza el entorno integrado en lugar de Codex:** confirme que la ruta efectiva
sea una ruta oficial exacta de Platform Responses o ChatGPT Responses mediante HTTPS,
que no tenga ninguna anulación de solicitud creada y que el plugin de Codex esté instalado y
habilitado. El prefijo `openai/gpt-*` por sí solo no es suficiente. Para obtener una prueba estricta durante
las pruebas, establezca `agentRuntime.id: "codex"` en el proveedor o el modelo; el uso forzado de Codex falla
en lugar de recurrir a una alternativa cuando la ruta o el entorno son incompatibles.

**El entorno de ejecución de OpenAI Codex recurre a la ruta de la clave de API:** recopile un extracto
censurado del gateway que muestre el modelo, el entorno de ejecución, el proveedor seleccionado y
el fallo. Solicite a los colaboradores afectados que ejecuten este comando de solo lectura en su
host de OpenClaw:

```bash
(
  pattern='openai/gpt-5\.[45]|openai[-]codex|agentRuntime(\.id)?|harnessRuntime|Runtime: OpenAI Codex|legacy OpenAI Codex prefix|resolveSelectedOpenAIRuntimeProvider|candidateProvider[": ]+openai|status[": ]+401|Incorrect API key|No API key|api-key path|API-key path|OAuth'

  if ls /tmp/openclaw/openclaw-*.log >/dev/null 2>&1; then
    grep -E -i -n "$pattern" /tmp/openclaw/openclaw-*.log 2>/dev/null || true
  else
    journalctl --user -u openclaw-gateway --since today --no-pager 2>/dev/null \
      | grep -E -i "$pattern" || true
  fi
) | sed -E \
    -e 's/(Authorization: Bearer )[A-Za-z0-9._~+\/-]+/\1[REDACTED]/Ig' \
    -e 's/(Bearer )[A-Za-z0-9._~+\/-]+/\1[REDACTED]/Ig' \
    -e 's/(api[_ -]?key[=: ]+)[^ ,}"]+/\1[REDACTED]/Ig' \
    -e 's/(OPENAI_API_KEY[=: ]+)[^ ,}"]+/\1[REDACTED]/Ig' \
    -e 's/sk-[A-Za-z0-9_-]{12,}/sk-[REDACTED]/g' \
    -e 's/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/[EMAIL-REDACTED]/g' \
  | tail -200
```

Los extractos útiles suelen incluir `openai/gpt-5.6-sol` o `openai/gpt-5.6-luna`,
`Runtime: OpenAI Codex`, `agentRuntime.id` o `harnessRuntime`,
`candidateProvider: "openai"` y un resultado `401`, `Incorrect API key` o
`No API key`. Una ejecución corregida debería mostrar la ruta OAuth de OpenAI
en lugar de un fallo simple de clave de API de OpenAI.

**La configuración de referencias de modelos heredadas de Codex permanece:** ejecute `openclaw doctor --fix`.
Doctor reescribe las referencias de modelos heredadas como `openai/*`, elimina las
asignaciones obsoletas de sesión y del entorno de ejecución de todo el agente, y conserva
las anulaciones existentes de perfiles de autenticación.

**El servidor de aplicaciones se rechaza:** use un servidor de aplicaciones estable de Codex de `0.143.0`
mediante el `0.144.6` incluido. Las versiones preliminares, las versiones con sufijos de compilación y las
versiones más recientes no validadas se rechazan porque OpenClaw valida los esquemas generados
con la versión incluida del servidor de aplicaciones.

**`/codex status` no puede conectarse:** compruebe que el Plugin `codex`
esté habilitado, que `plugins.allow` lo incluya cuando haya una lista de permitidos
configurada y que cualquier `appServer.command`, `url`, `authToken` o
encabezado personalizado sea válido.

**El servidor de aplicaciones de Codex utiliza demasiada memoria:** distinga primero los dos
procesos. OpenClaw ejecuta el servidor de aplicaciones local de Codex como un proceso secundario
de Rust independiente. `NODE_OPTIONS=--max-old-space-size=...` solo cambia el
montículo de V8 de Node.js del Gateway; no limita ni amplía Codex. Las instalaciones administradas
del Gateway ya eligen un montículo de V8 adaptativo, y aumentarlo puede dejar menos memoria del
host para Codex. Consulte [Solución de problemas de memoria del Gateway](/es/gateway/troubleshooting#gateway-exits-during-high-memory-use)
para la presión del Gateway e inspeccione la memoria del host o del contenedor para el proceso secundario de Codex.

El Codex incluido no tiene límite de montículo ni de RSS, ni un retraso configurable
para descargarlo cuando está inactivo. Después de que se dé de baja el último cliente, un hilo
inactivo puede permanecer cargado hasta 30 minutos. En hosts con recursos limitados, reduzca
la distribución en abanico de subagentes nativos de Codex antes de aumentar el montículo del Gateway:

```json5
{
  plugins: {
    entries: {
      codex: {
        config: {
          appServer: {
            args: ["-c", "agents.max_threads=3", "app-server", "--listen", "stdio://"],
          },
        },
      },
    },
  },
}
```

Esta configuración limita los hilos secundarios nativos para el backend multiagente
predeterminado del Codex incluido. Si habilita explícitamente la versión 2 multiagente de Codex, use
`features.multi_agent_v2.max_concurrent_threads_per_session=3`; el límite de la versión 2
incluye el hilo raíz y no puede combinarse con `agents.max_threads`.
Para proporcionar más margen de memoria a Codex, aumente la asignación de memoria
del host, el contenedor o el cgroup. Un límite estricto del sistema operativo puede finalizar
Codex en lugar de aplicarle contrapresión.

**La detección de modelos es lenta:** reduzca
`plugins.entries.codex.config.discovery.timeoutMs` o deshabilite la detección.
Consulte la [Referencia del entorno de ejecución de Codex](/es/plugins/codex-harness-reference#model-discovery).

**El transporte WebSocket falla inmediatamente:** compruebe `appServer.url`,
`authToken`, los encabezados y que el servidor de aplicaciones remoto utilice la misma
versión del protocolo del servidor de aplicaciones de Codex. El transporte WebSocket de Codex
sigue siendo experimental y no es compatible; prefiera la entrada/salida estándar administrada
o el socket de control Unix local.

**Las herramientas nativas de shell o de parches se bloquean con `Native hook relay
unavailable`:** el hilo de Codex sigue intentando usar un identificador
de retransmisión de hooks nativos que OpenClaw ya no tiene registrado. Se trata de un problema
del transporte de hooks nativos de Codex, no de un fallo del backend ACP, del proveedor,
de GitHub ni del comando de shell. Inicie una sesión nueva en el chat afectado con
`/new` o `/reset` y vuelva a intentar un comando inofensivo.
Si funciona una vez, pero la siguiente llamada a una herramienta nativa vuelve a fallar,
considere `/new` solo como una solución temporal: copie el prompt
en una sesión nueva después de reiniciar el servidor de aplicaciones de Codex o el
Gateway de OpenClaw para que se descarten los hilos antiguos y se vuelvan a crear
los registros de hooks nativos.

**Las llamadas a herramientas de Codex crean demasiados procesos de hooks de corta duración:** establezca
`plugins.entries.codex.config.appServer.loopDetectionPreToolUseRelay: false`
y reinicie el Gateway. Esto deshabilita únicamente el subproceso `PreToolUse` de Codex
que se utiliza para la detección de bucles de OpenClaw y su marcador de ausencia de políticas.
Las retransmisiones obligatorias de `before_tool_call` y de políticas de herramientas
de confianza permanecen habilitadas.

**Un modelo que no es de Codex utiliza el entorno de ejecución integrado:** es lo esperado,
a menos que la política del entorno de ejecución del proveedor o del modelo lo dirija a otro
entorno de ejecución. Las referencias simples de proveedores distintos de OpenAI permanecen
en su ruta normal de proveedor en el modo `auto`.

**Computer Use está instalado, pero las herramientas no se ejecutan:** compruebe
`/codex computer-use status` desde una sesión nueva. Si una herramienta informa
`Native hook relay unavailable`, utilice el procedimiento de recuperación de retransmisión de hooks nativos
descrito anteriormente.
Consulte [Computer Use de Codex](/es/plugins/codex-computer-use#troubleshooting).

## Contenido relacionado

- [Referencia del entorno de ejecución de Codex](/es/plugins/codex-harness-reference)
- [Entorno de ejecución de Codex](/es/plugins/codex-harness-runtime)
- [Supervisión de Codex](/es/plugins/codex-supervision)
- [Plugins nativos de Codex](/es/plugins/codex-native-plugins)
- [Computer Use de Codex](/es/plugins/codex-computer-use)
- [Entornos de ejecución de agentes](/es/concepts/agent-runtimes)
- [Proveedores de modelos](/es/concepts/model-providers)
- [Proveedor de OpenAI](/es/providers/openai)
- [Ayuda de OpenAI Codex](https://help.openai.com/en/collections/14937394-codex)
- [Plugins de entornos de ejecución de agentes](/es/plugins/sdk-agent-harness)
- [Hooks de Plugin](/es/plugins/hooks)
- [Exportación de diagnósticos](/es/gateway/diagnostics)
- [Estado](/es/cli/status)
- [Pruebas](/es/help/testing-live#live-codex-app-server-harness-smoke)
