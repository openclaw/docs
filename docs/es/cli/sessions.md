---
read_when:
    - Quieres enumerar las sesiones almacenadas y ver la actividad reciente
summary: Referencia de la CLI para `openclaw sessions` (mostrar las sesiones almacenadas y el uso)
title: Sesiones
x-i18n:
    generated_at: "2026-07-12T14:23:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 29820bd34035ba3a6539950bd18dc671739eaeee9ddea3d57455c16b945caffa
    source_path: cli/sessions.md
    workflow: 16
---

# `openclaw sessions`

Enumera las sesiones de conversación almacenadas.

Las listas de sesiones no son comprobaciones de disponibilidad de canales o proveedores. Muestran las filas de conversación persistidas en los almacenes de sesiones. Un canal de Discord, Slack, Telegram u otro canal inactivo puede volver a conectarse correctamente sin crear una nueva fila de sesión hasta que se procese un mensaje. Use `openclaw channels status --probe`, `openclaw status --deep` u `openclaw health --verbose` cuando necesite comprobar la conectividad del canal en tiempo real.

```bash
openclaw sessions
openclaw sessions --agent work
openclaw sessions --all-agents
openclaw sessions --active 120
openclaw sessions --limit 25
openclaw sessions --store ./tmp/sessions.json
openclaw sessions --json
```

Opciones:

| Opción               | Descripción                                                                                      |
| -------------------- | ------------------------------------------------------------------------------------------------ |
| `--agent <id>`       | Un almacén de agente configurado (valor predeterminado: el agente predeterminado configurado).   |
| `--all-agents`       | Agrega todos los almacenes de agentes configurados.                                              |
| `--store <path>`     | Ruta explícita del almacén (no se puede combinar con `--agent` ni `--all-agents`).                |
| `--active <minutes>` | Muestra solo las sesiones actualizadas durante los últimos N minutos.                            |
| `--limit <n\|all>`   | Número máximo de filas que se generarán (valor predeterminado: `100`; `all` restaura la salida completa). |
| `--json`             | Salida legible por máquina.                                                                      |
| `--verbose`          | Registro detallado.                                                                              |

`openclaw sessions` y la RPC `sessions.list` del Gateway están limitados de forma predeterminada para que los almacenes grandes y de larga duración no puedan monopolizar el proceso de la CLI ni el bucle de eventos del Gateway. La CLI devuelve de forma predeterminada las 100 sesiones más recientes; pase `--limit <n>` para obtener un intervalo menor o mayor, o `--limit all` cuando necesite intencionadamente el almacén completo. Las respuestas JSON incluyen `totalCount`, `limitApplied` y `hasMore` cuando los consumidores necesitan indicar que existen más filas.

Los clientes RPC pueden pasar `configuredAgentsOnly: true` para conservar la amplia fuente de detección combinada, pero devolver solo las filas de los agentes que actualmente figuran en la configuración. Control UI usa ese modo de forma predeterminada para que los almacenes de agentes eliminados o presentes únicamente en disco no vuelvan a aparecer en la vista de sesiones.

`--all-agents` lee los almacenes de agentes configurados. La detección de sesiones del Gateway y ACP es más amplia: también incluye los almacenes SQLite resueltos a partir de las raíces de agentes configuradas o de una raíz `session.store` basada en una plantilla. Las rutas de selectores heredadas deben resolverse dentro de la raíz del agente; se omiten los enlaces simbólicos y las rutas externas a la raíz.

`openclaw sessions --all-agents --json`:

```json
{
  "path": null,
  "stores": [
    { "agentId": "main", "path": "/home/user/.openclaw/agents/main/sessions/sessions.json" },
    { "agentId": "work", "path": "/home/user/.openclaw/agents/work/sessions/sessions.json" }
  ],
  "allAgents": true,
  "count": 2,
  "totalCount": 2,
  "limitApplied": 100,
  "hasMore": false,
  "activeMinutes": null,
  "sessions": [
    { "agentId": "main", "key": "agent:main:main", "model": "openai/gpt-5.6-sol" },
    { "agentId": "work", "key": "agent:work:main", "model": "anthropic/claude-sonnet-4-6" }
  ]
}
```

## Seguir el progreso de la trayectoria

```bash
openclaw sessions tail
openclaw sessions tail --follow
openclaw sessions tail --session-key "agent:main:telegram:direct:123" --tail 25
openclaw sessions --agent work tail --follow
openclaw sessions --all-agents tail --follow
```

