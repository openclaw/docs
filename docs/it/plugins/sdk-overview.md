---
read_when:
    - Devi sapere da quale sottopercorso SDK importare
    - Vuoi un riferimento per tutti i metodi di registrazione su OpenClawPluginApi
    - Stai cercando una specifica esportazione dell'SDK
sidebarTitle: SDK Overview
summary: Mappa degli import, riferimento dell'API di registrazione e architettura dell'SDK
title: Panoramica del Plugin SDK
x-i18n:
    generated_at: "2026-04-05T14:01:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0d7d8b6add0623766d36e81588ae783b525357b2f5245c38c8e2b07c5fc1d2b5
    source_path: plugins/sdk-overview.md
    workflow: 15
---

# Panoramica del Plugin SDK

Il Plugin SDK è il contratto tipizzato tra i plugin e il core. Questa pagina è il
riferimento per **cosa importare** e **cosa puoi registrare**.

<Tip>
  **Cerchi una guida pratica?**
  - Primo plugin? Inizia con [Per iniziare](/plugins/building-plugins)
  - Plugin di canale? Vedi [Plugin di canale](/plugins/sdk-channel-plugins)
  - Plugin provider? Vedi [Plugin provider](/plugins/sdk-provider-plugins)
</Tip>

## Convenzione di import

Importa sempre da un sottopercorso specifico:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Ogni sottopercorso è un modulo piccolo e autosufficiente. Questo mantiene rapido
l'avvio e previene problemi di dipendenze circolari. Per gli helper di entry/build specifici dei canali,
preferisci `openclaw/plugin-sdk/channel-core`; mantieni `openclaw/plugin-sdk/core` per
la superficie umbrella più ampia e gli helper condivisi come
`buildChannelConfigSchema`.

Non aggiungere né dipendere da seam di convenienza con nomi di provider come
`openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`,
`openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp` o
seam helper con branding di canale. I plugin inclusi dovrebbero comporre
sottopercorsi SDK generici all'interno dei propri barrel `api.ts` o `runtime-api.ts`, e il core
dovrebbe usare quei barrel locali al plugin oppure aggiungere un contratto SDK generico ristretto
quando la necessità è davvero cross-channel.

La mappa di esportazione generata contiene ancora un piccolo insieme di seam helper
di plugin inclusi come `plugin-sdk/feishu`, `plugin-sdk/feishu-setup`,
`plugin-sdk/zalo`, `plugin-sdk/zalo-setup` e `plugin-sdk/matrix*`. Questi
sottopercorsi esistono solo per la manutenzione e la compatibilità dei plugin inclusi; sono
intenzionalmente omessi dalla tabella comune qui sotto e non sono il percorso di import
consigliato per nuovi plugin di terze parti.

## Riferimento dei sottopercorsi

I sottopercorsi più usati, raggruppati per scopo. L'elenco completo generato di
oltre 200 sottopercorsi si trova in `scripts/lib/plugin-sdk-entrypoints.json`.

I sottopercorsi helper riservati ai plugin inclusi compaiono ancora in quell'elenco generato.
Trattali come superfici di dettaglio implementativo/compatibilità a meno che una pagina della documentazione
non ne promuova esplicitamente una come pubblica.

### Entry del plugin

| Sottopercorso              | Esportazioni chiave                                                                                                                   |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`   | `definePluginEntry`                                                                                                                   |
| `plugin-sdk/core`           | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema` |
| `plugin-sdk/config-schema`  | `OpenClawSchema`                                                                                                                      |
| `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry`                                                                                                     |

