---
read_when:
    - Está modificando el entorno de ejecución del agente integrado o el registro del arnés
    - Se está registrando un entorno de agente desde un plugin incluido o de confianza
    - Debes comprender cómo se relaciona el plugin Codex con los proveedores de modelos
sidebarTitle: Agent Harness
summary: Superficie experimental del SDK para plugins que sustituyen el ejecutor de agentes integrado de bajo nivel
title: Plugins del entorno de agentes
x-i18n:
    generated_at: "2026-07-22T13:20:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: b672b30cae9071049d6714477ec70a5196aea447f44c3492a5c23310a5e4de2a
    source_path: plugins/sdk-agent-harness.md
    workflow: 16
---

Un **harness de agente** es el ejecutor de bajo nivel para un turno preparado de un agente de OpenClaw. No es un proveedor de modelos, ni un canal, ni un registro de herramientas. Para conocer el modelo mental orientado al usuario, consulte [Runtimes de agentes](/es/concepts/agent-runtimes).

Utilice esta superficie solo para plugins nativos incluidos o de confianza. El contrato sigue siendo experimental porque los tipos de parámetros reflejan intencionadamente el ejecutor integrado actual.

## Cuándo utilizar un harness

Registre un harness de agente cuando una familia de modelos tenga su propio runtime de sesión nativo y el transporte normal de proveedores de OpenClaw sea la abstracción incorrecta:

- un servidor nativo de agente de programación que administra hilos y Compaction
- una CLI o un daemon local que debe transmitir eventos nativos de planificación, razonamiento y herramientas
- un runtime de modelo que necesita su propio identificador de reanudación además de la transcripción de sesión de OpenClaw

**No** registre un harness únicamente para añadir una nueva API de LLM. Para las API de modelos HTTP o WebSocket normales, cree un [plugin de proveedor](/es/plugins/sdk-provider-plugins).

## Lo que sigue administrando el núcleo

Antes de seleccionar un harness, OpenClaw ya ha resuelto:

- el proveedor y el modelo
- el estado de autenticación del runtime, salvo que el harness declare que administra la inicialización de la autenticación
- el nivel de razonamiento y el presupuesto de contexto
- el archivo de transcripción o sesión de OpenClaw
- el espacio de trabajo, el entorno aislado y la política de herramientas
- las funciones de retorno de llamada para respuestas del canal y transmisión
- la política de respaldo de modelos y cambio de modelo en vivo

Un harness ejecuta un intento preparado; no selecciona proveedores, sustituye la entrega por canales ni cambia de modelo de forma silenciosa.

### Inicialización de autenticación administrada por el harness

De manera predeterminada, el núcleo resuelve las credenciales del proveedor antes de llamar a un harness. Un harness de confianza que pueda autenticarse mediante su propio runtime nativo puede establecer
`authBootstrap: "harness"` en su registro estático `AgentHarness`. El núcleo omite entonces la inicialización genérica de credenciales del proveedor y el fallo por credenciales ausentes en cada intento reclamado por ese harness.

El núcleo sigue reenviando un perfil de autenticación de OpenClaw compatible, seleccionado u ordenado explícitamente, y su almacén con ámbito definido cuando existe. El harness debe resolver ese perfil o sus credenciales nativas antes de emitir solicitudes al modelo, mantener los secretos limitados al intento y mostrar fallos de autenticación que permitan tomar medidas. No establezca esta capacidad en un harness que solo administre la autenticación algunas veces.

### Artefactos de runtime de configuración verificados

Un harness local que pueda proporcionar inferencia para la configuración inicial debe certificar la implementación que completó la prueba. Cuando
`params.captureRuntimeArtifact` sea verdadero, devuelva un
`result.runtimeArtifact` opaco con un identificador estable y una huella digital del contenido. Registre una capacidad `runtimeArtifact.validate(...)` correspondiente que vuelva a comprobar esa vinculación sin cargar otro harness ni examinar plugins no relacionados.

Las continuaciones verificadas de OpenClaw también transfieren `params.expectedRuntimeArtifact`.
El harness debe compararlo con el proceso nativo exacto que adquirió y producir un fallo antes de iniciar o reanudar un hilo nativo si difieren. Los turnos de agente ordinarios omiten ambos campos, por lo que el hash del contenido permanece fuera de la ruta crítica normal de las solicitudes. Los harnesses remotos o WebSocket necesitan un contrato de certificación del servidor antes de poder participar; una cadena de versión por sí sola no constituye la identidad de un artefacto.

