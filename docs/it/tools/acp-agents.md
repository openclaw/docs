---
read_when:
    - Eseguire harness di coding tramite ACP
    - Configurare sessioni ACP associate alla conversazione sui canali di messaggistica
    - Associare una conversazione di un canale di messaggistica a una sessione ACP persistente
    - Risolvere i problemi del wiring di backend e Plugin ACP
    - Debuggare la consegna del completamento ACP o i loop agente-agente
    - Usare i comandi /acp dalla chat
summary: Usa sessioni di runtime ACP per Codex, Claude Code, Cursor, Gemini CLI, OpenClaw ACP e altri agenti harness
title: Agenti ACP
x-i18n:
    generated_at: "2026-04-23T08:37:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: 617103fe47ef90592bad4882da719c47c801ebc916d3614c148a66e6601e8cf5
    source_path: tools/acp-agents.md
    workflow: 15
---

# Agenti ACP

Le sessioni [Agent Client Protocol (ACP)](https://agentclientprotocol.com/) consentono a OpenClaw di eseguire harness di coding esterni (ad esempio Pi, Claude Code, Codex, Cursor, Copilot, OpenClaw ACP, OpenCode, Gemini CLI e altri harness ACPX supportati) tramite un Plugin backend ACP.

Se chiedi a OpenClaw in linguaggio naturale di "eseguire questo in Codex" o "avviare Claude Code in un thread", OpenClaw dovrebbe instradare quella richiesta al runtime ACP (non al runtime nativo dei subagenti). Ogni spawn di sessione ACP viene tracciato come [attività in background](/it/automation/tasks).

Se vuoi che Codex o Claude Code si connettano come client MCP esterni direttamente
a conversazioni di canale OpenClaw esistenti, usa [`openclaw mcp serve`](/it/cli/mcp)
invece di ACP.

## Quale pagina mi serve?

Ci sono tre superfici vicine facili da confondere:

| Vuoi... | Usa questo | Note |
| ---------------------------------------------------------------------------------- | ------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Eseguire Codex, Claude Code, Gemini CLI o un altro harness esterno _tramite_ OpenClaw | Questa pagina: Agenti ACP | Sessioni associate alla chat, `/acp spawn`, `sessions_spawn({ runtime: "acp" })`, attività in background, controlli di runtime |
| Esporre una sessione Gateway OpenClaw _come_ server ACP per un editor o client | [`openclaw acp`](/it/cli/acp) | Modalità bridge. L'IDE/client comunica in ACP con OpenClaw tramite stdio/WebSocket |
| Riutilizzare una CLI AI locale come modello di fallback solo testo | [Backend CLI](/it/gateway/cli-backends) | Non ACP. Nessuno strumento OpenClaw, nessun controllo ACP, nessun runtime harness |

## Funziona subito?

Di solito, sì.

- Le installazioni nuove ora distribuiscono il Plugin runtime incluso `acpx` abilitato per impostazione predefinita.
- Il Plugin incluso `acpx` preferisce il proprio binario `acpx` locale al Plugin.
- All'avvio, OpenClaw verifica quel binario e lo autoripara se necessario.
- Inizia con `/acp doctor` se vuoi un rapido controllo di disponibilità.

Cosa può comunque succedere al primo utilizzo:

- Un adapter harness di destinazione può essere recuperato su richiesta con `npx` la prima volta che usi quell'harness.
- L'autenticazione del vendor deve comunque esistere sull'host per quell'harness.
- Se l'host non ha accesso a npm/rete, i recuperi iniziali degli adapter possono fallire finché le cache non vengono preriscaldate o l'adapter non viene installato in altro modo.

Esempi:

- `/acp spawn codex`: OpenClaw dovrebbe essere pronto a inizializzare `acpx`, ma l'adapter ACP Codex potrebbe comunque richiedere un recupero al primo avvio.
- `/acp spawn claude`: stessa situazione per l'adapter ACP Claude, più l'autenticazione lato Claude su quell'host.

## Flusso operativo rapido

Usalo quando vuoi un runbook pratico per `/acp`:

1. Avvia una sessione:
   - `/acp spawn codex --bind here`
   - `/acp spawn codex --mode persistent --thread auto`
2. Lavora nella conversazione o nel thread associato (oppure punta esplicitamente a quella chiave di sessione).
3. Controlla lo stato del runtime:
   - `/acp status`
4. Regola le opzioni di runtime secondo necessità:
   - `/acp model <provider/model>`
   - `/acp permissions <profile>`
   - `/acp timeout <seconds>`
5. Dai un'indicazione a una sessione attiva senza sostituire il contesto:
   - `/acp steer restringi il logging e continua`
6. Interrompi il lavoro:
   - `/acp cancel` (ferma il turno corrente), oppure
   - `/acp close` (chiude la sessione + rimuove le associazioni)

## Avvio rapido per persone

Esempi di richieste naturali:

- "Associa questo canale Discord a Codex."
- "Avvia una sessione Codex persistente in un thread qui e mantienila focalizzata."
- "Esegui questo come sessione ACP Claude Code one-shot e riassumi il risultato."
- "Associa questa chat iMessage a Codex e mantieni i follow-up nello stesso workspace."
- "Usa Gemini CLI per questo compito in un thread, poi mantieni i follow-up nello stesso thread."

Cosa dovrebbe fare OpenClaw:

1. Scegliere `runtime: "acp"`.
2. Risolvere l'harness richiesto (`agentId`, ad esempio `codex`).
3. Se viene richiesta l'associazione alla conversazione corrente e il canale attivo la supporta, associare la sessione ACP a quella conversazione.
4. Altrimenti, se viene richiesta l'associazione al thread e il canale corrente la supporta, associare la sessione ACP al thread.
5. Instradare i messaggi successivi associati a quella stessa sessione ACP fino a unfocused/closed/expired.

## ACP rispetto ai subagenti

Usa ACP quando vuoi un runtime harness esterno. Usa i subagenti quando vuoi esecuzioni delegate native di OpenClaw.

| Area          | Sessione ACP                           | Esecuzione subagente                 |
| ------------- | -------------------------------------- | ------------------------------------ |
| Runtime       | Plugin backend ACP (ad esempio acpx)   | Runtime nativo subagente OpenClaw    |
| Chiave sessione | `agent:<agentId>:acp:<uuid>`         | `agent:<agentId>:subagent:<uuid>`    |
| Comandi principali | `/acp ...`                        | `/subagents ...`                     |
| Strumento di spawn | `sessions_spawn` con `runtime:"acp"` | `sessions_spawn` (runtime predefinito) |

Vedi anche [Sub-agents](/it/tools/subagents).

## Come ACP esegue Claude Code

Per Claude Code tramite ACP, lo stack è:

1. Control plane della sessione ACP di OpenClaw
2. Plugin runtime incluso `acpx`
3. Adapter ACP Claude
4. Macchinario di runtime/sessione lato Claude

Distinzione importante:

- ACP Claude è una sessione harness con controlli ACP, ripresa della sessione, tracciamento delle attività in background e associazione facoltativa a conversazione/thread.
- I backend CLI sono runtime di fallback locali separati solo testo. Vedi [Backend CLI](/it/gateway/cli-backends).

Per gli operatori, la regola pratica è:

- vuoi `/acp spawn`, sessioni associabili, controlli di runtime o lavoro harness persistente: usa ACP
- vuoi un semplice fallback testuale locale tramite la CLI raw: usa i backend CLI

## Sessioni associate

### Associazioni alla conversazione corrente

Usa `/acp spawn <harness> --bind here` quando vuoi che la conversazione corrente diventi uno spazio di lavoro ACP durevole senza creare un thread figlio.

Comportamento:

- OpenClaw continua a gestire trasporto del canale, autenticazione, sicurezza e consegna.
- La conversazione corrente viene fissata alla chiave della sessione ACP generata.
- I messaggi successivi in quella conversazione vengono instradati alla stessa sessione ACP.
- `/new` e `/reset` reimpostano sul posto la stessa sessione ACP associata.
- `/acp close` chiude la sessione e rimuove l'associazione alla conversazione corrente.

Cosa significa in pratica:

- `--bind here` mantiene la stessa superficie di chat. Su Discord, il canale corrente resta il canale corrente.
- `--bind here` può comunque creare una nuova sessione ACP se stai avviando lavoro nuovo. L'associazione collega quella sessione alla conversazione corrente.
- `--bind here` non crea da solo un thread Discord figlio o un topic Telegram.
- Il runtime ACP può comunque avere la propria directory di lavoro (`cwd`) o workspace su disco gestito dal backend. Quel workspace di runtime è separato dalla superficie di chat e non implica un nuovo thread di messaggistica.
- Se esegui lo spawn verso un agente ACP diverso e non passi `--cwd`, OpenClaw eredita per impostazione predefinita il workspace dell'**agente di destinazione**, non quello del richiedente.
- Se quel percorso workspace ereditato manca (`ENOENT`/`ENOTDIR`), OpenClaw ricade sul cwd predefinito del backend invece di riutilizzare silenziosamente l'albero sbagliato.
- Se il workspace ereditato esiste ma non è accessibile (ad esempio `EACCES`), lo spawn restituisce il vero errore di accesso invece di ignorare `cwd`.

Modello mentale:

- superficie di chat: dove le persone continuano a parlare (`canale Discord`, `topic Telegram`, `chat iMessage`)
- sessione ACP: lo stato durevole del runtime Codex/Claude/Gemini verso cui OpenClaw instrada
- thread/topic figlio: una superficie di messaggistica extra facoltativa creata solo da `--thread ...`
- workspace di runtime: la posizione del filesystem in cui viene eseguito l'harness (`cwd`, checkout del repo, workspace backend)

Esempi:

- `/acp spawn codex --bind here`: mantieni questa chat, avvia o collega una sessione ACP Codex e instrada qui i messaggi futuri
- `/acp spawn codex --thread auto`: OpenClaw può creare un thread/topic figlio e associare lì la sessione ACP
- `/acp spawn codex --bind here --cwd /workspace/repo`: stessa associazione alla chat di cui sopra, ma Codex viene eseguito in `/workspace/repo`

Supporto dell'associazione alla conversazione corrente:

- I canali chat/messaggistica che pubblicizzano il supporto per l'associazione alla conversazione corrente possono usare `--bind here` tramite il percorso condiviso di associazione alla conversazione.
- I canali con semantiche personalizzate di thread/topic possono comunque fornire canonicalizzazione specifica del canale dietro la stessa interfaccia condivisa.
- `--bind here` significa sempre "associa sul posto la conversazione corrente".
- Le associazioni generiche alla conversazione corrente usano l'archivio condiviso delle associazioni OpenClaw e sopravvivono ai normali riavvii del gateway.

Note:

- `--bind here` e `--thread ...` si escludono a vicenda in `/acp spawn`.
- Su Discord, `--bind here` associa sul posto il canale o thread corrente. `spawnAcpSessions` è richiesto solo quando OpenClaw deve creare un thread figlio per `--thread auto|here`.
- Se il canale attivo non espone associazioni ACP alla conversazione corrente, OpenClaw restituisce un chiaro messaggio di non supportato.
- `resume` e le domande su "nuova sessione" riguardano la sessione ACP, non il canale. Puoi riutilizzare o sostituire lo stato di runtime senza cambiare la superficie di chat corrente.

### Sessioni associate al thread

Quando le associazioni ai thread sono abilitate per un adapter di canale, le sessioni ACP possono essere associate ai thread:

- OpenClaw associa un thread a una sessione ACP di destinazione.
- I messaggi successivi in quel thread vengono instradati alla sessione ACP associata.
- L'output ACP viene consegnato di nuovo allo stesso thread.
- Unfocus/close/archive/idle-timeout o la scadenza del max-age rimuove l'associazione.

Il supporto per l'associazione al thread è specifico dell'adapter. Se l'adapter del canale attivo non supporta le associazioni ai thread, OpenClaw restituisce un chiaro messaggio di non supportato/non disponibile.

Flag di funzionalità richiesti per ACP associato al thread:

- `acp.enabled=true`
- `acp.dispatch.enabled` è attivo per impostazione predefinita (imposta `false` per mettere in pausa il dispatch ACP)
- Flag dell'adapter di canale per spawn ACP thread abilitato (specifico dell'adapter)
  - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
  - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`

### Canali che supportano thread

- Qualsiasi adapter di canale che esponga la capacità di associazione sessione/thread.
- Supporto integrato attuale:
  - thread/canali Discord
  - topic Telegram (topic forum in gruppi/supergruppi e topic DM)
- I canali Plugin possono aggiungere supporto tramite la stessa interfaccia di associazione.

## Impostazioni specifiche del canale

Per flussi di lavoro non effimeri, configura associazioni ACP persistenti nelle voci `bindings[]` di livello superiore.

### Modello di associazione

- `bindings[].type="acp"` contrassegna un'associazione persistente ACP alla conversazione.
- `bindings[].match` identifica la conversazione di destinazione:
  - canale o thread Discord: `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
  - topic forum Telegram: `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
  - chat DM/gruppo BlueBubbles: `match.channel="bluebubbles"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`
    Preferisci `chat_id:*` o `chat_identifier:*` per associazioni di gruppo stabili.
  - chat DM/gruppo iMessage: `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`
    Preferisci `chat_id:*` per associazioni di gruppo stabili.
- `bindings[].agentId` è l'id dell'agente OpenClaw proprietario.
- Gli override ACP facoltativi si trovano sotto `bindings[].acp`:
  - `mode` (`persistent` o `oneshot`)
  - `label`
  - `cwd`
  - `backend`

### Valori predefiniti di runtime per agente

Usa `agents.list[].runtime` per definire una volta sola i valori predefiniti ACP per agente:

- `agents.list[].runtime.type="acp"`
- `agents.list[].runtime.acp.agent` (id harness, ad esempio `codex` o `claude`)
- `agents.list[].runtime.acp.backend`
- `agents.list[].runtime.acp.mode`
- `agents.list[].runtime.acp.cwd`

Precedenza degli override per sessioni ACP associate:

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
- Le associazioni di runtime temporanee (ad esempio create dai flussi di focus del thread) continuano ad applicarsi dove presenti.
- Per spawn ACP cross-agent senza `cwd` esplicito, OpenClaw eredita il workspace dell'agente di destinazione dalla config dell'agente.
- I percorsi di workspace ereditati mancanti ricadono sul cwd predefinito del backend; i veri errori di accesso su percorsi esistenti emergono come errori di spawn.

## Avvio di sessioni ACP (interfacce)

### Da `sessions_spawn`

Usa `runtime: "acp"` per avviare una sessione ACP da un turno agente o da una chiamata di strumento.

```json
{
  "task": "Apri il repo e riassumi i test che falliscono",
  "runtime": "acp",
  "agentId": "codex",
  "thread": true,
  "mode": "session"
}
```

Note:

- `runtime` ha come predefinito `subagent`, quindi imposta esplicitamente `runtime: "acp"` per le sessioni ACP.
- Se `agentId` viene omesso, OpenClaw usa `acp.defaultAgent` quando configurato.
- `mode: "session"` richiede `thread: true` per mantenere una conversazione persistente associata.

Dettagli dell'interfaccia:

- `task` (obbligatorio): prompt iniziale inviato alla sessione ACP.
- `runtime` (obbligatorio per ACP): deve essere `"acp"`.
- `agentId` (facoltativo): id dell'harness ACP di destinazione. Usa `acp.defaultAgent` come fallback se impostato.
- `thread` (facoltativo, predefinito `false`): richiede il flusso di associazione al thread dove supportato.
- `mode` (facoltativo): `run` (one-shot) o `session` (persistente).
  - il valore predefinito è `run`
  - se `thread: true` e `mode` è omesso, OpenClaw può usare un comportamento persistente predefinito secondo il percorso di runtime
  - `mode: "session"` richiede `thread: true`
- `cwd` (facoltativo): directory di lavoro del runtime richiesta (convalidata dalla policy del backend/runtime). Se omesso, lo spawn ACP eredita il workspace dell'agente di destinazione quando configurato; i percorsi ereditati mancanti ricadono sui valori predefiniti del backend, mentre i veri errori di accesso vengono restituiti.
- `label` (facoltativo): etichetta rivolta all'operatore usata nel testo di sessione/banner.
- `resumeSessionId` (facoltativo): riprende una sessione ACP esistente invece di crearne una nuova. L'agente riproduce la propria cronologia di conversazione tramite `session/load`. Richiede `runtime: "acp"`.
- `streamTo` (facoltativo): `"parent"` trasmette i riepiloghi di avanzamento dell'esecuzione ACP iniziale alla sessione richiedente come eventi di sistema.
  - Quando disponibile, le risposte accettate includono `streamLogPath` che punta a un log JSONL limitato alla sessione (`<sessionId>.acp-stream.jsonl`) che puoi seguire per la cronologia completa del relay.
- `model` (facoltativo): override esplicito del modello per la sessione figlia ACP. Viene rispettato per `runtime: "acp"` così il figlio usa il modello richiesto invece di ricadere silenziosamente sul valore predefinito dell'agente di destinazione.

## Modello di consegna

Le sessioni ACP possono essere sia workspace interattivi sia lavoro in background gestito dal padre. Il percorso di consegna dipende da questa forma.

### Sessioni ACP interattive

Le sessioni interattive sono pensate per continuare a parlare su una superficie di chat visibile:

- `/acp spawn ... --bind here` associa la conversazione corrente alla sessione ACP.
- `/acp spawn ... --thread ...` associa un thread/topic del canale alla sessione ACP.
- Le `bindings[].type="acp"` persistenti configurate instradano le conversazioni corrispondenti alla stessa sessione ACP.

I messaggi successivi nella conversazione associata vengono instradati direttamente alla sessione ACP e l'output ACP viene consegnato di nuovo allo stesso canale/thread/topic.

### Sessioni ACP one-shot gestite dal padre

Le sessioni ACP one-shot generate da un'altra esecuzione agente sono figli in background, simili ai subagenti:

- Il padre chiede lavoro con `sessions_spawn({ runtime: "acp", mode: "run" })`.
- Il figlio viene eseguito nella propria sessione harness ACP.
- Il completamento viene riportato tramite il percorso interno di annuncio del completamento delle attività.
- Il padre riscrive il risultato del figlio con una normale voce dell'assistente quando è utile una risposta visibile all'utente.

Non trattare questo percorso come una chat peer-to-peer tra padre e figlio. Il figlio ha già un canale di completamento verso il padre.

### `sessions_send` e consegna A2A

`sessions_send` può puntare a un'altra sessione dopo lo spawn. Per sessioni peer normali, OpenClaw usa un percorso di follow-up agent-to-agent (A2A) dopo aver iniettato il messaggio:

- attende la risposta della sessione di destinazione
- facoltativamente consente a richiedente e destinazione di scambiarsi un numero limitato di turni di follow-up
- chiede alla destinazione di produrre un messaggio di annuncio
- consegna quell'annuncio al canale o thread visibile

Quel percorso A2A è un fallback per invii peer in cui il mittente ha bisogno di un follow-up visibile. Resta abilitato quando una sessione non correlata può vedere e inviare messaggi a un target ACP, ad esempio sotto impostazioni ampie di `tools.sessions.visibility`.

OpenClaw salta il follow-up A2A solo quando il richiedente è il padre del proprio figlio ACP one-shot gestito dal padre. In quel caso, eseguire A2A sopra il completamento dell'attività può risvegliare il padre con il risultato del figlio, inoltrare la risposta del padre di nuovo al figlio e creare un loop eco padre/figlio. Il risultato di `sessions_send` riporta `delivery.status="skipped"` per quel caso di figlio gestito perché il percorso di completamento è già responsabile del risultato.

### Riprendere una sessione esistente

Usa `resumeSessionId` per continuare una sessione ACP precedente invece di iniziarne una nuova. L'agente riproduce la propria cronologia di conversazione tramite `session/load`, così riprende con il contesto completo di ciò che è avvenuto prima.

```json
{
  "task": "Continua da dove ci siamo fermati — correggi i test restanti che falliscono",
  "runtime": "acp",
  "agentId": "codex",
  "resumeSessionId": "<previous-session-id>"
}
```

Casi d'uso comuni:

- Passare una sessione Codex dal laptop al telefono — chiedi al tuo agente di riprendere da dove avevi lasciato
- Continuare una sessione di coding avviata in modo interattivo nella CLI, ora in modalità headless tramite il tuo agente
- Riprendere il lavoro interrotto da un riavvio del gateway o da un idle timeout

Note:

- `resumeSessionId` richiede `runtime: "acp"` — restituisce un errore se usato con il runtime subagente.
- `resumeSessionId` ripristina la cronologia di conversazione ACP upstream; `thread` e `mode` continuano comunque ad applicarsi normalmente alla nuova sessione OpenClaw che stai creando, quindi `mode: "session"` richiede ancora `thread: true`.
- L'agente di destinazione deve supportare `session/load` (Codex e Claude Code lo supportano).
- Se l'ID sessione non viene trovato, lo spawn fallisce con un errore chiaro — nessun fallback silenzioso a una nuova sessione.

### Smoke test dell'operatore

Usalo dopo un deployment del gateway quando vuoi un rapido controllo live che lo spawn ACP
funzioni davvero end-to-end, non solo che passi i test unitari.

Gate consigliato:

1. Verifica la versione/commit del gateway distribuito sull'host di destinazione.
2. Conferma che il sorgente distribuito includa l'accettazione della lineage ACP in
   `src/gateway/sessions-patch.ts` (`subagent:* or acp:* sessions`).
3. Apri una sessione bridge ACPX temporanea verso un agente live (ad esempio
   `razor(main)` su `jpclawhq`).
4. Chiedi a quell'agente di chiamare `sessions_spawn` con:
   - `runtime: "acp"`
   - `agentId: "codex"`
   - `mode: "run"`
   - task: `Reply with exactly LIVE-ACP-SPAWN-OK`
5. Verifica che l'agente riporti:
   - `accepted=yes`
   - un vero `childSessionKey`
   - nessun errore di validazione
6. Pulisci la sessione bridge ACPX temporanea.

Prompt di esempio per l'agente live:

```text
Use the sessions_spawn tool now with runtime: "acp", agentId: "codex", and mode: "run".
Set the task to: "Reply with exactly LIVE-ACP-SPAWN-OK".
Then report only: accepted=<yes/no>; childSessionKey=<value or none>; error=<exact text or none>.
```

Note:

- Mantieni questo smoke test su `mode: "run"` a meno che tu non stia intenzionalmente testando
  sessioni ACP persistenti associate al thread.
- Non richiedere `streamTo: "parent"` per il gate di base. Quel percorso dipende da
  capacità del richiedente/sessione ed è un controllo di integrazione separato.
- Tratta il test `mode: "session"` associato al thread come un secondo passaggio
  d'integrazione più ricco da un vero thread Discord o topic Telegram.

## Compatibilità sandbox

Le sessioni ACP attualmente vengono eseguite sul runtime host, non dentro il sandbox OpenClaw.

Limitazioni attuali:

- Se la sessione richiedente è nel sandbox, gli spawn ACP sono bloccati sia per `sessions_spawn({ runtime: "acp" })` sia per `/acp spawn`.
  - Errore: `Sandboxed sessions cannot spawn ACP sessions because runtime="acp" runs on the host. Use runtime="subagent" from sandboxed sessions.`
- `sessions_spawn` con `runtime: "acp"` non supporta `sandbox: "require"`.
  - Errore: `sessions_spawn sandbox="require" is unsupported for runtime="acp" because ACP sessions run outside the sandbox. Use runtime="subagent" or sandbox="inherit".`

Usa `runtime: "subagent"` quando hai bisogno di esecuzione forzata dal sandbox.

### Dal comando `/acp`

Usa `/acp spawn` per un controllo esplicito da operatore dalla chat quando necessario.

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

La maggior parte delle azioni `/acp` accetta un target di sessione facoltativo (`session-key`, `session-id` o `session-label`).

Ordine di risoluzione:

1. Argomento target esplicito (oppure `--session` per `/acp steer`)
   - prova prima la chiave
   - poi l'id sessione con forma UUID
   - poi l'etichetta
2. Associazione al thread corrente (se questa conversazione/thread è associata a una sessione ACP)
3. Fallback alla sessione richiedente corrente

Le associazioni alla conversazione corrente e al thread partecipano entrambe al passaggio 2.

Se nessun target viene risolto, OpenClaw restituisce un errore chiaro (`Unable to resolve session target: ...`).

## Modalità di associazione dello spawn

`/acp spawn` supporta `--bind here|off`.

| Modalità | Comportamento                                                         |
| ------ | ---------------------------------------------------------------------- |
| `here` | Associa sul posto la conversazione attiva corrente; fallisce se non ce n'è una attiva. |
| `off`  | Non crea un'associazione alla conversazione corrente.                  |

Note:

- `--bind here` è il percorso operativo più semplice per "rendere questo canale o questa chat supportata da Codex."
- `--bind here` non crea un thread figlio.
- `--bind here` è disponibile solo sui canali che espongono il supporto all'associazione della conversazione corrente.
- `--bind` e `--thread` non possono essere combinati nella stessa chiamata `/acp spawn`.

## Modalità thread dello spawn

`/acp spawn` supporta `--thread auto|here|off`.

| Modalità | Comportamento                                                                                      |
| ------ | --------------------------------------------------------------------------------------------------- |
| `auto` | In un thread attivo: associa quel thread. Fuori da un thread: crea/associa un thread figlio dove supportato. |
| `here` | Richiede il thread attivo corrente; fallisce se non sei dentro uno.                                |
| `off`  | Nessuna associazione. La sessione si avvia non associata.                                           |

Note:

- Su superfici che non supportano l'associazione ai thread, il comportamento predefinito è di fatto `off`.
- Lo spawn associato al thread richiede il supporto della policy del canale:
  - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
  - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`
