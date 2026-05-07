---
read_when:
    - Vuoi usare l'harness app-server di Codex incluso
    - Ti servono esempi di configurazione dell'harness di Codex
    - Vuoi che le distribuzioni esclusivamente Codex falliscano invece di ricorrere a PI
summary: Esegui i turni dell'agente integrato di OpenClaw tramite l'harness app-server Codex incluso
title: Ambiente di esecuzione Codex
x-i18n:
    generated_at: "2026-05-07T01:53:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 484f32d9b73632827ee0ce3963ddbead784196fb36ff089632d0f622f1cecdf7
    source_path: plugins/codex-harness.md
    workflow: 16
---

Il Plugin `codex` incluso consente a OpenClaw di eseguire i turni agente incorporati tramite il
server app Codex invece che tramite l'harness PI integrato.

Usalo quando vuoi che Codex gestisca la sessione agente di basso livello: rilevamento
dei modelli, ripresa nativa del thread, Compaction nativa ed esecuzione server app.
OpenClaw continua a gestire canali chat, file di sessione, selezione del modello, strumenti,
approvazioni, consegna dei media e il mirror visibile della trascrizione.

Quando un turno chat sorgente viene eseguito tramite l'harness Codex, le risposte visibili usano per impostazione predefinita
lo strumento `message` di OpenClaw se la distribuzione non ha configurato esplicitamente
`messages.visibleReplies`. L'agente può comunque completare privatamente il proprio turno Codex;
pubblica nel canale solo quando chiama `message(action="send")`. Imposta
`messages.visibleReplies: "automatic"` per mantenere le risposte finali delle chat dirette nel
percorso di consegna automatica legacy.

Anche i turni Heartbeat di Codex ricevono per impostazione predefinita lo strumento `heartbeat_respond`, quindi
l'agente può registrare se il risveglio deve restare silenzioso o notificare senza codificare
quel flusso di controllo nel testo finale.

Le indicazioni di iniziativa specifiche per Heartbeat vengono inviate come istruzione per sviluppatori in modalità collaborazione di Codex
sul turno Heartbeat stesso. I turni chat ordinari ripristinano
la modalità predefinita di Codex invece di portare la filosofia Heartbeat nel loro normale
prompt di runtime.

Se stai cercando di orientarti, inizia da
[Runtime degli agenti](/it/concepts/agent-runtimes). La versione breve è:
`openai/gpt-5.5` è il riferimento del modello, `codex` è il runtime, e Telegram,
Discord, Slack o un altro canale resta la superficie di comunicazione.

## Configurazione rapida

La maggior parte degli utenti che vuole "Codex in OpenClaw" vuole questo percorso: accedere con un
abbonamento ChatGPT/Codex, quindi eseguire i turni agente incorporati tramite il runtime nativo
del server app Codex. Il riferimento del modello resta comunque canonico come
`openai/gpt-*`; l'autenticazione dell'abbonamento proviene dall'account/profilo Codex, non
da un prefisso di modello `openai-codex/*`.

Prima accedi con OAuth Codex se non lo hai già fatto:

```bash
openclaw models auth login --provider openai-codex
```

