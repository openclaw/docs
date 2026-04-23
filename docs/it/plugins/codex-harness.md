---
read_when:
    - Vuoi usare l'harness app-server Codex incluso
    - Hai bisogno di riferimenti modello Codex ed esempi di configurazione
    - Vuoi disabilitare il fallback PI per distribuzioni solo Codex
summary: Esegui i turni dell'agente incorporato di OpenClaw tramite l'harness app-server Codex incluso
title: Harness Codex
x-i18n:
    generated_at: "2026-04-23T08:31:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8172af40edb7d1f7388a606df1c8f776622ffd82b46245fb9fbd184fbf829356
    source_path: plugins/codex-harness.md
    workflow: 15
---

# Harness Codex

Il Plugin incluso `codex` consente a OpenClaw di eseguire i turni dell'agente incorporato tramite
l'app-server Codex invece che tramite l'harness PI integrato.

Usalo quando vuoi che Codex gestisca la sessione agente di basso livello: scoperta
dei modelli, ripresa nativa dei thread, Compaction nativa ed esecuzione app-server.
OpenClaw continua comunque a gestire i canali chat, i file di sessione, la selezione del modello, gli strumenti,
le approvazioni, la consegna dei media e il mirror visibile della trascrizione.

I turni Codex nativi rispettano anche gli hook condivisi dei plugin così prompt shim,
automazione consapevole della Compaction, middleware degli strumenti e osservatori del ciclo di vita restano
allineati con l'harness PI:

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `tool_result`, `after_tool_call`
- `before_message_write`
- `agent_end`

I plugin inclusi possono anche registrare una factory di estensione app-server Codex per aggiungere
middleware `tool_result` asincrono.

L'harness è disattivato per impostazione predefinita. Viene selezionato solo quando il Plugin `codex` è
abilitato e il modello risolto è un modello `codex/*`, oppure quando forzi esplicitamente
`embeddedHarness.runtime: "codex"` o `OPENCLAW_AGENT_RUNTIME=codex`.
Se non configuri mai `codex/*`, le esecuzioni esistenti PI, OpenAI, Anthropic, Gemini, local
e custom-provider mantengono il loro comportamento attuale.

## Scegli il prefisso modello corretto

OpenClaw ha percorsi separati per l'accesso in stile OpenAI e Codex:

| Riferimento modello  | Percorso runtime                              | Usalo quando                                                             |
| -------------------- | --------------------------------------------- | ------------------------------------------------------------------------ |
| `openai/gpt-5.4`     | Provider OpenAI tramite plumbing OpenClaw/PI  | Vuoi accesso diretto alla OpenAI Platform API con `OPENAI_API_KEY`.     |
| `openai-codex/gpt-5.4` | Provider OAuth OpenAI Codex tramite PI      | Vuoi OAuth ChatGPT/Codex senza l'harness app-server Codex.              |
| `codex/gpt-5.4`      | Provider Codex incluso più harness Codex      | Vuoi esecuzione nativa dell'app-server Codex per il turno agente incorporato. |

L'harness Codex gestisce solo i riferimenti modello `codex/*`. I riferimenti esistenti `openai/*`,
`openai-codex/*`, Anthropic, Gemini, xAI, local e custom provider mantengono
i loro percorsi normali.

## Requisiti

- OpenClaw con il Plugin incluso `codex` disponibile.
- App-server Codex `0.118.0` o più recente.
- Autenticazione Codex disponibile per il processo app-server.

Il Plugin blocca handshake app-server più vecchi o senza versione. Questo mantiene
OpenClaw sulla surface del protocollo contro cui è stato testato.

Per i test smoke live e Docker, l'autenticazione di solito proviene da `OPENAI_API_KEY`, più
eventuali file CLI Codex come `~/.codex/auth.json` e
`~/.codex/config.toml`. Usa lo stesso materiale di autenticazione usato dal tuo app-server Codex locale.

## Config minima

