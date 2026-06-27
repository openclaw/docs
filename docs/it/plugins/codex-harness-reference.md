---
read_when:
    - Ti serve ogni campo di configurazione dell’harness Codex
    - Stai modificando il trasporto, l'autenticazione, il rilevamento o il comportamento dei timeout di app-server
    - Stai eseguendo il debug dell’avvio dell’harness Codex, della scoperta dei modelli o dell’isolamento dell’ambiente
summary: Riferimento per configurazione, autenticazione, discovery e app-server per l'harness Codex
title: Riferimento dell'harness Codex
x-i18n:
    generated_at: "2026-06-27T17:47:54Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 32da817c262a61769b78b16c10e508175c730a568c2ba6321595c430815526a5
    source_path: plugins/codex-harness-reference.md
    workflow: 16
---

Questo riferimento copre la configurazione dettagliata del Plugin `codex`
incluso. Per le decisioni di configurazione e instradamento, parti da
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
| -------------------------- | ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `discovery`                | abilitato                | Impostazioni di rilevamento dei modelli per `model/list` dell'app-server Codex.                                                          |
| `appServer`                | app-server stdio gestito | Impostazioni di trasporto, comando, autenticazione, approvazione, sandbox e timeout.                                                      |
| `codexDynamicToolsLoading` | `"searchable"`           | Usa `"direct"` per inserire gli strumenti dinamici OpenClaw direttamente nel contesto iniziale degli strumenti Codex.                     |
| `codexDynamicToolsExclude` | `[]`                     | Nomi aggiuntivi degli strumenti dinamici OpenClaw da omettere dai turni dell'app-server Codex.                                            |
| `codexPlugins`             | disabilitato             | Supporto nativo Codex per plugin/app per i plugin curati migrati e installati dal sorgente. Vedi [Plugin Codex nativi](/it/plugins/codex-native-plugins). |
| `computerUse`              | disabilitato             | Configurazione di Codex Computer Use. Vedi [Codex Computer Use](/it/plugins/codex-computer-use).                                             |

## Trasporto app-server

Per impostazione predefinita, OpenClaw avvia il binario Codex gestito fornito con il Plugin
incluso:

```bash
codex app-server --listen stdio://
```

Questo mantiene la versione dell'app-server legata al Plugin `codex` incluso invece che
a qualunque CLI Codex separata risulti installata localmente. Imposta
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

