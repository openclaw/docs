---
read_when:
    - Vuoi usare l'harness app-server di Codex incluso
    - Ti servono esempi di configurazione dell'ambiente di esecuzione di Codex
    - Vuoi che le distribuzioni solo Codex falliscano invece di ripiegare su PI
summary: Esegui i turni dell'agente integrato di OpenClaw tramite l'harness app-server di Codex incluso
title: Ambiente di esecuzione di Codex
x-i18n:
    generated_at: "2026-04-30T09:02:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: 93abb72e9590aad265e5b6b8691dd16314178c4d255679b4e53da33b792a6e6b
    source_path: plugins/codex-harness.md
    workflow: 16
---

Il Plugin `codex` incluso consente a OpenClaw di eseguire turni agent incorporati tramite il
Codex app-server invece dell'harness PI integrato.

Usalo quando vuoi che Codex gestisca la sessione agent di basso livello: scoperta dei modelli,
ripresa nativa del thread, compaction nativa ed esecuzione app-server.
OpenClaw continua a gestire canali chat, file di sessione, selezione del modello, strumenti,
approvazioni, consegna dei media e mirror visibile della trascrizione.

Se stai cercando di orientarti, inizia da
[Runtime agent](/it/concepts/agent-runtimes). La versione breve è:
`openai/gpt-5.5` è il riferimento del modello, `codex` è il runtime, e Telegram,
Discord, Slack o un altro canale resta la superficie di comunicazione.

## Cosa cambia questo Plugin

Il Plugin `codex` incluso contribuisce diverse capacità separate:

| Capacità                          | Come la usi                                         | Cosa fa                                                                       |
| --------------------------------- | --------------------------------------------------- | ----------------------------------------------------------------------------- |
| Runtime incorporato nativo        | `agentRuntime.id: "codex"`                          | Esegue i turni agent incorporati di OpenClaw tramite Codex app-server.        |
| Comandi nativi di controllo chat  | `/codex bind`, `/codex resume`, `/codex steer`, ... | Associa e controlla thread Codex app-server da una conversazione di messaggistica. |
| Provider/catalogo Codex app-server | interni `codex`, esposti tramite l'harness         | Consente al runtime di scoprire e validare i modelli app-server.              |
| Percorso di comprensione media Codex | percorsi di compatibilità immagine-modello `codex/*` | Esegue turni Codex app-server limitati per modelli di comprensione immagini supportati. |
| Relay hook nativo                 | Hook del Plugin intorno a eventi nativi Codex       | Consente a OpenClaw di osservare/bloccare eventi nativi Codex supportati di strumenti/finalizzazione. |

Abilitare il Plugin rende disponibili queste capacità. **Non**:

- inizia a usare Codex per ogni modello OpenAI
- converte i riferimenti modello `openai-codex/*` nel runtime nativo
- rende ACP/acpx il percorso Codex predefinito
- passa a caldo sessioni esistenti che hanno già registrato un runtime PI
- sostituisce consegna dei canali OpenClaw, file di sessione, archiviazione dei profili auth o
  routing dei messaggi

Lo stesso Plugin possiede anche la superficie nativa dei comandi di controllo chat `/codex`. Se
il Plugin è abilitato e l'utente chiede di associare, riprendere, indirizzare, fermare o ispezionare
thread Codex dalla chat, gli agent dovrebbero preferire `/codex ...` ad ACP. ACP resta
il fallback esplicito quando l'utente chiede ACP/acpx o sta testando l'adapter ACP
Codex.

I turni nativi Codex mantengono gli hook Plugin di OpenClaw come livello pubblico di compatibilità.
Questi sono hook OpenClaw in-process, non hook di comando Codex `hooks.json`:

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `before_tool_call`, `after_tool_call`
- `before_message_write` per record di trascrizione mirrorati
- `before_agent_finalize` tramite relay Codex `Stop`
- `agent_end`

I Plugin possono anche registrare middleware di risultati strumento neutrali rispetto al runtime per riscrivere
i risultati degli strumenti dinamici di OpenClaw dopo che OpenClaw esegue lo strumento e prima che il
risultato venga restituito a Codex. Questo è separato dall'hook Plugin pubblico
`tool_result_persist`, che trasforma le scritture di risultati strumento nella trascrizione posseduta da OpenClaw.

Per la semantica degli hook Plugin, consulta [Hook Plugin](/it/plugins/hooks)
e [Comportamento guard del Plugin](/it/tools/plugin).

L'harness è disattivato per impostazione predefinita. Le nuove configurazioni dovrebbero mantenere i riferimenti ai modelli OpenAI
canonici come `openai/gpt-*` e forzare esplicitamente
`agentRuntime.id: "codex"` o `OPENCLAW_AGENT_RUNTIME=codex` quando
vogliono l'esecuzione nativa app-server. I riferimenti modello legacy `codex/*` selezionano ancora automaticamente
l'harness per compatibilità, ma i prefissi provider legacy supportati da runtime
non sono mostrati come normali scelte modello/provider.

Se il Plugin `codex` è abilitato ma il modello primario è ancora
`openai-codex/*`, `openclaw doctor` avvisa invece di cambiare il percorso. È
intenzionale: `openai-codex/*` resta il percorso OAuth/abbonamento PI Codex, e
l'esecuzione nativa app-server resta una scelta runtime esplicita.

## Mappa dei percorsi

Usa questa tabella prima di cambiare la configurazione:

