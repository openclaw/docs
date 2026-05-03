---
read_when:
    - Estás cambiando el entorno de ejecución del agente integrado o el registro del arnés
    - Está registrando un arnés de agente desde un Plugin incluido o de confianza
    - Debes entender cómo se relaciona el plugin de Codex con los proveedores de modelos
sidebarTitle: Agent Harness
summary: Superficie experimental del SDK para plugins que reemplazan el ejecutor de agente integrado de bajo nivel
title: Plugins del arnés de agentes
x-i18n:
    generated_at: "2026-05-03T05:32:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: ed416bbb433fc502c60fd8c24d20cd0f862d45472ff2eb0e2484b256b58f1b35
    source_path: plugins/sdk-agent-harness.md
    workflow: 16
---

Un **arnés de agente** es el ejecutor de bajo nivel para un turno preparado de agente de OpenClaw. No es un proveedor de modelo, ni un canal, ni un registro de herramientas. Para el modelo mental orientado al usuario, consulta [Runtimes de agentes](/es/concepts/agent-runtimes).

Usa esta superficie solo para plugins nativos incluidos o de confianza. El contrato aún es experimental porque los tipos de parámetros reflejan intencionalmente el runner integrado actual.

## Cuándo usar un arnés

Registra un arnés de agente cuando una familia de modelos tiene su propio runtime de sesión nativo y el transporte normal de proveedores de OpenClaw no es la abstracción correcta.

Ejemplos:

- un servidor nativo de agente de programación que posee hilos y compactación
- una CLI o un daemon local que debe transmitir eventos nativos de plan/razonamiento/herramienta
- un runtime de modelo que necesita su propio id de reanudación además de la transcripción de sesión de OpenClaw

**No** registres un arnés solo para agregar una nueva API de LLM. Para APIs de modelos normales por HTTP o WebSocket, crea un [plugin de proveedor](/es/plugins/sdk-provider-plugins).

## Lo que el núcleo aún controla

Antes de seleccionar un arnés, OpenClaw ya resolvió:

- proveedor y modelo
- estado de autenticación del runtime
- nivel de razonamiento y presupuesto de contexto
- el archivo de transcripción/sesión de OpenClaw
- workspace, sandbox y política de herramientas
- callbacks de respuesta del canal y callbacks de streaming
- fallback de modelo y política de cambio de modelo en vivo

Esa separación es intencional. Un arnés ejecuta un intento preparado; no elige proveedores, no reemplaza la entrega del canal ni cambia modelos silenciosamente.

El intento preparado también incluye `params.runtimePlan`, un paquete de políticas propiedad de OpenClaw para decisiones de runtime que deben seguir compartidas entre PI y arneses nativos:

- `runtimePlan.tools.normalize(...)` y
  `runtimePlan.tools.logDiagnostics(...)` para la política de esquemas de herramientas consciente del proveedor
- `runtimePlan.transcript.resolvePolicy(...)` para la sanitización de transcripciones y la política de reparación de llamadas a herramientas
- `runtimePlan.delivery.isSilentPayload(...)` para la supresión compartida de entrega de `NO_REPLY` y medios
- `runtimePlan.outcome.classifyRunResult(...)` para la clasificación de fallback de modelo
- `runtimePlan.observability` para metadatos resueltos de proveedor/modelo/arnés

Los arneses pueden usar el plan para decisiones que deban coincidir con el comportamiento de PI, pero aun así deben tratarlo como estado del intento propiedad del host. No lo mutes ni lo uses para cambiar proveedores/modelos dentro de un turno.

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

1. Gana el id de arnés registrado de una sesión existente, de modo que los cambios de configuración/env no cambien en caliente esa transcripción a otro runtime.
2. `OPENCLAW_AGENT_RUNTIME=<id>` fuerza un arnés registrado con ese id para sesiones que aún no estén fijadas.
3. `OPENCLAW_AGENT_RUNTIME=pi` fuerza el arnés PI integrado.
4. `OPENCLAW_AGENT_RUNTIME=auto` pregunta a los arneses registrados si admiten el proveedor/modelo resuelto.
5. Si ningún arnés registrado coincide, OpenClaw usa PI salvo que el fallback de PI esté deshabilitado.

Los fallos de arneses de Plugin se exponen como fallos de ejecución. En modo `auto`, el fallback de PI solo se usa cuando ningún arnés de Plugin registrado admite el proveedor/modelo resuelto. Una vez que un arnés de Plugin reclamó una ejecución, OpenClaw no vuelve a reproducir ese mismo turno mediante PI porque eso puede cambiar la semántica de autenticación/runtime o duplicar efectos secundarios.

