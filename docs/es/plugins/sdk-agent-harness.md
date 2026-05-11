---
read_when:
    - Está cambiando el runtime del agente integrado o el registro del arnés
    - Estás registrando un arnés de agente desde un plugin incluido o de confianza
    - Debes entender cómo se relaciona el Plugin de Codex con los proveedores de modelos
sidebarTitle: Agent Harness
summary: Superficie experimental del SDK para plugins que reemplazan el ejecutor de agentes integrado de bajo nivel
title: Plugins de arnés de agente
x-i18n:
    generated_at: "2026-05-11T20:46:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1685af479a8502ac743b0f520f0afae2cdc905524e48b3a84ce95ffe85c8fb49
    source_path: plugins/sdk-agent-harness.md
    workflow: 16
---

Un **arnés de agente** es el ejecutor de bajo nivel para un turno preparado de agente de OpenClaw. No es un proveedor de modelos, ni un canal, ni un registro de herramientas. Para el modelo mental orientado al usuario, consulta [Tiempos de ejecución de agentes](/es/concepts/agent-runtimes).

Usa esta superficie solo para plugins nativos incluidos o de confianza. El contrato aún es experimental porque los tipos de parámetros reflejan intencionalmente el ejecutor integrado actual.

## Cuándo usar un arnés

Registra un arnés de agente cuando una familia de modelos tiene su propio tiempo de ejecución de sesión nativo y el transporte normal de proveedor de OpenClaw no es la abstracción adecuada.

Ejemplos:

- un servidor de agente de programación nativo que posee hilos y Compaction
- una CLI o daemon local que debe transmitir eventos nativos de plan/razonamiento/herramientas
- un tiempo de ejecución de modelo que necesita su propio id de reanudación además de la transcripción de sesión de OpenClaw

No registres **un** arnés solo para agregar una nueva API de LLM. Para API de modelos HTTP o WebSocket normales, crea un [plugin de proveedor](/es/plugins/sdk-provider-plugins).

## Lo que core aún posee

Antes de seleccionar un arnés, OpenClaw ya ha resuelto:

- proveedor y modelo
- estado de autenticación del tiempo de ejecución
- nivel de pensamiento y presupuesto de contexto
- el archivo de transcripción/sesión de OpenClaw
- workspace, sandbox y política de herramientas
- callbacks de respuesta del canal y callbacks de streaming
- fallback de modelo y política de cambio de modelo en vivo

Esa división es intencional. Un arnés ejecuta un intento preparado; no elige proveedores, no reemplaza la entrega del canal ni cambia modelos de forma silenciosa.

El intento preparado también incluye `params.runtimePlan`, un paquete de políticas propiedad de OpenClaw para decisiones de tiempo de ejecución que deben permanecer compartidas entre PI y los arneses nativos:

- `runtimePlan.tools.normalize(...)` y
  `runtimePlan.tools.logDiagnostics(...)` para la política de esquemas de herramientas consciente del proveedor
- `runtimePlan.transcript.resolvePolicy(...)` para saneamiento de transcripciones y política de reparación de llamadas a herramientas
- `runtimePlan.delivery.isSilentPayload(...)` para `NO_REPLY` compartido y supresión de entrega de medios
- `runtimePlan.outcome.classifyRunResult(...)` para clasificación de fallback de modelo
- `runtimePlan.observability` para metadatos resueltos de proveedor/modelo/arnés

Los arneses pueden usar el plan para decisiones que deben coincidir con el comportamiento de PI, pero aun así deben tratarlo como estado de intento propiedad del host. No lo mutes ni lo uses para cambiar proveedores/modelos dentro de un turno.

## Registrar un arnés

**Importación:** `openclaw/plugin-sdk/agent-harness`

