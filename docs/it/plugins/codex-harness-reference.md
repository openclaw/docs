---
read_when:
    - Hai bisogno di tutti i campi di configurazione dell'harness Codex
    - Stai modificando il comportamento di trasporto, autenticazione, rilevamento o timeout dell'app-server
    - Stai eseguendo il debug dell'avvio dell'harness Codex, del rilevamento dei modelli o dell'isolamento dell'ambiente
summary: Riferimento per configurazione, autenticazione, rilevamento e server applicativo dell'harness Codex
title: Riferimento dell'harness Codex
x-i18n:
    generated_at: "2026-07-12T07:16:22Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: eb3dcb14d9dbd70a225c13f239369b6d9d2cc0b0681aa29265f528287a6a8e4c
    source_path: plugins/codex-harness-reference.md
    workflow: 16
---

Questo riferimento tratta la configurazione dettagliata del Plugin ufficiale `codex`.
Per la configurazione e le decisioni di instradamento, inizia da
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

Campi di primo livello:

| Campo                      | Valore predefinito                  | Significato                                                                                                                                        |
| -------------------------- | ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `discovery`                | abilitato                           | Impostazioni di rilevamento dei modelli per `model/list` dell'app-server Codex.                                                                    |
| `appServer`                | app-server stdio gestito            | Impostazioni di trasporto, comando, autenticazione, approvazione, sandbox e timeout. Per impostazione predefinita, l'harness ordinario usa lo stato con ambito agente. |
| `codexDynamicToolsLoading` | `"searchable"`                      | Usa `"direct"` per inserire gli strumenti dinamici di OpenClaw direttamente nel contesto iniziale degli strumenti Codex.                           |
| `codexDynamicToolsExclude` | `[]`                                | Ulteriori nomi di strumenti dinamici di OpenClaw da omettere dai turni dell'app-server Codex.                                                       |
| `codexPlugins`             | disabilitato                        | Supporto nativo per Plugin/app Codex, incluso l'accesso esplicito alle app degli account connessi. Consulta [Plugin Codex nativi](/it/plugins/codex-native-plugins). |
| `computerUse`              | disabilitato                        | Configurazione di Codex Computer Use. Consulta [Codex Computer Use](/it/plugins/codex-computer-use).                                                   |
| `supervision`              | disabilitato                        | Catalogo delle sessioni native non archiviate, continuazione del ramo locale e criteri degli strumenti agente. Consulta [supervisione Codex](/plugins/codex-supervision). |

## Supervisione