`openclaw sessions tail` representa los eventos recientes de la trayectoria de ejecución como líneas de progreso compactas. Sin `--session-key`, sigue primero las sesiones en ejecución y después la sesión almacenada más reciente. `--tail <count>` controla cuántos eventos existentes se imprimen antes del modo de seguimiento; el valor predeterminado es `80`, y `0` comienza en el final actual. `--follow` continúa observando la sesión seleccionada respaldada por SQLite o un archivo de trayectoria heredado explícito.

La vista de progreso es deliberadamente conservadora: no se imprimen el texto de los prompts, los argumentos de las herramientas ni el contenido de los resultados de las herramientas. Las llamadas a herramientas muestran el nombre de la herramienta con `{...redacted...}`; los resultados de las herramientas muestran estados como `ok`, `error` o `done`; las líneas de finalización del modelo muestran el proveedor/modelo y el estado final.

## Exportar un paquete de trayectoria

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --output bug-123 --json
```

Esta es la ruta de comandos que utiliza el comando de barra diagonal `/export-trajectory` después de que
el propietario aprueba la solicitud de ejecución. El directorio de salida siempre se resuelve
dentro de `.openclaw/trajectory-exports/`, en el espacio de trabajo seleccionado.

## Mantenimiento de limpieza

Ejecute el mantenimiento ahora en lugar de esperar al siguiente ciclo de escritura:

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --agent work --dry-run
openclaw sessions cleanup --all-agents --dry-run
openclaw sessions cleanup --enforce
openclaw sessions cleanup --enforce --active-key "agent:main:telegram:direct:123"
openclaw sessions cleanup --dry-run --fix-dm-scope
openclaw sessions cleanup --json
```

