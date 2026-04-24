---
read_when:
    - Quieres entender cómo OpenClaw ensambla el contexto del modelo
    - Estás cambiando entre el motor heredado y un motor de Plugin
    - Estás creando un Plugin de motor de contexto
summary: 'Motor de contexto: ensamblado de contexto conectable, Compaction y ciclo de vida de subagentes'
title: Motor de contexto
x-i18n:
    generated_at: "2026-04-24T05:24:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8f4e5f01f945f7fe3056587f2aa60bec607dd0dd64b29e9ab2afe8e77b5d2f1e
    source_path: concepts/context-engine.md
    workflow: 15
---

Un **motor de contexto** controla cómo OpenClaw construye el contexto del modelo para cada ejecución:
qué mensajes incluir, cómo resumir el historial anterior y cómo gestionar el
contexto a través de los límites de subagentes.

OpenClaw incluye un motor integrado `legacy` y lo usa de forma predeterminada; la mayoría de los
usuarios nunca necesitan cambiar esto. Instala y selecciona un motor de Plugin solo cuando
quieras un comportamiento diferente de ensamblado, Compaction o recuperación entre sesiones.

## Inicio rápido

Comprueba qué motor está activo:

```bash
openclaw doctor
# o inspecciona la configuración directamente:
cat ~/.openclaw/openclaw.json | jq '.plugins.slots.contextEngine'
```

### Instalar un Plugin de motor de contexto

Los Plugins de motor de contexto se instalan como cualquier otro Plugin de OpenClaw. Instálalo
primero y luego selecciona el motor en la ranura:

```bash
# Instalar desde npm
openclaw plugins install @martian-engineering/lossless-claw

# O instalar desde una ruta local (para desarrollo)
openclaw plugins install -l ./my-context-engine
```

Luego habilita el Plugin y selecciónalo como motor activo en tu configuración:

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
        // La configuración específica del Plugin va aquí (consulta la documentación del Plugin)
      },
    },
  },
}
```

Reinicia el gateway después de instalar y configurar.

Para volver al motor integrado, establece `contextEngine` en `"legacy"` (o
elimina la clave por completo; `"legacy"` es el valor predeterminado).

## Cómo funciona

Cada vez que OpenClaw ejecuta un prompt de modelo, el motor de contexto participa en
cuatro puntos del ciclo de vida:

1. **Ingest** — se llama cuando se añade un mensaje nuevo a la sesión. El motor
   puede almacenar o indexar el mensaje en su propio almacén de datos.
2. **Assemble** — se llama antes de cada ejecución del modelo. El motor devuelve un
   conjunto ordenado de mensajes (y un `systemPromptAddition` opcional) que encajan dentro
   del presupuesto de tokens.
3. **Compact** — se llama cuando la ventana de contexto está llena, o cuando el usuario ejecuta
   `/compact`. El motor resume el historial anterior para liberar espacio.
4. **After turn** — se llama después de que se completa una ejecución. El motor puede persistir el estado,
   activar Compaction en segundo plano o actualizar índices.

Para el harness Codex incluido sin ACP, OpenClaw aplica el mismo ciclo de vida
proyectando el contexto ensamblado en instrucciones de desarrollador de Codex y en el
prompt del turno actual. Codex sigue gestionando su historial nativo de hilos y su compactador nativo.

### Ciclo de vida de subagentes (opcional)

OpenClaw llama a dos hooks opcionales del ciclo de vida de subagentes:

- **prepareSubagentSpawn** — prepara el estado de contexto compartido antes de que
  comience una ejecución hija. El hook recibe las claves de sesión padre/hija, `contextMode`
  (`isolated` o `fork`), ids/archivos de transcripción disponibles y un TTL opcional.
  Si devuelve un identificador de reversión, OpenClaw lo llama cuando la creación falla después
  de que la preparación haya tenido éxito.
- **onSubagentEnded** — limpia cuando una sesión de subagente se completa o se barre.

### Adición al prompt del sistema

El método `assemble` puede devolver una cadena `systemPromptAddition`. OpenClaw
la antepone al prompt del sistema para la ejecución. Esto permite a los motores inyectar
guía dinámica de recuperación, instrucciones de recuperación o pistas sensibles al contexto
sin requerir archivos estáticos del espacio de trabajo.

## El motor heredado

El motor integrado `legacy` conserva el comportamiento original de OpenClaw:

- **Ingest**: no hace nada (el gestor de sesiones se encarga directamente de la persistencia de mensajes).
- **Assemble**: paso directo (el flujo existente sanitize → validate → limit
  en el tiempo de ejecución se encarga del ensamblado del contexto).
- **Compact**: delega en la Compaction integrada basada en resumen, que crea
  un único resumen de los mensajes anteriores y mantiene intactos los mensajes recientes.
- **After turn**: no hace nada.

El motor heredado no registra herramientas ni proporciona `systemPromptAddition`.

Cuando no se establece `plugins.slots.contextEngine` (o se establece en `"legacy"`), este
motor se usa automáticamente.

## Motores de Plugin

Un Plugin puede registrar un motor de contexto usando la API de Plugins:

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
      // Almacena el mensaje en tu almacén de datos
      return { ingested: true };
    },

    async assemble({ sessionId, messages, tokenBudget, availableTools, citationsMode }) {
      // Devuelve mensajes que encajan en el presupuesto
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
      // Resume el contexto anterior
      return { ok: true, compacted: true };
    },
  }));
}
```

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

