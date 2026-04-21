---
read_when:
    - Vuoi usare l'harness app-server Codex incluso
    - Ti servono riferimenti ai modelli Codex ed esempi di configurazione
    - Vuoi disabilitare il fallback PI per distribuzioni solo Codex
summary: Esegui i turni degli agenti embedded di OpenClaw tramite l'harness app-server Codex incluso
title: Harness Codex
x-i18n:
    generated_at: "2026-04-21T08:25:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3f0cdaf68be3b2257de1046103ff04f53f9d3a65ffc15ab7af5ab1f425643d6c
    source_path: plugins/codex-harness.md
    workflow: 15
---

# Harness Codex

Il plugin `codex` incluso consente a OpenClaw di eseguire i turni degli agenti embedded tramite
l'app-server Codex invece che tramite l'harness PI integrato.

Usalo quando vuoi che Codex gestisca la sessione agente di basso livello: discovery
dei modelli, ripresa nativa dei thread, compattazione nativa ed esecuzione dell'app-server.
OpenClaw continua comunque a gestire canali chat, file di sessione, selezione del modello, strumenti,
approvazioni, consegna dei media e il mirror visibile della trascrizione.

L'harness è disattivato per impostazione predefinita. Viene selezionato solo quando il plugin `codex` è
abilitato e il modello risolto è un modello `codex/*`, oppure quando forzi esplicitamente
`embeddedHarness.runtime: "codex"` o `OPENCLAW_AGENT_RUNTIME=codex`.
Se non configuri mai `codex/*`, le esecuzioni esistenti PI, OpenAI, Anthropic, Gemini, local
e custom-provider mantengono il loro comportamento attuale.

## Scegli il prefisso modello corretto

OpenClaw ha percorsi separati per l'accesso in stile OpenAI e Codex:

| Riferimento modello   | Percorso runtime                            | Usalo quando                                                              |
| --------------------- | ------------------------------------------- | ------------------------------------------------------------------------- |
| `openai/gpt-5.4`      | Provider OpenAI tramite plumbing OpenClaw/PI | Vuoi accesso diretto all'API OpenAI Platform con `OPENAI_API_KEY`.        |
| `openai-codex/gpt-5.4` | Provider OpenAI Codex OAuth tramite PI      | Vuoi ChatGPT/Codex OAuth senza l'harness app-server Codex.                |
| `codex/gpt-5.4`       | Provider Codex incluso più harness Codex    | Vuoi l'esecuzione nativa dell'app-server Codex per il turno agente embedded. |

L'harness Codex acquisisce solo i riferimenti modello `codex/*`. I riferimenti esistenti `openai/*`,
`openai-codex/*`, Anthropic, Gemini, xAI, local e custom provider mantengono
i loro percorsi normali.

## Requisiti

- OpenClaw con il plugin `codex` incluso disponibile.
- App-server Codex `0.118.0` o successivo.
- Autenticazione Codex disponibile per il processo app-server.

Il plugin blocca handshake app-server più vecchi o senza versione. Questo mantiene
OpenClaw sulla superficie di protocollo su cui è stato testato.

Per test live e smoke test Docker, l'autenticazione di solito proviene da `OPENAI_API_KEY`, più
file facoltativi della CLI Codex come `~/.codex/auth.json` e
`~/.codex/config.toml`. Usa lo stesso materiale di autenticazione usato dal tuo app-server Codex locale.

## Configurazione minima

Usa `codex/gpt-5.4`, abilita il plugin incluso e forza l'harness `codex`:

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

Impostare `agents.defaults.model` o il modello di un agente su `codex/<model>` inoltre
abilita automaticamente il plugin `codex` incluso. La voce esplicita del plugin è comunque
utile nelle configurazioni condivise perché rende evidente l'intento della distribuzione.

## Aggiungere Codex senza sostituire gli altri modelli

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
- Se viene selezionato un modello non-Codex, PI resta l'harness di compatibilità.

## Distribuzioni solo Codex

Disabilita il fallback PI quando devi dimostrare che ogni turno dell'agente embedded usa
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

Override tramite ambiente:

```bash
OPENCLAW_AGENT_RUNTIME=codex \
OPENCLAW_AGENT_HARNESS_FALLBACK=none \
openclaw gateway run
```

Con il fallback disabilitato, OpenClaw fallisce subito se il plugin Codex è disabilitato,
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
sessione OpenClaw e l'harness Codex crea o riprende il suo thread sidecar app-server
quando necessario. `/reset` cancella il binding della sessione OpenClaw per quel thread.

## Discovery dei modelli

Per impostazione predefinita, il plugin Codex chiede all'app-server i modelli disponibili. Se
la discovery fallisce o va in timeout, usa il catalogo fallback incluso:

- `codex/gpt-5.4`
- `codex/gpt-5.4-mini`
- `codex/gpt-5.2`

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

Disabilita la discovery quando vuoi che l'avvio eviti di sondare Codex e resti sul
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

Per impostazione predefinita, il plugin avvia Codex localmente con:

```bash
codex app-server --listen stdio://
```

