---
read_when:
    - Vuoi usare l'harness app-server Codex incluso
    - Ti servono esempi di configurazione dell'harness Codex
    - Vuoi che le distribuzioni solo Codex falliscano invece di ripiegare su PI
summary: Esegui i turni dell'agente incorporato di OpenClaw tramite l'ambiente app-server di Codex incluso
title: Ambiente di esecuzione Codex
x-i18n:
    generated_at: "2026-05-11T20:32:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: 37546661dc80d8ce680c379ca2a49919b08ac24a748dc15d1478c1421e81c632
    source_path: plugins/codex-harness.md
    workflow: 16
---

Il plugin `codex` incluso consente a OpenClaw di eseguire turni agente OpenAI incorporati
tramite Codex app-server invece dell'harness PI integrato.

Usa l'harness Codex quando vuoi che Codex gestisca la sessione agente di basso livello:
ripresa nativa dei thread, continuazione nativa degli strumenti, compaction nativa ed
esecuzione app-server. OpenClaw continua a gestire canali chat, file di sessione, selezione
del modello, strumenti dinamici OpenClaw, approvazioni, recapito dei media e il mirror
visibile della trascrizione.

La configurazione normale usa riferimenti modello OpenAI canonici come `openai/gpt-5.5`.
Non configurare riferimenti modello `openai-codex/gpt-*`. Inserisci l'ordine di auth
dell'agente OpenAI sotto `auth.order.openai`; i profili `openai-codex:*` meno recenti e
le voci `auth.order.openai-codex` restano supportati per le installazioni esistenti.

OpenClaw avvia i thread Codex app-server con la modalità codice nativa di Codex e
solo modalità codice abilitata. Questo mantiene gli strumenti dinamici OpenClaw differiti/ricercabili
all'interno dell'esecuzione codice e della superficie di ricerca strumenti di Codex stessa,
invece di aggiungere sopra Codex un wrapper di ricerca strumenti in stile PI.

Per la suddivisione più ampia tra modello/provider/runtime, inizia da
[Runtime agente](/it/concepts/agent-runtimes). La versione breve è:
`openai/gpt-5.5` è il riferimento modello, `codex` è il runtime, e Telegram,
Discord, Slack o un altro canale resta la superficie di comunicazione.

## Requisiti

- OpenClaw con il plugin `codex` incluso disponibile.
- Se la tua configurazione usa `plugins.allow`, includi `codex`.
- Codex app-server `0.125.0` o più recente. Il plugin incluso gestisce per impostazione predefinita
  un binario Codex app-server compatibile, quindi i comandi locali `codex` in `PATH` non
  influiscono sul normale avvio dell'harness.
- Auth Codex disponibile tramite `openclaw models auth login --provider openai-codex`,
  un account app-server nella home Codex dell'agente o un profilo auth con chiave API Codex
  esplicito.

Per precedenza auth, isolamento dell'ambiente, comandi app-server personalizzati, discovery dei modelli
e tutti i campi di configurazione, vedi
[Riferimento harness Codex](/it/plugins/codex-harness-reference).

## Avvio rapido

La maggior parte degli utenti che vuole Codex in OpenClaw vuole questo percorso: accedi con un
abbonamento ChatGPT/Codex, abilita il plugin `codex` incluso e usa un riferimento modello
`openai/gpt-*` canonico.

Accedi con Codex OAuth:

```bash
openclaw models auth login --provider openai-codex
```

Abilita il plugin `codex` incluso e seleziona un modello agente OpenAI:

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

Riavvia il gateway dopo aver cambiato la configurazione dei plugin. Se una chat esistente ha già
una sessione, usa `/new` o `/reset` prima di testare modifiche di runtime, così il turno
successivo risolve l'harness dalla configurazione corrente.

## Configurazione

La configurazione di avvio rapido è la configurazione minima praticabile dell'harness Codex. Imposta le opzioni
dell'harness Codex nella configurazione OpenClaw e usa la CLI solo per l'auth Codex:

