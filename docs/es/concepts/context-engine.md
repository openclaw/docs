---
read_when:
    - Quieres entender cómo OpenClaw ensambla el contexto del modelo
    - Está alternando entre el motor heredado y un motor de Plugin
    - Estás creando un Plugin de motor de contexto
sidebarTitle: Context engine
summary: 'Motor de contexto: ensamblaje de contexto conectable, Compaction y ciclo de vida de subagentes'
title: Motor de contexto
x-i18n:
    generated_at: "2026-04-30T05:36:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8f192c6b28ad2b5960b504811926fb5e30fe8da9d985d8eec3ad4b65c9f7cae5
    source_path: concepts/context-engine.md
    workflow: 16
---

Un **motor de contexto** controla cómo OpenClaw construye el contexto del modelo para cada ejecución: qué mensajes incluir, cómo resumir el historial anterior y cómo gestionar el contexto a través de los límites de subagentes.

OpenClaw incluye un motor `legacy` integrado y lo usa de forma predeterminada; la mayoría de los usuarios nunca necesita cambiar esto. Instala y selecciona un motor Plugin solo cuando quieras un comportamiento diferente de ensamblado, Compaction o recuperación entre sesiones.

## Inicio rápido

<Steps>
  <Step title="Comprobar qué motor está activo">
    ```bash
    openclaw doctor
    # or inspect config directly:
    cat ~/.openclaw/openclaw.json | jq '.plugins.slots.contextEngine'
    ```
  </Step>
  <Step title="Instalar un motor Plugin">
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
  <Step title="Habilitar y seleccionar el motor">
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
  <Step title="Volver a legacy (opcional)">
    Establece `contextEngine` en `"legacy"` (o elimina la clave por completo; `"legacy"` es el valor predeterminado).
  </Step>
</Steps>

## Cómo funciona

Cada vez que OpenClaw ejecuta un prompt de modelo, el motor de contexto participa en cuatro puntos del ciclo de vida:

<AccordionGroup>
  <Accordion title="1. Ingesta">
    Se llama cuando se agrega un mensaje nuevo a la sesión. El motor puede almacenar o indexar el mensaje en su propio almacén de datos.
  </Accordion>
  <Accordion title="2. Ensamblar">
    Se llama antes de cada ejecución del modelo. El motor devuelve un conjunto ordenado de mensajes (y un `systemPromptAddition` opcional) que encajan dentro del presupuesto de tokens.
  </Accordion>
  <Accordion title="3. Compactar">
    Se llama cuando la ventana de contexto está llena, o cuando el usuario ejecuta `/compact`. El motor resume el historial anterior para liberar espacio.
  </Accordion>
  <Accordion title="4. Después del turno">
    Se llama después de que finaliza una ejecución. El motor puede persistir el estado, activar Compaction en segundo plano o actualizar índices.
  </Accordion>
</AccordionGroup>

Para el arnés Codex no ACP incluido, OpenClaw aplica el mismo ciclo de vida proyectando el contexto ensamblado en las instrucciones de desarrollador de Codex y el prompt del turno actual. Codex sigue siendo propietario de su historial de hilo nativo y su compactador nativo.

### Ciclo de vida del subagente (opcional)

OpenClaw llama a dos hooks opcionales del ciclo de vida del subagente:

<ParamField path="prepareSubagentSpawn" type="method">
  Prepara el estado de contexto compartido antes de que se inicie una ejecución secundaria. El hook recibe claves de sesión padre/hijo, `contextMode` (`isolated` o `fork`), ids/archivos de transcripción disponibles y TTL opcional. Si devuelve un identificador de reversión, OpenClaw lo llama cuando el spawn falla después de que la preparación se completa correctamente.
</ParamField>
<ParamField path="onSubagentEnded" type="method">
  Limpia cuando una sesión de subagente se completa o se barre.
</ParamField>

### Adición al prompt del sistema

