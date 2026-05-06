---
read_when:
    - Esecuzione degli harness di codifica tramite ACP
    - Configurare sessioni ACP legate alla conversazione sui canali di messaggistica
    - Associazione di una conversazione su un canale di messaggistica a una sessione ACP persistente
    - Risoluzione dei problemi del backend ACP, del collegamento dei Plugin o della consegna dei completamenti
    - Esecuzione dei comandi /acp dalla chat
sidebarTitle: ACP agents
summary: Esegui ambienti di programmazione esterni (Claude Code, Cursor, Gemini CLI, Codex ACP esplicito, OpenClaw ACP, OpenCode) tramite il backend ACP
title: Agenti ACP
x-i18n:
    generated_at: "2026-05-06T09:10:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: 75744690ee307bc86d9a3de268c84e52d8a281ca8a0e7d2d39c9a0cb7fbe2b39
    source_path: tools/acp-agents.md
    workflow: 16
---

[Agent Client Protocol (ACP)](https://agentclientprotocol.com/) sessioni
permettono a OpenClaw di eseguire harness di coding esterni (per esempio Pi, Claude Code,
Cursor, Copilot, Droid, OpenClaw ACP, OpenCode, Gemini CLI e altri
harness ACPX supportati) tramite un plugin di backend ACP.

Ogni avvio di sessione ACP viene tracciato come [attività in background](/it/automation/tasks).

<Note>
**ACP è il percorso per harness esterni, non il percorso Codex predefinito.** Il
plugin app-server Codex nativo possiede i controlli `/codex ...` e il
runtime incorporato `agentRuntime.id: "codex"`; ACP possiede
i controlli `/acp ...` e le sessioni `sessions_spawn({ runtime: "acp" })`.

Se vuoi che Codex o Claude Code si connettano come client MCP esterno
direttamente alle conversazioni di canale OpenClaw esistenti, usa
[`openclaw mcp serve`](/it/cli/mcp) invece di ACP.
</Note>

## Quale pagina mi serve?

| Vuoi…                                                                                           | Usa questo                            | Note                                                                                                                                                                                                  |
| ----------------------------------------------------------------------------------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Associare o controllare Codex nella conversazione corrente                                      | `/codex bind`, `/codex threads`       | Percorso app-server Codex nativo quando il plugin `codex` è abilitato; include risposte chat associate, inoltro immagini, modello/fast/autorizzazioni, stop e controlli di guida. ACP è un fallback esplicito |
| Eseguire Claude Code, Gemini CLI, Codex ACP esplicito o un altro harness esterno _tramite_ OpenClaw | Questa pagina                         | Sessioni associate alla chat, `/acp spawn`, `sessions_spawn({ runtime: "acp" })`, attività in background, controlli runtime                                                                            |
| Esporre una sessione OpenClaw Gateway _come_ server ACP per un editor o client                  | [`openclaw acp`](/it/cli/acp)            | Modalità bridge. L’IDE/client comunica ACP con OpenClaw tramite stdio/WebSocket                                                                                                                        |
| Riutilizzare una CLI AI locale come modello fallback solo testuale                              | [Backend CLI](/it/gateway/cli-backends)  | Non ACP. Nessuno strumento OpenClaw, nessun controllo ACP, nessun runtime harness                                                                                                                      |

## Funziona subito?

Sì, dopo aver installato il plugin runtime ACP ufficiale:

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

I checkout del sorgente possono usare il plugin workspace locale `extensions/acpx` dopo
`pnpm install`. Esegui `/acp doctor` per un controllo di preparazione.

OpenClaw informa gli agenti sull’avvio ACP solo quando ACP è **davvero
utilizzabile**: ACP deve essere abilitato, il dispatch non deve essere disabilitato, la
sessione corrente non deve essere bloccata dalla sandbox e un backend runtime deve essere
caricato. Se queste condizioni non sono soddisfatte, le Skills del plugin ACP e la
guida ACP di `sessions_spawn` restano nascoste, così l’agente non suggerisce
un backend non disponibile.

<AccordionGroup>
  <Accordion title="Problemi comuni al primo avvio">
    - Se `plugins.allow` è impostato, è un inventario Plugin restrittivo e **deve** includere `acpx`; altrimenti il backend ACP installato viene bloccato intenzionalmente e `/acp doctor` segnala la voce mancante nella allowlist.
    - L’adapter ACP di Codex è fornito con il plugin `acpx` e avviato localmente quando possibile.
    - Altri adapter harness di destinazione possono comunque essere scaricati su richiesta con `npx` la prima volta che li usi.
    - L’autenticazione del vendor deve comunque esistere sull’host per quell’harness.
    - Se l’host non ha npm o accesso alla rete, i download degli adapter al primo avvio falliscono finché le cache non vengono pre-riscaldate o l’adapter non viene installato in un altro modo.

  </Accordion>
  <Accordion title="Prerequisiti runtime">
    ACP avvia un vero processo harness esterno. OpenClaw possiede routing,
    stato delle attività in background, recapito, associazioni e policy; l’harness
    possiede il login del provider, il catalogo modelli, il comportamento del filesystem e
    gli strumenti nativi.

    Prima di dare la colpa a OpenClaw, verifica:

    - `/acp doctor` segnala un backend abilitato e integro.
    - L’id di destinazione è consentito da `acp.allowedAgents` quando quella allowlist è impostata.
    - Il comando harness può avviarsi sull’host Gateway.
    - L’autenticazione del provider è presente per quell’harness (`claude`, `codex`, `gemini`, `opencode`, `droid`, ecc.).
    - Il modello selezionato esiste per quell’harness - gli id dei modelli non sono portabili tra harness.
    - Il `cwd` richiesto esiste ed è accessibile, oppure ometti `cwd` e lascia che il backend usi il suo valore predefinito.
    - La modalità di autorizzazione corrisponde al lavoro. Le sessioni non interattive non possono fare clic sui prompt di autorizzazione nativi, quindi le esecuzioni di coding con molte scritture/esecuzioni di solito richiedono un profilo di autorizzazione ACPX che possa procedere senza interazione.

  </Accordion>
</AccordionGroup>

Gli strumenti dei plugin OpenClaw e gli strumenti OpenClaw integrati **non** sono esposti agli
harness ACP per impostazione predefinita. Abilita i bridge MCP espliciti in
[Agenti ACP - configurazione](/it/tools/acp-agents-setup) solo quando l’harness
deve chiamare direttamente quegli strumenti.

## Destinazioni harness supportate

Con il backend `acpx`, usa questi id harness come destinazioni `/acp spawn <id>`
o `sessions_spawn({ runtime: "acp", agentId: "<id>" })`:

| Id harness | Backend tipico                                | Note                                                                                |
| ---------- | --------------------------------------------- | ----------------------------------------------------------------------------------- |
| `claude`   | Adapter ACP Claude Code                       | Richiede l’autenticazione Claude Code sull’host.                                    |
| `codex`    | Adapter ACP Codex                             | Fallback ACP esplicito solo quando `/codex` nativo non è disponibile o ACP è richiesto. |
| `copilot`  | Adapter ACP GitHub Copilot                    | Richiede l’autenticazione CLI/runtime Copilot.                                      |
| `cursor`   | ACP Cursor CLI (`cursor-agent acp`)           | Sovrascrivi il comando acpx se un’installazione locale espone un entrypoint ACP diverso. |
| `droid`    | Factory Droid CLI                             | Richiede l’autenticazione Factory/Droid o `FACTORY_API_KEY` nell’ambiente dell’harness. |
| `gemini`   | Adapter ACP Gemini CLI                        | Richiede l’autenticazione Gemini CLI o la configurazione della chiave API.          |
| `iflow`    | iFlow CLI                                     | La disponibilità dell’adapter e il controllo del modello dipendono dalla CLI installata. |
| `kilocode` | Kilo Code CLI                                 | La disponibilità dell’adapter e il controllo del modello dipendono dalla CLI installata. |
| `kimi`     | Kimi/Moonshot CLI                             | Richiede l’autenticazione Kimi/Moonshot sull’host.                                  |
| `kiro`     | Kiro CLI                                      | La disponibilità dell’adapter e il controllo del modello dipendono dalla CLI installata. |
| `opencode` | Adapter ACP OpenCode                          | Richiede l’autenticazione OpenCode CLI/provider.                                    |
| `openclaw` | Bridge OpenClaw Gateway tramite `openclaw acp` | Consente a un harness compatibile con ACP di parlare di nuovo con una sessione OpenClaw Gateway. |
| `pi`       | Runtime Pi/OpenClaw incorporato               | Usato per esperimenti harness nativi OpenClaw.                                      |
| `qwen`     | Qwen Code / Qwen CLI                          | Richiede autenticazione compatibile con Qwen sull’host.                             |

Alias agente acpx personalizzati possono essere configurati in acpx stesso, ma la policy OpenClaw
controlla comunque `acp.allowedAgents` e qualunque mapping
`agents.list[].runtime.acp.agent` prima del dispatch.

## Runbook dell’operatore

Flusso rapido `/acp` dalla chat:

<Steps>
  <Step title="Avvia">
    `/acp spawn claude --bind here`,
    `/acp spawn gemini --mode persistent --thread auto`, oppure esplicito
    `/acp spawn codex --bind here`.
  </Step>
  <Step title="Lavora">
    Continua nella conversazione o nel thread associato (oppure indirizza la sessione
    esplicitamente tramite chiave).
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
    `/acp cancel` (turno corrente) oppure `/acp close` (sessione + associazioni).
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Dettagli del ciclo di vita">
    - L’avvio crea o riprende una sessione runtime ACP, registra metadati ACP nello store delle sessioni OpenClaw e può creare un’attività in background quando l’esecuzione è posseduta dal parent.
    - Le sessioni ACP possedute dal parent sono trattate come lavoro in background anche quando la sessione runtime è persistente; completamento e recapito tra superfici passano dal notificatore dell’attività parent invece di comportarsi come una normale sessione chat rivolta all’utente.
    - La manutenzione delle attività chiude sessioni ACP one-shot terminali o orfane possedute dal parent. Le sessioni ACP persistenti sono conservate finché rimane un’associazione attiva alla conversazione; le sessioni persistenti obsolete senza associazione attiva vengono chiuse così non possono essere riprese silenziosamente dopo che l’attività proprietaria è terminata o il suo record attività è scomparso.
    - I messaggi di follow-up associati vanno direttamente alla sessione ACP finché l’associazione non viene chiusa, sfocata, reimpostata o scaduta.
    - I comandi Gateway restano locali. `/acp ...`, `/status` e `/unfocus` non vengono mai inviati come normale testo di prompt a un harness ACP associato.
    - `cancel` interrompe il turno attivo quando il backend supporta l’annullamento; non elimina l’associazione né i metadati della sessione.
    - `close` termina la sessione ACP dal punto di vista di OpenClaw e rimuove l’associazione. Un harness può comunque mantenere la propria cronologia upstream se supporta il resume.
    - I worker runtime inattivi possono essere ripuliti dopo `acp.runtime.ttlMinutes`; i metadati di sessione memorizzati restano disponibili per `/acp sessions`.

  </Accordion>
  <Accordion title="Regole di routing Codex nativo">
    Trigger in linguaggio naturale che dovrebbero instradare al **plugin Codex
    nativo** quando è abilitato:

    - "Associa questo canale Discord a Codex."
    - "Collega questa chat al thread Codex `<id>`."
    - "Mostra i thread Codex, poi associa questo."

    L’associazione di conversazioni Codex native è il percorso di controllo chat predefinito.
    Gli strumenti dinamici OpenClaw vengono comunque eseguiti tramite OpenClaw, mentre
    gli strumenti nativi Codex come shell/apply-patch vengono eseguiti dentro Codex.
    Per gli eventi degli strumenti nativi Codex, OpenClaw inietta un relay hook nativo per turno
    così gli hook dei plugin possono bloccare `before_tool_call`, osservare
    `after_tool_call` e instradare gli eventi Codex `PermissionRequest`
    tramite le approvazioni OpenClaw. Gli hook Codex `Stop` vengono inoltrati a
    OpenClaw `before_agent_finalize`, dove i plugin possono richiedere un ulteriore
    passaggio del modello prima che Codex finalizzi la risposta. Il relay resta
    deliberatamente conservativo: non modifica gli argomenti degli strumenti nativi Codex
    né riscrive i record dei thread Codex. Usa ACP esplicito solo
    quando vuoi il modello runtime/sessione ACP. Il confine di supporto Codex
    incorporato è documentato nel
    [contratto di supporto harness Codex v1](/it/plugins/codex-harness#v1-support-contract).

  </Accordion>
  <Accordion title="Promemoria per la selezione di modello / provider / runtime">
    - `openai-codex/*` - route OAuth/abbonamento PI Codex.
    - `openai/*` più `agentRuntime.id: "codex"` - runtime incorporato nativo dell'app-server Codex.
    - `/codex ...` - controllo nativo della conversazione Codex.
    - `/acp ...` o `runtime: "acp"` - controllo ACP/acpx esplicito.

  </Accordion>
  <Accordion title="Trigger in linguaggio naturale per l'instradamento ACP">
    Trigger che devono instradare al runtime ACP:

    - "Esegui questo come sessione ACP Claude Code one-shot e riassumi il risultato."
    - "Usa Gemini CLI per questa attività in un thread, poi mantieni i follow-up nello stesso thread."
    - "Esegui Codex tramite ACP in un thread in background."

    OpenClaw sceglie `runtime: "acp"`, risolve l'harness `agentId`,
    si associa alla conversazione o al thread corrente quando supportato, e
    instrada i follow-up a quella sessione fino a chiusura/scadenza. Codex segue
    questo percorso solo quando ACP/acpx è esplicito o il Plugin Codex nativo
    non è disponibile per l'operazione richiesta.

    Per `sessions_spawn`, `runtime: "acp"` viene pubblicizzato solo quando ACP
    è abilitato, il richiedente non è in sandbox e un backend runtime ACP
    è caricato. `acp.dispatch.enabled=false` mette in pausa il dispatch automatico
    dei thread ACP ma non nasconde né blocca le chiamate esplicite
    `sessions_spawn({ runtime: "acp" })`. Ha come destinazione id di harness ACP come `codex`,
    `claude`, `droid`, `gemini` o `opencode`. Non passare un normale
    id agente di configurazione OpenClaw da `agents_list` a meno che quella voce sia
    configurata esplicitamente con `agents.list[].runtime.type="acp"`;
    altrimenti usa il runtime di sottoagente predefinito. Quando un agente OpenClaw
    è configurato con `runtime.type="acp"`, OpenClaw usa
    `runtime.acp.agent` come id dell'harness sottostante.

  </Accordion>
</AccordionGroup>

## ACP rispetto ai sottoagenti

Usa ACP quando vuoi un runtime harness esterno. Usa **l'app-server nativo
Codex** per l'associazione/controllo delle conversazioni Codex quando il Plugin
`codex` è abilitato. Usa i **sottoagenti** quando vuoi esecuzioni delegate
native di OpenClaw.

| Area          | Sessione ACP                          | Esecuzione sottoagente             |
| ------------- | ------------------------------------- | ---------------------------------- |
| Runtime       | Plugin backend ACP (per esempio acpx) | Runtime sottoagente nativo OpenClaw |
| Chiave sessione | `agent:<agentId>:acp:<uuid>`        | `agent:<agentId>:subagent:<uuid>`  |
| Comandi principali | `/acp ...`                       | `/subagents ...`                   |
| Strumento di spawn | `sessions_spawn` con `runtime:"acp"` | `sessions_spawn` (runtime predefinito) |

Vedi anche [Sottoagenti](/it/tools/subagents).

## Come ACP esegue Claude Code

Per Claude Code tramite ACP, lo stack è:

1. Piano di controllo della sessione ACP di OpenClaw.
2. Plugin runtime ufficiale `@openclaw/acpx`.
3. Adapter ACP Claude.
4. Meccanismi runtime/sessione lato Claude.

ACP Claude è una **sessione harness** con controlli ACP, ripresa della sessione,
tracciamento delle attività in background e associazione opzionale a conversazione/thread.

I backend CLI sono runtime di fallback locali solo testo separati - vedi
[Backend CLI](/it/gateway/cli-backends).

Per gli operatori, la regola pratica è:

- **Vuoi `/acp spawn`, sessioni associabili, controlli runtime o lavoro persistente dell'harness?** Usa ACP.
- **Vuoi un semplice fallback di testo locale tramite la CLI grezza?** Usa i backend CLI.

## Sessioni associate

### Modello mentale

- **Superficie di chat** - dove le persone continuano a parlare (canale Discord, topic Telegram, chat iMessage).
- **Sessione ACP** - lo stato runtime Codex/Claude/Gemini durevole a cui OpenClaw instrada.
- **Thread/topic figlio** - una superficie di messaggistica aggiuntiva opzionale creata solo da `--thread ...`.
- **Workspace runtime** - la posizione del filesystem (`cwd`, checkout del repo, workspace backend) in cui viene eseguito l'harness. Indipendente dalla superficie di chat.

### Associazioni alla conversazione corrente

`/acp spawn <harness> --bind here` fissa la conversazione corrente alla
sessione ACP avviata - nessun thread figlio, stessa superficie di chat. OpenClaw continua
a possedere trasporto, auth, sicurezza e consegna. I messaggi di follow-up in quella
conversazione vengono instradati alla stessa sessione; `/new` e `/reset` reimpostano la
sessione in posizione; `/acp close` rimuove l'associazione.

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
    - `--bind here` funziona solo sui canali che dichiarano l'associazione alla conversazione corrente; altrimenti OpenClaw restituisce un chiaro messaggio di non supportato. Le associazioni persistono tra i riavvii del Gateway.
    - Su Discord, `spawnSessions` controlla la creazione di thread figli per `--thread auto|here` - non `--bind here`.
    - Se esegui lo spawn verso un agente ACP diverso senza `--cwd`, OpenClaw eredita per impostazione predefinita il workspace dell'**agente di destinazione**. I percorsi ereditati mancanti (`ENOENT`/`ENOTDIR`) ricadono al valore predefinito del backend; altri errori di accesso (ad es. `EACCES`) emergono come errori di spawn.
    - I comandi di gestione del Gateway restano locali nelle conversazioni associate - i comandi `/acp ...` vengono gestiti da OpenClaw anche quando il normale testo di follow-up viene instradato alla sessione ACP associata; anche `/status` e `/unfocus` restano locali ogni volta che la gestione dei comandi è abilitata per quella superficie.

  </Accordion>
  <Accordion title="Sessioni associate a thread">
    Quando le associazioni di thread sono abilitate per un adapter di canale:

    - OpenClaw associa un thread a una sessione ACP di destinazione.
    - I messaggi di follow-up in quel thread vengono instradati alla sessione ACP associata.
    - L'output ACP viene riconsegnato allo stesso thread.
    - Unfocus/chiusura/archiviazione/timeout per inattività o scadenza per età massima rimuove l'associazione.
    - `/acp close`, `/acp cancel`, `/acp status`, `/status` e `/unfocus` sono comandi Gateway, non prompt per l'harness ACP.

    Feature flag richiesti per ACP associato a thread:

    - `acp.enabled=true`
    - `acp.dispatch.enabled` è attivo per impostazione predefinita (impostalo a `false` per mettere in pausa il dispatch automatico dei thread ACP; le chiamate esplicite `sessions_spawn({ runtime: "acp" })` continuano a funzionare).
    - Spawn di sessioni thread dell'adapter di canale abilitati (predefinito: `true`):
      - Discord: `channels.discord.threadBindings.spawnSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnSessions=true`

    Il supporto dell'associazione di thread è specifico dell'adapter. Se l'adapter
    del canale attivo non supporta le associazioni di thread, OpenClaw restituisce
    un chiaro messaggio di non supportato/non disponibile.

  </Accordion>
  <Accordion title="Canali che supportano i thread">
    - Qualsiasi adapter di canale che espone la capacità di associazione sessione/thread.
    - Supporto integrato corrente: thread/canali **Discord**, topic **Telegram** (topic forum in gruppi/supergruppi e topic DM).
    - I canali Plugin possono aggiungere supporto tramite la stessa interfaccia di associazione.

  </Accordion>
</AccordionGroup>

## Associazioni persistenti dei canali

Per workflow non effimeri, configura associazioni ACP persistenti nelle
voci `bindings[]` di primo livello.

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

### Valori predefiniti runtime per agente

Usa `agents.list[].runtime` per definire una volta i valori predefiniti ACP per agente:

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

- OpenClaw assicura che la sessione ACP configurata esista prima dell'uso.
- I messaggi in quel canale o topic vengono instradati alla sessione ACP configurata.
- Nelle conversazioni associate, `/new` e `/reset` reimpostano in posizione la stessa chiave di sessione ACP.
- Le associazioni runtime temporanee (per esempio create da flussi di focus su thread) continuano ad applicarsi dove presenti.
- Per spawn ACP tra agenti senza un `cwd` esplicito, OpenClaw eredita il workspace dell'agente di destinazione dalla configurazione agente.
- I percorsi del workspace ereditato mancanti ricadono al cwd predefinito del backend; gli errori di accesso non dovuti a mancanza emergono come errori di spawn.

## Avviare sessioni ACP

Due modi per avviare una sessione ACP:

<Tabs>
  <Tab title="Da sessions_spawn">
    Usa `runtime: "acp"` per avviare una sessione ACP da un turno agente o
    da una chiamata strumento.

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
    `runtime` ha valore predefinito `subagent`, quindi imposta `runtime: "acp"` esplicitamente
    per le sessioni ACP. Se `agentId` viene omesso, OpenClaw usa
    `acp.defaultAgent` quando configurato. `mode: "session"` richiede
    `thread: true` per mantenere una conversazione associata persistente.
    </Note>

  </Tab>
  <Tab title="Dal comando /acp">
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
  ID dell'harness di destinazione ACP. Ripiega su `acp.defaultAgent` se impostato.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  Richiede il flusso di associazione del thread dove supportato.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  `"run"` è a esecuzione singola; `"session"` è persistente. Se `thread: true` e
  `mode` viene omesso, OpenClaw può usare per impostazione predefinita il comportamento persistente in base
  al percorso runtime. `mode: "session"` richiede `thread: true`.
</ParamField>
<ParamField path="cwd" type="string">
  Directory di lavoro runtime richiesta (convalidata dai criteri del backend/runtime).
  Se omessa, lo spawn ACP eredita l'area di lavoro dell'agente di destinazione
  quando configurata; i percorsi ereditati mancanti ripiegano sui valori predefiniti
  del backend, mentre gli errori di accesso reali vengono restituiti.
</ParamField>
<ParamField path="label" type="string">
  Etichetta rivolta all'operatore usata nel testo di sessione/banner.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  Riprende una sessione ACP esistente invece di crearne una nuova. L'agente
  riproduce la cronologia della conversazione tramite `session/load`. Richiede
  `runtime: "acp"`.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  `"parent"` trasmette in streaming i riepiloghi di avanzamento dell'esecuzione ACP iniziale alla
  sessione richiedente come eventi di sistema. Le risposte accettate includono
  `streamLogPath`, che punta a un log JSONL con ambito sessione
  (`<sessionId>.acp-stream.jsonl`) che puoi seguire con `tail` per la cronologia completa dell'inoltro.
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  Interrompe il turno figlio ACP dopo N secondi. `0` mantiene il turno sul
  percorso senza timeout del Gateway. Lo stesso valore viene applicato all'esecuzione del Gateway
  e al runtime ACP, in modo che gli harness bloccati o con quota esaurita non
  occupino indefinitamente la corsia dell'agente genitore.
</ParamField>
<ParamField path="model" type="string">
  Override esplicito del modello per la sessione figlia ACP. Gli spawn Codex ACP
  normalizzano riferimenti OpenClaw Codex come `openai-codex/gpt-5.4` nella configurazione
  di avvio Codex ACP prima di `session/new`; le forme slash come
  `openai-codex/gpt-5.4/high` impostano anche lo sforzo di ragionamento Codex ACP.
  Gli altri harness devono pubblicizzare i `models` ACP e supportare
  `session/set_model`; altrimenti OpenClaw/acpx fallisce chiaramente invece di
  ripiegare silenziosamente sul valore predefinito dell'agente di destinazione.
</ParamField>
<ParamField path="thinking" type="string">
  Sforzo esplicito di pensiero/ragionamento. Per Codex ACP, `minimal` mappa allo
  sforzo basso, `low`/`medium`/`high`/`xhigh` mappano direttamente, e `off`
  omette l'override di avvio dello sforzo di ragionamento.
</ParamField>

## Modalità di associazione e thread per lo spawn

<Tabs>
  <Tab title="--bind here|off">
    | Modalità | Comportamento                                                         |
    | -------- | --------------------------------------------------------------------- |
    | `here`   | Associa la conversazione attiva corrente sul posto; fallisce se non ce n'è una attiva. |
    | `off`    | Non creare un'associazione con la conversazione corrente.             |

    Note:

    - `--bind here` è il percorso operatore più semplice per "rendere questo canale o questa chat supportata da Codex".
    - `--bind here` non crea un thread figlio.
    - `--bind here` è disponibile solo sui canali che espongono il supporto per l'associazione alla conversazione corrente.
    - `--bind` e `--thread` non possono essere combinati nella stessa chiamata `/acp spawn`.

  </Tab>
  <Tab title="--thread auto|here|off">
    | Modalità | Comportamento                                                                                      |
    | -------- | -------------------------------------------------------------------------------------------------- |
    | `auto`   | In un thread attivo: associa quel thread. Fuori da un thread: crea/associa un thread figlio quando supportato. |
    | `here`   | Richiede un thread attivo corrente; fallisce se non si è in un thread.                              |
    | `off`    | Nessuna associazione. La sessione inizia non associata.                                             |

    Note:

    - Sulle superfici senza associazione a thread, il comportamento predefinito è di fatto `off`.
    - Lo spawn associato a thread richiede il supporto dei criteri del canale:
      - Discord: `channels.discord.threadBindings.spawnSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnSessions=true`
    - Usa `--bind here` quando vuoi fissare la conversazione corrente senza creare un thread figlio.

  </Tab>
</Tabs>

## Modello di consegna

Le sessioni ACP possono essere aree di lavoro interattive o lavoro in background
di proprietà del genitore. Il percorso di consegna dipende da questa forma.

<AccordionGroup>
  <Accordion title="Sessioni ACP interattive">
    Le sessioni interattive sono pensate per continuare a conversare su una superficie
    chat visibile:

    - `/acp spawn ... --bind here` associa la conversazione corrente alla sessione ACP.
    - `/acp spawn ... --thread ...` associa un thread/topic del canale alla sessione ACP.
    - Le `bindings[].type="acp"` persistenti configurate instradano le conversazioni corrispondenti alla stessa sessione ACP.

    I messaggi successivi nella conversazione associata vengono instradati direttamente alla
    sessione ACP, e l'output ACP viene recapitato di nuovo allo stesso
    canale/thread/topic.

    Cosa invia OpenClaw all'harness:

    - I normali follow-up associati vengono inviati come testo del prompt, più allegati solo quando l'harness/backend li supporta.
    - I comandi di gestione `/acp` e i comandi locali del Gateway vengono intercettati prima del dispatch ACP.
    - Gli eventi di completamento generati dal runtime vengono materializzati per destinazione. Gli agenti OpenClaw ricevono l'envelope di contesto runtime interno di OpenClaw; gli harness ACP esterni ricevono un prompt semplice con il risultato figlio e l'istruzione. L'envelope grezza `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>` non dovrebbe mai essere inviata agli harness esterni o persistita come testo di trascrizione utente ACP.
    - Le voci della trascrizione ACP usano il testo trigger visibile all'utente o il prompt di completamento semplice. I metadati evento interni restano strutturati in OpenClaw dove possibile e non vengono trattati come contenuto chat scritto dall'utente.

  </Accordion>
  <Accordion title="Sessioni ACP monouso di proprietà del genitore">
    Le sessioni ACP monouso create da un'altra esecuzione agente sono figli in background,
    simili ai sotto-agenti:

    - Il genitore richiede il lavoro con `sessions_spawn({ runtime: "acp", mode: "run" })`.
    - Il figlio viene eseguito nella propria sessione harness ACP.
    - I turni figli vengono eseguiti sulla stessa corsia in background usata dagli spawn nativi dei sotto-agenti, quindi un harness ACP lento non blocca il lavoro non correlato della sessione principale.
    - Il completamento viene riportato tramite il percorso di annuncio di completamento attività. OpenClaw converte i metadati di completamento interni in un prompt ACP semplice prima di inviarlo a un harness esterno, quindi gli harness non vedono marker di contesto runtime solo OpenClaw.
    - Il genitore riscrive il risultato del figlio con la normale voce dell'assistente quando è utile una risposta rivolta all'utente.

    **Non** trattare questo percorso come una chat peer-to-peer tra genitore
    e figlio. Il figlio ha già un canale di completamento verso il
    genitore.

  </Accordion>
  <Accordion title="sessions_send e consegna A2A">
    `sessions_send` può scegliere come destinazione un'altra sessione dopo lo spawn. Per le normali
    sessioni peer, OpenClaw usa un percorso di follow-up agent-to-agent (A2A)
    dopo aver iniettato il messaggio:

    - Attendi la risposta della sessione di destinazione.
    - Facoltativamente, lascia che richiedente e destinazione scambino un numero limitato di turni di follow-up.
    - Chiedi alla destinazione di produrre un messaggio di annuncio.
    - Consegna quell'annuncio al canale o thread visibile.

    Quel percorso A2A è un fallback per invii peer in cui il mittente ha bisogno di un
    follow-up visibile. Resta abilitato quando una sessione non correlata può
    vedere e inviare messaggi a una destinazione ACP, per esempio con impostazioni
    `tools.sessions.visibility` ampie.

    OpenClaw salta il follow-up A2A solo quando il richiedente è il
    genitore del proprio figlio ACP monouso di proprietà del genitore. In quel caso,
    eseguire A2A sopra il completamento attività può risvegliare il genitore con il
    risultato del figlio, inoltrare la risposta del genitore di nuovo nel figlio e
    creare un ciclo di eco genitore/figlio. Il risultato di `sessions_send` riporta
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

    - Passare una sessione Codex dal laptop al telefono: chiedi al tuo agente di riprendere da dove avevi lasciato.
    - Continuare una sessione di coding avviata interattivamente nella CLI, ora in modalità headless tramite il tuo agente.
    - Riprendere un lavoro interrotto da un riavvio del Gateway o da un timeout di inattività.

    Note:

    - `resumeSessionId` si applica solo quando `runtime: "acp"`; il runtime predefinito dei sotto-agenti ignora questo campo solo ACP.
    - `streamTo` si applica solo quando `runtime: "acp"`; il runtime predefinito dei sotto-agenti ignora questo campo solo ACP.
    - `resumeSessionId` è un ID di ripresa ACP/harness locale all'host, non una chiave di sessione di canale OpenClaw; OpenClaw controlla comunque i criteri di spawn ACP e i criteri dell'agente di destinazione prima del dispatch, mentre il backend ACP o l'harness possiede l'autorizzazione per caricare quell'ID upstream.
    - `resumeSessionId` ripristina la cronologia della conversazione ACP upstream; `thread` e `mode` si applicano comunque normalmente alla nuova sessione OpenClaw che stai creando, quindi `mode: "session"` richiede comunque `thread: true`.
    - L'agente di destinazione deve supportare `session/load` (Codex e Claude Code lo fanno).
    - Se l'ID sessione non viene trovato, lo spawn fallisce con un errore chiaro: nessun fallback silenzioso a una nuova sessione.

  </Accordion>
  <Accordion title="Smoke test post-deploy">
    Dopo un deploy del Gateway, esegui un controllo end-to-end live invece di
    fidarti dei test unitari:

    1. Verifica la versione e il commit del gateway distribuito sull'host di destinazione.
    2. Apri una sessione bridge ACPX temporanea verso un agente live.
    3. Chiedi a quell'agente di chiamare `sessions_spawn` con `runtime: "acp"`, `agentId: "codex"`, `mode: "run"` e attività `Reply with exactly LIVE-ACP-SPAWN-OK`.
    4. Verifica `accepted=yes`, un `childSessionKey` reale e nessun errore di validazione.
    5. Pulisci la sessione bridge temporanea.

    Mantieni il gate su `mode: "run"` e salta `streamTo: "parent"`:
    `mode: "session"` associato a thread e i percorsi stream-relay sono
    passaggi di integrazione separati e più ricchi.

  </Accordion>
</AccordionGroup>

## Compatibilità con sandbox

Le sessioni ACP attualmente vengono eseguite sul runtime host, **non** dentro la
sandbox OpenClaw.

<Warning>
**Confine di sicurezza:**

- L'harness esterno può leggere/scrivere in base alle proprie autorizzazioni CLI e al `cwd` selezionato.
- La policy di sandbox di OpenClaw **non** racchiude l'esecuzione dell'harness ACP.
- OpenClaw applica comunque i controlli delle funzionalità ACP, gli agenti consentiti, la proprietà della sessione, le associazioni dei canali e la policy di consegna del Gateway.
- Usa `runtime: "subagent"` per il lavoro nativo di OpenClaw con sandbox applicata.

</Warning>

Limitazioni attuali:

- Se la sessione del richiedente è in sandbox, gli spawn ACP sono bloccati sia per `sessions_spawn({ runtime: "acp" })` sia per `/acp spawn`.
- `sessions_spawn` con `runtime: "acp"` non supporta `sandbox: "require"`.

## Risoluzione del target della sessione

La maggior parte delle azioni `/acp` accetta un target di sessione opzionale (`session-key`,
`session-id` o `session-label`).

**Ordine di risoluzione:**

1. Argomento target esplicito (o `--session` per `/acp steer`)
   - prova la chiave
   - poi l'id sessione in formato UUID
   - poi l'etichetta
2. Associazione del thread corrente (se questa conversazione/thread è associata a una sessione ACP).
3. Fallback alla sessione corrente del richiedente.

Le associazioni della conversazione corrente e le associazioni del thread partecipano entrambe al
passaggio 2.

Se non viene risolto alcun target, OpenClaw restituisce un errore chiaro
(`Unable to resolve session target: ...`).

## Controlli ACP

| Comando              | Cosa fa                                                   | Esempio                                                       |
| -------------------- | --------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | Crea una sessione ACP; associazione corrente o del thread opzionale. | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | Annulla il turno in corso per la sessione target.         | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | Invia un'istruzione di guida alla sessione in esecuzione. | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | Chiude la sessione e rimuove le associazioni dei target del thread. | `/acp close`                                                  |
| `/acp status`        | Mostra backend, modalità, stato, opzioni di runtime, capacità. | `/acp status`                                                 |
| `/acp set-mode`      | Imposta la modalità di runtime per la sessione target.    | `/acp set-mode plan`                                          |
| `/acp set`           | Scrive un'opzione generica di configurazione del runtime. | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | Imposta l'override della directory di lavoro del runtime. | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | Imposta il profilo della policy di approvazione.          | `/acp permissions strict`                                     |
| `/acp timeout`       | Imposta il timeout del runtime (secondi).                 | `/acp timeout 120`                                            |
| `/acp model`         | Imposta l'override del modello di runtime.                | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | Rimuove gli override delle opzioni di runtime della sessione. | `/acp reset-options`                                          |
| `/acp sessions`      | Elenca le sessioni ACP recenti dallo store.               | `/acp sessions`                                               |
| `/acp doctor`        | Integrità del backend, capacità, correzioni attuabili.    | `/acp doctor`                                                 |
| `/acp install`       | Stampa i passaggi deterministici di installazione e abilitazione. | `/acp install`                                                |

`/acp status` mostra le opzioni di runtime effettive più gli identificatori di sessione a livello di runtime e
a livello di backend. Gli errori di controllo non supportato emergono
chiaramente quando un backend non dispone di una capacità. `/acp sessions` legge lo
store per la sessione attualmente associata o del richiedente; i token target
(`session-key`, `session-id` o `session-label`) vengono risolti tramite
la scoperta delle sessioni del gateway, incluse le radici `session.store`
personalizzate per agente.

### Mappatura delle opzioni di runtime

`/acp` dispone di comandi di comodità e di un setter generico. Operazioni
equivalenti:

| Comando                      | Si mappa a                           | Note                                                                                                                                                                          |
| ---------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `/acp model <id>`            | chiave di configurazione runtime `model` | Per Codex ACP, OpenClaw normalizza `openai-codex/<model>` nell'id modello dell'adapter e mappa i suffissi di reasoning con slash, come `openai-codex/gpt-5.4/high`, a `reasoning_effort`. |
| `/acp set thinking <level>`  | chiave di configurazione runtime `thinking` | Per Codex ACP, OpenClaw invia il `reasoning_effort` corrispondente dove l'adapter ne supporta uno.                                                                             |
| `/acp permissions <profile>` | chiave di configurazione runtime `approval_policy` | -                                                                                                                                                                              |
| `/acp timeout <seconds>`     | chiave di configurazione runtime `timeout` | -                                                                                                                                                                              |
| `/acp cwd <path>`            | override del cwd del runtime         | Aggiornamento diretto.                                                                                                                                                        |
| `/acp set <key> <value>`     | generico                             | `key=cwd` usa il percorso di override del cwd.                                                                                                                                 |
| `/acp reset-options`         | cancella tutti gli override del runtime | -                                                                                                                                                                              |

## Harness acpx, configurazione del Plugin e autorizzazioni

Per la configurazione dell'harness acpx (alias Claude Code / Codex / Gemini CLI),
i bridge MCP plugin-tools e OpenClaw-tools, e le modalità di autorizzazione
ACP, consulta
[Agenti ACP - configurazione](/it/tools/acp-agents-setup).

## Risoluzione dei problemi

| Sintomo                                                                     | Causa probabile                                                                                                           | Soluzione                                                                                                                                                                      |
| --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ACP runtime backend is not configured`                                     | Plugin di backend mancante, disabilitato o bloccato da `plugins.allow`.                                                       | Installa e abilita il Plugin di backend, includi `acpx` in `plugins.allow` quando quell'elenco consentiti è impostato, poi esegui `/acp doctor`.                                                 |
| `ACP is disabled by policy (acp.enabled=false)`                             | ACP disabilitato globalmente.                                                                                                 | Imposta `acp.enabled=true`.                                                                                                                                                  |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`           | Invio automatico dai normali messaggi del thread disabilitato.                                                               | Imposta `acp.dispatch.enabled=true` per riprendere l'instradamento automatico dei thread; le chiamate esplicite `sessions_spawn({ runtime: "acp" })` continuano a funzionare.                                      |
| `ACP agent "<id>" is not allowed by policy`                                 | Agente non presente nell'elenco consentiti.                                                                                                | Usa un `agentId` consentito o aggiorna `acp.allowedAgents`.                                                                                                                     |
| `/acp doctor` segnala che il backend non è pronto subito dopo l'avvio                 | Il Plugin di backend è mancante, disabilitato, bloccato dalla policy di consenso/negazione oppure il suo eseguibile configurato non è disponibile.        | Installa/abilita il Plugin di backend, riesegui `/acp doctor` e controlla l'errore di installazione o policy del backend se resta non integro.                                           |
| Comando dell'harness non trovato                                                   | La CLI dell'adattatore non è installata, il Plugin esterno è mancante oppure il recupero `npx` al primo avvio non è riuscito per un adattatore non Codex. | Esegui `/acp doctor`, installa/pre-riscalda l'adattatore sull'host Gateway oppure configura esplicitamente il comando dell'agente acpx.                                                      |
| Modello non trovato dall'harness                                            | L'id del modello è valido per un altro provider/harness ma non per questa destinazione ACP.                                                | Usa un modello elencato da quell'harness, configura il modello nell'harness oppure ometti la sostituzione.                                                                            |
| Errore di autenticazione del fornitore dall'harness                                          | OpenClaw è integro, ma la CLI/il provider di destinazione non ha effettuato l'accesso.                                                     | Effettua l'accesso o fornisci la chiave provider richiesta nell'ambiente dell'host Gateway.                                                                                             |
| `Unable to resolve session target: ...`                                     | Token chiave/id/etichetta errato.                                                                                                | Esegui `/acp sessions`, copia la chiave/etichetta esatta e riprova.                                                                                                                        |
| `--bind here requires running /acp spawn inside an active ... conversation` | `--bind here` usato senza una conversazione attiva associabile.                                                            | Spostati nella chat/canale di destinazione e riprova, oppure usa uno spawn non associato.                                                                                                         |
| `Conversation bindings are unavailable for <channel>.`                      | L'adattatore non dispone della capacità di associazione ACP alla conversazione corrente.                                                             | Usa `/acp spawn ... --thread ...` dove supportato, configura `bindings[]` di primo livello oppure spostati su un canale supportato.                                                     |
| `--thread here requires running /acp spawn inside an active ... thread`     | `--thread here` usato fuori dal contesto di un thread.                                                                         | Spostati nel thread di destinazione oppure usa `--thread auto`/`off`.                                                                                                                      |
| `Only <user-id> can rebind this channel/conversation/thread.`               | Un altro utente possiede la destinazione di associazione attiva.                                                                           | Riassocia come proprietario oppure usa una conversazione o un thread diverso.                                                                                                               |
| `Thread bindings are unavailable for <channel>.`                            | L'adattatore non dispone della capacità di associazione ai thread.                                                                               | Usa `--thread off` oppure spostati su un adattatore/canale supportato.                                                                                                                 |
| `Sandboxed sessions cannot spawn ACP sessions ...`                          | Il runtime ACP è lato host; la sessione richiedente è in sandbox.                                                              | Usa `runtime="subagent"` dalle sessioni in sandbox oppure esegui lo spawn ACP da una sessione non in sandbox.                                                                         |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`     | `sandbox="require"` richiesto per il runtime ACP.                                                                         | Usa `runtime="subagent"` per sandbox obbligatoria oppure usa ACP con `sandbox="inherit"` da una sessione non in sandbox.                                                      |
| `Cannot apply --model ... did not advertise model support`                  | L'harness di destinazione non espone il cambio modello ACP generico.                                                        | Usa un harness che dichiara ACP `models`/`session/set_model`, usa riferimenti modello ACP di Codex oppure configura il modello direttamente nell'harness se dispone di un proprio flag di avvio. |
| Metadati ACP mancanti per la sessione associata                                      | Metadati della sessione ACP obsoleti/eliminati.                                                                                    | Ricrea con `/acp spawn`, poi riassocia/metti a fuoco il thread.                                                                                                                    |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`    | `permissionMode` blocca scritture/esecuzioni nella sessione ACP non interattiva.                                                    | Imposta `plugins.entries.acpx.config.permissionMode` su `approve-all` e riavvia il Gateway. Vedi [Configurazione dei permessi](/it/tools/acp-agents-setup#permission-configuration). |
| La sessione ACP fallisce presto con poco output                                  | I prompt di permesso sono bloccati da `permissionMode`/`nonInteractivePermissions`.                                        | Controlla i log del Gateway per `AcpRuntimeError`. Per permessi completi, imposta `permissionMode=approve-all`; per degradazione graduale, imposta `nonInteractivePermissions=deny`.        |
| La sessione ACP resta bloccata indefinitamente dopo aver completato il lavoro                       | Il processo harness è terminato ma la sessione ACP non ha segnalato il completamento.                                                    | Monitora con `ps aux \| grep acpx`; termina manualmente i processi obsoleti.                                                                                                       |
| L'harness vede `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>`                        | La busta di eventi interna è trapelata oltre il confine ACP.                                                                | Aggiorna OpenClaw e riesegui il flusso di completamento; gli harness esterni dovrebbero ricevere solo prompt di completamento semplici.                                                          |

## Correlati

- [Agenti ACP - configurazione](/it/tools/acp-agents-setup)
- [Invio agente](/it/tools/agent-send)
- [Backend CLI](/it/gateway/cli-backends)
- [Harness Codex](/it/plugins/codex-harness)
- [Strumenti sandbox multi-agente](/it/tools/multi-agent-sandbox-tools)
- [`openclaw acp` (modalità bridge)](/it/cli/acp)
- [Sub-agenti](/it/tools/subagents)
