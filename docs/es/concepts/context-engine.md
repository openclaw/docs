---
read_when:
    - Quieres entender cómo OpenClaw ensambla el contexto del modelo
    - Estás cambiando entre el motor heredado y un motor de Plugin
    - Estás creando un Plugin de motor de contexto
sidebarTitle: Context engine
summary: 'Motor de contexto: ensamblado de contexto conectable, Compaction y ciclo de vida de subagentes'
title: Motor de contexto
x-i18n:
    generated_at: "2026-04-26T11:26:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6a362f26cde3abca7c15487fa43a411f21e3114491e27a752ca06454add60481
    source_path: concepts/context-engine.md
    workflow: 15
---

Un **motor de contexto** controla cómo OpenClaw construye el contexto del modelo para cada ejecución: qué mensajes incluir, cómo resumir el historial antiguo y cómo gestionar el contexto a través de los límites de subagentes.

OpenClaw incluye un motor `legacy` integrado y lo usa de forma predeterminada; la mayoría de los usuarios nunca necesitan cambiarlo. Instala y selecciona un motor de Plugin solo cuando quieras un comportamiento distinto de ensamblado, Compaction o recuperación entre sesiones.

## Inicio rápido

<Steps>
  <Step title="Comprueba qué motor está activo">
    ```bash
    openclaw doctor
    # o inspecciona la configuración directamente:
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
          contextEngine: "lossless-claw", // debe coincidir con el id de motor registrado del plugin
        },
        entries: {
          "lossless-claw": {
            enabled: true,
            // La configuración específica del Plugin va aquí (consulta la documentación del plugin)
          },
        },
      },
    }
    ```

    Reinicia el Gateway después de instalarlo y configurarlo.

  </Step>
  <Step title="Vuelve a legacy (opcional)">
    Establece `contextEngine` en `"legacy"` (o elimina la clave por completo; `"legacy"` es el valor predeterminado).
  </Step>
</Steps>

## Cómo funciona

Cada vez que OpenClaw ejecuta un prompt de modelo, el motor de contexto participa en cuatro puntos del ciclo de vida:

<AccordionGroup>
  <Accordion title="1. Ingesta">
    Se llama cuando se añade un mensaje nuevo a la sesión. El motor puede almacenar o indexar el mensaje en su propio almacén de datos.
  </Accordion>
  <Accordion title="2. Ensamblado">
    Se llama antes de cada ejecución del modelo. El motor devuelve un conjunto ordenado de mensajes (y un `systemPromptAddition` opcional) que caben dentro del presupuesto de tokens.
  </Accordion>
  <Accordion title="3. Compactación">
    Se llama cuando la ventana de contexto está llena, o cuando el usuario ejecuta `/compact`. El motor resume el historial antiguo para liberar espacio.
  </Accordion>
  <Accordion title="4. Después del turno">
    Se llama después de que finaliza una ejecución. El motor puede conservar el estado, activar Compaction en segundo plano o actualizar índices.
  </Accordion>
</AccordionGroup>

Para el arnés Codex incluido que no es ACP, OpenClaw aplica el mismo ciclo de vida proyectando el contexto ensamblado en las instrucciones de desarrollador de Codex y en el prompt del turno actual. Codex sigue controlando su historial nativo de hilos y su compactador nativo.

### Ciclo de vida del subagente (opcional)

OpenClaw llama a dos hooks opcionales del ciclo de vida del subagente:

<ParamField path="prepareSubagentSpawn" type="method">
  Prepara el estado de contexto compartido antes de que empiece una ejecución hija. El hook recibe claves de sesión padre/hija, `contextMode` (`isolated` o `fork`), ids/archivos de transcripción disponibles y un TTL opcional. Si devuelve un identificador de rollback, OpenClaw lo llama cuando el inicio falla después de que la preparación se haya completado correctamente.
</ParamField>
<ParamField path="onSubagentEnded" type="method">
  Limpia cuando una sesión de subagente termina o se barre.
</ParamField>

### Adición al prompt del sistema

El método `assemble` puede devolver una cadena `systemPromptAddition`. OpenClaw la antepone al prompt del sistema de la ejecución. Esto permite a los motores inyectar guías dinámicas de recuperación, instrucciones de retrieval o sugerencias sensibles al contexto sin requerir archivos estáticos del workspace.