La supervisione elenca le sessioni Codex non archiviate dal computer del Gateway e
dai nodi associati che hanno fornito il consenso. Abilitala indipendentemente dall'harness dell'agente:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          supervision: {
            enabled: true,
          },
        },
      },
    },
  },
}
```

Campi di `supervision`:

| Campo                 | Valore predefinito          | Significato                                                                                                                                                                                                                                   |
| --------------------- | --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `enabled`             | `false`                     | Pubblicizza il catalogo delle sessioni locali e, sul Gateway, aggrega i cataloghi dei nodi associati che hanno fornito il consenso per la pagina Sessioni Codex.                                                                               |
| `endpoints`           | endpoint locale integrato   | Destinazioni endpoint avanzate e di compatibilità per l'agente di supervisione Codex mantenuto e gli strumenti MCP autonomi. Il catalogo per utenti e il flusso dei rami ignorano queste destinazioni e usano l'App Server di supervisione risolto da `appServer`. |
| `allowRawTranscripts` | `false`                     | Con la supervisione abilitata, consente agli agenti autonomi o agli strumenti MCP autonomi di leggere le trascrizioni e i campi degli elenchi derivati dalle trascrizioni. Le letture dei soli metadati di `codex_threads` restano disponibili. Non controlla la continuazione autenticata dell'interfaccia di controllo. |
| `allowWriteControls`  | `false`                     | Con la supervisione abilitata, consente le mutazioni autonome di fork, ridenominazione, archiviazione e ripristino dall'archivio tramite `codex_threads`, oltre alle operazioni autonome MCP di invio, orientamento e interruzione. Non elude gli altri controlli relativi ad associazione, host, stato o conferma. |

Le voci degli endpoint accettano questi campi:

| Campo          | Si applica a  | Significato                                                               |
| -------------- | ------------- | ------------------------------------------------------------------------- |
| `id`           | tutti         | ID stabile dell'endpoint.                                                 |
| `label`        | tutti         | Etichetta di visualizzazione facoltativa.                                 |
| `transport`    | tutti         | `"stdio-proxy"` o `"websocket"`.                                          |
| `command`      | `stdio-proxy` | Comando facoltativo dell'App Server.                                      |
| `args`         | `stdio-proxy` | Argomenti facoltativi del comando.                                        |
| `cwd`          | `stdio-proxy` | Directory di lavoro facoltativa del processo figlio.                      |
| `url`          | `websocket`   | URL WebSocket o URL socket locale supportato obbligatorio.                |
| `authTokenEnv` | `websocket`   | Variabile di ambiente facoltativa il cui valore autentica l'endpoint.     |

La pagina **Sessioni Codex** usa l'App Server di supervisione del Plugin e mostra
solo le sessioni non archiviate. Senza impostazioni di connessione `appServer` esplicite,
la connessione è stdio gestita nella home dell'utente. Le righe locali memorizzate o inattive possono creare
una chat vincolata al modello con una cronologia limitata di utente e assistente fino all'ultimo
turno sorgente terminale persistito. La relativa associazione privata mantiene il fork dell'istantanea,
il ramo canonico con origine `appServer`, l'inserimento della cronologia e i turni successivi su tale
connessione. Il primo avvio canonico usa la coppia restituita dal fork. Le riprese
successive omettono le sostituzioni del modello e del provider di OpenClaw, affinché Codex ripristini la
coppia persistita del thread canonico; una modifica nativa separata può aggiornare tale
coppia, ma il modello esterno e la catena di fallback non la sostituiscono mai. Le righe memorizzate e inattive
possono essere archiviate dopo la conferma che non vi siano altri esecutori, a meno che un'altra associazione
OpenClaw attiva non possieda la destinazione esatta o uno dei relativi discendenti generati
non archiviati. OpenClaw segue la paginazione dei discendenti di Codex e adotta un comportamento di chiusura sicura in caso di
errori di enumerazione, cicli o esaurimento del limite di sicurezza. La conferma copre comunque
i client nativi sconosciuti e la condizione di competizione tra stato e archiviazione. Una chat supervisionata
vincolata al modello non può essere eliminata mentre protegge l'associazione nativa.
Le sorgenti attive non possono creare un ramo né essere archiviate, ma una chat supervisionata
esistente può comunque essere aperta. Ogni riga di un nodo associato rimane di sola lettura; il trasporto
del nodo non fornisce ancora il ciclo di vita dello streaming richiesto dall'harness.

`appServer.homeScope: "user"` da solo modifica quale home Codex utilizza un processo
harness gestito; non pubblica il catalogo della flotta. L'abilitazione della supervisione non
modifica l'impostazione predefinita dell'harness. La connessione di supervisione separata, invece,
usa per impostazione predefinita stdio gestita nella home dell'utente quando non esistono impostazioni di connessione
`appServer` esplicite. Le impostazioni esplicite vengono rispettate per tale connessione.
Le associazioni supervisionate in sospeso e confermate mantengono tale connessione per ogni turno;
la supervisione disabilitata o una divergenza della connessione o del ciclo di vita comportano una chiusura sicura anziché
il fallback sull'harness nella home dell'agente. La connessione predefinita condivide le sessioni memorizzate
con i client Codex nativi, ma non il loro stato di attività locale al processo.

Le impostazioni legacy `plugins.entries.codex-supervisor` sono state ritirate. Esegui
`openclaw doctor --fix` per migrare la vecchia voce, le definizioni degli endpoint, i flag dei criteri
e i riferimenti di autorizzazione/blocco del Plugin in questo blocco. In caso di conflitto, prevalgono i valori canonici
espliciti di `codex.config.supervision`.

## Trasporto dell'app-server

Per i turni ordinari dell'harness, OpenClaw avvia il binario Codex gestito distribuito
con il Plugin ufficiale (attualmente `@openai/codex` `0.144.1`):

```bash
codex app-server --listen stdio://
```

Ciò mantiene la versione dell'app-server legata al Plugin ufficiale `codex`, anziché
a qualsiasi CLI Codex separata installata localmente. Imposta
`appServer.command` solo quando desideri intenzionalmente usare un eseguibile diverso.
I turni gestiti ordinari con la home dell'agente isolata predefinita preferiscono questo
pacchetto con versione fissata anche quando è installato un bundle dell'app desktop per macOS. Quando
[Computer Use](/it/plugins/codex-computer-use) è abilitato, oppure quando `homeScope` è
`"user"` e può caricare lo stato nativo di Computer Use, l'avvio gestito preferisce invece
il binario dell'app desktop che possiede le autorizzazioni macOS necessarie. La stessa
regola di preferenza per il desktop si applica quando la configurazione Codex effettiva di una home dell'agente isolata
abilita Computer Use nativo. Se non è installato alcun bundle dell'app desktop, OpenClaw
ricorre al binario del pacchetto con versione fissata.

Il passaggio di consegne dell'eseguibile e il confinamento della configurazione nativa coordinano i client all'interno di un unico
processo Gateway in esecuzione. Riavvia il Gateway dopo che un altro processo modifica la
configurazione nativa del Plugin Codex.

La supervisione risolve una connessione separata. In assenza di impostazioni di connessione
`appServer` esplicite, usa stdio gestita con `homeScope: "user"`;
l'harness ordinario rimane stdio gestita con `homeScope: "agent"`. Le impostazioni
di connessione esplicite vengono rispettate da entrambi i percorsi. Imposta `homeScope: "user"`
esplicitamente quando l'harness ordinario deve condividere `$CODEX_HOME` (o `~/.codex`)
con i client nativi. Un'associazione supervisionata privata usa la connessione di supervisione
indipendentemente dall'impostazione predefinita dell'harness ordinario. I processi App Server
indipendenti mantengono stati in tempo reale e di approvazione separati.

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

Campi di `appServer`:

| Campo                                         | Valore predefinito                                     | Significato                                                                                                                                                                                                                                                                                                                                                                                       |
| --------------------------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                                   | `"stdio"`                                              | `"stdio"` avvia Codex; il valore esplicito `"unix"` si connette al socket di controllo locale; `"websocket"` si connette a `url`.                                                                                                                                                                                                                                                                  |
| `homeScope`                                   | `"agent"`                                              | `"agent"` isola lo stato ordinario dell'harness per ciascun agente OpenClaw. `"user"` è un'opzione esplicita che condivide il `$CODEX_HOME` nativo o `~/.codex`, usa l'autenticazione nativa e abilita la gestione dei thread riservata al proprietario. L'ambito utente supporta il trasporto stdio locale o Unix. Per la connessione di supervisione separata, un valore non impostato viene risolto in `"user"` per stdio o Unix e in `"agent"` per WebSocket. |
| `command`                                     | binario Codex gestito                                  | Eseguibile per il trasporto stdio. Lasciare il valore non impostato per usare il binario gestito.                                                                                                                                                                                                                                                                                                  |
| `args`                                        | `["app-server", "--listen", "stdio://"]`               | Argomenti per il trasporto stdio.                                                                                                                                                                                                                                                                                                                                                                  |
| `url`                                         | non impostato                                          | URL dell'App Server WebSocket o URL `unix://`. Un percorso Unix esplicito vuoto seleziona il socket di controllo canonico nella directory home dell'utente.                                                                                                                                                                                                                                         |
| `authToken`                                   | non impostato                                          | Token bearer per il trasporto WebSocket. Accetta una stringa letterale o un SecretInput come `${CODEX_APP_SERVER_TOKEN}`.                                                                                                                                                                                                                                                                         |
| `headers`                                     | `{}`                                                   | Intestazioni WebSocket aggiuntive. I valori delle intestazioni accettano stringhe letterali o valori SecretInput, ad esempio `x-codex-client-session-token: "${CODEX_CLIENT_SESSION_TOKEN}"`.                                                                                                                                                                                                       |
| `clearEnv`                                    | `[]`                                                   | Nomi aggiuntivi di variabili d'ambiente rimossi dal processo app-server stdio avviato dopo che OpenClaw ha creato il relativo ambiente ereditato.                                                                                                                                                                                                                                                   |
| `remoteWorkspaceRoot`                         | non impostato                                          | Radice remota dell'area di lavoro dell'app-server Codex. Quando è impostata, OpenClaw deduce la radice locale dell'area di lavoro dall'area di lavoro OpenClaw risolta, conserva il suffisso della cwd corrente sotto questa radice remota e invia a Codex solo la cwd finale dell'app-server. Se la cwd è esterna alla radice risolta dell'area di lavoro OpenClaw, OpenClaw interrompe l'operazione in modo sicuro anziché inviare un percorso locale del Gateway all'app-server remoto. |
| `requestTimeoutMs`                            | `60000`                                                | Timeout per le chiamate al piano di controllo dell'app-server.                                                                                                                                                                                                                                                                                                                                    |
| `turnCompletionIdleTimeoutMs`                 | `60000`                                                | Finestra di inattività dopo che Codex accetta un turno o dopo una richiesta dell'app-server relativa a un turno, mentre OpenClaw attende `turn/completed`.                                                                                                                                                                                                                                          |
| `postToolRawAssistantCompletionIdleTimeoutMs` | `300000`                                               | Protezione dall'inattività di completamento e dall'assenza di avanzamento usata dopo il passaggio di controllo a uno strumento, il completamento di uno strumento nativo, l'avanzamento grezzo dell'assistente dopo lo strumento, il completamento del ragionamento grezzo o l'avanzamento del ragionamento, mentre OpenClaw attende `turn/completed`. Usarla per carichi di lavoro attendibili o intensivi nei quali la sintesi successiva allo strumento può legittimamente rimanere inattiva più a lungo del budget di rilascio finale dell'assistente. |
| `mode`                                        | `"yolo"`, salvo che i requisiti Codex locali non consentano YOLO | Preimpostazione per l'esecuzione YOLO o sottoposta alla revisione di un supervisore.                                                                                                                                                                                                                                                                                                               |
| `approvalPolicy`                              | `"never"` o un criterio di approvazione del supervisore consentito | Criterio di approvazione nativo di Codex inviato all'avvio e alla ripresa del thread e al turno.                                                                                                                                                                                                                                                                                                   |
| `sandbox`                                     | `"danger-full-access"` o una sandbox del supervisore consentita | Modalità sandbox nativa di Codex inviata all'avvio e alla ripresa del thread. Le sandbox OpenClaw attive limitano i turni `danger-full-access` a `workspace-write` di Codex; il flag di rete del turno segue l'uscita dalla sandbox OpenClaw.                                                                                                                                                           |
| `approvalsReviewer`                           | `"user"` o un revisore supervisore consentito          | Usare `"auto_review"` per consentire a Codex di esaminare le richieste di approvazione native quando permesso.                                                                                                                                                                                                                                                                                     |
| `defaultWorkspaceDir`                         | directory del processo corrente                        | Area di lavoro usata da `/codex bind` quando `--cwd` è omesso.                                                                                                                                                                                                                                                                                                                                    |
| `serviceTier`                                 | non impostato                                          | Livello di servizio facoltativo dell'app-server Codex. `"priority"` abilita l'instradamento in modalità rapida, `"flex"` richiede l'elaborazione flessibile e `null` cancella la sostituzione. Il valore precedente `"fast"` è accettato come `"priority"`.                                                                                                                                             |
| `networkProxy`                                | disabilitato                                           | Abilita la rete basata sul profilo delle autorizzazioni Codex per i comandi dell'app-server. OpenClaw definisce la configurazione `permissions.<profile>.network` selezionata e la seleziona con `default_permissions` anziché inviare `sandbox`.                                                                                                                                                      |
| `experimental.sandboxExecServer`              | `false`                                                | Opzione di anteprima che registra nel'app-server Codex supportato un ambiente Codex basato sulla sandbox OpenClaw, affinché l'esecuzione nativa di Codex possa avvenire all'interno della sandbox OpenClaw attiva.                                                                                                                                                                                    |

