---
read_when:
    - È necessario ogni campo di configurazione dell'harness Codex
    - Si sta modificando il comportamento del trasporto, dell'autenticazione, del rilevamento o del timeout dell'app-server
    - Si sta eseguendo il debug dell'avvio dell'harness Codex, del rilevamento dei modelli o dell'isolamento dell'ambiente
summary: Riferimento per configurazione, autenticazione, rilevamento e server applicativo dell'harness Codex
title: Riferimento dell'harness Codex
x-i18n:
    generated_at: "2026-07-16T14:35:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 00dd9050fdc9f2c179012285540f49ada8825f29be1d4630742a4d948a5318a1
    source_path: plugins/codex-harness-reference.md
    workflow: 16
---

Questo riferimento descrive la configurazione dettagliata del plugin ufficiale `codex`.
Per le decisioni relative alla configurazione e all'instradamento, iniziare da
[harness Codex](/it/plugins/codex-harness).

## Superficie di configurazione del plugin

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
| -------------------------- | ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `discovery`                | abilitato                  | Impostazioni di individuazione dei modelli per l'app-server Codex `model/list`.                                                                                    |
| `appServer`                | app-server stdio gestito | Impostazioni di trasporto, comando, autenticazione, approvazione, sandbox e timeout. L'harness ordinario usa per impostazione predefinita lo stato con ambito agente.                        |
| `codexDynamicToolsLoading` | `"searchable"`           | Usare `"direct"` per inserire gli strumenti dinamici di OpenClaw direttamente nel contesto iniziale degli strumenti Codex.                                                       |
| `codexDynamicToolsExclude` | `[]`                     | Ulteriori nomi di strumenti dinamici di OpenClaw da omettere dai turni dell'app-server Codex.                                                                    |
| `codexPlugins`             | disabilitato                 | Supporto nativo per plugin/app Codex, incluso l'accesso facoltativo alle app degli account connessi. Vedere [Plugin Codex nativi](/it/plugins/codex-native-plugins). |
| `computerUse`              | disabilitato                 | Configurazione di Codex Computer Use. Vedere [Codex Computer Use](/it/plugins/codex-computer-use).                                                               |
| `sessionCatalog`           | abilitato                  | Individuazione nativa delle sessioni Codex per la barra laterale. Impostare `enabled: false` per disabilitare l'individuazione senza disabilitare il provider o l'harness.           |
| `supervision`              | disabilitato                 | Trascrizione delle sessioni native rivolta all'agente e criteri di controllo della scrittura. Vedere [Supervisione Codex](/plugins/codex-supervision).                          |

## Supervisione

