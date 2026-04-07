---
read_when:
    - Devi sapere da quale sottopercorso SDK importare
    - Vuoi un riferimento per tutti i metodi di registrazione su OpenClawPluginApi
    - Stai cercando una specifica esportazione SDK
sidebarTitle: SDK Overview
summary: Mappa di importazione, riferimento dell'API di registrazione e architettura dell'SDK
title: Panoramica del Plugin SDK
x-i18n:
    generated_at: "2026-04-07T08:16:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6ba11d1708a117f3872a09fd0bebb0481d36b89b473aec861192e8c2745ef727
    source_path: plugins/sdk-overview.md
    workflow: 15
---

# Panoramica del Plugin SDK

Il plugin SDK è il contratto tipizzato tra i plugin e il core. Questa pagina è il
riferimento per **cosa importare** e **cosa puoi registrare**.

<Tip>
  **Cerchi una guida pratica?**
  - Primo plugin? Inizia con [Per iniziare](/it/plugins/building-plugins)
  - Plugin di canale? Vedi [Plugin di canale](/it/plugins/sdk-channel-plugins)
  - Plugin provider? Vedi [Plugin provider](/it/plugins/sdk-provider-plugins)
</Tip>

## Convenzione di importazione

Importa sempre da un sottopercorso specifico:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Ogni sottopercorso è un piccolo modulo autonomo. Questo mantiene rapido l'avvio e
previene problemi di dipendenze circolari. Per gli helper di ingresso/build specifici dei canali,
preferisci `openclaw/plugin-sdk/channel-core`; mantieni `openclaw/plugin-sdk/core` per
la superficie ombrello più ampia e per gli helper condivisi come
`buildChannelConfigSchema`.

Non aggiungere né dipendere da seam di comodità con nome del provider come
`openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`,
`openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp` o
seam helper con brand del canale. I plugin inclusi dovrebbero comporre
sottopercorsi SDK generici all'interno dei propri barrel `api.ts` o `runtime-api.ts`, e il core
dovrebbe usare quei barrel locali al plugin oppure aggiungere un contratto SDK generico ristretto
quando l'esigenza è davvero trasversale ai canali.

La mappa di esportazione generata contiene ancora un piccolo insieme di seam helper
per plugin inclusi come `plugin-sdk/feishu`, `plugin-sdk/feishu-setup`,
`plugin-sdk/zalo`, `plugin-sdk/zalo-setup` e `plugin-sdk/matrix*`. Questi
sottopercorsi esistono solo per la manutenzione e la compatibilità dei plugin inclusi; sono
intenzionalmente omessi dalla tabella comune sotto e non sono il percorso di importazione
consigliato per i nuovi plugin di terze parti.

## Riferimento dei sottopercorsi

I sottopercorsi usati più comunemente, raggruppati per scopo. L'elenco completo generato di
oltre 200 sottopercorsi si trova in `scripts/lib/plugin-sdk-entrypoints.json`.

I sottopercorsi helper riservati ai plugin inclusi compaiono ancora in quell'elenco generato.
Trattali come superfici di dettaglio implementativo/compatibilità a meno che una pagina della documentazione
non ne promuova esplicitamente uno come pubblico.

### Ingresso plugin

| Sottopercorso              | Esportazioni chiave                                                                                                                   |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`  | `definePluginEntry`                                                                                                                   |
| `plugin-sdk/core`          | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema` |
| `plugin-sdk/config-schema` | `OpenClawSchema`                                                                                                                      |
| `plugin-sdk/provider-entry`| `defineSingleProviderPluginEntry`                                                                                                     |

