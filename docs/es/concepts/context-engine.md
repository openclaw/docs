---
read_when:
    - Quieres entender cómo OpenClaw ensambla el contexto del modelo
    - Estás cambiando entre el motor heredado y un motor de plugin
    - Estás creando un plugin de motor de contexto
sidebarTitle: Context engine
summary: 'Motor de contexto: ensamblado de contexto conectable, Compaction y ciclo de vida de subagentes'
title: Motor de contexto
x-i18n:
    generated_at: "2026-06-30T13:47:51Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f0ed65cbb72b14b1a6e8d4d9a394f730a48ada35d77e34c12b3356162b281eec
    source_path: concepts/context-engine.md
    workflow: 16
---

Un **motor de contexto** controla cómo OpenClaw construye el contexto del modelo para cada ejecución: qué mensajes incluir, cómo resumir el historial anterior y cómo gestionar el contexto entre límites de subagentes.

OpenClaw incluye un motor `legacy` integrado y lo usa de forma predeterminada - la mayoría de los usuarios nunca necesitan cambiar esto. Instala y selecciona un motor de plugin solo cuando quieras un comportamiento distinto de ensamblaje, compactación o recuperación entre sesiones.

## Inicio rápido

<Steps>
  <Step title="Comprueba qué motor está activo">
    ```bash
    openclaw doctor
    # or inspect config directly:
    cat ~/.openclaw/openclaw.json | jq '.plugins.slots.contextEngine'
    ```
  </Step>
  <Step title="Instala un motor de plugin">
    Los plugins de motor de contexto se instalan como cualquier otro plugin de OpenClaw.

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
  <Step title="Habilita y selecciona el motor">
    ```json5
    // openclaw.json
    {
      plugins: {
        slots: {
          contextEngine: "lossless-claw", // must match the plugin's registered engine id
        },
        entries: {
          "lossless-claw": {
            enabled: true,
            // Plugin-specific config goes here (see the plugin's docs)
          },
        },
      },
    }
    ```

    Reinicia el Gateway después de instalar y configurar.

  </Step>
  <Step title="Vuelve a legacy (opcional)">
    Establece `contextEngine` en `"legacy"` (o elimina la clave por completo - `"legacy"` es el valor predeterminado).
  </Step>
</Steps>

## Cómo funciona

Cada vez que OpenClaw ejecuta un prompt de modelo, el motor de contexto participa en cuatro puntos del ciclo de vida:

<AccordionGroup>
  <Accordion title="1. Ingesta">
    Se llama cuando se agrega un mensaje nuevo a la sesión. El motor puede almacenar o indexar el mensaje en su propio almacén de datos.
  </Accordion>
  <Accordion title="2. Ensamblaje">
    Se llama antes de cada ejecución del modelo. El motor devuelve un conjunto ordenado de mensajes (y un `systemPromptAddition` opcional) que caben dentro del presupuesto de tokens.
  </Accordion>
  <Accordion title="3. Compactar">
    Se llama cuando la ventana de contexto está llena, o cuando el usuario ejecuta `/compact`. El motor resume el historial anterior para liberar espacio.
  </Accordion>
  <Accordion title="4. Después del turno">
    Se llama después de que una ejecución se completa. El motor puede persistir estado, activar compactación en segundo plano o actualizar índices.
  </Accordion>
</AccordionGroup>

Para el harness Codex no ACP incluido, OpenClaw aplica el mismo ciclo de vida proyectando el contexto ensamblado en las instrucciones de desarrollador de Codex y en el prompt del turno actual. Codex sigue siendo propietario de su historial de hilos nativo y de su compactador nativo.

### Ciclo de vida de subagentes (opcional)

OpenClaw llama a dos hooks opcionales del ciclo de vida de subagentes:

<ParamField path="prepareSubagentSpawn" type="method">
  Prepara el estado de contexto compartido antes de que comience una ejecución hija. El hook recibe claves de sesión padre/hija, `contextMode` (`isolated` o `fork`), ids/archivos de transcripción disponibles y TTL opcional. Si devuelve un manejador de reversión, OpenClaw lo llama cuando el spawn falla después de que la preparación se complete correctamente. Los spawns de subagentes nativos que solicitan `lightContext` y se resuelven como `contextMode="isolated"` omiten intencionalmente este hook para que el hijo empiece desde el contexto de arranque ligero sin estado previo al spawn gestionado por el motor de contexto.
</ParamField>
<ParamField path="onSubagentEnded" type="method">
  Limpia cuando una sesión de subagente se completa o se barre.
</ParamField>

### Adición al prompt del sistema

