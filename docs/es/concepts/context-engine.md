---
read_when:
    - Quieres comprender cómo OpenClaw compone el contexto del modelo
    - Está cambiando entre el motor heredado y un motor de Plugin
    - Estás creando un Plugin de motor de contexto
sidebarTitle: Context engine
summary: 'Motor de contexto: ensamblaje de contexto conectable, Compaction y ciclo de vida de subagentes'
title: Motor de contexto
x-i18n:
    generated_at: "2026-05-02T05:24:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: e7477dd1d48f9633586dce67204912a810e0931d7bc9f2d6719ba465fe19681b
    source_path: concepts/context-engine.md
    workflow: 16
---

Un **motor de contexto** controla cómo OpenClaw construye el contexto del modelo para cada ejecución: qué mensajes incluir, cómo resumir el historial más antiguo y cómo gestionar el contexto entre límites de subagentes.

OpenClaw incluye un motor integrado `legacy` y lo usa de forma predeterminada; la mayoría de los usuarios nunca necesitan cambiarlo. Instala y selecciona un motor de Plugin solo cuando quieras un comportamiento diferente de ensamblaje, Compaction o recuperación entre sesiones.

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
    Se llama cuando se añade un mensaje nuevo a la sesión. El motor puede almacenar o indexar el mensaje en su propio almacén de datos.
  </Accordion>
  <Accordion title="2. Ensamblaje">
    Se llama antes de cada ejecución del modelo. El motor devuelve un conjunto ordenado de mensajes (y un `systemPromptAddition` opcional) que encajan dentro del presupuesto de tokens.
  </Accordion>
  <Accordion title="3. Compactar">
    Se llama cuando la ventana de contexto está llena, o cuando el usuario ejecuta `/compact`. El motor resume el historial más antiguo para liberar espacio.
  </Accordion>
  <Accordion title="4. Después del turno">
    Se llama después de que una ejecución finaliza. El motor puede persistir estado, activar Compaction en segundo plano o actualizar índices.
  </Accordion>
</AccordionGroup>

Para el arnés Codex no ACP incluido, OpenClaw aplica el mismo ciclo de vida proyectando el contexto ensamblado en las instrucciones de desarrollador de Codex y el prompt del turno actual. Codex sigue siendo propietario de su historial nativo de hilos y de su compactador nativo.

### Ciclo de vida de subagente (opcional)

OpenClaw llama a dos hooks opcionales del ciclo de vida de subagente:

<ParamField path="prepareSubagentSpawn" type="method">
  Prepara el estado de contexto compartido antes de que comience una ejecución hija. El hook recibe claves de sesión padre/hija, `contextMode` (`isolated` o `fork`), ids/archivos de transcripción disponibles y TTL opcional. Si devuelve un identificador de reversión, OpenClaw lo llama cuando el inicio falla después de que la preparación se completa correctamente.
</ParamField>
<ParamField path="onSubagentEnded" type="method">
  Limpia cuando una sesión de subagente se completa o se barre.
</ParamField>

### Adición al prompt del sistema

El método `assemble` puede devolver una cadena `systemPromptAddition`. OpenClaw antepone esto al prompt del sistema de la ejecución. Esto permite a los motores inyectar guía dinámica de recuperación, instrucciones de recuperación o pistas sensibles al contexto sin requerir archivos estáticos del espacio de trabajo.

## El motor legacy

El motor integrado `legacy` preserva el comportamiento original de OpenClaw:

- **Ingesta**: sin operación (el gestor de sesiones maneja directamente la persistencia de mensajes).
- **Ensamblaje**: paso directo (la canalización existente de sanear → validar → limitar en el runtime gestiona el ensamblaje de contexto).
- **Compactar**: delega en la Compaction de resumen integrada, que crea un único resumen de los mensajes más antiguos y mantiene intactos los mensajes recientes.
- **Después del turno**: sin operación.

El motor legacy no registra herramientas ni proporciona `systemPromptAddition`.

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

La fábrica `ctx` incluye valores opcionales `config`, `agentDir` y `workspaceDir`
para que los plugins puedan inicializar estado por agente o por espacio de trabajo antes de que se ejecute
el primer hook del ciclo de vida.

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