- Usa `--bind here` quando vuoi fissare la conversazione corrente senza creare un thread figlio.

## Controlli ACP

Famiglia di comandi disponibili:

- `/acp spawn`
- `/acp cancel`
- `/acp steer`
- `/acp close`
- `/acp status`
- `/acp set-mode`
- `/acp set`
- `/acp cwd`
- `/acp permissions`
- `/acp timeout`
- `/acp model`
- `/acp reset-options`
- `/acp sessions`
- `/acp doctor`
- `/acp install`

`/acp status` mostra le opzioni di runtime effettive e, quando disponibili, sia gli identificatori di sessione a livello runtime sia quelli a livello backend.

Alcuni controlli dipendono dalle capacità del backend. Se un backend non supporta un controllo, OpenClaw restituisce un chiaro errore di controllo non supportato.

## Ricettario dei comandi ACP

| Comando              | Cosa fa                                                   | Esempio                                                      |
| -------------------- | --------------------------------------------------------- | ------------------------------------------------------------ |
| `/acp spawn`         | Crea una sessione ACP; associazione corrente o thread facoltativa. | `/acp spawn codex --bind here --cwd /repo`                   |
| `/acp cancel`        | Annulla il turno in corso per la sessione di destinazione. | `/acp cancel agent:codex:acp:<uuid>`                         |
| `/acp steer`         | Invia un'istruzione di steer a una sessione in esecuzione. | `/acp steer --session support inbox dai priorità ai test che falliscono` |
| `/acp close`         | Chiude la sessione e scollega i target thread.            | `/acp close`                                                 |
| `/acp status`        | Mostra backend, modalità, stato, opzioni runtime, capacità. | `/acp status`                                                |
| `/acp set-mode`      | Imposta la modalità runtime per la sessione di destinazione. | `/acp set-mode plan`                                         |
| `/acp set`           | Scrittura generica di un'opzione di config runtime.       | `/acp set model openai/gpt-5.4`                              |
| `/acp cwd`           | Imposta l'override della directory di lavoro del runtime. | `/acp cwd /Users/user/Projects/repo`                         |
| `/acp permissions`   | Imposta il profilo di policy di approvazione.             | `/acp permissions strict`                                    |
| `/acp timeout`       | Imposta il timeout del runtime (secondi).                 | `/acp timeout 120`                                           |
| `/acp model`         | Imposta l'override del modello runtime.                   | `/acp model anthropic/claude-opus-4-6`                       |
| `/acp reset-options` | Rimuove gli override delle opzioni runtime della sessione. | `/acp reset-options`                                         |
| `/acp sessions`      | Elenca le sessioni ACP recenti dall'archivio.             | `/acp sessions`                                              |
| `/acp doctor`        | Stato del backend, capacità, correzioni operative.        | `/acp doctor`                                                |
| `/acp install`       | Stampa passaggi deterministici di installazione e abilitazione. | `/acp install`                                           |

