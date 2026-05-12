---
read_when:
    - Vuoi usare l'harness app-server Codex fornito in bundle
    - Ti servono esempi di configurazione dell'harness Codex
    - Vuoi che le distribuzioni solo Codex falliscano invece di ripiegare su PI
summary: Esegui i turni dell'agente incorporato di OpenClaw tramite l'ambiente di esecuzione app-server Codex incluso
title: Ambiente di esecuzione di Codex
x-i18n:
    generated_at: "2026-05-12T00:59:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 273572d7b7f3b6c57ddd0de38ce467463e9f1f0eab66dc7e2c38fa7679cb0359
    source_path: plugins/codex-harness.md
    workflow: 16
---

Il Plugin `codex` incluso consente a OpenClaw di eseguire turn agente OpenAI incorporati
tramite Codex app-server invece dell'harness PI integrato.

Usa l'harness Codex quando vuoi che Codex possieda la sessione agente di basso
livello: ripresa nativa dei thread, continuazione nativa degli strumenti,
Compaction nativa ed esecuzione app-server. OpenClaw continua a possedere i
canali di chat, i file di sessione, la selezione del modello, gli strumenti
dinamici OpenClaw, le approvazioni, la consegna dei media e il mirror visibile
della trascrizione.

La configurazione normale usa riferimenti canonici ai modelli OpenAI, come
`openai/gpt-5.5`. Non configurare riferimenti modello `openai-codex/gpt-*`.
Metti l'ordine di autenticazione dell'agente OpenAI sotto `auth.order.openai`;
i profili `openai-codex:*` meno recenti e le voci `auth.order.openai-codex`
restano supportati per le installazioni esistenti.

OpenClaw avvia i thread Codex app-server con la modalità codice nativa di Codex
e con solo-modalità-codice abilitata. Questo mantiene gli strumenti dinamici
OpenClaw differiti/ricercabili all'interno della superficie di esecuzione del
codice e ricerca strumenti propria di Codex, invece di aggiungere un wrapper di
ricerca strumenti in stile PI sopra Codex.

Per la separazione più ampia tra modello/provider/runtime, inizia da
[Runtime agente](/it/concepts/agent-runtimes). La versione breve è:
`openai/gpt-5.5` è il riferimento modello, `codex` è il runtime, e Telegram,
Discord, Slack o un altro canale resta la superficie di comunicazione.

## Requisiti

- OpenClaw con il Plugin `codex` incluso disponibile.
- Se la tua configurazione usa `plugins.allow`, includi `codex`.
- Codex app-server `0.125.0` o più recente. Il Plugin incluso gestisce per impostazione predefinita
  un binario Codex app-server compatibile, quindi i comandi `codex` locali su `PATH` non
  influiscono sul normale avvio dell'harness.
- Autenticazione Codex disponibile tramite `openclaw models auth login --provider openai-codex`,
  un account app-server nella home Codex dell'agente, o un profilo di autenticazione Codex con chiave API
  esplicito.