Per impostazione predefinita, l'individuazione delle sessioni native elenca le sessioni Codex non archiviate dal computer del Gateway
e dai nodi associati che hanno fornito il consenso. Disabilitare solo tale catalogo con:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          sessionCatalog: {
            enabled: false,
          },
        },
      },
    },
  },
}
```

`supervision` controlla separatamente gli strumenti rivolti all'agente:

| Campo                 | Valore predefinito                 | Significato                                                                                                                                                                                                                                   |
| --------------------- | ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `enabled`             | `false`                 | Abilita gli strumenti di supervisione Codex rivolti all'agente. Non controlla il catalogo delle sessioni dell'operatore autenticato.                                                                                                                            |
| `endpoints`           | endpoint locale integrato | Destinazioni degli endpoint di compatibilità e avanzati per l'agente di supervisione Codex mantenuto e gli strumenti MCP autonomi. Il catalogo umano e il flusso dei rami ignorano queste destinazioni e usano l'App Server di supervisione risolto da `appServer`.       |
| `allowRawTranscripts` | `false`                 | Con la supervisione abilitata, consente all'agente autonomo o agli strumenti MCP autonomi di leggere le trascrizioni e i campi degli elenchi derivati dalle trascrizioni. Le letture `codex_threads` dei soli metadati rimangono disponibili. Non controlla la continuazione autenticata nella Control UI.     |
| `allowWriteControls`  | `false`                 | Con la supervisione abilitata, consente le mutazioni autonome `codex_threads` di fork, ridenominazione, archiviazione e ripristino dall'archivio, oltre alle operazioni autonome MCP di invio, indirizzamento e interruzione. Non elude gli altri controlli relativi ad associazione, host, stato o conferma. |

Le voci degli endpoint accettano questi campi:

| Campo          | Si applica a    | Significato                                                               |
| -------------- | ------------- | --------------------------------------------------------------------- |
| `id`           | tutti           | ID stabile dell'endpoint.                                                   |
| `label`        | tutti           | Etichetta di visualizzazione facoltativa.                                               |
| `transport`    | tutti           | `"stdio-proxy"` o `"websocket"`.                                     |
| `command`      | `stdio-proxy` | Comando facoltativo dell'App Server.                                          |
| `args`         | `stdio-proxy` | Argomenti facoltativi del comando.                                           |
| `cwd`          | `stdio-proxy` | Directory di lavoro facoltativa del processo figlio.                             |
| `url`          | `websocket`   | URL WebSocket o di un socket locale supportato obbligatorio.                     |
| `authTokenEnv` | `websocket`   | Variabile d'ambiente facoltativa il cui valore autentica l'endpoint. |

La pagina **Sessioni Codex** usa l'App Server di supervisione del plugin e mostra
solo le sessioni non archiviate. Senza impostazioni di connessione `appServer` esplicite,
tale connessione è uno stdio gestito nella home dell'utente. Le righe locali memorizzate o inattive possono creare
una chat vincolata al modello con una cronologia limitata dell'utente e dell'assistente fino all'ultimo
turno di origine terminale persistito. La relativa associazione privata mantiene su tale connessione il fork dell'istantanea,
il ramo di origine `appServer` canonico, l'inserimento della cronologia e i turni successivi.
Il primo avvio canonico usa la coppia restituita dal fork. Le riprese successive
omettono le sostituzioni di modello e provider OpenClaw, affinché Codex ripristini la
coppia persistita del thread canonico; una modifica nativa separata può aggiornare tale
coppia, ma il modello esterno e la catena di fallback non la sostituiscono mai. Le righe memorizzate e inattive
possono essere archiviate dopo la conferma che non siano presenti altri esecutori, a meno che un'altra associazione OpenClaw
attiva possieda la destinazione esatta o uno dei suoi discendenti generati non archiviati.
OpenClaw segue la paginazione dei discendenti di Codex e interrompe in modo sicuro in caso di
errori di enumerazione, cicli o esaurimento del limite di sicurezza. La conferma continua a
coprire i client nativi sconosciuti e la race condition tra stato e archiviazione. Una chat supervisionata
vincolata al modello non può essere eliminata mentre protegge l'associazione nativa.
Le origini attive non possono creare un ramo né essere archiviate, ma una chat supervisionata
esistente può comunque essere aperta. Ogni riga di un nodo associato rimane di sola lettura; il trasporto
del nodo non fornisce ancora il ciclo di vita dello streaming necessario all'harness.

Solo `appServer.homeScope: "user"` modifica quale home Codex viene usata da un processo
harness gestito; non pubblica il catalogo del parco di sistemi. L'abilitazione della supervisione non
modifica l'impostazione predefinita dell'harness. La connessione di supervisione separata usa invece
per impostazione predefinita uno stdio gestito nella home dell'utente quando non esistono impostazioni di connessione
`appServer` esplicite. Le impostazioni esplicite vengono rispettate per tale connessione.
Le associazioni supervisionate in sospeso e confermate mantengono tale connessione per ogni turno;
la supervisione disabilitata o una divergenza della connessione o del ciclo di vita causano un'interruzione sicura anziché
un fallback sull'harness nella home dell'agente. La connessione predefinita condivide le sessioni memorizzate
con i client Codex nativi, non il loro stato di attività locale al processo.

Le impostazioni `plugins.entries.codex-supervisor` precedenti sono state ritirate. Eseguire
`openclaw doctor --fix` per migrare in questo blocco la vecchia voce, le definizioni degli endpoint, i flag
dei criteri e i riferimenti di autorizzazione/esclusione dei plugin. In caso di conflitto prevalgono i valori canonici
`codex.config.supervision` espliciti.

## Trasporto dell'app-server

Per i turni ordinari dell'harness, OpenClaw avvia il binario Codex gestito distribuito
con il plugin ufficiale (attualmente `@openai/codex` `0.144.3`):

```bash
codex app-server --listen stdio://
```

In questo modo la versione dell'app-server rimane associata al plugin ufficiale `codex`, anziché
a qualunque CLI Codex separata eventualmente installata in locale. Impostare
`appServer.command` solo quando si desidera intenzionalmente un eseguibile diverso.
I turni gestiti ordinari con la home isolata predefinita dell'agente preferiscono questo
pacchetto con versione fissata anche quando è installato un bundle desktop per macOS. Quando
[Computer Use](/it/plugins/codex-computer-use) è abilitato oppure quando `homeScope` è
`"user"` e può caricare lo stato nativo di Computer Use, l'avvio gestito preferisce invece
il binario dell'app desktop che possiede le autorizzazioni macOS richieste. La stessa
regola di precedenza per il desktop si applica quando la configurazione Codex effettiva della home isolata di un agente
abilita Computer Use nativo. Se non è installato alcun bundle dell'app desktop, OpenClaw
ricorre al binario del pacchetto con versione fissata.

Il passaggio dell'eseguibile e il confinamento della configurazione nativa coordinano i client all'interno di un unico
processo Gateway in esecuzione. Riavviare il Gateway dopo che un altro processo ha modificato la
configurazione nativa del plugin Codex.

La supervisione risolve una connessione separata. Senza impostazioni di connessione
`appServer` esplicite, usa stdio gestito con `homeScope: "user"`;
l'harness ordinario rimane su stdio gestito con `homeScope: "agent"`. Le impostazioni di
connessione esplicite vengono rispettate da entrambi i percorsi. Impostare `homeScope: "user"`
esplicitamente quando l'harness ordinario deve condividere `$CODEX_HOME` (o `~/.codex`)
con i client nativi. Un'associazione supervisionata privata usa la connessione di supervisione
indipendentemente dall'impostazione predefinita dell'harness ordinario. I processi App Server
indipendenti mantengono stati attivi e di approvazione separati.

Per un app-server già in esecuzione, usare il trasporto WebSocket:

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

Campi `appServer`:

| Campo                                         | Valore predefinito                                                | Significato                                                                                                                                                                                                                                                                                                                                                                                         |
| --------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                                   | `"stdio"`                                              | `"stdio"` avvia Codex; `"unix"` esplicito si connette al socket di controllo locale; `"websocket"` si connette a `url`.                                                                                                                                                                                                                                                                                |
| `homeScope`                                   | `"agent"`                                              | `"agent"` isola lo stato ordinario dell'harness per ogni agente OpenClaw. `"user"` è un'adesione esplicita che condivide `$CODEX_HOME` o `~/.codex` nativo, usa l'autenticazione nativa e abilita la gestione dei thread riservata al proprietario. L'ambito utente supporta stdio locale o il trasporto Unix. Per la connessione di supervisione separata, un valore non impostato viene risolto in `"user"` per stdio o Unix e in `"agent"` per WebSocket.     |
| `command`                                     | binario Codex gestito                                   | Eseguibile per il trasporto stdio. Lasciare non impostato per usare il binario gestito.                                                                                                                                                                                                                                                                                                                          |
| `args`                                        | `["app-server", "--listen", "stdio://"]`               | Argomenti per il trasporto stdio.                                                                                                                                                                                                                                                                                                                                                                  |
| `url`                                         | non impostato                                                  | URL dell'App Server WebSocket o URL `unix://`. Un percorso Unix esplicito vuoto seleziona il socket di controllo canonico nella home dell'utente.                                                                                                                                                                                                                                                                          |
| `authToken`                                   | non impostato                                                  | Token bearer per il trasporto WebSocket. Accetta una stringa letterale o SecretInput, ad esempio `${CODEX_APP_SERVER_TOKEN}`.                                                                                                                                                                                                                                                                              |
| `headers`                                     | `{}`                                                   | Header WebSocket aggiuntivi. I valori degli header accettano stringhe letterali o valori SecretInput, ad esempio `x-codex-client-session-token: "${CODEX_CLIENT_SESSION_TOKEN}"`.                                                                                                                                                                                                                               |
| `clearEnv`                                    | `[]`                                                   | Nomi di variabili d'ambiente aggiuntive rimosse dal processo app-server stdio avviato dopo che OpenClaw ha creato il relativo ambiente ereditato.                                                                                                                                                                                                                                                             |
| `remoteWorkspaceRoot`                         | non impostato                                                  | Radice remota dell'area di lavoro dell'app-server Codex. Quando è impostata, OpenClaw deduce la radice dell'area di lavoro locale dall'area di lavoro OpenClaw risolta, conserva il suffisso cwd corrente sotto questa radice remota e invia a Codex solo la cwd finale dell'app-server. Se la cwd è esterna alla radice dell'area di lavoro OpenClaw risolta, OpenClaw interrompe l'operazione in modo sicuro anziché inviare all'app-server remoto un percorso locale del Gateway. |
| `loopDetectionPreToolUseRelay`                | `true`                                                 | Installa il sottoprocesso Codex `PreToolUse`, usato esclusivamente per il rilevamento dei cicli di OpenClaw e per il relativo indicatore esplicito di assenza di criteri. Impostare `false` per ridurre la moltiplicazione dei processi per strumento. Gli hook dei Plugin precedenti allo strumento e i criteri per gli strumenti attendibili installano comunque il relay richiesto.                                                                                                                                         |
| `requestTimeoutMs`                            | `60000`                                                | Timeout per le chiamate al piano di controllo dell'app-server.                                                                                                                                                                                                                                                                                                                                                     |
| `turnCompletionIdleTimeoutMs`                 | `60000`                                                | Finestra di inattività dopo che Codex accetta un turno o dopo una richiesta all'app-server relativa a un turno, mentre OpenClaw attende `turn/completed`.                                                                                                                                                                                                                                                                    |
| `postToolRawAssistantCompletionIdleTimeoutMs` | `300000`                                               | Protezione dall'inattività al completamento e dall'assenza di avanzamento, usata dopo il passaggio a uno strumento, il completamento di uno strumento nativo, l'avanzamento non elaborato dell'assistente successivo allo strumento, il completamento del ragionamento non elaborato o l'avanzamento del ragionamento, mentre OpenClaw attende `turn/completed`. Usarla per carichi di lavoro attendibili o pesanti nei quali la sintesi successiva allo strumento può legittimamente rimanere inattiva più a lungo del limite previsto per il rilascio finale dell'assistente.                                |
| `mode`                                        | `"yolo"` salvo quando i requisiti Codex locali non consentono YOLO | Preimpostazione per l'esecuzione YOLO o sottoposta alla revisione del guardian.                                                                                                                                                                                                                                                                                                                                                 |
| `approvalPolicy`                              | `"never"` o un criterio di approvazione del guardian consentito       | Criterio di approvazione nativo di Codex inviato all'avvio e alla ripresa del thread e al turno.                                                                                                                                                                                                                                                                                                                            |
| `sandbox`                                     | `"danger-full-access"` o una sandbox del guardian consentita  | Modalità sandbox nativa di Codex inviata all'avvio e alla ripresa del thread. Le sandbox OpenClaw attive restringono i turni `danger-full-access` a Codex `workspace-write`; il flag di rete del turno segue l'uscita dalla sandbox OpenClaw.                                                                                                                                                                                       |
| `approvalsReviewer`                           | `"user"` o un revisore guardian consentito               | Usare `"auto_review"` per consentire a Codex di esaminare le richieste di approvazione native, quando permesso.                                                                                                                                                                                                                                                                                                                   |
| `defaultWorkspaceDir`                         | directory del processo corrente                              | Area di lavoro usata da `/codex bind` quando `--cwd` viene omesso.                                                                                                                                                                                                                                                                                                                                        |
| `serviceTier`                                 | non impostato                                                  | Livello di servizio opzionale dell'app-server Codex. `"priority"` abilita l'instradamento in modalità rapida, `"flex"` richiede l'elaborazione flessibile e `null` elimina la sostituzione. Il valore legacy `"fast"` viene accettato come `"priority"`.                                                                                                                                                                                                 |
| `networkProxy`                                | disabilitato                                               | Abilita esplicitamente la rete del profilo di autorizzazioni Codex per i comandi dell'app-server. OpenClaw definisce la configurazione `permissions.<profile>.network` selezionata e la sceglie con `default_permissions` anziché inviare `sandbox`.                                                                                                                                                                             |
| `experimental.sandboxExecServer`              | `false`                                                | Adesione esplicita in anteprima che registra nel'app-server Codex supportato un ambiente Codex basato sulla sandbox OpenClaw, affinché l'esecuzione nativa di Codex possa avvenire all'interno della sandbox OpenClaw attiva.                                                                                                                                                                                                            |

