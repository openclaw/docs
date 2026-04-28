---
read_when:
    - Esecuzione degli harness di coding tramite ACP
    - Configurazione di sessioni ACP associate alla conversazione sui canali di messaggistica
    - Associazione di una conversazione su un canale di messaggistica a una sessione ACP persistente
    - Risoluzione dei problemi del backend ACP, del collegamento del Plugin o della consegna dei completamenti
    - Uso dei comandi /acp dalla chat
sidebarTitle: ACP agents
summary: Esegui harness di coding esterni (Claude Code, Cursor, Gemini CLI, Codex ACP esplicito, OpenClaw ACP, OpenCode) tramite il backend ACP
title: Agenti ACP
x-i18n:
    generated_at: "2026-04-26T11:38:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: e3b8550be4cf0da2593b0770e302833e1722820d3c922e5508a253685cd0cb6b
    source_path: tools/acp-agents.md
    workflow: 15
---

Le sessioni [Agent Client Protocol (ACP)](https://agentclientprotocol.com/)
consentono a OpenClaw di eseguire harness di coding esterni (per esempio Pi, Claude Code,
Cursor, Copilot, Droid, OpenClaw ACP, OpenCode, Gemini CLI e altri
harness ACPX supportati) tramite un Plugin backend ACP.

Ogni avvio di sessione ACP viene tracciato come [task in background](/it/automation/tasks).

<Note>
**ACP è il percorso per harness esterni, non il percorso Codex predefinito.** Il
Plugin nativo app-server di Codex gestisce i controlli `/codex ...` e il
runtime incorporato `agentRuntime.id: "codex"`; ACP gestisce
i controlli `/acp ...` e le sessioni `sessions_spawn({ runtime: "acp" })`.

Se vuoi che Codex o Claude Code si connettano come client MCP esterni
direttamente a conversazioni di canale OpenClaw esistenti, usa
[`openclaw mcp serve`](/it/cli/mcp) invece di ACP.
</Note>

## Quale pagina mi serve?

| Vuoi…                                                                                         | Usa questo                            | Note                                                                                                                                                                                          |
| --------------------------------------------------------------------------------------------- | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Associare o controllare Codex nella conversazione corrente                                    | `/codex bind`, `/codex threads`       | Percorso nativo app-server di Codex quando il Plugin `codex` è abilitato; include risposte chat associate, inoltro immagini, model/fast/permissions, controlli di stop e steer. ACP è un fallback esplicito |
| Eseguire Claude Code, Gemini CLI, Codex ACP esplicito o un altro harness esterno _tramite_ OpenClaw | Questa pagina                         | Sessioni associate alla chat, `/acp spawn`, `sessions_spawn({ runtime: "acp" })`, task in background, controlli di runtime                                                                  |
| Esporre una sessione Gateway OpenClaw _come_ server ACP per un editor o client               | [`openclaw acp`](/it/cli/acp)            | Modalità bridge. L'IDE/client comunica via ACP con OpenClaw tramite stdio/WebSocket                                                                                                         |
| Riutilizzare una CLI AI locale come modello di fallback solo testuale                         | [Backend CLI](/it/gateway/cli-backends)  | Non ACP. Nessuno strumento OpenClaw, nessun controllo ACP, nessun runtime harness                                                                                                           |

## Funziona subito?

Di solito sì. Le installazioni nuove includono il Plugin runtime `acpx`
integrato abilitato per impostazione predefinita con un binario `acpx`
bloccato a livello di Plugin locale che OpenClaw verifica
e autoripara all'avvio. Esegui `/acp doctor` per un controllo di disponibilità.

OpenClaw insegna agli agenti la creazione di sessioni ACP solo quando ACP è **davvero
utilizzabile**: ACP deve essere abilitato, il dispatch non deve essere disabilitato, la
sessione corrente non deve essere bloccata dalla sandbox e deve essere
caricato un backend runtime. Se queste condizioni non sono soddisfatte, le Skills del Plugin ACP e
la guida ACP di `sessions_spawn` restano nascoste così l'agente non suggerisce
un backend non disponibile.

<AccordionGroup>
  <Accordion title="Problemi comuni alla prima esecuzione">
    - Se `plugins.allow` è impostato, è un inventario restrittivo dei Plugin e **deve** includere `acpx`; altrimenti il valore predefinito integrato viene intenzionalmente bloccato e `/acp doctor` segnala la voce allowlist mancante.
    - Gli adattatori del harness di destinazione (Codex, Claude, ecc.) possono essere recuperati on demand con `npx` la prima volta che li usi.
    - L'autenticazione del vendor deve comunque esistere sull'host per quel harness.
    - Se l'host non ha npm o accesso di rete, i recuperi iniziali dell'adattatore falliscono finché le cache non vengono preriscaldate o l'adattatore non viene installato in un altro modo.

  </Accordion>
  <Accordion title="Prerequisiti di runtime">
    ACP avvia un vero processo di harness esterno. OpenClaw gestisce il routing,
    lo stato dei task in background, la consegna, le associazioni e i criteri; il harness
    gestisce il proprio login al provider, il catalogo dei modelli, il comportamento del filesystem e
    gli strumenti nativi.

    Prima di attribuire il problema a OpenClaw, verifica:

    - `/acp doctor` segnala un backend abilitato e integro.
    - L'id di destinazione è consentito da `acp.allowedAgents` quando quella allowlist è impostata.
    - Il comando del harness può avviarsi sull'host Gateway.
    - L'autenticazione del provider è presente per quel harness (`claude`, `codex`, `gemini`, `opencode`, `droid`, ecc.).
    - Il modello selezionato esiste per quel harness — gli id dei modelli non sono portabili tra harness diversi.
    - Il `cwd` richiesto esiste ed è accessibile, oppure ometti `cwd` e lascia che il backend usi il proprio valore predefinito.
    - La modalità di autorizzazione corrisponde al lavoro. Le sessioni non interattive non possono fare clic sui prompt di autorizzazione nativi, quindi le esecuzioni di coding con molte scritture/esecuzioni di solito richiedono un profilo di autorizzazione ACPX che possa procedere senza interazione.

  </Accordion>
</AccordionGroup>

Gli strumenti dei Plugin OpenClaw e gli strumenti OpenClaw integrati **non** vengono esposti ai
harness ACP per impostazione predefinita. Abilita i bridge MCP espliciti in
[Agenti ACP — configurazione](/it/tools/acp-agents-setup) solo quando il harness
deve chiamare direttamente quegli strumenti.

## Destinazioni harness supportate

Con il backend `acpx` integrato, usa questi id harness come destinazioni per `/acp spawn <id>`
o `sessions_spawn({ runtime: "acp", agentId: "<id>" })`:

| Id harness | Backend tipico                                 | Note                                                                                 |
| ---------- | ---------------------------------------------- | ------------------------------------------------------------------------------------ |
| `claude`   | Adattatore ACP Claude Code                     | Richiede autenticazione Claude Code sull'host.                                       |
| `codex`    | Adattatore ACP Codex                           | Fallback ACP esplicito solo quando il percorso nativo `/codex` non è disponibile o ACP è richiesto. |
| `copilot`  | Adattatore ACP GitHub Copilot                  | Richiede autenticazione CLI/runtime Copilot.                                         |
| `cursor`   | Cursor CLI ACP (`cursor-agent acp`)            | Sostituisci il comando acpx se un'installazione locale espone un entrypoint ACP diverso. |
| `droid`    | CLI Factory Droid                              | Richiede autenticazione Factory/Droid o `FACTORY_API_KEY` nell'ambiente del harness. |
| `gemini`   | Adattatore ACP Gemini CLI                      | Richiede autenticazione Gemini CLI o configurazione della chiave API.                |
| `iflow`    | iFlow CLI                                      | La disponibilità dell'adattatore e il controllo del modello dipendono dalla CLI installata. |
| `kilocode` | Kilo Code CLI                                  | La disponibilità dell'adattatore e il controllo del modello dipendono dalla CLI installata. |
| `kimi`     | CLI Kimi/Moonshot                              | Richiede autenticazione Kimi/Moonshot sull'host.                                     |
| `kiro`     | Kiro CLI                                       | La disponibilità dell'adattatore e il controllo del modello dipendono dalla CLI installata. |
| `opencode` | Adattatore ACP OpenCode                        | Richiede autenticazione CLI/provider OpenCode.                                       |
| `openclaw` | Bridge Gateway OpenClaw tramite `openclaw acp` | Consente a un harness compatibile con ACP di comunicare con una sessione Gateway OpenClaw. |
| `pi`       | Pi/runtime OpenClaw incorporato                | Usato per esperimenti di harness nativi OpenClaw.                                    |
| `qwen`     | Qwen Code / Qwen CLI                           | Richiede autenticazione compatibile con Qwen sull'host.                              |

Alias personalizzati degli agenti acpx possono essere configurati in acpx stesso, ma i
criteri di OpenClaw continuano a controllare `acp.allowedAgents` e qualsiasi
mapping `agents.list[].runtime.acp.agent` prima del dispatch.

## Runbook per operatori

Flusso rapido `/acp` dalla chat:

<Steps>
  <Step title="Avvia">
    `/acp spawn claude --bind here`,
    `/acp spawn gemini --mode persistent --thread auto`, oppure esplicitamente
    `/acp spawn codex --bind here`.
  </Step>
  <Step title="Lavora">
    Continua nella conversazione o nel thread associato (oppure indirizza
    esplicitamente la chiave della sessione).
  </Step>
  <Step title="Controlla lo stato">
    `/acp status`
  </Step>
  <Step title="Regola">
    `/acp model <provider/model>`,
    `/acp permissions <profile>`,
    `/acp timeout <seconds>`.
  </Step>
  <Step title="Dirigi">
    Senza sostituire il contesto: `/acp steer tighten logging and continue`.
  </Step>
  <Step title="Arresta">
    `/acp cancel` (turno corrente) oppure `/acp close` (sessione + associazioni).
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Dettagli del ciclo di vita">
    - L'avvio crea o riprende una sessione di runtime ACP, registra i metadati ACP nell'archivio sessioni OpenClaw e può creare un task in background quando l'esecuzione è posseduta dal parent.
    - I messaggi di follow-up associati vanno direttamente alla sessione ACP finché l'associazione non viene chiusa, messa fuori fuoco, reimpostata o scade.
    - I comandi Gateway restano locali. `/acp ...`, `/status` e `/unfocus` non vengono mai inviati come normale testo di prompt a un harness ACP associato.
    - `cancel` interrompe il turno attivo quando il backend supporta la cancellazione; non elimina l'associazione né i metadati della sessione.
    - `close` termina la sessione ACP dal punto di vista di OpenClaw e rimuove l'associazione. Un harness può comunque mantenere il proprio storico upstream se supporta la ripresa.
    - I worker runtime inattivi possono essere rimossi dopo `acp.runtime.ttlMinutes`; i metadati di sessione archiviati restano disponibili per `/acp sessions`.

  </Accordion>
  <Accordion title="Regole di routing native di Codex">
    Trigger in linguaggio naturale che dovrebbero essere instradati al **Plugin Codex nativo**
    quando è abilitato:

    - "Bind this Discord channel to Codex."
    - "Attach this chat to Codex thread `<id>`."
    - "Show Codex threads, then bind this one."

    L'associazione nativa della conversazione a Codex è il percorso di controllo chat predefinito.
    Gli strumenti dinamici di OpenClaw continuano a essere eseguiti tramite OpenClaw, mentre
    gli strumenti nativi di Codex come shell/apply-patch vengono eseguiti dentro Codex.
    Per gli eventi degli strumenti nativi di Codex, OpenClaw inietta un relay di hook nativo
    per turno così gli hook dei Plugin possono bloccare `before_tool_call`, osservare
    `after_tool_call` e instradare gli eventi Codex `PermissionRequest`
    tramite le approvazioni OpenClaw. Gli hook Codex `Stop` vengono inoltrati a
    OpenClaw `before_agent_finalize`, dove i Plugin possono richiedere un ulteriore
    passaggio del modello prima che Codex finalizzi la sua risposta. Il relay resta
    volutamente prudente: non modifica gli argomenti degli strumenti nativi di Codex
    né riscrive i record dei thread Codex. Usa ACP esplicito solo
    quando vuoi il modello di runtime/sessione ACP. Il confine di supporto Codex incorporato
    è documentato nel
    [contratto di supporto Codex harness v1](/it/plugins/codex-harness#v1-support-contract).

  </Accordion>
  <Accordion title="Promemoria rapido per selezione di modello / provider / runtime">
    - `openai-codex/*` — percorso OAuth/abbonamento PI Codex.
    - `openai/*` più `agentRuntime.id: "codex"` — runtime incorporato nativo app-server di Codex.
    - `/codex ...` — controllo nativo della conversazione Codex.
    - `/acp ...` oppure `runtime: "acp"` — controllo ACP/acpx esplicito.

  </Accordion>
  <Accordion title="Trigger in linguaggio naturale per il routing ACP">
    Trigger che dovrebbero essere instradati al runtime ACP:

    - "Run this as a one-shot Claude Code ACP session and summarize the result."
    - "Use Gemini CLI for this task in a thread, then keep follow-ups in that same thread."
    - "Run Codex through ACP in a background thread."

    OpenClaw seleziona `runtime: "acp"`, risolve l'`agentId` del harness,
    si associa alla conversazione o al thread corrente quando supportato e
    instrada i messaggi successivi a quella sessione fino a chiusura/scadenza. Codex segue questo
    percorso solo quando ACP/acpx è esplicito o il Plugin Codex nativo
    non è disponibile per l'operazione richiesta.

    Per `sessions_spawn`, `runtime: "acp"` viene pubblicizzato solo quando ACP
    è abilitato, il richiedente non è in sandbox e un backend runtime ACP
    è caricato. È destinato a id harness ACP come `codex`,
    `claude`, `droid`, `gemini` o `opencode`. Non passare un normale
    id agente di configurazione OpenClaw da `agents_list` a meno che quella voce non sia
    esplicitamente configurata con `agents.list[].runtime.type="acp"`;
    altrimenti usa il runtime sub-agent predefinito. Quando un agente OpenClaw
    è configurato con `runtime.type="acp"`, OpenClaw usa
    `runtime.acp.agent` come id harness sottostante.

  </Accordion>
</AccordionGroup>

## ACP rispetto ai sub-agent

Usa ACP quando vuoi un runtime di harness esterno. Usa il **Codex
app-server nativo** per l'associazione/controllo della conversazione Codex quando il Plugin `codex`
è abilitato. Usa i **sub-agent** quando vuoi esecuzioni delegate
native OpenClaw.

| Area          | Sessione ACP                           | Esecuzione sub-agent                |
| ------------- | -------------------------------------- | ----------------------------------- |
| Runtime       | Plugin backend ACP (per esempio acpx)  | Runtime sub-agent nativo OpenClaw   |
| Chiave sessione | `agent:<agentId>:acp:<uuid>`         | `agent:<agentId>:subagent:<uuid>`   |
| Comandi principali | `/acp ...`                       | `/subagents ...`                    |
| Strumento di avvio | `sessions_spawn` con `runtime:"acp"` | `sessions_spawn` (runtime predefinito) |

Vedi anche [Sub-agent](/it/tools/subagents).

## Come ACP esegue Claude Code

Per Claude Code tramite ACP, lo stack è:

1. Piano di controllo della sessione ACP OpenClaw.
2. Plugin runtime `acpx` integrato.
3. Adattatore ACP Claude.
4. Meccanismo di runtime/sessione lato Claude.

ACP Claude è una **sessione di harness** con controlli ACP, ripresa della sessione,
tracciamento dei task in background e associazione opzionale a conversazione/thread.

I backend CLI sono runtime locali separati di fallback solo testuale — vedi
[Backend CLI](/it/gateway/cli-backends).

Per gli operatori, la regola pratica è:

- **Vuoi `/acp spawn`, sessioni associabili, controlli di runtime o lavoro persistente del harness?** Usa ACP.
- **Vuoi un semplice fallback testuale locale tramite la CLI grezza?** Usa i backend CLI.

## Sessioni associate

### Modello mentale

- **Superficie chat** — dove le persone continuano a parlare (canale Discord, topic Telegram, chat iMessage).
- **Sessione ACP** — lo stato runtime durevole di Codex/Claude/Gemini verso cui OpenClaw instrada.
- **Thread/topic figlio** — una superficie di messaggistica aggiuntiva opzionale creata solo da `--thread ...`.
- **Workspace di runtime** — la posizione del filesystem (`cwd`, checkout del repo, workspace backend) dove viene eseguito il harness. Indipendente dalla superficie chat.

### Associazioni alla conversazione corrente

`/acp spawn <harness> --bind here` fissa la conversazione corrente alla
sessione ACP avviata — nessun thread figlio, stessa superficie chat. OpenClaw continua a
gestire trasporto, autenticazione, sicurezza e consegna. I messaggi successivi in quella
conversazione vengono instradati alla stessa sessione; `/new` e `/reset` reimpostano la
sessione sul posto; `/acp close` rimuove l'associazione.

Esempi:

```text
/codex bind                                              # associazione nativa Codex, instrada qui i messaggi futuri
/codex model gpt-5.4                                     # regola il thread Codex nativo associato
/codex stop                                              # controlla il turno Codex nativo attivo
/acp spawn codex --bind here                             # fallback ACP esplicito per Codex
/acp spawn codex --thread auto                           # può creare un thread/topic figlio e associarlo lì
/acp spawn codex --bind here --cwd /workspace/repo       # stessa associazione chat, Codex viene eseguito in /workspace/repo
```

<AccordionGroup>
  <Accordion title="Regole di associazione ed esclusività">
    - `--bind here` e `--thread ...` si escludono a vicenda.
    - `--bind here` funziona solo sui canali che pubblicizzano l'associazione alla conversazione corrente; altrimenti OpenClaw restituisce un chiaro messaggio di mancato supporto. Le associazioni persistono attraverso i riavvii del gateway.
    - Su Discord, `spawnAcpSessions` è richiesto solo quando OpenClaw deve creare un thread figlio per `--thread auto|here` — non per `--bind here`.
    - Se avvii verso un agente ACP diverso senza `--cwd`, OpenClaw eredita per impostazione predefinita il workspace dell'**agente di destinazione**. I percorsi ereditati mancanti (`ENOENT`/`ENOTDIR`) tornano al valore predefinito del backend; altri errori di accesso (ad es. `EACCES`) emergono come errori di avvio.
    - I comandi di gestione Gateway restano locali nelle conversazioni associate — i comandi `/acp ...` sono gestiti da OpenClaw anche quando il normale testo di follow-up viene instradato alla sessione ACP associata; anche `/status` e `/unfocus` restano locali ogni volta che la gestione dei comandi è abilitata per quella superficie.

  </Accordion>
  <Accordion title="Sessioni associate a thread">
    Quando le associazioni a thread sono abilitate per un adapter di canale:

    - OpenClaw associa un thread a una sessione ACP di destinazione.
    - I messaggi successivi in quel thread vengono instradati alla sessione ACP associata.
    - L'output ACP viene consegnato di nuovo allo stesso thread.
    - La perdita di focus/chiusura/archiviazione/scadenza per timeout di inattività o età massima rimuove l'associazione.
    - `/acp close`, `/acp cancel`, `/acp status`, `/status` e `/unfocus` sono comandi Gateway, non prompt per il harness ACP.

    Flag di funzionalità richiesti per ACP associato a thread:

    - `acp.enabled=true`
    - `acp.dispatch.enabled` è attivo per impostazione predefinita (imposta `false` per sospendere il dispatch ACP).
    - Flag di avvio thread ACP dell'adapter di canale abilitato (specifico dell'adapter):
      - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`

    Il supporto per l'associazione a thread è specifico dell'adapter. Se l'adapter del canale
    attivo non supporta le associazioni a thread, OpenClaw restituisce un chiaro
    messaggio di mancato supporto/non disponibilità.

  </Accordion>
  <Accordion title="Canali che supportano i thread">
    - Qualsiasi adapter di canale che espone capacità di associazione sessione/thread.
    - Supporto integrato attuale: thread/canali **Discord**, topic **Telegram** (topic forum in gruppi/supergruppi e topic nei DM).
    - I canali Plugin possono aggiungere supporto tramite la stessa interfaccia di associazione.

  </Accordion>
</AccordionGroup>

## Associazioni persistenti di canale

Per flussi di lavoro non effimeri, configura associazioni ACP persistenti nelle
voci di primo livello `bindings[]`.

### Modello di associazione

<ParamField path="bindings[].type" type='"acp"'>
  Contrassegna un'associazione persistente di conversazione ACP.
</ParamField>
<ParamField path="bindings[].match" type="object">
  Identifica la conversazione di destinazione. Forme per canale:

- **Canale/thread Discord:** `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
- **Topic forum Telegram:** `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
- **DM/gruppo BlueBubbles:** `match.channel="bluebubbles"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`. Preferisci `chat_id:*` o `chat_identifier:*` per associazioni di gruppo stabili.
- **DM/gruppo iMessage:** `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`. Preferisci `chat_id:*` per associazioni di gruppo stabili.

</ParamField>
<ParamField path="bindings[].agentId" type="string">
  L'id dell'agente OpenClaw proprietario.
</ParamField>
<ParamField path="bindings[].acp.mode" type='"persistent" | "oneshot"'>
  Override ACP facoltativo.
</ParamField>
<ParamField path="bindings[].acp.label" type="string">
  Etichetta facoltativa visibile all'operatore.
</ParamField>
<ParamField path="bindings[].acp.cwd" type="string">
  Directory di lavoro del runtime facoltativa.
</ParamField>
<ParamField path="bindings[].acp.backend" type="string">
  Override backend facoltativo.
</ParamField>

### Valori predefiniti di runtime per agente

Usa `agents.list[].runtime` per definire una sola volta i valori predefiniti ACP per agente:

- `agents.list[].runtime.type="acp"`
- `agents.list[].runtime.acp.agent` (id harness, per esempio `codex` o `claude`)
- `agents.list[].runtime.acp.backend`
- `agents.list[].runtime.acp.mode`
- `agents.list[].runtime.acp.cwd`

**Precedenza degli override per le sessioni ACP associate:**

1. `bindings[].acp.*`
2. `agents.list[].runtime.acp.*`
3. Valori predefiniti ACP globali (ad es. `acp.backend`)

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

- OpenClaw assicura che la sessione ACP configurata esista prima dell'uso.
- I messaggi in quel canale o topic vengono instradati alla sessione ACP configurata.
- Nelle conversazioni associate, `/new` e `/reset` reimpostano sul posto la stessa chiave di sessione ACP.
- Le associazioni runtime temporanee (per esempio create da flussi di thread-focus) continuano ad applicarsi dove presenti.
- Per avvii ACP tra agenti senza `cwd` esplicito, OpenClaw eredita il workspace dell'agente di destinazione dalla configurazione dell'agente.
- I percorsi del workspace ereditato mancanti tornano al `cwd` predefinito del backend; i guasti di accesso su percorsi esistenti emergono come errori di avvio.

## Avvia sessioni ACP

Due modi per avviare una sessione ACP:

<Tabs>
  <Tab title="Da sessions_spawn">
    Usa `runtime: "acp"` per avviare una sessione ACP da un turno agente o
    da una chiamata a uno strumento.

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
    `runtime` usa `subagent` come predefinito, quindi imposta esplicitamente `runtime: "acp"`
    per le sessioni ACP. Se `agentId` viene omesso, OpenClaw usa
    `acp.defaultAgent` quando configurato. `mode: "session"` richiede
    `thread: true` per mantenere una conversazione associata persistente.
    </Note>

  </Tab>
  <Tab title="Dal comando /acp">
    Usa `/acp spawn` per un controllo esplicito da parte dell'operatore dalla chat.

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

    Vedi [Comandi slash](/it/tools/slash-commands).

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
  Id del harness ACP di destinazione. Usa come fallback `acp.defaultAgent` se impostato.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  Richiede il flusso di associazione al thread dove supportato.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  `"run"` è one-shot; `"session"` è persistente. Se `thread: true` e
  `mode` viene omesso, OpenClaw può usare un comportamento persistente predefinito a seconda del
  percorso runtime. `mode: "session"` richiede `thread: true`.
</ParamField>
<ParamField path="cwd" type="string">
  Directory di lavoro runtime richiesta (validata dai criteri del backend/runtime).
  Se omessa, l'avvio ACP eredita il workspace dell'agente di destinazione
  quando configurato; i percorsi ereditati mancanti tornano ai valori predefiniti
  del backend, mentre i veri errori di accesso vengono restituiti.
</ParamField>
<ParamField path="label" type="string">
  Etichetta visibile all'operatore usata nel testo di sessione/banner.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  Riprende una sessione ACP esistente invece di crearne una nuova. L'agente
  riproduce il proprio storico della conversazione tramite `session/load`. Richiede
  `runtime: "acp"`.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  `"parent"` trasmette al volo i riepiloghi di avanzamento dell'esecuzione ACP iniziale alla
  sessione richiedente come eventi di sistema. Le risposte accettate includono
  `streamLogPath`, che punta a un log JSONL con ambito di sessione
  (`<sessionId>.acp-stream.jsonl`) che puoi seguire per l'intero storico del relay.
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  Interrompe il turno figlio ACP dopo N secondi. `0` mantiene il turno nel
  percorso senza timeout del gateway. Lo stesso valore viene applicato sia all'esecuzione Gateway
  sia al runtime ACP così i harness bloccati o senza quota non
  occupano indefinitamente il lane dell'agente parent.
</ParamField>
<ParamField path="model" type="string">
  Override esplicito del modello per la sessione figlia ACP. Gli avvii Codex ACP
  normalizzano i riferimenti Codex OpenClaw come `openai-codex/gpt-5.4` nella configurazione di avvio Codex
  ACP prima di `session/new`; le forme con slash come
  `openai-codex/gpt-5.4/high` impostano anche l'effort di ragionamento di Codex ACP.
  Gli altri harness devono pubblicizzare ACP `models` e supportare
  `session/set_model`; altrimenti OpenClaw/acpx fallisce chiaramente invece di
  ripiegare silenziosamente sul valore predefinito dell'agente di destinazione.
</ParamField>
<ParamField path="thinking" type="string">
  Effort esplicito di thinking/ragionamento. Per Codex ACP, `minimal` corrisponde a
  effort basso, `low`/`medium`/`high`/`xhigh` corrispondono direttamente e `off`
  omette l'override di avvio dell'effort di ragionamento.
</ParamField>

## Modalità bind e thread di avvio

<Tabs>
  <Tab title="--bind here|off">
    | Modalità | Comportamento                                                            |
    | -------- | ------------------------------------------------------------------------ |
    | `here`   | Associa sul posto la conversazione attiva corrente; fallisce se non ce n'è una attiva. |
    | `off`    | Non crea un'associazione alla conversazione corrente.                    |

    Note:

    - `--bind here` è il percorso operativo più semplice per "rendere questo canale o chat supportato da Codex."
    - `--bind here` non crea un thread figlio.
    - `--bind here` è disponibile solo sui canali che espongono il supporto per l'associazione alla conversazione corrente.
    - `--bind` e `--thread` non possono essere combinati nella stessa chiamata `/acp spawn`.

  </Tab>
  <Tab title="--thread auto|here|off">
    | Modalità | Comportamento                                                                                            |
    | -------- | -------------------------------------------------------------------------------------------------------- |
    | `auto`   | In un thread attivo: associa quel thread. Fuori da un thread: crea/associa un thread figlio quando supportato. |
    | `here`   | Richiede il thread attivo corrente; fallisce se non ti trovi in uno.                                     |
    | `off`    | Nessuna associazione. La sessione si avvia non associata.                                                |

    Note:

    - Sulle superfici senza associazione a thread, il comportamento predefinito è di fatto `off`.
    - L'avvio con associazione a thread richiede il supporto dei criteri del canale:
      - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`
    - Usa `--bind here` quando vuoi fissare la conversazione corrente senza creare un thread figlio.

  </Tab>
</Tabs>

## Modello di consegna

Le sessioni ACP possono essere workspace interattivi o lavoro in background
posseduto dal parent. Il percorso di consegna dipende da quella forma.

<AccordionGroup>
  <Accordion title="Sessioni ACP interattive">
    Le sessioni interattive servono a continuare la conversazione su una superficie chat
    visibile:

    - `/acp spawn ... --bind here` associa la conversazione corrente alla sessione ACP.
    - `/acp spawn ... --thread ...` associa un thread/topic di canale alla sessione ACP.
    - Le `bindings[].type="acp"` persistenti configurate instradano le conversazioni corrispondenti alla stessa sessione ACP.

    I messaggi successivi nella conversazione associata vengono instradati direttamente alla
    sessione ACP e l'output ACP viene consegnato di nuovo a quel medesimo
    canale/thread/topic.

    Cosa OpenClaw invia al harness:

    - I normali follow-up associati vengono inviati come testo di prompt, più allegati solo quando il harness/backend li supporta.
    - I comandi di gestione `/acp` e i comandi Gateway locali vengono intercettati prima del dispatch ACP.
    - Gli eventi di completamento generati dal runtime vengono materializzati per destinazione. Gli agenti OpenClaw ricevono l'envelope interna del contesto runtime di OpenClaw; i harness ACP esterni ricevono un prompt semplice con il risultato figlio e l'istruzione. L'envelope grezza `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>` non deve mai essere inviata a harness esterni né salvata come testo del transcript utente ACP.
    - Le voci del transcript ACP usano il testo del trigger visibile all'utente o il semplice prompt di completamento. I metadati degli eventi interni restano strutturati in OpenClaw dove possibile e non sono trattati come contenuto chat creato dall'utente.

  </Accordion>
  <Accordion title="Sessioni ACP one-shot possedute dal parent">
    Le sessioni ACP one-shot avviate da un'altra esecuzione agente sono figli
    in background, simili ai sub-agent:

    - Il parent richiede lavoro con `sessions_spawn({ runtime: "acp", mode: "run" })`.
    - Il figlio viene eseguito nella propria sessione harness ACP.
    - I turni del figlio vengono eseguiti sullo stesso lane in background usato dagli avvii dei sub-agent nativi, così un harness ACP lento non blocca lavoro non correlato della sessione principale.
    - Il completamento viene riportato tramite il percorso di annuncio di completamento del task. OpenClaw converte i metadati interni di completamento in un semplice prompt ACP prima di inviarli a un harness esterno, così i harness non vedono i marcatori del contesto runtime riservati a OpenClaw.
    - Il parent riscrive il risultato del figlio con una normale voce da assistant quando è utile una risposta visibile all'utente.

    Non **trattare** questo percorso come una chat peer-to-peer tra parent
    e figlio. Il figlio ha già un canale di completamento verso il
    parent.

  </Accordion>
  <Accordion title="Consegna sessions_send e A2A">
    `sessions_send` può avere come destinazione un'altra sessione dopo l'avvio. Per normali
    sessioni peer, OpenClaw usa un percorso di follow-up agent-to-agent (A2A)
    dopo avere iniettato il messaggio:

    - Attende la risposta della sessione di destinazione.
    - Facoltativamente permette a richiedente e destinazione di scambiarsi un numero limitato di turni di follow-up.
    - Chiede alla destinazione di produrre un messaggio di annuncio.
    - Consegna quell'annuncio al canale o thread visibile.

    Questo percorso A2A è un fallback per invii tra peer in cui il mittente ha bisogno di un
    follow-up visibile. Resta abilitato quando una sessione non correlata può
    vedere e inviare messaggi a una destinazione ACP, per esempio con impostazioni ampie di
    `tools.sessions.visibility`.

    OpenClaw salta il follow-up A2A solo quando il richiedente è il
    parent del proprio figlio ACP one-shot posseduto dal parent. In quel caso,
    eseguire A2A sopra il completamento del task può risvegliare il parent con il
    risultato del figlio, inoltrare la risposta del parent di nuovo al figlio e
    creare un loop di eco parent/child. Il risultato di `sessions_send` riporta
    `delivery.status="skipped"` per quel caso di figlio posseduto perché il
    percorso di completamento è già responsabile del risultato.

  </Accordion>
  <Accordion title="Riprendi una sessione esistente">
    Usa `resumeSessionId` per continuare una sessione ACP precedente invece di
    iniziare da zero. L'agente riproduce il proprio storico della conversazione tramite
    `session/load`, così riprende con il contesto completo di ciò che era stato fatto prima.

    ```json
    {
      "task": "Continue where we left off — fix the remaining test failures",
      "runtime": "acp",
      "agentId": "codex",
      "resumeSessionId": "<previous-session-id>"
    }
    ```

    Casi d'uso comuni:

    - Passa una sessione Codex dal laptop al telefono — chiedi al tuo agente di riprendere da dove avevi interrotto.
    - Continua una sessione di coding iniziata in modo interattivo nella CLI, ora in modalità headless tramite il tuo agente.
    - Riprendi un lavoro interrotto da un riavvio del gateway o da un timeout per inattività.

    Note:

    - `resumeSessionId` richiede `runtime: "acp"` — restituisce un errore se usato con il runtime sub-agent.
    - `resumeSessionId` ripristina lo storico della conversazione ACP upstream; `thread` e `mode` continuano comunque ad applicarsi normalmente alla nuova sessione OpenClaw che stai creando, quindi `mode: "session"` richiede ancora `thread: true`.
    - L'agente di destinazione deve supportare `session/load` (Codex e Claude Code lo supportano).
    - Se l'id sessione non viene trovato, l'avvio fallisce con un errore chiaro — nessun fallback silenzioso a una nuova sessione.

  </Accordion>
  <Accordion title="Smoke test dopo il deploy">
    Dopo un deploy del gateway, esegui un controllo live end-to-end invece di
    fidarti dei test unitari:

    1. Verifica la versione e il commit del gateway distribuito sull'host di destinazione.
    2. Apri una sessione bridge ACPX temporanea verso un agente live.
    3. Chiedi a quell'agente di chiamare `sessions_spawn` con `runtime: "acp"`, `agentId: "codex"`, `mode: "run"` e task `Reply with exactly LIVE-ACP-SPAWN-OK`.
    4. Verifica `accepted=yes`, un vero `childSessionKey` e nessun errore di validazione.
    5. Pulisci la sessione bridge temporanea.

    Mantieni il gate su `mode: "run"` e salta `streamTo: "parent"` —
    il percorso `mode: "session"` associato a thread e i percorsi di stream-relay sono passaggi di integrazione separati e più ricchi.

  </Accordion>
</AccordionGroup>

## Compatibilità con la sandbox

Le sessioni ACP al momento vengono eseguite sul runtime host, **non** all'interno della
sandbox OpenClaw.

<Warning>
**Confine di sicurezza:**

- Il harness esterno può leggere/scrivere secondo le proprie autorizzazioni CLI e il `cwd` selezionato.
- I criteri di sandbox di OpenClaw **non** avvolgono l'esecuzione dei harness ACP.
- OpenClaw continua comunque a far rispettare feature gate ACP, agenti consentiti, proprietà della sessione, associazioni di canale e criteri di consegna Gateway.
- Usa `runtime: "subagent"` per lavoro nativo OpenClaw con applicazione della sandbox.

</Warning>

Limitazioni attuali:

- Se la sessione richiedente è in sandbox, gli avvii ACP sono bloccati sia per `sessions_spawn({ runtime: "acp" })` sia per `/acp spawn`.
- `sessions_spawn` con `runtime: "acp"` non supporta `sandbox: "require"`.

## Risoluzione della destinazione della sessione

La maggior parte delle azioni `/acp` accetta una destinazione di sessione facoltativa (`session-key`,
`session-id` o `session-label`).

**Ordine di risoluzione:**

1. Argomento di destinazione esplicito (oppure `--session` per `/acp steer`)
   - prova prima la chiave
   - poi l'id sessione con forma UUID
   - poi l'etichetta
2. Associazione del thread corrente (se questa conversazione/thread è associata a una sessione ACP).
3. Fallback alla sessione del richiedente corrente.

Le associazioni alla conversazione corrente e le associazioni a thread partecipano entrambe al
passaggio 2.

Se non viene risolta alcuna destinazione, OpenClaw restituisce un errore chiaro
(`Unable to resolve session target: ...`).

## Controlli ACP

| Comando              | Cosa fa                                                    | Esempio                                                       |
| -------------------- | ---------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | Crea una sessione ACP; associazione corrente o a thread facoltativa. | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | Annulla il turno in corso per la sessione di destinazione. | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | Invia un'istruzione di steer alla sessione in esecuzione.  | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | Chiude la sessione e annulla l'associazione dei target thread. | `/acp close`                                                  |
| `/acp status`        | Mostra backend, modalità, stato, opzioni di runtime, funzionalità. | `/acp status`                                                 |
| `/acp set-mode`      | Imposta la modalità di runtime per la sessione di destinazione. | `/acp set-mode plan`                                          |
| `/acp set`           | Scrittura generica di un'opzione di configurazione runtime. | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | Imposta l'override della directory di lavoro del runtime.  | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | Imposta il profilo dei criteri di approvazione.            | `/acp permissions strict`                                     |
| `/acp timeout`       | Imposta il timeout di runtime (secondi).                   | `/acp timeout 120`                                            |
| `/acp model`         | Imposta l'override del modello di runtime.                 | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | Rimuove gli override delle opzioni di runtime della sessione. | `/acp reset-options`                                          |
| `/acp sessions`      | Elenca le sessioni ACP recenti dallo store.                | `/acp sessions`                                               |
| `/acp doctor`        | Integrità backend, funzionalità, correzioni praticabili.   | `/acp doctor`                                                 |
| `/acp install`       | Stampa passaggi deterministici di installazione e abilitazione. | `/acp install`                                                |

`/acp status` mostra le opzioni di runtime effettive più gli identificatori di sessione
a livello di runtime e backend. Gli errori di controllo non supportato emergono
chiaramente quando un backend non ha una funzionalità. `/acp sessions` legge lo
store per la sessione corrente associata o del richiedente; i token di destinazione
(`session-key`, `session-id` o `session-label`) vengono risolti tramite
la discovery della sessione gateway, incluse radici `session.store` personalizzate per agente.

### Mappatura delle opzioni di runtime

`/acp` ha comandi pratici e un setter generico. Operazioni
equivalenti:

| Comando                      | Mappa a                              | Note                                                                                                                                                                           |
| ---------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `/acp model <id>`            | chiave config runtime `model`        | Per Codex ACP, OpenClaw normalizza `openai-codex/<model>` nell'id modello dell'adattatore e mappa i suffissi di ragionamento con slash come `openai-codex/gpt-5.4/high` a `reasoning_effort`. |
| `/acp set thinking <level>`  | chiave config runtime `thinking`     | Per Codex ACP, OpenClaw invia il corrispondente `reasoning_effort` dove l'adattatore ne supporta uno.                                                                        |
| `/acp permissions <profile>` | chiave config runtime `approval_policy` | —                                                                                                                                                                            |
| `/acp timeout <seconds>`     | chiave config runtime `timeout`      | —                                                                                                                                                                              |
| `/acp cwd <path>`            | override cwd runtime                 | Aggiornamento diretto.                                                                                                                                                         |
| `/acp set <key> <value>`     | generico                             | `key=cwd` usa il percorso di override cwd.                                                                                                                                     |
| `/acp reset-options`         | cancella tutti gli override runtime  | —                                                                                                                                                                              |

## Harness acpx, configurazione del Plugin e autorizzazioni

Per la configurazione del harness acpx (alias Claude Code / Codex / Gemini CLI),
i bridge MCP plugin-tools e OpenClaw-tools e le
modalità di autorizzazione ACP, vedi
[Agenti ACP — configurazione](/it/tools/acp-agents-setup).

## Risoluzione dei problemi

| Sintomo                                                                     | Causa probabile                                                                 | Correzione                                                                                                                                                                 |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ACP runtime backend is not configured`                                     | Plugin backend mancante, disabilitato o bloccato da `plugins.allow`.           | Installa e abilita il Plugin backend, includi `acpx` in `plugins.allow` quando quella allowlist è impostata, poi esegui `/acp doctor`.                                   |
| `ACP is disabled by policy (acp.enabled=false)`                             | ACP disabilitato globalmente.                                                   | Imposta `acp.enabled=true`.                                                                                                                                                |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`           | Il dispatch dai normali messaggi del thread è disabilitato.                    | Imposta `acp.dispatch.enabled=true`.                                                                                                                                       |
| `ACP agent "<id>" is not allowed by policy`                                 | Agente non presente nella allowlist.                                            | Usa un `agentId` consentito oppure aggiorna `acp.allowedAgents`.                                                                                                           |
| `/acp doctor` reports backend not ready right after startup                 | La verifica delle dipendenze del Plugin o l'autoriparazione è ancora in corso. | Attendi brevemente ed esegui di nuovo `/acp doctor`; se resta non integro, ispeziona l'errore di installazione del backend e i criteri allow/deny del Plugin.            |
| Harness command not found                                                   | La CLI dell'adattatore non è installata oppure il recupero iniziale con `npx` è fallito. | Installa/preriscalda l'adattatore sull'host Gateway, oppure configura esplicitamente il comando dell'agente acpx.                                                         |
| Model-not-found from the harness                                            | L'id del modello è valido per un altro provider/harness ma non per questa destinazione ACP. | Usa un modello elencato da quel harness, configura il modello nel harness oppure ometti l'override.                                                                       |
| Vendor auth error from the harness                                          | OpenClaw è integro, ma la CLI/il provider di destinazione non ha effettuato l'accesso. | Accedi oppure fornisci la chiave provider richiesta nell'ambiente dell'host Gateway.                                                                                       |
| `Unable to resolve session target: ...`                                     | Token key/id/label non valido.                                                  | Esegui `/acp sessions`, copia la key/label esatta e riprova.                                                                                                               |
| `--bind here requires running /acp spawn inside an active ... conversation` | `--bind here` usato senza una conversazione attiva associabile.                | Spostati nella chat/canale di destinazione e riprova, oppure usa un avvio non associato.                                                                                  |
| `Conversation bindings are unavailable for <channel>.`                      | L'adapter non ha la capacità ACP di associazione alla conversazione corrente.  | Usa `/acp spawn ... --thread ...` dove supportato, configura `bindings[]` di primo livello oppure spostati su un canale supportato.                                      |
| `--thread here requires running /acp spawn inside an active ... thread`     | `--thread here` usato fuori da un contesto thread.                              | Spostati nel thread di destinazione oppure usa `--thread auto`/`off`.                                                                                                      |
| `Only <user-id> can rebind this channel/conversation/thread.`               | Un altro utente possiede la destinazione di associazione attiva.                | Riassocia come proprietario oppure usa una conversazione o un thread diverso.                                                                                              |
| `Thread bindings are unavailable for <channel>.`                            | L'adapter non ha la capacità di associazione a thread.                          | Usa `--thread off` oppure spostati su un adapter/canale supportato.                                                                                                        |
| `Sandboxed sessions cannot spawn ACP sessions ...`                          | Il runtime ACP è lato host; la sessione richiedente è in sandbox.              | Usa `runtime="subagent"` da sessioni in sandbox, oppure esegui l'avvio ACP da una sessione non in sandbox.                                                                |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`     | È stato richiesto `sandbox="require"` per il runtime ACP.                      | Usa `runtime="subagent"` per sandboxing obbligatorio, oppure usa ACP con `sandbox="inherit"` da una sessione non in sandbox.                                              |
| `Cannot apply --model ... did not advertise model support`                  | Il harness di destinazione non espone la commutazione generica del modello ACP. | Usa un harness che pubblicizzi ACP `models`/`session/set_model`, usa riferimenti ai modelli Codex ACP oppure configura direttamente il modello nel harness se ha il proprio flag di avvio. |
| Missing ACP metadata for bound session                                      | Metadati della sessione ACP obsoleti/eliminati.                                 | Ricrea con `/acp spawn`, poi riassocia/metti a fuoco il thread.                                                                                                             |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`    | `permissionMode` blocca scritture/esecuzioni nella sessione ACP non interattiva. | Imposta `plugins.entries.acpx.config.permissionMode` su `approve-all` e riavvia il gateway. Vedi [Configurazione delle autorizzazioni](/it/tools/acp-agents-setup#permission-configuration). |
| ACP session fails early with little output                                  | I prompt di autorizzazione sono bloccati da `permissionMode`/`nonInteractivePermissions`. | Controlla i log del gateway per `AcpRuntimeError`. Per autorizzazioni complete, imposta `permissionMode=approve-all`; per un degrado graduale, imposta `nonInteractivePermissions=deny`. |
| ACP session stalls indefinitely after completing work                       | Il processo harness è terminato ma la sessione ACP non ha segnalato il completamento. | Monitora con `ps aux \| grep acpx`; termina manualmente i processi obsoleti.                                                                                                |
| Harness sees `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>`                        | L'envelope dell'evento interno è trapelato oltre il confine ACP.               | Aggiorna OpenClaw ed esegui di nuovo il flusso di completamento; i harness esterni dovrebbero ricevere solo prompt di completamento semplici.                             |

## Correlati

- [Agenti ACP — configurazione](/it/tools/acp-agents-setup)
- [Invio agente](/it/tools/agent-send)
- [Backend CLI](/it/gateway/cli-backends)
- [Codex harness](/it/plugins/codex-harness)
- [Strumenti sandbox multi-agent](/it/tools/multi-agent-sandbox-tools)
- [`openclaw acp` (modalità bridge)](/it/cli/acp)
- [Sub-agent](/it/tools/subagents)
