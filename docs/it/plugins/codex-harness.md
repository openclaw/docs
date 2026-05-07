---
read_when:
    - Vuoi usare l'harness app-server Codex incluso
    - Hai bisogno di esempi di configurazione dell'harness di Codex
    - Vuoi che le distribuzioni solo Codex falliscano invece di ripiegare su Pi
summary: Esegui i turni dell'agente incorporato di OpenClaw tramite la struttura app-server Codex inclusa
title: Ambiente di esecuzione di Codex
x-i18n:
    generated_at: "2026-05-07T13:22:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9bc5e78b1c6737dad7037ef77cfa9f16d480f02671363591509696d232e2d52e
    source_path: plugins/codex-harness.md
    workflow: 16
---

Il plugin `codex` incluso consente a OpenClaw di eseguire turni agent incorporati tramite il
server applicativo Codex invece dell'harness PI integrato.

Usalo quando vuoi che Codex gestisca la sessione agent di basso livello: rilevamento
dei modelli, ripresa nativa dei thread, Compaction nativa ed esecuzione del server applicativo.
OpenClaw continua a gestire canali chat, file di sessione, selezione del modello, strumenti,
approvazioni, consegna dei media e il mirror visibile della trascrizione.

Quando un turno di chat sorgente viene eseguito tramite l'harness Codex, le risposte visibili usano per impostazione predefinita
lo strumento `message` di OpenClaw se il deployment non ha configurato esplicitamente
`messages.visibleReplies`. L'agent può comunque completare privatamente il proprio turno Codex;
pubblica sul canale solo quando chiama `message(action="send")`. Imposta
`messages.visibleReplies: "automatic"` per mantenere le risposte finali delle chat dirette nel
percorso di consegna automatico legacy.

Anche i turni Heartbeat di Codex ricevono per impostazione predefinita lo strumento `heartbeat_respond`, così
l'agent può registrare se il risveglio deve restare silenzioso o inviare una notifica senza codificare
quel flusso di controllo nel testo finale.

La guida di iniziativa specifica per Heartbeat viene inviata come istruzione developer in modalità collaborazione
di Codex nel turno Heartbeat stesso. I turni chat ordinari ripristinano
la modalità predefinita di Codex invece di portare la filosofia Heartbeat nel loro normale
prompt runtime.

Se stai cercando di orientarti, inizia da
[Runtime agent](/it/concepts/agent-runtimes). In breve:
`openai/gpt-5.5` è il riferimento del modello, `codex` è il runtime, e Telegram,
Discord, Slack o un altro canale resta la superficie di comunicazione.

## Configurazione rapida

La maggior parte degli utenti che vuole "Codex in OpenClaw" vuole questo percorso: accedere con un
abbonamento ChatGPT/Codex, quindi eseguire turni agent incorporati tramite il runtime nativo
del server applicativo Codex. Il riferimento del modello resta comunque canonico come
`openai/gpt-*`; l'autenticazione dell'abbonamento arriva dall'account/profilo Codex, non
da un prefisso modello `openai-codex/*`.

Prima accedi con Codex OAuth se non lo hai già fatto:

```bash
openclaw models auth login --provider openai-codex
```

Poi abilita il plugin `codex` incluso e forza il runtime Codex:

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
`openclaw doctor --fix` riscrive in `openai/gpt-*` tra modelli primari,
fallback, override di Heartbeat/subagent/Compaction, hook, override di canale
e vecchi pin di percorso delle sessioni persistenti.

## Cosa cambia questo plugin

Il plugin `codex` incluso fornisce diverse capacità separate:

| Capacità                          | Come lo usi                                        | Cosa fa                                                                        |
| --------------------------------- | -------------------------------------------------- | ------------------------------------------------------------------------------ |
| Runtime incorporato nativo        | `agentRuntime.id: "codex"`                         | Esegue i turni agent incorporati di OpenClaw tramite il server applicativo Codex. |
| Comandi nativi di controllo chat  | `/codex bind`, `/codex resume`, `/codex steer`, ... | Collega e controlla i thread del server applicativo Codex da una conversazione di messaggistica. |
| Provider/catalogo del server applicativo Codex | Interni `codex`, esposti tramite l'harness | Consente al runtime di rilevare e validare i modelli del server applicativo. |
| Percorso di comprensione media Codex | Percorsi di compatibilità dei modelli immagine `codex/*` | Esegue turni limitati del server applicativo Codex per modelli di comprensione immagini supportati. |
| Relay hook nativo                 | Hook Plugin intorno agli eventi nativi Codex       | Consente a OpenClaw di osservare/bloccare eventi nativi Codex supportati di strumenti/finalizzazione. |

Abilitare il plugin rende disponibili queste capacità. **Non**:

- sostituisce le superfici con chiave API OpenAI dirette come immagini, embedding, voce o
  realtime
- converte riferimenti modello `openai-codex/*` senza `openclaw doctor --fix`
- rende ACP/acpx il percorso Codex predefinito
- cambia a caldo le sessioni esistenti che hanno già registrato un runtime PI
- sostituisce consegna dei canali OpenClaw, file di sessione, archiviazione dei profili di autenticazione o
  instradamento dei messaggi

Lo stesso plugin possiede anche la superficie di comandi nativa `/codex` per il controllo chat. Se
il plugin è abilitato e l'utente chiede di collegare, riprendere, guidare, interrompere o ispezionare
thread Codex dalla chat, gli agent dovrebbero preferire `/codex ...` ad ACP. ACP resta
il fallback esplicito quando l'utente chiede ACP/acpx o sta testando l'adapter ACP
di Codex.

I turni Codex nativi mantengono gli hook Plugin di OpenClaw come livello pubblico di compatibilità.
Questi sono hook OpenClaw in-process, non hook di comando Codex `hooks.json`:

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `before_tool_call`, `after_tool_call`
- `before_message_write` per i record di trascrizione mirror
- `before_agent_finalize` tramite relay Codex `Stop`
- `agent_end`

I plugin possono anche registrare middleware di risultato strumento neutrale rispetto al runtime per riscrivere
i risultati degli strumenti dinamici OpenClaw dopo che OpenClaw esegue lo strumento e prima che il
risultato venga restituito a Codex. Questo è separato dall'hook Plugin pubblico
`tool_result_persist`, che trasforma le scritture dei risultati strumento della trascrizione
di proprietà di OpenClaw.

Per la semantica degli hook Plugin, vedi [Hook Plugin](/it/plugins/hooks)
e [Comportamento delle guardie Plugin](/it/tools/plugin).

