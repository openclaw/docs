---
read_when:
    - Vuoi elencare le sessioni archiviate e vedere l'attività recente
summary: Riferimento CLI per `openclaw sessions` (elencare le sessioni archiviate e il loro utilizzo)
title: Sessioni
x-i18n:
    generated_at: "2026-04-24T08:35:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8d9fdc5d4cc968784e6e937a1000e43650345c27765208d46611e1fe85ee9293
    source_path: cli/sessions.md
    workflow: 15
---

# `openclaw sessions`

Elenca le sessioni di conversazione archiviate.

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
- `--verbose`: logging dettagliato
- `--agent <id>`: un archivio di agente configurato
- `--all-agents`: aggrega tutti gli archivi di agenti configurati
- `--store <path>`: percorso esplicito dell'archivio (non può essere combinato con `--agent` o `--all-agents`)

`openclaw sessions --all-agents` legge gli archivi degli agenti configurati. Il rilevamento
delle sessioni Gateway e ACP è più ampio: include anche archivi solo su disco trovati sotto
la radice predefinita `agents/` o una radice `session.store` con template. Questi
archivi rilevati devono risolversi in normali file `sessions.json` all'interno della
radice dell'agente; symlink e percorsi fuori dalla radice vengono ignorati.

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

## Manutenzione della pulizia

Esegui subito la manutenzione (invece di aspettare il prossimo ciclo di scrittura):

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --agent work --dry-run
openclaw sessions cleanup --all-agents --dry-run
openclaw sessions cleanup --enforce
openclaw sessions cleanup --enforce --active-key "agent:main:telegram:direct:123"
openclaw sessions cleanup --json
```

`openclaw sessions cleanup` usa le impostazioni `session.maintenance` dalla configurazione:

- Nota sull'ambito: `openclaw sessions cleanup` esegue la manutenzione solo degli archivi/trascrizioni delle sessioni. Non elimina i log delle esecuzioni Cron (`cron/runs/<jobId>.jsonl`), che sono gestiti da `cron.runLog.maxBytes` e `cron.runLog.keepLines` nella [configurazione Cron](/it/automation/cron-jobs#configuration) e spiegati nella [manutenzione Cron](/it/automation/cron-jobs#maintenance).

- `--dry-run`: anteprima di quante voci verrebbero eliminate/limitate senza scrivere.
  - In modalità testo, la simulazione stampa una tabella di azioni per sessione (`Action`, `Key`, `Age`, `Model`, `Flags`) così puoi vedere cosa verrebbe mantenuto o rimosso.
- `--enforce`: applica la manutenzione anche quando `session.maintenance.mode` è `warn`.
- `--fix-missing`: rimuove le voci i cui file di trascrizione mancano, anche se normalmente non supererebbero ancora i limiti di età/conteggio.
- `--active-key <key>`: protegge una specifica chiave attiva dall'eliminazione dovuta al budget disco.
- `--agent <id>`: esegue la pulizia per un archivio di agente configurato.
- `--all-agents`: esegue la pulizia per tutti gli archivi di agenti configurati.
- `--store <path>`: esegue sul file `sessions.json` specificato.
- `--json`: stampa un riepilogo JSON. Con `--all-agents`, l'output include un riepilogo per ogni archivio.

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

- Configurazione sessione: [Riferimento della configurazione](/it/gateway/config-agents#session)

## Correlati

- [Riferimento CLI](/it/cli)
- [Gestione delle sessioni](/it/concepts/session)
