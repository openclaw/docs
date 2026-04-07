---
read_when:
    - Vedi l'avviso OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED
    - Vedi l'avviso OPENCLAW_EXTENSION_API_DEPRECATED
    - Stai aggiornando un plugin alla moderna architettura dei plugin
    - Mantieni un plugin OpenClaw esterno
sidebarTitle: Migrate to SDK
summary: Migra dal layer legacy di retrocompatibilità al moderno plugin SDK
title: Migrazione del Plugin SDK
x-i18n:
    generated_at: "2026-04-07T08:16:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3691060e9dc00ca8bee49240a047f0479398691bd14fb96e9204cc9243fdb32c
    source_path: plugins/sdk-migration.md
    workflow: 15
---

# Migrazione del Plugin SDK

OpenClaw è passato da un ampio layer di retrocompatibilità a una moderna
architettura dei plugin con import mirati e documentati. Se il tuo plugin è stato creato prima
della nuova architettura, questa guida ti aiuta a eseguire la migrazione.

## Cosa sta cambiando

Il vecchio sistema di plugin forniva due superfici molto ampie che permettevano ai plugin di importare
qualsiasi cosa servisse da un singolo punto di ingresso:

- **`openclaw/plugin-sdk/compat`** — un singolo import che riesportava dozzine di
  helper. È stato introdotto per mantenere funzionanti i plugin hook-based più vecchi mentre la
  nuova architettura dei plugin veniva costruita.
- **`openclaw/extension-api`** — un bridge che forniva ai plugin accesso diretto a
  helper lato host come l'embedded agent runner.

Entrambe le superfici sono ora **deprecate**. Continuano a funzionare a runtime, ma i nuovi
plugin non devono usarle e i plugin esistenti dovrebbero migrare prima che la prossima major release le rimuova.

<Warning>
  Il layer di retrocompatibilità verrà rimosso in una futura major release.
  I plugin che continuano a importare da queste superfici smetteranno di funzionare quando ciò accadrà.
</Warning>

## Perché è cambiato

Il vecchio approccio causava problemi:

- **Avvio lento** — importare un helper caricava dozzine di moduli non correlati
- **Dipendenze circolari** — le riesportazioni ampie rendevano facile creare cicli di import
- **Superficie API poco chiara** — non c'era modo di capire quali export fossero stabili e quali interni

Il moderno plugin SDK risolve questo problema: ogni percorso di import (`openclaw/plugin-sdk/\<subpath\>`)
è un modulo piccolo e autosufficiente con uno scopo chiaro e un contratto documentato.

Anche le convenience seam legacy dei provider per i canali bundled non esistono più. Import
come `openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`,
`openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp`,
seam helper con branding del canale e
`openclaw/plugin-sdk/telegram-core` erano scorciatoie private del mono-repo, non
contratti stabili del plugin. Usa invece sottopercorsi SDK generici e mirati. All'interno del
workspace dei plugin bundled, mantieni gli helper di proprietà del provider nel `api.ts` o `runtime-api.ts` del plugin stesso.

Esempi attuali di provider bundled:

- Anthropic mantiene gli helper di stream specifici di Claude nella propria seam `api.ts` /
  `contract-api.ts`
- OpenAI mantiene builder dei provider, helper per i modelli predefiniti e builder dei provider realtime
  nel proprio `api.ts`
- OpenRouter mantiene nel proprio `api.ts` i helper di configurazione/onboarding e il builder del provider

## Come eseguire la migrazione

