---
read_when:
    - Ti serve ogni campo di configurazione dell'harness Codex
    - Stai modificando il comportamento di trasporto, autenticazione, discovery o timeout di app-server
    - Stai eseguendo il debug dell'avvio dell'harness Codex, del rilevamento dei modelli o dell'isolamento dell'ambiente
summary: Riferimento per configurazione, autenticazione, rilevamento e app-server per l'harness Codex
title: Riferimento dell'harness Codex
x-i18n:
    generated_at: "2026-07-04T20:34:04Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f1ffe2404dd35df36a706c098f99b841a9664baf76ee5d712836bb35d9ac78bc
    source_path: plugins/codex-harness-reference.md
    workflow: 16
---

Questo riferimento copre la configurazione dettagliata per il Plugin `codex`
incluso. Per le decisioni di configurazione e routing, inizia con
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

| Campo                      | Predefinito              | Significato                                                                                                                                |
| -------------------------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `discovery`                | abilitato                | Impostazioni di rilevamento dei modelli per `model/list` dell'app-server Codex.                                                            |
| `appServer`                | app-server stdio gestito | Impostazioni di trasporto, comando, autenticazione, approvazione, sandbox e timeout.                                                       |
| `codexDynamicToolsLoading` | `"searchable"`           | Usa `"direct"` per inserire gli strumenti dinamici OpenClaw direttamente nel contesto iniziale degli strumenti Codex.                      |
| `codexDynamicToolsExclude` | `[]`                     | Nomi aggiuntivi degli strumenti dinamici OpenClaw da omettere dai turni dell'app-server Codex.                                             |
| `codexPlugins`             | disabilitato             | Supporto nativo per plugin/app Codex per plugin curati installati da sorgente e migrati. Vedi [Plugin nativi Codex](/it/plugins/codex-native-plugins). |
| `computerUse`              | disabilitato             | Configurazione di Codex Computer Use. Vedi [Codex Computer Use](/it/plugins/codex-computer-use).                                               |

## Trasporto dell'app-server

Per impostazione predefinita, OpenClaw avvia il binario Codex gestito distribuito con il Plugin
incluso:

```bash
codex app-server --listen stdio://
```

Questo mantiene la versione dell'app-server legata al Plugin `codex` incluso invece che
a qualunque CLI Codex separata sia installata localmente. Imposta
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

