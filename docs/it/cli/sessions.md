---
read_when:
    - Vuoi elencare le sessioni memorizzate e vedere l'attività recente
summary: Riferimento CLI per `openclaw sessions` (elenco delle sessioni archiviate + utilizzo)
title: Sessioni
x-i18n:
    generated_at: "2026-06-27T17:22:06Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7b9454e4b6ef925f8f90b5e8beceb6bea6404539f460cb78bcf82e241dff168d
    source_path: cli/sessions.md
    workflow: 16
---

# `openclaw sessions`

Elenca le sessioni di conversazione archiviate.

Gli elenchi delle sessioni non sono controlli di vitalità di canali/provider. Mostrano le righe di conversazione persistite dagli archivi delle sessioni. Un canale Discord, Slack, Telegram o di altro tipo inattivo può riconnettersi correttamente senza creare una nuova riga di sessione finché non viene elaborato un messaggio. Usa `openclaw channels status --probe`, `openclaw status --deep` o `openclaw health --verbose` quando ti serve la connettività live del canale.

Le risposte di `openclaw sessions` e Gateway `sessions.list` sono limitate per impostazione predefinita, così gli store grandi e longevi non possono monopolizzare il processo CLI o il ciclo eventi del Gateway. La CLI restituisce per impostazione predefinita le 100 sessioni più recenti; passa `--limit <n>` per una finestra più piccola/grande o `--limit all` quando hai intenzionalmente bisogno dell'intero store. Le risposte JSON includono `totalCount`, `limitApplied` e `hasMore` quando i chiamanti devono mostrare che esistono altre righe.

I client RPC possono passare `configuredAgentsOnly: true` per mantenere la sorgente di discovery combinata ampia, ma restituire solo righe per gli agenti attualmente presenti nella configurazione. Control UI usa questa modalità per impostazione predefinita, così gli store di agenti eliminati o presenti solo su disco non riappaiono nella vista Sessions.

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

