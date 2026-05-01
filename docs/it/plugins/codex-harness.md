---
read_when:
    - Vuoi usare l'harness app-server Codex incluso
    - Ti servono esempi di configurazione dell’ambiente di esecuzione di Codex
    - Vuoi che le distribuzioni solo Codex falliscano invece di ripiegare su PI
summary: Esegui i turni dell'agente integrato di OpenClaw tramite l'ambiente app-server di Codex incluso
title: Ambiente di esecuzione Codex
x-i18n:
    generated_at: "2026-05-01T08:32:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: 740e8fa9e6f4a737dfd250fe26b85865a7f7e40839b41e879e9224a45cbe8d72
    source_path: plugins/codex-harness.md
    workflow: 16
---

Il plugin `codex` in bundle consente a OpenClaw di eseguire turni di agente incorporati tramite l'app-server
Codex invece dell'harness PI integrato.

Usalo quando vuoi che Codex gestisca la sessione agente di basso livello: rilevamento dei modelli, ripresa nativa del thread, compaction nativa ed esecuzione tramite app-server.
OpenClaw continua a gestire canali di chat, file di sessione, selezione dei modelli, strumenti, approvazioni, consegna dei media e il mirror visibile della trascrizione.

Se stai cercando di orientarti, inizia da
[Runtime degli agenti](/it/concepts/agent-runtimes). In breve:
`openai/gpt-5.5` è il riferimento del modello, `codex` è il runtime, e Telegram,
Discord, Slack o un altro canale resta la superficie di comunicazione.

## Configurazione rapida

Per usare l'harness Codex per i turni agente GPT, mantieni il riferimento del modello canonico come
`openai/gpt-*`, abilita il plugin `codex` in bundle e imposta
`agentRuntime.id: "codex"`:

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
        fallback: "none",
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

Non usare `openai-codex/gpt-*` per questo percorso. Questo seleziona Codex OAuth tramite
il normale runner PI, a meno che tu non forzi separatamente un runtime. Le modifiche di configurazione si applicano
alle sessioni nuove o reimpostate; le sessioni esistenti mantengono il runtime registrato.

## Cosa cambia questo plugin

Il plugin `codex` in bundle contribuisce diverse capacità separate:

| Capacità                          | Come usarla                                         | Cosa fa                                                                       |
| --------------------------------- | --------------------------------------------------- | ----------------------------------------------------------------------------- |
| Runtime incorporato nativo        | `agentRuntime.id: "codex"`                          | Esegue i turni agente incorporati di OpenClaw tramite l'app-server Codex.     |
| Comandi nativi di controllo chat  | `/codex bind`, `/codex resume`, `/codex steer`, ... | Associa e controlla thread dell'app-server Codex da una conversazione di messaggistica. |
| Provider/catalogo app-server Codex | elementi interni di `codex`, esposti tramite l'harness | Consente al runtime di rilevare e validare i modelli dell'app-server.         |
| Percorso di comprensione media Codex | percorsi di compatibilità per modelli immagine `codex/*` | Esegue turni limitati dell'app-server Codex per i modelli di comprensione immagini supportati. |
| Relay di hook nativo              | Hook del plugin attorno a eventi nativi Codex       | Consente a OpenClaw di osservare/bloccare eventi supportati di strumenti/finalizzazione nativi Codex. |

Abilitare il plugin rende disponibili queste capacità. **Non**:

- inizia a usare Codex per ogni modello OpenAI
- converte i riferimenti modello `openai-codex/*` nel runtime nativo
- rende ACP/acpx il percorso Codex predefinito
- cambia a caldo sessioni esistenti che hanno già registrato un runtime PI
- sostituisce la consegna sui canali OpenClaw, i file di sessione, l'archiviazione dei profili di autenticazione o
  l'instradamento dei messaggi

Lo stesso plugin possiede anche la superficie nativa dei comandi di controllo chat `/codex`. Se
il plugin è abilitato e l'utente chiede di associare, riprendere, orientare, fermare o ispezionare
thread Codex dalla chat, gli agenti dovrebbero preferire `/codex ...` rispetto ad ACP. ACP resta
il fallback esplicito quando l'utente chiede ACP/acpx o sta testando l'adapter ACP
Codex.

I turni nativi Codex mantengono gli hook dei plugin OpenClaw come livello pubblico di compatibilità.
Questi sono hook OpenClaw in-process, non hook di comando Codex `hooks.json`:

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `before_tool_call`, `after_tool_call`
- `before_message_write` per i record della trascrizione con mirror
- `before_agent_finalize` tramite relay Codex `Stop`
- `agent_end`

I plugin possono anche registrare middleware dei risultati degli strumenti neutrale rispetto al runtime per riscrivere
i risultati degli strumenti dinamici di OpenClaw dopo che OpenClaw ha eseguito lo strumento e prima che il
risultato venga restituito a Codex. Questo è separato dall'hook pubblico del plugin
`tool_result_persist`, che trasforma le scritture dei risultati degli strumenti nella trascrizione di proprietà di OpenClaw.

Per la semantica degli hook del plugin, vedi [Hook dei plugin](/it/plugins/hooks)
e [Comportamento delle guardie dei plugin](/it/tools/plugin).

L'harness è disattivato per impostazione predefinita. Le nuove configurazioni dovrebbero mantenere canonici i riferimenti dei modelli OpenAI
come `openai/gpt-*` e forzare esplicitamente
`agentRuntime.id: "codex"` o `OPENCLAW_AGENT_RUNTIME=codex` quando
vogliono l'esecuzione nativa tramite app-server. I riferimenti modello legacy `codex/*` selezionano ancora automaticamente
l'harness per compatibilità, ma i prefissi legacy dei provider supportati da runtime non sono
mostrati come normali scelte modello/provider.

Se il plugin `codex` è abilitato ma il modello primario è ancora
`openai-codex/*`, `openclaw doctor` avvisa invece di cambiare il percorso. È
intenzionale: `openai-codex/*` resta il percorso PI Codex OAuth/abbonamento, e
l'esecuzione nativa tramite app-server resta una scelta di runtime esplicita.

