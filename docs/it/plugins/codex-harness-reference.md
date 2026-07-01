---
read_when:
    - Ti serve ogni campo di configurazione dell'harness Codex
    - Stai modificando il trasporto app-server, l’autenticazione, la discovery o il comportamento dei timeout
    - Stai diagnosticando l'avvio dell'ambiente di esecuzione Codex, l'individuazione dei modelli o l'isolamento dell'ambiente
summary: Configurazione, autenticazione, rilevamento e riferimento dell’app-server per l’harness Codex
title: Riferimento dell'harness Codex
x-i18n:
    generated_at: "2026-07-01T08:10:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 02dd72f9d85d2ea5fa45533a402d640786f17bdbe2242b7c1b8cd99405561a25
    source_path: plugins/codex-harness-reference.md
    workflow: 16
---

Questo riferimento illustra la configurazione dettagliata del Plugin `codex`
incluso. Per la configurazione e le decisioni di instradamento, inizia da
[harness Codex](/it/plugins/codex-harness).

## Superficie di configurazione del Plugin

Tutte le impostazioni dell'harness Codex si trovano in `plugins.entries.codex.config`.

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

| Campo                      | Predefinito              | Significato                                                                                                                                       |
| -------------------------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `discovery`                | abilitato                | Impostazioni di rilevamento dei modelli per `model/list` dell'app-server Codex.                                                                   |
| `appServer`                | app-server stdio gestito | Impostazioni di trasporto, comando, autenticazione, approvazione, sandbox e timeout.                                                              |
| `codexDynamicToolsLoading` | `"searchable"`           | Usa `"direct"` per inserire gli strumenti dinamici di OpenClaw direttamente nel contesto iniziale degli strumenti Codex.                           |
| `codexDynamicToolsExclude` | `[]`                     | Nomi aggiuntivi degli strumenti dinamici di OpenClaw da omettere dai turni dell'app-server Codex.                                                  |
| `codexPlugins`             | disabilitato             | Supporto nativo di Codex a Plugin/app per plugin curati migrati installati da sorgente. Vedi [Plugin Codex nativi](/it/plugins/codex-native-plugins). |
| `computerUse`              | disabilitato             | Configurazione di Codex Computer Use. Vedi [Codex Computer Use](/it/plugins/codex-computer-use).                                                     |

## Trasporto app-server

Per impostazione predefinita, OpenClaw avvia il binario Codex gestito distribuito con il Plugin
incluso:

```bash
codex app-server --listen stdio://
```

Questo mantiene la versione dell'app-server legata al Plugin `codex` incluso invece che
a qualsiasi CLI Codex separata che risulti installata localmente. Imposta
`appServer.command` solo quando intendi eseguire deliberatamente un
eseguibile diverso.

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

