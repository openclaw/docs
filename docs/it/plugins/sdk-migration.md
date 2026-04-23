---
read_when:
    - Vedi l'avviso OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED
    - Vedi l'avviso OPENCLAW_EXTENSION_API_DEPRECATED
    - Stai aggiornando un plugin alla moderna architettura dei plugin
    - Mantieni un plugin OpenClaw esterno
sidebarTitle: Migrate to SDK
summary: Migrare dal layer legacy di retrocompatibilità al moderno SDK per plugin
title: Migrazione dell'SDK per plugin
x-i18n:
    generated_at: "2026-04-23T08:32:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8f21fc911a961bf88f6487dae0c1c2f54c0759911b2a992ae6285aa2f8704006
    source_path: plugins/sdk-migration.md
    workflow: 15
---

# Migrazione dell'SDK per plugin

OpenClaw è passato da un ampio layer di retrocompatibilità a una moderna
architettura dei plugin con import mirati e documentati. Se il tuo plugin è stato creato prima
della nuova architettura, questa guida ti aiuta a migrare.

## Cosa sta cambiando

Il vecchio sistema di plugin forniva due superfici molto aperte che permettevano ai plugin di importare
qualsiasi cosa servisse da un singolo punto di ingresso:

- **`openclaw/plugin-sdk/compat`** — un singolo import che riesportava decine di
  helper. È stato introdotto per mantenere funzionanti i vecchi plugin basati su hook mentre veniva
  costruita la nuova architettura dei plugin.
- **`openclaw/extension-api`** — un bridge che dava ai plugin accesso diretto a
  helper lato host come l'embedded agent runner.

Entrambe le superfici sono ora **deprecate**. Continuano a funzionare a runtime, ma i nuovi
plugin non devono usarle, e i plugin esistenti dovrebbero migrare prima che la prossima
major release le rimuova.

<Warning>
  Il layer di retrocompatibilità verrà rimosso in una futura major release.
  I plugin che importano ancora da queste superfici smetteranno di funzionare quando ciò accadrà.
</Warning>

## Perché è cambiato

Il vecchio approccio causava problemi:

- **Avvio lento** — importare un helper caricava decine di moduli non correlati
- **Dipendenze circolari** — le riesportazioni ampie rendevano facile creare cicli di import
- **Superficie API poco chiara** — non c'era modo di capire quali export fossero stabili e quali interni

Il moderno SDK per plugin risolve questo problema: ogni percorso di import (`openclaw/plugin-sdk/\<subpath\>`)
è un modulo piccolo e autosufficiente con uno scopo chiaro e un contratto documentato.

Anche le seam di convenienza legacy dei provider per i canali inclusi non esistono più. Import come
`openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`,
`openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp`,
seam helper brandizzate per canale e
`openclaw/plugin-sdk/telegram-core` erano scorciatoie private del mono-repo, non
contratti stabili per plugin. Usa invece subpath generici e mirati dello SDK. All'interno del
workspace del plugin incluso, mantieni gli helper posseduti dal provider nel proprio
`api.ts` o `runtime-api.ts` del plugin.

Esempi attuali di provider inclusi:

- Anthropic mantiene helper di stream specifici di Claude nella propria seam `api.ts` /
  `contract-api.ts`
- OpenAI mantiene builder provider, helper per modelli predefiniti e builder provider
  realtime nel proprio `api.ts`
- OpenRouter mantiene builder provider e helper di onboarding/configurazione nel proprio
  `api.ts`

## Come migrare