El intento preparado también incluye `params.runtimePlan`, un conjunto de políticas administrado por OpenClaw para las decisiones de runtime que deben mantenerse compartidas entre OpenClaw y los harnesses nativos:

- `runtimePlan.tools.normalize(...)` y `runtimePlan.tools.logDiagnostics(...)`
  para la política de esquemas de herramientas que tiene en cuenta al proveedor
- `runtimePlan.transcript.resolvePolicy(...)` para la depuración de transcripciones y
  la política de reparación de llamadas a herramientas
- `runtimePlan.delivery.isSilentPayload(...)` para la supresión compartida de `NO_REPLY` y de la entrega
  de contenido multimedia
- `runtimePlan.outcome.classifyRunResult(...)` para la clasificación del respaldo
  de modelos
- `runtimePlan.observability` para los metadatos resueltos del proveedor, modelo y harness

Los harnesses pueden utilizar el plan para tomar decisiones que deban coincidir con el comportamiento de OpenClaw, pero deben tratarlo como estado del intento administrado por el host: no deben modificarlo ni utilizarlo para cambiar de proveedor o modelo dentro de un turno.

### Contrato de transporte de solicitudes

`supports(ctx)` recibe el transporte del modelo resuelto en `ctx.modelProvider`.
Dos datos sin secretos y administrados por el proveedor describen la ruta seleccionada:

- `runtimePolicy.compatibleIds` enumera los identificadores de runtime que el proveedor declara
  compatibles con esa ruta concreta. La ausencia de una política significa que el proveedor no
  declaró compatibilidad en el nivel de la ruta; no concede permiso para suponer que existe.
- `requestTransportOverrides: "none"` significa que no es necesario reproducir ninguna anulación
  de solicitud creada para el proveedor o modelo. `"present"` significa que existen encabezados creados,
  transporte de autenticación, proxy, TLS, comportamiento de servicios locales o redes privadas, o parámetros
  de solicitud. El dato no expone esos valores.

Devuelva `{ supported: false, reason }` cuando el harness no pueda reproducir el transporte preparado. No deduzca la compatibilidad leyendo la configuración sin procesar después de la selección. Cuando la preparación de la autenticación genere varias rutas de reintento, un único harness debe admitirlas todas antes de la distribución. La selección implícita utiliza OpenClaw si ningún plugin puede administrar el conjunto completo; una selección explícita o persistente de un plugin produce un fallo seguro.

## Registrar un harness

**Importación:** `openclaw/plugin-sdk/agent-harness`