`/acp sessions` legge l'archivio per la sessione corrente associata o richiedente. I comandi che accettano token `session-key`, `session-id` o `session-label` risolvono i target tramite la scoperta della sessione gateway, incluse root personalizzate `session.store` per agente.

## Mappatura delle opzioni runtime

`/acp` ha comandi di convenienza e un setter generico.

Operazioni equivalenti:

- `/acp model <id>` corrisponde alla chiave di config runtime `model`.
- `/acp permissions <profile>` corrisponde alla chiave di config runtime `approval_policy`.
- `/acp timeout <seconds>` corrisponde alla chiave di config runtime `timeout`.
- `/acp cwd <path>` aggiorna direttamente l'override cwd del runtime.
- `/acp set <key> <value>` è il percorso generico.
  - Caso speciale: `key=cwd` usa il percorso di override cwd.
- `/acp reset-options` cancella tutti gli override runtime per la sessione di destinazione.

## Supporto harness acpx (attuale)

Alias harness integrati attuali di acpx:

- `claude`
- `codex`
- `copilot`
- `cursor` (Cursor CLI: `cursor-agent acp`)
- `droid`
- `gemini`
- `iflow`
- `kilocode`
- `kimi`
- `kiro`
- `openclaw`
- `opencode`
- `pi`
- `qwen`

