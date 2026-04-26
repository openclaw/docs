---
read_when:
    - Estás cambiando el entorno de ejecución del agente integrado o el registro de arneses
    - Estás registrando un arnés del agente desde un Plugin incluido o de confianza
    - Necesitas entender cómo se relaciona el Plugin Codex con los proveedores de modelos
sidebarTitle: Agent Harness
summary: Superficie experimental del SDK para plugins que reemplazan el ejecutor integrado de bajo nivel del agente
title: Plugins de arnés del agente
x-i18n:
    generated_at: "2026-04-26T11:34:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: 340fc6207dabc6ffe7ffb9c07ca9e80e76f1034d4978c41279dc826468302181
    source_path: plugins/sdk-agent-harness.md
    workflow: 15
---

Un **arnés del agente** es el ejecutor de bajo nivel para un turno de agente preparado de OpenClaw. No es un proveedor de modelos, no es un canal y no es un registro de herramientas.
Para el modelo mental orientado al usuario, consulta [Entornos de ejecución del agente](/es/concepts/agent-runtimes).

Usa esta superficie solo para plugins nativos incluidos o de confianza. El contrato
sigue siendo experimental porque los tipos de parámetros reflejan intencionalmente el ejecutor integrado actual.

## Cuándo usar un arnés

Registra un arnés del agente cuando una familia de modelos tiene su propio entorno
de ejecución nativo de sesión y el transporte normal de provider de OpenClaw es una abstracción incorrecta.

Ejemplos:

- un servidor nativo de coding-agent que es dueño de hilos y Compaction
- una CLI o daemon local que debe transmitir eventos nativos de plan/razonamiento/herramienta
- un entorno de ejecución de modelo que necesita su propio id de reanudación además de la
  transcripción de sesión de OpenClaw

**No** registres un arnés solo para añadir una nueva API de LLM. Para APIs normales de modelos por HTTP o
WebSocket, crea un [Plugin de provider](/es/plugins/sdk-provider-plugins).

## Qué sigue siendo propiedad del core

Antes de que se seleccione un arnés, OpenClaw ya ha resuelto:

- provider y modelo
- estado de autenticación del entorno de ejecución
- nivel de Thinking y presupuesto de contexto
- la transcripción/archivo de sesión de OpenClaw
- espacio de trabajo, sandbox y política de herramientas
- callbacks de respuesta de canal y callbacks de transmisión
- política de respaldo de modelo y cambio en vivo de modelo

Esa división es intencional. Un arnés ejecuta un intento preparado; no elige
providers, no reemplaza la entrega del canal ni cambia modelos silenciosamente.

El intento preparado también incluye `params.runtimePlan`, un paquete de políticas
propiedad de OpenClaw para decisiones de runtime que deben seguir compartidas entre PI y los arneses nativos:

- `runtimePlan.tools.normalize(...)` y
  `runtimePlan.tools.logDiagnostics(...)` para política de esquema de herramientas con conocimiento del provider
- `runtimePlan.transcript.resolvePolicy(...)` para saneamiento de transcripción y política de reparación de llamadas a herramientas
- `runtimePlan.delivery.isSilentPayload(...)` para supresión compartida de entrega de `NO_REPLY` y medios
- `runtimePlan.outcome.classifyRunResult(...)` para clasificación de respaldo de modelo
- `runtimePlan.observability` para metadatos resueltos de provider/modelo/arnés

Los arneses pueden usar el plan para decisiones que necesiten coincidir con el comportamiento de PI, pero deben seguir tratándolo como estado del intento propiedad del host. No lo muten ni lo usen para cambiar providers/modelos dentro de un turno.

## Registrar un arnés

**Importar:** `openclaw/plugin-sdk/agent-harness`

