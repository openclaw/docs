---
read_when:
    - Vuoi elencare le sessioni salvate e visualizzare l'attività recente
summary: Riferimento CLI per `openclaw sessions` (elenco delle sessioni salvate + utilizzo)
title: Sessioni
x-i18n:
    generated_at: "2026-04-30T08:44:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9fea2014f538b00a27fa0078391a421843052333c5bcfc8100fced515eed0004
    source_path: cli/sessions.md
    workflow: 16
---

# `openclaw sessions`

Elenca le sessioni di conversazione memorizzate.

```bash
openclaw sessions
openclaw sessions --agent work
openclaw sessions --all-agents
openclaw sessions --active 120
openclaw sessions --verbose
openclaw sessions --json
```

Selezione dell'ambito:

- predefinito: archivio agente predefinito configurato
- `--verbose`: logging dettagliato
- `--agent <id>`: un archivio agente configurato
- `--all-agents`: aggrega tutti gli archivi agente configurati
- `--store <path>`: percorso esplicito dell'archivio (non può essere combinato con `--agent` o `--all-agents`)

Esporta un bundle di traiettoria per una sessione memorizzata:

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --output bug-123 --json
```

Questo è il percorso di comando usato dal comando slash `/export-trajectory` dopo
che il proprietario approva la richiesta di esecuzione. La directory di output viene sempre risolta
all'interno di `.openclaw/trajectory-exports/` sotto il workspace selezionato.

`openclaw sessions --all-agents` legge gli archivi agente configurati. Il rilevamento delle sessioni Gateway e ACP
è più ampio: include anche gli archivi presenti solo su disco trovati sotto
la radice `agents/` predefinita o una radice `session.store` con template. Tali
archivi rilevati devono risolversi in normali file `sessions.json` all'interno della
radice dell'agente; i link simbolici e i percorsi esterni alla radice vengono ignorati.

Esempi JSON:

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

## Manutenzione di pulizia

Esegui subito la manutenzione (invece di attendere il prossimo ciclo di scrittura):

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --agent work --dry-run
openclaw sessions cleanup --all-agents --dry-run
openclaw sessions cleanup --enforce
openclaw sessions cleanup --enforce --active-key "agent:main:telegram:direct:123"
openclaw sessions cleanup --json
```

`openclaw sessions cleanup` usa le impostazioni `session.maintenance` dalla configurazione:

- Nota sull'ambito: `openclaw sessions cleanup` mantiene archivi di sessioni, trascrizioni e sidecar delle traiettorie. Non elimina i log di esecuzione Cron (`cron/runs/<jobId>.jsonl`), che sono gestiti da `cron.runLog.maxBytes` e `cron.runLog.keepLines` in [Configurazione Cron](/it/automation/cron-jobs#configuration) e spiegati in [Manutenzione Cron](/it/automation/cron-jobs#maintenance).

- `--dry-run`: anteprima di quante voci verrebbero eliminate o limitate senza scrivere.
  - In modalità testo, dry-run stampa una tabella delle azioni per sessione (`Action`, `Key`, `Age`, `Model`, `Flags`) così puoi vedere cosa verrebbe mantenuto o rimosso.
- `--enforce`: applica la manutenzione anche quando `session.maintenance.mode` è `warn`.
- `--fix-missing`: rimuove le voci i cui file di trascrizione mancano, anche se normalmente non verrebbero ancora escluse per età o conteggio.
- `--active-key <key>`: protegge una chiave attiva specifica dall'espulsione dovuta al budget disco.
- `--agent <id>`: esegue la pulizia per un archivio agente configurato.
- `--all-agents`: esegue la pulizia per tutti gli archivi agente configurati.
- `--store <path>`: esegue l'operazione su uno specifico file `sessions.json`.
- `--json`: stampa un riepilogo JSON. Con `--all-agents`, l'output include un riepilogo per archivio.

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

Correlato:

- Configurazione della sessione: [Riferimento di configurazione](/it/gateway/config-agents#session)

## Correlati

- [Riferimento CLI](/it/cli)
- [Gestione delle sessioni](/it/concepts/session)
