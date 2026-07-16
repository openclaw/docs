---
read_when:
    - Quieres usar el entorno oficial de app-server de Codex
    - Necesita ejemplos de configuración del entorno de Codex
    - Quieres que las implementaciones exclusivas de Codex fallen en lugar de recurrir a OpenClaw
summary: Ejecuta turnos del agente integrado de OpenClaw mediante el arnés oficial del servidor de aplicaciones de Codex
title: Entorno de Codex
x-i18n:
    generated_at: "2026-07-16T11:49:22Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 7f27d934036ca6952ec12bbda3d275d08701a38ac9c79df37fc6040f01b529cd
    source_path: plugins/codex-harness.md
    workflow: 16
---

El plugin oficial `codex` ejecuta de forma integrada los turnos de agente de OpenAI mediante el
app-server de Codex en lugar del entorno integrado de OpenClaw. Codex controla la
sesión de agente de bajo nivel: reanudación nativa de hilos, continuación nativa de herramientas,
compaction nativa y ejecución mediante app-server. OpenClaw sigue controlando los
canales de chat, los archivos de sesión, la selección de modelos, las herramientas dinámicas de OpenClaw, las aprobaciones,
la entrega de contenido multimedia y la réplica visible de la transcripción.

Use referencias canónicas de modelos de OpenAI, como `openai/gpt-5.6-sol`. No configure
referencias heredadas de GPT para Codex; defina el orden de autenticación del agente de OpenAI en `auth.order.openai`.
Los identificadores heredados de perfiles de autenticación de Codex y las entradas heredadas del orden de autenticación de Codex se
reparan mediante `openclaw doctor --fix`.

