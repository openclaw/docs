---
read_when:
    - Quiere comprender cómo OpenClaw construye el contexto del modelo
    - Estás alternando entre el motor heredado y un motor de Plugin
    - Estás creando un plugin de motor de contexto
sidebarTitle: Context engine
summary: 'Motor de contexto: ensamblaje de contexto conectable, compactación y ciclo de vida de subagentes'
title: Motor de contexto
x-i18n:
    generated_at: "2026-07-12T14:25:43Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 05cb5eb01f002001354dc63b77cdb86f3e9f3bc51722bd943ac20c9e1566dc60
    source_path: concepts/context-engine.md
    workflow: 16
---

Un **motor de contexto** controla cómo OpenClaw construye el contexto del modelo para cada ejecución: qué mensajes incluir, cómo resumir el historial anterior y cómo gestionar el contexto entre los límites de los subagentes.

OpenClaw incluye un motor `legacy` integrado y lo usa de forma predeterminada. Instale y seleccione un motor de Plugin solo cuando necesite un comportamiento diferente de ensamblaje, Compaction o recuperación entre sesiones.

## Inicio rápido

<Steps>
  <Step title="Comprobar qué motor está activo">
    ```bash
    openclaw doctor
    # o inspeccione directamente la configuración:
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
            // La configuración específica del Plugin va aquí (consulte la documentación del Plugin)
          },
        },
      },
    }
    ```

    Reinicie el Gateway después de la instalación y configuración.

  </Step>
  <Step title="Volver a legacy (opcional)">
    Establezca `contextEngine` en `"legacy"` (o elimine la clave por completo; `"legacy"` es el valor predeterminado).
  </Step>
</Steps>

## Cómo funciona

Cada vez que OpenClaw ejecuta un prompt del modelo, el motor de contexto participa en cuatro puntos del ciclo de vida:

<AccordionGroup>
  <Accordion title="1. Ingesta">
    Se invoca cuando se añade un mensaje nuevo a la sesión. El motor puede almacenar o indexar el mensaje en su propio almacén de datos.
  </Accordion>
  <Accordion title="2. Ensamblaje">
    Se invoca antes de cada ejecución del modelo. El motor devuelve un conjunto ordenado de mensajes (y un `systemPromptAddition` opcional) que se ajustan al presupuesto de tokens.
  </Accordion>
  <Accordion title="3. Compaction">
    Se invoca cuando la ventana de contexto está llena o cuando se ejecuta `/compact`. El motor resume el historial anterior para liberar espacio.
  </Accordion>
  <Accordion title="4. Después del turno">
    Se invoca después de que finaliza una ejecución. El motor puede conservar el estado, activar la Compaction en segundo plano o actualizar los índices.
  </Accordion>
</AccordionGroup>

Los motores también pueden implementar un método opcional `maintain()` para el mantenimiento de la transcripción (reescrituras seguras mediante `runtimeContext.rewriteTranscriptEntries()`) después de la inicialización, de un turno correcto o de la Compaction. Establezca `info.turnMaintenanceMode: "background"` para ejecutarlo como trabajo diferido en lugar de bloquear la respuesta.

Para el entorno Codex no ACP incluido, OpenClaw aplica el mismo ciclo de vida proyectando el contexto ensamblado en las instrucciones para desarrolladores de Codex y en el prompt del turno actual. Codex sigue controlando su historial de hilos nativo y su compactador nativo.

### Ciclo de vida de los subagentes (opcional)

OpenClaw invoca dos hooks opcionales del ciclo de vida de los subagentes:

<ParamField path="prepareSubagentSpawn" type="method">
  Prepare el estado de contexto compartido antes de que se inicie una ejecución secundaria. El hook recibe las claves de sesión principal/secundaria, `contextMode` (`isolated` o `fork`), los ids/archivos de transcripción disponibles y un TTL opcional. Si devuelve un identificador de reversión, OpenClaw lo invoca cuando falla la creación después de que la preparación se haya completado correctamente. Las creaciones nativas de subagentes que solicitan `lightContext` y se resuelven como `contextMode="isolated"` omiten intencionadamente este hook para que el proceso secundario comience con el contexto de inicialización ligero sin estado previo a la creación gestionado por el motor de contexto.
