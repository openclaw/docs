---
read_when:
    - Quieres usar el arnés app-server de Codex incluido
    - Necesitas ejemplos de configuración del arnés de Codex
    - Quieres que las implementaciones solo con Codex fallen en lugar de recurrir a OpenClaw
summary: Ejecuta turnos de agente integrado de OpenClaw mediante el arnés de servidor de aplicación de Codex incluido
title: Arnés de Codex
x-i18n:
    generated_at: "2026-06-30T13:48:51Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1569dca11b6d5a870c2dde58d04046df7829e70a5c59f34b25cf79b209c530e5
    source_path: plugins/codex-harness.md
    workflow: 16
---

El Plugin `codex` incluido permite que OpenClaw ejecute turnos de agente de OpenAI integrados
mediante Codex app-server en lugar del arnés integrado de OpenClaw.

Usa el arnés de Codex cuando quieras que Codex sea responsable de la sesión de agente de bajo nivel:
reanudación nativa de hilos, continuación nativa de herramientas, Compaction nativa y
ejecución de app-server. OpenClaw sigue siendo responsable de los canales de chat, los archivos de sesión, la selección de modelos,
las herramientas dinámicas de OpenClaw, las aprobaciones, la entrega de medios y el espejo visible
de la transcripción.

La configuración normal usa referencias de modelo canónicas de OpenAI como `openai/gpt-5.5`.
No configures referencias GPT heredadas de Codex. Coloca el orden de autenticación de agentes de OpenAI
en `auth.order.openai`; los ids de perfiles de autenticación heredados de Codex y
las entradas heredadas de orden de autenticación de Codex son estado heredado reparado por
`openclaw doctor --fix`.

Cuando no hay un sandbox de OpenClaw activo, OpenClaw inicia hilos de Codex app-server
con el modo de código nativo de Codex habilitado, mientras deja desactivado de forma predeterminada el modo exclusivo de código.
Eso mantiene disponibles el espacio de trabajo nativo y las capacidades de código de Codex, mientras
las herramientas dinámicas de OpenClaw siguen pasando por el puente `item/tool/call` de app-server.
El sandbox activo de OpenClaw y las políticas de herramientas restringidas deshabilitan por completo el modo de código nativo,
a menos que optes por la ruta experimental del exec-server de sandbox.

Esta característica nativa de Codex es independiente de
[modo de código de OpenClaw](/es/reference/code-mode), que es un runtime QuickJS-WASI opcional
para ejecuciones genéricas de OpenClaw con una forma de entrada `exec` diferente.

Para la división más amplia de modelo/proveedor/runtime, empieza con
[Runtimes de agente](/es/concepts/agent-runtimes). La versión breve es:
`openai/gpt-5.5` es la referencia de modelo, `codex` es el runtime, y Telegram,
Discord, Slack u otro canal sigue siendo la superficie de comunicación.

## Requisitos

- OpenClaw con el Plugin `codex` incluido disponible.
- Si tu configuración usa `plugins.allow`, incluye `codex`.
- Codex app-server `0.125.0` o más reciente. El Plugin incluido gestiona de forma predeterminada
  un binario de Codex app-server compatible, por lo que los comandos locales `codex` en `PATH` no
  afectan al arranque normal del arnés.
- Autenticación de Codex disponible mediante `openclaw models auth login --provider openai`,
  una cuenta de app-server en el inicio de Codex del agente, o un perfil de autenticación explícito
  con clave de API de Codex.

Para la precedencia de autenticación, el aislamiento de entorno, comandos personalizados de app-server, descubrimiento de modelos
y todos los campos de configuración, consulta
[Referencia del arnés de Codex](/es/plugins/codex-harness-reference).

## Inicio rápido

La mayoría de los usuarios que quieren Codex en OpenClaw quieren esta ruta: iniciar sesión con una
suscripción de ChatGPT/Codex, habilitar el Plugin `codex` incluido y usar una
referencia de modelo canónica `openai/gpt-*`.

Inicia sesión con OAuth de Codex:

```bash
openclaw models auth login --provider openai
```

Habilita el Plugin `codex` incluido y selecciona un modelo de agente de OpenAI:

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

Reinicia el gateway después de cambiar la configuración de plugins. Si un chat existente ya
tiene una sesión, usa `/new` o `/reset` antes de probar cambios de runtime para que el siguiente
turno resuelva el arnés desde la configuración actual.

## Configuración

La configuración de inicio rápido es la configuración mínima viable del arnés de Codex. Define las opciones
del arnés de Codex en la configuración de OpenClaw y usa la CLI solo para la autenticación de Codex:

| Necesidad                                             | Configurar                                                                       | Dónde                              |
| ----------------------------------------------------- | -------------------------------------------------------------------------------- | ---------------------------------- |
| Habilitar el arnés                                    | `plugins.entries.codex.enabled: true`                                            | Configuración de OpenClaw          |
| Mantener una instalación de Plugin en lista permitida | Incluir `codex` en `plugins.allow`                                               | Configuración de OpenClaw          |
| Enrutar turnos de agente de OpenAI mediante Codex     | `agents.defaults.model` o `agents.list[].model` como `openai/gpt-*`              | Configuración de agente OpenClaw   |
| Iniciar sesión con OAuth de ChatGPT/Codex             | `openclaw models auth login --provider openai`                                   | Perfil de autenticación de CLI     |
| Añadir respaldo con clave de API para ejecuciones de Codex | Perfil de clave de API `openai:*` listado después de la autenticación de suscripción en `auth.order.openai` | Perfil de autenticación de CLI + configuración de OpenClaw |
| Fallar de forma cerrada cuando Codex no esté disponible | `agentRuntime.id: "codex"` de proveedor o modelo                                 | Configuración de modelo/proveedor de OpenClaw |
| Usar tráfico directo de la API de OpenAI              | `agentRuntime.id: "openclaw"` de proveedor o modelo con autenticación normal de OpenAI | Configuración de modelo/proveedor de OpenClaw |
| Ajustar el comportamiento de app-server               | `plugins.entries.codex.config.appServer.*`                                       | Configuración del Plugin Codex     |
| Habilitar apps nativas de Plugin de Codex             | `plugins.entries.codex.config.codexPlugins.*`                                    | Configuración del Plugin Codex     |
| Habilitar Codex Computer Use                          | `plugins.entries.codex.config.computerUse.*`                                     | Configuración del Plugin Codex     |

