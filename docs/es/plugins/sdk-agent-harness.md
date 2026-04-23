---
read_when:
    - Está cambiando el tiempo de ejecución del agente integrado o el registro de harnesses de agentes
    - Está registrando un Agent Harness desde un plugin incluido o de confianza
    - Necesita comprender cómo el plugin de Codex se relaciona con los proveedores de modelos
sidebarTitle: Agent Harness
summary: Superficie experimental del SDK para plugins que reemplazan el ejecutor integrado de agentes de bajo nivel
title: Plugins de Agent Harness
x-i18n:
    generated_at: "2026-04-23T05:17:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: efaecca18210af0e9e641bd888c1edb55e08e96299158ff021d6c2dd0218ec25
    source_path: plugins/sdk-agent-harness.md
    workflow: 15
---

# Plugins de Agent Harness

Un **agent harness** es el ejecutor de bajo nivel para un turno preparado
de un agente de OpenClaw. No es un proveedor de modelos, no es un canal y no es un registro de herramientas.

Use esta superficie solo para plugins nativos incluidos o de confianza. El contrato
sigue siendo experimental porque los tipos de parámetros reflejan intencionalmente el ejecutor integrado actual.

## Cuándo usar un harness

Registre un agent harness cuando una familia de modelos tenga su propio tiempo de ejecución
de sesión nativo y el transporte normal de proveedores de OpenClaw sea la abstracción incorrecta.

Ejemplos:

- un servidor nativo de agente de programación que posee hilos y Compaction
- una CLI o daemon local que debe transmitir eventos nativos de plan/razonamiento/herramientas
- un tiempo de ejecución de modelo que necesita su propio ID de reanudación además del
  transcript de sesión de OpenClaw

**No** registre un harness solo para agregar una nueva API de LLM. Para API normales de modelos por HTTP o
WebSocket, cree un [plugin de proveedor](/es/plugins/sdk-provider-plugins).

## Qué sigue controlando el núcleo

Antes de que se seleccione un harness, OpenClaw ya resolvió:

- proveedor y modelo
- estado de autenticación en tiempo de ejecución
- nivel de razonamiento y presupuesto de contexto
- el transcript/archivo de sesión de OpenClaw
- espacio de trabajo, sandbox y política de herramientas
- callbacks de respuesta del canal y callbacks de transmisión
- política de conmutación por error del modelo y cambio de modelo en vivo

Esa división es intencional. Un harness ejecuta un intento preparado; no elige
proveedores, no reemplaza la entrega del canal ni cambia silenciosamente de modelo.

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

OpenClaw elige un harness después de resolver proveedor/modelo:

1. `OPENCLAW_AGENT_RUNTIME=<id>` fuerza un harness registrado con ese ID.
2. `OPENCLAW_AGENT_RUNTIME=pi` fuerza el harness PI integrado.
3. `OPENCLAW_AGENT_RUNTIME=auto` pregunta a los harnesses registrados si admiten el
   proveedor/modelo resuelto.
4. Si ningún harness registrado coincide, OpenClaw usa PI a menos que el respaldo a PI
   esté deshabilitado.

Los fallos del harness del plugin aparecen como fallos de ejecución. En modo `auto`,
el respaldo a PI solo se usa cuando ningún harness de plugin registrado admite el
proveedor/modelo resuelto. Una vez que un harness de plugin ha reclamado una ejecución,
OpenClaw no vuelve a reproducir ese mismo turno mediante PI porque eso puede cambiar la semántica de autenticación/tiempo de ejecución
o duplicar efectos secundarios.

El plugin de Codex incluido registra `codex` como su ID de harness. El núcleo trata eso
como un ID normal de harness de plugin; los alias específicos de Codex pertenecen al plugin
o a la configuración del operador, no al selector compartido del tiempo de ejecución.

## Emparejamiento de proveedor y harness

La mayoría de los harnesses también deberían registrar un proveedor. El proveedor hace que las referencias de modelo,
el estado de autenticación, los metadatos del modelo y la selección con `/model` sean visibles para el resto de
OpenClaw. Luego el harness reclama ese proveedor en `supports(...)`.

