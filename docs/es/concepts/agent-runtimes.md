---
read_when:
    - Está eligiendo entre OpenClaw, Codex, ACP u otro entorno de ejecución de agentes nativo
    - Te confunden las etiquetas de proveedor/modelo/runtime en el estado o la configuración
    - Está documentando la paridad de compatibilidad para un arnés nativo
summary: Cómo separa OpenClaw los proveedores de modelos, los modelos, los canales y los entornos de ejecución de agentes
title: Entornos de ejecución de agentes
x-i18n:
    generated_at: "2026-07-22T10:30:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 44cef229c76c51059399c11d181350c2b29ee5b367f3060c838986c5b5302774
    source_path: concepts/agent-runtimes.md
    workflow: 16
---

Un **entorno de ejecución de agente** controla un bucle de modelo preparado: recibe el prompt,
gestiona la salida del modelo, procesa las llamadas a herramientas nativas y devuelve el turno finalizado
a OpenClaw.

Es fácil confundir los entornos de ejecución con los proveedores porque ambos aparecen cerca de la
configuración del modelo. Son capas diferentes:

| Capa                  | Ejemplos                                     | Significado                                                                 |
| --------------------- | -------------------------------------------- | --------------------------------------------------------------------------- |
| Proveedor             | `anthropic`, `github-copilot`, `openai`      | Cómo autentica OpenClaw, detecta modelos y asigna nombres a referencias de modelos. |
| Modelo                | `claude-opus-4-6`, `gpt-5.6-sol`             | El modelo seleccionado para el turno del agente.                            |
| Entorno de ejecución de agente | `claude-cli`, `codex`, `copilot`, `openclaw` | El bucle de bajo nivel o backend que ejecuta el turno preparado.             |
| Canal                 | Discord, Slack, Telegram, WhatsApp           | Por dónde entran y salen los mensajes de OpenClaw.                          |

Un **harness** es la implementación que proporciona un entorno de ejecución de agente (término de
código). Por ejemplo, el harness de Codex incluido implementa el entorno de ejecución `codex`.
La configuración pública usa `agentRuntime.id` en las entradas de proveedor o modelo; las claves del entorno de ejecución
para todo el agente son heredadas y se ignoran. `openclaw doctor --fix` elimina las
asignaciones antiguas del entorno de ejecución para todo el agente y reescribe las referencias heredadas de modelos del entorno de ejecución como referencias
canónicas de proveedor/modelo, además de la política del entorno de ejecución limitada al modelo cuando sea necesario.

Dos familias de entornos de ejecución:

- Los **harnesses integrados** se ejecutan dentro del bucle de agente preparado de OpenClaw: el
  entorno de ejecución `openclaw` incorporado, además de los harnesses de plugins registrados, como
  `codex` y `copilot`.
- Los **backends de CLI** ejecutan un proceso local de CLI mientras mantienen canónica la referencia
  del modelo. Por ejemplo, `anthropic/claude-opus-4-8` con un
  `agentRuntime.id: "claude-cli"` limitado al modelo significa «seleccionar el modelo de Anthropic y ejecutarlo
  mediante Claude CLI». `claude-cli` no es un id. de harness integrado y no debe
  pasarse a la selección de AgentHarness.

El harness `copilot` es un harness de plugin externo independiente y opcional para la
CLI de GitHub Copilot; consulte [Entorno de ejecución de agente de GitHub Copilot](/es/plugins/copilot) para
conocer la decisión de cara al usuario entre PI, Codex y el entorno de ejecución de agente de GitHub Copilot.

## Superficies de Codex

Varias superficies comparten el nombre Codex:

| Superficie                                       | Nombre/configuración de OpenClaw       | Función                                                                                                         |
| ------------------------------------------------ | -------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Entorno de ejecución nativo del servidor de aplicaciones de Codex | Referencias de modelos `openai/*`       | Ejecuta turnos de agente integrados de OpenAI mediante el servidor de aplicaciones de Codex. Esta es la configuración habitual de suscripción a ChatGPT/Codex. |
| Perfiles de autenticación OAuth de Codex         | Perfiles OAuth `openai`                | Almacena la autenticación de suscripción a ChatGPT/Codex que consume el harness del servidor de aplicaciones de Codex. |
| Adaptador ACP de Codex                           | `runtime: "acp"`, `agentId: "codex"` | Ejecuta Codex mediante el plano de control externo ACP/acpx. Úselo solo cuando se solicite explícitamente ACP/acpx. |
| Conjunto nativo de comandos de control de chat de Codex | `/codex ...`                         | Vincula, reanuda, dirige, detiene e inspecciona hilos del servidor de aplicaciones de Codex desde el chat.       |
| Ruta de la API de OpenAI Platform para superficies ajenas al agente | `openai/*` más autenticación mediante clave de API | API directas de OpenAI, como imágenes, embeddings, voz y tiempo real.                                            |

