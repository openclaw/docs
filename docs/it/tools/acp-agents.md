---
read_when:
    - Esecuzione degli ambienti di codifica tramite ACP
    - Configurare sessioni ACP legate alla conversazione sui canali di messaggistica
    - Associare una conversazione di un canale di messaggistica a una sessione ACP persistente
    - Risoluzione dei problemi del backend ACP, del collegamento dei Plugin o del recapito dei completamenti
    - Usare i comandi /acp dalla chat
sidebarTitle: ACP agents
summary: Esegui strumenti di programmazione esterni (Claude Code, Cursor, Gemini CLI, Codex ACP esplicito, OpenClaw ACP, OpenCode) tramite il backend ACP
title: Agenti ACP
x-i18n:
    generated_at: "2026-05-01T08:34:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: bb4164208571799f2d78d324f86c9b2fb72c60489ac2c367256f222495c74dbf
    source_path: tools/acp-agents.md
    workflow: 16
---

Le sessioni [Agent Client Protocol (ACP)](https://agentclientprotocol.com/)
consentono a OpenClaw di eseguire harness di coding esterni (per esempio Pi, Claude Code,
Cursor, Copilot, Droid, OpenClaw ACP, OpenCode, Gemini CLI e altri
harness ACPX supportati) tramite un plugin backend ACP.

Ogni avvio di sessione ACP viene tracciato come [attività in background](/it/automation/tasks).

<Note>
**ACP è il percorso per harness esterni, non il percorso Codex predefinito.** Il
plugin app-server nativo di Codex possiede i controlli `/codex ...` e il
runtime incorporato `agentRuntime.id: "codex"`; ACP possiede i controlli
`/acp ...` e le sessioni `sessions_spawn({ runtime: "acp" })`.

Se vuoi che Codex o Claude Code si connettano come client MCP esterni
direttamente alle conversazioni di canale OpenClaw esistenti, usa
[`openclaw mcp serve`](/it/cli/mcp) invece di ACP.
</Note>

## Quale pagina mi serve?

| Vuoi…                                                                                    | Usa questo                              | Note                                                                                                                                                                                         |
| ----------------------------------------------------------------------------------------------- | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Associare o controllare Codex nella conversazione corrente                                               | `/codex bind`, `/codex threads`       | Percorso app-server nativo di Codex quando il plugin `codex` è abilitato; include risposte chat associate, inoltro immagini, modello/veloce/autorizzazioni, arresto e controlli di indirizzamento. ACP è un fallback esplicito |
| Eseguire Claude Code, Gemini CLI, Codex ACP esplicito o un altro harness esterno _tramite_ OpenClaw | Questa pagina                             | Sessioni associate alla chat, `/acp spawn`, `sessions_spawn({ runtime: "acp" })`, attività in background, controlli runtime                                                                                   |
| Esporre una sessione Gateway OpenClaw _come_ server ACP per un editor o client                   | [`openclaw acp`](/it/cli/acp)            | Modalità bridge. L'IDE/client parla ACP con OpenClaw tramite stdio/WebSocket                                                                                                                            |
| Riutilizzare una CLI AI locale come modello di fallback solo testuale                                              | [Backend CLI](/it/gateway/cli-backends) | Non ACP. Nessuno strumento OpenClaw, nessun controllo ACP, nessun runtime harness                                                                                                                               |

## Funziona subito?

Di solito sì. Le nuove installazioni includono il plugin runtime `acpx` in bundle abilitato
per impostazione predefinita, con un binario `acpx` fissato localmente al plugin che OpenClaw verifica
e ripara automaticamente subito dopo che il listener HTTP del Gateway è attivo. Esegui
`/acp doctor` per un controllo di prontezza.

OpenClaw istruisce gli agenti sull'avvio ACP solo quando ACP è **davvero
utilizzabile**: ACP deve essere abilitato, il dispatch non deve essere disabilitato, la sessione
corrente non deve essere bloccata dalla sandbox e un backend runtime deve essere
caricato. Se queste condizioni non sono soddisfatte, le Skills del plugin ACP e la
guida ACP di `sessions_spawn` restano nascoste, così l'agente non suggerisce
un backend non disponibile.

<AccordionGroup>
  <Accordion title="Problemi comuni al primo avvio">
    - Se `plugins.allow` è impostato, è un inventario plugin restrittivo e **deve** includere `acpx`; altrimenti il valore predefinito in bundle viene bloccato intenzionalmente e `/acp doctor` segnala la voce mancante nella allowlist.
    - L'adapter ACP Codex in bundle viene predisposto con il plugin `acpx` e avviato localmente quando possibile.
    - Altri adapter di harness target possono comunque essere scaricati su richiesta con `npx` la prima volta che li usi.
    - L'autenticazione del vendor deve comunque esistere sull'host per quell'harness.
    - Se l'host non ha npm o accesso alla rete, i download degli adapter al primo avvio falliscono finché le cache non vengono preriscaldate o l'adapter non viene installato in un altro modo.

  </Accordion>
  <Accordion title="Prerequisiti runtime">
    ACP avvia un vero processo harness esterno. OpenClaw possiede routing,
    stato delle attività in background, consegna, associazioni e policy; l'harness
    possiede il proprio login provider, catalogo modelli, comportamento del filesystem e
    strumenti nativi.

    Prima di attribuire il problema a OpenClaw, verifica che:

    - `/acp doctor` segnali un backend abilitato e integro.
    - L'id target sia consentito da `acp.allowedAgents` quando quella allowlist è impostata.
    - Il comando dell'harness possa avviarsi sull'host Gateway.
    - L'autenticazione del provider sia presente per quell'harness (`claude`, `codex`, `gemini`, `opencode`, `droid`, ecc.).
    - Il modello selezionato esista per quell'harness: gli id modello non sono portabili tra harness.
    - Il `cwd` richiesto esista e sia accessibile, oppure ometti `cwd` e lascia che il backend usi il proprio valore predefinito.
    - La modalità di autorizzazione corrisponda al lavoro. Le sessioni non interattive non possono fare clic sui prompt di autorizzazione nativi, quindi le esecuzioni di coding con molte scritture/esecuzioni di solito richiedono un profilo di autorizzazioni ACPX che possa procedere senza intervento.

  </Accordion>
</AccordionGroup>

Gli strumenti dei plugin OpenClaw e gli strumenti OpenClaw integrati **non** sono esposti agli
harness ACP per impostazione predefinita. Abilita i bridge MCP espliciti in
[Agenti ACP — configurazione](/it/tools/acp-agents-setup) solo quando l'harness
deve chiamare direttamente quegli strumenti.

## Target harness supportati

Con il backend `acpx` in bundle, usa questi id harness come target di `/acp spawn <id>`
o `sessions_spawn({ runtime: "acp", agentId: "<id>" })`:

| Id harness | Backend tipico                                | Note                                                                               |
| ---------- | ---------------------------------------------- | ----------------------------------------------------------------------------------- |
| `claude`   | Adapter ACP Claude Code                        | Richiede l'autenticazione Claude Code sull'host.                                              |
| `codex`    | Adapter ACP Codex                              | Fallback ACP esplicito solo quando `/codex` nativo non è disponibile o viene richiesto ACP. |
| `copilot`  | Adapter ACP GitHub Copilot                     | Richiede autenticazione CLI/runtime Copilot.                                                  |
| `cursor`   | ACP Cursor CLI (`cursor-agent acp`)            | Sovrascrivi il comando acpx se un'installazione locale espone un entrypoint ACP diverso.    |
| `droid`    | Factory Droid CLI                              | Richiede autenticazione Factory/Droid o `FACTORY_API_KEY` nell'ambiente dell'harness.        |
| `gemini`   | Adapter ACP Gemini CLI                         | Richiede autenticazione Gemini CLI o configurazione della chiave API.                                          |
| `iflow`    | iFlow CLI                                      | Disponibilità dell'adapter e controllo del modello dipendono dalla CLI installata.                 |
| `kilocode` | Kilo Code CLI                                  | Disponibilità dell'adapter e controllo del modello dipendono dalla CLI installata.                 |
| `kimi`     | Kimi/Moonshot CLI                              | Richiede autenticazione Kimi/Moonshot sull'host.                                            |
| `kiro`     | Kiro CLI                                       | Disponibilità dell'adapter e controllo del modello dipendono dalla CLI installata.                 |
| `opencode` | Adapter ACP OpenCode                           | Richiede autenticazione CLI/provider OpenCode.                                                |
| `openclaw` | Bridge Gateway OpenClaw tramite `openclaw acp` | Consente a un harness compatibile con ACP di comunicare con una sessione Gateway OpenClaw.                 |
| `pi`       | Runtime Pi/OpenClaw incorporato                   | Usato per esperimenti di harness nativi OpenClaw.                                       |
| `qwen`     | Qwen Code / Qwen CLI                           | Richiede autenticazione compatibile con Qwen sull'host.                                          |

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
    Continua nella conversazione o nel thread associato (oppure specifica
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
  <Step title="Indirizza">
    Senza sostituire il contesto: `/acp steer tighten logging and continue`.
  </Step>
  <Step title="Arresta">
    `/acp cancel` (turno corrente) o `/acp close` (sessione + associazioni).
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Dettagli del ciclo di vita">
    - L'avvio crea o riprende una sessione runtime ACP, registra i metadati ACP nello store delle sessioni OpenClaw e può creare un'attività in background quando l'esecuzione è posseduta dal genitore.
    - Le sessioni ACP possedute dal genitore vengono trattate come lavoro in background anche quando la sessione runtime è persistente; completamento e consegna cross-surface passano attraverso il notificatore dell'attività genitore invece di comportarsi come una normale sessione chat rivolta all'utente.
    - La manutenzione delle attività chiude le sessioni ACP terminali o orfane one-shot possedute dal genitore. Le sessioni ACP persistenti vengono conservate finché resta un'associazione attiva a una conversazione; le sessioni persistenti obsolete senza un'associazione attiva vengono chiuse, così non possono essere riprese silenziosamente dopo che l'attività proprietaria è terminata o il suo record attività è scomparso.
    - I messaggi di follow-up associati vanno direttamente alla sessione ACP finché l'associazione non viene chiusa, sfocata, reimpostata o scade.
    - I comandi Gateway restano locali. `/acp ...`, `/status` e `/unfocus` non vengono mai inviati come normale testo del prompt a un harness ACP associato.
    - `cancel` interrompe il turno attivo quando il backend supporta l'annullamento; non elimina l'associazione né i metadati della sessione.
    - `close` termina la sessione ACP dal punto di vista di OpenClaw e rimuove l'associazione. Un harness può comunque mantenere la propria cronologia upstream se supporta la ripresa.
    - I worker runtime inattivi sono idonei alla pulizia dopo `acp.runtime.ttlMinutes`; i metadati di sessione memorizzati restano disponibili per `/acp sessions`.

  </Accordion>
  <Accordion title="Regole di routing Codex nativo">
    Trigger in linguaggio naturale che dovrebbero instradare al **plugin Codex
    nativo** quando è abilitato:

    - "Associa questo canale Discord a Codex."
    - "Collega questa chat al thread Codex `<id>`."
    - "Mostra i thread Codex, poi associa questo."

    L'associazione delle conversazioni Codex native è il percorso predefinito di controllo chat.
    Gli strumenti dinamici OpenClaw continuano a essere eseguiti tramite OpenClaw, mentre
    gli strumenti nativi Codex come shell/apply-patch vengono eseguiti dentro Codex.
    Per gli eventi degli strumenti nativi Codex, OpenClaw inietta un relay di hook nativo
    per turno, così gli hook dei plugin possono bloccare `before_tool_call`, osservare
    `after_tool_call` e instradare gli eventi Codex `PermissionRequest`
    attraverso le approvazioni OpenClaw. Gli hook Codex `Stop` vengono inoltrati a
    `before_agent_finalize` di OpenClaw, dove i plugin possono richiedere un ulteriore
    passaggio del modello prima che Codex finalizzi la risposta. Il relay resta
    deliberatamente conservativo: non modifica gli argomenti degli strumenti nativi Codex
    né riscrive i record dei thread Codex. Usa ACP esplicito solo
    quando vuoi il modello runtime/sessione ACP. Il confine del supporto Codex
    incorporato è documentato nel
    [contratto di supporto harness Codex v1](/it/plugins/codex-harness#v1-support-contract).

  </Accordion>
  <Accordion title="Promemoria per la selezione di modello / provider / runtime">
    - `openai-codex/*` — percorso OAuth/abbonamento PI Codex.
    - `openai/*` più `agentRuntime.id: "codex"` — runtime incorporato nativo del server applicativo Codex.
    - `/codex ...` — controllo nativo della conversazione Codex.
    - `/acp ...` o `runtime: "acp"` — controllo ACP/acpx esplicito.

  </Accordion>
  <Accordion title="Trigger in linguaggio naturale per l'instradamento ACP">
    Trigger che dovrebbero instradare al runtime ACP:

    - "Esegui questo come sessione ACP Claude Code one-shot e riassumi il risultato."
    - "Usa Gemini CLI per questo task in un thread, poi mantieni i follow-up nello stesso thread."
    - "Esegui Codex tramite ACP in un thread in background."

    OpenClaw seleziona `runtime: "acp"`, risolve l'`agentId` dell'harness,
    si associa alla conversazione o al thread corrente quando supportato e
    instrada i follow-up a quella sessione fino alla chiusura/scadenza. Codex segue
    questo percorso solo quando ACP/acpx è esplicito o il plugin nativo Codex
    non è disponibile per l'operazione richiesta.

    Per `sessions_spawn`, `runtime: "acp"` viene pubblicizzato solo quando ACP
    è abilitato, il richiedente non è in sandbox e un backend runtime ACP
    è caricato. `acp.dispatch.enabled=false` mette in pausa il dispatch automatico
    dei thread ACP ma non nasconde né blocca le chiamate esplicite
    `sessions_spawn({ runtime: "acp" })`. Ha come target id di harness ACP come `codex`,
    `claude`, `droid`, `gemini` o `opencode`. Non passare un normale
    id agente di configurazione OpenClaw da `agents_list` a meno che quella voce non sia
    configurata esplicitamente con `agents.list[].runtime.type="acp"`;
    altrimenti usa il runtime sub-agente predefinito. Quando un agente OpenClaw
    è configurato con `runtime.type="acp"`, OpenClaw usa
    `runtime.acp.agent` come id harness sottostante.

  </Accordion>
</AccordionGroup>

## ACP rispetto ai sub-agenti

Usa ACP quando vuoi un runtime harness esterno. Usa il **server applicativo
Codex nativo** per il binding/controllo delle conversazioni Codex quando il plugin
`codex` è abilitato. Usa i **sub-agenti** quando vuoi esecuzioni delegate
native di OpenClaw.

| Area          | Sessione ACP                           | Esecuzione sub-agente               |
| ------------- | -------------------------------------- | ----------------------------------- |
| Runtime       | Plugin backend ACP (per esempio acpx)  | Runtime sub-agente nativo OpenClaw  |
| Chiave sessione | `agent:<agentId>:acp:<uuid>`         | `agent:<agentId>:subagent:<uuid>`   |
| Comandi principali | `/acp ...`                       | `/subagents ...`                    |
| Strumento di spawn | `sessions_spawn` con `runtime:"acp"` | `sessions_spawn` (runtime predefinito) |

Vedi anche [Sub-agenti](/it/tools/subagents).

## Come ACP esegue Claude Code

Per Claude Code tramite ACP, lo stack è:

1. Piano di controllo delle sessioni ACP OpenClaw.
2. Plugin runtime `acpx` in bundle.
3. Adattatore ACP Claude.
4. Meccanismi runtime/sessione lato Claude.

ACP Claude è una **sessione harness** con controlli ACP, ripresa della sessione,
tracciamento dei task in background e binding opzionale a conversazione/thread.

I backend CLI sono runtime di fallback locali separati, solo testuali — vedi
[Backend CLI](/it/gateway/cli-backends).

Per gli operatori, la regola pratica è:

- **Vuoi `/acp spawn`, sessioni associabili, controlli runtime o lavoro harness persistente?** Usa ACP.
- **Vuoi un semplice fallback testuale locale tramite la CLI grezza?** Usa i backend CLI.

## Sessioni associate

### Modello mentale

- **Superficie chat** — dove le persone continuano a parlare (canale Discord, topic Telegram, chat iMessage).
- **Sessione ACP** — lo stato runtime durevole Codex/Claude/Gemini a cui OpenClaw instrada.
- **Thread/topic figlio** — una superficie di messaggistica opzionale aggiuntiva creata solo da `--thread ...`.
- **Workspace runtime** — la posizione nel filesystem (`cwd`, checkout del repo, workspace backend) in cui viene eseguito l'harness. Indipendente dalla superficie chat.

### Binding alla conversazione corrente

`/acp spawn <harness> --bind here` fissa la conversazione corrente alla
sessione ACP avviata — nessun thread figlio, stessa superficie chat. OpenClaw continua a
gestire trasporto, autenticazione, sicurezza e consegna. I messaggi di follow-up in quella
conversazione vengono instradati alla stessa sessione; `/new` e `/reset` reimpostano la
sessione sul posto; `/acp close` rimuove il binding.

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
  <Accordion title="Regole di binding ed esclusività">
    - `--bind here` e `--thread ...` si escludono a vicenda.
    - `--bind here` funziona solo sui canali che dichiarano il supporto al binding della conversazione corrente; altrimenti OpenClaw restituisce un chiaro messaggio di non supporto. I binding persistono tra i riavvii del gateway.
    - Su Discord, `spawnAcpSessions` è richiesto solo quando OpenClaw deve creare un thread figlio per `--thread auto|here` — non per `--bind here`.
    - Se avvii lo spawn verso un agente ACP diverso senza `--cwd`, per impostazione predefinita OpenClaw eredita il workspace dell'**agente target**. I percorsi ereditati mancanti (`ENOENT`/`ENOTDIR`) ripiegano sul valore predefinito del backend; altri errori di accesso (per esempio `EACCES`) emergono come errori di spawn.
    - I comandi di gestione Gateway restano locali nelle conversazioni associate — i comandi `/acp ...` sono gestiti da OpenClaw anche quando il normale testo di follow-up viene instradato alla sessione ACP associata; anche `/status` e `/unfocus` restano locali ogni volta che la gestione dei comandi è abilitata per quella superficie.

  </Accordion>
  <Accordion title="Sessioni associate a thread">
    Quando i binding dei thread sono abilitati per un adattatore di canale:

    - OpenClaw associa un thread a una sessione ACP target.
    - I messaggi di follow-up in quel thread vengono instradati alla sessione ACP associata.
    - L'output ACP viene riconsegnato allo stesso thread.
    - Unfocus/chiusura/archiviazione/timeout di inattività o scadenza per età massima rimuovono il binding.
    - `/acp close`, `/acp cancel`, `/acp status`, `/status` e `/unfocus` sono comandi Gateway, non prompt per l'harness ACP.

    Flag funzionalità richiesti per ACP associato a thread:

    - `acp.enabled=true`
    - `acp.dispatch.enabled` è attivo per impostazione predefinita (imposta `false` per mettere in pausa il dispatch automatico dei thread ACP; le chiamate esplicite `sessions_spawn({ runtime: "acp" })` continuano a funzionare).
    - Flag di spawn thread ACP dell'adattatore di canale abilitato (specifico dell'adattatore):
      - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`

    Il supporto al binding dei thread è specifico dell'adattatore. Se l'adattatore del canale
    attivo non supporta i binding dei thread, OpenClaw restituisce un chiaro
    messaggio di non supporto/non disponibilità.

  </Accordion>
  <Accordion title="Canali con supporto ai thread">
    - Qualsiasi adattatore di canale che espone la capacità di binding sessione/thread.
    - Supporto integrato attuale: thread/canali **Discord**, topic **Telegram** (topic forum in gruppi/supergruppi e topic DM).
    - I canali plugin possono aggiungere supporto tramite la stessa interfaccia di binding.

  </Accordion>
</AccordionGroup>

## Binding persistenti dei canali

Per workflow non effimeri, configura binding ACP persistenti nelle
voci di primo livello `bindings[]`.

### Modello di binding

<ParamField path="bindings[].type" type='"acp"'>
  Contrassegna un binding conversazione ACP persistente.
</ParamField>
<ParamField path="bindings[].match" type="object">
  Identifica la conversazione target. Forme per canale:

- **Canale/thread Discord:** `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
- **Topic forum Telegram:** `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
- **DM/gruppo BlueBubbles:** `match.channel="bluebubbles"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`. Preferisci `chat_id:*` o `chat_identifier:*` per binding di gruppo stabili.
- **DM/gruppo iMessage:** `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`. Preferisci `chat_id:*` per binding di gruppo stabili.

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

### Valori runtime predefiniti per agente

Usa `agents.list[].runtime` per definire una volta i valori ACP predefiniti per agente:

- `agents.list[].runtime.type="acp"`
- `agents.list[].runtime.acp.agent` (id harness, per esempio `codex` o `claude`)
- `agents.list[].runtime.acp.backend`
- `agents.list[].runtime.acp.mode`
- `agents.list[].runtime.acp.cwd`

**Precedenza degli override per le sessioni ACP associate:**

1. `bindings[].acp.*`
2. `agents.list[].runtime.acp.*`
3. Valori ACP globali predefiniti (per esempio `acp.backend`)

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
- I binding runtime temporanei (per esempio creati dai flussi di focus del thread) si applicano comunque dove presenti.
- Per spawn ACP tra agenti senza un `cwd` esplicito, OpenClaw eredita il workspace dell'agente target dalla configurazione agente.
- I percorsi workspace ereditati mancanti ripiegano sul cwd predefinito del backend; gli errori di accesso non dovuti a mancanza emergono come errori di spawn.

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
    `runtime` predefinito è `subagent`, quindi imposta esplicitamente `runtime: "acp"`
    per le sessioni ACP. Se `agentId` viene omesso, OpenClaw usa
    `acp.defaultAgent` quando è configurato. `mode: "session"` richiede
    `thread: true` per mantenere una conversazione vincolata persistente.
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
  ID harness di destinazione ACP. Ripiega su `acp.defaultAgent` se impostato.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  Richiede il flusso di associazione al thread dove supportato.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  `"run"` è monouso; `"session"` è persistente. Se `thread: true` e
  `mode` viene omesso, OpenClaw può usare come predefinito un comportamento persistente per
  il percorso runtime. `mode: "session"` richiede `thread: true`.
</ParamField>
<ParamField path="cwd" type="string">
  Directory di lavoro runtime richiesta (convalidata dalla policy backend/runtime).
  Se omessa, ACP spawn eredita l'area di lavoro dell'agente di destinazione
  quando configurata; i percorsi ereditati mancanti ripiegano sui valori
  predefiniti del backend, mentre vengono restituiti gli errori di accesso reali.
</ParamField>
<ParamField path="label" type="string">
  Etichetta visibile all'operatore usata nel testo della sessione/banner.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  Riprende una sessione ACP esistente invece di crearne una nuova. L'agente
  riproduce la cronologia della conversazione tramite `session/load`. Richiede
  `runtime: "acp"`.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  `"parent"` trasmette i riepiloghi di avanzamento dell'esecuzione ACP iniziale
  alla sessione richiedente come eventi di sistema. Le risposte accettate includono
  `streamLogPath` che punta a un log JSONL con ambito di sessione
  (`<sessionId>.acp-stream.jsonl`) che puoi seguire per la cronologia completa del relay.
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  Interrompe il turno figlio ACP dopo N secondi. `0` mantiene il turno sul
  percorso senza timeout del Gateway. Lo stesso valore viene applicato
  all'esecuzione del Gateway e al runtime ACP, così gli harness bloccati o con quota esaurita
  non occupano indefinitamente la corsia dell'agente padre.
</ParamField>
<ParamField path="model" type="string">
  Override esplicito del modello per la sessione figlia ACP. Gli spawn ACP di Codex
  normalizzano i riferimenti OpenClaw Codex come `openai-codex/gpt-5.4` nella
  configurazione di avvio ACP di Codex prima di `session/new`; forme slash come
  `openai-codex/gpt-5.4/high` impostano anche lo sforzo di ragionamento ACP di Codex.
  Gli altri harness devono pubblicizzare i `models` ACP e supportare
  `session/set_model`; altrimenti OpenClaw/acpx fallisce in modo chiaro invece di
  ripiegare silenziosamente sul valore predefinito dell'agente di destinazione.
</ParamField>
<ParamField path="thinking" type="string">
  Sforzo esplicito di pensiero/ragionamento. Per Codex ACP, `minimal` mappa a
  uno sforzo basso, `low`/`medium`/`high`/`xhigh` mappano direttamente, e `off`
  omette l'override di avvio dello sforzo di ragionamento.
</ParamField>

## Modalità di associazione e thread per lo spawn

<Tabs>
  <Tab title="--bind here|off">
    | Modalità | Comportamento                                                            |
    | -------- | ------------------------------------------------------------------------ |
    | `here`   | Associa sul posto la conversazione attiva corrente; fallisce se non ce n'è una attiva. |
    | `off`    | Non creare un'associazione alla conversazione corrente.                  |

    Note:

    - `--bind here` è il percorso operatore più semplice per "rendere questo canale o questa chat basati su Codex".
    - `--bind here` non crea un thread figlio.
    - `--bind here` è disponibile solo sui canali che espongono il supporto per l'associazione alla conversazione corrente.
    - `--bind` e `--thread` non possono essere combinati nella stessa chiamata `/acp spawn`.

  </Tab>
  <Tab title="--thread auto|here|off">
    | Modalità | Comportamento                                                                                         |
    | -------- | ------------------------------------------------------------------------------------------------------ |
    | `auto`   | In un thread attivo: associa quel thread. Fuori da un thread: crea/associa un thread figlio quando supportato. |
    | `here`   | Richiede il thread attivo corrente; fallisce se non si è in un thread.                                 |
    | `off`    | Nessuna associazione. La sessione parte non associata.                                                 |

    Note:

    - Sulle superfici di associazione non basate su thread, il comportamento predefinito è di fatto `off`.
    - Lo spawn associato al thread richiede il supporto della policy del canale:
      - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`
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

    - I normali follow-up vincolati vengono inviati come testo del prompt, più gli allegati solo quando l'harness/backend li supporta.
    - I comandi di gestione `/acp` e i comandi del Gateway locale vengono intercettati prima dell'invio ACP.
    - Gli eventi di completamento generati a runtime vengono materializzati per destinazione. Gli agenti OpenClaw ricevono l'envelope interno del contesto runtime di OpenClaw; gli harness ACP esterni ricevono un prompt semplice con il risultato figlio e l'istruzione. L'envelope grezza `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>` non deve mai essere inviata agli harness esterni o resa persistente come testo della trascrizione utente ACP.
    - Le voci della trascrizione ACP usano il testo del trigger visibile all'utente o il prompt di completamento semplice. I metadati interni degli eventi restano strutturati in OpenClaw quando possibile e non vengono trattati come contenuto di chat scritto dall'utente.

  </Accordion>
  <Accordion title="Parent-owned one-shot ACP sessions">
    Le sessioni ACP one-shot di proprietà del genitore avviate da
    un'altra esecuzione agente sono figli in background, simili ai sub-agent:

    - Il genitore richiede il lavoro con `sessions_spawn({ runtime: "acp", mode: "run" })`.
    - Il figlio viene eseguito nella propria sessione harness ACP.
    - I turni figlio vengono eseguiti sulla stessa lane in background usata dagli avvii nativi di sub-agent, quindi un harness ACP lento non blocca il lavoro non correlato della sessione principale.
    - I report di completamento tornano attraverso il percorso di annuncio del completamento attività. OpenClaw converte i metadati interni di completamento in un prompt ACP semplice prima di inviarli a un harness esterno, quindi gli harness non vedono marcatori di contesto runtime specifici di OpenClaw.
    - Il genitore riscrive il risultato figlio con la normale voce dell'assistente quando è utile una risposta visibile all'utente.

    **Non** trattare questo percorso come una chat peer-to-peer tra genitore
    e figlio. Il figlio dispone già di un canale di completamento verso il
    genitore.

  </Accordion>
  <Accordion title="sessions_send and A2A delivery">
    `sessions_send` può avere come destinazione un'altra sessione dopo l'avvio. Per le normali
    sessioni peer, OpenClaw usa un percorso di follow-up agent-to-agent (A2A)
    dopo aver iniettato il messaggio:

    - Attendi la risposta della sessione di destinazione.
    - Facoltativamente consenti a richiedente e destinazione di scambiarsi un numero limitato di turni di follow-up.
    - Chiedi alla destinazione di produrre un messaggio di annuncio.
    - Recapita quell'annuncio al canale o thread visibile.

    Quel percorso A2A è un fallback per gli invii peer in cui il mittente necessita di un
    follow-up visibile. Resta abilitato quando una sessione non correlata può
    vedere e inviare messaggi a una destinazione ACP, ad esempio con impostazioni
    `tools.sessions.visibility` ampie.

    OpenClaw salta il follow-up A2A solo quando il richiedente è il
    genitore del proprio figlio ACP one-shot di proprietà del genitore. In quel caso,
    eseguire A2A sopra il completamento attività può risvegliare il genitore con il
    risultato del figlio, inoltrare la risposta del genitore di nuovo al figlio e
    creare un ciclo di eco genitore/figlio. Il risultato di `sessions_send` riporta
    `delivery.status="skipped"` per quel caso di figlio posseduto perché il
    percorso di completamento è già responsabile del risultato.

  </Accordion>
  <Accordion title="Resume an existing session">
    Usa `resumeSessionId` per continuare una sessione ACP precedente invece di
    iniziarne una nuova. L'agente riproduce la propria cronologia di conversazione tramite
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

    - Passa una sessione Codex dal laptop al telefono: dì al tuo agente di riprendere da dove ti eri fermato.
    - Continua una sessione di codifica avviata interattivamente nella CLI, ora in modalità headless tramite il tuo agente.
    - Riprendi il lavoro interrotto da un riavvio del Gateway o da un timeout di inattività.

    Note:

    - `resumeSessionId` si applica solo quando `runtime: "acp"`; il runtime predefinito dei sub-agent ignora questo campo solo ACP.
    - `streamTo` si applica solo quando `runtime: "acp"`; il runtime predefinito dei sub-agent ignora questo campo solo ACP.
    - `resumeSessionId` è un id di ripresa ACP/harness locale dell'host, non una chiave di sessione canale OpenClaw; OpenClaw verifica comunque la policy di avvio ACP e la policy dell'agente di destinazione prima dell'invio, mentre il backend o l'harness ACP possiede l'autorizzazione per caricare quell'id upstream.
    - `resumeSessionId` ripristina la cronologia della conversazione ACP upstream; `thread` e `mode` si applicano comunque normalmente alla nuova sessione OpenClaw che stai creando, quindi `mode: "session"` richiede ancora `thread: true`.
    - L'agente di destinazione deve supportare `session/load` (Codex e Claude Code lo fanno).
    - Se l'id sessione non viene trovato, l'avvio fallisce con un errore chiaro: nessun fallback silenzioso a una nuova sessione.

  </Accordion>
  <Accordion title="Post-deploy smoke test">
    Dopo un deploy del gateway, esegui un controllo end-to-end live invece di
    fidarti dei test unitari:

    1. Verifica la versione e il commit del gateway distribuito sull'host di destinazione.
    2. Apri una sessione bridge ACPX temporanea verso un agente live.
    3. Chiedi a quell'agente di chiamare `sessions_spawn` con `runtime: "acp"`, `agentId: "codex"`, `mode: "run"` e task `Reply with exactly LIVE-ACP-SPAWN-OK`.
    4. Verifica `accepted=yes`, un vero `childSessionKey` e nessun errore di validazione.
    5. Pulisci la sessione bridge temporanea.

    Mantieni il gate su `mode: "run"` e salta `streamTo: "parent"`:
    i percorsi vincolati al thread `mode: "session"` e stream-relay sono passaggi di integrazione
    più ricchi e separati.

  </Accordion>
</AccordionGroup>

## Compatibilità della sandbox

Le sessioni ACP attualmente vengono eseguite sul runtime host, **non** all'interno della
sandbox OpenClaw.

<Warning>
**Confine di sicurezza:**

- L'ambiente di esecuzione esterno può leggere/scrivere in base ai propri permessi CLI e al `cwd` selezionato.
- La policy sandbox di OpenClaw **non** avvolge l'esecuzione dell'ambiente ACP.
- OpenClaw applica comunque i feature gate ACP, gli agenti consentiti, la proprietà della sessione, i binding dei canali e la policy di consegna del Gateway.
- Usa `runtime: "subagent"` per lavoro nativo di OpenClaw con sandbox applicata.

</Warning>

Limitazioni attuali:

- Se la sessione richiedente è in sandbox, gli spawn ACP sono bloccati sia per `sessions_spawn({ runtime: "acp" })` sia per `/acp spawn`.
- `sessions_spawn` con `runtime: "acp"` non supporta `sandbox: "require"`.

## Risoluzione della destinazione sessione

La maggior parte delle azioni `/acp` accetta una destinazione sessione opzionale (`session-key`,
`session-id` o `session-label`).

**Ordine di risoluzione:**

1. Argomento di destinazione esplicito (o `--session` per `/acp steer`)
   - prova la chiave
   - poi l'ID sessione in formato UUID
   - poi l'etichetta
2. Binding del thread corrente (se questa conversazione/thread è associata a una sessione ACP).
3. Fallback alla sessione richiedente corrente.

I binding della conversazione corrente e i binding del thread partecipano entrambi al
passaggio 2.

Se non viene risolta alcuna destinazione, OpenClaw restituisce un errore chiaro
(`Unable to resolve session target: ...`).

## Controlli ACP

| Comando              | Cosa fa                                                   | Esempio                                                       |
| -------------------- | --------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | Crea una sessione ACP; binding corrente o del thread opzionale. | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | Annulla il turno in corso per la sessione di destinazione. | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | Invia un'istruzione di orientamento alla sessione in esecuzione. | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | Chiude la sessione e rimuove i binding delle destinazioni del thread. | `/acp close`                                                  |
| `/acp status`        | Mostra backend, modalità, stato, opzioni runtime, capacità. | `/acp status`                                                 |
| `/acp set-mode`      | Imposta la modalità runtime per la sessione di destinazione. | `/acp set-mode plan`                                          |
| `/acp set`           | Scrive un'opzione generica di configurazione runtime.      | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | Imposta l'override della directory di lavoro runtime.      | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | Imposta il profilo della policy di approvazione.           | `/acp permissions strict`                                     |
| `/acp timeout`       | Imposta il timeout runtime (secondi).                      | `/acp timeout 120`                                            |
| `/acp model`         | Imposta l'override del modello runtime.                    | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | Rimuove gli override delle opzioni runtime della sessione. | `/acp reset-options`                                          |
| `/acp sessions`      | Elenca le sessioni ACP recenti dallo store.                | `/acp sessions`                                               |
| `/acp doctor`        | Stato del backend, capacità, correzioni applicabili.       | `/acp doctor`                                                 |
| `/acp install`       | Stampa passaggi deterministici di installazione e abilitazione. | `/acp install`                                                |

`/acp status` mostra le opzioni runtime effettive più gli identificatori di sessione a livello runtime e
a livello backend. Gli errori di controllo non supportato emergono
chiaramente quando un backend non dispone di una capacità. `/acp sessions` legge lo
store per la sessione attualmente associata o richiedente; i token di destinazione
(`session-key`, `session-id` o `session-label`) vengono risolti tramite
il rilevamento sessioni del gateway, incluse le radici `session.store`
personalizzate per agente.

### Mappatura delle opzioni runtime

`/acp` ha comandi di comodità e un setter generico. Operazioni
equivalenti:

| Comando                      | Corrisponde a                       | Note                                                                                                                                                                          |
| ---------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `/acp model <id>`            | chiave di configurazione runtime `model` | Per Codex ACP, OpenClaw normalizza `openai-codex/<model>` nell'ID modello dell'adattatore e mappa i suffissi di reasoning con slash, come `openai-codex/gpt-5.4/high`, su `reasoning_effort`. |
| `/acp set thinking <level>`  | chiave di configurazione runtime `thinking` | Per Codex ACP, OpenClaw invia il `reasoning_effort` corrispondente dove l'adattatore ne supporta uno.                                                                             |
| `/acp permissions <profile>` | chiave di configurazione runtime `approval_policy` | —                                                                                                                                                                              |
| `/acp timeout <seconds>`     | chiave di configurazione runtime `timeout` | —                                                                                                                                                                              |
| `/acp cwd <path>`            | override del cwd runtime             | Aggiornamento diretto.                                                                                                                                                         |
| `/acp set <key> <value>`     | generico                             | `key=cwd` usa il percorso di override del cwd.                                                                                                                                 |
| `/acp reset-options`         | cancella tutti gli override runtime  | —                                                                                                                                                                              |

## Ambiente acpx, configurazione Plugin e permessi

Per la configurazione dell'ambiente acpx (alias Claude Code / Codex / Gemini CLI
), i bridge MCP plugin-tools e OpenClaw-tools, e le modalità di
permesso ACP, vedi
[Agenti ACP — configurazione](/it/tools/acp-agents-setup).

## Risoluzione dei problemi

| Sintomo                                                                     | Causa probabile                                                                                                      | Correzione                                                                                                                                                                      |
| --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ACP runtime backend is not configured`                                     | Plugin backend mancante, disabilitato o bloccato da `plugins.allow`.                                                       | Installa e abilita il Plugin backend, includi `acpx` in `plugins.allow` quando quella allowlist è impostata, poi esegui `/acp doctor`.                                                 |
| `ACP is disabled by policy (acp.enabled=false)`                             | ACP disabilitato a livello globale.                                                                                                 | Imposta `acp.enabled=true`.                                                                                                                                                  |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`           | Invio automatico dai normali messaggi del thread disabilitato.                                                               | Imposta `acp.dispatch.enabled=true` per riprendere il routing automatico dei thread; le chiamate esplicite a `sessions_spawn({ runtime: "acp" })` continuano a funzionare.                                      |
| `ACP agent "<id>" is not allowed by policy`                                 | Agent non presente nella allowlist.                                                                                                | Usa un `agentId` consentito o aggiorna `acp.allowedAgents`.                                                                                                                     |
| `/acp doctor` segnala che il backend non è pronto subito dopo l'avvio                 | Il probe delle dipendenze del Plugin o l'autoriparazione è ancora in esecuzione.                                                               | Attendi brevemente e riesegui `/acp doctor`; se resta non integro, ispeziona l'errore di installazione del backend e la policy allow/deny del Plugin.                                             |
| Comando dell'adattatore non trovato                                                   | La CLI dell'adattatore non è installata, mancano dipendenze del Plugin in staging oppure il recupero `npx` al primo avvio è fallito per un adattatore non Codex. | Esegui `/acp doctor`, ripara le dipendenze del Plugin, installa/precarica l'adattatore sull'host Gateway oppure configura esplicitamente il comando dell'agent acpx.                          |
| Modello non trovato dall'ambiente di esecuzione                                            | L'id modello è valido per un altro provider/ambiente di esecuzione, ma non per questa destinazione ACP.                                                | Usa un modello elencato da quell'ambiente di esecuzione, configura il modello nell'ambiente di esecuzione oppure ometti l'override.                                                                            |
| Errore di autenticazione del fornitore dall'ambiente di esecuzione                                          | OpenClaw è integro, ma la CLI/il provider di destinazione non ha effettuato l'accesso.                                                     | Accedi o fornisci la chiave provider richiesta nell'ambiente host Gateway.                                                                                             |
| `Unable to resolve session target: ...`                                     | Token chiave/id/etichetta non valido.                                                                                                | Esegui `/acp sessions`, copia la chiave/etichetta esatta, riprova.                                                                                                                        |
| `--bind here requires running /acp spawn inside an active ... conversation` | `--bind here` usato senza una conversazione attiva associabile.                                                            | Spostati nella chat/canale di destinazione e riprova, oppure usa uno spawn non associato.                                                                                                         |
| `Conversation bindings are unavailable for <channel>.`                      | L'adattatore non dispone della capacità ACP di associazione alla conversazione corrente.                                                             | Usa `/acp spawn ... --thread ...` dove supportato, configura `bindings[]` di primo livello oppure spostati su un canale supportato.                                                     |
| `--thread here requires running /acp spawn inside an active ... thread`     | `--thread here` usato fuori da un contesto di thread.                                                                         | Spostati nel thread di destinazione oppure usa `--thread auto`/`off`.                                                                                                                      |
| `Only <user-id> can rebind this channel/conversation/thread.`               | Un altro utente possiede la destinazione di associazione attiva.                                                                           | Riassocia come proprietario oppure usa una conversazione o un thread diverso.                                                                                                               |
| `Thread bindings are unavailable for <channel>.`                            | L'adattatore non dispone della capacità di associazione dei thread.                                                                               | Usa `--thread off` oppure spostati su un adattatore/canale supportato.                                                                                                                 |
| `Sandboxed sessions cannot spawn ACP sessions ...`                          | Il runtime ACP è lato host; la sessione richiedente è in sandbox.                                                              | Usa `runtime="subagent"` dalle sessioni in sandbox oppure esegui ACP spawn da una sessione non in sandbox.                                                                         |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`     | `sandbox="require"` richiesto per il runtime ACP.                                                                         | Usa `runtime="subagent"` per il sandboxing obbligatorio oppure usa ACP con `sandbox="inherit"` da una sessione non in sandbox.                                                      |
| `Cannot apply --model ... did not advertise model support`                  | L'ambiente di esecuzione di destinazione non espone il cambio modello ACP generico.                                                        | Usa un ambiente di esecuzione che dichiara ACP `models`/`session/set_model`, usa riferimenti ai modelli ACP di Codex oppure configura il modello direttamente nell'ambiente di esecuzione se ha un proprio flag di avvio. |
| Metadati ACP mancanti per la sessione associata                                      | Metadati della sessione ACP obsoleti/eliminati.                                                                                    | Ricrea con `/acp spawn`, quindi riassocia/metti a fuoco il thread.                                                                                                                    |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`    | `permissionMode` blocca scritture/esecuzioni nella sessione ACP non interattiva.                                                    | Imposta `plugins.entries.acpx.config.permissionMode` su `approve-all` e riavvia il gateway. Vedi [Configurazione delle autorizzazioni](/it/tools/acp-agents-setup#permission-configuration). |
| La sessione ACP fallisce presto con poco output                                  | I prompt di autorizzazione sono bloccati da `permissionMode`/`nonInteractivePermissions`.                                        | Controlla nei log del gateway la presenza di `AcpRuntimeError`. Per autorizzazioni complete, imposta `permissionMode=approve-all`; per un degrado controllato, imposta `nonInteractivePermissions=deny`.        |
| La sessione ACP resta bloccata indefinitamente dopo aver completato il lavoro                       | Il processo dell'ambiente di esecuzione è terminato ma la sessione ACP non ha segnalato il completamento.                                                    | Monitora con `ps aux \| grep acpx`; termina manualmente i processi obsoleti.                                                                                                       |
| L'ambiente di esecuzione vede `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>`                        | La busta degli eventi interni è trapelata oltre il confine ACP.                                                                | Aggiorna OpenClaw e riesegui il flusso di completamento; gli ambienti di esecuzione esterni dovrebbero ricevere solo prompt di completamento in chiaro.                                                          |

## Correlati

- [Agent ACP — configurazione](/it/tools/acp-agents-setup)
- [Invio all'agent](/it/tools/agent-send)
- [Backend CLI](/it/gateway/cli-backends)
- [Ambiente di esecuzione Codex](/it/plugins/codex-harness)
- [Strumenti sandbox multi-agent](/it/tools/multi-agent-sandbox-tools)
- [`openclaw acp` (modalità bridge)](/it/cli/acp)
- [Sub-agent](/it/tools/subagents)