Quando OpenClaw usa il backend acpx, preferisci questi valori per `agentId` a meno che la tua config acpx non definisca alias agente personalizzati.
Se la tua installazione locale di Cursor espone ancora ACP come `agent acp`, sovrascrivi il comando dell'agente `cursor` nella tua config acpx invece di cambiare il valore predefinito integrato.

L'uso diretto della CLI acpx può anche puntare ad adapter arbitrari tramite `--agent <command>`, ma quella via di fuga raw è una funzionalità della CLI acpx (non il normale percorso `agentId` di OpenClaw).

## Configurazione richiesta

Baseline ACP core:

```json5
{
  acp: {
    enabled: true,
    // Facoltativo. Il valore predefinito è true; imposta false per mettere in pausa il dispatch ACP mantenendo i controlli /acp.
    dispatch: { enabled: true },
    backend: "acpx",
    defaultAgent: "codex",
    allowedAgents: [
      "claude",
      "codex",
      "copilot",
      "cursor",
      "droid",
      "gemini",
      "iflow",
      "kilocode",
      "kimi",
      "kiro",
      "openclaw",
      "opencode",
      "pi",
      "qwen",
    ],
    maxConcurrentSessions: 8,
    stream: {
      coalesceIdleMs: 300,
      maxChunkChars: 1200,
    },
    runtime: {
      ttlMinutes: 120,
    },
  },
}
```

