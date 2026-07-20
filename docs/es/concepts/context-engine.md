---
read_when:
    - Quiere comprender cómo OpenClaw ensambla el contexto del modelo
    - Está alternando entre el motor heredado y un motor de Plugin
    - Está creando un plugin de motor de contexto
sidebarTitle: Context engine
summary: 'Motor de contexto: ensamblaje de contexto conectable, Compaction y ciclo de vida de subagentes'
title: Motor de contexto
x-i18n:
    generated_at: "2026-07-20T00:46:35Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 721780790dacebec44e3c7540b225bd853ee66bf5ae066b84df4344614d93a62
    source_path: concepts/context-engine.md
    workflow: 16
---

Un **motor de contexto** controla cómo OpenClaw construye el contexto del modelo para cada ejecución: qué mensajes incluir, cómo resumir el historial anterior y cómo gestionar el contexto entre los límites de los subagentes.

OpenClaw incluye un motor `legacy` integrado y lo utiliza de forma predeterminada. Instale y seleccione un motor de Plugin únicamente cuando desee un comportamiento diferente de ensamblaje, Compaction o recuperación entre sesiones.

## Inicio rápido

<Steps>
  <Step title="Comprobar qué motor está activo">
    ```bash
    openclaw doctor
    # o inspeccionar la configuración directamente:
    cat ~/.openclaw/openclaw.json | jq '.plugins.slots.contextEngine'
    ```
  </Step>
  <Step title="Instalar un motor de Plugin">
    Los plugins de motor de contexto se instalan como cualquier otro Plugin de OpenClaw.

    <Tabs>
      <Tab title="Desde npm">
        ```bash
        openclaw plugins install @martian-engineering/lossless-claw
        ```
      </Tab>
      <Tab title="Desde una ruta local">
        ```bash
        openclaw plugins install -l ./my-context-engine
        ```
      </Tab>
    </Tabs>

  </Step>
  <Step title="Habilitar y seleccionar el motor">
    ```json5
    // openclaw.json
    {
      plugins: {
        slots: {
          contextEngine: "lossless-claw", // debe coincidir con el id de motor registrado del Plugin
        },
        entries: {
          "lossless-claw": {
            enabled: true,
            // La configuración específica del Plugin se incluye aquí (consulte la documentación del Plugin)
          },
        },
      },
    }
    ```

    Reinicie el Gateway después de la instalación y configuración.

  </Step>
  <Step title="Volver al motor heredado (opcional)">
    Establezca `contextEngine` en `"legacy"` (o elimine la clave por completo; `"legacy"` es el valor predeterminado).
  </Step>
</Steps>

## Cómo funciona

Cada vez que OpenClaw ejecuta un prompt del modelo, el motor de contexto interviene en cuatro puntos del ciclo de vida:

<AccordionGroup>
  <Accordion title="1. Ingesta">
    Se llama cuando se añade un mensaje nuevo a la sesión. El motor puede almacenar o indexar el mensaje en su propio almacén de datos.
  </Accordion>
  <Accordion title="2. Ensamblaje">
    Se llama antes de cada ejecución del modelo. El motor devuelve un conjunto ordenado de mensajes (y un `systemPromptAddition` opcional) que se ajustan al presupuesto de tokens.
  </Accordion>
  <Accordion title="3. Compaction">
    Se llama cuando la ventana de contexto está llena o cuando se ejecuta `/compact`. El motor resume el historial anterior para liberar espacio.
  </Accordion>
  <Accordion title="4. Después del turno">
    Se llama después de que finaliza una ejecución. El motor puede conservar el estado, activar la Compaction en segundo plano o actualizar los índices.
  </Accordion>
</AccordionGroup>

Los motores también pueden implementar un método `maintain()` opcional para el mantenimiento de la transcripción (reescrituras seguras mediante `runtimeContext.rewriteTranscriptEntries()`) después del arranque, de un turno completado correctamente o de la Compaction. Establezca `info.turnMaintenanceMode: "background"` para ejecutarlo como trabajo diferido en lugar de bloquear la respuesta.

Para el entorno Codex no ACP incluido, OpenClaw aplica el mismo ciclo de vida proyectando el contexto ensamblado en las instrucciones de desarrollador de Codex y el prompt del turno actual. Codex sigue gestionando su propio historial nativo de hilos y su compactador nativo.

### Ciclo de vida de los subagentes (opcional)