- default: store dell'agente predefinito configurato
- `--verbose`: logging dettagliato
- `--agent <id>`: store di un agente configurato
- `--all-agents`: aggrega tutti gli store degli agenti configurati
- `--store <path>`: percorso esplicito dello store (non può essere combinato con `--agent` o `--all-agents`)
- `--limit <n|all>`: numero massimo di righe da produrre (predefinito `100`; `all` ripristina l'output completo)

Segui l'avanzamento leggibile della traiettoria per le sessioni archiviate:

```bash
openclaw sessions tail
openclaw sessions tail --follow
openclaw sessions tail --session-key "agent:main:telegram:direct:123" --tail 25
openclaw sessions --agent work tail --follow
openclaw sessions --all-agents tail --follow
```

`openclaw sessions tail` renderizza gli eventi JSONL recenti della traiettoria come righe di avanzamento compatte. Senza `--session-key`, segue prima le sessioni in esecuzione, poi l'ultima sessione archiviata. `--tail <count>` controlla quanti eventi esistenti stampare prima della modalità follow; il valore predefinito è `80`, e `0` parte dalla fine corrente. `--follow` continua a osservare i file di traiettoria selezionati, inclusi i file ricollocati referenziati da `<session>.trajectory-path.json`.

La vista di avanzamento è intenzionalmente conservativa: il testo del prompt, gli argomenti degli strumenti e i corpi dei risultati degli strumenti non vengono stampati. Le chiamate agli strumenti mostrano il nome dello strumento con `{...redacted...}`; i risultati degli strumenti mostrano uno stato come `ok`, `error` o `done`; le righe di completamento del modello mostrano provider/modello e stato terminale.

Esporta un bundle di traiettoria per una sessione archiviata:

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --output bug-123 --json
```

Questo è il percorso del comando usato dal comando slash `/export-trajectory` dopo che il proprietario approva la richiesta di esecuzione. La directory di output viene sempre risolta dentro `.openclaw/trajectory-exports/` nell'area di lavoro selezionata.

`openclaw sessions --all-agents` legge gli store degli agenti configurati. La discovery di sessioni Gateway e ACP è più ampia: include anche gli store presenti solo su disco trovati sotto la radice predefinita `agents/` o una radice `session.store` basata su template. Questi store rilevati devono risolversi in normali file `sessions.json` dentro la radice dell'agente; symlink e percorsi esterni alla radice vengono ignorati.

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

## Manutenzione di pulizia

Esegui subito la manutenzione (invece di attendere il prossimo ciclo di scrittura):

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

- Nota sull'ambito: `openclaw sessions cleanup` mantiene store di sessioni, trascrizioni e sidecar di traiettoria. Non elimina la cronologia delle esecuzioni Cron, che è gestita da `cron.runLog.keepLines` in [Configurazione Cron](/it/automation/cron-jobs#configuration) e spiegata in [Manutenzione Cron](/it/automation/cron-jobs#maintenance).
- Cleanup elimina anche trascrizioni primarie non referenziate, checkpoint di Compaction e sidecar di traiettoria più vecchi di `session.maintenance.pruneAfter`; i file ancora referenziati da `sessions.json` vengono preservati.
- Cleanup riporta separatamente la pulizia dei probe di breve durata delle esecuzioni modello del gateway come `modelRunPruned`. Questa corrisponde solo a chiavi esplicite rigorose con forma `agent:*:explicit:model-run-<uuid>`. La conservazione fissa è `24h`, ma è vincolata alla pressione: rimuove le righe di probe obsolete solo quando viene raggiunta la manutenzione/pressione di capacità delle voci di sessione. Quando viene eseguita, la pulizia model-run avviene prima della pulizia globale delle voci obsolete e del capping.

- `--dry-run`: mostra in anteprima quante voci verrebbero eliminate/limitate senza scrivere.
  - In modalità testo, dry-run stampa una tabella di azioni per sessione (`Action`, `Key`, `Age`, `Model`, `Flags`) più un riepilogo raggruppato per etichetta di sessione, così puoi vedere cosa verrebbe mantenuto rispetto a rimosso.
- `--enforce`: applica la manutenzione anche quando `session.maintenance.mode` è `warn`.
- `--fix-missing`: rimuove le voci i cui file di trascrizione sono mancanti o solo intestazione/vuoti, anche se normalmente non verrebbero ancora esclusi per età/conteggio.
- `--fix-dm-scope`: quando `session.dmScope` è `main`, ritira le righe direct-DM obsolete con chiave peer lasciate da routing precedenti `per-peer`, `per-channel-peer` o `per-account-channel-peer`. Usa prima `--dry-run`; applicare la pulizia rimuove quelle righe da `sessions.json` e preserva le loro trascrizioni come archivi eliminati.
- `--active-key <key>`: protegge una specifica chiave attiva dall'espulsione per budget disco. I puntatori durevoli a conversazioni esterne, come sessioni di gruppo e sessioni chat con ambito thread, vengono mantenuti anche dalla manutenzione per età/conteggio/budget disco.
- `--agent <id>`: esegue cleanup per lo store di un agente configurato.
- `--all-agents`: esegue cleanup per tutti gli store degli agenti configurati.
- `--store <path>`: esegue contro uno specifico file `sessions.json`.
- `--json`: stampa un riepilogo JSON. Con `--all-agents`, l'output include un riepilogo per store.

Quando un Gateway è raggiungibile, la pulizia non dry-run per gli store degli agenti configurati viene inviata attraverso il Gateway, così condivide lo stesso writer dello store di sessioni del traffico runtime. Usa `--store <path>` per la riparazione offline esplicita di un file di store.

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

## Eseguire la Compaction di una sessione

Recupera budget di contesto per una sessione bloccata o sovradimensionata. `openclaw sessions compact <key>` è il wrapper di prima classe attorno alla RPC gateway `sessions.compact` e richiede un gateway in esecuzione.

```bash
openclaw sessions compact "agent:main:main"
openclaw sessions compact "agent:main:main" --max-lines 200
openclaw sessions compact "agent:work:main" --agent work --json
```

- Senza `--max-lines`, il gateway riepiloga la trascrizione con LLM. Questo può essere lento, quindi il valore predefinito di `--timeout` è `180000` ms.
- Con `--max-lines <n>`, tronca alle ultime `n` righe della trascrizione e archivia la trascrizione precedente come sidecar `.bak`.
- `--agent <id>`: agente che possiede la sessione; richiesto per chiavi `global`.
- `--url` / `--token` / `--password`: override della connessione al gateway.
- `--timeout <ms>`: timeout RPC in millisecondi.
- `--json`: stampa il payload RPC grezzo.

Il comando esce con codice diverso da zero quando il gateway segnala una Compaction fallita o non è raggiungibile, così Cron e script non scambiano mai un no-op silenzioso per un successo.

> Nota: `openclaw agent --message '/compact ...'` **non** è un percorso di Compaction. I comandi slash dalla CLI vengono rifiutati dal controllo del mittente autorizzato; quell'invocazione esce con codice diverso da zero con indicazioni che puntano qui invece di non fare nulla silenziosamente.

### RPC sessions.compact

`openclaw gateway call sessions.compact --params '<json>'` accetta:

| Campo      | Tipo        | Richiesto | Descrizione                                                |
| ---------- | ----------- | --------- | ---------------------------------------------------------- |
| `key`      | string      | sì        | Chiave sessione da compattare (per esempio `agent:main:main`). |
| `agentId`  | string      | no        | ID agente che possiede la sessione (per chiavi `global`).  |
| `maxLines` | integer ≥ 1 | no        | Tronca alle ultime N righe invece del riepilogo LLM.       |

Esempio di risposta con riepilogo LLM:

```json
{
  "ok": true,
  "key": "agent:main:main",
  "compacted": true,
  "result": { "tokensBefore": 243868, "tokensAfter": 34941 }
}
```

Esempio di risposta con troncamento (`--max-lines 200`):

```json
{
  "ok": true,
  "key": "agent:main:main",
  "compacted": true,
  "archived": "/home/user/.openclaw/agents/main/sessions/transcripts/<id>.jsonl.bak",
  "kept": 200
}
```

## Correlati

- Configurazione sessione: [Riferimento configurazione](/it/gateway/config-agents#session)
- [Riferimento CLI](/it/cli)
- [Gestione sessione](/it/concepts/session)