```typescript
import type { AgentHarness } from "openclaw/plugin-sdk/agent-harness";
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

const myHarness: AgentHarness = {
  id: "my-harness",
  label: "Mi arnés nativo de agente",

  supports(ctx) {
    return ctx.provider === "my-provider"
      ? { supported: true, priority: 100 }
      : { supported: false };
  },

  async runAttempt(params) {
    // Inicia o reanuda tu hilo nativo.
    // Usa params.prompt, params.tools, params.images, params.onPartialReply,
    // params.onAgentEvent y los demás campos del intento preparado.
    return await runMyNativeTurn(params);
  },
};

export default definePluginEntry({
  id: "my-native-agent",
  name: "Mi agente nativo",
  description: "Ejecuta modelos seleccionados mediante un daemon de agente nativo.",
  register(api) {
    api.registerAgentHarness(myHarness);
  },
});
```

## Política de selección

OpenClaw elige un arnés después de la resolución de provider/modelo:

1. El id de arnés registrado de una sesión existente prevalece, para que los cambios de config/env no cambien en caliente esa transcripción a otro runtime.
2. `OPENCLAW_AGENT_RUNTIME=<id>` fuerza un arnés registrado con ese id para sesiones que aún no estén fijadas.
3. `OPENCLAW_AGENT_RUNTIME=pi` fuerza el arnés PI integrado.
4. `OPENCLAW_AGENT_RUNTIME=auto` pregunta a los arneses registrados si admiten el
   provider/modelo resuelto.
5. Si ningún arnés registrado coincide, OpenClaw usa PI a menos que el respaldo a PI
   esté deshabilitado.

Los fallos de arnés de plugin aparecen como fallos de ejecución. En modo `auto`, el respaldo a PI
solo se usa cuando ningún arnés de plugin registrado admite el
provider/modelo resuelto. Una vez que un arnés de plugin ha reclamado una ejecución, OpenClaw no
reproduce ese mismo turno a través de PI porque eso puede cambiar la semántica de autenticación/runtime
o duplicar efectos secundarios.

El id del arnés seleccionado se persiste con el id de sesión después de una ejecución integrada.
Las sesiones heredadas creadas antes de fijar arneses se tratan como fijadas a PI una vez que tienen
historial de transcripción. Usa una sesión nueva/reiniciada al cambiar entre PI y un
arnés nativo de plugin. `/status` muestra ids de arnés no predeterminados como `codex`
junto a `Fast`; PI permanece oculto porque es la ruta de compatibilidad predeterminada.
Si el arnés seleccionado resulta sorprendente, habilita el registro de depuración `agents/harness` e
inspecciona el registro estructurado del gateway `agent harness selected`. Incluye
el id del arnés seleccionado, el motivo de selección, la política de runtime/respaldo y, en
modo `auto`, el resultado de compatibilidad de cada candidato de plugin.

El Plugin Codex incluido registra `codex` como su id de arnés. El core trata eso
como un id de arnés de plugin ordinario; los alias específicos de Codex pertenecen al plugin
o a la configuración del operator, no al selector de runtime compartido.

## Emparejamiento de provider + arnés

La mayoría de los arneses también deberían registrar un provider. El provider hace que las referencias de modelo,
el estado de autenticación, los metadatos del modelo y la selección `/model` sean visibles para el resto de
OpenClaw. Luego el arnés reclama ese provider en `supports(...)`.

El Plugin Codex incluido sigue este patrón:

- referencias de modelo preferidas por el usuario: `openai/gpt-5.5` más
  `agentRuntime.id: "codex"`
- referencias de compatibilidad: se siguen aceptando las referencias heredadas `codex/gpt-*`, pero las configuraciones nuevas no deben usarlas como referencias normales provider/model
- id de arnés: `codex`
- autenticación: disponibilidad sintética del provider, porque el arnés Codex es dueño del inicio de sesión/sesión nativa de Codex
- solicitud app-server: OpenClaw envía el id de modelo desnudo a Codex y deja que el
  arnés hable con el protocolo nativo de app-server

El Plugin Codex es aditivo. Las referencias simples `openai/gpt-*` siguen usando la
ruta normal de provider de OpenClaw a menos que fuerces el arnés Codex con
`agentRuntime.id: "codex"`. Las referencias antiguas `codex/gpt-*` siguen seleccionando el
provider y arnés Codex por compatibilidad.

Para configuración de operator, ejemplos de prefijos de modelo y configuraciones solo Codex, consulta
[Arnés Codex](/es/plugins/codex-harness).