</ParamField>
<ParamField path="onSubagentEnded" type="method">
  Limpie los recursos cuando una sesión de subagente finalice o se depure.
</ParamField>

### Adición al prompt del sistema

El método `assemble` puede devolver una cadena `systemPromptAddition`. OpenClaw la antepone al prompt del sistema de la ejecución. Esto permite que los motores inyecten orientación dinámica de recuperación, instrucciones de recuperación o sugerencias sensibles al contexto sin requerir archivos estáticos del espacio de trabajo.

## El motor legacy

El motor `legacy` integrado conserva el comportamiento original de OpenClaw:

- **Ingesta**: no realiza ninguna operación (el gestor de sesiones controla directamente la persistencia de mensajes).
- **Ensamblaje**: paso directo (la canalización existente de saneamiento → validación → limitación del entorno gestiona el ensamblaje del contexto).
- **Compaction**: delega en la Compaction de resumen integrada, que crea un único resumen de los mensajes anteriores y mantiene intactos los mensajes recientes.
- **Después del turno**: no realiza ninguna operación.

El motor legacy no registra herramientas ni proporciona un `systemPromptAddition`.

Cuando no se establece `plugins.slots.contextEngine` (o se establece en `"legacy"`), este motor se usa automáticamente.

## Motores de Plugin

Un Plugin puede registrar un motor de contexto mediante la API de plugins:

```ts
import { buildMemorySystemPromptAddition } from "openclaw/plugin-sdk/core";
import { resolveSessionAgentId } from "openclaw/plugin-sdk/memory-host-core";

export default function register(api) {
  api.registerContextEngine("my-engine", (ctx) => ({
    info: {
      id: "my-engine",
      name: "My Context Engine",
      ownsCompaction: true,
    },

    async ingest({ sessionId, message, isHeartbeat }) {
      // Almacene el mensaje en su almacén de datos
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
      // Devuelva mensajes que se ajusten al presupuesto
      return {
        messages: buildContext(messages, tokenBudget),
        estimatedTokens: countTokens(messages),
        systemPromptAddition: buildMemorySystemPromptAddition({
          availableTools: availableTools ?? new Set(),
          citationsMode,
          agentId: resolveSessionAgentId({ config: ctx.config, sessionKey }),
          agentSessionKey: sessionKey,
        }),
      };
    },

    async compact({ sessionId, force }) {
      // Resuma el contexto anterior
      return { ok: true, compacted: true };
    },
  }));
}
```

La fábrica `ctx` incluye valores opcionales `config`, `agentDir` y `workspaceDir`
para que los plugins puedan inicializar el estado por agente o por espacio de trabajo antes de que
se ejecute el primer hook del ciclo de vida.

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

| Miembro            | Tipo      | Finalidad                                                        |
| ------------------ | --------- | ---------------------------------------------------------------- |
| `info`             | Propiedad | Id, nombre y versión del motor, y si este controla la Compaction |
| `ingest(params)`   | Método    | Almacenar un solo mensaje                                        |
| `assemble(params)` | Método    | Crear el contexto para una ejecución del modelo (devuelve `AssembleResult`) |
| `compact(params)`  | Método    | Resumir/reducir el contexto                                      |

`assemble` devuelve un `AssembleResult` con:

<ParamField path="messages" type="Message[]" required>
  Los mensajes ordenados que se enviarán al modelo.
</ParamField>
<ParamField path="estimatedTokens" type="number" required>
  La estimación del motor del total de tokens en el contexto ensamblado. OpenClaw la usa para decidir los umbrales de Compaction y para los informes de diagnóstico.
</ParamField>
<ParamField path="systemPromptAddition" type="string">
  Se antepone al prompt del sistema.
