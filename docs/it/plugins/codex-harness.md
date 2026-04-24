---
read_when:
    - Vuoi usare l'harness app-server Codex incluso
    - Ti servono riferimenti ai modelli Codex ed esempi di configurazione
    - Vuoi disattivare il fallback PI per distribuzioni solo Codex
summary: Eseguire i turni dell'agente incorporato di OpenClaw tramite l'harness app-server Codex incluso
title: Harness Codex
x-i18n:
    generated_at: "2026-04-24T08:51:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: c02b1e6cbaaefee858db7ebd7e306261683278ed9375bca6fe74855ca84eabd8
    source_path: plugins/codex-harness.md
    workflow: 15
---

Il Plugin `codex` incluso consente a OpenClaw di eseguire i turni dell'agente incorporato tramite
l'app-server Codex invece del harness PI integrato.

Usalo quando vuoi che Codex possieda la sessione agente di basso livello: scoperta
dei modelli, ripresa nativa dei thread, Compaction nativa ed esecuzione dell'app-server.
OpenClaw continua a gestire canali chat, file di sessione, selezione del modello, strumenti,
approvazioni, consegna dei media e mirror visibile della trascrizione.

I turni nativi Codex mantengono gli hook del Plugin OpenClaw come livello pubblico di compatibilità.
Questi sono hook OpenClaw in-process, non hook di comando `hooks.json` di Codex:

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `after_tool_call`
- `before_message_write` per i record di trascrizione mirror
- `agent_end`

I Plugin inclusi possono anche registrare una factory di estensione app-server Codex per aggiungere
middleware `tool_result` asincrono. Questo middleware viene eseguito per gli strumenti dinamici OpenClaw
dopo che OpenClaw esegue lo strumento e prima che il risultato venga restituito a Codex. È
separato dall'hook pubblico del Plugin `tool_result_persist`, che trasforma le scritture
dei risultati degli strumenti nelle trascrizioni possedute da OpenClaw.

L'harness è disattivato per impostazione predefinita. Le nuove configurazioni dovrebbero mantenere i riferimenti ai modelli OpenAI
canonici come `openai/gpt-*` e forzare esplicitamente
`embeddedHarness.runtime: "codex"` oppure `OPENCLAW_AGENT_RUNTIME=codex` quando
vogliono l'esecuzione nativa dell'app-server. I riferimenti legacy ai modelli `codex/*`
continuano a selezionare automaticamente l'harness per compatibilità.

## Scegli il prefisso corretto del modello

Le route della famiglia OpenAI dipendono dal prefisso. Usa `openai-codex/*` quando vuoi
Codex OAuth tramite PI; usa `openai/*` quando vuoi accesso diretto alle API OpenAI oppure
quando stai forzando l'harness nativo dell'app-server Codex:

| Riferimento modello | Percorso runtime | Usalo quando |
| ----------------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------- |
| `openai/gpt-5.4` | Provider OpenAI tramite pipeline OpenClaw/PI | Vuoi l'accesso diretto attuale all'API OpenAI Platform con `OPENAI_API_KEY`. |
| `openai-codex/gpt-5.5` | OpenAI Codex OAuth tramite OpenClaw/PI | Vuoi autenticazione ChatGPT/Codex subscription con il runner PI predefinito. |
| `openai/gpt-5.5` + `embeddedHarness.runtime: "codex"` | Harness app-server Codex | Vuoi l'esecuzione nativa dell'app-server Codex per il turno dell'agente incorporato. |

GPT-5.5 attualmente è disponibile in OpenClaw solo con subscription/OAuth. Usa
`openai-codex/gpt-5.5` per PI OAuth, oppure `openai/gpt-5.5` con l'harness
app-server Codex. L'accesso diretto con chiave API per `openai/gpt-5.5` sarà supportato
quando OpenAI abiliterà GPT-5.5 sulla API pubblica.

I riferimenti legacy `codex/gpt-*` restano accettati come alias di compatibilità. Le nuove configurazioni
PI Codex OAuth dovrebbero usare `openai-codex/gpt-*`; le nuove configurazioni per l'harness nativo app-server
dovrebbero usare `openai/gpt-*` più `embeddedHarness.runtime:
"codex"`.

