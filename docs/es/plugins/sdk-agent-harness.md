---
read_when:
    - Estás cambiando el entorno de ejecución del agente integrado o el registro de arneses
    - Está registrando un arnés de agente desde un Plugin incluido o de confianza
    - Debe comprender cómo se relaciona el Plugin de Codex con los proveedores de modelos
sidebarTitle: Agent Harness
summary: Superficie experimental del SDK para plugins que reemplazan el ejecutor de agente integrado de bajo nivel
title: Plugins del arnés de agentes
x-i18n:
    generated_at: "2026-05-07T13:22:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: ab47fbedbd429a4c0e72da0057a88be34528b69804fa1e7af795f377c4907f55
    source_path: plugins/sdk-agent-harness.md
    workflow: 16
---

Un **arnés de agente** es el ejecutor de bajo nivel para un turno preparado de un agente OpenClaw. No es un proveedor de modelos, no es un canal ni es un registro de herramientas. Para ver el modelo mental orientado al usuario, consulta [Runtimes de agente](/es/concepts/agent-runtimes).

Usa esta superficie solo para plugins nativos incluidos o de confianza. El contrato aún es experimental porque los tipos de parámetros reflejan intencionalmente el ejecutor integrado actual.

## Cuándo usar un arnés

Registra un arnés de agente cuando una familia de modelos tiene su propio runtime de sesión nativo y el transporte normal de proveedores de OpenClaw no es la abstracción adecuada.

Ejemplos:

- un servidor nativo de agente de codificación que posee hilos y compaction
- una CLI o daemon local que debe transmitir eventos nativos de plan/razonamiento/herramienta
- un runtime de modelo que necesita su propio id de reanudación además de la transcripción de sesión de OpenClaw

No registres un arnés solo para añadir una nueva API de LLM. Para APIs normales de modelos HTTP o WebSocket, crea un [plugin de proveedor](/es/plugins/sdk-provider-plugins).

## Lo que core sigue gestionando

Antes de seleccionar un arnés, OpenClaw ya ha resuelto:

- proveedor y modelo
- estado de autenticación del runtime
- nivel de pensamiento y presupuesto de contexto
- el archivo de transcripción/sesión de OpenClaw
- espacio de trabajo, sandbox y política de herramientas
- callbacks de respuesta del canal y callbacks de streaming
- fallback del modelo y política de cambio de modelo en vivo

Esa separación es intencional. Un arnés ejecuta un intento preparado; no elige proveedores, no sustituye la entrega del canal ni cambia modelos silenciosamente.

El intento preparado también incluye `params.runtimePlan`, un paquete de políticas propiedad de OpenClaw para decisiones de runtime que deben mantenerse compartidas entre PI y los arneses nativos:

- `runtimePlan.tools.normalize(...)` y
  `runtimePlan.tools.logDiagnostics(...)` para la política de esquema de herramientas consciente del proveedor
- `runtimePlan.transcript.resolvePolicy(...)` para saneamiento de transcripciones y política de reparación de llamadas a herramientas
- `runtimePlan.delivery.isSilentPayload(...)` para la supresión compartida de entrega de `NO_REPLY` y medios
- `runtimePlan.outcome.classifyRunResult(...)` para la clasificación de fallback del modelo
- `runtimePlan.observability` para metadatos resueltos de proveedor/modelo/arnés

Los arneses pueden usar el plan para decisiones que deban coincidir con el comportamiento de PI, pero aun así deben tratarlo como estado del intento propiedad del host. No lo muten ni lo usen para cambiar proveedores/modelos dentro de un turno.

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

1. El id de arnés registrado de una sesión existente tiene prioridad, de modo que los cambios de configuración/env no cambian en caliente esa transcripción a otro runtime.
2. `OPENCLAW_AGENT_RUNTIME=<id>` fuerza un arnés registrado con ese id para sesiones que aún no están fijadas.
3. `OPENCLAW_AGENT_RUNTIME=pi` fuerza el arnés PI integrado.
4. `OPENCLAW_AGENT_RUNTIME=auto` pregunta a los arneses registrados si admiten el proveedor/modelo resuelto.
5. Si ningún arnés registrado coincide, OpenClaw usa PI salvo que el fallback de PI esté desactivado.

Los fallos de arneses de plugins aparecen como fallos de ejecución. En modo `auto`, el fallback de PI solo se usa cuando ningún arnés de plugin registrado admite el proveedor/modelo resuelto. Una vez que un arnés de plugin ha reclamado una ejecución, OpenClaw no reproduce ese mismo turno mediante PI porque eso puede cambiar la semántica de autenticación/runtime o duplicar efectos secundarios.

