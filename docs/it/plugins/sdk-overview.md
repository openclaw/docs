---
read_when:
    - Devi sapere da quale sottopercorso SDK importare
    - Vuoi un riferimento per tutti i metodi di registrazione su OpenClawPluginApi
    - Stai cercando una specifica esportazione dell'SDK
sidebarTitle: SDK Overview
summary: Mappa di importazione, riferimento dell'API di registrazione e architettura SDK
title: Panoramica dell'SDK del Plugin
x-i18n:
    generated_at: "2026-04-23T08:32:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5f9608fa3194b1b1609d16d7e2077ea58de097e9e8d4cedef4cb975adfb92938
    source_path: plugins/sdk-overview.md
    workflow: 15
---

# Panoramica dell'SDK del Plugin

L'SDK del Plugin è il contratto tipizzato tra i plugin e il core. Questa pagina è il
riferimento per **cosa importare** e **cosa puoi registrare**.

<Tip>
  **Cerchi una guida pratica?**
  - Primo Plugin? Inizia con [Per iniziare](/it/plugins/building-plugins)
  - Plugin canale? Vedi [Plugin canale](/it/plugins/sdk-channel-plugins)
  - Plugin provider? Vedi [Plugin provider](/it/plugins/sdk-provider-plugins)
</Tip>

## Convenzione di importazione

Importa sempre da un sottopercorso specifico:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Ogni sottopercorso è un modulo piccolo e autosufficiente. Questo mantiene rapido l'avvio e
previene problemi di dipendenze circolari. Per helper di entry/build specifici del canale,
preferisci `openclaw/plugin-sdk/channel-core`; mantieni `openclaw/plugin-sdk/core` per
la surface umbrella più ampia e per helper condivisi come
`buildChannelConfigSchema`.

Non aggiungere né dipendere da interfacce convenience con nome provider come
`openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`,
`openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp` o
interfacce helper brandizzate per canale. I plugin inclusi dovrebbero comporre
sottopercorsi SDK generici all'interno dei propri barrel `api.ts` o `runtime-api.ts`, e il core
dovrebbe usare quei barrel locali al Plugin oppure aggiungere un contratto SDK generico ristretto
quando la necessità è davvero cross-channel.

La mappa delle esportazioni generate contiene ancora un piccolo insieme di interfacce helper
per plugin inclusi come `plugin-sdk/feishu`, `plugin-sdk/feishu-setup`,
`plugin-sdk/zalo`, `plugin-sdk/zalo-setup` e `plugin-sdk/matrix*`. Quei
sottopercorsi esistono solo per la manutenzione e la compatibilità dei plugin inclusi; sono
intenzionalmente omessi dalla tabella comune qui sotto e non sono il percorso di importazione consigliato per nuovi plugin di terze parti.

## Riferimento dei sottopercorsi

I sottopercorsi più usati, raggruppati per finalità. L'elenco completo generato di
oltre 200 sottopercorsi si trova in `scripts/lib/plugin-sdk-entrypoints.json`.

I sottopercorsi helper riservati ai plugin inclusi compaiono ancora in quell'elenco generato.
Trattali come dettagli di implementazione/superfici di compatibilità a meno che una pagina della documentazione
non ne promuova esplicitamente uno come pubblico.

### Entry del Plugin

| Sottopercorso              | Esportazioni principali                                                                                                                |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`  | `definePluginEntry`                                                                                                                    |
| `plugin-sdk/core`          | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema` |
| `plugin-sdk/config-schema` | `OpenClawSchema`                                                                                                                       |
| `plugin-sdk/provider-entry`| `defineSingleProviderPluginEntry`                                                                                                      |