| Comportamento desiderato                   | Riferimento modello        | Configurazione runtime                  | Requisito Plugin            | Etichetta di stato prevista    |
| ------------------------------------------ | -------------------------- | -------------------------------------- | --------------------------- | ------------------------------ |
| API OpenAI tramite runner OpenClaw normale | `openai/gpt-*`             | omesso o `runtime: "pi"`               | Provider OpenAI             | `Runtime: OpenClaw Pi Default` |
| OAuth/abbonamento Codex tramite PI         | `openai-codex/gpt-*`       | omesso o `runtime: "pi"`               | Provider OAuth OpenAI Codex | `Runtime: OpenClaw Pi Default` |
| Turni incorporati nativi Codex app-server  | `openai/gpt-*`             | `agentRuntime.id: "codex"`             | Plugin `codex`              | `Runtime: OpenAI Codex`        |
| Provider misti con modalità auto conservativa | riferimenti specifici del provider | `agentRuntime.id: "auto"`       | Runtime Plugin opzionali    | Dipende dal runtime selezionato |
| Sessione adapter Codex ACP esplicita       | dipende da prompt/modello ACP | `sessions_spawn` con `runtime: "acp"` | backend `acpx` integro      | Stato task/sessione ACP        |

La divisione importante è provider rispetto a runtime:

- `openai-codex/*` risponde a "quale percorso provider/auth dovrebbe usare PI?"
- `agentRuntime.id: "codex"` risponde a "quale loop dovrebbe eseguire questo
  turno incorporato?"
- `/codex ...` risponde a "quale conversazione nativa Codex dovrebbe essere associata
  o controllata da questa chat?"
- ACP risponde a "quale processo harness esterno dovrebbe avviare acpx?"

## Scegli il prefisso modello corretto

I percorsi della famiglia OpenAI sono specifici per prefisso. Usa `openai-codex/*` quando vuoi
OAuth Codex tramite PI; usa `openai/*` quando vuoi accesso diretto all'API OpenAI o
quando stai forzando l'harness nativo Codex app-server:

| Riferimento modello                          | Percorso runtime                              | Quando usarlo                                                            |
| --------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------- |
| `openai/gpt-5.4`                              | Provider OpenAI tramite plumbing OpenClaw/PI | Vuoi l'accesso diretto attuale all'API OpenAI Platform con `OPENAI_API_KEY`. |
| `openai-codex/gpt-5.5`                        | OAuth OpenAI Codex tramite OpenClaw/PI       | Vuoi auth da abbonamento ChatGPT/Codex con il runner PI predefinito.      |
| `openai/gpt-5.5` + `agentRuntime.id: "codex"` | Harness Codex app-server                     | Vuoi l'esecuzione nativa Codex app-server per il turno agent incorporato. |

GPT-5.5 è attualmente solo abbonamento/OAuth in OpenClaw. Usa
`openai-codex/gpt-5.5` per OAuth PI, oppure `openai/gpt-5.5` con l'harness
Codex app-server. L'accesso diretto con chiave API per `openai/gpt-5.5` è supportato
quando OpenAI abilita GPT-5.5 sull'API pubblica.

I riferimenti legacy `codex/gpt-*` restano accettati come alias di compatibilità. La migrazione
di compatibilità di Doctor riscrive i riferimenti runtime primari legacy in riferimenti modello
canonici e registra separatamente la policy runtime, mentre i riferimenti legacy solo fallback
restano invariati perché il runtime è configurato per l'intero contenitore agent.
Le nuove configurazioni OAuth PI Codex dovrebbero usare `openai-codex/gpt-*`; le nuove configurazioni
dell'harness nativo app-server dovrebbero usare `openai/gpt-*` più
`agentRuntime.id: "codex"`.

`agents.defaults.imageModel` segue la stessa divisione di prefisso. Usa
`openai-codex/gpt-*` quando la comprensione immagini deve passare attraverso il percorso provider OAuth OpenAI
Codex. Usa `codex/gpt-*` quando la comprensione immagini deve essere eseguita
tramite un turno Codex app-server limitato. Il modello Codex app-server deve
dichiarare supporto per input immagine; i modelli Codex solo testo falliscono prima dell'avvio del turno media.

Usa `/status` per confermare l'harness effettivo per la sessione corrente. Se la
selezione sorprende, abilita il logging di debug per il sottosistema `agents/harness`
e ispeziona il record strutturato `agent harness selected` del gateway. Include
l'id dell'harness selezionato, il motivo della selezione, la policy runtime/fallback e,
in modalità `auto`, il risultato di supporto di ciascun candidato Plugin.

### Cosa significano gli avvisi di Doctor

`openclaw doctor` avvisa quando tutte queste condizioni sono vere:

- il Plugin `codex` incluso è abilitato o consentito
- il modello primario di un agent è `openai-codex/*`
- il runtime effettivo di quell'agent non è `codex`

Quell'avviso esiste perché gli utenti spesso si aspettano che "Plugin Codex abilitato" implichi
"runtime nativo Codex app-server". OpenClaw non fa quel salto. L'avviso
significa:

- **Non è richiesta alcuna modifica** se intendevi OAuth ChatGPT/Codex tramite PI.
- Cambia il modello in `openai/<model>` e imposta
  `agentRuntime.id: "codex"` se intendevi l'esecuzione nativa app-server.
- Le sessioni esistenti richiedono ancora `/new` o `/reset` dopo una modifica del runtime,
  perché i pin runtime di sessione sono persistenti.

La selezione dell'harness non è un controllo di sessione live. Quando viene eseguito un turno incorporato,
OpenClaw registra l'id dell'harness selezionato su quella sessione e continua a usarlo per
i turni successivi nello stesso id sessione. Cambia la configurazione `agentRuntime` o
`OPENCLAW_AGENT_RUNTIME` quando vuoi che le sessioni future usino un altro harness;
usa `/new` o `/reset` per avviare una nuova sessione prima di passare una conversazione esistente
tra PI e Codex. Questo evita di riprodurre una trascrizione attraverso
due sistemi di sessione nativi incompatibili.