Per precedenza dell'autenticazione, isolamento dell'ambiente, comandi app-server
personalizzati, discovery dei modelli e tutti i campi di configurazione, vedi
[Riferimento dell'harness Codex](/it/plugins/codex-harness-reference).

## Avvio rapido

La maggior parte degli utenti che vogliono Codex in OpenClaw vuole questo percorso: accedere con un
abbonamento ChatGPT/Codex, abilitare il Plugin `codex` incluso e usare un
riferimento modello canonico `openai/gpt-*`.

Accedi con Codex OAuth:

```bash
openclaw models auth login --provider openai-codex
```

Abilita il Plugin `codex` incluso e seleziona un modello agente OpenAI:

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

Riavvia il Gateway dopo aver modificato la configurazione del Plugin. Se una chat esistente ha già
una sessione, usa `/new` o `/reset` prima di testare le modifiche di runtime, così il
turn successivo risolve l'harness dalla configurazione corrente.

## Configurazione

La configurazione di avvio rapido è la configurazione minima valida per l'harness Codex. Imposta le
opzioni dell'harness Codex nella configurazione OpenClaw e usa la CLI solo per l'autenticazione Codex:

| Esigenza                               | Imposta                                                                          | Dove                               |
| -------------------------------------- | -------------------------------------------------------------------------------- | ---------------------------------- |
| Abilitare l'harness                    | `plugins.entries.codex.enabled: true`                                            | Configurazione OpenClaw            |
| Mantenere un'installazione Plugin allowlistata | Includi `codex` in `plugins.allow`                                               | Configurazione OpenClaw            |
| Instradare i turn agente OpenAI tramite Codex | `agents.defaults.model` o `agents.list[].model` come `openai/gpt-*`              | Configurazione agente OpenClaw     |
| Accedere con Codex OAuth               | `openclaw models auth login --provider openai-codex`                             | Profilo di autenticazione CLI      |
| Aggiungere backup con chiave API per esecuzioni Codex | profilo chiave API `openai:*` elencato dopo l'autenticazione da abbonamento in `auth.order.openai` | Profilo di autenticazione CLI + configurazione OpenClaw |
| Fallire in modo chiuso quando Codex non è disponibile | Provider o modello `agentRuntime.id: "codex"`                                    | Configurazione modello/provider OpenClaw |
| Usare traffico API OpenAI diretto      | Provider o modello `agentRuntime.id: "pi"` con normale autenticazione OpenAI     | Configurazione modello/provider OpenClaw |
| Regolare il comportamento app-server   | `plugins.entries.codex.config.appServer.*`                                       | Configurazione Plugin Codex        |
| Abilitare le app Plugin Codex native   | `plugins.entries.codex.config.codexPlugins.*`                                    | Configurazione Plugin Codex        |
| Abilitare Codex Computer Use           | `plugins.entries.codex.config.computerUse.*`                                     | Configurazione Plugin Codex        |

Usa riferimenti modello `openai/gpt-*` per i turn agente OpenAI supportati da Codex. Preferisci
`auth.order.openai` per l'ordine abbonamento-prima/chiave-API-come-backup. I profili di autenticazione
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

In questa forma, entrambi i profili continuano a passare tramite Codex per i turn agente
`openai/gpt-*`. La chiave API è solo un fallback di autenticazione, non una richiesta di passare a PI o
alle semplici OpenAI Responses.

Il resto di questa pagina copre varianti comuni tra cui gli utenti devono scegliere:
forma di distribuzione, instradamento fail-closed, policy di approvazione guardian, Plugin Codex
nativi e Computer Use. Per elenchi completi delle opzioni, valori predefiniti, enum, discovery,
isolamento dell'ambiente, timeout e campi del trasporto app-server, vedi
[Riferimento dell'harness Codex](/it/plugins/codex-harness-reference).

## Verificare il runtime Codex

Usa `/status` nella chat in cui ti aspetti Codex. Un turn agente OpenAI supportato da Codex
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
e Skills. `/codex models` elenca il catalogo Codex app-server live per
l'harness e l'account. Se `/status` sorprende, vedi
[Risoluzione dei problemi](#troubleshooting).

## Instradamento e selezione del modello

Mantieni separati i riferimenti provider e la policy di runtime:

- Usa `openai/gpt-*` per i turn agente OpenAI tramite Codex.
- Non usare `openai-codex/gpt-*` nella configurazione. Esegui `openclaw doctor --fix` per
  riparare riferimenti legacy e pin di instradamento sessione obsoleti.
- `agentRuntime.id: "codex"` è opzionale per la normale modalità automatica OpenAI, ma utile
  quando una distribuzione deve fallire in modo chiuso se Codex non è disponibile.
- `agentRuntime.id: "pi"` opta un provider o modello nel comportamento PI diretto quando
  questo è intenzionale.
- `/codex ...` controlla conversazioni native Codex app-server dalla chat.
- ACP/acpx è un percorso di harness esterno separato. Usalo solo quando l'utente chiede
  ACP/acpx o un adattatore harness esterno.

Instradamento comandi comune:

| Intento dell'utente                | Usa                                     |
| ---------------------------------- | --------------------------------------- |
| Collegare la chat corrente         | `/codex bind [--cwd <path>]`            |
| Riprendere un thread Codex esistente | `/codex resume <thread-id>`             |
| Elencare o filtrare thread Codex   | `/codex threads [filter]`               |
| Inviare solo feedback Codex        | `/codex diagnostics [note]`             |
| Avviare un'attività ACP/acpx       | Comandi sessione ACP/acpx, non `/codex` |

| Caso d'uso                                           | Configura                                                        | Verifica                                | Note                               |
| ---------------------------------------------------- | ---------------------------------------------------------------- | --------------------------------------- | ---------------------------------- |
| Abbonamento ChatGPT/Codex con runtime Codex nativo   | `openai/gpt-*` più Plugin `codex` abilitato                      | `/status` mostra `Runtime: OpenAI Codex` | Percorso consigliato               |
| Fallire in modo chiuso se Codex non è disponibile    | Provider o modello `agentRuntime.id: "codex"`                    | Il turn fallisce invece del fallback PI | Usa per distribuzioni solo Codex   |
| Traffico con chiave API OpenAI diretta tramite PI     | Provider o modello `agentRuntime.id: "pi"` e normale autenticazione OpenAI | `/status` mostra il runtime PI          | Usa solo quando PI è intenzionale  |
| Configurazione legacy                                | `openai-codex/gpt-*`                                             | `openclaw doctor --fix` la riscrive     | Non scrivere nuova configurazione così |
| Adattatore Codex ACP/acpx                            | ACP `sessions_spawn({ runtime: "acp" })`                         | Stato attività/sessione ACP             | Separato dall'harness Codex nativo |

`agents.defaults.imageModel` segue la stessa separazione dei prefissi. Usa `openai/gpt-*`
per la normale rotta OpenAI e `codex/gpt-*` solo quando la comprensione delle immagini
deve passare attraverso un turn Codex app-server delimitato. Non usare
`openai-codex/gpt-*`; doctor riscrive quel prefisso legacy in `openai/gpt-*`.

## Modelli di distribuzione

### Distribuzione Codex di base

Usa la configurazione di avvio rapido quando tutti i turn agente OpenAI devono usare Codex per
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

Questa forma mantiene Claude come agente predefinito e aggiunge un agente Codex nominato:

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

### Distribuzione Codex fail-closed

Per i turn agente OpenAI, `openai/gpt-*` si risolve già in Codex quando il
Plugin incluso è disponibile. Aggiungi una policy di runtime esplicita quando vuoi una regola
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

Con Codex forzato, OpenClaw fallisce presto se il Plugin Codex è disabilitato, se
app-server è troppo vecchio o se app-server non può avviarsi.

## Policy app-server

Per impostazione predefinita, il Plugin avvia localmente il binario Codex gestito da OpenClaw con trasporto stdio.
Imposta `appServer.command` solo quando vuoi intenzionalmente eseguire un
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

Le sessioni app-server stdio locali usano per impostazione predefinita la postura attendibile dell'operatore locale:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` e
`sandbox: "danger-full-access"`. Se i requisiti locali di Codex non consentono
questa postura YOLO implicita, OpenClaw seleziona invece i permessi guardian consentiti.
Quando una sandbox OpenClaw è attiva per la sessione, OpenClaw restringe Codex
`danger-full-access` a Codex `workspace-write` in modo che i turni nativi di
code-mode Codex rimangano dentro il workspace in sandbox.

Usa la modalità guardian quando vuoi l'auto-review nativa di Codex prima delle
uscite dalla sandbox o di permessi aggiuntivi:

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

La modalità guardian si espande alle approvazioni app-server di Codex, di solito
`approvalPolicy: "on-request"`, `approvalsReviewer: "auto_review"` e
`sandbox: "workspace-write"` quando i requisiti locali consentono questi valori.

Per ogni campo app-server, ordine di autenticazione, isolamento dell'ambiente,
discovery e comportamento dei timeout, consulta il [riferimento dell'harness Codex](/it/plugins/codex-harness-reference).

## Comandi e diagnostica

Il plugin incluso registra `/codex` come comando slash su qualsiasi canale che
supporta i comandi di testo OpenClaw.

Forme comuni:

- `/codex status` controlla connettività app-server, modelli, account, limiti di frequenza,
  server MCP e Skills.
- `/codex models` elenca i modelli app-server Codex live.
- `/codex threads [filter]` elenca i thread app-server Codex recenti.
- `/codex resume <thread-id>` collega la sessione OpenClaw corrente a un
  thread Codex esistente.
- `/codex compact` chiede all'app-server Codex di compattare il thread collegato.
- `/codex review` avvia la review nativa Codex per il thread collegato.
- `/codex diagnostics [note]` chiede conferma prima di inviare feedback Codex per il
  thread collegato.
- `/codex account` mostra lo stato dell'account e dei limiti di frequenza.
- `/codex mcp` elenca lo stato dei server MCP dell'app-server Codex.
- `/codex skills` elenca le Skills dell'app-server Codex.

Per la maggior parte delle segnalazioni di supporto, inizia con `/diagnostics [note]` nella conversazione
in cui si è verificato il bug. Crea un report diagnostico Gateway e, per le sessioni
dell'harness Codex, chiede l'approvazione per inviare il bundle di feedback Codex pertinente.
Consulta [Esportazione diagnostica](/it/gateway/diagnostics) per il modello di privacy e il comportamento
nelle chat di gruppo.

Usa `/codex diagnostics [note]` solo quando vuoi specificamente il caricamento del feedback Codex
per il thread attualmente collegato senza il bundle diagnostico Gateway completo.

### Ispezionare i thread Codex localmente

Il modo più veloce per ispezionare un'esecuzione Codex non riuscita è spesso aprire direttamente
il thread Codex nativo:

```bash
codex resume <thread-id>
```

Ottieni l'ID del thread dalla risposta `/diagnostics` completata, da `/codex binding` o da
`/codex threads [filter]`.

Per la meccanica di caricamento e i confini diagnostici a livello di runtime, consulta
[runtime dell'harness Codex](/it/plugins/codex-harness-runtime#codex-feedback-upload).

L'autenticazione viene selezionata in questo ordine:

1. Profili di autenticazione OpenAI ordinati per l'agente, preferibilmente sotto
   `auth.order.openai`. Gli ID profilo `openai-codex:*` esistenti rimangono validi.
2. L'account esistente dell'app-server nella home Codex di quell'agente.
3. Solo per avvii app-server stdio locali, `CODEX_API_KEY`, poi
   `OPENAI_API_KEY`, quando non è presente alcun account app-server e l'autenticazione OpenAI è
   ancora richiesta.

Quando OpenClaw vede un profilo di autenticazione Codex in stile abbonamento ChatGPT, rimuove
`CODEX_API_KEY` e `OPENAI_API_KEY` dal processo figlio Codex avviato. Questo
mantiene disponibili le chiavi API a livello Gateway per embedding o modelli OpenAI diretti
senza far fatturare per errore i turni app-server Codex nativi tramite API.
I profili Codex espliciti con chiave API e il fallback locale con chiave env stdio usano il login app-server
invece dell'env ereditato dal processo figlio. Le connessioni app-server WebSocket
non ricevono il fallback della chiave API env del Gateway; usa un profilo di autenticazione esplicito o
l'account proprio dell'app-server remoto.

Se un profilo di abbonamento raggiunge un limite d'uso Codex, OpenClaw registra il tempo di reset
quando Codex ne segnala uno e prova il profilo di autenticazione successivo nell'ordine per la stessa
esecuzione Codex. Quando il tempo di reset passa, il profilo di abbonamento torna idoneo
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

`appServer.clearEnv` influisce solo sul processo figlio app-server Codex avviato.

Gli strumenti dinamici Codex usano per impostazione predefinita il caricamento `searchable`. OpenClaw non espone
strumenti dinamici che duplicano le operazioni workspace native di Codex: `read`, `write`,
`edit`, `apply_patch`, `exec`, `process` e `update_plan`. I restanti strumenti di integrazione OpenClaw,
come messaggistica, sessioni, media, cron, browser, nodi,
gateway, `heartbeat_respond` e `web_search`, sono disponibili tramite la ricerca strumenti Codex
sotto il namespace `openclaw`, mantenendo più piccolo il contesto iniziale del modello.
`sessions_yield` e le risposte sorgente solo message-tool rimangono dirette perché questi
sono contratti di controllo del turno. Le istruzioni di collaborazione Heartbeat dicono a Codex di
cercare `heartbeat_respond` prima di terminare un turno heartbeat quando lo strumento non è
già caricato.

Imposta `codexDynamicToolsLoading: "direct"` solo quando ti connetti a un app-server Codex personalizzato
che non può cercare strumenti dinamici differiti o quando esegui il debug del payload strumenti completo.

Campi supportati del plugin Codex di primo livello:

| Campo                      | Predefinito        | Significato                                                                                  |
| -------------------------- | -------------- | ---------------------------------------------------------------------------------------- |
| `codexDynamicToolsLoading` | `"searchable"` | Usa `"direct"` per inserire gli strumenti dinamici OpenClaw direttamente nel contesto strumenti Codex iniziale. |
| `codexDynamicToolsExclude` | `[]`           | Nomi aggiuntivi di strumenti dinamici OpenClaw da omettere dai turni app-server Codex.              |
| `codexPlugins`             | disabilitato       | Supporto nativo Codex per plugin/app per plugin curati migrati installati da sorgente.           |

Campi `appServer` supportati:

| Campo                         | Predefinito                                                | Significato                                                                                                                                                                                                                                 |
| ----------------------------- | ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                   | `"stdio"`                                              | `"stdio"` avvia Codex; `"websocket"` si connette a `url`.                                                                                                                                                                                |
| `command`                     | binario Codex gestito                                   | Eseguibile per il transport stdio. Lascialo non impostato per usare il binario gestito; impostalo solo per un override esplicito.                                                                                                                            |
| `args`                        | `["app-server", "--listen", "stdio://"]`               | Argomenti per il transport stdio.                                                                                                                                                                                                          |
| `url`                         | non impostato                                                  | URL app-server WebSocket.                                                                                                                                                                                                               |
| `authToken`                   | non impostato                                                  | Token bearer per il transport WebSocket.                                                                                                                                                                                                   |
| `headers`                     | `{}`                                                   | Header WebSocket aggiuntivi.                                                                                                                                                                                                                |
| `clearEnv`                    | `[]`                                                   | Nomi aggiuntivi di variabili d'ambiente rimossi dal processo app-server stdio avviato dopo che OpenClaw costruisce il suo ambiente ereditato. `CODEX_HOME` e `HOME` sono riservati all'isolamento Codex per agente di OpenClaw negli avvii locali.    |
| `requestTimeoutMs`            | `60000`                                                | Timeout per le chiamate control-plane dell'app-server.                                                                                                                                                                                             |
| `turnCompletionIdleTimeoutMs` | `60000`                                                | Finestra silenziosa dopo una richiesta app-server Codex con ambito di turno mentre OpenClaw attende `turn/completed`. Aumentala per fasi lente di sintesi post-strumento o solo stato.                                                                     |
| `mode`                        | `"yolo"` a meno che i requisiti locali Codex non vietino YOLO | Preset per l'esecuzione YOLO o sottoposta a review guardian. I requisiti stdio locali che omettono `danger-full-access`, l'approvazione `never` o il reviewer `user` rendono guardian il valore predefinito implicito.                                                   |
| `approvalPolicy`              | `"never"` o una policy di approvazione guardian consentita       | Policy di approvazione nativa Codex inviata ad avvio/ripresa/turno del thread. I valori predefiniti guardian preferiscono `"on-request"` quando consentito.                                                                                                                    |
| `sandbox`                     | `"danger-full-access"` o una sandbox guardian consentita  | Modalità sandbox nativa Codex inviata ad avvio/ripresa del thread. I valori predefiniti guardian preferiscono `"workspace-write"` quando consentito, altrimenti `"read-only"`. Quando una sandbox OpenClaw è attiva, `danger-full-access` viene ristretto a `"workspace-write"`. |
| `approvalsReviewer`           | `"user"` o un reviewer guardian consentito               | Usa `"auto_review"` per consentire a Codex di esaminare i prompt di approvazione nativi quando consentito, altrimenti `guardian_subagent` o `user`. `guardian_subagent` rimane un alias legacy.                                                                      |
| `serviceTier`                 | non impostato                                                  | Service tier app-server Codex opzionale. `"priority"` abilita il routing fast-mode, `"flex"` richiede l'elaborazione flex, `null` cancella l'override e il legacy `"fast"` è accettato come `"priority"`.                                         |

Le chiamate dinamiche agli strumenti di proprietà di OpenClaw sono limitate indipendentemente da
`appServer.requestTimeoutMs`: le richieste Codex `item/tool/call` usano per impostazione predefinita un watchdog
OpenClaw di 30 secondi. Un argomento `timeoutMs` positivo per chiamata estende
o riduce il budget di quello specifico strumento. Lo strumento `image_generate` usa anche
`agents.defaults.imageGenerationModel.timeoutMs` quando la chiamata allo strumento non
fornisce un proprio timeout, e lo strumento `image` per la comprensione dei media usa
`tools.media.image.timeoutSeconds` o il suo valore predefinito per i media di 60 secondi. I budget degli strumenti dinamici
sono limitati a 600000 ms. In caso di timeout, OpenClaw interrompe il segnale dello strumento
dove supportato e restituisce una risposta di strumento dinamico non riuscita a Codex, così il turno
può continuare invece di lasciare la sessione in `processing`.

Dopo che OpenClaw risponde a una richiesta app-server con ambito di turno Codex, l'harness
si aspetta anche che Codex completi il turno nativo con `turn/completed`. Se l'
app-server rimane silenzioso per `appServer.turnCompletionIdleTimeoutMs` dopo quella
risposta, OpenClaw interrompe il turno Codex al meglio delle proprie possibilità, registra un timeout
diagnostico e libera la corsia della sessione OpenClaw, così i messaggi di chat successivi
non vengono accodati dietro un turno nativo obsoleto. Qualsiasi notifica non terminale per lo
stesso turno, inclusa `rawResponseItem/completed`, disattiva quel breve watchdog
perché Codex ha dimostrato che il turno è ancora attivo; il watchdog terminale più lungo
continua a proteggere i turni realmente bloccati. La diagnostica dei timeout include il
metodo dell'ultima notifica app-server e, per gli elementi di risposta grezza dell'assistente, il
tipo di elemento, il ruolo, l'id e un'anteprima limitata del testo dell'assistente.

Le sovrascritture di ambiente restano disponibili per i test locali:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN` bypassa il binario gestito quando
`appServer.command` non è impostato.

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` è stato rimosso. Usa invece
`plugins.entries.codex.config.appServer.mode: "guardian"`, oppure
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` per test locali occasionali. La configurazione è
preferibile per distribuzioni ripetibili perché mantiene il comportamento del plugin nello
stesso file revisionato del resto della configurazione dell'harness Codex.

## Plugin Codex nativi

Il supporto ai plugin Codex nativi usa le capacità app e plugin proprie di Codex app-server
nello stesso thread Codex del turno dell'harness OpenClaw. OpenClaw
non traduce i plugin Codex in strumenti dinamici OpenClaw `codex_plugin_*`
sintetici.

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
            allow_destructive_actions: true,
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
Dopo aver modificato `codexPlugins`, usa `/new`, `/reset` o riavvia il gateway affinché
le future sessioni dell'harness Codex inizino con il set di app aggiornato.

Per idoneità alla migrazione, inventario delle app, policy per azioni distruttive,
elicitazioni e diagnostica dei plugin nativi, consulta
[Plugin Codex nativi](/it/plugins/codex-native-plugins).

## Computer Use

Computer Use è trattato nella propria guida di configurazione:
[Codex Computer Use](/it/plugins/codex-computer-use).

In breve: OpenClaw non include in vendor l'app di controllo desktop né esegue
azioni desktop direttamente. Prepara Codex app-server, verifica che il server MCP
`computer-use` sia disponibile, quindi lascia che Codex possieda le chiamate agli strumenti MCP nativi
durante i turni in modalità Codex.

## Confini di runtime

L'harness Codex modifica solo l'esecutore dell'agente incorporato di basso livello.

- Gli strumenti dinamici OpenClaw sono supportati. Codex chiede a OpenClaw di eseguire quegli
  strumenti, quindi OpenClaw resta nel percorso di esecuzione.
- Gli strumenti shell, patch, MCP e app nativi di Codex sono posseduti da Codex.
  OpenClaw può osservare o bloccare eventi nativi selezionati tramite il relay
  supportato, ma non riscrive gli argomenti degli strumenti nativi.
- Codex possiede la Compaction nativa. OpenClaw mantiene uno specchio della trascrizione per la cronologia
  del canale, la ricerca, `/new`, `/reset` e futuri cambi di modello o harness.
- Generazione di media, comprensione dei media, TTS, approvazioni e output degli strumenti di messaggistica
  continuano attraverso le impostazioni provider/modello OpenClaw corrispondenti.
- `tool_result_persist` si applica ai risultati degli strumenti nella trascrizione posseduti da OpenClaw, non
  ai record di risultato degli strumenti nativi Codex.

Per livelli hook, superfici V1 supportate, gestione dei permessi nativi, indirizzamento della coda,
meccaniche di caricamento del feedback Codex e dettagli sulla Compaction, consulta
[Runtime dell'harness Codex](/it/plugins/codex-harness-runtime).

## Risoluzione dei problemi

**Codex non appare come un normale provider `/model`:** questo è previsto per
le nuove configurazioni. Seleziona un modello `openai/gpt-*`, abilita
`plugins.entries.codex.enabled` e controlla se `plugins.allow` esclude
`codex`.

**OpenClaw usa PI invece di Codex:** assicurati che il riferimento del modello sia
`openai/gpt-*` sul provider OpenAI ufficiale e che il plugin Codex sia
installato e abilitato. Se ti serve una prova rigorosa durante i test, imposta il provider o
il modello `agentRuntime.id: "codex"`. Un runtime Codex forzato fallisce invece di
ripiegare su PI.

**Rimane una configurazione legacy `openai-codex/*`:** esegui `openclaw doctor --fix`.
Doctor riscrive i riferimenti dei modelli legacy in `openai/*`, rimuove i pin di runtime obsoleti di sessione e
dell'intero agente, e preserva le sovrascritture esistenti degli auth-profile.

**L'app-server viene rifiutato:** usa Codex app-server `0.125.0` o più recente.
Prerelease della stessa versione o versioni con suffisso di build come
`0.125.0-alpha.2` o `0.125.0+custom` vengono rifiutate perché OpenClaw verifica il
livello minimo del protocollo stabile `0.125.0`.

**`/codex status` non riesce a connettersi:** controlla che il plugin `codex` incluso sia
abilitato, che `plugins.allow` lo includa quando è configurata una allowlist, e
che eventuali `appServer.command`, `url`, `authToken` o header personalizzati siano validi.

**La scoperta dei modelli è lenta:** riduci
`plugins.entries.codex.config.discovery.timeoutMs` o disabilita la scoperta. Consulta
[Riferimento dell'harness Codex](/it/plugins/codex-harness-reference#model-discovery).

**Il trasporto WebSocket fallisce immediatamente:** controlla `appServer.url`, `authToken`,
gli header e che l'app-server remoto parli la stessa versione del protocollo
Codex app-server.

**Un modello non Codex usa PI:** questo è previsto a meno che la policy runtime del provider o del modello
lo instradi a un altro harness. I riferimenti semplici a provider non OpenAI restano sul
loro normale percorso provider in modalità `auto`.

**Computer Use è installato ma gli strumenti non vengono eseguiti:** controlla
`/codex computer-use status` da una sessione nuova. Se uno strumento segnala
`Native hook relay unavailable`, usa `/new` o `/reset`; se persiste, riavvia
il gateway per eliminare registrazioni di hook nativi obsolete. Consulta
[Codex Computer Use](/it/plugins/codex-computer-use#troubleshooting).

## Correlati

- [Riferimento dell'harness Codex](/it/plugins/codex-harness-reference)
- [Runtime dell'harness Codex](/it/plugins/codex-harness-runtime)
- [Plugin Codex nativi](/it/plugins/codex-native-plugins)
- [Codex Computer Use](/it/plugins/codex-computer-use)
- [Runtime degli agenti](/it/concepts/agent-runtimes)
- [Provider di modelli](/it/concepts/model-providers)
- [Provider OpenAI](/it/providers/openai)
- [Plugin di harness per agenti](/it/plugins/sdk-agent-harness)
- [Hook dei plugin](/it/plugins/hooks)
- [Esportazione della diagnostica](/it/gateway/diagnostics)
- [Stato](/it/cli/status)
- [Test](/it/help/testing-live#live-codex-app-server-harness-smoke)
