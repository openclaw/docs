---
read_when:
    - Quieres listar las sesiones almacenadas y ver la actividad reciente
summary: Referencia de CLI para `openclaw sessions` (listar sesiones almacenadas + uso)
title: Sesiones
x-i18n:
    generated_at: "2026-06-27T11:05:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7b9454e4b6ef925f8f90b5e8beceb6bea6404539f460cb78bcf82e241dff168d
    source_path: cli/sessions.md
    workflow: 16
---

# `openclaw sessions`

Lista las sesiones de conversación almacenadas.

Las listas de sesiones no son comprobaciones de actividad de canales/proveedores. Muestran filas de conversación persistidas desde los almacenes de sesiones. Un Discord, Slack, Telegram u otro canal silencioso puede reconectarse correctamente sin crear una nueva fila de sesión hasta que se procese un mensaje. Usa `openclaw channels status --probe`, `openclaw status --deep` u `openclaw health --verbose` cuando necesites conectividad de canal en vivo.

Las respuestas de `openclaw sessions` y Gateway `sessions.list` están acotadas de forma predeterminada para que los almacenes grandes y de larga duración no puedan monopolizar el proceso de la CLI ni el bucle de eventos de Gateway. La CLI devuelve las 100 sesiones más recientes de forma predeterminada; pasa `--limit <n>` para una ventana más pequeña o más grande, o `--limit all` cuando necesites intencionalmente el almacén completo. Las respuestas JSON incluyen `totalCount`, `limitApplied` y `hasMore` cuando los llamadores necesitan mostrar que existen más filas.

Los clientes RPC pueden pasar `configuredAgentsOnly: true` para mantener la fuente de descubrimiento combinada amplia, pero devolver solo filas de agentes presentes actualmente en la configuración. Control UI usa ese modo de forma predeterminada para que los almacenes de agentes eliminados o solo presentes en disco no vuelvan a aparecer en la vista Sessions.

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
- `--all-agents`: agrega todos los almacenes de agentes configurados
- `--store <path>`: ruta explícita del almacén (no se puede combinar con `--agent` ni `--all-agents`)
- `--limit <n|all>`: máximo de filas que se generarán (predeterminado `100`; `all` restaura la salida completa)

Sigue el progreso de trayectoria legible para humanos de las sesiones almacenadas:

```bash
openclaw sessions tail
openclaw sessions tail --follow
openclaw sessions tail --session-key "agent:main:telegram:direct:123" --tail 25
openclaw sessions --agent work tail --follow
openclaw sessions --all-agents tail --follow
```

`openclaw sessions tail` representa eventos JSONL de trayectoria recientes como líneas de progreso compactas. Sin `--session-key`, sigue primero las sesiones en ejecución y luego la última sesión almacenada. `--tail <count>` controla cuántos eventos existentes se imprimen antes del modo de seguimiento; el valor predeterminado es `80`, y `0` empieza en el final actual. `--follow` sigue observando los archivos de trayectoria seleccionados, incluidos los archivos reubicados a los que hace referencia `<session>.trajectory-path.json`.

La vista de progreso es intencionalmente conservadora: no se imprime el texto del prompt, los argumentos de herramientas ni los cuerpos de resultados de herramientas. Las llamadas a herramientas muestran el nombre de la herramienta con `{...redacted...}`; los resultados de herramientas muestran estados como `ok`, `error` o `done`; las líneas de finalización del modelo muestran el proveedor/modelo y el estado terminal.