## Mappa dei percorsi

Usa questa tabella prima di modificare la configurazione:

| Comportamento desiderato                    | Riferimento modello       | Configurazione runtime                | Requisito plugin            | Etichetta di stato prevista    |
| ------------------------------------------- | -------------------------- | -------------------------------------- | --------------------------- | ------------------------------ |
| API OpenAI tramite il normale runner OpenClaw | `openai/gpt-*`             | omesso o `runtime: "pi"`               | Provider OpenAI             | `Runtime: OpenClaw Pi Default` |
| OAuth/abbonamento Codex tramite PI          | `openai-codex/gpt-*`       | omesso o `runtime: "pi"`               | Provider OpenAI Codex OAuth | `Runtime: OpenClaw Pi Default` |
| Turni incorporati nativi dell'app-server Codex | `openai/gpt-*`             | `agentRuntime.id: "codex"`             | plugin `codex`              | `Runtime: OpenAI Codex`        |
| Provider misti con modalità auto conservativa | riferimenti specifici del provider | `agentRuntime.id: "auto"`              | Runtime plugin opzionali    | Dipende dal runtime selezionato |
| Sessione esplicita dell'adapter ACP Codex   | dipendente da prompt/modello ACP | `sessions_spawn` con `runtime: "acp"`  | backend `acpx` integro      | Stato attività/sessione ACP    |

La distinzione importante è provider contro runtime:

- `openai-codex/*` risponde a "quale percorso provider/autenticazione dovrebbe usare PI?"
- `agentRuntime.id: "codex"` risponde a "quale loop dovrebbe eseguire questo
  turno incorporato?"
- `/codex ...` risponde a "a quale conversazione nativa Codex dovrebbe associarsi
  o quale dovrebbe controllare questa chat?"
- ACP risponde a "quale processo harness esterno dovrebbe avviare acpx?"

## Scegli il prefisso modello corretto

I percorsi della famiglia OpenAI dipendono dal prefisso. Usa `openai-codex/*` quando vuoi
Codex OAuth tramite PI; usa `openai/*` quando vuoi accesso diretto all'API OpenAI o
quando stai forzando l'harness nativo dell'app-server Codex:

| Riferimento modello                          | Percorso runtime                             | Quando usarlo                                                             |
| --------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------- |
| `openai/gpt-5.4`                              | Provider OpenAI tramite plumbing OpenClaw/PI | Vuoi accesso diretto corrente all'API OpenAI Platform con `OPENAI_API_KEY`. |
| `openai-codex/gpt-5.5`                        | OpenAI Codex OAuth tramite OpenClaw/PI       | Vuoi autenticazione con abbonamento ChatGPT/Codex usando il runner PI predefinito. |
| `openai/gpt-5.5` + `agentRuntime.id: "codex"` | Harness app-server Codex                     | Vuoi l'esecuzione nativa dell'app-server Codex per il turno agente incorporato. |

GPT-5.5 è attualmente solo abbonamento/OAuth in OpenClaw. Usa
`openai-codex/gpt-5.5` per PI OAuth, oppure `openai/gpt-5.5` con l'harness
app-server Codex. L'accesso diretto con chiave API per `openai/gpt-5.5` è supportato
quando OpenAI abilita GPT-5.5 sull'API pubblica.

I riferimenti legacy `codex/gpt-*` restano accettati come alias di compatibilità. La migrazione di compatibilità
di Doctor riscrive i riferimenti runtime primari legacy in riferimenti modello canonici
e registra separatamente la policy runtime, mentre i riferimenti legacy solo di fallback
restano invariati perché il runtime è configurato per l'intero contenitore agente.
Le nuove configurazioni PI Codex OAuth dovrebbero usare `openai-codex/gpt-*`; le nuove configurazioni native
dell'harness app-server dovrebbero usare `openai/gpt-*` più
`agentRuntime.id: "codex"`.

`agents.defaults.imageModel` segue la stessa distinzione di prefisso. Usa
`openai-codex/gpt-*` quando la comprensione delle immagini deve passare attraverso il percorso del provider OpenAI
Codex OAuth. Usa `codex/gpt-*` quando la comprensione delle immagini deve essere eseguita
tramite un turno limitato dell'app-server Codex. Il modello app-server Codex deve
dichiarare il supporto dell'input immagine; i modelli Codex solo testo falliscono prima dell'avvio del turno
media.

Usa `/status` per confermare l'harness effettivo per la sessione corrente. Se la
selezione sorprende, abilita il logging di debug per il sottosistema `agents/harness`
e ispeziona il record strutturato `agent harness selected` del gateway. Include
l'id dell'harness selezionato, il motivo della selezione, la policy runtime/fallback e,
in modalità `auto`, il risultato di supporto di ciascun candidato plugin.

### Cosa significano gli avvisi di doctor

`openclaw doctor` avvisa quando tutte queste condizioni sono vere:

- il plugin `codex` in bundle è abilitato o consentito
- il modello primario di un agente è `openai-codex/*`
- il runtime effettivo di quell'agente non è `codex`

Questo avviso esiste perché gli utenti spesso si aspettano che "plugin Codex abilitato" implichi
"runtime nativo dell'app-server Codex." OpenClaw non fa questo salto. L'avviso
significa:

- **Non è richiesta alcuna modifica** se intendevi usare ChatGPT/Codex OAuth tramite PI.
- Cambia il modello in `openai/<model>` e imposta
  `agentRuntime.id: "codex"` se intendevi l'esecuzione nativa tramite app-server.
- Le sessioni esistenti richiedono ancora `/new` o `/reset` dopo una modifica del runtime,
  perché i pin del runtime di sessione sono persistenti.

La selezione dell'harness non è un controllo di sessione live. Quando un turno incorporato viene eseguito,
OpenClaw registra l'id dell'harness selezionato su quella sessione e continua a usarlo per
i turni successivi nello stesso id sessione. Modifica la configurazione `agentRuntime` o
`OPENCLAW_AGENT_RUNTIME` quando vuoi che le sessioni future usino un altro harness;
usa `/new` o `/reset` per avviare una nuova sessione prima di cambiare una conversazione esistente
tra PI e Codex. Questo evita di riprodurre una trascrizione attraverso
due sistemi di sessione nativi incompatibili.

