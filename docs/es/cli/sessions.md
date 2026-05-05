---
read_when:
    - Quieres listar las sesiones almacenadas y ver la actividad reciente
summary: Referencia de CLI para `openclaw sessions` (listar sesiones almacenadas + uso)
title: Sesiones
x-i18n:
    generated_at: "2026-05-05T01:44:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6eb484ab1fa7686cf42dd00e640c4ae8616c4ea1c29873ea72694d72b9c680e7
    source_path: cli/sessions.md
    workflow: 16
---

# `openclaw sessions`

Lista las sesiones de conversación almacenadas.

Las listas de sesiones no son comprobaciones de actividad de canal/proveedor. Muestran filas de conversación persistidas desde los almacenes de sesiones. Un Discord, Slack, Telegram u otro canal silencioso puede reconectarse correctamente sin crear una nueva fila de sesión hasta que se procese un mensaje. Usa `openclaw channels status --probe`, `openclaw status --deep` u `openclaw health --verbose` cuando necesites conectividad de canal en vivo.

Las respuestas de `openclaw sessions` y Gateway `sessions.list` están acotadas de forma predeterminada para que los almacenes grandes y de larga duración no puedan monopolizar el proceso de la CLI ni el bucle de eventos de Gateway. La CLI devuelve las 100 sesiones más recientes de forma predeterminada; pasa `--limit <n>` para una ventana más pequeña/grande o `--limit all` cuando necesites intencionalmente el almacén completo. Las respuestas JSON incluyen `totalCount`, `limitApplied` y `hasMore` cuando los llamadores necesitan mostrar que existen más filas.

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
- `--limit <n|all>`: número máximo de filas que generar (predeterminado `100`; `all` restaura la salida completa)

Exporta un paquete de trayectoria para una sesión almacenada:

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --output bug-123 --json
```

Esta es la ruta de comando que usa el comando de barra `/export-trajectory` después de que el propietario aprueba la solicitud de ejecución. El directorio de salida siempre se resuelve dentro de `.openclaw/trajectory-exports/` bajo el espacio de trabajo seleccionado.

`openclaw sessions --all-agents` lee los almacenes de agentes configurados. El descubrimiento de sesiones de Gateway y ACP es más amplio: también incluye almacenes solo en disco encontrados bajo la raíz predeterminada `agents/` o una raíz `session.store` basada en plantilla. Esos almacenes descubiertos deben resolverse como archivos `sessions.json` regulares dentro de la raíz del agente; se omiten los enlaces simbólicos y las rutas fuera de la raíz.

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
openclaw sessions cleanup --json
```

`openclaw sessions cleanup` usa la configuración `session.maintenance` de la configuración:

- Nota de alcance: `openclaw sessions cleanup` mantiene almacenes de sesiones, transcripciones y archivos complementarios de trayectoria. No poda los registros de ejecución de Cron (`cron/runs/<jobId>.jsonl`), que se gestionan mediante `cron.runLog.maxBytes` y `cron.runLog.keepLines` en la [configuración de Cron](/es/automation/cron-jobs#configuration) y se explican en [mantenimiento de Cron](/es/automation/cron-jobs#maintenance).

- `--dry-run`: previsualiza cuántas entradas se podarían/limitarían sin escribir.
  - En modo texto, dry-run imprime una tabla de acciones por sesión (`Action`, `Key`, `Age`, `Model`, `Flags`) para que puedas ver qué se conservaría y qué se eliminaría.
- `--enforce`: aplica el mantenimiento incluso cuando `session.maintenance.mode` es `warn`.
- `--fix-missing`: elimina entradas cuyos archivos de transcripción faltan, aunque normalmente todavía no quedarían fuera por antigüedad/recuento.
- `--active-key <key>`: protege una clave activa específica contra el desalojo por presupuesto de disco. Los punteros duraderos a conversaciones externas, como sesiones de grupo y sesiones de chat con alcance de hilo, también se conservan durante el mantenimiento por antigüedad/recuento/presupuesto de disco.
- `--agent <id>`: ejecuta la limpieza para un almacén de agente configurado.
- `--all-agents`: ejecuta la limpieza para todos los almacenes de agentes configurados.
- `--store <path>`: ejecuta contra un archivo `sessions.json` específico.
- `--json`: imprime un resumen JSON. Con `--all-agents`, la salida incluye un resumen por almacén.

Cuando se puede alcanzar un Gateway, la limpieza que no es dry-run para almacenes de agentes configurados se envía a través de Gateway para que comparta el mismo escritor de almacén de sesiones que el tráfico en tiempo de ejecución. Usa `--store <path>` para la reparación sin conexión explícita de un archivo de almacén.

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
      "pruned": 40,
      "capped": 0
    },
    {
      "agentId": "work",
      "storePath": "/home/user/.openclaw/agents/work/sessions/sessions.json",
      "beforeCount": 18,
      "afterCount": 18,
      "pruned": 0,
      "capped": 0
    }
  ]
}
```

Relacionado:

- Configuración de sesión: [Referencia de configuración](/es/gateway/config-agents#session)

## Relacionado

- [Referencia de la CLI](/es/cli)
- [Gestión de sesiones](/es/concepts/session)
