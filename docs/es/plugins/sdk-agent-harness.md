---
read_when:
    - Se está cambiando el entorno de ejecución del agente integrado o el registro del arnés
    - Está registrando un entorno de agente desde un plugin incluido o de confianza
    - Debes comprender cómo se relaciona el plugin de Codex con los proveedores de modelos
sidebarTitle: Agent Harness
summary: Superficie experimental del SDK para plugins que sustituyen el ejecutor de agentes integrado de bajo nivel
title: Plugins del entorno de agentes
x-i18n:
    generated_at: "2026-07-19T02:17:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: a43049c126b4defd347b56c31da1b6482e050aa294c3a84673cca59fa5909241
    source_path: plugins/sdk-agent-harness.md
    workflow: 16
---

Un **arnés de agente** es el ejecutor de bajo nivel de un turno preparado de un agente de OpenClaw. No es un proveedor de modelos, un canal ni un registro de herramientas. Para conocer el modelo mental orientado al usuario, consulte [Runtimes de agentes](/es/concepts/agent-runtimes).

Use esta superficie únicamente para plugins nativos integrados o de confianza. El contrato sigue siendo experimental porque los tipos de parámetros reflejan intencionadamente el ejecutor integrado actual.

## Cuándo usar un arnés

Registre un arnés de agente cuando una familia de modelos tenga su propio runtime de sesión nativo y el transporte normal de proveedores de OpenClaw sea una abstracción inadecuada:

- un servidor nativo de agentes de programación que gestiona hilos y la Compaction
- una CLI o un daemon local que debe transmitir eventos nativos de planificación, razonamiento y herramientas
- un runtime de modelo que necesita su propio id de reanudación además de la transcripción de sesión de OpenClaw

**No** registre un arnés solo para añadir una nueva API de LLM. Para las API de modelos HTTP o WebSocket normales, cree un [plugin de proveedor](/es/plugins/sdk-provider-plugins).

## Lo que sigue gestionando el núcleo

Antes de seleccionar un arnés, OpenClaw ya ha resuelto:

- el proveedor y el modelo
- el estado de autenticación del runtime, a menos que el arnés declare que gestiona la inicialización de la autenticación
- el nivel de razonamiento y el presupuesto de contexto
- el archivo de transcripción/sesión de OpenClaw
- el espacio de trabajo, el sandbox y la política de herramientas
- las devoluciones de llamada de respuesta del canal y las devoluciones de llamada de transmisión
- la política de respaldo y cambio de modelo en vivo

Un arnés ejecuta un intento preparado; no elige proveedores, sustituye la entrega del canal ni cambia modelos de forma silenciosa.

### Inicialización de autenticación gestionada por el arnés

De forma predeterminada, el núcleo resuelve las credenciales del proveedor antes de llamar a un arnés. Un arnés de confianza que pueda autenticarse mediante su propio runtime nativo puede establecer `authBootstrap: "harness"` en su registro estático `AgentHarness`. El núcleo omite entonces la inicialización genérica de credenciales del proveedor y el error por falta de credenciales para cada intento reclamado por ese arnés.

El núcleo sigue reenviando un perfil de autenticación de OpenClaw compatible, seleccionado explícitamente u ordenado, y su almacén con ámbito definido cuando existe. El arnés debe resolver ese perfil o sus credenciales nativas antes de emitir solicitudes al modelo, mantener los secretos limitados al intento y mostrar errores de autenticación que permitan actuar. No establezca esta capacidad en un arnés que solo gestione la autenticación en algunos casos.

### Artefactos verificados del runtime de configuración

Un arnés local que pueda proporcionar inferencia para la configuración inicial debe certificar la implementación que completó la prueba. Cuando `params.captureRuntimeArtifact` sea verdadero, devuelva un `result.runtimeArtifact` opaco con un id estable y una huella digital del contenido. Registre una capacidad `runtimeArtifact.validate(...)` correspondiente que vuelva a comprobar esa vinculación sin cargar otro arnés ni examinar plugins no relacionados.

Las continuaciones verificadas de OpenClaw también pasan `params.expectedRuntimeArtifact`. El arnés debe compararlo con el proceso nativo exacto que adquirió y generar un error antes de iniciar o reanudar un hilo nativo si no coinciden. Los turnos de agente ordinarios omiten ambos campos, por lo que el cálculo del hash del contenido queda fuera de la ruta crítica normal de las solicitudes. Los arneses remotos/WebSocket necesitan un contrato de certificación del servidor antes de poder participar; una cadena de versión por sí sola no constituye la identidad de un artefacto.