Usa referencias de modelo `openai/gpt-*` para turnos de agente de OpenAI respaldados por Codex. Prefiere
`auth.order.openai` para el orden suscripción primero/respaldo con clave de API. Los ids de perfiles de autenticación
heredados de Codex existentes y el orden de autenticación heredado de Codex son estado heredado solo para doctor;
no escribas nuevas referencias GPT heredadas de Codex.

No establezcas `compaction.model` ni `compaction.provider` en agentes respaldados por Codex.
Codex compacta mediante su estado de hilo nativo de app-server, por lo que OpenClaw ignora
esas sustituciones locales del resumidor en runtime y `openclaw doctor --fix` las elimina
cuando el agente usa Codex.

Lossless sigue siendo compatible como motor de contexto para ensamblaje, ingesta y
mantenimiento alrededor de turnos de Codex. Configúralo mediante
`plugins.slots.contextEngine: "lossless-claw"` y
`plugins.entries.lossless-claw.config.summaryModel`, no mediante
`agents.defaults.compaction.provider`. `openclaw doctor --fix` migra la forma antigua
`compaction.provider: "lossless-claw"` al slot de motor de contexto Lossless
cuando Codex es el runtime activo, pero Codex nativo sigue siendo responsable de la Compaction.

El arnés nativo de Codex app-server admite motores de contexto que requieren
ensamblaje previo al prompt. Los backends genéricos de CLI, incluido `codex-cli`, no proporcionan
esa capacidad del host.

Para agentes respaldados por Codex, `/compact` inicia la Compaction nativa de Codex app-server en
el hilo vinculado. OpenClaw no espera a que termine, no impone un tiempo de espera de OpenClaw,
no reinicia el app-server compartido ni recurre a un motor de contexto o
resumidor público de OpenAI. Si la vinculación del hilo nativo de Codex falta o
está obsoleta, el comando falla de forma cerrada para que el operador vea el límite real del runtime
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

Con esa forma, ambos perfiles siguen ejecutándose mediante Codex para turnos de agente
`openai/gpt-*`. La clave de API es solo un respaldo de autenticación, no una solicitud para cambiar a OpenClaw o
a OpenAI Responses plano.

El resto de esta página cubre variantes comunes entre las que los usuarios deben elegir:
forma de despliegue, enrutamiento con fallo cerrado, política de aprobación guardiana, plugins nativos de Codex
y Computer Use. Para listas completas de opciones, valores predeterminados, enums, descubrimiento,
aislamiento de entorno, tiempos de espera y campos de transporte de app-server, consulta
[Referencia del arnés de Codex](/es/plugins/codex-harness-reference).

## Verificar el runtime de Codex

Usa `/status` en el chat donde esperas Codex. Un turno de agente de OpenAI respaldado por Codex
muestra:

```text
Runtime: OpenAI Codex
```

Luego comprueba el estado de Codex app-server:

```text
/codex status
/codex models
```