Le sessioni legacy create prima dei pin dell'harness sono trattate come bloccate su PI quando
hanno già cronologia di trascrizione. Usa `/new` o `/reset` per far optare quella conversazione per
Codex dopo aver modificato la configurazione.

`/status` mostra il runtime modello effettivo. L'harness PI predefinito appare come
`Runtime: OpenClaw Pi Default`, e l'harness app-server Codex appare come
`Runtime: OpenAI Codex`.

## Requisiti

- OpenClaw con il plugin `codex` in bundle disponibile.
- App-server Codex `0.125.0` o più recente. Il plugin in bundle gestisce per impostazione predefinita un binario
  app-server Codex compatibile, quindi i comandi locali `codex` su `PATH` non
  influiscono sul normale avvio dell'harness.
- Autenticazione Codex disponibile per il processo app-server o per il bridge di autenticazione Codex
  di OpenClaw. Gli avvii locali dell'app-server stdio usano una home Codex gestita da OpenClaw per ciascun
  agente e un `HOME` figlio isolato, quindi per impostazione predefinita non leggono il tuo account
  personale `~/.codex`, skills, plugin, configurazione, stato thread o
  `$HOME/.agents/skills` nativi.

Il plugin blocca handshake app-server più vecchi o senza versione. Questo mantiene
OpenClaw sulla superficie di protocollo contro cui è stato testato.

Per i test smoke live e Docker, l'autenticazione di solito arriva dall'account CLI Codex
o da un profilo di autenticazione OpenClaw `openai-codex`. Gli avvii locali dell'app-server stdio possono
anche ricorrere a `CODEX_API_KEY` / `OPENAI_API_KEY` quando non è presente alcun account.

## Aggiungi Codex insieme ad altri modelli

Non impostare `agentRuntime.id: "codex"` globalmente se lo stesso agente deve poter passare liberamente
tra Codex e modelli di provider non Codex. Un runtime forzato si applica a ogni
turno incorporato per quell'agente o sessione. Se selezioni un modello Anthropic mentre
quel runtime è forzato, OpenClaw prova comunque l'harness Codex e fallisce in modo chiuso
invece di instradare silenziosamente quel turno tramite PI.

Usa invece una di queste forme:

- Metti Codex su un agente dedicato con `agentRuntime.id: "codex"`.
- Mantieni l'agente predefinito su `agentRuntime.id: "auto"` e fallback PI per il normale uso misto
  dei provider.
- Usa i riferimenti legacy `codex/*` solo per compatibilità. Le nuove configurazioni dovrebbero preferire
  `openai/*` più una policy esplicita per il runtime Codex.

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
        fallback: "pi",
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

- L'agente `main` predefinito usa il normale percorso del provider e il fallback di compatibilità PI.
- L'agente `codex` usa l'harness dell'app-server Codex.
- Se Codex manca o non è supportato per l'agente `codex`, il turno fallisce
  invece di usare silenziosamente PI.

## Instradamento dei comandi dell'agente

Gli agenti dovrebbero instradare le richieste degli utenti in base all'intento, non solo in base alla parola "Codex":

| L'utente chiede...                                      | L'agente dovrebbe usare...                       |
| -------------------------------------------------------- | ------------------------------------------------ |
| "Associa questa chat a Codex"                            | `/codex bind`                                    |
| "Riprendi qui il thread Codex `<id>`"                    | `/codex resume <id>`                             |
| "Mostra i thread Codex"                                  | `/codex threads`                                 |
| "Invia una segnalazione di supporto per un'esecuzione Codex non riuscita" | `/diagnostics [note]`                            |
| "Invia solo feedback Codex per questo thread allegato"   | `/codex diagnostics [note]`                      |
| "Usa Codex come runtime per questo agente"               | modifica di configurazione a `agentRuntime.id`   |
| "Usa il mio abbonamento ChatGPT/Codex con OpenClaw normale" | riferimenti modello `openai-codex/*`             |
| "Esegui Codex tramite ACP/acpx"                          | ACP `sessions_spawn({ runtime: "acp", ... })`    |
| "Avvia Claude Code/Gemini/OpenCode/Cursor in un thread"  | ACP/acpx, non `/codex` e non sub-agenti nativi   |

OpenClaw pubblicizza agli agenti le indicazioni di spawn ACP solo quando ACP è abilitato,
instradabile e supportato da un backend runtime caricato. Se ACP non è disponibile,
il prompt di sistema e le Skills del plugin non dovrebbero istruire l'agente
sull'instradamento ACP.

## Distribuzioni solo Codex

Forza l'harness Codex quando devi dimostrare che ogni turno agente incorporato
usa Codex. I runtime dei plugin espliciti hanno per impostazione predefinita nessun fallback PI, quindi
`fallback: "none"` è facoltativo ma spesso utile come documentazione:

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      agentRuntime: {
        id: "codex",
        fallback: "none",
      },
    },
  },
}
```

Override di ambiente:

```bash
OPENCLAW_AGENT_RUNTIME=codex openclaw gateway run
```

Con Codex forzato, OpenClaw fallisce in anticipo se il plugin Codex è disabilitato, se
l'app-server è troppo vecchio o se l'app-server non può avviarsi. Imposta
`OPENCLAW_AGENT_HARNESS_FALLBACK=pi` solo se vuoi intenzionalmente che PI gestisca
la selezione dell'harness mancante.

## Codex per agente

Puoi rendere un agente solo Codex mentre l'agente predefinito mantiene la normale
selezione automatica:

```json5
{
  agents: {
    defaults: {
      agentRuntime: {
        id: "auto",
        fallback: "pi",
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
          fallback: "none",
        },
      },
    ],
  },
}
```

Usa i normali comandi di sessione per cambiare agenti e modelli. `/new` crea una nuova
sessione OpenClaw e l'harness Codex crea o riprende il proprio thread app-server sidecar
secondo necessità. `/reset` cancella l'associazione della sessione OpenClaw per quel thread
e consente al turno successivo di risolvere nuovamente l'harness dalla configurazione corrente.

## Rilevamento dei modelli

Per impostazione predefinita, il plugin Codex chiede all'app-server i modelli disponibili. Se
il rilevamento fallisce o va in timeout, usa un catalogo di fallback incluso per:

- GPT-5.5
- GPT-5.4 mini
- GPT-5.2

Puoi regolare il rilevamento sotto `plugins.entries.codex.config.discovery`:

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

Disabilita il rilevamento quando vuoi che l'avvio eviti di sondare Codex e resti sul
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

Per impostazione predefinita, il plugin avvia localmente il binario Codex gestito da OpenClaw con:

```bash
codex app-server --listen stdio://
```

Il binario gestito è dichiarato come dipendenza runtime del plugin inclusa e preparato
con il resto delle dipendenze del plugin `codex`. Questo mantiene la versione dell'app-server
legata al plugin incluso invece che a qualunque CLI Codex separata
risulti installata localmente. Imposta `appServer.command` solo quando
vuoi intenzionalmente eseguire un eseguibile diverso.

Per impostazione predefinita, OpenClaw avvia le sessioni locali dell'harness Codex in modalità YOLO:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` e
`sandbox: "danger-full-access"`. Questa è la postura dell'operatore locale fidato usata
per Heartbeat autonomi: Codex può usare strumenti shell e di rete senza
fermarsi su prompt di approvazione nativi a cui nessuno è presente per rispondere.

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

