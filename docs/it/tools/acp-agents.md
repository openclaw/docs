---
read_when:
    - Esecuzione di harness di codifica tramite ACP
    - Configurazione di sessioni ACP associate alle conversazioni nei canali di messaggistica
    - Associazione di una conversazione di un canale di messaggistica a una sessione ACP persistente
    - Risoluzione dei problemi relativi al backend ACP, al collegamento del plugin o alla consegna del completamento
    - Utilizzo dei comandi /acp dalla chat
sidebarTitle: ACP agents
summary: Esegui harness di programmazione esterni (Claude Code, Cursor, Gemini CLI, Codex ACP esplicito, OpenClaw ACP, OpenCode) tramite il backend ACP
title: Agenti ACP
x-i18n:
    generated_at: "2026-07-12T07:31:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 68f5a5588710bea3027583bf06587706eb476d3ad1a31b0ef798586fcb895aa9
    source_path: tools/acp-agents.md
    workflow: 16
---

[Le sessioni Agent Client Protocol (ACP)](https://agentclientprotocol.com/) consentono a
OpenClaw di eseguire ambienti di programmazione esterni (Claude Code, Cursor, Copilot, Droid,
OpenClaw ACP, OpenCode, Gemini CLI e altri ambienti ACPX supportati)
tramite un plugin di backend ACP. Ogni avvio viene monitorato come
[attività in background](/it/automation/tasks).

<Note>
**ACP è il percorso per gli ambienti esterni, non il percorso Codex predefinito.** Il plugin
app-server nativo di Codex gestisce i comandi `/codex ...` e il runtime incorporato
`openai/gpt-*` predefinito per i turni dell'agente; ACP gestisce i comandi `/acp ...`
e le sessioni `sessions_spawn({ runtime: "acp" })`.

Per consentire a Codex o Claude Code di connettersi direttamente come client MCP esterno
alle conversazioni esistenti dei canali OpenClaw, usa
[`openclaw mcp serve`](/it/cli/mcp) anziché ACP.
</Note>

## Quale pagina mi serve?

| Vuoi...                                                                                              | Usa questo                              | Note                                                                                                                                                                                                 |
| ---------------------------------------------------------------------------------------------------- | --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Associare o controllare Codex nella conversazione corrente                                           | `/codex bind`, `/codex threads`         | Percorso app-server nativo di Codex quando il plugin `codex` è abilitato: risposte nella chat associata, inoltro delle immagini, modello/modalità rapida/permessi, arresto e orientamento. ACP è un ripiego esplicito |
| Eseguire Claude Code, Gemini CLI, Codex ACP esplicito o un altro ambiente esterno _tramite_ OpenClaw | Questa pagina                           | Sessioni associate alla chat, `/acp spawn`, `sessions_spawn({ runtime: "acp" })`, attività in background, controlli del runtime                                                                       |
| Esporre una sessione del Gateway OpenClaw _come_ server ACP per un editor o client                   | [`openclaw acp`](/it/cli/acp)              | Modalità bridge: un IDE/client comunica tramite ACP con OpenClaw su stdio/WebSocket                                                                                                                   |
| Riutilizzare una CLI di IA locale come modello di ripiego solo testuale                              | [Backend CLI](/it/gateway/cli-backends)    | Non è ACP: nessuno strumento OpenClaw, nessun controllo ACP, nessun runtime dell'ambiente                                                                                                             |

## Funziona senza configurazione aggiuntiva?

Sì, dopo aver installato il plugin runtime ACP ufficiale:

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

I checkout del codice sorgente possono usare il plugin locale dell'area di lavoro
`extensions/acpx` dopo `pnpm install`. Esegui `/acp doctor` per una verifica
dell'idoneità.

OpenClaw informa gli agenti sulla generazione di sessioni ACP solo quando ACP è
**realmente utilizzabile**: ACP deve essere abilitato, l'invio non deve essere
disabilitato, la sessione corrente non deve essere bloccata dalla sandbox e deve
essere caricato e integro un backend runtime. Se una qualsiasi condizione non è
soddisfatta, le Skills ACP e le indicazioni ACP di `sessions_spawn` restano nascoste,
affinché l'agente non suggerisca un backend non disponibile.

<AccordionGroup>
  <Accordion title="Problemi comuni al primo avvio">
    - Se `plugins.allow` è impostato, costituisce un inventario restrittivo dei plugin e **deve** includere `acpx`; in caso contrario, il backend ACP installato viene intenzionalmente bloccato (`/acp doctor` segnala la voce mancante nell'elenco consentito).
    - L'adattatore Codex ACP è incluso nel plugin `acpx` e, quando possibile, viene avviato localmente.
    - Codex ACP viene eseguito con un `CODEX_HOME` isolato. OpenClaw copia dalla configurazione Codex dell'host le voci attendibili relative all'attendibilità del progetto e la configurazione sicura per l'instradamento di modelli/provider (`model`, `model_provider`, `model_reasoning_effort`, `sandbox_mode` e i campi sicuri `model_providers.<name>`); autenticazione, notifiche e hook restano esclusivamente nella configurazione dell'host.
    - Gli adattatori per altri ambienti di destinazione possono essere scaricati su richiesta con `npx` al primo utilizzo.
    - L'autenticazione del fornitore per quell'ambiente deve essere già presente sull'host.
    - Se l'host non dispone di npm o dell'accesso alla rete, il recupero degli adattatori al primo avvio non riesce finché le cache non vengono preriscaldate o l'adattatore non viene installato in altro modo.

  </Accordion>
  <Accordion title="Prerequisiti del runtime">
    ACP avvia un vero processo di ambiente esterno. OpenClaw gestisce instradamento,
    stato delle attività in background, consegna, associazioni e criteri; l'ambiente
    gestisce l'accesso al proprio provider, il catalogo dei modelli, il comportamento
    del file system e gli strumenti nativi.

    Prima di attribuire il problema a OpenClaw, verifica quanto segue:

    - `/acp doctor` segnala un backend abilitato e integro.
    - L'id di destinazione è consentito da `acp.allowedAgents` quando tale elenco consentito è impostato.
    - Il comando dell'ambiente può essere avviato sull'host del Gateway.
    - L'autenticazione del provider è presente per tale ambiente (`claude`, `codex`, `gemini`, `opencode`, `droid` e così via).
    - Il modello selezionato esiste per tale ambiente: gli id dei modelli non sono trasferibili tra ambienti.
    - Il `cwd` richiesto esiste ed è accessibile; in alternativa, ometti `cwd` e lascia che il backend utilizzi il valore predefinito.
    - La modalità dei permessi è adatta al lavoro. Le sessioni non interattive non possono confermare le richieste native di autorizzazione, pertanto le esecuzioni di programmazione che richiedono molte operazioni di scrittura/esecuzione necessitano in genere di un profilo di permessi ACPX che possa procedere senza interfaccia interattiva.

  </Accordion>
</AccordionGroup>

Gli strumenti dei plugin OpenClaw e gli strumenti OpenClaw integrati **non** vengono
esposti per impostazione predefinita agli ambienti ACP. Abilita i bridge MCP espliciti in
[Agenti ACP - configurazione](/it/tools/acp-agents-setup) solo quando l'ambiente deve
richiamare direttamente tali strumenti.

## Destinazioni degli ambienti supportate

Con il backend `acpx`, usa questi id come destinazioni per `/acp spawn <id>` o
`sessions_spawn({ runtime: "acp", agentId: "<id>" })`:

| Id ambiente  | Backend tipico                                  | Note                                                                                              |
| ------------ | ---------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `claude`     | Adattatore ACP di Claude Code                  | Richiede l'autenticazione di Claude Code sull'host.                                               |
| `codex`      | Adattatore ACP di Codex                        | Ripiego ACP esplicito solo quando `/codex` nativo non è disponibile o viene richiesto ACP.        |
| `copilot`    | Adattatore ACP di GitHub Copilot               | Richiede l'autenticazione della CLI/del runtime di Copilot.                                       |
| `cursor`     | ACP della CLI Cursor (`cursor-agent acp`)      | Sostituisci il comando acpx se un'installazione locale espone un punto di ingresso ACP diverso.   |
| `droid`      | CLI Factory Droid                              | Richiede l'autenticazione Factory/Droid o `FACTORY_API_KEY` nell'ambiente dell'ambiente esterno.  |
| `fast-agent` | Adattatore ACP fast-agent-mcp                  | Scaricato su richiesta con `uvx`.                                                                 |
| `gemini`     | Adattatore ACP di Gemini CLI                   | Richiede l'autenticazione di Gemini CLI o la configurazione di una chiave API.                    |
| `iflow`      | CLI iFlow                                      | La disponibilità dell'adattatore e il controllo del modello dipendono dalla CLI installata.       |
| `kilocode`   | CLI Kilo Code                                  | La disponibilità dell'adattatore e il controllo del modello dipendono dalla CLI installata.       |
| `kimi`       | CLI Kimi/Moonshot                              | Richiede l'autenticazione Kimi/Moonshot sull'host.                                                |
| `kiro`       | CLI Kiro                                       | La disponibilità dell'adattatore e il controllo del modello dipendono dalla CLI installata.       |
| `mux`        | Adattatore ACP della CLI Mux                   | Scaricato su richiesta con `npx`.                                                                 |
| `opencode`   | Adattatore ACP di OpenCode                     | Richiede l'autenticazione della CLI/del provider di OpenCode.                                     |
| `openclaw`   | Bridge del Gateway OpenClaw tramite `openclaw acp` | Consente a un ambiente compatibile con ACP di comunicare con una sessione del Gateway OpenClaw. |
| `qoder`      | CLI Qoder                                      | La disponibilità dell'adattatore e il controllo del modello dipendono dalla CLI installata.       |
| `qwen`       | Qwen Code / Qwen CLI                           | Richiede un'autenticazione compatibile con Qwen sull'host.                                        |
| `trae`       | Adattatore ACP della CLI Trae                  | La disponibilità dell'adattatore e il controllo del modello dipendono dalla CLI installata.       |

Anche `pi` (pi-acp) è registrato nel backend acpx, ma non è un ambiente di
programmazione nello stesso senso degli altri elencati sopra.

Gli alias personalizzati degli agenti acpx possono essere configurati direttamente in acpx,
ma i criteri di OpenClaw verificano comunque `acp.allowedAgents` e qualsiasi
mappatura `agents.list[].runtime.acp.agent` prima dell'invio.

## Procedura operativa

Flusso rapido di `/acp` dalla chat:

<Steps>
  <Step title="Avvia">
    `/acp spawn claude --bind here`,
    `/acp spawn gemini --mode persistent --thread auto` oppure, esplicitamente,
    `/acp spawn codex --bind here`.
  </Step>
  <Step title="Lavora">
    Continua nella conversazione o nel thread associato (oppure specifica
    esplicitamente la chiave della sessione).
  </Step>
  <Step title="Controlla lo stato">
    `/acp status`
  </Step>
  <Step title="Regola">
    `/acp model <provider/model>`, `/acp permissions <profile>`,
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
  <Accordion title="Dettagli del ciclo di vita">
    - L'avvio crea o riprende una sessione runtime ACP, registra i metadati ACP nell'archivio delle sessioni OpenClaw e può creare un'attività in background quando l'esecuzione appartiene al genitore.
    - Le sessioni ACP appartenenti al genitore vengono trattate come lavoro in background anche quando la sessione runtime è persistente; il completamento e la consegna tra superfici passano attraverso il notificatore dell'attività genitore, anziché comportarsi come una normale sessione di chat visibile all'utente.
    - La manutenzione delle attività chiude le sessioni ACP monouso terminali o orfane appartenenti al genitore. Le sessioni ACP persistenti vengono conservate finché rimane attiva un'associazione a una conversazione; le sessioni persistenti obsolete prive di un'associazione attiva vengono chiuse, affinché non possano essere riprese silenziosamente dopo il completamento dell'attività proprietaria o la scomparsa del relativo record.
    - I messaggi successivi associati vengono inviati direttamente alla sessione ACP finché l'associazione non viene chiusa, privata dello stato attivo, reimpostata o scaduta.
    - I comandi del Gateway restano locali. `/acp ...`, `/status` e `/unfocus` non vengono mai inviati come normale testo del prompt a un ambiente ACP associato.
    - `cancel` interrompe il turno attivo quando il backend supporta l'annullamento; non elimina l'associazione né i metadati della sessione.
    - `close` termina la sessione ACP dal punto di vista di OpenClaw e rimuove l'associazione. Un ambiente può comunque conservare la propria cronologia upstream se supporta la ripresa.
    - Il plugin acpx pulisce gli alberi dei processi wrapper e adattatore appartenenti a OpenClaw dopo `close` e rimuove i processi ACPX orfani e obsoleti appartenenti a OpenClaw durante l'avvio del Gateway.
    - I worker runtime inattivi possono essere rimossi dopo `acp.runtime.ttlMinutes`; i metadati delle sessioni archiviati restano disponibili per `/acp sessions`.

  </Accordion>
  <Accordion title="Regole di instradamento native di Codex">
    Trigger in linguaggio naturale che devono essere instradati al **plugin Codex nativo**
    quando è abilitato:

    - "Associa questo canale Discord a Codex."
    - "Collega questa chat al thread Codex `<id>`."
    - "Mostra i thread Codex, quindi associa questo."

    Il collegamento nativo delle conversazioni Codex è il percorso predefinito per il controllo della chat.
    Gli strumenti dinamici di OpenClaw continuano a essere eseguiti tramite OpenClaw, mentre gli strumenti
    nativi di Codex, come shell/apply-patch, vengono eseguiti all'interno di Codex. Per gli eventi degli
    strumenti nativi di Codex, OpenClaw inserisce a ogni turno un relay di hook nativo affinché gli hook dei plugin
    possano bloccare `before_tool_call`, osservare `after_tool_call` e instradare gli eventi
    `PermissionRequest` di Codex attraverso le approvazioni di OpenClaw. Gli hook `Stop` di Codex
    vengono inoltrati a `before_agent_finalize` di OpenClaw, dove i plugin possono richiedere
    un ulteriore passaggio del modello prima che Codex finalizzi la risposta. Il relay rimane
    volutamente prudente: non modifica gli argomenti degli strumenti nativi di Codex
    né riscrive i record dei thread di Codex. Usa ACP esplicito solo quando desideri il
    modello di runtime/sessione ACP. Il confine del supporto Codex incorporato è
    documentato nel
    [contratto di supporto v1 dell'harness Codex](/it/plugins/codex-harness-runtime#v1-support-contract).

  </Accordion>
  <Accordion title="Guida rapida alla selezione di modello / provider / runtime">
    - riferimenti ai modelli Codex legacy - percorso legacy dei modelli Codex OAuth/abbonamento riparato da doctor.
    - `openai/*` - runtime incorporato nativo dell'app-server Codex per i turni degli agenti OpenAI.
    - `/codex ...` - controllo nativo delle conversazioni Codex.
    - `/acp ...` o `runtime: "acp"` - controllo ACP/acpx esplicito.

  </Accordion>
  <Accordion title="Trigger in linguaggio naturale per l'instradamento ACP">
    Trigger che devono instradare verso il runtime ACP:

    - "Esegui questa attività come sessione ACP Claude Code singola e riepiloga il risultato."
    - "Usa Gemini CLI per questa attività in un thread, quindi mantieni i messaggi successivi nello stesso thread."
    - "Esegui Codex tramite ACP in un thread in background."

    OpenClaw seleziona `runtime: "acp"`, risolve l'`agentId` dell'harness, si collega
    alla conversazione o al thread corrente, quando supportato, e instrada i messaggi successivi
    a quella sessione fino alla chiusura/scadenza. Codex segue questo percorso solo quando
    ACP/acpx è esplicito o il plugin Codex nativo non è disponibile per
    l'operazione richiesta.

    Per `sessions_spawn`, `runtime: "acp"` viene proposto solo quando ACP è
    abilitato, il richiedente non è in sandbox ed è caricato un backend di runtime ACP.
    `acp.dispatch.enabled=false` sospende l'inoltro automatico dei thread ACP,
    ma non nasconde né blocca le chiamate esplicite
    `sessions_spawn({ runtime: "acp" })`. È destinato agli ID degli harness ACP, come
    `codex`, `claude`, `droid`, `gemini` o `opencode`. Non passare un normale ID
    agente della configurazione OpenClaw ottenuto da `agents_list`, a meno che tale voce non sia
    configurata esplicitamente con `agents.list[].runtime.type="acp"`; in caso contrario, usa il
    runtime predefinito dei sotto-agenti. Quando un agente OpenClaw è configurato con
    `runtime.type="acp"`, OpenClaw usa `runtime.acp.agent` come ID
    dell'harness sottostante.

  </Accordion>
</AccordionGroup>

## ACP rispetto ai sotto-agenti

Usa ACP quando desideri un runtime harness esterno. Usa l'**app-server Codex
nativo** per il collegamento/controllo delle conversazioni Codex quando il plugin `codex`
è abilitato. Usa i **sotto-agenti** quando desideri esecuzioni delegate native di OpenClaw.

| Area                | Sessione ACP                              | Esecuzione del sotto-agente              |
| ------------------- | ----------------------------------------- | ---------------------------------------- |
| Runtime             | Plugin backend ACP (ad esempio acpx)      | Runtime nativo dei sotto-agenti OpenClaw |
| Chiave della sessione | `agent:<agentId>:acp:<uuid>`            | `agent:<agentId>:subagent:<uuid>`        |
| Comandi principali  | `/acp ...`                                | `/subagents ...`                         |
| Strumento di avvio  | `sessions_spawn` con `runtime:"acp"`      | `sessions_spawn` (runtime predefinito)   |

Vedi anche [Sotto-agenti](/it/tools/subagents).

## Come ACP esegue Claude Code

Per Claude Code tramite ACP, lo stack è:

1. Piano di controllo delle sessioni ACP di OpenClaw.
2. Plugin runtime ufficiale `@openclaw/acpx`.
3. Adattatore ACP di Claude.
4. Meccanismi di runtime/sessione sul lato Claude.

ACP Claude è una **sessione harness** con controlli ACP, ripresa della sessione,
monitoraggio delle attività in background e collegamento facoltativo alla conversazione/al thread.

I backend CLI sono runtime di ripiego locali separati e basati solo su testo: vedi
[Backend CLI](/it/gateway/cli-backends).

Per gli operatori, la regola pratica è:

- **Vuoi `/acp spawn`, sessioni collegabili, controlli del runtime o attività persistenti dell'harness?** Usa ACP.
- **Vuoi un semplice ripiego locale basato su testo tramite la CLI grezza?** Usa i backend CLI.

## Sessioni collegate

### Modello mentale

- **Superficie di chat** - il luogo in cui le persone continuano a conversare (canale Discord, argomento Telegram, chat iMessage).
- **Sessione ACP** - lo stato durevole del runtime Codex/Claude/Gemini verso cui OpenClaw instrada.
- **Thread/argomento figlio** - un'ulteriore superficie di messaggistica facoltativa, creata solo da `--thread ...`.
- **Area di lavoro del runtime** - la posizione nel file system (`cwd`, checkout del repository, area di lavoro del backend) in cui viene eseguito l'harness. Indipendente dalla superficie di chat.

### Collegamenti alla conversazione corrente

`/acp spawn <harness> --bind here` fissa la conversazione corrente alla
sessione ACP avviata: nessun thread figlio, stessa superficie di chat. OpenClaw continua
a gestire trasporto, autenticazione, sicurezza e recapito. I messaggi successivi in quella
conversazione vengono instradati alla stessa sessione; `/new` e `/reset` reimpostano la sessione
sul posto; `/acp close` rimuove il collegamento.

Esempi:

```text
/codex bind                                              # collegamento Codex nativo, instrada qui i messaggi futuri
/codex model gpt-5.4                                     # regola il thread Codex nativo collegato
/codex stop                                              # controlla il turno Codex nativo attivo
/acp spawn codex --bind here                             # ripiego ACP esplicito per Codex
/acp spawn codex --thread auto                           # può creare un thread/argomento figlio e collegarlo lì
/acp spawn codex --bind here --cwd /workspace/repo       # stesso collegamento della chat, Codex viene eseguito in /workspace/repo
```

<AccordionGroup>
  <Accordion title="Regole ed esclusività dei collegamenti">
    - `--bind here` e `--thread ...` si escludono a vicenda.
    - `--bind here` funziona solo sui canali che dichiarano il supporto al collegamento della conversazione corrente; in caso contrario, OpenClaw restituisce un messaggio chiaro che indica la mancata disponibilità del supporto. I collegamenti persistono tra i riavvii del Gateway.
    - Su Discord, `spawnSessions` controlla la creazione di thread figli per `--thread auto|here`, non per `--bind here`.
    - Se avvii un agente ACP diverso senza `--cwd`, OpenClaw eredita per impostazione predefinita l'area di lavoro dell'**agente di destinazione**. I percorsi ereditati mancanti (`ENOENT`/`ENOTDIR`) comportano il ripiego sul valore predefinito del backend; gli altri errori di accesso (ad esempio `EACCES`) vengono restituiti come errori di avvio.
    - I comandi di gestione del Gateway rimangono locali nelle conversazioni collegate: i comandi `/acp ...` vengono gestiti da OpenClaw anche quando il normale testo dei messaggi successivi viene instradato alla sessione ACP collegata; anche `/status` e `/unfocus` rimangono locali ogni volta che la gestione dei comandi è abilitata per quella superficie.

  </Accordion>
  <Accordion title="Sessioni collegate ai thread">
    Quando i collegamenti ai thread sono abilitati per un adattatore di canale:

    - OpenClaw collega un thread a una sessione ACP di destinazione.
    - I messaggi successivi in quel thread vengono instradati alla sessione ACP collegata.
    - L'output ACP viene recapitato allo stesso thread.
    - La rimozione dello stato attivo, la chiusura, l'archiviazione, la scadenza per inattività o la scadenza per età massima rimuovono il collegamento.
    - `/acp close`, `/acp cancel`, `/acp status`, `/status` e `/unfocus` sono comandi del Gateway, non prompt per l'harness ACP.

    Flag di funzionalità necessari per ACP collegato ai thread:

    - `acp.enabled=true`
    - `acp.dispatch.enabled` è attivo per impostazione predefinita (imposta `false` per sospendere l'inoltro automatico dei thread ACP; le chiamate esplicite `sessions_spawn({ runtime: "acp" })` continuano a funzionare).
    - Avvio delle sessioni dei thread dell'adattatore di canale abilitato (impostazione predefinita: `true`):
      - Discord: `channels.discord.threadBindings.spawnSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnSessions=true`

    Il supporto dei collegamenti ai thread dipende dall'adattatore. Se l'adattatore del canale attivo
    non supporta i collegamenti ai thread, OpenClaw restituisce un messaggio chiaro
    che indica che la funzionalità non è supportata/disponibile.

  </Accordion>
  <Accordion title="Canali che supportano i thread">
    - Qualsiasi adattatore di canale che esponga la funzionalità di collegamento a sessioni/thread.
    - Supporto integrato attuale: thread/canali **Discord**, argomenti **Telegram** (argomenti forum in gruppi/supergruppi e argomenti nei messaggi diretti).
    - I canali dei plugin possono aggiungere il supporto tramite la stessa interfaccia di collegamento.

  </Accordion>
</AccordionGroup>

## Collegamenti persistenti dei canali

Per i flussi di lavoro non effimeri, configura collegamenti ACP persistenti nelle voci
`bindings[]` di primo livello.

### Modello di collegamento

<ParamField path="bindings[].type" type='"acp"'>
  Contrassegna un collegamento persistente di una conversazione ACP.
</ParamField>
<ParamField path="bindings[].match" type="object">
  Identifica la conversazione di destinazione. Formati specifici per canale:

- **Canale/thread Discord:** `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
- **Canale/DM Slack:** `match.channel="slack"` + `match.peer.id="<channelId|channel:<channelId>|#<channelId>|userId|user:<userId>|slack:<userId>|<@userId>>"`. Preferisci ID Slack stabili; i collegamenti ai canali corrispondono anche alle risposte all'interno dei thread di quel canale.
- **Argomento forum Telegram:** `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
- **DM/gruppo WhatsApp:** `match.channel="whatsapp"` + `match.peer.id="<E.164|group JID>"`. Usa numeri E.164, come `+15555550123`, per le chat dirette e JID dei gruppi WhatsApp, come `120363424282127706@g.us`, per i gruppi.
- **DM/gruppo iMessage:** `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`. Preferisci `chat_id:*` per collegamenti stabili ai gruppi.

</ParamField>
<ParamField path="bindings[].agentId" type="string">
  L'ID dell'agente OpenClaw proprietario.
</ParamField>
<ParamField path="bindings[].acp.mode" type='"persistent" | "oneshot"'>
  Sostituzione ACP facoltativa.
</ParamField>
<ParamField path="bindings[].acp.label" type="string">
  Etichetta facoltativa rivolta all'operatore.
</ParamField>
<ParamField path="bindings[].acp.cwd" type="string">
  Directory di lavoro facoltativa del runtime.
</ParamField>
<ParamField path="bindings[].acp.backend" type="string">
  Sostituzione facoltativa del backend.
</ParamField>

### Valori predefiniti del runtime per agente

Usa `agents.list[].runtime` per definire i valori predefiniti ACP una sola volta per agente:

- `agents.list[].runtime.type="acp"`
- `agents.list[].runtime.acp.agent` (ID dell'harness, ad esempio `codex` o `claude`)
- `agents.list[].runtime.acp.backend`
- `agents.list[].runtime.acp.mode`
- `agents.list[].runtime.acp.cwd`

**Precedenza delle sostituzioni per le sessioni ACP collegate:**

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

- OpenClaw garantisce che la sessione ACP configurata esista dopo l'ammissione specifica del canale e prima dell'uso.
- I messaggi in quel canale, argomento o chat vengono instradati alla sessione ACP configurata.
- I binding ACP configurati sono proprietari dell'instradamento della propria sessione. La distribuzione broadcast del canale non sostituisce la sessione ACP configurata per un binding corrispondente.
- Nelle conversazioni associate, `/new` e `/reset` reimpostano sul posto la stessa chiave di sessione ACP.
- I binding di runtime temporanei, ad esempio quelli creati dai flussi di messa a fuoco dei thread, continuano ad applicarsi quando presenti.
- Per gli avvii ACP tra agenti senza un `cwd` esplicito, OpenClaw eredita l'area di lavoro dell'agente di destinazione dalla configurazione dell'agente.
- Se i percorsi ereditati dell'area di lavoro non esistono, viene usata come ripiego la directory di lavoro predefinita del backend; gli errori di accesso per percorsi esistenti vengono segnalati come errori di avvio.

## Avviare sessioni ACP

Esistono due modi per avviare una sessione ACP:

<Tabs>
  <Tab title="Da sessions_spawn">
    Usa `runtime: "acp"` per avviare una sessione ACP da un turno dell'agente o
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
    Il valore predefinito di `runtime` è `subagent`, quindi imposta esplicitamente
    `runtime: "acp"` per le sessioni ACP. Se `agentId` viene omesso, OpenClaw usa
    `acp.defaultAgent` quando è configurato. `mode: "session"` richiede
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

    Opzioni principali:

    - `--mode persistent|oneshot`
    - `--bind here|off`
    - `--thread auto|here|off`
    - `--cwd <absolute-path>`
    - `--label <name>`

    Consulta [Comandi slash](/it/tools/slash-commands).

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
  ID dell'harness ACP di destinazione. Se impostato, viene usato come ripiego `acp.defaultAgent`.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  Richiede il flusso di associazione al thread, dove supportato.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  `"run"` è un'esecuzione singola; `"session"` è persistente. Se `thread: true` e
  `mode` viene omesso, OpenClaw può adottare per impostazione predefinita un comportamento
  persistente in base al percorso di runtime. `mode: "session"` richiede `thread: true`.
</ParamField>
<ParamField path="cwd" type="string">
  Directory di lavoro del runtime richiesta, convalidata dai criteri del backend/runtime.
  Se omessa, l'avvio ACP eredita l'area di lavoro dell'agente di destinazione quando configurata;
  se i percorsi ereditati non esistono, vengono usati come ripiego i valori predefiniti del backend,
  mentre gli effettivi errori di accesso vengono restituiti.
</ParamField>
<ParamField path="label" type="string">
  Etichetta visibile all'operatore usata nel testo della sessione o del banner.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  Riprende una sessione ACP esistente anziché crearne una nuova. L'agente
  riproduce la cronologia della conversazione tramite `session/load`. Richiede
  `runtime: "acp"`.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  `"parent"` trasmette i riepiloghi iniziali dell'avanzamento dell'esecuzione ACP alla sessione
  richiedente come eventi di sistema. Le risposte accettate includono `streamLogPath`,
  che punta a un registro JSONL circoscritto alla sessione (`<sessionId>.acp-stream.jsonl`) che
  puoi seguire per ottenere l'intera cronologia di inoltro. Per impostazione predefinita, i flussi
  di avanzamento verso il genitore mostrano i commenti dell'assistente e l'avanzamento dello stato
  ACP, a meno che `streaming.progress.commentary=false`. Anche Discord usa per impostazione
  predefinita la modalità di avanzamento per le anteprime verso il genitore quando non è configurata
  alcuna modalità di flusso. L'avanzamento dello stato rispetta comunque
  `acp.stream.tagVisibility`, quindi tag come `plan` rimangono nascosti se non vengono
  abilitati esplicitamente.
</ParamField>

Le esecuzioni ACP di `sessions_spawn` usano `agents.defaults.subagents.runTimeoutSeconds`
come limite predefinito per il turno figlio. Lo strumento non accetta sostituzioni del
timeout per singola chiamata (`runTimeoutSeconds`/`timeoutSeconds` vengono rifiutati con un
errore che richiede di configurare il valore predefinito).

<ParamField path="model" type="string">
  Sostituzione esplicita del modello per la sessione ACP figlia. Gli avvii ACP di Codex
  normalizzano riferimenti OpenAI come `openai/gpt-5.4` nella configurazione di avvio
  ACP di Codex prima di `session/new`; le forme con barra, come `openai/gpt-5.4/high`,
  impostano anche l'intensità di ragionamento ACP di Codex. Quando viene omesso,
  `sessions_spawn({ runtime: "acp" })` usa i valori predefiniti esistenti del modello
  del sottoagente (`agents.defaults.subagents.model` o
  `agents.list[].subagents.model`) quando configurati; altrimenti consente all'harness
  ACP di usare il proprio modello predefinito. Gli altri harness devono dichiarare i
  `models` ACP e supportare `session/set_model`; in caso contrario OpenClaw/acpx restituisce
  un errore chiaro anziché usare silenziosamente come ripiego il modello predefinito
  dell'agente di destinazione.
</ParamField>
<ParamField path="thinking" type="string">
  Intensità esplicita di pensiero/ragionamento. Per ACP di Codex, `minimal` corrisponde a
  un'intensità bassa, `low`/`medium`/`high`/`xhigh` vengono mappati direttamente e `off`
  omette la sostituzione dell'intensità di ragionamento all'avvio. Quando viene omesso,
  gli avvii ACP usano i valori predefiniti esistenti di pensiero del sottoagente e
  `agents.defaults.models["provider/model"].params.thinking` specifico per modello
  per il modello selezionato.
</ParamField>

## Modalità di associazione e thread per l'avvio

<Tabs>
  <Tab title="--bind here|off">
    | Modalità | Comportamento                                                                  |
    | -------- | ----------------------------------------------------------------------------- |
    | `here`   | Associa sul posto la conversazione attiva corrente; non riesce se non ve n'è una attiva. |
    | `off`    | Non crea un'associazione alla conversazione corrente.                         |

    Note:

    - `--bind here` è il percorso più semplice per l'operatore per «fare in modo che questo canale o questa chat usi Codex».
    - `--bind here` non crea un thread figlio.
    - `--bind here` è disponibile solo sui canali che espongono il supporto per l'associazione alla conversazione corrente.
    - `--bind` e `--thread` non possono essere combinati nella stessa chiamata `/acp spawn`.

  </Tab>
  <Tab title="--thread auto|here|off">
    | Modalità | Comportamento                                                                                                  |
    | -------- | ------------------------------------------------------------------------------------------------------------- |
    | `auto`   | In un thread attivo: associa quel thread. Fuori da un thread: crea/associa un thread figlio, se supportato.    |
    | `here`   | Richiede un thread attivo corrente; non riesce se non ci si trova in un thread.                               |
    | `off`    | Nessuna associazione. La sessione viene avviata senza associazione.                                            |

    Note:

    - Nelle superfici di associazione prive di thread, il comportamento predefinito equivale di fatto a `off`.
    - L'avvio associato a un thread richiede il supporto dei criteri del canale:
      - Discord: `channels.discord.threadBindings.spawnSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnSessions=true`
    - Usa `--bind here` quando vuoi fissare la conversazione corrente senza creare un thread figlio.

  </Tab>
</Tabs>

## Modello di consegna

Le sessioni ACP possono essere aree di lavoro interattive oppure attività in background
gestite dal genitore. Il percorso di consegna dipende da questa configurazione.

<AccordionGroup>
  <Accordion title="Sessioni ACP interattive">
    Le sessioni interattive sono concepite per continuare a conversare su una superficie di chat visibile:

    - `/acp spawn ... --bind here` associa la conversazione corrente alla sessione ACP.
    - `/acp spawn ... --thread ...` associa un thread/argomento del canale alla sessione ACP.
    - I `bindings[].type="acp"` configurati in modo persistente instradano le conversazioni corrispondenti alla stessa sessione ACP.

    I messaggi successivi nella conversazione associata vengono instradati direttamente alla
    sessione ACP e l'output ACP viene restituito allo stesso
    canale/thread/argomento.

    Ciò che OpenClaw invia all'harness:

    - I normali messaggi successivi associati vengono inviati come testo del prompt, con gli allegati solo quando l'harness/backend li supporta.
    - I comandi di gestione `/acp` e i comandi locali del Gateway vengono intercettati prima dell'invio ACP.
    - Gli eventi di completamento generati dal runtime vengono materializzati per ciascuna destinazione. Gli agenti OpenClaw ricevono l'involucro del contesto di runtime interno di OpenClaw; gli harness ACP esterni ricevono un semplice prompt con il risultato figlio e l'istruzione. L'involucro grezzo `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>` non deve mai essere inviato agli harness esterni né conservato come testo della trascrizione utente ACP.
    - Le voci della trascrizione ACP usano il testo di attivazione visibile all'utente o il semplice prompt di completamento. Quando possibile, i metadati interni degli eventi rimangono strutturati in OpenClaw e non vengono trattati come contenuto della chat scritto dall'utente.

  </Accordion>
  <Accordion title="Sessioni ACP a esecuzione singola gestite dal genitore">
    Le sessioni ACP a esecuzione singola avviate da un'altra esecuzione dell'agente sono figli
    in background, analoghi ai sottoagenti:

    - Il genitore richiede un'attività con `sessions_spawn({ runtime: "acp", mode: "run" })`.
    - Il figlio viene eseguito nella propria sessione dell'harness ACP.
    - I turni figli vengono eseguiti sulla stessa corsia in background usata dagli avvii nativi dei sottoagenti, perciò un harness ACP lento non blocca le attività non correlate della sessione principale.
    - Il completamento viene comunicato tramite il percorso di annuncio del completamento dell'attività. OpenClaw converte i metadati interni di completamento in un semplice prompt ACP prima di inviarli a un harness esterno, affinché gli harness non vedano gli indicatori del contesto di runtime riservati a OpenClaw.
    - Il genitore riformula il risultato del figlio con il normale tono dell'assistente quando è utile una risposta destinata all'utente.

    **Non** trattare questo percorso come una chat peer-to-peer tra genitore e
    figlio. Il figlio dispone già di un canale di completamento verso il genitore.

  </Accordion>
  <Accordion title="sessions_send e consegna A2A">
    `sessions_send` può indirizzare un'altra sessione dopo l'avvio. Per le normali sessioni
    peer, OpenClaw usa un percorso di messaggi successivi da agente ad agente (A2A) dopo
    avere inserito il messaggio:

    - Attende la risposta della sessione di destinazione.
    - Facoltativamente consente al richiedente e alla destinazione di scambiarsi un numero limitato di turni successivi.
    - Chiede alla destinazione di produrre un messaggio di annuncio.
    - Consegna tale annuncio al canale o al thread visibile.

    Quel percorso A2A è una soluzione di ripiego per gli invii tra peer in cui il mittente necessita di un
    aggiornamento successivo visibile. Rimane abilitato quando una sessione non correlata può vedere e
    inviare messaggi a una destinazione ACP, ad esempio con impostazioni
    `tools.sessions.visibility` ampie.

    OpenClaw salta l'aggiornamento successivo A2A solo quando il richiedente è il genitore del
    proprio processo figlio ACP one-shot, di proprietà del genitore. In tal caso, eseguire A2A oltre
    al completamento dell'attività può riattivare il genitore con il risultato del processo figlio, inoltrare
    la risposta del genitore al processo figlio e creare un ciclo di eco
    genitore/figlio. Il risultato di `sessions_send` riporta `delivery.status="skipped"` per
    il caso del processo figlio di proprietà, perché il percorso di completamento è già responsabile
    del risultato.

  </Accordion>
  <Accordion title="Riprendere una sessione esistente">
    Usa `resumeSessionId` per continuare una sessione ACP precedente invece di
    iniziare da zero. L'agente riproduce la cronologia della conversazione tramite
    `session/load`, riprendendo quindi con il contesto completo di ciò che è avvenuto in precedenza.

    ```json
    {
      "task": "Continue where we left off - fix the remaining test failures",
      "runtime": "acp",
      "agentId": "codex",
      "resumeSessionId": "<previous-session-id>"
    }
    ```

    Casi d'uso comuni:

    - Trasferire una sessione Codex dal portatile al telefono: chiedi all'agente di riprendere da dove avevi interrotto.
    - Continuare una sessione di programmazione avviata in modo interattivo nella CLI, ora senza interfaccia tramite il tuo agente.
    - Riprendere un lavoro interrotto da un riavvio del Gateway o da un timeout di inattività.

    Note:

    - `resumeSessionId` si applica solo quando `runtime: "acp"`; il runtime predefinito dei sottoagenti ignora questo campo esclusivo di ACP.
    - `streamTo` si applica solo quando `runtime: "acp"`; il runtime predefinito dei sottoagenti ignora questo campo esclusivo di ACP.
    - `resumeSessionId` è un ID di ripresa ACP/harness locale all'host, non una chiave di sessione del canale OpenClaw; OpenClaw verifica comunque i criteri di avvio ACP e quelli dell'agente di destinazione prima dell'invio, mentre il backend ACP o l'harness gestisce l'autorizzazione per il caricamento di tale ID upstream.
    - `resumeSessionId` ripristina la cronologia della conversazione ACP upstream; `thread` e `mode` continuano ad applicarsi normalmente alla nuova sessione OpenClaw che stai creando, quindi `mode: "session"` richiede comunque `thread: true`.
    - L'agente di destinazione deve supportare `session/load` (Codex e Claude Code lo supportano).
    - Se l'ID sessione non viene trovato, l'avvio non riesce con un errore chiaro, senza alcun ripiego silenzioso su una nuova sessione.

  </Accordion>
  <Accordion title="Test rapido successivo alla distribuzione">
    Dopo la distribuzione di un Gateway, esegui una verifica end-to-end dal vivo invece di affidarti
    agli unit test:

    1. Verifica la versione e il commit del Gateway distribuito sull'host di destinazione.
    2. Apri una sessione bridge ACPX temporanea verso un agente attivo.
    3. Chiedi a tale agente di chiamare `sessions_spawn` con `runtime: "acp"`, `agentId: "codex"`, `mode: "run"` e attività `Reply with exactly LIVE-ACP-SPAWN-OK`.
    4. Verifica `accepted=yes`, un `childSessionKey` reale e l'assenza di errori del validatore.
    5. Elimina la sessione bridge temporanea.

    Mantieni il controllo su `mode: "run"` e ometti `streamTo: "parent"`:
    il `mode: "session"` associato a un thread e i percorsi di inoltro del flusso sono verifiche di integrazione
    separate e più complete.

  </Accordion>
</AccordionGroup>

## Compatibilità con la sandbox

Le sessioni ACP vengono attualmente eseguite nel runtime dell'host, **non** all'interno della sandbox
di OpenClaw.

<Warning>
**Confine di sicurezza:**

- L'harness esterno può leggere/scrivere in base alle proprie autorizzazioni CLI e al `cwd` selezionato.
- I criteri della sandbox di OpenClaw **non** avvolgono l'esecuzione dell'harness ACP.
- OpenClaw applica comunque i controlli di abilitazione delle funzionalità ACP, gli agenti consentiti, la proprietà delle sessioni, le associazioni ai canali e i criteri di consegna del Gateway.
- Usa `runtime: "subagent"` per il lavoro nativo di OpenClaw soggetto all'applicazione della sandbox.

</Warning>

Limitazioni attuali:

- Se la sessione richiedente è in sandbox, gli avvii ACP vengono bloccati sia per `sessions_spawn({ runtime: "acp" })` sia per `/acp spawn`.
- `sessions_spawn` con `runtime: "acp"` non supporta `sandbox: "require"`.

## Risoluzione della destinazione della sessione

La maggior parte delle azioni `/acp` accetta una destinazione di sessione facoltativa (`session-key`,
`session-id` o `session-label`).

**Ordine di risoluzione:**

1. Argomento di destinazione esplicito (o `--session` per `/acp steer`)
   - prova prima la chiave
   - poi l'ID sessione in formato UUID
   - infine l'etichetta
2. Associazione al thread corrente (se questa conversazione/thread è associata a una sessione ACP).
3. Ripiego sulla sessione del richiedente corrente.

Sia le associazioni alla conversazione corrente sia quelle al thread partecipano al passaggio 2.

Se non viene risolta alcuna destinazione, OpenClaw restituisce un errore chiaro
(`Unable to resolve session target: ...`).

## Controlli ACP

| Comando              | Funzione                                              | Esempio                                                       |
| -------------------- | --------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | Crea una sessione ACP; associazione corrente o al thread facoltativa. | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | Annulla il turno in corso per la sessione di destinazione.                 | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | Invia un'istruzione di orientamento alla sessione in esecuzione.                | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | Chiude la sessione e rimuove le associazioni alle destinazioni del thread.                  | `/acp close`                                                  |
| `/acp status`        | Mostra backend, modalità, stato, opzioni del runtime e funzionalità. | `/acp status`                                                 |
| `/acp set-mode`      | Imposta la modalità del runtime per la sessione di destinazione.                      | `/acp set-mode plan`                                          |
| `/acp set`           | Scrive un'opzione generica di configurazione del runtime.                      | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | Imposta la sostituzione della directory di lavoro del runtime.                   | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | Imposta il profilo dei criteri di approvazione.                              | `/acp permissions strict`                                     |
| `/acp timeout`       | Imposta il timeout del runtime (secondi).                            | `/acp timeout 120`                                            |
| `/acp model`         | Imposta la sostituzione del modello del runtime.                               | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | Rimuove le sostituzioni delle opzioni del runtime della sessione.                  | `/acp reset-options`                                          |
| `/acp sessions`      | Elenca le sessioni ACP recenti dall'archivio.                      | `/acp sessions`                                               |
| `/acp doctor`        | Mostra integrità del backend, funzionalità e correzioni attuabili.           | `/acp doctor`                                                 |
| `/acp install`       | Visualizza i passaggi deterministici di installazione e abilitazione.             | `/acp install`                                                |

I controlli del runtime (`spawn`, `cancel`, `steer`, `close`, `status`, `set-mode`,
`set`, `cwd`, `permissions`, `timeout`, `model` e `reset-options`) richiedono
l'identità del proprietario dai canali esterni e `operator.admin` dai client
interni del Gateway. I mittenti autorizzati non proprietari possono comunque usare `sessions`,
`doctor`, `install` e `help`.

`/acp status` mostra le opzioni effettive del runtime, oltre agli identificatori
di sessione a livello di runtime e backend. Gli errori relativi ai controlli non supportati vengono mostrati
chiaramente quando un backend non dispone di una funzionalità. `/acp sessions` legge l'archivio
per la sessione attualmente associata o del richiedente; i token di destinazione (`session-key`,
`session-id` o `session-label`) vengono risolti tramite il rilevamento delle sessioni del Gateway,
incluse le directory radice `session.store` personalizzate per agente.

### Mappatura delle opzioni del runtime

`/acp` dispone di comandi pratici e di un'impostazione generica. Operazioni equivalenti:

| Comando                      | Corrisponde a                              | Note                                                                                                                                                                                                      |
| ---------------------------- | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/acp model <id>`            | chiave di configurazione del runtime `model`           | Per Codex ACP, OpenClaw normalizza `openai/<model>` nell'ID modello dell'adattatore e associa i suffissi di ragionamento separati da una barra, come `openai/gpt-5.4/high`, a `reasoning_effort`.                                         |
| `/acp set thinking <level>`  | opzione canonica `thinking`          | OpenClaw invia l'equivalente pubblicizzato dal backend, se presente, preferendo nell'ordine `thinking`, `effort`, `reasoning_effort` o `thought_level`. Per Codex ACP, l'adattatore associa i valori a `reasoning_effort`. |
| `/acp permissions <profile>` | opzione canonica `permissionProfile` | OpenClaw invia l'equivalente pubblicizzato dal backend, se presente, ad esempio `approval_policy`, `permission_profile`, `permissions` o `permission_mode`.                                                       |
| `/acp timeout <seconds>`     | opzione canonica `timeoutSeconds`    | OpenClaw invia l'equivalente pubblicizzato dal backend, se presente, ad esempio `timeout` o `timeout_seconds`.                                                                                                     |
| `/acp cwd <path>`            | sostituzione del cwd del runtime                 | Aggiornamento diretto.                                                                                                                                                                                             |
| `/acp set <key> <value>`     | generico                              | `key=cwd` usa il percorso di sostituzione del cwd.                                                                                                                                                                      |
| `/acp reset-options`         | cancella tutte le sostituzioni del runtime         | -                                                                                                                                                                                                          |

## Harness acpx, configurazione dei Plugin e autorizzazioni

Per la configurazione dell'harness acpx (alias di Claude Code / Codex / Gemini CLI),
i bridge MCP plugin-tools e OpenClaw-tools e le modalità di autorizzazione ACP,
consulta [Agenti ACP - configurazione](/it/tools/acp-agents-setup).

## Risoluzione dei problemi

| Sintomo                                                                                   | Causa probabile                                                                                                        | Soluzione                                                                                                                                                                             |
| ----------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ACP runtime backend is not configured`                                                   | Plugin del backend mancante, disabilitato o bloccato da `plugins.allow`.                                               | Installa e abilita il Plugin del backend, includi `acpx` in `plugins.allow` quando tale elenco consentito è impostato, quindi esegui `/acp doctor`.                                   |
| `ACP is disabled by policy (acp.enabled=false)`                                           | ACP disabilitato globalmente.                                                                                          | Imposta `acp.enabled=true`.                                                                                                                                                           |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`                         | Invio automatico dai normali messaggi della conversazione disabilitato.                                                | Imposta `acp.dispatch.enabled=true` per ripristinare l'instradamento automatico delle conversazioni; le chiamate esplicite `sessions_spawn({ runtime: "acp" })` continuano a funzionare. |
| `ACP agent "<id>" is not allowed by policy`                                               | Agente non presente nell'elenco consentito.                                                                            | Usa un `agentId` consentito o aggiorna `acp.allowedAgents`.                                                                                                                           |
| `/acp doctor` reports backend not ready right after startup                               | Il Plugin del backend è mancante, disabilitato, bloccato dai criteri di autorizzazione/negazione oppure il relativo eseguibile configurato non è disponibile. | Installa o abilita il Plugin del backend, esegui nuovamente `/acp doctor` e, se continua a non essere operativo, esamina l'errore di installazione o dei criteri del backend. |
| Comando dell'harness non trovato                                                          | La CLI dell'adattatore non è installata, il Plugin esterno è mancante oppure il recupero tramite `npx` alla prima esecuzione non è riuscito per un adattatore diverso da Codex. | Esegui `/acp doctor`, installa o precarica l'adattatore sull'host del Gateway oppure configura esplicitamente il comando dell'agente acpx. |
| Modello non trovato dall'harness                                                          | L'ID del modello è valido per un altro provider o harness, ma non per questa destinazione ACP.                          | Usa un modello elencato dall'harness, configura il modello nell'harness oppure ometti la sostituzione.                                                                                |
| Errore di autenticazione del fornitore dall'harness                                       | OpenClaw è operativo, ma l'accesso alla CLI o al provider di destinazione non è stato effettuato.                       | Effettua l'accesso o fornisci la chiave richiesta dal provider nell'ambiente dell'host del Gateway.                                                                                   |
| `Unable to resolve session target: ...`                                                   | Token della chiave, dell'ID o dell'etichetta errato.                                                                   | Esegui `/acp sessions`, copia la chiave o l'etichetta esatta e riprova.                                                                                                               |
| `--bind here requires running /acp spawn inside an active ... conversation`               | `--bind here` utilizzato senza una conversazione attiva associabile.                                                   | Passa alla chat o al canale di destinazione e riprova, oppure avvia una sessione senza associazione.                                                                                  |
| `Conversation bindings are unavailable for <channel>.`                                    | L'adattatore non dispone della funzionalità ACP per associare la conversazione corrente.                               | Usa `/acp spawn ... --thread ...` dove supportato, configura `bindings[]` al livello principale oppure passa a un canale supportato.                                                  |
| `--thread here requires running /acp spawn inside an active ... thread`                   | `--thread here` utilizzato al di fuori del contesto di una discussione.                                                | Passa alla discussione di destinazione oppure usa `--thread auto`/`off`.                                                                                                              |
| `Only <user-id> can rebind this channel/conversation/thread.`                             | Un altro utente è proprietario della destinazione di associazione attiva.                                              | Ripeti l'associazione come proprietario oppure usa una conversazione o una discussione diversa.                                                                                       |
| `Thread bindings are unavailable for <channel>.`                                          | L'adattatore non dispone della funzionalità di associazione delle discussioni.                                         | Usa `--thread off` oppure passa a un adattatore o canale supportato.                                                                                                                  |
| `Sandboxed sessions cannot spawn ACP sessions ...`                                        | Il runtime ACP opera sul lato host; la sessione richiedente è in sandbox.                                               | Usa `runtime="subagent"` dalle sessioni in sandbox oppure avvia ACP da una sessione non in sandbox.                                                                                   |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`                   | È stato richiesto `sandbox="require"` per il runtime ACP.                                                              | Usa `runtime="subagent"` quando la sandbox è obbligatoria oppure usa ACP con `sandbox="inherit"` da una sessione non in sandbox.                                                      |
| `Cannot apply --model ... did not advertise model support`                                | L'harness di destinazione non espone il cambio generico del modello ACP.                                               | Usa un harness che dichiari il supporto ACP per `models`/`session/set_model`, usa i riferimenti ai modelli ACP di Codex oppure configura il modello direttamente nell'harness, se dispone di un proprio flag di avvio. |
| Metadati ACP mancanti per la sessione associata                                           | Metadati della sessione ACP obsoleti o eliminati.                                                                      | Ricrea la sessione con `/acp spawn`, quindi associa nuovamente o porta in primo piano la discussione.                                                                                 |
| `PermissionPromptUnavailableError: Permission prompt unavailable in non-interactive mode` | `permissionMode` blocca scritture o esecuzioni nella sessione ACP non interattiva.                                     | Imposta `plugins.entries.acpx.config.permissionMode` su `approve-all` e riavvia il Gateway. Consulta [Configurazione delle autorizzazioni](/it/tools/acp-agents-setup#permission-configuration). |
| La sessione ACP termina prematuramente con poco output                                    | Le richieste di autorizzazione sono bloccate da `permissionMode`/`nonInteractivePermissions`.                           | Controlla i registri del Gateway per `AcpRuntimeError`. Per autorizzazioni complete, imposta `permissionMode=approve-all`; per una degradazione controllata, imposta `nonInteractivePermissions=deny`. |
| La sessione ACP rimane bloccata indefinitamente dopo il completamento del lavoro           | Il processo dell'harness è terminato, ma la sessione ACP non ha segnalato il completamento.                             | Aggiorna OpenClaw; la pulizia corrente di acpx termina i processi obsoleti del wrapper e dell'adattatore appartenenti a OpenClaw alla chiusura e all'avvio del Gateway.                 |
| L'harness rileva `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>`                                  | L'involucro degli eventi interni è fuoriuscito oltre il confine ACP.                                                    | Aggiorna OpenClaw e riesegui il flusso di completamento; gli harness esterni devono ricevere esclusivamente richieste di completamento in testo semplice.                              |

<Note>
`Command blocked by PreToolUse hook: Native hook relay unavailable` riguarda
l'inoltro nativo degli hook di Codex, non ACP/acpx. In una chat Codex associata, avvia una
nuova sessione con `/new` o `/reset`; se funziona una volta e poi l'errore si ripresenta alla
successiva chiamata di uno strumento nativo, riavvia l'app-server di Codex o il Gateway di OpenClaw
invece di ripetere `/new`. Consulta
[Risoluzione dei problemi dell'harness Codex](/it/plugins/codex-harness#troubleshooting).
</Note>

## Contenuti correlati

- [Agenti ACP - configurazione](/it/tools/acp-agents-setup)
- [Invio dell'agente](/it/tools/agent-send)
- [Backend della CLI](/it/gateway/cli-backends)
- [Harness Codex](/it/plugins/codex-harness)
- [Runtime dell'harness Codex](/it/plugins/codex-harness-runtime)
- [Strumenti sandbox multi-agente](/it/tools/multi-agent-sandbox-tools)
- [`openclaw acp` (modalità bridge)](/it/cli/acp)
- [Sottoagenti](/it/tools/subagents)