<AccordionGroup>
  <Accordion title="Sottopercorsi dei canali">
    | Sottopercorso | Esportazioni chiave |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Esportazione dello schema Zod radice di `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, più `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Helper condivisi per la procedura guidata di setup, prompt allowlist, builder di stato setup |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Helper per configurazione multi-account/action-gate e helper di fallback dell'account predefinito |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, helper di normalizzazione dell'account id |
    | `plugin-sdk/account-resolution` | Helper per ricerca account + fallback predefinito |
    | `plugin-sdk/account-helpers` | Helper ristretti per elenco account/azioni account |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter` |
    | `plugin-sdk/channel-config-schema` | Tipi di schema della configurazione dei canali |
    | `plugin-sdk/telegram-command-config` | Helper di normalizzazione/validazione dei comandi personalizzati Telegram con fallback al contratto incluso |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink` |
    | `plugin-sdk/inbound-envelope` | Helper condivisi per routing inbound + costruzione dell'envelope |
    | `plugin-sdk/inbound-reply-dispatch` | Helper condivisi per registrazione e dispatch inbound |
    | `plugin-sdk/messaging-targets` | Helper per parsing/corrispondenza dei target |
    | `plugin-sdk/outbound-media` | Helper condivisi per caricamento dei media outbound |
    | `plugin-sdk/outbound-runtime` | Helper per identità outbound/delegati di invio |
    | `plugin-sdk/thread-bindings-runtime` | Helper per ciclo di vita e adattatori dei thread binding |
    | `plugin-sdk/agent-media-payload` | Builder legacy del payload media dell'agente |
    | `plugin-sdk/conversation-runtime` | Helper per binding conversazione/thread, pairing e binding configurati |
    | `plugin-sdk/runtime-config-snapshot` | Helper per snapshot della configurazione runtime |
    | `plugin-sdk/runtime-group-policy` | Helper runtime per la risoluzione della group policy |
    | `plugin-sdk/channel-status` | Helper condivisi per snapshot/riepilogo dello stato del canale |
    | `plugin-sdk/channel-config-primitives` | Primitive ristrette dello schema di configurazione dei canali |
    | `plugin-sdk/channel-config-writes` | Helper di autorizzazione per scritture della configurazione dei canali |
    | `plugin-sdk/channel-plugin-common` | Esportazioni di preludio condivise dei plugin di canale |
    | `plugin-sdk/allowlist-config-edit` | Helper per lettura/modifica della configurazione allowlist |
    | `plugin-sdk/group-access` | Helper condivisi per decisioni di accesso ai gruppi |
    | `plugin-sdk/direct-dm` | Helper condivisi per autenticazione/protezioni DM diretti |
    | `plugin-sdk/interactive-runtime` | Helper per normalizzazione/riduzione dei payload di risposta interattiva |
    | `plugin-sdk/channel-inbound` | Helper per debounce, matching delle menzioni ed envelope |
    | `plugin-sdk/channel-send-result` | Tipi del risultato di risposta |
    | `plugin-sdk/channel-actions` | `createMessageToolButtonsSchema`, `createMessageToolCardSchema` |
    | `plugin-sdk/channel-targets` | Helper per parsing/corrispondenza dei target |
    | `plugin-sdk/channel-contract` | Tipi del contratto del canale |
    | `plugin-sdk/channel-feedback` | Wiring per feedback/reazioni |
  </Accordion>

  <Accordion title="Sottopercorsi dei provider">
    | Sottopercorso | Esportazioni chiave |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/provider-setup` | Helper curati per il setup di provider locali/self-hosted |
    | `plugin-sdk/self-hosted-provider-setup` | Helper focalizzati per il setup di provider self-hosted compatibili con OpenAI |
    | `plugin-sdk/cli-backend` | Valori predefiniti del backend CLI + costanti watchdog |
    | `plugin-sdk/provider-auth-runtime` | Helper runtime per la risoluzione delle API key dei plugin provider |
    | `plugin-sdk/provider-auth-api-key` | Helper per onboarding API key/scrittura del profilo |
    | `plugin-sdk/provider-auth-result` | Builder standard del risultato di autenticazione OAuth |
    | `plugin-sdk/provider-auth-login` | Helper condivisi di login interattivo per plugin provider |
    | `plugin-sdk/provider-env-vars` | Helper per il lookup delle env var auth dei provider |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, builder condivisi di replay-policy, helper per endpoint provider e helper di normalizzazione dell'id del modello come `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Helper generici per capacità HTTP/endpoint dei provider |
    | `plugin-sdk/provider-web-fetch` | Helper per registrazione/cache dei provider web-fetch |
    | `plugin-sdk/provider-web-search` | Helper per registrazione/cache/config dei provider web-search |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, pulizia + diagnostica dello schema Gemini e helper di compatibilità xAI come `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` e simili |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, tipi di wrapper stream e helper condivisi per wrapper Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-onboard` | Helper per patch di configurazione dell'onboarding |
    | `plugin-sdk/global-singleton` | Helper per singleton/mappe/cache locali al processo |
  </Accordion>

  <Accordion title="Sottopercorsi di autenticazione e sicurezza">
    | Sottopercorso | Esportazioni chiave |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, helper per registro comandi, helper per autorizzazione del mittente |
    | `plugin-sdk/approval-auth-runtime` | Helper per risoluzione dell'approvatore e action-auth nella stessa chat |
    | `plugin-sdk/approval-client-runtime` | Helper nativi per profili/filtri di approvazione exec |
    | `plugin-sdk/approval-delivery-runtime` | Adattatori nativi per capability/consegna delle approvazioni |
    | `plugin-sdk/approval-native-runtime` | Helper nativi per target di approvazione + account binding |
    | `plugin-sdk/approval-reply-runtime` | Helper per payload di risposta di approvazione exec/plugin |
    | `plugin-sdk/command-auth-native` | Helper nativi per auth dei comandi + target di sessione nativi |
    | `plugin-sdk/command-detection` | Helper condivisi per rilevamento comandi |
    | `plugin-sdk/command-surface` | Helper per normalizzazione del corpo comando e superficie dei comandi |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/security-runtime` | Helper condivisi per fiducia, gating DM, contenuti esterni e raccolta secret |
    | `plugin-sdk/ssrf-policy` | Helper per allowlist host e policy SSRF della rete privata |
    | `plugin-sdk/ssrf-runtime` | Helper per pinned-dispatcher, fetch protetto da SSRF e policy SSRF |
    | `plugin-sdk/secret-input` | Helper per parsing degli input secret |
    | `plugin-sdk/webhook-ingress` | Helper per richieste/target webhook |
    | `plugin-sdk/webhook-request-guards` | Helper per dimensione body/timeout della richiesta |
  </Accordion>

  <Accordion title="Sottopercorsi di runtime e storage">
    | Sottopercorso | Esportazioni chiave |
    | --- | --- |
    | `plugin-sdk/runtime` | Ampi helper per runtime/logging/backup/installazione plugin |
    | `plugin-sdk/runtime-env` | Helper ristretti per env runtime, logger, timeout, retry e backoff |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Helper condivisi per comandi/hook/http/interattivi dei plugin |
    | `plugin-sdk/hook-runtime` | Helper condivisi per pipeline webhook/hook interni |
    | `plugin-sdk/lazy-runtime` | Helper per import/binding lazy del runtime come `createLazyRuntimeModule`, `createLazyRuntimeMethod` e `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Helper per esecuzione di processi |
    | `plugin-sdk/cli-runtime` | Helper per formattazione CLI, attesa e versioni |
    | `plugin-sdk/gateway-runtime` | Helper per client Gateway e patch di stato dei canali |
    | `plugin-sdk/config-runtime` | Helper per caricamento/scrittura della configurazione |
    | `plugin-sdk/telegram-command-config` | Normalizzazione di nome/descrizione dei comandi Telegram e controlli di duplicati/conflitti, anche quando la superficie di contratto Telegram inclusa non è disponibile |
    | `plugin-sdk/approval-runtime` | Helper per approvazioni exec/plugin, builder di capability di approvazione, helper auth/profilo, helper nativi di routing/runtime |
    | `plugin-sdk/reply-runtime` | Helper condivisi per runtime inbound/reply, chunking, dispatch, heartbeat, pianificatore delle risposte |
    | `plugin-sdk/reply-dispatch-runtime` | Helper ristretti per dispatch/finalizzazione della risposta |
    | `plugin-sdk/reply-history` | Helper condivisi per la reply-history a finestra breve come `buildHistoryContext`, `recordPendingHistoryEntry` e `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Helper ristretti per chunking di testo/markdown |
    | `plugin-sdk/session-store-runtime` | Helper per percorso dello session store + updated-at |
    | `plugin-sdk/state-paths` | Helper per percorsi di stato/directory OAuth |
    | `plugin-sdk/routing` | Helper per route/session-key/account binding come `resolveAgentRoute`, `buildAgentSessionKey` e `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Helper condivisi per riepilogo di stato canale/account, valori predefiniti dello stato runtime e helper per metadati degli issue |
    | `plugin-sdk/target-resolver-runtime` | Helper condivisi per il resolver dei target |
    | `plugin-sdk/string-normalization-runtime` | Helper di normalizzazione di slug/stringhe |
    | `plugin-sdk/request-url` | Estrae URL stringa da input simili a fetch/request |
    | `plugin-sdk/run-command` | Esecutore di comandi con timeout e risultati stdout/stderr normalizzati |
    | `plugin-sdk/param-readers` | Lettori comuni di parametri tool/CLI |
    | `plugin-sdk/tool-send` | Estrae campi canonici del target di invio dagli argomenti del tool |
    | `plugin-sdk/temp-path` | Helper condivisi per percorsi temporanei di download |
    | `plugin-sdk/logging-core` | Helper per logger di sottosistema e redazione |
    | `plugin-sdk/markdown-table-runtime` | Helper per modalità tabella markdown |
    | `plugin-sdk/json-store` | Piccoli helper per lettura/scrittura di stato JSON |
    | `plugin-sdk/file-lock` | Helper per file-lock rientranti |
    | `plugin-sdk/persistent-dedupe` | Helper per cache dedupe persistente su disco |
    | `plugin-sdk/acp-runtime` | Helper per runtime/sessioni ACP |
    | `plugin-sdk/agent-config-primitives` | Primitive ristrette dello schema di configurazione runtime dell'agente |
    | `plugin-sdk/boolean-param` | Lettore permissivo di parametri booleani |
    | `plugin-sdk/dangerous-name-runtime` | Helper per risoluzione del matching di nomi pericolosi |
    | `plugin-sdk/device-bootstrap` | Helper per bootstrap del dispositivo e token di pairing |
    | `plugin-sdk/extension-shared` | Primitive helper condivise per canali passivi e stato |
    | `plugin-sdk/models-provider-runtime` | Helper per risposta del comando `/models`/provider |
    | `plugin-sdk/skill-commands-runtime` | Helper per elenco dei comandi Skills |
    | `plugin-sdk/native-command-registry` | Helper per registro/build/serializzazione dei comandi nativi |
    | `plugin-sdk/provider-zai-endpoint` | Helper per rilevamento endpoint Z.AI |
    | `plugin-sdk/infra-runtime` | Helper per eventi di sistema/heartbeat |
    | `plugin-sdk/collection-runtime` | Piccoli helper per cache limitate |
    | `plugin-sdk/diagnostic-runtime` | Helper per flag ed eventi diagnostici |
    | `plugin-sdk/error-runtime` | Helper per grafo degli errori, formattazione, classificazione condivisa degli errori, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Helper per fetch wrappato, proxy e lookup fissati |
    | `plugin-sdk/host-runtime` | Helper di normalizzazione per hostname e host SCP |
    | `plugin-sdk/retry-runtime` | Helper per configurazione retry e runner di retry |
    | `plugin-sdk/agent-runtime` | Helper per directory/identità/workspace dell'agente |
    | `plugin-sdk/directory-runtime` | Query/dedup di directory supportata da configurazione |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Sottopercorsi di capability e test">
    | Sottopercorso | Esportazioni chiave |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Helper condivisi per fetch/trasformazione/storage dei media più builder del payload media |
    | `plugin-sdk/media-understanding` | Tipi di provider per media understanding più esportazioni helper image/audio rivolte ai provider |
    | `plugin-sdk/text-runtime` | Helper condivisi per testo/markdown/logging come rimozione del testo visibile all'assistente, helper di rendering/chunking/tabelle markdown, helper di redazione, helper per tag direttiva e utility di testo sicuro |
    | `plugin-sdk/text-chunking` | Helper per chunking del testo outbound |
    | `plugin-sdk/speech` | Tipi di provider speech più helper rivolti ai provider per direttive, registro e validazione |
    | `plugin-sdk/speech-core` | Tipi condivisi di provider speech, helper per registro, direttive e normalizzazione |
    | `plugin-sdk/realtime-transcription` | Tipi di provider per trascrizione realtime e helper di registro |
    | `plugin-sdk/realtime-voice` | Tipi di provider per voce realtime e helper di registro |
    | `plugin-sdk/image-generation` | Tipi di provider per generazione di immagini |
    | `plugin-sdk/image-generation-core` | Tipi condivisi per generazione di immagini, helper per failover, auth e registro |
    | `plugin-sdk/video-generation` | Tipi provider/request/result per generazione video |
    | `plugin-sdk/video-generation-core` | Tipi condivisi per generazione video, helper di failover, lookup dei provider e parsing dei model ref |
    | `plugin-sdk/webhook-targets` | Helper per registro dei target webhook e installazione delle route |
    | `plugin-sdk/webhook-path` | Helper per normalizzazione del percorso webhook |
    | `plugin-sdk/web-media` | Helper condivisi per caricamento di media remoti/locali |
    | `plugin-sdk/zod` | `zod` riesportato per i consumatori del Plugin SDK |
    | `plugin-sdk/testing` | `installCommonResolveTargetErrorCases`, `shouldAckReaction` |
  </Accordion>

  <Accordion title="Sottopercorsi della memoria">
    | Sottopercorso | Esportazioni chiave |
    | --- | --- |
    | `plugin-sdk/memory-core` | Superficie helper inclusa di memory-core per helper di manager/config/file/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | Facciata runtime per indice/ricerca della memoria |
    | `plugin-sdk/memory-core-host-engine-foundation` | Esportazioni del motore foundation host della memoria |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Esportazioni del motore embeddings host della memoria |
    | `plugin-sdk/memory-core-host-engine-qmd` | Esportazioni del motore QMD host della memoria |
    | `plugin-sdk/memory-core-host-engine-storage` | Esportazioni del motore storage host della memoria |
    | `plugin-sdk/memory-core-host-multimodal` | Helper multimodali host della memoria |
    | `plugin-sdk/memory-core-host-query` | Helper di query host della memoria |
    | `plugin-sdk/memory-core-host-secret` | Helper secret host della memoria |
    | `plugin-sdk/memory-core-host-status` | Helper di stato host della memoria |
    | `plugin-sdk/memory-core-host-runtime-cli` | Helper runtime CLI host della memoria |
    | `plugin-sdk/memory-core-host-runtime-core` | Helper core runtime host della memoria |
    | `plugin-sdk/memory-core-host-runtime-files` | Helper file/runtime host della memoria |
    | `plugin-sdk/memory-lancedb` | Superficie helper inclusa di memory-lancedb |
  </Accordion>

  <Accordion title="Sottopercorsi helper inclusi riservati">
    | Famiglia | Sottopercorsi attuali | Uso previsto |
    | --- | --- | --- |
    | Browser | `plugin-sdk/browser-config-support`, `plugin-sdk/browser-support` | Helper di supporto per il plugin browser incluso |
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

### Registrazione delle capability

| Metodo                                           | Cosa registra                    |
| ------------------------------------------------ | -------------------------------- |
| `api.registerProvider(...)`                      | Inferenza testuale (LLM)         |
| `api.registerCliBackend(...)`                    | Backend CLI locale di inferenza  |
| `api.registerChannel(...)`                       | Canale di messaggistica          |
| `api.registerSpeechProvider(...)`                | Sintesi text-to-speech / STT     |
| `api.registerRealtimeTranscriptionProvider(...)` | Trascrizione realtime in streaming |
| `api.registerRealtimeVoiceProvider(...)`         | Sessioni vocali realtime duplex  |
| `api.registerMediaUnderstandingProvider(...)`    | Analisi di immagini/audio/video  |
| `api.registerImageGenerationProvider(...)`       | Generazione di immagini          |
| `api.registerVideoGenerationProvider(...)`       | Generazione video                |
| `api.registerWebFetchProvider(...)`              | Provider di web fetch / scrape   |
| `api.registerWebSearchProvider(...)`             | Ricerca web                      |

### Strumenti e comandi

| Metodo                          | Cosa registra                                  |
| ------------------------------- | ---------------------------------------------- |
| `api.registerTool(tool, opts?)` | Strumento dell'agente (obbligatorio o `{ optional: true }`) |
| `api.registerCommand(def)`      | Comando personalizzato (bypassa l'LLM)         |

### Infrastruttura

| Metodo                                         | Cosa registra            |
| ---------------------------------------------- | ------------------------ |
| `api.registerHook(events, handler, opts?)`     | Hook di evento           |
| `api.registerHttpRoute(params)`                | Endpoint HTTP del Gateway |
| `api.registerGatewayMethod(name, handler)`     | Metodo RPC del Gateway   |
| `api.registerCli(registrar, opts?)`            | Sottocomando CLI         |
| `api.registerService(service)`                 | Servizio in background   |
| `api.registerInteractiveHandler(registration)` | Handler interattivo      |

Gli spazi dei nomi amministrativi del core riservati (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) restano sempre `operator.admin`, anche se un plugin tenta di assegnare
un ambito più ristretto a un metodo gateway. Preferisci prefissi specifici del plugin per
i metodi gestiti dal plugin.

### Metadati di registrazione CLI

`api.registerCli(registrar, opts?)` accetta due tipi di metadati di primo livello:

- `commands`: radici di comando esplicite possedute dal registrar
- `descriptors`: descrittori di comando in fase di parsing usati per l'help della CLI radice,
  il routing e la registrazione lazy della CLI del plugin

Se vuoi che un comando del plugin resti lazy-loaded nel normale percorso della CLI radice,
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
        description: "Gestisci account Matrix, verifica, dispositivi e stato del profilo",
        hasSubcommands: true,
      },
    ],
  },
);
```