```typescript
import type { AgentHarness } from "openclaw/plugin-sdk/agent-harness";
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

const myHarness: AgentHarness = {
  id: "my-harness",
  label: "My native agent harness",

  supports(ctx) {
    return ctx.provider === "my-provider"
      ? { supported: true, priority: 100 }
      : { supported: false };
  },

  async runAttempt(params) {
    // Start or resume your native thread.
    // Use params.prompt, params.tools, params.images, params.onPartialReply,
    // params.onAgentEvent, and the other prepared attempt fields.
    return await runMyNativeTurn(params);
  },
};

export default definePluginEntry({
  id: "my-native-agent",
  name: "My Native Agent",
  description: "Runs selected models through a native agent daemon.",
  register(api) {
    api.registerAgentHarness(myHarness);
  },
});
```

## Política de selección

OpenClaw elige un arnés después de resolver el proveedor/modelo:

1. Gana la política de tiempo de ejecución con alcance de modelo.
2. Luego viene la política de tiempo de ejecución con alcance de proveedor.
3. `auto` pregunta a los arneses registrados si admiten el proveedor/modelo resuelto.
4. Si ningún arnés registrado coincide, OpenClaw usa PI salvo que el fallback a PI esté deshabilitado.

Los fallos de arneses de Plugin aparecen como fallos de ejecución. En modo `auto`, el fallback a PI solo se usa cuando ningún arnés de plugin registrado admite el proveedor/modelo resuelto. Una vez que un arnés de plugin ha reclamado una ejecución, OpenClaw no reproduce ese mismo turno mediante PI porque eso puede cambiar la semántica de autenticación/tiempo de ejecución o duplicar efectos secundarios.

La selección ignora los pines de tiempo de ejecución de sesión completa y de agente completo. Eso incluye valores obsoletos de sesión `agentHarnessId`, `agents.defaults.agentRuntime`, `agents.list[].agentRuntime` y `OPENCLAW_AGENT_RUNTIME`. `/status` muestra el tiempo de ejecución efectivo seleccionado a partir de la ruta proveedor/modelo. Si el arnés seleccionado resulta sorprendente, habilita el registro de depuración `agents/harness` e inspecciona el registro estructurado `agent harness selected` del gateway. Incluye el id del arnés seleccionado, la razón de selección, la política de tiempo de ejecución/fallback y, en modo `auto`, el resultado de soporte de cada candidato de plugin.

El plugin Codex incluido registra `codex` como su id de arnés. Core lo trata como un id de arnés de plugin ordinario; los alias específicos de Codex pertenecen al plugin o a la configuración del operador, no al selector de tiempo de ejecución compartido.

## Emparejamiento de proveedor y arnés

La mayoría de los arneses también deberían registrar un proveedor. El proveedor hace que las referencias de modelo, el estado de autenticación, los metadatos de modelo y la selección `/model` sean visibles para el resto de OpenClaw. Luego el arnés reclama ese proveedor en `supports(...)`.

El plugin Codex incluido sigue este patrón:

- referencias de modelo de usuario preferidas: `openai/gpt-5.5`
- referencias de compatibilidad: las referencias heredadas `codex/gpt-*` siguen aceptándose, pero las configuraciones nuevas no deberían usarlas como referencias normales de proveedor/modelo
- id de arnés: `codex`
- autenticación: disponibilidad sintética de proveedor, porque el arnés Codex posee el inicio de sesión/sesión nativo de Codex
- solicitud de servidor de aplicación: OpenClaw envía el id de modelo sin prefijo a Codex y deja que el arnés hable con el protocolo nativo de app-server

El plugin Codex es aditivo. Las referencias de agente `openai/gpt-*` simples en el proveedor oficial de OpenAI seleccionan el arnés Codex por defecto. Las referencias antiguas `codex/gpt-*` aún seleccionan el proveedor y el arnés Codex por compatibilidad.

Para la configuración del operador, ejemplos de prefijos de modelo y configuraciones solo para Codex, consulta [Arnés Codex](/es/plugins/codex-harness).

