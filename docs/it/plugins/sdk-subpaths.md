---
read_when:
    - Scegliere il sottopercorso plugin-sdk corretto per un'importazione di Plugin
    - Verifica dei sottopercorsi dei Plugin in bundle e delle interfacce di supporto
summary: 'Catalogo dei sottopercorsi del Plugin SDK: quali import risiedono dove, raggruppati per area'
title: Sottopercorsi dell'SDK Plugin
x-i18n:
    generated_at: "2026-05-02T20:59:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: bc0d2dcf030796d2c73d4d679b9f8d7f6a8aaf71c6b5232b60afbbb50f42b348
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

  Il Plugin SDK viene esposto come un insieme di sottopercorsi ristretti sotto `openclaw/plugin-sdk/`.
  Questa pagina cataloga i sottopercorsi usati comunemente raggruppati per scopo. L'elenco completo generato
  di oltre 200 sottopercorsi si trova in `scripts/lib/plugin-sdk-entrypoints.json`;
  i sottopercorsi helper riservati per i Plugin in bundle compaiono lì, ma sono un
  dettaglio di implementazione a meno che una pagina della documentazione non li promuova esplicitamente. I maintainer possono verificare i sottopercorsi helper riservati
  attivi con `pnpm plugins:boundary-report:summary`; le esportazioni helper riservate
  non usate fanno fallire il report CI invece di restare nell'SDK pubblico
  come debito di compatibilità dormiente.

  Per la guida alla creazione dei Plugin, consulta [Panoramica del Plugin SDK](/it/plugins/sdk-overview).

  ## Voce del Plugin

  | Sottopercorso                            | Esportazioni principali                                                                                                                                                       |
  | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `plugin-sdk/plugin-entry`                 | `definePluginEntry`                                                                                                                                                          |
  | `plugin-sdk/core`                         | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema`       |
  | `plugin-sdk/config-schema`                | `OpenClawSchema`                                                                                                                                                             |
  | `plugin-sdk/provider-entry`               | `defineSingleProviderPluginEntry`                                                                                                                                            |
  | `plugin-sdk/testing`                      | Barrel di compatibilità ampio per test di Plugin legacy; per i nuovi test delle estensioni preferisci sottopercorsi di test mirati                                          |
  | `plugin-sdk/plugin-test-api`              | Builder mock minimale di `OpenClawPluginApi` per test unitari di registrazione diretta dei Plugin                                                                            |
  | `plugin-sdk/agent-runtime-test-contracts` | Fixture native dei contratti dell'adapter agent-runtime per profili di autenticazione, soppressione della consegna, classificazione di fallback, hook degli strumenti, overlay dei prompt, schemi e riparazione delle trascrizioni |
  | `plugin-sdk/channel-test-helpers`         | Helper di test per ciclo di vita degli account di canale, directory, configurazione di invio, mock runtime, hook, voce di canale in bundle, timestamp dell'envelope, risposta di pairing e contratti generici dei canali |
  | `plugin-sdk/channel-target-testing`       | Suite di test condivisa per casi di errore nella risoluzione dei target di canale                                                                                           |
  | `plugin-sdk/plugin-test-contracts`        | Helper per contratti di registrazione Plugin, manifesto del pacchetto, artefatto pubblico, API runtime, side effect di importazione e importazione diretta                  |
  | `plugin-sdk/plugin-test-runtime`          | Fixture per test di runtime Plugin, registry, registrazione provider, setup wizard e task-flow runtime                                                                       |
  | `plugin-sdk/provider-test-contracts`      | Helper per contratti di runtime provider, autenticazione, discovery, onboarding, catalogo, capacità multimediale, policy di replay, audio live STT in tempo reale, ricerca/fetch web e wizard |
  | `plugin-sdk/provider-http-test-mocks`     | Mock HTTP/autenticazione Vitest opt-in per test dei provider che esercitano `plugin-sdk/provider-http`                                                                       |
  | `plugin-sdk/test-env`                     | Fixture per ambiente di test, fetch/rete, server HTTP disposable, richiesta in ingresso, live-test, filesystem temporaneo e controllo del tempo                             |
  | `plugin-sdk/test-fixtures`                | Fixture di test generiche per CLI, sandbox, skill, messaggi agente, eventi di sistema, reload moduli, percorso Plugin in bundle, terminale, chunking, token di autenticazione e casi tipizzati |
  | `plugin-sdk/test-node-mocks`              | Helper mock mirati per builtin Node da usare nelle factory Vitest `vi.mock("node:*")`                                                                                       |
  | `plugin-sdk/migration`                    | Helper per elementi provider di migrazione come `createMigrationItem`, costanti di motivazione, marker di stato degli elementi, helper di redazione e `summarizeMigrationItems` |
  | `plugin-sdk/migration-runtime`            | Helper runtime di migrazione come `copyMigrationFileItem`, `withCachedMigrationConfigRuntime` e `writeMigrationReport`                                                       |

  <AccordionGroup>
  <Accordion title="Sottopercorsi dei canali">
    | Sottopercorso | Esportazioni principali |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Esportazione dello schema Zod root `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, più `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Helper condivisi per setup wizard, prompt allowlist, builder dello stato di configurazione |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Helper multi-account per configurazione/action-gate, helper di fallback dell'account predefinito |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, helper di normalizzazione account-id |
    | `plugin-sdk/account-resolution` | Helper di ricerca account + fallback predefinito |
    | `plugin-sdk/account-helpers` | Helper ristretti per account-list/account-action |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | Primitivi condivisi dello schema di configurazione canale più builder Zod e JSON/TypeBox diretti |
    | `plugin-sdk/bundled-channel-config-schema` | Schemi di configurazione dei canali OpenClaw in bundle solo per Plugin in bundle mantenuti |
    | `plugin-sdk/channel-config-schema-legacy` | Alias di compatibilità deprecato per gli schemi di configurazione dei canali in bundle |
    | `plugin-sdk/telegram-command-config` | Helper di normalizzazione/validazione dei comandi personalizzati Telegram con fallback del contratto in bundle |
    | `plugin-sdk/command-gating` | Helper ristretti per gate di autorizzazione dei comandi |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`, `createChannelRunQueue`, helper per ciclo di vita/finalizzazione dello stream bozza |
    | `plugin-sdk/inbound-envelope` | Helper condivisi per route in ingresso + builder envelope |
    | `plugin-sdk/inbound-reply-dispatch` | Helper condivisi di record-and-dispatch in ingresso |
    | `plugin-sdk/messaging-targets` | Helper di parsing/matching dei target |
    | `plugin-sdk/outbound-media` | Helper condivisi per caricamento dei media in uscita |
    | `plugin-sdk/outbound-send-deps` | Lookup leggero delle dipendenze di invio in uscita per adapter di canale |
    | `plugin-sdk/outbound-runtime` | Helper per consegna in uscita, identità, delegato di invio, sessione, formattazione e pianificazione del payload |
    | `plugin-sdk/poll-runtime` | Helper ristretti di normalizzazione dei poll |
    | `plugin-sdk/thread-bindings-runtime` | Helper per ciclo di vita e adapter dei binding dei thread |
    | `plugin-sdk/agent-media-payload` | Builder legacy del payload media agente |
    | `plugin-sdk/conversation-runtime` | Helper per conversazione/binding dei thread, pairing e binding configurati |
    | `plugin-sdk/runtime-config-snapshot` | Helper per snapshot della configurazione runtime |
    | `plugin-sdk/runtime-group-policy` | Helper runtime di risoluzione della policy di gruppo |
    | `plugin-sdk/channel-status` | Helper condivisi per snapshot/riepilogo dello stato del canale |
    | `plugin-sdk/channel-config-primitives` | Primitivi ristretti dello schema di configurazione canale |
    | `plugin-sdk/channel-config-writes` | Helper di autorizzazione per scrittura della configurazione canale |
    | `plugin-sdk/channel-plugin-common` | Esportazioni prelude condivise per Plugin di canale |
    | `plugin-sdk/allowlist-config-edit` | Helper di modifica/lettura della configurazione allowlist |
    | `plugin-sdk/group-access` | Helper condivisi per decisioni di accesso ai gruppi |
    | `plugin-sdk/direct-dm` | Helper condivisi di autenticazione/guardia direct-DM |
    | `plugin-sdk/discord` | Facade di compatibilità Discord deprecata per `@openclaw/discord@2026.3.13` pubblicato e compatibilità owner tracciata; i nuovi Plugin devono usare sottopercorsi generici del channel SDK |
    | `plugin-sdk/telegram-account` | Facade di compatibilità deprecata per la risoluzione degli account Telegram per compatibilità owner tracciata; i nuovi Plugin devono usare helper runtime iniettati o sottopercorsi generici del channel SDK |
    | `plugin-sdk/zalouser` | Facade di compatibilità deprecata di Zalo Personal per pacchetti Lark/Zalo pubblicati che importano ancora l'autorizzazione dei comandi del mittente; i nuovi Plugin devono usare `plugin-sdk/command-auth` |
    | `plugin-sdk/interactive-runtime` | Helper per presentazione semantica dei messaggi, consegna e risposte interattive legacy. Consulta [Presentazione dei messaggi](/it/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Barrel di compatibilità per debounce in ingresso, matching delle menzioni, helper delle policy di menzione e helper degli envelope |
    | `plugin-sdk/channel-inbound-debounce` | Helper ristretti per debounce in ingresso |
    | `plugin-sdk/channel-mention-gating` | Helper ristretti per policy di menzione, marker di menzione e testo di menzione senza la superficie runtime in ingresso più ampia |
    | `plugin-sdk/channel-envelope` | Helper ristretti di formattazione envelope in ingresso |
    | `plugin-sdk/channel-location` | Helper per contesto e formattazione della posizione del canale |
    | `plugin-sdk/channel-logging` | Helper di logging canale per scarti in ingresso e fallimenti di digitazione/ack |
    | `plugin-sdk/channel-send-result` | Tipi dei risultati di risposta |
    | `plugin-sdk/channel-actions` | Helper per azioni sui messaggi del canale, più helper di schema nativi deprecati mantenuti per compatibilità dei Plugin |
    | `plugin-sdk/channel-route` | Helper condivisi per normalizzazione route, risoluzione target guidata da parser, stringificazione thread-id, dedupe/compattazione delle chiavi route, tipi di target parsati e confronto route/target |
    | `plugin-sdk/channel-targets` | Helper di parsing dei target; i chiamanti che confrontano route devono usare `plugin-sdk/channel-route` |
    | `plugin-sdk/channel-contract` | Tipi dei contratti dei canali |
    | `plugin-sdk/channel-feedback` | Cablaggio feedback/reazioni |
    | `plugin-sdk/channel-secret-runtime` | Helper ristretti del contratto dei segreti come `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment` e tipi di target dei segreti |
  </Accordion>

  <Accordion title="Provider subpaths">
    | Sottopercorso | Esportazioni principali |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | Facciata provider LM Studio supportata per configurazione, rilevamento del catalogo e preparazione dei modelli a runtime |
    | `plugin-sdk/lmstudio-runtime` | Facciata runtime LM Studio supportata per impostazioni predefinite del server locale, rilevamento dei modelli, intestazioni delle richieste e helper per modelli caricati |
    | `plugin-sdk/provider-setup` | Helper curati per la configurazione di provider locali/self-hosted |
    | `plugin-sdk/self-hosted-provider-setup` | Helper mirati per la configurazione di provider self-hosted compatibili con OpenAI |
    | `plugin-sdk/cli-backend` | Impostazioni predefinite del backend CLI + costanti watchdog |
    | `plugin-sdk/provider-auth-runtime` | Helper di runtime per la risoluzione delle chiavi API per Plugin provider |
    | `plugin-sdk/provider-auth-api-key` | Helper per onboarding/scrittura profilo di chiavi API come `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Builder standard per risultati di autenticazione OAuth |
    | `plugin-sdk/provider-auth-login` | Helper condivisi per accesso interattivo per Plugin provider |
    | `plugin-sdk/provider-env-vars` | Helper di ricerca delle variabili d'ambiente di autenticazione provider |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, builder condivisi per criteri di replay, helper per endpoint provider e helper di normalizzazione degli ID modello come `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-runtime` | Hook di runtime per l'arricchimento del catalogo provider e punti di integrazione del registro plugin-provider per test di contratto |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Helper generici per capacità HTTP/endpoint dei provider, errori HTTP dei provider e helper per moduli multipart di trascrizione audio |
    | `plugin-sdk/provider-web-fetch-contract` | Helper mirati per il contratto di configurazione/selezione web-fetch come `enablePluginInConfig` e `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Helper di registrazione/cache per provider web-fetch |
    | `plugin-sdk/provider-web-search-config-contract` | Helper mirati di configurazione/credenziali web-search per provider che non necessitano del collegamento di abilitazione Plugin |
    | `plugin-sdk/provider-web-search-contract` | Helper mirati per il contratto di configurazione/credenziali web-search come `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` e setter/getter di credenziali con ambito |
    | `plugin-sdk/provider-web-search` | Helper di registrazione/cache/runtime per provider web-search |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, pulizia schema Gemini + diagnostica e helper di compatibilità xAI come `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` e simili |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, tipi wrapper di stream e helper wrapper condivisi Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-transport-runtime` | Helper di trasporto provider nativi come fetch protetto, trasformazioni dei messaggi di trasporto e stream di eventi di trasporto scrivibili |
    | `plugin-sdk/provider-onboard` | Helper per patch della configurazione di onboarding |
    | `plugin-sdk/global-singleton` | Helper singleton/map/cache locali al processo |
    | `plugin-sdk/group-activation` | Helper mirati per modalità di attivazione gruppo e parsing dei comandi |
  </Accordion>

  <Accordion title="Auth and security subpaths">
    | Sottopercorso | Esportazioni principali |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, helper del registro comandi inclusa la formattazione del menu di argomenti dinamici, helper di autorizzazione del mittente |
    | `plugin-sdk/command-status` | Builder di messaggi comando/aiuto come `buildCommandsMessagePaginated` e `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Helper per risoluzione approvatore e autenticazione azioni nella stessa chat |
    | `plugin-sdk/approval-client-runtime` | Helper nativi per profili/filtri di approvazione exec |
    | `plugin-sdk/approval-delivery-runtime` | Adattatori nativi per capacità/consegna delle approvazioni |
    | `plugin-sdk/approval-gateway-runtime` | Helper condiviso per la risoluzione Gateway delle approvazioni |
    | `plugin-sdk/approval-handler-adapter-runtime` | Helper leggeri per il caricamento di adattatori nativi di approvazione per entrypoint di canale caldi |
    | `plugin-sdk/approval-handler-runtime` | Helper di runtime più ampi per gestori di approvazione; preferisci i punti di integrazione adattatore/Gateway più mirati quando sono sufficienti |
    | `plugin-sdk/approval-native-runtime` | Helper nativi per target di approvazione + associazione account |
    | `plugin-sdk/approval-reply-runtime` | Helper per payload di risposta approvazione exec/plugin |
    | `plugin-sdk/approval-runtime` | Helper per payload di approvazione exec/plugin, helper di routing/runtime per approvazione nativa e helper di visualizzazione strutturata dell'approvazione come `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | Helper mirati per reimpostare la deduplicazione delle risposte in ingresso |
    | `plugin-sdk/channel-contract-testing` | Helper mirati per test del contratto di canale senza il barrel di test ampio |
    | `plugin-sdk/command-auth-native` | Autenticazione nativa dei comandi, formattazione del menu di argomenti dinamici e helper nativi per target sessione |
    | `plugin-sdk/command-detection` | Helper condivisi per rilevamento comandi |
    | `plugin-sdk/command-primitives-runtime` | Predicati leggeri di testo comando per percorsi di canale caldi |
    | `plugin-sdk/command-surface` | Helper per normalizzazione del corpo comando e superficie di comando |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Helper mirati per raccolta del contratto dei segreti per superfici di segreti canale/plugin |
    | `plugin-sdk/secret-ref-runtime` | Helper mirati per `coerceSecretRef` e tipizzazione SecretRef per parsing contratto segreti/configurazione |
    | `plugin-sdk/security-runtime` | Helper condivisi per fiducia, gating DM, contenuto esterno, oscuramento di testo sensibile, confronto di segreti a tempo costante e raccolta dei segreti |
    | `plugin-sdk/ssrf-policy` | Helper per allowlist host e criteri SSRF di rete privata |
    | `plugin-sdk/ssrf-dispatcher` | Helper mirati per dispatcher fissato senza l'ampia superficie di runtime dell'infrastruttura |
    | `plugin-sdk/ssrf-runtime` | Dispatcher fissato, fetch protetto da SSRF, errore SSRF e helper per criteri SSRF |
    | `plugin-sdk/secret-input` | Helper per parsing dell'input di segreti |
    | `plugin-sdk/webhook-ingress` | Helper per richiesta/target Webhook e coercizione websocket/corpo grezzi |
    | `plugin-sdk/webhook-request-guards` | Helper per dimensione/timeout del corpo della richiesta |
  </Accordion>

  <Accordion title="Runtime and storage subpaths">
    | Sottopercorso | Esportazioni principali |
    | --- | --- |
    | `plugin-sdk/runtime` | Helper generali per runtime/logging/backup/installazione di Plugin |
    | `plugin-sdk/runtime-env` | Helper mirati per ambiente runtime, logger, timeout, retry e backoff |
    | `plugin-sdk/browser-config` | Facciata supportata per la configurazione del browser per profilo/predefiniti normalizzati, analisi degli URL CDP e helper di autenticazione per il controllo del browser |
    | `plugin-sdk/channel-runtime-context` | Helper generici per registrazione e ricerca del runtime-context del canale |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Helper condivisi per comandi/hook/http/interattività dei Plugin |
    | `plugin-sdk/hook-runtime` | Helper condivisi per pipeline Webhook/hook interni |
    | `plugin-sdk/lazy-runtime` | Helper per import/binding lazy del runtime come `createLazyRuntimeModule`, `createLazyRuntimeMethod` e `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Helper per esecuzione di processi |
    | `plugin-sdk/cli-runtime` | Helper CLI per formattazione, attesa, versione, invocazione con argomenti e gruppi di comandi lazy |
    | `plugin-sdk/gateway-runtime` | Client Gateway, helper di avvio del client pronto per il ciclo eventi, RPC CLI del Gateway, errori del protocollo Gateway e helper di patch per lo stato del canale |
    | `plugin-sdk/config-types` | Superficie di configurazione solo tipi per forme di configurazione dei Plugin come `OpenClawConfig` e tipi di configurazione canale/provider |
    | `plugin-sdk/plugin-config-runtime` | Helper runtime per ricerca della configurazione dei Plugin come `requireRuntimeConfig`, `resolvePluginConfigObject` e `resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | Helper transazionali per mutazione della configurazione come `mutateConfigFile`, `replaceConfigFile` e `logConfigUpdated` |
    | `plugin-sdk/runtime-config-snapshot` | Helper per snapshot della configurazione del processo corrente come `getRuntimeConfig`, `getRuntimeConfigSnapshot` e setter di snapshot per test |
    | `plugin-sdk/telegram-command-config` | Normalizzazione di nome/descrizione dei comandi Telegram e controlli di duplicati/conflitti, anche quando la superficie del contratto Telegram incluso non è disponibile |
    | `plugin-sdk/text-autolink-runtime` | Rilevamento autolink di riferimenti a file senza il barrel generale text-runtime |
    | `plugin-sdk/approval-runtime` | Helper di approvazione exec/Plugin, builder di capability di approvazione, helper auth/profilo, helper di routing/runtime nativi e formattazione strutturata del percorso di visualizzazione dell’approvazione |
    | `plugin-sdk/reply-runtime` | Helper runtime condivisi per inbound/risposte, suddivisione in blocchi, dispatch, Heartbeat, pianificatore di risposte |
    | `plugin-sdk/reply-dispatch-runtime` | Helper mirati per dispatch/finalizzazione delle risposte ed etichette di conversazione |
    | `plugin-sdk/reply-history` | Helper condivisi per cronologia risposte a finestra breve e marker come `buildHistoryContext`, `HISTORY_CONTEXT_MARKER`, `recordPendingHistoryEntry` e `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Helper mirati per suddivisione in blocchi di testo/markdown |
    | `plugin-sdk/session-store-runtime` | Helper per percorso dello store delle sessioni, chiave di sessione, aggiornato-il e mutazione dello store |
    | `plugin-sdk/cron-store-runtime` | Helper per percorso/caricamento/salvataggio dello store Cron |
    | `plugin-sdk/state-paths` | Helper per percorsi di directory State/OAuth |
    | `plugin-sdk/routing` | Helper per route/chiave di sessione/binding account come `resolveAgentRoute`, `buildAgentSessionKey` e `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Helper condivisi per riepilogo stato canale/account, predefiniti dello stato runtime e helper per metadati dei problemi |
    | `plugin-sdk/target-resolver-runtime` | Helper condivisi per risoluzione dei target |
    | `plugin-sdk/string-normalization-runtime` | Helper per normalizzazione di slug/stringhe |
    | `plugin-sdk/request-url` | Estrai URL stringa da input simili a fetch/request |
    | `plugin-sdk/run-command` | Runner di comandi con timeout e risultati stdout/stderr normalizzati |
    | `plugin-sdk/param-readers` | Lettori comuni di parametri tool/CLI |
    | `plugin-sdk/tool-payload` | Estrai payload normalizzati dagli oggetti risultato dei tool |
    | `plugin-sdk/tool-send` | Estrai i campi canonici del target di invio dagli argomenti dei tool |
    | `plugin-sdk/temp-path` | Helper condivisi per percorsi di download temporanei |
    | `plugin-sdk/logging-core` | Helper per logger di sottosistema e redazione |
    | `plugin-sdk/markdown-table-runtime` | Helper per modalità e conversione delle tabelle Markdown |
    | `plugin-sdk/model-session-runtime` | Helper di override modello/sessione come `applyModelOverrideToSessionEntry` e `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | Helper di risoluzione configurazione provider Talk |
    | `plugin-sdk/json-store` | Piccoli helper di lettura/scrittura dello stato JSON |
    | `plugin-sdk/file-lock` | Helper per file-lock rientranti |
    | `plugin-sdk/persistent-dedupe` | Helper per cache di deduplica con backing su disco |
    | `plugin-sdk/acp-runtime` | Helper ACP per runtime/sessione e dispatch delle risposte |
    | `plugin-sdk/acp-runtime-backend` | Helper leggeri per registrazione backend ACP e dispatch delle risposte per Plugin caricati all’avvio |
    | `plugin-sdk/acp-binding-resolve-runtime` | Risoluzione read-only del binding ACP senza import di avvio del ciclo di vita |
    | `plugin-sdk/agent-config-primitives` | Primitive mirate per schema di configurazione runtime dell’agente |
    | `plugin-sdk/boolean-param` | Lettore permissivo di parametri booleani |
    | `plugin-sdk/dangerous-name-runtime` | Helper di risoluzione per corrispondenza di nomi pericolosi |
    | `plugin-sdk/device-bootstrap` | Helper per bootstrap del dispositivo e token di associazione |
    | `plugin-sdk/extension-shared` | Primitive condivise per canali passivi, stato e helper proxy ambient |
    | `plugin-sdk/models-provider-runtime` | Helper per risposte del comando/provider `/models` |
    | `plugin-sdk/skill-commands-runtime` | Helper per elenco dei comandi Skill |
    | `plugin-sdk/native-command-registry` | Helper per registro/build/serializzazione dei comandi nativi |
    | `plugin-sdk/agent-harness` | Superficie sperimentale per Plugin attendibili per harness agente di basso livello: tipi harness, helper per steer/abort delle esecuzioni attive, helper bridge per tool OpenClaw, helper per policy dei tool del piano runtime, classificazione degli esiti del terminale, helper di formattazione/dettaglio del progresso dei tool e utilità per risultati dei tentativi |
    | `plugin-sdk/provider-zai-endpoint` | Helper di rilevamento endpoint Z.AI |
    | `plugin-sdk/async-lock-runtime` | Helper di lock async locale al processo per piccoli file di stato runtime |
    | `plugin-sdk/channel-activity-runtime` | Helper di telemetria dell’attività del canale |
    | `plugin-sdk/concurrency-runtime` | Helper per concorrenza limitata di attività async |
    | `plugin-sdk/dedupe-runtime` | Helper per cache di deduplica in memoria |
    | `plugin-sdk/delivery-queue-runtime` | Helper di svuotamento delle consegne in sospeso in uscita |
    | `plugin-sdk/file-access-runtime` | Helper per percorsi sicuri di file locali e sorgenti media |
    | `plugin-sdk/heartbeat-runtime` | Helper per eventi Heartbeat e visibilità |
    | `plugin-sdk/number-runtime` | Helper di coercizione numerica |
    | `plugin-sdk/secure-random-runtime` | Helper per token/UUID sicuri |
    | `plugin-sdk/system-event-runtime` | Helper per coda degli eventi di sistema |
    | `plugin-sdk/transport-ready-runtime` | Helper di attesa della prontezza del trasporto |
    | `plugin-sdk/infra-runtime` | Shim di compatibilità deprecato; usa i sottopercorsi runtime mirati sopra |
    | `plugin-sdk/collection-runtime` | Piccoli helper per cache limitate |
    | `plugin-sdk/diagnostic-runtime` | Helper per flag diagnostici, eventi e trace-context |
    | `plugin-sdk/error-runtime` | Helper condivisi per grafo errori, formattazione e classificazione degli errori, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Helper per fetch wrappato, proxy, opzione EnvHttpProxyAgent e lookup fissato |
    | `plugin-sdk/runtime-fetch` | Fetch runtime consapevole del dispatcher senza import di proxy/guarded-fetch |
    | `plugin-sdk/response-limit-runtime` | Lettore limitato del corpo della risposta senza la superficie generale del runtime media |
    | `plugin-sdk/session-binding-runtime` | Stato del binding della conversazione corrente senza routing del binding configurato o store di associazione |
    | `plugin-sdk/session-store-runtime` | Helper dello store delle sessioni senza import generali di scrittura/manutenzione della configurazione |
    | `plugin-sdk/context-visibility-runtime` | Risoluzione della visibilità del contesto e filtro del contesto supplementare senza import generali di configurazione/sicurezza |
    | `plugin-sdk/string-coerce-runtime` | Helper mirati per coercizione e normalizzazione di record primitivi/stringhe senza import markdown/logging |
    | `plugin-sdk/host-runtime` | Helper per normalizzazione di hostname e host SCP |
    | `plugin-sdk/retry-runtime` | Helper per configurazione retry e runner di retry |
    | `plugin-sdk/agent-runtime` | Helper per directory/identità/workspace dell’agente |
    | `plugin-sdk/directory-runtime` | Query/dedup di directory basata sulla configurazione |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Sottopercorsi di funzionalità e test">
    | Sottopercorso | Esportazioni principali |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Helper condivisi per recupero/trasformazione/archiviazione dei media, rilevamento delle dimensioni video basato su ffprobe e builder di payload multimediali |
    | `plugin-sdk/media-store` | Helper mirati per l'archivio dei media, come `saveMediaBuffer` |
    | `plugin-sdk/media-generation-runtime` | Helper condivisi per failover della generazione di media, selezione dei candidati e messaggi per modelli mancanti |
    | `plugin-sdk/media-understanding` | Tipi di provider per la comprensione dei media più esportazioni di helper per immagini/audio rivolte ai provider |
    | `plugin-sdk/text-runtime` | Helper condivisi per testo/markdown/logging, come rimozione del testo visibile all'assistente, helper per rendering/chunking/tabelle Markdown, helper di redazione, helper per tag direttiva e utilità per testo sicuro |
    | `plugin-sdk/text-chunking` | Helper per il chunking del testo in uscita |
    | `plugin-sdk/speech` | Tipi di provider vocali più esportazioni rivolte ai provider per direttive, registro, validazione, builder TTS compatibile con OpenAI e helper vocali |
    | `plugin-sdk/speech-core` | Tipi di provider vocali condivisi, registro, direttiva, normalizzazione ed esportazioni di helper vocali |
    | `plugin-sdk/realtime-transcription` | Tipi di provider per trascrizione in tempo reale, helper del registro e helper condiviso per sessioni WebSocket |
    | `plugin-sdk/realtime-voice` | Tipi di provider vocali in tempo reale e helper del registro |
    | `plugin-sdk/image-generation` | Tipi di provider per generazione di immagini più helper per asset immagine/data URL e builder di provider immagine compatibile con OpenAI |
    | `plugin-sdk/image-generation-core` | Tipi condivisi per generazione di immagini, failover, autenticazione e helper del registro |
    | `plugin-sdk/music-generation` | Tipi di provider/richiesta/risultato per generazione musicale |
    | `plugin-sdk/music-generation-core` | Tipi condivisi per generazione musicale, helper di failover, ricerca provider e parsing di model-ref |
    | `plugin-sdk/video-generation` | Tipi di provider/richiesta/risultato per generazione video |
    | `plugin-sdk/video-generation-core` | Tipi condivisi per generazione video, helper di failover, ricerca provider e parsing di model-ref |
    | `plugin-sdk/webhook-targets` | Registro delle destinazioni Webhook e helper per installazione delle route |
    | `plugin-sdk/webhook-path` | Helper per normalizzazione dei percorsi Webhook |
    | `plugin-sdk/web-media` | Helper condivisi per caricamento di media remoti/locali |
    | `plugin-sdk/zod` | `zod` riesportato per i consumatori dell'SDK dei Plugin |
    | `plugin-sdk/testing` | Barrel di compatibilità ampio per i test legacy dei Plugin. I nuovi test delle estensioni dovrebbero invece importare sottopercorsi SDK mirati, come `plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/test-env` o `plugin-sdk/test-fixtures` |
    | `plugin-sdk/plugin-test-api` | Helper minimo `createTestPluginApi` per test unitari di registrazione diretta dei Plugin senza importare bridge helper di test del repository |
    | `plugin-sdk/agent-runtime-test-contracts` | Fixture native per contratti dell'adapter agent-runtime per test di autenticazione, recapito, fallback, tool-hook, prompt-overlay, schema e proiezione della trascrizione |
    | `plugin-sdk/channel-test-helpers` | Helper di test orientati ai canali per contratti generici di azioni/setup/stato, asserzioni sulle directory, ciclo di vita di avvio degli account, threading di send-config, mock runtime, problemi di stato, recapito in uscita e registrazione degli hook |
    | `plugin-sdk/channel-target-testing` | Suite condivisa di casi di errore per la risoluzione dei target nei test dei canali |
    | `plugin-sdk/plugin-test-contracts` | Helper per contratti di pacchetto Plugin, registrazione, artefatto pubblico, importazione diretta, API runtime ed effetti collaterali di importazione |
    | `plugin-sdk/provider-test-contracts` | Helper per contratti di runtime provider, autenticazione, discovery, onboarding, catalogo, procedura guidata, funzionalità media, policy di replay, audio live STT in tempo reale, ricerca/recupero web e stream |
    | `plugin-sdk/provider-http-test-mocks` | Mock HTTP/autenticazione Vitest opt-in per test dei provider che esercitano `plugin-sdk/provider-http` |
    | `plugin-sdk/test-fixtures` | Fixture generiche per acquisizione runtime CLI, contesto sandbox, writer di skill, messaggio agente, evento di sistema, ricaricamento modulo, percorso Plugin incluso, testo terminale, chunking, token di autenticazione e casi tipizzati |
    | `plugin-sdk/test-node-mocks` | Helper mock mirati per builtin Node da usare dentro factory Vitest `vi.mock("node:*")` |
  </Accordion>

  <Accordion title="Sottopercorsi della memoria">
    | Sottopercorso | Esportazioni principali |
    | --- | --- |
    | `plugin-sdk/memory-core` | Superficie helper memory-core inclusa per helper manager/config/file/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | Facciata runtime per indice/ricerca della memoria |
    | `plugin-sdk/memory-core-host-engine-foundation` | Esportazioni del motore di fondazione host della memoria |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Contratti di embedding host della memoria, accesso al registro, provider locale e helper generici batch/remoti |
    | `plugin-sdk/memory-core-host-engine-qmd` | Esportazioni del motore QMD host della memoria |
    | `plugin-sdk/memory-core-host-engine-storage` | Esportazioni del motore di storage host della memoria |
    | `plugin-sdk/memory-core-host-multimodal` | Helper multimodali host della memoria |
    | `plugin-sdk/memory-core-host-query` | Helper di query host della memoria |
    | `plugin-sdk/memory-core-host-secret` | Helper per secret host della memoria |
    | `plugin-sdk/memory-core-host-events` | Helper per journal eventi host della memoria |
    | `plugin-sdk/memory-core-host-status` | Helper di stato host della memoria |
    | `plugin-sdk/memory-core-host-runtime-cli` | Helper runtime CLI host della memoria |
    | `plugin-sdk/memory-core-host-runtime-core` | Helper runtime core host della memoria |
    | `plugin-sdk/memory-core-host-runtime-files` | Helper file/runtime host della memoria |
    | `plugin-sdk/memory-host-core` | Alias indipendente dal vendor per helper runtime core host della memoria |
    | `plugin-sdk/memory-host-events` | Alias indipendente dal vendor per helper del journal eventi host della memoria |
    | `plugin-sdk/memory-host-files` | Alias indipendente dal vendor per helper file/runtime host della memoria |
    | `plugin-sdk/memory-host-markdown` | Helper managed-markdown condivisi per Plugin adiacenti alla memoria |
    | `plugin-sdk/memory-host-search` | Facciata runtime di Active Memory per accesso al gestore di ricerca |
    | `plugin-sdk/memory-host-status` | Alias indipendente dal vendor per helper di stato host della memoria |
  </Accordion>

  <Accordion title="Sottopercorsi riservati degli helper inclusi">
    Al momento non esistono sottopercorsi SDK riservati per helper inclusi. Gli helper specifici del proprietario vivono dentro il pacchetto Plugin proprietario, mentre i contratti host riutilizzabili usano sottopercorsi SDK generici come `plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime` e `plugin-sdk/plugin-config-runtime`.
  </Accordion>
</AccordionGroup>

## Correlati

- [Panoramica dell'SDK dei Plugin](/it/plugins/sdk-overview)
- [Configurazione dell'SDK dei Plugin](/it/plugins/sdk-setup)
- [Creazione di Plugin](/it/plugins/building-plugins)