El id del arnés seleccionado se conserva con el id de sesión después de una ejecución integrada. Las sesiones heredadas creadas antes de las fijaciones de arnés se tratan como fijadas a PI una vez que tienen historial de transcripción. Usa una sesión nueva/restablecida al cambiar entre PI y un arnés de plugin nativo. `/status` muestra ids de arnés no predeterminados como `codex` junto a `Fast`; PI permanece oculto porque es la ruta de compatibilidad predeterminada. Si el arnés seleccionado resulta inesperado, habilita el registro de depuración `agents/harness` e inspecciona el registro estructurado `agent harness selected` del gateway. Incluye el id del arnés seleccionado, el motivo de selección, la política de runtime/fallback y, en modo `auto`, el resultado de soporte de cada candidato de plugin.

El plugin Codex incluido registra `codex` como su id de arnés. Core lo trata como un id ordinario de arnés de plugin; los alias específicos de Codex pertenecen al plugin o a la configuración del operador, no al selector de runtime compartido.

## Combinación de proveedor y arnés

La mayoría de los arneses también deberían registrar un proveedor. El proveedor hace que las referencias de modelo, el estado de autenticación, los metadatos del modelo y la selección de `/model` sean visibles para el resto de OpenClaw. Luego el arnés reclama ese proveedor en `supports(...)`.

El plugin Codex incluido sigue este patrón:

- referencias de modelo de usuario preferidas: `openai/gpt-5.5` más
  `agentRuntime.id: "codex"`
- referencias de compatibilidad: las referencias heredadas `codex/gpt-*` siguen aceptándose, pero las configuraciones nuevas no deberían usarlas como referencias normales de proveedor/modelo
- id de arnés: `codex`
- autenticación: disponibilidad de proveedor sintética, porque el arnés Codex posee el inicio de sesión/sesión nativo de Codex
- solicitud al servidor de la app: OpenClaw envía el id de modelo sin prefijo a Codex y deja que el arnés hable con el protocolo nativo del servidor de la app

El plugin Codex es aditivo. Las referencias simples `openai/gpt-*` siguen usando la ruta normal de proveedor de OpenClaw salvo que fuerces el arnés Codex con `agentRuntime.id: "codex"`. Las referencias antiguas `codex/gpt-*` siguen seleccionando el proveedor y el arnés Codex por compatibilidad.

Para la configuración del operador, ejemplos de prefijos de modelo y configuraciones exclusivas de Codex, consulta [Arnés de Codex](/es/plugins/codex-harness).

OpenClaw requiere el servidor de app Codex `0.125.0` o más reciente. El plugin Codex comprueba el handshake de inicialización del servidor de app y bloquea servidores más antiguos o sin versión para que OpenClaw solo se ejecute contra la superficie de protocolo con la que se ha probado. El mínimo `0.125.0` incluye el soporte nativo de payload de hook MCP que llegó en Codex `0.124.0`, a la vez que fija OpenClaw a la línea estable probada más reciente.

### Middleware de resultados de herramienta

Los plugins incluidos pueden adjuntar middleware de resultados de herramienta neutral respecto del runtime mediante `api.registerAgentToolResultMiddleware(...)` cuando su manifiesto declara los ids de runtime objetivo en `contracts.agentToolResultMiddleware`. Esta integración de confianza es para transformaciones asíncronas de resultados de herramienta que deben ejecutarse antes de que PI o Codex devuelvan la salida de herramienta al modelo.

Los plugins incluidos heredados aún pueden usar `api.registerCodexAppServerExtensionFactory(...)` para middleware exclusivo del servidor de app de Codex, pero las nuevas transformaciones de resultados deberían usar la API neutral respecto del runtime. El hook exclusivo de Pi `api.registerEmbeddedExtensionFactory(...)` se ha eliminado; las transformaciones de resultados de herramienta de Pi deben usar middleware neutral respecto del runtime.

### Clasificación de resultado terminal

Los arneses nativos que poseen su propia proyección de protocolo pueden usar `classifyAgentHarnessTerminalOutcome(...)` de `openclaw/plugin-sdk/agent-harness-runtime` cuando un turno completado no produjo texto visible del asistente. El helper devuelve `empty`, `reasoning-only` o `planning-only` para que la política de fallback de OpenClaw pueda decidir si reintentar en otro modelo. Intencionalmente deja sin clasificar errores de prompt, turnos en curso y respuestas silenciosas intencionales como `NO_REPLY`.

### Modo de arnés Codex nativo

El arnés `codex` incluido es el modo nativo de Codex para turnos de agente OpenClaw integrados. Habilita primero el plugin `codex` incluido e incluye `codex` en `plugins.allow` si tu configuración usa una lista de permitidos restrictiva. Las configuraciones nativas del servidor de app deberían usar `openai/gpt-*`; los turnos de agente de OpenAI seleccionan el arnés Codex de forma predeterminada. Las rutas heredadas `openai-codex/*` deberían repararse con `openclaw doctor --fix`, y las referencias de modelo heredadas `codex/*` siguen siendo alias de compatibilidad para el arnés nativo.

