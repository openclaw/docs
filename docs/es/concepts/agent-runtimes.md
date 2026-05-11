---
read_when:
    - Estás eligiendo entre PI, Codex, ACP u otro entorno de ejecución de agente nativo
    - Te confunden las etiquetas de proveedor/modelo/entorno de ejecución en el estado o la configuración
    - Estás documentando la paridad de soporte para un entorno nativo
summary: Cómo OpenClaw separa los proveedores de modelos, los modelos, los canales y los entornos de ejecución de agentes
title: Entornos de ejecución de agentes
x-i18n:
    generated_at: "2026-05-11T20:29:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: dc5493bbcfb9fd60d4060455215780ca752040cc09b1b5a4d05bd84a59ce5a1e
    source_path: concepts/agent-runtimes.md
    workflow: 16
---

Un **entorno de ejecución de agente** es el componente que posee un bucle de modelo preparado: recibe el prompt, dirige la salida del modelo, maneja las llamadas nativas a herramientas y devuelve el turno finalizado a OpenClaw.

Los entornos de ejecución son fáciles de confundir con los proveedores porque ambos aparecen cerca de la configuración del modelo. Son capas diferentes:

| Capa          | Ejemplos                              | Qué significa                                                       |
| ------------- | ------------------------------------- | ------------------------------------------------------------------- |
| Proveedor     | `openai`, `anthropic`, `openai-codex` | Cómo OpenClaw autentica, descubre modelos y nombra referencias de modelo. |
| Modelo        | `gpt-5.5`, `claude-opus-4-6`          | El modelo seleccionado para el turno del agente.                    |
| Entorno de ejecución de agente | `pi`, `codex`, `claude-cli`           | El bucle de bajo nivel o backend que ejecuta el turno preparado.    |
| Canal         | Telegram, Discord, Slack, WhatsApp    | Dónde entran y salen los mensajes de OpenClaw.                      |

También verás la palabra **harness** en el código. Un harness es la implementación que proporciona un entorno de ejecución de agente. Por ejemplo, el harness de Codex incluido implementa el entorno de ejecución `codex`. La configuración pública usa `agentRuntime.id` en entradas de proveedor o modelo; las claves de entorno de ejecución para todo el agente son heredadas y se ignoran. `openclaw doctor --fix` elimina los antiguos pines de entorno de ejecución para todo el agente y reescribe referencias de modelo de entorno de ejecución heredadas a referencias canónicas de proveedor/modelo, además de política de entorno de ejecución con alcance de modelo cuando es necesario.

Hay dos familias de entornos de ejecución:

- Los **harnesses embebidos** se ejecutan dentro del bucle de agente preparado de OpenClaw. Hoy esto es el entorno de ejecución integrado `pi` más los harnesses de Plugin registrados, como `codex`.
- Los **backends de CLI** ejecutan un proceso de CLI local mientras mantienen canónica la referencia del modelo. Por ejemplo, `anthropic/claude-opus-4-7` con un `agentRuntime.id: "claude-cli"` con alcance de modelo significa "seleccionar el modelo de Anthropic, ejecutar mediante Claude CLI." `claude-cli` no es un id de harness embebido y no debe pasarse a la selección de AgentHarness.

## Superficies de Codex

La mayor parte de la confusión proviene de varias superficies diferentes que comparten el nombre Codex:

| Superficie                                      | Nombre/configuración de OpenClaw       | Qué hace                                                                                                      |
| ------------------------------------------------ | ------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| Entorno de ejecución nativo de app-server de Codex | referencias de modelo `openai/*`     | Ejecuta turnos de agente embebidos de OpenAI mediante el app-server de Codex. Esta es la configuración habitual de suscripción de ChatGPT/Codex. |
| Perfiles de autenticación OAuth de Codex        | proveedor de autenticación `openai-codex` | Almacena la autenticación de suscripción de ChatGPT/Codex que consume el harness de app-server de Codex.       |
| Adaptador ACP de Codex                         | `runtime: "acp"`, `agentId: "codex"` | Ejecuta Codex mediante el plano de control externo ACP/acpx. Úsalo solo cuando se pida explícitamente ACP/acpx. |
| Conjunto nativo de comandos de control de chat de Codex | `/codex ...`                         | Vincula, reanuda, dirige, detiene e inspecciona hilos de app-server de Codex desde el chat.                   |
| Ruta de API de OpenAI Platform para superficies que no son de agente | `openai/*` más autenticación con clave de API | Se usa para APIs directas de OpenAI, como imágenes, embeddings, voz y tiempo real.                            |