El método `assemble` puede devolver una cadena `systemPromptAddition`. OpenClaw antepone esto al prompt del sistema de la ejecución. Esto permite que los motores inyecten guía dinámica de recuperación, instrucciones de recuperación o pistas conscientes del contexto sin requerir archivos estáticos del espacio de trabajo.

## El motor legacy

El motor `legacy` integrado conserva el comportamiento original de OpenClaw:

- **Ingesta**: sin operación (el gestor de sesiones maneja directamente la persistencia de mensajes).
- **Ensamblar**: paso directo (la canalización existente de sanitizar → validar → limitar en el runtime maneja el ensamblado del contexto).
- **Compactar**: delega en la Compaction de resumen integrada, que crea un único resumen de los mensajes anteriores y mantiene intactos los mensajes recientes.
- **Después del turno**: sin operación.

El motor legacy no registra herramientas ni proporciona un `systemPromptAddition`.

Cuando no se establece `plugins.slots.contextEngine` (o se establece en `"legacy"`), este motor se usa automáticamente.

## Motores Plugin

Un Plugin puede registrar un motor de contexto usando la API del Plugin:

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

La fábrica `ctx` incluye valores opcionales `config`, `agentDir` y `workspaceDir`
para que los Plugins puedan inicializar estado por agente o por espacio de trabajo antes de que se ejecute el
primer hook del ciclo de vida.

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

| Miembro            | Tipo      | Propósito                                                |
| ------------------ | --------- | -------------------------------------------------------- |
| `info`             | Propiedad | Id, nombre, versión del motor y si posee la Compaction   |
| `ingest(params)`   | Método    | Almacenar un solo mensaje                                |
| `assemble(params)` | Método    | Construir contexto para una ejecución de modelo (devuelve `AssembleResult`) |
| `compact(params)`  | Método    | Resumir/reducir contexto                                 |

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

`compact` devuelve un `CompactResult`. Cuando la Compaction rota la transcripción activa, `result.sessionId` y `result.sessionFile` identifican la sesión sucesora que debe usar el siguiente reintento o turno.

Miembros opcionales:

| Miembro                        | Tipo   | Propósito                                                                                                       |
| ------------------------------ | ------ | --------------------------------------------------------------------------------------------------------------- |
| `bootstrap(params)`            | Método | Inicializar el estado del motor para una sesión. Se llama una vez cuando el motor ve una sesión por primera vez (por ejemplo, importar historial). |
| `ingestBatch(params)`          | Método | Ingerir un turno completado como lote. Se llama después de que finaliza una ejecución, con todos los mensajes de ese turno a la vez. |
| `afterTurn(params)`            | Método | Trabajo de ciclo de vida posterior a la ejecución (persistir estado, activar Compaction en segundo plano).      |
| `prepareSubagentSpawn(params)` | Método | Configurar estado compartido para una sesión secundaria antes de que empiece.                                    |
| `onSubagentEnded(params)`      | Método | Limpiar después de que finaliza un subagente.                                                                    |
| `dispose()`                    | Método | Liberar recursos. Se llama durante el apagado del Gateway o la recarga del Plugin; no por sesión.               |

### ownsCompaction

`ownsCompaction` controla si la Compaction automática integrada durante el intento de Pi permanece habilitada para la ejecución:

<AccordionGroup>
  <Accordion title="ownsCompaction: true">
    El motor es propietario del comportamiento de Compaction. OpenClaw deshabilita la Compaction automática integrada de Pi para esa ejecución, y la implementación `compact()` del motor es responsable de `/compact`, la Compaction de recuperación por desbordamiento y cualquier Compaction proactiva que quiera hacer en `afterTurn()`. OpenClaw aún puede ejecutar la protección previa al prompt contra desbordamiento; cuando predice que la transcripción completa se desbordará, la ruta de recuperación llama al `compact()` del motor activo antes de enviar otro prompt.
  </Accordion>
  <Accordion title="ownsCompaction: false o sin establecer">
    La Compaction automática integrada de Pi aún puede ejecutarse durante la ejecución del prompt, pero el método `compact()` del motor activo todavía se llama para `/compact` y la recuperación por desbordamiento.
  </Accordion>
