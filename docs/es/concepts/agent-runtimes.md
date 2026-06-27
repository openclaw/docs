---
read_when:
    - Estás eligiendo entre OpenClaw, Codex, ACP u otro runtime de agente nativo
    - Te confunden las etiquetas de proveedor/modelo/runtime en el estado o la configuración
    - Estás documentando la paridad de soporte para un arnés nativo
summary: Cómo OpenClaw separa los proveedores de modelos, los modelos, los canales y los runtimes de agentes
title: Entornos de ejecución de agentes
x-i18n:
    generated_at: "2026-06-27T11:08:50Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fb818e682ffb11a073ee0053c0e7b7e2ea60239141aab7f96cd82520ded9d22f
    source_path: concepts/agent-runtimes.md
    workflow: 16
---

Un **tiempo de ejecución de agente** es el componente que posee un bucle de modelo preparado:
recibe el prompt, controla la salida del modelo, maneja llamadas nativas a herramientas y devuelve
el turno finalizado a OpenClaw.

Los tiempos de ejecución son fáciles de confundir con los proveedores porque ambos aparecen cerca de la
configuración del modelo. Son capas diferentes:

| Capa                | Ejemplos                                     | Qué significa                                                                 |
| ------------------- | -------------------------------------------- | ----------------------------------------------------------------------------- |
| Proveedor           | `openai`, `anthropic`, `github-copilot`      | Cómo OpenClaw autentica, descubre modelos y nombra refs de modelo.            |
| Modelo              | `gpt-5.5`, `claude-opus-4-6`                 | El modelo seleccionado para el turno del agente.                              |
| Tiempo de ejecución de agente | `openclaw`, `codex`, `copilot`, `claude-cli` | El bucle de bajo nivel o backend que ejecuta el turno preparado.              |
| Canal               | Telegram, Discord, Slack, WhatsApp           | Dónde entran y salen los mensajes de OpenClaw.                                |

También verás la palabra **arnés** en el código. Un arnés es la implementación
que proporciona un tiempo de ejecución de agente. Por ejemplo, el arnés Codex incluido
implementa el tiempo de ejecución `codex`. La configuración pública usa `agentRuntime.id` en
entradas de proveedor o modelo; las claves de tiempo de ejecución de agente completo son heredadas y se ignoran.
`openclaw doctor --fix` elimina las antiguas fijaciones de tiempo de ejecución de agente completo y reescribe
refs de modelo de tiempo de ejecución heredadas a refs canónicas de proveedor/modelo más política de tiempo de ejecución
con alcance de modelo cuando es necesario.

Hay dos familias de tiempos de ejecución:

- Los **arneses incrustados** se ejecutan dentro del bucle de agente preparado de OpenClaw. Hoy esto
  es el tiempo de ejecución integrado `openclaw` más arneses de Plugin registrados como
  `codex` y `copilot`.
- Los **backends de CLI** ejecutan un proceso de CLI local manteniendo la ref de modelo
  canónica. Por ejemplo, `anthropic/claude-opus-4-8` con
  un `agentRuntime.id: "claude-cli"` con alcance de modelo significa "seleccionar el modelo de Anthropic,
  ejecutar mediante Claude CLI." `claude-cli` no es un id de arnés incrustado
  y no debe pasarse a la selección de AgentHarness.

El arnés `copilot` es un arnés de Plugin externo independiente y opcional para la
CLI de GitHub Copilot; consulta [tiempo de ejecución de agente de GitHub Copilot](/es/plugins/copilot)
para la decisión orientada al usuario entre PI, Codex y el tiempo de ejecución de agente de GitHub Copilot.

## Superficies de Codex

La mayor parte de la confusión proviene de varias superficies distintas que comparten el nombre Codex:

| Superficie                                       | Nombre/configuración de OpenClaw      | Qué hace                                                                                                      |
| ------------------------------------------------ | ------------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| Tiempo de ejecución nativo de servidor de aplicación Codex | refs de modelo `openai/*`            | Ejecuta turnos de agente incrustados de OpenAI mediante el servidor de aplicación Codex. Esta es la configuración habitual de suscripción ChatGPT/Codex. |
| Perfiles de autenticación OAuth de Codex         | Perfiles OAuth `openai`              | Almacena la autenticación de suscripción ChatGPT/Codex que consume el arnés de servidor de aplicación Codex. |
| Adaptador ACP de Codex                          | `runtime: "acp"`, `agentId: "codex"` | Ejecuta Codex mediante el plano de control externo ACP/acpx. Úsalo solo cuando se pida explícitamente ACP/acpx. |
| Conjunto nativo de comandos de control de chat de Codex | `/codex ...`                         | Vincula, reanuda, dirige, detiene e inspecciona hilos del servidor de aplicación Codex desde el chat.        |
| Ruta de API de OpenAI Platform para superficies no de agente | `openai/*` más autenticación con clave de API | Se usa para API directas de OpenAI como imágenes, embeddings, voz y tiempo real.                             |

