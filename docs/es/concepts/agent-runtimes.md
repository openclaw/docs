---
read_when:
    - Estás eligiendo entre PI, Codex, ACP u otro runtime de agente nativo
    - Estás confundido por las etiquetas de proveedor/modelo/runtime en el estado o la configuración
    - Estás documentando la paridad de compatibilidad para un arnés nativo
summary: Cómo OpenClaw separa proveedores de modelos, modelos, canales y runtimes de agentes
title: Runtimes de agentes
x-i18n:
    generated_at: "2026-04-26T11:26:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: f99e88a47a78c48b2f2408a3feedf15cde66a6bacc4e7bfadb9e47c74f7ce633
    source_path: concepts/agent-runtimes.md
    workflow: 15
---

Un **runtime de agente** es el componente que posee un bucle de modelo preparado: recibe el prompt, conduce la salida del modelo, maneja llamadas nativas a herramientas y devuelve el turno terminado a OpenClaw.

Es fácil confundir los runtimes con los proveedores porque ambos aparecen cerca de la configuración del modelo. Son capas diferentes:

| Capa          | Ejemplos                              | Qué significa                                                       |
| ------------- | ------------------------------------- | ------------------------------------------------------------------- |
| Proveedor     | `openai`, `anthropic`, `openai-codex` | Cómo OpenClaw autentica, descubre modelos y nombra referencias de modelo. |
| Modelo        | `gpt-5.5`, `claude-opus-4-6`          | El modelo seleccionado para el turno del agente.                    |
| Runtime de agente | `pi`, `codex`, `claude-cli`       | El bucle de bajo nivel o backend que ejecuta el turno preparado.    |
| Canal         | Telegram, Discord, Slack, WhatsApp    | Dónde entran y salen los mensajes de OpenClaw.                      |

También verás la palabra **arnés** en el código. Un arnés es la implementación que proporciona un runtime de agente. Por ejemplo, el arnés Codex incluido implementa el runtime `codex`. La configuración pública usa `agentRuntime.id`; `openclaw doctor --fix` reescribe las claves antiguas de política de runtime a esa forma.

Hay dos familias de runtime:

- Los **arneses integrados** se ejecutan dentro del bucle de agente preparado de OpenClaw. Hoy esto es el runtime integrado `pi` más arneses de Plugin registrados como `codex`.
- Los **backends de CLI** ejecutan un proceso de CLI local mientras mantienen canónica la referencia del modelo. Por ejemplo, `anthropic/claude-opus-4-7` con `agentRuntime.id: "claude-cli"` significa "selecciona el modelo de Anthropic, ejecútalo mediante Claude CLI". `claude-cli` no es un id de arnés integrado y no debe pasarse a la selección de AgentHarness.

## Tres cosas llamadas Codex

La mayor parte de la confusión viene de tres superficies diferentes que comparten el nombre Codex:

| Superficie                                           | Nombre/configuración en OpenClaw      | Qué hace                                                                                           |
| ---------------------------------------------------- | ------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Ruta de proveedor OAuth de Codex                     | referencias de modelo `openai-codex/*` | Usa OAuth de suscripción de ChatGPT/Codex a través del runner PI normal de OpenClaw.              |
| Runtime nativo de servidor de aplicaciones Codex     | `agentRuntime.id: "codex"`            | Ejecuta el turno de agente integrado a través del arnés de servidor de aplicaciones Codex incluido. |
| Adaptador ACP de Codex                               | `runtime: "acp"`, `agentId: "codex"`  | Ejecuta Codex a través del plano de control externo ACP/acpx. Úsalo solo cuando se pida ACP/acpx explícitamente. |
| Conjunto nativo de comandos de control de chat de Codex | `/codex ...`                       | Vincula, reanuda, guía, detiene e inspecciona hilos del servidor de aplicaciones Codex desde el chat. |
| Ruta de API de OpenAI Platform para modelos de estilo GPT/Codex | referencias de modelo `openai/*` | Usa autenticación por clave API de OpenAI salvo que una anulación de runtime, como `runtime: "codex"`, ejecute el turno. |

Estas superficies son intencionadamente independientes. Habilitar el Plugin `codex` hace que las funciones nativas del servidor de aplicaciones estén disponibles; no reescribe `openai-codex/*` a `openai/*`, no cambia las sesiones existentes y no hace que ACP sea el valor predeterminado de Codex. Seleccionar `openai-codex/*` significa "usar la ruta del proveedor OAuth de Codex" salvo que fuerces un runtime por separado.

La configuración común de Codex usa el proveedor `openai` con el runtime `codex`:

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

Eso significa que OpenClaw selecciona una referencia de modelo de OpenAI y luego pide al runtime del servidor de aplicaciones Codex que ejecute el turno de agente integrado. No significa que el canal, el catálogo del proveedor de modelos o el almacén de sesiones de OpenClaw pasen a ser Codex.

