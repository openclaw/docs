---
read_when:
    - Quieres entender cómo OpenClaw ensambla el contexto del modelo
    - Estás cambiando entre el motor heredado y un motor de Plugin
    - Estás creando un plugin de motor de contexto
sidebarTitle: Context engine
summary: 'Motor de contexto: ensamblaje de contexto conectable, Compaction y ciclo de vida de subagentes'
title: Motor de contexto
x-i18n:
    generated_at: "2026-06-27T11:10:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 124b6daf52f3d58f756352e2e169697541a8b6e67aecaa5a219bed15bda801cd
    source_path: concepts/context-engine.md
    workflow: 16
---

Un **motor de contexto** controla cómo OpenClaw construye el contexto del modelo para cada ejecución: qué mensajes incluir, cómo resumir el historial anterior y cómo gestionar el contexto a través de los límites de subagentes.

OpenClaw incluye un motor `legacy` integrado y lo usa de forma predeterminada; la mayoría de los usuarios nunca necesitan cambiar esto. Instala y selecciona un motor de Plugin solo cuando quieras un comportamiento distinto de ensamblaje, Compaction o recuperación entre sesiones.

## Inicio rápido

<Steps>
  <Step title="Comprueba qué motor está activo">
    ```bash
    openclaw doctor
    # or inspect config directly:
    cat ~/.openclaw/openclaw.json | jq '.plugins.slots.contextEngine'
    ```
  </Step>
  <Step title="Instala un motor de Plugin">
    Los Plugins de motor de contexto se instalan como cualquier otro Plugin de OpenClaw.

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
    Establece `contextEngine` en `"legacy"` (o elimina la clave por completo; `"legacy"` es el valor predeterminado).
  </Step>
</Steps>

## Cómo funciona

Cada vez que OpenClaw ejecuta un prompt de modelo, el motor de contexto participa en cuatro puntos del ciclo de vida:

<AccordionGroup>
  <Accordion title="1. Ingesta">
    Se llama cuando se añade un nuevo mensaje a la sesión. El motor puede almacenar o indexar el mensaje en su propio almacén de datos.
  </Accordion>
  <Accordion title="2. Ensamblaje">
    Se llama antes de cada ejecución de modelo. El motor devuelve un conjunto ordenado de mensajes (y un `systemPromptAddition` opcional) que encajan dentro del presupuesto de tokens.
  </Accordion>
  <Accordion title="3. Compact">
    Se llama cuando la ventana de contexto está llena, o cuando el usuario ejecuta `/compact`. El motor resume el historial anterior para liberar espacio.
  </Accordion>
  <Accordion title="4. Después del turno">
    Se llama después de que se completa una ejecución. El motor puede persistir estado, activar Compaction en segundo plano o actualizar índices.
  </Accordion>
</AccordionGroup>

Para el arnés Codex no ACP incluido, OpenClaw aplica el mismo ciclo de vida proyectando el contexto ensamblado en las instrucciones de desarrollador de Codex y el prompt del turno actual. Codex sigue siendo propietario de su historial de hilo nativo y de su compactador nativo.

### Ciclo de vida de subagentes (opcional)

OpenClaw llama a dos hooks opcionales del ciclo de vida de subagentes:

<ParamField path="prepareSubagentSpawn" type="method">
  Prepara el estado de contexto compartido antes de que se inicie una ejecución hija. El hook recibe claves de sesión padre/hija, `contextMode` (`isolated` o `fork`), ids/archivos de transcripción disponibles y TTL opcional. Si devuelve un identificador de reversión, OpenClaw lo llama cuando el inicio falla después de que la preparación se completa correctamente. Los inicios de subagentes nativos que solicitan `lightContext` y se resuelven como `contextMode="isolated"` omiten este hook intencionalmente para que el hijo comience desde el contexto de arranque ligero sin estado previo al inicio gestionado por el motor de contexto.
</ParamField>
<ParamField path="onSubagentEnded" type="method">
  Limpia cuando una sesión de subagente se completa o se barre.
</ParamField>

### Adición al prompt del sistema

