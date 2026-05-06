---
read_when:
    - Vuoi usare l'harness app-server Codex incluso
    - Hai bisogno di esempi di configurazione dell'harness di Codex
    - Vuoi che le distribuzioni solo Codex falliscano invece di ripiegare su PI
summary: Eseguire i turni dell'agente integrato di OpenClaw tramite l'infrastruttura app-server Codex inclusa
title: Ambiente di esecuzione di Codex
x-i18n:
    generated_at: "2026-05-06T09:01:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: a35ab08c1a7327437aadb6c2517bd962071bbb25982718d4c0b043680163ab70
    source_path: plugins/codex-harness.md
    workflow: 16
---

Il plugin `codex` in bundle permette a OpenClaw di eseguire turni agente incorporati tramite il
server applicativo Codex invece che tramite l'harness PI integrato.

Usalo quando vuoi che Codex possieda la sessione agente di basso livello: rilevamento
dei modelli, ripresa nativa dei thread, Compaction nativa ed esecuzione del server applicativo.
OpenClaw continua a possedere canali chat, file di sessione, selezione dei modelli, strumenti,
approvazioni, consegna dei media e il mirror visibile della trascrizione.

Quando un turno chat sorgente passa attraverso l'harness Codex, le risposte visibili usano per impostazione predefinita
lo strumento `message` di OpenClaw se il deployment non ha configurato esplicitamente
`messages.visibleReplies`. L'agente può comunque completare privatamente il proprio turno Codex;
pubblica nel canale solo quando chiama `message(action="send")`. Imposta
`messages.visibleReplies: "automatic"` per mantenere le risposte finali delle chat dirette sul
percorso di consegna automatica legacy.

Anche i turni Heartbeat di Codex ricevono per impostazione predefinita lo strumento `heartbeat_respond`, così
l'agente può registrare se il risveglio deve restare silenzioso o notificare senza codificare
quel flusso di controllo nel testo finale.

La guida di iniziativa specifica per Heartbeat viene inviata come istruzione sviluppatore in modalità collaborazione Codex
sul turno Heartbeat stesso. I turni chat ordinari ripristinano
la modalità predefinita di Codex invece di portare la filosofia Heartbeat nel loro normale
prompt di runtime.

Se stai cercando di orientarti, inizia da
[Runtime degli agenti](/it/concepts/agent-runtimes). In breve:
`openai/gpt-5.5` è il riferimento del modello, `codex` è il runtime, e Telegram,
Discord, Slack o un altro canale resta la superficie di comunicazione.

## Configurazione rapida

La maggior parte degli utenti che vuole "Codex in OpenClaw" vuole questo percorso: accedere con un
abbonamento ChatGPT/Codex, poi eseguire i turni agente incorporati tramite il runtime nativo
del server applicativo Codex. Il riferimento del modello resta comunque canonico come
`openai/gpt-*`; l'autenticazione dell'abbonamento arriva dall'account/profilo Codex, non
da un prefisso modello `openai-codex/*`.

Per prima cosa accedi con Codex OAuth, se non lo hai già fatto:

```bash
openclaw models auth login --provider openai-codex
```

Poi abilita il plugin `codex` in bundle e forza il runtime Codex:

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

Se la tua configurazione usa `plugins.allow`, includi anche lì `codex`:

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
`openclaw doctor --fix` riscrive in `openai/gpt-*` nei modelli principali,
fallback, override di Heartbeat/subagente/Compaction, hook, override di canale
e pin di percorso delle sessioni persistite obsolete.

## Cosa cambia questo plugin

Il plugin `codex` in bundle aggiunge diverse capacità separate:

| Capacità                          | Come la usi                                          | Cosa fa                                                                       |
| --------------------------------- | --------------------------------------------------- | ----------------------------------------------------------------------------- |
| Runtime incorporato nativo        | `agentRuntime.id: "codex"`                          | Esegue i turni agente incorporati di OpenClaw tramite il server applicativo Codex. |
| Comandi nativi di controllo chat  | `/codex bind`, `/codex resume`, `/codex steer`, ... | Associa e controlla thread del server applicativo Codex da una conversazione di messaggistica. |
| Provider/catalogo server applicativo Codex | elementi interni di `codex`, esposti tramite l'harness | Permette al runtime di rilevare e validare modelli del server applicativo.     |
| Percorso di comprensione media Codex | percorsi di compatibilità dei modelli immagine `codex/*` | Esegue turni limitati del server applicativo Codex per modelli di comprensione immagini supportati. |
| Relay hook nativo                 | Hook Plugin attorno a eventi nativi Codex           | Permette a OpenClaw di osservare/bloccare eventi nativi Codex supportati di strumenti/finalizzazione. |

Abilitare il plugin rende disponibili queste capacità. Non:

- inizia a usare Codex per ogni modello OpenAI
- converte riferimenti modello `openai-codex/*` nel runtime nativo senza che doctor
  verifichi che Codex sia installato, abilitato, contribuisca l'harness `codex`
  e sia pronto per OAuth
- rende ACP/acpx il percorso Codex predefinito
- cambia a caldo sessioni esistenti che hanno già registrato un runtime PI
- sostituisce la consegna dei canali OpenClaw, i file di sessione, l'archiviazione dei profili di autenticazione o
  l'instradamento dei messaggi

Lo stesso plugin possiede anche la superficie nativa del comando di controllo chat `/codex`. Se
il plugin è abilitato e l'utente chiede di associare, riprendere, guidare, fermare o ispezionare
thread Codex dalla chat, gli agenti dovrebbero preferire `/codex ...` rispetto ad ACP. ACP resta
il fallback esplicito quando l'utente chiede ACP/acpx o sta testando l'adattatore ACP
Codex.

I turni Codex nativi mantengono gli hook Plugin di OpenClaw come livello pubblico di compatibilità.
Questi sono hook OpenClaw in-process, non hook di comando `hooks.json` di Codex:

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `before_tool_call`, `after_tool_call`
- `before_message_write` per i record di trascrizione replicati
- `before_agent_finalize` tramite relay Codex `Stop`
- `agent_end`

I Plugin possono anche registrare middleware dei risultati degli strumenti neutrale rispetto al runtime per riscrivere
i risultati degli strumenti dinamici di OpenClaw dopo che OpenClaw esegue lo strumento e prima che il
risultato venga restituito a Codex. Questo è separato dall'hook Plugin pubblico
`tool_result_persist`, che trasforma le scritture dei risultati degli strumenti nella trascrizione posseduta da OpenClaw.