<AccordionGroup>
  <Accordion title="Sottopercorsi del canale">
    | Sottopercorso | Esportazioni principali |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Esportazione dello schema Zod root `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, più `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Helper condivisi per la procedura guidata di setup, prompt allowlist, builder di stato del setup |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Helper per configurazione/gating azioni multi-account, helper di fallback dell'account predefinito |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, helper di normalizzazione account-id |
    | `plugin-sdk/account-resolution` | Helper di lookup account + fallback predefinito |
    | `plugin-sdk/account-helpers` | Helper ristretti per elenco account/azioni account |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter` |
    | `plugin-sdk/channel-config-schema` | Tipi dello schema di configurazione del canale |
    | `plugin-sdk/telegram-command-config` | Helper di normalizzazione/convalida dei comandi personalizzati Telegram con fallback al contratto incluso |
    | `plugin-sdk/command-gating` | Helper ristretti per il gate di autorizzazione dei comandi |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`, helper per lifecycle/finalizzazione di draft stream |
    | `plugin-sdk/inbound-envelope` | Helper condivisi per route inbound e builder envelope |
    | `plugin-sdk/inbound-reply-dispatch` | Helper condivisi per registrazione e dispatch inbound |
    | `plugin-sdk/messaging-targets` | Helper di parsing/matching dei target |
    | `plugin-sdk/outbound-media` | Helper condivisi per il caricamento media outbound |
    | `plugin-sdk/outbound-runtime` | Helper per identità outbound, delega di invio e pianificazione del payload |
    | `plugin-sdk/poll-runtime` | Helper ristretti di normalizzazione dei poll |
    | `plugin-sdk/thread-bindings-runtime` | Helper per lifecycle e adapter dei thread binding |
    | `plugin-sdk/agent-media-payload` | Builder legacy del payload media dell'agente |
    | `plugin-sdk/conversation-runtime` | Helper per binding conversazione/thread, pairing e binding configurato |
    | `plugin-sdk/runtime-config-snapshot` | Helper per snapshot della configurazione runtime |
    | `plugin-sdk/runtime-group-policy` | Helper di risoluzione runtime della policy di gruppo |
    | `plugin-sdk/channel-status` | Helper condivisi per snapshot/riepilogo dello stato del canale |
    | `plugin-sdk/channel-config-primitives` | Primitive ristrette dello schema di configurazione del canale |
    | `plugin-sdk/channel-config-writes` | Helper di autorizzazione per scrittura della configurazione del canale |
    | `plugin-sdk/channel-plugin-common` | Esportazioni prelude condivise dei plugin canale |
    | `plugin-sdk/allowlist-config-edit` | Helper di lettura/modifica della configurazione dell'allowlist |
    | `plugin-sdk/group-access` | Helper condivisi per decisioni di accesso ai gruppi |
    | `plugin-sdk/direct-dm` | Helper condivisi per auth/guard dei DM diretti |
    | `plugin-sdk/interactive-runtime` | Presentazione semantica dei messaggi, consegna e helper legacy per risposte interattive. Vedi [Presentazione dei messaggi](/it/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Barrel di compatibilità per debounce inbound, matching delle menzioni, helper di policy delle menzioni ed envelope helpers |
    | `plugin-sdk/channel-mention-gating` | Helper ristretti di policy delle menzioni senza la surface runtime inbound più ampia |
    | `plugin-sdk/channel-location` | Helper di contesto e formattazione della posizione del canale |
    | `plugin-sdk/channel-logging` | Helper di logging del canale per drop inbound e errori di typing/ack |
    | `plugin-sdk/channel-send-result` | Tipi del risultato di risposta |
    | `plugin-sdk/channel-actions` | Helper di azione dei messaggi del canale, più helper di schema nativi deprecati mantenuti per compatibilità dei plugin |
    | `plugin-sdk/channel-targets` | Helper di parsing/matching dei target |
    | `plugin-sdk/channel-contract` | Tipi del contratto del canale |
    | `plugin-sdk/channel-feedback` | Cablaggio di feedback/reazioni |
    | `plugin-sdk/channel-secret-runtime` | Helper ristretti del contratto dei segreti come `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment` e tipi target dei segreti |
  </Accordion>

  <Accordion title="Sottopercorsi del provider">
    | Sottopercorso | Esportazioni principali |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/provider-setup` | Helper curati per il setup di provider locali/self-hosted |
    | `plugin-sdk/self-hosted-provider-setup` | Helper focalizzati per il setup di provider self-hosted compatibili con OpenAI |
    | `plugin-sdk/cli-backend` | Valori predefiniti del backend CLI + costanti watchdog |
    | `plugin-sdk/provider-auth-runtime` | Helper runtime di risoluzione API key per plugin provider |
    | `plugin-sdk/provider-auth-api-key` | Helper di onboarding/scrittura profilo per API key come `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Builder standard del risultato auth OAuth |
    | `plugin-sdk/provider-auth-login` | Helper condivisi di login interattivo per plugin provider |
    | `plugin-sdk/provider-env-vars` | Helper di lookup delle variabili env auth del provider |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, builder condivisi della replay-policy, helper degli endpoint provider e helper di normalizzazione dei model-id come `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Helper generici di capability HTTP/endpoint del provider, inclusi helper multipart form per trascrizione audio |
    | `plugin-sdk/provider-web-fetch-contract` | Helper ristretti di contratto config/selezione per web-fetch come `enablePluginInConfig` e `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Helper di registrazione/cache per provider web-fetch |
    | `plugin-sdk/provider-web-search-config-contract` | Helper ristretti di configurazione/credenziali per web-search per provider che non richiedono il wiring di abilitazione del Plugin |
    | `plugin-sdk/provider-web-search-contract` | Helper ristretti di contratto config/credenziali per web-search come `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` e setter/getter di credenziali con scope |
    | `plugin-sdk/provider-web-search` | Helper di registrazione/cache/runtime per provider web-search |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, pulizia + diagnostica dello schema Gemini e helper compat xAI come `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` e simili |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, tipi di stream wrapper e helper condivisi per wrapper Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-transport-runtime` | Helper di transport provider nativi come fetch protetto, trasformazioni dei messaggi di transport e stream di eventi di transport scrivibili |
    | `plugin-sdk/provider-onboard` | Helper di patch della configurazione di onboarding |
    | `plugin-sdk/global-singleton` | Helper per singleton/map/cache locali al processo |
  </Accordion>

  <Accordion title="Sottopercorsi auth e sicurezza">
    | Sottopercorso | Esportazioni principali |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, helper del registry dei comandi, helper di autorizzazione del mittente |
    | `plugin-sdk/command-status` | Builder di messaggi comando/help come `buildCommandsMessagePaginated` e `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Risoluzione degli approvatori e helper auth delle azioni nella stessa chat |
    | `plugin-sdk/approval-client-runtime` | Helper di profilo/filtro delle approvazioni exec native |
    | `plugin-sdk/approval-delivery-runtime` | Adapter nativi di capability/consegna delle approvazioni |
    | `plugin-sdk/approval-gateway-runtime` | Helper condiviso di risoluzione del gateway delle approvazioni |
    | `plugin-sdk/approval-handler-adapter-runtime` | Helper leggeri di caricamento degli adapter di approvazione nativa per entrypoint di canale hot |
    | `plugin-sdk/approval-handler-runtime` | Helper runtime più ampi per i gestori delle approvazioni; preferisci le interfacce adapter/gateway più ristrette quando bastano |
    | `plugin-sdk/approval-native-runtime` | Helper per target di approvazione nativa + binding dell'account |
    | `plugin-sdk/approval-reply-runtime` | Helper per payload di risposta di approvazioni exec/plugin |
    | `plugin-sdk/command-auth-native` | Helper auth dei comandi nativi + helper target di sessione nativa |
    | `plugin-sdk/command-detection` | Helper condivisi di rilevamento dei comandi |
    | `plugin-sdk/command-surface` | Helper di normalizzazione del corpo dei comandi e della surface dei comandi |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Helper ristretti di raccolta del contratto dei segreti per superfici di segreti di canale/plugin |
    | `plugin-sdk/secret-ref-runtime` | Helper ristretti `coerceSecretRef` e di tipizzazione SecretRef per parsing di config/contratto dei segreti |
    | `plugin-sdk/security-runtime` | Helper condivisi di trust, gating DM, contenuti esterni e raccolta dei segreti |
    | `plugin-sdk/ssrf-policy` | Helper di allowlist host e policy SSRF per reti private |
    | `plugin-sdk/ssrf-dispatcher` | Helper ristretti di pinned-dispatcher senza l'ampia surface runtime dell'infrastruttura |
    | `plugin-sdk/ssrf-runtime` | Helper di pinned-dispatcher, fetch protetto da SSRF e policy SSRF |
    | `plugin-sdk/secret-input` | Helper di parsing dell'input dei segreti |
    | `plugin-sdk/webhook-ingress` | Helper di richiesta/target Webhook |
    | `plugin-sdk/webhook-request-guards` | Helper per dimensione del corpo richiesta/timeout |
  </Accordion>

  <Accordion title="Sottopercorsi runtime e archiviazione">
    | Sottopercorso | Esportazioni principali |
    | --- | --- |
    | `plugin-sdk/runtime` | Ampi helper runtime/logging/backup/installazione dei plugin |
    | `plugin-sdk/runtime-env` | Helper ristretti per env runtime, logger, timeout, retry e backoff |
    | `plugin-sdk/channel-runtime-context` | Helper generici di registrazione e lookup del contesto runtime del canale |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Helper condivisi per comandi/hook/http/interattività dei plugin |
    | `plugin-sdk/hook-runtime` | Helper condivisi della pipeline di hook Webhook/interni |
    | `plugin-sdk/lazy-runtime` | Helper di importazione/binding runtime lazy come `createLazyRuntimeModule`, `createLazyRuntimeMethod` e `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Helper di esecuzione dei processi |
    | `plugin-sdk/cli-runtime` | Helper di formattazione, attesa e versione della CLI |
    | `plugin-sdk/gateway-runtime` | Helper del client gateway e di patch dello stato del canale |
    | `plugin-sdk/config-runtime` | Helper di caricamento/scrittura della configurazione e di lookup della configurazione del plugin |
    | `plugin-sdk/telegram-command-config` | Normalizzazione di nome/descrizione dei comandi Telegram e controlli di duplicati/conflitti, anche quando la surface del contratto Telegram incluso non è disponibile |
    | `plugin-sdk/text-autolink-runtime` | Rilevamento dell'autolink dei riferimenti a file senza l'ampio barrel text-runtime |
    | `plugin-sdk/approval-runtime` | Helper di approvazione exec/plugin, builder di capability di approvazione, helper auth/profilo, helper di instradamento/runtime nativi |
    | `plugin-sdk/reply-runtime` | Helper condivisi runtime inbound/risposta, chunking, dispatch, Heartbeat, planner di risposta |
    | `plugin-sdk/reply-dispatch-runtime` | Helper ristretti di dispatch/finalizzazione della risposta |
    | `plugin-sdk/reply-history` | Helper condivisi di reply-history a finestra breve come `buildHistoryContext`, `recordPendingHistoryEntry` e `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Helper ristretti di chunking di testo/Markdown |
    | `plugin-sdk/session-store-runtime` | Helper di percorso dello store sessione + `updated-at` |
    | `plugin-sdk/state-paths` | Helper di percorso per directory di stato/OAuth |
    | `plugin-sdk/routing` | Helper di route/chiave di sessione/binding dell'account come `resolveAgentRoute`, `buildAgentSessionKey` e `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Helper condivisi per riepilogo dello stato di canale/account, valori predefiniti dello stato runtime e helper di metadati dei problemi |
    | `plugin-sdk/target-resolver-runtime` | Helper condivisi del risolutore dei target |
    | `plugin-sdk/string-normalization-runtime` | Helper di normalizzazione slug/string |
    | `plugin-sdk/request-url` | Estrazione di URL stringa da input fetch/request-like |
    | `plugin-sdk/run-command` | Runner di comandi con timeout e risultati stdout/stderr normalizzati |
    | `plugin-sdk/param-readers` | Lettori comuni di parametri per strumenti/CLI |
    | `plugin-sdk/tool-payload` | Estrazione di payload normalizzati da oggetti di risultato degli strumenti |
    | `plugin-sdk/tool-send` | Estrazione di campi target canonici di invio dagli argomenti dello strumento |
    | `plugin-sdk/temp-path` | Helper condivisi per percorsi temporanei di download |
    | `plugin-sdk/logging-core` | Helper per logger di sottosistema e redazione |
    | `plugin-sdk/markdown-table-runtime` | Helper della modalità tabella Markdown |
    | `plugin-sdk/json-store` | Piccoli helper di lettura/scrittura dello stato JSON |
    | `plugin-sdk/file-lock` | Helper di file-lock rientrante |
    | `plugin-sdk/persistent-dedupe` | Helper di cache dedupe supportata da disco |
    | `plugin-sdk/acp-runtime` | Helper runtime/sessione ACP e dispatch della risposta |
    | `plugin-sdk/acp-binding-resolve-runtime` | Risoluzione read-only dei binding ACP senza importazioni di avvio del lifecycle |
    | `plugin-sdk/agent-config-primitives` | Primitive ristrette dello schema di configurazione runtime dell'agente |
    | `plugin-sdk/boolean-param` | Lettore permissivo di parametri booleani |
    | `plugin-sdk/dangerous-name-runtime` | Helper di risoluzione per matching di nomi pericolosi |
    | `plugin-sdk/device-bootstrap` | Helper di bootstrap del device e token di abbinamento |
    | `plugin-sdk/extension-shared` | Primitive helper condivise per canale passivo, stato e proxy ambient |
    | `plugin-sdk/models-provider-runtime` | Helper di risposta del comando `/models`/provider |
    | `plugin-sdk/skill-commands-runtime` | Helper di elenco dei comandi Skill |
    | `plugin-sdk/native-command-registry` | Helper di registry/build/serializzazione dei comandi nativi |
    | `plugin-sdk/agent-harness` | Surface sperimentale per plugin trusted per agent harness di basso livello: tipi di harness, helper di steer/abort delle esecuzioni attive, helper bridge degli strumenti OpenClaw e utility dei risultati dei tentativi |
    | `plugin-sdk/provider-zai-endpoint` | Helper di rilevamento degli endpoint Z.AI |
    | `plugin-sdk/infra-runtime` | Helper di eventi di sistema/Heartbeat |
    | `plugin-sdk/collection-runtime` | Piccoli helper di cache bounded |
    | `plugin-sdk/diagnostic-runtime` | Helper di flag ed eventi diagnostici |
    | `plugin-sdk/error-runtime` | Grafo degli errori, formattazione, helper condivisi di classificazione degli errori, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Fetch wrapped, proxy e helper di lookup pinned |
    | `plugin-sdk/runtime-fetch` | Fetch runtime consapevole del dispatcher senza importazioni di proxy/fetch protetto |
    | `plugin-sdk/response-limit-runtime` | Lettore bounded del corpo della risposta senza l'ampia surface media runtime |
    | `plugin-sdk/session-binding-runtime` | Stato del binding della conversazione corrente senza instradamento del binding configurato o store di pairing |
    | `plugin-sdk/session-store-runtime` | Helper di lettura dello store della sessione senza ampie importazioni di scrittura/manutenzione della configurazione |
    | `plugin-sdk/context-visibility-runtime` | Risoluzione della visibilità del contesto e filtro del contesto supplementare senza ampie importazioni di configurazione/sicurezza |
    | `plugin-sdk/string-coerce-runtime` | Helper ristretti di coercizione e normalizzazione di record/stringhe primitive senza importazioni Markdown/logging |
    | `plugin-sdk/host-runtime` | Helper di normalizzazione di hostname e host SCP |
    | `plugin-sdk/retry-runtime` | Helper di configurazione retry e runner di retry |
    | `plugin-sdk/agent-runtime` | Helper di directory/identità/workspace dell'agente |
    | `plugin-sdk/directory-runtime` | Query/dedup di directory supportate da configurazione |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Sottopercorsi di capability e testing">
    | Sottopercorso | Esportazioni principali |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Helper condivisi per fetch/transform/store dei media più builder del payload media |
    | `plugin-sdk/media-generation-runtime` | Helper condivisi di failover della generazione media, selezione dei candidati e messaggistica per modello mancante |
    | `plugin-sdk/media-understanding` | Tipi dei provider di comprensione dei media più esportazioni helper lato provider per immagini/audio |
    | `plugin-sdk/text-runtime` | Helper condivisi per testo/Markdown/logging come rimozione del testo visibile all'assistant, helper di render/chunking/tabella Markdown, helper di redazione, helper di tag direttiva e utility di testo sicuro |
    | `plugin-sdk/text-chunking` | Helper di chunking del testo outbound |
    | `plugin-sdk/speech` | Tipi dei provider speech più esportazioni helper lato provider per direttive, registry e convalida |
    | `plugin-sdk/speech-core` | Tipi condivisi dei provider speech, helper di registry, direttive e normalizzazione |
    | `plugin-sdk/realtime-transcription` | Tipi dei provider di trascrizione realtime, helper di registry e helper condiviso di sessione WebSocket |
    | `plugin-sdk/realtime-voice` | Tipi dei provider di voce realtime e helper di registry |
    | `plugin-sdk/image-generation` | Tipi dei provider di generazione immagini |
    | `plugin-sdk/image-generation-core` | Tipi condivisi di generazione immagini, helper di failover, auth e registry |
    | `plugin-sdk/music-generation` | Tipi di provider/richiesta/risultato della generazione musicale |
    | `plugin-sdk/music-generation-core` | Tipi condivisi di generazione musicale, helper di failover, lookup del provider e parsing dei model-ref |
    | `plugin-sdk/video-generation` | Tipi di provider/richiesta/risultato della generazione video |
    | `plugin-sdk/video-generation-core` | Tipi condivisi di generazione video, helper di failover, lookup del provider e parsing dei model-ref |
    | `plugin-sdk/webhook-targets` | Registry dei target Webhook e helper di installazione delle route |
    | `plugin-sdk/webhook-path` | Helper di normalizzazione del percorso Webhook |
    | `plugin-sdk/web-media` | Helper condivisi di caricamento media remoto/locale |
    | `plugin-sdk/zod` | `zod` riesportato per i consumer dell'SDK del Plugin |
    | `plugin-sdk/testing` | `installCommonResolveTargetErrorCases`, `shouldAckReaction` |
  </Accordion>

  <Accordion title="Sottopercorsi della memoria">
    | Sottopercorso | Esportazioni principali |
    | --- | --- |
    | `plugin-sdk/memory-core` | Surface helper memory-core inclusa per helper di manager/config/file/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | Facciata runtime di indicizzazione/ricerca della memoria |
    | `plugin-sdk/memory-core-host-engine-foundation` | Esportazioni del motore foundation dell'host della memoria |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Contratti di embedding dell'host della memoria, accesso al registry, provider locale e helper generici batch/remoti |
    | `plugin-sdk/memory-core-host-engine-qmd` | Esportazioni del motore QMD dell'host della memoria |
    | `plugin-sdk/memory-core-host-engine-storage` | Esportazioni del motore di storage dell'host della memoria |
    | `plugin-sdk/memory-core-host-multimodal` | Helper multimodali dell'host della memoria |
    | `plugin-sdk/memory-core-host-query` | Helper di query dell'host della memoria |
    | `plugin-sdk/memory-core-host-secret` | Helper dei segreti dell'host della memoria |
    | `plugin-sdk/memory-core-host-events` | Helper del journal eventi dell'host della memoria |
    | `plugin-sdk/memory-core-host-status` | Helper di stato dell'host della memoria |
    | `plugin-sdk/memory-core-host-runtime-cli` | Helper runtime CLI dell'host della memoria |
    | `plugin-sdk/memory-core-host-runtime-core` | Helper runtime core dell'host della memoria |
    | `plugin-sdk/memory-core-host-runtime-files` | Helper file/runtime dell'host della memoria |
    | `plugin-sdk/memory-host-core` | Alias vendor-neutral per helper runtime core dell'host della memoria |
    | `plugin-sdk/memory-host-events` | Alias vendor-neutral per helper del journal eventi dell'host della memoria |
    | `plugin-sdk/memory-host-files` | Alias vendor-neutral per helper file/runtime dell'host della memoria |
    | `plugin-sdk/memory-host-markdown` | Helper condivisi di managed-markdown per plugin adiacenti alla memoria |
    | `plugin-sdk/memory-host-search` | Facciata runtime di Active Memory per accesso al gestore di ricerca |
    | `plugin-sdk/memory-host-status` | Alias vendor-neutral per helper di stato dell'host della memoria |
    | `plugin-sdk/memory-lancedb` | Surface helper memory-lancedb inclusa |
  </Accordion>

  <Accordion title="Sottopercorsi riservati degli helper inclusi">
    | Famiglia | Sottopercorsi attuali | Uso previsto |
    | --- | --- | --- |
    | Browser | `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support` | Helper di supporto per il plugin browser incluso (`browser-support` resta il barrel di compatibilità) |
    | Matrix | `plugin-sdk/matrix`, `plugin-sdk/matrix-helper`, `plugin-sdk/matrix-runtime-heavy`, `plugin-sdk/matrix-runtime-shared`, `plugin-sdk/matrix-runtime-surface`, `plugin-sdk/matrix-surface`, `plugin-sdk/matrix-thread-bindings` | Surface helper/runtime Matrix inclusa |
    | Line | `plugin-sdk/line`, `plugin-sdk/line-core`, `plugin-sdk/line-runtime`, `plugin-sdk/line-surface` | Surface helper/runtime LINE inclusa |
    | IRC | `plugin-sdk/irc`, `plugin-sdk/irc-surface` | Surface helper IRC inclusa |
    | Helper specifici del canale | `plugin-sdk/googlechat`, `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles`, `plugin-sdk/bluebubbles-policy`, `plugin-sdk/mattermost`, `plugin-sdk/mattermost-policy`, `plugin-sdk/feishu-conversation`, `plugin-sdk/msteams`, `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`, `plugin-sdk/twitch` | Interfacce di compatibilità/helper dei canali inclusi |
    | Helper auth/specifici del plugin | `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`, `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/thread-ownership`, `plugin-sdk/voice-call` | Interfacce helper di funzionalità/plugin inclusi; `plugin-sdk/github-copilot-token` esporta attualmente `DEFAULT_COPILOT_API_BASE_URL`, `deriveCopilotApiBaseUrlFromToken` e `resolveCopilotApiToken` |
  </Accordion>
</AccordionGroup>

## API di registrazione

La callback `register(api)` riceve un oggetto `OpenClawPluginApi` con questi
metodi:

### Registrazione delle capability

| Metodo                                           | Cosa registra                         |
| ------------------------------------------------ | ------------------------------------- |
| `api.registerProvider(...)`                      | Inferenza testuale (LLM)              |
| `api.registerAgentHarness(...)`                  | Esecutore sperimentale di basso livello dell'agente |
| `api.registerCliBackend(...)`                    | Backend locale di inferenza CLI       |
| `api.registerChannel(...)`                       | Canale di messaggistica               |
| `api.registerSpeechProvider(...)`                | Sintesi text-to-speech / STT          |
| `api.registerRealtimeTranscriptionProvider(...)` | Trascrizione realtime in streaming    |
| `api.registerRealtimeVoiceProvider(...)`         | Sessioni vocali realtime duplex       |
| `api.registerMediaUnderstandingProvider(...)`    | Analisi di immagini/audio/video       |
| `api.registerImageGenerationProvider(...)`       | Generazione di immagini               |
| `api.registerMusicGenerationProvider(...)`       | Generazione musicale                  |
| `api.registerVideoGenerationProvider(...)`       | Generazione video                     |
| `api.registerWebFetchProvider(...)`              | Provider di web fetch / scraping      |
| `api.registerWebSearchProvider(...)`             | Ricerca web                           |

### Strumenti e comandi

| Metodo                          | Cosa registra                                 |
| ------------------------------- | --------------------------------------------- |
| `api.registerTool(tool, opts?)` | Strumento dell'agente (obbligatorio o `{ optional: true }`) |
| `api.registerCommand(def)`      | Comando personalizzato (bypassa l'LLM)        |

### Infrastruttura

| Metodo                                          | Cosa registra                         |
| ----------------------------------------------- | ------------------------------------- |
| `api.registerHook(events, handler, opts?)`      | Hook di eventi                        |
| `api.registerHttpRoute(params)`                 | Endpoint HTTP del Gateway             |
| `api.registerGatewayMethod(name, handler)`      | Metodo RPC del Gateway                |
| `api.registerCli(registrar, opts?)`             | Sottocomando CLI                      |
| `api.registerService(service)`                  | Servizio in background                |
| `api.registerInteractiveHandler(registration)`  | Gestore interattivo                   |
| `api.registerEmbeddedExtensionFactory(factory)` | Factory di estensione embedded-runner Pi |
| `api.registerMemoryPromptSupplement(builder)`   | Sezione di prompt additiva adiacente alla memoria |
| `api.registerMemoryCorpusSupplement(adapter)`   | Corpus additivo di ricerca/lettura della memoria |

I namespace admin del core riservati (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) restano sempre `operator.admin`, anche se un plugin prova ad assegnare uno
scope più ristretto a un metodo gateway. Preferisci prefissi specifici del plugin per
i metodi gestiti dal plugin.

Usa `api.registerEmbeddedExtensionFactory(...)` quando un Plugin ha bisogno del timing
degli eventi nativi Pi durante le esecuzioni embedded di OpenClaw, per esempio riscritture asincrone di `tool_result`
che devono avvenire prima che venga emesso il messaggio finale del risultato dello strumento.
Oggi questa è un'interfaccia per plugin inclusi: solo i plugin inclusi possono registrarne una, e
devono dichiarare `contracts.embeddedExtensionFactories: ["pi"]` in
`openclaw.plugin.json`. Mantieni i normali hook dei plugin OpenClaw per tutto ciò
che non richiede quell'interfaccia di livello più basso.

### Metadati di registrazione CLI

`api.registerCli(registrar, opts?)` accetta due tipi di metadati di primo livello:

- `commands`: radici di comando esplicite gestite dal registrar
- `descriptors`: descrittori di comando in fase di parsing usati per l'help della CLI root,
  l'instradamento e la registrazione lazy della CLI del plugin

Se vuoi che un comando plugin resti caricato in modo lazy nel normale percorso della CLI root,
fornisci `descriptors` che coprano ogni radice di comando di primo livello esposta da quel
registrar.

```typescript
api.registerCli(
  async ({ program }) => {
    const { registerMatrixCli } = await import("./src/cli.js");
    registerMatrixCli({ program });
  },
  {
    descriptors: [
      {
        name: "matrix",
        description: "Manage Matrix accounts, verification, devices, and profile state",
        hasSubcommands: true,
      },
    ],
  },
);
```

Usa `commands` da solo solo quando non ti serve la registrazione lazy nella CLI root.
Questo percorso di compatibilità eager resta supportato, ma non installa
placeholder supportati da descriptor per il caricamento lazy in fase di parsing.

### Registrazione del backend CLI

`api.registerCliBackend(...)` permette a un plugin di gestire la configurazione predefinita per un
backend CLI AI locale come `codex-cli`.

- L'`id` del backend diventa il prefisso provider nei riferimenti ai modelli come `codex-cli/gpt-5`.
- La `config` del backend usa la stessa struttura di `agents.defaults.cliBackends.<id>`.
- La configurazione dell'utente ha comunque la precedenza. OpenClaw unisce `agents.defaults.cliBackends.<id>` sopra il
  predefinito del plugin prima di eseguire la CLI.
- Usa `normalizeConfig` quando un backend ha bisogno di riscritture di compatibilità dopo il merge
  (per esempio per normalizzare vecchie forme di flag).

### Slot esclusivi

| Metodo                                     | Cosa registra                                                                                                                                             |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | Motore di contesto (uno attivo alla volta). La callback `assemble()` riceve `availableTools` e `citationsMode` così il motore può adattare le aggiunte al prompt. |
| `api.registerMemoryCapability(capability)` | Capability di memoria unificata                                                                                                                           |
| `api.registerMemoryPromptSection(builder)` | Builder della sezione di prompt della memoria                                                                                                             |
| `api.registerMemoryFlushPlan(resolver)`    | Risolutore del piano di flush della memoria                                                                                                               |
| `api.registerMemoryRuntime(runtime)`       | Adapter runtime della memoria                                                                                                                             |

### Adapter di embedding della memoria

| Metodo                                         | Cosa registra                                 |
| ---------------------------------------------- | --------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | Adapter di embedding della memoria per il plugin attivo |

- `registerMemoryCapability` è l'API esclusiva preferita per i plugin di memoria.
- `registerMemoryCapability` può anche esporre `publicArtifacts.listArtifacts(...)`
  così i plugin companion possono consumare artefatti di memoria esportati tramite
  `openclaw/plugin-sdk/memory-host-core` invece di raggiungere il layout privato
  di uno specifico plugin di memoria.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan` e
  `registerMemoryRuntime` sono API esclusive legacy-compatibili per i plugin di memoria.
- `registerMemoryEmbeddingProvider` permette al plugin di memoria attivo di registrare uno
  o più id adapter di embedding (per esempio `openai`, `gemini` o un id personalizzato definito dal plugin).
- La configurazione utente come `agents.defaults.memorySearch.provider` e
  `agents.defaults.memorySearch.fallback` viene risolta rispetto a quegli id adapter registrati.

### Eventi e lifecycle

| Metodo                                       | Cosa fa                       |
| -------------------------------------------- | ----------------------------- |
| `api.on(hookName, handler, opts?)`           | Hook di lifecycle tipizzato   |
| `api.onConversationBindingResolved(handler)` | Callback di binding della conversazione |

### Semantica delle decisioni degli hook

- `before_tool_call`: restituire `{ block: true }` è terminale. Non appena un handler lo imposta, gli handler con priorità inferiore vengono saltati.
- `before_tool_call`: restituire `{ block: false }` viene trattato come nessuna decisione (come omettere `block`), non come override.
- `before_install`: restituire `{ block: true }` è terminale. Non appena un handler lo imposta, gli handler con priorità inferiore vengono saltati.
- `before_install`: restituire `{ block: false }` viene trattato come nessuna decisione (come omettere `block`), non come override.
- `reply_dispatch`: restituire `{ handled: true, ... }` è terminale. Non appena un handler prende in carico il dispatch, gli handler con priorità inferiore e il percorso predefinito di dispatch del modello vengono saltati.
- `message_sending`: restituire `{ cancel: true }` è terminale. Non appena un handler lo imposta, gli handler con priorità inferiore vengono saltati.
- `message_sending`: restituire `{ cancel: false }` viene trattato come nessuna decisione (come omettere `cancel`), non come override.
- `message_received`: usa il campo tipizzato `threadId` quando hai bisogno dell'instradamento inbound di thread/topic. Mantieni `metadata` per extra specifici del canale.
- `message_sending`: usa i campi di instradamento tipizzati `replyToId` / `threadId` prima di usare come fallback `metadata` specifici del canale.
- `gateway_start`: usa `ctx.config`, `ctx.workspaceDir` e `ctx.getCron?.()` per lo stato di avvio gestito dal gateway invece di fare affidamento sugli hook interni `gateway:startup`.

### Campi dell'oggetto API

| Campo                    | Tipo                      | Descrizione                                                                                 |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | Id del Plugin                                                                               |
| `api.name`               | `string`                  | Nome visualizzato                                                                           |
| `api.version`            | `string?`                 | Versione del Plugin (facoltativa)                                                           |
| `api.description`        | `string?`                 | Descrizione del Plugin (facoltativa)                                                        |
| `api.source`             | `string`                  | Percorso sorgente del Plugin                                                                |
| `api.rootDir`            | `string?`                 | Directory root del Plugin (facoltativa)                                                     |
| `api.config`             | `OpenClawConfig`          | Snapshot della configurazione corrente (snapshot runtime attivo in memoria quando disponibile) |
| `api.pluginConfig`       | `Record<string, unknown>` | Configurazione specifica del Plugin da `plugins.entries.<id>.config`                        |
| `api.runtime`            | `PluginRuntime`           | [Helper runtime](/it/plugins/sdk-runtime)                                                      |
| `api.logger`             | `PluginLogger`            | Logger con scope (`debug`, `info`, `warn`, `error`)                                         |
| `api.registrationMode`   | `PluginRegistrationMode`  | Modalità di caricamento corrente; `"setup-runtime"` è la finestra leggera di startup/setup prima dell'entry completa |
| `api.resolvePath(input)` | `(string) => string`      | Risolve un percorso relativo alla root del Plugin                                           |

## Convenzione dei moduli interni

All'interno del tuo Plugin, usa file barrel locali per le importazioni interne:

```
my-plugin/
  api.ts            # Esportazioni pubbliche per consumer esterni
  runtime-api.ts    # Esportazioni runtime solo interne
  index.ts          # Punto di ingresso del Plugin
  setup-entry.ts    # Entry leggera solo setup (facoltativa)
```

<Warning>
  Non importare mai il tuo stesso Plugin tramite `openclaw/plugin-sdk/<your-plugin>`
  dal codice di produzione. Instrada le importazioni interne tramite `./api.ts` o
  `./runtime-api.ts`. Il percorso SDK è solo il contratto esterno.
</Warning>

Le superfici pubbliche dei plugin inclusi caricate tramite facade (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` e file di entry pubblici simili) ora preferiscono lo
snapshot della configurazione runtime attiva quando OpenClaw è già in esecuzione. Se non esiste ancora alcuno snapshot runtime, usano come fallback il file di configurazione risolto su disco.

I plugin provider possono anche esporre un barrel di contratto locale al Plugin quando un
helper è intenzionalmente specifico del provider e non appartiene ancora a un sottopercorso SDK generico.
Esempio incluso attuale: il provider Anthropic mantiene i propri helper di stream Claude
nella propria interfaccia pubblica `api.ts` / `contract-api.ts` invece di promuovere la logica dei beta-header Anthropic e `service_tier` in un contratto generico
`plugin-sdk/*`.

Altri esempi inclusi attuali:

- `@openclaw/openai-provider`: `api.ts` esporta builder di provider,
  helper del modello predefinito e builder di provider realtime
- `@openclaw/openrouter-provider`: `api.ts` esporta il builder del provider più
  helper di onboarding/configurazione

<Warning>
  Anche il codice di produzione delle estensioni dovrebbe evitare importazioni
  `openclaw/plugin-sdk/<other-plugin>`. Se un helper è davvero condiviso, promuovilo in un sottopercorso SDK neutro
  come `openclaw/plugin-sdk/speech`, `.../provider-model-shared` o un'altra
  surface orientata alla capability invece di accoppiare due plugin tra loro.
</Warning>

## Correlati

- [Punti di ingresso](/it/plugins/sdk-entrypoints) — opzioni di `definePluginEntry` e `defineChannelPluginEntry`
- [Helper runtime](/it/plugins/sdk-runtime) — riferimento completo dello spazio dei nomi `api.runtime`
- [Setup e configurazione](/it/plugins/sdk-setup) — packaging, manifest, schemi di configurazione
- [Testing](/it/plugins/sdk-testing) — utility di test e regole lint
- [Migrazione SDK](/it/plugins/sdk-migration) — migrazione da superfici deprecate
- [Interni dei plugin](/it/plugins/architecture) — architettura approfondita e modello di capability
