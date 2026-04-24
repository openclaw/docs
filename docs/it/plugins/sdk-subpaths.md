---
read_when:
    - Scelta del sottopercorso plugin-sdk corretto per un'importazione del Plugin
    - Audit dei sottopercorsi dei Plugin bundle e delle superfici helper
summary: 'Catalogo dei sottopercorsi dell''SDK Plugin: dove si trovano le importazioni, raggruppate per area'
title: Sottopercorsi dell'SDK Plugin
x-i18n:
    generated_at: "2026-04-24T08:54:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: ff4b934501a3163e36b402db72dd75a260fe9f849b3823a7a05e4867a1a5e655
    source_path: plugins/sdk-subpaths.md
    workflow: 15
---

  L'SDK Plugin è esposto come un insieme di sottopercorsi ristretti sotto `openclaw/plugin-sdk/`.
  Questa pagina cataloga i sottopercorsi usati più comunemente raggruppati per scopo. L'elenco completo generato di oltre 200 sottopercorsi si trova in `scripts/lib/plugin-sdk-entrypoints.json`;
  i sottopercorsi helper riservati dei Plugin bundle compaiono lì ma sono un dettaglio di implementazione
  a meno che una pagina della documentazione non li promuova esplicitamente.

  Per la guida alla creazione dei Plugin, vedi [Panoramica SDK Plugin](/it/plugins/sdk-overview).

  ## Entry del Plugin

  | Sottopercorso                  | Export principali                                                                                                                      |
  | ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------- |
  | `plugin-sdk/plugin-entry`      | `definePluginEntry`                                                                                                                    |
  | `plugin-sdk/core`              | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema` |
  | `plugin-sdk/config-schema`     | `OpenClawSchema`                                                                                                                       |
  | `plugin-sdk/provider-entry`    | `defineSingleProviderPluginEntry`                                                                                                      |

  <AccordionGroup>
  <Accordion title="Sottopercorsi canale">
    | Sottopercorso | Export principali |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Export dello schema Zod root `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, più `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Helper condivisi per setup wizard, prompt allowlist, builder dello stato di setup |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Helper multi-account per config/action-gate, helper di fallback dell'account predefinito |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, helper di normalizzazione dell'account-id |
    | `plugin-sdk/account-resolution` | Helper di lookup dell'account + fallback predefinito |
    | `plugin-sdk/account-helpers` | Helper ristretti per elenco account/azioni account |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter` |
    | `plugin-sdk/channel-config-schema` | Tipi dello schema di configurazione del canale |
    | `plugin-sdk/telegram-command-config` | Helper di normalizzazione/convalida dei comandi personalizzati Telegram con fallback al contratto bundle |
    | `plugin-sdk/command-gating` | Helper ristretti per il gate di autorizzazione dei comandi |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`, helper di ciclo di vita/finalizzazione dello stream draft |
    | `plugin-sdk/inbound-envelope` | Helper condivisi per route inbound e costruzione dell'envelope |
    | `plugin-sdk/inbound-reply-dispatch` | Helper condivisi per record-and-dispatch inbound |
    | `plugin-sdk/messaging-targets` | Helper di parsing/matching dei target |
    | `plugin-sdk/outbound-media` | Helper condivisi per il caricamento dei media outbound |
    | `plugin-sdk/outbound-runtime` | Helper per identità outbound, delegato di invio e pianificazione del payload |
    | `plugin-sdk/poll-runtime` | Helper ristretti di normalizzazione dei poll |
    | `plugin-sdk/thread-bindings-runtime` | Helper per ciclo di vita e adattatore dei thread-binding |
    | `plugin-sdk/agent-media-payload` | Builder legacy del payload media dell'agente |
    | `plugin-sdk/conversation-runtime` | Helper per binding di conversazione/thread, pairing e binding configurati |
    | `plugin-sdk/runtime-config-snapshot` | Helper per lo snapshot della configurazione runtime |
    | `plugin-sdk/runtime-group-policy` | Helper di risoluzione della group-policy runtime |
    | `plugin-sdk/channel-status` | Helper condivisi per snapshot/riepilogo dello stato del canale |
    | `plugin-sdk/channel-config-primitives` | Primitive ristrette dello schema di configurazione del canale |
    | `plugin-sdk/channel-config-writes` | Helper di autorizzazione per le scritture di configurazione del canale |
    | `plugin-sdk/channel-plugin-common` | Export del preludio condiviso del Plugin canale |
    | `plugin-sdk/allowlist-config-edit` | Helper di lettura/modifica della configurazione della allowlist |
    | `plugin-sdk/group-access` | Helper condivisi di decisione sull'accesso al gruppo |
    | `plugin-sdk/direct-dm` | Helper condivisi di auth/guard per le DM dirette |
    | `plugin-sdk/interactive-runtime` | Presentazione semantica dei messaggi, consegna e helper legacy per risposte interattive. Vedi [Message Presentation](/it/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Barrel di compatibilità per debounce inbound, matching delle menzioni, helper di policy delle menzioni ed helper dell'envelope |
    | `plugin-sdk/channel-inbound-debounce` | Helper ristretti di debounce inbound |
    | `plugin-sdk/channel-mention-gating` | Helper ristretti di policy delle menzioni e testo delle menzioni senza la più ampia superficie runtime inbound |
    | `plugin-sdk/channel-envelope` | Helper ristretti di formattazione dell'envelope inbound |
    | `plugin-sdk/channel-location` | Helper di contesto e formattazione della posizione del canale |
    | `plugin-sdk/channel-logging` | Helper di logging del canale per drop inbound e guasti typing/ack |
    | `plugin-sdk/channel-send-result` | Tipi del risultato della risposta |
    | `plugin-sdk/channel-actions` | Helper per azioni sui messaggi del canale, più helper di schema nativo deprecati mantenuti per compatibilità dei Plugin |
    | `plugin-sdk/channel-targets` | Helper di parsing/matching dei target |
    | `plugin-sdk/channel-contract` | Tipi del contratto del canale |
    | `plugin-sdk/channel-feedback` | Wiring di feedback/reaction |
    | `plugin-sdk/channel-secret-runtime` | Helper ristretti del contratto dei secret come `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment` e tipi target dei secret |
  </Accordion>

  <Accordion title="Sottopercorsi provider">
    | Sottopercorso | Export principali |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/provider-setup` | Helper curati di setup per provider locali/self-hosted |
    | `plugin-sdk/self-hosted-provider-setup` | Helper mirati di setup per provider self-hosted compatibili OpenAI |
    | `plugin-sdk/cli-backend` | Valori predefiniti del backend CLI + costanti watchdog |
    | `plugin-sdk/provider-auth-runtime` | Helper runtime di risoluzione della chiave API per i Plugin provider |
    | `plugin-sdk/provider-auth-api-key` | Helper di onboarding/scrittura del profilo con chiave API come `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Builder standard del risultato auth OAuth |
    | `plugin-sdk/provider-auth-login` | Helper interattivi condivisi di login per i Plugin provider |
    | `plugin-sdk/provider-env-vars` | Helper di lookup delle env var auth del provider |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, builder condivisi di replay-policy, helper per endpoint provider e helper di normalizzazione degli id modello come `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Helper generici per capacità HTTP/endpoint del provider, inclusi helper multipart form per la trascrizione audio |
    | `plugin-sdk/provider-web-fetch-contract` | Helper ristretti di contratto config/selezione web-fetch come `enablePluginInConfig` e `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Helper di registrazione/cache del provider web-fetch |
    | `plugin-sdk/provider-web-search-config-contract` | Helper ristretti di configurazione/credenziali web-search per provider che non necessitano del wiring di abilitazione del Plugin |
    | `plugin-sdk/provider-web-search-contract` | Helper ristretti di contratto config/credenziali web-search come `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` e setter/getter di credenziali con ambito |
    | `plugin-sdk/provider-web-search` | Helper di registrazione/cache/runtime del provider web-search |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, pulizia dello schema Gemini + diagnostica e helper di compatibilità xAI come `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` e simili |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, tipi di wrapper dello stream e helper wrapper condivisi per Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-transport-runtime` | Helper nativi del trasporto provider come fetch protetto, trasformazioni dei messaggi di trasporto e stream di eventi di trasporto scrivibili |
    | `plugin-sdk/provider-onboard` | Helper di patch della configurazione di onboarding |
    | `plugin-sdk/global-singleton` | Helper singleton/mappa/cache locali al processo |
    | `plugin-sdk/group-activation` | Helper ristretti per modalità di attivazione del gruppo e parsing dei comandi |
  </Accordion>

  <Accordion title="Sottopercorsi di auth e sicurezza">
    | Sottopercorso | Export principali |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, helper del registro dei comandi, helper di autorizzazione del mittente |
    | `plugin-sdk/command-status` | Builder di messaggi comando/help come `buildCommandsMessagePaginated` e `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Risoluzione dell'approvatore e helper di action-auth nella stessa chat |
    | `plugin-sdk/approval-client-runtime` | Helper di profilo/filtro nativi per l'approvazione exec |
    | `plugin-sdk/approval-delivery-runtime` | Adattatori nativi di capacità/consegna dell'approvazione |
    | `plugin-sdk/approval-gateway-runtime` | Helper condiviso di risoluzione del gateway di approvazione |
    | `plugin-sdk/approval-handler-adapter-runtime` | Helper leggeri di caricamento dell'adattatore di approvazione nativo per entrypoint hot del canale |
    | `plugin-sdk/approval-handler-runtime` | Helper runtime più ampi per il gestore di approvazione; preferisci le seam più ristrette adapter/gateway quando bastano |
    | `plugin-sdk/approval-native-runtime` | Helper nativi di target dell'approvazione + binding dell'account |
    | `plugin-sdk/approval-reply-runtime` | Helper del payload di risposta per approvazioni exec/Plugin |
    | `plugin-sdk/reply-dedupe` | Helper ristretti di reset della deduplica delle risposte inbound |
    | `plugin-sdk/channel-contract-testing` | Helper ristretti per test del contratto del canale senza il barrel di test più ampio |
    | `plugin-sdk/command-auth-native` | Auth dei comandi nativi + helper nativi del target di sessione |
    | `plugin-sdk/command-detection` | Helper condivisi di rilevamento dei comandi |
    | `plugin-sdk/command-primitives-runtime` | Predicati leggeri sul testo dei comandi per percorsi hot del canale |
    | `plugin-sdk/command-surface` | Helper di normalizzazione del body dei comandi e della superficie dei comandi |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Helper ristretti di raccolta del contratto dei secret per superfici secret di canali/Plugin |
    | `plugin-sdk/secret-ref-runtime` | Helper ristretti `coerceSecretRef` e di tipizzazione SecretRef per parsing di contratti/configurazione dei secret |
    | `plugin-sdk/security-runtime` | Helper condivisi per trust, gating DM, contenuti esterni e raccolta dei secret |
    | `plugin-sdk/ssrf-policy` | Helper di allowlist host e policy SSRF per rete privata |
    | `plugin-sdk/ssrf-dispatcher` | Helper ristretti di pinned-dispatcher senza la più ampia superficie runtime infra |
    | `plugin-sdk/ssrf-runtime` | Helper di pinned-dispatcher, fetch protetto da SSRF e policy SSRF |
    | `plugin-sdk/secret-input` | Helper di parsing dell'input secret |
    | `plugin-sdk/webhook-ingress` | Helper per richieste/target webhook |
    | `plugin-sdk/webhook-request-guards` | Helper per dimensione body richiesta/timeout |
  </Accordion>

  <Accordion title="Sottopercorsi runtime e storage">
    | Sottopercorso | Export principali |
    | --- | --- |
    | `plugin-sdk/runtime` | Helper ampi per runtime/logging/backup/installazione Plugin |
    | `plugin-sdk/runtime-env` | Helper ristretti per env runtime, logger, timeout, retry e backoff |
    | `plugin-sdk/channel-runtime-context` | Helper generici di registrazione e lookup del contesto runtime del canale |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Helper condivisi per comandi/hook/http/interattivi del Plugin |
    | `plugin-sdk/hook-runtime` | Helper condivisi per la pipeline di webhook/hook interni |
    | `plugin-sdk/lazy-runtime` | Helper di importazione/binding runtime lazy come `createLazyRuntimeModule`, `createLazyRuntimeMethod` e `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Helper di esecuzione dei processi |
    | `plugin-sdk/cli-runtime` | Helper di formattazione CLI, attesa e versione |
    | `plugin-sdk/gateway-runtime` | Helper del client Gateway e di patch dello stato del canale |
    | `plugin-sdk/config-runtime` | Helper di caricamento/scrittura della configurazione e helper di lookup della configurazione del Plugin |
    | `plugin-sdk/telegram-command-config` | Normalizzazione di nomi/descrizioni dei comandi Telegram e controlli di duplicati/conflitti, anche quando la superficie di contratto del Telegram bundle non è disponibile |
    | `plugin-sdk/text-autolink-runtime` | Rilevamento di autolink dei riferimenti ai file senza il barrel text-runtime più ampio |
    | `plugin-sdk/approval-runtime` | Helper per approvazioni exec/Plugin, builder della capacità di approvazione, helper auth/profilo, helper nativi di routing/runtime |
    | `plugin-sdk/reply-runtime` | Helper condivisi di runtime inbound/reply, chunking, dispatch, Heartbeat, pianificatore delle risposte |
    | `plugin-sdk/reply-dispatch-runtime` | Helper ristretti di dispatch/finalizzazione delle risposte |
    | `plugin-sdk/reply-history` | Helper condivisi della cronologia delle risposte in finestra breve come `buildHistoryContext`, `recordPendingHistoryEntry` e `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Helper ristretti di chunking testo/markdown |
    | `plugin-sdk/session-store-runtime` | Helper per percorso dell'archivio sessioni + updated-at |
    | `plugin-sdk/state-paths` | Helper per percorsi state/OAuth dir |
    | `plugin-sdk/routing` | Helper di route/chiave di sessione/binding dell'account come `resolveAgentRoute`, `buildAgentSessionKey` e `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Helper condivisi per riepilogo dello stato di canale/account, valori predefiniti dello stato runtime e helper dei metadati dei problemi |
    | `plugin-sdk/target-resolver-runtime` | Helper condivisi del target resolver |
    | `plugin-sdk/string-normalization-runtime` | Helper di normalizzazione slug/stringhe |
    | `plugin-sdk/request-url` | Estrae URL stringa da input tipo fetch/request |
    | `plugin-sdk/run-command` | Runner di comandi temporizzato con risultati stdout/stderr normalizzati |
    | `plugin-sdk/param-readers` | Lettori comuni di parametri tool/CLI |
    | `plugin-sdk/tool-payload` | Estrae payload normalizzati da oggetti risultato degli strumenti |
    | `plugin-sdk/tool-send` | Estrae campi target di invio canonici dagli argomenti dei tool |
    | `plugin-sdk/temp-path` | Helper condivisi per percorsi temporanei di download |
    | `plugin-sdk/logging-core` | Helper di logger del sottosistema e redazione |
    | `plugin-sdk/markdown-table-runtime` | Helper di modalità e conversione delle tabelle markdown |
    | `plugin-sdk/json-store` | Piccoli helper di lettura/scrittura dello stato JSON |
    | `plugin-sdk/file-lock` | Helper di file-lock rientrante |
    | `plugin-sdk/persistent-dedupe` | Helper di cache di deduplica supportata da disco |
    | `plugin-sdk/acp-runtime` | Helper runtime/sessione ACP e dispatch delle risposte |
    | `plugin-sdk/acp-binding-resolve-runtime` | Risoluzione ACP di sola lettura senza importazioni di avvio del ciclo di vita |
    | `plugin-sdk/agent-config-primitives` | Primitive ristrette dello schema di configurazione runtime dell'agente |
    | `plugin-sdk/boolean-param` | Lettore permissivo di parametri booleani |
    | `plugin-sdk/dangerous-name-runtime` | Helper di risoluzione del matching dei nomi pericolosi |
    | `plugin-sdk/device-bootstrap` | Helper di bootstrap del dispositivo e token di pairing |
    | `plugin-sdk/extension-shared` | Primitive helper condivise per canali passivi, stato e proxy ambient |
    | `plugin-sdk/models-provider-runtime` | Helper per il comando `/models` e per le risposte dei provider |
    | `plugin-sdk/skill-commands-runtime` | Helper per l'elenco dei comandi delle skill |
    | `plugin-sdk/native-command-registry` | Helper nativi per registro/build/serializzazione dei comandi |
    | `plugin-sdk/agent-harness` | Superficie sperimentale per Plugin attendibili per harness agente a basso livello: tipi di harness, helper di steer/abort delle esecuzioni attive, helper bridge degli strumenti OpenClaw, helper di formattazione/dettaglio del progresso degli strumenti e utility del risultato del tentativo |
    | `plugin-sdk/provider-zai-endpoint` | Helper di rilevamento dell'endpoint Z.AI |
    | `plugin-sdk/infra-runtime` | Helper di eventi di sistema/Heartbeat |
    | `plugin-sdk/collection-runtime` | Piccoli helper di cache delimitata |
    | `plugin-sdk/diagnostic-runtime` | Helper per flag ed eventi diagnostici |
    | `plugin-sdk/error-runtime` | Grafo degli errori, formattazione, helper condivisi di classificazione degli errori, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Helper di fetch wrappato, proxy e lookup fissato |
    | `plugin-sdk/runtime-fetch` | Fetch runtime consapevole del dispatcher senza importazioni proxy/guarded-fetch |
    | `plugin-sdk/response-limit-runtime` | Lettore delimitato del body della risposta senza la più ampia superficie media runtime |
    | `plugin-sdk/session-binding-runtime` | Stato corrente del binding di conversazione senza routing di binding configurato o archivi di pairing |
    | `plugin-sdk/session-store-runtime` | Helper di lettura dell'archivio sessioni senza ampie importazioni di scritture/manutenzione della configurazione |
    | `plugin-sdk/context-visibility-runtime` | Risoluzione della visibilità del contesto e filtro del contesto supplementare senza ampie importazioni config/security |
    | `plugin-sdk/string-coerce-runtime` | Helper ristretti di coercizione/normalizzazione di record/stringhe primitive senza importazioni markdown/logging |
    | `plugin-sdk/host-runtime` | Helper di normalizzazione di hostname e host SCP |
    | `plugin-sdk/retry-runtime` | Helper per configurazione del retry e retry runner |
    | `plugin-sdk/agent-runtime` | Helper per agent dir/identity/workspace |
    | `plugin-sdk/directory-runtime` | Query/dedup della directory supportata da config |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Sottopercorsi di capacità e testing">
    | Sottopercorso | Export principali |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Helper condivisi per fetch/transform/store dei media più builder del payload media |
    | `plugin-sdk/media-store` | Helper ristretti di archiviazione media come `saveMediaBuffer` |
    | `plugin-sdk/media-generation-runtime` | Helper condivisi per failover della generazione media, selezione dei candidati e messaggistica di modello mancante |
    | `plugin-sdk/media-understanding` | Tipi del provider di comprensione dei media più export helper di immagini/audio orientati al provider |
    | `plugin-sdk/text-runtime` | Helper condivisi per testo/markdown/logging come stripping del testo visibile all'assistente, helper di rendering/chunking/tabella markdown, helper di redazione, helper di directive-tag e utility di testo sicuro |
    | `plugin-sdk/text-chunking` | Helper di chunking del testo in uscita |
    | `plugin-sdk/speech` | Tipi del provider vocale più helper orientati al provider per directive, registro e convalida |
    | `plugin-sdk/speech-core` | Tipi condivisi del provider vocale, helper di registro, directive e normalizzazione |
    | `plugin-sdk/realtime-transcription` | Tipi del provider di trascrizione realtime, helper di registro e helper condiviso di sessione WebSocket |
    | `plugin-sdk/realtime-voice` | Tipi del provider vocale realtime e helper di registro |
    | `plugin-sdk/image-generation` | Tipi del provider di generazione immagini |
    | `plugin-sdk/image-generation-core` | Tipi condivisi di generazione immagini, helper di failover, auth e registro |
    | `plugin-sdk/music-generation` | Tipi provider/richiesta/risultato della generazione musicale |
    | `plugin-sdk/music-generation-core` | Tipi condivisi di generazione musicale, helper di failover, lookup del provider e parsing del model-ref |
    | `plugin-sdk/video-generation` | Tipi provider/richiesta/risultato della generazione video |
    | `plugin-sdk/video-generation-core` | Tipi condivisi di generazione video, helper di failover, lookup del provider e parsing del model-ref |
    | `plugin-sdk/webhook-targets` | Registro dei target webhook e helper di installazione delle route |
    | `plugin-sdk/webhook-path` | Helper di normalizzazione del percorso webhook |
    | `plugin-sdk/web-media` | Helper condivisi per caricamento dei media remoti/locali |
    | `plugin-sdk/zod` | `zod` riesportato per i consumer dell'SDK Plugin |
    | `plugin-sdk/testing` | `installCommonResolveTargetErrorCases`, `shouldAckReaction` |
  </Accordion>

  <Accordion title="Sottopercorsi della memoria">
    | Sottopercorso | Export principali |
    | --- | --- |
    | `plugin-sdk/memory-core` | Superficie helper del memory-core bundle per helper di manager/configurazione/file/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | Facade runtime di indice/ricerca della memoria |
    | `plugin-sdk/memory-core-host-engine-foundation` | Export del motore foundation dell'host di memoria |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Contratti di embedding dell'host di memoria, accesso al registro, provider locale e helper generici batch/remoti |
    | `plugin-sdk/memory-core-host-engine-qmd` | Export del motore QMD dell'host di memoria |
    | `plugin-sdk/memory-core-host-engine-storage` | Export del motore storage dell'host di memoria |
    | `plugin-sdk/memory-core-host-multimodal` | Helper multimodali dell'host di memoria |
    | `plugin-sdk/memory-core-host-query` | Helper di query dell'host di memoria |
    | `plugin-sdk/memory-core-host-secret` | Helper secret dell'host di memoria |
    | `plugin-sdk/memory-core-host-events` | Helper del journal eventi dell'host di memoria |
    | `plugin-sdk/memory-core-host-status` | Helper di stato dell'host di memoria |
    | `plugin-sdk/memory-core-host-runtime-cli` | Helper runtime CLI dell'host di memoria |
    | `plugin-sdk/memory-core-host-runtime-core` | Helper runtime core dell'host di memoria |
    | `plugin-sdk/memory-core-host-runtime-files` | Helper file/runtime dell'host di memoria |
    | `plugin-sdk/memory-host-core` | Alias neutrale rispetto al vendor per gli helper runtime core dell'host di memoria |
    | `plugin-sdk/memory-host-events` | Alias neutrale rispetto al vendor per gli helper del journal eventi dell'host di memoria |
    | `plugin-sdk/memory-host-files` | Alias neutrale rispetto al vendor per gli helper file/runtime dell'host di memoria |
    | `plugin-sdk/memory-host-markdown` | Helper condivisi managed-markdown per Plugin adiacenti alla memoria |
    | `plugin-sdk/memory-host-search` | Facade runtime Active Memory per l'accesso al search-manager |
    | `plugin-sdk/memory-host-status` | Alias neutrale rispetto al vendor per gli helper di stato dell'host di memoria |
    | `plugin-sdk/memory-lancedb` | Superficie helper del memory-lancedb bundle |
  </Accordion>

  <Accordion title="Sottopercorsi helper bundle riservati">
    | Famiglia | Sottopercorsi attuali | Uso previsto |
    | --- | --- | --- |
    | Browser | `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support` | Helper di supporto del Plugin browser bundle (`browser-support` resta il barrel di compatibilità) |
    | Matrix | `plugin-sdk/matrix`, `plugin-sdk/matrix-helper`, `plugin-sdk/matrix-runtime-heavy`, `plugin-sdk/matrix-runtime-shared`, `plugin-sdk/matrix-runtime-surface`, `plugin-sdk/matrix-surface`, `plugin-sdk/matrix-thread-bindings` | Superficie helper/runtime Matrix bundle |
    | Line | `plugin-sdk/line`, `plugin-sdk/line-core`, `plugin-sdk/line-runtime`, `plugin-sdk/line-surface` | Superficie helper/runtime LINE bundle |
    | IRC | `plugin-sdk/irc`, `plugin-sdk/irc-surface` | Superficie helper IRC bundle |
    | Helper specifici del canale | `plugin-sdk/googlechat`, `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles`, `plugin-sdk/bluebubbles-policy`, `plugin-sdk/mattermost`, `plugin-sdk/mattermost-policy`, `plugin-sdk/feishu-conversation`, `plugin-sdk/msteams`, `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`, `plugin-sdk/twitch` | Seam helper/compatibilità dei canali bundle |
    | Helper specifici di auth/Plugin | `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`, `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/thread-ownership`, `plugin-sdk/voice-call` | Seam helper di funzionalità/Plugin bundle; `plugin-sdk/github-copilot-token` esporta attualmente `DEFAULT_COPILOT_API_BASE_URL`, `deriveCopilotApiBaseUrlFromToken` e `resolveCopilotApiToken` |
  </Accordion>
</AccordionGroup>

## Correlati

- [Panoramica SDK Plugin](/it/plugins/sdk-overview)
- [Configurazione SDK Plugin](/it/plugins/sdk-setup)
- [Creazione di Plugin](/it/plugins/building-plugins)
