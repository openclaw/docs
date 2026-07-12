---
read_when:
    - Gestisci un plugin OpenClaw
    - Visualizzi un avviso di compatibilità del plugin
    - Stai pianificando una migrazione dell'SDK dei plugin o del manifest
summary: Contratti di compatibilità dei Plugin, metadati di deprecazione e requisiti di migrazione
title: Compatibilità dei Plugin
x-i18n:
    generated_at: "2026-07-12T07:17:38Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 26f737e40175652cb24327c91d2af9dbf72b1b254011115f5b512a309707711c
    source_path: plugins/compatibility.md
    workflow: 16
---

OpenClaw mantiene operativi i contratti Plugin meno recenti tramite adattatori
di compatibilità denominati prima di rimuoverli. Ciò protegge i Plugin inclusi
e quelli esterni esistenti mentre evolvono i contratti dell'SDK, del manifesto,
della configurazione iniziale, della configurazione e del runtime degli agenti.

## Registro di compatibilità

I contratti di compatibilità dei Plugin sono registrati nel registro principale in
`src/plugins/compat/registry.ts`. Ogni voce include:

- un codice di compatibilità stabile
- stato: `active`, `deprecated`, `removal-pending` o `removed`
- responsabile: `sdk`, `config`, `setup`, `channel`, `provider`, `plugin-execution`,
  `agent-runtime` o `core`
- date di introduzione e deprecazione, quando applicabili
- indicazioni per la sostituzione
- documentazione, diagnostica e test che coprono il comportamento precedente e quello nuovo

Il registro è la fonte di riferimento per la pianificazione dei manutentori e per
i futuri controlli dell'analizzatore dei Plugin. Se cambia un comportamento
esposto ai Plugin, aggiungere o aggiornare la voce di compatibilità nella stessa
modifica che introduce l'adattatore.

La compatibilità delle riparazioni e delle migrazioni di Doctor viene registrata
separatamente in `src/commands/doctor/shared/deprecation-compat.ts`. Queste voci
coprono le precedenti strutture di configurazione, le strutture del registro delle
installazioni e gli shim di riparazione che potrebbe essere necessario mantenere
disponibili dopo la rimozione del percorso di compatibilità del runtime.

Le verifiche di rilascio devono controllare entrambi i registri. Non eliminare una
migrazione di Doctor solo perché la voce di compatibilità del runtime o della
configurazione corrispondente è scaduta; verificare prima che non esista un
percorso di aggiornamento supportato che richieda ancora la riparazione. Durante
la pianificazione del rilascio, convalidare nuovamente anche ogni annotazione di
sostituzione, poiché la responsabilità dei Plugin e l'ambito della configurazione
possono cambiare quando i provider e i canali vengono spostati fuori dal core.

## Criteri di deprecazione

OpenClaw non deve rimuovere un contratto Plugin documentato nella stessa versione
che introduce il relativo sostituto. Sequenza di migrazione:

1. Aggiungere il nuovo contratto.
2. Mantenere operativo il comportamento precedente tramite un adattatore di compatibilità denominato.
3. Emettere messaggi diagnostici o avvisi quando gli autori dei Plugin possono intervenire.
4. Documentare la sostituzione e la tempistica.
5. Verificare con test sia il percorso precedente sia quello nuovo.
6. Attendere il termine della finestra di migrazione annunciata.
7. Rimuovere solo con l'approvazione esplicita di una versione con modifiche incompatibili.

Le voci deprecate devono includere una data di inizio degli avvisi, una
sostituzione, un collegamento alla documentazione e una data di rimozione
definitiva non successiva a tre mesi dall'inizio degli avvisi. Non aggiungere un
percorso di compatibilità deprecato con una finestra di rimozione senza scadenza,
a meno che i manutentori non decidano esplicitamente che si tratta di
compatibilità permanente e lo contrassegnino invece come `active`.

## Aree di compatibilità attuali

Il registro attualmente contiene circa 70 codici di compatibilità relativi alle
aree seguenti. Il nuovo codice dei Plugin deve utilizzare la sostituzione prevista
in ogni area e nella guida di migrazione specifica; i Plugin esistenti possono
continuare a utilizzare un percorso di compatibilità finché la documentazione, la
diagnostica e le note di rilascio non annunciano una finestra di rimozione.

- precedenti importazioni generiche dell'SDK, come `openclaw/plugin-sdk/compat`
- precedenti strutture dei Plugin basate esclusivamente sugli hook e `before_agent_start`
- precedenti nomi degli hook di pulizia `api.on("deactivate", ...)` durante la
  migrazione dei Plugin a `gateway_stop`