El intento preparado también incluye `params.runtimePlan`, un conjunto de políticas gestionado por OpenClaw para las decisiones del runtime que deben seguir compartidas entre OpenClaw y los arneses nativos:

- `runtimePlan.tools.normalize(...)` y `runtimePlan.tools.logDiagnostics(...)` para la política de esquemas de herramientas dependiente del proveedor
- `runtimePlan.transcript.resolvePolicy(...)` para la sanitización de transcripciones y la política de reparación de llamadas a herramientas
- `runtimePlan.delivery.isSilentPayload(...)` para la supresión compartida de `NO_REPLY` y de la entrega de contenido multimedia
- `runtimePlan.outcome.classifyRunResult(...)` para la clasificación del respaldo de modelos
- `runtimePlan.observability` para los metadatos resueltos del proveedor, modelo y arnés

Los arneses pueden usar el plan para decisiones que deban coincidir con el comportamiento de OpenClaw, pero deben tratarlo como estado del intento gestionado por el host: no deben modificarlo ni usarlo para cambiar de proveedor o modelo dentro de un turno.

### Contrato de transporte de solicitudes

`supports(ctx)` recibe el transporte del modelo resuelto en `ctx.modelProvider`. Dos datos sin secretos y gestionados por el proveedor describen la ruta seleccionada:

- `runtimePolicy.compatibleIds` enumera los ids de runtime que el proveedor declara compatibles con esa ruta concreta. La ausencia de una política significa que el proveedor no declaró compatibilidad en el nivel de la ruta; no concede permiso para asumir que existe compatibilidad.
- `requestTransportOverrides: "none"` significa que no debe reproducirse ninguna sustitución de solicitud del proveedor/modelo definida expresamente. `"present"` significa que existen encabezados definidos expresamente, transporte de autenticación, proxy, TLS, comportamiento de servicio local o red privada, o parámetros de solicitud. Este dato no expone esos valores.

Devuelva `{ supported: false, reason }` cuando el arnés no pueda reproducir el transporte preparado. No deduzca la compatibilidad leyendo la configuración sin procesar después de la selección. Cuando la preparación de la autenticación produzca varias rutas de reintento, un solo arnés debe admitirlas todas antes del envío. La selección implícita usa OpenClaw si ningún plugin puede gestionar el conjunto completo; una selección explícita o persistente de plugin genera un error de forma segura.

## Registrar un arnés

**Importación:** `openclaw/plugin-sdk/agent-harness`

```typescript
import type { AgentHarness } from "openclaw/plugin-sdk/agent-harness";
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

const myHarness: AgentHarness = {
  id: "my-harness",
  label: "Mi arnés de agente nativo",

  supports(ctx) {
    const routeSupportsHarness =
      ctx.modelProvider?.runtimePolicy?.compatibleIds.includes("my-harness") === true;
    const canReproduceRequest = ctx.modelProvider?.requestTransportOverrides !== "present";
    return ctx.provider === "my-provider" && routeSupportsHarness && canReproduceRequest
      ? { supported: true, priority: 100 }
      : { supported: false, reason: "la ruta efectiva no es compatible con el arnés" };
  },

  async runAttempt(params) {
    // Inicie o reanude el hilo nativo.
    // Use params.prompt, params.tools, params.images, params.onPartialReply,
    // params.onAgentEvent y los demás campos del intento preparado.
    return await runMyNativeTurn(params);
  },
};

export default definePluginEntry({
  id: "my-native-agent",
  name: "Mi agente nativo",
  description: "Ejecuta los modelos seleccionados mediante un daemon de agente nativo.",
  register(api) {
    api.registerAgentHarness(myHarness);
  },
});
```

`authBootstrap` se omite intencionadamente en este ejemplo genérico. Añada `authBootstrap: "harness"` únicamente cuando el arnés cumpla el contrato anterior.

### Ejecución delegada

El propietario de un arnés puede establecer `delegatedExecutionPluginIds` con los ids de los plugins de confianza que necesiten ejecutar una sesión existente vinculada a un modelo, como un transporte de voz que continúe una conversación respaldada por Codex. Esto constituye consentimiento estático del propietario, no una lista de permitidos del núcleo. Manténgalo restringido.