OpenClaw requiere app-server de Codex `0.125.0` o superior. El Plugin Codex comprueba
el handshake de inicialización del app-server y bloquea servidores antiguos o sin versión para que
OpenClaw solo se ejecute contra la superficie de protocolo con la que se ha probado. El
mínimo `0.125.0` incluye el soporte de carga útil nativa de hooks MCP que llegó en
Codex `0.124.0`, a la vez que fija OpenClaw en la línea estable más reciente probada.

### Middleware de resultado de herramientas

Los plugins incluidos pueden adjuntar middleware de resultado de herramientas neutral al runtime mediante
`api.registerAgentToolResultMiddleware(...)` cuando su manifiesto declara los
ids de runtime de destino en `contracts.agentToolResultMiddleware`. Esta unión de confianza
es para transformaciones asíncronas de resultados de herramientas que deben ejecutarse antes de que PI o Codex devuelvan
la salida de la herramienta al modelo.

Los plugins incluidos heredados pueden seguir usando
`api.registerCodexAppServerExtensionFactory(...)` para middleware solo del app-server de Codex, pero las nuevas transformaciones de resultados deberían usar la API neutral al runtime.
El hook solo Pi `api.registerEmbeddedExtensionFactory(...)` ha sido eliminado;
las transformaciones de resultado de herramientas de Pi deben usar middleware neutral al runtime.

### Clasificación de resultado terminal

Los arneses nativos que son dueños de su propia proyección de protocolo pueden usar
`classifyAgentHarnessTerminalOutcome(...)` de
`openclaw/plugin-sdk/agent-harness-runtime` cuando un turno completado no produjo
texto visible del asistente. El helper devuelve `empty`, `reasoning-only` o
`planning-only` para que la política de respaldo de OpenClaw pueda decidir si reintenta con
un modelo diferente. Intencionalmente deja sin clasificar errores de prompt, turnos en curso y respuestas silenciosas intencionadas como `NO_REPLY`.

### Modo de arnés Codex nativo

El arnés incluido `codex` es el modo Codex nativo para turnos de agente integrado de OpenClaw.
Primero habilita el Plugin incluido `codex`, e incluye `codex` en
`plugins.allow` si tu configuración usa una lista de permitidos restrictiva. Las configuraciones nativas de app-server deben usar `openai/gpt-*` con `agentRuntime.id: "codex"`.
Usa `openai-codex/*` para OAuth de Codex mediante PI en su lugar. Las referencias de modelo heredadas `codex/*` siguen siendo alias de compatibilidad para el arnés nativo.

Cuando este modo se ejecuta, Codex es dueño del id de hilo nativo, comportamiento de reanudación,
Compaction y ejecución del app-server. OpenClaw sigue siendo dueño del canal de chat,
espejo de transcripción visible, política de herramientas, aprobaciones, entrega de medios y selección de sesión. Usa `agentRuntime.id: "codex"` sin sobrescritura `fallback`
cuando necesites demostrar que solo la ruta app-server de Codex puede reclamar la ejecución.
Los runtimes explícitos de plugin ya fallan de forma cerrada por defecto. Establece `fallback: "pi"`
solo cuando intencionalmente quieras que PI maneje la falta de selección de arnés. Los fallos del app-server de Codex ya fallan directamente en lugar de reintentarse mediante PI.

## Deshabilitar respaldo a PI

Por defecto, OpenClaw ejecuta agentes integrados con `agents.defaults.agentRuntime`
establecido en `{ id: "auto", fallback: "pi" }`. En modo `auto`, los arneses de plugin registrados
pueden reclamar un par provider/modelo. Si ninguno coincide, OpenClaw recurre a PI.

En modo `auto`, establece `fallback: "none"` cuando necesites que la falta de selección de arnés de plugin
falle en lugar de usar PI. Los runtimes explícitos de plugin como
`runtime: "codex"` ya fallan de forma cerrada por defecto, a menos que `fallback: "pi"` esté
establecido en el mismo ámbito de sobrescritura de configuración o entorno. Los fallos de arnés de plugin ya seleccionado siempre fallan de forma dura. Esto no bloquea un `runtime: "pi"` explícito ni `OPENCLAW_AGENT_RUNTIME=pi`.