I riferimenti modello agent OpenAI usano l'harness per impostazione predefinita. Le nuove configurazioni dovrebbero mantenere
i riferimenti modello OpenAI canonici come `openai/gpt-*`; `agentRuntime.id: "codex"` è
ancora valido ma non più necessario per i turni agent OpenAI. I riferimenti modello legacy `codex/*`
selezionano ancora automaticamente l'harness per compatibilità, ma
i prefissi provider legacy supportati dal runtime non vengono mostrati come normali scelte modello/provider.

Se un percorso modello configurato è ancora `openai-codex/*`, `openclaw doctor --fix`
lo riscrive in `openai/*`. Per i percorsi agent corrispondenti, imposta il runtime agent
su `codex` e preserva gli override esistenti del profilo di autenticazione `openai-codex`.

## Mappa dei percorsi

Usa questa tabella prima di modificare la configurazione:

| Comportamento desiderato                           | Riferimento modello       | Configurazione runtime                  | Percorso auth/profilo          | Etichetta stato attesa       |
| -------------------------------------------------- | ------------------------- | --------------------------------------- | ------------------------------ | ---------------------------- |
| Abbonamento ChatGPT/Codex con runtime Codex nativo | `openai/gpt-*`            | omesso o `agentRuntime.id: "codex"`     | Codex OAuth o account Codex    | `Runtime: OpenAI Codex`      |
| Autenticazione con chiave API OpenAI per modelli agent | `openai/gpt-*`        | omesso o `agentRuntime.id: "codex"`     | Profilo chiave API `openai-codex` | `Runtime: OpenAI Codex`   |
| Configurazione legacy che richiede riparazione con doctor | `openai-codex/gpt-*` | riparato in `codex`                     | Autenticazione configurata esistente | Ricontrolla dopo `doctor --fix` |
| Provider misti con modalità automatica conservativa | riferimenti specifici per provider | `agentRuntime.id: "auto"`         | Per provider selezionato       | Dipende dal runtime selezionato |
| Sessione adapter Codex ACP esplicita               | dipendente da prompt/modello ACP | `sessions_spawn` con `runtime: "acp"` | Autenticazione backend ACP     | Stato attività/sessione ACP  |

La distinzione importante è provider rispetto a runtime:

- `openai-codex/*` è un percorso legacy che doctor riscrive.
- `agentRuntime.id: "codex"` richiede l'harness Codex e fallisce in modo chiuso se
  non è disponibile.
- `agentRuntime.id: "auto"` consente agli harness registrati di rivendicare percorsi provider
  corrispondenti; i riferimenti agent OpenAI si risolvono su Codex invece che su PI.
- `/codex ...` risponde a "a quale conversazione nativa Codex deve collegarsi
  o quale deve controllare questa chat?"
- ACP risponde a "quale processo harness esterno deve avviare acpx?"

## Scegli il prefisso modello corretto

I percorsi della famiglia OpenAI sono specifici per prefisso. Per la configurazione comune con abbonamento più
runtime Codex nativo, usa `openai/*`.
Tratta `openai-codex/*` come configurazione legacy che doctor dovrebbe riscrivere:

| Riferimento modello                              | Percorso runtime                         | Quando usarlo                                                     |
| ------------------------------------------------ | ---------------------------------------- | ----------------------------------------------------------------- |
| `openai/gpt-5.4`                                 | Harness server applicativo Codex per turni agent | Vuoi modelli agent OpenAI tramite Codex.                 |
| `openai-codex/gpt-5.5`                           | Percorso legacy riparato da doctor       | Sei su una vecchia configurazione; esegui `openclaw doctor --fix` per riscriverlo. |
| `openai/gpt-5.5` + profilo chiave API `openai-codex` | Harness server applicativo Codex    | Vuoi autenticazione con chiave API per un modello agent OpenAI.   |

GPT-5.5 può comparire sia nei percorsi con chiave API OpenAI diretta sia in quelli con abbonamento Codex
quando il tuo account li espone. Usa `openai/gpt-5.5` con l'harness del server applicativo Codex
per il runtime Codex nativo, oppure `openai/gpt-5.5` senza override del runtime Codex
per traffico diretto con chiave API.

I riferimenti legacy `codex/gpt-*` restano accettati come alias di compatibilità. La migrazione di compatibilità
di doctor riscrive i riferimenti runtime legacy in riferimenti modello canonici
e registra separatamente la policy runtime. Le nuove configurazioni dell'harness nativo del server applicativo
dovrebbero usare `openai/gpt-*` più `agentRuntime.id: "codex"`.

`agents.defaults.imageModel` segue la stessa distinzione di prefisso. Usa
`openai/gpt-*` per il normale percorso OpenAI e `codex/gpt-*` quando la comprensione
delle immagini deve passare attraverso un turno limitato del server applicativo Codex. Non usare
`openai-codex/gpt-*`; doctor riscrive quel prefisso legacy in `openai/gpt-*`. Il
modello del server applicativo Codex deve dichiarare supporto per input immagine; i modelli Codex
solo testo falliscono prima dell'avvio del turno media.

Usa `/status` per confermare l'harness effettivo della sessione corrente. Se la
selezione sorprende, abilita il logging di debug per il sottosistema `agents/harness`
e ispeziona il record strutturato `agent harness selected` del Gateway. Include
l'id harness selezionato, il motivo della selezione, la policy runtime/fallback e,
in modalità `auto`, il risultato di supporto di ogni candidato plugin.

### Cosa significano gli avvisi di doctor

`openclaw doctor` avvisa quando i riferimenti modello configurati o lo stato persistente dei percorsi di sessione
usano ancora `openai-codex/*`. `openclaw doctor --fix` riscrive quei percorsi
in:

- `openai/<model>`
- `agentRuntime.id: "codex"`

Il percorso `codex` forza l'harness Codex nativo. La configurazione del runtime PI non è
consentita per i turni modello agent OpenAI.
Doctor ripara anche i vecchi pin di sessione persistenti tra gli archivi di sessioni agent
scoperti, così le vecchie conversazioni non restano bloccate sul percorso rimosso.

La selezione dell'harness non è un controllo live della sessione. Quando viene eseguito un turno incorporato,
OpenClaw registra l'id dell'harness selezionato su quella sessione e continua a usarlo per
i turni successivi nello stesso id sessione. Modifica la configurazione `agentRuntime` o
`OPENCLAW_AGENT_RUNTIME` quando vuoi che le sessioni future usino un altro harness;
usa `/new` o `/reset` per avviare una nuova sessione prima di passare una conversazione esistente
da PI a Codex o viceversa. Questo evita di riprodurre una trascrizione tramite
due sistemi di sessione nativi incompatibili.

