---
read_when:
    - Quieres listar las sesiones almacenadas y ver la actividad reciente
summary: Referencia de CLI para `openclaw sessions` (listar sesiones almacenadas + uso)
title: Sesiones
x-i18n:
    generated_at: "2026-04-30T05:35:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9fea2014f538b00a27fa0078391a421843052333c5bcfc8100fced515eed0004
    source_path: cli/sessions.md
    workflow: 16
---

# `openclaw sessions`

Enumera las sesiones de conversación almacenadas.

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
- `--store <path>`: ruta explícita del almacén (no se puede combinar con `--agent` ni `--all-agents`)

Exporta un paquete de trayectoria para una sesión almacenada:

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --output bug-123 --json
```

Esta es la ruta de comando que usa el comando de barra diagonal `/export-trajectory` después de que
el propietario aprueba la solicitud de ejecución. El directorio de salida siempre se resuelve
dentro de `.openclaw/trajectory-exports/` bajo el espacio de trabajo seleccionado.

`openclaw sessions --all-agents` lee los almacenes de agentes configurados. El descubrimiento de sesiones de Gateway y ACP
es más amplio: también incluye almacenes presentes solo en disco que se encuentran bajo
la raíz `agents/` predeterminada o una raíz de `session.store` con plantilla. Esos
almacenes descubiertos deben resolverse como archivos `sessions.json` normales dentro de la
raíz del agente; los enlaces simbólicos y las rutas fuera de la raíz se omiten.

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

`openclaw sessions cleanup` usa la configuración de `session.maintenance` desde la configuración:

- Nota de alcance: `openclaw sessions cleanup` mantiene almacenes de sesiones, transcripciones y archivos complementarios de trayectoria. No depura registros de ejecuciones Cron (`cron/runs/<jobId>.jsonl`), que se gestionan mediante `cron.runLog.maxBytes` y `cron.runLog.keepLines` en [configuración de Cron](/es/automation/cron-jobs#configuration) y se explican en [mantenimiento de Cron](/es/automation/cron-jobs#maintenance).

- `--dry-run`: previsualiza cuántas entradas se depurarían/limitarían sin escribir.
  - En modo de texto, dry-run imprime una tabla de acciones por sesión (`Action`, `Key`, `Age`, `Model`, `Flags`) para que puedas ver qué se conservaría y qué se eliminaría.
- `--enforce`: aplica el mantenimiento incluso cuando `session.maintenance.mode` es `warn`.
- `--fix-missing`: elimina entradas cuyos archivos de transcripción faltan, aunque normalmente todavía no se eliminarían por antigüedad/cantidad.
- `--active-key <key>`: protege una clave activa específica contra la expulsión por presupuesto de disco.
- `--agent <id>`: ejecuta la limpieza para un almacén de agente configurado.
- `--all-agents`: ejecuta la limpieza para todos los almacenes de agentes configurados.
- `--store <path>`: ejecuta contra un archivo `sessions.json` específico.
- `--json`: imprime un resumen JSON. Con `--all-agents`, la salida incluye un resumen por almacén.

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

- Configuración de sesiones: [referencia de configuración](/es/gateway/config-agents#session)

## Relacionado

- [referencia de CLI](/es/cli)
- [gestión de sesiones](/es/concepts/session)
