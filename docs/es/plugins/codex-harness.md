---
read_when:
    - Quieres usar el arnés oficial del servidor de aplicaciones de Codex
    - Necesitas ejemplos de configuración del arnés de Codex
    - Quieres que las implementaciones exclusivas de Codex fallen en lugar de recurrir a OpenClaw
summary: Ejecuta turnos del agente integrado de OpenClaw mediante el arnés oficial del servidor de aplicaciones de Codex
title: Entorno de Codex
x-i18n:
    generated_at: "2026-07-14T13:50:32Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: 3e18f58b3013523b38a6491f7e36e88b270c87102def1451d26c1bee33802f81
    source_path: plugins/codex-harness.md
    workflow: 16
---

El plugin oficial `codex` ejecuta de forma integrada los turnos del agente de OpenAI mediante el servidor de aplicaciones de Codex
en lugar del entorno integrado de OpenClaw. Codex gestiona la
sesión del agente de bajo nivel: reanudación nativa de hilos, continuación nativa de herramientas,
Compaction nativa y ejecución en el servidor de aplicaciones. OpenClaw sigue gestionando los canales de
chat, los archivos de sesión, la selección de modelos, las herramientas dinámicas de OpenClaw, las aprobaciones,
la entrega de contenido multimedia y la réplica visible de la transcripción.

Use referencias de modelos canónicas de OpenAI, como `openai/gpt-5.6-sol`. No configure
referencias heredadas de GPT de Codex; coloque el orden de autenticación del agente de OpenAI en `auth.order.openai`.
Los identificadores heredados de perfiles de autenticación de Codex y las entradas heredadas del orden de autenticación de Codex se
reparan mediante `openclaw doctor --fix`.

