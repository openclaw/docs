---
read_when:
    - Si desidera elencare le sessioni archiviate e visualizzare l'attività recente
summary: Riferimento CLI per `openclaw sessions` (elenco delle sessioni archiviate + utilizzo)
title: Sessioni
x-i18n:
    generated_at: "2026-07-16T14:11:55Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: e00d846229dfad1ada1a8c9a548e26f26247d3f7e5a35106903f6cd4818878b5
    source_path: cli/sessions.md
    workflow: 16
---

# `openclaw sessions`

Elenca le sessioni di conversazione archiviate.

Gli elenchi delle sessioni non sono controlli di raggiungibilità dei canali/provider. Mostrano le righe di conversazione persistenti negli archivi delle sessioni. Un canale Discord, Slack, Telegram o di altro tipo inattivo può riconnettersi correttamente senza creare una nuova riga di sessione finché non viene elaborato un messaggio. Utilizzare `openclaw channels status --probe`, `openclaw status --deep` o `openclaw health --verbose` quando è necessario verificare la connettività del canale in tempo reale.

```bash
openclaw sessions
openclaw sessions --agent work
openclaw sessions --all-agents
openclaw sessions --active 120
openclaw sessions --limit 25
openclaw sessions --store ./tmp/sessions.json
openclaw sessions --json
```

Opzioni:

| Opzione                 | Descrizione                                                            |
| -------------------- | ---------------------------------------------------------------------- |
| `--agent <id>`       | Un archivio dell'agente configurato (impostazione predefinita: agente predefinito configurato).        |
| `--all-agents`       | Aggrega tutti gli archivi degli agenti configurati.                                 |
| `--store <path>`     | Percorso esplicito dell'archivio (non può essere combinato con `--agent` o `--all-agents`). |
| `--active <minutes>` | Mostra solo le sessioni aggiornate negli ultimi N minuti.                  |
| `--limit <n\|all>`   | Numero massimo di righe da restituire (valore predefinito `100`; `all` ripristina l'output completo).        |
| `--json`             | Output leggibile dalla macchina.                                               |
| `--verbose`          | Registrazione dettagliata.                                                       |

`openclaw sessions` e l'RPC `sessions.list` del Gateway sono limitati per impostazione predefinita, affinché gli archivi di grandi dimensioni e lunga durata non monopolizzino il processo della CLI o il ciclo degli eventi del Gateway. Per impostazione predefinita, la CLI restituisce le 100 sessioni più recenti; specificare `--limit <n>` per una finestra più piccola o più grande oppure `--limit all` quando è necessario intenzionalmente l'intero archivio. Le risposte JSON includono `totalCount`, `limitApplied` e `hasMore` quando i chiamanti devono indicare che esistono altre righe.

I client RPC possono specificare `configuredAgentsOnly: true` per mantenere l'ampia origine di rilevamento combinata, restituendo però solo le righe degli agenti attualmente presenti nella configurazione. Control UI utilizza questa modalità per impostazione predefinita, affinché gli archivi degli agenti eliminati o presenti solo su disco non ricompaiano nella vista Sessioni.

`--all-agents` legge gli archivi degli agenti configurati. Il rilevamento delle sessioni del Gateway e di ACP è più ampio: include anche gli archivi SQLite risolti dalle directory radice degli agenti configurate o da una directory radice `session.store` basata su modello. I percorsi dei selettori legacy devono essere risolti all'interno della directory radice dell'agente; i collegamenti simbolici e i percorsi esterni alla directory radice vengono ignorati.

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
    { "agentId": "main", "key": "agent:main:main", "model": "openai/gpt-5.6-sol" },
    { "agentId": "work", "key": "agent:work:main", "model": "anthropic/claude-sonnet-4-6" }
  ]
}
```

## Monitorare l'avanzamento della traiettoria

```bash
openclaw sessions tail
openclaw sessions tail --follow
openclaw sessions tail --session-key "agent:main:telegram:direct:123" --tail 25
openclaw sessions --agent work tail --follow
openclaw sessions --all-agents tail --follow
```

`openclaw sessions tail` visualizza gli eventi recenti della traiettoria di runtime come righe di avanzamento compatte. Senza `--session-key`, monitora prima le sessioni in esecuzione, quindi l'ultima sessione archiviata. `--tail <count>` controlla quanti eventi esistenti vengono stampati prima della modalità di monitoraggio continuo; il valore predefinito è `80`, mentre `0` avvia dalla fine corrente. `--follow` continua a monitorare la sessione selezionata basata su SQLite o un file di traiettoria legacy esplicito.

La vista di avanzamento è intenzionalmente prudente: il testo del prompt, gli argomenti degli strumenti e il contenuto dei risultati degli strumenti non vengono stampati. Le chiamate agli strumenti mostrano il nome dello strumento con `{...redacted...}`; i risultati degli strumenti mostrano uno stato come `ok`, `error` o `done`; le righe di completamento del modello mostrano provider/modello e stato terminale.

## Esportare un pacchetto della traiettoria

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --output bug-123 --json
```