| Campo                                         | Predefinito                                           | Significato                                                                                                                                                                                                                                                                                                                                                                                        |
| --------------------------------------------- | ----------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                                   | `"stdio"`                                             | `"stdio"` avvia Codex; `"websocket"` si connette a `url`.                                                                                                                                                                                                                                                                                                                                          |
| `command`                                     | binario Codex gestito                                 | Eseguibile per il trasporto stdio. Lascialo non impostato per usare il binario gestito.                                                                                                                                                                                                                                                                                                            |
| `args`                                        | `["app-server", "--listen", "stdio://"]`              | Argomenti per il trasporto stdio.                                                                                                                                                                                                                                                                                                                                                                  |
| `url`                                         | non impostato                                         | URL dell'app-server WebSocket.                                                                                                                                                                                                                                                                                                                                                                     |
| `authToken`                                   | non impostato                                         | Token Bearer per il trasporto WebSocket. Accetta una stringa letterale o SecretInput, ad esempio `${CODEX_APP_SERVER_TOKEN}`.                                                                                                                                                                                                                                                                      |
| `headers`                                     | `{}`                                                  | Header WebSocket aggiuntivi. I valori degli header accettano stringhe letterali o valori SecretInput, ad esempio `x-codex-client-session-token: "${CODEX_CLIENT_SESSION_TOKEN}"`.                                                                                                                                                                                                                  |
| `clearEnv`                                    | `[]`                                                  | Nomi di variabili d'ambiente aggiuntive rimossi dal processo app-server stdio avviato dopo che OpenClaw ha costruito il suo ambiente ereditato.                                                                                                                                                                                                                                                     |
| `remoteWorkspaceRoot`                         | non impostato                                         | Radice dell'area di lavoro app-server Codex remota. Quando è impostata, OpenClaw deduce la radice dell'area di lavoro locale dall'area di lavoro OpenClaw risolta, conserva il suffisso cwd corrente sotto questa radice remota e invia a Codex solo il cwd finale dell'app-server. Se il cwd è fuori dalla radice dell'area di lavoro OpenClaw risolta, OpenClaw fallisce in modo chiuso invece di inviare un percorso locale del gateway all'app-server remoto. |
| `requestTimeoutMs`                            | `60000`                                               | Timeout per le chiamate del piano di controllo dell'app-server.                                                                                                                                                                                                                                                                                                                                    |
| `turnCompletionIdleTimeoutMs`                 | `60000`                                               | Finestra di silenzio dopo che Codex accetta un turno o dopo una richiesta app-server con ambito di turno mentre OpenClaw attende `turn/completed`.                                                                                                                                                                                                                                                   |
| `postToolRawAssistantCompletionIdleTimeoutMs` | `300000`                                              | Protezione di inattività del completamento e di avanzamento usata dopo un passaggio di consegne a uno strumento, il completamento di uno strumento nativo, l'avanzamento grezzo post-strumento dell'assistente, il completamento grezzo del ragionamento o l'avanzamento del ragionamento mentre OpenClaw attende `turn/completed`. Usalo per carichi di lavoro affidabili o pesanti in cui la sintesi post-strumento può legittimamente rimanere silenziosa più a lungo del budget di rilascio finale dell'assistente. |
| `mode`                                        | `"yolo"` salvo requisiti Codex locali che non consentano YOLO | Preset per esecuzione YOLO o revisionata dal guardian.                                                                                                                                                                                                                                                                                                                                             |
| `approvalPolicy`                              | `"never"` o una policy di approvazione guardian consentita | Policy di approvazione nativa Codex inviata all'avvio del thread, alla ripresa e al turno.                                                                                                                                                                                                                                                                                                         |
| `sandbox`                                     | `"danger-full-access"` o una sandbox guardian consentita | Modalità sandbox nativa Codex inviata all'avvio e alla ripresa del thread. Le sandbox OpenClaw attive restringono i turni `danger-full-access` a Codex `workspace-write`; il flag di rete del turno segue l'egress della sandbox OpenClaw.                                                                                                                                                         |
| `approvalsReviewer`                           | `"user"` o un revisore guardian consentito            | Usa `"auto_review"` per consentire a Codex di revisionare le richieste di approvazione native quando consentito.                                                                                                                                                                                                                                                                                   |
| `defaultWorkspaceDir`                         | directory del processo corrente                       | Area di lavoro usata da `/codex bind` quando `--cwd` è omesso.                                                                                                                                                                                                                                                                                                                                     |
| `serviceTier`                                 | non impostato                                         | Livello di servizio app-server Codex facoltativo. `"priority"` abilita il routing in modalità rapida, `"flex"` richiede l'elaborazione flex e `null` cancella l'override. Il valore legacy `"fast"` è accettato come `"priority"`.                                                                                                                                                                  |
| `networkProxy`                                | disabilitato                                          | Abilita esplicitamente il networking del profilo di permessi Codex per i comandi app-server. OpenClaw definisce la configurazione `permissions.<profile>.network` selezionata e la seleziona con `default_permissions` invece di inviare `sandbox`.                                                                                                                                                 |
| `experimental.sandboxExecServer`              | `false`                                               | Opt-in di anteprima che registra un ambiente Codex supportato dalla sandbox OpenClaw con Codex app-server 0.132.0 o versione successiva, così l'esecuzione nativa Codex può essere eseguita dentro la sandbox OpenClaw attiva.                                                                                                                                                                       |