| Esigenza                               | Imposta                                                                          | Dove                               |
| -------------------------------------- | -------------------------------------------------------------------------------- | ---------------------------------- |
| Abilitare l'harness                    | `plugins.entries.codex.enabled: true`                                            | Configurazione OpenClaw            |
| Mantenere un'installazione plugin in allowlist | Includi `codex` in `plugins.allow`                                               | Configurazione OpenClaw            |
| Instradare i turni agente OpenAI tramite Codex | `agents.defaults.model` o `agents.list[].model` come `openai/gpt-*`              | Configurazione agente OpenClaw     |
| Accedere con Codex OAuth               | `openclaw models auth login --provider openai-codex`                             | Profilo auth CLI                   |
| Aggiungere backup con chiave API per esecuzioni Codex | Profilo con chiave API `openai:*` elencato dopo l'auth con abbonamento in `auth.order.openai` | Profilo auth CLI + configurazione OpenClaw |
| Fallire in modo chiuso quando Codex non è disponibile | Provider o modello `agentRuntime.id: "codex"`                                    | Configurazione modello/provider OpenClaw |
| Usare traffico OpenAI API diretto      | Provider o modello `agentRuntime.id: "pi"` con auth OpenAI normale               | Configurazione modello/provider OpenClaw |
| Regolare il comportamento app-server   | `plugins.entries.codex.config.appServer.*`                                       | Configurazione plugin Codex        |
| Abilitare app plugin native Codex      | `plugins.entries.codex.config.codexPlugins.*`                                    | Configurazione plugin Codex        |
| Abilitare Codex Computer Use           | `plugins.entries.codex.config.computerUse.*`                                     | Configurazione plugin Codex        |

Usa riferimenti modello `openai/gpt-*` per turni agente OpenAI supportati da Codex. Preferisci
`auth.order.openai` per l'ordine abbonamento-prima/chiave-API-di-backup. I profili auth
`openai-codex:*` esistenti e `auth.order.openai-codex` restano validi, ma
non scrivere nuovi riferimenti modello `openai-codex/gpt-*`.

```json5
{
  auth: {
    order: {
      openai: ["openai-codex:user@example.com", "openai:api-key-backup"],
    },
  },
}
```

In questa forma, entrambi i profili vengono comunque eseguiti tramite Codex per i turni agente
`openai/gpt-*`. La chiave API è solo un fallback auth, non una richiesta di passare a PI o
alle semplici OpenAI Responses.

Il resto di questa pagina copre le varianti comuni tra cui gli utenti devono scegliere:
forma di deployment, routing fail-closed, policy di approvazione guardian, plugin Codex
nativi e Computer Use. Per liste complete delle opzioni, valori predefiniti, enum, discovery,
isolamento dell'ambiente, timeout e campi di trasporto app-server, vedi
[Riferimento harness Codex](/it/plugins/codex-harness-reference).

## Verificare il runtime Codex

Usa `/status` nella chat in cui ti aspetti Codex. Un turno agente OpenAI supportato da Codex
mostra:

```text
Runtime: OpenAI Codex
```

Poi controlla lo stato di Codex app-server:

```text
/codex status
/codex models
```