Le sessioni legacy create prima dei pin harness sono trattate come con pin PI una volta che
hanno cronologia di trascrizione. Usa `/new` o `/reset` per optare quella conversazione in
Codex dopo aver cambiato la configurazione.

`/status` mostra il runtime modello effettivo. L'harness PI predefinito appare come
`Runtime: OpenClaw Pi Default`, e l'harness Codex app-server appare come
`Runtime: OpenAI Codex`.

## Requisiti

- OpenClaw con il Plugin `codex` incluso disponibile.
- Codex app-server `0.125.0` o più recente. Il Plugin incluso gestisce per impostazione predefinita un binario
  Codex app-server compatibile, quindi i comandi locali `codex` su `PATH` non
  influiscono sul normale avvio dell'harness.
- Auth Codex disponibile al processo app-server o al bridge auth Codex di OpenClaw.

Il Plugin blocca handshake app-server più vecchi o senza versione. Questo mantiene
OpenClaw sulla superficie di protocollo contro cui è stato testato.

Per test smoke live e Docker, l'auth di solito proviene dall'account Codex CLI
o da un profilo auth OpenClaw `openai-codex`. Gli avvii locali stdio app-server possono
anche ricadere su `CODEX_API_KEY` / `OPENAI_API_KEY` quando non è presente alcun account.

## Configurazione minima

Usa `openai/gpt-5.5`, abilita il Plugin incluso e forza l'harness `codex`:

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

Le configurazioni legacy che impostano `agents.defaults.model` o un modello agent su
`codex/<model>` abilitano ancora automaticamente il Plugin `codex` incluso. Le nuove configurazioni dovrebbero
preferire `openai/<model>` più la voce esplicita `agentRuntime` sopra.

## Aggiungi Codex insieme ad altri modelli

Non impostare `agentRuntime.id: "codex"` globalmente se lo stesso agent dovrebbe passare liberamente
tra Codex e modelli provider non Codex. Un runtime forzato si applica a ogni
turno incorporato per quell'agent o sessione. Se selezioni un modello Anthropic mentre
quel runtime è forzato, OpenClaw prova comunque l'harness Codex e fallisce in modo chiuso
invece di instradare silenziosamente quel turno tramite PI.

Usa invece una di queste forme:

- Metti Codex su un agente dedicato con `agentRuntime.id: "codex"`.
- Mantieni l'agente predefinito su `agentRuntime.id: "auto"` e il fallback PI per il normale uso misto
  dei provider.
- Usa i riferimenti legacy `codex/*` solo per compatibilità. Le nuove configurazioni dovrebbero preferire
  `openai/*` più un criterio runtime Codex esplicito.

Per esempio, questo mantiene l'agente predefinito sulla normale selezione automatica e
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
- L'agente `codex` usa l'ambiente app-server di Codex.
- Se Codex manca o non è supportato per l'agente `codex`, il turno fallisce
  invece di usare silenziosamente PI.

## Instradamento dei comandi degli agenti

Gli agenti dovrebbero instradare le richieste utente in base all'intento, non solo alla parola "Codex":

| L'utente chiede di...                                    | L'agente dovrebbe usare...                       |
| -------------------------------------------------------- | ------------------------------------------------ |
| "Associa questa chat a Codex"                            | `/codex bind`                                    |
| "Riprendi qui il thread Codex `<id>`"                    | `/codex resume <id>`                             |
| "Mostra i thread Codex"                                  | `/codex threads`                                 |
| "Invia una segnalazione di supporto per un'esecuzione Codex non riuscita" | `/diagnostics [note]`                            |
| "Invia feedback Codex solo per questo thread allegato"   | `/codex diagnostics [note]`                      |
| "Usa Codex come runtime per questo agente"               | modifica della configurazione di `agentRuntime.id` |
| "Usa il mio abbonamento ChatGPT/Codex con OpenClaw normale" | riferimenti modello `openai-codex/*`             |
| "Esegui Codex tramite ACP/acpx"                          | ACP `sessions_spawn({ runtime: "acp", ... })`    |
| "Avvia Claude Code/Gemini/OpenCode/Cursor in un thread"  | ACP/acpx, non `/codex` e non sottoagenti nativi  |

OpenClaw pubblicizza agli agenti la guida allo spawn ACP solo quando ACP è abilitato,
inviabile ed è supportato da un backend runtime caricato. Se ACP non è disponibile,
il prompt di sistema e le Skills del Plugin non dovrebbero istruire l'agente
sull'instradamento ACP.

## Distribuzioni solo Codex

Forza l'ambiente Codex quando devi dimostrare che ogni turno di agente incorporato
usa Codex. I runtime Plugin espliciti usano per impostazione predefinita nessun fallback PI, quindi
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

Con Codex forzato, OpenClaw fallisce in anticipo se il Plugin Codex è disabilitato, se
l'app-server è troppo vecchio o se l'app-server non riesce ad avviarsi. Imposta
`OPENCLAW_AGENT_HARNESS_FALLBACK=pi` solo se vuoi intenzionalmente che PI gestisca
la selezione mancante dell'ambiente.

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
sessione OpenClaw e l'ambiente Codex crea o riprende il proprio thread app-server
ausiliario secondo necessità. `/reset` cancella l'associazione della sessione OpenClaw per quel thread
e consente al turno successivo di risolvere di nuovo l'ambiente dalla configurazione corrente.

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

Disabilita il rilevamento quando vuoi che l'avvio eviti di interrogare Codex e si attenga al
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

## Connessione e criterio app-server

Per impostazione predefinita, il Plugin avvia localmente il binario Codex gestito da OpenClaw con:

