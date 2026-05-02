---
read_when:
    - Vuoi elencare le sessioni archiviate e vedere l'attività recente
summary: Riferimento CLI per `openclaw sessions` (elenca le sessioni memorizzate + utilizzo)
title: Sessioni
x-i18n:
    generated_at: "2026-05-02T08:19:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9c7f0d521756ace4af05451b925256f89661bf971533541764c128e2be9d6431
    source_path: cli/sessions.md
    workflow: 16
---

# `openclaw sessions`

Elenca le sessioni di conversazione archiviate.

Gli elenchi delle sessioni non sono controlli di attività di canali/provider. Mostrano righe di conversazione persistenti dagli archivi delle sessioni. Un canale Discord, Slack, Telegram o di altro tipo inattivo può riconnettersi correttamente senza creare una nuova riga di sessione finché non viene elaborato un messaggio. Usa `openclaw channels status --probe`, `openclaw status --deep` o `openclaw health --verbose` quando ti serve connettività live dei canali.

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
- `--agent <id>`: un archivio agente configurato
- `--all-agents`: aggrega tutti gli archivi agente configurati
- `--store <path>`: percorso esplicito dell'archivio (non può essere combinato con `--agent` o `--all-agents`)

Esporta un bundle di traiettoria per una sessione archiviata:

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --output bug-123 --json
```

Questo è il percorso di comando usato dal comando slash `/export-trajectory` dopo che il proprietario approva la richiesta di exec. La directory di output viene sempre risolta dentro `.openclaw/trajectory-exports/` sotto il workspace selezionato.

`openclaw sessions --all-agents` legge gli archivi agente configurati. L'individuazione delle sessioni Gateway e ACP è più ampia: include anche archivi presenti solo su disco trovati sotto la radice predefinita `agents/` o una radice `session.store` basata su template. Questi archivi individuati devono risolversi in file `sessions.json` regolari dentro la radice dell'agente; i symlink e i percorsi fuori dalla radice vengono ignorati.

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

Esegui la manutenzione ora (invece di attendere il prossimo ciclo di scrittura):

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --agent work --dry-run
openclaw sessions cleanup --all-agents --dry-run
openclaw sessions cleanup --enforce
openclaw sessions cleanup --enforce --active-key "agent:main:telegram:direct:123"
openclaw sessions cleanup --json
```

`openclaw sessions cleanup` usa le impostazioni `session.maintenance` dalla configurazione:

- Nota sull'ambito: `openclaw sessions cleanup` mantiene archivi delle sessioni, trascrizioni e sidecar delle traiettorie. Non elimina i log delle esecuzioni Cron (`cron/runs/<jobId>.jsonl`), che sono gestiti da `cron.runLog.maxBytes` e `cron.runLog.keepLines` nella [configurazione Cron](/it/automation/cron-jobs#configuration) e spiegati nella [manutenzione Cron](/it/automation/cron-jobs#maintenance).

- `--dry-run`: mostra in anteprima quante voci verrebbero eliminate o limitate senza scrivere.
  - In modalità testo, dry-run stampa una tabella di azioni per sessione (`Action`, `Key`, `Age`, `Model`, `Flags`) così puoi vedere cosa verrebbe mantenuto rispetto a cosa verrebbe rimosso.
- `--enforce`: applica la manutenzione anche quando `session.maintenance.mode` è `warn`.
- `--fix-missing`: rimuove le voci i cui file di trascrizione mancano, anche se normalmente non verrebbero ancora escluse per età/conteggio.
- `--active-key <key>`: protegge una chiave attiva specifica dall'espulsione per budget del disco. Anche i puntatori durevoli a conversazioni esterne, come sessioni di gruppo e sessioni chat con ambito thread, vengono mantenuti dalla manutenzione per età/conteggio/budget del disco.
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

Correlati:

- Configurazione delle sessioni: [riferimento alla configurazione](/it/gateway/config-agents#session)

## Correlati

- [riferimento CLI](/it/cli)
- [Gestione delle sessioni](/it/concepts/session)