`/codex status` riporta connettività app-server, account, limiti di frequenza, server MCP
e skills. `/codex models` elenca il catalogo live di Codex app-server per
l'harness e l'account. Se `/status` è inatteso, vedi
[Risoluzione dei problemi](#troubleshooting).

## Routing e selezione del modello

Mantieni separati i riferimenti provider e la policy di runtime:

- Usa `openai/gpt-*` per turni agente OpenAI tramite Codex.
- Non usare `openai-codex/gpt-*` nella configurazione. Esegui `openclaw doctor --fix` per
  riparare riferimenti legacy e pin di route di sessione obsoleti.
- `agentRuntime.id: "codex"` è facoltativo per la normale modalità automatica OpenAI, ma utile
  quando un deployment deve fallire in modo chiuso se Codex non è disponibile.
- `agentRuntime.id: "pi"` opta un provider o modello nel comportamento PI diretto quando
  questa è l'intenzione.
- `/codex ...` controlla le conversazioni native Codex app-server dalla chat.
- ACP/acpx è un percorso harness esterno separato. Usalo solo quando l'utente chiede
  ACP/acpx o un adapter harness esterno.

Routing dei comandi comuni:

| Intento utente                  | Usa                                     |
| ------------------------------- | --------------------------------------- |
| Collegare la chat corrente      | `/codex bind [--cwd <path>]`            |
| Riprendere un thread Codex esistente | `/codex resume <thread-id>`             |
| Elencare o filtrare thread Codex | `/codex threads [filter]`               |
| Inviare solo feedback Codex     | `/codex diagnostics [note]`             |
| Avviare un task ACP/acpx        | Comandi sessione ACP/acpx, non `/codex` |

| Caso d'uso                                            | Configura                                                        | Verifica                                | Note                               |
| ---------------------------------------------------- | ---------------------------------------------------------------- | --------------------------------------- | ---------------------------------- |
| Abbonamento ChatGPT/Codex con runtime Codex nativo   | `openai/gpt-*` più plugin `codex` abilitato                      | `/status` mostra `Runtime: OpenAI Codex` | Percorso consigliato               |
| Fallire in modo chiuso se Codex non è disponibile    | Provider o modello `agentRuntime.id: "codex"`                    | Il turno fallisce invece del fallback PI | Usa per deployment solo Codex      |
| Traffico diretto con chiave API OpenAI tramite PI     | Provider o modello `agentRuntime.id: "pi"` e auth OpenAI normale | `/status` mostra runtime PI             | Usa solo quando PI è intenzionale  |
| Configurazione legacy                                | `openai-codex/gpt-*`                                             | `openclaw doctor --fix` la riscrive     | Non scrivere nuove configurazioni così |
| Adapter Codex ACP/acpx                               | ACP `sessions_spawn({ runtime: "acp" })`                         | Stato task/sessione ACP                 | Separato dall'harness Codex nativo |

`agents.defaults.imageModel` segue la stessa suddivisione per prefisso. Usa `openai/gpt-*`
per la route OpenAI normale e `codex/gpt-*` solo quando la comprensione delle immagini
deve passare attraverso un turno Codex app-server delimitato. Non usare
`openai-codex/gpt-*`; doctor riscrive quel prefisso legacy in `openai/gpt-*`.

## Pattern di deployment

### Deployment Codex di base

Usa la configurazione di avvio rapido quando tutti i turni agente OpenAI devono usare Codex per
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

### Deployment con provider misti

Questa forma mantiene Claude come agente predefinito e aggiunge un agente Codex denominato:

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

Con questa configurazione, l'agente `main` usa il suo normale percorso provider e l'agente
`codex` usa Codex app-server.

### Deployment Codex fail-closed

Per i turni agente OpenAI, `openai/gpt-*` si risolve già in Codex quando il
plugin incluso è disponibile. Aggiungi una policy di runtime esplicita quando vuoi una regola
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

Con Codex forzato, OpenClaw fallisce presto se il plugin Codex è disabilitato, se
l'app-server è troppo vecchio o se l'app-server non può avviarsi.

## Policy app-server

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

Le sessioni locali stdio app-server usano per impostazione predefinita la postura dell'operatore locale attendibile:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` e
`sandbox: "danger-full-access"`. Se i requisiti locali di Codex non consentono questa
postura YOLO implicita, OpenClaw seleziona invece le autorizzazioni guardian consentite.
Quando una sandbox OpenClaw è attiva per la sessione, OpenClaw restringe
`danger-full-access` di Codex a `workspace-write` di Codex, così i turni nativi in code-mode di Codex
restano dentro il workspace in sandbox.

Usa la modalità guardian quando vuoi l'auto-review nativa di Codex prima delle uscite dalla sandbox
o di autorizzazioni aggiuntive:

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

La modalità guardian si espande nelle approvazioni Codex app-server, di solito
`approvalPolicy: "on-request"`, `approvalsReviewer: "auto_review"` e
`sandbox: "workspace-write"` quando i requisiti locali consentono questi valori.

Per ogni campo app-server, ordine di autenticazione, isolamento dell'ambiente, discovery e
comportamento dei timeout, consulta il [riferimento dell'harness Codex](/it/plugins/codex-harness-reference).

## Comandi e diagnostica

Il Plugin incluso registra `/codex` come comando slash su qualsiasi canale che
supporti i comandi testuali di OpenClaw.

Forme comuni:

- `/codex status` verifica connettività app-server, modelli, account, limiti di frequenza,
  server MCP e skills.
- `/codex models` elenca i modelli Codex app-server live.
- `/codex threads [filter]` elenca i thread Codex app-server recenti.
- `/codex resume <thread-id>` collega la sessione OpenClaw corrente a un
  thread Codex esistente.
- `/codex compact` chiede a Codex app-server di compattare il thread collegato.
- `/codex review` avvia la review nativa di Codex per il thread collegato.
- `/codex diagnostics [note]` chiede conferma prima di inviare feedback Codex per il
  thread collegato.
- `/codex account` mostra lo stato dell'account e dei limiti di frequenza.
- `/codex mcp` elenca lo stato dei server MCP di Codex app-server.
- `/codex skills` elenca le skills di Codex app-server.

Per la maggior parte delle segnalazioni di supporto, inizia con `/diagnostics [note]` nella conversazione
in cui si è verificato il bug. Crea un report diagnostico Gateway e, per le sessioni
dell'harness Codex, chiede l'approvazione per inviare il bundle di feedback Codex pertinente.
Consulta [Esportazione diagnostica](/it/gateway/diagnostics) per il modello di privacy e il comportamento
nelle chat di gruppo.

Usa `/codex diagnostics [note]` solo quando vuoi specificamente il caricamento del feedback Codex
per il thread attualmente collegato, senza il bundle completo di diagnostica Gateway.

### Ispezionare localmente i thread Codex

Il modo più rapido per ispezionare una cattiva esecuzione di Codex è spesso aprire direttamente
il thread Codex nativo:

```bash
codex resume <thread-id>
```

Ottieni l'id del thread dalla risposta completata di `/diagnostics`, da `/codex binding` o da
`/codex threads [filter]`.

Per i meccanismi di caricamento e i confini della diagnostica a livello runtime, consulta
[Runtime dell'harness Codex](/it/plugins/codex-harness-runtime#codex-feedback-upload).

L'autenticazione viene selezionata in questo ordine:

1. Profili di autenticazione OpenAI ordinati per l'agente, preferibilmente sotto
   `auth.order.openai`. Gli id di profilo `openai-codex:*` esistenti restano validi.
2. L'account esistente dell'app-server nella home Codex di quell'agente.
3. Solo per gli avvii locali stdio app-server, `CODEX_API_KEY`, poi
   `OPENAI_API_KEY`, quando non è presente alcun account app-server e l'autenticazione OpenAI è
   ancora richiesta.

Quando OpenClaw vede un profilo di autenticazione Codex in stile abbonamento ChatGPT, rimuove
`CODEX_API_KEY` e `OPENAI_API_KEY` dal processo figlio Codex generato. Questo
mantiene le chiavi API a livello Gateway disponibili per gli embedding o per i modelli OpenAI diretti
senza fare accidentalmente fatturare tramite API i turni nativi Codex app-server.
I profili Codex espliciti con chiave API e il fallback locale stdio con chiave env usano il login app-server
invece dell'env ereditato del processo figlio. Le connessioni WebSocket app-server
non ricevono il fallback con chiave API env del Gateway; usa un profilo di autenticazione esplicito o l'account
proprio dell'app-server remoto.

Se un profilo di abbonamento raggiunge un limite d'uso Codex, OpenClaw registra l'orario di reset
quando Codex ne segnala uno e prova il profilo di autenticazione ordinato successivo per la stessa
esecuzione Codex. Quando l'orario di reset è trascorso, il profilo di abbonamento torna idoneo
senza cambiare il modello `openai/gpt-*` selezionato o il runtime Codex.

Se un deployment richiede isolamento aggiuntivo dell'ambiente, aggiungi quelle variabili a
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

`appServer.clearEnv` influisce solo sul processo figlio Codex app-server generato.

Gli strumenti dinamici Codex usano per impostazione predefinita il caricamento `searchable`. OpenClaw non espone
strumenti dinamici che duplicano le operazioni workspace native di Codex: `read`, `write`,
`edit`, `apply_patch`, `exec`, `process` e `update_plan`. Gli strumenti di integrazione OpenClaw
rimanenti, come messaggistica, sessioni, media, cron, browser, nodi,
gateway, `heartbeat_respond` e `web_search`, sono disponibili tramite la ricerca strumenti Codex
nel namespace `openclaw`, mantenendo più piccolo il contesto iniziale del modello.
`sessions_yield` e le risposte sorgente solo con strumento di messaggistica restano dirette perché questi
sono contratti di controllo del turno. Le istruzioni di collaborazione Heartbeat dicono a Codex di
cercare `heartbeat_respond` prima di terminare un turno heartbeat quando lo strumento non è
già caricato.

Imposta `codexDynamicToolsLoading: "direct"` solo quando ti connetti a un Codex
app-server personalizzato che non può cercare strumenti dinamici differiti o durante il debug del payload
completo degli strumenti.

Campi di primo livello supportati del Plugin Codex:

| Campo                      | Predefinito    | Significato                                                                              |
| -------------------------- | -------------- | ---------------------------------------------------------------------------------------- |
| `codexDynamicToolsLoading` | `"searchable"` | Usa `"direct"` per inserire gli strumenti dinamici OpenClaw direttamente nel contesto strumenti iniziale di Codex. |
| `codexDynamicToolsExclude` | `[]`           | Nomi aggiuntivi di strumenti dinamici OpenClaw da omettere dai turni Codex app-server.              |
| `codexPlugins`             | disabilitato   | Supporto nativo Codex per plugin/app per Plugin curati migrati e installati da sorgente.           |

Campi `appServer` supportati:

| Campo                         | Predefinito                                           | Significato                                                                                                                                                                                                                             |
| ----------------------------- | ----------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                   | `"stdio"`                                             | `"stdio"` genera Codex; `"websocket"` si connette a `url`.                                                                                                                                                                                |
| `command`                     | binario Codex gestito                                 | Eseguibile per il trasporto stdio. Lascialo non impostato per usare il binario gestito; impostalo solo per un override esplicito.                                                                                                       |
| `args`                        | `["app-server", "--listen", "stdio://"]`              | Argomenti per il trasporto stdio.                                                                                                                                                                                                          |
| `url`                         | non impostato                                         | URL WebSocket app-server.                                                                                                                                                                                                               |
| `authToken`                   | non impostato                                         | Token bearer per il trasporto WebSocket.                                                                                                                                                                                                   |
| `headers`                     | `{}`                                                  | Header WebSocket aggiuntivi.                                                                                                                                                                                                                |
| `clearEnv`                    | `[]`                                                  | Nomi aggiuntivi di variabili d'ambiente rimossi dal processo stdio app-server generato dopo che OpenClaw costruisce il proprio ambiente ereditato. `CODEX_HOME` e `HOME` sono riservati all'isolamento Codex per agente di OpenClaw negli avvii locali.    |
| `requestTimeoutMs`            | `60000`                                               | Timeout per le chiamate del piano di controllo app-server.                                                                                                                                                                                             |
| `turnCompletionIdleTimeoutMs` | `60000`                                               | Finestra di quiete dopo una richiesta Codex app-server con ambito di turno mentre OpenClaw attende `turn/completed`. Aumentala per fasi lente post-strumento o di sintesi solo dello stato.                                                                     |
| `mode`                        | `"yolo"` a meno che i requisiti locali di Codex non vietino YOLO | Preset per esecuzione YOLO o revisionata da guardian. I requisiti locali stdio che omettono `danger-full-access`, l'approvazione `never` o il revisore `user` rendono guardian il valore predefinito implicito.                                                   |
| `approvalPolicy`              | `"never"` o una policy di approvazione guardian consentita       | Policy di approvazione nativa Codex inviata all'avvio/ripresa/turno del thread. I valori predefiniti guardian preferiscono `"on-request"` quando consentito.                                                                                                                    |
| `sandbox`                     | `"danger-full-access"` o una sandbox guardian consentita  | Modalità sandbox nativa Codex inviata all'avvio/ripresa del thread. I valori predefiniti guardian preferiscono `"workspace-write"` quando consentito, altrimenti `"read-only"`. Quando una sandbox OpenClaw è attiva, `danger-full-access` viene ristretto a `"workspace-write"`. |
| `approvalsReviewer`           | `"user"` o un revisore guardian consentito               | Usa `"auto_review"` per consentire a Codex di esaminare i prompt di approvazione nativi quando consentito, altrimenti `guardian_subagent` o `user`. `guardian_subagent` resta un alias legacy.                                                                      |
| `serviceTier`                 | non impostato                                         | Tier di servizio opzionale di Codex app-server. `"priority"` abilita il routing in modalità veloce, `"flex"` richiede l'elaborazione flex, `null` cancella l'override e il legacy `"fast"` è accettato come `"priority"`.                                         |

Le chiamate a strumenti dinamici possedute da OpenClaw sono limitate indipendentemente da
`appServer.requestTimeoutMs`: le richieste Codex `item/tool/call` usano per impostazione predefinita un watchdog
OpenClaw di 30 secondi. Un argomento `timeoutMs` positivo per chiamata estende
o accorcia il budget di quello specifico strumento. Anche lo strumento `image_generate` usa
`agents.defaults.imageGenerationModel.timeoutMs` quando la chiamata allo strumento non
fornisce un proprio timeout, mentre lo strumento `image` per la comprensione dei media usa
`tools.media.image.timeoutSeconds` o il suo valore predefinito per i media di 60 secondi. I budget degli strumenti dinamici
sono limitati a 600000 ms. Al timeout, OpenClaw interrompe il segnale dello strumento
dove supportato e restituisce a Codex una risposta di strumento dinamico non riuscita, così il turno
può continuare invece di lasciare la sessione in `processing`.

Dopo che OpenClaw risponde a una richiesta app-server con ambito di turno di Codex, l'harness
si aspetta anche che Codex completi il turno nativo con `turn/completed`. Se l'
app-server resta silenzioso per `appServer.turnCompletionIdleTimeoutMs` dopo quella
risposta, OpenClaw interrompe il turno Codex al meglio delle possibilità, registra un timeout
diagnostico e libera la corsia di sessione OpenClaw in modo che i messaggi di chat successivi
non vengano accodati dietro un turno nativo obsoleto. Qualsiasi notifica non terminale per lo
stesso turno, inclusa `rawResponseItem/completed`, disarma quel breve watchdog
perché Codex ha dimostrato che il turno è ancora vivo; il watchdog terminale più lungo
continua a proteggere i turni realmente bloccati. Le diagnostiche di timeout includono il
metodo dell'ultima notifica app-server e, per gli elementi di risposta grezzi dell'assistente, il
tipo di elemento, il ruolo, l'id e un'anteprima limitata del testo dell'assistente.

Gli override di ambiente restano disponibili per i test locali:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN` ignora il binario gestito quando
`appServer.command` non è impostato.

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` è stato rimosso. Usa invece
`plugins.entries.codex.config.appServer.mode: "guardian"`, oppure
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` per test locali una tantum. La configurazione è
preferibile per deployment ripetibili perché mantiene il comportamento del plugin nello
stesso file revisionato del resto della configurazione dell'harness Codex.

## Plugin Codex nativi

Il supporto ai plugin Codex nativi usa le capacità app e plugin proprie dell'app-server Codex
nello stesso thread Codex del turno dell'harness OpenClaw. OpenClaw
non traduce i plugin Codex in strumenti dinamici OpenClaw sintetici `codex_plugin_*`.

`codexPlugins` influisce solo sulle sessioni che selezionano l'harness Codex nativo. Non
ha effetto sulle esecuzioni PI, sulle normali esecuzioni del provider OpenAI, sui binding di conversazione
ACP o su altri harness.

Configurazione minima migrata:

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

La configurazione app del thread viene calcolata quando OpenClaw stabilisce una sessione dell'harness Codex
o sostituisce un binding di thread Codex obsoleto. Non viene ricalcolata a ogni turno.
Dopo aver modificato `codexPlugins`, usa `/new`, `/reset` oppure riavvia il gateway in modo che
le future sessioni dell'harness Codex inizino con il set di app aggiornato.

Per idoneità alla migrazione, inventario delle app, policy sulle azioni distruttive,
elicitations e diagnostiche dei plugin nativi, consulta
[Plugin Codex nativi](/it/plugins/codex-native-plugins).

## Computer Use

Computer Use è trattato nella sua guida di configurazione:
[Codex Computer Use](/it/plugins/codex-computer-use).

In breve: OpenClaw non include come vendor l'app di controllo desktop né esegue
azioni desktop direttamente. Prepara l'app-server Codex, verifica che il server MCP
`computer-use` sia disponibile e poi lascia a Codex il controllo delle chiamate agli strumenti MCP
nativi durante i turni in modalità Codex.

## Confini di runtime

L'harness Codex modifica solo l'esecutore agente incorporato di basso livello.

- Gli strumenti dinamici OpenClaw sono supportati. Codex chiede a OpenClaw di eseguire quegli
  strumenti, quindi OpenClaw resta nel percorso di esecuzione.
- Gli strumenti nativi shell, patch, MCP e app di Codex sono posseduti da Codex.
  OpenClaw può osservare o bloccare eventi nativi selezionati tramite il relay supportato,
  ma non riscrive gli argomenti degli strumenti nativi.
- Codex possiede la compaction nativa. OpenClaw mantiene un mirror della trascrizione per la cronologia
  dei canali, la ricerca, `/new`, `/reset` e futuri cambi di modello o harness.
- Generazione di media, comprensione dei media, TTS, approvazioni e output degli strumenti
  di messaggistica continuano attraverso le impostazioni provider/modello OpenClaw corrispondenti.
- `tool_result_persist` si applica ai risultati degli strumenti della trascrizione posseduti da OpenClaw, non
  ai record dei risultati degli strumenti nativi di Codex.

Per livelli di hook, superfici V1 supportate, gestione dei permessi nativi, instradamento della coda,
meccaniche di caricamento del feedback Codex e dettagli di compaction, consulta
[Runtime dell'harness Codex](/it/plugins/codex-harness-runtime).

## Risoluzione dei problemi

**Codex non appare come un normale provider `/model`:** è previsto per
le nuove configurazioni. Seleziona un modello `openai/gpt-*`, abilita
`plugins.entries.codex.enabled` e verifica se `plugins.allow` esclude
`codex`.

**OpenClaw usa PI invece di Codex:** assicurati che il riferimento del modello sia
`openai/gpt-*` sul provider OpenAI ufficiale e che il plugin Codex sia
installato e abilitato. Se ti serve una prova rigorosa durante i test, imposta `agentRuntime.id: "codex"` sul provider o
sul modello. Un runtime Codex forzato fallisce invece di
ripiegare su PI.

**Rimane una configurazione legacy `openai-codex/*`:** esegui `openclaw doctor --fix`.
Doctor riscrive i riferimenti dei modelli legacy in `openai/*`, rimuove pin di runtime obsoleti di sessione e
dell'intero agente e preserva gli override degli auth-profile esistenti.

**L'app-server viene rifiutato:** usa Codex app-server `0.125.0` o più recente.
Prerelease della stessa versione o versioni con suffisso di build come
`0.125.0-alpha.2` o `0.125.0+custom` vengono rifiutate perché OpenClaw testa il
floor stabile del protocollo `0.125.0`.

**`/codex status` non riesce a connettersi:** verifica che il plugin `codex` incluso sia
abilitato, che `plugins.allow` lo includa quando è configurata una allowlist e
che eventuali `appServer.command`, `url`, `authToken` o header personalizzati siano validi.

**La scoperta dei modelli è lenta:** abbassa
`plugins.entries.codex.config.discovery.timeoutMs` o disabilita la scoperta. Consulta
[Riferimento dell'harness Codex](/it/plugins/codex-harness-reference#model-discovery).

**Il trasporto WebSocket fallisce immediatamente:** verifica `appServer.url`, `authToken`,
gli header e che l'app-server remoto parli la stessa versione del protocollo
app-server Codex.

**Un modello non Codex usa PI:** è previsto, a meno che la policy di runtime del provider o del modello
lo instradi a un altro harness. I riferimenti provider non OpenAI semplici restano sul
loro normale percorso provider in modalità `auto`.

**Computer Use è installato ma gli strumenti non vengono eseguiti:** controlla
`/codex computer-use status` da una sessione fresca. Se uno strumento riporta
`Native hook relay unavailable`, usa `/new` o `/reset`; se persiste, riavvia
il gateway per eliminare registrazioni di hook nativi obsolete. Consulta
[Codex Computer Use](/it/plugins/codex-computer-use#troubleshooting).

## Correlati

- [Riferimento dell'harness Codex](/it/plugins/codex-harness-reference)
- [Runtime dell'harness Codex](/it/plugins/codex-harness-runtime)
- [Plugin Codex nativi](/it/plugins/codex-native-plugins)
- [Codex Computer Use](/it/plugins/codex-computer-use)
- [Runtime agenti](/it/concepts/agent-runtimes)
- [Provider di modelli](/it/concepts/model-providers)
- [Provider OpenAI](/it/providers/openai)
- [Plugin di harness agente](/it/plugins/sdk-agent-harness)
- [Hook dei plugin](/it/plugins/hooks)
- [Esportazione diagnostiche](/it/gateway/diagnostics)
- [Stato](/it/cli/status)
- [Test](/it/help/testing-live#live-codex-app-server-harness-smoke)
