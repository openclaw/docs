---
read_when:
    - Ti serve ogni campo di configurazione dell'ambiente di esecuzione Codex
    - Stai modificando il comportamento del trasporto, dell'autenticazione, del rilevamento o del timeout di app-server
    - Stai eseguendo il debug dell'avvio dell'harness Codex, del rilevamento dei modelli o dell'isolamento dell'ambiente
summary: Riferimento per configurazione, autenticazione, discovery e server dell'app per l'harness Codex
title: Riferimento dell'harness Codex
x-i18n:
    generated_at: "2026-07-04T10:44:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 43c905586346c8d7c255b58b706eb82543fd1ca05588e459a257e8f9f4cf36d4
    source_path: plugins/codex-harness-reference.md
    workflow: 16
---

Questo riferimento copre la configurazione dettagliata per il Plugin `codex`
incluso. Per la configurazione iniziale e le decisioni di instradamento, inizia da
[Harness Codex](/it/plugins/codex-harness).

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

| Campo                      | Predefinito              | Significato                                                                                                                              |
| -------------------------- | ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `discovery`                | abilitato                | Impostazioni di rilevamento dei modelli per `model/list` dell'app-server Codex.                                                          |
| `appServer`                | app-server stdio gestito | Impostazioni di trasporto, comando, autenticazione, approvazione, sandbox e timeout.                                                     |
| `codexDynamicToolsLoading` | `"searchable"`           | Usa `"direct"` per inserire gli strumenti dinamici di OpenClaw direttamente nel contesto iniziale degli strumenti Codex.                 |
| `codexDynamicToolsExclude` | `[]`                     | Nomi aggiuntivi degli strumenti dinamici di OpenClaw da omettere dai turni dell'app-server Codex.                                        |
| `codexPlugins`             | disabilitato             | Supporto nativo a plugin/app Codex per plugin curati migrati installati da sorgente. Vedi [Plugin Codex nativi](/it/plugins/codex-native-plugins). |
| `computerUse`              | disabilitato             | Configurazione di Codex Computer Use. Vedi [Codex Computer Use](/it/plugins/codex-computer-use).                                           |

## Trasporto app-server

Per impostazione predefinita, OpenClaw avvia il binario Codex gestito fornito con il Plugin
incluso:

```bash
codex app-server --listen stdio://
```

Questo mantiene la versione dell'app-server legata al Plugin `codex` incluso invece che
a qualunque CLI Codex separata risulti installata localmente. Imposta
`appServer.command` solo quando vuoi intenzionalmente eseguire un
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