`openclaw sessions cleanup` usa la configuración de `session.maintenance`
([Referencia de configuración](/es/gateway/config-agents#session)):

- Nota sobre el alcance: `openclaw sessions cleanup` mantiene los almacenes de sesiones,
  las transcripciones, las filas de trayectorias y los archivos auxiliares de trayectorias heredados. No
  depura el historial de ejecuciones de Cron, que se gestiona mediante `cron.runLog.keepLines`
  ([Configuración de Cron](/es/automation/cron-jobs#configuration)).
- La limpieza también depura los artefactos de transcripciones heredados o archivados sin referencias,
  los puntos de control de Compaction y los archivos auxiliares de trayectorias con una antigüedad superior a
  `session.maintenance.pruneAfter`; se conservan los artefactos que siguen referenciados por filas de sesión
  de SQLite.
- La limpieza informa por separado de la eliminación de sondeos de ejecución de modelos de corta duración del Gateway como
  `modelRunPruned`. Esto solo coincide con claves explícitas estrictas con el formato
  `agent:*:explicit:model-run-<uuid>`. La retención está fijada en `24h` y está
  condicionada por la presión: solo elimina las filas de sondeo obsoletas cuando se alcanza la presión
  de mantenimiento o del límite de entradas de sesión. Cuando se ejecuta, la limpieza de ejecuciones de modelos
  ocurre antes de la limpieza global de elementos obsoletos y de la aplicación de límites.

Opciones:

| Opción               | Descripción                                                                                                                                                                                                                                                                                                                                                          |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--dry-run`          | Muestra una vista previa de cuántas entradas se depurarían o limitarían sin escribir cambios. En modo de texto, imprime una tabla de acciones por sesión (`Action`, `Key`, `Age`, `Model`, `Flags`), además de un resumen agrupado por etiqueta de sesión.                                                                                                               |
| `--enforce`          | Aplica el mantenimiento incluso cuando `session.maintenance.mode` es `warn`.                                                                                                                                                                                                                                                                                         |
| `--fix-missing`      | Elimina las entradas heredadas cuyos artefactos de transcripción archivados faltan o solo contienen un encabezado/están vacíos, incluso si normalmente aún no se excluirían por antigüedad o recuento.                                                                                                                                                                |
| `--fix-dm-scope`     | Cuando `session.dmScope` es `main`, retira las filas obsoletas de mensajes directos con claves por par que dejaron los métodos de enrutamiento anteriores `per-peer`, `per-channel-peer` o `per-account-channel-peer`. Use primero `--dry-run`; al aplicarlo, se eliminan esas filas de SQLite y se conservan sus artefactos de transcripción heredados como archivos eliminados. |
| `--active-key <key>` | Protege una clave activa específica frente a la expulsión por límite de espacio en disco. Los punteros duraderos a conversaciones externas, como las sesiones de grupo y las sesiones de chat con alcance de hilo, también se conservan durante el mantenimiento por antigüedad, recuento o límite de espacio en disco.                                                |
| `--agent <id>`       | Ejecuta la limpieza para el almacén de un agente configurado.                                                                                                                                                                                                                                                                                                        |
| `--all-agents`       | Ejecuta la limpieza para todos los almacenes de agentes configurados.                                                                                                                                                                                                                                                                                                |
| `--store <path>`     | Ejecuta la limpieza en una ruta específica de selector de almacén heredado.                                                                                                                                                                                                                                                                                          |
| `--json`             | Imprime un resumen JSON. Con `--all-agents`, la salida incluye un resumen por almacén.                                                                                                                                                                                                                                                                                |

Cuando se puede acceder a un Gateway, la limpieza sin ejecución de prueba de los almacenes de agentes configurados se
envía a través del Gateway para que comparta el mismo escritor del almacén de sesiones que el tráfico
de ejecución. Use `--store <path>` para reparar explícitamente sin conexión un selector
de almacén heredado.

`openclaw sessions cleanup --all-agents --dry-run --json`:

```json
{
  "allAgents": true,
  "mode": "warn",
  "dryRun": true,
  "stores": [
    {
      "agentId": "main",
      "storePath": "/home/user/.openclaw/agents/main/sessions/sessions.json",
      "beforeCount": 120,
      "afterCount": 80,
      "missing": 0,
      "dmScopeRetired": 0,
      "pruned": 40,
      "capped": 0
    },
    {
      "agentId": "work",
      "storePath": "/home/user/.openclaw/agents/work/sessions/sessions.json",
      "beforeCount": 18,
      "afterCount": 18,
      "missing": 0,
      "dmScopeRetired": 0,
      "pruned": 0,
      "capped": 0
    }
  ]
}
```

## Compactar una sesión

Recupere presupuesto de contexto para una sesión bloqueada o sobredimensionada. `openclaw sessions
compact <key>` es el contenedor principal de la RPC `sessions.compact` del
Gateway y requiere un Gateway en ejecución.

```bash
openclaw sessions compact "agent:main:main"
openclaw sessions compact "agent:main:main" --max-lines 200
openclaw sessions compact "agent:work:main" --agent work --json
```

- Sin `--max-lines`, el Gateway resume la transcripción mediante un LLM. De forma predeterminada, la CLI
  no impone un plazo límite al cliente; el Gateway controla el ciclo de vida
  configurado de Compaction.
- Con `--max-lines <n>`, trunca la transcripción a sus últimas `n` líneas y
  archiva la transcripción anterior como un archivo auxiliar `.bak`.
- `--agent <id>`: agente propietario de la sesión; obligatorio para claves `global`.
- `--url` / `--token` / `--password`: valores de conexión alternativos del Gateway.
- `--timeout <ms>`: tiempo de espera RPC opcional del lado del cliente, en milisegundos.
- `--json`: imprime la carga útil RPC sin procesar.

El comando finaliza con un código distinto de cero cuando el Gateway informa que la Compaction falló o
no está accesible, para que los crons y scripts nunca confundan una omisión silenciosa con un resultado correcto.

<Note>
`openclaw agent --message '/compact ...'` **no** es una vía de Compaction. Los comandos
con barra de la CLI son rechazados por la comprobación del remitente autorizado; esa
invocación finaliza con un código distinto de cero y ofrece indicaciones que remiten aquí, en lugar de
no realizar ninguna operación silenciosamente.
</Note>

### RPC sessions.compact

`openclaw gateway call sessions.compact --params '<json>'` acepta:

| Campo      | Tipo        | Obligatorio | Descripción                                                        |
| ---------- | ----------- | ----------- | ------------------------------------------------------------------ |
| `key`      | string      | sí          | Clave de sesión que se compactará (por ejemplo, `agent:main:main`). |
| `agentId`  | string      | no          | Id. del agente propietario de la sesión (para claves `global`).     |
| `maxLines` | integer ≥ 1 | no          | Trunca a las últimas N líneas en lugar de resumir mediante un LLM.  |

Ejemplo de respuesta de resumen mediante LLM:

```json
{
  "ok": true,
  "key": "agent:main:main",
  "compacted": true,
  "result": { "tokensBefore": 243868, "tokensAfter": 34941 }
}
```

Ejemplo de respuesta de truncamiento (`--max-lines 200`):

```json
{
  "ok": true,
  "key": "agent:main:main",
  "compacted": true,
  "archived": "/home/user/.openclaw/agents/main/sessions/transcripts/<id>.jsonl.bak",
  "kept": 200
}
```

## Contenido relacionado

- [Configuración de sesiones](/es/gateway/config-agents#session)
- [Gestión de sesiones](/es/concepts/session)
- [Compaction](/es/concepts/compaction)
- [Referencia de la CLI](/es/cli)