<Steps>
  <Step title="Migra i gestori approval-native ai capability facts">
    I plugin di canale con capacità di approvazione ora espongono il comportamento di approvazione nativo tramite
    `approvalCapability.nativeRuntime` più il registro condiviso runtime-context.

    Modifiche principali:

    - Sostituisci `approvalCapability.handler.loadRuntime(...)` con
      `approvalCapability.nativeRuntime`
    - Sposta autenticazione/consegna specifiche dell'approvazione dal wiring legacy `plugin.auth` /
      `plugin.approvals` a `approvalCapability`
    - `ChannelPlugin.approvals` è stato rimosso dal contratto pubblico del
      plugin di canale; sposta i campi delivery/native/render in `approvalCapability`
    - `plugin.auth` resta per i soli flussi di login/logout del canale; gli hook di autenticazione
      dell'approvazione lì non vengono più letti dal core
    - Registra oggetti runtime posseduti dal canale come client, token o app
      Bolt tramite `openclaw/plugin-sdk/channel-runtime-context`
    - Non inviare avvisi di reroute posseduti dal plugin da gestori di approvazione nativi;
      il core ora possiede gli avvisi di instradamento-altrove dai risultati effettivi di consegna
    - Quando passi `channelRuntime` a `createChannelManager(...)`, fornisci una
      superficie reale `createPluginRuntime().channel`. Gli stub parziali vengono rifiutati.

    Vedi `/plugins/sdk-channel-plugins` per il layout corrente della
    approval capability.

  </Step>

  <Step title="Controlla il comportamento di fallback dei wrapper Windows">
    Se il tuo plugin usa `openclaw/plugin-sdk/windows-spawn`, i wrapper Windows
    `.cmd`/`.bat` non risolti ora falliscono in modalità chiusa a meno che tu non passi esplicitamente
    `allowShellFallback: true`.

    ```typescript
    // Before
    const program = applyWindowsSpawnProgramPolicy({ candidate });

    // After
    const program = applyWindowsSpawnProgramPolicy({
      candidate,
      // Only set this for trusted compatibility callers that intentionally
      // accept shell-mediated fallback.
      allowShellFallback: true,
    });
    ```

    Se il tuo chiamante non dipende intenzionalmente dal fallback shell, non impostare
    `allowShellFallback` e gestisci invece l'errore lanciato.

  </Step>

  <Step title="Trova gli import deprecati">
    Cerca nel tuo plugin import da una delle due superfici deprecate:

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="Sostituisci con import mirati">
    Ogni export dalla vecchia superficie corrisponde a uno specifico percorso di import moderno:

    ```typescript
    // Before (deprecated backwards-compatibility layer)
    import {
      createChannelReplyPipeline,
      createPluginRuntimeStore,
      resolveControlCommandGate,
    } from "openclaw/plugin-sdk/compat";

    // After (modern focused imports)
    import { createChannelReplyPipeline } from "openclaw/plugin-sdk/channel-reply-pipeline";
    import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
    import { resolveControlCommandGate } from "openclaw/plugin-sdk/command-auth";
    ```

    Per gli helper lato host, usa il runtime plugin iniettato invece di importare
    direttamente:

    ```typescript
    // Before (deprecated extension-api bridge)
    import { runEmbeddedPiAgent } from "openclaw/extension-api";
    const result = await runEmbeddedPiAgent({ sessionId, prompt });

    // After (injected runtime)
    const result = await api.runtime.agent.runEmbeddedPiAgent({ sessionId, prompt });
    ```

    Lo stesso schema si applica ad altri helper legacy del bridge:

    | Vecchio import | Equivalente moderno |
    | --- | --- |
    | `resolveAgentDir` | `api.runtime.agent.resolveAgentDir` |
    | `resolveAgentWorkspaceDir` | `api.runtime.agent.resolveAgentWorkspaceDir` |
    | `resolveAgentIdentity` | `api.runtime.agent.resolveAgentIdentity` |
    | `resolveThinkingDefault` | `api.runtime.agent.resolveThinkingDefault` |
    | `resolveAgentTimeoutMs` | `api.runtime.agent.resolveAgentTimeoutMs` |
    | `ensureAgentWorkspace` | `api.runtime.agent.ensureAgentWorkspace` |
    | helper del session store | `api.runtime.agent.session.*` |

  </Step>

  <Step title="Build e test">
    ```bash
    pnpm build
    pnpm test -- my-plugin/
    ```
  </Step>