```bash
codex app-server --listen stdio://
```

Il binario gestito è dichiarato come dipendenza runtime Plugin inclusa e preparato
insieme al resto delle dipendenze del Plugin `codex`. Questo mantiene la versione dell'app-server
legata al Plugin incluso invece che a qualsiasi CLI Codex separata
installata localmente. Imposta `appServer.command` solo quando vuoi
intenzionalmente eseguire un eseguibile diverso.

Per impostazione predefinita, OpenClaw avvia le sessioni dell'ambiente Codex locali in modalità YOLO:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` e
`sandbox: "danger-full-access"`. Questa è la postura dell'operatore locale fidato usata
per Heartbeat autonomi: Codex può usare strumenti di shell e rete senza
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

La modalità Guardian usa il percorso di approvazione con revisione automatica nativo di Codex. Quando Codex chiede di
uscire dalla sandbox, scrivere fuori dal workspace o aggiungere permessi come l'accesso
alla rete, Codex instrada quella richiesta di approvazione al revisore nativo invece che a un
prompt umano. Il revisore applica il framework di rischio di Codex e approva o nega
la richiesta specifica. Usa Guardian quando vuoi più protezioni rispetto alla modalità YOLO
ma devi comunque consentire ad agenti non presidiati di avanzare.

Il preset `guardian` si espande in `approvalPolicy: "on-request"`,
`approvalsReviewer: "auto_review"` e `sandbox: "workspace-write"`.
I singoli campi del criterio sovrascrivono comunque `mode`, quindi le distribuzioni avanzate possono combinare
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

Gli avvii app-server stdio ereditano per impostazione predefinita l'ambiente di processo di OpenClaw,
ma OpenClaw possiede il bridge dell'account app-server Codex. L'autenticazione è selezionata in questo
ordine:

1. Un profilo di autenticazione Codex OpenClaw esplicito per l'agente.
2. L'account esistente dell'app-server, come un accesso ChatGPT della CLI Codex locale.
3. Solo per gli avvii app-server stdio locali, `CODEX_API_KEY`, poi
   `OPENAI_API_KEY`, quando non è presente alcun account app-server e l'autenticazione OpenAI è
   ancora richiesta.

Quando OpenClaw vede un profilo di autenticazione Codex in stile abbonamento ChatGPT, rimuove
`CODEX_API_KEY` e `OPENAI_API_KEY` dal processo figlio Codex generato. Questo
mantiene disponibili le chiavi API a livello Gateway per embedding o modelli OpenAI diretti
senza far fatturare per errore i turni nativi dell'app-server Codex tramite l'API.
I profili con chiave API Codex espliciti e il fallback con chiave env stdio locale usano l'accesso app-server
invece dell'env ereditato del processo figlio. Le connessioni app-server WebSocket
non ricevono il fallback della chiave API env del Gateway; usa un profilo di autenticazione esplicito o
l'account proprio dell'app-server remoto.

Se una distribuzione richiede isolamento aggiuntivo dell'ambiente, aggiungi quelle variabili a
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

| Campo               | Predefinito                             | Significato                                                                                                                                        |
| ------------------- | ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`         | `"stdio"`                                | `"stdio"` avvia Codex; `"websocket"` si connette a `url`.                                                                                          |
| `command`           | binario Codex gestito                    | Eseguibile per il trasporto stdio. Lasciare non impostato per usare il binario gestito; impostarlo solo per una sostituzione esplicita.             |
| `args`              | `["app-server", "--listen", "stdio://"]` | Argomenti per il trasporto stdio.                                                                                                                  |
| `url`               | non impostato                            | URL app-server WebSocket.                                                                                                                          |
| `authToken`         | non impostato                            | Token bearer per il trasporto WebSocket.                                                                                                           |
| `headers`           | `{}`                                     | Header WebSocket aggiuntivi.                                                                                                                       |
| `clearEnv`          | `[]`                                     | Nomi di variabili d'ambiente aggiuntivi rimossi dal processo app-server stdio avviato dopo che OpenClaw ha costruito il suo ambiente ereditato.    |
| `requestTimeoutMs`  | `60000`                                  | Timeout per le chiamate del piano di controllo app-server.                                                                                         |
| `mode`              | `"yolo"`                                 | Preimpostazione per l'esecuzione YOLO o revisionata da guardian.                                                                                   |
| `approvalPolicy`    | `"never"`                                | Policy di approvazione nativa di Codex inviata ad avvio/ripresa/thread e turno.                                                                    |
| `sandbox`           | `"danger-full-access"`                   | Modalità sandbox nativa di Codex inviata ad avvio/ripresa del thread.                                                                              |
| `approvalsReviewer` | `"user"`                                 | Usare `"auto_review"` per permettere a Codex di revisionare i prompt di approvazione nativi. `guardian_subagent` resta un alias legacy.            |
| `serviceTier`       | non impostato                            | Livello di servizio app-server Codex opzionale: `"fast"`, `"flex"` o `null`. I valori legacy non validi vengono ignorati.                         |

Le chiamate agli strumenti dinamici di proprietà di OpenClaw sono delimitate in modo indipendente da
`appServer.requestTimeoutMs`: ogni richiesta Codex `item/tool/call` deve ricevere
una risposta OpenClaw entro 30 secondi. In caso di timeout, OpenClaw interrompe il segnale dello strumento
dove supportato e restituisce a Codex una risposta di strumento dinamico non riuscita, così
il turno può continuare invece di lasciare la sessione in `processing`.

Dopo che OpenClaw risponde a una richiesta app-server Codex con ambito di turno, l'harness
si aspetta anche che Codex concluda il turno nativo con `turn/completed`. Se
l'app-server resta silenzioso per 60 secondi dopo quella risposta, OpenClaw tenta
di interrompere il turno Codex, registra un timeout diagnostico e libera la corsia della sessione
OpenClaw affinché i messaggi di chat successivi non restino in coda dietro un
turno nativo obsoleto.

Gli override d'ambiente restano disponibili per i test locali:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN` ignora il binario gestito quando
`appServer.command` non è impostato.

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` è stato rimosso. Usare invece
`plugins.entries.codex.config.appServer.mode: "guardian"`, oppure
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` per test locali una tantum. La configurazione è
preferibile per distribuzioni ripetibili perché mantiene il comportamento del plugin nello
stesso file revisionato del resto della configurazione dell'harness Codex.