La config di associazione al thread è specifica dell'adapter di canale. Esempio per Discord:

```json5
{
  session: {
    threadBindings: {
      enabled: true,
      idleHours: 24,
      maxAgeHours: 0,
    },
  },
  channels: {
    discord: {
      threadBindings: {
        enabled: true,
        spawnAcpSessions: true,
      },
    },
  },
}
```

Se lo spawn ACP associato al thread non funziona, verifica prima il flag di funzionalità dell'adapter:

- Discord: `channels.discord.threadBindings.spawnAcpSessions=true`

Le associazioni alla conversazione corrente non richiedono la creazione di un thread figlio. Richiedono un contesto di conversazione attivo e un adapter di canale che esponga associazioni ACP alla conversazione.

Vedi [Configuration Reference](/it/gateway/configuration-reference).

## Configurazione del Plugin per il backend acpx

Le installazioni nuove distribuiscono il Plugin runtime incluso `acpx` abilitato per impostazione predefinita, quindi ACP
di solito funziona senza un passaggio manuale di installazione del Plugin.

Inizia con:

```text
/acp doctor
```

Se hai disabilitato `acpx`, lo hai negato tramite `plugins.allow` / `plugins.deny`, oppure vuoi
passare a un checkout locale di sviluppo, usa il percorso esplicito del Plugin:

