---
read_when:
    - Vuoi usare l'harness app-server Codex incluso
    - Ti servono esempi di configurazione dell'harness Codex
    - Vuoi che le distribuzioni solo Codex falliscano invece di ripiegare su PI
summary: Esegui i turni dell'agente incorporato di OpenClaw tramite l'harness app-server Codex incluso
title: Harness di Codex
x-i18n:
    generated_at: "2026-05-10T19:42:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: a43e58bb97b5216318f8e5a58adb670930d57595f5cc4e85eccb65a9d0d33281
    source_path: plugins/codex-harness.md
    workflow: 16
---

Il plugin `codex` incluso consente a OpenClaw di eseguire turni agent OpenAI incorporati
tramite Codex app-server invece dell'harness PI integrato.

Usa l'harness Codex quando vuoi che Codex gestisca la sessione agent di basso livello:
ripresa nativa del thread, continuazione nativa degli strumenti, Compaction nativa ed
esecuzione app-server. OpenClaw continua a gestire canali di chat, file di sessione,
selezione del modello, strumenti dinamici OpenClaw, approvazioni, consegna dei media e
mirror visibile della trascrizione.

La configurazione normale usa riferimenti ai modelli OpenAI canonici come `openai/gpt-5.5`.
Non configurare riferimenti di modello `openai-codex/gpt-*`. `openai-codex` è il provider
del profilo di autenticazione per i profili Codex OAuth o Codex con chiave API, non il prefisso
del provider di modello per la nuova configurazione agent.

Per la suddivisione più ampia tra modello/provider/runtime, inizia da
[Runtime agent](/it/concepts/agent-runtimes). La versione breve è:
`openai/gpt-5.5` è il riferimento del modello, `codex` è il runtime e Telegram,
Discord, Slack o un altro canale rimane la superficie di comunicazione.

## Requisiti

- OpenClaw con il plugin `codex` incluso disponibile.
- Se la tua configurazione usa `plugins.allow`, includi `codex`.
- Codex app-server `0.125.0` o più recente. Il plugin incluso gestisce per impostazione predefinita
  un binario Codex app-server compatibile, quindi i comandi `codex` locali in `PATH` non
  influiscono sul normale avvio dell'harness.
- Autenticazione Codex disponibile tramite `openclaw models auth login --provider openai-codex`,
  un account app-server nella home Codex dell'agent, oppure un profilo di autenticazione Codex
  esplicito con chiave API.

