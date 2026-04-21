---
read_when:
    - Devi sapere da quale sottopercorso SDK importare
    - Vuoi un riferimento per tutti i metodi di registrazione su OpenClawPluginApi
    - Stai cercando uno specifico export dell'SDK
sidebarTitle: SDK Overview
summary: Mappa degli import, riferimento API di registrazione e architettura SDK
title: Panoramica del Plugin SDK
x-i18n:
    generated_at: "2026-04-21T08:26:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4561c074bb45529cd94d9d23ce7820b668cbc4ff6317230fdd5a5f27c5f14c67
    source_path: plugins/sdk-overview.md
    workflow: 15
---

# Panoramica del Plugin SDK

Il Plugin SDK è il contratto tipizzato tra i plugin e il core. Questa pagina è il
riferimento per **cosa importare** e **cosa puoi registrare**.

<Tip>
  **Cerchi una guida pratica?**
  - Primo plugin? Inizia da [Getting Started](/it/plugins/building-plugins)
  - Plugin di canale? Vedi [Channel Plugins](/it/plugins/sdk-channel-plugins)
  - Plugin provider? Vedi [Provider Plugins](/it/plugins/sdk-provider-plugins)
</Tip>

## Convenzione di import

Importa sempre da un sottopercorso specifico:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Ogni sottopercorso è un modulo piccolo e autosufficiente. Questo mantiene rapido l'avvio e
previene problemi di dipendenze circolari. Per helper di entry/build specifici del canale,
preferisci `openclaw/plugin-sdk/channel-core`; riserva `openclaw/plugin-sdk/core` per
la superficie ombrello più ampia e gli helper condivisi come
`buildChannelConfigSchema`.

Non aggiungere né dipendere da seam di convenienza con nome del provider come
`openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`,
`openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp`, o
seam helper con branding del canale. I plugin inclusi devono comporre
sottopercorsi SDK generici dentro i propri barrel `api.ts` o `runtime-api.ts`, e il core
deve usare quei barrel locali al plugin oppure aggiungere un contratto SDK generico e ristretto
quando l'esigenza è davvero cross-channel.

La mappa degli export generata contiene ancora un piccolo insieme di seam helper per plugin inclusi
come `plugin-sdk/feishu`, `plugin-sdk/feishu-setup`,
`plugin-sdk/zalo`, `plugin-sdk/zalo-setup` e `plugin-sdk/matrix*`. Quei
sottopercorsi esistono solo per manutenzione e compatibilità dei plugin inclusi; sono
intenzionalmente omessi dalla tabella comune sotto e non sono il percorso di import consigliato
per nuovi plugin di terze parti.

## Riferimento dei sottopercorsi

I sottopercorsi più usati, raggruppati per scopo. L'elenco completo generato di
oltre 200 sottopercorsi si trova in `scripts/lib/plugin-sdk-entrypoints.json`.

I sottopercorsi helper riservati ai plugin inclusi compaiono comunque in quell'elenco generato.
Trattali come superfici di dettaglio implementativo/compatibilità salvo che una pagina della documentazione
non ne promuova esplicitamente uno come pubblico.

### Entry del plugin

| Sottopercorso              | Export chiave                                                                                                                           |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`   | `definePluginEntry`                                                                                                                    |
| `plugin-sdk/core`           | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema` |
| `plugin-sdk/config-schema`  | `OpenClawSchema`                                                                                                                       |
| `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry`                                                                                                      |

