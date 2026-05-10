---
read_when:
    - Sono necessari tutti i campi di configurazione dell'harness Codex
    - Stai modificando il comportamento di trasporto, autenticazione, rilevamento o timeout del server dell'app
    - Stai eseguendo il debug dell'avvio dell'harness Codex, del rilevamento dei modelli o dell'isolamento dell'ambiente
summary: Riferimento per configurazione, autenticazione, rilevamento e server applicativo per l'ambiente di esecuzione Codex
title: Riferimento dell'ambiente di esecuzione Codex
x-i18n:
    generated_at: "2026-05-10T19:42:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: 72767810c9448015a1ce7f35263dba576151b18c1f4a43ba531d45728241f095
    source_path: plugins/codex-harness-reference.md
    workflow: 16
---

Questo riferimento copre la configurazione dettagliata per il Plugin `codex`
incluso. Per le decisioni di configurazione e routing, inizia da
[Harness Codex](/it/plugins/codex-harness).

## Superficie di configurazione del Plugin

Tutte le impostazioni dell'harness Codex si trovano sotto `plugins.entries.codex.config`.

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
          appServer: {
            mode: "guardian",
          },
        },
      },
    },
  },
}
```

Campi di primo livello supportati:

| Campo                      | Predefinito             | Significato                                                                                                                              |
| -------------------------- | ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `discovery`                | abilitato               | Impostazioni di discovery dei modelli per `model/list` dell'app-server Codex.                                                            |
| `appServer`                | app-server stdio gestito | Impostazioni di trasporto, comando, auth, approvazione, sandbox e timeout.                                                               |
| `codexDynamicToolsLoading` | `"searchable"`          | Usa `"direct"` per inserire gli strumenti dinamici di OpenClaw direttamente nel contesto iniziale degli strumenti Codex.                 |
| `codexDynamicToolsExclude` | `[]`                    | Nomi aggiuntivi degli strumenti dinamici di OpenClaw da omettere dai turni dell'app-server Codex.                                        |
| `codexPlugins`             | disabilitato            | Supporto nativo di plugin/app Codex per plugin curati installati da sorgente migrati. Vedi [Plugin Codex nativi](/it/plugins/codex-native-plugins). |
| `computerUse`              | disabilitato            | Configurazione di Codex Computer Use. Vedi [Codex Computer Use](/it/plugins/codex-computer-use).                                           |

## Trasporto app-server

Per impostazione predefinita, OpenClaw avvia il binario Codex gestito distribuito con il Plugin
incluso:

```bash
codex app-server --listen stdio://
```

Questo mantiene la versione dell'app-server legata al Plugin `codex` incluso invece che
a qualsiasi CLI Codex separata installata localmente. Imposta
`appServer.command` solo quando vuoi intenzionalmente eseguire un eseguibile
diverso.

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
            url: "ws://gateway-host:39175",
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

| Campo                         | Predefinito                                            | Significato                                                                                                                                                                                    |
| ----------------------------- | ------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                   | `"stdio"`                                              | `"stdio"` genera Codex; `"websocket"` si connette a `url`.                                                                                                                                     |
| `command`                     | binario Codex gestito                                  | Eseguibile per il trasporto stdio. Lascia non impostato per usare il binario gestito.                                                                                                          |
| `args`                        | `["app-server", "--listen", "stdio://"]`               | Argomenti per il trasporto stdio.                                                                                                                                                              |
| `url`                         | non impostato                                          | URL WebSocket dell'app-server.                                                                                                                                                                 |
| `authToken`                   | non impostato                                          | Token bearer per il trasporto WebSocket.                                                                                                                                                       |
| `headers`                     | `{}`                                                   | Header WebSocket extra.                                                                                                                                                                        |
| `clearEnv`                    | `[]`                                                   | Nomi di variabili d'ambiente extra rimossi dal processo app-server stdio generato dopo che OpenClaw ha costruito il proprio ambiente ereditato.                                                |
| `requestTimeoutMs`            | `60000`                                                | Timeout per le chiamate del piano di controllo dell'app-server.                                                                                                                                |
| `turnCompletionIdleTimeoutMs` | `60000`                                                | Finestra di quiete dopo una richiesta app-server con ambito di turno mentre OpenClaw attende `turn/completed`.                                                                                 |
| `mode`                        | `"yolo"` salvo che i requisiti locali di Codex non consentano YOLO | Preset per l'esecuzione YOLO o revisionata da guardian.                                                                                                                                        |
| `approvalPolicy`              | `"never"` o una policy di approvazione guardian consentita | Policy di approvazione nativa Codex inviata all'avvio del thread, alla ripresa e al turno.                                                                                                     |
| `sandbox`                     | `"danger-full-access"` o una sandbox guardian consentita | Modalità sandbox nativa Codex inviata all'avvio e alla ripresa del thread.                                                                                                                     |
| `approvalsReviewer`           | `"user"` o un reviewer guardian consentito             | Usa `"auto_review"` per lasciare che Codex revisioni i prompt di approvazione nativi quando consentito.                                                                                        |
| `defaultWorkspaceDir`         | directory del processo corrente                        | Workspace usato da `/codex bind` quando `--cwd` è omesso.                                                                                                                                      |
| `serviceTier`                 | non impostato                                          | Livello di servizio app-server Codex facoltativo. `"priority"` abilita il routing in modalità veloce, `"flex"` richiede elaborazione flex e `null` cancella l'override. Il valore legacy `"fast"` è accettato come `"priority"`. |

Il Plugin blocca handshake app-server più vecchi o senza versione. Codex app-server
deve riportare la versione stabile `0.125.0` o successiva.

## Modalità di approvazione e sandbox

Le sessioni app-server stdio locali usano per impostazione predefinita la modalità YOLO:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` e
`sandbox: "danger-full-access"`. Questa postura da operatore locale fidato consente
ai turni e agli Heartbeat non presidiati di OpenClaw di avanzare senza prompt di approvazione
nativi a cui nessuno è presente per rispondere.

