---
read_when:
    - Esecuzione degli harness di coding tramite ACP
    - Configurare sessioni ACP legate alla conversazione sui canali di messaggistica
    - Associare una conversazione del canale di messaggistica a una sessione ACP persistente
    - Risoluzione dei problemi del backend ACP, del cablaggio dei Plugin o della consegna dei completamenti
    - Eseguire comandi /acp dalla chat
sidebarTitle: ACP agents
summary: Esegui harness di coding esterni (Claude Code, Cursor, Gemini CLI, Codex ACP esplicito, OpenClaw ACP, OpenCode) tramite il backend ACP
title: Agenti ACP
x-i18n:
    generated_at: "2026-06-27T18:18:00Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a9ad2fd3dec35062209b5e66a3ec301e8fa247d10a48787e54b938b10b314aee
    source_path: tools/acp-agents.md
    workflow: 16
---

[Agent Client Protocol (ACP)](https://agentclientprotocol.com/) sessions
consentono a OpenClaw di eseguire harness di codifica esterni (per esempio Claude Code,
Cursor, Copilot, Droid, OpenClaw ACP, OpenCode, Gemini CLI e altri
harness ACPX supportati) tramite un Plugin backend ACP.

Ogni spawn di sessione ACP viene tracciato come [attività in background](/it/automation/tasks).

<Note>
**ACP è il percorso per harness esterni, non il percorso Codex predefinito.** Il
Plugin app-server Codex nativo possiede i controlli `/codex ...` e il runtime incorporato
`openai/gpt-*` predefinito per i turni dell'agente; ACP possiede
i controlli `/acp ...` e le sessioni `sessions_spawn({ runtime: "acp" })`.

Se vuoi che Codex o Claude Code si connettano come client MCP esterni
direttamente alle conversazioni di canale OpenClaw esistenti, usa
[`openclaw mcp serve`](/it/cli/mcp) invece di ACP.
</Note>

## Quale pagina mi serve?

| Vuoi…                                                                                           | Usa questo                            | Note                                                                                                                                                                                         |
| ----------------------------------------------------------------------------------------------- | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Associare o controllare Codex nella conversazione corrente                                      | `/codex bind`, `/codex threads`       | Percorso app-server Codex nativo quando il Plugin `codex` è abilitato; include risposte chat associate, inoltro immagini, controlli modello/veloce/permessi, stop e guida. ACP è un fallback esplicito |
| Eseguire Claude Code, Gemini CLI, Codex ACP esplicito o un altro harness esterno _tramite_ OpenClaw | Questa pagina                         | Sessioni associate alla chat, `/acp spawn`, `sessions_spawn({ runtime: "acp" })`, attività in background, controlli runtime                                                                   |
| Esporre una sessione Gateway OpenClaw _come_ server ACP per un editor o client                  | [`openclaw acp`](/it/cli/acp)            | Modalità bridge. IDE/client parla ACP con OpenClaw tramite stdio/WebSocket                                                                                                                    |
| Riutilizzare una CLI AI locale come modello fallback solo testo                                 | [Backend CLI](/it/gateway/cli-backends) | Non ACP. Nessuno strumento OpenClaw, nessun controllo ACP, nessun runtime harness                                                                                                             |

## Funziona subito?

Sì, dopo aver installato il Plugin runtime ACP ufficiale:

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

I checkout sorgente possono usare il Plugin workspace locale `extensions/acpx` dopo
`pnpm install`. Esegui `/acp doctor` per un controllo di prontezza.

OpenClaw informa gli agenti sullo spawn ACP solo quando ACP è **davvero
utilizzabile**: ACP deve essere abilitato, il dispatch non deve essere disabilitato, la sessione
corrente non deve essere bloccata dalla sandbox e un backend runtime deve essere
caricato. Se queste condizioni non sono soddisfatte, le Skills del Plugin ACP e
la guida ACP di `sessions_spawn` restano nascoste, così l'agente non suggerisce
un backend non disponibile.

<AccordionGroup>
  <Accordion title="Problemi comuni al primo avvio">
    - Se `plugins.allow` è impostato, è un inventario Plugin restrittivo e **deve** includere `acpx`; altrimenti il backend ACP installato viene bloccato intenzionalmente e `/acp doctor` segnala la voce allowlist mancante.
    - L'adattatore Codex ACP viene predisposto con il Plugin `acpx` e avviato localmente quando possibile.
    - Codex ACP viene eseguito con un `CODEX_HOME` isolato; OpenClaw copia le voci di progetto attendibili più la configurazione sicura di routing modello/provider dalla configurazione Codex dell'host, mentre auth, notifiche e hook restano nella configurazione dell'host.
    - Altri adattatori harness di destinazione possono comunque essere recuperati su richiesta con `npx` la prima volta che li usi.
    - L'auth del vendor deve comunque esistere sull'host per quell'harness.
    - Se l'host non ha npm o accesso di rete, i recuperi degli adattatori al primo avvio falliscono finché le cache non vengono pre-riscaldate o l'adattatore viene installato in un altro modo.

  </Accordion>
  <Accordion title="Prerequisiti del runtime">
    ACP avvia un vero processo harness esterno. OpenClaw possiede routing,
    stato delle attività in background, consegna, associazioni e policy; l'harness
    possiede login provider, catalogo modelli, comportamento del filesystem e
    strumenti nativi.

    Prima di incolpare OpenClaw, verifica:

    - `/acp doctor` segnala un backend abilitato e sano.
    - L'id di destinazione è consentito da `acp.allowedAgents` quando quella allowlist è impostata.
    - Il comando harness può avviarsi sull'host Gateway.
    - L'auth provider è presente per quell'harness (`claude`, `codex`, `gemini`, `opencode`, `droid`, ecc.).
    - Il modello selezionato esiste per quell'harness - gli id modello non sono portabili tra harness.
    - Il `cwd` richiesto esiste ed è accessibile, oppure ometti `cwd` e lascia che il backend usi il proprio valore predefinito.
    - La modalità permessi corrisponde al lavoro. Le sessioni non interattive non possono fare clic sui prompt di permessi nativi, quindi le esecuzioni di codifica con molte scritture/esecuzioni di solito richiedono un profilo permessi ACPX che possa procedere senza interfaccia.

  </Accordion>
</AccordionGroup>

Gli strumenti Plugin OpenClaw e gli strumenti OpenClaw integrati **non** sono esposti agli
harness ACP per impostazione predefinita. Abilita i bridge MCP espliciti in
[Agenti ACP - configurazione](/it/tools/acp-agents-setup) solo quando l'harness
deve chiamare direttamente quegli strumenti.

## Target harness supportati

Con il backend `acpx`, usa questi id harness come target `/acp spawn <id>`
o `sessions_spawn({ runtime: "acp", agentId: "<id>" })`:

| Id harness | Backend tipico                                | Note                                                                               |
| ---------- | --------------------------------------------- | ---------------------------------------------------------------------------------- |
| `claude`   | Adattatore Claude Code ACP                    | Richiede l'auth Claude Code sull'host.                                             |
| `codex`    | Adattatore Codex ACP                          | Fallback ACP esplicito solo quando `/codex` nativo non è disponibile o ACP è richiesto. |
| `copilot`  | Adattatore GitHub Copilot ACP                 | Richiede l'auth CLI/runtime Copilot.                                               |
| `cursor`   | Cursor CLI ACP (`cursor-agent acp`)           | Sovrascrivi il comando acpx se un'installazione locale espone un entrypoint ACP diverso. |
| `droid`    | Factory Droid CLI                             | Richiede auth Factory/Droid o `FACTORY_API_KEY` nell'ambiente dell'harness.        |
| `gemini`   | Adattatore Gemini CLI ACP                     | Richiede auth Gemini CLI o configurazione della chiave API.                        |
| `iflow`    | iFlow CLI                                     | Disponibilità dell'adattatore e controllo del modello dipendono dalla CLI installata. |
| `kilocode` | Kilo Code CLI                                 | Disponibilità dell'adattatore e controllo del modello dipendono dalla CLI installata. |
| `kimi`     | Kimi/Moonshot CLI                             | Richiede l'auth Kimi/Moonshot sull'host.                                           |
| `kiro`     | Kiro CLI                                      | Disponibilità dell'adattatore e controllo del modello dipendono dalla CLI installata. |
| `opencode` | Adattatore OpenCode ACP                       | Richiede l'auth CLI/provider OpenCode.                                             |
| `openclaw` | Bridge OpenClaw Gateway tramite `openclaw acp` | Consente a un harness compatibile con ACP di parlare di nuovo con una sessione OpenClaw Gateway. |
| `qwen`     | Qwen Code / Qwen CLI                          | Richiede auth compatibile con Qwen sull'host.                                      |

Gli alias agente acpx personalizzati possono essere configurati in acpx stesso, ma la
policy OpenClaw controlla comunque `acp.allowedAgents` e qualsiasi mapping
`agents.list[].runtime.acp.agent` prima del dispatch.

## Runbook dell'operatore

Flusso rapido `/acp` dalla chat:

<Steps>
  <Step title="Spawn">
    `/acp spawn claude --bind here`,
    `/acp spawn gemini --mode persistent --thread auto` oppure
    `/acp spawn codex --bind here` esplicito.
  </Step>
  <Step title="Lavoro">
    Continua nella conversazione o nel thread associato (oppure punta
    esplicitamente alla chiave della sessione).
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
  <Step title="Stop">
    `/acp cancel` (turno corrente) o `/acp close` (sessione + associazioni).
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Dettagli del ciclo di vita">
    - Spawn crea o riprende una sessione runtime ACP, registra i metadati ACP nello store sessioni OpenClaw e può creare un'attività in background quando l'esecuzione è posseduta dal parent.
    - Le sessioni ACP possedute dal parent sono trattate come lavoro in background anche quando la sessione runtime è persistente; completamento e consegna tra superfici passano attraverso il notificatore dell'attività parent invece di comportarsi come una normale sessione chat visibile all'utente.
    - La manutenzione delle attività chiude sessioni ACP one-shot possedute dal parent che sono terminali o orfane. Le sessioni ACP persistenti vengono preservate mentre resta un'associazione di conversazione attiva; le sessioni persistenti obsolete senza associazione attiva vengono chiuse così non possono essere riprese silenziosamente dopo che l'attività proprietaria è terminata o il suo record attività è sparito.
    - I messaggi di follow-up associati vanno direttamente alla sessione ACP finché l'associazione non viene chiusa, tolta dal focus, reimpostata o scaduta.
    - I comandi Gateway restano locali. `/acp ...`, `/status` e `/unfocus` non vengono mai inviati come normale testo di prompt a un harness ACP associato.
    - `cancel` interrompe il turno attivo quando il backend supporta l'annullamento; non elimina l'associazione né i metadati della sessione.
    - `close` termina la sessione ACP dal punto di vista di OpenClaw e rimuove l'associazione. Un harness può comunque mantenere la propria cronologia upstream se supporta la ripresa.
    - Il Plugin acpx pulisce gli alberi di processi wrapper e adattatore posseduti da OpenClaw dopo `close` e raccoglie gli orfani ACPX posseduti da OpenClaw obsoleti durante l'avvio del Gateway.
    - I worker runtime inattivi sono idonei alla pulizia dopo `acp.runtime.ttlMinutes`; i metadati di sessione archiviati restano disponibili per `/acp sessions`.

  </Accordion>
  <Accordion title="Regole di routing Codex nativo">
    Trigger in linguaggio naturale che dovrebbero instradare al **Plugin Codex
    nativo** quando è abilitato:

    - "Associa questo canale Discord a Codex."
    - "Collega questa chat al thread Codex `<id>`."
    - "Mostra i thread Codex, poi associa questo."

    Runtime di associazione conversazione Codex nativa è il percorso predefinito di controllo chat.
    Gli strumenti dinamici di OpenClaw continuano a essere eseguiti tramite OpenClaw, mentre
    gli strumenti nativi di Codex come shell/apply-patch vengono eseguiti dentro Codex.
    Per gli eventi degli strumenti nativi di Codex, OpenClaw inserisce un relay di hook nativo
    per turno, così gli hook dei Plugin possono bloccare `before_tool_call`, osservare
    `after_tool_call` e instradare gli eventi Codex `PermissionRequest`
    tramite le approvazioni OpenClaw. Gli hook Codex `Stop` vengono inoltrati a
    OpenClaw `before_agent_finalize`, dove i Plugin possono richiedere un ulteriore
    passaggio del modello prima che Codex finalizzi la risposta. Il relay resta
    volutamente conservativo: non modifica gli argomenti degli strumenti nativi
    di Codex né riscrive i record dei thread Codex. Usa ACP esplicito solo
    quando vuoi il modello di runtime/sessione ACP. Il limite di supporto di Codex
    incorporato è documentato nel
    [contratto di supporto Codex harness v1](/it/plugins/codex-harness-runtime#v1-support-contract).

  </Accordion>
  <Accordion title="Riepilogo rapido della selezione modello / provider / runtime">
    - riferimenti modello Codex legacy - route modello OAuth/abbonamento Codex legacy riparata da doctor.
    - `openai/*` - runtime incorporato app-server Codex nativo per i turni agente OpenAI.
    - `/codex ...` - controllo conversazione Codex nativo.
    - `/acp ...` o `runtime: "acp"` - controllo ACP/acpx esplicito.

  </Accordion>
  <Accordion title="Trigger in linguaggio naturale per l'instradamento ACP">
    Trigger che dovrebbero instradare al runtime ACP:

    - "Esegui questo come una sessione ACP Claude Code one-shot e riassumi il risultato."
    - "Usa Gemini CLI per questo compito in un thread, poi mantieni i follow-up nello stesso thread."
    - "Esegui Codex tramite ACP in un thread in background."

    OpenClaw sceglie `runtime: "acp"`, risolve l'`agentId` dell'harness,
    si associa alla conversazione o al thread corrente quando supportato e
    instrada i follow-up a quella sessione fino alla chiusura/scadenza. Codex segue
    questo percorso solo quando ACP/acpx è esplicito o il Plugin Codex nativo
    non è disponibile per l'operazione richiesta.

    Per `sessions_spawn`, `runtime: "acp"` viene annunciato solo quando ACP
    è abilitato, il richiedente non è in sandbox e un backend runtime ACP
    è caricato. `acp.dispatch.enabled=false` sospende il dispatch automatico
    dei thread ACP ma non nasconde né blocca le chiamate esplicite
    `sessions_spawn({ runtime: "acp" })`. Ha come destinazione id di harness ACP come `codex`,
    `claude`, `droid`, `gemini` o `opencode`. Non passare un normale
    id agente di configurazione OpenClaw da `agents_list` a meno che quella voce non sia
    configurata esplicitamente con `agents.list[].runtime.type="acp"`;
    altrimenti usa il runtime sub-agent predefinito. Quando un agente OpenClaw
    è configurato con `runtime.type="acp"`, OpenClaw usa
    `runtime.acp.agent` come id harness sottostante.

  </Accordion>
</AccordionGroup>

## ACP rispetto ai sub-agent

Usa ACP quando vuoi un runtime harness esterno. Usa **app-server Codex
nativo** per associazione/controllo della conversazione Codex quando il Plugin
`codex` è abilitato. Usa **sub-agent** quando vuoi esecuzioni delegate
native di OpenClaw.

| Area          | Sessione ACP                           | Esecuzione sub-agent                      |
| ------------- | ------------------------------------- | ---------------------------------- |
| Runtime       | Plugin backend ACP (ad esempio acpx) | Runtime sub-agent nativo OpenClaw  |
| Chiave sessione   | `agent:<agentId>:acp:<uuid>`          | `agent:<agentId>:subagent:<uuid>`  |
| Comandi principali | `/acp ...`                            | `/subagents ...`                   |
| Strumento spawn    | `sessions_spawn` con `runtime:"acp"` | `sessions_spawn` (runtime predefinito) |

Vedi anche [Sub-agent](/it/tools/subagents).

## Come ACP esegue Claude Code

Per Claude Code tramite ACP, lo stack è:

1. Piano di controllo sessione ACP OpenClaw.
2. Plugin runtime ufficiale `@openclaw/acpx`.
3. Adattatore Claude ACP.
4. Meccanismi runtime/sessione lato Claude.

ACP Claude è una **sessione harness** con controlli ACP, ripresa sessione,
tracciamento dei task in background e associazione opzionale a conversazione/thread.

I backend CLI sono runtime locali di fallback separati, solo testo - vedi
[Backend CLI](/it/gateway/cli-backends).

Per gli operatori, la regola pratica è:

- **Vuoi `/acp spawn`, sessioni associabili, controlli runtime o lavoro harness persistente?** Usa ACP.
- **Vuoi un semplice fallback testuale locale tramite la CLI grezza?** Usa i backend CLI.

## Sessioni associate

### Modello mentale

- **Superficie chat** - dove le persone continuano a parlare (canale Discord, topic Telegram, chat iMessage).
- **Sessione ACP** - lo stato runtime persistente Codex/Claude/Gemini a cui OpenClaw instrada.
- **Thread/topic figlio** - una superficie di messaggistica opzionale aggiuntiva creata solo da `--thread ...`.
- **Workspace runtime** - la posizione del filesystem (`cwd`, checkout del repository, workspace del backend) dove viene eseguito l'harness. Indipendente dalla superficie chat.

### Associazioni alla conversazione corrente

`/acp spawn <harness> --bind here` fissa la conversazione corrente alla
sessione ACP generata - nessun thread figlio, stessa superficie chat. OpenClaw continua
a possedere trasporto, auth, sicurezza e delivery. I messaggi di follow-up in quella
conversazione vengono instradati alla stessa sessione; `/new` e `/reset` reimpostano la
sessione sul posto; `/acp close` rimuove l'associazione.

Esempi:

```text
/codex bind                                              # associazione Codex nativa, instrada qui i messaggi futuri
/codex model gpt-5.4                                     # regola il thread Codex nativo associato
/codex stop                                              # controlla il turno Codex nativo attivo
/acp spawn codex --bind here                             # fallback ACP esplicito per Codex
/acp spawn codex --thread auto                           # può creare un thread/topic figlio e associarlo lì
/acp spawn codex --bind here --cwd /workspace/repo       # stessa associazione chat, Codex viene eseguito in /workspace/repo
```

<AccordionGroup>
  <Accordion title="Regole di associazione ed esclusività">
    - `--bind here` e `--thread ...` sono mutuamente esclusivi.
    - `--bind here` funziona solo sui canali che dichiarano il supporto per l'associazione alla conversazione corrente; altrimenti OpenClaw restituisce un messaggio chiaro di non supporto. Le associazioni persistono attraverso i riavvii del gateway.
    - Su Discord, `spawnSessions` controlla la creazione di thread figli per `--thread auto|here` - non `--bind here`.
    - Se generi verso un agente ACP diverso senza `--cwd`, OpenClaw eredita per impostazione predefinita il workspace **dell'agente di destinazione**. I percorsi ereditati mancanti (`ENOENT`/`ENOTDIR`) ricadono sul valore predefinito del backend; altri errori di accesso (ad esempio `EACCES`) emergono come errori di spawn.
    - I comandi di gestione Gateway restano locali nelle conversazioni associate - i comandi `/acp ...` sono gestiti da OpenClaw anche quando il normale testo di follow-up viene instradato alla sessione ACP associata; anche `/status` e `/unfocus` restano locali ogni volta che la gestione dei comandi è abilitata per quella superficie.

  </Accordion>
  <Accordion title="Sessioni associate a thread">
    Quando le associazioni thread sono abilitate per un adattatore di canale:

    - OpenClaw associa un thread a una sessione ACP di destinazione.
    - I messaggi di follow-up in quel thread vengono instradati alla sessione ACP associata.
    - L'output ACP viene consegnato allo stesso thread.
    - Unfocus/close/archive/idle-timeout o la scadenza max-age rimuove l'associazione.
    - `/acp close`, `/acp cancel`, `/acp status`, `/status` e `/unfocus` sono comandi Gateway, non prompt per l'harness ACP.

    Feature flag richiesti per ACP associato a thread:

    - `acp.enabled=true`
    - `acp.dispatch.enabled` è attivo per impostazione predefinita (imposta `false` per sospendere il dispatch automatico dei thread ACP; le chiamate esplicite `sessions_spawn({ runtime: "acp" })` continuano a funzionare).
    - Spawn sessione thread dell'adattatore di canale abilitati (predefinito: `true`):
      - Discord: `channels.discord.threadBindings.spawnSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnSessions=true`

    Il supporto per associazione thread è specifico dell'adattatore. Se l'adattatore
    di canale attivo non supporta le associazioni thread, OpenClaw restituisce un
    messaggio chiaro di non supportato/non disponibile.

  </Accordion>
  <Accordion title="Canali con supporto thread">
    - Qualsiasi adattatore di canale che esponga la capacità di associazione sessione/thread.
    - Supporto integrato attuale: thread/canali **Discord**, topic **Telegram** (topic forum in gruppi/supergruppi e topic DM).
    - I canali Plugin possono aggiungere supporto tramite la stessa interfaccia di associazione.

  </Accordion>
</AccordionGroup>

## Associazioni canale persistenti

Per workflow non effimeri, configura associazioni ACP persistenti nelle
voci di primo livello `bindings[]`.

### Modello di associazione

<ParamField path="bindings[].type" type='"acp"'>
  Contrassegna un'associazione conversazione ACP persistente.
</ParamField>
<ParamField path="bindings[].match" type="object">
  Identifica la conversazione di destinazione. Forme per canale:

- **Canale/thread Discord:** `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
- **Canale/DM Slack:** `match.channel="slack"` + `match.peer.id="<channelId|channel:<channelId>|#<channelId>|userId|user:<userId>|slack:<userId>|<@userId>>"`. Preferisci id Slack stabili; le associazioni canale corrispondono anche alle risposte dentro i thread di quel canale.
- **Topic forum Telegram:** `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
- **DM/gruppo WhatsApp:** `match.channel="whatsapp"` + `match.peer.id="<E.164|group JID>"`. Usa numeri E.164 come `+15555550123` per chat dirette e JID di gruppo WhatsApp come `120363424282127706@g.us` per i gruppi.
- **DM/gruppo iMessage:** `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`. Preferisci `chat_id:*` per associazioni gruppo stabili.

</ParamField>
<ParamField path="bindings[].agentId" type="string">
  L'id agente OpenClaw proprietario.
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

Usa `agents.list[].runtime` per definire una sola volta i valori predefiniti ACP per agente:

- `agents.list[].runtime.type="acp"`
- `agents.list[].runtime.acp.agent` (id harness, ad es. `codex` o `claude`)
- `agents.list[].runtime.acp.backend`
- `agents.list[].runtime.acp.mode`
- `agents.list[].runtime.acp.cwd`

**Precedenza degli override per sessioni associate ACP:**

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

- OpenClaw garantisce che la sessione ACP configurata esista dopo l'ammissione specifica del canale e prima dell'uso.
- I messaggi in quel canale, argomento o chat vengono instradati alla sessione ACP configurata.
- Le associazioni ACP configurate possiedono la propria route di sessione. Il fan-out di trasmissione del canale non sostituisce la sessione ACP configurata per un'associazione corrispondente.
- Nelle conversazioni associate, `/new` e `/reset` reimpostano la stessa chiave di sessione ACP sul posto.
- Le associazioni runtime temporanee (per esempio create dai flussi di focus sui thread) continuano ad applicarsi dove presenti.
- Per gli spawn ACP tra agenti senza un `cwd` esplicito, OpenClaw eredita l'area di lavoro dell'agente target dalla configurazione dell'agente.
- I percorsi di area di lavoro ereditati mancanti ripiegano sul cwd predefinito del backend; gli errori di accesso non mancanti emergono come errori di spawn.

## Avviare sessioni ACP

Due modi per avviare una sessione ACP:

<Tabs>
  <Tab title="Da sessions_spawn">
    Usa `runtime: "acp"` per avviare una sessione ACP da un turno agente o
    da una chiamata tool.

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
    `runtime` usa per impostazione predefinita `subagent`, quindi imposta esplicitamente
    `runtime: "acp"` per le sessioni ACP. Se `agentId` viene omesso, OpenClaw usa
    `acp.defaultAgent` quando configurato. `mode: "session"` richiede
    `thread: true` per mantenere una conversazione associata persistente.
    </Note>

  </Tab>
  <Tab title="Da comando /acp">
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
  ID dell'harness target ACP. Ripiega su `acp.defaultAgent` se impostato.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  Richiede il flusso di associazione del thread dove supportato.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  `"run"` è monouso; `"session"` è persistente. Se `thread: true` e
  `mode` viene omesso, OpenClaw può usare per impostazione predefinita il comportamento persistente in base
  al percorso runtime. `mode: "session"` richiede `thread: true`.
</ParamField>
<ParamField path="cwd" type="string">
  Directory di lavoro runtime richiesta (validata dalla policy di backend/runtime).
  Se omesso, lo spawn ACP eredita l'area di lavoro dell'agente target
  quando configurata; i percorsi ereditati mancanti ripiegano sui valori
  predefiniti del backend, mentre vengono restituiti gli errori di accesso reali.
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
  I flussi di avanzamento parent mostrano per impostazione predefinita il commento dell'assistente
  e l'avanzamento dello stato ACP, salvo `streaming.progress.commentary=false`.
  Discord inoltre imposta per impostazione predefinita le anteprime parent in modalità avanzamento quando
  non è configurata alcuna modalità di stream. L'avanzamento dello stato rispetta comunque
  `acp.stream.tagVisibility`, quindi tag come `plan` restano nascosti salvo abilitazione esplicita.
</ParamField>

Le esecuzioni ACP `sessions_spawn` usano `agents.defaults.subagents.runTimeoutSeconds` per
il limite predefinito del turno figlio. Il tool non accetta override di timeout per singola chiamata.

<ParamField path="model" type="string">
  Override esplicito del modello per la sessione figlia ACP. Gli spawn ACP Codex
  normalizzano riferimenti OpenAI come `openai/gpt-5.4` nella configurazione di avvio
  ACP Codex prima di `session/new`; forme slash come `openai/gpt-5.4/high`
  impostano anche lo sforzo di ragionamento ACP Codex.
  Se omesso, `sessions_spawn({ runtime: "acp" })` usa i valori predefiniti
  esistenti del modello subagent (`agents.defaults.subagents.model` o
  `agents.list[].subagents.model`) quando configurati; altrimenti lascia che
  l'harness ACP usi il proprio modello predefinito.
  Gli altri harness devono pubblicizzare ACP `models` e supportare
  `session/set_model`; altrimenti OpenClaw/acpx fallisce chiaramente invece di
  ripiegare silenziosamente sul valore predefinito dell'agente target.
</ParamField>
<ParamField path="thinking" type="string">
  Sforzo di pensiero/ragionamento esplicito. Per ACP Codex, `minimal` corrisponde a
  sforzo basso, `low`/`medium`/`high`/`xhigh` corrispondono direttamente, e `off`
  omette l'override di avvio dello sforzo di ragionamento.
  Se omesso, gli spawn ACP usano i valori predefiniti di pensiero subagent esistenti e
  `agents.defaults.models["provider/model"].params.thinking` per modello
  selezionato.
</ParamField>

## Modalità di associazione spawn e thread

<Tabs>
  <Tab title="--bind here|off">
    | Modalità | Comportamento                                                            |
    | -------- | ------------------------------------------------------------------------ |
    | `here`   | Associa sul posto la conversazione attiva corrente; fallisce se non ce n'è una attiva. |
    | `off`    | Non creare un'associazione alla conversazione corrente.                  |

    Note:

    - `--bind here` è il percorso operatore più semplice per "rendere questo canale o questa chat supportata da Codex."
    - `--bind here` non crea un thread figlio.
    - `--bind here` è disponibile solo sui canali che espongono il supporto per l'associazione alla conversazione corrente.
    - `--bind` e `--thread` non possono essere combinati nella stessa chiamata `/acp spawn`.

  </Tab>
  <Tab title="--thread auto|here|off">
    | Modalità | Comportamento                                                                                      |
    | -------- | -------------------------------------------------------------------------------------------------- |
    | `auto`   | In un thread attivo: associa quel thread. Fuori da un thread: crea/associa un thread figlio quando supportato. |
    | `here`   | Richiede il thread attivo corrente; fallisce se non ci si trova in uno.                            |
    | `off`    | Nessuna associazione. La sessione parte non associata.                                             |

    Note:

    - Sulle superfici di associazione senza thread, il comportamento predefinito è di fatto `off`.
    - Lo spawn associato a thread richiede il supporto della policy del canale:
      - Discord: `channels.discord.threadBindings.spawnSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnSessions=true`
    - Usa `--bind here` quando vuoi fissare la conversazione corrente senza creare un thread figlio.

  </Tab>
</Tabs>

## Modello di recapito

Le sessioni ACP possono essere workspace interattivi oppure lavoro in
background di proprietà del genitore. Il percorso di recapito dipende da
questa forma.

<AccordionGroup>
  <Accordion title="Sessioni ACP interattive">
    Le sessioni interattive sono pensate per continuare a conversare su una
    superficie di chat visibile:

    - `/acp spawn ... --bind here` associa la conversazione corrente alla sessione ACP.
    - `/acp spawn ... --thread ...` associa un thread/argomento di canale alla sessione ACP.
    - Le `bindings[].type="acp"` configurate in modo persistente instradano le conversazioni corrispondenti alla stessa sessione ACP.

    I messaggi successivi nella conversazione associata vengono instradati
    direttamente alla sessione ACP, e l'output ACP viene recapitato allo
    stesso canale/thread/argomento.

    Cosa OpenClaw invia all'harness:

    - I normali messaggi successivi associati vengono inviati come testo del prompt, più allegati solo quando l'harness/backend li supporta.
    - I comandi di gestione `/acp` e i comandi Gateway locali vengono intercettati prima dell'invio ad ACP.
    - Gli eventi di completamento generati dal runtime vengono materializzati per destinazione. Gli agenti OpenClaw ricevono l'envelope interno del contesto runtime di OpenClaw; gli harness ACP esterni ricevono un prompt semplice con il risultato figlio e l'istruzione. L'envelope grezzo `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>` non deve mai essere inviato a harness esterni né persistito come testo della trascrizione utente ACP.
    - Le voci della trascrizione ACP usano il testo di attivazione visibile all'utente o il prompt di completamento semplice. I metadati interni degli eventi restano strutturati in OpenClaw dove possibile e non vengono trattati come contenuto di chat scritto dall'utente.

  </Accordion>
  <Accordion title="Sessioni ACP one-shot di proprietà del genitore">
    Le sessioni ACP one-shot avviate da un'altra esecuzione agente sono figli
    in background, simili ai sotto-agenti:

    - Il genitore richiede lavoro con `sessions_spawn({ runtime: "acp", mode: "run" })`.
    - Il figlio viene eseguito nella propria sessione harness ACP.
    - I turni del figlio vengono eseguiti sulla stessa corsia in background usata dagli spawn nativi dei sotto-agenti, quindi un harness ACP lento non blocca lavoro non correlato della sessione principale.
    - Il completamento viene riportato tramite il percorso di annuncio del completamento attività. OpenClaw converte i metadati interni di completamento in un prompt ACP semplice prima di inviarli a un harness esterno, quindi gli harness non vedono marcatori di contesto runtime specifici di OpenClaw.
    - Il genitore riscrive il risultato del figlio con la normale voce dell'assistente quando è utile una risposta visibile all'utente.

    **Non** trattare questo percorso come una chat peer-to-peer tra genitore
    e figlio. Il figlio ha già un canale di completamento verso il
    genitore.

  </Accordion>
  <Accordion title="sessions_send e recapito A2A">
    `sessions_send` può puntare a un'altra sessione dopo lo spawn. Per le
    normali sessioni peer, OpenClaw usa un percorso di follow-up
    agent-to-agent (A2A) dopo aver iniettato il messaggio:

    - Attendi la risposta della sessione di destinazione.
    - Facoltativamente lascia che richiedente e destinazione scambino un numero limitato di turni di follow-up.
    - Chiedi alla destinazione di produrre un messaggio di annuncio.
    - Recapita quell'annuncio al canale o thread visibile.

    Quel percorso A2A è un fallback per gli invii peer in cui il mittente
    necessita di un follow-up visibile. Rimane abilitato quando una sessione
    non correlata può vedere e inviare messaggi a una destinazione ACP, ad
    esempio con impostazioni ampie di `tools.sessions.visibility`.

    OpenClaw salta il follow-up A2A solo quando il richiedente è il
    genitore del proprio figlio ACP monouso di proprietà del genitore. In quel caso,
    eseguire A2A oltre al completamento del task può riattivare il genitore con il
    risultato del figlio, inoltrare la risposta del genitore di nuovo al figlio e
    creare un ciclo di eco genitore/figlio. Il risultato `sessions_send` riporta
    `delivery.status="skipped"` per quel caso di figlio posseduto perché il
    percorso di completamento è già responsabile del risultato.

  </Accordion>
  <Accordion title="Riprendere una sessione esistente">
    Usa `resumeSessionId` per continuare una sessione ACP precedente invece di
    iniziarne una nuova. L'agente riproduce la cronologia della conversazione tramite
    `session/load`, quindi riprende con il contesto completo di ciò che è avvenuto prima.

    ```json
    {
      "task": "Continue where we left off - fix the remaining test failures",
      "runtime": "acp",
      "agentId": "codex",
      "resumeSessionId": "<previous-session-id>"
    }
    ```

    Casi d'uso comuni:

    - Passa una sessione Codex dal tuo laptop al telefono: chiedi al tuo agente di riprendere da dove eri rimasto.
    - Continua una sessione di coding che avevi avviato interattivamente nella CLI, ora in modalità headless tramite il tuo agente.
    - Riprendi il lavoro interrotto da un riavvio del gateway o da un timeout di inattività.

    Note:

    - `resumeSessionId` si applica solo quando `runtime: "acp"`; il runtime predefinito dei sotto-agenti ignora questo campo riservato ad ACP.
    - `streamTo` si applica solo quando `runtime: "acp"`; il runtime predefinito dei sotto-agenti ignora questo campo riservato ad ACP.
    - `resumeSessionId` è un id di ripresa ACP/harness locale all'host, non una chiave di sessione di canale OpenClaw; OpenClaw verifica comunque la policy di spawn ACP e la policy dell'agente di destinazione prima dell'invio, mentre il backend ACP o l'harness possiede l'autorizzazione per caricare quell'id upstream.
    - `resumeSessionId` ripristina la cronologia della conversazione ACP upstream; `thread` e `mode` continuano ad applicarsi normalmente alla nuova sessione OpenClaw che stai creando, quindi `mode: "session"` richiede ancora `thread: true`.
    - L'agente di destinazione deve supportare `session/load` (Codex e Claude Code lo fanno).
    - Se l'id della sessione non viene trovato, lo spawn fallisce con un errore chiaro: nessun fallback silenzioso a una nuova sessione.

  </Accordion>
  <Accordion title="Smoke test post-distribuzione">
    Dopo una distribuzione del Gateway, esegui un controllo end-to-end live invece di
    fidarti dei test unitari:

    1. Verifica la versione e il commit del Gateway distribuito sull'host di destinazione.
    2. Apri una sessione bridge ACPX temporanea verso un agente live.
    3. Chiedi a quell'agente di chiamare `sessions_spawn` con `runtime: "acp"`, `agentId: "codex"`, `mode: "run"` e task `Reply with exactly LIVE-ACP-SPAWN-OK`.
    4. Verifica `accepted=yes`, un vero `childSessionKey` e nessun errore del validatore.
    5. Pulisci la sessione bridge temporanea.

    Mantieni il gate su `mode: "run"` e salta `streamTo: "parent"`:
    i percorsi `mode: "session"` vincolati al thread e i percorsi di stream-relay sono
    passaggi di integrazione separati e più ricchi.

  </Accordion>
</AccordionGroup>

## Compatibilità sandbox

Le sessioni ACP attualmente vengono eseguite sul runtime host, **non** dentro la
sandbox OpenClaw.

<Warning>
**Confine di sicurezza:**

- L'harness esterno può leggere/scrivere in base ai propri permessi CLI e al `cwd` selezionato.
- La policy sandbox di OpenClaw **non** avvolge l'esecuzione dell'harness ACP.
- OpenClaw applica comunque i feature gate ACP, gli agenti consentiti, la proprietà delle sessioni, i binding dei canali e la policy di consegna del Gateway.
- Usa `runtime: "subagent"` per lavoro nativo OpenClaw con sandbox applicata.

</Warning>

Limitazioni attuali:

- Se la sessione richiedente è in sandbox, gli spawn ACP vengono bloccati sia per `sessions_spawn({ runtime: "acp" })` sia per `/acp spawn`.
- `sessions_spawn` con `runtime: "acp"` non supporta `sandbox: "require"`.

## Risoluzione della destinazione della sessione

La maggior parte delle azioni `/acp` accetta una destinazione di sessione opzionale (`session-key`,
`session-id` o `session-label`).

**Ordine di risoluzione:**

1. Argomento di destinazione esplicito (o `--session` per `/acp steer`)
   - prova la chiave
   - poi l'id di sessione in forma UUID
   - poi l'etichetta
2. Binding del thread corrente (se questa conversazione/thread è vincolata a una sessione ACP).
3. Fallback della sessione richiedente corrente.

Sia i binding della conversazione corrente sia i binding del thread partecipano al
passaggio 2.

Se non viene risolta alcuna destinazione, OpenClaw restituisce un errore chiaro
(`Unable to resolve session target: ...`).

## Controlli ACP

| Comando              | Cosa fa                                                   | Esempio                                                       |
| -------------------- | --------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | Crea una sessione ACP; binding corrente o del thread opzionale. | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | Annulla il turno in corso per la sessione di destinazione. | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | Invia un'istruzione di guida alla sessione in esecuzione. | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | Chiude la sessione e rimuove i binding delle destinazioni del thread. | `/acp close`                                                  |
| `/acp status`        | Mostra backend, modalità, stato, opzioni runtime, capacità. | `/acp status`                                                 |
| `/acp set-mode`      | Imposta la modalità runtime per la sessione di destinazione. | `/acp set-mode plan`                                          |
| `/acp set`           | Scrittura generica di un'opzione di configurazione runtime. | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | Imposta l'override della directory di lavoro runtime.     | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | Imposta il profilo della policy di approvazione.          | `/acp permissions strict`                                     |
| `/acp timeout`       | Imposta il timeout runtime (secondi).                     | `/acp timeout 120`                                            |
| `/acp model`         | Imposta l'override del modello runtime.                   | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | Rimuove gli override delle opzioni runtime della sessione. | `/acp reset-options`                                          |
| `/acp sessions`      | Elenca le sessioni ACP recenti dallo store.               | `/acp sessions`                                               |
| `/acp doctor`        | Stato del backend, capacità, correzioni attuabili.        | `/acp doctor`                                                 |
| `/acp install`       | Stampa passaggi deterministici di installazione e abilitazione. | `/acp install`                                                |

`/acp status` mostra le opzioni runtime effettive più gli identificatori di sessione
a livello di runtime e di backend. Gli errori di controllo non supportato emergono
chiaramente quando un backend non dispone di una capacità. `/acp sessions` legge lo
store per la sessione attualmente vincolata o richiedente; i token di destinazione
(`session-key`, `session-id` o `session-label`) vengono risolti tramite la
discovery delle sessioni del Gateway, incluse le radici `session.store`
personalizzate per agente.

### Mappatura delle opzioni runtime

`/acp` dispone di comandi di comodità e di un setter generico. Operazioni
equivalenti:

| Comando                      | Si mappa a                            | Note                                                                                                                                                                                                      |
| ---------------------------- | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/acp model <id>`            | chiave di configurazione runtime `model` | Per Codex ACP, OpenClaw normalizza `openai/<model>` nell'id modello dell'adapter e mappa i suffissi di reasoning con slash, come `openai/gpt-5.4/high`, a `reasoning_effort`.                             |
| `/acp set thinking <level>`  | opzione canonica `thinking`          | OpenClaw invia l'equivalente pubblicizzato dal backend quando presente, preferendo `thinking`, poi `effort`, `reasoning_effort` o `thought_level`. Per Codex ACP, l'adapter mappa i valori a `reasoning_effort`. |
| `/acp permissions <profile>` | opzione canonica `permissionProfile` | OpenClaw invia l'equivalente pubblicizzato dal backend quando presente, come `approval_policy`, `permission_profile`, `permissions` o `permission_mode`.                                                  |
| `/acp timeout <seconds>`     | opzione canonica `timeoutSeconds`    | OpenClaw invia l'equivalente pubblicizzato dal backend quando presente, come `timeout` o `timeout_seconds`.                                                                                              |
| `/acp cwd <path>`            | override del cwd runtime             | Aggiornamento diretto.                                                                                                                                                                                     |
| `/acp set <key> <value>`     | generico                             | `key=cwd` usa il percorso di override del cwd.                                                                                                                                                             |
| `/acp reset-options`         | cancella tutti gli override runtime  | -                                                                                                                                                                                                          |

## Harness acpx, configurazione Plugin e permessi

Per la configurazione dell'harness acpx (alias Claude Code / Codex / Gemini CLI),
i bridge MCP plugin-tools e OpenClaw-tools e le modalità di permesso ACP, consulta
[Agenti ACP - configurazione](/it/tools/acp-agents-setup).

## Risoluzione dei problemi

| Sintomo                                                                     | Causa probabile                                                                                                           | Correzione                                                                                                                                                                      |
| --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ACP runtime backend is not configured`                                     | Plugin di backend mancante, disabilitato o bloccato da `plugins.allow`.                                                       | Installa e abilita il Plugin di backend, includi `acpx` in `plugins.allow` quando quella allowlist è impostata, poi esegui `/acp doctor`.                                                 |
| `ACP is disabled by policy (acp.enabled=false)`                             | ACP disabilitato globalmente.                                                                                                 | Imposta `acp.enabled=true`.                                                                                                                                                  |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`           | Dispatch automatico dai normali messaggi del thread disabilitato.                                                               | Imposta `acp.dispatch.enabled=true` per riprendere il routing automatico del thread; le chiamate esplicite `sessions_spawn({ runtime: "acp" })` continuano a funzionare.                                      |
| `ACP agent "<id>" is not allowed by policy`                                 | Agent non presente nell'allowlist.                                                                                                | Usa un `agentId` consentito oppure aggiorna `acp.allowedAgents`.                                                                                                                     |
| `/acp doctor` segnala che il backend non è pronto subito dopo l'avvio                 | Il Plugin di backend è mancante, disabilitato, bloccato da una policy allow/deny, oppure il suo eseguibile configurato non è disponibile.        | Installa/abilita il Plugin di backend, riesegui `/acp doctor` e ispeziona l'errore di installazione o di policy del backend se resta non integro.                                           |
| Comando harness non trovato                                                   | La CLI dell'adapter non è installata, il Plugin esterno è mancante, oppure il recupero `npx` alla prima esecuzione non è riuscito per un adapter non Codex. | Esegui `/acp doctor`, installa/precarica l'adapter sull'host Gateway oppure configura esplicitamente il comando dell'agent acpx.                                                      |
| Modello non trovato dall'harness                                            | L'id del modello è valido per un altro provider/harness ma non per questa destinazione ACP.                                                | Usa un modello elencato da quell'harness, configura il modello nell'harness oppure ometti l'override.                                                                            |
| Errore di autenticazione del vendor dall'harness                                          | OpenClaw è integro, ma la CLI/il provider di destinazione non ha effettuato l'accesso.                                                     | Effettua l'accesso o fornisci la chiave provider richiesta nell'ambiente dell'host Gateway.                                                                                             |
| `Unable to resolve session target: ...`                                     | Token chiave/id/etichetta non valido.                                                                                                | Esegui `/acp sessions`, copia la chiave/etichetta esatta e riprova.                                                                                                                        |
| `--bind here requires running /acp spawn inside an active ... conversation` | `--bind here` usato senza una conversazione attiva associabile.                                                            | Spostati nella chat/nel canale di destinazione e riprova, oppure usa uno spawn non associato.                                                                                                         |
| `Conversation bindings are unavailable for <channel>.`                      | L'adapter non dispone della capability ACP di associazione alla conversazione corrente.                                                             | Usa `/acp spawn ... --thread ...` dove supportato, configura `bindings[]` di livello superiore oppure passa a un canale supportato.                                                     |
| `--thread here requires running /acp spawn inside an active ... thread`     | `--thread here` usato fuori dal contesto di un thread.                                                                         | Spostati nel thread di destinazione oppure usa `--thread auto`/`off`.                                                                                                                      |
| `Only <user-id> can rebind this channel/conversation/thread.`               | Un altro utente possiede la destinazione di associazione attiva.                                                                           | Riassocia come proprietario oppure usa una conversazione o un thread diverso.                                                                                                               |
| `Thread bindings are unavailable for <channel>.`                            | L'adapter non dispone della capability di associazione al thread.                                                                               | Usa `--thread off` oppure passa a un adapter/canale supportato.                                                                                                                 |
| `Sandboxed sessions cannot spawn ACP sessions ...`                          | Il runtime ACP è lato host; la sessione richiedente è in sandbox.                                                              | Usa `runtime="subagent"` dalle sessioni in sandbox oppure esegui lo spawn ACP da una sessione non in sandbox.                                                                         |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`     | `sandbox="require"` richiesto per il runtime ACP.                                                                         | Usa `runtime="subagent"` per il sandboxing obbligatorio oppure usa ACP con `sandbox="inherit"` da una sessione non in sandbox.                                                      |
| `Cannot apply --model ... did not advertise model support`                  | L'harness di destinazione non espone il cambio modello ACP generico.                                                        | Usa un harness che dichiara ACP `models`/`session/set_model`, usa i riferimenti modello ACP di Codex oppure configura il modello direttamente nell'harness se ha un proprio flag di avvio. |
| Metadati ACP mancanti per la sessione associata                                      | Metadati della sessione ACP obsoleti/eliminati.                                                                                    | Ricrea con `/acp spawn`, poi riassocia/metti a fuoco il thread.                                                                                                                    |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`    | `permissionMode` blocca scritture/exec nella sessione ACP non interattiva.                                                    | Imposta `plugins.entries.acpx.config.permissionMode` su `approve-all` e riavvia il Gateway. Vedi [Configurazione dei permessi](/it/tools/acp-agents-setup#permission-configuration). |
| La sessione ACP fallisce presto con poco output                                  | I prompt di autorizzazione sono bloccati da `permissionMode`/`nonInteractivePermissions`.                                        | Controlla i log del Gateway per `AcpRuntimeError`. Per permessi completi, imposta `permissionMode=approve-all`; per un degrado controllato, imposta `nonInteractivePermissions=deny`.        |
| La sessione ACP si blocca indefinitamente dopo aver completato il lavoro                       | Il processo harness è terminato ma la sessione ACP non ha segnalato il completamento.                                                    | Aggiorna OpenClaw; la pulizia acpx corrente termina i processi wrapper e adapter obsoleti di proprietà di OpenClaw alla chiusura e all'avvio del Gateway.                                             |
| L'harness vede `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>`                        | Envelope di evento interno trapelato oltre il confine ACP.                                                                | Aggiorna OpenClaw e riesegui il flusso di completamento; gli harness esterni dovrebbero ricevere solo prompt di completamento semplici.                                                          |

<Note>
`Command blocked by PreToolUse hook: Native hook relay unavailable` appartiene al
relay hook nativo di Codex, non ad ACP/acpx. In una chat Codex associata, avvia una nuova
sessione con `/new` o `/reset`; se funziona una volta e poi ritorna alla successiva
chiamata tool nativa, riavvia l'app-server Codex o il Gateway OpenClaw invece di
ripetere `/new`. Vedi [Risoluzione dei problemi dell'harness Codex](/it/plugins/codex-harness#troubleshooting).
</Note>

## Correlati

- [Agent ACP - configurazione](/it/tools/acp-agents-setup)
- [Invio agent](/it/tools/agent-send)
- [Backend CLI](/it/gateway/cli-backends)
- [Harness Codex](/it/plugins/codex-harness)
- [Runtime harness Codex](/it/plugins/codex-harness-runtime)
- [Tool sandbox multi-agent](/it/tools/multi-agent-sandbox-tools)
- [`openclaw acp` (modalità bridge)](/it/cli/acp)
- [Sotto-agenti](/it/tools/subagents)