| Miembro            | Tipo      | Propósito                                                   |
| ------------------ | --------- | ----------------------------------------------------------- |
| `info`             | Propiedad | Id, nombre, versión del motor y si posee la Compaction      |
| `ingest(params)`   | Método    | Almacenar un único mensaje                                  |
| `assemble(params)` | Método    | Construir contexto para una ejecución de modelo (devuelve `AssembleResult`) |
| `compact(params)`  | Método    | Resumir/reducir contexto                                    |

`assemble` devuelve un `AssembleResult` con:

<ParamField path="messages" type="Message[]" required>
  Los mensajes ordenados para enviar al modelo.
</ParamField>
<ParamField path="estimatedTokens" type="number" required>
  La estimación del motor del total de tokens en el contexto ensamblado. OpenClaw usa esto para decisiones de umbral de Compaction e informes de diagnóstico.
</ParamField>
<ParamField path="systemPromptAddition" type="string">
  Antepuesto al prompt del sistema.
</ParamField>
<ParamField path="promptAuthority" type='"assembled" | "preassembly_may_overflow"'>
  Controla qué estimación de tokens usa el ejecutor para las
  comprobaciones preventivas de desbordamiento. El valor predeterminado es `"assembled"`, lo que significa que solo se comprueba
  la estimación del prompt ensamblado, apropiado para motores que devuelven un
  contexto con ventana y autocontenido. Establécelo en `"preassembly_may_overflow"` solo
  cuando tu vista ensamblada pueda ocultar riesgo de desbordamiento en la
  transcripción subyacente; entonces el ejecutor toma el máximo entre la estimación ensamblada
  y la estimación del historial de sesión previa al ensamblaje (sin ventana) al decidir
  si compactar preventivamente. En cualquier caso, los mensajes que devuelves son
  los que el modelo ve; `promptAuthority` solo afecta a la comprobación previa.
</ParamField>

`compact` devuelve un `CompactResult`. Cuando la Compaction rota la
transcripción activa, `result.sessionId` y `result.sessionFile` identifican la sesión sucesora
que debe usar el siguiente reintento o turno.

Miembros opcionales:

| Miembro                        | Tipo   | Propósito                                                                                                      |
| ------------------------------ | ------ | -------------------------------------------------------------------------------------------------------------- |
| `bootstrap(params)`            | Método | Inicializar el estado del motor para una sesión. Se llama una vez cuando el motor ve una sesión por primera vez (por ejemplo, importar historial). |
| `ingestBatch(params)`          | Método | Ingerir un turno completado como lote. Se llama después de que una ejecución finaliza, con todos los mensajes de ese turno a la vez. |
| `afterTurn(params)`            | Método | Trabajo de ciclo de vida posterior a la ejecución (persistir estado, activar Compaction en segundo plano). |
| `prepareSubagentSpawn(params)` | Método | Configurar estado compartido para una sesión hija antes de que comience. |
| `onSubagentEnded(params)`      | Método | Limpiar después de que un subagente termina. |
| `dispose()`                    | Método | Liberar recursos. Se llama durante el apagado del Gateway o la recarga del Plugin, no por sesión. |

### ownsCompaction

`ownsCompaction` controla si la autocompactación integrada de Pi dentro del intento permanece habilitada para la ejecución:

<AccordionGroup>
  <Accordion title="ownsCompaction: true">
    El motor posee el comportamiento de Compaction. OpenClaw deshabilita la autocompactación integrada de Pi para esa ejecución, y la implementación `compact()` del motor es responsable de `/compact`, la Compaction de recuperación de desbordamiento y cualquier Compaction proactiva que quiera hacer en `afterTurn()`. OpenClaw aún puede ejecutar la protección de desbordamiento previa al prompt; cuando predice que la transcripción completa se desbordará, la ruta de recuperación llama al `compact()` del motor activo antes de enviar otro prompt.
  </Accordion>
  <Accordion title="ownsCompaction: false o sin establecer">
    La autocompactación integrada de Pi aún puede ejecutarse durante la ejecución del prompt, pero el método `compact()` del motor activo sigue llamándose para `/compact` y la recuperación de desbordamiento.
  </Accordion>
</AccordionGroup>