Le sessioni legacy create prima dei pin harness sono trattate come vincolate a PI una volta che
hanno cronologia di trascrizione. Usa `/new` o `/reset` per far aderire quella conversazione a
Codex dopo aver cambiato configurazione.

`/status` mostra il runtime modello effettivo. L'harness PI predefinito appare come
`Runtime: OpenClaw Pi Default`, e l'harness del server applicativo Codex appare come
`Runtime: OpenAI Codex`.

## Requisiti

- OpenClaw con il plugin `codex` incluso disponibile.
- Codex app-server `0.125.0` o versione successiva. Il plugin incluso gestisce per impostazione predefinita un binario Codex app-server compatibile, quindi i comandi locali `codex` nel `PATH` non influiscono sul normale avvio dell’harness.
- Autenticazione Codex disponibile per il processo app-server o per il bridge di autenticazione Codex di OpenClaw. Gli avvii locali dell’app-server usano una home Codex gestita da OpenClaw per ciascun agent e un `HOME` figlio isolato, quindi per impostazione predefinita non leggono il tuo account personale `~/.codex`, skills, plugin, configurazione, stato dei thread o `$HOME/.agents/skills` nativi.

Il plugin blocca handshake app-server meno recenti o senza versione. Questo mantiene OpenClaw sulla superficie di protocollo contro cui è stato testato.

Per i test smoke live e Docker, l’autenticazione di solito proviene dall’account Codex CLI o da un profilo di autenticazione OpenClaw `openai-codex`. Gli avvii locali stdio dell’app-server possono anche ricadere su `CODEX_API_KEY` / `OPENAI_API_KEY` quando non è presente alcun account.

## File di bootstrap del workspace

Codex gestisce `AGENTS.md` autonomamente tramite la discovery nativa della documentazione di progetto. OpenClaw non scrive file sintetici di documentazione di progetto Codex né dipende dai nomi file di fallback di Codex per i file persona, perché i fallback di Codex si applicano solo quando `AGENTS.md` manca.

Per la parità del workspace OpenClaw, l’harness Codex risolve gli altri file di bootstrap (`SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` e `MEMORY.md` quando presenti) e li inoltra tramite le istruzioni developer di Codex su `thread/start` e `thread/resume`. Questo mantiene `SOUL.md` e il relativo contesto persona/profilo del workspace visibili sul percorso nativo di shaping del comportamento Codex senza duplicare `AGENTS.md`.

## Aggiungere Codex insieme ad altri modelli

Non impostare `agentRuntime.id: "codex"` globalmente se lo stesso agent deve poter passare liberamente tra Codex e modelli provider non Codex. Un runtime forzato si applica a ogni turno incorporato per quell’agent o sessione. Se selezioni un modello Anthropic mentre quel runtime è forzato, OpenClaw tenta comunque l’harness Codex e fallisce in modo chiuso invece di instradare silenziosamente quel turno tramite PI.

Usa invece una di queste forme:

- Metti Codex su un agent dedicato con `agentRuntime.id: "codex"`.
- Mantieni l’agent predefinito su `agentRuntime.id: "auto"` e fallback PI per il normale uso misto dei provider.
- Usa i riferimenti legacy `codex/*` solo per compatibilità. Le nuove configurazioni dovrebbero preferire `openai/*` più una policy esplicita di runtime Codex.

Ad esempio, questo mantiene l’agent predefinito sulla normale selezione automatica e aggiunge un agent Codex separato:

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

- L’agent `main` predefinito usa il percorso provider normale e il fallback di compatibilità PI.
- L’agent `codex` usa l’harness Codex app-server.
- Se Codex manca o non è supportato per l’agent `codex`, il turno fallisce invece di usare PI silenziosamente.

## Instradamento dei comandi degli agent

Gli agent dovrebbero instradare le richieste utente in base all’intento, non solo alla parola “Codex”:

| L’utente chiede di...                                  | L’agent dovrebbe usare...                         |
| ------------------------------------------------------ | ------------------------------------------------ |
| “Associare questa chat a Codex”                        | `/codex bind`                                    |
| “Riprendere qui il thread Codex `<id>`”                | `/codex resume <id>`                             |
| “Mostrare i thread Codex”                              | `/codex threads`                                 |
| “Inviare un report di supporto per un’esecuzione Codex errata” | `/diagnostics [note]`                            |
| “Inviare solo feedback Codex per questo thread allegato” | `/codex diagnostics [note]`                      |
| “Usare il mio abbonamento ChatGPT/Codex con il runtime Codex” | `openai/*`                                       |
| “Riparare vecchi pin di configurazione/sessione `openai-codex/*`” | `openclaw doctor --fix`                          |
| “Eseguire Codex tramite ACP/acpx”                      | ACP `sessions_spawn({ runtime: "acp", ... })`    |
| “Avviare Claude Code/Gemini/OpenCode/Cursor in un thread” | ACP/acpx, non `/codex` e non sub-agent nativi |

OpenClaw pubblicizza agli agent la guida allo spawn ACP solo quando ACP è abilitato, dispatchable e supportato da un backend runtime caricato. Se ACP non è disponibile, il prompt di sistema e le skills del plugin non dovrebbero insegnare all’agent l’instradamento ACP.

## Distribuzioni solo Codex

Forza l’harness Codex quando devi dimostrare che ogni turno agent incorporato usa Codex. I runtime plugin espliciti falliscono in modo chiuso e non vengono mai ritentati silenziosamente tramite PI:

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

Override di ambiente:

```bash
OPENCLAW_AGENT_RUNTIME=codex openclaw gateway run
```

Con Codex forzato, OpenClaw fallisce in anticipo se il plugin Codex è disabilitato, l’app-server è troppo vecchio o l’app-server non riesce ad avviarsi.

## Codex per agent

Puoi rendere un agent solo Codex mentre l’agent predefinito mantiene la normale selezione automatica:

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

Usa i normali comandi di sessione per cambiare agent e modelli. `/new` crea una nuova sessione OpenClaw e l’harness Codex crea o riprende il suo thread app-server sidecar secondo necessità. `/reset` cancella l’associazione della sessione OpenClaw per quel thread e consente al turno successivo di risolvere di nuovo l’harness dalla configurazione corrente.

## Discovery dei modelli

Per impostazione predefinita, il plugin Codex chiede all’app-server i modelli disponibili. Se la discovery fallisce o va in timeout, usa un catalogo di fallback incluso per:

- GPT-5.5
- GPT-5.4 mini
- GPT-5.2

Puoi regolare la discovery in `plugins.entries.codex.config.discovery`:

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

Disabilita la discovery quando vuoi che l’avvio eviti di interrogare Codex e resti sul catalogo di fallback:

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

