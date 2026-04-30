---
read_when:
    - Scegliere il sottopercorso plugin-sdk corretto per un'importazione di Plugin
    - Verifica dei sottopercorsi dei Plugin inclusi e delle superfici di supporto
summary: 'Catalogo dei sottopercorsi del Plugin SDK: quali importazioni sono disponibili dove, raggruppate per area'
title: Sottopercorsi del Plugin SDK
x-i18n:
    generated_at: "2026-04-30T09:06:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6a8c431c1835fff6720a00984171e3f55886363654074d81859f50ca28a35104
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

  L'SDK Plugin è esposto come un insieme di sottopercorsi ristretti sotto `openclaw/plugin-sdk/`.
  Questa pagina cataloga i sottopercorsi usati comunemente, raggruppati per scopo. L'elenco
  completo generato di oltre 200 sottopercorsi si trova in `scripts/lib/plugin-sdk-entrypoints.json`;
  i sottopercorsi helper riservati per i Plugin in bundle compaiono lì, ma sono dettagli
  di implementazione a meno che una pagina della documentazione non li promuova esplicitamente. I manutentori possono verificare i sottopercorsi helper
  riservati attivi con `pnpm plugins:boundary-report:summary`; le esportazioni helper
  riservate inutilizzate fanno fallire il report CI invece di restare nell'SDK pubblico
  come debito di compatibilità dormiente.

  Per la guida alla creazione di Plugin, consulta [Panoramica del SDK Plugin](/it/plugins/sdk-overview).

  ## Ingresso Plugin

  | Sottopercorso                            | Esportazioni principali                                                                                                                                                      |
  | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `plugin-sdk/plugin-entry`                 | `definePluginEntry`                                                                                                                                                          |
  | `plugin-sdk/core`                         | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`                                       |
  | `plugin-sdk/config-schema`                | `OpenClawSchema`                                                                                                                                                             |
  | `plugin-sdk/provider-entry`               | `defineSingleProviderPluginEntry`                                                                                                                                            |
  | `plugin-sdk/testing`                      | Barrel di compatibilità ampio per i test dei Plugin legacy; per i nuovi test di estensione preferisci sottopercorsi di test mirati                                          |
  | `plugin-sdk/plugin-test-api`              | Builder mock minimale di `OpenClawPluginApi` per test unitari di registrazione diretta dei Plugin                                                                            |
  | `plugin-sdk/agent-runtime-test-contracts` | Fixture dei contratti dell'adapter runtime agente nativo per profili di autenticazione, soppressione della consegna, classificazione di fallback, hook degli strumenti, overlay dei prompt, schemi e riparazione della trascrizione |
  | `plugin-sdk/channel-test-helpers`         | Helper di test per ciclo di vita degli account di canale, directory, configurazione di invio, mock runtime, hook, voce di canale in bundle, timestamp envelope, risposta di pairing e contratto canale generico |
  | `plugin-sdk/channel-target-testing`       | Suite di test condivisa per i casi di errore della risoluzione dei target di canale                                                                                          |
  | `plugin-sdk/plugin-test-contracts`        | Helper di contratto per registrazione Plugin, manifest del pacchetto, artifact pubblico, API runtime, effetto collaterale di importazione e importazione diretta             |
  | `plugin-sdk/plugin-test-runtime`          | Fixture per test di runtime Plugin, registro, registrazione provider, procedura guidata di setup e flusso attività runtime                                                   |
  | `plugin-sdk/provider-test-contracts`      | Helper di contratto per runtime provider, autenticazione, discovery, onboarding, catalogo, capacità media, policy di replay, audio live STT in tempo reale, ricerca/fetch web e procedura guidata |
  | `plugin-sdk/provider-http-test-mocks`     | Mock HTTP/autenticazione Vitest opt-in per test dei provider che esercitano `plugin-sdk/provider-http`                                                                        |
  | `plugin-sdk/test-env`                     | Fixture per ambiente di test, fetch/rete, server HTTP eliminabile, richiesta in ingresso, live test, filesystem temporaneo e controllo del tempo                             |
  | `plugin-sdk/test-fixtures`                | Fixture di test generiche per CLI, sandbox, skill, messaggio agente, evento di sistema, ricaricamento modulo, percorso Plugin in bundle, terminale, chunking, token di autenticazione e casi tipizzati |
  | `plugin-sdk/test-node-mocks`              | Helper mock mirati per builtin Node da usare dentro le factory Vitest `vi.mock("node:*")`                                                                                    |
  | `plugin-sdk/migration`                    | Helper per elementi del provider di migrazione come `createMigrationItem`, costanti di motivo, marker di stato elemento, helper di redazione e `summarizeMigrationItems`      |
  | `plugin-sdk/migration-runtime`            | Helper di migrazione runtime come `copyMigrationFileItem`, `withCachedMigrationConfigRuntime` e `writeMigrationReport`                                                       |

  <AccordionGroup>
  <Accordion title="Sottopercorsi canale">
    | Sottopercorso | Esportazioni principali |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Esportazione dello schema Zod radice `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, più `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Helper condivisi per la procedura guidata di setup, prompt allowlist, builder di stato setup |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Helper per configurazione multi-account/action gate, helper di fallback all'account predefinito |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, helper di normalizzazione degli ID account |
    | `plugin-sdk/account-resolution` | Helper per ricerca account e fallback predefinito |
    | `plugin-sdk/account-helpers` | Helper ristretti per lista account/azione account |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | Primitive condivise dello schema di configurazione canale e builder generico |
    | `plugin-sdk/bundled-channel-config-schema` | Schemi di configurazione dei canali OpenClaw in bundle solo per Plugin in bundle mantenuti |
    | `plugin-sdk/channel-config-schema-legacy` | Alias di compatibilità deprecato per gli schemi di configurazione dei canali in bundle |
    | `plugin-sdk/telegram-command-config` | Helper di normalizzazione/validazione dei comandi personalizzati Telegram con fallback al contratto in bundle |
    | `plugin-sdk/command-gating` | Helper ristretti per gate di autorizzazione comandi |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`, `createChannelRunQueue`, helper per ciclo di vita/finalizzazione dello stream bozza |
    | `plugin-sdk/inbound-envelope` | Helper condivisi per route in ingresso e builder envelope |
    | `plugin-sdk/inbound-reply-dispatch` | Helper condivisi per registrazione e dispatch in ingresso |
    | `plugin-sdk/messaging-targets` | Helper di parsing/matching dei target |
    | `plugin-sdk/outbound-media` | Helper condivisi per caricamento media in uscita |
    | `plugin-sdk/outbound-send-deps` | Ricerca leggera delle dipendenze di invio in uscita per adapter canale |
    | `plugin-sdk/outbound-runtime` | Helper per consegna in uscita, identità, delegato di invio, sessione, formattazione e pianificazione payload |
    | `plugin-sdk/poll-runtime` | Helper ristretti di normalizzazione dei sondaggi |
    | `plugin-sdk/thread-bindings-runtime` | Helper per ciclo di vita e adapter dei binding dei thread |
    | `plugin-sdk/agent-media-payload` | Builder legacy del payload media agente |
    | `plugin-sdk/conversation-runtime` | Helper per conversazione/binding thread, pairing e binding configurati |
    | `plugin-sdk/runtime-config-snapshot` | Helper per snapshot della configurazione runtime |
    | `plugin-sdk/runtime-group-policy` | Helper per risoluzione runtime della policy di gruppo |
    | `plugin-sdk/channel-status` | Helper condivisi per snapshot/riepilogo dello stato canale |
    | `plugin-sdk/channel-config-primitives` | Primitive ristrette dello schema di configurazione canale |
    | `plugin-sdk/channel-config-writes` | Helper di autorizzazione per scrittura della configurazione canale |
    | `plugin-sdk/channel-plugin-common` | Esportazioni condivise del preambolo dei Plugin canale |
    | `plugin-sdk/allowlist-config-edit` | Helper di modifica/lettura della configurazione allowlist |
    | `plugin-sdk/group-access` | Helper condivisi per decisioni di accesso ai gruppi |
    | `plugin-sdk/direct-dm` | Helper condivisi di autenticazione/guardia direct-DM |
    | `plugin-sdk/discord` | Facciata di compatibilità Discord deprecata per `@openclaw/discord@2026.3.13` pubblicato e compatibilità del proprietario tracciata; i nuovi Plugin devono usare i sottopercorsi generici dell'SDK canale |
    | `plugin-sdk/telegram-account` | Facciata di compatibilità deprecata per risoluzione account Telegram per compatibilità del proprietario tracciata; i nuovi Plugin devono usare gli helper runtime iniettati o i sottopercorsi generici dell'SDK canale |
    | `plugin-sdk/zalouser` | Facciata di compatibilità deprecata Zalo Personal per pacchetti Lark/Zalo pubblicati che importano ancora l'autorizzazione dei comandi del mittente; i nuovi Plugin devono usare `plugin-sdk/command-auth` |
    | `plugin-sdk/interactive-runtime` | Helper per presentazione semantica dei messaggi, consegna e risposte interattive legacy. Consulta [Presentazione dei messaggi](/it/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Barrel di compatibilità per debounce in ingresso, matching delle menzioni, helper della policy di menzione e helper envelope |
    | `plugin-sdk/channel-inbound-debounce` | Helper ristretti per debounce in ingresso |
    | `plugin-sdk/channel-mention-gating` | Helper ristretti per policy di menzione, marker di menzione e testo di menzione senza la superficie runtime in ingresso più ampia |
    | `plugin-sdk/channel-envelope` | Helper ristretti di formattazione envelope in ingresso |
    | `plugin-sdk/channel-location` | Contesto di posizione del canale e helper di formattazione |
    | `plugin-sdk/channel-logging` | Helper di logging canale per drop in ingresso ed errori di digitazione/ack |
    | `plugin-sdk/channel-send-result` | Tipi di risultato risposta |
    | `plugin-sdk/channel-actions` | Helper per azioni sui messaggi di canale, più helper schema nativi deprecati mantenuti per compatibilità dei Plugin |
    | `plugin-sdk/channel-route` | Helper condivisi per normalizzazione route, risoluzione target guidata dal parser, conversione ID thread in stringa, chiavi route deduplicate/compatte, tipi target analizzati e confronto route/target |
    | `plugin-sdk/channel-targets` | Helper di parsing dei target; i chiamanti del confronto route devono usare `plugin-sdk/channel-route` |
    | `plugin-sdk/channel-contract` | Tipi di contratto canale |
    | `plugin-sdk/channel-feedback` | Cablaggio di feedback/reaction |
    | `plugin-sdk/channel-secret-runtime` | Helper ristretti per contratto dei segreti come `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment` e tipi target segreto |
  </Accordion>

  <Accordion title="Sottopercorsi dei provider">
    | Sottopercorso | Esportazioni principali |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | Facciata provider LM Studio supportata per configurazione, rilevamento del catalogo e preparazione dei modelli a runtime |
    | `plugin-sdk/lmstudio-runtime` | Facciata runtime LM Studio supportata per impostazioni predefinite del server locale, rilevamento dei modelli, intestazioni delle richieste e helper per modelli caricati |
    | `plugin-sdk/provider-setup` | Helper selezionati per la configurazione di provider locali/autogestiti |
    | `plugin-sdk/self-hosted-provider-setup` | Helper mirati per la configurazione di provider autogestiti compatibili con OpenAI |
    | `plugin-sdk/cli-backend` | Impostazioni predefinite del backend CLI + costanti watchdog |
    | `plugin-sdk/provider-auth-runtime` | Helper runtime per la risoluzione delle chiavi API per Plugin provider |
    | `plugin-sdk/provider-auth-api-key` | Helper di onboarding/scrittura profilo per chiavi API, come `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Builder standard dei risultati di autenticazione OAuth |
    | `plugin-sdk/provider-auth-login` | Helper condivisi per login interattivo per Plugin provider |
    | `plugin-sdk/provider-env-vars` | Helper di ricerca delle variabili d'ambiente di autenticazione del provider |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, builder condivisi per criteri di replay, helper per endpoint provider e helper di normalizzazione degli ID modello come `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-runtime` | Hook runtime di arricchimento del catalogo provider e seams del registro plugin-provider per test di contratto |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Helper generici per funzionalità HTTP/endpoint dei provider, errori HTTP dei provider e helper per moduli multipart di trascrizione audio |
    | `plugin-sdk/provider-web-fetch-contract` | Helper mirati del contratto di configurazione/selezione web-fetch, come `enablePluginInConfig` e `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Helper di registrazione/cache dei provider web-fetch |
    | `plugin-sdk/provider-web-search-config-contract` | Helper mirati di configurazione/credenziali web-search per provider che non richiedono cablaggio di abilitazione del Plugin |
    | `plugin-sdk/provider-web-search-contract` | Helper mirati del contratto di configurazione/credenziali web-search, come `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` e setter/getter di credenziali con ambito |
    | `plugin-sdk/provider-web-search` | Helper di registrazione/cache/runtime dei provider web-search |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, pulizia schema Gemini + diagnostica e helper di compatibilità xAI come `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` e simili |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, tipi di wrapper di stream e helper wrapper condivisi Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-transport-runtime` | Helper di trasporto provider nativi, come fetch protetto, trasformazioni dei messaggi di trasporto e stream di eventi di trasporto scrivibili |
    | `plugin-sdk/provider-onboard` | Helper di patch della configurazione di onboarding |
    | `plugin-sdk/global-singleton` | Helper singleton/mappa/cache locali al processo |
    | `plugin-sdk/group-activation` | Helper mirati per modalità di attivazione di gruppo e analisi dei comandi |
  </Accordion>

  <Accordion title="Sottopercorsi di autenticazione e sicurezza">
    | Sottopercorso | Esportazioni principali |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, helper del registro comandi inclusa la formattazione dinamica del menu degli argomenti, helper di autorizzazione del mittente |
    | `plugin-sdk/command-status` | Builder di messaggi di comando/aiuto come `buildCommandsMessagePaginated` e `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Helper per risoluzione degli approvatori e autenticazione azioni nella stessa chat |
    | `plugin-sdk/approval-client-runtime` | Helper nativi per profili/filtri di approvazione exec |
    | `plugin-sdk/approval-delivery-runtime` | Adattatori nativi per funzionalità/consegna delle approvazioni |
    | `plugin-sdk/approval-gateway-runtime` | Helper condiviso di risoluzione approval Gateway |
    | `plugin-sdk/approval-handler-adapter-runtime` | Helper leggeri di caricamento adattatori nativi di approvazione per entrypoint di canale hot |
    | `plugin-sdk/approval-handler-runtime` | Helper runtime più ampi per gestori di approvazione; preferisci i seams adapter/gateway più mirati quando bastano |
    | `plugin-sdk/approval-native-runtime` | Helper nativi per target di approvazione + associazione account |
    | `plugin-sdk/approval-reply-runtime` | Helper per payload di risposta approvazione exec/plugin |
    | `plugin-sdk/approval-runtime` | Helper per payload di approvazione exec/plugin, helper nativi di routing/runtime delle approvazioni e helper di visualizzazione strutturata delle approvazioni come `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | Helper mirati per reimpostazione dedupe delle risposte in ingresso |
    | `plugin-sdk/channel-contract-testing` | Helper mirati per test di contratto dei canali senza il broad testing barrel |
    | `plugin-sdk/command-auth-native` | Autenticazione nativa dei comandi, formattazione dinamica del menu degli argomenti e helper nativi per target di sessione |
    | `plugin-sdk/command-detection` | Helper condivisi di rilevamento comandi |
    | `plugin-sdk/command-primitives-runtime` | Predicati leggeri sul testo dei comandi per percorsi di canale hot |
    | `plugin-sdk/command-surface` | Helper per normalizzazione del corpo comando e command-surface |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Helper mirati di raccolta del contratto dei segreti per superfici di segreti canale/plugin |
    | `plugin-sdk/secret-ref-runtime` | Helper mirati per `coerceSecretRef` e tipizzazione SecretRef per analisi di contratto/configurazione dei segreti |
    | `plugin-sdk/security-runtime` | Helper condivisi per fiducia, gate DM, contenuti esterni, redazione di testo sensibile, confronto di segreti a tempo costante e raccolta di segreti |
    | `plugin-sdk/ssrf-policy` | Helper per allowlist host e criteri SSRF di rete privata |
    | `plugin-sdk/ssrf-dispatcher` | Helper mirati per dispatcher con pinning senza l'ampia superficie runtime dell'infrastruttura |
    | `plugin-sdk/ssrf-runtime` | Dispatcher con pinning, fetch protetto da SSRF, errore SSRF e helper per criteri SSRF |
    | `plugin-sdk/secret-input` | Helper di analisi dell'input dei segreti |
    | `plugin-sdk/webhook-ingress` | Helper per richieste/target Webhook e coercizione raw websocket/body |
    | `plugin-sdk/webhook-request-guards` | Helper per dimensione/timeout del corpo richiesta |
  </Accordion>

  <Accordion title="Sottopercorsi di runtime e archiviazione">
    | Sottopercorso | Esportazioni principali |
    | --- | --- |
    | `plugin-sdk/runtime` | Helper ampi per runtime, logging, backup e installazione Plugin |
    | `plugin-sdk/runtime-env` | Helper mirati per env runtime, logger, timeout, retry e backoff |
    | `plugin-sdk/browser-config` | Facciata di configurazione browser supportata per profili/default normalizzati, parsing degli URL CDP e helper di autenticazione per il controllo del browser |
    | `plugin-sdk/channel-runtime-context` | Helper generici per registrazione e lookup del contesto runtime del canale |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Helper condivisi per comandi, hook, HTTP e interattività dei Plugin |
    | `plugin-sdk/hook-runtime` | Helper condivisi per pipeline di hook Webhook/interni |
    | `plugin-sdk/lazy-runtime` | Helper per import/binding runtime lazy come `createLazyRuntimeModule`, `createLazyRuntimeMethod` e `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Helper per esecuzione di processi |
    | `plugin-sdk/cli-runtime` | Helper CLI per formattazione, attesa, versione, invocazione argomenti e gruppi di comandi lazy |
    | `plugin-sdk/gateway-runtime` | Client Gateway, helper di avvio client pronto per event loop, RPC CLI del Gateway, errori del protocollo Gateway e helper per patch dello stato del canale |
    | `plugin-sdk/config-types` | Superficie di configurazione solo tipo per forme di configurazione Plugin come `OpenClawConfig` e tipi di configurazione canale/provider |
    | `plugin-sdk/plugin-config-runtime` | Helper runtime per lookup della configurazione Plugin come `requireRuntimeConfig`, `resolvePluginConfigObject` e `resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | Helper per mutazione transazionale della configurazione come `mutateConfigFile`, `replaceConfigFile` e `logConfigUpdated` |
    | `plugin-sdk/runtime-config-snapshot` | Helper per snapshot della configurazione del processo corrente come `getRuntimeConfig`, `getRuntimeConfigSnapshot` e setter di snapshot di test |
    | `plugin-sdk/telegram-command-config` | Normalizzazione di nome/descrizione dei comandi Telegram e controlli di duplicati/conflitti, anche quando la superficie del contratto Telegram bundled non è disponibile |
    | `plugin-sdk/text-autolink-runtime` | Rilevamento di autolink per riferimenti a file senza il barrel ampio text-runtime |
    | `plugin-sdk/approval-runtime` | Helper di approvazione exec/Plugin, builder di capacità di approvazione, helper auth/profilo, helper di routing/runtime nativi e formattazione strutturata dei percorsi di visualizzazione dell'approvazione |
    | `plugin-sdk/reply-runtime` | Helper runtime condivisi per inbound/risposta, chunking, dispatch, Heartbeat, planner di risposta |
    | `plugin-sdk/reply-dispatch-runtime` | Helper mirati per dispatch/finalizzazione della risposta e label di conversazione |
    | `plugin-sdk/reply-history` | Helper condivisi per cronologia risposte a finestra breve e marker come `buildHistoryContext`, `HISTORY_CONTEXT_MARKER`, `recordPendingHistoryEntry` e `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Helper mirati per chunking di testo/Markdown |
    | `plugin-sdk/session-store-runtime` | Helper per percorso dello store di sessione, chiave di sessione, aggiornato-il e mutazione dello store |
    | `plugin-sdk/cron-store-runtime` | Helper per percorso/caricamento/salvataggio dello store Cron |
    | `plugin-sdk/state-paths` | Helper per percorsi dir State/OAuth |
    | `plugin-sdk/routing` | Helper per route/chiave di sessione/binding account come `resolveAgentRoute`, `buildAgentSessionKey` e `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Helper condivisi per riepilogo dello stato canale/account, default dello stato runtime e helper per metadati dei problemi |
    | `plugin-sdk/target-resolver-runtime` | Helper condivisi per resolver target |
    | `plugin-sdk/string-normalization-runtime` | Helper per normalizzazione di slug/stringhe |
    | `plugin-sdk/request-url` | Estrae URL stringa da input simili a fetch/request |
    | `plugin-sdk/run-command` | Runner di comandi temporizzato con risultati stdout/stderr normalizzati |
    | `plugin-sdk/param-readers` | Reader comuni per parametri tool/CLI |
    | `plugin-sdk/tool-payload` | Estrae payload normalizzati da oggetti risultato dei tool |
    | `plugin-sdk/tool-send` | Estrae campi canonici del target di invio dagli argomenti del tool |
    | `plugin-sdk/temp-path` | Helper condivisi per percorsi di download temporanei |
    | `plugin-sdk/logging-core` | Helper per logger di sottosistema e redazione |
    | `plugin-sdk/markdown-table-runtime` | Helper per modalità tabella Markdown e conversione |
    | `plugin-sdk/model-session-runtime` | Helper per override modello/sessione come `applyModelOverrideToSessionEntry` e `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | Helper per risoluzione della configurazione del provider Talk |
    | `plugin-sdk/json-store` | Piccoli helper di lettura/scrittura dello stato JSON |
    | `plugin-sdk/file-lock` | Helper per file-lock rientranti |
    | `plugin-sdk/persistent-dedupe` | Helper per cache di dedupe persistita su disco |
    | `plugin-sdk/acp-runtime` | Helper runtime/sessione ACP e dispatch delle risposte |
    | `plugin-sdk/acp-runtime-backend` | Helper leggeri per registrazione backend ACP e dispatch delle risposte per Plugin caricati all'avvio |
    | `plugin-sdk/acp-binding-resolve-runtime` | Risoluzione binding ACP in sola lettura senza import di avvio lifecycle |
    | `plugin-sdk/agent-config-primitives` | Primitive mirate di schema di configurazione runtime dell'agente |
    | `plugin-sdk/boolean-param` | Reader permissivo per parametri booleani |
    | `plugin-sdk/dangerous-name-runtime` | Helper per risoluzione del matching di nomi pericolosi |
    | `plugin-sdk/device-bootstrap` | Helper per bootstrap del dispositivo e token di pairing |
    | `plugin-sdk/extension-shared` | Primitive helper condivise per canali passivi, stato e proxy ambientali |
    | `plugin-sdk/models-provider-runtime` | Helper per comando/risposta provider `/models` |
    | `plugin-sdk/skill-commands-runtime` | Helper per elenco dei comandi Skills |
    | `plugin-sdk/native-command-registry` | Helper per registro/build/serializzazione di comandi nativi |
    | `plugin-sdk/agent-harness` | Superficie sperimentale per Plugin attendibili per harness agente di basso livello: tipi harness, helper steer/abort per active-run, helper bridge tool OpenClaw, helper policy tool runtime-plan, classificazione degli esiti del terminale, helper di formattazione/dettaglio dell'avanzamento dei tool e utility per risultati dei tentativi |
    | `plugin-sdk/provider-zai-endpoint` | Helper per rilevamento endpoint Z.AI |
    | `plugin-sdk/async-lock-runtime` | Helper per lock async locale al processo per piccoli file di stato runtime |
    | `plugin-sdk/channel-activity-runtime` | Helper di telemetria dell'attività del canale |
    | `plugin-sdk/concurrency-runtime` | Helper per concorrenza limitata dei task async |
    | `plugin-sdk/dedupe-runtime` | Helper per cache di dedupe in memoria |
    | `plugin-sdk/delivery-queue-runtime` | Helper per svuotamento delle consegne pendenti in uscita |
    | `plugin-sdk/file-access-runtime` | Helper per percorsi sicuri di file locali e sorgenti media |
    | `plugin-sdk/heartbeat-runtime` | Helper per evento Heartbeat e visibilità |
    | `plugin-sdk/number-runtime` | Helper per coercizione numerica |
    | `plugin-sdk/secure-random-runtime` | Helper per token/UUID sicuri |
    | `plugin-sdk/system-event-runtime` | Helper per coda di eventi di sistema |
    | `plugin-sdk/transport-ready-runtime` | Helper di attesa per prontezza del trasporto |
    | `plugin-sdk/infra-runtime` | Shim di compatibilità deprecato; usa i sottopercorsi runtime mirati sopra |
    | `plugin-sdk/collection-runtime` | Piccoli helper per cache limitata |
    | `plugin-sdk/diagnostic-runtime` | Helper per flag diagnostici, eventi e contesto di trace |
    | `plugin-sdk/error-runtime` | Helper per grafo degli errori, formattazione, classificazione condivisa degli errori, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Fetch wrappato, proxy, opzione EnvHttpProxyAgent e helper per lookup fissato |
    | `plugin-sdk/runtime-fetch` | Fetch runtime consapevole del dispatcher senza import proxy/guarded-fetch |
    | `plugin-sdk/response-limit-runtime` | Reader limitato del corpo della risposta senza la superficie runtime media ampia |
    | `plugin-sdk/session-binding-runtime` | Stato del binding della conversazione corrente senza routing di binding configurato o store di pairing |
    | `plugin-sdk/session-store-runtime` | Helper session-store senza import ampi di scrittura/manutenzione della configurazione |
    | `plugin-sdk/context-visibility-runtime` | Risoluzione della visibilità del contesto e filtro del contesto supplementare senza import ampi di configurazione/sicurezza |
    | `plugin-sdk/string-coerce-runtime` | Helper mirati per coercizione e normalizzazione di record primitivi/stringhe senza import Markdown/logging |
    | `plugin-sdk/host-runtime` | Helper per normalizzazione di hostname e host SCP |
    | `plugin-sdk/retry-runtime` | Helper per configurazione retry e runner retry |
    | `plugin-sdk/agent-runtime` | Helper per dir/identità/workspace agente |
    | `plugin-sdk/directory-runtime` | Query/dedup directory basate su configurazione |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Sottopercorsi di capacità e test">
    | Sottopercorso | Esportazioni principali |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Helper condivisi per recupero/trasformazione/archiviazione dei media, rilevamento delle dimensioni video basato su ffprobe e builder di payload multimediali |
    | `plugin-sdk/media-store` | Helper mirati per l'archivio multimediale, come `saveMediaBuffer` |
    | `plugin-sdk/media-generation-runtime` | Helper condivisi per il failover della generazione multimediale, selezione dei candidati e messaggistica per modelli mancanti |
    | `plugin-sdk/media-understanding` | Tipi di provider per la comprensione dei media, più esportazioni di helper per immagini/audio rivolte ai provider |
    | `plugin-sdk/text-runtime` | Helper condivisi per testo/markdown/logging, come rimozione del testo visibile all'assistente, helper per rendering/suddivisione in chunk/tabelle markdown, helper di redazione, helper per tag direttiva e utilità per testo sicuro |
    | `plugin-sdk/text-chunking` | Helper per la suddivisione in chunk del testo in uscita |
    | `plugin-sdk/speech` | Tipi di provider vocali, più esportazioni rivolte ai provider per direttive, registro, validazione, builder TTS compatibile con OpenAI e helper vocali |
    | `plugin-sdk/speech-core` | Tipi di provider vocali condivisi, registro, direttiva, normalizzazione ed esportazioni di helper vocali |
    | `plugin-sdk/realtime-transcription` | Tipi di provider per trascrizione in tempo reale, helper di registro e helper condiviso per sessioni WebSocket |
    | `plugin-sdk/realtime-voice` | Tipi di provider per voce in tempo reale e helper di registro |
    | `plugin-sdk/image-generation` | Tipi di provider per generazione di immagini, più helper per asset immagine/data URL e builder di provider immagini compatibile con OpenAI |
    | `plugin-sdk/image-generation-core` | Tipi condivisi per generazione di immagini, failover, auth e helper di registro |
    | `plugin-sdk/music-generation` | Tipi di provider/richiesta/risultato per generazione musicale |
    | `plugin-sdk/music-generation-core` | Tipi condivisi per generazione musicale, helper di failover, lookup provider e parsing model-ref |
    | `plugin-sdk/video-generation` | Tipi di provider/richiesta/risultato per generazione video |
    | `plugin-sdk/video-generation-core` | Tipi condivisi per generazione video, helper di failover, lookup provider e parsing model-ref |
    | `plugin-sdk/webhook-targets` | Registro dei target Webhook e helper per installazione delle route |
    | `plugin-sdk/webhook-path` | Helper di normalizzazione dei percorsi Webhook |
    | `plugin-sdk/web-media` | Helper condivisi per caricamento di media remoti/locali |
    | `plugin-sdk/zod` | `zod` riesportato per i consumatori del SDK Plugin |
    | `plugin-sdk/testing` | Barrel di ampia compatibilità per test di plugin legacy. I nuovi test delle estensioni dovrebbero invece importare sottopercorsi SDK mirati, come `plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/test-env` o `plugin-sdk/test-fixtures` |
    | `plugin-sdk/plugin-test-api` | Helper minimo `createTestPluginApi` per test unitari di registrazione diretta dei plugin senza importare bridge di helper di test del repository |
    | `plugin-sdk/agent-runtime-test-contracts` | Fixture native dei contratti dell'adattatore agent-runtime per test di auth, consegna, fallback, tool-hook, prompt-overlay, schema e proiezione della trascrizione |
    | `plugin-sdk/channel-test-helpers` | Helper di test orientati ai canali per contratti generici di azioni/setup/stato, asserzioni su directory, ciclo di vita di avvio account, threading send-config, mock runtime, problemi di stato, consegna in uscita e registrazione hook |
    | `plugin-sdk/channel-target-testing` | Suite condivisa di casi di errore per la risoluzione dei target nei test dei canali |
    | `plugin-sdk/plugin-test-contracts` | Helper di contratto per pacchetto Plugin, registrazione, artefatto pubblico, import diretto, API runtime ed effetti collaterali di import |
    | `plugin-sdk/provider-test-contracts` | Helper di contratto per runtime provider, auth, discovery, onboard, catalogo, wizard, capacità multimediali, policy di replay, audio live STT in tempo reale, web-search/fetch e stream |
    | `plugin-sdk/provider-http-test-mocks` | Mock HTTP/auth Vitest opt-in per test di provider che esercitano `plugin-sdk/provider-http` |
    | `plugin-sdk/test-fixtures` | Fixture generiche per cattura runtime CLI, contesto sandbox, writer di skill, messaggio agente, evento di sistema, ricaricamento modulo, percorso plugin in bundle, terminal-text, suddivisione in chunk, auth-token e casi tipizzati |
    | `plugin-sdk/test-node-mocks` | Helper mirati per mock dei builtin Node da usare dentro factory Vitest `vi.mock("node:*")` |
  </Accordion>

  <Accordion title="Sottopercorsi della memoria">
    | Sottopercorso | Esportazioni principali |
    | --- | --- |
    | `plugin-sdk/memory-core` | Superficie di helper memory-core in bundle per helper manager/config/file/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | Facciata runtime per indice/ricerca della memoria |
    | `plugin-sdk/memory-core-host-engine-foundation` | Esportazioni del motore foundation dell'host della memoria |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Contratti di embedding dell'host della memoria, accesso al registro, provider locale e helper generici batch/remoti |
    | `plugin-sdk/memory-core-host-engine-qmd` | Esportazioni del motore QMD dell'host della memoria |
    | `plugin-sdk/memory-core-host-engine-storage` | Esportazioni del motore di archiviazione dell'host della memoria |
    | `plugin-sdk/memory-core-host-multimodal` | Helper multimodali dell'host della memoria |
    | `plugin-sdk/memory-core-host-query` | Helper di query dell'host della memoria |
    | `plugin-sdk/memory-core-host-secret` | Helper per segreti dell'host della memoria |
    | `plugin-sdk/memory-core-host-events` | Helper per journal eventi dell'host della memoria |
    | `plugin-sdk/memory-core-host-status` | Helper di stato dell'host della memoria |
    | `plugin-sdk/memory-core-host-runtime-cli` | Helper runtime CLI dell'host della memoria |
    | `plugin-sdk/memory-core-host-runtime-core` | Helper runtime core dell'host della memoria |
    | `plugin-sdk/memory-core-host-runtime-files` | Helper file/runtime dell'host della memoria |
    | `plugin-sdk/memory-host-core` | Alias vendor-neutral per helper runtime core dell'host della memoria |
    | `plugin-sdk/memory-host-events` | Alias vendor-neutral per helper per journal eventi dell'host della memoria |
    | `plugin-sdk/memory-host-files` | Alias vendor-neutral per helper file/runtime dell'host della memoria |
    | `plugin-sdk/memory-host-markdown` | Helper condivisi per markdown gestito per plugin adiacenti alla memoria |
    | `plugin-sdk/memory-host-search` | Facciata runtime Active Memory per accesso al search-manager |
    | `plugin-sdk/memory-host-status` | Alias vendor-neutral per helper di stato dell'host della memoria |
  </Accordion>

  <Accordion title="Sottopercorsi helper in bundle riservati">
    Al momento non esistono sottopercorsi SDK helper in bundle riservati. Gli helper specifici del proprietario
    risiedono dentro il pacchetto plugin proprietario, mentre i contratti host riutilizzabili
    usano sottopercorsi SDK generici come `plugin-sdk/gateway-runtime`,
    `plugin-sdk/security-runtime` e `plugin-sdk/plugin-config-runtime`.
  </Accordion>
</AccordionGroup>

## Correlati

- [Panoramica del SDK Plugin](/it/plugins/sdk-overview)
- [Configurazione del SDK Plugin](/it/plugins/sdk-setup)
- [Creazione di plugin](/it/plugins/building-plugins)
