---
read_when:
    - Gestisci un Plugin OpenClaw
    - Vedi un avviso di compatibilità del Plugin
    - Stai pianificando una migrazione dell'SDK Plugin o del manifest
summary: Contratti di compatibilità dei Plugin, metadati di deprecazione e aspettative di migrazione
title: Compatibilità dei Plugin
x-i18n:
    generated_at: "2026-06-27T17:49:18Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2e17881c393e3649cb6accb13996d83a855f434735da2e84738f823ac4eba0f5
    source_path: plugins/compatibility.md
    workflow: 16
---

OpenClaw mantiene i contratti dei plugin meno recenti collegati tramite adattatori di compatibilità nominati prima di rimuoverli. Questo protegge i plugin bundled ed esterni esistenti mentre i contratti di SDK, manifest, setup, configurazione e runtime dell’agente evolvono.

## Registro di compatibilità

I contratti di compatibilità dei plugin sono tracciati nel registro core in
`src/plugins/compat/registry.ts`.

Ogni record contiene:

- un codice di compatibilità stabile
- stato: `active`, `deprecated`, `removal-pending` o `removed`
- proprietario: SDK, configurazione, setup, canale, provider, esecuzione del plugin, runtime dell’agente
  o core
- date di introduzione e deprecazione quando applicabili
- indicazioni per la sostituzione
- documentazione, diagnostica e test che coprono il comportamento vecchio e nuovo

Il registro è la fonte per la pianificazione dei maintainer e per i futuri controlli dell’ispettore dei plugin. Se un comportamento rivolto ai plugin cambia, aggiungi o aggiorna il record di compatibilità nella stessa modifica che aggiunge l’adattatore.

La compatibilità per riparazioni e migrazioni di doctor è tracciata separatamente in
`src/commands/doctor/shared/deprecation-compat.ts`. Quei record coprono vecchie forme di configurazione, layout del registro installazioni e shim di riparazione che potrebbero dover restare disponibili dopo la rimozione del percorso di compatibilità runtime.

Le revisioni di release dovrebbero controllare entrambi i registri. Non eliminare una migrazione di doctor solo perché il record di compatibilità runtime o di configurazione corrispondente è scaduto; prima verifica che non esista un percorso di aggiornamento supportato che abbia ancora bisogno della riparazione. Rivalida inoltre ogni annotazione di sostituzione durante la pianificazione della release, perché la proprietà dei plugin e l’impronta della configurazione possono cambiare quando provider e canali escono dal core.

## Pacchetto ispettore dei plugin

L’ispettore dei plugin dovrebbe vivere fuori dal repository core di OpenClaw come pacchetto/repository separato, basato sui contratti di compatibilità e manifest versionati.

La CLI del primo giorno dovrebbe essere:

```sh
openclaw-plugin-inspector ./my-plugin
```

Dovrebbe emettere:

- validazione manifest/schema
- la versione di compatibilità del contratto controllata
- controlli dei metadati di installazione/sorgente
- controlli di importazione cold-path
- avvisi di deprecazione e compatibilità

Usa `--json` per un output stabile leggibile da macchina nelle annotazioni CI. Il core OpenClaw dovrebbe esporre contratti e fixture che l’ispettore può consumare, ma non dovrebbe pubblicare il binario dell’ispettore dal pacchetto principale `openclaw`.

### Corsia di accettazione per maintainer

Usa Blacksmith Testbox con backend Crabbox per la corsia di accettazione del pacchetto installabile quando validi l’ispettore esterno rispetto ai pacchetti plugin di OpenClaw. Eseguila da un checkout OpenClaw pulito dopo la build del pacchetto:

```sh
pnpm crabbox:run -- --provider blacksmith-testbox --timing-json --shell -- "pnpm install && pnpm build && npm exec --yes @openclaw/plugin-inspector@0.1.0 -- ./extensions/telegram --json"
pnpm crabbox:run -- --provider blacksmith-testbox --timing-json --shell -- "npm exec --yes @openclaw/plugin-inspector@0.1.0 -- ./extensions/discord --json"
pnpm crabbox:run -- --provider blacksmith-testbox --timing-json --shell -- "npm exec --yes @openclaw/plugin-inspector@0.1.0 -- <clawhub-plugin-dir> --json"
```