<Warning>
`ownsCompaction: false` **no** significa que OpenClaw vuelva automáticamente a la ruta de Compaction del motor legacy.
</Warning>

Eso significa que hay dos patrones válidos de Plugin:

<Tabs>
  <Tab title="Modo propietario">
    Implementa tu propio algoritmo de Compaction y establece `ownsCompaction: true`.
  </Tab>
  <Tab title="Modo delegado">
    Establece `ownsCompaction: false` y haz que `compact()` llame a `delegateCompactionToRuntime(...)` desde `openclaw/plugin-sdk/core` para usar el comportamiento de Compaction integrado de OpenClaw.
  </Tab>
</Tabs>

Un `compact()` sin operación no es seguro para un motor activo no propietario porque deshabilita la ruta normal de Compaction de `/compact` y de recuperación de desbordamiento para ese slot de motor.

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
El slot es exclusivo en tiempo de ejecución: solo se resuelve un motor de contexto registrado para una ejecución u operación de Compaction determinada. Otros plugins habilitados `kind: "context-engine"` todavía pueden cargarse y ejecutar su código de registro; `plugins.slots.contextEngine` solo selecciona qué id de motor registrado resuelve OpenClaw cuando necesita un motor de contexto.
</Note>

<Note>
**Desinstalación de Plugin:** cuando desinstalas el Plugin seleccionado actualmente como `plugins.slots.contextEngine`, OpenClaw restablece el slot al valor predeterminado (`legacy`). El mismo comportamiento de restablecimiento se aplica a `plugins.slots.memory`. No se requiere ninguna edición manual de configuración.
</Note>

## Relación con Compaction y memoria

<AccordionGroup>
  <Accordion title="Compaction">
    Compaction es una responsabilidad del motor de contexto. El motor heredado delega en el resumen integrado de OpenClaw. Los motores de plugins pueden implementar cualquier estrategia de Compaction (resúmenes DAG, recuperación vectorial, etc.).
  </Accordion>
  <Accordion title="Plugins de memoria">
    Los plugins de memoria (`plugins.slots.memory`) son independientes de los motores de contexto. Los plugins de memoria proporcionan búsqueda/recuperación; los motores de contexto controlan lo que ve el modelo. Pueden funcionar juntos: un motor de contexto podría usar datos de plugins de memoria durante el ensamblaje. Los motores de plugins que quieran la ruta de prompt de Active Memory deberían preferir `buildMemorySystemPromptAddition(...)` de `openclaw/plugin-sdk/core`, que convierte las secciones de prompt de Active Memory en un `systemPromptAddition` listo para anteponer. Si un motor necesita un control de nivel más bajo, aún puede extraer líneas sin procesar de `openclaw/plugin-sdk/memory-host-core` mediante `buildActiveMemoryPromptSection(...)`.
  </Accordion>
  <Accordion title="Poda de sesiones">
    El recorte en memoria de resultados antiguos de herramientas sigue ejecutándose independientemente del motor de contexto que esté activo.
  </Accordion>
</AccordionGroup>

## Consejos

- Usa `openclaw doctor` para verificar que tu motor se esté cargando correctamente.
- Si cambias de motor, las sesiones existentes continúan con su historial actual. El nuevo motor toma el control para futuras ejecuciones.
- Los errores del motor se registran y se muestran en los diagnósticos. Si un motor de plugin no logra registrarse o el id del motor seleccionado no se puede resolver, OpenClaw no vuelve automáticamente al anterior; las ejecuciones fallan hasta que corrijas el plugin o cambies `plugins.slots.contextEngine` de nuevo a `"legacy"`.
- Para el desarrollo, usa `openclaw plugins install -l ./my-engine` para enlazar un directorio de plugin local sin copiarlo.

## Relacionado

- [Compaction](/es/concepts/compaction) — resumen de conversaciones largas
- [Contexto](/es/concepts/context) — cómo se crea el contexto para los turnos de agente
- [Arquitectura de Plugin](/es/plugins/architecture) — registro de plugins de motor de contexto
- [Manifiesto de plugin](/es/plugins/manifest) — campos del manifiesto de plugin
- [Plugins](/es/tools/plugin) — descripción general de plugins
