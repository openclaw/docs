---
read_when:
    - Quieres usar el arnés de servidor de aplicaciones Codex incluido
    - Necesitas ejemplos de configuración del arnés de Codex
    - Quieres que las implementaciones solo con Codex fallen en lugar de recurrir a OpenClaw
summary: Ejecuta turnos del agente integrado de OpenClaw mediante el arnés de app-server de Codex incluido
title: Arnés de Codex
x-i18n:
    generated_at: "2026-07-04T10:27:12Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f1cf51f87f1ccaab2611926ea6bdba73f53de9a88b44da2395eb5f4c147da188
    source_path: plugins/codex-harness.md
    workflow: 16
---

El Plugin `codex` incluido permite que OpenClaw ejecute turnos de agente OpenAI integrados
mediante Codex app-server en lugar del arnés integrado de OpenClaw.

Usa el arnés de Codex cuando quieras que Codex posea la sesión de agente de bajo nivel:
reanudación nativa de hilos, continuación nativa de herramientas, compactación nativa y
ejecución en app-server. OpenClaw sigue siendo propietario de los canales de chat, los archivos de sesión, la selección de modelos, las herramientas dinámicas de OpenClaw, las aprobaciones, la entrega de medios y el espejo visible de la transcripción.

La configuración normal usa referencias de modelo OpenAI canónicas como `openai/gpt-5.5`.
No configures referencias GPT de Codex heredadas. Coloca el orden de autenticación de agente OpenAI
en `auth.order.openai`; los ids de perfiles de autenticación Codex heredados más antiguos y
las entradas heredadas de orden de autenticación Codex son estado heredado que repara
`openclaw doctor --fix`.

Cuando no hay un sandbox de OpenClaw activo, OpenClaw inicia hilos de Codex app-server
con el modo de código nativo de Codex activado, mientras deja el modo solo código desactivado de forma predeterminada.
Eso mantiene disponibles el espacio de trabajo nativo y las capacidades de código de Codex mientras
las herramientas dinámicas de OpenClaw continúan a través del puente `item/tool/call` de app-server.
El sandboxing activo de OpenClaw y las políticas de herramientas restringidas desactivan por completo el modo de código nativo
a menos que optes por la ruta experimental de exec-server de sandbox.

Esta característica nativa de Codex es independiente de
[modo de código de OpenClaw](/es/reference/code-mode), que es un runtime QuickJS-WASI opcional
para ejecuciones genéricas de OpenClaw con una forma de entrada `exec` diferente.

Para la separación más amplia de modelo/proveedor/runtime, empieza con
[Runtimes de agente](/es/concepts/agent-runtimes). La versión breve es:
`openai/gpt-5.5` es la referencia de modelo, `codex` es el runtime, y Telegram,
Discord, Slack u otro canal sigue siendo la superficie de comunicación.

## Requisitos

- OpenClaw con el Plugin `codex` incluido disponible.
- Si tu configuración usa `plugins.allow`, incluye `codex`.
- Codex app-server `0.125.0` o más reciente. El Plugin incluido gestiona un binario
  Codex app-server compatible de forma predeterminada, así que los comandos locales `codex` en `PATH` no
  afectan al inicio normal del arnés.
- Autenticación de Codex disponible mediante `openclaw models auth login --provider openai`,
  una cuenta de app-server en el directorio de inicio Codex del agente, o un perfil de autenticación Codex explícito
  con clave de API.

Para la precedencia de autenticación, el aislamiento del entorno, comandos personalizados de app-server, descubrimiento de modelos
y todos los campos de configuración, consulta
[Referencia del arnés de Codex](/es/plugins/codex-harness-reference).

## Inicio rápido

La mayoría de usuarios que quieren Codex en OpenClaw quieren esta ruta: iniciar sesión con una
suscripción ChatGPT/Codex, habilitar el Plugin `codex` incluido y usar una
referencia de modelo `openai/gpt-*` canónica.

Inicia sesión con OAuth de Codex:

```bash
openclaw models auth login --provider openai
```