</ParamField>
<ParamField path="promptAuthority" type='"assembled" | "preassembly_may_overflow"'>
  Controla qué estimación de tokens usa el ejecutor para las comprobaciones
  preventivas de desbordamiento. El valor predeterminado es `"assembled"`, lo que significa que, para los motores que no controlan la Compaction, solo se comprueba la estimación
  del prompt ensamblado. Los motores que establecen `ownsCompaction: true` gestionan su propia admisión de prompts,
  por lo que OpenClaw omite de forma predeterminada la comprobación genérica previa al prompt. Establezca
  `"preassembly_may_overflow"` solo cuando la vista ensamblada pueda ocultar un riesgo de desbordamiento
  en la transcripción subyacente; en ese caso, el ejecutor mantiene activa la comprobación genérica
  y toma el máximo entre la estimación ensamblada y la estimación del historial
  de sesión previa al ensamblaje (sin ventana) al decidir si debe ejecutar
  una Compaction preventiva. En cualquier caso, los mensajes devueltos siguen siendo los que ve el
  modelo; `promptAuthority` solo afecta a la comprobación previa.
</ParamField>
<ParamField path="contextProjection" type="ContextEngineProjection">
  Ciclo de vida de proyección opcional para hosts con hilos persistentes en el backend (por ejemplo, Codex app-server). `mode: "thread_bootstrap"` con un `epoch` estable solicita al host que inyecte el contexto ensamblado una vez por época y reutilice el hilo del backend hasta que cambie la época, en lugar de volver a proyectarlo en cada turno. Omita este campo para la proyección normal por turno.
</ParamField>

`compact` devuelve un `CompactResult`. Cuando la Compaction cambia la identidad de la sesión
activa, `result.sessionTarget` (un `ContextEngineSessionTarget` tipado que contiene
la identidad de la sesión y el ámbito del almacén) identifica la sesión sucesora que debe usar
el siguiente reintento o turno; `result.sessionId` refleja el id sucesor.

Miembros opcionales:

| Miembro                        | Tipo   | Finalidad                                                                                                                                             |
| ------------------------------ | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `bootstrap(params)`            | Método | Inicializar el estado del motor para una sesión. Se invoca una vez cuando el motor detecta una sesión por primera vez (por ejemplo, al importar el historial). |
| `maintain(params)`             | Método | Mantenimiento de la transcripción después de la inicialización, de un turno correcto o de la Compaction. Use `runtimeContext.rewriteTranscriptEntries()` para realizar reescrituras seguras. |
| `ingestBatch(params)`          | Método | Ingerir un turno completado como lote. Se invoca después de que finaliza una ejecución, con todos los mensajes de ese turno a la vez.                  |
| `afterTurn(params)`            | Método | Trabajo del ciclo de vida posterior a la ejecución (conservar el estado, activar la Compaction en segundo plano).                                     |
| `prepareSubagentSpawn(params)` | Método | Configurar el estado compartido para una sesión secundaria antes de que se inicie.                                                                    |
| `onSubagentEnded(params)`      | Método | Limpiar los recursos después de que finalice un subagente.                                                                                            |
| `dispose()`                    | Método | Liberar recursos. Se invoca durante el apagado del Gateway o la recarga del Plugin, no por sesión.                                                     |

### Configuración del entorno

Los hooks del ciclo de vida que se ejecutan dentro de OpenClaw reciben un objeto
`runtimeSettings` opcional. Es una superficie de API interna de
productor/consumidor, versionada y de solo lectura: OpenClaw la produce para el motor de contexto
seleccionado y el motor de contexto la consume dentro de los hooks del ciclo de vida. No se
muestra directamente a los usuarios ni crea una superficie de informes específica.

- `schemaVersion`: actualmente `1`
- `runtime`: host de OpenClaw, modo del entorno (`normal`, `fallback` o
  `degraded`) e ids opcionales del entorno o arnés
- `contextEngineSelection`: id del motor de contexto seleccionado y origen de la selección
- `executionHost`: id y etiqueta del host para la superficie que invoca el hook
- `model`: modelo solicitado, modelo resuelto, proveedor y familia de modelos opcional
- `limits`: presupuesto de tokens del prompt y número máximo de tokens de salida cuando se conocen
- `diagnostics`: códigos cerrados de motivo del modo alternativo y degradado cuando se conocen

