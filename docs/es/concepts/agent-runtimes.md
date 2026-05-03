---
read_when:
    - Estás eligiendo entre PI, Codex, ACP u otro entorno de ejecución nativo de agentes
    - Te confunden las etiquetas de proveedor/modelo/entorno de ejecución en el estado o la configuración
    - Estás documentando la paridad de soporte para un arnés nativo
summary: Cómo OpenClaw separa los proveedores de modelos, los modelos, los canales y los entornos de ejecución de agentes
title: Entornos de ejecución de agentes
x-i18n:
    generated_at: "2026-05-03T05:27:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6cd0e0e8508f88c04db63ebcbbca61d9a023ee661f59ea1ed7a1341b357088c7
    source_path: concepts/agent-runtimes.md
    workflow: 16
---

Un **runtime de agente** es el componente que posee un bucle de modelo preparado: recibe el prompt, impulsa la salida del modelo, gestiona las llamadas a herramientas nativas y devuelve el turno finalizado a OpenClaw.

Los runtimes son fáciles de confundir con los proveedores porque ambos aparecen cerca de la configuración del modelo. Son capas diferentes:

| Capa          | Ejemplos                              | Qué significa                                                       |
| ------------- | ------------------------------------- | ------------------------------------------------------------------- |
| Proveedor     | `openai`, `anthropic`, `openai-codex` | Cómo OpenClaw autentica, descubre modelos y nombra referencias de modelo. |
| Modelo        | `gpt-5.5`, `claude-opus-4-6`          | El modelo seleccionado para el turno del agente.                    |
| Runtime de agente | `pi`, `codex`, `claude-cli`       | El bucle de bajo nivel o backend que ejecuta el turno preparado.    |
| Canal         | Telegram, Discord, Slack, WhatsApp    | Dónde los mensajes entran y salen de OpenClaw.                      |

También verás la palabra **harness** en el código. Un harness es la implementación que proporciona un runtime de agente. Por ejemplo, el harness Codex incluido implementa el runtime `codex`. La configuración pública usa `agentRuntime.id`; `openclaw doctor --fix` reescribe claves de políticas de runtime anteriores a esa forma.

Hay dos familias de runtimes:

- Los **harnesses integrados** se ejecutan dentro del bucle de agente preparado de OpenClaw. Hoy esto es el runtime `pi` incorporado más harnesses de Plugin registrados como `codex`.
- Los **backends de CLI** ejecutan un proceso de CLI local mientras mantienen la referencia de modelo canónica. Por ejemplo, `anthropic/claude-opus-4-7` con `agentRuntime.id: "claude-cli"` significa "seleccionar el modelo de Anthropic, ejecutar mediante Claude CLI". `claude-cli` no es un id de harness integrado y no debe pasarse a la selección de AgentHarness.

## Superficies de Codex

La mayor parte de la confusión viene de varias superficies diferentes que comparten el nombre Codex:

| Superficie                                           | Nombre/configuración de OpenClaw            | Qué hace                                                                                                  |
| ---------------------------------------------------- | ------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Runtime nativo de app-server Codex                   | `openai/*` más `agentRuntime.id: "codex"`   | Ejecuta el turno de agente integrado mediante el app-server Codex. Esta es la configuración habitual de suscripción de ChatGPT/Codex. |
| Ruta del proveedor OAuth de Codex                    | referencias de modelo `openai-codex/*`      | Usa OAuth de suscripción de ChatGPT/Codex mediante el runner PI normal de OpenClaw.                       |
| Adaptador ACP de Codex                               | `runtime: "acp"`, `agentId: "codex"`        | Ejecuta Codex mediante el plano de control externo ACP/acpx. Úsalo solo cuando se pida explícitamente ACP/acpx. |
| Conjunto de comandos nativos de control de chat de Codex | `/codex ...`                            | Vincula, reanuda, dirige, detiene e inspecciona hilos del app-server Codex desde el chat.                 |
| Ruta de la API de OpenAI Platform para modelos estilo GPT/Codex | referencias de modelo `openai/*`    | Usa autenticación con clave de API de OpenAI salvo que una anulación de runtime, como `agentRuntime.id: "codex"`, ejecute el turno. |

Esas superficies son intencionadamente independientes. Activar el Plugin `codex` hace que las funciones nativas de app-server estén disponibles; no reescribe `openai-codex/*` como `openai/*`, no cambia las sesiones existentes y no convierte ACP en el valor predeterminado de Codex. Seleccionar `openai-codex/*` significa "usar la ruta del proveedor OAuth de Codex" salvo que fuerces por separado un runtime.