`appServer.networkProxy` è esplicito perché modifica il contratto della sandbox di Codex. Quando è abilitato, OpenClaw imposta anche `features.network_proxy.enabled` e
`default_permissions` nella configurazione del thread Codex, affinché il profilo di autorizzazione generato possa avviare la gestione della rete da parte di Codex. Per impostazione predefinita, OpenClaw genera un nome di profilo `openclaw-network-<fingerprint>` resistente alle collisioni dal corpo del profilo; usare `profileName` solo quando è richiesto un nome locale stabile.

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
`networkProxy` usa invece un accesso al file system in stile workspace per il profilo di autorizzazione generato. L'applicazione delle restrizioni di rete gestita da Codex è una rete in sandbox, quindi un profilo con accesso completo non proteggerebbe il traffico in uscita.

Il Plugin blocca gli handshake dell'app-server meno recenti o privi di versione: l'app-server Codex deve segnalare la versione stabile `0.143.0` o successiva.

OpenClaw considera remoti gli URL WebSocket dell'app-server non loopback e richiede un'autenticazione WebSocket associata a un'identità tramite `appServer.authToken` o un'intestazione
`Authorization`. `appServer.authToken` e ogni valore `appServer.headers.*`
possono essere un SecretInput; il runtime dei segreti risolve i SecretRef e le forme abbreviate delle variabili di ambiente prima che OpenClaw crei le opzioni di avvio dell'app-server, mentre i SecretRef strutturati non risolti causano un errore prima che venga inviato qualsiasi token o intestazione. Quando sono configurati Plugin Codex nativi, OpenClaw usa il piano di controllo dei Plugin dell'app-server connesso per installare o aggiornare tali Plugin, quindi aggiorna l'inventario delle app affinché le app di proprietà dei Plugin siano visibili al thread Codex. `app/list` rimane la fonte autorevole dell'inventario e dei metadati, ma la policy di OpenClaw determina se `thread/start` invia `config.apps[appId].enabled = true` per un'app accessibile elencata, anche se Codex la contrassegna attualmente come disabilitata. Gli ID app sconosciuti o mancanti continuano a essere bloccati per impostazione predefinita; questo percorso attiva soltanto i Plugin del marketplace tramite `plugin/install` e aggiorna l'inventario. Collegare OpenClaw soltanto ad app-server remoti considerati attendibili per accettare installazioni di Plugin gestite da OpenClaw e aggiornamenti dell'inventario delle app.