<Steps>
  <Step title="Verifica il comportamento di fallback del wrapper Windows">
    Se il tuo plugin usa `openclaw/plugin-sdk/windows-spawn`, i wrapper Windows
    `.cmd`/`.bat` non risolti ora falliscono in modo chiuso a meno che tu non passi esplicitamente
    `allowShellFallback: true`.

    ```typescript
    // Prima
    const program = applyWindowsSpawnProgramPolicy({ candidate });

    // Dopo
    const program = applyWindowsSpawnProgramPolicy({
      candidate,
      // Imposta questo solo per chiamanti di compatibilità fidati che
      // accettano intenzionalmente il fallback mediato dalla shell.
      allowShellFallback: true,
    });
    ```

    Se il tuo chiamante non dipende intenzionalmente dal fallback della shell, non impostare
    `allowShellFallback` e gestisci invece l'errore generato.

  </Step>

  <Step title="Trova gli import deprecati">
    Cerca nel tuo plugin gli import da una delle due superfici deprecate:

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="Sostituisci con import mirati">
    Ogni export dalla vecchia superficie corrisponde a uno specifico percorso di import moderno:

    ```typescript
    // Prima (layer di retrocompatibilità deprecato)
    import {
      createChannelReplyPipeline,
      createPluginRuntimeStore,
      resolveControlCommandGate,
    } from "openclaw/plugin-sdk/compat";

    // Dopo (import moderni e mirati)
    import { createChannelReplyPipeline } from "openclaw/plugin-sdk/channel-reply-pipeline";
    import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
    import { resolveControlCommandGate } from "openclaw/plugin-sdk/command-auth";
    ```

    Per gli helper lato host, usa il runtime del plugin iniettato invece di importare
    direttamente:

    ```typescript
    // Prima (bridge extension-api deprecato)
    import { runEmbeddedPiAgent } from "openclaw/extension-api";
    const result = await runEmbeddedPiAgent({ sessionId, prompt });

    // Dopo (runtime iniettato)
    const result = await api.runtime.agent.runEmbeddedPiAgent({ sessionId, prompt });
    ```

    Lo stesso pattern si applica ad altri helper bridge legacy:

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

  <Step title="Esegui build e test">
    ```bash
    pnpm build
    pnpm test -- my-plugin/
    ```
  </Step>
</Steps>

## Riferimento dei percorsi di import