Cuando el Plugin `codex` incluido está habilitado, el control de Codex en lenguaje natural debe usar la superficie de comandos nativa `/codex` (`/codex bind`, `/codex threads`, `/codex resume`, `/codex steer`, `/codex stop`) en lugar de ACP. Usa ACP para Codex solo cuando el usuario pida explícitamente ACP/acpx o esté probando la ruta del adaptador ACP. Claude Code, Gemini CLI, OpenCode, Cursor y arneses externos similares siguen usando ACP.

Este es el árbol de decisión orientado al agente:

1. Si el usuario pide **vincular/controlar/hilo/reanudar/guiar/detener Codex**, usa la superficie de comandos nativa `/codex` cuando el Plugin `codex` incluido esté habilitado.
2. Si el usuario pide **Codex como runtime integrado**, usa `openai/<model>` con `agentRuntime.id: "codex"`.
3. Si el usuario pide **OAuth/autenticación por suscripción de Codex en el runner normal de OpenClaw**, usa `openai-codex/<model>` y deja PI como runtime.
4. Si el usuario dice explícitamente **ACP**, **acpx** o **adaptador ACP de Codex**, usa ACP con `runtime: "acp"` y `agentId: "codex"`.
5. Si la solicitud es para **Claude Code, Gemini CLI, OpenCode, Cursor, Droid u otro arnés externo**, usa ACP/acpx, no el runtime nativo de subagente.

| Quieres decir...                        | Usa...                                       |
| --------------------------------------- | -------------------------------------------- |
| Control de chat/hilo del servidor de aplicaciones Codex | `/codex ...` del Plugin `codex` incluido |
| Runtime de agente integrado del servidor de aplicaciones Codex | `agentRuntime.id: "codex"`         |
| OAuth de OpenAI Codex en el runner PI   | referencias de modelo `openai-codex/*`       |
| Claude Code u otro arnés externo        | ACP/acpx                                     |

