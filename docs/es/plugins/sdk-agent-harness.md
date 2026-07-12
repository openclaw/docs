---
read_when:
    - Estás cambiando el entorno de ejecución del agente integrado o el registro del arnés
    - Está registrando un entorno de agente desde un plugin incluido o de confianza
    - Necesitas entender cómo se relaciona el plugin de Codex con los proveedores de modelos.
sidebarTitle: Agent Harness
summary: Superficie experimental del SDK para plugins que reemplazan el ejecutor integrado de agentes de bajo nivel
title: Plugins del arnés de agentes
x-i18n:
    generated_at: "2026-07-12T14:42:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: be2717d9986c30e931d3443dc6b70542ab20badb4ad0921e797fbad280513d1e
    source_path: plugins/sdk-agent-harness.md
    workflow: 16
---

Un **harness de agente** es el ejecutor de bajo nivel para un turno preparado de un agente de OpenClaw. No es un proveedor de modelos, ni un canal, ni un registro de herramientas. Para consultar el modelo mental orientado al usuario, véase [Runtimes de agente](/es/concepts/agent-runtimes).

Use esta superficie solo para plugins nativos integrados o de confianza. El contrato sigue siendo experimental porque los tipos de parámetros reflejan intencionadamente el ejecutor integrado actual.

## Cuándo usar un harness

Registre un harness de agente cuando una familia de modelos tenga su propio runtime de sesión nativo y el transporte normal de proveedores de OpenClaw no sea la abstracción adecuada:

- un servidor nativo de agente de programación que gestione hilos y Compaction
- una CLI o un daemon local que deba transmitir eventos nativos de planificación, razonamiento o herramientas
- un runtime de modelo que necesite su propio identificador de reanudación además de la transcripción de sesión de OpenClaw

**No** registre un harness únicamente para añadir una nueva API de LLM. Para las API de modelos HTTP o WebSocket normales, cree un [plugin de proveedor](/es/plugins/sdk-provider-plugins).

## Qué sigue gestionando el núcleo

Antes de seleccionar un harness, OpenClaw ya ha resuelto:

- el proveedor y el modelo
- el estado de autenticación del runtime, salvo que el harness declare que gestiona la inicialización de la autenticación
- el nivel de razonamiento y el presupuesto de contexto
- el archivo de transcripción/sesión de OpenClaw
- el espacio de trabajo, el entorno aislado y la política de herramientas
- las funciones de devolución de llamada para las respuestas del canal y la transmisión
- la política de respaldo de modelos y cambio de modelo en vivo

Un harness ejecuta un intento preparado; no selecciona proveedores, no sustituye la entrega del canal ni cambia de modelo de forma silenciosa.

### Inicialización de autenticación gestionada por el harness

De forma predeterminada, el núcleo resuelve las credenciales del proveedor antes de llamar a un harness. Un harness de confianza que pueda autenticarse mediante su propio runtime nativo puede establecer `authBootstrap: "harness"` en su registro estático `AgentHarness`. De este modo, el núcleo omite su inicialización genérica de credenciales del proveedor y el error por falta de credenciales en cada intento reclamado por ese harness.

El núcleo sigue reenviando un perfil de autenticación de OpenClaw compatible, seleccionado u ordenado explícitamente, y su almacén con ámbito definido cuando existen. El harness debe resolver ese perfil o sus credenciales nativas antes de realizar solicitudes al modelo, limitar los secretos al ámbito del intento y mostrar errores de autenticación que permitan tomar medidas. No establezca esta capacidad en un harness que solo gestione la autenticación en algunas ocasiones.

### Artefactos verificados del runtime de configuración

Un harness local que pueda proporcionar inferencia para la configuración de la primera ejecución debe certificar la implementación que completó la comprobación. Cuando `params.captureRuntimeArtifact` sea verdadero, devuelva un `result.runtimeArtifact` opaco con un identificador estable y una huella digital del contenido. Registre una capacidad `runtimeArtifact.validate(...)` correspondiente que vuelva a comprobar esa vinculación sin cargar otro harness ni examinar plugins no relacionados.

