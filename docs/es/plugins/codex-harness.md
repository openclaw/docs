---
read_when:
    - Quieres usar el arnés del servidor de aplicaciones de Codex incluido
    - Necesitas ejemplos de configuración del arnés de Codex
    - Quieres que las implementaciones solo con Codex fallen en lugar de recurrir a OpenClaw
summary: Ejecuta turnos de agente integrados de OpenClaw mediante el arnés de servidor de aplicación de Codex incluido
title: Arnés de Codex
x-i18n:
    generated_at: "2026-07-05T11:28:32Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dbb6c08e7f44a0f149158f10640d3be0241892d633b8877641579b8693e1fc8d
    source_path: plugins/codex-harness.md
    workflow: 16
---

El Plugin `codex` incluido ejecuta turnos de agente de OpenAI incrustados mediante Codex
app-server en lugar del arnés integrado de OpenClaw. Codex posee la
sesión de agente de bajo nivel: reanudación nativa de hilos, continuación
nativa de herramientas, compactación nativa y ejecución de app-server. OpenClaw sigue siendo responsable de los
canales de chat, archivos de sesión, selección de modelo, herramientas dinámicas de OpenClaw, aprobaciones,
entrega de medios y el espejo visible de la transcripción.

Usa referencias canónicas de modelos de OpenAI como `openai/gpt-5.5`. No configures
referencias GPT heredadas de Codex; coloca el orden de autenticación de agentes de OpenAI en `auth.order.openai`.
Los identificadores de perfil de autenticación heredados de Codex y las entradas de orden de autenticación heredadas de Codex se
reparan con `openclaw doctor --fix`.

Cuando no hay ningún sandbox de OpenClaw activo, OpenClaw inicia hilos de Codex app-server
con el modo de código nativo de Codex activado (code-mode-only permanece desactivado de forma predeterminada), por lo que
las capacidades nativas de espacio de trabajo/código siguen disponibles junto con las
herramientas dinámicas de OpenClaw enrutadas mediante el puente `item/tool/call` de app-server. Un
sandbox de OpenClaw activo o una política de herramientas restringida desactiva por completo el modo de código nativo
salvo que optes por la ruta experimental sandbox exec-server.

Esta característica nativa de Codex es independiente de
[modo de código de OpenClaw](/es/reference/code-mode), un runtime QuickJS-WASI opcional
para ejecuciones genéricas de OpenClaw con una forma de entrada `exec` distinta. Para la
división más amplia entre modelo/proveedor/runtime, empieza con
[Runtimes de agente](/es/concepts/agent-runtimes): `openai/gpt-5.5` es la referencia de modelo,
`codex` es el runtime, y Telegram, Discord, Slack u otro
canal es la superficie de comunicación.

## Requisitos

- OpenClaw con el Plugin `codex` incluido disponible. Incluye `codex` en
  `plugins.allow` si tu configuración usa una lista de permitidos.
- Codex app-server `0.125.0` o posterior. El Plugin gestiona un binario
  compatible de forma predeterminada, por lo que un comando `codex` en `PATH` no afecta al inicio
  normal.
- Autenticación de Codex mediante `openclaw models auth login --provider openai`, una
  cuenta de app-server ya presente en el directorio home de Codex del agente, o un
  perfil explícito de autenticación de Codex con clave de API.

Para la precedencia de autenticación, aislamiento del entorno, comandos personalizados de app-server,
descubrimiento de modelos y la lista completa de campos de configuración, consulta
[referencia del arnés de Codex](/es/plugins/codex-harness-reference).

## Inicio rápido

Inicia sesión con OAuth de Codex:

```bash
openclaw models auth login --provider openai
```

Activa el Plugin `codex` incluido y selecciona un modelo de agente de OpenAI:

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

Si tu configuración usa `plugins.allow`, añade también `codex` allí:

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

Reinicia el gateway después de cambiar la configuración del Plugin. Si un chat ya tiene una
sesión, ejecuta `/new` o `/reset` primero para que el siguiente turno resuelva el arnés
desde la configuración actual.

## Compartir hilos con Codex Desktop y CLI

El valor predeterminado `appServer.homeScope: "agent"` aísla cada agente de OpenClaw del
estado nativo de Codex del operador. Para permitir que un propietario inspeccione y gestione los
mismos hilos nativos que muestran Codex Desktop y la CLI de Codex, opta por el
directorio home de Codex del usuario:

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

El modo de home de usuario requiere transporte stdio local. Usa `$CODEX_HOME` cuando
está definido y `~/.codex` en caso contrario, incluida la autenticación nativa de Codex de ese home,
su configuración, plugins y almacén de hilos. OpenClaw no inyecta un perfil de autenticación de OpenClaw
en este app-server.

Los turnos del propietario obtienen la herramienta `codex_threads`: listar, buscar, leer, bifurcar, renombrar,
archivar y restaurar hilos nativos. Bifurca un hilo para continuarlo en
OpenClaw; la bifurcación se adjunta a la sesión actual de OpenClaw y permanece
visible para otros clientes nativos de Codex. Archivar requiere una
confirmación explícita de que el hilo está cerrado en otro lugar.

No reanudes ni escribas en el mismo hilo simultáneamente desde OpenClaw y
otro cliente de Codex. Codex coordina escritores activos dentro de un proceso de app-server,
no entre procesos independientes de Desktop, CLI y OpenClaw.
Bifurcar es la ruta segura de coexistencia.

## Configuración

| Necesidad                              | Establecer                                                                       | Dónde                              |
| -------------------------------------- | -------------------------------------------------------------------------------- | ---------------------------------- |
| Activar el arnés                       | `plugins.entries.codex.enabled: true`                                            | configuración de OpenClaw          |
| Mantener una instalación de Plugin en lista de permitidos | Incluir `codex` en `plugins.allow`                                               | configuración de OpenClaw          |
| Enrutar turnos de agente de OpenAI mediante Codex | `agents.defaults.model` o `agents.list[].model` como `openai/gpt-*`              | configuración de agente de OpenClaw |
| Iniciar sesión con OAuth de ChatGPT/Codex | `openclaw models auth login --provider openai`                                   | perfil de autenticación de CLI     |
| Añadir respaldo de clave de API para ejecuciones de Codex | perfil de clave de API `openai:*` listado después de la autenticación por suscripción en `auth.order.openai` | perfil de autenticación de CLI + configuración de OpenClaw |
| Fallar de forma cerrada cuando Codex no está disponible | `agentRuntime.id: "codex"` de proveedor o modelo                                 | configuración de modelo/proveedor de OpenClaw |
| Usar tráfico directo de la API de OpenAI | `agentRuntime.id: "openclaw"` de proveedor o modelo con autenticación normal de OpenAI | configuración de modelo/proveedor de OpenClaw |
| Ajustar el comportamiento de app-server | `plugins.entries.codex.config.appServer.*`                                       | configuración del Plugin Codex     |
| Activar aplicaciones nativas del Plugin de Codex | `plugins.entries.codex.config.codexPlugins.*`                                    | configuración del Plugin Codex     |
| Activar Codex Computer Use             | `plugins.entries.codex.config.computerUse.*`                                     | configuración del Plugin Codex     |