`appServer.networkProxy` è esplicito perché modifica il contratto della sandbox
Codex. Quando è abilitato, OpenClaw imposta anche `features.network_proxy.enabled` e
`default_permissions` nella configurazione del thread Codex, così il profilo di
permessi generato può avviare il networking gestito da Codex. Per impostazione
predefinita, OpenClaw genera un nome profilo `openclaw-network-<fingerprint>`
resistente alle collisioni dal corpo del profilo; usa `profileName` solo quando
è richiesto un nome locale stabile.

```js
export default {
  plugins: {
    entries: {
      codex: {
        config: {
          appServer: {
            sandbox: "workspace-write",
            networkProxy: {
              enabled: true,
              domains: {
                "api.openai.com": "allow",
                "blocked.example.com": "deny",
              },
              allowUpstreamProxy: true,
              proxyUrl: "http://127.0.0.1:3128",
            },
          },
        },
      },
    },
  },
};
```

Se il normale runtime app-server sarebbe `danger-full-access`, l'abilitazione di
`networkProxy` usa un accesso al filesystem in stile area di lavoro per il profilo
di permessi generato. L'applicazione della rete gestita da Codex è networking in sandbox,
quindi un profilo con accesso completo non proteggerebbe il traffico in uscita.

Il Plugin blocca gli handshake app-server più vecchi o senza versione. Codex app-server
deve riportare la versione stabile `0.125.0` o successiva.

OpenClaw considera remoti gli URL WebSocket app-server non loopback e richiede
un'autenticazione WebSocket con identità tramite `appServer.authToken` o un
header `Authorization`. `appServer.authToken` e ogni valore
`appServer.headers.*` possono essere un SecretInput; il runtime dei secrets
risolve SecretRefs e abbreviazioni env prima che OpenClaw costruisca le opzioni
di avvio dell'app-server, e i SecretRefs strutturati non risolti falliscono
prima che qualsiasi token o header venga inviato. Quando i Plugin Codex nativi
sono configurati, OpenClaw usa il piano di controllo dei Plugin dell'app-server
connesso per installare o aggiornare quei Plugin e poi aggiorna l'inventario
delle app in modo che le app possedute dai Plugin siano visibili al thread
Codex. `app/list` resta comunque la fonte autorevole per inventario e metadati,
ma la policy di OpenClaw decide se `thread/start` invia
`config.apps[appId].enabled = true` per un'app accessibile elencata anche se
Codex al momento la contrassegna come disabilitata. Gli app id sconosciuti o
mancanti restano fail-closed; questo percorso attiva soltanto i Plugin del
marketplace tramite `plugin/install` e aggiorna l'inventario. Collega OpenClaw
solo ad app-server remoti considerati attendibili per accettare installazioni
di Plugin gestite da OpenClaw e aggiornamenti dell'inventario delle app.

## Modalità di approvazione e sandbox

