---
read_when:
    - Estás cambiando el runtime del agente integrado o el registro del harness
    - Estás registrando un arnés de agente desde un plugin incluido o de confianza
    - Necesitas entender cómo se relaciona el Plugin de Codex con los proveedores de modelos
sidebarTitle: Agent Harness
summary: Superficie experimental del SDK para plugins que reemplazan el ejecutor de agente integrado de bajo nivel
title: Plugins de arnés de agente
x-i18n:
    generated_at: "2026-06-27T12:26:15Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a368ae480c31c86c30786f91e5cf451c3489c681be8ee3955c1c2bd55e4b49e9
    source_path: plugins/sdk-agent-harness.md
    workflow: 16
---

Un **arnés de agente** es el ejecutor de bajo nivel para un turno preparado de agente de OpenClaw. No es un proveedor de modelos, ni un canal, ni un registro de herramientas. Para el modelo mental orientado al usuario, consulta [runtimes de agente](/es/concepts/agent-runtimes).

Usa esta superficie solo para plugins nativos incluidos o de confianza. El contrato sigue siendo experimental porque los tipos de parámetros reflejan intencionalmente el ejecutor integrado actual.

## Cuándo usar un arnés

Registra un arnés de agente cuando una familia de modelos tiene su propio runtime de sesión nativo y el transporte normal de proveedores de OpenClaw no es la abstracción adecuada.

Ejemplos:

- un servidor nativo de agente de programación que posee hilos y Compaction
- una CLI o daemon local que debe transmitir eventos nativos de plan/razonamiento/herramientas
- un runtime de modelo que necesita su propio id de reanudación además de la transcripción de sesión de OpenClaw

No registres **nunca** un arnés solo para agregar una nueva API de LLM. Para API de modelos HTTP o WebSocket normales, crea un [plugin de proveedor](/es/plugins/sdk-provider-plugins).

## Qué sigue poseyendo core

Antes de seleccionar un arnés, OpenClaw ya ha resuelto:

- proveedor y modelo
- estado de autenticación del runtime
- nivel de pensamiento y presupuesto de contexto
- archivo de transcripción/sesión de OpenClaw
- workspace, sandbox y política de herramientas
- callbacks de respuesta del canal y callbacks de streaming
- fallback de modelo y política de cambio de modelo en vivo

Esa separación es intencional. Un arnés ejecuta un intento preparado; no elige proveedores, no reemplaza la entrega del canal ni cambia modelos en silencio.

El intento preparado también incluye `params.runtimePlan`, un paquete de políticas propiedad de OpenClaw para decisiones de runtime que deben permanecer compartidas entre OpenClaw y los arneses nativos:

- `runtimePlan.tools.normalize(...)` y
  `runtimePlan.tools.logDiagnostics(...)` para la política de esquema de herramientas consciente del proveedor
- `runtimePlan.transcript.resolvePolicy(...)` para la sanitización de transcripciones y la política de reparación de llamadas a herramientas
- `runtimePlan.delivery.isSilentPayload(...)` para la supresión compartida de entrega de `NO_REPLY` y medios
- `runtimePlan.outcome.classifyRunResult(...)` para la clasificación de fallback de modelo
- `runtimePlan.observability` para metadatos resueltos de proveedor/modelo/arnés

Los arneses pueden usar el plan para decisiones que necesitan coincidir con el comportamiento de OpenClaw, pero aun así deben tratarlo como estado de intento propiedad del host. No lo muten ni lo usen para cambiar proveedores/modelos dentro de un turno.

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

OpenClaw elige un arnés después de la resolución de proveedor/modelo:

1. La política de runtime con alcance de modelo gana.
2. La política de runtime con alcance de proveedor viene después.
3. `auto` pregunta a los arneses registrados si admiten el proveedor/modelo resuelto.
4. Si no coincide ningún arnés registrado, OpenClaw usa su runtime integrado.