<Accordion title="Tabella comune dei percorsi di import">
  | Percorso di import | Scopo | Export chiave |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | Helper canonico per l'entry del plugin | `definePluginEntry` |
  | `plugin-sdk/core` | Riesportazione umbrella legacy per definizioni/builder delle entry dei canali | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Export dello schema di configurazione root | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Helper di entry per singolo provider | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Definizioni e builder mirati per le entry dei canali | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | Helper condivisi per il setup wizard | Prompt allowlist, builder dello stato di setup |
  | `plugin-sdk/setup-runtime` | Helper runtime in fase di setup | Adapter di patch setup sicuri per import, helper per note di lookup, `promptResolvedAllowFrom`, `splitSetupEntries`, proxy di setup delegato |
  | `plugin-sdk/setup-adapter-runtime` | Helper per setup adapter | `createEnvPatchedAccountSetupAdapter` |
  | `plugin-sdk/setup-tools` | Helper per il tooling di setup | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Helper multi-account | Helper per elenco account/config/action-gate |
  | `plugin-sdk/account-id` | Helper per account-id | `DEFAULT_ACCOUNT_ID`, normalizzazione account-id |
  | `plugin-sdk/account-resolution` | Helper di lookup account | Helper di lookup account + default-fallback |
  | `plugin-sdk/account-helpers` | Helper account mirati | Helper per elenco account/account-action |
  | `plugin-sdk/channel-setup` | Adapter per il setup wizard | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, più `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | Primitive per il pairing DM | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Wiring del prefisso di risposta + typing | `createChannelReplyPipeline` |
  | `plugin-sdk/channel-config-helpers` | Factory di adapter di configurazione | `createHybridChannelConfigAdapter` |
  | `plugin-sdk/channel-config-schema` | Builder di schemi di configurazione | Tipi di schema di configurazione del canale |
  | `plugin-sdk/telegram-command-config` | Helper di configurazione dei comandi Telegram | Normalizzazione del nome del comando, trimming della descrizione, validazione di duplicati/conflitti |
  | `plugin-sdk/channel-policy` | Risoluzione delle policy gruppo/DM | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Tracciamento dello stato account | `createAccountStatusSink` |
  | `plugin-sdk/inbound-envelope` | Helper per inbound envelope | Helper condivisi per route + builder envelope |
  | `plugin-sdk/inbound-reply-dispatch` | Helper per le risposte in ingresso | Helper condivisi di record-and-dispatch |
  | `plugin-sdk/messaging-targets` | Parsing dei target di messaggistica | Helper di parsing/matching dei target |
  | `plugin-sdk/outbound-media` | Helper per media in uscita | Caricamento condiviso dei media in uscita |
  | `plugin-sdk/outbound-runtime` | Helper runtime in uscita | Helper di delega outbound identity/send |
  | `plugin-sdk/thread-bindings-runtime` | Helper per thread-binding | Helper per ciclo di vita e adapter dei thread-binding |
  | `plugin-sdk/agent-media-payload` | Helper legacy per media payload | Builder del media payload dell'agente per layout di campi legacy |
  | `plugin-sdk/channel-runtime` | Shim di compatibilità deprecato | Solo utility runtime legacy del canale |
  | `plugin-sdk/channel-send-result` | Tipi del risultato di invio | Tipi del risultato di risposta |
  | `plugin-sdk/runtime-store` | Storage persistente del plugin | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Helper runtime ampi | Helper per runtime/logging/backup/installazione plugin |
  | `plugin-sdk/runtime-env` | Helper mirati per runtime env | Logger/runtime env, helper di timeout, retry e backoff |
  | `plugin-sdk/plugin-runtime` | Helper runtime condivisi per i plugin | Helper plugin per comandi/hook/http/interattivi |
  | `plugin-sdk/hook-runtime` | Helper per la pipeline degli hook | Helper condivisi per pipeline di webhook/hook interni |
  | `plugin-sdk/lazy-runtime` | Helper per lazy runtime | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Helper di processo | Helper condivisi per exec |
  | `plugin-sdk/cli-runtime` | Helper runtime della CLI | Formattazione comandi, attese, helper di versione |
  | `plugin-sdk/gateway-runtime` | Helper del Gateway | Helper per client Gateway e patch di stato dei canali |
  | `plugin-sdk/config-runtime` | Helper di configurazione | Helper per caricamento/scrittura della configurazione |
  | `plugin-sdk/telegram-command-config` | Helper per i comandi Telegram | Helper di validazione dei comandi Telegram stabili in fallback quando la superficie del contratto Telegram bundled non è disponibile |
  | `plugin-sdk/approval-runtime` | Helper per prompt di approvazione | Payload di approvazione exec/plugin, helper per capability/profilo di approvazione, helper runtime/routing di approvazione nativa |
  | `plugin-sdk/approval-auth-runtime` | Helper auth per approvazione | Risoluzione dell'approvatore, auth delle azioni same-chat |
  | `plugin-sdk/approval-client-runtime` | Helper client per approvazione | Helper nativi per profilo/filtro di approvazione exec |
  | `plugin-sdk/approval-delivery-runtime` | Helper di consegna per approvazione | Adapter nativi per capability/consegna di approvazione |
  | `plugin-sdk/approval-native-runtime` | Helper target per approvazione | Helper nativi per target/account binding di approvazione |
  | `plugin-sdk/approval-reply-runtime` | Helper di risposta per approvazione | Helper di payload di risposta per approvazione exec/plugin |
  | `plugin-sdk/security-runtime` | Helper di sicurezza | Helper condivisi per trust, gating DM, contenuti esterni e raccolta dei segreti |
  | `plugin-sdk/ssrf-policy` | Helper di policy SSRF | Helper per allowlist host e policy di rete privata |
  | `plugin-sdk/ssrf-runtime` | Helper runtime SSRF | Dispatcher fissato, fetch protetto, helper di policy SSRF |
  | `plugin-sdk/collection-runtime` | Helper per cache limitata | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Helper per gating diagnostico | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Helper di formattazione errori | `formatUncaughtError`, `isApprovalNotFoundError`, helper del grafo degli errori |
  | `plugin-sdk/fetch-runtime` | Helper per fetch/proxy wrapperizzati | `resolveFetch`, helper proxy |
  | `plugin-sdk/host-runtime` | Helper di normalizzazione host | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Helper di retry | `RetryConfig`, `retryAsync`, esecutori di policy |
  | `plugin-sdk/allow-from` | Formattazione allowlist | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | Mappatura input allowlist | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Gating dei comandi e helper della command surface | `resolveControlCommandGate`, helper di autorizzazione del mittente, helper del registro comandi |
  | `plugin-sdk/secret-input` | Parsing dell'input dei segreti | Helper di input dei segreti |
  | `plugin-sdk/webhook-ingress` | Helper per richieste webhook | Utility per target webhook |
  | `plugin-sdk/webhook-request-guards` | Helper guard per il body webhook | Helper di lettura/limite del body della richiesta |
  | `plugin-sdk/reply-runtime` | Runtime condiviso per le risposte | Dispatch in ingresso, heartbeat, planner di risposta, chunking |
  | `plugin-sdk/reply-dispatch-runtime` | Helper mirati di dispatch delle risposte | Helper di finalize + dispatch del provider |
  | `plugin-sdk/reply-history` | Helper per la reply-history | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | Pianificazione dei riferimenti di risposta | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Helper per i chunk di risposta | Helper di chunking testo/markdown |
  | `plugin-sdk/session-store-runtime` | Helper del session store | Helper per percorso store + updated-at |
  | `plugin-sdk/state-paths` | Helper per i path di stato | Helper per directory di stato e OAuth |
  | `plugin-sdk/routing` | Helper per routing/session-key | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, helper di normalizzazione session-key |
  | `plugin-sdk/status-helpers` | Helper di stato del canale | Builder di riepiloghi dello stato canale/account, default dello stato runtime, helper di metadati dei problemi |
  | `plugin-sdk/target-resolver-runtime` | Helper per target resolver | Helper condivisi per target resolver |
  | `plugin-sdk/string-normalization-runtime` | Helper di normalizzazione stringhe | Helper di normalizzazione slug/stringhe |
  | `plugin-sdk/request-url` | Helper per request URL | Estrae URL stringa da input simili a request |
  | `plugin-sdk/run-command` | Helper per comandi temporizzati | Esecutore di comandi temporizzati con stdout/stderr normalizzati |
  | `plugin-sdk/param-readers` | Lettori di parametri | Lettori di parametri comuni per tool/CLI |
  | `plugin-sdk/tool-send` | Estrazione del tool send | Estrae i campi target di invio canonici dagli argomenti del tool |
  | `plugin-sdk/temp-path` | Helper per percorsi temporanei | Helper condivisi per percorsi di download temporanei |
  | `plugin-sdk/logging-core` | Helper di logging | Logger di sottosistema e helper di redazione |
  | `plugin-sdk/markdown-table-runtime` | Helper per tabelle markdown | Helper per modalità delle tabelle markdown |
  | `plugin-sdk/reply-payload` | Tipi di risposta ai messaggi | Tipi di payload di risposta |
  | `plugin-sdk/provider-setup` | Helper curati per il setup di provider locali/self-hosted | Helper di discovery/configurazione dei provider self-hosted |
  | `plugin-sdk/self-hosted-provider-setup` | Helper mirati per il setup di provider self-hosted compatibili con OpenAI | Gli stessi helper di discovery/configurazione dei provider self-hosted |
  | `plugin-sdk/provider-auth-runtime` | Helper runtime auth del provider | Helper di risoluzione della chiave API a runtime |
  | `plugin-sdk/provider-auth-api-key` | Helper di setup della chiave API del provider | Helper di onboarding/scrittura profilo per chiave API |
  | `plugin-sdk/provider-auth-result` | Helper per auth-result del provider | Builder standard di auth-result OAuth |
  | `plugin-sdk/provider-auth-login` | Helper di login interattivo del provider | Helper condivisi di login interattivo |
  | `plugin-sdk/provider-env-vars` | Helper per env var del provider | Helper di lookup delle env var auth del provider |
  | `plugin-sdk/provider-model-shared` | Helper condivisi per modelli/replay del provider | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, builder condivisi di replay-policy, helper per endpoint del provider e helper di normalizzazione degli ID modello |
  | `plugin-sdk/provider-catalog-shared` | Helper condivisi per il catalogo del provider | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | Patch di onboarding del provider | Helper di configurazione dell'onboarding |
  | `plugin-sdk/provider-http` | Helper HTTP del provider | Helper generici per capability HTTP/endpoint del provider |
  | `plugin-sdk/provider-web-fetch` | Helper web-fetch del provider | Helper di registrazione/cache del provider web-fetch |
  | `plugin-sdk/provider-web-search-contract` | Helper del contratto web-search del provider | Helper mirati per il contratto di configurazione/credenziali del web-search come `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` e setter/getter di credenziali con ambito |
  | `plugin-sdk/provider-web-search` | Helper web-search del provider | Helper di registrazione/cache/runtime del provider web-search |
  | `plugin-sdk/provider-tools` | Helper di compatibilità tool/schema del provider | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, pulizia schema Gemini + diagnostica e helper di compatibilità xAI come `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
  | `plugin-sdk/provider-usage` | Helper di utilizzo del provider | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage` e altri helper di utilizzo del provider |
  | `plugin-sdk/provider-stream` | Helper wrapper di stream del provider | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, tipi dei wrapper di stream e helper condivisi per wrapper Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
  | `plugin-sdk/keyed-async-queue` | Coda asincrona ordinata | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | Helper condivisi per i media | Helper per fetch/transform/store dei media più builder di media payload |
  | `plugin-sdk/media-generation-runtime` | Helper condivisi per la generazione di media | Helper condivisi per failover, selezione dei candidati e messaggi di modello mancante per generazione di immagini/video/musica |
  | `plugin-sdk/media-understanding` | Helper per media-understanding | Tipi di provider per media understanding più export helper lato provider per immagini/audio |
  | `plugin-sdk/text-runtime` | Helper condivisi per il testo | Rimozione del testo visibile all'assistente, helper di render/chunking/tabella markdown, helper di redazione, helper per directive-tag, utility di testo sicuro e helper correlati di testo/logging |
  | `plugin-sdk/text-chunking` | Helper di chunking del testo | Helper di chunking del testo in uscita |
  | `plugin-sdk/speech` | Helper speech | Tipi di provider speech più export helper lato provider per direttive, registro e validazione |
  | `plugin-sdk/speech-core` | Core speech condiviso | Tipi di provider speech, registro, direttive, normalizzazione |
  | `plugin-sdk/realtime-transcription` | Helper per trascrizione realtime | Tipi di provider e helper di registro |
  | `plugin-sdk/realtime-voice` | Helper per voce realtime | Tipi di provider e helper di registro |
  | `plugin-sdk/image-generation-core` | Core condiviso per image-generation | Tipi per image-generation, failover, auth e helper di registro |
  | `plugin-sdk/music-generation` | Helper per music-generation | Tipi di provider/richiesta/risultato per la generazione musicale |
  | `plugin-sdk/music-generation-core` | Core condiviso per music-generation | Tipi per music-generation, helper di failover, lookup del provider e parsing di model-ref |
  | `plugin-sdk/video-generation` | Helper per video-generation | Tipi di provider/richiesta/risultato per la generazione video |
  | `plugin-sdk/video-generation-core` | Core condiviso per video-generation | Tipi per video-generation, helper di failover, lookup del provider e parsing di model-ref |
  | `plugin-sdk/interactive-runtime` | Helper per risposte interattive | Normalizzazione/riduzione del payload delle risposte interattive |
  | `plugin-sdk/channel-config-primitives` | Primitive di configurazione del canale | Primitive mirate di channel config-schema |
  | `plugin-sdk/channel-config-writes` | Helper per scrittura della configurazione del canale | Helper di autorizzazione alla scrittura della configurazione del canale |
  | `plugin-sdk/channel-plugin-common` | Preludio condiviso per i canali | Export condivisi del preludio dei plugin canale |
  | `plugin-sdk/channel-status` | Helper di stato del canale | Helper condivisi per snapshot/riepilogo dello stato del canale |
  | `plugin-sdk/allowlist-config-edit` | Helper di configurazione allowlist | Helper di lettura/modifica della configurazione allowlist |
  | `plugin-sdk/group-access` | Helper per accesso ai gruppi | Helper condivisi per le decisioni di accesso ai gruppi |
  | `plugin-sdk/direct-dm` | Helper per direct-DM | Helper condivisi di auth/guard per direct-DM |
  | `plugin-sdk/extension-shared` | Helper condivisi per estensioni | Primitive helper per stato passive-channel/status e proxy ambient |
  | `plugin-sdk/webhook-targets` | Helper per target webhook | Registro dei target webhook e helper di installazione delle route |
  | `plugin-sdk/webhook-path` | Helper per path webhook | Helper di normalizzazione del path webhook |
  | `plugin-sdk/web-media` | Helper condivisi per web media | Helper di caricamento media remoti/locali |
  | `plugin-sdk/zod` | Riesportazione Zod | Riesportazione di `zod` per i consumer del plugin SDK |
  | `plugin-sdk/memory-core` | Helper bundled per memory-core | Superficie helper per gestore/configurazione/file/CLI della memoria |
  | `plugin-sdk/memory-core-engine-runtime` | Facade runtime del memory engine | Facade runtime per indice/ricerca della memoria |
  | `plugin-sdk/memory-core-host-engine-foundation` | Motore foundation dell'host di memoria | Export del motore foundation dell'host di memoria |
  | `plugin-sdk/memory-core-host-engine-embeddings` | Motore embeddings dell'host di memoria | Export del motore embeddings dell'host di memoria |
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
  | `plugin-sdk/memory-host-core` | Alias runtime core dell'host di memoria | Alias vendor-neutral per helper runtime core dell'host di memoria |
  | `plugin-sdk/memory-host-events` | Alias journal eventi dell'host di memoria | Alias vendor-neutral per helper del journal eventi dell'host di memoria |
  | `plugin-sdk/memory-host-files` | Alias file/runtime dell'host di memoria | Alias vendor-neutral per helper file/runtime dell'host di memoria |
  | `plugin-sdk/memory-host-markdown` | Helper managed markdown | Helper condivisi di managed-markdown per plugin adiacenti alla memoria |
  | `plugin-sdk/memory-host-search` | Facade active memory search | Facade runtime lazy del search-manager della memoria attiva |
  | `plugin-sdk/memory-host-status` | Alias stato dell'host di memoria | Alias vendor-neutral per helper di stato dell'host di memoria |
  | `plugin-sdk/memory-lancedb` | Helper bundled per memory-lancedb | Superficie helper per memory-lancedb |
  | `plugin-sdk/testing` | Utility di test | Helper e mock di test |
</Accordion>

Questa tabella è intenzionalmente il sottoinsieme comune per la migrazione, non l'intera
superficie SDK. L'elenco completo di oltre 200 entrypoint si trova in
`scripts/lib/plugin-sdk-entrypoints.json`.

Quell'elenco include ancora alcune seam helper di bundled-plugin come
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup` e `plugin-sdk/matrix*`. Rimangono esportate per
manutenzione e compatibilità dei bundled-plugin, ma sono intenzionalmente
omesse dalla tabella comune di migrazione e non sono la destinazione consigliata per
il nuovo codice dei plugin.