La modalità guardian usa il percorso di approvazione con revisione automatica nativo di Codex. Quando Codex chiede di
uscire dalla sandbox, scrivere fuori dal workspace o aggiungere permessi come l'accesso
alla rete, Codex instrada quella richiesta di approvazione al revisore nativo invece che a un
prompt umano. Il revisore applica il framework di rischio di Codex e approva o nega
la richiesta specifica. Usa Guardian quando vuoi più protezioni rispetto alla modalità YOLO
ma hai comunque bisogno che agenti non presidiati avanzino.

Il preset `guardian` si espande in `approvalPolicy: "on-request"`,
`approvalsReviewer: "auto_review"` e `sandbox: "workspace-write"`.
I singoli campi di policy continuano a sovrascrivere `mode`, quindi le distribuzioni avanzate possono combinare
il preset con scelte esplicite. Il valore revisore precedente `guardian_subagent` è
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
`CODEX_HOME` sia `HOME` su directory per agente nello stato OpenClaw
di quell'agente. Il caricatore di Skills proprio di Codex legge `$CODEX_HOME/skills` e
`$HOME/.agents/skills`, quindi entrambi i valori sono isolati per gli avvii locali dell'app-server.
Questo mantiene Skills native di Codex, plugin, configurazione, account e stato dei thread
nell'ambito dell'agente OpenClaw invece di farli trapelare dalla home CLI Codex
personale dell'operatore.

I plugin OpenClaw e gli snapshot delle Skills OpenClaw continuano a fluire attraverso il registro
dei plugin e il caricatore di Skills propri di OpenClaw. Gli asset personali della CLI Codex no. Se hai
Skills o plugin della CLI Codex utili che dovrebbero diventare parte di un agente OpenClaw,
inventariali esplicitamente:

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

Il provider di migrazione Codex copia le Skills nel workspace dell'agente OpenClaw corrente.
I plugin, gli hook e i file di configurazione nativi Codex vengono segnalati o archiviati
per revisione manuale invece di essere attivati automaticamente, perché possono
eseguire comandi, esporre server MCP o contenere credenziali.

L'autenticazione viene selezionata in questo ordine:

1. Un profilo di autenticazione OpenClaw Codex esplicito per l'agente.
2. L'account esistente dell'app-server nella home Codex di quell'agente.
3. Solo per gli avvii locali dell'app-server stdio, `CODEX_API_KEY`, poi
   `OPENAI_API_KEY`, quando non è presente alcun account app-server e l'autenticazione OpenAI è
   ancora richiesta.

Quando OpenClaw vede un profilo di autenticazione Codex in stile abbonamento ChatGPT, rimuove
`CODEX_API_KEY` e `OPENAI_API_KEY` dal processo figlio Codex generato. Questo
mantiene disponibili le chiavi API a livello Gateway per embeddings o modelli OpenAI diretti
senza far sì che i turni dell'app-server Codex nativo vengano fatturati tramite l'API per errore.
I profili Codex espliciti con chiave API e il fallback locale con chiave env stdio usano il login app-server
invece dell'env del processo figlio ereditato. Le connessioni WebSocket all'app-server
non ricevono il fallback con chiave API env del Gateway; usa un profilo di autenticazione esplicito o
l'account proprio dell'app-server remoto.

Se una distribuzione richiede ulteriore isolamento dell'ambiente, aggiungi quelle variabili a
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

`appServer.clearEnv` influisce solo sul processo figlio app-server Codex generato.

Campi `appServer` supportati:

| Campo               | Predefinito                             | Significato                                                                                                                                                                                                                         |
| ------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `transport`         | `"stdio"`                                | `"stdio"` avvia Codex; `"websocket"` si connette a `url`.                                                                                                                                                                            |
| `command`           | binario Codex gestito                    | Eseguibile per il trasporto stdio. Lascialo non impostato per usare il binario gestito; impostalo solo per una sostituzione esplicita.                                                                                               |
| `args`              | `["app-server", "--listen", "stdio://"]` | Argomenti per il trasporto stdio.                                                                                                                                                                                                    |
| `url`               | non impostato                            | URL dell'app-server WebSocket.                                                                                                                                                                                                       |
| `authToken`         | non impostato                            | Token Bearer per il trasporto WebSocket.                                                                                                                                                                                             |
| `headers`           | `{}`                                     | Header WebSocket aggiuntivi.                                                                                                                                                                                                         |
| `clearEnv`          | `[]`                                     | Nomi di variabili d'ambiente aggiuntive rimosse dal processo app-server stdio avviato dopo che OpenClaw ha creato il suo ambiente ereditato. `CODEX_HOME` e `HOME` sono riservati all'isolamento Codex per agente di OpenClaw negli avvii locali. |
| `requestTimeoutMs`  | `60000`                                  | Timeout per le chiamate del control plane dell'app-server.                                                                                                                                                                           |
| `mode`              | `"yolo"`                                 | Preset per l'esecuzione YOLO o revisionata da guardian.                                                                                                                                                                              |
| `approvalPolicy`    | `"never"`                                | Criterio di approvazione nativo di Codex inviato all'avvio, alla ripresa o al turno del thread.                                                                                                                                      |
| `sandbox`           | `"danger-full-access"`                   | Modalità sandbox nativa di Codex inviata all'avvio o alla ripresa del thread.                                                                                                                                                        |
| `approvalsReviewer` | `"user"`                                 | Usa `"auto_review"` per lasciare che Codex revisioni i prompt di approvazione nativi. `guardian_subagent` rimane un alias legacy.                                                                                                    |
| `serviceTier`       | non impostato                            | Livello di servizio facoltativo dell'app-server Codex: `"fast"`, `"flex"` o `null`. I valori legacy non validi vengono ignorati.                                                                                                     |