| Campo                                         | Predefinito                                           | Significato                                                                                                                                                                                                                                                                                                                                                                                    |
| --------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                                   | `"stdio"`                                              | `"stdio"` avvia Codex; `"websocket"` si connette a `url`.                                                                                                                                                                                                                                                                                                                                      |
| `homeScope`                                   | `"agent"`                                              | `"agent"` isola lo stato di Codex per ogni agente OpenClaw. `"user"` condivide il `$CODEX_HOME` nativo o `~/.codex`, usa l'autenticazione nativa e abilita la gestione dei thread riservata all'owner. L'ambito utente richiede stdio.                                                                                                                                                       |
| `command`                                     | binario Codex gestito                                 | Eseguibile per il trasporto stdio. Lascia non impostato per usare il binario gestito.                                                                                                                                                                                                                                                                                                          |
| `args`                                        | `["app-server", "--listen", "stdio://"]`               | Argomenti per il trasporto stdio.                                                                                                                                                                                                                                                                                                                                                              |
| `url`                                         | non impostato                                         | URL WebSocket dell'app-server.                                                                                                                                                                                                                                                                                                                                                                 |
| `authToken`                                   | non impostato                                         | Token Bearer per il trasporto WebSocket. Accetta una stringa letterale o SecretInput come `${CODEX_APP_SERVER_TOKEN}`.                                                                                                                                                                                                                                                                        |
| `headers`                                     | `{}`                                                   | Header WebSocket aggiuntivi. I valori degli header accettano stringhe letterali o valori SecretInput, per esempio `x-codex-client-session-token: "${CODEX_CLIENT_SESSION_TOKEN}"`.                                                                                                                                                                                                             |
| `clearEnv`                                    | `[]`                                                   | Nomi di variabili d'ambiente aggiuntivi rimossi dal processo app-server stdio avviato dopo che OpenClaw ha costruito il suo ambiente ereditato.                                                                                                                                                                                                                                                |
| `remoteWorkspaceRoot`                         | non impostato                                         | Radice remota del workspace dell'app-server Codex. Quando impostata, OpenClaw deduce la radice del workspace locale dal workspace OpenClaw risolto, conserva il suffisso cwd corrente sotto questa radice remota e invia a Codex solo il cwd finale dell'app-server. Se il cwd è esterno alla radice del workspace OpenClaw risolta, OpenClaw fallisce in modo chiuso invece di inviare un percorso locale del gateway all'app-server remoto. |
| `requestTimeoutMs`                            | `60000`                                                | Timeout per le chiamate al piano di controllo dell'app-server.                                                                                                                                                                                                                                                                                                                                 |
| `turnCompletionIdleTimeoutMs`                 | `60000`                                                | Finestra di inattività dopo che Codex accetta un turno o dopo una richiesta app-server con ambito di turno mentre OpenClaw attende `turn/completed`.                                                                                                                                                                                                                                           |
| `postToolRawAssistantCompletionIdleTimeoutMs` | `300000`                                               | Guardia di inattività del completamento e di avanzamento usata dopo un passaggio a uno strumento, il completamento di uno strumento nativo, avanzamento raw assistant post-strumento, completamento del ragionamento raw o avanzamento del ragionamento mentre OpenClaw attende `turn/completed`. Usala per carichi di lavoro attendibili o pesanti in cui la sintesi post-strumento può legittimamente restare silenziosa più a lungo del budget finale di rilascio dell'assistente. |
| `mode`                                        | `"yolo"` a meno che i requisiti locali di Codex non vietino YOLO | Preset per esecuzione YOLO o revisionata dal guardian.                                                                                                                                                                                                                                                                                                                                         |
| `approvalPolicy`                              | `"never"` o una policy di approvazione guardian consentita | Policy di approvazione nativa di Codex inviata all'avvio del thread, alla ripresa e al turno.                                                                                                                                                                                                                                                                                                  |
| `sandbox`                                     | `"danger-full-access"` o una sandbox guardian consentita | Modalità sandbox nativa di Codex inviata all'avvio e alla ripresa del thread. Le sandbox OpenClaw attive restringono i turni `danger-full-access` a Codex `workspace-write`; il flag di rete del turno segue l'egress della sandbox OpenClaw.                                                                                                                                                  |
| `approvalsReviewer`                           | `"user"` o un reviewer guardian consentito             | Usa `"auto_review"` per consentire a Codex di revisionare i prompt di approvazione nativi quando consentito.                                                                                                                                                                                                                                                                                   |
| `defaultWorkspaceDir`                         | directory del processo corrente                        | Workspace usato da `/codex bind` quando `--cwd` è omesso.                                                                                                                                                                                                                                                                                                                                      |
| `serviceTier`                                 | non impostato                                         | Tier di servizio opzionale dell'app-server Codex. `"priority"` abilita il routing fast-mode, `"flex"` richiede l'elaborazione flex e `null` cancella l'override. Il valore legacy `"fast"` è accettato come `"priority"`.                                                                                                                                                                      |
| `networkProxy`                                | disabilitato                                          | Abilita in modo esplicito il networking del profilo di permessi Codex per i comandi dell'app-server. OpenClaw definisce la configurazione `permissions.<profile>.network` selezionata e la seleziona con `default_permissions` invece di inviare `sandbox`.                                                                                                                                    |
| `experimental.sandboxExecServer`              | `false`                                                | Opt-in di anteprima che registra un ambiente Codex supportato dalla sandbox OpenClaw con Codex app-server 0.132.0 o versioni successive, così l'esecuzione nativa di Codex può essere eseguita dentro la sandbox OpenClaw attiva.                                                                                                                                                              |

