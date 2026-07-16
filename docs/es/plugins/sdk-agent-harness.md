---
read_when:
    - Está cambiando el runtime del agente integrado o el registro del entorno de ejecución
    - Se está registrando un entorno de agente desde un plugin incluido o de confianza
    - Debe comprender cómo se relaciona el plugin Codex con los proveedores de modelos.
sidebarTitle: Agent Harness
summary: Superficie experimental del SDK para plugins que reemplazan el ejecutor de agentes integrado de bajo nivel
title: Plugins del entorno de agentes
x-i18n:
    generated_at: "2026-07-16T11:55:21Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 862d53022e48b93c98e98162f76460433b76005cba3188342d0977b951044106
    source_path: plugins/sdk-agent-harness.md
    workflow: 16
---

Un **arnés de agente** es el ejecutor de bajo nivel de un turno preparado de un
agente de OpenClaw. No es un proveedor de modelos, ni un canal, ni un registro
de herramientas. Para consultar el modelo mental orientado al usuario, véase
[Entornos de ejecución de agentes](/es/concepts/agent-runtimes).

Use esta superficie únicamente para plugins nativos integrados o de confianza.
El contrato sigue siendo experimental porque los tipos de parámetros reflejan
intencionadamente el ejecutor integrado actual.

## Cuándo usar un arnés

Registre un arnés de agente cuando una familia de modelos tenga su propio
entorno de ejecución de sesiones nativo y el transporte normal de proveedores
de OpenClaw sea una abstracción inadecuada:

- un servidor nativo de agente de programación que gestione los hilos y la Compaction
- una CLI o un daemon local que deba transmitir eventos nativos de planificación, razonamiento y herramientas
- un entorno de ejecución de modelos que necesite su propio identificador de reanudación además de la
  transcripción de la sesión de OpenClaw

**No** registre un arnés solo para añadir una API de LLM nueva. Para las API
normales de modelos mediante HTTP o WebSocket, cree un
[Plugin de proveedor](/es/plugins/sdk-provider-plugins).

## Qué sigue gestionando el núcleo

Antes de seleccionar un arnés, OpenClaw ya ha resuelto:

- el proveedor y el modelo
- el estado de autenticación del entorno de ejecución, salvo que el arnés declare que gestiona la inicialización de la autenticación
- el nivel de razonamiento y el presupuesto de contexto
- el archivo de transcripción o sesión de OpenClaw
- el espacio de trabajo, el entorno aislado y la política de herramientas
- las funciones de retorno de respuesta del canal y las funciones de retorno de transmisión
- la política de respaldo de modelos y cambio de modelo en vivo

Un arnés ejecuta un intento preparado; no selecciona proveedores, no sustituye
la entrega del canal ni cambia de modelo de forma silenciosa.

### Inicialización de autenticación gestionada por el arnés

De forma predeterminada, el núcleo resuelve las credenciales del proveedor
antes de llamar a un arnés. Un arnés de confianza que pueda autenticarse
mediante su propio entorno de ejecución nativo puede establecer
`authBootstrap: "harness"` en su registro estático `AgentHarness`. El núcleo omite
entonces la inicialización genérica de credenciales del proveedor y el error
por falta de credenciales en cada intento reclamado por ese arnés.

El núcleo sigue remitiendo un perfil de autenticación de OpenClaw compatible,
seleccionado u ordenado explícitamente, y su almacén con ámbito definido cuando
existen. El arnés debe resolver ese perfil o sus credenciales nativas antes de
emitir solicitudes al modelo, mantener los secretos limitados al intento y
mostrar errores de autenticación que permitan actuar. No establezca esta
capacidad en un arnés que solo gestione la autenticación algunas veces.

### Artefactos verificados del entorno de ejecución de configuración

Un arnés local que pueda proporcionar inferencia durante la configuración
inicial debe certificar la implementación que completó la comprobación. Cuando
`params.captureRuntimeArtifact` sea verdadero, devuelva un
`result.runtimeArtifact` opaco con un identificador estable y una huella digital del
contenido. Registre una capacidad `runtimeArtifact.validate(...)` correspondiente que vuelva
a comprobar esa vinculación sin cargar otro arnés ni examinar plugins no
relacionados.

