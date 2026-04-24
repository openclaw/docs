---
read_when:
    - Esecuzione di harness di coding tramite ACP
    - Configurazione di sessioni ACP legate alla conversazione sui canali di messaggistica
    - Associazione di una conversazione di un canale di messaggistica a una sessione ACP persistente
    - Risoluzione dei problemi del backend ACP e del collegamento del Plugin
    - Debug di consegna del completamento ACP o loop agente-a-agente
    - Uso dei comandi /acp dalla chat
summary: Usa le sessioni runtime ACP per Claude Code, Cursor, Gemini CLI, fallback ACP Codex esplicito, OpenClaw ACP e altri agenti harness
title: Agenti ACP
x-i18n:
    generated_at: "2026-04-24T09:04:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6d59c5aa858e7888c9188ec9fc7dd5bcb9c8a5458f40d6458a5157ebc16332c2
    source_path: tools/acp-agents.md
    workflow: 15
---

[Agent Client Protocol (ACP)](https://agentclientprotocol.com/) le sessioni permettono a OpenClaw di eseguire harness di coding esterni (ad esempio Pi, Claude Code, Cursor, Copilot, OpenClaw ACP, OpenCode, Gemini CLI e altri harness ACPX supportati) tramite un Plugin backend ACP.

Se chiedi a OpenClaw in linguaggio naturale di associare o controllare Codex nella conversazione corrente, OpenClaw dovrebbe usare il Plugin nativo Codex app-server (`/codex bind`, `/codex threads`, `/codex resume`). Se chiedi `/acp`, ACP, acpx o una sessione figlia in background di Codex, OpenClaw può comunque instradare Codex tramite ACP. Ogni spawn di sessione ACP viene tracciato come [attività in background](/it/automation/tasks).

Se chiedi a OpenClaw in linguaggio naturale di "avviare Claude Code in un thread" o di usare un altro harness esterno, OpenClaw dovrebbe instradare quella richiesta al runtime ACP (non al runtime nativo dei sottoagenti).

Se vuoi che Codex o Claude Code si connettano direttamente come client MCP esterni
a conversazioni di canale OpenClaw esistenti, usa [`openclaw mcp serve`](/it/cli/mcp)
invece di ACP.

## Quale pagina mi serve?

Ci sono tre superfici vicine che è facile confondere:

| Vuoi...                                                                                       | Usa questo                            | Note                                                                                                                                                      |
| --------------------------------------------------------------------------------------------- | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Associare o controllare Codex nella conversazione corrente                                    | `/codex bind`, `/codex threads`       | Percorso nativo Codex app-server; include risposte chat associate, inoltro immagini, modello/fast/permessi, stop e controlli di steer. ACP è un fallback esplicito |
| Eseguire Claude Code, Gemini CLI, fallback ACP Codex esplicito o un altro harness esterno _tramite_ OpenClaw | Questa pagina: agenti ACP             | Sessioni associate alla chat, `/acp spawn`, `sessions_spawn({ runtime: "acp" })`, attività in background, controlli runtime                             |
| Esporre una sessione Gateway OpenClaw _come_ server ACP per un editor o client                | [`openclaw acp`](/it/cli/acp)            | Modalità bridge. L'IDE/client parla ACP a OpenClaw via stdio/WebSocket                                                                                    |
| Riutilizzare una CLI AI locale come modello fallback solo testo                               | [CLI Backends](/it/gateway/cli-backends) | Non ACP. Nessuno strumento OpenClaw, nessun controllo ACP, nessun runtime harness                                                                         |

## Funziona subito?

Di solito sì. Le installazioni nuove includono il Plugin runtime `acpx` integrato abilitato per impostazione predefinita, con un binario `acpx` bloccato a livello locale del Plugin che OpenClaw controlla e autoripara all'avvio. Esegui `/acp doctor` per un controllo di disponibilità.

Problemi comuni al primo avvio:

- Gli adapter dell'harness di destinazione (Codex, Claude, ecc.) possono essere recuperati on demand con `npx` al primo utilizzo.
- L'autenticazione del vendor deve comunque esistere sull'host per quell'harness.
- Se l'host non ha npm o accesso alla rete, il recupero degli adapter al primo avvio fallisce finché le cache non vengono preriscaldate o l'adapter non viene installato in altro modo.

## Runbook operatore

Flusso rapido `/acp` dalla chat:

1. **Spawn** — `/acp spawn claude --bind here`, `/acp spawn gemini --mode persistent --thread auto`, oppure esplicitamente `/acp spawn codex --bind here`
2. **Lavora** nella conversazione o thread associato (oppure indirizza esplicitamente la chiave di sessione).
3. **Controlla lo stato** — `/acp status`
4. **Regola** — `/acp model <provider/model>`, `/acp permissions <profile>`, `/acp timeout <seconds>`
5. **Steer** senza sostituire il contesto — `/acp steer restringi il logging e continua`
6. **Ferma** — `/acp cancel` (turno corrente) oppure `/acp close` (sessione + associazioni)

Trigger in linguaggio naturale che dovrebbero essere instradati al Plugin Codex nativo:

- "Associa questo canale Discord a Codex."
- "Collega questa chat al thread Codex `<id>`."
- "Mostra i thread Codex, poi associa questo."

L'associazione nativa di una conversazione a Codex è il percorso di controllo chat predefinito, ma è intenzionalmente conservativa per i flussi interattivi di approvazione/strumenti di Codex: gli strumenti dinamici e i prompt di approvazione di OpenClaw non sono ancora esposti tramite questo percorso di chat associata, quindi tali richieste vengono rifiutate con una spiegazione chiara. Usa il percorso harness Codex o il fallback ACP esplicito quando il flusso di lavoro dipende da strumenti dinamici OpenClaw o da approvazioni interattive di lunga durata.

Trigger in linguaggio naturale che dovrebbero essere instradati al runtime ACP:

- "Esegui questo come sessione ACP Claude Code one-shot e riassumi il risultato."
- "Usa Gemini CLI per questa attività in un thread, poi mantieni i follow-up nello stesso thread."
- "Esegui Codex tramite ACP in un thread in background."

OpenClaw sceglie `runtime: "acp"`, risolve l'`agentId` dell'harness, associa alla conversazione o al thread corrente quando supportato e instrada i follow-up a quella sessione fino a chiusura/scadenza. Codex segue questo percorso solo quando ACP è esplicito o il runtime in background richiesto ha ancora bisogno di ACP.

## ACP vs sottoagenti

Usa ACP quando vuoi un runtime harness esterno. Usa l'app-server Codex nativo per l'associazione/controllo delle conversazioni Codex. Usa i sottoagenti quando vuoi esecuzioni delegate native di OpenClaw.

| Area          | Sessione ACP                           | Esecuzione sottoagente              |
| ------------- | -------------------------------------- | ----------------------------------- |
| Runtime       | Plugin backend ACP (ad esempio acpx)   | Runtime nativo sottoagente OpenClaw |
| Chiave sessione | `agent:<agentId>:acp:<uuid>`         | `agent:<agentId>:subagent:<uuid>`   |
| Comandi principali | `/acp ...`                        | `/subagents ...`                    |
| Strumento di spawn | `sessions_spawn` con `runtime:"acp"` | `sessions_spawn` (runtime predefinito) |

Vedi anche [Sub-agents](/it/tools/subagents).

## Come ACP esegue Claude Code

Per Claude Code tramite ACP, lo stack è:

1. Piano di controllo della sessione ACP OpenClaw
2. Plugin runtime `acpx` integrato
3. Adapter Claude ACP
4. Runtime/sessione lato Claude

Distinzione importante:

- ACP Claude è una sessione harness con controlli ACP, ripresa di sessione, tracciamento delle attività in background e associazione facoltativa a conversazione/thread.
- I backend CLI sono runtime fallback locali separati solo testo. Vedi [CLI Backends](/it/gateway/cli-backends).

Per gli operatori, la regola pratica è:

- vuoi `/acp spawn`, sessioni associabili, controlli runtime o lavoro harness persistente: usa ACP
- vuoi un semplice fallback testuale locale tramite la CLI raw: usa i backend CLI

## Sessioni associate

### Associazioni alla conversazione corrente

`/acp spawn <harness> --bind here` fissa la conversazione corrente alla sessione ACP generata — nessun thread figlio, stessa superficie di chat. OpenClaw continua a gestire trasporto, autenticazione, sicurezza e consegna; i messaggi di follow-up in quella conversazione vengono instradati alla stessa sessione; `/new` e `/reset` reimpostano la sessione sul posto; `/acp close` rimuove l'associazione.

Modello mentale:

- **superficie di chat** — dove le persone continuano a parlare (canale Discord, topic Telegram, chat iMessage).
- **sessione ACP** — lo stato runtime durevole di Codex/Claude/Gemini a cui OpenClaw instrada.
- **thread/topic figlio** — una superficie di messaggistica extra facoltativa creata solo da `--thread ...`.
- **workspace runtime** — la posizione del filesystem (`cwd`, checkout del repo, workspace backend) in cui viene eseguito l'harness. Indipendente dalla superficie di chat.

Esempi:

- `/codex bind` — mantieni questa chat, genera o collega Codex app-server nativo, instrada qui i messaggi futuri.
- `/codex model gpt-5.4`, `/codex fast on`, `/codex permissions yolo` — regola il thread Codex nativo associato dalla chat.
- `/codex stop` oppure `/codex steer concentrati prima sui test che falliscono` — controlla il turno Codex nativo attivo.
- `/acp spawn codex --bind here` — fallback ACP esplicito per Codex.
- `/acp spawn codex --thread auto` — OpenClaw può creare un thread/topic figlio e associarlo lì.
- `/acp spawn codex --bind here --cwd /workspace/repo` — stessa associazione alla chat, Codex viene eseguito in `/workspace/repo`.

Note:

- `--bind here` e `--thread ...` si escludono a vicenda.
- `--bind here` funziona solo sui canali che dichiarano il supporto all'associazione della conversazione corrente; altrimenti OpenClaw restituisce un messaggio chiaro di non supporto. Le associazioni persistono attraverso i riavvii del gateway.
- Su Discord, `spawnAcpSessions` è richiesto solo quando OpenClaw deve creare un thread figlio per `--thread auto|here` — non per `--bind here`.
- Se esegui lo spawn verso un agente ACP diverso senza `--cwd`, OpenClaw eredita per impostazione predefinita lo spazio di lavoro dell'**agente di destinazione**. I percorsi ereditati mancanti (`ENOENT`/`ENOTDIR`) fanno fallback al predefinito del backend; altri errori di accesso (ad esempio `EACCES`) emergono come errori di spawn.

### Sessioni associate a thread

Quando le associazioni a thread sono abilitate per un adapter di canale, le sessioni ACP possono essere associate ai thread:

- OpenClaw associa un thread a una sessione ACP di destinazione.
- I messaggi di follow-up in quel thread vengono instradati alla sessione ACP associata.
- L'output ACP viene riconsegnato allo stesso thread.
- Unfocus/close/archive/idle-timeout o scadenza max-age rimuovono l'associazione.

Il supporto all'associazione a thread è specifico dell'adapter. Se l'adapter di canale attivo non supporta le associazioni a thread, OpenClaw restituisce un messaggio chiaro di non supporto/non disponibilità.

Flag di funzionalità richiesti per ACP associato a thread:

- `acp.enabled=true`
- `acp.dispatch.enabled` è attivo per impostazione predefinita (imposta `false` per mettere in pausa il dispatch ACP)
- Flag di spawn ACP thread dell'adapter di canale abilitato (specifico dell'adapter)
  - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
  - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`

### Canali che supportano i thread

- Qualsiasi adapter di canale che espone capability di associazione sessione/thread.
- Supporto integrato attuale:
  - thread/canali Discord
  - topic Telegram (forum topic in gruppi/supergruppi e topic DM)
- I canali Plugin possono aggiungere supporto tramite la stessa interfaccia di binding.

## Impostazioni specifiche del canale

Per flussi di lavoro non effimeri, configura associazioni ACP persistenti nelle voci top-level `bindings[]`.

### Modello di binding

- `bindings[].type="acp"` indica un'associazione persistente di conversazione ACP.
- `bindings[].match` identifica la conversazione di destinazione:
  - canale o thread Discord: `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
  - forum topic Telegram: `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
  - chat DM/gruppo BlueBubbles: `match.channel="bluebubbles"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`
    Preferisci `chat_id:*` o `chat_identifier:*` per associazioni di gruppo stabili.
  - chat DM/gruppo iMessage: `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`
    Preferisci `chat_id:*` per associazioni di gruppo stabili.
- `bindings[].agentId` è l'id dell'agente OpenClaw proprietario.
- Gli override ACP facoltativi risiedono sotto `bindings[].acp`:
  - `mode` (`persistent` o `oneshot`)
  - `label`
  - `cwd`
  - `backend`

### Valori predefiniti runtime per agente

Usa `agents.list[].runtime` per definire una sola volta i valori predefiniti ACP per agente:

- `agents.list[].runtime.type="acp"`
- `agents.list[].runtime.acp.agent` (id dell'harness, ad esempio `codex` o `claude`)
- `agents.list[].runtime.acp.backend`
- `agents.list[].runtime.acp.mode`
- `agents.list[].runtime.acp.cwd`

Precedenza degli override per le sessioni ACP associate:

1. `bindings[].acp.*`
2. `agents.list[].runtime.acp.*`
3. valori predefiniti ACP globali (ad esempio `acp.backend`)

Esempio:

```json5
{
  agents: {
    list: [
      {
        id: "codex",
        runtime: {
          type: "acp",
          acp: {
            agent: "codex",
            backend: "acpx",
            mode: "persistent",
            cwd: "/workspace/openclaw",
          },
        },
      },
      {
        id: "claude",
        runtime: {
          type: "acp",
          acp: { agent: "claude", backend: "acpx", mode: "persistent" },
        },
      },
    ],
  },
  bindings: [
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "discord",
        accountId: "default",
        peer: { kind: "channel", id: "222222222222222222" },
      },
      acp: { label: "codex-main" },
    },
    {
      type: "acp",
      agentId: "claude",
      match: {
        channel: "telegram",
        accountId: "default",
        peer: { kind: "group", id: "-1001234567890:topic:42" },
      },
      acp: { cwd: "/workspace/repo-b" },
    },
    {
      type: "route",
      agentId: "main",
      match: { channel: "discord", accountId: "default" },
    },
    {
      type: "route",
      agentId: "main",
      match: { channel: "telegram", accountId: "default" },
    },
  ],
  channels: {
    discord: {
      guilds: {
        "111111111111111111": {
          channels: {
            "222222222222222222": { requireMention: false },
          },
        },
      },
    },
    telegram: {
      groups: {
        "-1001234567890": {
          topics: { "42": { requireMention: false } },
        },
      },
    },
  },
}
```

Comportamento:

- OpenClaw assicura che la sessione ACP configurata esista prima dell'uso.
- I messaggi in quel canale o topic vengono instradati alla sessione ACP configurata.
- Nelle conversazioni associate, `/new` e `/reset` reimpostano sul posto la stessa chiave di sessione ACP.
- Le associazioni runtime temporanee (ad esempio create da flussi di focus su thread) si applicano comunque dove presenti.
- Per gli spawn ACP cross-agent senza `cwd` esplicito, OpenClaw eredita lo spazio di lavoro dell'agente di destinazione dalla configurazione dell'agente.
- I percorsi di spazio di lavoro ereditati mancanti fanno fallback al `cwd` predefinito del backend; i guasti di accesso su percorsi esistenti emergono come errori di spawn.

## Avviare sessioni ACP (interfacce)

### Da `sessions_spawn`

Usa `runtime: "acp"` per avviare una sessione ACP da un turno dell'agente o da una tool call.

```json
{
  "task": "Apri il repository e riassumi i test che falliscono",
  "runtime": "acp",
  "agentId": "codex",
  "thread": true,
  "mode": "session"
}
```

Note:

- `runtime` è predefinito a `subagent`, quindi imposta esplicitamente `runtime: "acp"` per le sessioni ACP.
- Se `agentId` è omesso, OpenClaw usa `acp.defaultAgent` quando configurato.
- `mode: "session"` richiede `thread: true` per mantenere una conversazione persistente associata.

Dettagli dell'interfaccia:

- `task` (obbligatorio): prompt iniziale inviato alla sessione ACP.
- `runtime` (obbligatorio per ACP): deve essere `"acp"`.
- `agentId` (facoltativo): id dell'harness ACP di destinazione. Fa fallback a `acp.defaultAgent` se impostato.
- `thread` (facoltativo, predefinito `false`): richiede un flusso di associazione a thread dove supportato.
- `mode` (facoltativo): `run` (one-shot) oppure `session` (persistente).
  - il valore predefinito è `run`
  - se `thread: true` e `mode` è omesso, OpenClaw può usare come predefinito un comportamento persistente a seconda del percorso runtime
  - `mode: "session"` richiede `thread: true`
- `cwd` (facoltativo): directory di lavoro runtime richiesta (validata dalla policy backend/runtime). Se omesso, lo spawn ACP eredita lo spazio di lavoro dell'agente di destinazione quando configurato; i percorsi ereditati mancanti fanno fallback ai valori predefiniti del backend, mentre i veri errori di accesso vengono restituiti.
- `label` (facoltativo): etichetta per l'operatore usata nel testo di sessione/banner.
- `resumeSessionId` (facoltativo): riprende una sessione ACP esistente invece di crearne una nuova. L'agente riproduce la sua cronologia di conversazione tramite `session/load`. Richiede `runtime: "acp"`.
- `streamTo` (facoltativo): `"parent"` trasmette i riepiloghi del progresso iniziale dell'esecuzione ACP alla sessione richiedente come eventi di sistema.
  - Quando disponibile, le risposte accettate includono `streamLogPath` che punta a un log JSONL con ambito sessione (`<sessionId>.acp-stream.jsonl`) che puoi seguire per la cronologia completa del relay.
- `model` (facoltativo): override esplicito del modello per la sessione figlia ACP. Onorato per `runtime: "acp"` così il figlio usa il modello richiesto invece di fare silenziosamente fallback al valore predefinito dell'agente di destinazione.

## Modello di consegna

Le sessioni ACP possono essere sia spazi di lavoro interattivi sia lavoro in background posseduto dal parent. Il percorso di consegna dipende da questa forma.

### Sessioni ACP interattive

Le sessioni interattive sono pensate per continuare a parlare su una superficie di chat visibile:

- `/acp spawn ... --bind here` associa la conversazione corrente alla sessione ACP.
- `/acp spawn ... --thread ...` associa un thread/topic del canale alla sessione ACP.
- Le associazioni persistenti configurate `bindings[].type="acp"` instradano le conversazioni corrispondenti alla stessa sessione ACP.

I messaggi di follow-up nella conversazione associata vengono instradati direttamente alla sessione ACP, e l'output ACP viene riconsegnato allo stesso canale/thread/topic.

### Sessioni ACP one-shot possedute dal parent

Le sessioni ACP one-shot generate da un'altra esecuzione di agente sono figli in background, simili ai sottoagenti:

- Il parent chiede lavoro con `sessions_spawn({ runtime: "acp", mode: "run" })`.
- Il figlio viene eseguito nella propria sessione harness ACP.
- Il completamento viene riportato tramite il percorso interno di announce del completamento dell'attività.
- Il parent riscrive il risultato del figlio nella normale voce dell'assistente quando è utile una risposta visibile all'utente.

Non trattare questo percorso come una chat peer-to-peer tra parent e figlio. Il figlio ha già un canale di completamento di ritorno verso il parent.

### `sessions_send` e consegna A2A

`sessions_send` può prendere come destinazione un'altra sessione dopo lo spawn. Per le normali sessioni peer, OpenClaw usa un percorso di follow-up agente-a-agente (A2A) dopo aver iniettato il messaggio:

- attende la risposta della sessione di destinazione
- facoltativamente permette a richiedente e destinazione di scambiarsi un numero limitato di turni di follow-up
- chiede alla destinazione di produrre un messaggio di announce
- consegna quell'annuncio al canale o thread visibile

Quel percorso A2A è un fallback per invii peer in cui il mittente ha bisogno di un follow-up visibile. Resta abilitato quando una sessione non correlata può vedere e inviare messaggi a una destinazione ACP, ad esempio con impostazioni ampie di `tools.sessions.visibility`.

OpenClaw salta il follow-up A2A solo quando il richiedente è il parent del proprio figlio ACP one-shot posseduto dal parent. In quel caso, eseguire A2A sopra il completamento dell'attività può risvegliare il parent con il risultato del figlio, inoltrare la risposta del parent di nuovo nel figlio e creare un loop di eco parent/child. Il risultato di `sessions_send` riporta `delivery.status="skipped"` per quel caso di figlio posseduto, perché il percorso di completamento è già responsabile del risultato.

### Riprendere una sessione esistente

Usa `resumeSessionId` per continuare una sessione ACP precedente invece di iniziarne una nuova. L'agente riproduce la sua cronologia di conversazione tramite `session/load`, così riprende con il pieno contesto di quanto avvenuto prima.

```json
{
  "task": "Continua da dove ci siamo fermati — correggi i test falliti rimanenti",
  "runtime": "acp",
  "agentId": "codex",
  "resumeSessionId": "<previous-session-id>"
}
```

Casi d'uso comuni:

- Passare una sessione Codex dal tuo laptop al telefono — dì al tuo agente di riprendere da dove ti eri fermato
- Continuare una sessione di coding avviata in modo interattivo nella CLI, ora in modo headless tramite il tuo agente
- Riprendere lavoro interrotto da un riavvio del gateway o da un idle timeout

Note:

- `resumeSessionId` richiede `runtime: "acp"` — restituisce un errore se usato con il runtime sottoagente.
- `resumeSessionId` ripristina la cronologia della conversazione ACP upstream; `thread` e `mode` continuano comunque ad applicarsi normalmente alla nuova sessione OpenClaw che stai creando, quindi `mode: "session"` continua a richiedere `thread: true`.
- L'agente di destinazione deve supportare `session/load` (Codex e Claude Code lo fanno).
- Se l'id di sessione non viene trovato, lo spawn fallisce con un errore chiaro — nessun fallback silenzioso verso una nuova sessione.

<Accordion title="Smoke test post-deploy">

Dopo un deploy del gateway, esegui un controllo live end-to-end invece di fidarti dei soli unit test:

1. Verifica la versione e il commit del gateway distribuito sull'host di destinazione.
2. Apri una sessione bridge ACPX temporanea verso un agente live.
3. Chiedi a quell'agente di chiamare `sessions_spawn` con `runtime: "acp"`, `agentId: "codex"`, `mode: "run"` e task `Reply with exactly LIVE-ACP-SPAWN-OK`.
4. Verifica `accepted=yes`, una vera `childSessionKey` e l'assenza di errori di validazione.
5. Pulisci la sessione bridge temporanea.

Mantieni il gate su `mode: "run"` e salta `streamTo: "parent"` — i percorsi `mode: "session"` associati a thread e i relay di stream sono passaggi di integrazione separati e più ricchi.

</Accordion>

## Compatibilità con la sandbox

Le sessioni ACP attualmente vengono eseguite sul runtime host, non dentro la sandbox di OpenClaw.

Limitazioni attuali:

- Se la sessione richiedente è in sandbox, gli spawn ACP vengono bloccati sia per `sessions_spawn({ runtime: "acp" })` sia per `/acp spawn`.
  - Errore: `Sandboxed sessions cannot spawn ACP sessions because runtime="acp" runs on the host. Use runtime="subagent" from sandboxed sessions.`
- `sessions_spawn` con `runtime: "acp"` non supporta `sandbox: "require"`.
  - Errore: `sessions_spawn sandbox="require" is unsupported for runtime="acp" because ACP sessions run outside the sandbox. Use runtime="subagent" or sandbox="inherit".`

Usa `runtime: "subagent"` quando hai bisogno di esecuzione imposta dalla sandbox.

### Dal comando `/acp`

Usa `/acp spawn` per il controllo esplicito da operatore dalla chat quando necessario.

```text
/acp spawn codex --mode persistent --thread auto
/acp spawn codex --mode oneshot --thread off
/acp spawn codex --bind here
/acp spawn codex --thread here
```

Flag principali:

- `--mode persistent|oneshot`
- `--bind here|off`
- `--thread auto|here|off`
- `--cwd <absolute-path>`
- `--label <name>`

Vedi [Slash Commands](/it/tools/slash-commands).

## Risoluzione del target di sessione

La maggior parte delle azioni `/acp` accetta un target di sessione facoltativo (`session-key`, `session-id` oppure `session-label`).

Ordine di risoluzione:

1. Argomento esplicito del target (o `--session` per `/acp steer`)
   - prova la chiave
   - poi l'id di sessione in formato UUID
   - poi l'etichetta
2. Associazione del thread corrente (se questa conversazione/thread è associata a una sessione ACP)
3. Fallback alla sessione del richiedente corrente

Le associazioni alla conversazione corrente e ai thread partecipano entrambe al passaggio 2.

Se non viene risolto alcun target, OpenClaw restituisce un errore chiaro (`Unable to resolve session target: ...`).

## Modalità di bind dello spawn

`/acp spawn` supporta `--bind here|off`.

| Modalità | Comportamento                                                           |
| -------- | ----------------------------------------------------------------------- |
| `here`   | Associa sul posto la conversazione attiva corrente; fallisce se nessuna è attiva. |
| `off`    | Non crea un'associazione alla conversazione corrente.                   |

Note:

- `--bind here` è il percorso operatore più semplice per "rendere questo canale o questa chat supportata da Codex."
- `--bind here` non crea un thread figlio.
- `--bind here` è disponibile solo sui canali che espongono supporto per l'associazione alla conversazione corrente.
- `--bind` e `--thread` non possono essere combinati nella stessa chiamata `/acp spawn`.

## Modalità thread dello spawn

`/acp spawn` supporta `--thread auto|here|off`.

| Modalità | Comportamento                                                                                         |
| -------- | ----------------------------------------------------------------------------------------------------- |
| `auto`   | In un thread attivo: associa quel thread. Fuori da un thread: crea/associa un thread figlio quando supportato. |
| `here`   | Richiede il thread attivo corrente; fallisce se non sei in uno.                                       |
| `off`    | Nessuna associazione. La sessione parte non associata.                                                |

Note:

- Sulle superfici di binding che non supportano thread, il comportamento predefinito è di fatto `off`.
- Lo spawn associato a thread richiede il supporto della policy del canale:
  - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
  - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`