## Modalità di approvazione e sandbox

Le sessioni locali dell'app-server tramite stdio usano per impostazione predefinita la modalità YOLO:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` e
`sandbox: "danger-full-access"`. Questa configurazione per operatori locali attendibili consente ai turni e agli Heartbeat automatici di OpenClaw di procedere senza richieste di approvazione native a cui nessuno è presente per rispondere.

Se il file locale dei requisiti di sistema di Codex non consente valori impliciti per l'approvazione YOLO, il revisore o la sandbox, OpenClaw considera invece l'impostazione predefinita implicita come guardian e seleziona le autorizzazioni guardian consentite. `tools.exec.mode: "auto"`
impone inoltre approvazioni Codex sottoposte a revisione guardian e non conserva le sostituzioni legacy non sicure `approvalPolicy: "never"` o `sandbox: "danger-full-access"`;
impostare `tools.exec.mode: "full"` per scegliere intenzionalmente di non richiedere approvazioni.
Le voci `[[remote_sandbox_config]]` con corrispondenza del nome host nello stesso file dei requisiti vengono rispettate nella scelta dell'impostazione predefinita della sandbox.

Impostare `appServer.mode: "guardian"` per le approvazioni Codex sottoposte a revisione guardian:

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

La preimpostazione `guardian` si espande in `approvalPolicy: "on-request"`,
`approvalsReviewer: "auto_review"` e `sandbox: "workspace-write"` quando tali valori sono consentiti. I singoli campi della policy sostituiscono `mode`. Il precedente valore del revisore
`guardian_subagent` è ancora accettato come alias di compatibilità, ma le nuove configurazioni dovrebbero usare `auto_review`.