Habilita el Plugin `codex` incluido y selecciona un modelo de agente OpenAI:

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
      model: "openai/gpt-5.5",
    },
  },
}
```

Si tu configuración usa `plugins.allow`, añade `codex` ahí también:

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

Reinicia el Gateway después de cambiar la configuración de Plugins. Si un chat existente ya
tiene una sesión, usa `/new` o `/reset` antes de probar cambios de runtime para que el siguiente
turno resuelva el arnés desde la configuración actual.

## Compartir hilos con Codex Desktop y CLI

El valor predeterminado `appServer.homeScope: "agent"` mantiene cada agente de OpenClaw aislado
del estado Codex nativo del operador. Para permitir que un propietario pida a OpenClaw inspeccionar
y gestionar los mismos hilos nativos que muestran Codex Desktop y la CLI de Codex,
opta por el directorio de inicio Codex del usuario:

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

El modo de directorio de usuario está disponible solo con transporte stdio local. Usa
`$CODEX_HOME` cuando está definido y `~/.codex` en caso contrario, incluido el estado nativo de ese directorio de inicio:
autenticación, configuración, Plugins y almacén de hilos de Codex. OpenClaw no inyecta un
perfil de autenticación de OpenClaw en este app-server.

Los turnos del propietario obtienen la herramienta `codex_threads`. Puede listar, buscar, leer, bifurcar,
renombrar, archivar y restaurar hilos nativos. Pide al agente que bifurque un hilo cuando
quieras continuarlo en OpenClaw; la bifurcación se adjunta a la sesión actual de
OpenClaw y sigue visible para otros clientes Codex nativos. Archivar
requiere confirmación explícita de que el hilo está cerrado en otro lugar.

No reanudes ni escribas en el mismo hilo simultáneamente desde OpenClaw y otro
cliente Codex. Codex coordina escritores activos dentro de un proceso app-server, no
entre procesos independientes de Desktop, CLI y OpenClaw. Bifurcar crea una
continuación separada y es la ruta segura de coexistencia.

## Configuración

La configuración de inicio rápido es la configuración mínima viable del arnés de Codex. Define las opciones del
arnés de Codex en la configuración de OpenClaw y usa la CLI solo para la autenticación de Codex:

| Necesidad                              | Definir                                                                          | Dónde                              |
| -------------------------------------- | -------------------------------------------------------------------------------- | ---------------------------------- |
| Habilitar el arnés                     | `plugins.entries.codex.enabled: true`                                            | Configuración de OpenClaw          |
| Mantener una instalación de Plugin en lista de permitidos | Incluir `codex` en `plugins.allow`                                               | Configuración de OpenClaw          |
| Enrutar turnos de agente OpenAI mediante Codex | `agents.defaults.model` o `agents.list[].model` como `openai/gpt-*`              | Configuración de agente OpenClaw   |
| Iniciar sesión con OAuth de ChatGPT/Codex | `openclaw models auth login --provider openai`                                   | Perfil de autenticación de CLI     |
| Añadir respaldo con clave de API para ejecuciones de Codex | Perfil de clave de API `openai:*` listado después de la autenticación por suscripción en `auth.order.openai` | Perfil de autenticación de CLI + configuración de OpenClaw |
| Fallar de forma cerrada cuando Codex no esté disponible | `agentRuntime.id: "codex"` de proveedor o modelo                                 | Configuración de modelo/proveedor de OpenClaw |
| Usar tráfico directo de la API de OpenAI | `agentRuntime.id: "openclaw"` de proveedor o modelo con autenticación OpenAI normal | Configuración de modelo/proveedor de OpenClaw |
| Ajustar el comportamiento de app-server | `plugins.entries.codex.config.appServer.*`                                       | Configuración del Plugin Codex     |
| Habilitar apps nativas de Plugins Codex | `plugins.entries.codex.config.codexPlugins.*`                                    | Configuración del Plugin Codex     |
| Habilitar Codex Computer Use           | `plugins.entries.codex.config.computerUse.*`                                     | Configuración del Plugin Codex     |

Usa referencias de modelo `openai/gpt-*` para turnos de agente OpenAI respaldados por Codex. Prefiere
`auth.order.openai` para el orden suscripción primero/respaldo con clave de API. Los ids de perfiles
de autenticación Codex heredados existentes y el orden de autenticación Codex heredado son estado heredado
solo para doctor; no escribas nuevas referencias GPT de Codex heredadas.

No definas `compaction.model` ni `compaction.provider` en agentes respaldados por Codex.
Codex compacta mediante el estado de hilo nativo de app-server, así que OpenClaw ignora
esas anulaciones locales de resumidor en runtime y `openclaw doctor --fix` las elimina
cuando el agente usa Codex.

Lossless sigue siendo compatible como motor de contexto para ensamblaje, ingesta y
mantenimiento alrededor de turnos de Codex. Configúralo mediante
`plugins.slots.contextEngine: "lossless-claw"` y
`plugins.entries.lossless-claw.config.summaryModel`, no mediante
`agents.defaults.compaction.provider`. `openclaw doctor --fix` migra la forma antigua
`compaction.provider: "lossless-claw"` al slot de motor de contexto Lossless
cuando Codex es el runtime activo, pero Codex nativo sigue siendo propietario de Compaction.

El arnés nativo Codex app-server admite motores de contexto que requieren
ensamblaje previo al prompt. Los backends CLI genéricos, incluido `codex-cli`, no proporcionan
esa capacidad de host.

Para agentes respaldados por Codex, `/compact` inicia la Compaction nativa de Codex app-server en
el hilo enlazado. OpenClaw no espera a que termine, impone un timeout de OpenClaw,
reinicia el app-server compartido ni recurre a un motor de contexto o
resumidor público de OpenAI. Si falta el enlace del hilo nativo de Codex o está
obsoleto, el comando falla de forma cerrada para que el operador vea el límite real de runtime
en lugar de cambiar silenciosamente de backend de Compaction.

```json5
{
  auth: {
    order: {
      openai: ["openai:user@example.com", "openai:api-key-backup"],
    },
  },
}
```

En esa forma, ambos perfiles siguen ejecutándose mediante Codex para turnos de agente
`openai/gpt-*`. La clave de API es solo una alternativa de autenticación, no una solicitud para cambiar a OpenClaw o
a OpenAI Responses simple.

El resto de esta página cubre variantes comunes entre las que los usuarios deben elegir:
forma de despliegue, enrutamiento con fallo cerrado, política de aprobación de guardian, Plugins nativos de Codex
y Computer Use. Para listas completas de opciones, valores predeterminados, enums, descubrimiento,
aislamiento del entorno, timeouts y campos de transporte de app-server, consulta
[Referencia del arnés de Codex](/es/plugins/codex-harness-reference).

## Verificar el runtime de Codex

Usa `/status` en el chat donde esperas Codex. Un turno de agente OpenAI respaldado por Codex
muestra:

```text
Runtime: OpenAI Codex
```

Luego comprueba el estado de Codex app-server:

```text
/codex status
/codex models
```

`/codex status` informa de la conectividad de app-server, cuenta, límites de tasa, servidores MCP
y Skills. `/codex models` lista el catálogo en vivo de Codex app-server para
el arnés y la cuenta. Si `/status` resulta inesperado, consulta
[Solución de problemas](#troubleshooting).

## Enrutamiento y selección de modelo

Mantén separadas las referencias de proveedor y la política de runtime:

- Usa `openai/gpt-*` para turnos de agente OpenAI mediante Codex.
- No uses referencias GPT de Codex heredadas en la configuración. Ejecuta `openclaw doctor --fix` para
  reparar referencias heredadas y pines de ruta de sesión obsoletos.
- `agentRuntime.id: "codex"` es opcional para el modo automático normal de OpenAI, pero útil
  cuando un despliegue debe fallar de forma cerrada si Codex no está disponible.
- `agentRuntime.id: "openclaw"` opta un proveedor o modelo al runtime integrado de OpenClaw
  cuando eso es intencional.
- `/codex ...` controla conversaciones nativas de Codex app-server desde el chat.
- ACP/acpx es una ruta de arnés externo independiente. Úsala solo cuando el usuario pida
  ACP/acpx o un adaptador de arnés externo.

Enrutamiento de comandos común:

| Intención del usuario                                | Uso                                                                                                   |
| ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Adjuntar el chat actual                              | `/codex bind [--cwd <path>]`                                                                          |
| Reanudar un hilo de Codex existente                  | `/codex resume <thread-id>`                                                                           |
| Listar o filtrar hilos de Codex                      | `/codex threads [filter]`                                                                             |
| Listar plugins nativos de Codex                      | `/codex plugins list`                                                                                 |
| Activar o desactivar un plugin nativo de Codex configurado | `/codex plugins enable <name>`, `/codex plugins disable <name>`                                       |
| Adjuntar una sesión existente de Codex CLI en un nodo emparejado | `/codex sessions --host <node> [filter]`, luego `/codex resume <session-id> --host <node> --bind here` |
| Enviar solo comentarios de Codex                     | `/codex diagnostics [note]`                                                                           |
| Iniciar una tarea ACP/acpx                           | Comandos de sesión ACP/acpx, no `/codex`                                                              |

| Caso de uso                                          | Configurar                                                             | Verificar                               | Notas                                 |
| ---------------------------------------------------- | ---------------------------------------------------------------------- | --------------------------------------- | ------------------------------------- |
| Suscripción ChatGPT/Codex con runtime nativo de Codex | `openai/gpt-*` más el plugin `codex` activado                          | `/status` muestra `Runtime: OpenAI Codex` | Ruta recomendada                      |
| Fallar de forma cerrada si Codex no está disponible  | Proveedor o modelo `agentRuntime.id: "codex"`                          | El turno falla en lugar de usar el fallback integrado | Usar para despliegues solo de Codex   |
| Enviar tráfico directo de clave de API de OpenAI a través de OpenClaw | Proveedor o modelo `agentRuntime.id: "openclaw"` y autenticación normal de OpenAI | `/status` muestra el runtime de OpenClaw | Usar solo cuando OpenClaw sea intencional |
| Configuración heredada                               | referencias heredadas de Codex GPT                                     | `openclaw doctor --fix` la reescribe    | No escribir configuración nueva de esta forma |
| Adaptador ACP/acpx de Codex                          | ACP `sessions_spawn({ runtime: "acp" })`                               | Estado de tarea/sesión ACP              | Separado del arnés nativo de Codex    |

`agents.defaults.imageModel` sigue la misma división por prefijo. Usa `openai/gpt-*`
para la ruta normal de OpenAI y `codex/gpt-*` solo cuando la comprensión de imágenes
deba ejecutarse mediante un turno acotado del app-server de Codex. No uses
referencias heredadas de Codex GPT; doctor reescribe ese prefijo heredado a `openai/gpt-*`.

## Patrones de despliegue

### Despliegue básico de Codex

Usa la configuración de inicio rápido cuando todos los turnos de agente de OpenAI deban usar Codex de forma
predeterminada.

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
      model: "openai/gpt-5.5",
    },
  },
}
```