La stessa regola si applica ad altre famiglie di bundled-helper come:

- helper di supporto browser: `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support`
- Matrix: `plugin-sdk/matrix*`
- LINE: `plugin-sdk/line*`
- IRC: `plugin-sdk/irc*`
- superfici helper/plugin bundled come `plugin-sdk/googlechat`,
  `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles*`,
  `plugin-sdk/mattermost*`, `plugin-sdk/msteams`,
  `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`,
  `plugin-sdk/twitch`,
  `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`,
  `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`,
  `plugin-sdk/thread-ownership` e `plugin-sdk/voice-call`

`plugin-sdk/github-copilot-token` espone attualmente la ristretta
superficie helper per i token `DEFAULT_COPILOT_API_BASE_URL`,
`deriveCopilotApiBaseUrlFromToken` e `resolveCopilotApiToken`.

Usa l'import più mirato che corrisponde al compito. Se non riesci a trovare un export,
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
- [Panoramica dell'SDK](/it/plugins/sdk-overview) — riferimento completo degli import per sottopercorso
- [Plugin canale](/it/plugins/sdk-channel-plugins) — creare plugin canale
- [Plugin provider](/it/plugins/sdk-provider-plugins) — creare plugin provider
- [Interni dei plugin](/it/plugins/architecture) — approfondimento sull'architettura
- [Manifest del plugin](/it/plugins/manifest) — riferimento allo schema del manifest