<AccordionGroup>
  <Accordion title="Sottopercorsi canale">
    | Sottopercorso | Export chiave |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Export dello schema Zod root `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, più `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Helper condivisi per la procedura guidata di setup, prompt allowlist, builder di stato setup |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Helper per configurazione multi-account/action-gate, helper di fallback account predefinito |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, helper di normalizzazione account-id |
    | `plugin-sdk/account-resolution` | Helper di lookup account + fallback predefinito |
    | `plugin-sdk/account-helpers` | Helper ristretti per elenco account/azioni account |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter` |
    | `plugin-sdk/channel-config-schema` | Tipi di schema configurazione canale |
    | `plugin-sdk/telegram-command-config` | Helper di normalizzazione/validazione comandi personalizzati Telegram con fallback del contratto incluso |
    | `plugin-sdk/command-gating` | Helper ristretti per gate di autorizzazione dei comandi |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink` |
    | `plugin-sdk/inbound-envelope` | Helper condivisi per route inbound + builder di envelope |
    | `plugin-sdk/inbound-reply-dispatch` | Helper condivisi per record-and-dispatch inbound |
    | `plugin-sdk/messaging-targets` | Helper per parsing/matching dei target |
    | `plugin-sdk/outbound-media` | Helper condivisi di caricamento media outbound |
    | `plugin-sdk/outbound-runtime` | Helper di identità outbound, send delegate e pianificazione payload |
    | `plugin-sdk/poll-runtime` | Helper ristretti di normalizzazione poll |
    | `plugin-sdk/thread-bindings-runtime` | Helper di lifecycle e adapter per thread-binding |
    | `plugin-sdk/agent-media-payload` | Builder legacy del payload media dell'agente |
    | `plugin-sdk/conversation-runtime` | Helper per binding conversazione/thread, pairing e binding configurati |
    | `plugin-sdk/runtime-config-snapshot` | Helper snapshot della configurazione runtime |
    | `plugin-sdk/runtime-group-policy` | Helper di risoluzione della group-policy runtime |
    | `plugin-sdk/channel-status` | Helper condivisi per snapshot/riepilogo dello stato del canale |
    | `plugin-sdk/channel-config-primitives` | Primitive ristrette dello schema di configurazione del canale |
    | `plugin-sdk/channel-config-writes` | Helper di autorizzazione per scrittura della configurazione del canale |
    | `plugin-sdk/channel-plugin-common` | Export prelude condivisi del plugin canale |
    | `plugin-sdk/allowlist-config-edit` | Helper di lettura/modifica configurazione allowlist |
    | `plugin-sdk/group-access` | Helper condivisi per decisioni di accesso ai gruppi |
    | `plugin-sdk/direct-dm` | Helper condivisi di autenticazione/guard per DM diretti |
    | `plugin-sdk/interactive-runtime` | Helper di normalizzazione/riduzione del payload di risposta interattiva |
    | `plugin-sdk/channel-inbound` | Barrel di compatibilità per debounce inbound, matching mention, helper di mention-policy e helper di envelope |
    | `plugin-sdk/channel-mention-gating` | Helper ristretti di mention-policy senza la più ampia superficie runtime inbound |
    | `plugin-sdk/channel-location` | Helper di contesto e formattazione della posizione del canale |
    | `plugin-sdk/channel-logging` | Helper di logging del canale per drop inbound e guasti typing/ack |
    | `plugin-sdk/channel-send-result` | Tipi di risultato della risposta |
    | `plugin-sdk/channel-actions` | `createMessageToolButtonsSchema`, `createMessageToolCardSchema` |
    | `plugin-sdk/channel-targets` | Helper per parsing/matching dei target |
    | `plugin-sdk/channel-contract` | Tipi del contratto canale |
    | `plugin-sdk/channel-feedback` | Wiring di feedback/reazioni |
    | `plugin-sdk/channel-secret-runtime` | Helper ristretti del contratto segreti come `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment` e tipi target dei segreti |
  </Accordion>

  <Accordion title="Sottopercorsi provider">
    | Sottopercorso | Export chiave |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/provider-setup` | Helper curati per setup provider locale/self-hosted |
    | `plugin-sdk/self-hosted-provider-setup` | Helper mirati per setup provider self-hosted compatibile OpenAI |
    | `plugin-sdk/cli-backend` | Valori predefiniti backend CLI + costanti watchdog |
    | `plugin-sdk/provider-auth-runtime` | Helper runtime per risoluzione API key per plugin provider |
    | `plugin-sdk/provider-auth-api-key` | Helper di onboarding/scrittura profilo API key come `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Builder standard del risultato auth OAuth |
    | `plugin-sdk/provider-auth-login` | Helper condivisi di login interattivo per plugin provider |
    | `plugin-sdk/provider-env-vars` | Helper di lookup delle env var auth del provider |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, builder condivisi di replay-policy, helper endpoint provider e helper di normalizzazione model-id come `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Helper generici per capacità HTTP/endpoint del provider |
    | `plugin-sdk/provider-web-fetch-contract` | Helper ristretti del contratto di configurazione/selezione web-fetch come `enablePluginInConfig` e `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Helper di registrazione/cache del provider web-fetch |
    | `plugin-sdk/provider-web-search-config-contract` | Helper ristretti di configurazione/credenziali web-search per provider che non richiedono wiring di abilitazione plugin |
    | `plugin-sdk/provider-web-search-contract` | Helper ristretti del contratto di configurazione/credenziali web-search come `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` e setter/getter di credenziali con scope |
    | `plugin-sdk/provider-web-search` | Helper di registrazione/cache/runtime del provider web-search |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, cleanup + diagnostica degli schema Gemini e helper compat xAI come `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` e simili |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, tipi dei wrapper stream e helper wrapper condivisi Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-transport-runtime` | Helper di trasporto provider nativo come fetch protetto, trasformazioni dei messaggi di trasporto e stream di eventi di trasporto scrivibili |
    | `plugin-sdk/provider-onboard` | Helper di patch configurazione per onboarding |
    | `plugin-sdk/global-singleton` | Helper singleton/map/cache locali al processo |
  </Accordion>

  <Accordion title="Sottopercorsi di autenticazione e sicurezza">
    | Sottopercorso | Export chiave |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, helper del registro comandi, helper di autorizzazione del mittente |
    | `plugin-sdk/command-status` | Builder di messaggi comando/help come `buildCommandsMessagePaginated` e `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Helper di risoluzione dell'approvatore e di autenticazione delle azioni nella stessa chat |
    | `plugin-sdk/approval-client-runtime` | Helper di profilo/filtro delle approvazioni exec native |
    | `plugin-sdk/approval-delivery-runtime` | Adapter di capability/consegna delle approvazioni native |
    | `plugin-sdk/approval-gateway-runtime` | Helper condiviso di risoluzione del gateway di approvazione |
    | `plugin-sdk/approval-handler-adapter-runtime` | Helper leggeri di caricamento dell'adapter di approvazione nativa per entrypoint hot dei canali |
    | `plugin-sdk/approval-handler-runtime` | Helper runtime più ampi per il gestore delle approvazioni; preferisci i seam adapter/gateway più ristretti quando bastano |
    | `plugin-sdk/approval-native-runtime` | Helper per target di approvazione nativa + binding dell'account |
    | `plugin-sdk/approval-reply-runtime` | Helper del payload di risposta per approvazioni exec/plugin |
    | `plugin-sdk/command-auth-native` | Helper di autenticazione comandi nativi + helper nativi per target di sessione |
    | `plugin-sdk/command-detection` | Helper condivisi di rilevamento dei comandi |
    | `plugin-sdk/command-surface` | Helper di normalizzazione del corpo comando e della superficie dei comandi |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Helper ristretti di raccolta del contratto dei segreti per superfici di segreti di canale/plugin |
    | `plugin-sdk/secret-ref-runtime` | Helper ristretti `coerceSecretRef` e di tipizzazione SecretRef per parsing di contratto dei segreti/configurazione |
    | `plugin-sdk/security-runtime` | Helper condivisi per trust, gating DM, contenuti esterni e raccolta dei segreti |
    | `plugin-sdk/ssrf-policy` | Helper di allowlist host e policy SSRF di rete privata |
    | `plugin-sdk/ssrf-dispatcher` | Helper ristretti di pinned-dispatcher senza l'ampia superficie runtime dell'infrastruttura |
    | `plugin-sdk/ssrf-runtime` | Helper per pinned-dispatcher, fetch protetto da SSRF e policy SSRF |
    | `plugin-sdk/secret-input` | Helper di parsing dell'input segreto |
    | `plugin-sdk/webhook-ingress` | Helper per richiesta/target Webhook |
    | `plugin-sdk/webhook-request-guards` | Helper per dimensione del body richiesta/timeout |
  </Accordion>

  <Accordion title="Sottopercorsi runtime e storage">
    | Sottopercorso | Export chiave |
    | --- | --- |
    | `plugin-sdk/runtime` | Ampi helper per runtime/logging/backup/installazione plugin |
    | `plugin-sdk/runtime-env` | Helper ristretti per env runtime, logger, timeout, retry e backoff |
    | `plugin-sdk/channel-runtime-context` | Helper generici di registrazione e lookup del contesto runtime del canale |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Helper condivisi per comandi/hook/http/interactive dei plugin |
    | `plugin-sdk/hook-runtime` | Helper condivisi per pipeline webhook/hook interni |
    | `plugin-sdk/lazy-runtime` | Helper di import/binding runtime lazy come `createLazyRuntimeModule`, `createLazyRuntimeMethod` e `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Helper exec di processo |
    | `plugin-sdk/cli-runtime` | Helper CLI per formattazione, attesa e versione |
    | `plugin-sdk/gateway-runtime` | Helper client Gateway e patch dello stato del canale |
    | `plugin-sdk/config-runtime` | Helper di caricamento/scrittura della configurazione |
    | `plugin-sdk/telegram-command-config` | Normalizzazione di nome/descrizione dei comandi Telegram e controlli su duplicati/conflitti, anche quando la superficie del contratto Telegram incluso non è disponibile |
    | `plugin-sdk/text-autolink-runtime` | Rilevamento autolink dei riferimenti a file senza l'ampio barrel text-runtime |
    | `plugin-sdk/approval-runtime` | Helper per approvazioni exec/plugin, builder di capability di approvazione, helper auth/profilo, helper di routing/runtime nativo |
    | `plugin-sdk/reply-runtime` | Helper condivisi di runtime inbound/reply, chunking, dispatch, Heartbeat, pianificatore di risposta |
    | `plugin-sdk/reply-dispatch-runtime` | Helper ristretti di dispatch/finalizzazione della risposta |
    | `plugin-sdk/reply-history` | Helper condivisi per cronologia risposte a finestra breve come `buildHistoryContext`, `recordPendingHistoryEntry` e `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Helper ristretti di chunking testo/markdown |
    | `plugin-sdk/session-store-runtime` | Helper di percorso session store + updated-at |
    | `plugin-sdk/state-paths` | Helper di percorso per directory state/OAuth |
    | `plugin-sdk/routing` | Helper per route/session-key/binding dell'account come `resolveAgentRoute`, `buildAgentSessionKey` e `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Helper condivisi per riepilogo stato canale/account, valori predefiniti dello stato runtime e helper di metadati dei problemi |
    | `plugin-sdk/target-resolver-runtime` | Helper condivisi del resolver dei target |
    | `plugin-sdk/string-normalization-runtime` | Helper di normalizzazione slug/string |
    | `plugin-sdk/request-url` | Estrae URL stringa da input tipo fetch/request |
    | `plugin-sdk/run-command` | Runner di comandi con timeout e risultati stdout/stderr normalizzati |
    | `plugin-sdk/param-readers` | Lettori comuni di parametri tool/CLI |
    | `plugin-sdk/tool-payload` | Estrae payload normalizzati da oggetti risultato degli strumenti |
    | `plugin-sdk/tool-send` | Estrae campi target di invio canonici dagli argomenti degli strumenti |
    | `plugin-sdk/temp-path` | Helper condivisi per percorso di download temporaneo |
    | `plugin-sdk/logging-core` | Helper di logger del sottosistema e redazione |
    | `plugin-sdk/markdown-table-runtime` | Helper di modalità tabella Markdown |
    | `plugin-sdk/json-store` | Piccoli helper di lettura/scrittura dello stato JSON |
    | `plugin-sdk/file-lock` | Helper di file-lock rientrante |
    | `plugin-sdk/persistent-dedupe` | Helper di cache dedupe persistente su disco |
    | `plugin-sdk/acp-runtime` | Helper runtime/sessione ACP e reply-dispatch |
    | `plugin-sdk/acp-binding-resolve-runtime` | Risoluzione in sola lettura del binding ACP senza import di avvio del lifecycle |
    | `plugin-sdk/agent-config-primitives` | Primitive ristrette dello schema di configurazione runtime dell'agente |
    | `plugin-sdk/boolean-param` | Lettore permissivo di parametri booleani |
    | `plugin-sdk/dangerous-name-runtime` | Helper di risoluzione del matching dei nomi pericolosi |
    | `plugin-sdk/device-bootstrap` | Helper di bootstrap del dispositivo e token di pairing |
    | `plugin-sdk/extension-shared` | Primitive helper condivise per canale passivo, stato e proxy ambient |
    | `plugin-sdk/models-provider-runtime` | Helper di risposta del comando `/models`/provider |
    | `plugin-sdk/skill-commands-runtime` | Helper di elenco dei comandi Skills |
    | `plugin-sdk/native-command-registry` | Helper di registro/build/serializzazione dei comandi nativi |
    | `plugin-sdk/agent-harness` | Superficie sperimentale per plugin trusted per harness agente di basso livello: tipi harness, helper di steering/abort dell'esecuzione attiva, helper bridge degli strumenti OpenClaw e utility per il risultato dei tentativi |
    | `plugin-sdk/provider-zai-endpoint` | Helper di rilevamento endpoint Z.AI |
    | `plugin-sdk/infra-runtime` | Helper di eventi di sistema/Heartbeat |
    | `plugin-sdk/collection-runtime` | Piccoli helper di cache limitata |
    | `plugin-sdk/diagnostic-runtime` | Helper di flag ed eventi diagnostici |
    | `plugin-sdk/error-runtime` | Helper per grafo degli errori, formattazione, classificazione condivisa degli errori, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Helper per fetch wrappato, proxy e lookup pinned |
    | `plugin-sdk/runtime-fetch` | Fetch runtime consapevole del dispatcher senza import di proxy/fetch protetto |
    | `plugin-sdk/response-limit-runtime` | Lettore limitato del body della risposta senza l'ampia superficie runtime dei media |
    | `plugin-sdk/session-binding-runtime` | Stato corrente del binding della conversazione senza routing del binding configurato o store di pairing |
    | `plugin-sdk/session-store-runtime` | Helper di lettura del session-store senza import ampi di scritture/manutenzione della configurazione |
    | `plugin-sdk/context-visibility-runtime` | Risoluzione della visibilità del contesto e filtro del contesto supplementare senza import ampi di configurazione/sicurezza |
    | `plugin-sdk/string-coerce-runtime` | Helper ristretti per coercizione e normalizzazione di record/string primitive senza import di markdown/logging |
    | `plugin-sdk/host-runtime` | Helper di normalizzazione hostname e host SCP |
    | `plugin-sdk/retry-runtime` | Helper di configurazione retry e runner di retry |
    | `plugin-sdk/agent-runtime` | Helper di directory/identità/workspace dell'agente |
    | `plugin-sdk/directory-runtime` | Query/dedup di directory supportata da configurazione |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Sottopercorsi di capability e testing">
    | Sottopercorso | Export chiave |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Helper condivisi per fetch/transform/store dei media più builder del payload media |
    | `plugin-sdk/media-generation-runtime` | Helper condivisi per failover della generazione media, selezione dei candidati e messaggistica per modello mancante |
    | `plugin-sdk/media-understanding` | Tipi provider per comprensione dei media più export helper lato provider per immagini/audio |
    | `plugin-sdk/text-runtime` | Helper condivisi per testo/markdown/logging come rimozione del testo visibile all'assistente, helper di render/chunking/tabella markdown, helper di redazione, helper di directive-tag e utility di testo sicuro |
    | `plugin-sdk/text-chunking` | Helper di chunking del testo in uscita |
    | `plugin-sdk/speech` | Tipi provider speech più helper lato provider per directive, registry e validazione |
    | `plugin-sdk/speech-core` | Tipi condivisi provider speech, helper per registry, directive e normalizzazione |
    | `plugin-sdk/realtime-transcription` | Tipi provider per trascrizione realtime e helper di registry |
    | `plugin-sdk/realtime-voice` | Tipi provider per voce realtime e helper di registry |
    | `plugin-sdk/image-generation` | Tipi provider per generazione immagini |
    | `plugin-sdk/image-generation-core` | Tipi condivisi per generazione immagini, helper di failover, auth e registry |
    | `plugin-sdk/music-generation` | Tipi provider/request/result per generazione musicale |
    | `plugin-sdk/music-generation-core` | Tipi condivisi per generazione musicale, helper di failover, lookup del provider e parsing del model-ref |
    | `plugin-sdk/video-generation` | Tipi provider/request/result per generazione video |
    | `plugin-sdk/video-generation-core` | Tipi condivisi per generazione video, helper di failover, lookup del provider e parsing del model-ref |
    | `plugin-sdk/webhook-targets` | Helper di registry dei target Webhook e installazione route |
    | `plugin-sdk/webhook-path` | Helper di normalizzazione del percorso Webhook |
    | `plugin-sdk/web-media` | Helper condivisi per caricamento media remoto/locale |
    | `plugin-sdk/zod` | `zod` riesportato per i consumer del plugin SDK |
    | `plugin-sdk/testing` | `installCommonResolveTargetErrorCases`, `shouldAckReaction` |
  </Accordion>

  <Accordion title="Sottopercorsi Memory">
    | Sottopercorso | Export chiave |
    | --- | --- |
    | `plugin-sdk/memory-core` | Superficie helper `memory-core` inclusa per helper manager/config/file/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | Facciata runtime dell'indice/ricerca Memory |
    | `plugin-sdk/memory-core-host-engine-foundation` | Export del motore foundation host di Memory |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Contratti embedding host di Memory, accesso al registry, provider locale e helper generici batch/remoti |
    | `plugin-sdk/memory-core-host-engine-qmd` | Export del motore QMD host di Memory |
    | `plugin-sdk/memory-core-host-engine-storage` | Export del motore storage host di Memory |
    | `plugin-sdk/memory-core-host-multimodal` | Helper multimodali host di Memory |
    | `plugin-sdk/memory-core-host-query` | Helper query host di Memory |
    | `plugin-sdk/memory-core-host-secret` | Helper segreti host di Memory |
    | `plugin-sdk/memory-core-host-events` | Helper del journal eventi host di Memory |
    | `plugin-sdk/memory-core-host-status` | Helper di stato host di Memory |
    | `plugin-sdk/memory-core-host-runtime-cli` | Helper runtime CLI host di Memory |
    | `plugin-sdk/memory-core-host-runtime-core` | Helper runtime core host di Memory |
    | `plugin-sdk/memory-core-host-runtime-files` | Helper file/runtime host di Memory |
    | `plugin-sdk/memory-host-core` | Alias neutrale rispetto al vendor per helper runtime core host di Memory |
    | `plugin-sdk/memory-host-events` | Alias neutrale rispetto al vendor per helper del journal eventi host di Memory |
    | `plugin-sdk/memory-host-files` | Alias neutrale rispetto al vendor per helper file/runtime host di Memory |
    | `plugin-sdk/memory-host-markdown` | Helper condivisi di markdown gestito per plugin adiacenti a Memory |
    | `plugin-sdk/memory-host-search` | Facciata runtime di Active Memory per accesso al search-manager |
    | `plugin-sdk/memory-host-status` | Alias neutrale rispetto al vendor per helper di stato host di Memory |
    | `plugin-sdk/memory-lancedb` | Superficie helper `memory-lancedb` inclusa |
  </Accordion>

  <Accordion title="Sottopercorsi helper inclusi riservati">
    | Famiglia | Sottopercorsi correnti | Uso previsto |
    | --- | --- | --- |
    | Browser | `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support` | Helper di supporto del plugin browser incluso (`browser-support` resta il barrel di compatibilità) |
    | Matrix | `plugin-sdk/matrix`, `plugin-sdk/matrix-helper`, `plugin-sdk/matrix-runtime-heavy`, `plugin-sdk/matrix-runtime-shared`, `plugin-sdk/matrix-runtime-surface`, `plugin-sdk/matrix-surface`, `plugin-sdk/matrix-thread-bindings` | Superficie helper/runtime Matrix inclusa |
    | Line | `plugin-sdk/line`, `plugin-sdk/line-core`, `plugin-sdk/line-runtime`, `plugin-sdk/line-surface` | Superficie helper/runtime LINE inclusa |
    | IRC | `plugin-sdk/irc`, `plugin-sdk/irc-surface` | Superficie helper IRC inclusa |
    | Helper specifici del canale | `plugin-sdk/googlechat`, `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles`, `plugin-sdk/bluebubbles-policy`, `plugin-sdk/mattermost`, `plugin-sdk/mattermost-policy`, `plugin-sdk/feishu-conversation`, `plugin-sdk/msteams`, `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`, `plugin-sdk/twitch` | Seam di compatibilità/helper dei canali inclusi |
    | Helper specifici di auth/plugin | `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`, `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/thread-ownership`, `plugin-sdk/voice-call` | Seam helper di funzionalità/plugin inclusi; `plugin-sdk/github-copilot-token` attualmente esporta `DEFAULT_COPILOT_API_BASE_URL`, `deriveCopilotApiBaseUrlFromToken` e `resolveCopilotApiToken` |
  </Accordion>
