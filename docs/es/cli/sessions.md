---
read_when:
    - Quieres listar las sesiones almacenadas y ver la actividad reciente
summary: Referencia de CLI para `openclaw sessions` (listar sesiones almacenadas + uso)
title: Sesiones
x-i18n:
    generated_at: "2026-07-04T20:24:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7c24ee8a632998624ee41945b26ace3bfe37cadf9447f7632c373784a9301bde
    source_path: cli/sessions.md
    workflow: 16
---

# `openclaw sessions`

Lista las sesiones de conversación almacenadas.

Las listas de sesiones no son comprobaciones de actividad de canales/proveedores. Muestran filas de conversación persistidas desde los almacenes de sesiones. Un Discord, Slack, Telegram u otro canal inactivo puede reconectarse correctamente sin crear una nueva fila de sesión hasta que se procese un mensaje. Usa `openclaw channels status --probe`, `openclaw status --deep` u `openclaw health --verbose` cuando necesites conectividad de canal en vivo.

Las respuestas de `openclaw sessions` y Gateway `sessions.list` están acotadas de forma predeterminada para que los almacenes grandes de larga duración no puedan monopolizar el proceso de CLI ni el bucle de eventos de Gateway. La CLI devuelve las 100 sesiones más recientes de forma predeterminada; pasa `--limit <n>` para una ventana más pequeña/grande o `--limit all` cuando necesites intencionalmente el almacén completo. Las respuestas JSON incluyen `totalCount`, `limitApplied` y `hasMore` cuando los llamadores necesitan mostrar que existen más filas.

Los clientes RPC pueden pasar `configuredAgentsOnly: true` para conservar la fuente de descubrimiento combinada amplia, pero devolver solo filas de agentes presentes actualmente en la configuración. Control UI usa ese modo de forma predeterminada para que los almacenes de agentes eliminados o presentes solo en disco no vuelvan a aparecer en la vista Sesiones.

```bash
openclaw sessions
openclaw sessions --agent work
openclaw sessions --all-agents
openclaw sessions --active 120
openclaw sessions --limit 25
openclaw sessions --verbose
openclaw sessions --json
```

Selección de alcance:

- predeterminado: almacén del agente predeterminado configurado
- `--verbose`: registro detallado
- `--agent <id>`: un almacén de agente configurado
- `--all-agents`: agregar todos los almacenes de agentes configurados
- `--store <path>`: ruta de almacén explícita (no se puede combinar con `--agent` ni `--all-agents`)
- `--limit <n|all>`: filas máximas para generar (predeterminado `100`; `all` restaura la salida completa)

Sigue el progreso de trayectoria legible por humanos para sesiones almacenadas:

```bash
openclaw sessions tail
openclaw sessions tail --follow
openclaw sessions tail --session-key "agent:main:telegram:direct:123" --tail 25
openclaw sessions --agent work tail --follow
openclaw sessions --all-agents tail --follow
```

`openclaw sessions tail` representa eventos JSONL de trayectoria recientes como líneas de progreso compactas. Sin `--session-key`, primero sigue las sesiones en ejecución y luego la última sesión almacenada. `--tail <count>` controla cuántos eventos existentes se imprimen antes del modo de seguimiento; el valor predeterminado es `80`, y `0` empieza en el extremo actual. `--follow` sigue observando los archivos de trayectoria seleccionados, incluidos los archivos reubicados referenciados por `<session>.trajectory-path.json`.

La vista de progreso es intencionalmente conservadora: no se imprimen el texto de prompts, los argumentos de herramientas ni los cuerpos de resultados de herramientas. Las llamadas a herramientas muestran el nombre de la herramienta con `{...redacted...}`; los resultados de herramientas muestran estados como `ok`, `error` o `done`; las líneas de finalización del modelo muestran proveedor/modelo y estado terminal.

Exporta un paquete de trayectoria para una sesión almacenada:

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --output bug-123 --json
```

Esta es la ruta de comando que usa el comando slash `/export-trajectory` después de que el propietario aprueba la solicitud de ejecución. El directorio de salida siempre se resuelve dentro de `.openclaw/trajectory-exports/` bajo el espacio de trabajo seleccionado.

`openclaw sessions --all-agents` lee almacenes de agentes configurados. El descubrimiento de sesiones de Gateway y ACP es más amplio: también incluye almacenes presentes solo en disco encontrados bajo la raíz predeterminada `agents/` o una raíz `session.store` con plantilla. Esos almacenes descubiertos deben resolverse como archivos `sessions.json` normales dentro de la raíz del agente; se omiten los symlinks y las rutas fuera de la raíz.

Ejemplos JSON:

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
    { "agentId": "main", "key": "agent:main:main", "model": "gpt-5" },
    { "agentId": "work", "key": "agent:work:main", "model": "claude-opus-4-6" }
  ]
}
```

## Mantenimiento de limpieza