Usa `codex/gpt-5.4`, abilita il Plugin incluso e forza l'harness `codex`:

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
      model: "codex/gpt-5.4",
      embeddedHarness: {
        runtime: "codex",
        fallback: "none",
      },
    },
  },
}
```

Se la tua config usa `plugins.allow`, includi anche `codex` lì:

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

Impostare `agents.defaults.model` o un modello agente su `codex/<model>` inoltre
abilita automaticamente il Plugin incluso `codex`. La voce esplicita del Plugin è comunque
utile nelle config condivise perché rende chiara l'intenzione di deployment.

## Aggiungi Codex senza sostituire gli altri modelli

Mantieni `runtime: "auto"` quando vuoi Codex per i modelli `codex/*` e PI per
tutto il resto:

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
        primary: "codex/gpt-5.4",
        fallbacks: ["openai/gpt-5.4", "anthropic/claude-opus-4-6"],
      },
      models: {
        "codex/gpt-5.4": { alias: "codex" },
        "codex/gpt-5.4-mini": { alias: "codex-mini" },
        "openai/gpt-5.4": { alias: "gpt" },
        "anthropic/claude-opus-4-6": { alias: "opus" },
      },
      embeddedHarness: {
        runtime: "auto",
        fallback: "pi",
      },
    },
  },
}
```

Con questa struttura:

- `/model codex` o `/model codex/gpt-5.4` usa l'harness app-server Codex.
- `/model gpt` o `/model openai/gpt-5.4` usa il percorso del provider OpenAI.
- `/model opus` usa il percorso del provider Anthropic.
- Se viene selezionato un modello non Codex, PI resta l'harness di compatibilità.

## Deployment solo Codex

Disabilita il fallback PI quando devi dimostrare che ogni turno dell'agente incorporato usa
l'harness Codex:

```json5
{
  agents: {
    defaults: {
      model: "codex/gpt-5.4",
      embeddedHarness: {
        runtime: "codex",
        fallback: "none",
      },
    },
  },
}
```

Override d'ambiente:

```bash
OPENCLAW_AGENT_RUNTIME=codex \
OPENCLAW_AGENT_HARNESS_FALLBACK=none \
openclaw gateway run
```

Con il fallback disabilitato, OpenClaw fallisce in anticipo se il Plugin Codex è disabilitato,
se il modello richiesto non è un riferimento `codex/*`, se l'app-server è troppo vecchio o se
l'app-server non può avviarsi.

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
        model: "codex/gpt-5.4",
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
sessione OpenClaw e l'harness Codex crea o riprende il proprio thread app-server sidecar
secondo necessità. `/reset` cancella l'associazione della sessione OpenClaw per quel thread.

## Scoperta dei modelli

Per impostazione predefinita, il Plugin Codex chiede all'app-server i modelli disponibili. Se
la scoperta fallisce o va in timeout, usa il catalogo di fallback incluso:

- `codex/gpt-5.4`
- `codex/gpt-5.4-mini`
- `codex/gpt-5.2`

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

Disabilita la scoperta quando vuoi che l'avvio eviti di interrogare Codex e si attenga al
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

Per impostazione predefinita, il Plugin avvia Codex localmente con:

```bash
codex app-server --listen stdio://
```

Per impostazione predefinita, OpenClaw avvia le sessioni locali dell'harness Codex in modalità YOLO:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` e
`sandbox: "danger-full-access"`. Questa è la postura dell'operatore locale fidato usata
per Heartbeat autonomi: Codex può usare strumenti shell e di rete senza
fermarsi su prompt di approvazione nativi a cui nessuno è presente per rispondere.

Per scegliere approvazioni riviste da Guardian di Codex, imposta `appServer.mode:
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

La modalità Guardian si espande in:

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

Guardian è un revisore di approvazioni nativo di Codex. Quando Codex chiede di uscire dal
sandbox, scrivere fuori dal workspace o aggiungere permessi come l'accesso alla rete,
Codex instrada quella richiesta di approvazione a un subagente revisore invece che a un
prompt umano. Il revisore raccoglie contesto e applica il framework di rischio di Codex, poi
approva o nega la richiesta specifica. Guardian è utile quando vuoi più guardrail
della modalità YOLO ma hai comunque bisogno che agenti e Heartbeat non presidiati
facciano progressi.

L'harness live Docker include una sonda Guardian quando
`OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`. Avvia l'harness Codex in
modalità Guardian, verifica che un comando shell benigno con privilegi elevati venga approvato e
verifica che il caricamento di un falso segreto verso una destinazione esterna non attendibile venga
negato così che l'agente chieda di nuovo un'approvazione esplicita.

I singoli campi di policy continuano comunque ad avere priorità su `mode`, quindi i deployment avanzati possono
mescolare il preset con scelte esplicite.

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

| Campo               | Predefinito                               | Significato                                                                                              |
| ------------------- | ----------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `transport`         | `"stdio"`                                 | `"stdio"` avvia Codex; `"websocket"` si connette a `url`.                                               |
| `command`           | `"codex"`                                 | Eseguibile per il trasporto stdio.                                                                       |
| `args`              | `["app-server", "--listen", "stdio://"]`  | Argomenti per il trasporto stdio.                                                                        |
| `url`               | non impostato                             | URL WebSocket dell'app-server.                                                                           |
| `authToken`         | non impostato                             | Bearer token per il trasporto WebSocket.                                                                 |
| `headers`           | `{}`                                      | Header WebSocket aggiuntivi.                                                                             |
| `requestTimeoutMs`  | `60000`                                   | Timeout per le chiamate del control plane dell'app-server.                                               |
| `mode`              | `"yolo"`                                  | Preset per esecuzione YOLO o revisionata da guardian.                                                    |
| `approvalPolicy`    | `"never"`                                 | Policy di approvazione nativa di Codex inviata a start/resume/turn del thread.                          |
| `sandbox`           | `"danger-full-access"`                    | Modalità sandbox nativa di Codex inviata a start/resume.                                                 |
| `approvalsReviewer` | `"user"`                                  | Usa `"guardian_subagent"` per lasciare che Codex Guardian esamini i prompt.                             |
| `serviceTier`       | non impostato                             | Livello di servizio facoltativo dell'app-server Codex: `"fast"`, `"flex"` o `null`. I valori legacy non validi vengono ignorati. |

Le vecchie variabili d'ambiente continuano a funzionare come fallback per i test locali quando
il campo config corrispondente non è impostato:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` è stato rimosso. Usa invece
`plugins.entries.codex.config.appServer.mode: "guardian"` oppure
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` per test locali una tantum. La config è
preferita per deployment ripetibili perché mantiene il comportamento del Plugin nello
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

Validazione dell'harness solo Codex, con fallback PI disabilitato:

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

Il cambio di modello resta controllato da OpenClaw. Quando una sessione OpenClaw è collegata
a un thread Codex esistente, il turno successivo invia di nuovo all'app-server il
modello `codex/*`, il provider, la policy di approvazione, il sandbox e il service tier
attualmente selezionati. Passare da `codex/gpt-5.4` a `codex/gpt-5.2` mantiene
l'associazione del thread ma chiede a Codex di continuare con il modello appena selezionato.

## Comando Codex

Il Plugin incluso registra `/codex` come comando slash autorizzato. È
generico e funziona su qualsiasi canale che supporti i comandi testuali OpenClaw.

Forme comuni:

- `/codex status` mostra connettività live all'app-server, modelli, account, rate limit, server MCP e Skills.
- `/codex models` elenca i modelli live dell'app-server Codex.
- `/codex threads [filter]` elenca i thread Codex recenti.
- `/codex resume <thread-id>` collega la sessione OpenClaw corrente a un thread Codex esistente.
- `/codex compact` chiede all'app-server Codex di eseguire la Compaction del thread collegato.
- `/codex review` avvia la revisione nativa Codex per il thread collegato.
- `/codex account` mostra stato dell'account e dei rate limit.
- `/codex mcp` elenca lo stato dei server MCP dell'app-server Codex.
- `/codex skills` elenca le Skills dell'app-server Codex.

`/codex resume` scrive lo stesso file sidecar di associazione usato dall'harness per i
turni normali. Al messaggio successivo, OpenClaw riprende quel thread Codex, passa il
modello OpenClaw `codex/*` attualmente selezionato all'app-server e mantiene abilitata la
cronologia estesa.

La surface di comando richiede app-server Codex `0.118.0` o più recente. I singoli
metodi di controllo vengono segnalati come `unsupported by this Codex app-server` se un
app-server futuro o personalizzato non espone quel metodo JSON-RPC.

## Strumenti, media e Compaction

L'harness Codex cambia solo l'esecutore agente incorporato di basso livello.

OpenClaw continua a costruire l'elenco degli strumenti e a ricevere risultati dinamici degli strumenti dall'harness. Testo, immagini, video, musica, TTS, approvazioni e output degli strumenti di messaggistica
continuano a passare attraverso il normale percorso di consegna OpenClaw.

Le elicitation di approvazione degli strumenti MCP di Codex vengono instradate tramite il flusso di
approvazione dei plugin di OpenClaw quando Codex contrassegna `_meta.codex_approval_kind` come
`"mcp_tool_call"`; le altre richieste di elicitation e input libero continuano invece a fallire in modo chiuso.

Quando il modello selezionato usa l'harness Codex, la Compaction nativa del thread viene
delegata all'app-server Codex. OpenClaw mantiene un mirror della trascrizione per la
cronologia del canale, la ricerca, `/new`, `/reset` e futuri cambi di modello o harness. Il
mirror include il prompt utente, il testo finale dell'assistente e record leggeri di ragionamento o piano di Codex quando l'app-server li emette. Oggi, OpenClaw registra solo i segnali nativi
di inizio e completamento della Compaction. Non espone ancora un riepilogo leggibile della Compaction
né un elenco verificabile di quali voci Codex ha mantenuto dopo la Compaction.

La generazione di media non richiede PI. Immagini, video, musica, PDF, TTS e comprensione dei
media continuano a usare le impostazioni provider/modello corrispondenti come
`agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel` e
`messages.tts`.

## Risoluzione dei problemi

**Codex non compare in `/model`:** abilita `plugins.entries.codex.enabled`,
imposta un riferimento modello `codex/*`, oppure controlla se `plugins.allow` esclude `codex`.

**OpenClaw usa PI invece di Codex:** se nessun harness Codex gestisce l'esecuzione,
OpenClaw può usare PI come backend di compatibilità. Imposta
`embeddedHarness.runtime: "codex"` per forzare la selezione di Codex durante i test, oppure
`embeddedHarness.fallback: "none"` per fallire quando nessun harness Plugin corrisponde. Una volta
selezionato l'app-server Codex, i suoi errori emergono direttamente senza ulteriore
configurazione di fallback.

**L'app-server viene rifiutato:** aggiorna Codex affinché l'handshake dell'app-server
riporti la versione `0.118.0` o più recente.

**La scoperta dei modelli è lenta:** riduci `plugins.entries.codex.config.discovery.timeoutMs`
oppure disabilita la scoperta.

**Il trasporto WebSocket fallisce immediatamente:** controlla `appServer.url`, `authToken`
e che l'app-server remoto parli la stessa versione del protocollo app-server Codex.

**Un modello non Codex usa PI:** è previsto. L'harness Codex gestisce solo
i riferimenti modello `codex/*`.

## Correlati

- [Agent Harness Plugins](/it/plugins/sdk-agent-harness)
- [Model Providers](/it/concepts/model-providers)
- [Configuration Reference](/it/gateway/configuration-reference)
- [Testing](/it/help/testing#live-codex-app-server-harness-smoke)