Per la semantica degli hook Plugin, vedi [Hook Plugin](/it/plugins/hooks)
e [Comportamento delle guardie Plugin](/it/tools/plugin).

L'harness è disattivato per impostazione predefinita. Le nuove configurazioni dovrebbero mantenere i riferimenti modello OpenAI
canonici come `openai/gpt-*` e forzare esplicitamente
`agentRuntime.id: "codex"` oppure `OPENCLAW_AGENT_RUNTIME=codex` quando
vogliono l'esecuzione nativa del server applicativo. I riferimenti modello legacy `codex/*` selezionano ancora automaticamente
l'harness per compatibilità, ma i prefissi provider legacy supportati da runtime
non vengono mostrati come normali scelte di modello/provider.

Se qualsiasi percorso modello configurato è ancora `openai-codex/*`, `openclaw doctor --fix`
lo riscrive in `openai/*`. Per i percorsi agente corrispondenti, imposta il runtime agente
a `codex` solo quando il plugin Codex è installato, abilitato, contribuisce
l'harness `codex` e dispone di OAuth utilizzabile; altrimenti imposta il runtime a `pi`.

## Mappa dei percorsi

Usa questa tabella prima di modificare la configurazione:

| Comportamento desiderato                           | Riferimento modello        | Configurazione runtime                  | Percorso auth/profilo         | Etichetta di stato prevista    |
| -------------------------------------------------- | -------------------------- | -------------------------------------- | ---------------------------- | ------------------------------ |
| Abbonamento ChatGPT/Codex con runtime Codex nativo | `openai/gpt-*`             | `agentRuntime.id: "codex"`             | Codex OAuth o account Codex  | `Runtime: OpenAI Codex`        |
| API OpenAI tramite normale runner OpenClaw         | `openai/gpt-*`             | omesso o `runtime: "pi"`               | Chiave API OpenAI            | `Runtime: OpenClaw Pi Default` |
| Configurazione legacy che richiede riparazione doctor | `openai-codex/gpt-*`    | riparato in `codex` o `pi`             | Auth configurata esistente   | Ricontrolla dopo `doctor --fix` |
| Provider misti con modalità automatica conservativa | riferimenti specifici del provider | `agentRuntime.id: "auto"`        | Per provider selezionato     | Dipende dal runtime selezionato |
| Sessione adattatore Codex ACP esplicita            | dipende da prompt/modello ACP | `sessions_spawn` con `runtime: "acp"` | Auth backend ACP             | Stato attività/sessione ACP    |

La distinzione importante è tra provider e runtime:

- `openai-codex/*` è un percorso legacy che doctor riscrive.
- `agentRuntime.id: "codex"` richiede l'harness Codex e fallisce in modo chiuso se
  non è disponibile.
- `agentRuntime.id: "auto"` permette agli harness registrati di rivendicare percorsi provider
  corrispondenti, ma i riferimenti OpenAI canonici sono comunque posseduti da PI a meno che un harness supporti
  quella coppia provider/modello.
- `/codex ...` risponde a "a quale conversazione Codex nativa dovrebbe associarsi
  o quale dovrebbe controllare questa chat?"
- ACP risponde a "quale processo harness esterno dovrebbe avviare acpx?"

## Scegli il prefisso modello corretto

I percorsi della famiglia OpenAI sono specifici per prefisso. Per la configurazione comune con abbonamento più
runtime Codex nativo, usa `openai/*` con `agentRuntime.id: "codex"`.
Considera `openai-codex/*` come configurazione legacy che doctor dovrebbe riscrivere:

| Riferimento modello                           | Percorso runtime                            | Quando usarlo                                                             |
| --------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------- |
| `openai/gpt-5.4`                              | Provider OpenAI tramite plumbing OpenClaw/PI | Vuoi l'accesso attuale diretto all'API OpenAI Platform con `OPENAI_API_KEY`. |
| `openai-codex/gpt-5.5`                        | Percorso legacy riparato da doctor           | Sei su una vecchia configurazione; esegui `openclaw doctor --fix` per riscriverla. |
| `openai/gpt-5.5` + `agentRuntime.id: "codex"` | Harness del server applicativo Codex         | Vuoi l'autenticazione dell'abbonamento ChatGPT/Codex con esecuzione Codex nativa. |

GPT-5.5 può comparire sia nei percorsi con chiave API OpenAI diretta sia nei percorsi con abbonamento Codex
quando il tuo account li espone. Usa `openai/gpt-5.5` con l'harness del server applicativo Codex
per il runtime Codex nativo, oppure `openai/gpt-5.5` senza override del runtime Codex
per il traffico diretto con chiave API.

I riferimenti legacy `codex/gpt-*` restano accettati come alias di compatibilità. La migrazione di compatibilità
di doctor riscrive i riferimenti runtime legacy in riferimenti modello canonici
e registra separatamente la policy di runtime. Le nuove configurazioni dell'harness nativo del server applicativo
dovrebbero usare `openai/gpt-*` più `agentRuntime.id: "codex"`.

`agents.defaults.imageModel` segue la stessa distinzione di prefisso. Usa
`openai/gpt-*` per il percorso OpenAI normale e `codex/gpt-*` quando la comprensione
delle immagini deve passare attraverso un turno limitato del server applicativo Codex. Non usare
`openai-codex/gpt-*`; doctor riscrive quel prefisso legacy in `openai/gpt-*`. Il
modello del server applicativo Codex deve dichiarare il supporto all'input immagine; i modelli Codex
solo testo falliscono prima dell'avvio del turno media.

Usa `/status` per confermare l'harness effettivo della sessione corrente. Se la
selezione sorprende, abilita il logging di debug per il sottosistema `agents/harness`
e ispeziona il record strutturato `agent harness selected` del Gateway. Include
l'id dell'harness selezionato, il motivo della selezione, la policy runtime/fallback e,
in modalità `auto`, il risultato di supporto di ogni candidato plugin.

### Cosa significano gli avvisi di doctor

`openclaw doctor` avvisa quando i riferimenti modello configurati o lo stato del percorso delle sessioni persistite
usano ancora `openai-codex/*`. `openclaw doctor --fix` riscrive quei percorsi
in:

- `openai/<model>`
- `agentRuntime.id: "codex"` quando Codex è installato, abilitato, contribuisce
  l'harness `codex` e ha OAuth utilizzabile
- `agentRuntime.id: "pi"` altrimenti

