---
read_when:
    - Vuoi elencare le sessioni memorizzate e vedere l'attività recente
summary: Riferimento CLI per `openclaw sessions` (elencare le sessioni memorizzate + utilizzo)
title: sessions
x-i18n:
    generated_at: "2026-04-05T13:48:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 47eb55d90bd0681676283310cfa50dcacc95dff7d9a39bf2bb188788c6e5e5ba
    source_path: cli/sessions.md
    workflow: 15
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

- predefinito: archivio dell'agente predefinito configurato
- `--verbose`: logging verboso
- `--agent <id>`: un archivio di un agente configurato
- `--all-agents`: aggrega tutti gli archivi degli agenti configurati
- `--store <path>`: percorso esplicito dell'archivio (non può essere combinato con `--agent` o `--all-agents`)

`openclaw sessions --all-agents` legge gli archivi degli agenti configurati. La
rilevazione delle sessioni del Gateway e di ACP è più ampia: include anche gli
archivi presenti solo su disco trovati sotto la radice predefinita `agents/` o
una radice `session.store` con template. Tali archivi rilevati devono risolversi
in file `sessions.json` regolari all'interno della radice dell'agente; i
symlink e i percorsi fuori dalla radice vengono saltati.

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

Esegui subito la manutenzione (invece di aspettare il ciclo di scrittura successivo):

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --agent work --dry-run
openclaw sessions cleanup --all-agents --dry-run
openclaw sessions cleanup --enforce
openclaw sessions cleanup --enforce --active-key "agent:main:telegram:direct:123"
openclaw sessions cleanup --json
```

`openclaw sessions cleanup` usa le impostazioni `session.maintenance` dalla configurazione:

- Nota sull'ambito: `openclaw sessions cleanup` gestisce solo archivi/trascrizioni delle sessioni. Non esegue il pruning dei log di esecuzione cron (`cron/runs/<jobId>.jsonl`), che sono gestiti da `cron.runLog.maxBytes` e `cron.runLog.keepLines` in [Configurazione Cron](/it/automation/cron-jobs#configuration) e spiegati in [Manutenzione Cron](/it/automation/cron-jobs#maintenance).

- `--dry-run`: mostra in anteprima quante voci verrebbero eliminate/limitate senza scrivere.
  - In modalità testo, il dry run stampa una tabella di azioni per sessione (`Action`, `Key`, `Age`, `Model`, `Flags`) così puoi vedere cosa verrebbe mantenuto rispetto a cosa verrebbe rimosso.
- `--enforce`: applica la manutenzione anche quando `session.maintenance.mode` è `warn`.
- `--fix-missing`: rimuove le voci i cui file di trascrizione mancano, anche se normalmente non sarebbero ancora escluse per età/conteggio.
- `--active-key <key>`: protegge una specifica chiave attiva dall'espulsione dovuta al budget disco.
- `--agent <id>`: esegue la pulizia per un archivio di un agente configurato.
- `--all-agents`: esegue la pulizia per tutti gli archivi degli agenti configurati.
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

Correlati:

- Configurazione delle sessioni: [Riferimento della configurazione](/gateway/configuration-reference#session)