### Despliegue con proveedores mixtos

Esta forma mantiene Claude como agente predeterminado y agrega un agente Codex con nombre:

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
        model: "openai/gpt-5.5",
      },
    ],
  },
}
```

Con esta configuración, el agente `main` usa su ruta normal de proveedor y el
agente `codex` usa el app-server de Codex.

### Despliegue de Codex con fallo cerrado

Para los turnos de agente de OpenAI, `openai/gpt-*` ya se resuelve a Codex cuando el
plugin incluido está disponible. Agrega una política de runtime explícita cuando quieras una regla escrita
de fallo cerrado:

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
      model: "openai/gpt-5.5",
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

Con Codex forzado, OpenClaw falla temprano si el plugin de Codex está desactivado, el
app-server es demasiado antiguo o el app-server no puede iniciarse.

## Política de app-server

De forma predeterminada, el plugin inicia localmente el binario de Codex gestionado por OpenClaw con transporte
stdio. Configura `appServer.command` solo cuando quieras ejecutar intencionalmente un
ejecutable distinto. Usa transporte WebSocket solo cuando un app-server ya se esté
ejecutando en otro lugar:

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

Las sesiones locales stdio de app-server usan de forma predeterminada la postura de operador local de confianza:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` y
`sandbox: "danger-full-access"`. Si los requisitos locales de Codex no permiten esa
postura YOLO implícita, OpenClaw selecciona en su lugar permisos guardian permitidos.
Cuando un sandbox de OpenClaw está activo para la sesión, OpenClaw desactiva el
Code Mode nativo de Codex, los servidores MCP de usuario y la ejecución de plugins respaldada por apps para ese
turno en lugar de depender del sandboxing del lado del host de Codex. El acceso a shell se expone
mediante herramientas dinámicas respaldadas por el sandbox de OpenClaw, como `sandbox_exec` y
`sandbox_process`, cuando las herramientas normales exec/process están disponibles.

Usa el modo exec normalizado de OpenClaw cuando quieras revisión automática nativa de Codex antes de
escapes del sandbox o permisos adicionales:

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

Para sesiones de app-server de Codex, OpenClaw asigna `tools.exec.mode: "auto"` a aprobaciones
revisadas por Codex Guardian, normalmente
`approvalPolicy: "on-request"`, `approvalsReviewer: "auto_review"` y
`sandbox: "workspace-write"` cuando los requisitos locales permiten esos valores.
En `tools.exec.mode: "auto"`, OpenClaw no conserva anulaciones heredadas inseguras de Codex
`approvalPolicy: "never"` ni `sandbox: "danger-full-access"`; usa
`tools.exec.mode: "full"` para una postura de Codex intencional sin aprobaciones. El
preajuste heredado `plugins.entries.codex.config.appServer.mode: "guardian"` sigue
funcionando, pero `tools.exec.mode: "auto"` es la superficie normalizada de OpenClaw.

Para la comparación por modo con aprobaciones de exec del host y permisos ACPX,
consulta [Modos de permisos](/es/tools/permission-modes).

Para cada campo de app-server, orden de autenticación, aislamiento del entorno, descubrimiento y
comportamiento de timeout, consulta [Referencia del arnés de Codex](/es/plugins/codex-harness-reference).

## Comandos y diagnósticos

El plugin incluido registra `/codex` como comando de barra en cualquier canal que
admita comandos de texto de OpenClaw.

La ejecución y el control nativos requieren un propietario o un cliente Gateway `operator.admin`.
Esto incluye enlazar o reanudar hilos, enviar o detener turnos,
cambiar modelo, modo rápido o estado de permisos, compactar o revisar, y
desvincular un enlace. Otros remitentes autorizados conservan comandos de solo lectura de estado, ayuda,
cuenta, modelo, hilo, servidor MCP, skill e inspección de enlaces.