## El motor legacy

El motor `legacy` integrado conserva el comportamiento original de OpenClaw:

- **Ingesta**: no-op (el gestor de sesiones maneja directamente la persistencia de mensajes).
- **Ensamblado**: paso directo (la canalización existente sanitize → validate → limit del runtime gestiona el ensamblado del contexto).
- **Compactación**: delega en la Compaction de resumido integrada, que crea un único resumen de los mensajes antiguos y mantiene intactos los mensajes recientes.
- **Después del turno**: no-op.

El motor legacy no registra herramientas ni proporciona `systemPromptAddition`.

Cuando no se establece `plugins.slots.contextEngine` (o se establece en `"legacy"`), este motor se usa automáticamente.

## Motores de Plugin

Un Plugin puede registrar un motor de contexto usando la API de Plugin:

```ts
import { buildMemorySystemPromptAddition } from "openclaw/plugin-sdk/core";

export default function register(api) {
  api.registerContextEngine("my-engine", () => ({
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

Miembros obligatorios:

| Miembro            | Tipo     | Propósito                                                |
| ------------------ | -------- | -------------------------------------------------------- |
| `info`             | Propiedad | ID, nombre, versión del motor y si controla la Compaction |
| `ingest(params)`   | Método   | Almacenar un único mensaje                               |
| `assemble(params)` | Método   | Construir contexto para una ejecución del modelo (devuelve `AssembleResult`) |
| `compact(params)`  | Método   | Resumir/reducir contexto                                 |

`assemble` devuelve un `AssembleResult` con:

<ParamField path="messages" type="Message[]" required>
  Los mensajes ordenados que se enviarán al modelo.
</ParamField>
<ParamField path="estimatedTokens" type="number" required>
  La estimación del motor del total de tokens en el contexto ensamblado. OpenClaw la usa para decisiones de umbral de Compaction e informes de diagnóstico.
</ParamField>
<ParamField path="systemPromptAddition" type="string">
  Se antepone al prompt del sistema.
</ParamField>

Miembros opcionales:

| Miembro                        | Tipo   | Propósito                                                                                                      |
| ----------------------------- | ------ | --------------------------------------------------------------------------------------------------------------- |
| `bootstrap(params)`           | Método | Inicializar el estado del motor para una sesión. Se llama una vez cuando el motor ve una sesión por primera vez (p. ej., importar historial). |
| `ingestBatch(params)`         | Método | Ingerir un turno completado como lote. Se llama después de que finaliza una ejecución, con todos los mensajes de ese turno de una sola vez. |
| `afterTurn(params)`           | Método | Trabajo posterior a la ejecución del ciclo de vida (conservar estado, activar Compaction en segundo plano).    |
| `prepareSubagentSpawn(params)`| Método | Configurar estado compartido para una sesión hija antes de que comience.                                       |
| `onSubagentEnded(params)`     | Método | Limpiar después de que termine un subagente.                                                                   |
| `dispose()`                   | Método | Liberar recursos. Se llama durante el apagado del Gateway o la recarga del Plugin, no por sesión.             |

### ownsCompaction

`ownsCompaction` controla si la auto-Compaction integrada de Pi dentro del intento permanece habilitada para la ejecución:

<AccordionGroup>
  <Accordion title="ownsCompaction: true">
    El motor controla el comportamiento de Compaction. OpenClaw desactiva la auto-Compaction integrada de Pi para esa ejecución, y la implementación de `compact()` del motor es responsable de `/compact`, la Compaction de recuperación por desbordamiento y cualquier Compaction proactiva que quiera hacer en `afterTurn()`. OpenClaw aún puede ejecutar la protección previa al prompt contra desbordamiento; cuando predice que la transcripción completa desbordará, la ruta de recuperación llama a `compact()` del motor activo antes de enviar otro prompt.
  </Accordion>
  <Accordion title="ownsCompaction: false or unset">
    La auto-Compaction integrada de Pi aún puede ejecutarse durante la ejecución del prompt, pero el método `compact()` del motor activo sigue llamándose para `/compact` y la recuperación por desbordamiento.
  </Accordion>
</AccordionGroup>

<Warning>
`ownsCompaction: false` **no** significa que OpenClaw vuelva automáticamente a la ruta de Compaction del motor legacy.
</Warning>

Eso significa que hay dos patrones válidos de Plugin:

<Tabs>
  <Tab title="Modo de control">
    Implementa tu propio algoritmo de Compaction y establece `ownsCompaction: true`.
  </Tab>
  <Tab title="Modo de delegación">
    Establece `ownsCompaction: false` y haz que `compact()` llame a `delegateCompactionToRuntime(...)` desde `openclaw/plugin-sdk/core` para usar el comportamiento integrado de Compaction de OpenClaw.
  </Tab>
</Tabs>

Un `compact()` no-op no es seguro para un motor activo sin control porque desactiva la ruta normal de Compaction de `/compact` y recuperación por desbordamiento para ese slot de motor.

## Referencia de configuración

```json5
{
  plugins: {
    slots: {
      // Selecciona el motor de contexto activo. Predeterminado: "legacy".
      // Establécelo en un id de plugin para usar un motor de Plugin.
      contextEngine: "legacy",
    },
  },
}
```

<Note>
El slot es exclusivo en tiempo de ejecución: solo se resuelve un motor de contexto registrado para una ejecución u operación de Compaction determinada. Otros Plugins `kind: "context-engine"` habilitados aún pueden cargarse y ejecutar su código de registro; `plugins.slots.contextEngine` solo selecciona qué id de motor registrado resuelve OpenClaw cuando necesita un motor de contexto.
</Note>

<Note>
**Desinstalación de Plugin:** cuando desinstalas el Plugin seleccionado actualmente como `plugins.slots.contextEngine`, OpenClaw restablece el slot al valor predeterminado (`legacy`). El mismo comportamiento de restablecimiento se aplica a `plugins.slots.memory`. No se requiere ninguna edición manual de configuración.
</Note>

## Relación con Compaction y memoria

<AccordionGroup>
  <Accordion title="Compaction">
    La Compaction es una de las responsabilidades del motor de contexto. El motor legacy delega en el resumido integrado de OpenClaw. Los motores de Plugin pueden implementar cualquier estrategia de Compaction (resúmenes DAG, recuperación vectorial, etc.).
  </Accordion>
  <Accordion title="Plugins de memoria">
    Los Plugins de memoria (`plugins.slots.memory`) están separados de los motores de contexto. Los Plugins de memoria proporcionan búsqueda/retrieval; los motores de contexto controlan lo que ve el modelo. Pueden funcionar juntos: un motor de contexto puede usar datos del Plugin de memoria durante el ensamblado. Los motores de Plugin que quieran la ruta activa de prompt de memoria deberían preferir `buildMemorySystemPromptAddition(...)` desde `openclaw/plugin-sdk/core`, que convierte las secciones activas del prompt de memoria en un `systemPromptAddition` listo para anteponer. Si un motor necesita un control de nivel inferior, aún puede extraer líneas sin procesar de `openclaw/plugin-sdk/memory-host-core` mediante `buildActiveMemoryPromptSection(...)`.
  </Accordion>
  <Accordion title="Poda de sesión">
    El recorte de resultados antiguos de herramientas en memoria sigue ejecutándose independientemente de qué motor de contexto esté activo.
  </Accordion>
</AccordionGroup>

## Consejos

- Usa `openclaw doctor` para verificar que tu motor se esté cargando correctamente.
- Si cambias de motor, las sesiones existentes continúan con su historial actual. El nuevo motor toma el control en futuras ejecuciones.
- Los errores del motor se registran y se muestran en los diagnósticos. Si un motor de Plugin no logra registrarse o no puede resolverse el id de motor seleccionado, OpenClaw no recurre automáticamente a otra opción; las ejecuciones fallan hasta que corrijas el Plugin o vuelvas a cambiar `plugins.slots.contextEngine` a `"legacy"`.
- Para desarrollo, usa `openclaw plugins install -l ./my-engine` para enlazar un directorio local de Plugin sin copiarlo.

## Relacionado

- [Compaction](/es/concepts/compaction) — resumir conversaciones largas
- [Contexto](/es/concepts/context) — cómo se construye el contexto para los turnos del agente
- [Arquitectura de Plugins](/es/plugins/architecture) — registrar Plugins de motor de contexto
- [Manifiesto de Plugin](/es/plugins/manifest) — campos del manifiesto del plugin
- [Plugins](/es/tools/plugin) — descripción general de Plugins