- Usa `--bind here` quando vuoi fissare la conversazione corrente senza creare un thread figlio.

## Controlli ACP

| Comando              | Cosa fa                                                   | Esempio                                                       |
| -------------------- | --------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | Crea una sessione ACP; binding corrente o binding a thread facoltativi. | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | Annulla il turno in corso per la sessione di destinazione. | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | Invia un'istruzione di steer a una sessione in esecuzione. | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | Chiude la sessione e scollega le destinazioni thread.     | `/acp close`                                                  |
| `/acp status`        | Mostra backend, modalità, stato, opzioni runtime, capability. | `/acp status`                                                 |
| `/acp set-mode`      | Imposta la modalità runtime per la sessione di destinazione. | `/acp set-mode plan`                                          |
| `/acp set`           | Scrittura generica di un'opzione di configurazione runtime. | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | Imposta l'override della directory di lavoro runtime.     | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | Imposta il profilo della policy di approvazione.          | `/acp permissions strict`                                     |
| `/acp timeout`       | Imposta il timeout runtime (secondi).                     | `/acp timeout 120`                                            |
| `/acp model`         | Imposta l'override del modello runtime.                   | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | Rimuove gli override delle opzioni runtime della sessione. | `/acp reset-options`                                          |
| `/acp sessions`      | Elenca le sessioni ACP recenti dall'archivio.             | `/acp sessions`                                               |
| `/acp doctor`        | Stato di salute del backend, capability, correzioni attuabili. | `/acp doctor`                                                 |
| `/acp install`       | Stampa passaggi deterministici di installazione e abilitazione. | `/acp install`                                                |

