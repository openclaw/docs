---
read_when:
    - Si desidera utilizzare l’harness ufficiale dell’app server Codex
    - Servono esempi di configurazione dell'harness Codex
    - Si vuole che le distribuzioni basate esclusivamente su Codex restituiscano un errore anziché ricorrere a OpenClaw come fallback
summary: Esegui i turni dell'agente integrato di OpenClaw tramite l'harness ufficiale dell'app-server Codex
title: Harness di Codex
x-i18n:
    generated_at: "2026-07-16T14:37:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 7f27d934036ca6952ec12bbda3d275d08701a38ac9c79df37fc6040f01b529cd
    source_path: plugins/codex-harness.md
    workflow: 16
---

Il plugin ufficiale `codex` esegue i turni dell'agente OpenAI incorporati tramite Codex
app-server anziché tramite l'harness OpenClaw integrato. Codex gestisce la
sessione dell'agente di basso livello: ripresa nativa dei thread, continuazione nativa degli strumenti,
compattazione nativa ed esecuzione tramite app-server. OpenClaw continua a gestire i canali
di chat, i file di sessione, la selezione del modello, gli strumenti dinamici di OpenClaw, le approvazioni,
la distribuzione dei contenuti multimediali e la copia visibile della trascrizione.

Usare riferimenti canonici ai modelli OpenAI, come `openai/gpt-5.6-sol`. Non configurare
riferimenti GPT Codex legacy; inserire l'ordine di autenticazione dell'agente OpenAI in `auth.order.openai`.
Gli ID dei profili di autenticazione Codex legacy e le voci legacy dell'ordine di autenticazione Codex vengono
riparati da `openclaw doctor --fix`.

Quando il criterio di runtime del provider/modello non è impostato o è `auto`, il solo prefisso `openai/*`
non seleziona mai questo harness. OpenAI può selezionare Codex implicitamente solo per una
route HTTPS ufficiale esatta Platform Responses o ChatGPT Responses senza alcuna
sostituzione della richiesta definita dall'utente. Consultare
[runtime implicito dell'agente OpenAI](/it/providers/openai#implicit-agent-runtime).
Se Codex gestisce l'autenticazione prima che sia noto l'instradamento verso Platform o ChatGPT, OpenClaw
richiede comunque che ogni route candidata dichiari la compatibilità con Codex. La sola
gestione nativa dell'autenticazione non elude mai tale verifica della route.

Quando non è attiva alcuna sandbox OpenClaw, OpenClaw avvia i thread di Codex app-server
con la modalità codice nativa di Codex abilitata (la modalità solo codice rimane disattivata per impostazione predefinita), così
le funzionalità native relative all'area di lavoro e al codice restano disponibili insieme agli strumenti
dinamici di OpenClaw instradati tramite il bridge `item/tool/call` dell'app-server. Una
sandbox OpenClaw attiva o un criterio restrittivo per gli strumenti disabilita completamente la modalità codice nativa,
a meno che non venga abilitato il percorso sperimentale exec-server della sandbox.

Con l'impostazione predefinita `tools.exec.host: "auto"` e nessuna sandbox OpenClaw attiva,
Codex riceve anche gli strumenti `node_exec` e `node_process` per i comandi sui Node
associati. La shell nativa rimane sull'host e nell'area di lavoro di Codex app-server
(locale al Gateway per la distribuzione stdio predefinita); `node_exec` seleziona un Node per
nome o ID e mantiene in vigore il criterio di approvazione dei Node di OpenClaw. Se una allowlist
di runtime finita disabilita la modalità codice nativa e lascia il turno senza un
ambiente di esecuzione, OpenClaw mantiene invece disponibili i propri strumenti `exec` e `process`,
filtrati dal criterio, per l'esecuzione diretta senza sandbox.

Questa funzionalità nativa di Codex è distinta dalla
[modalità codice di OpenClaw](/it/reference/code-mode), un runtime QuickJS-WASI facoltativo
per le esecuzioni OpenClaw generiche con una diversa struttura di input `exec`. Per la
suddivisione più ampia tra modello, provider e runtime, iniziare da
[Runtime degli agenti](/it/concepts/agent-runtimes): `openai/gpt-5.6-sol` è il riferimento al modello,
`codex` è il runtime e Telegram, Discord, Slack o un altro
canale costituisce la superficie di comunicazione.

## Requisiti

- Il plugin ufficiale `@openclaw/codex` installato. Includere `codex` in
  `plugins.allow` se la configurazione utilizza una allowlist.
- Codex app-server `0.143.0` o versione successiva. Il plugin gestisce per impostazione predefinita un
  binario compatibile, quindi un comando `codex` in `PATH` non influisce sul normale
  avvio.
- Autenticazione Codex tramite `openclaw models auth login --provider openai`, un
  account app-server già presente nella home Codex dell'agente oppure un
  profilo di autenticazione Codex esplicito con chiave API.

Per la precedenza dell'autenticazione, l'isolamento dell'ambiente, i comandi app-server personalizzati,
il rilevamento dei modelli e l'elenco completo dei campi di configurazione, consultare
[Riferimento dell'harness Codex](/it/plugins/codex-harness-reference).

## Avvio rapido

Installare il plugin ufficiale, quindi accedere con OAuth di Codex:

```bash
openclaw plugins install @openclaw/codex
openclaw models auth login --provider openai
```

Abilitare il plugin `codex` e selezionare un modello di agente OpenAI:

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
      model: "openai/gpt-5.6-sol",
    },
  },
}
```

Se la configurazione utilizza `plugins.allow`, aggiungere anche `codex`:

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

Riavviare il Gateway dopo aver modificato la configurazione del plugin. Se una chat dispone già di una
sessione, eseguire prima `/new` o `/reset`, affinché il turno successivo risolva l'harness
dalla configurazione corrente.

## Condividere i thread con Codex Desktop e CLI

L'impostazione predefinita `appServer.homeScope: "agent"` isola ciascun agente OpenClaw dallo
stato Codex nativo dell'operatore. Per consentire a un proprietario di esaminare e gestire gli
stessi thread nativi mostrati da Codex Desktop e dalla CLI Codex, abilitare la
home Codex dell'utente:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            homeScope: "user",
          },
        },
      },
    },
  },
}
```

La modalità home utente supporta un processo stdio locale gestito o il trasporto
condiviso tramite socket Unix. Utilizza `$CODEX_HOME` quando impostato e `~/.codex` in caso contrario, inclusi
l'autenticazione nativa di Codex, la configurazione, i plugin e l'archivio dei thread di tale home. OpenClaw
non inserisce un profilo di autenticazione OpenClaw in questo app-server.

I turni del proprietario ottengono lo strumento `codex_threads`: elencare, cercare, leggere, creare fork, rinominare,
archiviare e ripristinare thread nativi. Creare un fork di un thread per proseguirlo in
OpenClaw; il fork viene collegato alla sessione OpenClaw corrente e rimane
visibile agli altri client Codex nativi. L'archiviazione richiede una conferma esplicita
che il thread sia chiuso altrove. Quando è abilitata anche la supervisione,
i campi e le modifiche della trascrizione richiedono l'abilitazione corrispondente
`supervision.allowRawTranscripts` o `supervision.allowWriteControls`.

Non riprendere né scrivere simultaneamente nello stesso thread tramite App Server stdio
gestiti indipendenti. Codex coordina gli autori attivi all'interno di un singolo App Server, non
tra processi separati. La creazione di un fork è il percorso sicuro di coesistenza per le normali
sessioni stdio con home utente.