| Miembro           | Tipo     | Propósito                                                |
| ----------------- | -------- | -------------------------------------------------------- |
| `info`            | Propiedad | Id, nombre, versión del motor y si gestiona Compaction   |
| `ingest(params)`  | Método   | Almacenar un solo mensaje                                |
| `assemble(params)`| Método   | Construir contexto para una ejecución de modelo (devuelve `AssembleResult`) |
| `compact(params)` | Método   | Resumir/reducir contexto                                 |

`assemble` devuelve un `AssembleResult` con:

- `messages` — los mensajes ordenados que se enviarán al modelo.
- `estimatedTokens` (obligatorio, `number`) — la estimación del motor del total de
  tokens en el contexto ensamblado. OpenClaw usa esto para decisiones de umbral de Compaction
  e informes de diagnóstico.
- `systemPromptAddition` (opcional, `string`) — se antepone al prompt del sistema.

Miembros opcionales:

| Miembro                        | Tipo   | Propósito                                                                                                        |
| ----------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------- |
| `bootstrap(params)`           | Método | Inicializar el estado del motor para una sesión. Se llama una vez cuando el motor ve por primera vez una sesión (por ejemplo, importar historial). |
| `ingestBatch(params)`         | Método | Ingerir un turno completado como lote. Se llama después de completar una ejecución, con todos los mensajes de ese turno a la vez. |
| `afterTurn(params)`           | Método | Trabajo del ciclo de vida posterior a la ejecución (persistir estado, activar Compaction en segundo plano).      |
| `prepareSubagentSpawn(params)`| Método | Configurar estado compartido para una sesión hija antes de que empiece.                                          |
| `onSubagentEnded(params)`     | Método | Limpiar después de que finalice un subagente.                                                                    |
| `dispose()`                   | Método | Liberar recursos. Se llama durante el apagado del gateway o la recarga del Plugin, no por sesión.               |

### ownsCompaction

`ownsCompaction` controla si la auto-Compaction integrada de Pi dentro del intento sigue
habilitada para la ejecución:

- `true` — el motor gestiona el comportamiento de Compaction. OpenClaw desactiva la
  auto-Compaction integrada de Pi para esa ejecución, y la implementación `compact()` del motor es
  responsable de `/compact`, Compaction de recuperación por desbordamiento y cualquier
  Compaction proactiva que quiera hacer en `afterTurn()`.
- `false` o sin establecer — la auto-Compaction integrada de Pi aún puede ejecutarse durante la
  ejecución del prompt, pero el método `compact()` del motor activo sigue llamándose para
  `/compact` y la recuperación por desbordamiento.