Estas superficies son independientes de forma intencionada. Activar el plugin `codex`
habilita las funciones nativas del servidor de aplicaciones; `openclaw doctor --fix` se encarga de
reparar las rutas heredadas de Codex y limpiar las asignaciones obsoletas de sesiones. Seleccionar `openai/*`
para un modelo de agente ahora significa «ejecutar esto mediante Codex», salvo que se use una superficie de API de OpenAI
ajena al agente.

La configuración habitual de suscripción a ChatGPT/Codex usa OAuth de Codex para la autenticación, pero
mantiene la referencia del modelo como `openai/*` y selecciona el entorno de ejecución `codex`:

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.6-sol",
    },
  },
}
```

Esto significa que OpenClaw selecciona una referencia de modelo de OpenAI y, después, solicita al entorno de ejecución del
servidor de aplicaciones de Codex que ejecute el turno de agente integrado. No significa «usar facturación de la API»
ni que el canal, el catálogo de proveedores de modelos o el
almacén de sesiones de OpenClaw se conviertan en Codex.

Cuando el plugin `codex` incluido está activado, use la superficie de comandos nativa `/codex`
(`/codex bind`, `/codex threads`, `/codex resume`, `/codex steer`,
`/codex stop`) para controlar Codex mediante lenguaje natural en lugar de ACP. Use ACP para
Codex solo cuando el usuario solicite explícitamente ACP/acpx o esté probando la ruta del
adaptador ACP. Claude Code, Gemini CLI, OpenCode, Cursor y otros harnesses externos
similares siguen usando ACP.

Árbol de decisión:

1. **Vincular/controlar/hilo/reanudar/dirigir/detener Codex** -> superficie de comandos nativa `/codex` cuando el plugin `codex` incluido está activado.
2. **Codex como entorno de ejecución integrado** o la experiencia normal de agente de Codex respaldada por una suscripción -> `openai/<model>`.
3. **OpenClaw elegido explícitamente para un modelo de OpenAI** -> mantenga la referencia del modelo como `openai/<model>` y establezca la política del entorno de ejecución del proveedor/modelo en `agentRuntime.id: "openclaw"`. Un perfil OAuth `openai` seleccionado se enruta internamente mediante el transporte de autenticación de Codex de OpenClaw.
4. **Referencias heredadas de modelos de Codex en la configuración** -> repárelas con `openclaw doctor --fix` para convertirlas en `openai/<model>`; doctor conserva la ruta de autenticación de Codex añadiendo `agentRuntime.id: "codex"` limitado al proveedor/modelo cuando la referencia antigua del modelo lo implicaba. Las referencias heredadas de modelos **`codex-cli/*`** se reparan para usar la misma ruta del servidor de aplicaciones de Codex `openai/<model>`; OpenClaw ya no mantiene un backend de CLI de Codex incluido.
5. **Se solicita explícitamente ACP, acpx o el adaptador ACP de Codex** -> `runtime: "acp"` y `agentId: "codex"`.
6. **Claude Code, Gemini CLI, OpenCode, Cursor, Droid u otro harness externo** -> ACP/acpx, no el entorno de ejecución nativo de subagentes.

| Se refiere a...                         | Use...                                       |
| --------------------------------------- | -------------------------------------------- |
| Control de chat/hilos del servidor de aplicaciones de Codex | `/codex ...` del plugin `codex` incluido |
| Entorno de ejecución de agente integrado del servidor de aplicaciones de Codex | Referencias de modelos de agente `openai/*` |
| OAuth de OpenAI Codex                   | Perfiles OAuth `openai`            |
| Claude Code u otro harness externo      | ACP/acpx                                     |

Para conocer la división de prefijos de la familia OpenAI, consulte [OpenAI](/es/providers/openai) y
[Proveedores de modelos](/es/concepts/model-providers). Para conocer el contrato de compatibilidad del entorno de ejecución de
Codex, consulte [Entorno de ejecución del harness de Codex](/es/plugins/codex-harness-runtime#v1-support-contract).

## Control del entorno de ejecución

Los distintos entornos de ejecución controlan diferentes partes del bucle:

| Superficie                  | Integrado en OpenClaw                           | Servidor de aplicaciones de Codex                                             |
| --------------------------- | ----------------------------------------------- | ----------------------------------------------------------------------------- |
| Responsable del bucle del modelo | OpenClaw, mediante el ejecutor integrado de OpenClaw | Servidor de aplicaciones de Codex                                        |
| Estado canónico del hilo    | Transcripción de OpenClaw                       | Hilo de Codex, más la réplica de la transcripción de OpenClaw                 |
| Herramientas dinámicas de OpenClaw | Bucle nativo de herramientas de OpenClaw | Conectadas mediante el adaptador de Codex                                     |
| Herramientas nativas de shell y archivos | Ruta de OpenClaw                    | Herramientas nativas de Codex, conectadas mediante hooks nativos cuando sean compatibles |
| Motor de contexto           | Ensamblaje nativo de contexto de OpenClaw       | OpenClaw proyecta el contexto ensamblado en el turno de Codex                 |
| Compaction                  | OpenClaw o el motor de contexto seleccionado    | Compaction nativa de Codex, con notificaciones de OpenClaw y mantenimiento de la réplica |
| Entrega en el canal         | OpenClaw                                        | OpenClaw                                                                      |

Regla de diseño: si OpenClaw controla la superficie, puede proporcionar el comportamiento normal de los hooks de
plugins. Si el entorno de ejecución nativo controla la superficie, OpenClaw necesita eventos del entorno de ejecución
o hooks nativos. Si el entorno de ejecución nativo controla el estado canónico del hilo,
OpenClaw replica y proyecta el contexto en lugar de reescribir elementos internos no
compatibles.

## Selección del entorno de ejecución

OpenClaw resuelve un entorno de ejecución integrado después de resolver el proveedor y el modelo, en
este orden:

1. La **política del entorno de ejecución limitada al modelo** tiene prioridad. Se encuentra en una entrada de modelo
   del proveedor configurado o en `agents.defaults.models["provider/model"].agentRuntime`
   / `agents.entries.*.models["provider/model"].agentRuntime`. Un comodín de proveedor
   como `agents.defaults.models["vllm/*"].agentRuntime` se aplica
   después de la política exacta del modelo, de modo que los modelos del proveedor detectados dinámicamente puedan
   compartir un entorno de ejecución sin sustituir las excepciones exactas de cada modelo.
2. **Política del entorno de ejecución limitada al proveedor**: `models.providers.<provider>.agentRuntime`.
3. **Modo `auto`**: los entornos de ejecución de plugins registrados pueden reclamar pares de proveedor/modelo compatibles.
4. Si ningún entorno reclama el turno en el modo `auto`, OpenClaw recurre a
   `openclaw` como entorno de ejecución de compatibilidad. Use un id. de entorno de ejecución explícito cuando
   la ejecución deba ser estricta.

Las asignaciones del entorno de ejecución para toda la sesión y todo el agente se ignoran: `OPENCLAW_AGENT_RUNTIME`,
el estado de sesión `agentHarnessId`/`agentRuntimeOverride`, `agents.defaults.agentRuntime`
y `agents.entries.*.agentRuntime`. Ejecute `openclaw doctor --fix` para eliminar la configuración obsoleta
del entorno de ejecución para todo el agente y convertir las referencias heredadas de modelos del entorno de ejecución cuando pueda
preservarse la intención.

Los entornos de ejecución explícitos de plugins para proveedor/modelo fallan de forma cerrada: `agentRuntime.id: "codex"`
en un proveedor o modelo significa Codex, o bien un error claro de selección/entorno de ejecución; nunca se
redirige silenciosamente a OpenClaw. Solo `auto` puede redirigir a OpenClaw
un turno sin coincidencia.

Los alias de backends de CLI difieren de los id. de harnesses integrados. Forma preferida para Claude CLI:

```json5
{
  agents: {
    defaults: {
      model: "anthropic/claude-opus-4-8",
      models: {
        "anthropic/claude-opus-4-8": {
          agentRuntime: { id: "claude-cli" },
        },
      },
    },
  },
}
```

Las referencias heredadas como `claude-cli/claude-opus-4-7` siguen siendo compatibles por
motivos de compatibilidad, pero la configuración nueva debe mantener canónicos el proveedor/modelo y
ubicar el backend de ejecución en la política del entorno de ejecución del proveedor/modelo.

Las referencias heredadas `codex-cli/*` son diferentes: doctor las migra a `openai/*` para que
se ejecuten mediante el harness del servidor de aplicaciones de Codex en lugar de conservar un backend de
CLI de Codex.

El modo `auto` es intencionadamente conservador para la mayoría de los proveedores. Los modelos de agente de OpenAI
son la excepción: tanto un entorno de ejecución sin establecer como `auto` se resuelven en el harness de Codex.
La configuración explícita del entorno de ejecución de OpenClaw sigue siendo una ruta de compatibilidad opcional
para los turnos de agente `openai/*`; cuando se combina con un perfil OAuth `openai`
seleccionado, OpenClaw enruta internamente esa ruta mediante el transporte de autenticación
de Codex mientras mantiene la referencia pública del modelo como `openai/*`. Las asignaciones obsoletas del entorno de ejecución de sesiones de OpenAI
se ignoran durante la selección del entorno de ejecución y pueden limpiarse con
`openclaw doctor --fix`.

Si `openclaw doctor` advierte que el Plugin `codex` está habilitado mientras aún quedan referencias de modelos Codex heredadas en la configuración, se debe tratar como un estado de ruta heredada y ejecutar
`openclaw doctor --fix` para reescribirlo como `openai/*` con el entorno de ejecución Codex.

## Entorno de ejecución del agente GitHub Copilot

El Plugin externo `@openclaw/copilot` registra un entorno de ejecución `copilot` de activación opcional
respaldado por la CLI de GitHub Copilot (`@github/copilot-sdk`). Este reclama el
proveedor de suscripción canónico `github-copilot` y `auto` **nunca** lo selecciona.
Se puede activar por modelo o por proveedor mediante `agentRuntime.id`:

```json5
{
  agents: {
    defaults: {
      model: "github-copilot/gpt-5.5",
      models: {
        "github-copilot/gpt-5.5": {
          agentRuntime: { id: "copilot" },
        },
      },
    },
  },
}
```

El arnés declara su proveedor, entorno de ejecución, clave de sesión de la CLI y prefijo de perfil
de autenticación en `extensions/copilot/doctor-contract-api.ts`, que `openclaw doctor`
carga automáticamente. Para obtener información sobre la configuración, la autenticación, la replicación de transcripciones, Compaction, el
contrato declarativo de doctor y la decisión más amplia del SDK entre PI, Codex y Copilot,
consulte [Entorno de ejecución del agente GitHub Copilot](/es/plugins/copilot).

## Contrato de compatibilidad

Cuando un entorno de ejecución no es OpenClaw, su documentación debe indicar qué superficies de OpenClaw
admite:

| Pregunta                               | Por qué es importante                                                                                    |
| -------------------------------------- | ------------------------------------------------------------------------------------------------- |
| ¿Quién controla el bucle del modelo?               | Determina dónde se producen los reintentos, la continuación de herramientas y las decisiones sobre la respuesta final.                   |
| ¿Quién controla el historial canónico del hilo?     | Determina si OpenClaw puede editar el historial o solo replicarlo.                                   |
| ¿Funcionan las herramientas dinámicas de OpenClaw?        | La mensajería, las sesiones, Cron y las herramientas controladas por OpenClaw dependen de ello.                                 |
| ¿Funcionan los hooks de herramientas dinámicas?            | Los Plugins esperan `before_tool_call`, `after_tool_call` y middleware en torno a las herramientas controladas por OpenClaw. |
| ¿Funcionan los hooks de herramientas nativas?             | El shell, los parches y las herramientas controladas por el entorno de ejecución necesitan compatibilidad nativa con hooks para aplicar políticas y realizar observaciones.        |
| ¿Se ejecuta el ciclo de vida del motor de contexto? | Los Plugins de memoria y contexto dependen de los ciclos de vida de ensamblaje, ingesta, operaciones posteriores al turno y Compaction.      |
| ¿Qué datos de Compaction se exponen?       | Algunos Plugins solo necesitan notificaciones; otros necesitan metadatos sobre lo conservado y lo descartado.                          |
| ¿Qué no se admite de forma intencionada?     | No se debe presuponer la equivalencia con OpenClaw cuando el entorno de ejecución nativo controla más estado.            |

El contrato de compatibilidad del entorno de ejecución Codex se documenta en
[Entorno de ejecución del arnés Codex](/es/plugins/codex-harness-runtime#v1-support-contract).

## Etiquetas de estado

La salida de estado puede mostrar las etiquetas `Execution` y `Runtime`. Deben interpretarse como
diagnósticos, no como nombres de proveedores:

- Una referencia de modelo como `openai/gpt-5.6-sol` es el proveedor/modelo seleccionado.
- Un identificador de entorno de ejecución como `codex` es el bucle que ejecuta el turno.
- Una etiqueta de canal como Telegram o Discord indica dónde tiene lugar la conversación.

Si una ejecución muestra un entorno de ejecución inesperado, se debe inspeccionar primero la política del entorno de ejecución
del proveedor/modelo seleccionado. Las fijaciones heredadas del entorno de ejecución de la sesión ya no determinan el enrutamiento.

## Contenido relacionado

- [Arnés Codex](/es/plugins/codex-harness)
- [Entorno de ejecución del arnés Codex](/es/plugins/codex-harness-runtime)
- [Entorno de ejecución del agente GitHub Copilot](/es/plugins/copilot)
- [OpenAI](/es/providers/openai)
- [Plugins de arnés de agente](/es/plugins/sdk-agent-harness)
- [Bucle del agente](/es/concepts/agent-loop)
- [Modelos](/es/concepts/models)
- [Estado](/es/cli/status)