Mantieni questa corsia opt-in per i maintainer, perché installa un pacchetto npm esterno e può ispezionare pacchetti plugin clonati fuori dal repository. Le guardie del repository locale coprono la mappa di export dell’SDK, i metadati del registro di compatibilità, lo smaltimento degli import SDK deprecati e i confini di importazione delle estensioni bundled; la prova dell’ispettore Testbox copre il pacchetto come lo consumano gli autori di plugin esterni.

## Criterio di deprecazione

OpenClaw non dovrebbe rimuovere un contratto plugin documentato nella stessa release che introduce la sua sostituzione.

La sequenza di migrazione è:

1. Aggiungi il nuovo contratto.
2. Mantieni il vecchio comportamento collegato tramite un adattatore di compatibilità nominato.
3. Emetti diagnostica o avvisi quando gli autori di plugin possono intervenire.
4. Documenta sostituzione e tempistiche.
5. Testa sia i vecchi sia i nuovi percorsi.
6. Attendi per tutta la finestra di migrazione annunciata.
7. Rimuovi solo con approvazione esplicita per release breaking.

I record deprecati devono includere una data di inizio degli avvisi, una sostituzione, un link alla documentazione e una data di rimozione finale non oltre tre mesi dall’inizio degli avvisi. Non aggiungere un percorso di compatibilità deprecato con una finestra di rimozione aperta, a meno che i maintainer decidano esplicitamente che sia compatibilità permanente e lo contrassegnino invece come `active`.

## Aree di compatibilità attuali

I record di compatibilità attuali includono:

- vecchi import SDK ampi come `openclaw/plugin-sdk/compat`
- vecchie forme di plugin solo hook e `before_agent_start`
- vecchi nomi di hook di pulizia `api.on("deactivate", ...)` mentre i plugin migrano a
  `gateway_stop`
- vecchi entrypoint plugin `activate(api)` mentre i plugin migrano a
  `register(api)`
- vecchi alias SDK come `openclaw/extension-api`,
  `openclaw/plugin-sdk/channel-runtime`, builder di stato
  `openclaw/plugin-sdk/command-auth`, `openclaw/plugin-sdk/test-utils` (sostituito da sottopercorsi di test
  `openclaw/plugin-sdk/*` mirati) e gli alias di tipo `ClawdbotConfig` /
  `OpenClawSchemaType`
- comportamento di allowlist e abilitazione dei plugin bundled
- vecchi metadati manifest per env-var di provider/canale
- vecchi hook dei plugin provider e alias di tipo mentre i provider passano a hook espliciti di catalogo, autenticazione, thinking, replay e trasporto
- vecchi alias runtime come `api.runtime.taskFlow`,
  `api.runtime.subagent.getSession`, `api.runtime.stt` e i deprecati
  `api.runtime.config.loadConfig()` / `api.runtime.config.writeConfigFile(...)`
- campi callback piatti `WebInboundMessage` di WhatsApp come `body`, `chatId`,
  `reply(...)` e `mediaPath` mentre i consumatori di callback migrano ai contesti annidati
  `WebInboundCallbackMessage` `event`, `payload`, `quote`, `group` e
  `platform`
- campi di ammissione top-level `WebInboundMessage` di WhatsApp come `from`,
  `conversationId`, `accountId`, `accessControlPassed` e `chatType` mentre
  i consumatori di callback migrano all’envelope `admission`
- vecchia registrazione separata dei plugin di memoria mentre i plugin di memoria passano a
  `registerMemoryCapability`
- vecchia registrazione di provider di embedding specifica per memoria mentre i provider di embedding passano a `api.registerEmbeddingProvider(...)` e
  `contracts.embeddingProviders`
- vecchi helper SDK di canale per schemi di messaggi nativi, gating delle menzioni,
  formattazione degli envelope in ingresso e annidamento delle capability di approvazione
- vecchi alias della chiave di route di canale e degli helper comparable-target mentre i plugin passano a `openclaw/plugin-sdk/channel-route`
- suggerimenti di attivazione che vengono sostituiti dalla proprietà dei contributi nel manifest
- fallback runtime `setup-api` mentre i descrittori di setup passano ai metadati cold
  `setup.requiresRuntime: false`