```bash
openclaw plugins install acpx
openclaw config set plugins.entries.acpx.enabled true
```

Installazione del workspace locale durante lo sviluppo:

```bash
openclaw plugins install ./path/to/local/acpx-plugin
```

Poi verifica lo stato del backend:

```text
/acp doctor
```

### Configurazione del comando e della versione acpx

Per impostazione predefinita, il Plugin backend acpx incluso (`acpx`) usa il binario locale al Plugin fissato:

1. Il comando ha come predefinito `node_modules/.bin/acpx` locale al Plugin dentro il pacchetto Plugin ACPX.
2. La versione attesa ha come predefinito il pin dell'estensione.
3. All'avvio registra immediatamente il backend ACP come non pronto.
4. Un job di verifica in background controlla `acpx --version`.
5. Se il binario locale al Plugin manca o non corrisponde, esegue:
   `npm install --omit=dev --no-save acpx@<pinned>` e verifica di nuovo.

Puoi sovrascrivere comando/versione nella config del Plugin:

```json
{
  "plugins": {
    "entries": {
      "acpx": {
        "enabled": true,
        "config": {
          "command": "../acpx/dist/cli.js",
          "expectedVersion": "any"
        }
      }
    }
  }
}
```

Note:

- `command` accetta un percorso assoluto, un percorso relativo o un nome di comando (`acpx`).
- I percorsi relativi vengono risolti dalla directory del workspace OpenClaw.
- `expectedVersion: "any"` disabilita la corrispondenza rigorosa della versione.
- Quando `command` punta a un binario/percorso personalizzato, l'auto-installazione locale al Plugin viene disabilitata.
- L'avvio di OpenClaw resta non bloccante mentre viene eseguito il controllo dello stato del backend.

