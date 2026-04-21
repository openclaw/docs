---
read_when:
    - Esecuzione degli harness di coding tramite ACP
    - Configurazione di sessioni ACP associate alla conversazione sui canali di messaggistica
    - Associazione di una conversazione di un canale di messaggistica a una sessione ACP persistente
    - Risoluzione dei problemi del backend ACP e del wiring del plugin
    - Uso dei comandi /acp dalla chat
summary: Usa le sessioni runtime ACP per Codex, Claude Code, Cursor, Gemini CLI, OpenClaw ACP e altri agenti harness
title: ACP Agents
x-i18n:
    generated_at: "2026-04-21T08:29:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: e458ff21d63e52ed0eed4ed65ba2c45aecae20563a3ef10bf4b64e948284b51a
    source_path: tools/acp-agents.md
    workflow: 15
---

# ACP Agents

Le sessioni [Agent Client Protocol (ACP)](https://agentclientprotocol.com/) permettono a OpenClaw di eseguire harness di coding esterni (ad esempio Pi, Claude Code, Codex, Cursor, Copilot, OpenClaw ACP, OpenCode, Gemini CLI e altri harness ACPX supportati) tramite un plugin backend ACP.

Se chiedi a OpenClaw in linguaggio naturale di "eseguire questo in Codex" o "avviare Claude Code in un thread", OpenClaw deve instradare quella richiesta al runtime ACP (non al runtime nativo dei sotto-agenti). Ogni avvio di sessione ACP viene tracciato come [attività in background](/it/automation/tasks).

Se vuoi che Codex o Claude Code si colleghino direttamente come client MCP esterni
a conversazioni di canale OpenClaw esistenti, usa [`openclaw mcp serve`](/cli/mcp)
invece di ACP.

## Quale pagina mi serve?

Ci sono tre superfici vicine che è facile confondere:

| Vuoi...                                                                            | Usa questo                             | Note                                                                                                            |
| ----------------------------------------------------------------------------------- | -------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Eseguire Codex, Claude Code, Gemini CLI o un altro harness esterno _tramite_ OpenClaw | Questa pagina: ACP agents              | Sessioni associate alla chat, `/acp spawn`, `sessions_spawn({ runtime: "acp" })`, attività in background, controlli runtime |
| Esporre una sessione Gateway OpenClaw _come_ server ACP per un editor o un client  | [`openclaw acp`](/cli/acp)             | Modalità bridge. L'IDE/client parla ACP con OpenClaw su stdio/WebSocket                                         |
| Riutilizzare una AI CLI locale come modello di fallback solo testo                  | [CLI Backends](/it/gateway/cli-backends)  | Non ACP. Nessuno strumento OpenClaw, nessun controllo ACP, nessun runtime harness                              |

## Funziona subito?

Di solito sì.

- Le installazioni nuove ora includono il plugin runtime `acpx` già abilitato per impostazione predefinita.
- Il plugin `acpx` incluso preferisce il suo binario `acpx` pinned locale al plugin.
- All'avvio, OpenClaw esegue un probe di quel binario e lo auto-ripara se necessario.
- Inizia con `/acp doctor` se vuoi un controllo rapido di disponibilità.

Cosa può comunque succedere al primo utilizzo:

- Un adapter harness di destinazione può essere scaricato on demand con `npx` la prima volta che usi quell'harness.
- L'autenticazione del vendor deve comunque esistere sull'host per quell'harness.
- Se l'host non ha accesso npm/rete, il primo download dell'adapter può fallire finché la cache non viene preriscaldata o l'adapter non viene installato in altro modo.

Esempi:

- `/acp spawn codex`: OpenClaw dovrebbe essere pronto a bootstrap di `acpx`, ma l'adapter ACP Codex potrebbe comunque richiedere un primo download.
- `/acp spawn claude`: stessa situazione per l'adapter ACP Claude, più l'autenticazione lato Claude su quell'host.

## Flusso rapido per l'operatore

Usa questo quando vuoi un runbook pratico per `/acp`:

1. Avvia una sessione:
   - `/acp spawn codex --bind here`
   - `/acp spawn codex --mode persistent --thread auto`
2. Lavora nella conversazione o nel thread associato (oppure punta esplicitamente a quella chiave di sessione).
3. Controlla lo stato runtime:
   - `/acp status`
4. Regola le opzioni runtime secondo necessità:
   - `/acp model <provider/model>`
   - `/acp permissions <profile>`
   - `/acp timeout <seconds>`
5. Dai un input a una sessione attiva senza sostituire il contesto:
   - `/acp steer restringi il logging e continua`
6. Interrompi il lavoro:
   - `/acp cancel` (ferma il turno corrente), oppure
   - `/acp close` (chiude la sessione + rimuove i binding)

## Avvio rapido per persone

Esempi di richieste in linguaggio naturale:

- "Associa questo canale Discord a Codex."
- "Avvia una sessione Codex persistente in un thread qui e mantienila focalizzata."
- "Esegui questo come sessione ACP Claude Code one-shot e riassumi il risultato."
- "Associa questa chat iMessage a Codex e mantieni i follow-up nello stesso workspace."
- "Usa Gemini CLI per questa attività in un thread, poi mantieni i follow-up in quello stesso thread."

Che cosa deve fare OpenClaw:

1. Scegliere `runtime: "acp"`.
2. Risolvere la destinazione harness richiesta (`agentId`, ad esempio `codex`).
3. Se è richiesto il binding della conversazione corrente e il canale attivo lo supporta, associare la sessione ACP a quella conversazione.
4. Altrimenti, se è richiesto il binding del thread e il canale corrente lo supporta, associare la sessione ACP al thread.
5. Instradare i messaggi successivi associati a quella stessa sessione ACP finché non viene defocalizzata/chiusa/scaduta.

## ACP rispetto ai sotto-agenti

Usa ACP quando vuoi un runtime harness esterno. Usa i sotto-agenti quando vuoi esecuzioni delegate native OpenClaw.

| Area          | Sessione ACP                          | Esecuzione sotto-agente             |
| ------------- | ------------------------------------- | ----------------------------------- |
| Runtime       | Plugin backend ACP (ad esempio acpx)  | Runtime nativo sotto-agente OpenClaw |
| Chiave sessione | `agent:<agentId>:acp:<uuid>`       | `agent:<agentId>:subagent:<uuid>`   |
| Comandi principali | `/acp ...`                       | `/subagents ...`                    |
| Strumento di avvio | `sessions_spawn` con `runtime:"acp"` | `sessions_spawn` (runtime predefinito) |

Vedi anche [Sub-agents](/it/tools/subagents).

## Come ACP esegue Claude Code

Per Claude Code tramite ACP, lo stack è:

1. Control plane della sessione ACP OpenClaw
2. plugin runtime `acpx` incluso
3. adapter Claude ACP
4. runtime/meccanismo di sessione lato Claude

Distinzione importante:

- Claude ACP è una sessione harness con controlli ACP, ripresa della sessione, tracciamento delle attività in background e binding facoltativo a conversazione/thread.
- I backend CLI sono runtime di fallback locali separati solo testo. Vedi [CLI Backends](/it/gateway/cli-backends).

Per gli operatori, la regola pratica è:

- vuoi `/acp spawn`, sessioni associabili, controlli runtime o lavoro harness persistente: usa ACP
- vuoi un semplice fallback testo locale tramite la CLI grezza: usa i backend CLI

## Sessioni associate

### Binding della conversazione corrente

Usa `/acp spawn <harness> --bind here` quando vuoi che la conversazione corrente diventi un workspace ACP durevole senza creare un thread figlio.

Comportamento:

- OpenClaw continua a gestire trasporto del canale, autenticazione, sicurezza e consegna.
- La conversazione corrente viene fissata alla chiave della sessione ACP avviata.
- I messaggi successivi in quella conversazione vengono instradati alla stessa sessione ACP.
- `/new` e `/reset` reimpostano sul posto la stessa sessione ACP associata.
- `/acp close` chiude la sessione e rimuove il binding della conversazione corrente.

Che cosa significa in pratica:

- `--bind here` mantiene la stessa superficie di chat. Su Discord, il canale corrente resta il canale corrente.
- `--bind here` può comunque creare una nuova sessione ACP se stai avviando lavoro nuovo. Il binding collega quella sessione alla conversazione corrente.
- `--bind here` non crea da solo un thread figlio Discord o un topic Telegram.
- Il runtime ACP può comunque avere la propria directory di lavoro (`cwd`) o un workspace gestito dal backend su disco. Quel workspace runtime è separato dalla superficie di chat e non implica un nuovo thread di messaggistica.
- Se avvii verso un agente ACP diverso e non passi `--cwd`, OpenClaw eredita per impostazione predefinita il workspace **dell'agente di destinazione**, non quello del richiedente.
- Se quel percorso workspace ereditato manca (`ENOENT`/`ENOTDIR`), OpenClaw fa fallback al cwd predefinito del backend invece di riutilizzare silenziosamente l'albero sbagliato.
- Se il workspace ereditato esiste ma non è accessibile (ad esempio `EACCES`), l'avvio restituisce il vero errore di accesso invece di scartare `cwd`.

Modello mentale:

- superficie di chat: dove le persone continuano a parlare (`canale Discord`, `topic Telegram`, `chat iMessage`)
- sessione ACP: lo stato runtime durevole di Codex/Claude/Gemini a cui OpenClaw instrada
- thread/topic figlio: una superficie di messaggistica extra facoltativa creata solo da `--thread ...`
- workspace runtime: la posizione nel filesystem in cui gira l'harness (`cwd`, checkout del repo, workspace backend)

Esempi:

- `/acp spawn codex --bind here`: mantieni questa chat, avvia o collega una sessione ACP Codex e instrada qui i messaggi futuri
- `/acp spawn codex --thread auto`: OpenClaw può creare un thread/topic figlio e associare lì la sessione ACP
- `/acp spawn codex --bind here --cwd /workspace/repo`: stesso binding della chat dell'esempio sopra, ma Codex gira in `/workspace/repo`

Supporto del binding della conversazione corrente:

- I canali chat/messaggistica che dichiarano supporto al binding della conversazione corrente possono usare `--bind here` tramite il percorso condiviso di conversation-binding.
- I canali con semantica personalizzata di thread/topic possono comunque fornire canonicalizzazione specifica del canale dietro la stessa interfaccia condivisa.
- `--bind here` significa sempre "associa sul posto la conversazione corrente".
- I binding generici della conversazione corrente usano lo store di binding condiviso OpenClaw e sopravvivono ai normali riavvii del gateway.

Note:

- `--bind here` e `--thread ...` sono mutuamente esclusivi in `/acp spawn`.
- Su Discord, `--bind here` associa sul posto il canale o thread corrente. `spawnAcpSessions` è richiesto solo quando OpenClaw deve creare un thread figlio per `--thread auto|here`.
- Se il canale attivo non espone binding ACP della conversazione corrente, OpenClaw restituisce un chiaro messaggio di non supportato.
- `resume` e le domande su "nuova sessione" sono domande relative alla sessione ACP, non al canale. Puoi riutilizzare o sostituire lo stato runtime senza cambiare la superficie di chat corrente.

### Sessioni associate al thread

Quando i binding dei thread sono abilitati per un adapter di canale, le sessioni ACP possono essere associate ai thread:

- OpenClaw associa un thread a una sessione ACP di destinazione.
- I messaggi successivi in quel thread vengono instradati alla sessione ACP associata.
- L'output ACP viene consegnato di nuovo allo stesso thread.
- Defocus/chiusura/archiviazione/timeout di inattività o scadenza di età massima rimuovono il binding.

Il supporto al binding dei thread è specifico dell'adapter. Se l'adapter del canale attivo non supporta i binding dei thread, OpenClaw restituisce un chiaro messaggio di non supportato/non disponibile.

Feature flag richieste per ACP associato al thread:

- `acp.enabled=true`
- `acp.dispatch.enabled` è attivo per impostazione predefinita (imposta `false` per sospendere il dispatch ACP)
- Feature flag dell'adapter di canale per avvio thread ACP abilitata (specifica dell'adapter)
  - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
  - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`

### Canali che supportano i thread

- Qualunque adapter di canale che esponga capability di binding sessione/thread.
- Supporto integrato attuale:
  - thread/canali Discord
  - topic Telegram (forum topic in gruppi/supergruppi e topic DM)
- I canali plugin possono aggiungere supporto tramite la stessa interfaccia di binding.

## Impostazioni specifiche del canale

Per flussi di lavoro non effimeri, configura binding ACP persistenti in voci `bindings[]` di primo livello.

### Modello di binding

- `bindings[].type="acp"` contrassegna un binding di conversazione ACP persistente.
- `bindings[].match` identifica la conversazione di destinazione:
  - canale o thread Discord: `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
  - forum topic Telegram: `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
  - chat DM/gruppo BlueBubbles: `match.channel="bluebubbles"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`  
    Per binding di gruppo stabili, preferisci `chat_id:*` o `chat_identifier:*`.
  - chat DM/gruppo iMessage: `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`  
    Per binding di gruppo stabili, preferisci `chat_id:*`.
- `bindings[].agentId` è l'ID dell'agente OpenClaw proprietario.
- Gli override ACP facoltativi stanno in `bindings[].acp`:
  - `mode` (`persistent` o `oneshot`)
  - `label`
  - `cwd`
  - `backend`

### Valori runtime predefiniti per agente

Usa `agents.list[].runtime` per definire una sola volta i valori predefiniti ACP per agente:

- `agents.list[].runtime.type="acp"`
- `agents.list[].runtime.acp.agent` (ID harness, ad esempio `codex` o `claude`)
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

- OpenClaw garantisce che la sessione ACP configurata esista prima dell'uso.
- I messaggi in quel canale o topic vengono instradati alla sessione ACP configurata.
- Nelle conversazioni associate, `/new` e `/reset` reimpostano sul posto la stessa chiave di sessione ACP.
- I binding runtime temporanei (ad esempio creati dai flussi di focus del thread) si applicano comunque dove presenti.
- Per gli avvii ACP cross-agent senza `cwd` esplicito, OpenClaw eredita il workspace dell'agente di destinazione dalla configurazione dell'agente.
- I percorsi workspace ereditati mancanti fanno fallback al cwd predefinito del backend; i veri errori di accesso su percorsi esistenti emergono come errori di avvio.

## Avviare sessioni ACP (interfacce)

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
- `agentId` (facoltativo): ID dell'harness ACP di destinazione. Fa fallback a `acp.defaultAgent` se impostato.
- `thread` (facoltativo, predefinito `false`): richiede il flusso di binding del thread dove supportato.
- `mode` (facoltativo): `run` (one-shot) o `session` (persistente).
  - il valore predefinito è `run`
  - se `thread: true` e mode viene omesso, OpenClaw può usare il comportamento persistente predefinito in base al percorso runtime
  - `mode: "session"` richiede `thread: true`
- `cwd` (facoltativo): directory di lavoro runtime richiesta (validata dalla policy backend/runtime). Se omesso, l'avvio ACP eredita il workspace dell'agente di destinazione quando configurato; i percorsi ereditati mancanti fanno fallback ai valori predefiniti del backend, mentre i veri errori di accesso vengono restituiti.
- `label` (facoltativo): etichetta visibile all'operatore usata nel testo di sessione/banner.
- `resumeSessionId` (facoltativo): riprende una sessione ACP esistente invece di crearne una nuova. L'agente riproduce la propria cronologia conversazionale tramite `session/load`. Richiede `runtime: "acp"`.
- `streamTo` (facoltativo): `"parent"` invia in streaming alla sessione richiedente i riepiloghi del progresso della prima esecuzione ACP come eventi di sistema.
  - Quando disponibile, le risposte accettate includono `streamLogPath` che punta a un log JSONL con scope di sessione (`<sessionId>.acp-stream.jsonl`) che puoi seguire per la cronologia completa del relay.

### Riprendere una sessione esistente

Usa `resumeSessionId` per continuare una sessione ACP precedente invece di iniziarne una nuova. L'agente riproduce la propria cronologia conversazionale tramite `session/load`, così riprende con il contesto completo di ciò che è successo prima.

```json
{
  "task": "Continua da dove ci siamo fermati — correggi i restanti test che falliscono",
  "runtime": "acp",
  "agentId": "codex",
  "resumeSessionId": "<previous-session-id>"
}
```

Casi d'uso comuni:

- Passare una sessione Codex dal laptop al telefono — chiedi al tuo agente di riprendere da dove eri rimasto
- Continuare una sessione di coding iniziata in modo interattivo nella CLI, ora in modalità headless tramite il tuo agente
- Riprendere un lavoro interrotto da un riavvio del gateway o da un timeout di inattività

Note:

- `resumeSessionId` richiede `runtime: "acp"` — restituisce un errore se usato con il runtime sotto-agente.
- `resumeSessionId` ripristina la cronologia conversazionale ACP upstream; `thread` e `mode` si applicano comunque normalmente alla nuova sessione OpenClaw che stai creando, quindi `mode: "session"` richiede ancora `thread: true`.
- L'agente di destinazione deve supportare `session/load` (Codex e Claude Code lo supportano).
- Se l'ID della sessione non viene trovato, l'avvio fallisce con un errore chiaro — nessun fallback silenzioso a una nuova sessione.

### Smoke test per operatori

Usa questo dopo un deploy del gateway quando vuoi un rapido controllo live che l'avvio ACP
funzioni davvero end-to-end, non solo nei test unitari.

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
   - una vera `childSessionKey`
   - nessun errore del validatore
6. Pulisci la sessione bridge ACPX temporanea.

Esempio di prompt per l'agente live:

```text
Use the sessions_spawn tool now with runtime: "acp", agentId: "codex", and mode: "run".
Set the task to: "Reply with exactly LIVE-ACP-SPAWN-OK".
Then report only: accepted=<yes/no>; childSessionKey=<value or none>; error=<exact text or none>.
```

Note:

- Mantieni questo smoke test su `mode: "run"` a meno che tu non stia intenzionalmente testando
  sessioni ACP persistenti associate a thread.
- Non richiedere `streamTo: "parent"` per il gate di base. Quel percorso dipende da
  capability del richiedente/sessione ed è un controllo di integrazione separato.
- Tratta il test `mode: "session"` associato a thread come un secondo passaggio
  di integrazione più ricco da un vero thread Discord o topic Telegram.

## Compatibilità con la sandbox

Le sessioni ACP attualmente girano sul runtime host, non dentro la sandbox OpenClaw.

Limitazioni attuali:

- Se la sessione richiedente è in sandbox, gli avvii ACP vengono bloccati sia per `sessions_spawn({ runtime: "acp" })` sia per `/acp spawn`.
  - Errore: `Sandboxed sessions cannot spawn ACP sessions because runtime="acp" runs on the host. Use runtime="subagent" from sandboxed sessions.`
- `sessions_spawn` con `runtime: "acp"` non supporta `sandbox: "require"`.
  - Errore: `sessions_spawn sandbox="require" is unsupported for runtime="acp" because ACP sessions run outside the sandbox. Use runtime="subagent" or sandbox="inherit".`

Usa `runtime: "subagent"` quando ti serve esecuzione imposta dalla sandbox.

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

## Risoluzione della destinazione di sessione

La maggior parte delle azioni `/acp` accetta una destinazione di sessione facoltativa (`session-key`, `session-id` o `session-label`).

Ordine di risoluzione:

1. Argomento di destinazione esplicito (oppure `--session` per `/acp steer`)
   - prova prima la chiave
   - poi un session id in formato UUID
   - poi l'etichetta
2. Binding del thread corrente (se questa conversazione/thread è associata a una sessione ACP)
3. Fallback alla sessione del richiedente corrente

Sia i binding della conversazione corrente sia quelli del thread partecipano al passaggio 2.

Se nessuna destinazione viene risolta, OpenClaw restituisce un errore chiaro (`Unable to resolve session target: ...`).

## Modalità di binding all'avvio

`/acp spawn` supporta `--bind here|off`.

| Modalità | Comportamento                                                           |
| -------- | ----------------------------------------------------------------------- |
| `here`   | Associa sul posto la conversazione attiva corrente; fallisce se non ce n'è una attiva. |
| `off`    | Non crea un binding della conversazione corrente.                       |

Note:

- `--bind here` è il percorso operatore più semplice per "rendere questo canale o chat supportato da Codex".
- `--bind here` non crea un thread figlio.
- `--bind here` è disponibile solo sui canali che espongono supporto al binding della conversazione corrente.
- `--bind` e `--thread` non possono essere combinati nella stessa chiamata `/acp spawn`.

## Modalità thread all'avvio

`/acp spawn` supporta `--thread auto|here|off`.

| Modalità | Comportamento                                                                                          |
| -------- | ------------------------------------------------------------------------------------------------------ |
| `auto`   | In un thread attivo: associa quel thread. Fuori da un thread: crea/associa un thread figlio dove supportato. |
| `here`   | Richiede il thread attivo corrente; fallisce se non sei in un thread.                                  |
| `off`    | Nessun binding. La sessione si avvia non associata.                                                    |

Note:

- Su superfici senza binding di thread, il comportamento predefinito è di fatto `off`.
- L'avvio associato a thread richiede supporto della policy del canale:
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

`/acp status` mostra le opzioni runtime effettive e, quando disponibili, sia gli identificatori di sessione a livello runtime sia quelli a livello backend.

Alcuni controlli dipendono dalle capability del backend. Se un backend non supporta un controllo, OpenClaw restituisce un chiaro errore di controllo non supportato.

## Ricettario dei comandi ACP

| Comando              | Che cosa fa                                               | Esempio                                                       |
| -------------------- | --------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | Crea una sessione ACP; binding corrente o del thread facoltativo. | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | Annulla il turno in corso per la sessione di destinazione. | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | Invia un'istruzione di steering alla sessione in esecuzione. | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | Chiude la sessione e rimuove i binding dai target thread. | `/acp close`                                                  |
| `/acp status`        | Mostra backend, modalità, stato, opzioni runtime, capability. | `/acp status`                                                 |
| `/acp set-mode`      | Imposta la modalità runtime per la sessione di destinazione. | `/acp set-mode plan`                                          |
| `/acp set`           | Scrittura generica di opzioni di configurazione runtime.  | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | Imposta l'override della directory di lavoro runtime.     | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | Imposta il profilo della policy di approvazione.          | `/acp permissions strict`                                     |
| `/acp timeout`       | Imposta il timeout runtime (secondi).                     | `/acp timeout 120`                                            |
| `/acp model`         | Imposta l'override del modello runtime.                   | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | Rimuove gli override delle opzioni runtime della sessione. | `/acp reset-options`                                          |
| `/acp sessions`      | Elenca le sessioni ACP recenti dallo store.               | `/acp sessions`                                               |
| `/acp doctor`        | Integrità backend, capability, correzioni pratiche.       | `/acp doctor`                                                 |
| `/acp install`       | Stampa passaggi deterministici di installazione e abilitazione. | `/acp install`                                                |

`/acp sessions` legge lo store per la sessione corrente associata o del richiedente. I comandi che accettano token `session-key`, `session-id` o `session-label` risolvono i target tramite la discovery di sessione del gateway, incluse root `session.store` personalizzate per agente.

## Mappatura delle opzioni runtime

`/acp` ha comandi di convenienza e un setter generico.

Operazioni equivalenti:

- `/acp model <id>` corrisponde alla chiave di configurazione runtime `model`.
- `/acp permissions <profile>` corrisponde alla chiave di configurazione runtime `approval_policy`.
- `/acp timeout <seconds>` corrisponde alla chiave di configurazione runtime `timeout`.
- `/acp cwd <path>` aggiorna direttamente l'override del cwd runtime.
- `/acp set <key> <value>` è il percorso generico.
  - Caso speciale: `key=cwd` usa il percorso di override del cwd.
- `/acp reset-options` cancella tutti gli override runtime per la sessione di destinazione.

## Supporto harness acpx (attuale)

Alias harness integrati attuali in acpx:

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

Quando OpenClaw usa il backend acpx, preferisci questi valori per `agentId` a meno che la tua configurazione acpx non definisca alias agente personalizzati.
Se la tua installazione locale di Cursor espone ancora ACP come `agent acp`, sovrascrivi il comando dell'agente `cursor` nella tua configurazione acpx invece di cambiare il valore predefinito integrato.

L'uso diretto della CLI acpx può anche puntare ad adapter arbitrari tramite `--agent <command>`, ma questa escape hatch raw è una funzionalità della CLI acpx (non il normale percorso `agentId` di OpenClaw).

## Configurazione richiesta

Baseline ACP core:

```json5
{
  acp: {
    enabled: true,
    // Facoltativo. Il valore predefinito è true; imposta false per sospendere il dispatch ACP mantenendo i controlli /acp.
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

La configurazione del binding dei thread è specifica dell'adapter di canale. Esempio per Discord:

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

Se l'avvio ACP associato a thread non funziona, verifica prima la feature flag dell'adapter:

- Discord: `channels.discord.threadBindings.spawnAcpSessions=true`

I binding della conversazione corrente non richiedono la creazione di un thread figlio. Richiedono un contesto di conversazione attivo e un adapter di canale che esponga binding ACP della conversazione.

Vedi [Configuration Reference](/it/gateway/configuration-reference).

## Configurazione del plugin per backend acpx

Le installazioni nuove includono il plugin runtime `acpx` già abilitato per impostazione predefinita, quindi ACP
di solito funziona senza un passaggio manuale di installazione del plugin.

Inizia con:

```text
/acp doctor
```

Se hai disabilitato `acpx`, lo hai negato tramite `plugins.allow` / `plugins.deny`, oppure vuoi
passare a un checkout locale di sviluppo, usa il percorso esplicito del plugin:

```bash
openclaw plugins install acpx
openclaw config set plugins.entries.acpx.enabled true
```

Installazione del workspace locale durante lo sviluppo:

```bash
openclaw plugins install ./path/to/local/acpx-plugin
```

Poi verifica l'integrità del backend:

```text
/acp doctor
```

### Configurazione di comando e versione di acpx

Per impostazione predefinita, il plugin backend acpx incluso (`acpx`) usa il binario pinned locale al plugin:

1. Il comando ha come predefinito il `node_modules/.bin/acpx` locale al plugin dentro il pacchetto del plugin ACPX.
2. La versione attesa ha come predefinito il pin dell'estensione.
3. All'avvio, ACP backend viene registrato immediatamente come non pronto.
4. Un job di ensure in background verifica `acpx --version`.
5. Se il binario locale al plugin manca o non corrisponde, esegue:
   `npm install --omit=dev --no-save acpx@<pinned>` e verifica di nuovo.

Puoi sovrascrivere comando/versione nella configurazione del plugin:

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
- I percorsi relativi vengono risolti dalla directory workspace di OpenClaw.
- `expectedVersion: "any"` disabilita il controllo rigoroso della versione.
- Quando `command` punta a un binario/percorso personalizzato, l'auto-installazione locale al plugin viene disabilitata.
- L'avvio di OpenClaw resta non bloccante mentre viene eseguito il controllo di integrità del backend.

Vedi [Plugins](/it/tools/plugin).

### Installazione automatica delle dipendenze

Quando installi OpenClaw globalmente con `npm install -g openclaw`, le dipendenze runtime di acpx
(binari specifici della piattaforma) vengono installate automaticamente
tramite un hook postinstall. Se l'installazione automatica fallisce, il gateway si avvia comunque
normalmente e segnala la dipendenza mancante tramite `openclaw acp doctor`.

### Bridge MCP degli strumenti plugin

Per impostazione predefinita, le sessioni ACPX **non** espongono gli strumenti registrati dai plugin OpenClaw all'harness ACP.

Se vuoi che agenti ACP come Codex o Claude Code possano chiamare gli strumenti
dei plugin OpenClaw installati, come memory recall/store, abilita il bridge dedicato:

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

Che cosa fa:

- Inietta un server MCP integrato chiamato `openclaw-plugin-tools` nel
  bootstrap della sessione ACPX.
- Espone gli strumenti plugin già registrati dai plugin OpenClaw installati e abilitati.
- Mantiene la funzionalità esplicita e disattivata per impostazione predefinita.

Note su sicurezza e trust:

- Questo espande la superficie degli strumenti dell'harness ACP.
- Gli agenti ACP ottengono accesso solo agli strumenti plugin già attivi nel gateway.
- Trattalo come lo stesso confine di trust che useresti lasciando eseguire quei plugin
  dentro OpenClaw stesso.
- Esamina i plugin installati prima di abilitarlo.

I `mcpServers` personalizzati continuano a funzionare come prima. Il bridge integrato per gli strumenti plugin è una
comodità aggiuntiva facoltativa, non una sostituzione della configurazione generica dei server MCP.

### Configurazione del timeout runtime

Il plugin `acpx` incluso imposta per impostazione predefinita un timeout di 120 secondi
per i turni runtime embedded. Questo dà ad harness più lenti come Gemini CLI tempo sufficiente per completare
avvio e inizializzazione ACP. Sovrascrivilo se il tuo host richiede un
limite runtime diverso:

```bash
openclaw config set plugins.entries.acpx.config.timeoutSeconds 180
```

Riavvia il gateway dopo aver cambiato questo valore.

### Configurazione dell'agente di probe di integrità

Il plugin `acpx` incluso esegue il probe di un harness agent mentre decide se il
backend runtime embedded è pronto. Per impostazione predefinita usa `codex`. Se la tua distribuzione
usa un agente ACP predefinito diverso, imposta l'agente di probe sullo stesso ID:

```bash
openclaw config set plugins.entries.acpx.config.probeAgent claude
```

Riavvia il gateway dopo aver cambiato questo valore.

## Configurazione dei permessi

Le sessioni ACP girano in modalità non interattiva — non c'è nessun TTY per approvare o negare prompt di permessi per scrittura file ed esecuzione shell. Il plugin acpx fornisce due chiavi di configurazione che controllano come vengono gestiti i permessi:

Questi permessi degli harness ACPX sono separati dalle approvazioni exec di OpenClaw e separati dai flag di bypass del vendor dei backend CLI come Claude CLI `--permission-mode bypassPermissions`. ACPX `approve-all` è l'interruttore break-glass a livello harness per le sessioni ACP.

### `permissionMode`

Controlla quali operazioni l'agente harness può eseguire senza prompt.

| Valore          | Comportamento                                                   |
| --------------- | --------------------------------------------------------------- |
| `approve-all`   | Approva automaticamente tutte le scritture file e i comandi shell. |
| `approve-reads` | Approva automaticamente solo le letture; scritture ed exec richiedono prompt. |
| `deny-all`      | Nega tutti i prompt di permesso.                                |

### `nonInteractivePermissions`

Controlla cosa succede quando verrebbe mostrato un prompt di permesso ma non è disponibile alcun TTY interattivo (che è sempre il caso per le sessioni ACP).

| Valore | Comportamento                                                        |
| ------ | -------------------------------------------------------------------- |
| `fail` | Interrompe la sessione con `AcpRuntimeError`. **(predefinito)**      |
| `deny` | Nega silenziosamente il permesso e continua (degradazione controllata). |

### Configurazione

Imposta tramite configurazione del plugin:

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

Riavvia il gateway dopo aver cambiato questi valori.

> **Importante:** OpenClaw attualmente usa come predefiniti `permissionMode=approve-reads` e `nonInteractivePermissions=fail`. Nelle sessioni ACP non interattive, qualunque scrittura o exec che attivi un prompt di permesso può fallire con `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`.
>
> Se devi limitare i permessi, imposta `nonInteractivePermissions` su `deny` in modo che le sessioni degradino in modo controllato invece di andare in crash.

## Risoluzione dei problemi

| Sintomo                                                                     | Causa probabile                                                                  | Correzione                                                                                                                                                        |
| --------------------------------------------------------------------------- | -------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ACP runtime backend is not configured`                                     | Plugin backend mancante o disabilitato.                                          | Installa e abilita il plugin backend, poi esegui `/acp doctor`.                                                                                                  |
| `ACP is disabled by policy (acp.enabled=false)`                             | ACP disabilitato globalmente.                                                    | Imposta `acp.enabled=true`.                                                                                                                                       |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`           | Dispatch dai normali messaggi del thread disabilitato.                           | Imposta `acp.dispatch.enabled=true`.                                                                                                                              |
| `ACP agent "<id>" is not allowed by policy`                                 | Agente non nella allowlist.                                                      | Usa un `agentId` consentito oppure aggiorna `acp.allowedAgents`.                                                                                                 |
| `Unable to resolve session target: ...`                                     | Token chiave/id/etichetta non valido.                                            | Esegui `/acp sessions`, copia la chiave/etichetta esatta e riprova.                                                                                              |
| `--bind here requires running /acp spawn inside an active ... conversation` | `--bind here` usato senza una conversazione attiva associabile.                  | Spostati nella chat/canale di destinazione e riprova, oppure usa un avvio senza binding.                                                                         |
| `Conversation bindings are unavailable for <channel>.`                      | L'adapter non ha capability ACP di binding della conversazione corrente.         | Usa `/acp spawn ... --thread ...` dove supportato, configura `bindings[]` di primo livello oppure spostati su un canale supportato.                            |
| `--thread here requires running /acp spawn inside an active ... thread`     | `--thread here` usato fuori da un contesto thread.                               | Spostati nel thread di destinazione oppure usa `--thread auto`/`off`.                                                                                            |
| `Only <user-id> can rebind this channel/conversation/thread.`               | Un altro utente possiede il target di binding attivo.                            | Riesegui il binding come proprietario oppure usa una conversazione o un thread diverso.                                                                           |
| `Thread bindings are unavailable for <channel>.`                            | L'adapter non ha capability di thread binding.                                   | Usa `--thread off` oppure spostati su un adapter/canale supportato.                                                                                              |
| `Sandboxed sessions cannot spawn ACP sessions ...`                          | Il runtime ACP è lato host; la sessione richiedente è in sandbox.                | Usa `runtime="subagent"` da sessioni in sandbox, oppure avvia ACP da una sessione non in sandbox.                                                                |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`     | È stato richiesto `sandbox="require"` per il runtime ACP.                        | Usa `runtime="subagent"` per sandbox obbligatoria, oppure usa ACP con `sandbox="inherit"` da una sessione non in sandbox.                                       |
| Missing ACP metadata for bound session                                      | Metadati della sessione ACP obsoleti/eliminati.                                  | Ricrea con `/acp spawn`, poi rifai il binding/focus del thread.                                                                                                   |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`    | `permissionMode` blocca scritture/exec nella sessione ACP non interattiva.       | Imposta `plugins.entries.acpx.config.permissionMode` su `approve-all` e riavvia il gateway. Vedi [Configurazione dei permessi](#configurazione-dei-permessi). |
| La sessione ACP fallisce presto con poco output                             | I prompt di permesso sono bloccati da `permissionMode`/`nonInteractivePermissions`. | Controlla i log del gateway per `AcpRuntimeError`. Per permessi completi, imposta `permissionMode=approve-all`; per degradazione controllata, imposta `nonInteractivePermissions=deny`. |
| La sessione ACP resta bloccata indefinitamente dopo aver completato il lavoro | Il processo harness è terminato ma la sessione ACP non ha segnalato il completamento. | Monitora con `ps aux \| grep acpx`; termina manualmente i processi obsoleti.                                                                                     |