El plugin de Codex incluido sigue este patrón:

- ID del proveedor: `codex`
- referencias de modelo del usuario: `codex/gpt-5.4`, `codex/gpt-5.2` u otro modelo devuelto
  por el servidor de aplicaciones de Codex
- ID del harness: `codex`
- autenticación: disponibilidad sintética del proveedor, porque el harness de Codex controla
  el inicio de sesión/sesión nativos de Codex
- solicitud al servidor de aplicaciones: OpenClaw envía el ID del modelo sin prefijo a Codex y deja que el
  harness hable con el protocolo nativo del servidor de aplicaciones

El plugin de Codex es aditivo. Las referencias simples `openai/gpt-*` siguen siendo referencias del proveedor OpenAI
y continúan usando la ruta normal de proveedor de OpenClaw. Seleccione `codex/gpt-*`
cuando quiera autenticación administrada por Codex, detección de modelos de Codex, hilos nativos y
ejecución mediante el servidor de aplicaciones de Codex. `/model` puede cambiar entre los modelos de Codex devueltos
por el servidor de aplicaciones de Codex sin requerir credenciales del proveedor OpenAI.

Para la configuración del operador, ejemplos de prefijos de modelo y configuraciones exclusivas de Codex, consulte
[Codex Harness](/es/plugins/codex-harness).

OpenClaw requiere Codex app-server `0.118.0` o posterior. El plugin de Codex comprueba
el protocolo de enlace de inicialización del servidor de aplicaciones y bloquea servidores más antiguos o sin versión para que
OpenClaw solo se ejecute sobre la superficie del protocolo con la que se ha probado.

### Middleware de resultados de herramientas del servidor de aplicaciones de Codex

Los plugins incluidos también pueden adjuntar middleware específico de `tool_result`
del servidor de aplicaciones de Codex mediante `api.registerCodexAppServerExtensionFactory(...)` cuando su
manifiesto declara `contracts.embeddedExtensionFactories: ["codex-app-server"]`.
Esta es la vía para plugins de confianza para transformaciones asíncronas de resultados de herramientas que necesitan
ejecutarse dentro del harness nativo de Codex antes de que la salida de la herramienta se proyecte de vuelta
al transcript de OpenClaw.

### Modo nativo de harness de Codex

El harness incluido `codex` es el modo nativo de Codex para turnos integrados
de agentes de OpenClaw. Habilite primero el plugin incluido `codex` e incluya `codex` en
`plugins.allow` si su configuración usa una lista restrictiva de permitidos. Es diferente de `openai-codex/*`:

- `openai-codex/*` usa OAuth de ChatGPT/Codex a través de la ruta normal de proveedor de OpenClaw.
- `codex/*` usa el proveedor incluido de Codex y enruta el turno a través del servidor de aplicaciones de Codex.

Cuando este modo se ejecuta, Codex controla el ID de hilo nativo, el comportamiento de reanudación,
Compaction y la ejecución del servidor de aplicaciones. OpenClaw sigue controlando el canal de chat,
el espejo visible del transcript, la política de herramientas, las aprobaciones, la entrega de medios y la
selección de sesión. Use `embeddedHarness.runtime: "codex"` con
`embeddedHarness.fallback: "none"` cuando necesite demostrar que solo la ruta del
servidor de aplicaciones de Codex puede reclamar la ejecución. Esa configuración es solo una barrera de selección:
los fallos del servidor de aplicaciones de Codex ya fallan directamente en lugar de reintentarse mediante PI.

## Deshabilitar el respaldo a PI

De forma predeterminada, OpenClaw ejecuta agentes integrados con `agents.defaults.embeddedHarness`
establecido en `{ runtime: "auto", fallback: "pi" }`. En modo `auto`, los harnesses de plugin registrados
pueden reclamar un par proveedor/modelo. Si ninguno coincide, OpenClaw recurre a PI.

Establezca `fallback: "none"` cuando necesite que la falta de selección del harness de plugin falle
en lugar de usar PI. Los fallos del harness de plugin seleccionado ya fallan de forma definitiva. Esto
no bloquea un `runtime: "pi"` explícito ni `OPENCLAW_AGENT_RUNTIME=pi`.