OpenClaw llama a dos hooks opcionales del ciclo de vida de los subagentes:

<ParamField path="prepareSubagentSpawn" type="method">
  Prepara el estado de contexto compartido antes de que se inicie una ejecución secundaria. El hook recibe las claves de sesión primaria/secundaria, `contextMode` (`isolated` o `fork`), los ids/archivos de transcripción disponibles y un TTL opcional. Si devuelve un identificador de reversión, OpenClaw lo llama cuando la creación falla después de que la preparación se haya completado correctamente. Las creaciones de subagentes nativos que solicitan `lightContext` y se resuelven como `contextMode="isolated"` omiten intencionadamente este hook para que el subagente comience con el contexto de arranque ligero, sin estado previo a la creación gestionado por el motor de contexto.
</ParamField>
<ParamField path="onSubagentEnded" type="method">
  Realiza la limpieza cuando finaliza o se depura una sesión de subagente.
</ParamField>

### Adición al prompt del sistema

El método `assemble` puede devolver una cadena `systemPromptAddition`. OpenClaw la antepone al prompt del sistema de la ejecución. Esto permite a los motores inyectar orientación dinámica para la recuperación, instrucciones de búsqueda o indicaciones basadas en el contexto sin requerir archivos estáticos en el espacio de trabajo.

## El motor heredado

El motor `legacy` integrado conserva el comportamiento original de OpenClaw:

- **Ingesta**: no realiza ninguna operación (el gestor de sesiones se encarga directamente de conservar los mensajes).
- **Ensamblaje**: paso directo (el Pipeline existente de saneamiento → validación → limitación del entorno de ejecución se encarga del ensamblaje del contexto).
- **Compaction**: delega en la Compaction de resumen integrada, que crea un único resumen de los mensajes anteriores y mantiene intactos los mensajes recientes.
- **Después del turno**: no realiza ninguna operación.

El motor heredado no registra herramientas ni proporciona un `systemPromptAddition`.

Cuando no se establece ningún `plugins.slots.contextEngine` (o se establece en `"legacy"`), este motor se utiliza automáticamente.

## Motores de Plugin

Un Plugin puede registrar un motor de contexto mediante la API de plugins:

```ts
import { buildMemorySystemPromptAddition } from "openclaw/plugin-sdk/core";

export default function register(api) {
  api.registerContextEngine("my-engine", (ctx) => ({
    info: {
      id: "my-engine",
      name: "My Context Engine",
      ownsCompaction: true,
    },

    async ingest({ sessionId, message, isHeartbeat }) {
      // Almacenar el mensaje en el almacén de datos
      return { ingested: true };
    },

    async assemble({
      sessionId,
      sessionKey,
      messages,
      tokenBudget,
      availableTools,
      citationsMode,
    }) {
      // Devolver mensajes que se ajusten al presupuesto
      return {
        messages: buildContext(messages, tokenBudget),
        estimatedTokens: countTokens(messages),
        systemPromptAddition: buildMemorySystemPromptAddition({
          availableTools: availableTools ?? new Set(),
          citationsMode,
          agentSessionKey: sessionKey,
        }),
      };
    },

    async compact({ sessionId, force }) {
      // Resumir el contexto anterior
      return { ok: true, compacted: true };
    },
  }));
}
```

La fábrica `ctx` incluye valores opcionales `config`, `agentDir` y `workspaceDir`
para que los plugins puedan inicializar el estado por agente o por espacio de trabajo antes de la
primera llamada del ciclo de vida. Antes de una llamada no heredada a `assemble()`, el host completa
la preparación asíncrona registrada del prompt de memoria. El helper síncrono
`buildMemorySystemPromptAddition(...)` lee esa instantánea inmutable de la ejecución;
pase sin cambios el contexto proporcionado de herramientas, citas, agente y sesión.

A continuación, habilítelo en la configuración:

```json5
{
  plugins: {
    slots: {
      contextEngine: "my-engine",
    },
    entries: {
      "my-engine": {
        enabled: true,
      },
    },
  },
}
```

### La interfaz ContextEngine

Miembros obligatorios:

| Miembro             | Tipo     | Finalidad                                                  |
| ------------------ | -------- | -------------------------------------------------------- |
| `info`             | Propiedad | Id, nombre y versión del motor, y si este gestiona la Compaction |
| `ingest(params)`   | Método   | Almacenar un solo mensaje                                   |
| `assemble(params)` | Método   | Construir el contexto para una ejecución del modelo (devuelve `AssembleResult`) |
| `compact(params)`  | Método   | Resumir/reducir el contexto                                 |

`assemble` devuelve un `AssembleResult` con:

<ParamField path="messages" type="Message[]" required>
  Los mensajes ordenados que se enviarán al modelo.
</ParamField>
<ParamField path="estimatedTokens" type="number" required>
  La estimación del motor del total de tokens en el contexto ensamblado. OpenClaw la utiliza para decidir los umbrales de Compaction y generar informes de diagnóstico.
</ParamField>
<ParamField path="systemPromptAddition" type="string">
  Se antepone al prompt del sistema.
</ParamField>
<ParamField path="promptAuthority" type='"assembled" | "preassembly_may_overflow"'>
  Controla qué estimación de tokens utiliza el ejecutor para las comprobaciones
  preventivas de desbordamiento. El valor predeterminado es `"assembled"`, lo que significa que solo se comprueba la estimación
  del prompt ensamblado para los motores que no gestionan la Compaction.
  Los motores que establecen `ownsCompaction: true` gestionan su propia admisión de prompts,
  por lo que OpenClaw omite de forma predeterminada la comprobación genérica previa al prompt. Establezca
  `"preassembly_may_overflow"` únicamente cuando la vista ensamblada pueda ocultar el riesgo de
  desbordamiento en la transcripción subyacente; en ese caso, el ejecutor mantiene activa la
  comprobación genérica y toma el máximo entre la estimación ensamblada y la
  estimación previa al ensamblaje (sin ventana) del historial de la sesión al decidir si debe
  realizar la Compaction de forma preventiva. En cualquier caso, los mensajes devueltos siguen siendo los que
  ve el modelo; `promptAuthority` solo afecta a la comprobación previa.
</ParamField>
<ParamField path="contextProjection" type="ContextEngineProjection">
  Ciclo de vida de proyección opcional para hosts con hilos de backend persistentes (por ejemplo, el servidor de aplicaciones Codex). `mode: "thread_bootstrap"` con un `epoch` estable solicita al host que inyecte el contexto ensamblado una vez por época y reutilice el hilo de backend hasta que cambie la época, en lugar de volver a proyectarlo en cada turno. Omita este campo para la proyección normal por turno.
</ParamField>

`compact` devuelve un `CompactResult`. Cuando la Compaction cambia la identidad de la sesión activa,
`result.sessionTarget` (un `ContextEngineSessionTarget` tipado que contiene
la identidad de la sesión y el ámbito del almacén) identifica la sesión sucesora que deberá utilizar
el siguiente reintento o turno; `result.sessionId` refleja el id sucesor.

Miembros opcionales:

| Miembro                         | Tipo   | Finalidad                                                                                                                                      |
| ------------------------------ | ------ | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `bootstrap(params)`            | Método | Inicializar el estado del motor para una sesión. Se llama una vez cuando el motor detecta una sesión por primera vez (p. ej., al importar el historial).                              |
| `maintain(params)`             | Método | Mantenimiento de la transcripción después del arranque, de un turno completado correctamente o de la Compaction. Utilice `runtimeContext.rewriteTranscriptEntries()` para realizar reescrituras seguras. |
| `ingestBatch(params)`          | Método | Ingerir un turno completado como lote. Se llama después de que finaliza una ejecución, con todos los mensajes de ese turno a la vez.                                  |
| `afterTurn(params)`            | Método | Trabajo del ciclo de vida posterior a la ejecución (conservar el estado, activar la Compaction en segundo plano).                                                                      |
| `prepareSubagentSpawn(params)` | Método | Configurar el estado compartido de una sesión secundaria antes de que se inicie.                                                                                    |
| `onSubagentEnded(params)`      | Método | Realizar la limpieza después de que finaliza un subagente.                                                                                                              |
| `dispose()`                    | Método | Liberar recursos. Se llama durante el apagado del Gateway o la recarga del Plugin, no por sesión.                                                        |

### Configuración del entorno de ejecución

Los hooks del ciclo de vida que se ejecutan dentro de OpenClaw reciben un objeto
`runtimeSettings` opcional. Se trata de una superficie de API interna
versionada y de solo lectura entre productor y consumidor: OpenClaw la produce para el motor de contexto
seleccionado y el motor de contexto la consume dentro de los hooks del ciclo de vida. No se
representa directamente para los usuarios ni crea una superficie de informes específica.