Poi abilita il Plugin `codex` incluso e forza il runtime Codex:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      agentRuntime: {
        id: "codex",
      },
    },
  },
}
```

Se la tua configurazione usa `plugins.allow`, includi anche `codex` lì:

```json5
{
  plugins: {
    allow: ["codex"],
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
}
```

Non usare `openai-codex/gpt-*` nella configurazione. Quel prefisso è un percorso legacy che
`openclaw doctor --fix` riscrive in `openai/gpt-*` per modelli primari,
fallback, override di Heartbeat/subagente/Compaction, hook, override di canale
e pin di route di sessione persistenti obsoleti.

## Cosa cambia questo Plugin

Il Plugin `codex` incluso contribuisce diverse capacità separate:

| Capacità                          | Come usarla                                         | Cosa fa                                                                        |
| --------------------------------- | --------------------------------------------------- | ------------------------------------------------------------------------------ |
| Runtime incorporato nativo        | `agentRuntime.id: "codex"`                          | Esegue i turni agente incorporati di OpenClaw tramite il server app Codex.      |
| Comandi nativi di controllo chat  | `/codex bind`, `/codex resume`, `/codex steer`, ... | Associa e controlla i thread del server app Codex da una conversazione di messaggistica. |
| Provider/catalogo server app Codex | Interni `codex`, esposti tramite l'harness          | Permette al runtime di rilevare e convalidare i modelli server app.            |
| Percorso di comprensione media Codex | Percorsi di compatibilità modello immagine `codex/*` | Esegue turni server app Codex limitati per i modelli di comprensione immagini supportati. |
| Relay hook nativo                 | Hook Plugin intorno agli eventi nativi Codex        | Permette a OpenClaw di osservare/bloccare eventi strumento/finalizzazione nativi Codex supportati. |

Abilitare il Plugin rende disponibili queste capacità. **Non**:

- inizia a usare Codex per ogni modello OpenAI
- converte i riferimenti modello `openai-codex/*` nel runtime nativo senza che doctor
  verifichi che Codex sia installato, abilitato, contribuisca l'harness `codex`
  e sia pronto per OAuth
- rende ACP/acpx il percorso Codex predefinito
- cambia a caldo le sessioni esistenti che hanno già registrato un runtime PI
- sostituisce la consegna canale di OpenClaw, i file di sessione, l'archiviazione dei profili di autenticazione o
  il routing dei messaggi

Lo stesso Plugin possiede anche la superficie nativa dei comandi di controllo chat `/codex`. Se
il Plugin è abilitato e l'utente chiede di associare, riprendere, guidare, interrompere o ispezionare
thread Codex dalla chat, gli agenti dovrebbero preferire `/codex ...` rispetto ad ACP. ACP resta
il fallback esplicito quando l'utente chiede ACP/acpx o sta testando l'adapter ACP
di Codex.

I turni nativi Codex mantengono gli hook Plugin di OpenClaw come livello pubblico di compatibilità.
Questi sono hook OpenClaw in-process, non hook di comando `hooks.json` di Codex:

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `before_tool_call`, `after_tool_call`
- `before_message_write` per i record di trascrizione replicati
- `before_agent_finalize` tramite relay `Stop` di Codex
- `agent_end`

I Plugin possono anche registrare middleware di risultati strumento neutrale rispetto al runtime per riscrivere
i risultati degli strumenti dinamici di OpenClaw dopo che OpenClaw esegue lo strumento e prima che il
risultato venga restituito a Codex. Questo è separato dall'hook Plugin pubblico
`tool_result_persist`, che trasforma le scritture dei risultati strumento nella trascrizione possedute da OpenClaw.

Per la semantica degli hook Plugin, vedi [Hook Plugin](/it/plugins/hooks)
e [Comportamento guardia Plugin](/it/tools/plugin).

L'harness è disattivato per impostazione predefinita. Le nuove configurazioni dovrebbero mantenere canonici i riferimenti modello OpenAI
come `openai/gpt-*` e forzare esplicitamente
`agentRuntime.id: "codex"` o `OPENCLAW_AGENT_RUNTIME=codex` quando
vogliono l'esecuzione nativa server app. I riferimenti modello legacy `codex/*` selezionano ancora automaticamente
l'harness per compatibilità, ma i prefissi provider legacy supportati da runtime
non sono mostrati come normali scelte di modello/provider.

Se una route modello configurata è ancora `openai-codex/*`, `openclaw doctor --fix`
la riscrive in `openai/*`. Per le route agente corrispondenti, imposta il runtime agente
su `codex` solo quando il Plugin Codex è installato, abilitato, contribuisce
l'harness `codex` e dispone di OAuth utilizzabile; altrimenti imposta il runtime su `pi`.

## Mappa delle route

Usa questa tabella prima di modificare la configurazione:

| Comportamento desiderato                         | Riferimento modello       | Configurazione runtime                  | Route autenticazione/profilo | Etichetta stato prevista       |
| ------------------------------------------------ | ------------------------- | --------------------------------------- | ---------------------------- | ------------------------------ |
| Abbonamento ChatGPT/Codex con runtime nativo Codex | `openai/gpt-*`            | `agentRuntime.id: "codex"`              | OAuth Codex o account Codex  | `Runtime: OpenAI Codex`        |
| API OpenAI tramite runner normale OpenClaw       | `openai/gpt-*`            | omesso o `runtime: "pi"`                | Chiave API OpenAI            | `Runtime: OpenClaw Pi Default` |
| Configurazione legacy che richiede riparazione doctor | `openai-codex/gpt-*`  | riparata in `codex` o `pi`              | Autenticazione configurata esistente | Ricontrolla dopo `doctor --fix` |
| Provider misti con modalità automatica conservativa | riferimenti specifici del provider | `agentRuntime.id: "auto"`       | Per provider selezionato     | Dipende dal runtime selezionato |
| Sessione adapter ACP Codex esplicita             | dipendente da prompt/modello ACP | `sessions_spawn` con `runtime: "acp"` | Autenticazione backend ACP   | Stato attività/sessione ACP    |

La distinzione importante è provider rispetto a runtime:

- `openai-codex/*` è una route legacy che doctor riscrive.
- `agentRuntime.id: "codex"` richiede l'harness Codex e fallisce in modo chiuso se
  non è disponibile.
- `agentRuntime.id: "auto"` permette agli harness registrati di rivendicare route provider
  corrispondenti, ma i riferimenti OpenAI canonici sono comunque posseduti da PI a meno che un harness supporti
  quella coppia provider/modello.
- `/codex ...` risponde a "a quale conversazione nativa Codex deve associarsi
  o quale deve controllare questa chat?"
- ACP risponde a "quale processo harness esterno deve avviare acpx?"

## Scegli il prefisso modello corretto

Le route della famiglia OpenAI sono specifiche per prefisso. Per la configurazione comune con abbonamento più
runtime nativo Codex, usa `openai/*` con `agentRuntime.id: "codex"`.
Tratta `openai-codex/*` come configurazione legacy che doctor dovrebbe riscrivere:

| Riferimento modello                            | Percorso runtime                              | Quando usarlo                                                              |
| ---------------------------------------------- | --------------------------------------------- | -------------------------------------------------------------------------- |
| `openai/gpt-5.4`                               | Provider OpenAI tramite plumbing OpenClaw/PI  | Vuoi l'accesso attuale diretto alle API OpenAI Platform con `OPENAI_API_KEY`. |
| `openai-codex/gpt-5.5`                         | Route legacy riparata da doctor               | Sei su una vecchia configurazione; esegui `openclaw doctor --fix` per riscriverla. |
| `openai/gpt-5.5` + `agentRuntime.id: "codex"`  | Harness server app Codex                      | Vuoi autenticazione con abbonamento ChatGPT/Codex ed esecuzione nativa Codex. |

GPT-5.5 può comparire sia sulle route con chiave API OpenAI diretta sia sulle route con abbonamento Codex
quando il tuo account le espone. Usa `openai/gpt-5.5` con l'harness server app Codex
per il runtime nativo Codex, oppure `openai/gpt-5.5` senza un override di runtime Codex
per traffico diretto con chiave API.

I riferimenti legacy `codex/gpt-*` restano accettati come alias di compatibilità. La migrazione di
compatibilità doctor riscrive i riferimenti runtime legacy in riferimenti modello canonici
e registra separatamente la policy runtime. Le nuove configurazioni dell'harness nativo server app
dovrebbero usare `openai/gpt-*` più `agentRuntime.id: "codex"`.

`agents.defaults.imageModel` segue la stessa distinzione di prefisso. Usa
`openai/gpt-*` per la route OpenAI normale e `codex/gpt-*` quando la comprensione
delle immagini deve essere eseguita tramite un turno server app Codex limitato. Non usare
`openai-codex/gpt-*`; doctor riscrive quel prefisso legacy in `openai/gpt-*`. Il
modello server app Codex deve dichiarare supporto per input immagine; i modelli Codex solo testo
falliscono prima dell'avvio del turno media.

Usa `/status` per confermare l'harness effettivo per la sessione corrente. Se la
selezione sorprende, abilita il logging di debug per il sottosistema `agents/harness`
e ispeziona il record strutturato `agent harness selected` del Gateway. Include
l'id dell'harness selezionato, il motivo della selezione, la policy runtime/fallback e,
in modalità `auto`, il risultato di supporto di ogni candidato Plugin.

### Cosa significano gli avvisi di doctor

`openclaw doctor` avvisa quando i riferimenti modello configurati o lo stato persistente delle route di sessione
usano ancora `openai-codex/*`. `openclaw doctor --fix` riscrive quelle route
in:

- `openai/<model>`
- `agentRuntime.id: "codex"` quando Codex è installato, abilitato, contribuisce l'harness
  `codex` e ha OAuth utilizzabile
- `agentRuntime.id: "pi"` altrimenti

La route `codex` forza l'harness nativo Codex. La route `pi` mantiene
l'agente sul runner predefinito OpenClaw invece di abilitare o installare Codex come
effetto collaterale della pulizia della route legacy.
Doctor ripara anche i pin di sessione persistenti obsoleti nei registri di sessione agente scoperti,
così le vecchie conversazioni non restano bloccate sulla route rimossa.

La selezione dell'harness non è un controllo della sessione live. Quando viene eseguito un turno incorporato,
OpenClaw registra l'id dell'harness selezionato su quella sessione e continua a usarlo per
i turni successivi nello stesso id sessione. Modifica la configurazione `agentRuntime` oppure
`OPENCLAW_AGENT_RUNTIME` quando vuoi che le sessioni future usino un altro harness;
usa `/new` o `/reset` per avviare una nuova sessione prima di passare una conversazione
esistente tra PI e Codex. Questo evita di riprodurre una trascrizione attraverso
due sistemi di sessione nativi incompatibili.

Le sessioni legacy create prima dei pin dell'harness vengono trattate come bloccate su PI una volta che
hanno una cronologia della trascrizione. Usa `/new` o `/reset` per far aderire quella conversazione a
Codex dopo aver modificato la configurazione.

`/status` mostra il runtime del modello effettivo. L'harness PI predefinito appare come
`Runtime: OpenClaw Pi Default`, mentre l'harness app-server Codex appare come
`Runtime: OpenAI Codex`.

## Requisiti

- OpenClaw con il plugin `codex` incluso disponibile.
- App-server Codex `0.125.0` o più recente. Il plugin incluso gestisce per impostazione predefinita un binario
  app-server Codex compatibile, quindi i comandi `codex` locali in `PATH` non
  influiscono sull'avvio normale dell'harness.
- Auth Codex disponibile per il processo app-server o per il bridge auth Codex di OpenClaw.
  Gli avvii dell'app-server locale usano una home Codex gestita da OpenClaw per ogni
  agente e un `HOME` figlio isolato, quindi per impostazione predefinita non leggono il tuo account
  personale `~/.codex`, Skills, plugin, configurazione, stato dei thread o
  `$HOME/.agents/skills` nativi.

Il plugin blocca gli handshake dell'app-server più vecchi o senza versione. Questo mantiene
OpenClaw sulla superficie di protocollo contro cui è stato testato.

Per gli smoke test live e Docker, l'auth di solito proviene dall'account CLI Codex
o da un profilo auth `openai-codex` di OpenClaw. Gli avvii locali dell'app-server stdio possono
anche ripiegare su `CODEX_API_KEY` / `OPENAI_API_KEY` quando non è presente alcun account.

## File di bootstrap del workspace

Codex gestisce `AGENTS.md` autonomamente tramite la scoperta nativa dei documenti di progetto. OpenClaw
non scrive file sintetici di documenti di progetto Codex né dipende dai nomi file fallback di Codex
per i file persona, perché i fallback di Codex si applicano solo quando
`AGENTS.md` manca.

Per la parità del workspace OpenClaw, l'harness Codex risolve gli altri file di bootstrap
(`SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`,
`BOOTSTRAP.md` e `MEMORY.md` quando presente) e li inoltra tramite le istruzioni per sviluppatori Codex
su `thread/start` e `thread/resume`. Questo mantiene
`SOUL.md` e il contesto persona/profilo del workspace correlato visibili sul canale nativo
di modellazione del comportamento Codex senza duplicare `AGENTS.md`.

## Aggiungere Codex accanto ad altri modelli

Non impostare `agentRuntime.id: "codex"` globalmente se lo stesso agente deve passare liberamente
tra Codex e modelli provider non Codex. Un runtime forzato si applica a ogni
turno incorporato per quell'agente o sessione. Se selezioni un modello Anthropic mentre
quel runtime è forzato, OpenClaw prova comunque l'harness Codex e fallisce in modo chiuso
invece di instradare silenziosamente quel turno attraverso PI.

Usa invece una di queste forme:

- Metti Codex su un agente dedicato con `agentRuntime.id: "codex"`.
- Mantieni l'agente predefinito su `agentRuntime.id: "auto"` e il fallback PI per il normale uso misto
  dei provider.
- Usa i riferimenti legacy `codex/*` solo per compatibilità. Le nuove configurazioni dovrebbero preferire
  `openai/*` più una policy runtime Codex esplicita.

Ad esempio, questo mantiene l'agente predefinito sulla normale selezione automatica e
aggiunge un agente Codex separato:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
  agents: {
    defaults: {
      agentRuntime: {
        id: "auto",
      },
    },
    list: [
      {
        id: "main",
        default: true,
        model: "anthropic/claude-opus-4-6",
      },
      {
        id: "codex",
        name: "Codex",
        model: "openai/gpt-5.5",
        agentRuntime: {
          id: "codex",
        },
      },
    ],
  },
}
```

Con questa forma:

- L'agente predefinito `main` usa il percorso provider normale e il fallback di compatibilità PI.
- L'agente `codex` usa l'harness app-server Codex.
- Se Codex manca o non è supportato per l'agente `codex`, il turno fallisce
  invece di usare PI silenziosamente.

## Instradamento dei comandi agente

Gli agenti dovrebbero instradare le richieste dell'utente in base all'intento, non solo alla parola "Codex":

| L'utente chiede di...                                  | L'agente dovrebbe usare...                       |
| ------------------------------------------------------ | ------------------------------------------------ |
| "Associa questa chat a Codex"                          | `/codex bind`                                    |
| "Riprendi qui il thread Codex `<id>`"                  | `/codex resume <id>`                             |
| "Mostra i thread Codex"                                | `/codex threads`                                 |
| "Invia una segnalazione di supporto per una cattiva esecuzione Codex" | `/diagnostics [note]`                            |
| "Invia feedback Codex solo per questo thread allegato" | `/codex diagnostics [note]`                      |
| "Usa il mio abbonamento ChatGPT/Codex con runtime Codex" | `openai/*` più `agentRuntime.id: "codex"`        |
| "Ripara vecchi pin di configurazione/sessione `openai-codex/*`" | `openclaw doctor --fix`                          |
| "Esegui Codex tramite ACP/acpx"                        | ACP `sessions_spawn({ runtime: "acp", ... })`    |
| "Avvia Claude Code/Gemini/OpenCode/Cursor in un thread" | ACP/acpx, non `/codex` e non sub-agenti nativi   |

OpenClaw pubblicizza la guida allo spawn ACP agli agenti solo quando ACP è abilitato,
instradabile e supportato da un backend runtime caricato. Se ACP non è disponibile,
il prompt di sistema e le Skills del plugin non dovrebbero insegnare all'agente l'instradamento ACP.

## Deployment solo Codex

Forza l'harness Codex quando devi dimostrare che ogni turno agente incorporato
usa Codex. I runtime Plugin espliciti falliscono in modo chiuso e non vengono mai ritentati silenziosamente
attraverso PI:

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      agentRuntime: {
        id: "codex",
      },
    },
  },
}
```

Override d'ambiente:

```bash
OPENCLAW_AGENT_RUNTIME=codex openclaw gateway run
```

Con Codex forzato, OpenClaw fallisce in anticipo se il plugin Codex è disabilitato,
l'app-server è troppo vecchio o l'app-server non può avviarsi.

## Codex per agente

Puoi rendere un agente solo Codex mentre l'agente predefinito mantiene la normale
selezione automatica:

```json5
{
  agents: {
    defaults: {
      agentRuntime: {
        id: "auto",
      },
    },
    list: [
      {
        id: "main",
        default: true,
        model: "anthropic/claude-opus-4-6",
      },
      {
        id: "codex",
        name: "Codex",
        model: "openai/gpt-5.5",
        agentRuntime: {
          id: "codex",
        },
      },
    ],
  },
}
```

Usa i normali comandi di sessione per cambiare agenti e modelli. `/new` crea una nuova
sessione OpenClaw e l'harness Codex crea o riprende il relativo thread app-server
sidecar secondo necessità. `/reset` cancella il binding della sessione OpenClaw per quel thread
e consente al turno successivo di risolvere di nuovo l'harness dalla configurazione corrente.

## Scoperta dei modelli

Per impostazione predefinita, il plugin Codex chiede all'app-server i modelli disponibili. Se
la scoperta fallisce o va in timeout, usa un catalogo fallback incluso per:

- GPT-5.5
- GPT-5.4 mini
- GPT-5.2

Puoi regolare la scoperta sotto `plugins.entries.codex.config.discovery`:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          discovery: {
            enabled: true,
            timeoutMs: 2500,
          },
        },
      },
    },
  },
}
```

Disabilita la scoperta quando vuoi che l'avvio eviti di interrogare Codex e resti al
catalogo fallback:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          discovery: {
            enabled: false,
          },
        },
      },
    },
  },
}
```

## Connessione e policy dell'app-server

Per impostazione predefinita, il plugin avvia localmente il binario Codex gestito da OpenClaw con:

```bash
codex app-server --listen stdio://
```

Il binario gestito viene distribuito con il pacchetto plugin `codex`. Questo mantiene la
versione dell'app-server legata al plugin incluso invece che a qualunque CLI Codex separata
sia installata localmente. Imposta `appServer.command` solo quando
vuoi intenzionalmente eseguire un eseguibile diverso.

Per impostazione predefinita, OpenClaw avvia le sessioni harness Codex locali in modalità YOLO:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` e
`sandbox: "danger-full-access"`. Questa è la postura operatore locale fidata usata
per heartbeat autonomi: Codex può usare strumenti shell e rete senza
fermarsi su prompt di approvazione nativi a cui nessuno è presente per rispondere.

Per aderire alle approvazioni Codex esaminate da guardian, imposta `appServer.mode:
"guardian"`:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            mode: "guardian",
            serviceTier: "fast",
          },
        },
      },
    },
  },
}
```

La modalità Guardian usa il percorso di approvazione con auto-review nativo di Codex. Quando Codex chiede di
uscire dalla sandbox, scrivere fuori dal workspace o aggiungere permessi come l'accesso di rete,
Codex instrada quella richiesta di approvazione al revisore nativo invece che a un
prompt umano. Il revisore applica il framework di rischio di Codex e approva o nega
la richiesta specifica. Usa Guardian quando vuoi più guardrail rispetto alla modalità YOLO
ma hai comunque bisogno che agenti non presidiati facciano progressi.

Il preset `guardian` si espande in `approvalPolicy: "on-request"`,
`approvalsReviewer: "auto_review"` e `sandbox: "workspace-write"`.
I singoli campi della policy sovrascrivono comunque `mode`, quindi i deployment avanzati possono combinare
il preset con scelte esplicite. Il valore revisore più vecchio `guardian_subagent` è
ancora accettato come alias di compatibilità, ma le nuove configurazioni dovrebbero usare
`auto_review`.

Per un app-server già in esecuzione, usa il trasporto WebSocket:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            transport: "websocket",
            url: "ws://127.0.0.1:39175",
            authToken: "${CODEX_APP_SERVER_TOKEN}",
            requestTimeoutMs: 60000,
          },
        },
      },
    },
  },
}
```

Gli avvii dell'app-server stdio ereditano per impostazione predefinita l'ambiente di processo di OpenClaw,
ma OpenClaw possiede il bridge dell'account app-server Codex e imposta sia
`CODEX_HOME` sia `HOME` su directory per agente sotto lo stato OpenClaw di quell'agente.
Il loader Skills proprio di Codex legge `$CODEX_HOME/skills` e
`$HOME/.agents/skills`, quindi entrambi i valori sono isolati per gli avvii locali dell'app-server.
Questo mantiene Skills, plugin, configurazione, account e stato dei thread nativi di Codex
circoscritti all'agente OpenClaw invece di lasciarli trapelare dalla home personale
della CLI Codex dell'operatore.

I plugin OpenClaw e gli snapshot Skills OpenClaw continuano a fluire attraverso il registro plugin
e il loader Skills propri di OpenClaw. Gli asset personali della CLI Codex no. Se hai
Skills o plugin CLI Codex utili che dovrebbero diventare parte di un agente OpenClaw,
inventariali esplicitamente:

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

Il provider di migrazione Codex copia le Skills nel workspace dell'agente OpenClaw corrente.
I plugin nativi Codex, gli hook e i file di configurazione vengono segnalati o archiviati
per revisione manuale invece di essere attivati automaticamente, perché possono
eseguire comandi, esporre server MCP o contenere credenziali.

L'auth viene selezionata in questo ordine:

1. Un profilo auth Codex OpenClaw esplicito per l'agente.
2. L'account esistente dell'app-server nella home Codex di quell'agente.
3. Solo per gli avvii locali dell'app-server stdio, `CODEX_API_KEY`, poi
   `OPENAI_API_KEY`, quando non è presente alcun account app-server e l'auth OpenAI è
   ancora richiesta.

Quando OpenClaw vede un profilo di autenticazione Codex in stile abbonamento ChatGPT, rimuove
`CODEX_API_KEY` e `OPENAI_API_KEY` dal processo figlio Codex generato. Questo
mantiene disponibili le chiavi API a livello Gateway per embeddings o modelli OpenAI diretti
senza far sì che i turni nativi dell'app-server Codex vengano fatturati accidentalmente tramite l'API.
I profili Codex espliciti con chiave API e il fallback locale stdio con chiave env usano il login
dell'app-server invece dell'env ereditato dal processo figlio. Le connessioni
WebSocket dell'app-server non ricevono il fallback della chiave API env del Gateway; usa un profilo
di autenticazione esplicito o l'account proprio dell'app-server remoto.

Se un deployment richiede ulteriore isolamento dell'ambiente, aggiungi quelle variabili a
`appServer.clearEnv`:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            clearEnv: ["CODEX_API_KEY", "OPENAI_API_KEY"],
          },
        },
      },
    },
  },
}
```

`appServer.clearEnv` influisce solo sul processo figlio dell'app-server Codex generato.

Gli strumenti dinamici Codex usano per impostazione predefinita il profilo `native-first`. In quella modalità,
OpenClaw non espone strumenti dinamici che duplicano le operazioni native di Codex sul workspace:
`read`, `write`, `edit`, `apply_patch`, `exec`, `process` e
`update_plan`. Gli strumenti di integrazione OpenClaw come messaggistica, sessioni, media,
cron, browser, nodi, gateway, `heartbeat_respond` e `web_search` restano
disponibili.

Campi Codex Plugin di primo livello supportati:

| Campo                      | Predefinito     | Significato                                                                                   |
| -------------------------- | --------------- | --------------------------------------------------------------------------------------------- |
| `codexDynamicToolsProfile` | `"native-first"` | Usa `"openclaw-compat"` per esporre all'app-server Codex l'intero set di strumenti dinamici OpenClaw. |
| `codexDynamicToolsExclude` | `[]`             | Nomi aggiuntivi di strumenti dinamici OpenClaw da omettere dai turni dell'app-server Codex.               |

Campi `appServer` supportati:

| Campo               | Predefinito                             | Significato                                                                                                                                                                                                                              |
| ------------------- | -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`         | `"stdio"`                              | `"stdio"` genera Codex; `"websocket"` si connette a `url`.                                                                                                                                                                             |
| `command`           | binario Codex gestito                  | Eseguibile per il trasporto stdio. Lascialo non impostato per usare il binario gestito; impostalo solo per un override esplicito.                                                                                                                         |
| `args`              | `["app-server", "--listen", "stdio://"]` | Argomenti per il trasporto stdio.                                                                                                                                                                                                       |
| `url`               | non impostato                          | URL WebSocket dell'app-server.                                                                                                                                                                                                            |
| `authToken`         | non impostato                          | Token Bearer per il trasporto WebSocket.                                                                                                                                                                                                |
| `headers`           | `{}`                                   | Header WebSocket aggiuntivi.                                                                                                                                                                                                             |
| `clearEnv`          | `[]`                                   | Nomi di variabili d'ambiente aggiuntive rimossi dal processo app-server stdio generato dopo che OpenClaw ha costruito il suo ambiente ereditato. `CODEX_HOME` e `HOME` sono riservati all'isolamento Codex per agente di OpenClaw negli avvii locali. |
| `requestTimeoutMs`  | `60000`                                | Timeout per le chiamate control-plane dell'app-server.                                                                                                                                                                                          |
| `mode`              | `"yolo"`                               | Preset per esecuzione YOLO o revisionata dal guardian.                                                                                                                                                                                      |
| `approvalPolicy`    | `"never"`                              | Criterio di approvazione nativo Codex inviato ad avvio/ripresa/turno del thread.                                                                                                                                                                       |
| `sandbox`           | `"danger-full-access"`                 | Modalità sandbox nativa Codex inviata ad avvio/ripresa del thread.                                                                                                                                                                               |
| `approvalsReviewer` | `"user"`                               | Usa `"auto_review"` per consentire a Codex di revisionare i prompt di approvazione nativi. `guardian_subagent` resta un alias legacy.                                                                                                                         |
| `serviceTier`       | non impostato                          | Tier di servizio opzionale dell'app-server Codex: `"fast"`, `"flex"` o `null`. I valori legacy non validi vengono ignorati.                                                                                                                            |

Le chiamate agli strumenti dinamici di proprietà OpenClaw sono limitate indipendentemente da
`appServer.requestTimeoutMs`: ogni richiesta Codex `item/tool/call` deve ricevere
una risposta OpenClaw entro 30 secondi. Al timeout, OpenClaw interrompe il segnale dello strumento
dove supportato e restituisce a Codex una risposta di strumento dinamico non riuscita, così
il turno può continuare invece di lasciare la sessione in `processing`.

Dopo che OpenClaw risponde a una richiesta app-server con ambito di turno Codex, anche l'harness
si aspetta che Codex finisca il turno nativo con `turn/completed`. Se l'app-server
rimane silenzioso per 60 secondi dopo quella risposta, OpenClaw interrompe il turno Codex
con il massimo impegno, registra un timeout diagnostico e libera la corsia di sessione
OpenClaw così i messaggi chat successivi non restano in coda dietro un turno nativo
stale.

Gli override d'ambiente restano disponibili per i test locali:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN` bypassa il binario gestito quando
`appServer.command` non è impostato.

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` è stato rimosso. Usa invece
`plugins.entries.codex.config.appServer.mode: "guardian"` oppure
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` per test locali occasionali. La configurazione è
preferibile per deployment ripetibili perché mantiene il comportamento del Plugin nello
stesso file revisionato del resto della configurazione dell'harness Codex.

## Uso del computer

L'Uso del computer è trattato nella propria guida di configurazione:
[Uso del computer Codex](/it/plugins/codex-computer-use).

La versione breve: OpenClaw non include come vendor l'app di controllo desktop né esegue
azioni desktop direttamente. Prepara l'app-server Codex, verifica che il server MCP
`computer-use` sia disponibile e poi lascia che Codex gestisca le chiamate agli strumenti MCP
nativi durante i turni in modalità Codex.

Per l'accesso diretto al driver TryCua fuori dal flusso del marketplace Codex, registra
`cua-driver mcp` con `openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'`.
Consulta [Uso del computer Codex](/it/plugins/codex-computer-use) per la distinzione
tra Uso del computer di proprietà Codex e registrazione MCP diretta.

Configurazione minima:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          computerUse: {
            autoInstall: true,
          },
        },
      },
    },
  },
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      agentRuntime: {
        id: "codex",
      },
    },
  },
}
```

La configurazione può essere controllata o installata dalla superficie dei comandi:

- `/codex computer-use status`
- `/codex computer-use install`
- `/codex computer-use install --source <marketplace-source>`
- `/codex computer-use install --marketplace-path <path>`

L'Uso del computer è specifico di macOS e può richiedere permessi locali del sistema operativo prima che il
server MCP Codex possa controllare le app. Se `computerUse.enabled` è true e il server MCP
non è disponibile, i turni in modalità Codex falliscono prima dell'avvio del thread invece di
essere eseguiti silenziosamente senza gli strumenti nativi di Uso del computer. Consulta
[Uso del computer Codex](/it/plugins/codex-computer-use) per le scelte del marketplace,
i limiti del catalogo remoto, i motivi di stato e la risoluzione dei problemi.

Quando `computerUse.autoInstall` è true, OpenClaw può registrare il marketplace standard
Codex Desktop in bundle da
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` se Codex
non ha ancora scoperto un marketplace locale. Usa `/new` o `/reset` dopo
aver modificato la configurazione di runtime o Uso del computer, così le sessioni esistenti non mantengono un vecchio
binding di thread PI o Codex.

## Ricette comuni

Codex locale con trasporto stdio predefinito:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
}
```

Validazione dell'harness solo Codex:

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      agentRuntime: {
        id: "codex",
      },
    },
  },
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
}
```

Approvazioni Codex revisionate dal guardian:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            mode: "guardian",
            approvalPolicy: "on-request",
            approvalsReviewer: "auto_review",
            sandbox: "workspace-write",
          },
        },
      },
    },
  },
}
```

App-server remoto con header espliciti:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            transport: "websocket",
            url: "ws://gateway-host:39175",
            headers: {
              "X-OpenClaw-Agent": "main",
            },
          },
        },
      },
    },
  },
}
```

Il cambio di modello resta controllato da OpenClaw. Quando una sessione OpenClaw è collegata
a un thread Codex esistente, il turno successivo invia di nuovo all'app-server
il modello OpenAI, il provider, il criterio di approvazione, la sandbox e il tier di servizio
attualmente selezionati. Passare da `openai/gpt-5.5` a `openai/gpt-5.2` mantiene il
binding del thread ma chiede a Codex di continuare con il modello appena selezionato.

## Comando Codex

Il Plugin in bundle registra `/codex` come comando slash autorizzato. È
generico e funziona su qualsiasi canale che supporta i comandi testuali OpenClaw.

Forme comuni:

- `/codex status` mostra la connettività live del server dell'app, i modelli, l'account, i limiti di frequenza, i server MCP e le Skills.
- `/codex models` elenca i modelli live del server dell'app Codex.
- `/codex threads [filter]` elenca i thread Codex recenti.
- `/codex resume <thread-id>` collega la sessione OpenClaw corrente a un thread Codex esistente.
- `/codex compact` chiede al server dell'app Codex di compattare il thread collegato.
- `/codex review` avvia la revisione nativa di Codex per il thread collegato.
- `/codex diagnostics [note]` chiede conferma prima di inviare il feedback diagnostico Codex per il thread collegato.
- `/codex computer-use status` controlla il Plugin Computer Use configurato e il server MCP.
- `/codex computer-use install` installa il Plugin Computer Use configurato e ricarica i server MCP.
- `/codex account` mostra lo stato dell'account e dei limiti di frequenza.
- `/codex mcp` elenca lo stato dei server MCP del server dell'app Codex.
- `/codex skills` elenca le Skills del server dell'app Codex.

Quando Codex segnala un errore per limite di utilizzo, OpenClaw include il successivo
orario di reimpostazione del server dell'app quando Codex ne ha fornito uno. Usa `/codex account` nella stessa
conversazione per ispezionare l'account corrente e le finestre dei limiti di frequenza.

### Flusso di debug comune

Quando un agente basato su Codex fa qualcosa di inatteso in Telegram, Discord, Slack
o in un altro canale, inizia dalla conversazione in cui si è verificato il problema:

1. Esegui `/diagnostics bad tool choice after image upload` o un'altra breve nota
   che descriva ciò che hai visto.
2. Approva una volta la richiesta di diagnostica. L'approvazione crea lo zip di diagnostica del Gateway
   locale e, poiché la sessione usa l'harness Codex, invia anche
   il bundle di feedback Codex pertinente ai server OpenAI.
3. Copia la risposta di diagnostica completata nella segnalazione di bug o nel thread di supporto.
   Include il percorso del bundle locale, il riepilogo della privacy, gli id di sessione OpenClaw,
   gli id dei thread Codex e una riga `Inspect locally` per ciascun thread Codex.
4. Se vuoi eseguire il debug della run autonomamente, esegui il comando `Inspect locally`
   stampato in un terminale. Ha un aspetto simile a `codex resume <thread-id>` e apre il
   thread Codex nativo, così puoi ispezionare la conversazione, continuarla localmente
   o chiedere a Codex perché ha scelto un particolare strumento o piano.

Usa `/codex diagnostics [note]` solo quando vuoi specificamente il caricamento del
feedback Codex per il thread attualmente collegato senza il bundle completo di diagnostica del
Gateway OpenClaw. Per la maggior parte delle segnalazioni di supporto, `/diagnostics [note]` è
il punto di partenza migliore perché collega lo stato del Gateway locale e gli id dei
thread Codex in un'unica risposta. Vedi [Esportazione diagnostica](/it/gateway/diagnostics)
per il modello completo di privacy e il comportamento nelle chat di gruppo.

Il core OpenClaw espone anche `/diagnostics [note]` riservato agli owner come comando generale
di diagnostica del Gateway. Il suo prompt di approvazione mostra il preambolo sui dati sensibili,
collega a [Esportazione diagnostica](/it/gateway/diagnostics) e richiede
`openclaw gateway diagnostics export --json` tramite approvazione exec esplicita
ogni volta. Non approvare la diagnostica con una regola allow-all. Dopo l'approvazione,
OpenClaw invia un report incollabile con il percorso del bundle locale e il riepilogo
del manifesto. Quando la sessione OpenClaw attiva usa l'harness Codex, quella
stessa approvazione autorizza anche l'invio dei bundle di feedback Codex pertinenti ai
server OpenAI. Il prompt di approvazione indica che il feedback Codex verrà inviato, ma
non elenca gli id di sessione o di thread Codex prima dell'approvazione.

Se `/diagnostics` viene invocato da un owner in una chat di gruppo, OpenClaw mantiene pulito il
canale condiviso: il gruppo riceve solo un breve avviso, mentre il
preambolo diagnostico, i prompt di approvazione e gli id di sessione/thread Codex vengono inviati
all'owner tramite la rotta di approvazione privata. Se non esiste una rotta privata per l'owner,
OpenClaw rifiuta la richiesta del gruppo e chiede all'owner di eseguirla da un DM.

Il caricamento Codex approvato chiama `feedback/upload` del server dell'app Codex e chiede
al server dell'app di includere i log per ciascun thread elencato e per i sottothread Codex generati
quando disponibili. Il caricamento passa attraverso il normale percorso di feedback di Codex verso i server
OpenAI; se il feedback Codex è disabilitato in quel server dell'app, il comando restituisce
l'errore del server dell'app. La risposta di diagnostica completata elenca i canali,
gli id di sessione OpenClaw, gli id dei thread Codex e i comandi locali `codex resume <thread-id>`
per i thread inviati. Se neghi o ignori l'approvazione,
OpenClaw non stampa quegli id Codex. Questo caricamento non sostituisce l'esportazione di diagnostica
del Gateway locale.

`/codex resume` scrive lo stesso file di binding sidecar che l'harness usa per
i turni normali. Al messaggio successivo, OpenClaw riprende quel thread Codex, passa il
modello OpenClaw attualmente selezionato al server dell'app e mantiene abilitata la cronologia estesa.

### Ispezionare un thread Codex dalla CLI

Il modo più rapido per comprendere una run Codex errata è spesso aprire direttamente il thread
Codex nativo:

```sh
codex resume <thread-id>
```

Usalo quando noti un bug in una conversazione di canale e vuoi ispezionare la
sessione Codex problematica, continuarla localmente o chiedere a Codex perché ha fatto una
particolare scelta di strumento o di ragionamento. Il percorso più semplice di solito è eseguire
prima `/diagnostics [note]`: dopo averlo approvato, il report completato elenca
ogni thread Codex e stampa un comando `Inspect locally`, per esempio
`codex resume <thread-id>`. Puoi copiare quel comando direttamente in un terminale.

Puoi anche ottenere un id di thread da `/codex binding` per la chat corrente o
`/codex threads [filter]` per i thread recenti del server dell'app Codex, quindi eseguire lo stesso
comando `codex resume` nella tua shell.

La superficie dei comandi richiede il server dell'app Codex `0.125.0` o più recente. I singoli
metodi di controllo vengono segnalati come `unsupported by this Codex app-server` se un
server dell'app futuro o personalizzato non espone quel metodo JSON-RPC.

## Confini degli hook

L'harness Codex ha tre livelli di hook:

| Livello                               | Owner                    | Scopo                                                               |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| Hook dei plugin OpenClaw              | OpenClaw                 | Compatibilità prodotto/plugin tra harness PI e Codex.               |
| Middleware di estensione del server dell'app Codex | Plugin inclusi in OpenClaw | Comportamento adattatore per turno attorno agli strumenti dinamici OpenClaw. |
| Hook nativi Codex                     | Codex                    | Ciclo di vita Codex di basso livello e policy degli strumenti nativi dalla configurazione Codex. |

OpenClaw non usa file Codex `hooks.json` di progetto o globali per instradare
il comportamento dei plugin OpenClaw. Per il bridge supportato di strumenti nativi e permessi,
OpenClaw inietta una configurazione Codex per thread per `PreToolUse`, `PostToolUse`,
`PermissionRequest` e `Stop`. Quando le approvazioni del server dell'app Codex sono abilitate
(`approvalPolicy` non è `"never"`), la configurazione predefinita degli hook nativi iniettati
omette `PermissionRequest`, così il revisore del server dell'app Codex e il bridge di approvazione
di OpenClaw gestiscono le escalation reali dopo la revisione. Gli operatori possono comunque aggiungere
esplicitamente `permission_request` a `nativeHookRelay.events` quando serve il relay di compatibilità.
Altri hook Codex come `SessionStart` e `UserPromptSubmit` restano
controlli a livello Codex; non sono esposti come hook dei plugin OpenClaw nel contratto v1.

Per gli strumenti dinamici OpenClaw, OpenClaw esegue lo strumento dopo che Codex ha richiesto la
chiamata, quindi OpenClaw attiva il comportamento di plugin e middleware che possiede nell'
adattatore dell'harness. Per gli strumenti nativi di Codex, Codex possiede il record canonico dello strumento.
OpenClaw può rispecchiare eventi selezionati, ma non può riscrivere il thread Codex
nativo a meno che Codex non esponga quell'operazione tramite server dell'app o callback di hook nativi.

Le proiezioni di Compaction e del ciclo di vita LLM provengono dalle notifiche del server dell'app Codex
e dallo stato dell'adattatore OpenClaw, non dai comandi degli hook nativi Codex.
Gli eventi `before_compaction`, `after_compaction`, `llm_input` e
`llm_output` di OpenClaw sono osservazioni a livello di adattatore, non acquisizioni byte per byte
delle richieste interne o dei payload di compaction di Codex.

Le notifiche del server dell'app Codex `hook/started` e `hook/completed` nativi di Codex
sono proiettate come eventi agente `codex_app_server.hook` per traiettoria e debug.
Non invocano gli hook dei plugin OpenClaw.

## Contratto di supporto v1

La modalità Codex non è PI con una diversa chiamata al modello sottostante. Codex possiede una parte maggiore
del loop nativo del modello, e OpenClaw adatta le sue superfici di plugin e sessione
attorno a quel confine.

Supportato nel runtime Codex v1:

| Superficie                                    | Supporto                                                                            | Motivo                                                                                                                                                                                                     |
| --------------------------------------------- | ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Loop modello OpenAI tramite Codex             | Supportato                                                                          | Il server app Codex possiede il turno OpenAI, la ripresa nativa del thread e la continuazione nativa degli strumenti.                                                                                      |
| Routing e consegna dei canali OpenClaw        | Supportato                                                                          | Telegram, Discord, Slack, WhatsApp, iMessage e altri canali restano fuori dal runtime del modello.                                                                                                         |
| Strumenti dinamici OpenClaw                   | Supportato                                                                          | Codex chiede a OpenClaw di eseguire questi strumenti, quindi OpenClaw resta nel percorso di esecuzione.                                                                                                     |
| Plugin di prompt e contesto                   | Supportato                                                                          | OpenClaw crea overlay di prompt e proietta il contesto nel turno Codex prima di avviare o riprendere il thread.                                                                                            |
| Ciclo di vita del motore di contesto          | Supportato                                                                          | Assemblaggio, ingestione o manutenzione dopo il turno, e coordinamento della compaction del motore di contesto vengono eseguiti per i turni Codex.                                                        |
| Hook degli strumenti dinamici                 | Supportato                                                                          | `before_tool_call`, `after_tool_call` e il middleware dei risultati degli strumenti vengono eseguiti attorno agli strumenti dinamici di proprietà di OpenClaw.                                             |
| Hook del ciclo di vita                        | Supportato come osservazioni dell'adattatore                                        | `llm_input`, `llm_output`, `agent_end`, `before_compaction` e `after_compaction` vengono attivati con payload onesti in modalità Codex.                                                                    |
| Gate di revisione della risposta finale       | Supportato tramite il relay degli hook nativi                                       | Codex `Stop` viene inoltrato a `before_agent_finalize`; `revise` chiede a Codex un ulteriore passaggio del modello prima della finalizzazione.                                                             |
| Shell, patch e MCP nativi: blocco o osservazione | Supportato tramite il relay degli hook nativi                                    | Codex `PreToolUse` e `PostToolUse` vengono inoltrati per le superfici degli strumenti nativi impegnate, inclusi i payload MCP su server app Codex `0.125.0` o più recente. Il blocco è supportato; la riscrittura degli argomenti no. |
| Criterio di autorizzazione nativo             | Supportato tramite approvazioni del server app Codex e il relay compatibile degli hook nativi | Le richieste di approvazione del server app Codex passano attraverso OpenClaw dopo la revisione Codex. Il relay dell'hook nativo `PermissionRequest` è opt-in per le modalità di approvazione native perché Codex lo emette prima della revisione guardian. |
| Acquisizione della traiettoria del server app | Supportato                                                                          | OpenClaw registra la richiesta inviata al server app e le notifiche del server app ricevute.                                                                                                               |

Non supportato nel runtime Codex v1:

| Superficie                                           | Confine V1                                                                                                                                      | Percorso futuro                                                                            |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Mutazione degli argomenti degli strumenti nativi    | Gli hook pre-strumento nativi di Codex possono bloccare, ma OpenClaw non riscrive gli argomenti degli strumenti nativi Codex.                   | Richiede supporto Codex di hook/schema per sostituire l'input dello strumento.            |
| Cronologia modificabile del transcript nativo Codex | Codex possiede la cronologia nativa canonica del thread. OpenClaw possiede una copia speculare e può proiettare contesto futuro, ma non dovrebbe mutare internals non supportati. | Aggiungere API esplicite del server app Codex se serve chirurgia sul thread nativo.       |
| `tool_result_persist` per record di strumenti nativi Codex | Quell'hook trasforma scritture di transcript di proprietà di OpenClaw, non record di strumenti nativi Codex.                                    | Potrebbe creare copie speculari dei record trasformati, ma la riscrittura canonica richiede supporto Codex. |
| Metadati ricchi di compaction nativa                | OpenClaw osserva l'avvio e il completamento della compaction, ma non riceve una lista stabile di elementi mantenuti/scartati, delta di token o payload di riepilogo. | Richiede eventi di compaction Codex più ricchi.                                           |
| Intervento sulla Compaction                         | Gli hook di compaction OpenClaw attuali sono a livello di notifica in modalità Codex.                                                           | Aggiungere hook Codex pre/post compaction se i plugin devono porre veto o riscrivere la compaction nativa. |
| Acquisizione byte per byte della richiesta API del modello | OpenClaw può acquisire richieste e notifiche del server app, ma il core Codex costruisce internamente la richiesta API OpenAI finale.            | Richiede un evento di tracing della richiesta modello Codex o un'API di debug.            |

## Strumenti, media e compaction

L'harness Codex cambia solo l'esecutore agente incorporato di basso livello.

OpenClaw continua a costruire l'elenco degli strumenti e riceve i risultati degli strumenti dinamici dall'harness. Testo, immagini, video, musica, TTS, approvazioni e output degli strumenti di messaggistica continuano attraverso il normale percorso di consegna OpenClaw.

Il relay degli hook nativi è intenzionalmente generico, ma il contratto di supporto v1 è limitato ai percorsi degli strumenti nativi Codex e delle autorizzazioni che OpenClaw testa. Nel runtime Codex, questo include payload shell, patch e MCP `PreToolUse`, `PostToolUse` e `PermissionRequest`. Non dare per scontato che ogni futuro evento hook Codex sia una superficie plugin OpenClaw finché il contratto runtime non lo nomina.

Per `PermissionRequest`, OpenClaw restituisce solo decisioni esplicite di consenti o nega quando il criterio decide. Un risultato senza decisione non è un consenti. Codex lo tratta come nessuna decisione dell'hook e passa al proprio percorso guardian o di approvazione utente. Le modalità di approvazione del server app Codex omettono questo hook nativo per impostazione predefinita; questo paragrafo si applica quando `permission_request` è incluso esplicitamente in `nativeHookRelay.events` o un runtime di compatibilità lo installa.
Quando un operatore sceglie `allow-always` per una richiesta di autorizzazione nativa Codex, OpenClaw ricorda quell'esatta impronta provider/sessione/input strumento/cwd per una finestra di sessione delimitata. La decisione ricordata è intenzionalmente solo a corrispondenza esatta: un comando, argomenti, payload strumento o cwd cambiato crea una nuova approvazione.

Le elicitazioni di approvazione degli strumenti MCP Codex vengono instradate attraverso il flusso di approvazione plugin di OpenClaw quando Codex marca `_meta.codex_approval_kind` come `"mcp_tool_call"`. I prompt Codex `request_user_input` vengono rimandati alla chat di origine, e il successivo messaggio di follow-up in coda risponde a quella richiesta del server nativo invece di essere guidato come contesto extra. Le altre richieste di elicitazione MCP continuano a fallire chiuse.

Lo steering della coda di esecuzione attiva mappa su `turn/steer` del server app Codex. Con il valore predefinito `messages.queue.mode: "steer"`, OpenClaw raggruppa i messaggi chat in coda per la finestra di quiete configurata e li invia come un'unica richiesta `turn/steer` in ordine di arrivo. La modalità legacy `queue` invia richieste `turn/steer` separate. I turni di revisione Codex e compaction manuale possono rifiutare lo steering nello stesso turno, nel qual caso OpenClaw usa la coda di follow-up quando la modalità selezionata consente il fallback. Vedi [Coda di steering](/it/concepts/queue-steering).

Quando il modello selezionato usa l'harness Codex, la compaction nativa del thread viene delegata al server app Codex. OpenClaw mantiene una copia speculare del transcript per cronologia del canale, ricerca, `/new`, `/reset` e futuri cambi di modello o harness. La copia include il prompt utente, il testo finale dell'assistente e record leggeri di ragionamento o piano Codex quando il server app li emette. Oggi OpenClaw registra solo segnali di avvio e completamento della compaction nativa. Non espone ancora un riepilogo della compaction leggibile da una persona o una lista verificabile di quali voci Codex ha mantenuto dopo la compaction.

Poiché Codex possiede il thread nativo canonico, `tool_result_persist` attualmente non riscrive i record di risultati degli strumenti nativi Codex. Si applica solo quando OpenClaw sta scrivendo un risultato di strumento nel transcript di una sessione di proprietà di OpenClaw.

La generazione di media non richiede PI. Immagini, video, musica, PDF, TTS e comprensione dei media continuano a usare le impostazioni provider/modello corrispondenti, come `agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel` e `messages.tts`.

## Risoluzione dei problemi

**Codex non appare come normale provider `/model`:** questo è previsto per le nuove configurazioni. Seleziona un modello `openai/gpt-*` con `agentRuntime.id: "codex"` (o un ref legacy `codex/*`), abilita `plugins.entries.codex.enabled` e controlla se `plugins.allow` esclude `codex`.

**OpenClaw usa PI invece di Codex:** `agentRuntime.id: "auto"` può ancora usare PI come backend di compatibilità quando nessun harness Codex rivendica l'esecuzione. Imposta `agentRuntime.id: "codex"` per forzare la selezione di Codex durante i test. Un runtime Codex forzato fallisce invece di ricadere su PI. Una volta selezionato il server app Codex, i suoi errori emergono direttamente.

**Il server app viene rifiutato:** aggiorna Codex affinché l'handshake del server app riporti la versione `0.125.0` o più recente. Prerelease della stessa versione o versioni con suffisso di build come `0.125.0-alpha.2` o `0.125.0+custom` vengono rifiutate perché il livello minimo del protocollo stabile `0.125.0` è ciò che OpenClaw testa.

**La scoperta dei modelli è lenta:** riduci `plugins.entries.codex.config.discovery.timeoutMs` o disabilita la scoperta.

**Il trasporto WebSocket fallisce immediatamente:** controlla `appServer.url`, `authToken` e che il server app remoto parli la stessa versione del protocollo server app Codex.

**Un modello non Codex usa PI:** questo è previsto a meno che tu non abbia forzato `agentRuntime.id: "codex"` per quell'agente o selezionato un ref legacy `codex/*`. I semplici ref `openai/gpt-*` e altri ref provider restano sul loro normale percorso provider in modalità `auto`. Se forzi `agentRuntime.id: "codex"`, ogni turno incorporato per quell'agente deve essere un modello OpenAI supportato da Codex.

**Computer Use è installato ma gli strumenti non vengono eseguiti:** controlla
`/codex computer-use status` da una sessione nuova. Se uno strumento segnala
`Native hook relay unavailable`, usa `/new` o `/reset`; se il problema persiste, riavvia
il Gateway per eliminare le registrazioni native hook obsolete. Se `computer-use.list_apps`
va in timeout, riavvia Codex Computer Use o Codex Desktop e riprova.

## Correlati

- [Plugin harness agent](/it/plugins/sdk-agent-harness)
- [Runtime degli agenti](/it/concepts/agent-runtimes)
- [Provider di modelli](/it/concepts/model-providers)
- [Provider OpenAI](/it/providers/openai)
- [Stato](/it/cli/status)
- [Hook dei Plugin](/it/plugins/hooks)
- [Riferimento alla configurazione](/it/gateway/configuration-reference)
- [Test](/it/help/testing-live#live-codex-app-server-harness-smoke)
