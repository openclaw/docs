---
read_when:
    - Estás eligiendo entre OpenClaw, Codex, ACP u otro runtime de agente nativo
    - Te confunden las etiquetas de proveedor/modelo/runtime en el estado o la configuración
    - Estás documentando la paridad de soporte para un arnés nativo
summary: Cómo OpenClaw separa proveedores de modelos, modelos, canales y runtimes de agentes
title: Tiempos de ejecución de agente
x-i18n:
    generated_at: "2026-07-05T11:13:19Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a4b3c54b9f80e37662dc98f14db8abc4491426695dc9aa081b05bc923cb44ecd
    source_path: concepts/agent-runtimes.md
    workflow: 16
---

Un **runtime de agente** posee un bucle de modelo preparado: recibe el prompt,
dirige la salida del modelo, maneja llamadas a herramientas nativas y devuelve
el turno terminado a OpenClaw.

Los runtimes son fáciles de confundir con los proveedores porque ambos aparecen
cerca de la configuración del modelo. Son capas diferentes:

| Capa              | Ejemplos                                     | Significado                                                            |
| ----------------- | -------------------------------------------- | ---------------------------------------------------------------------- |
| Proveedor         | `anthropic`, `github-copilot`, `openai`      | Cómo OpenClaw autentica, descubre modelos y nombra refs de modelo.     |
| Modelo            | `claude-opus-4-6`, `gpt-5.5`                 | El modelo seleccionado para el turno del agente.                       |
| Runtime de agente | `claude-cli`, `codex`, `copilot`, `openclaw` | El bucle de bajo nivel o backend que ejecuta el turno preparado.       |
| Canal             | Discord, Slack, Telegram, WhatsApp           | Dónde entran y salen los mensajes de OpenClaw.                         |

Un **harness** es la implementación que proporciona un runtime de agente
(término de código). Por ejemplo, el harness Codex incluido implementa el
runtime `codex`. La configuración pública usa `agentRuntime.id` en entradas de
proveedor o modelo; las claves de runtime de agente completo son heredadas y se
ignoran. `openclaw doctor --fix` elimina los antiguos pines de runtime de
agente completo y reescribe refs de modelo de runtime heredadas a refs
canónicas de proveedor/modelo más política de runtime con ámbito de modelo
cuando hace falta.

Dos familias de runtime:

- Los **harnesses embebidos** se ejecutan dentro del bucle de agente preparado
  de OpenClaw: el runtime integrado `openclaw`, más harnesses de Plugin
  registrados como `codex` y `copilot`.
- Los **backends de CLI** ejecutan un proceso de CLI local mientras mantienen
  canónica la ref de modelo. Por ejemplo, `anthropic/claude-opus-4-8` con un
  `agentRuntime.id: "claude-cli"` con ámbito de modelo significa "selecciona el
  modelo de Anthropic, ejecuta mediante Claude CLI". `claude-cli` no es un id de
  harness embebido y no debe pasarse a la selección de AgentHarness.

El harness `copilot` es un harness de Plugin externo separado y opcional para
la CLI de GitHub Copilot; consulta [runtime de agente de GitHub Copilot](/es/plugins/copilot)
para la decisión orientada al usuario entre PI, Codex y el runtime de agente de
GitHub Copilot.

## Superficies de Codex

Varias superficies comparten el nombre Codex:

| Superficie                                      | Nombre/configuración en OpenClaw      | Qué hace                                                                                                             |
| ----------------------------------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Runtime nativo de servidor de aplicación Codex  | refs de modelo `openai/*`             | Ejecuta turnos de agente embebidos de OpenAI mediante el servidor de aplicación Codex. Esta es la configuración habitual de suscripción ChatGPT/Codex. |
| Perfiles de autenticación OAuth de Codex        | perfiles OAuth de `openai`            | Almacena autenticación de suscripción ChatGPT/Codex que consume el harness del servidor de aplicación Codex.         |
| Adaptador Codex ACP                             | `runtime: "acp"`, `agentId: "codex"`  | Ejecuta Codex mediante el plano de control ACP/acpx externo. Úsalo solo cuando se pida explícitamente ACP/acpx.      |
| Conjunto de comandos nativo de control de chat Codex | `/codex ...`                     | Vincula, reanuda, dirige, detiene e inspecciona hilos del servidor de aplicación Codex desde el chat.                |
| Ruta de API de OpenAI Platform para superficies no agente | `openai/*` más autenticación con clave de API | APIs directas de OpenAI como imágenes, embeddings, voz y tiempo real.                                           |

