---
read_when:
    - Quieres listar las sesiones guardadas y ver la actividad reciente
summary: Referencia de CLI para `openclaw sessions` (listar sesiones almacenadas + uso)
title: Sesiones
x-i18n:
    generated_at: "2026-05-07T13:14:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: cdfdc9223f11da87b514f96e0a9505286e36d98647b3ff3a79b90588e4e69c1b
    source_path: cli/sessions.md
    workflow: 16
---

# `openclaw sessions`

Lista las sesiones de conversación almacenadas.

Las listas de sesiones no son comprobaciones de disponibilidad del canal/proveedor. Muestran filas de conversación persistidas desde los almacenes de sesiones. Un Discord, Slack, Telegram u otro canal silencioso puede reconectarse correctamente sin crear una nueva fila de sesión hasta que se procese un mensaje. Usa `openclaw channels status --probe`, `openclaw status --deep` u `openclaw health --verbose` cuando necesites conectividad de canal en vivo.

Las respuestas de `openclaw sessions` y Gateway `sessions.list` están limitadas de forma predeterminada para que los almacenes grandes y de larga duración no puedan monopolizar el proceso de la CLI ni el bucle de eventos de Gateway. La CLI devuelve las 100 sesiones más recientes de forma predeterminada; pasa `--limit <n>` para una ventana menor/mayor o `--limit all` cuando necesites intencionalmente el almacén completo. Las respuestas JSON incluyen `totalCount`, `limitApplied` y `hasMore` cuando los clientes necesitan mostrar que existen más filas.

Los clientes RPC pueden pasar `configuredAgentsOnly: true` para mantener la fuente amplia de descubrimiento combinado, pero devolver solo filas de agentes presentes actualmente en la configuración. La interfaz de control usa ese modo de forma predeterminada para que los almacenes de agentes eliminados o solo en disco no vuelvan a aparecer en la vista Sesiones.

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
- `--limit <n|all>`: filas máximas que emitir (predeterminado `100`; `all` restaura la salida completa)

Exporta un paquete de trayectoria para una sesión almacenada:

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --output bug-123 --json
```

Esta es la ruta de comando usada por el comando de barra `/export-trajectory` después de que el propietario aprueba la solicitud de ejecución. El directorio de salida siempre se resuelve dentro de `.openclaw/trajectory-exports/` bajo el espacio de trabajo seleccionado.

`openclaw sessions --all-agents` lee los almacenes de agentes configurados. El descubrimiento de sesiones de Gateway y ACP es más amplio: también incluye almacenes solo en disco encontrados bajo la raíz predeterminada `agents/` o una raíz `session.store` con plantilla. Esos almacenes descubiertos deben resolverse como archivos `sessions.json` normales dentro de la raíz del agente; los enlaces simbólicos y las rutas fuera de la raíz se omiten.

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

Ejecuta el mantenimiento ahora (en lugar de esperar al próximo ciclo de escritura):

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --agent work --dry-run
openclaw sessions cleanup --all-agents --dry-run
openclaw sessions cleanup --enforce
openclaw sessions cleanup --enforce --active-key "agent:main:telegram:direct:123"
openclaw sessions cleanup --dry-run --fix-dm-scope
openclaw sessions cleanup --json
```

`openclaw sessions cleanup` usa la configuración `session.maintenance` de la configuración:

- Nota de alcance: `openclaw sessions cleanup` mantiene almacenes de sesiones, transcripciones y sidecars de trayectoria. No poda registros de ejecuciones de Cron (`cron/runs/<jobId>.jsonl`), que son gestionados por `cron.runLog.maxBytes` y `cron.runLog.keepLines` en [configuración de Cron](/es/automation/cron-jobs#configuration) y se explican en [mantenimiento de Cron](/es/automation/cron-jobs#maintenance).
- La limpieza también poda transcripciones primarias no referenciadas, puntos de control de Compaction y sidecars de trayectoria anteriores a `session.maintenance.pruneAfter`; los archivos aún referenciados por `sessions.json` se conservan.

- `--dry-run`: previsualiza cuántas entradas se podarían/limitarían sin escribir.
  - En modo texto, dry-run imprime una tabla de acciones por sesión (`Action`, `Key`, `Age`, `Model`, `Flags`) para que puedas ver qué se conservaría frente a qué se eliminaría.
- `--enforce`: aplica el mantenimiento incluso cuando `session.maintenance.mode` es `warn`.
- `--fix-missing`: elimina entradas cuyos archivos de transcripción faltan, incluso si normalmente aún no quedarían fuera por antigüedad/recuento.
- `--fix-dm-scope`: cuando `session.dmScope` es `main`, retira filas obsoletas de mensajes directos con clave de par dejadas por el enrutamiento anterior `per-peer`, `per-channel-peer` o `per-account-channel-peer`. Usa `--dry-run` primero; aplicar la limpieza elimina esas filas de `sessions.json` y conserva sus transcripciones como archivos eliminados.
- `--active-key <key>`: protege una clave activa específica contra la expulsión por presupuesto de disco. Los punteros duraderos a conversaciones externas, como sesiones de grupo y sesiones de chat con alcance de hilo, también se conservan mediante mantenimiento por antigüedad/recuento/presupuesto de disco.
- `--agent <id>`: ejecuta la limpieza para un almacén de agente configurado.
- `--all-agents`: ejecuta la limpieza para todos los almacenes de agentes configurados.
- `--store <path>`: ejecuta contra un archivo `sessions.json` específico.
- `--json`: imprime un resumen JSON. Con `--all-agents`, la salida incluye un resumen por almacén.

Cuando se puede alcanzar un Gateway, la limpieza no dry-run para almacenes de agentes configurados se envía a través del Gateway para que comparta el mismo escritor de almacén de sesiones que el tráfico de runtime. Usa `--store <path>` para la reparación offline explícita de un archivo de almacén.

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

Relacionado:

- Configuración de sesiones: [Referencia de configuración](/es/gateway/config-agents#session)

## Relacionado

- [Referencia de CLI](/es/cli)
- [Gestión de sesiones](/es/concepts/session)
