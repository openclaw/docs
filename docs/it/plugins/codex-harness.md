---
read_when:
    - Vuoi usare l'ambiente di test app-server Codex incluso
    - Ti servono esempi di configurazione dell'harness Codex
    - Vuoi che le distribuzioni solo Codex falliscano invece di ripiegare su PI
summary: Esegui i turni dell'agente incorporato di OpenClaw tramite l'harness app-server Codex incluso
title: Harness di Codex
x-i18n:
    generated_at: "2026-05-12T08:46:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: 62023998d817a557bd6434e3ab47f3b99b97fdea93a8984b78b7bd1738a61f92
    source_path: plugins/codex-harness.md
    workflow: 16
---

Il Plugin `codex` incluso consente a OpenClaw di eseguire turni agente OpenAI
incorporati tramite Codex app-server invece dell'harness PI integrato.

Usa l'harness Codex quando vuoi che Codex possieda la sessione agente di basso
livello: ripresa nativa del thread, continuazione nativa degli strumenti,
Compaction nativa ed esecuzione app-server. OpenClaw continua a possedere i
canali chat, i file di sessione, la selezione del modello, gli strumenti
dinamici OpenClaw, le approvazioni, la consegna dei media e il mirror visibile
della trascrizione.

La configurazione normale usa riferimenti modello OpenAI canonici come
`openai/gpt-5.5`. Non configurare riferimenti modello `openai-codex/gpt-*`.
Metti l'ordine di autenticazione agente OpenAI sotto `auth.order.openai`; i
profili meno recenti `openai-codex:*` e le voci `auth.order.openai-codex`
restano supportati per le installazioni esistenti.

OpenClaw avvia i thread Codex app-server con la modalità codice nativa di Codex
e con code-mode-only abilitato. Questo mantiene gli strumenti dinamici OpenClaw
differiti/ricercabili dentro la superficie di esecuzione codice e ricerca
strumenti propria di Codex, invece di aggiungere sopra Codex un wrapper di
ricerca strumenti in stile PI.

Per la separazione più ampia tra modello/provider/runtime, inizia da
[Runtime agente](/it/concepts/agent-runtimes). La versione breve è:
`openai/gpt-5.5` è il riferimento modello, `codex` è il runtime, e Telegram,
Discord, Slack o un altro canale resta la superficie di comunicazione.

## Requisiti

- OpenClaw con il Plugin `codex` incluso disponibile.
- Se la tua configurazione usa `plugins.allow`, includi `codex`.
- Codex app-server `0.125.0` o più recente. Il Plugin incluso gestisce per
  impostazione predefinita un binario Codex app-server compatibile, quindi i
  comandi locali `codex` in `PATH` non influenzano il normale avvio
  dell'harness.
- Autenticazione Codex disponibile tramite `openclaw models auth login --provider openai-codex`,
  un account app-server nella home Codex dell'agente, oppure un profilo di
  autenticazione Codex esplicito con chiave API.