Il percorso `codex` forza l'harness Codex nativo. Il percorso `pi` mantiene
l'agente sul runner OpenClaw predefinito invece di abilitare o installare Codex come
effetto collaterale della pulizia dei percorsi legacy.
Doctor ripara anche i pin obsoleti delle sessioni persistite negli store di sessioni agente rilevati,
così le vecchie conversazioni non restano bloccate sul percorso rimosso.

La selezione dell'ambiente di esecuzione non è un controllo di sessione live. Quando viene eseguito un turno incorporato,
OpenClaw registra l'id dell'ambiente selezionato su quella sessione e continua a usarlo per
i turni successivi nello stesso id di sessione. Modifica la configurazione `agentRuntime` o
`OPENCLAW_AGENT_RUNTIME` quando vuoi che le sessioni future usino un altro ambiente;
usa `/new` o `/reset` per avviare una nuova sessione prima di passare una conversazione
esistente da PI a Codex o viceversa. Questo evita di riprodurre una trascrizione attraverso
due sistemi di sessione nativi incompatibili.

Le sessioni legacy create prima dei pin dell'ambiente vengono trattate come vincolate a PI una volta che
hanno una cronologia della trascrizione. Usa `/new` o `/reset` per far aderire quella conversazione a
Codex dopo aver modificato la configurazione.

`/status` mostra il runtime effettivo del modello. L'ambiente PI predefinito appare come
`Runtime: OpenClaw Pi Default`, mentre l'ambiente app-server di Codex appare come
`Runtime: OpenAI Codex`.

## Requisiti

- OpenClaw con il Plugin `codex` incluso disponibile.
- App-server Codex `0.125.0` o più recente. Il Plugin incluso gestisce per impostazione predefinita un binario
  app-server Codex compatibile, quindi i comandi locali `codex` in `PATH` non
  influiscono sul normale avvio dell'ambiente.
- Autenticazione Codex disponibile per il processo app-server o per il bridge di autenticazione Codex
  di OpenClaw. Gli avvii locali dell'app-server usano una home Codex gestita da OpenClaw per ogni
  agente e un `HOME` figlio isolato, quindi per impostazione predefinita non leggono il tuo account
  personale `~/.codex`, Skills, Plugin, configurazione, stato dei thread o
  `$HOME/.agents/skills` nativo.

Il Plugin blocca handshake app-server più vecchi o senza versione. Questo mantiene
OpenClaw sulla superficie del protocollo contro cui è stato testato.

Per i test smoke live e Docker, l'autenticazione di solito proviene dall'account CLI Codex
o da un profilo di autenticazione OpenClaw `openai-codex`. Gli avvii locali dell'app-server stdio possono
anche fare fallback su `CODEX_API_KEY` / `OPENAI_API_KEY` quando non è presente alcun account.

## File di bootstrap dell'area di lavoro

Codex gestisce `AGENTS.md` autonomamente tramite il rilevamento nativo dei documenti di progetto. OpenClaw
non scrive file di documenti di progetto Codex sintetici né dipende dai nomi file di fallback di Codex
per i file persona, perché i fallback di Codex si applicano solo quando
`AGENTS.md` manca.

Per la parità dell'area di lavoro OpenClaw, l'ambiente Codex risolve gli altri file di bootstrap
(`SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`,
`BOOTSTRAP.md` e `MEMORY.md` quando presenti) e li inoltra attraverso le istruzioni sviluppatore
di Codex su `thread/start` e `thread/resume`. Questo mantiene
`SOUL.md` e il relativo contesto persona/profilo dell'area di lavoro visibili sulla corsia nativa
di modellazione del comportamento di Codex senza duplicare `AGENTS.md`.

## Aggiungere Codex insieme ad altri modelli

Non impostare `agentRuntime.id: "codex"` globalmente se lo stesso agente deve poter passare liberamente
tra Codex e modelli provider non Codex. Un runtime forzato si applica a ogni
turno incorporato per quell'agente o quella sessione. Se selezioni un modello Anthropic mentre
quel runtime è forzato, OpenClaw prova comunque l'ambiente Codex e fallisce chiudendo
invece di instradare silenziosamente quel turno attraverso PI.

Usa invece una di queste forme:

- Metti Codex su un agente dedicato con `agentRuntime.id: "codex"`.
- Mantieni l'agente predefinito su `agentRuntime.id: "auto"` e fallback PI per il normale uso misto
  dei provider.
- Usa i riferimenti legacy `codex/*` solo per compatibilità. Le nuove configurazioni dovrebbero preferire
  `openai/*` più una policy di runtime Codex esplicita.

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

- L'agente predefinito `main` usa il normale percorso del provider e il fallback di compatibilità PI.
- L'agente `codex` usa l'ambiente app-server Codex.
- Se Codex manca o non è supportato per l'agente `codex`, il turno fallisce
  invece di usare PI in modo silenzioso.

## Instradamento dei comandi degli agenti

Gli agenti dovrebbero instradare le richieste degli utenti in base all'intento, non solo in base alla parola "Codex":

| L'utente chiede di...                                  | L'agente dovrebbe usare...                       |
| ------------------------------------------------------ | ------------------------------------------------ |
| "Vincola questa chat a Codex"                          | `/codex bind`                                    |
| "Riprendi qui il thread Codex `<id>`"                  | `/codex resume <id>`                             |
| "Mostra i thread Codex"                                | `/codex threads`                                 |
| "Invia una segnalazione di supporto per un'esecuzione Codex errata" | `/diagnostics [note]`                            |
| "Invia feedback Codex solo per questo thread allegato" | `/codex diagnostics [note]`                      |
| "Usa il mio abbonamento ChatGPT/Codex con il runtime Codex" | `openai/*` più `agentRuntime.id: "codex"`        |
| "Ripara vecchi pin di configurazione/sessione `openai-codex/*`" | `openclaw doctor --fix`                          |
| "Esegui Codex tramite ACP/acpx"                        | ACP `sessions_spawn({ runtime: "acp", ... })`    |
| "Avvia Claude Code/Gemini/OpenCode/Cursor in un thread" | ACP/acpx, non `/codex` e non sub-agenti nativi   |

OpenClaw pubblicizza agli agenti le indicazioni di spawn ACP solo quando ACP è abilitato,
inviabile e supportato da un backend runtime caricato. Se ACP non è disponibile,
il prompt di sistema e le Skills del Plugin non dovrebbero insegnare all'agente l'instradamento
ACP.

## Distribuzioni solo Codex