Per precedenza dell'autenticazione, isolamento dell'ambiente, comandi app-server personalizzati, discovery dei modelli
e tutti i campi di configurazione, vedi
[Riferimento dell'harness Codex](/it/plugins/codex-harness-reference).

## Avvio rapido

La maggior parte degli utenti che vuole Codex in OpenClaw vuole questo percorso: accedi con un
abbonamento ChatGPT/Codex, abilita il plugin `codex` incluso e usa un riferimento
di modello `openai/gpt-*` canonico.

Accedi con Codex OAuth:

```bash
openclaw models auth login --provider openai-codex
```

Abilita il plugin `codex` incluso e seleziona un modello agent OpenAI:

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
    },
  },
}
```

Se la tua configurazione usa `plugins.allow`, aggiungi anche lì `codex`:

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

Riavvia il Gateway dopo aver modificato la configurazione del plugin. Se una chat esistente ha già
una sessione, usa `/new` o `/reset` prima di testare modifiche al runtime, in modo che il turno
successivo risolva l'harness dalla configurazione corrente.

## Configurazione

La configurazione di avvio rapido è la configurazione minima funzionante dell'harness Codex. Imposta le opzioni
dell'harness Codex nella configurazione OpenClaw e usa la CLI solo per l'autenticazione Codex:

| Esigenza                               | Impostazione                                                       | Dove                           |
| -------------------------------------- | ------------------------------------------------------------------ | ------------------------------ |
| Abilitare l'harness                    | `plugins.entries.codex.enabled: true`                              | Configurazione OpenClaw        |
| Mantenere un'installazione di plugin allowlistata | Includi `codex` in `plugins.allow`                                 | Configurazione OpenClaw        |
| Instradare i turni agent OpenAI tramite Codex | `agents.defaults.model` o `agents.list[].model` come `openai/gpt-*` | Configurazione agent OpenClaw  |
| Accedere con Codex OAuth               | `openclaw models auth login --provider openai-codex`               | Profilo di autenticazione CLI  |
| Fallire in modo chiuso quando Codex non è disponibile | Provider o modello `agentRuntime.id: "codex"`                     | Configurazione modello/provider OpenClaw |
| Usare traffico API OpenAI diretto      | Provider o modello `agentRuntime.id: "pi"` con normale autenticazione OpenAI | Configurazione modello/provider OpenClaw |
| Regolare il comportamento app-server   | `plugins.entries.codex.config.appServer.*`                         | Configurazione plugin Codex    |
| Abilitare app native del plugin Codex  | `plugins.entries.codex.config.codexPlugins.*`                      | Configurazione plugin Codex    |
| Abilitare Codex Computer Use           | `plugins.entries.codex.config.computerUse.*`                       | Configurazione plugin Codex    |

Usa riferimenti di modello `openai/gpt-*` per i turni agent OpenAI supportati da Codex.
`openai-codex` è solo il nome del provider del profilo di autenticazione per Codex OAuth e
per i profili Codex con chiave API. Non scrivere nuovi riferimenti di modello `openai-codex/gpt-*`.

Il resto di questa pagina copre varianti comuni tra cui gli utenti devono scegliere:
forma di distribuzione, routing fail-closed, criterio di approvazione guardian, plugin Codex
nativi e Computer Use. Per elenchi completi di opzioni, valori predefiniti, enum, discovery,
isolamento dell'ambiente, timeout e campi di trasporto app-server, vedi
[Riferimento dell'harness Codex](/it/plugins/codex-harness-reference).

## Verificare il runtime Codex

Usa `/status` nella chat in cui ti aspetti Codex. Un turno agent OpenAI supportato da Codex
mostra:

```text
Runtime: OpenAI Codex
```

Poi controlla lo stato di Codex app-server:

```text
/codex status
/codex models
```

`/codex status` segnala connettività app-server, account, limiti di frequenza, server MCP
e Skills. `/codex models` elenca il catalogo live di Codex app-server per
l'harness e l'account. Se `/status` è sorprendente, vedi
[Risoluzione dei problemi](#troubleshooting).

## Routing e selezione del modello

Mantieni separati i riferimenti provider e il criterio runtime:

- Usa `openai/gpt-*` per i turni agent OpenAI tramite Codex.
- Non usare `openai-codex/gpt-*` nella configurazione. Esegui `openclaw doctor --fix` per
  riparare riferimenti legacy e pin di routing di sessione obsoleti.
- `agentRuntime.id: "codex"` è opzionale per la normale modalità automatica OpenAI, ma utile
  quando una distribuzione deve fallire in modo chiuso se Codex non è disponibile.
- `agentRuntime.id: "pi"` configura un provider o un modello per il comportamento PI diretto quando
  è intenzionale.
- `/codex ...` controlla le conversazioni native di Codex app-server dalla chat.
- ACP/acpx è un percorso harness esterno separato. Usalo solo quando l'utente chiede
  ACP/acpx o un adapter harness esterno.

Routing dei comandi comuni:

| Intento dell'utente              | Usa                                     |
| ------------------------------- | --------------------------------------- |
| Collegare la chat corrente      | `/codex bind [--cwd <path>]`            |
| Riprendere un thread Codex esistente | `/codex resume <thread-id>`             |
| Elencare o filtrare thread Codex | `/codex threads [filter]`               |
| Inviare solo feedback Codex     | `/codex diagnostics [note]`             |
| Avviare un'attività ACP/acpx    | Comandi di sessione ACP/acpx, non `/codex` |

| Caso d'uso                                           | Configura                                                        | Verifica                                | Note                               |
| ---------------------------------------------------- | ---------------------------------------------------------------- | --------------------------------------- | ---------------------------------- |
| Abbonamento ChatGPT/Codex con runtime Codex nativo   | `openai/gpt-*` più plugin `codex` abilitato                      | `/status` mostra `Runtime: OpenAI Codex` | Percorso consigliato               |
| Fallire in modo chiuso se Codex non è disponibile    | Provider o modello `agentRuntime.id: "codex"`                    | Il turno fallisce invece del fallback PI | Usa per distribuzioni solo Codex    |
| Traffico diretto con chiave API OpenAI tramite PI    | Provider o modello `agentRuntime.id: "pi"` e normale autenticazione OpenAI | `/status` mostra runtime PI             | Usa solo quando PI è intenzionale  |
| Configurazione legacy                                | `openai-codex/gpt-*`                                             | `openclaw doctor --fix` la riscrive     | Non scrivere nuove configurazioni in questo modo |
| Adapter Codex ACP/acpx                               | ACP `sessions_spawn({ runtime: "acp" })`                         | Stato attività/sessione ACP             | Separato dall'harness Codex nativo |

`agents.defaults.imageModel` segue la stessa divisione dei prefissi. Usa `openai/gpt-*`
per il normale percorso OpenAI e `codex/gpt-*` solo quando la comprensione delle immagini
deve essere eseguita tramite un turno Codex app-server delimitato. Non usare
`openai-codex/gpt-*`; doctor riscrive quel prefisso legacy in `openai/gpt-*`.

## Pattern di distribuzione

### Distribuzione Codex di base

Usa la configurazione di avvio rapido quando tutti i turni agent OpenAI devono usare Codex per
impostazione predefinita.

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
    },
  },
}
```