## Uso del computer

L'Uso del computer è trattato nella propria guida di configurazione:
[Uso del computer di Codex](/it/plugins/codex-computer-use).

La versione breve: OpenClaw non include l'app di controllo desktop né esegue
direttamente azioni desktop. Prepara Codex app-server, verifica che il server MCP
`computer-use` sia disponibile e poi lascia che Codex gestisca le chiamate agli strumenti MCP
native durante i turni in modalità Codex.

Per l'accesso diretto al driver TryCua fuori dal flusso marketplace di Codex, registrare
`cua-driver mcp` con `openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'`.
Vedere [Uso del computer di Codex](/it/plugins/codex-computer-use) per la distinzione
tra Uso del computer di proprietà di Codex e registrazione MCP diretta.

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

L'Uso del computer è specifico di macOS e può richiedere permessi locali del sistema operativo prima che il
server MCP di Codex possa controllare le app. Se `computerUse.enabled` è true e il server MCP
non è disponibile, i turni in modalità Codex falliscono prima dell'avvio del thread invece di
essere eseguiti silenziosamente senza gli strumenti nativi di Uso del computer. Vedere
[Uso del computer di Codex](/it/plugins/codex-computer-use) per le scelte del marketplace,
i limiti del catalogo remoto, le motivazioni di stato e la risoluzione dei problemi.