| Campo                                         | Predefinito                                           | Significato                                                                                                                                                                                                                                                                                                                                                                                                           |
| --------------------------------------------- | ----------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                                   | `"stdio"`                                             | `"stdio"` avvia Codex; `"websocket"` si connette a `url`.                                                                                                                                                                                                                                                                                                                                                             |
| `homeScope`                                   | `"agent"`                                             | `"agent"` isola lo stato di Codex per ogni agente OpenClaw. `"user"` condivide il `$CODEX_HOME` nativo o `~/.codex`, usa l'autenticazione nativa e abilita la gestione dei thread riservata al proprietario. L'ambito utente richiede stdio.                                                                                                                                                                         |
| `command`                                     | binario Codex gestito                                | Eseguibile per il trasporto stdio. Lascia non impostato per usare il binario gestito.                                                                                                                                                                                                                                                                                                                                 |
| `args`                                        | `["app-server", "--listen", "stdio://"]`              | Argomenti per il trasporto stdio.                                                                                                                                                                                                                                                                                                                                                                                     |
| `url`                                         | non impostato                                         | URL WebSocket dell'app-server.                                                                                                                                                                                                                                                                                                                                                                                        |
| `authToken`                                   | non impostato                                         | Token Bearer per il trasporto WebSocket. Accetta una stringa letterale o SecretInput come `${CODEX_APP_SERVER_TOKEN}`.                                                                                                                                                                                                                                                                                                |
| `headers`                                     | `{}`                                                  | Header WebSocket aggiuntivi. I valori degli header accettano stringhe letterali o valori SecretInput, ad esempio `x-codex-client-session-token: "${CODEX_CLIENT_SESSION_TOKEN}"`.                                                                                                                                                                                                                                     |
| `clearEnv`                                    | `[]`                                                  | Nomi di variabili d'ambiente aggiuntive rimossi dal processo app-server stdio avviato dopo che OpenClaw ha creato il suo ambiente ereditato.                                                                                                                                                                                                                                                                          |
| `remoteWorkspaceRoot`                         | non impostato                                         | Radice dell'area di lavoro app-server Codex remota. Quando impostata, OpenClaw deduce la radice dell'area di lavoro locale dall'area di lavoro OpenClaw risolta, conserva il suffisso cwd corrente sotto questa radice remota e invia a Codex solo la cwd finale dell'app-server. Se la cwd è fuori dalla radice dell'area di lavoro OpenClaw risolta, OpenClaw fallisce in modo chiuso invece di inviare un percorso locale del Gateway all'app-server remoto. |
| `requestTimeoutMs`                            | `60000`                                               | Timeout per le chiamate al piano di controllo dell'app-server.                                                                                                                                                                                                                                                                                                                                                        |
| `turnCompletionIdleTimeoutMs`                 | `60000`                                               | Finestra di inattività dopo che Codex accetta un turno o dopo una richiesta app-server con ambito di turno mentre OpenClaw attende `turn/completed`.                                                                                                                                                                                                                                                                  |
| `postToolRawAssistantCompletionIdleTimeoutMs` | `300000`                                              | Guardia di inattività del completamento e avanzamento usata dopo un passaggio di consegne a uno strumento, il completamento di uno strumento nativo, l'avanzamento grezzo dell'assistente post-strumento, il completamento grezzo del ragionamento o l'avanzamento del ragionamento mentre OpenClaw attende `turn/completed`. Usala per carichi di lavoro attendibili o pesanti in cui la sintesi post-strumento può legittimamente restare silenziosa più a lungo del budget finale di rilascio dell'assistente. |
| `mode`                                        | `"yolo"` salvo requisiti Codex locali che non consentono YOLO | Preimpostazione per l'esecuzione YOLO o revisionata dal guardian.                                                                                                                                                                                                                                                                                                                                                    |
| `approvalPolicy`                              | `"never"` o una policy di approvazione guardian consentita | Policy di approvazione Codex nativa inviata all'avvio del thread, alla ripresa e al turno.                                                                                                                                                                                                                                                                                                                            |
| `sandbox`                                     | `"danger-full-access"` o una sandbox guardian consentita | Modalità sandbox Codex nativa inviata all'avvio e alla ripresa del thread. Le sandbox OpenClaw attive restringono i turni `danger-full-access` a Codex `workspace-write`; il flag di rete del turno segue l'egress della sandbox OpenClaw.                                                                                                                                                                             |
| `approvalsReviewer`                           | `"user"` o un revisore guardian consentito            | Usa `"auto_review"` per lasciare che Codex revisioni i prompt di approvazione nativi quando consentito.                                                                                                                                                                                                                                                                                                               |
| `defaultWorkspaceDir`                         | directory del processo corrente                       | Area di lavoro usata da `/codex bind` quando `--cwd` viene omesso.                                                                                                                                                                                                                                                                                                                                                    |
| `serviceTier`                                 | non impostato                                         | Livello di servizio app-server Codex opzionale. `"priority"` abilita l'instradamento in modalità rapida, `"flex"` richiede l'elaborazione flex e `null` cancella l'override. Il valore legacy `"fast"` è accettato come `"priority"`.                                                                                                                                                                                 |
| `networkProxy`                                | disabilitato                                          | Abilita esplicitamente il networking del profilo di autorizzazioni Codex per i comandi app-server. OpenClaw definisce la configurazione `permissions.<profile>.network` selezionata e la seleziona con `default_permissions` invece di inviare `sandbox`.                                                                                                                                                              |
| `experimental.sandboxExecServer`              | `false`                                               | Opt-in di anteprima che registra con Codex app-server 0.132.0 o successivo un ambiente Codex basato sulla sandbox OpenClaw, così l'esecuzione Codex nativa può girare dentro la sandbox OpenClaw attiva.                                                                                                                                                                                                               |