</AccordionGroup>

## API di registrazione

La callback `register(api)` riceve un oggetto `OpenClawPluginApi` con questi
metodi:

### Registrazione delle capability

| Metodo                                           | Cosa registra                         |
| ------------------------------------------------ | ------------------------------------- |
| `api.registerProvider(...)`                      | Inferenza testuale (LLM)              |
| `api.registerAgentHarness(...)`                  | Esecutore agente di basso livello sperimentale |
| `api.registerCliBackend(...)`                    | Backend CLI locale per inferenza      |
| `api.registerChannel(...)`                       | Canale di messaggistica               |
| `api.registerSpeechProvider(...)`                | Sintesi text-to-speech / STT          |
| `api.registerRealtimeTranscriptionProvider(...)` | Trascrizione realtime in streaming    |
| `api.registerRealtimeVoiceProvider(...)`         | Sessioni vocali realtime duplex       |
| `api.registerMediaUnderstandingProvider(...)`    | Analisi di immagini/audio/video       |
| `api.registerImageGenerationProvider(...)`       | Generazione immagini                  |
| `api.registerMusicGenerationProvider(...)`       | Generazione musicale                  |
| `api.registerVideoGenerationProvider(...)`       | Generazione video                     |
| `api.registerWebFetchProvider(...)`              | Provider per web fetch / scraping     |
| `api.registerWebSearchProvider(...)`             | Ricerca web                           |