## Connessione e policy dell’app-server

Per impostazione predefinita, il plugin avvia localmente il binario Codex gestito da OpenClaw con:

```bash
codex app-server --listen stdio://
```

Il binario gestito viene distribuito con il pacchetto plugin `codex`. Questo mantiene la versione dell’app-server legata al plugin incluso invece che a qualunque Codex CLI separata capiti di essere installata localmente. Imposta `appServer.command` solo quando vuoi intenzionalmente eseguire un eseguibile diverso.

Per impostazione predefinita, OpenClaw avvia le sessioni locali dell’harness Codex in modalità YOLO: `approvalPolicy: "never"`, `approvalsReviewer: "user"` e `sandbox: "danger-full-access"`. Questa è la postura dell’operatore locale fidato usata per heartbeat autonomi: Codex può usare strumenti shell e di rete senza fermarsi su prompt di approvazione nativi a cui nessuno è presente per rispondere.

Per aderire alle approvazioni Codex revisionate da guardian, imposta `appServer.mode: "guardian"`:

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

La modalità Guardian usa il percorso di approvazione con auto-review nativo di Codex. Quando Codex chiede di uscire dalla sandbox, scrivere fuori dal workspace o aggiungere permessi come l’accesso di rete, Codex instrada quella richiesta di approvazione al reviewer nativo invece che a un prompt umano. Il reviewer applica il framework di rischio di Codex e approva o rifiuta la richiesta specifica. Usa Guardian quando vuoi più guardrail rispetto alla modalità YOLO ma hai comunque bisogno che agent non presidiati facciano progressi.

Il preset `guardian` si espande in `approvalPolicy: "on-request"`, `approvalsReviewer: "auto_review"` e `sandbox: "workspace-write"`. I singoli campi di policy sovrascrivono comunque `mode`, quindi le distribuzioni avanzate possono combinare il preset con scelte esplicite. Il valore reviewer precedente `guardian_subagent` è ancora accettato come alias di compatibilità, ma le nuove configurazioni dovrebbero usare `auto_review`.

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

Gli avvii stdio dell’app-server ereditano per impostazione predefinita l’ambiente di processo di OpenClaw, ma OpenClaw possiede il bridge dell’account Codex app-server e imposta sia `CODEX_HOME` sia `HOME` su directory per-agent sotto lo stato OpenClaw di quell’agent. Il loader di skills di Codex legge `$CODEX_HOME/skills` e `$HOME/.agents/skills`, quindi entrambi i valori sono isolati per gli avvii locali dell’app-server. Questo mantiene skills, plugin, configurazione, account e stato dei thread nativi Codex limitati all’agent OpenClaw invece di farli trapelare dalla home Codex CLI personale dell’operatore.

I plugin OpenClaw e gli snapshot delle skills OpenClaw continuano a passare attraverso il registro plugin e il loader di skills propri di OpenClaw. Gli asset personali Codex CLI no. Se hai skills o plugin Codex CLI utili che dovrebbero diventare parte di un agent OpenClaw, inventariali esplicitamente:

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

Il provider di migrazione Codex copia le skills nel workspace dell’agent OpenClaw corrente. I plugin nativi Codex, gli hook e i file di configurazione vengono segnalati o archiviati per revisione manuale invece di essere attivati automaticamente, perché possono eseguire comandi, esporre server MCP o contenere credenziali.

L’autenticazione viene selezionata in questo ordine:

1. Un profilo di autenticazione Codex OpenClaw esplicito per l’agent.
2. L’account esistente dell’app-server nella home Codex di quell’agent.
3. Solo per gli avvii locali stdio dell’app-server, `CODEX_API_KEY`, poi `OPENAI_API_KEY`, quando non è presente alcun account app-server e l’autenticazione OpenAI è ancora richiesta.

Quando OpenClaw vede un profilo di autenticazione Codex in stile abbonamento ChatGPT, rimuove `CODEX_API_KEY` e `OPENAI_API_KEY` dal processo figlio Codex generato. Questo mantiene le chiavi API a livello Gateway disponibili per embedding o modelli OpenAI diretti senza far fatturare per errore i turni nativi Codex app-server tramite l’API. I profili Codex espliciti con chiave API e il fallback locale stdio con chiave d’ambiente usano il login app-server invece dell’ambiente ereditato del processo figlio. Le connessioni WebSocket all’app-server non ricevono il fallback della chiave API dell’ambiente Gateway; usa un profilo di autenticazione esplicito o l’account proprio dell’app-server remoto.

Se una distribuzione necessita di isolamento aggiuntivo dell’ambiente, aggiungi quelle variabili a `appServer.clearEnv`:

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

`appServer.clearEnv` influisce solo sul processo figlio Codex app-server generato.

Gli strumenti dinamici di Codex usano per impostazione predefinita il profilo `native-first`. In questa modalità,
OpenClaw non espone strumenti dinamici che duplicano le operazioni di workspace
native di Codex: `read`, `write`, `edit`, `apply_patch`, `exec`, `process` e
`update_plan`. Gli strumenti di integrazione OpenClaw come messaggistica, sessioni, media,
Cron, browser, nodi, Gateway, `heartbeat_respond` e `web_search` restano
disponibili.

Campi Plugin Codex di primo livello supportati:

| Campo                      | Predefinito      | Significato                                                                               |
| -------------------------- | ---------------- | ----------------------------------------------------------------------------------------- |
| `codexDynamicToolsProfile` | `"native-first"` | Usa `"openclaw-compat"` per esporre il set completo di strumenti dinamici OpenClaw a Codex app-server. |
| `codexDynamicToolsExclude` | `[]`             | Nomi aggiuntivi di strumenti dinamici OpenClaw da omettere dai turni di Codex app-server. |

Campi `appServer` supportati:

| Campo                         | Predefinito                             | Significato                                                                                                                                                                                                                          |
| ----------------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `transport`                   | `"stdio"`                                | `"stdio"` avvia Codex; `"websocket"` si connette a `url`.                                                                                                                                                                             |
| `command`                     | binario Codex gestito                    | Eseguibile per il trasporto stdio. Lascialo non impostato per usare il binario gestito; impostalo solo per un override esplicito.                                                                                                    |
| `args`                        | `["app-server", "--listen", "stdio://"]` | Argomenti per il trasporto stdio.                                                                                                                                                                                                    |
| `url`                         | non impostato                            | URL WebSocket dell'app-server.                                                                                                                                                                                                       |
| `authToken`                   | non impostato                            | Token Bearer per il trasporto WebSocket.                                                                                                                                                                                             |
| `headers`                     | `{}`                                     | Header WebSocket aggiuntivi.                                                                                                                                                                                                         |
| `clearEnv`                    | `[]`                                     | Nomi aggiuntivi di variabili d'ambiente rimossi dal processo app-server stdio avviato dopo che OpenClaw ha costruito l'ambiente ereditato. `CODEX_HOME` e `HOME` sono riservati all'isolamento Codex per agente di OpenClaw negli avvii locali. |
| `requestTimeoutMs`            | `60000`                                  | Timeout per le chiamate al piano di controllo dell'app-server.                                                                                                                                                                       |
| `turnCompletionIdleTimeoutMs` | `60000`                                  | Finestra di quiete dopo una richiesta Codex app-server con ambito di turno mentre OpenClaw attende `turn/completed`. Aumentala per fasi lente post-strumento o di sintesi solo stato.                                               |
| `mode`                        | `"yolo"`                                 | Preset per esecuzione YOLO o revisionata da guardian.                                                                                                                                                                                |
| `approvalPolicy`              | `"never"`                                | Policy di approvazione nativa Codex inviata ad avvio/ripresa/thread/turno.                                                                                                                                                          |
| `sandbox`                     | `"danger-full-access"`                   | Modalità sandbox nativa Codex inviata ad avvio/ripresa thread.                                                                                                                                                                      |
| `approvalsReviewer`           | `"user"`                                 | Usa `"auto_review"` per lasciare che Codex revisioni i prompt di approvazione nativi. `guardian_subagent` resta un alias legacy.                                                                                                     |
| `serviceTier`                 | non impostato                            | Livello di servizio opzionale di Codex app-server: `"fast"`, `"flex"` o `null`. I valori legacy non validi vengono ignorati.                                                                                                        |

Le chiamate agli strumenti dinamici di proprietà di OpenClaw sono limitate in modo indipendente da
`appServer.requestTimeoutMs`: ogni richiesta Codex `item/tool/call` deve ricevere
una risposta OpenClaw entro 30 secondi. In caso di timeout, OpenClaw interrompe il segnale
dello strumento dove supportato e restituisce a Codex una risposta di strumento dinamico non riuscita, così
il turno può continuare invece di lasciare la sessione in `processing`.

Dopo che OpenClaw risponde a una richiesta Codex app-server con ambito di turno, l'harness
si aspetta anche che Codex finisca il turno nativo con `turn/completed`. Se
l'app-server resta inattivo per `appServer.turnCompletionIdleTimeoutMs` dopo quella
risposta, OpenClaw interrompe best-effort il turno Codex, registra un timeout
diagnostico e libera la corsia di sessione OpenClaw così i messaggi chat successivi
non restano in coda dietro un turno nativo obsoleto. Qualsiasi notifica non terminale per lo
stesso turno, inclusa `rawResponseItem/completed`, disarma quel breve watchdog
perché Codex ha dimostrato che il turno è ancora attivo; il watchdog terminale più lungo
continua a proteggere i turni realmente bloccati. Le diagnostiche di timeout includono
l'ultimo metodo di notifica dell'app-server e, per gli elementi di risposta raw dell'assistente, il
tipo di elemento, il ruolo, l'id e un'anteprima limitata del testo dell'assistente.

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
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` per test locali una tantum. La configurazione è
preferibile per deployment ripetibili perché mantiene il comportamento del Plugin nello
stesso file revisionato del resto della configurazione dell'harness Codex.

## Uso del computer

Computer Use è trattato nella propria guida di configurazione:
[Computer Use Codex](/it/plugins/codex-computer-use).

La versione breve: OpenClaw non include come vendor l'app di controllo desktop né esegue
azioni desktop direttamente. Prepara Codex app-server, verifica che il server MCP
`computer-use` sia disponibile e poi lascia che Codex gestisca le chiamate agli strumenti
MCP nativi durante i turni in modalità Codex.

Per accesso diretto al driver TryCua al di fuori del flusso marketplace Codex, registra
`cua-driver mcp` con `openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'`.
Vedi [Computer Use Codex](/it/plugins/codex-computer-use) per la distinzione
tra Computer Use di proprietà di Codex e registrazione MCP diretta.

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

Computer Use è specifico di macOS e può richiedere permessi locali del sistema operativo prima che il
server MCP Codex possa controllare le app. Se `computerUse.enabled` è true e il server MCP
non è disponibile, i turni in modalità Codex falliscono prima dell'avvio del thread invece di
essere eseguiti silenziosamente senza gli strumenti nativi Computer Use. Vedi
[Computer Use Codex](/it/plugins/codex-computer-use) per scelte del marketplace,
limiti del catalogo remoto, motivi di stato e risoluzione dei problemi.