El método `assemble` puede devolver una cadena `systemPromptAddition`. OpenClaw la antepone al prompt del sistema para la ejecución. Esto permite a los motores inyectar guías dinámicas de recuperación, instrucciones de recuperación o pistas con conocimiento del contexto sin requerir archivos estáticos del workspace.

## El motor legacy

El motor `legacy` integrado conserva el comportamiento original de OpenClaw:

- **Ingesta**: sin operación (el gestor de sesiones maneja directamente la persistencia de mensajes).
- **Ensamblaje**: paso directo (la canalización existente sanitize → validate → limit en el runtime maneja el ensamblaje de contexto).
- **Compact**: delega en la Compaction de resumen integrada, que crea un único resumen de los mensajes anteriores y mantiene intactos los mensajes recientes.
- **Después del turno**: sin operación.

El motor legacy no registra herramientas ni proporciona un `systemPromptAddition`.

Cuando no se establece `plugins.slots.contextEngine` (o se establece en `"legacy"`), este motor se usa automáticamente.

## Motores de Plugin

Un Plugin puede registrar un motor de contexto usando la API de Plugin:

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
para que los Plugins puedan inicializar estado por agente o por workspace antes de que
se ejecute el primer hook del ciclo de vida.

Luego habilítalo en la configuración:

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

| Miembro            | Tipo      | Propósito                                                    |
| ------------------ | --------- | ------------------------------------------------------------ |
| `info`             | Propiedad | Id, nombre, versión del motor y si posee la Compaction       |
| `ingest(params)`   | Método    | Almacenar un solo mensaje                                    |
| `assemble(params)` | Método    | Construir contexto para una ejecución de modelo (devuelve `AssembleResult`) |
| `compact(params)`  | Método    | Resumir/reducir contexto                                     |

`assemble` devuelve un `AssembleResult` con:

<ParamField path="messages" type="Message[]" required>
  Los mensajes ordenados que se enviarán al modelo.
</ParamField>
<ParamField path="estimatedTokens" type="number" required>
  La estimación del motor del total de tokens en el contexto ensamblado. OpenClaw usa esto para decisiones de umbral de Compaction e informes de diagnóstico.
</ParamField>
<ParamField path="systemPromptAddition" type="string">
  Antepuesto al prompt del sistema.
</ParamField>
<ParamField path="promptAuthority" type='"assembled" | "preassembly_may_overflow"'>
  Controla qué estimación de tokens usa el ejecutor para las comprobaciones
  previas preventivas de desbordamiento. El valor predeterminado es `"assembled"`,
  lo que significa que solo se comprueba la estimación del prompt ensamblado,
  apropiado para motores que devuelven un contexto acotado por ventana y
  autocontenido. Establécelo en `"preassembly_may_overflow"` solo cuando tu vista
  ensamblada pueda ocultar riesgo de desbordamiento en la transcripción
  subyacente; entonces el ejecutor toma el máximo entre la estimación ensamblada
  y la estimación del historial de sesión previa al ensamblaje (sin ventana) al
  decidir si ejecutar Compaction de forma preventiva. En cualquier caso, los
  mensajes que devuelves siguen siendo lo que ve el modelo; `promptAuthority`
  solo afecta a la comprobación previa.
</ParamField>

`compact` devuelve un `CompactResult`. Cuando la Compaction rota la transcripción
activa, `result.sessionId` y `result.sessionFile` identifican la sesión sucesora
que debe usar el siguiente reintento o turno.

Miembros opcionales:

| Miembro                        | Tipo   | Propósito                                                                                                      |
| ------------------------------ | ------ | -------------------------------------------------------------------------------------------------------------- |
| `bootstrap(params)`            | Método | Inicializar el estado del motor para una sesión. Se llama una vez cuando el motor ve una sesión por primera vez (por ejemplo, importar historial). |
| `ingestBatch(params)`          | Método | Ingerir un turno completado como lote. Se llama después de que se completa una ejecución, con todos los mensajes de ese turno a la vez. |
| `afterTurn(params)`            | Método | Trabajo del ciclo de vida posterior a la ejecución (persistir estado, activar Compaction en segundo plano). |
| `prepareSubagentSpawn(params)` | Método | Configurar estado compartido para una sesión hija antes de que empiece. |
| `onSubagentEnded(params)`      | Método | Limpiar después de que termina un subagente. |
| `dispose()`                    | Método | Liberar recursos. Se llama durante el apagado del Gateway o la recarga del Plugin, no por sesión. |

