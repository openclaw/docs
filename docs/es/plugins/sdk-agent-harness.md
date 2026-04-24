---
read_when:
    - Estás cambiando el runtime embebido del agente o el registro de harnesses
    - Estás registrando un harness de agente desde un Plugin incluido o de confianza
    - Necesitas entender cómo se relaciona el Plugin de Codex con los proveedores de modelos
sidebarTitle: Agent Harness
summary: Superficie experimental del SDK para Plugins que sustituyen el ejecutor embebido de bajo nivel del agente
title: Plugins de harness de agente
x-i18n:
    generated_at: "2026-04-24T05:40:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: af76c2a3ebe54c87920954b58126ee59538c0e6d3d1b4ba44890c1f5079fabc2
    source_path: plugins/sdk-agent-harness.md
    workflow: 15
---

Un **harness de agente** es el ejecutor de bajo nivel para un turno preparado de agente de OpenClaw.
No es un proveedor de modelos, ni un canal, ni un registro de herramientas.

Usa esta superficie solo para Plugins nativos incluidos o de confianza. El contrato
sigue siendo experimental porque los tipos de parámetros reflejan intencionadamente el runner embebido actual.

## Cuándo usar un harness

Registra un harness de agente cuando una familia de modelos tiene su propio runtime nativo de sesión
y el transporte normal de proveedor de OpenClaw es la abstracción equivocada.

Ejemplos:

- un servidor nativo de agente de programación que es propietario de los hilos y de Compaction
- una CLI o daemon local que debe transmitir eventos nativos de plan/razonamiento/herramienta
- un runtime de modelo que necesita su propio id de reanudación además de la
  transcripción de sesión de OpenClaw

**No** registres un harness solo para añadir una nueva API de LLM. Para API normales de modelos por HTTP o
WebSocket, crea un [Plugin de proveedor](/es/plugins/sdk-provider-plugins).

## Lo que sigue siendo propiedad del núcleo

Antes de seleccionar un harness, OpenClaw ya ha resuelto:

- proveedor y modelo
- estado de autenticación del runtime
- nivel de pensamiento y presupuesto de contexto
- la transcripción/archivo de sesión de OpenClaw
- espacio de trabajo, sandbox y política de herramientas
- callbacks de respuesta de canal y callbacks de streaming
- política de respaldo de modelo y cambio activo de modelo

Esa separación es intencionada. Un harness ejecuta un intento preparado; no elige
proveedores, no sustituye la entrega por canal ni cambia de modelo silenciosamente.

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
    // Inicia o reanuda tu hilo nativo.
    // Usa params.prompt, params.tools, params.images, params.onPartialReply,
    // params.onAgentEvent y los demás campos del intento preparado.
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

1. El id de harness registrado en una sesión existente tiene prioridad, para que los cambios de config/env no cambien en caliente esa transcripción a otro runtime.
2. `OPENCLAW_AGENT_RUNTIME=<id>` fuerza un harness registrado con ese id para
   sesiones que aún no estén fijadas.
3. `OPENCLAW_AGENT_RUNTIME=pi` fuerza el harness PI integrado.
4. `OPENCLAW_AGENT_RUNTIME=auto` pregunta a los harnesses registrados si admiten el
   proveedor/modelo resuelto.
5. Si ningún harness registrado coincide, OpenClaw usa PI salvo que el respaldo PI
   esté deshabilitado.

Los fallos de harness de Plugin aparecen como fallos de ejecución. En modo `auto`, el respaldo PI
solo se usa cuando ningún harness de Plugin registrado admite el
proveedor/modelo resuelto. Una vez que un harness de Plugin ha reclamado una ejecución, OpenClaw no
reproduce ese mismo turno mediante PI porque eso puede cambiar la semántica
de autenticación/runtime o duplicar efectos secundarios.

El id del harness seleccionado se persiste junto con el id de sesión tras una ejecución embebida.
Las sesiones heredadas creadas antes de los pines de harness se tratan como fijadas a PI una vez que ya
tienen historial de transcripción. Usa una sesión nueva/restablecida cuando cambies entre PI y un harness nativo de Plugin. `/status` muestra ids de harness no predeterminados como `codex`
junto a `Fast`; PI permanece oculto porque es la ruta de compatibilidad predeterminada.
Si el harness seleccionado resulta inesperado, habilita el registro de depuración `agents/harness` e inspecciona el registro estructurado `agent harness selected` del gateway. Incluye
el id del harness seleccionado, el motivo de la selección, la política de runtime/respaldo y, en
modo `auto`, el resultado de soporte de cada candidato Plugin.

