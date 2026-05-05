---
read_when:
    - Vuoi elencare le sessioni salvate e visualizzare l'attività recente
summary: Riferimento CLI per `openclaw sessions` (elenco delle sessioni memorizzate + utilizzo)
title: Sessioni
x-i18n:
    generated_at: "2026-05-05T01:44:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6eb484ab1fa7686cf42dd00e640c4ae8616c4ea1c29873ea72694d72b9c680e7
    source_path: cli/sessions.md
    workflow: 16
---

# `openclaw sessions`

Elenca le sessioni di conversazione archiviate.

Gli elenchi di sessioni non sono controlli di disponibilità di canali/provider. Mostrano le righe di conversazione persistenti dagli store delle sessioni. Un canale Discord, Slack, Telegram o altro canale inattivo può riconnettersi correttamente senza creare una nuova riga di sessione finché non viene elaborato un messaggio. Usa `openclaw channels status --probe`, `openclaw status --deep` o `openclaw health --verbose` quando ti serve la connettività live del canale.

Le risposte di `openclaw sessions` e Gateway `sessions.list` sono limitate per impostazione predefinita, così gli store grandi e longevi non possono monopolizzare il processo CLI o l’event loop del Gateway. La CLI restituisce per impostazione predefinita le 100 sessioni più recenti; passa `--limit <n>` per una finestra più piccola/grande o `--limit all` quando ti serve intenzionalmente lo store completo. Le risposte JSON includono `totalCount`, `limitApplied` e `hasMore` quando i chiamanti devono mostrare che esistono altre righe.

```bash
openclaw sessions
openclaw sessions --agent work
openclaw sessions --all-agents
openclaw sessions --active 120
openclaw sessions --limit 25
openclaw sessions --verbose
openclaw sessions --json
```

Selezione dell’ambito:

- predefinito: store dell’agente predefinito configurato
- `--verbose`: logging dettagliato
- `--agent <id>`: uno store dell’agente configurato
- `--all-agents`: aggrega tutti gli store degli agenti configurati
- `--store <path>`: percorso esplicito dello store (non può essere combinato con `--agent` o `--all-agents`)
- `--limit <n|all>`: numero massimo di righe da emettere (predefinito `100`; `all` ripristina l’output completo)

Esporta un bundle di traiettoria per una sessione archiviata:

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --output bug-123 --json
```

Questo è il percorso di comando usato dal comando slash `/export-trajectory` dopo che il proprietario approva la richiesta di esecuzione. La directory di output viene sempre risolta dentro `.openclaw/trajectory-exports/` nello spazio di lavoro selezionato.

`openclaw sessions --all-agents` legge gli store degli agenti configurati. La scoperta delle sessioni Gateway e ACP è più ampia: include anche gli store presenti solo su disco trovati sotto la radice predefinita `agents/` o una radice `session.store` con modello. Gli store scoperti devono risolversi in file `sessions.json` regolari dentro la radice dell’agente; i symlink e i percorsi esterni alla radice vengono ignorati.

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

- Nota sull’ambito: `openclaw sessions cleanup` mantiene store delle sessioni, trascrizioni e sidecar di traiettoria. Non elimina i log delle esecuzioni Cron (`cron/runs/<jobId>.jsonl`), che sono gestiti da `cron.runLog.maxBytes` e `cron.runLog.keepLines` in [Configurazione Cron](/it/automation/cron-jobs#configuration) e spiegati in [Manutenzione Cron](/it/automation/cron-jobs#maintenance).

- `--dry-run`: visualizza in anteprima quante voci verrebbero eliminate/limitate senza scrivere.
  - In modalità testo, dry-run stampa una tabella di azioni per sessione (`Action`, `Key`, `Age`, `Model`, `Flags`) così puoi vedere cosa verrebbe mantenuto rispetto a cosa verrebbe rimosso.
- `--enforce`: applica la manutenzione anche quando `session.maintenance.mode` è `warn`.
- `--fix-missing`: rimuove le voci i cui file di trascrizione mancano, anche se normalmente non sarebbero ancora escluse per età/conteggio.
- `--active-key <key>`: protegge una chiave attiva specifica dall’espulsione per budget su disco. Anche i puntatori durevoli a conversazioni esterne, come le sessioni di gruppo e le sessioni di chat con ambito thread, vengono mantenuti dalla manutenzione per età/conteggio/budget su disco.
- `--agent <id>`: esegue la pulizia per uno store dell’agente configurato.
- `--all-agents`: esegue la pulizia per tutti gli store degli agenti configurati.
- `--store <path>`: esegue l’operazione su uno specifico file `sessions.json`.
- `--json`: stampa un riepilogo JSON. Con `--all-agents`, l’output include un riepilogo per ogni store.

Quando un Gateway è raggiungibile, la pulizia non dry-run degli store degli agenti configurati viene inviata tramite il Gateway, così condivide lo stesso writer dello store delle sessioni del traffico runtime. Usa `--store <path>` per la riparazione offline esplicita di un file store.

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