`agents.defaults.imageModel` segue la stessa divisione di prefissi. Usa
`openai-codex/gpt-*` quando la comprensione delle immagini deve passare attraverso il percorso del provider OpenAI
Codex OAuth. Usa `codex/gpt-*` quando la comprensione delle immagini deve passare
attraverso un turno limitato dell'app-server Codex. Il modello dell'app-server Codex deve
pubblicizzare il supporto all'input immagine; i modelli Codex solo testo falliscono prima che inizi il turno media.

Usa `/status` per confermare l'harness effettivo della sessione corrente. Se la
selezione è sorprendente, abilita il logging di debug per il sottosistema `agents/harness`
e ispeziona il record strutturato `agent harness selected` del gateway. Include
id dell'harness selezionato, motivo della selezione, criterio runtime/fallback e,
in modalità `auto`, il risultato di supporto di ogni candidato Plugin.

La selezione dell'harness non è un controllo live della sessione. Quando viene eseguito un turno incorporato,
OpenClaw registra l'id dell'harness selezionato su quella sessione e continua a usarlo per
i turni successivi nello stesso id sessione. Cambia la configurazione `embeddedHarness` o
`OPENCLAW_AGENT_RUNTIME` quando vuoi che le sessioni future usino un altro harness;
usa `/new` o `/reset` per avviare una sessione nuova prima di passare una conversazione esistente tra PI e Codex.
Questo evita di riprodurre una trascrizione tramite due sistemi di sessione nativi incompatibili.

Le sessioni legacy create prima dei pin dell'harness vengono trattate come fissate a PI una volta che
hanno cronologia della trascrizione. Usa `/new` o `/reset` per far entrare quella conversazione in
Codex dopo aver cambiato la configurazione.

`/status` mostra l'harness effettivo non-PI accanto a `Fast`, ad esempio
`Fast · codex`. L'harness PI predefinito resta `Runner: pi (embedded)` e non
aggiunge un badge harness separato.

## Requisiti

- OpenClaw con il Plugin `codex` incluso disponibile.
- Codex app-server `0.118.0` o più recente.
- Autenticazione Codex disponibile per il processo app-server.

Il Plugin blocca handshake app-server più vecchi o senza versione. Questo mantiene
OpenClaw sulla superficie di protocollo contro cui è stato testato.