`appServer.homeScope: "user"` da solo non controlla il catalogo della flotta. Il
rilevamento delle sessioni native è abilitato mentre il plugin è attivo; impostare
`sessionCatalog.enabled: false` per rimuoverlo dalla barra laterale di OpenClaw senza
disabilitare Codex. Il catalogo utilizza una connessione di supervisione separata; senza
impostazioni di connessione `appServer` esplicite, tale connessione utilizza per impostazione predefinita stdio gestito
con home utente, mentre l'harness ordinario rimane limitato all'agente. Le impostazioni
`appServer` esplicite vengono rispettate da entrambi i percorsi. Impostare `homeScope: "user"`
esplicitamente, come sopra, quando anche l'harness ordinario deve condividere lo stato nativo.

## Supervisionare le sessioni Codex

Lo stesso plugin `codex` può elencare le sessioni Codex non archiviate dal computer del Gateway
e dai Node associati abilitati. Una sessione locale al Gateway, memorizzata o inattiva, può
creare una Chat vincolata al modello che riproduce la cronologia persistente limitata dell'utente e dell'assistente.
Il relativo collegamento privato utilizza la connessione di supervisione per lo snapshot nativo,
il ramo canonico e i turni successivi, mentre le normali sessioni Codex rimangono
limitate all'agente. Il primo avvio canonico utilizza esattamente il modello e il provider
restituiti da Codex per il fork dello snapshot. Nelle riprese successive la selezione è affidata alla
configurazione nativa di Codex; il modello OpenClaw esterno e la catena di fallback non lo
sostituiscono mai. Le righe memorizzate e inattive possono essere archiviate dopo una conferma esplicita
che non siano presenti altri esecutori. Le sorgenti attive non possono creare un ramo né essere archiviate; una Chat
supervisionata esistente può comunque essere aperta. Le sessioni dei Node associati rimangono limitate ai metadati.

Consultare [Supervisionare le sessioni Codex](/plugins/codex-supervision) per la configurazione, le regole
di ramificazione, i limiti dei Node associati, l'esposizione dei metadati e la risoluzione dei problemi.

## Configurazione

| Esigenza                                            | Impostazione                                                                                     | Posizione                          |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------ | ---------------------------------- |
| Abilitare l'harness                                 | `plugins.entries.codex.enabled: true`                                                            | Configurazione OpenClaw            |
| Nascondere il rilevamento delle sessioni Codex native | `plugins.entries.codex.config.sessionCatalog.enabled: false`                                     | Configurazione del plugin Codex    |
| Mantenere l'installazione di un plugin incluso nella allowlist | Includere `codex` in `plugins.allow`                                                               | Configurazione OpenClaw            |
| Consentire ai turni OpenAI idonei di usare Codex implicitamente | Route ufficiale esatta HTTPS Responses/ChatGPT, nessuna sostituzione della richiesta definita dall'utente, runtime non impostato/`auto` | Configurazione del provider/modello OpenAI |
| Accedere con OAuth ChatGPT/Codex                    | `openclaw models auth login --provider openai`                                                   | Profilo di autenticazione CLI      |
| Aggiungere un backup con chiave API per le esecuzioni Codex | Profilo con chiave API `openai:*` elencato dopo l'autenticazione tramite abbonamento in `auth.order.openai`                 | Profilo di autenticazione CLI + configurazione OpenClaw |
| Interrompere in modo sicuro quando Codex non è disponibile | `agentRuntime.id: "codex"` del provider o del modello                                                     | Configurazione del modello/provider OpenClaw |
| Usare traffico diretto verso l'API OpenAI           | `agentRuntime.id: "openclaw"` del provider o del modello con la normale autenticazione OpenAI                          | Configurazione del modello/provider OpenClaw |
| Regolare il comportamento dell'app-server           | `plugins.entries.codex.config.appServer.*`                                                       | Configurazione del plugin Codex    |
| Abilitare le app dei plugin Codex nativi            | `plugins.entries.codex.config.codexPlugins.*`                                                    | Configurazione del plugin Codex    |
| Abilitare Codex Computer Use                        | `plugins.entries.codex.config.computerUse.*`                                                     | Configurazione del plugin Codex    |

Preferire `auth.order.openai` per l'ordine con priorità all'abbonamento e backup tramite chiave API.
Gli ID esistenti dei profili di autenticazione Codex legacy e l'ordine di autenticazione Codex legacy sono
stato legacy riservato a doctor; non scrivere nuovi riferimenti GPT Codex legacy.

```json5
{
  auth: {
    order: {
      openai: ["openai:user@example.com", "openai:api-key-backup"],
    },
  },
}
```

Per una route effettiva compatibile con Codex, entrambi i profili precedenti rimangono candidati
per la stessa esecuzione Codex. L'ordine dei profili seleziona le credenziali, non il runtime.
La modifica dell'ordine di autenticazione non rende compatibile con Codex una route personalizzata, Completions, HTTP o
con sostituzione della richiesta.

### Compaction

Non impostare `compaction.model` o `compaction.provider` sugli agenti
basati su Codex. Codex esegue la compattazione tramite lo stato nativo dei thread dell'app-server, quindi
OpenClaw ignora tali sostituzioni locali del riepilogatore durante il runtime e
`openclaw doctor --fix` le rimuove quando l'agente utilizza Codex.

Lossless rimane supportato come motore di contesto per l'assemblaggio, l'acquisizione e
la manutenzione intorno ai turni Codex, configurato tramite
`plugins.slots.contextEngine: "lossless-claw"` e
`plugins.entries.lossless-claw.config.summaryModel`, non tramite
`agents.defaults.compaction.provider`. `openclaw doctor --fix` migra la
vecchia struttura `compaction.provider: "lossless-claw"` nello slot del motore di contesto
Lossless quando Codex è il runtime attivo, ma Codex nativo continua a
gestire la Compaction. L'harness nativo dell'app-server supporta motori di contesto
che richiedono l'assemblaggio prima del prompt; i backend CLI generici, incluso `codex-cli`,
non forniscono tale funzionalità dell'host.

Per gli agenti basati su Codex, `/compact` avvia la Compaction nativa di Codex app-server
sul thread associato. OpenClaw non attende il completamento,
non impone un timeout OpenClaw, non riavvia l'app-server condiviso e non ricorre a un
motore di contesto o a un riepilogatore OpenAI pubblico. Se l'associazione del thread
Codex nativo è mancante o obsoleta, il comando termina in modo sicuro anziché
cambiare silenziosamente il backend di Compaction.