| Campo                                         | Predefinito                                            | Significato                                                                                                                                                                                                                                                                                                                                                                                     |
| --------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                                   | `"stdio"`                                              | `"stdio"` avvia Codex; `"websocket"` si connette a `url`.                                                                                                                                                                                                                                                                                                                                       |
| `command`                                     | binario Codex gestito                                  | Eseguibile per il trasporto stdio. Lascia non impostato per usare il binario gestito.                                                                                                                                                                                                                                                                                                           |
| `args`                                        | `["app-server", "--listen", "stdio://"]`               | Argomenti per il trasporto stdio.                                                                                                                                                                                                                                                                                                                                                               |
| `url`                                         | non impostato                                          | URL dell'app-server WebSocket.                                                                                                                                                                                                                                                                                                                                                                  |
| `authToken`                                   | non impostato                                          | Token Bearer per il trasporto WebSocket. Accetta una stringa letterale o SecretInput come `${CODEX_APP_SERVER_TOKEN}`.                                                                                                                                                                                                                                                                          |
| `headers`                                     | `{}`                                                   | Header WebSocket aggiuntivi. I valori degli header accettano stringhe letterali o valori SecretInput, ad esempio `x-codex-client-session-token: "${CODEX_CLIENT_SESSION_TOKEN}"`.                                                                                                                                                                                                               |
| `clearEnv`                                    | `[]`                                                   | Nomi di variabili d'ambiente aggiuntive rimosse dal processo app-server stdio avviato dopo che OpenClaw ha costruito il suo ambiente ereditato.                                                                                                                                                                                                                                                 |
| `remoteWorkspaceRoot`                         | non impostato                                          | Radice dell'area di lavoro remota dell'app-server Codex. Quando impostata, OpenClaw deduce la radice dell'area di lavoro locale dall'area di lavoro OpenClaw risolta, preserva il suffisso cwd corrente sotto questa radice remota e invia a Codex solo il cwd finale dell'app-server. Se il cwd è fuori dalla radice dell'area di lavoro OpenClaw risolta, OpenClaw fallisce in modo chiuso invece di inviare un percorso locale del gateway all'app-server remoto. |
| `requestTimeoutMs`                            | `60000`                                                | Timeout per le chiamate del piano di controllo dell'app-server.                                                                                                                                                                                                                                                                                                                                 |
| `turnCompletionIdleTimeoutMs`                 | `60000`                                                | Finestra di inattività dopo che Codex accetta un turno o dopo una richiesta app-server con ambito di turno mentre OpenClaw attende `turn/completed`.                                                                                                                                                                                                                                             |
| `postToolRawAssistantCompletionIdleTimeoutMs` | `300000`                                               | Guardia di inattività del completamento e di avanzamento usata dopo un passaggio a uno strumento, il completamento di uno strumento nativo, l'avanzamento grezzo dell'assistente post-strumento, il completamento del ragionamento grezzo o l'avanzamento del ragionamento mentre OpenClaw attende `turn/completed`. Usala per carichi di lavoro attendibili o pesanti in cui la sintesi post-strumento può legittimamente restare silenziosa più a lungo del budget finale di rilascio dell'assistente. |
| `mode`                                        | `"yolo"` salvo che i requisiti locali di Codex non consentano YOLO | Preset per l'esecuzione YOLO o revisionata da guardian.                                                                                                                                                                                                                                                                                                                                         |
| `approvalPolicy`                              | `"never"` o una policy di approvazione guardian consentita | Policy di approvazione nativa di Codex inviata all'avvio del thread, alla ripresa e al turno.                                                                                                                                                                                                                                                                                                   |
| `sandbox`                                     | `"danger-full-access"` o una sandbox guardian consentita | Modalità sandbox nativa di Codex inviata all'avvio e alla ripresa del thread. Le sandbox OpenClaw attive restringono i turni `danger-full-access` a Codex `workspace-write`; il flag di rete del turno segue l'egresso della sandbox OpenClaw.                                                                                                                                                  |
| `approvalsReviewer`                           | `"user"` o un revisore guardian consentito             | Usa `"auto_review"` per consentire a Codex di revisionare le richieste di approvazione native quando consentito.                                                                                                                                                                                                                                                                                |
| `defaultWorkspaceDir`                         | directory del processo corrente                        | Area di lavoro usata da `/codex bind` quando `--cwd` è omesso.                                                                                                                                                                                                                                                                                                                                  |
| `serviceTier`                                 | non impostato                                          | Tier di servizio opzionale dell'app-server Codex. `"priority"` abilita il routing in modalità veloce, `"flex"` richiede l'elaborazione flex e `null` cancella l'override. Il valore legacy `"fast"` è accettato come `"priority"`.                                                                                                                                                               |
| `networkProxy`                                | disabilitato                                           | Attiva facoltativamente la rete del profilo di autorizzazioni Codex per i comandi app-server. OpenClaw definisce la configurazione `permissions.<profile>.network` selezionata e la seleziona con `default_permissions` invece di inviare `sandbox`.                                                                                                                                              |
| `experimental.sandboxExecServer`              | `false`                                                | Opt-in di anteprima che registra un ambiente Codex supportato dalla sandbox OpenClaw con Codex app-server 0.132.0 o più recente, così l'esecuzione nativa di Codex può avvenire all'interno della sandbox OpenClaw attiva.                                                                                                                                                                       |

`appServer.networkProxy` è esplicito perché cambia il contratto della sandbox
Codex. Quando è abilitato, OpenClaw imposta anche `features.network_proxy.enabled` e
`default_permissions` nella configurazione del thread Codex, così il profilo di
autorizzazione generato può avviare la rete gestita da Codex. Per impostazione
predefinita, OpenClaw genera un nome profilo resistente alle collisioni
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

Se il runtime app-server normale fosse `danger-full-access`, abilitare
`networkProxy` usa un accesso al filesystem in stile workspace per il profilo di
autorizzazione generato. L'applicazione della rete gestita da Codex è rete in
sandbox, quindi un profilo con accesso completo non proteggerebbe il traffico in
uscita.

Il Plugin blocca handshake app-server più vecchi o senza versione. Codex app-server
deve riportare la versione stabile `0.125.0` o più recente.