`appServer.networkProxy` è esplicito perché cambia il contratto della sandbox
Codex. Quando abilitato, OpenClaw imposta anche `features.network_proxy.enabled` e
`default_permissions` nella configurazione del thread Codex, così il profilo di
autorizzazione generato può avviare il networking gestito da Codex. Per impostazione
predefinita, OpenClaw genera un nome di profilo resistente alle collisioni
`openclaw-network-<fingerprint>` dal corpo del profilo; usa `profileName` solo
quando è richiesto un nome locale stabile.

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

Se il runtime normale dell'app-server sarebbe `danger-full-access`, abilitare
`networkProxy` usa l'accesso al filesystem in stile workspace per il profilo di
autorizzazione generato. L'applicazione della rete gestita da Codex è rete in
sandbox, quindi un profilo con accesso completo non proteggerebbe il traffico in
uscita.

Il plugin blocca handshake app-server più vecchi o senza versione. L'app-server
Codex deve dichiarare la versione stabile `0.125.0` o successiva.

OpenClaw tratta gli URL app-server WebSocket non di loopback come remoti e
richiede autenticazione WebSocket con identità tramite `appServer.authToken` o
un'intestazione `Authorization`. `appServer.authToken` e ogni valore
`appServer.headers.*` possono essere un SecretInput; il runtime dei segreti
risolve SecretRef e abbreviazioni env prima che OpenClaw costruisca le opzioni
di avvio dell'app-server, e i SecretRef strutturati non risolti falliscono prima
che qualsiasi token o intestazione venga inviata. Quando sono configurati plugin
Codex nativi, OpenClaw usa il piano di controllo plugin dell'app-server connesso
per installare o aggiornare quei plugin e poi aggiorna l'inventario delle app in
modo che le app di proprietà dei plugin siano visibili al thread Codex.
`app/list` resta comunque la fonte autorevole per inventario e metadati, ma la
policy di OpenClaw decide se `thread/start` invia
`config.apps[appId].enabled = true` per un'app accessibile elencata anche se
Codex al momento la contrassegna come disabilitata. Gli ID app sconosciuti o
mancanti restano fail-closed; questo percorso attiva solo plugin del marketplace
tramite `plugin/install` e aggiorna l'inventario. Connetti OpenClaw solo ad
app-server remoti considerati attendibili per accettare installazioni di plugin
gestite da OpenClaw e aggiornamenti dell'inventario app.

## Modalità di approvazione e sandbox

Le sessioni app-server stdio locali usano per impostazione predefinita la
modalità YOLO: `approvalPolicy: "never"`, `approvalsReviewer: "user"` e
`sandbox: "danger-full-access"`. Questa postura da operatore locale attendibile
consente ai turni e agli heartbeat non presidiati di OpenClaw di avanzare senza
prompt di approvazione nativi a cui nessuno è presente per rispondere.

Se il file dei requisiti di sistema locali di Codex non consente valori YOLO
impliciti per approvazione, revisore o sandbox, OpenClaw tratta invece il valore
predefinito implicito come guardian e seleziona autorizzazioni guardian
consentite. Anche `tools.exec.mode: "auto"` forza approvazioni Codex revisionate
da guardian e non conserva override legacy non sicuri come
`approvalPolicy: "never"` o `sandbox: "danger-full-access"`; imposta
`tools.exec.mode: "full"` per una postura intenzionale senza approvazioni. Le
voci `[[remote_sandbox_config]]` corrispondenti all'hostname nello stesso file
dei requisiti sono rispettate per la decisione predefinita della sandbox.