- hook `discovery` dei provider mentre gli hook di catalogo dei provider passano a
  `catalog.run(...)`
- metadati di canale `showConfigured` / `showInSetup` mentre i pacchetti canale passano a `openclaw.channel.exposure`
- vecchie chiavi di configurazione runtime-policy mentre doctor migra gli operatori a
  `agentRuntime`
- fallback dei metadati di configurazione dei canali bundled generati mentre arrivano i metadati
  `channelConfigs` registry-first
- flag env persistiti di disabilitazione del registro plugin e migrazione installazioni mentre
  i flussi di riparazione migrano gli operatori a `openclaw plugins registry --refresh` e
  `openclaw doctor --fix`
- vecchi percorsi di configurazione di web search, web fetch e x_search di proprietà dei plugin mentre
  doctor li migra a `plugins.entries.<plugin>.config`
- vecchia configurazione autoriale `plugins.installs` e alias dei percorsi di caricamento dei plugin bundled mentre i metadati di installazione passano al registro plugin gestito dallo stato

Il nuovo codice plugin dovrebbe preferire la sostituzione elencata nel registro e nella guida di migrazione specifica. I plugin esistenti possono continuare a usare un percorso di compatibilità finché documentazione, diagnostica e note di release annunciano una finestra di rimozione.

### Alias piatti dei callback inbound di WhatsApp

I callback runtime di WhatsApp consegnano `WebInboundMessage`: i contesti canonici annidati
`event`, `payload`, `quote`, `group` e `platform` più alias piatti deprecati per i campi callback rilasciati. Il nuovo codice callback dovrebbe leggere i contesti annidati. Il codice che costruisce messaggi callback annidati puliti può usare
`WebInboundCallbackMessage`; i listener di compatibilità che iniettano ancora vecchi messaggi di test o plugin piatti dovrebbero usare `LegacyFlatWebInboundMessage` o
`WebInboundMessageInput`.

Gli alias piatti restano disponibili fino al **2026-08-30**. Quella finestra di rimozione si applica solo all’accesso agli alias piatti; la forma callback annidata è il contratto runtime canonico. Le annotazioni TypeScript `@deprecated` su ogni alias piatto indicano la sua sostituzione annidata esatta. Esempi comuni:

- `id`, `timestamp` e `isBatched` si spostano sotto `event`.
- `body`, `mediaPath`, `mediaType`, `mediaFileName`, `mediaUrl`, `location` e
  `untrustedStructuredContext` si spostano sotto `payload`.
- `to`, `chatId`, campi mittente/self, `sendComposing`, `reply(...)` e
  `sendMedia(...)` si spostano sotto `platform`.
- I campi `replyTo*` si spostano sotto `quote`, e i campi di oggetto gruppo/partecipante/menzione
  si spostano sotto `group`.

`payload.untrustedStructuredContext` viene estratto dai payload dei provider in ingresso.
I plugin dovrebbero ispezionare `label`, `source` e `type` prima di trattare il suo
`payload` come autorevole.

### Campi di ammissione inbound di WhatsApp

I messaggi callback WhatsApp accettati ora trasportano `admission`, un envelope sicuro per il pubblico per la decisione di controllo degli accessi che ha ammesso il messaggio. Il nuovo codice callback dovrebbe leggere i fatti di ammissione da `msg.admission` invece che dai vecchi campi di ammissione top-level.

I campi top-level restano disponibili fino al **2026-08-30**. Le annotazioni TypeScript
`@deprecated` indicano ogni sostituzione:

- `from` e `conversationId` si spostano in `admission.conversation.id`.
- `accountId` si sposta in `admission.accountId`.
- `accessControlPassed` è una vista di compatibilità derivata da
  `admission.ingress.decision === "allow"`; sui messaggi che trasportano già
  `admission`, scrivere il booleano legacy non riscrive il grafo ingress.
- `chatType` si sposta in `admission.conversation.kind`.

## Note di release

Le note di release dovrebbero includere le prossime deprecazioni dei plugin con date obiettivo e link alla documentazione di migrazione. Quell’avviso deve avvenire prima che un percorso di compatibilità passi a `removal-pending` o `removed`.