Formas comunes:

- `/codex status` comprueba la conectividad del app-server, modelos, cuenta, límites de tasa,
  servidores MCP y skills.
- `/codex models` lista los modelos activos del app-server de Codex.
- `/codex threads [filter]` lista hilos recientes del app-server de Codex.
- `/codex resume <thread-id>` adjunta la sesión actual de OpenClaw a un
  hilo de Codex existente.
- `/codex compact` pide al app-server de Codex que compacte el hilo adjunto.
- `/codex review` inicia la revisión nativa de Codex para el hilo adjunto.
- `/codex diagnostics [note]` pregunta antes de enviar comentarios de Codex para el
  hilo adjunto.
- `/codex account` muestra el estado de cuenta y límites de tasa.
- `/codex mcp` lista el estado de servidores MCP del app-server de Codex.
- `/codex skills` lista las skills del app-server de Codex.

Para la mayoría de informes de soporte, empieza con `/diagnostics [note]` en la conversación
donde ocurrió el error. Crea un informe de diagnósticos de Gateway y, para sesiones de
arnés de Codex, pide aprobación para enviar el paquete de comentarios de Codex pertinente.
Consulta [Exportación de diagnósticos](/es/gateway/diagnostics) para ver el modelo de privacidad y el comportamiento
en chats grupales.

Usa `/codex diagnostics [note]` solo cuando quieras específicamente la carga de comentarios de Codex
para el hilo actualmente adjunto sin el paquete completo de diagnósticos de Gateway.

### Inspeccionar hilos de Codex localmente

La forma más rápida de inspeccionar una ejecución incorrecta de Codex suele ser abrir directamente el hilo
nativo de Codex:

```bash
codex resume <thread-id>
```

Obtén el id del hilo de la respuesta completada de `/diagnostics`, `/codex binding` o
`/codex threads [filter]`.

