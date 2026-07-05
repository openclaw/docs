---
read_when:
    - Estás cambiando el entorno de ejecución integrado del agente o el registro de arnés
    - Estás registrando un arnés de agente desde un plugin incluido o de confianza
    - Necesitas entender cómo se relaciona el Plugin de Codex con los proveedores de modelos
sidebarTitle: Agent Harness
summary: Superficie experimental del SDK para plugins que reemplazan el ejecutor de agente embebido de bajo nivel
title: Plugins de arnés de agente
x-i18n:
    generated_at: "2026-07-05T11:31:34Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 969213232ebde462ae20a4f13876f27f778b7d6ace7e7be1ba3d8e04e8fa5ed2
    source_path: plugins/sdk-agent-harness.md
    workflow: 16
---

Un **arnés de agente** es el ejecutor de bajo nivel para un turno preparado de agente de OpenClaw. No es un proveedor de modelos, ni un canal, ni un registro de herramientas. Para el modelo mental orientado al usuario, consulta [Runtimes de agentes](/es/concepts/agent-runtimes).

Usa esta superficie solo para plugins nativos integrados o de confianza. El contrato sigue siendo experimental porque los tipos de parámetros reflejan intencionalmente el ejecutor integrado actual.

## Cuándo usar un arnés

Registra un arnés de agente cuando una familia de modelos tiene su propio runtime de sesión nativo y el transporte normal de proveedores de OpenClaw es la abstracción equivocada:

- un servidor nativo de agente de codificación que posee hilos y Compaction
- una CLI local o daemon que debe transmitir eventos nativos de plan/razonamiento/herramienta
- un runtime de modelo que necesita su propio id de reanudación además de la transcripción de sesión de OpenClaw

No registres **un arnés** solo para agregar una nueva API de LLM. Para APIs de modelos HTTP o WebSocket normales, crea un [Plugin de proveedor](/es/plugins/sdk-provider-plugins).

## Lo que core sigue controlando

Antes de seleccionar un arnés, OpenClaw ya ha resuelto:

- proveedor y modelo
- estado de autenticación del runtime
- nivel de razonamiento y presupuesto de contexto
- el archivo de transcripción/sesión de OpenClaw
- workspace, sandbox y política de herramientas
- callbacks de respuesta de canal y callbacks de streaming
- política de fallback de modelos y cambio de modelo en vivo

Un arnés ejecuta un intento preparado; no elige proveedores, reemplaza la entrega del canal ni cambia modelos de forma silenciosa.

El intento preparado también incluye `params.runtimePlan`, un paquete de políticas propiedad de OpenClaw para decisiones de runtime que deben mantenerse compartidas entre OpenClaw y los arneses nativos:

- `runtimePlan.tools.normalize(...)` y `runtimePlan.tools.logDiagnostics(...)` para la política de esquemas de herramientas consciente del proveedor
- `runtimePlan.transcript.resolvePolicy(...)` para la sanitización de transcripciones y la política de reparación de llamadas a herramientas
- `runtimePlan.delivery.isSilentPayload(...)` para la supresión compartida de entrega de `NO_REPLY` y medios
- `runtimePlan.outcome.classifyRunResult(...)` para la clasificación de fallback de modelos
- `runtimePlan.observability` para metadatos resueltos de proveedor/modelo/arnés

Los arneses pueden usar el plan para decisiones que necesitan coincidir con el comportamiento de OpenClaw, pero trátalo como estado de intento propiedad del host: no lo muten ni lo usen para cambiar proveedores/modelos dentro de un turno.

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

1. La política de runtime con alcance de modelo gana.
2. La política de runtime con alcance de proveedor viene después.
3. `auto` pregunta a los arneses registrados si admiten el proveedor/modelo resuelto.
4. Si ningún arnés registrado coincide, OpenClaw usa su runtime integrado.

Los fallos de arneses de Plugin aparecen como fallos de ejecución. En modo `auto`, el fallback integrado solo se aplica cuando ningún arnés de Plugin registrado admite el proveedor/modelo resuelto. Una vez que un arnés de Plugin ha reclamado una ejecución, OpenClaw no repite ese mismo turno a través de otro runtime, porque eso puede cambiar la semántica de autenticación/runtime o duplicar efectos secundarios.

La selección ignora los pines de runtime de sesión completa y agente completo. Eso incluye valores obsoletos de sesión `agentHarnessId`, `agents.defaults.agentRuntime`, `agents.list[].agentRuntime` y `OPENCLAW_AGENT_RUNTIME`. `/status` muestra el runtime efectivo seleccionado desde la ruta de proveedor/modelo.

Si el arnés seleccionado sorprende, habilita el registro de depuración `agents/harness` e inspecciona el registro estructurado `agent harness selected` del Gateway: incluye el id del arnés seleccionado, el motivo de selección, la política de runtime/fallback y, en modo `auto`, el resultado de soporte de cada candidato de Plugin.

El Plugin Codex integrado registra `codex` como su id de arnés. Core lo trata como un id de arnés de Plugin ordinario; los alias específicos de Codex pertenecen al Plugin o a la configuración del operador, no al selector de runtime compartido.