Usa `commands` da solo solo quando non hai bisogno della registrazione lazy della CLI radice.
Quel percorso di compatibilità eager resta supportato, ma non installa
placeholder basati su descriptor per il lazy loading in fase di parsing.

### Registrazione del backend CLI

`api.registerCliBackend(...)` permette a un plugin di possedere la configurazione
predefinita per un backend CLI AI locale come `claude-cli` o `codex-cli`.

- Il `id` del backend diventa il prefisso provider nei model ref come `claude-cli/opus`.
- La `config` del backend usa la stessa forma di `agents.defaults.cliBackends.<id>`.
- La configurazione utente ha comunque la precedenza. OpenClaw unisce `agents.defaults.cliBackends.<id>` sopra il valore predefinito del
  plugin prima di eseguire la CLI.
- Usa `normalizeConfig` quando un backend ha bisogno di riscritture di compatibilità dopo il merge
  (ad esempio normalizzare vecchie forme di flag).

### Slot esclusivi

| Metodo                                     | Cosa registra                         |
| ------------------------------------------ | ------------------------------------- |
| `api.registerContextEngine(id, factory)`   | Motore di contesto (uno attivo alla volta) |
| `api.registerMemoryPromptSection(builder)` | Builder di sezione prompt memoria     |
| `api.registerMemoryFlushPlan(resolver)`    | Resolver del piano di flush della memoria |
| `api.registerMemoryRuntime(runtime)`       | Adattatore runtime della memoria      |