Los delegados solo reciben la admisión del trabajo y la ejecución integrada. OpenClaw exige la clave de sesión almacenada exacta, la ruta del almacén y el id de sesión; `modelSelectionLocked:
true`; y valores `agentHarnessId` y `agentHarnessRuntimeOverride` coincidentes. A continuación, la ejecución se limita mediante el propietario del arnés. La creación, modificación, restablecimiento, eliminación y archivado de sesiones, así como las modificaciones del Gateway, siguen siendo exclusivas del propietario.

## Política de selección

OpenClaw elige un arnés después de resolver el proveedor/modelo:

1. La política de runtime con ámbito de modelo tiene prioridad.
2. La política de runtime con ámbito de proveedor se aplica a continuación.
3. `auto` pregunta a los arneses registrados si admiten la ruta efectiva resuelta. Los prefijos de proveedor/modelo por sí solos nunca seleccionan un arnés.
4. Si ningún arnés registrado coincide, OpenClaw usa su runtime integrado.

Los errores de los arneses de plugins se presentan como errores de ejecución. En el modo `auto`, el respaldo integrado solo se aplica cuando ningún arnés de plugin registrado admite el proveedor/modelo resuelto. Una vez que un arnés de plugin ha reclamado una ejecución, OpenClaw no vuelve a reproducir ese mismo turno mediante otro runtime, ya que esto podría cambiar la semántica de autenticación/runtime o duplicar efectos secundarios.

La política de runtime configurada sigue siendo la autoridad sobre el runtime deseado. Un `agentHarnessId` de sesión persistente conserva la propiedad de su transcripción nativa mientras la preparación de la ruta/autenticación sigue pendiente. Ninguno de ellos hace compatible una ruta incompatible: una vez que existen los datos preparados, el arnés seleccionado o fijado debe admitirlos, o la ejecución genera un error de forma segura. `/status` muestra el runtime efectivo seleccionado a partir de la política, la propiedad persistente y la compatibilidad de la ruta. El estado preparado es explícito: si falta `runtimePolicy`, permanece sin declarar en lugar de deducirse a partir de los campos de transporte que estén presentes. Cuando la autenticación gestionada por el arnés deja varias rutas físicas sin resolver, el dato de compatibilidad preparado es la intersección de sus ids de runtime compatibles e informa de sustituciones de solicitudes si algún candidato las tiene. Por tanto, un solo candidato sin declarar deja vacía la compatibilidad nativa; `preparedAuth.source: "harness"` es un propietario de autenticación, no un permiso para deducir la compatibilidad de la ruta.

Si el arnés seleccionado resulta inesperado, active el registro de depuración `agents/harness` e inspeccione el registro estructurado `agent harness selected` del Gateway: incluye el id del arnés seleccionado, el motivo de selección, la política de runtime/respaldo y, en el modo `auto`, el resultado de compatibilidad de cada plugin candidato.

El plugin Codex integrado registra `codex` como su id de arnés. El núcleo lo trata como un id de arnés de plugin ordinario; los alias específicos de Codex pertenecen al plugin o a la configuración del operador, no al selector de runtime compartido.

## Emparejamiento de proveedor y arnés

La mayoría de los arneses también deberían registrar un proveedor. El proveedor hace que las referencias de modelos, el estado de autenticación, los metadatos del modelo y la selección de `/model` sean visibles para el resto de OpenClaw. A continuación, el arnés reclama ese proveedor en `supports(...)`.

El plugin Codex integrado sigue este patrón:

- referencias de modelo preferidas por el usuario: `openai/gpt-5.6-sol`
- referencias de compatibilidad: las referencias heredadas `codex/gpt-*` siguen siendo aceptadas, pero las configuraciones nuevas no deberían usarlas como referencias normales de proveedor/modelo
- id del arnés: `codex`
- autenticación: disponibilidad sintética del proveedor, porque el arnés de Codex gestiona el inicio de sesión y la sesión nativos de Codex
- solicitud al servidor de aplicaciones: OpenClaw envía a Codex el id de modelo sin prefijos y permite que el arnés se comunique con el protocolo nativo del servidor de aplicaciones