Il resto di questa pagina illustra la struttura della distribuzione, l'instradamento con interruzione sicura, il criterio
di approvazione del guardian, i plugin Codex nativi e Computer Use. Per gli elenchi completi
delle opzioni, i valori predefiniti, gli enum, il rilevamento, l'isolamento dell'ambiente, i timeout e
i campi di trasporto dell'app-server, consultare
[Riferimento dell'harness Codex](/it/plugins/codex-harness-reference).

## Verificare il runtime Codex

Usare `/status` nella chat in cui è previsto Codex. Un turno dell'agente OpenAI
basato su Codex mostra:

```text
Runtime: OpenAI Codex
```

Quindi controllare lo stato dell'app-server Codex:

```text
/codex status
/codex models
```

`/codex status` segnala connettività dell'app-server, account, limiti di frequenza, server
MCP e skill. `/codex models` elenca il catalogo attivo dell'app-server Codex
per l'harness e l'account. Se `/status` risulta inatteso, consultare
[Risoluzione dei problemi](#troubleshooting).

## Instradamento e selezione del modello

Mantenere separati i riferimenti del provider e i criteri del runtime:

- Usare `openai/gpt-*` per la selezione canonica del modello OpenAI. Il solo prefisso
  non seleziona mai Codex.
- Quando il runtime non è impostato oppure è `auto`, solo una route ufficiale HTTPS Platform Responses
  o ChatGPT Responses esatta, senza override della richiesta definito dall'utente, può selezionare Codex
  implicitamente.
- Non usare riferimenti GPT Codex legacy nella configurazione; eseguire `openclaw doctor --fix` per
  correggere i riferimenti legacy e i pin obsoleti delle route di sessione.
- `agentRuntime.id: "codex"` rende Codex un requisito con errore bloccante per una
  route compatibile. Non rende compatibile una route effettiva incompatibile.
- `agentRuntime.id: "openclaw"` abilita esplicitamente un provider o un modello per il runtime
  OpenClaw integrato, quando ciò è intenzionale.
- `/codex ...` controlla dalla chat le conversazioni native dell'app-server Codex.
- ACP/acpx è un percorso separato per un harness esterno. Usarlo solo quando l'utente
  richiede ACP/acpx o un adattatore per harness esterno.

| Intento dell'utente                                        | Usare                                                                                                 |
| ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Collegare la chat corrente                                 | `/codex bind [thread-id] [--cwd <path>] [--model <model>] [--provider <provider>]`                    |
| Riprendere un thread Codex esistente                       | `/codex resume <thread-id>`                                                                           |
| Elencare o filtrare i thread Codex                         | `/codex threads [filter]`                                                                             |
| Elencare i plugin nativi di Codex                          | `/codex plugins list`                                                                                 |
| Abilitare o disabilitare un plugin nativo Codex configurato | `/codex plugins enable <name>`, `/codex plugins disable <name>`                                       |
| Riprendere una sessione CLI Codex archiviata come turno di un Node associato | `/codex sessions --host <node> [filter]`, quindi `/codex resume <session-id> --host <node> --bind here` |
| Visualizzare le sessioni Codex non archiviate tra più computer | Abilitare la supervisione di Codex e aprire **Sessioni Codex**                                      |
| Cambiare il modello, la modalità rapida o le autorizzazioni del thread associato | `/codex model <model>`, `/codex fast [on\|off\|status]`, `/codex permissions [default\|yolo\|status]` |
| Arrestare o guidare il turno attivo                        | `/codex stop`, `/codex steer <text>`                                                                  |
| Scollegare l'associazione corrente                         | `/codex detach` (alias `/codex unbind`)                                                               |
| Inviare solo feedback su Codex                             | `/codex diagnostics [note]`                                                                           |
| Avviare un'attività ACP/acpx                               | Comandi di sessione ACP/acpx, non `/codex`                                                               |

| Caso d'uso                                      | Configurare                                                                                                  | Verificare                              | Note                                       |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | --------------------------------------- | ------------------------------------------ |
| Route OpenAI idonea con runtime Codex nativo    | Route ufficiale HTTPS Responses/ChatGPT esatta senza override della richiesta definito dall'utente, più il plugin `codex` abilitato | `/status` mostra `Runtime: OpenAI Codex` | Percorso implicito quando il runtime non è impostato/è `auto` |
| Errore bloccante se Codex non è disponibile     | `agentRuntime.id: "codex"` del provider o del modello                                                               | Il turno non riesce invece di usare il fallback integrato | Usare per distribuzioni esclusivamente Codex |
| Traffico diretto con chiave API OpenAI tramite OpenClaw | `agentRuntime.id: "openclaw"` del provider o del modello e normale autenticazione OpenAI                         | `/status` mostra il runtime OpenClaw | Usare solo quando OpenClaw è intenzionale  |
| Configurazione legacy                           | riferimenti GPT Codex legacy                                                                                 | `openclaw doctor --fix` li riscrive     | Non scrivere nuove configurazioni in questo modo |
| Adattatore Codex ACP/acpx                       | `sessions_spawn({ runtime: "acp" })` ACP                                                                                       | Stato attività/sessione ACP             | Separato dall'harness Codex nativo          |

`agents.defaults.imageModel` segue la stessa suddivisione dei prefissi. Usare `openai/gpt-*`
per la normale route OpenAI e `codex/gpt-*` solo quando la comprensione delle immagini
deve essere eseguita mediante un turno limitato dell'app-server Codex. Doctor riscrive i riferimenti
GPT Codex legacy in `openai/gpt-*`.

## Modelli di distribuzione

### Distribuzione Codex di base

Usare la configurazione di avvio rapido per un modello OpenAI la cui route ufficiale HTTPS
effettiva sia idonea a selezionare implicitamente Codex:

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
      model: "openai/gpt-5.6-sol",
    },
  },
}
```

### Distribuzione con provider misti

Mantenere Claude come agente predefinito e aggiungere un agente Codex denominato:

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
        model: "openai/gpt-5.6-sol",
      },
    ],
  },
}
```

L'agente `main` usa il normale percorso del provider. L'agente `codex` usa l'app-server
Codex quando la sua route OpenAI effettiva rimane compatibile; aggiungere
`agentRuntime.id: "codex"` esplicito con ambito modello quando deve essere un requisito
con errore bloccante.

### Distribuzione Codex con errore bloccante

Una route OpenAI HTTPS ufficiale, esatta e idonea può risolversi in Codex quando il
plugin incluso è disponibile. Aggiungere criteri di runtime espliciti per una regola
scritta con errore bloccante:

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
      model: "openai/gpt-5.6-sol",
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

Quando Codex è imposto, OpenClaw genera un errore anticipato se la route effettiva non è dichiarata
compatibile con Codex, il plugin è disabilitato, l'app-server è troppo vecchio oppure
l'app-server non può avviarsi.

## Criteri dell'app-server

Per impostazione predefinita, il plugin avvia localmente il binario Codex gestito da OpenClaw con
trasporto stdio. Impostare `appServer.command` solo per eseguire intenzionalmente un
eseguibile diverso. Usare il trasporto WebSocket solo quando un app-server è
già in esecuzione altrove:

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

Le sessioni locali dell'app-server stdio adottano per impostazione predefinita il profilo dell'operatore locale
attendibile: `approvalPolicy: "never"`, `approvalsReviewer: "user"` e
`sandbox: "danger-full-access"`. Se i requisiti Codex locali non consentono tale
profilo YOLO implicito, OpenClaw seleziona invece autorizzazioni guardian consentite.
Quando una sandbox OpenClaw è attiva per la sessione, OpenClaw
disabilita la Code Mode nativa di Codex, i server MCP dell'utente e l'esecuzione di plugin
supportati da app per quel turno, anziché affidarsi alla sandbox lato host di Codex.
L'accesso alla shell passa invece attraverso strumenti dinamici supportati dalla sandbox OpenClaw,
come `sandbox_exec` e `sandbox_process`, quando sono disponibili i normali strumenti exec/process.

Usare la modalità exec normalizzata di OpenClaw per la revisione automatica nativa di Codex prima di
evasioni dalla sandbox o autorizzazioni aggiuntive:

```json5
{
  tools: {
    exec: {
      mode: "auto",
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

Per le sessioni dell'app-server Codex, `tools.exec.mode: "auto"` corrisponde alle approvazioni
esaminate da Codex Guardian: generalmente `approvalPolicy: "on-request"`,
`approvalsReviewer: "auto_review"` e `sandbox: "workspace-write"` quando
i requisiti locali consentono tali valori. In `tools.exec.mode: "auto"`,
OpenClaw non mantiene gli override Codex legacy non sicuri `approvalPolicy: "never"` o
`sandbox: "danger-full-access"`; usare `tools.exec.mode: "full"` per
un profilo Codex intenzionalmente privo di approvazioni. Il preset legacy
`plugins.entries.codex.config.appServer.mode: "guardian"` continua a
funzionare, ma `tools.exec.mode: "auto"` è la superficie OpenClaw normalizzata.

Per il confronto a livello di modalità con le approvazioni exec dell'host e le
autorizzazioni ACPX, consultare [Modalità di autorizzazione](/it/tools/permission-modes). Per tutti
i campi dell'app-server, l'ordine di autenticazione, l'isolamento dell'ambiente e il comportamento dei timeout,
consultare il [riferimento dell'harness Codex](/it/plugins/codex-harness-reference).

## Comandi e diagnostica

Il plugin `codex` registra `/codex` come comando slash su qualsiasi canale che
supporti i comandi di testo OpenClaw.

L'esecuzione e il controllo nativi richiedono un proprietario o un client Gateway
`operator.admin`: associazione o ripresa dei thread, invio o arresto dei turni,
modifica del modello, della modalità rapida o dello stato delle autorizzazioni, Compaction o revisione e
rimozione di un'associazione. Gli altri mittenti autorizzati mantengono i comandi di sola lettura per
stato, guida, account, modello, thread, server MCP, skill e ispezione delle associazioni.

Forme comuni:

- `/codex status` controlla connettività dell'app-server, modelli, account, limiti di
  frequenza, server MCP e skill.
- `/codex models` elenca i modelli attivi dell'app-server Codex.
- `/codex threads [filter]` elenca i thread recenti dell'app-server Codex.
- `/codex resume <thread-id>` collega la sessione OpenClaw corrente a un
  thread Codex esistente.
- `/codex bind [thread-id] [--cwd <path>] [--model <model>] [--provider <provider>]`
  collega la chat corrente.
- `/codex detach` (oppure `/codex unbind`) scollega l'associazione corrente.
- `/codex binding` descrive l'associazione corrente.
- `/codex stop` arresta il turno attivo; `/codex steer <text>` lo guida.
- `/codex model <model>`, `/codex fast [on|off|status]` e
  `/codex permissions [default|yolo|status]` modificano lo stato per conversazione.
- `/codex compact` richiede all'app-server Codex di eseguire la Compaction del thread collegato.
- `/codex review` avvia la revisione nativa di Codex per il thread collegato.
- `/codex diagnostics [note]` richiede conferma prima di inviare feedback su Codex per il
  thread collegato.
- `/codex account` mostra lo stato dell'account e dei limiti di frequenza.
- `/codex mcp` elenca lo stato dei server MCP dell'app-server Codex.
- `/codex skills` elenca le skill dell'app-server Codex.
- `/codex plugins list`, `/codex plugins enable <name>` e
  `/codex plugins disable <name>` gestiscono i plugin nativi Codex configurati.
- `/codex computer-use [status|install]` gestisce Codex Computer Use.
- `/codex help` elenca l'intero albero dei comandi.

Per la maggior parte delle segnalazioni di assistenza, iniziare con `/diagnostics [note]` nella
conversazione in cui si è verificato il bug. Il comando crea un rapporto diagnostico
del Gateway e, per le sessioni dell'harness Codex, richiede l'approvazione per inviare il
relativo pacchetto di feedback Codex. Consultare
[Esportazione della diagnostica](/it/gateway/diagnostics) per il modello di privacy e il comportamento
nelle chat di gruppo. Usare `/codex diagnostics [note]` solo quando si desidera specificamente
caricare il feedback Codex per il thread attualmente collegato senza
il pacchetto diagnostico completo del Gateway.

### Ispezionare localmente i thread Codex

Il modo più rapido per ispezionare un'esecuzione Codex problematica consiste spesso nell'aprire direttamente
il thread Codex nativo:

```bash
codex resume <thread-id>
```

Ottenere l'id del thread dalla risposta completata di `/diagnostics`, da `/codex binding`
o da `/codex threads [filter]`.

Per i meccanismi di caricamento e i confini della diagnostica a livello di runtime, consultare
[Runtime dell'harness Codex](/it/plugins/codex-harness-runtime#codex-feedback-upload).

### Ordine di autenticazione

Nella home predefinita per agente, l'autenticazione viene selezionata nel seguente ordine:

1. Profili di autenticazione OpenAI ordinati per l'agente, preferibilmente in
   `auth.order.openai`. Eseguire `openclaw doctor --fix` per migrare gli id dei profili di autenticazione
   Codex legacy e l'ordine di autenticazione Codex legacy.
2. L'account esistente dell'app-server nella home Codex dell'agente.
3. Solo per gli avvii locali dell'app-server tramite stdio, `CODEX_API_KEY`, quindi
   `OPENAI_API_KEY`, quando non è presente un account dell'app-server e l'autenticazione OpenAI
   è ancora richiesta.

Quando OpenClaw rileva un profilo di autenticazione Codex basato su un abbonamento ChatGPT,
rimuove `CODEX_API_KEY` e `OPENAI_API_KEY` dal processo figlio Codex
avviato. In questo modo, le chiavi API a livello di Gateway restano disponibili per gli embedding o
per i modelli OpenAI diretti, senza che i turni nativi dell'app-server Codex vengano
fatturati accidentalmente tramite l'API. I profili Codex espliciti con chiave API e il
fallback locale alla chiave d'ambiente tramite stdio usano l'accesso dell'app-server anziché l'ambiente
ereditato dal processo figlio. Le connessioni WebSocket dell'app-server non ricevono il fallback
alla chiave API dell'ambiente del Gateway; usare un profilo di autenticazione esplicito o l'account
dell'app-server remoto.

Se un profilo di abbonamento raggiunge un limite di utilizzo Codex, OpenClaw registra
l'ora di ripristino quando Codex la comunica e prova il profilo di autenticazione ordinato successivo
per la stessa esecuzione Codex. Una volta trascorsa l'ora di ripristino, il profilo di
abbonamento torna idoneo senza modificare il modello `openai/gpt-*`
selezionato o il runtime Codex.

Quando sono configurati Plugin Codex nativi, OpenClaw installa o aggiorna
tali Plugin tramite l'app-server connesso prima di esporre al thread Codex
le app di proprietà dei Plugin. `app/list` rimane la fonte autorevole per gli id delle app,
l'accessibilità e i metadati, ma OpenClaw gestisce la decisione di abilitazione per thread:
se la policy consente un'app accessibile elencata, OpenClaw invia
`thread/start.config.apps[appId].enabled = true` anche quando `app/list`
segnala attualmente che l'app è disabilitata. Questo percorso non inventa
installazioni di app per id sconosciuti; OpenClaw attiva solo i Plugin del marketplace
con `plugin/install` e quindi aggiorna l'inventario.

### Isolamento dell'ambiente

Per gli avvii locali dell'app-server tramite stdio, OpenClaw imposta `CODEX_HOME` su una
directory per agente, affinché la configurazione, i file di autenticazione/account, la cache/i dati dei Plugin
e lo stato nativo dei thread di Codex non leggano né scrivano per impostazione predefinita nella directory
`~/.codex` personale dell'operatore. OpenClaw conserva il normale valore `HOME` del processo;
i sottoprocessi delle esecuzioni Codex possono comunque trovare la configurazione e i token nella home dell'utente, e
Codex può rilevare le voci condivise `$HOME/.agents/skills` e
`$HOME/.agents/plugins/marketplace.json`. Con
`appServer.homeScope: "user"`, OpenClaw usa invece la home Codex nativa dell'utente
e il relativo account esistente senza inserire un profilo di autenticazione OpenClaw.

Se una distribuzione richiede ulteriore isolamento dell'ambiente, aggiungere tali
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

`appServer.clearEnv` influisce solo sul processo figlio dell'app-server Codex
avviato. OpenClaw rimuove `CODEX_HOME` e `HOME` da questo elenco durante
la normalizzazione dell'avvio locale: `CODEX_HOME` continua a puntare all'ambito
dell'agente o dell'utente selezionato e `HOME` resta ereditato, affinché i sottoprocessi possano usare
il normale stato nella home dell'utente.

### Strumenti dinamici e ricerca web

Per impostazione predefinita, gli strumenti dinamici Codex usano il caricamento `searchable`. OpenClaw normalmente
non espone strumenti dinamici che duplicano le operazioni native di Codex nell'area di lavoro:
`read`, `write`, `edit`, `apply_patch`, `exec`, `process`, `update_plan`,
`tool_call`, `tool_describe`, `tool_search` e `tool_search_code`. La maggior parte dei
rimanenti strumenti di integrazione OpenClaw, come messaggistica, contenuti multimediali, cron,
browser, nodi, Gateway e `heartbeat_respond`, è disponibile tramite
la ricerca degli strumenti Codex nello spazio dei nomi `openclaw`, mantenendo più ridotto il contesto
iniziale del modello. Il fallback alla shell per i turni con restrizioni costituisce l'eccezione per
`exec` e `process` quando una lista consentita finita disabilita la modalità Codice nativa;
le liste consentite del runtime e `codexDynamicToolsExclude` continuano ad applicarsi.

Gli strumenti contrassegnati con `catalogMode: "direct-only"`, incluso lo strumento OpenClaw `computer`,
usano invece lo spazio dei nomi `openclaw_direct`. Codex considera tale spazio dei nomi
come `DirectModelOnly`, pertanto tali strumenti restano direttamente visibili al modello nei thread normali e
riservati alla modalità Codice, anziché attraversare chiamate `tools.*` annidate della modalità Codice.

Quando la ricerca è abilitata e non è selezionato alcun provider gestito, per impostazione predefinita la ricerca web usa
lo strumento ospitato `web_search` di Codex. La ricerca ospitata nativa e
lo strumento dinamico gestito `web_search` di OpenClaw si escludono a vicenda, in modo che
la ricerca gestita non possa aggirare le restrizioni native sui domini. OpenClaw usa lo
strumento gestito quando la ricerca ospitata non è disponibile, è esplicitamente disabilitata o
è sostituita da un provider gestito selezionato. OpenClaw mantiene disabilitata l'estensione
autonoma `web.run` di Codex perché il traffico dell'app-server di produzione rifiuta
il relativo spazio dei nomi `web` definito dall'utente. `tools.web.search.enabled: false`
disabilita entrambi i percorsi, così come le esecuzioni solo LLM con gli strumenti disabilitati. Codex considera
`"cached"` una preferenza e la risolve in accesso esterno attivo per
i turni dell'app-server senza restrizioni. Il fallback gestito automatico si interrompe in modo sicuro quando
sono impostati i `allowedDomains` nativi, affinché la lista consentita non possa essere aggirata.
Le modifiche persistenti alla policy di ricerca effettiva ruotano il thread Codex associato
prima del turno successivo; le restrizioni transitorie per turno usano un thread temporaneo
con restrizioni e conservano l'associazione esistente per una ripresa successiva.

`sessions_yield` e le risposte all'origine limitate agli strumenti di messaggistica rimangono dirette perché
sono contratti di controllo del turno. `sessions_spawn` rimane ricercabile affinché
il `spawn_agent` nativo di Codex resti la principale superficie per i sottoagenti Codex,
mentre la delega esplicita tramite OpenClaw o ACP rimane disponibile attraverso lo
spazio dei nomi degli strumenti dinamici `openclaw`. Le istruzioni di collaborazione Heartbeat
indicano a Codex di cercare `heartbeat_respond` prima di terminare un turno Heartbeat
quando lo strumento non è già caricato.

Impostare `codexDynamicToolsLoading: "direct"` solo quando ci si connette a un app-server
Codex personalizzato che non può cercare strumenti dinamici differiti o durante
il debug del payload completo degli strumenti.

### Campi di configurazione

Campi di primo livello supportati del Plugin Codex:

| Campo                      | Valore predefinito        | Significato                                                                                  |
| -------------------------- | -------------- | ---------------------------------------------------------------------------------------- |
| `codexDynamicToolsLoading` | `"searchable"` | Usare `"direct"` per inserire gli strumenti dinamici OpenClaw direttamente nel contesto iniziale degli strumenti Codex. |
| `codexDynamicToolsExclude` | `[]`           | Nomi aggiuntivi degli strumenti dinamici OpenClaw da omettere nei turni dell'app-server Codex.              |
| `codexPlugins`             | disabilitato       | Supporto nativo di Codex per Plugin/app relativo ai Plugin selezionati migrati e installati dal sorgente.           |
| `sessionCatalog`           | abilitato        | Rilevamento nella barra laterale per le sessioni Codex native su questo Gateway e sui nodi associati idonei.   |
| `supervision`              | disabilitato       | Trascrizione della sessione nativa visibile all'agente e policy di controllo della scrittura.                         |

Campi `appServer` supportati:

| Campo                                         | Valore predefinito                                      | Significato                                                                                                                                                                                                                                                                                                                                                                                         |
| --------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                                   | `"stdio"`                                              | `"stdio"` avvia Codex; `"unix"` esplicito si connette al socket di controllo locale; `"websocket"` si connette a `url`.                                                                                                                                                                                                                                                                                |
| `homeScope`                                   | `"agent"`                                              | `"agent"` isola lo stato ordinario dell'harness per ciascun agente OpenClaw. `"user"` è un'adesione esplicita che condivide `$CODEX_HOME` o `~/.codex` nativo, usa l'autenticazione nativa e abilita la gestione dei thread riservata al proprietario. L'ambito utente supporta stdio locale o il trasporto Unix. Per la connessione di supervisione separata, un valore non impostato viene risolto in `"user"` per stdio o Unix e in `"agent"` per WebSocket.     |
| `command`                                     | binario Codex gestito                                   | Eseguibile per il trasporto stdio. Lasciare non impostato per usare il binario gestito; impostarlo solo per una sostituzione esplicita.                                                                                                                                                                                                                                                                                    |
| `args`                                        | `["app-server", "--listen", "stdio://"]`               | Argomenti per il trasporto stdio.                                                                                                                                                                                                                                                                                                                                                                  |
| `url`                                         | non impostato                                                  | URL dell'App Server WebSocket o URL `unix://`. Un percorso Unix esplicito vuoto seleziona il socket di controllo canonico nella directory home dell'utente.                                                                                                                                                                                                                                                                          |
| `authToken`                                   | non impostato                                                  | Token bearer per il trasporto WebSocket. Accetta una stringa letterale o SecretInput, ad esempio `${CODEX_APP_SERVER_TOKEN}`.                                                                                                                                                                                                                                                                              |
| `headers`                                     | `{}`                                                   | Header WebSocket aggiuntivi. I valori degli header accettano stringhe letterali o valori SecretInput, ad esempio `x-codex-client-session-token: "${CODEX_CLIENT_SESSION_TOKEN}"`.                                                                                                                                                                                                                               |
| `clearEnv`                                    | `[]`                                                   | Nomi di variabili d'ambiente aggiuntive rimossi dal processo app-server stdio avviato dopo che OpenClaw ha creato il relativo ambiente ereditato. OpenClaw mantiene `CODEX_HOME` selezionato e `HOME` ereditato per gli avvii locali.                                                                                                                                                                           |
| `codeModeOnly`                                | `false`                                                | Abilita esplicitamente la superficie degli strumenti di Codex riservata alla modalità codice. Gli strumenti dinamici ordinari di OpenClaw restano disponibili tramite chiamate `tools.*` annidate; gli strumenti `openclaw_direct` rimangono direttamente visibili al modello.                                                                                                                                                                                                             |
| `remoteWorkspaceRoot`                         | non impostato                                                  | Radice remota dell'area di lavoro dell'app-server Codex. Quando è impostata, OpenClaw deduce la radice dell'area di lavoro locale dall'area di lavoro OpenClaw risolta, conserva il suffisso della directory di lavoro corrente sotto questa radice remota e invia a Codex soltanto la directory di lavoro finale dell'app-server. Se la directory di lavoro è esterna alla radice dell'area di lavoro OpenClaw risolta, OpenClaw interrompe l'operazione in modo sicuro anziché inviare all'app-server remoto un percorso locale del Gateway. |
| `requestTimeoutMs`                            | `60000`                                                | Timeout per le chiamate del piano di controllo dell'app-server.                                                                                                                                                                                                                                                                                                                                                     |
| `turnCompletionIdleTimeoutMs`                 | `60000`                                                | Intervallo di quiete dopo che Codex accetta un turno o dopo una richiesta all'app-server limitata al turno, mentre OpenClaw attende `turn/completed`.                                                                                                                                                                                                                                                                    |
| `postToolRawAssistantCompletionIdleTimeoutMs` | `300000`                                               | Protezione per inattività al completamento e avanzamento usata dopo il passaggio a uno strumento, il completamento di uno strumento nativo, l'avanzamento grezzo dell'assistente successivo allo strumento, il completamento del ragionamento grezzo o l'avanzamento del ragionamento mentre OpenClaw attende `turn/completed`. Usarla per carichi di lavoro attendibili o pesanti nei quali la sintesi successiva allo strumento può legittimamente rimanere silenziosa più a lungo del budget di rilascio finale dell'assistente.                                |
| `mode`                                        | `"yolo"` salvo quando i requisiti locali di Codex non consentono YOLO | Preimpostazione per l'esecuzione YOLO o revisionata dal guardian. I requisiti stdio locali che omettono `danger-full-access`, l'approvazione `never` o il revisore `user` rendono guardian il valore predefinito implicito.                                                                                                                                                                                                           |
| `approvalPolicy`                              | `"never"` o una policy di approvazione guardian consentita       | Policy di approvazione nativa di Codex inviata all'avvio, alla ripresa o al turno del thread. I valori predefiniti di guardian preferiscono `"on-request"` quando consentito.                                                                                                                                                                                                                                                                            |
| `sandbox`                                     | `"danger-full-access"` o una sandbox guardian consentita  | Modalità sandbox nativa di Codex inviata all'avvio o alla ripresa del thread. I valori predefiniti di guardian preferiscono `"workspace-write"` quando consentito, altrimenti `"read-only"`. Quando è attiva una sandbox OpenClaw, i turni `danger-full-access` usano `workspace-write` di Codex con accesso alla rete derivato dall'impostazione di uscita della sandbox OpenClaw.                                                                                     |
| `approvalsReviewer`                           | `"user"` o un revisore guardian consentito               | Usare `"auto_review"` per consentire a Codex di revisionare le richieste di approvazione native quando permesso; altrimenti usare `guardian_subagent` o `user`. `guardian_subagent` rimane un alias legacy.                                                                                                                                                                                                                              |
| `serviceTier`                                 | non impostato                                                  | Livello di servizio opzionale dell'app-server Codex. `"priority"` abilita l'instradamento in modalità rapida, `"flex"` richiede l'elaborazione flessibile, `null` rimuove la sostituzione e il valore legacy `"fast"` è accettato come `"priority"`.                                                                                                                                                                                                 |
| `networkProxy`                                | disabilitato                                               | Abilita esplicitamente la rete basata sul profilo delle autorizzazioni di Codex per i comandi dell'app-server. OpenClaw definisce la configurazione `permissions.<profile>.network` selezionata e la seleziona con `default_permissions` anziché inviare `sandbox`.                                                                                                                                                                             |
| `experimental.sandboxExecServer`              | `false`                                                | Adesione esplicita all'anteprima che registra un ambiente Codex basato sulla sandbox OpenClaw nell'app-server Codex supportato, affinché l'esecuzione nativa di Codex possa avvenire all'interno della sandbox OpenClaw attiva.                                                                                                                                                                                                            |