Para la mecánica de carga y los límites de diagnóstico a nivel de runtime, consulta
[Runtime del arnés de Codex](/es/plugins/codex-harness-runtime#codex-feedback-upload).

En el home predeterminado por agente, la autenticación se selecciona en este orden:

1. Perfiles de autenticación de OpenAI ordenados para el agente, preferiblemente bajo
   `auth.order.openai`. Ejecuta `openclaw doctor --fix` para migrar ids antiguos
   heredados de perfiles de autenticación de Codex y el orden heredado de autenticación de Codex.
2. La cuenta existente del app-server en el home de Codex de ese agente.
3. Solo para lanzamientos locales stdio de app-server, `CODEX_API_KEY`, luego
   `OPENAI_API_KEY`, cuando no hay una cuenta de app-server presente y aún se requiere
   autenticación de OpenAI.

Cuando OpenClaw detecta un perfil de autenticación de Codex de estilo suscripción ChatGPT, elimina
`CODEX_API_KEY` y `OPENAI_API_KEY` del proceso hijo de Codex generado. Eso
mantiene disponibles las claves de API a nivel de Gateway para embeddings o modelos directos de OpenAI
sin hacer que los turnos nativos del app-server de Codex se facturen por la API por accidente.
Los perfiles explícitos de clave de API de Codex y el fallback local stdio con clave de entorno usan el inicio de sesión
del app-server en lugar de variables de entorno heredadas del proceso hijo. Las conexiones WebSocket de app-server
no reciben fallback de clave de API de entorno de Gateway; usa un perfil de autenticación explícito o la
cuenta propia del app-server remoto.
Cuando se configuran plugins nativos de Codex, OpenClaw instala o actualiza esos
plugins mediante el app-server conectado antes de exponer apps propiedad del plugin al
hilo de Codex. `app/list` sigue siendo la fuente de verdad para ids de apps,
accesibilidad y metadatos, pero OpenClaw controla la decisión de activación por hilo:
si la política permite una app accesible listada, OpenClaw envía
`thread/start.config.apps[appId].enabled = true` incluso cuando `app/list` informa actualmente
que esa app está desactivada. Esta ruta no inventa instalaciones de apps para
ids desconocidos; OpenClaw solo activa plugins del marketplace con `plugin/install`
y luego actualiza el inventario.

Si un perfil de suscripción alcanza un límite de uso de Codex, OpenClaw registra la hora de restablecimiento
cuando Codex informa una e intenta el siguiente perfil de autenticación ordenado para la misma
ejecución de Codex. Cuando pasa la hora de restablecimiento, el perfil de suscripción vuelve a ser elegible
sin cambiar el modelo `openai/gpt-*` seleccionado ni el runtime de Codex.

Para lanzamientos locales de app-server stdio, OpenClaw establece `CODEX_HOME` en un
directorio por agente para que la configuración de Codex, los archivos de
autenticación/cuenta, la caché/datos de plugins y el estado nativo de hilos no
lean ni escriban en el `~/.codex` personal del operador de forma predeterminada.
OpenClaw conserva el `HOME` normal del proceso; los subprocesos ejecutados por
Codex aún pueden encontrar la configuración y los tokens del directorio de
usuario, y Codex puede descubrir entradas compartidas de `$HOME/.agents/skills` y
`$HOME/.agents/plugins/marketplace.json`. Con `appServer.homeScope: "user"`,
OpenClaw usa en su lugar el directorio principal nativo de Codex del usuario y su
cuenta existente sin inyectar un perfil de autenticación de OpenClaw.

Si una implementación necesita aislamiento adicional del entorno, agrega esas
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

`appServer.clearEnv` solo afecta al proceso hijo del app-server de Codex
generado. OpenClaw elimina `CODEX_HOME` y `HOME` de esta lista durante la
normalización del lanzamiento local: `CODEX_HOME` sigue apuntando al alcance de
agente o usuario seleccionado, y `HOME` permanece heredado para que los
subprocesos puedan usar el estado normal del directorio de usuario.

Las herramientas dinámicas de Codex usan de forma predeterminada la carga
`searchable`. OpenClaw no expone herramientas dinámicas que dupliquen operaciones
nativas de Codex en el espacio de trabajo: `read`, `write`, `edit`,
`apply_patch`, `exec`, `process` y `update_plan`. La mayoría de las herramientas
restantes de integración de OpenClaw, como mensajería, medios, cron, navegador,
nodos, Gateway y `heartbeat_respond`, están disponibles mediante la búsqueda de
herramientas de Codex bajo el espacio de nombres `openclaw`, lo que mantiene más
pequeño el contexto inicial del modelo. La búsqueda web usa de forma
predeterminada la herramienta alojada `web_search` de Codex cuando la búsqueda
está habilitada y no se selecciona ningún proveedor gestionado. La búsqueda
alojada nativa y la herramienta dinámica gestionada `web_search` de OpenClaw son
mutuamente excluyentes para que la búsqueda gestionada no pueda omitir las
restricciones de dominio nativas. OpenClaw usa la herramienta gestionada cuando la
búsqueda alojada no está disponible, está deshabilitada explícitamente o se
reemplaza por un proveedor gestionado seleccionado. OpenClaw mantiene
deshabilitada la extensión independiente `web.run` de Codex porque el tráfico de
app-server de producción rechaza su espacio de nombres `web` definido por el
usuario. `tools.web.search.enabled: false` deshabilita ambas rutas, al igual que
las ejecuciones solo con LLM con herramientas deshabilitadas. Codex trata
`"cached"` como una preferencia y la resuelve como acceso externo en vivo para
turnos de app-server sin restricciones. La reserva automática gestionada falla en
modo cerrado cuando se establecen `allowedDomains` nativos para que no se pueda
omitir la lista de permitidos. Los cambios persistentes de la política efectiva
de búsqueda rotan el hilo de Codex vinculado antes del siguiente turno. Las
restricciones transitorias por turno usan un hilo restringido temporal y
conservan la vinculación existente para reanudar más tarde. `sessions_yield` y
las respuestas de origen solo de herramienta de mensajes siguen siendo directas
porque son contratos de control de turno. `sessions_spawn` sigue siendo
searchable para que `spawn_agent` nativo de Codex siga siendo la superficie
principal de subagentes de Codex, mientras que la delegación explícita de
OpenClaw o ACP sigue estando disponible mediante el espacio de nombres de
herramientas dinámicas `openclaw`. Las instrucciones de colaboración de
Heartbeat indican a Codex que busque `heartbeat_respond` antes de finalizar un
turno de Heartbeat cuando la herramienta aún no esté cargada.

Establece `codexDynamicToolsLoading: "direct"` solo al conectarte a un
app-server personalizado de Codex que no pueda buscar herramientas dinámicas
diferidas o al depurar la carga completa de herramientas.

Campos de Plugin de Codex de nivel superior admitidos:

| Campo                      | Predeterminado | Significado                                                                                       |
| -------------------------- | -------------- | ------------------------------------------------------------------------------------------------- |
| `codexDynamicToolsLoading` | `"searchable"` | Usa `"direct"` para colocar las herramientas dinámicas de OpenClaw directamente en el contexto inicial de herramientas de Codex. |
| `codexDynamicToolsExclude` | `[]`           | Nombres adicionales de herramientas dinámicas de OpenClaw que se omitirán en los turnos de app-server de Codex. |
| `codexPlugins`             | deshabilitado  | Compatibilidad nativa de plugins/apps de Codex para plugins seleccionados migrados e instalados desde el código fuente. |

Campos `appServer` admitidos:

| Campo                                         | Predeterminado                                         | Significado                                                                                                                                                                                                                                                                                                                                                                                                 |
| --------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                                   | `"stdio"`                                              | `"stdio"` inicia Codex; `"websocket"` se conecta a `url`.                                                                                                                                                                                                                                                                                                                                                   |
| `homeScope`                                   | `"agent"`                                              | `"agent"` aísla el estado de Codex por agente de OpenClaw. `"user"` comparte el `$CODEX_HOME` nativo o `~/.codex`, usa la autenticación nativa y habilita la gestión de hilos solo para el propietario. El ámbito de usuario requiere stdio.                                                                                                                                                                |
| `command`                                     | binario de Codex gestionado                            | Ejecutable para el transporte stdio. Déjalo sin definir para usar el binario gestionado; establécelo solo para una sobrescritura explícita.                                                                                                                                                                                                                                                                  |
| `args`                                        | `["app-server", "--listen", "stdio://"]`               | Argumentos para el transporte stdio.                                                                                                                                                                                                                                                                                                                                                                        |
| `url`                                         | sin definir                                            | URL del app-server WebSocket.                                                                                                                                                                                                                                                                                                                                                                               |
| `authToken`                                   | sin definir                                            | Token Bearer para el transporte WebSocket. Acepta una cadena literal o SecretInput como `${CODEX_APP_SERVER_TOKEN}`.                                                                                                                                                                                                                                                                                        |
| `headers`                                     | `{}`                                                   | Encabezados WebSocket adicionales. Los valores de encabezado aceptan cadenas literales o valores SecretInput, por ejemplo `x-codex-client-session-token: "${CODEX_CLIENT_SESSION_TOKEN}"`.                                                                                                                                                                                                                  |
| `clearEnv`                                    | `[]`                                                   | Nombres de variables de entorno adicionales eliminados del proceso app-server stdio iniciado después de que OpenClaw construye su entorno heredado. OpenClaw conserva el `CODEX_HOME` seleccionado y el `HOME` heredado para lanzamientos locales.                                                                                                                                                          |
| `codeModeOnly`                                | `false`                                                | Opta por la superficie de herramientas de Codex solo en modo de código. Las herramientas dinámicas de OpenClaw permanecen registradas con Codex para que las llamadas `tools.*` anidadas vuelvan a través del puente `item/tool/call` del app-server.                                                                                                                                                        |
| `remoteWorkspaceRoot`                         | sin definir                                            | Raíz remota del área de trabajo del app-server de Codex. Cuando se establece, OpenClaw infiere la raíz del área de trabajo local a partir del área de trabajo de OpenClaw resuelta, conserva el sufijo del cwd actual bajo esta raíz remota y envía solo el cwd final del app-server a Codex. Si el cwd está fuera de la raíz del área de trabajo de OpenClaw resuelta, OpenClaw falla de forma cerrada en lugar de enviar una ruta local del Gateway al app-server remoto. |
| `requestTimeoutMs`                            | `60000`                                                | Tiempo de espera para llamadas del plano de control del app-server.                                                                                                                                                                                                                                                                                                                                         |
| `turnCompletionIdleTimeoutMs`                 | `60000`                                                | Ventana de silencio después de que Codex acepta un turno o después de una solicitud del app-server con ámbito de turno mientras OpenClaw espera `turn/completed`.                                                                                                                                                                                                                                            |
| `postToolRawAssistantCompletionIdleTimeoutMs` | `300000`                                               | Guardia de inactividad de finalización y progreso usada después de una transferencia a una herramienta, finalización de herramienta nativa, progreso bruto del asistente posterior a herramienta, finalización de razonamiento bruto o progreso de razonamiento mientras OpenClaw espera `turn/completed`. Usa esto para cargas de trabajo confiables o pesadas donde la síntesis posterior a herramienta puede permanecer legítimamente en silencio más tiempo que el presupuesto final de publicación del asistente. |
| `mode`                                        | `"yolo"` salvo que los requisitos locales de Codex no permitan YOLO | Preajuste para ejecución YOLO o revisada por guardian. Los requisitos stdio locales que omiten `danger-full-access`, aprobación `never` o el revisor `user` hacen que el valor predeterminado implícito sea guardian.                                                                                                                                                                                        |
| `approvalPolicy`                              | `"never"` o una política de aprobación de guardian permitida | Política de aprobación nativa de Codex enviada al inicio, reanudación o turno del hilo. Los valores predeterminados de guardian prefieren `"on-request"` cuando está permitido.                                                                                                                                                                                                                              |
| `sandbox`                                     | `"danger-full-access"` o un sandbox de guardian permitido | Modo sandbox nativo de Codex enviado al inicio o reanudación del hilo. Los valores predeterminados de guardian prefieren `"workspace-write"` cuando está permitido; de lo contrario, `"read-only"`. Cuando un sandbox de OpenClaw está activo, los turnos `danger-full-access` usan `workspace-write` de Codex con acceso de red derivado de la configuración de egreso del sandbox de OpenClaw.               |
| `approvalsReviewer`                           | `"user"` o un revisor guardian permitido               | Usa `"auto_review"` para permitir que Codex revise los avisos de aprobación nativos cuando esté permitido; de lo contrario, `guardian_subagent` o `user`. `guardian_subagent` sigue siendo un alias heredado.                                                                                                                                                                                                 |
| `serviceTier`                                 | sin definir                                            | Nivel de servicio opcional del app-server de Codex. `"priority"` habilita el enrutamiento de modo rápido, `"flex"` solicita procesamiento flex, `null` borra la sobrescritura y el valor heredado `"fast"` se acepta como `"priority"`.                                                                                                                                                                    |
| `networkProxy`                                | deshabilitado                                          | Opta por redes de perfil de permisos de Codex para comandos del app-server. OpenClaw define la configuración `permissions.<profile>.network` seleccionada y la selecciona con `default_permissions` en lugar de enviar `sandbox`.                                                                                                                                                                           |
| `experimental.sandboxExecServer`              | `false`                                                | Opción de vista previa que registra un entorno de Codex respaldado por sandbox de OpenClaw con Codex app-server 0.132.0 o posterior, para que la ejecución nativa de Codex pueda ejecutarse dentro del sandbox activo de OpenClaw.                                                                                                                                                                          |

`appServer.networkProxy` es explícito porque cambia el contrato de sandbox de Codex.
Cuando está habilitado, OpenClaw también establece `features.network_proxy.enabled` y
`default_permissions` en la configuración del hilo de Codex para que el perfil de
permisos generado pueda iniciar las redes gestionadas por Codex. De forma predeterminada,
OpenClaw genera un nombre de perfil `openclaw-network-<fingerprint>` resistente a
colisiones a partir del cuerpo del perfil; usa `profileName` solo cuando se requiere
un nombre local estable.

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
};
```

Si el runtime normal de app-server fuera `danger-full-access`, habilitar
`networkProxy` usa acceso al sistema de archivos de estilo workspace para el
perfil de permisos generado. La aplicación de red administrada por Codex es red
aislada, por lo que un perfil de acceso completo no protegería el tráfico
saliente. Las entradas de dominio usan `allow` o `deny`; las entradas de socket
Unix usan los valores `allow` o `none` de Codex.

Las llamadas dinámicas a herramientas propiedad de OpenClaw están delimitadas de
forma independiente de `appServer.requestTimeoutMs`: las solicitudes
`item/tool/call` de Codex usan de forma predeterminada un watchdog de OpenClaw
de 90 segundos. Un argumento `timeoutMs` positivo por llamada amplía o acorta
ese presupuesto específico de herramienta. La herramienta `image_generate` usa
`agents.defaults.imageGenerationModel.timeoutMs` cuando la llamada a la
herramienta no proporciona su propio tiempo de espera, o de lo contrario un
valor predeterminado de generación de imágenes de 120 segundos. La herramienta
`image` de comprensión multimedia usa `tools.media.image.timeoutSeconds` o su
valor predeterminado multimedia de 60 segundos. Para comprensión de imágenes,
ese tiempo de espera se aplica a la solicitud en sí y no se reduce por el
trabajo de preparación anterior. Los presupuestos de herramientas dinámicas
tienen un límite de 600000 ms. Al agotarse el tiempo, OpenClaw aborta la señal
de la herramienta cuando es compatible y devuelve una respuesta fallida de
herramienta dinámica a Codex para que el turno pueda continuar en lugar de dejar
la sesión en `processing`. Este watchdog es el presupuesto dinámico externo de
`item/tool/call`; los tiempos de espera de solicitud específicos del proveedor
se ejecutan dentro de esa llamada y conservan su propia semántica de tiempo de
espera.

Después de que Codex acepta un turno, y después de que OpenClaw responde a una
solicitud de app-server con alcance de turno, el arnés espera que Codex avance
en el turno actual y finalmente termine el turno nativo con `turn/completed`.
Si el app-server queda en silencio durante
`appServer.turnCompletionIdleTimeoutMs`, OpenClaw interrumpe el turno de Codex
con el mejor esfuerzo, registra un tiempo de espera de diagnóstico y libera el
carril de sesión de OpenClaw para que los mensajes de chat posteriores no
queden en cola detrás de un turno nativo obsoleto. La mayoría de las
notificaciones no terminales del mismo turno desarman ese watchdog corto porque
Codex ha demostrado que el turno sigue activo. Las transferencias a herramientas
usan un presupuesto de inactividad posterior a la herramienta más largo: después
de que OpenClaw devuelve una respuesta `item/tool/call`, después de que se
completan elementos de herramienta nativos como `commandExecution`, después de
completarse `custom_tool_call_output` sin procesar, y después del progreso sin
procesar del asistente posterior a la herramienta, completaciones de razonamiento
sin procesar o progreso de razonamiento. La protección usa
`appServer.postToolRawAssistantCompletionIdleTimeoutMs` cuando está configurado
y, de lo contrario, usa cinco minutos de forma predeterminada. Ese mismo
presupuesto posterior a la herramienta también amplía el watchdog de progreso
para la ventana de síntesis silenciosa antes de que Codex emita el siguiente
evento del turno actual. Las notificaciones globales de app-server, como las
actualizaciones de límite de tasa, no restablecen el progreso de inactividad del
turno. Las completaciones de razonamiento, las completaciones `agentMessage` de
comentario y el progreso de razonamiento o del asistente sin procesar previo a
la herramienta pueden ir seguidos de una respuesta final automática, por lo que
usan la protección de respuesta posterior al progreso en lugar de liberar el
carril de sesión de inmediato. Solo los elementos `agentMessage` completados
finales/no de comentario y las completaciones del asistente sin procesar previas
a la herramienta arman la liberación por salida del asistente: si Codex queda
entonces en silencio sin `turn/completed`, OpenClaw interrumpe el turno nativo
con el mejor esfuerzo y libera el carril de sesión. Si otra vigilancia de turno
gana esa carrera de liberación, OpenClaw aún acepta el elemento de asistente
final completado una vez que ya no queda activa ninguna solicitud nativa,
elemento o completación de herramienta dinámica, y la liberación por salida del
asistente todavía pertenece al último elemento completado, sin completación de
elemento posterior. Esto puede preservar la respuesta final después de trabajo
de herramienta completado sin reproducir el turno. Los deltas parciales del
asistente, las respuestas anteriores obsoletas y las completaciones posteriores
vacías no califican. Los fallos de app-server por stdio que son seguros para
reproducción, incluidos los tiempos de espera de completación de turno sin
evidencia de asistente, herramienta, elemento activo o efecto secundario, se
reintentan una vez en un nuevo intento de app-server. Los tiempos de espera no
seguros aun así retiran el cliente de app-server bloqueado y liberan el carril
de sesión de OpenClaw. También borran el enlace obsoleto del hilo nativo en
lugar de reproducirse automáticamente. Los tiempos de espera de vigilancia de
completación muestran texto de tiempo de espera específico de Codex: los casos
seguros para reproducción dicen que la respuesta puede estar incompleta,
mientras que los casos no seguros indican al usuario que verifique el estado
actual antes de reintentar. Los diagnósticos públicos de tiempo de espera
incluyen campos estructurales como el último método de notificación de
app-server, el id/tipo/rol del elemento de respuesta del asistente sin procesar,
recuentos de solicitudes/elementos activos y el estado de vigilancia armado.
Cuando la última notificación es un elemento de respuesta del asistente sin
procesar, también incluyen una vista previa acotada del texto del asistente. No
incluyen contenido sin procesar de prompts ni de herramientas.

Las anulaciones de entorno siguen disponibles para pruebas locales:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN` omite el binario administrado cuando
`appServer.command` no está definido.

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` se eliminó. Usa
`plugins.entries.codex.config.appServer.mode: "guardian"` en su lugar, o
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` para pruebas locales puntuales. La
configuración se prefiere para implementaciones repetibles porque mantiene el
comportamiento del plugin en el mismo archivo revisado que el resto de la
configuración del arnés de Codex.