Imposta `appServer.mode: "guardian"` per approvazioni Codex revisionate da
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
valore revisore più vecchio `guardian_subagent` è ancora accettato come alias di
compatibilità, ma le nuove configurazioni dovrebbero usare `auto_review`.

Quando è attiva una sandbox OpenClaw, il processo app-server Codex locale viene
comunque eseguito sull'host Gateway. OpenClaw quindi disabilita per quel turno
la Code Mode nativa di Codex, i server MCP utente e l'esecuzione di plugin
basata su app, invece di trattare il sandboxing lato host di Codex come
equivalente al backend sandbox di OpenClaw. L'accesso alla shell è esposto
tramite strumenti dinamici basati sulla sandbox di OpenClaw, come `sandbox_exec`
e `sandbox_process`, quando sono disponibili i normali strumenti exec/process.

Su host Ubuntu/AppArmor, Codex bwrap può fallire in `workspace-write` prima
dell'avvio del comando shell quando esegui intenzionalmente `workspace-write`
nativo di Codex senza sandboxing OpenClaw attivo. Se vedi
`bwrap: setting up uid map: Permission denied` o
`bwrap: loopback: Failed RTM_NEWADDR: Operation not permitted`, esegui
`openclaw doctor` e correggi la policy namespace dell'host segnalata per
l'utente del servizio OpenClaw invece di concedere privilegi Docker container
più ampi. Preferisci un profilo AppArmor con ambito limitato per il processo di
servizio; il fallback `kernel.apparmor_restrict_unprivileged_userns=0` è esteso
a tutto l'host e comporta compromessi di sicurezza.

## Esecuzione nativa in sandbox

L'impostazione predefinita stabile è fail-closed: il sandboxing OpenClaw attivo
disabilita le superfici di esecuzione native di Codex che altrimenti verrebbero
eseguite dall'host dell'app-server Codex. Usa
`appServer.experimental.sandboxExecServer: true` solo quando vuoi provare il
supporto per ambienti remoti di Codex con il backend sandbox di OpenClaw. Questo
percorso di anteprima richiede app-server Codex 0.132.0 o successivo.

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
con l'app-server Codex e avvia il thread e il turno Codex con quell'ambiente di
proprietà di OpenClaw. Se l'app-server non riesce a registrare l'ambiente,
l'esecuzione fallisce in modo fail-closed invece di ripiegare silenziosamente
sull'esecuzione host.

Questo percorso di anteprima è solo locale. Un app-server WebSocket remoto non
può raggiungere l'exec-server di loopback a meno che sia in esecuzione sullo
stesso host, quindi OpenClaw rifiuta tale combinazione.

## Isolamento di autenticazione e ambiente

Nella home per-agente predefinita, l'autenticazione viene selezionata in questo
ordine:

1. Un profilo di autenticazione OpenClaw Codex esplicito per l'agente.
2. L'account esistente dell'app-server nella home Codex di quell'agente.
3. Solo per avvii app-server stdio locali, `CODEX_API_KEY`, poi
   `OPENAI_API_KEY`, quando non è presente alcun account app-server e
   l'autenticazione OpenAI è ancora richiesta.

Quando OpenClaw rileva un profilo di autenticazione Codex in stile abbonamento
ChatGPT, rimuove `CODEX_API_KEY` e `OPENAI_API_KEY` dal processo figlio Codex
generato. Questo mantiene le chiavi API a livello Gateway disponibili per
embedding o modelli OpenAI diretti senza far addebitare per errore i turni
app-server Codex nativi tramite l'API.

I profili espliciti con chiave API Codex e il fallback con chiavi env stdio
locali usano il login dell'app-server invece dell'env ereditato dal processo
figlio. Le connessioni app-server WebSocket non ricevono il fallback di chiavi
API env del Gateway; usa un profilo di autenticazione esplicito o l'account
proprio dell'app-server remoto.