<AccordionGroup>
  <Accordion title="Sottopercorsi dei canali">
    | Sottopercorso | Esportazioni chiave |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Esportazione dello schema Zod radice di `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, oltre a `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Helper condivisi per la procedura guidata di setup, prompt per allowlist, builder dello stato di setup |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Helper per config multi-account/action-gate e helper di fallback dell'account predefinito |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, helper di normalizzazione dell'ID account |
    | `plugin-sdk/account-resolution` | Helper di ricerca account + fallback predefinito |
    | `plugin-sdk/account-helpers` | Helper ristretti per elenco account/azioni account |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter` |
    | `plugin-sdk/channel-config-schema` | Tipi di schema della configurazione del canale |
    | `plugin-sdk/telegram-command-config` | Helper di normalizzazione/convalida dei comandi personalizzati Telegram con fallback al contratto incluso |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink` |
    | `plugin-sdk/inbound-envelope` | Helper condivisi per route in ingresso + builder dell'envelope |
    | `plugin-sdk/inbound-reply-dispatch` | Helper condivisi per registrare e distribuire in ingresso |
    | `plugin-sdk/messaging-targets` | Helper di parsing/matching dei target |
    | `plugin-sdk/outbound-media` | Helper condivisi per il caricamento dei media in uscita |
    | `plugin-sdk/outbound-runtime` | Helper per identità in uscita/delegate di invio |
    | `plugin-sdk/thread-bindings-runtime` | Helper per lifecycle e adapter dei thread binding |
    | `plugin-sdk/agent-media-payload` | Builder legacy del payload media dell'agente |
    | `plugin-sdk/conversation-runtime` | Helper per binding conversazione/thread, pairing e binding configurati |
    | `plugin-sdk/runtime-config-snapshot` | Helper per snapshot della configurazione runtime |
    | `plugin-sdk/runtime-group-policy` | Helper runtime per la risoluzione della group-policy |
    | `plugin-sdk/channel-status` | Helper condivisi per snapshot/riepilogo dello stato del canale |
    | `plugin-sdk/channel-config-primitives` | Primitive ristrette di schema config del canale |
    | `plugin-sdk/channel-config-writes` | Helper di autorizzazione per la scrittura della config del canale |
    | `plugin-sdk/channel-plugin-common` | Esportazioni di preludio condivise del plugin di canale |
    | `plugin-sdk/allowlist-config-edit` | Helper di modifica/lettura della config dell'allowlist |
    | `plugin-sdk/group-access` | Helper condivisi per le decisioni di accesso ai gruppi |
    | `plugin-sdk/direct-dm` | Helper condivisi di autenticazione/guardia DM diretti |
    | `plugin-sdk/interactive-runtime` | Helper per normalizzazione/riduzione del payload di risposta interattiva |
    | `plugin-sdk/channel-inbound` | Helper per debounce in ingresso, matching delle mention, policy delle mention ed envelope |
    | `plugin-sdk/channel-send-result` | Tipi del risultato di risposta |
    | `plugin-sdk/channel-actions` | `createMessageToolButtonsSchema`, `createMessageToolCardSchema` |
    | `plugin-sdk/channel-targets` | Helper di parsing/matching dei target |
    | `plugin-sdk/channel-contract` | Tipi del contratto del canale |
    | `plugin-sdk/channel-feedback` | Cablaggio di feedback/reazioni |
    | `plugin-sdk/channel-secret-runtime` | Helper ristretti del contratto secret come `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment` e tipi di target secret |
  </Accordion>

  <Accordion title="Sottopercorsi dei provider">
    | Sottopercorso | Esportazioni chiave |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/provider-setup` | Helper di setup curati per provider locali/self-hosted |
    | `plugin-sdk/self-hosted-provider-setup` | Helper di setup focalizzati per provider self-hosted compatibili con OpenAI |
    | `plugin-sdk/cli-backend` | Valori predefiniti del backend CLI + costanti watchdog |
    | `plugin-sdk/provider-auth-runtime` | Helper runtime per la risoluzione delle chiavi API per i plugin provider |
    | `plugin-sdk/provider-auth-api-key` | Helper di onboarding/scrittura profilo della chiave API come `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Builder standard del risultato auth OAuth |
    | `plugin-sdk/provider-auth-login` | Helper interattivi condivisi di login per i plugin provider |
    | `plugin-sdk/provider-env-vars` | Helper di ricerca delle variabili d'ambiente auth del provider |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, builder condivisi di replay-policy, helper endpoint del provider e helper di normalizzazione dell'ID modello come `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Helper generici per capacità HTTP/endpoint del provider |
    | `plugin-sdk/provider-web-fetch-contract` | Helper ristretti del contratto config/selezione per web fetch come `enablePluginInConfig` e `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Helper di registrazione/cache del provider web fetch |
    | `plugin-sdk/provider-web-search-contract` | Helper ristretti del contratto config/credenziali per web search come `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` e setter/getter di credenziali con ambito |
    | `plugin-sdk/provider-web-search` | Helper di registrazione/cache/runtime del provider web search |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, pulizia e diagnostica dello schema Gemini e helper di compatibilità xAI come `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` e simili |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, tipi di wrapper di stream e helper condivisi di wrapper per Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-onboard` | Helper di patch della config di onboarding |
    | `plugin-sdk/global-singleton` | Helper per singleton/map/cache locali al processo |
  </Accordion>

  <Accordion title="Sottopercorsi di autenticazione e sicurezza">
    | Sottopercorso | Esportazioni chiave |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, helper del registro dei comandi, helper di autorizzazione del mittente |
    | `plugin-sdk/approval-auth-runtime` | Risoluzione dell'approvatore e helper di action-auth nella stessa chat |
    | `plugin-sdk/approval-client-runtime` | Helper nativi per profili/filtri di approvazione exec |
    | `plugin-sdk/approval-delivery-runtime` | Adapter nativi per capacità/consegna dell'approvazione |
    | `plugin-sdk/approval-native-runtime` | Helper nativi per target di approvazione + account-binding |
    | `plugin-sdk/approval-reply-runtime` | Helper per payload di risposta di approvazione exec/plugin |
    | `plugin-sdk/command-auth-native` | Auth comandi nativa + helper nativi per session-target |
    | `plugin-sdk/command-detection` | Helper condivisi per il rilevamento dei comandi |
    | `plugin-sdk/command-surface` | Normalizzazione del corpo del comando e helper della command-surface |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Helper ristretti per la raccolta del contratto secret per superfici secret di canali/plugin |
    | `plugin-sdk/secret-ref-runtime` | Helper ristretti `coerceSecretRef` e di tipizzazione SecretRef per il parsing di secret-contract/config |
    | `plugin-sdk/security-runtime` | Helper condivisi per trust, blocco DM, contenuti esterni e raccolta dei secret |
    | `plugin-sdk/ssrf-policy` | Helper di allowlist host e policy SSRF per rete privata |
    | `plugin-sdk/ssrf-runtime` | Helper per dispatcher bloccato, fetch protetta da SSRF e policy SSRF |
    | `plugin-sdk/secret-input` | Helper di parsing dell'input secret |
    | `plugin-sdk/webhook-ingress` | Helper per richieste/target webhook |
    | `plugin-sdk/webhook-request-guards` | Helper per dimensione del body e timeout della richiesta |
  </Accordion>

  <Accordion title="Sottopercorsi di runtime e storage">
    | Sottopercorso | Esportazioni chiave |
    | --- | --- |
    | `plugin-sdk/runtime` | Helper ampi per runtime/logging/backup/installazione plugin |
    | `plugin-sdk/runtime-env` | Helper ristretti per ambiente runtime, logger, timeout, retry e backoff |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Helper condivisi per comandi/hook/http/interattività del plugin |
    | `plugin-sdk/hook-runtime` | Helper condivisi per pipeline di webhook/hook interni |
    | `plugin-sdk/lazy-runtime` | Helper per importazioni/binding lazy del runtime come `createLazyRuntimeModule`, `createLazyRuntimeMethod` e `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Helper per esecuzione di processi |
    | `plugin-sdk/cli-runtime` | Helper CLI per formattazione, attesa e versione |
    | `plugin-sdk/gateway-runtime` | Client gateway e helper di patch dello stato del canale |
    | `plugin-sdk/config-runtime` | Helper per caricare/scrivere la config |
    | `plugin-sdk/telegram-command-config` | Helper di normalizzazione di nome/descrizione del comando Telegram e controlli di duplicati/conflitti, anche quando la superficie contrattuale Telegram inclusa non è disponibile |
    | `plugin-sdk/approval-runtime` | Helper per approvazione exec/plugin, builder delle capacità di approvazione, helper auth/profilo, helper nativi di routing/runtime |
    | `plugin-sdk/reply-runtime` | Helper condivisi di runtime per ingresso/risposta, chunking, dispatch, heartbeat, pianificatore di risposta |
    | `plugin-sdk/reply-dispatch-runtime` | Helper ristretti per dispatch/finalizzazione della risposta |
    | `plugin-sdk/reply-history` | Helper condivisi per la cronologia delle risposte a finestra breve come `buildHistoryContext`, `recordPendingHistoryEntry` e `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Helper ristretti per chunking di testo/markdown |
    | `plugin-sdk/session-store-runtime` | Helper per percorso dell'archivio sessioni + updated-at |
    | `plugin-sdk/state-paths` | Helper per i percorsi delle directory di stato/OAuth |
    | `plugin-sdk/routing` | Helper di route/session-key/account binding come `resolveAgentRoute`, `buildAgentSessionKey` e `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Helper condivisi per riepilogo dello stato di canale/account, valori predefiniti dello stato runtime e helper per i metadati dei problemi |
    | `plugin-sdk/target-resolver-runtime` | Helper condivisi per la risoluzione dei target |
    | `plugin-sdk/string-normalization-runtime` | Helper di normalizzazione slug/stringhe |
    | `plugin-sdk/request-url` | Estrai URL stringa da input simili a fetch/request |
    | `plugin-sdk/run-command` | Runner di comandi con tempo misurato e risultati stdout/stderr normalizzati |
    | `plugin-sdk/param-readers` | Lettori comuni di parametri per tool/CLI |
    | `plugin-sdk/tool-send` | Estrai campi canonici del target di invio dagli argomenti del tool |
    | `plugin-sdk/temp-path` | Helper condivisi per percorsi temporanei di download |
    | `plugin-sdk/logging-core` | Helper per logger del sottosistema e redazione |
    | `plugin-sdk/markdown-table-runtime` | Helper per la modalità tabella Markdown |
    | `plugin-sdk/json-store` | Piccoli helper di lettura/scrittura dello stato JSON |
    | `plugin-sdk/file-lock` | Helper di file-lock ri-entranti |
    | `plugin-sdk/persistent-dedupe` | Helper per cache dedupe persistente su disco |
    | `plugin-sdk/acp-runtime` | Helper ACP per runtime/sessione e reply-dispatch |
    | `plugin-sdk/agent-config-primitives` | Primitive ristrette di schema config runtime dell'agente |
    | `plugin-sdk/boolean-param` | Lettore permissivo di parametri booleani |
    | `plugin-sdk/dangerous-name-runtime` | Helper di risoluzione per il matching di nomi pericolosi |
    | `plugin-sdk/device-bootstrap` | Helper per bootstrap del dispositivo e token di pairing |
    | `plugin-sdk/extension-shared` | Primitive helper condivise per canale passivo, stato e proxy ambient |
    | `plugin-sdk/models-provider-runtime` | Helper per risposte del comando `/models`/provider |
    | `plugin-sdk/skill-commands-runtime` | Helper per l'elenco dei comandi Skills |
    | `plugin-sdk/native-command-registry` | Helper nativi per registro/build/serializzazione dei comandi |
    | `plugin-sdk/provider-zai-endpoint` | Helper di rilevamento degli endpoint Z.A.I |
    | `plugin-sdk/infra-runtime` | Helper per eventi di sistema/heartbeat |
    | `plugin-sdk/collection-runtime` | Piccoli helper per cache limitate |
    | `plugin-sdk/diagnostic-runtime` | Helper per flag ed eventi diagnostici |
    | `plugin-sdk/error-runtime` | Grafo degli errori, formattazione, helper condivisi di classificazione errori, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Helper per fetch incapsulata, proxy e ricerca bloccata |
    | `plugin-sdk/host-runtime` | Helper per normalizzazione di hostname e host SCP |
    | `plugin-sdk/retry-runtime` | Helper per config e runner di retry |
    | `plugin-sdk/agent-runtime` | Helper per directory agente/identità/workspace |
    | `plugin-sdk/directory-runtime` | Query/dedup di directory basata sulla config |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Sottopercorsi di capacità e testing">
    | Sottopercorso | Esportazioni chiave |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Helper condivisi per fetch/trasformazione/storage dei media più builder di payload media |
    | `plugin-sdk/media-generation-runtime` | Helper condivisi per failover nella generazione media, selezione dei candidati e messaggistica per modello mancante |
    | `plugin-sdk/media-understanding` | Tipi dei provider di comprensione dei media più esportazioni helper lato provider per immagini/audio |
    | `plugin-sdk/text-runtime` | Helper condivisi per testo/markdown/logging come rimozione del testo visibile all'assistente, helper di rendering/chunking/tabella Markdown, helper di redazione, helper dei tag direttiva e utility di testo sicuro |
    | `plugin-sdk/text-chunking` | Helper per chunking del testo in uscita |
    | `plugin-sdk/speech` | Tipi dei provider speech più helper lato provider per direttive, registro e convalida |
    | `plugin-sdk/speech-core` | Tipi condivisi dei provider speech, helper per registro, direttive e normalizzazione |
    | `plugin-sdk/realtime-transcription` | Tipi dei provider di trascrizione in tempo reale e helper di registro |
    | `plugin-sdk/realtime-voice` | Tipi dei provider di voce in tempo reale e helper di registro |
    | `plugin-sdk/image-generation` | Tipi dei provider di generazione immagini |
    | `plugin-sdk/image-generation-core` | Tipi condivisi di generazione immagini, helper per failover, auth e registro |
    | `plugin-sdk/music-generation` | Tipi di provider/richiesta/risultato per generazione musicale |
    | `plugin-sdk/music-generation-core` | Tipi condivisi di generazione musicale, helper di failover, ricerca provider e parsing del riferimento modello |
    | `plugin-sdk/video-generation` | Tipi di provider/richiesta/risultato per generazione video |
    | `plugin-sdk/video-generation-core` | Tipi condivisi di generazione video, helper di failover, ricerca provider e parsing del riferimento modello |
    | `plugin-sdk/webhook-targets` | Registro dei target webhook e helper di installazione delle route |
    | `plugin-sdk/webhook-path` | Helper di normalizzazione dei percorsi webhook |
    | `plugin-sdk/web-media` | Helper condivisi per il caricamento di media remoti/locali |
    | `plugin-sdk/zod` | `zod` riesportato per i consumatori del plugin SDK |
    | `plugin-sdk/testing` | `installCommonResolveTargetErrorCases`, `shouldAckReaction` |
  </Accordion>

  <Accordion title="Sottopercorsi della memoria">
    | Sottopercorso | Esportazioni chiave |
    | --- | --- |
    | `plugin-sdk/memory-core` | Superficie helper memory-core inclusa per helper di manager/config/file/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | Facciata runtime dell'indice/ricerca in memoria |
    | `plugin-sdk/memory-core-host-engine-foundation` | Esportazioni del motore foundation dell'host memoria |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Esportazioni del motore embeddings dell'host memoria |
    | `plugin-sdk/memory-core-host-engine-qmd` | Esportazioni del motore QMD dell'host memoria |
    | `plugin-sdk/memory-core-host-engine-storage` | Esportazioni del motore storage dell'host memoria |
    | `plugin-sdk/memory-core-host-multimodal` | Helper multimodali dell'host memoria |
    | `plugin-sdk/memory-core-host-query` | Helper di query dell'host memoria |
    | `plugin-sdk/memory-core-host-secret` | Helper secret dell'host memoria |
    | `plugin-sdk/memory-core-host-events` | Helper del journal eventi dell'host memoria |
    | `plugin-sdk/memory-core-host-status` | Helper di stato dell'host memoria |
    | `plugin-sdk/memory-core-host-runtime-cli` | Helper runtime CLI dell'host memoria |
    | `plugin-sdk/memory-core-host-runtime-core` | Helper core runtime dell'host memoria |
    | `plugin-sdk/memory-core-host-runtime-files` | Helper file/runtime dell'host memoria |
    | `plugin-sdk/memory-host-core` | Alias neutrale rispetto al vendor per helper core runtime dell'host memoria |
    | `plugin-sdk/memory-host-events` | Alias neutrale rispetto al vendor per helper del journal eventi dell'host memoria |
    | `plugin-sdk/memory-host-files` | Alias neutrale rispetto al vendor per helper file/runtime dell'host memoria |
    | `plugin-sdk/memory-host-markdown` | Helper condivisi di managed-markdown per plugin adiacenti alla memoria |
    | `plugin-sdk/memory-host-search` | Facciata runtime della memoria attiva per accesso al gestore di ricerca |
    | `plugin-sdk/memory-host-status` | Alias neutrale rispetto al vendor per helper di stato dell'host memoria |
    | `plugin-sdk/memory-lancedb` | Superficie helper memory-lancedb inclusa |
  </Accordion>

  <Accordion title="Sottopercorsi helper inclusi riservati">
    | Famiglia | Sottopercorsi attuali | Uso previsto |
    | --- | --- | --- |
    | Browser | `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support` | Helper di supporto del plugin browser incluso (`browser-support` resta il barrel di compatibilità) |
    | Matrix | `plugin-sdk/matrix`, `plugin-sdk/matrix-helper`, `plugin-sdk/matrix-runtime-heavy`, `plugin-sdk/matrix-runtime-shared`, `plugin-sdk/matrix-runtime-surface`, `plugin-sdk/matrix-surface`, `plugin-sdk/matrix-thread-bindings` | Superficie helper/runtime Matrix inclusa |
    | Line | `plugin-sdk/line`, `plugin-sdk/line-core`, `plugin-sdk/line-runtime`, `plugin-sdk/line-surface` | Superficie helper/runtime LINE inclusa |
    | IRC | `plugin-sdk/irc`, `plugin-sdk/irc-surface` | Superficie helper IRC inclusa |
    | Helper specifici del canale | `plugin-sdk/googlechat`, `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles`, `plugin-sdk/bluebubbles-policy`, `plugin-sdk/mattermost`, `plugin-sdk/mattermost-policy`, `plugin-sdk/feishu-conversation`, `plugin-sdk/msteams`, `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`, `plugin-sdk/twitch` | Seam helper/compatibilità dei canali inclusi |
    | Helper specifici di auth/plugin | `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`, `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/thread-ownership`, `plugin-sdk/voice-call` | Seam helper di funzionalità/plugin inclusi; `plugin-sdk/github-copilot-token` esporta attualmente `DEFAULT_COPILOT_API_BASE_URL`, `deriveCopilotApiBaseUrlFromToken` e `resolveCopilotApiToken` |
  </Accordion>