OpenClaw considera remoti gli URL WebSocket app-server non loopback e richiede
un'autenticazione WebSocket con identità tramite `appServer.authToken` o un
header `Authorization`. `appServer.authToken` e ogni valore
`appServer.headers.*` possono essere un SecretInput; il runtime dei segreti
risolve SecretRefs e le abbreviazioni env prima che OpenClaw crei le opzioni di
avvio dell'app-server, e i SecretRefs strutturati non risolti falliscono prima
che venga inviato qualsiasi token o header. Quando i plugin nativi Codex sono
configurati, OpenClaw usa il piano di controllo plugin dell'app-server connesso
per installare o aggiornare quei plugin e poi aggiorna l'inventario delle app
così che le app di proprietà del plugin siano visibili al thread Codex.
`app/list` resta la fonte autorevole per inventario e metadati, ma la policy di
OpenClaw decide se `thread/start` invia `config.apps[appId].enabled = true` per
un'app elencata e accessibile anche se Codex al momento la contrassegna come
disabilitata. Gli ID app sconosciuti o mancanti restano fail-closed; questo
percorso attiva solo i plugin del marketplace tramite `plugin/install` e
aggiorna l'inventario. Collega OpenClaw solo ad app-server remoti considerati
affidabili per accettare installazioni di plugin gestite da OpenClaw e
aggiornamenti dell'inventario delle app.

## Modalità di approvazione e sandbox

Le sessioni app-server stdio locali usano per impostazione predefinita la
modalità YOLO: `approvalPolicy: "never"`, `approvalsReviewer: "user"` e
`sandbox: "danger-full-access"`. Questa postura di operatore locale affidabile
consente ai turni OpenClaw non presidiati e agli heartbeat di avanzare senza
prompt di approvazione nativi a cui nessuno è presente per rispondere.

Se il file dei requisiti di sistema locali di Codex non consente valori YOLO
impliciti per approvazione, reviewer o sandbox, OpenClaw tratta invece il
default implicito come guardian e seleziona i permessi guardian consentiti.
Anche `tools.exec.mode: "auto"` forza approvazioni Codex revisionate da guardian
e non conserva override legacy non sicuri come `approvalPolicy: "never"` o
`sandbox: "danger-full-access"`; imposta `tools.exec.mode: "full"` per una
postura intenzionale senza approvazione. Le voci
`[[remote_sandbox_config]]` che corrispondono all'hostname nello stesso file dei
requisiti vengono rispettate per la decisione del default sandbox.

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
`approvalsReviewer: "auto_review"` e `sandbox: "workspace-write"` quando questi
valori sono consentiti. I singoli campi della policy sovrascrivono `mode`. Il
valore reviewer precedente `guardian_subagent` è ancora accettato come alias di
compatibilità, ma le nuove configurazioni dovrebbero usare `auto_review`.

Quando una sandbox OpenClaw è attiva, il processo app-server Codex locale gira
comunque sull'host Gateway. OpenClaw quindi disabilita per quel turno la Code
Mode nativa di Codex, i server MCP utente e l'esecuzione di plugin basati su app,
invece di considerare il sandboxing lato host di Codex equivalente al backend
sandbox di OpenClaw. L'accesso alla shell è esposto tramite strumenti dinamici
basati sulla sandbox OpenClaw come `sandbox_exec` e `sandbox_process` quando i
normali strumenti exec/process sono disponibili.

Sugli host Ubuntu/AppArmor, Codex bwrap può fallire in `workspace-write` prima
dell'avvio del comando shell quando esegui intenzionalmente il
`workspace-write` nativo di Codex senza sandboxing OpenClaw attivo. Se vedi
`bwrap: setting up uid map: Permission denied` o
`bwrap: loopback: Failed RTM_NEWADDR: Operation not permitted`, esegui
`openclaw doctor` e correggi la policy namespace dell'host segnalata per
l'utente del servizio OpenClaw invece di concedere privilegi più ampi al
container Docker. Preferisci un profilo AppArmor con ambito limitato per il
processo del servizio; il fallback
`kernel.apparmor_restrict_unprivileged_userns=0` è a livello di host e comporta
compromessi di sicurezza.

## Esecuzione nativa in sandbox