Le chiamate dinamiche agli strumenti gestite da OpenClaw sono limitate in modo indipendente da
`appServer.requestTimeoutMs`: ogni richiesta Codex `item/tool/call` deve ricevere
una risposta OpenClaw entro 30 secondi. Al timeout, OpenClaw interrompe il segnale
dello strumento quando supportato e restituisce a Codex una risposta di strumento dinamico non riuscita, così
il turno può continuare invece di lasciare la sessione in `processing`.

Dopo che OpenClaw risponde a una richiesta app-server con ambito di turno di Codex, l'harness
si aspetta anche che Codex termini il turno nativo con `turn/completed`. Se
l'app-server rimane silenzioso per 60 secondi dopo quella risposta, OpenClaw interrompe al meglio
il turno Codex, registra un timeout diagnostico e libera la corsia della sessione
OpenClaw così i messaggi di chat successivi non restano in coda dietro un turno nativo
obsoleto.

Le sostituzioni d'ambiente restano disponibili per i test locali:

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
preferibile per distribuzioni ripetibili perché mantiene il comportamento del plugin nello
stesso file revisionato del resto della configurazione dell'harness Codex.

## Uso del computer

L'Uso del computer è trattato nella propria guida di configurazione:
[Uso del computer di Codex](/it/plugins/codex-computer-use).

La versione breve: OpenClaw non include nell'albero il modulo app di controllo desktop né esegue
azioni desktop in proprio. Prepara l'app-server Codex, verifica che il server MCP
`computer-use` sia disponibile, e poi lascia che Codex gestisca le chiamate native agli strumenti
MCP durante i turni in modalità Codex.

Per l'accesso diretto al driver TryCua fuori dal flusso del marketplace Codex, registra
`cua-driver mcp` con `openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'`.
Vedi [Uso del computer di Codex](/it/plugins/codex-computer-use) per la distinzione
tra Uso del computer gestito da Codex e registrazione MCP diretta.

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
        fallback: "none",
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

L'Uso del computer è specifico per macOS e può richiedere autorizzazioni locali del sistema operativo prima che il
server MCP di Codex possa controllare le app. Se `computerUse.enabled` è true e il server MCP
non è disponibile, i turni in modalità Codex falliscono prima dell'avvio del thread invece di
essere eseguiti silenziosamente senza gli strumenti nativi di Uso del computer. Vedi
[Uso del computer di Codex](/it/plugins/codex-computer-use) per le scelte del marketplace,
i limiti del catalogo remoto, le motivazioni di stato e la risoluzione dei problemi.