Gli avvii app-server stdio ereditano per impostazione predefinita l'ambiente di
processo di OpenClaw. OpenClaw possiede il bridge dell'account app-server Codex
e imposta `CODEX_HOME` su una directory per-agente nello stato OpenClaw di
quell'agente. Questo mantiene configurazione Codex, account, cache/dati dei
plugin e stato dei thread circoscritti all'agente OpenClaw invece di importarli
dalla home personale `~/.codex` dell'operatore.

Imposta `appServer.homeScope: "user"` per condividere lo stato Codex nativo con
Codex Desktop e la CLI. Questa modalità solo stdio locale usa `$CODEX_HOME`
quando impostato e `~/.codex` altrimenti, inclusi autenticazione nativa,
configurazione, plugin e thread. OpenClaw salta il proprio bridge dei profili di
autenticazione per l'app-server. I turni proprietario verificati possono usare
`codex_threads` per elencare, cercare, leggere, creare fork, rinominare,
archiviare e ripristinare quei thread. Crea un fork di un thread prima di
continuarlo in OpenClaw; i processi Codex indipendenti non coordinano scrittori
concorrenti per lo stesso thread.

OpenClaw non riscrive `HOME` per i normali avvii app-server locali. I
sottoprocessi eseguiti da Codex come `openclaw`, `gh`, `git`, CLI cloud e
comandi shell vedono la home di processo normale e possono trovare
configurazioni e token nella home utente. Codex può anche scoprire
`$HOME/.agents/skills` e `$HOME/.agents/plugins/marketplace.json`; tale
discovery `.agents` è condivisa intenzionalmente con la home dell'operatore ed è
separata dallo stato isolato `~/.codex`.

Nell'ambito agente predefinito, i plugin OpenClaw e gli snapshot Skills di
OpenClaw continuano a passare attraverso il registro plugin e il loader Skills
propri di OpenClaw; gli asset personali Codex `~/.codex` no. Se hai Skills o
plugin utili della CLI Codex da una home Codex che dovrebbero diventare parte di
un agente OpenClaw isolato, inventariali esplicitamente:

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
normalizzazione dell'avvio locale: `CODEX_HOME` resta puntato all'ambito agente
o utente selezionato, e `HOME` resta ereditato così i sottoprocessi possono
usare il normale stato nella home utente.

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

La maggior parte degli strumenti di integrazione OpenClaw rimanenti, come
messaggistica, media, cron, browser, nodi, gateway, `heartbeat_respond` e
`web_search`, sono disponibili tramite la ricerca strumenti Codex nello
spazio dei nomi `openclaw`. Questo mantiene più piccolo il contesto iniziale del
modello. `sessions_yield` e le risposte sorgente solo message-tool restano
diretti perché sono contratti di controllo del turno. `sessions_spawn` resta
ricercabile così `spawn_agent` nativo di Codex rimane la superficie primaria dei
subagenti Codex, mentre la delega esplicita OpenClaw o ACP resta disponibile
tramite lo spazio dei nomi degli strumenti dinamici `openclaw`.

Imposta `codexDynamicToolsLoading: "direct"` solo quando ti connetti a un
app-server Codex personalizzato che non può cercare strumenti dinamici differiti
o durante il debug del payload completo degli strumenti.

## Timeout

Le chiamate agli strumenti dinamici di proprietà di OpenClaw sono limitate in
modo indipendente da `appServer.requestTimeoutMs`. Ogni richiesta Codex
`item/tool/call` usa il primo timeout disponibile in questo ordine:

- Un argomento `timeoutMs` positivo per chiamata.
- Per `image_generate`, `agents.defaults.imageGenerationModel.timeoutMs`.
- Per `image_generate` senza un timeout configurato, il valore predefinito di
  120 secondi per la generazione immagini.
- Per lo strumento `image` di comprensione media,
  `tools.media.image.timeoutSeconds` convertito in millisecondi, oppure il
  valore predefinito media di 60 secondi. Per la comprensione immagini, questo
  si applica alla richiesta stessa e non viene ridotto da lavori di preparazione
  precedenti.