Il default stabile è fail-closed: il sandboxing OpenClaw attivo disabilita le
superfici di esecuzione native Codex che altrimenti verrebbero eseguite
dall'host app-server Codex. Usa `appServer.experimental.sandboxExecServer: true`
solo quando vuoi provare il supporto agli ambienti remoti di Codex con il
backend sandbox di OpenClaw. Questo percorso di anteprima richiede Codex
app-server 0.132.0 o più recente.

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

Questo percorso di anteprima è solo locale. Un app-server WebSocket remoto non
può raggiungere l'exec-server loopback a meno che non sia in esecuzione sullo
stesso host, quindi OpenClaw rifiuta questa combinazione.

## Autenticazione e isolamento dell'ambiente

L'autenticazione viene selezionata in questo ordine:

1. Un profilo di autenticazione OpenClaw Codex esplicito per l'agente.
2. L'account esistente dell'app-server nella home Codex di quell'agente.
3. Solo per gli avvii app-server stdio locali, `CODEX_API_KEY`, poi
   `OPENAI_API_KEY`, quando non è presente alcun account app-server e
   l'autenticazione OpenAI è ancora richiesta.

Quando OpenClaw rileva un profilo di autenticazione Codex in stile abbonamento
ChatGPT, rimuove `CODEX_API_KEY` e `OPENAI_API_KEY` dal processo figlio Codex
generato. Questo mantiene le chiavi API a livello Gateway disponibili per
embedding o modelli OpenAI diretti senza far addebitare per errore i turni
nativi Codex app-server tramite API.

I profili Codex API-key espliciti e il fallback env-key stdio locale usano il
login app-server invece dell'ambiente ereditato del processo figlio. Le
connessioni app-server WebSocket non ricevono il fallback API-key env del
Gateway; usa un profilo di autenticazione esplicito o l'account proprio
dell'app-server remoto.

Gli avvii app-server stdio ereditano per impostazione predefinita l'ambiente del
processo OpenClaw. OpenClaw possiede il bridge dell'account app-server Codex e
imposta `CODEX_HOME` su una directory per agente sotto lo stato OpenClaw di
quell'agente. Questo mantiene configurazione Codex, account, cache/dati dei
plugin e stato dei thread limitati all'agente OpenClaw invece di farli trapelare
dalla home personale `~/.codex` dell'operatore.

OpenClaw non riscrive `HOME` per i normali avvii app-server locali. I
sottoprocessi eseguiti da Codex come `openclaw`, `gh`, `git`, CLI cloud e
comandi shell vedono la normale home del processo e possono trovare
configurazioni e token nella home utente. Codex può anche scoprire
`$HOME/.agents/skills` e `$HOME/.agents/plugins/marketplace.json`; quella
scoperta `.agents` è intenzionalmente condivisa con la home dell'operatore ed è
separata dallo stato isolato `~/.codex`.

I plugin OpenClaw e gli snapshot delle skill OpenClaw continuano a passare
attraverso il registro plugin e il loader delle skill propri di OpenClaw. Gli
asset personali Codex `~/.codex` no. Se hai Skills o plugin utili della CLI
Codex da una home Codex che dovrebbero diventare parte di un agente OpenClaw,
inventariali esplicitamente:

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

Se una distribuzione richiede isolamento ambientale aggiuntivo, aggiungi quelle
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

`appServer.clearEnv` influisce solo sul processo figlio Codex app-server
generato. OpenClaw rimuove `CODEX_HOME` e `HOME` da questo elenco durante la
normalizzazione dell'avvio locale: `CODEX_HOME` resta per agente e `HOME` resta
ereditato così che i sottoprocessi possano usare il normale stato della home
utente.

## Strumenti dinamici

Gli strumenti dinamici Codex usano per impostazione predefinita il caricamento
`searchable`. OpenClaw non espone strumenti dinamici che duplicano le operazioni
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
`web_search`, è disponibile tramite la ricerca strumenti Codex sotto il
namespace `openclaw`. Questo mantiene più piccolo il contesto iniziale del
modello. `sessions_yield` e le risposte sorgente solo tramite strumenti di
messaggistica restano dirette perché sono contratti di controllo del turno.
`sessions_spawn` resta searchable così che il `spawn_agent` nativo di Codex
rimanga la superficie primaria per subagent Codex, mentre la delega esplicita
OpenClaw o ACP resta disponibile tramite il namespace degli strumenti dinamici
`openclaw`.