</AccordionGroup>

## API di registrazione

La callback `register(api)` riceve un oggetto `OpenClawPluginApi` con questi
metodi:

### Registrazione delle capacità

| Metodo                                           | Cosa registra                    |
| ------------------------------------------------ | -------------------------------- |
| `api.registerProvider(...)`                      | Inferenza di testo (LLM)         |
| `api.registerCliBackend(...)`                    | Backend locale di inferenza CLI  |
| `api.registerChannel(...)`                       | Canale di messaggistica          |
| `api.registerSpeechProvider(...)`                | Sintesi text-to-speech / STT     |
| `api.registerRealtimeTranscriptionProvider(...)` | Trascrizione realtime in streaming |
| `api.registerRealtimeVoiceProvider(...)`         | Sessioni vocali realtime duplex  |
| `api.registerMediaUnderstandingProvider(...)`    | Analisi di immagini/audio/video  |
| `api.registerImageGenerationProvider(...)`       | Generazione di immagini          |
| `api.registerMusicGenerationProvider(...)`       | Generazione musicale             |
| `api.registerVideoGenerationProvider(...)`       | Generazione video                |
| `api.registerWebFetchProvider(...)`              | Provider di web fetch / scraping |
| `api.registerWebSearchProvider(...)`             | Ricerca web                      |

