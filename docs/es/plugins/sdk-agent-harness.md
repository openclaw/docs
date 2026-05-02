---
read_when:
    - Estás cambiando el entorno de ejecución del agente integrado o el registro de arneses
    - Estás registrando un arnés de agente de un Plugin incluido o de confianza
    - Debes comprender cómo se relaciona el Plugin de Codex con los proveedores de modelos
sidebarTitle: Agent Harness
summary: Superficie experimental del SDK para plugins que reemplazan el ejecutor de agente integrado de bajo nivel
title: Plugins del arnés de agentes
x-i18n:
    generated_at: "2026-05-02T05:32:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: b6e55d2df09c3965e1397be72f19dec2a6ed941ac8b7b01be8eee0f9713400dc
    source_path: plugins/sdk-agent-harness.md
    workflow: 16
---

Un **harness de agente** es el ejecutor de bajo nivel para un turno preparado de agente de OpenClaw. No es un proveedor de modelos, ni un canal, ni un registro de herramientas. Para el modelo mental orientado al usuario, consulta [entornos de ejecución de agente](/es/concepts/agent-runtimes).

Usa esta superficie solo para plugins nativos incluidos o de confianza. El contrato sigue siendo experimental porque los tipos de parámetros reflejan intencionalmente el runner embebido actual.

## Cuándo usar un harness

Registra un harness de agente cuando una familia de modelos tenga su propio entorno de ejecución de sesión nativo y el transporte normal de proveedor de OpenClaw sea la abstracción equivocada.

Ejemplos:

- un servidor nativo de agente de codificación que posee hilos y compaction
- una CLI local o un demonio que debe transmitir eventos nativos de plan/razonamiento/herramienta
- un entorno de ejecución de modelo que necesita su propio id de reanudación además de la transcripción de sesión de OpenClaw

No registres un harness solo para agregar una nueva API de LLM. Para APIs de modelos HTTP o WebSocket normales, crea un [plugin de proveedor](/es/plugins/sdk-provider-plugins).

## Lo que el núcleo sigue poseyendo

Antes de seleccionar un harness, OpenClaw ya ha resuelto:

- proveedor y modelo
- estado de autenticación del runtime
- nivel de pensamiento y presupuesto de contexto
- el archivo de transcripción/sesión de OpenClaw
- workspace, sandbox y política de herramientas
- callbacks de respuesta del canal y callbacks de streaming
- fallback de modelo y política de cambio de modelo en vivo

Esa división es intencional. Un harness ejecuta un intento preparado; no elige proveedores, reemplaza la entrega del canal ni cambia modelos silenciosamente.

El intento preparado también incluye `params.runtimePlan`, un paquete de políticas propiedad de OpenClaw para decisiones de runtime que deben permanecer compartidas entre PI y los harnesses nativos:

- `runtimePlan.tools.normalize(...)` y
  `runtimePlan.tools.logDiagnostics(...)` para la política de esquema de herramientas consciente del proveedor
- `runtimePlan.transcript.resolvePolicy(...)` para la sanitización de transcripciones y la política de reparación de llamadas a herramientas
- `runtimePlan.delivery.isSilentPayload(...)` para la supresión compartida de entrega de `NO_REPLY` y medios
- `runtimePlan.outcome.classifyRunResult(...)` para la clasificación de fallback de modelo
- `runtimePlan.observability` para metadatos resueltos de proveedor/modelo/harness

Los harnesses pueden usar el plan para decisiones que deban coincidir con el comportamiento de PI, pero aun así deben tratarlo como estado de intento propiedad del host. No lo mutes ni lo uses para cambiar proveedores/modelos dentro de un turno.

## Registrar un harness

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

OpenClaw elige un harness después de la resolución de proveedor/modelo:

1. El id de harness registrado de una sesión existente prevalece, para que los cambios de configuración/env no cambien en caliente esa transcripción a otro runtime.
2. `OPENCLAW_AGENT_RUNTIME=<id>` fuerza un harness registrado con ese id para sesiones que aún no estén fijadas.
3. `OPENCLAW_AGENT_RUNTIME=pi` fuerza el harness PI integrado.
4. `OPENCLAW_AGENT_RUNTIME=auto` pregunta a los harnesses registrados si admiten el proveedor/modelo resuelto.
5. Si ningún harness registrado coincide, OpenClaw usa PI a menos que el fallback de PI esté deshabilitado.

Los fallos de harnesses de plugins se muestran como fallos de ejecución. En modo `auto`, el fallback a PI solo se usa cuando ningún harness de plugin registrado admite el proveedor/modelo resuelto. Una vez que un harness de plugin ha reclamado una ejecución, OpenClaw no reproduce ese mismo turno mediante PI porque eso puede cambiar la semántica de autenticación/runtime o duplicar efectos secundarios.