Questo è il percorso del comando utilizzato dal comando slash `/export-trajectory` dopo che il proprietario ha approvato la richiesta di esecuzione. La directory di output viene sempre risolta all'interno di `.openclaw/trajectory-exports/` nell'area di lavoro selezionata.

## Manutenzione della pulizia

Eseguire subito la manutenzione anziché attendere il ciclo di scrittura successivo:

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --agent work --dry-run
openclaw sessions cleanup --all-agents --dry-run
openclaw sessions cleanup --enforce
openclaw sessions cleanup --enforce --active-key "agent:main:telegram:direct:123"
openclaw sessions cleanup --dry-run --fix-dm-scope
openclaw sessions cleanup --json
```

`openclaw sessions cleanup` utilizza le impostazioni `session.maintenance` della configurazione ([Riferimento della configurazione](/it/gateway/config-agents#session)):

- Nota sull'ambito: `openclaw sessions cleanup` gestisce gli archivi delle sessioni, le trascrizioni, le righe delle traiettorie e i file complementari legacy delle traiettorie. Non elimina la cronologia delle esecuzioni Cron, che conserva automaticamente le 2000 righe più recenti per processo ([Configurazione Cron](/it/automation/cron-jobs#configuration)).
- La pulizia elimina inoltre gli artefatti delle trascrizioni legacy/archiviate non referenziati, i checkpoint di Compaction e i file complementari delle traiettorie più vecchi di `session.maintenance.pruneAfter`; gli artefatti ancora referenziati dalle righe delle sessioni SQLite vengono conservati.
- La pulizia segnala separatamente come `modelRunPruned` la rimozione delle sonde di breve durata delle esecuzioni dei modelli del Gateway. Questa operazione corrisponde solo a chiavi esplicite rigorose con una struttura come `agent:*:explicit:model-run-<uuid>`. La conservazione ha un valore fisso di `24h` ed è vincolata alla pressione: rimuove le righe obsolete delle sonde solo quando viene raggiunta la pressione dovuta alla manutenzione o al limite massimo delle voci delle sessioni. Quando viene eseguita, la pulizia delle esecuzioni dei modelli avviene prima della pulizia globale delle voci obsolete e dell'applicazione dei limiti.

Opzioni:

| Opzione                 | Descrizione                                                                                                                                                                                                                                                                                                |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--dry-run`          | Mostra un'anteprima del numero di voci che verrebbero eliminate o limitate senza effettuare scritture. In modalità testo, stampa una tabella delle azioni per sessione (`Action`, `Key`, `Age`, `Model`, `Flags`) e un riepilogo raggruppato per etichetta della sessione.                                                                                                       |
| `--enforce`          | Applica la manutenzione anche quando `session.maintenance.mode` è `warn`.                                                                                                                                                                                                                                          |
| `--fix-missing`      | Rimuove le voci legacy i cui artefatti di trascrizione archiviati sono mancanti oppure contengono solo l'intestazione o sono vuoti, anche se normalmente non verrebbero ancora rimossi per età o conteggio.                                                                                                                                                             |
| `--fix-dm-scope`     | Quando `session.dmScope` è `main`, dismette le righe obsolete dei messaggi diretti con chiave per peer lasciate dai precedenti instradamenti `per-peer`, `per-channel-peer` o `per-account-channel-peer`. Utilizzare prima `--dry-run`; l'applicazione rimuove tali righe da SQLite e conserva i relativi artefatti di trascrizione legacy come archivi eliminati. |
| `--active-key <key>` | Protegge una specifica chiave attiva dall'espulsione dovuta al limite di spazio su disco. Anche i puntatori durevoli alle conversazioni esterne, come le sessioni di gruppo e le sessioni di chat circoscritte a un thread, vengono conservati dalla manutenzione basata su età, conteggio e limite di spazio su disco.                                                                                               |
| `--agent <id>`       | Esegue la pulizia per un archivio dell'agente configurato.                                                                                                                                                                                                                                                                |
| `--all-agents`       | Esegue la pulizia per tutti gli archivi degli agenti configurati.                                                                                                                                                                                                                                                               |
| `--store <path>`     | Esegue l'operazione su uno specifico percorso del selettore dell'archivio legacy.                                                                                                                                                                                                                                                         |
| `--json`             | Stampa un riepilogo JSON. Con `--all-agents`, l'output include un riepilogo per ciascun archivio.                                                                                                                                                                                                                          |