Esas superficies son independientes intencionalmente. Habilitar el Plugin `codex` hace
que las funciones nativas del servidor de aplicación estén disponibles; `openclaw doctor --fix` posee la reparación
de rutas Codex heredadas y la limpieza de fijaciones de sesión obsoletas. Seleccionar
`openai/*` para un modelo de agente ahora significa "ejecutar esto mediante Codex" salvo que se
esté usando una superficie de API de OpenAI no de agente.

La configuración común de suscripción ChatGPT/Codex usa OAuth de Codex para la autenticación, pero mantiene
la ref de modelo como `openai/*` y selecciona el tiempo de ejecución `codex`:

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
    },
  },
}
```

Eso significa que OpenClaw selecciona una ref de modelo de OpenAI y luego pide al tiempo de ejecución
del servidor de aplicación Codex que ejecute el turno de agente incrustado. No significa "usar facturación de API",
y no significa que el canal, el catálogo de proveedores de modelos o el almacén de sesiones de OpenClaw
se conviertan en Codex.

Cuando el Plugin `codex` incluido está habilitado, el control de Codex en lenguaje natural
debe usar la superficie nativa de comandos `/codex` (`/codex bind`, `/codex threads`,
`/codex resume`, `/codex steer`, `/codex stop`) en lugar de ACP. Usa ACP para
Codex solo cuando el usuario pida explícitamente ACP/acpx o esté probando la ruta del
adaptador ACP. Claude Code, Gemini CLI, OpenCode, Cursor y arneses externos similares
siguen usando ACP.

Este es el árbol de decisiones orientado al agente:

1. Si el usuario pide **vincular/controlar/hilo/reanudar/dirigir/detener Codex**, usa la
   superficie nativa de comandos `/codex` cuando el Plugin `codex` incluido esté habilitado.
2. Si el usuario pide **Codex como tiempo de ejecución incrustado** o quiere la experiencia normal
   de agente Codex respaldada por suscripción, usa `openai/<model>`.
3. Si el usuario elige explícitamente **OpenClaw para un modelo de OpenAI**, conserva la ref de modelo
   como `openai/<model>` y establece la política de tiempo de ejecución de proveedor/modelo en
   `agentRuntime.id: "openclaw"`. Un perfil OAuth `openai` seleccionado se enruta
   internamente mediante el transporte de autenticación Codex de OpenClaw.
4. Si la configuración heredada todavía contiene **refs de modelo Codex heredadas**, repárala a
   `openai/<model>` con `openclaw doctor --fix`; doctor conserva la ruta de autenticación de Codex
   añadiendo `agentRuntime.id: "codex"` con alcance de proveedor/modelo donde la
   antigua ref de modelo lo implicaba.
   Las **refs de modelo `codex-cli/*` heredadas** se reparan a la misma ruta de servidor de aplicación Codex
   `openai/<model>`; OpenClaw ya no mantiene un backend de CLI de Codex incluido.
5. Si el usuario dice explícitamente **ACP**, **acpx** o **adaptador ACP de Codex**, usa
   ACP con `runtime: "acp"` y `agentId: "codex"`.
6. Si la solicitud es para **Claude Code, Gemini CLI, OpenCode, Cursor, Droid u
   otro arnés externo**, usa ACP/acpx, no el tiempo de ejecución nativo de subagente.

| Quieres decir...                                      | Usa...                                          |
| ----------------------------------------------------- | ----------------------------------------------- |
| control de chat/hilo del servidor de aplicaciones de Codex | `/codex ...` desde el Plugin `codex` incluido |
| runtime de agente integrado del servidor de aplicaciones de Codex | referencias de modelo de agente `openai/*` |
| OAuth de OpenAI Codex                                 | perfiles OAuth de `openai`                      |
| Claude Code u otro harness externo                    | ACP/acpx                                        |

Para la división de prefijos de la familia OpenAI, consulta [OpenAI](/es/providers/openai) y
[Proveedores de modelos](/es/concepts/model-providers). Para el contrato de soporte del runtime de Codex,
consulta [Runtime del harness de Codex](/es/plugins/codex-harness-runtime#v1-support-contract).

## Propiedad del runtime

Cada runtime posee partes distintas del bucle.

| Superficie                  | OpenClaw integrado                              | Servidor de aplicaciones de Codex                                             |
| --------------------------- | ----------------------------------------------- | ----------------------------------------------------------------------------- |
| Propietario del bucle del modelo | OpenClaw mediante el ejecutor integrado de OpenClaw | Servidor de aplicaciones de Codex                                        |
| Estado canónico del hilo    | Transcripción de OpenClaw                       | Hilo de Codex, más espejo de transcripción de OpenClaw                        |
| Herramientas dinámicas de OpenClaw | Bucle de herramientas nativo de OpenClaw | Puenteadas mediante el adaptador de Codex                                     |
| Herramientas nativas de shell y archivos | Ruta de OpenClaw                    | Herramientas nativas de Codex, puenteadas mediante hooks nativos cuando se admiten |
| Motor de contexto           | Ensamblaje de contexto nativo de OpenClaw       | OpenClaw proyecta el contexto ensamblado en el turno de Codex                 |
| Compaction                  | OpenClaw o el motor de contexto seleccionado    | Compaction nativa de Codex, con notificaciones de OpenClaw y mantenimiento del espejo |
| Entrega por canal           | OpenClaw                                        | OpenClaw                                                                      |

Esta división de propiedad es la regla de diseño principal:

- Si OpenClaw posee la superficie, OpenClaw puede proporcionar el comportamiento normal de hooks de Plugin.
- Si el runtime nativo posee la superficie, OpenClaw necesita eventos de runtime o hooks nativos.
- Si el runtime nativo posee el estado canónico del hilo, OpenClaw debe espejar y proyectar contexto, no reescribir componentes internos no admitidos.

## Selección de runtime

OpenClaw elige un runtime integrado después de resolver el proveedor y el modelo:

1. La política de runtime con alcance de modelo tiene prioridad. Puede vivir en una entrada de
   modelo de proveedor configurada o en `agents.defaults.models["provider/model"].agentRuntime` /
   `agents.list[].models["provider/model"].agentRuntime`. Un comodín de proveedor
   como `agents.defaults.models["vllm/*"].agentRuntime` se aplica después de la política
   exacta de modelo, por lo que los modelos de proveedor descubiertos dinámicamente pueden compartir un
   runtime sin sobrescribir excepciones exactas por modelo.
2. La política de runtime con alcance de proveedor viene después en
   `models.providers.<provider>.agentRuntime`.
3. En modo `auto`, los runtimes de Plugin registrados pueden reclamar pares proveedor/modelo
   compatibles.
4. Si ningún runtime reclama un turno en modo `auto`, OpenClaw usa `openclaw` como
   runtime de compatibilidad. Usa un id de runtime explícito cuando la ejecución deba ser
   estricta.

Se ignoran los pines de runtime de sesión completa y de agente completo. Eso incluye
`OPENCLAW_AGENT_RUNTIME`, el estado de sesión `agentHarnessId`/`agentRuntimeOverride`,
`agents.defaults.agentRuntime` y `agents.list[].agentRuntime`. Ejecuta
`openclaw doctor --fix` para eliminar configuración obsoleta de runtime de agente completo y convertir
referencias de modelo de runtime heredadas cuando OpenClaw pueda preservar la intención.

Los runtimes de Plugin proveedor/modelo explícitos fallan de forma cerrada. Por ejemplo,
`agentRuntime.id: "codex"` en un proveedor o modelo significa Codex o un error claro
de selección/runtime; nunca se redirige silenciosamente de vuelta a OpenClaw.

Los alias de backend de CLI son distintos de los ids de harness integrados. La forma preferida
de Claude CLI es:

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
compatibilidad, pero la configuración nueva debe mantener canónicos el proveedor/modelo y colocar
el backend de ejecución en la política de runtime de proveedor/modelo.

Las referencias heredadas `codex-cli/*` son distintas: doctor las migra a `openai/*` para que
se ejecuten mediante el harness del servidor de aplicaciones de Codex en lugar de preservar un backend de Codex CLI.

El modo `auto` es deliberadamente conservador para la mayoría de los proveedores. Los modelos de agente
de OpenAI son la excepción: tanto un runtime sin definir como `auto` se resuelven al harness de Codex.
La configuración explícita de runtime de OpenClaw sigue siendo una ruta de compatibilidad opcional para
turnos de agente `openai/*`; cuando se combina con un perfil OAuth de `openai` seleccionado,
OpenClaw enruta esa ruta internamente mediante el transporte con autenticación de Codex mientras
mantiene la referencia pública del modelo como `openai/*`. Los pines de sesión de runtime de OpenAI obsoletos se
ignoran durante la selección de runtime y se pueden limpiar con `openclaw doctor --fix`.

Si `openclaw doctor` advierte que el plugin `codex` está habilitado mientras
permanecen referencias de modelo Codex heredadas en la configuración, trátalo como estado de enrutamiento heredado. Ejecuta
`openclaw doctor --fix` para reescribirlo a `openai/*` con el entorno de ejecución de Codex.

## Entorno de ejecución de agente de GitHub Copilot

El plugin externo `@openclaw/copilot` registra un entorno de ejecución `copilot` opcional
respaldado por la CLI de GitHub Copilot (`@github/copilot-sdk`). Reclama el
proveedor canónico de suscripción `github-copilot` y **nunca** lo selecciona
`auto`. Actívalo por modelo o por proveedor mediante `agentRuntime.id`:

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

El arnés reclama su proveedor, entorno de ejecución, clave de sesión de CLI y prefijo de perfil de autenticación
en `extensions/copilot/doctor-contract-api.ts`, que
`openclaw doctor` carga automáticamente. Para configuración, autenticación, espejado de transcripciones,
Compaction, el contrato declarativo de doctor y la decisión más amplia entre PI, Codex y
Copilot SDK, consulta [Entorno de ejecución de agente de GitHub Copilot](/es/plugins/copilot).

## Contrato de compatibilidad

Cuando un entorno de ejecución no es OpenClaw, debe documentar qué superficies de OpenClaw admite.
Usa esta estructura para la documentación del entorno de ejecución:

| Pregunta                               | Por qué importa                                                                                    |
| -------------------------------------- | ------------------------------------------------------------------------------------------------- |
| ¿Quién es dueño del bucle del modelo?  | Determina dónde ocurren los reintentos, la continuación de herramientas y las decisiones de respuesta final. |
| ¿Quién es dueño del historial canónico de hilos? | Determina si OpenClaw puede editar el historial o solo espejarlo. |
| ¿Funcionan las herramientas dinámicas de OpenClaw? | La mensajería, las sesiones, Cron y las herramientas propiedad de OpenClaw dependen de esto. |
| ¿Funcionan los hooks de herramientas dinámicas? | Los plugins esperan `before_tool_call`, `after_tool_call` y middleware alrededor de las herramientas propiedad de OpenClaw. |
| ¿Funcionan los hooks de herramientas nativas? | Shell, patch y las herramientas propiedad del entorno de ejecución necesitan soporte de hooks nativos para políticas y observación. |
| ¿Se ejecuta el ciclo de vida del motor de contexto? | Los plugins de memoria y contexto dependen de los ciclos de vida de ensamblaje, ingesta, después del turno y Compaction. |
| ¿Qué datos de Compaction se exponen? | Algunos plugins solo necesitan notificaciones, mientras que otros necesitan metadatos conservados/descartados. |
| ¿Qué no se admite intencionalmente? | Los usuarios no deben asumir equivalencia con OpenClaw cuando el entorno de ejecución nativo posee más estado. |

El contrato de soporte del entorno de ejecución de Codex está documentado en
[Entorno de ejecución del arnés de Codex](/es/plugins/codex-harness-runtime#v1-support-contract).

## Etiquetas de estado

La salida de estado puede mostrar tanto las etiquetas `Execution` como `Runtime`. Léelas como
diagnósticos, no como nombres de proveedores.

- Una referencia de modelo como `openai/gpt-5.5` indica el proveedor/modelo seleccionado.
- Un id de entorno de ejecución como `codex` indica qué bucle está ejecutando el turno.
- Una etiqueta de canal como Telegram o Discord indica dónde está ocurriendo la conversación.

Si una ejecución aún muestra un entorno de ejecución inesperado, inspecciona primero la política del entorno de ejecución
del proveedor/modelo seleccionado. Las fijaciones heredadas del entorno de ejecución de sesión ya no deciden el enrutamiento.

## Relacionado

- [Arnés de Codex](/es/plugins/codex-harness)
- [Entorno de ejecución del arnés de Codex](/es/plugins/codex-harness-runtime)
- [Entorno de ejecución de agente de GitHub Copilot](/es/plugins/copilot)
- [OpenAI](/es/providers/openai)
- [Plugins de arnés de agente](/es/plugins/sdk-agent-harness)
- [Bucle de agente](/es/concepts/agent-loop)
- [Modelos](/es/concepts/models)
- [Estado](/es/cli/status)