Imposta `codexDynamicToolsLoading: "direct"` solo quando ti connetti a un
app-server Codex personalizzato che non può cercare strumenti dinamici differiti
o quando esegui il debug del payload completo degli strumenti.

## Timeout

Le chiamate agli strumenti dinamici di proprietà di OpenClaw sono limitate
indipendentemente da `appServer.requestTimeoutMs`. Ogni richiesta Codex
`item/tool/call` usa il primo timeout disponibile in questo ordine:

- Un argomento `timeoutMs` positivo per chiamata.
- Per `image_generate`, `agents.defaults.imageGenerationModel.timeoutMs`.
- Per `image_generate` senza un timeout configurato, il default di 120 secondi
  per la generazione immagini.
- Per lo strumento `image` di comprensione media,
  `tools.media.image.timeoutSeconds` convertito in millisecondi, oppure il
  default media di 60 secondi. Per la comprensione immagini, questo si applica
  alla richiesta stessa e non viene ridotto dal lavoro di preparazione
  precedente.
- Il default di 90 secondi degli strumenti dinamici.

Questo watchdog è il budget esterno dinamico `item/tool/call`. I timeout delle
richieste specifici del provider vengono eseguiti all'interno di quella chiamata
e mantengono la propria semantica di timeout. I budget degli strumenti dinamici
sono limitati a 600000 ms. Al timeout, OpenClaw interrompe il segnale dello
strumento dove supportato e restituisce a Codex una risposta di strumento
dinamico fallita, così il turno può continuare invece di lasciare la sessione in
`processing`.

Dopo che Codex accetta un turno, e dopo che OpenClaw risponde a una richiesta
app-server con ambito di turno, l'harness si aspetta che Codex faccia progressi
nel turno corrente e alla fine completi il turno nativo con `turn/completed`. Se
l'app-server resta silenzioso per `appServer.turnCompletionIdleTimeoutMs`,
OpenClaw tenta con best effort di interrompere il turno Codex, registra un
timeout diagnostico e rilascia la corsia della sessione OpenClaw così che i
messaggi chat successivi non restino in coda dietro un turno nativo obsoleto.

La maggior parte delle notifiche non terminali per lo stesso turno disarma quel breve watchdog
perché Codex ha dimostrato che il turno è ancora attivo. Gli handoff degli strumenti usano un budget di inattività
post-strumento più lungo: dopo che OpenClaw restituisce una risposta `item/tool/call`, dopo che
elementi di strumenti nativi come `commandExecution` vengono completati, dopo il completamento di
`custom_tool_call_output` grezzi e dopo avanzamento grezzo post-strumento dell'assistente,
completamenti di ragionamento grezzi o avanzamento del ragionamento. La guardia usa
`appServer.postToolRawAssistantCompletionIdleTimeoutMs` quando configurato e
altrimenti usa come predefiniti cinque minuti. Lo stesso budget post-strumento estende anche il
watchdog di avanzamento per la finestra di sintesi silenziosa prima che Codex emetta il successivo
evento del turno corrente. I completamenti di ragionamento, i completamenti
`agentMessage` di commento e l'avanzamento grezzo di ragionamento o dell'assistente pre-strumento possono
essere seguiti da una risposta finale automatica, quindi usano la guardia di risposta post-avanzamento
invece di rilasciare immediatamente la corsia di sessione. Solo gli elementi
`agentMessage` finali/non di commento completati e i completamenti grezzi dell'assistente
pre-strumento armano il rilascio dell'output dell'assistente: se Codex poi resta silenzioso senza
`turn/completed`, OpenClaw interrompe al meglio il turno nativo e rilascia
la corsia di sessione. Gli errori stdio dell'app-server sicuri per il replay, inclusi i
timeout di inattività del completamento del turno senza prove di assistente, strumento, elemento attivo o
effetti collaterali, vengono riprovati una volta su un nuovo tentativo dell'app-server. I timeout
non sicuri ritirano comunque il client app-server bloccato e rilasciano la corsia di sessione
OpenClaw. Inoltre cancellano l'associazione obsoleta del thread nativo invece di essere
riprodotti automaticamente. I timeout di osservazione del completamento espongono testo di timeout
specifico di Codex: i casi sicuri per il replay indicano che la risposta potrebbe essere incompleta,
mentre i casi non sicuri dicono all'utente di verificare lo stato corrente prima di riprovare.
La diagnostica pubblica dei timeout include campi strutturali come l'ultimo metodo di notifica
dell'app-server, id/tipo/ruolo dell'elemento di risposta grezza dell'assistente, conteggi di
richieste/elementi attivi e stato di guardia armato. Quando l'ultima notifica è un elemento di
risposta grezza dell'assistente, include anche un'anteprima delimitata del testo dell'assistente.
Non include prompt grezzi o contenuto degli strumenti.