El plugin Codex es aditivo. Con la política de runtime sin establecer o con `auto`, OpenAI solo puede seleccionar Codex cuando su contrato de ruta gestionado por el proveedor declara que `codex` es compatible: una ruta oficial HTTPS exacta de Platform Responses o ChatGPT Responses sin sustituciones de solicitudes definidas expresamente. El prefijo `openai/*` por sí solo nunca selecciona Codex. Los endpoints personalizados, los adaptadores de Completions y el comportamiento de solicitudes definido expresamente permanecen en OpenClaw. Los endpoints HTTP oficiales sin cifrar se rechazan. Las referencias antiguas `codex/gpt-*` siguen siendo entradas de compatibilidad. Consulte [Runtime de agente implícito de OpenAI](/es/providers/openai#implicit-agent-runtime).

Para obtener información sobre la configuración del operador, ejemplos de prefijos de modelos y configuraciones exclusivas de Codex, consulte [Arnés de Codex](/es/plugins/codex-harness).

El plugin Codex exige la versión mínima del servidor de aplicaciones documentada en [Arnés de Codex](/es/plugins/codex-harness). Comprueba el protocolo de enlace de inicialización y bloquea servidores antiguos o sin versión, de modo que OpenClaw solo se ejecute en la superficie de protocolo que ha probado.

### Middleware de resultados de herramientas

Los plugins integrados y los plugins instalados habilitados explícitamente que tengan contratos de manifiesto coincidentes pueden adjuntar middleware de resultados de herramientas independiente del runtime mediante `api.registerAgentToolResultMiddleware(...)` cuando su manifiesto declare los ids de runtime de destino en `contracts.agentToolResultMiddleware`. Esta interfaz de confianza sirve para transformaciones asíncronas de resultados de herramientas que deben ejecutarse antes de que OpenClaw o Codex vuelvan a proporcionar al modelo la salida de la herramienta.

Los plugins integrados heredados aún pueden usar
`api.registerCodexAppServerExtensionFactory(...)` para middleware exclusivo del servidor de aplicaciones de Codex,
pero las nuevas transformaciones de resultados deben usar la API independiente del entorno de ejecución. Se ha
eliminado el enlace `api.registerEmbeddedExtensionFactory(...)` exclusivo del ejecutor
integrado; las transformaciones de resultados de herramientas integradas deben usar middleware independiente del entorno de ejecución.

### Clasificación del resultado terminal

Los arneses nativos que gestionan su propia proyección de protocolo pueden usar
`classifyAgentHarnessTerminalOutcome(...)` de
`openclaw/plugin-sdk/agent-harness-runtime` cuando un turno completado no haya producido
texto visible del asistente. La función auxiliar devuelve `empty`, `reasoning-only` o
`planning-only` para que la política de respaldo de OpenClaw pueda decidir si se debe reintentar con un
modelo diferente. `planning-only` requiere el campo `planText` explícito
del arnés; OpenClaw no lo infiere de la prosa del asistente. La función auxiliar
deja intencionadamente sin clasificar los errores del prompt, los turnos en curso y las respuestas
deliberadamente silenciosas, como `NO_REPLY`.

### Efectos secundarios al finalizar el agente

Los arneses nativos deben llamar a `runAgentEndSideEffects(...)` desde
`openclaw/plugin-sdk/agent-harness-runtime` después de finalizar un intento. Esta función
despacha el enlace portátil `agent_end` y la captura de investigación de OpenClaw
sin retrasar las respuestas interactivas. Use `awaitAgentEndSideEffects(...)` para
ejecuciones locales no interactivas en las que el intento no deba resolverse hasta que finalicen esos
efectos secundarios. Ambas funciones auxiliares aceptan la misma carga útil `{ event, ctx }` que
`runAgentHarnessAgentEndHook(...)`; sus errores no alteran el resultado del intento
completado.

### Entrada del usuario y superficies de herramientas

Los arneses nativos que expongan una solicitud de entrada del usuario a nivel del entorno de ejecución deben usar las
funciones auxiliares de entrada del usuario de `openclaw/plugin-sdk/agent-harness-runtime` para dar formato
al prompt, entregarlo mediante la ruta de respuesta bloqueante de OpenClaw y normalizar
las respuestas de selección o de formato libre a la forma de respuesta nativa del entorno de ejecución. La
función auxiliar mantiene coherente la presentación en los canales y la TUI, mientras que cada arnés conserva
su propio análisis del protocolo y el ciclo de vida de las solicitudes pendientes.

Los arneses nativos que necesiten un enrutamiento compacto de herramientas similar al de PI deben usar
`createAgentHarnessToolSurfaceRuntime(...)` de
`openclaw/plugin-sdk/agent-harness-tool-runtime`. Esta función gestiona
la selección de controles de búsqueda de herramientas y modo de código, los valores predeterminados ligeros para modelos locales,
el filtrado de esquemas compatible con el entorno de ejecución, la ejecución oculta del catálogo, la
hidratación de directorios y la limpieza del catálogo. Los arneses siguen gestionando su conversión de herramientas
específica del SDK y la devolución de llamada de ejecución nativa.

### Modo de arnés nativo de Codex

El arnés integrado `codex` es el modo nativo de Codex para los turnos de agente
integrados de OpenClaw. Primero habilite el plugin integrado `codex` e incluya `codex` en
`plugins.allow` si la configuración usa una lista de permitidos restrictiva. Las configuraciones nativas del servidor de aplicaciones
deben usar `openai/gpt-*`; los turnos del agente de OpenAI seleccionan el arnés de Codex
solo cuando la ruta efectiva declara compatibilidad con Codex. Las referencias heredadas a modelos de Codex
deben repararse con `openclaw doctor --fix`, y las referencias heredadas a modelos `codex/*`
se mantienen como alias de compatibilidad para el arnés nativo.

Cuando se ejecuta este modo, Codex gestiona el id. de hilo nativo, el comportamiento de reanudación,
Compaction y la ejecución del servidor de aplicaciones. OpenClaw sigue gestionando el canal de chat,
el reflejo visible de la transcripción, la política de herramientas, las aprobaciones, la entrega de medios y la selección
de sesiones. Use el proveedor/modelo `agentRuntime.id: "codex"` cuando necesite
demostrar que solo la ruta del servidor de aplicaciones de Codex puede asumir la ejecución. Los entornos de ejecución
explícitos de plugins se cierran ante errores; los fallos de selección y ejecución del servidor de aplicaciones de Codex
no se reintentan mediante otro entorno de ejecución.

## Rigurosidad del entorno de ejecución

De forma predeterminada, OpenClaw usa la política de entorno de ejecución de proveedor/modelo `auto`: los arneses de
plugins registrados pueden asumir rutas efectivas compatibles y el entorno de ejecución
integrado gestiona el turno cuando ninguno coincide. Un prefijo de proveedor/modelo por sí solo nunca
selecciona un arnés. Use un entorno de ejecución explícito de plugin para proveedor/modelo, como
`agentRuntime.id: "codex"`, cuando la ausencia de selección de arnés deba provocar un error en lugar
de enrutar mediante el entorno de ejecución integrado. La selección explícita no vuelve
compatible una ruta incompatible. Los fallos de los arneses de plugins seleccionados siempre provocan
un error definitivo. Esto no bloquea un `agentRuntime.id: "openclaw"` explícito
de proveedor/modelo.

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

Si desea un backend de CLI para un modelo canónico, coloque el entorno de ejecución en esa
entrada de modelo:

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

Las sustituciones por agente usan la misma estructura limitada al modelo:

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

Con un entorno de ejecución explícito de plugin, una sesión falla de forma anticipada cuando el arnés solicitado
no está registrado, no admite el proveedor/modelo resuelto o
falla antes de producir efectos secundarios del turno. Esto es intencionado para implementaciones exclusivas de Codex
y para pruebas en vivo que deban demostrar que la ruta del servidor de aplicaciones de Codex
está realmente en uso.

Esta configuración solo controla el arnés de agente integrado. No deshabilita
el enrutamiento de modelos específico del proveedor para imágenes, vídeo, música, TTS, PDF u otros medios.

## Sesiones nativas y reflejo de la transcripción

Un arnés puede conservar un id. de sesión nativo, un id. de hilo o un token de reanudación
del demonio. Mantenga esa vinculación asociada explícitamente con la sesión de OpenClaw y
siga reflejando en la transcripción de OpenClaw la salida del asistente y de las herramientas
visible para el usuario.

La transcripción de OpenClaw sigue siendo la capa de compatibilidad para:

- el historial de sesiones visible en el canal
- la búsqueda e indexación de transcripciones
- el cambio de vuelta al arnés integrado de OpenClaw en un turno posterior
- el comportamiento genérico de `/new`, `/reset` y eliminación de sesiones

Si el arnés almacena una vinculación complementaria, implemente `reset(...)` para que OpenClaw
pueda borrarla cuando se restablezca la sesión de OpenClaw propietaria.

## Resultados de herramientas y medios

El núcleo crea la lista de herramientas de OpenClaw y la pasa al
intento preparado. Cuando un arnés ejecuta una llamada dinámica a una herramienta, devuelva el resultado
de la herramienta mediante la estructura de resultados del arnés en lugar de enviar directamente los medios
al canal.

Esto mantiene las salidas de texto, imagen, vídeo, música, TTS, aprobación y herramientas de mensajería
en la misma ruta de entrega que las ejecuciones respaldadas por OpenClaw.

Establezca `AgentHarnessAttemptResult.hostOwnedToolMediaUrls` solo para artefactos nativos
que el entorno de ejecución de confianza del arnés haya creado y almacenado por sí mismo. Cada entrada también debe
aparecer en `toolMediaUrls`. Nunca incluya medios seleccionados por el modelo procedentes de herramientas dinámicas o
herramientas de OpenClaw. En las rutas `message_tool_only`, esta procedencia restringida permite
que los artefactos nativos del entorno de ejecución sobrevivan a la supresión de la respuesta de origen; se siguen aplicando la política
normal de envío y la admisión de salas del entorno.

### Resultados terminales de herramientas

`AgentHarnessAttemptParams.observeToolTerminal` es el acumulador de resultados terminales
gestionado por el host. Un arnés que ejecute herramientas dinámicas de OpenClaw o herramientas nativas
debe llamarlo cuando cada herramienta alcance un resultado terminal, antes de
finalizar el resultado del intento. Los arneses que no ejecutan herramientas no necesitan
llamarlo.

Informe de los hechos desde el límite de ejecución:

- Pase el id. de llamada del protocolo cuando exista, el nombre canónico de la herramienta y los
  argumentos que realmente llegaron a la herramienta después de la preparación o las reescrituras de enlaces.
- Establezca `executionStarted: false` cuando la validación, la aprobación u otra protección
  haya detenido la llamada antes de que comenzara la implementación de la herramienta. Cuando exista la posibilidad de que el despacho
  se haya producido, informe de forma conservadora `true`.
- Informe `outcome: "success"` o `outcome: "failure"`. Incluya los campos estructurados
  de error disponibles en el entorno de ejecución en lugar de inferir el error a partir del
  texto mostrado.
- Use `nativeMutation` solo para herramientas nativas que no utilicen una definición de herramienta
  de OpenClaw. Proporcione allí los datos de mutación y repetición gestionados por el protocolo; no
  copie el clasificador de mutaciones de OpenClaw en el arnés.

La devolución de llamada devuelve la resolución canónica para esa llamada. Transfiera su
`lastToolError` a `AgentHarnessAttemptResult` y use sus datos de ejecución,
argumentos y efectos secundarios en la proyección del arnés en lugar de derivar
un estado paralelo. El host mantiene un fallo de mutación sin resolver entre herramientas correctas
no relacionadas y solo lo borra después de que la acción correspondiente se complete correctamente.

La devolución de llamada sigue siendo opcional para mantener la compatibilidad del código fuente con arneses experimentales
anteriores. Opcional no significa prescindible para un arnés que ejecuta herramientas:
sin informes terminales, OpenClaw no puede conservar la veracidad de los fallos de herramientas de mutación
entre llamadas posteriores a herramientas, incluida la finalización silenciosa de Heartbeat.

## Limitaciones actuales

- La ruta pública de importación es genérica, pero algunos alias de tipos de intento/resultado
  aún conservan nombres heredados por compatibilidad.
- La instalación de arneses de terceros es experimental. Prefiera los plugins de proveedores
  hasta que necesite un entorno de ejecución de sesión nativo.
- Se admite el cambio de arnés entre turnos. No cambie de arnés en
  mitad de un turno después de que hayan comenzado las herramientas nativas, las aprobaciones, el texto del asistente o los envíos
  de mensajes.

## Temas relacionados

- [Descripción general del SDK](/es/plugins/sdk-overview)
- [Funciones auxiliares del entorno de ejecución](/es/plugins/sdk-runtime)
- [Plugins de proveedores](/es/plugins/sdk-provider-plugins)
- [Arnés de Codex](/es/plugins/codex-harness)
- [Proveedores de modelos](/es/concepts/model-providers)