Le sessioni app-server stdio locali usano di default la modalità YOLO:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` e
`sandbox: "danger-full-access"`. Questa postura locale attendibile per
l'operatore consente ai turni OpenClaw non presidiati e agli heartbeat di
avanzare senza prompt di approvazione nativi a cui nessuno è presente per
rispondere.

Se il file dei requisiti di sistema locale di Codex non consente valori YOLO
impliciti per approvazione, revisore o sandbox, OpenClaw tratta invece il
default implicito come guardian e seleziona i permessi guardian consentiti.
Anche `tools.exec.mode: "auto"` forza approvazioni Codex con revisione guardian
e non conserva override legacy non sicuri come `approvalPolicy: "never"` o
`sandbox: "danger-full-access"`; imposta `tools.exec.mode: "full"` per una
postura intenzionale senza approvazioni. Le voci `[[remote_sandbox_config]]`
con corrispondenza dell'hostname nello stesso file dei requisiti vengono
rispettate per la decisione sul default della sandbox.

Imposta `appServer.mode: "guardian"` per approvazioni Codex con revisione
guardian:

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
valori sono consentiti. I singoli campi di policy sovrascrivono `mode`. Il
vecchio valore revisore `guardian_subagent` è ancora accettato come alias di
compatibilità, ma le nuove configurazioni dovrebbero usare `auto_review`.

Quando una sandbox OpenClaw è attiva, il processo app-server Codex locale gira
comunque sull'host Gateway. OpenClaw quindi disabilita per quel turno la Code
Mode nativa di Codex, i server MCP utente e l'esecuzione di Plugin supportati da
app, invece di trattare la sandbox lato host di Codex come equivalente al
backend sandbox di OpenClaw. L'accesso alla shell è esposto tramite strumenti
dinamici basati sulla sandbox OpenClaw, come `sandbox_exec` e `sandbox_process`,
quando i normali strumenti exec/process sono disponibili.

Su host Ubuntu/AppArmor, Codex bwrap può fallire in `workspace-write` prima
dell'avvio del comando shell quando esegui intenzionalmente `workspace-write`
Codex nativo senza sandboxing OpenClaw attivo. Se vedi
`bwrap: setting up uid map: Permission denied` o
`bwrap: loopback: Failed RTM_NEWADDR: Operation not permitted`, esegui
`openclaw doctor` e correggi la policy namespace dell'host segnalata per
l'utente del servizio OpenClaw, invece di concedere privilegi Docker container
più ampi. Preferisci un profilo AppArmor con ambito limitato per il processo di
servizio; il fallback `kernel.apparmor_restrict_unprivileged_userns=0` è valido
per tutto l'host e comporta compromessi di sicurezza.

## Esecuzione nativa in sandbox

Il default stabile è fail-closed: il sandboxing OpenClaw attivo disabilita le
superfici di esecuzione native di Codex che altrimenti girerebbero dall'host
app-server Codex. Usa `appServer.experimental.sandboxExecServer: true` solo
quando vuoi provare il supporto agli ambienti remoti di Codex con il backend
sandbox di OpenClaw. Questo percorso di anteprima richiede Codex app-server
0.132.0 o versione successiva.

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            experimental: {
              sandboxExecServer: true,
            },
          },
        },
      },
    },
  },
}
```

Quando il flag è attivo e la sessione OpenClaw corrente è in sandbox, OpenClaw
avvia un exec-server local loopback supportato dalla sandbox attiva, lo registra
con Codex app-server e avvia il thread e il turno Codex con quell'ambiente di
proprietà OpenClaw. Se l'app-server non può registrare l'ambiente, l'esecuzione
fallisce in modo chiuso invece di ricadere silenziosamente sull'esecuzione
host.

Questo percorso di anteprima è solo locale. Un app-server WebSocket remoto non
può raggiungere l'exec-server loopback a meno che non stia girando sullo stesso
host, quindi OpenClaw rifiuta quella combinazione.

## Autenticazione e isolamento dell'ambiente

L'autenticazione viene selezionata in questo ordine:

1. Un profilo di autenticazione OpenClaw Codex esplicito per l'agente.
2. L'account esistente dell'app-server nella home Codex di quell'agente.
3. Solo per avvii app-server stdio locali, `CODEX_API_KEY`, poi
   `OPENAI_API_KEY`, quando non è presente alcun account app-server e
   l'autenticazione OpenAI è ancora richiesta.

Quando OpenClaw rileva un profilo di autenticazione Codex in stile abbonamento
ChatGPT, rimuove `CODEX_API_KEY` e `OPENAI_API_KEY` dal processo figlio Codex
generato. Questo mantiene le chiavi API a livello Gateway disponibili per
embeddings o modelli OpenAI diretti senza far fatturare per errore i turni
app-server Codex nativi tramite l'API.

I profili espliciti con chiave API Codex e il fallback con chiave env stdio
locale usano il login app-server invece dell'env ereditato dal processo figlio.
Le connessioni app-server WebSocket non ricevono il fallback delle chiavi API
env del Gateway; usa un profilo di autenticazione esplicito o l'account proprio
dell'app-server remoto.