### Strumenti e comandi

| Metodo                          | Cosa registra                                |
| ------------------------------- | -------------------------------------------- |
| `api.registerTool(tool, opts?)` | Strumento agente (obbligatorio o `{ optional: true }`) |
| `api.registerCommand(def)`      | Comando personalizzato (aggira l'LLM)        |

### Infrastruttura

| Metodo                                         | Cosa registra                           |
| ---------------------------------------------- | --------------------------------------- |
| `api.registerHook(events, handler, opts?)`     | Hook di evento                          |
| `api.registerHttpRoute(params)`                | Endpoint HTTP del gateway               |
| `api.registerGatewayMethod(name, handler)`     | Metodo RPC del gateway                  |
| `api.registerCli(registrar, opts?)`            | Sottocomando CLI                        |
| `api.registerService(service)`                 | Servizio in background                  |
| `api.registerInteractiveHandler(registration)` | Handler interattivo                     |
| `api.registerMemoryPromptSupplement(builder)`  | Sezione additiva del prompt adiacente alla memoria |
| `api.registerMemoryCorpusSupplement(adapter)`  | Corpus additivo di ricerca/lettura della memoria |

Gli spazi dei nomi admin core riservati (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) restano sempre `operator.admin`, anche se un plugin prova ad assegnare un
ambito più ristretto al metodo gateway. Preferisci prefissi specifici del plugin per
i metodi di proprietà del plugin.

### Metadati di registrazione CLI

`api.registerCli(registrar, opts?)` accetta due tipi di metadati di primo livello:

- `commands`: radici di comando esplicite possedute dal registrar
- `descriptors`: descrittori di comandi in fase di parsing usati per l'help della CLI root,
  il routing e la registrazione lazy della CLI del plugin

Se vuoi che un comando plugin resti caricato lazy nel normale percorso della CLI root,
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

Usa `commands` da solo solo quando non hai bisogno della registrazione lazy della CLI root.
Quel percorso di compatibilità eager resta supportato, ma non installa
placeholder supportati da descrittori per il caricamento lazy in fase di parsing.

### Registrazione del backend CLI

`api.registerCliBackend(...)` consente a un plugin di possedere la config predefinita per un
backend CLI AI locale come `codex-cli`.

- L'`id` del backend diventa il prefisso provider nei riferimenti modello come `codex-cli/gpt-5`.
- La `config` del backend usa la stessa forma di `agents.defaults.cliBackends.<id>`.
- La config utente continua ad avere la precedenza. OpenClaw unisce `agents.defaults.cliBackends.<id>` sopra il
  valore predefinito del plugin prima di eseguire la CLI.
- Usa `normalizeConfig` quando un backend ha bisogno di riscritture di compatibilità dopo l'unione
  (ad esempio normalizzando vecchie forme di flag).

### Slot esclusivi

| Metodo                                     | Cosa registra                          |
| ------------------------------------------ | -------------------------------------- |
| `api.registerContextEngine(id, factory)`   | Motore di contesto (uno attivo alla volta) |
| `api.registerMemoryCapability(capability)` | Capacità di memoria unificata          |
| `api.registerMemoryPromptSection(builder)` | Builder di sezione del prompt memoria  |
| `api.registerMemoryFlushPlan(resolver)`    | Risolutore del piano di flush memoria  |
| `api.registerMemoryRuntime(runtime)`       | Adapter runtime della memoria          |

### Adapter di embedding della memoria

| Metodo                                         | Cosa registra                                      |
| ---------------------------------------------- | -------------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | Adapter di embedding della memoria per il plugin attivo |

- `registerMemoryCapability` è l'API esclusiva preferita per i plugin memoria.
- `registerMemoryCapability` può anche esporre `publicArtifacts.listArtifacts(...)`
  così i plugin companion possono consumare artefatti di memoria esportati tramite
  `openclaw/plugin-sdk/memory-host-core` invece di accedere al layout privato di uno
  specifico plugin memoria.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan` e
  `registerMemoryRuntime` sono API esclusive legacy-compatibili per plugin memoria.
- `registerMemoryEmbeddingProvider` consente al plugin memoria attivo di registrare uno
  o più ID adapter di embedding (ad esempio `openai`, `gemini` o un ID definito da un plugin personalizzato).
- La config utente come `agents.defaults.memorySearch.provider` e
  `agents.defaults.memorySearch.fallback` viene risolta rispetto a quegli ID adapter registrati.

### Eventi e ciclo di vita

| Metodo                                       | Cosa fa                     |
| -------------------------------------------- | --------------------------- |
| `api.on(hookName, handler, opts?)`           | Hook di ciclo di vita tipizzato |
| `api.onConversationBindingResolved(handler)` | Callback di binding della conversazione |

### Semantica delle decisioni degli hook

- `before_tool_call`: restituire `{ block: true }` è terminale. Una volta che un handler lo imposta, gli handler con priorità inferiore vengono saltati.
- `before_tool_call`: restituire `{ block: false }` viene trattato come nessuna decisione (come omettere `block`), non come una sostituzione.
- `before_install`: restituire `{ block: true }` è terminale. Una volta che un handler lo imposta, gli handler con priorità inferiore vengono saltati.
- `before_install`: restituire `{ block: false }` viene trattato come nessuna decisione (come omettere `block`), non come una sostituzione.
- `reply_dispatch`: restituire `{ handled: true, ... }` è terminale. Una volta che un handler rivendica il dispatch, gli handler con priorità inferiore e il percorso predefinito di dispatch del modello vengono saltati.
- `message_sending`: restituire `{ cancel: true }` è terminale. Una volta che un handler lo imposta, gli handler con priorità inferiore vengono saltati.
- `message_sending`: restituire `{ cancel: false }` viene trattato come nessuna decisione (come omettere `cancel`), non come una sostituzione.

### Campi dell'oggetto API

| Campo                    | Tipo                      | Descrizione                                                                                  |
| ------------------------ | ------------------------- | -------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | ID del plugin                                                                                |
| `api.name`               | `string`                  | Nome visualizzato                                                                            |
| `api.version`            | `string?`                 | Versione del plugin (facoltativa)                                                            |
| `api.description`        | `string?`                 | Descrizione del plugin (facoltativa)                                                         |
| `api.source`             | `string`                  | Percorso sorgente del plugin                                                                 |
| `api.rootDir`            | `string?`                 | Directory root del plugin (facoltativa)                                                      |
| `api.config`             | `OpenClawConfig`          | Snapshot della config corrente (snapshot runtime attivo in memoria quando disponibile)       |
| `api.pluginConfig`       | `Record<string, unknown>` | Config specifica del plugin da `plugins.entries.<id>.config`                                 |
| `api.runtime`            | `PluginRuntime`           | [Helper di runtime](/it/plugins/sdk-runtime)                                                    |
| `api.logger`             | `PluginLogger`            | Logger con ambito (`debug`, `info`, `warn`, `error`)                                         |
| `api.registrationMode`   | `PluginRegistrationMode`  | Modalità di caricamento corrente; `"setup-runtime"` è la finestra leggera di startup/setup prima dell'ingresso completo |
| `api.resolvePath(input)` | `(string) => string`      | Risolve il percorso relativo alla root del plugin                                            |

## Convenzione dei moduli interni

All'interno del tuo plugin, usa file barrel locali per le importazioni interne:

```
my-plugin/
  api.ts            # Esportazioni pubbliche per consumatori esterni
  runtime-api.ts    # Esportazioni runtime solo interne
  index.ts          # Punto di ingresso del plugin
  setup-entry.ts    # Ingresso leggero solo setup (facoltativo)
```

<Warning>
  Non importare mai il tuo stesso plugin tramite `openclaw/plugin-sdk/<your-plugin>`
  dal codice di produzione. Instrada le importazioni interne tramite `./api.ts` o
  `./runtime-api.ts`. Il percorso SDK è solo il contratto esterno.
</Warning>

Le superfici pubbliche dei plugin inclusi caricate tramite facade (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` e file di ingresso pubblici simili) ora preferiscono lo
snapshot della config runtime attiva quando OpenClaw è già in esecuzione. Se non esiste ancora
alcuno snapshot runtime, ricadono sulla config risolta su disco.

