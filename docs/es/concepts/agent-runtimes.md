---
read_when:
    - Estás eligiendo entre PI, Codex, ACP u otro entorno de ejecución de agente nativo
    - Te confunden las etiquetas de proveedor/modelo/entorno de ejecución en el estado o la configuración
    - Estás documentando la paridad de soporte para un arnés nativo
summary: Cómo OpenClaw separa los proveedores de modelos, los modelos, los canales y los entornos de ejecución de agentes
title: Entornos de ejecución de agentes
x-i18n:
    generated_at: "2026-05-07T13:15:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: 417a3a7e12a881bc33023cc87553dd3536a63ad955d1e93d26f1014032303469
    source_path: concepts/agent-runtimes.md
    workflow: 16
---

Un **runtime de agente** es el componente que posee un bucle de modelo preparado: recibe el prompt, impulsa la salida del modelo, gestiona llamadas a herramientas nativas y devuelve el turno terminado a OpenClaw.

Los runtimes son fáciles de confundir con los proveedores porque ambos aparecen cerca de la configuración de modelos. Son capas distintas:

| Capa             | Ejemplos                              | Qué significa                                                               |
| ---------------- | ------------------------------------- | --------------------------------------------------------------------------- |
| Proveedor        | `openai`, `anthropic`, `openai-codex` | Cómo OpenClaw autentica, descubre modelos y nombra referencias de modelos. |
| Modelo           | `gpt-5.5`, `claude-opus-4-6`          | El modelo seleccionado para el turno del agente.                            |
| Runtime de agente | `pi`, `codex`, `claude-cli`           | El bucle o backend de bajo nivel que ejecuta el turno preparado.            |
| Canal            | Telegram, Discord, Slack, WhatsApp    | Dónde los mensajes entran y salen de OpenClaw.                              |

También verás la palabra **harness** en el código. Un harness es la implementación que proporciona un runtime de agente. Por ejemplo, el harness Codex incluido implementa el runtime `codex`. La configuración pública usa `agentRuntime.id`; `openclaw doctor --fix` reescribe claves antiguas de política de runtime a esa forma.

Hay dos familias de runtime:

- Los **harnesses integrados** se ejecutan dentro del bucle de agente preparado de OpenClaw. Actualmente esto es el runtime integrado `pi` más harnesses de Plugin registrados, como `codex`.
- Los **backends de CLI** ejecutan un proceso de CLI local manteniendo canónica la referencia del modelo. Por ejemplo, `anthropic/claude-opus-4-7` con `agentRuntime.id: "claude-cli"` significa "seleccionar el modelo Anthropic, ejecutar mediante Claude CLI". `claude-cli` no es un id de harness integrado y no debe pasarse a la selección de AgentHarness.

## Superficies de Codex

La mayor parte de la confusión viene de varias superficies distintas que comparten el nombre Codex:

| Superficie                                      | Nombre/configuración de OpenClaw       | Qué hace                                                                                                        |
| ----------------------------------------------- | -------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Runtime nativo de servidor de aplicación Codex  | referencias de modelo `openai/*`       | Ejecuta turnos de agente integrados de OpenAI mediante el servidor de aplicación Codex. Esta es la configuración habitual de suscripción ChatGPT/Codex. |
| Perfiles de autenticación OAuth de Codex        | proveedor de autenticación `openai-codex` | Almacena autenticación de suscripción ChatGPT/Codex que consume el harness del servidor de aplicación Codex.    |
| Adaptador ACP de Codex                          | `runtime: "acp"`, `agentId: "codex"`   | Ejecuta Codex mediante el plano de control externo ACP/acpx. Úsalo solo cuando se solicite explícitamente ACP/acpx. |
| Conjunto de comandos nativo de control de chat de Codex | `/codex ...`                           | Vincula, reanuda, dirige, detiene e inspecciona hilos del servidor de aplicación Codex desde el chat.           |
| Ruta de API de OpenAI Platform para superficies sin agente | `openai/*` más autenticación con clave de API | Se usa para API directas de OpenAI como imágenes, embeddings, voz y tiempo real.                                |

Esas superficies son independientes de forma intencional. Habilitar el Plugin `codex` hace que las funciones nativas del servidor de aplicación estén disponibles; `openclaw doctor --fix` se encarga de reparar rutas heredadas `openai-codex/*` y limpiar pines de sesión obsoletos. Seleccionar `openai/*` para un modelo de agente ahora significa "ejecutar esto mediante Codex" salvo que se esté usando una superficie de API de OpenAI sin agente.