### Distribuzione provider mista

Questa forma mantiene Claude come agent predefinito e aggiunge un agent Codex nominato:

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
      model: "anthropic/claude-opus-4-6",
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
      },
    ],
  },
}
```

Con questa configurazione, l'agent `main` usa il suo normale percorso provider e l'agent
`codex` usa Codex app-server.

### Distribuzione Codex fail-closed

Per i turni agent OpenAI, `openai/gpt-*` si risolve già in Codex quando il
plugin incluso è disponibile. Aggiungi un criterio runtime esplicito quando vuoi una regola
fail-closed scritta:

```json5
{
  models: {
    providers: {
      openai: {
        agentRuntime: {
          id: "codex",
        },
      },
    },
  },
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
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

Con Codex forzato, OpenClaw fallisce in anticipo se il plugin Codex è disabilitato,
l'app-server è troppo vecchio oppure l'app-server non riesce ad avviarsi.

## Criterio app-server

Per impostazione predefinita, il plugin avvia localmente il binario Codex gestito da OpenClaw con trasporto
stdio. Imposta `appServer.command` solo quando vuoi intenzionalmente eseguire un
eseguibile diverso. Usa il trasporto WebSocket solo quando un app-server è già
in esecuzione altrove:

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
            authToken: "${CODEX_APP_SERVER_TOKEN}",
          },
        },
      },
    },
  },
}
```

Le sessioni app-server stdio locali usano per impostazione predefinita la postura dell'operatore locale attendibile:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` e
`sandbox: "danger-full-access"`. Se i requisiti locali di Codex non consentono quella
postura YOLO implicita, OpenClaw seleziona invece i permessi guardian consentiti.