`appServer.networkProxy` è esplicito perché modifica il contratto della sandbox
Codex. Quando è abilitato, OpenClaw imposta anche `features.network_proxy.enabled`
e `default_permissions` nella configurazione del thread Codex, affinché il profilo
delle autorizzazioni generato possa avviare la rete gestita da Codex. Per impostazione predefinita, OpenClaw
genera un nome di profilo `openclaw-network-<fingerprint>` resistente alle collisioni
dal corpo del profilo; usare `profileName` solo quando è richiesto un nome locale
stabile.

```json5
{
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
              unixSockets: {
                "/tmp/proxy.sock": "allow",
                "/tmp/blocked.sock": "none",
              },
              allowUpstreamProxy: true,
              proxyUrl: "http://127.0.0.1:3128",
            },
          },
        },
      },
    },
  },
}
```

Se il normale runtime app-server fosse `danger-full-access`, l'abilitazione di
`networkProxy` utilizza un accesso al file system in stile workspace per il
profilo di autorizzazione generato: l'applicazione della rete gestita da Codex
consiste in una rete sottoposta a sandbox, quindi un profilo con accesso completo
non proteggerebbe il traffico in uscita. Le voci di dominio utilizzano
`allow` o `deny`; le voci dei socket Unix utilizzano i
valori `allow` o `none` di Codex.

