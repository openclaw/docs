---
read_when:
    - Esecuzione degli harness di codifica tramite ACP
    - Configurazione di sessioni ACP associate alla conversazione sui canali di messaggistica
    - Associare una conversazione su un canale di messaggistica a una sessione ACP persistente
    - Risoluzione dei problemi del backend ACP, del collegamento del Plugin o della consegna dei completamenti
    - Uso dei comandi /acp dalla chat
sidebarTitle: ACP agents
summary: Esegui harness di codifica esterni (Claude Code, Cursor, Gemini CLI, Codex ACP esplicito, OpenClaw ACP, OpenCode) tramite il backend ACP
title: agenti ACP
x-i18n:
    generated_at: "2026-04-30T09:14:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: c8257bdba22b613093da1a06761fdc5034cae4bca249ae91a531ec3fccabb954
    source_path: tools/acp-agents.md
    workflow: 16
---

Le sessioni [Agent Client Protocol (ACP)](https://agentclientprotocol.com/)
consentono a OpenClaw di eseguire harness di codifica esterni (per esempio Pi, Claude Code,
Cursor, Copilot, Droid, OpenClaw ACP, OpenCode, Gemini CLI e altri
harness ACPX supportati) tramite un plugin backend ACP.

Ogni avvio di sessione ACP viene tracciato come [attività in background](/it/automation/tasks).

<Note>
**ACP è il percorso per harness esterni, non il percorso Codex predefinito.** Il
plugin app-server Codex nativo possiede i controlli `/codex ...` e il
runtime incorporato `agentRuntime.id: "codex"`; ACP possiede i controlli
`/acp ...` e le sessioni `sessions_spawn({ runtime: "acp" })`.

Se vuoi che Codex o Claude Code si connettano come client MCP esterno
direttamente alle conversazioni di canale OpenClaw esistenti, usa
[`openclaw mcp serve`](/it/cli/mcp) invece di ACP.
</Note>

## Quale pagina mi serve?

| Vuoi…                                                                                           | Usa questo                            | Note                                                                                                                                                                                          |
| ----------------------------------------------------------------------------------------------- | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Collegare o controllare Codex nella conversazione corrente                                      | `/codex bind`, `/codex threads`       | Percorso app-server Codex nativo quando il plugin `codex` è abilitato; include risposte chat collegate, inoltro immagini, controlli modello/veloce/autorizzazioni, stop e guida. ACP è un fallback esplicito |
| Eseguire Claude Code, Gemini CLI, Codex ACP esplicito o un altro harness esterno _tramite_ OpenClaw | Questa pagina                         | Sessioni collegate alla chat, `/acp spawn`, `sessions_spawn({ runtime: "acp" })`, attività in background, controlli runtime                                                                    |
| Esporre una sessione OpenClaw Gateway _come_ server ACP per un editor o client                  | [`openclaw acp`](/it/cli/acp)            | Modalità bridge. L'IDE/client parla ACP con OpenClaw tramite stdio/WebSocket                                                                                                                   |
| Riutilizzare una CLI AI locale come modello fallback solo testo                                 | [Backend CLI](/it/gateway/cli-backends)  | Non ACP. Nessuno strumento OpenClaw, nessun controllo ACP, nessun runtime harness                                                                                                             |

## Funziona subito?

Di solito sì. Le nuove installazioni includono il plugin runtime `acpx` in bundle abilitato
per impostazione predefinita, con un binario `acpx` bloccato localmente al plugin che OpenClaw rileva
e autoripara all'avvio. Esegui `/acp doctor` per un controllo di prontezza.

OpenClaw istruisce gli agenti sull'avvio ACP solo quando ACP è **davvero
utilizzabile**: ACP deve essere abilitato, il dispatch non deve essere disabilitato, la sessione
corrente non deve essere bloccata dalla sandbox e deve essere caricato un backend
runtime. Se queste condizioni non sono soddisfatte, le Skills del plugin ACP e la
guida ACP di `sessions_spawn` restano nascoste, così l'agente non suggerisce
un backend non disponibile.

<AccordionGroup>
  <Accordion title="Problemi comuni al primo avvio">
    - Se `plugins.allow` è impostato, è un inventario plugin restrittivo e **deve** includere `acpx`; altrimenti il valore predefinito in bundle viene bloccato intenzionalmente e `/acp doctor` segnala la voce allowlist mancante.
    - L'adapter Codex ACP in bundle viene preparato con il plugin `acpx` e avviato localmente quando possibile.
    - Altri adapter harness di destinazione potrebbero comunque essere scaricati su richiesta con `npx` la prima volta che li usi.
    - L'autenticazione del fornitore deve comunque esistere sull'host per quell'harness.
    - Se l'host non ha npm o accesso di rete, i recuperi degli adapter al primo avvio falliscono finché le cache non vengono preriscaldate o l'adapter non viene installato in un altro modo.

  </Accordion>
  <Accordion title="Prerequisiti runtime">
    ACP avvia un vero processo harness esterno. OpenClaw possiede instradamento,
    stato delle attività in background, consegna, collegamenti e policy; l'harness
    possiede login provider, catalogo modelli, comportamento del filesystem e
    strumenti nativi.

    Prima di dare la colpa a OpenClaw, verifica:

    - `/acp doctor` segnali un backend abilitato e sano.
    - L'ID di destinazione sia consentito da `acp.allowedAgents` quando quella allowlist è impostata.
    - Il comando harness possa avviarsi sull'host Gateway.
    - L'autenticazione del provider sia presente per quell'harness (`claude`, `codex`, `gemini`, `opencode`, `droid`, ecc.).
    - Il modello selezionato esista per quell'harness: gli ID modello non sono portabili tra harness.
    - Il `cwd` richiesto esista e sia accessibile, oppure ometti `cwd` e lascia che il backend usi il suo valore predefinito.
    - La modalità di autorizzazione corrisponda al lavoro. Le sessioni non interattive non possono fare clic sui prompt di autorizzazione nativi, quindi le esecuzioni di codifica con molte scritture/esecuzioni di solito richiedono un profilo autorizzazioni ACPX che possa procedere senza interfaccia.

  </Accordion>
</AccordionGroup>

Gli strumenti dei plugin OpenClaw e gli strumenti OpenClaw integrati **non** sono esposti agli
harness ACP per impostazione predefinita. Abilita i bridge MCP espliciti in
[Agenti ACP — configurazione](/it/tools/acp-agents-setup) solo quando l'harness
deve chiamare direttamente quegli strumenti.

## Destinazioni harness supportate

Con il backend `acpx` in bundle, usa questi ID harness come destinazioni `/acp spawn <id>`
o `sessions_spawn({ runtime: "acp", agentId: "<id>" })`:

| ID harness | Backend tipico                                  | Note                                                                                |
| ---------- | ---------------------------------------------- | ----------------------------------------------------------------------------------- |
| `claude`   | Adapter Claude Code ACP                        | Richiede autenticazione Claude Code sull'host.                                      |
| `codex`    | Adapter Codex ACP                              | Solo fallback ACP esplicito quando `/codex` nativo non è disponibile o ACP è richiesto. |
| `copilot`  | Adapter GitHub Copilot ACP                     | Richiede autenticazione Copilot CLI/runtime.                                        |
| `cursor`   | Cursor CLI ACP (`cursor-agent acp`)            | Sostituisci il comando acpx se un'installazione locale espone un entrypoint ACP diverso. |
| `droid`    | Factory Droid CLI                              | Richiede autenticazione Factory/Droid o `FACTORY_API_KEY` nell'ambiente dell'harness. |
| `gemini`   | Adapter Gemini CLI ACP                         | Richiede autenticazione Gemini CLI o configurazione di una chiave API.              |
| `iflow`    | iFlow CLI                                      | Disponibilità dell'adapter e controllo del modello dipendono dalla CLI installata.  |
| `kilocode` | Kilo Code CLI                                  | Disponibilità dell'adapter e controllo del modello dipendono dalla CLI installata.  |
| `kimi`     | Kimi/Moonshot CLI                              | Richiede autenticazione Kimi/Moonshot sull'host.                                    |
| `kiro`     | Kiro CLI                                       | Disponibilità dell'adapter e controllo del modello dipendono dalla CLI installata.  |
| `opencode` | Adapter OpenCode ACP                           | Richiede autenticazione OpenCode CLI/provider.                                      |
| `openclaw` | Bridge OpenClaw Gateway tramite `openclaw acp` | Consente a un harness compatibile con ACP di parlare con una sessione OpenClaw Gateway. |
| `pi`       | Runtime Pi/OpenClaw incorporato                | Usato per esperimenti di harness nativi OpenClaw.                                   |
| `qwen`     | Qwen Code / Qwen CLI                           | Richiede autenticazione compatibile con Qwen sull'host.                             |

Gli alias agente acpx personalizzati possono essere configurati in acpx stesso, ma la policy OpenClaw
controlla comunque `acp.allowedAgents` e qualsiasi mappatura
`agents.list[].runtime.acp.agent` prima del dispatch.

## Runbook operatore

Flusso rapido `/acp` dalla chat:

<Steps>
  <Step title="Avvia">
    `/acp spawn claude --bind here`,
    `/acp spawn gemini --mode persistent --thread auto`, o esplicito
    `/acp spawn codex --bind here`.
  </Step>
  <Step title="Lavora">
    Continua nella conversazione o nel thread collegato (oppure indirizza esplicitamente la chiave
    di sessione).
  </Step>
  <Step title="Controlla lo stato">
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
  <Step title="Arresta">
    `/acp cancel` (turno corrente) o `/acp close` (sessione + collegamenti).
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Dettagli del ciclo di vita">
    - L'avvio crea o riprende una sessione runtime ACP, registra i metadati ACP nello store sessioni OpenClaw e può creare un'attività in background quando l'esecuzione è posseduta dal parent.
    - Le sessioni ACP possedute dal parent sono trattate come lavoro in background anche quando la sessione runtime è persistente; completamento e consegna cross-surface passano tramite il notificatore dell'attività parent invece di comportarsi come una normale sessione chat rivolta all'utente.
    - La manutenzione attività chiude le sessioni ACP one-shot terminali o orfane possedute dal parent. Le sessioni ACP persistenti vengono preservate finché resta un collegamento conversazione attivo; le sessioni persistenti obsolete senza un collegamento attivo vengono chiuse in modo che non possano essere riprese silenziosamente dopo che l'attività proprietaria è terminata o il suo record attività è sparito.
    - I messaggi di follow-up collegati vanno direttamente alla sessione ACP finché il collegamento non viene chiuso, defocalizzato, reimpostato o scaduto.
    - I comandi Gateway restano locali. `/acp ...`, `/status` e `/unfocus` non vengono mai inviati come normale testo di prompt a un harness ACP collegato.
    - `cancel` interrompe il turno attivo quando il backend supporta l'annullamento; non elimina il collegamento o i metadati della sessione.
    - `close` termina la sessione ACP dal punto di vista di OpenClaw e rimuove il collegamento. Un harness può comunque mantenere la propria cronologia upstream se supporta la ripresa.
    - I worker runtime inattivi sono idonei alla pulizia dopo `acp.runtime.ttlMinutes`; i metadati di sessione memorizzati restano disponibili per `/acp sessions`.

  </Accordion>
  <Accordion title="Regole di routing Codex nativo">
    Trigger in linguaggio naturale che devono essere instradati al **plugin Codex
    nativo** quando è abilitato:

    - "Collega questo canale Discord a Codex."
    - "Associa questa chat al thread Codex `<id>`."
    - "Mostra i thread Codex, poi collega questo."

    Il collegamento conversazione Codex nativo è il percorso di controllo chat predefinito.
    Gli strumenti dinamici OpenClaw vengono comunque eseguiti tramite OpenClaw, mentre
    gli strumenti nativi Codex come shell/apply-patch vengono eseguiti dentro Codex.
    Per gli eventi degli strumenti nativi Codex, OpenClaw inietta un relay hook nativo
    per turno in modo che gli hook dei plugin possano bloccare `before_tool_call`, osservare
    `after_tool_call` e instradare gli eventi Codex `PermissionRequest`
    tramite le approvazioni OpenClaw. Gli hook Codex `Stop` vengono inoltrati a
    OpenClaw `before_agent_finalize`, dove i plugin possono richiedere un ulteriore
    passaggio del modello prima che Codex finalizzi la risposta. Il relay resta
    deliberatamente conservativo: non modifica gli argomenti degli strumenti nativi Codex
    né riscrive i record dei thread Codex. Usa ACP esplicito solo
    quando vuoi il modello runtime/sessione ACP. Il confine di supporto Codex
    incorporato è documentato nel
    [contratto di supporto Codex harness v1](/it/plugins/codex-harness#v1-support-contract).

  </Accordion>
  <Accordion title="Promemoria per la selezione di modello / provider / runtime">
    - `openai-codex/*` — percorso PI Codex OAuth/abbonamento.
    - `openai/*` più `agentRuntime.id: "codex"` — runtime incorporato nativo del server dell'app Codex.
    - `/codex ...` — controllo nativo della conversazione Codex.
    - `/acp ...` o `runtime: "acp"` — controllo ACP/acpx esplicito.

  </Accordion>
  <Accordion title="Trigger in linguaggio naturale per l'instradamento ACP">
    Trigger che devono essere instradati al runtime ACP:

    - "Esegui questo come sessione Claude Code ACP one-shot e riassumi il risultato."
    - "Usa Gemini CLI per questo compito in un thread, poi mantieni i follow-up nello stesso thread."
    - "Esegui Codex tramite ACP in un thread in background."

    OpenClaw sceglie `runtime: "acp"`, risolve l'`agentId` dell'harness,
    si collega alla conversazione o al thread corrente quando supportato, e
    instrada i follow-up a quella sessione fino alla chiusura/scadenza. Codex segue
    questo percorso solo quando ACP/acpx è esplicito o il Plugin Codex nativo
    non è disponibile per l'operazione richiesta.

    Per `sessions_spawn`, `runtime: "acp"` viene pubblicizzato solo quando ACP
    è abilitato, il richiedente non è in sandbox e un backend runtime ACP
    è caricato. `acp.dispatch.enabled=false` mette in pausa il dispatch automatico
    dei thread ACP ma non nasconde né blocca le chiamate esplicite a
    `sessions_spawn({ runtime: "acp" })`. Ha come destinazione id di harness ACP come `codex`,
    `claude`, `droid`, `gemini` o `opencode`. Non passare un normale
    id agente di configurazione OpenClaw da `agents_list` a meno che quella voce non sia
    configurata esplicitamente con `agents.list[].runtime.type="acp"`;
    altrimenti usa il runtime sub-agent predefinito. Quando un agente OpenClaw
    è configurato con `runtime.type="acp"`, OpenClaw usa
    `runtime.acp.agent` come id dell'harness sottostante.

  </Accordion>
</AccordionGroup>

## ACP rispetto ai sub-agent

Usa ACP quando vuoi un runtime harness esterno. Usa il **server dell'app Codex
nativo** per collegamento/controllo delle conversazioni Codex quando il Plugin
`codex` è abilitato. Usa i **sub-agent** quando vuoi esecuzioni delegate
native di OpenClaw.

| Area          | Sessione ACP                         | Esecuzione sub-agent              |
| ------------- | ------------------------------------- | ---------------------------------- |
| Runtime       | Plugin backend ACP (per esempio acpx) | Runtime sub-agent nativo OpenClaw |
| Chiave sessione | `agent:<agentId>:acp:<uuid>`        | `agent:<agentId>:subagent:<uuid>` |
| Comandi principali | `/acp ...`                      | `/subagents ...`                  |
| Strumento di spawn | `sessions_spawn` con `runtime:"acp"` | `sessions_spawn` (runtime predefinito) |

Vedi anche [Sub-agent](/it/tools/subagents).

## Come ACP esegue Claude Code

Per Claude Code tramite ACP, lo stack è:

1. Piano di controllo delle sessioni ACP di OpenClaw.
2. Plugin runtime `acpx` incluso.
3. Adattatore ACP di Claude.
4. Meccanismi runtime/sessione lato Claude.

ACP Claude è una **sessione harness** con controlli ACP, ripresa della sessione,
tracciamento delle attività in background e collegamento opzionale a conversazione/thread.

I backend CLI sono runtime di fallback locali separati, solo testuali: vedi
[Backend CLI](/it/gateway/cli-backends).

Per gli operatori, la regola pratica è:

- **Vuoi `/acp spawn`, sessioni collegabili, controlli runtime o lavoro harness persistente?** Usa ACP.
- **Vuoi un semplice fallback testuale locale tramite la CLI grezza?** Usa i backend CLI.

## Sessioni collegate

### Modello mentale

- **Superficie chat** — dove le persone continuano a parlare (canale Discord, argomento Telegram, chat iMessage).
- **Sessione ACP** — lo stato runtime durevole Codex/Claude/Gemini a cui OpenClaw instrada.
- **Thread/argomento figlio** — una superficie di messaggistica aggiuntiva opzionale creata solo da `--thread ...`.
- **Workspace runtime** — la posizione nel filesystem (`cwd`, checkout del repo, workspace backend) in cui l'harness viene eseguito. Indipendente dalla superficie chat.

### Collegamenti alla conversazione corrente

`/acp spawn <harness> --bind here` fissa la conversazione corrente alla
sessione ACP avviata: nessun thread figlio, stessa superficie chat. OpenClaw continua
a possedere trasporto, autenticazione, sicurezza e consegna. I messaggi di follow-up in quella
conversazione vengono instradati alla stessa sessione; `/new` e `/reset` reimpostano la
sessione sul posto; `/acp close` rimuove il collegamento.

Esempi:

```text
/codex bind                                              # collegamento Codex nativo, instrada qui i messaggi futuri
/codex model gpt-5.4                                     # regola il thread Codex nativo collegato
/codex stop                                              # controlla il turno Codex nativo attivo
/acp spawn codex --bind here                             # fallback ACP esplicito per Codex
/acp spawn codex --thread auto                           # può creare un thread/argomento figlio e collegarlo lì
/acp spawn codex --bind here --cwd /workspace/repo       # stesso collegamento chat, Codex viene eseguito in /workspace/repo
```

<AccordionGroup>
  <Accordion title="Regole di collegamento ed esclusività">
    - `--bind here` e `--thread ...` si escludono a vicenda.
    - `--bind here` funziona solo sui canali che dichiarano il collegamento alla conversazione corrente; altrimenti OpenClaw restituisce un messaggio chiaro di non supporto. I collegamenti persistono tra i riavvii del Gateway.
    - Su Discord, `spawnAcpSessions` è richiesto solo quando OpenClaw deve creare un thread figlio per `--thread auto|here`, non per `--bind here`.
    - Se avvii un agente ACP diverso senza `--cwd`, OpenClaw eredita per impostazione predefinita il workspace dell'**agente di destinazione**. I percorsi ereditati mancanti (`ENOENT`/`ENOTDIR`) ripiegano al valore predefinito del backend; altri errori di accesso (per esempio `EACCES`) emergono come errori di spawn.
    - I comandi di gestione del Gateway rimangono locali nelle conversazioni collegate: i comandi `/acp ...` sono gestiti da OpenClaw anche quando il normale testo di follow-up viene instradato alla sessione ACP collegata; anche `/status` e `/unfocus` rimangono locali ogni volta che la gestione dei comandi è abilitata per quella superficie.

  </Accordion>
  <Accordion title="Sessioni collegate a thread">
    Quando i collegamenti thread sono abilitati per un adattatore di canale:

    - OpenClaw collega un thread a una sessione ACP di destinazione.
    - I messaggi di follow-up in quel thread vengono instradati alla sessione ACP collegata.
    - L'output ACP viene consegnato di nuovo allo stesso thread.
    - Unfocus/chiusura/archiviazione/timeout di inattività o scadenza per età massima rimuove il collegamento.
    - `/acp close`, `/acp cancel`, `/acp status`, `/status` e `/unfocus` sono comandi Gateway, non prompt per l'harness ACP.

    Flag funzionalità richiesti per ACP collegato a thread:

    - `acp.enabled=true`
    - `acp.dispatch.enabled` è attivo per impostazione predefinita (imposta `false` per mettere in pausa il dispatch automatico dei thread ACP; le chiamate esplicite a `sessions_spawn({ runtime: "acp" })` continuano a funzionare).
    - Flag di spawn thread ACP dell'adattatore di canale abilitato (specifico dell'adattatore):
      - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`

    Il supporto dei collegamenti thread è specifico dell'adattatore. Se l'adattatore del canale attivo
    non supporta i collegamenti thread, OpenClaw restituisce un messaggio chiaro
    di non supporto/non disponibilità.

  </Accordion>
  <Accordion title="Canali che supportano i thread">
    - Qualsiasi adattatore di canale che espone la capacità di collegamento sessione/thread.
    - Supporto integrato attuale: thread/canali **Discord**, argomenti **Telegram** (argomenti forum in gruppi/supergruppi e argomenti DM).
    - I canali Plugin possono aggiungere supporto tramite la stessa interfaccia di collegamento.

  </Accordion>
</AccordionGroup>

## Collegamenti canale persistenti

Per workflow non effimeri, configura collegamenti ACP persistenti nelle
voci `bindings[]` di primo livello.

### Modello di collegamento

<ParamField path="bindings[].type" type='"acp"'>
  Contrassegna un collegamento conversazione ACP persistente.
</ParamField>
<ParamField path="bindings[].match" type="object">
  Identifica la conversazione di destinazione. Forme per canale:

- **Canale/thread Discord:** `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
- **Argomento forum Telegram:** `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
- **DM/gruppo BlueBubbles:** `match.channel="bluebubbles"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`. Preferisci `chat_id:*` o `chat_identifier:*` per collegamenti gruppo stabili.
- **DM/gruppo iMessage:** `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`. Preferisci `chat_id:*` per collegamenti gruppo stabili.

</ParamField>
<ParamField path="bindings[].agentId" type="string">
  L'id dell'agente OpenClaw proprietario.
</ParamField>
<ParamField path="bindings[].acp.mode" type='"persistent" | "oneshot"'>
  Override ACP opzionale.
</ParamField>
<ParamField path="bindings[].acp.label" type="string">
  Etichetta opzionale rivolta all'operatore.
</ParamField>
<ParamField path="bindings[].acp.cwd" type="string">
  Directory di lavoro runtime opzionale.
</ParamField>
<ParamField path="bindings[].acp.backend" type="string">
  Override backend opzionale.
</ParamField>

### Impostazioni runtime predefinite per agente

Usa `agents.list[].runtime` per definire una volta i valori predefiniti ACP per agente:

- `agents.list[].runtime.type="acp"`
- `agents.list[].runtime.acp.agent` (id harness, per esempio `codex` o `claude`)
- `agents.list[].runtime.acp.backend`
- `agents.list[].runtime.acp.mode`
- `agents.list[].runtime.acp.cwd`

**Precedenza degli override per sessioni ACP collegate:**

1. `bindings[].acp.*`
2. `agents.list[].runtime.acp.*`
3. Valori predefiniti ACP globali (per esempio `acp.backend`)

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
- Nelle conversazioni collegate, `/new` e `/reset` reimpostano sul posto la stessa chiave sessione ACP.
- I collegamenti runtime temporanei (per esempio creati da flussi di focus thread) continuano ad applicarsi dove presenti.
- Per spawn ACP tra agenti senza un `cwd` esplicito, OpenClaw eredita il workspace dell'agente di destinazione dalla configurazione dell'agente.
- I percorsi workspace ereditati mancanti ripiegano al cwd predefinito del backend; gli errori di accesso non dovuti a mancanza emergono come errori di spawn.

## Avviare sessioni ACP

Due modi per avviare una sessione ACP:

<Tabs>
  <Tab title="Da sessions_spawn">
    Usa `runtime: "acp"` per avviare una sessione ACP da un turno agente o da una
    chiamata strumento.

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
    `runtime` usa come impostazione predefinita `subagent`, quindi imposta `runtime: "acp"` esplicitamente
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
  ID dell'harness di destinazione ACP. Usa `acp.defaultAgent` come fallback se impostato.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  Richiede il flusso di associazione del thread dove supportato.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  `"run"` è one-shot; `"session"` è persistente. Se `thread: true` e
  `mode` viene omesso, OpenClaw può usare come impostazione predefinita il comportamento persistente in base al
  percorso runtime. `mode: "session"` richiede `thread: true`.
</ParamField>
<ParamField path="cwd" type="string">
  Directory di lavoro runtime richiesta (validata dalla policy backend/runtime).
  Se omessa, lo spawn ACP eredita l'area di lavoro dell'agente di destinazione
  quando configurata; i percorsi ereditati mancanti usano come fallback le impostazioni predefinite del backend,
  mentre gli errori di accesso reali vengono restituiti.
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
  (`<sessionId>.acp-stream.jsonl`) che puoi seguire con tail per la cronologia completa del relay.
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  Interrompe il turno figlio ACP dopo N secondi. `0` mantiene il turno sul
  percorso senza timeout del gateway. Lo stesso valore viene applicato al Gateway
  run e al runtime ACP, così gli harness bloccati o con quota esaurita non
  occupano indefinitamente la corsia dell'agente padre.
</ParamField>
<ParamField path="model" type="string">
  Override esplicito del modello per la sessione figlia ACP. Gli spawn Codex ACP
  normalizzano i riferimenti OpenClaw Codex come `openai-codex/gpt-5.4` nella configurazione
  di avvio Codex ACP prima di `session/new`; le forme slash come
  `openai-codex/gpt-5.4/high` impostano anche l'effort di ragionamento Codex ACP.
  Gli altri harness devono dichiarare ACP `models` e supportare
  `session/set_model`; altrimenti OpenClaw/acpx fallisce in modo chiaro invece di
  tornare silenziosamente all'impostazione predefinita dell'agente di destinazione.
</ParamField>
<ParamField path="thinking" type="string">
  Effort esplicito di pensiero/ragionamento. Per Codex ACP, `minimal` corrisponde a
  effort basso, `low`/`medium`/`high`/`xhigh` corrispondono direttamente, e `off`
  omette l'override di avvio dell'effort di ragionamento.
</ParamField>

## Modalità di associazione e thread dello spawn

<Tabs>
  <Tab title="--bind here|off">
    | Modalità | Comportamento                                                                    |
    | -------- | -------------------------------------------------------------------------------- |
    | `here`   | Associa sul posto la conversazione attiva corrente; fallisce se non ce n'è una. |
    | `off`    | Non creare un'associazione alla conversazione corrente.                          |

    Note:

    - `--bind here` è il percorso operatore più semplice per "rendere questo canale o questa chat supportati da Codex."
    - `--bind here` non crea un thread figlio.
    - `--bind here` è disponibile solo sui canali che espongono il supporto all'associazione della conversazione corrente.
    - `--bind` e `--thread` non possono essere combinati nella stessa chiamata `/acp spawn`.

  </Tab>
  <Tab title="--thread auto|here|off">
    | Modalità | Comportamento                                                                                                  |
    | -------- | -------------------------------------------------------------------------------------------------------------- |
    | `auto`   | In un thread attivo: associa quel thread. Fuori da un thread: crea/associa un thread figlio quando supportato. |
    | `here`   | Richiede il thread attivo corrente; fallisce se non ci si trova in uno.                                        |
    | `off`    | Nessuna associazione. La sessione parte non associata.                                                         |

    Note:

    - Sulle superfici senza associazione di thread, il comportamento predefinito è di fatto `off`.
    - Lo spawn associato a un thread richiede il supporto della policy del canale:
      - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`
    - Usa `--bind here` quando vuoi fissare la conversazione corrente senza creare un thread figlio.

  </Tab>
</Tabs>

## Modello di consegna

Le sessioni ACP possono essere spazi di lavoro interattivi oppure lavoro in
background di proprietà del padre. Il percorso di consegna dipende da questa forma.

<AccordionGroup>
  <Accordion title="Interactive ACP sessions">
    Le sessioni interattive sono pensate per continuare a parlare su una superficie
    di chat visibile:

    - `/acp spawn ... --bind here` associa la conversazione corrente alla sessione ACP.
    - `/acp spawn ... --thread ...` associa un thread/topic di canale alla sessione ACP.
    - Le configurazioni persistenti `bindings[].type="acp"` instradano le conversazioni corrispondenti alla stessa sessione ACP.

    I messaggi di follow-up nella conversazione associata vengono instradati direttamente alla
    sessione ACP e l'output ACP viene riconsegnato allo stesso
    canale/thread/topic.

    Cosa OpenClaw invia all'harness:

    - I normali follow-up associati vengono inviati come testo del prompt, più gli allegati solo quando l'harness/backend li supporta.
    - I comandi di gestione `/acp` e i comandi Gateway locali vengono intercettati prima dell'invio ad ACP.
    - Gli eventi di completamento generati dal runtime vengono materializzati per destinazione. Gli agenti OpenClaw ricevono l'envelope interno runtime-context di OpenClaw; gli harness ACP esterni ricevono un prompt semplice con il risultato figlio e l'istruzione. L'envelope grezzo `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>` non deve mai essere inviato a harness esterni né persistito come testo della trascrizione utente ACP.
    - Le voci della trascrizione ACP usano il testo trigger visibile all'utente o il prompt di completamento semplice. I metadati degli eventi interni restano strutturati in OpenClaw dove possibile e non vengono trattati come contenuto chat scritto dall'utente.

  </Accordion>
  <Accordion title="Parent-owned one-shot ACP sessions">
    Le sessioni ACP one-shot avviate da un'altra esecuzione agente sono figli in
    background, simili ai sub-agenti:

    - Il padre richiede lavoro con `sessions_spawn({ runtime: "acp", mode: "run" })`.
    - Il figlio viene eseguito nella propria sessione harness ACP.
    - I turni del figlio vengono eseguiti sulla stessa corsia in background usata dagli spawn nativi dei sub-agenti, così un harness ACP lento non blocca il lavoro non correlato della sessione principale.
    - Il completamento viene riportato tramite il percorso di annuncio del completamento attività. OpenClaw converte i metadati interni di completamento in un prompt ACP semplice prima di inviarlo a un harness esterno, così gli harness non vedono i marcatori di contesto runtime specifici di OpenClaw.
    - Il padre riscrive il risultato del figlio nella normale voce dell'assistente quando è utile una risposta visibile all'utente.

    **Non** trattare questo percorso come una chat peer-to-peer tra padre
    e figlio. Il figlio ha già un canale di completamento di ritorno al
    padre.

  </Accordion>
  <Accordion title="sessions_send and A2A delivery">
    `sessions_send` può puntare a un'altra sessione dopo lo spawn. Per le normali
    sessioni peer, OpenClaw usa un percorso di follow-up agent-to-agent (A2A)
    dopo aver inserito il messaggio:

    - Attendi la risposta della sessione di destinazione.
    - Facoltativamente, consenti a richiedente e destinazione di scambiarsi un numero limitato di turni di follow-up.
    - Chiedi alla destinazione di produrre un messaggio di annuncio.
    - Consegna quell'annuncio al canale o thread visibile.

    Quel percorso A2A è un fallback per gli invii peer in cui il mittente ha bisogno di
    un follow-up visibile. Resta abilitato quando una sessione non correlata può
    vedere e inviare messaggi a una destinazione ACP, per esempio con impostazioni
    ampie di `tools.sessions.visibility`.

    OpenClaw salta il follow-up A2A solo quando il richiedente è il
    padre del proprio figlio ACP one-shot di proprietà del padre. In quel caso,
    eseguire A2A sopra il completamento attività può svegliare il padre con il
    risultato del figlio, inoltrare la risposta del padre di nuovo nel figlio e
    creare un ciclo di eco padre/figlio. Il risultato di `sessions_send` riporta
    `delivery.status="skipped"` per quel caso di figlio posseduto, perché il
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

    - Passa una sessione Codex dal tuo laptop al tuo telefono: di' al tuo agente di riprendere da dove avevi interrotto.
    - Continua una sessione di coding che hai avviato interattivamente nella CLI, ora in modalità headless tramite il tuo agente.
    - Riprendi un lavoro interrotto da un riavvio del gateway o da un timeout di inattività.

    Note:

    - `resumeSessionId` si applica solo quando `runtime: "acp"`; il runtime sub-agente predefinito ignora questo campo solo ACP.
    - `streamTo` si applica solo quando `runtime: "acp"`; il runtime sub-agente predefinito ignora questo campo solo ACP.
    - `resumeSessionId` è un ID di ripresa ACP/harness locale all'host, non una chiave di sessione canale OpenClaw; OpenClaw controlla comunque la policy di spawn ACP e la policy dell'agente di destinazione prima dell'invio, mentre il backend ACP o l'harness possiede l'autorizzazione per caricare quell'ID upstream.
    - `resumeSessionId` ripristina la cronologia della conversazione ACP upstream; `thread` e `mode` si applicano comunque normalmente alla nuova sessione OpenClaw che stai creando, quindi `mode: "session"` richiede comunque `thread: true`.
    - L'agente di destinazione deve supportare `session/load` (Codex e Claude Code lo fanno).
    - Se l'ID sessione non viene trovato, lo spawn fallisce con un errore chiaro: nessun fallback silenzioso a una nuova sessione.

  </Accordion>
  <Accordion title="Post-deploy smoke test">
    Dopo un deploy del gateway, esegui un controllo end-to-end live invece di
    fidarti dei test unitari:

    1. Verifica la versione e il commit del gateway distribuito sull'host di destinazione.
    2. Apri una sessione bridge ACPX temporanea verso un agente live.
    3. Chiedi a quell'agente di chiamare `sessions_spawn` con `runtime: "acp"`, `agentId: "codex"`, `mode: "run"` e attività `Reply with exactly LIVE-ACP-SPAWN-OK`.
    4. Verifica `accepted=yes`, un vero `childSessionKey` e nessun errore del validatore.
    5. Pulisci la sessione bridge temporanea.

    Mantieni il gate su `mode: "run"` e salta `streamTo: "parent"`:
    `mode: "session"` associato a thread e i percorsi stream-relay sono passaggi
    di integrazione più ricchi separati.

  </Accordion>
</AccordionGroup>

## Compatibilità sandbox

Le sessioni ACP attualmente vengono eseguite sul runtime host, **non** dentro la
sandbox OpenClaw.

<Warning>
**Confine di sicurezza:**

- L'harness esterno può leggere/scrivere in base alle proprie autorizzazioni CLI e al `cwd` selezionato.
- La policy sandbox di OpenClaw **non** incapsula l'esecuzione dell'harness ACP.
- OpenClaw applica comunque i gate di funzionalità ACP, gli agenti consentiti, la proprietà delle sessioni, i binding dei canali e la policy di consegna del Gateway.
- Usa `runtime: "subagent"` per lavoro nativo OpenClaw applicato tramite sandbox.

</Warning>

Limitazioni attuali:

- Se la sessione del richiedente è sandboxed, gli spawn ACP sono bloccati sia per `sessions_spawn({ runtime: "acp" })` sia per `/acp spawn`.
- `sessions_spawn` con `runtime: "acp"` non supporta `sandbox: "require"`.

## Risoluzione del target della sessione

La maggior parte delle azioni `/acp` accetta un target di sessione opzionale (`session-key`,
`session-id` o `session-label`).

**Ordine di risoluzione:**

1. Argomento target esplicito (o `--session` per `/acp steer`)
   - prova la chiave
   - poi l'id sessione in formato UUID
   - poi l'etichetta
2. Binding del thread corrente (se questa conversazione/thread è associata a una sessione ACP).
3. Fallback alla sessione corrente del richiedente.

Sia i binding della conversazione corrente sia i binding del thread partecipano al
passaggio 2.

Se nessun target viene risolto, OpenClaw restituisce un errore chiaro
(`Unable to resolve session target: ...`).

## Controlli ACP

| Comando              | Cosa fa                                                   | Esempio                                                       |
| -------------------- | --------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | Crea una sessione ACP; binding corrente o del thread opzionale. | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | Annulla il turno in corso per la sessione target.         | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | Invia un'istruzione di guida alla sessione in esecuzione. | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | Chiude la sessione e rimuove i binding dei target del thread. | `/acp close`                                                  |
| `/acp status`        | Mostra backend, modalità, stato, opzioni di runtime, funzionalità. | `/acp status`                                                 |
| `/acp set-mode`      | Imposta la modalità di runtime per la sessione target.    | `/acp set-mode plan`                                          |
| `/acp set`           | Scrive un'opzione generica di configurazione runtime.     | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | Imposta l'override della directory di lavoro runtime.     | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | Imposta il profilo della policy di approvazione.          | `/acp permissions strict`                                     |
| `/acp timeout`       | Imposta il timeout runtime (secondi).                     | `/acp timeout 120`                                            |
| `/acp model`         | Imposta l'override del modello runtime.                   | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | Rimuove gli override delle opzioni runtime della sessione. | `/acp reset-options`                                          |
| `/acp sessions`      | Elenca le sessioni ACP recenti dallo store.               | `/acp sessions`                                               |
| `/acp doctor`        | Salute del backend, funzionalità, correzioni azionabili.  | `/acp doctor`                                                 |
| `/acp install`       | Stampa passaggi deterministici di installazione e abilitazione. | `/acp install`                                                |

`/acp status` mostra le opzioni runtime effettive più gli identificatori di sessione a livello runtime e
a livello backend. Gli errori di controllo non supportato emergono
chiaramente quando a un backend manca una funzionalità. `/acp sessions` legge lo
store per la sessione corrente associata o del richiedente; i token target
(`session-key`, `session-id` o `session-label`) si risolvono tramite
la discovery delle sessioni del Gateway, incluse le root `session.store`
personalizzate per agente.

### Mappatura delle opzioni di runtime

`/acp` offre comandi di comodità e un setter generico. Operazioni
equivalenti:

| Comando                      | Mappato a                            | Note                                                                                                                                                                          |
| ---------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `/acp model <id>`            | chiave di configurazione runtime `model` | Per Codex ACP, OpenClaw normalizza `openai-codex/<model>` nell'id modello dell'adapter e mappa suffissi di reasoning con slash, come `openai-codex/gpt-5.4/high`, a `reasoning_effort`. |
| `/acp set thinking <level>`  | chiave di configurazione runtime `thinking` | Per Codex ACP, OpenClaw invia il `reasoning_effort` corrispondente dove l'adapter ne supporta uno.                                                                             |
| `/acp permissions <profile>` | chiave di configurazione runtime `approval_policy` | —                                                                                                                                                                              |
| `/acp timeout <seconds>`     | chiave di configurazione runtime `timeout` | —                                                                                                                                                                              |
| `/acp cwd <path>`            | override del cwd runtime             | Aggiornamento diretto.                                                                                                                                                         |
| `/acp set <key> <value>`     | generico                             | `key=cwd` usa il percorso di override del cwd.                                                                                                                                 |
| `/acp reset-options`         | cancella tutti gli override runtime  | —                                                                                                                                                                              |

## Harness acpx, configurazione del plugin e autorizzazioni

Per la configurazione dell'harness acpx (alias Claude Code / Codex / Gemini CLI), i bridge MCP plugin-tools e OpenClaw-tools, e le modalità di autorizzazione ACP, consulta
[Agenti ACP — configurazione](/it/tools/acp-agents-setup).

## Risoluzione dei problemi

| Sintomo                                                                     | Causa probabile                                                                                                      | Correzione                                                                                                                                                                      |
| --------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ACP runtime backend is not configured`                                     | Plugin di backend mancante, disabilitato o bloccato da `plugins.allow`.                                              | Installa e abilita il Plugin di backend, includi `acpx` in `plugins.allow` quando quell'elenco consentito è impostato, quindi esegui `/acp doctor`.                              |
| `ACP is disabled by policy (acp.enabled=false)`                             | ACP disabilitato globalmente.                                                                                        | Imposta `acp.enabled=true`.                                                                                                                                                     |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`           | Invio automatico dai messaggi normali della discussione disabilitato.                                                | Imposta `acp.dispatch.enabled=true` per riprendere l'instradamento automatico delle discussioni; le chiamate esplicite `sessions_spawn({ runtime: "acp" })` funzionano ancora.   |
| `ACP agent "<id>" is not allowed by policy`                                 | Agente non presente nell'elenco consentito.                                                                          | Usa un `agentId` consentito o aggiorna `acp.allowedAgents`.                                                                                                                     |
| `/acp doctor` segnala che il backend non è pronto subito dopo l'avvio       | Il probe della dipendenza del Plugin o l'autoriparazione è ancora in esecuzione.                                     | Attendi brevemente e riesegui `/acp doctor`; se resta non integro, ispeziona l'errore di installazione del backend e la policy di autorizzazione/blocco dei Plugin.             |
| Comando dell'harness non trovato                                            | La CLI dell'adattatore non è installata, le dipendenze del Plugin preparato mancano, oppure il primo recupero `npx` non è riuscito per un adattatore non Codex. | Esegui `/acp doctor`, ripara le dipendenze del Plugin, installa/preriscalda l'adattatore sull'host Gateway oppure configura esplicitamente il comando dell'agente acpx.          |
| Modello non trovato dall'harness                                            | L'id del modello è valido per un altro provider/harness ma non per questa destinazione ACP.                          | Usa un modello elencato da quell'harness, configura il modello nell'harness oppure ometti l'override.                                                                           |
| Errore di autenticazione del fornitore dall'harness                         | OpenClaw è integro, ma la CLI/il provider di destinazione non ha effettuato l'accesso.                              | Effettua l'accesso o fornisci la chiave provider richiesta nell'ambiente dell'host Gateway.                                                                                     |
| `Unable to resolve session target: ...`                                     | Token chiave/id/etichetta errato.                                                                                    | Esegui `/acp sessions`, copia la chiave/etichetta esatta e riprova.                                                                                                             |
| `--bind here requires running /acp spawn inside an active ... conversation` | `--bind here` usato senza una conversazione attiva collegabile.                                                      | Passa alla chat/canale di destinazione e riprova, oppure usa uno spawn non associato.                                                                                           |
| `Conversation bindings are unavailable for <channel>.`                      | L'adattatore non dispone della funzionalità ACP di associazione alla conversazione corrente.                         | Usa `/acp spawn ... --thread ...` dove supportato, configura `bindings[]` di livello superiore oppure passa a un canale supportato.                                             |
| `--thread here requires running /acp spawn inside an active ... thread`     | `--thread here` usato fuori da un contesto di discussione.                                                           | Passa alla discussione di destinazione oppure usa `--thread auto`/`off`.                                                                                                        |
| `Only <user-id> can rebind this channel/conversation/thread.`               | Un altro utente possiede la destinazione di associazione attiva.                                                     | Riesegui l'associazione come proprietario oppure usa una conversazione o una discussione diversa.                                                                               |
| `Thread bindings are unavailable for <channel>.`                            | L'adattatore non dispone della funzionalità di associazione alle discussioni.                                        | Usa `--thread off` oppure passa a un adattatore/canale supportato.                                                                                                              |
| `Sandboxed sessions cannot spawn ACP sessions ...`                          | Il runtime ACP è lato host; la sessione richiedente è in sandbox.                                                    | Usa `runtime="subagent"` dalle sessioni in sandbox oppure esegui lo spawn ACP da una sessione non in sandbox.                                                                   |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`     | `sandbox="require"` richiesto per il runtime ACP.                                                                    | Usa `runtime="subagent"` per il sandboxing richiesto oppure usa ACP con `sandbox="inherit"` da una sessione non in sandbox.                                                     |
| `Cannot apply --model ... did not advertise model support`                  | L'harness di destinazione non espone il cambio modello ACP generico.                                                 | Usa un harness che dichiara ACP `models`/`session/set_model`, usa i riferimenti modello ACP Codex oppure configura il modello direttamente nell'harness se ha il proprio flag di avvio. |
| Metadati ACP mancanti per la sessione associata                             | Metadati della sessione ACP obsoleti/eliminati.                                                                      | Ricrea con `/acp spawn`, quindi riassocia/metti a fuoco la discussione.                                                                                                         |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`    | `permissionMode` blocca scritture/esecuzioni nella sessione ACP non interattiva.                                     | Imposta `plugins.entries.acpx.config.permissionMode` su `approve-all` e riavvia il gateway. Vedi [Configurazione dei permessi](/it/tools/acp-agents-setup#permission-configuration). |
| La sessione ACP fallisce presto con poco output                             | I prompt dei permessi sono bloccati da `permissionMode`/`nonInteractivePermissions`.                                 | Controlla i log del gateway per `AcpRuntimeError`. Per permessi completi, imposta `permissionMode=approve-all`; per una degradazione controllata, imposta `nonInteractivePermissions=deny`. |
| La sessione ACP resta bloccata indefinitamente dopo aver completato il lavoro | Il processo dell'harness è terminato ma la sessione ACP non ha segnalato il completamento.                           | Monitora con `ps aux \| grep acpx`; termina manualmente i processi obsoleti.                                                                                                    |
| L'harness vede `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>`                      | Envelope di evento interno trapelato oltre il confine ACP.                                                          | Aggiorna OpenClaw e riesegui il flusso di completamento; gli harness esterni dovrebbero ricevere solo prompt di completamento in chiaro.                                       |

## Correlati

- [Agenti ACP — configurazione](/it/tools/acp-agents-setup)
- [Invio agente](/it/tools/agent-send)
- [Backend CLI](/it/gateway/cli-backends)
- [Harness Codex](/it/plugins/codex-harness)
- [Strumenti sandbox multi-agente](/it/tools/multi-agent-sandbox-tools)
- [`openclaw acp` (modalità bridge)](/it/cli/acp)
- [Sotto-agenti](/it/tools/subagents)
