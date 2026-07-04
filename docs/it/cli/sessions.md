---
read_when:
    - Vuoi elencare le sessioni archiviate e vedere l'attività recente
summary: Riferimento CLI per `openclaw sessions` (elenco delle sessioni archiviate + utilizzo)
title: Sessioni
x-i18n:
    generated_at: "2026-07-04T20:33:19Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7c24ee8a632998624ee41945b26ace3bfe37cadf9447f7632c373784a9301bde
    source_path: cli/sessions.md
    workflow: 16
---

# `openclaw sessions`

Elenca le sessioni di conversazione memorizzate.

Gli elenchi delle sessioni non sono controlli di attività di canali/provider. Mostrano righe di conversazione persistenti dagli archivi delle sessioni. Un Discord, Slack, Telegram o altro canale silenzioso può riconnettersi correttamente senza creare una nuova riga di sessione finché non viene elaborato un messaggio. Usa `openclaw channels status --probe`, `openclaw status --deep` o `openclaw health --verbose` quando ti serve la connettività live del canale.

Le risposte di `openclaw sessions` e Gateway `sessions.list` sono limitate per impostazione predefinita, così archivi grandi e longevi non possono monopolizzare il processo CLI o il ciclo eventi del Gateway. La CLI restituisce per impostazione predefinita le 100 sessioni più recenti; passa `--limit <n>` per una finestra più piccola/grande o `--limit all` quando ti serve intenzionalmente l'intero archivio. Le risposte JSON includono `totalCount`, `limitApplied` e `hasMore` quando i chiamanti devono mostrare che esistono altre righe.

I client RPC possono passare `configuredAgentsOnly: true` per mantenere l'ampia sorgente di rilevamento combinata ma restituire solo righe per gli agent attualmente presenti nella configurazione. La Control UI usa questa modalità per impostazione predefinita, così gli archivi di agent eliminati o presenti solo su disco non ricompaiono nella vista Sessioni.

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