Las continuaciones verificadas de OpenClaw también proporcionan
`params.expectedRuntimeArtifact`. El arnés debe compararlo con el proceso nativo exacto que
haya adquirido y fallar antes de iniciar o reanudar un hilo nativo si no
coinciden. Los turnos normales del agente omiten ambos campos, por lo que el
cálculo de hashes de contenido queda fuera de la ruta crítica de solicitudes
normal. Los arneses remotos o mediante WebSocket necesitan un contrato de
certificación del servidor para poder participar; una cadena de versión por sí
sola no constituye la identidad de un artefacto.

El intento preparado también incluye `params.runtimePlan`, un conjunto de
políticas gestionado por OpenClaw para las decisiones del entorno de ejecución
que deben mantenerse compartidas entre OpenClaw y los arneses nativos:

- `runtimePlan.tools.normalize(...)` y `runtimePlan.tools.logDiagnostics(...)`
  para la política del esquema de herramientas que tiene en cuenta al proveedor
- `runtimePlan.transcript.resolvePolicy(...)` para la limpieza de transcripciones y
  la política de reparación de llamadas a herramientas
- `runtimePlan.delivery.isSilentPayload(...)` para la supresión compartida de `NO_REPLY` y de la
  entrega de contenido multimedia
- `runtimePlan.outcome.classifyRunResult(...)` para la clasificación del
  respaldo de modelos
- `runtimePlan.observability` para los metadatos resueltos del proveedor, modelo y arnés

Los arneses pueden usar el plan para decisiones que deban coincidir con el
comportamiento de OpenClaw, pero deben tratarlo como estado del intento
gestionado por el host: no deben modificarlo ni usarlo para cambiar de
proveedor o modelo dentro de un turno.

### Contrato de transporte de solicitudes

`supports(ctx)` recibe el transporte del modelo resuelto en
`ctx.modelProvider`. Dos datos sin secretos y gestionados por el proveedor
describen la ruta seleccionada:

- `runtimePolicy.compatibleIds` enumera los identificadores de entorno de ejecución que el proveedor declara
  compatibles con esa ruta concreta. La ausencia de una política significa que
  el proveedor no declaró compatibilidad en el nivel de la ruta; no autoriza a
  presuponer que existe compatibilidad.
- `requestTransportOverrides: "none"` significa que no es necesario reproducir ninguna
  sobrescritura de solicitud definida para el proveedor o modelo.
  `"present"` significa que existen cabeceras, transporte de
  autenticación, proxy, TLS, comportamiento de servicio local o red privada,
  o parámetros de solicitud definidos. Este dato no expone esos valores.

Devuelva `{ supported: false, reason }` cuando el arnés no pueda reproducir el transporte
preparado. No deduzca la compatibilidad leyendo la configuración sin procesar
después de la selección. Cuando la preparación de la autenticación produzca
varias rutas de reintento, un mismo arnés debe admitirlas todas antes del
despacho. La selección implícita usa OpenClaw si ningún Plugin puede gestionar
el conjunto completo; una selección de Plugin explícita o persistente se
rechaza de forma segura.

## Registrar un arnés

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

`authBootstrap` se omite intencionadamente en este ejemplo genérico. Añada
`authBootstrap: "harness"` solo cuando el arnés cumpla el contrato anterior.

### Ejecución delegada

El propietario de un arnés puede establecer `delegatedExecutionPluginIds` con los
identificadores de plugins de confianza que necesiten ejecutar una sesión
existente vinculada a un modelo, como un transporte de voz que continúe una
conversación respaldada por Codex. Se trata del consentimiento estático del
propietario, no de una lista de permitidos del núcleo. Manténgalo restringido.

Los delegados solo reciben la admisión del trabajo y la ejecución integrada.
OpenClaw exige la clave de sesión, la ruta del almacén y el identificador de
sesión almacenados exactos; `modelSelectionLocked:
true`; y valores coincidentes de
`agentHarnessId` y `agentHarnessRuntimeOverride`. A continuación, la ejecución queda
limitada mediante el propietario del arnés. La creación, modificación,
restablecimiento, eliminación y archivado de sesiones, así como las
modificaciones del Gateway, siguen estando reservadas al propietario.