### Strumenti e comandi

| Metodo                          | Cosa registra                                  |
| ------------------------------- | ---------------------------------------------- |
| `api.registerTool(tool, opts?)` | Strumento agente (obbligatorio o `{ optional: true }`) |
| `api.registerCommand(def)`      | Comando personalizzato (aggira l'LLM)          |

### Infrastruttura

| Metodo                                         | Cosa registra                         |
| ---------------------------------------------- | ------------------------------------- |
| `api.registerHook(events, handler, opts?)`     | Hook di evento                        |
| `api.registerHttpRoute(params)`                | Endpoint HTTP del Gateway             |
| `api.registerGatewayMethod(name, handler)`     | Metodo RPC del Gateway                |
| `api.registerCli(registrar, opts?)`            | Sottocomando CLI                      |
| `api.registerService(service)`                 | Servizio in background                |
| `api.registerInteractiveHandler(registration)` | Gestore interattivo                   |
| `api.registerMemoryPromptSupplement(builder)`  | Sezione aggiuntiva del prompt adiacente a Memory |
| `api.registerMemoryCorpusSupplement(adapter)`  | Corpus aggiuntivo per ricerca/lettura Memory |

I namespace amministrativi core riservati (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) restano sempre `operator.admin`, anche se un plugin prova ad assegnare
uno scope di metodo gateway più ristretto. Preferisci prefissi specifici del plugin per
i metodi di proprietà del plugin.

### Metadati di registrazione CLI

`api.registerCli(registrar, opts?)` accetta due tipi di metadati di primo livello:

- `commands`: root di comando esplicite di proprietà del registrar
- `descriptors`: descrittori di comando in fase di parsing usati per help della CLI root,
  instradamento e registrazione lazy della CLI del plugin

Se vuoi che un comando plugin resti lazy-loaded nel normale percorso CLI root,
fornisci `descriptors` che coprano ogni root di comando di primo livello esposta da quel
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
        description: "Gestisci account Matrix, verifica, dispositivi e stato del profilo",
        hasSubcommands: true,
      },
    ],
  },
);
```

Usa `commands` da solo solo quando non ti serve la registrazione lazy della CLI root.
Questo percorso di compatibilità eager resta supportato, ma non installa
placeholder supportati da descriptor per il lazy loading in fase di parsing.

### Registrazione backend CLI

`api.registerCliBackend(...)` permette a un plugin di possedere la configurazione predefinita di un
backend CLI AI locale come `codex-cli`.

- L'`id` del backend diventa il prefisso provider nei model ref come `codex-cli/gpt-5`.
- La `config` del backend usa la stessa forma di `agents.defaults.cliBackends.<id>`.
- La configurazione utente ha comunque la precedenza. OpenClaw unisce `agents.defaults.cliBackends.<id>` sopra il
  valore predefinito del plugin prima di eseguire la CLI.
- Usa `normalizeConfig` quando un backend richiede riscritture di compatibilità dopo il merge
  (ad esempio normalizzando vecchie forme di flag).

### Slot esclusivi

| Metodo                                     | Cosa registra                                                                                                                                          |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `api.registerContextEngine(id, factory)`   | Motore di contesto (uno attivo alla volta). La callback `assemble()` riceve `availableTools` e `citationsMode` così il motore può adattare le aggiunte al prompt. |
| `api.registerMemoryCapability(capability)` | Capability Memory unificata                                                                                                                            |
| `api.registerMemoryPromptSection(builder)` | Builder della sezione prompt Memory                                                                                                                    |
| `api.registerMemoryFlushPlan(resolver)`    | Resolver del piano di flush Memory                                                                                                                     |
| `api.registerMemoryRuntime(runtime)`       | Adapter runtime Memory                                                                                                                                 |

### Adapter embedding Memory

| Metodo                                         | Cosa registra                                  |
| ---------------------------------------------- | ---------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | Adapter embedding Memory per il plugin attivo  |

- `registerMemoryCapability` è l'API preferita per plugin Memory esclusivi.
- `registerMemoryCapability` può anche esporre `publicArtifacts.listArtifacts(...)`
  così i plugin companion possono consumare artifact Memory esportati tramite
  `openclaw/plugin-sdk/memory-host-core` invece di entrare nel layout privato di uno
  specifico plugin Memory.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan` e
  `registerMemoryRuntime` sono API legacy-compatibili per plugin Memory esclusivi.