Los campos que pueden ser desconocidos se representan como `null`; los campos discriminadores, como el modo de ejecución y el origen de la selección, no admiten valores nulos. Los motores antiguos siguen siendo compatibles: si un motor heredado estricto rechaza `runtimeSettings` por ser una propiedad desconocida, OpenClaw reintenta la llamada del ciclo de vida sin ella, en lugar de poner el motor en cuarentena.

### Requisitos del host

Los motores de contexto pueden declarar requisitos de capacidades del host en `info.hostRequirements`.
OpenClaw comprueba estos requisitos antes de iniciar la operación y aplica un cierre seguro con un error descriptivo cuando el entorno de ejecución seleccionado no puede satisfacerlos.

Para las ejecuciones de agentes, declare `assemble-before-prompt` cuando el motor deba controlar el prompt real del modelo mediante `assemble()`:

```ts
info: {
  id: "my-context-engine",
  name: "My Context Engine",
  hostRequirements: {
    "agent-run": {
      requiredCapabilities: ["assemble-before-prompt"],
      unsupportedMessage:
        "Use el entorno de ejecución nativo de Codex o el entorno integrado de OpenClaw, o seleccione el motor de contexto heredado.",
    },
  },
}
```

Las ejecuciones de agentes con Codex nativo y el entorno integrado de OpenClaw satisfacen `assemble-before-prompt`.
Los backends de CLI genéricos no lo hacen, por lo que los motores que lo requieren se rechazan antes de que se inicie el proceso de CLI.

### Aislamiento de fallos

OpenClaw aísla el motor del plugin seleccionado de la ruta principal de respuestas. Si un motor no heredado no está disponible, no supera la validación del contrato, genera una excepción durante la creación de la fábrica o desde un método del ciclo de vida, OpenClaw pone ese motor en cuarentena durante el proceso actual del Gateway y transfiere el trabajo del motor de contexto al motor `legacy` integrado. El error se registra junto con la operación fallida para que el operador pueda reparar, actualizar o deshabilitar el plugin sin que el agente deje de responder.

Los fallos de requisitos del host son diferentes: cuando un motor declara que un entorno de ejecución carece de una capacidad requerida, OpenClaw aplica un cierre seguro antes de iniciar la ejecución. Esto protege a los motores que corromperían el estado si se ejecutaran en un host no compatible.

### ownsCompaction

`ownsCompaction` controla si la compactación automática integrada durante el intento del entorno de ejecución de OpenClaw permanece habilitada para la ejecución:

<AccordionGroup>
  <Accordion title="ownsCompaction: true">
    El motor controla el comportamiento de compactación. OpenClaw deshabilita la compactación automática integrada del entorno de ejecución de OpenClaw y la comprobación previa genérica de desbordamiento antes del prompt para esa ejecución, y la implementación `compact()` del motor se encarga de `/compact`, de la compactación de recuperación ante desbordamientos del proveedor y de cualquier compactación proactiva que quiera realizar en `afterTurn()`. OpenClaw sigue ejecutando la protección contra desbordamientos antes del prompt cuando el motor devuelve `promptAuthority: "preassembly_may_overflow"` desde `assemble()`.
  </Accordion>
  <Accordion title="ownsCompaction: false o sin definir">
    La compactación automática integrada del entorno de ejecución de OpenClaw puede seguir ejecutándose durante el procesamiento del prompt, pero se continúa llamando al método `compact()` del motor activo para `/compact` y la recuperación ante desbordamientos.
  </Accordion>
</AccordionGroup>

<Warning>
`ownsCompaction: false` **no** significa que OpenClaw recurra automáticamente a la ruta de compactación del motor heredado.
</Warning>

Esto significa que existen dos patrones de plugin válidos:

<Tabs>
  <Tab title="Modo propietario">
    Implemente su propio algoritmo de compactación y establezca `ownsCompaction: true`.
  </Tab>
  <Tab title="Modo delegado">
    Establezca `ownsCompaction: false` y haga que `compact()` llame a `delegateCompactionToRuntime(...)` desde `openclaw/plugin-sdk/core` para utilizar el comportamiento de compactación integrado de OpenClaw.
  </Tab>
