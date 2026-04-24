---
read_when:
    - Quieres listar sesiones almacenadas y ver actividad reciente
summary: Referencia de la CLI para `openclaw sessions` (listar sesiones almacenadas y uso)
title: Sesiones
x-i18n:
    generated_at: "2026-04-24T05:24:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8d9fdc5d4cc968784e6e937a1000e43650345c27765208d46611e1fe85ee9293
    source_path: cli/sessions.md
    workflow: 15
---

# `openclaw sessions`

Lista las sesiones de conversación almacenadas.

```bash
openclaw sessions
openclaw sessions --agent work
openclaw sessions --all-agents
openclaw sessions --active 120
openclaw sessions --verbose
openclaw sessions --json
```

Selección de alcance:

- predeterminado: almacén del agente predeterminado configurado
- `--verbose`: registro detallado
- `--agent <id>`: un almacén de agente configurado
- `--all-agents`: agrega todos los almacenes de agentes configurados
- `--store <path>`: ruta explícita del almacén (no puede combinarse con `--agent` ni con `--all-agents`)

`openclaw sessions --all-agents` lee los almacenes de agentes configurados. El descubrimiento de sesiones del Gateway y ACP
es más amplio: también incluyen almacenes solo en disco encontrados bajo
la raíz predeterminada `agents/` o una raíz con plantilla `session.store`. Esos
almacenes descubiertos deben resolverse a archivos `sessions.json` normales dentro de la
raíz del agente; los symlinks y las rutas fuera de la raíz se omiten.

Ejemplos de JSON:

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

- Nota sobre el alcance: `openclaw sessions cleanup` mantiene solo almacenes/transcripciones de sesiones. No depura los registros de ejecución de Cron (`cron/runs/<jobId>.jsonl`), que se gestionan mediante `cron.runLog.maxBytes` y `cron.runLog.keepLines` en [Configuración de Cron](/es/automation/cron-jobs#configuration) y se explican en [Mantenimiento de Cron](/es/automation/cron-jobs#maintenance).

- `--dry-run`: previsualiza cuántas entradas se depurarían/limitarían sin escribir.
  - En modo texto, la simulación imprime una tabla de acciones por sesión (`Action`, `Key`, `Age`, `Model`, `Flags`) para que puedas ver qué se conservaría y qué se eliminaría.
- `--enforce`: aplica el mantenimiento incluso cuando `session.maintenance.mode` es `warn`.
- `--fix-missing`: elimina entradas cuyos archivos de transcripción faltan, aunque normalmente aún no se eliminarían por antigüedad o recuento.
- `--active-key <key>`: protege una clave activa específica de la expulsión por presupuesto de disco.
- `--agent <id>`: ejecuta la limpieza para un almacén de agente configurado.
- `--all-agents`: ejecuta la limpieza para todos los almacenes de agentes configurados.
- `--store <path>`: ejecuta la limpieza sobre un archivo `sessions.json` específico.
- `--json`: imprime un resumen en JSON. Con `--all-agents`, la salida incluye un resumen por almacén.

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

- Configuración de sesiones: [Referencia de configuración](/es/gateway/config-agents#session)

## Relacionado

- [Referencia de la CLI](/es/cli)
- [Gestión de sesiones](/es/concepts/session)
