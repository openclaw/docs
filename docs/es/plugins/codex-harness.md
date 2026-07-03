---
read_when:
    - Quieres usar el arnés de servidor de aplicaciones de Codex incluido
    - Necesitas ejemplos de configuración del arnés Codex
    - Quieres que las implementaciones solo con Codex fallen en lugar de recurrir a OpenClaw
summary: Ejecuta turnos de agentes integrados de OpenClaw mediante el harness de servidor de aplicaciones Codex incluido
title: Arnés de Codex
x-i18n:
    generated_at: "2026-07-03T13:16:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 589aed06678207b3349c17dd1997c2d17abd5f4b8747fc18fd858b5a03a2d003
    source_path: plugins/codex-harness.md
    workflow: 16
---

El Plugin `codex` incluido permite que OpenClaw ejecute turnos de agente de OpenAI integrados
a través de Codex app-server en lugar del arnés integrado de OpenClaw.

Usa el arnés de Codex cuando quieras que Codex sea dueño de la sesión de agente de bajo nivel:
reanudación nativa de hilos, continuación nativa de herramientas, compaction nativa y
ejecución en app-server. OpenClaw sigue siendo dueño de los canales de chat, los archivos de sesión, la selección de modelo, las herramientas dinámicas de OpenClaw, las aprobaciones, la entrega de medios y el espejo visible de la transcripción.

La configuración normal usa referencias canónicas de modelos de OpenAI como `openai/gpt-5.5`.
No configures referencias GPT heredadas de Codex. Coloca el orden de autenticación de agentes de OpenAI
bajo `auth.order.openai`; los identificadores de perfiles de autenticación heredados de Codex más antiguos y
las entradas heredadas de orden de autenticación de Codex son estado heredado reparado por
`openclaw doctor --fix`.

Cuando no hay ningún sandbox de OpenClaw activo, OpenClaw inicia hilos de Codex app-server
con el modo de código nativo de Codex habilitado, dejando desactivado de forma predeterminada el modo solo código.
Eso mantiene disponibles el espacio de trabajo nativo y las capacidades de código de Codex mientras
las herramientas dinámicas de OpenClaw continúan a través del puente `item/tool/call` de app-server.
El sandboxing activo de OpenClaw y las políticas de herramientas restringidas deshabilitan por completo el modo de código nativo
a menos que optes por la ruta experimental de exec-server de sandbox.

Esta función nativa de Codex es independiente de
[modo de código de OpenClaw](/es/reference/code-mode), que es un runtime QuickJS-WASI opcional
para ejecuciones genéricas de OpenClaw con una forma de entrada `exec` diferente.

Para la separación más amplia entre modelo/proveedor/runtime, empieza con
[Runtime de agentes](/es/concepts/agent-runtimes). La versión breve es:
`openai/gpt-5.5` es la referencia de modelo, `codex` es el runtime, y Telegram,
Discord, Slack u otro canal sigue siendo la superficie de comunicación.

## Requisitos

- OpenClaw con el Plugin `codex` incluido disponible.
- Si tu configuración usa `plugins.allow`, incluye `codex`.
- Codex app-server `0.125.0` o posterior. El Plugin incluido gestiona de forma predeterminada un binario compatible de Codex app-server, por lo que los comandos locales `codex` en `PATH` no afectan al inicio normal del arnés.
- Autenticación de Codex disponible mediante `openclaw models auth login --provider openai`,
  una cuenta de app-server en el directorio de inicio de Codex del agente, o un perfil explícito de autenticación de clave API de Codex.

Para la precedencia de autenticación, aislamiento del entorno, comandos personalizados de app-server, descubrimiento de modelos y todos los campos de configuración, consulta
[Referencia del arnés de Codex](/es/plugins/codex-harness-reference).

## Inicio rápido

La mayoría de los usuarios que quieren Codex en OpenClaw quieren esta ruta: iniciar sesión con una
suscripción de ChatGPT/Codex, habilitar el Plugin `codex` incluido y usar una
referencia canónica de modelo `openai/gpt-*`.

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

Reinicia el Gateway después de cambiar la configuración de plugins. Si un chat existente ya
tiene una sesión, usa `/new` o `/reset` antes de probar cambios de runtime para que el siguiente
turno resuelva el arnés desde la configuración actual.

## Configuración

La configuración de inicio rápido es la configuración mínima viable del arnés de Codex. Define las opciones del arnés de Codex en la configuración de OpenClaw y usa la CLI solo para la autenticación de Codex:

| Necesidad                              | Define                                                                           | Dónde                              |
| -------------------------------------- | -------------------------------------------------------------------------------- | ---------------------------------- |
| Habilitar el arnés                     | `plugins.entries.codex.enabled: true`                                            | Configuración de OpenClaw          |
| Mantener una instalación de Plugin en lista de permitidos | Incluir `codex` en `plugins.allow`                                               | Configuración de OpenClaw          |
| Enrutar turnos de agente de OpenAI a través de Codex | `agents.defaults.model` o `agents.list[].model` como `openai/gpt-*`              | Configuración de agente de OpenClaw |
| Iniciar sesión con OAuth de ChatGPT/Codex | `openclaw models auth login --provider openai`                                   | Perfil de autenticación de CLI     |
| Añadir respaldo de clave API para ejecuciones de Codex | Perfil de clave API `openai:*` listado después de la autenticación por suscripción en `auth.order.openai` | Perfil de autenticación de CLI + configuración de OpenClaw |
| Fallar de forma cerrada cuando Codex no esté disponible | `agentRuntime.id: "codex"` de proveedor o modelo                                 | Configuración de modelo/proveedor de OpenClaw |
| Usar tráfico directo de la API de OpenAI | `agentRuntime.id: "openclaw"` de proveedor o modelo con autenticación normal de OpenAI | Configuración de modelo/proveedor de OpenClaw |
| Ajustar el comportamiento de app-server | `plugins.entries.codex.config.appServer.*`                                       | Configuración del Plugin de Codex  |
| Habilitar apps nativas de Plugin de Codex | `plugins.entries.codex.config.codexPlugins.*`                                    | Configuración del Plugin de Codex  |
| Habilitar Computer Use de Codex        | `plugins.entries.codex.config.computerUse.*`                                     | Configuración del Plugin de Codex  |