Exporta un paquete de trayectoria para una sesión almacenada:

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --output bug-123 --json
```

Esta es la ruta de comando que usa el comando con barra `/export-trajectory` después de que el propietario aprueba la solicitud de ejecución. El directorio de salida siempre se resuelve dentro de `.openclaw/trajectory-exports/` bajo el espacio de trabajo seleccionado.

`openclaw sessions --all-agents` lee almacenes de agentes configurados. El descubrimiento de sesiones de Gateway y ACP es más amplio: también incluye almacenes solo presentes en disco encontrados bajo la raíz `agents/` predeterminada o una raíz `session.store` con plantilla. Esos almacenes descubiertos deben resolverse como archivos `sessions.json` normales dentro de la raíz del agente; se omiten los enlaces simbólicos y las rutas fuera de la raíz.

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

`openclaw sessions cleanup` usa la configuración de `session.maintenance` de la configuración:

- Nota de alcance: `openclaw sessions cleanup` mantiene almacenes de sesiones, transcripciones y sidecars de trayectoria. No depura el historial de ejecuciones de Cron, que se administra mediante `cron.runLog.keepLines` en [Configuración de Cron](/es/automation/cron-jobs#configuration) y se explica en [Mantenimiento de Cron](/es/automation/cron-jobs#maintenance).
- La limpieza también depura transcripciones primarias sin referencia, puntos de control de Compaction y sidecars de trayectoria más antiguos que `session.maintenance.pruneAfter`; se conservan los archivos que todavía referencia `sessions.json`.
- La limpieza informa por separado la limpieza de sondeos de ejecución de modelo de Gateway de corta duración como `modelRunPruned`. Esto solo coincide con claves explícitas estrictas con forma de `agent:*:explicit:model-run-<uuid>`. La retención fija es `24h`, pero está condicionada por presión: solo elimina filas de sondeo obsoletas cuando se alcanza la presión de mantenimiento/límite de entradas de sesión. Cuando se ejecuta, la limpieza de ejecuciones de modelo ocurre antes de la limpieza global de elementos obsoletos y la aplicación de límites.

- `--dry-run`: previsualiza cuántas entradas se depurarían o limitarían sin escribir.
  - En modo texto, dry-run imprime una tabla de acciones por sesión (`Action`, `Key`, `Age`, `Model`, `Flags`) más un resumen agrupado por etiqueta de sesión para que puedas ver qué se conservaría frente a qué se eliminaría.
- `--enforce`: aplica el mantenimiento incluso cuando `session.maintenance.mode` es `warn`.
- `--fix-missing`: elimina entradas cuyos archivos de transcripción faltan o solo tienen encabezado/están vacíos, aunque normalmente todavía no se eliminarían por antigüedad o recuento.
- `--fix-dm-scope`: cuando `session.dmScope` es `main`, retira filas obsoletas de DM directos con clave por par que dejaron rutas anteriores `per-peer`, `per-channel-peer` o `per-account-channel-peer`. Usa `--dry-run` primero; aplicar la limpieza elimina esas filas de `sessions.json` y conserva sus transcripciones como archivos eliminados.
- `--active-key <key>`: protege una clave activa específica contra la expulsión por presupuesto de disco. Los punteros de conversación externos duraderos, como las sesiones de grupo y las sesiones de chat con alcance de hilo, también se conservan mediante mantenimiento por antigüedad/recuento/presupuesto de disco.
- `--agent <id>`: ejecuta la limpieza para un almacén de agente configurado.
- `--all-agents`: ejecuta la limpieza para todos los almacenes de agentes configurados.
- `--store <path>`: ejecuta contra un archivo `sessions.json` específico.
- `--json`: imprime un resumen JSON. Con `--all-agents`, la salida incluye un resumen por almacén.

Cuando un Gateway es accesible, la limpieza que no es dry-run para almacenes de agentes configurados se envía a través del Gateway para que comparta el mismo escritor de almacén de sesiones que el tráfico en tiempo de ejecución. Usa `--store <path>` para la reparación explícita sin conexión de un archivo de almacén.

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

Recupera presupuesto de contexto para una sesión atascada o sobredimensionada. `openclaw sessions compact <key>` es el envoltorio de primera clase alrededor del RPC de Gateway `sessions.compact` y requiere un Gateway en ejecución.

```bash
openclaw sessions compact "agent:main:main"
openclaw sessions compact "agent:main:main" --max-lines 200
openclaw sessions compact "agent:work:main" --agent work --json
```

- Sin `--max-lines`, el Gateway resume la transcripción con un LLM. Esto puede ser lento, por lo que el `--timeout` predeterminado es `180000` ms.
- Con `--max-lines <n>`, la trunca a las últimas `n` líneas de transcripción y archiva la transcripción anterior como un sidecar `.bak`.
- `--agent <id>`: agente propietario de la sesión; requerido para claves `global`.
- `--url` / `--token` / `--password`: sobrescrituras de conexión al gateway.
- `--timeout <ms>`: tiempo de espera de RPC en milisegundos.
- `--json`: imprime la carga RPC sin procesar.

El comando sale con un código distinto de cero cuando el Gateway informa una Compaction fallida o no es accesible, por lo que los Cron y scripts nunca confunden una no operación silenciosa con un éxito.

> Nota: `openclaw agent --message '/compact ...'` **no** es una ruta de Compaction. Los comandos con barra de la CLI son rechazados por la comprobación de remitente autorizado; esa invocación sale con un código distinto de cero con una guía que apunta aquí en lugar de no hacer nada silenciosamente.

### RPC sessions.compact

`openclaw gateway call sessions.compact --params '<json>'` acepta:

| Campo      | Tipo        | Requerido | Descripción                                                |
| ---------- | ----------- | --------- | ---------------------------------------------------------- |
| `key`      | string      | sí        | Clave de sesión que se compactará (por ejemplo `agent:main:main`). |
| `agentId`  | string      | no        | Id. del agente propietario de la sesión (para claves `global`). |
| `maxLines` | integer ≥ 1 | no        | Trunca a las últimas N líneas en lugar de resumir con LLM. |

Ejemplo de respuesta de resumen con LLM:

```json
{
  "ok": true,
  "key": "agent:main:main",
  "compacted": true,
  "result": { "tokensBefore": 243868, "tokensAfter": 34941 }
}
```

Ejemplo de respuesta de truncado (`--max-lines 200`):

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

- Configuración de sesión: [Referencia de configuración](/es/gateway/config-agents#session)
- [Referencia de la CLI](/es/cli)
- [Gestión de sesiones](/es/concepts/session)