`appServer.networkProxy` è esplicito perché modifica il contratto della sandbox
Codex. Quando è abilitato, OpenClaw imposta anche `features.network_proxy.enabled` e
`default_permissions` nella configurazione del thread Codex, in modo che il profilo
di autorizzazioni generato possa avviare la rete gestita da Codex. Per impostazione
predefinita, OpenClaw genera dal corpo del profilo un nome profilo
`openclaw-network-<fingerprint>` resistente alle collisioni; usare `profileName`
solo quando è necessario un nome locale stabile.

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

Se il normale runtime dell'app-server fosse `danger-full-access`, l'abilitazione di
`networkProxy` usa invece un accesso al file system in stile workspace per il profilo
di autorizzazioni generato. L'applicazione delle restrizioni di rete gestita da Codex
usa una rete in sandbox, quindi un profilo con accesso completo non proteggerebbe il
traffico in uscita.

Il Plugin blocca gli handshake dell'app-server meno recenti o senza versione: l'app-server
Codex deve dichiarare la versione stabile `0.143.0` o successiva.

OpenClaw considera remoti gli URL WebSocket dell'app-server non local loopback e richiede
un'autenticazione WebSocket con identità tramite `appServer.authToken` o un'intestazione
`Authorization`. `appServer.authToken` e ogni valore `appServer.headers.*`
possono essere un SecretInput; il runtime dei segreti risolve i SecretRef e la forma
abbreviata delle variabili di ambiente prima che OpenClaw crei le opzioni di avvio
dell'app-server, mentre i SecretRef strutturati non risolti causano un errore prima
dell'invio di qualsiasi token o intestazione. Quando sono configurati Plugin nativi
Codex, OpenClaw usa il piano di controllo dei Plugin dell'app-server connesso per
installarli o aggiornarli, quindi aggiorna l'inventario delle app affinché le app
appartenenti ai Plugin siano visibili al thread Codex. `app/list` rimane la fonte
autorevole per inventario e metadati, ma i criteri di OpenClaw stabiliscono se
`thread/start` invia `config.apps[appId].enabled = true` per un'app accessibile
presente nell'elenco, anche se Codex la contrassegna attualmente come disabilitata.
Gli ID app sconosciuti o mancanti continuano a causare un errore in modalità fail-closed;
questo percorso attiva soltanto i Plugin del marketplace tramite `plugin/install` e
aggiorna l'inventario. Connetti OpenClaw soltanto ad app-server remoti considerati
affidabili per accettare installazioni di Plugin gestite da OpenClaw e aggiornamenti
dell'inventario delle app.