Para la división de prefijos de la familia OpenAI, consulta [OpenAI](/es/providers/openai) y
[Proveedores de modelos](/es/concepts/model-providers). Para el contrato de compatibilidad
del runtime de Codex, consulta [Arnés Codex](/es/plugins/codex-harness#v1-support-contract).

## Propiedad del runtime

Diferentes runtimes poseen distintas partes del bucle.

| Superficie                  | PI integrado de OpenClaw                | Servidor de aplicaciones Codex                                               |
| --------------------------- | --------------------------------------- | ----------------------------------------------------------------------------- |
| Propietario del bucle de modelo | OpenClaw mediante el runner PI integrado | Servidor de aplicaciones Codex                                             |
| Estado canónico del hilo    | Transcripción de OpenClaw               | Hilo de Codex, más espejo de transcripción de OpenClaw                        |
| Herramientas dinámicas de OpenClaw | Bucle nativo de herramientas de OpenClaw | Conectadas mediante el adaptador Codex                                   |
| Herramientas nativas de shell y archivos | Ruta PI/OpenClaw                 | Herramientas nativas de Codex, conectadas mediante hooks nativos cuando se admite |
| Motor de contexto           | Ensamblado nativo de contexto de OpenClaw | OpenClaw proyecta el contexto ensamblado en el turno de Codex              |
| Compaction                  | OpenClaw o el motor de contexto seleccionado | Compaction nativa de Codex, con notificaciones de OpenClaw y mantenimiento del espejo |
| Entrega de canal            | OpenClaw                                | OpenClaw                                                                      |

Esta división de propiedad es la principal regla de diseño:

- Si OpenClaw posee la superficie, OpenClaw puede proporcionar el comportamiento normal de hooks de Plugin.
- Si el runtime nativo posee la superficie, OpenClaw necesita eventos de runtime o hooks nativos.
- Si el runtime nativo posee el estado canónico del hilo, OpenClaw debe reflejar y proyectar contexto, no reescribir componentes internos no compatibles.

## Selección de runtime

OpenClaw elige un runtime integrado después de resolver el proveedor y el modelo:

1. Gana el runtime registrado de una sesión. Los cambios de configuración no cambian en caliente una transcripción existente a un sistema de hilo nativo diferente.
2. `OPENCLAW_AGENT_RUNTIME=<id>` fuerza ese runtime para sesiones nuevas o reiniciadas.
3. `agents.defaults.agentRuntime.id` o `agents.list[].agentRuntime.id` pueden establecer
   `auto`, `pi`, un id de arnés integrado registrado como `codex`, o un
   alias de backend CLI compatible como `claude-cli`.
4. En modo `auto`, los runtimes de Plugin registrados pueden reclamar pares proveedor/modelo compatibles.
5. Si ningún runtime reclama un turno en modo `auto` y está configurado
   `fallback: "pi"` (el valor predeterminado), OpenClaw usa PI como alternativa de compatibilidad. Configura
   `fallback: "none"` para que la selección no coincidente en modo `auto` falle.

Los runtimes de Plugin explícitos fallan en modo cerrado de forma predeterminada. Por ejemplo,
`runtime: "codex"` significa Codex o un error claro de selección, salvo que configures
`fallback: "pi"` en el mismo ámbito de anulación. Una anulación de runtime no hereda
una configuración de fallback más amplia, así que un `runtime: "codex"` a nivel de agente no se enruta
silenciosamente de vuelta a PI solo porque los valores predeterminados usaran `fallback: "pi"`.

Los alias de backend CLI son diferentes de los ids de arnés integrado. La forma preferida para Claude CLI es:

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

Las referencias heredadas como `claude-cli/claude-opus-4-7` siguen siendo compatibles por
compatibilidad, pero la configuración nueva debe mantener canónicos el proveedor/modelo y poner
el backend de ejecución en `agentRuntime.id`.

El modo `auto` es intencionadamente conservador. Los runtimes de Plugin pueden reclamar
pares proveedor/modelo que entiendan, pero el Plugin Codex no reclama el proveedor
`openai-codex` en modo `auto`. Eso mantiene
`openai-codex/*` como la ruta PI explícita de OAuth de Codex y evita mover
silenciosamente configuraciones con autenticación por suscripción al arnés nativo de servidor de aplicaciones.

Si `openclaw doctor` advierte que el Plugin `codex` está habilitado mientras
`openai-codex/*` sigue enrutándose mediante PI, trátalo como un diagnóstico, no como una
migración. Mantén la configuración sin cambios cuando PI Codex OAuth sea lo que quieres.
Cambia a `openai/<model>` más `agentRuntime.id: "codex"` solo cuando quieras ejecución nativa
del servidor de aplicaciones Codex.

## Contrato de compatibilidad

Cuando un runtime no es PI, debe documentar qué superficies de OpenClaw admite.
Usa esta forma para la documentación de runtime:

| Pregunta                               | Por qué importa                                                                                   |
| -------------------------------------- | ------------------------------------------------------------------------------------------------- |
| ¿Quién posee el bucle del modelo?      | Determina dónde ocurren los reintentos, la continuación de herramientas y las decisiones de respuesta final. |
| ¿Quién posee el historial canónico del hilo? | Determina si OpenClaw puede editar el historial o solo reflejarlo.                           |
| ¿Funcionan las herramientas dinámicas de OpenClaw? | La mensajería, las sesiones, Cron y las herramientas propiedad de OpenClaw dependen de esto. |
| ¿Funcionan los hooks de herramientas dinámicas? | Los plugins esperan `before_tool_call`, `after_tool_call` y middleware alrededor de herramientas propiedad de OpenClaw. |
| ¿Funcionan los hooks de herramientas nativas? | Shell, patch y herramientas propiedad del runtime necesitan compatibilidad de hooks nativos para política y observación. |
| ¿Se ejecuta el ciclo de vida del motor de contexto? | Los plugins de memoria y contexto dependen del ciclo de vida de ensamblado, ingestión, posgiro y compaction. |
| ¿Qué datos de compaction se exponen?   | Algunos plugins solo necesitan notificaciones, mientras que otros necesitan metadatos conservados/descartados. |
| ¿Qué no es compatible intencionadamente? | Los usuarios no deben asumir equivalencia con PI donde el runtime nativo posee más estado.      |

El contrato de compatibilidad del runtime de Codex está documentado en
[Arnés Codex](/es/plugins/codex-harness#v1-support-contract).

## Etiquetas de estado

La salida de estado puede mostrar tanto etiquetas `Execution` como `Runtime`. Léelas como
diagnósticos, no como nombres de proveedores.

- Una referencia de modelo como `openai/gpt-5.5` te indica el proveedor/modelo seleccionado.
- Un id de runtime como `codex` te indica qué bucle está ejecutando el turno.
- Una etiqueta de canal como Telegram o Discord te indica dónde está ocurriendo la conversación.

Si una sesión sigue mostrando PI después de cambiar la configuración del runtime, inicia una nueva sesión
con `/new` o limpia la actual con `/reset`. Las sesiones existentes conservan su
runtime registrado para que una transcripción no se reproduzca a través de dos sistemas
de sesión nativa incompatibles.

## Relacionado

- [Arnés Codex](/es/plugins/codex-harness)
- [OpenAI](/es/providers/openai)
- [Plugins de arnés de agente](/es/plugins/sdk-agent-harness)
- [Bucle de agente](/es/concepts/agent-loop)
- [Modelos](/es/concepts/models)
- [Estado](/es/cli/status)