## Política de selección

OpenClaw elige un arnés después de resolver el proveedor y el modelo:

1. La política del entorno de ejecución con ámbito de modelo tiene prioridad.
2. La política del entorno de ejecución con ámbito de proveedor ocupa el segundo lugar.
3. `auto` consulta a los arneses registrados si admiten la ruta efectiva
   resuelta. Los prefijos de proveedor o modelo por sí solos nunca seleccionan un arnés.
4. Si ningún arnés registrado coincide, OpenClaw usa su entorno de ejecución integrado.

Los errores de los arneses de plugins se muestran como errores de ejecución. En
el modo `auto`, el respaldo integrado solo se aplica cuando ningún
arnés de Plugin registrado admite el proveedor o modelo resuelto. Una vez que
un arnés de Plugin ha reclamado una ejecución, OpenClaw no vuelve a reproducir
ese mismo turno mediante otro entorno de ejecución, porque eso puede cambiar la
semántica de autenticación o del entorno de ejecución, o duplicar efectos
secundarios.

La política configurada del entorno de ejecución sigue siendo la autoridad
sobre el entorno deseado. Un `agentHarnessId` de sesión persistente conserva
la propiedad de su transcripción nativa mientras la preparación de la ruta o
la autenticación siga pendiente. Ninguno de ellos hace compatible una ruta
incompatible: una vez que existan los datos preparados, el arnés seleccionado
o fijado debe admitirlos o la ejecución se rechazará de forma segura.
`/status` muestra el entorno de ejecución efectivo seleccionado a
partir de la política, la propiedad persistente y la compatibilidad de la ruta.
El estado preparado es explícito: si falta `runtimePolicy`, permanece sin
declarar en lugar de deducirse de los campos de transporte que estén presentes.
Cuando la autenticación gestionada por el arnés deja sin resolver varias rutas
físicas, el dato de compatibilidad preparado es la intersección de sus
identificadores de entorno de ejecución compatibles e informa de las
sobrescrituras de solicitudes si algún candidato las tiene. Por tanto, un solo
candidato sin declarar deja vacía la compatibilidad nativa;
`preparedAuth.source: "harness"` es un propietario de autenticación, no un permiso para
deducir la compatibilidad de la ruta.

Si el arnés seleccionado resulta inesperado, active el registro de depuración
`agents/harness` e inspeccione el registro estructurado
`agent harness selected` del Gateway: incluye el identificador del arnés seleccionado,
el motivo de la selección, la política del entorno de ejecución y de respaldo
y, en el modo `auto`, el resultado de compatibilidad de cada
candidato de Plugin.

El Plugin integrado de Codex registra `codex` como identificador de
su arnés. El núcleo lo trata como un identificador ordinario de arnés de Plugin;
los alias específicos de Codex deben residir en el Plugin o en la configuración
del operador, no en el selector compartido del entorno de ejecución.

## Emparejamiento de proveedor y arnés

La mayoría de los arneses también deberían registrar un proveedor. El proveedor
hace visibles para el resto de OpenClaw las referencias de modelos, el estado
de autenticación, los metadatos de modelos y la selección
`/model`. Después, el arnés reclama ese proveedor en
`supports(...)`.

El Plugin integrado de Codex sigue este patrón:

- referencias de modelo preferidas por el usuario: `openai/gpt-5.6-sol`
- referencias de compatibilidad: las referencias heredadas `codex/gpt-*` siguen aceptándose, pero las
  configuraciones nuevas no deberían usarlas como referencias normales de proveedor o modelo
- identificador del arnés: `codex`
- autenticación: disponibilidad sintética del proveedor, porque el arnés de Codex gestiona
  el inicio de sesión y la sesión nativos de Codex
- solicitud al servidor de la aplicación: OpenClaw envía el identificador de modelo sin prefijo a Codex y permite que el
  arnés se comunique con el protocolo nativo del servidor de la aplicación

