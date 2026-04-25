---
read_when:
    - Scegliere il sottopercorso corretto di plugin-sdk per un import del Plugin
    - Verifica dei sottopercorsi dei Plugin bundled e delle superfici helper
summary: 'Catalogo dei sottopercorsi del Plugin SDK: quali import si trovano dove, raggruppati per area'
title: Sottopercorsi del Plugin SDK
x-i18n:
    generated_at: "2026-04-25T18:21:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: b143fcc177c4d0d03fbcb4058291c99a7bb9f1f7fd04cca3916a7dbb4c22fd14
    source_path: plugins/sdk-subpaths.md
    workflow: 15
---

  Il Plugin SDK è esposto come un insieme di sottopercorsi stretti sotto `openclaw/plugin-sdk/`.
  Questa pagina cataloga i sottopercorsi più usati raggruppati per scopo. L'elenco
  completo generato di oltre 200 sottopercorsi si trova in `scripts/lib/plugin-sdk-entrypoints.json`;
  i sottopercorsi helper riservati dei Plugin bundled compaiono lì ma sono un
  dettaglio di implementazione a meno che una pagina della documentazione non li promuova esplicitamente.

  Per la guida alla creazione dei Plugin, vedi [Panoramica del Plugin SDK](/it/plugins/sdk-overview).

  ## Entrata del Plugin

  | Sottopercorso              | Esportazioni principali                                                                                                               |
  | -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
  | `plugin-sdk/plugin-entry`   | `definePluginEntry`                                                                                                                    |
  | `plugin-sdk/core`           | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema` |
  | `plugin-sdk/config-schema`  | `OpenClawSchema`                                                                                                                       |
  | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry`                                                                                                      |

  <AccordionGroup>
  <Accordion title="Sottopercorsi del canale">
    | Sottopercorso | Esportazioni principali |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Esportazione dello schema Zod root di `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, più `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Helper condivisi per il wizard di configurazione, prompt allowlist, builder dello stato di configurazione |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Helper multi-account per configurazione/action-gate, helper di fallback per l'account predefinito |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, helper di normalizzazione dell'id account |
    | `plugin-sdk/account-resolution` | Helper per ricerca dell'account + fallback predefinito |
    | `plugin-sdk/account-helpers` | Helper stretti per elenco account/azioni account |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter` |
    | `plugin-sdk/channel-config-schema` | Tipi di schema di configurazione del canale |
    | `plugin-sdk/telegram-command-config` | Helper di normalizzazione/validazione per comandi personalizzati Telegram con fallback del contratto bundled |
    | `plugin-sdk/command-gating` | Helper stretti per i gate di autorizzazione dei comandi |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`, helper per ciclo di vita/finalizzazione dello stream draft |
    | `plugin-sdk/inbound-envelope` | Helper condivisi per instradamento inbound + builder dell'envelope |
    | `plugin-sdk/inbound-reply-dispatch` | Helper condivisi per registrazione e dispatch inbound |
    | `plugin-sdk/messaging-targets` | Helper di parsing/corrispondenza dei target |
    | `plugin-sdk/outbound-media` | Helper condivisi per il caricamento dei media outbound |
    | `plugin-sdk/outbound-runtime` | Helper per consegna outbound, identità, delega di invio, sessione, formattazione e pianificazione del payload |
    | `plugin-sdk/poll-runtime` | Helper stretti per la normalizzazione dei sondaggi |
    | `plugin-sdk/thread-bindings-runtime` | Helper per ciclo di vita e adapter dei binding dei thread |
    | `plugin-sdk/agent-media-payload` | Builder legacy del payload media dell'agente |
    | `plugin-sdk/conversation-runtime` | Helper per binding conversazione/thread, pairing e binding configurati |
    | `plugin-sdk/runtime-config-snapshot` | Helper per snapshot della configurazione runtime |
    | `plugin-sdk/runtime-group-policy` | Helper per la risoluzione del criterio di gruppo runtime |
    | `plugin-sdk/channel-status` | Helper condivisi per snapshot/riepilogo dello stato del canale |
    | `plugin-sdk/channel-config-primitives` | Primitive strette dello schema di configurazione del canale |
    | `plugin-sdk/channel-config-writes` | Helper di autorizzazione per scritture di configurazione del canale |
    | `plugin-sdk/channel-plugin-common` | Esportazioni prelude condivise del Plugin del canale |
    | `plugin-sdk/allowlist-config-edit` | Helper di lettura/modifica della configurazione allowlist |
    | `plugin-sdk/group-access` | Helper condivisi per le decisioni di accesso ai gruppi |
    | `plugin-sdk/direct-dm` | Helper condivisi per auth/guard DM diretti |
    | `plugin-sdk/interactive-runtime` | Helper per presentazione semantica dei messaggi, consegna e risposte interattive legacy. Vedi [Presentazione dei messaggi](/it/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Barrel di compatibilità per debounce inbound, corrispondenza delle menzioni, helper del criterio di menzione e helper dell'envelope |
    | `plugin-sdk/channel-inbound-debounce` | Helper stretti per debounce inbound |
    | `plugin-sdk/channel-mention-gating` | Helper stretti per il criterio di menzione e il testo di menzione senza la più ampia superficie runtime inbound |
    | `plugin-sdk/channel-envelope` | Helper stretti per la formattazione dell'envelope inbound |
    | `plugin-sdk/channel-location` | Helper per contesto e formattazione della posizione del canale |
    | `plugin-sdk/channel-logging` | Helper di logging del canale per drop inbound e fallimenti typing/ack |
    | `plugin-sdk/channel-send-result` | Tipi del risultato della risposta |
    | `plugin-sdk/channel-actions` | Helper per azioni sui messaggi del canale, più helper di schema nativo deprecati mantenuti per compatibilità dei Plugin |
    | `plugin-sdk/channel-targets` | Helper di parsing/corrispondenza dei target |
    | `plugin-sdk/channel-contract` | Tipi di contratto del canale |
    | `plugin-sdk/channel-feedback` | Wiring di feedback/reazioni |
    | `plugin-sdk/channel-secret-runtime` | Helper stretti del contratto secret come `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment` e tipi del target secret |
  </Accordion>

  <Accordion title="Sottopercorsi del provider">
    | Sottopercorso | Esportazioni principali |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/provider-setup` | Helper curati di configurazione del provider locale/self-hosted |
    | `plugin-sdk/self-hosted-provider-setup` | Helper focalizzati di configurazione del provider self-hosted compatibile con OpenAI |
    | `plugin-sdk/cli-backend` | Valori predefiniti del backend CLI + costanti watchdog |
    | `plugin-sdk/provider-auth-runtime` | Helper runtime per la risoluzione della chiave API per Plugin provider |
    | `plugin-sdk/provider-auth-api-key` | Helper di onboarding/scrittura del profilo per chiavi API come `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Builder standard del risultato auth OAuth |
    | `plugin-sdk/provider-auth-login` | Helper condivisi di login interattivo per Plugin provider |
    | `plugin-sdk/provider-env-vars` | Helper di lookup delle variabili env per auth del provider |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, builder condivisi del criterio di replay, helper degli endpoint provider e helper di normalizzazione dell'id modello come `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Helper generici per capacità HTTP/endpoint del provider, errori HTTP del provider e helper multipart form per trascrizione audio |
    | `plugin-sdk/provider-web-fetch-contract` | Helper stretti del contratto di configurazione/selezione web-fetch come `enablePluginInConfig` e `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Helper di registrazione/cache del provider web-fetch |
    | `plugin-sdk/provider-web-search-config-contract` | Helper stretti di configurazione/credenziali web-search per provider che non richiedono wiring di abilitazione del Plugin |
    | `plugin-sdk/provider-web-search-contract` | Helper stretti del contratto di configurazione/credenziali web-search come `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` e setter/getter delle credenziali con ambito |
    | `plugin-sdk/provider-web-search` | Helper per registrazione/cache/runtime del provider web-search |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, cleanup + diagnostica dello schema Gemini e helper di compatibilità xAI come `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` e simili |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, tipi dei wrapper stream e helper wrapper condivisi per Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-transport-runtime` | Helper del trasporto provider nativo come fetch protetto, trasformazioni dei messaggi di trasporto e stream di eventi di trasporto scrivibili |
    | `plugin-sdk/provider-onboard` | Helper per patch di configurazione dell'onboarding |
    | `plugin-sdk/global-singleton` | Helper per singleton/map/cache locali al processo |
    | `plugin-sdk/group-activation` | Helper stretti per modalità di attivazione del gruppo e parsing dei comandi |
  </Accordion>

  <Accordion title="Sottopercorsi di autenticazione e sicurezza">
    | Sottopercorso | Esportazioni principali |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, helper del registro comandi inclusa la formattazione dinamica del menu degli argomenti, helper di autorizzazione del mittente |
    | `plugin-sdk/command-status` | Builder di messaggi comando/help come `buildCommandsMessagePaginated` e `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Risoluzione dell'approvatore e helper di autorizzazione delle azioni nella stessa chat |
    | `plugin-sdk/approval-client-runtime` | Helper di profilo/filtro per approvazione native exec |
    | `plugin-sdk/approval-delivery-runtime` | Adapter di capacità/consegna per approvazione native |
    | `plugin-sdk/approval-gateway-runtime` | Helper condiviso di risoluzione del Gateway di approvazione |
    | `plugin-sdk/approval-handler-adapter-runtime` | Helper leggeri di caricamento dell'adapter di approvazione nativo per entrypoint di canale hot |
    | `plugin-sdk/approval-handler-runtime` | Helper runtime più ampi per il gestore di approvazione; preferisci le interfacce adapter/gateway più strette quando sono sufficienti |
    | `plugin-sdk/approval-native-runtime` | Helper per target di approvazione nativo + binding dell'account |
    | `plugin-sdk/approval-reply-runtime` | Helper per payload di risposta di approvazione exec/plugin |
    | `plugin-sdk/approval-runtime` | Helper per payload di approvazione exec/plugin, helper di instradamento/runtime di approvazione nativa e helper strutturati di visualizzazione dell'approvazione come `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | Helper stretti di reset della deduplica delle risposte in ingresso |
    | `plugin-sdk/channel-contract-testing` | Helper stretti per test del contratto del canale senza l'ampio barrel di testing |
    | `plugin-sdk/command-auth-native` | Auth dei comandi nativi, formattazione dinamica del menu degli argomenti e helper nativi per target di sessione |
    | `plugin-sdk/command-detection` | Helper condivisi di rilevamento dei comandi |
    | `plugin-sdk/command-primitives-runtime` | Predicati leggeri sul testo dei comandi per percorsi hot del canale |
    | `plugin-sdk/command-surface` | Helper di normalizzazione del corpo del comando e della superficie dei comandi |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Helper stretti di raccolta del contratto secret per superfici secret del canale/plugin |
    | `plugin-sdk/secret-ref-runtime` | Helper stretti `coerceSecretRef` e di tipizzazione SecretRef per parsing di contratti/config secret |
    | `plugin-sdk/security-runtime` | Helper condivisi per trust, gating DM, contenuti esterni e raccolta di secret |
    | `plugin-sdk/ssrf-policy` | Helper del criterio SSRF per allowlist degli host e rete privata |
    | `plugin-sdk/ssrf-dispatcher` | Helper stretti del dispatcher fissato senza l'ampia superficie runtime dell'infrastruttura |
    | `plugin-sdk/ssrf-runtime` | Dispatcher fissato, fetch protetto da SSRF e helper del criterio SSRF |
    | `plugin-sdk/secret-input` | Helper di parsing dell'input secret |
    | `plugin-sdk/webhook-ingress` | Helper per richieste/target Webhook |
    | `plugin-sdk/webhook-request-guards` | Helper per dimensione del body/timeout della richiesta |
  </Accordion>

  <Accordion title="Sottopercorsi di runtime e archiviazione">
    | Sottopercorso | Esportazioni principali |
    | --- | --- |
    | `plugin-sdk/runtime` | Ampi helper per runtime/logging/backup/installazione Plugin |
    | `plugin-sdk/runtime-env` | Helper stretti per env runtime, logger, timeout, retry e backoff |
    | `plugin-sdk/channel-runtime-context` | Helper generici di registrazione e lookup del contesto runtime del canale |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Helper condivisi per comandi/hook/http/interattività dei Plugin |
    | `plugin-sdk/hook-runtime` | Helper condivisi per pipeline di hook Webhook/interni |
    | `plugin-sdk/lazy-runtime` | Helper per import/binding lazy del runtime come `createLazyRuntimeModule`, `createLazyRuntimeMethod` e `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Helper per esecuzione dei processi |
    | `plugin-sdk/cli-runtime` | Helper per formattazione CLI, attesa, versione, invocazione degli argomenti e gruppi di comandi lazy |
    | `plugin-sdk/gateway-runtime` | Helper per client Gateway e patch dello stato del canale |
    | `plugin-sdk/config-runtime` | Helper di caricamento/scrittura della configurazione e helper di lookup della configurazione del Plugin |
    | `plugin-sdk/telegram-command-config` | Normalizzazione di nome/descrizione dei comandi Telegram e controlli di duplicati/conflitti, anche quando la superficie del contratto Telegram bundled non è disponibile |
    | `plugin-sdk/text-autolink-runtime` | Rilevamento di autolink dei riferimenti a file senza l'ampio barrel `text-runtime` |
    | `plugin-sdk/approval-runtime` | Helper per approvazione exec/plugin, builder di capacità di approvazione, helper auth/profilo, helper di instradamento/runtime nativo e formattazione strutturata del percorso di visualizzazione dell'approvazione |
    | `plugin-sdk/reply-runtime` | Helper runtime condivisi per inbound/reply, chunking, dispatch, Heartbeat, pianificatore della risposta |
    | `plugin-sdk/reply-dispatch-runtime` | Helper stretti per dispatch/finalizzazione della risposta e label della conversazione |
    | `plugin-sdk/reply-history` | Helper condivisi per la cronologia delle risposte a finestra breve come `buildHistoryContext`, `recordPendingHistoryEntry` e `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Helper stretti per chunking di testo/Markdown |
    | `plugin-sdk/session-store-runtime` | Helper per percorso del session store + `updated-at` |
    | `plugin-sdk/state-paths` | Helper per i percorsi delle directory state/OAuth |
    | `plugin-sdk/routing` | Helper per route/session-key/binding account come `resolveAgentRoute`, `buildAgentSessionKey` e `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Helper condivisi per riepiloghi dello stato di canale/account, valori predefiniti dello stato runtime e helper per metadati dei problemi |
    | `plugin-sdk/target-resolver-runtime` | Helper condivisi del risolutore dei target |
    | `plugin-sdk/string-normalization-runtime` | Helper di normalizzazione slug/stringhe |
    | `plugin-sdk/request-url` | Estrae URL stringa da input tipo fetch/request |
    | `plugin-sdk/run-command` | Esecutore di comandi temporizzato con risultati stdout/stderr normalizzati |
    | `plugin-sdk/param-readers` | Lettori comuni di parametri Tool/CLI |
    | `plugin-sdk/tool-payload` | Estrae payload normalizzati dagli oggetti risultato dei Tool |
    | `plugin-sdk/tool-send` | Estrae campi target di invio canonici dagli argomenti del Tool |
    | `plugin-sdk/temp-path` | Helper condivisi per percorsi temporanei di download |
    | `plugin-sdk/logging-core` | Helper per logger di sottosistema e redazione |
    | `plugin-sdk/markdown-table-runtime` | Helper per modalità e conversione delle tabelle Markdown |
    | `plugin-sdk/json-store` | Piccoli helper di lettura/scrittura dello stato JSON |
    | `plugin-sdk/file-lock` | Helper di file-lock rientrante |
    | `plugin-sdk/persistent-dedupe` | Helper di cache di deduplica persistente su disco |
    | `plugin-sdk/acp-runtime` | Helper ACP per runtime/sessione e dispatch della risposta |
    | `plugin-sdk/acp-binding-resolve-runtime` | Risoluzione in sola lettura del binding ACP senza import di avvio del ciclo di vita |
    | `plugin-sdk/agent-config-primitives` | Primitive strette dello schema di configurazione runtime dell'agente |
    | `plugin-sdk/boolean-param` | Lettore flessibile di parametri booleani |
    | `plugin-sdk/dangerous-name-runtime` | Helper di risoluzione per corrispondenza di nomi pericolosi |
    | `plugin-sdk/device-bootstrap` | Helper di bootstrap del dispositivo e token di pairing |
    | `plugin-sdk/extension-shared` | Primitive helper condivise per canali passivi, stato e proxy ambient |
    | `plugin-sdk/models-provider-runtime` | Helper di risposta per provider/comando `/models` |
    | `plugin-sdk/skill-commands-runtime` | Helper di elenco dei comandi Skills |
    | `plugin-sdk/native-command-registry` | Helper per registro/build/serializzazione dei comandi nativi |
    | `plugin-sdk/agent-harness` | Superficie sperimentale di trusted-plugin per harness di agente di basso livello: tipi di harness, helper di steering/abort delle esecuzioni attive, helper di bridge dei Tool OpenClaw, helper di formattazione/dettaglio dell'avanzamento dei Tool e utilità per i risultati dei tentativi |
    | `plugin-sdk/provider-zai-endpoint` | Helper di rilevamento degli endpoint Z.AI |
    | `plugin-sdk/infra-runtime` | Helper per eventi di sistema/Heartbeat |
    | `plugin-sdk/collection-runtime` | Piccoli helper di cache limitata |
    | `plugin-sdk/diagnostic-runtime` | Helper per flag ed eventi diagnostici |
    | `plugin-sdk/error-runtime` | Grafo degli errori, formattazione, helper condivisi di classificazione degli errori, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Helper per fetch con wrapper, proxy e lookup fissato |
    | `plugin-sdk/runtime-fetch` | Fetch runtime consapevole del dispatcher senza import di proxy/fetch protetto |
    | `plugin-sdk/response-limit-runtime` | Lettore limitato del body della risposta senza l'ampia superficie runtime dei media |
    | `plugin-sdk/session-binding-runtime` | Stato corrente del binding della conversazione senza instradamento del binding configurato o pairing store |
    | `plugin-sdk/session-store-runtime` | Helper di lettura del session store senza ampi import di scritture/manutenzione della configurazione |
    | `plugin-sdk/context-visibility-runtime` | Risoluzione della visibilità del contesto e filtro del contesto supplementare senza ampi import di configurazione/sicurezza |
    | `plugin-sdk/string-coerce-runtime` | Helper stretti di coercizione e normalizzazione di record/stringhe primitive senza import di markdown/logging |
    | `plugin-sdk/host-runtime` | Helper di normalizzazione di hostname e host SCP |
    | `plugin-sdk/retry-runtime` | Helper per configurazione retry ed esecutore di retry |
    | `plugin-sdk/agent-runtime` | Helper per directory/identità/workspace dell'agente |
    | `plugin-sdk/directory-runtime` | Query/dedup della directory basata sulla configurazione |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Sottopercorsi di capacità e testing">
    | Sottopercorso | Esportazioni principali |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Helper condivisi per fetch/trasformazione/archiviazione dei media più builder di payload media |
    | `plugin-sdk/media-store` | Helper stretti per media store come `saveMediaBuffer` |
    | `plugin-sdk/media-generation-runtime` | Helper condivisi per failover della generazione media, selezione dei candidati e messaggistica per modello mancante |
    | `plugin-sdk/media-understanding` | Tipi del provider per comprensione dei media più esportazioni helper lato provider per immagini/audio |
    | `plugin-sdk/text-runtime` | Helper condivisi per testo/Markdown/logging come rimozione del testo visibile all'assistente, helper di render/chunking/tabella Markdown, helper di redazione, helper per tag di direttiva e utilità per testo sicuro |
    | `plugin-sdk/text-chunking` | Helper di chunking del testo outbound |
    | `plugin-sdk/speech` | Tipi del provider speech più esportazioni helper lato provider per direttive, registro, validazione e speech |
    | `plugin-sdk/speech-core` | Esportazioni helper condivise per tipi provider speech, registro, direttive, normalizzazione e speech |
    | `plugin-sdk/realtime-transcription` | Tipi del provider per trascrizione realtime, helper del registro e helper condiviso per sessione WebSocket |
    | `plugin-sdk/realtime-voice` | Tipi del provider per voce realtime e helper del registro |
    | `plugin-sdk/image-generation` | Tipi del provider per generazione di immagini |
    | `plugin-sdk/image-generation-core` | Helper condivisi per tipi, failover, auth e registro della generazione di immagini |
    | `plugin-sdk/music-generation` | Tipi di provider/richiesta/risultato per generazione musicale |
    | `plugin-sdk/music-generation-core` | Helper condivisi per tipi, failover, lookup del provider e parsing del model-ref della generazione musicale |
    | `plugin-sdk/video-generation` | Tipi di provider/richiesta/risultato per generazione video |
    | `plugin-sdk/video-generation-core` | Helper condivisi per tipi, failover, lookup del provider e parsing del model-ref della generazione video |
    | `plugin-sdk/webhook-targets` | Registro dei target Webhook e helper di installazione delle route |
    | `plugin-sdk/webhook-path` | Helper di normalizzazione del percorso Webhook |
    | `plugin-sdk/web-media` | Helper condivisi per caricamento di media remoti/locali |
    | `plugin-sdk/zod` | `zod` riesportato per i consumer del Plugin SDK |
    | `plugin-sdk/testing` | `installCommonResolveTargetErrorCases`, `shouldAckReaction` |
  </Accordion>

  <Accordion title="Sottopercorsi della memoria">
    | Sottopercorso | Esportazioni principali |
    | --- | --- |
    | `plugin-sdk/memory-core` | Superficie helper `memory-core` bundled per helper di manager/config/file/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | Facciata runtime dell'indice/ricerca della memoria |
    | `plugin-sdk/memory-core-host-engine-foundation` | Esportazioni del motore foundation dell'host della memoria |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Contratti embedding dell'host della memoria, accesso al registro, provider locale e helper generici per batch/remoto |
    | `plugin-sdk/memory-core-host-engine-qmd` | Esportazioni del motore QMD dell'host della memoria |
    | `plugin-sdk/memory-core-host-engine-storage` | Esportazioni del motore di archiviazione dell'host della memoria |
    | `plugin-sdk/memory-core-host-multimodal` | Helper multimodali dell'host della memoria |
    | `plugin-sdk/memory-core-host-query` | Helper di query dell'host della memoria |
    | `plugin-sdk/memory-core-host-secret` | Helper secret dell'host della memoria |
    | `plugin-sdk/memory-core-host-events` | Helper del journal eventi dell'host della memoria |
    | `plugin-sdk/memory-core-host-status` | Helper di stato dell'host della memoria |
    | `plugin-sdk/memory-core-host-runtime-cli` | Helper runtime CLI dell'host della memoria |
    | `plugin-sdk/memory-core-host-runtime-core` | Helper runtime core dell'host della memoria |
    | `plugin-sdk/memory-core-host-runtime-files` | Helper file/runtime dell'host della memoria |
    | `plugin-sdk/memory-host-core` | Alias neutrale rispetto al vendor per gli helper runtime core dell'host della memoria |
    | `plugin-sdk/memory-host-events` | Alias neutrale rispetto al vendor per gli helper del journal eventi dell'host della memoria |
    | `plugin-sdk/memory-host-files` | Alias neutrale rispetto al vendor per gli helper file/runtime dell'host della memoria |
    | `plugin-sdk/memory-host-markdown` | Helper condivisi di managed-markdown per Plugin adiacenti alla memoria |
    | `plugin-sdk/memory-host-search` | Facciata runtime di Active Memory per l'accesso al search-manager |
    | `plugin-sdk/memory-host-status` | Alias neutrale rispetto al vendor per gli helper di stato dell'host della memoria |
    | `plugin-sdk/memory-lancedb` | Superficie helper `memory-lancedb` bundled |
  </Accordion>

  <Accordion title="Sottopercorsi helper bundled riservati">
    | Famiglia | Sottopercorsi attuali | Uso previsto |
    | --- | --- | --- |
    | Browser | `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support` | Helper di supporto del Plugin browser bundled. `browser-profiles` esporta `resolveBrowserConfig`, `resolveProfile`, `ResolvedBrowserConfig`, `ResolvedBrowserProfile` e `ResolvedBrowserTabCleanupConfig` per la forma normalizzata `browser.tabCleanup`. `browser-support` resta il barrel di compatibilità. |
    | Matrix | `plugin-sdk/matrix`, `plugin-sdk/matrix-helper`, `plugin-sdk/matrix-runtime-heavy`, `plugin-sdk/matrix-runtime-shared`, `plugin-sdk/matrix-runtime-surface`, `plugin-sdk/matrix-surface`, `plugin-sdk/matrix-thread-bindings` | Superficie helper/runtime Matrix bundled |
    | Line | `plugin-sdk/line`, `plugin-sdk/line-core`, `plugin-sdk/line-runtime`, `plugin-sdk/line-surface` | Superficie helper/runtime LINE bundled |
    | IRC | `plugin-sdk/irc`, `plugin-sdk/irc-surface` | Superficie helper IRC bundled |
    | Helper specifici del canale | `plugin-sdk/googlechat`, `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles`, `plugin-sdk/bluebubbles-policy`, `plugin-sdk/mattermost`, `plugin-sdk/mattermost-policy`, `plugin-sdk/feishu-conversation`, `plugin-sdk/msteams`, `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`, `plugin-sdk/twitch` | Interfacce di compatibilità/helper dei canali bundled |
    | Helper specifici di auth/plugin | `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`, `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/thread-ownership`, `plugin-sdk/voice-call` | Interfacce helper di funzionalità/Plugin bundled; `plugin-sdk/github-copilot-token` attualmente esporta `DEFAULT_COPILOT_API_BASE_URL`, `deriveCopilotApiBaseUrlFromToken` e `resolveCopilotApiToken` |
  </Accordion>
</AccordionGroup>

## Correlati

- [Panoramica del Plugin SDK](/it/plugins/sdk-overview)
- [Configurazione del Plugin SDK](/it/plugins/sdk-setup)
- [Creazione di Plugin](/it/plugins/building-plugins)