OpenClaw requiere Codex app-server `0.125.0` o posterior. El plugin Codex comprueba el handshake de inicialización del app-server y bloquea servidores más antiguos o sin versión, de modo que OpenClaw solo se ejecute contra la superficie de protocolo con la que se ha probado. El mínimo `0.125.0` incluye el soporte de payload del hook MCP nativo que llegó en Codex `0.124.0`, mientras fija OpenClaw a la línea estable probada más reciente.

### Middleware de resultados de herramientas

Los plugins incluidos pueden adjuntar middleware de resultados de herramientas neutral respecto al tiempo de ejecución mediante `api.registerAgentToolResultMiddleware(...)` cuando su manifiesto declara los ids de tiempo de ejecución objetivo en `contracts.agentToolResultMiddleware`. Esta interfaz de confianza es para transformaciones asíncronas de resultados de herramientas que deben ejecutarse antes de que PI o Codex devuelvan la salida de herramientas al modelo.

Los plugins incluidos heredados aún pueden usar `api.registerCodexAppServerExtensionFactory(...)` para middleware exclusivo de Codex app-server, pero las nuevas transformaciones de resultados deberían usar la API neutral respecto al tiempo de ejecución. El hook solo para Pi `api.registerEmbeddedExtensionFactory(...)` se eliminó; las transformaciones de resultados de herramientas de Pi deben usar middleware neutral respecto al tiempo de ejecución.

### Clasificación de resultado terminal

Los arneses nativos que poseen su propia proyección de protocolo pueden usar `classifyAgentHarnessTerminalOutcome(...)` de `openclaw/plugin-sdk/agent-harness-runtime` cuando un turno completado no produjo texto visible del asistente. El helper devuelve `empty`, `reasoning-only` o `planning-only` para que la política de fallback de OpenClaw pueda decidir si reintentar con un modelo diferente. Intencionalmente deja sin clasificar errores de prompt, turnos en curso y respuestas silenciosas intencionales como `NO_REPLY`.

### Modo de arnés Codex nativo

El arnés `codex` incluido es el modo Codex nativo para turnos de agente OpenClaw integrados. Habilita primero el plugin `codex` incluido e incluye `codex` en `plugins.allow` si tu configuración usa una lista de permitidos restrictiva. Las configuraciones nativas de app-server deberían usar `openai/gpt-*`; los turnos de agente OpenAI seleccionan el arnés Codex por defecto. Las rutas heredadas `openai-codex/*` deberían repararse con `openclaw doctor --fix`, y las referencias de modelo heredadas `codex/*` siguen siendo alias de compatibilidad para el arnés nativo.

Cuando este modo se ejecuta, Codex posee el id de hilo nativo, el comportamiento de reanudación, Compaction y la ejecución de app-server. OpenClaw aún posee el canal de chat, el espejo de transcripción visible, la política de herramientas, las aprobaciones, la entrega de medios y la selección de sesión. Usa proveedor/modelo `agentRuntime.id: "codex"` cuando necesites demostrar que solo la ruta de Codex app-server puede reclamar la ejecución. Los tiempos de ejecución de plugin explícitos fallan de forma cerrada; los fallos de selección de Codex app-server y los fallos de tiempo de ejecución no se reintentan mediante PI.

## Estrictez del tiempo de ejecución

Por defecto, OpenClaw usa la política de tiempo de ejecución proveedor/modelo `auto`: los arneses de plugin registrados pueden reclamar un par proveedor/modelo, y PI gestiona el turno cuando no hay coincidencias. Las referencias de agente OpenAI en el proveedor oficial de OpenAI usan Codex por defecto. Usa un tiempo de ejecución de plugin proveedor/modelo explícito como `agentRuntime.id: "codex"` cuando la selección ausente de arnés deba fallar en lugar de enrutar mediante PI. Los fallos de arneses de plugin seleccionados siempre fallan de forma definitiva. Esto no bloquea un proveedor/modelo explícito `agentRuntime.id: "pi"`.

