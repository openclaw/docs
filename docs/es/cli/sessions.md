---
read_when:
    - Quieres listar las sesiones almacenadas y ver la actividad reciente
summary: Referencia de CLI para `openclaw sessions` (listar sesiones almacenadas + uso)
title: Sesiones
x-i18n:
    generated_at: "2026-07-05T11:09:34Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 849a7576557574cf1a48b17e1d4f444605afed09c675177cf12cf18f91a355b3
    source_path: cli/sessions.md
    workflow: 16
---

# `openclaw sessions`

Lista las sesiones de conversación almacenadas.

Las listas de sesiones no son comprobaciones de actividad de canales/proveedores. Muestran filas de conversación persistidas desde los almacenes de sesiones. Un Discord, Slack, Telegram u otro canal en silencio puede reconectarse correctamente sin crear una nueva fila de sesión hasta que se procese un mensaje. Usa `openclaw channels status --probe`, `openclaw status --deep` u `openclaw health --verbose` cuando necesites conectividad de canales en vivo.

```bash
openclaw sessions
openclaw sessions --agent work
openclaw sessions --all-agents
openclaw sessions --active 120
openclaw sessions --limit 25
openclaw sessions --store ./tmp/sessions.json
openclaw sessions --json
```

Indicadores:

| Indicador            | Descripción                                                            |
| -------------------- | ---------------------------------------------------------------------- |
| `--agent <id>`       | Un almacén de agente configurado (predeterminado: agente predeterminado configurado). |
| `--all-agents`       | Agrega todos los almacenes de agentes configurados.                    |
| `--store <path>`     | Ruta explícita del almacén (no se puede combinar con `--agent` ni `--all-agents`). |
| `--active <minutes>` | Muestra solo sesiones actualizadas en los últimos N minutos.           |
| `--limit <n\|all>`   | Máximo de filas que generar (predeterminado `100`; `all` restaura la salida completa). |
| `--json`             | Salida legible por máquina.                                            |
| `--verbose`          | Registro detallado.                                                    |

`openclaw sessions` y el RPC `sessions.list` del Gateway están acotados de forma predeterminada para que los almacenes grandes y de larga duración no puedan monopolizar el proceso de la CLI ni el bucle de eventos del Gateway. La CLI devuelve las 100 sesiones más recientes de forma predeterminada; pasa `--limit <n>` para una ventana menor/mayor o `--limit all` cuando necesites intencionalmente el almacén completo. Las respuestas JSON incluyen `totalCount`, `limitApplied` y `hasMore` cuando los llamadores necesitan mostrar que existen más filas.

Los clientes RPC pueden pasar `configuredAgentsOnly: true` para conservar la fuente amplia de descubrimiento combinado, pero devolver solo filas de agentes presentes actualmente en la configuración. Control UI usa ese modo de forma predeterminada para que los almacenes de agentes eliminados o solo en disco no vuelvan a aparecer en la vista Sessions.

`--all-agents` lee almacenes de agentes configurados. El descubrimiento de sesiones de Gateway y ACP es más amplio: también incluye almacenes solo en disco encontrados bajo la raíz predeterminada `agents/` o una raíz `session.store` con plantilla. Esos almacenes descubiertos deben resolverse como archivos `sessions.json` normales dentro de la raíz del agente; se omiten los enlaces simbólicos y las rutas fuera de la raíz.

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
    { "agentId": "main", "key": "agent:main:main", "model": "openai/gpt-5.5" },
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

`openclaw sessions tail` representa eventos JSONL recientes de trayectoria como líneas de progreso compactas. Sin `--session-key`, primero sigue las sesiones en ejecución y después la última sesión almacenada. `--tail <count>` controla cuántos eventos existentes se imprimen antes del modo de seguimiento; el valor predeterminado es `80`, y `0` empieza en el final actual. `--follow` sigue observando los archivos de trayectoria seleccionados, incluidos los archivos reubicados referenciados por `<session>.trajectory-path.json`.

La vista de progreso es intencionalmente conservadora: no se imprimen el texto del prompt, los argumentos de herramientas ni los cuerpos de resultados de herramientas. Las llamadas a herramientas muestran el nombre de la herramienta con `{...redacted...}`; los resultados de herramientas muestran estados como `ok`, `error` o `done`; las líneas de finalización del modelo muestran proveedor/modelo y estado terminal.

## Exportar un paquete de trayectoria

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --output bug-123 --json
```

Esta es la ruta de comando usada por el comando de barra `/export-trajectory` después de que el propietario aprueba la solicitud de exec. El directorio de salida siempre se resuelve dentro de `.openclaw/trajectory-exports/` bajo el espacio de trabajo seleccionado.

## Mantenimiento de limpieza

Ejecuta el mantenimiento ahora en lugar de esperar al siguiente ciclo de escritura:

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --agent work --dry-run
openclaw sessions cleanup --all-agents --dry-run
openclaw sessions cleanup --enforce
openclaw sessions cleanup --enforce --active-key "agent:main:telegram:direct:123"
openclaw sessions cleanup --dry-run --fix-dm-scope
openclaw sessions cleanup --json
```