Ejecuta el mantenimiento ahora (en lugar de esperar al siguiente ciclo de escritura):

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --agent work --dry-run
openclaw sessions cleanup --all-agents --dry-run
openclaw sessions cleanup --enforce
openclaw sessions cleanup --enforce --active-key "agent:main:telegram:direct:123"
openclaw sessions cleanup --dry-run --fix-dm-scope
openclaw sessions cleanup --json
```

`openclaw sessions cleanup` usa los ajustes de `session.maintenance` de la configuración:

- Nota de alcance: `openclaw sessions cleanup` mantiene almacenes de sesiones, transcripciones y sidecars de trayectoria. No poda el historial de ejecuciones de Cron, que se administra con `cron.runLog.keepLines` en [Configuración de Cron](/es/automation/cron-jobs#configuration) y se explica en [Mantenimiento de Cron](/es/automation/cron-jobs#maintenance).
- La limpieza también poda transcripciones primarias sin referencias, puntos de control de Compaction y sidecars de trayectoria anteriores a `session.maintenance.pruneAfter`; los archivos que aún estén referenciados por `sessions.json` se preservan.
- La limpieza informa por separado la limpieza de sondeos de ejecución de modelo de Gateway de corta duración como `modelRunPruned`. Esto solo coincide con claves explícitas estrictas con forma `agent:*:explicit:model-run-<uuid>`. La retención fija es `24h`, pero está limitada por presión: solo elimina filas obsoletas de sondeo cuando se alcanza la presión de mantenimiento/límite de entradas de sesión. Cuando se ejecuta, la limpieza de ejecuciones de modelo ocurre antes de la limpieza obsoleta global y la limitación.

- `--dry-run`: previsualiza cuántas entradas se podarían/limitarían sin escribir.
  - En modo texto, dry-run imprime una tabla de acciones por sesión (`Action`, `Key`, `Age`, `Model`, `Flags`) más un resumen agrupado por etiqueta de sesión para que puedas ver qué se conservaría frente a qué se eliminaría.
- `--enforce`: aplica mantenimiento incluso cuando `session.maintenance.mode` es `warn`.
- `--fix-missing`: elimina entradas cuyos archivos de transcripción faltan o están vacíos/solo con encabezado, incluso si normalmente todavía no vencerían por antigüedad/conteo.
- `--fix-dm-scope`: cuando `session.dmScope` es `main`, retira filas obsoletas de DM directos con claves por par dejadas por enrutamientos anteriores `per-peer`, `per-channel-peer` o `per-account-channel-peer`. Usa primero `--dry-run`; aplicar la limpieza elimina esas filas de `sessions.json` y preserva sus transcripciones como archivos eliminados.
- `--active-key <key>`: protege una clave activa específica frente a la expulsión por presupuesto de disco. Los punteros duraderos de conversaciones externas, como sesiones de grupo y sesiones de chat con alcance de hilo, también se conservan por mantenimiento de antigüedad/conteo/presupuesto de disco.
- `--agent <id>`: ejecuta la limpieza para un almacén de agente configurado.
- `--all-agents`: ejecuta la limpieza para todos los almacenes de agentes configurados.
- `--store <path>`: se ejecuta contra un archivo `sessions.json` específico.
- `--json`: imprime un resumen JSON. Con `--all-agents`, la salida incluye un resumen por almacén.

Cuando un Gateway es alcanzable, la limpieza que no sea dry-run para almacenes de agentes configurados se envía a través del Gateway para que comparta el mismo escritor de almacén de sesiones que el tráfico de runtime. Usa `--store <path>` para una reparación offline explícita de un archivo de almacén.

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

Recupera presupuesto de contexto para una sesión atascada o sobredimensionada. `openclaw sessions compact <key>` es el wrapper de primera clase alrededor del RPC de Gateway `sessions.compact` y requiere un gateway en ejecución.

```bash
openclaw sessions compact "agent:main:main"
openclaw sessions compact "agent:main:main" --max-lines 200
openclaw sessions compact "agent:work:main" --agent work --json
```

- Sin `--max-lines`, el LLM de Gateway resume la transcripción. La CLI no impone una fecha límite de cliente de forma predeterminada; el Gateway es propietario del ciclo de vida de compaction configurado.
- Con `--max-lines <n>`, trunca a las últimas `n` líneas de transcripción y archiva la transcripción anterior como sidecar `.bak`.
- `--agent <id>`: agente propietario de la sesión; obligatorio para claves `global`.
- `--url` / `--token` / `--password`: sobrescrituras de conexión de gateway.
- `--timeout <ms>`: timeout RPC opcional del lado del cliente en milisegundos.
- `--json`: imprime la carga útil RPC sin procesar.

El comando sale con valor distinto de cero cuando el gateway informa una compaction fallida o no es alcanzable, por lo que crons y scripts nunca confunden una no operación silenciosa con éxito.

> Nota: `openclaw agent --message '/compact ...'` **no** es una ruta de compaction. Los comandos slash desde la CLI son rechazados por la comprobación de remitente autorizado; esa invocación sale con valor distinto de cero con orientación que apunta aquí en lugar de no hacer nada silenciosamente.

### RPC sessions.compact

`openclaw gateway call sessions.compact --params '<json>'` acepta:

| Campo      | Tipo        | Obligatorio | Descripción                                                |
| ---------- | ----------- | ----------- | ---------------------------------------------------------- |
| `key`      | string      | sí          | Clave de sesión para compactar (por ejemplo `agent:main:main`). |
| `agentId`  | string      | no          | Id de agente propietario de la sesión (para claves `global`). |
| `maxLines` | integer ≥ 1 | no          | Trunca a las últimas N líneas en lugar de resumen por LLM. |

Ejemplo de respuesta de resumen por LLM:

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

## Relacionado

- Configuración de sesiones: [Referencia de configuración](/es/gateway/config-agents#session)
- [Referencia de CLI](/es/cli)
- [Gestión de sesiones](/es/concepts/session)