### Configuración del runtime

Los hooks del ciclo de vida que se ejecutan dentro de OpenClaw reciben un objeto
opcional `runtimeSettings`. Es una superficie de API interna versionada y de solo
lectura de productor/consumidor: OpenClaw la produce para el motor de contexto
seleccionado, y el motor de contexto la consume dentro de los hooks del ciclo de
vida. No se muestra directamente a los usuarios y no crea una superficie de
informes dedicada.

- `schemaVersion`: actualmente `1`
- `runtime`: host de OpenClaw, modo de runtime (`normal`, `fallback` o
  `degraded`) e ids opcionales de arnés/runtime
- `contextEngineSelection`: id del motor de contexto seleccionado y fuente de selección
- `executionHost`: id y etiqueta del host para la superficie que invoca el hook
- `model`: modelo solicitado, modelo resuelto, proveedor y familia de modelo opcional
- `limits`: presupuesto de tokens del prompt y tokens máximos de salida cuando se conocen
- `diagnostics`: códigos cerrados de motivo de fallback y degradado cuando se conocen

Los campos que pueden ser desconocidos se representan como `null`; los campos
discriminadores como el modo de runtime y la fuente de selección siguen siendo no
anulables. Los motores más antiguos siguen siendo compatibles: si un motor legacy
estricto rechaza `runtimeSettings` como propiedad desconocida, OpenClaw reintenta
la llamada del ciclo de vida sin ella en lugar de poner el motor en cuarentena.

### Requisitos del host

Los motores de contexto pueden declarar requisitos de capacidades del host en `info.hostRequirements`.
OpenClaw comprueba estos requisitos antes de iniciar la operación y falla de forma cerrada
con un error descriptivo cuando el runtime seleccionado no puede satisfacerlos.

Para ejecuciones de agente, declara `assemble-before-prompt` cuando el motor deba controlar el
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

Las ejecuciones de agente nativas de Codex e integradas de OpenClaw satisfacen `assemble-before-prompt`.
Los backends CLI genéricos no lo hacen, por lo que los motores que lo requieren se rechazan antes de que
se inicie el proceso CLI.

### Aislamiento de fallos

OpenClaw aísla el motor de Plugin seleccionado de la ruta principal de respuesta. Si falta un
motor no legacy, falla la validación del contrato, arroja durante la creación de la factoría
o arroja desde un método del ciclo de vida, OpenClaw pone ese motor en cuarentena
para el proceso actual del Gateway y degrada el trabajo del motor de contexto al
motor `legacy` integrado. El error se registra con la operación fallida para que el
operador pueda reparar, actualizar o deshabilitar el Plugin sin que el agente quede
en silencio.

Los fallos de requisitos del host son diferentes: cuando un motor declara que a un entorno de ejecución le falta una capacidad requerida, OpenClaw falla en modo cerrado antes de iniciar la ejecución. Eso protege a los motores que corromperían el estado si se ejecutaran en un host no compatible.

### ownsCompaction

`ownsCompaction` controla si la autocompactación integrada durante el intento del entorno de ejecución de OpenClaw permanece habilitada para la ejecución:

<AccordionGroup>
  <Accordion title="ownsCompaction: true">
    El motor controla el comportamiento de Compaction. OpenClaw deshabilita la autocompactación integrada del entorno de ejecución de OpenClaw para esa ejecución, y la implementación `compact()` del motor es responsable de `/compact`, la compactación de recuperación por desbordamiento y cualquier compactación proactiva que quiera hacer en `afterTurn()`. OpenClaw aún puede ejecutar la protección contra desbordamiento previa al prompt; cuando predice que la transcripción completa se desbordará, la ruta de recuperación llama a `compact()` del motor activo antes de enviar otro prompt.
  </Accordion>
  <Accordion title="ownsCompaction: false or unset">
    La autocompactación integrada del entorno de ejecución de OpenClaw aún puede ejecutarse durante la ejecución del prompt, pero el método `compact()` del motor activo sigue llamándose para `/compact` y la recuperación por desbordamiento.
  </Accordion>