El Plugin incluido de Codex registra `codex` como su id de harness. El núcleo lo trata
como un id normal de harness de Plugin; los alias específicos de Codex pertenecen al Plugin
o a la configuración del operador, no al selector de runtime compartido.

## Emparejamiento proveedor más harness

La mayoría de harnesses también deberían registrar un proveedor. El proveedor hace que las referencias de modelo,
el estado de autenticación, los metadatos de modelo y la selección `/model` sean visibles para el resto de
OpenClaw. El harness luego reclama ese proveedor en `supports(...)`.

El Plugin incluido de Codex sigue este patrón:

- id del proveedor: `codex`
- referencias de modelo del usuario: `openai/gpt-5.5` más `embeddedHarness.runtime: "codex"`;
  las referencias heredadas `codex/gpt-*` siguen aceptándose por compatibilidad
- id del harness: `codex`
- autenticación: disponibilidad sintética del proveedor, porque el harness de Codex es propietario del
  inicio de sesión/sesión nativos de Codex
- solicitud a app-server: OpenClaw envía el id simple del modelo a Codex y deja que el
  harness hable con el protocolo nativo de app-server

El Plugin de Codex es aditivo. Las referencias simples `openai/gpt-*` siguen usando la
ruta normal de proveedor de OpenClaw salvo que fuerces el harness de Codex con
`embeddedHarness.runtime: "codex"`. Las referencias antiguas `codex/gpt-*` siguen seleccionando el
proveedor y harness de Codex por compatibilidad.

Para configuración del operador, ejemplos de prefijos de modelo y configuraciones exclusivas de Codex, consulta
[Codex Harness](/es/plugins/codex-harness).

OpenClaw requiere Codex app-server `0.118.0` o superior. El Plugin de Codex comprueba
el handshake de inicialización de app-server y bloquea servidores antiguos o sin versión, para que
OpenClaw solo se ejecute contra la superficie de protocolo con la que se ha probado.

### Middleware tool-result de Codex app-server

Los Plugins incluidos también pueden adjuntar middleware `tool_result`
específico de Codex app-server mediante `api.registerCodexAppServerExtensionFactory(...)` cuando su
manifiesto declara `contracts.embeddedExtensionFactories: ["codex-app-server"]`.
Esta es la interfaz de Plugins de confianza para transformaciones asíncronas de tool-result que necesitan
ejecutarse dentro del harness nativo de Codex antes de proyectar la salida de la herramienta de vuelta
a la transcripción de OpenClaw.

### Modo nativo de harness Codex

El harness incluido `codex` es el modo nativo de Codex para turnos embebidos de
agente de OpenClaw. Habilita primero el Plugin incluido `codex` e incluye `codex` en
`plugins.allow` si tu configuración usa una lista restrictiva de permitidos. Las configuraciones nativas de app-server deberían usar `openai/gpt-*` con `embeddedHarness.runtime: "codex"`.
Usa `openai-codex/*` para Codex OAuth mediante PI. Las referencias de modelo heredadas `codex/*`
siguen siendo alias de compatibilidad para el harness nativo.

Cuando este modo se ejecuta, Codex es propietario del id nativo del hilo, del comportamiento de reanudación,
de Compaction y de la ejecución del app-server. OpenClaw sigue siendo propietario del canal de chat,
del espejo visible de la transcripción, de la política de herramientas, de las aprobaciones, de la entrega de multimedia y de la selección de sesión. Usa `embeddedHarness.runtime: "codex"` junto con
`embeddedHarness.fallback: "none"` cuando necesites demostrar que solo la ruta de
Codex app-server puede reclamar la ejecución. Esa configuración es solo una protección de selección:
los fallos de Codex app-server ya fallan directamente en lugar de reintentarse mediante PI.

## Deshabilitar el respaldo PI

