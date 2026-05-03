---
read_when:
    - Scegliere il sottopercorso plugin-sdk corretto per un'importazione di Plugin
    - Audit dei sottopercorsi dei Plugin in bundle e delle superfici di supporto
summary: 'Catalogo dei sottopercorsi dell''SDK Plugin: dove si trovano gli import, raggruppati per area'
title: Sottopercorsi del Plugin SDK
x-i18n:
    generated_at: "2026-05-03T21:43:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: b3c6d139523f060795a60bce79d124def6461c0bf6a03a7a06244604101f7eff
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

  L'SDK dei Plugin è esposto come un insieme di sottopercorsi mirati sotto `openclaw/plugin-sdk/`.
  Questa pagina cataloga i sottopercorsi usati comunemente, raggruppati per scopo. L'elenco
  completo generato di oltre 200 sottopercorsi si trova in `scripts/lib/plugin-sdk-entrypoints.json`;
  i sottopercorsi riservati degli helper dei Plugin in bundle compaiono lì, ma sono dettagli di implementazione
  a meno che una pagina di documentazione non li promuova esplicitamente. I maintainer possono verificare i sottopercorsi helper riservati
  attivi con `pnpm plugins:boundary-report:summary`; gli export helper riservati inutilizzati fanno fallire
  il report CI invece di restare nell'SDK pubblico come debito di compatibilità dormiente.

  Per la guida alla creazione dei Plugin, vedi [Panoramica dell'SDK dei Plugin](/it/plugins/sdk-overview).

  ## Punto di ingresso del Plugin

  | Sottopercorso                            | Export principali                                                                                                                                                            |
  | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `plugin-sdk/plugin-entry`                 | `definePluginEntry`                                                                                                                                                          |
  | `plugin-sdk/core`                         | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema`       |
  | `plugin-sdk/config-schema`                | `OpenClawSchema`                                                                                                                                                             |
  | `plugin-sdk/provider-entry`               | `defineSingleProviderPluginEntry`                                                                                                                                            |
  | `plugin-sdk/testing`                      | Barrel di ampia compatibilità per i test dei Plugin legacy; preferisci sottopercorsi di test mirati per i nuovi test delle estensioni                                       |
  | `plugin-sdk/plugin-test-api`              | Builder mock minimale di `OpenClawPluginApi` per test unitari diretti di registrazione dei Plugin                                                                            |
  | `plugin-sdk/agent-runtime-test-contracts` | Fixture native dei contratti degli adapter agent-runtime per profili di autenticazione, soppressione della consegna, classificazione dei fallback, hook degli strumenti, overlay dei prompt, schemi e riparazione delle trascrizioni |
  | `plugin-sdk/channel-test-helpers`         | Helper per test del ciclo di vita degli account dei canali, directory, configurazione di invio, mock runtime, hook, punto di ingresso dei canali in bundle, timestamp envelope, risposta di abbinamento e contratto generico dei canali |
  | `plugin-sdk/channel-target-testing`       | Suite di test condivisa per casi di errore nella risoluzione dei target dei canali                                                                                           |
  | `plugin-sdk/plugin-test-contracts`        | Helper per contratti di registrazione Plugin, manifest package, artefatto pubblico, API runtime, side effect di import e import diretto                                      |
  | `plugin-sdk/plugin-test-runtime`          | Fixture per test di runtime Plugin, registry, registrazione provider, configurazione guidata e flusso di attività runtime                                                    |
  | `plugin-sdk/provider-test-contracts`      | Helper per contratti di runtime provider, autenticazione, discovery, onboarding, catalogo, capacità media, policy di replay, audio live STT realtime, web-search/fetch e procedura guidata |
  | `plugin-sdk/provider-http-test-mocks`     | Mock HTTP/autenticazione Vitest opzionali per test provider che esercitano `plugin-sdk/provider-http`                                                                         |
  | `plugin-sdk/test-env`                     | Fixture per ambiente di test, fetch/rete, server HTTP disposable, richiesta in ingresso, live-test, filesystem temporaneo e controllo del tempo                              |
  | `plugin-sdk/test-fixtures`                | Fixture di test generiche per CLI, sandbox, skill, messaggi agent, eventi di sistema, ricaricamento moduli, percorso Plugin in bundle, terminale, chunking, token di autenticazione e casi tipizzati |
  | `plugin-sdk/test-node-mocks`              | Helper mock mirati per builtin Node da usare dentro factory Vitest `vi.mock("node:*")`                                                                                       |
  | `plugin-sdk/migration`                    | Helper per elementi provider di migrazione come `createMigrationItem`, costanti di motivo, marker di stato degli elementi, helper di redazione e `summarizeMigrationItems`   |
  | `plugin-sdk/migration-runtime`            | Helper di migrazione runtime come `copyMigrationFileItem`, `withCachedMigrationConfigRuntime` e `writeMigrationReport`                                                       |

  <AccordionGroup>
  <Accordion title="Sottopercorsi dei canali">
    | Sottopercorso | Export principali |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Export dello schema Zod radice `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, più `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Helper condivisi per procedura guidata di configurazione, prompt allowlist, builder dello stato di configurazione |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Helper multi-account per configurazione/action-gate, helper di fallback dell'account predefinito |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, helper di normalizzazione account-id |
    | `plugin-sdk/account-resolution` | Helper per lookup account + fallback predefinito |
    | `plugin-sdk/account-helpers` | Helper mirati per lista account/azione account |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | Primitive condivise dello schema di configurazione dei canali più builder Zod e JSON/TypeBox diretti |
    | `plugin-sdk/bundled-channel-config-schema` | Schemi di configurazione dei canali OpenClaw in bundle solo per Plugin in bundle mantenuti |
    | `plugin-sdk/channel-config-schema-legacy` | Alias di compatibilità deprecato per gli schemi di configurazione dei canali in bundle |
    | `plugin-sdk/telegram-command-config` | Helper di normalizzazione/validazione dei comandi personalizzati Telegram con fallback del contratto in bundle |
    | `plugin-sdk/command-gating` | Helper mirati per gate di autorizzazione dei comandi |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`, `createChannelRunQueue`, helper per ciclo di vita/finalizzazione degli stream bozza |
    | `plugin-sdk/inbound-envelope` | Helper condivisi per route in ingresso + builder envelope |
    | `plugin-sdk/inbound-reply-dispatch` | Helper condivisi per registrazione e dispatch in ingresso |
    | `plugin-sdk/messaging-targets` | Helper di parsing/corrispondenza dei target |
    | `plugin-sdk/outbound-media` | Helper condivisi per caricamento media in uscita |
    | `plugin-sdk/outbound-send-deps` | Lookup leggero delle dipendenze di invio in uscita per adapter di canale |
    | `plugin-sdk/outbound-runtime` | Helper per consegna in uscita, identità, delegato di invio, sessione, formattazione e pianificazione payload |
    | `plugin-sdk/poll-runtime` | Helper mirati di normalizzazione dei poll |
    | `plugin-sdk/thread-bindings-runtime` | Helper per ciclo di vita e adapter dei thread-binding |
    | `plugin-sdk/agent-media-payload` | Builder legacy per payload media agent |
    | `plugin-sdk/conversation-runtime` | Helper per binding conversazione/thread, pairing e binding configurati |
    | `plugin-sdk/runtime-config-snapshot` | Helper per snapshot della configurazione runtime |
    | `plugin-sdk/runtime-group-policy` | Helper di risoluzione della group-policy runtime |
    | `plugin-sdk/channel-status` | Helper condivisi per snapshot/riepilogo dello stato dei canali |
    | `plugin-sdk/channel-config-primitives` | Primitive mirate per schema di configurazione dei canali |
    | `plugin-sdk/channel-config-writes` | Helper di autorizzazione alla scrittura della configurazione dei canali |
    | `plugin-sdk/channel-plugin-common` | Export condivisi del preludio dei Plugin di canale |
    | `plugin-sdk/allowlist-config-edit` | Helper per modifica/lettura della configurazione allowlist |
    | `plugin-sdk/group-access` | Helper condivisi per decisioni di accesso ai gruppi |
    | `plugin-sdk/direct-dm` | Helper condivisi per autenticazione/guard direct-DM |
    | `plugin-sdk/discord` | Facciata di compatibilità Discord deprecata per `@openclaw/discord@2026.3.13` pubblicato e compatibilità dei proprietari tracciata; i nuovi Plugin dovrebbero usare sottopercorsi generici dell'SDK dei canali |
    | `plugin-sdk/telegram-account` | Facciata di compatibilità deprecata per la risoluzione degli account Telegram per compatibilità dei proprietari tracciata; i nuovi Plugin dovrebbero usare helper runtime iniettati o sottopercorsi generici dell'SDK dei canali |
    | `plugin-sdk/zalouser` | Facciata di compatibilità deprecata per Zalo Personal per pacchetti Lark/Zalo pubblicati che importano ancora l'autorizzazione dei comandi mittente; i nuovi Plugin dovrebbero usare `plugin-sdk/command-auth` |
    | `plugin-sdk/interactive-runtime` | Helper legacy per presentazione semantica dei messaggi, consegna e risposte interattive. Vedi [Presentazione dei messaggi](/it/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Barrel di compatibilità per debounce in ingresso, corrispondenza delle menzioni, helper mention-policy e helper envelope |
    | `plugin-sdk/channel-inbound-debounce` | Helper mirati per debounce in ingresso |
    | `plugin-sdk/channel-mention-gating` | Helper mirati per mention-policy, marker di menzione e testo di menzione senza la superficie runtime in ingresso più ampia |
    | `plugin-sdk/channel-envelope` | Helper mirati per formattazione degli envelope in ingresso |
    | `plugin-sdk/channel-location` | Helper per contesto e formattazione della posizione del canale |
    | `plugin-sdk/channel-logging` | Helper di logging dei canali per drop in ingresso ed errori typing/ack |
    | `plugin-sdk/channel-send-result` | Tipi di risultato delle risposte |
    | `plugin-sdk/channel-actions` | Helper per azioni sui messaggi di canale, più helper deprecati per schemi nativi mantenuti per compatibilità dei Plugin |
    | `plugin-sdk/channel-route` | Helper condivisi per normalizzazione route, risoluzione dei target guidata dal parser, stringificazione thread-id, chiavi route dedupe/compatte, tipi parsed-target e confronto route/target |
    | `plugin-sdk/channel-targets` | Helper di parsing dei target; i chiamanti che confrontano route dovrebbero usare `plugin-sdk/channel-route` |
    | `plugin-sdk/channel-contract` | Tipi di contratto dei canali |
    | `plugin-sdk/channel-feedback` | Cablaggio feedback/reaction |
    | `plugin-sdk/channel-secret-runtime` | Helper mirati per contratti segreti come `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment` e tipi di target segreti |
  </Accordion>

  <Accordion title="Sottopercorsi dei provider">
    | Sottopercorso | Esportazioni chiave |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | Facciata del provider LM Studio supportata per configurazione, rilevamento del catalogo e preparazione del modello a runtime |
    | `plugin-sdk/lmstudio-runtime` | Facciata runtime LM Studio supportata per impostazioni predefinite del server locale, rilevamento dei modelli, intestazioni delle richieste e helper per i modelli caricati |
    | `plugin-sdk/provider-setup` | Helper selezionati per la configurazione di provider locali/self-hosted |
    | `plugin-sdk/self-hosted-provider-setup` | Helper mirati per la configurazione di provider self-hosted compatibili con OpenAI |
    | `plugin-sdk/cli-backend` | Impostazioni predefinite del backend CLI + costanti del watchdog |
    | `plugin-sdk/provider-auth-runtime` | Helper runtime per la risoluzione delle chiavi API per i Plugin provider |
    | `plugin-sdk/provider-auth-api-key` | Helper per onboarding/scrittura del profilo con chiave API, come `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Builder standard del risultato di autenticazione OAuth |
    | `plugin-sdk/provider-auth-login` | Helper condivisi per l'accesso interattivo per i Plugin provider |
    | `plugin-sdk/provider-env-vars` | Helper di ricerca delle variabili d'ambiente per l'autenticazione del provider |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, builder condivisi per le policy di replay, helper per endpoint del provider e helper di normalizzazione degli ID modello, come `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-runtime` | Hook runtime per l'arricchimento del catalogo provider e punti di integrazione del registro Plugin-provider per i test di contratto |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Helper generici per capacità HTTP/endpoint del provider, errori HTTP del provider e helper per moduli multipart di trascrizione audio |
    | `plugin-sdk/provider-web-fetch-contract` | Helper di contratto mirati per configurazione/selezione web-fetch, come `enablePluginInConfig` e `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Helper di registrazione/cache del provider web-fetch |
    | `plugin-sdk/provider-web-search-config-contract` | Helper mirati per configurazione/credenziali web-search per provider che non richiedono il cablaggio di abilitazione del Plugin |
    | `plugin-sdk/provider-web-search-contract` | Helper mirati di contratto per configurazione/credenziali web-search, come `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` e setter/getter di credenziali con ambito |
    | `plugin-sdk/provider-web-search` | Helper di registrazione/cache/runtime del provider web-search |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, pulizia schemi Gemini + diagnostica e helper di compatibilità xAI come `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` e simili |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, tipi di wrapper di stream e helper condivisi per wrapper Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-transport-runtime` | Helper di trasporto nativi del provider, come fetch protetto, trasformazioni dei messaggi di trasporto e stream di eventi di trasporto scrivibili |
    | `plugin-sdk/provider-onboard` | Helper per patch della configurazione di onboarding |
    | `plugin-sdk/global-singleton` | Helper per singleton/mappe/cache locali al processo |
    | `plugin-sdk/group-activation` | Helper mirati per modalità di attivazione del gruppo e parsing dei comandi |
  </Accordion>

  <Accordion title="Sottopercorsi di autenticazione e sicurezza">
    | Sottopercorso | Esportazioni chiave |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, helper del registro comandi, inclusa la formattazione dinamica del menu degli argomenti, helper per l'autorizzazione del mittente |
    | `plugin-sdk/command-status` | Builder di messaggi comando/aiuto, come `buildCommandsMessagePaginated` e `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Risoluzione degli approvatori e helper per l'autenticazione delle azioni nella stessa chat |
    | `plugin-sdk/approval-client-runtime` | Helper nativi per profili/filtri di approvazione exec |
    | `plugin-sdk/approval-delivery-runtime` | Adattatori nativi per capacità/consegna delle approvazioni |
    | `plugin-sdk/approval-gateway-runtime` | Helper condiviso per la risoluzione del Gateway di approvazione |
    | `plugin-sdk/approval-handler-adapter-runtime` | Helper leggeri per il caricamento di adattatori nativi di approvazione per entrypoint di canale hot |
    | `plugin-sdk/approval-handler-runtime` | Helper runtime più ampi per gestori di approvazione; preferire i punti di integrazione adapter/gateway più mirati quando sono sufficienti |
    | `plugin-sdk/approval-native-runtime` | Helper nativi per target di approvazione + associazione account |
    | `plugin-sdk/approval-reply-runtime` | Helper per payload di risposta all'approvazione exec/Plugin |
    | `plugin-sdk/approval-runtime` | Helper per payload di approvazione exec/Plugin, helper di routing/runtime per approvazioni native e helper di visualizzazione strutturata delle approvazioni, come `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | Helper mirati per reimpostare la deduplicazione delle risposte in ingresso |
    | `plugin-sdk/channel-contract-testing` | Helper mirati per test di contratto dei canali senza il barrel di testing ampio |
    | `plugin-sdk/command-auth-native` | Autenticazione nativa dei comandi, formattazione dinamica del menu degli argomenti e helper nativi per target di sessione |
    | `plugin-sdk/command-detection` | Helper condivisi per il rilevamento dei comandi |
    | `plugin-sdk/command-primitives-runtime` | Predicati leggeri sul testo dei comandi per percorsi di canale hot |
    | `plugin-sdk/command-surface` | Normalizzazione del corpo dei comandi e helper per la superficie dei comandi |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Helper mirati per la raccolta di contratti dei segreti per superfici dei segreti di canali/Plugin |
    | `plugin-sdk/secret-ref-runtime` | Helper mirati per `coerceSecretRef` e tipizzazione SecretRef per il parsing di contratti/configurazioni dei segreti |
    | `plugin-sdk/security-runtime` | Helper condivisi per fiducia, gating DM, contenuto esterno, redazione di testo sensibile, confronto di segreti a tempo costante e raccolta di segreti |
    | `plugin-sdk/ssrf-policy` | Helper per allowlist degli host e policy SSRF per reti private |
    | `plugin-sdk/ssrf-dispatcher` | Helper mirati per dispatcher con pinning senza l'ampia superficie runtime dell'infrastruttura |
    | `plugin-sdk/ssrf-runtime` | Dispatcher con pinning, fetch protetto da SSRF, errore SSRF e helper per policy SSRF |
    | `plugin-sdk/secret-input` | Helper per il parsing dell'input dei segreti |
    | `plugin-sdk/webhook-ingress` | Helper per richieste/target Webhook e coercizione raw di websocket/body |
    | `plugin-sdk/webhook-request-guards` | Helper per dimensioni/timeout del corpo della richiesta |
  </Accordion>

  <Accordion title="Sottopercorsi di runtime e archiviazione">
    | Sottopercorso | Esportazioni principali |
    | --- | --- |
    | `plugin-sdk/runtime` | Helper ampi per runtime/logging/backup/installazione di Plugin |
    | `plugin-sdk/runtime-env` | Helper mirati per env di runtime, logger, timeout, retry e backoff |
    | `plugin-sdk/browser-config` | Facade di configurazione browser supportata per profilo/predefiniti normalizzati, parsing degli URL CDP e helper di autenticazione per il controllo del browser |
    | `plugin-sdk/channel-runtime-context` | Helper generici di registrazione e lookup del runtime-context del canale |
    | `plugin-sdk/matrix` | Facade di compatibilità Matrix deprecata per pacchetti canale di terze parti più vecchi; i nuovi plugin dovrebbero importare direttamente `plugin-sdk/run-command` |
    | `plugin-sdk/mattermost` | Facade di compatibilità Mattermost deprecata per pacchetti canale di terze parti più vecchi; i nuovi plugin dovrebbero importare direttamente i sottopercorsi SDK generici |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Helper condivisi per comandi/hook/http/interattività dei Plugin |
    | `plugin-sdk/hook-runtime` | Helper condivisi per pipeline di Webhook/hook interni |
    | `plugin-sdk/lazy-runtime` | Helper di import/binding lazy del runtime come `createLazyRuntimeModule`, `createLazyRuntimeMethod` e `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Helper per esecuzione di processi |
    | `plugin-sdk/cli-runtime` | Helper per formattazione CLI, attesa, versione, invocazione argomenti e gruppi di comandi lazy |
    | `plugin-sdk/gateway-runtime` | Client Gateway, helper di avvio client pronto per event loop, RPC CLI del Gateway, errori del protocollo Gateway e helper per patch dello stato canale |
    | `plugin-sdk/config-types` | Superficie di configurazione solo tipi per forme di configurazione dei Plugin come `OpenClawConfig` e tipi di configurazione canale/provider |
    | `plugin-sdk/plugin-config-runtime` | Helper di lookup runtime della configurazione Plugin come `requireRuntimeConfig`, `resolvePluginConfigObject` e `resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | Helper transazionali di mutazione della configurazione come `mutateConfigFile`, `replaceConfigFile` e `logConfigUpdated` |
    | `plugin-sdk/runtime-config-snapshot` | Helper di snapshot della configurazione del processo corrente come `getRuntimeConfig`, `getRuntimeConfigSnapshot` e setter di snapshot per test |
    | `plugin-sdk/telegram-command-config` | Normalizzazione nome/descrizione dei comandi Telegram e controlli di duplicati/conflitti, anche quando la superficie del contratto Telegram inclusa non è disponibile |
    | `plugin-sdk/text-autolink-runtime` | Rilevamento di autolink per riferimenti a file senza l’ampio barrel text-runtime |
    | `plugin-sdk/approval-runtime` | Helper per approvazioni exec/Plugin, builder di capability di approvazione, helper auth/profilo, helper di routing/runtime nativi e formattazione del percorso di visualizzazione strutturata delle approvazioni |
    | `plugin-sdk/reply-runtime` | Helper runtime condivisi per inbound/risposta, suddivisione in blocchi, dispatch, Heartbeat, planner delle risposte |
    | `plugin-sdk/reply-dispatch-runtime` | Helper mirati per dispatch/finalizzazione delle risposte ed etichette di conversazione |
    | `plugin-sdk/reply-history` | Helper condivisi per cronologia risposte a finestra breve e marker come `buildHistoryContext`, `HISTORY_CONTEXT_MARKER`, `recordPendingHistoryEntry` e `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Helper mirati per suddivisione di testo/Markdown |
    | `plugin-sdk/session-store-runtime` | Helper per percorso dello store sessione, chiave sessione, aggiornato-il e mutazione dello store |
    | `plugin-sdk/cron-store-runtime` | Helper per percorso/caricamento/salvataggio dello store Cron |
    | `plugin-sdk/state-paths` | Helper per percorsi dir State/OAuth |
    | `plugin-sdk/routing` | Helper per route/chiave sessione/binding account come `resolveAgentRoute`, `buildAgentSessionKey` e `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Helper condivisi per riepilogo stato canale/account, predefiniti runtime-state e helper per metadati issue |
    | `plugin-sdk/target-resolver-runtime` | Helper condivisi per target resolver |
    | `plugin-sdk/string-normalization-runtime` | Helper di normalizzazione slug/stringa |
    | `plugin-sdk/request-url` | Estrai URL stringa da input simili a fetch/request |
    | `plugin-sdk/run-command` | Runner di comandi temporizzato con risultati stdout/stderr normalizzati |
    | `plugin-sdk/param-readers` | Reader comuni di parametri tool/CLI |
    | `plugin-sdk/tool-payload` | Estrai payload normalizzati dagli oggetti risultato dei tool |
    | `plugin-sdk/tool-send` | Estrai campi canonici di destinazione invio dagli argomenti del tool |
    | `plugin-sdk/temp-path` | Helper condivisi per percorso di download temporaneo |
    | `plugin-sdk/logging-core` | Logger di sottosistema e helper di redazione |
    | `plugin-sdk/markdown-table-runtime` | Helper per modalità tabella Markdown e conversione |
    | `plugin-sdk/model-session-runtime` | Helper di override modello/sessione come `applyModelOverrideToSessionEntry` e `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | Helper di risoluzione configurazione provider Talk |
    | `plugin-sdk/json-store` | Piccoli helper per lettura/scrittura dello stato JSON |
    | `plugin-sdk/file-lock` | Helper di file-lock rientranti |
    | `plugin-sdk/persistent-dedupe` | Helper di cache dedupe supportata da disco |
    | `plugin-sdk/acp-runtime` | Helper ACP per runtime/sessione e dispatch risposte |
    | `plugin-sdk/acp-runtime-backend` | Helper leggeri ACP per registrazione backend e dispatch risposte per plugin caricati all’avvio |
    | `plugin-sdk/acp-binding-resolve-runtime` | Risoluzione read-only del binding ACP senza import di avvio del lifecycle |
    | `plugin-sdk/agent-config-primitives` | Primitive mirate di schema di configurazione runtime agent |
    | `plugin-sdk/boolean-param` | Reader permissivo di parametri booleani |
    | `plugin-sdk/dangerous-name-runtime` | Helper di risoluzione corrispondenza nomi pericolosi |
    | `plugin-sdk/device-bootstrap` | Helper per bootstrap dispositivo e token di pairing |
    | `plugin-sdk/extension-shared` | Primitive helper condivise per canale passivo, stato e proxy ambient |
    | `plugin-sdk/models-provider-runtime` | Helper per risposte comando/provider `/models` |
    | `plugin-sdk/skill-commands-runtime` | Helper per elencare comandi Skill |
    | `plugin-sdk/native-command-registry` | Helper per registro/build/serializzazione dei comandi nativi |
    | `plugin-sdk/agent-harness` | Superficie sperimentale per Plugin attendibili per harness agent di basso livello: tipi harness, helper steer/abort per run attiva, helper bridge tool OpenClaw, helper per policy tool del runtime-plan, classificazione esito terminale, helper di formattazione/dettaglio avanzamento tool e utilità per risultati dei tentativi |
    | `plugin-sdk/provider-zai-endpoint` | Helper di rilevamento endpoint Z.AI |
    | `plugin-sdk/async-lock-runtime` | Helper di lock async locale al processo per piccoli file di stato runtime |
    | `plugin-sdk/channel-activity-runtime` | Helper di telemetria attività canale |
    | `plugin-sdk/concurrency-runtime` | Helper di concorrenza per task async limitata |
    | `plugin-sdk/dedupe-runtime` | Helper di cache dedupe in memoria |
    | `plugin-sdk/delivery-queue-runtime` | Helper di svuotamento consegne in sospeso in uscita |
    | `plugin-sdk/file-access-runtime` | Helper sicuri per percorsi di file locali e sorgenti media |
    | `plugin-sdk/heartbeat-runtime` | Helper per eventi Heartbeat e visibilità |
    | `plugin-sdk/number-runtime` | Helper di coercizione numerica |
    | `plugin-sdk/secure-random-runtime` | Helper sicuri per token/UUID |
    | `plugin-sdk/system-event-runtime` | Helper per coda eventi di sistema |
    | `plugin-sdk/transport-ready-runtime` | Helper di attesa prontezza trasporto |
    | `plugin-sdk/infra-runtime` | Shim di compatibilità deprecato; usa i sottopercorsi runtime mirati sopra |
    | `plugin-sdk/collection-runtime` | Piccoli helper di cache limitata |
    | `plugin-sdk/diagnostic-runtime` | Helper per flag diagnostici, eventi e trace-context |
    | `plugin-sdk/error-runtime` | Helper per grafo errori, formattazione, classificazione errori condivisa, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Fetch wrappato, proxy, opzione EnvHttpProxyAgent e helper di lookup con pinning |
    | `plugin-sdk/runtime-fetch` | Fetch runtime consapevole del dispatcher senza import proxy/guarded-fetch |
    | `plugin-sdk/response-limit-runtime` | Reader limitato del corpo risposta senza l’ampia superficie media runtime |
    | `plugin-sdk/session-binding-runtime` | Stato di binding della conversazione corrente senza routing binding configurato o store di pairing |
    | `plugin-sdk/session-store-runtime` | Helper di session-store senza import ampi di scrittura/manutenzione della configurazione |
    | `plugin-sdk/context-visibility-runtime` | Risoluzione della visibilità del contesto e filtro del contesto supplementare senza import ampi di configurazione/sicurezza |
    | `plugin-sdk/string-coerce-runtime` | Helper mirati di coercizione e normalizzazione di record/stringhe primitive senza import markdown/logging |
    | `plugin-sdk/host-runtime` | Helper di normalizzazione hostname e host SCP |
    | `plugin-sdk/retry-runtime` | Helper per configurazione retry e runner retry |
    | `plugin-sdk/agent-runtime` | Helper per dir/identità/workspace agent |
    | `plugin-sdk/directory-runtime` | Query/dedup directory basate su configurazione |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Sottopercorsi per funzionalità e test">
    | Sottopercorso | Esportazioni principali |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Helper condivisi per recupero/trasformazione/archiviazione dei contenuti multimediali, rilevamento delle dimensioni video basato su ffprobe e builder di payload multimediali |
    | `plugin-sdk/media-store` | Helper mirati per l'archivio multimediale, come `saveMediaBuffer` |
    | `plugin-sdk/media-generation-runtime` | Helper condivisi di failover per la generazione multimediale, selezione dei candidati e messaggi per modelli mancanti |
    | `plugin-sdk/media-understanding` | Tipi di provider per la comprensione multimediale più esportazioni di helper per immagini/audio rivolte ai provider |
    | `plugin-sdk/text-runtime` | Helper condivisi per testo/markdown/logging, come rimozione del testo visibile all'assistente, helper per rendering/suddivisione/tabelle markdown, helper di redazione, helper per tag direttiva e utility per testo sicuro |
    | `plugin-sdk/text-chunking` | Helper per la suddivisione del testo in uscita |
    | `plugin-sdk/speech` | Tipi di provider vocali più esportazioni rivolte ai provider per direttive, registro, validazione, builder TTS compatibile con OpenAI e helper vocali |
    | `plugin-sdk/speech-core` | Tipi condivisi di provider vocali, registro, direttive, normalizzazione ed esportazioni di helper vocali |
    | `plugin-sdk/realtime-transcription` | Tipi di provider per trascrizione in tempo reale, helper di registro e helper condiviso per sessioni WebSocket |
    | `plugin-sdk/realtime-voice` | Tipi di provider per voce in tempo reale e helper di registro |
    | `plugin-sdk/image-generation` | Tipi di provider per generazione di immagini più helper per asset immagine/URL dati e builder di provider immagini compatibile con OpenAI |
    | `plugin-sdk/image-generation-core` | Tipi condivisi per generazione di immagini, failover, autenticazione e helper di registro |
    | `plugin-sdk/music-generation` | Tipi di provider/richiesta/risultato per generazione musicale |
    | `plugin-sdk/music-generation-core` | Tipi condivisi per generazione musicale, helper di failover, lookup dei provider e parsing dei riferimenti ai modelli |
    | `plugin-sdk/video-generation` | Tipi di provider/richiesta/risultato per generazione video |
    | `plugin-sdk/video-generation-core` | Tipi condivisi per generazione video, helper di failover, lookup dei provider e parsing dei riferimenti ai modelli |
    | `plugin-sdk/webhook-targets` | Registro delle destinazioni Webhook e helper per installazione delle route |
    | `plugin-sdk/webhook-path` | Helper di normalizzazione dei percorsi Webhook |
    | `plugin-sdk/web-media` | Helper condivisi per caricamento di contenuti multimediali remoti/locali |
    | `plugin-sdk/zod` | Riesportazione di `zod` per i consumer dell'SDK dei plugin |
    | `plugin-sdk/testing` | Barrel di compatibilità ampio per test legacy dei plugin. I nuovi test delle estensioni dovrebbero invece importare sottopercorsi SDK mirati come `plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/test-env` o `plugin-sdk/test-fixtures` |
    | `plugin-sdk/plugin-test-api` | Helper minimo `createTestPluginApi` per test unitari di registrazione diretta dei plugin senza importare bridge degli helper di test del repository |
    | `plugin-sdk/agent-runtime-test-contracts` | Fixture native per contratti degli adattatori agent-runtime per test di autenticazione, recapito, fallback, hook degli strumenti, overlay dei prompt, schema e proiezione delle trascrizioni |
    | `plugin-sdk/channel-test-helpers` | Helper di test orientati ai canali per contratti generici di azioni/configurazione/stato, asserzioni sulle directory, ciclo di vita di avvio account, threading send-config, mock runtime, problemi di stato, recapito in uscita e registrazione degli hook |
    | `plugin-sdk/channel-target-testing` | Suite condivisa di casi di errore per la risoluzione dei target nei test dei canali |
    | `plugin-sdk/plugin-test-contracts` | Helper per contratti di pacchetto Plugin, registrazione, artefatto pubblico, importazione diretta, API runtime ed effetti collaterali delle importazioni |
    | `plugin-sdk/provider-test-contracts` | Helper per contratti di runtime provider, autenticazione, discovery, onboarding, catalogo, wizard, funzionalità multimediali, policy di replay, audio live STT in tempo reale, ricerca/fetch web e streaming |
    | `plugin-sdk/provider-http-test-mocks` | Mock HTTP/autenticazione Vitest opzionali per test dei provider che esercitano `plugin-sdk/provider-http` |
    | `plugin-sdk/test-fixtures` | Fixture generiche per cattura runtime CLI, contesto sandbox, writer di skill, agent-message, system-event, ricaricamento modulo, percorso dei plugin in bundle, terminal-text, suddivisione in chunk, auth-token e casi tipizzati |
    | `plugin-sdk/test-node-mocks` | Helper di mock mirati per builtin Node da usare dentro factory Vitest `vi.mock("node:*")` |
  </Accordion>

  <Accordion title="Sottopercorsi della memoria">
    | Sottopercorso | Esportazioni principali |
    | --- | --- |
    | `plugin-sdk/memory-core` | Superficie helper memory-core in bundle per helper di manager/configurazione/file/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | Facciata runtime per indicizzazione/ricerca della memoria |
    | `plugin-sdk/memory-core-host-engine-foundation` | Esportazioni del motore foundation host della memoria |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Contratti di embedding host della memoria, accesso al registro, provider locale e helper generici batch/remoti |
    | `plugin-sdk/memory-core-host-engine-qmd` | Esportazioni del motore QMD host della memoria |
    | `plugin-sdk/memory-core-host-engine-storage` | Esportazioni del motore di archiviazione host della memoria |
    | `plugin-sdk/memory-core-host-multimodal` | Helper multimodali host della memoria |
    | `plugin-sdk/memory-core-host-query` | Helper di query host della memoria |
    | `plugin-sdk/memory-core-host-secret` | Helper per segreti host della memoria |
    | `plugin-sdk/memory-core-host-events` | Helper per journal degli eventi host della memoria |
    | `plugin-sdk/memory-core-host-status` | Helper di stato host della memoria |
    | `plugin-sdk/memory-core-host-runtime-cli` | Helper runtime CLI host della memoria |
    | `plugin-sdk/memory-core-host-runtime-core` | Helper runtime core host della memoria |
    | `plugin-sdk/memory-core-host-runtime-files` | Helper file/runtime host della memoria |
    | `plugin-sdk/memory-host-core` | Alias neutrale rispetto al vendor per gli helper runtime core host della memoria |
    | `plugin-sdk/memory-host-events` | Alias neutrale rispetto al vendor per gli helper del journal degli eventi host della memoria |
    | `plugin-sdk/memory-host-files` | Alias neutrale rispetto al vendor per gli helper file/runtime host della memoria |
    | `plugin-sdk/memory-host-markdown` | Helper shared managed-markdown per plugin adiacenti alla memoria |
    | `plugin-sdk/memory-host-search` | Facciata runtime Active Memory per accesso al search-manager |
    | `plugin-sdk/memory-host-status` | Alias neutrale rispetto al vendor per gli helper di stato host della memoria |
  </Accordion>

  <Accordion title="Sottopercorsi riservati per helper in bundle">
    Al momento non ci sono sottopercorsi SDK riservati per helper in bundle. Gli helper specifici del proprietario
    vivono dentro il pacchetto Plugin proprietario, mentre i contratti host riutilizzabili
    usano sottopercorsi SDK generici come `plugin-sdk/gateway-runtime`,
    `plugin-sdk/security-runtime` e `plugin-sdk/plugin-config-runtime`.
  </Accordion>
</AccordionGroup>

## Correlati

- [Panoramica dell'SDK dei Plugin](/it/plugins/sdk-overview)
- [Configurazione dell'SDK dei Plugin](/it/plugins/sdk-setup)
- [Creare Plugin](/it/plugins/building-plugins)