El id de arnés seleccionado se persiste con el id de sesión después de una ejecución integrada. Las sesiones heredadas creadas antes de las fijaciones de arnés se tratan como fijadas a PI una vez que tienen historial de transcripción. Usa una sesión nueva/restablecida cuando cambies entre PI y un arnés de Plugin nativo. `/status` muestra ids de arnés no predeterminados como `codex` junto a `Fast`; PI permanece oculto porque es la ruta de compatibilidad predeterminada. Si el arnés seleccionado resulta inesperado, habilita el registro de depuración de `agents/harness` e inspecciona el registro estructurado `agent harness selected` del gateway. Incluye el id del arnés seleccionado, el motivo de selección, la política de runtime/fallback y, en modo `auto`, el resultado de compatibilidad de cada candidato de Plugin.

El Plugin Codex incluido registra `codex` como su id de arnés. El núcleo lo trata como un id ordinario de arnés de Plugin; los alias específicos de Codex pertenecen al Plugin o a la configuración del operador, no al selector de runtime compartido.

## Emparejamiento de proveedor y arnés

La mayoría de los arneses también deberían registrar un proveedor. El proveedor hace visibles las refs de modelos, el estado de autenticación, los metadatos de modelos y la selección de `/model` al resto de OpenClaw. Luego el arnés reclama ese proveedor en `supports(...)`.

El Plugin Codex incluido sigue este patrón:

- refs de modelo de usuario preferidas: `openai/gpt-5.5` más
  `agentRuntime.id: "codex"`
- refs de compatibilidad: las refs heredadas `codex/gpt-*` siguen aceptándose, pero las nuevas configuraciones no deberían usarlas como refs normales de proveedor/modelo
- id de arnés: `codex`
- autenticación: disponibilidad sintética de proveedor, porque el arnés Codex posee el inicio de sesión/sesión nativo de Codex
- solicitud del app-server: OpenClaw envía el id de modelo básico a Codex y permite que el arnés hable con el protocolo nativo del app-server

El Plugin Codex es aditivo. Las refs simples `openai/gpt-*` siguen usando la ruta normal de proveedor de OpenClaw salvo que fuerces el arnés Codex con `agentRuntime.id: "codex"`. Las refs antiguas `codex/gpt-*` siguen seleccionando el proveedor y el arnés Codex por compatibilidad.

Para la configuración de operador, ejemplos de prefijo de modelo y configuraciones exclusivas de Codex, consulta [Arnés Codex](/es/plugins/codex-harness).

OpenClaw requiere Codex app-server `0.125.0` o posterior. El Plugin Codex comprueba el handshake de inicialización del app-server y bloquea servidores antiguos o sin versión para que OpenClaw solo se ejecute contra la superficie de protocolo con la que se ha probado. El piso `0.125.0` incluye el soporte nativo de payload de hook MCP que llegó en Codex `0.124.0`, al tiempo que fija OpenClaw a la línea estable probada más reciente.

### Middleware de resultados de herramientas

Los plugins incluidos pueden adjuntar middleware de resultados de herramientas neutral respecto al runtime mediante `api.registerAgentToolResultMiddleware(...)` cuando su manifiesto declara los ids de runtime objetivo en `contracts.agentToolResultMiddleware`. Esta unión de confianza es para transformaciones asíncronas de resultados de herramientas que deben ejecutarse antes de que PI o Codex devuelvan la salida de la herramienta al modelo.

Los plugins incluidos heredados aún pueden usar `api.registerCodexAppServerExtensionFactory(...)` para middleware exclusivo del app-server de Codex, pero las nuevas transformaciones de resultados deberían usar la API neutral respecto al runtime. El hook exclusivo de Pi `api.registerEmbeddedExtensionFactory(...)` se eliminó; las transformaciones de resultados de herramientas de Pi deben usar middleware neutral respecto al runtime.

### Clasificación de resultado terminal

Los arneses nativos que poseen su propia proyección de protocolo pueden usar `classifyAgentHarnessTerminalOutcome(...)` desde `openclaw/plugin-sdk/agent-harness-runtime` cuando un turno completado no produjo texto visible del asistente. El helper devuelve `empty`, `reasoning-only` o `planning-only` para que la política de fallback de OpenClaw pueda decidir si reintentar con un modelo diferente. Intencionalmente deja sin clasificar errores de prompt, turnos en curso y respuestas silenciosas intencionales como `NO_REPLY`.

### Modo de arnés Codex nativo