## Plugins nativos de Codex

La compatibilidad con plugins nativos de Codex usa las propias capacidades de
app y plugin de Codex app-server en el mismo hilo de Codex que el turno del
arnés de OpenClaw. OpenClaw no traduce plugins de Codex a herramientas dinámicas
sintéticas `codex_plugin_*` de OpenClaw.

`codexPlugins` afecta solo a las sesiones que seleccionan el arnés nativo de
Codex. No tiene efecto en ejecuciones con arnés integrado, ejecuciones normales
del proveedor OpenAI, enlaces de conversación ACP ni otros arneses.

Configuración migrada mínima:

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

La configuración de app del hilo se calcula cuando OpenClaw establece una sesión
del arnés de Codex o reemplaza un enlace obsoleto de hilo de Codex. No se vuelve
a calcular en cada turno. Después de cambiar `codexPlugins`, usa `/new`,
`/reset` o reinicia el Gateway para que las futuras sesiones del arnés de Codex
comiencen con el conjunto de apps actualizado.

Para elegibilidad de migración, inventario de apps, política de acciones
destructivas, elicitaciones y diagnósticos de plugins nativos, consulta
[Plugins nativos de Codex](/es/plugins/codex-native-plugins).

El acceso a apps y plugins del lado de OpenAI está controlado por la cuenta de
Codex con sesión iniciada y, para espacios de trabajo Business y Enterprise/Edu,
por los controles de apps del workspace. Consulta
[Uso de Codex con tu plan de ChatGPT](https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan)
para ver el resumen de cuentas y controles de workspace de OpenAI.