</AccordionGroup>

<Warning>
`ownsCompaction: false` **no** significa que OpenClaw recurra automáticamente a la ruta de Compaction del motor heredado.
</Warning>

Eso significa que hay dos patrones de Plugin válidos:

<Tabs>
  <Tab title="Modo propietario">
    Implementa tu propio algoritmo de Compaction y establece `ownsCompaction: true`.
  </Tab>
  <Tab title="Modo delegado">
    Establece `ownsCompaction: false` y haz que `compact()` llame a `delegateCompactionToRuntime(...)` desde `openclaw/plugin-sdk/core` para usar el comportamiento de Compaction integrado de OpenClaw.
  </Tab>
</Tabs>

Un `compact()` sin operación no es seguro para un motor activo no propietario porque deshabilita la ruta normal de Compaction de `/compact` y recuperación por desbordamiento para ese espacio de motor.

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
El espacio es exclusivo en tiempo de ejecución: solo se resuelve un motor de contexto registrado para una ejecución u operación de Compaction determinada. Otros plugins `kind: "context-engine"` habilitados aún pueden cargarse y ejecutar su código de registro; `plugins.slots.contextEngine` solo selecciona qué id de motor registrado resuelve OpenClaw cuando necesita un motor de contexto.
</Note>

<Note>
**Desinstalación de Plugin:** cuando desinstalas el Plugin seleccionado actualmente como `plugins.slots.contextEngine`, OpenClaw restablece el espacio al valor predeterminado (`legacy`). El mismo comportamiento de restablecimiento se aplica a `plugins.slots.memory`. No se requiere editar la configuración manualmente.
</Note>

## Relación con Compaction y memoria

<AccordionGroup>
  <Accordion title="Compaction">
    Compaction es una responsabilidad del motor de contexto. El motor heredado delega en la resumición integrada de OpenClaw. Los motores de Plugin pueden implementar cualquier estrategia de Compaction (resúmenes DAG, recuperación vectorial, etc.).
  </Accordion>
  <Accordion title="Plugins de memoria">
    Los plugins de memoria (`plugins.slots.memory`) están separados de los motores de contexto. Los plugins de memoria proporcionan búsqueda/recuperación; los motores de contexto controlan lo que ve el modelo. Pueden trabajar juntos: un motor de contexto podría usar datos del plugin de memoria durante el ensamblado. Los motores de Plugin que quieran la ruta activa de prompt de memoria deberían preferir `buildMemorySystemPromptAddition(...)` desde `openclaw/plugin-sdk/core`, que convierte las secciones activas del prompt de memoria en un `systemPromptAddition` listo para anteponer. Si un motor necesita control de nivel inferior, aún puede extraer líneas sin procesar desde `openclaw/plugin-sdk/memory-host-core` mediante `buildActiveMemoryPromptSection(...)`.
  </Accordion>
  <Accordion title="Poda de sesión">
    El recorte en memoria de resultados antiguos de herramientas sigue ejecutándose independientemente de qué motor de contexto esté activo.
  </Accordion>
</AccordionGroup>

## Consejos

- Usa `openclaw doctor` para verificar que tu motor se esté cargando correctamente.
- Si cambias de motor, las sesiones existentes continúan con su historial actual. El nuevo motor toma el control para futuras ejecuciones.
- Los errores del motor se registran y el motor de Plugin seleccionado se pone en cuarentena para el proceso actual de Gateway. OpenClaw recurre a `legacy` para los turnos de usuario para que las respuestas puedan continuar, pero aun así deberías reparar, actualizar, deshabilitar o desinstalar el Plugin roto.
- Para desarrollo, usa `openclaw plugins install -l ./my-engine` para enlazar un directorio de plugin local sin copiarlo.

## Relacionado

- [Compaction](/es/concepts/compaction) - resumir conversaciones largas
- [Contexto](/es/concepts/context) - cómo se construye el contexto para los turnos del agente
- [Arquitectura de Plugin](/es/plugins/architecture) - registrar plugins de motor de contexto
- [Manifiesto de Plugin](/es/plugins/manifest) - campos del manifiesto de plugin
- [Plugins](/es/tools/plugin) - descripción general de plugins