</Tabs>

Un método `compact()` que no realiza ninguna operación no es seguro para un motor activo no propietario, ya que deshabilita la ruta normal de compactación de `/compact` y de recuperación ante desbordamientos para ese espacio de motor.

## Referencia de configuración

```json5
{
  plugins: {
    slots: {
      // Seleccione el motor de contexto activo. Valor predeterminado: "legacy".
      // Establézcalo en el identificador de un plugin para utilizar su motor.
      contextEngine: "legacy",
    },
  },
}
```

<Note>
El espacio es exclusivo durante la ejecución: solo se resuelve un motor de contexto registrado para una ejecución u operación de compactación determinada. Otros plugins habilitados de tipo `kind: "context-engine"` pueden seguir cargando y ejecutando su código de registro; `plugins.slots.contextEngine` solo selecciona el identificador del motor registrado que OpenClaw resuelve cuando necesita un motor de contexto.
</Note>

<Note>
**Desinstalación de plugins:** cuando se desinstala el plugin seleccionado en ese momento como `plugins.slots.contextEngine`, OpenClaw restablece el espacio al valor predeterminado (`legacy`). El mismo comportamiento de restablecimiento se aplica a `plugins.slots.memory`. No es necesario editar manualmente la configuración.
</Note>

## Relación con la compactación y la memoria

<AccordionGroup>
  <Accordion title="Compaction">
    Compaction es una de las responsabilidades del motor de contexto. El motor heredado delega en el resumen integrado de OpenClaw. Los motores de plugins pueden implementar cualquier estrategia de compactación (resúmenes de DAG, recuperación vectorial, etc.).
  </Accordion>
  <Accordion title="Plugins de memoria">
    Los plugins de memoria (`plugins.slots.memory`) son independientes de los motores de contexto. Los plugins de memoria proporcionan búsqueda y recuperación; los motores de contexto controlan lo que ve el modelo. Pueden funcionar conjuntamente: un motor de contexto puede utilizar datos del plugin de memoria durante el ensamblaje. Los motores de plugins que quieran utilizar la ruta activa del prompt de memoria deberían optar por `buildMemorySystemPromptAddition(...)` de `openclaw/plugin-sdk/core`, que convierte las secciones activas del prompt de memoria en un `systemPromptAddition` listo para anteponer. Si un motor necesita un control de nivel inferior, puede seguir obteniendo líneas sin procesar de `openclaw/plugin-sdk/memory-host-core` mediante `buildActiveMemoryPromptSection(...)`.
  </Accordion>
  <Accordion title="Depuración de sesiones">
    El recorte en memoria de resultados antiguos de herramientas sigue ejecutándose independientemente del motor de contexto que esté activo.
  </Accordion>
</AccordionGroup>

## Consejos

- Use `openclaw doctor` para verificar que el motor se carga correctamente.
- Al cambiar de motor, las sesiones existentes conservan su historial actual. El nuevo motor se hace cargo de las ejecuciones futuras.
- Los errores del motor se registran y el motor del plugin seleccionado se pone en cuarentena durante el proceso actual del Gateway. OpenClaw recurre a `legacy` para los turnos del usuario, de modo que las respuestas puedan continuar, pero aun así se debe reparar, actualizar, deshabilitar o desinstalar el plugin defectuoso.
- Para el desarrollo, use `openclaw plugins install -l ./my-engine` para vincular un directorio de plugin local sin copiarlo.

## Contenido relacionado

- [Compaction](/es/concepts/compaction) - resumen de conversaciones largas
- [Contexto](/es/concepts/context) - cómo se crea el contexto para los turnos del agente
- [Arquitectura de plugins](/es/plugins/architecture) - registro de plugins de motores de contexto
- [Manifiesto de plugins](/es/plugins/manifest) - campos del manifiesto de plugins
- [Plugins](/es/tools/plugin) - descripción general de los plugins