Estas superficies son intencionadamente independientes. Habilitar el Plugin
`codex` pone disponibles las funciones nativas del servidor de aplicación;
`openclaw doctor --fix` posee la reparación de rutas Codex heredadas y la
limpieza de pines de sesión obsoletos. Seleccionar `openai/*` para un modelo de
agente ahora significa "ejecutar esto mediante Codex" salvo que se esté usando
una superficie de API de OpenAI no agente.

La configuración común de suscripción ChatGPT/Codex usa OAuth de Codex para la
autenticación, pero mantiene la ref de modelo como `openai/*` y selecciona el
runtime `codex`:

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
    },
  },
}
```

Eso significa que OpenClaw selecciona una ref de modelo de OpenAI y luego pide
al runtime del servidor de aplicación Codex que ejecute el turno de agente
embebido. No significa "usar facturación de API", y no significa que el canal,
el catálogo de proveedores de modelo o el almacén de sesiones de OpenClaw se
conviertan en Codex.

Cuando el Plugin `codex` incluido está habilitado, usa la superficie nativa de
comandos `/codex` (`/codex bind`, `/codex threads`, `/codex resume`,
`/codex steer`, `/codex stop`) para control de Codex en lenguaje natural en
lugar de ACP. Usa ACP para Codex solo cuando el usuario pida explícitamente
ACP/acpx o esté probando la ruta del adaptador ACP. Claude Code, Gemini CLI,
OpenCode, Cursor y harnesses externos similares siguen usando ACP.

Árbol de decisión:

1. **Vincular/controlar/hilo/reanudar/dirigir/detener Codex** -> superficie nativa de comandos `/codex` cuando el Plugin `codex` incluido está habilitado.
2. **Codex como runtime embebido** o la experiencia normal de agente Codex respaldada por suscripción -> `openai/<model>`.
3. **OpenClaw elegido explícitamente para un modelo de OpenAI** -> conserva la ref de modelo como `openai/<model>` y define la política de runtime de proveedor/modelo como `agentRuntime.id: "openclaw"`. Un perfil OAuth de `openai` seleccionado se enruta internamente mediante el transporte de autenticación Codex de OpenClaw.
4. **Refs de modelo Codex heredadas en la configuración** -> repáralas con `openclaw doctor --fix` a `openai/<model>`; doctor conserva la ruta de autenticación Codex agregando `agentRuntime.id: "codex"` con ámbito de proveedor/modelo donde la antigua ref de modelo lo implicaba. Las refs de modelo heredadas **`codex-cli/*`** se reparan a la misma ruta de servidor de aplicación Codex `openai/<model>`; OpenClaw ya no conserva un backend Codex CLI incluido.
5. **ACP, acpx o adaptador Codex ACP solicitado explícitamente** -> `runtime: "acp"` y `agentId: "codex"`.
6. **Claude Code, Gemini CLI, OpenCode, Cursor, Droid u otro harness externo** -> ACP/acpx, no el runtime nativo de subagente.

| Quieres decir...                         | Usa...                                      |
| ---------------------------------------- | ------------------------------------------ |
| Control de chat/hilo del servidor de aplicación Codex | `/codex ...` desde el Plugin `codex` incluido |
| Runtime de agente embebido del servidor de aplicación Codex | refs de modelo de agente `openai/*` |
| OAuth de OpenAI Codex                    | perfiles OAuth de `openai`                 |
| Claude Code u otro harness externo       | ACP/acpx                                   |

Para la división de prefijos de la familia OpenAI, consulta [OpenAI](/es/providers/openai) y
[Proveedores de modelo](/es/concepts/model-providers). Para el contrato de soporte
del runtime Codex, consulta [runtime de harness Codex](/es/plugins/codex-harness-runtime#v1-support-contract).

## Propiedad del runtime

Distintos runtimes poseen distintas partes del bucle:

| Superficie                  | OpenClaw embebido                               | Servidor de aplicación Codex                                                |
| --------------------------- | ----------------------------------------------- | --------------------------------------------------------------------------- |
| Dueño del bucle de modelo   | OpenClaw, mediante el ejecutor embebido de OpenClaw | Servidor de aplicación Codex                                            |
| Estado canónico del hilo    | Transcripción de OpenClaw                       | Hilo Codex, más espejo de transcripción de OpenClaw                         |
| Herramientas dinámicas de OpenClaw | Bucle de herramientas nativas de OpenClaw | Puenteadas mediante el adaptador Codex                                      |
| Herramientas nativas de shell y archivos | Ruta de OpenClaw                 | Herramientas nativas de Codex, puenteadas mediante hooks nativos donde se admitan |
| Motor de contexto           | Ensamblaje de contexto nativo de OpenClaw       | OpenClaw proyecta contexto ensamblado en el turno de Codex                  |
| Compaction                  | OpenClaw o motor de contexto seleccionado       | Compaction nativa de Codex, con notificaciones de OpenClaw y mantenimiento del espejo |
| Entrega por canal           | OpenClaw                                        | OpenClaw                                                                    |

Regla de diseño: si OpenClaw posee la superficie, puede proporcionar el
comportamiento normal de hooks de Plugin. Si el runtime nativo posee la
superficie, OpenClaw necesita eventos de runtime o hooks nativos. Si el runtime
nativo posee el estado canónico del hilo, OpenClaw refleja y proyecta contexto
en lugar de reescribir internals no compatibles.

## Selección de runtime

OpenClaw resuelve un runtime embebido después de la resolución de proveedor y
modelo, en este orden:

1. Gana la **política de runtime con ámbito de modelo**. Vive en una entrada de
   modelo de proveedor configurada, o en `agents.defaults.models["provider/model"].agentRuntime`
   / `agents.list[].models["provider/model"].agentRuntime`. Un comodín de
   proveedor como `agents.defaults.models["vllm/*"].agentRuntime` se aplica
   después de la política de modelo exacta, de modo que los modelos de proveedor
   descubiertos dinámicamente puedan compartir un runtime sin anular excepciones
   exactas por modelo.
2. **Política de runtime con ámbito de proveedor**: `models.providers.<provider>.agentRuntime`.
3. **Modo `auto`**: los runtimes de Plugin registrados pueden reclamar pares proveedor/modelo compatibles.
4. Si nada reclama el turno en modo `auto`, OpenClaw vuelve a `openclaw` como
   runtime de compatibilidad. Usa un id de runtime explícito cuando la ejecución
   deba ser estricta.

Los pines de runtime de sesión completa y agente completo se ignoran:
`OPENCLAW_AGENT_RUNTIME`, estado de sesión `agentHarnessId`/`agentRuntimeOverride`,
`agents.defaults.agentRuntime` y `agents.list[].agentRuntime`. Ejecuta
`openclaw doctor --fix` para eliminar configuración obsoleta de runtime de
agente completo y convertir refs de modelo de runtime heredadas donde pueda
preservarse la intención.

Los runtimes de Plugin explícitos de proveedor/modelo fallan de forma cerrada:
`agentRuntime.id: "codex"` en un proveedor o modelo significa Codex, o un error
claro de selección/runtime; nunca se enruta silenciosamente de vuelta a
OpenClaw. Solo `auto` puede enrutar un turno no coincidente a OpenClaw.

Los alias de backend de CLI difieren de los ids de harness embebidos. Forma
preferida de Claude CLI:

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

Las refs heredadas como `claude-cli/claude-opus-4-7` siguen siendo compatibles
por compatibilidad, pero la configuración nueva debería mantener canónico el
proveedor/modelo y poner el backend de ejecución en la política de runtime de
proveedor/modelo.

Las refs heredadas `codex-cli/*` son distintas: doctor las migra a `openai/*`
para que se ejecuten mediante el harness de servidor de aplicación Codex en
lugar de preservar un backend Codex CLI.

El modo `auto` es intencionadamente conservador para la mayoría de proveedores.
Los modelos de agente de OpenAI son la excepción: runtime sin definir y `auto`
se resuelven ambos al harness Codex. La configuración explícita del runtime
OpenClaw sigue siendo una ruta de compatibilidad opcional para turnos de agente
`openai/*`; cuando se empareja con un perfil OAuth de `openai` seleccionado,
OpenClaw enruta esa ruta internamente mediante el transporte de autenticación
Codex mientras mantiene la ref de modelo pública como `openai/*`. Los pines de
sesión obsoletos de runtime OpenAI son ignorados por la selección de runtime y
pueden limpiarse con `openclaw doctor --fix`.

Si `openclaw doctor` advierte que el Plugin `codex` está habilitado mientras
siguen quedando refs de modelo Codex heredadas en la configuración, trátalo
como estado de ruta heredada y ejecuta `openclaw doctor --fix` para reescribirlo
a `openai/*` con el runtime Codex.

## Runtime de agente de GitHub Copilot

El Plugin externo `@openclaw/copilot` registra un runtime `copilot` opcional
respaldado por la CLI de GitHub Copilot (`@github/copilot-sdk`). Declara el
proveedor de suscripción canónico `github-copilot` y **nunca** se selecciona mediante
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

El arnés declara su proveedor, runtime, clave de sesión de CLI y prefijo de
perfil de autenticación en `extensions/copilot/doctor-contract-api.ts`, que
`openclaw doctor` carga automáticamente. Para configuración, autenticación,
duplicación de transcripciones, Compaction, el contrato declarativo de doctor y
la decisión más amplia entre el SDK de PI, Codex y Copilot, consulta
[runtime de agente de GitHub Copilot](/es/plugins/copilot).

## Contrato de compatibilidad

Cuando un runtime no es OpenClaw, su documentación debe indicar qué superficies de OpenClaw
admite:

| Pregunta                               | Por qué importa                                                                                    |
| -------------------------------------- | ------------------------------------------------------------------------------------------------- |
| ¿Quién posee el bucle del modelo?      | Determina dónde ocurren los reintentos, la continuación de herramientas y las decisiones de respuesta final. |
| ¿Quién posee el historial canónico del hilo? | Determina si OpenClaw puede editar el historial o solo duplicarlo.                                |
| ¿Funcionan las herramientas dinámicas de OpenClaw? | La mensajería, las sesiones, Cron y las herramientas propiedad de OpenClaw dependen de esto.      |
| ¿Funcionan los hooks de herramientas dinámicas? | Los plugins esperan `before_tool_call`, `after_tool_call` y middleware alrededor de las herramientas propiedad de OpenClaw. |
| ¿Funcionan los hooks de herramientas nativas? | Las herramientas de shell, parche y propiedad del runtime necesitan soporte de hooks nativos para políticas y observación. |
| ¿Se ejecuta el ciclo de vida del motor de contexto? | Los plugins de memoria y contexto dependen de ensamblar, ingerir, después del turno y el ciclo de vida de Compaction. |
| ¿Qué datos de Compaction se exponen?   | Algunos plugins solo necesitan notificaciones; otros necesitan metadatos conservados/eliminados.   |
| ¿Qué no se admite intencionadamente?   | Los usuarios no deben asumir equivalencia con OpenClaw cuando el runtime nativo posee más estado. |

El contrato de soporte del runtime de Codex está documentado en
[runtime de arnés de Codex](/es/plugins/codex-harness-runtime#v1-support-contract).

## Etiquetas de estado

La salida de estado puede mostrar las etiquetas `Execution` y `Runtime`. Léelas como
diagnósticos, no como nombres de proveedores:

- Una referencia de modelo como `openai/gpt-5.5` es el proveedor/modelo seleccionado.
- Un id de runtime como `codex` es el bucle que ejecuta el turno.
- Una etiqueta de canal como Telegram o Discord indica dónde ocurre la conversación.

Si una ejecución muestra un runtime inesperado, inspecciona primero la política de runtime
del proveedor/modelo seleccionado. Los pines de runtime de sesiones heredadas ya no deciden el enrutamiento.

## Relacionado

- [Arnés de Codex](/es/plugins/codex-harness)
- [Runtime de arnés de Codex](/es/plugins/codex-harness-runtime)
- [Runtime de agente de GitHub Copilot](/es/plugins/copilot)
- [OpenAI](/es/providers/openai)
- [Plugins de arnés de agente](/es/plugins/sdk-agent-harness)
- [Bucle de agente](/es/concepts/agent-loop)
- [Modelos](/es/concepts/models)
- [Estado](/es/cli/status)