Forza l'ambiente Codex quando devi dimostrare che ogni turno di agente incorporato
usa Codex. I runtime Plugin espliciti falliscono chiudendo e non vengono mai ritentati silenziosamente
tramite PI:

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

Override dell'ambiente:

```bash
OPENCLAW_AGENT_RUNTIME=codex openclaw gateway run
```

Con Codex forzato, OpenClaw fallisce in anticipo se il Plugin Codex è disabilitato, se
l'app-server è troppo vecchio o se l'app-server non può avviarsi.

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
sessione OpenClaw e l'ambiente Codex crea o riprende il proprio thread app-server
sidecar secondo necessità. `/reset` cancella il binding di sessione OpenClaw per quel thread
e lascia che il turno successivo risolva di nuovo l'ambiente dalla configurazione corrente.

## Rilevamento dei modelli

Per impostazione predefinita, il Plugin Codex chiede all'app-server i modelli disponibili. Se
il rilevamento fallisce o va in timeout, usa un catalogo di fallback incluso per:

- GPT-5.5
- GPT-5.4 mini
- GPT-5.2

Puoi regolare il rilevamento in `plugins.entries.codex.config.discovery`:

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

Disabilita il rilevamento quando vuoi che l'avvio eviti di sondare Codex e resti al
catalogo di fallback:

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

Per impostazione predefinita, il Plugin avvia localmente il binario Codex gestito da OpenClaw con:

```bash
codex app-server --listen stdio://
```

Il binario gestito viene distribuito con il pacchetto del Plugin `codex`. Questo mantiene la
versione dell'app-server legata al Plugin incluso invece che a qualunque CLI Codex separata
risulti installata localmente. Imposta `appServer.command` solo quando
vuoi intenzionalmente eseguire un eseguibile diverso.

Per impostazione predefinita, OpenClaw avvia le sessioni locali dell'ambiente Codex in modalità YOLO:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` e
`sandbox: "danger-full-access"`. Questa è la postura dell'operatore locale fidato usata
per Heartbeat autonomi: Codex può usare strumenti shell e di rete senza
fermarsi su prompt di approvazione nativi a cui non c'è nessuno disponibile a rispondere.

Per aderire alle approvazioni Codex revisionate da guardian, imposta `appServer.mode:
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

La modalità Guardian usa il percorso di approvazione con revisione automatica nativo di Codex. Quando Codex chiede di
uscire dalla sandbox, scrivere fuori dall'area di lavoro o aggiungere permessi come l'accesso
alla rete, Codex inoltra quella richiesta di approvazione al revisore nativo invece che a un
prompt umano. Il revisore applica il framework di rischio di Codex e approva o nega
la richiesta specifica. Usa Guardian quando vuoi più guardrail della modalità YOLO
ma hai comunque bisogno che agenti non presidiati facciano progressi.

Il preset `guardian` si espande in `approvalPolicy: "on-request"`,
`approvalsReviewer: "auto_review"` e `sandbox: "workspace-write"`.
I singoli campi della policy continuano a sovrascrivere `mode`, quindi le distribuzioni avanzate possono combinare
il preset con scelte esplicite. Il valore del revisore precedente `guardian_subagent` è
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
Il loader delle skill di Codex legge `$CODEX_HOME/skills` e
`$HOME/.agents/skills`, quindi entrambi i valori sono isolati per gli avvii locali dell'app-server.
Questo mantiene Skills native di Codex, Plugin, configurazione, account e stato dei thread
nell'ambito dell'agente OpenClaw invece di farli trapelare dalla home personale della
CLI Codex dell'operatore.

I Plugin OpenClaw e gli snapshot delle skill OpenClaw continuano a passare attraverso il registro Plugin e il loader delle skill
propri di OpenClaw. Gli asset personali della CLI Codex no. Se hai
Skills o Plugin utili della CLI Codex che dovrebbero diventare parte di un agente OpenClaw,
inventariali esplicitamente:

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

Il provider di migrazione Codex copia le Skills nell'area di lavoro dell'agente OpenClaw corrente.
I Plugin nativi Codex, gli hook e i file di configurazione vengono segnalati o archiviati
per revisione manuale invece di essere attivati automaticamente, perché possono
eseguire comandi, esporre server MCP o contenere credenziali.

L'autenticazione viene selezionata in questo ordine:

1. Un profilo di autenticazione Codex OpenClaw esplicito per l'agente.
2. L'account esistente dell'app-server nella home Codex di quell'agente.
3. Solo per gli avvii locali dell'app-server stdio, `CODEX_API_KEY`, poi
   `OPENAI_API_KEY`, quando non è presente alcun account app-server e l'autenticazione OpenAI è
   ancora richiesta.

Quando OpenClaw vede un profilo di autenticazione Codex in stile abbonamento ChatGPT, rimuove
`CODEX_API_KEY` e `OPENAI_API_KEY` dal processo figlio Codex avviato. Questo
mantiene disponibili le chiavi API a livello di Gateway per embeddings o modelli OpenAI diretti
senza far fatturare per errore tramite API i turni nativi del server applicativo Codex.
I profili Codex espliciti basati su chiave API e il fallback locale con chiave env su stdio usano il login del server applicativo
invece dell'ambiente ereditato del processo figlio. Le connessioni WebSocket al server applicativo
non ricevono il fallback della chiave API env del Gateway; usa un profilo di autenticazione esplicito o l'account
del server applicativo remoto.

Se un deployment richiede ulteriore isolamento dell'ambiente, aggiungi queste variabili a
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

`appServer.clearEnv` influisce solo sul processo figlio del server applicativo Codex avviato.

Gli strumenti dinamici di Codex usano per impostazione predefinita il profilo `native-first`. In quella modalità,
OpenClaw non espone strumenti dinamici che duplicano le operazioni native di Codex sul workspace:
`read`, `write`, `edit`, `apply_patch`, `exec`, `process` e
`update_plan`. Gli strumenti di integrazione OpenClaw come messaggistica, sessioni, media,
cron, browser, nodi, gateway, `heartbeat_respond` e `web_search` restano
disponibili.

Campi supportati del Plugin Codex di primo livello:

| Campo                      | Predefinito       | Significato                                                                                   |
| -------------------------- | ---------------- | ----------------------------------------------------------------------------------------- |
| `codexDynamicToolsProfile` | `"native-first"` | Usa `"openclaw-compat"` per esporre l'intero set di strumenti dinamici OpenClaw al server applicativo Codex. |
| `codexDynamicToolsExclude` | `[]`             | Nomi aggiuntivi di strumenti dinamici OpenClaw da omettere dai turni del server applicativo Codex.               |

Campi `appServer` supportati:

| Campo               | Predefinito                              | Significato                                                                                                                                                                                                                              |
| ------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `transport`         | `"stdio"`                                | `"stdio"` avvia Codex; `"websocket"` si connette a `url`.                                                                                                                                                                             |
| `command`           | binario Codex gestito                    | Eseguibile per il trasporto stdio. Lascialo non impostato per usare il binario gestito; impostalo solo per un override esplicito.                                                                                                                         |
| `args`              | `["app-server", "--listen", "stdio://"]` | Argomenti per il trasporto stdio.                                                                                                                                                                                                       |
| `url`               | non impostato                            | URL WebSocket del server applicativo.                                                                                                                                                                                                            |
| `authToken`         | non impostato                            | Token Bearer per il trasporto WebSocket.                                                                                                                                                                                                |
| `headers`           | `{}`                                     | Header WebSocket aggiuntivi.                                                                                                                                                                                                             |
| `clearEnv`          | `[]`                                     | Nomi di variabili d'ambiente aggiuntive rimossi dal processo stdio del server applicativo avviato dopo che OpenClaw ha costruito il suo ambiente ereditato. `CODEX_HOME` e `HOME` sono riservati all'isolamento Codex per agente di OpenClaw negli avvii locali. |
| `requestTimeoutMs`  | `60000`                                  | Timeout per le chiamate di control plane del server applicativo.                                                                                                                                                                                          |
| `mode`              | `"yolo"`                                 | Preset per esecuzione YOLO o revisionata dal guardian.                                                                                                                                                                                      |
| `approvalPolicy`    | `"never"`                                | Policy di approvazione nativa Codex inviata ad avvio/ripresa/turno del thread.                                                                                                                                                                       |
| `sandbox`           | `"danger-full-access"`                   | Modalità sandbox nativa Codex inviata ad avvio/ripresa del thread.                                                                                                                                                                               |
| `approvalsReviewer` | `"user"`                                 | Usa `"auto_review"` per consentire a Codex di revisionare le richieste di approvazione native. `guardian_subagent` resta un alias legacy.                                                                                                                         |
| `serviceTier`       | non impostato                            | Tier di servizio opzionale del server applicativo Codex: `"fast"`, `"flex"` o `null`. I valori legacy non validi vengono ignorati.                                                                                                                            |

Le chiamate agli strumenti dinamici di proprietà OpenClaw sono limitate indipendentemente da
`appServer.requestTimeoutMs`: ogni richiesta Codex `item/tool/call` deve ricevere
una risposta OpenClaw entro 30 secondi. In caso di timeout, OpenClaw interrompe il segnale
dello strumento dove supportato e restituisce a Codex una risposta di strumento dinamico non riuscita, così
il turno può continuare invece di lasciare la sessione in `processing`.

Dopo che OpenClaw risponde a una richiesta del server applicativo Codex con ambito di turno, l'harness
si aspetta anche che Codex completi il turno nativo con `turn/completed`. Se il
server applicativo resta silenzioso per 60 secondi dopo quella risposta, OpenClaw interrompe best-effort
il turno Codex, registra un timeout diagnostico e rilascia la corsia della sessione
OpenClaw in modo che i messaggi di chat successivi non restino in coda dietro un turno nativo obsoleto.

Gli override d'ambiente restano disponibili per i test locali:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN` bypassa il binario gestito quando
`appServer.command` non è impostato.

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` è stato rimosso. Usa invece
`plugins.entries.codex.config.appServer.mode: "guardian"`, oppure
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` per test locali una tantum. La configurazione è
preferibile per deployment ripetibili perché mantiene il comportamento del Plugin nello
stesso file revisionato del resto della configurazione dell'harness Codex.