Gli avvii app-server stdio ereditano di default l'ambiente di processo di
OpenClaw. OpenClaw possiede il ponte dell'account app-server Codex e imposta
`CODEX_HOME` su una directory per agente nello stato OpenClaw di quell'agente.
Questo mantiene configurazione Codex, account, cache/dati dei Plugin e stato
dei thread confinati all'agente OpenClaw invece di farli trapelare dalla home
personale `~/.codex` dell'operatore.

OpenClaw non riscrive `HOME` per i normali avvii app-server locali. I
sottoprocessi eseguiti da Codex come `openclaw`, `gh`, `git`, CLI cloud e
comandi shell vedono la normale home del processo e possono trovare
configurazioni e token nella home utente. Codex può anche scoprire
`$HOME/.agents/skills` e `$HOME/.agents/plugins/marketplace.json`; quella
discovery `.agents` è intenzionalmente condivisa con la home dell'operatore ed è
separata dallo stato isolato `~/.codex`.

I Plugin OpenClaw e gli snapshot Skills OpenClaw continuano a passare tramite
il registro Plugin e il loader Skills propri di OpenClaw. Gli asset personali
Codex `~/.codex` no. Se hai Skills o Plugin utili della CLI Codex da una home
Codex che dovrebbero diventare parte di un agente OpenClaw, inventariali in modo
esplicito:

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

Se un deployment richiede ulteriore isolamento dell'ambiente, aggiungi quelle
variabili a `appServer.clearEnv`:

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

`appServer.clearEnv` influisce solo sul processo figlio app-server Codex
generato. OpenClaw rimuove `CODEX_HOME` e `HOME` da questo elenco durante la
normalizzazione dell'avvio locale: `CODEX_HOME` resta per agente e `HOME` resta
ereditato così i sottoprocessi possono usare il normale stato della home utente.

## Strumenti dinamici

Gli strumenti dinamici Codex usano di default il caricamento `searchable`.
OpenClaw non espone strumenti dinamici che duplicano operazioni workspace native
di Codex:

- `read`
- `write`
- `edit`
- `apply_patch`
- `exec`
- `process`
- `update_plan`

La maggior parte degli strumenti di integrazione OpenClaw rimanenti, come
messaggistica, media, cron, browser, nodi, gateway, `heartbeat_respond` e
`web_search`, è disponibile tramite la ricerca strumenti Codex nello namespace
`openclaw`. Questo mantiene più piccolo il contesto iniziale del modello.
`sessions_yield` e le risposte source solo con strumenti messaggio restano
diretti perché sono contratti di controllo del turno. `sessions_spawn` resta
searchable così `spawn_agent` nativo di Codex rimane la superficie primaria per
subagent Codex, mentre la delega esplicita OpenClaw o ACP resta disponibile
tramite lo namespace degli strumenti dinamici `openclaw`.

Imposta `codexDynamicToolsLoading: "direct"` solo quando ti connetti a un
app-server Codex personalizzato che non può cercare strumenti dinamici differiti
o quando esegui il debug del payload completo degli strumenti.

## Timeout

Le chiamate agli strumenti dinamici di proprietà OpenClaw sono limitate
indipendentemente da `appServer.requestTimeoutMs`. Ogni richiesta Codex
`item/tool/call` usa il primo timeout disponibile in questo ordine:

- Un argomento `timeoutMs` positivo per chiamata.
- Per `image_generate`, `agents.defaults.imageGenerationModel.timeoutMs`.
- Per `image_generate` senza timeout configurato, il default di generazione
  immagini di 120 secondi.
- Per lo strumento `image` di comprensione dei media,
  `tools.media.image.timeoutSeconds` convertito in millisecondi, oppure il
  default media di 60 secondi. Per la comprensione delle immagini, questo si
  applica alla richiesta stessa e non viene ridotto dal lavoro di preparazione
  precedente.
- Il default degli strumenti dinamici di 90 secondi.

Questo watchdog è il budget esterno dinamico `item/tool/call`. I timeout delle
richieste specifici del provider girano dentro quella chiamata e mantengono le
proprie semantiche di timeout. I budget degli strumenti dinamici sono limitati a
600000 ms. Al timeout, OpenClaw interrompe il signal dello strumento quando
supportato e restituisce a Codex una risposta di strumento dinamico fallita, in
modo che il turno possa continuare invece di lasciare la sessione in
`processing`.