## Uso de computadora

El Uso de computadora está cubierto en su propia guía de configuración:
[Uso de computadora de Codex](/es/plugins/codex-computer-use).

La versión breve: OpenClaw no incluye como dependencia vendorizada la app de
control de escritorio ni ejecuta acciones de escritorio por sí mismo. Prepara
Codex app-server, verifica que el servidor MCP `computer-use` esté disponible y
luego deja que Codex sea propietario de las llamadas nativas a herramientas MCP
durante turnos en modo Codex.

## Límites de runtime

El arnés de Codex cambia solo el ejecutor de agente integrado de bajo nivel.

- Las herramientas dinámicas de OpenClaw son compatibles. Codex pide a OpenClaw
  que ejecute esas herramientas, por lo que OpenClaw permanece en la ruta de
  ejecución.
- Las herramientas nativas de shell, patch, MCP y app de Codex son propiedad de
  Codex. OpenClaw puede observar o bloquear eventos nativos seleccionados a
  través del relay compatible, pero no reescribe argumentos de herramientas
  nativas.
- Codex es propietario de la Compaction nativa. OpenClaw mantiene un espejo de
  transcripción para el historial de canales, búsqueda, `/new`, `/reset` y
  futuros cambios de modelo o arnés, pero no reemplaza la Compaction de Codex
  con un resumidor de OpenClaw o del motor de contexto.