Los fallos de arneses de plugins aparecen como fallos de ejecución. En modo `auto`, el fallback integrado solo se usa cuando ningún arnés de plugin registrado admite el proveedor/modelo resuelto. Una vez que un arnés de plugin ha reclamado una ejecución, OpenClaw no reproduce ese mismo turno mediante otro runtime porque eso puede cambiar la semántica de autenticación/runtime o duplicar efectos secundarios.

La selección ignora los pines de runtime de sesión completa y de agente completo. Eso incluye valores obsoletos de sesión `agentHarnessId`, `agents.defaults.agentRuntime`, `agents.list[].agentRuntime` y `OPENCLAW_AGENT_RUNTIME`. `/status` muestra el runtime efectivo seleccionado desde la ruta de proveedor/modelo.
Si el arnés seleccionado sorprende, habilita el registro de depuración `agents/harness` e inspecciona el registro estructurado `agent harness selected` del Gateway. Incluye el id del arnés seleccionado, el motivo de selección, la política de runtime/fallback y, en modo `auto`, el resultado de compatibilidad de cada candidato de plugin.

El plugin Codex incluido registra `codex` como su id de arnés. Core lo trata como un id ordinario de arnés de plugin; los alias específicos de Codex pertenecen al plugin o a la configuración del operador, no al selector de runtime compartido.

## Emparejamiento de proveedor y arnés

La mayoría de los arneses también deberían registrar un proveedor. El proveedor hace que las referencias de modelo, el estado de autenticación, los metadatos de modelo y la selección de `/model` sean visibles para el resto de OpenClaw. Luego el arnés reclama ese proveedor en `supports(...)`.

El plugin Codex incluido sigue este patrón:

- referencias de modelo de usuario preferidas: `openai/gpt-5.5`
- referencias de compatibilidad: las referencias heredadas `codex/gpt-*` siguen aceptándose, pero las configuraciones nuevas no deberían usarlas como referencias normales de proveedor/modelo
- id de arnés: `codex`
- autenticación: disponibilidad de proveedor sintética, porque el arnés Codex posee el inicio de sesión/sesión nativo de Codex
- solicitud al app-server: OpenClaw envía el id de modelo sin prefijo a Codex y deja que el arnés hable con el protocolo nativo del app-server

El plugin Codex es aditivo. Las referencias simples de agente `openai/gpt-*` en el proveedor oficial de OpenAI seleccionan el arnés Codex de forma predeterminada. Las referencias antiguas `codex/gpt-*` todavía seleccionan el proveedor y arnés Codex por compatibilidad.

Para configuración de operador, ejemplos de prefijos de modelo y configuraciones solo para Codex, consulta [arnés Codex](/es/plugins/codex-harness).

OpenClaw requiere Codex app-server `0.125.0` o más reciente. El plugin Codex comprueba el handshake de inicialización del app-server y bloquea servidores más antiguos o sin versión para que OpenClaw solo se ejecute contra la superficie de protocolo con la que se ha probado. El mínimo `0.125.0` incluye el soporte de payload del hook MCP nativo que llegó en Codex `0.124.0`, a la vez que fija OpenClaw a la línea estable probada más reciente.

### Middleware de resultados de herramientas

Los plugins incluidos y los plugins instalados habilitados explícitamente con contratos de manifiesto coincidentes pueden adjuntar middleware de resultados de herramientas neutral respecto al runtime mediante `api.registerAgentToolResultMiddleware(...)` cuando su manifiesto declara los ids de runtime objetivo en `contracts.agentToolResultMiddleware`. Esta superficie de confianza es para transformaciones asíncronas de resultados de herramientas que deben ejecutarse antes de que OpenClaw o Codex devuelvan la salida de herramienta al modelo.

Los plugins incluidos heredados todavía pueden usar `api.registerCodexAppServerExtensionFactory(...)` para middleware exclusivo del app-server de Codex, pero las nuevas transformaciones de resultados deberían usar la API neutral respecto al runtime.
El hook exclusivo del ejecutor integrado `api.registerEmbeddedExtensionFactory(...)` se ha eliminado; las transformaciones de resultados de herramientas integradas deben usar middleware neutral respecto al runtime.