## Modalità di approvazione e sandbox

Per impostazione predefinita, le sessioni locali dell'app-server tramite stdio usano la modalità YOLO:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` e
`sandbox: "danger-full-access"`. Questa configurazione per un operatore locale affidabile
consente ai turni e agli Heartbeat non presidiati di OpenClaw di procedere senza richieste
di approvazione native a cui nessuno è presente per rispondere.

Se il file locale dei requisiti di sistema di Codex non consente valori YOLO impliciti
per approvazione, revisore o sandbox, OpenClaw considera invece l'impostazione predefinita
implicita come guardian e seleziona autorizzazioni guardian consentite.
`tools.exec.mode: "auto"` impone inoltre approvazioni Codex esaminate da guardian e non
mantiene le sostituzioni legacy non sicure `approvalPolicy: "never"` o
`sandbox: "danger-full-access"`; imposta `tools.exec.mode: "full"` per scegliere
intenzionalmente una configurazione senza approvazione. Le voci
`[[remote_sandbox_config]]` corrispondenti al nome host nello stesso file dei requisiti
vengono rispettate per la scelta dell'impostazione predefinita della sandbox.

Imposta `appServer.mode: "guardian"` per le approvazioni Codex esaminate da guardian:

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
valori sono consentiti. I singoli campi dei criteri sostituiscono `mode`. Il precedente
valore del revisore `guardian_subagent` è ancora accettato come alias di compatibilità,
ma le nuove configurazioni dovrebbero usare `auto_review`.

Quando è attiva una sandbox OpenClaw, il processo locale dell'app-server Codex continua
a essere eseguito sull'host del Gateway. OpenClaw disabilita quindi per quel turno la
Code Mode nativa di Codex, i server MCP dell'utente e l'esecuzione dei Plugin supportata
dalle app, anziché considerare la sandbox lato host di Codex equivalente al backend
sandbox di OpenClaw. L'accesso alla shell viene esposto tramite strumenti dinamici
supportati dalla sandbox OpenClaw, come `sandbox_exec` e `sandbox_process`, quando sono
disponibili i normali strumenti di esecuzione e gestione dei processi.