- La generación multimedia, la comprensión multimedia, TTS, las aprobaciones y
  la salida de herramientas de mensajería siguen pasando por la configuración
  correspondiente de proveedor/modelo de OpenClaw.
- `tool_result_persist` se aplica a resultados de herramientas de transcripción
  propiedad de OpenClaw, no a registros de resultados de herramientas nativas de
  Codex.

Para capas de hooks, superficies V1 compatibles, manejo de permisos nativos,
dirección de colas, mecánica de carga de feedback de Codex y detalles de
Compaction, consulta [Runtime del arnés de Codex](/es/plugins/codex-harness-runtime).

## Solución de problemas

**Codex no aparece como proveedor `/model` normal:** esto es lo esperado para
configuraciones nuevas. Selecciona un modelo `openai/gpt-*`, habilita
`plugins.entries.codex.enabled` y comprueba si `plugins.allow` excluye `codex`.

**OpenClaw usa el arnés integrado en lugar de Codex:** asegúrate de que la
referencia de modelo sea `openai/gpt-*` en el proveedor oficial de OpenAI y de
que el plugin de Codex esté instalado y habilitado. Si necesitas una prueba
estricta durante las pruebas, configura `agentRuntime.id: "codex"` en el
proveedor o el modelo. Un runtime de Codex forzado falla en lugar de recurrir a
OpenClaw.

**El runtime OpenAI Codex vuelve a la ruta de clave de API:** recopila un
extracto redactado del Gateway que muestre el modelo, runtime, proveedor
seleccionado y fallo. Pide a los colaboradores afectados que ejecuten este
comando de solo lectura en su host de OpenClaw:

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

Los extractos útiles suelen incluir `openai/gpt-5.5` o `openai/gpt-5.4`,
`Runtime: OpenAI Codex`, `agentRuntime.id` o `harnessRuntime`,
`candidateProvider: "openai"` y un resultado `401`, `Incorrect API key` o
`No API key`. Una ejecución corregida debería mostrar la ruta OAuth de OpenAI en
lugar de un fallo simple de clave de API de OpenAI.

**Permanece la configuración de referencias de modelos Codex heredadas:**
ejecuta `openclaw doctor --fix`. Doctor reescribe las referencias de modelos
heredadas a `openai/*`, elimina pines obsoletos de sesión y de runtime de agente
completo, y preserva las anulaciones existentes de perfiles de autenticación.

**El app-server es rechazado:** usa Codex app-server `0.125.0` o posterior. Las
versiones preliminares de la misma versión o versiones con sufijo de compilación
como `0.125.0-alpha.2` o `0.125.0+custom` se rechazan porque OpenClaw comprueba
el mínimo estable del protocolo `0.125.0`.

**`/codex status` no puede conectarse:** comprueba que el plugin `codex`
incluido esté habilitado, que `plugins.allow` lo incluya cuando se configure una
lista de permitidos, y que cualquier `appServer.command`, `url`, `authToken` o
encabezado personalizado sea válido.

**El descubrimiento de modelos es lento:** reduce
`plugins.entries.codex.config.discovery.timeoutMs` o deshabilita el
descubrimiento. Consulta
[Referencia del arnés de Codex](/es/plugins/codex-harness-reference#model-discovery).

**El transporte WebSocket falla de inmediato:** comprueba `appServer.url`,
`authToken`, los encabezados y que el app-server remoto hable la misma versión
del protocolo de Codex app-server.

**Las herramientas nativas de shell o patch están bloqueadas con `Native hook relay unavailable`:**
el hilo de Codex sigue intentando usar un id de relay de hook nativo que OpenClaw ya no
tiene registrado. Este es un problema de transporte de hooks nativos de Codex, no un fallo del backend
ACP, del proveedor, de GitHub ni de un comando de shell. Inicia una sesión nueva en
el chat afectado con `/new` o `/reset` y luego vuelve a intentar un comando inofensivo. Si eso
funciona una vez pero la siguiente llamada a una herramienta nativa vuelve a fallar, trata `/new` solo como una solución temporal:
copia el prompt en una sesión nueva después de reiniciar el servidor de aplicación de Codex
o el Gateway de OpenClaw para que se descarten los hilos antiguos y se vuelvan a crear los
registros de hooks nativos.

**Un modelo que no es Codex usa el harness integrado:** eso es lo esperado salvo que
la política de runtime del proveedor o del modelo lo enrute a otro harness. Las refs de proveedor
simples que no son de OpenAI permanecen en su ruta de proveedor normal en modo `auto`.

**Computer Use está instalado, pero las herramientas no se ejecutan:** comprueba
`/codex computer-use status` desde una sesión nueva. Si una herramienta informa
`Native hook relay unavailable`, usa la recuperación del relay de hook nativo anterior. Consulta
[Codex Computer Use](/es/plugins/codex-computer-use#troubleshooting).

## Relacionado

- [Referencia del harness de Codex](/es/plugins/codex-harness-reference)
- [Runtime del harness de Codex](/es/plugins/codex-harness-runtime)
- [Plugins nativos de Codex](/es/plugins/codex-native-plugins)
- [Codex Computer Use](/es/plugins/codex-computer-use)
- [Runtimes de agentes](/es/concepts/agent-runtimes)
- [Proveedores de modelos](/es/concepts/model-providers)
- [Proveedor de OpenAI](/es/providers/openai)
- [Ayuda de OpenAI Codex](https://help.openai.com/en/collections/14937394-codex)
- [Plugins de harness de agentes](/es/plugins/sdk-agent-harness)
- [Hooks de Plugin](/es/plugins/hooks)
- [Exportación de diagnósticos](/es/gateway/diagnostics)
- [Estado](/es/cli/status)
- [Pruebas](/es/help/testing-live#live-codex-app-server-harness-smoke)