Quando è attiva una sandbox OpenClaw, il processo locale dell'app-server Codex viene comunque eseguito sull'host del Gateway. Per quel turno OpenClaw disabilita quindi la modalità Codice nativa di Codex, i server MCP dell'utente e l'esecuzione dei Plugin supportata dalle app, anziché considerare la sandbox lato host di Codex equivalente al backend sandbox di OpenClaw. L'accesso alla shell è esposto tramite strumenti dinamici supportati dalla sandbox di OpenClaw, come `sandbox_exec` e `sandbox_process`, quando sono disponibili i normali strumenti exec/process.

<Note>
Sugli host sandbox OpenClaw basati su Docker (`agents.defaults.sandbox.mode` impostato su
un backend Docker), `openclaw doctor` verifica se l'host consente gli spazi dei nomi utente senza privilegi e, quando l'uscita di rete della sandbox Docker è disabilitata, gli spazi dei nomi di rete necessari alla sandbox Codex `bwrap` annidata per l'esecuzione della shell `workspace-write` nel container sandbox. Una verifica non riuscita si manifesta generalmente come `bwrap: setting up uid map: Permission denied` o
`bwrap: loopback: Failed RTM_NEWADDR: Operation not permitted` sugli host Ubuntu/AppArmor. Correggere la policy degli spazi dei nomi dell'host segnalata per l'utente del servizio OpenClaw e riavviare il Gateway; preferire un profilo AppArmor circoscritto per il processo del servizio rispetto alla soluzione di ripiego `kernel.apparmor_restrict_unprivileged_userns=0` estesa all'intero host e non concedere privilegi più ampi al container Docker soltanto per soddisfare la sandbox `bwrap` annidata.
</Note>

## Esecuzione nativa in sandbox

L'impostazione predefinita stabile blocca l'esecuzione in caso di errore: una sandbox OpenClaw attiva disabilita le superfici di esecuzione native di Codex che altrimenti verrebbero eseguite dall'host dell'app-server Codex. Usare `appServer.experimental.sandboxExecServer: true` solo per provare il supporto degli ambienti remoti di Codex con il backend sandbox di OpenClaw.
Questo percorso di anteprima funziona con ogni versione supportata dell'app-server Codex.

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

Quando il flag è attivo e la sessione OpenClaw corrente è in sandbox, OpenClaw avvia un exec-server loopback locale supportato dalla sandbox attiva, lo registra presso l'app-server Codex e avvia il thread e il turno Codex con tale ambiente di proprietà di OpenClaw. Se l'app-server non riesce a registrare l'ambiente, l'esecuzione viene bloccata anziché ripiegare silenziosamente sull'esecuzione nell'host.

Questo percorso di anteprima è esclusivamente locale. Un app-server WebSocket remoto non può raggiungere l'exec-server loopback, a meno che non venga eseguito sullo stesso host, quindi OpenClaw rifiuta tale combinazione.

## Isolamento dell'autenticazione e dell'ambiente

Nella home predefinita per agente, l'autenticazione viene selezionata nel seguente ordine:

1. Un profilo di autenticazione Codex OpenClaw esplicito per l'agente.
2. L'account esistente dell'app-server nella home Codex di tale agente.
3. Solo per gli avvii locali dell'app-server tramite stdio, `CODEX_API_KEY`, quindi
   `OPENAI_API_KEY`, quando non è presente alcun account dell'app-server ed è ancora richiesta l'autenticazione OpenAI.

Quando OpenClaw rileva un profilo di autenticazione Codex in stile abbonamento ChatGPT (tipo di credenziale OAuth o token), rimuove `CODEX_API_KEY` e `OPENAI_API_KEY` dal processo figlio Codex generato. In questo modo le chiavi API a livello di Gateway rimangono disponibili per gli embedding o i modelli OpenAI diretti, senza che i turni nativi dell'app-server Codex vengano addebitati accidentalmente tramite l'API.

I profili Codex espliciti con chiave API e il ripiego locale alla chiave di ambiente tramite stdio usano l'accesso dell'app-server anziché l'ambiente ereditato dal processo figlio. Le connessioni WebSocket dell'app-server non ricevono il ripiego alla chiave API dell'ambiente del Gateway; usare un profilo di autenticazione esplicito o l'account dell'app-server remoto.

Gli avvii dell'app-server tramite stdio ereditano per impostazione predefinita l'ambiente del processo OpenClaw.
OpenClaw gestisce il bridge dell'account dell'app-server Codex e imposta `CODEX_HOME` su una directory per agente nello stato OpenClaw di tale agente. In questo modo configurazione, account, cache/dati dei Plugin e stato dei thread di Codex restano circoscritti all'agente OpenClaw anziché provenire dalla home personale `~/.codex` dell'operatore.

Impostare `appServer.homeScope: "user"` per condividere lo stato nativo di Codex con Codex Desktop e la CLI. Questa modalità home utente locale supporta stdio gestito e trasporto Unix esplicito. Usa `$CODEX_HOME` quando impostato e `~/.codex`
negli altri casi, includendo autenticazione nativa, configurazione, Plugin e thread.
OpenClaw ignora il proprio bridge del profilo di autenticazione per l'app-server. I turni verificati del proprietario possono usare `codex_threads` per elencare, con un filtro `search` facoltativo, leggere, creare fork, rinominare, archiviare e rimuovere dall'archivio tali thread. Creare un fork di un thread prima di proseguirlo in OpenClaw; i processi Codex indipendenti non coordinano scritture simultanee sullo stesso thread.