## Uso del computer

L'uso del computer è trattato nella propria guida di configurazione:
[Uso del computer in Codex](/it/plugins/codex-computer-use).

La versione breve: OpenClaw non include come vendor l'app di controllo desktop né esegue
azioni desktop direttamente. Prepara il server applicativo Codex, verifica che il server MCP
`computer-use` sia disponibile e poi lascia che Codex gestisca le chiamate native agli strumenti
MCP durante i turni in modalità Codex.

Per accesso diretto al driver TryCua fuori dal flusso del marketplace Codex, registra
`cua-driver mcp` con `openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'`.
Vedi [Uso del computer in Codex](/it/plugins/codex-computer-use) per la distinzione
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

La configurazione può essere verificata o installata dalla superficie di comando:

- `/codex computer-use status`
- `/codex computer-use install`
- `/codex computer-use install --source <marketplace-source>`
- `/codex computer-use install --marketplace-path <path>`

L'uso del computer è specifico di macOS e può richiedere autorizzazioni locali del sistema operativo prima che il
server MCP Codex possa controllare le app. Se `computerUse.enabled` è true e il server MCP
non è disponibile, i turni in modalità Codex falliscono prima dell'avvio del thread invece di
essere eseguiti silenziosamente senza gli strumenti nativi di Uso del computer. Vedi
[Uso del computer in Codex](/it/plugins/codex-computer-use) per scelte di marketplace,
limiti del catalogo remoto, motivi di stato e risoluzione dei problemi.