- precedenti punti di ingresso dei Plugin `activate(api)` durante la migrazione dei
  Plugin a `register(api)`
- precedenti alias dell'SDK, come `openclaw/extension-api`,
  `openclaw/plugin-sdk/channel-runtime`, i costruttori di stato di
  `openclaw/plugin-sdk/command-auth`, `openclaw/plugin-sdk/test-utils` (sostituito
  dai sottopercorsi di test specifici `openclaw/plugin-sdk/*`) e gli alias di tipo
  `ClawdbotConfig` / `OpenClawSchemaType`
- comportamento relativo all'elenco consentito e all'abilitazione dei Plugin inclusi
- precedenti metadati del manifesto per le variabili di ambiente di provider e canali
- precedenti hook e alias di tipo dei Plugin provider durante la migrazione dei
  provider a hook espliciti per catalogo, autenticazione, ragionamento, riproduzione
  e trasporto
- precedenti alias del runtime, come `api.runtime.taskFlow`,
  `api.runtime.subagent.getSession`, `api.runtime.stt` e gli elementi deprecati
  `api.runtime.config.loadConfig()` / `api.runtime.config.writeConfigFile(...)`
- campi piatti dei callback `WebInboundMessage` di WhatsApp (vedere sotto)
- campi di ammissione di primo livello di `WebInboundMessage` di WhatsApp (vedere sotto)
- precedente registrazione separata dei Plugin di memoria durante la migrazione dei
  Plugin di memoria a `registerMemoryCapability`
- precedente registrazione dei provider di incorporamento specifica per la memoria,
  durante la migrazione dei provider di incorporamento a
  `api.registerEmbeddingProvider(...)` e `contracts.embeddingProviders`
- precedenti helper dell'SDK dei canali per gli schemi dei messaggi nativi, il
  controllo delle menzioni, la formattazione degli involucri in ingresso e
  l'annidamento delle funzionalità di approvazione
- precedenti alias per la chiave di instradamento dei canali e per gli helper dei
  destinatari confrontabili, durante la migrazione dei Plugin a
  `openclaw/plugin-sdk/channel-route`
- suggerimenti di attivazione sostituiti dalla responsabilità dei contributi del manifesto
- fallback del runtime `setup-api` durante la migrazione dei descrittori di
  configurazione iniziale ai metadati a freddo `setup.requiresRuntime: false`
- hook `discovery` dei provider durante la migrazione degli hook del catalogo dei
  provider a `catalog.run(...)`
- metadati `showConfigured` / `showInSetup` dei canali durante la migrazione dei
  pacchetti dei canali a `openclaw.channel.exposure`
- precedenti chiavi di configurazione dei criteri del runtime durante la migrazione
  degli operatori ad `agentRuntime` tramite Doctor
- fallback dei metadati di configurazione generati per i canali inclusi durante
  l'introduzione dei metadati `channelConfigs` basati prioritariamente sul registro
- variabili di ambiente persistenti per la disabilitazione del registro dei Plugin
  e per la migrazione delle installazioni, durante la migrazione degli operatori
  tramite i flussi di riparazione a `openclaw plugins registry --refresh` e
  `openclaw doctor --fix`
- precedenti percorsi di configurazione di ricerca web, recupero web e x_search
  gestiti dai Plugin, durante la migrazione tramite Doctor a
  `plugins.entries.<plugin>.config`
- precedente configurazione `plugins.installs` creata manualmente e alias dei
  percorsi di caricamento dei Plugin inclusi, durante lo spostamento dei metadati
  di installazione nel registro dei Plugin gestito dallo stato

### Alias piatti dei callback in ingresso di WhatsApp

I callback del runtime di WhatsApp forniscono `WebInboundMessage`: i contesti
canonici annidati `event`, `payload`, `quote`, `group` e `platform`, oltre agli
alias piatti deprecati per i campi dei callback distribuiti. Il nuovo codice dei
callback deve leggere i contesti annidati. Il codice che crea messaggi di callback
annidati puliti può utilizzare `WebInboundCallbackMessage`; i listener di
compatibilità che inseriscono ancora vecchi messaggi piatti di test o dei Plugin
devono utilizzare `LegacyFlatWebInboundMessage` o `WebInboundMessageInput`.

Gli alias piatti rimangono disponibili fino al **2026-08-30**; questa finestra si
applica solo all'accesso tramite alias piatti, non alla struttura annidata, che è
il contratto canonico del runtime. L'annotazione TypeScript `@deprecated` di ogni
alias piatto indica la relativa sostituzione annidata esatta. Esempi comuni:

- `id`, `timestamp` e `isBatched` vengono spostati sotto `event`.
- `body`, `mediaPath`, `mediaType`, `mediaFileName`, `mediaUrl`, `location` e
  `untrustedStructuredContext` vengono spostati sotto `payload`.
- `to`, `chatId`, i campi relativi al mittente e all'identità del sistema,
  `sendComposing`, `reply(...)` e `sendMedia(...)` vengono spostati sotto `platform`.
- I campi `replyTo*` vengono spostati sotto `quote`; i campi relativi all'oggetto,
  ai partecipanti e alle menzioni del gruppo vengono spostati sotto `group`.

`payload.untrustedStructuredContext` viene estratto dai payload in ingresso dei
provider. I Plugin devono esaminare `label`, `source` e `type` prima di considerare
autorevole il relativo `payload`.

### Campi di ammissione in ingresso di WhatsApp

I messaggi di callback WhatsApp accettati contengono `admission`, un involucro
sicuro per l'esposizione pubblica della decisione di controllo degli accessi che
ha ammesso il messaggio. Il nuovo codice dei callback deve leggere i dati
sull'ammissione da `msg.admission` anziché dai precedenti campi di ammissione di
primo livello.

I campi di primo livello rimangono disponibili fino al **2026-08-30**.
L'annotazione TypeScript `@deprecated` di ogni campo indica la relativa
sostituzione:

- `from` e `conversationId` vengono spostati in `admission.conversation.id`.
- `accountId` viene spostato in `admission.accountId`.
- `accessControlPassed` è una vista di compatibilità derivata da
  `admission.ingress.decision === "allow"`; nei messaggi che contengono già
  `admission`, la scrittura del valore booleano precedente non riscrive il grafo
  di ingresso.
- `chatType` viene spostato in `admission.conversation.kind`.

## Pacchetto dell'analizzatore dei Plugin

L'analizzatore dei Plugin deve risiedere al di fuori del repository principale di
OpenClaw come pacchetto/repository separato, basato sui contratti di compatibilità
e del manifesto con controllo delle versioni. La CLI iniziale deve essere:

```sh
openclaw-plugin-inspector ./my-plugin
```

Deve produrre la convalida del manifesto e dello schema, la versione di
compatibilità del contratto sottoposta a controllo, i controlli dei metadati di
installazione e origine, i controlli delle importazioni dei percorsi a freddo e
gli avvisi di deprecazione e compatibilità. Utilizzare `--json` per ottenere un
output stabile e leggibile dalle macchine nelle annotazioni CI. Il core di
OpenClaw deve esporre i contratti e i dati di test utilizzabili dall'analizzatore,
ma non deve pubblicare il binario dell'analizzatore dal pacchetto principale
`openclaw`.

### Percorso di accettazione per i manutentori

Utilizzare Blacksmith Testbox con supporto Crabbox per il percorso di accettazione
dei pacchetti installabili quando si convalida l'analizzatore esterno rispetto ai
pacchetti Plugin di OpenClaw. Eseguirlo da un checkout pulito di OpenClaw dopo la
compilazione del pacchetto:

```sh
pnpm crabbox:run -- --provider blacksmith-testbox --timing-json --shell -- "pnpm install && pnpm build && npm exec --yes @openclaw/plugin-inspector@0.1.0 -- ./extensions/telegram --json"
pnpm crabbox:run -- --provider blacksmith-testbox --timing-json --shell -- "npm exec --yes @openclaw/plugin-inspector@0.1.0 -- ./extensions/discord --json"
pnpm crabbox:run -- --provider blacksmith-testbox --timing-json --shell -- "npm exec --yes @openclaw/plugin-inspector@0.1.0 -- <clawhub-plugin-dir> --json"
```

Mantenere questo percorso facoltativo per i manutentori, poiché installa un
pacchetto npm esterno e può esaminare pacchetti Plugin clonati al di fuori del
repository. Le protezioni del repository locale coprono la mappa delle
esportazioni dell'SDK, i metadati del registro di compatibilità, la progressiva
eliminazione delle importazioni deprecate dell'SDK e i confini delle importazioni
delle estensioni incluse; la verifica dell'analizzatore in Testbox copre il
pacchetto così come viene utilizzato dagli autori di Plugin esterni.

## Note di rilascio

Le note di rilascio devono includere le imminenti deprecazioni dei Plugin, con le
date previste e i collegamenti alla documentazione di migrazione, prima che un
percorso di compatibilità passi a `removal-pending` o `removed`.