Cuando la política de tiempo de ejecución del proveedor/modelo no está configurada o es `auto`, el prefijo `openai/*` por sí solo
nunca selecciona este entorno. OpenAI puede seleccionar Codex implícitamente solo para una
ruta oficial HTTPS exacta de Platform Responses o ChatGPT Responses sin
ninguna anulación de solicitud definida. Consulte
[Tiempo de ejecución implícito del agente de OpenAI](/es/providers/openai#implicit-agent-runtime).
Si Codex controla la autenticación antes de que se determine el enrutamiento entre Platform y ChatGPT, OpenClaw
sigue exigiendo que cada ruta candidata declare compatibilidad con Codex. La
propiedad nativa de la autenticación por sí sola nunca omite esa comprobación de ruta.

Cuando no hay ningún entorno aislado de OpenClaw activo, OpenClaw inicia los hilos del servidor de aplicaciones de Codex
con el modo de código nativo de Codex habilitado (el modo exclusivamente de código permanece desactivado de forma predeterminada), por lo que
las capacidades nativas de espacio de trabajo y código siguen disponibles junto con las
herramientas dinámicas de OpenClaw, enrutadas mediante el puente `item/tool/call` del servidor de aplicaciones. Un
entorno aislado de OpenClaw activo o una política de herramientas restringida deshabilita por completo el modo de código nativo,
a menos que se habilite explícitamente la ruta experimental del servidor de ejecución del entorno aislado.

Con el valor predeterminado `tools.exec.host: "auto"` y sin ningún entorno aislado de OpenClaw activo,
Codex también recibe las herramientas `node_exec` y `node_process` para ejecutar comandos en Nodes
emparejados. El shell nativo permanece en el host y el espacio de trabajo del servidor de aplicaciones de Codex
(local al Gateway para la implementación stdio predeterminada); `node_exec` selecciona un Node por
nombre o identificador y mantiene vigente la política de aprobación de Nodes de OpenClaw.

Esta función nativa de Codex es independiente del
[modo de código de OpenClaw](/es/reference/code-mode), un tiempo de ejecución QuickJS-WASI de activación opcional
para ejecuciones genéricas de OpenClaw con una forma de entrada `exec` diferente. Para entender
la separación general entre modelo, proveedor y tiempo de ejecución, comience por
[Tiempos de ejecución de agentes](/es/concepts/agent-runtimes): `openai/gpt-5.6-sol` es la referencia del
modelo, `codex` es el tiempo de ejecución y Telegram, Discord, Slack u otro
canal es la superficie de comunicación.

## Requisitos

- El plugin oficial `@openclaw/codex` instalado. Incluya `codex` en
  `plugins.allow` si la configuración usa una lista de permitidos.
- El servidor de aplicaciones de Codex `0.143.0` o posterior. El plugin gestiona de forma predeterminada un
  binario compatible, por lo que un comando `codex` en `PATH` no afecta al inicio
  normal.
- Autenticación de Codex mediante `openclaw models auth login --provider openai`, una
  cuenta del servidor de aplicaciones ya presente en el directorio de inicio de Codex del agente o un
  perfil explícito de autenticación de Codex mediante clave de API.

Para obtener información sobre la precedencia de autenticación, el aislamiento del entorno, los comandos personalizados del servidor de aplicaciones,
la detección de modelos y la lista completa de campos de configuración, consulte
[Referencia del entorno de Codex](/es/plugins/codex-harness-reference).

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

Si la configuración usa `plugins.allow`, añada también `codex`:

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

El valor predeterminado `appServer.homeScope: "agent"` aísla cada agente de OpenClaw del
estado nativo de Codex del operador. Para permitir que un propietario inspeccione y gestione los
mismos hilos nativos que muestran Codex Desktop y la CLI de Codex, habilite explícitamente el
directorio de inicio de Codex del usuario:

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

El modo de directorio de inicio del usuario admite un proceso stdio local gestionado o el transporte
compartido mediante socket Unix. Usa `$CODEX_HOME` cuando está definido y `~/.codex` en caso contrario, incluidos
la autenticación nativa de Codex, la configuración, los plugins y el almacén de hilos de ese directorio. OpenClaw no
inyecta ningún perfil de autenticación de OpenClaw en este servidor de aplicaciones.

Los turnos del propietario obtienen la herramienta `codex_threads`: permite enumerar, buscar, leer, bifurcar, cambiar el nombre,
archivar y restaurar hilos nativos. Bifurque un hilo para continuarlo en
OpenClaw; la bifurcación se adjunta a la sesión actual de OpenClaw y permanece
visible para otros clientes nativos de Codex. El archivado requiere una
confirmación explícita de que el hilo está cerrado en otros lugares. Cuando la supervisión también está
habilitada, los campos de transcripción y las mutaciones requieren la activación opcional correspondiente de
`supervision.allowRawTranscripts` o `supervision.allowWriteControls`.

No reanude ni escriba simultáneamente en el mismo hilo mediante servidores de aplicaciones stdio
gestionados e independientes. Codex coordina los escritores activos dentro de un mismo servidor de aplicaciones, no
entre procesos distintos. La bifurcación es la forma segura de coexistencia para las sesiones stdio ordinarias
del directorio de inicio del usuario.

`appServer.homeScope: "user"` por sí solo no controla el catálogo de la flota. La
detección de sesiones nativas está habilitada mientras el plugin está activo; establezca
`sessionCatalog.enabled: false` para eliminarla de la barra lateral de OpenClaw sin
deshabilitar Codex. El catálogo usa una conexión de supervisión independiente; sin
una configuración de conexión `appServer` explícita, esa conexión usa de forma predeterminada un proceso stdio gestionado
en el directorio de inicio del usuario, mientras que el entorno ordinario permanece circunscrito al agente. Ambas rutas respetan la
configuración explícita de `appServer`. Establezca `homeScope: "user"`
explícitamente, como se muestra anteriormente, cuando el entorno ordinario también deba compartir el estado nativo.

## Supervisar sesiones de Codex

El mismo plugin `codex` puede enumerar las sesiones de Codex no archivadas del equipo del Gateway
y de los Nodes emparejados que lo hayan habilitado. Una sesión local al Gateway almacenada o inactiva puede
crear un chat bloqueado a un modelo que replique su historial persistente y acotado de mensajes del usuario y del asistente.
Su vinculación privada usa la conexión de supervisión para la instantánea
nativa, la rama canónica y los turnos posteriores, mientras que las sesiones ordinarias de Codex permanecen
circunscritas al agente. El primer inicio canónico usa exactamente el modelo y el proveedor que
Codex devuelve para la bifurcación de la instantánea. Las reanudaciones posteriores dejan la selección a la
configuración nativa de Codex; el modelo externo de OpenClaw y la cadena de reserva nunca
lo sustituyen. Las filas almacenadas e inactivas se pueden archivar después de confirmar explícitamente
que no hay ningún otro ejecutor. Las fuentes activas no pueden crear una rama ni archivarse; un chat
supervisado existente sí puede abrirse. Las sesiones de Nodes emparejados siguen siendo únicamente metadatos.

Consulte [Supervisar sesiones de Codex](/es/plugins/codex-supervision) para obtener información sobre la configuración, las reglas de bifurcación,
los límites de los Nodes emparejados, la exposición de metadatos y la solución de problemas.

## Configuración

| Necesidad                                           | Establecer                                                                                       | Dónde                              |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------ | ---------------------------------- |
| Habilitar el entorno                                | `plugins.entries.codex.enabled: true`                                                            | Configuración de OpenClaw          |
| Ocultar la detección de sesiones nativas de Codex   | `plugins.entries.codex.config.sessionCatalog.enabled: false`                                     | Configuración del plugin de Codex  |
| Conservar una instalación de plugin en la lista de permitidos | Incluya `codex` en `plugins.allow`                                                       | Configuración de OpenClaw          |
| Permitir que los turnos aptos de OpenAI usen Codex implícitamente | Ruta oficial HTTPS exacta de Responses/ChatGPT, sin anulación de solicitud definida, tiempo de ejecución sin configurar/`auto` | Configuración de proveedor/modelo de OpenAI |
| Iniciar sesión con OAuth de ChatGPT/Codex            | `openclaw models auth login --provider openai`                                                   | Perfil de autenticación de la CLI  |
| Añadir una clave de API de respaldo para las ejecuciones de Codex | Perfil de clave de API `openai:*` enumerado después de la autenticación de suscripción en `auth.order.openai` | Perfil de autenticación de la CLI + configuración de OpenClaw |
| Fallar de forma cerrada cuando Codex no esté disponible | `agentRuntime.id: "codex"` del proveedor o modelo                                               | Configuración de modelo/proveedor de OpenClaw |
| Usar tráfico directo de la API de OpenAI             | `agentRuntime.id: "openclaw"` del proveedor o modelo con autenticación normal de OpenAI                 | Configuración de modelo/proveedor de OpenClaw |
| Ajustar el comportamiento del servidor de aplicaciones | `plugins.entries.codex.config.appServer.*`                                                       | Configuración del plugin de Codex  |
| Habilitar aplicaciones de plugins nativos de Codex  | `plugins.entries.codex.config.codexPlugins.*`                                                    | Configuración del plugin de Codex  |
| Habilitar Codex Computer Use                         | `plugins.entries.codex.config.computerUse.*`                                                     | Configuración del plugin de Codex  |

Prefiera `auth.order.openai` para el orden de prioridad de suscripción y respaldo mediante clave de API.
Los identificadores existentes de perfiles de autenticación heredados de Codex y el orden de autenticación heredado de Codex son
estado heredado exclusivo de doctor; no escriba nuevas referencias heredadas de GPT de Codex.

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
para la misma ejecución de Codex. El orden de los perfiles elige las credenciales, no el tiempo de ejecución.
Cambiar el orden de autenticación no hace que una ruta personalizada, de Completions, HTTP o
con anulaciones de solicitud sea compatible con Codex.

### Compaction

No establezca `compaction.model` ni `compaction.provider` en agentes respaldados por
Codex. Codex realiza la Compaction mediante el estado nativo de sus hilos en el servidor de aplicaciones, por lo que
OpenClaw ignora esas anulaciones locales del resumidor durante la ejecución y
`openclaw doctor --fix` las elimina cuando el agente usa Codex.

Lossless sigue siendo compatible como motor de contexto para el ensamblaje, la ingesta y el
mantenimiento en torno a los turnos de Codex, configurado mediante
`plugins.slots.contextEngine: "lossless-claw"` y
`plugins.entries.lossless-claw.config.summaryModel`, no mediante
`agents.defaults.compaction.provider`. `openclaw doctor --fix` migra la
forma antigua `compaction.provider: "lossless-claw"` a la ranura del motor de contexto
Lossless cuando Codex es el tiempo de ejecución activo, pero Codex nativo sigue
gestionando la Compaction. El entorno nativo del servidor de aplicaciones admite motores de contexto
que necesitan ensamblaje previo al prompt; los backends genéricos de CLI, incluido `codex-cli`,
no proporcionan esa capacidad del host.

Para los agentes respaldados por Codex, `/compact` inicia la Compaction nativa del servidor de aplicaciones
de Codex en el hilo vinculado. OpenClaw no espera a que se complete,
impone un tiempo de espera de OpenClaw, reinicia el servidor de aplicaciones compartido ni recurre a un
motor de contexto o resumidor público de OpenAI. Si la vinculación del hilo nativo de Codex
no existe o está obsoleta, el comando falla de forma cerrada en lugar de cambiar
silenciosamente el backend de Compaction.

El resto de esta página trata sobre la forma de implementación, el enrutamiento con fallo cerrado, la política de aprobación
del guardián, los plugins nativos de Codex y Computer Use. Para consultar las listas completas de opciones,
los valores predeterminados, las enumeraciones, la detección, el aislamiento del entorno, los tiempos de espera y
los campos de transporte del servidor de aplicaciones, consulte
[Referencia del entorno de Codex](/es/plugins/codex-harness-reference).

## Verificar el tiempo de ejecución de Codex

Use `/status` en el chat donde espera usar Codex. Un turno de agente de OpenAI
respaldado por Codex muestra:

```text
Tiempo de ejecución: OpenAI Codex
```

A continuación, compruebe el estado del servidor de aplicaciones de Codex:

```text
/codex status
/codex models
```

`/codex status` informa sobre la conectividad del servidor de aplicaciones, la cuenta, los límites de tasa, los servidores MCP
y las Skills. `/codex models` enumera el catálogo activo del servidor de aplicaciones de Codex
para el arnés y la cuenta. Si `/status` resulta inesperado, consulte
[Solución de problemas](#troubleshooting).

## Enrutamiento y selección de modelos

Mantenga separadas las referencias de proveedores y la política del entorno de ejecución:

- Use `openai/gpt-*` para la selección canónica de modelos de OpenAI. El prefijo por sí solo
  nunca selecciona Codex.
- Cuando el entorno de ejecución no está definido o es `auto`, solo una ruta oficial HTTPS exacta de Platform Responses
  o ChatGPT Responses sin una sobrescritura de solicitud especificada puede seleccionar Codex
  implícitamente.
- No use referencias heredadas de Codex GPT en la configuración; ejecute `openclaw doctor --fix` para
  reparar las referencias heredadas y las fijaciones obsoletas de rutas de sesión.
- `agentRuntime.id: "codex"` convierte Codex en un requisito de cierre seguro para una
  ruta compatible. No convierte en compatible una ruta efectiva incompatible.
- `agentRuntime.id: "openclaw"` habilita un proveedor o modelo para usar el entorno de ejecución integrado
  de OpenClaw cuando esto es intencional.
- `/codex ...` controla las conversaciones nativas del servidor de aplicaciones de Codex desde el chat.
- ACP/acpx es una ruta de arnés externo independiente. Úsela solo cuando el usuario
  solicite ACP/acpx o un adaptador de arnés externo.

| Intención del usuario                                      | Uso                                                                                                   |
| ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Vincular el chat actual                                    | `/codex bind [thread-id] [--cwd <path>] [--model <model>] [--provider <provider>]`                    |
| Reanudar un hilo de Codex existente                        | `/codex resume <thread-id>`                                                                           |
| Enumerar o filtrar hilos de Codex                          | `/codex threads [filter]`                                                                             |
| Enumerar Plugins nativos de Codex                          | `/codex plugins list`                                                                                 |
| Habilitar o deshabilitar un Plugin nativo de Codex configurado | `/codex plugins enable <name>`, `/codex plugins disable <name>`                                       |
| Reanudar una sesión almacenada de la CLI de Codex como un turno de nodo emparejado | `/codex sessions --host <node> [filter]`, después `/codex resume <session-id> --host <node> --bind here` |
| Ver sesiones de Codex no archivadas entre equipos          | Habilite la supervisión de Codex y abra **Codex Sessions**                                             |
| Cambiar el modelo, el modo rápido o los permisos del hilo vinculado | `/codex model <model>`, `/codex fast [on\|off\|status]`, `/codex permissions [default\|yolo\|status]` |
| Detener o dirigir el turno activo                          | `/codex stop`, `/codex steer <text>`                                                                  |
| Desvincular la vinculación actual                          | `/codex detach` (alias `/codex unbind`)                                                               |
| Enviar únicamente comentarios sobre Codex                  | `/codex diagnostics [note]`                                                                           |
| Iniciar una tarea de ACP/acpx                              | Comandos de sesión de ACP/acpx, no `/codex`                                                               |

| Caso de uso                                      | Configuración                                                                                               | Verificación                            | Notas                                      |
| ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | --------------------------------------- | ------------------------------------------ |
| Ruta de OpenAI apta con entorno de ejecución nativo de Codex | Ruta oficial HTTPS exacta de Responses/ChatGPT sin una sobrescritura de solicitud especificada, más el Plugin `codex` habilitado | `/status` muestra `Runtime: OpenAI Codex` | Ruta implícita cuando el entorno de ejecución no está definido/es `auto` |
| Cierre seguro si Codex no está disponible       | `agentRuntime.id: "codex"` del proveedor o modelo                                                                | El turno falla en lugar de recurrir al entorno integrado | Úselo para implementaciones exclusivas de Codex |
| Tráfico directo con clave de API de OpenAI mediante OpenClaw | `agentRuntime.id: "openclaw"` del proveedor o modelo y autenticación normal de OpenAI                                      | `/status` muestra el entorno de ejecución de OpenClaw        | Úselo solo cuando OpenClaw sea intencional |
| Configuración heredada                          | referencias heredadas de Codex GPT                                                                          | `openclaw doctor --fix` la reescribe     | No escriba configuraciones nuevas de esta manera |
| Adaptador de Codex para ACP/acpx                | `sessions_spawn({ runtime: "acp" })` de ACP                                                                    | Estado de tarea/sesión de ACP           | Independiente del arnés nativo de Codex    |

`agents.defaults.imageModel` sigue la misma división por prefijo. Use `openai/gpt-*`
para la ruta normal de OpenAI y `codex/gpt-*` solo cuando la comprensión de imágenes
deba ejecutarse mediante un turno acotado del servidor de aplicaciones de Codex. Doctor reescribe las referencias heredadas
de Codex GPT como `openai/gpt-*`.

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

El agente `main` usa su ruta normal de proveedor. El agente `codex` usa el servidor
de aplicaciones de Codex cuando su ruta efectiva de OpenAI sigue siendo compatible; añada
`agentRuntime.id: "codex"` explícito con alcance de modelo cuando deba ser un requisito
de cierre seguro.

### Implementación de Codex con cierre seguro

Una ruta oficial HTTPS exacta y apta de OpenAI puede resolverse mediante Codex cuando el
Plugin incluido está disponible. Añada una política explícita de entorno de ejecución para establecer una regla
de cierre seguro:

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

Cuando se fuerza Codex, OpenClaw falla anticipadamente si la ruta efectiva no está declarada
como compatible con Codex, el Plugin está deshabilitado, el servidor de aplicaciones es demasiado antiguo o el
servidor de aplicaciones no puede iniciarse.

## Política del servidor de aplicaciones

De manera predeterminada, el Plugin inicia localmente el binario administrado de Codex de OpenClaw con
transporte stdio. Defina `appServer.command` solo para ejecutar intencionalmente un
ejecutable diferente. Use el transporte WebSocket solo cuando ya se esté ejecutando un servidor de aplicaciones
en otra ubicación:

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

Las sesiones locales del servidor de aplicaciones mediante stdio adoptan de forma predeterminada la postura del operador local
de confianza: `approvalPolicy: "never"`, `approvalsReviewer: "user"` y
`sandbox: "danger-full-access"`. Si los requisitos locales de Codex no permiten esa
postura YOLO implícita, OpenClaw selecciona en su lugar permisos de Guardian
permitidos. Cuando hay un entorno aislado de OpenClaw activo para la sesión, OpenClaw
deshabilita durante ese turno el modo de código nativo de Codex, los servidores MCP del usuario y la ejecución
de Plugins respaldados por aplicaciones, en lugar de depender del entorno aislado de Codex en el host.
El acceso al shell se realiza mediante herramientas dinámicas respaldadas por el entorno aislado de OpenClaw,
como `sandbox_exec` y `sandbox_process`, cuando están disponibles las herramientas normales
de ejecución/procesos.

Use el modo de ejecución normalizado de OpenClaw para la revisión automática nativa de Codex antes de
escapar del entorno aislado o conceder permisos adicionales:

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

Para las sesiones del servidor de aplicaciones de Codex, `tools.exec.mode: "auto"` se asigna a aprobaciones
revisadas por Codex Guardian: normalmente `approvalPolicy: "on-request"`,
`approvalsReviewer: "auto_review"` y `sandbox: "workspace-write"` cuando
los requisitos locales permiten esos valores. En `tools.exec.mode: "auto"`,
OpenClaw no conserva las sobrescrituras heredadas e inseguras de Codex `approvalPolicy: "never"` o
`sandbox: "danger-full-access"`; use `tools.exec.mode: "full"` para
establecer intencionalmente una postura de Codex sin aprobaciones. El ajuste predefinido heredado
`plugins.entries.codex.config.appServer.mode: "guardian"` aún
funciona, pero `tools.exec.mode: "auto"` es la superficie normalizada de OpenClaw.

Para consultar la comparación de los modos con las aprobaciones de ejecución del host y los
permisos de ACPX, consulte [Modos de permisos](/es/tools/permission-modes). Para conocer todos los
campos del servidor de aplicaciones, el orden de autenticación, el aislamiento del entorno y el comportamiento de los tiempos de espera,
consulte la [Referencia del arnés de Codex](/es/plugins/codex-harness-reference).

## Comandos y diagnósticos

El Plugin `codex` registra `/codex` como comando con barra diagonal en cualquier canal que
admita comandos de texto de OpenClaw.

La ejecución y el control nativos requieren un propietario o un cliente de Gateway `operator.admin`:
vincular o reanudar hilos, enviar o detener turnos, cambiar el modelo, el modo rápido
o el estado de los permisos, realizar Compaction o revisiones y desvincular una vinculación.
Los demás remitentes autorizados conservan comandos de solo lectura para consultar el estado, la ayuda,
la cuenta, el modelo, los hilos, los servidores MCP, las Skills y las vinculaciones.

Formas comunes:

- `/codex status` comprueba la conectividad del servidor de aplicaciones, los modelos, la cuenta, los límites
  de tasa, los servidores MCP y las Skills.
- `/codex models` enumera los modelos activos del servidor de aplicaciones de Codex.
- `/codex threads [filter]` enumera los hilos recientes del servidor de aplicaciones de Codex.
- `/codex resume <thread-id>` vincula la sesión actual de OpenClaw con un
  hilo de Codex existente.
- `/codex bind [thread-id] [--cwd <path>] [--model <model>] [--provider <provider>]`
  vincula el chat actual.
- `/codex detach` (o `/codex unbind`) desvincula la vinculación actual.
- `/codex binding` describe la vinculación actual.
- `/codex stop` detiene el turno activo; `/codex steer <text>` lo dirige.
- `/codex model <model>`, `/codex fast [on|off|status]` y
  `/codex permissions [default|yolo|status]` cambian el estado de cada conversación.
- `/codex compact` solicita al servidor de aplicaciones de Codex que realice Compaction en el hilo vinculado.
- `/codex review` inicia la revisión nativa de Codex para el hilo vinculado.
- `/codex diagnostics [note]` solicita confirmación antes de enviar comentarios sobre Codex para el
  hilo vinculado.
- `/codex account` muestra el estado de la cuenta y de los límites de tasa.
- `/codex mcp` enumera el estado de los servidores MCP del servidor de aplicaciones de Codex.
- `/codex skills` enumera las Skills del servidor de aplicaciones de Codex.
- `/codex plugins list`, `/codex plugins enable <name>` y
  `/codex plugins disable <name>` administran los Plugins nativos configurados de Codex.
- `/codex computer-use [status|install]` administra Codex Computer Use.
- `/codex help` enumera el árbol completo de comandos.

Para la mayoría de los informes de soporte, comienza con `/diagnostics [note]` en la
conversación donde ocurrió el error. Esto crea un informe de diagnóstico del
Gateway y, para las sesiones del entorno de Codex, solicita aprobación para enviar el
paquete pertinente de comentarios de Codex. Consulta
[Exportación de diagnósticos](/es/gateway/diagnostics) para conocer el modelo de privacidad y el
comportamiento de los chats grupales. Usa `/codex diagnostics [note]` solo cuando quieras
específicamente cargar los comentarios de Codex del hilo adjunto actualmente sin
el paquete completo de diagnósticos del Gateway.

### Inspeccionar localmente los hilos de Codex

La forma más rápida de inspeccionar una ejecución defectuosa de Codex suele ser abrir directamente el hilo
nativo de Codex:

```bash
codex resume <thread-id>
```

Obtén el id. del hilo de la respuesta completada de `/diagnostics`, `/codex binding`
o `/codex threads [filter]`.

Para obtener información sobre el mecanismo de carga y los límites de diagnóstico a nivel de runtime, consulta
[Runtime del entorno de Codex](/es/plugins/codex-harness-runtime#codex-feedback-upload).

### Orden de autenticación

En el directorio de inicio predeterminado por agente, la autenticación se selecciona en este orden:

1. Perfiles de autenticación de OpenAI ordenados para el agente, preferiblemente en
   `auth.order.openai`. Ejecuta `openclaw doctor --fix` para migrar los antiguos
   ids. heredados de perfiles de autenticación de Codex y el orden de autenticación heredado de Codex.
2. La cuenta existente del servidor de aplicaciones en el directorio de inicio de Codex de ese agente.
3. Solo para inicios locales del servidor de aplicaciones mediante stdio, `CODEX_API_KEY` y después
   `OPENAI_API_KEY`, cuando no hay ninguna cuenta del servidor de aplicaciones y aún se requiere
   la autenticación de OpenAI.

Cuando OpenClaw detecta un perfil de autenticación de Codex del tipo suscripción de ChatGPT,
elimina `CODEX_API_KEY` y `OPENAI_API_KEY` del proceso secundario de Codex
iniciado. Esto mantiene disponibles las claves de API del Gateway para las incrustaciones o
los modelos directos de OpenAI sin provocar accidentalmente que los turnos nativos del servidor de
aplicaciones de Codex se facturen mediante la API. Los perfiles explícitos de clave de API de Codex y el
uso alternativo local de claves de entorno mediante stdio utilizan el inicio de sesión del servidor de aplicaciones en lugar del entorno
heredado del proceso secundario. Las conexiones WebSocket del servidor de aplicaciones no reciben el uso alternativo
de claves de API del entorno del Gateway; utiliza un perfil de autenticación explícito o la propia
cuenta del servidor de aplicaciones remoto.

Si un perfil de suscripción alcanza un límite de uso de Codex, OpenClaw registra la
hora de restablecimiento cuando Codex la comunica e intenta usar el siguiente perfil de autenticación ordenado
para la misma ejecución de Codex. Cuando pasa la hora de restablecimiento, el perfil de
suscripción vuelve a ser apto sin cambiar el modelo `openai/gpt-*`
seleccionado ni el runtime de Codex.

Cuando se configuran plugins nativos de Codex, OpenClaw instala o actualiza
esos plugins mediante el servidor de aplicaciones conectado antes de exponer al hilo de Codex
las aplicaciones pertenecientes a los plugins. `app/list` sigue siendo la fuente oficial de los ids.
de las aplicaciones, su accesibilidad y sus metadatos, pero OpenClaw controla la decisión de
habilitación por hilo: si la política permite una aplicación accesible de la lista, OpenClaw
envía `thread/start.config.apps[appId].enabled = true` incluso cuando `app/list`
indica actualmente que esa aplicación está deshabilitada. Esta ruta no inventa la
instalación de aplicaciones para ids. desconocidos; OpenClaw solo activa plugins del mercado
con `plugin/install` y después actualiza el inventario.

### Aislamiento del entorno

Para los inicios locales del servidor de aplicaciones mediante stdio, OpenClaw establece `CODEX_HOME` en un
directorio por agente para que la configuración de Codex, los archivos de autenticación y de cuenta, la caché y los datos
de los plugins, y el estado nativo de los hilos no lean ni escriban de forma predeterminada en el
`~/.codex` personal del operador. OpenClaw conserva el `HOME` normal del proceso;
los subprocesos de las ejecuciones de Codex aún pueden encontrar la configuración y los tokens del directorio de inicio del usuario,
y Codex puede detectar entradas compartidas de `$HOME/.agents/skills` y
`$HOME/.agents/plugins/marketplace.json`. Con
`appServer.homeScope: "user"`, OpenClaw utiliza en su lugar el directorio de inicio nativo de Codex del usuario
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
la normalización del inicio local: `CODEX_HOME` sigue apuntando al ámbito del agente
o del usuario seleccionado, y `HOME` continúa heredándose para que los subprocesos puedan usar
el estado normal del directorio de inicio del usuario.

### Herramientas dinámicas y búsqueda web

Las herramientas dinámicas de Codex utilizan de forma predeterminada la carga de `searchable`. OpenClaw no
expone herramientas dinámicas que dupliquen las operaciones nativas de Codex en el espacio de trabajo:
`read`, `write`, `edit`, `apply_patch`, `exec`, `process`, `update_plan`,
`tool_call`, `tool_describe`, `tool_search` y `tool_search_code`. La mayoría de
las demás herramientas de integración de OpenClaw, como las de mensajería, contenido multimedia, cron,
navegador, nodos, Gateway y `heartbeat_respond`, están disponibles mediante
la búsqueda de herramientas de Codex en el espacio de nombres `openclaw`, lo que reduce el contexto
inicial del modelo.

Las herramientas marcadas como `catalogMode: "direct-only"`, incluida la herramienta `computer`
de OpenClaw, utilizan en su lugar el espacio de nombres `openclaw_direct`. Codex trata ese espacio de nombres
como `DirectModelOnly`, por lo que esas herramientas permanecen visibles directamente para el modelo en los hilos
normales y exclusivos del modo de código, en lugar de atravesar llamadas anidadas de `tools.*` del modo de código.

La búsqueda web utiliza de forma predeterminada la herramienta alojada `web_search` de Codex cuando la búsqueda está
habilitada y no se ha seleccionado ningún proveedor administrado. La búsqueda alojada nativa y
la herramienta dinámica administrada `web_search` de OpenClaw se excluyen mutuamente para que
la búsqueda administrada no pueda eludir las restricciones nativas de dominios. OpenClaw utiliza la
herramienta administrada cuando la búsqueda alojada no está disponible, se deshabilita explícitamente o
se sustituye por un proveedor administrado seleccionado. OpenClaw mantiene deshabilitada la extensión
independiente `web.run` de Codex porque el tráfico de producción del servidor de aplicaciones rechaza
su espacio de nombres `web` definido por el usuario. `tools.web.search.enabled: false`
deshabilita ambas rutas, al igual que las ejecuciones solo con LLM que tienen las herramientas deshabilitadas. Codex trata
`"cached"` como una preferencia y la resuelve como acceso externo en vivo para
los turnos sin restricciones del servidor de aplicaciones. El uso alternativo administrado automático se cierra ante errores cuando
se establecen `allowedDomains` nativas, de modo que no pueda eludirse la lista de permitidos.
Los cambios persistentes en la política de búsqueda efectiva rotan el hilo de Codex vinculado
antes del turno siguiente; las restricciones transitorias por turno utilizan un hilo
restringido temporal y conservan la vinculación existente para reanudarla posteriormente.

`sessions_yield` y las respuestas de origen exclusivas de la herramienta de mensajes permanecen directas porque
son contratos de control de turnos. `sessions_spawn` sigue siendo localizable para que
el `spawn_agent` nativo de Codex siga siendo la superficie principal de subagentes de Codex,
mientras que la delegación explícita de OpenClaw o ACP continúa disponible mediante el
espacio de nombres de herramientas dinámicas `openclaw`. Las instrucciones de colaboración de Heartbeat
indican a Codex que busque `heartbeat_respond` antes de finalizar un turno
de Heartbeat cuando la herramienta aún no esté cargada.

Establece `codexDynamicToolsLoading: "direct"` solo al conectarte a un servidor de aplicaciones de
Codex personalizado que no pueda buscar herramientas dinámicas diferidas o al
depurar la carga completa de herramientas.

### Campos de configuración

Campos de nivel superior compatibles del plugin de Codex:

| Campo                      | Valor predeterminado        | Significado                                                                                  |
| -------------------------- | -------------- | ---------------------------------------------------------------------------------------- |
| `codexDynamicToolsLoading` | `"searchable"` | Usa `"direct"` para colocar las herramientas dinámicas de OpenClaw directamente en el contexto inicial de herramientas de Codex. |
| `codexDynamicToolsExclude` | `[]`           | Nombres adicionales de herramientas dinámicas de OpenClaw que deben omitirse en los turnos del servidor de aplicaciones de Codex.              |
| `codexPlugins`             | deshabilitado       | Compatibilidad nativa de plugins y aplicaciones de Codex para plugins seleccionados migrados e instalados desde el código fuente.           |
| `sessionCatalog`           | habilitado        | Detección en la barra lateral de sesiones nativas de Codex en este Gateway y en los nodos emparejados aptos.   |
| `supervision`              | deshabilitado       | Política de transcripción y control de escritura de sesiones nativas orientada al agente.                         |

Campos compatibles de `appServer`:

| Campo                                         | Valor predeterminado                                                | Significado                                                                                                                                                                                                                                                                                                                                                                                         |
| --------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                                   | `"stdio"`                                              | `"stdio"` inicia Codex; `"unix"` explícito se conecta al socket de control local; `"websocket"` se conecta a `url`.                                                                                                                                                                                                                                                                                |
| `homeScope`                                   | `"agent"`                                              | `"agent"` aísla el estado ordinario del arnés por agente de OpenClaw. `"user"` es una habilitación explícita que comparte el `$CODEX_HOME` o `~/.codex` nativo, usa la autenticación nativa y habilita la gestión de hilos solo para el propietario. El ámbito de usuario admite stdio local o transporte Unix. Para la conexión de supervisión independiente, un valor no establecido se resuelve como `"user"` para stdio o Unix y `"agent"` para WebSocket.     |
| `command`                                     | binario administrado de Codex                                   | Ejecutable para el transporte stdio. Déjelo sin establecer para usar el binario administrado; establézcalo solo para una anulación explícita.                                                                                                                                                                                                                                                                                    |
| `args`                                        | `["app-server", "--listen", "stdio://"]`               | Argumentos para el transporte stdio.                                                                                                                                                                                                                                                                                                                                                                  |
| `url`                                         | sin establecer                                                  | URL del servidor de aplicaciones WebSocket o URL `unix://`. Una ruta Unix explícita vacía selecciona el socket de control canónico del directorio personal del usuario.                                                                                                                                                                                                                                                                          |
| `authToken`                                   | sin establecer                                                  | Token Bearer para el transporte WebSocket. Acepta una cadena literal o SecretInput, como `${CODEX_APP_SERVER_TOKEN}`.                                                                                                                                                                                                                                                                              |
| `headers`                                     | `{}`                                                   | Encabezados WebSocket adicionales. Los valores de los encabezados aceptan cadenas literales o valores SecretInput, por ejemplo, `x-codex-client-session-token: "${CODEX_CLIENT_SESSION_TOKEN}"`.                                                                                                                                                                                                                               |
| `clearEnv`                                    | `[]`                                                   | Nombres de variables de entorno adicionales que se eliminan del proceso app-server stdio iniciado después de que OpenClaw construya su entorno heredado. OpenClaw conserva el `CODEX_HOME` seleccionado y el `HOME` heredado para los inicios locales.                                                                                                                                                                           |
| `codeModeOnly`                                | `false`                                                | Habilita la superficie de herramientas de Codex exclusiva del modo de código. Las herramientas dinámicas ordinarias de OpenClaw siguen disponibles mediante llamadas `tools.*` anidadas; las herramientas `openclaw_direct` permanecen visibles directamente para el modelo.                                                                                                                                                                                                             |
| `remoteWorkspaceRoot`                         | sin establecer                                                  | Raíz remota del espacio de trabajo del app-server de Codex. Cuando se establece, OpenClaw infiere la raíz del espacio de trabajo local a partir del espacio de trabajo resuelto de OpenClaw, conserva el sufijo del cwd actual bajo esta raíz remota y envía a Codex únicamente el cwd final del app-server. Si el cwd está fuera de la raíz resuelta del espacio de trabajo de OpenClaw, OpenClaw aplica un cierre seguro en lugar de enviar una ruta local del Gateway al app-server remoto. |
| `requestTimeoutMs`                            | `60000`                                                | Tiempo de espera para las llamadas del plano de control del app-server.                                                                                                                                                                                                                                                                                                                                                     |
| `turnCompletionIdleTimeoutMs`                 | `60000`                                                | Intervalo de inactividad después de que Codex acepta un turno o después de una solicitud del app-server limitada al turno, mientras OpenClaw espera `turn/completed`.                                                                                                                                                                                                                                                                    |
| `postToolRawAssistantCompletionIdleTimeoutMs` | `300000`                                               | Protección de inactividad tras la finalización y del progreso que se usa después de transferir el control a una herramienta, completar una herramienta nativa, registrar progreso sin procesar del asistente después de una herramienta, completar el razonamiento sin procesar o registrar progreso del razonamiento mientras OpenClaw espera `turn/completed`. Úsela para cargas de trabajo de confianza o pesadas en las que la síntesis posterior a la herramienta pueda permanecer legítimamente inactiva durante más tiempo que el presupuesto final de publicación del asistente.                                |
| `mode`                                        | `"yolo"` salvo que los requisitos locales de Codex no permitan YOLO | Preajuste para la ejecución YOLO o revisada por guardian. Los requisitos de stdio local que omiten `danger-full-access`, la aprobación `never` o el revisor `user` hacen que el valor predeterminado implícito sea guardian.                                                                                                                                                                                                           |
| `approvalPolicy`                              | `"never"` o una política de aprobación de guardian permitida       | Política de aprobación nativa de Codex que se envía al iniciar o reanudar el hilo o al iniciar el turno. Los valores predeterminados de guardian prefieren `"on-request"` cuando está permitido.                                                                                                                                                                                                                                                                            |
| `sandbox`                                     | `"danger-full-access"` o un entorno aislado de guardian permitido  | Modo de entorno aislado nativo de Codex que se envía al iniciar o reanudar el hilo. Los valores predeterminados de guardian prefieren `"workspace-write"` cuando está permitido; de lo contrario, `"read-only"`. Cuando hay un entorno aislado de OpenClaw activo, los turnos `danger-full-access` usan `workspace-write` de Codex con acceso a la red derivado de la configuración de salida del entorno aislado de OpenClaw.                                                                                     |
| `approvalsReviewer`                           | `"user"` o un revisor de guardian permitido               | Use `"auto_review"` para permitir que Codex revise las solicitudes de aprobación nativas cuando esté permitido; de lo contrario, `guardian_subagent` o `user`. `guardian_subagent` sigue siendo un alias heredado.                                                                                                                                                                                                                              |
| `serviceTier`                                 | sin establecer                                                  | Nivel de servicio opcional del app-server de Codex. `"priority"` habilita el enrutamiento en modo rápido, `"flex"` solicita procesamiento flexible, `null` elimina la anulación y el valor heredado `"fast"` se acepta como `"priority"`.                                                                                                                                                                                                 |
| `networkProxy`                                | deshabilitado                                               | Habilita las funciones de red del perfil de permisos de Codex para los comandos del app-server. OpenClaw define la configuración `permissions.<profile>.network` seleccionada y la selecciona con `default_permissions` en lugar de enviar `sandbox`.                                                                                                                                                                             |
| `experimental.sandboxExecServer`              | `false`                                                | Habilitación preliminar que registra un entorno de Codex respaldado por el entorno aislado de OpenClaw en el app-server de Codex compatible, para que la ejecución nativa de Codex pueda realizarse dentro del entorno aislado activo de OpenClaw.                                                                                                                                                                                                            |

`appServer.networkProxy` es explícito porque cambia el contrato del entorno aislado
de Codex. Cuando está habilitado, OpenClaw también establece `features.network_proxy.enabled`
y `default_permissions` en la configuración del hilo de Codex para que el perfil
de permisos generado pueda iniciar las funciones de red administradas por Codex. De forma predeterminada, OpenClaw
genera un nombre de perfil `openclaw-network-<fingerprint>` resistente a colisiones
a partir del cuerpo del perfil; use `profileName` solo cuando se requiera
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
`networkProxy` se usa un acceso al sistema de archivos de estilo espacio de trabajo para el perfil de
permisos generado: la aplicación de red administrada por Codex utiliza una red
aislada, por lo que un perfil de acceso completo no protegería el tráfico saliente.
Las entradas de dominio usan `allow` o `deny`; las entradas de sockets Unix usan los valores
`allow` o `none` de Codex.

### Tiempos de espera de llamadas dinámicas a herramientas

Las llamadas dinámicas a herramientas propiedad de OpenClaw tienen límites independientes de
`appServer.requestTimeoutMs`: las solicitudes `item/tool/call` de Codex usan de forma predeterminada un mecanismo de vigilancia
de OpenClaw de 90 segundos. Un argumento `timeoutMs` positivo por llamada
amplía o reduce el límite de esa herramienta específica, con un máximo de 600000 ms.
La herramienta `image_generate` usa `agents.defaults.imageGenerationModel.timeoutMs`
cuando la llamada a la herramienta no proporciona su propio tiempo de espera, o un valor predeterminado de
120 segundos para la generación de imágenes en caso contrario. La herramienta `image` de comprensión multimedia
usa `tools.media.image.timeoutSeconds` o su valor predeterminado de 60 segundos para contenido multimedia; para
la comprensión de imágenes, ese tiempo de espera se aplica a la propia solicitud y no se
reduce por el trabajo de preparación previo. Cuando se agota el tiempo, OpenClaw cancela la señal
de la herramienta cuando se admite y devuelve a Codex una respuesta fallida de herramienta dinámica
para que el turno pueda continuar en lugar de dejar la sesión en `processing`.
Este mecanismo de vigilancia es el límite dinámico externo de `item/tool/call`; los tiempos de espera
de solicitud específicos del proveedor se ejecutan dentro de esa llamada y conservan su propia semántica.

Después de que Codex acepta un turno, y después de que OpenClaw responde a una solicitud
de app-server limitada al turno, el entorno espera que Codex avance en el turno actual
y finalmente complete el turno nativo con `turn/completed`. Si el
app-server permanece inactivo durante `appServer.turnCompletionIdleTimeoutMs`, OpenClaw
intenta interrumpir el turno de Codex, registra un tiempo de espera de diagnóstico y
libera el carril de sesión de OpenClaw para que los mensajes de chat posteriores no queden
en cola detrás de un turno nativo obsoleto. La mayoría de las notificaciones no terminales del
mismo turno desactivan ese breve mecanismo de vigilancia porque Codex ha demostrado que el turno
sigue activo.

Las transferencias de herramientas usan un límite de inactividad posterior a la herramienta más largo: después de que OpenClaw devuelve una
respuesta `item/tool/call`, después de que se completan elementos de herramientas nativas como
`commandExecution`, después de las finalizaciones `custom_tool_call_output`
sin procesar y después del progreso sin procesar del asistente posterior a la herramienta, las finalizaciones de razonamiento
sin procesar o el progreso de razonamiento. La protección usa
`appServer.postToolRawAssistantCompletionIdleTimeoutMs` cuando está configurado y
usa cinco minutos de forma predeterminada en caso contrario; ese mismo límite también amplía el
mecanismo de vigilancia de progreso durante el intervalo silencioso de síntesis antes de que Codex emita el
siguiente evento del turno actual. Las notificaciones globales de app-server, como las
actualizaciones de límites de frecuencia, no reinician el progreso de inactividad del turno. Las finalizaciones de razonamiento,
las finalizaciones `agentMessage` de comentarios y el progreso de razonamiento o
del asistente sin procesar previo a la herramienta pueden ir seguidos de una respuesta final automática, por lo que usan
la protección de respuesta posterior al progreso en lugar de liberar inmediatamente el carril de sesión.

Solo los elementos `agentMessage` finales/sin comentarios completados y las finalizaciones
sin procesar del asistente previas a la herramienta activan la liberación por salida del asistente: si Codex permanece
inactivo sin `turn/completed`, OpenClaw intenta interrumpir el turno nativo
y libera el carril de sesión. Si otra vigilancia del turno gana esa carrera de liberación,
OpenClaw aún acepta el elemento final completado del asistente cuando ya no queda
ninguna solicitud nativa, elemento ni finalización de herramienta dinámica activa y la
liberación por salida del asistente aún pertenece al último elemento completado, sin
ninguna finalización de elemento posterior. Esto puede conservar la respuesta final después
del trabajo completado de herramientas sin reproducir el turno. Los deltas parciales del asistente,
las respuestas anteriores obsoletas y las finalizaciones posteriores vacías no cumplen los requisitos.

Los fallos de app-server mediante stdio que permiten una reproducción segura, incluidos los tiempos de espera
de finalización del turno sin pruebas de asistente, herramienta, elemento activo ni efectos secundarios,
se reintentan una vez en un nuevo intento de app-server. Los tiempos de espera no seguros siguen retirando el
cliente de app-server bloqueado y liberan el carril de sesión de OpenClaw; también
eliminan la vinculación obsoleta del hilo nativo en lugar de reproducirse
automáticamente. Los tiempos de espera de vigilancia de finalización muestran texto específico de Codex:
los casos que permiten una reproducción segura indican que la respuesta puede estar incompleta, mientras que los casos no seguros
indican al usuario que verifique el estado actual antes de volver a intentarlo. Los diagnósticos públicos de tiempo de espera
incluyen campos estructurales como el último método de notificación de app-server,
el id/tipo/rol del elemento de respuesta sin procesar del asistente, los recuentos de
solicitudes/elementos activos y el estado de vigilancia activado; cuando la última notificación es un
elemento de respuesta sin procesar del asistente, también incluyen una vista previa limitada del texto del asistente.
No incluyen el contenido sin procesar del prompt ni de la herramienta.

### Sustituciones de variables de entorno para pruebas locales

- `OPENCLAW_CODEX_APP_SERVER_BIN` omite el binario administrado cuando
  `appServer.command` no está definido.
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` se eliminó. Use
`plugins.entries.codex.config.appServer.mode: "guardian"` en su lugar, o
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` para pruebas locales puntuales. Se
prefiere la configuración para despliegues reproducibles porque mantiene el comportamiento del plugin
en el mismo archivo revisado que el resto de la configuración del entorno de Codex.

## Plugins nativos de Codex

La compatibilidad con plugins nativos de Codex usa las propias capacidades de aplicaciones y plugins
de app-server de Codex en el mismo hilo de Codex que el turno del entorno de OpenClaw. OpenClaw
no convierte los plugins de Codex en herramientas dinámicas sintéticas `codex_plugin_*` de OpenClaw.

`codexPlugins` solo afecta a las sesiones que seleccionan el entorno nativo de Codex.
No afecta a las ejecuciones del entorno integrado, las ejecuciones normales del proveedor OpenAI, las vinculaciones de
conversaciones ACP ni otros entornos.

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
de Codex o reemplaza una vinculación obsoleta del hilo de Codex; no se vuelve a calcular en
cada turno. Después de cambiar `codexPlugins`, use `/new`, `/reset` o reinicie
el gateway para que las futuras sesiones del entorno de Codex comiencen con el conjunto de aplicaciones
actualizado.

Para conocer los requisitos de migración, el inventario de aplicaciones, la política de acciones destructivas,
las solicitudes de información y los diagnósticos de plugins nativos, consulte
[Plugins nativos de Codex](/es/plugins/codex-native-plugins).

El acceso a aplicaciones y plugins del lado de OpenAI está controlado por la cuenta de Codex
con sesión iniciada y, para los espacios de trabajo Business y Enterprise/Edu, por los controles
de aplicaciones del espacio de trabajo. Consulte
[Uso de Codex con su plan de ChatGPT](https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan)
para obtener una descripción general de OpenAI sobre los controles de cuenta y espacio de trabajo.

## Uso del ordenador

El uso del ordenador tiene su propia guía de configuración:
[Uso del ordenador con Codex](/es/plugins/codex-computer-use).

Versión breve: OpenClaw no incorpora la aplicación de control del escritorio ni ejecuta
por sí mismo acciones de escritorio. Prepara app-server de Codex, verifica que el
servidor MCP `computer-use` esté disponible y, a continuación, permite que Codex gestione las llamadas
nativas a herramientas MCP durante los turnos en modo Codex.

## Límites del entorno de ejecución

El entorno de Codex solo cambia el ejecutor de agente integrado de bajo nivel.

- Se admiten las herramientas dinámicas de OpenClaw. Codex solicita a OpenClaw que ejecute
  esas herramientas, por lo que OpenClaw permanece en la ruta de ejecución.
- El shell, los parches, MCP y las herramientas de aplicaciones nativas de Codex son propiedad de Codex.
  OpenClaw puede observar o bloquear determinados eventos nativos mediante el
  relé compatible, pero no reescribe los argumentos de herramientas nativas.
- Codex gestiona la Compaction nativa. OpenClaw conserva una copia del historial para
  el historial del canal, la búsqueda, `/new`, `/reset` y futuros cambios de modelo o entorno,
  pero no reemplaza la Compaction de Codex por un resumidor de OpenClaw o del
  motor de contexto.
- La generación y comprensión multimedia, TTS, las aprobaciones y la salida de las herramientas
  de mensajería continúan mediante los ajustes correspondientes de proveedor/modelo de OpenClaw.
- `tool_result_persist` se aplica a los resultados de herramientas del historial propiedad de OpenClaw,
  no a los registros de resultados de herramientas nativas de Codex.

Para obtener información sobre las capas de hooks, las superficies V1 compatibles, la gestión de permisos nativos, el direccionamiento
de colas, los mecanismos de envío de comentarios de Codex y los detalles de Compaction, consulte
[Entorno de ejecución de Codex](/es/plugins/codex-harness-runtime).

## Solución de problemas

**Codex no aparece como un proveedor normal de `/model`:** es lo esperado para las configuraciones
nuevas. Seleccione un modelo `openai/gpt-*`, habilite
`plugins.entries.codex.enabled` y compruebe si `plugins.allow` excluye
`codex`.

**OpenClaw usa el entorno integrado en lugar de Codex:** confirme que la ruta efectiva
sea una ruta oficial HTTPS exacta de Platform Responses o ChatGPT Responses,
que no tenga una sustitución de solicitud definida por el autor y que el plugin de Codex esté instalado y
habilitado. El prefijo `openai/gpt-*` por sí solo no es suficiente. Para obtener una prueba estricta durante
las pruebas, establezca `agentRuntime.id: "codex"` en el proveedor o modelo; Codex forzado falla
en lugar de recurrir a una alternativa cuando la ruta o el entorno son incompatibles.

**El entorno de ejecución de OpenAI Codex recurre a la ruta de clave de API:** recopile un extracto
censurado del gateway que muestre el modelo, el entorno de ejecución, el proveedor seleccionado y el
fallo. Pida a los colaboradores afectados que ejecuten este comando de solo lectura en su
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

**La configuración conserva referencias de modelos Codex heredadas:** ejecute `openclaw doctor --fix`.
Doctor reescribe las referencias de modelos heredadas como `openai/*`, elimina los anclajes obsoletos del entorno de ejecución
de sesiones y del agente completo, y conserva las sustituciones existentes de perfiles de autenticación.

**App-server es rechazado:** use app-server `0.143.0` de Codex o una versión posterior.
Las versiones preliminares de la misma versión o las versiones con sufijo de compilación, como
`0.143.0-alpha.2` o `0.143.0+custom`, se rechazan porque OpenClaw prueba
el nivel mínimo del protocolo estable `0.143.0`.

**`/codex status` no puede conectarse:** compruebe que el plugin `codex`
esté habilitado, que `plugins.allow` lo incluya cuando haya una lista de permitidos
configurada y que cualquier `appServer.command`, `url`, `authToken` o
cabecera personalizada sea válida.

**La detección de modelos es lenta:** reduzca
`plugins.entries.codex.config.discovery.timeoutMs` o deshabilite la detección.
Consulte la [referencia del arnés de Codex](/es/plugins/codex-harness-reference#model-discovery).

**El transporte WebSocket falla de inmediato:** compruebe `appServer.url`,
`authToken`, las cabeceras y que el servidor de aplicaciones remoto utilice la misma
versión del protocolo del servidor de aplicaciones de Codex.

**Las herramientas nativas de shell o de aplicación de parches están bloqueadas con `Native hook relay
unavailable`:** el hilo de Codex sigue intentando utilizar un identificador
de retransmisión de enlace nativo que OpenClaw ya no tiene registrado. Se trata de un problema
del transporte de enlaces nativos de Codex, no de un fallo del backend ACP, del proveedor,
de GitHub ni de los comandos de shell. Inicie una sesión nueva en el chat afectado con
`/new` o `/reset` y vuelva a intentar un comando inofensivo. Si funciona
una vez, pero la siguiente llamada a una herramienta nativa vuelve a fallar, considere
`/new` solo una solución temporal: copie la instrucción en una sesión nueva después
de reiniciar el servidor de aplicaciones de Codex o el Gateway de OpenClaw para descartar
los hilos antiguos y volver a crear los registros de enlaces nativos.

**Un modelo que no es de Codex utiliza el arnés integrado:** es el comportamiento esperado,
a menos que la política de ejecución del proveedor o del modelo lo dirija a otro arnés.
Las referencias simples de proveedores que no son de OpenAI permanecen en la ruta normal
de su proveedor en el modo `auto`.

**Computer Use está instalado, pero las herramientas no se ejecutan:** compruebe
`/codex computer-use status` desde una sesión nueva. Si una herramienta informa de
`Native hook relay unavailable`, utilice el procedimiento anterior de recuperación de la retransmisión
de enlaces nativos.
Consulte [Codex Computer Use](/es/plugins/codex-computer-use#troubleshooting).

## Relacionado

- [Referencia del arnés de Codex](/es/plugins/codex-harness-reference)
- [Entorno de ejecución del arnés de Codex](/es/plugins/codex-harness-runtime)
- [Supervisión de Codex](/es/plugins/codex-supervision)
- [Plugins nativos de Codex](/es/plugins/codex-native-plugins)
- [Codex Computer Use](/es/plugins/codex-computer-use)
- [Entornos de ejecución de agentes](/es/concepts/agent-runtimes)
- [Proveedores de modelos](/es/concepts/model-providers)
- [Proveedor de OpenAI](/es/providers/openai)
- [Ayuda de OpenAI Codex](https://help.openai.com/en/collections/14937394-codex)
- [Plugins de arnés de agentes](/es/plugins/sdk-agent-harness)
- [Enlaces de plugins](/es/plugins/hooks)
- [Exportación de diagnósticos](/es/gateway/diagnostics)
- [Estado](/es/cli/status)
- [Pruebas](/es/help/testing-live#live-codex-app-server-harness-smoke)