Usa la modalità guardian quando vuoi l'auto-review nativa di Codex prima delle evasioni dalla sandbox
o di permessi aggiuntivi:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            mode: "guardian",
            serviceTier: "priority",
          },
        },
      },
    },
  },
}
```

La modalità guardian si espande in approvazioni Codex app-server, di solito
`approvalPolicy: "on-request"`, `approvalsReviewer: "auto_review"` e
`sandbox: "workspace-write"` quando i requisiti locali consentono quei valori.

Per ogni campo app-server, ordine di autenticazione, isolamento dell'ambiente, discovery e
comportamento dei timeout, vedi [Riferimento dell'harness Codex](/it/plugins/codex-harness-reference).

## Comandi e diagnostica

Il plugin incluso registra `/codex` come comando slash su qualsiasi canale che
supporta i comandi di testo OpenClaw.

Forme comuni:

- `/codex status` controlla la connettività dell’app-server, i modelli, l’account, i limiti di frequenza,
  i server MCP e le skills.
- `/codex models` elenca i modelli live dell’app-server Codex.
- `/codex threads [filter]` elenca i thread recenti dell’app-server Codex.
- `/codex resume <thread-id>` collega la sessione OpenClaw corrente a un
  thread Codex esistente.
- `/codex compact` chiede all’app-server Codex di compattare il thread collegato.
- `/codex review` avvia la revisione nativa di Codex per il thread collegato.
- `/codex diagnostics [note]` chiede conferma prima di inviare il feedback Codex per il
  thread collegato.
- `/codex account` mostra lo stato dell’account e dei limiti di frequenza.
- `/codex mcp` elenca lo stato dei server MCP dell’app-server Codex.
- `/codex skills` elenca le skills dell’app-server Codex.

Per la maggior parte delle segnalazioni di supporto, inizia con `/diagnostics [note]` nella conversazione
in cui si è verificato il bug. Crea un report diagnostico Gateway e, per le sessioni
dell’harness Codex, chiede l’approvazione per inviare il bundle di feedback Codex pertinente.
Vedi [Esportazione diagnostica](/it/gateway/diagnostics) per il modello di privacy e il comportamento nelle
chat di gruppo.

Usa `/codex diagnostics [note]` solo quando vuoi specificamente caricare il feedback
Codex per il thread attualmente collegato senza il bundle diagnostico Gateway
completo.

### Ispezionare i thread Codex localmente

Il modo più rapido per ispezionare un’esecuzione Codex non riuscita è spesso aprire direttamente
il thread Codex nativo:

```bash
codex resume <thread-id>
```

Ottieni l’id del thread dalla risposta completata di `/diagnostics`, da `/codex binding` oppure da
`/codex threads [filter]`.

Per i meccanismi di caricamento e i confini diagnostici a livello runtime, vedi
[Runtime dell’harness Codex](/it/plugins/codex-harness-runtime#codex-feedback-upload).

L’autenticazione viene selezionata in questo ordine:

1. Un profilo di autenticazione OpenClaw Codex esplicito per l’agente.
2. L’account esistente dell’app-server nella home Codex di quell’agente.
3. Solo per gli avvii locali dell’app-server stdio, `CODEX_API_KEY`, poi
   `OPENAI_API_KEY`, quando non è presente alcun account app-server e l’autenticazione OpenAI è
   ancora richiesta.

Quando OpenClaw rileva un profilo di autenticazione Codex in stile abbonamento ChatGPT, rimuove
`CODEX_API_KEY` e `OPENAI_API_KEY` dal processo figlio Codex generato. Questo
mantiene disponibili le chiavi API a livello Gateway per embedding o modelli OpenAI diretti
senza far fatturare per errore i turni nativi dell’app-server Codex tramite l’API.
I profili Codex espliciti con chiave API e il fallback locale stdio con chiave env usano il login
dell’app-server invece dell’env ereditato del processo figlio. Le connessioni WebSocket all’app-server
non ricevono il fallback della chiave API env del Gateway; usa un profilo di autenticazione esplicito o
l’account proprio dell’app-server remoto.

Se una distribuzione richiede isolamento aggiuntivo dell’ambiente, aggiungi quelle variabili a
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

`appServer.clearEnv` influisce solo sul processo figlio dell’app-server Codex generato.

Gli strumenti dinamici Codex usano per impostazione predefinita il caricamento `searchable`. OpenClaw non espone
strumenti dinamici che duplicano operazioni workspace native di Codex: `read`, `write`,
`edit`, `apply_patch`, `exec`, `process` e `update_plan`. Gli strumenti di integrazione OpenClaw
rimanenti, come messaggistica, sessioni, media, cron, browser, nodi,
gateway, `heartbeat_respond` e `web_search`, sono disponibili tramite la ricerca strumenti Codex
nel namespace `openclaw`, mantenendo più piccolo il contesto iniziale del modello.
`sessions_yield` e le risposte sorgente solo per strumenti di messaggistica rimangono dirette perché quelli
sono contratti di controllo del turno. Le istruzioni di collaborazione Heartbeat dicono a Codex di
cercare `heartbeat_respond` prima di terminare un turno heartbeat quando lo strumento non è
già caricato.

Imposta `codexDynamicToolsLoading: "direct"` solo quando ti connetti a un’app-server Codex
personalizzato che non può cercare strumenti dinamici differiti o quando esegui il debug del payload
completo degli strumenti.

Campi di primo livello supportati per il plugin Codex:

| Campo                      | Predefinito        | Significato                                                                                  |
| -------------------------- | -------------- | ---------------------------------------------------------------------------------------- |
| `codexDynamicToolsLoading` | `"searchable"` | Usa `"direct"` per inserire gli strumenti dinamici OpenClaw direttamente nel contesto iniziale degli strumenti Codex. |
| `codexDynamicToolsExclude` | `[]`           | Nomi aggiuntivi di strumenti dinamici OpenClaw da omettere dai turni dell’app-server Codex.              |
| `codexPlugins`             | disabilitato       | Supporto nativo Codex per plugin/app per plugin curati migrati installati da sorgente.           |

Campi `appServer` supportati:

| Campo                         | Predefinito                                                | Significato                                                                                                                                                                                                                              |
| ----------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `transport`                   | `"stdio"`                                              | `"stdio"` genera Codex; `"websocket"` si connette a `url`.                                                                                                                                                                             |
| `command`                     | binario Codex gestito                                   | Eseguibile per il trasporto stdio. Lascialo non impostato per usare il binario gestito; impostalo solo per una sostituzione esplicita.                                                                                                                         |
| `args`                        | `["app-server", "--listen", "stdio://"]`               | Argomenti per il trasporto stdio.                                                                                                                                                                                                       |
| `url`                         | non impostato                                                  | URL WebSocket dell’app-server.                                                                                                                                                                                                            |
| `authToken`                   | non impostato                                                  | Token Bearer per il trasporto WebSocket.                                                                                                                                                                                                |
| `headers`                     | `{}`                                                   | Header WebSocket aggiuntivi.                                                                                                                                                                                                             |
| `clearEnv`                    | `[]`                                                   | Nomi aggiuntivi di variabili d’ambiente rimossi dal processo app-server stdio generato dopo che OpenClaw ha costruito il proprio ambiente ereditato. `CODEX_HOME` e `HOME` sono riservati all’isolamento Codex per agente di OpenClaw negli avvii locali. |
| `requestTimeoutMs`            | `60000`                                                | Timeout per le chiamate del piano di controllo dell’app-server.                                                                                                                                                                                          |
| `turnCompletionIdleTimeoutMs` | `60000`                                                | Finestra di quiete dopo una richiesta app-server Codex con ambito di turno mentre OpenClaw attende `turn/completed`. Aumentala per fasi lente di sintesi post-strumento o solo di stato.                                                                  |
| `mode`                        | `"yolo"` a meno che i requisiti locali di Codex non vietino YOLO | Preset per esecuzione YOLO o revisionata da guardian. I requisiti locali stdio che omettono `danger-full-access`, approvazione `never` o il revisore `user` rendono guardian il valore predefinito implicito.                                                |
| `approvalPolicy`              | `"never"` o una policy di approvazione guardian consentita       | Policy di approvazione nativa Codex inviata ad avvio/ripresa/turno del thread. I valori predefiniti guardian preferiscono `"on-request"` quando consentito.                                                                                                                 |
| `sandbox`                     | `"danger-full-access"` o una sandbox guardian consentita  | Modalità sandbox nativa Codex inviata ad avvio/ripresa del thread. I valori predefiniti guardian preferiscono `"workspace-write"` quando consentito, altrimenti `"read-only"`.                                                                                           |
| `approvalsReviewer`           | `"user"` o un revisore guardian consentito               | Usa `"auto_review"` per lasciare che Codex riveda i prompt di approvazione nativi quando consentito, altrimenti `guardian_subagent` o `user`. `guardian_subagent` rimane un alias legacy.                                                                   |
| `serviceTier`                 | non impostato                                                  | Tier di servizio opzionale dell’app-server Codex. `"priority"` abilita il routing fast-mode, `"flex"` richiede l’elaborazione flex, `null` cancella la sostituzione e il valore legacy `"fast"` è accettato come `"priority"`.                                      |

Le chiamate agli strumenti dinamici di proprietà OpenClaw sono limitate indipendentemente da
`appServer.requestTimeoutMs`: le richieste Codex `item/tool/call` usano per impostazione predefinita un watchdog
OpenClaw di 30 secondi. Un argomento positivo `timeoutMs` per chiamata estende
o riduce il budget di quello specifico strumento. Anche lo strumento `image_generate` usa
`agents.defaults.imageGenerationModel.timeoutMs` quando la chiamata allo strumento non
fornisce un proprio timeout, e lo strumento `image` per la comprensione dei media usa
`tools.media.image.timeoutSeconds` o il suo valore predefinito media di 60 secondi. I budget degli strumenti
dinamici sono limitati a 600000 ms. Al timeout, OpenClaw interrompe il segnale dello strumento
dove supportato e restituisce a Codex una risposta di strumento dinamico non riuscita, così il turno
può continuare invece di lasciare la sessione in `processing`.

Dopo che OpenClaw risponde a una richiesta app-server Codex con ambito di turno, l’harness
si aspetta anche che Codex termini il turno nativo con `turn/completed`. Se l’app-server
rimane silenzioso per `appServer.turnCompletionIdleTimeoutMs` dopo quella
risposta, OpenClaw interrompe al meglio il turno Codex, registra un timeout
diagnostico e libera la corsia della sessione OpenClaw così i messaggi di chat successivi
non restano in coda dietro un turno nativo obsoleto. Qualsiasi notifica non terminale per lo
stesso turno, inclusa `rawResponseItem/completed`, disattiva quel breve watchdog
perché Codex ha dimostrato che il turno è ancora attivo; il watchdog terminale più lungo
continua a proteggere i turni realmente bloccati. La diagnostica del timeout include il
metodo dell’ultima notifica dell’app-server e, per gli elementi di risposta assistant grezzi, il
tipo di elemento, il ruolo, l’id e un’anteprima limitata del testo assistant.

Le sostituzioni d’ambiente restano disponibili per i test locali:

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
preferibile per distribuzioni ripetibili perché mantiene il comportamento del Plugin nello
stesso file sottoposto a revisione del resto della configurazione dell'harness Codex.

## Plugin Codex nativi

Il supporto per i Plugin Codex nativi usa le capacità di app e Plugin proprie dell'app-server
Codex nello stesso thread Codex del turno dell'harness OpenClaw. OpenClaw
non traduce i Plugin Codex in strumenti dinamici OpenClaw sintetici
`codex_plugin_*`.

`codexPlugins` influisce solo sulle sessioni che selezionano l'harness Codex nativo. Non
ha effetto sulle esecuzioni PI, sulle normali esecuzioni del provider OpenAI, sui binding di conversazione
ACP o su altri harness.

Configurazione migrata minima:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          codexPlugins: {
            enabled: true,
            allow_destructive_actions: false,
            plugins: {
              "google-calendar": {
                enabled: true,
                marketplaceName: "openai-curated",
                pluginName: "google-calendar",
              },
            },
          },
        },
      },
    },
  },
}
```