`openclaw sessions cleanup` usa la configuración `session.maintenance` de la configuración ([Referencia de configuración](/es/gateway/config-agents#session)):

- Nota de alcance: `openclaw sessions cleanup` mantiene almacenes de sesiones, transcripciones y archivos auxiliares de trayectoria. No poda el historial de ejecuciones de Cron, que se administra mediante `cron.runLog.keepLines` ([Configuración de Cron](/es/automation/cron-jobs#configuration)).
- La limpieza también poda transcripciones primarias sin referencia, puntos de control de Compaction y archivos auxiliares de trayectoria más antiguos que `session.maintenance.pruneAfter`; se preservan los archivos que aún estén referenciados por `sessions.json`.
- La limpieza informa por separado la limpieza de sondeos de ejecución de modelo de Gateway de corta duración como `modelRunPruned`. Esto solo coincide con claves explícitas estrictas con la forma `agent:*:explicit:model-run-<uuid>`. La retención es un `24h` fijo y está condicionada por presión: solo elimina filas de sondeo obsoletas cuando se alcanza la presión de mantenimiento/límite de entradas de sesión. Cuando se ejecuta, la limpieza de ejecuciones de modelo ocurre antes de la limpieza global de elementos obsoletos y del acotamiento.

Indicadores:

| Indicador            | Descripción                                                                                                                                                                                                                                                                                         |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--dry-run`          | Previsualiza cuántas entradas se podarían/acotarían sin escribir. En modo de texto, imprime una tabla de acciones por sesión (`Action`, `Key`, `Age`, `Model`, `Flags`) más un resumen agrupado por etiqueta de sesión.                                                                            |
| `--enforce`          | Aplica el mantenimiento incluso cuando `session.maintenance.mode` es `warn`.                                                                                                                                                                                                                        |
| `--fix-missing`      | Elimina entradas cuyos archivos de transcripción falten o estén vacíos/solo con encabezado, aunque normalmente aún no se eliminarían por antigüedad/recuento.                                                                                                                                       |
| `--fix-dm-scope`     | Cuando `session.dmScope` es `main`, retira filas de DM directos obsoletas con clave por par que quedaron de enrutamientos anteriores `per-peer`, `per-channel-peer` o `per-account-channel-peer`. Usa primero `--dry-run`; aplicar esto elimina esas filas de `sessions.json` y conserva sus transcripciones como archivos eliminados. |
| `--active-key <key>` | Protege una clave activa específica contra la expulsión por presupuesto de disco. Los punteros duraderos a conversaciones externas, como sesiones de grupo y sesiones de chat con alcance de hilo, también se conservan mediante mantenimiento por antigüedad/recuento/presupuesto de disco.             |
| `--agent <id>`       | Ejecuta la limpieza para un almacén de agente configurado.                                                                                                                                                                                                                                          |
| `--all-agents`       | Ejecuta la limpieza para todos los almacenes de agentes configurados.                                                                                                                                                                                                                               |
| `--store <path>`     | Ejecuta contra un archivo `sessions.json` específico.                                                                                                                                                                                                                                               |
| `--json`             | Imprime un resumen JSON. Con `--all-agents`, la salida incluye un resumen por almacén.                                                                                                                                                                                                              |

Cuando un Gateway es accesible, la limpieza que no sea de ensayo para almacenes de agentes configurados se envía a través del Gateway para que comparta el mismo escritor de almacén de sesiones que el tráfico en tiempo de ejecución. Usa `--store <path>` para la reparación sin conexión explícita de un archivo de almacén.

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

Recupera presupuesto de contexto para una sesión bloqueada o sobredimensionada. `openclaw sessions compact <key>` es el envoltorio de primera clase alrededor del RPC `sessions.compact` del Gateway y requiere un Gateway en ejecución.

```bash
openclaw sessions compact "agent:main:main"
openclaw sessions compact "agent:main:main" --max-lines 200
openclaw sessions compact "agent:work:main" --agent work --json
```

- Sin `--max-lines`, el Gateway resume la transcripción con LLM. La CLI no impone un plazo de cliente de forma predeterminada; el Gateway posee el ciclo de vida de Compaction configurado.
- Con `--max-lines <n>`, trunca a las últimas `n` líneas de transcripción y archiva la transcripción anterior como archivo auxiliar `.bak`.
- `--agent <id>`: agente propietario de la sesión; obligatorio para claves `global`.
- `--url` / `--token` / `--password`: anulaciones de conexión del Gateway.
- `--timeout <ms>`: tiempo de espera RPC opcional del lado del cliente en milisegundos.
- `--json`: imprime la carga RPC sin procesar.

El comando sale con código distinto de cero cuando el Gateway informa una Compaction fallida o no es accesible, por lo que los Cron y scripts nunca confunden una operación silenciosa sin efecto con un éxito.

<Note>
`openclaw agent --message '/compact ...'` **no** es una ruta de Compaction. Los comandos de barra desde la CLI son rechazados por la comprobación de remitente autorizado; esa invocación sale con código distinto de cero con una guía que apunta aquí en lugar de no hacer nada silenciosamente.
</Note>

### RPC sessions.compact

`openclaw gateway call sessions.compact --params '<json>'` acepta:

| Campo      | Tipo        | Obligatorio | Descripción                                                |
| ---------- | ----------- | ----------- | ---------------------------------------------------------- |
| `key`      | string      | sí          | Clave de sesión que se va a compactar (por ejemplo `agent:main:main`). |
| `agentId`  | string      | no          | Id. del agente que posee la sesión (para claves `global`). |
| `maxLines` | integer ≥ 1 | no          | Truncar a las últimas N líneas en lugar de resumir con LLM. |

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

- [Configuración de sesión](/es/gateway/config-agents#session)
- [Gestión de sesiones](/es/concepts/session)
- [Compaction](/es/concepts/compaction)
- [Referencia de la CLI](/es/cli)