Prefiere `auth.order.openai` para el orden de suscripción primero/respaldo con clave de API.
Los identificadores de perfil de autenticación heredados de Codex existentes y el orden de autenticación heredado de Codex son
estado heredado solo para doctor; no escribas nuevas referencias GPT heredadas de Codex.

```json5
{
  auth: {
    order: {
      openai: ["openai:user@example.com", "openai:api-key-backup"],
    },
  },
}
```

Ambos perfiles anteriores siguen ejecutándose mediante Codex para turnos de agente `openai/gpt-*`.
La clave de API solo es un respaldo de autenticación, no una solicitud para cambiar a OpenClaw o
a OpenAI Responses sin más.

### Compaction

No configures `compaction.model` ni `compaction.provider` en agentes respaldados por Codex.
Codex compacta mediante su estado nativo de hilos de app-server, por lo que
OpenClaw ignora esas sustituciones locales del resumidor en runtime, y
`openclaw doctor --fix` las elimina cuando el agente usa Codex.

Lossless sigue siendo compatible como motor de contexto para ensamblaje, ingesta y
mantenimiento alrededor de turnos de Codex, configurado mediante
`plugins.slots.contextEngine: "lossless-claw"` y
`plugins.entries.lossless-claw.config.summaryModel`, no mediante
`agents.defaults.compaction.provider`. `openclaw doctor --fix` migra la
forma antigua `compaction.provider: "lossless-claw"` al slot de motor de contexto Lossless
cuando Codex es el runtime activo, pero Codex nativo sigue
siendo responsable de la Compaction. El arnés nativo de app-server admite motores de contexto
que necesitan ensamblaje previo al prompt; los backends genéricos de CLI, incluido `codex-cli`,
no proporcionan esa capacidad de host.

Para agentes respaldados por Codex, `/compact` inicia la compactación nativa de Codex app-server
en el hilo vinculado. OpenClaw no espera a que termine,
no impone un timeout de OpenClaw, no reinicia el app-server compartido ni recurre a un
motor de contexto o resumidor público de OpenAI. Si la vinculación del hilo nativo de Codex
falta o está obsoleta, el comando falla de forma cerrada en lugar de cambiar silenciosamente
los backends de compactación.

El resto de esta página cubre la forma de despliegue, el enrutamiento fail-closed, la política de aprobación
del guardián, los plugins nativos de Codex y Computer Use. Para las listas completas de opciones,
valores predeterminados, enums, descubrimiento, aislamiento del entorno, timeouts y
campos de transporte de app-server, consulta
[referencia del arnés de Codex](/es/plugins/codex-harness-reference).

## Verificar el runtime de Codex

Usa `/status` en el chat donde esperas Codex. Un turno de agente de OpenAI
respaldado por Codex muestra:

```text
Runtime: OpenAI Codex
```

Luego comprueba el estado de Codex app-server:

```text
/codex status
/codex models
```

