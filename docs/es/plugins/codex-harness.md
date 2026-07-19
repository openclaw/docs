---
read_when:
    - Quiere usar el arnés oficial del servidor de aplicaciones de Codex
    - Necesita ejemplos de configuración del entorno de Codex
    - Se desea que las implementaciones exclusivas de Codex fallen en lugar de recurrir a OpenClaw
summary: Ejecuta turnos del agente integrado de OpenClaw mediante el harness oficial del servidor de aplicaciones de Codex
title: Entorno de Codex
x-i18n:
    generated_at: "2026-07-19T13:40:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 791c637e772760a9ff580575f93c84ce4f477e08a08ee8bd29e251b3e0c18091
    source_path: plugins/codex-harness.md
    workflow: 16
---

El plugin oficial `codex` ejecuta de forma integrada los turnos del agente de OpenAI mediante app-server de Codex
en lugar del entorno integrado de OpenClaw. Codex controla la
sesión de agente de bajo nivel: reanudación nativa de hilos, continuación nativa de herramientas,
Compaction nativa y ejecución de app-server. OpenClaw sigue controlando los canales
de chat, los archivos de sesión, la selección de modelos, las herramientas dinámicas de OpenClaw, las aprobaciones,
la entrega de contenido multimedia y el reflejo visible de la transcripción.

Use referencias canónicas de modelos de OpenAI, como `openai/gpt-5.6-sol`. No configure
referencias GPT heredadas de Codex; coloque el orden de autenticación del agente de OpenAI en `auth.order.openai`.
Los identificadores de perfiles de autenticación heredados de Codex y las entradas heredadas del orden de autenticación de Codex
se reparan mediante `openclaw doctor --fix`.