El id del harness seleccionado se persiste con el id de sesión después de una ejecución embebida. Las sesiones heredadas creadas antes de las fijaciones de harness se tratan como fijadas a PI una vez que tienen historial de transcripción. Usa una sesión nueva/restablecida al cambiar entre PI y un harness de plugin nativo. `/status` muestra ids de harness no predeterminados como `codex` junto a `Fast`; PI permanece oculto porque es la ruta de compatibilidad predeterminada. Si el harness seleccionado resulta inesperado, habilita el registro de depuración `agents/harness` e inspecciona el registro estructurado `agent harness selected` del Gateway. Incluye el id del harness seleccionado, el motivo de selección, la política de runtime/fallback y, en modo `auto`, el resultado de compatibilidad de cada candidato de plugin.

El plugin Codex incluido registra `codex` como su id de harness. El núcleo lo trata como un id de harness de plugin ordinario; los alias específicos de Codex pertenecen al plugin o a la configuración del operador, no al selector de runtime compartido.

## Emparejamiento de proveedor y harness

La mayoría de los harnesses también deberían registrar un proveedor. El proveedor hace visibles al resto de OpenClaw las refs de modelo, el estado de autenticación, los metadatos de modelo y la selección de `/model`. Luego el harness reclama ese proveedor en `supports(...)`.

El plugin Codex incluido sigue este patrón:

- refs de modelo de usuario preferidas: `openai/gpt-5.5` más
  `agentRuntime.id: "codex"`
- refs de compatibilidad: las refs heredadas `codex/gpt-*` siguen aceptándose, pero las configuraciones nuevas no deben usarlas como refs normales de proveedor/modelo
- id de harness: `codex`
- autenticación: disponibilidad sintética del proveedor, porque el harness Codex posee el inicio de sesión/sesión nativo de Codex
- solicitud al servidor de app: OpenClaw envía el id de modelo sin prefijo a Codex y deja que el harness hable con el protocolo nativo del servidor de app

El plugin Codex es aditivo. Las refs simples `openai/gpt-*` siguen usando la ruta normal de proveedor de OpenClaw a menos que fuerces el harness Codex con `agentRuntime.id: "codex"`. Las refs antiguas `codex/gpt-*` todavía seleccionan el proveedor y el harness Codex por compatibilidad.

Para configuración de operador, ejemplos de prefijos de modelo y configuraciones solo para Codex, consulta [Harness Codex](/es/plugins/codex-harness).

OpenClaw requiere el servidor de app de Codex `0.125.0` o más reciente. El plugin Codex comprueba el handshake de inicialización del servidor de app y bloquea servidores antiguos o sin versión para que OpenClaw solo se ejecute contra la superficie de protocolo con la que se ha probado. El piso `0.125.0` incluye el soporte de payload de hook MCP nativo que llegó en Codex `0.124.0`, mientras fija OpenClaw a la línea estable probada más reciente.

### Middleware de resultados de herramientas

Los plugins incluidos pueden adjuntar middleware de resultados de herramientas neutral al runtime mediante `api.registerAgentToolResultMiddleware(...)` cuando su manifiesto declara los ids de runtime objetivo en `contracts.agentToolResultMiddleware`. Esta seam de confianza es para transformaciones asíncronas de resultados de herramientas que deben ejecutarse antes de que PI o Codex devuelvan la salida de herramientas al modelo.

Los plugins incluidos heredados aún pueden usar `api.registerCodexAppServerExtensionFactory(...)` para middleware exclusivo del servidor de app de Codex, pero las nuevas transformaciones de resultados deberían usar la API neutral al runtime. El hook exclusivo de Pi `api.registerEmbeddedExtensionFactory(...)` se eliminó; las transformaciones de resultados de herramientas de Pi deben usar middleware neutral al runtime.

### Clasificación del resultado terminal

Los harnesses nativos que poseen su propia proyección de protocolo pueden usar `classifyAgentHarnessTerminalOutcome(...)` desde `openclaw/plugin-sdk/agent-harness-runtime` cuando un turno completado no produjo texto visible del asistente. El helper devuelve `empty`, `reasoning-only` o `planning-only` para que la política de fallback de OpenClaw pueda decidir si reintentar con un modelo diferente. Intencionalmente deja sin clasificar errores de prompt, turnos en curso y respuestas silenciosas intencionales como `NO_REPLY`.

### Modo de harness Codex nativo

El harness `codex` incluido es el modo Codex nativo para turnos embebidos de agente de OpenClaw. Habilita primero el plugin `codex` incluido e incluye `codex` en `plugins.allow` si tu configuración usa una lista de permitidos restrictiva. Las configuraciones de servidor de app nativo deberían usar `openai/gpt-*` con `agentRuntime.id: "codex"`. Usa `openai-codex/*` para OAuth de Codex mediante PI. Las refs de modelo heredadas `codex/*` siguen siendo alias de compatibilidad para el harness nativo.