Esas superficies son intencionalmente independientes. Habilitar el Plugin `codex` hace que las funciones nativas de app-server estén disponibles; `openclaw doctor --fix` posee la reparación de rutas heredadas `openai-codex/*` y la limpieza de pines de sesión obsoletos. Seleccionar `openai/*` para un modelo de agente ahora significa "ejecutar esto mediante Codex", a menos que se esté usando una superficie de API de OpenAI que no sea de agente.

La configuración común de suscripción de ChatGPT/Codex usa OAuth de Codex para la autenticación, pero mantiene la referencia del modelo como `openai/*` y selecciona el entorno de ejecución `codex`:

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
    },
  },
}
```

Eso significa que OpenClaw selecciona una referencia de modelo de OpenAI y luego le pide al entorno de ejecución de app-server de Codex que ejecute el turno de agente embebido. No significa "usar facturación de API", y no significa que el canal, el catálogo de proveedores de modelos o el almacén de sesiones de OpenClaw se conviertan en Codex.

Cuando el Plugin `codex` incluido está habilitado, el control de Codex en lenguaje natural debe usar la superficie nativa de comandos `/codex` (`/codex bind`, `/codex threads`, `/codex resume`, `/codex steer`, `/codex stop`) en lugar de ACP. Usa ACP para Codex solo cuando el usuario pida explícitamente ACP/acpx o esté probando la ruta del adaptador ACP. Claude Code, Gemini CLI, OpenCode, Cursor y harnesses externos similares siguen usando ACP.

Este es el árbol de decisiones orientado al agente:

1. Si el usuario pide **vincular/controlar/hilo/reanudar/dirigir/detener Codex**, usa la superficie nativa de comandos `/codex` cuando el Plugin `codex` incluido esté habilitado.
2. Si el usuario pide **Codex como entorno de ejecución embebido** o quiere la experiencia normal de agente de Codex respaldada por suscripción, usa `openai/<model>`.
3. Si el usuario elige explícitamente **PI para un modelo de OpenAI**, conserva la referencia de modelo como `openai/<model>` y establece la política de entorno de ejecución del proveedor/modelo en `agentRuntime.id: "pi"`. Un perfil de autenticación `openai-codex` seleccionado se enruta internamente mediante el transporte heredado de autenticación de Codex de PI.
4. Si la configuración heredada todavía contiene **referencias de modelo `openai-codex/*`**, repárala a `openai/<model>` con `openclaw doctor --fix`; doctor conserva la ruta de autenticación de Codex agregando `agentRuntime.id: "codex"` con alcance de proveedor/modelo donde la antigua referencia de modelo lo implicaba.
5. Si el usuario dice explícitamente **ACP**, **acpx** o **adaptador ACP de Codex**, usa ACP con `runtime: "acp"` y `agentId: "codex"`.
6. Si la solicitud es para **Claude Code, Gemini CLI, OpenCode, Cursor, Droid u otro harness externo**, usa ACP/acpx, no el entorno de ejecución nativo de subagente.

| Quieres decir...                         | Usa...                                       |
| --------------------------------------- | -------------------------------------------- |
| Control de chat/hilos de app-server de Codex | `/codex ...` desde el Plugin `codex` incluido |
| Entorno de ejecución de agente embebido de app-server de Codex | referencias de modelo de agente `openai/*` |
| OAuth de OpenAI Codex                   | perfiles de autenticación `openai-codex`     |
| Claude Code u otro harness externo      | ACP/acpx                                     |

Para la división de prefijos de la familia OpenAI, consulta [OpenAI](/es/providers/openai) y [Proveedores de modelos](/es/concepts/model-providers). Para el contrato de soporte del entorno de ejecución de Codex, consulta [Entorno de ejecución del harness de Codex](/es/plugins/codex-harness-runtime#v1-support-contract).

## Propiedad del entorno de ejecución

Distintos entornos de ejecución poseen distintas partes del bucle.

| Superficie                  | OpenClaw PI embebido                    | App-server de Codex                                                        |
| --------------------------- | --------------------------------------- | --------------------------------------------------------------------------- |
| Propietario del bucle del modelo | OpenClaw mediante el runner embebido de PI | App-server de Codex                                                         |
| Estado canónico del hilo    | Transcripción de OpenClaw               | Hilo de Codex, más espejo de la transcripción de OpenClaw                   |
| Herramientas dinámicas de OpenClaw | Bucle nativo de herramientas de OpenClaw | Puenteadas mediante el adaptador de Codex                                  |
| Herramientas nativas de shell y archivos | Ruta PI/OpenClaw                        | Herramientas nativas de Codex, puenteadas mediante hooks nativos cuando hay soporte |
| Motor de contexto           | Ensamblaje de contexto nativo de OpenClaw | OpenClaw proyecta el contexto ensamblado en el turno de Codex              |
| Compaction                  | OpenClaw o motor de contexto seleccionado | Compaction nativa de Codex, con notificaciones de OpenClaw y mantenimiento de espejo |
| Entrega de canal            | OpenClaw                                | OpenClaw                                                                    |

Esta división de propiedad es la principal regla de diseño:

- Si OpenClaw posee la superficie, OpenClaw puede proporcionar el comportamiento normal de hooks de Plugin.
- Si el entorno de ejecución nativo posee la superficie, OpenClaw necesita eventos de entorno de ejecución o hooks nativos.
- Si el entorno de ejecución nativo posee el estado canónico del hilo, OpenClaw debe reflejar y proyectar contexto, no reescribir internals no admitidos.

## Selección del entorno de ejecución

OpenClaw elige un entorno de ejecución embebido después de resolver el proveedor y el modelo:

1. La política de entorno de ejecución con alcance de modelo gana. Puede vivir en una entrada de modelo de proveedor configurada o en `agents.defaults.models["provider/model"].agentRuntime` / `agents.list[].models["provider/model"].agentRuntime`.
2. La política de entorno de ejecución con alcance de proveedor viene después en `models.providers.<provider>.agentRuntime`.
3. En modo `auto`, los entornos de ejecución de Plugin registrados pueden reclamar pares de proveedor/modelo compatibles.
4. Si ningún entorno de ejecución reclama un turno en modo `auto`, OpenClaw usa PI como entorno de ejecución de compatibilidad. Usa un id de entorno de ejecución explícito cuando la ejecución deba ser estricta.

Los pines de entorno de ejecución de sesión completa y de agente completo se ignoran. Eso incluye `OPENCLAW_AGENT_RUNTIME`, el estado de sesión `agentHarnessId`/`agentRuntimeOverride`, `agents.defaults.agentRuntime` y `agents.list[].agentRuntime`. Ejecuta `openclaw doctor --fix` para eliminar la configuración obsoleta de entorno de ejecución de agente completo y convertir referencias de modelo de entorno de ejecución heredadas donde OpenClaw pueda preservar la intención.

Los entornos de ejecución de Plugin explícitos de proveedor/modelo fallan cerrados. Por ejemplo, `agentRuntime.id: "codex"` en un proveedor o modelo significa Codex o un error claro de selección/entorno de ejecución; nunca se enruta silenciosamente de vuelta a PI.

Los alias de backend de CLI son diferentes de los ids de harness embebidos. La forma preferida de Claude CLI es:

```json5
{
  agents: {
    defaults: {
      model: "anthropic/claude-opus-4-7",
      models: {
        "anthropic/claude-opus-4-7": {
          agentRuntime: { id: "claude-cli" },
        },
      },
    },
  },
}
```

Las referencias heredadas como `claude-cli/claude-opus-4-7` siguen siendo compatibles por compatibilidad, pero la configuración nueva debe mantener canónico el proveedor/modelo y poner el backend de ejecución en la política de entorno de ejecución de proveedor/modelo.

El modo `auto` es intencionalmente conservador para la mayoría de los proveedores. Los modelos de agente de OpenAI son la excepción: tanto el entorno de ejecución sin configurar como `auto` se resuelven al harness de Codex. La configuración explícita de entorno de ejecución PI sigue siendo una ruta de compatibilidad opcional para turnos de agente `openai/*`; cuando se combina con un perfil de autenticación `openai-codex` seleccionado, OpenClaw enruta PI internamente mediante el transporte heredado de autenticación de Codex mientras mantiene la referencia pública del modelo como `openai/*`. Los pines obsoletos de sesión PI de OpenAI se ignoran en la selección del entorno de ejecución y se pueden limpiar con `openclaw doctor --fix`.

Si `openclaw doctor` advierte que el Plugin `codex` está habilitado mientras `openai-codex/*` permanece en la configuración, trata eso como estado de ruta heredada. Ejecuta `openclaw doctor --fix` para reescribirlo a `openai/*` con el entorno de ejecución de Codex.

## Contrato de compatibilidad

Cuando un entorno de ejecución no es PI, debe documentar qué superficies de OpenClaw admite. Usa esta forma para la documentación del entorno de ejecución:

| Pregunta                               | Por qué importa                                                                                    |
| -------------------------------------- | ------------------------------------------------------------------------------------------------- |
| ¿Quién controla el bucle del modelo?   | Determina dónde ocurren los reintentos, la continuación de herramientas y las decisiones sobre la respuesta final. |
| ¿Quién controla el historial canónico del hilo? | Determina si OpenClaw puede editar el historial o solo reflejarlo.                                   |
| ¿Funcionan las herramientas dinámicas de OpenClaw? | La mensajería, las sesiones, cron y las herramientas propiedad de OpenClaw dependen de esto.                                 |
| ¿Funcionan los hooks de herramientas dinámicas? | Los plugins esperan `before_tool_call`, `after_tool_call` y middleware alrededor de las herramientas propiedad de OpenClaw. |
| ¿Funcionan los hooks de herramientas nativas? | Las herramientas de shell, patch y las propiedad del entorno de ejecución necesitan compatibilidad con hooks nativos para políticas y observación.        |
| ¿Se ejecuta el ciclo de vida del motor de contexto? | Los plugins de memoria y contexto dependen de los ciclos de vida de ensamblaje, ingesta, después del turno y compaction.      |
| ¿Qué datos de compaction se exponen?   | Algunos plugins solo necesitan notificaciones, mientras que otros necesitan metadatos conservados/eliminados.                    |
| ¿Qué no está admitido intencionalmente? | Los usuarios no deben asumir equivalencia con PI cuando el entorno de ejecución nativo controla más estado.                  |

El contrato de compatibilidad del entorno de ejecución de Codex está documentado en
[entorno de ejecución del arnés de Codex](/es/plugins/codex-harness-runtime#v1-support-contract).

## Etiquetas de estado

La salida de estado puede mostrar tanto las etiquetas `Execution` como `Runtime`. Léelas como
diagnósticos, no como nombres de proveedores.

- Una referencia de modelo como `openai/gpt-5.5` indica el proveedor/modelo seleccionado.
- Un identificador de entorno de ejecución como `codex` indica qué bucle está ejecutando el turno.
- Una etiqueta de canal como Telegram o Discord indica dónde está ocurriendo la conversación.

Si una ejecución todavía muestra un entorno de ejecución inesperado, inspecciona primero la política de entorno de ejecución del proveedor/modelo seleccionado. Las fijaciones de entorno de ejecución de sesiones heredadas ya no deciden el enrutamiento.

## Relacionado

- [Arnés de Codex](/es/plugins/codex-harness)
- [Entorno de ejecución del arnés de Codex](/es/plugins/codex-harness-runtime)
- [OpenAI](/es/providers/openai)
- [Plugins de arnés de agente](/es/plugins/sdk-agent-harness)
- [Bucle de agente](/es/concepts/agent-loop)
- [Modelos](/es/concepts/models)
- [Estado](/es/cli/status)