`/codex status` informa de conectividad de app-server, cuenta, límites de tasa, servidores MCP
y Skills. `/codex models` lista el catálogo activo de Codex app-server
para el arnés y la cuenta. Si `/status` te sorprende, consulta
[Solución de problemas](#troubleshooting).

## Enrutamiento y selección de modelo

Mantén separadas las referencias de proveedor y la política de runtime:

- Usa `openai/gpt-*` para turnos de agente de OpenAI mediante Codex.
- No uses referencias GPT heredadas de Codex en la configuración; ejecuta `openclaw doctor --fix` para
  reparar referencias heredadas y pines obsoletos de ruta de sesión.
- `agentRuntime.id: "codex"` es opcional para el modo automático normal de OpenAI, pero
  útil cuando un despliegue debe fallar de forma cerrada si Codex no está disponible.
- `agentRuntime.id: "openclaw"` hace que un proveedor o modelo use el runtime incrustado
  de OpenClaw cuando esa sea la intención.
- `/codex ...` controla conversaciones nativas de Codex app-server desde el chat.
- ACP/acpx es una ruta de arnés externo independiente. Úsala solo cuando el usuario
  pida ACP/acpx o un adaptador de arnés externo.

| Intención del usuario                                  | Usar                                                                                                  |
| ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------- |
| Adjuntar el chat actual                                | `/codex bind [thread-id] [--cwd <path>] [--model <model>] [--provider <provider>]`                    |
| Reanudar un hilo de Codex existente                    | `/codex resume <thread-id>`                                                                           |
| Listar o filtrar hilos de Codex                        | `/codex threads [filter]`                                                                             |
| Listar plugins nativos de Codex                        | `/codex plugins list`                                                                                 |
| Activar o desactivar un Plugin nativo de Codex configurado | `/codex plugins enable <name>`, `/codex plugins disable <name>`                                       |
| Adjuntar una sesión existente de Codex CLI en un nodo emparejado | `/codex sessions --host <node> [filter]`, then `/codex resume <session-id> --host <node> --bind here` |
| Cambiar el modelo, fast-mode o permisos del hilo vinculado | `/codex model <model>`, `/codex fast [on\|off\|status]`, `/codex permissions [default\|yolo\|status]` |
| Detener u orientar el turno activo                     | `/codex stop`, `/codex steer <text>`                                                                  |
| Separar la vinculación actual                          | `/codex detach` (alias `/codex unbind`)                                                               |
| Enviar solo comentarios de Codex                       | `/codex diagnostics [note]`                                                                           |
| Iniciar una tarea ACP/acpx                             | Comandos de sesión de ACP/acpx, no `/codex`                                                           |

| Caso de uso                                          | Configurar                                                            | Verificar                               | Notas                                 |
| ---------------------------------------------------- | --------------------------------------------------------------------- | --------------------------------------- | ------------------------------------- |
| Suscripción de ChatGPT/Codex con runtime nativo de Codex | `openai/gpt-*` más el Plugin `codex` habilitado                       | `/status` muestra `Runtime: OpenAI Codex` | Ruta recomendada                      |
| Fallar de forma cerrada si Codex no está disponible  | Proveedor o modelo `agentRuntime.id: "codex"`                         | El turno falla en lugar de usar fallback embebido | Úselo para despliegues solo de Codex  |
| Tráfico directo con clave API de OpenAI a través de OpenClaw | Proveedor o modelo `agentRuntime.id: "openclaw"` y autenticación normal de OpenAI | `/status` muestra el runtime de OpenClaw | Úselo solo cuando OpenClaw sea intencional |
| Configuración heredada                               | referencias GPT heredadas de Codex                                    | `openclaw doctor --fix` la reescribe    | No escriba configuración nueva de esta forma |
| Adaptador ACP/acpx de Codex                          | ACP `sessions_spawn({ runtime: "acp" })`                              | Estado de tarea/sesión de ACP           | Separado del arnés nativo de Codex    |

`agents.defaults.imageModel` sigue la misma separación por prefijo. Use `openai/gpt-*`
para la ruta normal de OpenAI y `codex/gpt-*` solo cuando la comprensión de imágenes
deba ejecutarse mediante un turno delimitado del servidor de aplicaciones de Codex. Doctor reescribe las referencias GPT heredadas
de Codex a `openai/gpt-*`.

## Patrones de despliegue

### Despliegue básico de Codex

Use la configuración de inicio rápido cuando todos los turnos de agente de OpenAI deban usar Codex de forma
predeterminada:

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

### Despliegue con proveedor mixto

Mantenga Claude como agente predeterminado y agregue un agente Codex con nombre:

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

El agente `main` usa su ruta de proveedor normal; el agente `codex` usa el
servidor de aplicaciones de Codex.

### Despliegue de Codex con fallo cerrado

`openai/gpt-*` ya se resuelve a Codex cuando el Plugin incluido está
disponible. Agregue una política de runtime explícita para una regla escrita de fallo cerrado:

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

Con Codex forzado, OpenClaw falla pronto si el Plugin de Codex está deshabilitado, el
servidor de aplicaciones es demasiado antiguo o el servidor de aplicaciones no puede iniciarse.

## Política del servidor de aplicaciones

De forma predeterminada, el Plugin inicia localmente el binario de Codex administrado por OpenClaw con
transporte stdio. Configure `appServer.command` solo para ejecutar intencionalmente un
ejecutable distinto. Use transporte WebSocket solo cuando un servidor de aplicaciones ya se esté
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

Las sesiones locales del servidor de aplicaciones stdio usan de forma predeterminada la postura de operador local de confianza:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` y
`sandbox: "danger-full-access"`. Si los requisitos locales de Codex no permiten esa
postura YOLO implícita, OpenClaw selecciona permisos de guardián permitidos
en su lugar. Cuando un sandbox de OpenClaw está activo para la sesión, OpenClaw
deshabilita el Code Mode nativo de Codex, los servidores MCP del usuario y la ejecución de Plugin
respaldada por aplicaciones para ese turno, en lugar de depender del sandboxing del lado del host de Codex.
El acceso a shell pasa en cambio por herramientas dinámicas respaldadas por el sandbox de OpenClaw, como
`sandbox_exec` y `sandbox_process`, cuando las herramientas normales de exec/proceso
están disponibles.

Use el modo exec normalizado de OpenClaw para la auto-review nativa de Codex antes de
escapes de sandbox o permisos adicionales:

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

Para sesiones del servidor de aplicaciones de Codex, `tools.exec.mode: "auto"` se asigna a aprobaciones
revisadas por Codex Guardian: normalmente `approvalPolicy: "on-request"`,
`approvalsReviewer: "auto_review"` y `sandbox: "workspace-write"` cuando
los requisitos locales permiten esos valores. En `tools.exec.mode: "auto"`,
OpenClaw no conserva las anulaciones heredadas inseguras de Codex `approvalPolicy: "never"` o
`sandbox: "danger-full-access"`; use `tools.exec.mode: "full"` para
una postura intencional de Codex sin aprobación. El preajuste heredado
`plugins.entries.codex.config.appServer.mode: "guardian"` todavía
funciona, pero `tools.exec.mode: "auto"` es la superficie normalizada de OpenClaw.

Para la comparación a nivel de modo con aprobaciones exec del host y permisos
ACPX, consulte [Modos de permisos](/es/tools/permission-modes). Para cada
campo del servidor de aplicaciones, orden de autenticación, aislamiento de entorno y comportamiento de timeout,
consulte [Referencia del arnés de Codex](/es/plugins/codex-harness-reference).

## Comandos y diagnósticos

El Plugin incluido registra `/codex` como comando de barra en cualquier canal que
admita comandos de texto de OpenClaw.

La ejecución y el control nativos requieren un propietario o un cliente Gateway
`operator.admin`: vincular o reanudar hilos, enviar o detener turnos,
cambiar modelo, modo rápido o estado de permisos, compactar o revisar, y
desvincular una vinculación. Otros remitentes autorizados conservan comandos de solo lectura para estado, ayuda,
cuenta, modelo, hilo, servidor MCP, skill e inspección de vinculaciones.

Formas comunes:

- `/codex status` comprueba la conectividad del servidor de aplicaciones, modelos, cuenta, límites de
  tasa, servidores MCP y skills.
- `/codex models` enumera los modelos activos del servidor de aplicaciones de Codex.
- `/codex threads [filter]` enumera hilos recientes del servidor de aplicaciones de Codex.
- `/codex resume <thread-id>` adjunta la sesión actual de OpenClaw a un
  hilo existente de Codex.
- `/codex bind [thread-id] [--cwd <path>] [--model <model>] [--provider <provider>]`
  adjunta el chat actual.
- `/codex detach` (o `/codex unbind`) elimina la vinculación actual.
- `/codex binding` describe la vinculación actual.
- `/codex stop` detiene el turno activo; `/codex steer <text>` lo dirige.
- `/codex model <model>`, `/codex fast [on|off|status]` y
  `/codex permissions [default|yolo|status]` cambian el estado por conversación.
- `/codex compact` pide al servidor de aplicaciones de Codex que compacte el hilo adjunto.
- `/codex review` inicia la revisión nativa de Codex para el hilo adjunto.
- `/codex diagnostics [note]` pregunta antes de enviar feedback de Codex para el
  hilo adjunto.
- `/codex account` muestra el estado de cuenta y límite de tasa.
- `/codex mcp` enumera el estado de servidores MCP del servidor de aplicaciones de Codex.
- `/codex skills` enumera las skills del servidor de aplicaciones de Codex.
- `/codex plugins list`, `/codex plugins enable <name>` y
  `/codex plugins disable <name>` administran Plugins nativos configurados de Codex.
- `/codex computer-use [status|install]` administra Codex Computer Use.
- `/codex help` enumera el árbol completo de comandos.

Para la mayoría de los informes de soporte, comience con `/diagnostics [note]` en la
conversación donde ocurrió el error. Crea un informe de diagnósticos de Gateway
y, para sesiones del arnés de Codex, solicita aprobación para enviar el
paquete de feedback de Codex relevante. Consulte
[Exportación de diagnósticos](/es/gateway/diagnostics) para el modelo de privacidad y el comportamiento en chats
grupales. Use `/codex diagnostics [note]` solo cuando específicamente
quiera la carga de feedback de Codex para el hilo adjunto actualmente sin
el paquete completo de diagnósticos de Gateway.

### Inspeccionar hilos de Codex localmente

La forma más rápida de inspeccionar una ejecución incorrecta de Codex suele ser abrir directamente el hilo nativo
de Codex:

```bash
codex resume <thread-id>
```

Obtenga el id de hilo de la respuesta completada de `/diagnostics`, `/codex binding`,
o `/codex threads [filter]`.

Para la mecánica de carga y los límites de diagnósticos a nivel de runtime, consulte
[Runtime del arnés de Codex](/es/plugins/codex-harness-runtime#codex-feedback-upload).

### Orden de autenticación

En el home predeterminado por agente, la autenticación se selecciona en este orden:

1. Perfiles de autenticación de OpenAI ordenados para el agente, preferiblemente bajo
   `auth.order.openai`. Ejecute `openclaw doctor --fix` para migrar ids heredados antiguos
   de perfiles de autenticación de Codex y el orden de autenticación heredado de Codex.
2. La cuenta existente del servidor de aplicaciones en el home de Codex de ese agente.
3. Solo para lanzamientos locales del servidor de aplicaciones stdio, `CODEX_API_KEY`, luego
   `OPENAI_API_KEY`, cuando no hay ninguna cuenta de servidor de aplicaciones presente y la autenticación de OpenAI
   todavía es necesaria.

Cuando OpenClaw ve un perfil de autenticación de Codex de tipo suscripción de ChatGPT, elimina
`CODEX_API_KEY` y `OPENAI_API_KEY` del proceso hijo de Codex generado.
Eso mantiene las claves API a nivel de Gateway disponibles para embeddings o
modelos directos de OpenAI sin hacer que los turnos nativos del servidor de aplicaciones de Codex se facturen
a través de la API por accidente. Los perfiles explícitos con clave API de Codex y el fallback local
con clave de entorno stdio usan el inicio de sesión del servidor de aplicaciones en lugar de env heredado del
proceso hijo. Las conexiones WebSocket al servidor de aplicaciones no reciben fallback de clave API de env
de Gateway; use un perfil de autenticación explícito o la cuenta propia del
servidor de aplicaciones remoto.

Si un perfil de suscripción alcanza un límite de uso de Codex, OpenClaw registra la
hora de reinicio cuando Codex informa una y prueba el siguiente perfil de autenticación ordenado
para la misma ejecución de Codex. Cuando pasa la hora de reinicio, el perfil de suscripción
vuelve a ser elegible sin cambiar el modelo `openai/gpt-*` seleccionado
ni el runtime de Codex.

Cuando los Plugins nativos de Codex están configurados, OpenClaw instala o actualiza
esos Plugins mediante el servidor de aplicaciones conectado antes de exponer las aplicaciones propiedad del Plugin
al hilo de Codex. `app/list` sigue siendo la fuente de verdad para ids de aplicaciones,
accesibilidad y metadatos, pero OpenClaw posee la decisión de habilitación por hilo:
si la política permite una aplicación accesible enumerada, OpenClaw
envía `thread/start.config.apps[appId].enabled = true` incluso cuando `app/list`
informa actualmente que esa aplicación está deshabilitada. Esta ruta no inventa la instalación de aplicaciones
para ids desconocidos; OpenClaw solo activa Plugins del marketplace
con `plugin/install` y luego actualiza el inventario.

### Aislamiento de entorno

Para lanzamientos locales del servidor de aplicaciones stdio, OpenClaw establece `CODEX_HOME` en un
directorio por agente para que la configuración, los archivos de autenticación/cuenta, la caché/datos de Plugin
y el estado de hilos nativos de Codex no lean ni escriban el
`~/.codex` personal del operador de forma predeterminada. OpenClaw conserva el `HOME`
normal del proceso; los subprocesos ejecutados por Codex todavía pueden encontrar configuración y tokens del home de usuario,
y Codex puede descubrir entradas compartidas de `$HOME/.agents/skills` y
`$HOME/.agents/plugins/marketplace.json`. Con
`appServer.homeScope: "user"`, OpenClaw usa en cambio el home nativo de Codex del usuario
y su cuenta existente sin inyectar un perfil de autenticación de OpenClaw.

Si un despliegue necesita aislamiento adicional de entorno, agregue esas
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

`appServer.clearEnv` solo afecta al proceso hijo generado del servidor de aplicaciones de Codex.
OpenClaw elimina `CODEX_HOME` y `HOME` de esta lista durante la
normalización del lanzamiento local: `CODEX_HOME` sigue apuntando al ámbito de
agente o usuario seleccionado, y `HOME` sigue heredado para que los subprocesos puedan usar
el estado normal del home de usuario.

### Herramientas dinámicas y búsqueda web

Las herramientas dinámicas de Codex usan de forma predeterminada la carga `searchable`. OpenClaw no
expone herramientas dinámicas que dupliquen operaciones de espacio de trabajo nativas de Codex:
`read`, `write`, `edit`, `apply_patch`, `exec`, `process`, `update_plan`,
`tool_call`, `tool_describe`, `tool_search` y `tool_search_code`. La mayoría
de las herramientas de integración restantes de OpenClaw, como mensajería, multimedia, cron,
navegador, nodos, Gateway y `heartbeat_respond`, están disponibles mediante
la búsqueda de herramientas de Codex bajo el espacio de nombres `openclaw`, lo que mantiene más pequeño
el contexto inicial del modelo.

La búsqueda web usa de forma predeterminada la herramienta alojada `web_search` de Codex cuando la búsqueda está
habilitada y no se selecciona ningún proveedor administrado. La búsqueda alojada nativa y
la herramienta dinámica `web_search` administrada de OpenClaw son mutuamente excluyentes, de modo que
la búsqueda administrada no puede eludir las restricciones de dominios nativas. OpenClaw usa la
herramienta administrada cuando la búsqueda alojada no está disponible, está deshabilitada explícitamente o
se sustituye por un proveedor administrado seleccionado. OpenClaw mantiene deshabilitada la
extensión independiente `web.run` de Codex porque el tráfico del servidor de aplicaciones de producción rechaza
su espacio de nombres `web` definido por el usuario. `tools.web.search.enabled: false`
deshabilita ambas rutas, al igual que las ejecuciones solo de LLM con herramientas deshabilitadas. Codex trata
`"cached"` como una preferencia y la resuelve como acceso externo en vivo para
turnos de servidor de aplicaciones sin restricciones. La reserva administrada automática falla de forma cerrada cuando
se definen `allowedDomains` nativos para que no se pueda eludir la lista de permitidos.
Los cambios persistentes de la política de búsqueda efectiva rotan el hilo de Codex vinculado
antes del siguiente turno; las restricciones transitorias por turno usan un hilo restringido
temporal y preservan la vinculación existente para reanudar más adelante.

`sessions_yield` y las respuestas de origen solo con herramienta de mensajes permanecen directas porque
son contratos de control de turno. `sessions_spawn` permanece buscable para que
el `spawn_agent` nativo de Codex siga siendo la superficie principal de subagente de Codex,
mientras que la delegación explícita de OpenClaw o ACP sigue disponible mediante el
espacio de nombres de herramientas dinámicas `openclaw`. Las instrucciones de colaboración de Heartbeat
indican a Codex que busque `heartbeat_respond` antes de finalizar un turno de Heartbeat
cuando la herramienta aún no esté cargada.

Configura `codexDynamicToolsLoading: "direct"` solo al conectarte a un servidor de aplicaciones de Codex
personalizado que no pueda buscar herramientas dinámicas diferidas o al
depurar la carga útil completa de herramientas.

### Campos de configuración

Campos de Plugin de Codex de nivel superior admitidos:

| Campo                      | Predeterminado | Significado                                                                                  |
| -------------------------- | -------------- | -------------------------------------------------------------------------------------------- |
| `codexDynamicToolsLoading` | `"searchable"` | Usa `"direct"` para colocar las herramientas dinámicas de OpenClaw directamente en el contexto inicial de herramientas de Codex. |
| `codexDynamicToolsExclude` | `[]`           | Nombres adicionales de herramientas dinámicas de OpenClaw que se deben omitir en los turnos del servidor de aplicaciones de Codex. |
| `codexPlugins`             | deshabilitado  | Soporte nativo de plugins/apps de Codex para plugins seleccionados instalados desde el código fuente migrado.           |

Campos `appServer` admitidos:

| Campo                                         | Predeterminado                                         | Significado                                                                                                                                                                                                                                                                                                                                                                                         |
| --------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                                   | `"stdio"`                                              | `"stdio"` inicia Codex; `"websocket"` se conecta a `url`.                                                                                                                                                                                                                                                                                                                                        |
| `homeScope`                                   | `"agent"`                                              | `"agent"` aísla el estado de Codex por agente de OpenClaw. `"user"` comparte el `$CODEX_HOME` nativo o `~/.codex`, usa la autenticación nativa y habilita la gestión de hilos solo para propietarios. El alcance de usuario requiere stdio.                                                                                                                                                                                               |
| `command`                                     | binario de Codex gestionado                            | Ejecutable para el transporte stdio. Déjalo sin definir para usar el binario gestionado; configúralo solo para una anulación explícita.                                                                                                                                                                                                                                                                                    |
| `args`                                        | `["app-server", "--listen", "stdio://"]`               | Argumentos para el transporte stdio.                                                                                                                                                                                                                                                                                                                                                                  |
| `url`                                         | sin definir                                            | URL del app-server WebSocket.                                                                                                                                                                                                                                                                                                                                                                       |
| `authToken`                                   | sin definir                                            | Token Bearer para el transporte WebSocket. Acepta una cadena literal o SecretInput como `${CODEX_APP_SERVER_TOKEN}`.                                                                                                                                                                                                                                                                              |
| `headers`                                     | `{}`                                                   | Encabezados WebSocket adicionales. Los valores de encabezado aceptan cadenas literales o valores SecretInput, por ejemplo `x-codex-client-session-token: "${CODEX_CLIENT_SESSION_TOKEN}"`.                                                                                                                                                                                                                               |
| `clearEnv`                                    | `[]`                                                   | Nombres de variables de entorno adicionales eliminados del proceso app-server stdio iniciado después de que OpenClaw construye su entorno heredado. OpenClaw conserva el `CODEX_HOME` seleccionado y el `HOME` heredado para lanzamientos locales.                                                                                                                                                                           |
| `codeModeOnly`                                | `false`                                                | Activa la superficie de herramientas de Codex solo para modo código. Las herramientas dinámicas de OpenClaw permanecen registradas con Codex para que las llamadas `tools.*` anidadas vuelvan a través del puente `item/tool/call` del app-server.                                                                                                                                                                                                              |
| `remoteWorkspaceRoot`                         | sin definir                                            | Raíz remota del área de trabajo del app-server de Codex. Cuando se define, OpenClaw infiere la raíz del área de trabajo local a partir del área de trabajo de OpenClaw resuelta, conserva el sufijo del cwd actual bajo esta raíz remota y envía a Codex solo el cwd final del app-server. Si el cwd está fuera de la raíz del área de trabajo de OpenClaw resuelta, OpenClaw falla de forma cerrada en vez de enviar una ruta local del gateway al app-server remoto. |
| `requestTimeoutMs`                            | `60000`                                                | Tiempo de espera para llamadas del plano de control del app-server.                                                                                                                                                                                                                                                                                                                                                     |
| `turnCompletionIdleTimeoutMs`                 | `60000`                                                | Ventana silenciosa después de que Codex acepta un turno o después de una solicitud del app-server con alcance de turno mientras OpenClaw espera `turn/completed`.                                                                                                                                                                                                                                                                    |
| `postToolRawAssistantCompletionIdleTimeoutMs` | `300000`                                               | Guardia de inactividad de finalización y progreso usada después de una transferencia a herramienta, finalización de herramienta nativa, progreso sin procesar del asistente posterior a herramienta, finalización de razonamiento sin procesar o progreso de razonamiento mientras OpenClaw espera `turn/completed`. Usa esto para cargas de trabajo confiables o pesadas en las que la síntesis posterior a herramienta puede permanecer legítimamente silenciosa más tiempo que el presupuesto final de entrega del asistente.                                |
| `mode`                                        | `"yolo"` salvo que los requisitos locales de Codex no permitan YOLO | Preajuste para ejecución YOLO o revisada por guardián. Los requisitos locales de stdio que omiten `danger-full-access`, aprobación `never` o el revisor `user` convierten el valor predeterminado implícito en guardián.                                                                                                                                                                                                           |
| `approvalPolicy`                              | `"never"` o una política de aprobación de guardián permitida       | Política de aprobación nativa de Codex enviada al inicio, reanudación o turno del hilo. Los valores predeterminados de guardián prefieren `"on-request"` cuando está permitido.                                                                                                                                                                                                                                                                            |
| `sandbox`                                     | `"danger-full-access"` o un sandbox de guardián permitido  | Modo sandbox nativo de Codex enviado al inicio o reanudación del hilo. Los valores predeterminados de guardián prefieren `"workspace-write"` cuando está permitido; de lo contrario, `"read-only"`. Cuando un sandbox de OpenClaw está activo, los turnos `danger-full-access` usan `workspace-write` de Codex con acceso de red derivado de la configuración de salida del sandbox de OpenClaw.                                                                                     |
| `approvalsReviewer`                           | `"user"` o un revisor de guardián permitido               | Usa `"auto_review"` para permitir que Codex revise las solicitudes de aprobación nativas cuando esté permitido; de lo contrario, `guardian_subagent` o `user`. `guardian_subagent` sigue siendo un alias heredado.                                                                                                                                                                                                                              |
| `serviceTier`                                 | sin definir                                            | Nivel de servicio opcional del app-server de Codex. `"priority"` habilita el enrutamiento de modo rápido, `"flex"` solicita procesamiento flex, `null` borra la anulación y el valor heredado `"fast"` se acepta como `"priority"`.                                                                                                                                                                                                 |
| `networkProxy`                                | deshabilitado                                          | Activa la red del perfil de permisos de Codex para comandos del app-server. OpenClaw define la configuración `permissions.<profile>.network` seleccionada y la selecciona con `default_permissions` en lugar de enviar `sandbox`.                                                                                                                                                                             |
| `experimental.sandboxExecServer`              | `false`                                                | Activación de vista previa que registra un entorno de Codex respaldado por el sandbox de OpenClaw con Codex app-server 0.132.0 o posterior para que la ejecución nativa de Codex pueda ejecutarse dentro del sandbox activo de OpenClaw.                                                                                                                                                                                                         |

`appServer.networkProxy` es explícito porque cambia el contrato del sandbox de Codex.
Cuando está habilitado, OpenClaw también define `features.network_proxy.enabled`
y `default_permissions` en la configuración del hilo de Codex para que el perfil
de permisos generado pueda iniciar la red gestionada por Codex. De forma predeterminada,
OpenClaw genera un nombre de perfil `openclaw-network-<fingerprint>` resistente
a colisiones a partir del cuerpo del perfil; usa `profileName` solo cuando se
requiere un nombre local estable.

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

Si el runtime normal del servidor de la app sería `danger-full-access`, habilitar
`networkProxy` usa acceso al sistema de archivos de estilo workspace para el perfil
de permisos generado: la aplicación de red administrada por Codex es networking
en sandbox, por lo que un perfil de acceso completo no protegería el tráfico
saliente. Las entradas de dominio usan `allow` o `deny`; las entradas de socket Unix
usan los valores `allow` o `none` de Codex.

### Tiempos de espera dinámicos de llamadas a herramientas

Las llamadas dinámicas a herramientas propiedad de OpenClaw están acotadas de forma
independiente de `appServer.requestTimeoutMs`: las solicitudes `item/tool/call` de
Codex usan de forma predeterminada un watchdog de OpenClaw de 90 segundos. Un
argumento positivo `timeoutMs` por llamada amplía o acorta el presupuesto de esa
herramienta específica, con un límite de 600000 ms. La herramienta `image_generate`
usa `agents.defaults.imageGenerationModel.timeoutMs` cuando la llamada a la
herramienta no proporciona su propio tiempo de espera, o de lo contrario un valor
predeterminado de 120 segundos para generación de imágenes. La herramienta `image`
de comprensión de medios usa `tools.media.image.timeoutSeconds` o su valor
predeterminado de medios de 60 segundos; para la comprensión de imágenes, ese
tiempo de espera se aplica a la solicitud en sí y no se reduce por el trabajo de
preparación anterior. Al agotarse el tiempo de espera, OpenClaw aborta la señal de
la herramienta cuando es compatible y devuelve una respuesta fallida de herramienta
dinámica a Codex para que el turno pueda continuar en lugar de dejar la sesión en
`processing`. Este watchdog es el presupuesto dinámico externo de
`item/tool/call`; los tiempos de espera de solicitudes específicos del proveedor se
ejecutan dentro de esa llamada y conservan su propia semántica de tiempo de espera.

Después de que Codex acepta un turno, y después de que OpenClaw responde a una
solicitud del servidor de la app con alcance de turno, el harness espera que Codex
avance en el turno actual y finalmente termine el turno nativo con
`turn/completed`. Si el servidor de la app permanece en silencio durante
`appServer.turnCompletionIdleTimeoutMs`, OpenClaw interrumpe en la medida de lo
posible el turno de Codex, registra un tiempo de espera diagnóstico y libera el
carril de sesión de OpenClaw para que los mensajes de chat posteriores no queden
encolados detrás de un turno nativo obsoleto. La mayoría de las notificaciones no
terminales para el mismo turno desactivan ese watchdog corto porque Codex ha
demostrado que el turno sigue activo.

Los traspasos de herramientas usan un presupuesto de inactividad posterior a la
herramienta más largo: después de que OpenClaw devuelve una respuesta
`item/tool/call`, después de que elementos de herramientas nativas como
`commandExecution` se completan, después de finalizaciones sin procesar de
`custom_tool_call_output`, y después del progreso sin procesar posterior a la
herramienta del asistente, finalizaciones de razonamiento sin procesar o progreso
de razonamiento. La guarda usa
`appServer.postToolRawAssistantCompletionIdleTimeoutMs` cuando está configurado y,
de lo contrario, toma cinco minutos como valor predeterminado; ese mismo presupuesto
también amplía el watchdog de progreso para la ventana silenciosa de síntesis antes
de que Codex emita el siguiente evento del turno actual. Las notificaciones globales
del servidor de la app, como las actualizaciones de límites de tasa, no reinician el
progreso por inactividad del turno. Las finalizaciones de razonamiento, las
finalizaciones de `agentMessage` de commentary y el progreso sin procesar de
razonamiento o del asistente previo a la herramienta pueden ir seguidos de una
respuesta final automática, por lo que usan la guarda de respuesta posterior al
progreso en lugar de liberar de inmediato el carril de sesión.

Solo los elementos `agentMessage` completados finales/no-commentary y las
finalizaciones sin procesar del asistente previas a la herramienta activan la
liberación de salida del asistente: si Codex queda en silencio sin
`turn/completed`, OpenClaw interrumpe en la medida de lo posible el turno nativo y
libera el carril de sesión. Si otra vigilancia de turno gana esa carrera de
liberación, OpenClaw todavía acepta el elemento final completado del asistente una
vez que ya no quede activa ninguna solicitud nativa, elemento ni finalización de
herramienta dinámica, y la liberación de salida del asistente siga perteneciendo al
último elemento completado, sin ninguna finalización de elemento posterior. Esto
puede preservar la respuesta final después del trabajo de herramientas completado
sin reproducir el turno. Los deltas parciales del asistente, las respuestas
anteriores obsoletas y las finalizaciones posteriores vacías no cumplen los
requisitos.

Los fallos del servidor de la app stdio seguros para reproducción, incluidos los
tiempos de espera de inactividad de finalización de turno sin evidencia de
asistente, herramienta, elemento activo o efecto secundario, se reintentan una vez
en un intento nuevo del servidor de la app. Los tiempos de espera no seguros aún
retiran el cliente del servidor de la app atascado y liberan el carril de sesión de
OpenClaw; también limpian el enlace obsoleto del hilo nativo en lugar de
reproducirse automáticamente. Los tiempos de espera de la vigilancia de finalización
muestran texto de tiempo de espera específico de Codex: los casos seguros para
reproducción dicen que la respuesta puede estar incompleta, mientras que los casos
no seguros indican al usuario que verifique el estado actual antes de volver a
intentarlo. Los diagnósticos públicos de tiempo de espera incluyen campos
estructurales como el último método de notificación del servidor de la app, el
id/tipo/rol del elemento de respuesta sin procesar del asistente, los conteos de
solicitudes/elementos activos y el estado de vigilancia activado; cuando la última
notificación es un elemento de respuesta sin procesar del asistente, también
incluyen una vista previa acotada del texto del asistente. No incluyen contenido sin
procesar de prompts ni herramientas.

### Sobrescrituras del entorno de pruebas local

- `OPENCLAW_CODEX_APP_SERVER_BIN` omite el binario administrado cuando
  `appServer.command` no está definido.
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` se eliminó. Usa
`plugins.entries.codex.config.appServer.mode: "guardian"` en su lugar, o
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` para pruebas locales puntuales. Se
prefiere la configuración para implementaciones repetibles porque mantiene el
comportamiento del plugin en el mismo archivo revisado que el resto de la
configuración del harness de Codex.

## Plugins nativos de Codex

La compatibilidad con plugins nativos de Codex usa las propias capacidades de app y
plugin del servidor de apps de Codex en el mismo hilo de Codex que el turno del
harness de OpenClaw. OpenClaw no traduce los plugins de Codex en herramientas
dinámicas sintéticas `codex_plugin_*` de OpenClaw.

`codexPlugins` afecta solo a sesiones que seleccionan el harness nativo de Codex.
No tiene efecto en ejecuciones del harness integrado, ejecuciones normales del
proveedor de OpenAI, enlaces de conversaciones ACP ni otros harnesses.

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

La configuración de la app del hilo se calcula cuando OpenClaw establece una sesión
del harness de Codex o reemplaza un enlace obsoleto del hilo de Codex; no se vuelve
a calcular en cada turno. Después de cambiar `codexPlugins`, usa `/new`, `/reset` o
reinicia el gateway para que las futuras sesiones del harness de Codex comiencen
con el conjunto actualizado de apps.

Para la elegibilidad de migración, el inventario de apps, la política de acciones
destructivas, las elicitaciones y los diagnósticos de plugins nativos, consulta
[Plugins nativos de Codex](/es/plugins/codex-native-plugins).

El acceso a apps y plugins del lado de OpenAI está controlado por la cuenta de
Codex con sesión iniciada y, para workspaces Business y Enterprise/Edu, por los
controles de apps del workspace. Consulta
[Usar Codex con tu plan de ChatGPT](https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan)
para ver la descripción general de controles de cuenta y workspace de OpenAI.

## Uso de computadora

Uso de computadora tiene su propia guía de configuración:
[Uso de computadora de Codex](/es/plugins/codex-computer-use).

Versión breve: OpenClaw no incorpora como vendor la aplicación de control de escritorio ni ejecuta
acciones de escritorio por sí mismo. Prepara el servidor de aplicaciones de Codex, verifica que el
servidor MCP `computer-use` esté disponible y luego deja que Codex sea dueño de las llamadas a herramientas
MCP nativas durante los turnos en modo Codex.

## Límites de runtime

El arnés de Codex solo cambia el ejecutor de agente integrado de bajo nivel.

- Las herramientas dinámicas de OpenClaw son compatibles. Codex le pide a OpenClaw que ejecute
  esas herramientas, por lo que OpenClaw permanece en la ruta de ejecución.
- Las herramientas nativas de shell, patch, MCP y aplicación de Codex son propiedad de Codex.
  OpenClaw puede observar o bloquear eventos nativos seleccionados mediante el
  relay compatible, pero no reescribe los argumentos de herramientas nativas.
- Codex es dueño de la Compaction nativa. OpenClaw mantiene un espejo de transcripción para
  el historial del canal, búsqueda, `/new`, `/reset` y futuros cambios de modelo o arnés,
  pero no reemplaza la Compaction de Codex con un resumidor de OpenClaw o
  del motor de contexto.
- La generación de medios, la comprensión de medios, TTS, aprobaciones y la salida de herramientas
  de mensajería continúan mediante la configuración correspondiente de proveedor/modelo de OpenClaw.
- `tool_result_persist` se aplica a los resultados de herramientas de transcripción propiedad de OpenClaw,
  no a los registros de resultados de herramientas nativas de Codex.

Para las capas de hooks, superficies V1 compatibles, manejo de permisos nativos, dirección de colas,
mecánicas de carga de feedback de Codex y detalles de Compaction, consulta
[runtime del arnés de Codex](/es/plugins/codex-harness-runtime).

## Solución de problemas

**Codex no aparece como proveedor normal de `/model`:** es lo esperado en configuraciones nuevas.
Selecciona un modelo `openai/gpt-*`, habilita
`plugins.entries.codex.enabled` y comprueba si `plugins.allow` excluye
`codex`.

**OpenClaw usa el arnés integrado en lugar de Codex:** confirma que la referencia del modelo
sea `openai/gpt-*` en el proveedor oficial de OpenAI y que el Plugin de Codex
esté instalado y habilitado. Para una prueba estricta durante las pruebas, establece
`agentRuntime.id: "codex"` en el proveedor o modelo: un runtime de Codex forzado falla
en lugar de recurrir a OpenClaw.

**El runtime de OpenAI Codex recurre a la ruta de clave de API:** recopila un extracto redactado
del Gateway que muestre el modelo, el runtime, el proveedor seleccionado y
el fallo. Pide a los colaboradores afectados que ejecuten este comando de solo lectura en su
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

Los extractos útiles suelen incluir `openai/gpt-5.5` u `openai/gpt-5.4`,
`Runtime: OpenAI Codex`, `agentRuntime.id` o `harnessRuntime`,
`candidateProvider: "openai"` y un resultado `401`, `Incorrect API key` o
`No API key`. Una ejecución corregida debería mostrar la ruta OAuth de OpenAI
en lugar de un fallo simple de clave de API de OpenAI.

**La configuración conserva referencias de modelos Codex heredadas:** ejecuta `openclaw doctor --fix`.
Doctor reescribe las referencias de modelos heredadas a `openai/*`, elimina los pins obsoletos de sesión y
de runtime de agente completo, y conserva las anulaciones existentes de perfiles de autenticación.

**El servidor de aplicaciones es rechazado:** usa el servidor de aplicaciones de Codex `0.125.0` o una versión más reciente.
Las versiones preliminares de la misma versión o con sufijo de compilación, como
`0.125.0-alpha.2` o `0.125.0+custom`, se rechazan porque OpenClaw prueba
el piso del protocolo estable `0.125.0`.

**`/codex status` no puede conectarse:** comprueba que el Plugin `codex` incluido
esté habilitado, que `plugins.allow` lo incluya cuando haya una lista de permitidos
configurada, y que cualquier `appServer.command`, `url`, `authToken` o
encabezado personalizado sea válido.

**El descubrimiento de modelos es lento:** reduce
`plugins.entries.codex.config.discovery.timeoutMs` o deshabilita el descubrimiento.
Consulta [referencia del arnés de Codex](/es/plugins/codex-harness-reference#model-discovery).

**El transporte WebSocket falla inmediatamente:** comprueba `appServer.url`,
`authToken`, los encabezados y que el servidor de aplicaciones remoto hable la misma
versión del protocolo de servidor de aplicaciones de Codex.

**Las herramientas nativas de shell o patch están bloqueadas con `Native hook relay
unavailable`:** el hilo de Codex todavía está intentando usar un id de relay de hook nativo
que OpenClaw ya no tiene registrado. Este es un problema de transporte de hook
nativo de Codex, no un fallo de backend ACP, proveedor, GitHub ni de comando
de shell. Inicia una sesión nueva en el chat afectado con `/new` o `/reset`,
y luego vuelve a intentar un comando inofensivo. Si eso funciona una vez pero
la siguiente llamada de herramienta nativa vuelve a fallar, trata `/new` solo
como una solución temporal: copia el prompt en una sesión nueva después de
reiniciar el app-server de Codex o el Gateway de OpenClaw para que los hilos
antiguos se descarten y los registros de hooks nativos se vuelvan a crear.

**Un modelo que no es de Codex usa el harness integrado:** es lo esperado a menos que la política
del proveedor o del runtime del modelo lo enrute a otro harness. Las refs de
proveedor simples que no son de OpenAI permanecen en su ruta de proveedor normal
en modo `auto`.

**Computer Use está instalado pero las herramientas no se ejecutan:** comprueba
`/codex computer-use status` desde una sesión nueva. Si una herramienta informa
`Native hook relay unavailable`, usa la recuperación del relay de hook nativo anterior.
Consulta [Codex Computer Use](/es/plugins/codex-computer-use#troubleshooting).

## Relacionado

- [Referencia del harness de Codex](/es/plugins/codex-harness-reference)
- [Runtime del harness de Codex](/es/plugins/codex-harness-runtime)
- [Plugins nativos de Codex](/es/plugins/codex-native-plugins)
- [Codex Computer Use](/es/plugins/codex-computer-use)
- [Runtimes de agentes](/es/concepts/agent-runtimes)
- [Proveedores de modelos](/es/concepts/model-providers)
- [Proveedor OpenAI](/es/providers/openai)
- [Ayuda de OpenAI Codex](https://help.openai.com/en/collections/14937394-codex)
- [Plugins de harness de agente](/es/plugins/sdk-agent-harness)
- [Hooks de Plugin](/es/plugins/hooks)
- [Exportación de diagnósticos](/es/gateway/diagnostics)
- [Status](/es/cli/status)
- [Pruebas](/es/help/testing-live#live-codex-app-server-harness-smoke)