Per precedenza dell'autenticazione, isolamento dell'ambiente, comandi
app-server personalizzati, individuazione dei modelli e tutti i campi di
configurazione, vedi
[Riferimento dell'harness Codex](/it/plugins/codex-harness-reference).

## Avvio rapido

La maggior parte degli utenti che vuole Codex in OpenClaw vuole questo percorso:
accedere con un abbonamento ChatGPT/Codex, abilitare il Plugin `codex` incluso e
usare un riferimento modello canonico `openai/gpt-*`.

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

Se la tua configurazione usa `plugins.allow`, aggiungi `codex` anche lì:

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

Riavvia il Gateway dopo aver modificato la configurazione del Plugin. Se una
chat esistente ha già una sessione, usa `/new` o `/reset` prima di testare le
modifiche al runtime, così il turno successivo risolverà l'harness dalla
configurazione corrente.

## Configurazione

La configurazione di avvio rapido è la configurazione minima utilizzabile per
l'harness Codex. Imposta le opzioni dell'harness Codex nella configurazione
OpenClaw e usa la CLI solo per l'autenticazione Codex:

| Esigenza                              | Imposta                                                                          | Dove                                      |
| ------------------------------------- | -------------------------------------------------------------------------------- | ----------------------------------------- |
| Abilitare l'harness                   | `plugins.entries.codex.enabled: true`                                            | Configurazione OpenClaw                   |
| Mantenere un'installazione Plugin allowlistata | Includi `codex` in `plugins.allow`                                      | Configurazione OpenClaw                   |
| Instradare i turni agente OpenAI tramite Codex | `agents.defaults.model` o `agents.list[].model` come `openai/gpt-*`     | Configurazione agente OpenClaw            |
| Accedere con Codex OAuth              | `openclaw models auth login --provider openai-codex`                             | Profilo di autenticazione CLI             |
| Aggiungere un backup con chiave API per le esecuzioni Codex | Profilo con chiave API `openai:*` elencato dopo l'autenticazione con abbonamento in `auth.order.openai` | Profilo di autenticazione CLI + configurazione OpenClaw |
| Fallire chiuso quando Codex non è disponibile | Provider o modello `agentRuntime.id: "codex"`                              | Configurazione modello/provider OpenClaw  |
| Usare traffico diretto verso l'API OpenAI | Provider o modello `agentRuntime.id: "pi"` con autenticazione OpenAI normale | Configurazione modello/provider OpenClaw  |
| Regolare il comportamento app-server  | `plugins.entries.codex.config.appServer.*`                                       | Configurazione Plugin Codex               |
| Abilitare app Plugin Codex native     | `plugins.entries.codex.config.codexPlugins.*`                                    | Configurazione Plugin Codex               |
| Abilitare Codex Computer Use          | `plugins.entries.codex.config.computerUse.*`                                     | Configurazione Plugin Codex               |

Usa riferimenti modello `openai/gpt-*` per i turni agente OpenAI supportati da
Codex. Preferisci `auth.order.openai` per l'ordinamento con abbonamento prima e
chiave API come backup. I profili di autenticazione `openai-codex:*` esistenti
e `auth.order.openai-codex` restano validi, ma non scrivere nuovi riferimenti
modello `openai-codex/gpt-*`.

```json5
{
  auth: {
    order: {
      openai: ["openai-codex:user@example.com", "openai:api-key-backup"],
    },
  },
}
```

In questa forma, entrambi i profili continuano a passare tramite Codex per i
turni agente `openai/gpt-*`. La chiave API è solo un fallback di
autenticazione, non una richiesta di passare a PI o a OpenAI Responses semplice.

Il resto di questa pagina copre le varianti comuni tra cui gli utenti devono
scegliere: forma di distribuzione, instradamento fail-closed, policy di
approvazione guardian, Plugin Codex nativi e Computer Use. Per elenchi completi
delle opzioni, valori predefiniti, enum, individuazione, isolamento
dell'ambiente, timeout e campi di trasporto app-server, vedi
[Riferimento dell'harness Codex](/it/plugins/codex-harness-reference).

## Verificare il runtime Codex

Usa `/status` nella chat in cui ti aspetti Codex. Un turno agente OpenAI
supportato da Codex mostra:

```text
Runtime: OpenAI Codex
```

Poi controlla lo stato di Codex app-server:

```text
/codex status
/codex models
```

`/codex status` segnala connettività app-server, account, limiti di frequenza,
server MCP e Skills. `/codex models` elenca il catalogo live di Codex app-server
per l'harness e l'account. Se `/status` è sorprendente, vedi
[Risoluzione dei problemi](#troubleshooting).

## Instradamento e selezione modello

Tieni separati i riferimenti provider e la policy runtime:

- Usa `openai/gpt-*` per i turni agente OpenAI tramite Codex.
- Non usare `openai-codex/gpt-*` nella configurazione. Esegui `openclaw doctor --fix` per
  riparare riferimenti legacy e pin di route di sessione obsoleti.
- `agentRuntime.id: "codex"` è opzionale per la normale modalità automatica
  OpenAI, ma utile quando una distribuzione deve fallire chiusa se Codex non è
  disponibile.
- `agentRuntime.id: "pi"` opta un provider o un modello nel comportamento PI
  diretto quando è intenzionale.
- `/codex ...` controlla conversazioni native Codex app-server dalla chat.
- ACP/acpx è un percorso di harness esterno separato. Usalo solo quando
  l'utente chiede ACP/acpx o un adattatore di harness esterno.

Instradamento dei comandi comuni:

| Intento dell'utente             | Usa                                     |
| ------------------------------- | --------------------------------------- |
| Collegare la chat corrente      | `/codex bind [--cwd <path>]`            |
| Riprendere un thread Codex esistente | `/codex resume <thread-id>`        |
| Elencare o filtrare thread Codex | `/codex threads [filter]`              |
| Inviare solo feedback Codex     | `/codex diagnostics [note]`             |
| Avviare un'attività ACP/acpx    | Comandi sessione ACP/acpx, non `/codex` |

| Caso d'uso                                           | Configura                                                        | Verifica                                | Note                                  |
| ---------------------------------------------------- | ---------------------------------------------------------------- | --------------------------------------- | ------------------------------------- |
| Abbonamento ChatGPT/Codex con runtime Codex nativo   | `openai/gpt-*` più Plugin `codex` abilitato                       | `/status` mostra `Runtime: OpenAI Codex` | Percorso consigliato                  |
| Fallire chiuso se Codex non è disponibile            | Provider o modello `agentRuntime.id: "codex"`                     | Il turno fallisce invece del fallback PI | Da usare per distribuzioni solo Codex |
| Traffico diretto con chiave API OpenAI tramite PI    | Provider o modello `agentRuntime.id: "pi"` e autenticazione OpenAI normale | `/status` mostra runtime PI       | Usa solo quando PI è intenzionale     |
| Configurazione legacy                                | `openai-codex/gpt-*`                                             | `openclaw doctor --fix` la riscrive     | Non scrivere nuova configurazione così |
| Adattatore Codex ACP/acpx                            | ACP `sessions_spawn({ runtime: "acp" })`                         | Stato attività/sessione ACP             | Separato dall'harness Codex nativo    |

`agents.defaults.imageModel` segue la stessa separazione di prefissi. Usa
`openai/gpt-*` per la normale route OpenAI e `codex/gpt-*` solo quando la
comprensione delle immagini deve passare tramite un turno Codex app-server
limitato. Non usare `openai-codex/gpt-*`; doctor riscrive quel prefisso legacy
in `openai/gpt-*`.

## Pattern di distribuzione

### Distribuzione Codex di base

Usa la configurazione di avvio rapido quando tutti i turni agente OpenAI devono
usare Codex per impostazione predefinita.

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

Questa forma mantiene Claude come agente predefinito e aggiunge un agente Codex
denominato:

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

Con questa configurazione, l'agente `main` usa il suo normale percorso provider
e l'agente `codex` usa Codex app-server.

### Distribuzione Codex fail-closed

Per i turni agente OpenAI, `openai/gpt-*` si risolve già in Codex quando il
Plugin incluso è disponibile. Aggiungi una policy runtime esplicita quando vuoi
una regola fail-closed scritta:

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

Con Codex forzato, OpenClaw fallisce in anticipo se il Plugin Codex è
disabilitato, l'app-server è troppo vecchio o l'app-server non può avviarsi.

## Policy app-server

Per impostazione predefinita, il Plugin avvia localmente il binario Codex gestito
da OpenClaw con trasporto stdio. Imposta `appServer.command` solo quando vuoi
intenzionalmente eseguire un eseguibile diverso. Usa il trasporto WebSocket solo
quando un app-server è già in esecuzione altrove:

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

Le sessioni app-server stdio locali usano per impostazione predefinita la postura di operatore locale attendibile:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` e
`sandbox: "danger-full-access"`. Se i requisiti locali di Codex non consentono
questa postura YOLO implicita, OpenClaw seleziona invece le autorizzazioni guardian consentite.
Quando una sandbox OpenClaw è attiva per la sessione, OpenClaw restringe
`danger-full-access` di Codex a `workspace-write` di Codex, così i turni nativi in modalità codice di Codex
restano all'interno del workspace in sandbox.

Usa la modalità guardian quando vuoi l'auto-review nativa di Codex prima delle evasioni dalla sandbox
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

La modalità guardian si espande nelle approvazioni dell'app-server Codex, di solito
`approvalPolicy: "on-request"`, `approvalsReviewer: "auto_review"` e
`sandbox: "workspace-write"` quando i requisiti locali consentono questi valori.

Per ogni campo app-server, ordine di autenticazione, isolamento dell'ambiente, discovery e
comportamento dei timeout, consulta il [riferimento dell'harness Codex](/it/plugins/codex-harness-reference).

## Comandi e diagnostica

Il Plugin incluso registra `/codex` come comando slash su qualsiasi canale che
supporta i comandi testuali di OpenClaw.

Forme comuni:

- `/codex status` verifica connettività dell'app-server, modelli, account, limiti di frequenza,
  server MCP e skills.
- `/codex models` elenca i modelli live dell'app-server Codex.
- `/codex threads [filter]` elenca i thread recenti dell'app-server Codex.
- `/codex resume <thread-id>` collega la sessione OpenClaw corrente a un
  thread Codex esistente.
- `/codex compact` chiede all'app-server Codex di compattare il thread collegato.
- `/codex review` avvia la review nativa di Codex per il thread collegato.
- `/codex diagnostics [note]` chiede conferma prima di inviare feedback Codex per il
  thread collegato.
- `/codex account` mostra lo stato dell'account e dei limiti di frequenza.
- `/codex mcp` elenca lo stato dei server MCP dell'app-server Codex.
- `/codex skills` elenca le skills dell'app-server Codex.

Per la maggior parte delle segnalazioni di supporto, inizia con `/diagnostics [note]` nella conversazione
in cui si è verificato il bug. Crea un report diagnostico del Gateway e, per le sessioni
dell'harness Codex, chiede l'approvazione per inviare il bundle di feedback Codex pertinente.
Consulta [Esportazione diagnostica](/it/gateway/diagnostics) per il modello di privacy e il comportamento
nelle chat di gruppo.

Usa `/codex diagnostics [note]` solo quando vuoi specificamente il caricamento del feedback Codex
per il thread attualmente collegato senza il bundle diagnostico completo del Gateway.

### Ispeziona localmente i thread Codex

Il modo più rapido per ispezionare un'esecuzione Codex problematica è spesso aprire direttamente
il thread Codex nativo:

```bash
codex resume <thread-id>
```

Ottieni l'ID del thread dalla risposta `/diagnostics` completata, da `/codex binding` o da
`/codex threads [filter]`.

Per la meccanica di caricamento e i confini diagnostici a livello runtime, consulta
[Runtime dell'harness Codex](/it/plugins/codex-harness-runtime#codex-feedback-upload).

L'autenticazione viene selezionata in questo ordine:

1. Profili di autenticazione OpenAI ordinati per l'agente, preferibilmente sotto
   `auth.order.openai`. Gli ID profilo `openai-codex:*` esistenti restano validi.
2. L'account esistente dell'app-server nella home Codex di quell'agente.
3. Solo per avvii app-server stdio locali, `CODEX_API_KEY`, poi
   `OPENAI_API_KEY`, quando non è presente alcun account app-server e l'autenticazione OpenAI è
   ancora richiesta.

Quando OpenClaw rileva un profilo di autenticazione Codex in stile abbonamento ChatGPT, rimuove
`CODEX_API_KEY` e `OPENAI_API_KEY` dal processo figlio Codex avviato. Questo
mantiene le chiavi API a livello Gateway disponibili per embedding o modelli OpenAI diretti
senza far fatturare per errore i turni app-server Codex nativi tramite API.
I profili espliciti Codex con chiave API e il fallback con chiave env stdio locale usano il login app-server
invece dell'env ereditato del processo figlio. Le connessioni app-server WebSocket
non ricevono il fallback della chiave API env del Gateway; usa un profilo di autenticazione esplicito o
l'account proprio dell'app-server remoto.

Se un profilo di abbonamento raggiunge un limite d'uso Codex, OpenClaw registra l'ora di reset
quando Codex ne segnala una e prova il profilo di autenticazione ordinato successivo per la stessa
esecuzione Codex. Quando l'ora di reset passa, il profilo di abbonamento torna idoneo
senza modificare il modello `openai/gpt-*` selezionato o il runtime Codex.

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
`edit`, `apply_patch`, `exec`, `process` e `update_plan`. Gli strumenti di integrazione OpenClaw
rimanenti, come messaggistica, sessioni, media, cron, browser, nodi,
gateway, `heartbeat_respond` e `web_search`, sono disponibili tramite la ricerca strumenti Codex
sotto il namespace `openclaw`, mantenendo più piccolo il contesto iniziale del modello.
`sessions_yield` e le risposte sorgente solo per strumenti messaggio restano dirette perché sono
contratti di controllo del turno. Le istruzioni di collaborazione Heartbeat indicano a Codex di
cercare `heartbeat_respond` prima di terminare un turno heartbeat quando lo strumento non è
già caricato.

Imposta `codexDynamicToolsLoading: "direct"` solo quando ti connetti a un app-server Codex personalizzato
che non può cercare strumenti dinamici differiti o quando esegui il debug del payload completo degli strumenti.

Campi Plugin Codex di primo livello supportati:

| Campo                      | Predefinito        | Significato                                                                                  |
| -------------------------- | -------------- | ---------------------------------------------------------------------------------------- |
| `codexDynamicToolsLoading` | `"searchable"` | Usa `"direct"` per inserire gli strumenti dinamici OpenClaw direttamente nel contesto strumenti Codex iniziale. |
| `codexDynamicToolsExclude` | `[]`           | Nomi aggiuntivi di strumenti dinamici OpenClaw da omettere dai turni app-server Codex.              |
| `codexPlugins`             | disabilitato       | Supporto nativo Plugin/app Codex per Plugin curati migrati installati da sorgente.           |

Campi `appServer` supportati:

| Campo                         | Predefinito                                                | Significato                                                                                                                                                                                                                                 |
| ----------------------------- | ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                   | `"stdio"`                                              | `"stdio"` avvia Codex; `"websocket"` si connette a `url`.                                                                                                                                                                                |
| `command`                     | binario Codex gestito                                   | Eseguibile per il trasporto stdio. Lascia non impostato per usare il binario gestito; impostalo solo per un override esplicito.                                                                                                                            |
| `args`                        | `["app-server", "--listen", "stdio://"]`               | Argomenti per il trasporto stdio.                                                                                                                                                                                                          |
| `url`                         | non impostato                                                  | URL dell'app-server WebSocket.                                                                                                                                                                                                               |
| `authToken`                   | non impostato                                                  | Token bearer per il trasporto WebSocket.                                                                                                                                                                                                   |
| `headers`                     | `{}`                                                   | Header WebSocket aggiuntivi.                                                                                                                                                                                                                |
| `clearEnv`                    | `[]`                                                   | Nomi aggiuntivi di variabili d'ambiente rimossi dal processo app-server stdio avviato dopo che OpenClaw ha costruito il suo ambiente ereditato. `CODEX_HOME` e `HOME` sono riservati all'isolamento Codex per agente di OpenClaw negli avvii locali.    |
| `requestTimeoutMs`            | `60000`                                                | Timeout per le chiamate control-plane dell'app-server.                                                                                                                                                                                             |
| `turnCompletionIdleTimeoutMs` | `60000`                                                | Finestra di quiete dopo una richiesta app-server Codex con ambito di turno mentre OpenClaw attende `turn/completed`. Aumentala per fasi lente di sintesi post-strumento o solo di stato.                                                                     |
| `mode`                        | `"yolo"` a meno che i requisiti locali di Codex non disabilitino YOLO | Preset per esecuzione YOLO o sottoposta a review guardian. I requisiti stdio locali che omettono `danger-full-access`, approvazione `never` o reviewer `user` rendono guardian il valore predefinito implicito.                                                   |
| `approvalPolicy`              | `"never"` o una policy di approvazione guardian consentita       | Policy di approvazione nativa Codex inviata ad avvio/ripresa/turno del thread. I valori predefiniti guardian preferiscono `"on-request"` quando consentito.                                                                                                                    |
| `sandbox`                     | `"danger-full-access"` o una sandbox guardian consentita  | Modalità sandbox nativa Codex inviata ad avvio/ripresa del thread. I valori predefiniti guardian preferiscono `"workspace-write"` quando consentito, altrimenti `"read-only"`. Quando una sandbox OpenClaw è attiva, `danger-full-access` viene ristretto a `"workspace-write"`. |
| `approvalsReviewer`           | `"user"` o un reviewer guardian consentito               | Usa `"auto_review"` per lasciare che Codex esamini le richieste di approvazione native quando consentito, altrimenti `guardian_subagent` o `user`. `guardian_subagent` resta un alias legacy.                                                                      |
| `serviceTier`                 | non impostato                                                  | Tier di servizio opzionale dell'app-server Codex. `"priority"` abilita il routing fast-mode, `"flex"` richiede l'elaborazione flex, `null` cancella l'override e il legacy `"fast"` è accettato come `"priority"`.                                         |

Le chiamate a strumenti dinamici di proprietà di OpenClaw sono limitate indipendentemente da
`appServer.requestTimeoutMs`: le richieste Codex `item/tool/call` usano per impostazione predefinita un watchdog OpenClaw di 30 secondi. Un argomento `timeoutMs` positivo per singola chiamata estende
o riduce quel budget specifico dello strumento. Lo strumento `image_generate` usa anche
`agents.defaults.imageGenerationModel.timeoutMs` quando la chiamata allo strumento non
fornisce un proprio timeout, e lo strumento di comprensione multimediale `image` usa
`tools.media.image.timeoutSeconds` o il suo valore multimediale predefinito di 60 secondi. I budget degli strumenti dinamici
sono limitati a 600000 ms. Al timeout, OpenClaw interrompe il segnale dello strumento
dove supportato e restituisce una risposta di strumento dinamico non riuscita a Codex, così il turno
può continuare invece di lasciare la sessione in `processing`.

Dopo che OpenClaw risponde a una richiesta app-server con ambito di turno Codex, l'harness
si aspetta anche che Codex termini il turno nativo con `turn/completed`. Se l'
app-server resta silenzioso per `appServer.turnCompletionIdleTimeoutMs` dopo quella
risposta, OpenClaw interrompe al meglio il turno Codex, registra un timeout
diagnostico e rilascia la corsia di sessione OpenClaw, così i messaggi chat successivi
non vengono accodati dietro un turno nativo obsoleto. Qualsiasi notifica non terminale per lo
stesso turno, inclusa `rawResponseItem/completed`, disattiva quel watchdog breve
perché Codex ha dimostrato che il turno è ancora vivo; il watchdog terminale più lungo
continua a proteggere i turni realmente bloccati. Le notifiche globali dell'app-server,
come gli aggiornamenti sui limiti di frequenza, non reimpostano l'avanzamento di inattività del turno. Quando Codex emette un
elemento `agentMessage` completato e poi resta silenzioso senza `turn/completed`,
OpenClaw tratta l'output dell'assistente come di fatto completo, interrompe al meglio
il turno Codex nativo e rilascia la corsia di sessione. Le diagnostiche di timeout
includono l'ultimo metodo di notifica dell'app-server e, per gli elementi di risposta
assistente grezzi, il tipo di elemento, il ruolo, l'id e un'anteprima limitata del testo
dell'assistente.

Gli override di ambiente restano disponibili per i test locali:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN` aggira il binario gestito quando
`appServer.command` non è impostato.

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` è stato rimosso. Usa invece
`plugins.entries.codex.config.appServer.mode: "guardian"`, oppure
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` per test locali una tantum. La configurazione è
preferibile per distribuzioni ripetibili perché mantiene il comportamento del Plugin nello
stesso file revisionato del resto della configurazione dell'harness Codex.

## Plugin Codex nativi

Il supporto dei Plugin Codex nativi usa le capacità app e Plugin proprie dell'app-server Codex
nello stesso thread Codex del turno dell'harness OpenClaw. OpenClaw
non traduce i Plugin Codex in strumenti dinamici OpenClaw sintetici `codex_plugin_*`.

`codexPlugins` influisce solo sulle sessioni che selezionano l'harness Codex nativo. Non
ha alcun effetto sulle esecuzioni PI, sulle normali esecuzioni del provider OpenAI, sui binding di conversazione
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

La configurazione dell'app del thread viene calcolata quando OpenClaw stabilisce una sessione dell'harness Codex
o sostituisce un binding del thread Codex obsoleto. Non viene ricalcolata a ogni turno.
Dopo aver modificato `codexPlugins`, usa `/new`, `/reset` o riavvia il gateway, così
le future sessioni dell'harness Codex partiranno con il set di app aggiornato.

Per idoneità alla migrazione, inventario delle app, policy delle azioni distruttive,
elicitazioni e diagnostica dei Plugin nativi, consulta
[Plugin Codex nativi](/it/plugins/codex-native-plugins).

## Computer Use

Computer Use è trattato nella propria guida di configurazione:
[Codex Computer Use](/it/plugins/codex-computer-use).

La versione breve: OpenClaw non include come vendor l'app di controllo desktop né esegue
azioni desktop direttamente. Prepara l'app-server Codex, verifica che il server MCP
`computer-use` sia disponibile e poi lascia che Codex possieda le chiamate agli strumenti MCP
nativi durante i turni in modalità Codex.

## Confini di runtime

L'harness Codex modifica solo l'esecutore dell'agente integrato di basso livello.

- Gli strumenti dinamici OpenClaw sono supportati. Codex chiede a OpenClaw di eseguire quegli
  strumenti, quindi OpenClaw resta nel percorso di esecuzione.
- Gli strumenti shell, patch, MCP e app nativi di Codex sono di proprietà di Codex.
  OpenClaw può osservare o bloccare eventi nativi selezionati tramite il relay supportato,
  ma non riscrive gli argomenti degli strumenti nativi.
- Codex possiede la Compaction nativa. OpenClaw mantiene uno specchio della trascrizione per la cronologia
  dei canali, la ricerca, `/new`, `/reset` e futuri cambi di modello o harness.
- Generazione multimediale, comprensione multimediale, TTS, approvazioni e output degli strumenti di messaggistica
  continuano tramite le impostazioni OpenClaw provider/modello corrispondenti.
- `tool_result_persist` si applica ai risultati degli strumenti nella trascrizione di proprietà di OpenClaw, non
  ai record dei risultati degli strumenti nativi Codex.

Per livelli hook, superfici V1 supportate, gestione delle autorizzazioni native, indirizzamento delle code,
meccaniche di caricamento del feedback Codex e dettagli di Compaction, consulta
[runtime dell'harness Codex](/it/plugins/codex-harness-runtime).

## Risoluzione dei problemi

**Codex non compare come un normale provider `/model`:** questo è previsto per
le nuove configurazioni. Seleziona un modello `openai/gpt-*`, abilita
`plugins.entries.codex.enabled` e verifica se `plugins.allow` esclude
`codex`.

**OpenClaw usa PI invece di Codex:** assicurati che il riferimento al modello sia
`openai/gpt-*` sul provider OpenAI ufficiale e che il Plugin Codex sia
installato e abilitato. Se ti serve una prova rigorosa durante i test, imposta `agentRuntime.id: "codex"` per provider o modello. Un runtime Codex forzato fallisce invece di
ripiegare su PI.

**Resta una configurazione legacy `openai-codex/*`:** esegui `openclaw doctor --fix`.
Doctor riscrive i riferimenti ai modelli legacy in `openai/*`, rimuove i pin runtime obsoleti di sessione e
dell'intero agente, e preserva gli override esistenti degli auth-profile.

**L'app-server viene rifiutato:** usa app-server Codex `0.125.0` o più recente.
Le prerelease della stessa versione o le versioni con suffisso di build come
`0.125.0-alpha.2` o `0.125.0+custom` vengono rifiutate perché OpenClaw testa il
livello minimo del protocollo stabile `0.125.0`.

**`/codex status` non riesce a connettersi:** verifica che il Plugin `codex` incluso sia
abilitato, che `plugins.allow` lo includa quando è configurata una allowlist, e
che eventuali `appServer.command`, `url`, `authToken` o header personalizzati siano validi.

**Il rilevamento dei modelli è lento:** riduci
`plugins.entries.codex.config.discovery.timeoutMs` o disabilita il rilevamento. Consulta
[riferimento dell'harness Codex](/it/plugins/codex-harness-reference#model-discovery).

**Il trasporto WebSocket fallisce immediatamente:** controlla `appServer.url`, `authToken`,
gli header e che l'app-server remoto parli la stessa versione del protocollo app-server
Codex.

**Un modello non Codex usa PI:** questo è previsto a meno che la policy runtime del provider o del modello
non lo instradi a un altro harness. I semplici riferimenti a provider non OpenAI restano sul
loro normale percorso provider in modalità `auto`.

**Computer Use è installato ma gli strumenti non vengono eseguiti:** controlla
`/codex computer-use status` da una nuova sessione. Se uno strumento segnala
`Native hook relay unavailable`, usa `/new` o `/reset`; se persiste, riavvia
il gateway per eliminare registrazioni obsolete degli hook nativi. Consulta
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
- [Hook dei Plugin](/it/plugins/hooks)
- [Esportazione diagnostica](/it/gateway/diagnostics)
- [Stato](/it/cli/status)
- [Testing](/it/help/testing-live#live-codex-app-server-harness-smoke)
