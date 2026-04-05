---
read_when:
    - Eseguire harness di coding tramite ACP
    - Configurare sessioni ACP legate alla conversazione sui canali di messaggistica
    - Associare una conversazione di un canale di messaggistica a una sessione ACP persistente
    - Risolvere i problemi del backend ACP e dell'integrazione dei plugin
    - Usare i comandi /acp dalla chat
summary: Usa le sessioni runtime ACP per Codex, Claude Code, Cursor, Gemini CLI, OpenClaw ACP e altri agenti harness
title: Agenti ACP
x-i18n:
    generated_at: "2026-04-05T14:07:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 47063abc8170129cd22808d9a4b23160d0f340f6dc789907589d349f68c12e3e
    source_path: tools/acp-agents.md
    workflow: 15
---

# Agenti ACP

Le sessioni [Agent Client Protocol (ACP)](https://agentclientprotocol.com/) consentono a OpenClaw di eseguire harness di coding esterni (ad esempio Pi, Claude Code, Codex, Cursor, Copilot, OpenClaw ACP, OpenCode, Gemini CLI e altri harness ACPX supportati) tramite un plugin backend ACP.

Se chiedi a OpenClaw in linguaggio naturale di "eseguire questo in Codex" o "avviare Claude Code in un thread", OpenClaw dovrebbe instradare quella richiesta al runtime ACP (non al runtime nativo dei sottoagenti). Ogni avvio di sessione ACP viene tracciato come [attività in background](/it/automation/tasks).

Se vuoi che Codex o Claude Code si connettano direttamente come client MCP esterni
alle conversazioni di canale OpenClaw esistenti, usa
[`openclaw mcp serve`](/cli/mcp) invece di ACP.

## Quale pagina mi serve?

Ci sono tre superfici correlate che è facile confondere:

| Vuoi...                                                                            | Usa questo                           | Note                                                                                                                 |
| ----------------------------------------------------------------------------------- | ------------------------------------ | -------------------------------------------------------------------------------------------------------------------- |
| Eseguire Codex, Claude Code, Gemini CLI o un altro harness esterno _attraverso_ OpenClaw | Questa pagina: Agenti ACP            | Sessioni legate alla chat, `/acp spawn`, `sessions_spawn({ runtime: "acp" })`, attività in background, controlli runtime |
| Esporre una sessione Gateway OpenClaw _come_ server ACP per un editor o client      | [`openclaw acp`](/cli/acp)           | Modalità bridge. L'IDE/client parla ACP con OpenClaw tramite stdio/WebSocket                                         |
| Riutilizzare una CLI AI locale come modello di fallback solo testo                  | [Backend CLI](/it/gateway/cli-backends) | Non è ACP. Nessuno strumento OpenClaw, nessun controllo ACP, nessun runtime harness                                  |

## Funziona subito?

Di solito sì.

- Le installazioni nuove ora includono il plugin runtime `acpx` incluso e abilitato per default.
- Il plugin `acpx` incluso preferisce il proprio binario `acpx` locale al plugin.
- All'avvio, OpenClaw verifica quel binario e lo ripara automaticamente se necessario.
- Inizia con `/acp doctor` se vuoi un rapido controllo di disponibilità.

Cosa può comunque succedere al primo utilizzo:

- Un adapter del harness di destinazione può essere scaricato on demand con `npx` la prima volta che usi quel harness.
- L'autenticazione del vendor deve comunque esistere sull'host per quel harness.
- Se l'host non ha accesso a npm/rete, il primo download dell'adapter può fallire finché le cache non vengono preriscaldate o l'adapter non viene installato in un altro modo.

Esempi:

- `/acp spawn codex`: OpenClaw dovrebbe essere pronto a inizializzare `acpx`, ma l'adapter ACP di Codex potrebbe comunque richiedere un download iniziale.
- `/acp spawn claude`: stessa situazione per l'adapter ACP di Claude, più l'autenticazione lato Claude su quell'host.

## Flusso operativo rapido

Usa questo quando vuoi un runbook pratico per `/acp`:

1. Avvia una sessione:
   - `/acp spawn codex --bind here`
   - `/acp spawn codex --mode persistent --thread auto`
2. Lavora nella conversazione o nel thread associato (oppure punta esplicitamente a quella chiave di sessione).
3. Controlla lo stato del runtime:
   - `/acp status`
4. Regola le opzioni del runtime secondo necessità:
   - `/acp model <provider/model>`
   - `/acp permissions <profile>`
   - `/acp timeout <seconds>`
5. Dai un indirizzo a una sessione attiva senza sostituire il contesto:
   - `/acp steer tighten logging and continue`
6. Interrompi il lavoro:
   - `/acp cancel` (ferma il turno corrente), oppure
   - `/acp close` (chiude la sessione + rimuove le associazioni)

## Avvio rapido per gli utenti

Esempi di richieste naturali:

- "Collega questo canale Discord a Codex."
- "Avvia una sessione Codex persistente in un thread qui e mantienila focalizzata."
- "Esegui questo come sessione ACP one-shot di Claude Code e riassumi il risultato."
- "Collega questa chat iMessage a Codex e mantieni i follow-up nello stesso workspace."
- "Usa Gemini CLI per questo compito in un thread, poi mantieni i follow-up nello stesso thread."

Cosa dovrebbe fare OpenClaw:

1. Scegliere `runtime: "acp"`.
2. Risolvere la destinazione harness richiesta (`agentId`, per esempio `codex`).
3. Se viene richiesta l'associazione alla conversazione corrente e il canale attivo la supporta, associare la sessione ACP a quella conversazione.
4. Altrimenti, se viene richiesta l'associazione al thread e il canale corrente la supporta, associare la sessione ACP al thread.
5. Instradare i messaggi successivi associati a quella stessa sessione ACP finché non viene sfocata/chiusa/scaduta.

## ACP rispetto ai sottoagenti

Usa ACP quando vuoi un runtime harness esterno. Usa i sottoagenti quando vuoi esecuzioni delegate native di OpenClaw.

| Area          | Sessione ACP                          | Esecuzione sottoagente               |
| ------------- | ------------------------------------- | ------------------------------------ |
| Runtime       | Plugin backend ACP (per esempio acpx) | Runtime nativo dei sottoagenti OpenClaw |
| Chiave sessione | `agent:<agentId>:acp:<uuid>`        | `agent:<agentId>:subagent:<uuid>`    |
| Comandi principali | `/acp ...`                       | `/subagents ...`                     |
| Strumento di avvio | `sessions_spawn` con `runtime:"acp"` | `sessions_spawn` (runtime predefinito) |

Vedi anche [Sottoagenti](/tools/subagents).

## Come ACP esegue Claude Code

Per Claude Code tramite ACP, lo stack è:

1. Piano di controllo della sessione ACP di OpenClaw
2. plugin runtime `acpx` incluso
3. adapter Claude ACP
4. meccanismo runtime/sessione lato Claude

Distinzione importante:

- Claude ACP non è la stessa cosa del runtime di fallback diretto `claude-cli/...`.
- Claude ACP è una sessione harness con controlli ACP, ripresa della sessione, tracciamento delle attività in background e associazione opzionale a conversazione/thread.
- `claude-cli/...` è un backend CLI locale solo testo. Vedi [Backend CLI](/it/gateway/cli-backends).

Per gli operatori, la regola pratica è:

- vuoi `/acp spawn`, sessioni associabili, controlli runtime o lavoro harness persistente: usa ACP
- vuoi un semplice fallback locale di testo tramite la CLI grezza: usa i backend CLI

## Sessioni associate

### Associazioni alla conversazione corrente

Usa `/acp spawn <harness> --bind here` quando vuoi che la conversazione corrente diventi un workspace ACP duraturo senza creare un thread figlio.

Comportamento:

- OpenClaw continua a gestire il trasporto del canale, l'autenticazione, la sicurezza e la consegna.
- La conversazione corrente viene fissata alla chiave della sessione ACP avviata.
- I messaggi successivi in quella conversazione vengono instradati alla stessa sessione ACP.
- `/new` e `/reset` reimpostano sul posto la stessa sessione ACP associata.
- `/acp close` chiude la sessione e rimuove l'associazione della conversazione corrente.

Cosa significa in pratica:

- `--bind here` mantiene la stessa superficie di chat. Su Discord, il canale corrente resta il canale corrente.
- `--bind here` può comunque creare una nuova sessione ACP se stai avviando nuovo lavoro. L'associazione collega quella sessione alla conversazione corrente.
- `--bind here` non crea da solo un thread figlio Discord o un topic Telegram.
- Il runtime ACP può comunque avere la propria directory di lavoro (`cwd`) o un workspace su disco gestito dal backend. Quel workspace runtime è separato dalla superficie di chat e non implica un nuovo thread di messaggistica.
- Se avvii su un agente ACP diverso e non passi `--cwd`, OpenClaw eredita per default il workspace dell'**agente di destinazione**, non quello del richiedente.
- Se quel percorso del workspace ereditato manca (`ENOENT`/`ENOTDIR`), OpenClaw torna al `cwd` predefinito del backend invece di riutilizzare silenziosamente l'albero sbagliato.
- Se il workspace ereditato esiste ma non è accessibile (per esempio `EACCES`), l'avvio restituisce il reale errore di accesso invece di eliminare `cwd`.

Modello mentale:

- superficie di chat: dove le persone continuano a parlare (`canale Discord`, `topic Telegram`, `chat iMessage`)
- sessione ACP: lo stato runtime duraturo di Codex/Claude/Gemini a cui OpenClaw instrada
- thread/topic figlio: una superficie di messaggistica aggiuntiva opzionale creata solo da `--thread ...`
- workspace runtime: la posizione del filesystem in cui gira il harness (`cwd`, checkout del repo, workspace backend)

Esempi:

- `/acp spawn codex --bind here`: mantieni questa chat, avvia o collega una sessione Codex ACP e instrada qui i messaggi futuri
- `/acp spawn codex --thread auto`: OpenClaw può creare un thread/topic figlio e associare lì la sessione ACP
- `/acp spawn codex --bind here --cwd /workspace/repo`: stessa associazione di chat di cui sopra, ma Codex gira in `/workspace/repo`

Supporto per l'associazione alla conversazione corrente:

- I canali/chat che dichiarano il supporto all'associazione alla conversazione corrente possono usare `--bind here` tramite il percorso condiviso di associazione della conversazione.
- I canali con semantica personalizzata di thread/topic possono comunque fornire una canonizzazione specifica del canale dietro la stessa interfaccia condivisa.
- `--bind here` significa sempre "associa sul posto la conversazione corrente".
- Le associazioni generiche alla conversazione corrente usano l'archivio di associazioni condiviso di OpenClaw e sopravvivono ai normali riavvii del gateway.

Note:

- `--bind here` e `--thread ...` si escludono a vicenda in `/acp spawn`.
- Su Discord, `--bind here` associa sul posto il canale o thread corrente. `spawnAcpSessions` è richiesto solo quando OpenClaw deve creare un thread figlio per `--thread auto|here`.
- Se il canale attivo non espone associazioni ACP alla conversazione corrente, OpenClaw restituisce un chiaro messaggio di operazione non supportata.
- `resume` e le domande "nuova sessione" riguardano la sessione ACP, non il canale. Puoi riutilizzare o sostituire lo stato runtime senza cambiare la superficie di chat corrente.

### Sessioni associate al thread

Quando le associazioni ai thread sono abilitate per un adapter di canale, le sessioni ACP possono essere associate ai thread:

- OpenClaw associa un thread a una sessione ACP di destinazione.
- I messaggi successivi in quel thread vengono instradati alla sessione ACP associata.
- L'output ACP viene consegnato allo stesso thread.
- Sfocatura/chiusura/archiviazione/scadenza per timeout di inattività o età massima rimuovono l'associazione.

Il supporto all'associazione ai thread dipende dall'adapter. Se l'adapter del canale attivo non supporta le associazioni ai thread, OpenClaw restituisce un chiaro messaggio di operazione non supportata/non disponibile.

Flag di funzionalità richiesti per ACP associato al thread:

- `acp.enabled=true`
- `acp.dispatch.enabled` è attivo per default (imposta `false` per mettere in pausa il dispatch ACP)
- Flag di avvio sessioni ACP su thread dell'adapter di canale abilitato (specifico per adapter)
  - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
  - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`

### Canali che supportano i thread

- Qualsiasi adapter di canale che espone la capacità di associazione sessione/thread.
- Supporto integrato attuale:
  - thread/canali Discord
  - topic Telegram (topic del forum in gruppi/supergruppi e topic DM)
- I canali plugin possono aggiungere supporto tramite la stessa interfaccia di associazione.

## Impostazioni specifiche del canale

Per flussi di lavoro non effimeri, configura associazioni ACP persistenti nelle voci di primo livello `bindings[]`.

### Modello di associazione

- `bindings[].type="acp"` indica un'associazione persistente di conversazione ACP.
- `bindings[].match` identifica la conversazione di destinazione:
  - Canale o thread Discord: `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
  - Topic forum Telegram: `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
  - Chat DM/gruppo BlueBubbles: `match.channel="bluebubbles"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`
    Preferisci `chat_id:*` o `chat_identifier:*` per associazioni stabili dei gruppi.
  - Chat DM/gruppo iMessage: `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`
    Preferisci `chat_id:*` per associazioni stabili dei gruppi.
- `bindings[].agentId` è l'id dell'agente OpenClaw proprietario.
- Le sostituzioni ACP opzionali si trovano in `bindings[].acp`:
  - `mode` (`persistent` o `oneshot`)
  - `label`
  - `cwd`
  - `backend`

### Valori predefiniti del runtime per agente

Usa `agents.list[].runtime` per definire una sola volta i valori predefiniti ACP per agente:

- `agents.list[].runtime.type="acp"`
- `agents.list[].runtime.acp.agent` (id harness, per esempio `codex` o `claude`)
- `agents.list[].runtime.acp.backend`
- `agents.list[].runtime.acp.mode`
- `agents.list[].runtime.acp.cwd`

Precedenza delle sostituzioni per sessioni ACP associate:

1. `bindings[].acp.*`
2. `agents.list[].runtime.acp.*`
3. valori predefiniti ACP globali (per esempio `acp.backend`)

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
- Nelle conversazioni associate, `/new` e `/reset` reimpostano sul posto la stessa chiave della sessione ACP.
- Le associazioni runtime temporanee (per esempio create dai flussi di focus del thread) si applicano comunque quando presenti.
- Per avvii ACP cross-agent senza un `cwd` esplicito, OpenClaw eredita il workspace dell'agente di destinazione dalla configurazione dell'agente.
- I percorsi di workspace ereditati mancanti tornano al `cwd` predefinito del backend; i veri errori di accesso su percorsi esistenti vengono mostrati come errori di avvio.

## Avviare sessioni ACP (interfacce)

### Da `sessions_spawn`

Usa `runtime: "acp"` per avviare una sessione ACP da un turno agente o da una chiamata strumento.

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

- `runtime` è predefinito su `subagent`, quindi imposta esplicitamente `runtime: "acp"` per le sessioni ACP.
- Se `agentId` viene omesso, OpenClaw usa `acp.defaultAgent` quando configurato.
- `mode: "session"` richiede `thread: true` per mantenere una conversazione associata persistente.

Dettagli dell'interfaccia:

- `task` (obbligatorio): prompt iniziale inviato alla sessione ACP.
- `runtime` (obbligatorio per ACP): deve essere `"acp"`.
- `agentId` (opzionale): id harness ACP di destinazione. Torna a `acp.defaultAgent` se impostato.
- `thread` (opzionale, predefinito `false`): richiede il flusso di associazione al thread quando supportato.
- `mode` (opzionale): `run` (one-shot) o `session` (persistente).
  - il predefinito è `run`
  - se `thread: true` e mode è omesso, OpenClaw può scegliere un comportamento persistente per default a seconda del percorso runtime
  - `mode: "session"` richiede `thread: true`
- `cwd` (opzionale): directory di lavoro runtime richiesta (validata dalla policy backend/runtime). Se omesso, l'avvio ACP eredita il workspace dell'agente di destinazione quando configurato; i percorsi ereditati mancanti tornano ai valori predefiniti del backend, mentre i reali errori di accesso vengono restituiti.
- `label` (opzionale): etichetta visibile all'operatore usata nel testo di sessione/banner.
- `resumeSessionId` (opzionale): riprende una sessione ACP esistente invece di crearne una nuova. L'agente ricarica la cronologia della conversazione tramite `session/load`. Richiede `runtime: "acp"`.
- `streamTo` (opzionale): `"parent"` inoltra riepiloghi di avanzamento della sessione ACP iniziale alla sessione richiedente come eventi di sistema.
  - Quando disponibile, le risposte accettate includono `streamLogPath` che punta a un log JSONL con ambito di sessione (`<sessionId>.acp-stream.jsonl`) che puoi seguire per l'intera cronologia dell'inoltro.

### Riprendere una sessione esistente

Usa `resumeSessionId` per continuare una sessione ACP precedente invece di iniziarne una nuova. L'agente ricarica la cronologia della sua conversazione tramite `session/load`, così riprende con il contesto completo di ciò che è avvenuto prima.

```json
{
  "task": "Continua da dove avevamo lasciato — correggi i test rimanenti che falliscono",
  "runtime": "acp",
  "agentId": "codex",
  "resumeSessionId": "<previous-session-id>"
}
```

Casi d'uso comuni:

- Passare una sessione Codex dal portatile al telefono — chiedi al tuo agente di riprendere da dove avevi lasciato
- Continuare una sessione di coding che hai iniziato in modo interattivo nella CLI, ora in modo headless tramite il tuo agente
- Riprendere lavoro interrotto da un riavvio del gateway o da un timeout di inattività

Note:

- `resumeSessionId` richiede `runtime: "acp"` — restituisce un errore se usato con il runtime dei sottoagenti.
- `resumeSessionId` ripristina la cronologia della conversazione ACP upstream; `thread` e `mode` continuano comunque ad applicarsi normalmente alla nuova sessione OpenClaw che stai creando, quindi `mode: "session"` richiede ancora `thread: true`.
- L'agente di destinazione deve supportare `session/load` (Codex e Claude Code lo supportano).
- Se l'id della sessione non viene trovato, l'avvio fallisce con un errore chiaro — nessun fallback silenzioso a una nuova sessione.

### Smoke test per operatori

Usa questo dopo un deploy del gateway quando vuoi un rapido controllo live che l'avvio ACP
funzioni davvero end-to-end, non solo che i test unitari passino.

Gate consigliato:

1. Verifica la versione/commit del gateway distribuito sull'host di destinazione.
2. Conferma che il sorgente distribuito includa l'accettazione della linea ACP in
   `src/gateway/sessions-patch.ts` (`subagent:* or acp:* sessions`).
3. Apri una sessione bridge ACPX temporanea verso un agente live (per esempio
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
Usa subito lo strumento sessions_spawn con runtime: "acp", agentId: "codex" e mode: "run".
Imposta task su: "Reply with exactly LIVE-ACP-SPAWN-OK".
Poi riporta solo: accepted=<yes/no>; childSessionKey=<value or none>; error=<exact text or none>.
```

Note:

- Mantieni questo smoke test su `mode: "run"` a meno che tu non stia intenzionalmente testando
  sessioni ACP persistenti associate ai thread.
- Non richiedere `streamTo: "parent"` per il gate di base. Quel percorso dipende da
  capacità del richiedente/sessione ed è un controllo di integrazione separato.
- Considera il test di `mode: "session"` associato a thread come un secondo passaggio
  di integrazione più ricco da un vero thread Discord o topic Telegram.

## Compatibilità con la sandbox

Le sessioni ACP attualmente vengono eseguite sul runtime host, non dentro la sandbox di OpenClaw.

Limitazioni attuali:

- Se la sessione richiedente è in sandbox, gli avvii ACP sono bloccati sia per `sessions_spawn({ runtime: "acp" })` sia per `/acp spawn`.
  - Errore: `Sandboxed sessions cannot spawn ACP sessions because runtime="acp" runs on the host. Use runtime="subagent" from sandboxed sessions.`
- `sessions_spawn` con `runtime: "acp"` non supporta `sandbox: "require"`.
  - Errore: `sessions_spawn sandbox="require" is unsupported for runtime="acp" because ACP sessions run outside the sandbox. Use runtime="subagent" or sandbox="inherit".`

Usa `runtime: "subagent"` quando hai bisogno di esecuzione imposta dalla sandbox.

### Dal comando `/acp`

Usa `/acp spawn` per un controllo esplicito dell'operatore dalla chat quando necessario.

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

Vedi [Comandi slash](/tools/slash-commands).

## Risoluzione della sessione di destinazione

La maggior parte delle azioni `/acp` accetta una destinazione di sessione opzionale (`session-key`, `session-id` o `session-label`).

Ordine di risoluzione:

1. Argomento di destinazione esplicito (o `--session` per `/acp steer`)
   - prova la chiave
   - poi l'id sessione in formato UUID
   - poi l'etichetta
2. Associazione del thread corrente (se questa conversazione/thread è associata a una sessione ACP)
3. Fallback alla sessione del richiedente corrente

Le associazioni alla conversazione corrente e al thread partecipano entrambe al passaggio 2.

Se non viene risolta alcuna destinazione, OpenClaw restituisce un errore chiaro (`Unable to resolve session target: ...`).

## Modalità di associazione all'avvio

`/acp spawn` supporta `--bind here|off`.

| Modalità | Comportamento                                                         |
| -------- | --------------------------------------------------------------------- |
| `here`   | Associa sul posto la conversazione attiva corrente; fallisce se non ce n'è una attiva. |
| `off`    | Non crea un'associazione alla conversazione corrente.                 |

Note:

- `--bind here` è il percorso operativo più semplice per "rendere questo canale o chat supportato da Codex".
- `--bind here` non crea un thread figlio.
- `--bind here` è disponibile solo sui canali che espongono il supporto di associazione alla conversazione corrente.
- `--bind` e `--thread` non possono essere combinati nella stessa chiamata `/acp spawn`.

## Modalità thread all'avvio

`/acp spawn` supporta `--thread auto|here|off`.

| Modalità | Comportamento                                                                                             |
| -------- | --------------------------------------------------------------------------------------------------------- |
| `auto`   | In un thread attivo: associa quel thread. Fuori da un thread: crea/associa un thread figlio quando supportato. |
| `here`   | Richiede il thread attivo corrente; fallisce se non sei in un thread.                                    |
| `off`    | Nessuna associazione. La sessione viene avviata non associata.                                           |

Note:

- Su superfici senza associazione ai thread, il comportamento predefinito è di fatto `off`.
- L'avvio associato al thread richiede supporto della policy del canale:
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

Alcuni controlli dipendono dalle capacità del backend. Se un backend non supporta un controllo, OpenClaw restituisce un chiaro errore di controllo non supportato.

## Ricettario dei comandi ACP

| Comando              | Cosa fa                                                    | Esempio                                                       |
| -------------------- | ---------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | Crea una sessione ACP; associazione corrente o al thread opzionale. | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | Annulla il turno in corso per la sessione di destinazione. | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | Invia istruzioni di steering alla sessione in esecuzione.  | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | Chiude la sessione e scioglie le associazioni ai thread di destinazione. | `/acp close`                                                  |
| `/acp status`        | Mostra backend, modalità, stato, opzioni runtime, capacità. | `/acp status`                                                 |
| `/acp set-mode`      | Imposta la modalità runtime per la sessione di destinazione. | `/acp set-mode plan`                                          |
| `/acp set`           | Scrittura generica di un'opzione di configurazione runtime. | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | Imposta la sostituzione della directory di lavoro runtime. | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | Imposta il profilo della policy di approvazione.           | `/acp permissions strict`                                     |
| `/acp timeout`       | Imposta il timeout runtime (secondi).                      | `/acp timeout 120`                                            |
| `/acp model`         | Imposta la sostituzione del modello runtime.               | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | Rimuove le sostituzioni delle opzioni runtime della sessione. | `/acp reset-options`                                          |
| `/acp sessions`      | Elenca le sessioni ACP recenti dall'archivio.              | `/acp sessions`                                               |
| `/acp doctor`        | Stato del backend, capacità, correzioni applicabili.       | `/acp doctor`                                                 |
| `/acp install`       | Stampa passaggi deterministici di installazione e abilitazione. | `/acp install`                                                |

`/acp sessions` legge l'archivio per la sessione associata corrente o per la sessione del richiedente. I comandi che accettano token `session-key`, `session-id` o `session-label` risolvono le destinazioni tramite la scoperta della sessione gateway, incluse root personalizzate `session.store` per agente.

## Mappatura delle opzioni runtime

`/acp` ha comandi di comodità e un setter generico.

Operazioni equivalenti:

- `/acp model <id>` corrisponde alla chiave di configurazione runtime `model`.
- `/acp permissions <profile>` corrisponde alla chiave di configurazione runtime `approval_policy`.
- `/acp timeout <seconds>` corrisponde alla chiave di configurazione runtime `timeout`.
- `/acp cwd <path>` aggiorna direttamente la sostituzione `cwd` del runtime.
- `/acp set <key> <value>` è il percorso generico.
  - Caso speciale: `key=cwd` usa il percorso di sostituzione `cwd`.
- `/acp reset-options` cancella tutte le sostituzioni runtime per la sessione di destinazione.

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

Quando OpenClaw usa il backend acpx, preferisci questi valori per `agentId` a meno che la tua configurazione acpx non definisca alias agente personalizzati.
Se la tua installazione locale di Cursor espone ancora ACP come `agent acp`, sostituisci il comando dell'agente `cursor` nella tua configurazione acpx invece di cambiare il valore predefinito integrato.

L'uso diretto della CLI acpx può anche puntare ad adapter arbitrari tramite `--agent <command>`, ma questa via di uscita grezza è una funzionalità della CLI acpx (non il normale percorso `agentId` di OpenClaw).

## Configurazione richiesta

Baseline ACP core:

```json5
{
  acp: {
    enabled: true,
    // Opzionale. Il valore predefinito è true; imposta false per mettere in pausa il dispatch ACP mantenendo i controlli /acp.
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

La configurazione dell'associazione ai thread è specifica dell'adapter di canale. Esempio per Discord:

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

Se l'avvio ACP associato al thread non funziona, verifica prima il flag di funzionalità dell'adapter:

- Discord: `channels.discord.threadBindings.spawnAcpSessions=true`

Le associazioni alla conversazione corrente non richiedono la creazione di un thread figlio. Richiedono un contesto di conversazione attivo e un adapter di canale che esponga associazioni ACP di conversazione.

Vedi [Riferimento configurazione](/it/gateway/configuration-reference).

## Configurazione del plugin per il backend acpx

Le installazioni nuove includono il plugin runtime `acpx` incluso e abilitato per default, quindi ACP
di solito funziona senza un passaggio manuale di installazione del plugin.

Inizia con:

```text
/acp doctor
```

Se hai disabilitato `acpx`, lo hai negato tramite `plugins.allow` / `plugins.deny`, o vuoi
passare a un checkout locale di sviluppo, usa il percorso esplicito del plugin:

```bash
openclaw plugins install acpx
openclaw config set plugins.entries.acpx.enabled true
```

Installazione in workspace locale durante lo sviluppo:

```bash
openclaw plugins install ./path/to/local/acpx-plugin
```

Poi verifica lo stato del backend:

```text
/acp doctor
```

### Configurazione del comando e della versione di acpx

Per default, il plugin backend acpx incluso (`acpx`) usa il binario locale al plugin bloccato:

1. Il comando è predefinito sul `node_modules/.bin/acpx` locale al plugin all'interno del pacchetto plugin ACPX.
2. La versione attesa è predefinita sul pin dell'estensione.
3. All'avvio, OpenClaw registra subito il backend ACP come non pronto.
4. Un job di verifica in background controlla `acpx --version`.
5. Se il binario locale al plugin manca o non corrisponde, esegue:
   `npm install --omit=dev --no-save acpx@<pinned>` e verifica di nuovo.

Puoi sostituire comando/versione nella configurazione del plugin:

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

- `command` accetta un percorso assoluto, un percorso relativo o un nome comando (`acpx`).
- I percorsi relativi vengono risolti dalla directory del workspace OpenClaw.
- `expectedVersion: "any"` disabilita il controllo rigoroso della versione.
- Quando `command` punta a un binario/percorso personalizzato, l'installazione automatica locale al plugin viene disabilitata.
- L'avvio di OpenClaw resta non bloccante mentre viene eseguito il controllo di stato del backend.

Vedi [Plugin](/tools/plugin).

### Installazione automatica delle dipendenze

Quando installi OpenClaw globalmente con `npm install -g openclaw`, le dipendenze runtime acpx
(binari specifici per piattaforma) vengono installate automaticamente
tramite un hook postinstall. Se l'installazione automatica fallisce, il gateway
si avvia comunque normalmente e segnala la dipendenza mancante tramite `openclaw acp doctor`.

### Bridge MCP degli strumenti plugin

Per default, le sessioni ACPX **non** espongono gli strumenti registrati dai plugin OpenClaw
all'harness ACP.

Se vuoi che agenti ACP come Codex o Claude Code possano chiamare strumenti dei plugin OpenClaw installati
come memory recall/store, abilita il bridge dedicato:

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

Cosa fa:

- Inietta un server MCP integrato chiamato `openclaw-plugin-tools` nel bootstrap
  della sessione ACPX.
- Espone gli strumenti plugin già registrati dai plugin OpenClaw installati e abilitati.
- Mantiene la funzionalità esplicita e disattivata per default.

Note su sicurezza e trust:

- Questo amplia la superficie degli strumenti dell'harness ACP.
- Gli agenti ACP ottengono accesso solo agli strumenti plugin già attivi nel gateway.
- Consideralo come lo stesso confine di fiducia dell'autorizzare quei plugin a essere eseguiti in
  OpenClaw stesso.
- Esamina i plugin installati prima di abilitarlo.

I `mcpServers` personalizzati continuano a funzionare come prima. Il bridge integrato degli strumenti plugin è una
comodità aggiuntiva facoltativa, non un sostituto della configurazione generica del server MCP.

## Configurazione dei permessi

Le sessioni ACP vengono eseguite in modalità non interattiva — non c'è alcun TTY per approvare o negare richieste di permesso di scrittura file ed esecuzione shell. Il plugin acpx fornisce due chiavi di configurazione che controllano come vengono gestiti i permessi:

Questi permessi degli harness ACPX sono separati dalle approvazioni exec di OpenClaw e separati dai flag di bypass del vendor dei backend CLI come Claude CLI `--permission-mode bypassPermissions`. ACPX `approve-all` è l'interruttore di emergenza a livello harness per le sessioni ACP.

### `permissionMode`

Controlla quali operazioni l'agente harness può eseguire senza richiesta.

| Valore          | Comportamento                                             |
| --------------- | --------------------------------------------------------- |
| `approve-all`   | Approva automaticamente tutte le scritture file e i comandi shell. |
| `approve-reads` | Approva automaticamente solo le letture; scritture ed exec richiedono richieste. |
| `deny-all`      | Nega tutte le richieste di permesso.                      |

### `nonInteractivePermissions`

Controlla cosa succede quando dovrebbe essere mostrata una richiesta di permesso ma non è disponibile alcun TTY interattivo (cosa che per le sessioni ACP vale sempre).

| Valore | Comportamento                                                        |
| ------ | -------------------------------------------------------------------- |
| `fail` | Interrompe la sessione con `AcpRuntimeError`. **(predefinito)**      |
| `deny` | Nega silenziosamente il permesso e continua (degradazione graduale). |

### Configurazione

Imposta tramite la configurazione del plugin:

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

Riavvia il gateway dopo aver cambiato questi valori.

> **Importante:** OpenClaw attualmente usa per default `permissionMode=approve-reads` e `nonInteractivePermissions=fail`. Nelle sessioni ACP non interattive, qualsiasi scrittura o exec che attiva una richiesta di permesso può fallire con `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`.
>
> Se devi limitare i permessi, imposta `nonInteractivePermissions` su `deny` in modo che le sessioni degradino in modo graduale invece di bloccarsi.

## Risoluzione dei problemi

| Sintomo                                                                     | Causa probabile                                                                 | Correzione                                                                                                                                                        |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ACP runtime backend is not configured`                                     | Plugin backend mancante o disabilitato.                                         | Installa e abilita il plugin backend, poi esegui `/acp doctor`.                                                                                                  |
| `ACP is disabled by policy (acp.enabled=false)`                             | ACP disabilitato globalmente.                                                   | Imposta `acp.enabled=true`.                                                                                                                                       |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`           | Dispatch dai normali messaggi di thread disabilitato.                           | Imposta `acp.dispatch.enabled=true`.                                                                                                                              |
| `ACP agent "<id>" is not allowed by policy`                                 | Agente non presente nella allowlist.                                            | Usa un `agentId` consentito o aggiorna `acp.allowedAgents`.                                                                                                      |
| `Unable to resolve session target: ...`                                     | Token key/id/label non valido.                                                  | Esegui `/acp sessions`, copia la key/label esatta, riprova.                                                                                                      |
| `--bind here requires running /acp spawn inside an active ... conversation` | `--bind here` usato senza una conversazione associabile attiva.                 | Spostati nella chat/canale di destinazione e riprova, oppure usa un avvio non associato.                                                                        |
| `Conversation bindings are unavailable for <channel>.`                      | L'adapter non ha la capacità ACP di associazione alla conversazione corrente.   | Usa `/acp spawn ... --thread ...` dove supportato, configura `bindings[]` di primo livello, oppure spostati in un canale supportato.                           |
| `--thread here requires running /acp spawn inside an active ... thread`     | `--thread here` usato fuori da un contesto thread.                              | Spostati nel thread di destinazione o usa `--thread auto`/`off`.                                                                                                 |
| `Only <user-id> can rebind this channel/conversation/thread.`               | Un altro utente possiede la destinazione di associazione attiva.                | Riassocia come proprietario o usa una conversazione o thread diverso.                                                                                            |
| `Thread bindings are unavailable for <channel>.`                            | L'adapter non ha capacità di associazione ai thread.                            | Usa `--thread off` o passa a un adapter/canale supportato.                                                                                                       |
| `Sandboxed sessions cannot spawn ACP sessions ...`                          | Il runtime ACP è lato host; la sessione richiedente è in sandbox.               | Usa `runtime="subagent"` da sessioni in sandbox, oppure avvia ACP da una sessione non in sandbox.                                                               |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`     | È stato richiesto `sandbox="require"` per il runtime ACP.                       | Usa `runtime="subagent"` per sandbox obbligatoria, oppure ACP con `sandbox="inherit"` da una sessione non in sandbox.                                           |
| Missing ACP metadata for bound session                                      | Metadati della sessione ACP obsoleti/eliminati.                                 | Ricrea con `/acp spawn`, poi riassocia/rifocalizza il thread.                                                                                                    |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`    | `permissionMode` blocca scritture/exec in una sessione ACP non interattiva.     | Imposta `plugins.entries.acpx.config.permissionMode` su `approve-all` e riavvia il gateway. Vedi [Configurazione dei permessi](#configurazione-dei-permessi). |
| La sessione ACP fallisce presto con poco output                             | Le richieste di permesso sono bloccate da `permissionMode`/`nonInteractivePermissions`. | Controlla i log del gateway per `AcpRuntimeError`. Per permessi completi, imposta `permissionMode=approve-all`; per degradazione graduale, imposta `nonInteractivePermissions=deny`. |
| La sessione ACP resta bloccata indefinitamente dopo aver completato il lavoro | Il processo harness è terminato ma la sessione ACP non ha segnalato il completamento. | Monitora con `ps aux \| grep acpx`; termina manualmente i processi obsoleti.                                                                                     |
