---
read_when:
    - Estás eligiendo entre PI, Codex, ACP u otro entorno de ejecución nativo para agentes
    - Te confunden las etiquetas de proveedor/modelo/entorno de ejecución en el estado o la configuración
    - Estás documentando la paridad de soporte para un arnés nativo
summary: Cómo OpenClaw separa los proveedores de modelos, los modelos, los canales y los entornos de ejecución de agentes
title: Entornos de ejecución de agentes
x-i18n:
    generated_at: "2026-05-02T05:23:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: bae2dd55491e5411983da942b2bdc4868d3b2cb5a4eb5d94fbb5a779dc4d679a
    source_path: concepts/agent-runtimes.md
    workflow: 16
---

Un **runtime de agente** es el componente que posee un bucle de modelo preparado: recibe el prompt, dirige la salida del modelo, gestiona llamadas a herramientas nativas y devuelve el turno finalizado a OpenClaw.

Los runtimes son fáciles de confundir con los proveedores porque ambos aparecen cerca de la configuración del modelo. Son capas distintas:

| Capa              | Ejemplos                              | Qué significa                                                               |
| ----------------- | ------------------------------------- | --------------------------------------------------------------------------- |
| Proveedor         | `openai`, `anthropic`, `openai-codex` | Cómo OpenClaw autentica, descubre modelos y nombra referencias de modelo.   |
| Modelo            | `gpt-5.5`, `claude-opus-4-6`          | El modelo seleccionado para el turno del agente.                            |
| Runtime de agente | `pi`, `codex`, `claude-cli`           | El bucle o backend de bajo nivel que ejecuta el turno preparado.            |
| Canal             | Telegram, Discord, Slack, WhatsApp    | Donde los mensajes entran y salen de OpenClaw.                              |

También verás la palabra **harness** en el código. Un harness es la implementación que proporciona un runtime de agente. Por ejemplo, el harness de Codex incluido implementa el runtime `codex`. La configuración pública usa `agentRuntime.id`; `openclaw doctor --fix` reescribe claves antiguas de política de runtime a esa forma.

Hay dos familias de runtimes:

- Los **harnesses embebidos** se ejecutan dentro del bucle de agente preparado de OpenClaw. Hoy esto incluye el runtime integrado `pi` más harnesses de Plugin registrados como `codex`.
- Los **backends de CLI** ejecutan un proceso de CLI local mientras mantienen canónica la referencia del modelo. Por ejemplo, `anthropic/claude-opus-4-7` con `agentRuntime.id: "claude-cli"` significa "seleccionar el modelo de Anthropic, ejecutar a través de Claude CLI". `claude-cli` no es un id de harness embebido y no debe pasarse a la selección de AgentHarness.

## Superficies de Codex

La mayor parte de la confusión viene de varias superficies distintas que comparten el nombre Codex:

| Superficie                                          | Nombre/configuración de OpenClaw          | Qué hace                                                                                                           |
| --------------------------------------------------- | ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Runtime nativo de servidor de aplicación de Codex   | `openai/*` más `agentRuntime.id: "codex"` | Ejecuta el turno de agente embebido mediante el servidor de aplicación de Codex. Esta es la configuración habitual de suscripción de ChatGPT/Codex. |
| Ruta de proveedor OAuth de Codex                    | referencias de modelo `openai-codex/*`    | Usa OAuth de suscripción de ChatGPT/Codex mediante el runner PI normal de OpenClaw.                                |
| Adaptador ACP de Codex                             | `runtime: "acp"`, `agentId: "codex"`      | Ejecuta Codex mediante el plano de control externo ACP/acpx. Úsalo solo cuando se pida explícitamente ACP/acpx.   |
| Conjunto nativo de comandos de control de chat Codex | `/codex ...`                              | Vincula, reanuda, dirige, detiene e inspecciona hilos del servidor de aplicación de Codex desde el chat.          |
| Ruta de API de OpenAI Platform para modelos estilo GPT/Codex | referencias de modelo `openai/*`          | Usa autenticación con clave de API de OpenAI salvo que un override de runtime, como `agentRuntime.id: "codex"`, ejecute el turno. |

Esas superficies son intencionalmente independientes. Habilitar el Plugin `codex` hace disponibles las funciones nativas del servidor de aplicación; no reescribe `openai-codex/*` como `openai/*`, no cambia sesiones existentes y no convierte ACP en el valor predeterminado de Codex. Seleccionar `openai-codex/*` significa "usar la ruta de proveedor OAuth de Codex" salvo que fuerces un runtime por separado.

La configuración habitual de suscripción de ChatGPT/Codex usa OAuth de Codex para la autenticación, pero mantiene la referencia del modelo como `openai/*` y selecciona el runtime `codex`:

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