## Emparejamiento de proveedor y arnés

La mayoría de los arneses también deberían registrar un proveedor. El proveedor hace visibles las refs de modelo, el estado de autenticación, los metadatos del modelo y la selección `/model` para el resto de OpenClaw. Luego el arnés reclama ese proveedor en `supports(...)`.

El Plugin Codex integrado sigue este patrón:

- refs de modelo de usuario preferidas: `openai/gpt-5.5`
- refs de compatibilidad: las refs heredadas `codex/gpt-*` siguen aceptándose, pero las configuraciones nuevas no deberían usarlas como refs normales de proveedor/modelo
- id de arnés: `codex`
- autenticación: disponibilidad sintética del proveedor, porque el arnés Codex posee el inicio de sesión/sesión nativo de Codex
- solicitud de app-server: OpenClaw envía el id de modelo sin prefijo a Codex y deja que el arnés hable con el protocolo nativo de app-server

El Plugin Codex es aditivo. Las refs de agente `openai/gpt-*` simples en el endpoint oficial de la API de OpenAI (`api.openai.com`) seleccionan el arnés Codex de forma predeterminada; las URL base personalizadas compatibles con OpenAI conservan en cambio el comportamiento de proveedor configurado. Las refs antiguas `codex/gpt-*` todavía seleccionan el proveedor y el arnés Codex por compatibilidad.

Para configuración de operador, ejemplos de prefijos de modelos y configuraciones solo de Codex, consulta [Arnés Codex](/es/plugins/codex-harness).

OpenClaw requiere Codex app-server `0.125.0` o posterior. El Plugin Codex comprueba el handshake de inicialización de app-server y bloquea servidores antiguos o sin versión, de modo que OpenClaw solo se ejecuta contra la superficie de protocolo que ha probado.

### Middleware de resultados de herramientas

Los plugins integrados y los plugins instalados habilitados explícitamente con contratos de manifiesto coincidentes pueden adjuntar middleware de resultados de herramientas neutral respecto al runtime mediante `api.registerAgentToolResultMiddleware(...)` cuando su manifiesto declara los ids de runtime objetivo en `contracts.agentToolResultMiddleware`. Esta costura de confianza es para transformaciones asíncronas de resultados de herramientas que deben ejecutarse antes de que OpenClaw o Codex devuelvan la salida de la herramienta al modelo.

Los plugins integrados heredados todavía pueden usar `api.registerCodexAppServerExtensionFactory(...)` para middleware exclusivo de Codex app-server, pero las nuevas transformaciones de resultados deberían usar la API neutral respecto al runtime. El hook exclusivo del ejecutor integrado `api.registerEmbeddedExtensionFactory(...)` se eliminó; las transformaciones de resultados de herramientas integradas deben usar middleware neutral respecto al runtime.

### Clasificación de resultado terminal

Los arneses nativos que poseen su propia proyección de protocolo pueden usar `classifyAgentHarnessTerminalOutcome(...)` desde `openclaw/plugin-sdk/agent-harness-runtime` cuando un turno completado no produjo texto visible del asistente. El helper devuelve `empty`, `reasoning-only` o `planning-only` para que la política de fallback de OpenClaw pueda decidir si reintentar con un modelo diferente. `planning-only` requiere el campo explícito `planText` del arnés; OpenClaw no lo infiere de la prosa del asistente. El helper deja intencionalmente sin clasificar los errores de prompt, los turnos en curso y las respuestas silenciosas intencionales como `NO_REPLY`.

### Efectos secundarios de fin de agente

Los arneses nativos deben llamar a `runAgentEndSideEffects(...)` desde `openclaw/plugin-sdk/agent-harness-runtime` después de finalizar un intento. Despacha el hook portable `agent_end` y la captura de investigación de OpenClaw sin retrasar las respuestas interactivas. Usa `awaitAgentEndSideEffects(...)` para ejecuciones locales no interactivas donde el intento no debe resolverse hasta que esos efectos secundarios terminen. Ambos helpers aceptan la misma carga `{ event, ctx }` que `runAgentHarnessAgentEndHook(...)`; sus fallos no alteran el resultado del intento completado.

### Entrada de usuario y superficies de herramientas

Los arneses nativos que exponen una solicitud de entrada de usuario a nivel de runtime deberían usar los helpers de entrada de usuario de `openclaw/plugin-sdk/agent-harness-runtime` para formatear el prompt, entregarlo a través de la ruta de respuesta bloqueante de OpenClaw y normalizar las respuestas de opción/texto libre de vuelta a la forma de respuesta nativa del runtime. El helper mantiene coherente la presentación de canal/TUI mientras cada arnés conserva su propio análisis de protocolo y ciclo de vida de solicitudes pendientes.

Los arneses nativos que necesitan enrutamiento compacto de herramientas estilo PI deberían usar `createAgentHarnessToolSurfaceRuntime(...)` desde `openclaw/plugin-sdk/agent-harness-tool-runtime`. Controla la selección de control de búsqueda de herramientas/modo código, valores predeterminados ligeros para modelos locales, filtrado de esquemas compatible con el runtime, ejecución de catálogo oculto, hidratación de directorios y limpieza de catálogo. Los arneses siguen siendo dueños de su conversión de herramientas específica del SDK y su callback de ejecución nativa.