Se il file dei requisiti di sistema locali di Codex non consente valori impliciti YOLO per approvazione,
reviewer o sandbox, OpenClaw considera invece il valore predefinito implicito come guardian
e seleziona permessi guardian consentiti. Le voci
`[[remote_sandbox_config]]` corrispondenti all'hostname nello stesso file dei requisiti sono rispettate
per la decisione predefinita della sandbox.

Imposta `appServer.mode: "guardian"` per approvazioni Codex revisionate da guardian:

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

Il preset `guardian` si espande in `approvalPolicy: "on-request"`,
`approvalsReviewer: "auto_review"` e `sandbox: "workspace-write"` quando tali
valori sono consentiti. I singoli campi di policy sovrascrivono `mode`. Il valore reviewer più vecchio
`guardian_subagent` è ancora accettato come alias di compatibilità,
ma le nuove configurazioni dovrebbero usare `auto_review`.

## Auth e isolamento dell'ambiente

Auth viene selezionato in questo ordine:

1. Un profilo auth OpenClaw Codex esplicito per l'agente.
2. L'account esistente dell'app-server nella home Codex di quell'agente.
3. Solo per gli avvii locali dell'app-server stdio, `CODEX_API_KEY`, poi
   `OPENAI_API_KEY`, quando non è presente alcun account app-server e l'auth OpenAI è
   ancora richiesta.

Quando OpenClaw rileva un profilo auth Codex in stile abbonamento ChatGPT, rimuove
`CODEX_API_KEY` e `OPENAI_API_KEY` dal processo figlio Codex generato. Questo
mantiene disponibili le chiavi API a livello di Gateway per embedding o modelli OpenAI diretti
senza far sì che i turni nativi dell'app-server Codex vengano fatturati accidentalmente tramite API.