- `registerMemoryEmbeddingProvider` consente al plugin Memory attivo di registrare uno
  o più id di adapter embedding (ad esempio `openai`, `gemini` o un id
  personalizzato definito dal plugin).
- La configurazione utente come `agents.defaults.memorySearch.provider` e
  `agents.defaults.memorySearch.fallback` viene risolta rispetto a quegli id di adapter
  registrati.

### Eventi e lifecycle

| Metodo                                       | Cosa fa                      |
| -------------------------------------------- | ---------------------------- |
| `api.on(hookName, handler, opts?)`           | Hook di lifecycle tipizzato  |
| `api.onConversationBindingResolved(handler)` | Callback di binding della conversazione |

### Semantica delle decisioni degli hook

- `before_tool_call`: restituire `{ block: true }` è terminale. Quando un handler lo imposta, gli handler a priorità inferiore vengono saltati.
- `before_tool_call`: restituire `{ block: false }` viene trattato come nessuna decisione (uguale a omettere `block`), non come override.
- `before_install`: restituire `{ block: true }` è terminale. Quando un handler lo imposta, gli handler a priorità inferiore vengono saltati.
- `before_install`: restituire `{ block: false }` viene trattato come nessuna decisione (uguale a omettere `block`), non come override.
- `reply_dispatch`: restituire `{ handled: true, ... }` è terminale. Quando un handler rivendica il dispatch, gli handler a priorità inferiore e il percorso predefinito di dispatch del modello vengono saltati.
- `message_sending`: restituire `{ cancel: true }` è terminale. Quando un handler lo imposta, gli handler a priorità inferiore vengono saltati.
- `message_sending`: restituire `{ cancel: false }` viene trattato come nessuna decisione (uguale a omettere `cancel`), non come override.