Per smoke test live e Docker, l'autenticazione in genere proviene da `OPENAI_API_KEY`, più
file facoltativi della CLI Codex come `~/.codex/auth.json` e
`~/.codex/config.toml`. Usa lo stesso materiale auth che usa il tuo app-server Codex locale.

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
      embeddedHarness: {
        runtime: "codex",
        fallback: "none",
      },
    },
  },
}
```

Se la tua configurazione usa `plugins.allow`, includi anche `codex`:

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

Le configurazioni legacy che impostano `agents.defaults.model` o il modello di un agente su
`codex/<model>` continuano ad abilitare automaticamente il Plugin `codex` incluso. Le nuove configurazioni dovrebbero
preferire `openai/<model>` più la voce esplicita `embeddedHarness` sopra.

## Aggiungi Codex senza sostituire altri modelli

Mantieni `runtime: "auto"` quando vuoi che i riferimenti legacy `codex/*` selezionino Codex e
PI per tutto il resto. Per le nuove configurazioni, preferisci `runtime: "codex"` esplicito sugli
agenti che dovrebbero usare l'harness.

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
      model: {
        primary: "openai/gpt-5.5",
        fallbacks: ["openai/gpt-5.5", "anthropic/claude-opus-4-6"],
      },
      models: {
        "openai/gpt-5.5": { alias: "gpt" },
        "anthropic/claude-opus-4-6": { alias: "opus" },
      },
      embeddedHarness: {
        runtime: "codex",
        fallback: "pi",
      },
    },
  },
}
```

Con questa forma:

- `/model gpt` oppure `/model openai/gpt-5.5` usa l'harness app-server Codex per questa configurazione.
- `/model opus` usa il percorso del provider Anthropic.
- Se viene selezionato un modello non-Codex, PI resta l'harness di compatibilità.

## Distribuzioni solo Codex

Disattiva il fallback PI quando devi dimostrare che ogni turno dell'agente incorporato usa
l'harness Codex:

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      embeddedHarness: {
        runtime: "codex",
        fallback: "none",
      },
    },
  },
}
```

Override dell'ambiente:

```bash
OPENCLAW_AGENT_RUNTIME=codex \
OPENCLAW_AGENT_HARNESS_FALLBACK=none \
openclaw gateway run
```

Con il fallback disattivato, OpenClaw fallisce subito se il Plugin Codex è disabilitato,
se l'app-server è troppo vecchio o se l'app-server non può avviarsi.

## Codex per agente

Puoi rendere un agente solo Codex mentre l'agente predefinito mantiene la normale
selezione automatica:

```json5
{
  agents: {
    defaults: {
      embeddedHarness: {
        runtime: "auto",
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
        embeddedHarness: {
          runtime: "codex",
          fallback: "none",
        },
      },
    ],
  },
}
```

Usa i normali comandi di sessione per cambiare agenti e modelli. `/new` crea una nuova
sessione OpenClaw e l'harness Codex crea o riprende il suo thread sidecar app-server
secondo necessità. `/reset` cancella il binding della sessione OpenClaw per quel thread
e consente al turno successivo di risolvere di nuovo l'harness dalla configurazione corrente.

## Scoperta dei modelli

Per impostazione predefinita, il Plugin Codex chiede all'app-server i modelli disponibili. Se
il discovery fallisce o va in timeout, usa un catalogo fallback incluso per:

- GPT-5.5
- GPT-5.4 mini
- GPT-5.2

Puoi regolare il discovery in `plugins.entries.codex.config.discovery`:

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

Disattiva il discovery quando vuoi che all'avvio venga evitato il probing di Codex e si resti sul
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

## Connessione all'app-server e criterio

Per impostazione predefinita, il Plugin avvia Codex localmente con:

```bash
codex app-server --listen stdio://
```

Per impostazione predefinita, OpenClaw avvia sessioni locali dell'harness Codex in modalità YOLO:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` e
`sandbox: "danger-full-access"`. Questa è la postura dell'operatore locale attendibile usata
per Heartbeat autonomi: Codex può usare strumenti shell e di rete senza
fermarsi su prompt di approvazione nativi a cui nessuno è presente per rispondere.

Per attivare le approvazioni riviste da Guardian di Codex, imposta `appServer.mode:
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

Guardian è un revisore di approvazione nativo di Codex. Quando Codex chiede di uscire dalla sandbox, scrivere fuori dallo spazio di lavoro o aggiungere permessi come accesso alla rete, Codex instrada quella richiesta di approvazione a un sotto-agente revisore invece che a un prompt umano. Il revisore applica il framework di rischio di Codex e approva o nega la richiesta specifica. Usa Guardian quando vuoi più guardrail rispetto alla modalità YOLO ma hai comunque bisogno che agenti unattended continuino a progredire.

Il preset `guardian` si espande in `approvalPolicy: "on-request"`, `approvalsReviewer: "guardian_subagent"` e `sandbox: "workspace-write"`. I singoli campi di criterio continuano a sovrascrivere `mode`, quindi le distribuzioni avanzate possono combinare il preset con scelte esplicite.

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

Campi `appServer` supportati:

| Campo | Predefinito | Significato |
| ------------------- | ---------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `transport` | `"stdio"` | `"stdio"` avvia Codex; `"websocket"` si collega a `url`. |
| `command` | `"codex"` | Eseguibile per il trasporto stdio. |
| `args` | `["app-server", "--listen", "stdio://"]` | Argomenti per il trasporto stdio. |
| `url` | non impostato | URL WebSocket dell'app-server. |
| `authToken` | non impostato | Token bearer per il trasporto WebSocket. |
| `headers` | `{}` | Header WebSocket aggiuntivi. |
| `requestTimeoutMs` | `60000` | Timeout per le chiamate control-plane dell'app-server. |
| `mode` | `"yolo"` | Preset per esecuzione YOLO o revisionata da Guardian. |
| `approvalPolicy` | `"never"` | Criterio di approvazione nativo Codex inviato ad avvio/ripresa/turno del thread. |
| `sandbox` | `"danger-full-access"` | Modalità sandbox nativa Codex inviata ad avvio/ripresa del thread. |
| `approvalsReviewer` | `"user"` | Usa `"guardian_subagent"` per lasciare che Codex Guardian esamini i prompt. |
| `serviceTier` | non impostato | Livello di servizio facoltativo dell'app-server Codex: `"fast"`, `"flex"` o `null`. I valori legacy non validi vengono ignorati. |

Le vecchie variabili d'ambiente continuano a funzionare come fallback per test locali quando
il campo di configurazione corrispondente non è impostato:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` è stato rimosso. Usa invece
`plugins.entries.codex.config.appServer.mode: "guardian"`, oppure
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` per test locali occasionali. La configurazione è
preferibile per distribuzioni ripetibili perché mantiene il comportamento del Plugin nello
stesso file revisionato del resto della configurazione dell'harness Codex.

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

Convalida dell'harness solo Codex, con fallback PI disabilitato:

```json5
{
  embeddedHarness: {
    fallback: "none",
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

Approvazioni Codex revisionate da Guardian:

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
            approvalsReviewer: "guardian_subagent",
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

La commutazione del modello resta controllata da OpenClaw. Quando una sessione OpenClaw è collegata
a un thread Codex esistente, il turno successivo invia di nuovo all'app-server il
modello OpenAI selezionato correntemente, il provider, il criterio di approvazione, la sandbox e il livello di servizio.
Passare da `openai/gpt-5.5` a `openai/gpt-5.2` mantiene il
binding del thread ma chiede a Codex di continuare con il modello appena selezionato.

## Comando Codex

Il Plugin incluso registra `/codex` come comando slash autorizzato. È
generico e funziona su qualsiasi canale che supporti i comandi testuali OpenClaw.

Forme comuni:

- `/codex status` mostra connettività live dell'app-server, modelli, account, limiti di frequenza, server MCP e Skills.
- `/codex models` elenca i modelli live dell'app-server Codex.
- `/codex threads [filter]` elenca i thread Codex recenti.
- `/codex resume <thread-id>` collega la sessione OpenClaw corrente a un thread Codex esistente.
- `/codex compact` chiede all'app-server Codex di compattare il thread collegato.
- `/codex review` avvia una review nativa Codex per il thread collegato.
- `/codex account` mostra stato dell'account e dei limiti di frequenza.
- `/codex mcp` elenca lo stato dei server MCP dell'app-server Codex.
- `/codex skills` elenca le Skills dell'app-server Codex.

`/codex resume` scrive lo stesso file di binding sidecar che l'harness usa per
i turni normali. Al messaggio successivo, OpenClaw riprende quel thread Codex, passa il
modello OpenClaw attualmente selezionato all'app-server e mantiene abilitata
la cronologia estesa.

La superficie dei comandi richiede Codex app-server `0.118.0` o più recente. I singoli
metodi di controllo vengono segnalati come `unsupported by this Codex app-server` se un
app-server futuro o personalizzato non espone quel metodo JSON-RPC.

## Confini degli hook

L'harness Codex ha tre livelli di hook:

| Livello | Proprietario | Scopo |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| Hook del Plugin OpenClaw | OpenClaw | Compatibilità prodotto/Plugin tra harness PI e Codex. |
| Middleware di estensione app-server Codex | Plugin inclusi OpenClaw | Comportamento per turno dell'adattatore attorno agli strumenti dinamici OpenClaw. |
| Hook nativi Codex | Codex | Ciclo di vita di basso livello di Codex e criterio nativo degli strumenti dalla configurazione Codex. |

OpenClaw non usa file `hooks.json` di progetto o globali di Codex per instradare
il comportamento del Plugin OpenClaw. Gli hook nativi Codex sono utili per operazioni
possedute da Codex come criterio shell, revisione nativa dei risultati degli strumenti, gestione dello stop e ciclo di vita nativo di Compaction/modello, ma non sono l'API del Plugin OpenClaw.

Per gli strumenti dinamici OpenClaw, OpenClaw esegue lo strumento dopo che Codex ha richiesto la
chiamata, quindi OpenClaw attiva il comportamento di Plugin e middleware che possiede nell'
adattatore dell'harness. Per gli strumenti nativi Codex, Codex possiede il record canonico dello strumento.
OpenClaw può riflettere eventi selezionati, ma non può riscrivere il thread nativo Codex
a meno che Codex non esponga quell'operazione tramite app-server o callback di hook nativi.

Quando versioni più recenti dell'app-server Codex esporranno eventi di hook nativi per Compaction e ciclo di vita del modello,
OpenClaw dovrà applicare un version-gate a quel supporto di protocollo e mappare gli
eventi nel contratto esistente degli hook OpenClaw dove la semantica è onesta.
Fino ad allora, gli eventi OpenClaw `before_compaction`, `after_compaction`, `llm_input` e
`llm_output` sono osservazioni a livello adattatore, non acquisizioni byte-per-byte
della richiesta interna o del payload di Compaction di Codex.

Le notifiche native dell'app-server Codex `hook/started` e `hook/completed` vengono
proiettate come eventi agente `codex_app_server.hook` per traiettoria e debug.
Non invocano hook del Plugin OpenClaw.

## Strumenti, media e Compaction

L'harness Codex cambia solo l'esecutore incorporato dell'agente di basso livello.

OpenClaw continua a costruire l'elenco degli strumenti e riceve i risultati degli strumenti dinamici dall'
harness. Testo, immagini, video, musica, TTS, approvazioni e output degli strumenti di messaggistica
continuano a passare nel normale percorso di consegna di OpenClaw.

Le richieste di approvazione degli strumenti MCP di Codex vengono instradate attraverso il flusso di
approvazione del Plugin OpenClaw quando Codex contrassegna `_meta.codex_approval_kind` come
`"mcp_tool_call"`. I prompt Codex `request_user_input` vengono rimandati alla chat
di origine e il messaggio di follow-up successivo in coda risponde a quella richiesta
nativa del server invece di essere diretto come contesto aggiuntivo. Le altre richieste di elicitation MCP continuano a fallire in modalità fail-closed.

Quando il modello selezionato usa l'harness Codex, la Compaction del thread nativo viene delegata all'app-server Codex. OpenClaw mantiene un mirror della trascrizione per cronologia del canale, ricerca, `/new`, `/reset` e future commutazioni di modello o harness. Il
mirror include il prompt utente, il testo finale dell'assistente e record leggeri di reasoning o piano di Codex
quando l'app-server li emette. Oggi OpenClaw registra solo i segnali nativi di inizio e completamento della Compaction. Non espone ancora un riepilogo di Compaction leggibile da un umano né un elenco verificabile delle voci che Codex ha mantenuto dopo la Compaction.

Poiché Codex possiede il thread nativo canonico, `tool_result_persist` attualmente non
riscrive i record dei risultati degli strumenti nativi Codex. Si applica solo quando
OpenClaw sta scrivendo un risultato di strumento in una trascrizione di sessione posseduta da OpenClaw.

La generazione di media non richiede PI. Immagini, video, musica, PDF, TTS e comprensione dei media
continuano a usare le impostazioni corrispondenti di provider/modello come
`agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel` e
`messages.tts`.

## Risoluzione dei problemi

**Codex non appare in `/model`:** abilita `plugins.entries.codex.enabled`,
seleziona un modello `openai/gpt-*` con `embeddedHarness.runtime: "codex"` (oppure un
riferimento legacy `codex/*`) e controlla se `plugins.allow` esclude `codex`.

**OpenClaw usa PI invece di Codex:** se nessun harness Codex reclama l'esecuzione,
OpenClaw può usare PI come backend di compatibilità. Imposta
`embeddedHarness.runtime: "codex"` per forzare la selezione di Codex durante i test, oppure
`embeddedHarness.fallback: "none"` per fallire quando nessun harness Plugin corrisponde. Una volta
selezionato l'app-server Codex, i suoi errori emergono direttamente senza necessità di
configurazioni aggiuntive di fallback.

**L'app-server viene rifiutato:** aggiorna Codex in modo che l'handshake dell'app-server
riporti la versione `0.118.0` o più recente.

**La scoperta dei modelli è lenta:** abbassa `plugins.entries.codex.config.discovery.timeoutMs`
oppure disattiva il discovery.

**Il trasporto WebSocket fallisce immediatamente:** controlla `appServer.url`, `authToken`
e che l'app-server remoto parli la stessa versione del protocollo app-server Codex.

**Un modello non-Codex usa PI:** è previsto a meno che tu non abbia forzato
`embeddedHarness.runtime: "codex"` (oppure selezionato un riferimento legacy `codex/*`). I normali
riferimenti `openai/gpt-*` e degli altri provider restano sul loro normale percorso provider.

## Correlati

- [Agent Harness Plugins](/it/plugins/sdk-agent-harness)
- [Model Providers](/it/concepts/model-providers)
- [Configuration Reference](/it/gateway/configuration-reference)
- [Testing](/it/help/testing-live#live-codex-app-server-harness-smoke)