Tale consenso esplicito `homeScope` si applica alle normali sessioni dell'harness. Una Chat creata tramite Codex Sessions usa invece la propria connessione di supervisione privata, che conserva la configurazione di autenticazione e del provider della connessione nativa per il ramo canonico e le riprese future.

In una Chat supervisionata con modello bloccato, `codex_threads` non può collegare un fork diverso né archiviare il thread nativo associato alla Chat. L'elenco e la lettura dei soli metadati rimangono disponibili. Le letture della trascrizione non elaborata richiedono `allowRawTranscripts`; quando è disabilitato, viene rifiutata anche la ricerca nell'elenco, perché la ricerca nativa può trovare corrispondenze nelle anteprime delle trascrizioni. La ridenominazione, la rimozione dall'archivio, il fork scollegato e l'archiviazione di un thread non correlato e non posseduto da un'altra Chat OpenClaw richiedono
`allowWriteControls`. Nessuna delle due opzioni aggira un'associazione bloccata.

OpenClaw non riscrive `HOME` per i normali avvii locali dell'app-server.
I sottoprocessi eseguiti da Codex, come `openclaw`, `gh`, `git`, le CLI cloud e i comandi shell vedono la normale home del processo e possono trovare la configurazione e i token della home utente. Codex può inoltre rilevare `$HOME/.agents/skills` e
`$HOME/.agents/plugins/marketplace.json`; tale rilevamento `.agents` è intenzionalmente condiviso con la home dell'operatore ed è distinto dallo stato isolato
`~/.codex`.

Nell'ambito predefinito dell'agente, i Plugin OpenClaw e le istantanee delle Skills OpenClaw continuano a transitare rispettivamente attraverso il registro dei Plugin e il caricatore delle skill di OpenClaw; le risorse personali `~/.codex` di Codex no. Se nella home Codex sono presenti skill o Plugin della CLI Codex utili che dovrebbero diventare parte di un agente OpenClaw isolato, inventariarli esplicitamente:

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

Se una distribuzione richiede un ulteriore isolamento dell'ambiente, aggiungere tali variabili a `appServer.clearEnv`:

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

`appServer.clearEnv` influisce soltanto sul processo figlio dell'app-server Codex generato.
OpenClaw rimuove `CODEX_HOME` e `HOME` da questo elenco durante la normalizzazione dell'avvio locale: `CODEX_HOME` continua a puntare all'ambito agente o utente selezionato, mentre `HOME` rimane ereditato affinché i sottoprocessi possano usare il normale stato della home utente.

## Strumenti dinamici

Per impostazione predefinita, gli strumenti dinamici di Codex usano il caricamento `searchable`, esposto nello spazio dei nomi
`openclaw` con `deferLoading: true`. Normalmente OpenClaw non espone gli strumenti dinamici che duplicano le operazioni native di Codex sul workspace o la superficie di ricerca degli strumenti di Codex:

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

Quando un elenco di elementi consentiti finito del runtime disabilita la modalità Codice nativa, OpenClaw invia una selezione vuota dell'ambiente di esecuzione. In tale caso diretto e senza sandbox, OpenClaw mantiene i propri strumenti `exec` e `process`, filtrati dalla policy, come ripiego per la shell. Gli elenchi di elementi consentiti del runtime e `codexDynamicToolsExclude` continuano ad applicarsi.

La maggior parte degli strumenti di integrazione OpenClaw rimanenti, come messaggistica, contenuti multimediali, cron,
browser, nodi, gateway, `heartbeat_respond` e `web_search`, è disponibile
tramite la ricerca degli strumenti di Codex in quello spazio dei nomi. In questo modo il contesto iniziale del modello
rimane più ridotto. Un piccolo insieme di strumenti resta direttamente richiamabile indipendentemente da
`codexDynamicToolsLoading`, perché la ricerca degli strumenti di Codex potrebbe non essere disponibile o
restituire un universo composto esclusivamente da connettori: `agents_list`, `sessions_spawn` e
`sessions_yield`. Le istruzioni per gli sviluppatori continuano a indirizzare i normali subagenti Codex
verso `spawn_agent` nativo per il lavoro dei subagenti nativi di Codex, mentre
`sessions_spawn` rimane disponibile per la delega esplicita OpenClaw o ACP.
Anche le risposte di origine che usano esclusivamente lo strumento di messaggistica rimangono dirette, poiché si tratta di un
contratto di controllo del turno.

Gli strumenti contrassegnati con `catalogMode: "direct-only"`, incluso lo strumento OpenClaw `computer`,
sono raggruppati sotto `openclaw_direct`. OpenClaw aggiunge tale spazio dei nomi
all'elenco `code_mode.direct_only_tool_namespaces` di Codex senza sostituire
le voci fornite dall'operatore. Codex espone quindi tali strumenti come
`DirectModelOnly` nei thread normali e in quelli riservati alla modalità codice, anziché instradarli
attraverso chiamate annidate `tools.*` della modalità codice. Questo confine è necessario per
i risultati contenenti immagini: la serializzazione annidata della modalità codice riduce l'output delle immagini a
testo, eliminando così lo screenshot necessario per la successiva azione sul computer.

Impostare `codexDynamicToolsLoading: "direct"` solo quando ci si connette a un app-server
Codex personalizzato che non può cercare strumenti dinamici differiti oppure durante il debug
del payload completo degli strumenti.