Las continuaciones verificadas de Crestodian también pasan `params.expectedRuntimeArtifact`. El harness debe compararlo con el proceso nativo exacto que haya adquirido y producir un error antes de iniciar o reanudar un hilo nativo si difieren. Los turnos de agente normales omiten ambos campos, por lo que el cálculo de hashes del contenido queda fuera de la ruta crítica normal de las solicitudes. Los harnesses remotos/WebSocket necesitan un contrato de certificación del servidor antes de poder participar; una cadena de versión por sí sola no constituye la identidad de un artefacto.

El intento preparado también incluye `params.runtimePlan`, un conjunto de políticas gestionado por OpenClaw para las decisiones del runtime que deben seguir siendo comunes entre OpenClaw y los harnesses nativos:

- `runtimePlan.tools.normalize(...)` y `runtimePlan.tools.logDiagnostics(...)`
  para la política del esquema de herramientas adaptada al proveedor
- `runtimePlan.transcript.resolvePolicy(...)` para la política de saneamiento de transcripciones y reparación de llamadas a herramientas
- `runtimePlan.delivery.isSilentPayload(...)` para la supresión compartida de la entrega de `NO_REPLY` y contenido multimedia
- `runtimePlan.outcome.classifyRunResult(...)` para la clasificación del respaldo de modelos
- `runtimePlan.observability` para los metadatos resueltos del proveedor, modelo y harness

Los harnesses pueden usar el plan para tomar decisiones que deban coincidir con el comportamiento de OpenClaw, pero deben tratarlo como estado del intento gestionado por el host: no deben modificarlo ni usarlo para cambiar de proveedor o modelo dentro de un turno.

### Contrato de transporte de solicitudes

`supports(ctx)` recibe el transporte de modelo resuelto en `ctx.modelProvider`. Dos datos sin secretos gestionados por el proveedor describen la ruta seleccionada:

- `runtimePolicy.compatibleIds` enumera los identificadores de runtime que el proveedor declara compatibles con esa ruta concreta. La ausencia de una política significa que el proveedor no declaró compatibilidad a nivel de ruta; no constituye permiso para suponer que existe compatibilidad.
- `requestTransportOverrides: "none"` significa que no es necesario reproducir ninguna modificación de solicitud del proveedor o modelo definida por el autor. `"present"` significa que existen encabezados, transporte de autenticación, proxy, TLS, comportamiento de servicio local o red privada, o parámetros de solicitud definidos por el autor. Este dato no expone esos valores.

Devuelva `{ supported: false, reason }` cuando el harness no pueda reproducir el transporte preparado. No deduzca la compatibilidad leyendo la configuración sin procesar después de la selección. Cuando la preparación de la autenticación genere varias rutas de reintento, un mismo harness debe admitirlas todas antes del envío. La selección implícita usa OpenClaw si ningún plugin puede gestionar el conjunto completo; una selección explícita o persistente de un plugin produce un error de forma restrictiva.

## Registrar un harness

**Importación:** `openclaw/plugin-sdk/agent-harness`