### Clasificación de resultado terminal

Los arneses nativos que poseen su propia proyección de protocolo pueden usar `classifyAgentHarnessTerminalOutcome(...)` desde `openclaw/plugin-sdk/agent-harness-runtime` cuando un turno completado no produjo texto visible del asistente. El helper devuelve `empty`, `reasoning-only` o `planning-only` para que la política de fallback de OpenClaw pueda decidir si reintentar con un modelo diferente. `planning-only` requiere el campo explícito `planText` del arnés; OpenClaw no lo infiere de la prosa del asistente. El helper deja intencionalmente sin clasificar errores de prompt, turnos en curso y respuestas silenciosas intencionales como `NO_REPLY`.

### Efectos secundarios de fin de agente

Los arneses nativos deben llamar a `runAgentEndSideEffects(...)` desde `openclaw/plugin-sdk/agent-harness-runtime` después de finalizar un intento. Despacha el hook portable `agent_end` y la captura de investigación de OpenClaw sin retrasar las respuestas interactivas. Usa `awaitAgentEndSideEffects(...)` para ejecuciones locales no interactivas donde el intento no debe resolverse hasta que esos efectos secundarios terminen. Ambos helpers aceptan el mismo payload `{ event, ctx }` que `runAgentHarnessAgentEndHook(...)`; sus fallos no alteran el resultado del intento completado.

### Entrada del usuario y superficies de herramientas

Los arneses nativos que exponen una solicitud de entrada de usuario a nivel de runtime deberían usar los helpers de entrada de usuario de `openclaw/plugin-sdk/agent-harness-runtime` para formatear el prompt, entregarlo mediante la ruta de respuesta bloqueante de OpenClaw y normalizar respuestas de elección/formato libre de vuelta a la forma de respuesta nativa del runtime. El helper mantiene coherente la presentación de canal/TUI mientras cada arnés conserva su propio análisis de protocolo y ciclo de vida de solicitud pendiente.

Los arneses nativos que necesitan enrutamiento de herramientas compacto tipo PI deberían usar `createAgentHarnessToolSurfaceRuntime(...)` desde `openclaw/plugin-sdk/agent-harness-tool-runtime`. Posee la selección de control de búsqueda de herramientas/modo de código, valores predeterminados ligeros de modelo local, filtrado de esquemas compatible con runtime, ejecución de catálogo oculto, hidratación de directorios y limpieza de catálogo. Los arneses siguen poseyendo su conversión de herramientas específica del SDK y el callback de ejecución nativa.

### Modo de arnés Codex nativo

El arnés `codex` incluido es el modo Codex nativo para turnos de agente de OpenClaw integrados. Habilita primero el plugin `codex` incluido e incluye `codex` en `plugins.allow` si tu configuración usa una lista de permitidos restrictiva. Las configuraciones de app-server nativas deberían usar `openai/gpt-*`; los turnos de agente de OpenAI seleccionan el arnés Codex de forma predeterminada. Las rutas de referencias de modelo Codex heredadas deberían repararse con `openclaw doctor --fix`, y las referencias de modelo heredadas `codex/*` siguen siendo alias de compatibilidad para el arnés nativo.

Cuando este modo se ejecuta, Codex posee el id de hilo nativo, el comportamiento de reanudación, Compaction y la ejecución del app-server. OpenClaw sigue poseyendo el canal de chat, el espejo de transcripción visible, la política de herramientas, las aprobaciones, la entrega de medios y la selección de sesión. Usa proveedor/modelo `agentRuntime.id: "codex"` cuando necesites demostrar que solo la ruta del app-server de Codex puede reclamar la ejecución. Los runtimes explícitos de plugin fallan de forma cerrada; los fallos de selección del app-server de Codex y los fallos de runtime no se reintentan mediante otro runtime.

## Estrictez del runtime