`appServer.networkProxy` è esplicito perché modifica il contratto della sandbox
Codex. Quando è abilitato, OpenClaw imposta anche `features.network_proxy.enabled` e
`default_permissions` nella configurazione del thread Codex, così il profilo di
permessi generato può avviare il networking gestito da Codex. Per impostazione
predefinita, OpenClaw genera un nome di profilo
`openclaw-network-<fingerprint>` resistente alle collisioni dal corpo del
profilo; usa `profileName` solo quando è richiesto un nome locale stabile.

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

Se il normale runtime app-server sarebbe `danger-full-access`, abilitare
`networkProxy` usa l'accesso al filesystem in stile workspace per il profilo
di autorizzazioni generato. L'applicazione gestita da Codex delle regole di rete
è networking sandboxed, quindi un profilo ad accesso completo non proteggerebbe
il traffico in uscita.

Il plugin blocca handshake app-server più vecchi o senza versione. Codex app-server
deve riportare la versione stabile `0.125.0` o successiva.

OpenClaw tratta gli URL app-server WebSocket non-loopback come remoti e richiede
autenticazione WebSocket con identità tramite `appServer.authToken` o un header
`Authorization`. `appServer.authToken` e ogni valore `appServer.headers.*`
possono essere un SecretInput; il runtime dei segreti risolve SecretRefs e le
scorciatoie env prima che OpenClaw costruisca le opzioni di avvio app-server, e
le SecretRefs strutturate non risolte falliscono prima che venga inviato qualsiasi
token o header. Quando i plugin Codex nativi sono configurati, OpenClaw usa il
piano di controllo dei plugin dell'app-server connesso per installare o aggiornare
quei plugin e poi aggiorna l'inventario delle app in modo che le app di proprietà
dei plugin siano visibili al thread Codex. `app/list` resta comunque la fonte
autorevole di inventario e metadati, ma la policy di OpenClaw decide se
`thread/start` invia `config.apps[appId].enabled = true` per un'app elencata e
accessibile anche se Codex attualmente la contrassegna come disabilitata. Gli id
app sconosciuti o mancanti restano fail-closed; questo percorso attiva solo i
plugin del marketplace tramite `plugin/install` e aggiorna l'inventario. Connetti
OpenClaw solo ad app-server remoti considerati affidabili per accettare installazioni
di plugin gestite da OpenClaw e aggiornamenti dell'inventario app.

## Modalità di approvazione e sandbox

