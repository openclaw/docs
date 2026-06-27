---
read_when:
    - Quieres usar el arnés de servidor de aplicación Codex incluido
    - Necesitas ejemplos de configuración del harness de Codex
    - Quieres que los despliegues solo con Codex fallen en lugar de recurrir a OpenClaw
summary: Ejecuta turnos de agente integrado de OpenClaw a través del arnés app-server de Codex incluido
title: Arnés de Codex
x-i18n:
    generated_at: "2026-06-27T12:10:10Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cfa04f53d01aad16dd6ea499ea1c04b1050c80ed12326db6fb4fa88c9c40a68c
    source_path: plugins/codex-harness.md
    workflow: 16
---

El plugin `codex` incluido permite que OpenClaw ejecute turnos de agentes OpenAI incrustados
mediante Codex app-server en lugar del arnés integrado de OpenClaw.

Usa el arnés de Codex cuando quieras que Codex controle la sesión de agente de bajo nivel:
reanudación nativa de hilos, continuación nativa de herramientas, compaction nativa y
ejecución de app-server. OpenClaw sigue controlando los canales de chat, los archivos de sesión, la
selección de modelos, las herramientas dinámicas de OpenClaw, las aprobaciones, la entrega de medios y el
espejo visible de la transcripción.

La configuración normal usa referencias canónicas de modelos OpenAI como `openai/gpt-5.5`.
No configures referencias GPT heredadas de Codex. Coloca el orden de autenticación de agente OpenAI
en `auth.order.openai`; los ids de perfiles de autenticación heredados de Codex más antiguos y
las entradas heredadas de orden de autenticación de Codex son estado heredado reparado por
`openclaw doctor --fix`.

Cuando no hay un sandbox de OpenClaw activo, OpenClaw inicia hilos de Codex app-server
con el modo de código nativo de Codex habilitado mientras deja code-mode-only desactivado de forma predeterminada.
Eso mantiene disponibles el espacio de trabajo nativo de Codex y las capacidades de código mientras
las herramientas dinámicas de OpenClaw continúan mediante el puente `item/tool/call` de app-server.
El sandboxing activo de OpenClaw y las políticas de herramientas restringidas deshabilitan por completo el modo de código nativo
a menos que optes por la ruta experimental de exec-server de sandbox.

Esta función nativa de Codex es independiente de
[modo de código de OpenClaw](/es/reference/code-mode), que es un runtime QuickJS-WASI opcional
para ejecuciones genéricas de OpenClaw con una forma de entrada `exec` diferente.

Para la división más amplia entre modelo/proveedor/runtime, empieza con
[Runtimes de agente](/es/concepts/agent-runtimes). La versión breve es:
`openai/gpt-5.5` es la referencia del modelo, `codex` es el runtime, y Telegram,
Discord, Slack u otro canal sigue siendo la superficie de comunicación.

## Requisitos

- OpenClaw con el plugin `codex` incluido disponible.
- Si tu configuración usa `plugins.allow`, incluye `codex`.
- Codex app-server `0.125.0` o más reciente. El plugin incluido administra de forma predeterminada
  un binario de Codex app-server compatible, por lo que los comandos locales `codex` en `PATH` no
  afectan el inicio normal del arnés.
- Autenticación de Codex disponible mediante `openclaw models auth login --provider openai`,
  una cuenta de app-server en el directorio principal de Codex del agente, o un perfil explícito de autenticación
  de clave API de Codex.

Para precedencia de autenticación, aislamiento de entorno, comandos personalizados de app-server, descubrimiento de modelos
y todos los campos de configuración, consulta la
[referencia del arnés de Codex](/es/plugins/codex-harness-reference).

## Inicio rápido

La mayoría de los usuarios que quieren Codex en OpenClaw quieren esta ruta: iniciar sesión con una
suscripción de ChatGPT/Codex, habilitar el plugin `codex` incluido y usar una
referencia canónica de modelo `openai/gpt-*`.

Inicia sesión con OAuth de Codex:

```bash
openclaw models auth login --provider openai
```

Habilita el plugin `codex` incluido y selecciona un modelo de agente OpenAI:

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

Si tu configuración usa `plugins.allow`, agrega también `codex` allí:

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

La configuración de inicio rápido es la configuración mínima viable del arnés de Codex. Configura las opciones del
arnés de Codex en la configuración de OpenClaw y usa la CLI solo para la autenticación de Codex:

| Necesidad                              | Configurar                                                                       | Dónde                              |
| -------------------------------------- | -------------------------------------------------------------------------------- | ---------------------------------- |
| Habilitar el arnés                     | `plugins.entries.codex.enabled: true`                                            | Configuración de OpenClaw          |
| Mantener una instalación de plugin en lista permitida | Incluir `codex` en `plugins.allow`                                      | Configuración de OpenClaw          |
| Enrutar turnos de agente OpenAI mediante Codex | `agents.defaults.model` o `agents.list[].model` como `openai/gpt-*`        | Configuración de agente OpenClaw   |
| Iniciar sesión con OAuth de ChatGPT/Codex | `openclaw models auth login --provider openai`                                 | Perfil de autenticación de CLI     |
| Agregar respaldo de clave API para ejecuciones de Codex | Perfil de clave API `openai:*` listado después de la autenticación de suscripción en `auth.order.openai` | Perfil de autenticación de CLI + configuración de OpenClaw |
| Fallar de forma cerrada cuando Codex no esté disponible | `agentRuntime.id: "codex"` del proveedor o modelo                         | Configuración de modelo/proveedor de OpenClaw |
| Usar tráfico directo de API OpenAI     | `agentRuntime.id: "openclaw"` del proveedor o modelo con autenticación normal de OpenAI | Configuración de modelo/proveedor de OpenClaw |
| Ajustar el comportamiento de app-server | `plugins.entries.codex.config.appServer.*`                                      | Configuración del plugin Codex     |
| Habilitar apps nativas de plugin de Codex | `plugins.entries.codex.config.codexPlugins.*`                                  | Configuración del plugin Codex     |
| Habilitar Codex Computer Use           | `plugins.entries.codex.config.computerUse.*`                                    | Configuración del plugin Codex     |

