---
read_when:
    - Vuoi elencare le sessioni salvate e visualizzare l'attività recente
summary: Riferimento CLI per `openclaw sessions` (elenco delle sessioni salvate + utilizzo)
title: Sessioni
x-i18n:
    generated_at: "2026-05-02T20:43:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5c9ec3ca55f7c5b6217b481e9da62f5416df73e69405a0dc15e77d2afeac723f
    source_path: cli/sessions.md
    workflow: 16
---

# `openclaw sessions`

Elenca le sessioni di conversazione archiviate.

Gli elenchi delle sessioni non sono controlli di operatività di canali/provider. Mostrano le righe di conversazione persistite dagli archivi delle sessioni. Un Discord, Slack, Telegram o altro canale inattivo può riconnettersi correttamente senza creare una nuova riga di sessione finché non viene elaborato un messaggio. Usa `openclaw channels status --probe`, `openclaw status --deep` o `openclaw health --verbose` quando hai bisogno della connettività live del canale.

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
- `--verbose`: log dettagliati
- `--agent <id>`: un archivio agente configurato
- `--all-agents`: aggrega tutti gli archivi agente configurati
- `--store <path>`: percorso esplicito dell'archivio (non può essere combinato con `--agent` o `--all-agents`)

Esporta un pacchetto di traiettoria per una sessione archiviata:

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --output bug-123 --json
```

Questo è il percorso del comando usato dal comando slash `/export-trajectory` dopo che il proprietario approva la richiesta di esecuzione. La directory di output viene sempre risolta dentro `.openclaw/trajectory-exports/` nell'area di lavoro selezionata.

`openclaw sessions --all-agents` legge gli archivi agente configurati. Il rilevamento delle sessioni Gateway e ACP è più ampio: include anche gli archivi presenti solo su disco trovati sotto la radice predefinita `agents/` o una radice `session.store` basata su template. Tali archivi rilevati devono risolversi in file `sessions.json` regolari dentro la radice dell'agente; i symlink e i percorsi esterni alla radice vengono ignorati.

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

- Nota sull'ambito: `openclaw sessions cleanup` mantiene archivi delle sessioni, trascrizioni e sidecar delle traiettorie. Non elimina i log delle esecuzioni Cron (`cron/runs/<jobId>.jsonl`), che sono gestiti da `cron.runLog.maxBytes` e `cron.runLog.keepLines` in [Configurazione Cron](/it/automation/cron-jobs#configuration) e spiegati in [Manutenzione Cron](/it/automation/cron-jobs#maintenance).

- `--dry-run`: visualizza in anteprima quante voci verrebbero eliminate/limitate senza scrivere.
  - In modalità testo, dry-run stampa una tabella delle azioni per sessione (`Action`, `Key`, `Age`, `Model`, `Flags`) così puoi vedere cosa verrebbe mantenuto rispetto a cosa verrebbe rimosso.
- `--enforce`: applica la manutenzione anche quando `session.maintenance.mode` è `warn`.
- `--fix-missing`: rimuove le voci i cui file di trascrizione mancano, anche se normalmente non sarebbero ancora escluse per età/numero.
- `--active-key <key>`: protegge una chiave attiva specifica dall'espulsione per budget del disco. Anche i puntatori durevoli a conversazioni esterne, come le sessioni di gruppo e le sessioni chat con ambito thread, vengono mantenuti dalla manutenzione per età/numero/budget del disco.
- `--agent <id>`: esegue la pulizia per un archivio agente configurato.
- `--all-agents`: esegue la pulizia per tutti gli archivi agente configurati.
- `--store <path>`: esegue l'operazione su un file `sessions.json` specifico.
- `--json`: stampa un riepilogo JSON. Con `--all-agents`, l'output include un riepilogo per ogni archivio.

Quando un Gateway è raggiungibile, la pulizia non dry-run per gli archivi agente configurati viene inviata tramite il Gateway, così condivide lo stesso writer dell'archivio sessioni del traffico runtime. Usa `--store <path>` per la riparazione offline esplicita di un file di archivio.

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

- Configurazione delle sessioni: [Riferimento di configurazione](/it/gateway/config-agents#session)

## Correlati

- [Riferimento CLI](/it/cli)
- [Gestione delle sessioni](/it/concepts/session)