### Modo de arnés Codex nativo

El arnés `codex` integrado es el modo Codex nativo para turnos de agente integrados de OpenClaw. Primero habilita el Plugin `codex` integrado e incluye `codex` en `plugins.allow` si tu configuración usa una lista de permisos restrictiva. Las configuraciones nativas de app-server deberían usar `openai/gpt-*`; los turnos de agente de OpenAI seleccionan el arnés Codex de forma predeterminada. Las rutas de refs de modelo Codex heredadas deberían repararse con `openclaw doctor --fix`, y las refs de modelo heredadas `codex/*` siguen siendo alias de compatibilidad para el arnés nativo.

Cuando este modo se ejecuta, Codex posee el id de hilo nativo, el comportamiento de reanudación, Compaction y la ejecución de app-server. OpenClaw sigue siendo dueño del canal de chat, el espejo de transcripción visible, la política de herramientas, las aprobaciones, la entrega de medios y la selección de sesión. Usa `agentRuntime.id: "codex"` de proveedor/modelo cuando necesites demostrar que solo la ruta de Codex app-server puede reclamar la ejecución. Los runtimes de Plugin explícitos fallan de forma cerrada; los fallos de selección de Codex app-server y los fallos de runtime no se reintentan mediante otro runtime.

## Estrictez de runtime

De forma predeterminada, OpenClaw usa la política de runtime de proveedor/modelo `auto`: los arneses de Plugin registrados pueden reclamar un par proveedor/modelo, y el runtime integrado maneja el turno cuando ninguno coincide. Las refs de agente de OpenAI en el proveedor oficial de OpenAI usan Codex de forma predeterminada. Usa un runtime de Plugin explícito de proveedor/modelo como `agentRuntime.id: "codex"` cuando la selección de arnés ausente deba fallar en lugar de enrutar a través del runtime integrado. Los fallos de arnés de Plugin seleccionado siempre fallan de forma dura. Esto no bloquea un `agentRuntime.id: "openclaw"` explícito de proveedor/modelo.

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

Con un tiempo de ejecución de Plugin explícito, una sesión falla pronto cuando el
arnés solicitado no está registrado, no admite el proveedor/modelo resuelto o
falla antes de producir efectos secundarios del turno. Esto es intencional para
implementaciones solo de Codex y para pruebas en vivo que deben demostrar que la
ruta de servidor de aplicaciones de Codex está realmente en uso.

Esta configuración solo controla el arnés de agente integrado. No deshabilita
el enrutamiento de modelos específico del proveedor para imágenes, video, música,
TTS, PDF u otros.

## Sesiones nativas y espejo de transcripción

Un arnés puede conservar un id de sesión nativa, un id de hilo o un token de
reanudación del lado del demonio. Mantén ese enlace asociado explícitamente con
la sesión de OpenClaw y sigue reflejando la salida del asistente/herramienta
visible para el usuario en la transcripción de OpenClaw.

La transcripción de OpenClaw sigue siendo la capa de compatibilidad para:

- historial de sesión visible en canales
- búsqueda e indexación de transcripciones
- volver al arnés integrado de OpenClaw en un turno posterior
- comportamiento genérico de `/new`, `/reset` y eliminación de sesiones

Si tu arnés almacena un enlace auxiliar, implementa `reset(...)` para que OpenClaw
pueda borrarlo cuando se restablezca la sesión propietaria de OpenClaw.

## Resultados de herramientas y medios

El núcleo construye la lista de herramientas de OpenClaw y la pasa al intento
preparado. Cuando un arnés ejecuta una llamada dinámica a una herramienta,
devuelve el resultado de la herramienta mediante la forma de resultado del arnés
en lugar de enviar medios al canal por tu cuenta.

Esto mantiene las salidas de texto, imagen, video, música, TTS, aprobación y
herramientas de mensajería en la misma ruta de entrega que las ejecuciones
respaldadas por OpenClaw.

## Limitaciones actuales

- La ruta de importación pública es genérica, pero algunos alias de tipo de
  intento/resultado todavía conservan nombres heredados por compatibilidad.
- La instalación de arneses de terceros es experimental. Prefiere Plugins de
  proveedor hasta que necesites un tiempo de ejecución de sesión nativa.
- Se admite el cambio de arnés entre turnos. No cambies de arnés en medio de un
  turno después de que hayan comenzado herramientas nativas, aprobaciones, texto
  del asistente o envíos de mensajes.

## Relacionado

- [Descripción general del SDK](/es/plugins/sdk-overview)
- [Ayudantes de tiempo de ejecución](/es/plugins/sdk-runtime)
- [Plugins de proveedores](/es/plugins/sdk-provider-plugins)
- [Arnés de Codex](/es/plugins/codex-harness)
- [Proveedores de modelos](/es/concepts/model-providers)