Usa referencias de modelo `openai/gpt-*` para turnos de agente OpenAI respaldados por Codex. Prefiere
`auth.order.openai` para un orden de suscripción primero y clave API como respaldo. Los ids de perfiles de autenticación
heredados de Codex existentes y el orden de autenticación heredado de Codex son estado heredado
solo para doctor; no escribas nuevas referencias GPT heredadas de Codex.

No establezcas `compaction.model` ni `compaction.provider` en agentes respaldados por Codex.
Codex compacta mediante su estado nativo de hilo de app-server, por lo que OpenClaw ignora
esas anulaciones locales del resumidor en tiempo de ejecución y `openclaw doctor --fix` las elimina
cuando el agente usa Codex.

Lossless sigue siendo compatible como motor de contexto para ensamblaje, ingesta y
mantenimiento alrededor de turnos de Codex. Configúralo mediante
`plugins.slots.contextEngine: "lossless-claw"` y
`plugins.entries.lossless-claw.config.summaryModel`, no mediante
`agents.defaults.compaction.provider`. `openclaw doctor --fix` migra la antigua forma
`compaction.provider: "lossless-claw"` al slot de motor de contexto Lossless
cuando Codex es el runtime activo, pero Codex nativo sigue controlando la compaction.

El arnés nativo de Codex app-server admite motores de contexto que requieren
ensamblaje previo al prompt. Los backends genéricos de CLI, incluido `codex-cli`, no proporcionan
esa capacidad de host.

Para agentes respaldados por Codex, `/compact` inicia la compaction nativa de Codex app-server en
el hilo vinculado. OpenClaw no espera a que termine, no impone un timeout de OpenClaw,
no reinicia el app-server compartido ni recurre a un motor de contexto o
resumidor público de OpenAI. Si el enlace del hilo nativo de Codex falta o está
obsoleto, el comando falla de forma cerrada para que el operador vea el límite real del runtime
en lugar de cambiar silenciosamente de backend de compaction.

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
`openai/gpt-*`. La clave API es solo un respaldo de autenticación, no una solicitud para cambiar a OpenClaw o
OpenAI Responses simple.

El resto de esta página cubre variantes comunes entre las que los usuarios deben elegir:
forma de despliegue, enrutamiento con fallo cerrado, política de aprobación de guardian, plugins nativos de Codex
y Computer Use. Para listas completas de opciones, valores predeterminados, enums, descubrimiento,
aislamiento de entorno, timeouts y campos de transporte de app-server, consulta la
[referencia del arnés de Codex](/es/plugins/codex-harness-reference).

## Verificar el runtime de Codex

Usa `/status` en el chat donde esperas Codex. Un turno de agente OpenAI respaldado por Codex
muestra:

```text
Runtime: OpenAI Codex
```

Luego revisa el estado de Codex app-server:

```text
/codex status
/codex models
```