De forma predeterminada, OpenClaw ejecuta agentes embebidos con `agents.defaults.embeddedHarness`
establecido en `{ runtime: "auto", fallback: "pi" }`. En modo `auto`, los harnesses de Plugin registrados
pueden reclamar un par proveedor/modelo. Si ninguno coincide, OpenClaw recurre a PI.

Configura `fallback: "none"` cuando necesites que la falta de selección de un harness de Plugin falle
en lugar de usar PI. Los fallos de harness de Plugin ya seleccionados fallan de forma directa. Esto
no bloquea un `runtime: "pi"` explícito ni `OPENCLAW_AGENT_RUNTIME=pi`.

Para ejecuciones embebidas exclusivas de Codex:

```json
{
  "agents": {
    "defaults": {
      "model": "openai/gpt-5.5",
      "embeddedHarness": {
        "runtime": "codex",
        "fallback": "none"
      }
    }
  }
}
```

Si quieres que cualquier harness de Plugin registrado pueda reclamar modelos coincidentes pero nunca
quieres que OpenClaw recurra silenciosamente a PI, mantén `runtime: "auto"` y desactiva
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

Las sobrescrituras por agente usan la misma forma:

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
        "model": "openai/gpt-5.5",
        "embeddedHarness": {
          "runtime": "codex",
          "fallback": "none"
        }
      }
    ]
  }
}
```

`OPENCLAW_AGENT_RUNTIME` sigue sobrescribiendo el runtime configurado. Usa
`OPENCLAW_AGENT_HARNESS_FALLBACK=none` para deshabilitar el respaldo PI desde el
entorno.

```bash
OPENCLAW_AGENT_RUNTIME=codex \
OPENCLAW_AGENT_HARNESS_FALLBACK=none \
openclaw gateway run
```

Con el respaldo deshabilitado, una sesión falla pronto cuando el harness solicitado no está
registrado, no admite el proveedor/modelo resuelto o falla antes de
producir efectos secundarios del turno. Eso es intencionado para despliegues solo de Codex y
para pruebas activas que deben demostrar que realmente se está usando la ruta de Codex app-server.

Este ajuste solo controla el harness embebido del agente. No deshabilita
el enrutamiento específico de proveedor para imagen, video, música, TTS, PDF u otros modelos.

## Sesiones nativas y espejo de transcripción

Un harness puede mantener un id de sesión nativo, id de hilo o token de reanudación del lado del daemon.
Mantén esa vinculación asociada explícitamente con la sesión de OpenClaw y sigue
reflejando la salida visible para el usuario del asistente/herramienta en la transcripción de OpenClaw.

La transcripción de OpenClaw sigue siendo la capa de compatibilidad para:

- historial de sesión visible por canal
- búsqueda e indexación de transcripciones
- volver al harness PI integrado en un turno posterior
- comportamiento genérico de `/new`, `/reset` y eliminación de sesión

Si tu harness almacena una vinculación sidecar, implementa `reset(...)` para que OpenClaw pueda
borrarla cuando se restablezca la sesión propietaria de OpenClaw.

## Resultados de herramientas y multimedia

El núcleo construye la lista de herramientas de OpenClaw y la pasa al intento preparado.
Cuando un harness ejecuta una llamada dinámica de herramienta, devuelve el resultado de la herramienta mediante
la forma de resultado del harness en lugar de enviar multimedia de canal por tu cuenta.

Esto mantiene texto, imagen, video, música, TTS, aprobaciones y salidas de herramientas de mensajería
en la misma ruta de entrega que las ejecuciones respaldadas por PI.

## Limitaciones actuales

- La ruta de importación pública es genérica, pero algunos alias de tipo de intento/resultado todavía
  llevan nombres `Pi` por compatibilidad.
- La instalación de harnesses de terceros es experimental. Prefiere Plugins de proveedor
  hasta que necesites un runtime nativo de sesión.
- El cambio de harness está soportado entre turnos. No cambies de harness en mitad de un turno después de que ya hayan comenzado herramientas nativas, aprobaciones, texto del asistente o envíos de mensajes.

## Relacionado

- [Resumen del SDK](/es/plugins/sdk-overview)
- [Helpers de runtime](/es/plugins/sdk-runtime)
- [Plugins de proveedor](/es/plugins/sdk-provider-plugins)
- [Codex Harness](/es/plugins/codex-harness)
- [Proveedores de modelos](/es/concepts/model-providers)