- `schemaVersion`: actualmente `1`
- `runtime`: host de OpenClaw, modo de ejecución (`normal`, `fallback` o
  `degraded`) e identificadores opcionales del arnés o del entorno de ejecución
- `contextEngineSelection`: identificador del motor de contexto seleccionado y origen de la selección
- `executionHost`: identificador y etiqueta del host para la superficie que invoca el hook
- `model`: modelo solicitado, modelo resuelto, proveedor y familia de modelos opcional
- `limits`: presupuesto de tokens del prompt y máximo de tokens de salida cuando se conocen
- `diagnostics`: códigos de motivo del cierre por reserva y del estado degradado cuando se conocen

Los campos que pueden ser desconocidos se representan como `null`; los campos discriminadores,
como el modo de ejecución y el origen de la selección, no admiten valores nulos. Los motores antiguos siguen siendo
compatibles: si un motor heredado estricto rechaza `runtimeSettings` como una
propiedad desconocida, OpenClaw reintenta la llamada del ciclo de vida sin ella, en lugar de poner
el motor en cuarentena.

### Requisitos del host

Los motores de contexto pueden declarar requisitos de capacidades del host en `info.hostRequirements`.
OpenClaw comprueba estos requisitos antes de iniciar la operación y aplica un cierre seguro
con un error descriptivo cuando el entorno de ejecución seleccionado no puede satisfacerlos.

Para las ejecuciones de agentes, declare `assemble-before-prompt` cuando el motor deba controlar el
prompt real del modelo mediante `assemble()`:

```ts
info: {
  id: "my-context-engine",
  name: "My Context Engine",
  hostRequirements: {
    "agent-run": {
      requiredCapabilities: ["assemble-before-prompt"],
      unsupportedMessage:
        "Use el entorno de ejecución nativo de Codex o el integrado de OpenClaw, o seleccione el motor de contexto heredado.",
    },
  },
}
```

Las ejecuciones de agentes de Codex nativo y del entorno integrado de OpenClaw satisfacen `assemble-before-prompt`.
Los backends de CLI genéricos no, por lo que los motores que lo requieren se rechazan antes de que se
inicie el proceso de la CLI.

### Aislamiento de fallos

OpenClaw aísla el motor del plugin seleccionado de la ruta principal de respuestas. Si un
motor no heredado no está disponible, no supera la validación del contrato, genera una excepción durante la creación
de la fábrica o desde un método del ciclo de vida, OpenClaw pone ese motor
en cuarentena durante el proceso actual del Gateway y degrada el trabajo del motor de contexto al
motor integrado `legacy`. El error se registra junto con la operación fallida para que el
operador pueda reparar, actualizar o desactivar el plugin sin que el agente deje de
responder.

Los fallos de los requisitos del host son diferentes: cuando un motor declara que un entorno de ejecución
carece de una capacidad requerida, OpenClaw aplica un cierre seguro antes de iniciar la ejecución. Esto
protege a los motores que corromperían el estado si se ejecutaran en un host no compatible.

### ownsCompaction

`ownsCompaction` controla si la compactación automática integrada durante el intento del entorno de ejecución de OpenClaw permanece habilitada para la ejecución:

<AccordionGroup>
  <Accordion title="ownsCompaction: true">
    El motor controla el comportamiento de compactación. OpenClaw desactiva la compactación automática integrada del entorno de ejecución de OpenClaw y la comprobación previa genérica de desbordamiento antes del prompt para esa ejecución, y la implementación de `compact()` del motor es responsable de `/compact`, de la compactación de recuperación ante desbordamientos del proveedor y de cualquier compactación proactiva que quiera realizar en `afterTurn()`. OpenClaw sigue ejecutando la protección contra desbordamientos previa al prompt cuando el motor devuelve `promptAuthority: "preassembly_may_overflow"` desde `assemble()`.
  </Accordion>
  <Accordion title="ownsCompaction: false o sin definir">
    La compactación automática integrada del entorno de ejecución de OpenClaw aún puede ejecutarse durante la ejecución del prompt, pero se sigue llamando al método `compact()` del motor activo para `/compact` y la recuperación ante desbordamientos.
  </Accordion>