Quando `computerUse.autoInstall` è true, OpenClaw può registrare il marketplace standard
Codex Desktop incluso da
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` se Codex
non ha ancora scoperto un marketplace locale. Usare `/new` o `/reset` dopo
aver modificato la configurazione del runtime o dell'Uso del computer, così le sessioni esistenti non mantengono un vecchio
binding del thread PI o Codex.

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
a un thread Codex esistente, il turno successivo invia di nuovo ad
app-server il modello OpenAI, il provider, la policy di approvazione, la sandbox e il livello di servizio
attualmente selezionati. Passare da `openai/gpt-5.5` a `openai/gpt-5.2` mantiene il
binding del thread ma chiede a Codex di continuare con il nuovo modello selezionato.

## Comando Codex

Il plugin incluso registra `/codex` come comando slash autorizzato. È
generico e funziona su qualsiasi canale che supporti i comandi testuali OpenClaw.

Forme comuni:

- `/codex status` mostra connettività app-server live, modelli, account, limiti di frequenza, server MCP e Skills.
- `/codex models` elenca i modelli app-server Codex live.
- `/codex threads [filter]` elenca i thread Codex recenti.
- `/codex resume <thread-id>` collega la sessione OpenClaw corrente a un thread Codex esistente.
- `/codex compact` chiede a Codex app-server di compattare il thread collegato.
- `/codex review` avvia la revisione nativa Codex per il thread collegato.
- `/codex diagnostics [note]` chiede prima di inviare feedback diagnostico Codex per il thread collegato.
- `/codex computer-use status` controlla il plugin Uso del computer configurato e il server MCP.
- `/codex computer-use install` installa il plugin Uso del computer configurato e ricarica i server MCP.
- `/codex account` mostra lo stato dell'account e dei limiti di frequenza.
- `/codex mcp` elenca lo stato dei server MCP app-server Codex.
- `/codex skills` elenca le Skills app-server Codex.

### Flusso di debug comune

Quando un agente basato su Codex fa qualcosa di inatteso in Telegram, Discord, Slack
o un altro canale, iniziare dalla conversazione in cui si è verificato il problema:

1. Eseguire `/diagnostics bad tool choice after image upload` o un'altra breve nota
   che descriva ciò che si è visto.
2. Approvare una volta la richiesta di diagnostica. L'approvazione crea lo zip diagnostico del Gateway
   locale e, poiché la sessione usa l'harness Codex, invia anche
   il bundle di feedback Codex pertinente ai server OpenAI.
3. Copiare la risposta diagnostica completata nel report di bug o nel thread di supporto.
   Include il percorso del bundle locale, il riepilogo privacy, gli ID sessione OpenClaw,
   gli ID thread Codex e una riga `Inspect locally` per ogni thread Codex.
4. Se si vuole eseguire il debug della run autonomamente, eseguire il comando `Inspect locally`
   stampato in un terminale. Somiglia a `codex resume <thread-id>` e apre il
   thread Codex nativo così si può ispezionare la conversazione, continuarla localmente
   o chiedere a Codex perché ha scelto un determinato strumento o piano.

Usare `/codex diagnostics [note]` solo quando si desidera specificamente il caricamento del feedback
Codex per il thread attualmente collegato senza il bundle diagnostico completo del Gateway
OpenClaw. Per la maggior parte delle segnalazioni di supporto, `/diagnostics [note]` è
il punto di partenza migliore perché collega lo stato del Gateway locale e gli ID thread Codex
in un'unica risposta. Vedere [Esportazione diagnostica](/it/gateway/diagnostics)
per il modello privacy completo e il comportamento nelle chat di gruppo.

Il core OpenClaw espone anche `/diagnostics [note]`, riservato agli owner, come comando generale
di diagnostica del Gateway. Il relativo prompt di approvazione mostra il preambolo sui dati sensibili,
collega a [Esportazione diagnostica](/it/gateway/diagnostics) e richiede
`openclaw gateway diagnostics export --json` tramite approvazione exec esplicita
ogni volta. Non approvare la diagnostica con una regola allow-all. Dopo l'approvazione,
OpenClaw invia un report incollabile con il percorso del bundle locale e il riepilogo
del manifesto. Quando la sessione OpenClaw attiva usa l'harness Codex, quella
stessa approvazione autorizza anche l'invio dei bundle di feedback Codex pertinenti ai
server OpenAI. Il prompt di approvazione dice che il feedback Codex sarà inviato, ma
non elenca gli ID sessione o thread Codex prima dell'approvazione.

Se `/diagnostics` viene invocato da un owner in una chat di gruppo, OpenClaw mantiene pulito il
canale condiviso: il gruppo riceve solo un breve avviso, mentre il
preambolo diagnostico, i prompt di approvazione e gli ID sessione/thread Codex vengono inviati
all'owner tramite il percorso di approvazione privato. Se non esiste un percorso owner privato,
OpenClaw rifiuta la richiesta del gruppo e chiede all'owner di eseguirla da un DM.

Le chiamate di caricamento Codex approvate chiamano `feedback/upload` dell'app-server Codex e chiedono
all'app-server di includere i log per ogni thread elencato e per i sottothread Codex generati
quando disponibili. Il caricamento passa attraverso il normale percorso di feedback di Codex verso i
server OpenAI; se il feedback Codex è disabilitato in quell'app-server, il comando restituisce
l'errore dell'app-server. La risposta diagnostica completata elenca i canali,
gli ID sessione OpenClaw, gli ID thread Codex e i comandi locali `codex resume <thread-id>`
per i thread che sono stati inviati. Se neghi o ignori l'approvazione,
OpenClaw non stampa quegli ID Codex. Questo caricamento non sostituisce l'esportazione diagnostica locale
del Gateway.

`/codex resume` scrive lo stesso file di binding sidecar che l'harness usa per i
turni normali. Al messaggio successivo, OpenClaw riprende quel thread Codex, passa il
modello OpenClaw attualmente selezionato all'app-server e mantiene abilitata la cronologia
estesa.

### Ispezionare un thread Codex dalla CLI

Il modo più rapido per capire un'esecuzione Codex errata è spesso aprire direttamente il thread
Codex nativo:

```sh
codex resume <thread-id>
```

Usalo quando noti un bug in una conversazione di canale e vuoi ispezionare la
sessione Codex problematica, continuarla localmente o chiedere a Codex perché ha fatto una
particolare scelta di strumento o di ragionamento. Il percorso più semplice di solito è eseguire
prima `/diagnostics [note]`: dopo l'approvazione, il report completato elenca
ogni thread Codex e stampa un comando `Inspect locally`, ad esempio
`codex resume <thread-id>`. Puoi copiare quel comando direttamente in un terminale.

Puoi anche ottenere un ID thread da `/codex binding` per la chat corrente o
`/codex threads [filter]` per i thread recenti dell'app-server Codex, quindi eseguire lo stesso
comando `codex resume` nella tua shell.

La superficie dei comandi richiede l'app-server Codex `0.125.0` o successivo. I singoli
metodi di controllo vengono segnalati come `unsupported by this Codex app-server` se un
app-server futuro o personalizzato non espone quel metodo JSON-RPC.

## Confini degli hook

L'harness Codex ha tre livelli di hook:

| Livello                               | Proprietario             | Scopo                                                               |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| Hook dei plugin OpenClaw              | OpenClaw                 | Compatibilità prodotto/plugin tra harness PI e Codex.               |
| Middleware di estensione dell'app-server Codex | Plugin in bundle OpenClaw | Comportamento dell'adapter per turno intorno agli strumenti dinamici OpenClaw. |
| Hook nativi Codex                     | Codex                    | Ciclo di vita Codex di basso livello e policy degli strumenti nativi dalla configurazione Codex. |

OpenClaw non usa file Codex `hooks.json` di progetto o globali per instradare il
comportamento dei plugin OpenClaw. Per il bridge supportato di strumenti nativi e permessi,
OpenClaw inietta configurazione Codex per thread per `PreToolUse`, `PostToolUse`,
`PermissionRequest` e `Stop`. Altri hook Codex come `SessionStart` e
`UserPromptSubmit` rimangono controlli a livello Codex; non sono esposti come
hook dei plugin OpenClaw nel contratto v1.

Per gli strumenti dinamici OpenClaw, OpenClaw esegue lo strumento dopo che Codex richiede la
chiamata, quindi OpenClaw attiva il comportamento di plugin e middleware che possiede
nell'adapter dell'harness. Per gli strumenti nativi Codex, Codex possiede il record canonico dello strumento.
OpenClaw può rispecchiare eventi selezionati, ma non può riscrivere il thread Codex
nativo a meno che Codex non esponga quell'operazione tramite app-server o callback di hook
nativi.

Le proiezioni di Compaction e del ciclo di vita LLM provengono dalle notifiche dell'app-server Codex
e dallo stato dell'adapter OpenClaw, non da comandi di hook nativi Codex.
Gli eventi `before_compaction`, `after_compaction`, `llm_input` e
`llm_output` di OpenClaw sono osservazioni a livello adapter, non acquisizioni byte per byte
della richiesta interna o dei payload di Compaction di Codex.

Le notifiche app-server native Codex `hook/started` e `hook/completed` vengono
proiettate come eventi agente `codex_app_server.hook` per traiettoria e debug.
Non invocano hook dei plugin OpenClaw.

## Contratto di supporto V1

La modalità Codex non è PI con una diversa chiamata al modello sottostante. Codex possiede una parte maggiore
del ciclo nativo del modello e OpenClaw adatta le proprie superfici di plugin e sessione
intorno a quel confine.

Supportato nel runtime Codex v1:

| Superficie                                    | Supporto                                | Motivo                                                                                                                                                                                                |
| --------------------------------------------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ciclo del modello OpenAI tramite Codex        | Supportato                              | L'app-server Codex possiede il turno OpenAI, la ripresa del thread nativo e la continuazione degli strumenti nativi.                                                                                  |
| Instradamento e consegna dei canali OpenClaw  | Supportato                              | Telegram, Discord, Slack, WhatsApp, iMessage e altri canali restano fuori dal runtime del modello.                                                                                                    |
| Strumenti dinamici OpenClaw                   | Supportato                              | Codex chiede a OpenClaw di eseguire questi strumenti, quindi OpenClaw resta nel percorso di esecuzione.                                                                                               |
| Plugin di prompt e contesto                   | Supportato                              | OpenClaw costruisce overlay di prompt e proietta il contesto nel turno Codex prima di avviare o riprendere il thread.                                                                                 |
| Ciclo di vita del motore di contesto          | Supportato                              | Assemblaggio, ingestione o manutenzione post-turno e coordinamento della Compaction del motore di contesto vengono eseguiti per i turni Codex.                                                        |
| Hook degli strumenti dinamici                 | Supportato                              | `before_tool_call`, `after_tool_call` e il middleware dei risultati degli strumenti vengono eseguiti intorno agli strumenti dinamici posseduti da OpenClaw.                                            |
| Hook del ciclo di vita                        | Supportati come osservazioni dell'adapter | `llm_input`, `llm_output`, `agent_end`, `before_compaction` e `after_compaction` si attivano con payload onesti della modalità Codex.                                                                  |
| Gate di revisione della risposta finale       | Supportato tramite il relay degli hook nativi | Codex `Stop` viene inoltrato a `before_agent_finalize`; `revise` chiede a Codex un ulteriore passaggio del modello prima della finalizzazione.                                                        |
| Shell nativa, patch e blocco od osservazione MCP | Supportato tramite il relay degli hook nativi | Codex `PreToolUse` e `PostToolUse` vengono inoltrati per le superfici di strumenti nativi consolidate, inclusi i payload MCP su app-server Codex `0.125.0` o successivo. Il blocco è supportato; la riscrittura degli argomenti no. |
| Policy dei permessi nativa                    | Supportata tramite il relay degli hook nativi | Codex `PermissionRequest` può essere instradato attraverso la policy OpenClaw dove il runtime lo espone. Se OpenClaw non restituisce alcuna decisione, Codex continua attraverso il proprio percorso normale di guardian o approvazione utente. |
| Acquisizione della traiettoria dell'app-server | Supportata                              | OpenClaw registra la richiesta inviata all'app-server e le notifiche dell'app-server che riceve.                                                                                                      |

Non supportato nel runtime Codex v1:

| Superficie                                         | Confine V1                                                                                                                                      | Percorso futuro                                                                            |
| -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Mutazione degli argomenti degli strumenti nativi   | Gli hook pre-strumento nativi Codex possono bloccare, ma OpenClaw non riscrive gli argomenti degli strumenti nativi Codex.                     | Richiede supporto hook/schema Codex per l'input sostitutivo dello strumento.               |
| Cronologia modificabile della trascrizione nativa Codex | Codex possiede la cronologia canonica del thread nativo. OpenClaw possiede uno specchio e può proiettare contesto futuro, ma non dovrebbe mutare internals non supportati. | Aggiungere API esplicite dell'app-server Codex se è necessario intervenire chirurgicamente sul thread nativo. |
| `tool_result_persist` per record di strumenti nativi Codex | Quell'hook trasforma scritture di trascrizione possedute da OpenClaw, non record di strumenti nativi Codex.                                     | Potrebbe rispecchiare record trasformati, ma la riscrittura canonica richiede supporto Codex. |
| Metadati ricchi di Compaction nativa               | OpenClaw osserva l'inizio e il completamento della Compaction, ma non riceve un elenco stabile mantenuto/scartato, un delta di token o un payload di riepilogo. | Richiede eventi di Compaction Codex più ricchi.                                             |
| Intervento sulla Compaction                        | Gli hook di Compaction OpenClaw attuali sono a livello di notifica in modalità Codex.                                                           | Aggiungere hook Codex pre/post Compaction se i plugin devono porre veto o riscrivere la Compaction nativa. |
| Acquisizione byte per byte della richiesta API del modello | OpenClaw può acquisire richieste e notifiche dell'app-server, ma il core Codex costruisce internamente la richiesta finale all'API OpenAI.       | Richiede un evento di tracciamento delle richieste modello Codex o un'API di debug.        |

## Strumenti, media e Compaction

L'harness Codex cambia solo l'esecutore dell'agente incorporato di basso livello.

OpenClaw continua a costruire l'elenco degli strumenti e riceve risultati degli strumenti dinamici
dall'harness. Testo, immagini, video, musica, TTS, approvazioni e output degli strumenti di messaggistica
continuano attraverso il normale percorso di consegna OpenClaw.

Il relay degli hook nativi è intenzionalmente generico, ma il contratto di supporto v1 è
limitato ai percorsi degli strumenti nativi Codex e dei permessi che OpenClaw testa. Nel
runtime Codex, questo include payload shell, patch e MCP `PreToolUse`,
`PostToolUse` e `PermissionRequest`. Non presumere che ogni futuro
evento hook Codex sia una superficie di plugin OpenClaw finché il contratto runtime non lo
nomina.

Per `PermissionRequest`, OpenClaw restituisce decisioni esplicite di allow o deny
solo quando la policy decide. Un risultato senza decisione non è un allow. Codex lo tratta come assenza di
decisione dell'hook e passa al proprio percorso di guardian o approvazione utente.

Le richieste di approvazione degli strumenti MCP Codex vengono instradate attraverso il flusso di
approvazione dei plugin di OpenClaw quando Codex contrassegna `_meta.codex_approval_kind` come
`"mcp_tool_call"`. I prompt Codex `request_user_input` vengono inviati di nuovo alla
chat di origine, e il messaggio di follow-up successivo in coda risponde a quella richiesta del server
nativo invece di essere indirizzato come contesto aggiuntivo. Le altre richieste di elicitazione
MCP continuano a fallire in modo chiuso.

Il controllo della coda delle esecuzioni attive si mappa su `turn/steer` dell'app-server Codex. Con il valore predefinito `messages.queue.mode: "steer"`, OpenClaw raggruppa i messaggi di chat in coda per la finestra di quiete configurata e li invia come un'unica richiesta `turn/steer` in ordine di arrivo. La modalità legacy `queue` invia richieste `turn/steer` separate. Le svolte di revisione Codex e Compaction manuale possono rifiutare il controllo nello stesso turno; in tal caso OpenClaw usa la coda di follow-up quando la modalità selezionata consente il fallback. Vedi [Coda di controllo](/it/concepts/queue-steering).

Quando il modello selezionato usa l'harness Codex, la Compaction nativa del thread viene delegata all'app-server Codex. OpenClaw mantiene uno specchio della trascrizione per la cronologia del canale, la ricerca, `/new`, `/reset` e il futuro cambio di modello o harness. Lo specchio include il prompt dell'utente, il testo finale dell'assistente e i record leggeri di ragionamento o piano di Codex quando l'app-server li emette. Oggi OpenClaw registra solo i segnali di avvio e completamento della Compaction nativa. Non espone ancora un riepilogo della Compaction leggibile da una persona né un elenco verificabile delle voci che Codex ha mantenuto dopo la Compaction.

Poiché Codex possiede il thread nativo canonico, `tool_result_persist` attualmente non riscrive i record dei risultati degli strumenti nativi di Codex. Si applica solo quando OpenClaw sta scrivendo un risultato di strumento nella trascrizione di una sessione posseduta da OpenClaw.

La generazione di media non richiede PI. Immagini, video, musica, PDF, TTS e comprensione dei media continuano a usare le impostazioni del provider/modello corrispondenti, come `agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel` e `messages.tts`.

## Risoluzione dei problemi

**Codex non appare come un normale provider `/model`:** è previsto per le nuove configurazioni. Seleziona un modello `openai/gpt-*` con `agentRuntime.id: "codex"` (o un ref legacy `codex/*`), abilita `plugins.entries.codex.enabled` e controlla se `plugins.allow` esclude `codex`.

**OpenClaw usa PI invece di Codex:** `agentRuntime.id: "auto"` può ancora usare PI come backend di compatibilità quando nessun harness Codex rivendica l'esecuzione. Imposta `agentRuntime.id: "codex"` per forzare la selezione di Codex durante i test. Ora un runtime Codex forzato fallisce invece di ricadere su PI, a meno che tu non imposti esplicitamente `agentRuntime.fallback: "pi"`. Una volta selezionato l'app-server Codex, i suoi errori vengono esposti direttamente senza configurazione di fallback aggiuntiva.

**L'app-server viene rifiutato:** aggiorna Codex in modo che l'handshake dell'app-server riporti la versione `0.125.0` o successiva. Le prerelease della stessa versione o le versioni con suffisso di build come `0.125.0-alpha.2` o `0.125.0+custom` vengono rifiutate perché il limite minimo del protocollo stabile `0.125.0` è ciò che OpenClaw testa.

**Il rilevamento dei modelli è lento:** abbassa `plugins.entries.codex.config.discovery.timeoutMs` o disabilita il rilevamento.

**Il trasporto WebSocket fallisce immediatamente:** controlla `appServer.url`, `authToken` e che l'app-server remoto parli la stessa versione del protocollo dell'app-server Codex.

**Un modello non Codex usa PI:** è previsto, a meno che tu non abbia forzato `agentRuntime.id: "codex"` per quell'agente o selezionato un ref legacy `codex/*`. I ref semplici `openai/gpt-*` e quelli di altri provider restano sul loro normale percorso provider in modalità `auto`. Se forzi `agentRuntime.id: "codex"`, ogni turno incorporato per quell'agente deve essere un modello OpenAI supportato da Codex.

**Computer Use è installato ma gli strumenti non vengono eseguiti:** controlla `/codex computer-use status` da una nuova sessione. Se uno strumento riporta `Native hook relay unavailable`, usa `/new` o `/reset`; se il problema persiste, riavvia il Gateway per eliminare registrazioni obsolete degli hook nativi. Se `computer-use.list_apps` va in timeout, riavvia Codex Computer Use o Codex Desktop e riprova.

## Correlati

- [Plugin harness agente](/it/plugins/sdk-agent-harness)
- [Runtime agente](/it/concepts/agent-runtimes)
- [Provider di modelli](/it/concepts/model-providers)
- [Provider OpenAI](/it/providers/openai)
- [Stato](/it/cli/status)
- [Hook dei Plugin](/it/plugins/hooks)
- [Riferimento alla configurazione](/it/gateway/configuration-reference)
- [Test](/it/help/testing-live#live-codex-app-server-harness-smoke)