Usa referencias de modelo `openai/gpt-*` para turnos de agente de OpenAI respaldados por Codex. Prefiere
`auth.order.openai` para un orden de suscripción primero y clave API como respaldo. Los identificadores de perfiles de autenticación heredados de Codex existentes y el orden de autenticación heredado de Codex son
estado heredado solo para doctor; no escribas nuevas referencias GPT heredadas de Codex.

No definas `compaction.model` ni `compaction.provider` en agentes respaldados por Codex.
Codex compacta mediante su estado de hilo nativo de app-server, por lo que OpenClaw ignora
esas anulaciones locales del resumidor en runtime y `openclaw doctor --fix` las elimina
cuando el agente usa Codex.

Lossless sigue siendo compatible como motor de contexto para ensamblaje, ingesta y
mantenimiento alrededor de los turnos de Codex. Configúralo mediante
`plugins.slots.contextEngine: "lossless-claw"` y
`plugins.entries.lossless-claw.config.summaryModel`, no mediante
`agents.defaults.compaction.provider`. `openclaw doctor --fix` migra la forma antigua
`compaction.provider: "lossless-claw"` al slot de motor de contexto Lossless
cuando Codex es el runtime activo, pero Codex nativo sigue siendo dueño de Compaction.

El arnés nativo de Codex app-server admite motores de contexto que requieren
ensamblaje previo al prompt. Los backends genéricos de CLI, incluido `codex-cli`, no proporcionan
esa capacidad de host.

Para agentes respaldados por Codex, `/compact` inicia la Compaction nativa de Codex app-server en
el hilo vinculado. OpenClaw no espera a que termine, no impone un timeout de OpenClaw,
no reinicia el app-server compartido ni recurre a un motor de contexto o
resumidor público de OpenAI. Si el enlace nativo del hilo de Codex falta o
está obsoleto, el comando falla de forma cerrada para que el operador vea el límite real del runtime
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

En esa forma, ambos perfiles siguen ejecutándose a través de Codex para turnos de agente
`openai/gpt-*`. La clave API es solo un respaldo de autenticación, no una solicitud para cambiar a OpenClaw o
Responses de OpenAI simples.

El resto de esta página cubre variantes comunes entre las que los usuarios deben elegir:
forma de despliegue, enrutamiento con fallo cerrado, política de aprobación guardiana, plugins nativos de Codex y Computer Use. Para listas completas de opciones, valores predeterminados, enums, descubrimiento,
aislamiento de entorno, timeouts y campos de transporte de app-server, consulta
[Referencia del arnés de Codex](/es/plugins/codex-harness-reference).

## Verificar el runtime de Codex

Usa `/status` en el chat donde esperas Codex. Un turno de agente de OpenAI respaldado por Codex
muestra:

```text
Runtime: OpenAI Codex
```

Luego revisa el estado de Codex app-server:

```text
/codex status
/codex models
```