</AccordionGroup>

<Warning>
`ownsCompaction: false` **no** significa que OpenClaw recurra automáticamente a la ruta de compactación del motor heredado.
</Warning>

Esto significa que hay dos patrones de plugin válidos:

<Tabs>
  <Tab title="Modo propietario">
    Implemente su propio algoritmo de compactación y establezca `ownsCompaction: true`.
  </Tab>
  <Tab title="Modo de delegación">
    Establezca `ownsCompaction: false` y haga que `compact()` llame a `delegateCompactionToRuntime(...)` desde `openclaw/plugin-sdk/core` para utilizar el comportamiento de compactación integrado de OpenClaw.
  </Tab>
</Tabs>

Un `compact()` que no realiza ninguna operación no es seguro para un motor activo no propietario, porque desactiva la ruta normal de compactación de `/compact` y de recuperación ante desbordamientos para ese espacio de motor.

## Referencia de configuración

```json5
{
  plugins: {
    slots: {
      // Seleccione el motor de contexto activo. Valor predeterminado: "legacy".
      // Establezca el identificador de un plugin para utilizar su motor.
      contextEngine: "legacy",
    },
  },
}
```

<Note>
El espacio es exclusivo durante la ejecución: solo se resuelve un motor de contexto registrado para una ejecución u operación de compactación determinada. Otros plugins `kind: "context-engine"` habilitados aún pueden cargarse y ejecutar su código de registro; `plugins.slots.contextEngine` solo selecciona qué identificador de motor registrado resuelve OpenClaw cuando necesita un motor de contexto.
</Note>

<Note>
**Desinstalación del plugin:** al desinstalar el plugin seleccionado actualmente como `plugins.slots.contextEngine`, OpenClaw restablece el espacio al valor predeterminado (`legacy`). El mismo comportamiento de restablecimiento se aplica a `plugins.slots.memory`. No es necesario editar manualmente la configuración.
</Note>

## Relación con la compactación y la memoria

<AccordionGroup>
  <Accordion title="Compaction">
    Compaction es una de las responsabilidades del motor de contexto. El motor heredado delega en la generación de resúmenes integrada de OpenClaw. Los motores de plugins pueden implementar cualquier estrategia de compactación (resúmenes de DAG, recuperación vectorial, etc.).
  </Accordion>
  <Accordion title="Plugins de memoria">
    Los plugins de memoria (`plugins.slots.memory`) son independientes de los motores de contexto. Los plugins de memoria proporcionan búsqueda y recuperación; los motores de contexto controlan lo que ve el modelo. Pueden trabajar juntos: un motor de contexto podría utilizar datos de un plugin de memoria durante el ensamblaje. Los motores de plugins que quieran utilizar la ruta activa del prompt de memoria deben usar `buildMemorySystemPromptAddition(...)` de `openclaw/plugin-sdk/core`, que convierte las secciones del prompt de memoria preparadas por el host en un `systemPromptAddition` listo para anteponer, sin exponer la disposición del plugin de memoria.
  </Accordion>
  <Accordion title="Poda de sesiones">
    El recorte en memoria de los resultados antiguos de herramientas se sigue ejecutando independientemente del motor de contexto activo.
  </Accordion>
</AccordionGroup>

## Consejos

- Utilice `openclaw doctor` para verificar que el motor se carga correctamente.
- Al cambiar de motor, las sesiones existentes continúan con su historial actual. El nuevo motor se encarga de las ejecuciones futuras.
- Los errores del motor se registran y el motor del plugin seleccionado se pone en cuarentena durante el proceso actual del Gateway. OpenClaw recurre a `legacy` para los turnos del usuario, de modo que las respuestas puedan continuar, pero aun así se debe reparar, actualizar, desactivar o desinstalar el plugin defectuoso.
- Para el desarrollo, utilice `openclaw plugins install -l ./my-engine` para vincular un directorio de plugin local sin copiarlo.

## Contenido relacionado

- [Compaction](/es/concepts/compaction) - resumen de conversaciones largas
- [Contexto](/es/concepts/context) - cómo se crea el contexto para los turnos del agente
- [Arquitectura de plugins](/es/plugins/architecture) - registro de plugins de motores de contexto
- [Manifiesto del plugin](/es/plugins/manifest) - campos del manifiesto del plugin
- [Plugins](/es/tools/plugin) - descripción general de los plugins