Per impostazione predefinita, OpenClaw chiede a Codex di richiedere approvazioni native. Puoi regolare ulteriormente
questa policy, ad esempio rendendola più rigida e instradando le revisioni tramite il
guardian:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            approvalPolicy: "untrusted",
            approvalsReviewer: "guardian_subagent",
            sandbox: "workspace-write",
            serviceTier: "priority",
          },
        },
      },
    },
  },
}
```

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

| Campo               | Predefinito                               | Significato                                                               |
| ------------------- | ----------------------------------------- | ------------------------------------------------------------------------- |
| `transport`         | `"stdio"`                                 | `"stdio"` avvia Codex; `"websocket"` si connette a `url`.                |
| `command`           | `"codex"`                                 | Eseguibile per il trasporto stdio.                                        |
| `args`              | `["app-server", "--listen", "stdio://"]`  | Argomenti per il trasporto stdio.                                         |
| `url`               | non impostato                             | URL WebSocket dell'app-server.                                            |
| `authToken`         | non impostato                             | Token Bearer per il trasporto WebSocket.                                  |
| `headers`           | `{}`                                      | Header WebSocket aggiuntivi.                                              |
| `requestTimeoutMs`  | `60000`                                   | Timeout per le chiamate control-plane dell'app-server.                    |
| `approvalPolicy`    | `"on-request"`                            | Policy di approvazione nativa Codex inviata a start/resume/turn del thread. |
| `sandbox`           | `"workspace-write"`                       | Modalità sandbox nativa Codex inviata a start/resume del thread.          |
| `approvalsReviewer` | `"user"`                                  | Usa `"guardian_subagent"` per lasciare che il guardian Codex esamini le approvazioni native. |
| `serviceTier`       | non impostato                             | Service tier Codex facoltativo, ad esempio `"priority"`.                  |

Le variabili d'ambiente meno recenti continuano a funzionare come fallback per i test locali quando
il campo di configurazione corrispondente non è impostato:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`
- `OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1`

La configurazione è preferibile per distribuzioni ripetibili.

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

Validazione harness solo Codex, con fallback PI disabilitato:

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

Approvazioni Codex revisionate dal guardian:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
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

Il cambio modello resta controllato da OpenClaw. Quando una sessione OpenClaw è collegata
a un thread Codex esistente, il turno successivo invia di nuovo all'
app-server il modello `codex/*`, provider, policy di approvazione, sandbox e service tier attualmente selezionati.
Passare da `codex/gpt-5.4` a `codex/gpt-5.2` mantiene il binding del thread ma chiede a Codex di continuare con il
nuovo modello selezionato.

## Comando Codex

Il plugin incluso registra `/codex` come comando slash autorizzato. È
generico e funziona su qualunque canale che supporti i comandi di testo OpenClaw.

Forme comuni:

- `/codex status` mostra connettività live dell'app-server, modelli, account, limiti di frequenza, server MCP e Skills.
- `/codex models` elenca i modelli live dell'app-server Codex.
- `/codex threads [filter]` elenca i thread Codex recenti.
- `/codex resume <thread-id>` collega la sessione OpenClaw corrente a un thread Codex esistente.
- `/codex compact` chiede all'app-server Codex di compattare il thread collegato.
- `/codex review` avvia la revisione nativa Codex per il thread collegato.
- `/codex account` mostra stato dell'account e dei limiti di frequenza.
- `/codex mcp` elenca lo stato dei server MCP dell'app-server Codex.
- `/codex skills` elenca le Skills dell'app-server Codex.

`/codex resume` scrive lo stesso file di binding sidecar che l'harness usa per
i normali turni. Al messaggio successivo, OpenClaw riprende quel thread Codex, passa il
modello OpenClaw `codex/*` attualmente selezionato all'app-server e mantiene abilitata la
cronologia estesa.

La superficie dei comandi richiede Codex app-server `0.118.0` o successivo. I singoli
metodi di controllo vengono riportati come `unsupported by this Codex app-server` se un
futuro app-server o un app-server personalizzato non espone quel metodo JSON-RPC.

## Strumenti, media e compattazione

L'harness Codex cambia solo l'esecutore embedded dell'agente di basso livello.

OpenClaw continua a costruire l'elenco degli strumenti e a ricevere risultati dinamici degli strumenti dall'
harness. Testo, immagini, video, musica, TTS, approvazioni e output degli strumenti di messaggistica
continuano a passare attraverso il normale percorso di consegna OpenClaw.

Quando il modello selezionato usa l'harness Codex, la compattazione nativa del thread viene
delegata all'app-server Codex. OpenClaw mantiene un mirror della trascrizione per cronologia del canale,
ricerca, `/new`, `/reset` e futuri cambi di modello o harness. Il
mirror include il prompt utente, il testo finale dell'assistente e record leggeri di ragionamento o piano di Codex
quando l'app-server li emette.

La generazione di media non richiede PI. Immagine, video, musica, PDF, TTS e comprensione
dei media continuano a usare le impostazioni provider/modello corrispondenti come
`agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel` e
`messages.tts`.

## Risoluzione dei problemi

**Codex non compare in `/model`:** abilita `plugins.entries.codex.enabled`,
imposta un riferimento modello `codex/*`, oppure controlla se `plugins.allow` esclude `codex`.

**OpenClaw fa fallback a PI:** imposta `embeddedHarness.fallback: "none"` oppure
`OPENCLAW_AGENT_HARNESS_FALLBACK=none` durante i test.

**L'app-server viene rifiutato:** aggiorna Codex in modo che l'handshake dell'app-server
riporti la versione `0.118.0` o successiva.

**La discovery dei modelli è lenta:** riduci `plugins.entries.codex.config.discovery.timeoutMs`
oppure disabilita la discovery.

**Il trasporto WebSocket fallisce immediatamente:** controlla `appServer.url`, `authToken`
e che l'app-server remoto parli la stessa versione del protocollo app-server Codex.

**Un modello non-Codex usa PI:** è previsto. L'harness Codex gestisce solo
i riferimenti modello `codex/*`.

## Correlati

- [Agent Harness Plugins](/it/plugins/sdk-agent-harness)
- [Model Providers](/it/concepts/model-providers)
- [Configuration Reference](/it/gateway/configuration-reference)
- [Testing](/it/help/testing#live-codex-app-server-harness-smoke)