Para ejecuciones integradas solo con Codex:

```json
{
  "models": {
    "providers": {
      "openai": {
        "agentRuntime": {
          "id": "codex"
        }
      }
    }
  },
  "agents": {
    "defaults": {
      "model": "openai/gpt-5.5"
    }
  }
}
```

Si quieres un backend de CLI para un modelo canónico, coloca el tiempo de ejecución en esa entrada de modelo:

```json
{
  "agents": {
    "defaults": {
      "model": "anthropic/claude-opus-4-7",
      "models": {
        "anthropic/claude-opus-4-7": {
          "agentRuntime": {
            "id": "claude-cli"
          }
        }
      }
    }
  }
}
```

Las anulaciones por agente usan la misma forma con alcance de modelo:

```json
{
  "agents": {
    "list": [
      {
        "id": "codex-only",
        "model": "openai/gpt-5.5",
        "models": {
          "openai/gpt-5.5": {
            "agentRuntime": { "id": "codex" }
          }
        }
      }
    ]
  }
}
```

Los ejemplos heredados de tiempo de ejecución de agente completo como este se ignoran:

```json
{
  "agents": {
    "defaults": {
      "agentRuntime": {
        "id": "codex"
      }
    }
  }
}
```

Con un tiempo de ejecución de plugin explícito, una sesión falla pronto cuando el arnés solicitado no está registrado, no admite el proveedor/modelo resuelto o falla antes de producir efectos secundarios del turno. Esto es intencional para despliegues solo con Codex y para pruebas en vivo que deben demostrar que la ruta de Codex app-server realmente está en uso.

Este ajuste solo controla el arnés de agente integrado. No deshabilita el enrutamiento de modelos específico de proveedor para imagen, video, música, TTS, PDF u otros.

## Sesiones nativas y espejo de transcripción

Un arnés puede conservar un id de sesión nativo, id de hilo o token de reanudación del lado del daemon. Mantén esa vinculación explícitamente asociada con la sesión de OpenClaw y sigue reflejando la salida visible para el usuario del asistente/herramienta en la transcripción de OpenClaw.

La transcripción de OpenClaw sigue siendo la capa de compatibilidad para:

- historial de sesión visible en el canal
- búsqueda e indexación de transcripciones
- volver al arnés PI integrado en un turno posterior
- comportamiento genérico de `/new`, `/reset` y eliminación de sesión

Si tu arnés almacena una vinculación sidecar, implementa `reset(...)` para que OpenClaw pueda borrarla cuando se restablezca la sesión de OpenClaw propietaria.

## Resultados de herramientas y medios

Core construye la lista de herramientas de OpenClaw y la pasa al intento preparado. Cuando un arnés ejecuta una llamada dinámica a herramienta, devuelve el resultado de la herramienta mediante la forma de resultado del arnés en lugar de enviar medios del canal por tu cuenta.

Esto mantiene las salidas de texto, imagen, video, música, TTS, aprobación y herramientas de mensajería en la misma ruta de entrega que las ejecuciones respaldadas por PI.

## Limitaciones actuales

- La ruta de importación pública es genérica, pero algunos alias de tipos de intento/resultado aún llevan nombres `Pi` por compatibilidad.
- La instalación de arneses de terceros es experimental. Prefiere plugins de proveedor hasta que necesites un tiempo de ejecución de sesión nativo.
- Se admite el cambio de arnés entre turnos. No cambies arneses en medio de un turno después de que hayan comenzado herramientas nativas, aprobaciones, texto del asistente o envíos de mensajes.

## Relacionado

- [Descripción general del SDK](/es/plugins/sdk-overview)
- [Funciones auxiliares de tiempo de ejecución](/es/plugins/sdk-runtime)
- [Plugins de proveedores](/es/plugins/sdk-provider-plugins)
- [Arnés de Codex](/es/plugins/codex-harness)
- [Proveedores de modelos](/es/concepts/model-providers)
