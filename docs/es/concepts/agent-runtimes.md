---
read_when:
    - Está eligiendo entre OpenClaw, Codex, ACP u otro entorno de ejecución nativo para agentes
    - Te confunden las etiquetas de proveedor/modelo/entorno de ejecución en el estado o la configuración
    - Está documentando la paridad de compatibilidad de un arnés nativo
summary: Cómo separa OpenClaw los proveedores de modelos, los modelos, los canales y los entornos de ejecución de agentes
title: Entornos de ejecución de agentes
x-i18n:
    generated_at: "2026-07-12T14:23:57Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 47634daec4f88afa26ba47f33e1ed54b5768381bedeb7de7730fdb766566da89
    source_path: concepts/agent-runtimes.md
    workflow: 16
---

Un **entorno de ejecución de agente** posee un bucle de modelo preparado: recibe el prompt,
controla la salida del modelo, gestiona las llamadas a herramientas nativas y devuelve el turno finalizado
a OpenClaw.

Es fácil confundir los entornos de ejecución con los proveedores porque ambos aparecen cerca de la
configuración del modelo. Son capas diferentes:

| Capa                  | Ejemplos                                     | Significado                                                                                   |
| --------------------- | -------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Proveedor             | `anthropic`, `github-copilot`, `openai`      | Cómo autentica OpenClaw, descubre modelos y asigna nombres a las referencias de modelos.       |
| Modelo                | `claude-opus-4-6`, `gpt-5.6-sol`             | El modelo seleccionado para el turno del agente.                                              |
| Entorno de ejecución de agente | `claude-cli`, `codex`, `copilot`, `openclaw` | El bucle de bajo nivel o backend que ejecuta el turno preparado.                               |
| Canal                 | Discord, Slack, Telegram, WhatsApp           | Por dónde entran y salen los mensajes de OpenClaw.                                            |

Un **harness** es la implementación que proporciona un entorno de ejecución de agente (término de
código). Por ejemplo, el harness de Codex incluido implementa el entorno de ejecución `codex`.
La configuración pública usa `agentRuntime.id` en las entradas de proveedor o modelo; las claves de
entorno de ejecución para todo el agente son heredadas y se ignoran. `openclaw doctor --fix` elimina
las antiguas asignaciones de entorno de ejecución para todo el agente y reescribe las referencias de
modelos de entornos de ejecución heredados como referencias canónicas de proveedor/modelo, además de
una política de entorno de ejecución con ámbito de modelo cuando sea necesario.

Dos familias de entornos de ejecución:

- Los **harnesses integrados** se ejecutan dentro del bucle de agente preparado de OpenClaw: el
  entorno de ejecución `openclaw` incorporado, además de los harnesses de plugins registrados, como
  `codex` y `copilot`.
- Los **backends de CLI** ejecutan un proceso de CLI local mientras mantienen canónica la referencia
  del modelo. Por ejemplo, `anthropic/claude-opus-4-8` con
  `agentRuntime.id: "claude-cli"` con ámbito de modelo significa «seleccionar el modelo de Anthropic y
  ejecutarlo mediante Claude CLI». `claude-cli` no es un id de harness integrado y no debe
  pasarse a la selección de AgentHarness.

El harness `copilot` es un harness de plugin externo, independiente y opcional para la
CLI de GitHub Copilot; consulte [Entorno de ejecución de agente de GitHub Copilot](/es/plugins/copilot) para
conocer la decisión de cara al usuario entre los entornos de ejecución de agente PI, Codex y GitHub Copilot.

## Superficies de Codex

Varias superficies comparten el nombre Codex:

| Superficie                                       | Nombre/configuración de OpenClaw       | Qué hace                                                                                                                     |
| ------------------------------------------------ | -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Entorno de ejecución nativo del servidor de aplicaciones de Codex | Referencias de modelo `openai/*`       | Ejecuta turnos de agente integrados de OpenAI mediante el servidor de aplicaciones de Codex. Esta es la configuración habitual de suscripción de ChatGPT/Codex. |
| Perfiles de autenticación OAuth de Codex         | Perfiles OAuth de `openai`             | Almacena la autenticación de suscripción de ChatGPT/Codex que consume el harness del servidor de aplicaciones de Codex.      |
| Adaptador ACP de Codex                           | `runtime: "acp"`, `agentId: "codex"`   | Ejecuta Codex mediante el plano de control externo de ACP/acpx. Úselo solo cuando se solicite explícitamente ACP/acpx.        |
| Conjunto nativo de comandos de control de chat de Codex | `/codex ...`                       | Vincula, reanuda, dirige, detiene e inspecciona hilos del servidor de aplicaciones de Codex desde el chat.                   |
| Ruta de la API de OpenAI Platform para superficies sin agente | `openai/*` más autenticación con clave de API | API directas de OpenAI, como imágenes, incrustaciones, voz y tiempo real.                                              |

