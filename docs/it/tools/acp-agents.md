---
read_when:
    - Eseguire harness di programmazione tramite ACP
    - Configurazione di sessioni ACP legate alla conversazione sui canali di messaggistica
    - Associazione di una conversazione di un canale di messaggistica a una sessione ACP persistente
    - Risoluzione dei problemi del backend ACP, del collegamento dei Plugin o della consegna dei completamenti
    - Uso dei comandi /acp dalla chat
sidebarTitle: ACP agents
summary: Esegui strumenti di programmazione esterni (Claude Code, Cursor, Gemini CLI, Codex ACP esplicito, OpenClaw ACP, OpenCode) tramite il backend ACP
title: Agenti ACP
x-i18n:
    generated_at: "2026-05-02T08:35:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: ec2404924cbb4c4cd0d94485bc7d8ea586c0ef5f4380e72d5212c8bd9d868c20
    source_path: tools/acp-agents.md
    workflow: 16
---

[Le sessioni Agent Client Protocol (ACP)](https://agentclientprotocol.com/)
consentono a OpenClaw di eseguire harness di coding esterni (ad esempio Pi, Claude Code,
Cursor, Copilot, Droid, OpenClaw ACP, OpenCode, Gemini CLI e altri
harness ACPX supportati) tramite un plugin backend ACP.

Ogni spawn di sessione ACP viene tracciato come [attività in background](/it/automation/tasks).

<Note>
**ACP è il percorso per harness esterni, non il percorso Codex predefinito.** Il
plugin app-server Codex nativo possiede i controlli `/codex ...` e il
runtime incorporato `agentRuntime.id: "codex"`; ACP possiede i controlli
`/acp ...` e le sessioni `sessions_spawn({ runtime: "acp" })`.

Se vuoi che Codex o Claude Code si connettano come client MCP esterno
direttamente alle conversazioni dei canali OpenClaw esistenti, usa
[`openclaw mcp serve`](/it/cli/mcp) invece di ACP.
</Note>

## Quale pagina mi serve?

| Vuoi…                                                                                          | Usa questo                            | Note                                                                                                                                                                                                 |
| ---------------------------------------------------------------------------------------------- | ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Collegare o controllare Codex nella conversazione corrente                                     | `/codex bind`, `/codex threads`       | Percorso app-server Codex nativo quando il plugin `codex` è abilitato; include risposte chat collegate, inoltro immagini, modello/fast/permessi, stop e controlli di guida. ACP è un fallback esplicito |
| Eseguire Claude Code, Gemini CLI, Codex ACP esplicito o un altro harness esterno _tramite_ OpenClaw | Questa pagina                         | Sessioni collegate alla chat, `/acp spawn`, `sessions_spawn({ runtime: "acp" })`, attività in background, controlli runtime                                                                          |
| Esporre una sessione OpenClaw Gateway _come_ server ACP per un editor o client                 | [`openclaw acp`](/it/cli/acp)            | Modalità bridge. IDE/client comunica in ACP con OpenClaw tramite stdio/WebSocket                                                                                                                      |
| Riutilizzare una CLI AI locale come modello fallback solo testo                                | [Backend CLI](/it/gateway/cli-backends) | Non ACP. Nessuno strumento OpenClaw, nessun controllo ACP, nessun runtime harness                                                                                                                     |

## Funziona subito?

Sì, dopo aver installato il plugin runtime ACP ufficiale:

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

I checkout sorgente possono usare il plugin workspace locale `extensions/acpx` dopo
`pnpm install`. Esegui `/acp doctor` per un controllo di prontezza.

OpenClaw istruisce gli agenti sullo spawn ACP solo quando ACP è **davvero
utilizzabile**: ACP deve essere abilitato, il dispatch non deve essere disabilitato, la
sessione corrente non deve essere bloccata dalla sandbox e un backend runtime deve essere
caricato. Se queste condizioni non sono soddisfatte, le Skills del plugin ACP e la
guida ACP di `sessions_spawn` restano nascoste, così l'agente non suggerisce
un backend non disponibile.

<AccordionGroup>
  <Accordion title="Problemi comuni al primo avvio">
    - Se `plugins.allow` è impostato, è un inventario plugin restrittivo e **deve** includere `acpx`; altrimenti il backend ACP installato viene bloccato intenzionalmente e `/acp doctor` segnala la voce allowlist mancante.
    - L'adattatore Codex ACP è predisposto con il plugin `acpx` e avviato localmente quando possibile.
    - Altri adattatori di harness target possono comunque essere recuperati su richiesta con `npx` la prima volta che li usi.
    - L'autenticazione del vendor deve comunque esistere sull'host per quell'harness.
    - Se l'host non ha npm o accesso di rete, i recuperi degli adattatori al primo avvio falliscono finché le cache non vengono pre-riscaldate o l'adattatore non viene installato in un altro modo.

  </Accordion>
  <Accordion title="Prerequisiti runtime">
    ACP avvia un vero processo harness esterno. OpenClaw possiede routing,
    stato delle attività in background, recapito, collegamenti e policy; l'harness
    possiede login del provider, catalogo modelli, comportamento del filesystem e
    strumenti nativi.

    Prima di attribuire il problema a OpenClaw, verifica che:

    - `/acp doctor` segnali un backend abilitato e sano.
    - L'id target sia consentito da `acp.allowedAgents` quando quella allowlist è impostata.
    - Il comando harness possa avviarsi sull'host Gateway.
    - L'autenticazione del provider sia presente per quell'harness (`claude`, `codex`, `gemini`, `opencode`, `droid`, ecc.).
    - Il modello selezionato esista per quell'harness — gli id modello non sono portabili tra harness.
    - Il `cwd` richiesto esista e sia accessibile, oppure ometti `cwd` e lascia che il backend usi il suo valore predefinito.
    - La modalità permessi sia adatta al lavoro. Le sessioni non interattive non possono fare clic sui prompt di permesso nativi, quindi le esecuzioni di coding con molte scritture/esecuzioni di solito richiedono un profilo permessi ACPX che possa procedere senza interfaccia.

  </Accordion>
</AccordionGroup>

Gli strumenti plugin OpenClaw e gli strumenti OpenClaw integrati **non** sono esposti agli
harness ACP per impostazione predefinita. Abilita i bridge MCP espliciti in
[Agenti ACP — configurazione](/it/tools/acp-agents-setup) solo quando l'harness
deve chiamare direttamente quegli strumenti.

## Target harness supportati

Con il backend `acpx`, usa questi id harness come target `/acp spawn <id>`
o `sessions_spawn({ runtime: "acp", agentId: "<id>" })`:

| Id harness | Backend tipico                                  | Note                                                                                   |
| ---------- | ----------------------------------------------- | -------------------------------------------------------------------------------------- |
| `claude`   | Adattatore Claude Code ACP                      | Richiede l'autenticazione Claude Code sull'host.                                       |
| `codex`    | Adattatore Codex ACP                            | Fallback ACP esplicito solo quando `/codex` nativo non è disponibile o ACP è richiesto. |
| `copilot`  | Adattatore GitHub Copilot ACP                   | Richiede autenticazione Copilot CLI/runtime.                                           |
| `cursor`   | Cursor CLI ACP (`cursor-agent acp`)             | Sovrascrivi il comando acpx se un'installazione locale espone un entrypoint ACP diverso. |
| `droid`    | Factory Droid CLI                               | Richiede autenticazione Factory/Droid o `FACTORY_API_KEY` nell'ambiente harness.       |
| `gemini`   | Adattatore Gemini CLI ACP                       | Richiede autenticazione Gemini CLI o configurazione della chiave API.                  |
| `iflow`    | iFlow CLI                                       | Disponibilità dell'adattatore e controllo del modello dipendono dalla CLI installata.  |
| `kilocode` | Kilo Code CLI                                   | Disponibilità dell'adattatore e controllo del modello dipendono dalla CLI installata.  |
| `kimi`     | Kimi/Moonshot CLI                               | Richiede autenticazione Kimi/Moonshot sull'host.                                       |
| `kiro`     | Kiro CLI                                        | Disponibilità dell'adattatore e controllo del modello dipendono dalla CLI installata.  |
| `opencode` | Adattatore OpenCode ACP                         | Richiede autenticazione OpenCode CLI/provider.                                         |
| `openclaw` | Bridge OpenClaw Gateway tramite `openclaw acp`  | Consente a un harness compatibile ACP di comunicare di nuovo con una sessione OpenClaw Gateway. |
| `pi`       | Runtime Pi/OpenClaw incorporato                 | Usato per esperimenti harness nativi OpenClaw.                                         |
| `qwen`     | Qwen Code / Qwen CLI                            | Richiede autenticazione compatibile Qwen sull'host.                                    |

Gli alias agente acpx personalizzati possono essere configurati in acpx stesso, ma la
policy OpenClaw controlla comunque `acp.allowedAgents` e qualsiasi mapping
`agents.list[].runtime.acp.agent` prima del dispatch.

## Runbook operatore

Flusso rapido `/acp` dalla chat:

<Steps>
  <Step title="Spawn">
    `/acp spawn claude --bind here`,
    `/acp spawn gemini --mode persistent --thread auto`, oppure
    `/acp spawn codex --bind here` esplicito.
  </Step>
  <Step title="Lavoro">
    Continua nella conversazione o nel thread collegato (oppure indirizza la sessione
    key esplicitamente).
  </Step>
  <Step title="Controlla stato">
    `/acp status`
  </Step>
  <Step title="Regola">
    `/acp model <provider/model>`,
    `/acp permissions <profile>`,
    `/acp timeout <seconds>`.
  </Step>
  <Step title="Guida">
    Senza sostituire il contesto: `/acp steer tighten logging and continue`.
  </Step>
  <Step title="Ferma">
    `/acp cancel` (turno corrente) oppure `/acp close` (sessione + collegamenti).
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Dettagli del ciclo di vita">
    - Lo spawn crea o riprende una sessione runtime ACP, registra i metadati ACP nello store sessioni OpenClaw e può creare un'attività in background quando l'esecuzione è di proprietà del parent.
    - Le sessioni ACP di proprietà del parent sono trattate come lavoro in background anche quando la sessione runtime è persistente; completamento e recapito tra superfici passano attraverso il notifier dell'attività parent invece di comportarsi come una normale sessione chat rivolta all'utente.
    - La manutenzione attività chiude le sessioni ACP one-shot terminali o orfane di proprietà del parent. Le sessioni ACP persistenti vengono conservate finché rimane un collegamento attivo alla conversazione; le sessioni persistenti obsolete senza un collegamento attivo vengono chiuse, così non possono essere riprese silenziosamente dopo che l'attività proprietaria è terminata o il relativo record attività è sparito.
    - I messaggi di follow-up collegati vanno direttamente alla sessione ACP finché il collegamento non viene chiuso, sfocalizzato, reimpostato o scaduto.
    - I comandi Gateway restano locali. `/acp ...`, `/status` e `/unfocus` non vengono mai inviati come testo prompt normale a un harness ACP collegato.
    - `cancel` interrompe il turno attivo quando il backend supporta la cancellazione; non elimina il collegamento né i metadati della sessione.
    - `close` termina la sessione ACP dal punto di vista di OpenClaw e rimuove il collegamento. Un harness può comunque mantenere la propria cronologia upstream se supporta la ripresa.
    - I worker runtime inattivi sono idonei alla pulizia dopo `acp.runtime.ttlMinutes`; i metadati di sessione archiviati restano disponibili per `/acp sessions`.

  </Accordion>
  <Accordion title="Regole di routing Codex nativo">
    Trigger in linguaggio naturale che devono instradare al **plugin Codex
    nativo** quando è abilitato:

    - "Collega questo canale Discord a Codex."
    - "Associa questa chat al thread Codex `<id>`."
    - "Mostra i thread Codex, poi collega questo."

    Il collegamento conversazione Codex nativo è il percorso predefinito di controllo chat.
    Gli strumenti dinamici OpenClaw continuano a eseguire tramite OpenClaw, mentre
    gli strumenti nativi Codex come shell/apply-patch vengono eseguiti dentro Codex.
    Per gli eventi degli strumenti nativi Codex, OpenClaw inietta un relay hook nativo
    per turno, così gli hook plugin possono bloccare `before_tool_call`, osservare
    `after_tool_call` e instradare gli eventi Codex `PermissionRequest`
    tramite le approvazioni OpenClaw. Gli hook Codex `Stop` vengono inoltrati a
    OpenClaw `before_agent_finalize`, dove i plugin possono richiedere un ulteriore
    passaggio del modello prima che Codex finalizzi la risposta. Il relay rimane
    volutamente conservativo: non modifica gli argomenti degli strumenti nativi Codex
    né riscrive i record dei thread Codex. Usa ACP esplicito solo
    quando vuoi il modello runtime/sessione ACP. Il confine di supporto Codex
    incorporato è documentato nel
    [contratto di supporto Codex harness v1](/it/plugins/codex-harness#v1-support-contract).

  </Accordion>
  <Accordion title="Scheda rapida per la selezione di modello / provider / runtime">
    - `openai-codex/*` — percorso OAuth/abbonamento PI Codex.
    - `openai/*` più `agentRuntime.id: "codex"` — runtime incorporato nativo del server app Codex.
    - `/codex ...` — controllo nativo della conversazione Codex.
    - `/acp ...` o `runtime: "acp"` — controllo ACP/acpx esplicito.

  </Accordion>
  <Accordion title="Trigger in linguaggio naturale per l'instradamento ACP">
    Trigger che devono essere instradati al runtime ACP:

    - "Esegui questo come sessione Claude Code ACP one-shot e riepiloga il risultato."
    - "Usa Gemini CLI per questa attività in un thread, poi mantieni i follow-up nello stesso thread."
    - "Esegui Codex tramite ACP in un thread in background."

    OpenClaw seleziona `runtime: "acp"`, risolve l'harness `agentId`,
    si associa alla conversazione o al thread corrente quando supportato, e
    instrada i follow-up a quella sessione fino alla chiusura/scadenza. Codex segue questo
    percorso solo quando ACP/acpx è esplicito o il Plugin nativo Codex
    non è disponibile per l'operazione richiesta.

    Per `sessions_spawn`, `runtime: "acp"` viene pubblicizzato solo quando ACP
    è abilitato, il richiedente non è in sandbox e un backend runtime
    ACP è caricato. `acp.dispatch.enabled=false` sospende il dispatch automatico
    dei thread ACP ma non nasconde né blocca le chiamate esplicite
    `sessions_spawn({ runtime: "acp" })`. Punta a id di harness ACP come `codex`,
    `claude`, `droid`, `gemini` o `opencode`. Non passare un normale
    id agente della configurazione OpenClaw da `agents_list` a meno che quella voce non sia
    configurata esplicitamente con `agents.list[].runtime.type="acp"`;
    altrimenti usa il runtime sub-agent predefinito. Quando un agente OpenClaw
    è configurato con `runtime.type="acp"`, OpenClaw usa
    `runtime.acp.agent` come id dell'harness sottostante.

  </Accordion>
</AccordionGroup>

## ACP rispetto ai sub-agent

Usa ACP quando vuoi un runtime harness esterno. Usa il **server app
nativo Codex** per associazione/controllo della conversazione Codex quando il Plugin `codex`
è abilitato. Usa i **sub-agent** quando vuoi esecuzioni delegate
native OpenClaw.

| Area          | Sessione ACP                          | Esecuzione sub-agent                |
| ------------- | ------------------------------------- | ---------------------------------- |
| Runtime       | Plugin backend ACP (per esempio acpx) | Runtime sub-agent nativo OpenClaw  |
| Chiave sessione | `agent:<agentId>:acp:<uuid>`        | `agent:<agentId>:subagent:<uuid>`  |
| Comandi principali | `/acp ...`                       | `/subagents ...`                   |
| Strumento di avvio | `sessions_spawn` con `runtime:"acp"` | `sessions_spawn` (runtime predefinito) |

Vedi anche [Sub-agent](/it/tools/subagents).

## Come ACP esegue Claude Code

Per Claude Code tramite ACP, lo stack è:

1. Piano di controllo sessione ACP OpenClaw.
2. Plugin runtime ufficiale `@openclaw/acpx`.
3. Adattatore Claude ACP.
4. Meccanismi runtime/sessione lato Claude.

ACP Claude è una **sessione harness** con controlli ACP, ripresa della sessione,
tracciamento delle attività in background e associazione opzionale a conversazione/thread.

I backend CLI sono runtime locali di fallback solo testo separati — vedi
[Backend CLI](/it/gateway/cli-backends).

Per gli operatori, la regola pratica è:

- **Vuoi `/acp spawn`, sessioni associabili, controlli runtime o lavoro harness persistente?** Usa ACP.
- **Vuoi un semplice fallback di testo locale tramite la CLI grezza?** Usa i backend CLI.

## Sessioni associate

### Modello mentale

- **Superficie chat** — dove le persone continuano a parlare (canale Discord, argomento Telegram, chat iMessage).
- **Sessione ACP** — lo stato runtime durevole Codex/Claude/Gemini a cui OpenClaw instrada.
- **Thread/argomento figlio** — una superficie di messaggistica aggiuntiva opzionale creata solo da `--thread ...`.
- **Workspace runtime** — la posizione nel filesystem (`cwd`, checkout del repo, workspace backend) in cui viene eseguito l'harness. Indipendente dalla superficie chat.

### Associazioni alla conversazione corrente

`/acp spawn <harness> --bind here` fissa la conversazione corrente alla
sessione ACP avviata — nessun thread figlio, stessa superficie chat. OpenClaw continua a
possedere trasporto, auth, sicurezza e consegna. I messaggi di follow-up in quella
conversazione vengono instradati alla stessa sessione; `/new` e `/reset` reimpostano la
sessione sul posto; `/acp close` rimuove l'associazione.

Esempi:

```text
/codex bind                                              # native Codex bind, route future messages here
/codex model gpt-5.4                                     # tune the bound native Codex thread
/codex stop                                              # control the active native Codex turn
/acp spawn codex --bind here                             # explicit ACP fallback for Codex
/acp spawn codex --thread auto                           # may create a child thread/topic and bind there
/acp spawn codex --bind here --cwd /workspace/repo       # same chat binding, Codex runs in /workspace/repo
```

<AccordionGroup>
  <Accordion title="Regole di associazione ed esclusività">
    - `--bind here` e `--thread ...` sono mutuamente esclusivi.
    - `--bind here` funziona solo sui canali che dichiarano l'associazione alla conversazione corrente; in caso contrario OpenClaw restituisce un messaggio chiaro di non supporto. Le associazioni persistono attraverso i riavvii del Gateway.
    - Su Discord, `spawnSessions` controlla la creazione di thread figli per `--thread auto|here` — non `--bind here`.
    - Se avvii un agente ACP diverso senza `--cwd`, OpenClaw eredita per impostazione predefinita il workspace dell'**agente di destinazione**. I percorsi ereditati mancanti (`ENOENT`/`ENOTDIR`) ricadono sul valore predefinito del backend; altri errori di accesso (per es. `EACCES`) emergono come errori di avvio.
    - I comandi di gestione del Gateway restano locali nelle conversazioni associate — i comandi `/acp ...` sono gestiti da OpenClaw anche quando il normale testo di follow-up viene instradato alla sessione ACP associata; anche `/status` e `/unfocus` restano locali ogni volta che la gestione dei comandi è abilitata per quella superficie.

  </Accordion>
  <Accordion title="Sessioni associate a thread">
    Quando le associazioni di thread sono abilitate per un adattatore di canale:

    - OpenClaw associa un thread a una sessione ACP di destinazione.
    - I messaggi di follow-up in quel thread vengono instradati alla sessione ACP associata.
    - L'output ACP viene consegnato allo stesso thread.
    - Unfocus/chiusura/archiviazione/timeout di inattività o scadenza per età massima rimuove l'associazione.
    - `/acp close`, `/acp cancel`, `/acp status`, `/status` e `/unfocus` sono comandi Gateway, non prompt per l'harness ACP.

    Feature flag richiesti per ACP associato a thread:

    - `acp.enabled=true`
    - `acp.dispatch.enabled` è attivo per impostazione predefinita (imposta `false` per sospendere il dispatch automatico dei thread ACP; le chiamate esplicite `sessions_spawn({ runtime: "acp" })` continuano a funzionare).
    - Avvii di sessioni thread dell'adattatore di canale abilitati (predefinito: `true`):
      - Discord: `channels.discord.threadBindings.spawnSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnSessions=true`

    Il supporto per l'associazione di thread è specifico dell'adattatore. Se l'adattatore del canale
    attivo non supporta le associazioni di thread, OpenClaw restituisce un messaggio chiaro
    di non supporto/non disponibilità.

  </Accordion>
  <Accordion title="Canali che supportano i thread">
    - Qualsiasi adattatore di canale che espone la capacità di associazione sessione/thread.
    - Supporto integrato attuale: thread/canali **Discord**, argomenti **Telegram** (argomenti forum in gruppi/supergruppi e argomenti DM).
    - I canali Plugin possono aggiungere supporto tramite la stessa interfaccia di associazione.

  </Accordion>
</AccordionGroup>

## Associazioni di canale persistenti

Per workflow non effimeri, configura associazioni ACP persistenti nelle
voci `bindings[]` di primo livello.

### Modello di associazione

<ParamField path="bindings[].type" type='"acp"'>
  Contrassegna un'associazione persistente di conversazione ACP.
</ParamField>
<ParamField path="bindings[].match" type="object">
  Identifica la conversazione di destinazione. Forme per canale:

- **Canale/thread Discord:** `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
- **Argomento forum Telegram:** `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
- **DM/gruppo BlueBubbles:** `match.channel="bluebubbles"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`. Preferisci `chat_id:*` o `chat_identifier:*` per associazioni di gruppo stabili.
- **DM/gruppo iMessage:** `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`. Preferisci `chat_id:*` per associazioni di gruppo stabili.

</ParamField>
<ParamField path="bindings[].agentId" type="string">
  L'id dell'agente OpenClaw proprietario.
</ParamField>
<ParamField path="bindings[].acp.mode" type='"persistent" | "oneshot"'>
  Override ACP opzionale.
</ParamField>
<ParamField path="bindings[].acp.label" type="string">
  Etichetta opzionale visibile all'operatore.
</ParamField>
<ParamField path="bindings[].acp.cwd" type="string">
  Directory di lavoro runtime opzionale.
</ParamField>
<ParamField path="bindings[].acp.backend" type="string">
  Override backend opzionale.
</ParamField>

### Valori predefiniti runtime per agente

Usa `agents.list[].runtime` per definire i valori predefiniti ACP una volta per agente:

- `agents.list[].runtime.type="acp"`
- `agents.list[].runtime.acp.agent` (id harness, per es. `codex` o `claude`)
- `agents.list[].runtime.acp.backend`
- `agents.list[].runtime.acp.mode`
- `agents.list[].runtime.acp.cwd`

**Precedenza degli override per le sessioni ACP associate:**

1. `bindings[].acp.*`
2. `agents.list[].runtime.acp.*`
3. Valori predefiniti ACP globali (per es. `acp.backend`)

### Esempio

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

### Comportamento

- OpenClaw garantisce che la sessione ACP configurata esista prima dell'uso.
- I messaggi in quel canale o argomento vengono instradati alla sessione ACP configurata.
- Nelle conversazioni associate, `/new` e `/reset` reimpostano la stessa chiave di sessione ACP sul posto.
- Le associazioni runtime temporanee (per esempio create dai flussi di focus del thread) si applicano comunque dove presenti.
- Per avvii ACP cross-agent senza un `cwd` esplicito, OpenClaw eredita il workspace dell'agente di destinazione dalla configurazione agente.
- I percorsi workspace ereditati mancanti ricadono sul cwd predefinito del backend; gli errori di accesso non dovuti a percorsi mancanti emergono come errori di avvio.

## Avviare sessioni ACP

Due modi per avviare una sessione ACP:

<Tabs>
  <Tab title="Da sessions_spawn">
    Usa `runtime: "acp"` per avviare una sessione ACP da un turno agente o
    una chiamata strumento.

    ```json
    {
      "task": "Open the repo and summarize failing tests",
      "runtime": "acp",
      "agentId": "codex",
      "thread": true,
      "mode": "session"
    }
    ```

    <Note>
    `runtime` predefinito è `subagent`, quindi imposta esplicitamente `runtime: "acp"`
    per le sessioni ACP. Se `agentId` viene omesso, OpenClaw usa
    `acp.defaultAgent` quando configurato. `mode: "session"` richiede
    `thread: true` per mantenere una conversazione associata persistente.
    </Note>

  </Tab>
  <Tab title="From /acp command">
    Usa `/acp spawn` per il controllo esplicito dell'operatore dalla chat.

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

    Vedi [comandi slash](/it/tools/slash-commands).

  </Tab>
</Tabs>

### Parametri di `sessions_spawn`

<ParamField path="task" type="string" required>
  Prompt iniziale inviato alla sessione ACP.
</ParamField>
<ParamField path="runtime" type='"acp"' required>
  Deve essere `"acp"` per le sessioni ACP.
</ParamField>
<ParamField path="agentId" type="string">
  ID dell'harness ACP di destinazione. Ripiega su `acp.defaultAgent` se impostato.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  Richiede il flusso di associazione al thread dove supportato.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  `"run"` è monouso; `"session"` è persistente. Se `thread: true` e
  `mode` viene omesso, OpenClaw può impostare il comportamento persistente come predefinito in base al
  percorso runtime. `mode: "session"` richiede `thread: true`.
</ParamField>
<ParamField path="cwd" type="string">
  Directory di lavoro runtime richiesta (validata dalla policy del backend/runtime).
  Se omessa, la generazione ACP eredita l'area di lavoro dell'agente di destinazione
  quando configurata; i percorsi ereditati mancanti ripiegano sui valori predefiniti
  del backend, mentre gli errori di accesso reali vengono restituiti.
</ParamField>
<ParamField path="label" type="string">
  Etichetta visibile all'operatore usata nel testo di sessione/banner.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  Riprende una sessione ACP esistente invece di crearne una nuova. L'agente
  riproduce la cronologia della conversazione tramite `session/load`. Richiede
  `runtime: "acp"`.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  `"parent"` trasmette i riepiloghi di avanzamento dell'esecuzione ACP iniziale alla
  sessione richiedente come eventi di sistema. Le risposte accettate includono
  `streamLogPath` che punta a un log JSONL con ambito di sessione
  (`<sessionId>.acp-stream.jsonl`) che puoi seguire per la cronologia completa del relay.
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  Interrompe il turno ACP figlio dopo N secondi. `0` mantiene il turno sul percorso
  senza timeout del gateway. Lo stesso valore viene applicato all'esecuzione Gateway
  e al runtime ACP, così gli harness bloccati o con quota esaurita non
  occupano indefinitamente la corsia dell'agente padre.
</ParamField>
<ParamField path="model" type="string">
  Override esplicito del modello per la sessione ACP figlia. Le generazioni Codex ACP
  normalizzano i riferimenti OpenClaw Codex come `openai-codex/gpt-5.4` nella configurazione
  di avvio Codex ACP prima di `session/new`; le forme slash come
  `openai-codex/gpt-5.4/high` impostano anche lo sforzo di ragionamento Codex ACP.
  Gli altri harness devono pubblicizzare ACP `models` e supportare
  `session/set_model`; altrimenti OpenClaw/acpx fallisce chiaramente invece di
  ripiegare silenziosamente sul valore predefinito dell'agente di destinazione.
</ParamField>
<ParamField path="thinking" type="string">
  Sforzo di pensiero/ragionamento esplicito. Per Codex ACP, `minimal` corrisponde a
  sforzo basso, `low`/`medium`/`high`/`xhigh` corrispondono direttamente, e `off`
  omette l'override dello sforzo di ragionamento all'avvio.
</ParamField>

## Modalità di associazione e thread della generazione

<Tabs>
  <Tab title="--bind here|off">
    | Modalità | Comportamento                                                          |
    | -------- | ---------------------------------------------------------------------- |
    | `here` | Associa sul posto la conversazione attiva corrente; fallisce se nessuna è attiva. |
    | `off`  | Non creare un'associazione alla conversazione corrente.                |

    Note:

    - `--bind here` è il percorso operatore più semplice per "rendere questo canale o chat supportato da Codex".
    - `--bind here` non crea un thread figlio.
    - `--bind here` è disponibile solo sui canali che espongono il supporto per l'associazione alla conversazione corrente.
    - `--bind` e `--thread` non possono essere combinati nella stessa chiamata `/acp spawn`.

  </Tab>
  <Tab title="--thread auto|here|off">
    | Modalità | Comportamento                                                                                     |
    | -------- | ------------------------------------------------------------------------------------------------- |
    | `auto` | In un thread attivo: associa quel thread. Fuori da un thread: crea/associa un thread figlio quando supportato. |
    | `here` | Richiede il thread attivo corrente; fallisce se non ci si trova in uno.                           |
    | `off`  | Nessuna associazione. La sessione viene avviata senza associazione.                               |

    Note:

    - Sulle superfici senza associazione a thread, il comportamento predefinito è di fatto `off`.
    - La generazione associata a thread richiede il supporto della policy del canale:
      - Discord: `channels.discord.threadBindings.spawnSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnSessions=true`
    - Usa `--bind here` quando vuoi fissare la conversazione corrente senza creare un thread figlio.

  </Tab>
</Tabs>

## Modello di consegna

Le sessioni ACP possono essere aree di lavoro interattive oppure lavoro in background
di proprietà del padre. Il percorso di consegna dipende da questa forma.

<AccordionGroup>
  <Accordion title="Interactive ACP sessions">
    Le sessioni interattive sono pensate per continuare a conversare su una superficie
    di chat visibile:

    - `/acp spawn ... --bind here` associa la conversazione corrente alla sessione ACP.
    - `/acp spawn ... --thread ...` associa un thread/argomento del canale alla sessione ACP.
    - Le associazioni persistenti configurate `bindings[].type="acp"` instradano le conversazioni corrispondenti alla stessa sessione ACP.

    I messaggi successivi nella conversazione associata vengono instradati direttamente alla
    sessione ACP, e l'output ACP viene riconsegnato allo stesso
    canale/thread/argomento.

    Cosa OpenClaw invia all'harness:

    - I normali follow-up associati vengono inviati come testo del prompt, più allegati solo quando l'harness/backend li supporta.
    - I comandi di gestione `/acp` e i comandi Gateway locali vengono intercettati prima dell'invio ACP.
    - Gli eventi di completamento generati dal runtime vengono materializzati per destinazione. Gli agenti OpenClaw ricevono l'envelope interno di contesto runtime di OpenClaw; gli harness ACP esterni ricevono un prompt semplice con il risultato figlio e l'istruzione. L'envelope grezzo `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>` non deve mai essere inviato a harness esterni né conservato come testo della trascrizione utente ACP.
    - Le voci della trascrizione ACP usano il testo di attivazione visibile all'utente o il prompt di completamento semplice. I metadati degli eventi interni restano strutturati in OpenClaw dove possibile e non vengono trattati come contenuto chat scritto dall'utente.

  </Accordion>
  <Accordion title="Parent-owned one-shot ACP sessions">
    Le sessioni ACP monouso generate da un'altra esecuzione agente sono figli in background,
    simili ai sotto-agenti:

    - Il padre richiede lavoro con `sessions_spawn({ runtime: "acp", mode: "run" })`.
    - Il figlio viene eseguito nella propria sessione harness ACP.
    - I turni figlio vengono eseguiti sulla stessa corsia in background usata dalle generazioni di sotto-agenti native, quindi un harness ACP lento non blocca il lavoro non correlato della sessione principale.
    - Il completamento viene riportato tramite il percorso di annuncio del completamento attività. OpenClaw converte i metadati interni di completamento in un prompt ACP semplice prima di inviarli a un harness esterno, così gli harness non vedono i marcatori di contesto runtime esclusivi di OpenClaw.
    - Il padre riscrive il risultato del figlio con normale voce da assistente quando è utile una risposta visibile all'utente.

    **Non** trattare questo percorso come una chat peer-to-peer tra padre
    e figlio. Il figlio ha già un canale di completamento di ritorno al
    padre.

  </Accordion>
  <Accordion title="sessions_send and A2A delivery">
    `sessions_send` può indirizzare un'altra sessione dopo la generazione. Per le normali
    sessioni peer, OpenClaw usa un percorso di follow-up agente-agente (A2A)
    dopo aver iniettato il messaggio:

    - Attendi la risposta della sessione di destinazione.
    - Facoltativamente consenti a richiedente e destinazione di scambiarsi un numero limitato di turni di follow-up.
    - Chiedi alla destinazione di produrre un messaggio di annuncio.
    - Consegnare quell'annuncio al canale o thread visibile.

    Quel percorso A2A è un fallback per gli invii peer in cui il mittente necessita di un
    follow-up visibile. Rimane abilitato quando una sessione non correlata può
    vedere e inviare messaggi a una destinazione ACP, per esempio con impostazioni ampie di
    `tools.sessions.visibility`.

    OpenClaw salta il follow-up A2A solo quando il richiedente è il
    padre del proprio figlio ACP monouso di proprietà del padre. In quel caso,
    eseguire A2A sopra il completamento attività può svegliare il padre con il
    risultato del figlio, inoltrare la risposta del padre di nuovo nel figlio, e
    creare un ciclo di eco padre/figlio. Il risultato `sessions_send` riporta
    `delivery.status="skipped"` per quel caso di figlio posseduto perché il
    percorso di completamento è già responsabile del risultato.

  </Accordion>
  <Accordion title="Resume an existing session">
    Usa `resumeSessionId` per continuare una sessione ACP precedente invece di
    iniziarne una nuova. L'agente riproduce la cronologia della conversazione tramite
    `session/load`, quindi riprende con il contesto completo di ciò che è avvenuto prima.

    ```json
    {
      "task": "Continue where we left off — fix the remaining test failures",
      "runtime": "acp",
      "agentId": "codex",
      "resumeSessionId": "<previous-session-id>"
    }
    ```

    Casi d'uso comuni:

    - Passa una sessione Codex dal laptop al telefono — dì al tuo agente di riprendere da dove ti eri fermato.
    - Continua una sessione di coding che hai avviato interattivamente nella CLI, ora in modalità headless tramite il tuo agente.
    - Riprendi un lavoro interrotto da un riavvio del gateway o da un timeout di inattività.

    Note:

    - `resumeSessionId` si applica solo quando `runtime: "acp"`; il runtime sotto-agente predefinito ignora questo campo esclusivo ACP.
    - `streamTo` si applica solo quando `runtime: "acp"`; il runtime sotto-agente predefinito ignora questo campo esclusivo ACP.
    - `resumeSessionId` è un ID di ripresa ACP/harness locale all'host, non una chiave di sessione del canale OpenClaw; OpenClaw controlla comunque la policy di generazione ACP e la policy dell'agente di destinazione prima dell'invio, mentre il backend o l'harness ACP possiede l'autorizzazione per caricare quell'ID upstream.
    - `resumeSessionId` ripristina la cronologia della conversazione ACP upstream; `thread` e `mode` si applicano comunque normalmente alla nuova sessione OpenClaw che stai creando, quindi `mode: "session"` richiede ancora `thread: true`.
    - L'agente di destinazione deve supportare `session/load` (Codex e Claude Code lo fanno).
    - Se l'ID sessione non viene trovato, la generazione fallisce con un errore chiaro — nessun fallback silenzioso a una nuova sessione.

  </Accordion>
  <Accordion title="Post-deploy smoke test">
    Dopo un deploy del gateway, esegui una verifica end-to-end live invece di
    fidarti dei test unitari:

    1. Verifica la versione e il commit del gateway distribuito sull'host di destinazione.
    2. Apri una sessione bridge ACPX temporanea verso un agente live.
    3. Chiedi a quell'agente di chiamare `sessions_spawn` con `runtime: "acp"`, `agentId: "codex"`, `mode: "run"`, e attività `Reply with exactly LIVE-ACP-SPAWN-OK`.
    4. Verifica `accepted=yes`, un `childSessionKey` reale, e nessun errore del validatore.
    5. Pulisci la sessione bridge temporanea.

    Mantieni il gate su `mode: "run"` e salta `streamTo: "parent"` —
    `mode: "session"` associato a thread e i percorsi di stream-relay sono passaggi
    di integrazione più ricchi separati.

  </Accordion>
</AccordionGroup>

## Compatibilità sandbox

Le sessioni ACP attualmente vengono eseguite sul runtime host, **non** dentro la
sandbox OpenClaw.

<Warning>
**Confine di sicurezza:**

- L'harness esterno può leggere/scrivere in base ai propri permessi CLI e al `cwd` selezionato.
- La policy di sandbox di OpenClaw **non** avvolge l'esecuzione dell'harness ACP.
- OpenClaw continua ad applicare i gate delle funzionalità ACP, gli agent consentiti, la proprietà della sessione, i binding dei canali e la policy di consegna del Gateway.
- Usa `runtime: "subagent"` per il lavoro nativo di OpenClaw con enforcement della sandbox.

</Warning>

Limitazioni attuali:

- Se la sessione del richiedente è in sandbox, gli spawn ACP sono bloccati sia per `sessions_spawn({ runtime: "acp" })` sia per `/acp spawn`.
- `sessions_spawn` con `runtime: "acp"` non supporta `sandbox: "require"`.

## Risoluzione della destinazione della sessione

La maggior parte delle azioni `/acp` accetta una destinazione di sessione opzionale (`session-key`,
`session-id` o `session-label`).

**Ordine di risoluzione:**

1. Argomento di destinazione esplicito (o `--session` per `/acp steer`)
   - prova la chiave
   - poi l'id di sessione in formato UUID
   - poi l'etichetta
2. Binding del thread corrente (se questa conversazione/thread è associata a una sessione ACP).
3. Fallback alla sessione corrente del richiedente.

I binding della conversazione corrente e i binding del thread partecipano entrambi al
passaggio 2.

Se nessuna destinazione viene risolta, OpenClaw restituisce un errore chiaro
(`Unable to resolve session target: ...`).

## Controlli ACP

| Comando              | Cosa fa                                                   | Esempio                                                       |
| -------------------- | --------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | Crea una sessione ACP; binding corrente o del thread opzionale. | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | Annulla il turno in corso per la sessione di destinazione. | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | Invia un'istruzione di orientamento alla sessione in esecuzione. | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | Chiude la sessione e rimuove i binding delle destinazioni del thread. | `/acp close`                                                  |
| `/acp status`        | Mostra backend, modalità, stato, opzioni runtime, capability. | `/acp status`                                                 |
| `/acp set-mode`      | Imposta la modalità runtime per la sessione di destinazione. | `/acp set-mode plan`                                          |
| `/acp set`           | Scrive un'opzione generica di configurazione runtime.     | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | Imposta l'override della directory di lavoro runtime.     | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | Imposta il profilo della policy di approvazione.          | `/acp permissions strict`                                     |
| `/acp timeout`       | Imposta il timeout runtime (secondi).                     | `/acp timeout 120`                                            |
| `/acp model`         | Imposta l'override del modello runtime.                   | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | Rimuove gli override delle opzioni runtime della sessione. | `/acp reset-options`                                          |
| `/acp sessions`      | Elenca le sessioni ACP recenti dallo store.               | `/acp sessions`                                               |
| `/acp doctor`        | Salute del backend, capability, correzioni attuabili.     | `/acp doctor`                                                 |
| `/acp install`       | Stampa i passaggi deterministici di installazione e abilitazione. | `/acp install`                                                |

`/acp status` mostra le opzioni runtime effettive più gli identificatori di sessione a livello runtime e
a livello backend. Gli errori di controllo non supportato emergono
chiaramente quando un backend non dispone di una capability. `/acp sessions` legge lo
store per la sessione attualmente associata o del richiedente; i token di destinazione
(`session-key`, `session-id` o `session-label`) vengono risolti tramite la
scoperta delle sessioni del Gateway, incluse le root `session.store`
personalizzate per agent.

### Mappatura delle opzioni runtime

`/acp` include comandi di praticità e un setter generico. Operazioni
equivalenti:

| Comando                      | Mappa a                              | Note                                                                                                                                                                          |
| ---------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `/acp model <id>`            | chiave di configurazione runtime `model` | Per Codex ACP, OpenClaw normalizza `openai-codex/<model>` nell'id modello dell'adapter e mappa i suffissi di ragionamento con slash, come `openai-codex/gpt-5.4/high`, a `reasoning_effort`. |
| `/acp set thinking <level>`  | chiave di configurazione runtime `thinking` | Per Codex ACP, OpenClaw invia il `reasoning_effort` corrispondente quando l'adapter ne supporta uno.                                                                             |
| `/acp permissions <profile>` | chiave di configurazione runtime `approval_policy` | —                                                                                                                                                                              |
| `/acp timeout <seconds>`     | chiave di configurazione runtime `timeout` | —                                                                                                                                                                              |
| `/acp cwd <path>`            | override cwd runtime                 | Aggiornamento diretto.                                                                                                                                                         |
| `/acp set <key> <value>`     | generico                             | `key=cwd` usa il percorso di override cwd.                                                                                                                                     |
| `/acp reset-options`         | cancella tutti gli override runtime  | —                                                                                                                                                                              |

## Harness acpx, configurazione del Plugin e permessi

Per la configurazione dell'harness acpx (alias Claude Code / Codex / Gemini CLI
), i bridge MCP plugin-tools e OpenClaw-tools e le
modalità dei permessi ACP, consulta
[agent ACP — configurazione](/it/tools/acp-agents-setup).

## Risoluzione dei problemi

| Sintomo                                                                     | Causa probabile                                                                                                           | Correzione                                                                                                                                                                      |
| --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ACP runtime backend is not configured`                                     | Plugin di backend mancante, disabilitato o bloccato da `plugins.allow`.                                                       | Installa e abilita il Plugin di backend, includi `acpx` in `plugins.allow` quando quella allowlist è impostata, quindi esegui `/acp doctor`.                                                 |
| `ACP is disabled by policy (acp.enabled=false)`                             | ACP disabilitato globalmente.                                                                                                 | Imposta `acp.enabled=true`.                                                                                                                                                  |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`           | Dispatch automatico dai normali messaggi del thread disabilitato.                                                               | Imposta `acp.dispatch.enabled=true` per riprendere l'instradamento automatico dei thread; le chiamate esplicite a `sessions_spawn({ runtime: "acp" })` continuano a funzionare.                                      |
| `ACP agent "<id>" is not allowed by policy`                                 | Agente non presente nell'allowlist.                                                                                                | Usa un `agentId` consentito o aggiorna `acp.allowedAgents`.                                                                                                                     |
| `/acp doctor` reports backend not ready right after startup                 | Plugin di backend mancante, disabilitato, bloccato da policy allow/deny oppure l'eseguibile configurato non è disponibile.        | Installa/abilita il Plugin di backend, riesegui `/acp doctor` e ispeziona l'errore di installazione o di policy del backend se resta non integro.                                           |
| Harness command not found                                                   | La CLI dell'adapter non è installata, il Plugin esterno è mancante oppure il fetch `npx` al primo avvio è fallito per un adapter non Codex. | Esegui `/acp doctor`, installa/pre-riscalda l'adapter sull'host Gateway oppure configura esplicitamente il comando dell'agente acpx.                                                      |
| Model-not-found from the harness                                            | L'ID del modello è valido per un altro provider/harness ma non per questa destinazione ACP.                                                | Usa un modello elencato da quell'harness, configura il modello nell'harness oppure ometti l'override.                                                                            |
| Vendor auth error from the harness                                          | OpenClaw è integro, ma la CLI/il provider di destinazione non ha effettuato l'accesso.                                                     | Effettua l'accesso o fornisci la chiave provider richiesta nell'ambiente dell'host Gateway.                                                                                             |
| `Unable to resolve session target: ...`                                     | Token di chiave/ID/etichetta non valido.                                                                                                | Esegui `/acp sessions`, copia la chiave/etichetta esatta e riprova.                                                                                                                        |
| `--bind here requires running /acp spawn inside an active ... conversation` | `--bind here` usato senza una conversazione collegabile attiva.                                                            | Spostati nella chat/canale di destinazione e riprova, oppure usa uno spawn non associato.                                                                                                         |
| `Conversation bindings are unavailable for <channel>.`                      | L'adapter non dispone della capacità di binding ACP della conversazione corrente.                                                             | Usa `/acp spawn ... --thread ...` dove supportato, configura `bindings[]` di primo livello oppure spostati in un canale supportato.                                                     |
| `--thread here requires running /acp spawn inside an active ... thread`     | `--thread here` usato fuori da un contesto di thread.                                                                         | Spostati nel thread di destinazione oppure usa `--thread auto`/`off`.                                                                                                                      |
| `Only <user-id> can rebind this channel/conversation/thread.`               | Un altro utente possiede la destinazione di binding attiva.                                                                           | Riesegui il binding come proprietario oppure usa una conversazione o un thread diverso.                                                                                                               |
| `Thread bindings are unavailable for <channel>.`                            | L'adapter non dispone della capacità di binding del thread.                                                                               | Usa `--thread off` oppure spostati in un adapter/canale supportato.                                                                                                                 |
| `Sandboxed sessions cannot spawn ACP sessions ...`                          | Il runtime ACP è lato host; la sessione richiedente è in sandbox.                                                              | Usa `runtime="subagent"` dalle sessioni in sandbox oppure esegui lo spawn ACP da una sessione non in sandbox.                                                                         |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`     | `sandbox="require"` richiesto per il runtime ACP.                                                                         | Usa `runtime="subagent"` per il sandboxing obbligatorio oppure usa ACP con `sandbox="inherit"` da una sessione non in sandbox.                                                      |
| `Cannot apply --model ... did not advertise model support`                  | L'harness di destinazione non espone il cambio modello ACP generico.                                                        | Usa un harness che dichiara ACP `models`/`session/set_model`, usa i riferimenti modello ACP di Codex oppure configura il modello direttamente nell'harness se ha il proprio flag di avvio. |
| Missing ACP metadata for bound session                                      | Metadati della sessione ACP obsoleti/eliminati.                                                                                    | Ricrea con `/acp spawn`, quindi riesegui il binding/metti a fuoco il thread.                                                                                                                    |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`    | `permissionMode` blocca scritture/exec nella sessione ACP non interattiva.                                                    | Imposta `plugins.entries.acpx.config.permissionMode` su `approve-all` e riavvia il gateway. Vedi [Configurazione delle autorizzazioni](/it/tools/acp-agents-setup#permission-configuration). |
| ACP session fails early with little output                                  | Le richieste di autorizzazione sono bloccate da `permissionMode`/`nonInteractivePermissions`.                                        | Controlla i log del gateway per `AcpRuntimeError`. Per autorizzazioni complete, imposta `permissionMode=approve-all`; per una degradazione graduale, imposta `nonInteractivePermissions=deny`.        |
| ACP session stalls indefinitely after completing work                       | Il processo dell'harness è terminato ma la sessione ACP non ha segnalato il completamento.                                                    | Monitora con `ps aux \| grep acpx`; termina manualmente i processi obsoleti.                                                                                                       |
| Harness sees `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>`                        | La busta dell'evento interno è trapelata oltre il confine ACP.                                                                | Aggiorna OpenClaw e riesegui il flusso di completamento; gli harness esterni dovrebbero ricevere solo prompt di completamento semplici.                                                          |

## Correlati

- [Agenti ACP — configurazione](/it/tools/acp-agents-setup)
- [Invio agente](/it/tools/agent-send)
- [Backend CLI](/it/gateway/cli-backends)
- [Harness Codex](/it/plugins/codex-harness)
- [Strumenti sandbox multi-agente](/it/tools/multi-agent-sandbox-tools)
- [`openclaw acp` (modalità bridge)](/it/cli/acp)
- [Sub-agenti](/it/tools/subagents)