`/acp status` mostra le opzioni runtime effettive più gli identificatori di sessione a livello runtime e backend. Gli errori di controllo non supportato emergono chiaramente quando un backend non ha una capability. `/acp sessions` legge l'archivio per la sessione corrente associata o del richiedente; i token di destinazione (`session-key`, `session-id` o `session-label`) vengono risolti tramite il discovery delle sessioni del gateway, incluse le root `session.store` personalizzate per agente.

## Mappatura delle opzioni runtime

`/acp` ha comandi di utilità e un setter generico.

Operazioni equivalenti:

- `/acp model <id>` mappa alla chiave di configurazione runtime `model`.
- `/acp permissions <profile>` mappa alla chiave di configurazione runtime `approval_policy`.
- `/acp timeout <seconds>` mappa alla chiave di configurazione runtime `timeout`.
- `/acp cwd <path>` aggiorna direttamente l'override cwd runtime.
- `/acp set <key> <value>` è il percorso generico.
  - Caso speciale: `key=cwd` usa il percorso di override cwd.
- `/acp reset-options` cancella tutti gli override runtime per la sessione di destinazione.

## Harness acpx, configurazione Plugin e permessi

Per la configurazione dell'harness acpx (alias Claude Code / Codex / Gemini CLI), i
bridge MCP plugin-tools e OpenClaw-tools e le modalità di permesso ACP, vedi
[ACP agents — setup](/it/tools/acp-agents-setup).

