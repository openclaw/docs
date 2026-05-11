---
read_when:
    - Esecuzione degli harness di programmazione tramite ACP
    - Configurazione di sessioni ACP vincolate alla conversazione sui canali di messaggistica
    - Associare una conversazione di un canale di messaggistica a una sessione ACP persistente
    - Risoluzione dei problemi del backend ACP, del cablaggio del Plugin o della consegna del completamento
    - Gestire i comandi /acp dalla chat
sidebarTitle: ACP agents
summary: Esegui harness di codifica esterni (Claude Code, Cursor, Gemini CLI, Codex ACP esplicito, OpenClaw ACP, OpenCode) tramite il backend ACP
title: Agenti ACP
x-i18n:
    generated_at: "2026-05-11T20:36:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: f6f4beb509c00c965bc2b202648f1b6567d1f3a633f2f9926882adafc5144e06
    source_path: tools/acp-agents.md
    workflow: 16
---

[Agent Client Protocol (ACP)](https://agentclientprotocol.com/) sessioni
consentono a OpenClaw di eseguire harness di coding esterni (per esempio Pi, Claude Code,
Cursor, Copilot, Droid, OpenClaw ACP, OpenCode, Gemini CLI e altri
harness ACPX supportati) tramite un plugin backend ACP.

Ogni spawn di sessione ACP viene tracciato come [attività in background](/it/automation/tasks).

<Note>
**ACP è il percorso per harness esterni, non il percorso Codex predefinito.** Il
plugin app-server Codex nativo possiede i controlli `/codex ...` e il runtime
incorporato `openai/gpt-*` predefinito per i turni agente; ACP possiede
i controlli `/acp ...` e le sessioni `sessions_spawn({ runtime: "acp" })`.

Se vuoi che Codex o Claude Code si connettano come client MCP esterno
direttamente alle conversazioni di canale OpenClaw esistenti, usa
[`openclaw mcp serve`](/it/cli/mcp) invece di ACP.
</Note>

## Quale pagina mi serve?

| Vuoi…                                                                                           | Usa                                   | Note                                                                                                                                                                                                                     |
| ----------------------------------------------------------------------------------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Associare o controllare Codex nella conversazione corrente                                      | `/codex bind`, `/codex threads`       | Percorso app-server Codex nativo quando il plugin `codex` è abilitato; include risposte chat associate, inoltro immagini, controlli modello/fast/permessi, arresto e orientamento. ACP è un fallback esplicito |
| Eseguire Claude Code, Gemini CLI, Codex ACP esplicito o un altro harness esterno _tramite_ OpenClaw | Questa pagina                         | Sessioni associate alla chat, `/acp spawn`, `sessions_spawn({ runtime: "acp" })`, attività in background, controlli runtime                                                                                              |
| Esporre una sessione Gateway OpenClaw _come_ server ACP per un editor o client                  | [`openclaw acp`](/it/cli/acp)            | Modalità bridge. IDE/client parla ACP con OpenClaw tramite stdio/WebSocket                                                                                                                                               |
| Riutilizzare una CLI AI locale come modello fallback solo testo                                 | [Backend CLI](/it/gateway/cli-backends) | Non ACP. Nessuno strumento OpenClaw, nessun controllo ACP, nessun runtime harness                                                                                                                                        |

## Funziona subito?

Sì, dopo aver installato il plugin runtime ACP ufficiale:

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

I checkout sorgente possono usare il plugin workspace locale `extensions/acpx` dopo
`pnpm install`. Esegui `/acp doctor` per un controllo di preparazione.

OpenClaw istruisce gli agenti sullo spawn ACP solo quando ACP è **davvero
utilizzabile**: ACP deve essere abilitato, il dispatch non deve essere disabilitato, la sessione
corrente non deve essere bloccata dalla sandbox e un backend runtime deve essere
caricato. Se queste condizioni non sono soddisfatte, le skills del plugin ACP e la
guida ACP di `sessions_spawn` restano nascoste, così l'agente non suggerisce
un backend non disponibile.

<AccordionGroup>
  <Accordion title="Problemi comuni alla prima esecuzione">
    - Se `plugins.allow` è impostato, è un inventario plugin restrittivo e **deve** includere `acpx`; altrimenti il backend ACP installato viene bloccato intenzionalmente e `/acp doctor` segnala la voce allowlist mancante.
    - L'adapter ACP Codex viene predisposto con il plugin `acpx` e avviato localmente quando possibile.
    - Codex ACP viene eseguito con un `CODEX_HOME` isolato; OpenClaw copia solo le voci di progetto attendibili dalla configurazione Codex dell'host e considera attendibile il workspace attivo, lasciando auth, notifiche e hook sulla configurazione host.
    - Altri adapter harness target possono ancora essere recuperati su richiesta con `npx` la prima volta che li usi.
    - L'auth del vendor deve comunque esistere sull'host per quell'harness.
    - Se l'host non ha npm o accesso di rete, i recuperi degli adapter alla prima esecuzione falliscono finché le cache non vengono preriscaldate o l'adapter non viene installato in un altro modo.

  </Accordion>
  <Accordion title="Prerequisiti runtime">
    ACP avvia un vero processo harness esterno. OpenClaw possiede routing,
    stato delle attività in background, consegna, associazioni e policy; l'harness
    possiede il proprio login provider, catalogo modelli, comportamento del filesystem e
    strumenti nativi.

    Prima di attribuire il problema a OpenClaw, verifica:

    - `/acp doctor` segnali un backend abilitato e sano.
    - L'id target sia consentito da `acp.allowedAgents` quando quella allowlist è impostata.
    - Il comando harness possa avviarsi sull'host Gateway.
    - L'auth provider sia presente per quell'harness (`claude`, `codex`, `gemini`, `opencode`, `droid`, ecc.).
    - Il modello selezionato esista per quell'harness - gli id modello non sono portabili tra harness.
    - Il `cwd` richiesto esista e sia accessibile, oppure ometti `cwd` e lascia che il backend usi il suo predefinito.
    - La modalità dei permessi corrisponda al lavoro. Le sessioni non interattive non possono fare clic sui prompt di permesso nativi, quindi le esecuzioni di coding con molte scritture/esecuzioni di solito necessitano di un profilo permessi ACPX che possa procedere headless.

  </Accordion>
</AccordionGroup>

Gli strumenti plugin OpenClaw e gli strumenti OpenClaw integrati **non** sono esposti agli
harness ACP per impostazione predefinita. Abilita i bridge MCP espliciti in
[Agenti ACP - configurazione](/it/tools/acp-agents-setup) solo quando l'harness
deve chiamare direttamente quegli strumenti.

## Target harness supportati

Con il backend `acpx`, usa questi id harness come target di `/acp spawn <id>`
o `sessions_spawn({ runtime: "acp", agentId: "<id>" })`:

| Id harness | Backend tipico                                 | Note                                                                                         |
| ---------- | ---------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `claude`   | Adapter ACP Claude Code                        | Richiede auth Claude Code sull'host.                                                         |
| `codex`    | Adapter ACP Codex                              | Fallback ACP esplicito solo quando `/codex` nativo non è disponibile o ACP è richiesto.      |
| `copilot`  | Adapter ACP GitHub Copilot                     | Richiede auth CLI/runtime Copilot.                                                           |
| `cursor`   | ACP Cursor CLI (`cursor-agent acp`)            | Sovrascrivi il comando acpx se un'installazione locale espone un entrypoint ACP diverso.     |
| `droid`    | Factory Droid CLI                              | Richiede auth Factory/Droid o `FACTORY_API_KEY` nell'ambiente harness.                       |
| `gemini`   | Adapter ACP Gemini CLI                         | Richiede auth Gemini CLI o configurazione chiave API.                                        |
| `iflow`    | iFlow CLI                                      | Disponibilità adapter e controllo modello dipendono dalla CLI installata.                    |
| `kilocode` | Kilo Code CLI                                  | Disponibilità adapter e controllo modello dipendono dalla CLI installata.                    |
| `kimi`     | Kimi/Moonshot CLI                              | Richiede auth Kimi/Moonshot sull'host.                                                       |
| `kiro`     | Kiro CLI                                       | Disponibilità adapter e controllo modello dipendono dalla CLI installata.                    |
| `opencode` | Adapter ACP OpenCode                           | Richiede auth CLI/provider OpenCode.                                                         |
| `openclaw` | Bridge Gateway OpenClaw tramite `openclaw acp` | Consente a un harness compatibile con ACP di comunicare con una sessione Gateway OpenClaw.   |
| `pi`       | Runtime Pi/OpenClaw incorporato                | Usato per esperimenti harness nativi OpenClaw.                                               |
| `qwen`     | Qwen Code / Qwen CLI                           | Richiede auth compatibile con Qwen sull'host.                                                |

Alias agente acpx personalizzati possono essere configurati in acpx stesso, ma la policy OpenClaw
controlla comunque `acp.allowedAgents` e qualsiasi
mappatura `agents.list[].runtime.acp.agent` prima del dispatch.

## Runbook operatore

Flusso rapido `/acp` dalla chat:

<Steps>
  <Step title="Spawn">
    `/acp spawn claude --bind here`,
    `/acp spawn gemini --mode persistent --thread auto`, o esplicito
    `/acp spawn codex --bind here`.
  </Step>
  <Step title="Lavoro">
    Continua nella conversazione o thread associato (o punta esplicitamente alla chiave
    sessione).
  </Step>
  <Step title="Controlla stato">
    `/acp status`
  </Step>
  <Step title="Regola">
    `/acp model <provider/model>`,
    `/acp permissions <profile>`,
    `/acp timeout <seconds>`.
  </Step>
  <Step title="Orienta">
    Senza sostituire il contesto: `/acp steer tighten logging and continue`.
  </Step>
  <Step title="Arresta">
    `/acp cancel` (turno corrente) o `/acp close` (sessione + associazioni).
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Dettagli ciclo di vita">
    - Lo spawn crea o riprende una sessione runtime ACP, registra metadati ACP nello store sessioni OpenClaw e può creare un'attività in background quando l'esecuzione è posseduta dal parent.
    - Le sessioni ACP possedute dal parent sono trattate come lavoro in background anche quando la sessione runtime è persistente; completamento e consegna cross-surface passano dal notificatore attività parent invece di comportarsi come una normale sessione chat rivolta all'utente.
    - La manutenzione attività chiude le sessioni ACP one-shot terminali o orfane possedute dal parent. Le sessioni ACP persistenti sono preservate finché resta un'associazione conversazione attiva; le sessioni persistenti obsolete senza associazione attiva vengono chiuse così non possono essere riprese silenziosamente dopo che l'attività proprietaria è terminata o il relativo record attività è sparito.
    - I messaggi di follow-up associati vanno direttamente alla sessione ACP finché l'associazione non viene chiusa, sfocata, reimpostata o scaduta.
    - I comandi Gateway restano locali. `/acp ...`, `/status` e `/unfocus` non vengono mai inviati come normale testo prompt a un harness ACP associato.
    - `cancel` interrompe il turno attivo quando il backend supporta la cancellazione; non elimina l'associazione né i metadati della sessione.
    - `close` termina la sessione ACP dal punto di vista di OpenClaw e rimuove l'associazione. Un harness può comunque conservare la propria cronologia upstream se supporta la ripresa.
    - Il plugin acpx pulisce i wrapper posseduti da OpenClaw e gli alberi di processi adapter dopo `close`, e raccoglie gli orfani ACPX obsoleti posseduti da OpenClaw durante l'avvio del Gateway.
    - I worker runtime inattivi sono idonei alla pulizia dopo `acp.runtime.ttlMinutes`; i metadati di sessione memorizzati restano disponibili per `/acp sessions`.

  </Accordion>
  <Accordion title="Regole di routing Codex nativo">
    Trigger in linguaggio naturale che dovrebbero essere instradati al **plugin Codex
    nativo** quando è abilitato:

    - "Associa questo canale Discord a Codex."
    - "Collega questa chat al thread Codex `<id>`."
    - "Mostra i thread Codex, poi associa questo."

    L'associazione nativa delle conversazioni Codex è il percorso di controllo chat predefinito.
    Gli strumenti dinamici di OpenClaw continuano a essere eseguiti tramite OpenClaw, mentre
    gli strumenti nativi di Codex come shell/apply-patch vengono eseguiti dentro Codex.
    Per gli eventi degli strumenti nativi di Codex, OpenClaw inietta un relay di hook nativo
    per turno, così gli hook dei plugin possono bloccare `before_tool_call`, osservare
    `after_tool_call` e instradare gli eventi Codex `PermissionRequest`
    tramite le approvazioni di OpenClaw. Gli hook Codex `Stop` vengono inoltrati a
    OpenClaw `before_agent_finalize`, dove i plugin possono richiedere un ulteriore
    passaggio del modello prima che Codex finalizzi la risposta. Il relay resta
    volutamente conservativo: non modifica gli argomenti degli strumenti nativi di Codex
    né riscrive i record dei thread di Codex. Usa ACP esplicito solo
    quando vuoi il modello runtime/sessione ACP. Il confine di supporto di Codex
    incorporato è documentato nel
    [contratto di supporto del harness Codex v1](/it/plugins/codex-harness-runtime#v1-support-contract).

  </Accordion>
  <Accordion title="Guida rapida alla selezione di modello / provider / runtime">
    - `openai-codex/*` - route modello Codex OAuth/subscription legacy riparata da doctor.
    - `openai/*` - runtime incorporato nativo dell'app-server Codex per i turni degli agenti OpenAI.
    - `/codex ...` - controllo conversazione nativo di Codex.
    - `/acp ...` o `runtime: "acp"` - controllo ACP/acpx esplicito.

  </Accordion>
  <Accordion title="Trigger in linguaggio naturale per il routing ACP">
    Trigger che dovrebbero instradare al runtime ACP:

    - "Esegui questo come sessione Claude Code ACP one-shot e riepiloga il risultato."
    - "Usa Gemini CLI per questa attività in un thread, poi mantieni i follow-up nello stesso thread."
    - "Esegui Codex tramite ACP in un thread in background."

    OpenClaw sceglie `runtime: "acp"`, risolve il `agentId` del harness,
    si associa alla conversazione o al thread corrente quando supportato e
    instrada i follow-up a quella sessione fino a chiusura/scadenza. Codex segue
    questo percorso solo quando ACP/acpx è esplicito o il plugin nativo di Codex
    non è disponibile per l'operazione richiesta.

    Per `sessions_spawn`, `runtime: "acp"` viene pubblicizzato solo quando ACP
    è abilitato, il richiedente non è in sandbox e un backend runtime ACP
    è caricato. `acp.dispatch.enabled=false` mette in pausa il dispatch automatico
    dei thread ACP ma non nasconde né blocca le chiamate esplicite
    `sessions_spawn({ runtime: "acp" })`. Punta a id harness ACP come `codex`,
    `claude`, `droid`, `gemini` o `opencode`. Non passare un normale
    id agente di configurazione OpenClaw da `agents_list` a meno che quella voce sia
    configurata esplicitamente con `agents.list[].runtime.type="acp"`;
    altrimenti usa il runtime sub-agent predefinito. Quando un agente OpenClaw
    è configurato con `runtime.type="acp"`, OpenClaw usa
    `runtime.acp.agent` come id harness sottostante.

  </Accordion>
</AccordionGroup>

## ACP rispetto ai sub-agent

Usa ACP quando vuoi un runtime harness esterno. Usa **app-server nativo Codex**
per l'associazione/controllo delle conversazioni Codex quando il plugin `codex`
è abilitato. Usa i **sub-agent** quando vuoi esecuzioni delegate native di
OpenClaw.

| Area          | Sessione ACP                          | Esecuzione sub-agent               |
| ------------- | ------------------------------------- | ---------------------------------- |
| Runtime       | Plugin backend ACP (per esempio acpx) | Runtime sub-agent nativo OpenClaw  |
| Chiave sessione | `agent:<agentId>:acp:<uuid>`        | `agent:<agentId>:subagent:<uuid>`  |
| Comandi principali | `/acp ...`                       | `/subagents ...`                   |
| Strumento di spawn | `sessions_spawn` con `runtime:"acp"` | `sessions_spawn` (runtime predefinito) |

Vedi anche [Sub-agent](/it/tools/subagents).

## Come ACP esegue Claude Code

Per Claude Code tramite ACP, lo stack è:

1. Piano di controllo sessione ACP di OpenClaw.
2. Plugin runtime ufficiale `@openclaw/acpx`.
3. Adapter ACP Claude.
4. Meccanismo runtime/sessione lato Claude.

ACP Claude è una **sessione harness** con controlli ACP, ripresa della sessione,
tracciamento delle attività in background e associazione opzionale a conversazione/thread.

I backend CLI sono runtime di fallback locali separati solo testo - vedi
[Backend CLI](/it/gateway/cli-backends).

Per gli operatori, la regola pratica è:

- **Vuoi `/acp spawn`, sessioni associabili, controlli runtime o lavoro persistente del harness?** Usa ACP.
- **Vuoi un semplice fallback di testo locale tramite la CLI grezza?** Usa i backend CLI.

## Sessioni associate

### Modello mentale

- **Superficie chat** - dove le persone continuano a parlare (canale Discord, topic Telegram, chat iMessage).
- **Sessione ACP** - lo stato runtime durevole Codex/Claude/Gemini a cui OpenClaw instrada.
- **Thread/topic figlio** - una superficie di messaggistica aggiuntiva opzionale creata solo da `--thread ...`.
- **Workspace runtime** - la posizione del filesystem (`cwd`, checkout del repo, workspace backend) dove viene eseguito il harness. Indipendente dalla superficie chat.

### Associazioni alla conversazione corrente

`/acp spawn <harness> --bind here` fissa la conversazione corrente alla
sessione ACP avviata - nessun thread figlio, stessa superficie chat. OpenClaw continua a
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
    - `--bind here` e `--thread ...` si escludono a vicenda.
    - `--bind here` funziona solo sui canali che pubblicizzano l'associazione alla conversazione corrente; altrimenti OpenClaw restituisce un messaggio chiaro di non supporto. Le associazioni persistono tra i riavvii del Gateway.
    - Su Discord, `spawnSessions` controlla la creazione di thread figli per `--thread auto|here` - non `--bind here`.
    - Se avvii un agente ACP diverso senza `--cwd`, OpenClaw eredita per impostazione predefinita il workspace **dell'agente target**. I percorsi ereditati mancanti (`ENOENT`/`ENOTDIR`) ricadono sul valore predefinito del backend; altri errori di accesso (ad es. `EACCES`) emergono come errori di spawn.
    - I comandi di gestione del Gateway restano locali nelle conversazioni associate - i comandi `/acp ...` sono gestiti da OpenClaw anche quando il testo normale di follow-up viene instradato alla sessione ACP associata; anche `/status` e `/unfocus` restano locali ogni volta che la gestione dei comandi è abilitata per quella superficie.

  </Accordion>
  <Accordion title="Sessioni associate a thread">
    Quando le associazioni dei thread sono abilitate per un adapter di canale:

    - OpenClaw associa un thread a una sessione ACP target.
    - I messaggi di follow-up in quel thread vengono instradati alla sessione ACP associata.
    - L'output ACP viene riconsegnato allo stesso thread.
    - Unfocus/chiusura/archiviazione/timeout di inattività o scadenza per età massima rimuove l'associazione.
    - `/acp close`, `/acp cancel`, `/acp status`, `/status` e `/unfocus` sono comandi Gateway, non prompt per il harness ACP.

    Feature flag richiesti per ACP associato a thread:

    - `acp.enabled=true`
    - `acp.dispatch.enabled` è attivo per impostazione predefinita (imposta `false` per mettere in pausa il dispatch automatico dei thread ACP; le chiamate esplicite `sessions_spawn({ runtime: "acp" })` continuano a funzionare).
    - Spawn delle sessioni thread dell'adapter di canale abilitato (predefinito: `true`):
      - Discord: `channels.discord.threadBindings.spawnSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnSessions=true`

    Il supporto alle associazioni dei thread è specifico dell'adapter. Se l'adapter
    del canale attivo non supporta le associazioni dei thread, OpenClaw restituisce un
    messaggio chiaro di non supporto/non disponibilità.

  </Accordion>
  <Accordion title="Canali con supporto thread">
    - Qualsiasi adapter di canale che esponga la capability di associazione sessione/thread.
    - Supporto integrato attuale: thread/canali **Discord**, topic **Telegram** (topic forum in gruppi/supergruppi e topic DM).
    - I canali plugin possono aggiungere supporto tramite la stessa interfaccia di associazione.

  </Accordion>
</AccordionGroup>

## Associazioni persistenti dei canali

Per workflow non effimeri, configura associazioni ACP persistenti nelle
voci di primo livello `bindings[]`.

### Modello di associazione

<ParamField path="bindings[].type" type='"acp"'>
  Segna un'associazione persistente di conversazione ACP.
</ParamField>
<ParamField path="bindings[].match" type="object">
  Identifica la conversazione target. Forme per canale:

- **Canale/thread Discord:** `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
- **Canale/DM Slack:** `match.channel="slack"` + `match.peer.id="<channelId|channel:<channelId>|#<channelId>|userId|user:<userId>|slack:<userId>|<@userId>>"`. Preferisci id Slack stabili; le associazioni di canale corrispondono anche alle risposte dentro i thread di quel canale.
- **Topic forum Telegram:** `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
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
- `agents.list[].runtime.acp.agent` (id harness, ad es. `codex` o `claude`)
- `agents.list[].runtime.acp.backend`
- `agents.list[].runtime.acp.mode`
- `agents.list[].runtime.acp.cwd`

**Precedenza degli override per sessioni ACP associate:**

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
- I messaggi in quel canale o argomento vengono instradati alla sessione ACP configurata.
- Nelle conversazioni vincolate, `/new` e `/reset` reimpostano sul posto la stessa chiave di sessione ACP.
- I binding runtime temporanei (per esempio creati dai flussi di focus del thread) si applicano comunque dove presenti.
- Per gli spawn ACP tra agenti senza un `cwd` esplicito, OpenClaw eredita lo spazio di lavoro dell'agente di destinazione dalla configurazione dell'agente.
- I percorsi dello spazio di lavoro ereditati mancanti ripiegano sul cwd predefinito del backend; gli errori di accesso non mancanti emergono come errori di spawn.

## Avviare sessioni ACP

Due modi per avviare una sessione ACP:

<Tabs>
  <Tab title="From sessions_spawn">
    Usa `runtime: "acp"` per avviare una sessione ACP da un turno
    dell'agente o da una chiamata di strumento.

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
    Il valore predefinito di `runtime` è `subagent`, quindi imposta
    esplicitamente `runtime: "acp"` per le sessioni ACP. Se `agentId`
    viene omesso, OpenClaw usa `acp.defaultAgent` quando configurato.
    `mode: "session"` richiede `thread: true` per mantenere una
    conversazione vincolata persistente.
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
  ID dell'harness ACP di destinazione. Ripiega su `acp.defaultAgent` se impostato.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  Richiede il flusso di binding del thread dove supportato.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  `"run"` è monouso; `"session"` è persistente. Se `thread: true` e
  `mode` viene omesso, OpenClaw può usare come predefinito il
  comportamento persistente per percorso runtime. `mode: "session"`
  richiede `thread: true`.
</ParamField>
<ParamField path="cwd" type="string">
  Directory di lavoro runtime richiesta (validata dalla policy del
  backend/runtime). Se omessa, lo spawn ACP eredita lo spazio di lavoro
  dell'agente di destinazione quando configurato; i percorsi ereditati
  mancanti ripiegano sui valori predefiniti del backend, mentre gli
  errori di accesso reali vengono restituiti.
</ParamField>
<ParamField path="label" type="string">
  Etichetta visibile all'operatore usata nel testo di sessione/banner.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  Riprende una sessione ACP esistente invece di crearne una nuova.
  L'agente riproduce la propria cronologia di conversazione tramite
  `session/load`. Richiede `runtime: "acp"`.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  `"parent"` trasmette gli riepiloghi di avanzamento dell'esecuzione ACP
  iniziale alla sessione richiedente come eventi di sistema. Le risposte
  accettate includono `streamLogPath` che punta a un log JSONL con ambito
  sessione (`<sessionId>.acp-stream.jsonl`) che puoi seguire per la
  cronologia completa del relay.
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  Interrompe il turno figlio ACP dopo N secondi. `0` mantiene il turno
  sul percorso senza timeout del Gateway. Lo stesso valore viene applicato
  all'esecuzione del Gateway e al runtime ACP, così gli harness bloccati o
  con quota esaurita non occupano indefinitamente la corsia dell'agente
  genitore.
</ParamField>
<ParamField path="model" type="string">
  Override esplicito del modello per la sessione figlio ACP. Gli spawn
  ACP di Codex normalizzano i riferimenti Codex di OpenClaw come
  `openai-codex/gpt-5.4` nella configurazione di avvio ACP di Codex prima
  di `session/new`; le forme slash come `openai-codex/gpt-5.4/high`
  impostano anche lo sforzo di ragionamento ACP di Codex. Gli altri
  harness devono dichiarare i `models` ACP e supportare `session/set_model`;
  altrimenti OpenClaw/acpx fallisce chiaramente invece di ripiegare
  silenziosamente sul valore predefinito dell'agente di destinazione.
</ParamField>
<ParamField path="thinking" type="string">
  Sforzo esplicito di pensiero/ragionamento. Per Codex ACP, `minimal`
  corrisponde a uno sforzo basso, `low`/`medium`/`high`/`xhigh`
  corrispondono direttamente, e `off` omette l'override di avvio dello
  sforzo di ragionamento.
</ParamField>

## Modalità di binding e thread dello spawn

<Tabs>
  <Tab title="--bind here|off">
    | Modalità | Comportamento                                                               |
    | -------- | ---------------------------------------------------------------------------- |
    | `here`   | Vincola sul posto la conversazione attiva corrente; fallisce se non ne esiste una attiva. |
    | `off`    | Non creare un binding per la conversazione corrente.                         |

    Note:

    - `--bind here` è il percorso operatore più semplice per "rendere questo canale o questa chat supportata da Codex".
    - `--bind here` non crea un thread figlio.
    - `--bind here` è disponibile solo sui canali che espongono il supporto al binding della conversazione corrente.
    - `--bind` e `--thread` non possono essere combinati nella stessa chiamata `/acp spawn`.

  </Tab>
  <Tab title="--thread auto|here|off">
    | Modalità | Comportamento                                                                                       |
    | -------- | ---------------------------------------------------------------------------------------------------- |
    | `auto`   | In un thread attivo: vincola quel thread. Fuori da un thread: crea/vincola un thread figlio quando supportato. |
    | `here`   | Richiede il thread attivo corrente; fallisce se non ci si trova in uno.                              |
    | `off`    | Nessun binding. La sessione parte non vincolata.                                                     |

    Note:

    - Sulle superfici senza binding dei thread, il comportamento predefinito è di fatto `off`.
    - Lo spawn vincolato a thread richiede il supporto della policy del canale:
      - Discord: `channels.discord.threadBindings.spawnSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnSessions=true`
    - Usa `--bind here` quando vuoi fissare la conversazione corrente senza creare un thread figlio.

  </Tab>
</Tabs>

## Modello di consegna

Le sessioni ACP possono essere spazi di lavoro interattivi oppure lavoro
in background posseduto dal genitore. Il percorso di consegna dipende da
questa forma.

<AccordionGroup>
  <Accordion title="Interactive ACP sessions">
    Le sessioni interattive sono pensate per continuare a conversare su
    una superficie di chat visibile:

    - `/acp spawn ... --bind here` vincola la conversazione corrente alla sessione ACP.
    - `/acp spawn ... --thread ...` vincola un thread/argomento del canale alla sessione ACP.
    - I `bindings[].type="acp"` configurati persistenti instradano le conversazioni corrispondenti alla stessa sessione ACP.

    I messaggi successivi nella conversazione vincolata vengono instradati
    direttamente alla sessione ACP, e l'output ACP viene consegnato di
    nuovo allo stesso canale/thread/argomento.

    Cosa OpenClaw invia all'harness:

    - I normali follow-up vincolati vengono inviati come testo del prompt, più allegati solo quando l'harness/backend li supporta.
    - I comandi di gestione `/acp` e i comandi Gateway locali vengono intercettati prima del dispatch ACP.
    - Gli eventi di completamento generati dal runtime vengono materializzati per destinazione. Gli agenti OpenClaw ricevono l'envelope interna di contesto runtime di OpenClaw; gli harness ACP esterni ricevono un prompt semplice con il risultato figlio e l'istruzione. L'envelope grezza `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>` non deve mai essere inviata a harness esterni né persistita come testo di trascrizione utente ACP.
    - Le voci di trascrizione ACP usano il testo di trigger visibile all'utente o il prompt di completamento semplice. I metadati degli eventi interni restano strutturati in OpenClaw dove possibile e non vengono trattati come contenuto chat scritto dall'utente.

  </Accordion>
  <Accordion title="Parent-owned one-shot ACP sessions">
    Le sessioni ACP monouso generate da un'altra esecuzione agente sono
    figli in background, simili ai sotto-agenti:

    - Il genitore richiede lavoro con `sessions_spawn({ runtime: "acp", mode: "run" })`.
    - Il figlio viene eseguito nella propria sessione harness ACP.
    - I turni figlio vengono eseguiti sulla stessa corsia in background usata dagli spawn di sotto-agenti nativi, quindi un harness ACP lento non blocca il lavoro non correlato della sessione principale.
    - I report di completamento tornano attraverso il percorso di annuncio del completamento dell'attività. OpenClaw converte i metadati di completamento interni in un prompt ACP semplice prima di inviarli a un harness esterno, quindi gli harness non vedono i marker di contesto runtime solo di OpenClaw.
    - Il genitore riscrive il risultato figlio con la normale voce dell'assistente quando è utile una risposta visibile all'utente.

    **Non** trattare questo percorso come una chat peer-to-peer tra
    genitore e figlio. Il figlio ha già un canale di completamento verso
    il genitore.

  </Accordion>
  <Accordion title="sessions_send and A2A delivery">
    `sessions_send` può prendere di mira un'altra sessione dopo lo spawn.
    Per le normali sessioni peer, OpenClaw usa un percorso di follow-up
    agent-to-agent (A2A) dopo aver iniettato il messaggio:

    - Attendi la risposta della sessione di destinazione.
    - Facoltativamente consenti a richiedente e destinazione di scambiare un numero limitato di turni di follow-up.
    - Chiedi alla destinazione di produrre un messaggio di annuncio.
    - Consegna quell'annuncio al canale o thread visibile.

    Quel percorso A2A è un fallback per gli invii peer in cui il mittente
    ha bisogno di un follow-up visibile. Resta abilitato quando una
    sessione non correlata può vedere e inviare messaggi a una
    destinazione ACP, per esempio con impostazioni ampie di
    `tools.sessions.visibility`.

    OpenClaw salta il follow-up A2A solo quando il richiedente è il
    genitore del proprio figlio ACP monouso posseduto dal genitore. In
    quel caso, eseguire A2A sopra il completamento dell'attività può
    svegliare il genitore con il risultato del figlio, inoltrare la
    risposta del genitore di nuovo nel figlio e creare un loop di eco
    genitore/figlio. Il risultato di `sessions_send` riporta
    `delivery.status="skipped"` per quel caso di figlio posseduto perché
    il percorso di completamento è già responsabile del risultato.

  </Accordion>
  <Accordion title="Resume an existing session">
    Usa `resumeSessionId` per continuare una sessione ACP precedente
    invece di ripartire da zero. L'agente riproduce la propria cronologia
    di conversazione tramite `session/load`, quindi riprende con il
    contesto completo di ciò che è avvenuto prima.

    ```json
    {
      "task": "Continue where we left off - fix the remaining test failures",
      "runtime": "acp",
      "agentId": "codex",
      "resumeSessionId": "<previous-session-id>"
    }
    ```

    Casi d'uso comuni:

    - Passa una sessione Codex dal laptop al telefono: dì al tuo agente di riprendere da dove eri rimasto.
    - Continua una sessione di programmazione che hai avviato interattivamente nella CLI, ora in modalità headless tramite il tuo agente.
    - Riprendi il lavoro interrotto da un riavvio del gateway o da un timeout per inattività.

    Note:

    - `resumeSessionId` si applica solo quando `runtime: "acp"`; il runtime sotto-agente predefinito ignora questo campo solo ACP.
    - `streamTo` si applica solo quando `runtime: "acp"`; il runtime sotto-agente predefinito ignora questo campo solo ACP.
    - `resumeSessionId` è un ID di ripresa ACP/harness locale dell'host, non una chiave di sessione canale OpenClaw; OpenClaw controlla comunque la policy di spawn ACP e la policy dell'agente di destinazione prima del dispatch, mentre il backend ACP o l'harness possiede l'autorizzazione per caricare quell'ID upstream.
    - `resumeSessionId` ripristina la cronologia di conversazione ACP upstream; `thread` e `mode` si applicano comunque normalmente alla nuova sessione OpenClaw che stai creando, quindi `mode: "session"` richiede comunque `thread: true`.
    - L'agente di destinazione deve supportare `session/load` (Codex e Claude Code lo fanno).
    - Se l'ID sessione non viene trovato, lo spawn fallisce con un errore chiaro: nessun fallback silenzioso a una nuova sessione.

  </Accordion>
  <Accordion title="Post-deploy smoke test">
    Dopo un deploy del Gateway, esegui un controllo live end-to-end invece
    di fidarti degli unit test:

    1. Verifica la versione e il commit del Gateway distribuito sull'host di destinazione.
    2. Apri una sessione bridge ACPX temporanea verso un agente attivo.
    3. Chiedi a quell'agente di chiamare `sessions_spawn` con `runtime: "acp"`, `agentId: "codex"`, `mode: "run"` e il task `Reply with exactly LIVE-ACP-SPAWN-OK`.
    4. Verifica `accepted=yes`, un `childSessionKey` reale e nessun errore del validatore.
    5. Pulisci la sessione bridge temporanea.

    Mantieni il gate su `mode: "run"` e salta `streamTo: "parent"`:
    `mode: "session"` vincolato al thread e i percorsi di inoltro dello stream sono
    passaggi di integrazione più ricchi e separati.

  </Accordion>
</AccordionGroup>

## Compatibilità della sandbox

Le sessioni ACP attualmente vengono eseguite sul runtime dell'host, **non** dentro la
sandbox di OpenClaw.

<Warning>
**Confine di sicurezza:**

- L'harness esterno può leggere/scrivere in base alle proprie autorizzazioni CLI e al `cwd` selezionato.
- La policy della sandbox di OpenClaw **non** avvolge l'esecuzione dell'harness ACP.
- OpenClaw applica comunque i gate di funzionalità ACP, gli agenti consentiti, la proprietà delle sessioni, i binding dei canali e la policy di consegna del Gateway.
- Usa `runtime: "subagent"` per lavoro nativo OpenClaw con sandbox applicata.

</Warning>

Limitazioni attuali:

- Se la sessione richiedente è in sandbox, gli spawn ACP sono bloccati sia per `sessions_spawn({ runtime: "acp" })` sia per `/acp spawn`.
- `sessions_spawn` con `runtime: "acp"` non supporta `sandbox: "require"`.

## Risoluzione del target di sessione

La maggior parte delle azioni `/acp` accetta un target di sessione opzionale (`session-key`,
`session-id` o `session-label`).

**Ordine di risoluzione:**

1. Argomento target esplicito (o `--session` per `/acp steer`)
   - prova la chiave
   - poi l'id sessione in forma UUID
   - poi l'etichetta
2. Binding del thread corrente (se questa conversazione/thread è vincolata a una sessione ACP).
3. Fallback alla sessione richiedente corrente.

I binding della conversazione corrente e i binding del thread partecipano entrambi al
passaggio 2.

Se nessun target viene risolto, OpenClaw restituisce un errore chiaro
(`Unable to resolve session target: ...`).

## Controlli ACP

| Comando              | Cosa fa                                                   | Esempio                                                       |
| -------------------- | --------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | Crea una sessione ACP; binding corrente o thread opzionale. | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | Annulla il turno in corso per la sessione target.         | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | Invia un'istruzione di guida alla sessione in esecuzione. | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | Chiude la sessione e rimuove i binding dei target del thread. | `/acp close`                                                  |
| `/acp status`        | Mostra backend, modalità, stato, opzioni runtime, capacità. | `/acp status`                                                 |
| `/acp set-mode`      | Imposta la modalità runtime per la sessione target.       | `/acp set-mode plan`                                          |
| `/acp set`           | Scrittura generica di un'opzione di configurazione runtime. | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | Imposta l'override della directory di lavoro runtime.     | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | Imposta il profilo della policy di approvazione.          | `/acp permissions strict`                                     |
| `/acp timeout`       | Imposta il timeout runtime (secondi).                     | `/acp timeout 120`                                            |
| `/acp model`         | Imposta l'override del modello runtime.                   | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | Rimuove gli override delle opzioni runtime della sessione. | `/acp reset-options`                                          |
| `/acp sessions`      | Elenca le sessioni ACP recenti dallo store.               | `/acp sessions`                                               |
| `/acp doctor`        | Salute del backend, capacità, correzioni attuabili.       | `/acp doctor`                                                 |
| `/acp install`       | Stampa i passaggi deterministici di installazione e abilitazione. | `/acp install`                                                |

`/acp status` mostra le opzioni runtime effettive più gli identificatori di sessione
a livello runtime e a livello backend. Gli errori di controllo non supportato emergono
chiaramente quando un backend non dispone di una capacità. `/acp sessions` legge lo
store per la sessione vincolata o richiedente corrente; i token target
(`session-key`, `session-id` o `session-label`) vengono risolti tramite la
scoperta delle sessioni del Gateway, incluse le radici `session.store`
personalizzate per agente.

### Mappatura delle opzioni runtime

`/acp` ha comandi di praticità e un setter generico. Operazioni
equivalenti:

| Comando                      | Corrisponde a                       | Note                                                                                                                                                                                                      |
| ---------------------------- | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/acp model <id>`            | chiave di configurazione runtime `model` | Per Codex ACP, OpenClaw normalizza `openai-codex/<model>` nell'id modello dell'adapter e mappa i suffissi di reasoning con slash, come `openai-codex/gpt-5.4/high`, a `reasoning_effort`.                 |
| `/acp set thinking <level>`  | opzione canonica `thinking`          | OpenClaw invia l'equivalente pubblicizzato dal backend quando presente, preferendo `thinking`, poi `effort`, `reasoning_effort` o `thought_level`. Per Codex ACP, l'adapter mappa i valori a `reasoning_effort`. |
| `/acp permissions <profile>` | opzione canonica `permissionProfile` | OpenClaw invia l'equivalente pubblicizzato dal backend quando presente, come `approval_policy`, `permission_profile`, `permissions` o `permission_mode`.                                                  |
| `/acp timeout <seconds>`     | opzione canonica `timeoutSeconds`    | OpenClaw invia l'equivalente pubblicizzato dal backend quando presente, come `timeout` o `timeout_seconds`.                                                                                                |
| `/acp cwd <path>`            | override del cwd runtime             | Aggiornamento diretto.                                                                                                                                                                                     |
| `/acp set <key> <value>`     | generico                             | `key=cwd` usa il percorso di override del cwd.                                                                                                                                                             |
| `/acp reset-options`         | cancella tutti gli override runtime  | -                                                                                                                                                                                                          |

## Harness acpx, configurazione dei Plugin e autorizzazioni

Per la configurazione dell'harness acpx (alias Claude Code / Codex / Gemini CLI),
i bridge MCP plugin-tools e OpenClaw-tools e le modalità di autorizzazione ACP,
vedi
[Agenti ACP - configurazione](/it/tools/acp-agents-setup).

## Risoluzione dei problemi

| Sintomo                                                                     | Causa probabile                                                                                                        | Correzione                                                                                                                                                              |
| --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ACP runtime backend is not configured`                                     | Plugin backend mancante, disabilitato o bloccato da `plugins.allow`.                                                   | Installa e abilita il Plugin backend, includi `acpx` in `plugins.allow` quando questa lista di autorizzazione è impostata, quindi esegui `/acp doctor`.                  |
| `ACP is disabled by policy (acp.enabled=false)`                             | ACP disabilitato globalmente.                                                                                          | Imposta `acp.enabled=true`.                                                                                                                                             |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`           | Dispatch automatico dai normali messaggi del thread disabilitato.                                                       | Imposta `acp.dispatch.enabled=true` per riprendere l'instradamento automatico dei thread; le chiamate esplicite `sessions_spawn({ runtime: "acp" })` continuano a funzionare. |
| `ACP agent "<id>" is not allowed by policy`                                 | Agente non presente nella lista di autorizzazione.                                                                      | Usa un `agentId` consentito o aggiorna `acp.allowedAgents`.                                                                                                             |
| `/acp doctor` segnala che il backend non è pronto subito dopo l'avvio       | Il Plugin backend è mancante, disabilitato, bloccato da una policy di autorizzazione/negazione, o il suo eseguibile configurato non è disponibile. | Installa/abilita il Plugin backend, riesegui `/acp doctor` e ispeziona l'errore di installazione del backend o di policy se resta non integro.                          |
| Comando dell'harness non trovato                                             | La CLI dell'adattatore non è installata, il Plugin esterno è mancante o il recupero iniziale con `npx` è fallito per un adattatore non Codex. | Esegui `/acp doctor`, installa/precarica l'adattatore sull'host Gateway oppure configura esplicitamente il comando dell'agente acpx.                                    |
| Modello non trovato dall'harness                                             | L'id del modello è valido per un altro provider/harness ma non per questa destinazione ACP.                            | Usa un modello elencato da quell'harness, configura il modello nell'harness oppure ometti l'override.                                                                   |
| Errore di autenticazione del fornitore dall'harness                          | OpenClaw è integro, ma la CLI/il provider di destinazione non ha effettuato l'accesso.                                 | Effettua l'accesso o fornisci la chiave provider richiesta nell'ambiente dell'host Gateway.                                                                             |
| `Unable to resolve session target: ...`                                     | Token chiave/id/etichetta non valido.                                                                                  | Esegui `/acp sessions`, copia la chiave/etichetta esatta e riprova.                                                                                                     |
| `--bind here requires running /acp spawn inside an active ... conversation` | `--bind here` usato senza una conversazione attiva associabile.                                                        | Spostati nella chat/canale di destinazione e riprova, oppure usa uno spawn non associato.                                                                               |
| `Conversation bindings are unavailable for <channel>.`                      | L'adattatore non dispone della capacità di associazione ACP alla conversazione corrente.                               | Usa `/acp spawn ... --thread ...` dove supportato, configura `bindings[]` di livello superiore oppure passa a un canale supportato.                                     |
| `--thread here requires running /acp spawn inside an active ... thread`     | `--thread here` usato fuori da un contesto di thread.                                                                  | Spostati nel thread di destinazione o usa `--thread auto`/`off`.                                                                                                        |
| `Only <user-id> can rebind this channel/conversation/thread.`               | Un altro utente possiede la destinazione di associazione attiva.                                                       | Riesegui l'associazione come proprietario oppure usa una conversazione o un thread diverso.                                                                             |
| `Thread bindings are unavailable for <channel>.`                            | L'adattatore non dispone della capacità di associazione al thread.                                                     | Usa `--thread off` oppure passa a un adattatore/canale supportato.                                                                                                      |
| `Sandboxed sessions cannot spawn ACP sessions ...`                          | Il runtime ACP è lato host; la sessione richiedente è in sandbox.                                                      | Usa `runtime="subagent"` dalle sessioni in sandbox oppure esegui lo spawn ACP da una sessione non in sandbox.                                                           |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`     | `sandbox="require"` richiesto per il runtime ACP.                                                                      | Usa `runtime="subagent"` per il sandboxing richiesto oppure usa ACP con `sandbox="inherit"` da una sessione non in sandbox.                                             |
| `Cannot apply --model ... did not advertise model support`                  | L'harness di destinazione non espone il cambio modello ACP generico.                                                   | Usa un harness che pubblicizzi ACP `models`/`session/set_model`, usa riferimenti modello ACP Codex oppure configura il modello direttamente nell'harness se dispone di un proprio flag di avvio. |
| Metadati ACP mancanti per la sessione associata                             | Metadati della sessione ACP obsoleti/eliminati.                                                                        | Ricrea con `/acp spawn`, quindi riassocia/metti a fuoco il thread.                                                                                                      |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`    | `permissionMode` blocca scritture/exec in una sessione ACP non interattiva.                                            | Imposta `plugins.entries.acpx.config.permissionMode` su `approve-all` e riavvia il gateway. Vedi [Configurazione dei permessi](/it/tools/acp-agents-setup#permission-configuration). |
| La sessione ACP fallisce presto con poco output                             | I prompt dei permessi sono bloccati da `permissionMode`/`nonInteractivePermissions`.                                   | Controlla i log del gateway per `AcpRuntimeError`. Per permessi completi, imposta `permissionMode=approve-all`; per un degrado graduale, imposta `nonInteractivePermissions=deny`. |
| La sessione ACP resta bloccata indefinitamente dopo aver completato il lavoro | Il processo harness è terminato ma la sessione ACP non ha segnalato il completamento.                                  | Aggiorna OpenClaw; l'attuale cleanup di acpx rimuove i processi wrapper e adattatore obsoleti di proprietà di OpenClaw alla chiusura e all'avvio del Gateway.           |
| L'harness vede `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>`                      | Envelope evento interno trapelato oltre il confine ACP.                                                               | Aggiorna OpenClaw e riesegui il flusso di completamento; gli harness esterni dovrebbero ricevere solo prompt di completamento in chiaro.                                |

## Correlati

- [Agenti ACP - configurazione](/it/tools/acp-agents-setup)
- [Invio agente](/it/tools/agent-send)
- [Backend CLI](/it/gateway/cli-backends)
- [Harness Codex](/it/plugins/codex-harness)
- [Runtime harness Codex](/it/plugins/codex-harness-runtime)
- [Strumenti sandbox multi-agente](/it/tools/multi-agent-sandbox-tools)
- [`openclaw acp` (modalità bridge)](/it/cli/acp)
- [Sub-agenti](/it/tools/subagents)