Para ejecuciones integradas exclusivas de Codex:

```json
{
  "agents": {
    "defaults": {
      "model": "codex/gpt-5.4",
      "embeddedHarness": {
        "runtime": "codex",
        "fallback": "none"
      }
    }
  }
}
```

Si quiere que cualquier harness de plugin registrado reclame los modelos coincidentes pero nunca
quiere que OpenClaw recurra silenciosamente a PI, mantenga `runtime: "auto"` y deshabilite
el respaldo:

```json
{
  "agents": {
    "defaults": {
      "embeddedHarness": {
        "runtime": "auto",
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
      "embeddedHarness": {
        "runtime": "auto",
        "fallback": "pi"
      }
    },
    "list": [
      {
        "id": "codex-only",
        "model": "codex/gpt-5.4",
        "embeddedHarness": {
          "runtime": "codex",
          "fallback": "none"
        }
      }
    ]
  }
}
```

`OPENCLAW_AGENT_RUNTIME` sigue anulando el tiempo de ejecución configurado. Use
`OPENCLAW_AGENT_HARNESS_FALLBACK=none` para deshabilitar el respaldo a PI desde el
entorno.

```bash
OPENCLAW_AGENT_RUNTIME=codex \
OPENCLAW_AGENT_HARNESS_FALLBACK=none \
openclaw gateway run
```

Con el respaldo deshabilitado, una sesión falla pronto cuando el harness solicitado no está
registrado, no admite el proveedor/modelo resuelto o falla antes de
producir efectos secundarios del turno. Eso es intencional para implementaciones exclusivas de Codex y
para pruebas en vivo que deben demostrar que realmente se está usando la ruta del servidor de aplicaciones de Codex.

Esta configuración solo controla el harness del agente integrado. No deshabilita
el enrutamiento específico del proveedor para imagen, video, música, TTS, PDF u otros modelos.

## Sesiones nativas y espejo del transcript

Un harness puede mantener un ID de sesión nativo, ID de hilo o token de reanudación del lado del daemon.
Mantenga esa vinculación asociada explícitamente con la sesión de OpenClaw y siga
reflejando la salida visible para el usuario del asistente/herramienta en el transcript de OpenClaw.

El transcript de OpenClaw sigue siendo la capa de compatibilidad para:

- historial de sesión visible en el canal
- búsqueda e indexación del transcript
- volver al harness PI integrado en un turno posterior
- comportamiento genérico de `/new`, `/reset` y eliminación de sesión

Si su harness almacena una vinculación auxiliar, implemente `reset(...)` para que OpenClaw pueda
borrarla cuando se restablezca la sesión propietaria de OpenClaw.

## Resultados de herramientas y medios

El núcleo construye la lista de herramientas de OpenClaw y la pasa al intento preparado.
Cuando un harness ejecuta una llamada dinámica a una herramienta, devuelva el resultado de la herramienta a través
de la forma de resultado del harness en lugar de enviar medios del canal por su cuenta.

Esto mantiene las salidas de texto, imagen, video, música, TTS, aprobación y herramientas de mensajería
en la misma ruta de entrega que las ejecuciones respaldadas por PI.

## Limitaciones actuales

- La ruta pública de importación es genérica, pero algunos alias de tipos de intento/resultado todavía
  llevan nombres `Pi` por compatibilidad.
- La instalación de harnesses de terceros es experimental. Prefiera plugins de proveedor
  hasta que necesite un tiempo de ejecución de sesión nativo.
- Se admite el cambio de harness entre turnos. No cambie de harness en medio
  de un turno después de que hayan comenzado herramientas nativas, aprobaciones, texto del asistente o envíos de mensajes.

## Relacionado

- [Descripción general del SDK](/es/plugins/sdk-overview)
- [Ayudantes de tiempo de ejecución](/es/plugins/sdk-runtime)
- [Plugins de proveedor](/es/plugins/sdk-provider-plugins)
- [Codex Harness](/es/plugins/codex-harness)
- [Proveedores de modelos](/es/concepts/model-providers)