Quando un Gateway è raggiungibile, la pulizia non simulata degli archivi degli agenti configurati viene inviata tramite il Gateway, in modo da condividere lo stesso processo di scrittura dell'archivio delle sessioni utilizzato dal traffico di runtime. Utilizzare `--store <path>` per la riparazione offline esplicita di un selettore di archivio legacy.

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

Recupera il budget del contesto per una sessione bloccata o sovradimensionata. `openclaw sessions
compact <key>` è il wrapper di prima classe per l'RPC `sessions.compact` del Gateway e richiede un Gateway in esecuzione.

```bash
openclaw sessions compact "agent:main:main"
openclaw sessions compact "agent:main:main" --max-lines 200
openclaw sessions compact "agent:work:main" --agent work --json
```

- Senza `--max-lines`, il Gateway riepiloga la trascrizione mediante un LLM. Per impostazione predefinita, la CLI non impone una scadenza al client; il Gateway gestisce il ciclo di vita configurato della Compaction.
- Con `--max-lines <n>`, tronca la trascrizione alle ultime `n` righe e archivia la trascrizione precedente come file complementare `.bak`.
- `--agent <id>`: agente proprietario della sessione; obbligatorio per le chiavi `global`.
- `--url` / `--token` / `--password`: sostituzioni delle impostazioni di connessione del Gateway.
- `--timeout <ms>`: timeout RPC facoltativo lato client in millisecondi.
- `--json`: stampa il payload RPC non elaborato.

Il comando termina con un codice diverso da zero quando il Gateway segnala una Compaction non riuscita o non è
raggiungibile, affinché Cron e script non scambino mai un'operazione nulla silenziosa per un successo.

<Note>
`openclaw agent --message '/compact ...'` **non** è un percorso di Compaction. I comandi slash
della CLI vengono rifiutati dal controllo del mittente autorizzato; tale
invocazione termina con un codice diverso da zero e fornisce indicazioni che rimandano qui, anziché
non eseguire silenziosamente alcuna operazione.
</Note>

### RPC sessions.compact

`openclaw gateway call sessions.compact --params '<json>'` accetta:

| Campo      | Tipo        | Obbligatorio | Descrizione                                                |
| ---------- | ----------- | ------------ | ---------------------------------------------------------- |
| `key`      | string      | sì      | Chiave della sessione da compattare (ad esempio `agent:main:main`).    |
| `agentId`  | string      | no       | ID dell'agente proprietario della sessione (per le chiavi `global`).        |
| `maxLines` | integer ≥ 1 | no       | Tronca alle ultime N righe anziché usare la riepilogazione tramite LLM. |

Esempio di risposta con riepilogazione tramite LLM:

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

- [Configurazione delle sessioni](/it/gateway/config-agents#session)
- [Gestione delle sessioni](/it/concepts/session)
- [Compaction](/it/concepts/compaction)
- [Riferimento della CLI](/it/cli)