Eso significa que OpenClaw selecciona una referencia de modelo de OpenAI y luego pide al runtime del servidor de aplicación de Codex que ejecute el turno de agente embebido. No significa "usar facturación de API", y no significa que el canal, el catálogo del proveedor de modelos o el almacén de sesiones de OpenClaw se conviertan en Codex.

Cuando el Plugin `codex` incluido está habilitado, el control de Codex en lenguaje natural debe usar la superficie nativa de comandos `/codex` (`/codex bind`, `/codex threads`, `/codex resume`, `/codex steer`, `/codex stop`) en lugar de ACP. Usa ACP para Codex solo cuando el usuario pida explícitamente ACP/acpx o esté probando la ruta del adaptador ACP. Claude Code, Gemini CLI, OpenCode, Cursor y harnesses externos similares siguen usando ACP.

Este es el árbol de decisión orientado al agente:

1. Si el usuario pide **vincular/controlar/hilo/reanudar/dirigir/detener Codex**, usa la superficie nativa de comandos `/codex` cuando el Plugin `codex` incluido esté habilitado.
2. Si el usuario pide **Codex como runtime embebido** o quiere la experiencia normal de agente Codex respaldada por suscripción, usa `openai/<model>` con `agentRuntime.id: "codex"`.
3. Si el usuario pide **autenticación OAuth/de suscripción de Codex en el runner normal de OpenClaw**, usa `openai-codex/<model>` y deja el runtime como PI.
4. Si el usuario dice explícitamente **ACP**, **acpx** o **adaptador ACP de Codex**, usa ACP con `runtime: "acp"` y `agentId: "codex"`.
5. Si la solicitud es para **Claude Code, Gemini CLI, OpenCode, Cursor, Droid u otro harness externo**, usa ACP/acpx, no el runtime nativo de subagente.

| Quieres decir...                                  | Usa...                                       |
| ------------------------------------------------- | -------------------------------------------- |
| Control de chat/hilo del servidor de aplicación de Codex | `/codex ...` desde el Plugin `codex` incluido |
| Runtime de agente embebido del servidor de aplicación de Codex | `agentRuntime.id: "codex"`                   |
| OAuth de OpenAI Codex en el runner PI             | referencias de modelo `openai-codex/*`       |
| Claude Code u otro harness externo                | ACP/acpx                                     |