Le sessioni app-server stdio locali usano per impostazione predefinita la modalità YOLO:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` e
`sandbox: "danger-full-access"`. Questa postura da operatore locale attendibile
consente ai turni OpenClaw non presidiati e agli heartbeat di avanzare senza
prompt di approvazione nativi a cui nessuno è presente per rispondere.

Se il file dei requisiti di sistema locali di Codex non consente valori YOLO
impliciti per approvazione, revisore o sandbox, OpenClaw tratta invece il valore
predefinito implicito come guardian e seleziona autorizzazioni guardian consentite.
Anche `tools.exec.mode: "auto"` forza approvazioni Codex revisionate da guardian
e non conserva override legacy non sicuri `approvalPolicy: "never"` o
`sandbox: "danger-full-access"`; imposta `tools.exec.mode: "full"` per una
postura intenzionale senza approvazioni. Le voci
`[[remote_sandbox_config]]` con corrispondenza dell'hostname nello stesso file
dei requisiti sono rispettate per la decisione predefinita della sandbox.

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
valori sono consentiti. I singoli campi di policy sovrascrivono `mode`. Il valore
revisore più vecchio `guardian_subagent` è ancora accettato come alias di
compatibilità, ma le nuove configurazioni dovrebbero usare `auto_review`.

Quando una sandbox OpenClaw è attiva, il processo app-server Codex locale viene
comunque eseguito sull'host Gateway. OpenClaw quindi disabilita Codex Code Mode
nativo, i server MCP utente e l'esecuzione di plugin basata su app per quel turno,
invece di trattare il sandboxing lato host Codex come equivalente al backend
sandbox OpenClaw. L'accesso shell è esposto tramite strumenti dinamici supportati
dalla sandbox OpenClaw, come `sandbox_exec` e `sandbox_process`, quando i normali
strumenti exec/process sono disponibili.

Su host Ubuntu/AppArmor, Codex bwrap può fallire in `workspace-write` prima
dell'avvio del comando shell quando esegui intenzionalmente il `workspace-write`
Codex nativo senza sandboxing OpenClaw attivo. Se vedi
`bwrap: setting up uid map: Permission denied` o
`bwrap: loopback: Failed RTM_NEWADDR: Operation not permitted`, esegui
`openclaw doctor` e correggi la policy dello spazio dei nomi host segnalata per
l'utente del servizio OpenClaw invece di concedere privilegi più ampi al container
Docker. Preferisci un profilo AppArmor con ambito limitato per il processo del
servizio; il fallback `kernel.apparmor_restrict_unprivileged_userns=0` è esteso
a tutto l'host e comporta compromessi di sicurezza.

## Esecuzione nativa in sandbox

Il valore predefinito stabile è fail-closed: il sandboxing OpenClaw attivo
disabilita le superfici di esecuzione Codex native che altrimenti verrebbero
eseguite dall'host app-server Codex. Usa `appServer.experimental.sandboxExecServer: true`
solo quando vuoi provare il supporto degli ambienti remoti di Codex con il
backend sandbox di OpenClaw. Questo percorso in anteprima richiede Codex app-server
0.132.0 o successivo.

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
proprietà di OpenClaw. Se l'app-server non riesce a registrare l'ambiente,
l'esecuzione fallisce in modo fail-closed invece di ripiegare silenziosamente
sull'esecuzione host.

Questo percorso in anteprima è solo locale. Un app-server WebSocket remoto non
può raggiungere l'exec-server loopback a meno che non sia in esecuzione sullo
stesso host, quindi OpenClaw rifiuta quella combinazione.

## Isolamento di autenticazione e ambiente

Nella home predefinita per agente, l'autenticazione viene selezionata in questo ordine:

1. Un profilo di autenticazione OpenClaw Codex esplicito per l'agente.
2. L'account esistente dell'app-server nella home Codex di quell'agente.
3. Solo per avvii app-server stdio locali, `CODEX_API_KEY`, poi
   `OPENAI_API_KEY`, quando non è presente alcun account app-server e
   l'autenticazione OpenAI è ancora richiesta.

Quando OpenClaw rileva un profilo di autenticazione Codex in stile abbonamento
ChatGPT, rimuove `CODEX_API_KEY` e `OPENAI_API_KEY` dal processo figlio Codex
generato. Questo mantiene le chiavi API a livello Gateway disponibili per
embedding o modelli OpenAI diretti senza far fatturare per errore i turni
app-server Codex nativi tramite l'API.

I profili Codex API-key espliciti e il fallback locale con chiavi env stdio usano
il login app-server invece dell'env ereditato dal processo figlio. Le connessioni
app-server WebSocket non ricevono fallback delle chiavi API env del Gateway; usa
un profilo di autenticazione esplicito o l'account proprio dell'app-server remoto.

Gli avvii app-server stdio ereditano per impostazione predefinita l'ambiente di
processo di OpenClaw. OpenClaw possiede il bridge degli account app-server Codex
e imposta `CODEX_HOME` su una directory per agente sotto lo stato OpenClaw di
quell'agente. Questo mantiene configurazione Codex, account, cache/dati dei
plugin e stato dei thread limitati all'agente OpenClaw invece di farli trapelare
dalla home personale `~/.codex` dell'operatore.

Imposta `appServer.homeScope: "user"` per condividere lo stato Codex nativo con
Codex Desktop e la CLI. Questa modalità solo local-stdio usa `$CODEX_HOME` quando
impostato e altrimenti `~/.codex`, inclusi autenticazione nativa, configurazione,
plugin e thread. OpenClaw salta il proprio bridge dei profili di autenticazione
per l'app-server. I turni verificati del proprietario possono usare `codex_threads`
per elencare, cercare, leggere, fare fork, rinominare, archiviare e ripristinare
quei thread. Fai fork di un thread prima di continuarlo in OpenClaw; processi
Codex indipendenti non coordinano writer concorrenti per lo stesso thread.

OpenClaw non riscrive `HOME` per i normali avvii app-server locali. I sottoprocessi
eseguiti da Codex, come `openclaw`, `gh`, `git`, CLI cloud e comandi shell,
vedono la normale home di processo e possono trovare configurazioni e token
nella home utente. Codex può anche scoprire `$HOME/.agents/skills` e
`$HOME/.agents/plugins/marketplace.json`; questa scoperta `.agents` è condivisa
intenzionalmente con la home dell'operatore ed è separata dallo stato isolato
`~/.codex`.

Nell'ambito agente predefinito, i plugin OpenClaw e gli snapshot delle skill
OpenClaw continuano a passare attraverso il registro plugin e il loader di skill
propri di OpenClaw; gli asset personali Codex `~/.codex` no. Se hai Skills CLI
Codex o plugin utili da una home Codex che dovrebbero diventare parte di un
agente OpenClaw isolato, fanne l'inventario esplicitamente:

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

Se una distribuzione richiede isolamento aggiuntivo dell'ambiente, aggiungi tali
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

`appServer.clearEnv` influisce solo sul processo figlio app-server Codex generato.
OpenClaw rimuove `CODEX_HOME` e `HOME` da questo elenco durante la normalizzazione
dell'avvio locale: `CODEX_HOME` resta puntato all'ambito agente o utente selezionato,
e `HOME` resta ereditato così i sottoprocessi possono usare il normale stato
della home utente.

## Strumenti dinamici

Gli strumenti dinamici Codex usano per impostazione predefinita il caricamento
`searchable`. OpenClaw non espone strumenti dinamici che duplicano operazioni
workspace native di Codex:

- `read`
- `write`
- `edit`
- `apply_patch`
- `exec`
- `process`
- `update_plan`

La maggior parte dei restanti strumenti di integrazione OpenClaw, come messaggistica,
media, cron, browser, nodes, gateway, `heartbeat_respond` e `web_search`, sono
disponibili tramite la ricerca strumenti Codex sotto il namespace `openclaw`.
Questo mantiene più piccolo il contesto iniziale del modello. `sessions_yield`
e le risposte sorgente solo da strumenti di messaggistica restano dirette perché
sono contratti di controllo del turno. `sessions_spawn` resta searchable così
lo `spawn_agent` nativo di Codex resta la superficie primaria di subagent Codex,
mentre la delega esplicita OpenClaw o ACP resta disponibile tramite il namespace
degli strumenti dinamici `openclaw`.

Imposta `codexDynamicToolsLoading: "direct"` solo quando ti connetti a un app-server
Codex personalizzato che non può cercare strumenti dinamici differiti o quando
esegui il debug del payload completo degli strumenti.

## Timeout

Le chiamate a strumenti dinamici di proprietà di OpenClaw sono limitate
indipendentemente da `appServer.requestTimeoutMs`. Ogni richiesta Codex
`item/tool/call` usa il primo timeout disponibile in questo ordine:

- Un argomento per chiamata `timeoutMs` positivo.
- Per `image_generate`, `agents.defaults.imageGenerationModel.timeoutMs`.
- Per `image_generate` senza timeout configurato, il valore predefinito di
  120 secondi per la generazione di immagini.
- Per lo strumento `image` di comprensione media, `tools.media.image.timeoutSeconds`
  convertito in millisecondi, oppure il valore predefinito media di 60 secondi.
  Per la comprensione delle immagini, questo si applica alla richiesta stessa e
  non viene ridotto dal lavoro di preparazione precedente.
- Il valore predefinito di 90 secondi per gli strumenti dinamici.

Questo watchdog è il budget esterno dinamico di `item/tool/call`. I timeout di
richiesta specifici del provider vengono eseguiti all'interno di quella chiamata
e mantengono la propria semantica di timeout. I budget degli strumenti dinamici
sono limitati a 600000 ms. Al timeout, OpenClaw interrompe il segnale dello
strumento dove supportato e restituisce a Codex una risposta di strumento dinamico
fallita, così il turno può continuare invece di lasciare la sessione in `processing`.

Dopo che Codex accetta un turno, e dopo che OpenClaw risponde a una richiesta
app-server con ambito di turno, l'harness si aspetta che Codex faccia progressi
nel turno corrente e alla fine termini il turno nativo con `turn/completed`. Se
l'app-server resta silenzioso per `appServer.turnCompletionIdleTimeoutMs`,
OpenClaw prova best-effort a interrompere il turno Codex, registra un timeout
diagnostico e rilascia la lane della sessione OpenClaw così i messaggi chat
successivi non restano in coda dietro un turno nativo obsoleto.

La maggior parte delle notifiche non terminali per lo stesso turn disattiva quel breve watchdog
perché Codex ha dimostrato che il turn è ancora attivo. I passaggi di consegna agli strumenti usano un budget di inattività post-strumento più lungo: dopo che OpenClaw restituisce una risposta `item/tool/call`, dopo il completamento di elementi strumento nativi come `commandExecution`, dopo i completamenti raw
`custom_tool_call_output` e dopo il progresso raw post-strumento dell'assistente,
i completamenti raw di ragionamento o il progresso di ragionamento. La guardia usa
`appServer.postToolRawAssistantCompletionIdleTimeoutMs` quando configurato e,
altrimenti, usa cinque minuti come valore predefinito. Lo stesso budget post-strumento estende anche il
watchdog di progresso per la finestra di sintesi silenziosa prima che Codex emetta il successivo
evento del turn corrente. I completamenti di ragionamento, i completamenti
`agentMessage` di commento e il progresso raw di ragionamento o dell'assistente pre-strumento possono
essere seguiti da una risposta finale automatica, quindi usano la guardia di risposta post-progresso
invece di rilasciare immediatamente la corsia di sessione. Solo gli elementi
`agentMessage` finali/non di commento completati e i completamenti raw dell'assistente pre-strumento
armano il rilascio dell'output dell'assistente: se Codex poi rimane silenzioso senza
`turn/completed`, OpenClaw interrompe best-effort il turn nativo e rilascia
la corsia di sessione. Gli errori stdio del server app sicuri per il replay, inclusi
i timeout di inattività del completamento del turn senza evidenza di assistente, strumento, elemento attivo o
effetti collaterali, vengono ritentati una volta su un nuovo tentativo del server app. I timeout non sicuri
ritirano comunque il client del server app bloccato e rilasciano la corsia di sessione
OpenClaw. Inoltre cancellano il binding obsoleto del thread nativo invece di essere
rieseguiti automaticamente. I timeout del monitoraggio del completamento mostrano testo di timeout specifico di Codex:
i casi sicuri per il replay dicono che la risposta potrebbe essere incompleta, mentre i casi non sicuri
dicono all'utente di verificare lo stato corrente prima di riprovare. La diagnostica pubblica dei timeout
include campi strutturali come l'ultimo metodo di notifica del server app,
l'id/tipo/ruolo dell'elemento risposta raw dell'assistente, i conteggi di richieste/elementi attivi e lo stato
del monitoraggio armato. Quando l'ultima notifica è un elemento risposta raw dell'assistente,
include anche un'anteprima limitata del testo dell'assistente. Non include prompt raw né
contenuti degli strumenti.

## Rilevamento dei modelli

Per impostazione predefinita, il plugin Codex chiede al server app i modelli disponibili. La
disponibilità dei modelli è di proprietà del server app Codex, quindi l'elenco può cambiare quando OpenClaw
aggiorna la versione bundled di `@openai/codex` o quando una distribuzione punta
`appServer.command` a un binario Codex diverso. La disponibilità può anche essere
legata all'account. Usa `/codex models` su un gateway in esecuzione per vedere il catalogo live
per quell'harness e account.

Se il rilevamento fallisce o va in timeout, OpenClaw usa un catalogo fallback bundled per:

- GPT-5.5
- GPT-5.4 mini

L'harness bundled corrente è `@openai/codex` `0.142.4`. Una sonda `model/list`
contro quel server app bundled in un workspace con GPT-5.6 abilitato ha restituito queste
righe pubbliche del selettore:

| ID modello            | Modalità di input | Effort di ragionamento                |
| --------------------- | ----------------- | ------------------------------------- |
| `gpt-5.6-sol`         | testo, immagine   | low, medium, high, xhigh, max, ultra  |
| `gpt-5.6-terra`       | testo, immagine   | low, medium, high, xhigh, max, ultra  |
| `gpt-5.6-luna`        | testo, immagine   | low, medium, high, xhigh, max         |
| `gpt-5.5`             | testo, immagine   | low, medium, high, xhigh              |
| `gpt-5.4`             | testo, immagine   | low, medium, high, xhigh              |
| `gpt-5.4-mini`        | testo, immagine   | low, medium, high, xhigh              |
| `gpt-5.4-pro`         | testo, immagine   | medium, high, xhigh                   |
| `gpt-5.3-codex-spark` | testo             | low, medium, high, xhigh              |

L'accesso a GPT-5.6 è legato all'account durante l'anteprima limitata. `max` è un effort di
ragionamento del modello. `ultra` è metadato separato di orchestrazione multi-agente Codex,
non un effort di ragionamento OpenAI standard.

I modelli nascosti possono essere restituiti dal catalogo del server app per flussi interni o
specializzati, ma non sono scelte normali del selettore modelli.

Regola il rilevamento in `plugins.entries.codex.config.discovery`:

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

## File di bootstrap del workspace

Codex gestisce autonomamente `AGENTS.md` tramite il rilevamento nativo della documentazione di progetto. OpenClaw
non scrive file sintetici di documentazione progetto Codex né dipende dai nomi file fallback di Codex
per i file persona, perché i fallback di Codex si applicano solo quando
`AGENTS.md` manca.

Per la parità del workspace OpenClaw, l'harness Codex risolve gli altri file di bootstrap.
`SOUL.md`, `IDENTITY.md`, `TOOLS.md` e `USER.md` vengono inoltrati come
istruzioni sviluppatore OpenClaw Codex perché definiscono l'agente attivo,
le linee guida disponibili del workspace e il profilo utente. L'elenco compatto delle Skills OpenClaw
viene inoltrato come istruzioni sviluppatore di collaborazione con ambito sul turn.
Il contenuto di `HEARTBEAT.md` non viene iniettato; i turn Heartbeat ricevono un puntatore in modalità collaborazione
per leggere il file quando esiste e non è vuoto. Il contenuto di `MEMORY.md`
dal workspace agente configurato non viene incollato nell'input del turn nativo Codex
quando gli strumenti di memoria sono disponibili per quel workspace; quando esiste, l'harness
aggiunge un piccolo puntatore alla memoria del workspace alle istruzioni sviluppatore di collaborazione
con ambito sul turn e Codex dovrebbe usare `memory_search` o `memory_get` quando la memoria
duratura è rilevante. Se gli strumenti sono disabilitati, la ricerca in memoria non è disponibile o il
workspace attivo differisce dal workspace di memoria dell'agente, `MEMORY.md` usa il
normale percorso limitato del contesto del turn.
`BOOTSTRAP.md`, quando presente, viene inoltrato come contesto di riferimento dell'input del turn OpenClaw.

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
preferibile per distribuzioni ripetibili perché mantiene il comportamento del plugin nello
stesso file revisionato del resto della configurazione dell'harness Codex.

## Correlati

- [Harness Codex](/it/plugins/codex-harness)
- [Runtime dell'harness Codex](/it/plugins/codex-harness-runtime)
- [Plugin Codex nativi](/it/plugins/codex-native-plugins)
- [Codex Computer Use](/it/plugins/codex-computer-use)
- [Provider OpenAI](/it/providers/openai)
- [Riferimento di configurazione](/it/gateway/configuration-reference)