Cuando este modo se ejecuta, Codex posee el id de hilo nativo, el comportamiento de reanudación, la compaction y la ejecución del servidor de app. OpenClaw sigue gestionando el canal de chat, el espejo de transcripción visible, la política de herramientas, las aprobaciones, la entrega de medios y la selección de sesión. Usa `agentRuntime.id: "codex"` cuando necesites demostrar que solo la ruta del servidor de app Codex puede reclamar la ejecución. Los runtimes de plugin explícitos fallan de forma cerrada; los fallos de selección del servidor de app Codex y los fallos de runtime no se reintentan mediante PI.

## Rigurosidad del runtime

De forma predeterminada, OpenClaw ejecuta agentes integrados con OpenClaw Pi. En modo `auto`, los arneses de plugin registrados pueden reclamar un par proveedor/modelo, y PI gestiona el turno cuando ninguno coincide. Usa un runtime de plugin explícito como `agentRuntime.id: "codex"` cuando la ausencia de selección de arnés deba fallar en lugar de enrutarse mediante PI. Los fallos de arneses de plugin seleccionados siempre fallan de forma terminante. Esto no bloquea un `agentRuntime.id: "pi"` explícito ni `OPENCLAW_AGENT_RUNTIME=pi`.

Para ejecuciones integradas exclusivas de Codex:

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

Si quieres que cualquier arnés de plugin registrado reclame modelos coincidentes y, en caso contrario, usar PI, define `id: "auto"`:

```json
{
  "agents": {
    "defaults": {
      "agentRuntime": {
        "id": "auto"
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
      "agentRuntime": { "id": "auto" }
    },
    "list": [
      {
        "id": "codex-only",
        "model": "openai/gpt-5.5",
        "agentRuntime": { "id": "codex" }
      }
    ]
  }
}
```

`OPENCLAW_AGENT_RUNTIME` sigue sobrescribiendo el runtime configurado.

```bash
OPENCLAW_AGENT_RUNTIME=codex openclaw gateway run
```

Con un runtime de plugin explícito, una sesión falla temprano cuando el arnés solicitado no está registrado, no admite el proveedor/modelo resuelto o falla antes de producir efectos secundarios del turno. Esto es intencional para despliegues exclusivos de Codex y para pruebas en vivo que deben demostrar que la ruta del servidor de app Codex está realmente en uso.

Esta configuración solo controla el arnés de agente integrado. No desactiva el enrutamiento específico de proveedor para modelos de imagen, video, música, TTS, PDF u otros.

## Sesiones nativas y espejo de transcripción

Un arnés puede conservar un id de sesión nativo, id de hilo o token de reanudación del lado del daemon. Mantén esa vinculación asociada explícitamente con la sesión de OpenClaw, y sigue reflejando la salida visible para el usuario del asistente/herramienta en la transcripción de OpenClaw.

La transcripción de OpenClaw sigue siendo la capa de compatibilidad para:

- historial de sesión visible en el canal
- búsqueda e indexación de transcripciones
- volver al arnés PI integrado en un turno posterior
- comportamiento genérico de `/new`, `/reset` y eliminación de sesión

Si tu arnés almacena una vinculación auxiliar, implementa `reset(...)` para que OpenClaw pueda borrarla cuando se restablezca la sesión de OpenClaw propietaria.

## Resultados de herramientas y medios

Core construye la lista de herramientas de OpenClaw y la pasa al intento preparado. Cuando un arnés ejecuta una llamada de herramienta dinámica, devuelve el resultado de herramienta mediante la forma de resultado del arnés en lugar de enviar medios del canal por tu cuenta.

Esto mantiene las salidas de texto, imagen, video, música, TTS, aprobación y herramientas de mensajería en la misma ruta de entrega que las ejecuciones respaldadas por PI.

## Limitaciones actuales

- La ruta de importación pública es genérica, pero algunos alias de tipos de intento/resultado todavía
  llevan nombres `Pi` por compatibilidad.
- La instalación de arneses de terceros es experimental. Prefiere los plugins de proveedor
  hasta que necesites un runtime de sesión nativo.
- El cambio de arnés es compatible entre turnos. No cambies de arnés en
  mitad de un turno después de que hayan empezado las herramientas nativas, las aprobaciones, el texto del asistente o los envíos de mensajes.

## Relacionado

- [Descripción general del SDK](/es/plugins/sdk-overview)
- [Ayudantes de runtime](/es/plugins/sdk-runtime)
- [Plugins de proveedor](/es/plugins/sdk-provider-plugins)
- [Arnés de Codex](/es/plugins/codex-harness)
- [Proveedores de modelos](/es/concepts/model-providers)