Cuando la política de runtime del proveedor/modelo no está definida o es `auto`, el prefijo `openai/*` por sí solo
nunca selecciona este entorno. OpenAI puede seleccionar Codex implícitamente solo para una
ruta oficial HTTPS exacta de Platform Responses o ChatGPT Responses sin una
anulación de solicitud definida por el usuario. Consulte
[runtime de agente implícito de OpenAI](/es/providers/openai#implicit-agent-runtime).
Si Codex controla la autenticación antes de que se conozca el enrutamiento de Platform frente a ChatGPT, OpenClaw
sigue exigiendo que cada ruta candidata declare compatibilidad con Codex. El control nativo
de la autenticación por sí solo nunca omite esa comprobación de ruta.

Cuando no hay ningún entorno aislado de OpenClaw activo, OpenClaw inicia los hilos de app-server de Codex
con el modo de código nativo de Codex activado (el modo solo de código permanece desactivado de forma predeterminada), por lo que
las capacidades nativas del espacio de trabajo y de código siguen disponibles junto con las herramientas
dinámicas de OpenClaw enrutadas mediante el puente `item/tool/call` de app-server. Un
entorno aislado de OpenClaw activo o una política de herramientas restringida desactiva por completo el modo de código nativo,
a menos que se habilite la ruta experimental del servidor de ejecución del entorno aislado.

Con el valor predeterminado `tools.exec.host: "auto"` y sin ningún entorno aislado de OpenClaw activo,
Codex también recibe las herramientas `node_exec` y `node_process` para ejecutar comandos en nodos
emparejados. El shell nativo permanece en el host y el espacio de trabajo de app-server de Codex
(local al Gateway para la implementación stdio predeterminada); `node_exec` selecciona un Node por
nombre o identificador y mantiene vigente la política de aprobación de nodos de OpenClaw. Si una lista finita
de runtimes permitidos desactiva el modo de código nativo y deja el turno sin un
entorno de ejecución, OpenClaw mantiene disponibles en su lugar sus herramientas `exec` y `process`
filtradas por políticas para la ejecución directa y sin aislamiento.

Esta función nativa de Codex es independiente del
[modo de código de OpenClaw](/es/tools/code-mode), un runtime QuickJS-WASI opcional
para ejecuciones genéricas de OpenClaw con una forma de entrada `exec` diferente. Para conocer la
separación más amplia entre modelo, proveedor y runtime, comience por
[runtimes de agente](/es/concepts/agent-runtimes): `openai/gpt-5.6-sol` es la referencia
del modelo, `codex` es el runtime y Telegram, Discord, Slack u otro
canal es la superficie de comunicación.

## Requisitos

- El plugin oficial `@openclaw/codex` instalado. Incluya `codex` en
  `plugins.allow` si la configuración usa una lista de permitidos.
- Un app-server estable de Codex desde `0.143.0` hasta `0.144.6`. El plugin administra de forma predeterminada un
  binario compatible, por lo que un comando `codex` en `PATH` no afecta al inicio
  normal.
- Autenticación de Codex mediante `openclaw models auth login --provider openai`, una
  cuenta de app-server ya presente en el directorio principal de Codex del agente o un
  perfil explícito de autenticación de Codex mediante clave de API.

Para conocer la precedencia de autenticación, el aislamiento del entorno, los comandos personalizados de app-server,
el descubrimiento de modelos y la lista completa de campos de configuración, consulte
[referencia del entorno de Codex](/es/plugins/codex-harness-reference).

## Inicio rápido

Instale el plugin oficial y, a continuación, inicie sesión con OAuth de Codex:

```bash
openclaw plugins install @openclaw/codex
openclaw models auth login --provider openai
```

Active el plugin `codex` y seleccione un modelo de agente de OpenAI:

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

Si la configuración usa `plugins.allow`, añada también `codex` allí:

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
sesión, ejecute primero `/new` o `/reset` para que el siguiente turno resuelva el entorno
a partir de la configuración actual.

## Compartir hilos con Codex Desktop y la CLI

El valor predeterminado `appServer.homeScope: "agent"` aísla a cada agente de OpenClaw del
estado nativo de Codex del operador. Para permitir que un propietario inspeccione y administre los
mismos hilos nativos mostrados por Codex Desktop y la CLI de Codex, habilite el
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

El modo de directorio principal del usuario admite un proceso stdio administrado localmente o el transporte
compartido mediante socket Unix. Usa `$CODEX_HOME` cuando está definido y `~/.codex` en caso contrario, incluidos
la autenticación nativa de Codex, la configuración, los plugins y el almacén de hilos de ese directorio principal. OpenClaw no
inyecta un perfil de autenticación de OpenClaw en este app-server.

Los turnos del propietario obtienen la herramienta `codex_threads`: permite enumerar, buscar, leer, bifurcar, cambiar el nombre,
archivar y restaurar hilos nativos. Bifurque un hilo para continuarlo en
OpenClaw; la bifurcación se adjunta a la sesión actual de OpenClaw y permanece
visible para otros clientes nativos de Codex. Para archivar, se requiere la confirmación explícita
de que el hilo está cerrado en los demás lugares. Cuando también está habilitada la supervisión,
los campos y las mutaciones de la transcripción requieren la habilitación correspondiente de
`supervision.allowRawTranscripts` o `supervision.allowWriteControls`.

No reanude ni escriba en el mismo hilo simultáneamente mediante App Servers stdio
administrados independientes. Codex coordina los escritores activos dentro de un único App Server, no
entre procesos separados. La bifurcación es la ruta segura de coexistencia para las sesiones stdio
normales del directorio principal del usuario.

`appServer.homeScope: "user"` por sí solo no controla el catálogo de la flota. El descubrimiento
de sesiones nativas está habilitado mientras el plugin está activo; defina
`sessionCatalog.enabled: false` para eliminarlo de la barra lateral de OpenClaw sin
deshabilitar Codex. El catálogo usa una conexión de supervisión independiente; sin
una configuración explícita de conexión `appServer`, esa conexión usa de forma predeterminada stdio administrado
del directorio principal del usuario mientras el entorno normal sigue estando limitado al agente. La configuración explícita de
`appServer` se aplica a ambas rutas. Defina `homeScope: "user"`
explícitamente, como se muestra arriba, cuando el entorno normal también deba compartir el estado nativo.

## Supervisar sesiones de Codex

El mismo plugin `codex` puede enumerar las sesiones de Codex no archivadas del equipo del Gateway
y de los nodos emparejados que hayan habilitado esta función. Una sesión almacenada o inactiva local al Gateway puede
crear un Chat bloqueado a un modelo que refleje su historial persistente y acotado de mensajes del usuario y del asistente.
Su vinculación privada usa la conexión de supervisión para la instantánea nativa,
la rama canónica y los turnos posteriores, mientras las sesiones normales de Codex siguen
estando limitadas al agente. El primer inicio canónico usa exactamente el modelo y el proveedor que
Codex devuelve para la bifurcación de la instantánea. En reanudaciones posteriores, la selección se deja a la
configuración nativa de Codex; el modelo externo de OpenClaw y la cadena de respaldo nunca lo
sustituyen. Las filas almacenadas e inactivas pueden archivarse tras una confirmación explícita de que no hay otro ejecutor.
Las fuentes activas no pueden crear una rama ni archivarse; un Chat supervisado
existente aún puede abrirse. Las sesiones de nodos emparejados siguen siendo solo metadatos.

Consulte [Supervisar sesiones de Codex](/es/plugins/codex-supervision) para conocer la configuración, las reglas de bifurcación,
los límites de los nodos emparejados, la exposición de metadatos y la solución de problemas.

## Configuración

| Necesidad                                           | Configuración                                                                                     | Ubicación                          |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------ | ---------------------------------- |
| Habilitar el entorno                                | `plugins.entries.codex.enabled: true`                                                            | Configuración de OpenClaw          |
| Ocultar el descubrimiento de sesiones nativas de Codex | `plugins.entries.codex.config.sessionCatalog.enabled: false`                                     | Configuración del plugin de Codex  |
| Mantener la instalación de un plugin incluido en la lista de permitidos | Incluya `codex` en `plugins.allow`                                                               | Configuración de OpenClaw          |
| Permitir que los turnos de OpenAI aptos usen Codex implícitamente | Ruta oficial HTTPS exacta de Responses/ChatGPT, sin anulación de solicitud definida por el usuario, runtime sin definir/`auto` | Configuración del proveedor/modelo de OpenAI |
| Iniciar sesión con OAuth de ChatGPT/Codex           | `openclaw models auth login --provider openai`                                                   | Perfil de autenticación de la CLI  |
| Añadir respaldo mediante clave de API para ejecuciones de Codex | Perfil de clave de API `openai:*` enumerado después de la autenticación de suscripción en `auth.order.openai`                 | Perfil de autenticación de la CLI + configuración de OpenClaw |
| Rechazar de forma segura cuando Codex no esté disponible | `agentRuntime.id: "codex"` del proveedor o modelo                                                     | Configuración del modelo/proveedor de OpenClaw |
| Usar tráfico directo de la API de OpenAI            | `agentRuntime.id: "openclaw"` del proveedor o modelo con la autenticación normal de OpenAI                          | Configuración del modelo/proveedor de OpenClaw |
| Ajustar el comportamiento de app-server             | `plugins.entries.codex.config.appServer.*`                                                       | Configuración del plugin de Codex  |
| Habilitar aplicaciones de plugins nativos de Codex  | `plugins.entries.codex.config.codexPlugins.*`                                                    | Configuración del plugin de Codex  |
| Habilitar Codex Computer Use                        | `plugins.entries.codex.config.computerUse.*`                                                     | Configuración del plugin de Codex  |

Se recomienda `auth.order.openai` para ordenar primero la suscripción y después el respaldo mediante clave de API.
Los identificadores existentes de perfiles de autenticación heredados de Codex y el orden de autenticación heredado de Codex son
estado heredado exclusivo de doctor; no escriba nuevas referencias GPT heredadas de Codex.

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
para la misma ejecución de Codex. El orden de los perfiles elige las credenciales, no el runtime.
Cambiar el orden de autenticación no hace que una ruta personalizada, de Completions, HTTP o
con anulación de solicitud sea compatible con Codex.

### Compaction

No defina `compaction.model` ni `compaction.provider` en agentes respaldados
por Codex. Codex realiza la Compaction mediante el estado nativo de sus hilos de app-server, por lo que
OpenClaw ignora esas anulaciones locales del resumidor durante el runtime, y
`openclaw doctor --fix` las elimina cuando el agente usa Codex.

Lossless sigue siendo compatible como motor de contexto para el ensamblado, la ingesta y el
mantenimiento en torno a los turnos de Codex, configurado mediante
`plugins.slots.contextEngine: "lossless-claw"` y
`plugins.entries.lossless-claw.config.summaryModel`, no mediante
`agents.defaults.compaction.provider`. `openclaw doctor --fix` migra la
forma antigua `compaction.provider: "lossless-claw"` a la ranura del motor
de contexto Lossless cuando Codex es el runtime activo, pero Codex nativo sigue
controlando la Compaction. El entorno nativo de app-server admite motores de contexto
que necesitan ensamblado previo al prompt; los backends genéricos de CLI, incluido `codex-cli`,
no proporcionan esa capacidad de host.

Para los agentes respaldados por Codex, `/compact` inicia la Compaction nativa de app-server de Codex
en el hilo vinculado. OpenClaw no espera a que finalice,
no impone un tiempo de espera de OpenClaw, no reinicia el app-server compartido ni recurre a un
motor de contexto o resumidor público de OpenAI. Si falta la vinculación del hilo
nativo de Codex o está obsoleta, el comando rechaza la operación de forma segura en lugar de cambiar
silenciosamente el backend de Compaction.

El resto de esta página aborda la estructura de despliegue, el enrutamiento con cierre ante fallos, la política de aprobación de Guardian, los plugins nativos de Codex y Computer Use. Para consultar las listas completas de opciones, los valores predeterminados, las enumeraciones, la detección, el aislamiento del entorno, los tiempos de espera y los campos de transporte del app-server, consulte la
[referencia del arnés de Codex](/es/plugins/codex-harness-reference).

## Verificar el entorno de ejecución de Codex

Use `/status` en el chat en el que espera usar Codex. Un turno de agente de OpenAI respaldado por Codex muestra:

```text
Entorno de ejecución: OpenAI Codex
```

A continuación, compruebe el estado del app-server de Codex:

```text
/codex status
/codex models
```

`/codex status` informa sobre la conectividad del app-server, la cuenta, los límites de uso, los servidores MCP y las Skills. `/codex models` enumera el catálogo activo del app-server de Codex para el arnés y la cuenta. Si `/status` resulta inesperado, consulte
[Solución de problemas](#troubleshooting).

## Enrutamiento y selección de modelos

Mantenga separadas las referencias de proveedores y la política del entorno de ejecución:

- Use `openai/gpt-*` para la selección canónica de modelos de OpenAI. El prefijo por sí solo
  nunca selecciona Codex.
- Cuando no se establece el entorno de ejecución o se usa `auto`, solo una ruta oficial HTTPS exacta de Platform Responses
  o ChatGPT Responses sin una anulación de solicitud definida puede seleccionar Codex
  implícitamente.
- No use referencias heredadas de Codex GPT en la configuración; ejecute `openclaw doctor --fix` para
  reparar las referencias heredadas y las asignaciones de ruta obsoletas de las sesiones.
- `agentRuntime.id: "codex"` convierte Codex en un requisito con cierre ante fallos para una
  ruta compatible. No hace que una ruta efectiva incompatible sea compatible.
- `agentRuntime.id: "openclaw"` configura un proveedor o modelo para usar el entorno de ejecución integrado
  de OpenClaw cuando sea intencional.
- `/codex ...` controla desde el chat las conversaciones nativas del app-server de Codex.
- ACP/acpx es una ruta de arnés externo independiente. Úsela solo cuando el usuario
  solicite ACP/acpx o un adaptador de arnés externo.

| Intención del usuario                                      | Uso                                                                                                   |
| ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Asociar el chat actual                                     | `/codex bind [thread-id] [--cwd <path>] [--model <model>] [--provider <provider>]`                    |
| Reanudar un hilo existente de Codex                        | `/codex resume <thread-id>`                                                                           |
| Enumerar o filtrar hilos de Codex                          | `/codex threads [filter]`                                                                             |
| Leer o actualizar el objetivo nativo del hilo asociado     | `/codex goal [status\|set <objective>\|pause\|resume\|block\|complete\|clear]`                        |
| Enumerar los plugins nativos de Codex                      | `/codex plugins list`                                                                                 |
| Activar o desactivar un plugin nativo de Codex configurado | `/codex plugins enable <name>`, `/codex plugins disable <name>`                                       |
| Reanudar una sesión almacenada de la CLI de Codex como turno de nodo emparejado | `/codex sessions --host <node> [filter]`, luego `/codex resume <session-id> --host <node> --bind here` |
| Ver sesiones de Codex no archivadas en varios equipos      | Active la supervisión de Codex y abra **Sesiones de Codex**                                           |
| Cambiar el modelo, el modo rápido o los permisos del hilo asociado | `/codex model <model>`, `/codex fast [on\|off\|status]`, `/codex permissions [default\|yolo\|status]` |
| Detener o dirigir el turno activo                          | `/codex stop`, `/codex steer <text>`                                                                  |
| Desvincular la asociación actual                           | `/codex detach` (alias `/codex unbind`)                                                               |
| Enviar únicamente comentarios sobre Codex                  | `/codex diagnostics [note]`                                                                           |
| Iniciar una tarea de ACP/acpx                              | Comandos de sesión de ACP/acpx, no `/codex`                                                               |

| Caso de uso                                      | Configuración                                                                                               | Verificación                            | Notas                                      |
| ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------- | --------------------------------------- | ------------------------------------------ |
| Ruta de OpenAI apta con entorno de ejecución nativo de Codex | Ruta oficial HTTPS exacta de Responses/ChatGPT sin una anulación de solicitud definida, además del plugin `codex` activado | `/status` muestra `Runtime: OpenAI Codex` | Ruta implícita cuando no se establece el entorno de ejecución o se usa `auto` |
| Cierre ante fallos si Codex no está disponible   | `agentRuntime.id: "codex"` del proveedor o modelo                                                                | El turno falla en lugar de recurrir al entorno integrado | Úselo para despliegues exclusivos de Codex |
| Tráfico directo con clave de API de OpenAI a través de OpenClaw | `agentRuntime.id: "openclaw"` del proveedor o modelo y autenticación normal de OpenAI                                      | `/status` muestra el entorno de ejecución de OpenClaw        | Úselo solo cuando OpenClaw sea intencional |
| Configuración heredada                           | Referencias heredadas de Codex GPT                                                                            | `openclaw doctor --fix` las reescribe     | No cree nuevas configuraciones de este modo |
| Adaptador de Codex para ACP/acpx                  | `sessions_spawn({ runtime: "acp" })` de ACP                                                                    | Estado de la tarea o sesión de ACP     | Independiente del arnés nativo de Codex    |

`agents.defaults.imageModel` sigue la misma separación de prefijos. Use `openai/gpt-*`
para la ruta normal de OpenAI y `codex/gpt-*` solo cuando la comprensión de imágenes
deba ejecutarse mediante un turno limitado del app-server de Codex. Doctor reescribe las
referencias heredadas de Codex GPT como `openai/gpt-*`.

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
`agentRuntime.id: "codex"` explícito con ámbito de modelo cuando esto deba ser un requisito
con cierre ante fallos.

### Despliegue de Codex con cierre ante fallos

Una ruta oficial HTTPS exacta y apta de OpenAI puede resolverse mediante Codex cuando el
plugin incluido esté disponible. Añada una política explícita del entorno de ejecución para establecer una
regla de cierre ante fallos:

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

Cuando Codex es obligatorio, OpenClaw falla de forma anticipada si la ruta efectiva no está declarada
como compatible con Codex, el plugin está desactivado, el app-server es demasiado antiguo o el
app-server no puede iniciarse.

## Política del app-server

De forma predeterminada, el plugin inicia localmente el binario administrado de Codex de OpenClaw con
transporte stdio. Establezca `appServer.command` solo para ejecutar intencionalmente un
ejecutable diferente. Codex clasifica el transporte WebSocket como experimental
y no compatible; úselo únicamente para pruebas que no sean de producción con un app-server
que ya se ejecute en otro lugar:

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

Las sesiones locales del app-server mediante stdio adoptan de forma predeterminada la postura de operador local de confianza:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` y
`sandbox: "danger-full-access"`. Si los requisitos locales de Codex no permiten esa
postura YOLO implícita, OpenClaw selecciona en su lugar permisos permitidos de Guardian.
Cuando hay un entorno aislado de OpenClaw activo para la sesión, OpenClaw
desactiva Code Mode nativo de Codex, los servidores MCP del usuario y la
ejecución de plugins respaldados por aplicaciones para ese turno, en lugar de depender del aislamiento del lado del host de Codex.
El acceso al shell se realiza en su lugar mediante herramientas dinámicas respaldadas por el entorno aislado de OpenClaw,
como `sandbox_exec` y `sandbox_process`, cuando están disponibles las herramientas normales
de ejecución y procesos.

Use el modo de ejecución normalizado de OpenClaw para la revisión automática nativa de Codex antes de
salir del entorno aislado o conceder permisos adicionales:

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
OpenClaw no conserva las anulaciones heredadas y no seguras de Codex `approvalPolicy: "never"` o
`sandbox: "danger-full-access"`; use `tools.exec.mode: "full"` para
establecer intencionalmente una postura de Codex sin aprobaciones. El ajuste preestablecido heredado
`plugins.entries.codex.config.appServer.mode: "guardian"` aún
funciona, pero `tools.exec.mode: "auto"` es la superficie normalizada de OpenClaw.

Para comparar los modos con las aprobaciones de ejecución del host y los
permisos de ACPX, consulte [Modos de permisos](/es/tools/permission-modes). Para conocer todos los
campos del app-server, el orden de autenticación, el aislamiento del entorno y el comportamiento de los tiempos de espera,
consulte la [referencia del arnés de Codex](/es/plugins/codex-harness-reference).

## Comandos y diagnósticos

El plugin `codex` registra `/codex` como comando de barra en cualquier canal que
admita comandos de texto de OpenClaw.

La ejecución y el control nativos requieren un propietario o un cliente de Gateway
`operator.admin`: asociar o reanudar hilos, enviar o detener turnos,
cambiar el modelo, el modo rápido o el estado de los permisos, realizar Compaction o revisiones y
desvincular una asociación. Los demás remitentes autorizados conservan acceso de solo lectura a los comandos
de estado, ayuda, cuenta, modelo, hilo, objetivo nativo, servidor MCP, Skills e inspección de asociaciones.

Formas habituales:

- `/codex status` comprueba la conectividad del servidor de aplicaciones, los modelos, la cuenta, los límites de
  uso, los servidores MCP y las Skills.
- `/codex models` enumera los modelos activos del servidor de aplicaciones de Codex.
- `/codex threads [filter]` enumera los hilos recientes del servidor de aplicaciones de Codex.
- `/codex goal` lee o actualiza el objetivo nativo de Codex del hilo adjunto. La continuación automática de objetivos de Codex permanece deshabilitada; OpenClaw todavía no controla turnos de seguimiento autónomos.
- `/codex resume <thread-id>` vincula la sesión actual de OpenClaw a un
  hilo de Codex existente.
- `/codex bind [thread-id] [--cwd <path>] [--model <model>] [--provider <provider>]`
  vincula el chat actual.
- `/codex detach` (o `/codex unbind`) desvincula la vinculación actual.
- `/codex binding` describe la vinculación actual.
- `/codex stop` detiene el turno activo; `/codex steer <text>` lo dirige.
- `/codex model <model>`, `/codex fast [on|off|status]` y
  `/codex permissions [default|yolo|status]` cambian el estado de cada conversación.
- `/codex compact` solicita al servidor de aplicaciones de Codex que compacte el hilo adjunto.
- `/codex review` inicia la revisión nativa de Codex para el hilo adjunto.
- `/codex diagnostics [note]` solicita confirmación antes de enviar comentarios de Codex para el
  hilo adjunto.
- `/codex account` muestra el estado de la cuenta y los límites de uso.
- `/codex mcp` enumera el estado de los servidores MCP del servidor de aplicaciones de Codex.
- `/codex skills` enumera las Skills del servidor de aplicaciones de Codex.
- `/codex plugins list`, `/codex plugins enable <name>` y
  `/codex plugins disable <name>` administran los plugins nativos de Codex configurados.
- `/codex computer-use [status|install]` administra Codex Computer Use.
- `/codex help` enumera el árbol de comandos completo.

Para la mayoría de los informes de soporte, se debe comenzar con `/diagnostics [note]` en la
conversación en la que ocurrió el error. Crea un informe de diagnóstico del
Gateway y, para las sesiones del entorno de ejecución de Codex, solicita aprobación para enviar el
paquete pertinente de comentarios de Codex. Véase
[Exportación de diagnósticos](/es/gateway/diagnostics) para consultar el modelo de privacidad y el comportamiento
de los chats grupales. Se debe usar `/codex diagnostics [note]` solo cuando se desee específicamente
cargar los comentarios de Codex del hilo adjunto actualmente sin
el paquete de diagnóstico completo del Gateway.

### Inspeccionar hilos de Codex localmente

A menudo, la forma más rápida de inspeccionar una ejecución incorrecta de Codex es abrir directamente el
hilo nativo de Codex:

```bash
codex resume <thread-id>
```

El id. del hilo se obtiene de la respuesta completada de `/diagnostics`, `/codex binding`
o `/codex threads [filter]`.

Para consultar los mecanismos de carga y los límites de diagnóstico en el nivel de ejecución, véase
[Entorno de ejecución de Codex](/es/plugins/codex-harness-runtime#codex-feedback-upload).

### Orden de autenticación

En el directorio principal predeterminado de cada agente, la autenticación se selecciona en este orden:

1. Perfiles de autenticación de OpenAI ordenados para el agente, preferiblemente en
   `auth.order.openai`. Se debe ejecutar `openclaw doctor --fix` para migrar los identificadores antiguos de
   perfiles de autenticación heredados de Codex y el orden de autenticación heredado de Codex.
2. La cuenta existente del servidor de aplicaciones en el directorio principal de Codex de ese agente.
3. Solo para inicios locales del servidor de aplicaciones mediante stdio, `CODEX_API_KEY` y después
   `OPENAI_API_KEY`, cuando no existe una cuenta del servidor de aplicaciones y todavía se requiere
   autenticación de OpenAI.

Cuando OpenClaw detecta un perfil de autenticación de Codex del tipo suscripción de ChatGPT,
elimina `CODEX_API_KEY` y `OPENAI_API_KEY` del proceso secundario de Codex
iniciado. Esto mantiene las claves de API del Gateway disponibles para incrustaciones o
modelos directos de OpenAI sin hacer que los turnos nativos del servidor de aplicaciones de Codex
se facturen por accidente mediante la API. Los perfiles explícitos de claves de API de Codex y la
reserva local mediante claves de entorno para stdio usan el inicio de sesión del servidor de aplicaciones en lugar de
heredar el entorno del proceso secundario. Las conexiones WebSocket del servidor de aplicaciones no reciben
la reserva de claves de API del entorno del Gateway; se debe usar un perfil de autenticación explícito o la
cuenta propia del servidor de aplicaciones remoto.

Si un perfil de suscripción alcanza un límite de uso de Codex, OpenClaw registra la
hora de restablecimiento cuando Codex la informa e intenta usar el siguiente perfil de autenticación ordenado
para la misma ejecución de Codex. Una vez transcurrida la hora de restablecimiento, el perfil de
suscripción vuelve a ser apto sin cambiar el modelo `openai/gpt-*`
seleccionado ni el entorno de ejecución de Codex.

Cuando se configuran plugins nativos de Codex, OpenClaw instala o actualiza
esos plugins mediante el servidor de aplicaciones conectado antes de exponer al hilo de Codex
las aplicaciones controladas por plugins. `app/list` continúa siendo la fuente de referencia para los
identificadores, la accesibilidad y los metadatos de las aplicaciones, pero OpenClaw controla la decisión de
habilitación para cada hilo: si la política permite una aplicación accesible enumerada, OpenClaw
envía `thread/start.config.apps[appId].enabled = true` incluso cuando `app/list`
indica actualmente que esa aplicación está deshabilitada. Esta ruta no crea la
instalación de aplicaciones con identificadores desconocidos; OpenClaw solo activa plugins del mercado
con `plugin/install` y después actualiza el inventario.

### Aislamiento del entorno

Para inicios locales del servidor de aplicaciones mediante stdio, OpenClaw establece `CODEX_HOME` en un
directorio por agente para que la configuración, los archivos de autenticación y cuenta, la caché y los datos de plugins,
y el estado nativo de los hilos de Codex no lean ni escriban de forma predeterminada en el
`~/.codex` personal del operador. OpenClaw conserva el `HOME` normal del proceso;
los subprocesos ejecutados por Codex todavía pueden encontrar configuraciones y tokens del directorio personal del usuario,
y Codex puede detectar entradas compartidas de `$HOME/.agents/skills` y
`$HOME/.agents/plugins/marketplace.json`. Con
`appServer.homeScope: "user"`, OpenClaw usa en su lugar el directorio principal nativo de Codex del usuario
y su cuenta existente sin inyectar un perfil de autenticación de OpenClaw.

Si una implementación necesita aislamiento adicional del entorno, se deben añadir esas
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
la normalización del inicio local: `CODEX_HOME` continúa apuntando al ámbito seleccionado
del agente o del usuario, y `HOME` continúa heredándose para que los subprocesos puedan usar
el estado normal del directorio personal del usuario.

### Herramientas dinámicas y búsqueda web

De forma predeterminada, las herramientas dinámicas de Codex usan la carga `searchable`. Normalmente, OpenClaw
no expone herramientas dinámicas que duplican las operaciones nativas de Codex en el espacio de trabajo:
`read`, `write`, `edit`, `apply_patch`, `exec`, `process`, `update_plan`,
`get_goal`, `create_goal`, `update_goal`, `tool_call`, `tool_describe`,
`tool_search` y `tool_search_code`. Las operaciones de objetivos permanecen nativas de Codex,
por lo que OpenClaw no proyecta un segundo almacén de objetivos en los turnos de Codex. La mayoría
de las herramientas de integración restantes de OpenClaw, como mensajería, medios, Cron,
navegador, nodos, Gateway y `heartbeat_respond`, están disponibles mediante
la búsqueda de herramientas de Codex en el espacio de nombres `openclaw`, lo que reduce el contexto inicial
del modelo. La reserva del shell para turnos restringidos es la excepción para
`exec` y `process` cuando una lista finita de elementos permitidos deshabilita el Code Mode nativo;
las listas de elementos permitidos del entorno de ejecución y `codexDynamicToolsExclude` siguen siendo aplicables.

Las herramientas marcadas como `catalogMode: "direct-only"`, incluida la herramienta `computer`
de OpenClaw, usan en su lugar el espacio de nombres `openclaw_direct`. Codex trata ese espacio de nombres
como `DirectModelOnly`, por lo que esas herramientas permanecen visibles directamente para el modelo en hilos normales y
exclusivos de Code Mode, en lugar de atravesar llamadas anidadas de `tools.*` de Code Mode.

La búsqueda web usa de forma predeterminada la herramienta alojada `web_search` de Codex cuando la búsqueda está
habilitada y no se ha seleccionado ningún proveedor administrado. La búsqueda alojada nativa y
la herramienta dinámica administrada `web_search` de OpenClaw son mutuamente excluyentes para que
la búsqueda administrada no pueda eludir las restricciones nativas de dominios. OpenClaw usa la
herramienta administrada cuando la búsqueda alojada no está disponible, se ha deshabilitado explícitamente o
se ha sustituido por un proveedor administrado seleccionado. OpenClaw mantiene deshabilitada la
extensión independiente `web.run` de Codex porque el tráfico de producción del servidor de aplicaciones rechaza
su espacio de nombres `web` definido por el usuario. `tools.web.search.enabled: false`
deshabilita ambas rutas, al igual que las ejecuciones exclusivas de LLM con las herramientas deshabilitadas. Codex trata
`"cached"` como una preferencia y la resuelve como acceso externo activo para
los turnos sin restricciones del servidor de aplicaciones. La reserva administrada automática falla de forma cerrada cuando
se establecen `allowedDomains` nativos, de modo que no se pueda eludir la lista de elementos permitidos.
Los cambios persistentes en la política de búsqueda efectiva rotan el hilo de Codex vinculado
antes del siguiente turno; las restricciones transitorias por turno usan un hilo restringido
temporal y conservan la vinculación existente para reanudarla posteriormente.

`sessions_yield` y las respuestas de origen exclusivas de herramientas de mensajes siguen siendo directas porque
son contratos de control de turnos. `sessions_spawn` continúa disponible en la búsqueda para que
el `spawn_agent` nativo de Codex siga siendo la principal superficie de subagentes de Codex,
mientras que la delegación explícita de OpenClaw o ACP continúa disponible mediante el
espacio de nombres de herramientas dinámicas `openclaw`. Las instrucciones de colaboración de Heartbeat
indican a Codex que busque `heartbeat_respond` antes de finalizar un turno de Heartbeat
cuando la herramienta todavía no esté cargada.

Se debe establecer `codexDynamicToolsLoading: "direct"` solo al conectarse a un
servidor de aplicaciones de Codex personalizado que no pueda buscar herramientas dinámicas diferidas o al
depurar la carga útil completa de herramientas.

### Campos de configuración

Campos de nivel superior compatibles del plugin de Codex:

| Campo                      | Valor predeterminado        | Significado                                                                                  |
| -------------------------- | -------------- | ---------------------------------------------------------------------------------------- |
| `codexDynamicToolsLoading` | `"searchable"` | Se debe usar `"direct"` para colocar las herramientas dinámicas de OpenClaw directamente en el contexto inicial de herramientas de Codex. |
| `codexDynamicToolsExclude` | `[]`           | Nombres adicionales de herramientas dinámicas de OpenClaw que se omitirán de los turnos del servidor de aplicaciones de Codex.              |
| `codexPlugins`             | deshabilitado       | Compatibilidad nativa de plugins y aplicaciones de Codex para plugins seleccionados migrados e instalados desde el código fuente.           |
| `sessionCatalog`           | habilitado        | Detección en la barra lateral de sesiones nativas de Codex en este Gateway y en nodos emparejados aptos.   |
| `supervision`              | deshabilitado       | Política de transcripción y control de escritura de sesiones nativas orientada al agente.                         |

Campos `appServer` compatibles:

| Campo                                         | Valor predeterminado                                                | Significado                                                                                                                                                                                                                                                                                                                                                                                         |
| --------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                                   | `"stdio"`                                              | `"stdio"` inicia Codex; `"unix"` explícito se conecta al socket de control local; `"websocket"` se conecta a `url`.                                                                                                                                                                                                                                                                                |
| `homeScope`                                   | `"agent"`                                              | `"agent"` aísla el estado ordinario del arnés para cada agente de OpenClaw. `"user"` es una suscripción explícita que comparte el `$CODEX_HOME` o `~/.codex` nativo, utiliza la autenticación nativa y habilita la gestión de hilos exclusiva del propietario. El ámbito de usuario admite stdio local o transporte Unix. Para la conexión de supervisión independiente, un valor sin establecer se resuelve como `"user"` para stdio o Unix y como `"agent"` para WebSocket.     |
| `command`                                     | binario de Codex gestionado                                   | Ejecutable para el transporte stdio. Déjelo sin establecer para usar el binario gestionado; establézcalo únicamente para una sustitución explícita.                                                                                                                                                                                                                                                                                    |
| `args`                                        | `["app-server", "--listen", "stdio://"]`               | Argumentos para el transporte stdio.                                                                                                                                                                                                                                                                                                                                                                  |
| `url`                                         | sin establecer                                                  | URL del servidor de aplicaciones WebSocket o URL `unix://`. Una ruta Unix explícita vacía selecciona el socket de control canónico del directorio personal del usuario.                                                                                                                                                                                                                                                                          |
| `authToken`                                   | sin establecer                                                  | Token de portador para el transporte WebSocket. Acepta una cadena literal o SecretInput, como `${CODEX_APP_SERVER_TOKEN}`.                                                                                                                                                                                                                                                                              |
| `headers`                                     | `{}`                                                   | Encabezados WebSocket adicionales. Los valores de los encabezados aceptan cadenas literales o valores SecretInput; por ejemplo, `x-codex-client-session-token: "${CODEX_CLIENT_SESSION_TOKEN}"`.                                                                                                                                                                                                                               |
| `clearEnv`                                    | `[]`                                                   | Nombres de variables de entorno adicionales que se eliminan del proceso de servidor de aplicaciones stdio iniciado después de que OpenClaw crea su entorno heredado. OpenClaw conserva el `CODEX_HOME` seleccionado y el `HOME` heredado para los inicios locales.                                                                                                                                                                           |
| `codeModeOnly`                                | `false`                                                | Habilita la superficie de herramientas exclusiva del modo de código de Codex. Las herramientas dinámicas ordinarias de OpenClaw siguen disponibles mediante llamadas `tools.*` anidadas; las herramientas `openclaw_direct` permanecen visibles directamente para el modelo.                                                                                                                                                                                                             |
| `remoteWorkspaceRoot`                         | sin establecer                                                  | Raíz remota del espacio de trabajo del servidor de aplicaciones de Codex. Cuando se establece, OpenClaw deduce la raíz local del espacio de trabajo a partir del espacio de trabajo de OpenClaw resuelto, conserva el sufijo del cwd actual bajo esta raíz remota y envía a Codex únicamente el cwd final del servidor de aplicaciones. Si el cwd se encuentra fuera de la raíz resuelta del espacio de trabajo de OpenClaw, OpenClaw aplica un cierre seguro en lugar de enviar una ruta local del Gateway al servidor de aplicaciones remoto. |
| `requestTimeoutMs`                            | `60000`                                                | Tiempo de espera para las llamadas del plano de control del servidor de aplicaciones.                                                                                                                                                                                                                                                                                                                                                     |
| `turnCompletionIdleTimeoutMs`                 | `60000`                                                | Intervalo de inactividad después de que Codex acepta un turno o tras una solicitud del servidor de aplicaciones limitada al turno mientras OpenClaw espera `turn/completed`.                                                                                                                                                                                                                                                                    |
| `turnAssistantCompletionIdleTimeoutMs`        | `10000`                                                | Intervalo de inactividad después de que un elemento final del asistente que no sea de comentario, o una finalización sin procesar del asistente previa a una herramienta, prepara la publicación de la salida del asistente mientras OpenClaw aún espera `turn/completed`. Aumentarlo proporciona a Codex más tiempo para emitir `turn/completed` antes de que OpenClaw interrumpa y libere el carril de la sesión.                                                                                            |
| `postToolRawAssistantCompletionIdleTimeoutMs` | `300000`                                               | Protección de inactividad de finalización y progreso utilizada después de una transferencia a una herramienta, la finalización de una herramienta nativa, el progreso sin procesar del asistente posterior a una herramienta, la finalización del razonamiento sin procesar o el progreso del razonamiento mientras OpenClaw espera `turn/completed`. Utilícela para cargas de trabajo de confianza o pesadas en las que la síntesis posterior a una herramienta pueda permanecer legítimamente inactiva durante más tiempo que el presupuesto de publicación final del asistente.                                |
| `mode`                                        | `"yolo"` salvo que los requisitos locales de Codex no permitan YOLO | Preajuste para la ejecución YOLO o revisada por un guardián. Los requisitos de stdio local que omiten `danger-full-access`, la aprobación `never` o el revisor `user` hacen que el valor predeterminado implícito sea guardián.                                                                                                                                                                                                           |
| `approvalPolicy`                              | `"never"` o una política de aprobación de guardián permitida       | Política de aprobación nativa de Codex enviada al iniciar o reanudar un hilo o un turno. Los valores predeterminados del guardián prefieren `"on-request"` cuando está permitido.                                                                                                                                                                                                                                                                            |
| `sandbox`                                     | `"danger-full-access"` o un entorno aislado de guardián permitido  | Modo de entorno aislado nativo de Codex enviado al iniciar o reanudar un hilo. Los valores predeterminados del guardián prefieren `"workspace-write"` cuando está permitido; de lo contrario, `"read-only"`. Cuando hay un entorno aislado de OpenClaw activo, los turnos `danger-full-access` utilizan `workspace-write` de Codex con acceso a la red derivado de la configuración de salida del entorno aislado de OpenClaw.                                                                                     |
| `approvalsReviewer`                           | `"user"` o un revisor de guardián permitido               | Utilice `"auto_review"` para permitir que Codex revise las solicitudes de aprobación nativas cuando esté permitido; de lo contrario, `guardian_subagent` o `user`. `guardian_subagent` continúa siendo un alias heredado.                                                                                                                                                                                                                              |
| `serviceTier`                                 | sin establecer                                                  | Nivel de servicio opcional del servidor de aplicaciones de Codex. `"priority"` habilita el enrutamiento en modo rápido, `"flex"` solicita procesamiento flexible, `null` elimina la sustitución y el valor heredado `"fast"` se acepta como `"priority"`.                                                                                                                                                                                                 |
| `networkProxy`                                | deshabilitado                                               | Habilita el acceso a la red del perfil de permisos de Codex para los comandos del servidor de aplicaciones. OpenClaw define la configuración `permissions.<profile>.network` seleccionada y la selecciona mediante `default_permissions` en lugar de enviar `sandbox`.                                                                                                                                                                             |
| `experimental.sandboxExecServer`              | `false`                                                | Suscripción de vista previa que registra un entorno de Codex respaldado por el entorno aislado de OpenClaw en el servidor de aplicaciones de Codex compatible, para que la ejecución nativa de Codex pueda realizarse dentro del entorno aislado de OpenClaw activo.                                                                                                                                                                                                            |

`appServer.networkProxy` es explícito porque cambia el contrato del entorno aislado de Codex. Cuando está habilitado, OpenClaw también establece `features.network_proxy.enabled` y `default_permissions` en la configuración del hilo de Codex para que el perfil de permisos generado pueda iniciar la red administrada por Codex. De forma predeterminada, OpenClaw genera un nombre de perfil `openclaw-network-<fingerprint>` resistente a colisiones a partir del cuerpo del perfil; use `profileName` solo cuando se requiera un nombre local estable.

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

Si el entorno de ejecución normal del servidor de aplicaciones fuera `danger-full-access`, habilitar `networkProxy` usa acceso al sistema de archivos al estilo del espacio de trabajo para el perfil de permisos generado: la aplicación de red administrada por Codex es una red aislada, por lo que un perfil de acceso completo no protegería el tráfico saliente. Las entradas de dominio usan `allow` o `deny`; las entradas de sockets Unix usan los valores `allow` o `none` de Codex.

### Tiempos de espera de llamadas dinámicas a herramientas

Las llamadas dinámicas a herramientas propiedad de OpenClaw se limitan de forma independiente de `appServer.requestTimeoutMs`: las solicitudes `item/tool/call` de Codex usan de forma predeterminada un supervisor de OpenClaw de 90 segundos. Un argumento positivo `timeoutMs` por llamada amplía o acorta el límite específico de esa herramienta, con un máximo de 600000 ms. La herramienta `image_generate` usa `agents.defaults.imageGenerationModel.timeoutMs` cuando la llamada a la herramienta no proporciona su propio tiempo de espera, o un valor predeterminado de generación de imágenes de 120 segundos en caso contrario. La herramienta de comprensión multimedia `image` usa `tools.media.image.timeoutSeconds` o su valor multimedia predeterminado de 60 segundos; para la comprensión de imágenes, ese tiempo de espera se aplica a la propia solicitud y no se reduce por el trabajo de preparación anterior. Al agotarse el tiempo de espera, OpenClaw cancela la señal de la herramienta cuando es compatible y devuelve a Codex una respuesta fallida de la herramienta dinámica para que el turno pueda continuar en lugar de dejar la sesión en `processing`. Este supervisor es el límite dinámico externo de `item/tool/call`; los tiempos de espera de solicitud específicos del proveedor se ejecutan dentro de esa llamada y conservan su propia semántica de tiempo de espera.

Después de que Codex acepta un turno y después de que OpenClaw responde a una solicitud del servidor de aplicaciones limitada al turno, el arnés espera que Codex progrese en el turno actual y termine finalmente el turno nativo con `turn/completed`. Si el servidor de aplicaciones permanece inactivo durante `appServer.turnCompletionIdleTimeoutMs`, OpenClaw intenta interrumpir el turno de Codex, registra un tiempo de espera de diagnóstico y libera la vía de sesión de OpenClaw para que los mensajes de chat posteriores no queden en cola detrás de un turno nativo obsoleto. La mayoría de las notificaciones no terminales del mismo turno desactivan ese breve supervisor porque Codex ha demostrado que el turno sigue activo.

Las transferencias de herramientas usan un límite de inactividad posterior a la herramienta más largo: después de que OpenClaw devuelve una respuesta `item/tool/call`, después de que finalizan elementos de herramientas nativas como `commandExecution`, después de las finalizaciones sin procesar de `custom_tool_call_output` y después del progreso sin procesar posterior a la herramienta del asistente, las finalizaciones de razonamiento sin procesar o el progreso de razonamiento. La protección usa `appServer.postToolRawAssistantCompletionIdleTimeoutMs` cuando está configurado y, en caso contrario, utiliza de forma predeterminada cinco minutos; ese mismo límite también amplía el supervisor de progreso durante el período de síntesis silenciosa antes de que Codex emita el siguiente evento del turno actual. Las notificaciones globales del servidor de aplicaciones, como las actualizaciones de límites de frecuencia, no reinician el progreso de inactividad del turno. Las finalizaciones de razonamiento, las finalizaciones de comentario `agentMessage` y el progreso de razonamiento o del asistente sin procesar anterior a la herramienta pueden ir seguidos de una respuesta final automática, por lo que usan la protección de respuesta posterior al progreso en lugar de liberar inmediatamente la vía de sesión.

Solo los elementos `agentMessage` finales/no de comentario completados y las finalizaciones sin procesar del asistente anteriores a la herramienta activan la liberación de salida del asistente: si Codex permanece entonces inactivo sin `turn/completed`, OpenClaw intenta interrumpir el turno nativo y libera la vía de sesión. Si otro supervisor de turno gana esa carrera de liberación, OpenClaw sigue aceptando el elemento final completado del asistente una vez que no queda activa ninguna solicitud nativa, elemento ni finalización de herramienta dinámica y la liberación de salida del asistente aún pertenece al último elemento completado, sin ninguna finalización de elemento posterior. Esto puede conservar la respuesta final después de completar el trabajo de las herramientas sin reproducir el turno. Los deltas parciales del asistente, las respuestas anteriores obsoletas y las finalizaciones posteriores vacías no cumplen los requisitos.

Los fallos del servidor de aplicaciones stdio que pueden reproducirse de forma segura, incluidos los tiempos de espera por inactividad al completar el turno sin pruebas del asistente, de herramientas, de elementos activos ni de efectos secundarios, se reintentan una vez en un nuevo intento del servidor de aplicaciones. Los tiempos de espera inseguros siguen retirando el cliente bloqueado del servidor de aplicaciones y liberan la vía de sesión de OpenClaw; también eliminan la vinculación obsoleta del hilo nativo en lugar de reproducirse automáticamente. Los tiempos de espera del supervisor de finalización muestran texto de tiempo de espera específico de Codex: los casos que pueden reproducirse de forma segura indican que la respuesta puede estar incompleta, mientras que los casos inseguros indican al usuario que verifique el estado actual antes de volver a intentarlo. Los diagnósticos públicos de tiempo de espera incluyen campos estructurales como el último método de notificación del servidor de aplicaciones, el identificador/tipo/rol del elemento de respuesta sin procesar del asistente, los recuentos de solicitudes/elementos activos y el estado del supervisor activado; cuando la última notificación es un elemento de respuesta sin procesar del asistente, también incluyen una vista previa limitada del texto del asistente. No incluyen contenido sin procesar de prompts ni de herramientas.

### Sustituciones de variables de entorno para pruebas locales

- `OPENCLAW_CODEX_APP_SERVER_BIN` omite el binario administrado cuando
  `appServer.command` no está establecido.
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` se eliminó. Use
`plugins.entries.codex.config.appServer.mode: "guardian"` en su lugar, o
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` para una prueba local puntual. Se prefiere la configuración para implementaciones reproducibles porque mantiene el comportamiento del plugin en el mismo archivo revisado que el resto de la configuración del arnés de Codex.

## Plugins nativos de Codex

La compatibilidad con plugins nativos de Codex usa las capacidades de aplicaciones y plugins propias del servidor de aplicaciones de Codex en el mismo hilo de Codex que el turno del arnés de OpenClaw. OpenClaw no traduce los plugins de Codex en herramientas dinámicas sintéticas `codex_plugin_*` de OpenClaw.

`codexPlugins` afecta solo a las sesiones que seleccionan el arnés nativo de Codex. No tiene ningún efecto sobre las ejecuciones del arnés integrado, las ejecuciones normales del proveedor OpenAI, las vinculaciones de conversaciones ACP ni otros arneses.

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

La configuración de aplicaciones del hilo se calcula cuando OpenClaw establece una sesión del arnés de Codex o sustituye una vinculación obsoleta del hilo de Codex; no se vuelve a calcular en cada turno. Después de cambiar `codexPlugins`, use `/new`, `/reset` o reinicie el Gateway para que las futuras sesiones del arnés de Codex comiencen con el conjunto de aplicaciones actualizado.

Para consultar la elegibilidad de migración, el inventario de aplicaciones, la política de acciones destructivas, las solicitudes de información y los diagnósticos de plugins nativos, consulte
[Plugins nativos de Codex](/es/plugins/codex-native-plugins).

El acceso a aplicaciones y plugins del lado de OpenAI está controlado por la cuenta de Codex que ha iniciado sesión y, para los espacios de trabajo Business y Enterprise/Edu, por los controles de aplicaciones del espacio de trabajo. Consulte
[Uso de Codex con su plan de ChatGPT](https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan)
para obtener una descripción general de OpenAI sobre la cuenta y los controles del espacio de trabajo.

## Uso del ordenador

El Uso del ordenador tiene su propia guía de configuración:
[Uso del ordenador con Codex](/es/plugins/codex-computer-use).

Versión breve: OpenClaw no incluye la aplicación de control del escritorio ni ejecuta por sí mismo las acciones de escritorio. Prepara el servidor de aplicaciones de Codex, verifica que el servidor MCP `computer-use` esté disponible y permite que Codex controle las llamadas nativas a herramientas MCP durante los turnos del modo Codex.

## Límites del entorno de ejecución

El arnés de Codex solo cambia el ejecutor de agente integrado de bajo nivel.

- Se admiten las herramientas dinámicas de OpenClaw. Codex solicita a OpenClaw que ejecute esas herramientas, por lo que OpenClaw permanece en la ruta de ejecución.
- Las herramientas nativas de shell, parches, MCP y aplicaciones de Codex son propiedad de Codex. OpenClaw puede observar o bloquear eventos nativos seleccionados mediante la retransmisión compatible, pero no reescribe los argumentos de las herramientas nativas.
- Codex controla la Compaction nativa. OpenClaw mantiene un reflejo de la transcripción para el historial del canal, la búsqueda, `/new`, `/reset` y futuros cambios de modelo o arnés, pero no sustituye la Compaction de Codex por un resumidor de OpenClaw o del motor de contexto.
- La generación multimedia, la comprensión multimedia, TTS, las aprobaciones y la salida de herramientas de mensajería continúan mediante la configuración correspondiente de proveedor/modelo de OpenClaw.
- `tool_result_persist` se aplica a los resultados de herramientas de transcripción propiedad de OpenClaw, no a los registros de resultados de herramientas nativas de Codex.

Para obtener información sobre las capas de hooks, las superficies V1 compatibles, la gestión nativa de permisos, la dirección de colas, los mecanismos de carga de comentarios de Codex y los detalles de Compaction, consulte
[Entorno de ejecución del arnés de Codex](/es/plugins/codex-harness-runtime).

## Solución de problemas

**Codex no aparece como un proveedor `/model` normal:** es lo esperado para las configuraciones nuevas. Seleccione un modelo `openai/gpt-*`, habilite `plugins.entries.codex.enabled` y compruebe si `plugins.allow` excluye `codex`.

**OpenClaw usa el arnés integrado en lugar de Codex:** confirme que la ruta efectiva sea una ruta oficial exacta de Platform Responses o ChatGPT Responses mediante HTTPS, que no tenga ninguna sustitución de solicitud creada y que el plugin de Codex esté instalado y habilitado. El prefijo `openai/gpt-*` por sí solo no es suficiente. Para obtener una prueba estricta durante las pruebas, establezca `agentRuntime.id: "codex"` en el proveedor o el modelo; Codex forzado falla en lugar de recurrir a una alternativa cuando la ruta o el arnés son incompatibles.

**El entorno de ejecución de OpenAI Codex recurre a la ruta de clave de API:** recopile un extracto redactado del Gateway que muestre el modelo, el entorno de ejecución, el proveedor seleccionado y el fallo. Pida a los colaboradores afectados que ejecuten este comando de solo lectura en su host de OpenClaw:

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

Los extractos útiles suelen incluir `openai/gpt-5.6-sol` o `openai/gpt-5.6-luna`, `Runtime: OpenAI Codex`, `agentRuntime.id` o `harnessRuntime`, `candidateProvider: "openai"` y un resultado `401`, `Incorrect API key` o `No API key`. Una ejecución corregida debería mostrar la ruta OAuth de OpenAI en lugar de un fallo simple de la clave de API de OpenAI.

**La configuración de referencias de modelos heredados de Codex permanece:** ejecute `openclaw doctor --fix`.
Doctor reescribe las referencias de modelos heredados como `openai/*`, elimina las fijaciones obsoletas de tiempo de ejecución de sesiones y
de agentes completos, y conserva las anulaciones existentes de perfiles de autenticación.

**El app-server se rechaza:** use un app-server estable de Codex de `0.143.0`
mediante el `0.144.6` incluido. Las versiones preliminares, las versiones con sufijos de compilación y las versiones más recientes
no validadas se rechazan porque OpenClaw valida los esquemas generados
con la versión incluida del app-server.

**`/codex status` no puede conectarse:** compruebe que el Plugin `codex`
esté habilitado, que `plugins.allow` lo incluya cuando se configure una lista de permitidos
y que cualquier `appServer.command`, `url`, `authToken` o
encabezado personalizado sea válido.

**El app-server de Codex usa demasiada memoria:** distinga primero los dos procesos.
OpenClaw ejecuta el app-server local de Codex como un proceso hijo de Rust independiente.
`NODE_OPTIONS=--max-old-space-size=...` solo modifica el
montículo V8 de Node.js del Gateway; no limita ni amplía Codex. Las instalaciones administradas del Gateway ya eligen
un montículo V8 adaptativo, y aumentarlo puede dejar menos memoria del host para Codex. Consulte
[Solución de problemas de memoria del Gateway](/es/gateway/troubleshooting#gateway-exits-during-high-memory-use)
para la presión sobre el Gateway e inspeccione la memoria del host o del contenedor para el proceso hijo de Codex.

El Codex incluido no tiene límite de montículo ni de RSS, ni un retraso configurable
para descargar por inactividad. Después de que el último cliente cancele la suscripción, un hilo inactivo puede permanecer cargado
hasta 30 minutos. En hosts con recursos limitados, reduzca la concurrencia de subagentes nativos de Codex
antes de aumentar el montículo del Gateway:

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

Esa configuración limita los hilos hijos nativos del backend
multiagente predeterminado del Codex incluido. Si habilita explícitamente Codex multiagente v2, use
`features.multi_agent_v2.max_concurrent_threads_per_session=3`; el límite de v2
incluye el hilo raíz y no puede combinarse con `agents.max_threads`.
Para disponer de más memoria para Codex, aumente la asignación de memoria
del host, contenedor o cgroup. Un límite estricto del sistema operativo puede finalizar Codex en lugar de aplicarle contrapresión.

**El descubrimiento de modelos es lento:** reduzca
`plugins.entries.codex.config.discovery.timeoutMs` o deshabilite el descubrimiento.
Consulte [Referencia del arnés de Codex](/es/plugins/codex-harness-reference#model-discovery).

**El transporte WebSocket falla inmediatamente:** compruebe `appServer.url`,
`authToken`, los encabezados y que el app-server remoto use la misma versión del protocolo
del app-server de Codex. El transporte WebSocket de Codex sigue siendo experimental
y no es compatible; prefiera stdio administrado o el socket de control Unix local.

**Las herramientas nativas de shell o parches se bloquean con `Native hook relay
unavailable`:** el hilo de Codex sigue intentando usar un identificador nativo de retransmisión de hooks
que OpenClaw ya no tiene registrado. Este es un problema del transporte de hooks
nativos de Codex, no un fallo del backend ACP, del proveedor, de GitHub ni de los comandos
de shell. Inicie una sesión nueva en el chat afectado con `/new` o `/reset`
y vuelva a intentar un comando inofensivo. Si funciona una vez, pero la siguiente llamada
a una herramienta nativa vuelve a fallar, trate `/new` solo como una solución temporal: copie el
prompt en una sesión nueva después de reiniciar el app-server de Codex o el
Gateway de OpenClaw, para que se descarten los hilos antiguos y se vuelvan a crear los registros
de hooks nativos.

**Las llamadas a herramientas de Codex crean demasiados procesos de hooks de corta duración:** establezca
`plugins.entries.codex.config.appServer.loopDetectionPreToolUseRelay: false`
y reinicie el Gateway. Esto deshabilita únicamente el subproceso `PreToolUse` de Codex,
utilizado para la detección de bucles de OpenClaw y su marcador de ausencia de políticas. Las retransmisiones de políticas
obligatorias `before_tool_call` y de herramientas de confianza permanecen habilitadas.

**Un modelo que no es Codex usa el arnés integrado:** es lo esperado, salvo que la política de tiempo de ejecución
del proveedor o modelo lo dirija a otro arnés. Las referencias simples de proveedores que no sean OpenAI
permanecen en su ruta habitual de proveedor en el modo `auto`.

**Computer Use está instalado, pero las herramientas no se ejecutan:** compruebe
`/codex computer-use status` desde una sesión nueva. Si una herramienta informa
`Native hook relay unavailable`, use el procedimiento anterior de recuperación de la retransmisión de hooks nativos.
Consulte [Computer Use de Codex](/es/plugins/codex-computer-use#troubleshooting).

## Relacionado

- [Referencia del arnés de Codex](/es/plugins/codex-harness-reference)
- [Tiempo de ejecución del arnés de Codex](/es/plugins/codex-harness-runtime)
- [Supervisión de Codex](/es/plugins/codex-supervision)
- [Plugins nativos de Codex](/es/plugins/codex-native-plugins)
- [Computer Use de Codex](/es/plugins/codex-computer-use)
- [Tiempos de ejecución de agentes](/es/concepts/agent-runtimes)
- [Proveedores de modelos](/es/concepts/model-providers)
- [Proveedor de OpenAI](/es/providers/openai)
- [Ayuda de OpenAI Codex](https://help.openai.com/en/collections/14937394-codex)
- [Plugins de arnés de agentes](/es/plugins/sdk-agent-harness)
- [Hooks de Plugins](/es/plugins/hooks)
- [Exportación de diagnósticos](/es/gateway/diagnostics)
- [Estado](/es/cli/status)
- [Pruebas](/es/help/testing-live#live-codex-app-server-harness-smoke)