I plugin provider possono anche esporre un barrel contrattuale ristretto locale al plugin quando un
helper è intenzionalmente specifico del provider e non appartiene ancora a un sottopercorso SDK generico.
Esempio incluso attuale: il provider Anthropic mantiene i suoi helper di stream Claude
nel proprio seam pubblico `api.ts` / `contract-api.ts` invece di
promuovere la logica Anthropic di header beta e `service_tier` in un contratto generico
`plugin-sdk/*`.

Altri esempi inclusi attuali:

- `@openclaw/openai-provider`: `api.ts` esporta builder di provider,
  helper del modello predefinito e builder di provider realtime
- `@openclaw/openrouter-provider`: `api.ts` esporta il builder del provider più
  helper di onboarding/config

<Warning>
  Il codice di produzione delle estensioni dovrebbe anche evitare importazioni da `openclaw/plugin-sdk/<other-plugin>`.
  Se un helper è davvero condiviso, promuovilo a un sottopercorso SDK neutrale
  come `openclaw/plugin-sdk/speech`, `.../provider-model-shared` o a un'altra
  superficie orientata alla capacità invece di accoppiare due plugin tra loro.
</Warning>

## Correlati

- [Punti di ingresso](/it/plugins/sdk-entrypoints) — opzioni di `definePluginEntry` e `defineChannelPluginEntry`
- [Helper di runtime](/it/plugins/sdk-runtime) — riferimento completo dello spazio dei nomi `api.runtime`
- [Setup e config](/it/plugins/sdk-setup) — packaging, manifest, schemi di configurazione
- [Testing](/it/plugins/sdk-testing) — utilità di test e regole lint
- [Migrazione SDK](/it/plugins/sdk-migration) — migrazione dalle superfici deprecate
- [Interni dei plugin](/it/plugins/architecture) — architettura approfondita e modello di capacità