Dopo che Codex accetta un turno, e dopo che OpenClaw risponde a una richiesta
app-server con ambito turno, l'harness si aspetta che Codex faccia progressi nel
turno corrente e alla fine concluda il turno nativo con `turn/completed`. Se
l'app-server resta silenzioso per `appServer.turnCompletionIdleTimeoutMs`,
OpenClaw tenta al meglio di interrompere il turno Codex, registra un timeout
diagnostico e libera la lane della sessione OpenClaw così i messaggi chat
successivi non restano in coda dietro un turno nativo obsoleto.

La maggior parte delle notifiche non terminali per lo stesso turno disattiva quel breve watchdog
perché Codex ha dimostrato che il turno è ancora attivo. I passaggi di consegna agli strumenti usano un budget di inattività
post-strumento più lungo: dopo che OpenClaw restituisce una risposta `item/tool/call`, dopo che
elementi di strumenti nativi come `commandExecution` vengono completati, dopo completamenti grezzi
`custom_tool_call_output` e dopo avanzamenti grezzi post-strumento dell'assistant,
completamenti grezzi di ragionamento o avanzamenti di ragionamento. La guardia usa
`appServer.postToolRawAssistantCompletionIdleTimeoutMs` quando configurato e
altrimenti il valore predefinito è cinque minuti. Lo stesso budget post-strumento estende anche il
watchdog di avanzamento per la finestra di sintesi silenziosa prima che Codex emetta il successivo
evento del turno corrente. I completamenti di ragionamento, i completamenti
`agentMessage` di commento e gli avanzamenti grezzi pre-strumento di ragionamento o dell'assistant possono
essere seguiti da una risposta finale automatica, quindi usano la guardia di risposta
post-avanzamento invece di rilasciare immediatamente la corsia della sessione. Solo gli elementi
`agentMessage` finali/non di commento completati e i completamenti grezzi pre-strumento dell'assistant
attivano il rilascio dell'output dell'assistant: se Codex poi rimane silenzioso senza
`turn/completed`, OpenClaw interrompe con il massimo impegno il turno nativo e rilascia
la corsia della sessione. Gli errori replay-safe del server app stdio, inclusi
i timeout di inattività del completamento del turno senza prove di assistant, strumento, elemento attivo o
effetti collaterali, vengono riprovati una volta su un nuovo tentativo del server app. I timeout non sicuri
ritirano comunque il client del server app bloccato e rilasciano la corsia della sessione
OpenClaw. Inoltre cancellano il binding obsoleto del thread nativo invece di essere
riprodotti automaticamente. I timeout di osservazione del completamento mostrano testo di timeout specifico di Codex:
i casi replay-safe indicano che la risposta potrebbe essere incompleta, mentre i casi non sicuri
dicono all'utente di verificare lo stato corrente prima di riprovare. La diagnostica pubblica dei timeout
include campi strutturali come l'ultimo metodo di notifica del server app,
l'id/tipo/ruolo dell'elemento di risposta grezza dell'assistant, i conteggi di richieste/elementi attivi e lo stato
armato dell'osservatore. Quando l'ultima notifica è un elemento di risposta grezza dell'assistant, include
anche un'anteprima limitata del testo dell'assistant. Non include prompt grezzi né
contenuto degli strumenti.

## Rilevamento dei modelli

Per impostazione predefinita, il Plugin Codex chiede al server app i modelli disponibili. La
disponibilità dei modelli è gestita dal server app Codex, quindi l'elenco può cambiare quando OpenClaw
aggiorna la versione `@openai/codex` inclusa o quando una distribuzione indirizza
`appServer.command` a un binario Codex diverso. La disponibilità può anche essere
specifica dell'account. Usa `/codex models` su un Gateway in esecuzione per vedere il catalogo live
per quell'harness e quell'account.

Se il rilevamento fallisce o scade, OpenClaw usa un catalogo di fallback incluso per:

- GPT-5.5
- GPT-5.4 mini