### Campi dell'oggetto API

| Campo                    | Tipo                      | Descrizione                                                                                 |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | ID del plugin                                                                               |
| `api.name`               | `string`                  | Nome visualizzato                                                                           |
| `api.version`            | `string?`                 | Versione del plugin (facoltativa)                                                           |
| `api.description`        | `string?`                 | Descrizione del plugin (facoltativa)                                                        |
| `api.source`             | `string`                  | Percorso sorgente del plugin                                                                |
| `api.rootDir`            | `string?`                 | Directory root del plugin (facoltativa)                                                     |
| `api.config`             | `OpenClawConfig`          | Snapshot della configurazione corrente (snapshot runtime attivo in memoria quando disponibile) |
| `api.pluginConfig`       | `Record<string, unknown>` | Configurazione specifica del plugin da `plugins.entries.<id>.config`                        |
| `api.runtime`            | `PluginRuntime`           | [Helper runtime](/it/plugins/sdk-runtime)                                                      |
| `api.logger`             | `PluginLogger`            | Logger con scope (`debug`, `info`, `warn`, `error`)                                         |
| `api.registrationMode`   | `PluginRegistrationMode`  | Modalità di caricamento corrente; `"setup-runtime"` è la finestra leggera di avvio/setup prima del caricamento completo |
| `api.resolvePath(input)` | `(string) => string`      | Risolve il percorso relativo alla root del plugin                                           |