Quando `computerUse.autoInstall` è true, OpenClaw può registrare il marketplace standard
Codex Desktop incluso da
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` se Codex
non ha ancora scoperto un marketplace locale. Usa `/new` o `/reset` dopo
aver cambiato la configurazione del runtime o dell'Uso del computer, così le sessioni esistenti non mantengono un vecchio
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

Server applicativo remoto con header espliciti:

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

Il cambio modello resta controllato da OpenClaw. Quando una sessione OpenClaw è collegata
a un thread Codex esistente, il turno successivo invia di nuovo al server applicativo
il modello OpenAI, il provider, la policy di approvazione, il sandbox e il tier di servizio
attualmente selezionati. Passare da `openai/gpt-5.5` a `openai/gpt-5.2` mantiene il
binding del thread ma chiede a Codex di continuare con il modello appena selezionato.

## Comando Codex

Il Plugin incluso registra `/codex` come comando slash autorizzato. È
generico e funziona su qualsiasi canale che supporti i comandi di testo OpenClaw.

Forme comuni:

- `/codex status` mostra connettività live dell'app-server, modelli, account, limiti di frequenza, server MCP e Skills.
- `/codex models` elenca i modelli live dell'app-server Codex.
- `/codex threads [filter]` elenca i thread Codex recenti.
- `/codex resume <thread-id>` collega la sessione OpenClaw corrente a un thread Codex esistente.
- `/codex compact` chiede all'app-server Codex di compattare il thread collegato.
- `/codex review` avvia la revisione nativa Codex per il thread collegato.
- `/codex diagnostics [note]` chiede conferma prima di inviare il feedback diagnostico Codex per il thread collegato.
- `/codex computer-use status` controlla il plugin Computer Use configurato e il server MCP.
- `/codex computer-use install` installa il plugin Computer Use configurato e ricarica i server MCP.
- `/codex account` mostra lo stato dell'account e dei limiti di frequenza.
- `/codex mcp` elenca lo stato dei server MCP dell'app-server Codex.
- `/codex skills` elenca le Skills dell'app-server Codex.

Quando Codex segnala un errore per limite di utilizzo, OpenClaw include il prossimo
orario di reimpostazione dell'app-server quando Codex ne ha fornito uno. Usa `/codex account` nella stessa
conversazione per esaminare l'account corrente e le finestre dei limiti di frequenza.

### Flusso di lavoro comune per il debug

Quando un agente basato su Codex fa qualcosa di inatteso in Telegram, Discord, Slack,
o in un altro canale, parti dalla conversazione in cui si è verificato il problema:

1. Esegui `/diagnostics bad tool choice after image upload` o un'altra breve nota
   che descriva ciò che hai osservato.
2. Approva la richiesta di diagnostica una volta. L'approvazione crea lo zip diagnostico
   del Gateway locale e, poiché la sessione usa l'harness Codex, invia anche
   il bundle di feedback Codex pertinente ai server OpenAI.
3. Copia la risposta diagnostica completata nella segnalazione di bug o nel thread di supporto.
   Include il percorso del bundle locale, il riepilogo privacy, gli ID sessione OpenClaw,
   gli ID thread Codex e una riga `Inspect locally` per ogni thread Codex.
4. Se vuoi eseguire il debug della run in autonomia, esegui il comando `Inspect locally`
   stampato in un terminale. Ha l'aspetto di `codex resume <thread-id>` e apre il
   thread Codex nativo, così puoi esaminare la conversazione, continuarla localmente,
   o chiedere a Codex perché ha scelto un determinato strumento o piano.

Usa `/codex diagnostics [note]` solo quando vuoi specificamente il caricamento del
feedback Codex per il thread attualmente collegato senza il bundle diagnostico completo del
Gateway OpenClaw. Per la maggior parte delle segnalazioni di supporto, `/diagnostics [note]` è
il punto di partenza migliore perché collega lo stato del Gateway locale e gli ID
thread Codex in un'unica risposta. Consulta [Esportazione diagnostica](/it/gateway/diagnostics)
per il modello privacy completo e il comportamento nelle chat di gruppo.

Il core OpenClaw espone anche `/diagnostics [note]`, solo per proprietari, come comando generale
di diagnostica del Gateway. Il suo prompt di approvazione mostra il preambolo sui dati sensibili,
collega a [Esportazione diagnostica](/it/gateway/diagnostics) e richiede
`openclaw gateway diagnostics export --json` tramite approvazione exec esplicita
ogni volta. Non approvare la diagnostica con una regola allow-all. Dopo l'approvazione,
OpenClaw invia un report incollabile con il percorso del bundle locale e il riepilogo
del manifest. Quando la sessione OpenClaw attiva usa l'harness Codex, quella
stessa approvazione autorizza anche l'invio dei bundle di feedback Codex pertinenti ai
server OpenAI. Il prompt di approvazione dice che il feedback Codex verrà inviato, ma
non elenca gli ID sessione o thread Codex prima dell'approvazione.

Se `/diagnostics` viene invocato da un proprietario in una chat di gruppo, OpenClaw mantiene pulito il
canale condiviso: il gruppo riceve solo un breve avviso, mentre il
preambolo diagnostico, i prompt di approvazione e gli ID sessione/thread Codex vengono inviati al
proprietario tramite il percorso di approvazione privato. Se non esiste un percorso proprietario privato,
OpenClaw rifiuta la richiesta di gruppo e chiede al proprietario di eseguirla da un DM.

Il caricamento Codex approvato chiama `feedback/upload` dell'app-server Codex e chiede
all'app-server di includere i log per ogni thread elencato e per i sottothread Codex generati
quando disponibili. Il caricamento passa attraverso il normale percorso di feedback di Codex verso i server
OpenAI; se il feedback Codex è disabilitato in quell'app-server, il comando restituisce
l'errore dell'app-server. La risposta diagnostica completata elenca i canali,
gli ID sessione OpenClaw, gli ID thread Codex e i comandi locali `codex resume <thread-id>`
per i thread inviati. Se rifiuti o ignori l'approvazione,
OpenClaw non stampa quegli ID Codex. Questo caricamento non sostituisce l'esportazione diagnostica
locale del Gateway.

`/codex resume` scrive lo stesso file di associazione sidecar che l'harness usa per
i turni normali. Al messaggio successivo, OpenClaw riprende quel thread Codex, passa il
modello OpenClaw attualmente selezionato all'app-server e mantiene abilitata la cronologia
estesa.

### Esaminare un thread Codex dalla CLI

Il modo più rapido per capire una run Codex errata è spesso aprire direttamente il thread
Codex nativo:

```sh
codex resume <thread-id>
```

Usalo quando noti un bug in una conversazione di canale e vuoi esaminare la
sessione Codex problematica, continuarla localmente o chiedere a Codex perché ha fatto una
particolare scelta di strumento o di ragionamento. Il percorso più semplice di solito è eseguire
prima `/diagnostics [note]`: dopo l'approvazione, il report completato elenca
ogni thread Codex e stampa un comando `Inspect locally`, per esempio
`codex resume <thread-id>`. Puoi copiare quel comando direttamente in un terminale.

Puoi anche ottenere un ID thread da `/codex binding` per la chat corrente o
`/codex threads [filter]` per i thread recenti dell'app-server Codex, quindi eseguire lo stesso
comando `codex resume` nella shell.

La superficie di comando richiede l'app-server Codex `0.125.0` o più recente. I singoli
metodi di controllo vengono segnalati come `unsupported by this Codex app-server` se un
app-server futuro o personalizzato non espone quel metodo JSON-RPC.

## Confini degli hook

L'harness Codex ha tre livelli di hook:

| Livello                               | Proprietario             | Scopo                                                               |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| Hook plugin OpenClaw                  | OpenClaw                 | Compatibilità prodotto/plugin tra harness PI e Codex.               |
| Middleware di estensione app-server Codex | Plugin in bundle OpenClaw | Comportamento adattatore per turno attorno agli strumenti dinamici OpenClaw. |
| Hook nativi Codex                     | Codex                    | Ciclo di vita Codex di basso livello e policy degli strumenti nativi dalla config Codex. |

OpenClaw non usa file Codex `hooks.json` di progetto o globali per instradare
il comportamento dei plugin OpenClaw. Per il bridge supportato di strumenti nativi e permessi,
OpenClaw inietta una config Codex per thread per `PreToolUse`, `PostToolUse`,
`PermissionRequest` e `Stop`. Altri hook Codex come `SessionStart` e
`UserPromptSubmit` restano controlli a livello Codex; non sono esposti come
hook plugin OpenClaw nel contratto v1.

Per gli strumenti dinamici OpenClaw, OpenClaw esegue lo strumento dopo che Codex richiede la
chiamata, quindi OpenClaw attiva il comportamento di plugin e middleware di cui è proprietario
nell'adattatore dell'harness. Per gli strumenti nativi Codex, Codex possiede il record canonico dello strumento.
OpenClaw può rispecchiare eventi selezionati, ma non può riscrivere il thread Codex nativo
a meno che Codex esponga quell'operazione tramite app-server o callback di hook
nativi.

Le proiezioni di Compaction e del ciclo di vita LLM provengono dalle notifiche dell'app-server Codex
e dallo stato dell'adattatore OpenClaw, non dai comandi hook nativi Codex.
Gli eventi `before_compaction`, `after_compaction`, `llm_input` e
`llm_output` di OpenClaw sono osservazioni a livello adattatore, non acquisizioni byte per byte
della richiesta interna di Codex o dei payload di Compaction.

Le notifiche app-server native Codex `hook/started` e `hook/completed` vengono
proiettate come eventi agente `codex_app_server.hook` per traiettoria e debug.
Non invocano hook plugin OpenClaw.

## Contratto di supporto v1

La modalità Codex non è PI con una diversa chiamata al modello sottostante. Codex possiede una parte maggiore
del loop modello nativo, e OpenClaw adatta le sue superfici di plugin e sessione
attorno a quel confine.

Supportato nel runtime Codex v1:

| Superficie                                     | Supporto                                | Perché                                                                                                                                                                                                |
| --------------------------------------------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Loop modello OpenAI tramite Codex             | Supportato                              | L'app-server Codex possiede il turno OpenAI, la ripresa del thread nativo e la continuazione degli strumenti nativi.                                                                                  |
| Instradamento e consegna dei canali OpenClaw  | Supportato                              | Telegram, Discord, Slack, WhatsApp, iMessage e altri canali restano fuori dal runtime del modello.                                                                                                    |
| Strumenti dinamici OpenClaw                   | Supportato                              | Codex chiede a OpenClaw di eseguire questi strumenti, quindi OpenClaw resta nel percorso di esecuzione.                                                                                               |
| Plugin di prompt e contesto                   | Supportato                              | OpenClaw crea overlay di prompt e proietta il contesto nel turno Codex prima di avviare o riprendere il thread.                                                                                       |
| Ciclo di vita del motore di contesto          | Supportato                              | Assemblaggio, ingestione o manutenzione dopo il turno, e coordinamento della Compaction del motore di contesto vengono eseguiti per i turni Codex.                                                     |
| Hook strumenti dinamici                       | Supportato                              | `before_tool_call`, `after_tool_call` e il middleware dei risultati strumento vengono eseguiti attorno agli strumenti dinamici di proprietà OpenClaw.                                                   |
| Hook del ciclo di vita                        | Supportato come osservazioni adattatore | `llm_input`, `llm_output`, `agent_end`, `before_compaction` e `after_compaction` vengono emessi con payload onesti della modalità Codex.                                                               |
| Gate di revisione della risposta finale       | Supportato tramite relay hook nativo    | Codex `Stop` viene inoltrato a `before_agent_finalize`; `revise` chiede a Codex un ulteriore passaggio del modello prima della finalizzazione.                                                         |
| Shell nativa, patch e blocco o osservazione MCP | Supportato tramite relay hook nativo  | Codex `PreToolUse` e `PostToolUse` vengono inoltrati per superfici di strumenti nativi confermate, inclusi i payload MCP sull'app-server Codex `0.125.0` o più recente. Il blocco è supportato; la riscrittura degli argomenti no. |
| Policy dei permessi nativi                    | Supportato tramite relay hook nativo    | Codex `PermissionRequest` può essere instradato attraverso la policy OpenClaw dove il runtime la espone. Se OpenClaw non restituisce alcuna decisione, Codex continua tramite il suo normale percorso guardian o di approvazione utente. |
| Acquisizione traiettoria app-server           | Supportato                              | OpenClaw registra la richiesta inviata all'app-server e le notifiche app-server che riceve.                                                                                                           |

Non supportato nel runtime Codex v1:

| Superficie                                         | Confine V1                                                                                                                                              | Percorso futuro                                                                                 |
| --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Mutazione degli argomenti degli strumenti nativi    | Gli hook pre-strumento nativi di Codex possono bloccare, ma OpenClaw non riscrive gli argomenti degli strumenti nativi di Codex.                        | Richiede supporto hook/schema di Codex per sostituire l'input dello strumento.                  |
| Cronologia della trascrizione nativa Codex editabile | Codex possiede la cronologia canonica nativa del thread. OpenClaw possiede un mirror e può proiettare contesto futuro, ma non deve mutare internals non supportati. | Aggiungere API esplicite dell'app-server Codex se serve intervenire chirurgicamente sul thread nativo. |
| `tool_result_persist` per record di strumenti nativi Codex | Quell'hook trasforma le scritture di trascrizione possedute da OpenClaw, non i record di strumenti nativi di Codex.                                    | Potrebbe rispecchiare i record trasformati, ma la riscrittura canonica richiede supporto Codex. |
| Metadati di compaction nativi ricchi                | OpenClaw osserva l'inizio e il completamento della compaction, ma non riceve un elenco stabile di elementi mantenuti/scartati, delta di token o payload di riepilogo. | Richiede eventi di compaction Codex più ricchi.                                                 |
| Intervento sulla compaction                         | Gli hook di compaction OpenClaw attuali sono a livello di notifica in modalità Codex.                                                                    | Aggiungere hook pre/post compaction di Codex se i plugin devono porre veto o riscrivere la compaction nativa. |
| Cattura byte-per-byte della richiesta API del modello | OpenClaw può catturare richieste e notifiche dell'app-server, ma il core Codex costruisce internamente la richiesta API OpenAI finale.                  | Richiede un evento di tracing della richiesta del modello Codex o una API di debug.             |

## Strumenti, media e compaction

L'harness Codex modifica solo l'esecutore dell'agente incorporato di basso livello.

OpenClaw costruisce ancora l'elenco degli strumenti e riceve i risultati dinamici degli strumenti dall'harness. Testo, immagini, video, musica, TTS, approvazioni e output dello strumento di messaggistica continuano attraverso il normale percorso di consegna di OpenClaw.

Il relay degli hook nativi è intenzionalmente generico, ma il contratto di supporto v1 è limitato ai percorsi di strumenti e permessi nativi di Codex testati da OpenClaw. Nel runtime Codex, ciò include i payload shell, patch e MCP `PreToolUse`, `PostToolUse` e `PermissionRequest`. Non dare per scontato che ogni futuro evento hook di Codex sia una superficie plugin OpenClaw finché il contratto runtime non lo nomina.

Per `PermissionRequest`, OpenClaw restituisce solo decisioni esplicite di consenso o rifiuto quando la policy decide. Un risultato senza decisione non è un consenso. Codex lo tratta come assenza di decisione dell'hook e passa al proprio guardian o al percorso di approvazione dell'utente.

Le richieste di approvazione degli strumenti MCP di Codex vengono instradate attraverso il flusso di approvazione plugin di OpenClaw quando Codex imposta `_meta.codex_approval_kind` su `"mcp_tool_call"`. I prompt Codex `request_user_input` vengono inviati di nuovo alla chat di origine e il successivo messaggio di follow-up in coda risponde a quella richiesta nativa del server invece di essere indirizzato come contesto aggiuntivo. Le altre richieste di elicitation MCP continuano a fallire chiuse.

L'indirizzamento della coda di esecuzione attiva mappa su `turn/steer` dell'app-server Codex. Con il valore predefinito `messages.queue.mode: "steer"`, OpenClaw raggruppa i messaggi chat in coda per la finestra di silenzio configurata e li invia come una richiesta `turn/steer` in ordine di arrivo. La modalità legacy `queue` invia richieste `turn/steer` separate. I turni di revisione Codex e compaction manuale possono rifiutare l'indirizzamento nello stesso turno; in tal caso OpenClaw usa la coda di follow-up quando la modalità selezionata consente il fallback. Vedi [Coda di indirizzamento](/it/concepts/queue-steering).

Quando il modello selezionato usa l'harness Codex, la compaction del thread nativo viene delegata all'app-server Codex. OpenClaw mantiene un mirror della trascrizione per cronologia del canale, ricerca, `/new`, `/reset` e futuri cambi di modello o harness. Il mirror include il prompt dell'utente, il testo finale dell'assistente e record leggeri di ragionamento o piano Codex quando l'app-server li emette. Oggi OpenClaw registra solo i segnali di inizio e completamento della compaction nativa. Non espone ancora un riepilogo leggibile della compaction o un elenco verificabile di quali voci Codex ha mantenuto dopo la compaction.

Poiché Codex possiede il thread nativo canonico, `tool_result_persist` al momento non riscrive i record dei risultati degli strumenti nativi di Codex. Si applica solo quando OpenClaw sta scrivendo il risultato di uno strumento della trascrizione di una sessione posseduta da OpenClaw.

La generazione di media non richiede PI. Immagini, video, musica, PDF, TTS e comprensione dei media continuano a usare le impostazioni provider/modello corrispondenti come `agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel` e `messages.tts`.

## Risoluzione dei problemi

**Codex non appare come un normale provider `/model`:** questo è previsto per le nuove configurazioni. Seleziona un modello `openai/gpt-*` con `agentRuntime.id: "codex"` (o un riferimento legacy `codex/*`), abilita `plugins.entries.codex.enabled` e verifica se `plugins.allow` esclude `codex`.

**OpenClaw usa PI invece di Codex:** `agentRuntime.id: "auto"` può ancora usare PI come backend di compatibilità quando nessun harness Codex rivendica l'esecuzione. Imposta `agentRuntime.id: "codex"` per forzare la selezione di Codex durante i test. Un runtime Codex forzato fallisce invece di ripiegare su PI. Una volta selezionato l'app-server Codex, i suoi errori emergono direttamente.

**L'app-server viene rifiutato:** aggiorna Codex affinché l'handshake dell'app-server riporti la versione `0.125.0` o successiva. Prerelease della stessa versione o versioni con suffisso di build come `0.125.0-alpha.2` o `0.125.0+custom` vengono rifiutate perché il livello minimo del protocollo stabile `0.125.0` è ciò che OpenClaw testa.

**La scoperta dei modelli è lenta:** riduci `plugins.entries.codex.config.discovery.timeoutMs` o disabilita la scoperta.

**Il trasporto WebSocket fallisce immediatamente:** controlla `appServer.url`, `authToken` e che l'app-server remoto parli la stessa versione del protocollo app-server Codex.

**Un modello non Codex usa PI:** questo è previsto a meno che tu non abbia forzato `agentRuntime.id: "codex"` per quell'agente o selezionato un riferimento legacy `codex/*`. I riferimenti semplici `openai/gpt-*` e di altri provider restano sul loro normale percorso provider in modalità `auto`. Se forzi `agentRuntime.id: "codex"`, ogni turno incorporato per quell'agente deve essere un modello OpenAI supportato da Codex.

**Computer Use è installato ma gli strumenti non vengono eseguiti:** controlla `/codex computer-use status` da una nuova sessione. Se uno strumento riporta `Native hook relay unavailable`, usa `/new` o `/reset`; se persiste, riavvia il gateway per eliminare le registrazioni stale degli hook nativi. Se `computer-use.list_apps` va in timeout, riavvia Codex Computer Use o Codex Desktop e riprova.

## Correlati

- [Plugin harness agente](/it/plugins/sdk-agent-harness)
- [Runtime agente](/it/concepts/agent-runtimes)
- [Provider di modelli](/it/concepts/model-providers)
- [Provider OpenAI](/it/providers/openai)
- [Stato](/it/cli/status)
- [Hook Plugin](/it/plugins/hooks)
- [Riferimento di configurazione](/it/gateway/configuration-reference)
- [Test](/it/help/testing-live#live-codex-app-server-harness-smoke)