Estas superficies son independientes de forma intencionada. Habilitar el plugin `codex`
hace que estén disponibles las funciones nativas del servidor de aplicaciones; `openclaw doctor --fix` se encarga
de reparar las rutas heredadas de Codex y limpiar las asignaciones obsoletas de sesiones. Seleccionar `openai/*`
para un modelo de agente ahora significa «ejecutar esto mediante Codex», salvo que se esté utilizando una superficie
de API de OpenAI sin agente.

La configuración habitual de suscripción de ChatGPT/Codex usa OAuth de Codex para la autenticación, pero
mantiene la referencia de modelo como `openai/*` y selecciona el entorno de ejecución `codex`:

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.6-sol",
    },
  },
}
```

Esto significa que OpenClaw selecciona una referencia de modelo de OpenAI y, a continuación, solicita al entorno
de ejecución del servidor de aplicaciones de Codex que ejecute el turno de agente integrado. No significa «usar
facturación de API», ni que el canal, el catálogo de proveedores de modelos o el almacén de sesiones de
OpenClaw se conviertan en Codex.

Cuando el plugin `codex` incluido esté habilitado, use la superficie nativa de comandos `/codex`
(`/codex bind`, `/codex threads`, `/codex resume`, `/codex steer`,
`/codex stop`) para controlar Codex mediante lenguaje natural en lugar de ACP. Use ACP para
Codex solo cuando el usuario solicite explícitamente ACP/acpx o esté probando la ruta del adaptador
ACP. Claude Code, Gemini CLI, OpenCode, Cursor y otros harnesses externos similares
siguen usando ACP.

Árbol de decisión:

1. **Vincular/controlar/hilo/reanudar/dirigir/detener Codex** -> superficie nativa de comandos `/codex` cuando el plugin `codex` incluido esté habilitado.
2. **Codex como entorno de ejecución integrado** o la experiencia normal de agente de Codex respaldada por suscripción -> `openai/<model>`.
3. **OpenClaw elegido explícitamente para un modelo de OpenAI** -> mantenga la referencia de modelo como `openai/<model>` y establezca la política de entorno de ejecución del proveedor/modelo en `agentRuntime.id: "openclaw"`. Un perfil OAuth de `openai` seleccionado se enruta internamente mediante el transporte de autenticación de Codex de OpenClaw.
4. **Referencias heredadas de modelos de Codex en la configuración** -> repárelas con `openclaw doctor --fix` como `openai/<model>`; doctor conserva la ruta de autenticación de Codex añadiendo `agentRuntime.id: "codex"` con ámbito de proveedor/modelo cuando la referencia de modelo antigua lo implicaba. Las referencias heredadas de modelos **`codex-cli/*`** se reparan para usar la misma ruta `openai/<model>` del servidor de aplicaciones de Codex; OpenClaw ya no mantiene un backend de CLI de Codex incluido.
5. **Se solicita explícitamente ACP, acpx o el adaptador ACP de Codex** -> `runtime: "acp"` y `agentId: "codex"`.
6. **Claude Code, Gemini CLI, OpenCode, Cursor, Droid u otro harness externo** -> ACP/acpx, no el entorno de ejecución nativo de subagentes.

| Se refiere a...                                  | Use...                                                   |
| ------------------------------------------------ | -------------------------------------------------------- |
| Control de chat/hilos del servidor de aplicaciones de Codex | `/codex ...` del plugin `codex` incluido         |
| Entorno de ejecución de agente integrado del servidor de aplicaciones de Codex | Referencias de modelo de agente `openai/*` |
| OAuth de OpenAI Codex                            | Perfiles OAuth de `openai`                               |
| Claude Code u otro harness externo               | ACP/acpx                                                 |

Para conocer la división de prefijos de la familia OpenAI, consulte [OpenAI](/es/providers/openai) y
[Proveedores de modelos](/es/concepts/model-providers). Para conocer el contrato de compatibilidad del entorno de ejecución
de Codex, consulte [Entorno de ejecución del harness de Codex](/es/plugins/codex-harness-runtime#v1-support-contract).

## Propiedad del entorno de ejecución

Los distintos entornos de ejecución controlan diferentes partes del bucle:

| Superficie                  | Integrado de OpenClaw                            | Servidor de aplicaciones de Codex                                                |
| --------------------------- | ------------------------------------------------ | -------------------------------------------------------------------------------- |
| Propietario del bucle del modelo | OpenClaw, mediante el ejecutor integrado de OpenClaw | Servidor de aplicaciones de Codex                                           |
| Estado canónico del hilo    | Transcripción de OpenClaw                        | Hilo de Codex, más un reflejo de la transcripción de OpenClaw                    |
| Herramientas dinámicas de OpenClaw | Bucle de herramientas nativo de OpenClaw  | Conectadas mediante el adaptador de Codex                                        |
| Herramientas nativas de shell y archivos | Ruta de OpenClaw                       | Herramientas nativas de Codex, conectadas mediante hooks nativos cuando se admitan |
| Motor de contexto           | Ensamblaje de contexto nativo de OpenClaw        | OpenClaw proyecta el contexto ensamblado en el turno de Codex                    |
| Compaction                  | OpenClaw o el motor de contexto seleccionado     | Compaction nativa de Codex, con notificaciones de OpenClaw y mantenimiento del reflejo |
| Entrega al canal            | OpenClaw                                         | OpenClaw                                                                         |

Regla de diseño: si OpenClaw controla la superficie, puede proporcionar el comportamiento normal de los hooks de
plugins. Si el entorno de ejecución nativo controla la superficie, OpenClaw necesita eventos del entorno de
ejecución o hooks nativos. Si el entorno de ejecución nativo controla el estado canónico del hilo,
OpenClaw refleja y proyecta el contexto en lugar de reescribir componentes internos no compatibles.

## Selección del entorno de ejecución

OpenClaw resuelve un entorno de ejecución integrado después de resolver el proveedor y el modelo, en
este orden:

1. La **política de entorno de ejecución con ámbito de modelo** tiene prioridad. Se encuentra en una entrada de modelo
   de proveedor configurada, o en `agents.defaults.models["provider/model"].agentRuntime`
   / `agents.list[].models["provider/model"].agentRuntime`. Un comodín de proveedor,
   como `agents.defaults.models["vllm/*"].agentRuntime`, se aplica después de la política exacta del modelo,
   por lo que los modelos de proveedor descubiertos dinámicamente pueden compartir un entorno de ejecución sin
   sobrescribir las excepciones exactas por modelo.
2. **Política de entorno de ejecución con ámbito de proveedor**: `models.providers.<provider>.agentRuntime`.
3. **Modo `auto`**: los entornos de ejecución de plugins registrados pueden reclamar pares de proveedor/modelo compatibles.
4. Si nada reclama el turno en modo `auto`, OpenClaw recurre a
   `openclaw` como entorno de ejecución de compatibilidad. Use un id de entorno de ejecución explícito cuando
   la ejecución deba ser estricta.

Se ignoran las asignaciones de entorno de ejecución para toda la sesión y todo el agente: `OPENCLAW_AGENT_RUNTIME`,
el estado de sesión `agentHarnessId`/`agentRuntimeOverride`, `agents.defaults.agentRuntime`
y `agents.list[].agentRuntime`. Ejecute `openclaw doctor --fix` para eliminar la configuración obsoleta
de entorno de ejecución para todo el agente y convertir las referencias heredadas de modelos de entorno de ejecución cuando
pueda conservarse la intención.

Los entornos de ejecución de plugins explícitos de proveedor/modelo aplican un cierre seguro: `agentRuntime.id: "codex"`
en un proveedor o modelo significa Codex, o un error claro de selección/entorno de ejecución; nunca
se redirige silenciosamente a OpenClaw. Solo `auto` puede dirigir a OpenClaw un
turno sin coincidencias.

Los alias de backends de CLI son diferentes de los ids de harnesses integrados. Forma preferida de Claude CLI:

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

Las referencias heredadas, como `claude-cli/claude-opus-4-7`, siguen siendo compatibles por
motivos de compatibilidad, pero la configuración nueva debe mantener canónicos el proveedor/modelo y
ubicar el backend de ejecución en la política de entorno de ejecución del proveedor/modelo.

Las referencias heredadas `codex-cli/*` son diferentes: doctor las migra a `openai/*` para
que se ejecuten mediante el harness del servidor de aplicaciones de Codex en lugar de conservar un backend de CLI
de Codex.

El modo `auto` es intencionadamente conservador para la mayoría de los proveedores. Los modelos de agente de OpenAI
son la excepción: tanto un entorno de ejecución sin establecer como `auto` se resuelven al harness de Codex.
La configuración explícita del entorno de ejecución de OpenClaw sigue siendo una ruta de compatibilidad opcional
para turnos de agente `openai/*`; cuando se combina con un perfil OAuth de `openai` seleccionado,
OpenClaw dirige esa ruta internamente mediante el transporte de autenticación de Codex
mientras mantiene la referencia pública del modelo como `openai/*`. Las asignaciones obsoletas de sesiones del
entorno de ejecución de OpenAI se ignoran durante la selección del entorno de ejecución y pueden limpiarse con
`openclaw doctor --fix`.

Si `openclaw doctor` advierte que el plugin `codex` está habilitado mientras quedan referencias
heredadas de modelos de Codex en la configuración, trate ese estado como una ruta heredada y ejecute
`openclaw doctor --fix` para reescribirla como `openai/*` con el entorno de ejecución de Codex.

## Entorno de ejecución de agente de GitHub Copilot

El plugin externo `@openclaw/copilot` registra un runtime `copilot` opcional
respaldado por la CLI de GitHub Copilot (`@github/copilot-sdk`). Reclama el
proveedor de suscripción canónico `github-copilot` y **nunca** lo selecciona
`auto`. Actívelo por modelo o por proveedor mediante `agentRuntime.id`:

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

El arnés reclama su proveedor, runtime, clave de sesión de la CLI y prefijo de
perfil de autenticación en `extensions/copilot/doctor-contract-api.ts`, que
`openclaw doctor` carga automáticamente. Para obtener información sobre la
configuración, la autenticación, el reflejo de transcripciones, Compaction, el
contrato declarativo de doctor y la decisión más amplia entre los SDK de PI,
Codex y Copilot, consulte [Runtime de agente de GitHub Copilot](/es/plugins/copilot).

## Contrato de compatibilidad

Cuando un runtime no sea OpenClaw, su documentación debe indicar qué
superficies de OpenClaw admite:

| Pregunta                                      | Por qué es importante                                                                                                      |
| --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| ¿Quién controla el bucle del modelo?          | Determina dónde se gestionan los reintentos, la continuación de herramientas y las decisiones sobre la respuesta final.    |
| ¿Quién controla el historial canónico del hilo? | Determina si OpenClaw puede editar el historial o solo reflejarlo.                                                        |
| ¿Funcionan las herramientas dinámicas de OpenClaw? | La mensajería, las sesiones, Cron y las herramientas controladas por OpenClaw dependen de ello.                         |
| ¿Funcionan los hooks de herramientas dinámicas? | Los Plugins esperan `before_tool_call`, `after_tool_call` y middleware en torno a las herramientas controladas por OpenClaw. |
| ¿Funcionan los hooks de herramientas nativas? | El shell, los parches y las herramientas controladas por el runtime necesitan compatibilidad con hooks nativos para las políticas y la observación. |
| ¿Se ejecuta el ciclo de vida del motor de contexto? | Los plugins de memoria y contexto dependen de los ciclos de ensamblaje, ingesta, posterior al turno y Compaction.       |
| ¿Qué datos de Compaction se exponen?          | Algunos plugins solo necesitan notificaciones; otros necesitan metadatos sobre lo conservado y lo descartado.              |
| ¿Qué no se admite intencionadamente?          | Los usuarios no deben suponer equivalencia con OpenClaw cuando el runtime nativo controla más estado.                      |

El contrato de compatibilidad del runtime de Codex está documentado en
[Runtime del arnés de Codex](/es/plugins/codex-harness-runtime#v1-support-contract).

## Etiquetas de estado

La salida de estado puede mostrar las etiquetas `Execution` y `Runtime`. Deben
interpretarse como datos de diagnóstico, no como nombres de proveedores:

- Una referencia de modelo como `openai/gpt-5.6-sol` es el proveedor/modelo seleccionado.
- Un identificador de runtime como `codex` es el bucle que ejecuta el turno.
- Una etiqueta de canal como Telegram o Discord indica dónde tiene lugar la conversación.

Si una ejecución muestra un runtime inesperado, inspeccione primero la política
de runtime del proveedor/modelo seleccionado. Las fijaciones heredadas del
runtime de sesión ya no determinan el enrutamiento.

## Relacionado

- [Arnés de Codex](/es/plugins/codex-harness)
- [Runtime del arnés de Codex](/es/plugins/codex-harness-runtime)
- [Runtime de agente de GitHub Copilot](/es/plugins/copilot)
- [OpenAI](/es/providers/openai)
- [Plugins de arnés de agente](/es/plugins/sdk-agent-harness)
- [Bucle del agente](/es/concepts/agent-loop)
- [Modelos](/es/concepts/models)
- [Estado](/es/cli/status)