<Note>
Sugli host sandbox OpenClaw basati su Docker (`agents.defaults.sandbox.mode` impostato
su un backend Docker), `openclaw doctor` verifica se l'host consente all'utente senza
privilegi gli spazi dei nomi utente e, quando l'accesso in uscita alla rete della sandbox
Docker è disabilitato, quelli di rete, necessari al `bwrap` annidato di Codex per
l'esecuzione della shell con `workspace-write` all'interno del container sandbox.
Un controllo non riuscito si manifesta in genere come
`bwrap: setting up uid map: Permission denied` o
`bwrap: loopback: Failed RTM_NEWADDR: Operation not permitted` sugli host
Ubuntu/AppArmor. Correggi i criteri segnalati dall'host relativi agli spazi dei nomi per
l'utente del servizio OpenClaw e riavvia il Gateway; preferisci un profilo AppArmor
circoscritto per il processo del servizio rispetto all'alternativa valida per l'intero
host `kernel.apparmor_restrict_unprivileged_userns=0` e non concedere privilegi più
ampi al container Docker soltanto per soddisfare il `bwrap` annidato.
</Note>

## Esecuzione nativa in sandbox

L'impostazione predefinita stabile è fail-closed: una sandbox OpenClaw attiva disabilita
le superfici di esecuzione native di Codex che altrimenti verrebbero eseguite dall'host
dell'app-server Codex. Usa `appServer.experimental.sandboxExecServer: true` soltanto
se desideri provare il supporto degli ambienti remoti di Codex con il backend sandbox
di OpenClaw. Questo percorso di anteprima funziona con ogni versione supportata
dell'app-server Codex.

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

Quando il flag è attivo e la sessione OpenClaw corrente è in sandbox, OpenClaw avvia un
exec-server local loopback supportato dalla sandbox attiva, lo registra presso
l'app-server Codex e avvia il thread e il turno Codex con tale ambiente appartenente a
OpenClaw. Se l'app-server non riesce a registrare l'ambiente, l'esecuzione termina in
modalità fail-closed anziché ripiegare silenziosamente sull'esecuzione nell'host.

Questo percorso di anteprima è disponibile soltanto in locale. Un app-server WebSocket
remoto non può raggiungere l'exec-server local loopback se non viene eseguito sullo
stesso host, quindi OpenClaw rifiuta tale combinazione.

## Autenticazione e isolamento dell'ambiente

Nella directory home predefinita per agente, l'autenticazione viene selezionata in questo ordine:

1. Un profilo di autenticazione Codex di OpenClaw esplicito per l'agente.
2. L'account esistente dell'app-server nella directory home Codex di quell'agente.
3. Soltanto per gli avvii locali dell'app-server tramite stdio, `CODEX_API_KEY`, quindi
   `OPENAI_API_KEY`, quando non è presente alcun account dell'app-server e
   l'autenticazione OpenAI è ancora necessaria.

Quando OpenClaw rileva un profilo di autenticazione Codex in stile abbonamento ChatGPT
(OAuth o tipo di credenziale token), rimuove `CODEX_API_KEY` e `OPENAI_API_KEY` dal
processo figlio Codex avviato. In questo modo le chiavi API a livello di Gateway
rimangono disponibili per gli embedding o per i modelli OpenAI diretti, senza che i
turni nativi dell'app-server Codex vengano addebitati accidentalmente tramite l'API.

I profili espliciti con chiave API Codex e il ripiego sulle chiavi dell'ambiente per
stdio locale usano l'accesso all'app-server anziché l'ambiente ereditato dal processo
figlio. Le connessioni WebSocket all'app-server non ricevono il ripiego sulle chiavi
API dell'ambiente del Gateway; usa un profilo di autenticazione esplicito oppure
l'account proprio dell'app-server remoto.

Per impostazione predefinita, gli avvii dell'app-server tramite stdio ereditano
l'ambiente del processo OpenClaw. OpenClaw gestisce il collegamento dell'account
dell'app-server Codex e imposta `CODEX_HOME` su una directory per agente all'interno
dello stato OpenClaw di tale agente. In questo modo la configurazione, gli account,
la cache e i dati dei Plugin e lo stato dei thread di Codex rimangono circoscritti
all'agente OpenClaw anziché provenire dalla directory home personale `~/.codex`
dell'operatore.

Imposta `appServer.homeScope: "user"` per condividere lo stato nativo di Codex con
Codex Desktop e la CLI. Questa modalità locale basata sulla directory home dell'utente
supporta stdio gestito e il trasporto Unix esplicito. Usa `$CODEX_HOME` quando è
impostato e `~/.codex` in caso contrario, inclusi autenticazione, configurazione,
Plugin e thread nativi. OpenClaw ignora il proprio collegamento del profilo di
autenticazione per l'app-server. I turni verificati del proprietario possono usare
`codex_threads` per elencare i thread (con un filtro `search` facoltativo), leggerli,
crearne un fork, rinominarli, archiviarli e rimuoverli dall'archivio. Crea un fork di un
thread prima di continuarlo in OpenClaw; i processi Codex indipendenti non coordinano
scrittori simultanei per lo stesso thread.

L'abilitazione esplicita di `homeScope` si applica alle normali sessioni dell'harness.
Una Chat creata tramite Codex Sessions usa invece la propria connessione privata di
supervisione, che mantiene l'autenticazione e la configurazione del provider della
connessione nativa per il ramo canonico e le riprese future.

