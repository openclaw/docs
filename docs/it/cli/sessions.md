---
read_when:
    - Vuoi elencare le sessioni memorizzate e vedere l'attività recente
summary: Riferimento CLI per `openclaw sessions` (elenco delle sessioni memorizzate + utilizzo)
title: Sessioni
x-i18n:
    generated_at: "2026-05-04T07:02:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8dc90344f40c53513bd6db3696bc709279155f26e7c3b6ea27e81a07a2f9f15e
    source_path: cli/sessions.md
    workflow: 16
---

# `openclaw sessions`

Elenca le sessioni di conversazione archiviate.

Gli elenchi delle sessioni non sono controlli di attività di canali/provider. Mostrano le righe di conversazione persistite dagli store delle sessioni. Un canale Discord, Slack, Telegram o di altro tipo silenzioso può riconnettersi correttamente senza creare una nuova riga di sessione finché non viene elaborato un messaggio. Usa `openclaw channels status --probe`, `openclaw status --deep` oppure `openclaw health --verbose` quando ti serve la connettività live del canale.

Le risposte Gateway `sessions.list` sono limitate per impostazione predefinita, così gli store grandi e di lunga durata non possono monopolizzare il ciclo eventi del Gateway. Passa un `limit` positivo esplicito dai client RPC quando serve una finestra di risultati diversa; le risposte includono `totalCount`, `limitApplied` e `hasMore` quando i chiamanti devono mostrare che esistono altre righe.

```bash
openclaw sessions
openclaw sessions --agent work
openclaw sessions --all-agents
openclaw sessions --active 120
openclaw sessions --verbose
openclaw sessions --json
```

Selezione dell'ambito:

- predefinito: store dell'agente predefinito configurato
- `--verbose`: logging dettagliato
- `--agent <id>`: uno store di agente configurato
- `--all-agents`: aggrega tutti gli store di agenti configurati
- `--store <path>`: percorso dello store esplicito (non può essere combinato con `--agent` o `--all-agents`)

Esporta un bundle di traiettoria per una sessione archiviata:

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --output bug-123 --json
```

Questo è il percorso di comando usato dal comando slash `/export-trajectory` dopo che il proprietario approva la richiesta di esecuzione. La directory di output viene sempre risolta dentro `.openclaw/trajectory-exports/` nell'area di lavoro selezionata.

`openclaw sessions --all-agents` legge gli store degli agenti configurati. Il rilevamento delle sessioni Gateway e ACP è più ampio: include anche gli store presenti solo su disco trovati sotto la radice `agents/` predefinita o una radice `session.store` con template. Questi store rilevati devono risolversi in normali file `sessions.json` dentro la radice dell'agente; i collegamenti simbolici e i percorsi fuori radice vengono ignorati.

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

- Nota sull'ambito: `openclaw sessions cleanup` mantiene gli store delle sessioni, le trascrizioni e i sidecar delle traiettorie. Non elimina i log delle esecuzioni cron (`cron/runs/<jobId>.jsonl`), che sono gestiti da `cron.runLog.maxBytes` e `cron.runLog.keepLines` nella [configurazione Cron](/it/automation/cron-jobs#configuration) e spiegati in [manutenzione Cron](/it/automation/cron-jobs#maintenance).

- `--dry-run`: mostra in anteprima quante voci verrebbero eliminate/limitate senza scrivere.
  - In modalità testo, il dry-run stampa una tabella di azioni per sessione (`Action`, `Key`, `Age`, `Model`, `Flags`) così puoi vedere cosa verrebbe mantenuto rispetto a cosa verrebbe rimosso.
- `--enforce`: applica la manutenzione anche quando `session.maintenance.mode` è `warn`.
- `--fix-missing`: rimuove le voci i cui file di trascrizione mancano, anche se normalmente non sarebbero ancora eliminate per età/numero.
- `--active-key <key>`: protegge una specifica chiave attiva dall'espulsione dovuta al budget disco. Anche i puntatori durevoli a conversazioni esterne, come le sessioni di gruppo e le sessioni chat con ambito thread, sono mantenuti dalla manutenzione per età/numero/budget disco.
- `--agent <id>`: esegue la pulizia per uno store di agente configurato.
- `--all-agents`: esegue la pulizia per tutti gli store di agenti configurati.
- `--store <path>`: esegue l'operazione su un file `sessions.json` specifico.
- `--json`: stampa un riepilogo JSON. Con `--all-agents`, l'output include un riepilogo per ogni store.

Quando un Gateway è raggiungibile, la pulizia non dry-run per gli store degli agenti configurati viene inviata tramite il Gateway, così condivide lo stesso writer dello store delle sessioni del traffico runtime. Usa `--store <path>` per la riparazione offline esplicita di un file di store.

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

- Configurazione delle sessioni: [riferimento di configurazione](/it/gateway/config-agents#session)

## Correlati

- [riferimento CLI](/it/cli)
- [Gestione delle sessioni](/it/concepts/session)