## Risoluzione dei problemi

| Sintomo                                                                     | Causa probabile                                                                  | Correzione                                                                                                                                                                  |
| --------------------------------------------------------------------------- | -------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ACP runtime backend is not configured`                                     | Plugin backend mancante o disabilitato.                                          | Installa e abilita il Plugin backend, poi esegui `/acp doctor`.                                                                                                            |
| `ACP is disabled by policy (acp.enabled=false)`                             | ACP disabilitato globalmente.                                                    | Imposta `acp.enabled=true`.                                                                                                                                                 |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`           | Il dispatch dai normali messaggi del thread è disabilitato.                      | Imposta `acp.dispatch.enabled=true`.                                                                                                                                        |
| `ACP agent "<id>" is not allowed by policy`                                 | L'agente non è nella allowlist.                                                  | Usa un `agentId` consentito o aggiorna `acp.allowedAgents`.                                                                                                                |
| `Unable to resolve session target: ...`                                     | Token chiave/id/etichetta errato.                                                | Esegui `/acp sessions`, copia la chiave/etichetta esatta e riprova.                                                                                                        |
| `--bind here requires running /acp spawn inside an active ... conversation` | `--bind here` usato senza una conversazione attiva associabile.                  | Spostati nella chat/canale di destinazione e riprova, oppure usa uno spawn non associato.                                                                                 |
| `Conversation bindings are unavailable for <channel>.`                      | L'adapter non ha capability ACP di binding della conversazione corrente.         | Usa `/acp spawn ... --thread ...` dove supportato, configura `bindings[]` top-level, oppure spostati su un canale supportato.                                           |
| `--thread here requires running /acp spawn inside an active ... thread`     | `--thread here` usato fuori da un contesto thread.                               | Spostati nel thread di destinazione o usa `--thread auto`/`off`.                                                                                                           |
| `Only <user-id> can rebind this channel/conversation/thread.`               | Un altro utente possiede la destinazione di binding attiva.                      | Riesegui il binding come proprietario o usa una conversazione o thread diverso.                                                                                            |
| `Thread bindings are unavailable for <channel>.`                            | L'adapter non ha capability di binding ai thread.                                | Usa `--thread off` o spostati su un adapter/canale supportato.                                                                                                             |
| `Sandboxed sessions cannot spawn ACP sessions ...`                          | Il runtime ACP è lato host; la sessione richiedente è in sandbox.                | Usa `runtime="subagent"` da sessioni in sandbox, oppure esegui lo spawn ACP da una sessione non in sandbox.                                                               |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`     | È stato richiesto `sandbox="require"` per il runtime ACP.                        | Usa `runtime="subagent"` per sandboxing obbligatorio, oppure usa ACP con `sandbox="inherit"` da una sessione non in sandbox.                                             |
| Metadati ACP mancanti per la sessione associata                             | Metadati ACP obsoleti/eliminati.                                                 | Ricrea con `/acp spawn`, poi riassocia/rifocalizza il thread.                                                                                                              |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`    | `permissionMode` blocca write/exec nella sessione ACP non interattiva.           | Imposta `plugins.entries.acpx.config.permissionMode` su `approve-all` e riavvia il gateway. Vedi [Configurazione dei permessi](/it/tools/acp-agents-setup#permission-configuration). |
| La sessione ACP fallisce presto con poco output                             | I prompt di permesso sono bloccati da `permissionMode`/`nonInteractivePermissions`. | Controlla i log del gateway per `AcpRuntimeError`. Per permessi completi, imposta `permissionMode=approve-all`; per degradazione controllata, imposta `nonInteractivePermissions=deny`. |
| La sessione ACP resta bloccata indefinitamente dopo aver completato il lavoro | Il processo harness è terminato ma la sessione ACP non ha segnalato il completamento. | Monitora con `ps aux \| grep acpx`; termina manualmente i processi obsoleti.                                                                                              |

## Correlati

- [Sub-agents](/it/tools/subagents)
- [Multi-agent sandbox tools](/it/tools/multi-agent-sandbox-tools)
- [Agent send](/it/tools/agent-send)