## Timeout

Le chiamate agli strumenti dinamici di proprietà di OpenClaw sono limitate indipendentemente da
`appServer.requestTimeoutMs`. Ogni richiesta Codex `item/tool/call` usa il
primo timeout disponibile nel seguente ordine:

- Un argomento `timeoutMs` positivo per singola chiamata.
- Per `image_generate`, `agents.defaults.imageGenerationModel.timeoutMs`.
- Per `image_generate` senza un timeout configurato, il valore predefinito di 120 secondi
  per la generazione di immagini.
- Per lo strumento di comprensione multimediale `image`, `tools.media.image.timeoutSeconds`
  convertito in millisecondi oppure il valore predefinito multimediale di 60 secondi. Per la comprensione
  delle immagini, questo valore si applica alla richiesta stessa e non viene ridotto dal
  lavoro di preparazione precedente.
- Per lo strumento `message`, un valore predefinito fisso di 120 secondi.
- Il valore predefinito di 90 secondi per gli strumenti dinamici.

Questo watchdog rappresenta il budget esterno del `item/tool/call` dinamico. I timeout delle richieste
specifici del provider operano all'interno di tale chiamata e mantengono la propria semantica di timeout.
I budget degli strumenti dinamici sono limitati a 600000 ms. In caso di timeout, OpenClaw interrompe il
segnale dello strumento dove supportato e restituisce a Codex una risposta di errore dello strumento dinamico,
in modo che il turno possa continuare anziché lasciare la sessione in
`processing`.

Dopo che Codex accetta un turno e dopo che OpenClaw risponde a una richiesta
dell'app-server circoscritta al turno, l'harness si aspetta che Codex compia progressi nel turno corrente
e alla fine concluda il turno nativo con `turn/completed`. Se
l'app-server non produce attività per `appServer.turnCompletionIdleTimeoutMs`, OpenClaw
tenta di interrompere il turno Codex, registra un timeout diagnostico e
libera la corsia della sessione OpenClaw, affinché i messaggi di chat successivi non vengano accodati
dietro un turno nativo obsoleto.

La maggior parte delle notifiche non terminali relative allo stesso turno disattiva questo breve watchdog,
poiché Codex ha dimostrato che il turno è ancora attivo. I passaggi di consegne degli strumenti usano un budget
di inattività post-strumento più lungo: dopo che OpenClaw restituisce una risposta `item/tool/call`,
dopo il completamento di elementi degli strumenti nativi come `commandExecution`, dopo i completamenti
`custom_tool_call_output` non elaborati e dopo il progresso non elaborato dell'assistente
successivo allo strumento, i completamenti del ragionamento non elaborati o il progresso del ragionamento. La protezione usa
`appServer.postToolRawAssistantCompletionIdleTimeoutMs` quando configurato e
altrimenti imposta come valore predefinito cinque minuti. Lo stesso budget post-strumento estende inoltre
il watchdog di avanzamento per la finestra di sintesi silenziosa prima che Codex emetta il
successivo evento del turno corrente. I completamenti del ragionamento, i completamenti `agentMessage`
di commento e il progresso del ragionamento o dell'assistente non elaborato precedente allo strumento possono essere seguiti
da una risposta finale automatica, pertanto usano la protezione della risposta post-avanzamento
anziché liberare immediatamente la corsia della sessione. Solo gli elementi `agentMessage`
completati finali/non di commento e i completamenti dell'assistente non elaborati precedenti allo strumento attivano il rilascio
dell'output dell'assistente: se Codex resta quindi inattivo senza `turn/completed`,
OpenClaw tenta di interrompere il turno nativo e libera la corsia della sessione.
Gli errori dell'app-server stdio che consentono la riproduzione sicura, inclusi i timeout di inattività al completamento
del turno senza elementi di prova relativi ad assistente, strumenti, elementi attivi o effetti collaterali, vengono
ritentati una volta mediante un nuovo tentativo dell'app-server. I timeout non sicuri dismettono comunque il
client app-server bloccato e liberano la corsia della sessione OpenClaw. Inoltre
rimuovono l'associazione obsoleta al thread nativo anziché essere riprodotti
automaticamente. I timeout del controllo del completamento mostrano testo di timeout specifico di Codex:
i casi che consentono la riproduzione sicura indicano che la risposta potrebbe essere incompleta, mentre i casi non sicuri invitano
l'utente a verificare lo stato corrente prima di riprovare. La diagnostica pubblica dei timeout
include campi strutturali come l'ultimo metodo di notifica dell'app-server,
l'id/tipo/ruolo dell'elemento di risposta non elaborato dell'assistente, il conteggio delle richieste/degli elementi attivi e
lo stato del controllo attivato. Quando l'ultima notifica è un elemento di risposta non elaborato
dell'assistente, include anche un'anteprima limitata del testo dell'assistente. Non
include il prompt non elaborato né il contenuto degli strumenti.

## Rilevamento dei modelli

Per impostazione predefinita, il Plugin Codex richiede all'app-server i modelli disponibili. La disponibilità
dei modelli è gestita dall'app-server Codex, pertanto l'elenco può cambiare quando
OpenClaw aggiorna la versione `@openai/codex` inclusa oppure quando una distribuzione
indirizza `appServer.command` a un binario Codex diverso. La disponibilità può inoltre
dipendere dall'account. Usare `/codex models` su un gateway in esecuzione per visualizzare il catalogo
attivo per tale harness e account.