### Adattatori di embedding della memoria

| Metodo                                         | Cosa registra                                  |
| ---------------------------------------------- | ---------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | Adattatore di embedding della memoria per il plugin attivo |

- `registerMemoryPromptSection`, `registerMemoryFlushPlan` e
  `registerMemoryRuntime` sono esclusivi dei plugin di memoria.
- `registerMemoryEmbeddingProvider` consente al plugin di memoria attivo di registrare uno
  o più id di adattatore embedding (ad esempio `openai`, `gemini` o un id
  personalizzato definito dal plugin).
- La configurazione utente come `agents.defaults.memorySearch.provider` e
  `agents.defaults.memorySearch.fallback` viene risolta rispetto a quegli id di adattatore
  registrati.

### Eventi e ciclo di vita

| Metodo                                       | Cosa fa                      |
| -------------------------------------------- | ---------------------------- |
| `api.on(hookName, handler, opts?)`           | Hook di ciclo di vita tipizzato |
| `api.onConversationBindingResolved(handler)` | Callback di risoluzione del conversation binding |

### Semantica decisionale degli hook

- `before_tool_call`: restituire `{ block: true }` è terminale. Una volta che un handler lo imposta, gli handler a priorità più bassa vengono saltati.
- `before_tool_call`: restituire `{ block: false }` viene trattato come nessuna decisione (come omettere `block`), non come override.
- `before_install`: restituire `{ block: true }` è terminale. Una volta che un handler lo imposta, gli handler a priorità più bassa vengono saltati.
- `before_install`: restituire `{ block: false }` viene trattato come nessuna decisione (come omettere `block`), non come override.
- `message_sending`: restituire `{ cancel: true }` è terminale. Una volta che un handler lo imposta, gli handler a priorità più bassa vengono saltati.
- `message_sending`: restituire `{ cancel: false }` viene trattato come nessuna decisione (come omettere `cancel`), non come override.

