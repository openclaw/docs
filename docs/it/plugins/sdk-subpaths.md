---
read_when:
    - Scegliere il sottopercorso plugin-sdk corretto per un'importazione di Plugin
    - Verifica dei sottopercorsi dei Plugin in bundle e delle superfici helper
summary: 'Catalogo dei sottopercorsi del Plugin SDK: quali import risiedono dove, raggruppati per area'
title: Sottopercorsi dell’SDK Plugin
x-i18n:
    generated_at: "2026-05-06T09:03:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 98b16cd3fcd6babc64df20ad4e679c35553fc21894617f30907bbf0e579a4d89
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

L’SDK Plugin è esposto come un insieme di sottopercorsi ristretti sotto `openclaw/plugin-sdk/`.
Questa pagina cataloga i sottopercorsi usati comunemente raggruppati per scopo. L’elenco
completo generato di oltre 200 sottopercorsi si trova in `scripts/lib/plugin-sdk-entrypoints.json`;
i sottopercorsi helper riservati dei Plugin in bundle compaiono lì ma sono un dettaglio
di implementazione, salvo che una pagina della documentazione li promuova esplicitamente. I manutentori possono verificare i sottopercorsi helper riservati attivi con `pnpm plugins:boundary-report:summary`; le esportazioni helper riservate inutilizzate fanno fallire il report CI invece di restare nell’SDK pubblico
come debito di compatibilità dormiente.

Per la guida alla creazione di Plugin, consulta [Panoramica dell’SDK Plugin](/it/plugins/sdk-overview).

## Punto di ingresso del Plugin