Cuando este modo se ejecuta, Codex posee el id de hilo nativo, el comportamiento de reanudación, la compaction y la ejecución del servidor de app. OpenClaw sigue poseyendo el canal de chat, el espejo de transcripción visible, la política de herramientas, las aprobaciones, la entrega de medios y la selección de sesión. Usa `agentRuntime.id: "codex"` sin una anulación de `fallback` cuando necesites demostrar que solo la ruta del servidor de app de Codex puede reclamar la ejecución. Los runtimes de plugins explícitos ya fallan de forma cerrada por defecto. Establece `fallback: "pi"` solo cuando quieras intencionalmente que PI maneje una selección de harness faltante. Los fallos del servidor de app de Codex ya fallan directamente en lugar de reintentarse mediante PI.

## Deshabilitar el fallback de PI

De forma predeterminada, OpenClaw ejecuta agentes embebidos con `agents.defaults.agentRuntime` establecido en `{ id: "auto", fallback: "pi" }`. En modo `auto`, los harnesses de plugins registrados pueden reclamar un par proveedor/modelo. Si ninguno coincide, OpenClaw recurre a PI.

En modo `auto`, establece `fallback: "none"` cuando necesites que una selección faltante de harness de plugin falle en lugar de usar PI. Los runtimes de plugins explícitos como `agentRuntime.id: "codex"` ya fallan de forma cerrada por defecto, a menos que `fallback: "pi"` esté establecido en la misma configuración o ámbito de anulación de entorno. Los fallos de harnesses de plugins seleccionados siempre fallan de forma dura. Esto no bloquea un `agentRuntime.id: "pi"` explícito ni `OPENCLAW_AGENT_RUNTIME=pi`.

Para ejecuciones embebidas solo con Codex:

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

Si quieres que cualquier harness de plugin registrado reclame modelos coincidentes pero nunca quieres que OpenClaw recurra silenciosamente a PI, mantén `runtime: "auto"` y deshabilita el fallback:

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

Las anulaciones por agente usan la misma forma:

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

`OPENCLAW_AGENT_RUNTIME` sigue anulando el runtime configurado. Usa `OPENCLAW_AGENT_HARNESS_FALLBACK=none` para deshabilitar el fallback de PI desde el entorno.

```bash
OPENCLAW_AGENT_RUNTIME=codex \
OPENCLAW_AGENT_HARNESS_FALLBACK=none \
openclaw gateway run
```

Con el fallback deshabilitado, una sesión falla temprano cuando el harness solicitado no está registrado, no admite el proveedor/modelo resuelto o falla antes de producir efectos secundarios del turno. Esto es intencional para despliegues solo con Codex y para pruebas en vivo que deben demostrar que la ruta del servidor de app de Codex está realmente en uso.

Esta opción solo controla el harness de agente embebido. No deshabilita el enrutamiento de modelos específico de proveedor para imágenes, video, música, TTS, PDF u otros.

## Sesiones nativas y espejo de transcripción

Un harness puede mantener un id de sesión nativo, id de hilo o token de reanudación del lado del demonio. Mantén esa vinculación asociada explícitamente con la sesión de OpenClaw y sigue reflejando la salida visible para el usuario del asistente/herramientas en la transcripción de OpenClaw.

La transcripción de OpenClaw sigue siendo la capa de compatibilidad para:

- historial de sesión visible en el canal
- búsqueda e indexación de transcripciones
- volver al harness PI integrado en un turno posterior
- comportamiento genérico de `/new`, `/reset` y eliminación de sesiones

Si tu harness almacena una vinculación sidecar, implementa `reset(...)` para que OpenClaw pueda borrarla cuando se restablezca la sesión de OpenClaw propietaria.

## Resultados de herramientas y medios

El núcleo construye la lista de herramientas de OpenClaw y la pasa al intento preparado.
Cuando un arnés ejecuta una llamada dinámica a una herramienta, devuelve el resultado de la herramienta a través de
la forma de resultado del arnés en lugar de enviar tú mismo los medios del canal.

Esto mantiene las salidas de texto, imagen, video, música, TTS, aprobación y herramientas de mensajería
en la misma ruta de entrega que las ejecuciones respaldadas por PI.

## Limitaciones actuales

- La ruta de importación pública es genérica, pero algunos alias de tipos de intento/resultado aún
  llevan nombres `Pi` por compatibilidad.
- La instalación de arneses de terceros es experimental. Prefiere los plugins de proveedores
  hasta que necesites un runtime de sesión nativo.
- El cambio de arnés se admite entre turnos. No cambies de arnés en
  medio de un turno después de que hayan comenzado herramientas nativas, aprobaciones, texto del asistente o envíos
  de mensajes.

## Relacionado

- [Resumen del SDK](/es/plugins/sdk-overview)
- [Ayudantes de runtime](/es/plugins/sdk-runtime)
- [Plugins de proveedores](/es/plugins/sdk-provider-plugins)
- [Arnés de Codex](/es/plugins/codex-harness)
- [Proveedores de modelos](/es/concepts/model-providers)