Quando `computerUse.autoInstall` è true, OpenClaw può registrare il marketplace standard
Codex Desktop incluso da
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` se Codex
non ha ancora individuato un marketplace locale. Usa `/new` o `/reset` dopo
aver modificato la configurazione di runtime o di Uso del computer, così le sessioni esistenti non mantengono un vecchio
binding PI o thread Codex.

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
a un thread Codex esistente, il turno successivo invia di nuovo all'app-server
il modello OpenAI, il provider, il criterio di approvazione, la sandbox e il livello di servizio
attualmente selezionati. Passare da `openai/gpt-5.5` a `openai/gpt-5.2` mantiene il
binding del thread ma chiede a Codex di continuare con il nuovo modello selezionato.

## Comando Codex

Il plugin incluso registra `/codex` come slash command autorizzato. È
generico e funziona su qualsiasi canale che supporti i comandi testuali di OpenClaw.

Forme comuni:

- `/codex status` mostra connettività live dell'app-server, modelli, account, limiti di frequenza, server MCP e Skills.
- `/codex models` elenca i modelli live dell'app-server Codex.
- `/codex threads [filter]` elenca i thread Codex recenti.
- `/codex resume <thread-id>` collega la sessione OpenClaw corrente a un thread Codex esistente.
- `/codex compact` chiede all'app-server Codex di compattare il thread collegato.
- `/codex review` avvia la revisione nativa di Codex per il thread collegato.
- `/codex diagnostics [note]` chiede conferma prima di inviare il feedback diagnostico Codex per il thread collegato.
- `/codex computer-use status` controlla il plugin Uso del computer configurato e il server MCP.
- `/codex computer-use install` installa il plugin Uso del computer configurato e ricarica i server MCP.
- `/codex account` mostra lo stato dell'account e dei limiti di frequenza.
- `/codex mcp` elenca lo stato dei server MCP dell'app-server Codex.
- `/codex skills` elenca le skill dell'app-server Codex.

### Flusso di debug comune

Quando un agente basato su Codex fa qualcosa di inatteso in Telegram, Discord, Slack,
o in un altro canale, inizia dalla conversazione in cui si è verificato il problema:

1. Esegui `/diagnostics bad tool choice after image upload` o un'altra breve nota
   che descriva ciò che hai visto.
2. Approva una volta la richiesta di diagnostica. L'approvazione crea lo zip diagnostico locale del Gateway
   e, poiché la sessione usa l'harness Codex, invia anche
   il bundle di feedback Codex pertinente ai server OpenAI.
3. Copia la risposta diagnostica completata nel report del bug o nel thread di supporto.
   Include il percorso del bundle locale, il riepilogo della privacy, gli ID di sessione OpenClaw,
   gli ID di thread Codex e una riga `Inspect locally` per ogni thread Codex.
4. Se vuoi eseguire tu stesso il debug dell'esecuzione, esegui il comando `Inspect locally`
   stampato in un terminale. Ha l'aspetto di `codex resume <thread-id>` e apre il
   thread Codex nativo, così puoi ispezionare la conversazione, continuarla localmente,
   oppure chiedere a Codex perché ha scelto uno strumento o un piano specifico.

Usa `/codex diagnostics [note]` solo quando vuoi specificamente il caricamento del feedback di Codex per il thread attualmente collegato senza il bundle diagnostico completo del Gateway OpenClaw. Per la maggior parte delle segnalazioni di supporto, `/diagnostics [note]` è il punto di partenza migliore perché collega lo stato del Gateway locale e gli ID dei thread Codex in un'unica risposta. Consulta [Esportazione diagnostica](/it/gateway/diagnostics) per il modello completo di privacy e il comportamento nelle chat di gruppo.

Il nucleo di OpenClaw espone anche `/diagnostics [note]`, riservato agli owner, come comando diagnostico generale del Gateway. Il prompt di approvazione mostra il preambolo sui dati sensibili, rimanda a [Esportazione diagnostica](/it/gateway/diagnostics) e richiede `openclaw gateway diagnostics export --json` tramite approvazione exec esplicita ogni volta. Non approvare la diagnostica con una regola allow-all. Dopo l'approvazione, OpenClaw invia un report incollabile con il percorso del bundle locale e il riepilogo del manifest. Quando la sessione OpenClaw attiva usa l'harness Codex, quella stessa approvazione autorizza anche l'invio dei bundle di feedback Codex pertinenti ai server OpenAI. Il prompt di approvazione indica che il feedback Codex verrà inviato, ma non elenca gli ID di sessione o di thread Codex prima dell'approvazione.

Se `/diagnostics` viene invocato da un owner in una chat di gruppo, OpenClaw mantiene pulito il canale condiviso: il gruppo riceve solo un breve avviso, mentre il preambolo diagnostico, i prompt di approvazione e gli ID di sessione/thread Codex vengono inviati all'owner tramite il percorso di approvazione privato. Se non esiste un percorso privato per l'owner, OpenClaw rifiuta la richiesta di gruppo e chiede all'owner di eseguirla da un DM.

Il caricamento Codex approvato chiama `feedback/upload` dell'app-server Codex e chiede all'app-server di includere i log per ogni thread elencato e per i sottothread Codex generati, quando disponibili. Il caricamento passa attraverso il normale percorso di feedback di Codex verso i server OpenAI; se il feedback Codex è disabilitato in quell'app-server, il comando restituisce l'errore dell'app-server. La risposta diagnostica completata elenca i canali, gli ID di sessione OpenClaw, gli ID di thread Codex e i comandi locali `codex resume <thread-id>` per i thread inviati. Se neghi o ignori l'approvazione, OpenClaw non stampa quegli ID Codex. Questo caricamento non sostituisce l'esportazione diagnostica locale del Gateway.

`/codex resume` scrive lo stesso file di binding sidecar che l'harness usa per i turni normali. Al messaggio successivo, OpenClaw riprende quel thread Codex, passa il modello OpenClaw attualmente selezionato all'app-server e mantiene abilitata la cronologia estesa.

### Ispezionare un thread Codex dalla CLI

Il modo più rapido per capire un'esecuzione Codex errata è spesso aprire direttamente il thread Codex nativo:

```sh
codex resume <thread-id>
```

Usalo quando noti un bug in una conversazione di canale e vuoi ispezionare la sessione Codex problematica, continuarla localmente o chiedere a Codex perché ha fatto una particolare scelta di strumento o di ragionamento. Il percorso più semplice di solito è eseguire prima `/diagnostics [note]`: dopo averlo approvato, il report completato elenca ogni thread Codex e stampa un comando `Inspect locally`, per esempio `codex resume <thread-id>`. Puoi copiare quel comando direttamente in un terminale.

Puoi anche ottenere un ID di thread da `/codex binding` per la chat corrente o da `/codex threads [filter]` per i thread recenti dell'app-server Codex, quindi eseguire lo stesso comando `codex resume` nella tua shell.

La superficie dei comandi richiede l'app-server Codex `0.125.0` o successivo. I singoli metodi di controllo vengono riportati come `unsupported by this Codex app-server` se un app-server futuro o personalizzato non espone quel metodo JSON-RPC.

## Confini degli hook

L'harness Codex ha tre livelli di hook:

| Livello                               | Owner                    | Scopo                                                               |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| Hook dei Plugin OpenClaw              | OpenClaw                 | Compatibilità prodotto/Plugin tra harness PI e Codex.               |
| Middleware di estensione dell'app-server Codex | Plugin inclusi in OpenClaw | Comportamento dell'adapter per turno attorno agli strumenti dinamici OpenClaw. |
| Hook nativi Codex                     | Codex                    | Ciclo di vita Codex di basso livello e policy degli strumenti nativi dalla configurazione Codex. |

OpenClaw non usa file Codex `hooks.json` di progetto o globali per instradare il comportamento dei Plugin OpenClaw. Per il bridge supportato degli strumenti nativi e dei permessi, OpenClaw inietta una configurazione Codex per thread per `PreToolUse`, `PostToolUse`, `PermissionRequest` e `Stop`. Altri hook Codex come `SessionStart` e `UserPromptSubmit` restano controlli a livello Codex; non sono esposti come hook dei Plugin OpenClaw nel contratto v1.

Per gli strumenti dinamici OpenClaw, OpenClaw esegue lo strumento dopo che Codex richiede la chiamata, quindi OpenClaw attiva il comportamento dei Plugin e del middleware di sua proprietà nell'adapter dell'harness. Per gli strumenti nativi Codex, Codex possiede il record canonico dello strumento. OpenClaw può rispecchiare eventi selezionati, ma non può riscrivere il thread Codex nativo a meno che Codex non esponga quell'operazione tramite app-server o callback di hook nativi.

Le proiezioni di Compaction e del ciclo di vita LLM provengono dalle notifiche dell'app-server Codex e dallo stato dell'adapter OpenClaw, non dai comandi degli hook nativi Codex. Gli eventi `before_compaction`, `after_compaction`, `llm_input` e `llm_output` di OpenClaw sono osservazioni a livello di adapter, non acquisizioni byte per byte della richiesta interna o dei payload di Compaction di Codex.

Le notifiche app-server native Codex `hook/started` e `hook/completed` vengono proiettate come eventi agente `codex_app_server.hook` per traiettoria e debug. Non invocano gli hook dei Plugin OpenClaw.

## Contratto di supporto V1

La modalità Codex non è PI con una diversa chiamata al modello sottostante. Codex possiede una parte maggiore del loop nativo del modello, e OpenClaw adatta le proprie superfici di Plugin e sessione attorno a quel confine.

Supportato nel runtime Codex v1:

| Superficie                                    | Supporto                                | Perché                                                                                                                                                                                               |
| --------------------------------------------- | --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Loop del modello OpenAI tramite Codex         | Supportato                              | L'app-server Codex possiede il turno OpenAI, la ripresa del thread nativo e la continuazione degli strumenti nativi.                                                                                 |
| Instradamento e consegna dei canali OpenClaw  | Supportato                              | Telegram, Discord, Slack, WhatsApp, iMessage e altri canali restano fuori dal runtime del modello.                                                                                                   |
| Strumenti dinamici OpenClaw                   | Supportato                              | Codex chiede a OpenClaw di eseguire questi strumenti, quindi OpenClaw resta nel percorso di esecuzione.                                                                                              |
| Plugin di prompt e contesto                   | Supportato                              | OpenClaw costruisce overlay del prompt e proietta il contesto nel turno Codex prima di avviare o riprendere il thread.                                                                               |
| Ciclo di vita del motore di contesto          | Supportato                              | Assemblaggio, ingest o manutenzione post-turno, e coordinamento della Compaction del motore di contesto vengono eseguiti per i turni Codex.                                                          |
| Hook degli strumenti dinamici                 | Supportato                              | `before_tool_call`, `after_tool_call` e il middleware dei risultati degli strumenti vengono eseguiti attorno agli strumenti dinamici posseduti da OpenClaw.                                          |
| Hook del ciclo di vita                        | Supportato come osservazioni dell'adapter | `llm_input`, `llm_output`, `agent_end`, `before_compaction` e `after_compaction` si attivano con payload onesti in modalità Codex.                                                                   |
| Gate di revisione della risposta finale       | Supportato tramite il relay degli hook nativi | Codex `Stop` viene inoltrato a `before_agent_finalize`; `revise` chiede a Codex un altro passaggio del modello prima della finalizzazione.                                                           |
| Shell nativa, patch e blocco o osservazione MCP | Supportato tramite il relay degli hook nativi | Codex `PreToolUse` e `PostToolUse` vengono inoltrati per le superfici degli strumenti nativi impegnate, inclusi i payload MCP su app-server Codex `0.125.0` o successivo. Il blocco è supportato; la riscrittura degli argomenti no. |
| Policy dei permessi nativi                    | Supportato tramite il relay degli hook nativi | Codex `PermissionRequest` può essere instradato attraverso la policy OpenClaw dove il runtime lo espone. Se OpenClaw non restituisce alcuna decisione, Codex continua attraverso il proprio percorso normale di guardian o approvazione utente. |
| Acquisizione della traiettoria dell'app-server | Supportato                              | OpenClaw registra la richiesta inviata all'app-server e le notifiche dell'app-server che riceve.                                                                                                     |

Non supportato nel runtime Codex v1:

| Superficie                                           | Confine V1                                                                                                                                     | Percorso futuro                                                                               |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Mutazione degli argomenti degli strumenti nativi                       | Gli hook nativi pre-strumento di Codex possono bloccare, ma OpenClaw non riscrive gli argomenti degli strumenti nativi di Codex.                                               | Richiede il supporto di hook/schema Codex per l'input sostitutivo dello strumento.                            |
| Cronologia modificabile della trascrizione nativa di Codex            | Codex possiede la cronologia canonica del thread nativo. OpenClaw possiede un mirror e può proiettare il contesto futuro, ma non dovrebbe mutare internals non supportati. | Aggiungere API app-server Codex esplicite se serve intervenire chirurgicamente sul thread nativo.                    |
| `tool_result_persist` per i record degli strumenti nativi di Codex | Questo hook trasforma le scritture della trascrizione possedute da OpenClaw, non i record degli strumenti nativi di Codex.                                                           | Potrebbe duplicare i record trasformati nel mirror, ma la riscrittura canonica richiede il supporto di Codex.              |
| Metadati avanzati di compaction nativa                     | OpenClaw osserva l'inizio e il completamento della compaction, ma non riceve un elenco stabile mantenuto/scartato, un delta dei token o un payload di riepilogo.            | Richiede eventi di compaction Codex più ricchi.                                                     |
| Intervento sulla compaction                             | Gli hook di compaction OpenClaw attuali sono a livello di notifica in modalità Codex.                                                                         | Aggiungere hook di pre/post compaction Codex se i Plugin devono porre il veto o riscrivere la compaction nativa. |
| Acquisizione byte per byte della richiesta API al modello             | OpenClaw può acquisire richieste e notifiche dell'app-server, ma il core di Codex costruisce internamente la richiesta API OpenAI finale.                      | Richiede un evento di tracciamento della richiesta al modello Codex o una API di debug.                                   |

## Strumenti, media e compaction

L'harness Codex modifica solo l'esecutore dell'agente incorporato di basso livello.

OpenClaw costruisce ancora l'elenco degli strumenti e riceve i risultati dinamici degli strumenti
dall'harness. Testo, immagini, video, musica, TTS, approvazioni e output degli strumenti di messaggistica
continuano attraverso il normale percorso di consegna di OpenClaw.

Il relay degli hook nativi è intenzionalmente generico, ma il contratto di supporto v1 è
limitato ai percorsi degli strumenti e dei permessi nativi di Codex che OpenClaw testa. Nel
runtime Codex, questo include i payload `PreToolUse`,
`PostToolUse` e `PermissionRequest` di shell, patch e MCP. Non dare per scontato che ogni futuro
evento hook di Codex sia una superficie Plugin di OpenClaw finché il contratto runtime non lo
nomina.

Per `PermissionRequest`, OpenClaw restituisce solo decisioni esplicite di autorizzazione o negazione
quando la policy decide. Un risultato senza decisione non è un'autorizzazione. Codex lo tratta come assenza di
decisione dell'hook e prosegue con il proprio guardian o percorso di approvazione utente.

Le richieste di approvazione degli strumenti MCP di Codex vengono instradate attraverso il flusso di
approvazione Plugin di OpenClaw quando Codex contrassegna `_meta.codex_approval_kind` come
`"mcp_tool_call"`. I prompt `request_user_input` di Codex vengono rimandati alla
chat di origine, e il messaggio di follow-up successivo in coda risponde a quella richiesta del server
nativo invece di essere guidato come contesto aggiuntivo. Le altre richieste di sollecitazione
MCP continuano a fallire in modo chiuso.

Lo steering della coda dell'esecuzione attiva si mappa su `turn/steer` dell'app-server Codex. Con la
modalità predefinita `messages.queue.mode: "steer"`, OpenClaw raggruppa i messaggi di chat in coda
per la finestra di quiete configurata e li invia come una sola richiesta `turn/steer`
nell'ordine di arrivo. La modalità legacy `queue` invia richieste `turn/steer` separate. I turni di
revisione Codex e di compaction manuale possono rifiutare lo steering nello stesso turno, nel qual caso
OpenClaw usa la coda di follow-up quando la modalità selezionata consente il fallback. Vedi
[Coda di steering](/it/concepts/queue-steering).

Quando il modello selezionato usa l'harness Codex, la compaction del thread nativo è
delegata all'app-server Codex. OpenClaw mantiene un mirror della trascrizione per la cronologia del canale,
la ricerca, `/new`, `/reset` e futuri cambi di modello o harness. Il
mirror include il prompt utente, il testo finale dell'assistente e record leggeri di ragionamento
o piano Codex quando l'app-server li emette. Oggi, OpenClaw registra solo i segnali
di inizio e completamento della compaction nativa. Non espone ancora un
riepilogo della compaction leggibile da una persona o un elenco verificabile di quali voci Codex
ha mantenuto dopo la compaction.

Poiché Codex possiede il thread nativo canonico, `tool_result_persist` attualmente non
riscrive i record dei risultati degli strumenti nativi di Codex. Si applica solo quando
OpenClaw sta scrivendo un risultato di strumento della trascrizione di sessione posseduta da OpenClaw.

La generazione di media non richiede PI. Immagini, video, musica, PDF, TTS e comprensione
dei media continuano a usare le impostazioni provider/modello corrispondenti, come
`agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel` e
`messages.tts`.

## Risoluzione dei problemi

**Codex non appare come un normale provider `/model`:** questo è previsto per
le nuove configurazioni. Seleziona un modello `openai/gpt-*` con
`agentRuntime.id: "codex"` (o un ref legacy `codex/*`), abilita
`plugins.entries.codex.enabled` e controlla se `plugins.allow` esclude
`codex`.

**OpenClaw usa PI invece di Codex:** `agentRuntime.id: "auto"` può ancora usare PI come
backend di compatibilità quando nessun harness Codex rivendica l'esecuzione. Imposta
`agentRuntime.id: "codex"` per forzare la selezione di Codex durante i test. Un
runtime Codex forzato ora fallisce invece di ripiegare su PI, a meno che tu non
imposti esplicitamente `agentRuntime.fallback: "pi"`. Una volta selezionato
l'app-server Codex, i suoi errori emergono direttamente senza configurazione di fallback aggiuntiva.

**L'app-server viene rifiutato:** aggiorna Codex in modo che l'handshake dell'app-server
riporti la versione `0.125.0` o successiva. Prerelease della stessa versione o versioni con suffisso di build
come `0.125.0-alpha.2` o `0.125.0+custom` vengono rifiutate perché la
soglia stabile del protocollo `0.125.0` è quella che OpenClaw testa.

**La scoperta dei modelli è lenta:** riduci `plugins.entries.codex.config.discovery.timeoutMs`
o disabilita la scoperta.

**Il trasporto WebSocket fallisce immediatamente:** controlla `appServer.url`, `authToken`
e che l'app-server remoto parli la stessa versione del protocollo app-server Codex.

**Un modello non Codex usa PI:** questo è previsto a meno che tu non abbia forzato
`agentRuntime.id: "codex"` per quell'agente o selezionato un ref legacy
`codex/*`. I semplici ref `openai/gpt-*` e di altri provider restano sul loro normale
percorso provider in modalità `auto`. Se forzi `agentRuntime.id: "codex"`, ogni turno incorporato
per quell'agente deve essere un modello OpenAI supportato da Codex.

**Computer Use è installato ma gli strumenti non vengono eseguiti:** controlla
`/codex computer-use status` da una nuova sessione. Se uno strumento segnala
`Native hook relay unavailable`, usa `/new` o `/reset`; se persiste, riavvia
il Gateway per cancellare registrazioni stale degli hook nativi. Se `computer-use.list_apps`
va in timeout, riavvia Codex Computer Use o Codex Desktop e riprova.

## Correlati

- [Plugin dell'harness agente](/it/plugins/sdk-agent-harness)
- [Runtime degli agenti](/it/concepts/agent-runtimes)
- [Provider di modelli](/it/concepts/model-providers)
- [Provider OpenAI](/it/providers/openai)
- [Stato](/it/cli/status)
- [Hook dei Plugin](/it/plugins/hooks)
- [Riferimento di configurazione](/it/gateway/configuration-reference)
- [Test](/it/help/testing-live#live-codex-app-server-harness-smoke)