```typescript
import type { AgentHarness } from "openclaw/plugin-sdk/agent-harness";
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

const myHarness: AgentHarness = {
  id: "my-harness",
  label: "My native agent harness",

  supports(ctx) {
    const routeSupportsHarness =
      ctx.modelProvider?.runtimePolicy?.compatibleIds.includes("my-harness") === true;
    const canReproduceRequest = ctx.modelProvider?.requestTransportOverrides !== "present";
    return ctx.provider === "my-provider" && routeSupportsHarness && canReproduceRequest
      ? { supported: true, priority: 100 }
      : { supported: false, reason: "effective route is not harness-compatible" };
  },

  async runAttempt(params) {
    // Inicia o reanuda tu hilo nativo.
    // Usa params.prompt, params.tools, params.images, params.onPartialReply,
    // params.onAgentEvent y los demás campos preparados del intento.
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

`authBootstrap` se omite intencionadamente en este ejemplo genérico. Añade
`authBootstrap: "harness"` solo cuando el arnés cumpla el contrato anterior.

### Ejecución delegada

El propietario de un arnés puede establecer `delegatedExecutionPluginIds` con los ids de
plugins de confianza que necesiten ejecutar una sesión existente bloqueada a un modelo, como un
transporte de voz que continúe una conversación respaldada por Codex. Este es un consentimiento estático del propietario,
no una lista de permitidos del núcleo. Mantenlo restringido.

Los delegados reciben únicamente la admisión de trabajo y la ejecución integrada. OpenClaw exige
la clave de sesión almacenada exacta, la ruta del almacén y el id de sesión; `modelSelectionLocked:
true`; y valores coincidentes de `agentHarnessId` y `agentHarnessRuntimeOverride`.
Después, la ejecución queda delimitada mediante el propietario del arnés. La creación, modificación,
restablecimiento, eliminación y archivado de sesiones, así como las mutaciones del Gateway, siguen siendo exclusivas del propietario.

## Política de selección

OpenClaw elige un arnés después de resolver el proveedor y el modelo:

1. La política de entorno de ejecución específica del modelo tiene prioridad.
2. A continuación se aplica la política de entorno de ejecución específica del proveedor.
3. `auto` consulta a los arneses registrados si admiten la ruta efectiva
   resuelta. Los prefijos de proveedor o modelo por sí solos nunca seleccionan un arnés.
4. Si ningún arnés registrado coincide, OpenClaw usa su entorno de ejecución integrado.

Los fallos de los arneses de plugins se presentan como fallos de ejecución. En el modo `auto`, la
alternativa integrada solo se aplica cuando ningún arnés de Plugin registrado admite el
proveedor/modelo resuelto. Una vez que un arnés de Plugin ha reclamado una ejecución, OpenClaw no
reproduce ese mismo turno mediante otro entorno de ejecución, porque eso puede cambiar
la semántica de autenticación o del entorno de ejecución, o duplicar efectos secundarios.

La política de entorno de ejecución configurada sigue siendo la autoridad respecto al entorno deseado. El
`agentHarnessId` de una sesión persistente mantiene la propiedad de su transcripción nativa
mientras la preparación de la ruta y la autenticación aún está pendiente. Ninguno de los dos vuelve compatible una
ruta incompatible: una vez que existen los datos preparados, el arnés seleccionado o fijado
debe admitirlos o la ejecución falla de forma cerrada. `/status` muestra el entorno de ejecución efectivo
seleccionado a partir de la política, la propiedad persistida y la compatibilidad de la ruta.
El estado preparado es explícito: la ausencia de `runtimePolicy` permanece sin declarar en lugar
de inferirse a partir de los campos de transporte que estén presentes.
Cuando la autenticación propiedad del arnés deja sin resolver varias rutas físicas, el
dato de compatibilidad preparado es la intersección de sus ids de entorno de ejecución compatibles e
indica las modificaciones de solicitud si algún candidato las tiene. Por tanto, un candidato sin declarar
hace que la compatibilidad nativa quede vacía; `preparedAuth.source: "harness"`
es un propietario de autenticación, no un permiso para inferir la compatibilidad de la ruta.

Si el arnés seleccionado resulta inesperado, activa el registro de depuración de `agents/harness`
e inspecciona el registro estructurado `agent harness selected` del Gateway: incluye
el id del arnés seleccionado, el motivo de la selección, la política de entorno de ejecución y alternativa
y, en el modo `auto`, el resultado de compatibilidad de cada candidato de Plugin.

El Plugin de Codex incluido registra `codex` como su id de arnés. El núcleo trata ese
valor como un id de arnés de Plugin ordinario; los alias específicos de Codex deben estar en el Plugin
o en la configuración del operador, no en el selector de entorno de ejecución compartido.

## Emparejamiento de proveedor y arnés

La mayoría de los arneses también deberían registrar un proveedor. El proveedor hace que las referencias de modelos,
el estado de autenticación, los metadatos de los modelos y la selección mediante `/model` sean visibles para el resto de
OpenClaw. Después, el arnés reclama ese proveedor en `supports(...)`.

El Plugin de Codex incluido sigue este patrón:

- referencias de modelos preferidas para usuarios: `openai/gpt-5.6-sol`
- referencias de compatibilidad: las referencias heredadas `codex/gpt-*` siguen aceptándose, pero las
  configuraciones nuevas no deberían usarlas como referencias normales de proveedor/modelo
- id del arnés: `codex`
- autenticación: disponibilidad sintética del proveedor, porque el arnés de Codex es propietario del
  inicio de sesión y la sesión nativos de Codex
- solicitud al servidor de la aplicación: OpenClaw envía el id de modelo sin prefijo a Codex y permite que el
  arnés se comunique con el protocolo nativo del servidor de la aplicación

El Plugin de Codex es aditivo. Cuando la política de entorno de ejecución no está establecida o es `auto`, OpenAI puede
seleccionar Codex solo cuando su contrato de ruta propiedad del proveedor declara que `codex` es
compatible: una ruta exacta oficial HTTPS de Platform Responses o ChatGPT Responses
sin modificaciones de solicitud definidas. El prefijo `openai/*` por sí solo nunca
selecciona Codex. Los endpoints personalizados, los adaptadores de Completions y el comportamiento de solicitud
definido permanecen en OpenClaw. Los endpoints HTTP oficiales en texto sin cifrar se rechazan. Las referencias antiguas `codex/gpt-*`
siguen siendo entradas de compatibilidad. Consulta
[Entorno de ejecución de agente implícito de OpenAI](/es/providers/openai#implicit-agent-runtime).

Para la configuración del operador, ejemplos de prefijos de modelos y configuraciones exclusivas de Codex, consulta
[Arnés de Codex](/es/plugins/codex-harness).

El Plugin de Codex exige la versión mínima del servidor de la aplicación documentada en
[Arnés de Codex](/es/plugins/codex-harness). Comprueba el protocolo de enlace de inicialización y
bloquea servidores antiguos o sin versión, de modo que OpenClaw solo se ejecuta con la superficie
del protocolo que ha probado.

### Middleware de resultados de herramientas

Los plugins incluidos y los plugins instalados habilitados explícitamente cuyos
contratos de manifiesto coincidan pueden adjuntar middleware de resultados de herramientas independiente del entorno de ejecución mediante
`api.registerAgentToolResultMiddleware(...)` cuando su manifiesto declare los
ids de entorno de ejecución de destino en `contracts.agentToolResultMiddleware`. Este punto de integración de confianza
sirve para transformaciones asíncronas de resultados de herramientas que deben ejecutarse antes de que OpenClaw o
Codex devuelva la salida de las herramientas al modelo.

Los plugins heredados incluidos aún pueden usar
`api.registerCodexAppServerExtensionFactory(...)` para middleware exclusivo del
servidor de la aplicación de Codex, pero las transformaciones de resultados nuevas deberían usar la API independiente del entorno de ejecución. El
enlace `api.registerEmbeddedExtensionFactory(...)`, exclusivo del ejecutor integrado, se ha
eliminado; las transformaciones integradas de resultados de herramientas deben usar middleware independiente del entorno de ejecución.

### Clasificación del resultado del terminal

Los harnesses nativos que gestionan su propia proyección de protocolo pueden usar
`classifyAgentHarnessTerminalOutcome(...)` de
`openclaw/plugin-sdk/agent-harness-runtime` cuando un turno completado no haya producido
texto visible del asistente. El auxiliar devuelve `empty`, `reasoning-only` o
`planning-only` para que la política de respaldo de OpenClaw pueda decidir si debe reintentar
con un modelo diferente. `planning-only` requiere el campo `planText` explícito
del harness; OpenClaw no lo infiere de la prosa del asistente. El auxiliar
deja intencionadamente sin clasificar los errores de prompt, los turnos en curso y las
respuestas silenciosas intencionadas, como `NO_REPLY`.

### Efectos secundarios al finalizar el agente

Los harnesses nativos deben llamar a `runAgentEndSideEffects(...)` de
`openclaw/plugin-sdk/agent-harness-runtime` después de finalizar un intento. Esta función
despacha el hook portátil `agent_end` y la captura de investigación de OpenClaw
sin retrasar las respuestas interactivas. Use `awaitAgentEndSideEffects(...)` para
ejecuciones locales no interactivas en las que el intento no deba resolverse hasta que
finalicen esos efectos secundarios. Ambos auxiliares aceptan la misma carga `{ event, ctx }`
que `runAgentHarnessAgentEndHook(...)`; sus fallos no alteran el resultado del
intento completado.

### Entrada del usuario y superficies de herramientas

Los harnesses nativos que expongan una solicitud de entrada del usuario en el nivel del entorno de ejecución deben usar los
auxiliares de entrada del usuario de `openclaw/plugin-sdk/agent-harness-runtime` para dar formato
al prompt, entregarlo mediante la ruta de respuesta bloqueante de OpenClaw y normalizar
las respuestas de opción o de formato libre a la forma de respuesta nativa del entorno de ejecución. El
auxiliar mantiene coherente la presentación en el canal y la TUI, mientras cada harness conserva su
propio análisis del protocolo y el ciclo de vida de las solicitudes pendientes.

Los harnesses nativos que necesiten un enrutamiento compacto de herramientas similar a PI deben usar
`createAgentHarnessToolSurfaceRuntime(...)` de
`openclaw/plugin-sdk/agent-harness-tool-runtime`. Este gestiona
la selección de controles de búsqueda de herramientas y modo de código, los valores predeterminados ligeros para modelos locales,
el filtrado de esquemas compatible con el entorno de ejecución, la ejecución del catálogo oculto, la hidratación
de directorios y la limpieza del catálogo. Los harnesses siguen siendo responsables de su conversión de herramientas
específica del SDK y de la devolución de llamada de ejecución nativa.

### Modo de harness nativo de Codex

El harness `codex` incluido es el modo nativo de Codex para los turnos de agente
integrados de OpenClaw. Active primero el Plugin `codex` incluido e incluya `codex` en
`plugins.allow` si su configuración usa una lista de permitidos restrictiva. Las configuraciones nativas de app-server
deben usar `openai/gpt-*`; los turnos del agente de OpenAI seleccionan el harness de Codex
solo cuando la ruta efectiva declara compatibilidad con Codex. Las referencias de modelos
heredadas de Codex deben repararse con `openclaw doctor --fix`, y las referencias de modelos
`codex/*` heredadas siguen siendo alias de compatibilidad para el harness nativo.

Cuando se ejecuta este modo, Codex gestiona el identificador nativo del hilo, el comportamiento de reanudación,
la Compaction y la ejecución del app-server. OpenClaw sigue gestionando el canal de chat,
el reflejo visible de la transcripción, la política de herramientas, las aprobaciones, la entrega de contenido multimedia y la selección
de sesiones. Use `agentRuntime.id: "codex"` del proveedor/modelo cuando necesite
demostrar que solo la ruta del app-server de Codex puede hacerse cargo de la ejecución. Los entornos de ejecución de Plugin
explícitos fallan de forma cerrada; los fallos de selección del app-server de Codex y los fallos del entorno de ejecución
no se reintentan mediante otro entorno de ejecución.

## Rigurosidad del entorno de ejecución

De forma predeterminada, OpenClaw usa la política `auto` del entorno de ejecución del proveedor/modelo: los
harnesses de Plugin registrados pueden hacerse cargo de rutas efectivas compatibles, y el entorno
de ejecución integrado gestiona el turno cuando ninguno coincide. Un prefijo de proveedor/modelo por sí solo nunca
selecciona un harness. Use un entorno de ejecución de Plugin explícito para el proveedor/modelo, como
`agentRuntime.id: "codex"`, cuando la ausencia de selección de un harness deba provocar un fallo en lugar
de enrutar mediante el entorno de ejecución integrado. La selección explícita no convierte una
ruta incompatible en compatible. Los fallos de los harnesses de Plugin seleccionados siempre provocan
un fallo definitivo. Esto no bloquea un
`agentRuntime.id: "openclaw"` explícito para el proveedor/modelo.

Para ejecuciones integradas exclusivas de Codex:

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
      "model": "openai/gpt-5.6-sol"
    }
  }
}
```

Si desea un backend de CLI para un modelo canónico, coloque el entorno de ejecución en la
entrada de ese modelo:

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

Las anulaciones por agente usan la misma estructura con alcance de modelo:

```json
{
  "agents": {
    "list": [
      {
        "id": "codex-only",
        "model": "openai/gpt-5.6-sol",
        "models": {
          "openai/gpt-5.6-sol": {
            "agentRuntime": { "id": "codex" }
          }
        }
      }
    ]
  }
}
```

Los ejemplos heredados de entorno de ejecución para todo el agente, como este, se ignoran:

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

Con un entorno de ejecución de Plugin explícito, una sesión falla anticipadamente cuando el harness
solicitado no está registrado, no admite el proveedor/modelo resuelto o
falla antes de producir efectos secundarios del turno. Esto es intencionado en despliegues exclusivos
de Codex y en pruebas en vivo que deben demostrar que la ruta del app-server de Codex se está
usando realmente.

Esta configuración solo controla el harness de agente integrado. No desactiva
el enrutamiento de modelos específico del proveedor para imágenes, vídeo, música, TTS, PDF u otros contenidos.

## Sesiones nativas y reflejo de la transcripción

Un harness puede conservar un identificador de sesión nativo, un identificador de hilo o un token de reanudación
del lado del daemon. Mantenga esa vinculación asociada explícitamente con la sesión de OpenClaw y
siga reflejando en la transcripción de OpenClaw la salida del asistente y de las herramientas que sea visible para el usuario.

La transcripción de OpenClaw sigue siendo la capa de compatibilidad para:

- el historial de sesiones visible en el canal
- la búsqueda e indexación de transcripciones
- volver al harness integrado de OpenClaw en un turno posterior
- el comportamiento genérico de `/new`, `/reset` y eliminación de sesiones

Si su harness almacena una vinculación auxiliar, implemente `reset(...)` para que OpenClaw
pueda borrarla cuando se restablezca la sesión de OpenClaw propietaria.

## Resultados de herramientas y contenido multimedia

El núcleo construye la lista de herramientas de OpenClaw y la pasa al
intento preparado. Cuando un harness ejecuta una llamada dinámica a una herramienta, devuelva el resultado
de la herramienta mediante la estructura de resultados del harness en lugar de enviar usted mismo el contenido multimedia
al canal.

Esto mantiene las salidas de texto, imagen, vídeo, música, TTS, aprobación y herramientas de mensajería
en la misma ruta de entrega que las ejecuciones respaldadas por OpenClaw.

## Limitaciones actuales

- La ruta pública de importación es genérica, pero algunos alias de tipos de intento/resultado
  aún conservan nombres heredados por compatibilidad.
- La instalación de harnesses de terceros es experimental. Prefiera los Plugins de proveedor
  hasta que necesite un entorno de ejecución de sesión nativo.
- Se admite el cambio de harness entre turnos. No cambie de harness en
  medio de un turno después de que hayan comenzado las herramientas nativas, las aprobaciones, el texto del asistente o los envíos
  de mensajes.

## Contenido relacionado

- [Descripción general del SDK](/es/plugins/sdk-overview)
- [Auxiliares del entorno de ejecución](/es/plugins/sdk-runtime)
- [Plugins de proveedor](/es/plugins/sdk-provider-plugins)
- [Harness de Codex](/es/plugins/codex-harness)
- [Proveedores de modelos](/es/concepts/model-providers)