`/codex status` informa conectividad de app-server, cuenta, límites de tasa, servidores MCP
y Skills. `/codex models` lista el catálogo en vivo de Codex app-server para
el arnés y la cuenta. Si `/status` resulta inesperado, consulta
[Solución de problemas](#troubleshooting).

## Enrutamiento y selección de modelos

Mantén separadas las referencias de proveedor y la política de runtime:

- Usa `openai/gpt-*` para turnos de agente OpenAI mediante Codex.
- No uses referencias GPT heredadas de Codex en la configuración. Ejecuta `openclaw doctor --fix` para
  reparar referencias heredadas y pines obsoletos de ruta de sesión.
- `agentRuntime.id: "codex"` es opcional para el modo automático normal de OpenAI, pero útil
  cuando un despliegue debe fallar de forma cerrada si Codex no está disponible.
- `agentRuntime.id: "openclaw"` opta un proveedor o modelo por el runtime incrustado de OpenClaw
  cuando eso es intencional.
- `/codex ...` controla conversaciones nativas de Codex app-server desde el chat.
- ACP/acpx es una ruta de arnés externo independiente. Úsala solo cuando el usuario pida
  ACP/acpx o un adaptador de arnés externo.

Enrutamiento de comandos comunes:

| Intención del usuario                                  | Usar                                                                                                  |
| ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------- |
| Adjuntar el chat actual                                | `/codex bind [--cwd <path>]`                                                                          |
| Reanudar un hilo existente de Codex                    | `/codex resume <thread-id>`                                                                           |
| Listar o filtrar hilos de Codex                        | `/codex threads [filter]`                                                                             |
| Listar plugins nativos de Codex                        | `/codex plugins list`                                                                                 |
| Habilitar o deshabilitar un plugin nativo de Codex configurado | `/codex plugins enable <name>`, `/codex plugins disable <name>`                              |
| Adjuntar una sesión existente de Codex CLI en un nodo emparejado | `/codex sessions --host <node> [filter]`, luego `/codex resume <session-id> --host <node> --bind here` |
| Enviar solo comentarios de Codex                       | `/codex diagnostics [note]`                                                                           |
| Iniciar una tarea ACP/acpx                             | Comandos de sesión ACP/acpx, no `/codex`                                                              |

| Caso de uso                                          | Configurar                                                            | Verificar                               | Notas                                           |
| ---------------------------------------------------- | --------------------------------------------------------------------- | --------------------------------------- | ----------------------------------------------- |
| Suscripción a ChatGPT/Codex con runtime nativo Codex | `openai/gpt-*` más el plugin `codex` habilitado                       | `/status` muestra `Runtime: OpenAI Codex` | Ruta recomendada                                |
| Fallar cerrado si Codex no está disponible           | Proveedor o modelo `agentRuntime.id: "codex"`                         | El turno falla en lugar del respaldo integrado | Úselo para despliegues solo de Codex            |
| Dirigir el tráfico con clave de API de OpenAI a través de OpenClaw | Proveedor o modelo `agentRuntime.id: "openclaw"` y autenticación normal de OpenAI | `/status` muestra el runtime de OpenClaw | Úselo solo cuando OpenClaw sea intencional      |
| Configuración heredada                               | referencias GPT heredadas de Codex                                    | `openclaw doctor --fix` la reescribe    | No escriba configuración nueva de esta forma    |
| Adaptador Codex ACP/acpx                             | ACP `sessions_spawn({ runtime: "acp" })`                              | Estado de tarea/sesión ACP              | Separado del arnés nativo de Codex              |

`agents.defaults.imageModel` sigue la misma división por prefijo. Use `openai/gpt-*`
para la ruta normal de OpenAI y `codex/gpt-*` solo cuando la comprensión de imágenes
deba ejecutarse mediante un turno acotado del servidor de aplicación de Codex. No use
referencias GPT heredadas de Codex; doctor reescribe ese prefijo heredado como `openai/gpt-*`.

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

### Despliegue Codex con fallo cerrado

Para turnos de agentes de OpenAI, `openai/gpt-*` ya se resuelve a Codex cuando el
plugin incluido está disponible. Agregue una política de runtime explícita cuando quiera una regla escrita
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

Con Codex forzado, OpenClaw falla temprano si el plugin Codex está deshabilitado, el
servidor de aplicación es demasiado antiguo o el servidor de aplicación no puede iniciar.

## Política del servidor de aplicación

De forma predeterminada, el plugin inicia localmente el binario Codex administrado por OpenClaw con transporte
stdio. Configure `appServer.command` solo cuando quiera ejecutar intencionalmente un
ejecutable diferente. Use transporte WebSocket solo cuando un servidor de aplicación ya se esté
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

Las sesiones locales del servidor de aplicación stdio usan de forma predeterminada la postura de operador local de confianza:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` y
`sandbox: "danger-full-access"`. Si los requisitos locales de Codex no permiten esa
postura YOLO implícita, OpenClaw selecciona en su lugar permisos guardian permitidos.
Cuando un sandbox de OpenClaw está activo para la sesión, OpenClaw deshabilita el Code Mode
nativo de Codex, los servidores MCP del usuario y la ejecución de plugins respaldada por aplicaciones para ese
turno, en lugar de depender del sandboxing del lado del host de Codex. El acceso al shell se expone
mediante herramientas dinámicas respaldadas por el sandbox de OpenClaw, como `sandbox_exec` y
`sandbox_process`, cuando las herramientas normales de exec/proceso están disponibles.

Use el modo exec normalizado de OpenClaw cuando quiera revisión automática nativa de Codex antes de
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
revisadas por Codex Guardian, normalmente
`approvalPolicy: "on-request"`, `approvalsReviewer: "auto_review"` y
`sandbox: "workspace-write"` cuando los requisitos locales permiten esos valores.
En `tools.exec.mode: "auto"`, OpenClaw no preserva anulaciones heredadas inseguras de Codex
`approvalPolicy: "never"` ni `sandbox: "danger-full-access"`; use
`tools.exec.mode: "full"` para una postura Codex intencional sin aprobaciones. El preajuste
heredado `plugins.entries.codex.config.appServer.mode: "guardian"` sigue
funcionando, pero `tools.exec.mode: "auto"` es la superficie normalizada de OpenClaw.

Para la comparación a nivel de modo con aprobaciones de exec del host y permisos ACPX,
consulte [Modos de permisos](/es/tools/permission-modes).

Para cada campo del servidor de aplicación, orden de autenticación, aislamiento de entorno, descubrimiento y
comportamiento de tiempo de espera, consulte [Referencia del arnés de Codex](/es/plugins/codex-harness-reference).

## Comandos y diagnósticos

El plugin incluido registra `/codex` como un comando de barra diagonal en cualquier canal que
admita comandos de texto de OpenClaw.

Formas comunes:

- `/codex status` comprueba la conectividad del servidor de aplicación, modelos, cuenta, límites de tasa,
  servidores MCP y Skills.
- `/codex models` lista los modelos activos del servidor de aplicación de Codex.
- `/codex threads [filter]` lista hilos recientes del servidor de aplicación de Codex.
- `/codex resume <thread-id>` adjunta la sesión actual de OpenClaw a un
  hilo de Codex existente.
- `/codex compact` pide al servidor de aplicación de Codex que compacte el hilo adjunto.
- `/codex review` inicia la revisión nativa de Codex para el hilo adjunto.
- `/codex diagnostics [note]` pregunta antes de enviar comentarios de Codex para el
  hilo adjunto.
- `/codex account` muestra el estado de la cuenta y los límites de tasa.
- `/codex mcp` lista el estado de los servidores MCP del servidor de aplicación de Codex.
- `/codex skills` lista las Skills del servidor de aplicación de Codex.

Para la mayoría de los informes de soporte, comience con `/diagnostics [note]` en la conversación
donde ocurrió el error. Crea un informe de diagnósticos de Gateway y, para sesiones del
arnés de Codex, solicita aprobación para enviar el paquete de comentarios de Codex pertinente.
Consulte [Exportación de diagnósticos](/es/gateway/diagnostics) para conocer el modelo de privacidad y el comportamiento
en chats grupales.

Use `/codex diagnostics [note]` solo cuando quiera específicamente la carga de comentarios de Codex
para el hilo adjunto actualmente, sin el paquete completo de diagnósticos de Gateway.

### Inspeccionar hilos de Codex localmente

La forma más rápida de inspeccionar una ejecución defectuosa de Codex suele ser abrir directamente el hilo
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
   heredados de Codex y el orden de autenticación heredado de Codex.
2. La cuenta existente del servidor de aplicación en el directorio Codex home de ese agente.
3. Solo para lanzamientos locales del servidor de aplicación stdio, `CODEX_API_KEY`, luego
   `OPENAI_API_KEY`, cuando no haya cuenta de servidor de aplicación presente y la autenticación de OpenAI
   aún sea necesaria.

Cuando OpenClaw detecta un perfil de autenticación de Codex de tipo suscripción a ChatGPT, elimina
`CODEX_API_KEY` y `OPENAI_API_KEY` del proceso hijo de Codex generado. Eso
mantiene las claves de API a nivel de Gateway disponibles para embeddings o modelos directos de OpenAI
sin hacer que los turnos nativos del servidor de aplicación de Codex se facturen por la API por accidente.
Los perfiles explícitos de clave de API de Codex y el respaldo local por clave de entorno stdio usan el inicio de sesión del servidor de aplicación
en lugar del entorno heredado del proceso hijo. Las conexiones WebSocket al servidor de aplicación
no reciben respaldo de clave de API de entorno de Gateway; use un perfil de autenticación explícito o la
propia cuenta del servidor de aplicación remoto.
Cuando se configuran plugins nativos de Codex, OpenClaw instala o actualiza esos
plugins mediante el servidor de aplicación conectado antes de exponer aplicaciones propiedad de plugins al
hilo de Codex. `app/list` sigue siendo la fuente de verdad para ids de aplicaciones,
accesibilidad y metadatos, pero OpenClaw controla la decisión de habilitación por hilo:
si la política permite una aplicación accesible listada, OpenClaw envía
`thread/start.config.apps[appId].enabled = true` incluso cuando `app/list` informa actualmente
que esa aplicación está deshabilitada. Esta ruta no inventa instalación de aplicaciones para
ids desconocidos; OpenClaw solo activa plugins de marketplace con `plugin/install`
y luego actualiza el inventario.

Si un perfil de suscripción alcanza un límite de uso de Codex, OpenClaw registra la hora de restablecimiento
cuando Codex informa una y prueba el siguiente perfil de autenticación ordenado para la misma
ejecución de Codex. Cuando pasa la hora de restablecimiento, el perfil de suscripción vuelve a ser elegible
sin cambiar el modelo `openai/gpt-*` seleccionado ni el runtime de Codex.

Para lanzamientos locales del servidor de aplicación stdio, OpenClaw establece `CODEX_HOME` en un directorio
por agente, de modo que la configuración, los archivos de autenticación/cuenta, la caché/datos de plugins y el estado
nativo de hilos de Codex no lean ni escriban el `~/.codex` personal del operador de forma
predeterminada. OpenClaw preserva el `HOME` normal del proceso; los subprocesos ejecutados por Codex
aún pueden encontrar configuración y tokens en el directorio de usuario, y Codex puede descubrir entradas compartidas
de `$HOME/.agents/skills` y `$HOME/.agents/plugins/marketplace.json`.

Si un despliegue necesita aislamiento adicional del entorno, agregue esas variables a
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
los subprocesos puedan usar el estado normal del directorio de usuario.

Codex carga las herramientas dinámicas como `searchable` de forma predeterminada. OpenClaw no expone
herramientas dinámicas que dupliquen las operaciones de espacio de trabajo nativas de Codex: `read`, `write`,
`edit`, `apply_patch`, `exec`, `process` y `update_plan`. La mayoría de las demás
herramientas de integración de OpenClaw, como mensajería, medios, Cron, navegador, nodos,
Gateway y `heartbeat_respond`, están disponibles mediante la búsqueda de herramientas de Codex bajo
el espacio de nombres `openclaw`, lo que mantiene más pequeño el contexto inicial del modelo. La búsqueda web
usa la herramienta alojada `web_search` de Codex de forma predeterminada cuando la búsqueda está habilitada y no
se selecciona ningún proveedor gestionado. La búsqueda alojada nativa y la herramienta dinámica
`web_search` gestionada de OpenClaw son mutuamente excluyentes, de modo que la búsqueda gestionada no pueda eludir
las restricciones de dominio nativas. OpenClaw usa la herramienta gestionada cuando la búsqueda alojada
no está disponible, está deshabilitada explícitamente o se reemplaza por un proveedor gestionado seleccionado.
OpenClaw mantiene deshabilitada la extensión independiente `web.run` de Codex porque
el tráfico del servidor de aplicaciones de producción rechaza su espacio de nombres `web` definido por el usuario.
`tools.web.search.enabled: false` deshabilita ambas rutas, al igual que las ejecuciones solo de LLM
con herramientas deshabilitadas. Codex trata `"cached"` como una preferencia y la resuelve como acceso externo
en vivo para turnos de servidor de aplicaciones sin restricciones. La reserva gestionada automática
falla de forma cerrada cuando se establecen `allowedDomains` nativos, de modo que no se pueda eludir la lista
de permitidos. Los cambios persistentes en la política efectiva de búsqueda rotan el hilo de Codex
vinculado antes del siguiente turno. Las restricciones transitorias por turno usan un hilo temporal
restringido y conservan la vinculación existente para reanudar más tarde.
`sessions_yield` y las respuestas de origen solo con herramientas de mensaje permanecen directas porque
son contratos de control de turno. `sessions_spawn` permanece buscable para que `spawn_agent`
nativo de Codex siga siendo la superficie principal de subagentes de Codex, mientras que la delegación explícita
de OpenClaw o ACP sigue disponible mediante el espacio de nombres de herramientas dinámicas `openclaw`.
Las instrucciones de colaboración de Heartbeat indican a Codex que busque
`heartbeat_respond` antes de finalizar un turno de Heartbeat cuando la herramienta aún no está
cargada.

Establece `codexDynamicToolsLoading: "direct"` solo al conectar con un servidor de aplicaciones de Codex
personalizado que no pueda buscar herramientas dinámicas diferidas o al depurar la carga útil completa
de herramientas.

Campos de Plugin de Codex de nivel superior admitidos:

| Campo                      | Predeterminado | Significado                                                                                  |
| -------------------------- | -------------- | -------------------------------------------------------------------------------------------- |
| `codexDynamicToolsLoading` | `"searchable"` | Usa `"direct"` para colocar las herramientas dinámicas de OpenClaw directamente en el contexto inicial de herramientas de Codex. |
| `codexDynamicToolsExclude` | `[]`           | Nombres adicionales de herramientas dinámicas de OpenClaw que se omitirán en los turnos del servidor de aplicaciones de Codex. |
| `codexPlugins`             | deshabilitado  | Compatibilidad nativa de plugins/aplicaciones de Codex para plugins seleccionados migrados instalados desde origen.           |

Campos `appServer` admitidos:

| Campo                                         | Predeterminado                                         | Significado                                                                                                                                                                                                                                                                                                                                                                                     |
| --------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                                   | `"stdio"`                                              | `"stdio"` inicia Codex; `"websocket"` se conecta a `url`.                                                                                                                                                                                                                                                                                                                                       |
| `command`                                     | binario de Codex gestionado                            | Ejecutable para el transporte stdio. Déjalo sin establecer para usar el binario gestionado; establécelo solo para una anulación explícita.                                                                                                                                                                                                                                                       |
| `args`                                        | `["app-server", "--listen", "stdio://"]`               | Argumentos para el transporte stdio.                                                                                                                                                                                                                                                                                                                                                            |
| `url`                                         | sin establecer                                         | URL del servidor de aplicación WebSocket.                                                                                                                                                                                                                                                                                                                                                       |
| `authToken`                                   | sin establecer                                         | Token Bearer para el transporte WebSocket. Acepta una cadena literal o SecretInput como `${CODEX_APP_SERVER_TOKEN}`.                                                                                                                                                                                                                                                                           |
| `headers`                                     | `{}`                                                   | Encabezados WebSocket adicionales. Los valores de encabezado aceptan cadenas literales o valores SecretInput, por ejemplo `x-codex-client-session-token: "${CODEX_CLIENT_SESSION_TOKEN}"`.                                                                                                                                                                                                       |
| `clearEnv`                                    | `[]`                                                   | Nombres adicionales de variables de entorno eliminados del proceso del servidor de aplicación stdio iniciado después de que OpenClaw crea su entorno heredado. OpenClaw conserva el `CODEX_HOME` por agente y el `HOME` heredado para lanzamientos locales.                                                                                                                                       |
| `codeModeOnly`                                | `false`                                                | Activa la superficie de herramientas solo de modo código de Codex. Las herramientas dinámicas de OpenClaw permanecen registradas con Codex para que las llamadas anidadas `tools.*` vuelvan a través del puente `item/tool/call` del servidor de aplicación.                                                                                                                                      |
| `remoteWorkspaceRoot`                         | sin establecer                                         | Raíz remota del espacio de trabajo del servidor de aplicación de Codex. Cuando se establece, OpenClaw infiere la raíz del espacio de trabajo local a partir del espacio de trabajo de OpenClaw resuelto, conserva el sufijo de cwd actual bajo esta raíz remota y envía solo el cwd final del servidor de aplicación a Codex. Si el cwd está fuera de la raíz del espacio de trabajo de OpenClaw resuelta, OpenClaw falla en modo cerrado en lugar de enviar una ruta local del Gateway al servidor de aplicación remoto. |
| `requestTimeoutMs`                            | `60000`                                                | Tiempo de espera para llamadas del plano de control del servidor de aplicación.                                                                                                                                                                                                                                                                                                                  |
| `turnCompletionIdleTimeoutMs`                 | `60000`                                                | Ventana silenciosa después de que Codex acepta un turno o después de una solicitud del servidor de aplicación con alcance de turno mientras OpenClaw espera `turn/completed`.                                                                                                                                                                                                                    |
| `postToolRawAssistantCompletionIdleTimeoutMs` | `300000`                                               | Guardia de inactividad de finalización y progreso usada después de una transferencia de herramienta, finalización de herramienta nativa, progreso sin procesar del asistente posterior a herramienta, finalización de razonamiento sin procesar o progreso de razonamiento mientras OpenClaw espera `turn/completed`. Usa esto para cargas de trabajo confiables o pesadas donde la síntesis posterior a herramienta puede permanecer legítimamente en silencio más tiempo que el presupuesto final de liberación del asistente. |
| `mode`                                        | `"yolo"` a menos que los requisitos locales de Codex no permitan YOLO | Preajuste para ejecución YOLO o revisada por guardian. Los requisitos locales de stdio que omiten `danger-full-access`, la aprobación `never` o el revisor `user` hacen que el valor predeterminado implícito sea guardian.                                                                                                                                                                      |
| `approvalPolicy`                              | `"never"` o una política de aprobación guardian permitida | Política de aprobación nativa de Codex enviada al inicio, reanudación o turno del hilo. Los valores predeterminados de guardian prefieren `"on-request"` cuando se permite.                                                                                                                                                                                                                     |
| `sandbox`                                     | `"danger-full-access"` o un sandbox guardian permitido | Modo sandbox nativo de Codex enviado al inicio o reanudación del hilo. Los valores predeterminados de guardian prefieren `"workspace-write"` cuando se permite; de lo contrario, `"read-only"`. Cuando un sandbox de OpenClaw está activo, los turnos `danger-full-access` usan `workspace-write` de Codex con acceso de red derivado de la configuración de salida del sandbox de OpenClaw.      |
| `approvalsReviewer`                           | `"user"` o un revisor guardian permitido               | Usa `"auto_review"` para permitir que Codex revise solicitudes de aprobación nativas cuando se permita; de lo contrario, `guardian_subagent` o `user`. `guardian_subagent` sigue siendo un alias heredado.                                                                                                                                                                                        |
| `serviceTier`                                 | sin establecer                                         | Nivel de servicio opcional del servidor de aplicación de Codex. `"priority"` habilita el enrutamiento de modo rápido, `"flex"` solicita procesamiento flexible, `null` borra la anulación y el valor heredado `"fast"` se acepta como `"priority"`.                                                                                                                                              |
| `networkProxy`                                | deshabilitado                                          | Activa la red de perfil de permisos de Codex para comandos del servidor de aplicación. OpenClaw define la configuración `permissions.<profile>.network` seleccionada y la selecciona con `default_permissions` en lugar de enviar `sandbox`.                                                                                                                                                      |
| `experimental.sandboxExecServer`              | `false`                                                | Activación de vista previa que registra un entorno Codex respaldado por sandbox de OpenClaw con Codex app-server 0.132.0 o posterior para que la ejecución nativa de Codex pueda ejecutarse dentro del sandbox activo de OpenClaw.                                                                                                                                                                |

`appServer.networkProxy` es explícito porque cambia el contrato de sandbox de Codex.
Cuando está habilitado, OpenClaw también establece `features.network_proxy.enabled` y
`default_permissions` en la configuración del hilo de Codex para que el perfil de
permisos generado pueda iniciar la red gestionada por Codex. De forma predeterminada,
OpenClaw genera un nombre de perfil `openclaw-network-<fingerprint>` resistente a
colisiones a partir del cuerpo del perfil; usa `profileName` solo cuando se requiera
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

Si el runtime normal del servidor de aplicación fuera `danger-full-access`, habilitar
`networkProxy` usa acceso al sistema de archivos de estilo workspace para el perfil
de permisos generado. La aplicación gestionada por Codex de la red es una red en
sandbox, por lo que un perfil de acceso completo no protegería el tráfico saliente.
Las entradas de dominio usan `allow` o `deny`; las entradas de socket Unix usan los
valores `allow` o `none` de Codex.

Las llamadas dinámicas a herramientas propiedad de OpenClaw están limitadas independientemente de
`appServer.requestTimeoutMs`: las solicitudes `item/tool/call` de Codex usan de forma predeterminada un mecanismo de vigilancia de OpenClaw de 90 segundos. Un argumento `timeoutMs` positivo por llamada extiende
o acorta el presupuesto de esa herramienta específica. La herramienta `image_generate` usa
`agents.defaults.imageGenerationModel.timeoutMs` cuando la llamada a la herramienta no
proporciona su propio tiempo de espera, o de lo contrario usa un valor predeterminado de generación de imágenes de 120 segundos.
La herramienta `image` de comprensión multimedia usa
`tools.media.image.timeoutSeconds` o su valor predeterminado multimedia de 60 segundos. Para la comprensión de imágenes, ese tiempo de espera se aplica a la solicitud en sí y no se
reduce por trabajo de preparación previo. Los presupuestos de herramientas dinámicas están
limitados a 600000 ms. Al agotarse el tiempo de espera, OpenClaw aborta la señal de la herramienta
cuando está soportado y devuelve una respuesta fallida de herramienta dinámica a Codex para que el turno
pueda continuar en lugar de dejar la sesión en `processing`.
Este mecanismo de vigilancia es el presupuesto dinámico externo de `item/tool/call`; los tiempos de espera
de solicitudes específicos del proveedor se ejecutan dentro de esa llamada y conservan su propia semántica de tiempo de espera.

Después de que Codex acepta un turno, y después de que OpenClaw responde a una solicitud de
app-server con alcance de turno, el arnés espera que Codex progrese en el turno actual y
eventualmente termine el turno nativo con `turn/completed`. Si el app-server permanece
en silencio durante `appServer.turnCompletionIdleTimeoutMs`, OpenClaw interrumpe
el turno de Codex con el mejor esfuerzo, registra un tiempo de espera diagnóstico y libera la
vía de sesión de OpenClaw para que los mensajes de chat posteriores no queden en cola detrás de un turno
nativo obsoleto. La mayoría de las notificaciones no terminales del mismo turno desactivan ese breve
mecanismo de vigilancia porque Codex ha demostrado que el turno sigue activo. Las entregas a herramientas usan un
presupuesto de inactividad posterior a herramienta más largo: después de que OpenClaw devuelve una respuesta `item/tool/call`,
después de que se completan elementos de herramientas nativas como `commandExecution`, después de completaciones
sin procesar de `custom_tool_call_output`, y después de progreso sin procesar del asistente posterior a herramienta,
completaciones de razonamiento o progreso de razonamiento. La protección usa
`appServer.postToolRawAssistantCompletionIdleTimeoutMs` cuando está configurado y,
de lo contrario, usa de forma predeterminada cinco minutos. Ese mismo presupuesto posterior a herramienta también extiende el
mecanismo de vigilancia de progreso para la ventana silenciosa de síntesis antes de que Codex emita el siguiente
evento del turno actual. Las notificaciones globales de app-server, como actualizaciones de límites de frecuencia,
no restablecen el progreso de inactividad del turno. Las completaciones de razonamiento, las completaciones
`agentMessage` de comentario y el progreso sin procesar de razonamiento o asistente previo a herramienta pueden
ir seguidos de una respuesta final automática, por lo que usan la protección de respuesta posterior al progreso
en lugar de liberar inmediatamente la vía de sesión. Solo los elementos `agentMessage`
finales/no de comentario completados y las completaciones sin procesar de asistente previas a herramienta
activan la liberación de salida del asistente: si Codex queda entonces en silencio
sin `turn/completed`, OpenClaw interrumpe con el mejor esfuerzo el turno nativo y
libera la vía de sesión. Los fallos reproducibles de forma segura del app-server stdio, incluidos los
tiempos de espera de finalización de turno sin evidencia de asistente, herramienta, elemento activo o
efecto secundario, se reintentan una vez en un nuevo intento de app-server. Los tiempos de espera inseguros
aun así retiran el cliente de app-server atascado y liberan la vía de sesión de OpenClaw.
También limpian el enlace nativo obsoleto del hilo en lugar de reproducirse
automáticamente. Los tiempos de espera de vigilancia de completación muestran texto de tiempo de espera específico de Codex:
los casos reproducibles de forma segura dicen que la respuesta puede estar incompleta, mientras que los casos inseguros
indican al usuario que verifique el estado actual antes de reintentar. Los diagnósticos públicos de tiempo de espera
incluyen campos estructurales como el último método de notificación de app-server,
el id/tipo/rol del elemento de respuesta sin procesar del asistente, los recuentos de solicitudes/elementos activos y el estado
de vigilancia activado. Cuando la última notificación es un elemento de respuesta sin procesar del asistente, también
incluyen una vista previa acotada del texto del asistente. No incluyen el prompt sin procesar ni
contenido de herramientas.

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
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` para pruebas locales puntuales. Se
prefiere la configuración para despliegues repetibles porque mantiene el comportamiento del plugin en el
mismo archivo revisado que el resto de la configuración del arnés de Codex.

## Plugins nativos de Codex

El soporte de plugins nativos de Codex usa las propias capacidades de aplicación y plugin
del app-server de Codex en el mismo hilo de Codex que el turno del arnés de OpenClaw. OpenClaw
no traduce plugins de Codex a herramientas dinámicas sintéticas `codex_plugin_*` de OpenClaw.

`codexPlugins` afecta solo a las sesiones que seleccionan el arnés nativo de Codex. No
tiene efecto en ejecuciones del arnés integrado, ejecuciones normales del proveedor OpenAI, enlaces de conversación ACP
u otros arneses.

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

La configuración de la aplicación del hilo se calcula cuando OpenClaw establece una sesión del arnés de Codex
o reemplaza un enlace obsoleto de hilo de Codex. No se recalcula en cada turno.
Después de cambiar `codexPlugins`, usa `/new`, `/reset` o reinicia el gateway para que
las futuras sesiones del arnés de Codex comiencen con el conjunto de aplicaciones actualizado.

Para la elegibilidad de migración, el inventario de aplicaciones, la política de acciones destructivas,
las elicitaciones y los diagnósticos de plugins nativos, consulta
[Plugins nativos de Codex](/es/plugins/codex-native-plugins).

El acceso a aplicaciones y plugins del lado de OpenAI está controlado por la cuenta de Codex con sesión iniciada
y, para espacios de trabajo Business y Enterprise/Edu, por los controles de aplicaciones del espacio de trabajo. Consulta
[Usar Codex con tu plan de ChatGPT](https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan)
para ver la descripción general de controles de cuenta y espacio de trabajo de OpenAI.

## Computer Use

Computer Use se cubre en su propia guía de configuración:
[Codex Computer Use](/es/plugins/codex-computer-use).

La versión corta: OpenClaw no incorpora la aplicación de control de escritorio ni ejecuta
acciones de escritorio por sí mismo. Prepara el app-server de Codex, verifica que el servidor MCP
`computer-use` esté disponible y luego permite que Codex sea propietario de las llamadas nativas a herramientas MCP
durante turnos en modo Codex.

## Límites de ejecución

El arnés de Codex cambia solo el ejecutor de agente embebido de bajo nivel.

- Las herramientas dinámicas de OpenClaw están soportadas. Codex solicita a OpenClaw que ejecute esas
  herramientas, por lo que OpenClaw permanece en la ruta de ejecución.
- Las herramientas nativas de shell, parche, MCP y aplicación de Codex pertenecen a Codex.
  OpenClaw puede observar o bloquear eventos nativos seleccionados mediante el retransmisor soportado,
  pero no reescribe argumentos de herramientas nativas.
- Codex es propietario de la compactación nativa. OpenClaw mantiene un espejo de transcripción para el historial
  del canal, búsqueda, `/new`, `/reset` y futuros cambios de modelo o arnés, pero
  no reemplaza la compactación de Codex con un resumidor de OpenClaw o de motor de contexto.
- La generación multimedia, la comprensión multimedia, TTS, las aprobaciones y la salida de herramientas de mensajería
  continúan mediante la configuración correspondiente de proveedor/modelo de OpenClaw.
- `tool_result_persist` se aplica a resultados de herramientas de transcripción propiedad de OpenClaw, no
  a registros de resultados de herramientas nativas de Codex.

Para capas de hooks, superficies V1 soportadas, manejo de permisos nativos, dirección de colas,
mecánica de carga de comentarios de Codex y detalles de compactación, consulta
[Ejecución del arnés de Codex](/es/plugins/codex-harness-runtime).

## Solución de problemas

**Codex no aparece como un proveedor normal de `/model`:** eso es lo esperado en
configuraciones nuevas. Selecciona un modelo `openai/gpt-*`, habilita
`plugins.entries.codex.enabled` y comprueba si `plugins.allow` excluye
`codex`.

**OpenClaw usa el arnés integrado en lugar de Codex:** asegúrate de que la referencia de modelo sea
`openai/gpt-*` en el proveedor oficial de OpenAI y de que el plugin de Codex esté
instalado y habilitado. Si necesitas una prueba estricta durante las pruebas, establece `agentRuntime.id: "codex"` en el proveedor o
modelo. Una ejecución de Codex forzada falla en lugar de
volver a OpenClaw.

**La ejecución OpenAI Codex vuelve a la ruta de clave de API:** recopila un extracto redactado
del gateway que muestre el modelo, la ejecución, el proveedor seleccionado y el fallo.
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
en lugar de un fallo simple de clave de API de OpenAI.

**Permanece la configuración de referencias de modelos Codex heredadas:** ejecuta `openclaw doctor --fix`.
Doctor reescribe las referencias de modelos heredadas a `openai/*`, elimina pines obsoletos de sesión y
de ejecución de agente completo, y conserva las anulaciones existentes de perfiles de autenticación.

**El app-server es rechazado:** usa el app-server de Codex `0.125.0` o posterior.
Las versiones preliminares de la misma versión o versiones con sufijo de compilación como
`0.125.0-alpha.2` o `0.125.0+custom` se rechazan porque OpenClaw comprueba el
piso estable del protocolo `0.125.0`.

**`/codex status` no puede conectar:** comprueba que el plugin `codex` incluido esté
habilitado, que `plugins.allow` lo incluya cuando se configure una lista de permitidos, y
que cualquier `appServer.command`, `url`, `authToken` o encabezados personalizados sean válidos.

**El descubrimiento de modelos es lento:** reduce
`plugins.entries.codex.config.discovery.timeoutMs` o deshabilita el descubrimiento. Consulta
[Referencia del arnés de Codex](/es/plugins/codex-harness-reference#model-discovery).

**El transporte WebSocket falla inmediatamente:** comprueba `appServer.url`, `authToken`,
los encabezados y que el app-server remoto hable la misma versión del protocolo de app-server
de Codex.

**Las herramientas nativas de shell o parche se bloquean con `Native hook relay unavailable`:**
el hilo de Codex todavía está intentando usar un id de retransmisor de hook nativo que OpenClaw ya
no tiene registrado. Esto es un problema de transporte de hook nativo de Codex, no un fallo del backend
ACP, del proveedor, de GitHub ni de comandos de shell. Inicia una sesión nueva en
el chat afectado con `/new` o `/reset`, y luego reintenta un comando inofensivo. Si eso
funciona una vez pero la siguiente llamada a herramienta nativa vuelve a fallar, trata `/new` solo como una solución temporal:
copia el prompt a una sesión nueva después de reiniciar el app-server de Codex
o el Gateway de OpenClaw para que se descarten los hilos antiguos y se recrean los registros de hooks
nativos.

**Un modelo que no es Codex usa el arnés integrado:** eso es lo esperado salvo que
la política de ejecución del proveedor o modelo lo enrute a otro arnés. Las referencias simples de proveedor que no son de OpenAI
permanecen en su ruta normal de proveedor en modo `auto`.

**Computer Use está instalado, pero las herramientas no se ejecutan:** comprueba
`/codex computer-use status` desde una sesión nueva. Si una herramienta informa
`Native hook relay unavailable`, usa la recuperación del relay de hooks nativos anterior. Consulta
[Codex Computer Use](/es/plugins/codex-computer-use#troubleshooting).

## Relacionado

- [Referencia del arnés de Codex](/es/plugins/codex-harness-reference)
- [Runtime del arnés de Codex](/es/plugins/codex-harness-runtime)
- [Plugins nativos de Codex](/es/plugins/codex-native-plugins)
- [Codex Computer Use](/es/plugins/codex-computer-use)
- [Runtimes de agente](/es/concepts/agent-runtimes)
- [Proveedores de modelos](/es/concepts/model-providers)
- [Proveedor de OpenAI](/es/providers/openai)
- [Ayuda de OpenAI Codex](https://help.openai.com/en/collections/14937394-codex)
- [Plugins de arnés de agente](/es/plugins/sdk-agent-harness)
- [Hooks de Plugin](/es/plugins/hooks)
- [Exportación de diagnósticos](/es/gateway/diagnostics)
- [Estado](/es/cli/status)
- [Pruebas](/es/help/testing-live#live-codex-app-server-harness-smoke)