</Steps>

## Riferimento dei percorsi di import

  <Accordion title="Tabella comune dei percorsi di import">
  | Percorso di import | Scopo | Export principali |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | Helper canonico di entry del plugin | `definePluginEntry` |
  | `plugin-sdk/core` | Riesportazione legacy ombrello per definizioni/builder di entry canale | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Export dello schema di configurazione root | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Helper di entry per provider singolo | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Definizioni e builder mirati di entry canale | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | Helper condivisi del wizard di configurazione | Prompt allowlist, builder di stato della configurazione |
  | `plugin-sdk/setup-runtime` | Helper runtime per il momento della configurazione | Adapter patch di configurazione sicuri per l'import, helper per note lookup, `promptResolvedAllowFrom`, `splitSetupEntries`, proxy di configurazione delegata |
  | `plugin-sdk/setup-adapter-runtime` | Helper dell'adapter di configurazione | `createEnvPatchedAccountSetupAdapter` |
  | `plugin-sdk/setup-tools` | Helper degli strumenti di configurazione | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Helper multi-account | Helper per lista account/configurazione/gate delle azioni |
  | `plugin-sdk/account-id` | Helper per account-id | `DEFAULT_ACCOUNT_ID`, normalizzazione account-id |
  | `plugin-sdk/account-resolution` | Helper di lookup account | Helper di lookup account + fallback predefinito |
  | `plugin-sdk/account-helpers` | Helper mirati per account | Helper per lista account/azioni account |
  | `plugin-sdk/channel-setup` | Adapter del wizard di configurazione | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, più `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | Primitive di pairing DM | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Wiring di prefisso risposta + digitazione | `createChannelReplyPipeline` |
  | `plugin-sdk/channel-config-helpers` | Factory di adapter di configurazione | `createHybridChannelConfigAdapter` |
  | `plugin-sdk/channel-config-schema` | Builder di schema di configurazione | Tipi di schema di configurazione del canale |
  | `plugin-sdk/telegram-command-config` | Helper di configurazione dei comandi Telegram | Normalizzazione del nome del comando, trimming della descrizione, validazione di duplicati/conflitti |
  | `plugin-sdk/channel-policy` | Risoluzione delle policy gruppo/DM | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Helper di ciclo di vita per stato account e flusso bozza | `createAccountStatusSink`, helper di finalizzazione dell'anteprima bozza |
  | `plugin-sdk/inbound-envelope` | Helper dell'envelope inbound | Helper condivisi di routing + builder envelope |
  | `plugin-sdk/inbound-reply-dispatch` | Helper della risposta inbound | Helper condivisi di record-and-dispatch |
  | `plugin-sdk/messaging-targets` | Parsing delle destinazioni di messaggistica | Helper di parsing/corrispondenza delle destinazioni |
  | `plugin-sdk/outbound-media` | Helper per i media outbound | Caricamento condiviso dei media outbound |
  | `plugin-sdk/outbound-runtime` | Helper runtime outbound | Helper per identità/delega di invio outbound e pianificazione del payload |
  | `plugin-sdk/thread-bindings-runtime` | Helper di binding dei thread | Helper di ciclo di vita e adapter dei binding dei thread |
  | `plugin-sdk/agent-media-payload` | Helper legacy per payload media | Builder di payload media dell'agente per layout di campi legacy |
  | `plugin-sdk/channel-runtime` | Shim di compatibilità deprecato | Solo utility legacy del runtime canale |
  | `plugin-sdk/channel-send-result` | Tipi del risultato di invio | Tipi del risultato di risposta |
  | `plugin-sdk/runtime-store` | Storage persistente del plugin | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Helper runtime ampi | Helper runtime/logging/backup/installazione plugin |
  | `plugin-sdk/runtime-env` | Helper mirati per runtime env | Helper per logger/runtime env, timeout, retry e backoff |
  | `plugin-sdk/plugin-runtime` | Helper runtime condivisi del plugin | Helper per comandi/hook/http/interactive del plugin |
  | `plugin-sdk/hook-runtime` | Helper della pipeline hook | Helper condivisi della pipeline webhook/hook interni |
  | `plugin-sdk/lazy-runtime` | Helper runtime lazy | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Helper di processo | Helper condivisi per exec |
  | `plugin-sdk/cli-runtime` | Helper runtime CLI | Formattazione comandi, attese, helper di versione |
  | `plugin-sdk/gateway-runtime` | Helper Gateway | Client Gateway e helper patch di stato canale |
  | `plugin-sdk/config-runtime` | Helper di configurazione | Helper di caricamento/scrittura della configurazione |
  | `plugin-sdk/telegram-command-config` | Helper dei comandi Telegram | Helper di validazione dei comandi Telegram stabili in fallback quando la superficie del contratto Telegram incluso non è disponibile |
  | `plugin-sdk/approval-runtime` | Helper del prompt di approvazione | Payload di approvazione exec/plugin, helper di capacità/profilo di approvazione, helper runtime/routing di approvazione nativa |
  | `plugin-sdk/approval-auth-runtime` | Helper di autenticazione dell'approvazione | Risoluzione dell'approvatore, auth dell'azione nella stessa chat |
  | `plugin-sdk/approval-client-runtime` | Helper client dell'approvazione | Helper di profilo/filtro di approvazione exec nativa |
  | `plugin-sdk/approval-delivery-runtime` | Helper di consegna dell'approvazione | Adapter di consegna/capacità di approvazione nativa |
  | `plugin-sdk/approval-gateway-runtime` | Helper Gateway dell'approvazione | Helper condiviso di risoluzione Gateway dell'approvazione |
  | `plugin-sdk/approval-handler-adapter-runtime` | Helper adapter dell'approvazione | Helper leggeri di caricamento dell'adapter di approvazione nativa per entrypoint di canale hot |
  | `plugin-sdk/approval-handler-runtime` | Helper del gestore dell'approvazione | Helper runtime più ampi del gestore di approvazione; preferisci le seam più mirate adapter/gateway quando sono sufficienti |
  | `plugin-sdk/approval-native-runtime` | Helper della destinazione di approvazione | Helper nativi per binding di destinazione/account dell'approvazione |
  | `plugin-sdk/approval-reply-runtime` | Helper della risposta di approvazione | Helper di payload della risposta di approvazione exec/plugin |
  | `plugin-sdk/channel-runtime-context` | Helper runtime-context del canale | Helper generici di register/get/watch del runtime-context del canale |
  | `plugin-sdk/security-runtime` | Helper di sicurezza | Helper condivisi per trust, gating DM, contenuti esterni e raccolta di segreti |
  | `plugin-sdk/ssrf-policy` | Helper di policy SSRF | Helper di allowlist host e policy per rete privata |
  | `plugin-sdk/ssrf-runtime` | Helper runtime SSRF | Helper di pinned-dispatcher, fetch protetto, policy SSRF |
  | `plugin-sdk/collection-runtime` | Helper di cache limitata | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Helper di gating diagnostico | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Helper di formattazione degli errori | `formatUncaughtError`, `isApprovalNotFoundError`, helper del grafo degli errori |
  | `plugin-sdk/fetch-runtime` | Helper di fetch/proxy wrapperizzati | `resolveFetch`, helper proxy |
  | `plugin-sdk/host-runtime` | Helper di normalizzazione host | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Helper di retry | `RetryConfig`, `retryAsync`, runner di policy |
  | `plugin-sdk/allow-from` | Formattazione allowlist | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | Mappatura dell'input allowlist | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Gating dei comandi e helper della superficie comandi | `resolveControlCommandGate`, helper di autorizzazione del mittente, helper del registro comandi |
  | `plugin-sdk/command-status` | Renderer di stato/help dei comandi | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | Parsing dell'input segreto | Helper per input segreti |
  | `plugin-sdk/webhook-ingress` | Helper della richiesta Webhook | Utility per la destinazione Webhook |
  | `plugin-sdk/webhook-request-guards` | Helper di guard per il body Webhook | Helper di lettura/limite del body della richiesta |
  | `plugin-sdk/reply-runtime` | Runtime condiviso della risposta | Dispatch inbound, Heartbeat, pianificatore di risposta, chunking |
  | `plugin-sdk/reply-dispatch-runtime` | Helper mirati di dispatch della risposta | Helper di finalizzazione + dispatch del provider |
  | `plugin-sdk/reply-history` | Helper della cronologia delle risposte | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | Pianificazione del riferimento di risposta | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Helper di chunk della risposta | Helper di chunking testo/markdown |
  | `plugin-sdk/session-store-runtime` | Helper del session store | Helper di percorso store + updated-at |
  | `plugin-sdk/state-paths` | Helper di percorso dello stato | Helper per directory di stato e OAuth |
  | `plugin-sdk/routing` | Helper di routing/chiave sessione | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, helper di normalizzazione della chiave di sessione |
  | `plugin-sdk/status-helpers` | Helper di stato del canale | Builder di riepilogo stato canale/account, valori predefiniti di stato runtime, helper di metadati dei problemi |
  | `plugin-sdk/target-resolver-runtime` | Helper del risolutore di destinazione | Helper condivisi del risolutore di destinazione |
  | `plugin-sdk/string-normalization-runtime` | Helper di normalizzazione stringhe | Helper di normalizzazione slug/stringhe |
  | `plugin-sdk/request-url` | Helper URL di richiesta | Estrai URL stringa da input simili a richieste |
  | `plugin-sdk/run-command` | Helper per comandi temporizzati | Runner di comandi temporizzati con stdout/stderr normalizzati |
  | `plugin-sdk/param-readers` | Lettori di parametri | Lettori comuni di parametri per strumenti/CLI |
  | `plugin-sdk/tool-payload` | Estrazione del payload degli strumenti | Estrai payload normalizzati da oggetti risultato degli strumenti |
  | `plugin-sdk/tool-send` | Estrazione dell'invio degli strumenti | Estrai campi canonici della destinazione di invio dagli argomenti degli strumenti |
  | `plugin-sdk/temp-path` | Helper di percorso temporaneo | Helper condivisi per percorsi temporanei di download |
  | `plugin-sdk/logging-core` | Helper di logging | Helper di logger del sottosistema e redazione |
  | `plugin-sdk/markdown-table-runtime` | Helper delle tabelle markdown | Helper della modalità tabella markdown |
  | `plugin-sdk/reply-payload` | Tipi di risposta del messaggio | Tipi di payload della risposta |
  | `plugin-sdk/provider-setup` | Helper curati di configurazione per provider locali/self-hosted | Helper di discovery/configurazione dei provider self-hosted |
  | `plugin-sdk/self-hosted-provider-setup` | Helper mirati di configurazione per provider self-hosted compatibili con OpenAI | Gli stessi helper di discovery/configurazione dei provider self-hosted |
  | `plugin-sdk/provider-auth-runtime` | Helper di autenticazione runtime del provider | Helper di risoluzione runtime della chiave API |
  | `plugin-sdk/provider-auth-api-key` | Helper di configurazione della chiave API del provider | Helper di onboarding/scrittura profilo per chiavi API |
  | `plugin-sdk/provider-auth-result` | Helper del risultato di autenticazione del provider | Builder standard del risultato auth OAuth |
  | `plugin-sdk/provider-auth-login` | Helper di login interattivo del provider | Helper condivisi di login interattivo |
  | `plugin-sdk/provider-env-vars` | Helper env-var del provider | Helper di lookup delle env-var di autenticazione del provider |
  | `plugin-sdk/provider-model-shared` | Helper condivisi per modello/replay del provider | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, builder condivisi di replay-policy, helper di endpoint del provider e helper di normalizzazione model-id |
  | `plugin-sdk/provider-catalog-shared` | Helper condivisi del catalogo provider | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
| `plugin-sdk/provider-onboard` | Patch di onboarding del provider | Helper di configurazione per onboarding |
| `plugin-sdk/provider-http` | Helper HTTP del provider | Helper generici HTTP/endpoint capability del provider, inclusi gli helper multipart form per la trascrizione audio |
| `plugin-sdk/provider-web-fetch` | Helper web-fetch del provider | Helper di registrazione/cache del provider web-fetch |
| `plugin-sdk/provider-web-search-config-contract` | Helper di configurazione web-search del provider | Helper mirati di configurazione/credenziali web-search per provider che non richiedono wiring di abilitazione del plugin |
| `plugin-sdk/provider-web-search-contract` | Helper del contratto web-search del provider | Helper mirati del contratto di configurazione/credenziali web-search come `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` e setter/getter di credenziali con ambito |
| `plugin-sdk/provider-web-search` | Helper web-search del provider | Helper di registrazione/cache/runtime del provider web-search |
| `plugin-sdk/provider-tools` | Helper di compatibilità di strumenti/schema del provider | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, pulizia + diagnostica dello schema Gemini e helper compat xAI come `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
| `plugin-sdk/provider-usage` | Helper di utilizzo del provider | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage` e altri helper di utilizzo del provider |
| `plugin-sdk/provider-stream` | Helper wrapper di stream del provider | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, tipi di wrapper stream e helper wrapper condivisi Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
| `plugin-sdk/provider-transport-runtime` | Helper di trasporto del provider | Helper di trasporto nativi del provider come fetch protetto, trasformazioni dei messaggi di trasporto e flussi di eventi di trasporto scrivibili |
| `plugin-sdk/keyed-async-queue` | Coda async ordinata | `KeyedAsyncQueue` |
| `plugin-sdk/media-runtime` | Helper media condivisi | Helper di fetch/transform/store dei media più builder di payload media |
| `plugin-sdk/media-generation-runtime` | Helper condivisi per media-generation | Helper condivisi di failover, selezione dei candidati e messaggistica modello mancante per generazione di immagini/video/musica |
| `plugin-sdk/media-understanding` | Helper media-understanding | Tipi provider media-understanding più export helper lato provider per immagini/audio |
| `plugin-sdk/text-runtime` | Helper di testo condivisi | Rimozione del testo visibile all'assistente, helper di render/chunking/tabella markdown, helper di redazione, helper di directive-tag, utility di testo sicuro e helper correlati di testo/logging |
| `plugin-sdk/text-chunking` | Helper di chunking del testo | Helper di chunking del testo outbound |
| `plugin-sdk/speech` | Helper speech | Tipi provider speech più helper lato provider per direttive, registro e validazione |
| `plugin-sdk/speech-core` | Core speech condiviso | Tipi provider speech, registro, direttive, normalizzazione |
| `plugin-sdk/realtime-transcription` | Helper realtime transcription | Tipi provider, helper di registro e helper condiviso di sessione WebSocket |
| `plugin-sdk/realtime-voice` | Helper realtime voice | Tipi provider e helper di registro |
| `plugin-sdk/image-generation-core` | Core condiviso image-generation | Tipi image-generation, helper di failover, auth e registro |
| `plugin-sdk/music-generation` | Helper music-generation | Tipi provider/richiesta/risultato di music-generation |
| `plugin-sdk/music-generation-core` | Core condiviso music-generation | Tipi music-generation, helper di failover, lookup del provider e parsing di model-ref |
| `plugin-sdk/video-generation` | Helper video-generation | Tipi provider/richiesta/risultato di video-generation |
| `plugin-sdk/video-generation-core` | Core condiviso video-generation | Tipi video-generation, helper di failover, lookup del provider e parsing di model-ref |
| `plugin-sdk/interactive-runtime` | Helper di risposta interattiva | Normalizzazione/riduzione del payload di risposta interattiva |
| `plugin-sdk/channel-config-primitives` | Primitive di configurazione del canale | Primitive mirate di channel config-schema |
| `plugin-sdk/channel-config-writes` | Helper di scrittura della configurazione del canale | Helper di autorizzazione della scrittura di configurazione del canale |
| `plugin-sdk/channel-plugin-common` | Preludio canale condiviso | Export condivisi del preludio del plugin canale |
| `plugin-sdk/channel-status` | Helper di stato del canale | Helper condivisi di snapshot/riepilogo dello stato del canale |
| `plugin-sdk/allowlist-config-edit` | Helper di configurazione allowlist | Helper di lettura/modifica della configurazione allowlist |
| `plugin-sdk/group-access` | Helper di accesso ai gruppi | Helper condivisi di decisione per l'accesso ai gruppi |
| `plugin-sdk/direct-dm` | Helper direct-DM | Helper condivisi di autenticazione/guard direct-DM |
| `plugin-sdk/extension-shared` | Helper condivisi delle estensioni | Primitive helper di canale passivo/stato e proxy ambient |
| `plugin-sdk/webhook-targets` | Helper delle destinazioni Webhook | Registro delle destinazioni Webhook e helper di installazione delle route |
| `plugin-sdk/webhook-path` | Helper del percorso Webhook | Helper di normalizzazione del percorso Webhook |
| `plugin-sdk/web-media` | Helper condivisi dei media web | Helper di caricamento media remoti/locali |
| `plugin-sdk/zod` | Riesportazione Zod | Riesportazione di `zod` per i consumer dello SDK per plugin |
| `plugin-sdk/memory-core` | Helper inclusi di memory-core | Superficie helper di memory manager/config/file/CLI |
| `plugin-sdk/memory-core-engine-runtime` | Facade runtime del motore di memoria | Facade runtime di indice/ricerca della memoria |
| `plugin-sdk/memory-core-host-engine-foundation` | Motore foundation dell'host di memoria | Export del motore foundation dell'host di memoria |
| `plugin-sdk/memory-core-host-engine-embeddings` | Motore embeddings dell'host di memoria | Contratti embeddings della memoria, accesso al registro, provider locale e helper generici batch/remoti; i provider remoti concreti vivono nei plugin proprietari |
| `plugin-sdk/memory-core-host-engine-qmd` | Motore QMD dell'host di memoria | Export del motore QMD dell'host di memoria |
| `plugin-sdk/memory-core-host-engine-storage` | Motore storage dell'host di memoria | Export del motore storage dell'host di memoria |
| `plugin-sdk/memory-core-host-multimodal` | Helper multimodali dell'host di memoria | Helper multimodali dell'host di memoria |
| `plugin-sdk/memory-core-host-query` | Helper query dell'host di memoria | Helper query dell'host di memoria |
| `plugin-sdk/memory-core-host-secret` | Helper secret dell'host di memoria | Helper secret dell'host di memoria |
| `plugin-sdk/memory-core-host-events` | Helper del journal eventi dell'host di memoria | Helper del journal eventi dell'host di memoria |
| `plugin-sdk/memory-core-host-status` | Helper di stato dell'host di memoria | Helper di stato dell'host di memoria |
| `plugin-sdk/memory-core-host-runtime-cli` | Runtime CLI dell'host di memoria | Helper runtime CLI dell'host di memoria |
| `plugin-sdk/memory-core-host-runtime-core` | Runtime core dell'host di memoria | Helper runtime core dell'host di memoria |
| `plugin-sdk/memory-core-host-runtime-files` | Helper file/runtime dell'host di memoria | Helper file/runtime dell'host di memoria |
| `plugin-sdk/memory-host-core` | Alias runtime core dell'host di memoria | Alias vendor-neutral per gli helper runtime core dell'host di memoria |
| `plugin-sdk/memory-host-events` | Alias del journal eventi dell'host di memoria | Alias vendor-neutral per gli helper del journal eventi dell'host di memoria |
| `plugin-sdk/memory-host-files` | Alias file/runtime dell'host di memoria | Alias vendor-neutral per gli helper file/runtime dell'host di memoria |
| `plugin-sdk/memory-host-markdown` | Helper markdown gestiti | Helper condivisi di managed-markdown per plugin adiacenti alla memoria |
| `plugin-sdk/memory-host-search` | Facade di ricerca Active Memory | Facade runtime lazy del search-manager di Active Memory |
| `plugin-sdk/memory-host-status` | Alias di stato dell'host di memoria | Alias vendor-neutral per gli helper di stato dell'host di memoria |
| `plugin-sdk/memory-lancedb` | Helper inclusi di memory-lancedb | Superficie helper di memory-lancedb |
| `plugin-sdk/testing` | Utility di test | Helper e mock di test |
</Accordion>

Questa tabella è intenzionalmente il sottoinsieme comune per la migrazione, non l'intera
superficie dello SDK. L'elenco completo di oltre 200 entrypoint si trova in
`scripts/lib/plugin-sdk-entrypoints.json`.

Quell'elenco include ancora alcune seam helper per plugin inclusi come
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup` e `plugin-sdk/matrix*`. Questi restano esportati per
manutenzione e compatibilità dei plugin inclusi, ma sono intenzionalmente
omessi dalla tabella comune di migrazione e non sono la destinazione consigliata per il
nuovo codice dei plugin.