Para la división de prefijos de la familia OpenAI, consulta [OpenAI](/es/providers/openai) y [Proveedores de modelos](/es/concepts/model-providers). Para el contrato de soporte del runtime Codex, consulta [Harness de Codex](/es/plugins/codex-harness#v1-support-contract).

## Propiedad del runtime

Distintos runtimes poseen distintas partes del bucle.

| Superficie                 | OpenClaw PI embebido                   | Servidor de aplicación de Codex                                              |
| -------------------------- | -------------------------------------- | ----------------------------------------------------------------------------- |
| Propietario del bucle de modelo | OpenClaw mediante el runner PI embebido | Servidor de aplicación de Codex                                               |
| Estado canónico del hilo   | Transcripción de OpenClaw              | Hilo de Codex, más espejo de transcripción de OpenClaw                        |
| Herramientas dinámicas de OpenClaw | Bucle nativo de herramientas de OpenClaw | Enlazadas mediante el adaptador de Codex                                      |
| Herramientas nativas de shell y archivos | Ruta PI/OpenClaw                       | Herramientas nativas de Codex, enlazadas mediante hooks nativos donde haya soporte |
| Motor de contexto          | Ensamblado de contexto nativo de OpenClaw | OpenClaw proyecta el contexto ensamblado en el turno de Codex                 |
| Compaction                 | OpenClaw o motor de contexto seleccionado | Compaction nativa de Codex, con notificaciones de OpenClaw y mantenimiento del espejo |
| Entrega por canal          | OpenClaw                               | OpenClaw                                                                      |

Esta división de propiedad es la regla principal de diseño:

- Si OpenClaw posee la superficie, OpenClaw puede proporcionar el comportamiento normal de hooks de Plugin.
- Si el runtime nativo posee la superficie, OpenClaw necesita eventos de runtime o hooks nativos.
- Si el runtime nativo posee el estado canónico del hilo, OpenClaw debe espejar y proyectar contexto, no reescribir internos no compatibles.

## Selección del runtime

OpenClaw elige un runtime embebido después de resolver el proveedor y el modelo:

1. El runtime registrado de una sesión tiene prioridad. Los cambios de configuración no cambian en caliente una transcripción existente a un sistema de hilos nativo distinto.
2. `OPENCLAW_AGENT_RUNTIME=<id>` fuerza ese runtime para sesiones nuevas o reiniciadas.
3. `agents.defaults.agentRuntime.id` o `agents.list[].agentRuntime.id` pueden establecer `auto`, `pi`, un id de harness embebido registrado como `codex` o un alias de backend de CLI compatible como `claude-cli`.
4. En modo `auto`, los runtimes de Plugin registrados pueden reclamar pares proveedor/modelo compatibles.
5. Si ningún runtime reclama un turno en modo `auto` y `fallback: "pi"` está establecido (el valor predeterminado), OpenClaw usa PI como fallback de compatibilidad. Establece `fallback: "none"` para hacer que falle en su lugar la selección no coincidente en modo `auto`.

Los runtimes de Plugin explícitos fallan cerrados de forma predeterminada. Por ejemplo, `agentRuntime.id: "codex"` significa Codex o un error de selección claro, salvo que establezcas `fallback: "pi"` en el mismo ámbito de override. Un override de runtime no hereda una configuración de fallback más amplia, así que un `agentRuntime.id: "codex"` a nivel de agente no se enruta silenciosamente de vuelta a PI solo porque los valores predeterminados usaban `fallback: "pi"`.

Los alias de backend de CLI son distintos de los ids de harness embebidos. La forma preferida de Claude CLI es:

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

Las referencias heredadas como `claude-cli/claude-opus-4-7` siguen siendo compatibles por compatibilidad, pero la configuración nueva debe mantener canónico el proveedor/modelo y poner el backend de ejecución en `agentRuntime.id`.

El modo `auto` es intencionalmente conservador. Los runtimes de Plugin pueden reclamar pares proveedor/modelo que entiendan, pero el Plugin de Codex no reclama el proveedor `openai-codex` en modo `auto`. Eso mantiene `openai-codex/*` como la ruta explícita PI OAuth de Codex y evita mover silenciosamente configuraciones de autenticación por suscripción al harness nativo del servidor de aplicación.

Si `openclaw doctor` advierte que el Plugin `codex` está habilitado mientras `openai-codex/*` todavía se enruta mediante PI, trata eso como un diagnóstico, no como una migración. Mantén la configuración sin cambios cuando PI OAuth de Codex sea lo que quieres. Cambia a `openai/<model>` más `agentRuntime.id: "codex"` solo cuando quieras ejecución nativa del servidor de aplicación de Codex.

## Contrato de compatibilidad

Cuando un runtime no es PI, debe documentar qué superficies de OpenClaw admite. Usa esta forma para la documentación de runtime:

| Pregunta                              | Por qué importa                                                                                         |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| ¿Quién posee el bucle del modelo?     | Determina dónde ocurren los reintentos, la continuación de herramientas y las decisiones de respuesta final. |
| ¿Quién posee el historial canónico del hilo? | Determina si OpenClaw puede editar el historial o solo reflejarlo.                                      |
| ¿Funcionan las herramientas dinámicas de OpenClaw? | La mensajería, las sesiones, cron y las herramientas propiedad de OpenClaw dependen de esto.            |
| ¿Funcionan los hooks de herramientas dinámicas? | Los plugins esperan `before_tool_call`, `after_tool_call` y middleware alrededor de las herramientas propiedad de OpenClaw. |
| ¿Funcionan los hooks de herramientas nativas? | Shell, patch y las herramientas propiedad del runtime necesitan soporte de hooks nativos para políticas y observación. |
| ¿Se ejecuta el ciclo de vida del motor de contexto? | Los plugins de memoria y contexto dependen de los ciclos de vida de ensamblado, ingesta, después del turno y compaction. |
| ¿Qué datos de compaction se exponen?  | Algunos plugins solo necesitan notificaciones, mientras que otros necesitan metadatos conservados/descartados. |
| ¿Qué no se admite intencionalmente?   | Los usuarios no deben asumir equivalencia con PI cuando el runtime nativo posee más estado.             |

El contrato de soporte del runtime de Codex está documentado en
[harness de Codex](/es/plugins/codex-harness#v1-support-contract).

## Etiquetas de estado

La salida de estado puede mostrar tanto las etiquetas `Execution` como `Runtime`. Léalas como
diagnósticos, no como nombres de proveedores.

- Una referencia de modelo como `openai/gpt-5.5` indica el proveedor/modelo seleccionado.
- Un id de runtime como `codex` indica qué bucle está ejecutando el turno.
- Una etiqueta de canal como Telegram o Discord indica dónde está ocurriendo la conversación.

Si una sesión todavía muestra PI después de cambiar la configuración del runtime, inicie una sesión nueva
con `/new` o borre la actual con `/reset`. Las sesiones existentes conservan su
runtime registrado para que una transcripción no se reproduzca a través de dos sistemas de sesión nativos
incompatibles.

## Relacionado

- [harness de Codex](/es/plugins/codex-harness)
- [OpenAI](/es/providers/openai)
- [plugins de harness de agente](/es/plugins/sdk-agent-harness)
- [Bucle de agente](/es/concepts/agent-loop)
- [Modelos](/es/concepts/models)
- [Estado](/es/cli/status)