Cuando la política de entorno de ejecución del proveedor/modelo no está configurada o es `auto`, el prefijo `openai/*` por sí solo
nunca selecciona este entorno. OpenAI puede seleccionar Codex implícitamente solo para una
ruta oficial HTTPS exacta de Platform Responses o ChatGPT Responses sin ninguna
sobrescritura de solicitud definida. Consulte
[Entorno de ejecución implícito del agente de OpenAI](/es/providers/openai#implicit-agent-runtime).
Si Codex controla la autenticación antes de que se conozca el enrutamiento entre Platform y ChatGPT, OpenClaw
sigue exigiendo que cada ruta candidata declare compatibilidad con Codex. El control nativo
de la autenticación por sí solo nunca omite esa comprobación de ruta.

Cuando no hay ningún entorno aislado de OpenClaw activo, OpenClaw inicia los hilos del app-server de Codex
con el modo de código nativo de Codex habilitado (el modo exclusivo de código permanece desactivado de forma predeterminada), por lo que
las capacidades nativas de espacio de trabajo y código siguen disponibles junto con las herramientas
dinámicas de OpenClaw enrutadas mediante el puente `item/tool/call` del app-server. Un
entorno aislado de OpenClaw activo o una política de herramientas restringida deshabilita por completo el modo de código nativo,
a menos que se habilite la ruta experimental del servidor de ejecución del entorno aislado.

Con el valor predeterminado `tools.exec.host: "auto"` y sin ningún entorno aislado de OpenClaw activo,
Codex también recibe las herramientas `node_exec` y `node_process` para ejecutar comandos en nodos
emparejados. El shell nativo permanece en el host y el espacio de trabajo del app-server de Codex
(local al Gateway en la implementación stdio predeterminada); `node_exec` selecciona un nodo por
nombre o identificador y mantiene vigente la política de aprobación de nodos de OpenClaw. Si una lista finita
de elementos permitidos del entorno de ejecución deshabilita el modo de código nativo y deja el turno sin un
entorno de ejecución, OpenClaw mantiene disponibles en su lugar sus herramientas `exec` y `process`
filtradas por políticas para la ejecución directa y sin aislamiento.

Esta función nativa de Codex es independiente del
[modo de código de OpenClaw](/es/reference/code-mode), un entorno de ejecución QuickJS-WASI opcional
para ejecuciones genéricas de OpenClaw con una forma de entrada `exec` diferente. Para comprender la
separación general entre modelo, proveedor y entorno de ejecución, comience por
[Entornos de ejecución de agentes](/es/concepts/agent-runtimes): `openai/gpt-5.6-sol` es la referencia del
modelo, `codex` es el entorno de ejecución y Telegram, Discord, Slack u otro
canal es la superficie de comunicación.

## Requisitos

- El plugin oficial `@openclaw/codex` instalado. Incluya `codex` en
  `plugins.allow` si la configuración utiliza una lista de elementos permitidos.
- Codex app-server `0.143.0` o una versión posterior. El plugin administra de forma predeterminada un
  binario compatible, por lo que un comando `codex` en `PATH` no afecta al inicio
  normal.
- Autenticación de Codex mediante `openclaw models auth login --provider openai`, una
  cuenta del app-server ya presente en el directorio principal de Codex del agente o un
  perfil explícito de autenticación mediante clave de API de Codex.

Para consultar la precedencia de autenticación, el aislamiento del entorno, los comandos personalizados del app-server,
la detección de modelos y la lista completa de campos de configuración, consulte
[Referencia del entorno de Codex](/es/plugins/codex-harness-reference).

## Inicio rápido

Instale el plugin oficial y, a continuación, inicie sesión mediante OAuth de Codex:

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

Si la configuración utiliza `plugins.allow`, añada también `codex` allí:

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
sesión, ejecute primero `/new` o `/reset` para que el siguiente turno determine el entorno
a partir de la configuración actual.

## Compartir hilos con Codex Desktop y la CLI

El valor predeterminado `appServer.homeScope: "agent"` aísla cada agente de OpenClaw del
estado nativo de Codex del operador. Para permitir que un propietario inspeccione y administre los
mismos hilos nativos que muestran Codex Desktop y la CLI de Codex, habilite el uso del
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
compartido mediante socket Unix. Utiliza `$CODEX_HOME` cuando está definido y `~/.codex` en caso contrario, lo que incluye
la autenticación, la configuración, los plugins y el almacén de hilos nativos de Codex de ese directorio principal. OpenClaw no
inyecta ningún perfil de autenticación de OpenClaw en este app-server.

Los turnos del propietario obtienen la herramienta `codex_threads`: permite enumerar, buscar, leer, bifurcar, cambiar el nombre,
archivar y restaurar hilos nativos. Bifurque un hilo para continuarlo en
OpenClaw; la bifurcación se vincula a la sesión actual de OpenClaw y permanece
visible para otros clientes nativos de Codex. Para archivar se requiere la confirmación explícita
de que el hilo está cerrado en otros lugares. Cuando la supervisión también está
habilitada, los campos y las modificaciones de la transcripción requieren la habilitación correspondiente de
`supervision.allowRawTranscripts` o `supervision.allowWriteControls`.

No reanude ni escriba simultáneamente en el mismo hilo mediante App Servers stdio administrados
independientes. Codex coordina los escritores activos dentro de un único App Server, no
entre procesos independientes. La bifurcación es la vía segura de coexistencia para las sesiones stdio
normales del directorio principal del usuario.

`appServer.homeScope: "user"` por sí solo no controla el catálogo de la flota. La
detección de sesiones nativas está habilitada mientras el plugin está activo; defina
`sessionCatalog.enabled: false` para eliminarla de la barra lateral de OpenClaw sin
deshabilitar Codex. El catálogo utiliza una conexión de supervisión independiente; sin
una configuración explícita de conexión `appServer`, esa conexión utiliza de forma predeterminada un proceso stdio administrado
del directorio principal del usuario, mientras que el entorno ordinario permanece limitado al agente. Ambas rutas respetan
la configuración explícita `appServer`. Defina `homeScope: "user"`
explícitamente, como se muestra arriba, cuando el entorno ordinario también deba compartir el estado nativo.

## Supervisar sesiones de Codex

El mismo plugin `codex` puede enumerar las sesiones de Codex no archivadas del equipo del Gateway
y de los nodos emparejados que hayan habilitado esta opción. Una sesión local del Gateway almacenada o inactiva puede
crear un chat bloqueado a un modelo que replica su historial persistente y acotado de mensajes del usuario y del asistente.
Su vinculación privada utiliza la conexión de supervisión para la instantánea nativa,
la rama canónica y los turnos posteriores, mientras que las sesiones ordinarias de Codex permanecen
limitadas al agente. El primer inicio canónico utiliza exactamente el modelo y el proveedor que
Codex devuelve para la bifurcación de la instantánea. Las reanudaciones posteriores dejan la selección a la
configuración nativa de Codex; el modelo externo de OpenClaw y la cadena de reserva nunca lo
sustituyen. Las filas almacenadas e inactivas pueden archivarse después de confirmar explícitamente
que no existe ningún otro ejecutor. Las fuentes activas no pueden crear una rama ni archivarse; un chat
supervisado existente puede seguir abriéndose. Las sesiones de nodos emparejados permanecen limitadas a metadatos.

Consulte [Supervisar sesiones de Codex](/es/plugins/codex-supervision) para conocer la configuración, las reglas de bifurcación,
los límites de los nodos emparejados, la exposición de metadatos y la solución de problemas.

## Configuración

| Necesidad                                           | Configuración                                                                                     | Ubicación                          |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------ | ---------------------------------- |
| Habilitar el entorno                                | `plugins.entries.codex.enabled: true`                                                            | Configuración de OpenClaw          |
| Ocultar la detección de sesiones nativas de Codex   | `plugins.entries.codex.config.sessionCatalog.enabled: false`                                     | Configuración del plugin de Codex  |
| Conservar la instalación de un plugin permitido     | Incluir `codex` en `plugins.allow`                                                               | Configuración de OpenClaw          |
| Permitir que los turnos de OpenAI aptos utilicen Codex implícitamente | Ruta oficial HTTPS exacta de Responses/ChatGPT, sin sobrescritura de solicitud definida, entorno de ejecución sin configurar/`auto` | Configuración del proveedor/modelo de OpenAI |
| Iniciar sesión con OAuth de ChatGPT/Codex            | `openclaw models auth login --provider openai`                                                   | Perfil de autenticación de la CLI  |
| Añadir una copia de seguridad mediante clave de API para ejecuciones de Codex | Perfil de clave de API `openai:*` enumerado después de la autenticación por suscripción en `auth.order.openai`                 | Perfil de autenticación de la CLI + configuración de OpenClaw |
| Aplicar cierre seguro cuando Codex no esté disponible | `agentRuntime.id: "codex"` del proveedor o modelo                                                     | Configuración de modelo/proveedor de OpenClaw |
| Utilizar tráfico directo de la API de OpenAI        | `agentRuntime.id: "openclaw"` del proveedor o modelo con la autenticación normal de OpenAI                          | Configuración de modelo/proveedor de OpenClaw |
| Ajustar el comportamiento del app-server            | `plugins.entries.codex.config.appServer.*`                                                       | Configuración del plugin de Codex  |
| Habilitar aplicaciones de plugins nativos de Codex  | `plugins.entries.codex.config.codexPlugins.*`                                                    | Configuración del plugin de Codex  |
| Habilitar Computer Use de Codex                     | `plugins.entries.codex.config.computerUse.*`                                                     | Configuración del plugin de Codex  |

Se recomienda `auth.order.openai` para establecer primero la suscripción y después la clave de API de respaldo.
Los identificadores existentes de perfiles de autenticación heredados de Codex y el orden de autenticación heredado de Codex son
estados heredados que solo debe gestionar doctor; no escriba nuevas referencias heredadas de GPT para Codex.

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
para la misma ejecución de Codex. El orden de los perfiles selecciona las credenciales, no el entorno de ejecución.
Cambiar el orden de autenticación no hace que una ruta personalizada, de Completions, HTTP o
con sobrescritura de solicitud sea compatible con Codex.

### Compaction

No defina `compaction.model` ni `compaction.provider` en agentes respaldados por
Codex. Codex realiza la compaction mediante el estado nativo de los hilos de su app-server, por lo que
OpenClaw ignora en tiempo de ejecución esas sobrescrituras del resumidor local y
`openclaw doctor --fix` las elimina cuando el agente utiliza Codex.

Lossless sigue siendo compatible como motor de contexto para el ensamblaje, la ingesta y el
mantenimiento en torno a los turnos de Codex, y se configura mediante
`plugins.slots.contextEngine: "lossless-claw"` y
`plugins.entries.lossless-claw.config.summaryModel`, no mediante
`agents.defaults.compaction.provider`. `openclaw doctor --fix` migra la
forma antigua `compaction.provider: "lossless-claw"` a la ranura del motor de contexto
Lossless cuando Codex es el entorno de ejecución activo, pero Codex nativo sigue
controlando la compaction. El entorno nativo del app-server admite motores de contexto
que necesitan ensamblaje previo a la instrucción; los backends genéricos de la CLI, incluido `codex-cli`,
no proporcionan esa capacidad del host.

Para los agentes respaldados por Codex, `/compact` inicia la compaction nativa del app-server de Codex
en el hilo vinculado. OpenClaw no espera a que finalice,
no impone un tiempo de espera de OpenClaw, no reinicia el app-server compartido ni recurre a un
motor de contexto o a un resumidor público de OpenAI. Si falta la vinculación del hilo nativo
de Codex o está obsoleta, el comando aplica un cierre seguro en lugar de cambiar
silenciosamente el backend de compaction.

El resto de esta página trata la forma de implementación, el enrutamiento con cierre seguro, la política de aprobación
del guardián, los plugins nativos de Codex y Computer Use. Para consultar las listas completas de opciones,
los valores predeterminados, las enumeraciones, la detección, el aislamiento del entorno, los tiempos de espera y
los campos de transporte del app-server, consulte
[Referencia del entorno de Codex](/es/plugins/codex-harness-reference).

## Verificar el runtime de Codex

Use `/status` en el chat donde espera usar Codex. Un turno de agente de OpenAI
respaldado por Codex muestra:

```text
Runtime: OpenAI Codex
```

A continuación, compruebe el estado del app-server de Codex:

```text
/codex status
/codex models
```

`/codex status` informa sobre la conectividad del app-server, la cuenta, los límites de uso, los servidores
MCP y las Skills. `/codex models` enumera el catálogo activo del app-server de Codex
para el entorno de ejecución y la cuenta. Si `/status` resulta inesperado, consulte
[Solución de problemas](#troubleshooting).

## Enrutamiento y selección de modelos

Mantenga separadas las referencias de proveedores y la política del runtime:

- Use `openai/gpt-*` para la selección canónica de modelos de OpenAI. El prefijo por sí solo
  nunca selecciona Codex.
- Cuando el runtime no está definido o es `auto`, solo una ruta oficial HTTPS exacta de Platform Responses
  o ChatGPT Responses sin una anulación de solicitud definida puede seleccionar Codex
  implícitamente.
- No use referencias heredadas a GPT de Codex en la configuración; ejecute `openclaw doctor --fix` para
  reparar las referencias heredadas y las fijaciones obsoletas de rutas de sesión.
- `agentRuntime.id: "codex"` convierte Codex en un requisito de cierre ante fallos para una
  ruta compatible. No convierte en compatible una ruta efectiva incompatible.
- `agentRuntime.id: "openclaw"` configura un proveedor o modelo para que use el runtime
  integrado de OpenClaw cuando sea intencional.
- `/codex ...` controla las conversaciones nativas del app-server de Codex desde el chat.
- ACP/acpx es una ruta independiente de entorno de ejecución externo. Úsela solo cuando el usuario
  solicite ACP/acpx o un adaptador de entorno de ejecución externo.

| Intención del usuario                                      | Uso                                                                                                   |
| ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Asociar el chat actual                                     | `/codex bind [thread-id] [--cwd <path>] [--model <model>] [--provider <provider>]`                    |
| Reanudar un hilo de Codex existente                        | `/codex resume <thread-id>`                                                                           |
| Enumerar o filtrar hilos de Codex                          | `/codex threads [filter]`                                                                             |
| Enumerar Plugins nativos de Codex                          | `/codex plugins list`                                                                                 |
| Activar o desactivar un Plugin nativo de Codex configurado | `/codex plugins enable <name>`, `/codex plugins disable <name>`                                       |
| Reanudar una sesión almacenada de la CLI de Codex como turno de un Node emparejado | `/codex sessions --host <node> [filter]`, después `/codex resume <session-id> --host <node> --bind here` |
| Ver sesiones de Codex no archivadas entre equipos          | Active la supervisión de Codex y abra **Sesiones de Codex**                                          |
| Cambiar el modelo, el modo rápido o los permisos del hilo asociado | `/codex model <model>`, `/codex fast [on\|off\|status]`, `/codex permissions [default\|yolo\|status]` |
| Detener o dirigir el turno activo                          | `/codex stop`, `/codex steer <text>`                                                                  |
| Desasociar la vinculación actual                           | `/codex detach` (alias `/codex unbind`)                                                               |
| Enviar únicamente comentarios sobre Codex                  | `/codex diagnostics [note]`                                                                           |
| Iniciar una tarea de ACP/acpx                              | Comandos de sesión de ACP/acpx, no `/codex`                                                               |

| Caso de uso                                      | Configuración                                                                                               | Verificación                            | Notas                                      |
| ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------- | --------------------------------------- | ------------------------------------------ |
| Ruta de OpenAI apta con runtime nativo de Codex  | Ruta oficial HTTPS exacta de Responses/ChatGPT sin anulación de solicitud definida, más el Plugin `codex` activado | `/status` muestra `Runtime: OpenAI Codex` | Ruta implícita cuando el runtime no está definido/es `auto` |
| Cerrar ante fallos si Codex no está disponible   | `agentRuntime.id: "codex"` del proveedor o modelo                                                                | El turno falla en lugar de recurrir al runtime integrado | Úselo para implementaciones exclusivas de Codex |
| Tráfico directo con clave de API de OpenAI a través de OpenClaw | `agentRuntime.id: "openclaw"` del proveedor o modelo y autenticación normal de OpenAI                                      | `/status` muestra el runtime de OpenClaw        | Úselo solo cuando OpenClaw sea intencional |
| Configuración heredada                           | Referencias heredadas a GPT de Codex                                                                        | `openclaw doctor --fix` las reescribe     | No escriba configuraciones nuevas de esta forma |
| Adaptador Codex de ACP/acpx                      | `sessions_spawn({ runtime: "acp" })` de ACP                                                                    | Estado de tarea/sesión de ACP           | Independiente del entorno de ejecución nativo de Codex |

`agents.defaults.imageModel` sigue la misma división de prefijos. Use `openai/gpt-*`
para la ruta normal de OpenAI y `codex/gpt-*` solo cuando la comprensión de imágenes
deba ejecutarse mediante un turno acotado del app-server de Codex. Doctor reescribe las
referencias heredadas a GPT de Codex como `openai/gpt-*`.

## Patrones de implementación

### Implementación básica de Codex

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

### Implementación con varios proveedores

Mantenga Claude como agente predeterminado y añada un agente Codex con nombre:

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
app-server de Codex cuando su ruta efectiva de OpenAI sigue siendo compatible; añada
`agentRuntime.id: "codex"` explícito para el modelo cuando esto deba ser un requisito
de cierre ante fallos.

### Implementación de Codex con cierre ante fallos

Una ruta de OpenAI apta, oficial, HTTPS y exacta puede resolverse mediante Codex cuando el
Plugin incluido está disponible. Añada una política de runtime explícita para establecer una regla
de cierre ante fallos:

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

Con Codex forzado, OpenClaw falla de forma anticipada si la ruta efectiva no está declarada
como compatible con Codex, el Plugin está desactivado, el app-server es demasiado antiguo o el
app-server no puede iniciarse.

## Política del app-server

De forma predeterminada, el Plugin inicia localmente el binario administrado de Codex de OpenClaw con
transporte stdio. Defina `appServer.command` solo para ejecutar intencionalmente un
ejecutable diferente. Use el transporte WebSocket solo cuando ya haya un app-server
ejecutándose en otro lugar:

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

Las sesiones locales del app-server mediante stdio adoptan de forma predeterminada la
postura del operador local de confianza: `approvalPolicy: "never"`, `approvalsReviewer: "user"` y
`sandbox: "danger-full-access"`. Si los requisitos locales de Codex no permiten esa
postura YOLO implícita, OpenClaw selecciona en su lugar los permisos permitidos de Guardian.
Cuando un entorno aislado de OpenClaw está activo para la sesión, OpenClaw
desactiva el Code Mode nativo de Codex, los servidores MCP del usuario y la ejecución de
Plugins respaldados por aplicaciones para ese turno, en lugar de depender del entorno aislado
del lado del host de Codex. El acceso al shell se realiza en su lugar mediante herramientas
dinámicas respaldadas por el entorno aislado de OpenClaw, como `sandbox_exec` y
`sandbox_process`, cuando están disponibles las herramientas normales de ejecución/procesos.

Use el modo de ejecución normalizado de OpenClaw para la revisión automática nativa de Codex antes de
escapar del entorno aislado u obtener permisos adicionales:

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
OpenClaw no conserva las anulaciones heredadas no seguras de Codex `approvalPolicy: "never"` ni
`sandbox: "danger-full-access"`; use `tools.exec.mode: "full"` para
establecer intencionalmente una postura de Codex sin aprobaciones. El ajuste preestablecido heredado
`plugins.entries.codex.config.appServer.mode: "guardian"` sigue
funcionando, pero `tools.exec.mode: "auto"` es la superficie normalizada de OpenClaw.

Para consultar la comparación por modo con las aprobaciones de ejecución del host y los
permisos de ACPX, consulte [Modos de permisos](/es/tools/permission-modes). Para conocer todos
los campos del app-server, el orden de autenticación, el aislamiento del entorno y el comportamiento
de los tiempos de espera, consulte [Referencia del entorno de ejecución de Codex](/es/plugins/codex-harness-reference).

## Comandos y diagnósticos

El Plugin `codex` registra `/codex` como comando de barra diagonal en cualquier canal que
admita comandos de texto de OpenClaw.

La ejecución y el control nativos requieren un propietario o un cliente de Gateway
`operator.admin`: asociar o reanudar hilos, enviar o detener turnos,
cambiar el modelo, el modo rápido o el estado de los permisos, realizar Compaction o revisiones y
desasociar una vinculación. Los demás remitentes autorizados conservan los comandos de solo lectura
para inspeccionar el estado, la ayuda, la cuenta, los modelos, los hilos, los servidores MCP, las
Skills y las vinculaciones.

Formas habituales:

- `/codex status` comprueba la conectividad del app-server, los modelos, la cuenta, los límites
  de uso, los servidores MCP y las Skills.
- `/codex models` enumera los modelos activos del app-server de Codex.
- `/codex threads [filter]` enumera los hilos recientes del app-server de Codex.
- `/codex resume <thread-id>` asocia la sesión actual de OpenClaw con un
  hilo de Codex existente.
- `/codex bind [thread-id] [--cwd <path>] [--model <model>] [--provider <provider>]`
  asocia el chat actual.
- `/codex detach` (o `/codex unbind`) desasocia la vinculación actual.
- `/codex binding` describe la vinculación actual.
- `/codex stop` detiene el turno activo; `/codex steer <text>` lo dirige.
- `/codex model <model>`, `/codex fast [on|off|status]` y
  `/codex permissions [default|yolo|status]` cambian el estado de cada conversación.
- `/codex compact` solicita al app-server de Codex que realice Compaction en el hilo asociado.
- `/codex review` inicia la revisión nativa de Codex para el hilo asociado.
- `/codex diagnostics [note]` solicita confirmación antes de enviar comentarios sobre Codex para el
  hilo asociado.
- `/codex account` muestra el estado de la cuenta y de los límites de uso.
- `/codex mcp` enumera el estado de los servidores MCP del app-server de Codex.
- `/codex skills` enumera las Skills del app-server de Codex.
- `/codex plugins list`, `/codex plugins enable <name>` y
  `/codex plugins disable <name>` administran los Plugins nativos de Codex configurados.
- `/codex computer-use [status|install]` administra Codex Computer Use.
- `/codex help` enumera el árbol de comandos completo.

Para la mayoría de los informes de soporte, empieza con `/diagnostics [note]` en la
conversación donde se produjo el error. Esto crea un informe de diagnóstico
del Gateway y, para las sesiones del entorno de Codex, solicita aprobación para enviar el
paquete de comentarios de Codex pertinente. Consulta
[Exportación de diagnósticos](/es/gateway/diagnostics) para conocer el modelo de privacidad y el comportamiento
del chat grupal. Usa `/codex diagnostics [note]` solo cuando quieras específicamente
cargar los comentarios de Codex para el hilo adjunto actualmente sin
el paquete completo de diagnósticos del Gateway.

### Inspeccionar localmente los hilos de Codex

La forma más rápida de inspeccionar una ejecución problemática de Codex suele ser abrir directamente el hilo
nativo de Codex:

```bash
codex resume <thread-id>
```

Obtén el id del hilo de la respuesta completada de `/diagnostics`, `/codex binding`
o `/codex threads [filter]`.

Para conocer los mecanismos de carga y los límites de diagnóstico en el nivel de ejecución, consulta
[Entorno de ejecución de Codex](/es/plugins/codex-harness-runtime#codex-feedback-upload).

### Orden de autenticación

En el directorio principal predeterminado por agente, la autenticación se selecciona en este orden:

1. Perfiles de autenticación de OpenAI ordenados para el agente, preferiblemente en
   `auth.order.openai`. Ejecuta `openclaw doctor --fix` para migrar los identificadores antiguos de perfiles
   de autenticación heredados de Codex y el orden de autenticación heredado de Codex.
2. La cuenta existente del servidor de aplicaciones en el directorio principal de Codex de ese agente.
3. Solo para inicios locales del servidor de aplicaciones mediante stdio, `CODEX_API_KEY` y después
   `OPENAI_API_KEY`, cuando no hay ninguna cuenta del servidor de aplicaciones y todavía
   se requiere autenticación de OpenAI.

Cuando OpenClaw detecta un perfil de autenticación de Codex basado en una suscripción de ChatGPT,
elimina `CODEX_API_KEY` y `OPENAI_API_KEY` del proceso secundario de Codex
iniciado. Esto mantiene disponibles las claves de API del Gateway para incrustaciones o
modelos directos de OpenAI sin provocar accidentalmente que los turnos del servidor de aplicaciones
nativo de Codex se facturen a través de la API. Los perfiles explícitos de claves de API de Codex y el
uso alternativo local de claves de entorno mediante stdio usan el inicio de sesión del servidor de aplicaciones en lugar de las
variables de entorno heredadas por el proceso secundario. Las conexiones WebSocket del servidor de aplicaciones no reciben el uso
alternativo de claves de API del entorno del Gateway; usa un perfil de autenticación explícito o la
cuenta propia del servidor de aplicaciones remoto.

Si un perfil de suscripción alcanza un límite de uso de Codex, OpenClaw registra la
hora de restablecimiento cuando Codex la comunica y prueba el siguiente perfil de autenticación ordenado
para la misma ejecución de Codex. Cuando pasa la hora de restablecimiento, el perfil de
suscripción vuelve a ser apto sin cambiar el modelo `openai/gpt-*`
seleccionado ni el entorno de ejecución de Codex.

Cuando se configuran plugins nativos de Codex, OpenClaw instala o actualiza
esos plugins mediante el servidor de aplicaciones conectado antes de exponer las aplicaciones
propiedad de los plugins al hilo de Codex. `app/list` sigue siendo la fuente de referencia para los
identificadores, la accesibilidad y los metadatos de las aplicaciones, pero OpenClaw controla la decisión
de habilitación por hilo: si la política permite una aplicación accesible incluida en la lista, OpenClaw
envía `thread/start.config.apps[appId].enabled = true` incluso cuando `app/list`
indica actualmente que esa aplicación está deshabilitada. Esta ruta no crea una instalación
de aplicaciones para identificadores desconocidos; OpenClaw solo activa plugins del marketplace
con `plugin/install` y después actualiza el inventario.

### Aislamiento del entorno

Para los inicios locales del servidor de aplicaciones mediante stdio, OpenClaw establece `CODEX_HOME` en un
directorio por agente para que la configuración, los archivos de autenticación y cuenta, la caché y los datos de plugins,
y el estado nativo de los hilos de Codex no lean ni escriban de forma predeterminada en el
`~/.codex` personal del operador. OpenClaw conserva el `HOME` normal del proceso;
los subprocesos ejecutados por Codex aún pueden encontrar configuraciones y tokens del directorio principal del usuario,
y Codex puede descubrir entradas compartidas de `$HOME/.agents/skills` y
`$HOME/.agents/plugins/marketplace.json`. Con
`appServer.homeScope: "user"`, OpenClaw usa en su lugar el directorio principal nativo de Codex del usuario
y su cuenta existente sin inyectar un perfil de autenticación de OpenClaw.

Si un despliegue necesita aislamiento adicional del entorno, añade esas
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
la normalización del inicio local: `CODEX_HOME` sigue apuntando al ámbito
seleccionado del agente o usuario, y `HOME` sigue heredándose para que los subprocesos puedan usar
el estado normal del directorio principal del usuario.

### Herramientas dinámicas y búsqueda web

Las herramientas dinámicas de Codex usan de forma predeterminada la carga `searchable`. OpenClaw normalmente no
expone herramientas dinámicas que duplican operaciones nativas de Codex en el espacio de trabajo:
`read`, `write`, `edit`, `apply_patch`, `exec`, `process`, `update_plan`,
`tool_call`, `tool_describe`, `tool_search` y `tool_search_code`. La mayoría de
las demás herramientas de integración de OpenClaw, como mensajería, contenido multimedia, cron,
navegador, nodos, gateway y `heartbeat_respond`, están disponibles mediante
la búsqueda de herramientas de Codex en el espacio de nombres `openclaw`, lo que mantiene más pequeño el contexto
inicial del modelo. El uso alternativo del shell para turnos restringidos constituye la excepción para
`exec` y `process` cuando una lista finita de permitidos deshabilita el Code Mode nativo;
las listas de permitidos del entorno de ejecución y `codexDynamicToolsExclude` siguen siendo aplicables.

Las herramientas marcadas como `catalogMode: "direct-only"`, incluida la herramienta `computer`
de OpenClaw, usan en su lugar el espacio de nombres `openclaw_direct`. Codex trata ese espacio de nombres
como `DirectModelOnly`, por lo que esas herramientas permanecen visibles directamente para el modelo en los hilos normales
y exclusivos de Code Mode, en lugar de atravesar llamadas anidadas de Code Mode `tools.*`.

La búsqueda web usa de forma predeterminada la herramienta alojada `web_search` de Codex cuando la búsqueda está
habilitada y no se ha seleccionado ningún proveedor gestionado. La búsqueda alojada nativa y
la herramienta dinámica gestionada `web_search` de OpenClaw son mutuamente excluyentes para que
la búsqueda gestionada no pueda eludir las restricciones de dominio nativas. OpenClaw usa la
herramienta gestionada cuando la búsqueda alojada no está disponible, se deshabilita explícitamente o
se sustituye por un proveedor gestionado seleccionado. OpenClaw mantiene deshabilitada la extensión
independiente `web.run` de Codex porque el tráfico de producción del servidor de aplicaciones rechaza
su espacio de nombres `web` definido por el usuario. `tools.web.search.enabled: false`
deshabilita ambas rutas, al igual que las ejecuciones exclusivamente de LLM con las herramientas deshabilitadas. Codex trata
`"cached"` como una preferencia y la resuelve como acceso externo activo para
los turnos no restringidos del servidor de aplicaciones. El uso alternativo gestionado automático falla de forma cerrada cuando
se establecen `allowedDomains` nativos, de modo que no se pueda eludir la lista de permitidos.
Los cambios persistentes en la política de búsqueda efectiva rotan el hilo de Codex vinculado
antes del siguiente turno; las restricciones transitorias por turno usan un hilo restringido
temporal y conservan la vinculación existente para reanudarla más adelante.

`sessions_yield` y las respuestas de origen exclusivas de la herramienta de mensajes se mantienen directas porque
son contratos de control de turnos. `sessions_spawn` sigue siendo localizable mediante búsqueda para que
el `spawn_agent` nativo de Codex siga siendo la superficie principal de subagentes de Codex,
mientras que la delegación explícita mediante OpenClaw o ACP continúa disponible a través del
espacio de nombres de herramientas dinámicas `openclaw`. Las instrucciones de colaboración de Heartbeat
indican a Codex que busque `heartbeat_respond` antes de finalizar un turno de Heartbeat
cuando la herramienta aún no está cargada.

Establece `codexDynamicToolsLoading: "direct"` solo al conectarse a un servidor de aplicaciones
de Codex personalizado que no pueda buscar herramientas dinámicas diferidas o al
depurar la carga completa de herramientas.

### Campos de configuración

Campos de nivel superior compatibles del plugin de Codex:

| Campo                      | Valor predeterminado        | Significado                                                                                  |
| -------------------------- | -------------- | ---------------------------------------------------------------------------------------- |
| `codexDynamicToolsLoading` | `"searchable"` | Usa `"direct"` para colocar las herramientas dinámicas de OpenClaw directamente en el contexto inicial de herramientas de Codex. |
| `codexDynamicToolsExclude` | `[]`           | Nombres adicionales de herramientas dinámicas de OpenClaw que se deben omitir de los turnos del servidor de aplicaciones de Codex.              |
| `codexPlugins`             | deshabilitado       | Compatibilidad nativa de Codex con plugins y aplicaciones para plugins seleccionados migrados e instalados desde el código fuente.           |
| `sessionCatalog`           | habilitado        | Detección en la barra lateral de sesiones nativas de Codex en este Gateway y en los nodos emparejados aptos.   |
| `supervision`              | deshabilitado       | Política de transcripción y control de escritura de sesiones nativas orientada al agente.                         |

Campos compatibles de `appServer`:

| Campo                                         | Valor predeterminado                                                | Significado                                                                                                                                                                                                                                                                                                                                                                                         |
| --------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                                   | `"stdio"`                                              | `"stdio"` inicia Codex; `"unix"` explícito se conecta al socket de control local; `"websocket"` se conecta a `url`.                                                                                                                                                                                                                                                                                |
| `homeScope`                                   | `"agent"`                                              | `"agent"` aísla el estado ordinario del arnés para cada agente de OpenClaw. `"user"` es una activación explícita que comparte el `$CODEX_HOME` o `~/.codex` nativo, utiliza la autenticación nativa y habilita la gestión de hilos solo para el propietario. El ámbito de usuario admite stdio local o transporte Unix. Para la conexión de supervisión independiente, un valor sin establecer se resuelve como `"user"` para stdio o Unix y como `"agent"` para WebSocket.     |
| `command`                                     | binario de Codex administrado                                   | Ejecutable para el transporte stdio. Déjelo sin establecer para usar el binario administrado; establézcalo únicamente para una anulación explícita.                                                                                                                                                                                                                                                                                    |
| `args`                                        | `["app-server", "--listen", "stdio://"]`               | Argumentos para el transporte stdio.                                                                                                                                                                                                                                                                                                                                                                  |
| `url`                                         | sin establecer                                                  | URL del App Server de WebSocket o URL `unix://`. Una ruta Unix explícita vacía selecciona el socket de control canónico del directorio personal del usuario.                                                                                                                                                                                                                                                                          |
| `authToken`                                   | sin establecer                                                  | Token de portador para el transporte WebSocket. Acepta una cadena literal o SecretInput, como `${CODEX_APP_SERVER_TOKEN}`.                                                                                                                                                                                                                                                                              |
| `headers`                                     | `{}`                                                   | Encabezados WebSocket adicionales. Los valores de los encabezados aceptan cadenas literales o valores SecretInput, por ejemplo, `x-codex-client-session-token: "${CODEX_CLIENT_SESSION_TOKEN}"`.                                                                                                                                                                                                                               |
| `clearEnv`                                    | `[]`                                                   | Nombres de variables de entorno adicionales que se eliminan del proceso app-server stdio iniciado después de que OpenClaw construye su entorno heredado. OpenClaw conserva el `CODEX_HOME` seleccionado y el `HOME` heredado para los inicios locales.                                                                                                                                                                           |
| `codeModeOnly`                                | `false`                                                | Activa la superficie de herramientas de Codex exclusiva del modo de código. Las herramientas dinámicas ordinarias de OpenClaw siguen disponibles mediante llamadas `tools.*` anidadas; las herramientas `openclaw_direct` permanecen directamente visibles para el modelo.                                                                                                                                                                                                             |
| `remoteWorkspaceRoot`                         | sin establecer                                                  | Raíz remota del espacio de trabajo del app-server de Codex. Cuando se establece, OpenClaw deduce la raíz del espacio de trabajo local a partir del espacio de trabajo de OpenClaw resuelto, conserva el sufijo del cwd actual bajo esta raíz remota y envía a Codex únicamente el cwd final del app-server. Si el cwd está fuera de la raíz del espacio de trabajo de OpenClaw resuelta, OpenClaw aplica un cierre seguro en lugar de enviar una ruta local del Gateway al app-server remoto. |
| `requestTimeoutMs`                            | `60000`                                                | Tiempo de espera para las llamadas del plano de control del app-server.                                                                                                                                                                                                                                                                                                                                                     |
| `turnCompletionIdleTimeoutMs`                 | `60000`                                                | Intervalo de silencio después de que Codex acepta un turno o tras una solicitud del app-server limitada al turno, mientras OpenClaw espera `turn/completed`.                                                                                                                                                                                                                                                                    |
| `postToolRawAssistantCompletionIdleTimeoutMs` | `300000`                                               | Protección de inactividad de finalización y progreso utilizada después de una transferencia a una herramienta, la finalización de una herramienta nativa, el progreso sin procesar del asistente posterior a una herramienta, la finalización del razonamiento sin procesar o el progreso del razonamiento mientras OpenClaw espera `turn/completed`. Utilícela para cargas de trabajo de confianza o pesadas en las que la síntesis posterior a una herramienta pueda permanecer legítimamente en silencio durante más tiempo que el presupuesto de publicación final del asistente.                                |
| `mode`                                        | `"yolo"` salvo que los requisitos locales de Codex no permitan YOLO | Configuración predefinida para la ejecución YOLO o revisada por el guardián. Los requisitos locales de stdio que omiten `danger-full-access`, la aprobación `never` o el revisor `user` hacen que el valor predeterminado implícito sea el guardián.                                                                                                                                                                                                           |
| `approvalPolicy`                              | `"never"` o una política de aprobación del guardián permitida       | Política de aprobación nativa de Codex enviada al iniciar, reanudar o ejecutar un turno del hilo. Los valores predeterminados del guardián prefieren `"on-request"` cuando se permite.                                                                                                                                                                                                                                                                            |
| `sandbox`                                     | `"danger-full-access"` o un entorno aislado del guardián permitido  | Modo de entorno aislado nativo de Codex enviado al iniciar o reanudar el hilo. Los valores predeterminados del guardián prefieren `"workspace-write"` cuando se permite; de lo contrario, `"read-only"`. Cuando hay un entorno aislado de OpenClaw activo, los turnos `danger-full-access` usan `workspace-write` de Codex con acceso a la red derivado de la configuración de salida del entorno aislado de OpenClaw.                                                                                     |
| `approvalsReviewer`                           | `"user"` o un revisor del guardián permitido               | Use `"auto_review"` para permitir que Codex revise las solicitudes de aprobación nativas cuando esté permitido; de lo contrario, use `guardian_subagent` o `user`. `guardian_subagent` sigue siendo un alias heredado.                                                                                                                                                                                                                              |
| `serviceTier`                                 | sin establecer                                                  | Nivel de servicio opcional del app-server de Codex. `"priority"` habilita el enrutamiento en modo rápido, `"flex"` solicita el procesamiento flexible, `null` elimina la anulación y el valor heredado `"fast"` se acepta como `"priority"`.                                                                                                                                                                                                 |
| `networkProxy`                                | deshabilitado                                               | Activa la red de perfiles de permisos de Codex para los comandos del app-server. OpenClaw define la configuración `permissions.<profile>.network` seleccionada y la elige mediante `default_permissions` en lugar de enviar `sandbox`.                                                                                                                                                                             |
| `experimental.sandboxExecServer`              | `false`                                                | Activación de vista previa que registra un entorno de Codex respaldado por el entorno aislado de OpenClaw en el app-server compatible de Codex, para que la ejecución nativa de Codex pueda realizarse dentro del entorno aislado activo de OpenClaw.                                                                                                                                                                                                            |

`appServer.networkProxy` es explícito porque cambia el contrato del entorno aislado
de Codex. Cuando se habilita, OpenClaw también establece `features.network_proxy.enabled`
y `default_permissions` en la configuración del hilo de Codex para que el perfil
de permisos generado pueda iniciar la red administrada por Codex. De forma predeterminada, OpenClaw
genera un nombre de perfil `openclaw-network-<fingerprint>` resistente a colisiones
a partir del cuerpo del perfil; use `profileName` únicamente cuando se requiera
un nombre local estable.

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

Si el entorno de ejecución normal de app-server fuera `danger-full-access`, al habilitar
`networkProxy` se usa acceso al sistema de archivos de estilo espacio de trabajo para el perfil
de permisos generado: la aplicación de red administrada por Codex utiliza redes
aisladas, por lo que un perfil de acceso completo no protegería el tráfico saliente.
Las entradas de dominio usan `allow` o `deny`; las entradas de sockets Unix usan los valores
`allow` o `none` de Codex.

### Tiempos de espera de llamadas a herramientas dinámicas

Las llamadas a herramientas dinámicas propiedad de OpenClaw se limitan independientemente de
`appServer.requestTimeoutMs`: las solicitudes `item/tool/call` de Codex usan de forma predeterminada un supervisor de OpenClaw de 90
segundos. Un argumento `timeoutMs` positivo por llamada amplía
o reduce el límite de esa herramienta específica, con un máximo de 600000 ms.
La herramienta `image_generate` usa `agents.defaults.imageGenerationModel.timeoutMs`
cuando la llamada a la herramienta no proporciona su propio tiempo de espera, o bien un valor predeterminado de generación
de imágenes de 120 segundos en los demás casos. La herramienta de comprensión multimedia `image`
usa `tools.media.image.timeoutSeconds` o su valor predeterminado multimedia de 60 segundos; para
la comprensión de imágenes, ese tiempo de espera se aplica a la solicitud misma y no se
reduce por el trabajo de preparación anterior. Cuando se agota el tiempo, OpenClaw cancela la señal
de la herramienta cuando es compatible y devuelve a Codex una respuesta fallida de herramienta dinámica
para que el turno pueda continuar en lugar de dejar la sesión en `processing`.
Este supervisor es el límite dinámico externo de `item/tool/call`; los tiempos de espera
de solicitudes específicos del proveedor se ejecutan dentro de esa llamada y conservan su propia semántica de tiempo de espera.

Después de que Codex acepta un turno, y después de que OpenClaw responde a una solicitud
de app-server limitada al turno, el arnés espera que Codex progrese en el turno actual
y finalmente complete el turno nativo con `turn/completed`. Si el
app-server permanece inactivo durante `appServer.turnCompletionIdleTimeoutMs`, OpenClaw
intenta interrumpir el turno de Codex, registra un tiempo de espera de diagnóstico y
libera el carril de sesión de OpenClaw para que los mensajes de chat posteriores no queden
en cola detrás de un turno nativo obsoleto. La mayoría de las notificaciones no terminales del
mismo turno desactivan ese breve supervisor porque Codex ha demostrado que el turno
sigue activo.

Las transferencias de herramientas usan un límite de inactividad posterior a la herramienta más largo: después de que OpenClaw devuelve una
respuesta `item/tool/call`, después de que se completan elementos de herramientas nativas como
`commandExecution`, después de las finalizaciones sin procesar de `custom_tool_call_output`,
y después del progreso sin procesar del asistente posterior a la herramienta, las finalizaciones de razonamiento
sin procesar o el progreso de razonamiento. La protección usa
`appServer.postToolRawAssistantCompletionIdleTimeoutMs` cuando está configurado y
de forma predeterminada usa cinco minutos en los demás casos; ese mismo límite también amplía el
supervisor de progreso durante el intervalo de síntesis silenciosa antes de que Codex emita el
siguiente evento del turno actual. Las notificaciones globales de app-server, como las
actualizaciones de límites de frecuencia, no restablecen el progreso de inactividad del turno. Las finalizaciones de razonamiento,
las finalizaciones de `agentMessage` de comentario y el razonamiento sin procesar previo a la herramienta o
el progreso del asistente pueden ir seguidos de una respuesta final automática, por lo que usan
la protección de respuesta posterior al progreso en lugar de liberar el carril de sesión
inmediatamente.

Solo los elementos `agentMessage` completados finales/sin comentarios y las finalizaciones sin procesar
del asistente previas a la herramienta activan la liberación de salida del asistente: si Codex queda
inactivo sin `turn/completed`, OpenClaw intenta interrumpir el turno nativo
y libera el carril de sesión. Si otro supervisor de turno gana esa carrera de liberación,
OpenClaw aún acepta el elemento final completado del asistente cuando ya no queda
activa ninguna solicitud nativa, elemento ni finalización de herramienta dinámica y la
liberación de salida del asistente aún pertenece al último elemento completado, sin
ninguna finalización de elemento posterior. Esto puede conservar la respuesta final después
del trabajo de herramientas completado sin reproducir el turno. Los deltas parciales del asistente,
las respuestas anteriores obsoletas y las finalizaciones posteriores vacías no cumplen los requisitos.

Los fallos de app-server stdio seguros para reproducción, incluidos los tiempos de espera
por inactividad de finalización del turno sin pruebas del asistente, herramientas, elementos activos
ni efectos secundarios, se vuelven a intentar una vez en un nuevo intento de app-server. Los tiempos de espera
no seguros siguen retirando el cliente de app-server bloqueado y liberando el carril de sesión
de OpenClaw; también eliminan la vinculación obsoleta del hilo nativo en lugar de reproducirse
automáticamente. Los tiempos de espera del supervisor de finalización muestran texto específico de Codex:
los casos seguros para reproducción indican que la respuesta puede estar incompleta, mientras que los casos
no seguros indican al usuario que verifique el estado actual antes de volver a intentarlo. Los diagnósticos
públicos de tiempo de espera incluyen campos estructurales como el último método de notificación
de app-server, el id/tipo/rol del elemento de respuesta sin procesar del asistente, los recuentos de
solicitudes/elementos activos y el estado del supervisor activado; cuando la última notificación es un
elemento de respuesta sin procesar del asistente, también incluyen una vista previa limitada del texto
del asistente. No incluyen el contenido sin procesar del prompt ni de las herramientas.

### Modificaciones de entorno para pruebas locales

- `OPENCLAW_CODEX_APP_SERVER_BIN` omite el binario administrado cuando
  `appServer.command` no está definido.
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

Se eliminó `OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1`. Use
`plugins.entries.codex.config.appServer.mode: "guardian"` en su lugar, o
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` para pruebas locales puntuales. Se
prefiere la configuración para despliegues reproducibles porque mantiene el comportamiento
del plugin en el mismo archivo revisado que el resto de la configuración del arnés de Codex.

## Plugins nativos de Codex

La compatibilidad con plugins nativos de Codex usa las capacidades propias de aplicaciones y plugins
del app-server de Codex en el mismo hilo de Codex que el turno del arnés de OpenClaw. OpenClaw
no convierte los plugins de Codex en herramientas dinámicas sintéticas `codex_plugin_*` de OpenClaw.

`codexPlugins` solo afecta a las sesiones que seleccionan el arnés nativo de Codex.
No afecta a las ejecuciones del arnés integrado, las ejecuciones normales del proveedor OpenAI, las vinculaciones
de conversaciones ACP ni otros arneses.

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

La configuración de aplicaciones del hilo se calcula cuando OpenClaw establece una sesión
del arnés de Codex o reemplaza una vinculación obsoleta del hilo de Codex; no se vuelve a calcular
en cada turno. Después de cambiar `codexPlugins`, use `/new`, `/reset` o reinicie
el Gateway para que las futuras sesiones del arnés de Codex se inicien con el conjunto de aplicaciones
actualizado.

Para conocer la elegibilidad para la migración, el inventario de aplicaciones, la política de acciones destructivas,
las solicitudes de información y los diagnósticos de plugins nativos, consulte
[Plugins nativos de Codex](/es/plugins/codex-native-plugins).

El acceso a aplicaciones y plugins del lado de OpenAI está controlado por la cuenta de Codex
con la sesión iniciada y, para los espacios de trabajo Business y Enterprise/Edu, por los controles
de aplicaciones del espacio de trabajo. Consulte
[Uso de Codex con su plan de ChatGPT](https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan)
para obtener una descripción general de OpenAI sobre las cuentas y los controles del espacio de trabajo.

## Uso del equipo

Uso del equipo tiene su propia guía de configuración:
[Uso del equipo con Codex](/es/plugins/codex-computer-use).

Versión breve: OpenClaw no incluye la aplicación de control del escritorio ni ejecuta
acciones de escritorio por sí mismo. Prepara el app-server de Codex, verifica que el
servidor MCP `computer-use` esté disponible y luego permite que Codex controle las llamadas
a herramientas MCP nativas durante los turnos en modo Codex.

## Límites del entorno de ejecución

El arnés de Codex solo cambia el ejecutor de agentes integrado de bajo nivel.

- Las herramientas dinámicas de OpenClaw son compatibles. Codex solicita a OpenClaw que ejecute
  esas herramientas, por lo que OpenClaw permanece en la ruta de ejecución.
- El shell, los parches, MCP y las herramientas de aplicaciones nativas de Codex pertenecen a Codex.
  OpenClaw puede observar o bloquear determinados eventos nativos mediante el
  relé compatible, pero no reescribe los argumentos de las herramientas nativas.
- Codex controla la Compaction nativa. OpenClaw conserva un reflejo de la transcripción para
  el historial del canal, la búsqueda, `/new`, `/reset` y futuros cambios de modelo o arnés,
  pero no sustituye la Compaction de Codex por un resumidor de OpenClaw ni del
  motor de contexto.
- La generación multimedia, la comprensión multimedia, TTS, las aprobaciones y la salida de
  herramientas de mensajería continúan mediante la configuración correspondiente de proveedor/modelo de OpenClaw.
- `tool_result_persist` se aplica a los resultados de herramientas de transcripción propiedad de OpenClaw,
  no a los registros de resultados de herramientas nativas de Codex.

Para obtener información sobre las capas de hooks, las superficies V1 compatibles, la gestión de permisos nativos,
la dirección de colas, los mecanismos de carga de comentarios de Codex y los detalles de Compaction, consulte
[Entorno de ejecución del arnés de Codex](/es/plugins/codex-harness-runtime).

## Solución de problemas

**Codex no aparece como un proveedor `/model` normal:** es lo esperado para las
configuraciones nuevas. Seleccione un modelo `openai/gpt-*`, habilite
`plugins.entries.codex.enabled` y compruebe si `plugins.allow` excluye
`codex`.

**OpenClaw usa el arnés integrado en lugar de Codex:** confirme que la ruta efectiva
sea una ruta oficial HTTPS exacta de Platform Responses o ChatGPT Responses,
que no tenga ninguna modificación de solicitud creada y que el plugin de Codex esté instalado y
habilitado. El prefijo `openai/gpt-*` por sí solo no es suficiente. Para obtener una prueba estricta durante
las pruebas, configure `agentRuntime.id: "codex"` en el proveedor o modelo; Codex forzado falla
en lugar de recurrir a una alternativa cuando la ruta o el arnés son incompatibles.

**El entorno de ejecución de OpenAI Codex recurre a la ruta de clave de API:** recopile un extracto
censurado del Gateway que muestre el modelo, el entorno de ejecución, el proveedor seleccionado y
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
`No API key`. Una ejecución corregida debe mostrar la ruta OAuth de OpenAI
en lugar de un fallo simple de clave de API de OpenAI.

**La configuración de referencias de modelos heredados de Codex permanece:** ejecute `openclaw doctor --fix`.
Doctor reescribe las referencias de modelos heredados como `openai/*`, elimina las vinculaciones obsoletas
del entorno de ejecución de la sesión y de todo el agente, y conserva las modificaciones existentes de perfiles de autenticación.

**El app-server es rechazado:** use la versión `0.143.0` o posterior del app-server de Codex.
Las versiones preliminares de la misma versión o las versiones con sufijo de compilación, como
`0.143.0-alpha.2` o `0.143.0+custom`, se rechazan porque OpenClaw comprueba
la versión mínima estable del protocolo `0.143.0`.

**`/codex status` no puede conectarse:** compruebe que el plugin `codex`
esté habilitado, que `plugins.allow` lo incluya cuando haya una lista de permitidos
configurada y que cualquier `appServer.command`, `url`, `authToken` o
encabezado personalizado sea válido.

**La detección de modelos es lenta:** reduzca
`plugins.entries.codex.config.discovery.timeoutMs` o deshabilite la detección.
Consulte la [referencia del arnés de Codex](/es/plugins/codex-harness-reference#model-discovery).

**El transporte WebSocket falla inmediatamente:** compruebe `appServer.url`,
`authToken`, los encabezados y que el servidor de aplicaciones remoto utilice la misma
versión del protocolo del servidor de aplicaciones de Codex.

**Las herramientas nativas de shell o de parches están bloqueadas con `Native hook relay
unavailable`:** el hilo de Codex sigue intentando usar un identificador
de retransmisión de hook nativo que OpenClaw ya no tiene registrado. Se trata de un problema
del transporte de hooks nativos de Codex, no de un fallo del backend ACP, del proveedor, de GitHub
ni de los comandos de shell. Inicie una sesión nueva en el chat afectado con `/new` o `/reset`
y vuelva a intentar un comando inofensivo. Si funciona una vez, pero la siguiente llamada a una
herramienta nativa vuelve a fallar, trate `/new` solo como una solución temporal: copie
el prompt en una sesión nueva después de reiniciar el servidor de aplicaciones de Codex o el
Gateway de OpenClaw para que se descarten los hilos antiguos y se vuelvan a crear los registros
de hooks nativos.

**Las llamadas a herramientas de Codex crean demasiados procesos de hooks de corta duración:** establezca
`plugins.entries.codex.config.appServer.loopDetectionPreToolUseRelay: false`
y reinicie el Gateway. Esto deshabilita únicamente el subproceso `PreToolUse` de Codex
utilizado para la detección de bucles de OpenClaw y su marcador de ausencia de políticas. Las retransmisiones
obligatorias de `before_tool_call` y de políticas de herramientas de confianza permanecen habilitadas.

**Un modelo que no es de Codex utiliza el arnés integrado:** es el comportamiento esperado, salvo que la política
de ejecución del proveedor o del modelo lo dirija a otro arnés. Las referencias simples de proveedores
que no sean de OpenAI permanecen en su ruta normal de proveedor en el modo `auto`.

**Computer Use está instalado, pero las herramientas no se ejecutan:** compruebe
`/codex computer-use status` desde una sesión nueva. Si una herramienta informa
`Native hook relay unavailable`, utilice el procedimiento anterior de recuperación de la retransmisión de hooks nativos.
Consulte [Computer Use de Codex](/es/plugins/codex-computer-use#troubleshooting).

## Contenido relacionado

- [Referencia del arnés de Codex](/es/plugins/codex-harness-reference)
- [Entorno de ejecución del arnés de Codex](/es/plugins/codex-harness-runtime)
- [Supervisión de Codex](/es/plugins/codex-supervision)
- [Plugins nativos de Codex](/es/plugins/codex-native-plugins)
- [Computer Use de Codex](/es/plugins/codex-computer-use)
- [Entornos de ejecución de agentes](/es/concepts/agent-runtimes)
- [Proveedores de modelos](/es/concepts/model-providers)
- [Proveedor de OpenAI](/es/providers/openai)
- [Ayuda de OpenAI Codex](https://help.openai.com/en/collections/14937394-codex)
- [Plugins de arnés para agentes](/es/plugins/sdk-agent-harness)
- [Hooks de plugins](/es/plugins/hooks)
- [Exportación de diagnósticos](/es/gateway/diagnostics)
- [Estado](/es/cli/status)
- [Pruebas](/es/help/testing-live#live-codex-app-server-harness-smoke)