La stessa regola si applica ad altre famiglie di helper inclusi come:

- helper di supporto browser: `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support`
- Matrix: `plugin-sdk/matrix*`
- LINE: `plugin-sdk/line*`
- IRC: `plugin-sdk/irc*`
- superfici helper/plugin inclusi come `plugin-sdk/googlechat`,
  `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles*`,
  `plugin-sdk/mattermost*`, `plugin-sdk/msteams`,
  `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`,
  `plugin-sdk/twitch`,
  `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`,
  `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`,
  `plugin-sdk/thread-ownership` e `plugin-sdk/voice-call`

`plugin-sdk/github-copilot-token` attualmente espone la superficie ristretta di helper token
`DEFAULT_COPILOT_API_BASE_URL`,
`deriveCopilotApiBaseUrlFromToken` e `resolveCopilotApiToken`.

Usa l'import più ristretto che corrisponde al compito. Se non riesci a trovare un export,
controlla il sorgente in `src/plugin-sdk/` oppure chiedi su Discord.

## Timeline di rimozione

| Quando                 | Cosa succede                                                         |
| ---------------------- | -------------------------------------------------------------------- |
| **Ora**                | Le superfici deprecate emettono avvisi a runtime                     |
| **Prossima major release** | Le superfici deprecate verranno rimosse; i plugin che le usano ancora smetteranno di funzionare |

Tutti i plugin core sono già stati migrati. I plugin esterni dovrebbero migrare
prima della prossima major release.

## Sopprimere temporaneamente gli avvisi

Imposta queste variabili d'ambiente mentre lavori alla migrazione:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

Questa è una via di fuga temporanea, non una soluzione permanente.

## Correlati

- [Per iniziare](/it/plugins/building-plugins) — crea il tuo primo plugin
- [Panoramica dell'SDK](/it/plugins/sdk-overview) — riferimento completo degli import subpath
- [Plugin di canale](/it/plugins/sdk-channel-plugins) — creazione di plugin di canale
- [Plugin provider](/it/plugins/sdk-provider-plugins) — creazione di plugin provider
- [Interni dei plugin](/it/plugins/architecture) — approfondimento sull'architettura
- [Manifest del plugin](/it/plugins/manifest) — riferimento dello schema del manifest