- Il valore predefinito di 90 secondi per gli strumenti dinamici.

Questo watchdog è il budget esterno della chiamata dinamica `item/tool/call`. I
timeout delle richieste specifici del provider vengono eseguiti all'interno di
quella chiamata e mantengono le proprie semantiche di timeout. I budget degli
strumenti dinamici sono limitati a 600000 ms. Al timeout, OpenClaw interrompe il
segnale dello strumento dove supportato e restituisce a Codex una risposta
strumento dinamico fallita, così il turno può continuare invece di lasciare la
sessione in `processing`.

Dopo che Codex accetta un turno, e dopo che OpenClaw risponde a una richiesta
app-server con ambito di turno, l'harness si aspetta che Codex faccia progressi
nel turno corrente e alla fine completi il turno nativo con `turn/completed`. Se
l'app-server resta silenzioso per `appServer.turnCompletionIdleTimeoutMs`,
OpenClaw tenta al meglio di interrompere il turno Codex, registra un timeout
diagnostico e rilascia la corsia della sessione OpenClaw così i messaggi chat
successivi non restano in coda dietro un turno nativo obsoleto.

La maggior parte delle notifiche non terminali per lo stesso turno disarma quel breve watchdog
perché Codex ha dimostrato che il turno è ancora attivo. Gli handoff degli strumenti usano un budget di inattività post-strumento più lungo: dopo che OpenClaw restituisce una risposta `item/tool/call`, dopo
il completamento di elementi strumento nativi come `commandExecution`, dopo completamenti grezzi
`custom_tool_call_output` e dopo avanzamento grezzo dell'assistente post-strumento,
completamenti di ragionamento grezzi o avanzamento del ragionamento. La guardia usa
`appServer.postToolRawAssistantCompletionIdleTimeoutMs` quando configurato e
altrimenti il valore predefinito è cinque minuti. Lo stesso budget post-strumento estende anche il
watchdog di avanzamento per la finestra di sintesi silenziosa prima che Codex emetta il successivo
evento del turno corrente. I completamenti di ragionamento, i completamenti
`agentMessage` di commentary e l'avanzamento grezzo di ragionamento o dell'assistente pre-strumento possono
essere seguiti da una risposta finale automatica, quindi usano la guardia di risposta post-avanzamento
invece di rilasciare immediatamente la corsia della sessione. Solo gli elementi `agentMessage`
finali/non-commentary completati e i completamenti grezzi dell'assistente pre-strumento
armano il rilascio dell'output dell'assistente: se Codex poi resta silenzioso senza
`turn/completed`, OpenClaw interrompe al meglio il turno nativo e rilascia
la corsia della sessione. Gli errori app-server stdio sicuri per il replay, inclusi i timeout
di inattività di completamento turno senza evidenza di assistente, strumento, elemento attivo o
effetti collaterali, vengono ritentati una volta con un nuovo tentativo app-server. I timeout non sicuri
ritirano comunque il client app-server bloccato e rilasciano la corsia della sessione
OpenClaw. Inoltre cancellano il binding del thread nativo obsoleto invece di essere
riprodotti automaticamente. I timeout di controllo completamento mostrano testo di timeout specifico di Codex:
i casi sicuri per il replay dicono che la risposta potrebbe essere incompleta, mentre i casi non sicuri
dicono all'utente di verificare lo stato corrente prima di riprovare. La diagnostica pubblica dei timeout
include campi strutturali come l'ultimo metodo di notifica app-server,
id/tipo/ruolo dell'elemento di risposta grezza dell'assistente, conteggi di richieste/elementi attivi e stato di guardia
armato. Quando l'ultima notifica è un elemento di risposta grezza dell'assistente, include
anche un'anteprima limitata del testo dell'assistente. Non include prompt grezzi né
contenuto degli strumenti.

## Rilevamento dei modelli