`/codex status` informa sobre conectividad de app-server, cuenta, límites de tasa, servidores MCP
y Skills. `/codex models` lista el catálogo en vivo de Codex app-server para
el arnés y la cuenta. Si `/status` es sorprendente, consulta
[Solución de problemas](#troubleshooting).

## Enrutamiento y selección de modelo

Mantén separadas las referencias de proveedor y la política de runtime:

- Usa `openai/gpt-*` para turnos de agente de OpenAI a través de Codex.
- No uses referencias GPT heredadas de Codex en la configuración. Ejecuta `openclaw doctor --fix` para
  reparar referencias heredadas y pines de ruta de sesión obsoletos.
- `agentRuntime.id: "codex"` es opcional para el modo automático normal de OpenAI, pero resulta útil
  cuando un despliegue debe fallar de forma cerrada si Codex no está disponible.
- `agentRuntime.id: "openclaw"` opta un proveedor o modelo al runtime
  integrado de OpenClaw cuando eso es intencional.
- `/codex ...` controla conversaciones nativas de Codex app-server desde el chat.
- ACP/acpx es una ruta de arnés externo independiente. Úsala solo cuando el usuario pida
  ACP/acpx o un adaptador de arnés externo.

Enrutamiento de comandos común:

| Intención del usuario                                | Usar                                                                                                  |
| ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Adjuntar el chat actual                              | `/codex bind [--cwd <path>]`                                                                          |
| Reanudar un hilo de Codex existente                  | `/codex resume <thread-id>`                                                                           |
| Listar o filtrar hilos de Codex                      | `/codex threads [filter]`                                                                             |
| Listar plugins nativos de Codex                      | `/codex plugins list`                                                                                 |
| Habilitar o deshabilitar un Plugin nativo de Codex configurado | `/codex plugins enable <name>`, `/codex plugins disable <name>`                                       |
| Adjuntar una sesión de Codex CLI existente en un nodo emparejado | `/codex sessions --host <node> [filter]`, luego `/codex resume <session-id> --host <node> --bind here` |
| Enviar solo comentarios de Codex                     | `/codex diagnostics [note]`                                                                           |
| Iniciar una tarea ACP/acpx                           | Comandos de sesión ACP/acpx, no `/codex`                                                              |

| Caso de uso                                          | Configurar                                                            | Verificar                                    | Notas                                  |
| ---------------------------------------------------- | ---------------------------------------------------------------------- | ------------------------------------------- | -------------------------------------- |
| Suscripción a ChatGPT/Codex con runtime nativo de Codex | `openai/gpt-*` más el Plugin `codex` habilitado                        | `/status` muestra `Runtime: OpenAI Codex`   | Ruta recomendada                       |
| Fallar de forma cerrada si Codex no está disponible  | Proveedor o modelo `agentRuntime.id: "codex"`                          | El turno falla en lugar de usar fallback integrado | Úselo para despliegues solo de Codex   |
| Tráfico directo con clave de API de OpenAI a través de OpenClaw | Proveedor o modelo `agentRuntime.id: "openclaw"` y autenticación normal de OpenAI | `/status` muestra el runtime de OpenClaw    | Úselo solo cuando OpenClaw sea intencional |
| Configuración heredada                               | referencias GPT heredadas de Codex                                     | `openclaw doctor --fix` la reescribe        | No escriba nueva configuración de esta forma |
| Adaptador ACP/acpx de Codex                          | ACP `sessions_spawn({ runtime: "acp" })`                               | Estado de tarea/sesión de ACP               | Separado del harness nativo de Codex   |

`agents.defaults.imageModel` sigue la misma división por prefijos. Use `openai/gpt-*`
para la ruta normal de OpenAI y `codex/gpt-*` solo cuando la comprensión de imágenes
deba ejecutarse mediante un turno acotado del servidor de aplicación de Codex. No use
referencias GPT heredadas de Codex; doctor reescribe ese prefijo heredado a `openai/gpt-*`.

## Patrones de despliegue

### Despliegue básico de Codex

Use la configuración de inicio rápido cuando todos los turnos de agente de OpenAI deban usar Codex de forma
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

### Despliegue con proveedor mixto

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

Con esta configuración, el agente `main` usa su ruta de proveedor normal y el
agente `codex` usa el servidor de aplicación de Codex.

### Despliegue de Codex con fallo cerrado

Para los turnos de agente de OpenAI, `openai/gpt-*` ya se resuelve a Codex cuando el
Plugin incluido está disponible. Agregue una política de runtime explícita cuando quiera una regla escrita
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

Con Codex forzado, OpenClaw falla de forma temprana si el Plugin de Codex está deshabilitado, el
servidor de aplicación es demasiado antiguo o el servidor de aplicación no puede iniciarse.

## Política del servidor de aplicación

De forma predeterminada, el Plugin inicia localmente el binario de Codex administrado por OpenClaw con transporte
stdio. Configure `appServer.command` solo cuando intencionalmente quiera ejecutar un
ejecutable distinto. Use transporte WebSocket solo cuando ya se esté ejecutando un servidor de aplicación
en otro lugar:

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

Las sesiones locales del servidor de aplicación stdio usan de forma predeterminada la postura de operador local de confianza:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` y
`sandbox: "danger-full-access"`. Si los requisitos locales de Codex no permiten esa
postura YOLO implícita, OpenClaw selecciona permisos guardian permitidos en su lugar.
Cuando un sandbox de OpenClaw está activo para la sesión, OpenClaw deshabilita Code Mode
nativo de Codex, servidores MCP de usuario y ejecución de Plugin respaldada por aplicaciones para ese
turno en lugar de depender del sandboxing del lado del host de Codex. El acceso a la shell se expone
mediante herramientas dinámicas respaldadas por el sandbox de OpenClaw, como `sandbox_exec` y
`sandbox_process`, cuando las herramientas normales de ejecución/proceso están disponibles.

Use el modo de ejecución normalizado de OpenClaw cuando quiera la revisión automática nativa de Codex antes de
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
`tools.exec.mode: "full"` para una postura de Codex intencional sin aprobación. El
preset heredado `plugins.entries.codex.config.appServer.mode: "guardian"` todavía
funciona, pero `tools.exec.mode: "auto"` es la superficie normalizada de OpenClaw.

Para la comparación a nivel de modo con aprobaciones de ejecución del host y permisos ACPX,
consulte [Modos de permisos](/es/tools/permission-modes).

Para todos los campos del servidor de aplicación, el orden de autenticación, el aislamiento de entorno, la detección y el
comportamiento de timeout, consulte [Referencia del harness de Codex](/es/plugins/codex-harness-reference).

## Comandos y diagnósticos

El Plugin incluido registra `/codex` como comando de barra en cualquier canal que
admita comandos de texto de OpenClaw.

La ejecución y el control nativos requieren un propietario o un cliente Gateway `operator.admin`.
Esto incluye vincular o reanudar hilos, enviar o detener turnos,
cambiar el modelo, el modo rápido o el estado de permisos, compactar o revisar, y
desvincular una asociación. Otros remitentes autorizados conservan comandos de solo lectura de estado, ayuda,
cuenta, modelo, hilo, servidor MCP, skill e inspección de vinculaciones.

Formas comunes:

- `/codex status` comprueba conectividad del servidor de aplicación, modelos, cuenta, límites de uso,
  servidores MCP y skills.
- `/codex models` lista modelos activos del servidor de aplicación de Codex.
- `/codex threads [filter]` lista hilos recientes del servidor de aplicación de Codex.
- `/codex resume <thread-id>` adjunta la sesión actual de OpenClaw a un
  hilo existente de Codex.
- `/codex compact` solicita al servidor de aplicación de Codex que compacte el hilo adjunto.
- `/codex review` inicia la revisión nativa de Codex para el hilo adjunto.
- `/codex diagnostics [note]` pregunta antes de enviar comentarios de Codex para el
  hilo adjunto.
- `/codex account` muestra el estado de cuenta y límites de uso.
- `/codex mcp` lista el estado de servidores MCP del servidor de aplicación de Codex.
- `/codex skills` lista las skills del servidor de aplicación de Codex.

Para la mayoría de los informes de soporte, empiece con `/diagnostics [note]` en la conversación
donde ocurrió el error. Crea un informe de diagnósticos de Gateway y, para sesiones del
harness de Codex, solicita aprobación para enviar el paquete de comentarios relevante de Codex.
Consulte [Exportación de diagnósticos](/es/gateway/diagnostics) para el modelo de privacidad y el comportamiento
en chats grupales.

Use `/codex diagnostics [note]` solo cuando quiera específicamente la carga de comentarios de Codex
para el hilo adjunto actualmente sin el paquete completo de diagnósticos de Gateway.

### Inspeccionar hilos de Codex localmente

La forma más rápida de inspeccionar una ejecución defectuosa de Codex suele ser abrir directamente el hilo nativo
de Codex:

```bash
codex resume <thread-id>
```

Obtenga el id del hilo de la respuesta completada de `/diagnostics`, `/codex binding` o
`/codex threads [filter]`.

Para la mecánica de carga y los límites de diagnóstico a nivel de runtime, consulte
[Runtime del harness de Codex](/es/plugins/codex-harness-runtime#codex-feedback-upload).

La autenticación se selecciona en este orden:

1. Perfiles de autenticación de OpenAI ordenados para el agente, preferentemente bajo
   `auth.order.openai`. Ejecute `openclaw doctor --fix` para migrar ids de perfil de autenticación
   heredados de Codex y el orden de autenticación heredado de Codex.
2. La cuenta existente del servidor de aplicación en el home de Codex de ese agente.
3. Solo para lanzamientos locales del servidor de aplicación stdio, `CODEX_API_KEY`, luego
   `OPENAI_API_KEY`, cuando no hay cuenta del servidor de aplicación presente y la autenticación de OpenAI
   sigue siendo necesaria.

Cuando OpenClaw ve un perfil de autenticación de Codex de estilo suscripción a ChatGPT, elimina
`CODEX_API_KEY` y `OPENAI_API_KEY` del proceso hijo de Codex generado. Eso
mantiene disponibles las claves de API a nivel de Gateway para embeddings o modelos directos de OpenAI
sin hacer que los turnos nativos del servidor de aplicación de Codex se facturen accidentalmente mediante la API.
Los perfiles explícitos de clave de API de Codex y el fallback local de clave de entorno stdio usan inicio de sesión del servidor de aplicación
en lugar de env heredado del proceso hijo. Las conexiones WebSocket al servidor de aplicación
no reciben fallback de clave de API env de Gateway; use un perfil de autenticación explícito o la
cuenta propia del servidor de aplicación remoto.
Cuando se configuran Plugins nativos de Codex, OpenClaw instala o actualiza esos
plugins mediante el servidor de aplicación conectado antes de exponer aplicaciones propiedad del Plugin al
hilo de Codex. `app/list` sigue siendo la fuente de verdad para ids de aplicación,
accesibilidad y metadatos, pero OpenClaw posee la decisión de habilitación por hilo:
si la política permite una aplicación accesible listada, OpenClaw envía
`thread/start.config.apps[appId].enabled = true` incluso cuando `app/list` actualmente
informa que esa aplicación está deshabilitada. Esta ruta no inventa instalaciones de aplicaciones para
ids desconocidos; OpenClaw solo activa plugins de marketplace con `plugin/install`
y luego actualiza el inventario.

Si un perfil de suscripción alcanza un límite de uso de Codex, OpenClaw registra la hora de restablecimiento
cuando Codex informa una e intenta el siguiente perfil de autenticación ordenado para la misma
ejecución de Codex. Cuando pasa la hora de restablecimiento, el perfil de suscripción vuelve a ser elegible
sin cambiar el modelo `openai/gpt-*` seleccionado ni el runtime de Codex.

Para lanzamientos locales del servidor de aplicación stdio, OpenClaw establece `CODEX_HOME` en un directorio
por agente para que la configuración de Codex, los archivos de autenticación/cuenta, la caché/datos de plugins y el estado
nativo de hilos no lean ni escriban el `~/.codex` personal del operador de forma
predeterminada. OpenClaw conserva el `HOME` normal del proceso; los subprocesos ejecutados por Codex
todavía pueden encontrar configuración y tokens del home del usuario, y Codex puede detectar entradas compartidas de
`$HOME/.agents/skills` y `$HOME/.agents/plugins/marketplace.json`.

Si un despliegue necesita aislamiento de entorno adicional, agregue esas variables a
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
`CODEX_HOME` permanece por agente y `HOME` permanece heredado para que
los subprocesos puedan usar el estado normal del home del usuario.

Las herramientas dinámicas de Codex usan la carga `searchable` de forma predeterminada. OpenClaw no expone
herramientas dinámicas que dupliquen operaciones nativas de Codex sobre el espacio de trabajo: `read`, `write`,
`edit`, `apply_patch`, `exec`, `process` y `update_plan`. La mayoría de las integraciones restantes
de OpenClaw, como mensajería, medios, cron, navegador, nodos,
gateway y `heartbeat_respond`, están disponibles mediante la búsqueda de herramientas de Codex bajo
el namespace `openclaw`, lo que mantiene más pequeño el contexto inicial del modelo. La búsqueda web
usa la herramienta alojada `web_search` de Codex de forma predeterminada cuando la búsqueda está habilitada y no
se ha seleccionado ningún proveedor gestionado. La búsqueda alojada nativa y la herramienta dinámica
`web_search` gestionada de OpenClaw son mutuamente excluyentes, de modo que la búsqueda gestionada no puede eludir
las restricciones de dominio nativas. OpenClaw usa la herramienta gestionada cuando la búsqueda alojada no está
disponible, está deshabilitada explícitamente o se reemplaza por un proveedor gestionado seleccionado.
OpenClaw mantiene deshabilitada la extensión independiente `web.run` de Codex porque
el tráfico de app-server de producción rechaza su namespace `web` definido por el usuario.
`tools.web.search.enabled: false` deshabilita ambas rutas, al igual que las ejecuciones solo LLM
con herramientas deshabilitadas. Codex trata `"cached"` como una preferencia y lo resuelve como acceso externo
en vivo para turnos de app-server sin restricciones. La reserva gestionada automática
falla de forma cerrada cuando se configuran `allowedDomains` nativos, de modo que la lista de permitidos no pueda ser
eludida. Los cambios persistentes de la política efectiva de búsqueda rotan el hilo de Codex
vinculado antes del siguiente turno. Las restricciones transitorias por turno usan un hilo restringido
temporal y conservan la vinculación existente para una reanudación posterior.
`sessions_yield` y las respuestas de origen solo con herramienta de mensajes permanecen directas porque
son contratos de control de turno. `sessions_spawn` permanece searchable para que
`spawn_agent` nativo de Codex siga siendo la superficie principal de subagentes de Codex, mientras que la delegación explícita
de OpenClaw o ACP sigue disponible mediante el namespace de herramientas dinámicas
`openclaw`. Las instrucciones de colaboración de Heartbeat indican a Codex que busque
`heartbeat_respond` antes de finalizar un turno de Heartbeat cuando la herramienta aún no está
cargada.

Establece `codexDynamicToolsLoading: "direct"` solo cuando te conectes a un app-server
personalizado de Codex que no pueda buscar herramientas dinámicas diferidas o cuando depures la carga útil completa
de herramientas.

Campos de Plugin de Codex de nivel superior compatibles:

| Campo                      | Predeterminado | Significado                                                                                  |
| -------------------------- | -------------- | -------------------------------------------------------------------------------------------- |
| `codexDynamicToolsLoading` | `"searchable"` | Usa `"direct"` para colocar las herramientas dinámicas de OpenClaw directamente en el contexto inicial de herramientas de Codex. |
| `codexDynamicToolsExclude` | `[]`           | Nombres adicionales de herramientas dinámicas de OpenClaw que se omitirán en los turnos de app-server de Codex. |
| `codexPlugins`             | deshabilitado  | Compatibilidad nativa de Plugin/app de Codex para plugins seleccionados instalados desde el código fuente y migrados. |

Campos `appServer` compatibles:

| Campo                                         | Predeterminado                                         | Significado                                                                                                                                                                                                                                                                                                                                                                                     |
| --------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                                   | `"stdio"`                                              | `"stdio"` inicia Codex; `"websocket"` se conecta a `url`.                                                                                                                                                                                                                                                                                                                                       |
| `command`                                     | binario administrado de Codex                          | Ejecutable para el transporte stdio. Déjalo sin establecer para usar el binario administrado; establécelo solo para una anulación explícita.                                                                                                                                                                                                                                                     |
| `args`                                        | `["app-server", "--listen", "stdio://"]`               | Argumentos para el transporte stdio.                                                                                                                                                                                                                                                                                                                                                            |
| `url`                                         | no establecido                                         | URL del app-server WebSocket.                                                                                                                                                                                                                                                                                                                                                                   |
| `authToken`                                   | no establecido                                         | Token Bearer para el transporte WebSocket. Acepta una cadena literal o SecretInput como `${CODEX_APP_SERVER_TOKEN}`.                                                                                                                                                                                                                                                                            |
| `headers`                                     | `{}`                                                   | Encabezados WebSocket adicionales. Los valores de encabezado aceptan cadenas literales o valores SecretInput, por ejemplo `x-codex-client-session-token: "${CODEX_CLIENT_SESSION_TOKEN}"`.                                                                                                                                                                                                       |
| `clearEnv`                                    | `[]`                                                   | Nombres de variables de entorno adicionales eliminadas del proceso app-server stdio iniciado después de que OpenClaw construye su entorno heredado. OpenClaw mantiene `CODEX_HOME` por agente y el `HOME` heredado para lanzamientos locales.                                                                                                                                                   |
| `codeModeOnly`                                | `false`                                                | Opta por la superficie de herramientas de Codex solo en modo código. Las herramientas dinámicas de OpenClaw permanecen registradas con Codex para que las llamadas anidadas `tools.*` vuelvan a través del puente `item/tool/call` del app-server.                                                                                                                                               |
| `remoteWorkspaceRoot`                         | no establecido                                         | Raíz remota del espacio de trabajo del app-server de Codex. Cuando se establece, OpenClaw infiere la raíz del espacio de trabajo local a partir del espacio de trabajo de OpenClaw resuelto, conserva el sufijo del cwd actual bajo esta raíz remota y envía solo el cwd final del app-server a Codex. Si el cwd está fuera de la raíz del espacio de trabajo de OpenClaw resuelta, OpenClaw falla de forma cerrada en lugar de enviar una ruta local del Gateway al app-server remoto. |
| `requestTimeoutMs`                            | `60000`                                                | Tiempo de espera para llamadas del plano de control del app-server.                                                                                                                                                                                                                                                                                                                             |
| `turnCompletionIdleTimeoutMs`                 | `60000`                                                | Ventana de silencio después de que Codex acepta un turno o después de una solicitud del app-server limitada al turno mientras OpenClaw espera `turn/completed`.                                                                                                                                                                                                                                  |
| `postToolRawAssistantCompletionIdleTimeoutMs` | `300000`                                               | Guardia de inactividad de finalización y progreso usada después de una transferencia a herramienta, finalización de herramienta nativa, progreso sin procesar del asistente posterior a herramienta, finalización de razonamiento sin procesar o progreso de razonamiento mientras OpenClaw espera `turn/completed`. Usa esto para cargas de trabajo confiables o pesadas donde la síntesis posterior a herramienta puede permanecer legítimamente en silencio más tiempo que el presupuesto final de publicación del asistente. |
| `mode`                                        | `"yolo"` salvo que los requisitos locales de Codex no permitan YOLO | Preajuste para ejecución YOLO o revisada por guardián. Los requisitos locales de stdio que omiten `danger-full-access`, aprobación `never` o el revisor `user` hacen que el valor predeterminado implícito sea guardián.                                                                                                                                                                          |
| `approvalPolicy`                              | `"never"` o una política de aprobación de guardián permitida | Política de aprobación nativa de Codex enviada al iniciar/reanudar hilo/turno. Los valores predeterminados de guardián prefieren `"on-request"` cuando está permitido.                                                                                                                                                                                                                          |
| `sandbox`                                     | `"danger-full-access"` o un sandbox de guardián permitido | Modo sandbox nativo de Codex enviado al iniciar/reanudar hilo. Los valores predeterminados de guardián prefieren `"workspace-write"` cuando está permitido; de lo contrario, `"read-only"`. Cuando un sandbox de OpenClaw está activo, los turnos `danger-full-access` usan `workspace-write` de Codex con acceso de red derivado de la configuración de egreso del sandbox de OpenClaw.         |
| `approvalsReviewer`                           | `"user"` o un revisor de guardián permitido            | Usa `"auto_review"` para permitir que Codex revise solicitudes de aprobación nativas cuando esté permitido; de lo contrario, `guardian_subagent` o `user`. `guardian_subagent` sigue siendo un alias heredado.                                                                                                                                                                                   |
| `serviceTier`                                 | no establecido                                         | Nivel de servicio opcional del app-server de Codex. `"priority"` habilita el enrutamiento de modo rápido, `"flex"` solicita procesamiento flex, `null` borra la anulación y el valor heredado `"fast"` se acepta como `"priority"`.                                                                                                                                                             |
| `networkProxy`                                | deshabilitado                                          | Opta por la red de perfiles de permisos de Codex para comandos del app-server. OpenClaw define la configuración `permissions.<profile>.network` seleccionada y la selecciona con `default_permissions` en lugar de enviar `sandbox`.                                                                                                                                                            |
| `experimental.sandboxExecServer`              | `false`                                                | Opción de vista previa que registra un entorno de Codex respaldado por el sandbox de OpenClaw con Codex app-server 0.132.0 o posterior para que la ejecución nativa de Codex pueda ejecutarse dentro del sandbox activo de OpenClaw.                                                                                                                                                            |

`appServer.networkProxy` es explícito porque cambia el contrato del sandbox de Codex.
Cuando está habilitado, OpenClaw también establece `features.network_proxy.enabled` y
`default_permissions` en la configuración del hilo de Codex para que el perfil de
permisos generado pueda iniciar la red administrada de Codex. De forma predeterminada,
OpenClaw genera un nombre de perfil resistente a colisiones
`openclaw-network-<fingerprint>` a partir del cuerpo del perfil; usa `profileName`
solo cuando se requiere un nombre local estable.

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
`networkProxy` usa acceso al sistema de archivos de estilo espacio de trabajo para el
perfil de permisos generado. La aplicación de red administrada por Codex es red en sandbox,
por lo que un perfil de acceso completo no protegería el tráfico saliente.
Las entradas de dominio usan `allow` o `deny`; las entradas de socket Unix usan los
valores `allow` o `none` de Codex.

Las llamadas a herramientas dinámicas propiedad de OpenClaw están limitadas de forma independiente de
`appServer.requestTimeoutMs`: las solicitudes `item/tool/call` de Codex usan un watchdog de OpenClaw
de 90 segundos de forma predeterminada. Un argumento positivo `timeoutMs` por llamada amplía
o acorta ese presupuesto específico de herramienta. La herramienta `image_generate` usa
`agents.defaults.imageGenerationModel.timeoutMs` cuando la llamada de herramienta no
proporciona su propio tiempo de espera, o un valor predeterminado de generación de imágenes de 120 segundos en caso contrario.
La herramienta `image` de comprensión de medios usa
`tools.media.image.timeoutSeconds` o su valor predeterminado de medios de 60 segundos. Para la
comprensión de imágenes, ese tiempo de espera se aplica a la solicitud en sí y no se
reduce por el trabajo de preparación anterior. Los presupuestos de herramientas dinámicas están
limitados a 600000 ms. Al agotarse el tiempo, OpenClaw aborta la señal de la herramienta
cuando se admite y devuelve a Codex una respuesta de herramienta dinámica fallida para que el turno
pueda continuar en lugar de dejar la sesión en `processing`.
Este watchdog es el presupuesto externo del `item/tool/call` dinámico; los tiempos de espera
de solicitudes específicos del proveedor se ejecutan dentro de esa llamada y mantienen su propia semántica de tiempo de espera.

Después de que Codex acepta un turno, y después de que OpenClaw responde a una solicitud
de servidor de aplicaciones con ámbito de turno, el harness espera que Codex haga progreso en el turno actual y
finalmente termine el turno nativo con `turn/completed`. Si el servidor de aplicaciones queda
en silencio durante `appServer.turnCompletionIdleTimeoutMs`, OpenClaw interrumpe
el turno de Codex con el mejor esfuerzo, registra un tiempo de espera de diagnóstico y libera el
carril de sesión de OpenClaw para que los mensajes de chat posteriores no queden en cola detrás de un
turno nativo obsoleto. La mayoría de las notificaciones no terminales para el mismo turno desactivan ese watchdog
breve porque Codex ha demostrado que el turno sigue vivo. Las transferencias a herramientas usan un
presupuesto de inactividad posterior a herramienta más largo: después de que OpenClaw devuelve una respuesta
`item/tool/call`, después de que se completan elementos de herramienta nativos como `commandExecution`, después de
completarse salidas sin procesar `custom_tool_call_output`, y después de progreso posterior a herramienta
sin procesar del asistente, completados de razonamiento sin procesar o progreso de razonamiento. La protección usa
`appServer.postToolRawAssistantCompletionIdleTimeoutMs` cuando está configurado y
de forma predeterminada usa cinco minutos en caso contrario. Ese mismo presupuesto posterior a herramienta también amplía el
watchdog de progreso para la ventana de síntesis silenciosa antes de que Codex emita el siguiente
evento del turno actual. Las notificaciones globales del servidor de aplicaciones, como actualizaciones de límite de tasa,
no restablecen el progreso de inactividad del turno. Los completados de razonamiento, los completados
`agentMessage` de commentary y el progreso sin procesar de razonamiento o del asistente previo a herramienta pueden
ir seguidos de una respuesta final automática, por lo que usan la protección de respuesta posterior a progreso
en lugar de liberar inmediatamente el carril de sesión. Solo los elementos `agentMessage`
completados finales/no de commentary y los completados sin procesar del asistente previos a herramienta
activan la liberación de salida del asistente: si Codex queda entonces en silencio
sin `turn/completed`, OpenClaw interrumpe con el mejor esfuerzo el turno nativo y
libera el carril de sesión. Si otro watcher de turno gana esa carrera de liberación,
OpenClaw aún acepta el elemento final completado del asistente una vez que no queda activa
ninguna solicitud nativa, elemento o finalización de herramienta dinámica, y la
liberación de salida del asistente todavía pertenece al último elemento completado, sin
ninguna finalización de elemento posterior. Esto puede preservar la respuesta final después de completarse el trabajo de herramienta
sin reproducir el turno. Los deltas parciales del asistente, las respuestas anteriores obsoletas
y los completados posteriores vacíos no califican. Los fallos del servidor de aplicaciones
stdio seguros para reproducción,
incluidos los tiempos de espera de finalización de turno sin evidencia de asistente, herramienta, elemento activo
o efectos secundarios, se reintentan una vez en un intento nuevo del servidor de aplicaciones. Los tiempos de espera inseguros
siguen retirando el cliente de servidor de aplicaciones atascado y liberan el carril de sesión de OpenClaw.
También limpian el enlace obsoleto del hilo nativo en lugar de reproducirse
automáticamente. Los tiempos de espera del watcher de completado muestran texto de tiempo de espera específico de Codex:
los casos seguros para reproducción dicen que la respuesta puede estar incompleta, mientras que los casos inseguros
indican al usuario que verifique el estado actual antes de reintentar. Los diagnósticos públicos de tiempo de espera
incluyen campos estructurales como el último método de notificación del servidor de aplicaciones,
el id/tipo/rol del elemento de respuesta sin procesar del asistente, los conteos de solicitudes/elementos activos y el estado
de watcher activado. Cuando la última notificación es un elemento de respuesta sin procesar del asistente, también
incluyen una vista previa acotada del texto del asistente. No incluyen contenido sin procesar de prompts ni
de herramientas.

Las anulaciones de entorno siguen disponibles para pruebas locales:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN` omite el binario administrado cuando
`appServer.command` no está definido.

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` se eliminó. Use
`plugins.entries.codex.config.appServer.mode: "guardian"` en su lugar, o
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` para pruebas locales puntuales. Se
prefiere la configuración para despliegues repetibles porque mantiene el comportamiento del plugin en el
mismo archivo revisado que el resto de la configuración del harness de Codex.

## Plugins nativos de Codex

El soporte de plugins nativos de Codex usa las propias capacidades de aplicación y plugin
del servidor de aplicaciones de Codex en el mismo hilo de Codex que el turno del harness de OpenClaw. OpenClaw
no traduce los plugins de Codex a herramientas dinámicas sintéticas `codex_plugin_*` de OpenClaw.

`codexPlugins` afecta solo a las sesiones que seleccionan el harness nativo de Codex. No
tiene efecto en ejecuciones del harness integrado, ejecuciones normales del proveedor OpenAI, enlaces de conversación ACP
u otros harnesses.

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

La configuración de aplicaciones del hilo se calcula cuando OpenClaw establece una sesión de harness de Codex
o reemplaza un enlace de hilo de Codex obsoleto. No se vuelve a calcular en cada turno.
Después de cambiar `codexPlugins`, use `/new`, `/reset` o reinicie el gateway para que
las futuras sesiones del harness de Codex comiencen con el conjunto de aplicaciones actualizado.

Para elegibilidad de migración, inventario de aplicaciones, política de acciones destructivas,
elicitaciones y diagnósticos de plugins nativos, consulte
[Plugins nativos de Codex](/es/plugins/codex-native-plugins).

El acceso a aplicaciones y plugins del lado de OpenAI lo controla la cuenta de Codex con sesión iniciada
y, para espacios de trabajo Business y Enterprise/Edu, los controles de aplicaciones del espacio de trabajo. Consulte
[Usar Codex con su plan de ChatGPT](https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan)
para ver la descripción general de OpenAI sobre cuentas y controles de espacios de trabajo.

## Computer Use

Computer Use se cubre en su propia guía de configuración:
[Codex Computer Use](/es/plugins/codex-computer-use).

La versión breve: OpenClaw no incorpora como vendor la aplicación de control de escritorio ni ejecuta
acciones de escritorio por sí mismo. Prepara el servidor de aplicaciones de Codex, verifica que el
servidor MCP `computer-use` esté disponible y luego deja que Codex sea dueño de las llamadas nativas
a herramientas MCP durante los turnos en modo Codex.

## Límites de runtime

El harness de Codex cambia solo el ejecutor de agente incrustado de bajo nivel.

- Se admiten herramientas dinámicas de OpenClaw. Codex pide a OpenClaw que ejecute esas
  herramientas, por lo que OpenClaw permanece en la ruta de ejecución.
- Las herramientas nativas de shell, patch, MCP y aplicaciones nativas de Codex son propiedad de Codex.
  OpenClaw puede observar o bloquear eventos nativos seleccionados mediante el relay admitido,
  pero no reescribe los argumentos de herramientas nativas.
- Codex posee la compaction nativa. OpenClaw mantiene un espejo de transcripción para el historial
  de canales, búsqueda, `/new`, `/reset` y cambios futuros de modelo o harness, pero
  no reemplaza la compaction de Codex con un resumidor de OpenClaw o de motor de contexto.
- La generación de medios, la comprensión de medios, TTS, aprobaciones y salida de herramientas de mensajería
  continúan mediante la configuración de proveedor/modelo correspondiente de OpenClaw.
- `tool_result_persist` se aplica a resultados de herramientas de transcripción propiedad de OpenClaw, no
  a registros de resultados de herramientas nativas de Codex.

Para capas de hooks, superficies V1 admitidas, manejo de permisos nativos, direccionamiento de colas,
mecánica de carga de comentarios de Codex y detalles de compaction, consulte
[Runtime del harness de Codex](/es/plugins/codex-harness-runtime).

## Solución de problemas

**Codex no aparece como proveedor normal en `/model`:** eso es lo esperado para
configuraciones nuevas. Seleccione un modelo `openai/gpt-*`, habilite
`plugins.entries.codex.enabled` y compruebe si `plugins.allow` excluye
`codex`.

**OpenClaw usa el harness integrado en lugar de Codex:** asegúrese de que la referencia del modelo sea
`openai/gpt-*` en el proveedor oficial OpenAI y de que el plugin de Codex esté
instalado y habilitado. Si necesita prueba estricta durante las pruebas, establezca
`agentRuntime.id: "codex"` en el proveedor o modelo. Un runtime de Codex forzado falla en lugar de
volver a OpenClaw.

**El runtime OpenAI Codex vuelve a la ruta de clave API:** recopile un extracto
redactado del gateway que muestre el modelo, el runtime, el proveedor seleccionado y el fallo.
Pida a los colaboradores afectados que ejecuten este comando de solo lectura en su host de OpenClaw:

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
en lugar de un fallo simple de clave API de OpenAI.

**Permanece la configuración de referencias de modelo Codex heredadas:** ejecute `openclaw doctor --fix`.
Doctor reescribe las referencias de modelo heredadas a `openai/*`, elimina pines de runtime de sesión obsoletos y
de agente completo, y conserva las anulaciones existentes de perfil de autenticación.

**El servidor de aplicaciones se rechaza:** use el servidor de aplicaciones de Codex `0.125.0` o posterior.
Las versiones preliminares de la misma versión o versiones con sufijo de compilación, como
`0.125.0-alpha.2` o `0.125.0+custom`, se rechazan porque OpenClaw prueba el
mínimo de protocolo estable `0.125.0`.

**`/codex status` no puede conectarse:** compruebe que el plugin `codex` incluido esté
habilitado, que `plugins.allow` lo incluya cuando se configure una lista de permitidos, y
que cualquier `appServer.command`, `url`, `authToken` o encabezado personalizado sea válido.

**El descubrimiento de modelos es lento:** reduzca
`plugins.entries.codex.config.discovery.timeoutMs` o deshabilite el descubrimiento. Consulte
[Referencia del harness de Codex](/es/plugins/codex-harness-reference#model-discovery).

**El transporte WebSocket falla de inmediato:** compruebe `appServer.url`, `authToken`,
los encabezados, y que el servidor de aplicaciones remoto hable la misma versión del protocolo
del servidor de aplicaciones de Codex.

**Las herramientas nativas de shell o de parches están bloqueadas con `Native hook relay unavailable`:**
el hilo de Codex aún intenta usar un id de retransmisión de hook nativo que OpenClaw ya no
tiene registrado. Este es un problema de transporte de hooks nativos de Codex, no un fallo del
backend ACP, del proveedor, de GitHub ni de un comando de shell. Inicia una sesión nueva en
el chat afectado con `/new` o `/reset`, y luego vuelve a intentar un comando inofensivo. Si eso
funciona una vez pero la siguiente llamada a una herramienta nativa vuelve a fallar, trata `/new` solo
como una solución temporal: copia el prompt en una sesión nueva después de reiniciar el servidor
de la aplicación Codex o el Gateway de OpenClaw para que se descarten los hilos antiguos y se vuelvan a crear
los registros de hooks nativos.

**Un modelo que no es de Codex usa el arnés integrado:** eso es lo esperado salvo que
la política de tiempo de ejecución del proveedor o del modelo lo enrute a otro arnés. Las referencias simples a proveedores que no son de OpenAI
permanecen en su ruta normal de proveedor en modo `auto`.

**Uso de computadora está instalado pero las herramientas no se ejecutan:** comprueba
`/codex computer-use status` desde una sesión nueva. Si una herramienta informa
`Native hook relay unavailable`, usa la recuperación de retransmisión de hooks nativos anterior. Consulta
[Uso de computadora de Codex](/es/plugins/codex-computer-use#troubleshooting).

## Relacionado

- [Referencia del arnés de Codex](/es/plugins/codex-harness-reference)
- [Tiempo de ejecución del arnés de Codex](/es/plugins/codex-harness-runtime)
- [Plugins nativos de Codex](/es/plugins/codex-native-plugins)
- [Uso de computadora de Codex](/es/plugins/codex-computer-use)
- [Tiempos de ejecución de agentes](/es/concepts/agent-runtimes)
- [Proveedores de modelos](/es/concepts/model-providers)
- [Proveedor OpenAI](/es/providers/openai)
- [Ayuda de OpenAI Codex](https://help.openai.com/en/collections/14937394-codex)
- [Plugins de arnés de agente](/es/plugins/sdk-agent-harness)
- [Hooks de Plugin](/es/plugins/hooks)
- [Exportación de diagnósticos](/es/gateway/diagnostics)
- [Estado](/es/cli/status)
- [Pruebas](/es/help/testing-live#live-codex-app-server-harness-smoke)