L'harness incluso corrente è `@openai/codex` `0.142.4`. Una sonda `model/list`
contro quel server app incluso in uno workspace con GPT-5.6 abilitato ha restituito queste
righe pubbliche del selettore:

| Id modello            | Modalità di input | Sforzi di ragionamento                 |
| --------------------- | ----------------- | -------------------------------------- |
| `gpt-5.6-sol`         | testo, immagine   | low, medium, high, xhigh, max, ultra   |
| `gpt-5.6-terra`       | testo, immagine   | low, medium, high, xhigh, max, ultra   |
| `gpt-5.6-luna`        | testo, immagine   | low, medium, high, xhigh, max          |
| `gpt-5.5`             | testo, immagine   | low, medium, high, xhigh               |
| `gpt-5.4`             | testo, immagine   | low, medium, high, xhigh               |
| `gpt-5.4-mini`        | testo, immagine   | low, medium, high, xhigh               |
| `gpt-5.4-pro`         | testo, immagine   | medium, high, xhigh                    |
| `gpt-5.3-codex-spark` | testo             | low, medium, high, xhigh               |

L'accesso a GPT-5.6 è specifico dell'account durante l'anteprima limitata. `max` è uno
sforzo di ragionamento del modello. `ultra` è metadato separato di orchestrazione multi-agent Codex,
non uno sforzo di ragionamento OpenAI standard.

I modelli nascosti possono essere restituiti dal catalogo del server app per flussi interni o
specializzati, ma non sono normali scelte del selettore di modelli.

Configura il rilevamento in `plugins.entries.codex.config.discovery`:

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

Disattiva il rilevamento quando vuoi che l'avvio eviti di sondare Codex e usi solo il
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

## File di bootstrap dello workspace

Codex gestisce `AGENTS.md` autonomamente tramite il rilevamento nativo dei documenti di progetto. OpenClaw
non scrive file sintetici di documenti di progetto Codex né dipende dai nomi file di fallback Codex
per i file persona, perché i fallback Codex si applicano solo quando
`AGENTS.md` manca.

Per la parità dello workspace OpenClaw, l'harness Codex risolve gli altri file di bootstrap.
`SOUL.md`, `IDENTITY.md`, `TOOLS.md` e `USER.md` vengono inoltrati come
istruzioni sviluppatore OpenClaw Codex perché definiscono l'agente attivo,
la guida disponibile dello workspace e il profilo utente. L'elenco compatto delle Skills OpenClaw
viene inoltrato come istruzioni sviluppatore di collaborazione con ambito al turno.
Il contenuto di `HEARTBEAT.md` non viene iniettato; i turni Heartbeat ricevono un puntatore in modalità collaborazione
per leggere il file quando esiste e non è vuoto. Il contenuto di `MEMORY.md`
dallo workspace agente configurato non viene incollato nell'input del turno nativo Codex
quando gli strumenti di memoria sono disponibili per quello workspace; quando esiste, l'harness
aggiunge un piccolo puntatore alla memoria dello workspace alle istruzioni sviluppatore di collaborazione
con ambito al turno e Codex dovrebbe usare `memory_search` o `memory_get` quando la memoria
duratura è rilevante. Se gli strumenti sono disabilitati, la ricerca in memoria non è disponibile o lo
workspace attivo differisce dallo workspace della memoria dell'agente, `MEMORY.md` usa il
normale percorso limitato del contesto del turno.
`BOOTSTRAP.md`, quando presente, viene inoltrato come contesto di riferimento dell'input del turno OpenClaw.

## Override di ambiente

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
preferita per distribuzioni ripetibili perché mantiene il comportamento del Plugin nello
stesso file revisionato del resto della configurazione dell'harness Codex.

## Correlati

- [Harness Codex](/it/plugins/codex-harness)
- [Runtime dell'harness Codex](/it/plugins/codex-harness-runtime)
- [Plugin Codex nativi](/it/plugins/codex-native-plugins)
- [Codex Computer Use](/it/plugins/codex-computer-use)
- [Provider OpenAI](/it/providers/openai)
- [Riferimento di configurazione](/it/gateway/configuration-reference)