### Campi dell'oggetto API

| Campo                    | Tipo                      | Descrizione                                                                                   |
| ------------------------ | ------------------------- | --------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | Id del plugin                                                                                 |
| `api.name`               | `string`                  | Nome visualizzato                                                                             |
| `api.version`            | `string?`                 | Versione del plugin (facoltativa)                                                             |
| `api.description`        | `string?`                 | Descrizione del plugin (facoltativa)                                                          |
| `api.source`             | `string`                  | Percorso sorgente del plugin                                                                  |
| `api.rootDir`            | `string?`                 | Directory radice del plugin (facoltativa)                                                     |
| `api.config`             | `OpenClawConfig`          | Snapshot di configurazione corrente (snapshot runtime in-memory attivo quando disponibile)    |
| `api.pluginConfig`       | `Record<string, unknown>` | Configurazione specifica del plugin da `plugins.entries.<id>.config`                          |
| `api.runtime`            | `PluginRuntime`           | [Helper runtime](/plugins/sdk-runtime)                                                        |
| `api.logger`             | `PluginLogger`            | Logger con scope (`debug`, `info`, `warn`, `error`)                                           |
| `api.registrationMode`   | `PluginRegistrationMode`  | Modalità di caricamento corrente; `"setup-runtime"` è la finestra leggera di startup/setup prima dell'entry completa |
| `api.resolvePath(input)` | `(string) => string`      | Risolve il percorso relativo alla radice del plugin                                           |