El arnés `codex` incluido es el modo Codex nativo para turnos de agente integrados de OpenClaw. Habilita primero el Plugin `codex` incluido e incluye `codex` en `plugins.allow` si tu configuración usa una lista de permitidos restrictiva. Las configuraciones de app-server nativo deberían usar `openai/gpt-*` con `agentRuntime.id: "codex"`. Usa `openai-codex/*` para OAuth de Codex mediante PI. Las refs de modelo heredadas `codex/*` siguen siendo alias de compatibilidad para el arnés nativo.

Cuando se ejecuta este modo, Codex posee el id de hilo nativo, el comportamiento de reanudación, la compactación y la ejecución del app-server. OpenClaw sigue controlando el canal de chat, el espejo de transcripción visible, la política de herramientas, las aprobaciones, la entrega de medios y la selección de sesión. Usa `agentRuntime.id: "codex"` cuando necesites demostrar que solo la ruta del app-server de Codex puede reclamar la ejecución. Los runtimes de Plugin explícitos fallan de forma cerrada; los fallos de selección del app-server de Codex y los fallos de runtime no se reintentan mediante PI.

## Estrictez del runtime

De forma predeterminada, OpenClaw ejecuta agentes integrados con OpenClaw Pi. En modo `auto`, los arneses de Plugin registrados pueden reclamar un par proveedor/modelo, y PI gestiona el turno cuando ninguno coincide. Usa un runtime de Plugin explícito como `agentRuntime.id: "codex"` cuando la falta de selección del arnés deba fallar en lugar de enrutar mediante PI. Los fallos de arneses de Plugin seleccionados siempre fallan de forma terminante. Esto no bloquea un `agentRuntime.id: "pi"` explícito ni `OPENCLAW_AGENT_RUNTIME=pi`.

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

Si quieres que cualquier arnés de Plugin registrado reclame modelos coincidentes y que, en caso contrario, se use PI, define `id: "auto"`:

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

Las anulaciones por agente usan la misma forma:

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

`OPENCLAW_AGENT_RUNTIME` sigue anulando el runtime configurado.

```bash
OPENCLAW_AGENT_RUNTIME=codex openclaw gateway run
```

Con un runtime de Plugin explícito, una sesión falla temprano cuando el arnés solicitado no está registrado, no admite el proveedor/modelo resuelto o falla antes de producir efectos secundarios del turno. Eso es intencional para despliegues exclusivos de Codex y para pruebas en vivo que deben demostrar que la ruta del app-server de Codex realmente está en uso.

Esta configuración solo controla el arnés de agente integrado. No deshabilita el enrutamiento de modelos específico de proveedor para imagen, video, música, TTS, PDF u otros.

## Sesiones nativas y espejo de transcripción

Un arnés puede mantener un id de sesión nativo, id de hilo o token de reanudación del lado del daemon. Mantén esa vinculación asociada explícitamente con la sesión de OpenClaw y sigue reflejando la salida visible para el usuario del asistente/herramienta en la transcripción de OpenClaw.

La transcripción de OpenClaw sigue siendo la capa de compatibilidad para:

- historial de sesión visible en el canal
- búsqueda e indexación de transcripciones
- volver al arnés PI integrado en un turno posterior
- comportamiento genérico de `/new`, `/reset` y eliminación de sesiones

Si tu arnés almacena una vinculación complementaria, implementa `reset(...)` para que OpenClaw pueda borrarla cuando se restablezca la sesión de OpenClaw propietaria.

## Resultados de herramientas y medios

El núcleo construye la lista de herramientas de OpenClaw y la pasa al intento preparado. Cuando un arnés ejecuta una llamada dinámica a herramienta, devuelve el resultado de la herramienta mediante la forma de resultado del arnés en lugar de enviar medios al canal por tu cuenta.

Esto mantiene las salidas de texto, imagen, video, música, TTS, aprobación y herramientas de mensajería en la misma ruta de entrega que las ejecuciones respaldadas por PI.

## Limitaciones actuales

- La ruta de importación pública es genérica, pero algunos alias de tipos de intento/resultado aún mantienen nombres `Pi` por compatibilidad.
- La instalación de arneses de terceros es experimental. Prefiere los plugins de proveedores hasta que necesites un entorno de ejecución de sesión nativo.
- El cambio de arnés está admitido entre turnos. No cambies de arnés en medio de un turno después de que hayan comenzado las herramientas nativas, las aprobaciones, el texto del asistente o los envíos de mensajes.

## Relacionado

- [Descripción general del SDK](/es/plugins/sdk-overview)
- [Ayudantes de entorno de ejecución](/es/plugins/sdk-runtime)
- [Plugins de proveedores](/es/plugins/sdk-provider-plugins)
- [Arnés de Codex](/es/plugins/codex-harness)
- [Proveedores de modelos](/es/concepts/model-providers)