I profili API-key Codex espliciti e il fallback di chiave env stdio locale usano il login app-server
invece dell'env ereditato dal processo figlio. Le connessioni WebSocket all'app-server
non ricevono il fallback API-key env del Gateway; usa un profilo auth esplicito o
l'account proprio dell'app-server remoto.

Gli avvii dell'app-server stdio ereditano per impostazione predefinita l'ambiente di processo di OpenClaw, ma
OpenClaw possiede il bridge degli account dell'app-server Codex e imposta sia `CODEX_HOME` sia
`HOME` su directory per-agente nello stato OpenClaw di quell'agente. Il loader di
Skills proprio di Codex legge `$CODEX_HOME/skills` e `$HOME/.agents/skills`, quindi entrambi
i valori sono isolati per gli avvii locali dell'app-server. Questo mantiene Skills,
plugin, configurazione, account e stato dei thread nativi Codex limitati all'agente OpenClaw
invece di farli trapelare dalla home personale della CLI Codex dell'operatore.

I plugin OpenClaw e gli snapshot delle Skills OpenClaw continuano a passare attraverso il
registro dei plugin e il loader delle Skills propri di OpenClaw. Gli asset personali della CLI Codex no. Se hai
Skills o plugin utili della CLI Codex che dovrebbero diventare parte di un agente OpenClaw,
inventariali esplicitamente:

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

Se una distribuzione richiede isolamento ambientale aggiuntivo, aggiungi tali variabili a
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
`CODEX_HOME` e `HOME` rimangono riservati all'isolamento Codex per-agente di OpenClaw
negli avvii locali.

## Strumenti dinamici

Gli strumenti dinamici Codex usano per impostazione predefinita il caricamento `searchable`. OpenClaw non espone
strumenti dinamici che duplicano le operazioni workspace native di Codex:

- `read`
- `write`
- `edit`
- `apply_patch`
- `exec`
- `process`
- `update_plan`

Gli altri strumenti di integrazione di OpenClaw, come messaggistica, sessioni, media, cron,
browser, nodi, Gateway, `heartbeat_respond` e `web_search`, sono disponibili
tramite la ricerca strumenti di Codex sotto il namespace `openclaw`. Questo mantiene più piccolo
il contesto iniziale del modello. `sessions_yield` e le risposte sorgente solo tramite strumento di messaggistica
restano dirette perché sono contratti di controllo del turno.

Imposta `codexDynamicToolsLoading: "direct"` solo quando ti connetti a un app-server Codex
personalizzato che non può cercare strumenti dinamici differiti o quando esegui il debug del payload
completo degli strumenti.

## Timeout

Le chiamate agli strumenti dinamici di proprietà di OpenClaw sono limitate indipendentemente da
`appServer.requestTimeoutMs`. Ogni richiesta Codex `item/tool/call` usa il primo
timeout disponibile in questo ordine:

- Un argomento `timeoutMs` positivo per singola chiamata.
- Per `image_generate`, `agents.defaults.imageGenerationModel.timeoutMs`.
- Per lo strumento di comprensione dei media `image`, `tools.media.image.timeoutSeconds`
  convertito in millisecondi, oppure il valore predefinito media di 60 secondi.
- Il valore predefinito di 30 secondi per gli strumenti dinamici.

I budget degli strumenti dinamici sono limitati a 600000 ms. Al timeout, OpenClaw interrompe il
segnale dello strumento dove supportato e restituisce a Codex una risposta di strumento dinamico non riuscita,
così il turno può continuare invece di lasciare la sessione in `processing`.

Dopo che OpenClaw risponde a una richiesta app-server con ambito di turno di Codex, l'harness
si aspetta anche che Codex completi il turno nativo con `turn/completed`. Se
l'app-server resta silenzioso per `appServer.turnCompletionIdleTimeoutMs` dopo quella
risposta, OpenClaw tenta al meglio di interrompere il turno Codex, registra un timeout
diagnostico e rilascia la corsia della sessione OpenClaw, così i messaggi di chat successivi
non vengono messi in coda dietro un turno nativo obsoleto.