</AccordionGroup>

<Warning>
`ownsCompaction: false` **no** significa que OpenClaw vuelva automáticamente a la ruta de Compaction del motor legacy.
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

Un `compact()` sin operación no es seguro para un motor activo que no es propietario porque deshabilita la ruta normal de Compaction de `/compact` y recuperación por desbordamiento para esa ranura de motor.

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
La ranura es exclusiva en tiempo de ejecución: solo se resuelve un motor de contexto registrado para una ejecución u operación de Compaction determinada. Otros Plugins `kind: "context-engine"` habilitados aún pueden cargarse y ejecutar su código de registro; `plugins.slots.contextEngine` solo selecciona qué id de motor registrado resuelve OpenClaw cuando necesita un motor de contexto.
</Note>

<Note>
**Desinstalación de Plugin:** cuando desinstalas el Plugin seleccionado actualmente como `plugins.slots.contextEngine`, OpenClaw restablece la ranura al valor predeterminado (`legacy`). El mismo comportamiento de restablecimiento se aplica a `plugins.slots.memory`. No se requiere edición manual de la configuración.
</Note>

## Relación con Compaction y memoria

<AccordionGroup>
  <Accordion title="Compaction">
    Compaction es una responsabilidad del motor de contexto. El motor heredado delega en la resumición integrada de OpenClaw. Los motores de Plugin pueden implementar cualquier estrategia de Compaction (resúmenes DAG, recuperación vectorial, etc.).
  </Accordion>
  <Accordion title="Plugins de memoria">
    Los plugins de memoria (`plugins.slots.memory`) están separados de los motores de contexto. Los plugins de memoria proporcionan búsqueda/recuperación; los motores de contexto controlan lo que ve el modelo. Pueden trabajar juntos: un motor de contexto podría usar datos de un plugin de memoria durante el ensamblaje. Los motores de Plugin que quieran la ruta de prompt de memoria activa deberían preferir `buildMemorySystemPromptAddition(...)` de `openclaw/plugin-sdk/core`, que convierte las secciones del prompt de memoria activa en un `systemPromptAddition` listo para anteponer. Si un motor necesita control de nivel inferior, aún puede extraer líneas sin procesar de `openclaw/plugin-sdk/memory-host-core` mediante `buildActiveMemoryPromptSection(...)`.
  </Accordion>
  <Accordion title="Poda de sesiones">
    El recorte de resultados antiguos de herramientas en memoria sigue ejecutándose independientemente de qué motor de contexto esté activo.
  </Accordion>
</AccordionGroup>

## Consejos

- Usa `openclaw doctor` para verificar que tu motor se esté cargando correctamente.
- Si cambias de motor, las sesiones existentes continúan con su historial actual. El nuevo motor toma el control para ejecuciones futuras.
- Los errores del motor se registran y se muestran en los diagnósticos. Si un motor de Plugin no logra registrarse o no se puede resolver el id del motor seleccionado, OpenClaw no recurre automáticamente a una alternativa; las ejecuciones fallan hasta que corrijas el plugin o vuelvas a cambiar `plugins.slots.contextEngine` a `"legacy"`.
- Para el desarrollo, usa `openclaw plugins install -l ./my-engine` para vincular un directorio local de plugin sin copiarlo.

## Relacionado

- [Compaction](/es/concepts/compaction) — resumir conversaciones largas
- [Contexto](/es/concepts/context) — cómo se construye el contexto para los turnos de agente
- [Arquitectura de Plugin](/es/plugins/architecture) — registrar plugins de motor de contexto
- [Manifiesto de Plugin](/es/plugins/manifest) — campos del manifiesto de plugin
- [Plugins](/es/tools/plugin) — descripción general de plugins