### Timeout delle chiamate dinamiche agli strumenti

Le chiamate dinamiche agli strumenti di proprietà di OpenClaw sono limitate
indipendentemente da `appServer.requestTimeoutMs`: per impostazione predefinita, le
richieste Codex `item/tool/call` utilizzano un watchdog OpenClaw di 90
secondi. Un argomento positivo `timeoutMs` per singola chiamata estende
o riduce il budget di quello specifico strumento, fino a un massimo di 600000 ms.
Lo strumento `image_generate` utilizza `agents.defaults.imageGenerationModel.timeoutMs`
quando la chiamata allo strumento non specifica un proprio timeout; altrimenti
utilizza il valore predefinito di 120 secondi per la generazione di immagini.
Lo strumento di comprensione dei contenuti multimediali `image`
utilizza `tools.media.image.timeoutSeconds` o il proprio valore predefinito di 60 secondi per
i contenuti multimediali; per la comprensione delle immagini, tale timeout si
applica alla richiesta stessa e non viene ridotto dal lavoro di preparazione
precedente. Al timeout, OpenClaw interrompe il segnale dello strumento dove
supportato e restituisce a Codex una risposta di strumento dinamico non riuscita,
in modo che il turno possa continuare anziché lasciare la sessione in
`processing`. Questo watchdog costituisce il budget dinamico esterno
`item/tool/call`; i timeout delle richieste specifici del provider vengono
eseguiti all'interno di tale chiamata e mantengono la propria semantica di timeout.

Dopo che Codex accetta un turno e dopo che OpenClaw risponde a una richiesta
app-server con ambito limitato al turno, l'harness si aspetta che Codex compia
progressi nel turno corrente e infine termini il turno nativo con
`turn/completed`. Se l'app-server rimane inattivo per
`appServer.turnCompletionIdleTimeoutMs`, OpenClaw tenta di interrompere il turno Codex, registra
un timeout diagnostico e libera la corsia della sessione OpenClaw affinché i
messaggi di chat successivi non restino in coda dietro un turno nativo obsoleto.
La maggior parte delle notifiche non terminali relative allo stesso turno
disattiva questo breve watchdog, poiché Codex ha dimostrato che il turno è
ancora attivo.