La configurazione dell'app del thread viene calcolata quando OpenClaw stabilisce una sessione dell'harness Codex
o sostituisce un binding obsoleto del thread Codex. Non viene ricalcolata a ogni turno.
Dopo aver modificato `codexPlugins`, usa `/new`, `/reset` oppure riavvia il Gateway in modo che
le sessioni future dell'harness Codex partano con il set di app aggiornato.

Per l'idoneità alla migrazione, l'inventario delle app, la policy sulle azioni distruttive,
le elicitazioni e la diagnostica dei Plugin nativi, consulta
[Plugin Codex nativi](/it/plugins/codex-native-plugins).

## Computer Use

Computer Use è trattato nella propria guida di configurazione:
[Codex Computer Use](/it/plugins/codex-computer-use).

In breve: OpenClaw non incorpora l'app di controllo desktop né esegue
azioni desktop direttamente. Prepara l'app-server Codex, verifica che il server MCP
`computer-use` sia disponibile e quindi lascia che Codex gestisca le chiamate agli strumenti MCP
nativi durante i turni in modalità Codex.

## Confini di runtime

L'harness Codex modifica solo l'esecutore dell'agente incorporato di basso livello.

- Gli strumenti dinamici OpenClaw sono supportati. Codex chiede a OpenClaw di eseguire tali
  strumenti, quindi OpenClaw rimane nel percorso di esecuzione.