Para ejecuciones integradas solo de Codex:

```json
{
  "agents": {
    "defaults": {
      "model": "openai/gpt-5.5",
      "agentRuntime": {
        "id": "codex"
      }
    }
  }
}
```

Si quieres que cualquier arnés de plugin registrado reclame modelos coincidentes pero nunca
quieres que OpenClaw recurra silenciosamente a PI, mantén `runtime: "auto"` y deshabilita
el respaldo:

```json
{
  "agents": {
    "defaults": {
      "agentRuntime": {
        "id": "auto",
        "fallback": "none"
      }
    }
  }
}
```

Las sobrescrituras por agente usan la misma forma:

```json
{
  "agents": {
    "defaults": {
      "agentRuntime": {
        "id": "auto",
        "fallback": "pi"
      }
    },
    "list": [
      {
        "id": "codex-only",
        "model": "openai/gpt-5.5",
        "agentRuntime": {
          "id": "codex",
          "fallback": "none"
        }
      }
    ]
  }
}
```

`OPENCLAW_AGENT_RUNTIME` sigue sobrescribiendo el runtime configurado. Usa
`OPENCLAW_AGENT_HARNESS_FALLBACK=none` para deshabilitar el respaldo a PI desde el
entorno.

```bash
OPENCLAW_AGENT_RUNTIME=codex \
OPENCLAW_AGENT_HARNESS_FALLBACK=none \
openclaw gateway run
```

Con el respaldo deshabilitado, una sesión falla pronto cuando el arnés solicitado no está
registrado, no admite el provider/modelo resuelto o falla antes de
producir efectos secundarios del turno. Eso es intencional para despliegues solo de Codex y
para pruebas en vivo que deben demostrar que la ruta app-server de Codex se está usando realmente.

Esta configuración solo controla el arnés de agente integrado. No deshabilita
el enrutamiento específico por provider de imagen, video, música, TTS, PDF u otros modelos.

## Sesiones nativas y espejo de transcripción

Un arnés puede mantener un id de sesión nativo, id de hilo o token de reanudación del lado del daemon.
Mantén esa vinculación asociada explícitamente con la sesión de OpenClaw y sigue
reflejando la salida visible para el usuario del asistente/herramienta en la transcripción de OpenClaw.

La transcripción de OpenClaw sigue siendo la capa de compatibilidad para:

- historial de sesión visible en el canal
- búsqueda e indexación de transcripciones
- volver al arnés integrado PI en un turno posterior
- comportamiento genérico de `/new`, `/reset` y eliminación de sesión

Si tu arnés almacena una vinculación sidecar, implementa `reset(...)` para que OpenClaw pueda
borrarla cuando se reinicie la sesión propietaria de OpenClaw.

## Resultados de herramientas y medios

El core construye la lista de herramientas de OpenClaw y la pasa al intento preparado.
Cuando un arnés ejecuta una llamada de herramienta dinámica, devuelve el resultado de la herramienta a través
de la forma de resultado del arnés en lugar de enviar tú mismo medios del canal.

Esto mantiene texto, imagen, video, música, TTS, aprobación y salidas de herramientas de mensajería
en la misma ruta de entrega que las ejecuciones respaldadas por PI.

## Limitaciones actuales

- La ruta pública de importación es genérica, pero algunos alias de tipo de intento/resultado aún
  llevan nombres `Pi` por compatibilidad.
- La instalación de arneses de terceros es experimental. Prefiere plugins de provider
  hasta que necesites un entorno de sesión nativo.
- El cambio de arnés es compatible entre turnos. No cambies de arnés en medio de un turno después de que hayan comenzado herramientas nativas, aprobaciones, texto del asistente o envíos de mensajes.

## Relacionado

- [Resumen del SDK](/es/plugins/sdk-overview)
- [Helpers de runtime](/es/plugins/sdk-runtime)
- [Plugins de provider](/es/plugins/sdk-provider-plugins)
- [Arnés Codex](/es/plugins/codex-harness)
- [Providers de modelos](/es/concepts/model-providers)