## Convenzione dei moduli interni

All'interno del tuo plugin, usa file barrel locali per gli import interni:

```
my-plugin/
  api.ts            # Esportazioni pubbliche per consumatori esterni
  runtime-api.ts    # Esportazioni runtime solo interne
  index.ts          # Entry point del plugin
  setup-entry.ts    # Entry leggera opzionale solo per setup
```

<Warning>
  Non importare mai il tuo stesso plugin tramite `openclaw/plugin-sdk/<your-plugin>`
  dal codice di produzione. Instrada gli import interni tramite `./api.ts` o
  `./runtime-api.ts`. Il percorso SDK è solo il contratto esterno.
</Warning>

Le superfici pubbliche dei plugin inclusi caricate tramite facciata (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` e file entry pubblici simili) ora preferiscono lo
snapshot di configurazione runtime attivo quando OpenClaw è già in esecuzione. Se non esiste ancora
alcuno snapshot runtime, ricadono sul file di configurazione risolto su disco.

I plugin provider possono anche esporre un barrel contrattuale ristretto locale al plugin quando un
helper è intenzionalmente specifico del provider e non appartiene ancora a un sottopercorso SDK generico. Esempio incluso attuale: il provider Anthropic mantiene i suoi helper di stream Claude
nel proprio seam pubblico `api.ts` / `contract-api.ts` invece di promuovere la logica
dell'header beta Anthropic e `service_tier` in un contratto generico
`plugin-sdk/*`.

Altri esempi inclusi attuali:

- `@openclaw/openai-provider`: `api.ts` esporta builder del provider,
  helper per modello predefinito e builder per provider realtime
- `@openclaw/openrouter-provider`: `api.ts` esporta il builder del provider più
  helper per onboarding/configurazione

<Warning>
  Anche il codice di produzione delle estensioni dovrebbe evitare gli import
  `openclaw/plugin-sdk/<other-plugin>`. Se un helper è davvero condiviso, promuovilo a un sottopercorso SDK neutrale
  come `openclaw/plugin-sdk/speech`, `.../provider-model-shared` o a un'altra
  superficie orientata alle capability invece di accoppiare due plugin tra loro.
</Warning>

## Correlati

- [Entry Points](/plugins/sdk-entrypoints) — opzioni di `definePluginEntry` e `defineChannelPluginEntry`
- [Helper runtime](/plugins/sdk-runtime) — riferimento completo del namespace `api.runtime`
- [Setup e configurazione](/plugins/sdk-setup) — packaging, manifest, schemi di configurazione
- [Test](/plugins/sdk-testing) — utility di test e regole lint
- [Migrazione SDK](/plugins/sdk-migration) — migrazione da superfici deprecate
- [Componenti interni dei plugin](/plugins/architecture) — architettura approfondita e modello di capability