I passaggi di consegne degli strumenti utilizzano un budget di inattività
post-strumento più lungo: dopo che OpenClaw restituisce una risposta
`item/tool/call`, dopo il completamento di elementi di strumenti nativi come
`commandExecution`, dopo i completamenti `custom_tool_call_output`
non elaborati e dopo l'avanzamento non elaborato post-strumento dell'assistente,
i completamenti non elaborati del ragionamento o l'avanzamento del ragionamento.
La protezione utilizza `appServer.postToolRawAssistantCompletionIdleTimeoutMs` quando configurato e,
in caso contrario, per impostazione predefinita cinque minuti; lo stesso budget
estende anche il watchdog di avanzamento per la finestra di sintesi silenziosa
prima che Codex emetta il successivo evento del turno corrente. Le notifiche
globali dell'app-server, come gli aggiornamenti dei limiti di frequenza, non
reimpostano l'avanzamento di inattività del turno. I completamenti del
ragionamento, i completamenti `agentMessage` di commento e l'avanzamento
non elaborato pre-strumento del ragionamento o dell'assistente possono essere
seguiti da una risposta finale automatica, quindi utilizzano la protezione
post-avanzamento della risposta anziché liberare immediatamente la corsia della
sessione.

Solo gli elementi `agentMessage` finali/non di commento completati e i
completamenti non elaborati pre-strumento dell'assistente attivano il rilascio
dell'output dell'assistente: se Codex rimane quindi inattivo senza
`turn/completed`, OpenClaw tenta di interrompere il turno nativo e libera la
corsia della sessione. Se un altro controllo del turno prevale nella contesa
per tale rilascio, OpenClaw accetta comunque l'elemento finale completato
dell'assistente quando non rimane attiva alcuna richiesta nativa, alcun elemento
o alcun completamento di strumento dinamico, il rilascio dell'output
dell'assistente appartiene ancora all'ultimo elemento completato e non vi sono
completamenti di elementi successivi. In questo modo è possibile preservare la
risposta finale dopo il completamento del lavoro degli strumenti senza riprodurre
il turno. I delta parziali dell'assistente, le risposte precedenti obsolete e i
completamenti successivi vuoti non sono idonei.

Gli errori dell'app-server stdio riproducibili in sicurezza, inclusi i timeout
di inattività del completamento del turno senza prove relative all'assistente,
agli strumenti, a elementi attivi o a effetti collaterali, vengono ritentati una
volta con un nuovo tentativo dell'app-server. I timeout non sicuri dismettono
comunque il client app-server bloccato e liberano la corsia della sessione
OpenClaw; inoltre, cancellano l'associazione obsoleta del thread nativo anziché
essere riprodotti automaticamente. I timeout del controllo del completamento
mostrano un testo di timeout specifico di Codex: nei casi riproducibili in
sicurezza indicano che la risposta potrebbe essere incompleta, mentre nei casi
non sicuri chiedono di verificare lo stato corrente prima di riprovare. La
diagnostica pubblica dei timeout include campi strutturali quali l'ultimo metodo
di notifica dell'app-server, l'id/tipo/ruolo dell'elemento di risposta non
elaborato dell'assistente, il numero di richieste/elementi attivi e lo stato
del controllo attivato; quando l'ultima notifica è un elemento di risposta non
elaborato dell'assistente, include anche un'anteprima limitata del testo
dell'assistente. Non include il prompt non elaborato né il contenuto degli
strumenti.

### Override delle variabili d'ambiente per i test locali

- `OPENCLAW_CODEX_APP_SERVER_BIN` ignora il binario gestito quando
  `appServer.command` non è impostato.
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` è stato rimosso. Utilizzare invece
`plugins.entries.codex.config.appServer.mode: "guardian"` oppure
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` per un singolo test locale. La configurazione
è preferibile per le distribuzioni ripetibili, poiché mantiene il comportamento
del plugin nello stesso file sottoposto a revisione del resto della configurazione
dell'harness Codex.

## Plugin Codex nativi

Il supporto dei plugin Codex nativi utilizza le funzionalità di app e plugin
proprie dell'app-server Codex nello stesso thread Codex del turno dell'harness
OpenClaw. OpenClaw non converte i plugin Codex in strumenti dinamici OpenClaw
`codex_plugin_*` sintetici.

`codexPlugins` influisce solo sulle sessioni che selezionano l'harness Codex
nativo. Non ha effetto sulle esecuzioni dell'harness integrato, sulle normali
esecuzioni del provider OpenAI, sulle associazioni delle conversazioni ACP o
su altri harness.

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

La configurazione dell'app del thread viene calcolata quando OpenClaw stabilisce
una sessione dell'harness Codex o sostituisce un'associazione obsoleta del thread
Codex; non viene ricalcolata a ogni turno. Dopo aver modificato
`codexPlugins`, utilizzare `/new`, `/reset` oppure riavviare
il Gateway affinché le future sessioni dell'harness Codex inizino con il set di
app aggiornato.

Per l'idoneità alla migrazione, l'inventario delle app, i criteri relativi alle
azioni distruttive, le richieste di informazioni e la diagnostica dei plugin
nativi, consultare
[Plugin Codex nativi](/it/plugins/codex-native-plugins).

L'accesso alle app e ai plugin sul lato OpenAI è controllato dall'account Codex
connesso e, per gli spazi di lavoro Business ed Enterprise/Edu, dai controlli
delle app dello spazio di lavoro. Consultare
[Utilizzo di Codex con il proprio piano ChatGPT](https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan)
per una panoramica di OpenAI sull'account e sui controlli dello spazio di lavoro.

## Utilizzo del computer

L'utilizzo del computer dispone di una propria guida alla configurazione:
[Utilizzo del computer con Codex](/it/plugins/codex-computer-use).

In breve: OpenClaw non incorpora l'app di controllo del desktop e non esegue
direttamente le azioni sul desktop. Prepara l'app-server Codex, verifica che il
server MCP `computer-use` sia disponibile e quindi lascia a Codex la
gestione delle chiamate native agli strumenti MCP durante i turni in modalità
Codex.

## Limiti del runtime

L'harness Codex modifica solo l'esecutore di basso livello dell'agente incorporato.

- Gli strumenti dinamici OpenClaw sono supportati. Codex chiede a OpenClaw di
  eseguire tali strumenti, quindi OpenClaw rimane nel percorso di esecuzione.
- La shell nativa di Codex, le patch, MCP e gli strumenti nativi delle app sono
  di proprietà di Codex. OpenClaw può osservare o bloccare eventi nativi
  selezionati tramite il relay supportato, ma non riscrive gli argomenti degli
  strumenti nativi.
- Codex gestisce la Compaction nativa. OpenClaw conserva una copia speculare
  della trascrizione per la cronologia del canale, la ricerca,
  `/new`, `/reset` e i futuri cambi di modello o harness,
  ma non sostituisce la Compaction di Codex con un riepilogatore di OpenClaw o
  del motore di contesto.
- La generazione e la comprensione dei contenuti multimediali, la sintesi vocale,
  le approvazioni e l'output degli strumenti di messaggistica continuano a
  utilizzare le corrispondenti impostazioni di provider/modello OpenClaw.
- `tool_result_persist` si applica ai risultati degli strumenti della trascrizione
  di proprietà di OpenClaw, non ai record dei risultati degli strumenti nativi
  di Codex.