Quando `computerUse.autoInstall` è true, OpenClaw può registrare il marketplace standard
Codex Desktop incluso da
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` se Codex
non ha ancora scoperto un marketplace locale. Usa `/new` o `/reset` dopo aver
modificato la configurazione runtime o Computer Use, così le sessioni esistenti non mantengono un vecchio
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

Validazione harness solo Codex:

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

Approvazioni Codex revisionate da guardian:

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
a un thread Codex esistente, il turno successivo invia nuovamente all'app-server il modello
OpenAI, il provider, la policy di approvazione, la sandbox e il livello di servizio
attualmente selezionati. Passare da `openai/gpt-5.5` a `openai/gpt-5.2` mantiene il
binding del thread ma chiede a Codex di continuare con il nuovo modello selezionato.

## Comando Codex

Il Plugin incluso registra `/codex` come slash command autorizzato. È
generico e funziona su qualsiasi canale che supporti i comandi testuali OpenClaw.

Forme comuni:

- `/codex status` mostra la connettività live all'app-server, i modelli, l'account, i limiti di frequenza, i server MCP e le Skills.
- `/codex models` elenca i modelli live dell'app-server Codex.
- `/codex threads [filter]` elenca i thread Codex recenti.
- `/codex resume <thread-id>` collega la sessione OpenClaw corrente a un thread Codex esistente.
- `/codex compact` chiede all'app-server Codex di compattare il thread collegato.
- `/codex review` avvia la revisione nativa Codex per il thread collegato.
- `/codex diagnostics [note]` chiede conferma prima di inviare il feedback diagnostico Codex per il thread collegato.
- `/codex computer-use status` controlla il Plugin Computer Use configurato e il server MCP.
- `/codex computer-use install` installa il Plugin Computer Use configurato e ricarica i server MCP.
- `/codex account` mostra lo stato dell'account e dei limiti di frequenza.
- `/codex mcp` elenca lo stato dei server MCP dell'app-server Codex.
- `/codex skills` elenca le Skills dell'app-server Codex.

Quando Codex segnala un errore per limite di utilizzo, OpenClaw include l'ora del prossimo ripristino dell'app-server quando Codex ne ha fornita una. Usa `/codex account` nella stessa conversazione per ispezionare l'account corrente e le finestre dei limiti di frequenza.

### Flusso di debug comune

Quando un agente basato su Codex fa qualcosa di inatteso in Telegram, Discord, Slack o in un altro canale, parti dalla conversazione in cui si è verificato il problema:

1. Esegui `/diagnostics bad tool choice after image upload` o un'altra breve nota che descriva ciò che hai visto.
2. Approva la richiesta di diagnostica una volta. L'approvazione crea lo zip diagnostico locale del Gateway e, poiché la sessione usa l'harness Codex, invia anche il bundle di feedback Codex pertinente ai server OpenAI.
3. Copia la risposta diagnostica completata nel report di bug o nel thread di supporto. Include il percorso del bundle locale, il riepilogo sulla privacy, gli ID sessione OpenClaw, gli ID thread Codex e una riga `Inspect locally` per ciascun thread Codex.
4. Se vuoi eseguire il debug della run personalmente, esegui in un terminale il comando `Inspect locally` stampato. Ha un aspetto simile a `codex resume <thread-id>` e apre il thread Codex nativo, così puoi ispezionare la conversazione, continuarla localmente o chiedere a Codex perché ha scelto uno strumento o un piano specifico.

Usa `/codex diagnostics [note]` solo quando vuoi specificamente caricare il feedback Codex per il thread attualmente collegato senza il bundle diagnostico completo del Gateway OpenClaw. Per la maggior parte dei report di supporto, `/diagnostics [note]` è il punto di partenza migliore perché collega lo stato locale del Gateway e gli ID thread Codex in un'unica risposta. Vedi [Esportazione della diagnostica](/it/gateway/diagnostics) per il modello completo della privacy e il comportamento nelle chat di gruppo.

Il core OpenClaw espone anche `/diagnostics [note]`, riservato agli owner, come comando generale di diagnostica del Gateway. Il suo prompt di approvazione mostra il preambolo sui dati sensibili, contiene link a [Esportazione della diagnostica](/it/gateway/diagnostics) e richiede `openclaw gateway diagnostics export --json` tramite approvazione exec esplicita ogni volta. Non approvare la diagnostica con una regola allow-all. Dopo l'approvazione, OpenClaw invia un report incollabile con il percorso del bundle locale e il riepilogo del manifesto. Quando la sessione OpenClaw attiva usa l'harness Codex, la stessa approvazione autorizza anche l'invio dei bundle di feedback Codex pertinenti ai server OpenAI. Il prompt di approvazione dice che il feedback Codex verrà inviato, ma non elenca gli ID sessione o thread Codex prima dell'approvazione.

Se `/diagnostics` viene invocato da un owner in una chat di gruppo, OpenClaw mantiene pulito il canale condiviso: il gruppo riceve solo una breve notifica, mentre il preambolo della diagnostica, i prompt di approvazione e gli ID sessione/thread Codex vengono inviati all'owner tramite il percorso di approvazione privato. Se non esiste un percorso privato verso l'owner, OpenClaw rifiuta la richiesta del gruppo e chiede all'owner di eseguirla da un DM.

Il caricamento Codex approvato chiama `feedback/upload` dell'app-server Codex e chiede all'app-server di includere i log per ciascun thread elencato e per i sottothread Codex generati, quando disponibili. Il caricamento passa attraverso il normale percorso di feedback di Codex verso i server OpenAI; se il feedback Codex è disabilitato in quell'app-server, il comando restituisce l'errore dell'app-server. La risposta diagnostica completata elenca i canali, gli ID sessione OpenClaw, gli ID thread Codex e i comandi locali `codex resume <thread-id>` per i thread inviati. Se neghi o ignori l'approvazione, OpenClaw non stampa quegli ID Codex. Questo caricamento non sostituisce l'esportazione diagnostica locale del Gateway.

`/codex resume` scrive lo stesso file di associazione sidecar che l'harness usa per i turni normali. Al messaggio successivo, OpenClaw riprende quel thread Codex, passa il modello OpenClaw attualmente selezionato all'app-server e mantiene abilitata la cronologia estesa.

### Ispezionare un thread Codex dalla CLI

Il modo più rapido per comprendere una run Codex errata è spesso aprire direttamente il thread Codex nativo:

```sh
codex resume <thread-id>
```

Usalo quando noti un bug in una conversazione di canale e vuoi ispezionare la sessione Codex problematica, continuarla localmente o chiedere a Codex perché ha fatto una scelta specifica di strumento o ragionamento. Il percorso più semplice di solito è eseguire prima `/diagnostics [note]`: dopo l'approvazione, il report completato elenca ciascun thread Codex e stampa un comando `Inspect locally`, per esempio `codex resume <thread-id>`. Puoi copiare quel comando direttamente in un terminale.

Puoi anche ottenere un ID thread da `/codex binding` per la chat corrente o da `/codex threads [filter]` per i thread recenti dell'app-server Codex, quindi eseguire lo stesso comando `codex resume` nella tua shell.

La superficie dei comandi richiede l'app-server Codex `0.125.0` o più recente. I singoli metodi di controllo vengono segnalati come `unsupported by this Codex app-server` se un app-server futuro o personalizzato non espone quel metodo JSON-RPC.

## Confini degli hook

L'harness Codex ha tre livelli di hook:

| Livello                               | Owner                    | Scopo                                                               |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| Hook dei Plugin OpenClaw              | OpenClaw                 | Compatibilità prodotto/Plugin tra harness PI e Codex.               |
| Middleware di estensione app-server Codex | Plugin in bundle OpenClaw | Comportamento dell'adapter per turno attorno agli strumenti dinamici OpenClaw. |
| Hook nativi Codex                     | Codex                    | Ciclo di vita Codex di basso livello e policy degli strumenti nativi dalla configurazione Codex. |

OpenClaw non usa file `hooks.json` di progetto o globali di Codex per instradare il comportamento dei Plugin OpenClaw. Per il bridge supportato di strumenti nativi e autorizzazioni, OpenClaw inietta configurazione Codex per thread per `PreToolUse`, `PostToolUse`, `PermissionRequest` e `Stop`. Quando le approvazioni dell'app-server Codex sono abilitate (`approvalPolicy` non è `"never"`), la configurazione predefinita degli hook nativi iniettati omette `PermissionRequest`, così il reviewer dell'app-server Codex e il bridge di approvazione di OpenClaw gestiscono le escalation reali dopo la revisione. Gli operatori possono comunque aggiungere esplicitamente `permission_request` a `nativeHookRelay.events` quando hanno bisogno del relay di compatibilità. Altri hook Codex come `SessionStart` e `UserPromptSubmit` restano controlli a livello Codex; non sono esposti come hook dei Plugin OpenClaw nel contratto v1.

Per gli strumenti dinamici OpenClaw, OpenClaw esegue lo strumento dopo che Codex richiede la chiamata, quindi OpenClaw attiva il comportamento dei Plugin e del middleware di cui è owner nell'adapter dell'harness. Per gli strumenti nativi Codex, Codex è owner del record canonico dello strumento. OpenClaw può rispecchiare eventi selezionati, ma non può riscrivere il thread Codex nativo a meno che Codex non esponga quell'operazione tramite app-server o callback di hook nativi.

Le proiezioni di Compaction e del ciclo di vita LLM provengono dalle notifiche dell'app-server Codex e dallo stato dell'adapter OpenClaw, non da comandi di hook nativi Codex. Gli eventi `before_compaction`, `after_compaction`, `llm_input` e `llm_output` di OpenClaw sono osservazioni a livello di adapter, non catture byte per byte della richiesta interna o dei payload di Compaction di Codex.

Le notifiche app-server Codex native `hook/started` e `hook/completed` vengono proiettate come eventi agente `codex_app_server.hook` per traiettoria e debug. Non invocano hook dei Plugin OpenClaw.

## Contratto di supporto V1

La modalità Codex non è PI con una diversa chiamata al modello sotto. Codex possiede una parte maggiore del loop nativo del modello e OpenClaw adatta le proprie superfici di Plugin e sessione attorno a quel confine.

Supportato nel runtime Codex v1:

| Superficie                                     | Supporto                                                                             | Perché                                                                                                                                                                                                     |
| --------------------------------------------- | ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ciclo del modello OpenAI tramite Codex         | Supportato                                                                           | L'app-server Codex gestisce il turno OpenAI, la ripresa nativa del thread e la continuazione nativa degli strumenti.                                                                                       |
| Routing e consegna dei canali OpenClaw         | Supportato                                                                           | Telegram, Discord, Slack, WhatsApp, iMessage e altri canali restano fuori dal runtime del modello.                                                                                                         |
| Strumenti dinamici OpenClaw                    | Supportato                                                                           | Codex chiede a OpenClaw di eseguire questi strumenti, quindi OpenClaw resta nel percorso di esecuzione.                                                                                                     |
| Plugin di prompt e contesto                    | Supportato                                                                           | OpenClaw crea overlay di prompt e proietta il contesto nel turno Codex prima di avviare o riprendere il thread.                                                                                            |
| Ciclo di vita del motore di contesto           | Supportato                                                                           | Assemblaggio, ingestione o manutenzione post-turno, e coordinamento della Compaction del motore di contesto vengono eseguiti per i turni Codex.                                                           |
| Hook degli strumenti dinamici                  | Supportato                                                                           | `before_tool_call`, `after_tool_call` e il middleware dei risultati degli strumenti vengono eseguiti attorno agli strumenti dinamici di proprietà di OpenClaw.                                             |
| Hook del ciclo di vita                         | Supportato come osservazioni dell'adattatore                                         | `llm_input`, `llm_output`, `agent_end`, `before_compaction` e `after_compaction` scattano con payload onesti in modalità Codex.                                                                            |
| Gate di revisione della risposta finale        | Supportato tramite il relay degli hook nativi                                        | Codex `Stop` viene inoltrato a `before_agent_finalize`; `revise` chiede a Codex un ulteriore passaggio del modello prima della finalizzazione.                                                             |
| Blocca od osserva shell, patch e MCP nativi    | Supportato tramite il relay degli hook nativi                                        | Codex `PreToolUse` e `PostToolUse` vengono inoltrati per le superfici degli strumenti nativi impegnate, inclusi i payload MCP su app-server Codex `0.125.0` o più recente. Il blocco è supportato; la riscrittura degli argomenti no. |
| Criterio di autorizzazione nativo              | Supportato tramite le approvazioni dell'app-server Codex e il relay compatibile degli hook nativi | Le richieste di approvazione dell'app-server Codex passano attraverso OpenClaw dopo la revisione di Codex. Il relay dell'hook nativo `PermissionRequest` è opzionale per le modalità di approvazione native perché Codex lo emette prima della revisione del guardian. |
| Acquisizione della traiettoria dell'app-server | Supportato                                                                           | OpenClaw registra la richiesta che ha inviato all'app-server e le notifiche dell'app-server che riceve.                                                                                                     |

Non supportato nel runtime Codex v1:

| Superficie                                          | Confine V1                                                                                                                                      | Percorso futuro                                                                           |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Mutazione degli argomenti degli strumenti nativi    | Gli hook pre-strumento nativi di Codex possono bloccare, ma OpenClaw non riscrive gli argomenti degli strumenti nativi di Codex.                | Richiede supporto Codex per hook/schema per sostituire l'input dello strumento.           |
| Cronologia del transcript nativo Codex modificabile | Codex possiede la cronologia canonica del thread nativo. OpenClaw possiede una copia speculare e può proiettare contesto futuro, ma non dovrebbe modificare internals non supportati. | Aggiungere API esplicite dell'app-server Codex se serve chirurgia sul thread nativo.      |
| `tool_result_persist` per record di strumenti nativi Codex | Quell'hook trasforma scritture del transcript di proprietà di OpenClaw, non record di strumenti nativi Codex.                                  | Potrebbe rispecchiare record trasformati, ma la riscrittura canonica richiede supporto Codex. |
| Metadati avanzati di Compaction nativa              | OpenClaw osserva l'inizio e il completamento della Compaction, ma non riceve un elenco stabile di elementi mantenuti/scartati, delta di token o payload di riepilogo. | Servono eventi di Compaction Codex più ricchi.                                             |
| Intervento sulla Compaction                         | Gli hook di Compaction OpenClaw attuali sono a livello di notifica in modalità Codex.                                                           | Aggiungere hook Codex pre/post Compaction se i plugin devono porre veto o riscrivere la Compaction nativa. |
| Acquisizione byte-per-byte della richiesta API del modello | OpenClaw può acquisire richieste e notifiche dell'app-server, ma il core Codex costruisce internamente la richiesta API OpenAI finale.          | Serve un evento di tracing della richiesta del modello Codex o un'API di debug.           |

## Strumenti, media e Compaction

L'harness Codex cambia solo l'esecutore dell'agente incorporato di basso livello.

OpenClaw costruisce comunque l'elenco degli strumenti e riceve i risultati degli strumenti dinamici dall'harness. Testo, immagini, video, musica, TTS, approvazioni e output degli strumenti di messaggistica continuano attraverso il normale percorso di consegna OpenClaw.

Il relay degli hook nativi è intenzionalmente generico, ma il contratto di supporto v1 è limitato ai percorsi di strumenti e autorizzazioni nativi Codex che OpenClaw testa. Nel runtime Codex, questo include payload shell, patch e MCP `PreToolUse`, `PostToolUse` e `PermissionRequest`. Non presumere che ogni futuro evento hook Codex sia una superficie plugin OpenClaw finché il contratto di runtime non lo nomina.

Per `PermissionRequest`, OpenClaw restituisce decisioni esplicite di consentire o negare solo quando il criterio decide. Un risultato senza decisione non è un consenso. Codex lo tratta come nessuna decisione dell'hook e passa al proprio percorso di approvazione guardian o utente. Le modalità di approvazione dell'app-server Codex omettono questo hook nativo per impostazione predefinita; questo paragrafo si applica quando `permission_request` è incluso esplicitamente in `nativeHookRelay.events` o quando un runtime di compatibilità lo installa.
Quando un operatore sceglie `allow-always` per una richiesta di autorizzazione nativa Codex, OpenClaw ricorda quell'esatta impronta provider/sessione/input strumento/cwd per una finestra di sessione limitata. La decisione ricordata è intenzionalmente solo a corrispondenza esatta: un comando, argomenti, payload dello strumento o cwd modificati creano una nuova approvazione.

Le sollecitazioni di approvazione degli strumenti MCP Codex vengono instradate attraverso il flusso di approvazione dei plugin di OpenClaw quando Codex contrassegna `_meta.codex_approval_kind` come `"mcp_tool_call"`. I prompt Codex `request_user_input` vengono rimandati alla chat di origine e il messaggio di follow-up successivo in coda risponde a quella richiesta del server nativo invece di essere indirizzato come contesto extra. Le altre richieste di sollecitazione MCP continuano a fallire in modo chiuso.

L'indirizzamento della coda di esecuzione attiva si mappa su `turn/steer` dell'app-server Codex. Con il valore predefinito `messages.queue.mode: "steer"`, OpenClaw raggruppa i messaggi chat in coda per la finestra di quiete configurata e li invia come un'unica richiesta `turn/steer` in ordine di arrivo. La modalità legacy `queue` invia richieste `turn/steer` separate. La revisione Codex e i turni di Compaction manuale possono rifiutare l'indirizzamento nello stesso turno, nel qual caso OpenClaw usa la coda di follow-up quando la modalità selezionata consente il fallback. Vedi [Coda di indirizzamento](/it/concepts/queue-steering).

Quando il modello selezionato usa l'harness Codex, la Compaction del thread nativo viene delegata all'app-server Codex. OpenClaw mantiene una copia speculare del transcript per cronologia del canale, ricerca, `/new`, `/reset` e cambio futuro di modello o harness. La copia speculare include il prompt dell'utente, il testo finale dell'assistente e record leggeri di ragionamento o piano Codex quando l'app-server li emette. Oggi OpenClaw registra solo segnali di inizio e completamento della Compaction nativa. Non espone ancora un riepilogo della Compaction leggibile da una persona né un elenco verificabile delle voci che Codex ha mantenuto dopo la Compaction.

Poiché Codex possiede il thread nativo canonico, `tool_result_persist` attualmente non riscrive i record dei risultati degli strumenti nativi Codex. Si applica solo quando OpenClaw sta scrivendo un risultato di strumento del transcript di sessione di proprietà di OpenClaw.

La generazione multimediale non richiede PI. Immagine, video, musica, PDF, TTS e comprensione dei media continuano a usare le impostazioni provider/modello corrispondenti, come `agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel` e `messages.tts`.

## Risoluzione dei problemi

**Codex non appare come un normale provider `/model`:** è previsto per le nuove configurazioni. Seleziona un modello `openai/gpt-*` con `agentRuntime.id: "codex"` (o un riferimento legacy `codex/*`), abilita `plugins.entries.codex.enabled` e controlla se `plugins.allow` esclude `codex`.

**OpenClaw usa PI invece di Codex:** `agentRuntime.id: "auto"` può ancora usare PI come backend di compatibilità quando nessun harness Codex rivendica l'esecuzione. Imposta `agentRuntime.id: "codex"` per forzare la selezione di Codex durante i test. Un runtime Codex forzato fallisce invece di ricadere su PI. Una volta selezionato l'app-server Codex, i suoi errori emergono direttamente.

**L'app-server viene rifiutato:** aggiorna Codex affinché l'handshake dell'app-server riporti la versione `0.125.0` o più recente. Prerelease della stessa versione o versioni con suffisso di build come `0.125.0-alpha.2` o `0.125.0+custom` vengono rifiutate perché il livello minimo del protocollo stabile `0.125.0` è ciò che OpenClaw testa.

**Il rilevamento dei modelli è lento:** abbassa `plugins.entries.codex.config.discovery.timeoutMs` o disabilita il rilevamento.

**Il trasporto WebSocket fallisce immediatamente:** controlla `appServer.url`, `authToken` e che l'app-server remoto parli la stessa versione del protocollo dell'app-server Codex.

**Un modello non Codex usa PI:** è previsto a meno che tu non abbia forzato `agentRuntime.id: "codex"` per quell'agente o selezionato un riferimento legacy `codex/*`. I normali riferimenti `openai/gpt-*` e di altri provider restano nel loro normale percorso provider in modalità `auto`. Se forzi `agentRuntime.id: "codex"`, ogni turno incorporato per quell'agente deve essere un modello OpenAI supportato da Codex.

**Computer Use è installato ma gli strumenti non vengono eseguiti:** controlla
`/codex computer-use status` da una nuova sessione. Se uno strumento segnala
`Native hook relay unavailable`, usa `/new` o `/reset`; se il problema persiste, riavvia
il Gateway per eliminare le registrazioni degli hook nativi obsolete. Se `computer-use.list_apps`
va in timeout, riavvia Codex Computer Use o Codex Desktop e riprova.

## Correlati

- [Plugin dell'harness agente](/it/plugins/sdk-agent-harness)
- [Runtime degli agenti](/it/concepts/agent-runtimes)
- [Provider dei modelli](/it/concepts/model-providers)
- [Provider OpenAI](/it/providers/openai)
- [Stato](/it/cli/status)
- [Hook dei Plugin](/it/plugins/hooks)
- [Riferimento di configurazione](/it/gateway/configuration-reference)
- [Test](/it/help/testing-live#live-codex-app-server-harness-smoke)