`ownsCompaction: false` **no** significa que OpenClaw recurra automáticamente a
la ruta de Compaction del motor heredado.

Eso significa que hay dos patrones válidos de Plugin:

- **Modo propietario** — implementa tu propio algoritmo de Compaction y establece
  `ownsCompaction: true`.
- **Modo de delegación** — establece `ownsCompaction: false` y haz que `compact()` llame
  a `delegateCompactionToRuntime(...)` desde `openclaw/plugin-sdk/core` para usar
  el comportamiento de Compaction integrado de OpenClaw.

Un `compact()` que no haga nada es inseguro para un motor activo no propietario porque
desactiva la ruta normal de `/compact` y de Compaction de recuperación por desbordamiento para esa
ranura de motor.

## Referencia de configuración

```json5
{
  plugins: {
    slots: {
      // Selecciona el motor de contexto activo. Predeterminado: "legacy".
      // Establécelo en un id de Plugin para usar un motor de Plugin.
      contextEngine: "legacy",
    },
  },
}
```

La ranura es exclusiva en tiempo de ejecución: solo se resuelve un motor de contexto registrado
para una ejecución u operación de Compaction determinada. Otros
Plugins `kind: "context-engine"` habilitados pueden seguir cargándose y ejecutar su código
de registro; `plugins.slots.contextEngine` solo selecciona qué id de motor registrado
resuelve OpenClaw cuando necesita un motor de contexto.

## Relación con Compaction y Memoria

- **Compaction** es una responsabilidad del motor de contexto. El motor heredado
  delega en la resumización integrada de OpenClaw. Los motores de Plugin pueden implementar
  cualquier estrategia de Compaction (resúmenes DAG, recuperación vectorial, etc.).
- **Plugins de Memoria** (`plugins.slots.memory`) están separados de los motores de contexto.
  Los Plugins de memoria proporcionan búsqueda/recuperación; los motores de contexto controlan qué ve
  el modelo. Pueden trabajar juntos: un motor de contexto podría usar datos del
  Plugin de memoria durante el ensamblado. Los motores de Plugin que quieran la ruta
  activa del prompt de memoria deberían preferir `buildMemorySystemPromptAddition(...)` de
  `openclaw/plugin-sdk/core`, que convierte las secciones activas del prompt de memoria
  en un `systemPromptAddition` listo para anteponer. Si un motor necesita un control
  de más bajo nivel, aún puede obtener líneas sin procesar de
  `openclaw/plugin-sdk/memory-host-core` mediante
  `buildActiveMemoryPromptSection(...)`.
- **Poda de sesión** (recorte en memoria de resultados de herramientas antiguos) sigue ejecutándose
  independientemente del motor de contexto activo.

## Consejos

- Usa `openclaw doctor` para verificar que tu motor se está cargando correctamente.
- Si cambias de motor, las sesiones existentes continúan con su historial actual.
  El nuevo motor toma el control para futuras ejecuciones.
- Los errores del motor se registran y se muestran en diagnósticos. Si un motor de Plugin
  no se registra correctamente o no se puede resolver el id de motor seleccionado, OpenClaw
  no recurre automáticamente a otro; las ejecuciones fallan hasta que corrijas el Plugin o
  vuelvas a cambiar `plugins.slots.contextEngine` a `"legacy"`.
- Para desarrollo, usa `openclaw plugins install -l ./my-engine` para enlazar un
  directorio local de Plugin sin copiarlo.

Consulta también: [Compaction](/es/concepts/compaction), [Contexto](/es/concepts/context),
[Plugins](/es/tools/plugin), [Manifiesto de Plugin](/es/plugins/manifest).

## Relacionado

- [Contexto](/es/concepts/context) — cómo se construye el contexto para los turnos del agente
- [Arquitectura de Plugins](/es/plugins/architecture) — registrar Plugins de motor de contexto
- [Compaction](/es/concepts/compaction) — resumir conversaciones largas