El método `assemble` puede devolver una cadena `systemPromptAddition`. OpenClaw la antepone al prompt del sistema de la ejecución. Esto permite que los motores inyecten orientación dinámica de recuperación, instrucciones de recuperación o sugerencias conscientes del contexto sin requerir archivos estáticos en el workspace.

## El motor legacy

El motor `legacy` integrado conserva el comportamiento original de OpenClaw:

- **Ingesta**: sin operación (el gestor de sesiones maneja directamente la persistencia de mensajes).
- **Ensamblaje**: paso directo (la canalización existente sanitize → validate → limit en el runtime maneja el ensamblaje de contexto).
- **Compactar**: delega en la compactación de resumen integrada, que crea un único resumen de los mensajes anteriores y mantiene intactos los mensajes recientes.
- **Después del turno**: sin operación.

El motor legacy no registra herramientas ni proporciona un `systemPromptAddition`.

Cuando no se establece `plugins.slots.contextEngine` (o se establece en `"legacy"`), este motor se usa automáticamente.

## Motores de plugin

Un plugin puede registrar un motor de contexto usando la API de plugin:

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
      // Store the message in your data store
      return { ingested: true };
    },

    async assemble({ sessionId, messages, tokenBudget, availableTools, citationsMode }) {
      // Return messages that fit the budget
      return {
        messages: buildContext(messages, tokenBudget),
        estimatedTokens: countTokens(messages),
        systemPromptAddition: buildMemorySystemPromptAddition({
          availableTools: availableTools ?? new Set(),
          citationsMode,
        }),
      };
    },

    async compact({ sessionId, force }) {
      // Summarize older context
      return { ok: true, compacted: true };
    },
  }));
}
```

La factoría `ctx` incluye valores opcionales `config`, `agentDir` y `workspaceDir`
para que los plugins puedan inicializar estado por agente o por workspace antes de que se ejecute
el primer hook del ciclo de vida.

Después, habilítalo en la configuración:

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

Miembros requeridos:

| Miembro            | Tipo      | Propósito                                                |
| ------------------ | --------- | -------------------------------------------------------- |
| `info`             | Propiedad | Id del motor, nombre, versión y si posee la compactación |
| `ingest(params)`   | Método    | Almacenar un único mensaje                               |
| `assemble(params)` | Método    | Construir contexto para una ejecución de modelo (devuelve `AssembleResult`) |
| `compact(params)`  | Método    | Resumir/reducir contexto                                 |

`assemble` devuelve un `AssembleResult` con:

<ParamField path="messages" type="Message[]" required>
  Los mensajes ordenados que se enviarán al modelo.
</ParamField>
<ParamField path="estimatedTokens" type="number" required>
  La estimación del motor del total de tokens en el contexto ensamblado. OpenClaw usa esto para decisiones de umbral de compactación e informes de diagnóstico.
</ParamField>
<ParamField path="systemPromptAddition" type="string">
  Se antepone al prompt del sistema.
</ParamField>
<ParamField path="promptAuthority" type='"assembled" | "preassembly_may_overflow"'>
  Controla qué estimación de tokens usa el runner para las comprobaciones
  preventivas de desbordamiento. El valor predeterminado es `"assembled"`, lo que significa que solo se comprueba
  la estimación del prompt ensamblado para motores que no poseen la compactación.
  Los motores que establecen `ownsCompaction: true` gestionan su propia admisión de prompts,
  por lo que OpenClaw omite de forma predeterminada la comprobación genérica previa al prompt. Establece
  `"preassembly_may_overflow"` solo cuando tu vista ensamblada pueda ocultar riesgo
  de desbordamiento en la transcripción subyacente; entonces el runner mantiene activa
  la comprobación genérica y toma el máximo entre la estimación ensamblada y la
  estimación previa al ensamblaje (sin ventana) del historial de sesión al decidir si
  compactar preventivamente. En cualquier caso, los mensajes que devuelves siguen siendo lo que
  ve el modelo - `promptAuthority` solo afecta a la comprobación previa.
</ParamField>

`compact` devuelve un `CompactResult`. Cuando la compactación rota la transcripción
activa, `result.sessionId` y `result.sessionFile` identifican la sesión sucesora
que debe usar el siguiente reintento o turno.

Miembros opcionales:

| Miembro                        | Tipo   | Propósito                                                                                                       |
| ------------------------------ | ------ | --------------------------------------------------------------------------------------------------------------- |
| `bootstrap(params)`            | Método | Inicializar el estado del motor para una sesión. Se llama una vez cuando el motor ve una sesión por primera vez (por ejemplo, importar historial). |
| `ingestBatch(params)`          | Método | Ingerir un turno completado como lote. Se llama después de que una ejecución se completa, con todos los mensajes de ese turno a la vez. |
| `afterTurn(params)`            | Método | Trabajo de ciclo de vida posterior a la ejecución (persistir estado, activar compactación en segundo plano).    |
| `prepareSubagentSpawn(params)` | Método | Configurar estado compartido para una sesión hija antes de que empiece.                                         |
| `onSubagentEnded(params)`      | Método | Limpiar después de que termina un subagente.                                                                    |
| `dispose()`                    | Método | Liberar recursos. Se llama durante el apagado del Gateway o la recarga del plugin - no por sesión.              |

### Configuración del runtime

Los hooks de ciclo de vida que se ejecutan dentro de OpenClaw reciben un objeto
`runtimeSettings` opcional. Es una superficie de API interna
productor/consumidor, versionada y de solo lectura: OpenClaw la produce para el motor de contexto
seleccionado, y el motor de contexto la consume dentro de los hooks de ciclo de vida. No se
renderiza directamente a los usuarios y no crea una superficie de informes dedicada.

- `schemaVersion`: actualmente `1`
- `runtime`: host de OpenClaw, modo de runtime (`normal`, `fallback` o
  `degraded`) e ids opcionales de harness/runtime
- `contextEngineSelection`: id del motor de contexto seleccionado y origen de selección
- `executionHost`: id y etiqueta del host para la superficie que invoca el hook
- `model`: modelo solicitado, modelo resuelto, proveedor y familia de modelo opcional
- `limits`: presupuesto de tokens del prompt y máximo de tokens de salida cuando se conocen
- `diagnostics`: códigos cerrados de motivo de fallback y degradación cuando se conocen

Los campos que pueden ser desconocidos se representan como `null`; los campos discriminadores como
el modo de runtime y el origen de selección permanecen no anulables. Los motores anteriores siguen siendo
compatibles: si un motor legacy estricto rechaza `runtimeSettings` como una propiedad
desconocida, OpenClaw reintenta la llamada de ciclo de vida sin ella en lugar de poner
el motor en cuarentena.

### Requisitos de host

Los motores de contexto pueden declarar requisitos de capacidad de host en `info.hostRequirements`.
OpenClaw comprueba estos requisitos antes de iniciar la operación y falla cerrado
con un error descriptivo cuando el runtime seleccionado no puede satisfacerlos.

Para ejecuciones de agente, declara `assemble-before-prompt` cuando el motor debe controlar el
prompt real del modelo mediante `assemble()`:

```ts
info: {
  id: "my-context-engine",
  name: "My Context Engine",
  hostRequirements: {
    "agent-run": {
      requiredCapabilities: ["assemble-before-prompt"],
      unsupportedMessage:
        "Use the native Codex or OpenClaw embedded runtime, or select the legacy context engine.",
    },
  },
}
```

Las ejecuciones de agente nativas de Codex y las integradas de OpenClaw satisfacen `assemble-before-prompt`.
Los backends CLI genéricos no lo hacen, por lo que los motores que lo requieren se rechazan antes de que
empiece el proceso CLI.

### Aislamiento de fallos

OpenClaw aísla el motor del Plugin seleccionado de la ruta de respuesta principal. Si falta un motor no heredado, falla la validación del contrato, lanza un error durante la creación de la fábrica o lanza un error desde un método de ciclo de vida, OpenClaw pone ese motor en cuarentena para el proceso de Gateway actual y degrada el trabajo del motor de contexto al motor `legacy` integrado. El error se registra con la operación fallida para que el operador pueda reparar, actualizar o desactivar el Plugin sin que el agente deje de responder.

Los fallos de requisitos del host son diferentes: cuando un motor declara que a un runtime le falta una capacidad requerida, OpenClaw falla de forma cerrada antes de iniciar la ejecución. Eso protege a los motores que corromperían el estado si se ejecutaran en un host no compatible.

### ownsCompaction

`ownsCompaction` controla si la autocompactación integrada en el intento del runtime de OpenClaw permanece activada para la ejecución:

<AccordionGroup>
  <Accordion title="ownsCompaction: true">
    El motor es propietario del comportamiento de compactación. OpenClaw desactiva la autocompactación integrada del runtime de OpenClaw y la precomprobación genérica de desbordamiento previa al prompt para esa ejecución, y la implementación `compact()` del motor es responsable de `/compact`, la compactación de recuperación por desbordamiento del proveedor y cualquier compactación proactiva que quiera hacer en `afterTurn()`. OpenClaw sigue ejecutando la protección contra desbordamiento previa al prompt cuando el motor devuelve `promptAuthority: "preassembly_may_overflow"` desde `assemble()`.
  </Accordion>
  <Accordion title="ownsCompaction: false o sin definir">
    La autocompactación integrada del runtime de OpenClaw puede seguir ejecutándose durante la ejecución del prompt, pero el método `compact()` del motor activo se sigue llamando para `/compact` y la recuperación por desbordamiento.
  </Accordion>
</AccordionGroup>

<Warning>
`ownsCompaction: false` **no** significa que OpenClaw recurra automáticamente a la ruta de compactación del motor heredado.
</Warning>

Eso significa que hay dos patrones de Plugin válidos:

<Tabs>
  <Tab title="Modo propietario">
    Implementa tu propio algoritmo de compactación y configura `ownsCompaction: true`.
  </Tab>
  <Tab title="Modo delegado">
    Configura `ownsCompaction: false` y haz que `compact()` llame a `delegateCompactionToRuntime(...)` desde `openclaw/plugin-sdk/core` para usar el comportamiento de compactación integrado de OpenClaw.
  </Tab>
</Tabs>

Un `compact()` sin operación no es seguro para un motor activo no propietario porque desactiva la ruta normal de compactación de `/compact` y de recuperación por desbordamiento para ese espacio de motor.

## Referencia de configuración

```json5
{
  plugins: {
    slots: {
      // Select the active context engine. Default: "legacy".
      // Set to a plugin id to use a plugin engine.
      contextEngine: "legacy",
    },
  },
}
```

<Note>
El espacio es exclusivo en tiempo de ejecución: solo se resuelve un motor de contexto registrado para una ejecución u operación de compactación determinada. Otros Plugins `kind: "context-engine"` activados todavía pueden cargarse y ejecutar su código de registro; `plugins.slots.contextEngine` solo selecciona qué id de motor registrado resuelve OpenClaw cuando necesita un motor de contexto.
</Note>

<Note>
**Desinstalación de Plugin:** cuando desinstalas el Plugin seleccionado actualmente como `plugins.slots.contextEngine`, OpenClaw restablece el espacio al valor predeterminado (`legacy`). El mismo comportamiento de restablecimiento se aplica a `plugins.slots.memory`. No se requiere editar la configuración manualmente.
</Note>

## Relación con la compactación y la memoria

<AccordionGroup>
  <Accordion title="Compactación">
    La compactación es una responsabilidad del motor de contexto. El motor heredado delega en la resumición integrada de OpenClaw. Los motores de Plugin pueden implementar cualquier estrategia de compactación (resúmenes DAG, recuperación vectorial, etc.).
  </Accordion>
  <Accordion title="Plugins de memoria">
    Los Plugins de memoria (`plugins.slots.memory`) están separados de los motores de contexto. Los Plugins de memoria proporcionan búsqueda/recuperación; los motores de contexto controlan lo que ve el modelo. Pueden trabajar juntos: un motor de contexto podría usar datos de Plugins de memoria durante el ensamblado. Los motores de Plugin que quieran la ruta activa de prompt de memoria deberían preferir `buildMemorySystemPromptAddition(...)` desde `openclaw/plugin-sdk/core`, que convierte las secciones activas del prompt de memoria en un `systemPromptAddition` listo para anteponer. Si un motor necesita control de nivel inferior, todavía puede extraer líneas sin procesar desde `openclaw/plugin-sdk/memory-host-core` mediante `buildActiveMemoryPromptSection(...)`.
  </Accordion>
  <Accordion title="Poda de sesiones">
    El recorte de resultados antiguos de herramientas en memoria sigue ejecutándose independientemente de qué motor de contexto esté activo.
  </Accordion>
</AccordionGroup>

## Consejos

- Usa `openclaw doctor` para verificar que tu motor se esté cargando correctamente.
- Si cambias de motor, las sesiones existentes continúan con su historial actual. El nuevo motor toma el control para ejecuciones futuras.
- Los errores del motor se registran y el motor de Plugin seleccionado se pone en cuarentena para el proceso de Gateway actual. OpenClaw recurre a `legacy` para los turnos de usuario, de modo que las respuestas puedan continuar, pero aun así deberías reparar, actualizar, desactivar o desinstalar el Plugin defectuoso.
- Para desarrollo, usa `openclaw plugins install -l ./my-engine` para enlazar un directorio de Plugin local sin copiarlo.

## Relacionado

- [Compaction](/es/concepts/compaction) - resumir conversaciones largas
- [Contexto](/es/concepts/context) - cómo se construye el contexto para los turnos del agente
- [Arquitectura de Plugin](/es/plugins/architecture) - registrar Plugins de motor de contexto
- [Manifiesto de Plugin](/es/plugins/manifest) - campos del manifiesto del Plugin
- [Plugins](/es/tools/plugin) - descripción general de Plugins