Per impostazione predefinita, il Plugin Codex chiede all'app-server i modelli disponibili. La
disponibilità dei modelli è di proprietà dell'app-server Codex, quindi l'elenco può cambiare quando OpenClaw
aggiorna la versione `@openai/codex` inclusa o quando una distribuzione punta
`appServer.command` a un binario Codex diverso. La disponibilità può anche essere
specifica dell'account. Usa `/codex models` su un gateway in esecuzione per vedere il catalogo live
per quell'harness e quell'account.

Se il rilevamento fallisce o va in timeout, OpenClaw usa un catalogo di fallback incluso per:

- GPT-5.5
- GPT-5.4 mini

L'harness incluso corrente è `@openai/codex` `0.142.5`. Una sonda `model/list`
su quell'app-server incluso ha restituito queste righe pubbliche del selettore:

| ID modello            | Modalità di input | Sforzi di ragionamento   |
| --------------------- | ----------------- | ------------------------ |
| `gpt-5.5`             | text, image       | low, medium, high, xhigh |
| `gpt-5.4`             | text, image       | low, medium, high, xhigh |
| `gpt-5.4-mini`        | text, image       | low, medium, high, xhigh |
| `gpt-5.3-codex-spark` | text              | low, medium, high, xhigh |

I modelli nascosti possono essere restituiti dal catalogo app-server per flussi interni o
specializzati, ma non sono scelte normali del selettore di modelli.

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

Disabilita il rilevamento quando vuoi che l'avvio eviti di interrogare Codex e usi solo il
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

## File di bootstrap dell'area di lavoro

Codex gestisce `AGENTS.md` autonomamente tramite il rilevamento nativo dei documenti di progetto. OpenClaw
non scrive file sintetici di documenti di progetto Codex né dipende da nomi file di fallback di Codex
per i file persona, perché i fallback di Codex si applicano solo quando
`AGENTS.md` manca.

Per la parità dell'area di lavoro OpenClaw, l'harness Codex risolve gli altri file di bootstrap.
`SOUL.md`, `IDENTITY.md`, `TOOLS.md` e `USER.md` vengono inoltrati come
istruzioni per sviluppatori OpenClaw Codex perché definiscono l'agente attivo,
la guida disponibile per l'area di lavoro e il profilo utente. L'elenco compatto delle Skills di OpenClaw
viene inoltrato come istruzioni per sviluppatori di collaborazione con ambito al turno.
Il contenuto di `HEARTBEAT.md` non viene iniettato; i turni heartbeat ricevono un puntatore in modalità collaborazione
per leggere il file quando esiste e non è vuoto. Il contenuto di `MEMORY.md`
dall'area di lavoro agente configurata non viene incollato nell'input del turno nativo Codex
quando gli strumenti di memoria sono disponibili per quell'area di lavoro; quando esiste, l'harness
aggiunge un piccolo puntatore alla memoria dell'area di lavoro alle istruzioni per sviluppatori di collaborazione
con ambito al turno e Codex dovrebbe usare `memory_search` o `memory_get` quando la memoria durevole
è pertinente. Se gli strumenti sono disabilitati, la ricerca in memoria non è disponibile o
l'area di lavoro attiva differisce dall'area di lavoro di memoria dell'agente, `MEMORY.md` usa il
normale percorso di contesto del turno limitato.
`BOOTSTRAP.md`, quando presente, viene inoltrato come contesto di riferimento dell'input turno
OpenClaw.

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
preferibile per distribuzioni ripetibili perché mantiene il comportamento del plugin nello
stesso file revisionato del resto della configurazione dell'harness Codex.

## Correlati

- [Harness Codex](/it/plugins/codex-harness)
- [Runtime dell'harness Codex](/it/plugins/codex-harness-runtime)
- [Plugin Codex nativi](/it/plugins/codex-native-plugins)
- [Codex Computer Use](/it/plugins/codex-computer-use)
- [Provider OpenAI](/it/providers/openai)
- [Riferimento della configurazione](/it/gateway/configuration-reference)