## Convenzione dei moduli interni

All'interno del tuo plugin, usa file barrel locali per gli import interni:

```
my-plugin/
  api.ts            # Export pubblici per consumer esterni
  runtime-api.ts    # Export runtime solo interni
  index.ts          # Entry point del plugin
  setup-entry.ts    # Entry leggera solo per setup (facoltativa)
```

<Warning>
  Non importare mai il tuo plugin tramite `openclaw/plugin-sdk/<your-plugin>`
  dal codice di produzione. Instrada gli import interni tramite `./api.ts` o
  `./runtime-api.ts`. Il percorso SDK è solo il contratto esterno.
</Warning>

Le superfici pubbliche dei plugin inclusi caricate tramite facade (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` e file entry pubblici simili) ora preferiscono lo
snapshot della configurazione runtime attiva quando OpenClaw è già in esecuzione. Se nessuno snapshot runtime
esiste ancora, fanno fallback alla configurazione risolta su disco.

I plugin provider possono anche esporre un barrel di contratto locale al plugin e ristretto quando un
helper è intenzionalmente specifico del provider e non appartiene ancora a un sottopercorso SDK generico.
Esempio incluso attuale: il provider Anthropic mantiene i propri helper di stream Claude
nel proprio seam pubblico `api.ts` / `contract-api.ts` invece di
promuovere la logica Anthropic beta-header e `service_tier` in un contratto
generico `plugin-sdk/*`.

Altri esempi inclusi attuali:

- `@openclaw/openai-provider`: `api.ts` esporta builder del provider,
  helper dei modelli predefiniti e builder del provider realtime
- `@openclaw/openrouter-provider`: `api.ts` esporta il builder del provider più
  helper di onboarding/configurazione

<Warning>
  Anche il codice di produzione delle estensioni dovrebbe evitare import `openclaw/plugin-sdk/<other-plugin>`.
  Se un helper è davvero condiviso, promuovilo a un sottopercorso SDK neutrale
  come `openclaw/plugin-sdk/speech`, `.../provider-model-shared` o un'altra
  superficie orientata alle capability invece di accoppiare due plugin.
</Warning>

## Correlati

- [Entry Points](/it/plugins/sdk-entrypoints) — opzioni `definePluginEntry` e `defineChannelPluginEntry`
- [Runtime Helpers](/it/plugins/sdk-runtime) — riferimento completo del namespace `api.runtime`
- [Setup and Config](/it/plugins/sdk-setup) — packaging, manifest, schemi di configurazione
- [Testing](/it/plugins/sdk-testing) — utility di test e regole lint
- [SDK Migration](/it/plugins/sdk-migration) — migrazione da superfici deprecate
- [Plugin Internals](/it/plugins/architecture) — architettura approfondita e modello di capability