La configuración común de suscripción ChatGPT/Codex usa OAuth de Codex para autenticación, pero mantiene la referencia del modelo como `openai/*` y selecciona el runtime `codex`:

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
    },
  },
}
```

Eso significa que OpenClaw selecciona una referencia de modelo de OpenAI y luego pide al runtime del servidor de aplicación Codex que ejecute el turno de agente integrado. No significa "usar facturación de API", y no significa que el canal, el catálogo del proveedor de modelos o el almacén de sesiones de OpenClaw se conviertan en Codex.

Cuando el Plugin `codex` incluido está habilitado, el control de Codex en lenguaje natural debe usar la superficie nativa de comandos `/codex` (`/codex bind`, `/codex threads`, `/codex resume`, `/codex steer`, `/codex stop`) en lugar de ACP. Usa ACP para Codex solo cuando el usuario pida explícitamente ACP/acpx o esté probando la ruta del adaptador ACP. Claude Code, Gemini CLI, OpenCode, Cursor y harnesses externos similares siguen usando ACP.

Este es el árbol de decisión orientado al agente:

1. Si el usuario pide **vincular/controlar/hilo/reanudar/dirigir/detener Codex**, usa la superficie nativa de comandos `/codex` cuando el Plugin `codex` incluido esté habilitado.
2. Si el usuario pide **Codex como runtime integrado** o quiere la experiencia normal de agente Codex respaldada por suscripción, usa `openai/<model>`.
3. Si el usuario elige explícitamente **PI para un modelo de OpenAI**, conserva la referencia del modelo como `openai/<model>` y establece `agentRuntime.id: "pi"`. Un perfil de autenticación `openai-codex` seleccionado se enruta internamente mediante el transporte heredado de autenticación Codex de PI.
4. Si la configuración heredada aún contiene **referencias de modelo `openai-codex/*`**, repárala a `openai/<model>` con `openclaw doctor --fix`.
5. Si el usuario dice explícitamente **ACP**, **acpx** o **adaptador ACP de Codex**, usa ACP con `runtime: "acp"` y `agentId: "codex"`.
6. Si la solicitud es para **Claude Code, Gemini CLI, OpenCode, Cursor, Droid u otro harness externo**, usa ACP/acpx, no el runtime nativo de subagente.

| Quieres decir...                         | Usa...                                      |
| ---------------------------------------- | ------------------------------------------ |
| Control de chat/hilo del servidor de aplicación Codex | `/codex ...` desde el Plugin `codex` incluido |
| Runtime de agente integrado del servidor de aplicación Codex | referencias de modelo de agente `openai/*` |
| OAuth de OpenAI Codex                    | perfiles de autenticación `openai-codex`   |
| Claude Code u otro harness externo       | ACP/acpx                                   |

Para la división del prefijo de la familia OpenAI, consulta [OpenAI](/es/providers/openai) y
[Proveedores de modelos](/es/concepts/model-providers). Para el contrato de soporte del
runtime de Codex, consulta [Arnés de Codex](/es/plugins/codex-harness#v1-support-contract).

## Propiedad del runtime

Distintos runtimes controlan distintas partes del bucle.

| Superficie                  | PI integrado en OpenClaw               | Servidor de aplicaciones de Codex                                            |
| --------------------------- | --------------------------------------- | --------------------------------------------------------------------------- |
| Propietario del bucle del modelo | OpenClaw mediante el ejecutor PI integrado | Servidor de aplicaciones de Codex                                            |
| Estado canónico del hilo    | Transcripción de OpenClaw               | Hilo de Codex, más espejo de la transcripción de OpenClaw                    |
| Herramientas dinámicas de OpenClaw | Bucle de herramientas nativo de OpenClaw | Puenteadas mediante el adaptador de Codex                                    |
| Herramientas nativas de shell y archivos | Ruta PI/OpenClaw                        | Herramientas nativas de Codex, puenteadas mediante hooks nativos donde se admita |
| Motor de contexto           | Ensamblado de contexto nativo de OpenClaw | OpenClaw proyecta el contexto ensamblado en el turno de Codex                |
| Compaction                  | OpenClaw o motor de contexto seleccionado | Compaction nativa de Codex, con notificaciones de OpenClaw y mantenimiento del espejo |
| Entrega de canales          | OpenClaw                                | OpenClaw                                                                    |

Esta división de propiedad es la regla de diseño principal:

- Si OpenClaw controla la superficie, OpenClaw puede proporcionar el comportamiento normal de hooks de Plugin.
- Si el runtime nativo controla la superficie, OpenClaw necesita eventos de runtime o hooks nativos.
- Si el runtime nativo controla el estado canónico del hilo, OpenClaw debe reflejar y proyectar el contexto, no reescribir elementos internos no admitidos.

## Selección del runtime

OpenClaw elige un runtime integrado después de resolver el proveedor y el modelo:

1. Gana el runtime registrado de una sesión. Los cambios de configuración no cambian en caliente una
   transcripción existente a un sistema de hilos nativo distinto.
2. `OPENCLAW_AGENT_RUNTIME=<id>` fuerza ese runtime para sesiones nuevas o restablecidas.
3. `agents.defaults.agentRuntime.id` o `agents.list[].agentRuntime.id` pueden definir
   `auto`, `pi`, un identificador de arnés integrado registrado como `codex`, o un
   alias de backend CLI compatible como `claude-cli`.
4. En modo `auto`, los runtimes de Plugin registrados pueden reclamar pares proveedor/modelo
   compatibles.
5. Si ningún runtime reclama un turno en modo `auto`, OpenClaw usa PI como
   runtime de compatibilidad. Usa un identificador de runtime explícito cuando la ejecución deba ser
   estricta.

Los runtimes de Plugin explícitos fallan de forma cerrada. Por ejemplo, `agentRuntime.id: "codex"`
significa Codex o un error claro de selección/runtime; nunca se redirige silenciosamente de vuelta
a PI.

Los alias de backend CLI son distintos de los identificadores de arnés integrado. La forma preferida
para Claude CLI es:

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
compatibilidad, pero la configuración nueva debe mantener el proveedor/modelo canónico y poner
el backend de ejecución en `agentRuntime.id`.

El modo `auto` es intencionalmente conservador para la mayoría de proveedores. Los modelos de agente
OpenAI son la excepción: el runtime sin definir y `auto` se resuelven ambos al arnés de Codex.
La configuración explícita del runtime PI sigue siendo una ruta de compatibilidad opcional para los
turnos de agente `openai/*`; cuando se combina con un perfil de autenticación `openai-codex` seleccionado,
OpenClaw enruta PI internamente mediante el transporte heredado de autenticación de Codex mientras
mantiene la referencia pública del modelo como `openai/*`. Los pines obsoletos de sesión PI de OpenAI sin
configuración explícita se reparan de vuelta a Codex.

Si `openclaw doctor` advierte que el Plugin `codex` está habilitado mientras
`openai-codex/*` permanece en la configuración, trátalo como estado de ruta heredada. Ejecuta
`openclaw doctor --fix` para reescribirlo a `openai/*` con el runtime de Codex.

## Contrato de compatibilidad

Cuando un runtime no es PI, debe documentar qué superficies de OpenClaw admite.
Usa esta forma para la documentación del runtime:

| Pregunta                               | Por qué importa                                                                                   |
| -------------------------------------- | ------------------------------------------------------------------------------------------------- |
| ¿Quién controla el bucle del modelo?   | Determina dónde ocurren los reintentos, la continuación de herramientas y las decisiones de respuesta final. |
| ¿Quién controla el historial canónico del hilo? | Determina si OpenClaw puede editar el historial o solo reflejarlo.                                |
| ¿Funcionan las herramientas dinámicas de OpenClaw? | La mensajería, las sesiones, Cron y las herramientas controladas por OpenClaw dependen de esto.   |
| ¿Funcionan los hooks de herramientas dinámicas? | Los Plugins esperan `before_tool_call`, `after_tool_call` y middleware alrededor de las herramientas controladas por OpenClaw. |
| ¿Funcionan los hooks de herramientas nativas? | Las herramientas de shell, patch y controladas por el runtime necesitan soporte de hooks nativos para políticas y observación. |
| ¿Se ejecuta el ciclo de vida del motor de contexto? | Los Plugins de memoria y contexto dependen del ciclo de vida de ensamblado, ingesta, después del turno y Compaction. |
| ¿Qué datos de Compaction se exponen?   | Algunos Plugins solo necesitan notificaciones, mientras que otros necesitan metadatos conservados/descartados. |
| ¿Qué no está admitido intencionalmente? | Los usuarios no deben asumir equivalencia con PI cuando el runtime nativo controla más estado.     |

El contrato de soporte del entorno de ejecución de Codex está documentado en
[arnés de Codex](/es/plugins/codex-harness#v1-support-contract).

## Etiquetas de estado

La salida de estado puede mostrar tanto las etiquetas `Execution` como `Runtime`. Léelas como
diagnósticos, no como nombres de proveedores.

- Una referencia de modelo como `openai/gpt-5.5` indica el proveedor/modelo seleccionado.
- Un id de entorno de ejecución como `codex` indica qué bucle está ejecutando el turno.
- Una etiqueta de canal como Telegram o Discord indica dónde está ocurriendo la conversación.

Si una sesión sigue mostrando PI después de cambiar la configuración del entorno de ejecución, inicia una sesión nueva
con `/new` o borra la actual con `/reset`. Las sesiones existentes conservan su
entorno de ejecución registrado para que una transcripción no se reproduzca mediante dos sistemas de sesión nativos
incompatibles.

## Relacionado

- [arnés de Codex](/es/plugins/codex-harness)
- [OpenAI](/es/providers/openai)
- [Plugins de arnés de agente](/es/plugins/sdk-agent-harness)
- [Bucle de agente](/es/concepts/agent-loop)
- [Modelos](/es/concepts/models)
- [Estado](/es/cli/status)