- Shell, patch, MCP e strumenti app nativi di Codex sono gestiti da Codex.
  OpenClaw può osservare o bloccare eventi nativi selezionati tramite il relay supportato,
  ma non riscrive gli argomenti degli strumenti nativi.
- Codex gestisce la Compaction nativa. OpenClaw mantiene uno specchio della trascrizione per la cronologia
  del canale, la ricerca, `/new`, `/reset` e futuri cambi di modello o harness.
- Generazione media, comprensione media, TTS, approvazioni e output degli strumenti di messaggistica
  continuano tramite le impostazioni OpenClaw di provider/modello corrispondenti.
- `tool_result_persist` si applica ai risultati degli strumenti della trascrizione gestiti da OpenClaw, non
  ai record dei risultati degli strumenti nativi Codex.

Per i livelli di hook, le superfici V1 supportate, la gestione dei permessi nativi, l'instradamento della coda,
i meccanismi di caricamento del feedback Codex e i dettagli della Compaction, consulta
[Runtime dell'harness Codex](/it/plugins/codex-harness-runtime).

## Risoluzione dei problemi

**Codex non compare come un normale provider `/model`:** questo è previsto per
le nuove configurazioni. Seleziona un modello `openai/gpt-*`, abilita
`plugins.entries.codex.enabled` e verifica se `plugins.allow` esclude
`codex`.

**OpenClaw usa PI invece di Codex:** assicurati che il riferimento del modello sia
`openai/gpt-*` sul provider OpenAI ufficiale e che il Plugin Codex sia
installato e abilitato. Se ti serve una prova rigorosa durante i test, imposta
`agentRuntime.id: "codex"` sul provider o sul modello. Un runtime Codex forzato fallisce invece di
ripiegare su PI.

**Rimane una configurazione legacy `openai-codex/*`:** esegui `openclaw doctor --fix`.
Doctor riscrive i riferimenti di modello legacy in `openai/*`, rimuove i pin di runtime obsoleti di sessione e
di intero agente e preserva gli override esistenti dei profili di autenticazione.

**L'app-server viene rifiutato:** usa l'app-server Codex `0.125.0` o più recente.
Prerelease della stessa versione o versioni con suffisso di build come
`0.125.0-alpha.2` o `0.125.0+custom` vengono rifiutate perché OpenClaw verifica il
floor stabile del protocollo `0.125.0`.

**`/codex status` non riesce a connettersi:** verifica che il Plugin `codex` incluso sia
abilitato, che `plugins.allow` lo includa quando è configurato un elenco consentiti e
che eventuali `appServer.command`, `url`, `authToken` o header personalizzati siano validi.

**La scoperta dei modelli è lenta:** riduci
`plugins.entries.codex.config.discovery.timeoutMs` o disabilita la scoperta. Consulta
[Riferimento dell'harness Codex](/it/plugins/codex-harness-reference#model-discovery).

**Il trasporto WebSocket fallisce immediatamente:** verifica `appServer.url`, `authToken`,
gli header e che l'app-server remoto parli la stessa versione del protocollo app-server
Codex.

**Un modello non Codex usa PI:** questo è previsto a meno che una policy di runtime del provider o del modello
lo instradi verso un altro harness. I normali riferimenti di provider non OpenAI restano sul
loro percorso provider normale in modalità `auto`.

**Computer Use è installato ma gli strumenti non vengono eseguiti:** verifica
`/codex computer-use status` da una sessione nuova. Se uno strumento riporta
`Native hook relay unavailable`, usa `/new` o `/reset`; se persiste, riavvia
il Gateway per eliminare registrazioni obsolete degli hook nativi. Consulta
[Codex Computer Use](/it/plugins/codex-computer-use#troubleshooting).

## Correlati

- [Riferimento dell'harness Codex](/it/plugins/codex-harness-reference)
- [Runtime dell'harness Codex](/it/plugins/codex-harness-runtime)
- [Plugin Codex nativi](/it/plugins/codex-native-plugins)
- [Codex Computer Use](/it/plugins/codex-computer-use)
- [Runtime degli agenti](/it/concepts/agent-runtimes)
- [Provider di modelli](/it/concepts/model-providers)
- [Provider OpenAI](/it/providers/openai)
- [Plugin di harness agente](/it/plugins/sdk-agent-harness)
- [Hook Plugin](/it/plugins/hooks)
- [Esportazione diagnostica](/it/gateway/diagnostics)
- [Stato](/it/cli/status)
- [Test](/it/help/testing-live#live-codex-app-server-harness-smoke)