Per i livelli degli hook, le superfici V1 supportate, la gestione nativa delle
autorizzazioni, l'indirizzamento della coda, i meccanismi di caricamento dei
feedback di Codex e i dettagli della Compaction, consultare
[Runtime dell'harness Codex](/it/plugins/codex-harness-runtime).

## Risoluzione dei problemi

**Codex non appare come un normale provider `/model`:** è il
comportamento previsto per le nuove configurazioni. Selezionare un modello
`openai/gpt-*`, abilitare `plugins.entries.codex.enabled` e verificare se
`plugins.allow` esclude `codex`.

**OpenClaw utilizza l'harness integrato anziché Codex:** verificare che la route
effettiva sia esattamente una route HTTPS ufficiale Platform Responses o ChatGPT
Responses, che non contenga override della richiesta definiti dall'autore e che
il plugin Codex sia installato e abilitato. Il solo prefisso
`openai/gpt-*` non è sufficiente. Per una verifica rigorosa durante i test,
impostare `agentRuntime.id: "codex"` per il provider o il modello; la forzatura di
Codex genera un errore anziché ricorrere al fallback quando la route o l'harness
è incompatibile.

**Il runtime OpenAI Codex ricorre al percorso con chiave API:** raccogliere un
estratto anonimizzato del Gateway che mostri il modello, il runtime, il provider
selezionato e l'errore. Chiedere ai collaboratori interessati di eseguire questo
comando di sola lettura sul proprio host OpenClaw:

```bash
(
  pattern='openai/gpt-5\.[45]|openai[-]codex|agentRuntime(\.id)?|harnessRuntime|Runtime: OpenAI Codex|legacy OpenAI Codex prefix|resolveSelectedOpenAIRuntimeProvider|candidateProvider[": ]+openai|status[": ]+401|Incorrect API key|No API key|api-key path|API-key path|OAuth'

  if ls /tmp/openclaw/openclaw-*.log >/dev/null 2>&1; then
    grep -E -i -n "$pattern" /tmp/openclaw/openclaw-*.log 2>/dev/null || true
  else
    journalctl --user -u openclaw-gateway --since today --no-pager 2>/dev/null \
      | grep -E -i "$pattern" || true
  fi
) | sed -E \
    -e 's/(Authorization: Bearer )[A-Za-z0-9._~+\/-]+/\1[REDACTED]/Ig' \
    -e 's/(Bearer )[A-Za-z0-9._~+\/-]+/\1[REDACTED]/Ig' \
    -e 's/(api[_ -]?key[=: ]+)[^ ,}"]+/\1[REDACTED]/Ig' \
    -e 's/(OPENAI_API_KEY[=: ]+)[^ ,}"]+/\1[REDACTED]/Ig' \
    -e 's/sk-[A-Za-z0-9_-]{12,}/sk-[REDACTED]/g' \
    -e 's/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/[EMAIL-REDACTED]/g' \
  | tail -200
```

Gli estratti utili generalmente includono `openai/gpt-5.6-sol` o
`openai/gpt-5.6-luna`, `Runtime: OpenAI Codex`, `agentRuntime.id` o
`harnessRuntime`, `candidateProvider: "openai"` e un risultato `401`,
`Incorrect API key` o `No API key`. Un'esecuzione corretta dovrebbe
mostrare il percorso OAuth di OpenAI anziché un semplice errore della chiave API
OpenAI.

**La configurazione contiene ancora riferimenti ai modelli Codex legacy:**
eseguire `openclaw doctor --fix`. Doctor riscrive i riferimenti ai modelli legacy
come `openai/*`, rimuove i pin obsoleti del runtime della sessione e
dell'intero agente e mantiene gli override esistenti dei profili di
autenticazione.

**L'app-server viene rifiutato:** utilizzare l'app-server Codex
`0.143.0` o versione successiva. Le versioni preliminari della stessa
versione o quelle con suffisso di build, come `0.143.0-alpha.2` o
`0.143.0+custom`, vengono rifiutate perché OpenClaw verifica la versione
minima stabile del protocollo `0.143.0`.

**`/codex status` non riesce a connettersi:** verificare che il Plugin `codex`
sia abilitato, che `plugins.allow` lo includa quando è configurato un elenco di elementi consentiti
e che eventuali `appServer.command`, `url`, `authToken` personalizzati o
intestazioni siano validi.

**Il rilevamento dei modelli è lento:** ridurre
`plugins.entries.codex.config.discovery.timeoutMs` o disabilitare il rilevamento.
Consultare il [riferimento dell'harness Codex](/it/plugins/codex-harness-reference#model-discovery).

**Il trasporto WebSocket non riesce immediatamente:** verificare `appServer.url`,
`authToken`, le intestazioni e che l'app-server remoto utilizzi la stessa versione
del protocollo app-server Codex.

**Gli strumenti nativi della shell o per le patch sono bloccati con `Native hook relay
unavailable`:** il thread Codex sta ancora tentando di usare l'id di un relay di hook nativo
che non è più registrato in OpenClaw. Si tratta di un problema del trasporto
degli hook nativi Codex, non di un errore del backend ACP, del provider, di GitHub o
dei comandi della shell. Avviare una nuova sessione nella chat interessata con `/new` o `/reset`,
quindi riprovare un comando innocuo. Se funziona una volta ma la chiamata successiva
a uno strumento nativo non riesce di nuovo, considerare `/new` solo una soluzione temporanea: copiare il
prompt in una nuova sessione dopo aver riavviato l'app-server Codex o il
Gateway OpenClaw, in modo che i vecchi thread vengano eliminati e le registrazioni degli hook nativi
vengano ricreate.

**Le chiamate agli strumenti Codex creano troppi processi di hook di breve durata:** impostare
`plugins.entries.codex.config.appServer.loopDetectionPreToolUseRelay: false`
e riavviare il Gateway. Ciò disabilita soltanto il sottoprocesso Codex `PreToolUse`
utilizzato per il rilevamento dei cicli di OpenClaw e il relativo marcatore di assenza di criteri. I relay obbligatori
`before_tool_call` e quelli dei criteri per gli strumenti attendibili rimangono abilitati.

**Un modello non Codex usa l'harness integrato:** è il comportamento previsto, a meno che i criteri di runtime
del provider o del modello non lo indirizzino a un altro harness. I riferimenti dei provider
non OpenAI semplici rimangono nel normale percorso del provider in modalità `auto`.

**Computer Use è installato, ma gli strumenti non vengono eseguiti:** verificare
`/codex computer-use status` da una nuova sessione. Se uno strumento segnala
`Native hook relay unavailable`, usare la procedura di ripristino del relay di hook nativo descritta sopra.
Consultare [Codex Computer Use](/it/plugins/codex-computer-use#troubleshooting).

## Contenuti correlati

- [Riferimento dell'harness Codex](/it/plugins/codex-harness-reference)
- [Runtime dell'harness Codex](/it/plugins/codex-harness-runtime)
- [Supervisione Codex](/plugins/codex-supervision)
- [Plugin Codex nativi](/it/plugins/codex-native-plugins)
- [Codex Computer Use](/it/plugins/codex-computer-use)
- [Runtime degli agenti](/it/concepts/agent-runtimes)
- [Provider di modelli](/it/concepts/model-providers)
- [Provider OpenAI](/it/providers/openai)
- [Guida di OpenAI Codex](https://help.openai.com/en/collections/14937394-codex)
- [Plugin dell'harness per agenti](/it/plugins/sdk-agent-harness)
- [Hook dei Plugin](/it/plugins/hooks)
- [Esportazione della diagnostica](/it/gateway/diagnostics)
- [Stato](/it/cli/status)
- [Test](/it/help/testing-live#live-codex-app-server-harness-smoke)