- predefinito: archivio dell'agent predefinito configurato
- `--verbose`: logging dettagliato
- `--agent <id>`: un archivio di agent configurato
- `--all-agents`: aggrega tutti gli archivi di agent configurati
- `--store <path>`: percorso esplicito dell'archivio (non può essere combinato con `--agent` o `--all-agents`)
- `--limit <n|all>`: numero massimo di righe da produrre (predefinito `100`; `all` ripristina l'output completo)

Segui l'avanzamento della traiettoria in formato leggibile per le sessioni memorizzate:

```bash
openclaw sessions tail
openclaw sessions tail --follow
openclaw sessions tail --session-key "agent:main:telegram:direct:123" --tail 25
openclaw sessions --agent work tail --follow
openclaw sessions --all-agents tail --follow
```

`openclaw sessions tail` renderizza gli eventi JSONL recenti della traiettoria come righe di avanzamento compatte. Senza `--session-key`, segue prima le sessioni in esecuzione, poi l'ultima sessione memorizzata. `--tail <count>` controlla quanti eventi esistenti stampare prima della modalità follow; il valore predefinito è `80` e `0` inizia dalla fine corrente. `--follow` continua a osservare i file di traiettoria selezionati, inclusi i file spostati referenziati da `<session>.trajectory-path.json`.

La vista di avanzamento è intenzionalmente prudente: il testo del prompt, gli argomenti degli strumenti e i corpi dei risultati degli strumenti non vengono stampati. Le chiamate agli strumenti mostrano il nome dello strumento con `{...redacted...}`; i risultati degli strumenti mostrano uno stato come `ok`, `error` o `done`; le righe di completamento del modello mostrano provider/modello e stato terminale.

Esporta un bundle di traiettoria per una sessione memorizzata:

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --output bug-123 --json
```

Questo è il percorso di comando usato dal comando slash `/export-trajectory` dopo che l'owner approva la richiesta exec. La directory di output viene sempre risolta dentro `.openclaw/trajectory-exports/` sotto il workspace selezionato.

`openclaw sessions --all-agents` legge gli archivi di agent configurati. Il rilevamento delle sessioni Gateway e ACP è più ampio: include anche archivi presenti solo su disco trovati sotto la root predefinita `agents/` o una root `session.store` basata su template. Quegli archivi rilevati devono risolversi in file `sessions.json` regolari dentro la root dell'agent; i symlink e i percorsi fuori dalla root vengono ignorati.

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

Esegui la manutenzione ora (invece di attendere il ciclo di scrittura successivo):

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

- Nota sull'ambito: `openclaw sessions cleanup` mantiene archivi delle sessioni, trascrizioni e sidecar di traiettoria. Non elimina la cronologia delle esecuzioni cron, che è gestita da `cron.runLog.keepLines` in [Configurazione Cron](/it/automation/cron-jobs#configuration) e spiegata in [Manutenzione Cron](/it/automation/cron-jobs#maintenance).
- La pulizia elimina anche trascrizioni primarie non referenziate, checkpoint di Compaction e sidecar di traiettoria più vecchi di `session.maintenance.pruneAfter`; i file ancora referenziati da `sessions.json` vengono preservati.
- La pulizia riporta separatamente la pulizia delle probe gateway model-run di breve durata come `modelRunPruned`. Questa corrisponde solo a chiavi esplicite rigorose con forma `agent:*:explicit:model-run-<uuid>`. La retention fissa è `24h`, ma è regolata dalla pressione: rimuove le righe probe obsolete solo quando viene raggiunta la pressione di manutenzione/cap delle voci di sessione. Quando viene eseguita, la pulizia model-run avviene prima della pulizia globale degli elementi obsoleti e dell'applicazione del limite.

- `--dry-run`: anteprima di quante voci verrebbero eliminate/limitate senza scrivere.
  - In modalità testo, dry-run stampa una tabella di azioni per sessione (`Action`, `Key`, `Age`, `Model`, `Flags`) più un riepilogo raggruppato per etichetta di sessione, così puoi vedere cosa verrebbe mantenuto rispetto a cosa verrebbe rimosso.
- `--enforce`: applica la manutenzione anche quando `session.maintenance.mode` è `warn`.
- `--fix-missing`: rimuove le voci i cui file di trascrizione mancano o sono solo header/vuoti, anche se normalmente non sarebbero ancora escluse per età/conteggio.
- `--fix-dm-scope`: quando `session.dmScope` è `main`, ritira le righe DM dirette obsolete con chiave peer lasciate da routing precedenti `per-peer`, `per-channel-peer` o `per-account-channel-peer`. Usa prima `--dry-run`; applicare la pulizia rimuove quelle righe da `sessions.json` e preserva le loro trascrizioni come archivi eliminati.
- `--active-key <key>`: protegge una chiave attiva specifica dall'eviction del budget su disco. Anche i puntatori durevoli a conversazioni esterne, come sessioni di gruppo e sessioni chat con ambito thread, vengono mantenuti dalla manutenzione per età/conteggio/budget su disco.
- `--agent <id>`: esegue la pulizia per un archivio di agent configurato.
- `--all-agents`: esegue la pulizia per tutti gli archivi di agent configurati.
- `--store <path>`: esegue su un file `sessions.json` specifico.
- `--json`: stampa un riepilogo JSON. Con `--all-agents`, l'output include un riepilogo per ogni archivio.

Quando un Gateway è raggiungibile, la pulizia non-dry-run per gli archivi di agent configurati viene inviata tramite il Gateway, così condivide lo stesso writer dell'archivio sessioni del traffico runtime. Usa `--store <path>` per una riparazione offline esplicita di un file di archivio.

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

## Compattare una sessione

Recupera budget di contesto per una sessione bloccata o sovradimensionata. `openclaw sessions compact <key>` è il wrapper di prima classe attorno alla RPC gateway `sessions.compact` e richiede un gateway in esecuzione.

```bash
openclaw sessions compact "agent:main:main"
openclaw sessions compact "agent:main:main" --max-lines 200
openclaw sessions compact "agent:work:main" --agent work --json
```

- Senza `--max-lines`, il gateway riassume la trascrizione tramite LLM. La CLI non impone una scadenza client per impostazione predefinita; il gateway possiede il ciclo di vita della compaction configurato.
- Con `--max-lines <n>`, tronca alle ultime `n` righe della trascrizione e archivia la trascrizione precedente come sidecar `.bak`.
- `--agent <id>`: agent che possiede la sessione; richiesto per le chiavi `global`.
- `--url` / `--token` / `--password`: override della connessione al gateway.
- `--timeout <ms>`: timeout RPC facoltativo lato client in millisecondi.
- `--json`: stampa il payload RPC grezzo.

Il comando esce con codice diverso da zero quando il gateway segnala una compaction non riuscita o non è raggiungibile, così cron e script non scambiano mai un no-op silenzioso per un successo.

> Nota: `openclaw agent --message '/compact ...'` **non** è un percorso di compaction. I comandi slash dalla CLI vengono rifiutati dal controllo authorized-sender; quell'invocazione esce con codice diverso da zero con una guida che punta qui invece di eseguire silenziosamente un no-op.

### RPC sessions.compact

`openclaw gateway call sessions.compact --params '<json>'` accetta:

| Campo      | Tipo        | Obbligatorio | Descrizione                                                |
| ---------- | ----------- | ------------ | ---------------------------------------------------------- |
| `key`      | string      | sì           | Chiave della sessione da compattare (per esempio `agent:main:main`). |
| `agentId`  | string      | no           | ID dell'agent che possiede la sessione (per chiavi `global`). |
| `maxLines` | intero ≥ 1  | no           | Tronca alle ultime N righe invece della sintesi LLM.       |

Esempio di risposta di sintesi LLM:

```json
{
  "ok": true,
  "key": "agent:main:main",
  "compacted": true,
  "result": { "tokensBefore": 243868, "tokensAfter": 34941 }
}
```

Esempio di risposta di troncamento (`--max-lines 200`):

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

- Configurazione sessione: [Riferimento di configurazione](/it/gateway/config-agents#session)
- [Riferimento CLI](/it/cli)
- [Gestione delle sessioni](/it/concepts/session)