`/codex status` informa conectividad de app-server, cuenta, límites de tasa, servidores MCP
y Skills. `/codex models` lista el catálogo en vivo de Codex app-server para
el arnés y la cuenta. Si `/status` sorprende, consulta
[Solución de problemas](#troubleshooting).

## Enrutamiento y selección de modelo

Mantén separadas las referencias de proveedor y la política de runtime:

- Usa `openai/gpt-*` para turnos de agente de OpenAI mediante Codex.
- No uses referencias GPT heredadas de Codex en la configuración. Ejecuta `openclaw doctor --fix` para
  reparar referencias heredadas y pins de ruta de sesión obsoletos.
- `agentRuntime.id: "codex"` es opcional para el modo automático normal de OpenAI, pero resulta útil
  cuando un despliegue debe fallar de forma cerrada si Codex no está disponible.
- `agentRuntime.id: "openclaw"` opta un proveedor o modelo al runtime
  integrado de OpenClaw cuando eso es intencional.
- `/codex ...` controla conversaciones nativas de Codex app-server desde el chat.
- ACP/acpx es una ruta de arnés externo separada. Úsala solo cuando el usuario pida
  ACP/acpx o un adaptador de arnés externo.

Enrutamiento de comandos común:

| Intención del usuario                                  | Usar                                                                                                  |
| ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------- |
| Adjuntar el chat actual                                | `/codex bind [--cwd <path>]`                                                                          |
| Reanudar un hilo existente de Codex                    | `/codex resume <thread-id>`                                                                           |
| Listar o filtrar hilos de Codex                        | `/codex threads [filter]`                                                                             |
| Listar plugins nativos de Codex                        | `/codex plugins list`                                                                                 |
| Habilitar o deshabilitar un Plugin nativo de Codex configurado | `/codex plugins enable <name>`, `/codex plugins disable <name>`                                       |
| Adjuntar una sesión existente de Codex CLI en un nodo emparejado | `/codex sessions --host <node> [filter]`, luego `/codex resume <session-id> --host <node> --bind here` |
| Enviar solo comentarios de Codex                       | `/codex diagnostics [note]`                                                                           |
| Iniciar una tarea ACP/acpx                             | Comandos de sesión ACP/acpx, no `/codex`                                                              |

| Caso de uso                                          | Configurar                                                             | Verificar                               | Notas                                 |
| ---------------------------------------------------- | ---------------------------------------------------------------------- | --------------------------------------- | ------------------------------------- |
| Suscripción ChatGPT/Codex con runtime nativo de Codex | `openai/gpt-*` más el plugin `codex` habilitado                        | `/status` muestra `Runtime: OpenAI Codex` | Ruta recomendada                      |
| Fallar de forma cerrada si Codex no está disponible  | Proveedor o modelo `agentRuntime.id: "codex"`                          | El turno falla en lugar de usar el fallback integrado | Úselo para despliegues solo de Codex  |
| Tráfico directo con clave API de OpenAI mediante OpenClaw | Proveedor o modelo `agentRuntime.id: "openclaw"` y autenticación normal de OpenAI | `/status` muestra el runtime de OpenClaw | Úselo solo cuando OpenClaw sea intencional |
| Configuración heredada                               | referencias GPT de Codex heredadas                                     | `openclaw doctor --fix` la reescribe    | No escriba configuración nueva de esta forma |
| Adaptador ACP/acpx de Codex                          | ACP `sessions_spawn({ runtime: "acp" })`                               | Estado de tarea/sesión de ACP           | Separado del arnés nativo de Codex    |

`agents.defaults.imageModel` sigue la misma división por prefijos. Use `openai/gpt-*`
para la ruta normal de OpenAI y `codex/gpt-*` solo cuando la comprensión de imágenes
deba ejecutarse mediante un turno acotado del servidor de aplicación de Codex. No use
referencias GPT de Codex heredadas; doctor reescribe ese prefijo heredado a `openai/gpt-*`.

## Patrones de despliegue

### Despliegue básico de Codex

Use la configuración de inicio rápido cuando todos los turnos de agentes de OpenAI deban usar Codex de forma
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

Esta forma mantiene Claude como agente predeterminado y añade un agente Codex con nombre:

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

Con esta configuración, el agente `main` usa su ruta de proveedor normal y el
agente `codex` usa el servidor de aplicación de Codex.

### Despliegue de Codex con fallo cerrado

Para turnos de agentes de OpenAI, `openai/gpt-*` ya se resuelve a Codex cuando el
plugin incluido está disponible. Añada una política de runtime explícita cuando quiera una regla
escrita de fallo cerrado:

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

Con Codex forzado, OpenClaw falla temprano si el plugin de Codex está deshabilitado, el
servidor de aplicación es demasiado antiguo o el servidor de aplicación no puede iniciarse.

## Política del servidor de aplicación

De forma predeterminada, el plugin inicia localmente el binario de Codex administrado por OpenClaw con transporte
stdio. Configure `appServer.command` solo cuando quiera ejecutar intencionalmente un
ejecutable diferente. Use transporte WebSocket solo cuando ya haya un servidor de aplicación
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

Las sesiones locales del servidor de aplicación stdio usan de forma predeterminada la postura de operador local confiable:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` y
`sandbox: "danger-full-access"`. Si los requisitos locales de Codex no permiten esa
postura YOLO implícita, OpenClaw selecciona permisos guardian permitidos en su lugar.
Cuando un sandbox de OpenClaw está activo para la sesión, OpenClaw deshabilita el
Code Mode nativo de Codex, los servidores MCP del usuario y la ejecución de plugins respaldados por aplicaciones para ese
turno, en lugar de depender del sandboxing del lado del host de Codex. El acceso a shell se expone
mediante herramientas dinámicas respaldadas por el sandbox de OpenClaw, como `sandbox_exec` y
`sandbox_process`, cuando las herramientas normales de exec/proceso están disponibles.

Use el modo exec normalizado de OpenClaw cuando quiera la revisión automática nativa de Codex antes de
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

Para sesiones del servidor de aplicación de Codex, OpenClaw asigna `tools.exec.mode: "auto"` a aprobaciones
revisadas por Guardian de Codex, normalmente
`approvalPolicy: "on-request"`, `approvalsReviewer: "auto_review"` y
`sandbox: "workspace-write"` cuando los requisitos locales permiten esos valores.
En `tools.exec.mode: "auto"`, OpenClaw no conserva sobrescrituras heredadas inseguras de Codex
`approvalPolicy: "never"` ni `sandbox: "danger-full-access"`; use
`tools.exec.mode: "full"` para una postura intencional de Codex sin aprobación. El
preajuste heredado `plugins.entries.codex.config.appServer.mode: "guardian"` todavía
funciona, pero `tools.exec.mode: "auto"` es la superficie normalizada de OpenClaw.

Para la comparación a nivel de modo con aprobaciones de exec del host y permisos ACPX,
consulte [Modos de permisos](/es/tools/permission-modes).

Para cada campo del servidor de aplicación, orden de autenticación, aislamiento de entorno, descubrimiento y
comportamiento de timeout, consulte [Referencia del arnés de Codex](/es/plugins/codex-harness-reference).

## Comandos y diagnósticos

El plugin incluido registra `/codex` como un comando slash en cualquier canal que
admita comandos de texto de OpenClaw.

La ejecución y el control nativos requieren un propietario o un cliente Gateway `operator.admin`.
Esto incluye vincular o reanudar hilos, enviar o detener turnos,
cambiar el modelo, el modo rápido o el estado de permisos, compactar o revisar, y
desvincular una asociación. Otros remitentes autorizados conservan comandos de solo lectura para estado, ayuda,
cuenta, modelo, hilo, servidor MCP, skill e inspección de vinculaciones.

Formas comunes:

- `/codex status` comprueba la conectividad del servidor de aplicación, modelos, cuenta, límites de tasa,
  servidores MCP y skills.
- `/codex models` lista los modelos activos del servidor de aplicación de Codex.
- `/codex threads [filter]` lista hilos recientes del servidor de aplicación de Codex.
- `/codex resume <thread-id>` adjunta la sesión actual de OpenClaw a un
  hilo de Codex existente.
- `/codex compact` pide al servidor de aplicación de Codex que compacte el hilo adjunto.
- `/codex review` inicia la revisión nativa de Codex para el hilo adjunto.
- `/codex diagnostics [note]` pregunta antes de enviar comentarios de Codex para el
  hilo adjunto.
- `/codex account` muestra el estado de cuenta y límites de tasa.
- `/codex mcp` lista el estado de servidores MCP del servidor de aplicación de Codex.
- `/codex skills` lista las skills del servidor de aplicación de Codex.

Para la mayoría de informes de soporte, empiece con `/diagnostics [note]` en la conversación
donde ocurrió el error. Crea un informe de diagnóstico de Gateway y, para sesiones del
arnés de Codex, solicita aprobación para enviar el paquete de comentarios de Codex correspondiente.
Consulte [Exportación de diagnósticos](/es/gateway/diagnostics) para el modelo de privacidad y el comportamiento en
chats grupales.

Use `/codex diagnostics [note]` solo cuando quiera específicamente la carga de comentarios de Codex
para el hilo actualmente adjunto sin el paquete completo de diagnósticos de Gateway.

### Inspeccionar hilos de Codex localmente

La forma más rápida de inspeccionar una ejecución incorrecta de Codex suele ser abrir directamente el hilo
nativo de Codex:

```bash
codex resume <thread-id>
```

Obtenga el id del hilo desde la respuesta completada de `/diagnostics`, `/codex binding` o
`/codex threads [filter]`.

Para la mecánica de carga y los límites de diagnóstico a nivel de runtime, consulte
[Runtime del arnés de Codex](/es/plugins/codex-harness-runtime#codex-feedback-upload).

La autenticación se selecciona en este orden:

1. Perfiles de autenticación de OpenAI ordenados para el agente, preferiblemente bajo
   `auth.order.openai`. Ejecute `openclaw doctor --fix` para migrar ids de perfiles de autenticación
   heredados de Codex y orden de autenticación heredado de Codex.
2. La cuenta existente del servidor de aplicación en el home de Codex de ese agente.
3. Solo para lanzamientos locales del servidor de aplicación stdio, `CODEX_API_KEY`, luego
   `OPENAI_API_KEY`, cuando no haya cuenta de servidor de aplicación presente y la autenticación de OpenAI
   todavía sea necesaria.

Cuando OpenClaw detecta un perfil de autenticación de Codex de estilo suscripción de ChatGPT, elimina
`CODEX_API_KEY` y `OPENAI_API_KEY` del proceso hijo de Codex generado. Eso
mantiene las claves API a nivel de Gateway disponibles para embeddings o modelos directos de OpenAI
sin hacer que los turnos nativos del servidor de aplicación de Codex se facturen por accidente mediante la API.
Los perfiles explícitos de clave API de Codex y el fallback de clave de entorno stdio local usan el inicio de sesión
del servidor de aplicación en lugar de env heredado del proceso hijo. Las conexiones WebSocket al servidor de aplicación
no reciben fallback de clave API de env de Gateway; use un perfil de autenticación explícito o la
cuenta propia del servidor de aplicación remoto.
Cuando se configuran plugins nativos de Codex, OpenClaw instala o actualiza esos
plugins mediante el servidor de aplicación conectado antes de exponer aplicaciones propiedad del plugin al
hilo de Codex. `app/list` sigue siendo la fuente de verdad para ids de aplicaciones,
accesibilidad y metadatos, pero OpenClaw posee la decisión de habilitación por hilo:
si la política permite una aplicación accesible listada, OpenClaw envía
`thread/start.config.apps[appId].enabled = true` incluso cuando `app/list` actualmente
informa que esa aplicación está deshabilitada. Esta ruta no inventa instalación de aplicaciones para
ids desconocidos; OpenClaw solo activa plugins del marketplace con `plugin/install`
y luego actualiza el inventario.

Si un perfil de suscripción alcanza un límite de uso de Codex, OpenClaw registra el tiempo de restablecimiento
cuando Codex informa uno e intenta el siguiente perfil de autenticación ordenado para la misma
ejecución de Codex. Cuando pasa el tiempo de restablecimiento, el perfil de suscripción vuelve a ser elegible
sin cambiar el modelo `openai/gpt-*` seleccionado ni el runtime de Codex.

Para lanzamientos locales del servidor de aplicación stdio, OpenClaw configura `CODEX_HOME` en un directorio
por agente para que la configuración de Codex, los archivos de autenticación/cuenta, la caché/datos de plugins y el estado
nativo de hilos no lean ni escriban el `~/.codex` personal del operador de forma
predeterminada. OpenClaw conserva el `HOME` normal del proceso; los subprocesos ejecutados por Codex
todavía pueden encontrar configuración y tokens del home de usuario, y Codex puede descubrir entradas compartidas de
`$HOME/.agents/skills` y `$HOME/.agents/plugins/marketplace.json`.

Si un despliegue necesita aislamiento adicional de entorno, añada esas variables a
`appServer.clearEnv`:

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

`appServer.clearEnv` solo afecta al proceso hijo del servidor de aplicación de Codex generado.
OpenClaw elimina `CODEX_HOME` y `HOME` de esta lista durante la normalización del lanzamiento local:
`CODEX_HOME` se mantiene por agente y `HOME` permanece heredado para que
los subprocesos puedan usar el estado normal del home de usuario.

Las herramientas dinámicas de Codex usan la carga `searchable` de forma predeterminada. OpenClaw no expone
herramientas dinámicas que dupliquen las operaciones de espacio de trabajo nativas de Codex: `read`, `write`,
`edit`, `apply_patch`, `exec`, `process` y `update_plan`. La mayoría de las herramientas de integración
restantes de OpenClaw, como mensajería, medios, Cron, navegador, nodos,
Gateway y `heartbeat_respond`, están disponibles mediante la búsqueda de herramientas de Codex bajo
el espacio de nombres `openclaw`, lo que mantiene más pequeño el contexto inicial del modelo. La búsqueda web
usa de forma predeterminada la herramienta alojada `web_search` de Codex cuando la búsqueda está habilitada y no
se ha seleccionado ningún proveedor administrado. La búsqueda alojada nativa y la herramienta dinámica administrada
`web_search` de OpenClaw son mutuamente excluyentes, de modo que la búsqueda administrada no pueda eludir
las restricciones de dominio nativas. OpenClaw usa la herramienta administrada cuando la búsqueda alojada no está
disponible, está deshabilitada explícitamente o se reemplaza por un proveedor administrado seleccionado.
OpenClaw mantiene deshabilitada la extensión independiente `web.run` de Codex porque
el tráfico del servidor de aplicaciones de producción rechaza su espacio de nombres `web` definido por el usuario.
`tools.web.search.enabled: false` deshabilita ambas rutas, al igual que las ejecuciones solo con LLM
con herramientas deshabilitadas. Codex trata `"cached"` como una preferencia y la resuelve como acceso externo
en vivo para turnos sin restricciones del servidor de aplicaciones. La alternativa administrada automática
falla de forma cerrada cuando se establecen `allowedDomains` nativos, de modo que no se pueda eludir la lista de permitidos.
Los cambios persistentes de la política de búsqueda efectiva rotan el hilo de Codex vinculado
antes del siguiente turno. Las restricciones transitorias por turno usan un hilo restringido temporal
y preservan la vinculación existente para reanudar más adelante.
`sessions_yield` y las respuestas de origen solo con herramientas de mensaje permanecen directas porque
son contratos de control de turno. `sessions_spawn` permanece como buscable para que `spawn_agent`
nativo de Codex siga siendo la superficie principal de subagentes de Codex, mientras que la delegación explícita
de OpenClaw o ACP sigue estando disponible mediante el espacio de nombres de herramientas dinámicas `openclaw`.
Las instrucciones de colaboración de Heartbeat indican a Codex que busque
`heartbeat_respond` antes de finalizar un turno de Heartbeat cuando la herramienta aún no está
cargada.

Establece `codexDynamicToolsLoading: "direct"` solo al conectarte a un servidor de aplicaciones de Codex
personalizado que no pueda buscar herramientas dinámicas diferidas o al depurar la carga útil completa
de herramientas.

Campos de Plugin de Codex de nivel superior admitidos:

| Campo                      | Valor predeterminado | Significado                                                                                  |
| -------------------------- | -------------------- | -------------------------------------------------------------------------------------------- |
| `codexDynamicToolsLoading` | `"searchable"`       | Usa `"direct"` para colocar las herramientas dinámicas de OpenClaw directamente en el contexto inicial de herramientas de Codex. |
| `codexDynamicToolsExclude` | `[]`                 | Nombres adicionales de herramientas dinámicas de OpenClaw que se deben omitir en los turnos del servidor de aplicaciones de Codex. |
| `codexPlugins`             | deshabilitado        | Soporte nativo de plugins/aplicaciones de Codex para plugins seleccionados instalados desde código fuente y migrados.           |

Campos `appServer` admitidos:

| Campo                                         | Predeterminado                                         | Significado                                                                                                                                                                                                                                                                                                                                                                                     |
| --------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                                   | `"stdio"`                                              | `"stdio"` inicia Codex; `"websocket"` se conecta a `url`.                                                                                                                                                                                                                                                                                                                                       |
| `command`                                     | binario de Codex gestionado                            | Ejecutable para el transporte stdio. Déjalo sin definir para usar el binario gestionado; defínelo solo para una anulación explícita.                                                                                                                                                                                                                                                            |
| `args`                                        | `["app-server", "--listen", "stdio://"]`               | Argumentos para el transporte stdio.                                                                                                                                                                                                                                                                                                                                                            |
| `url`                                         | sin definir                                            | URL del app-server WebSocket.                                                                                                                                                                                                                                                                                                                                                                   |
| `authToken`                                   | sin definir                                            | Token Bearer para el transporte WebSocket. Acepta una cadena literal o SecretInput como `${CODEX_APP_SERVER_TOKEN}`.                                                                                                                                                                                                                                                                            |
| `headers`                                     | `{}`                                                   | Encabezados WebSocket adicionales. Los valores de encabezado aceptan cadenas literales o valores SecretInput, por ejemplo `x-codex-client-session-token: "${CODEX_CLIENT_SESSION_TOKEN}"`.                                                                                                                                                                                                      |
| `clearEnv`                                    | `[]`                                                   | Nombres de variables de entorno adicionales que se eliminan del proceso app-server stdio iniciado después de que OpenClaw construye su entorno heredado. OpenClaw conserva el `CODEX_HOME` por agente y el `HOME` heredado para los lanzamientos locales.                                                                                                                                       |
| `codeModeOnly`                                | `false`                                                | Opta por la superficie de herramientas de solo modo de código de Codex. Las herramientas dinámicas de OpenClaw permanecen registradas con Codex para que las llamadas `tools.*` anidadas regresen a través del puente `item/tool/call` del app-server.                                                                                                                                           |
| `remoteWorkspaceRoot`                         | sin definir                                            | Raíz remota del espacio de trabajo del app-server de Codex. Cuando se define, OpenClaw infiere la raíz local del espacio de trabajo a partir del espacio de trabajo de OpenClaw resuelto, preserva el sufijo del cwd actual bajo esta raíz remota y envía solo el cwd final del app-server a Codex. Si el cwd está fuera de la raíz del espacio de trabajo de OpenClaw resuelta, OpenClaw falla de forma cerrada en lugar de enviar una ruta local del Gateway al app-server remoto. |
| `requestTimeoutMs`                            | `60000`                                                | Tiempo de espera para llamadas del plano de control del app-server.                                                                                                                                                                                                                                                                                                                             |
| `turnCompletionIdleTimeoutMs`                 | `60000`                                                | Ventana de inactividad después de que Codex acepta un turno o después de una solicitud del app-server con alcance de turno mientras OpenClaw espera `turn/completed`.                                                                                                                                                                                                                            |
| `postToolRawAssistantCompletionIdleTimeoutMs` | `300000`                                               | Guardia de inactividad de finalización y progreso usada después de una entrega de herramienta, finalización de herramienta nativa, progreso bruto del asistente posterior a herramienta, finalización de razonamiento bruto o progreso de razonamiento mientras OpenClaw espera `turn/completed`. Usa esto para cargas de trabajo confiables o pesadas en las que la síntesis posterior a herramienta puede permanecer legítimamente en silencio más tiempo que el presupuesto final de entrega del asistente. |
| `mode`                                        | `"yolo"` salvo que los requisitos locales de Codex no permitan YOLO | Preajuste para ejecución YOLO o revisada por guardian. Los requisitos locales de stdio que omiten `danger-full-access`, aprobación `never` o el revisor `user` hacen que el valor predeterminado implícito sea guardian.                                                                                                                                                                          |
| `approvalPolicy`                              | `"never"` o una política de aprobación guardian permitida | Política de aprobación nativa de Codex enviada al iniciar/reanudar un hilo/turno. Los valores predeterminados de guardian prefieren `"on-request"` cuando está permitido.                                                                                                                                                                                                                       |
| `sandbox`                                     | `"danger-full-access"` o un sandbox guardian permitido | Modo de sandbox nativo de Codex enviado al iniciar/reanudar un hilo. Los valores predeterminados de guardian prefieren `"workspace-write"` cuando está permitido; de lo contrario, `"read-only"`. Cuando un sandbox de OpenClaw está activo, los turnos `danger-full-access` usan `workspace-write` de Codex con acceso de red derivado de la configuración de salida del sandbox de OpenClaw.       |
| `approvalsReviewer`                           | `"user"` o un revisor guardian permitido               | Usa `"auto_review"` para permitir que Codex revise las solicitudes de aprobación nativas cuando esté permitido; de lo contrario, `guardian_subagent` o `user`. `guardian_subagent` sigue siendo un alias heredado.                                                                                                                                                                                |
| `serviceTier`                                 | sin definir                                            | Nivel de servicio opcional del app-server de Codex. `"priority"` habilita el enrutamiento de modo rápido, `"flex"` solicita procesamiento flex, `null` borra la anulación y el valor heredado `"fast"` se acepta como `"priority"`.                                                                                                                                                            |
| `networkProxy`                                | deshabilitado                                          | Opta por la red de perfil de permisos de Codex para comandos del app-server. OpenClaw define la configuración `permissions.<profile>.network` seleccionada y la selecciona con `default_permissions` en lugar de enviar `sandbox`.                                                                                                                                                              |
| `experimental.sandboxExecServer`              | `false`                                                | Opción preliminar que registra un entorno de Codex respaldado por el sandbox de OpenClaw con Codex app-server 0.132.0 o posterior para que la ejecución nativa de Codex pueda ejecutarse dentro del sandbox activo de OpenClaw.                                                                                                                                                                  |

`appServer.networkProxy` es explícito porque cambia el contrato del sandbox de Codex. Cuando está habilitado, OpenClaw también define `features.network_proxy.enabled` y
`default_permissions` en la configuración del hilo de Codex para que el perfil
de permisos generado pueda iniciar la red gestionada por Codex. De forma predeterminada, OpenClaw genera un nombre de perfil resistente a colisiones
`openclaw-network-<fingerprint>` a partir del cuerpo del perfil; usa `profileName` solo cuando se requiere un nombre local estable.

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

Si el runtime normal del app-server fuera `danger-full-access`, habilitar
`networkProxy` usa acceso al sistema de archivos de estilo workspace para el
perfil de permisos generado. La aplicación de red gestionada por Codex es red en sandbox,
por lo que un perfil de acceso completo no protegería el tráfico saliente.
Las entradas de dominio usan `allow` o `deny`; las entradas de sockets Unix usan los valores de Codex
`allow` o `none`.

Las llamadas dinámicas a herramientas propiedad de OpenClaw están acotadas de forma independiente de
`appServer.requestTimeoutMs`: las solicitudes `item/tool/call` de Codex usan un vigilante de
OpenClaw de 90 segundos de forma predeterminada. Un argumento `timeoutMs` positivo por llamada amplía
o acorta ese presupuesto de herramienta específico. La herramienta `image_generate` usa
`agents.defaults.imageGenerationModel.timeoutMs` cuando la llamada a la herramienta no
proporciona su propio tiempo de espera, o un valor predeterminado de generación de imágenes de 120 segundos en caso contrario.
La herramienta `image` de comprensión multimedia usa
`tools.media.image.timeoutSeconds` o su valor predeterminado multimedia de 60 segundos. Para la
comprensión de imágenes, ese tiempo de espera se aplica a la solicitud en sí y no se
reduce por el trabajo de preparación anterior. Los presupuestos de herramientas dinámicas tienen
un límite de 600000 ms. Al agotarse el tiempo de espera, OpenClaw aborta la señal de la herramienta
cuando es compatible y devuelve una respuesta fallida de herramienta dinámica a Codex para que el turno
pueda continuar en lugar de dejar la sesión en `processing`.
Este vigilante es el presupuesto dinámico externo de `item/tool/call`; los tiempos de espera
de solicitudes específicos del proveedor se ejecutan dentro de esa llamada y conservan su propia semántica de tiempo de espera.

Después de que Codex acepta un turno, y después de que OpenClaw responde a una solicitud
de app-server con alcance de turno, el arnés espera que Codex avance en el turno actual y
finalmente termine el turno nativo con `turn/completed`. Si el app-server queda
en silencio durante `appServer.turnCompletionIdleTimeoutMs`, OpenClaw intenta con el mejor esfuerzo
interrumpir el turno de Codex, registra un tiempo de espera de diagnóstico y libera el carril de sesión
de OpenClaw para que los mensajes de chat de seguimiento no queden en cola detrás de un turno nativo
obsoleto. La mayoría de las notificaciones no terminales del mismo turno desarman ese vigilante corto
porque Codex ha demostrado que el turno sigue activo. Las transferencias de herramientas usan un
presupuesto de inactividad posterior a herramienta más largo: después de que OpenClaw devuelve una respuesta
`item/tool/call`, después de que se completan elementos de herramientas nativas como `commandExecution`,
después de finalizaciones sin procesar de `custom_tool_call_output`, y después de progreso sin procesar
del asistente posterior a herramienta, finalizaciones de razonamiento o progreso de razonamiento. La protección usa
`appServer.postToolRawAssistantCompletionIdleTimeoutMs` cuando está configurado y
de forma predeterminada usa cinco minutos en caso contrario. Ese mismo presupuesto posterior a herramienta también amplía el
vigilante de progreso para la ventana de síntesis silenciosa antes de que Codex emita el siguiente
evento del turno actual. Las notificaciones globales del app-server, como las actualizaciones de límite de tasa,
no reinician el progreso de inactividad del turno. Las finalizaciones de razonamiento, las finalizaciones
`agentMessage` de comentario y el progreso sin procesar de razonamiento o asistente previo a herramienta pueden
ir seguidos de una respuesta final automática, por lo que usan la protección de respuesta posterior al progreso
en lugar de liberar el carril de sesión de inmediato. Solo los elementos `agentMessage`
finalizados finales/sin comentario y las finalizaciones sin procesar del asistente previas a herramienta
arman la liberación por salida del asistente: si Codex luego queda en silencio
sin `turn/completed`, OpenClaw intenta con el mejor esfuerzo interrumpir el turno nativo y
libera el carril de sesión. Los fallos de app-server stdio seguros para reproducción, incluidos
los tiempos de espera de finalización de turno sin evidencia de asistente, herramienta, elemento activo o
efecto secundario, se reintentan una vez en un nuevo intento de app-server. Los
tiempos de espera inseguros aun así retiran el cliente app-server bloqueado y liberan el carril de sesión
de OpenClaw. También borran la vinculación obsoleta del hilo nativo en lugar de
reproducirse automáticamente. Los tiempos de espera de vigilancia de finalización muestran texto de tiempo de espera
específico de Codex: los casos seguros para reproducción dicen que la respuesta puede estar incompleta, mientras que los casos inseguros
indican al usuario que verifique el estado actual antes de reintentar. Los diagnósticos públicos de tiempo de espera
incluyen campos estructurales como el último método de notificación del app-server,
el id/tipo/rol del elemento de respuesta sin procesar del asistente, los recuentos de solicitudes/elementos activos y el estado
de vigilancia armado. Cuando la última notificación es un elemento de respuesta sin procesar del asistente, también
incluyen una vista previa acotada del texto del asistente. No incluyen el contenido sin procesar del prompt ni
de la herramienta.

Las sobrescrituras de entorno siguen disponibles para pruebas locales:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN` omite el binario administrado cuando
`appServer.command` no está definido.

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` se eliminó. Usa
`plugins.entries.codex.config.appServer.mode: "guardian"` en su lugar, o
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` para pruebas locales puntuales. Se
prefiere la configuración para despliegues repetibles porque mantiene el comportamiento del Plugin en el
mismo archivo revisado que el resto de la configuración del arnés de Codex.

## Plugins nativos de Codex

La compatibilidad con Plugins nativos de Codex usa las capacidades propias de app y Plugin
del app-server de Codex en el mismo hilo de Codex que el turno del arnés de OpenClaw. OpenClaw
no traduce los Plugins de Codex a herramientas dinámicas sintéticas de OpenClaw
`codex_plugin_*`.

`codexPlugins` afecta solo a las sesiones que seleccionan el arnés nativo de Codex. No
tiene efecto en ejecuciones del arnés integrado, ejecuciones normales del proveedor OpenAI, vinculaciones de conversación
ACP ni otros arneses.

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

La configuración de app de hilo se calcula cuando OpenClaw establece una sesión del arnés de Codex
o reemplaza una vinculación obsoleta de hilo de Codex. No se vuelve a calcular en cada turno.
Después de cambiar `codexPlugins`, usa `/new`, `/reset` o reinicia el Gateway para que
las futuras sesiones del arnés de Codex comiencen con el conjunto de apps actualizado.

Para la elegibilidad de migración, el inventario de apps, la política de acciones destructivas,
las elicitaciones y los diagnósticos de Plugins nativos, consulta
[Plugins nativos de Codex](/es/plugins/codex-native-plugins).

El acceso a apps y Plugins del lado de OpenAI lo controla la cuenta de Codex con sesión iniciada
y, para espacios de trabajo Business y Enterprise/Edu, los controles de apps del espacio de trabajo. Consulta
[Usar Codex con tu plan de ChatGPT](https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan)
para ver la descripción general de OpenAI sobre cuentas y controles de espacio de trabajo.

## Uso de computadora

El uso de computadora se trata en su propia guía de configuración:
[Uso de computadora con Codex](/es/plugins/codex-computer-use).

La versión breve: OpenClaw no incorpora la app de control de escritorio ni ejecuta
acciones de escritorio por sí mismo. Prepara el app-server de Codex, verifica que el servidor MCP
`computer-use` esté disponible y luego deja que Codex sea propietario de las llamadas a herramientas MCP
nativas durante los turnos en modo Codex.

## Límites del runtime

El arnés de Codex cambia solo el ejecutor de agente integrado de bajo nivel.

- Las herramientas dinámicas de OpenClaw son compatibles. Codex pide a OpenClaw que ejecute esas
  herramientas, por lo que OpenClaw permanece en la ruta de ejecución.
- Codex es propietario de las herramientas nativas de shell, parches, MCP y apps nativas.
  OpenClaw puede observar o bloquear eventos nativos seleccionados mediante el relay compatible,
  pero no reescribe los argumentos de herramientas nativas.
- Codex es propietario de la Compaction nativa. OpenClaw mantiene un espejo de transcripción para el historial
  del canal, búsqueda, `/new`, `/reset` y futuros cambios de modelo o arnés, pero
  no reemplaza la Compaction de Codex con un resumidor de OpenClaw o del motor de contexto.
- La generación multimedia, la comprensión multimedia, TTS, las aprobaciones y la salida de herramientas de mensajería
  continúan a través de la configuración correspondiente de proveedor/modelo de OpenClaw.
- `tool_result_persist` se aplica a los resultados de herramientas de transcripción propiedad de OpenClaw, no a
  los registros de resultados de herramientas nativas de Codex.

Para capas de hooks, superficies V1 compatibles, gestión nativa de permisos, dirección de colas,
mecánica de subida de comentarios de Codex y detalles de Compaction, consulta
[Runtime del arnés de Codex](/es/plugins/codex-harness-runtime).

## Solución de problemas

**Codex no aparece como un proveedor `/model` normal:** eso es lo esperado para
configuraciones nuevas. Selecciona un modelo `openai/gpt-*`, habilita
`plugins.entries.codex.enabled` y comprueba si `plugins.allow` excluye
`codex`.

**OpenClaw usa el arnés integrado en lugar de Codex:** asegúrate de que la referencia de modelo sea
`openai/gpt-*` en el proveedor oficial de OpenAI y de que el Plugin de Codex esté
instalado y habilitado. Si necesitas prueba estricta durante las pruebas, define en el proveedor o
modelo `agentRuntime.id: "codex"`. Un runtime de Codex forzado falla en lugar de
volver a OpenClaw.

**El runtime de OpenAI Codex vuelve a la ruta de clave de API:** recopila un extracto redactado
del Gateway que muestre el modelo, el runtime, el proveedor seleccionado y el fallo.
Pide a los colaboradores afectados que ejecuten este comando de solo lectura en su host de OpenClaw:

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

Los extractos útiles normalmente incluyen `openai/gpt-5.5` u `openai/gpt-5.4`,
`Runtime: OpenAI Codex`, `agentRuntime.id` o `harnessRuntime`,
`candidateProvider: "openai"`, y un resultado `401`, `Incorrect API key` o
`No API key`. Una ejecución corregida debería mostrar la ruta OAuth de OpenAI
en lugar de un fallo de clave de API simple de OpenAI.

**Permanece la configuración de referencias de modelo heredadas de Codex:** ejecuta `openclaw doctor --fix`.
Doctor reescribe las referencias de modelos heredadas a `openai/*`, elimina anclajes obsoletos de sesión y
runtime de agente completo, y conserva las sobrescrituras existentes de perfil de autenticación.

**El app-server se rechaza:** usa Codex app-server `0.125.0` o posterior.
Las versiones preliminares de la misma versión o las versiones con sufijo de compilación, como
`0.125.0-alpha.2` o `0.125.0+custom`, se rechazan porque OpenClaw prueba el
mínimo estable del protocolo `0.125.0`.

**`/codex status` no puede conectarse:** comprueba que el Plugin `codex` incluido esté
habilitado, que `plugins.allow` lo incluya cuando haya una lista de permitidos configurada, y
que cualquier `appServer.command`, `url`, `authToken` o encabezado personalizado sea válido.

**El descubrimiento de modelos es lento:** reduce
`plugins.entries.codex.config.discovery.timeoutMs` o deshabilita el descubrimiento. Consulta
[Referencia del arnés de Codex](/es/plugins/codex-harness-reference#model-discovery).

**El transporte WebSocket falla de inmediato:** comprueba `appServer.url`, `authToken`,
los encabezados y que el app-server remoto hable la misma versión del protocolo de app-server
de Codex.

**Las herramientas nativas de shell o parches se bloquean con `Native hook relay unavailable`:**
el hilo de Codex sigue intentando usar un id de relay de hook nativo que OpenClaw ya no
tiene registrado. Este es un problema de transporte de hook nativo de Codex, no un fallo de backend
ACP, proveedor, GitHub ni comando de shell. Inicia una sesión nueva en
el chat afectado con `/new` o `/reset`, luego reintenta un comando inocuo. Si eso
funciona una vez pero la siguiente llamada a herramienta nativa vuelve a fallar, trata `/new` como una solución temporal
solamente: copia el prompt en una sesión nueva después de reiniciar el app-server de Codex
o el Gateway de OpenClaw para que los hilos antiguos se descarten y los registros de hooks nativos
se vuelvan a crear.

**Un modelo que no es Codex usa el arnés integrado:** eso es lo esperado a menos que
la política de runtime del proveedor o modelo lo dirija a otro arnés. Las referencias simples de proveedores que no son OpenAI
permanecen en su ruta de proveedor normal en modo `auto`.

**Computer Use está instalado pero las herramientas no se ejecutan:** comprueba
`/codex computer-use status` desde una sesión nueva. Si una herramienta informa
`Native hook relay unavailable`, usa la recuperación del relé de hooks nativos anterior. Consulta
[Codex Computer Use](/es/plugins/codex-computer-use#troubleshooting).

## Relacionado

- [Referencia del arnés de Codex](/es/plugins/codex-harness-reference)
- [Runtime del arnés de Codex](/es/plugins/codex-harness-runtime)
- [Plugins nativos de Codex](/es/plugins/codex-native-plugins)
- [Codex Computer Use](/es/plugins/codex-computer-use)
- [Runtimes de agentes](/es/concepts/agent-runtimes)
- [Proveedores de modelos](/es/concepts/model-providers)
- [Proveedor de OpenAI](/es/providers/openai)
- [Ayuda de OpenAI Codex](https://help.openai.com/en/collections/14937394-codex)
- [Plugins de arnés de agente](/es/plugins/sdk-agent-harness)
- [Hooks de Plugin](/es/plugins/hooks)
- [Exportación de diagnósticos](/es/gateway/diagnostics)
- [Estado](/es/cli/status)
- [Pruebas](/es/help/testing-live#live-codex-app-server-harness-smoke)