La configuración habitual de suscripción de ChatGPT/Codex usa OAuth de Codex para la autenticación, pero mantiene la referencia de modelo como `openai/*` y selecciona el runtime `codex`:

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      agentRuntime: {
        id: "codex",
      },
    },
  },
}
```

Eso significa que OpenClaw selecciona una referencia de modelo de OpenAI y luego pide al runtime de app-server Codex que ejecute el turno de agente integrado. No significa "usar facturación de API", y no significa que el canal, el catálogo de proveedores de modelos ni el almacén de sesiones de OpenClaw pasen a ser Codex.

Cuando el Plugin `codex` incluido está activado, el control de Codex en lenguaje natural debe usar la superficie nativa de comandos `/codex` (`/codex bind`, `/codex threads`, `/codex resume`, `/codex steer`, `/codex stop`) en lugar de ACP. Usa ACP para Codex solo cuando el usuario pida explícitamente ACP/acpx o esté probando la ruta del adaptador ACP. Claude Code, Gemini CLI, OpenCode, Cursor y harnesses externos similares siguen usando ACP.

Este es el árbol de decisiones orientado al agente:

1. Si el usuario pide **vincular/controlar/hilo/reanudar/dirigir/detener Codex**, usa la superficie nativa de comandos `/codex` cuando el Plugin `codex` incluido esté activado.
2. Si el usuario pide **Codex como runtime integrado** o quiere la experiencia normal de agente Codex respaldada por suscripción, usa `openai/<model>` con `agentRuntime.id: "codex"`.
3. Si el usuario pide **autenticación OAuth/suscripción de Codex en el runner normal de OpenClaw**, usa `openai-codex/<model>` y deja el runtime como PI.
4. Si el usuario dice explícitamente **ACP**, **acpx** o **adaptador ACP de Codex**, usa ACP con `runtime: "acp"` y `agentId: "codex"`.
5. Si la solicitud es para **Claude Code, Gemini CLI, OpenCode, Cursor, Droid u otro harness externo**, usa ACP/acpx, no el runtime nativo de subagente.

| Te refieres a...                       | Usa...                                      |
| -------------------------------------- | ------------------------------------------- |
| Control de chat/hilos del app-server Codex | `/codex ...` desde el Plugin `codex` incluido |
| Runtime de agente integrado del app-server Codex | `agentRuntime.id: "codex"`          |
| OAuth de OpenAI Codex en el runner PI  | referencias de modelo `openai-codex/*`      |
| Claude Code u otro harness externo     | ACP/acpx                                    |

Para la división de prefijos de la familia OpenAI, consulta [OpenAI](/es/providers/openai) y [Proveedores de modelos](/es/concepts/model-providers). Para el contrato de soporte del runtime Codex, consulta [Harness Codex](/es/plugins/codex-harness#v1-support-contract).

## Propiedad del runtime

Distintos runtimes poseen distintas partes del bucle.

| Superficie                  | PI integrado de OpenClaw                 | App-server Codex                                                            |
| --------------------------- | ---------------------------------------- | --------------------------------------------------------------------------- |
| Propietario del bucle de modelo | OpenClaw mediante el runner PI integrado | App-server Codex                                                            |
| Estado canónico del hilo    | Transcripción de OpenClaw                | Hilo de Codex, más espejo de transcripción de OpenClaw                      |
| Herramientas dinámicas de OpenClaw | Bucle de herramientas nativo de OpenClaw | Conectadas mediante el adaptador de Codex                                   |
| Herramientas nativas de shell y archivos | Ruta PI/OpenClaw              | Herramientas nativas de Codex, conectadas mediante hooks nativos donde sea compatible |
| Motor de contexto           | Ensamblaje de contexto nativo de OpenClaw | OpenClaw proyecta el contexto ensamblado en el turno de Codex               |
| Compaction                  | OpenClaw o motor de contexto seleccionado | Compaction nativa de Codex, con notificaciones de OpenClaw y mantenimiento del espejo |
| Entrega de canal            | OpenClaw                                 | OpenClaw                                                                    |

Esta división de propiedad es la regla principal de diseño:

- Si OpenClaw posee la superficie, OpenClaw puede proporcionar el comportamiento normal de hooks de Plugin.
- Si el runtime nativo posee la superficie, OpenClaw necesita eventos de runtime o hooks nativos.
- Si el runtime nativo posee el estado canónico del hilo, OpenClaw debe reflejar y proyectar contexto, no reescribir elementos internos no compatibles.

## Selección de runtime

OpenClaw elige un runtime integrado después de resolver el proveedor y el modelo:

1. El runtime registrado de una sesión gana. Los cambios de configuración no cambian en caliente una transcripción existente a un sistema de hilos nativo diferente.
2. `OPENCLAW_AGENT_RUNTIME=<id>` fuerza ese runtime para sesiones nuevas o reiniciadas.
3. `agents.defaults.agentRuntime.id` o `agents.list[].agentRuntime.id` pueden definir `auto`, `pi`, un id de harness integrado registrado como `codex` o un alias de backend de CLI compatible como `claude-cli`.
4. En modo `auto`, los runtimes de Plugin registrados pueden reclamar pares proveedor/modelo compatibles.
5. Si ningún runtime reclama un turno en modo `auto`, OpenClaw usa PI como runtime de compatibilidad. Usa un id de runtime explícito cuando la ejecución deba ser estricta.

Los runtimes explícitos de Plugin fallan de forma cerrada. Por ejemplo, `agentRuntime.id: "codex"` significa Codex o un error claro de selección/runtime; nunca se redirige silenciosamente de vuelta a PI.

Los alias de backend de CLI son diferentes de los ids de harness integrado. La forma preferida de Claude CLI es:

```json5
{
  agents: {
    defaults: {
      model: "anthropic/claude-opus-4-7",
      agentRuntime: { id: "claude-cli" },
    },
  },
}
```

Las referencias heredadas como `claude-cli/claude-opus-4-7` siguen siendo compatibles por compatibilidad, pero la configuración nueva debe mantener el proveedor/modelo canónico y poner el backend de ejecución en `agentRuntime.id`.

El modo `auto` es intencionadamente conservador. Los runtimes de Plugin pueden reclamar pares proveedor/modelo que entienden, pero el Plugin Codex no reclama el proveedor `openai-codex` en modo `auto`. Eso mantiene `openai-codex/*` como la ruta explícita de OAuth de Codex por PI y evita mover silenciosamente configuraciones de autenticación por suscripción al harness nativo de app-server.

Si `openclaw doctor` advierte que el Plugin `codex` está activado mientras `openai-codex/*` aún se enruta mediante PI, trata eso como un diagnóstico, no como una migración. Mantén la configuración sin cambios cuando OAuth de PI Codex sea lo que quieres. Cambia a `openai/<model>` más `agentRuntime.id: "codex"` solo cuando quieras ejecución nativa por el app-server Codex.

## Contrato de compatibilidad

Cuando un runtime no es PI, debe documentar qué superficies de OpenClaw admite. Usa esta forma para la documentación de runtime:

| Pregunta                               | Por qué importa                                                                                    |
| -------------------------------------- | -------------------------------------------------------------------------------------------------- |
| ¿Quién posee el bucle de modelo?       | Determina dónde ocurren los reintentos, la continuación de herramientas y las decisiones de respuesta final. |
| ¿Quién posee el historial canónico del hilo? | Determina si OpenClaw puede editar el historial o solo reflejarlo.                          |
| ¿Funcionan las herramientas dinámicas de OpenClaw? | La mensajería, las sesiones, Cron y las herramientas propiedad de OpenClaw dependen de esto. |
| ¿Funcionan los hooks de herramientas dinámicas? | Los Plugins esperan `before_tool_call`, `after_tool_call` y middleware alrededor de herramientas propiedad de OpenClaw. |
| ¿Funcionan los hooks de herramientas nativas? | Shell, patch y las herramientas propiedad del runtime necesitan soporte de hooks nativos para políticas y observación. |
| ¿Se ejecuta el ciclo de vida del motor de contexto? | Los Plugins de memoria y contexto dependen de assemble, ingest, after-turn y el ciclo de vida de Compaction. |
| ¿Qué datos de Compaction se exponen?   | Algunos Plugins solo necesitan notificaciones, mientras que otros necesitan metadatos conservados/descartados. |
| ¿Qué no es compatible de forma intencional? | Los usuarios no deben asumir equivalencia con PI cuando el runtime nativo posee más estado. |

El contrato de soporte del runtime Codex está documentado en [Harness Codex](/es/plugins/codex-harness#v1-support-contract).

## Etiquetas de estado

La salida de estado puede mostrar las etiquetas `Execution` y `Runtime`. Léelas como
diagnósticos, no como nombres de proveedores.

- Una referencia de modelo como `openai/gpt-5.5` te indica el proveedor/modelo seleccionado.
- Un id de runtime como `codex` te indica qué bucle está ejecutando el turno.
- Una etiqueta de canal como Telegram o Discord te indica dónde está ocurriendo la conversación.

Si una sesión todavía muestra PI después de cambiar la configuración de runtime, inicia una sesión nueva
con `/new` o borra la actual con `/reset`. Las sesiones existentes conservan su
runtime registrado para que una transcripción no se reproduzca a través de dos sistemas de sesión nativos
incompatibles.

## Relacionado

- [Arnés de Codex](/es/plugins/codex-harness)
- [OpenAI](/es/providers/openai)
- [Plugins de arnés de agente](/es/plugins/sdk-agent-harness)
- [Bucle de agente](/es/concepts/agent-loop)
- [Modelos](/es/concepts/models)
- [Estado](/es/cli/status)