## Rilevamento dei modelli

Per impostazione predefinita, il Plugin Codex chiede all'app-server i modelli disponibili. La
disponibilità dei modelli è di proprietà dell'app-server Codex, quindi l'elenco può cambiare quando OpenClaw
aggiorna la versione di `@openai/codex` in bundle o quando una distribuzione punta
`appServer.command` a un binario Codex diverso. La disponibilità può anche essere
specifica dell'account. Usa `/codex models` su un gateway in esecuzione per vedere il catalogo live
per quell'harness e quell'account.

Se il rilevamento non riesce o va in timeout, OpenClaw usa un catalogo di fallback in bundle per:

- GPT-5.5
- GPT-5.4 mini
- GPT-5.2

L'harness in bundle corrente è `@openai/codex` `0.139.0`. Una sonda `model/list`
contro quell'app-server in bundle ha restituito:

| ID modello      | Predefinito | Nascosto | Modalità di input | Livelli di ragionamento   |
| --------------- | ----------- | -------- | ----------------- | ------------------------- |
| `gpt-5.5`       | Sì          | No       | testo, immagine   | low, medium, high, xhigh  |
| `gpt-5.4`       | No          | No       | testo, immagine   | low, medium, high, xhigh  |
| `gpt-5.4-mini`  | No          | No       | testo, immagine   | low, medium, high, xhigh  |
| `gpt-5.3-codex` | No          | No       | testo, immagine   | low, medium, high, xhigh  |
| `gpt-5.2`       | No          | No       | testo, immagine   | low, medium, high, xhigh  |

I modelli nascosti possono essere restituiti dal catalogo dell'app-server per flussi interni o
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

## File di bootstrap dello spazio di lavoro

Codex gestisce autonomamente `AGENTS.md` tramite il rilevamento nativo della documentazione di progetto. OpenClaw
non scrive file sintetici di documentazione di progetto Codex né dipende dai nomi file di fallback di Codex
per i file di persona, perché i fallback di Codex si applicano solo quando
`AGENTS.md` manca.

Per la parità dello spazio di lavoro OpenClaw, l'harness Codex risolve gli altri file di bootstrap.
`SOUL.md`, `IDENTITY.md`, `TOOLS.md` e `USER.md` vengono inoltrati come
istruzioni per sviluppatori OpenClaw Codex perché definiscono l'agente attivo,
le indicazioni disponibili dello spazio di lavoro e il profilo utente. L'elenco compatto delle Skills
OpenClaw viene inoltrato come istruzioni per sviluppatori di collaborazione con ambito di turno.
Il contenuto di `HEARTBEAT.md` non viene iniettato; i turni heartbeat ricevono un
puntatore in modalità collaborazione per leggere il file quando esiste e non è vuoto. Il contenuto di `MEMORY.md`
dallo spazio di lavoro dell'agente configurato non viene incollato nell'input del turno nativo di Codex
quando gli strumenti di memoria sono disponibili per quello spazio di lavoro; quando esiste, l'harness
aggiunge un piccolo puntatore alla memoria dello spazio di lavoro alle istruzioni per sviluppatori di collaborazione
con ambito di turno e Codex dovrebbe usare `memory_search` o `memory_get` quando la memoria
duratura è rilevante. Se gli strumenti sono disabilitati, la ricerca in memoria non è disponibile o lo
spazio di lavoro attivo è diverso dallo spazio di lavoro della memoria dell'agente, `MEMORY.md` usa il
normale percorso delimitato del contesto di turno.
`BOOTSTRAP.md`, quando presente, viene inoltrato come contesto di riferimento dell'input del turno
OpenClaw.

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
