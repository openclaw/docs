---
read_when:
    - Vuoi elencare le sessioni archiviate e vedere l'attività recente
summary: Riferimento CLI per `openclaw sessions` (elenco delle sessioni memorizzate + utilizzo)
title: Sessioni
x-i18n:
    generated_at: "2026-05-07T13:14:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: cdfdc9223f11da87b514f96e0a9505286e36d98647b3ff3a79b90588e4e69c1b
    source_path: cli/sessions.md
    workflow: 16
---

# `openclaw sessions`

Elenca le sessioni di conversazione archiviate.

Gli elenchi delle sessioni non sono controlli di operatività di canali/provider. Mostrano le righe di conversazione persistenti dagli archivi delle sessioni. Un canale Discord, Slack, Telegram o altro canale inattivo può riconnettersi correttamente senza creare una nuova riga di sessione finché non viene elaborato un messaggio. Usa `openclaw channels status --probe`, `openclaw status --deep` o `openclaw health --verbose` quando ti serve la connettività live del canale.

Le risposte di `openclaw sessions` e Gateway `sessions.list` sono limitate per impostazione predefinita, così archivi grandi e longevi non possono monopolizzare il processo CLI o il ciclo di eventi del Gateway. La CLI restituisce per impostazione predefinita le 100 sessioni più recenti; passa `--limit <n>` per una finestra più piccola/grande o `--limit all` quando ti serve intenzionalmente l'intero archivio. Le risposte JSON includono `totalCount`, `limitApplied` e `hasMore` quando i chiamanti devono mostrare che esistono altre righe.

I client RPC possono passare `configuredAgentsOnly: true` per mantenere l'ampia sorgente di discovery combinata ma restituire solo righe per gli agenti attualmente presenti nella configurazione. L'UI di controllo usa questa modalità per impostazione predefinita, così gli archivi di agenti eliminati o presenti solo su disco non ricompaiono nella vista Sessioni.

```bash
openclaw sessions
openclaw sessions --agent work
openclaw sessions --all-agents
openclaw sessions --active 120
openclaw sessions --limit 25
openclaw sessions --verbose
openclaw sessions --json
```

Selezione dell'ambito:

- predefinito: archivio dell'agente predefinito configurato
- `--verbose`: logging dettagliato
- `--agent <id>`: un archivio di agente configurato
- `--all-agents`: aggrega tutti gli archivi degli agenti configurati
- `--store <path>`: percorso esplicito dell'archivio (non può essere combinato con `--agent` o `--all-agents`)
- `--limit <n|all>`: numero massimo di righe da produrre (predefinito `100`; `all` ripristina l'output completo)

Esporta un bundle di traiettoria per una sessione archiviata:

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --output bug-123 --json
```

Questo è il percorso del comando usato dallo slash command `/export-trajectory` dopo che il proprietario approva la richiesta exec. La directory di output viene sempre risolta all'interno di `.openclaw/trajectory-exports/` sotto il workspace selezionato.

`openclaw sessions --all-agents` legge gli archivi degli agenti configurati. La discovery delle sessioni di Gateway e ACP è più ampia: include anche gli archivi presenti solo su disco trovati sotto la radice predefinita `agents/` o una radice `session.store` basata su template. Gli archivi scoperti devono risolversi in normali file `sessions.json` all'interno della radice dell'agente; i symlink e i percorsi esterni alla radice vengono ignorati.

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
openclaw sessions cleanup --dry-run --fix-dm-scope
openclaw sessions cleanup --json
```

`openclaw sessions cleanup` usa le impostazioni `session.maintenance` dalla configurazione:

- Nota sull'ambito: `openclaw sessions cleanup` gestisce gli archivi delle sessioni, le trascrizioni e i sidecar delle traiettorie. Non elimina i log di esecuzione cron (`cron/runs/<jobId>.jsonl`), che sono gestiti da `cron.runLog.maxBytes` e `cron.runLog.keepLines` nella [configurazione Cron](/it/automation/cron-jobs#configuration) e spiegati nella [manutenzione Cron](/it/automation/cron-jobs#maintenance).
- La pulizia elimina anche trascrizioni primarie non referenziate, checkpoint di Compaction e sidecar di traiettoria più vecchi di `session.maintenance.pruneAfter`; i file ancora referenziati da `sessions.json` vengono conservati.

- `--dry-run`: anteprima di quante voci verrebbero eliminate/limitate senza scrivere.
  - In modalità testo, dry-run stampa una tabella di azioni per sessione (`Action`, `Key`, `Age`, `Model`, `Flags`) così puoi vedere cosa verrebbe mantenuto rispetto a cosa verrebbe rimosso.
- `--enforce`: applica la manutenzione anche quando `session.maintenance.mode` è `warn`.
- `--fix-missing`: rimuove le voci i cui file di trascrizione sono mancanti, anche se normalmente non verrebbero ancora escluse per età/numero.
- `--fix-dm-scope`: quando `session.dmScope` è `main`, ritira le righe direct-DM obsolete con chiave peer lasciate da instradamenti precedenti `per-peer`, `per-channel-peer` o `per-account-channel-peer`. Usa prima `--dry-run`; l'applicazione della pulizia rimuove quelle righe da `sessions.json` e conserva le loro trascrizioni come archivi eliminati.
- `--active-key <key>`: protegge una chiave attiva specifica dall'espulsione per budget disco. Anche i puntatori durevoli a conversazioni esterne, come sessioni di gruppo e sessioni di chat con ambito thread, vengono mantenuti dalla manutenzione per età/numero/budget disco.
- `--agent <id>`: esegue la pulizia per un archivio di agente configurato.
- `--all-agents`: esegue la pulizia per tutti gli archivi degli agenti configurati.
- `--store <path>`: esegue l'operazione su un file `sessions.json` specifico.
- `--json`: stampa un riepilogo JSON. Con `--all-agents`, l'output include un riepilogo per ciascun archivio.

Quando un Gateway è raggiungibile, la pulizia non dry-run per gli archivi degli agenti configurati viene inviata tramite il Gateway, così condivide lo stesso writer dell'archivio sessioni del traffico runtime. Usa `--store <path>` per la riparazione offline esplicita di un file di archivio.

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
      "missing": 0,
      "dmScopeRetired": 0,
      "pruned": 40,
      "capped": 0
    },
    {
      "agentId": "work",
      "storePath": "/home/user/.openclaw/agents/work/sessions/sessions.json",
      "beforeCount": 18,
      "afterCount": 18,
      "missing": 0,
      "dmScopeRetired": 0,
      "pruned": 0,
      "capped": 0
    }
  ]
}
```

Correlato:

- Configurazione delle sessioni: [Riferimento della configurazione](/it/gateway/config-agents#session)

## Correlati

- [Riferimento CLI](/it/cli)
- [Gestione delle sessioni](/it/concepts/session)