El Plugin de Codex es aditivo. Cuando la política del entorno de ejecución no
está definida o es `auto`, OpenAI solo puede seleccionar Codex
cuando el contrato de ruta gestionado por su proveedor declara compatible
`codex`: una ruta oficial exacta de Platform Responses o ChatGPT
Responses mediante HTTPS y sin sobrescrituras de solicitud definidas. El
prefijo `openai/*` por sí solo nunca selecciona Codex. Los endpoints
personalizados, los adaptadores de Completions y el comportamiento de
solicitudes definido permanecen en OpenClaw. Los endpoints HTTP oficiales sin
cifrar se rechazan. Las referencias `codex/gpt-*` anteriores siguen siendo
entradas de compatibilidad. Véase
[Entorno de ejecución implícito del agente de OpenAI](/es/providers/openai#implicit-agent-runtime).

Para la configuración del operador, los ejemplos de prefijos de modelos y las
configuraciones exclusivas de Codex, véase
[Arnés de Codex](/es/plugins/codex-harness).

El Plugin de Codex exige la versión mínima del servidor de la aplicación
documentada en [Arnés de Codex](/es/plugins/codex-harness). Comprueba el protocolo
de enlace de inicialización y bloquea los servidores antiguos o sin versión,
de modo que OpenClaw solo se ejecute sobre la superficie de protocolo que ha
probado.

### Middleware de resultados de herramientas

Los plugins integrados y los plugins instalados habilitados explícitamente con
contratos de manifiesto coincidentes pueden adjuntar middleware de resultados
de herramientas independiente del entorno de ejecución mediante
`api.registerAgentToolResultMiddleware(...)` cuando su manifiesto declare los identificadores de entorno
de ejecución de destino en `contracts.agentToolResultMiddleware`. Esta superficie de confianza se
destina a transformaciones asíncronas de resultados de herramientas que deben
ejecutarse antes de que OpenClaw o Codex devuelvan la salida de la herramienta
al modelo.

Los plugins integrados heredados aún pueden usar
`api.registerCodexAppServerExtensionFactory(...)` para middleware exclusivo del servidor de aplicaciones de Codex, pero las nuevas transformaciones de resultados deben usar la API neutral respecto al runtime. Se ha eliminado el hook `api.registerEmbeddedExtensionFactory(...)`, exclusivo del ejecutor integrado; las transformaciones de resultados de herramientas integradas deben usar middleware neutral respecto al runtime.

### Clasificación del resultado terminal

Los arneses nativos que gestionan su propia proyección de protocolo pueden usar
`classifyAgentHarnessTerminalOutcome(...)` de
`openclaw/plugin-sdk/agent-harness-runtime` cuando un turno completado no haya producido
texto visible del asistente. El auxiliar devuelve `empty`, `reasoning-only` o
`planning-only` para que la política de respaldo de OpenClaw pueda decidir si reintentar con un
modelo diferente. `planning-only` requiere el campo `planText` explícito
del arnés; OpenClaw no lo infiere de la prosa del asistente. El auxiliar
deja intencionadamente sin clasificar los errores del prompt, los turnos en curso y las respuestas
silenciosas intencionadas, como `NO_REPLY`.

### Efectos secundarios al finalizar el agente

Los arneses nativos deben llamar a `runAgentEndSideEffects(...)` desde
`openclaw/plugin-sdk/agent-harness-runtime` después de finalizar un intento. Este
despacha el hook portátil `agent_end` y la captura de investigación de OpenClaw
sin retrasar las respuestas interactivas. Use `awaitAgentEndSideEffects(...)` para
ejecuciones locales no interactivas en las que el intento no deba resolverse hasta que finalicen esos
efectos secundarios. Ambos auxiliares aceptan la misma carga útil `{ event, ctx }` que
`runAgentHarnessAgentEndHook(...)`; sus fallos no alteran el resultado del
intento completado.

### Entrada del usuario y superficies de herramientas

Los arneses nativos que expongan una solicitud de entrada del usuario a nivel de runtime deben usar los
auxiliares de entrada del usuario de `openclaw/plugin-sdk/agent-harness-runtime` para dar formato
al prompt, entregarlo mediante la ruta de respuesta bloqueante de OpenClaw y normalizar
las respuestas de selección o de formato libre de vuelta a la forma de respuesta nativa del runtime. El
auxiliar mantiene coherente la presentación del canal o la TUI, mientras cada arnés conserva su
propio análisis del protocolo y el ciclo de vida de las solicitudes pendientes.

Los arneses nativos que necesiten un enrutamiento compacto de herramientas similar a PI deben usar
`createAgentHarnessToolSurfaceRuntime(...)` de
`openclaw/plugin-sdk/agent-harness-tool-runtime`. Este gestiona
la selección de controles de búsqueda de herramientas y modo de código, los valores predeterminados ligeros para modelos locales,
el filtrado de esquemas compatible con el runtime, la ejecución oculta del catálogo, la
hidratación de directorios y la limpieza del catálogo. Los arneses siguen gestionando su conversión de herramientas
específica del SDK y la devolución de llamada de ejecución nativa.

### Modo de arnés nativo de Codex

El arnés integrado `codex` es el modo nativo de Codex para los turnos de agente
integrados de OpenClaw. Active primero el plugin integrado `codex` e incluya `codex` en
`plugins.allow` si la configuración utiliza una lista de permitidos restrictiva. Las configuraciones nativas del servidor de aplicaciones
deben usar `openai/gpt-*`; los turnos del agente OpenAI seleccionan el arnés de Codex
solo cuando la ruta efectiva declara compatibilidad con Codex. Las referencias heredadas de modelos de Codex
deben repararse con `openclaw doctor --fix`, y las referencias heredadas de modelos `codex/*`
siguen siendo alias de compatibilidad para el arnés nativo.

Cuando se ejecuta este modo, Codex gestiona el id. del hilo nativo, el comportamiento de reanudación,
Compaction y la ejecución del servidor de aplicaciones. OpenClaw sigue gestionando el canal de chat,
el reflejo visible de la transcripción, la política de herramientas, las aprobaciones, la entrega de contenido multimedia y la selección
de sesiones. Use el proveedor/modelo `agentRuntime.id: "codex"` cuando necesite
demostrar que solo la ruta del servidor de aplicaciones de Codex puede asumir la ejecución. Los runtimes de plugins
explícitos se cierran ante fallos; los fallos de selección y de runtime del servidor de aplicaciones de Codex
no se reintentan mediante otro runtime.

## Rigurosidad del runtime

De forma predeterminada, OpenClaw utiliza la política de runtime de proveedor/modelo `auto`: los arneses
de plugins registrados pueden asumir rutas efectivas compatibles, y el runtime integrado
gestiona el turno cuando ninguno coincide. Un prefijo de proveedor/modelo por sí solo nunca
selecciona un arnés. Use un runtime de plugin de proveedor/modelo explícito, como
`agentRuntime.id: "codex"`, cuando la ausencia de selección de arnés deba provocar un fallo en lugar
de enrutar mediante el runtime integrado. La selección explícita no convierte una
ruta incompatible en compatible. Los fallos de los arneses de plugins seleccionados siempre
provocan un fallo definitivo. Esto no bloquea un
`agentRuntime.id: "openclaw"` de proveedor/modelo explícito.

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

Si desea un backend de CLI para un modelo canónico, coloque el runtime en la
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

Las anulaciones por agente utilizan la misma forma con ámbito de modelo:

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

Los ejemplos heredados de runtime para todo el agente, como este, se ignoran:

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

Con un runtime de plugin explícito, una sesión falla de forma anticipada cuando el
arnés solicitado no está registrado, no admite el proveedor/modelo resuelto o
falla antes de producir efectos secundarios del turno. Esto es intencionado para despliegues
exclusivos de Codex y para pruebas en vivo que deben demostrar que la ruta del servidor de aplicaciones de Codex
se está utilizando realmente.

Esta configuración solo controla el arnés de agente integrado. No desactiva
el enrutamiento de modelos específico del proveedor para imágenes, vídeo, música, TTS, PDF u otros medios.

## Sesiones nativas y reflejo de la transcripción

Un arnés puede conservar un id. de sesión nativo, un id. de hilo o un token de reanudación
del lado del daemon. Mantenga esa vinculación asociada explícitamente con la sesión de OpenClaw y
siga reflejando la salida visible para el usuario del asistente y de las herramientas en la
transcripción de OpenClaw.

La transcripción de OpenClaw sigue siendo la capa de compatibilidad para:

- historial de sesiones visible en el canal
- búsqueda e indexación de transcripciones
- volver al arnés integrado de OpenClaw en un turno posterior
- comportamiento genérico de `/new`, `/reset` y eliminación de sesiones

Si el arnés almacena una vinculación auxiliar, implemente `reset(...)` para que OpenClaw
pueda borrarla cuando se restablezca la sesión de OpenClaw propietaria.

## Resultados de herramientas y contenido multimedia

El núcleo construye la lista de herramientas de OpenClaw y la pasa al
intento preparado. Cuando un arnés ejecuta una llamada dinámica a una herramienta, devuelva el resultado
de la herramienta mediante la forma de resultado del arnés, en lugar de enviar por su cuenta contenido multimedia
al canal.

Esto mantiene las salidas de texto, imagen, vídeo, música, TTS, aprobación y herramientas de mensajería
en la misma ruta de entrega que las ejecuciones respaldadas por OpenClaw.

### Resultados terminales de herramientas

`AgentHarnessAttemptParams.observeToolTerminal` es el acumulador de resultados
terminales gestionado por el host. Un arnés que ejecute herramientas dinámicas de OpenClaw o herramientas
nativas debe llamarlo cuando cada herramienta alcance un resultado terminal, antes de que se
finalice el resultado del intento. Los arneses que no ejecuten herramientas no necesitan
llamarlo.

Informe los hechos desde el límite de ejecución:

- Pase el id. de llamada del protocolo cuando exista, el nombre canónico de la herramienta y los
  argumentos que hayan llegado realmente a la herramienta después de la preparación o las reescrituras de hooks.
- Establezca `executionStarted: false` cuando la validación, la aprobación u otra protección
  haya detenido la llamada antes de que comenzara la implementación de la herramienta. Una vez que pueda
  haberse producido el despacho, informe `true` de forma conservadora.
- Informe `outcome: "success"` o `outcome: "failure"`. Incluya los campos estructurados
  de fallo disponibles en el runtime, en lugar de inferir el fallo a partir del
  texto mostrado.
- Use `nativeMutation` solo para herramientas nativas que no utilicen una definición de herramienta
  de OpenClaw. Proporcione allí los hechos de mutación y repetición gestionados por el protocolo; no
  copie el clasificador de mutaciones de OpenClaw en el arnés.

La devolución de llamada devuelve la resolución canónica de esa llamada. Transfiera su
`lastToolError` a `AgentHarnessAttemptResult` y use sus hechos de ejecución,
argumentos y efectos secundarios en la proyección del arnés, en lugar de derivar
un estado paralelo. El host conserva un fallo de mutación sin resolver a través de herramientas correctas
no relacionadas y solo lo borra después de que la acción correspondiente se complete correctamente.

La devolución de llamada sigue siendo opcional para mantener la compatibilidad del código fuente con arneses experimentales
anteriores. Opcional no significa prescindible para un arnés que ejecute herramientas:
sin informes terminales, OpenClaw no puede preservar la veracidad de los fallos de herramientas con mutaciones
a través de llamadas posteriores a herramientas, incluida la finalización silenciosa de Heartbeat.

## Limitaciones actuales

- La ruta pública de importación es genérica, pero algunos alias de tipos de intento/resultado
  aún conservan nombres heredados por compatibilidad.
- La instalación de arneses de terceros es experimental. Prefiera los plugins de proveedores
  hasta que necesite un runtime de sesión nativo.
- Se admite el cambio de arnés entre turnos. No cambie de arnés en
  mitad de un turno después de que hayan comenzado las herramientas nativas, las aprobaciones, el texto del asistente o los envíos
  de mensajes.

## Relacionado

- [Descripción general del SDK](/es/plugins/sdk-overview)
- [Auxiliares del runtime](/es/plugins/sdk-runtime)
- [Plugins de proveedores](/es/plugins/sdk-provider-plugins)
- [Arnés de Codex](/es/plugins/codex-harness)
- [Proveedores de modelos](/es/concepts/model-providers)
