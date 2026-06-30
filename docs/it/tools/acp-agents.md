---
read_when:
    - Esecuzione di harness di coding tramite ACP
    - Configurazione di sessioni ACP legate alla conversazione sui canali di messaggistica
    - Associazione di una conversazione del canale di messaggi a una sessione ACP persistente
    - Risoluzione dei problemi del backend ACP, del cablaggio dei Plugin o della consegna dei completamenti
    - Utilizzare i comandi /acp dalla chat
sidebarTitle: ACP agents
summary: Esegui harness di codifica esterni (Claude Code, Cursor, Gemini CLI, Codex ACP esplicito, OpenClaw ACP, OpenCode) tramite il backend ACP
title: Agenti ACP
x-i18n:
    generated_at: "2026-06-30T14:09:50Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c61edbc3b5a8303dc88e27a1315fe996da70eeee7aa211877d5680eb150e36cb
    source_path: tools/acp-agents.md
    workflow: 16
---

[Sessioni Agent Client Protocol (ACP)](https://agentclientprotocol.com/)
consentono a OpenClaw di eseguire harness di coding esterni (per esempio Claude Code,
Cursor, Copilot, Droid, OpenClaw ACP, OpenCode, Gemini CLI e altri
harness ACPX supportati) tramite un plugin backend ACP.

Ogni avvio di sessione ACP viene tracciato come [attività in background](/it/automation/tasks).

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

| Vuoi…                                                                                           | Usa questo                            | Note                                                                                                                                                                                                 |
| ----------------------------------------------------------------------------------------------- | ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Associare o controllare Codex nella conversazione corrente                                      | `/codex bind`, `/codex threads`       | Percorso app-server Codex nativo quando il plugin `codex` è abilitato; include risposte chat associate, inoltro immagini, controlli modello/veloce/permessi, stop e indirizzamento. ACP è un fallback esplicito |
| Eseguire Claude Code, Gemini CLI, Codex ACP esplicito o un altro harness esterno _tramite_ OpenClaw | Questa pagina                         | Sessioni associate alla chat, `/acp spawn`, `sessions_spawn({ runtime: "acp" })`, attività in background, controlli runtime                                                                          |
| Esporre una sessione Gateway OpenClaw _come_ server ACP per un editor o client                  | [`openclaw acp`](/it/cli/acp)            | Modalità bridge. IDE/client comunica via ACP con OpenClaw su stdio/WebSocket                                                                                                                         |
| Riutilizzare una CLI AI locale come modello di fallback solo testo                              | [Backend CLI](/it/gateway/cli-backends) | Non ACP. Nessuno strumento OpenClaw, nessun controllo ACP, nessun runtime harness                                                                                                                     |

## Funziona subito?

Sì, dopo aver installato il plugin runtime ACP ufficiale:

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

I checkout sorgente possono usare il plugin workspace locale `extensions/acpx` dopo
`pnpm install`. Esegui `/acp doctor` per un controllo di prontezza.

OpenClaw informa gli agenti sull'avvio ACP solo quando ACP è **davvero
utilizzabile**: ACP deve essere abilitato, il dispatch non deve essere disabilitato, la sessione
corrente non deve essere bloccata dalla sandbox e un backend runtime deve essere
caricato. Se queste condizioni non sono soddisfatte, le Skills del plugin ACP e
le istruzioni ACP di `sessions_spawn` restano nascoste, così l'agente non suggerisce
un backend non disponibile.

<AccordionGroup>
  <Accordion title="Problemi comuni al primo avvio">
    - Se `plugins.allow` è impostato, è un inventario plugin restrittivo e **deve** includere `acpx`; altrimenti il backend ACP installato viene bloccato intenzionalmente e `/acp doctor` segnala la voce allowlist mancante.
    - L'adapter Codex ACP viene preparato con il plugin `acpx` e avviato localmente quando possibile.
    - Codex ACP viene eseguito con un `CODEX_HOME` isolato; OpenClaw copia le voci di progetto attendibili più la configurazione sicura di routing modello/provider dalla configurazione Codex host, mentre auth, notifiche e hook restano nella configurazione host.
    - Altri adapter di harness target possono comunque essere recuperati su richiesta con `npx` la prima volta che li usi.
    - L'autenticazione del fornitore deve comunque esistere sull'host per quell'harness.
    - Se l'host non ha npm o accesso di rete, i recuperi degli adapter al primo avvio falliscono finché le cache non vengono preriscaldate o l'adapter non viene installato in un altro modo.

  </Accordion>
  <Accordion title="Prerequisiti runtime">
    ACP avvia un vero processo di harness esterno. OpenClaw possiede routing,
    stato delle attività in background, consegna, associazioni e policy; l'harness
    possiede il proprio login provider, catalogo modelli, comportamento del filesystem e
    strumenti nativi.

    Prima di dare la colpa a OpenClaw, verifica che:

    - `/acp doctor` segnali un backend abilitato e sano.
    - L'id target sia consentito da `acp.allowedAgents` quando quella allowlist è impostata.
    - Il comando harness possa avviarsi sull'host Gateway.
    - L'autenticazione provider sia presente per quell'harness (`claude`, `codex`, `gemini`, `opencode`, `droid`, ecc.).
    - Il modello selezionato esista per quell'harness: gli id modello non sono portabili tra harness.
    - Il `cwd` richiesto esista e sia accessibile, oppure ometti `cwd` e lascia che il backend usi il proprio predefinito.
    - La modalità permessi corrisponda al lavoro. Le sessioni non interattive non possono fare clic sui prompt di permesso nativi, quindi le esecuzioni di coding con molte scritture/esecuzioni di solito richiedono un profilo permessi ACPX che possa procedere senza intervento.

  </Accordion>
</AccordionGroup>

Gli strumenti plugin OpenClaw e gli strumenti OpenClaw integrati **non** sono esposti agli
harness ACP per impostazione predefinita. Abilita i bridge MCP espliciti in
[Agenti ACP - configurazione](/it/tools/acp-agents-setup) solo quando l'harness
deve chiamare direttamente quegli strumenti.

## Target harness supportati

Con il backend `acpx`, usa questi id harness come target `/acp spawn <id>`
o `sessions_spawn({ runtime: "acp", agentId: "<id>" })`:

| Id harness | Backend tipico                                  | Note                                                                                |
| ---------- | ----------------------------------------------- | ----------------------------------------------------------------------------------- |
| `claude`   | Adapter Claude Code ACP                         | Richiede l'autenticazione Claude Code sull'host.                                    |
| `codex`    | Adapter Codex ACP                               | Fallback ACP esplicito solo quando `/codex` nativo non è disponibile o viene richiesto ACP. |
| `copilot`  | Adapter GitHub Copilot ACP                      | Richiede l'autenticazione CLI/runtime Copilot.                                      |
| `cursor`   | Cursor CLI ACP (`cursor-agent acp`)             | Sovrascrivi il comando acpx se un'installazione locale espone un entrypoint ACP diverso. |
| `droid`    | Factory Droid CLI                               | Richiede l'autenticazione Factory/Droid o `FACTORY_API_KEY` nell'ambiente harness.  |
| `gemini`   | Adapter Gemini CLI ACP                          | Richiede l'autenticazione Gemini CLI o la configurazione di una chiave API.         |
| `iflow`    | iFlow CLI                                       | Disponibilità dell'adapter e controllo modello dipendono dalla CLI installata.      |
| `kilocode` | Kilo Code CLI                                   | Disponibilità dell'adapter e controllo modello dipendono dalla CLI installata.      |
| `kimi`     | Kimi/Moonshot CLI                               | Richiede l'autenticazione Kimi/Moonshot sull'host.                                  |
| `kiro`     | Kiro CLI                                        | Disponibilità dell'adapter e controllo modello dipendono dalla CLI installata.      |
| `opencode` | Adapter OpenCode ACP                            | Richiede l'autenticazione OpenCode CLI/provider.                                    |
| `openclaw` | Bridge Gateway OpenClaw tramite `openclaw acp`  | Consente a un harness compatibile con ACP di comunicare di nuovo con una sessione Gateway OpenClaw. |
| `qwen`     | Qwen Code / Qwen CLI                            | Richiede autenticazione compatibile con Qwen sull'host.                             |

Gli alias agente acpx personalizzati possono essere configurati in acpx stesso, ma la policy OpenClaw
controlla comunque `acp.allowedAgents` e qualsiasi mapping
`agents.list[].runtime.acp.agent` prima del dispatch.

## Runbook operatore

Flusso rapido `/acp` dalla chat:

<Steps>
  <Step title="Avvia">
    `/acp spawn claude --bind here`,
    `/acp spawn gemini --mode persistent --thread auto`, oppure
    `/acp spawn codex --bind here` esplicito.
  </Step>
  <Step title="Lavora">
    Continua nella conversazione o nel thread associato (oppure indica esplicitamente la
    chiave sessione).
  </Step>
  <Step title="Controlla stato">
    `/acp status`
  </Step>
  <Step title="Regola">
    `/acp model <provider/model>`,
    `/acp permissions <profile>`,
    `/acp timeout <seconds>`.
  </Step>
  <Step title="Indirizza">
    Senza sostituire il contesto: `/acp steer tighten logging and continue`.
  </Step>
  <Step title="Ferma">
    `/acp cancel` (turno corrente) oppure `/acp close` (sessione + associazioni).
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Dettagli del ciclo di vita">
    - L'avvio crea o riprende una sessione runtime ACP, registra i metadati ACP nello store delle sessioni OpenClaw e può creare un'attività in background quando l'esecuzione è posseduta dal genitore.
    - Le sessioni ACP possedute dal genitore vengono trattate come lavoro in background anche quando la sessione runtime è persistente; completamento e consegna tra superfici passano dal notificatore dell'attività genitore invece di comportarsi come una normale sessione chat visibile all'utente.
    - La manutenzione delle attività chiude le sessioni ACP one-shot terminali o orfane possedute dal genitore. Le sessioni ACP persistenti vengono preservate mentre resta un'associazione di conversazione attiva; le sessioni persistenti obsolete senza associazione attiva vengono chiuse, così non possono essere riprese silenziosamente dopo che l'attività proprietaria è terminata o il relativo record attività è sparito.
    - I messaggi di follow-up associati vanno direttamente alla sessione ACP finché l'associazione non viene chiusa, non perde il focus, viene reimpostata o scade.
    - I comandi Gateway restano locali. `/acp ...`, `/status` e `/unfocus` non vengono mai inviati come normale testo prompt a un harness ACP associato.
    - `cancel` interrompe il turno attivo quando il backend supporta la cancellazione; non elimina l'associazione o i metadati sessione.
    - `close` termina la sessione ACP dal punto di vista di OpenClaw e rimuove l'associazione. Un harness può comunque mantenere la propria cronologia upstream se supporta la ripresa.
    - Il plugin acpx pulisce gli alberi di processi wrapper e adapter posseduti da OpenClaw dopo `close` e raccoglie gli orfani ACPX posseduti da OpenClaw durante l'avvio del Gateway.
    - I worker runtime inattivi sono idonei alla pulizia dopo `acp.runtime.ttlMinutes`; i metadati sessione archiviati restano disponibili per `/acp sessions`.

  </Accordion>
  <Accordion title="Regole di routing Codex native">
    Trigger in linguaggio naturale che devono essere instradati al **plugin Codex
    nativo** quando è abilitato:

    - "Bind this Discord channel to Codex."
    - "Attach this chat to Codex thread `<id>`."
    - "Show Codex threads, then bind this one."

    L’associazione nativa delle conversazioni Codex è il percorso di controllo chat predefinito.
    Gli strumenti dinamici di OpenClaw continuano a essere eseguiti tramite OpenClaw, mentre
    gli strumenti nativi di Codex come shell/apply-patch vengono eseguiti dentro Codex.
    Per gli eventi degli strumenti nativi di Codex, OpenClaw inserisce un relay di hook nativo
    per turno, così gli hook dei plugin possono bloccare `before_tool_call`, osservare
    `after_tool_call` e instradare gli eventi Codex `PermissionRequest`
    tramite le approvazioni di OpenClaw. Gli hook Codex `Stop` vengono inoltrati a
    OpenClaw `before_agent_finalize`, dove i plugin possono richiedere un ulteriore
    passaggio del modello prima che Codex finalizzi la risposta. Il relay rimane
    deliberatamente conservativo: non modifica gli argomenti degli strumenti nativi di Codex
    né riscrive i record dei thread Codex. Usa ACP esplicito solo
    quando vuoi il modello runtime/sessione ACP. Il confine di supporto Codex
    integrato è documentato nel
    [contratto di supporto v1 dell’harness Codex](/it/plugins/codex-harness-runtime#v1-support-contract).

  </Accordion>
  <Accordion title="Riepilogo rapido per la selezione di modello / provider / runtime">
    - riferimenti modello Codex legacy - route modello Codex OAuth/abbonamento legacy riparata da doctor.
    - `openai/*` - runtime incorporato app-server Codex nativo per i turni agente OpenAI.
    - `/codex ...` - controllo conversazione Codex nativo.
    - `/acp ...` o `runtime: "acp"` - controllo ACP/acpx esplicito.

  </Accordion>
  <Accordion title="Trigger in linguaggio naturale per l’instradamento ACP">
    Trigger che dovrebbero instradare al runtime ACP:

    - "Esegui questo come sessione Claude Code ACP one-shot e riassumi il risultato."
    - "Usa Gemini CLI per questa attività in un thread, poi mantieni i follow-up nello stesso thread."
    - "Esegui Codex tramite ACP in un thread in background."

    OpenClaw sceglie `runtime: "acp"`, risolve l’`agentId` dell’harness,
    si associa alla conversazione o al thread corrente quando supportato e
    instrada i follow-up a quella sessione fino a chiusura/scadenza. Codex segue
    questo percorso solo quando ACP/acpx è esplicito o il plugin Codex nativo
    non è disponibile per l’operazione richiesta.

    Per `sessions_spawn`, `runtime: "acp"` viene pubblicizzato solo quando ACP
    è abilitato, il richiedente non è in sandbox e un backend runtime ACP
    è caricato. `acp.dispatch.enabled=false` mette in pausa il dispatch automatico
    dei thread ACP, ma non nasconde né blocca le chiamate esplicite
    `sessions_spawn({ runtime: "acp" })`. Punta a id di harness ACP come `codex`,
    `claude`, `droid`, `gemini` o `opencode`. Non passare un normale
    id agente di configurazione OpenClaw da `agents_list`, a meno che quella voce sia
    configurata esplicitamente con `agents.list[].runtime.type="acp"`;
    altrimenti usa il runtime sub-agent predefinito. Quando un agente OpenClaw
    è configurato con `runtime.type="acp"`, OpenClaw usa
    `runtime.acp.agent` come id harness sottostante.

  </Accordion>
</AccordionGroup>

## ACP rispetto ai sub-agent

Usa ACP quando vuoi un runtime harness esterno. Usa **app-server Codex
nativo** per associazione/controllo delle conversazioni Codex quando il plugin `codex`
è abilitato. Usa i **sub-agent** quando vuoi esecuzioni delegate
native di OpenClaw.

| Area          | Sessione ACP                          | Esecuzione sub-agent               |
| ------------- | ------------------------------------- | ---------------------------------- |
| Runtime       | Plugin backend ACP (per esempio acpx) | Runtime sub-agent nativo OpenClaw  |
| Chiave sessione | `agent:<agentId>:acp:<uuid>`        | `agent:<agentId>:subagent:<uuid>`  |
| Comandi principali | `/acp ...`                       | `/subagents ...`                   |
| Strumento spawn | `sessions_spawn` con `runtime:"acp"` | `sessions_spawn` (runtime predefinito) |

Vedi anche [Sub-agent](/it/tools/subagents).

## Come ACP esegue Claude Code

Per Claude Code tramite ACP, lo stack è:

1. Piano di controllo sessione ACP OpenClaw.
2. Plugin runtime ufficiale `@openclaw/acpx`.
3. Adattatore ACP Claude.
4. Meccanismi runtime/sessione lato Claude.

ACP Claude è una **sessione harness** con controlli ACP, ripresa della sessione,
tracciamento delle attività in background e associazione opzionale a conversazione/thread.

I backend CLI sono runtime di fallback locali separati, solo testuali - vedi
[Backend CLI](/it/gateway/cli-backends).

Per gli operatori, la regola pratica è:

- **Vuoi `/acp spawn`, sessioni associabili, controlli runtime o lavoro harness persistente?** Usa ACP.
- **Vuoi un semplice fallback testuale locale tramite la CLI grezza?** Usa i backend CLI.

## Sessioni associate

### Modello mentale

- **Superficie chat** - dove le persone continuano a conversare (canale Discord, topic Telegram, chat iMessage).
- **Sessione ACP** - lo stato runtime durevole Codex/Claude/Gemini a cui OpenClaw instrada.
- **Thread/topic figlio** - una superficie di messaggistica extra opzionale creata solo da `--thread ...`.
- **Workspace runtime** - la posizione nel filesystem (`cwd`, checkout del repo, workspace backend) in cui viene eseguito l’harness. Indipendente dalla superficie chat.

### Associazioni alla conversazione corrente

`/acp spawn <harness> --bind here` fissa la conversazione corrente alla
sessione ACP avviata - nessun thread figlio, stessa superficie chat. OpenClaw continua
a gestire trasporto, autenticazione, sicurezza e consegna. I messaggi di follow-up in quella
conversazione vengono instradati alla stessa sessione; `/new` e `/reset` reimpostano la
sessione sul posto; `/acp close` rimuove l’associazione.

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
    - `--bind here` funziona solo sui canali che pubblicizzano l’associazione alla conversazione corrente; altrimenti OpenClaw restituisce un messaggio di non supporto chiaro. Le associazioni persistono tra riavvii del Gateway.
    - Su Discord, `spawnSessions` controlla la creazione di thread figli per `--thread auto|here` - non `--bind here`.
    - Se esegui lo spawn verso un agente ACP diverso senza `--cwd`, OpenClaw eredita per impostazione predefinita il workspace **dell’agente di destinazione**. I percorsi ereditati mancanti (`ENOENT`/`ENOTDIR`) ricadono sul valore predefinito del backend; altri errori di accesso (ad esempio `EACCES`) emergono come errori di spawn.
    - I comandi di gestione del Gateway restano locali nelle conversazioni associate - i comandi `/acp ...` sono gestiti da OpenClaw anche quando il normale testo di follow-up viene instradato alla sessione ACP associata; anche `/status` e `/unfocus` restano locali ogni volta che la gestione dei comandi è abilitata per quella superficie.

  </Accordion>
  <Accordion title="Sessioni associate a thread">
    Quando le associazioni di thread sono abilitate per un adattatore di canale:

    - OpenClaw associa un thread a una sessione ACP di destinazione.
    - I messaggi di follow-up in quel thread vengono instradati alla sessione ACP associata.
    - L’output ACP viene consegnato allo stesso thread.
    - Unfocus/close/archive/idle-timeout o la scadenza per età massima rimuove l’associazione.
    - `/acp close`, `/acp cancel`, `/acp status`, `/status` e `/unfocus` sono comandi Gateway, non prompt per l’harness ACP.

    Feature flag richiesti per ACP associato a thread:

    - `acp.enabled=true`
    - `acp.dispatch.enabled` è attivo per impostazione predefinita (imposta `false` per mettere in pausa il dispatch automatico dei thread ACP; le chiamate esplicite `sessions_spawn({ runtime: "acp" })` continuano a funzionare).
    - Spawn delle sessioni thread dell’adattatore di canale abilitato (predefinito: `true`):
      - Discord: `channels.discord.threadBindings.spawnSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnSessions=true`

    Il supporto dell’associazione di thread è specifico dell’adattatore. Se l’adattatore
    del canale attivo non supporta le associazioni di thread, OpenClaw restituisce un messaggio
    chiaro di non supporto/non disponibilità.

  </Accordion>
  <Accordion title="Canali con supporto dei thread">
    - Qualsiasi adattatore di canale che espone la capacità di associazione sessione/thread.
    - Supporto integrato attuale: thread/canali **Discord**, topic **Telegram** (topic forum in gruppi/supergruppi e topic DM).
    - I canali plugin possono aggiungere supporto tramite la stessa interfaccia di associazione.

  </Accordion>
</AccordionGroup>

## Associazioni di canale persistenti

Per workflow non effimeri, configura associazioni ACP persistenti nelle
voci `bindings[]` di primo livello.

### Modello di associazione

<ParamField path="bindings[].type" type='"acp"'>
  Contrassegna un’associazione di conversazione ACP persistente.
</ParamField>
<ParamField path="bindings[].match" type="object">
  Identifica la conversazione di destinazione. Forme per canale:

- **Canale/thread Discord:** `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
- **Canale/DM Slack:** `match.channel="slack"` + `match.peer.id="<channelId|channel:<channelId>|#<channelId>|userId|user:<userId>|slack:<userId>|<@userId>>"`. Preferisci gli id Slack stabili; le associazioni di canale corrispondono anche alle risposte dentro i thread di quel canale.
- **Topic forum Telegram:** `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
- **DM/gruppo WhatsApp:** `match.channel="whatsapp"` + `match.peer.id="<E.164|group JID>"`. Usa numeri E.164 come `+15555550123` per le chat dirette e JID di gruppo WhatsApp come `120363424282127706@g.us` per i gruppi.
- **DM/gruppo iMessage:** `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`. Preferisci `chat_id:*` per associazioni di gruppo stabili.

</ParamField>
<ParamField path="bindings[].agentId" type="string">
  L’id dell’agente OpenClaw proprietario.
</ParamField>
<ParamField path="bindings[].acp.mode" type='"persistent" | "oneshot"'>
  Override ACP opzionale.
</ParamField>
<ParamField path="bindings[].acp.label" type="string">
  Etichetta opzionale rivolta all’operatore.
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
- `agents.list[].runtime.acp.agent` (id harness, ad esempio `codex` o `claude`)
- `agents.list[].runtime.acp.backend`
- `agents.list[].runtime.acp.mode`
- `agents.list[].runtime.acp.cwd`

**Precedenza degli override per le sessioni ACP associate:**

1. `bindings[].acp.*`
2. `agents.list[].runtime.acp.*`
3. Valori predefiniti ACP globali (ad esempio `acp.backend`)

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

- OpenClaw assicura che la sessione ACP configurata esista dopo l'ammissione specifica del canale e prima dell'uso.
- I messaggi in quel canale, argomento o chat vengono instradati alla sessione ACP configurata.
- I binding ACP configurati possiedono la propria route di sessione. Il fan-out broadcast del canale non sostituisce la sessione ACP configurata per un binding corrispondente.
- Nelle conversazioni vincolate, `/new` e `/reset` reimpostano in loco la stessa chiave di sessione ACP.
- I binding runtime temporanei, ad esempio quelli creati dai flussi di focus sui thread, continuano ad applicarsi dove presenti.
- Per gli spawn ACP tra agenti senza un `cwd` esplicito, OpenClaw eredita l'area di lavoro dell'agente di destinazione dalla configurazione dell'agente.
- I percorsi dell'area di lavoro ereditati mancanti ripiegano sul cwd predefinito del backend; gli errori di accesso non mancanti emergono come errori di spawn.

## Avviare sessioni ACP

Due modi per avviare una sessione ACP:

<Tabs>
  <Tab title="From sessions_spawn">
    Usa `runtime: "acp"` per avviare una sessione ACP da un turno
    dell'agente o da una chiamata tool.

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
    Usa `/acp spawn` per un controllo esplicito dell'operatore dalla chat.

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
  `"run"` è one-shot; `"session"` è persistente. Se `thread: true` e
  `mode` viene omesso, OpenClaw può usare come predefinito il comportamento
  persistente in base al percorso runtime. `mode: "session"` richiede
  `thread: true`.
</ParamField>
<ParamField path="cwd" type="string">
  Directory di lavoro runtime richiesta, validata dalla policy del
  backend/runtime. Se omessa, lo spawn ACP eredita l'area di lavoro
  dell'agente di destinazione quando configurata; i percorsi ereditati
  mancanti ripiegano sui valori predefiniti del backend, mentre gli errori
  di accesso reali vengono restituiti.
</ParamField>
<ParamField path="label" type="string">
  Etichetta visibile all'operatore usata nel testo della sessione/banner.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  Riprende una sessione ACP esistente invece di crearne una nuova.
  L'agente riproduce la cronologia della conversazione tramite `session/load`.
  Richiede `runtime: "acp"`.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  `"parent"` trasmette gli riepiloghi di avanzamento della run ACP iniziale
  alla sessione richiedente come eventi di sistema. Le risposte accettate
  includono `streamLogPath`, che punta a un log JSONL con ambito di sessione
  (`<sessionId>.acp-stream.jsonl`) che puoi seguire per la cronologia completa
  del relay. I flussi di avanzamento del parent mostrano per impostazione
  predefinita il commento dell'assistente e l'avanzamento dello stato ACP,
  a meno che `streaming.progress.commentary=false`. Anche Discord imposta
  per impostazione predefinita le anteprime del parent sulla modalità di
  avanzamento quando non è configurata alcuna modalità di stream. L'avanzamento
  dello stato rispetta comunque `acp.stream.tagVisibility`, quindi tag come
  `plan` restano nascosti a meno che non siano abilitati esplicitamente.
</ParamField>

Le run ACP di `sessions_spawn` usano `agents.defaults.subagents.runTimeoutSeconds`
per il limite predefinito dei turni child. Il tool non accetta override del
timeout per singola chiamata.

<ParamField path="model" type="string">
  Override esplicito del modello per la sessione child ACP. Gli spawn ACP
  Codex normalizzano riferimenti OpenAI come `openai/gpt-5.4` nella
  configurazione di avvio ACP Codex prima di `session/new`; le forme slash
  come `openai/gpt-5.4/high` impostano anche lo sforzo di ragionamento ACP
  Codex. Quando omesso, `sessions_spawn({ runtime: "acp" })` usa i valori
  predefiniti esistenti del modello subagent (`agents.defaults.subagents.model`
  o `agents.list[].subagents.model`) quando configurati; altrimenti lascia che
  l'harness ACP usi il proprio modello predefinito. Gli altri harness devono
  dichiarare i `models` ACP e supportare `session/set_model`; altrimenti
  OpenClaw/acpx fallisce in modo chiaro invece di ripiegare silenziosamente
  sul valore predefinito dell'agente di destinazione.
</ParamField>
<ParamField path="thinking" type="string">
  Sforzo esplicito di thinking/ragionamento. Per ACP Codex, `minimal` mappa
  allo sforzo basso, `low`/`medium`/`high`/`xhigh` mappano direttamente e
  `off` omette l'override di avvio dello sforzo di ragionamento. Quando
  omesso, gli spawn ACP usano i valori predefiniti esistenti di thinking
  subagent e `agents.defaults.models["provider/model"].params.thinking`
  per il modello selezionato.
</ParamField>

## Modalità di spawn bind e thread

<Tabs>
  <Tab title="--bind here|off">
    | Modalità | Comportamento                                                               |
    | ------ | ---------------------------------------------------------------------- |
    | `here` | Vincola in loco la conversazione attiva corrente; fallisce se non ce n'è una attiva. |
    | `off`  | Non creare un binding della conversazione corrente.                          |

    Note:

    - `--bind here` è il percorso operatore più semplice per "rendere questo canale o questa chat supportati da Codex."
    - `--bind here` non crea un thread child.
    - `--bind here` è disponibile solo sui canali che espongono il supporto al binding della conversazione corrente.
    - `--bind` e `--thread` non possono essere combinati nella stessa chiamata `/acp spawn`.

  </Tab>
  <Tab title="--thread auto|here|off">
    | Modalità | Comportamento                                                                                            |
    | ------ | --------------------------------------------------------------------------------------------------- |
    | `auto` | In un thread attivo: vincola quel thread. Fuori da un thread: crea/vincola un thread child quando supportato. |
    | `here` | Richiede il thread attivo corrente; fallisce se non ci si trova in uno.                                                  |
    | `off`  | Nessun binding. La sessione inizia non vincolata.                                                                 |

    Note:

    - Sulle superfici di binding senza thread, il comportamento predefinito è di fatto `off`.
    - Lo spawn vincolato a thread richiede il supporto della policy del canale:
      - Discord: `channels.discord.threadBindings.spawnSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnSessions=true`
    - Usa `--bind here` quando vuoi fissare la conversazione corrente senza creare un thread child.

  </Tab>
</Tabs>

## Modello di recapito

Le sessioni ACP possono essere aree di lavoro interattive oppure lavoro in
background posseduto dal parent. Il percorso di recapito dipende da tale forma.

<AccordionGroup>
  <Accordion title="Interactive ACP sessions">
    Le sessioni interattive sono pensate per continuare a conversare su una
    superficie chat visibile:

    - `/acp spawn ... --bind here` vincola la conversazione corrente alla sessione ACP.
    - `/acp spawn ... --thread ...` vincola un thread/argomento del canale alla sessione ACP.
    - I `bindings[].type="acp"` configurati e persistenti instradano le conversazioni corrispondenti alla stessa sessione ACP.

    I messaggi successivi nella conversazione vincolata vengono instradati
    direttamente alla sessione ACP e l'output ACP viene recapitato di nuovo
    allo stesso canale/thread/argomento.

    Cosa invia OpenClaw all'harness:

    - I normali follow-up vincolati vengono inviati come testo del prompt, più allegati solo quando l'harness/backend li supporta.
    - I comandi di gestione `/acp` e i comandi Gateway locali vengono intercettati prima del dispatch ACP.
    - Gli eventi di completamento generati dal runtime vengono materializzati per destinazione. Gli agenti OpenClaw ricevono l'envelope interno runtime-context di OpenClaw; gli harness ACP esterni ricevono un prompt semplice con il risultato child e l'istruzione. L'envelope grezza `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>` non deve mai essere inviata a harness esterni o persistita come testo di trascrizione utente ACP.
    - Le voci della trascrizione ACP usano il testo del trigger visibile all'utente o il prompt di completamento semplice. I metadati interni degli eventi restano strutturati in OpenClaw dove possibile e non vengono trattati come contenuto chat scritto dall'utente.

  </Accordion>
  <Accordion title="Parent-owned one-shot ACP sessions">
    Le sessioni ACP one-shot generate da un'altra run agente sono child in
    background, simili ai sub-agent:

    - Il parent richiede lavoro con `sessions_spawn({ runtime: "acp", mode: "run" })`.
    - Il child viene eseguito nella propria sessione harness ACP.
    - I turni child vengono eseguiti sulla stessa lane in background usata dagli spawn sub-agent nativi, quindi un harness ACP lento non blocca il lavoro non correlato della sessione principale.
    - I completamenti vengono riportati tramite il percorso di annuncio del completamento del task. OpenClaw converte i metadati interni di completamento in un prompt ACP semplice prima di inviarli a un harness esterno, così gli harness non vedono marcatori di contesto runtime esclusivi di OpenClaw.
    - Il parent riscrive il risultato child con una normale voce da assistente quando è utile una risposta visibile all'utente.

    **Non** trattare questo percorso come una chat peer-to-peer tra parent
    e child. Il child dispone già di un canale di completamento verso il
    parent.

  </Accordion>
  <Accordion title="sessions_send and A2A delivery">
    `sessions_send` può indirizzare un'altra sessione dopo lo spawn. Per le
    normali sessioni peer, OpenClaw usa un percorso di follow-up agent-to-agent
    (A2A) dopo aver iniettato il messaggio:

    - Attendi la risposta della sessione di destinazione.
    - Facoltativamente, lascia che richiedente e destinazione scambino un numero limitato di turni di follow-up.
    - Chiedi alla destinazione di produrre un messaggio di annuncio.
    - Recapita quell'annuncio al canale o thread visibile.

    Quel percorso A2A è un fallback per gli invii peer in cui il mittente
    necessita di un follow-up visibile. Rimane abilitato quando una sessione
    non correlata può vedere e inviare messaggi a una destinazione ACP, ad
    esempio con impostazioni ampie di `tools.sessions.visibility`.

    OpenClaw salta il follow-up A2A solo quando il richiedente è il
    genitore del proprio figlio ACP one-shot posseduto dal genitore. In quel caso,
    eseguire A2A sopra il completamento dell'attività può risvegliare il genitore con il
    risultato del figlio, inoltrare la risposta del genitore di nuovo al figlio e
    creare un ciclo di eco genitore/figlio. Il risultato di `sessions_send` segnala
    `delivery.status="skipped"` per quel caso di figlio posseduto perché il
    percorso di completamento è già responsabile del risultato.

  </Accordion>
  <Accordion title="Riprendi una sessione esistente">
    Usa `resumeSessionId` per continuare una sessione ACP precedente invece di
    ricominciare da zero. L'agente riproduce la cronologia della conversazione tramite
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

    - Passa una sessione Codex dal laptop al telefono: dì al tuo agente di riprendere da dove eri rimasto.
    - Continua una sessione di codifica avviata interattivamente nella CLI, ora in modalità headless tramite il tuo agente.
    - Riprendi il lavoro interrotto da un riavvio del gateway o da un timeout di inattività.

    Note:

    - `resumeSessionId` si applica solo quando `runtime: "acp"`; il runtime predefinito del sotto-agente ignora questo campo solo ACP.
    - `streamTo` si applica solo quando `runtime: "acp"`; il runtime predefinito del sotto-agente ignora questo campo solo ACP.
    - `resumeSessionId` è un id di ripresa ACP/harness locale all'host, non una chiave di sessione del canale OpenClaw; OpenClaw controlla comunque la policy di spawn ACP e la policy dell'agente di destinazione prima del dispatch, mentre il backend ACP o l'harness possiede l'autorizzazione per caricare quell'id upstream.
    - `resumeSessionId` ripristina la cronologia della conversazione ACP upstream; `thread` e `mode` si applicano comunque normalmente alla nuova sessione OpenClaw che stai creando, quindi `mode: "session"` richiede ancora `thread: true`.
    - L'agente di destinazione deve supportare `session/load` (Codex e Claude Code lo supportano).
    - Se l'id di sessione non viene trovato, lo spawn fallisce con un errore chiaro: nessun fallback silenzioso a una nuova sessione.

  </Accordion>
  <Accordion title="Smoke test post-distribuzione">
    Dopo una distribuzione del Gateway, esegui un controllo end-to-end live invece di
    fidarti dei test unitari:

    1. Verifica la versione e il commit del Gateway distribuito sull'host di destinazione.
    2. Apri una sessione bridge ACPX temporanea verso un agente live.
    3. Chiedi a quell'agente di chiamare `sessions_spawn` con `runtime: "acp"`, `agentId: "codex"`, `mode: "run"` e attività `Reply with exactly LIVE-ACP-SPAWN-OK`.
    4. Verifica `accepted=yes`, un vero `childSessionKey` e nessun errore del validatore.
    5. Pulisci la sessione bridge temporanea.

    Mantieni il gate su `mode: "run"` e salta `streamTo: "parent"`:
    i percorsi `mode: "session"` legati al thread e di stream-relay sono passaggi
    di integrazione separati e più ricchi.

  </Accordion>
</AccordionGroup>

## Compatibilità sandbox

Le sessioni ACP attualmente vengono eseguite sul runtime host, **non** dentro la
sandbox OpenClaw.

<Warning>
**Confine di sicurezza:**

- L'harness esterno può leggere/scrivere secondo le proprie autorizzazioni CLI e il `cwd` selezionato.
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
   - poi l'id di sessione in formato UUID
   - poi l'etichetta
2. Binding del thread corrente (se questa conversazione/thread è associata a una sessione ACP).
3. Fallback della sessione richiedente corrente.

I binding della conversazione corrente e i binding del thread partecipano entrambi al
passaggio 2.

Se nessuna destinazione viene risolta, OpenClaw restituisce un errore chiaro
(`Unable to resolve session target: ...`).

## Controlli ACP

| Comando              | Cosa fa                                                   | Esempio                                                       |
| -------------------- | --------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | Crea sessione ACP; binding corrente o del thread opzionale. | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | Annulla il turno in corso per la sessione di destinazione. | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | Invia un'istruzione di guida alla sessione in esecuzione. | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | Chiude la sessione e rimuove i binding delle destinazioni del thread. | `/acp close`                                                  |
| `/acp status`        | Mostra backend, modalità, stato, opzioni runtime, capacità. | `/acp status`                                                 |
| `/acp set-mode`      | Imposta la modalità runtime per la sessione di destinazione. | `/acp set-mode plan`                                          |
| `/acp set`           | Scrittura generica di un'opzione di configurazione runtime. | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | Imposta l'override della directory di lavoro runtime.      | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | Imposta il profilo della policy di approvazione.           | `/acp permissions strict`                                     |
| `/acp timeout`       | Imposta il timeout runtime (secondi).                      | `/acp timeout 120`                                            |
| `/acp model`         | Imposta l'override del modello runtime.                    | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | Rimuove gli override delle opzioni runtime della sessione. | `/acp reset-options`                                          |
| `/acp sessions`      | Elenca le sessioni ACP recenti dallo store.                | `/acp sessions`                                               |
| `/acp doctor`        | Salute del backend, capacità, correzioni azionabili.       | `/acp doctor`                                                 |
| `/acp install`       | Stampa passaggi deterministici di installazione e abilitazione. | `/acp install`                                                |

I controlli runtime (`spawn`, `cancel`, `steer`, `close`, `status`, `set-mode`,
`set`, `cwd`, `permissions`, `timeout`, `model` e `reset-options`) richiedono
l'identità del proprietario dai canali esterni e `operator.admin` dai client Gateway
interni. I mittenti autorizzati non proprietari possono comunque usare `sessions`, `doctor`,
`install` e `help`.

`/acp status` mostra le opzioni runtime effettive più gli identificatori di sessione a livello runtime e
backend. Gli errori di controllo non supportato emergono
chiaramente quando un backend non dispone di una capacità. `/acp sessions` legge lo
store per la sessione corrente associata o richiedente; i token di destinazione
(`session-key`, `session-id` o `session-label`) vengono risolti tramite
la discovery delle sessioni Gateway, incluse le radici `session.store`
personalizzate per agente.

### Mappatura delle opzioni runtime

`/acp` dispone di comandi di comodità e di un setter generico. Operazioni
equivalenti:

| Comando                      | Mappa a                              | Note                                                                                                                                                                                                      |
| ---------------------------- | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/acp model <id>`            | chiave di configurazione runtime `model` | Per Codex ACP, OpenClaw normalizza `openai/<model>` nell'id del modello dell'adapter e mappa i suffissi di reasoning con slash, come `openai/gpt-5.4/high`, a `reasoning_effort`.                         |
| `/acp set thinking <level>`  | opzione canonica `thinking`          | OpenClaw invia l'equivalente pubblicizzato dal backend quando presente, preferendo `thinking`, poi `effort`, `reasoning_effort` o `thought_level`. Per Codex ACP, l'adapter mappa i valori a `reasoning_effort`. |
| `/acp permissions <profile>` | opzione canonica `permissionProfile` | OpenClaw invia l'equivalente pubblicizzato dal backend quando presente, come `approval_policy`, `permission_profile`, `permissions` o `permission_mode`.                                                   |
| `/acp timeout <seconds>`     | opzione canonica `timeoutSeconds`    | OpenClaw invia l'equivalente pubblicizzato dal backend quando presente, come `timeout` o `timeout_seconds`.                                                                                               |
| `/acp cwd <path>`            | override cwd runtime                 | Aggiornamento diretto.                                                                                                                                                                                     |
| `/acp set <key> <value>`     | generico                             | `key=cwd` usa il percorso di override cwd.                                                                                                                                                                |
| `/acp reset-options`         | cancella tutti gli override runtime  | -                                                                                                                                                                                                          |

## Harness acpx, configurazione dei Plugin e autorizzazioni

Per la configurazione dell'harness acpx (alias Claude Code / Codex / Gemini CLI),
i bridge MCP plugin-tools e OpenClaw-tools e le modalità di autorizzazione
ACP, vedi
[Agenti ACP - configurazione](/it/tools/acp-agents-setup).

## Risoluzione dei problemi

| Sintomo                                                                     | Causa probabile                                                                                                           | Correzione                                                                                                                                                                      |
| --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ACP runtime backend is not configured`                                     | Plugin di backend mancante, disabilitato o bloccato da `plugins.allow`.                                                       | Installa e abilita il Plugin di backend, includi `acpx` in `plugins.allow` quando quella allowlist è impostata, quindi esegui `/acp doctor`.                                                 |
| `ACP is disabled by policy (acp.enabled=false)`                             | ACP disabilitato globalmente.                                                                                                 | Imposta `acp.enabled=true`.                                                                                                                                                  |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`           | Dispatch automatico dai normali messaggi del thread disabilitato.                                                               | Imposta `acp.dispatch.enabled=true` per riprendere l'instradamento automatico dei thread; le chiamate esplicite a `sessions_spawn({ runtime: "acp" })` continuano a funzionare.                                      |
| `ACP agent "<id>" is not allowed by policy`                                 | Agent non presente nella allowlist.                                                                                                | Usa un `agentId` consentito o aggiorna `acp.allowedAgents`.                                                                                                                     |
| `/acp doctor` segnala che il backend non è pronto subito dopo l'avvio                 | Il Plugin di backend è mancante, disabilitato, bloccato da criteri allow/deny oppure il suo eseguibile configurato non è disponibile.        | Installa/abilita il Plugin di backend, riesegui `/acp doctor` e controlla l'errore di installazione o di policy del backend se resta non integro.                                           |
| Comando dell'harness non trovato                                                   | La CLI dell'adapter non è installata, il Plugin esterno è mancante o il recupero `npx` al primo avvio non è riuscito per un adapter non Codex. | Esegui `/acp doctor`, installa/precarica l'adapter sull'host del Gateway oppure configura esplicitamente il comando dell'agent acpx.                                                      |
| Model-not-found dall'harness                                            | L'ID del modello è valido per un altro provider/harness ma non per questo target ACP.                                                | Usa un modello elencato da quell'harness, configura il modello nell'harness oppure ometti l'override.                                                                            |
| Errore di autenticazione del vendor dall'harness                                          | OpenClaw è integro, ma la CLI o il provider di destinazione non ha effettuato l'accesso.                                                     | Accedi o fornisci la chiave provider richiesta nell'ambiente dell'host del Gateway.                                                                                             |
| `Unable to resolve session target: ...`                                     | Token key/id/label errato.                                                                                                | Esegui `/acp sessions`, copia la key/label esatta e riprova.                                                                                                                        |
| `--bind here requires running /acp spawn inside an active ... conversation` | `--bind here` usato senza una conversazione attiva collegabile.                                                            | Spostati nella chat/canale di destinazione e riprova, oppure usa uno spawn non collegato.                                                                                                         |
| `Conversation bindings are unavailable for <channel>.`                      | L'adapter non dispone della capacità di binding ACP per la conversazione corrente.                                                             | Usa `/acp spawn ... --thread ...` dove supportato, configura `bindings[]` di primo livello oppure spostati in un canale supportato.                                                     |
| `--thread here requires running /acp spawn inside an active ... thread`     | `--thread here` usato fuori da un contesto di thread.                                                                         | Spostati nel thread di destinazione oppure usa `--thread auto`/`off`.                                                                                                                      |
| `Only <user-id> can rebind this channel/conversation/thread.`               | Un altro utente possiede la destinazione di binding attiva.                                                                           | Riesegui il binding come proprietario oppure usa una conversazione o un thread diverso.                                                                                                               |
| `Thread bindings are unavailable for <channel>.`                            | L'adapter non dispone della capacità di binding dei thread.                                                                               | Usa `--thread off` oppure spostati in un adapter/canale supportato.                                                                                                                 |
| `Sandboxed sessions cannot spawn ACP sessions ...`                          | Il runtime ACP è lato host; la sessione richiedente è in sandbox.                                                              | Usa `runtime="subagent"` dalle sessioni in sandbox oppure esegui lo spawn ACP da una sessione non in sandbox.                                                                         |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`     | `sandbox="require"` richiesto per il runtime ACP.                                                                         | Usa `runtime="subagent"` per il sandboxing obbligatorio oppure usa ACP con `sandbox="inherit"` da una sessione non in sandbox.                                                      |
| `Cannot apply --model ... did not advertise model support`                  | L'harness di destinazione non espone il cambio di modello ACP generico.                                                        | Usa un harness che dichiara ACP `models`/`session/set_model`, usa i riferimenti modello ACP di Codex oppure configura il modello direttamente nell'harness se dispone di un proprio flag di avvio. |
| Metadati ACP mancanti per la sessione collegata                                      | Metadati della sessione ACP obsoleti/eliminati.                                                                                    | Ricrea con `/acp spawn`, quindi riesegui il binding/metti a fuoco il thread.                                                                                                                    |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`    | `permissionMode` blocca scritture/esecuzione nella sessione ACP non interattiva.                                                    | Imposta `plugins.entries.acpx.config.permissionMode` su `approve-all` e riavvia il Gateway. Vedi [Configurazione dei permessi](/it/tools/acp-agents-setup#permission-configuration). |
| La sessione ACP fallisce presto con poco output                                  | Le richieste di permesso sono bloccate da `permissionMode`/`nonInteractivePermissions`.                                        | Controlla nei log del Gateway la presenza di `AcpRuntimeError`. Per permessi completi, imposta `permissionMode=approve-all`; per una degradazione graduale, imposta `nonInteractivePermissions=deny`.        |
| La sessione ACP si blocca indefinitamente dopo aver completato il lavoro                       | Il processo dell'harness è terminato ma la sessione ACP non ha segnalato il completamento.                                                    | Aggiorna OpenClaw; l'attuale pulizia di acpx elimina i processi wrapper e adapter obsoleti di proprietà di OpenClaw alla chiusura e all'avvio del Gateway.                                             |
| L'harness vede `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>`                        | Envelope evento interno trapelato oltre il confine ACP.                                                                | Aggiorna OpenClaw e riesegui il flusso di completamento; gli harness esterni dovrebbero ricevere solo prompt di completamento semplici.                                                          |

<Note>
`Command blocked by PreToolUse hook: Native hook relay unavailable` appartiene al
relay hook nativo di Codex, non ad ACP/acpx. In una chat Codex collegata, avvia una nuova
sessione con `/new` o `/reset`; se funziona una volta e poi si ripresenta alla successiva
chiamata nativa dello strumento, riavvia l'app-server Codex o il Gateway OpenClaw invece di
ripetere `/new`. Vedi [Risoluzione dei problemi dell'harness Codex](/it/plugins/codex-harness#troubleshooting).
</Note>

## Correlati

- [Agent ACP - configurazione](/it/tools/acp-agents-setup)
- [Invio agent](/it/tools/agent-send)
- [Backend CLI](/it/gateway/cli-backends)
- [Harness Codex](/it/plugins/codex-harness)
- [Runtime dell'harness Codex](/it/plugins/codex-harness-runtime)
- [Strumenti sandbox multi-agent](/it/tools/multi-agent-sandbox-tools)
- [`openclaw acp` (modalità bridge)](/it/cli/acp)
- [Sub-agent](/it/tools/subagents)