Se il rilevamento non riesce o scade, OpenClaw usa un catalogo di fallback incluso:

| ID modello       | Nome visualizzato | Livelli di ragionamento        |
| -------------- | ------------ | ------------------------ |
| `gpt-5.5`      | gpt-5.5      | basso, medio, alto, molto alto |
| `gpt-5.4-mini` | GPT-5.4-Mini | basso, medio, alto, molto alto |

<Note>
L'harness attualmente incluso è `@openai/codex` `0.144.3`. Un sondaggio `model/list`
eseguito su tale app-server incluso ha restituito queste righe pubbliche del selettore:

| ID modello        | Modalità di input | Livelli di ragionamento                    |
| --------------- | ---------------- | ------------------------------------ |
| `gpt-5.6-sol`   | testo, immagine      | basso, medio, alto, molto alto, massimo, ultra |
| `gpt-5.6-terra` | testo, immagine      | basso, medio, alto, molto alto, massimo, ultra |
| `gpt-5.6-luna`  | testo, immagine      | basso, medio, alto, molto alto, massimo        |
| `gpt-5.5`       | testo, immagine      | basso, medio, alto, molto alto             |
| `gpt-5.4`       | testo, immagine      | basso, medio, alto, molto alto             |
| `gpt-5.4-mini`  | testo, immagine      | basso, medio, alto, molto alto             |
| `gpt-5.2`       | testo, immagine      | basso, medio, alto, molto alto             |

Il catalogo dell'app-server può indicare `ultra`; i controlli di ragionamento di OpenClaw attualmente
espongono livelli fino a `max`.

Le righe del selettore attivo dipendono dall'account e possono cambiare in base all'account, al catalogo
Codex o alla versione inclusa; eseguire `/codex models` per ottenere l'elenco corrente anziché
fare affidamento su una tabella riferita a un momento specifico. Anche i modelli nascosti possono comparire nel
catalogo dell'app-server per flussi interni o specializzati senza essere normali
opzioni del selettore dei modelli.
</Note>

Configurare il rilevamento sotto `plugins.entries.codex.config.discovery`:

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

Disabilitare il rilevamento quando si desidera evitare che l'avvio interroghi Codex e usare esclusivamente
il catalogo di fallback:

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

Codex gestisce autonomamente `AGENTS.md` tramite il rilevamento nativo della documentazione del progetto.
OpenClaw non scrive file sintetici di documentazione del progetto Codex né dipende dai nomi di file
di fallback di Codex per i file della persona, poiché i fallback di Codex si applicano solo quando
`AGENTS.md` è assente.

Per garantire la parità dell'area di lavoro OpenClaw, l'harness Codex inoltra gli altri
file di bootstrap come istruzioni per gli sviluppatori, ma non in modo identico:

- `TOOLS.md` viene inoltrato come istruzioni per gli sviluppatori Codex **ereditate**, pertanto
  anche i subagenti Codex nativi generati durante il turno lo ricevono.
- `SOUL.md`, `IDENTITY.md` e `USER.md` vengono inoltrati come istruzioni di collaborazione **circoscritte al turno**.
  I subagenti Codex nativi non le ereditano,
  evitando così che i turni dei subagenti acquisiscano la persona e
  il profilo utente dell'agente padre.
- Anche l'elenco compatto delle Skills OpenClaw caricate viene inoltrato come istruzioni per gli sviluppatori
  relative alla collaborazione e circoscritte al turno, pertanto nemmeno i subagenti Codex nativi
  lo ereditano.
- Il contenuto di `HEARTBEAT.md` non viene inserito; i turni Heartbeat ricevono un
  riferimento in modalità collaborazione per leggere il file quando esiste e non è
  vuoto.
- Il contenuto di `MEMORY.md` proveniente dall'area di lavoro configurata dell'agente non viene incollato nell'input
  del turno Codex nativo quando gli strumenti di memoria sono disponibili per tale
  area di lavoro; quando esiste, l'harness aggiunge un breve riferimento alla memoria dell'area di lavoro
  nelle istruzioni per gli sviluppatori relative alla collaborazione e circoscritte al turno, e Codex
  dovrebbe usare `memory_search` o `memory_get` quando la memoria persistente è pertinente.
  Se gli strumenti sono disabilitati, la ricerca nella memoria non è disponibile oppure l'area di lavoro
  attiva è diversa da quella della memoria dell'agente, `MEMORY.md` usa invece il
  normale percorso limitato del contesto del turno.
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

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` è stato rimosso. Usare invece
`plugins.entries.codex.config.appServer.mode: "guardian"` oppure
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` per test locali occasionali. La configurazione è
preferibile per distribuzioni ripetibili, poiché mantiene il comportamento del Plugin nello
stesso file revisionato del resto della configurazione dell'harness Codex.

## Argomenti correlati

- [Harness Codex](/it/plugins/codex-harness)
- [Runtime dell'harness Codex](/it/plugins/codex-harness-runtime)
- [Supervisione Codex](/plugins/codex-supervision)
- [Plugin Codex nativi](/it/plugins/codex-native-plugins)
- [Uso del computer con Codex](/it/plugins/codex-computer-use)
- [Provider OpenAI](/it/providers/openai)
- [Riferimento della configurazione](/it/gateway/configuration-reference)