| Sottopercorso                            | Esportazioni principali                                                                                                                                                      |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`                 | `definePluginEntry`                                                                                                                                                          |
| `plugin-sdk/core`                         | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema`       |
| `plugin-sdk/config-schema`                | `OpenClawSchema`                                                                                                                                                             |
| `plugin-sdk/provider-entry`               | `defineSingleProviderPluginEntry`                                                                                                                                            |
| `plugin-sdk/testing`                      | Barrel di compatibilità ampia per i test legacy dei Plugin; preferisci sottopercorsi di test mirati per i nuovi test delle estensioni                                       |
| `plugin-sdk/plugin-test-api`              | Builder mock minimale di `OpenClawPluginApi` per test unitari di registrazione diretta dei Plugin                                                                            |
| `plugin-sdk/agent-runtime-test-contracts` | Fixture dei contratti adapter runtime agente nativi per profili di autenticazione, soppressione della consegna, classificazione fallback, hook degli strumenti, overlay dei prompt, schemi e riparazione della trascrizione |
| `plugin-sdk/channel-test-helpers`         | Helper di test per ciclo di vita account canale, directory, configurazione di invio, mock runtime, hook, voce canale in bundle, timestamp busta, risposta di abbinamento e contratto canale generico |
| `plugin-sdk/channel-target-testing`       | Suite di test condivisa per casi di errore di risoluzione target del canale                                                                                                  |
| `plugin-sdk/plugin-test-contracts`        | Helper di contratto per registrazione Plugin, manifest pacchetto, artefatto pubblico, API runtime, effetti collaterali di importazione e importazione diretta               |
| `plugin-sdk/plugin-test-runtime`          | Fixture per test di runtime Plugin, registro, registrazione provider, configurazione guidata e task-flow runtime                                                             |
| `plugin-sdk/provider-test-contracts`      | Helper di contratto per runtime provider, autenticazione, discovery, onboarding, catalogo, capacità media, policy di replay, audio live STT realtime, web-search/fetch e procedura guidata |
| `plugin-sdk/provider-http-test-mocks`     | Mock HTTP/autenticazione Vitest opt-in per test provider che esercitano `plugin-sdk/provider-http`                                                                            |
| `plugin-sdk/test-env`                     | Fixture per ambiente di test, fetch/rete, server HTTP eliminabile, richiesta in ingresso, live-test, filesystem temporaneo e controllo del tempo                            |
| `plugin-sdk/test-fixtures`                | Fixture di test generiche per CLI, sandbox, skill, messaggio agente, evento di sistema, ricaricamento modulo, percorso Plugin in bundle, terminale, suddivisione in chunk, token di autenticazione e caso tipizzato |
| `plugin-sdk/test-node-mocks`              | Helper mock mirati per built-in Node da usare dentro factory Vitest `vi.mock("node:*")`                                                                                      |
| `plugin-sdk/migration`                    | Helper per elementi del provider di migrazione come `createMigrationItem`, costanti di motivo, marker di stato degli elementi, helper di redazione e `summarizeMigrationItems` |
| `plugin-sdk/migration-runtime`            | Helper di migrazione runtime come `copyMigrationFileItem`, `withCachedMigrationConfigRuntime` e `writeMigrationReport`                                                       |

  <AccordionGroup>
  <Accordion title="Sottopercorsi dei canali">
    | Sottopercorso | Esportazioni principali |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Esportazione dello schema Zod radice di `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, più `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Helper condivisi per la procedura guidata di configurazione, prompt allowlist, builder dello stato di configurazione |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Helper per configurazione multi-account/action-gate, helper di fallback per l'account predefinito |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, helper di normalizzazione dell'ID account |
    | `plugin-sdk/account-resolution` | Helper per ricerca account + fallback predefinito |
    | `plugin-sdk/account-helpers` | Helper mirati per elenco account/azione account |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | Helper legacy della pipeline di risposta. Il nuovo codice della pipeline di risposta dei canali deve usare `createChannelMessageReplyPipeline` e `resolveChannelMessageSourceReplyDeliveryMode` da `plugin-sdk/channel-message`. |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | Primitive condivise dello schema di configurazione dei canali più builder Zod e JSON/TypeBox diretti |
    | `plugin-sdk/bundled-channel-config-schema` | Schemi di configurazione dei canali OpenClaw in bundle solo per Plugin in bundle mantenuti |
    | `plugin-sdk/channel-config-schema-legacy` | Alias di compatibilità deprecato per gli schemi di configurazione dei canali in bundle |
    | `plugin-sdk/telegram-command-config` | Helper di normalizzazione/validazione dei comandi personalizzati Telegram con fallback del contratto in bundle |
    | `plugin-sdk/command-gating` | Helper mirati per il gate di autorizzazione dei comandi |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`, `createChannelRunQueue` e helper legacy del ciclo di vita degli stream bozza. Il nuovo codice di finalizzazione dell'anteprima deve usare `plugin-sdk/channel-message`. |
    | `plugin-sdk/channel-message` | Helper economici del contratto del ciclo di vita dei messaggi, come `defineChannelMessageAdapter`, `createChannelMessageAdapterFromOutbound`, `createReplyPrefixContext`, `resolveChannelMessageSourceReplyDeliveryMode`, facciate di compatibilità, derivazione della capacità final durevole, helper di prova delle capacità per capacità di invio/ricezione/effetti collaterali, `MessageReceiveContext`, prove della policy di ack in ricezione, `defineFinalizableLivePreviewAdapter`, `deliverWithFinalizableLivePreviewAdapter`, prove delle capacità di anteprima live e finalizzatore live, stato di recupero durevole, `RenderedMessageBatch`, tipi di ricevuta dei messaggi e helper per ID ricevuta. Vedi [API messaggi canale](/it/plugins/sdk-channel-message). Il legacy `createChannelTurnReplyPipeline` rimane solo per i dispatcher di compatibilità. |
    | `plugin-sdk/channel-message-runtime` | Helper di consegna runtime che possono caricare la consegna in uscita, inclusi `deliverInboundReplyWithMessageSendContext`, `sendDurableMessageBatch`, `withDurableMessageSendContext`, `dispatchChannelMessageReplyWithBase` e `recordChannelMessageReplyDispatch`. Da usare dai moduli runtime di monitoraggio/invio, non dai file bootstrap Plugin a caldo. |
    | `plugin-sdk/inbound-envelope` | Helper condivisi per route in ingresso + builder envelope |
    | `plugin-sdk/inbound-reply-dispatch` | Helper legacy condivisi per registrazione e dispatch in ingresso, predicati di dispatch visibile/finale e compatibilità deprecata `deliverDurableInboundReplyPayload` per dispatcher di canale preparati. Il nuovo codice di ricezione/dispatch dei canali deve importare gli helper runtime del ciclo di vita da `plugin-sdk/channel-message-runtime`. |
    | `plugin-sdk/messaging-targets` | Helper di parsing/corrispondenza dei target |
    | `plugin-sdk/outbound-media` | Helper condivisi per il caricamento dei media in uscita |
    | `plugin-sdk/outbound-send-deps` | Ricerca leggera delle dipendenze di invio in uscita per adapter di canale |
    | `plugin-sdk/outbound-runtime` | Helper per consegna in uscita, identità, delegato di invio, sessione, formattazione e pianificazione payload |
    | `plugin-sdk/poll-runtime` | Helper mirati di normalizzazione dei poll |
    | `plugin-sdk/thread-bindings-runtime` | Helper per ciclo di vita e adapter dei binding dei thread |
    | `plugin-sdk/agent-media-payload` | Builder legacy del payload media agente |
    | `plugin-sdk/conversation-runtime` | Helper per conversazione/binding del thread, pairing e binding configurato |
    | `plugin-sdk/runtime-config-snapshot` | Helper snapshot della configurazione runtime |
    | `plugin-sdk/runtime-group-policy` | Helper runtime di risoluzione della policy di gruppo |
    | `plugin-sdk/channel-status` | Helper condivisi per snapshot/riepilogo dello stato dei canali |
    | `plugin-sdk/channel-config-primitives` | Primitive mirate dello schema di configurazione dei canali |
    | `plugin-sdk/channel-config-writes` | Helper di autorizzazione alla scrittura della configurazione dei canali |
    | `plugin-sdk/channel-plugin-common` | Esportazioni prelude condivise dei Plugin di canale |
    | `plugin-sdk/allowlist-config-edit` | Helper di modifica/lettura della configurazione allowlist |
    | `plugin-sdk/group-access` | Helper condivisi per decisioni di accesso di gruppo |
    | `plugin-sdk/direct-dm` | Helper condivisi per auth/guard DM diretti |
    | `plugin-sdk/discord` | Facciata di compatibilità Discord deprecata per `@openclaw/discord@2026.3.13` pubblicato e compatibilità del proprietario tracciata; i nuovi Plugin devono usare i sottopercorsi generici dell'SDK canale |
    | `plugin-sdk/telegram-account` | Facciata di compatibilità deprecata per la risoluzione degli account Telegram per compatibilità del proprietario tracciata; i nuovi Plugin devono usare helper runtime iniettati o sottopercorsi generici dell'SDK canale |
    | `plugin-sdk/zalouser` | Facciata di compatibilità Zalo Personal deprecata per pacchetti Lark/Zalo pubblicati che importano ancora l'autorizzazione dei comandi mittente; i nuovi Plugin devono usare `plugin-sdk/command-auth` |
    | `plugin-sdk/interactive-runtime` | Presentazione semantica dei messaggi, consegna e helper legacy per risposte interattive. Vedi [Presentazione messaggi](/it/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Barrel di compatibilità per debounce in ingresso, corrispondenza delle menzioni, helper per policy delle menzioni e helper envelope |
    | `plugin-sdk/channel-inbound-debounce` | Helper mirati per debounce in ingresso |
    | `plugin-sdk/channel-mention-gating` | Helper mirati per policy delle menzioni, marker delle menzioni e testo delle menzioni senza la superficie runtime in ingresso più ampia |
    | `plugin-sdk/channel-envelope` | Helper mirati di formattazione dell'envelope in ingresso |
    | `plugin-sdk/channel-location` | Contesto di localizzazione del canale e helper di formattazione |
    | `plugin-sdk/channel-logging` | Helper di logging dei canali per scarti in ingresso e fallimenti di digitazione/ack |
    | `plugin-sdk/channel-send-result` | Tipi di risultato della risposta |
    | `plugin-sdk/channel-actions` | Helper per azioni sui messaggi di canale, più helper deprecati dello schema nativo mantenuti per compatibilità dei Plugin |
    | `plugin-sdk/channel-route` | Helper condivisi per normalizzazione route, risoluzione dei target basata su parser, stringificazione degli ID thread, chiavi route di deduplica/compattazione, tipi target analizzati e helper di confronto route/target |
    | `plugin-sdk/channel-targets` | Helper di parsing dei target; i chiamanti del confronto route devono usare `plugin-sdk/channel-route` |
    | `plugin-sdk/channel-contract` | Tipi del contratto dei canali |
    | `plugin-sdk/channel-feedback` | Cablaggio di feedback/reazioni |
    | `plugin-sdk/channel-secret-runtime` | Helper mirati del contratto dei segreti, come `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment` e tipi di target segreto |
  </Accordion>

  <Accordion title="Sottopercorsi dei provider">
    | Sottopercorso | Esportazioni principali |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | Facade del provider LM Studio supportata per configurazione, scoperta del catalogo e preparazione dei modelli a runtime |
    | `plugin-sdk/lmstudio-runtime` | Facade runtime LM Studio supportata per impostazioni predefinite del server locale, scoperta dei modelli, intestazioni delle richieste e helper per i modelli caricati |
    | `plugin-sdk/provider-setup` | Helper curati per la configurazione di provider locali/self-hosted |
    | `plugin-sdk/self-hosted-provider-setup` | Helper mirati per la configurazione di provider self-hosted compatibili con OpenAI |
    | `plugin-sdk/cli-backend` | Impostazioni predefinite del backend CLI + costanti del watchdog |
    | `plugin-sdk/provider-auth-runtime` | Helper runtime per la risoluzione delle chiavi API per i Plugin provider |
    | `plugin-sdk/provider-auth-api-key` | Helper per onboarding/scrittura del profilo della chiave API, come `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Builder standard del risultato di autenticazione OAuth |
    | `plugin-sdk/provider-auth-login` | Helper condivisi per login interattivo per i Plugin provider |
    | `plugin-sdk/provider-env-vars` | Helper di ricerca delle variabili d'ambiente di autenticazione del provider |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials`, esportazione di compatibilità deprecata `resolveOpenClawAgentDir` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, builder condivisi per le policy di replay, helper per endpoint dei provider e helper di normalizzazione degli ID modello come `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-runtime` | Hook runtime di arricchimento del catalogo dei provider e seam del registro plugin-provider per i test di contratto |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Helper generici per capacità HTTP/endpoint dei provider, errori HTTP dei provider e helper per moduli multipart di trascrizione audio |
    | `plugin-sdk/provider-web-fetch-contract` | Helper mirati per il contratto di configurazione/selezione web-fetch come `enablePluginInConfig` e `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Helper di registrazione/cache dei provider web-fetch |
    | `plugin-sdk/provider-web-search-config-contract` | Helper mirati per configurazione/credenziali web-search per provider che non richiedono il cablaggio di abilitazione del Plugin |
    | `plugin-sdk/provider-web-search-contract` | Helper mirati per il contratto di configurazione/credenziali web-search come `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` e setter/getter di credenziali con ambito |
    | `plugin-sdk/provider-web-search` | Helper di registrazione/cache/runtime dei provider web-search |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, pulizia schema Gemini + diagnostica e helper di compatibilità xAI come `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` e simili |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, tipi di wrapper per stream e helper wrapper condivisi Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-transport-runtime` | Helper di trasporto nativo dei provider come fetch protetto, trasformazioni dei messaggi di trasporto e stream di eventi di trasporto scrivibili |
    | `plugin-sdk/provider-onboard` | Helper di patch della configurazione di onboarding |
    | `plugin-sdk/global-singleton` | Helper singleton/map/cache locali al processo |
    | `plugin-sdk/group-activation` | Helper mirati per modalità di attivazione dei gruppi e parsing dei comandi |
  </Accordion>

  <Accordion title="Sottopercorsi di autenticazione e sicurezza">
    | Sottopercorso | Esportazioni principali |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, helper del registro comandi inclusa la formattazione dinamica del menu degli argomenti, helper di autorizzazione del mittente |
    | `plugin-sdk/command-status` | Builder per messaggi di comando/aiuto come `buildCommandsMessagePaginated` e `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Helper per la risoluzione degli approvatori e l'autenticazione delle azioni nella stessa chat |
    | `plugin-sdk/approval-client-runtime` | Helper nativi per profili/filtri di approvazione exec |
    | `plugin-sdk/approval-delivery-runtime` | Adattatori nativi per capacità/consegna delle approvazioni |
    | `plugin-sdk/approval-gateway-runtime` | Helper condiviso per la risoluzione del Gateway di approvazione |
    | `plugin-sdk/approval-handler-adapter-runtime` | Helper leggeri di caricamento degli adattatori nativi di approvazione per entrypoint di canale hot |
    | `plugin-sdk/approval-handler-runtime` | Helper runtime più ampi per gestori di approvazione; preferire i seam adapter/gateway più mirati quando sono sufficienti |
    | `plugin-sdk/approval-native-runtime` | Helper nativi per destinazione approvazione + associazione account |
    | `plugin-sdk/approval-reply-runtime` | Helper per payload di risposta di approvazione exec/Plugin |
    | `plugin-sdk/approval-runtime` | Helper per payload di approvazione exec/Plugin, helper runtime/routing di approvazione nativa e helper di visualizzazione strutturata dell'approvazione come `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | Helper mirati per il reset della deduplicazione delle risposte in ingresso |
    | `plugin-sdk/channel-contract-testing` | Helper mirati per test di contratto dei canali senza il barrel di testing ampio |
    | `plugin-sdk/command-auth-native` | Autenticazione nativa dei comandi, formattazione dinamica del menu degli argomenti e helper nativi per target di sessione |
    | `plugin-sdk/command-detection` | Helper condivisi per il rilevamento dei comandi |
    | `plugin-sdk/command-primitives-runtime` | Predicati leggeri per testo dei comandi per percorsi di canale hot |
    | `plugin-sdk/command-surface` | Helper per normalizzazione del corpo dei comandi e superficie dei comandi |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Helper mirati per la raccolta del contratto dei segreti per superfici di segreti di canale/Plugin |
    | `plugin-sdk/secret-ref-runtime` | Helper mirati per `coerceSecretRef` e tipizzazione SecretRef per parsing di contratto/configurazione dei segreti |
    | `plugin-sdk/security-runtime` | Helper condivisi per fiducia, gating dei DM, helper per file/percorsi limitati alla root inclusi scritture solo create-only, sostituzione atomica di file sync/async, scritture temporanee sibling, fallback di spostamento cross-device, helper per archivio file privato, guardie sui genitori di symlink, contenuti esterni, redazione di testo sensibile, confronto di segreti in tempo costante e helper di raccolta dei segreti |
    | `plugin-sdk/ssrf-policy` | Helper per allowlist degli host e policy SSRF delle reti private |
    | `plugin-sdk/ssrf-dispatcher` | Helper mirati per pinned-dispatcher senza l'ampia superficie runtime infrastrutturale |
    | `plugin-sdk/ssrf-runtime` | Pinned-dispatcher, fetch protetto da SSRF, errore SSRF e helper per policy SSRF |
    | `plugin-sdk/secret-input` | Helper di parsing per input dei segreti |
    | `plugin-sdk/webhook-ingress` | Helper per richiesta/target Webhook e coercizione di websocket/body raw |
    | `plugin-sdk/webhook-request-guards` | Helper per dimensione/timeout del corpo della richiesta |
  </Accordion>

  <Accordion title="Sottopercorsi di runtime e archiviazione">
    | Sottopercorso | Esportazioni principali |
    | --- | --- |
    | `plugin-sdk/runtime` | Helper generici per runtime, logging, backup e installazione dei plugin |
    | `plugin-sdk/runtime-env` | Helper mirati per env di runtime, logger, timeout, retry e backoff |
    | `plugin-sdk/browser-config` | Facade di configurazione browser supportata per profilo/impostazioni predefinite normalizzati, parsing degli URL CDP e helper di auth per il controllo del browser |
    | `plugin-sdk/channel-runtime-context` | Helper generici per registrazione e lookup del contesto di runtime del canale |
    | `plugin-sdk/matrix` | Facade di compatibilità Matrix deprecata per pacchetti canale di terze parti meno recenti; i nuovi plugin dovrebbero importare direttamente `plugin-sdk/run-command` |
    | `plugin-sdk/mattermost` | Facade di compatibilità Mattermost deprecata per pacchetti canale di terze parti meno recenti; i nuovi plugin dovrebbero importare direttamente i sottopercorsi SDK generici |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Helper condivisi per comandi/hook/http/interattivi dei plugin |
    | `plugin-sdk/hook-runtime` | Helper condivisi per pipeline di Webhook/hook interni |
    | `plugin-sdk/lazy-runtime` | Helper di import/binding lazy del runtime come `createLazyRuntimeModule`, `createLazyRuntimeMethod` e `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Helper per exec di processo |
    | `plugin-sdk/cli-runtime` | Helper per formattazione CLI, attesa, versione, invocazione di argomenti e gruppi di comandi lazy |
    | `plugin-sdk/gateway-runtime` | Client Gateway, helper di avvio client pronto per event loop, RPC CLI del gateway, errori del protocollo gateway e helper per patch dello stato canale |
    | `plugin-sdk/config-types` | Superficie di configurazione solo tipi per forme di configurazione plugin come `OpenClawConfig` e tipi di configurazione canale/provider |
    | `plugin-sdk/plugin-config-runtime` | Helper di lookup della configurazione plugin a runtime come `requireRuntimeConfig`, `resolvePluginConfigObject` e `resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | Helper transazionali per mutazione della configurazione come `mutateConfigFile`, `replaceConfigFile` e `logConfigUpdated` |
    | `plugin-sdk/runtime-config-snapshot` | Helper per snapshot della configurazione del processo corrente come `getRuntimeConfig`, `getRuntimeConfigSnapshot` e setter di snapshot per i test |
    | `plugin-sdk/telegram-command-config` | Normalizzazione di nome/descrizione dei comandi Telegram e controlli di duplicati/conflitti, anche quando la superficie del contratto Telegram incluso non è disponibile |
    | `plugin-sdk/text-autolink-runtime` | Rilevamento autolink dei riferimenti a file senza il barrel text-runtime generico |
    | `plugin-sdk/approval-runtime` | Helper per approvazione exec/plugin, builder di capability di approvazione, helper auth/profilo, helper nativi routing/runtime e formattazione strutturata del percorso di visualizzazione approvazione |
    | `plugin-sdk/reply-runtime` | Helper condivisi per runtime inbound/risposta, chunking, dispatch, Heartbeat, pianificatore di risposta |
    | `plugin-sdk/reply-dispatch-runtime` | Helper mirati per dispatch/finalizzazione della risposta e label di conversazione |
    | `plugin-sdk/reply-history` | Helper condivisi per cronologia risposte a finestra breve e marker come `buildHistoryContext`, `HISTORY_CONTEXT_MARKER`, `recordPendingHistoryEntry` e `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Helper mirati per chunking di testo/markdown |
    | `plugin-sdk/session-store-runtime` | Helper per percorso dello store sessioni, chiave sessione, updated-at e mutazioni dello store |
    | `plugin-sdk/cron-store-runtime` | Helper per percorso/caricamento/salvataggio dello store Cron |
    | `plugin-sdk/state-paths` | Helper per percorsi di directory state/OAuth |
    | `plugin-sdk/routing` | Helper per route/chiave sessione/binding account come `resolveAgentRoute`, `buildAgentSessionKey` e `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Helper condivisi per riepilogo stato canale/account, impostazioni predefinite dello stato runtime e helper per metadati issue |
    | `plugin-sdk/target-resolver-runtime` | Helper condivisi per resolver target |
    | `plugin-sdk/string-normalization-runtime` | Helper per normalizzazione slug/stringhe |
    | `plugin-sdk/request-url` | Estrae URL stringa da input simili a fetch/request |
    | `plugin-sdk/run-command` | Runner di comandi temporizzato con risultati stdout/stderr normalizzati |
    | `plugin-sdk/param-readers` | Reader comuni per parametri tool/CLI |
    | `plugin-sdk/tool-payload` | Estrae payload normalizzati dagli oggetti risultato dei tool |
    | `plugin-sdk/tool-send` | Estrae campi target di invio canonici dagli argomenti dei tool |
    | `plugin-sdk/temp-path` | Helper condivisi per percorsi di download temporanei e workspace temporanei privati sicuri |
    | `plugin-sdk/logging-core` | Helper per logger di sottosistema e redazione |
    | `plugin-sdk/markdown-table-runtime` | Helper per modalità tabella Markdown e conversione |
    | `plugin-sdk/model-session-runtime` | Helper per override modello/sessione come `applyModelOverrideToSessionEntry` e `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | Helper per risoluzione della configurazione del provider talk |
    | `plugin-sdk/json-store` | Piccoli helper per lettura/scrittura di stato JSON |
    | `plugin-sdk/file-lock` | Helper per file-lock rientranti |
    | `plugin-sdk/persistent-dedupe` | Helper per cache di dedupe su disco |
    | `plugin-sdk/acp-runtime` | Helper per runtime/sessione ACP e dispatch delle risposte |
    | `plugin-sdk/acp-runtime-backend` | Helper leggeri per registrazione backend ACP e dispatch delle risposte per plugin caricati all'avvio |
    | `plugin-sdk/acp-binding-resolve-runtime` | Risoluzione binding ACP in sola lettura senza import di avvio del lifecycle |
    | `plugin-sdk/agent-config-primitives` | Primitive mirate per schema di configurazione runtime agent |
    | `plugin-sdk/boolean-param` | Reader permissivo per parametri booleani |
    | `plugin-sdk/dangerous-name-runtime` | Helper per risoluzione del matching di nomi pericolosi |
    | `plugin-sdk/device-bootstrap` | Helper per bootstrap dispositivo e token di pairing |
    | `plugin-sdk/extension-shared` | Primitive helper condivise per canali passivi, stato e proxy ambient |
    | `plugin-sdk/models-provider-runtime` | Helper per risposta a comando/provider `/models` |
    | `plugin-sdk/skill-commands-runtime` | Helper per elencare comandi Skill |
    | `plugin-sdk/native-command-registry` | Helper per registro/build/serializzazione dei comandi nativi |
    | `plugin-sdk/agent-harness` | Superficie sperimentale per plugin attendibili per harness agent di basso livello: tipi harness, helper di steer/abort run attiva, helper bridge tool OpenClaw, helper policy tool per runtime-plan, classificazione esito terminale, helper per formattazione/dettaglio avanzamento tool e utilità per risultato tentativo |
    | `plugin-sdk/provider-zai-endpoint` | Helper per rilevamento endpoint Z.AI |
    | `plugin-sdk/async-lock-runtime` | Helper per lock async locale al processo per piccoli file di stato runtime |
    | `plugin-sdk/channel-activity-runtime` | Helper per telemetria attività canale |
    | `plugin-sdk/concurrency-runtime` | Helper per concorrenza limitata di task async |
    | `plugin-sdk/dedupe-runtime` | Helper per cache di dedupe in memoria |
    | `plugin-sdk/delivery-queue-runtime` | Helper per drenaggio delle consegne pendenti in uscita |
    | `plugin-sdk/file-access-runtime` | Helper sicuri per percorsi di file locali e sorgenti media |
    | `plugin-sdk/heartbeat-runtime` | Helper per evento Heartbeat e visibilità |
    | `plugin-sdk/number-runtime` | Helper per coercizione numerica |
    | `plugin-sdk/secure-random-runtime` | Helper per token/UUID sicuri |
    | `plugin-sdk/system-event-runtime` | Helper per coda eventi di sistema |
    | `plugin-sdk/transport-ready-runtime` | Helper per attesa della prontezza del trasporto |
    | `plugin-sdk/infra-runtime` | Shim di compatibilità deprecato; usa i sottopercorsi runtime mirati sopra |
    | `plugin-sdk/collection-runtime` | Piccoli helper per cache limitate |
    | `plugin-sdk/diagnostic-runtime` | Helper per flag diagnostici, eventi e contesto di trace |
    | `plugin-sdk/error-runtime` | Helper per grafo errori, formattazione, classificazione condivisa degli errori, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Fetch wrappato, proxy, opzione EnvHttpProxyAgent e helper per lookup fissato |
    | `plugin-sdk/runtime-fetch` | Fetch runtime consapevole del dispatcher senza import proxy/guarded-fetch |
    | `plugin-sdk/response-limit-runtime` | Reader limitato del corpo della risposta senza la superficie runtime media generica |
    | `plugin-sdk/session-binding-runtime` | Stato del binding della conversazione corrente senza routing binding configurato o store di pairing |
    | `plugin-sdk/session-store-runtime` | Helper per store sessioni senza import generici per scritture/manutenzione configurazione |
    | `plugin-sdk/context-visibility-runtime` | Risoluzione visibilità contesto e filtro del contesto supplementare senza import generici di configurazione/sicurezza |
    | `plugin-sdk/string-coerce-runtime` | Helper mirati per coercizione e normalizzazione di record primitivi/stringhe senza import markdown/logging |
    | `plugin-sdk/host-runtime` | Helper per normalizzazione hostname e host SCP |
    | `plugin-sdk/retry-runtime` | Helper per configurazione retry e runner di retry |
    | `plugin-sdk/agent-runtime` | Helper per directory/identità/workspace agent, inclusi `resolveAgentDir`, `resolveDefaultAgentDir` ed esportazione di compatibilità deprecata `resolveOpenClawAgentDir` |
    | `plugin-sdk/directory-runtime` | Query/dedup di directory basata su configurazione |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Sottopercorsi di funzionalità e test">
    | Sottopercorso | Esportazioni principali |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Helper condivisi per recuperare/trasformare/archiviare media, rilevamento delle dimensioni video basato su ffprobe e builder per payload multimediali |
    | `plugin-sdk/media-store` | Helper mirati per l'archivio media come `saveMediaBuffer` |
    | `plugin-sdk/media-generation-runtime` | Helper condivisi per il failover della generazione media, selezione dei candidati e messaggistica per modelli mancanti |
    | `plugin-sdk/media-understanding` | Tipi di provider per la comprensione dei media più esportazioni di helper immagine/audio rivolte ai provider |
    | `plugin-sdk/text-runtime` | Helper condivisi per testo/markdown/logging, come rimozione del testo visibile all'assistente, helper per rendering/chunking/tabelle markdown, helper di redazione, helper per tag direttiva e utilità per testo sicuro |
    | `plugin-sdk/text-chunking` | Helper per il chunking del testo in uscita |
    | `plugin-sdk/speech` | Tipi di provider vocale più esportazioni rivolte ai provider per direttive, registro, validazione, builder TTS compatibile con OpenAI e helper vocali |
    | `plugin-sdk/speech-core` | Tipi di provider vocale condivisi, registro, direttive, normalizzazione ed esportazioni di helper vocali |
    | `plugin-sdk/realtime-transcription` | Tipi di provider per trascrizione in tempo reale, helper di registro e helper condiviso per sessioni WebSocket |
    | `plugin-sdk/realtime-voice` | Tipi di provider voce in tempo reale e helper di registro |
    | `plugin-sdk/image-generation` | Tipi di provider per generazione immagini più helper per asset immagine/data URL e il builder di provider immagini compatibile con OpenAI |
    | `plugin-sdk/image-generation-core` | Tipi condivisi per generazione immagini, failover, autenticazione e helper di registro |
    | `plugin-sdk/music-generation` | Tipi di provider/richiesta/risultato per generazione musicale |
    | `plugin-sdk/music-generation-core` | Tipi condivisi per generazione musicale, helper di failover, lookup dei provider e parsing dei riferimenti modello |
    | `plugin-sdk/video-generation` | Tipi di provider/richiesta/risultato per generazione video |
    | `plugin-sdk/video-generation-core` | Tipi condivisi per generazione video, helper di failover, lookup dei provider e parsing dei riferimenti modello |
    | `plugin-sdk/webhook-targets` | Registro delle destinazioni Webhook e helper di installazione delle route |
    | `plugin-sdk/webhook-path` | Helper di normalizzazione del percorso Webhook |
    | `plugin-sdk/web-media` | Helper condivisi per il caricamento di media remoti/locali |
    | `plugin-sdk/zod` | `zod` riesportato per i consumatori dell'SDK dei plugin |
    | `plugin-sdk/testing` | Barrel di compatibilità ampio per test legacy dei plugin. I nuovi test delle estensioni dovrebbero invece importare sottopercorsi SDK mirati come `plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/test-env` o `plugin-sdk/test-fixtures` |
    | `plugin-sdk/plugin-test-api` | Helper minimale `createTestPluginApi` per test unitari di registrazione diretta dei plugin senza importare bridge di helper di test del repository |
    | `plugin-sdk/agent-runtime-test-contracts` | Fixture native dei contratti dell'adattatore agent-runtime per test di autenticazione, consegna, fallback, hook degli strumenti, overlay dei prompt, schema e proiezione della trascrizione |
    | `plugin-sdk/channel-test-helpers` | Helper di test orientati ai canali per contratti generici di azioni/setup/stato, asserzioni sulle directory, ciclo di vita di avvio account, threading di configurazione invio, mock runtime, problemi di stato, consegna in uscita e registrazione degli hook |
    | `plugin-sdk/channel-target-testing` | Suite condivisa di casi di errore per la risoluzione dei target nei test dei canali |
    | `plugin-sdk/plugin-test-contracts` | Helper di contratto per pacchetto Plugin, registrazione, artefatto pubblico, importazione diretta, API runtime ed effetti collaterali dell'importazione |
    | `plugin-sdk/provider-test-contracts` | Helper di contratto per runtime dei provider, autenticazione, discovery, onboard, catalogo, wizard, funzionalità media, policy di replay, audio live STT in tempo reale, ricerca/fetch web e stream |
    | `plugin-sdk/provider-http-test-mocks` | Mock HTTP/auth Vitest opzionali per test dei provider che esercitano `plugin-sdk/provider-http` |
    | `plugin-sdk/test-fixtures` | Fixture generiche per cattura runtime CLI, contesto sandbox, writer di skill, messaggio agente, evento di sistema, ricaricamento moduli, percorso dei plugin bundled, testo terminale, chunking, token di autenticazione e casi tipizzati |
    | `plugin-sdk/test-node-mocks` | Helper di mock mirati per builtin Node da usare dentro factory Vitest `vi.mock("node:*")` |
  </Accordion>

  <Accordion title="Sottopercorsi di memoria">
    | Sottopercorso | Esportazioni principali |
    | --- | --- |
    | `plugin-sdk/memory-core` | Superficie di helper memory-core bundled per helper manager/configurazione/file/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | Facciata runtime per indice/ricerca della memoria |
    | `plugin-sdk/memory-core-host-engine-foundation` | Esportazioni del motore foundation dell'host memoria |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Contratti di embedding dell'host memoria, accesso al registro, provider locale e helper generici batch/remoti |
    | `plugin-sdk/memory-core-host-engine-qmd` | Esportazioni del motore QMD dell'host memoria |
    | `plugin-sdk/memory-core-host-engine-storage` | Esportazioni del motore di archiviazione dell'host memoria |
    | `plugin-sdk/memory-core-host-multimodal` | Helper multimodali dell'host memoria |
    | `plugin-sdk/memory-core-host-query` | Helper di query dell'host memoria |
    | `plugin-sdk/memory-core-host-secret` | Helper per segreti dell'host memoria |
    | `plugin-sdk/memory-core-host-events` | Helper del journal eventi dell'host memoria |
    | `plugin-sdk/memory-core-host-status` | Helper di stato dell'host memoria |
    | `plugin-sdk/memory-core-host-runtime-cli` | Helper runtime CLI dell'host memoria |
    | `plugin-sdk/memory-core-host-runtime-core` | Helper runtime core dell'host memoria |
    | `plugin-sdk/memory-core-host-runtime-files` | Helper file/runtime dell'host memoria |
    | `plugin-sdk/memory-host-core` | Alias indipendente dal vendor per helper runtime core dell'host memoria |
    | `plugin-sdk/memory-host-events` | Alias indipendente dal vendor per helper del journal eventi dell'host memoria |
    | `plugin-sdk/memory-host-files` | Alias indipendente dal vendor per helper file/runtime dell'host memoria |
    | `plugin-sdk/memory-host-markdown` | Helper markdown gestito condivisi per plugin adiacenti alla memoria |
    | `plugin-sdk/memory-host-search` | Facciata runtime della memoria attiva per accesso al search-manager |
    | `plugin-sdk/memory-host-status` | Alias indipendente dal vendor per helper di stato dell'host memoria |
  </Accordion>

  <Accordion title="Sottopercorsi riservati per helper bundled">
    Al momento non ci sono sottopercorsi SDK riservati per helper bundled. Gli
    helper specifici del proprietario risiedono nel pacchetto Plugin proprietario,
    mentre i contratti host riutilizzabili usano sottopercorsi SDK generici come
    `plugin-sdk/gateway-runtime`,
    `plugin-sdk/security-runtime` e `plugin-sdk/plugin-config-runtime`.
  </Accordion>
</AccordionGroup>

## Correlati

- [Panoramica dell'SDK Plugin](/it/plugins/sdk-overview)
- [Configurazione dell'SDK Plugin](/it/plugins/sdk-setup)
- [Creazione di plugin](/it/plugins/building-plugins)