In una Chat supervisionata con modello bloccato, `codex_threads` non può collegare un
fork diverso né archiviare il thread nativo associato alla Chat. L'elenco e la lettura
dei soli metadati rimangono disponibili. Le letture non elaborate della trascrizione
richiedono `allowRawTranscripts`; quando è disabilitato, viene rifiutata anche la ricerca
nell'elenco, poiché la ricerca nativa può trovare corrispondenze nelle anteprime delle
trascrizioni. La ridenominazione, la rimozione dall'archivio, il fork scollegato e
l'archiviazione di un thread non correlato che non appartiene a un'altra Chat OpenClaw
richiedono `allowWriteControls`. Nessuna delle due opzioni aggira un'associazione bloccata.

OpenClaw non riscrive `HOME` per i normali avvii locali dell'app-server. I sottoprocessi
eseguiti da Codex, come `openclaw`, `gh`, `git`, le CLI cloud e i comandi di shell,
vedono la normale directory home del processo e possono trovare la configurazione e i
token della directory home dell'utente. Codex può anche individuare
`$HOME/.agents/skills` e `$HOME/.agents/plugins/marketplace.json`; tale individuazione
di `.agents` è intenzionalmente condivisa con la directory home dell'operatore ed è
separata dallo stato isolato di `~/.codex`.

Nell'ambito predefinito dell'agente, i Plugin OpenClaw e le istantanee delle Skills
OpenClaw continuano a passare rispettivamente attraverso il registro dei Plugin e il
caricatore delle Skills di OpenClaw; le risorse personali di Codex in `~/.codex` no.
Se possiedi Skills o Plugin utili della CLI Codex provenienti da una directory home
Codex che dovrebbero diventare parte di un agente OpenClaw isolato, inventariali
esplicitamente:

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

Se una distribuzione richiede un ulteriore isolamento dell'ambiente, aggiungi tali
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

`appServer.clearEnv` influisce soltanto sul processo figlio dell'app-server Codex
avviato. OpenClaw rimuove `CODEX_HOME` e `HOME` da questo elenco durante la
normalizzazione dell'avvio locale: `CODEX_HOME` continua a puntare all'ambito
dell'agente o dell'utente selezionato e `HOME` rimane ereditato affinché i sottoprocessi
possano usare il normale stato della directory home dell'utente.

## Strumenti dinamici

Per impostazione predefinita, gli strumenti dinamici di Codex usano il caricamento
`searchable`, sono esposti nello spazio dei nomi `openclaw` con
`deferLoading: true`. OpenClaw non espone strumenti dinamici che duplicano le operazioni
native di Codex sul workspace o la superficie di ricerca degli strumenti propria di Codex:

- `read`
- `write`
- `edit`
- `apply_patch`
- `exec`
- `process`
- `update_plan`
- `tool_call`
- `tool_describe`
- `tool_search`
- `tool_search_code`

La maggior parte degli altri strumenti di integrazione OpenClaw, come messaggistica,
contenuti multimediali, Cron, browser, nodi, Gateway, `heartbeat_respond` e `web_search`,
è disponibile tramite la ricerca degli strumenti di Codex in tale spazio dei nomi.
Ciò mantiene più ridotto il contesto iniziale del modello. Un piccolo insieme di
strumenti rimane richiamabile direttamente indipendentemente da
`codexDynamicToolsLoading`, perché la ricerca degli strumenti di Codex può non essere
disponibile o può risolvere un universo composto soltanto da connettori:
`agents_list`, `sessions_spawn` e `sessions_yield`. Le istruzioni per gli sviluppatori
continuano a indirizzare i normali sottoagenti Codex verso `spawn_agent` nativo per il
lavoro dei sottoagenti nativi di Codex, mentre `sessions_spawn` rimane disponibile per
la delega esplicita OpenClaw o ACP. Anche le risposte di origine che usano soltanto lo
strumento per i messaggi rimangono dirette, poiché si tratta di un contratto di controllo
del turno.

Gli strumenti contrassegnati con `catalogMode: "direct-only"`, incluso lo strumento
`computer` di OpenClaw, sono raggruppati sotto `openclaw_direct`. OpenClaw aggiunge tale
spazio dei nomi all'elenco `code_mode.direct_only_tool_namespaces` di Codex senza
sostituire le voci fornite dall'operatore. Codex espone quindi tali strumenti come
`DirectModelOnly` nei thread normali e in quelli riservati alla modalità codice, anziché
instradarli attraverso chiamate `tools.*` annidate della Code Mode. Questo confine è
necessario per i risultati contenenti immagini: la serializzazione annidata della Code
Mode converte l'output delle immagini in testo, eliminando così lo screenshot necessario
per l'azione successiva sul computer.

Imposta `codexDynamicToolsLoading: "direct"` soltanto quando ti connetti a un app-server
Codex personalizzato che non può cercare strumenti dinamici con caricamento differito
oppure durante il debug del payload completo degli strumenti.

## Timeout

Le chiamate dinamiche agli strumenti gestite da OpenClaw sono limitate indipendentemente da
`appServer.requestTimeoutMs`. Ogni richiesta Codex `item/tool/call` utilizza il
primo timeout disponibile nel seguente ordine:

- Un argomento `timeoutMs` per chiamata con valore positivo.
- Per `image_generate`, `agents.defaults.imageGenerationModel.timeoutMs`.
- Per `image_generate` senza un timeout configurato, il valore predefinito di
  120 secondi per la generazione di immagini.
- Per lo strumento `image` di comprensione dei contenuti multimediali, `tools.media.image.timeoutSeconds`
  convertito in millisecondi oppure il valore predefinito di 60 secondi per i contenuti multimediali. Per la
  comprensione delle immagini, questo valore si applica alla richiesta stessa e non viene ridotto
  dal lavoro di preparazione precedente.
- Per lo strumento `message`, un valore predefinito fisso di 120 secondi.
- Il valore predefinito di 90 secondi per gli strumenti dinamici.

Questo watchdog rappresenta il budget esterno della chiamata dinamica `item/tool/call`. I timeout
delle richieste specifici del provider vengono eseguiti all'interno di tale chiamata e mantengono
la propria semantica di timeout. I budget degli strumenti dinamici sono limitati a 600000 ms. In caso
di timeout, OpenClaw interrompe il segnale dello strumento ove supportato e restituisce a
Codex una risposta di errore dello strumento dinamico, in modo che il turno possa continuare anziché
lasciare la sessione in stato `processing`.

Dopo che Codex accetta un turno e dopo che OpenClaw risponde a una richiesta
app-server relativa al turno, l'harness si aspetta che Codex faccia progressi nel turno corrente
e che infine completi il turno nativo con `turn/completed`. Se
l'app-server non produce attività per `appServer.turnCompletionIdleTimeoutMs`, OpenClaw
tenta di interrompere il turno Codex, registra un timeout diagnostico e
libera la corsia di sessione OpenClaw, affinché i messaggi di chat successivi non rimangano in coda
dietro un turno nativo obsoleto.

La maggior parte delle notifiche non terminali dello stesso turno disattiva questo breve watchdog,
poiché Codex ha dimostrato che il turno è ancora attivo. I passaggi di controllo agli strumenti utilizzano un budget
di inattività post-strumento più lungo: dopo che OpenClaw restituisce una risposta `item/tool/call`,
dopo il completamento di elementi di strumenti nativi come `commandExecution`, dopo il
completamento di `custom_tool_call_output` non elaborati e dopo progressi post-strumento non elaborati
dell'assistente, completamenti di ragionamento non elaborati o progressi di ragionamento. La protezione utilizza
`appServer.postToolRawAssistantCompletionIdleTimeoutMs` quando configurato e,
in caso contrario, per impostazione predefinita cinque minuti. Lo stesso budget post-strumento estende inoltre
il watchdog dei progressi durante la finestra di sintesi silenziosa prima che Codex emetta il
successivo evento del turno corrente. I completamenti di ragionamento, i completamenti `agentMessage`
di commento e i progressi di ragionamento o dell'assistente non elaborati precedenti allo strumento possono essere seguiti
da una risposta finale automatica, pertanto utilizzano la protezione della risposta post-progresso
anziché liberare immediatamente la corsia di sessione. Solo gli elementi `agentMessage` completati
finali/non di commento e i completamenti dell'assistente non elaborati precedenti allo strumento attivano
il rilascio per output dell'assistente: se Codex non produce più attività senza `turn/completed`,
OpenClaw tenta di interrompere il turno nativo e libera la corsia di sessione.
Gli errori dell'app-server stdio sicuri per la riproduzione, inclusi i timeout di inattività
del completamento del turno senza evidenze relative all'assistente, agli strumenti, a elementi attivi o a effetti collaterali, vengono
ritentati una volta con un nuovo tentativo dell'app-server. I timeout non sicuri dismettono comunque
il client app-server bloccato e liberano la corsia di sessione OpenClaw. Inoltre
eliminano l'associazione obsoleta al thread nativo anziché essere riprodotti
automaticamente. I timeout di monitoraggio del completamento mostrano testo specifico di Codex:
i casi sicuri per la riproduzione indicano che la risposta potrebbe essere incompleta, mentre i casi non sicuri invitano
l'utente a verificare lo stato corrente prima di riprovare. Le diagnostiche pubbliche dei timeout
includono campi strutturali quali l'ultimo metodo di notifica dell'app-server,
l'id/il tipo/il ruolo dell'elemento di risposta non elaborato dell'assistente, il numero di richieste/elementi attivi e
lo stato del monitoraggio attivato. Quando l'ultima notifica è un elemento di risposta non elaborato
dell'assistente, includono anche un'anteprima delimitata del testo dell'assistente. Non
includono il prompt non elaborato né il contenuto degli strumenti.

## Individuazione dei modelli

Per impostazione predefinita, il Plugin Codex richiede all'app-server i modelli disponibili. La
disponibilità dei modelli è gestita dall'app-server Codex, pertanto l'elenco può cambiare quando
OpenClaw aggiorna la versione integrata di `@openai/codex` o quando una distribuzione
imposta `appServer.command` su un binario Codex diverso. La disponibilità può inoltre
dipendere dall'account. Usa `/codex models` su un Gateway in esecuzione per visualizzare il
catalogo attivo per tale harness e account.

Se l'individuazione non riesce o scade, OpenClaw utilizza un catalogo di riserva integrato:

| ID modello      | Nome visualizzato | Livelli di ragionamento   |
| --------------- | ----------------- | ------------------------ |
| `gpt-5.5`      | gpt-5.5      | low, medium, high, xhigh |
| `gpt-5.4-mini` | GPT-5.4-Mini | low, medium, high, xhigh |

<Note>
L'harness integrato corrente è `@openai/codex` `0.144.1`. Una verifica `model/list`
eseguita sull'app-server integrato ha restituito queste righe pubbliche del selettore:

| ID modello       | Modalità di input | Livelli di ragionamento               |
| ---------------- | ----------------- | ------------------------------------- |
| `gpt-5.6-sol`   | testo, immagine   | low, medium, high, xhigh, max, ultra |
| `gpt-5.6-terra` | testo, immagine   | low, medium, high, xhigh, max, ultra |
| `gpt-5.6-luna`  | testo, immagine   | low, medium, high, xhigh, max        |
| `gpt-5.5`       | testo, immagine   | low, medium, high, xhigh             |
| `gpt-5.4`       | testo, immagine   | low, medium, high, xhigh             |
| `gpt-5.4-mini`  | testo, immagine   | low, medium, high, xhigh             |
| `gpt-5.2`       | testo, immagine   | low, medium, high, xhigh             |

Il catalogo dell'app-server può riportare `ultra`; i controlli di ragionamento di OpenClaw
attualmente espongono livelli fino a `max`.

Le righe attive del selettore dipendono dall'account e possono cambiare in base all'account, al catalogo
Codex o alla versione integrata; esegui `/codex models` per ottenere l'elenco corrente anziché
fare affidamento su una tabella riferita a un momento specifico. Nel catalogo dell'app-server possono inoltre
comparire modelli nascosti per flussi interni o specializzati, senza essere normali
opzioni del selettore di modelli.
</Note>

Configura l'individuazione in `plugins.entries.codex.config.discovery`:

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

Disabilita l'individuazione quando vuoi evitare che all'avvio venga eseguita una verifica di Codex e utilizzare soltanto
il catalogo di riserva:

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

Codex gestisce autonomamente `AGENTS.md` tramite l'individuazione nativa della documentazione di progetto.
OpenClaw non scrive file sintetici di documentazione di progetto Codex né dipende dai nomi
di file di riserva di Codex per i file della persona, poiché i file di riserva di Codex si applicano solo quando
`AGENTS.md` è assente.

Per garantire la parità dell'area di lavoro OpenClaw, l'harness Codex inoltra gli altri
file di bootstrap come istruzioni per lo sviluppatore, ma non in modo identico:

- `TOOLS.md` viene inoltrato come istruzioni per lo sviluppatore Codex **ereditate**, pertanto
  anche i subagenti Codex nativi avviati durante il turno le ricevono.
- `SOUL.md`, `IDENTITY.md` e `USER.md` vengono inoltrati come istruzioni di collaborazione
  **limitate al turno**. I subagenti Codex nativi non le ereditano,
  evitando così che i turni dei subagenti acquisiscano la persona e
  il profilo utente dell'agente principale.
- Anche l'elenco compatto delle Skills OpenClaw caricate viene inoltrato come istruzioni per lo sviluppatore
  di collaborazione limitate al turno, pertanto neppure i subagenti Codex nativi
  lo ereditano.
- Il contenuto di `HEARTBEAT.md` non viene inserito; i turni Heartbeat ricevono un
  riferimento in modalità collaborazione per leggere il file quando esiste e non è
  vuoto.
- Il contenuto di `MEMORY.md` dell'area di lavoro dell'agente configurata non viene incollato
  nell'input del turno Codex nativo quando gli strumenti di memoria sono disponibili per tale
  area di lavoro; quando il file esiste, l'harness aggiunge un breve riferimento alla memoria
  dell'area di lavoro nelle istruzioni per lo sviluppatore di collaborazione limitate al turno e Codex
  dovrebbe usare `memory_search` o `memory_get` quando la memoria persistente è pertinente.
  Se gli strumenti sono disabilitati, la ricerca nella memoria non è disponibile oppure l'area di lavoro
  attiva è diversa dall'area di lavoro della memoria dell'agente, `MEMORY.md` utilizza invece il
  normale percorso delimitato del contesto del turno.
- `BOOTSTRAP.md`, quando presente, viene inoltrato come contesto di riferimento dell'input
  del turno OpenClaw.

## Sostituzioni tramite variabili d'ambiente

Le sostituzioni tramite variabili d'ambiente rimangono disponibili per i test locali:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN` ignora il binario gestito quando
`appServer.command` non è impostato.

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` è stato rimosso. Usa invece
`plugins.entries.codex.config.appServer.mode: "guardian"` oppure
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` per test locali occasionali. La configurazione è
preferibile per distribuzioni ripetibili, poiché mantiene il comportamento del Plugin nello
stesso file sottoposto a revisione del resto della configurazione dell'harness Codex.

## Contenuti correlati

- [Harness Codex](/it/plugins/codex-harness)
- [Runtime dell'harness Codex](/it/plugins/codex-harness-runtime)
- [Supervisione Codex](/plugins/codex-supervision)
- [Plugin Codex nativi](/it/plugins/codex-native-plugins)
- [Uso del computer con Codex](/it/plugins/codex-computer-use)
- [Provider OpenAI](/it/providers/openai)
- [Riferimento per la configurazione](/it/gateway/configuration-reference)