De forma predeterminada, OpenClaw usa la política de runtime de proveedor/modelo `auto`: los arneses de plugins registrados pueden reclamar un par proveedor/modelo, y el runtime integrado maneja el turno cuando ninguno coincide. Las referencias de agente de OpenAI en el proveedor oficial de OpenAI usan Codex de forma predeterminada.
Usa un runtime de plugin explícito de proveedor/modelo como `agentRuntime.id: "codex"` cuando la ausencia de selección de arnés deba fallar en vez de enrutarse mediante el runtime integrado. Los fallos de arneses de plugins seleccionados siempre fallan de forma estricta. Esto no bloquea un proveedor/modelo explícito `agentRuntime.id: "openclaw"`.

Para ejecuciones integradas solo de Codex:

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

Si quieres un backend de CLI para un modelo canónico, coloca el runtime en esa entrada de modelo:

```json
{
  "agents": {
    "defaults": {
      "model": "anthropic/claude-opus-4-8",
      "models": {
        "anthropic/claude-opus-4-8": {
          "agentRuntime": {
            "id": "claude-cli"
          }
        }
      }
    }
  }
}
```

Las sobrescrituras por agente usan la misma forma con alcance de modelo:

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

Los ejemplos heredados de runtime de agente completo como este se ignoran:

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

Con un runtime de plugin explícito, una sesión falla de forma temprana cuando el
arnés solicitado no está registrado, no admite el proveedor/modelo resuelto, o
falla antes de producir efectos secundarios del turno. Eso es intencional para
implementaciones solo de Codex y para pruebas en vivo que deben demostrar que la
ruta del servidor de aplicaciones de Codex está realmente en uso.

Esta configuración solo controla el arnés de agente integrado. No deshabilita el
enrutamiento de modelos específico del proveedor para imagen, video, música,
TTS, PDF u otros.

## Sesiones nativas y réplica de transcripción

Un arnés puede conservar un id de sesión nativa, id de hilo o token de reanudación del lado del daemon.
Mantén esa vinculación asociada explícitamente con la sesión de OpenClaw y sigue
replicando la salida de asistente/herramienta visible para el usuario en la transcripción de OpenClaw.

La transcripción de OpenClaw sigue siendo la capa de compatibilidad para:

- historial de sesión visible en el canal
- búsqueda e indexación de transcripciones
- volver al arnés integrado de OpenClaw en un turno posterior
- comportamiento genérico de `/new`, `/reset` y eliminación de sesiones

Si tu arnés almacena una vinculación complementaria, implementa `reset(...)` para que OpenClaw pueda
borrarla cuando se restablezca la sesión de OpenClaw propietaria.

## Resultados de herramientas y medios

El núcleo construye la lista de herramientas de OpenClaw y la pasa al intento preparado.
Cuando un arnés ejecuta una llamada dinámica a una herramienta, devuelve el resultado de la herramienta mediante
la forma de resultado del arnés en lugar de enviar medios al canal tú mismo.

Esto mantiene las salidas de texto, imagen, video, música, TTS, aprobación y herramientas de mensajería
en la misma ruta de entrega que las ejecuciones respaldadas por OpenClaw.

## Limitaciones actuales

- La ruta de importación pública es genérica, pero algunos alias de tipos de intento/resultado todavía
  conservan nombres heredados por compatibilidad.
- La instalación de arneses de terceros es experimental. Prefiere plugins de proveedor
  hasta que necesites un runtime de sesión nativa.
- Se admite el cambio de arnés entre turnos. No cambies de arnés en
  medio de un turno después de que hayan comenzado las herramientas nativas, aprobaciones, texto del asistente o envíos de mensajes.

## Relacionado

- [Descripción general del SDK](/es/plugins/sdk-overview)
- [Ayudantes de runtime](/es/plugins/sdk-runtime)
- [Plugins de proveedor](/es/plugins/sdk-provider-plugins)
- [Arnés de Codex](/es/plugins/codex-harness)
- [Proveedores de modelos](/es/concepts/model-providers)