Vedi [Plugins](/it/tools/plugin).

### Installazione automatica delle dipendenze

Quando installi OpenClaw globalmente con `npm install -g openclaw`, le dipendenze runtime di acpx
(binari specifici della piattaforma) vengono installate automaticamente
tramite un hook postinstall. Se l'installazione automatica fallisce, il gateway si avvia comunque
normalmente e segnala la dipendenza mancante tramite `openclaw acp doctor`.

### Bridge MCP degli strumenti del Plugin

Per impostazione predefinita, le sessioni ACPX **non** espongono all'harness ACP gli strumenti registrati dai plugin OpenClaw.

Se vuoi che agenti ACP come Codex o Claude Code possano chiamare strumenti dei plugin
OpenClaw installati come richiamo/memorizzazione della memoria, abilita il bridge dedicato:

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

Cosa fa:

- Inietta un server MCP integrato chiamato `openclaw-plugin-tools` nel bootstrap della sessione ACPX.
- Espone strumenti Plugin già registrati da plugin OpenClaw installati e abilitati.
- Mantiene la funzionalità esplicita e disattivata per impostazione predefinita.

Note su sicurezza e fiducia:

- Questo amplia la surface degli strumenti dell'harness ACP.
- Gli agenti ACP ottengono accesso solo agli strumenti Plugin già attivi nel gateway.
- Trattalo come lo stesso confine di fiducia del permettere a quei plugin di eseguire dentro OpenClaw stesso.
- Rivedi i plugin installati prima di abilitarlo.

I `mcpServers` personalizzati continuano a funzionare come prima. Il bridge integrato degli strumenti Plugin è
una comodità aggiuntiva opt-in, non un sostituto della config generica del server MCP.

### Bridge MCP degli strumenti OpenClaw

Per impostazione predefinita, le sessioni ACPX inoltre **non** espongono tramite
MCP gli strumenti OpenClaw integrati. Abilita il bridge separato degli strumenti core quando un agente ACP ha bisogno di strumenti integrati selezionati come `cron`:

```bash
openclaw config set plugins.entries.acpx.config.openClawToolsMcpBridge true
```

Cosa fa:

- Inietta un server MCP integrato chiamato `openclaw-tools` nel bootstrap della sessione ACPX.
- Espone strumenti OpenClaw integrati selezionati. Il server iniziale espone `cron`.
- Mantiene l'esposizione degli strumenti core esplicita e disattivata per impostazione predefinita.

### Configurazione del timeout runtime

Il Plugin incluso `acpx` imposta per impostazione predefinita i turni di runtime incorporato a un
timeout di 120 secondi. Questo dà a harness più lenti come Gemini CLI tempo sufficiente per completare
avvio e inizializzazione ACP. Sovrascrivilo se il tuo host richiede un limite
runtime diverso:

```bash
openclaw config set plugins.entries.acpx.config.timeoutSeconds 180
```

Riavvia il gateway dopo aver modificato questo valore.

### Configurazione dell'agente per la sonda di stato

Il Plugin incluso `acpx` verifica un agente harness mentre decide se il
backend runtime incorporato è pronto. Per impostazione predefinita usa `codex`. Se il tuo deployment
usa un agente ACP predefinito diverso, imposta l'agente di sonda sullo stesso id:

```bash
openclaw config set plugins.entries.acpx.config.probeAgent claude
```

Riavvia il gateway dopo aver modificato questo valore.

## Configurazione dei permessi

Le sessioni ACP vengono eseguite in modo non interattivo — non c'è alcuna TTY per approvare o negare prompt di permesso di scrittura file ed esecuzione shell. Il Plugin acpx fornisce due chiavi di config che controllano come vengono gestiti i permessi:

Questi permessi dell'harness ACPX sono separati dalle exec approvals di OpenClaw e separati dai flag di bypass del vendor dei backend CLI come Claude CLI `--permission-mode bypassPermissions`. ACPX `approve-all` è l'interruttore break-glass a livello di harness per le sessioni ACP.

### `permissionMode`

Controlla quali operazioni l'agente harness può eseguire senza prompt.

| Valore          | Comportamento                                              |
| --------------- | ---------------------------------------------------------- |
| `approve-all`   | Approva automaticamente tutte le scritture su file e i comandi shell. |
| `approve-reads` | Approva automaticamente solo le letture; scritture ed exec richiedono prompt. |
| `deny-all`      | Nega tutti i prompt di permesso.                           |

### `nonInteractivePermissions`

Controlla cosa succede quando verrebbe mostrato un prompt di permesso ma non è disponibile alcuna TTY interattiva (che è sempre il caso per le sessioni ACP).

| Valore | Comportamento                                                          |
| ------ | ---------------------------------------------------------------------- |
| `fail` | Interrompe la sessione con `AcpRuntimeError`. **(predefinito)**        |
| `deny` | Nega silenziosamente il permesso e continua (degradazione controllata). |

### Configurazione

Imposta tramite config del Plugin:

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

Riavvia il gateway dopo aver modificato questi valori.

> **Importante:** OpenClaw attualmente usa come valori predefiniti `permissionMode=approve-reads` e `nonInteractivePermissions=fail`. Nelle sessioni ACP non interattive, qualsiasi scrittura o exec che attiva un prompt di permesso può fallire con `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`.
>
> Se hai bisogno di limitare i permessi, imposta `nonInteractivePermissions` su `deny` così le sessioni degradano in modo controllato invece di andare in crash.

## Risoluzione dei problemi

| Sintomo                                                                     | Causa probabile                                                                 | Correzione                                                                                                                                                         |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ACP runtime backend is not configured`                                     | Plugin backend mancante o disabilitato.                                         | Installa e abilita il Plugin backend, poi esegui `/acp doctor`.                                                                                                   |
| `ACP is disabled by policy (acp.enabled=false)`                             | ACP disabilitato globalmente.                                                   | Imposta `acp.enabled=true`.                                                                                                                                         |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`           | Il dispatch dai normali messaggi del thread è disabilitato.                     | Imposta `acp.dispatch.enabled=true`.                                                                                                                                |
| `ACP agent "<id>" is not allowed by policy`                                 | L'agente non è nella allowlist.                                                 | Usa un `agentId` consentito oppure aggiorna `acp.allowedAgents`.                                                                                                   |
| `Unable to resolve session target: ...`                                     | Token chiave/id/etichetta errato.                                               | Esegui `/acp sessions`, copia la chiave/etichetta esatta, riprova.                                                                                                |
| `--bind here requires running /acp spawn inside an active ... conversation` | `--bind here` usato senza una conversazione attiva associabile.                 | Spostati nella chat/canale di destinazione e riprova, oppure usa uno spawn non associato.                                                                         |
| `Conversation bindings are unavailable for <channel>.`                      | L'adapter non ha la capacità ACP di associazione alla conversazione corrente.   | Usa `/acp spawn ... --thread ...` dove supportato, configura `bindings[]` di livello superiore, oppure passa a un canale supportato.                             |
| `--thread here requires running /acp spawn inside an active ... thread`     | `--thread here` usato fuori da un contesto thread.                              | Spostati nel thread di destinazione oppure usa `--thread auto`/`off`.                                                                                              |
| `Only <user-id> can rebind this channel/conversation/thread.`               | Un altro utente possiede il target di associazione attivo.                      | Riassocia come proprietario oppure usa una conversazione o un thread diverso.                                                                                      |
| `Thread bindings are unavailable for <channel>.`                            | L'adapter non ha la capacità di associazione ai thread.                         | Usa `--thread off` oppure passa a un adapter/canale supportato.                                                                                                    |
| `Sandboxed sessions cannot spawn ACP sessions ...`                          | Il runtime ACP è lato host; la sessione richiedente è nel sandbox.              | Usa `runtime="subagent"` da sessioni nel sandbox, oppure esegui lo spawn ACP da una sessione non nel sandbox.                                                     |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`     | `sandbox="require"` richiesto per il runtime ACP.                               | Usa `runtime="subagent"` per sandboxing obbligatorio, oppure usa ACP con `sandbox="inherit"` da una sessione non nel sandbox.                                     |
| Metadati ACP mancanti per la sessione associata                             | Metadati della sessione ACP obsoleti/eliminati.                                 | Ricrea con `/acp spawn`, poi riassocia/rifocalizza il thread.                                                                                                      |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`    | `permissionMode` blocca scritture/exec nella sessione ACP non interattiva.      | Imposta `plugins.entries.acpx.config.permissionMode` su `approve-all` e riavvia il gateway. Vedi [Configurazione dei permessi](#permission-configuration).       |
| La sessione ACP fallisce presto con poco output                             | I prompt di permesso sono bloccati da `permissionMode`/`nonInteractivePermissions`. | Controlla i log del gateway per `AcpRuntimeError`. Per permessi completi, imposta `permissionMode=approve-all`; per degradazione controllata, imposta `nonInteractivePermissions=deny`. |
| La sessione ACP resta bloccata indefinitamente dopo aver completato il lavoro | Il processo harness è terminato ma la sessione ACP non ha segnalato il completamento. | Monitora con `ps aux \| grep acpx`; termina manualmente i processi obsoleti.                                                                                       |