```typescript
import type { AgentHarness } from "openclaw/plugin-sdk/agent-harness";
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

const myHarness: AgentHarness = {
  id: "my-harness",
  label: "Mi harness de agente nativo",

  supports(ctx) {
    const routeSupportsHarness =
      ctx.modelProvider?.runtimePolicy?.compatibleIds.includes("my-harness") === true;
    const canReproduceRequest = ctx.modelProvider?.requestTransportOverrides !== "present";
    return ctx.provider === "my-provider" && routeSupportsHarness && canReproduceRequest
      ? { supported: true, priority: 100 }
      : { supported: false, reason: "la ruta efectiva no es compatible con el harness" };
  },

  async runAttempt(params) {
    // Inicie o reanude el hilo nativo.
    // Utilice params.prompt, params.tools, params.images, params.onPartialReply,
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

`authBootstrap` se omite intencionadamente en este ejemplo genérico. Añada
`authBootstrap: "harness"` únicamente cuando el harness cumpla el contrato anterior.

### Ejecución delegada

El propietario de un harness puede establecer `delegatedExecutionPluginIds` en los identificadores de plugins de confianza que necesiten ejecutar una sesión existente vinculada a un modelo, como un transporte de voz que continúe una conversación respaldada por Codex. Esto representa el consentimiento estático del propietario, no una lista de permitidos del núcleo. Mantenga su alcance limitado.

Los delegados solo reciben la admisión del trabajo y la ejecución integrada. OpenClaw exige la clave de sesión almacenada, la ruta del almacén y el identificador de sesión exactos; `modelSelectionLocked:
true`; y valores `agentHarnessId` y `agentHarnessRuntimeOverride` coincidentes.
La ejecución queda entonces delimitada mediante el propietario del harness. La creación, modificación, reinicio, eliminación y archivado de sesiones, así como la modificación del Gateway, permanecen restringidos al propietario.

## Política de selección

OpenClaw elige un harness después de resolver el proveedor y el modelo:

1. La política de runtime en el nivel del modelo tiene prioridad.
2. A continuación se aplica la política de runtime en el nivel del proveedor.
3. `auto` consulta a los harnesses registrados si admiten la ruta efectiva resuelta.
   Los prefijos de proveedor o modelo por sí solos nunca seleccionan un harness.
4. Si ningún harness registrado coincide, OpenClaw utiliza su runtime integrado.

Los fallos de los harnesses de plugins se presentan como fallos de ejecución. En el modo `auto`, el respaldo integrado solo se aplica cuando ningún harness de plugin registrado admite el proveedor o modelo resuelto. Una vez que un harness de plugin ha reclamado una ejecución, OpenClaw no vuelve a reproducir ese mismo turno mediante otro runtime, porque podría cambiar la semántica de autenticación o del runtime, o duplicar efectos secundarios.

La política de runtime configurada sigue siendo la autoridad sobre el runtime deseado. Un `agentHarnessId` de sesión persistente conserva la propiedad de su transcripción nativa mientras la preparación de la ruta y la autenticación sigue pendiente. Ninguno de los dos hace compatible una ruta incompatible: una vez que existen los datos preparados, el harness seleccionado o fijado debe admitirlos o la ejecución produce un fallo seguro. `/status` muestra el runtime efectivo seleccionado a partir de la política, la propiedad persistente y la compatibilidad de la ruta.
El estado preparado es explícito: si falta `runtimePolicy`, permanece sin declarar en lugar de deducirse a partir de los campos de transporte que estén presentes.
Cuando la autenticación administrada por el harness deja varias rutas físicas sin resolver, el dato de compatibilidad preparado es la intersección de sus identificadores de runtime compatibles e indica las anulaciones de solicitud si algún candidato las tiene. Por lo tanto, un solo candidato sin declarar hace que la compatibilidad nativa quede vacía; `preparedAuth.source: "harness"`
es un propietario de autenticación, no un permiso para deducir la compatibilidad de la ruta.

Si el harness seleccionado resulta inesperado, active el registro de depuración `agents/harness`
e inspeccione el registro estructurado `agent harness selected` del Gateway: incluye el identificador del harness seleccionado, el motivo de la selección, la política de runtime y respaldo y, en el modo `auto`, el resultado de compatibilidad de cada plugin candidato.

El plugin incluido de Codex registra `codex` como identificador de su harness. El núcleo lo trata como un identificador ordinario de harness de plugin; los alias específicos de Codex deben estar en el plugin o en la configuración del operador, no en el selector de runtime compartido.

## Emparejamiento de proveedor y harness

La mayoría de los harnesses también deberían registrar un proveedor. El proveedor hace que las referencias de modelos, el estado de autenticación, los metadatos del modelo y la selección de `/model` sean visibles para el resto de OpenClaw. A continuación, el harness reclama ese proveedor en `supports(...)`.

El plugin incluido de Codex sigue este patrón:

- referencias de modelo preferidas del usuario: `openai/gpt-5.6-sol`
- referencias de compatibilidad: las referencias heredadas `codex/gpt-*` siguen siendo aceptadas, pero las configuraciones nuevas no deberían utilizarlas como referencias normales de proveedor o modelo
- identificador del harness: `codex`
- autenticación: disponibilidad sintética del proveedor, porque el harness de Codex administra el inicio de sesión y la sesión nativos de Codex
- solicitud del servidor de aplicaciones: OpenClaw envía el identificador de modelo sin adornos a Codex y permite que el harness se comunique con el protocolo nativo del servidor de aplicaciones

El plugin de Codex es aditivo. Cuando la política de runtime no está establecida o es `auto`, OpenAI solo puede seleccionar Codex cuando su contrato de ruta administrado por el proveedor declare que `codex` es compatible: una ruta oficial exacta de Platform Responses o ChatGPT Responses mediante HTTPS, sin anulaciones de solicitud creadas. El prefijo `openai/*` por sí solo nunca selecciona Codex. Los endpoints personalizados, los adaptadores de Completions y el comportamiento de solicitudes creado permanecen en OpenClaw. Se rechazan los endpoints HTTP oficiales sin cifrar. Las referencias `codex/gpt-*` anteriores siguen siendo entradas de compatibilidad. Consulte
[Runtime de agente implícito de OpenAI](/es/providers/openai#implicit-agent-runtime).

Para la configuración del operador, ejemplos de prefijos de modelos y configuraciones exclusivas de Codex, consulte
[Harness de Codex](/es/plugins/codex-harness).

El plugin de Codex exige la versión mínima del servidor de aplicaciones documentada en
[Harness de Codex](/es/plugins/codex-harness). Comprueba el protocolo de enlace de inicialización y bloquea los servidores antiguos o sin versión, de modo que OpenClaw solo se ejecute con la superficie del protocolo que ha probado.

### Middleware de resultados de herramientas

Los plugins incluidos y los plugins instalados activados explícitamente cuyos contratos de manifiesto coincidan pueden adjuntar middleware de resultados de herramientas independiente del runtime mediante
`api.registerAgentToolResultMiddleware(...)` cuando su manifiesto declare los identificadores de runtime de destino en `contracts.agentToolResultMiddleware`. Esta interfaz de confianza sirve para transformaciones asíncronas de resultados de herramientas que deben ejecutarse antes de que OpenClaw o Codex vuelvan a suministrar al modelo la salida de la herramienta.

Los plugins heredados incluidos todavía pueden usar
`api.registerCodexAppServerExtensionFactory(...)` para middleware exclusivo del servidor de aplicaciones de Codex,
pero las nuevas transformaciones de resultados deben usar la API independiente del entorno de ejecución. Se ha
eliminado el hook `api.registerEmbeddedExtensionFactory(...)`, exclusivo del ejecutor integrado;
las transformaciones integradas de resultados de herramientas deben usar middleware independiente del entorno de ejecución.

### Clasificación del resultado terminal

Los arneses nativos que administran su propia proyección de protocolo pueden usar
`classifyAgentHarnessTerminalOutcome(...)` de
`openclaw/plugin-sdk/agent-harness-runtime` cuando un turno completado no produjo
texto visible del asistente. La función auxiliar devuelve `empty`, `reasoning-only` o
`planning-only` para que la política de respaldo de OpenClaw pueda decidir si reintentar con un
modelo diferente. `planning-only` requiere el campo `planText` explícito
del arnés; OpenClaw no lo infiere de la prosa del asistente. La función auxiliar
deja intencionadamente sin clasificar los errores de prompt, los turnos en curso y las
respuestas silenciosas intencionadas, como `NO_REPLY`.

### Efectos secundarios al finalizar el agente

Los arneses nativos deben llamar a `runAgentEndSideEffects(...)` desde
`openclaw/plugin-sdk/agent-harness-runtime` después de finalizar un intento. Esta función
despacha el hook portátil `agent_end` y la captura de investigación de OpenClaw
sin retrasar las respuestas interactivas. Use `awaitAgentEndSideEffects(...)` para
ejecuciones locales no interactivas en las que el intento no deba resolverse hasta que
finalicen esos efectos secundarios. Ambas funciones auxiliares aceptan la misma carga `{ event, ctx }` que
`runAgentHarnessAgentEndHook(...)`; sus fallos no alteran el resultado del
intento completado.

### Superficies de entrada del usuario y herramientas

Los arneses nativos que exponen una solicitud de entrada del usuario en el nivel del entorno de ejecución deben usar las
funciones auxiliares de entrada del usuario de `openclaw/plugin-sdk/agent-harness-runtime` para dar formato
al prompt, entregarlo mediante la ruta de respuesta bloqueante de OpenClaw y normalizar
las respuestas de selección o formato libre de vuelta a la forma de respuesta nativa del entorno de ejecución. La
función auxiliar mantiene coherente la presentación del canal y la TUI, mientras cada arnés conserva
su propio análisis del protocolo y ciclo de vida de solicitudes pendientes.

Los arneses nativos que necesitan un enrutamiento compacto de herramientas similar a PI deben usar
`createAgentHarnessToolSurfaceRuntime(...)` de
`openclaw/plugin-sdk/agent-harness-tool-runtime`. Esta función administra
la selección de controles de búsqueda de herramientas y modo de código, los valores predeterminados ligeros para modelos locales,
el filtrado de esquemas compatible con el entorno de ejecución, la ejecución oculta del catálogo, la
hidratación de directorios y la limpieza del catálogo. Los arneses siguen administrando su conversión de herramientas
específica del SDK y su callback de ejecución nativa.

### Modo de arnés nativo de Codex

El arnés `codex` incluido es el modo nativo de Codex para los turnos integrados del agente de OpenClaw.
Active primero el plugin `codex` incluido e incluya `codex` en
`plugins.allow` si la configuración usa una lista de permitidos restrictiva. Las configuraciones nativas del servidor de aplicaciones
deben usar `openai/gpt-*`; los turnos del agente de OpenAI seleccionan el arnés de Codex
solo cuando la ruta efectiva declara compatibilidad con Codex. Las referencias de modelos heredadas de Codex
deben repararse con `openclaw doctor --fix`, y las referencias de modelos `codex/*`
heredadas siguen siendo alias de compatibilidad para el arnés nativo.

Cuando se ejecuta este modo, Codex administra el identificador nativo del hilo, el comportamiento de reanudación,
la Compaction y la ejecución del servidor de aplicaciones. OpenClaw sigue administrando el canal de chat,
el reflejo visible de la transcripción, la política de herramientas, las aprobaciones, la entrega de medios y la selección
de sesiones. Use el proveedor/modelo `agentRuntime.id: "codex"` cuando sea necesario
demostrar que solo la ruta del servidor de aplicaciones de Codex puede asumir la ejecución. Los entornos de ejecución de plugins
explícitos se cierran ante fallos; los fallos de selección y de ejecución del servidor de aplicaciones de Codex
no se reintentan mediante otro entorno de ejecución.

## Rigurosidad del entorno de ejecución

De forma predeterminada, OpenClaw usa la política de entorno de ejecución del proveedor/modelo `auto`: los
arneses de plugins registrados pueden asumir rutas efectivas compatibles, y el entorno de ejecución
integrado gestiona el turno cuando ninguno coincide. Un prefijo de proveedor/modelo por sí solo nunca
selecciona un arnés. Use un entorno de ejecución de plugin explícito para el proveedor/modelo, como
`agentRuntime.id: "codex"`, cuando la ausencia de selección de arnés deba provocar un fallo
en lugar de enrutar mediante el entorno de ejecución integrado. La selección explícita no hace
compatible una ruta incompatible. Los fallos de los arneses de plugins seleccionados siempre provocan
un fallo definitivo. Esto no bloquea un `agentRuntime.id: "openclaw"`
explícito del proveedor/modelo.

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

Si se desea un backend de CLI para un modelo canónico, coloque el entorno de ejecución en la
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

Las sustituciones por agente usan la misma estructura con ámbito de modelo:

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

Con un entorno de ejecución de plugin explícito, una sesión falla anticipadamente cuando el arnés
solicitado no está registrado, no admite el proveedor/modelo resuelto o
falla antes de producir efectos secundarios del turno. Esto es intencionado para implementaciones
exclusivas de Codex y para pruebas en vivo que deben demostrar que la ruta del servidor de aplicaciones
de Codex está realmente en uso.

Esta opción solo controla el arnés integrado del agente. No desactiva
el enrutamiento de modelos específico del proveedor para imágenes, vídeo, música, TTS, PDF u otros tipos.

## Sesiones nativas y reflejo de la transcripción

Un arnés puede conservar un identificador de sesión nativo, un identificador de hilo o un token de reanudación
del lado del daemon. Mantenga esa vinculación asociada explícitamente con la sesión de OpenClaw y
siga reflejando la salida visible para el usuario del asistente y las herramientas en la
transcripción de OpenClaw.

La transcripción de OpenClaw sigue siendo la capa de compatibilidad para:

- historial de sesiones visible en el canal
- búsqueda e indexación de transcripciones
- volver al arnés integrado de OpenClaw en un turno posterior
- comportamiento genérico de `/new`, `/reset` y eliminación de sesiones

Si el arnés almacena una vinculación auxiliar, implemente `reset(...)` para que OpenClaw
pueda borrarla cuando se restablezca la sesión de OpenClaw propietaria.

## Resultados de herramientas y medios

El núcleo construye la lista de herramientas de OpenClaw y la pasa al
intento preparado. Cuando un arnés ejecuta una llamada dinámica a una herramienta, devuelva el resultado
de la herramienta mediante la estructura de resultados del arnés en lugar de enviar directamente los medios
del canal.

Esto mantiene las salidas de texto, imagen, vídeo, música, TTS, aprobación y herramientas de mensajería
en la misma ruta de entrega que las ejecuciones respaldadas por OpenClaw.

Establezca `AgentHarnessAttemptResult.hostOwnedToolMediaUrls` solo para artefactos nativos
que el entorno de ejecución de confianza del arnés haya creado y persistido por sí mismo. Cada entrada también
debe aparecer en `toolMediaUrls`. Nunca incluya medios de herramientas dinámicas seleccionadas por el modelo ni
de herramientas de OpenClaw. En las rutas `message_tool_only`, esta procedencia limitada permite que
los artefactos del entorno de ejecución nativo sobrevivan a la supresión de la respuesta de origen; siguen aplicándose
la política normal de envío y la admisión de salas ambientales.

### Resultados terminales de herramientas

`AgentHarnessAttemptParams.observeToolTerminal` es el acumulador de resultados
terminales administrado por el host. Un arnés que ejecute herramientas dinámicas de OpenClaw o herramientas
nativas debe llamarlo cuando cada herramienta alcance un resultado terminal, antes de que
se finalice el resultado del intento. Los arneses que no ejecutan herramientas no necesitan
llamarlo.

Informe los hechos desde el límite de ejecución:

- Pase el identificador de llamada del protocolo cuando exista, el nombre canónico de la herramienta y los
  argumentos que realmente llegaron a la herramienta después de la preparación o las reescrituras de hooks.
- Establezca `executionStarted: false` cuando la validación, la aprobación u otra protección
  haya detenido la llamada antes de que comenzara la implementación de la herramienta. Una vez que el despacho
  pueda haber ocurrido, informe `true` de forma conservadora.
- Informe `outcome: "success"` o `outcome: "failure"`. Incluya los campos estructurados
  de fallo disponibles en el entorno de ejecución, en lugar de inferir el fallo a partir del
  texto mostrado.
- Use `nativeMutation` solo para herramientas nativas que no usen una definición de herramienta
  de OpenClaw. Proporcione allí los hechos de mutación y repetición administrados por el protocolo; no
  copie el clasificador de mutaciones de OpenClaw en el arnés.

El callback devuelve la resolución canónica de esa llamada. Transfiera su
`lastToolError` a `AgentHarnessAttemptResult` y use sus hechos de ejecución,
argumentos y efectos secundarios en la proyección del arnés, en lugar de derivar
un estado paralelo. El host conserva un fallo mutante sin resolver ante herramientas
exitosas no relacionadas y lo borra solo después de que la acción correspondiente se complete correctamente.

El callback sigue siendo opcional para mantener la compatibilidad del código fuente con arneses experimentales
anteriores. Opcional no significa prescindible para un arnés que ejecuta herramientas:
sin informes terminales, OpenClaw no puede preservar la veracidad de un fallo de herramienta mutante
entre llamadas posteriores a herramientas, incluida la finalización silenciosa de un Heartbeat.

### Finalización de herramientas resueltas

OpenClaw puede necesitar una última respuesta visible después de que un arnés haya completado todas
las llamadas a herramientas, pero su turno nativo haya terminado sin texto del asistente. Un arnés puede optar
por esa recuperación implementando `finalizeSettledTurn({ attempt,
settledAttempt })`.

El callback es una capacidad independiente, no otro intento ordinario. Debe:

- usar la transcripción nativa restringida exacta o una transcripción completa de la aplicación
  inmovilizada hasta el límite del resultado de herramienta resuelto;
- no exponer herramientas, capacidades para conceder permisos o solicitar entrada del usuario, hooks de ejecución
  nativa, agentes, Skills, memoria, programación, extensiones ni control remoto;
- enviar únicamente el prompt de finalización proporcionado por el host; y
- cerrarse ante fallos si la estrategia seleccionada de transcripción o aislamiento no puede aplicar
  esas restricciones.

OpenClaw invoca el callback una vez como suboperación terminal, fuera del
intento ordinario y del bucle de reintentos. Un fallo finaliza la ejecución con la
advertencia de turno incompleto que tiene en cuenta los efectos secundarios; no puede entrar en rutas ordinarias de
rotación de autenticación/perfiles, respaldo de modelos, recuperación de contexto, continuación de
Compaction ni revisión solicitada por hooks. La finalización también omite la mutación del prompt por plugins,
`before_agent_run`, la entrada/salida del LLM, la revisión terminal y
los hooks `agent_end`. Los diagnósticos del núcleo siguen registrando la operación y su fallo.

El callback devuelve `AgentHarnessSettledTurnFinalizationResult`, no un
resultado de intento ordinario. Sus campos públicos se limitan al mensaje completado
del asistente, el uso de la llamada de finalización, los metadatos de propiedad de la transcripción y
el seguimiento de diagnóstico. El estado de herramientas, entrega, medios, creación, ciclo de vida, repetición, sesión y
respaldo no puede atravesar este límite de resultados. Los campos desconocidos y las llamadas del asistente
a herramientas provocan un cierre ante fallos.

Un arnés que reutilice internamente su motor completo de intentos puede llamar a
`projectSettledTurnFinalizationAttemptResult(...)` antes de devolver el resultado. La función auxiliar
rechaza evidencias canónicas de fallo, herramientas, entrega, repetición y ciclo de vida, y después
proyecta únicamente el resultado limitado. Es una defensa en profundidad posterior al aislamiento nativo,
no un sustituto de eliminar la superficie de capacidades nativas.

Un arnés basado en proyecciones debe colocar el contexto completo en
`settledAttempt.settledTurnFinalizationContext` con
`source: "openclaw-transcript"`. Debe capturar la rama activa después de que se
refleje el turno resuelto, demostrar que el prompt actual y cada llamada y resultado actuales de herramientas
están presentes hasta ese límite, e inmovilizar la matriz de mensajes resultante
antes de devolver el intento. El finalizador debe rechazar cualquier contexto ausente,
no compatible, ambiguo o excesivamente grande. No debe truncar mensajes,
eliminar historial anterior ni describir esta transcripción de la aplicación como historial nativo
exacto. Los arneses que reanudan una sesión nativa restringida no necesitan este
campo de proyección.

No implemente este callback llamando a `runAttempt` con una sugerencia
`disableTools` basada en el mejor esfuerzo. El propietario del arnés debe aplicar el límite completo
de capacidades nativas. OpenClaw no proporciona un respaldo genérico porque
no puede certificar que un entorno de ejecución nativo arbitrario haya respetado esas restricciones.

El callback sigue siendo opcional para mantener la compatibilidad con harnesses experimentales de terceros. Cuando el harness seleccionado lo omite, OpenClaw conserva el error existente de turno incompleto en lugar de arriesgarse a repetir efectos secundarios.

## Limitaciones actuales

- La ruta pública de importación es genérica, pero algunos alias de tipos de intento/resultado
  aún conservan nombres heredados por compatibilidad.
- La instalación de harnesses de terceros es experimental. Se recomienda utilizar plugins de proveedor
  hasta que se necesite un entorno de ejecución de sesiones nativo.
- Se admite el cambio de harness entre turnos. No se debe cambiar de harness
  en mitad de un turno una vez que hayan comenzado las herramientas nativas, las aprobaciones, el texto del asistente o los envíos
  de mensajes.

## Contenido relacionado

- [Descripción general del SDK](/es/plugins/sdk-overview)
- [Ayudantes del entorno de ejecución](/es/plugins/sdk-runtime)
- [Plugins de proveedor](/es/plugins/sdk-provider-plugins)
- [Harness de Codex](/es/plugins/codex-harness)
- [Proveedores de modelos](/es/concepts/model-providers)