Qualsiasi notifica non terminale per lo stesso turno, inclusa
`rawResponseItem/completed`, disattiva quel breve watchdog perché Codex ha
dimostrato che il turno è ancora vivo. Il watchdog terminale più lungo continua a
proteggere i turni realmente bloccati. Le diagnostiche di timeout includono l'ultimo metodo di notifica
dell'app-server e, per gli elementi di risposta raw dell'assistente, il tipo dell'elemento, il ruolo,
l'id e un'anteprima limitata del testo dell'assistente.

## Rilevamento dei modelli

Per impostazione predefinita, il plugin Codex chiede all'app-server i modelli disponibili. La
disponibilità dei modelli appartiene all'app-server Codex, quindi l'elenco può cambiare quando OpenClaw
aggiorna la versione `@openai/codex` inclusa o quando un deployment punta
`appServer.command` a un binario Codex diverso. La disponibilità può anche essere
specifica dell'account. Usa `/codex models` su un Gateway in esecuzione per vedere il catalogo live
per quell'harness e quell'account.

Se il rilevamento non riesce o va in timeout, OpenClaw usa un catalogo di fallback incluso per:

- GPT-5.5
- GPT-5.4 mini
- GPT-5.2

L'harness incluso attuale è `@openai/codex` `0.130.0`. Una sonda `model/list`
contro quell'app-server incluso ha restituito:

| ID modello            | Predefinito | Nascosto | Modalità di input | Impegni di reasoning      |
| --------------------- | ----------- | -------- | ----------------- | ------------------------- |
| `gpt-5.5`             | Sì          | No       | testo, immagine   | low, medium, high, xhigh  |
| `gpt-5.4`             | No          | No       | testo, immagine   | low, medium, high, xhigh  |
| `gpt-5.4-mini`        | No          | No       | testo, immagine   | low, medium, high, xhigh  |
| `gpt-5.3-codex`       | No          | No       | testo, immagine   | low, medium, high, xhigh  |
| `gpt-5.3-codex-spark` | No          | No       | testo             | low, medium, high, xhigh  |
| `gpt-5.2`             | No          | No       | testo, immagine   | low, medium, high, xhigh  |

I modelli nascosti possono essere restituiti dal catalogo dell'app-server per flussi interni o
specializzati, ma non sono normali scelte del selettore modelli.

Configura il rilevamento sotto `plugins.entries.codex.config.discovery`:

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

Disabilita il rilevamento quando vuoi che l'avvio eviti di sondare Codex e usi solo il
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

## File di bootstrap del workspace

Codex gestisce `AGENTS.md` autonomamente tramite il rilevamento nativo dei documenti di progetto. OpenClaw
non scrive file sintetici di documenti di progetto Codex né dipende dai nomi file di fallback di Codex
per i file persona, perché i fallback di Codex si applicano solo quando
`AGENTS.md` manca.

Per la parità del workspace OpenClaw, l'harness Codex risolve gli altri file di bootstrap,
inclusi `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`,
`HEARTBEAT.md`, `BOOTSTRAP.md` e `MEMORY.md` quando presenti, e li inoltra
tramite le istruzioni per sviluppatori di Codex su `thread/start` e `thread/resume`.
Questo mantiene visibili il contesto persona e profilo del workspace sulla corsia nativa di Codex
che modella il comportamento, senza duplicare `AGENTS.md`.

## Override di ambiente

Gli override di ambiente restano disponibili per i test locali:

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
preferita per deployment ripetibili perché mantiene il comportamento del plugin nello
stesso file revisionato del resto della configurazione dell'harness Codex.

## Correlati

- [Harness Codex](/it/plugins/codex-harness)
- [Runtime dell'harness Codex](/it/plugins/codex-harness-runtime)
- [Plugin Codex nativi](/it/plugins/codex-native-plugins)
- [Codex Computer Use](/it/plugins/codex-computer-use)
- [Provider OpenAI](/it/providers/openai)
- [Riferimento di configurazione](/it/gateway/configuration-reference)
